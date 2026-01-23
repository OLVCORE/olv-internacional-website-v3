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
        // Tentar usar rss-parser se disponível
        let Parser;
        try {
            Parser = require('rss-parser');
        } catch (e) {
            console.warn('⚠️ rss-parser não disponível, tentando fetch direto');
            // Fallback: fazer fetch direto e tentar parse básico
            const response = await axios.get(feedUrl, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; OLV-Blog/1.0)'
                }
            });
            
            // Parse básico de XML (simplificado)
            const xmlText = response.data;
            const items = [];
            
            // Extrair itens do RSS (regex simples para casos básicos)
            const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
            let match;
            let count = 0;
            
            while ((match = itemRegex.exec(xmlText)) !== null && count < 5) {
                const itemXml = match[1];
                const titleMatch = itemXml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
                const descMatch = itemXml.match(/<description[^>]*>([\s\S]*?)<\/description>/i);
                const linkMatch = itemXml.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
                const pubDateMatch = itemXml.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i);
                
                // Extrair imagem de várias fontes possíveis
                let imageUrl = null;
                // Tentar <enclosure>
                const enclosureMatch = itemXml.match(/<enclosure[^>]*url=["']([^"']+)["'][^>]*type=["']image\/([^"']+)["']/i);
                if (enclosureMatch) {
                    imageUrl = enclosureMatch[1];
                }
                // Tentar <media:content> ou <media:thumbnail>
                if (!imageUrl) {
                    const mediaMatch = itemXml.match(/<media:(?:content|thumbnail)[^>]*url=["']([^"']+)["']/i);
                    if (mediaMatch) {
                        imageUrl = mediaMatch[1];
                    }
                }
                // Tentar primeira <img> no description
                if (!imageUrl && descMatch) {
                    const imgMatch = descMatch[1].match(/<img[^>]*src=["']([^"']+)["']/i);
                    if (imgMatch) {
                        imageUrl = imgMatch[1];
                    }
                }
                
                if (titleMatch) {
                    items.push({
                        title: titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim(),
                        description: descMatch ? descMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : '',
                        contentSnippet: descMatch ? descMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : '',
                        link: linkMatch ? linkMatch[1].trim() : '',
                        pubDate: pubDateMatch ? pubDateMatch[1].trim() : new Date().toISOString(),
                        image: imageUrl || null
                    });
                    count++;
                }
            }
            
            return {
                items: items,
                title: 'RSS Feed',
                link: feedUrl
            };
        }
        
        // Usar rss-parser se disponível
        if (Parser) {
            const parser = new Parser({
                timeout: 10000,
                customFields: {
                    item: ['dc:creator', 'content:encoded', 'dc:date', 'published']
                }
            });
            
            const feed = await parser.parseURL(feedUrl);
            // Garantir que todos os itens tenham pubDate (usar isoDate se disponível)
            if (feed.items) {
                feed.items = feed.items.map(item => {
                    // Se não tem pubDate mas tem isoDate, usar isoDate
                    if (!item.pubDate && item.isoDate) {
                        item.pubDate = item.isoDate;
                    }
                    // Se não tem pubDate mas tem published, usar published
                    if (!item.pubDate && item.published) {
                        item.pubDate = item.published;
                    }
                    // Se não tem pubDate mas tem dc:date, usar dc:date
                    if (!item.pubDate && item['dc:date']) {
                        item.pubDate = item['dc:date'];
                    }
                    return item;
                });
            }
            return {
                items: feed.items || [],
                title: feed.title || '',
                link: feed.link || feedUrl
            };
        }
        
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
    
    // Extrair data de publicação real da fonte (se disponível)
    let sourcePublishedDate = null;
    if (type === 'rss') {
        // Tentar extrair de várias fontes possíveis
        const pubDateSource = data.pubDate || data.isoDate || data['dc:date'] || data.published;
        if (pubDateSource) {
            try {
                const parsedDate = new Date(pubDateSource);
                if (!isNaN(parsedDate.getTime())) {
                    sourcePublishedDate = parsedDate.toISOString();
                    console.log(`📅 Data da fonte extraída: ${parsedDate.toLocaleDateString('pt-BR')} de ${pubDateSource}`);
                }
            } catch (e) {
                console.warn('⚠️ Erro ao parsear data da fonte:', e, 'Valor:', pubDateSource);
            }
        } else {
            console.warn('⚠️ Nenhuma data de publicação encontrada no item RSS');
        }
    }
    
    let article = {
        id: articleId,
        title: '',
        excerpt: '',
        content: '',
        category: 'analises',
        // Para RSS: usar data da fonte se disponível, senão usar hoje (para aparecer no ticker)
        // Para outras fontes: usar hoje
        datePublished: (type === 'rss' && sourcePublishedDate) ? sourcePublishedDate : now.toISOString(),
        dateModified: now.toISOString(),
        sourcePublishedDate: sourcePublishedDate || null, // Data original da fonte
        icon: 'fas fa-chart-line',
        readTime: 5,
        source: type,
        dataSource: data,
        image: null // Será preenchido se houver imagem
    };
    
    // Extrair imagem se for RSS
    if (type === 'rss' && data.image) {
        article.image = data.image;
    }
    
    // Se não tem imagem e é RSS, tentar gerar ícone inteligente
    if (type === 'rss' && !article.image) {
        try {
            const { generateIconForArticle } = require('./blog-image-fallback');
            const iconConfig = generateIconForArticle(article);
            article.icon = iconConfig.icon;
            // Armazenar gradient para uso no frontend se necessário
            article.iconGradient = iconConfig.gradient;
        } catch (e) {
            // Se módulo não disponível, usar ícone padrão
            console.warn('⚠️ Módulo de fallback de imagem não disponível');
        }
    }

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
            // Ícone será definido pelo fallback se não houver imagem
            // Se já foi definido pelo fallback acima, manter; senão usar padrão
            if (!article.icon) {
                article.icon = 'fas fa-newspaper';
            }
            article.title = data.title || 'Notícia de Comércio Exterior';
            article.excerpt = data.description || data.contentSnippet || '';
            article.content = generateRSSContent(data);
            // Imagem já foi extraída no objeto article acima
            if (data.image) {
                article.image = data.image;
            }
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
        <p>Os dados mostram as tendências de importação e exportação do Brasil, fornecendo insights valiosos para empresas que operam no comércio exterior. A análise de dados oficiais permite identificar padrões de mercado, entender fluxos comerciais e tomar decisões estratégicas fundamentadas.</p>
        
        <p>O Brasil mantém uma posição relevante no cenário internacional de comércio, com destaque para produtos agrícolas, minerais e manufaturados. A compreensão desses fluxos é essencial para empresas que buscam expandir suas operações internacionais.</p>
        
        <blockquote>
            <p>A análise de dados oficiais é fundamental para tomada de decisões estratégicas no comércio exterior. Cada decisão deve ser sustentada por informações precisas e atualizadas.</p>
        </blockquote>
        
        <h3>Análise de Tendências</h3>
        <p>Os dados do ComexStat revelam padrões importantes sobre o comportamento do comércio exterior brasileiro. Essas informações são cruciais para:</p>
        <ul>
            <li><strong>Identificar oportunidades de mercado:</strong> Compreender quais produtos e destinos apresentam maior potencial</li>
            <li><strong>Entender tendências setoriais:</strong> Acompanhar a evolução de diferentes setores da economia</li>
            <li><strong>Planejar estratégias de importação e exportação:</strong> Baseando decisões em dados reais e não em suposições</li>
            <li><strong>Antecipar mudanças regulatórias:</strong> Identificar padrões que podem indicar mudanças futuras</li>
        </ul>
        
        <h3>Implicações Estratégicas</h3>
        <p>Para empresas que operam no comércio exterior, esses dados representam uma ferramenta poderosa de planejamento estratégico. A OLV Internacional utiliza essas informações para desenvolver análises personalizadas que ajudam nossos clientes a tomar decisões mais assertivas.</p>
        
        <p>A análise de dados históricos permite identificar padrões recorrentes, sazonalidades e tendências de longo prazo. Essas informações são fundamentais para a construção de estratégias de importação e exportação que minimizam riscos e maximizam oportunidades.</p>
        
        <div style="background: var(--bg-secondary); padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid var(--accent-primary);">
            <p style="margin: 0;"><strong>Fonte Oficial:</strong> Ministério da Indústria, Comércio Exterior e Serviços (MDIC) - ComexStat</p>
            <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.8;">Dados públicos e oficiais. A OLV Internacional não produz ou modifica essas informações, apenas analisa e apresenta insights estratégicos baseados nos dados oficiais.</p>
        </div>
    `;
}

// Gerar conteúdo HTML para artigo do UN Comtrade
function generateUNComtradeContent(data) {
    if (!data) {
        return '<p>Dados não disponíveis no momento.</p>';
    }

    return `
        <h2>Tendências Globais de Comércio Internacional</h2>
        <p>Análise baseada em dados da UN Comtrade, cobrindo mais de 200 países e bilhões de transações comerciais internacionais.</p>
        
        <h3>Panorama Internacional</h3>
        <p>Os dados globais revelam padrões importantes no comércio internacional que impactam diretamente as estratégias de empresas brasileiras. A compreensão desses fluxos globais é essencial para empresas que buscam expandir suas operações além das fronteiras nacionais.</p>
        
        <p>O comércio internacional está em constante evolução, com novos players emergindo, rotas comerciais se reconfigurando e oportunidades surgindo em diferentes regiões do mundo. A análise desses dados permite identificar tendências antes que se tornem evidentes para o mercado em geral.</p>
        
        <h3>Análise de Fluxos Comerciais</h3>
        <p>Os dados da UN Comtrade mostram como diferentes países se relacionam comercialmente, quais produtos são mais comercializados entre regiões e quais rotas comerciais são mais utilizadas. Essas informações são valiosas para:</p>
        <ul>
            <li><strong>Identificar novos mercados:</strong> Descobrir países e regiões com potencial para seus produtos</li>
            <li><strong>Entender competidores globais:</strong> Analisar quem está exportando para onde e em que volumes</li>
            <li><strong>Planejar estratégias de expansão:</strong> Baseando decisões em dados reais de mercado</li>
            <li><strong>Antecipar mudanças de demanda:</strong> Identificar tendências antes que se tornem mainstream</li>
        </ul>
        
        <h3>Oportunidades Estratégicas</h3>
        <p>Com base na análise de dados internacionais, identificamos oportunidades estratégicas para empresas que buscam expandir suas operações globais. A OLV Internacional utiliza essas informações para desenvolver análises personalizadas que ajudam nossos clientes a identificar os melhores mercados para seus produtos e serviços.</p>
        
        <p>A análise comparativa entre diferentes países e regiões permite identificar padrões de comportamento comercial, preferências de mercado e oportunidades de negócio que podem não ser evidentes em análises superficiais.</p>
        
        <div style="background: var(--bg-secondary); padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid var(--accent-primary);">
            <p style="margin: 0;"><strong>Fonte Oficial:</strong> United Nations Comtrade Database (UN Comtrade)</p>
            <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.8;">Dados públicos e oficiais das Nações Unidas. A OLV Internacional não produz ou modifica essas informações, apenas analisa e apresenta insights estratégicos baseados nos dados oficiais.</p>
        </div>
    `;
}

// Gerar conteúdo HTML para artigo do World Bank
function generateWorldBankContent(data) {
    if (!data) {
        return '<p>Dados não disponíveis no momento.</p>';
    }

    return `
        <h2>Indicadores Econômicos Globais e Comércio Internacional</h2>
        <p>Análise de indicadores econômicos globais relacionados ao comércio exterior, baseada em dados oficiais do Banco Mundial.</p>
        
        <h3>Contexto Econômico Global</h3>
        <p>Os indicadores econômicos globais fornecem contexto importante para decisões estratégicas em comércio exterior. A compreensão desses indicadores é fundamental para empresas que operam internacionalmente, pois eles refletem a saúde econômica de diferentes países e regiões, impactando diretamente as oportunidades e riscos comerciais.</p>
        
        <p>Indicadores como PIB, inflação, taxa de câmbio, balança comercial e índices de desenvolvimento econômico são essenciais para entender o ambiente de negócios em diferentes mercados. Essas informações ajudam empresas a avaliar a viabilidade de operações comerciais em diferentes países.</p>
        
        <h3>Análise de Indicadores Chave</h3>
        <p>Os dados do Banco Mundial cobrem uma ampla gama de indicadores que são relevantes para o comércio exterior:</p>
        <ul>
            <li><strong>Crescimento Econômico:</strong> PIB e taxas de crescimento indicam o potencial de mercado</li>
            <li><strong>Estabilidade Monetária:</strong> Inflação e taxas de câmbio afetam custos e preços</li>
            <li><strong>Comércio Exterior:</strong> Balança comercial e volumes de importação/exportação</li>
            <li><strong>Desenvolvimento:</strong> Índices de desenvolvimento humano e econômico</li>
            <li><strong>Infraestrutura:</strong> Indicadores de logística e conectividade</li>
        </ul>
        
        <h3>Impacto nos Negócios</h3>
        <p>Esses indicadores ajudam empresas a entender o ambiente econômico global e tomar decisões mais informadas sobre onde investir, para onde exportar e de onde importar. A análise desses dados permite identificar mercados promissores, avaliar riscos econômicos e planejar estratégias de longo prazo.</p>
        
        <p>Para empresas brasileiras que buscam expandir suas operações internacionais, a compreensão desses indicadores é essencial. Eles fornecem uma base sólida para decisões estratégicas, ajudando a minimizar riscos e maximizar oportunidades em mercados internacionais.</p>
        
        <h3>Aplicação Prática</h3>
        <p>A OLV Internacional utiliza esses indicadores para desenvolver análises personalizadas que ajudam nossos clientes a identificar os melhores mercados para suas operações, avaliar riscos econômicos e planejar estratégias de expansão internacional baseadas em dados concretos.</p>
        
        <div style="background: var(--bg-secondary); padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid var(--accent-primary);">
            <p style="margin: 0;"><strong>Fonte Oficial:</strong> World Bank Open Data (Banco Mundial)</p>
            <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.8;">Dados públicos e oficiais do Banco Mundial. A OLV Internacional não produz ou modifica essas informações, apenas analisa e apresenta insights estratégicos baseados nos dados oficiais.</p>
        </div>
    `;
}

// Gerar conteúdo HTML para artigo de RSS
function generateRSSContent(data) {
    const content = data.content || data.contentSnippet || data.description || '';
    const pubDate = data.pubDate ? new Date(data.pubDate).toLocaleDateString('pt-BR') : '';
    const source = data.creator || data['dc:creator'] || data.source || 'Agência de Notícias';
    
    // Extrair nome da fonte da URL se disponível
    let sourceName = source;
    if (data.link) {
        try {
            const url = new URL(data.link);
            if (url.hostname.includes('valor.com.br')) sourceName = 'Valor Econômico';
            else if (url.hostname.includes('exame.com')) sourceName = 'Exame';
            else if (url.hostname.includes('ebc.com.br') || url.hostname.includes('agenciabrasil')) sourceName = 'Agência Brasil';
            else if (url.hostname.includes('reuters.com')) sourceName = 'Reuters';
        } catch (e) {
            // Manter sourceName original
        }
    }
    
    return `
        <h2>${data.title || 'Notícia'}</h2>
        ${pubDate ? `
            <div style="background: var(--bg-secondary); padding: 12px 16px; border-radius: 8px; margin-bottom: 24px; border-left: 3px solid var(--accent-primary);">
                <p style="margin: 0; color: var(--text-primary); font-size: 14px;">
                    <i class="fas fa-calendar" style="color: var(--accent-primary); margin-right: 8px;"></i>
                    <strong>Publicado pela fonte em:</strong> ${pubDate}
                </p>
            </div>
        ` : ''}
        
        <div style="line-height: 1.8; margin-bottom: 24px;">
            ${content ? content : '<p>Conteúdo da notícia não disponível no momento.</p>'}
        </div>
        
        ${data.link ? `
            <div style="background: var(--bg-secondary); padding: 16px; border-radius: 8px; margin: 24px 0; border-left: 4px solid var(--accent-primary);">
                <p style="margin: 0 0 12px 0; color: var(--text-primary);"><strong>Leia a notícia completa na fonte original:</strong></p>
                <a href="${data.link}" target="_blank" rel="noopener noreferrer" style="color: var(--accent-primary); text-decoration: none; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; font-size: 14px;">
                    ${data.link} <i class="fas fa-external-link-alt"></i>
                </a>
                <p style="margin: 12px 0 0 0; font-size: 12px; color: var(--text-tertiary);">
                    <i class="fas fa-info-circle"></i> Ao clicar, você será redirecionado para a fonte original. A OLV Internacional não produz ou modifica essas informações.
                </p>
            </div>
        ` : ''}
        
        <div style="background: var(--bg-secondary); padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid var(--accent-primary);">
            <p style="margin: 0; color: var(--text-primary);"><strong><i class="fas fa-newspaper" style="color: var(--accent-primary); margin-right: 8px;"></i>Fonte Oficial:</strong> ${sourceName}</p>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: var(--text-secondary);">Esta notícia foi publicada originalmente pela fonte indicada. A OLV Internacional não produz ou modifica essas informações, apenas compartilha notícias relevantes sobre comércio exterior de fontes confiáveis.</p>
        </div>
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
            { url: 'https://www.reuters.com/rssFeed/worldNews', name: 'Reuters' },
            // Novas fontes adicionadas
            { url: 'https://www.bcb.gov.br/rss/noticias/moedaestabilidadefin.xml', name: 'Banco Central do Brasil' },
            { url: 'https://www.iccwbo.org/news-publications/news/rss/', name: 'Câmara de Comércio Internacional' },
            { url: 'https://feeds.bloomberg.com/markets/news.rss', name: 'Bloomberg Markets' }
        ];

        for (const feed of RSS_FEEDS) {
            try {
                const feedData = await fetchRSSFeed(feed.url);
                if (feedData && feedData.items && feedData.items.length > 0) {
                    // Processar os 5 primeiros itens mais recentes de cada feed (aumentado de 2 para 5)
                    const recentItems = feedData.items.slice(0, 5);
                    for (const item of recentItems) {
                        // Filtrar apenas notícias relevantes (com palavras-chave)
                        const keywords = ['comércio', 'exportação', 'importação', 'trade', 'economia', 'brasil', 'internacional', 'mercado', 'negócio', 'empresa', 'indústria'];
                        const titleLower = (item.title || '').toLowerCase();
                        const descLower = (item.description || item.contentSnippet || '').toLowerCase();
                        const isRelevant = keywords.some(keyword => 
                            titleLower.includes(keyword) || descLower.includes(keyword)
                        );

                        if (isRelevant) {
                            const article = generateArticleFromData(item, 'rss');
                            // Garantir que a data da fonte seja preservada
                            // Se o item tem pubDate, usar essa data como sourcePublishedDate
                            if (item.pubDate && !article.sourcePublishedDate) {
                                try {
                                    article.sourcePublishedDate = new Date(item.pubDate).toISOString();
                                } catch (e) {
                                    console.warn('Erro ao parsear pubDate do item:', e);
                                }
                            }
                            // datePublished será a data da fonte (se disponível) ou hoje
                            // Isso garante que artigos recentes apareçam no ticker
                            if (!article.datePublished || article.datePublished === article.dateModified) {
                                // Se não tem data da fonte, usar hoje para aparecer no ticker
                                article.datePublished = article.sourcePublishedDate || new Date().toISOString();
                            }
                            await saveArticle(article);
                            articles.push(article);
                            const sourceDateStr = article.sourcePublishedDate ? new Date(article.sourcePublishedDate).toLocaleDateString('pt-BR') : 'Data não disponível';
                            console.log(`✅ Artigo RSS gerado: ${article.title}`);
                            console.log(`   📅 Data da fonte: ${sourceDateStr}`);
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
            const categoryPosts = existingPosts.filter(p => p.category === cat);
            // Se categoria tem menos de 2 posts, criar artigo de exemplo
            if (categoryPosts.length < 2) {
                const exampleArticle = generateExampleArticle(cat);
                // Atualizar data para hoje para aparecer no ticker
                exampleArticle.datePublished = new Date().toISOString();
                exampleArticle.dateModified = new Date().toISOString();
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
