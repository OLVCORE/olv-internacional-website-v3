# Ingestão automática do blog (plano Pro)

## Com plano Pro, os Crons rodam

No **Vercel Pro**, os **Cron Jobs** configurados no `vercel.json` **são executados**.  
O projeto está com 2 agendamentos:

- **08:00 UTC** (05:00 BRT) → chama `/api/blog/process`
- **20:00 UTC** (17:00 BRT) → chama `/api/blog/process`

Se não está entrando notícia nova no blog/ticker, a causa **não** é “cron desligado”, e sim algo na execução ou nos dados (feeds, filtro, duplicatas, etc.).

---

## Como verificar por que não entram notícias novas

### 1. Ver se o Cron está rodando

1. **Vercel Dashboard** → seu projeto → **Settings** → **Cron Jobs**
2. Confirme que aparecem os 2 jobs (`0 8 * * *` e `0 20 * * *`) e que estão **Ativos**
3. Em **Deployments** → último deployment → **Functions** → `/api/blog/process`  
   Veja se há execuções às **08:00 UTC** e **20:00 UTC** nos últimos dias

Se não houver execuções nesses horários, o cron pode estar desativado ou o deploy pode não ter subido o `vercel.json` atual.

---

### 2. Ver o que a ingestão está fazendo (logs)

1. **Vercel Dashboard** → **Deployments** → último deployment
2. **Functions** → clique em **/api/blog/process**
3. Abra uma execução recente (por cron ou manual) e veja os **logs**

Procure por:

- `⏰ Processamento iniciado pelo Vercel Cron` → confirma que foi o cron
- `📡 RESUMO DO PROCESSAMENTO RSS` → quantos itens foram encontrados, aceitos, duplicados, salvos
- `💾 ARTIGOS SALVOS NESTA EXECUÇÃO: X` → se for **0** sempre, o problema é:
  - **todos duplicados** (URL já existe no banco), ou
  - **filtro rejeitando** (itens rejeitados pelo filtro de relevância), ou
  - **feeds falhando** (erro 502, timeout, etc.)

Com isso você descobre se o problema é: cron não rodando, feeds quebrados, filtro forte ou só duplicatas.

---

### 3. Testar ingestão manual

Chame o endpoint à mão e veja a resposta:

- **URL:** `https://www.olvinternacional.com.br/api/blog/process`
- **Método:** **GET** ou **POST**

A resposta em JSON traz:

- `articles`: quantos artigos foram processados **nessa** execução
- `totalPostsInDB`: total de posts no banco depois do processamento
- `postsByCategory`: como está a distribuição (notícias, análises, etc.)
- Se `articles === 0`, pode vir `warning` e `possibleReasons` com sugestões

Se manualmente aparecer `articles > 0`, a lógica está ok e o que pode estar errado é o horário do cron ou a forma como o Vercel está invocando a função.

---

### 4. Diagnóstico da API

- **GET** `https://www.olvinternacional.com.br/api/blog/diagnose`

O diagnóstico mostra estado do banco, quantidade de posts por categoria e testes dos feeds RSS. Use para ver se o banco está crescendo e se os feeds respondem.

---

## Resumo (plano Pro)

| Situação | O que fazer |
|----------|-------------|
| Cron ativo, mas `articles` sempre 0 | Ver logs do `/api/blog/process` (resumo RSS). Ajustar filtro ou fontes se tudo for rejeitado ou duplicado. |
| Nenhuma execução às 8h/20h UTC | Conferir **Settings → Cron Jobs** e último deploy (se `vercel.json` com `crons` foi deployado). |
| Erro 500 ou timeout no process | Ver stack trace nos logs; pode ser timeout (60s), falha de feed ou banco. |

As otimizações do **ticker** (endpoint `/api/blog/ticker`, cache, refresh 10 min) continuam válidas e independem do plano.
