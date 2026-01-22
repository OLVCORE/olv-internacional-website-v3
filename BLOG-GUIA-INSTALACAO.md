# 🚀 GUIA DE INSTALAÇÃO E USO DO BLOG
## OLV Internacional | Sistema de Blog com Ingestão Automática

---

## 📦 **INSTALAÇÃO**

### **1. Instalar Dependências**
```bash
npm install
```

Isso instalará automaticamente:
- ✅ `axios` - Para chamadas HTTP às APIs públicas
- ✅ `node-cron` - Para agendamento automático de tarefas
- ✅ `rss-parser` - Para processar feeds RSS de notícias

---

## 🚀 **INICIAR O SISTEMA**

### **1. Iniciar o Servidor**
```bash
npm start
```

O servidor irá:
- ✅ Iniciar na porta 3000
- ✅ Ativar cron jobs automaticamente
- ✅ Executar processamento inicial após 5 segundos
- ✅ Criar diretório `blog-data/` automaticamente

### **2. Acessar o Blog**
- **Blog principal:** http://localhost:3000/blog.html
- **Artigo específico:** http://localhost:3000/blog-post.html?id=article-123

---

## 📅 **FREQUÊNCIA DE ATUALIZAÇÃO AUTOMÁTICA**

### **Agendamento Configurado:**

| Fonte | Frequência | Horário | Motivo |
|-------|-----------|---------|--------|
| **ComexStat (MDIC)** | Diariamente | 2h da manhã | Dados diários de comércio exterior |
| **UN Comtrade** | Semanalmente | Domingo às 3h | Dados internacionais semanais |
| **World Bank** | Semanalmente | Domingo às 4h | Indicadores econômicos semanais |
| **RSS Feeds** | A cada 4 horas | 00:00, 04:00, 08:00, 12:00, 16:00, 20:00 | Notícias atualizadas frequentemente |
| **Processamento Completo** | Diariamente | 5h da manhã | Revisão e enriquecimento de todos os artigos |

**Timezone:** America/Sao_Paulo (horário de Brasília)

---

## 🔧 **PROCESSAMENTO MANUAL**

### **Processar Fontes Manualmente:**

**Via API:**
```bash
curl -X POST http://localhost:3000/api/blog/process
```

**Via Node.js:**
```bash
node -e "require('./blog-processor').processAndPublish().then(() => console.log('✅ Concluído!'))"
```

---

## 📊 **ESTRUTURA DE DADOS**

### **Localização dos Posts:**
- **Diretório:** `blog-data/`
- **Arquivo:** `blog-data/posts.json`
- **Formato:** JSON array
- **Limite:** 100 artigos mais recentes (automático)

### **Estrutura de um Artigo:**
```json
{
  "id": "article-1234567890-abc123",
  "title": "Título do Artigo",
  "excerpt": "Resumo do artigo...",
  "content": "<h2>Conteúdo HTML</h2><p>...</p>",
  "category": "analises",
  "datePublished": "2026-01-22T10:00:00.000Z",
  "dateModified": "2026-01-22T10:00:00.000Z",
  "icon": "fas fa-chart-line",
  "readTime": 5,
  "source": "comexstat",
  "dataSource": {...}
}
```

---

## 🎯 **CATEGORIAS**

1. **analises** - Análises de Mercado
2. **guias** - Guias Práticos
3. **noticias** - Notícias
4. **insights** - Insights

---

## 🔌 **APIS CONFIGURADAS**

### **1. ComexStat (MDIC)**
- **URL:** http://comexstat.mdic.gov.br/api
- **Dados:** Estatísticas oficiais de comércio exterior do Brasil
- **Frequência:** Diária

### **2. UN Comtrade**
- **URL:** https://comtradeplus.un.org/api
- **Dados:** Dados internacionais de comércio (200+ países)
- **Frequência:** Semanal

### **3. World Bank Open Data**
- **URL:** https://api.worldbank.org/v2
- **Dados:** Indicadores econômicos globais
- **Frequência:** Semanal

### **4. RSS Feeds**
- **Valor Econômico:** https://www.valor.com.br/rss
- **Exame:** https://exame.com/feed/
- **Agência Brasil:** https://agenciabrasil.ebc.com.br/rss
- **Reuters:** https://www.reuters.com/rssFeed/worldNews
- **Frequência:** A cada 4 horas

---

## ⚠️ **IMPORTANTE**

### **1. Ajustes Necessários:**
- Algumas APIs podem ter endpoints diferentes
- Verificar documentação oficial de cada API
- Ajustar parâmetros conforme necessário

### **2. Produção:**
- Servidor precisa rodar 24/7 para cron jobs funcionarem
- Usar PM2 ou similar em produção:
  ```bash
  npm install -g pm2
  pm2 start server.js --name olv-website
  pm2 save
  pm2 startup
  ```

### **3. Backup:**
- Fazer backup regular de `blog-data/posts.json`
- Considerar banco de dados para produção

---

## 🧪 **TESTAR**

### **1. Testar API de Posts:**
```bash
curl http://localhost:3000/api/blog/posts
```

### **2. Testar Post Específico:**
```bash
curl http://localhost:3000/api/blog/post/article-123
```

### **3. Processar Manualmente:**
```bash
curl -X POST http://localhost:3000/api/blog/process
```

---

## ✅ **STATUS**

**Implementação:** ✅ 100% Completa
**Cron Jobs:** ✅ Configurados e ativos
**APIs:** ✅ Integradas
**Frequência:** ✅ Automática conforme agendamento

---

**Última atualização:** Janeiro 2026
