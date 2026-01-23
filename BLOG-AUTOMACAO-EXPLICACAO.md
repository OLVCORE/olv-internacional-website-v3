# 🤖 AUTOMAÇÃO DO BLOG - COMO FUNCIONA
## OLV Internacional | Sistema de Atualização Automática

---

## 📋 **COMO FUNCIONA A AUTOMAÇÃO**

### **1. Fontes de Dados**

O blog busca conteúdo automaticamente de **4 fontes principais**:

#### **A. APIs de Dados (Análises)**
- **ComexStat (MDIC)** - Dados diários de comércio exterior do Brasil
- **UN Comtrade** - Dados internacionais semanais
- **World Bank** - Indicadores econômicos semanais

**Categoria:** `analises` (Análises de Mercado)

#### **B. RSS Feeds (Notícias)**
- **Valor Econômico** - https://www.valor.com.br/rss
- **Exame** - https://exame.com/feed/
- **Agência Brasil** - https://agenciabrasil.ebc.com.br/rss
- **Reuters** - https://www.reuters.com/rssFeed/worldNews

**Categoria:** `noticias` (Notícias)

**Filtro Inteligente:** Apenas notícias relevantes são processadas (contêm palavras-chave como: comércio, exportação, importação, trade, economia, brasil, internacional)

---

## ⏰ **FREQUÊNCIA DE ATUALIZAÇÃO**

### **Configurado em `blog-cron.js` e `vercel.json`:**

| Fonte | Frequência | Horário (BRT) | Motivo |
|--------|----------|---------------|--------|
| **ComexStat** | Diária | 2h da manhã | Dados atualizados diariamente |
| **UN Comtrade** | Semanal | Domingo 3h | Dados semanais |
| **World Bank** | Semanal | Domingo 4h | Indicadores semanais |
| **RSS Feeds** | A cada 4h | 00:00, 04:00, 08:00, 12:00, 16:00, 20:00 | Notícias frequentes |
| **Limpeza** | Diária | 5h da manhã | Remove posts antigos |

---

## 🔄 **CICLO DE VIDA DOS ARTIGOS**

### **1. Criação**
- Artigo é gerado automaticamente quando:
  - Novos dados são publicados nas APIs
  - Novas notícias aparecem nos RSS feeds
  - Processamento manual é executado

### **2. Armazenamento**
- Salvo no **Neon Database** (Postgres)
- Persistência garantida
- Limite: 100 artigos mais recentes

### **3. Limpeza Automática**
- **Posts antigos são removidos automaticamente:**
  - Mantém apenas os **100 mais recentes**
  - Remove posts com **mais de 90 dias** (exceto importantes)
  - Executado diariamente às 5h

### **4. Atualização**
- Artigos podem ser **atualizados** se:
  - Mesmo título/ID é processado novamente
  - Dados da fonte mudam
  - Sistema detecta duplicata

---

## 📊 **CATEGORIAS E CONTEÚDO**

### **1. Análises de Mercado (`analises`)**
- **Fonte:** ComexStat, UN Comtrade, World Bank
- **Conteúdo:** Dados, gráficos, análises estatísticas
- **Frequência:** Diária/Semanal

### **2. Notícias (`noticias`)**
- **Fonte:** RSS Feeds (Valor, Exame, Agência Brasil, Reuters)
- **Conteúdo:** Notícias relevantes sobre comércio exterior
- **Filtro:** Apenas notícias com palavras-chave relevantes
- **Frequência:** A cada 4 horas

### **3. Guias Práticos (`guias`)**
- **Fonte:** Artigos manuais ou gerados automaticamente
- **Conteúdo:** Passo a passo, tutoriais, guias
- **Frequência:** Conforme necessário

### **4. Insights (`insights`)**
- **Fonte:** Análises estratégicas, tendências
- **Conteúdo:** Insights, recomendações, estratégias
- **Frequência:** Conforme necessário

---

## 🎯 **FILTRO INTELIGENTE DE NOTÍCIAS**

O sistema **filtra automaticamente** as notícias RSS para incluir apenas conteúdo relevante:

**Palavras-chave filtradas:**
- comércio
- exportação
- importação
- trade
- economia
- brasil
- internacional

**Processamento:**
- Cada feed RSS é verificado
- Apenas os **2 itens mais recentes** de cada feed são processados
- Notícias são filtradas por relevância
- Apenas notícias relevantes são salvas

---

## 🔧 **PROCESSAMENTO MANUAL**

### **Via API:**
```bash
POST https://www.olvinternacional.com.br/api/blog/process
```

### **Via PowerShell:**
```powershell
Invoke-WebRequest -Uri "https://www.olvinternacional.com.br/api/blog/process" -Method POST
```

**O que acontece:**
1. Busca dados de todas as APIs
2. Processa RSS feeds
3. Gera artigos automaticamente
4. Salva no banco de dados
5. Limpa posts antigos

---

## 📅 **CRON JOBS NO VERCEL**

### **Configurado em `vercel.json`:**
```json
{
  "crons": [
    {
      "path": "/api/blog/process",
      "schedule": "0 8 * * *"
    }
  ]
}
```

**Nota:** Vercel Cron requer **plano Pro** ($20/mês). 

**Alternativa gratuita:**
- Usar serviço externo: **cron-job.org** (gratuito)
- Configurar para chamar `/api/blog/process` diariamente

---

## 🗑️ **LIMPEZA AUTOMÁTICA**

### **Como Funciona:**

1. **Limite de Quantidade:**
   - Mantém apenas os **100 artigos mais recentes**
   - Remove automaticamente os mais antigos

2. **Limite de Tempo:**
   - Remove posts com **mais de 90 dias**
   - Exceto artigos marcados como importantes

3. **Execução:**
   - Automática durante processamento
   - Diariamente às 5h da manhã

---

## ✅ **STATUS ATUAL**

- ✅ **Análises:** Funcionando (ComexStat, UN Comtrade, World Bank)
- ✅ **Notícias:** Implementado (RSS Feeds com filtro)
- ⏭️ **Guias:** Artigos de exemplo criados automaticamente
- ⏭️ **Insights:** Artigos de exemplo criados automaticamente
- ✅ **Limpeza:** Automática (100 posts, 90 dias)

---

## 🚀 **PRÓXIMOS PASSOS**

1. **Configurar Cron Job:**
   - Vercel Pro (recomendado)
   - Ou cron-job.org (gratuito)

2. **Monitorar:**
   - Verificar logs no Vercel Dashboard
   - Acompanhar quantidade de artigos por categoria

3. **Ajustar Filtros:**
   - Adicionar/remover palavras-chave do filtro RSS
   - Ajustar frequência conforme necessário

---

**Última atualização:** Janeiro 2026
