// api/blog/clean-db.js - Limpar data_source corrompido do banco
// GET /api/blog/clean-db

let db = null;
try {
    db = require('../../blog-db-neon');
} catch (error) {
    try {
        db = require('../../blog-db');
    } catch (error2) {
        console.warn('Banco de dados não disponível');
    }
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        if (!db || !db.hasPostgres) {
            return res.status(200).json({ 
                message: 'Banco não disponível',
                cleaned: 0 
            });
        }

        // Atualizar todos os data_source que começam com < (HTML) para {}
        const { sql } = require('@neondatabase/serverless');
        const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
        
        if (!databaseUrl) {
            return res.status(200).json({ 
                message: 'DATABASE_URL não configurado',
                cleaned: 0 
            });
        }

        const neon = sql(databaseUrl);
        
        // Atualizar registros com data_source corrompido
        const updateQuery = `
            UPDATE blog_posts
            SET data_source = '{}'::jsonb,
                updated_at = CURRENT_TIMESTAMP
            WHERE data_source::text LIKE '<%'
               OR data_source::text LIKE '<!%'
        `;

        await neon(updateQuery);

        res.status(200).json({ 
            success: true,
            message: 'Banco limpo: data_source corrompido removido',
            cleaned: 'Verificar logs'
        });
    } catch (error) {
        res.status(500).json({ 
            error: error.message,
            stack: error.stack 
        });
    }
};
