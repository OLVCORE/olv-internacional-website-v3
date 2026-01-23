// blog-api.js - Backend para integração com APIs públicas e geração de conteúdo
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Detectar se está rodando no Vercel
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;

// Importar gerenciamento de banco de dados
let db = null;
try {
    // Tentar usar versão Neon primeiro (mais comum agora)
    db = require('./blog-db-neon');
} catch (error) {
    try {
        // Fallback para versão original
        db = require('./blog-db');
    } catch (error2) {
        console.warn('⚠️ blog-db.js não disponível. Usando apenas armazenamento em arquivo.');
    }
}

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
// No Vercel, usar /tmp (único diretório gravável)
const BLOG_DATA_DIR = isVercel 
    ? '/tmp/blog-data' 
    : path.join(__dirname, 'blog-data');
const POSTS_FILE = path.join(BLOG_DATA_DIR, 'posts.json');

// Garantir que o diretório existe
async function ensureBlogDataDir() {
    try {
        await fs.mkdir(BLOG_DATA_DIR, { recursive: true });
        // Verificar se consegue escrever (teste de permissão)
        const testFile = path.join(BLOG_DATA_DIR, '.test');
        try {
            await fs.writeFile(testFile, 'test', 'utf8');
            await fs.unlink(testFile);
        } catch (writeError) {
            console.warn('Aviso: Diretório pode não ter permissão de escrita:', writeError.message);
        }
    } catch (error) {
        console.error('Erro ao criar diretório blog-data:', error);
        // No Vercel, se /tmp não funcionar, usar diretório alternativo
        if (isVercel && error.code === 'EACCES') {
            console.warn('Usando diretório alternativo no Vercel');
        }
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
    const content = data.content || data.contentSnippet || data.description || '';
    const pubDate = data.pubDate ? new Date(data.pubDate).toLocaleDateString('pt-BR') : '';
    
    return `
        <h2>${data.title || 'Notícia'}</h2>
        ${pubDate ? `<p class="text-muted"><i class="fas fa-calendar"></i> Publicado em: ${pubDate}</p>` : ''}
        <div>${content}</div>
        ${data.link ? `<p><a href="${data.link}" target="_blank" rel="noopener noreferrer" class="btn-link">Leia a notícia completa na fonte original <i class="fas fa-external-link-alt"></i></a></p>` : ''}
        <p><strong>Fonte:</strong> ${data.creator || data['dc:creator'] || 'Agência de Notícias'}</p>
    `;
}

// Gerar artigo de exemplo para categorias vazias
function generateExampleArticle(category) {
    const now = new Date();
    const articleId = `article-example-${category}-${Date.now()}`;
    
    const examples = {
        guias: {
            title: 'Guia Completo: Como Importar Produtos para o Brasil',
            excerpt: 'Passo a passo detalhado sobre o processo de importação, documentação necessária e melhores práticas para empresas que desejam importar produtos.',
            content: `
                <h2>Introdução</h2>
                <p>Importar produtos para o Brasil requer conhecimento específico sobre legislação, documentação e processos aduaneiros. Este guia prático apresenta as etapas essenciais.</p>
                
                <h3>1. Planejamento e Pesquisa</h3>
                <p>Antes de iniciar uma importação, é fundamental realizar uma pesquisa de mercado, verificar a viabilidade comercial e entender os custos envolvidos.</p>
                
                <h3>2. Documentação Necessária</h3>
                <ul>
                    <li>Registro no RADAR (Registro e Rastreamento da Atuação dos Importadores)</li>
                    <li>Licenças e autorizações específicas do produto</li>
                    <li>Documentos comerciais (invoice, packing list, etc.)</li>
                </ul>
                
                <h3>3. Processo Aduaneiro</h3>
                <p>O processo aduaneiro envolve despacho, fiscalização e liberação da mercadoria. A OLV Internacional oferece consultoria especializada para otimizar este processo.</p>
                
                <h3>Conclusão</h3>
                <p>Uma importação bem planejada reduz custos, evita multas e acelera a liberação. Conte com especialistas para garantir o sucesso da sua operação.</p>
            `,
            icon: 'fas fa-book'
        },
        insights: {
            title: 'Insights Estratégicos: O Futuro do Comércio Exterior Brasileiro',
            excerpt: 'Análise sobre tendências, oportunidades e desafios do comércio exterior brasileiro nos próximos anos, baseada em dados e experiência de mercado.',
            content: `
                <h2>Panorama Atual</h2>
                <p>O comércio exterior brasileiro está em constante evolução, com novas oportunidades surgindo em diferentes setores e mercados.</p>
                
                <h3>Tendências Identificadas</h3>
                <ul>
                    <li><strong>Digitalização:</strong> Processos cada vez mais automatizados e digitais</li>
                    <li><strong>Sustentabilidade:</strong> Demanda crescente por produtos e processos sustentáveis</li>
                    <li><strong>Diversificação:</strong> Expansão para novos mercados além dos tradicionais</li>
                </ul>
                
                <h3>Oportunidades Estratégicas</h3>
                <p>Empresas que investem em inteligência de mercado, análise de dados e planejamento estratégico têm maior probabilidade de sucesso nas operações internacionais.</p>
                
                <h3>Recomendações</h3>
                <p>A OLV Internacional oferece consultoria estratégica para empresas que desejam expandir suas operações internacionais com segurança e eficiência.</p>
            `,
            icon: 'fas fa-lightbulb'
        }
    };

    const example = examples[category] || {
        title: `Conteúdo ${category}`,
        excerpt: 'Artigo de exemplo',
        content: '<p>Este é um artigo de exemplo.</p>',
        icon: 'fas fa-file-alt'
    };

    return {
        id: articleId,
        title: example.title,
        excerpt: example.excerpt,
        content: example.content,
        category: category,
        datePublished: now.toISOString(),
        dateModified: now.toISOString(),
        icon: example.icon,
        readTime: Math.ceil(example.content.split(/\s+/).length / 200),
        source: 'manual',
        dataSource: {}
    };
}

// Salvar artigo
async function saveArticle(article) {
    // Tentar salvar no banco primeiro (se disponível)
    if (db && db.hasPostgres) {
        try {
            console.log(`💾 Tentando salvar artigo no banco: ${article.id}`);
            const saved = await db.saveArticleToDB(article);
            if (saved) {
                console.log(`✅ Artigo salvo no banco: ${article.id}`);
                // Limpar posts antigos periodicamente (apenas a cada 10 artigos para performance)
                if (Math.random() < 0.1) {
                    await db.cleanupOldPosts(100);
                }
                return saved;
            } else {
                console.warn('⚠️ saveArticleToDB retornou null, usando fallback');
            }
        } catch (error) {
            console.warn('⚠️ Erro ao salvar no banco, usando fallback de arquivo:', error.message);
            console.error('Stack:', error.stack);
        }
    } else {
        console.log('⚠️ Banco não disponível para salvar, usando arquivo');
    }

    // Fallback: salvar em arquivo
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
    // Tentar carregar do banco primeiro (se disponível)
    if (db && db.hasPostgres) {
        try {
            console.log('🔄 Tentando carregar posts do banco...');
            const posts = await db.loadPostsFromDB(100);
            if (posts !== null && Array.isArray(posts)) {
                console.log(`✅ Carregados ${posts.length} posts do banco`);
                return posts;
            } else {
                console.log('⚠️ Banco retornou null ou não é array, usando fallback');
            }
        } catch (error) {
            console.warn('⚠️ Erro ao carregar do banco, usando fallback de arquivo:', error.message);
            console.error('Stack:', error.stack);
        }
    } else {
        console.log('⚠️ Banco não disponível (db:', !!db, 'hasPostgres:', db?.hasPostgres, ')');
    }

    // Fallback: carregar de arquivo
    console.log('🔄 Tentando carregar posts de arquivo...');
    await ensureBlogDataDir();
    
    try {
        const data = await fs.readFile(POSTS_FILE, 'utf8');
        const posts = JSON.parse(data);
        console.log(`✅ Carregados ${posts.length} posts de arquivo`);
        return posts;
    } catch (error) {
        console.log('⚠️ Arquivo não encontrado ou vazio');
        return [];
    }
}

// Carregar post específico
async function loadPost(id) {
    // Tentar carregar do banco primeiro (se disponível)
    if (db && db.hasPostgres) {
        try {
            const post = await db.loadPostFromDB(id);
            if (post !== null) {
                return post;
            }
        } catch (error) {
            console.warn('⚠️ Erro ao carregar post do banco, usando fallback de arquivo:', error.message);
        }
    }

    // Fallback: carregar de arquivo
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

    // 4. RSS Feeds
    try {
        const RSS_FEEDS = [
            { url: 'https://www.valor.com.br/rss', name: 'Valor Econômico' },
            { url: 'https://exame.com/feed/', name: 'Exame' },
            { url: 'https://agenciabrasil.ebc.com.br/rss', name: 'Agência Brasil' },
            { url: 'https://www.reuters.com/rssFeed/worldNews', name: 'Reuters' }
        ];

        for (const feed of RSS_FEEDS) {
            try {
                const feedData = await fetchRSSFeed(feed.url);
                if (feedData && feedData.items && feedData.items.length > 0) {
                    // Processar apenas os 2 primeiros itens mais recentes de cada feed
                    const recentItems = feedData.items.slice(0, 2);
                    for (const item of recentItems) {
                        // Filtrar apenas notícias relevantes (com palavras-chave)
                        const keywords = ['comércio', 'exportação', 'importação', 'trade', 'economia', 'brasil', 'internacional'];
                        const titleLower = (item.title || '').toLowerCase();
                        const descLower = (item.description || item.contentSnippet || '').toLowerCase();
                        const isRelevant = keywords.some(keyword => 
                            titleLower.includes(keyword) || descLower.includes(keyword)
                        );

                        if (isRelevant) {
                            const article = generateArticleFromData(item, 'rss');
                            await saveArticle(article);
                            articles.push(article);
                            console.log(`✅ Artigo RSS gerado: ${article.title}`);
                        }
                    }
                }
            } catch (error) {
                console.error(`❌ Erro ao processar feed ${feed.name}:`, error.message);
            }
        }
    } catch (error) {
        console.error('❌ Erro ao processar RSS Feeds:', error.message);
    }

    // 5. Criar artigos de exemplo para outras categorias (se não houver)
    // Isso garante que todas as categorias tenham conteúdo
    try {
        const existingPosts = await loadPosts();
        const categories = ['analises', 'guias', 'noticias', 'insights'];
        
        for (const cat of categories) {
            const hasCategoryPosts = existingPosts.some(p => p.category === cat);
            if (!hasCategoryPosts && articles.length < 10) {
                // Criar artigo de exemplo para categoria vazia
                const exampleArticle = generateExampleArticle(cat);
                await saveArticle(exampleArticle);
                articles.push(exampleArticle);
                console.log(`✅ Artigo de exemplo criado para categoria: ${cat}`);
            }
        }
    } catch (error) {
        console.warn('⚠️ Erro ao criar artigos de exemplo:', error.message);
    }

    console.log(`✅ Processamento concluído. ${articles.length} artigos gerados.`);
    return articles;
}

module.exports = {
    fetchComexStatData,
    fetchUNComtradeData,
    fetchWorldBankData,
    fetchRSSFeed,
    generateArticleFromData,
    generateExampleArticle,
    saveArticle,
    loadPosts,
    loadPost,
    processAllSources
};
