// api/blog/count-posts.js - Endpoint para contar posts no banco
// GET /api/blog/count-posts

const { loadPosts } = require('../../blog-api');
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

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only GET allowed
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        // Inicializar banco se necessário
        try {
            await initDatabase();
        } catch (initError) {
            console.warn('Banco não inicializado:', initError.message);
        }

        // Carregar todos os posts
        const posts = await loadPosts();
        
        // Contar por categoria
        const counts = {
            all: posts.length,
            analises: posts.filter(p => p.category === 'analises').length,
            noticias: posts.filter(p => p.category === 'noticias').length,
            guias: posts.filter(p => p.category === 'guias').length,
            insights: posts.filter(p => p.category === 'insights').length
        };

        // Verificar banco
        let dbStatus = 'unknown';
        try {
            const dbNeon = require('../../blog-db-neon');
            dbStatus = {
                hasPostgres: dbNeon.hasPostgres,
                hasDatabaseUrl: !!(process.env.DATABASE_URL || process.env.POSTGRES_URL)
            };
        } catch (e) {
            dbStatus = { error: e.message };
        }

        res.status(200).json({
            success: true,
            counts: counts,
            total: posts.length,
            dbStatus: dbStatus,
            posts: posts.map(p => ({
                id: p.id,
                title: p.title.substring(0, 50),
                category: p.category,
                source: p.source
            }))
        });
    } catch (error) {
        console.error('Erro ao contar posts:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Erro ao contar posts' 
        });
    }
};
