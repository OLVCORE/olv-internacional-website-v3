// blog-db-neon.js - Gerenciamento de banco de dados Neon (compatível com Vercel Postgres também)
let sql = null;
let hasPostgres = false;

// Detectar qual driver usar (Neon ou Vercel Postgres)
const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL_NON_POOLING;

if (databaseUrl) {
    hasPostgres = true;
    
    // Tentar usar Neon primeiro (mais comum no Vercel agora)
    if (databaseUrl.includes('neon.tech') || databaseUrl.includes('neon')) {
        try {
            const { neon } = require('@neondatabase/serverless');
            sql = neon(databaseUrl);
            console.log('✅ Usando driver Neon');
        } catch (error) {
            console.warn('⚠️ Driver Neon não disponível, tentando Vercel Postgres:', error.message);
            try {
                const vercelPostgres = require('@vercel/postgres');
                sql = vercelPostgres.sql;
                console.log('✅ Usando driver Vercel Postgres');
            } catch (vercelError) {
                console.error('❌ Nenhum driver disponível');
            }
        }
    } else {
        // Tentar Vercel Postgres
        try {
            const vercelPostgres = require('@vercel/postgres');
            sql = vercelPostgres.sql;
            console.log('✅ Usando driver Vercel Postgres');
        } catch (error) {
            console.warn('⚠️ Driver Vercel Postgres não disponível, tentando Neon:', error.message);
            try {
                const { neon } = require('@neondatabase/serverless');
                sql = neon(databaseUrl);
                console.log('✅ Usando driver Neon');
            } catch (neonError) {
                console.error('❌ Nenhum driver disponível');
            }
        }
    }
}

// Função helper para executar queries (compatível com ambos)
async function executeQuery(query, params = []) {
    if (!sql) {
        throw new Error('Banco de dados não configurado');
    }

    // Detectar se é Neon (função) ou Vercel Postgres (tagged template)
    const isNeon = typeof sql === 'function' && !sql.unsafe;
    
    if (isNeon) {
        // Neon: usar sql template tag ou função direta
        try {
            // Tentar usar template tag do Neon (se disponível)
            if (sql.unsafe) {
                // Usar unsafe para queries dinâmicas
                if (params && params.length > 0) {
                    // Substituir parâmetros manualmente (apenas para queries simples)
                    let queryStr = query;
                    params.forEach((param, index) => {
                        const placeholder = `$${index + 1}`;
                        const value = typeof param === 'string' 
                            ? `'${param.replace(/'/g, "''")}'` 
                            : (param === null ? 'NULL' : param);
                        queryStr = queryStr.replace(placeholder, value);
                    });
                    return await sql(queryStr);
                } else {
                    return await sql(query);
                }
            } else {
                // Usar função direta do Neon
                if (params && params.length > 0) {
                    // Neon aceita array de parâmetros como segundo argumento
                    return await sql(query, params);
                } else {
                    return await sql(query);
                }
            }
        } catch (error) {
            console.error('Erro ao executar query Neon:', error);
            throw error;
        }
    } else {
        // Vercel Postgres usa tagged template
        // Converter query string para template tag
        if (params && params.length > 0) {
            // Criar template tag dinâmico
            const template = query.replace(/\$\d+/g, (match) => {
                const index = parseInt(match.substring(1)) - 1;
                return params[index] !== undefined ? params[index] : match;
            });
            return await sql.unsafe(template);
        } else {
            return await sql.unsafe(query);
        }
    }
}

// Inicializar tabela de posts
async function initDatabase() {
    if (!hasPostgres || !sql) {
        console.log('⚠️ Vercel Postgres/Neon não configurado. Usando armazenamento em arquivo.');
        return false;
    }

    try {
        // Criar tabela se não existir
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS blog_posts (
                id VARCHAR(255) PRIMARY KEY,
                title TEXT NOT NULL,
                excerpt TEXT,
                content TEXT NOT NULL,
                category VARCHAR(50) NOT NULL,
                date_published TIMESTAMP NOT NULL,
                date_modified TIMESTAMP NOT NULL,
                icon VARCHAR(100),
                read_time INTEGER DEFAULT 5,
                source VARCHAR(50),
                data_source JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        await executeQuery(createTableQuery);

        // Criar índices para melhor performance
        const indexes = [
            `CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category)`,
            `CREATE INDEX IF NOT EXISTS idx_blog_posts_date_published ON blog_posts(date_published DESC)`,
            `CREATE INDEX IF NOT EXISTS idx_blog_posts_source ON blog_posts(source)`
        ];

        for (const indexQuery of indexes) {
            try {
                await executeQuery(indexQuery);
            } catch (error) {
                // Índice pode já existir, ignorar erro
                console.warn('Aviso ao criar índice:', error.message);
            }
        }

        console.log('✅ Tabela blog_posts criada/verificada com sucesso');
        return true;
    } catch (error) {
        console.error('❌ Erro ao inicializar banco de dados:', error);
        return false;
    }
}

// Salvar artigo no banco
async function saveArticleToDB(article) {
    if (!hasPostgres || !sql) {
        console.log('⚠️ Banco não disponível para saveArticleToDB');
        return null;
    }

    try {
        // Garantir que colunas existem
        try {
            await executeQuery(`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS image TEXT`);
            await executeQuery(`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS source_published_date TIMESTAMP`);
        } catch (e) {
            // Ignorar se já existir
        }
        const now = new Date().toISOString();
        // Garantir que dataSource seja um objeto válido antes de stringify
        let dataSourceObj = {};
        if (article.dataSource) {
            if (typeof article.dataSource === 'object') {
                dataSourceObj = article.dataSource;
            } else if (typeof article.dataSource === 'string') {
                try {
                    dataSourceObj = JSON.parse(article.dataSource);
                if (!dataSourceObj || typeof dataSourceObj !== 'object') {
                    dataSourceObj = {};
                }
                } catch (e) {
                    dataSourceObj = {};
                }
            }
        }
        const dataSourceJson = JSON.stringify(dataSourceObj);
        
        // Escapar strings para SQL seguro
        const escapeString = (str) => {
            if (str === null || str === undefined) return 'NULL';
            const strValue = String(str);
            // Escapar aspas simples e barras
            return `'${strValue.replace(/'/g, "''").replace(/\\/g, "\\\\")}'`;
        };
        
        const isNeon = typeof sql === 'function' && !sql.unsafe;
        
        if (isNeon) {
            // Neon: usar query direta com valores escapados
            const query = `
                INSERT INTO blog_posts (
                    id, title, excerpt, content, category,
                    date_published, date_modified, source_published_date, icon, read_time, source, data_source, image, updated_at
                )
                VALUES (
                    ${escapeString(article.id)},
                    ${escapeString(article.title)},
                    ${escapeString(article.excerpt || '')},
                    ${escapeString(article.content)},
                    ${escapeString(article.category)},
                    ${escapeString(article.datePublished)},
                    ${escapeString(article.dateModified || article.datePublished)},
                    ${article.sourcePublishedDate ? escapeString(article.sourcePublishedDate) : 'NULL'},
                    ${escapeString(article.icon || 'fas fa-chart-line')},
                    ${article.readTime || 5},
                    ${escapeString(article.source || '')},
                    ${escapeString(dataSourceJson)},
                    ${escapeString(article.image || null)},
                    ${escapeString(now)}
                )
                ON CONFLICT (id) 
                DO UPDATE SET
                    title = EXCLUDED.title,
                    excerpt = EXCLUDED.excerpt,
                    content = EXCLUDED.content,
                    category = EXCLUDED.category,
                    date_modified = EXCLUDED.date_modified,
                    source_published_date = EXCLUDED.source_published_date,
                    icon = EXCLUDED.icon,
                    read_time = EXCLUDED.read_time,
                    source = EXCLUDED.source,
                    data_source = EXCLUDED.data_source,
                    image = EXCLUDED.image,
                    updated_at = EXCLUDED.updated_at
            `;
            await sql(query);
        } else {
            // Vercel Postgres: usar template tag
            await sql`
                INSERT INTO blog_posts (
                    id, title, excerpt, content, category,
                    date_published, date_modified, source_published_date, icon, read_time, source, data_source, image, updated_at
                )
                VALUES (
                    ${article.id},
                    ${article.title},
                    ${article.excerpt || ''},
                    ${article.content},
                    ${article.category},
                    ${article.datePublished},
                    ${article.dateModified || article.datePublished},
                    ${article.sourcePublishedDate || null},
                    ${article.icon || 'fas fa-chart-line'},
                    ${article.readTime || 5},
                    ${article.source || ''},
                    ${dataSourceJson},
                    ${article.image || null},
                    ${now}
                )
                ON CONFLICT (id) 
                DO UPDATE SET
                    title = EXCLUDED.title,
                    excerpt = EXCLUDED.excerpt,
                    content = EXCLUDED.content,
                    category = EXCLUDED.category,
                    date_modified = EXCLUDED.date_modified,
                    source_published_date = EXCLUDED.source_published_date,
                    icon = EXCLUDED.icon,
                    read_time = EXCLUDED.read_time,
                    source = EXCLUDED.source,
                    data_source = EXCLUDED.data_source,
                    image = EXCLUDED.image,
                    updated_at = EXCLUDED.updated_at
            `;
        }

        console.log(`✅ Artigo salvo no banco: ${article.id}`);
        return article;
    } catch (error) {
        console.error('❌ Erro ao salvar artigo no banco:', error);
        console.error('Stack:', error.stack);
        throw error;
    }
}

// Carregar todos os posts do banco
async function loadPostsFromDB(limit = 100) {
    if (!hasPostgres || !sql) {
        console.log('⚠️ Banco não disponível para loadPostsFromDB');
        return null;
    }

    try {
        // Neon aceita parâmetros diretamente
        const isNeon = typeof sql === 'function' && !sql.unsafe;
        
        let result;
        if (isNeon) {
            // Neon: usar query direta com parâmetros
            // Filtrar data_source corrompido (HTML) na query
            // Verificar se coluna image existe antes de usar
            // Tentar adicionar colunas se não existirem
            try {
                await executeQuery(`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS image TEXT`);
                await executeQuery(`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS source_published_date TIMESTAMP`);
            } catch (e) {
                // Ignorar se já existir ou erro
            }
            
            const query = `
                SELECT 
                    id, title, excerpt, content, category,
                    date_published, date_modified, source_published_date, icon, read_time, source,
                    CASE 
                        WHEN data_source::text LIKE '<%' OR data_source::text LIKE '<!%' 
                        THEN '{}'::jsonb
                        ELSE data_source
                    END as data_source,
                    COALESCE(image, NULL) as image
                FROM blog_posts
                ORDER BY date_published DESC
                LIMIT ${limit}
            `;
            result = await sql(query);
        } else {
            // Vercel Postgres: usar template tag
            // Tentar adicionar colunas se não existirem (Vercel Postgres)
            try {
                await sql`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS image TEXT`;
                await sql`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS source_published_date TIMESTAMP`;
            } catch (e) {
                // Ignorar se já existir ou erro
            }
            
            result = await sql`
                SELECT 
                    id, title, excerpt, content, category,
                    date_published, date_modified, source_published_date, icon, read_time, source, data_source,
                    COALESCE(image, NULL) as image
                FROM blog_posts
                ORDER BY date_published DESC
                LIMIT ${limit}
            `;
        }

        // Converter para formato esperado
        const rows = Array.isArray(result) ? result : (result.rows || []);
        
        console.log(`✅ Carregados ${rows.length} posts do banco`);
        
        return rows.map(row => {
            // Tratar data_source com segurança
            let dataSource = {};
            if (row.data_source) {
                if (typeof row.data_source === 'string') {
                    // Verificar se é JSON válido (não HTML)
                    if (row.data_source.trim().startsWith('{') || row.data_source.trim().startsWith('[')) {
                        try {
                            dataSource = JSON.parse(row.data_source);
                        } catch (parseError) {
                            console.warn('⚠️ Erro ao fazer parse de data_source:', parseError.message);
                            dataSource = {};
                        }
                    } else {
                        // Se começa com <, provavelmente é HTML (erro)
                        console.warn('⚠️ data_source parece ser HTML, ignorando');
                        dataSource = {};
                    }
                } else if (typeof row.data_source === 'object') {
                    dataSource = row.data_source;
                }
            }

            return {
                id: row.id,
                title: row.title,
                excerpt: row.excerpt,
                content: row.content,
                category: row.category,
                datePublished: row.date_published ? new Date(row.date_published).toISOString() : new Date().toISOString(),
                dateModified: row.date_modified ? new Date(row.date_modified).toISOString() : new Date().toISOString(),
                sourcePublishedDate: row.source_published_date ? new Date(row.source_published_date).toISOString() : null,
                icon: row.icon,
                readTime: row.read_time,
                source: row.source,
                dataSource: dataSource,
                image: row.image || null
            };
        });
    } catch (error) {
        console.error('❌ Erro ao carregar posts do banco:', error);
        console.error('Stack:', error.stack);
        return null;
    }
}

// Carregar post específico do banco
async function loadPostFromDB(postId) {
    if (!hasPostgres || !sql) {
        return null;
    }

    try {
        // Tentar adicionar colunas se não existirem
        try {
            await executeQuery(`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS image TEXT`);
            await executeQuery(`ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS source_published_date TIMESTAMP`);
        } catch (e) {
            // Ignorar se já existir ou erro
        }
        
        const query = `
            SELECT 
                id, title, excerpt, content, category,
                date_published, date_modified, source_published_date, icon, read_time, source, data_source,
                COALESCE(image, NULL) as image
            FROM blog_posts
            WHERE id = $1
            LIMIT 1
        `;

        const result = await executeQuery(query, [postId]);
        const rows = Array.isArray(result) ? result : (result.rows || []);

        if (rows.length === 0) {
            return null;
        }

        const row = rows[0];
        
        // Tratar data_source com segurança
        let dataSource = {};
        if (row.data_source) {
            if (typeof row.data_source === 'string') {
                // Verificar se é JSON válido (não HTML)
                if (row.data_source.trim().startsWith('{') || row.data_source.trim().startsWith('[')) {
                    try {
                        dataSource = JSON.parse(row.data_source);
                    } catch (parseError) {
                        console.warn('⚠️ Erro ao fazer parse de data_source:', parseError.message);
                        dataSource = {};
                    }
                } else {
                    console.warn('⚠️ data_source parece ser HTML, ignorando');
                    dataSource = {};
                }
            } else if (typeof row.data_source === 'object') {
                dataSource = row.data_source;
            }
        }

        return {
            id: row.id,
            title: row.title,
            excerpt: row.excerpt,
            content: row.content,
            category: row.category,
            datePublished: row.date_published ? new Date(row.date_published).toISOString() : new Date().toISOString(),
            dateModified: row.date_modified ? new Date(row.date_modified).toISOString() : new Date().toISOString(),
            icon: row.icon,
            readTime: row.read_time,
            source: row.source,
            dataSource: dataSource
        };
    } catch (error) {
        console.error('❌ Erro ao carregar post do banco:', error);
        return null;
    }
}

// Deletar posts antigos (manter apenas os últimos N)
async function cleanupOldPosts(keepCount = 100) {
    if (!hasPostgres || !sql) {
        return;
    }

    try {
        const isNeon = typeof sql === 'function' && !sql.unsafe;
        
        if (isNeon) {
            // Neon: usar query direta
            const query = `
                DELETE FROM blog_posts
                WHERE id NOT IN (
                    SELECT id FROM blog_posts
                    ORDER BY date_published DESC
                    LIMIT ${keepCount}
                )
            `;
            await sql(query);
        } else {
            // Vercel Postgres: usar template tag
            await sql`
                DELETE FROM blog_posts
                WHERE id NOT IN (
                    SELECT id FROM blog_posts
                    ORDER BY date_published DESC
                    LIMIT ${keepCount}
                )
            `;
        }
        
        console.log(`✅ Limpeza de posts antigos concluída. Mantidos ${keepCount} posts.`);
    } catch (error) {
        console.error('❌ Erro ao limpar posts antigos:', error);
    }
}

// Deletar posts muito antigos (mais de X dias)
async function cleanupOldPostsByDate(daysOld = 90) {
    if (!hasPostgres || !sql) {
        return;
    }

    try {
        const isNeon = typeof sql === 'function' && !sql.unsafe;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        const cutoffISO = cutoffDate.toISOString();
        
        if (isNeon) {
            const query = `
                DELETE FROM blog_posts
                WHERE date_published < '${cutoffISO}'
            `;
            await sql(query);
        } else {
            await sql`
                DELETE FROM blog_posts
                WHERE date_published < ${cutoffISO}
            `;
        }
        
        console.log(`✅ Limpeza de posts com mais de ${daysOld} dias concluída.`);
    } catch (error) {
        console.error('❌ Erro ao limpar posts antigos por data:', error);
    }
}

module.exports = {
    hasPostgres,
    initDatabase,
    saveArticleToDB,
    loadPostsFromDB,
    loadPostFromDB,
    cleanupOldPosts,
    cleanupOldPostsByDate
};
