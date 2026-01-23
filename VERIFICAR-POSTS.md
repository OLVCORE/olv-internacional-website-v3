# 🔍 VERIFICAR: Quantos Posts Existem Realmente?

## 📊 **SITUAÇÃO ATUAL**

- ✅ **44 artigos foram processados** (resposta da API)
- ❌ **Apenas 4 aparecem no blog**

Isso indica que os artigos estão sendo processados, mas podem não estar sendo salvos ou carregados corretamente.

---

## 🔍 **DIAGNÓSTICO**

### **1. Verificar Quantos Posts Existem no Banco/Arquivo**

Execute este comando para ver quantos posts realmente existem:

```powershell
Invoke-WebRequest -Uri "https://www.olvinternacional.com.br/api/blog/count-posts" -Method GET
```

Isso vai mostrar:
- Total de posts no banco/arquivo
- Posts por categoria
- Status do banco de dados
- Lista de todos os posts

### **2. Possíveis Causas**

#### **A. Banco Não Configurado**
- Se `dbStatus.hasPostgres: false`, o banco não está configurado
- Os posts estão sendo salvos apenas em arquivo (`/tmp/blog-data/posts.json`)
- **Problema:** No Vercel, `/tmp` é temporário e pode ser limpo entre deploys

#### **B. Arquivo Temporário Perdido**
- No Vercel, arquivos em `/tmp` são temporários
- Podem ser perdidos quando:
  - O servidor reinicia
  - Há um novo deploy
  - O container é recriado

#### **C. Deduplicação Muito Agressiva**
- A deduplicação pode estar removendo muitos artigos
- Verificar logs para ver quantos foram ignorados como duplicatas

---

## ✅ **SOLUÇÃO**

### **Opção 1: Configurar Banco de Dados (Recomendado)**

1. Acesse Vercel Dashboard
2. Settings → Environment Variables
3. Adicione `DATABASE_URL` com a URL do seu banco Neon/Vercel Postgres

Isso garante que os posts sejam salvos permanentemente.

### **Opção 2: Verificar Logs do Processamento**

Verifique os logs no Vercel Dashboard:
- Vá em **Deployments** → **Functions** → `/api/blog/process`
- Procure por:
  - `✅ Artigo salvo no banco` → Salvando no banco
  - `✅ Artigo salvo no arquivo` → Salvando em arquivo
  - `📊 Total de posts no banco/arquivo após processamento` → Quantos foram salvos

### **Opção 3: Processar Novamente e Verificar**

1. Processar:
   ```powershell
   Invoke-WebRequest -Uri "https://www.olvinternacional.com.br/api/blog/process" -Method POST
   ```

2. Verificar imediatamente:
   ```powershell
   Invoke-WebRequest -Uri "https://www.olvinternacional.com.br/api/blog/count-posts" -Method GET
   ```

3. Se mostrar 44 posts, o problema é no carregamento
4. Se mostrar apenas 4, o problema é no salvamento

---

## 🎯 **RESULTADO ESPERADO**

Após configurar o banco e processar:
- ✅ **44+ posts** no banco
- ✅ **Todos aparecem** no blog
- ✅ **Persistência garantida** (não são perdidos entre deploys)

---

**Última atualização:** Janeiro 2026
