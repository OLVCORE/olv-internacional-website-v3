// api/blog/process.js - Serverless function para Vercel
// POST /api/blog/process

const { processAndPublish } = require('../../blog-processor');

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only POST allowed
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const articles = await processAndPublish();
        
        res.status(200).json({ 
            success: true, 
            message: `${articles.length} artigos processados`,
            articles: articles.length
        });
    } catch (error) {
        console.error('Erro ao processar artigos:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Erro ao processar artigos' 
        });
    }
};
