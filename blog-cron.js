// blog-cron.js - Sistema de cron jobs para atualização automática do blog
const cron = require('node-cron');
const { processAllSources } = require('./blog-api');
const { processAndPublish } = require('./blog-processor');

// Configuração de frequência de atualização
const CRON_CONFIG = {
    // ComexStat: Diariamente às 2h da manhã (dados diários)
    comexstat: '0 2 * * *',
    
    // UN Comtrade: Semanalmente (domingo às 3h)
    unComtrade: '0 3 * * 0',
    
    // World Bank: Semanalmente (domingo às 4h)
    worldBank: '0 4 * * 0',
    
    // RSS Feeds: A cada 4 horas
    rss: '0 */4 * * *',
    
    // Processamento completo: Diariamente às 5h
    fullProcess: '0 5 * * *'
};

// Processar apenas ComexStat
async function processComexStat() {
    console.log('🔄 [CRON] Processando ComexStat...');
    try {
        const { fetchComexStatData, generateArticleFromData, saveArticle } = require('./blog-api');
        const data = await fetchComexStatData();
        if (data) {
            const article = generateArticleFromData(data, 'comexstat');
            await saveArticle(article);
            console.log('✅ [CRON] Artigo do ComexStat gerado:', article.title);
        }
    } catch (error) {
        console.error('❌ [CRON] Erro ao processar ComexStat:', error.message);
    }
}

// Processar apenas UN Comtrade
async function processUNComtrade() {
    console.log('🔄 [CRON] Processando UN Comtrade...');
    try {
        const { fetchUNComtradeData, generateArticleFromData, saveArticle } = require('./blog-api');
        const data = await fetchUNComtradeData();
        if (data) {
            const article = generateArticleFromData(data, 'unComtrade');
            await saveArticle(article);
            console.log('✅ [CRON] Artigo do UN Comtrade gerado:', article.title);
        }
    } catch (error) {
        console.error('❌ [CRON] Erro ao processar UN Comtrade:', error.message);
    }
}

// Processar apenas World Bank
async function processWorldBank() {
    console.log('🔄 [CRON] Processando World Bank...');
    try {
        const { fetchWorldBankData, generateArticleFromData, saveArticle } = require('./blog-api');
        const data = await fetchWorldBankData();
        if (data) {
            const article = generateArticleFromData(data, 'worldBank');
            await saveArticle(article);
            console.log('✅ [CRON] Artigo do World Bank gerado:', article.title);
        }
    } catch (error) {
        console.error('❌ [CRON] Erro ao processar World Bank:', error.message);
    }
}

// Processar RSS Feeds
async function processRSSFeeds() {
    console.log('🔄 [CRON] Processando RSS Feeds...');
    try {
        const { fetchRSSFeed, generateArticleFromData, saveArticle } = require('./blog-api');
        const RSS_FEEDS = [
            { url: 'https://www.portosenavios.com.br/feed', name: 'Portos e Navios' },
            { url: 'https://www.supplychaindive.com/feeds/news/', name: 'Supply Chain Dive' },
            { url: 'https://www.freightwaves.com/feed', name: 'Freight Waves' },
            { url: 'https://www.wto.org/english/news_e/rss_e/rss_e.xml', name: 'WTO News' }
        ];

        for (const feed of RSS_FEEDS) {
            try {
                const feedData = await fetchRSSFeed(feed.url);
                if (feedData && feedData.items) {
                    // Processar apenas os 3 primeiros itens mais recentes
                    const recentItems = feedData.items.slice(0, 3);
                    for (const item of recentItems) {
                        const article = generateArticleFromData(item, 'rss');
                        await saveArticle(article);
                        console.log('✅ [CRON] Artigo RSS gerado:', article.title);
                    }
                }
            } catch (error) {
                console.error(`❌ [CRON] Erro ao processar feed ${feed.name}:`, error.message);
            }
        }
    } catch (error) {
        console.error('❌ [CRON] Erro ao processar RSS Feeds:', error.message);
    }
}

// Processamento completo
async function processFull() {
    console.log('🔄 [CRON] Processamento completo iniciado...');
    try {
        const result = await processAndPublish();
        const articles = (result && result.articles) ? result.articles : [];
        console.log(`✅ [CRON] Processamento completo concluído. ${articles.length} artigos processados.`);
    } catch (error) {
        console.error('❌ [CRON] Erro no processamento completo:', error.message);
    }
}

// Inicializar cron jobs
function initCronJobs() {
    console.log('📅 Inicializando cron jobs do blog...');

    // ComexStat: Diariamente às 2h
    cron.schedule(CRON_CONFIG.comexstat, processComexStat, {
        scheduled: true,
        timezone: "America/Sao_Paulo"
    });
    console.log('✅ Cron job ComexStat agendado:', CRON_CONFIG.comexstat);

    // UN Comtrade: Semanalmente
    cron.schedule(CRON_CONFIG.unComtrade, processUNComtrade, {
        scheduled: true,
        timezone: "America/Sao_Paulo"
    });
    console.log('✅ Cron job UN Comtrade agendado:', CRON_CONFIG.unComtrade);

    // World Bank: Semanalmente
    cron.schedule(CRON_CONFIG.worldBank, processWorldBank, {
        scheduled: true,
        timezone: "America/Sao_Paulo"
    });
    console.log('✅ Cron job World Bank agendado:', CRON_CONFIG.worldBank);

    // RSS Feeds: A cada 4 horas
    cron.schedule(CRON_CONFIG.rss, processRSSFeeds, {
        scheduled: true,
        timezone: "America/Sao_Paulo"
    });
    console.log('✅ Cron job RSS Feeds agendado:', CRON_CONFIG.rss);

    // Processamento completo: Diariamente
    cron.schedule(CRON_CONFIG.fullProcess, processFull, {
        scheduled: true,
        timezone: "America/Sao_Paulo"
    });
    console.log('✅ Cron job processamento completo agendado:', CRON_CONFIG.fullProcess);

    console.log('✅ Todos os cron jobs inicializados!');
    console.log('📊 Frequência de atualização:');
    console.log('   - ComexStat: Diariamente às 2h');
    console.log('   - UN Comtrade: Semanalmente (domingo às 3h)');
    console.log('   - World Bank: Semanalmente (domingo às 4h)');
    console.log('   - RSS Feeds: A cada 4 horas');
    console.log('   - Processamento completo: Diariamente às 5h');
}

// Executar processamento inicial ao iniciar
async function runInitialProcess() {
    console.log('🚀 Executando processamento inicial...');
    try {
        await processAndPublish();
        console.log('✅ Processamento inicial concluído!');
    } catch (error) {
        console.error('❌ Erro no processamento inicial:', error.message);
    }
}

module.exports = {
    initCronJobs,
    runInitialProcess,
    processComexStat,
    processUNComtrade,
    processWorldBank,
    processRSSFeeds,
    processFull,
    CRON_CONFIG
};

// Se executado diretamente, inicializar cron jobs
if (require.main === module) {
    initCronJobs();
    runInitialProcess();
}
