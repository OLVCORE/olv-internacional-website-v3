# 🚀 POPULAR O BLOG AGORA
## OLV Internacional | Processamento Manual de Artigos

---

## ✅ **DEPLOY CONCLUÍDO COM SUCESSO!**

- ✅ **URL Produção:** https://www.olvinternacional.com.br
- ✅ **URL Preview:** https://olv-internacional-website-v3-kqv9agsiz-olv-core444.vercel.app
- ✅ **Inspect:** https://vercel.com/olv-core444/olv-internacional-website-v3/Bnbe5bZDasHkTp6Qh1o2xtDmyAyH

---

## ⚡ **PROCESSAR ARTIGOS AGORA (MANUAL)**

### **Opção 1: Via Navegador (Mais Fácil)**
1. Abra: https://www.olvinternacional.com.br/api/blog/process
2. Ou use uma ferramenta como Postman/Insomnia para fazer POST

### **Opção 2: Via Terminal (curl)**
```bash
curl -X POST https://www.olvinternacional.com.br/api/blog/process
```

### **Opção 3: Via PowerShell**
```powershell
Invoke-WebRequest -Uri "https://www.olvinternacional.com.br/api/blog/process" -Method POST
```

---

## ⏱️ **TEMPO DE PROCESSAMENTO**

- **Primeira vez:** 2-5 minutos (busca dados de todas as APIs)
- **Próximas vezes:** 30-60 segundos (atualizações incrementais)

---

## 📊 **VERIFICAR SE FUNCIONOU**

Após processar, verifique:

1. **Listar Posts:**
   - https://www.olvinternacional.com.br/api/blog/posts

2. **Ver Blog:**
   - https://www.olvinternacional.com.br/blog.html

---

## ⚠️ **OBSERVAÇÕES IMPORTANTES**

### **1. APIs Públicas:**
- Algumas APIs podem ter limites de requisição
- Se falhar, tente novamente em alguns minutos
- Verifique logs no Vercel Dashboard

### **2. Dados Temporários:**
- No Vercel, dados ficam em `/tmp/blog-data/`
- Podem ser perdidos entre deploys
- **Recomendação:** Migrar para banco de dados

### **3. Cron Jobs:**
- Configurado para rodar diariamente às 5h BRT
- Requer plano Pro do Vercel
- Alternativa: usar serviço externo (cron-job.org)

---

## 🔄 **PROCESSAMENTO AUTOMÁTICO**

### **Cron Job Configurado:**
- **Frequência:** Diariamente
- **Horário:** 5h BRT (8h UTC)
- **Rota:** `/api/blog/process`

**Nota:** Verifique se está ativo no dashboard do Vercel.

---

## ✅ **PRÓXIMOS PASSOS**

1. ⏭️ Processar artigos manualmente (agora)
2. ⏭️ Verificar se apareceram no blog
3. ⏭️ Testar navegação e filtros
4. ⏭️ Configurar cron job (se tiver plano Pro)

---

**Última atualização:** Janeiro 2026
