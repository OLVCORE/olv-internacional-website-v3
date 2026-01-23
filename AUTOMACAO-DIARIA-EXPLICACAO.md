# 🤖 AUTOMAÇÃO DIÁRIA DO BLOG - EXPLICAÇÃO COMPLETA
## OLV Internacional | Sistema 100% Automático

---

## ✅ **SIM, É TOTALMENTE AUTOMÁTICO!**

**Você NÃO precisa fazer nada manualmente.** O sistema está configurado para:

### **1. Processamento Automático Diário** ⏰
- **Horário:** Todos os dias às **5h da manhã (BRT)** / 8h UTC
- **O que acontece:**
  - Busca dados de todas as APIs (ComexStat, UN Comtrade, World Bank)
  - Processa RSS feeds (Valor, Exame, Agência Brasil, Reuters)
  - Gera artigos automaticamente
  - Salva no banco de dados
  - Remove posts antigos (mais de 90 dias)

### **2. Configuração no Vercel** 📅
```json
{
  "crons": [
    {
      "path": "/api/blog/process",
      "schedule": "0 8 * * *"  // 8h UTC = 5h BRT
    }
  ]
}
```

**Nota:** Vercel Cron requer **plano Pro** ($20/mês). Se não tiver:
- Use **cron-job.org** (gratuito)
- Configure para chamar `/api/blog/process` diariamente às 5h BRT

---

## 📰 **NEWS TICKER - TODAS AS CATEGORIAS**

O ticker mostra **TODAS as notícias das últimas 24 horas**, de **TODAS as categorias**:
- ✅ Análises (ComexStat, UN Comtrade, World Bank)
- ✅ Notícias (RSS Feeds)
- ✅ Guias Práticos
- ✅ Insights

**Se você está vendo apenas 2 notícias:**
- Significa que só existem 2 posts das últimas 24h no banco
- Após o processamento automático diário, mais notícias aparecerão

---

## 🖼️ **IMAGENS DOS ARTIGOS**

### **Como Funciona:**
1. **RSS Feeds:** Extrai imagem automaticamente de:
   - `<enclosure>` (se for imagem)
   - `<media:content>`
   - Primeira `<img>` no conteúdo HTML

2. **Se houver imagem:**
   - Mostra imagem real (400px altura)
   - Substitui o card azul grande

3. **Se NÃO houver imagem:**
   - Mostra ícone pequeno (120px altura)
   - Card reduzido, não ocupa tanto espaço

---

## 🔄 **CICLO AUTOMÁTICO**

```
5h BRT (Diariamente)
    ↓
Processa APIs e RSS
    ↓
Gera Artigos
    ↓
Salva no Banco
    ↓
Remove Posts Antigos
    ↓
News Ticker Atualiza (mostra últimas 24h)
```

---

## ❓ **PERGUNTAS FREQUENTES**

### **"Preciso processar manualmente?"**
**NÃO!** O sistema é 100% automático. Apenas na primeira vez (após deploy) você pode processar manualmente para popular o blog inicialmente.

### **"Por que só aparecem 2 notícias no ticker?"**
Porque só existem 2 posts das últimas 24 horas no banco. Após o processamento automático diário, mais notícias aparecerão.

### **"Quando as outras categorias serão alimentadas?"**
- **Notícias:** Automaticamente quando RSS feeds tiverem conteúdo relevante
- **Guias/Insights:** Artigos de exemplo são criados automaticamente se a categoria estiver vazia

### **"O card enorme vai continuar?"**
**NÃO!** Agora:
- Se houver imagem → mostra imagem real
- Se não houver → mostra ícone pequeno (120px)

---

## 🚀 **PRÓXIMOS PASSOS**

1. **Fazer Deploy:**
   ```bash
   vercel --prod
   ```

2. **Processar Primeira Vez (Opcional):**
   ```powershell
   Invoke-WebRequest -Uri "https://www.olvinternacional.com.br/api/blog/process" -Method POST
   ```

3. **Aguardar Automação:**
   - Próximo processamento: 5h BRT de amanhã
   - Depois disso, será totalmente automático

---

**Última atualização:** Janeiro 2026
