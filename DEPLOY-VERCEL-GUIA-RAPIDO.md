# 🚀 GUIA RÁPIDO - DEPLOY NO VERCEL
## OLV Internacional | Blog com Serverless Functions

---

## ✅ **VERCEL CLI INSTALADO**

O Vercel CLI foi instalado com sucesso. Agora siga estes passos:

---

## 📋 **PASSOS PARA DEPLOY**

### **1. Login no Vercel (Primeira vez)**
```bash
vercel login
```
- Abrirá o navegador para autenticação
- Ou use email para login

### **2. Conectar Projeto ao Vercel**
```bash
vercel link
```
- Se o projeto já existe no Vercel, ele perguntará qual projeto
- Se não existe, será criado no próximo passo

### **3. Deploy para Produção**
```bash
vercel --prod
```
- Ou simplesmente:
```bash
vercel
```
- Na primeira vez, ele perguntará algumas configurações
- Escolha as opções padrão (Enter)

---

## 🔧 **CONFIGURAÇÕES IMPORTANTES**

### **Durante o Deploy:**
- **Project Name:** `olv-internacional-website-v3` (ou o nome que preferir)
- **Directory:** `.` (raiz do projeto)
- **Override settings:** `N` (não, usar vercel.json)

---

## 📁 **ARQUIVOS NECESSÁRIOS**

✅ **Já criados:**
- `vercel.json` - Configuração de rotas e funções
- `api/blog/posts.js` - Serverless function
- `api/blog/post.js` - Serverless function
- `api/blog/process.js` - Serverless function

---

## ⚠️ **OBSERVAÇÕES**

### **1. Variáveis de Ambiente (se necessário):**
Se precisar de variáveis de ambiente:
```bash
vercel env add NOME_DA_VARIAVEL
```

### **2. Verificar Deploy:**
Após o deploy, você receberá uma URL:
- Preview: `https://olv-internacional-website-v3-xxxxx.vercel.app`
- Produção: `https://www.olvinternacional.com.br` (se configurado)

### **3. Testar APIs:**
Após deploy, teste:
- `https://www.olvinternacional.com.br/api/blog/posts`
- `https://www.olvinternacional.com.br/blog.html`

---

## 🧪 **TESTAR LOCALMENTE (OPCIONAL)**

Antes de fazer deploy, teste localmente:
```bash
vercel dev
```
- Roda serverless functions localmente
- Acessa em `http://localhost:3000`

---

## 📅 **CRON JOBS**

Após deploy, configure cron jobs no dashboard do Vercel:
1. Acesse: https://vercel.com/dashboard
2. Vá em: Settings → Cron Jobs
3. Verifique se o cron configurado em `vercel.json` está ativo

**Nota:** Vercel Cron requer plano Pro ($20/mês). Alternativa: usar serviço externo.

---

## ✅ **PRÓXIMOS PASSOS**

1. ✅ Vercel CLI instalado
2. ⏭️ Fazer login: `vercel login`
3. ⏭️ Conectar projeto: `vercel link` (se necessário)
4. ⏭️ Deploy: `vercel --prod`
5. ⏭️ Testar blog em produção

---

**Última atualização:** Janeiro 2026
