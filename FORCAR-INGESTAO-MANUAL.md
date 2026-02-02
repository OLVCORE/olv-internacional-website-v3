# 🚀 FORÇAR INGESTÃO MANUAL DO BLOG
## OLV Internacional | Teste do Sistema de Ingestão

---

## ⚡ **OPÇÕES PARA EXECUTAR INGESTÃO MANUAL**

### **Opção 1: Via Navegador (MAIS FÁCIL)** ⭐

1. **Abra seu navegador**
2. **Acesse esta URL:**
   ```
   https://www.olvinternacional.com.br/api/blog/process
   ```
3. **Aguarde o processamento** (pode levar 1-3 minutos)
4. **Veja o resultado** em formato JSON

**Vantagem:** Não precisa de terminal ou comandos!

---

### **Opção 2: Via PowerShell (Windows)** 💻

**Abra o PowerShell e execute:**

```powershell
$response = Invoke-WebRequest -Uri "https://www.olvinternacional.com.br/api/blog/process" -Method POST -UseBasicParsing
$result = $response.Content | ConvertFrom-Json

Write-Host "✅ Sucesso: $($result.success)" -ForegroundColor Green
Write-Host "📝 Artigos processados: $($result.articles)" -ForegroundColor Cyan
Write-Host "📚 Total no banco: $($result.totalPostsInDB)" -ForegroundColor Cyan

if ($result.postsByCategory) {
    Write-Host "`n📊 Distribuição por categoria:" -ForegroundColor Yellow
    Write-Host "   - Todos: $($result.postsByCategory.all)"
    Write-Host "   - Análises: $($result.postsByCategory.analises)"
    Write-Host "   - Notícias: $($result.postsByCategory.noticias)"
    Write-Host "   - Guias: $($result.postsByCategory.guias)"
    Write-Host "   - Insights: $($result.postsByCategory.insights)"
}
```

---

### **Opção 3: Via cURL (Terminal/Linux/Mac)** 🐧

```bash
curl -X POST https://www.olvinternacional.com.br/api/blog/process
```

**Para ver resultado formatado:**
```bash
curl -X POST https://www.olvinternacional.com.br/api/blog/process | jq .
```

---

### **Opção 4: Via Postman ou Insomnia** 🔧

1. **Crie uma nova requisição POST**
2. **URL:** `https://www.olvinternacional.com.br/api/blog/process`
3. **Método:** POST
4. **Envie a requisição**
5. **Veja a resposta JSON**

---

## 📊 **RESULTADO ESPERADO**

### **Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "X artigos processados",
  "articles": 5,              // Artigos processados NESTA execução
  "totalPostsInDB": 25,       // Total de posts no banco AGORA
  "postsByCategory": {
    "all": 25,
    "analises": 3,
    "noticias": 15,
    "guias": 4,
    "insights": 3
  }
}
```

### **O que acontece durante o processamento:**
1. ✅ Busca dados do **ComexStat** (MDIC)
2. ✅ Busca dados do **UN Comtrade**
3. ✅ Busca dados do **World Bank**
4. ✅ Processa **4 feeds RSS**:
   - Valor Econômico
   - Exame
   - Agência Brasil
   - Reuters
5. ✅ Filtra artigos relevantes
6. ✅ Salva no banco de dados
7. ✅ Retorna estatísticas

---

## ⏱️ **TEMPO DE PROCESSAMENTO**

- **Primeira vez:** 2-5 minutos (busca dados de todas as APIs)
- **Próximas vezes:** 30-90 segundos (atualizações incrementais)
- **Timeout:** 60 segundos (configurado no Vercel)

**⚠️ Se demorar muito, pode ser:**
- APIs externas lentas
- Muitos feeds RSS para processar
- Problema de conexão

---

## 🔍 **VERIFICAR SE FUNCIONOU**

### **1. Verificar Total de Posts:**
```
GET https://www.olvinternacional.com.br/api/blog/posts
```

### **2. Verificar Posts por Categoria:**
```
GET https://www.olvinternacional.com.br/api/blog/posts?category=noticias
```

### **3. Ver Blog no Site:**
```
https://www.olvinternacional.com.br/blog.html
```

### **4. Ver Logs no Vercel:**
1. Acesse **Vercel Dashboard**
2. Vá em **Deployments** → Último deployment
3. Clique em **Functions** → `/api/blog/process`
4. Veja os logs da execução

---

## 🚨 **SE DER ERRO**

### **Erro de Conexão:**
- Verifique sua internet
- Tente novamente em alguns segundos
- Verifique se o site está online

### **Erro 500 (Internal Server Error):**
- Verifique logs no Vercel Dashboard
- Pode ser problema com banco de dados
- Verifique se `DATABASE_URL` está configurada

### **Erro 405 (Method Not Allowed):**
- Certifique-se de usar **POST** (não GET)
- Alguns navegadores fazem GET por padrão

### **Timeout (60 segundos):**
- Processamento pode estar demorando muito
- Tente novamente (pode ser carga temporária)
- Verifique se APIs externas estão respondendo

---

## 📝 **LOGS ESPERADOS**

Procure por estas mensagens nos logs do Vercel:

```
🔧 Processamento iniciado manualmente
🔄 Inicializando banco de dados...
✅ Banco de dados inicializado
🔄 Iniciando processamento de artigos...
📡 ============================================================
📡 INICIANDO PROCESSAMENTO DE RSS FEEDS
📡 ============================================================
📡 Total de feeds RSS configurados: 4
✅ [1] Artigo aceito: "..."
✅ ✅ ✅ [1] Artigo RSS SALVO COM SUCESSO
💾 💾 💾 ARTIGOS SALVOS NESTA EXECUÇÃO: X
✅ Processamento concluído: X artigos processados
📊 Total de posts no banco APÓS processamento: X
```

---

## ✅ **CHECKLIST DE TESTE**

Após executar a ingestão manual:

- [ ] Resposta JSON mostra `"success": true`
- [ ] `articles` > 0 (artigos processados)
- [ ] `totalPostsInDB` aumentou
- [ ] Posts aparecem em `/api/blog/posts`
- [ ] Blog mostra novos artigos em `blog.html`
- [ ] Logs no Vercel mostram processamento completo

---

## 🔄 **EXECUTAR MÚLTIPLAS VEZES**

Você pode executar a ingestão manual **quantas vezes quiser**:

- ✅ Não vai duplicar artigos (verificação de duplicatas)
- ✅ Vai processar apenas novos artigos dos feeds
- ✅ Vai atualizar dados das APIs se houver mudanças
- ✅ Útil para testar o sistema

---

## 📞 **PRÓXIMOS PASSOS**

1. **Execute a ingestão manual** usando uma das opções acima
2. **Aguarde o processamento** (1-3 minutos)
3. **Verifique o resultado** no blog
4. **Monitore os logs** se houver problemas
5. **Aguarde os cron jobs automáticos** (8h e 20h UTC)

---

**Data:** 25 de Janeiro de 2026
**Status:** ✅ Pronto para teste manual
