// blog-processor.js - Processamento e enriquecimento de dados para artigos
const { processAllSources } = require('./blog-api');
let db = null;
try {
    db = require('./blog-db-neon');
} catch (error) {
    try {
        db = require('./blog-db');
    } catch (error2) {
        console.warn('Banco de dados não disponível');
    }
}

// Configuração de processamento
const PROCESSING_CONFIG = {
    // Frequência de atualização (em minutos)
    updateInterval: {
        comexstat: 1440,      // 24 horas (dados diários)
        unComtrade: 10080,   // 7 dias (dados semanais)
        worldBank: 10080,    // 7 dias (dados semanais)
        rss: 240             // 4 horas (notícias)
    },
    
    // Categorias de artigos
    categories: {
        'analises': 'Análises de Mercado',
        'guias': 'Guias Práticos',
        'noticias': 'Notícias',
        'insights': 'Insights'
    }
};

// Enriquecer artigo com análise
function enrichArticle(article, rawData) {
    // Adicionar insights baseados nos dados
    if (rawData && typeof rawData === 'object') {
        article.insights = extractInsights(rawData);
        article.trends = identifyTrends(rawData);
    }
    
    // Calcular tempo de leitura (aproximado)
    const words = article.content.split(/\s+/).length;
    article.readTime = Math.ceil(words / 200); // 200 palavras por minuto
    
    return article;
}

// Extrair insights dos dados
function extractInsights(data) {
    const insights = [];
    
    // Lógica de extração de insights baseada no tipo de dados
    // Implementar conforme necessário
    
    return insights;
}

// Identificar tendências
function identifyTrends(data) {
    const trends = [];
    
    // Lógica de identificação de tendências
    // Implementar conforme necessário
    
    return trends;
}

// Processar e publicar artigos
async function processAndPublish() {
    console.log('🚀 Iniciando processamento de artigos...');
    
    try {
        const articles = await processAllSources();
        
        // Enriquecer cada artigo
        const enrichedArticles = articles.map(article => {
            return enrichArticle(article, article.dataSource);
        });
        
        // Limpar posts antigos APENAS se houver muitos posts (não deletar se tiver poucos)
        if (db && db.hasPostgres) {
            try {
                // Verificar quantos posts existem antes de limpar
                const countQuery = 'SELECT COUNT(*) as total FROM blog_posts';
                const countResult = await db.executeQuery(countQuery);
                const totalPosts = parseInt(countResult?.rows?.[0]?.total || countResult?.[0]?.total || 0);
                
                console.log(`📊 Total de posts no banco antes da limpeza: ${totalPosts}`);
                
                // Só limpar se tiver mais de 200 posts (deixar espaço para crescimento)
                if (totalPosts > 200) {
                    console.log(`🧹 Limpando posts antigos (mantendo últimos 200)...`);
                    await db.cleanupOldPosts(200);
                } else {
                    console.log(`✅ Não é necessário limpar posts (total: ${totalPosts} < 200)`);
                }
                
                // Deletar posts com mais de 90 dias APENAS se tiver muitos posts
                if (totalPosts > 150) {
                    console.log(`🗑️  Deletando posts com mais de 90 dias...`);
                    await db.cleanupOldPostsByDate(90);
                } else {
                    console.log(`✅ Não é necessário deletar posts antigos (total: ${totalPosts} < 150)`);
                }
            } catch (cleanupError) {
                console.warn('⚠️ Erro ao limpar posts antigos:', cleanupError.message);
                // Não bloquear o processamento se a limpeza falhar
            }
        }
        
        console.log(`✅ ${enrichedArticles.length} artigos processados e enriquecidos`);
        return enrichedArticles;
    } catch (error) {
        console.error('❌ Erro no processamento:', error);
        throw error;
    }
}

module.exports = {
    enrichArticle,
    extractInsights,
    identifyTrends,
    processAndPublish,
    PROCESSING_CONFIG
};
