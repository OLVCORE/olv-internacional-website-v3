# 📧 Configuração de Email - OLV Internacional

## Como Configurar Envio de Emails Reais

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:

```env
SMTP_HOST=mail.olvinternacional.com.br
SMTP_PORT=465
SMTP_USER=consultores@olvinternacional.com.br
SMTP_PASS=sua-senha-aqui
RECEIVE_EMAIL=consultores@olvinternacional.com.br
```

**⚠️ IMPORTANTE:** 
- Use a senha do email `consultores@olvinternacional.com.br`
- O arquivo `.env` já está no `.gitignore` e não será commitado
- Nunca compartilhe suas credenciais
- Substitua `sua-senha-aqui` pela senha real do email

**Como criar o arquivo `.env`:**
1. Na raiz do projeto, crie um novo arquivo chamado `.env`
2. Copie o conteúdo acima
3. Substitua `sua-senha-aqui` pela senha real do email `consultores@olvinternacional.com.br`
4. Salve o arquivo

### 3. Configuração do Servidor OLV Internacional

O servidor está configurado para usar o servidor de email da OLV Internacional:

**Configurações SMTP:**
- **Servidor:** `mail.olvinternacional.com.br`
- **Porta:** `465` (SSL/TLS)
- **Criptografia:** SSL/TLS
- **Autenticação:** Requerida
- **Email de envio:** `consultores@olvinternacional.com.br`
- **Email de recebimento:** `consultores@olvinternacional.com.br`

**Configurações IMAP (para recebimento):**
- **Servidor:** `mail.olvinternacional.com.br`
- **Porta:** `993` (SSL/TLS)
- **Criptografia:** SSL/TLS

### 4. Outros Provedores (Alternativas)

Se precisar usar outro provedor, ajuste as variáveis no `.env`:

#### Gmail
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-app
```
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
