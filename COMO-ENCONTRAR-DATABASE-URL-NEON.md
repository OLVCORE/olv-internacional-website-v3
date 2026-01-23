# 🔍 COMO ENCONTRAR A DATABASE_URL NO NEON

## 📍 **ONDE ENCONTRAR**

A URL que você mostrou (`https://console.neon.tech/app/projects/red-boat-86266542?branchId=br-delicate-frog-ah7uphtw`) é o **console do Neon**, não a connection string.

---

## ✅ **PASSO A PASSO**

### **1. Acesse o Console do Neon**
- URL: `https://console.neon.tech/app/projects/red-boat-86266542?branchId=br-delicate-frog-ah7uphtw`
- Ou acesse: https://console.neon.tech

### **2. Vá para "Connection Details"**
1. No menu lateral, clique em **"Connection Details"** ou **"Detalhes de Conexão"**
2. Ou procure por **"Connection String"** ou **"Connection URL"**

### **3. Copie a Connection String**
Você verá algo como:
```
postgresql://user:password@ep-xxx-xxx.region.neon.tech/neondb?sslmode=require
```

**IMPORTANTE:** Copie a string completa, incluindo `?sslmode=require`

---

## 🔧 **CONFIGURAR NO VERCEL**

### **1. Acesse Vercel Dashboard**
- https://vercel.com/dashboard
- Selecione seu projeto: `olv-internacional-website-v3`

### **2. Vá em Settings → Environment Variables**

### **3. Adicione a Variável**
- **Key:** `DATABASE_URL`
- **Value:** Cole a connection string do Neon (a que você copiou)
- **Environment:** Production, Preview, Development (marque todos)

### **4. Salve e Faça Redeploy**
- Clique em **Save**
- Vá em **Deployments** → Selecione o último deploy → **Redeploy**

---

## ✅ **VERIFICAR SE FUNCIONOU**

Após configurar, execute:
```powershell
Invoke-WebRequest -Uri "https://www.olvinternacional.com.br/api/blog/count-posts" -Method GET
```

Se `dbStatus.hasPostgres: true`, está configurado corretamente!

---

**Última atualização:** Janeiro 2026
