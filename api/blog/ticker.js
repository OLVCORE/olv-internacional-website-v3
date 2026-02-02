// api/blog/ticker.js - Endpoint leve para o news ticker (só campos necessários)
// GET /api/blog/ticker - Resposta pequena e rápida para a barra de notícias

const { loadPosts } = require('../../blog-api');
let initDatabase = null;
try {
    const dbNeon = require('../../blog-db-neon');
    initDatabase = dbNeon.initDatabase;
} catch (e) {
    try {
        const db = require('../../blog-db');
        initDatabase = db.initDatabase;
    } catch (e2) {}
}

const MAX_TICKER_POSTS = 50;

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'public, s-maxage=120, max-age=60'); // 2 min CDN, 1 min browser

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        try {
            if (initDatabase) await initDatabase();
        } catch (initErr) {
            console.warn('ticker initDatabase:', initErr.message);
        }

        const raw = await loadPosts();
        const list = Array.isArray(raw) ? raw : [];
        const byDate = list
            .filter(p => p && (p.id || (p.title && p.title.trim())))
            .sort((a, b) => {
                const da = new Date(a.datePublished || a.dateModified || 0).getTime();
                const db_ = new Date(b.datePublished || b.dateModified || 0).getTime();
                return db_ - da;
            })
            .slice(0, MAX_TICKER_POSTS)
            .map(p => ({
                id: p.id,
                title: p.title || '',
                datePublished: p.datePublished || p.dateModified || null,
                dateModified: p.dateModified || null,
                source: p.source || '',
                dataSource: p.dataSource ? { link: p.dataSource.link || '' } : {}
            }));

        res.status(200).json({ posts: byDate });
    } catch (err) {
        console.error('ticker error:', err);
        res.status(500).json({ posts: [], error: err.message });
    }
};
