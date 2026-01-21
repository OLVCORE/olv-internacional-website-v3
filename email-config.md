# 📧 Configuração de Email - OLV Internacional

## Como Configurar Envio de Emails Reais

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto (copie de `.env.example`):

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-app
RECEIVE_EMAIL=contato@olvinternacional.com.br
```

### 3. Configuração por Provedor

#### Gmail
1. Ative a verificação em 2 etapas na sua conta Google
2. Acesse: https://myaccount.google.com/apppasswords
3. Gere uma "Senha de App"
4. Use essa senha no `SMTP_PASS`

#### Outlook/Office365
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=seu-email@outlook.com
SMTP_PASS=sua-senha
```

#### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=sua-api-key-do-sendgrid
```

#### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@seu-dominio.mailgun.org
SMTP_PASS=sua-senha-mailgun
```

### 4. Carregar Variáveis de Ambiente

Para carregar o arquivo `.env`, instale o pacote `dotenv`:

```bash
npm install dotenv
```

E adicione no início do `server.js`:

```javascript
require('dotenv').config();
```

### 5. Testar Configuração

Após configurar, reinicie o servidor:

```bash
npm start
```

Quando um relatório for enviado, você verá no console:
- ✅ Email enviado: [messageId] (se funcionou)
- ❌ Erro ao enviar email: [erro] (se houver problema)

### 6. Formato do Email Enviado

O email inclui:
- Dados do cliente (nome, empresa, email, telefone)
- Nível de aderência (%)
- Lista de itens identificados
- Análise do nível de aderência
- Data/hora do envio

### 7. Segurança

⚠️ **IMPORTANTE:**
- NUNCA commite o arquivo `.env` no Git
- Use variáveis de ambiente em produção
- Para produção, considere usar serviços como:
  - AWS SES
  - SendGrid
  - Mailgun
  - Postmark
