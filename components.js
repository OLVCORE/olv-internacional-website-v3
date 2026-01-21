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
                        <a href="index.html" class="logo-link">
                            <div class="logo-circle">
                                <img src="https://raw.githubusercontent.com/OLVCORE/olv-internacional-website-v3/main/logo-olv.jpeg" alt="OLV Internacional" class="logo-img">
                            </div>
                            <div class="logo-text">
                                <h1>OLV Internacional</h1>
                                <p class="logo-slogan">Integramos estratégia, operação e resultado</p>
                            </div>
                        </a>
                    </div>
                    <nav class="nav">
                        ${navLinks}
                    </nav>
                    <div class="theme-toggle">
                        <button class="theme-btn" id="themeToggle" aria-label="Alternar tema">
                            <span class="theme-icon"><i class="fas fa-desktop"></i></span>
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
                        <div class="social-links">
                            <a href="https://www.instagram.com/olvinternacional" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                                <i class="fab fa-instagram"></i>
                            </a>
                            <a href="https://www.linkedin.com/company/olv-internacional" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                                <i class="fab fa-linkedin-in"></i>
                            </a>
                            <a href="https://www.facebook.com/olvinternacional" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                                <i class="fab fa-facebook-f"></i>
                            </a>
                        </div>
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
                        <div class="contact-info">
                            <p><i class="fas fa-envelope"></i> <a href="mailto:consultores@olvinternacional.com.br">consultores@olvinternacional.com.br</a></p>
                            <p><i class="fas fa-phone"></i> <a href="tel:+551126751446">+55 11 2675 1446</a></p>
                            <p><i class="fab fa-whatsapp"></i> <a href="https://wa.me/5511999244444" target="_blank" rel="noopener noreferrer">+55 11 99924-4444</a></p>
                            <p><i class="fas fa-map-marker-alt"></i> Avenida Paulista, 1471 - Conj 1110<br>CEP 01311-927 - Bela Vista<br>São Paulo - SP</p>
                        </div>
                        <a href="contato.html" class="btn btn-secondary">Falar com especialista</a>
                    </div>
                    <div class="footer-section">
                        <h4>Serviços</h4>
                        <ul>
                            <li><a href="importacao.html">Gestão de Importação</a></li>
                            <li><a href="exportacao.html">Estruturação de Exportação</a></li>
                            <li><a href="supply-chain.html">Supply Chain 360°</a></li>
                            <li><a href="governanca.html">Governança & Risk Management</a></li>
                            <li><a href="metodo.html">Metodologia OLV</a></li>
                        </ul>
                    </div>
                </div>
                <div class="footer-bottom">
                    <div class="footer-bottom-content">
                        <p class="footer-links">
                            <a href="politica-privacidade.html">Política de Privacidade</a> | 
                            <a href="termos-uso.html">Termos de Uso</a>
                        </p>
                        <p class="footer-legal">
                            &copy; Copyright - 2026 | OLV INTERNACIONAL - CNPJ 67.867.580/0001-90 / Desenvolvido por <strong>OLV CORE DIGITAL</strong> | All Rights Reserved | Powered by <strong>OLV Internacional</strong>
                        </p>
                    </div>
                </div>
            </div>
        </footer>
        
        <!-- Botão WhatsApp Flutuante -->
        <a href="https://wa.me/5511999244444" class="whatsapp-float" target="_blank" rel="noopener noreferrer" aria-label="Fale conosco no WhatsApp">
            <i class="fab fa-whatsapp"></i>
            <span class="whatsapp-tooltip">Fale conosco</span>
        </a>
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
    
    // Re-initialize theme toggle after header is loaded (otimizado)
    requestAnimationFrame(() => {
        if (typeof initThemeToggle === 'function') {
            initThemeToggle();
        }
    });
    
    // Re-initialize accordions after components are loaded (otimizado)
    requestAnimationFrame(() => {
        if (typeof initAccordions === 'function') {
            initAccordions();
        }
    });
}
