# Entregáveis – Nova Home OLV Internacional

## 1. Meta e headings aplicados

### Meta title (até ~60 caracteres)
**OLV Internacional | Consultoria em Supply Chain e Comércio Exterior**

### Meta description (até ~155 caracteres)
**Consultoria em Supply Chain e Comércio Exterior para indústrias. Redução de custos, governança e segurança em operações globais. Agende um diagnóstico gratuito.**

### Headings da página (H1 único + H2 por seção)
| Nível | Texto |
|-------|--------|
| H1 | Sua indústria está perdendo margem com impostos, fretes e estoques altos? |
| H2 | Quando faz sentido falar com a OLV? |
| H2 | O que fazemos pela sua indústria |
| H2 | Resultados que já entregamos |
| H2 | Quem já confia na OLV |
| H2 | Por que a OLV? |
| H2 | Pronto para reduzir custos e riscos na sua cadeia de suprimentos global? |
| H2 | Agende seu diagnóstico gratuito |

### Palavras-chave utilizadas no conteúdo
- consultoria em supply chain  
- consultoria em comércio exterior  
- logística internacional  
- redução de custos na cadeia de suprimentos  
- regimes especiais REPETRO, RECOF, ex-tarifário  
- governança  
- B2B industrial  

---

## 2. Estrutura HTML/CSS entregue

- **index.html**: Hero, seções (Quando faz sentido, O que fazemos, Resultados, Quem confia, Por que a OLV, CTA final) e formulário de agendamento com id `form-diagnostico` e form `form-diagnostico-home`.
- **styles.css**: Bloco “HOME V2” com classes `.home-section`, `.home-section-intro`, `.home-dor-list`, `.home-servicos-grid`, `.home-servico-card`, `.home-resultados-grid`, `.home-resultado-card`, `.home-depoimento`, `.home-logos-placeholder`, `.home-diferenciais-list`, `.home-cta-wrap`, `.home-form-wrapper`, `.home-form-success`, `.form-trust` e media queries para mobile.
- **script.js**: Tratamento do formulário da home (segmento, porte, maior_desafio), montagem da mensagem para o template EmailJS, mensagem de sucesso específica (“Recebemos seus dados. Em até 1 dia útil…”) e exibição do bloco `#home-form-success` após envio.

---

## 3. Melhorias de UX e performance (para o desenvolvedor)

### UX
- **Botões**: CTAs com área de clique adequada; botão principal “Agendar diagnóstico gratuito” acima da dobra e repetido na seção final.  
- **Formulário**: Campos nome, e-mail, telefone, empresa, cargo, segmento, porte e “maior desafio”; labels e placeholders claros; mensagem de sucesso explícita.  
- **Tipografia**: Tamanhos com `clamp()` e linha ~1.6–1.7; espaçamento entre seções consistente.  
- **Mobile**: Layout responsivo (grid em 1 coluna em telas pequenas); seções com padding reduzido em mobile.  
- **Contraste**: Uso das variáveis CSS do tema (--text-primary, --accent-primary) para manter contraste e acessibilidade.

### Performance
- **Imagens**: Usar WebP quando possível; comprimir imagens (ex.: TinyPNG, Squoosh); incluir `width`/`height` para evitar layout shift.  
- **CSS/JS**: Manter minificação em produção; não alterar estrutura central do site.  
- **Cache**: Manter Cache-Control adequado no servidor (ex.: 30s para APIs, mais longo para estáticos).  
- **Fontes**: Fontes já com `font-display: swap` e preconnect; evitar fontes adicionais desnecessárias.  
- **Testes**: Usar PageSpeed Insights e GTmetrix para velocidade e experiência mobile; corrigir itens críticos (LCP, CLS, FID/INP).

### Imagens (quando houver)
- Usar `alt` descritivo, por exemplo: “Equipe da OLV Internacional em reunião de planejamento de Supply Chain global”.

---

## 4. Template EmailJS (formulário home)

O envio usa o mesmo serviço/template do contato. No corpo do e-mail devem aparecer, para o formulário da home:

- **interesse**: valor do campo Segmento.  
- **message**: texto montado com Segmento, Porte e “Maior desafio” (já implementado em `script.js`).

Se o template atual tiver só “Mensagem”, esse texto único já contém as três informações. Se quiser campos separados no e-mail, criar variáveis no template (ex.: `{{segmento}}`, `{{porte}}`, `{{maior_desafio}}`) e incluí-las em `templateParams` no `script.js`.
