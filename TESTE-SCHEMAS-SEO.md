# 🧪 TESTE DE SCHEMAS SEO - OLV Internacional
## Validação de Rich Snippets e Structured Data

---

## 📋 CHECKLIST DE TESTES

### **1. Google Rich Results Test**
**URL:** https://search.google.com/test/rich-results

**Páginas para testar:**
- ✅ https://www.olvinternacional.com.br/
- ✅ https://www.olvinternacional.com.br/metodo.html
- ✅ https://www.olvinternacional.com.br/importacao.html
- ✅ https://www.olvinternacional.com.br/exportacao.html
- ✅ https://www.olvinternacional.com.br/supply-chain.html
- ✅ https://www.olvinternacional.com.br/governanca.html

**O que verificar:**
- [ ] HowTo Schema válido (metodo.html)
- [ ] Service Schema válido (todas as páginas de serviço)
- [ ] LocalBusiness Schema válido (index.html)
- [ ] FAQPage Schema válido (6 páginas)
- [ ] BreadcrumbList Schema válido (todas as páginas)
- [ ] Organization Schema válido (index.html)
- [ ] ProfessionalService Schema válido (index.html)

---

### **2. Schema.org Validator**
**URL:** https://validator.schema.org/

**Testar:**
- [ ] Validar JSON-LD de todas as páginas
- [ ] Verificar erros de sintaxe
- [ ] Confirmar tipos de schema corretos

---

### **3. Google Search Console**
**URL:** https://search.google.com/search-console

**Ações:**
- [ ] Enviar sitemap.xml atualizado
- [ ] Verificar cobertura de indexação
- [ ] Monitorar rich snippets ativos
- [ ] Verificar erros de schema (se houver)

---

### **4. Core Web Vitals**
**URL:** https://pagespeed.web.dev/

**Métricas para verificar:**
- [ ] LCP (Largest Contentful Paint) < 2.5s
- [ ] FID (First Input Delay) < 100ms
- [ ] CLS (Cumulative Layout Shift) < 0.1

**Páginas para testar:**
- [ ] index.html
- [ ] metodo.html
- [ ] importacao.html
- [ ] exportacao.html

---

## 🔍 RESULTADOS ESPERADOS

### **Rich Snippets Esperados:**
1. **HowTo** - Passo a passo do método OLV (metodo.html)
2. **Service** - Cards de serviços detalhados (4 páginas)
3. **LocalBusiness** - Informações de negócio local (index.html)
4. **FAQ** - Perguntas frequentes (6 páginas)
5. **Breadcrumbs** - Navegação hierárquica (todas as páginas)

### **Tempo de Aparecimento:**
- Rich snippets podem aparecer em 2-4 semanas após indexação
- Google precisa processar e validar os schemas primeiro

---

## ⚠️ SE ENCONTRAR ERROS

### **Erros Comuns:**
1. **Schema inválido** - Verificar sintaxe JSON-LD
2. **Propriedades faltando** - Adicionar propriedades obrigatórias
3. **URLs incorretas** - Verificar URLs nos schemas
4. **Tipos incorretos** - Verificar @type correto

### **Como Corrigir:**
1. Identificar erro no Google Rich Results Test
2. Corrigir no código HTML
3. Testar novamente
4. Aguardar reindexação

---

## 📊 STATUS ATUAL

**Data do teste:** _______________

**Resultados:**
- [ ] Todos os schemas válidos
- [ ] Rich snippets aparecendo
- [ ] Core Web Vitals otimizados
- [ ] Sem erros no Search Console

**Próxima revisão:** _______________

---

## ✅ PRÓXIMOS PASSOS

1. Executar todos os testes acima
2. Documentar resultados
3. Corrigir erros (se houver)
4. Monitorar rich snippets nas próximas semanas
