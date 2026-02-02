/**
 * perplexity-service.js
 * Serviço para enriquecer artigos do blog com análise contextual OLV via Perplexity API.
 * Uso: após puxar notícia RSS, chamar enrichArticleWithPerplexity(article) antes de saveArticle(article).
 */

const axios = require('axios');

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';
const DEFAULT_MODEL = 'sonar';
const DEFAULT_MAX_TOKENS = 500;

const SYSTEM_PROMPT_OLV = `Você é um analista da OLV Internacional, empresa de consultoria em supply chain global e comércio exterior.

Contexto OLV: supply chain internacional, gestão de cadeia de suprimentos, comércio exterior, importação e exportação, gestão internacional para empresas, internacionalização de empresas, desenvolvimento de negócios locais e internacionais.

Sua tarefa: analisar a notícia fornecida e redigir um parágrafo curto (2 a 4 frases) em português brasileiro que:
1. Conecta a notícia ao contexto de supply chain, comércio exterior ou gestão internacional.
2. Destaca o que é relevante para empresas que importam, exportam ou gerenciam cadeias globais.
3. Sugere brevemente implicações ou oportunidades no contexto OLV.

Seja objetivo e direto. Não invente dados; baseie-se apenas na notícia.`;

/**
 * Chama a API Perplexity para obter análise contextual OLV da notícia.
 * @param {object} article - Objeto do artigo (title, excerpt, content, source)
 * @param {object} options - { maxTokens, model }
 * @returns {Promise<object>} - O mesmo article com article.olvAnalysis preenchido (ou inalterado em caso de erro/falta de API key)
 */
async function enrichArticleWithPerplexity(article, options = {}) {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
        return article;
    }

    const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
    const model = options.model ?? DEFAULT_MODEL;

    const title = (article.title || '').trim();
    const excerpt = (article.excerpt || '').trim();
    const contentSnippet = (article.content || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 1500);

    const userContent = `Título: ${title}\n\nResumo/trecho: ${excerpt || contentSnippet}`.trim();
    if (!userContent) return article;

    try {
        const response = await axios.post(
            PERPLEXITY_API_URL,
            {
                model,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT_OLV },
                    { role: 'user', content: userContent }
                ],
                max_tokens: Math.min(Math.max(maxTokens, 100), 1024),
                temperature: 0.2
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        const content = response.data?.choices?.[0]?.message?.content;
        if (content && typeof content === 'string' && content.trim()) {
            article.olvAnalysis = content.trim();
        }
    } catch (err) {
        const msg = err.response?.data?.error?.message || err.message;
        console.warn('Perplexity enrich skip:', msg);
    }

    return article;
}

module.exports = {
    enrichArticleWithPerplexity
};
