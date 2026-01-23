// api/blog/posts.js - Serverless function para Vercel
// GET /api/blog/posts?category=all

const { loadPosts } = require('../../blog-api');
let initDatabase = null;
try {
    const dbNeon = require('../../blog-db-neon');
    initDatabase = dbNeon.initDatabase;
} catch (error) {
    try {
        const db = require('../../blog-db');
        initDatabase = db.initDatabase;
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

    // Only GET allowed
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        // Inicializar banco se necessário (primeira vez)
        try {
            await initDatabase();
        } catch (initError) {
            console.warn('Banco não inicializado (pode ser normal):', initError.message);
        }

        const category = req.query.category || 'all';
        const page = parseInt(req.query.page) || 1;
        const perPage = parseInt(req.query.perPage) || 12;
        let posts = [];
        
        try {
            posts = await loadPosts();
        } catch (error) {
            console.warn('Arquivo de posts não encontrado ou vazio. Processando agora...', error.message);
            // Se não houver posts, tentar processar
            try {
                const { processAllSources } = require('../../blog-api');
                const articles = await processAllSources();
                posts = articles;
            } catch (processError) {
                console.error('Erro ao processar posts:', processError);
                // Retornar array vazio se falhar
                posts = [];
            }
        }
        
        // Remover duplicatas baseado em título normalizado + source/URL
        const normalizeTitle = (title) => {
            if (!title) return '';
            return title
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '') // Remove acentos
                .replace(/[^\w\s]/g, '') // Remove pontuação
                .replace(/\s+/g, ' ') // Normaliza espaços
                .trim();
        };
        
        // Calcular similaridade entre dois títulos (Levenshtein simplificado)
        const titleSimilarity = (title1, title2) => {
            const norm1 = normalizeTitle(title1);
            const norm2 = normalizeTitle(title2);
            if (norm1 === norm2) return 1.0;
            
            // Se um título contém o outro (com 80% de similaridade), considerar duplicata
            const longer = norm1.length > norm2.length ? norm1 : norm2;
            const shorter = norm1.length > norm2.length ? norm2 : norm1;
            
            if (longer.includes(shorter) && shorter.length / longer.length > 0.8) {
                return 0.9;
            }
            
            // Calcular palavras em comum
            const words1 = new Set(norm1.split(/\s+/).filter(w => w.length > 3));
            const words2 = new Set(norm2.split(/\s+/).filter(w => w.length > 3));
            const intersection = [...words1].filter(w => words2.has(w)).length;
            const union = new Set([...words1, ...words2]).size;
            
            return union > 0 ? intersection / union : 0;
        };
        
        // Ordenar posts por data (mais recente primeiro) antes de deduplicar
        posts.sort((a, b) => {
            const dateA = new Date(a.datePublished || a.dateModified || 0);
            const dateB = new Date(b.datePublished || b.dateModified || 0);
            return dateB - dateA;
        });
        
        const seen = new Map();
        const uniquePosts = [];
        
        for (const post of posts) {
            const normalizedTitle = normalizeTitle(post.title);
            let key = `${normalizedTitle}|${post.source}`;
            
            // Para RSS, usar URL também (mais preciso)
            if (post.source === 'rss' && post.dataSource && post.dataSource.link) {
                const url = post.dataSource.link.split('?')[0]; // Remove query params
                key = `${normalizedTitle}|${url}`;
            }
            
            // Verificar se já existe exatamente
            if (seen.has(key)) {
                continue; // Duplicata exata, pular
            }
            
            // Verificar similaridade com posts já adicionados
            let isDuplicate = false;
            for (const existing of uniquePosts) {
                const existingTitle = normalizeTitle(existing.title);
                
                // Se títulos são muito similares (>85%), considerar duplicata
                if (titleSimilarity(post.title, existing.title) > 0.85) {
                    // Se mesmo source ou ambos RSS, definitivamente duplicata
                    if (post.source === existing.source || 
                        (post.source === 'rss' && existing.source === 'rss')) {
                        isDuplicate = true;
                        break;
                    }
                }
            }
            
            if (!isDuplicate) {
                seen.set(key, true);
                uniquePosts.push(post);
            }
        }
        
        // Filtrar por categoria
        let filteredPosts = uniquePosts;
        if (category !== 'all') {
            filteredPosts = uniquePosts.filter(p => p.category === category);
        }
        
        // Ordenar por data (mais recente primeiro)
        filteredPosts.sort((a, b) => {
            const dateA = new Date(a.datePublished || a.dateModified || 0);
            const dateB = new Date(b.datePublished || b.dateModified || 0);
            return dateB - dateA;
        });
        
        // Calcular paginação
        const totalPosts = filteredPosts.length;
        const totalPages = Math.ceil(totalPosts / perPage);
        const startIndex = (page - 1) * perPage;
        const endIndex = startIndex + perPage;
        const paginatedPosts = filteredPosts.slice(startIndex, endIndex);
        
        // Retornar com metadados de paginação
        res.status(200).json({
            posts: paginatedPosts,
            pagination: {
                currentPage: page,
                perPage: perPage,
                totalPosts: totalPosts,
                totalPages: totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (error) {
        console.error('Erro ao carregar posts:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Erro ao carregar posts' 
        });
    }
};
