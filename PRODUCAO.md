# 🚀 Configuração para Produção - OLV Internacional

## ⚠️ Problema Atual

O site está sendo acessado em produção (`www.olvinternacional.com.br`), mas as APIs (`/api/checklist-report` e `/api/contact`) só funcionam quando o servidor Node.js está rodando localmente.

## ✅ Solução Implementada

O código agora detecta automaticamente se está em **desenvolvimento** ou **produção**:

- **Desenvolvimento** (localhost:3000): Usa URLs relativas (`/api/...`)
- **Produção** (www.olvinternacional.com.br): Tenta usar `https://api.olvinternacional.com.br/api/...`

## 🔧 Opções para Produção

### Opção 1: Subdomínio de API (Recomendado)

1. **Criar subdomínio `api.olvinternacional.com.br`**
   - Configure no seu provedor de hospedagem/DNS
   - Aponte para o servidor onde o Node.js está rodando

2. **Configurar servidor Node.js em produção**
   ```bash
   # No servidor de produção
   npm install
   npm install pm2 -g  # Gerenciador de processos
   pm2 start server.js --name olv-api
   pm2 save
   pm2 startup  # Para iniciar automaticamente
   ```

3. **Configurar proxy reverso (Nginx)**
   ```nginx
   server {
       listen 80;
       server_name api.olvinternacional.com.br;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### Opção 2: Mesmo Domínio (Alternativa)

Se preferir usar o mesmo domínio, ajuste o código em `script.js`:

```javascript
const apiBaseUrl = isDevelopment 
    ? '' 
    : 'https://www.olvinternacional.com.br'; // Mesmo domínio
```

E configure o servidor web (Apache/Nginx) para fazer proxy das rotas `/api/*` para o Node.js.

### Opção 3: Serviço de Email Direto (Temporário)

Para uma solução rápida enquanto o backend não está configurado, você pode usar um serviço de email de terceiros:

- **EmailJS** (https://www.emailjs.com/)
- **Formspree** (https://formspree.io/)
- **SendGrid** (https://sendgrid.com/)

## 📋 Checklist de Deploy

- [ ] Servidor Node.js configurado e rodando em produção
- [ ] Variáveis de ambiente (`.env`) configuradas no servidor
- [ ] Subdomínio `api.olvinternacional.com.br` configurado (ou mesmo domínio)
- [ ] SSL/HTTPS configurado para o subdomínio de API
- [ ] Firewall permitindo conexões na porta do servidor Node.js
- [ ] PM2 ou similar configurado para manter o servidor rodando
- [ ] Logs configurados para monitoramento
- [ ] Teste de envio de email funcionando

## 🔍 Verificação

Após configurar, teste:

1. Acesse `https://www.olvinternacional.com.br`
2. Preencha o formulário de diagnóstico
3. Verifique no console do navegador se a requisição foi para a URL correta
4. Verifique os logs do servidor Node.js
5. Confirme se o email chegou em `consultores@olvinternacional.com.br`

## 📞 Suporte

Se precisar de ajuda com a configuração, entre em contato com a equipe de desenvolvimento.
