// news-ticker.js - News Ticker Component (Barra de Notícias)
// Carrega notícias das últimas 24 horas e exibe em ticker animado

async function loadNewsTicker() {
    const tickerContent = document.getElementById('news-ticker-content');
    if (!tickerContent) return;

    try {
        // Buscar posts das últimas 24 horas
        const response = await fetch('/api/blog/posts?category=all');
        const posts = await response.json();

        if (!posts || posts.length === 0) {
            tickerContent.innerHTML = '<span class="ticker-loading">Nenhuma notícia disponível no momento</span>';
            return;
        }

        // Filtrar posts das últimas 24 horas
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        const recentPosts = posts.filter(post => {
            const postDate = new Date(post.datePublished);
            return postDate >= last24Hours;
        });

        if (recentPosts.length === 0) {
            tickerContent.innerHTML = '<span class="ticker-loading">Nenhuma notícia nas últimas 24 horas</span>';
            return;
        }

        // Criar itens do ticker
        const tickerItems = recentPosts.map(post => {
            // Determinar nome da fonte
            let sourceName = 'OLV Blog';
            if (post.source === 'rss') {
                if (post.dataSource && post.dataSource.link) {
                    try {
                        const url = new URL(post.dataSource.link);
                        if (url.hostname.includes('valor.com.br')) sourceName = 'Valor';
                        else if (url.hostname.includes('exame.com')) sourceName = 'Exame';
                        else if (url.hostname.includes('ebc.com.br') || url.hostname.includes('agenciabrasil')) sourceName = 'Agência Brasil';
                        else if (url.hostname.includes('reuters.com')) sourceName = 'Reuters';
                    } catch (e) {
                        sourceName = 'RSS Feed';
                    }
                }
            } else if (post.source === 'comexstat') {
                sourceName = 'MDIC';
            } else if (post.source === 'unComtrade') {
                sourceName = 'UN Comtrade';
            } else if (post.source === 'worldBank') {
                sourceName = 'World Bank';
            }

            const categoryLabels = {
                'analises': 'Análise',
                'noticias': 'Notícia',
                'guias': 'Guia',
                'insights': 'Insight'
            };

            return `
                <a href="blog-post.html?id=${post.id}" class="news-ticker-item" title="${post.title}">
                    <span class="news-ticker-item-title">${post.title}</span>
                    <span class="news-ticker-item-source">${sourceName}</span>
                </a>
            `;
        });

        // Duplicar itens para animação contínua
        const duplicatedItems = [...tickerItems, ...tickerItems];
        tickerContent.innerHTML = duplicatedItems.join('');

    } catch (error) {
        console.error('Erro ao carregar news ticker:', error);
        tickerContent.innerHTML = '<span class="ticker-loading">Erro ao carregar notícias</span>';
    }
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadNewsTicker);
} else {
    loadNewsTicker();
}
