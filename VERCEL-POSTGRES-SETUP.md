# 🗄️ CONFIGURAÇÃO VERCEL POSTGRES
## OLV Internacional | Blog com Persistência de Dados

---

## ✅ **IMPLEMENTAÇÃO COMPLETA**

O blog agora está preparado para usar **Vercel Postgres** com fallback automático para arquivo quando o banco não estiver disponível.

---

## 📋 **PASSOS PARA CONFIGURAR**

### **1. Criar Banco de Dados no Vercel**

1. Acesse: https://vercel.com/dashboard
2. Vá em: **Storage** → **Create Database**
3. Selecione: **Postgres**
4. Escolha um nome: `olv-blog-db` (ou o que preferir)
5. Selecione a região: **São Paulo** (ou mais próxima)
6. Clique em **Create**

### **2. Conectar ao Projeto**

1. No dashboard do Vercel, vá em: **Settings** → **Environment Variables**
2. O Vercel já criou automaticamente:
   - `POSTGRES_URL`
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NON_POOLING`
3. Verifique se estão configuradas para **Production**, **Preview** e **Development**

### **3. Inicializar Banco de Dados**

Após criar o banco, inicialize a tabela:

**Opção 1: Via API (Recomendado)**
```
GET https://www.olvinternacional.com.br/api/blog/init-db
```

**Opção 2: Via Terminal**
```bash
curl https://www.olvinternacional.com.br/api/blog/init-db
```

**Opção 3: Automático**
A primeira vez que processar artigos, o banco será inicializado automaticamente.

---

## 🔧 **ESTRUTURA DO BANCO**

### **Tabela: `blog_posts`**

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | VARCHAR(255) | ID único do artigo (PK) |
| `title` | TEXT | Título do artigo |
| `excerpt` | TEXT | Resumo do artigo |
| `content` | TEXT | Conteúdo HTML completo |
| `category` | VARCHAR(50) | Categoria (analises, guias, noticias, insights) |
| `date_published` | TIMESTAMP | Data de publicação |
| `date_modified` | TIMESTAMP | Data de última modificação |
| `icon` | VARCHAR(100) | Ícone Font Awesome |
| `read_time` | INTEGER | Tempo de leitura em minutos |
| `source` | VARCHAR(50) | Fonte (comexstat, unComtrade, worldBank, rss) |
| `data_source` | JSONB | Dados originais da fonte |
| `created_at` | TIMESTAMP | Data de criação no banco |
| `updated_at` | TIMESTAMP | Data de última atualização |

### **Índices Criados:**
- `idx_blog_posts_category` - Para filtros por categoria
- `idx_blog_posts_date_published` - Para ordenação por data
- `idx_blog_posts_source` - Para filtros por fonte

---

## 🚀 **COMO FUNCIONA**

### **Sistema Híbrido (Banco + Fallback):**

1. **Se Vercel Postgres estiver configurado:**
   - ✅ Dados salvos no banco
   - ✅ Persistência garantida
   - ✅ Performance otimizada

2. **Se Vercel Postgres NÃO estiver configurado:**
   - ✅ Fallback automático para arquivo
   - ✅ Funciona localmente
   - ⚠️ Dados podem ser perdidos no Vercel (limitação do `/tmp`)

---

## 📊 **VERIFICAR SE ESTÁ FUNCIONANDO**

### **1. Verificar Configuração:**
```bash
# No Vercel Dashboard → Settings → Environment Variables
# Verificar se POSTGRES_URL existe
```

### **2. Inicializar Banco:**
```bash
curl https://www.olvinternacional.com.br/api/blog/init-db
```

### **3. Processar Artigos:**
```bash
curl -X POST https://www.olvinternacional.com.br/api/blog/process
```

### **4. Verificar Posts:**
```bash
curl https://www.olvinternacional.com.br/api/blog/posts
```

---

## ⚠️ **IMPORTANTE**

### **1. Variáveis de Ambiente:**
- O Vercel cria automaticamente as variáveis ao criar o banco
- Não é necessário configurar manualmente
- Verifique se estão ativas em **Production**

### **2. Limites do Plano Gratuito:**
- **256 MB** de armazenamento
- **60 horas** de compute time/mês
- Suficiente para blog com até ~10.000 artigos

### **3. Backup:**
- Vercel Postgres tem backup automático
- Para backup manual, use: `pg_dump` ou export via dashboard

---

## 🔄 **MIGRAÇÃO DE DADOS EXISTENTES**

Se você já tem artigos em arquivo e quer migrar para o banco:

1. Processar artigos novamente (eles serão salvos no banco)
2. Ou criar script de migração (opcional)

---

## ✅ **STATUS**

- ✅ Código implementado com fallback automático
- ✅ Tabela criada automaticamente na primeira execução
- ✅ Compatível com ambiente local e Vercel
- ⏭️ **Próximo passo:** Criar banco no Vercel Dashboard

---

## 📝 **COMANDOS ÚTEIS**

### **Inicializar Banco:**
```bash
curl https://www.olvinternacional.com.br/api/blog/init-db
```

### **Processar Artigos:**
```bash
curl -X POST https://www.olvinternacional.com.br/api/blog/process
```

### **Listar Posts:**
```bash
curl https://www.olvinternacional.com.br/api/blog/posts
```

---

**Última atualização:** Janeiro 2026
