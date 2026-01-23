// api/blog/clean-duplicates.js - Remover duplicatas e posts de teste
// POST /api/blog/clean-duplicates

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

    if (req.method !== 'POST') {
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

        // Usar o método correto do banco de dados
        if (!db || !db.executeQuery) {
            return res.status(200).json({ 
                message: 'Banco não disponível ou executeQuery não encontrado',
                cleaned: 0 
            });
        }
        
        // Normalizar título para comparação
        const normalizeTitle = (title) => {
            if (!title) return '';
            return title
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^\w\s]/g, '')
                .replace(/\s+/g, ' ')
                .trim();
        };
        
        // 1. Remover notícias antigas que não são relevantes para Supply Chain/Comércio Exterior
        console.log('🧹 Removendo notícias não relevantes...');
        let irrelevantRemoved = 0;
        
        // Lista de termos que indicam notícias NÃO relevantes
        const irrelevantTerms = [
            'cricket', 'sport', 'consumer sentiment', 'equity rally', 'stock market',
            'bank rules', 'private credit', 'silver tops', 'thyssenkrupp', 'bearings',
            'camera', 'aviation', 'winter storm', 'snow', 'ice', 'weather',
            'blue aviators', 'fashion', 'style', 'trending', 'viral',
            'consumer', 'sentiment', 'regulator', 'eased', 'mull stakes'
        ];
        
        // Remover notícias RSS que contêm termos não relevantes
        for (const term of irrelevantTerms) {
            const deleteQuery = `
                DELETE FROM blog_posts
                WHERE source = 'rss'
                  AND category = 'noticias'
                  AND LOWER(title) LIKE '%${term.toLowerCase().replace(/'/g, "''")}%'
            `;
            try {
                const result = await db.executeQuery(deleteQuery);
                const rowCount = Array.isArray(result) ? result.length : (result?.rowCount || 0);
                irrelevantRemoved += rowCount;
            } catch (e) {
                console.warn(`⚠️ Erro ao remover termo "${term}":`, e.message);
            }
        }
        
        // Remover notícias RSS que NÃO têm palavras-chave relevantes (usar OR para cada palavra-chave)
        // Buscar primeiro os IDs das notícias não relevantes
        const findNonRelevantQuery = `
            SELECT id, title
            FROM blog_posts
            WHERE source = 'rss'
              AND category = 'noticias'
              AND (
                LOWER(title) NOT LIKE '%supply chain%'
                AND LOWER(title) NOT LIKE '%logistics%'
                AND LOWER(title) NOT LIKE '%freight%'
                AND LOWER(title) NOT LIKE '%shipping%'
                AND LOWER(title) NOT LIKE '%trade%'
                AND LOWER(title) NOT LIKE '%export%'
                AND LOWER(title) NOT LIKE '%import%'
                AND LOWER(title) NOT LIKE '%customs%'
                AND LOWER(title) NOT LIKE '%commercial%'
                AND LOWER(title) NOT LIKE '%international%'
                AND LOWER(title) NOT LIKE '%comércio%'
                AND LOWER(title) NOT LIKE '%transporte%'
                AND LOWER(title) NOT LIKE '%cargo%'
                AND LOWER(title) NOT LIKE '%commodity%'
                AND LOWER(title) NOT LIKE '%commodities%'
                AND LOWER(title) NOT LIKE '%trading%'
                AND LOWER(title) NOT LIKE '%cross-border%'
                AND LOWER(title) NOT LIKE '%global trade%'
                AND LOWER(title) NOT LIKE '%foreign trade%'
                AND LOWER(title) NOT LIKE '%port%'
                AND LOWER(title) NOT LIKE '%container%'
                AND LOWER(title) NOT LIKE '%vessel%'
                AND LOWER(title) NOT LIKE '%ship%'
              )
        `;
        try {
            const nonRelevantResult = await db.executeQuery(findNonRelevantQuery);
            const nonRelevantPosts = Array.isArray(nonRelevantResult) ? nonRelevantResult : (nonRelevantResult?.rows || []);
            
            if (nonRelevantPosts.length > 0) {
                console.log(`📋 Encontradas ${nonRelevantPosts.length} notícias não relevantes para remover`);
                const idsToDelete = nonRelevantPosts.map(p => p.id || p.id).filter(id => id);
                
                if (idsToDelete.length > 0) {
                    // Deletar em lotes para evitar query muito longa
                    const batchSize = 50;
                    for (let i = 0; i < idsToDelete.length; i += batchSize) {
                        const batch = idsToDelete.slice(i, i + batchSize);
                        const deleteQuery = `
                            DELETE FROM blog_posts
                            WHERE id IN (${batch.map(id => `'${String(id).replace(/'/g, "''")}'`).join(', ')})
                        `;
                        const deleteResult = await db.executeQuery(deleteQuery);
                        const deletedCount = Array.isArray(deleteResult) ? deleteResult.length : (deleteResult?.rowCount || 0);
                        irrelevantRemoved += deletedCount;
                    }
                    console.log(`✅ Removidas ${irrelevantRemoved} notícias sem palavras-chave relevantes`);
                }
            } else {
                console.log('✅ Nenhuma notícia não relevante encontrada');
            }
        } catch (e) {
            console.warn('⚠️ Erro ao remover notícias não relevantes:', e.message);
            console.error('Stack:', e.stack);
        }
        
        // 2. Remover posts de teste/exemplo/fake
        console.log('🧹 Removendo posts de teste/exemplo/fake...');
        
        // Palavras-chave para identificar artigos fake
        const testKeywords = [
            'teste', 'test', 
            'exemplo', 'example', 
            'conteúdo noticias', 'conteudo noticias',
            'artigo de exemplo',
            'Conteúdo noticias',
            'Artigo de exemplo'
        ];
        
        let testRemoved = 0;
        
        // Remover por keywords
        for (const keyword of testKeywords) {
            const deleteTestQuery = `
                DELETE FROM blog_posts
                WHERE LOWER(title) LIKE '%${keyword.toLowerCase().replace(/'/g, "''")}%'
                   OR LOWER(excerpt) LIKE '%${keyword.toLowerCase().replace(/'/g, "''")}%'
                   OR LOWER(id) LIKE '%${keyword.toLowerCase().replace(/'/g, "''")}%'
            `;
            const result = await db.executeQuery(deleteTestQuery);
            const rowCount = Array.isArray(result) ? result.length : (result?.rowCount || 0);
            testRemoved += rowCount;
        }
        
        // Remover artigos com source='manual' (artigos fake)
        const deleteManualQuery = `DELETE FROM blog_posts WHERE source = 'manual'`;
        const manualResult = await db.executeQuery(deleteManualQuery);
        const manualRowCount = Array.isArray(manualResult) ? manualResult.length : (manualResult?.rowCount || 0);
        testRemoved += manualRowCount;
        
        // Remover artigos com ID contendo 'article-example'
        const deleteExampleIdQuery = `DELETE FROM blog_posts WHERE id LIKE '%article-example%'`;
        const exampleIdResult = await db.executeQuery(deleteExampleIdQuery);
        const exampleRowCount = Array.isArray(exampleIdResult) ? exampleIdResult.length : (exampleIdResult?.rowCount || 0);
        testRemoved += exampleRowCount;
        
        // Remover artigos com fonte 'OLV Blog' (fake)
        const deleteOLVBlogQuery = `
            DELETE FROM blog_posts
            WHERE data_source::text LIKE '%"OLV Blog"%'
               OR data_source::text LIKE '%OLV Blog%'
        `;
        const olvBlogResult = await db.executeQuery(deleteOLVBlogQuery);
        const olvRowCount = Array.isArray(olvBlogResult) ? olvBlogResult.length : (olvBlogResult?.rowCount || 0);
        testRemoved += olvRowCount;
        
        console.log(`✅ Removidos ${testRemoved} posts de teste/exemplo/fake`);
        
        // 2. Remover duplicatas (manter o mais recente)
        // Agrupar por título normalizado + source
        const findDuplicatesQuery = `
            SELECT 
                id,
                title,
                source,
                data_source,
                date_published,
                ROW_NUMBER() OVER (
                    PARTITION BY 
                        LOWER(REGEXP_REPLACE(title, '[^a-z0-9\\s]', '', 'g')),
                        source
                    ORDER BY date_published DESC
                ) as rn
            FROM blog_posts
        `;
        
        const duplicates = await db.executeQuery(findDuplicatesQuery);
        const duplicatesRows = Array.isArray(duplicates) ? duplicates : (duplicates?.rows || []);
        
        // Deletar duplicatas (manter apenas o primeiro de cada grupo)
        let duplicatesRemoved = 0;
        const idsToDelete = [];
        
        for (const row of duplicatesRows) {
            if (row.rn > 1) {
                idsToDelete.push(row.id);
            }
        }
        
        if (idsToDelete.length > 0) {
            const deleteDuplicatesQuery = `
                DELETE FROM blog_posts
                WHERE id IN (${idsToDelete.map(id => `'${id.replace(/'/g, "''")}'`).join(',')})
            `;
            const result = await db.executeQuery(deleteDuplicatesQuery);
            const rowCount = Array.isArray(result) ? result.length : (result?.rowCount || 0);
            duplicatesRemoved += rowCount;
        }
        
        res.status(200).json({ 
            success: true,
            message: `Limpeza concluída: ${irrelevantRemoved} não relevantes, ${testRemoved} teste, ${duplicatesRemoved} duplicatas`,
            irrelevantRemoved: irrelevantRemoved,
            testRemoved: testRemoved,
            duplicatesRemoved: duplicatesRemoved,
            totalRemoved: irrelevantRemoved + testRemoved + duplicatesRemoved
        });
    } catch (error) {
        console.error('Erro ao limpar duplicatas:', error);
        res.status(500).json({ 
            error: error.message,
            stack: error.stack 
        });
    }
};
