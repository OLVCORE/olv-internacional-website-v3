# 🔍 COMO ENCONTRAR A DATABASE_URL NO NEON (ATUALIZADO)

## 📍 **ONDE ENCONTRAR A CONNECTION STRING**

No console do Neon, a connection string pode estar em diferentes lugares dependendo da versão da interface.

---

## ✅ **OPÇÕES PARA ENCONTRAR**

### **Opção 1: Na Página do Branch (Mais Comum)**

1. Acesse: `https://console.neon.tech/app/projects/red-boat-86266542?branchId=br-delicate-frog-ah7uphtw`
2. Na página do branch, procure por:
   - **"Connection string"** ou **"Connection URL"**
   - **"Connect"** ou **"Conectar"**
   - Um botão ou seção que mostra a string de conexão

### **Opção 2: Na Página do Projeto**

1. Acesse: `https://console.neon.tech/app/projects/red-boat-86266542`
2. Clique no branch: `br-delicate-frog-ah7uphtw`
3. Procure por **"Connection Details"** ou **"Connection string"**

### **Opção 3: No SQL Editor**

1. Acesse: `https://console.neon.tech/app/projects/red-boat-86266542?branchId=br-delicate-frog-ah7uphtw`
2. Clique em **"SQL Editor"** no menu lateral
3. Às vezes a connection string aparece no topo ou em um botão "Connect"

### **Opção 4: Na Página de Settings**

1. Acesse: `https://console.neon.tech/app/projects/red-boat-86266542?branchId=br-delicate-frog-ah7uphtw`
2. Clique em **"Settings"** no menu lateral
3. Procure por **"Connection Details"** ou **"Database Connection"**

---

## 🔍 **FORMATO DA CONNECTION STRING**

A connection string do Neon geralmente tem este formato:

```
postgresql://[user]:[password]@[host]/[database]?sslmode=require
```

Exemplo:
```
postgresql://neondb_owner:abc123xyz@ep-cool-darkness-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

---

## 📸 **O QUE PROCURAR**

Procure por:
- Um campo de texto com a connection string
- Um botão "Copy" ou "Copiar" ao lado
- Um ícone de cadeado ou conexão
- Texto que diz "Connection string", "Connection URL", "PostgreSQL connection string"

---

## 🔧 **ALTERNATIVA: CRIAR NOVA CONNECTION STRING**

Se não encontrar, você pode:

1. **Criar um novo usuário:**
   - Settings → Users
   - Criar novo usuário
   - Copiar a connection string gerada

2. **Usar a connection string do branch:**
   - Cada branch tem sua própria connection string
   - Geralmente aparece na página principal do branch

---

## ✅ **CONFIGURAR NO VERCEL**

Depois de encontrar a connection string:

1. Acesse Vercel Dashboard
2. Settings → Environment Variables
3. Adicione:
   - **Key:** `DATABASE_URL`
   - **Value:** Cole a connection string completa
   - **Environment:** Production, Preview, Development (marque todos)
4. Salve e faça redeploy

---

## 🎯 **VERIFICAR SE FUNCIONOU**

Após configurar, execute:
```powershell
Invoke-WebRequest -Uri "https://www.olvinternacional.com.br/api/blog/count-posts" -Method GET
```

Se `dbStatus.hasPostgres: true`, está configurado corretamente!

---

**Última atualização:** Janeiro 2026
