// api/blog/init-db.js - Serverless function para inicializar banco de dados
// GET /api/blog/init-db

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
        const success = await initDatabase();
        
        if (success) {
            res.status(200).json({ 
                success: true, 
                message: 'Banco de dados inicializado com sucesso',
                hasPostgres: true
            });
        } else {
            res.status(200).json({ 
                success: false, 
                message: 'Vercel Postgres não configurado. Usando armazenamento em arquivo.',
                hasPostgres: false
            });
        }
    } catch (error) {
        console.error('Erro ao inicializar banco:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Erro ao inicializar banco de dados' 
        });
    }
};
