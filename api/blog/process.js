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
    // Verificar se é chamada do cron (Vercel envia GET com User-Agent vercel-cron/1.0)
    const ua = (req.headers['user-agent'] || '').toLowerCase();
    const isCronCall = req.headers['x-vercel-cron'] === '1' ||
                       (ua.includes('vercel-cron') && req.method === 'GET') ||
                       req.headers['cron-secret'] ||
                       req.method === 'GET';
    
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
    
    const now = new Date().toISOString();
    const fromCron = req.headers['x-vercel-cron'] === '1' || ua.includes('vercel-cron');
    if (fromCron) {
        console.log(`⏰ [CRON] Processamento iniciado pelo Vercel Cron em ${now}`);
    } else {
        console.log(`🔧 Processamento iniciado (manual ou GET) em ${now}`);
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
        const result = await processAndPublish();
        const articles = (result && result.articles) ? result.articles : [];
        const rssStats = (result && result.rssStats) ? result.rssStats : {};
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
        
        // Resposta com estatísticas RSS para diagnóstico (por que 0 artigos?)
        const response = {
            success: true, 
            message: `${articles.length} artigos processados`,
            articles: articles.length,
            totalPostsInDB: totalPostsInDB,
            postsByCategory: postsByCategory,
            posts: articles,
            rssStats: rssStats,
            timestamp: new Date().toISOString()
        };
        
        if (articles.length === 0) {
            response.warning = 'Nenhum artigo novo foi processado nesta execução.';
            response.possibleReasons = [
                rssStats.totalItemsFound === 0 ? 'Feeds RSS não retornaram itens (502/timeout?)' : null,
                rssStats.totalItemsAccepted === 0 && rssStats.totalItemsFound > 0 ? 'Nenhum artigo passou no filtro de relevância' : null,
                rssStats.totalItemsDuplicated > 0 && rssStats.totalItemsSaved === 0 ? 'Todos os itens aceitos já existiam no banco (duplicatas)' : null,
                rssStats.totalItemsAccepted > 0 && rssStats.totalItemsSaved === 0 && rssStats.lastSaveError ? `Salvamento falhou: ${rssStats.lastSaveError}` : null,
                'Problema no salvamento (ver logs no Vercel)'
            ].filter(Boolean);
            response.recommendations = [
                'Veja rssStats nesta resposta: totalItemsFound, totalItemsAccepted, totalItemsDuplicated, totalItemsSaved',
                'GET /api/blog/diagnose para diagnóstico completo',
                'Logs no Vercel: filtrar por /api/blog/process'
            ];
        }
        
        res.status(200).json(response);
    } catch (error) {
        console.error('Erro ao processar artigos:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Erro ao processar artigos' 
        });
    }
};
