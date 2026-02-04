// api/blog/diagnose.js - Endpoint de diagnóstico do blog
// GET /api/blog/diagnose

const { loadPosts } = require('../../blog-api');
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
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const diagnosis = {
            timestamp: new Date().toISOString(),
            database: {
                available: !!(db && db.hasPostgres),
                hasPostgres: db?.hasPostgres || false,
                databaseUrl: process.env.DATABASE_URL ? '✅ Definido' : '❌ Não definido'
            },
            posts: {
                total: 0,
                byCategory: {
                    all: 0,
                    analises: 0,
                    noticias: 0,
                    guias: 0,
                    insights: 0
                },
                recent: []
            },
            ingestion: {
                lastPostAt: null,
                totalPosts: 0,
                cronScheduleBRT: '08:00 e 14:00 (horário de Brasília)',
                cronScheduleUTC: '11:00 e 17:00'
            },
            rssFeeds: {
                note: 'Fontes especializadas (comércio exterior, supply chain). Ver blog-api.js → RSS_FEEDS.',
                count: 13
            },
            recommendations: []
        };

        // Carregar posts
        try {
            const allPosts = await loadPosts();
            diagnosis.posts.total = allPosts.length;
            
            // Contar por categoria
            diagnosis.posts.byCategory = {
                all: allPosts.length,
                analises: allPosts.filter(p => p.category === 'analises').length,
                noticias: allPosts.filter(p => p.category === 'noticias').length,
                guias: allPosts.filter(p => p.category === 'guias').length,
                insights: allPosts.filter(p => p.category === 'insights').length
            };
            
            // Últimos 10 posts
            const sorted = allPosts
                .sort((a, b) => new Date(b.datePublished || b.dateModified) - new Date(a.datePublished || a.dateModified));
            diagnosis.posts.recent = sorted
                .slice(0, 10)
                .map(p => ({
                    id: p.id,
                    title: p.title.substring(0, 60),
                    category: p.category,
                    source: p.source,
                    datePublished: p.datePublished || p.dateModified,
                    hasImage: !!p.image
                }));
            // Para confirmar se a ingestão automática (cron 8h/14h BRT) rodou
            const newest = sorted && sorted[0];
            if (!diagnosis.ingestion) diagnosis.ingestion = { lastPostAt: null, totalPosts: 0, cronScheduleBRT: '08:00 e 14:00 (horário de Brasília)', cronScheduleUTC: '11:00 e 17:00' };
            diagnosis.ingestion.lastPostAt = newest ? (newest.datePublished || newest.dateModified) : null;
            diagnosis.ingestion.totalPosts = allPosts.length;
        } catch (error) {
            diagnosis.posts.error = error.message;
        }

        // Verificar banco de dados
        if (db && db.hasPostgres) {
            try {
                const countQuery = 'SELECT COUNT(*) as total FROM blog_posts';
                const countResult = await db.executeQuery(countQuery);
                const dbTotal = parseInt(countResult?.rows?.[0]?.total || countResult?.[0]?.total || 0);
                diagnosis.database.postsInDB = dbTotal;
            } catch (dbError) {
                diagnosis.database.error = dbError.message;
            }
        }

        // Gerar recomendações
        if (diagnosis.posts.total === 0) {
            diagnosis.recommendations.push('⚠️ Nenhum post encontrado. Execute o processamento manual: POST /api/blog/process');
        } else if (diagnosis.posts.byCategory.noticias < 5) {
            diagnosis.recommendations.push('⚠️ Poucas notícias encontradas. Verifique se os feeds RSS estão funcionando e se o filtro não está muito restritivo.');
        }
        
        if (!diagnosis.database.available) {
            diagnosis.recommendations.push('⚠️ Banco de dados não disponível. Verifique se DATABASE_URL está configurada no Vercel.');
        }
        
        if (diagnosis.posts.total < 20) {
            diagnosis.recommendations.push('💡 Execute o processamento manual para adicionar mais conteúdo: POST /api/blog/process');
        }

        res.status(200).json(diagnosis);
    } catch (error) {
        console.error('Erro no diagnóstico:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Erro ao executar diagnóstico' 
        });
    }
};
