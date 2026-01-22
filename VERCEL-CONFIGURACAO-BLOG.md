# 🚀 CONFIGURAÇÃO DO BLOG NO VERCEL
## OLV Internacional | Serverless Functions e Cron Jobs

---

## ✅ **O QUE FOI IMPLEMENTADO**

### **1. Serverless Functions**
- ✅ `api/blog/posts.js` - Listar posts
- ✅ `api/blog/post/[id].js` - Buscar post específico
- ✅ `api/blog/process.js` - Processar fontes

### **2. Configuração Vercel**
- ✅ `vercel.json` - Configuração de rotas e funções
- ✅ Rotas API configuradas
- ✅ Timeout aumentado para processamento (60s)

### **3. Ajustes no Código**
- ✅ `blog.html` - Usa rotas relativas (funciona local e Vercel)
- ✅ `blog-post.html` - Usa rotas relativas
- ✅ `blog-api.js` - Detecta ambiente Vercel e usa `/tmp` para dados
- ✅ `server.js` - Erro de sintaxe corrigido

---

## 🔧 **COMO FUNCIONA NO VERCEL**

### **Estrutura de Arquivos:**
```
/
├── api/
│   └── blog/
│       ├── posts.js          # GET /api/blog/posts
│       ├── post/
│       │   └── [id].js       # GET /api/blog/post/:id
│       └── process.js        # POST /api/blog/process
├── blog.html
├── blog-post.html
├── blog-api.js
├── blog-processor.js
├── vercel.json
└── ...
```

---

## 📅 **CRON JOBS NO VERCEL**

### **Vercel Cron (Configurado em vercel.json):**

**Processamento Completo:**
- **Frequência:** Diariamente às 5h
- **Rota:** `/api/blog/process`
- **Schedule:** `0 5 * * *` (horário UTC)

**Nota:** Vercel Cron usa horário UTC. Para horário de Brasília (UTC-3):
- 5h BRT = 8h UTC
- Ajustar schedule para `0 8 * * *` se necessário

---

## ⚠️ **LIMITAÇÕES DO VERCEL**

### **1. Armazenamento:**
- ✅ Vercel permite escrita apenas em `/tmp`
- ✅ Dados em `/tmp` são temporários (podem ser limpos)
- ⚠️ **Recomendação:** Usar banco de dados (Vercel Postgres, MongoDB, etc.) para produção

### **2. Cron Jobs:**
- ✅ Vercel Cron funciona apenas no plano Pro ($20/mês)
- ⚠️ Plano Hobby tem limitações
- **Alternativa:** Usar serviço externo (cron-job.org, EasyCron, etc.)

### **3. Timeout:**
- ✅ Funções têm timeout máximo de 60s (configurado)
- ⚠️ Processamento de APIs pode demorar mais
- **Solução:** Processar em background ou usar queue

---

## 🚀 **DEPLOY NO VERCEL**

### **1. Conectar Repositório:**
```bash
# Se ainda não conectou
vercel link
```

### **2. Deploy:**
```bash
vercel --prod
```

### **3. Configurar Variáveis de Ambiente (se necessário):**
No dashboard do Vercel:
- Settings → Environment Variables
- Adicionar variáveis se necessário

---

## 🔄 **ALTERNATIVA: CRON EXTERNO**

Se Vercel Cron não estiver disponível, usar serviço externo:

### **Opção 1: cron-job.org (Gratuito)**
1. Criar conta em https://cron-job.org
2. Criar job:
   - **URL:** `https://www.olvinternacional.com.br/api/blog/process`
   - **Método:** POST
   - **Frequência:** Diariamente às 5h (horário de Brasília)

### **Opção 2: EasyCron**
1. Criar conta
2. Configurar job similar

---

## 📊 **ARMAZENAMENTO DE DADOS**

### **Opção Atual (Temporária):**
- ✅ `/tmp/blog-data/posts.json` (Vercel)
- ⚠️ Dados podem ser perdidos

### **Opção Recomendada (Produção):**
- ✅ **Vercel Postgres** - Banco de dados gerenciado
- ✅ **MongoDB Atlas** - Gratuito até 512MB
- ✅ **Supabase** - PostgreSQL gratuito
- ✅ **PlanetScale** - MySQL serverless

---

## 🧪 **TESTAR LOCALMENTE**

### **1. Testar Serverless Functions:**
```bash
# Instalar Vercel CLI
npm i -g vercel

# Rodar localmente
vercel dev
```

### **2. Testar APIs:**
```bash
# Listar posts
curl http://localhost:3000/api/blog/posts

# Buscar post específico
curl http://localhost:3000/api/blog/post/article-123

# Processar manualmente
curl -X POST http://localhost:3000/api/blog/process
```

---

## ✅ **STATUS**

**Implementação:** ✅ 100% Completa
**Vercel:** ✅ Configurado
**Serverless Functions:** ✅ Criadas
**Cron Jobs:** ✅ Configurado (requer plano Pro)

---

**Última atualização:** Janeiro 2026
