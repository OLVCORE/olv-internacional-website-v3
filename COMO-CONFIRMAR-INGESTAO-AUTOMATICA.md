# Como confirmar se a ingestão automática (8h e 14h) funcionou

## Horários do cron (Vercel)

- **08:00** horário de Brasília (= 11:00 UTC)
- **14:00** horário de Brasília (= 17:00 UTC)

Se são 11:04 em Brasília, a execução das **8h** já deveria ter ocorrido (~3h atrás). A próxima é às **14h**.

---

## 1. Ver pelo diagnóstico do blog (rápido)

Abra no navegador ou via PowerShell:

```
https://www.olvinternacional.com.br/api/blog/diagnose
```

Na resposta JSON, use:

- **`ingestion.lastPostAt`** — data/hora do artigo **mais recente** no banco.  
  - Se for **hoje** e após 8h (ou 14h), a ingestão desse horário provavelmente rodou (ou já existiam artigos de hoje).  
  - Se for **ontem ou antes**, pode ser que: (a) o cron não tenha disparado, ou (b) tenha rodado mas nenhum artigo novo passou no filtro (tudo duplicado ou rejeitado).
- **`ingestion.totalPosts`** — total de artigos (ex.: 39).
- **`posts.recent`** — últimos 10 posts com `datePublished`; o primeiro é o mais novo.

Assim você confirma se há conteúdo novo após 8h (e depois de 14h).

---

## 2. Ver nos logs da Vercel (cron realmente disparou?)

1. Acesse **Vercel Dashboard** → seu projeto **olv-internacional-website-v3**.
2. Aba **Logs** (ou **Cron Jobs**, se existir): filtre por **`/api/blog/process`** ou por horário **11:00 UTC** (8h BRT) e **17:00 UTC** (14h BRT).
3. Confira se há **invocações** nesses horários e se o status é **200** (sucesso) ou **5xx/timeout** (erro).

Se não aparecer nenhuma execução às 11:00 UTC ou 17:00 UTC, o **Cron da Vercel** pode estar desativado (ex.: plano Hobby não executa cron).

---

## 3. Disparar uma ingestão manual (teste)

Para testar o fluxo sem depender do cron:

```powershell
Invoke-WebRequest -Uri "https://www.olvinternacional.com.br/api/blog/process" -Method POST -UseBasicParsing
```

Ou no navegador (como GET):

```
https://www.olvinternacional.com.br/api/blog/process
```

A resposta traz `rssStats` (itens encontrados, aceitos, salvos, duplicados). Depois, chame de novo o **diagnose** e veja se **`lastPostAt`** ou **`posts.recent`** mudaram.

---

## 4. Resumo

| O que verificar | Onde |
|------------------|------|
| Data do último artigo | `GET /api/blog/diagnose` → `ingestion.lastPostAt` e `posts.recent[0]` |
| Total de artigos | `ingestion.totalPosts` ou `posts.total` |
| Se o cron disparou | Vercel Dashboard → Logs (horários 11:00 e 17:00 UTC) |
| Testar ingestão manual | `POST` ou `GET /api/blog/process` |

Se **lastPostAt** continuar antigo (>12h) mesmo após os horários 8h e 14h BRT, confira os logs da Vercel para ver se o cron está sendo executado e se `/api/blog/process` retorna 200.
