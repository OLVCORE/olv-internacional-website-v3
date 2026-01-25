// api/blog/process.js - Serverless function para Vercel
// POST /api/blog/process

const { processAndPublish } = require('../../blog-processor');
let initDatabase = null;
let db = null;
try {
    const dbNeon = require('../../blog-db-neon');
    initDatabase = dbNeon.initDatabase;
    db = dbNeon;
} catch (error) {
    try {
        const dbModule = require('../../blog-db');
        initDatabase = dbModule.initDatabase;
        db = dbModule;
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
            console.log('🔄 Inicializando banco de dados...');
            await initDatabase();
            console.log('✅ Banco de dados inicializado');
        } catch (initError) {
            console.error('❌ Erro ao inicializar banco:', initError.message);
            console.error('Stack:', initError.stack);
        }

        console.log('🔄 Iniciando processamento de artigos...');
        const articles = await processAndPublish();
        console.log(`✅ Processamento concluído: ${articles.length} artigos processados`);
        
        // Verificar quantos posts existem no banco AGORA (após processamento)
        let totalPostsInDB = 0;
        let postsByCategory = {};
        try {
            const { loadPosts } = require('../../blog-api');
            const allPosts = await loadPosts();
            totalPostsInDB = allPosts.length;
            
            // Contar por categoria
            postsByCategory = {
                all: allPosts.length,
                analises: allPosts.filter(p => p.category === 'analises').length,
                noticias: allPosts.filter(p => p.category === 'noticias').length,
                guias: allPosts.filter(p => p.category === 'guias').length,
                insights: allPosts.filter(p => p.category === 'insights').length
            };
            
            console.log(`📊 Total de posts no banco APÓS processamento: ${totalPostsInDB}`);
            console.log(`📊 Distribuição por categoria:`, postsByCategory);
        } catch (countError) {
            console.warn('⚠️ Erro ao contar posts no banco:', countError.message);
        }
        
        // No Vercel, retornar os artigos também para garantir que estão disponíveis
        res.status(200).json({ 
            success: true, 
            message: `${articles.length} artigos processados`,
            articles: articles.length,
            totalPostsInDB: totalPostsInDB,
            postsByCategory: postsByCategory,
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
