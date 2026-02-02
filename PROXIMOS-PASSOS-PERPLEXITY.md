# Próximos passos para implementar Perplexity

**Status:** Integração implementada. A chave foi adicionada no **`.env`** (local). Para **produção**, adicione a mesma chave no **Vercel** (não no Supabase — Supabase/Neon é só o banco).

Objetivo: após puxar notícias das fontes RSS, chamar a Perplexity para **analisar cada notícia no contexto OLV** (supply chain, comércio exterior, gestão internacional) e gravar essa análise no artigo antes de publicar no blog.

---

## 1. Visão geral do fluxo

```
RSS (notícia) → Filtro editorial OLV → [NOVO] Perplexity (análise contextual) → saveArticle(article) → Blog
```

- O ponto de integração é no **blog-api.js**, logo **antes** de `saveArticle(article)` (por volta da linha 1520), só para artigos que vêm de RSS e passaram no filtro.
- Chamamos um módulo `perplexity-service.js` que recebe o artigo, envia título + trecho para a API Perplexity com um prompt OLV, e devolve o texto da análise.
- Gravamos a análise no artigo (ex.: `article.olvAnalysis`) e opcionalmente usamos para sugerir categoria ou enriquecer `content`/`excerpt`.

---

## 2. Passos de implementação

### Passo 1 — Obter API key da Perplexity

1. Acesse: https://www.perplexity.ai/  
2. Crie conta ou faça login.  
3. Vá em **Settings** → **API** (ou em https://docs.perplexity.ai/ para “Get API key”).  
4. Crie uma API key e copie.  
5. No **Vercel**: **Project** → **Settings** → **Environment Variables** → adicione:
   - Nome: `PERPLEXITY_API_KEY`
   - Valor: a chave copiada
   - Ambientes: Production (e, se quiser, Preview)

No **local** (opcional), crie `.env` na raiz do projeto:

```env
PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxx
```

Não commite a chave no Git.

---

### Passo 2 — Módulo de serviço Perplexity (já criado)

O arquivo **`perplexity-service.js`** já existe na raiz do projeto. Ele:

- Exporta `enrichArticleWithPerplexity(article, options)`.
- Se `PERPLEXITY_API_KEY` não estiver definida, retorna o artigo sem alteração (sem chamar a API).
- Envia para a API Perplexity (modelo `sonar`):
  - **System:** contexto OLV (supply chain, comércio exterior, gestão internacional, desenvolvimento de negócios).
  - **User:** título + excerpt/trecho da notícia.
- Recebe a análise em texto e grava em `article.olvAnalysis`.
- Opcional: usa um **teto diário** de análises (ex.: 10/dia) para controlar custo; acima do teto, não chama a API.

Configuração sugerida no próprio módulo (ou via env):

- `PERPLEXITY_MAX_ANALYSES_PER_DAY` (ex.: 10).
- Modelo: `sonar` (mais barato) ou `sonar-pro` se quiser análises mais longas.

---

### Passo 3 — Integrar no blog-api.js

1. No topo de **blog-api.js**, adicionar:
   ```js
   const { enrichArticleWithPerplexity } = require('./perplexity-service');
   ```

2. No loop de processamento RSS, **antes** de `saveArticle(article)` (por volta da linha 1520), apenas para artigos RSS aceitos:
   ```js
   // Opcional: enriquecer com análise OLV via Perplexity
   if (process.env.PERPLEXITY_API_KEY && article.source === 'rss') {
       try {
           await enrichArticleWithPerplexity(article, { maxTokens: 500 });
       } catch (e) {
           console.warn('Perplexity enrich skip:', e.message);
       }
   }
   await saveArticle(article);
   ```

3. Garantir que o banco (Neon) persista o novo campo:
   - Em **blog-db-neon.js**, na função que monta o objeto do post (ex.: `saveArticleToDB`), incluir o campo `olv_analysis` (ou o nome que escolher) na tabela/coluna.
   - Se a tabela já existir sem essa coluna, adicionar um migration ou `ALTER TABLE` para `olv_analysis TEXT` (ou equivalente).

Assim, só notícias RSS aceitas pelo filtro editorial serão enviadas à Perplexity, e a análise ficará salva no artigo.

---

### Passo 4 — Exibir a análise no blog

1. Em **blog-post.html** (ou no template que renderiza o post), após o conteúdo principal, exibir:
   - Se `post.olvAnalysis` existir, mostrar uma seção tipo “Análise OLV” ou “No contexto da OLV” com esse texto.
2. Em **blog-api.js** (ou no endpoint que retorna um post), garantir que o campo `olvAnalysis` seja incluído na resposta (leitura do banco já trazendo essa coluna).

Assim, o visitante vê a notícia + a análise contextualizada OLV.

---

### Passo 5 — Controle de custo (teto diário)

- No **perplexity-service.js**, manter um contador de quantas análises foram feitas “hoje” (por exemplo, em memória por processo, ou em uma tabela/Redis se tiver).
- Antes de chamar a API, checar: se já atingiu `PERPLEXITY_MAX_ANALYSES_PER_DAY` (ex.: 10), retornar o artigo sem chamar Perplexity.
- No Vercel, cada invocação do Cron é um processo; o contador em memória conta só aquela execução. Para um teto “global” por dia, seria necessário persistir (ex.: tabela `perplexity_daily_count` com data e contagem). Para começar, o teto por execução (ex.: “máximo 5 análises por run”) já ajuda a limitar custo.

---

## 3. Ordem sugerida

| # | Ação |
|---|------|
| 1 | Obter `PERPLEXITY_API_KEY` e configurar no Vercel (e `.env` local se usar). |
| 2 | Implementar/ajustar **perplexity-service.js** (já criado como base). |
| 3 | Integrar no **blog-api.js** (require + chamada antes de `saveArticle`). |
| 4 | Adicionar coluna `olv_analysis` no Neon e persistir em **blog-db-neon.js**. |
| 5 | Exibir `olvAnalysis` em **blog-post.html** e na API de leitura do post. |
| 6 | (Opcional) Implementar teto diário de análises no **perplexity-service.js**. |

---

## 4. Custo estimado (lembrete)

- Sonar: ~US$ 0,0015 por análise; 10 análises/dia ≈ US$ 0,015/dia ≈ **R$ 2,50/mês** (dólar ~R$ 5,50).
- Detalhes em **CUSTO-POR-ANALISE-PERPLEXITY-OLV.md**.

---

## 5. Arquivos envolvidos

| Arquivo | Alteração |
|---------|------------|
| **perplexity-service.js** | Novo: chamada à API Perplexity, prompt OLV, `enrichArticleWithPerplexity`. |
| **blog-api.js** | Require do serviço + chamada antes de `saveArticle` para artigos RSS. |
| **blog-db-neon.js** | Persistir e ler campo `olv_analysis` (ou equivalente). |
| **blog-post.html** | Exibir seção “Análise OLV” quando `post.olvAnalysis` existir. |
| **Vercel** | Variável de ambiente `PERPLEXITY_API_KEY`. |

Com isso, você tem os próximos passos claros para implementar o Perplexity no fluxo do blog OLV.
