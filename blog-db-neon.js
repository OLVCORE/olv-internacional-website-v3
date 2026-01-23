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

    // Neon usa função direta com string SQL
    if (typeof sql === 'function' && query.includes('CREATE TABLE') || query.includes('SELECT') || query.includes('INSERT') || query.includes('UPDATE') || query.includes('DELETE')) {
        if (params && params.length > 0) {
            // Query parametrizada
            let queryStr = query;
            params.forEach((param, index) => {
                queryStr = queryStr.replace(`$${index + 1}`, typeof param === 'string' ? `'${param.replace(/'/g, "''")}'` : param);
            });
            return await sql(queryStr);
        } else {
            return await sql(query);
        }
    } else {
        // Vercel Postgres usa tagged template
        return await sql(query, ...params);
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
        return null;
    }

    try {
        const now = new Date().toISOString();
        const dataSourceJson = JSON.stringify(article.dataSource || {});
        
        const insertQuery = `
            INSERT INTO blog_posts (
                id, title, excerpt, content, category,
                date_published, date_modified, icon, read_time, source, data_source, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            ON CONFLICT (id) 
            DO UPDATE SET
                title = EXCLUDED.title,
                excerpt = EXCLUDED.excerpt,
                content = EXCLUDED.content,
                category = EXCLUDED.category,
                date_modified = EXCLUDED.date_modified,
                icon = EXCLUDED.icon,
                read_time = EXCLUDED.read_time,
                source = EXCLUDED.source,
                data_source = EXCLUDED.data_source,
                updated_at = EXCLUDED.updated_at
        `;

        await executeQuery(insertQuery, [
            article.id,
            article.title,
            article.excerpt || '',
            article.content,
            article.category,
            article.datePublished,
            article.dateModified || article.datePublished,
            article.icon || 'fas fa-chart-line',
            article.readTime || 5,
            article.source || '',
            dataSourceJson,
            now
        ]);

        return article;
    } catch (error) {
        console.error('❌ Erro ao salvar artigo no banco:', error);
        throw error;
    }
}

// Carregar todos os posts do banco
async function loadPostsFromDB(limit = 100) {
    if (!hasPostgres || !sql) {
        return null;
    }

    try {
        const query = `
            SELECT 
                id, title, excerpt, content, category,
                date_published, date_modified, icon, read_time, source, data_source
            FROM blog_posts
            ORDER BY date_published DESC
            LIMIT $1
        `;

        const result = await executeQuery(query, [limit]);

        // Converter para formato esperado
        const rows = Array.isArray(result) ? result : (result.rows || []);
        
        return rows.map(row => ({
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
            dataSource: typeof row.data_source === 'string' ? JSON.parse(row.data_source) : (row.data_source || {})
        }));
    } catch (error) {
        console.error('❌ Erro ao carregar posts do banco:', error);
        return null;
    }
}

// Carregar post específico do banco
async function loadPostFromDB(postId) {
    if (!hasPostgres || !sql) {
        return null;
    }

    try {
        const query = `
            SELECT 
                id, title, excerpt, content, category,
                date_published, date_modified, icon, read_time, source, data_source
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
            dataSource: typeof row.data_source === 'string' ? JSON.parse(row.data_source) : (row.data_source || {})
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
        const query = `
            DELETE FROM blog_posts
            WHERE id NOT IN (
                SELECT id FROM blog_posts
                ORDER BY date_published DESC
                LIMIT $1
            )
        `;

        await executeQuery(query, [keepCount]);
        console.log(`✅ Limpeza de posts antigos concluída. Mantidos ${keepCount} posts.`);
    } catch (error) {
        console.error('❌ Erro ao limpar posts antigos:', error);
    }
}

module.exports = {
    hasPostgres,
    initDatabase,
    saveArticleToDB,
    loadPostsFromDB,
    loadPostFromDB,
    cleanupOldPosts
};
