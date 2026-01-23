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

        // Filtrar posts das últimas 24 horas (ou 48h se houver poucos)
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const last48Hours = new Date(now.getTime() - 48 * 60 * 60 * 1000);
        
        let recentPosts = posts.filter(post => {
            const postDate = new Date(post.datePublished);
            return postDate >= last24Hours;
        });

        // Se houver menos de 3 posts nas últimas 24h, expandir para 48h
        if (recentPosts.length < 3) {
            recentPosts = posts.filter(post => {
                const postDate = new Date(post.datePublished);
                return postDate >= last48Hours;
            });
        }

        if (recentPosts.length === 0) {
            tickerContent.innerHTML = '<span class="ticker-loading">Nenhuma notícia recente disponível</span>';
            return;
        }

        // Remover duplicatas por título (evitar mostrar a mesma notícia várias vezes)
        const uniquePosts = [];
        const seenTitles = new Set();
        
        for (const post of recentPosts) {
            const titleKey = post.title.toLowerCase().trim();
            if (!seenTitles.has(titleKey)) {
                seenTitles.add(titleKey);
                uniquePosts.push(post);
            }
        }

        // Se houver menos de 5 notícias únicas, buscar mais posts (até 7 dias)
        if (uniquePosts.length < 5) {
            const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const olderPosts = posts.filter(post => {
                const postDate = new Date(post.datePublished);
                return postDate >= last7Days && postDate < last48Hours;
            });
            
            for (const post of olderPosts) {
                const titleKey = post.title.toLowerCase().trim();
                if (!seenTitles.has(titleKey) && uniquePosts.length < 10) {
                    seenTitles.add(titleKey);
                    uniquePosts.push(post);
                }
            }
        }

        if (uniquePosts.length === 0) {
            tickerContent.innerHTML = '<span class="ticker-loading">Nenhuma notícia recente disponível</span>';
            return;
        }

        // Criar itens do ticker apenas com posts únicos
        const tickerItems = uniquePosts.map(post => {
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

            return `
                <a href="blog-post.html?id=${post.id}" class="news-ticker-item" title="${post.title}">
                    <span class="news-ticker-item-title">${post.title}</span>
                    <span class="news-ticker-item-source">${sourceName}</span>
                </a>
            `;
        });

        // Duplicar itens para animação contínua (apenas se houver itens suficientes)
        // Se houver poucos itens, não duplicar para evitar repetição excessiva
        const finalItems = tickerItems.length >= 5 
            ? [...tickerItems, ...tickerItems] 
            : tickerItems;
        
        tickerContent.innerHTML = finalItems.join('');

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
