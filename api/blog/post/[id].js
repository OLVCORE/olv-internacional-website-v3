// api/blog/post/[id].js - Serverless function para Vercel
// GET /api/blog/post/:id

const { loadPost } = require('../../../blog-api');

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
        const postId = req.query.id || req.url.split('/').pop();
        
        if (!postId) {
            res.status(400).json({ error: 'Post ID required' });
            return;
        }

        const post = await loadPost(postId);
        
        if (!post) {
            res.status(404).json({ 
                success: false, 
                error: 'Post não encontrado' 
            });
            return;
        }

        res.status(200).json(post);
    } catch (error) {
        console.error('Erro ao carregar post:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Erro ao carregar post' 
        });
    }
};
