# 🚀 INSTRUÇÕES: PROCESSAR BLOG MANUALMENTE
## OLV Internacional | PowerShell

---

## ✅ **PASSO A PASSO - EXECUTAR NO POWERSHELL**

### **Opção 1: Usar o Script PowerShell (MAIS FÁCIL)** ⭐

1. **Abra o PowerShell:**
   - Pressione `Windows + X`
   - Clique em "Windows PowerShell" ou "Terminal"

2. **Navegue até a pasta do projeto:**
   ```powershell
   cd C:\Projects\olv-internacional-website-v3
   ```

3. **Execute o script:**
   ```powershell
   .\PROCESSAR-BLOG-MANUAL.ps1
   ```

4. **Aguarde o resultado!**
   - O script vai mostrar quantos artigos foram processados
   - Vai mostrar o total de posts no banco
   - Vai mostrar distribuição por categoria

---

### **Opção 2: Comando Direto no PowerShell** 🔧

1. **Abra o PowerShell**

2. **Execute este comando:**
   ```powershell
   Invoke-WebRequest -Uri "https://www.olvinternacional.com.br/api/blog/process" -Method POST
   ```

3. **Para ver o resultado formatado:**
   ```powershell
   $response = Invoke-WebRequest -Uri "https://www.olvinternacional.com.br/api/blog/process" -Method POST
   $result = $response.Content | ConvertFrom-Json
   Write-Host "Artigos processados: $($result.articles)"
   Write-Host "Total no banco: $($result.totalPostsInDB)"
   ```

---

## 📊 **O QUE ESPERAR**

### **Resposta de Sucesso:**
```json
{
  "success": true,
  "articles": 5,  // Artigos processados AGORA
  "totalPostsInDB": 21,  // Total no banco
  "postsByCategory": {
    "all": 21,
    "analises": 2,
    "noticias": 3,
    "guias": 6,
    "insights": 10
  }
}
```

### **Se der erro:**
- Verifique sua conexão com internet
- Verifique se o site está online
- Tente novamente em alguns segundos

---

## 🔍 **VERIFICAR RESULTADO**

Depois de executar, acesse:
```
https://www.olvinternacional.com.br/blog.html
```

Você deve ver:
- ✅ Mais artigos do que antes
- ✅ Novas notícias aparecendo
- ✅ Total de posts aumentado

---

## ⚠️ **IMPORTANTE**

- ✅ **Limpeza de posts DESABILITADA** - Nada será deletado
- ✅ O blog é novo, não faz sentido limpar posts
- ✅ Todos os posts serão mantidos

---

**Última atualização:** Janeiro 2026
