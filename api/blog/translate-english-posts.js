// api/blog/translate-english-posts.js
// POST /api/blog/translate-english-posts — traduz para PT-BR os posts que ainda estão em inglês (mini-cards)

const { loadPosts, loadPost, saveArticle, translateToPortuguese, detectLanguage } = require('../../blog-api');
let initDatabase = null;
try {
    const dbNeon = require('../../blog-db-neon');
    initDatabase = dbNeon.initDatabase;
} catch (e) {}

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
    try {
        if (initDatabase) await initDatabase();
        const db = require('../../blog-db-neon');
        if (db && db.ensureConnection) await db.ensureConnection();
        const allPosts = await loadPosts();
        const maxPerRun = 10;
        let translated = 0;
        for (const post of allPosts) {
            if (translated >= maxPerRun) break;
            if (!detectLanguage(post.title)) continue;
            const full = await loadPost(post.id);
            if (!full) continue;
            full.title = await translateToPortuguese(full.title);
            full.excerpt = full.excerpt ? await translateToPortuguese(full.excerpt) : '';
            await saveArticle(full);
            translated++;
        }
        res.status(200).json({
            success: true,
            translated,
            message: translated > 0 ? `${translated} post(s) traduzidos para português.` : 'Nenhum post em inglês para traduzir ou limite atingido.'
        });
    } catch (err) {
        console.error('translate-english-posts:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};
