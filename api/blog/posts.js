// api/blog/posts.js - Serverless function para Vercel
// GET /api/blog/posts?category=all

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
        // Inicializar banco se necessário (primeira vez)
        try {
            await initDatabase();
        } catch (initError) {
            console.warn('Banco não inicializado (pode ser normal):', initError.message);
        }

        const category = req.query.category || 'all';
        let posts = [];
        
        try {
            posts = await loadPosts();
        } catch (error) {
            console.warn('Arquivo de posts não encontrado ou vazio. Processando agora...', error.message);
            // Se não houver posts, tentar processar
            try {
                const { processAllSources } = require('../../blog-api');
                const articles = await processAllSources();
                posts = articles;
            } catch (processError) {
                console.error('Erro ao processar posts:', processError);
                // Retornar array vazio se falhar
                posts = [];
            }
        }
        
        let filteredPosts = posts;
        if (category !== 'all') {
            filteredPosts = posts.filter(p => p.category === category);
        }

        res.status(200).json(filteredPosts);
    } catch (error) {
        console.error('Erro ao carregar posts:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Erro ao carregar posts' 
        });
    }
};
