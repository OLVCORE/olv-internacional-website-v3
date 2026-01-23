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
        
        // 1. Remover posts de teste/exemplo/fake
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
            message: 'Limpeza concluída',
            testRemoved: testRemoved,
            duplicatesRemoved: duplicatesRemoved,
            totalRemoved: testRemoved + duplicatesRemoved
        });
    } catch (error) {
        console.error('Erro ao limpar duplicatas:', error);
        res.status(500).json({ 
            error: error.message,
            stack: error.stack 
        });
    }
};
