// news-ticker.js - News Ticker Component (Barra de Notícias)
// Carrega notícias do blog (últimas 24h preferidas; fallback: últimos posts disponíveis)
// Funciona com ingestão automática diária (cron 8h e 20h UTC)

(function () {
    'use strict';

    var TICKER_API_BASE = '';
    var TICKER_REFRESH_MS = 10 * 60 * 1000; // 10 minutes (menos requisições)
    var TICKER_STORAGE_KEY = 'olv-news-ticker-cache';
    var TICKER_CACHE_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes (usa cache mais tempo)

    function getApiBase() {
        if (TICKER_API_BASE) return TICKER_API_BASE;
        if (typeof window !== 'undefined' && window.location && window.location.origin) {
            TICKER_API_BASE = window.location.origin;
        } else {
            TICKER_API_BASE = '';
        }
        return TICKER_API_BASE;
    }

    function getTickerUrl() {
        var base = getApiBase();
        return base + '/api/blog/ticker';
    }

    function getTickerFallbackUrl() {
        var base = getApiBase();
        return base + '/api/blog/posts?category=all&perPage=30&page=1';
    }

    function safeTitle(post) {
        if (!post) return '';
        var t = post.title;
        return (typeof t === 'string' && t.trim()) ? t.trim() : 'Sem título';
    }

    function safeDate(post) {
        if (!post) return new Date(0);
        var d = post.datePublished || post.dateModified || post.createdAt || null;
        if (!d) return new Date(0);
        var parsed = new Date(d);
        return isNaN(parsed.getTime()) ? new Date(0) : parsed;
    }

    function getSourceName(post) {
        if (!post) return 'OLV Blog';
        if (post.source === 'rss' && post.dataSource && post.dataSource.link) {
            try {
                var url = post.dataSource.link;
                if (url.indexOf('valor.com.br') !== -1) return 'Valor';
                if (url.indexOf('exame.com') !== -1) return 'Exame';
                if (url.indexOf('ebc.com.br') !== -1 || url.indexOf('agenciabrasil') !== -1) return 'Agência Brasil';
                if (url.indexOf('reuters.com') !== -1) return 'Reuters';
                if (url.indexOf('bloomberg') !== -1) return 'Bloomberg';
            } catch (e) {}
            return 'RSS';
        }
        if (post.source === 'comexstat') return 'MDIC';
        if (post.source === 'unComtrade') return 'UN Comtrade';
        if (post.source === 'worldBank') return 'World Bank';
        return 'OLV Blog';
    }

    function escapeHtml(s) {
        if (typeof s !== 'string') return '';
        var div = document.createElement('div');
        div.textContent = s;
        return div.innerHTML;
    }

    function getCachedPosts() {
        try {
            var raw = localStorage.getItem(TICKER_STORAGE_KEY);
            if (!raw) return null;
            var data = JSON.parse(raw);
            if (data && data.ts && (Date.now() - data.ts < TICKER_CACHE_MAX_AGE_MS) && Array.isArray(data.posts)) {
                return data.posts;
            }
        } catch (e) {}
        return null;
    }

    function setCachedPosts(posts) {
        try {
            localStorage.setItem(TICKER_STORAGE_KEY, JSON.stringify({
                ts: Date.now(),
                posts: posts || []
            }));
        } catch (e) {}
    }

    function loadNewsTicker() {
        var tickerContent = document.getElementById('news-ticker-content');
        if (!tickerContent) return;

        function renderEmpty(msg) {
            tickerContent.innerHTML = '<span class="ticker-loading">' + escapeHtml(msg || 'Carregando notícias...') + '</span>';
        }

        function renderItems(postsToShow) {
            if (!postsToShow || postsToShow.length === 0) {
                renderEmpty('Nenhuma notícia disponível no momento');
                return;
            }

            var unique = [];
            var seen = {};
            for (var i = 0; i < postsToShow.length; i++) {
                var p = postsToShow[i];
                var titleKey = safeTitle(p).toLowerCase();
                if (seen[titleKey]) continue;
                seen[titleKey] = true;
                unique.push(p);
            }

            var tickerItems = unique.map(function (post) {
                var id = (post.id || '').toString();
                var title = escapeHtml(safeTitle(post));
                var sourceName = escapeHtml(getSourceName(post));
                var href = 'blog-post.html?id=' + encodeURIComponent(id);
                return '<a href="' + href + '" class="news-ticker-item" title="' + title + '">' +
                    '<span class="news-ticker-item-title">' + title + '</span>' +
                    '<span class="news-ticker-item-source">' + sourceName + '</span>' +
                    '</a>';
            });

            var finalItems = tickerItems.length >= 5 ? tickerItems.concat(tickerItems) : tickerItems;
            tickerContent.innerHTML = finalItems.join('');
        }

        var cached = getCachedPosts();
        if (cached && cached.length > 0) {
            cached.sort(function (a, b) { return safeDate(b).getTime() - safeDate(a).getTime(); });
            renderItems(cached);
        } else {
            renderEmpty('Carregando notícias...');
        }

        function onData(data) {
            var posts = Array.isArray(data) ? data : (data && data.posts);
            if (!Array.isArray(posts)) posts = [];
            posts = posts.filter(function (p) { return p && (p.id || safeTitle(p)); });
            posts.sort(function (a, b) { return safeDate(b).getTime() - safeDate(a).getTime(); });
            setCachedPosts(posts);
            var now = new Date();
            var last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            var last48h = new Date(now.getTime() - 48 * 60 * 60 * 1000);
            var last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            var recent24 = posts.filter(function (p) { return safeDate(p) >= last24h; });
            var recent48 = posts.filter(function (p) { return safeDate(p) >= last48h; });
            var recent7d = posts.filter(function (p) { return safeDate(p) >= last7d; });
            var toShow = recent24.length >= 3 ? recent24 : (recent48.length >= 3 ? recent48 : (recent7d.length >= 1 ? recent7d : posts));
            if (toShow.length === 0) toShow = posts.slice(0, 20);
            renderItems(toShow);
        }

        fetch(getTickerUrl())
            .then(function (res) {
                if (res.ok) return res.json();
                if (res.status === 404) return fetch(getTickerFallbackUrl()).then(function (r) { return r.ok ? r.json() : Promise.reject(new Error('fallback ' + r.status)); });
                return Promise.reject(new Error('API ' + res.status));
            })
            .then(function (data) {
                onData(data);
            })
            .catch(function (err) {
                fetch(getTickerFallbackUrl())
                    .then(function (res) { return res.ok ? res.json() : Promise.reject(res); })
                    .then(onData)
                    .catch(function () {
                        if (cached && cached.length > 0) renderItems(getCachedPosts() || cached);
                        else renderEmpty('Erro ao carregar notícias. Tente atualizar a página.');
                    });
            });
    }

    function scheduleRefresh() {
        setInterval(loadNewsTicker, TICKER_REFRESH_MS);
    }

    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () {
                loadNewsTicker();
                scheduleRefresh();
            });
        } else {
            loadNewsTicker();
            scheduleRefresh();
        }
    }

    if (typeof window !== 'undefined') {
        window.loadNewsTicker = loadNewsTicker;
    }
})();
