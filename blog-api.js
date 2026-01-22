// blog-api.js - Backend para integração com APIs públicas e geração de conteúdo
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Configuração de APIs
const API_CONFIG = {
    comexstat: {
        baseUrl: 'http://comexstat.mdic.gov.br/api',
        enabled: true
    },
    unComtrade: {
        baseUrl: 'https://comtradeplus.un.org/api',
        enabled: true
    },
    worldBank: {
        baseUrl: 'https://api.worldbank.org/v2',
        enabled: true
    },
    rssFeeds: {
        valor: 'https://www.valor.com.br/rss',
        exame: 'https://exame.com/feed/',
        agenciaBrasil: 'https://agenciabrasil.ebc.com.br/rss',
        reuters: 'https://www.reuters.com/rssFeed/worldNews',
        enabled: true
    }
};

// Diretório para armazenar artigos gerados
const BLOG_DATA_DIR = path.join(__dirname, 'blog-data');
const POSTS_FILE = path.join(BLOG_DATA_DIR, 'posts.json');

// Garantir que o diretório existe
async function ensureBlogDataDir() {
    try {
        await fs.mkdir(BLOG_DATA_DIR, { recursive: true });
    } catch (error) {
        console.error('Erro ao criar diretório blog-data:', error);
    }
}

// Buscar dados do ComexStat (MDIC)
async function fetchComexStatData() {
    if (!API_CONFIG.comexstat.enabled) return null;
    
    try {
        // Exemplo: buscar dados de exportação do Brasil
        // Nota: A API real do ComexStat pode ter endpoints diferentes
        // Ajustar conforme documentação oficial
        const response = await axios.get(`${API_CONFIG.comexstat.baseUrl}/exportacao`, {
            timeout: 10000,
            headers: {
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar dados do ComexStat:', error.message);
        return null;
    }
}

// Buscar dados do UN Comtrade
async function fetchUNComtradeData(countryCode = '076', partnerCode = '0', productCode = 'TOTAL') {
    if (!API_CONFIG.unComtrade.enabled) return null;
    
    try {
        // Exemplo de chamada à API UN Comtrade
        // Ajustar conforme documentação oficial
        const response = await axios.get(`${API_CONFIG.unComtrade.baseUrl}/get`, {
            params: {
                reporterCode: countryCode, // 076 = Brasil
                partnerCode: partnerCode,  // 0 = Todos os países
                tradeFlow: 'X', // X = Exportação, M = Importação
                period: new Date().getFullYear() - 1, // Ano anterior
                cmdCode: productCode
            },
            timeout: 15000
        });
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar dados do UN Comtrade:', error.message);
        return null;
    }
}

// Buscar dados do World Bank
async function fetchWorldBankData(indicator = 'NE.TRD.GNFS.ZS', country = 'BRA') {
    if (!API_CONFIG.worldBank.enabled) return null;
    
    try {
        const response = await axios.get(`${API_CONFIG.worldBank.baseUrl}/country/${country}/indicator/${indicator}`, {
            params: {
                format: 'json',
                date: `${new Date().getFullYear() - 5}:${new Date().getFullYear()}`
            },
            timeout: 10000
        });
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar dados do World Bank:', error.message);
        return null;
    }
}

// Processar feeds RSS (usando biblioteca externa)
async function fetchRSSFeed(feedUrl) {
    if (!API_CONFIG.rssFeeds.enabled) return null;
    
    try {
        // Nota: Requer instalação de 'rss-parser' ou similar
        // Por enquanto, retornar estrutura vazia
        // Implementar quando rss-parser estiver instalado
        return {
            items: [],
            title: '',
            link: feedUrl
        };
    } catch (error) {
        console.error(`Erro ao buscar feed RSS ${feedUrl}:`, error.message);
        return null;
    }
}

// Gerar artigo baseado em dados
function generateArticleFromData(data, type) {
    const now = new Date();
    const articleId = `article-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    let article = {
        id: articleId,
        title: '',
        excerpt: '',
        content: '',
        category: 'analises',
        datePublished: now.toISOString(),
        dateModified: now.toISOString(),
        icon: 'fas fa-chart-line',
        readTime: 5,
        source: type,
        dataSource: data
    };

    switch (type) {
        case 'comexstat':
            article.title = `Análise de Comércio Exterior - Dados MDIC ${now.getFullYear()}`;
            article.excerpt = `Análise dos dados oficiais de comércio exterior do Brasil, baseada em informações do Ministério da Indústria, Comércio Exterior e Serviços.`;
            article.content = generateComexStatContent(data);
            break;
            
        case 'unComtrade':
            article.title = `Tendências Globais de Comércio Internacional`;
            article.excerpt = `Análise de dados internacionais de comércio, baseada em informações da UN Comtrade.`;
            article.content = generateUNComtradeContent(data);
            break;
            
        case 'worldBank':
            article.title = `Indicadores Econômicos e Comércio Internacional`;
            article.excerpt = `Análise de indicadores econômicos globais relacionados ao comércio exterior.`;
            article.content = generateWorldBankContent(data);
            break;
            
        case 'rss':
            article.category = 'noticias';
            article.icon = 'fas fa-newspaper';
            article.title = data.title || 'Notícia de Comércio Exterior';
            article.excerpt = data.description || data.contentSnippet || '';
            article.content = generateRSSContent(data);
            break;
    }

    return article;
}

// Gerar conteúdo HTML para artigo do ComexStat
function generateComexStatContent(data) {
    if (!data) {
        return '<p>Dados não disponíveis no momento.</p>';
    }

    return `
        <h2>Dados de Comércio Exterior do Brasil</h2>
        <p>Análise baseada em dados oficiais do Ministério da Indústria, Comércio Exterior e Serviços (MDIC).</p>
        
        <h3>Principais Indicadores</h3>
        <p>Os dados mostram as tendências de importação e exportação do Brasil, fornecendo insights valiosos para empresas que operam no comércio exterior.</p>
        
        <blockquote>
            <p>A análise de dados oficiais é fundamental para tomada de decisões estratégicas no comércio exterior.</p>
        </blockquote>
        
        <h3>Implicações para o Mercado</h3>
        <p>Essas informações ajudam empresas a:</p>
        <ul>
            <li>Identificar oportunidades de mercado</li>
            <li>Entender tendências setoriais</li>
            <li>Planejar estratégias de importação e exportação</li>
            <li>Antecipar mudanças regulatórias</li>
        </ul>
        
        <p><strong>Fonte:</strong> Dados públicos do MDIC - ComexStat</p>
    `;
}

// Gerar conteúdo HTML para artigo do UN Comtrade
function generateUNComtradeContent(data) {
    if (!data) {
        return '<p>Dados não disponíveis no momento.</p>';
    }

    return `
        <h2>Tendências Globais de Comércio</h2>
        <p>Análise baseada em dados da UN Comtrade, cobrindo mais de 200 países.</p>
        
        <h3>Panorama Internacional</h3>
        <p>Os dados globais revelam padrões importantes no comércio internacional que impactam diretamente as estratégias de empresas brasileiras.</p>
        
        <h3>Oportunidades Identificadas</h3>
        <p>Com base na análise de dados internacionais, identificamos oportunidades estratégicas para empresas que buscam expandir suas operações globais.</p>
        
        <p><strong>Fonte:</strong> UN Comtrade - Dados públicos</p>
    `;
}

// Gerar conteúdo HTML para artigo do World Bank
function generateWorldBankContent(data) {
    if (!data) {
        return '<p>Dados não disponíveis no momento.</p>';
    }

    return `
        <h2>Indicadores Econômicos Globais</h2>
        <p>Análise de indicadores econômicos relacionados ao comércio exterior, baseada em dados do Banco Mundial.</p>
        
        <h3>Contexto Econômico</h3>
        <p>Os indicadores econômicos globais fornecem contexto importante para decisões estratégicas em comércio exterior.</p>
        
        <p><strong>Fonte:</strong> World Bank Open Data</p>
    `;
}

// Gerar conteúdo HTML para artigo de RSS
function generateRSSContent(data) {
    return `
        <h2>${data.title || 'Notícia'}</h2>
        <p>${data.content || data.contentSnippet || data.description || ''}</p>
        ${data.link ? `<p><a href="${data.link}" target="_blank" rel="noopener">Leia a notícia completa</a></p>` : ''}
        <p><strong>Fonte:</strong> ${data.creator || 'Agência de Notícias'}</p>
    `;
}

// Salvar artigo
async function saveArticle(article) {
    await ensureBlogDataDir();
    
    try {
        let posts = [];
        try {
            const data = await fs.readFile(POSTS_FILE, 'utf8');
            posts = JSON.parse(data);
        } catch (error) {
            // Arquivo não existe, criar novo
            posts = [];
        }

        // Verificar se artigo já existe (por ID ou título)
        const existingIndex = posts.findIndex(p => p.id === article.id || p.title === article.title);
        if (existingIndex >= 0) {
            posts[existingIndex] = article;
        } else {
            posts.unshift(article); // Adicionar no início
        }

        // Manter apenas os últimos 100 artigos
        if (posts.length > 100) {
            posts = posts.slice(0, 100);
        }

        await fs.writeFile(POSTS_FILE, JSON.stringify(posts, null, 2), 'utf8');
        return article;
    } catch (error) {
        console.error('Erro ao salvar artigo:', error);
        throw error;
    }
}

// Carregar todos os posts
async function loadPosts() {
    await ensureBlogDataDir();
    
    try {
        const data = await fs.readFile(POSTS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

// Carregar post específico
async function loadPost(id) {
    const posts = await loadPosts();
    return posts.find(p => p.id === id) || null;
}

// Processar e gerar artigos de todas as fontes
async function processAllSources() {
    console.log('🔄 Iniciando processamento de fontes de dados...');
    
    const articles = [];

    // 1. ComexStat
    try {
        const comexData = await fetchComexStatData();
        if (comexData) {
            const article = generateArticleFromData(comexData, 'comexstat');
            await saveArticle(article);
            articles.push(article);
            console.log('✅ Artigo do ComexStat gerado');
        }
    } catch (error) {
        console.error('❌ Erro ao processar ComexStat:', error.message);
    }

    // 2. UN Comtrade
    try {
        const unData = await fetchUNComtradeData();
        if (unData) {
            const article = generateArticleFromData(unData, 'unComtrade');
            await saveArticle(article);
            articles.push(article);
            console.log('✅ Artigo do UN Comtrade gerado');
        }
    } catch (error) {
        console.error('❌ Erro ao processar UN Comtrade:', error.message);
    }

    // 3. World Bank
    try {
        const wbData = await fetchWorldBankData();
        if (wbData) {
            const article = generateArticleFromData(wbData, 'worldBank');
            await saveArticle(article);
            articles.push(article);
            console.log('✅ Artigo do World Bank gerado');
        }
    } catch (error) {
        console.error('❌ Erro ao processar World Bank:', error.message);
    }

    // 4. RSS Feeds (implementar quando rss-parser estiver instalado)
    // Por enquanto, pular

    console.log(`✅ Processamento concluído. ${articles.length} artigos gerados.`);
    return articles;
}

module.exports = {
    fetchComexStatData,
    fetchUNComtradeData,
    fetchWorldBankData,
    fetchRSSFeed,
    generateArticleFromData,
    saveArticle,
    loadPosts,
    loadPost,
    processAllSources
};
