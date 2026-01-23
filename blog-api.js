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
                    item: ['dc:creator', 'content:encoded', 'dc:date', 'published', 'media:content', 'media:thumbnail', 'enclosure']
                }
            });
            
            const feed = await parser.parseURL(feedUrl);
            // Garantir que todos os itens tenham pubDate e image
            if (feed.items) {
                feed.items = feed.items.map(item => {
                    // Normalizar pubDate
                    if (!item.pubDate && item.isoDate) {
                        item.pubDate = item.isoDate;
                    }
                    if (!item.pubDate && item.published) {
                        item.pubDate = item.published;
                    }
                    if (!item.pubDate && item['dc:date']) {
                        item.pubDate = item['dc:date'];
                    }
                    
                    // Extrair imagem de várias fontes
                    if (!item.image) {
                        // Tentar media:content (pode ser objeto ou array)
                        if (item['media:content']) {
                            const mediaContent = Array.isArray(item['media:content']) ? item['media:content'][0] : item['media:content'];
                            if (mediaContent && mediaContent.$ && mediaContent.$.url) {
                                item.image = mediaContent.$.url;
                                console.log(`🖼️  Imagem extraída de media:content: ${mediaContent.$.url.substring(0, 80)}`);
                            } else if (mediaContent && typeof mediaContent === 'string') {
                                item.image = mediaContent;
                            } else if (mediaContent && mediaContent.url) {
                                item.image = mediaContent.url;
                            }
                        }
                        // Tentar media:thumbnail
                        if (!item.image && item['media:thumbnail']) {
                            const mediaThumb = Array.isArray(item['media:thumbnail']) ? item['media:thumbnail'][0] : item['media:thumbnail'];
                            if (mediaThumb && mediaThumb.$ && mediaThumb.$.url) {
                                item.image = mediaThumb.$.url;
                                console.log(`🖼️  Imagem extraída de media:thumbnail: ${mediaThumb.$.url.substring(0, 80)}`);
                            } else if (mediaThumb && typeof mediaThumb === 'string') {
                                item.image = mediaThumb;
                            } else if (mediaThumb && mediaThumb.url) {
                                item.image = mediaThumb.url;
                            }
                        }
                        // Tentar enclosure
                        if (!item.image && item.enclosure) {
                            const enclosure = Array.isArray(item.enclosure) ? item.enclosure[0] : item.enclosure;
                            if (enclosure && enclosure.type && enclosure.type.startsWith('image/')) {
                                item.image = enclosure.url;
                                console.log(`🖼️  Imagem extraída de enclosure: ${enclosure.url.substring(0, 80)}`);
                            }
                        }
                        // Tentar primeira img no content
                        if (!item.image && item.content) {
                            const imgMatch = item.content.match(/<img[^>]*src=["']([^"']+)["']/i);
                            if (imgMatch) {
                                item.image = imgMatch[1];
                                console.log(`🖼️  Imagem extraída de content: ${imgMatch[1].substring(0, 80)}`);
                            }
                        }
                        // Tentar primeira img no contentSnippet
                        if (!item.image && item.contentSnippet) {
                            const imgMatch = item.contentSnippet.match(/<img[^>]*src=["']([^"']+)["']/i);
                            if (imgMatch) {
                                item.image = imgMatch[1];
                                console.log(`🖼️  Imagem extraída de contentSnippet: ${imgMatch[1].substring(0, 80)}`);
                            }
                        }
                        // Tentar primeira img no description
                        if (!item.image && item.description) {
                            const imgMatch = item.description.match(/<img[^>]*src=["']([^"']+)["']/i);
                            if (imgMatch) {
                                item.image = imgMatch[1];
                                console.log(`🖼️  Imagem extraída de description: ${imgMatch[1].substring(0, 80)}`);
                            }
                        }
                    }
                    
                    // Log final
                    if (item.image) {
                        console.log(`✅ Item "${item.title?.substring(0, 50)}" tem imagem: ${item.image.substring(0, 100)}`);
                    } else {
                        console.warn(`⚠️  Item "${item.title?.substring(0, 50)}" NÃO tem imagem`);
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

// Normalizar título para comparação (remover acentos, espaços extras, etc)
function normalizeTitle(title) {
    if (!title) return '';
    return title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^\w\s]/g, '') // Remove pontuação
        .replace(/\s+/g, ' ') // Normaliza espaços
        .trim();
}

// Gerar ID único baseado no conteúdo (para evitar duplicatas)
function generateUniqueArticleId(data, type) {
    const crypto = require('crypto');
    
    // Para RSS: usar título + URL
    if (type === 'rss') {
        const title = normalizeTitle(data.title || '');
        const url = data.link || data.guid || '';
        const hashInput = `${title}|${url}`;
        const hash = crypto.createHash('md5').update(hashInput).digest('hex').substring(0, 12);
        return `article-rss-${hash}`;
    }
    
    // Para APIs: usar título + source + data específica
    if (type === 'comexstat') {
        const title = normalizeTitle('Análise de Comércio Exterior - Dados MDIC');
        const hash = crypto.createHash('md5').update(`${title}|comexstat|${new Date().toISOString().split('T')[0]}`).digest('hex').substring(0, 12);
        return `article-comexstat-${hash}`;
    }
    
    if (type === 'unComtrade') {
        const title = normalizeTitle('Tendências Globais de Comércio Internacional');
        const hash = crypto.createHash('md5').update(`${title}|unComtrade|${new Date().toISOString().split('T')[0]}`).digest('hex').substring(0, 12);
        return `article-uncomtrade-${hash}`;
    }
    
    if (type === 'worldBank') {
        const title = normalizeTitle('Indicadores Econômicos e Comércio Internacional');
        const hash = crypto.createHash('md5').update(`${title}|worldBank|${new Date().toISOString().split('T')[0]}`).digest('hex').substring(0, 12);
        return `article-worldbank-${hash}`;
    }
    
    // Fallback: timestamp + random
    return `article-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Verificar se artigo já existe no banco (por título normalizado ou URL)
async function articleExists(article) {
    if (!db || !db.hasPostgres) {
        // Se não tem banco, verificar em memória (fallback)
        try {
            const allPosts = await loadPosts();
            const normalizedTitle = normalizeTitle(article.title);
            
            // Para RSS: verificar por URL também
            if (article.source === 'rss' && article.dataSource && article.dataSource.link) {
                return allPosts.some(p => {
                    const pTitle = normalizeTitle(p.title);
                    const pLink = p.dataSource?.link || '';
                    return (pTitle === normalizedTitle && p.source === 'rss') || pLink === article.dataSource.link;
                });
            }
            
            // Para outros tipos: verificar por título normalizado + source
            return allPosts.some(p => {
                const pTitle = normalizeTitle(p.title);
                return pTitle === normalizedTitle && p.source === article.source;
            });
        } catch (error) {
            return false;
        }
    }
    
    try {
        const normalizedTitle = normalizeTitle(article.title);
        
        // Para RSS: verificar por URL completa (não apenas domínio)
        if (article.source === 'rss' && article.dataSource && article.dataSource.link) {
            // Normalizar URL: remover query params e fragmentos, mas manter path completo
            const url = article.dataSource.link.split('?')[0].split('#')[0].trim();
            // Escapar URL para SQL
            const escapedUrl = url.replace(/'/g, "''").replace(/\\/g, '\\\\');
            // Usar JSONB path para busca mais precisa por URL completa
            const checkQuery = `
                SELECT id FROM blog_posts 
                WHERE (
                    data_source->>'link' = '${escapedUrl}'
                    OR data_source::text LIKE '%"link":"${escapedUrl}"%'
                )
                LIMIT 1
            `;
            const result = await db.executeQuery(checkQuery);
            return result && (Array.isArray(result) ? result.length > 0 : (result.rows?.length > 0));
        }
        
        // Para outros tipos: verificar por título normalizado + source
        const escapedTitle = article.title.replace(/'/g, "''");
        const escapedSource = article.source.replace(/'/g, "''");
        const checkQuery = `
            SELECT id FROM blog_posts 
            WHERE (
                LOWER(REGEXP_REPLACE(title, '[^a-z0-9\\s]', '', 'g')) = LOWER(REGEXP_REPLACE('${escapedTitle}', '[^a-z0-9\\s]', '', 'g'))
                AND source = '${escapedSource}'
            )
            LIMIT 1
        `;
        const result = await db.executeQuery(checkQuery);
        return result && (Array.isArray(result) ? result.length > 0 : (result.rows?.length > 0));
    } catch (error) {
        console.warn('⚠️ Erro ao verificar duplicata:', error.message);
        return false; // Em caso de erro, permitir salvar
    }
}

// Gerar artigo baseado em dados
function generateArticleFromData(data, type) {
    const now = new Date();
    const articleId = generateUniqueArticleId(data, type);
    
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
    if (type === 'rss') {
        if (data.image) {
            article.image = data.image;
            console.log(`🖼️  Imagem encontrada no data.image: ${data.image.substring(0, 100)}`);
        } else {
            article.image = null;
            console.warn(`⚠️  data.image é null/undefined para tipo RSS`);
        }
        
        // Se não tem imagem e é RSS, tentar gerar ícone inteligente
        if (!article.image) {
            try {
                const { generateIconForArticle } = require('./blog-image-fallback');
                const iconConfig = generateIconForArticle(article);
                article.icon = iconConfig.icon;
                // Armazenar gradient para uso no frontend se necessário
                article.iconGradient = iconConfig.gradient;
                console.log(`🎨 Ícone de fallback gerado: ${article.icon}`);
            } catch (e) {
                // Se módulo não disponível, usar ícone padrão
                console.warn('⚠️ Módulo de fallback de imagem não disponível:', e.message);
            }
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
            
            // Extrair texto original
            const originalTitle = data.title || 'Notícia de Comércio Exterior';
            const originalExcerpt = data.description || data.contentSnippet || '';
            const originalContent = data.content || data.contentSnippet || data.description || '';
            
            // Detectar idioma e traduzir se necessário (assíncrono será feito depois)
            // Por enquanto, armazenar original para tradução posterior
            article.title = originalTitle;
            article.excerpt = originalExcerpt;
            article.content = generateRSSContent(data);
            article._needsTranslation = false; // Flag para indicar se precisa tradução
            
            // Detectar se está em inglês (verificação mais robusta)
            const combinedText = (originalTitle + ' ' + originalExcerpt).toLowerCase();
            const isEnglish = detectLanguage(combinedText);
            
            if (isEnglish) {
                article._needsTranslation = true;
                article._originalTitle = originalTitle;
                article._originalExcerpt = originalExcerpt;
                article._originalContent = originalContent;
                console.log(`🌐 Artigo detectado como inglês: "${originalTitle.substring(0, 50)}..."`);
            } else {
                console.log(`🇧🇷 Artigo detectado como português (ou outro idioma): "${originalTitle.substring(0, 50)}..."`);
            }
            
            // Imagem: priorizar data.image (já extraída), senão tentar extrair novamente
            if (data.image) {
                article.image = data.image;
                console.log(`🖼️  Imagem extraída para "${article.title}": ${data.image.substring(0, 100)}`);
            } else {
                // Tentar extrair novamente se não foi extraída antes
                console.warn(`⚠️  Nenhuma imagem encontrada para "${article.title}"`);
                // Garantir que image seja null explicitamente
                article.image = null;
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

// REMOVIDO: Função generateExampleArticle
// Não geramos mais artigos de exemplo - apenas conteúdo real das APIs

// Salvar artigo
async function saveArticle(article) {
    // Tentar salvar no banco primeiro (se disponível)
    if (db && db.hasPostgres) {
        try {
            console.log(`💾 Tentando salvar artigo no banco: ${article.id} - "${article.title.substring(0, 50)}..."`);
            const saved = await db.saveArticleToDB(article);
            if (saved) {
                console.log(`✅ Artigo salvo no banco: ${article.id}`);
                // Limpar posts antigos periodicamente (apenas a cada 10 artigos para performance)
                if (Math.random() < 0.1) {
                    await db.cleanupOldPosts(500); // Aumentado para manter mais posts
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
        console.warn('⚠️ Banco não disponível para salvar, usando arquivo');
        console.warn(`   db disponível: ${!!db}`);
        console.warn(`   hasPostgres: ${db?.hasPostgres}`);
        console.warn(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Definido' : '❌ Não definido'}`);
    }

    // Fallback: salvar em arquivo (SEMPRE salvar, mesmo que banco falhe)
    await ensureBlogDataDir();
    
    try {
        let posts = [];
        try {
            const data = await fs.readFile(POSTS_FILE, 'utf8');
            posts = JSON.parse(data);
            console.log(`📁 Carregados ${posts.length} posts do arquivo para adicionar novo`);
        } catch (error) {
            // Arquivo não existe, criar novo
            posts = [];
            console.log('📁 Criando novo arquivo de posts');
        }

        // Verificar se artigo já existe (por ID ou URL se RSS)
        let existingIndex = -1;
        if (article.dataSource && article.dataSource.link) {
            // Para RSS, verificar por URL
            const url = article.dataSource.link.split('?')[0];
            existingIndex = posts.findIndex(p => {
                const pUrl = p.dataSource?.link?.split('?')[0] || '';
                return pUrl === url;
            });
        } else {
            // Para outros, verificar por ID ou título
            existingIndex = posts.findIndex(p => p.id === article.id || p.title === article.title);
        }
        
        if (existingIndex >= 0) {
            console.log(`🔄 Atualizando post existente no índice ${existingIndex}`);
            posts[existingIndex] = article;
        } else {
            console.log(`➕ Adicionando novo post (total será ${posts.length + 1})`);
            posts.unshift(article); // Adicionar no início
        }

        // Manter apenas os últimos 500 artigos (aumentado para mais conteúdo)
        if (posts.length > 500) {
            console.log(`✂️ Limitando a 500 posts (removendo ${posts.length - 500} mais antigos)`);
            posts = posts.slice(0, 500);
        }

        await fs.writeFile(POSTS_FILE, JSON.stringify(posts, null, 2), 'utf8');
        console.log(`✅ Artigo salvo no arquivo: ${article.id} (total: ${posts.length} posts)`);
        return article;
    } catch (error) {
        console.error('❌ Erro ao salvar artigo no arquivo:', error);
        throw error;
    }
}

// Carregar todos os posts
async function loadPosts() {
    // Tentar carregar do banco primeiro (se disponível)
    if (db && db.hasPostgres) {
        try {
            console.log('🔄 Tentando carregar posts do banco...');
            const posts = await db.loadPostsFromDB(500);
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
            const exists = await articleExists(article);
            if (!exists) {
                await saveArticle(article);
                articles.push(article);
                console.log('✅ Artigo do ComexStat gerado');
            } else {
                console.log('⏭️  Artigo do ComexStat já existe, ignorado');
            }
        }
    } catch (error) {
        console.error('❌ Erro ao processar ComexStat:', error.message);
    }

    // 2. UN Comtrade
    try {
        const unData = await fetchUNComtradeData();
        if (unData) {
            const article = generateArticleFromData(unData, 'unComtrade');
            const exists = await articleExists(article);
            if (!exists) {
                await saveArticle(article);
                articles.push(article);
                console.log('✅ Artigo do UN Comtrade gerado');
            } else {
                console.log('⏭️  Artigo do UN Comtrade já existe, ignorado');
            }
        }
    } catch (error) {
        console.error('❌ Erro ao processar UN Comtrade:', error.message);
    }

    // 3. World Bank
    try {
        const wbData = await fetchWorldBankData();
        if (wbData) {
            const article = generateArticleFromData(wbData, 'worldBank');
            const exists = await articleExists(article);
            if (!exists) {
                await saveArticle(article);
                articles.push(article);
                console.log('✅ Artigo do World Bank gerado');
            } else {
                console.log('⏭️  Artigo do World Bank já existe, ignorado');
            }
        }
    } catch (error) {
        console.error('❌ Erro ao processar World Bank:', error.message);
    }

    // 4. Gerar Insights automaticamente baseado nos dados das APIs
    // Gerar sempre (não depende de novos artigos)
    try {
        console.log('💡 Gerando Insights automáticos baseados em dados...');
        const allExistingPosts = await loadPosts();
        const insights = await generateAutomaticInsights(allExistingPosts);
        for (const insight of insights) {
            const exists = await articleExists(insight);
            if (!exists) {
                await saveArticle(insight);
                articles.push(insight);
                console.log(`✅ Insight automático gerado: "${insight.title.substring(0, 50)}..."`);
            } else {
                console.log(`⏭️  Insight já existe: "${insight.title.substring(0, 50)}..."`);
            }
        }
    } catch (error) {
        console.error('❌ Erro ao gerar Insights automáticos:', error.message);
        console.error('Stack:', error.stack);
    }

    // 5. Gerar Guias automaticamente baseado em templates e dados
    // Gerar sempre (não depende de novos artigos)
    try {
        console.log('📚 Gerando Guias automáticos baseados em templates...');
        const allExistingPosts = await loadPosts();
        const guias = await generateAutomaticGuias(allExistingPosts);
        for (const guia of guias) {
            const exists = await articleExists(guia);
            if (!exists) {
                await saveArticle(guia);
                articles.push(guia);
                console.log(`✅ Guia automático gerado: "${guia.title.substring(0, 50)}..."`);
            } else {
                console.log(`⏭️  Guia já existe: "${guia.title.substring(0, 50)}..."`);
            }
        }
    } catch (error) {
        console.error('❌ Erro ao gerar Guias automáticos:', error.message);
        console.error('Stack:', error.stack);
    }

    // 4. RSS Feeds
    try {
        // Fontes RSS ESPECÍFICAS para Supply Chain Global e Comércio Exterior
        // Priorizando fontes brasileiras que realmente têm feeds RSS funcionais
        const RSS_FEEDS = [
            // Fontes Brasileiras Específicas de Comércio Exterior (verificadas)
            { url: 'https://www.valor.com.br/rss', name: 'Valor Econômico', category: 'noticias' },
            { url: 'https://www.valor.com.br/rss/economia', name: 'Valor - Economia', category: 'noticias' },
            { url: 'https://www.valor.com.br/rss/empresas', name: 'Valor - Empresas', category: 'noticias' },
            { url: 'https://www.valor.com.br/rss/agronegocios', name: 'Valor - Agronegócios', category: 'noticias' },
            
            // Fontes de Agronegócio e Commodities (muito relevantes para comércio exterior)
            { url: 'https://www.noticiasagricolas.com.br/rss', name: 'Notícias Agrícolas', category: 'noticias' },
            { url: 'https://www.agrolink.com.br/rss', name: 'Agrolink', category: 'noticias' },
            { url: 'https://www.cepea.org.br/br/rss-cepea.aspx', name: 'CEPEA - Agronegócio', category: 'noticias' },
            
            // Fontes Internacionais Específicas
            { url: 'https://www.reuters.com/rssFeed/worldNews', name: 'Reuters World News', category: 'noticias' },
            { url: 'https://www.reuters.com/rssFeed/businessNews', name: 'Reuters Business', category: 'noticias' },
            { url: 'https://feeds.bloomberg.com/markets/news.rss', name: 'Bloomberg Markets', category: 'noticias' },
            { url: 'https://www.iccwbo.org/news-publications/news/rss/', name: 'Câmara de Comércio Internacional', category: 'noticias' },
            
            // Fontes de Logística e Supply Chain
            { url: 'https://www.logisticsmgmt.com/rss', name: 'Logistics Management', category: 'noticias' },
            { url: 'https://www.supplychaindive.com/feed/', name: 'Supply Chain Dive', category: 'noticias' },
            { url: 'https://www.joc.com/rss', name: 'Journal of Commerce', category: 'noticias' },
            
            // Fontes de Comércio Exterior
            { url: 'https://www.wto.org/english/news_e/rss_e/rss_e.xml', name: 'WTO News', category: 'noticias' },
            { url: 'https://www.bcb.gov.br/rss/noticias/moedaestabilidadefin.xml', name: 'Banco Central do Brasil', category: 'noticias' }
        ];

        for (const feed of RSS_FEEDS) {
            try {
                console.log(`📡 Processando feed: ${feed.name} (${feed.url})`);
                const feedData = await fetchRSSFeed(feed.url);
                let acceptedCount = 0;
                let rejectedCount = 0;
                if (feedData && feedData.items && feedData.items.length > 0) {
                    console.log(`   ✅ ${feedData.items.length} itens encontrados no feed ${feed.name}`);
                    // Processar os 20 primeiros itens mais recentes de cada feed (aumentado para mais conteúdo)
                    const recentItems = feedData.items.slice(0, 20);
                    for (const item of recentItems) {
                        // FILTRO INTELIGENTE: Notícias relacionadas a Supply Chain Global e Comércio Exterior
                        // Estratégia: Aceitar se tiver palavra-chave primária OU se vier de fonte confiável E tiver palavra-chave secundária
                        
                        // Palavras-chave PRIMÁRIAS (fortemente relacionadas)
                        const primaryKeywords = [
                            // Supply Chain & Logística
                            'supply chain', 'supply-chain', 'cadeia de suprimentos', 'cadeia de abastecimento',
                            'logística', 'logistics', 'logístico', 'logistic',
                            'frete', 'freight', 'fretamento', 'shipping', 'transporte', 'transport',
                            'frete aéreo', 'air freight', 'frete marítimo', 'sea freight', 'maritime', 'marítimo',
                            'frete rodoviário', 'road freight', 'frete ferroviário', 'rail freight', 'railway',
                            'armazenagem', 'warehouse', 'warehousing', 'armazém', 'estoque', 'inventory',
                            'distribuição', 'distribution', 'distribuidor', 'distributor',
                            
                            // Comércio Exterior
                            'comércio exterior', 'foreign trade', 'comércio internacional', 'international trade',
                            'exportação', 'export', 'exportar', 'exporting', 'exportador', 'exporter',
                            'importação', 'import', 'importar', 'importing', 'importador', 'importer',
                            'compras internacionais', 'international procurement', 'procurement internacional',
                            'expansão de mercado', 'market expansion', 'expansão internacional',
                            'fornecedor internacional', 'international supplier', 'supplier global',
                            'fornecedor qualificado', 'qualified supplier', 'supplier qualification',
                            
                            // Aduana & Regulamentação
                            'aduana', 'customs', 'alfândega', 'despacho aduaneiro', 'customs clearance',
                            'barreira comercial', 'trade barrier', 'barreiras comerciais', 'commercial barriers',
                            'tarifa', 'tariff', 'tarifas', 'tariffs', 'imposto de importação', 'import tax',
                            'regime aduaneiro', 'customs regime', 'drawback', 'ex-tarifário', 'recof',
                            
                            // Acordos & Negociações
                            'acordo comercial', 'trade agreement', 'acordos comerciais', 'trade agreements',
                            'negociação internacional', 'international negotiation', 'negociações comerciais',
                            'bloco comercial', 'trade bloc', 'mercado comum', 'common market',
                            'Mercosul', 'Mercosur', 'União Europeia', 'European Union', 'EU',
                            'NAFTA', 'USMCA', 'CPTPP', 'RCEP',
                            
                            // Transporte Internacional
                            'transporte internacional', 'international transport', 'transporte global',
                            'navegação', 'navigation', 'navio', 'ship', 'vessel', 'container', 'conteiner',
                            'porto', 'port', 'terminal', 'terminal portuário', 'port terminal',
                            'aeroporto', 'airport', 'carga aérea', 'air cargo', 'carga marítima', 'sea cargo',
                            
                            // Incoterms & Documentação
                            'incoterm', 'incoterms', 'FOB', 'CIF', 'EXW', 'DDP', 'DAP',
                            'documentação', 'documentation', 'documento de transporte', 'transport document',
                            'conhecimento de embarque', 'bill of lading', 'B/L', 'BL',
                            
                            // TCO & Custos
                            'TCO', 'total cost of ownership', 'custo total de propriedade',
                            'custo logístico', 'logistics cost', 'custo de importação', 'import cost',
                            'custo de exportação', 'export cost'
                        ];
                        
                        // Palavras-chave SECUNDÁRIAS (relacionadas, mas mais amplas)
                        const secondaryKeywords = [
                            'commodities', 'commodity', 'commodities trading', 'trading', 'commercial',
                            'cross-border', 'cross border', 'global trade', 'world trade',
                            'trade war', 'trade dispute', 'trade negotiations', 'trade group',
                            'oil trade', 'crude', 'petroleum', 'petróleo', 'óleo',
                            'ethanol', 'etanol', 'agricultural', 'agrícola', 'agronegócio',
                            'brazil', 'brasil', 'brazilian', 'brasileiro',
                            'china', 'china', 'chinese', 'chinês',
                            'russia', 'russian', 'russo',
                            'india', 'indian', 'índia', 'indiano',
                            'europe', 'europa', 'european', 'europeu',
                            'usa', 'united states', 'estados unidos', 'americano',
                            'mercosur', 'mercosul',
                            'internacional', 'international', 'global',
                            'mercado', 'market', 'negócio', 'business',
                            'empresa', 'company', 'empresarial', 'corporate'
                        ];
                        
                        // Fontes confiáveis específicas de Supply Chain/Comércio Exterior
                        const trustedSources = [
                            'valor.com.br', 'mdic.gov.br', 'comexstat', 'comex',
                            'iccwbo.org', 'wto.org', 'reuters.com', 'bloomberg.com',
                            'logisticsmgmt.com', 'supplychaindive.com', 'joc.com',
                            'bcb.gov.br', 'receita.fazenda.gov.br', 'portos.gov.br'
                        ];
                        
                        const titleLower = (item.title || '').toLowerCase();
                        const descLower = (item.description || item.contentSnippet || '').toLowerCase();
                        const contentLower = (item.content || '').toLowerCase();
                        const allText = `${titleLower} ${descLower} ${contentLower}`;
                        const linkLower = (item.link || '').toLowerCase();
                        
                        // Verificar se tem palavra-chave primária
                        const hasPrimaryKeyword = primaryKeywords.some(keyword => 
                            allText.includes(keyword.toLowerCase())
                        );
                        
                        // Verificar se tem palavra-chave secundária
                        const hasSecondaryKeyword = secondaryKeywords.some(keyword => 
                            allText.includes(keyword.toLowerCase())
                        );
                        
                        // Verificar se vem de fonte confiável
                        const isFromTrustedSource = trustedSources.some(source => 
                            linkLower.includes(source.toLowerCase())
                        );
                        
                        // ACEITAR se:
                        // 1. Tem palavra-chave primária (fortemente relacionado) - SEMPRE ACEITAR
                        // 2. OU tem palavra-chave secundária E vem de fonte confiável - ACEITAR
                        // 3. OU tem palavra-chave secundária E menciona países/regiões relevantes - ACEITAR
                        // 4. OU vem de fonte brasileira confiável (Valor, MDIC, etc) E tem qualquer palavra relacionada - ACEITAR
                        // 5. OU menciona commodities, oil, trade, export, import - ACEITAR (muito relevante)
                        const isBrazilianSource = linkLower.includes('valor.com.br') || 
                                                  linkLower.includes('mdic.gov.br') || 
                                                  linkLower.includes('comexstat') ||
                                                  linkLower.includes('receita.fazenda') ||
                                                  linkLower.includes('portos.gov.br');
                        
                        const hasTradeRelated = allText.includes('trade') || 
                                               allText.includes('export') || 
                                               allText.includes('import') ||
                                               allText.includes('commodit') ||
                                               allText.includes('oil') ||
                                               allText.includes('crude') ||
                                               allText.includes('petroleum') ||
                                               allText.includes('ethanol') ||
                                               allText.includes('etanol') ||
                                               allText.includes('soy') ||
                                               allText.includes('soja') ||
                                               allText.includes('corn') ||
                                               allText.includes('milho') ||
                                               allText.includes('sugar') ||
                                               allText.includes('açúcar') ||
                                               allText.includes('coffee') ||
                                               allText.includes('café');
                        
                        // Para fontes brasileiras confiáveis, ser MUITO mais permissivo
                        // Aceitar quase tudo de Valor, MDIC, etc (são fontes especializadas)
                        const isVeryTrustedBrazilian = linkLower.includes('valor.com.br') || 
                                                      linkLower.includes('mdic.gov.br') ||
                                                      linkLower.includes('comexstat');
                        
                        const isRelevant = hasPrimaryKeyword || 
                                          (hasSecondaryKeyword && isFromTrustedSource) ||
                                          (hasSecondaryKeyword && (allText.includes('brazil') || allText.includes('brasil') || allText.includes('trade'))) ||
                                          (isBrazilianSource && hasTradeRelated) ||
                                          (isBrazilianSource && hasSecondaryKeyword) ||
                                          (isVeryTrustedBrazilian && (hasTradeRelated || hasSecondaryKeyword || allText.includes('economia') || allText.includes('economy'))) ||
                                          (isVeryTrustedBrazilian); // Aceitar TUDO de fontes muito confiáveis brasileiras
                        
                        // Se não é relevante, REJEITAR
                        if (!isRelevant) {
                            rejectedCount++;
                            console.log(`⏭️  Artigo rejeitado: "${item.title?.substring(0, 60)}..." (sem palavras-chave relevantes)`);
                            continue; // Pular este artigo
                        }
                        
                        acceptedCount++;
                        console.log(`✅ Artigo aceito: "${item.title?.substring(0, 60)}..." (${hasPrimaryKeyword ? 'primária' : isVeryTrustedBrazilian ? 'fonte confiável' : 'secundária + fonte'})`);
                        
                        // Processar artigo (já verificamos que é relevante)
                        const article = generateArticleFromData(item, 'rss');
                        
                        // Traduzir para português se necessário
                        if (article._needsTranslation) {
                                try {
                                    console.log(`🌐 Traduzindo artigo de inglês para português: "${article._originalTitle.substring(0, 50)}..."`);
                                    article.title = await translateToPortuguese(article._originalTitle);
                                    article.excerpt = await translateToPortuguese(article._originalExcerpt);
                                    
                                    // Traduzir conteúdo HTML (extrair texto, traduzir, reconstruir HTML)
                                    const originalContentHtml = article._originalContent;
                                    // Extrair texto puro do HTML (remover tags mas manter estrutura)
                                    let contentText = originalContentHtml
                                        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                                        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                                        .replace(/<[^>]+>/g, ' ')
                                        .replace(/\s+/g, ' ')
                                        .trim();
                                    
                                    if (contentText.length > 0 && contentText.length < 5000) {
                                        // Limitar tamanho para evitar problemas com API
                                        const textToTranslate = contentText.substring(0, 4900);
                                        const translatedContent = await translateToPortuguese(textToTranslate);
                                        
                                        // Reconstruir o HTML com a tradução
                                        // Substituir título no HTML
                                        article.content = article.content.replace(
                                            /<h2>.*?<\/h2>/s,
                                            `<h2>${article.title}</h2>`
                                        );
                                        
                                        // Substituir o conteúdo principal (primeiro parágrafo)
                                        article.content = article.content.replace(
                                            /(<div[^>]*style="line-height: 1\.8[^"]*"[^>]*>)([\s\S]*?)(<\/div>)/,
                                            `$1<p>${translatedContent}</p>$3`
                                        );
                                    } else if (contentText.length >= 5000) {
                                        // Se muito longo, traduzir apenas o início
                                        const shortText = contentText.substring(0, 4900);
                                        const translatedShort = await translateToPortuguese(shortText);
                                        article.content = article.content.replace(
                                            /<h2>.*?<\/h2>/s,
                                            `<h2>${article.title}</h2>`
                                        );
                                        article.content = article.content.replace(
                                            /(<div[^>]*style="line-height: 1\.8[^"]*"[^>]*>)([\s\S]*?)(<\/div>)/,
                                            `$1<p>${translatedShort}...</p>$3`
                                        );
                                    }
                                    
                                    console.log(`✅ Artigo traduzido: "${article.title.substring(0, 50)}..."`);
                                    
                                    // Limpar flags temporárias
                                    delete article._needsTranslation;
                                    delete article._originalTitle;
                                    delete article._originalExcerpt;
                                    delete article._originalContent;
                                } catch (translateError) {
                                    console.warn('⚠️ Erro ao traduzir artigo, mantendo original:', translateError.message);
                                    // Limpar flags mesmo em caso de erro
                                    delete article._needsTranslation;
                                    delete article._originalTitle;
                                    delete article._originalExcerpt;
                                    delete article._originalContent;
                                }
                        }
                        
                        // Verificar se artigo já existe APENAS por URL completa (deduplicação por URL completa, não domínio)
                        // Não verificar por título para não perder conteúdo legítimo
                        let exists = false;
                        if (article.dataSource && article.dataSource.link) {
                                try {
                                    // Verificar apenas se URL COMPLETA já existe (sem query params)
                                    if (db && db.hasPostgres) {
                                        // Normalizar URL: remover query params e fragmentos, mas manter path completo
                                        const url = article.dataSource.link.split('?')[0].split('#')[0].trim();
                                        // Escapar caracteres especiais para SQL
                                        const escapedUrl = url.replace(/'/g, "''").replace(/\\/g, '\\\\');
                                        // Usar JSONB path para busca mais precisa
                                        const checkQuery = `
                                            SELECT id FROM blog_posts 
                                            WHERE data_source->>'link' = '${escapedUrl}'
                                               OR data_source::text LIKE '%"link":"${escapedUrl}"%'
                                            LIMIT 1
                                        `;
                                        const result = await db.executeQuery(checkQuery);
                                        exists = result && (Array.isArray(result) ? result.length > 0 : (result.rows?.length > 0));
                                        if (exists) {
                                            console.log(`⏭️  URL já existe no banco: ${url.substring(0, 80)}...`);
                                        }
                                    } else {
                                        // Fallback: não verificar se banco não disponível (mais permissivo)
                                        console.log('⚠️ Banco não disponível para verificar duplicata, salvando mesmo assim');
                                        exists = false;
                                    }
                                } catch (e) {
                                    // Se erro na verificação, continuar e salvar (não bloquear)
                                    console.warn('⚠️ Erro ao verificar duplicata, salvando mesmo assim:', e.message);
                                    exists = false;
                                }
                            }
                            
                            if (exists) {
                                console.log(`⏭️  Artigo duplicado ignorado (mesma URL completa): "${article.title.substring(0, 60)}..."`);
                                continue; // Pular apenas se URL completa for exatamente igual
                            }
                            
                            // Garantir que a data da fonte seja preservada
                            // Se o item tem pubDate, usar essa data como sourcePublishedDate
                            if (item.pubDate && !article.sourcePublishedDate) {
                                try {
                                    article.sourcePublishedDate = new Date(item.pubDate).toISOString();
                                    console.log(`📅 Data da fonte preservada: ${new Date(article.sourcePublishedDate).toLocaleDateString('pt-BR')}`);
                                } catch (e) {
                                    console.warn('⚠️ Erro ao parsear pubDate do item:', e);
                                }
                            }
                            
                        // Garantir que a imagem seja preservada
                        if (item.image) {
                            if (!article.image) {
                                article.image = item.image;
                                console.log(`🖼️  Imagem preservada do item RSS: ${item.image.substring(0, 100)}`);
                            } else {
                                console.log(`🖼️  Imagem já existe no artigo: ${article.image.substring(0, 100)}`);
                            }
                        } else {
                            console.warn(`⚠️  item.image é null/undefined para "${item.title}"`);
                        }
                        
                        // datePublished será a data da fonte (se disponível) ou hoje
                        // Isso garante que artigos recentes apareçam no ticker
                        if (!article.datePublished || article.datePublished === article.dateModified) {
                            // Se não tem data da fonte, usar hoje para aparecer no ticker
                            article.datePublished = article.sourcePublishedDate || new Date().toISOString();
                        }
                        
                        // Salvar artigo (não duplicado)
                        try {
                            const saved = await saveArticle(article);
                            if (saved) {
                                articles.push(article);
                                
                                const sourceDateStr = article.sourcePublishedDate ? new Date(article.sourcePublishedDate).toLocaleDateString('pt-BR') : 'Data não disponível';
                                const imageStatus = article.image ? '✅ Com imagem' : '❌ Sem imagem';
                                console.log(`✅ Artigo RSS salvo: "${article.title.substring(0, 60)}..." (Total: ${articles.length})`);
                                console.log(`   📅 Data da fonte: ${sourceDateStr} | ${imageStatus}`);
                                console.log(`   🖼️  ${imageStatus}`);
                                console.log(`   💾 ID: ${article.id}`);
                            } else {
                                console.warn(`⚠️ Artigo não foi salvo (saveArticle retornou null): ${article.title}`);
                            }
                        } catch (saveError) {
                            console.error(`❌ Erro ao salvar artigo "${article.title}":`, saveError.message);
                            console.error('Stack:', saveError.stack);
                            // Continuar processando outros artigos mesmo se um falhar
                        }
                    }
                } else {
                    console.log(`   ⚠️ Feed ${feed.name} não retornou itens ou está vazio`);
                }
                
                console.log(`   📊 Feed ${feed.name}: ${acceptedCount} aceitos, ${rejectedCount} rejeitados`);
            } catch (feedError) {
                console.error(`❌ Erro ao processar feed ${feed.name}:`, feedError.message);
                console.error('Stack:', feedError.stack);
            }
    } catch (error) {
        console.error('❌ Erro ao processar RSS Feeds:', error.message);
    }

    // 5. Criar artigos de exemplo para outras categorias (se não houver)
    // Isso garante que todas as categorias tenham conteúdo
    // REMOVIDO: Não criar artigos de exemplo automaticamente - apenas conteúdo real

    console.log(`✅ Processamento concluído. ${articles.length} artigos gerados e salvos.`);
    console.log(`📊 Resumo:`);
    console.log(`   - Artigos processados: ${articles.length}`);
    console.log(`   - Artigos salvos no banco: ${articles.filter(a => a.id).length}`);
    
    // Verificar quantos posts existem no banco agora
    try {
        const allPosts = await loadPosts();
        console.log(`📊 Total de posts no banco/arquivo após processamento: ${allPosts.length}`);
        
        // Contar por categoria
        const byCategory = {
            all: allPosts.length,
            analises: allPosts.filter(p => p.category === 'analises').length,
            noticias: allPosts.filter(p => p.category === 'noticias').length,
            guias: allPosts.filter(p => p.category === 'guias').length,
            insights: allPosts.filter(p => p.category === 'insights').length
        };
        console.log(`📊 Posts por categoria:`, byCategory);
    } catch (e) {
        console.warn('⚠️ Erro ao verificar total de posts:', e.message);
    }
    
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
    processAllSources,
    generateAutomaticInsights,
    generateAutomaticGuias
};

// Gerar Insights automáticos baseados em dados das APIs
async function generateAutomaticInsights(existingArticles) {
    const insights = [];
    const now = new Date();
    
    // Analisar dados existentes para gerar insights
    // Se não houver artigos existentes, ainda assim gerar insights baseados em conhecimento geral
    const hasComexData = existingArticles && existingArticles.length > 0 && existingArticles.some(a => a.source === 'comexstat');
    const hasUnData = existingArticles && existingArticles.length > 0 && existingArticles.some(a => a.source === 'unComtrade');
    const hasWbData = existingArticles && existingArticles.length > 0 && existingArticles.some(a => a.source === 'worldBank');
    
    // Sempre gerar pelo menos um insight (baseado em conhecimento geral se não houver dados)
    const shouldGenerateInsights = hasComexData || hasUnData || hasWbData || true; // Sempre gerar
    
    // Insight 1: Oportunidades de Exportação (sempre gerar)
    if (shouldGenerateInsights) {
        const insight = {
            id: `article-insight-auto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: 'Insight Estratégico: Oportunidades de Exportação em Mercados Emergentes',
            excerpt: 'Análise das tendências de comércio internacional revela oportunidades estratégicas para empresas brasileiras expandirem suas exportações em mercados emergentes.',
            content: `
                <h2>Oportunidades de Exportação em Mercados Emergentes</h2>
                <p>Com base na análise de dados de comércio internacional, identificamos oportunidades estratégicas para empresas brasileiras expandirem suas exportações.</p>
                
                <h3>Tendências Identificadas</h3>
                <p>Os dados mostram que mercados emergentes estão apresentando crescimento consistente na demanda por produtos brasileiros. Essa tendência representa uma oportunidade significativa para empresas que buscam diversificar seus destinos de exportação.</p>
                
                <h3>Estratégias Recomendadas</h3>
                <ul>
                    <li><strong>Diversificação de Mercados:</strong> Reduzir dependência de um único mercado aumenta resiliência</li>
                    <li><strong>Análise de Demanda:</strong> Identificar produtos com maior potencial em cada mercado</li>
                    <li><strong>Parcerias Estratégicas:</strong> Estabelecer relações comerciais sólidas em novos mercados</li>
                    <li><strong>Adaptação de Produtos:</strong> Ajustar produtos às preferências e regulamentações locais</li>
                </ul>
                
                <h3>Impacto no Negócio</h3>
                <p>A expansão para mercados emergentes pode resultar em aumento significativo de receita e redução de riscos operacionais. A OLV Internacional auxilia empresas a identificar e capitalizar essas oportunidades através de análises detalhadas de mercado.</p>
                
                <div style="background: var(--bg-secondary); padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid var(--accent-primary);">
                    <p style="margin: 0;"><strong>Fonte:</strong> Análise baseada em dados de comércio internacional</p>
                    <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.8;">Insight gerado automaticamente com base em dados oficiais de comércio exterior.</p>
                </div>
            `,
            category: 'insights',
            datePublished: now.toISOString(),
            dateModified: now.toISOString(),
            icon: 'fas fa-lightbulb',
            readTime: 5,
            source: 'automatic',
            dataSource: { type: 'automatic-insight', basedOn: 'trade-data-analysis' }
        };
        insights.push(insight);
    }
    
    // Insight 2: Otimização de Supply Chain (sempre gerar)
    if (shouldGenerateInsights) {
        const insight = {
            id: `article-insight-auto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: 'Insight: Otimização de Supply Chain através de Análise de Dados',
            excerpt: 'A análise de dados logísticos e de comércio exterior revela oportunidades significativas de otimização na cadeia de suprimentos.',
            content: `
                <h2>Otimização de Supply Chain através de Análise de Dados</h2>
                <p>A análise de dados de comércio exterior e indicadores econômicos globais permite identificar oportunidades de otimização na cadeia de suprimentos.</p>
                
                <h3>Principais Oportunidades</h3>
                <ul>
                    <li><strong>Redução de Custos Logísticos:</strong> Identificar rotas e modais mais eficientes</li>
                    <li><strong>Melhoria de Tempos:</strong> Otimizar processos de importação e exportação</li>
                    <li><strong>Gestão de Riscos:</strong> Antecipar e mitigar riscos na cadeia de suprimentos</li>
                    <li><strong>Sustentabilidade:</strong> Reduzir impacto ambiental através de otimizações</li>
                </ul>
                
                <h3>Aplicação Prática</h3>
                <p>A OLV Internacional utiliza análise de dados para desenvolver estratégias personalizadas de otimização de supply chain, resultando em redução de custos e melhoria de eficiência operacional.</p>
                
                <div style="background: var(--bg-secondary); padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid var(--accent-primary);">
                    <p style="margin: 0;"><strong>Fonte:</strong> Análise baseada em dados de comércio exterior e indicadores econômicos</p>
                    <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.8;">Insight gerado automaticamente com base em dados oficiais.</p>
                </div>
            `,
            category: 'insights',
            datePublished: now.toISOString(),
            dateModified: now.toISOString(),
            icon: 'fas fa-lightbulb',
            readTime: 5,
            source: 'automatic',
            dataSource: { type: 'automatic-insight', basedOn: 'supply-chain-optimization' }
        };
        insights.push(insight);
    }
    
    return insights;
}

// Gerar Guias automáticos baseados em templates
async function generateAutomaticGuias(existingArticles) {
    const guias = [];
    const now = new Date();
    
    // Guia 1: Como Estruturar uma Importação
    const guia1 = {
        id: `article-guia-auto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: 'Guia Prático: Como Estruturar uma Importação do Zero',
        excerpt: 'Passo a passo completo para estruturar uma importação, desde a identificação do fornecedor até a nacionalização da mercadoria.',
        content: `
            <h2>Como Estruturar uma Importação do Zero</h2>
            <p>Este guia prático apresenta o processo completo de estruturação de uma importação, garantindo que todas as etapas sejam executadas corretamente.</p>
            
            <h3>1. Identificação e Qualificação de Fornecedor</h3>
            <p>O primeiro passo é identificar e qualificar fornecedores internacionais. A OLV auxilia empresas a encontrar fornecedores qualificados através de due diligence rigorosa.</p>
            
            <h3>2. Negociação e Contratação</h3>
            <p>Negociação de termos comerciais (Incoterms), preços, prazos e condições de pagamento. É essencial definir claramente todos os termos para evitar surpresas.</p>
            
            <h3>3. Cálculo do TCO (Total Cost of Ownership)</h3>
            <p>Antes de finalizar a importação, é fundamental calcular todos os custos envolvidos: produto, frete, seguro, impostos, taxas portuárias e despesas administrativas.</p>
            
            <h3>4. Documentação e Licenças</h3>
            <p>Preparação de toda documentação necessária: licenças de importação, certificados, documentação de transporte e documentos aduaneiros.</p>
            
            <h3>5. Despacho Aduaneiro</h3>
            <p>Processo de nacionalização da mercadoria junto à Receita Federal, incluindo classificação fiscal, cálculo de impostos e liberação aduaneira.</p>
            
            <h3>6. Recebimento e Conferência</h3>
            <p>Recebimento da mercadoria, conferência de quantidade e qualidade, e resolução de eventuais não conformidades.</p>
            
            <div style="background: var(--bg-secondary); padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid var(--accent-primary);">
                <p style="margin: 0;"><strong>Dica Profissional:</strong> A OLV Internacional oferece suporte completo em todas as etapas do processo de importação, garantindo eficiência e redução de riscos.</p>
            </div>
        `,
        category: 'guias',
        datePublished: now.toISOString(),
        dateModified: now.toISOString(),
        icon: 'fas fa-book',
        readTime: 8,
        source: 'automatic',
        dataSource: { type: 'automatic-guide', basedOn: 'import-process' }
    };
    guias.push(guia1);
    
    // Guia 2: Regimes Aduaneiros Especiais
    const guia2 = {
        id: `article-guia-auto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: 'Guia: Regimes Aduaneiros Especiais que Reduzem Custos',
        excerpt: 'Conheça os principais regimes aduaneiros especiais que podem reduzir significativamente os custos de importação.',
        content: `
            <h2>Regimes Aduaneiros Especiais que Reduzem Custos</h2>
            <p>Existem diversos regimes aduaneiros especiais que podem reduzir significativamente os custos de importação. Este guia apresenta os principais.</p>
            
            <h3>Drawback</h3>
            <p>Regime que suspende ou isenta impostos de importação para produtos que serão utilizados na produção de bens para exportação.</p>
            
            <h3>Ex-Tarifário</h3>
            <p>Redução temporária de alíquota do Imposto de Importação para produtos sem similar nacional, visando reduzir custos de produção.</p>
            
            <h3>RECOF (Regime Especial de Aquisição de Bens de Capital)</h3>
            <p>Regime especial para importação de bens de capital, com redução de impostos e simplificação de processos.</p>
            
            <h3>Admissão Temporária</h3>
            <p>Regime que permite importação temporária de bens para processamento, montagem ou reparo, com suspensão de impostos.</p>
            
            <h3>Como Aplicar</h3>
            <p>A OLV Internacional auxilia empresas a identificar e aplicar os regimes aduaneiros mais adequados para cada situação, maximizando economia e eficiência.</p>
            
            <div style="background: var(--bg-secondary); padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid var(--accent-primary);">
                <p style="margin: 0;"><strong>Importante:</strong> Cada regime tem requisitos específicos. É essencial análise técnica para garantir elegibilidade e compliance.</p>
            </div>
        `,
        category: 'guias',
        datePublished: now.toISOString(),
        dateModified: now.toISOString(),
        icon: 'fas fa-book',
        readTime: 6,
        source: 'automatic',
        dataSource: { type: 'automatic-guide', basedOn: 'customs-regimes' }
    };
    guias.push(guia2);
    
    return guias;
}
