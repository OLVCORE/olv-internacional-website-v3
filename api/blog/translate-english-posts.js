// api/blog/translate-english-posts.js
// POST /api/blog/translate-english-posts — traduz título e resumo para PT-BR (só o que aparece nos mini-cards)

const { loadPosts, loadPost, saveArticle, translateToPortuguese, detectLanguage } = require('../../blog-api');
let initDatabase = null;
try {
    const dbNeon = require('../../blog-db-neon');
    initDatabase = dbNeon.initDatabase;
} catch (e) {}

// Detecção mais sensível para títulos em inglês (cards): palavras típicas de manchetes EN
function titleLooksEnglish(title) {
    if (!title || typeof title !== 'string') return false;
    const t = title.toLowerCase().replace(/[^\w\s]/g, ' ');
    const words = new Set(t.split(/\s+/).filter(Boolean));
    const enTitleWords = ['the', 'your', 'and', 'for', 'with', 'says', 'you', 'need', 'to', 'know', 'are', 'was', 'were', 'have', 'has', 'will', 'can', 'may', 'this', 'that', 'from', 'what', 'who', 'when', 'where', 'how', 'first', 'look', 'beat', 'find', 'finds', 'study', 'remain', 'remains', 'despite', 'rise', 'says', 'hauling', 'freight', 'million', 'posts', 'old', 'dominion', 'q4', 'ev', 'batteries', 'robust', 'charging', 'triggers', 'weak', 'demand', 'facility', 'closures', 'job', 'cuts'];
    let hits = 0;
    for (const w of enTitleWords) {
        if (words.has(w)) hits++;
    }
    return hits >= 2;
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    const openAIKey = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY;
    const hasOpenAIKey = !!(openAIKey && String(openAIKey).trim());
    if (!hasOpenAIKey) {
        return res.status(200).json({
            success: false,
            translated: 0,
            translatedIds: [],
            message: 'OPENAI_API_KEY (ou OPENAI_KEY) não está definida. Verifique .env local e Vercel → Settings → Environment Variables.'
        });
    }
    try {
        if (initDatabase) await initDatabase();
        const db = require('../../blog-db-neon');
        if (db && typeof db.ensureConnection === 'function') await db.ensureConnection();
        const allPosts = await loadPosts();
        if (!Array.isArray(allPosts)) {
            return res.status(200).json({ success: true, translated: 0, message: 'Nenhum post carregado.' });
        }
        const maxPerRun = 5;
        let translated = 0;
        const translatedIds = [];
        for (const post of allPosts) {
            if (translated >= maxPerRun) break;
            const isEnglish = detectLanguage(post.title) || titleLooksEnglish(post.title);
            if (!isEnglish) continue;
            const full = await loadPost(post.id);
            if (!full || !full.id) continue;
            const ptTitle = await translateToPortuguese(full.title);
            const ptExcerpt = full.excerpt ? await translateToPortuguese(String(full.excerpt).slice(0, 2000)) : '';
            if (ptTitle === full.title && ptExcerpt === (full.excerpt || '')) continue;
            full.title = ptTitle;
            full.excerpt = ptExcerpt;
            await saveArticle(full);
            translated++;
            translatedIds.push(full.id);
        }
        res.status(200).json({
            success: true,
            translated,
            translatedIds,
            message: translated > 0 ? `${translated} post(s) traduzidos para português (cards).` : 'Nenhum post em inglês para traduzir ou OPENAI_API_KEY ausente. Rode de novo se houver mais.'
        });
    } catch (err) {
        console.error('translate-english-posts:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};
