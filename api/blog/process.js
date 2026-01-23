// api/blog/process.js - Serverless function para Vercel
// POST /api/blog/process

const { processAndPublish } = require('../../blog-processor');
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
    // Verificar se é chamada do cron (Vercel Cron pode usar GET ou POST)
    const isCronCall = req.headers['x-vercel-cron'] || 
                       req.headers['cron-secret'] || 
                       req.method === 'GET'; // Vercel Cron pode usar GET
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Permitir POST e GET (GET para cron do Vercel)
    if (req.method !== 'POST' && req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    
    // Log quando chamado pelo cron
    if (isCronCall) {
        console.log('⏰ Processamento iniciado pelo Vercel Cron');
    } else {
        console.log('🔧 Processamento iniciado manualmente');
    }

    try {
        // Inicializar banco se necessário (primeira vez)
        try {
            await initDatabase();
        } catch (initError) {
            console.warn('Banco não inicializado (pode ser normal):', initError.message);
        }

        const articles = await processAndPublish();
        
        // No Vercel, retornar os artigos também para garantir que estão disponíveis
        res.status(200).json({ 
            success: true, 
            message: `${articles.length} artigos processados`,
            articles: articles.length,
            posts: articles // Incluir posts na resposta
        });
    } catch (error) {
        console.error('Erro ao processar artigos:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Erro ao processar artigos' 
        });
    }
};
