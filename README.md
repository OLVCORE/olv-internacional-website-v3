# Website Institucional OLV Internacional

Website institucional completo para a OLV Internacional - Gestora estratégica de importação, exportação e cadeias globais de suprimentos.

## 📁 Estrutura do Projeto

```
olv-internacional-website-v3/
├── index.html          # Página inicial
├── sobre.html          # Sobre a OLV
├── importacao.html     # Página de Importação
├── exportacao.html     # Página de Exportação
├── supply-chain.html   # Supply Chain 360°
├── governanca.html     # Governança & Risk Management
├── metodo.html         # Método OLV
├── contato.html        # Página de Contato
├── styles.css          # Estilos principais
├── script.js           # Funcionalidades JavaScript
├── components.js       # Componentes reutilizáveis (Header/Footer)
└── README.md          # Este arquivo
```

## 🎨 Funcionalidades

### Design & UX
- ✅ Dark/Light/System theme toggle (apenas CSS)
- ✅ Design responsivo (mobile-first)
- ✅ Accordions/dropdowns em todos os cards
- ✅ Animações suaves e transições
- ✅ Acessibilidade (ARIA labels, navegação por teclado)

### Navegação
- ✅ Header fixo com navegação entre páginas
- ✅ Footer com links para todas as páginas
- ✅ Scroll suave entre seções
- ✅ Indicador de página ativa no menu

### Conteúdo
- ✅ 8 microciclos implementados conforme especificação
- ✅ Cards colapsáveis com dropdowns explicativos
- ✅ Checklist interativo
- ✅ Formulário de contato completo
- ✅ Páginas dedicadas para cada serviço

## 🚀 Como Usar

### Opção 1: Servidor Local (Recomendado)

**Com Node.js:**
```bash
# Instalar Node.js se ainda não tiver
# Baixe em: https://nodejs.org/

# Iniciar servidor
npm start
# ou
node server.js

# Acesse: http://localhost:3000
```

**Com Python (alternativa):**
```bash
# Python 3
python -m http.server 3000

# Python 2
python -m SimpleHTTPServer 3000

# Acesse: http://localhost:3000
```

**Windows:**
- Clique duas vezes em `start-server.bat`

**Linux/Mac:**
```bash
chmod +x start-server.sh
./start-server.sh
```

### Opção 2: Abrir Diretamente

1. **Abrir o site**: Abra `index.html` no navegador (pode ter limitações com CORS)
2. **Navegação**: Use o menu superior para navegar entre páginas
3. **Tema**: Clique no botão de tema (🌓) no header para alternar entre Light/Dark/System
4. **Accordions**: Clique nos cards para expandir/colapsar conteúdo

## 📄 Páginas

### index.html
Página inicial com:
- Hero section
- O Problema Real (6 cards)
- Diagnóstico/Checklist
- Overview de serviços

### sobre.html
Página institucional com:
- Quem somos
- Missão, Visão, Valores
- Diferenciação

### importacao.html
Página completa sobre importação:
- 5 serviços principais com dropdowns
- Processo em 5 etapas
- CTA para contato

### exportacao.html
Página completa sobre exportação:
- 5 serviços principais com dropdowns
- Processo em 5 etapas
- CTA para contato

### supply-chain.html
Página sobre Supply Chain 360°:
- 6 pilares numerados com dropdowns
- Benefícios
- CTA para contato

### governanca.html
Página sobre Governança & Risk:
- 5 pilares com dropdowns
- Estrutura de governança
- CTA para contato

### metodo.html
Página sobre o Método OLV:
- 6 etapas numeradas com dropdowns detalhados
- Diferenciais
- CTA para contato

### contato.html
Página de contato com:
- Formulário completo
- Informações de contato
- Cards informativos

## 🎯 Características Técnicas

### CSS
- Variáveis CSS para temas
- Media queries para responsividade
- Transições suaves
- Grid e Flexbox para layout

### JavaScript
- Theme toggle (Light/Dark/System)
- Accordions funcionais
- Smooth scroll
- Form handling
- Intersection Observer para animações

### Componentes
- Header e Footer reutilizáveis via `components.js`
- Navegação dinâmica com indicador de página ativa

## 🔧 Personalização

### Cores
Edite as variáveis CSS em `styles.css`:
```css
:root {
    --accent-primary: #0066cc;
    --accent-secondary: #00a86b;
    /* ... */
}
```

### Conteúdo
Edite os arquivos HTML diretamente. Cada página é independente.

### Navegação
Edite `components.js` para adicionar/remover páginas do menu.

## 📱 Responsividade

- Desktop: 1200px+
- Tablet: 768px - 1199px
- Mobile: < 768px

## 🌐 Compatibilidade

- Chrome/Edge (últimas versões)
- Firefox (últimas versões)
- Safari (últimas versões)
- Mobile browsers

## 📝 Notas

- O formulário de contato atualmente mostra um alerta. Para produção, conecte a um backend.
- As informações de contato (telefone, email) são placeholders e devem ser atualizadas.
- O site não requer build process - funciona diretamente abrindo os arquivos HTML.

## 🎨 Identidade Visual

- **Cores principais**: Azul (#0066cc) e Verde (#00a86b)
- **Tipografia**: Inter (Google Fonts)
- **Estilo**: Moderno, profissional, focado em conteúdo

---

**Desenvolvido para OLV Internacional**  
Gestora estratégica de importação, exportação e cadeias globais de suprimentos (Supply Chain 360°)
