// Sistema de fallback inteligente para imagens de blog
// Gera imagens baseadas em palavras-chave quando RSS não tem imagem

// Mapeamento de categorias para ícones e cores
const CATEGORY_ICONS = {
    'analises': {
        icon: 'fas fa-chart-line',
        gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        keywords: ['análise', 'dados', 'estatística', 'gráfico', 'tendência']
    },
    'noticias': {
        icon: 'fas fa-newspaper',
        gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        keywords: ['notícia', 'atualidade', 'evento', 'acontecimento']
    },
    'guias': {
        icon: 'fas fa-book',
        gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        keywords: ['guia', 'tutorial', 'passo a passo', 'como fazer']
    },
    'insights': {
        icon: 'fas fa-lightbulb',
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        keywords: ['insight', 'estratégia', 'oportunidade', 'visão']
    }
};

// Mapeamento de palavras-chave para ícones específicos
const KEYWORD_ICONS = {
    'comércio': 'fas fa-globe',
    'exportação': 'fas fa-arrow-up',
    'importação': 'fas fa-arrow-down',
    'economia': 'fas fa-chart-pie',
    'mercado': 'fas fa-store',
    'negócio': 'fas fa-handshake',
    'logística': 'fas fa-truck',
    'supply chain': 'fas fa-boxes',
    'aduana': 'fas fa-passport',
    'frete': 'fas fa-shipping-fast',
    'custo': 'fas fa-dollar-sign',
    'análise': 'fas fa-chart-bar',
    'dados': 'fas fa-database',
    'brasil': 'fas fa-flag',
    'internacional': 'fas fa-globe-americas'
};

// Gerar ícone baseado em categoria e palavras-chave
function generateIconForArticle(article) {
    const category = article.category || 'analises';
    const title = (article.title || '').toLowerCase();
    const excerpt = (article.excerpt || '').toLowerCase();
    const text = `${title} ${excerpt}`;
    
    // Primeiro, tentar encontrar ícone por palavra-chave específica
    for (const [keyword, icon] of Object.entries(KEYWORD_ICONS)) {
        if (text.includes(keyword)) {
            return {
                icon: icon,
                gradient: CATEGORY_ICONS[category]?.gradient || CATEGORY_ICONS['analises'].gradient
            };
        }
    }
    
    // Se não encontrar, usar ícone da categoria
    const categoryConfig = CATEGORY_ICONS[category] || CATEGORY_ICONS['analises'];
    return {
        icon: categoryConfig.icon,
        gradient: categoryConfig.gradient
    };
}

// Gerar URL de imagem de serviço gratuito baseado em palavras-chave
function generateImageUrlFromKeywords(article) {
    // Usar Unsplash Source API (gratuita, sem autenticação)
    const title = article.title || '';
    const category = article.category || 'analises';
    
    // Extrair palavras-chave principais
    const keywords = extractKeywords(title);
    const searchTerm = keywords.length > 0 ? keywords[0] : category;
    
    // Unsplash Source API - imagens gratuitas
    // Formato: https://source.unsplash.com/800x400/?{keyword}
    // Alternativa mais moderna: https://images.unsplash.com/photo-{id}?w=800&h=400&fit=crop
    
    // Para termos em português, traduzir para inglês
    const translations = {
        'comércio': 'commerce',
        'exportação': 'export',
        'importação': 'import',
        'economia': 'economy',
        'mercado': 'market',
        'negócio': 'business',
        'logística': 'logistics',
        'supply chain': 'supply chain',
        'análise': 'analysis',
        'dados': 'data',
        'brasil': 'brazil',
        'internacional': 'international'
    };
    
    const englishTerm = translations[searchTerm.toLowerCase()] || searchTerm.toLowerCase();
    
    // Unsplash Source (simples, mas pode ser lento)
    // return `https://source.unsplash.com/800x400/?${encodeURIComponent(englishTerm)}`;
    
    // Pexels API (melhor qualidade, mas requer API key)
    // return `https://api.pexels.com/v1/search?query=${encodeURIComponent(englishTerm)}&per_page=1`;
    
    // Por enquanto, retornar null e usar ícone
    // Em produção, pode integrar com Unsplash/Pexels API
    return null;
}

function extractKeywords(text) {
    const commonWords = ['de', 'da', 'do', 'em', 'para', 'com', 'por', 'sobre', 'o', 'a', 'os', 'as', 'um', 'uma'];
    const words = text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 3 && !commonWords.includes(w));
    
    // Retornar palavras mais relevantes (primeiras 2-3)
    return words.slice(0, 3);
}

module.exports = {
    generateIconForArticle,
    generateImageUrlFromKeywords,
    CATEGORY_ICONS,
    KEYWORD_ICONS
};
