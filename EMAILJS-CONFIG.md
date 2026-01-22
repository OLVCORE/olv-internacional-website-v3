# 📧 Configuração EmailJS - OLV Internacional

## ✅ Solução 100% Web - Funciona Direto do Site

O sistema agora usa **EmailJS** que funciona 100% na web, sem necessidade de servidor Node.js!

## 🚀 Passo a Passo para Configurar

### 1. Criar Conta no EmailJS

1. Acesse: https://www.emailjs.com/
2. Crie uma conta gratuita (até 200 emails/mês grátis)
3. Faça login no painel

### 2. Configurar Serviço de Email

1. No painel, vá em **Email Services**
2. Clique em **Add New Service**
3. Escolha seu provedor de email:
   - **Gmail** (recomendado para testes)
   - **Outlook/Office365**
   - **Custom SMTP** (para usar mail.olvinternacional.com.br)
4. Configure as credenciais do email `consultores@olvinternacional.com.br`
5. Anote o **Service ID** gerado (ex: `service_abc123`)

### 3. Criar Templates de Email

#### Template 1: Relatório de Aderência (Checklist)

1. Vá em **Email Templates**
2. Clique em **Create New Template**
3. Nome: `Relatório de Aderência OLV`
4. Template ID: `template_checklist_report` (ou outro nome de sua escolha)
5. Configure o template:

**Subject:**
```
🚨 URGENTE: Relatório de Aderência - {{company}} ({{adherence}})
```

**Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #0066cc; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; }
        .highlight { background: #fff; padding: 15px; margin: 10px 0; border-left: 4px solid #0066cc; }
        .adherence-score { font-size: 48px; font-weight: bold; color: #0066cc; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Relatório de Aderência OLV</h1>
        </div>
        <div class="content">
            <div class="highlight">
                <h2>Dados do Cliente</h2>
                <p><strong>Nome:</strong> {{from_name}}</p>
                <p><strong>Empresa:</strong> {{company}}</p>
                <p><strong>Email:</strong> {{from_email}}</p>
                <p><strong>Telefone:</strong> {{from_phone}}</p>
            </div>
            
            <div class="highlight">
                <h2>Nível de Aderência</h2>
                <div class="adherence-score">{{adherence}}</div>
                <p style="text-align: center;"><strong>{{adherence_level}}</strong></p>
            </div>
            
            <div class="highlight">
                <h2>Itens Identificados ({{items_count}})</h2>
                <pre style="white-space: pre-wrap; font-family: Arial;">{{items_list}}</pre>
            </div>
            
            <div class="highlight">
                <p><strong>Data/Hora:</strong> {{timestamp}}</p>
            </div>
        </div>
    </div>
</body>
</html>
```

#### Template 2: Formulário de Contato

1. Crie outro template
2. Nome: `Formulário de Contato OLV`
3. Template ID: `template_contact_form`
4. Configure:

**Subject:**
```
📧 Novo Contato - {{from_name}} ({{company}})
```

**Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #0066cc; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; }
        .highlight { background: #fff; padding: 15px; margin: 10px 0; border-left: 4px solid #0066cc; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📧 Novo Contato - OLV Internacional</h1>
        </div>
        <div class="content">
            <div class="highlight">
                <h2>Dados do Cliente</h2>
                <p><strong>Nome:</strong> {{from_name}}</p>
                <p><strong>Empresa:</strong> {{company}}</p>
                <p><strong>Email:</strong> {{from_email}}</p>
                <p><strong>Telefone:</strong> {{from_phone}}</p>
                <p><strong>Cargo:</strong> {{cargo}}</p>
                <p><strong>Área de Interesse:</strong> {{interesse}}</p>
            </div>
            
            <div class="highlight">
                <h2>Mensagem</h2>
                <p>{{message}}</p>
            </div>
            
            <div class="highlight">
                <p><strong>Data/Hora:</strong> {{timestamp}}</p>
            </div>
        </div>
    </div>
</body>
</html>
```

### 4. Obter Public Key

1. Vá em **Account** > **General**
2. Copie sua **Public Key** (ex: `abc123xyz`)

### 5. Configurar no Código

Abra o arquivo `script.js` e atualize as configurações:

**Linha ~521 (Checklist Report):**
```javascript
const EMAILJS_CONFIG = {
    serviceId: 'service_abc123', // SEU SERVICE ID AQUI
    templateId: 'template_checklist_report', // SEU TEMPLATE ID AQUI
    publicKey: 'abc123xyz' // SUA PUBLIC KEY AQUI
};
```

**Linha ~710 (Contact Form):**
```javascript
const EMAILJS_CONFIG = {
    serviceId: 'service_abc123', // SEU SERVICE ID AQUI
    templateId: 'template_contact_form', // SEU TEMPLATE ID AQUI
    publicKey: 'abc123xyz' // SUA PUBLIC KEY AQUI
};
```

### 6. Testar

1. Faça upload dos arquivos atualizados para o servidor
2. Acesse o site em produção
3. Preencha e envie um formulário de teste
4. Verifique se o email chegou em `consultores@olvinternacional.com.br`

## ✅ Vantagens do EmailJS

- ✅ Funciona 100% na web, sem servidor Node.js
- ✅ Não precisa de backend
- ✅ Emails chegam direto na caixa de entrada
- ✅ Grátis até 200 emails/mês
- ✅ Fácil de configurar
- ✅ Seguro (chaves públicas)

## 🔒 Segurança

- A Public Key pode ser exposta no frontend (é segura)
- As credenciais SMTP ficam no EmailJS (não no código)
- Limite de rate limiting automático

## 📞 Suporte

Se precisar de ajuda:
- Documentação: https://www.emailjs.com/docs/
- Suporte: support@emailjs.com
