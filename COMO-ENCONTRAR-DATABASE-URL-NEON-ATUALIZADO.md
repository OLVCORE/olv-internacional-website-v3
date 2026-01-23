# 🔍 COMO ENCONTRAR A DATABASE_URL NO NEON (ATUALIZADO)

## 📍 **ONDE ENCONTRAR A CONNECTION STRING**

No console do Neon, a connection string está disponível através do botão **"Connect"** no Project Dashboard.

---

## ✅ **PASSO A PASSO CORRETO**

### **Método 1: Botão "Connect" no Dashboard (Recomendado)**

1. Acesse: `https://console.neon.tech/app/projects/red-boat-86266542`
2. Na página do projeto (Dashboard), procure por um botão **"Connect"** ou **"Conectar"**
3. Clique no botão **"Connect"**
4. Isso abre um modal **"Connect to your database"**
5. No modal, você verá:
   - **Connection string** completa
   - Opções para selecionar branch, role e database
   - Botão **"Copy"** para copiar a connection string

### **Método 2: Na Página do Branch**

1. Acesse: `https://console.neon.tech/app/projects/red-boat-86266542?branchId=br-delicate-frog-ah7uphtw`
2. Na página do branch, procure por:
   - Um botão **"Connect"** no topo
   - Uma seção com **"Connection string"**
   - Um card ou painel com informações de conexão

### **Método 3: Via CLI (Alternativa)**

Se preferir usar linha de comando:
```bash
# Instalar Neon CLI
npm install -g neonctl

# Fazer login
neonctl auth

# Obter connection string
neonctl connection-string --project-id red-boat-86266542 --branch br-delicate-frog-ah7uphtw
```

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
