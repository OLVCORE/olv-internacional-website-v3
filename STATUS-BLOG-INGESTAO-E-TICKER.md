# Status: Blog, Ingestão e Ticker

**Última atualização:** aplicado correções para ingestão RSS e comportamento do ticker.

---

## O que já está implementado

### Ticker
- **API:** `/api/blog/ticker` retorna **todos** os posts do blog (até 50), ordenados do mais recente.
- **Front:** `news-ticker.js` usa esse endpoint; com poucos itens repete a lista até 16 para o scroll contínuo.
- **Cache:** Versão 2 do cache; se houver ≤2 itens no cache, ignora e refaz o fetch.
- **Velocidade:** Animação em **70s** por ciclo (ajustável em `styles.css` → `.news-ticker-content`).

Se o ticker ainda mostrar só 1 item:
1. Fazer um **deploy** das últimas alterações.
2. **Limpar cache** do site (Ctrl+Shift+R ou limpar dados do site) ou abrir em aba anônima.
3. Confirmar que `/api/blog/ticker` retorna vários posts (abrir no navegador ou em Ferramentas do desenvolvedor → Rede).

### Ingestão automática (Cron)
- **Horários no Vercel (UTC):** 1:08, 1:14, 0:00, 4:00, 8:00, 12:00, 16:00, 20:00.
- **Endpoint:** `GET` ou `POST` em `/api/blog/process` (o cron do Vercel chama esse path).
- **Plano:** Crons funcionam em plano **Pro** (confirmado pelo usuário).

### RSS
- **User-Agent:** Passado no rss-parser (`Mozilla/5.0 (compatible; OLV-Blog/1.0; +https://www.olvinternacional.com.br)`) para reduzir 502 em alguns sites.
- **Retry:** Até 3 tentativas com 4s de espera em erros 502/503/504, ECONNRESET, ETIMEDOUT.
- **Feeds ativos:** Valor (`/rss`), Exame, Agência Brasil, Bloomberg, JOC, WTO (ver `blog-api.js` → `RSS_FEEDS`).  
- **Removido:** `valor.com.br/rss/internacional` (retornava 502).

### Perplexity
- Integração em `perplexity-service.js`; chamada no fluxo de ingestão para artigos RSS aceitos.
- Chave em produção: **Vercel** → Environment Variables → `PERPLEXITY_API_KEY` (não no Supabase).

---

## Próximos passos (você)

1. **Deploy**  
   Garantir que o último código (RSS com User-Agent + retry, ticker, crons) está em produção.

2. **Forçar uma ingestão manual**  
   Abrir no navegador (ou via PowerShell):
   ```text
   https://www.olvinternacional.com.br/api/blog/process
   ```
   Ou:
   ```powershell
   Invoke-WebRequest -Uri "https://www.olvinternacional.com.br/api/blog/process" -Method POST -UseBasicParsing
   ```
   Ver na resposta: `articles` (novos processados) e `totalPostsInDB`.

3. **Conferir logs no Vercel**  
   Em **Logs**, filtrar por **Request Path** = `/api/blog/process` e por horários dos crons (1:08 e 1:14 UTC, etc.).  
   Procurar por:
   - `[CRON] Processamento iniciado` (quando for o cron).
   - `Erro ao buscar feed RSS` (qual URL e status).
   - `Processamento concluído: X artigos` (X > 0 quando houver notícias novas aceitas).

4. **Se continuar 0 artigos novos**  
   - Os feeds podem não ter itens novos que passem no filtro (supply chain, comércio exterior, etc.).
   - Ou todos os itens já estão no banco (duplicatas).
   - Use **Diagnóstico:**  
     `https://www.olvinternacional.com.br/api/blog/diagnose`  
     para ver totais por categoria, feeds configurados e erros.

---

## Resumo técnico

| Item              | Onde está / Comportamento |
|-------------------|----------------------------|
| Ticker (dados)    | `/api/blog/ticker` → `loadPosts()` → até 50 posts |
| Ticker (UI)       | `news-ticker.js` + `.news-ticker-content` (70s) em `styles.css` |
| Ingestão          | `blog-api.js` → `processAllSources()` (RSS + outros) |
| Cron              | `vercel.json` → `crons[]` → `/api/blog/process` |
| RSS fetch         | `blog-api.js` → `fetchRSSFeed()` com User-Agent e retry |
| Perplexity        | `perplexity-service.js`; chave em Vercel env |

Com isso, blog, ingestão e ticker estão alinhados; os resultados visíveis dependem de deploy, cache do navegador e de os feeds terem notícias novas que passem no filtro OLV.
