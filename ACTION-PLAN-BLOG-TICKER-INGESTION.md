# Plano de Ação: Blog, Ticker e Ingestão

**Objetivo:** Ticker mostrando todos os posts do blog, ingestão de notícias funcionando várias vezes ao dia, e blog enriquecido para SEO (Google orgânico + palavras-chave já implementadas).

---

## 1. O que foi implementado (imediatamente)

### 1.1 Ticker — mostrar todos os posts e não “parar” com 1 item

- **Problema:** O ticker exibia só 1 item (“Análise de Comércio Exterior - Dados MDIC 2026”) e parecia parado/lento.
- **Causa provável:** (1) Filtro por data (24h/48h/7d) reduzia a lista; (2) com 1 item o scroll ficava curto e dava impressão de parado.
- **Alterações em `news-ticker.js`:**
  - **Removido** o filtro por data: o ticker passa a mostrar **todos** os posts retornados pela API (até 50), em ordem da mais recente para a mais antiga.
  - Com **poucos itens (1–4)**, a lista é repetida até ter pelo menos 8 itens e depois duplicada para o scroll contínuo, para o ticker não parecer parado.
  - **Cache** do ticker: de 5 min para **2 min** (localStorage).
  - **Refresh** do ticker: de 10 min para **5 min** (recolhe dados da API com mais frequência).

Assim, assim que a ingestão popular o banco com mais posts (análises, notícias, guias, insights), o ticker passará a exibir todos eles, sem depender de “últimas 24h”.

### 1.2 Ingestão — mais execuções por dia (Cron Vercel)

- **Problema:** Ingestão 2x/dia (8h e 20h UTC) não era suficiente; notícias diárias das fontes RSS não apareciam no blog/ticker.
- **Alteração em `vercel.json`:**
  - Cron de **2x** para **6x** por dia (UTC): **0h, 4h, 8h, 12h, 16h, 20h**.
  - Ou seja: ingestão a cada **4 horas**, aumentando a chance de notícias novas entrarem no mesmo dia.

**Importante:** O Vercel Cron chama `GET /api/blog/process`. É necessário **Vercel Pro** (ou plano que permita Crons) para os agendamentos funcionarem.

---

## 2. Por que o ticker pode ainda mostrar só 1 item

O ticker e a página do blog usam a **mesma fonte de dados**: no Vercel, `loadPosts()` em `blog-api.js` lê do **Neon (Postgres)**. Se no Neon existir só 1 post, tanto o blog quanto o ticker verão 1 post.

Possíveis causas:

1. **Ingestão não está rodando** (Cron desativado ou falha silenciosa).
2. **Ingestão roda mas não grava no Neon** (erro em `saveArticleToDB`, filtros descartando itens, deduplicação excessiva).
3. **Neon foi usado em outro ambiente** e no projeto atual está vazio ou com 1 post antigo.

**O que fazer:**

1. **Forçar ingestão manualmente (uma vez):**  
   Abra no navegador (ou via `curl`):  
   `https://SEU-DOMINIO.vercel.app/api/blog/process`  
   (GET ou POST). Isso dispara o mesmo fluxo do Cron e pode popular o banco.
2. **Conferir logs no Vercel:**  
   Em **Vercel Dashboard → Project → Logs**, filtrar por `api/blog/process` e ver se há erros ou “0 artigos processados”.
3. **Usar o diagnóstico:**  
   `GET https://SEU-DOMINIO.vercel.app/api/blog/diagnose`  
   (se existir) para ver total de posts no banco e por categoria.

Depois do deploy, com Cron 6x/dia e uma execução manual se necessário, o banco tende a acumular mais posts e o ticker passará a mostrar todos (até 50).

---

## 3. Foco no blog e SEO

- O blog já está no menu (**Blog**) e as **palavras-chave** foram aplicadas no site (incluindo páginas e meta tags).
- Com o ticker mostrando **todos** os posts (análises, notícias, guias, insights), a home fica mais rica e alinhada ao conteúdo do blog, o que ajuda em:
  - **Google orgânico:** mais conteúdo relevante e atualizado na mesma página.
  - **Consistência** com as campanhas do Google Ads (mesmas temáticas no site e no blog).

Nenhuma alteração extra de SEO foi feita neste plano; o foco foi ticker + ingestão.

---

## 4. Perplexity API — análises enriquecidas (opcional)

Você comentou usar **Perplexity** (https://www.perplexity.ai/) para análises mais robustas (em vez de ou além de outro modelo) e pediu uma **avaliação de custo**.

### 4.1 Custos aproximados (Perplexity API)

- **Search API:** em torno de **US$ 5 por 1.000 requisições** (sem custo extra por token em alguns planos).
- **Modelos Sonar (por milhão de tokens):**  
  - Entrada ~US$ 1–3; saída ~US$ 1–15 conforme o modelo (Sonar, Sonar Pro, etc.).
- **Uso típico para “análise por notícia”:** 1 requisição por artigo processado (ex.: resumir ou classificar).  
  - 100 notícias/dia → ~3.000 requisições/mês → ordem de **US$ 15/mês** só em Search API, mais tokens se usar modelos Sonar em chamadas longas.

Valores exatos dependem do plano e do tipo de chamada (Search vs. modelo); o acima serve como ordem de grandeza.

### 4.2 Quando faz sentido

- **Vale a pena** se quiser **resumos, insights ou categorização** automática dos artigos (ex.: “análise”, “notícia”, “guia”) usando um modelo com busca na web (Perplexity).
- **Custo:** baixo para poucos artigos/dia; cresce com volume. Recomendado começar com um limite diário (ex.: 50–100 chamadas) e medir custo real.

### 4.3 Implementação sugerida (futura)

- Criar um módulo (ex.: `blog-perplexity.js` ou função em `blog-api.js`) que:
  - Recebe o título + trecho do conteúdo (ou URL) do artigo.
  - Chama a **Perplexity API** (Search ou Sonar) para obter resumo ou tags.
  - Grava o resultado no post (ex.: `summary`, `category_suggested`) antes de salvar no Neon.
- Manter a ingestão atual (RSS + ComexStat etc.) como está; Perplexity seria um **enriquecimento opcional** por artigo, não substituição da ingestão.

Não foi implementada nenhuma chamada à Perplexity neste plano; a ideia é usar este documento como base quando decidir integrar.

---

## 5. Resumo do que fazer agora

1. **Deploy** das alterações (ticker + cron em `vercel.json`).
2. **Forçar ingestão uma vez:** abrir `https://SEU-DOMINIO.vercel.app/api/blog/process`.
3. **Conferir** em **Vercel → Logs** se `api/blog/process` está sendo chamado pelo Cron e se não há erros.
4. **Aguardar** algumas horas (com cron 6x/dia) e recarregar a home: o ticker deve passar a mostrar todos os posts disponíveis no banco (até 50), sem filtrar por data.
5. **Opcional (futuro):** integrar Perplexity API para enriquecer análises e avaliar custo real com uso controlado.

Se quiser, no próximo passo podemos: (a) revisar os logs de `api/blog/process` após um deploy, ou (b) esboçar a interface do módulo Perplexity (função em `blog-api.js` + variáveis de ambiente) para você implementar quando decidir.
