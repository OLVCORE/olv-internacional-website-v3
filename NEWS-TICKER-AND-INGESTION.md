# News Ticker & Blog Ingestion – How They Work Together

## Overview

Two mechanisms keep the site’s “Últimas Notícias” bar and blog content up to date:

1. **Blog ingestion** – Fetches new articles from RSS feeds and APIs, saves them to the database.
2. **News ticker** – Reads posts from the same database via the API and shows headlines in the ticker.

Both must work for the ticker to show new materials.

---

## 1. News Ticker

- **File:** `news-ticker.js`
- **What it does:** Calls `GET /api/blog/posts?category=all&perPage=100&page=1`, then shows headlines in the ticker.
- **Behavior:**
  - Prefers posts from the last 24h, then 48h, then 7 days.
  - If there are no “recent” posts, it shows the **latest 20 posts** by date so the ticker is never empty when posts exist.
  - Uses `window.location.origin` so the same code works on localhost and production (e.g. www.olvinternacional.com.br).
  - Caches results in `localStorage` and refreshes every 5 minutes.
  - Handles both response shapes: array or `{ posts: [] }`.
- **Where it appears:** Header on all pages that use `components.js` (e.g. index, blog, etc.).

If the ticker shows “Nenhuma notícia disponível” or “Erro ao carregar notícias”, check:

- Network tab: request to `/api/blog/posts` returns 200 and JSON with a `posts` array (or a direct array).
- Console: no CORS or script errors.
- API returns at least some posts (ingestion may not have run yet).

---

## 2. Blog Ingestion

- **Endpoint:** `POST /api/blog/process` (or GET when called by Vercel Cron).
- **What it does:** Runs `processAndPublish()` which:
  - Fetches from APIs (ComexStat, UN Comtrade, World Bank) and from RSS feeds (Valor, Exame, Agência Brasil, Bloomberg, etc.).
  - Filters and deduplicates, then saves new posts to the Neon DB.
- **When it runs:**
  - **Automatically (Vercel):** Cron in `vercel.json` runs **twice per day**:
    - `0 8 * * *`  → 08:00 UTC (05:00 BRT)
    - `0 20 * * *` → 20:00 UTC (17:00 BRT)
  - **Manually:** Call `POST https://www.olvinternacional.com.br/api/blog/process` (browser, curl, or cron-job.org).

**Vercel Cron requires a Pro plan.** If you don’t have it, use an external cron (e.g. cron-job.org) to hit the URL above twice per day.

After ingestion runs, new posts are in the database. The next time the ticker loads (or within 5 minutes when it refreshes), it will show them.

---

## 3. Flow (End-to-End)

```
RSS/APIs → POST /api/blog/process (ingestion) → Neon DB
                                              ↓
Ticker → GET /api/blog/posts ←────────────────┘
         → Renders headlines in the bar
```

- Ingestion fills/updates the DB.
- Ticker only reads from the API (which reads from the same DB).
- So: **fix ingestion if no new materials appear; fix ticker/API if materials exist but the ticker doesn’t show them.**

---

## 4. Quick Checks

| Check | What to do |
|-------|------------|
| Ticker empty but blog has posts | Open DevTools → Network: `/api/blog/posts` returns 200 and `posts` array. If yes, check `news-ticker.js` and console errors. |
| Ticker shows “Erro ao carregar notícias” | Same as above; often CORS or wrong origin. Ticker uses `window.location.origin` so it should match the site. |
| No new posts in blog/ticker | Run ingestion manually: `POST /api/blog/process`. Check Vercel logs for errors. Ensure cron is set (Vercel Pro or cron-job.org). |
| Old posts only in ticker | Ticker prefers recent dates then falls back to latest 20. If DB only has old posts, run ingestion to pull new ones. |

---

## 5. Files Reference

- **Ticker:** `news-ticker.js`, `components.js` (injects header + loads ticker), `styles.css` (`.news-ticker-*`).
- **Ingestion:** `api/blog/process.js`, `blog-processor.js`, `blog-api.js` (`processAllSources`), `vercel.json` (crons).
- **API used by ticker:** `api/blog/posts.js` (GET `/api/blog/posts`).

Both mechanisms are designed to work together: ingestion feeds the database, and the ticker reads from it so the site always shows the latest available materials.
