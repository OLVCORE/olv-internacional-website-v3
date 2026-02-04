// api/blog/cleanup-offtopic.js - Remove posts BBB/entretenimento (chamar uma vez)
// POST ou GET /api/blog/cleanup-offtopic

let db = null;
let initDatabase = null;
try {
    const dbNeon = require('../../blog-db-neon');
    db = dbNeon;
    initDatabase = dbNeon.initDatabase;
} catch (e) {
    try {
        const dbModule = require('../../blog-db');
        db = dbModule;
        initDatabase = dbModule.initDatabase;
    } catch (e2) {}
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    if (req.method !== 'GET' && req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    try {
        if (db && db.ensureConnection) db.ensureConnection();
        if (initDatabase) await initDatabase();
        if (!db || typeof db.deleteOffTopicPosts !== 'function') {
            return res.status(200).json({ success: true, message: 'Cleanup não disponível (sem DB)' });
        }
        await db.deleteOffTopicPosts();
        res.status(200).json({ success: true, message: 'Limpeza off-topic (BBB/entretenimento) executada.' });
    } catch (e) {
        console.warn('cleanup-offtopic:', e.message);
        res.status(200).json({ success: true, message: 'Limpeza concluída ou ignorada.', error: e.message });
    }
};
