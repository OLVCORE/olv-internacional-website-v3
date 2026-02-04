// blog-db-neon.js - Gerenciamento de banco de dados Neon (compatível com Vercel Postgres também)
let sql = null;
let hasPostgres = false;

// Detectar qual driver usar (Neon ou Vercel Postgres)
const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL_NON_POOLING;

console.log('🔍 Verificando configuração do banco...');
console.log('   DATABASE_URL:', process.env.DATABASE_URL ? '✅ Definido' : '❌ Não definido');
console.log('   POSTGRES_URL:', process.env.POSTGRES_URL ? '✅ Definido' : '❌ Não definido');
console.log('   databaseUrl encontrado:', databaseUrl ? '✅ Sim' : '❌ Não');

if (databaseUrl) {
    hasPostgres = true;
    console.log('✅ Banco de dados configurado, tentando conectar...');
    
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

// Lazy-init: no Vercel o módulo pode ter sido carregado sem env; ao rodar initDatabase, re-tentar conectar
function ensureConnection() {
    if (hasPostgres && sql) return true;
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL_NON_POOLING;
    if (!url) return false;
    try {
        if (url.includes('neon.tech') || url.includes('neon')) {
            const { neon } = require('@neondatabase/serverless');
            sql = neon(url);
            hasPostgres = true;
            console.log('✅ Neon conectado (lazy-init)');
            return true;
        }
        const vercelPostgres = require('@vercel/postgres');
        sql = vercelPostgres.sql;
        hasPostgres = true;
        console.log('✅ Vercel Postgres conectado (lazy-init)');
        return true;
    } catch (e) {
        console.warn('⚠️ Lazy-init falhou:', e.message);
        return false;
    }
}

// Inicializar tabela de posts
async function initDatabase() {
    ensureConnection();
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
                source_published_date TIMESTAMP,
                icon VARCHAR(100),
                read_time INTEGER DEFAULT 5,
                source VARCHAR(50),
                data_source JSONB,
                image TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        await executeQuery(createTableQuery);

        // Adicionar colunas se não existirem (para tabelas antigas)
        const columnsToAdd = [
            { name: 'image', type: 'TEXT' },
            { name: 'source_published_date', type: 'TIMESTAMP' }
        ];
        
        for (const col of columnsToAdd) {
            try {
                // Verificar se coluna existe
                const checkQuery = `
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'blog_posts' AND column_name = '${col.name}'
                `;
                const checkResult = await executeQuery(checkQuery);
                const hasColumn = Array.isArray(checkResult) ? checkResult.length > 0 : (checkResult.rows?.length > 0);
                
                if (!hasColumn) {
                    await executeQuery(`ALTER TABLE blog_posts ADD COLUMN ${col.name} ${col.type}`);
                    console.log(`✅ Coluna ${col.name} adicionada com sucesso`);
                } else {
                    console.log(`✅ Coluna ${col.name} já existe`);
                }
            } catch (error) {
                // Tentar adicionar mesmo assim (pode ser erro de sintaxe do check)
                try {
                    await executeQuery(`ALTER TABLE blog_posts ADD COLUMN ${col.name} ${col.type}`);
                    console.log(`✅ Coluna ${col.name} adicionada (fallback)`);
                } catch (e2) {
                    // Coluna pode já existir, ignorar
                    console.warn(`⚠️ Aviso ao adicionar coluna ${col.name}:`, e2.message);
                }
            }
        }

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
        ensureConnection();
        if (!hasPostgres || !sql) {
            console.log('⚠️ Banco não disponível para saveArticleToDB');
            return null;
        }
    }

    try {
        // Garantir que colunas existem ANTES de salvar
        try {
            // Verificar se coluna image existe
            const checkImageQuery = `
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'blog_posts' AND column_name = 'image'
            `;
            const checkImageResult = await executeQuery(checkImageQuery);
            const hasImageColumn = Array.isArray(checkImageResult) ? checkImageResult.length > 0 : (checkImageResult.rows?.length > 0);
            
            if (!hasImageColumn) {
                await executeQuery(`ALTER TABLE blog_posts ADD COLUMN image TEXT`);
                console.log('✅ Coluna image adicionada em saveArticleToDB');
            }
            
            // Verificar se coluna source_published_date existe
            const checkSourceDateQuery = `
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'blog_posts' AND column_name = 'source_published_date'
            `;
            const checkSourceDateResult = await executeQuery(checkSourceDateQuery);
            const hasSourceDateColumn = Array.isArray(checkSourceDateResult) ? checkSourceDateResult.length > 0 : (checkSourceDateResult.rows?.length > 0);
            
            if (!hasSourceDateColumn) {
                await executeQuery(`ALTER TABLE blog_posts ADD COLUMN source_published_date TIMESTAMP`);
                console.log('✅ Coluna source_published_date adicionada em saveArticleToDB');
            }
            // Coluna olv_analysis (análise Perplexity no contexto OLV)
            const checkOlvQuery = `
                SELECT column_name FROM information_schema.columns
                WHERE table_name = 'blog_posts' AND column_name = 'olv_analysis'
            `;
            const checkOlvResult = await executeQuery(checkOlvQuery);
            const hasOlvColumn = Array.isArray(checkOlvResult) ? checkOlvResult.length > 0 : (checkOlvResult.rows?.length > 0);
            if (!hasOlvColumn) {
                await executeQuery(`ALTER TABLE blog_posts ADD COLUMN olv_analysis TEXT`);
                console.log('✅ Coluna olv_analysis adicionada em saveArticleToDB');
            }
        } catch (e) {
            console.error('⚠️ Erro ao verificar/adicionar colunas em saveArticleToDB:', e.message);
            try {
                await executeQuery(`ALTER TABLE blog_posts ADD COLUMN image TEXT`);
            } catch (e2) {}
            try {
                await executeQuery(`ALTER TABLE blog_posts ADD COLUMN source_published_date TIMESTAMP`);
            } catch (e3) {}
            try {
                await executeQuery(`ALTER TABLE blog_posts ADD COLUMN olv_analysis TEXT`);
            } catch (e4) {}
        }
        const now = new Date().toISOString();
        // Garantir que data_source seja JSON válido (evitar "invalid input syntax for type json")
        let dataSourceObj = {};
        if (article.dataSource) {
            if (typeof article.dataSource === 'object') {
                const raw = article.dataSource;
                dataSourceObj = {
                    link: typeof raw.link === 'string' ? raw.link : (raw.url || null),
                    title: typeof raw.title === 'string' ? raw.title : null,
                    pubDate: raw.pubDate || raw.isoDate || raw['dc:date'] || null
                };
            } else if (typeof article.dataSource === 'string') {
                try {
                    const parsed = JSON.parse(article.dataSource);
                    if (parsed && typeof parsed === 'object') {
                        dataSourceObj = {
                            link: typeof parsed.link === 'string' ? parsed.link : (parsed.url || null),
                            title: typeof parsed.title === 'string' ? parsed.title : null,
                            pubDate: parsed.pubDate || parsed.isoDate || null
                        };
                    }
                } catch (e) {
                    dataSourceObj = {};
                }
            }
        }
        let dataSourceJson;
        try {
            dataSourceJson = JSON.stringify(dataSourceObj);
            if (typeof dataSourceJson !== 'string' || dataSourceJson.length > 50000) {
                dataSourceJson = '{}';
            }
            dataSourceJson = dataSourceJson.replace(/[\x00-\x1f]/g, ' ');
        } catch (e) {
            dataSourceJson = '{}';
        }
        
        // Escapar strings para SQL seguro
        const escapeString = (str) => {
            if (str === null || str === undefined) return 'NULL';
            const strValue = String(str);
            // Escapar aspas simples e barras
            return `'${strValue.replace(/'/g, "''").replace(/\\/g, "\\\\")}'`;
        };
        
        const isNeon = typeof sql === 'function' && !sql.unsafe;
        const readTime = Math.min(120, Math.max(1, parseInt(article.readTime, 10) || 5));
        
        if (isNeon) {
            // Neon: usar query direta com valores escapados
            const olvAnalysis = (article.olvAnalysis && typeof article.olvAnalysis === 'string') ? article.olvAnalysis : null;
            const query = `
                INSERT INTO blog_posts (
                    id, title, excerpt, content, category,
                    date_published, date_modified, source_published_date, icon, read_time, source, data_source, image, olv_analysis, updated_at
                )
                VALUES (
                    ${escapeString(article.id)},
                    ${escapeString(article.title)},
                    ${escapeString(article.excerpt || '')},
                    ${escapeString((article.content || '').substring(0, 500000))},
                    ${escapeString(article.category)},
                    ${escapeString(article.datePublished)},
                    ${escapeString(article.dateModified || article.datePublished)},
                    ${article.sourcePublishedDate ? escapeString(article.sourcePublishedDate) : 'NULL'},
                    ${escapeString(article.icon || 'fas fa-chart-line')},
                    ${readTime},
                    ${escapeString(article.source || '')},
                    ${escapeString(dataSourceJson)},
                    ${article.image != null && article.image !== '' ? escapeString(article.image) : 'NULL'},
                    ${olvAnalysis !== null ? escapeString(olvAnalysis) : 'NULL'},
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
                    olv_analysis = EXCLUDED.olv_analysis,
                    updated_at = EXCLUDED.updated_at
            `;
            await sql(query);
        } else {
            // Vercel Postgres: usar template tag
            const olvAnalysis = (article.olvAnalysis && typeof article.olvAnalysis === 'string') ? article.olvAnalysis : null;
            const contentSafe = (article.content || '').substring(0, 500000);
            await sql`
                INSERT INTO blog_posts (
                    id, title, excerpt, content, category,
                    date_published, date_modified, source_published_date, icon, read_time, source, data_source, image, olv_analysis, updated_at
                )
                VALUES (
                    ${article.id},
                    ${article.title},
                    ${article.excerpt || ''},
                    ${contentSafe},
                    ${article.category},
                    ${article.datePublished},
                    ${article.dateModified || article.datePublished},
                    ${article.sourcePublishedDate || null},
                    ${article.icon || 'fas fa-chart-line'},
                    ${article.readTime || 5},
                    ${article.source || ''},
                    ${dataSourceJson},
                    ${article.image || null},
                    ${olvAnalysis},
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
                    olv_analysis = EXCLUDED.olv_analysis,
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
async function loadPostsFromDB(limit = 500) {
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
            // Garantir que colunas existem ANTES de fazer SELECT
            try {
                // Verificar e adicionar coluna image
                const checkImageQuery = `
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'blog_posts' AND column_name = 'image'
                `;
                const checkImageResult = await executeQuery(checkImageQuery);
                const hasImageColumn = Array.isArray(checkImageResult) ? checkImageResult.length > 0 : (checkImageResult.rows?.length > 0);
                
                if (!hasImageColumn) {
                    await executeQuery(`ALTER TABLE blog_posts ADD COLUMN image TEXT`);
                    console.log('✅ Coluna image adicionada em loadPostsFromDB');
                }
                
                // Verificar e adicionar coluna source_published_date
                const checkSourceDateQuery = `
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'blog_posts' AND column_name = 'source_published_date'
                `;
                const checkSourceDateResult = await executeQuery(checkSourceDateQuery);
                const hasSourceDateColumn = Array.isArray(checkSourceDateResult) ? checkSourceDateResult.length > 0 : (checkSourceDateResult.rows?.length > 0);
                
                if (!hasSourceDateColumn) {
                    await executeQuery(`ALTER TABLE blog_posts ADD COLUMN source_published_date TIMESTAMP`);
                    console.log('✅ Coluna source_published_date adicionada em loadPostsFromDB');
                }
                const checkOlvQuery = `
                    SELECT column_name FROM information_schema.columns
                    WHERE table_name = 'blog_posts' AND column_name = 'olv_analysis'
                `;
                const checkOlvResult = await executeQuery(checkOlvQuery);
                const hasOlvColumn = Array.isArray(checkOlvResult) ? checkOlvResult.length > 0 : (checkOlvResult.rows?.length > 0);
                if (!hasOlvColumn) {
                    await executeQuery(`ALTER TABLE blog_posts ADD COLUMN olv_analysis TEXT`);
                    console.log('✅ Coluna olv_analysis adicionada em loadPostsFromDB');
                }
            } catch (e) {
                console.error('⚠️ Erro ao verificar/adicionar colunas:', e.message);
                try {
                    await executeQuery(`ALTER TABLE blog_posts ADD COLUMN image TEXT`);
                } catch (e2) {}
                try {
                    await executeQuery(`ALTER TABLE blog_posts ADD COLUMN source_published_date TIMESTAMP`);
                } catch (e3) {}
                try {
                    await executeQuery(`ALTER TABLE blog_posts ADD COLUMN olv_analysis TEXT`);
                } catch (e4) {}
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
                    COALESCE(image, NULL) as image,
                    olv_analysis
                FROM blog_posts
                ORDER BY date_published DESC
                LIMIT ${limit}
            `;
            result = await sql(query);
        } else {
            // Vercel Postgres: usar template tag
            // Garantir que colunas existem ANTES de fazer SELECT (Vercel Postgres)
            try {
                // Verificar se coluna image existe
                const checkImage = await sql`
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'blog_posts' AND column_name = 'image'
                `;
                if (!checkImage || checkImage.length === 0) {
                    await sql`ALTER TABLE blog_posts ADD COLUMN image TEXT`;
                    console.log('✅ Coluna image adicionada em loadPostsFromDB (Vercel)');
                }
                
                // Verificar se coluna source_published_date existe
                const checkSourceDate = await sql`
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'blog_posts' AND column_name = 'source_published_date'
                `;
                if (!checkSourceDate || checkSourceDate.length === 0) {
                    await sql`ALTER TABLE blog_posts ADD COLUMN source_published_date TIMESTAMP`;
                    console.log('✅ Coluna source_published_date adicionada em loadPostsFromDB (Vercel)');
                }
                const checkOlv = await sql`
                    SELECT column_name FROM information_schema.columns
                    WHERE table_name = 'blog_posts' AND column_name = 'olv_analysis'
                `;
                if (!checkOlv || checkOlv.length === 0) {
                    await sql`ALTER TABLE blog_posts ADD COLUMN olv_analysis TEXT`;
                    console.log('✅ Coluna olv_analysis adicionada em loadPostsFromDB (Vercel)');
                }
            } catch (e) {
                console.error('⚠️ Erro ao verificar/adicionar colunas (Vercel):', e.message);
                try {
                    await sql`ALTER TABLE blog_posts ADD COLUMN image TEXT`;
                } catch (e2) {}
                try {
                    await sql`ALTER TABLE blog_posts ADD COLUMN source_published_date TIMESTAMP`;
                } catch (e3) {}
                try {
                    await sql`ALTER TABLE blog_posts ADD COLUMN olv_analysis TEXT`;
                } catch (e4) {}
            }
            
            result = await sql`
                SELECT 
                    id, title, excerpt, content, category,
                    date_published, date_modified, source_published_date, icon, read_time, source, data_source,
                    COALESCE(image, NULL) as image,
                    olv_analysis
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
                image: row.image || null,
                olvAnalysis: row.olv_analysis || null
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
        // Garantir que colunas existem ANTES de fazer SELECT
        try {
            // Verificar se coluna image existe
            const checkImageQuery = `
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'blog_posts' AND column_name = 'image'
            `;
            const checkImageResult = await executeQuery(checkImageQuery);
            const hasImageColumn = Array.isArray(checkImageResult) ? checkImageResult.length > 0 : (checkImageResult.rows?.length > 0);
            
            if (!hasImageColumn) {
                await executeQuery(`ALTER TABLE blog_posts ADD COLUMN image TEXT`);
                console.log('✅ Coluna image adicionada em loadPostFromDB');
            }
            
            // Verificar se coluna source_published_date existe
            const checkSourceDateQuery = `
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'blog_posts' AND column_name = 'source_published_date'
            `;
            const checkSourceDateResult = await executeQuery(checkSourceDateQuery);
            const hasSourceDateColumn = Array.isArray(checkSourceDateResult) ? checkSourceDateResult.length > 0 : (checkSourceDateResult.rows?.length > 0);
            
            if (!hasSourceDateColumn) {
                await executeQuery(`ALTER TABLE blog_posts ADD COLUMN source_published_date TIMESTAMP`);
                console.log('✅ Coluna source_published_date adicionada em loadPostFromDB');
            }
            const checkOlvQuery = `
                SELECT column_name FROM information_schema.columns
                WHERE table_name = 'blog_posts' AND column_name = 'olv_analysis'
            `;
            const checkOlvResult = await executeQuery(checkOlvQuery);
            const hasOlvColumn = Array.isArray(checkOlvResult) ? checkOlvResult.length > 0 : (checkOlvResult.rows?.length > 0);
            if (!hasOlvColumn) {
                await executeQuery(`ALTER TABLE blog_posts ADD COLUMN olv_analysis TEXT`);
                console.log('✅ Coluna olv_analysis adicionada em loadPostFromDB');
            }
        } catch (e) {
            console.error('⚠️ Erro ao verificar/adicionar colunas em loadPostFromDB:', e.message);
            try {
                await executeQuery(`ALTER TABLE blog_posts ADD COLUMN image TEXT`);
            } catch (e2) {}
            try {
                await executeQuery(`ALTER TABLE blog_posts ADD COLUMN source_published_date TIMESTAMP`);
            } catch (e3) {}
            try {
                await executeQuery(`ALTER TABLE blog_posts ADD COLUMN olv_analysis TEXT`);
            } catch (e4) {}
        }
        
        const query = `
            SELECT 
                id, title, excerpt, content, category,
                date_published, date_modified, source_published_date, icon, read_time, source, data_source,
                COALESCE(image, NULL) as image,
                olv_analysis
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
            sourcePublishedDate: row.source_published_date ? new Date(row.source_published_date).toISOString() : null,
            icon: row.icon,
            readTime: row.read_time,
            source: row.source,
            dataSource: dataSource,
            image: row.image || null,
            olvAnalysis: row.olv_analysis || null
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
    get hasPostgres() { return hasPostgres; },
    get sql() { return sql; },
    ensureConnection,
    initDatabase,
    saveArticleToDB,
    loadPostsFromDB,
    loadPostFromDB,
    cleanupOldPosts,
    cleanupOldPostsByDate,
    executeQuery
};
