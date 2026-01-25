// api/blog/diagnose.js - Diagnóstico do sistema de blog
// GET /api/blog/diagnose

let initDatabase = null;
try {
    const dbNeon = require('../../blog-db-neon');
    initDatabase = dbNeon.initDatabase;
} catch (error) {
    try {
        const db = require('../../blog-db');
        initDatabase = db.initDatabase;
    } catch (error2) {
        console.warn('Banco de dados não disponível');
    }
}

let db = null;
try {
    db = require('../../blog-db-neon');
} catch (error) {
    try {
        db = require('../../blog-db');
    } catch (error2) {
        console.warn('Banco de dados não disponível');
    }
}

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const diagnosis = {
            timestamp: new Date().toISOString(),
            database: {},
            posts: {},
            rssFeeds: {},
            errors: []
        };

        // 1. Verificar banco de dados
        try {
            await initDatabase();
            diagnosis.database.connected = true;
            diagnosis.database.hasPostgres = db?.hasPostgres || false;
            diagnosis.database.hasDatabaseUrl = !!process.env.DATABASE_URL;
            
            if (db && db.hasPostgres) {
                try {
                    const countQuery = 'SELECT COUNT(*) as total FROM blog_posts';
                    const result = await db.executeQuery(countQuery);
                    const total = result?.rows?.[0]?.total || result?.[0]?.total || 0;
                    diagnosis.database.totalPosts = parseInt(total);
                    
                    // Contar por categoria
                    const categoryQuery = 'SELECT category, COUNT(*) as count FROM blog_posts GROUP BY category';
                    const categoryResult = await db.executeQuery(categoryQuery);
                    diagnosis.database.byCategory = {};
                    if (categoryResult?.rows) {
                        categoryResult.rows.forEach(row => {
                            diagnosis.database.byCategory[row.category] = parseInt(row.count);
                        });
                    }
                    
                    // Últimos posts
                    const recentQuery = 'SELECT id, title, category, date_published FROM blog_posts ORDER BY date_published DESC LIMIT 10';
                    const recentResult = await db.executeQuery(recentQuery);
                    diagnosis.database.recentPosts = recentResult?.rows || [];
                } catch (dbError) {
                    diagnosis.errors.push(`Erro ao consultar banco: ${dbError.message}`);
                }
            }
        } catch (initError) {
            diagnosis.database.connected = false;
            diagnosis.errors.push(`Erro ao inicializar banco: ${initError.message}`);
        }

        // 2. Verificar posts do arquivo (fallback)
        try {
            const { loadPosts } = require('../../blog-api');
            const filePosts = await loadPosts();
            diagnosis.posts.fromFile = filePosts.length;
            diagnosis.posts.byCategory = {};
            filePosts.forEach(post => {
                const cat = post.category || 'unknown';
                diagnosis.posts.byCategory[cat] = (diagnosis.posts.byCategory[cat] || 0) + 1;
            });
            
            // Posts das últimas 24h
            const now = new Date();
            const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            const recentPosts = filePosts.filter(p => {
                const pubDate = new Date(p.datePublished || p.dateModified || 0);
                return pubDate >= yesterday;
            });
            diagnosis.posts.last24h = recentPosts.length;
        } catch (fileError) {
            diagnosis.errors.push(`Erro ao carregar posts do arquivo: ${fileError.message}`);
        }

        // 3. Testar RSS feeds
        try {
            const { fetchRSSFeed } = require('../../blog-api');
            const RSS_FEEDS = [
                { name: 'Valor', url: 'https://www.valor.com.br/rss' },
                { name: 'Exame', url: 'https://exame.com/feed/' }
            ];
            
            for (const feed of RSS_FEEDS) {
                try {
                    const feedData = await fetchRSSFeed(feed.url);
                    diagnosis.rssFeeds[feed.name] = {
                        available: !!feedData,
                        itemsCount: feedData?.items?.length || 0,
                        hasItems: !!(feedData?.items && feedData.items.length > 0)
                    };
                } catch (feedError) {
                    diagnosis.rssFeeds[feed.name] = {
                        available: false,
                        error: feedError.message
                    };
                }
            }
        } catch (rssError) {
            diagnosis.errors.push(`Erro ao testar RSS: ${rssError.message}`);
        }

        // 4. Verificar variáveis de ambiente
        diagnosis.environment = {
            vercel: process.env.VERCEL === '1',
            nodeEnv: process.env.NODE_ENV,
            hasDatabaseUrl: !!process.env.DATABASE_URL
        };

        res.status(200).json(diagnosis);
    } catch (error) {
        console.error('Erro no diagnóstico:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
};
