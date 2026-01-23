// api/blog/test-db.js - Endpoint de teste para verificar banco
// GET /api/blog/test-db

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
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const info = {
            hasDb: !!db,
            hasPostgres: db?.hasPostgres || false,
            databaseUrl: process.env.DATABASE_URL ? 'Configurado' : 'Não configurado',
            postgresUrl: process.env.POSTGRES_URL ? 'Configurado' : 'Não configurado',
        };

        // Tentar contar posts no banco
        if (db && db.hasPostgres) {
            try {
                const { loadPostsFromDB } = db;
                const posts = await loadPostsFromDB(10);
                info.postsInDb = posts ? posts.length : 0;
                info.postsSample = posts ? posts.slice(0, 2).map(p => ({ id: p.id, title: p.title })) : [];
            } catch (error) {
                info.dbError = error.message;
            }
        }

        res.status(200).json(info);
    } catch (error) {
        res.status(500).json({ 
            error: error.message,
            stack: error.stack 
        });
    }
};
