// ============================================
// COMPONENTES REUTILIZÁVEIS - HEADER E FOOTER
// ============================================

function createHeader(currentPage = '') {
    const pages = {
        'index': 'Início',
        'sobre': 'Sobre',
        'importacao': 'Importação',
        'exportacao': 'Exportação',
        'supply-chain': 'Supply Chain',
        'governanca': 'Governança',
        'metodo': 'Método',
        'contato': 'Contato'
    };

    const navLinks = Object.entries(pages).map(([key, label]) => {
        const href = key === 'index' ? 'index.html' : `${key}.html`;
        const active = key === currentPage ? 'active' : '';
        return `<a href="${href}" class="${active}">${label}</a>`;
    }).join('');

    return `
        <header class="header">
            <div class="container">
                <div class="header-content">
                    <div class="logo">
                        <a href="index.html">
                            <h1>OLV Internacional</h1>
                        </a>
                    </div>
                    <nav class="nav">
                        ${navLinks}
                    </nav>
                    <div class="theme-toggle">
                        <button class="theme-btn" id="themeToggle" aria-label="Alternar tema">
                            <span class="theme-icon">🌓</span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    `;
}

function createFooter() {
    return `
        <footer class="footer">
            <div class="container">
                <div class="footer-content">
                    <div class="footer-section">
                        <h3>OLV Internacional</h3>
                        <p>Gestora estratégica de importação, exportação e cadeias globais de suprimentos (Supply Chain 360°)</p>
                    </div>
                    <div class="footer-section">
                        <h4>Navegação</h4>
                        <ul>
                            <li><a href="index.html">Início</a></li>
                            <li><a href="sobre.html">Sobre</a></li>
                            <li><a href="importacao.html">Importação</a></li>
                            <li><a href="exportacao.html">Exportação</a></li>
                            <li><a href="supply-chain.html">Supply Chain</a></li>
                            <li><a href="governanca.html">Governança</a></li>
                            <li><a href="metodo.html">Método</a></li>
                            <li><a href="contato.html">Contato</a></li>
                        </ul>
                    </div>
                    <div class="footer-section">
                        <h4>Contato</h4>
                        <p>Entre em contato para entender como podemos ajudar sua empresa.</p>
                        <a href="contato.html" class="btn btn-secondary">Falar com especialista</a>
                    </div>
                </div>
                <div class="footer-bottom">
                    <p>&copy; 2024 OLV Internacional. Todos os direitos reservados.</p>
                </div>
            </div>
        </footer>
    `;
}

// Função para inicializar componentes na página
function initComponents(currentPage = '') {
    const headerPlaceholder = document.getElementById('header-placeholder');
    const footerPlaceholder = document.getElementById('footer-placeholder');
    
    if (headerPlaceholder) {
        headerPlaceholder.innerHTML = createHeader(currentPage);
    }
    
    if (footerPlaceholder) {
        footerPlaceholder.innerHTML = createFooter();
    }
    
    // Re-initialize theme toggle after header is loaded
    setTimeout(() => {
        if (typeof initThemeToggle === 'function') {
            initThemeToggle();
        }
    }, 50);
    
    // Re-initialize accordions after components are loaded
    setTimeout(() => {
        if (typeof initAccordions === 'function') {
            initAccordions();
        }
    }, 100);
    
    // One more time to be sure
    setTimeout(() => {
        if (typeof initAccordions === 'function') {
            initAccordions();
        }
    }, 300);
}
