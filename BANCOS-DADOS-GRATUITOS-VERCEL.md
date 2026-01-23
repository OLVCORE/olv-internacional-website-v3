# 🆓 BANCOS DE DADOS GRATUITOS NO VERCEL
## Comparação para Blog OLV Internacional

---

## ✅ **OPÇÕES COM PLANO GRATUITO**

### **1. Neon (Serverless Postgres)** ⭐ **RECOMENDADO**
- ✅ **Plano Gratuito:** Sim
- ✅ **Limite:** 256 MB inicial (expandável para 512 MB)
- ✅ **Compute:** ~192 horas/mês (2 vCPU)
- ✅ **Vantagens:**
  - Postgres nativo (compatível com nosso código)
  - Serverless (paga apenas pelo que usa)
  - Branching de banco (útil para dev/test)
  - Time travel (recuperar versões antigas)
  - Integração nativa com Vercel
- ✅ **Ideal para:** Blog com até ~10.000 artigos
- ⚠️ **Limitação:** Não auto-scales (precisa upgrade manual)
- 🔗 **Link:** Marketplace → Neon

---

### **2. Supabase (Postgres Backend)** ⭐ **EXCELENTE ALTERNATIVA**
- ✅ **Plano Gratuito:** Sim
- ✅ **Limite:** 500 MB de banco + 1 GB de file storage
- ✅ **Vantagens:**
  - Postgres completo
  - Dashboard visual excelente
  - APIs REST automáticas
  - Autenticação incluída
  - Realtime subscriptions
  - Edge Functions (500K invocações/mês)
- ⚠️ **Limitação:** Banco fica read-only se exceder 500 MB
- ✅ **Ideal para:** Projetos que precisam de mais recursos
- 🔗 **Link:** Marketplace → Supabase

---

### **3. Turso (Serverless SQLite)**
- ✅ **Plano Gratuito:** Sim
- ✅ **Limite:** 500 MB de armazenamento
- ✅ **Vantagens:**
  - SQLite (mais leve que Postgres)
  - Muito rápido
  - Replicação global
- ⚠️ **Desvantagem:** SQLite (não Postgres, mas funciona)
- 🔗 **Link:** Marketplace → Turso

---

### **4. MongoDB Atlas**
- ✅ **Plano Gratuito:** Sim (M0)
- ✅ **Limite:** 512 MB de armazenamento
- ✅ **Vantagens:**
  - NoSQL (flexível)
  - Muito popular
- ⚠️ **Desvantagem:** Não é Postgres (precisa adaptar código)
- 🔗 **Link:** Marketplace → MongoDB Atlas

---

### **5. Upstash (Redis)**
- ✅ **Plano Gratuito:** Sim
- ✅ **Limite:** 10.000 comandos/dia
- ⚠️ **Desvantagem:** Redis (chave-valor, não ideal para blog)
- 🔗 **Link:** Marketplace → Upstash

---

## ❌ **OPÇÕES SEM PLANO GRATUITO (ou muito limitado)**

- **AWS** - Pago (mas pode ter free tier limitado)
- **Prisma Postgres** - Pago
- **Nile** - Pago
- **MotherDuck** - Pago
- **Convex** - Pago
- **Edge Config** - Não é banco de dados
- **Blob** - Storage de arquivos, não banco

---

## 🎯 **RECOMENDAÇÃO PARA O BLOG**

### **Opção 1: Neon (Mais Fácil)** ⭐
- ✅ Postgres nativo (código já funciona)
- ✅ 0.5 GB gratuito (suficiente para blog)
- ✅ Integração simples no Vercel
- ✅ Serverless (escala automaticamente)

### **Opção 2: Supabase (Mais Recursos)**
- ✅ Postgres completo
- ✅ Dashboard visual excelente
- ✅ 500 MB + 1 GB storage
- ✅ Mais recursos (auth, storage, etc.)

---

## 📋 **COMO CONFIGURAR NEON (RECOMENDADO)**

### **1. Criar Banco no Vercel:**
1. Dashboard → **Storage** → **Create Database**
2. Escolha: **Neon** (do Marketplace)
3. Nome: `olv-blog-db`
4. Região: **São Paulo** (ou mais próxima)
5. Clique em **Create**

### **2. Variáveis de Ambiente:**
O Vercel cria automaticamente:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`

### **3. Inicializar:**
```
GET https://www.olvinternacional.com.br/api/blog/init-db
```

---

## 💰 **COMPARAÇÃO DE CUSTOS**

| Banco | Gratuito | Pago (após limite) |
|-------|----------|-------------------|
| **Neon** | 256-512 MB | $0.10/GB/mês |
| **Supabase** | 500 MB + 1 GB | $25/mês (Pro) |
| **Turso** | 500 MB | $29/mês (Pro) |
| **MongoDB** | 512 MB | $9/mês (M2) |

---

## ✅ **DECISÃO FINAL**

**Para o blog OLV Internacional, recomendo:**

### **🥇 Neon (Primeira Opção)**
- Postgres nativo
- Código já funciona (usa @vercel/postgres)
- 256-512 MB gratuito (suficiente para blog)
- Integração nativa com Vercel
- Serverless e escalável

### **🥈 Supabase (Alternativa)**
- Se precisar de mais recursos
- Dashboard melhor
- Mais funcionalidades

---

**Última atualização:** Janeiro 2026
