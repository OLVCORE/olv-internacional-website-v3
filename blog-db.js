// blog-db.js - Gerenciamento de banco de dados Vercel Postgres / Neon
let sql = null;
let hasPostgres = false;

// Tentar usar @vercel/postgres primeiro (Vercel Postgres tradicional)
try {
    const vercelPostgres = require('@vercel/postgres');
    sql = vercelPostgres.sql;
    hasPostgres = process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL_NON_POOLING;
} catch (error) {
    // Se @vercel/postgres não estiver disponível, tentar Neon
    try {
        const { neon } = require('@neondatabase/serverless');
        sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL);
        hasPostgres = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    } catch (neonError) {
        console.warn('⚠️ Nenhum driver de banco disponível. Usando armazenamento em arquivo.');
    }
}

// Detectar se está rodando no Vercel com Postgres/Neon configurado
if (!hasPostgres) {
    hasPostgres = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL_NON_POOLING;
}

// Inicializar tabela de posts
async function initDatabase() {
    if (!hasPostgres || !sql) {
        console.log('⚠️ Vercel Postgres/Neon não configurado. Usando armazenamento em arquivo.');
        return false;
    }

    try {
        // Criar tabela se não existir
        // Usar template string para compatibilidade com Neon e Vercel Postgres
        if (typeof sql === 'function') {
            // Neon usa função direta
            await sql(`
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
            `);
        } else {
            // Vercel Postgres usa tagged template
            await sql`
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
        }

        // Criar índices para melhor performance
        await sql`
            CREATE INDEX IF NOT EXISTS idx_blog_posts_category 
            ON blog_posts(category)
        `;

        await sql`
            CREATE INDEX IF NOT EXISTS idx_blog_posts_date_published 
            ON blog_posts(date_published DESC)
        `;

        await sql`
            CREATE INDEX IF NOT EXISTS idx_blog_posts_source 
            ON blog_posts(source)
        `;

        console.log('✅ Tabela blog_posts criada/verificada com sucesso');
        return true;
    } catch (error) {
        console.error('❌ Erro ao inicializar banco de dados:', error);
        return false;
    }
}

// Salvar artigo no banco
async function saveArticleToDB(article) {
    if (!hasPostgres) {
        return null; // Retornar null para usar fallback de arquivo
    }

    try {
        const now = new Date().toISOString();
        
        await sql`
            INSERT INTO blog_posts (
                id, title, excerpt, content, category,
                date_published, date_modified, icon, read_time, source, data_source, updated_at
            )
            VALUES (
                ${article.id},
                ${article.title},
                ${article.excerpt || ''},
                ${article.content},
                ${article.category},
                ${article.datePublished},
                ${article.dateModified || article.datePublished},
                ${article.icon || 'fas fa-chart-line'},
                ${article.readTime || 5},
                ${article.source || ''},
                ${JSON.stringify(article.dataSource || {})},
                ${now}
            )
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

        return article;
    } catch (error) {
        console.error('❌ Erro ao salvar artigo no banco:', error);
        throw error;
    }
}

// Carregar todos os posts do banco
async function loadPostsFromDB(limit = 100) {
    if (!hasPostgres) {
        return null; // Retornar null para usar fallback de arquivo
    }

    try {
        const result = await sql`
            SELECT 
                id, title, excerpt, content, category,
                date_published, date_modified, icon, read_time, source, data_source
            FROM blog_posts
            ORDER BY date_published DESC
            LIMIT ${limit}
        `;

        // Converter para formato esperado
        return result.rows.map(row => ({
            id: row.id,
            title: row.title,
            excerpt: row.excerpt,
            content: row.content,
            category: row.category,
            datePublished: row.date_published.toISOString(),
            dateModified: row.date_modified.toISOString(),
            icon: row.icon,
            readTime: row.read_time,
            source: row.source,
            dataSource: row.data_source || {}
        }));
    } catch (error) {
        console.error('❌ Erro ao carregar posts do banco:', error);
        return null; // Retornar null para usar fallback
    }
}

// Carregar post específico do banco
async function loadPostFromDB(postId) {
    if (!hasPostgres) {
        return null;
    }

    try {
        const result = await sql`
            SELECT 
                id, title, excerpt, content, category,
                date_published, date_modified, icon, read_time, source, data_source
            FROM blog_posts
            WHERE id = ${postId}
            LIMIT 1
        `;

        if (result.rows.length === 0) {
            return null;
        }

        const row = result.rows[0];
        return {
            id: row.id,
            title: row.title,
            excerpt: row.excerpt,
            content: row.content,
            category: row.category,
            datePublished: row.date_published.toISOString(),
            dateModified: row.date_modified.toISOString(),
            icon: row.icon,
            readTime: row.read_time,
            source: row.source,
            dataSource: row.data_source || {}
        };
    } catch (error) {
        console.error('❌ Erro ao carregar post do banco:', error);
        return null;
    }
}

// Deletar posts antigos (manter apenas os últimos N)
async function cleanupOldPosts(keepCount = 100) {
    if (!hasPostgres) {
        return;
    }

    try {
        await sql`
            DELETE FROM blog_posts
            WHERE id NOT IN (
                SELECT id FROM blog_posts
                ORDER BY date_published DESC
                LIMIT ${keepCount}
            )
        `;
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
