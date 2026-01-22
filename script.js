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
                    icon.innerHTML = '<i class="fas fa-sun"></i>';
                    break;
                case 'dark':
                    icon.innerHTML = '<i class="fas fa-moon"></i>';
                    break;
                case 'system':
                    icon.innerHTML = '<i class="fas fa-desktop"></i>';
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

// Initialize theme toggle when DOM is ready (otimizado)
(function() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initThemeToggle, { once: true });
    } else {
        initThemeToggle();
    }
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
// CHECKLIST ADHERENCE SYSTEM
// ============================================
(function() {
    const checkboxes = document.querySelectorAll('.checklist-item input[type="checkbox"]');
    const infoButtons = document.querySelectorAll('.checklist-info-btn');
    const submitBtn = document.getElementById('checklistSubmitBtn');
    const modal = document.getElementById('checklistModal');
    const modalClose = document.querySelector('.modal-close');
    const checklistForm = document.getElementById('checklistForm');
    
    // Total possible score (all items checked)
    const maxScore = Array.from(checkboxes).reduce((sum, cb) => {
        return sum + parseInt(cb.dataset.weight || 1);
    }, 0);
    
    // Função para criar card dinâmico
    function createDynamicCard(checkboxId, config) {
        const card = document.createElement('div');
        card.className = 'impact-card dynamic-card';
        card.id = `dynamic-card-${checkboxId}`;
        card.style.borderLeft = `4px solid ${config.borderColor}`;
        card.style.animation = 'fadeIn 0.5s ease';
        
        card.innerHTML = `
            <div class="impact-icon" style="color: ${config.iconColor}">
                <i class="fas ${config.icon}"></i>
            </div>
            <h4>${config.title}</h4>
            <p>${config.description}</p>
        `;
        
        return card;
    }
    
    // Função para gerenciar cards dinâmicos
    function manageDynamicCards(checkedItems) {
        const impactGrid = document.querySelector('.impact-grid');
        if (!impactGrid) return;
        
        // Remover cards dinâmicos existentes
        document.querySelectorAll('.dynamic-card').forEach(card => card.remove());
        
        // Adicionar novos cards dinâmicos para checkboxes marcados
        checkedItems.forEach(item => {
            const config = typeof dynamicCardsConfig !== 'undefined' ? dynamicCardsConfig[item.id] : null;
            if (config) {
                const card = createDynamicCard(item.id, config);
                impactGrid.appendChild(card);
            }
        });
    }
    
    // Update adherence meter - SISTEMA INTELIGENTE BASEADO EM VALOR ESTRATÉGICO
    function updateAdherence() {
        let score = 0;
        const checkedItems = [];
        let checkedCount = 0;
        
        // TODOS os itens têm ALTA importância estratégica
        // Sistema baseado em valor estratégico, não apenas posição
        // Cada item selecionado indica um desafio real que a OLV pode resolver
        
        checkboxes.forEach((checkbox, index) => {
            if (checkbox.checked) {
                checkedCount++;
                
                // Sistema de peso estratégico: TODOS os itens têm grande importância
                // Baseado na importância estratégica do problema, não apenas frequência
                let strategicWeight;
                
                // Itens críticos (impacto direto em custos e margem)
                if (index === 0 || index === 3 || index === 4) { // Custos ocultos, margem, negociação
                    strategicWeight = 18;
                }
                // Itens de governança e risco (impacto em segurança operacional)
                else if (index === 1 || index === 5 || index === 10 || index === 11) { // Dependência, inadimplência, contratos, mercados
                    strategicWeight = 17;
                }
                // Itens de visibilidade e controle (impacto em eficiência)
                else if (index === 2 || index === 6 || index === 7 || index === 8 || index === 9 || index === 12) { // TCO, incêndios, visibilidade, regimes, parceiros, oportunidades
                    strategicWeight = 16;
                }
                else {
                    // Fallback: mesmo itens não categorizados têm peso significativo
                    strategicWeight = 15;
                }
                
                score += strategicWeight;
                checkedItems.push({
                    id: checkbox.id,
                    label: checkbox.nextElementSibling.textContent.trim(),
                    weight: strategicWeight,
                    originalWeight: parseInt(checkbox.dataset.weight || 1),
                    position: index + 1
                });
            }
        });
        
        // Sistema de cálculo inteligente que reconhece valor estratégico
        let percentage;
        
        if (checkedCount === 0) {
            percentage = 0;
        } else if (checkedCount === 1) {
            // 1 item = 35% (qualquer item sozinho já indica necessidade significativa)
            percentage = 35;
        } else if (checkedCount === 2) {
            // 2 itens = 55% (dois desafios indicam necessidade clara)
            percentage = 55;
        } else if (checkedCount === 3) {
            // 3 itens = 70% (múltiplos desafios indicam necessidade alta)
            percentage = 70;
        } else if (checkedCount === 4) {
            // 4 itens = 85% (vários desafios indicam necessidade muito alta)
            percentage = 85;
        } else if (checkedCount >= 5) {
            // 5+ itens = 100% (múltiplos desafios indicam necessidade máxima)
            percentage = 100;
        }
        
        // Garantir que nunca fique abaixo do mínimo baseado em itens selecionados
        const minPercentage = Math.min(checkedCount * 20, 100);
        percentage = Math.max(percentage, minPercentage);
        
        // Limitar a 100%
        percentage = Math.min(percentage, 100);
        const scoreElement = document.getElementById('adherenceScore');
        const fillElement = document.getElementById('adherenceFill');
        const levelElement = document.getElementById('adherenceLevel');
        
        if (scoreElement) scoreElement.textContent = percentage + '%';
        if (fillElement) {
            fillElement.style.width = percentage + '%';
            
            // Update color based on maturity level (vermelho → verde = maturidade crescente)
            if (percentage === 0) {
                fillElement.style.background = 'var(--bg-tertiary)';
            } else if (percentage < 25) {
                // Vermelho - Baixa maturidade
                fillElement.style.background = 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)';
            } else if (percentage < 50) {
                // Laranja - Maturidade em desenvolvimento
                fillElement.style.background = 'linear-gradient(90deg, #f97316 0%, #ea580c 100%)';
            } else if (percentage < 75) {
                // Amarelo - Maturidade média
                fillElement.style.background = 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)';
            } else if (percentage < 100) {
                // Verde claro - Alta maturidade
                fillElement.style.background = 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)';
            } else {
                // Verde - Maturidade máxima
                fillElement.style.background = 'linear-gradient(90deg, #10b981 0%, #059669 100%)';
            }
        }
        
        // Update score color (progressão vermelho → verde)
        if (scoreElement) {
            if (percentage === 0) {
                scoreElement.style.color = 'var(--text-tertiary)';
            } else if (percentage < 25) {
                scoreElement.style.color = '#ef4444';
            } else if (percentage < 50) {
                scoreElement.style.color = '#f97316';
            } else if (percentage < 75) {
                scoreElement.style.color = '#f59e0b';
            } else if (percentage < 100) {
                scoreElement.style.color = '#22c55e';
            } else {
                scoreElement.style.color = '#10b981';
            }
        }
        
        // Update level description - MENSAGENS MAIS PERSUASIVAS E REALISTAS
        if (levelElement) {
            let levelText = 'Marque os itens que se aplicam à sua empresa';
            let levelDesc = '';
            
            if (percentage === 0) {
                levelText = 'Nível de Aderência';
                levelDesc = 'Comece marcando os itens que se aplicam à sua empresa';
            } else if (percentage < 40) {
                levelText = 'Potencial Identificado';
                levelDesc = `Você identificou ${checkedCount} ${checkedCount === 1 ? 'desafio estratégico' : 'desafios estratégicos'} que a OLV pode resolver. Cada item representa uma oportunidade significativa de melhoria.`;
            } else if (percentage < 60) {
                levelText = 'Alto Potencial';
                levelDesc = `Você identificou ${checkedCount} desafios estratégicos. A OLV tem soluções específicas para cada um deles, com impacto direto em custos, margem e competitividade.`;
            } else if (percentage < 80) {
                levelText = 'Muito Alto Potencial';
                levelDesc = `Você identificou ${checkedCount} desafios estratégicos. A OLV pode estruturar uma solução integrada que resolve múltiplos problemas simultaneamente, transformando desafios em vantagem competitiva.`;
            } else if (percentage < 100) {
                levelText = 'Potencial Máximo';
                levelDesc = `Você identificou ${checkedCount} desafios estratégicos. A OLV pode estruturar uma solução completa de Supply Chain 360° que integra estratégia, operação e resultado para transformar sua cadeia de suprimentos.`;
            } else {
                levelText = 'Potencial Estratégico Completo';
                levelDesc = `Você identificou ${checkedCount} desafios estratégicos. A OLV pode estruturar uma solução completa e integrada que resolve todos esses desafios, transformando sua operação internacional em vantagem competitiva sustentável.`;
            }
            
            levelElement.innerHTML = `
                <span class="level-text">${levelText}</span>
                <span class="level-desc">${levelDesc}</span>
            `;
        }
        
        // Mostrar/ocultar seção de impacto no Supply Chain
        const impactSection = document.getElementById('supplyChainImpact');
        if (impactSection) {
            if (percentage > 0) {
                impactSection.style.display = 'block';
                // Gerenciar cards dinâmicos
                manageDynamicCards(checkedItems);
            } else {
                impactSection.style.display = 'none';
            }
        }
        
        // Store data for form
        if (document.getElementById('adherenceValue')) {
            document.getElementById('adherenceValue').value = percentage;
        }
        if (document.getElementById('selectedItems')) {
            document.getElementById('selectedItems').value = JSON.stringify(checkedItems);
        }
    }
    
    // Toggle dropdown on info button click
    infoButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const itemId = this.dataset.item;
            const dropdown = document.getElementById('dropdown' + itemId);
            
            // Close all other dropdowns
            document.querySelectorAll('.checklist-dropdown').forEach(dd => {
                if (dd !== dropdown) {
                    dd.classList.remove('active');
                }
            });
            
            // Toggle current dropdown
            if (dropdown) {
                dropdown.classList.toggle('active');
            }
        });
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.checklist-item')) {
            document.querySelectorAll('.checklist-dropdown').forEach(dd => {
                dd.classList.remove('active');
            });
        }
    });
    
    // Update adherence when checkbox changes
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            // Fechar dropdown quando checkbox é marcado
            const item = this.closest('.checklist-item');
            if (item) {
                const dropdown = item.querySelector('.checklist-dropdown');
                if (dropdown && dropdown.classList.contains('active')) {
                    dropdown.classList.remove('active');
                }
            }
            updateAdherence();
        });
    });
    
    // Open modal on submit button click
    if (submitBtn) {
        submitBtn.addEventListener('click', function() {
            const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
            
            if (checkedCount === 0) {
                alert('Por favor, marque pelo menos um item para continuar.');
                return;
            }
            
            updateAdherence();
            if (modal) {
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    }
    
    // Close modal
    if (modalClose) {
        modalClose.addEventListener('click', function() {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    
    // Close modal when clicking outside
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
    
    // Handle form submission
    if (checklistForm) {
        checklistForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            const adherence = document.getElementById('adherenceValue').value;
            const selectedItems = JSON.parse(document.getElementById('selectedItems').value);
            
            // Prepare email report
            const report = {
                nome: data.nome,
                email: data.email,
                telefone: data.telefone,
                empresa: data.empresa,
                adherence: adherence + '%',
                selectedItems: selectedItems,
                timestamp: new Date().toISOString()
            };
            
            // Detectar ambiente (desenvolvimento ou produção)
            const isDevelopment = window.location.hostname === 'localhost' || 
                                 window.location.hostname === '127.0.0.1' ||
                                 window.location.port === '3000';
            
            // URL base da API
            const apiBaseUrl = isDevelopment 
                ? '' // Usar URL relativa em desenvolvimento
                : 'https://api.olvinternacional.com.br'; // Em produção, usar subdomínio de API ou ajustar conforme necessário
            
            // Send to server (NOTIFICAÇÃO IMEDIATA - email é enviado automaticamente)
            fetch(`${apiBaseUrl}/api/checklist-report`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(report)
            })
            .then(response => {
                // Verificar se a resposta é JSON
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    // Se não for JSON, provavelmente é um erro 404 ou HTML
                    throw new Error(`Servidor retornou ${response.status}: ${response.statusText}. Verifique se o servidor está rodando.`);
                }
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                return response.json();
            })
            .then(result => {
                if (result.success) {
                    console.log('✅ Relatório enviado - notificação imediata ativada');
                    
                    // Mostrar página de confirmação formatada
                    showConfirmationPage(data.nome, data.empresa, adherence, selectedItems);
                    
                    // Close modal and reset
                    if (modal) modal.classList.remove('active');
                    if (document.body) document.body.style.overflow = '';
                    if (checklistForm) checklistForm.reset();
                } else {
                    alert('Erro ao enviar relatório. Por favor, tente novamente.');
                    if (modal) modal.classList.remove('active');
                    if (document.body) document.body.style.overflow = '';
                }
            })
            .catch(error => {
                console.error('Error:', error);
                console.error('Detalhes:', error.message);
                
                // Não usar fallback de mailto - mostrar mensagem de erro amigável
                const errorMessage = error.message && error.message.includes('Servidor retornou') 
                    ? `O servidor não está respondendo corretamente. Por favor, verifique se o servidor está rodando (npm start) e tente novamente.\n\nSe o problema persistir, entre em contato diretamente:\n\nEmail: consultores@olvinternacional.com.br\nWhatsApp: +55 11 99924-4444`
                    : `Desculpe, ${data.nome}. Ocorreu um erro ao enviar seu relatório automaticamente. Por favor, entre em contato diretamente:\n\nEmail: consultores@olvinternacional.com.br\nWhatsApp: +55 11 99924-4444\n\nNossa equipe está pronta para ajudar!`;
                
                alert(errorMessage);
                if (modal) modal.classList.remove('active');
                if (document.body) document.body.style.overflow = '';
            });
            
            // Optionally reset checkboxes
            // checkboxes.forEach(cb => cb.checked = false);
            // updateAdherence();
        });
    }
    
    // Initialize
    updateAdherence();
})();

// ============================================
// CONFIRMAÇÃO FORMATADA
// ============================================
function showConfirmationPage(nome, empresa, adherence, selectedItems) {
    // Criar elemento de confirmação
    const confirmation = document.createElement('div');
    confirmation.id = 'confirmation-overlay';
    confirmation.className = 'confirmation-overlay';
    
    const adherenceNum = parseInt(adherence);
    const adherenceLevel = adherenceNum < 30 ? 'Baixa' : 
                          adherenceNum < 60 ? 'Média' : 
                          adherenceNum < 80 ? 'Alta' : 'Muito Alta';
    
    const adherenceColor = adherenceNum < 30 ? '#f59e0b' : 
                          adherenceNum < 60 ? '#3b82f6' : 
                          adherenceNum < 80 ? '#10b981' : '#ef4444';
    
    confirmation.innerHTML = `
        <div class="confirmation-content">
            <div class="confirmation-header">
                <div class="confirmation-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h2>Relatório Enviado com Sucesso!</h2>
            </div>
            <div class="confirmation-body">
                <p class="confirmation-greeting">Olá, <strong>${nome}</strong>!</p>
                <p class="confirmation-message">
                    Recebemos seu relatório de diagnóstico de aderência da empresa <strong>${empresa}</strong>.
                </p>
                
                <div class="confirmation-adherence">
                    <div class="adherence-badge" style="border-color: ${adherenceColor};">
                        <div class="adherence-percentage" style="color: ${adherenceColor};">
                            ${adherence}%
                        </div>
                        <div class="adherence-label">Nível de Aderência: <strong>${adherenceLevel}</strong></div>
                    </div>
                </div>
                
                <div class="confirmation-items">
                    <p class="items-title">Itens identificados: <strong>${selectedItems.length}</strong></p>
                    <ul class="items-preview">
                        ${selectedItems.slice(0, 3).map(item => `<li>${item.label}</li>`).join('')}
                        ${selectedItems.length > 3 ? `<li class="more-items">+ ${selectedItems.length - 3} outros itens</li>` : ''}
                    </ul>
                </div>
                
                <div class="confirmation-next-steps">
                    <h3>Próximos Passos</h3>
                    <p>Se os dados informados estiverem corretos, um consultor especializado da OLV Internacional entrará em contato com você em até <strong>24 horas úteis</strong> para:</p>
                    <ul>
                        <li><i class="fas fa-check"></i> Analisar seu relatório de aderência em detalhes</li>
                        <li><i class="fas fa-check"></i> Entender melhor as necessidades da sua empresa</li>
                        <li><i class="fas fa-check"></i> Apresentar soluções personalizadas para seus desafios</li>
                    </ul>
                </div>
                
                <div class="confirmation-contact">
                    <p><strong>Dúvidas?</strong> Entre em contato:</p>
                    <p>
                        <i class="fas fa-envelope"></i> 
                        <a href="mailto:consultores@olvinternacional.com.br">consultores@olvinternacional.com.br</a>
                    </p>
                    <p>
                        <i class="fab fa-whatsapp"></i> 
                        <a href="https://wa.me/5511999244444" target="_blank">+55 11 99924-4444</a>
                    </p>
                </div>
            </div>
            <div class="confirmation-footer">
                <button class="btn btn-primary" onclick="closeConfirmation()">Entendi, obrigado!</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(confirmation);
    document.body.style.overflow = 'hidden';
    
    // Animar entrada
    requestAnimationFrame(() => {
        confirmation.classList.add('active');
    });
}

function closeConfirmation() {
    const confirmation = document.getElementById('confirmation-overlay');
    if (confirmation) {
        confirmation.classList.remove('active');
        setTimeout(() => {
            confirmation.remove();
            document.body.style.overflow = '';
        }, 300);
    }
}

// Fechar ao clicar fora
document.addEventListener('click', function(e) {
    const confirmation = document.getElementById('confirmation-overlay');
    if (confirmation && e.target === confirmation) {
        closeConfirmation();
    }
});

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
            
            // Show loading state
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Enviando...';
            
            // Detectar ambiente (desenvolvimento ou produção)
            const isDevelopment = window.location.hostname === 'localhost' || 
                                 window.location.hostname === '127.0.0.1' ||
                                 window.location.port === '3000';
            
            // URL base da API
            const apiBaseUrl = isDevelopment 
                ? '' // Usar URL relativa em desenvolvimento
                : 'https://api.olvinternacional.com.br'; // Em produção, usar subdomínio de API ou ajustar conforme necessário
            
            // Send to server
            fetch(`${apiBaseUrl}/api/contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(result => {
                if (result.success) {
                    alert('✅ Obrigado! Sua mensagem foi enviada com sucesso. Entraremos em contato em breve.');
                    form.reset();
                } else {
                    alert('❌ Erro ao enviar mensagem. Por favor, tente novamente ou entre em contato diretamente pelo email: consultores@olvinternacional.com.br');
                }
            })
            .catch(error => {
                console.error('Network error:', error);
                alert('❌ Erro de conexão. Verifique sua internet e tente novamente. Se o problema persistir, entre em contato diretamente pelo email: consultores@olvinternacional.com.br ou WhatsApp: +55 11 99924-4444');
            })
            .finally(() => {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            });
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
    if (!header) return; // Se header não existe, não fazer nada
    
    let lastScroll = 0;
    
    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;
        
        if (header) { // Verificação adicional
            if (currentScroll > 100) {
                header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
            } else {
                header.style.boxShadow = 'none';
            }
        }
        
        lastScroll = currentScroll;
    });
})();
