// ============================================
// THEME TOGGLE (Dark / Light / System)
// ============================================
function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle || themeToggle.dataset.initialized === 'true') return;
    
    const html = document.documentElement;
    
    // Theme options: 'light', 'dark', 'system'
    const themes = ['light', 'dark', 'system'];
    let currentThemeIndex = 0;
    
    // Load saved theme or default to 'system'
    const savedTheme = localStorage.getItem('theme') || 'system';
    currentThemeIndex = themes.indexOf(savedTheme);
    if (currentThemeIndex === -1) currentThemeIndex = 2; // default to system
    
    // Apply theme
    function applyTheme(theme) {
        html.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        updateThemeIcon(theme);
    }
    
    // Update theme icon
    function updateThemeIcon(theme) {
        const icon = themeToggle.querySelector('.theme-icon');
        if (icon) {
            switch(theme) {
                case 'light':
                    icon.textContent = '☀️';
                    break;
                case 'dark':
                    icon.textContent = '🌙';
                    break;
                case 'system':
                    icon.textContent = '🌓';
                    break;
            }
        }
    }
    
    // Mark as initialized
    themeToggle.dataset.initialized = 'true';
    
    // Initialize theme
    applyTheme(savedTheme);
    
    // Toggle theme on click
    themeToggle.addEventListener('click', function() {
        currentThemeIndex = (currentThemeIndex + 1) % themes.length;
        applyTheme(themes[currentThemeIndex]);
    });
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', function() {
        if (html.getAttribute('data-theme') === 'system') {
            // Force re-application of system theme
            html.removeAttribute('data-theme');
            setTimeout(() => {
                html.setAttribute('data-theme', 'system');
            }, 10);
        }
    });
}

// Initialize theme toggle when DOM is ready
(function() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initThemeToggle);
    } else {
        initThemeToggle();
    }
    
    // Also try after delay for dynamically loaded content
    setTimeout(initThemeToggle, 100);
    setTimeout(initThemeToggle, 500);
})();

// ============================================
// ACCORDIONS / DROPDOWNS
// ============================================
function initAccordions() {
    const accordions = document.querySelectorAll('.card-accordion');
    
    accordions.forEach(accordion => {
        // Skip if already initialized
        if (accordion.dataset.initialized === 'true') return;
        
        const header = accordion.querySelector('.card-header');
        const content = accordion.querySelector('.card-content');
        
        if (!header || !content) {
            console.warn('Accordion missing header or content:', accordion);
            return;
        }
        
        // Mark as initialized
        accordion.dataset.initialized = 'true';
        
        // Set initial state
        accordion.setAttribute('aria-expanded', 'false');
        
        // Toggle on click
        header.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const isExpanded = accordion.getAttribute('aria-expanded') === 'true';
            
            // Toggle current accordion
            accordion.setAttribute('aria-expanded', !isExpanded);
            
            // Smooth scroll to accordion if opening
            if (!isExpanded) {
                setTimeout(() => {
                    accordion.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 100);
            }
        });
        
        // Keyboard support
        header.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                header.click();
            }
        });
    });
}

// Initialize accordions when DOM is ready
(function() {
    // Run immediately if DOM is already loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAccordions);
    } else {
        initAccordions();
    }
    
    // Also run after a short delay to catch dynamically loaded content
    setTimeout(initAccordions, 100);
    setTimeout(initAccordions, 500);
})();

// ============================================
// SMOOTH SCROLL FOR ANCHOR LINKS
// ============================================
(function() {
    // Smooth scroll para links âncora na mesma página
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#' || href === '#!') return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Smooth scroll para links que apontam para outras páginas com âncora
    document.querySelectorAll('a[href*=".html#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            const [page, anchorId] = href.split('#');
            const currentPage = window.location.pathname.split('/').pop() || 'index.html';
            
            // Se for a mesma página, apenas faz scroll
            if (page === currentPage || (page === '' && anchorId)) {
                e.preventDefault();
                const target = document.querySelector('#' + anchorId);
                if (target) {
                    const headerOffset = 80;
                    const elementPosition = target.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
})();

// ============================================
// FORM HANDLING
// ============================================
(function() {
    const form = document.querySelector('.contato-form');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            
            // Here you would normally send the data to a server
            // For now, we'll just show an alert
            console.log('Form data:', data);
            
            // Show success message
            alert('Obrigado pelo seu interesse! Entraremos em contato em breve.');
            
            // Reset form
            form.reset();
        });
    }
})();

// ============================================
// INTERSECTION OBSERVER FOR ANIMATIONS
// ============================================
(function() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe all cards
    document.querySelectorAll('.card-accordion').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
})();

// ============================================
// HEADER SCROLL EFFECT
// ============================================
(function() {
    const header = document.querySelector('.header');
    let lastScroll = 0;
    
    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.boxShadow = 'none';
        }
        
        lastScroll = currentScroll;
    });
})();
