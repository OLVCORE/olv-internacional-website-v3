consulotres# 📧 Configurar
 Envio de Emails - OLV Internacional

## ✅ O Que Você Precisa Fazer (5 minutos)

**NÃO precisa criar banco de dados, Supabase, ou nada disso!**

Você só precisa configurar EmailJS para usar o servidor de email da OLV (`mail.olvinternacional.com.br`).

---

## 🚀 Passo a Passo SIMPLES

### 1. Criar Conta no EmailJS (Grátis)

1. Acesse: **https://www.emailjs.com/**
2. Clique em **"Sign Up"** (criar conta)
3. Use seu email (pode ser `consultores@olvinternacional.com.br`)
4. Confirme o email

### 2. Configurar o Servidor SMTP da OLV

1. No painel do EmailJS, vá em **"Email Services"**
2. Clique em **"Add New Service"**
3. Escolha **"Custom SMTP"**
4. Preencha com os dados do servidor OLV:

```
Service Name: OLV Internacional SMTP
SMTP Server: mail.olvinternacional.com.br
SMTP Port: 465
Secure Connection: SSL/TLS (selecione esta opção)
Username: consultores@olvinternacional.com.br
Password: [Sua senha do email consultores@olvinternacional.com.br]
```

5. Clique em **"Create Service"**
6. **COPIE o Service ID** que aparece (exemplo: `service_abc123xyz`)

### 3. Criar Template de Email (Formulário de Contato)

1. No painel, vá em **"Email Templates"**
2. Clique em **"Create New Template"**
3. **IMPORTANTE:** Quando aparecer a tela "Select Template":
   - Escolha **"Contact Us"** (é o mais próximo)
   - **OU** clique em "Cancel" e depois "Create New" novamente se houver opção de criar do zero
   - **NÃO IMPORTA qual você escolher** - você vai SUBSTITUIR todo o conteúdo depois!
4. Preencha:

**Template Name:** `Formulário de Contato OLV`

**To Email:** `consultores@olvinternacional.com.br`

**Subject:**
```
📧 Novo Contato - {{from_name}} ({{company}})
```

**Content (HTML):**
```html
<h2>Novo Contato - OLV Internacional</h2>

<p><strong>Nome:</strong> {{from_name}}</p>
<p><strong>Empresa:</strong> {{company}}</p>
<p><strong>Email:</strong> {{from_email}}</p>
<p><strong>Telefone:</strong> {{from_phone}}</p>
<p><strong>Cargo:</strong> {{cargo}}</p>
<p><strong>Área de Interesse:</strong> {{interesse}}</p>

<h3>Mensagem:</h3>
<p>{{message}}</p>

<p><small>Enviado em: {{timestamp}}</small></p>
```

4. Clique em **"Save"**
5. **COPIE o Template ID** (exemplo: `template_abc123xyz`)

### 4. Criar Template de Email (Relatório de Aderência)

1. Crie outro template
2. **IMPORTANTE:** Quando aparecer a tela "Select Template":
   - Escolha **QUALQUER UM** (pode ser "Contact Us", "Auto-Reply", etc.)
   - **NÃO IMPORTA qual você escolher** - você vai SUBSTITUIR todo o conteúdo depois!
   - O template pré-definido é apenas uma estrutura básica - você vai personalizar completamente
3. Preencha:

**Template Name:** `Relatório de Aderência OLV`

**To Email:** `consultores@olvinternacional.com.br`

**Subject:**
```
🚨 Relatório de Aderência - {{company}} ({{adherence}})
```

**Content (HTML):**
```html
<h2>Relatório de Aderência - OLV Internacional</h2>

<p><strong>Nome:</strong> {{from_name}}</p>
<p><strong>Empresa:</strong> {{company}}</p>
<p><strong>Email:</strong> {{from_email}}</p>
<p><strong>Telefone:</strong> {{from_phone}}</p>

<h3>Nível de Aderência: {{adherence}}</h3>
<p><strong>Nível:</strong> {{adherence_level}}</p>

<h3>Itens Identificados ({{items_count}}):</h3>
<pre>{{items_list}}</pre>

<p><small>Enviado em: {{timestamp}}</small></p>
```

6. Clique em **"Save"**
7. **COPIE o Template ID** (exemplo: `template_xyz789abc`)

### 5. Obter a Public Key

1. No painel, vá em **"Account"** → **"General"**
2. Na seção **"Public Key"**, copie a chave (exemplo: `user_abc123xyz`)
3. **GUARDE esta chave!**

### 6. Atualizar o Código (script.js)

Abra o arquivo `script.js` e encontre estas duas seções:

**LOCAL 1 (linha ~526) - Relatório de Aderência:**
```javascript
const EMAILJS_CONFIG = {
    serviceId: 'COLE_AQUI_O_SERVICE_ID', // ← Cole o Service ID aqui
    templateId: 'COLE_AQUI_O_TEMPLATE_ID_ADERENCIA', // ← Cole o Template ID do relatório aqui
    publicKey: 'COLE_AQUI_A_PUBLIC_KEY' // ← Cole a Public Key aqui
};
```

**LOCAL 2 (linha ~737) - Formulário de Contato:**
```javascript
const EMAILJS_CONFIG = {
    serviceId: 'COLE_AQUI_O_SERVICE_ID', // ← Cole o Service ID aqui (mesmo de cima)
    templateId: 'COLE_AQUI_O_TEMPLATE_ID_CONTATO', // ← Cole o Template ID do contato aqui
    publicKey: 'COLE_AQUI_A_PUBLIC_KEY' // ← Cole a Public Key aqui (mesma de cima)
};
```

**Exemplo de como deve ficar:**
```javascript
const EMAILJS_CONFIG = {
    serviceId: 'service_abc123xyz',
    templateId: 'template_xyz789abc',
    publicKey: 'user_abc123xyz'
};
```

### 7. Fazer Upload e Testar

1. Salve o arquivo `script.js`
2. Faça upload para o servidor
3. Acesse a página de contato no site
4. Preencha e envie um formulário de teste
5. Verifique se o email chegou em `consultores@olvinternacional.com.br`

---

## ❓ Perguntas Frequentes

**P: Preciso criar banco de dados?**
R: NÃO! EmailJS é apenas para enviar emails. Não armazena dados.

**P: Preciso criar projeto no Supabase?**
R: NÃO! Supabase é banco de dados. Você não precisa disso.

**P: Os emails vão para onde?**
R: Direto para `consultores@olvinternacional.com.br` usando o servidor SMTP da OLV.

**P: É seguro?**
R: SIM! As credenciais SMTP ficam no EmailJS (não no código do site).

**P: É grátis?**
R: SIM! Até 200 emails/mês grátis.

---

## 🔗 Links Rápidos

- **Criar conta:** https://www.emailjs.com/
- **Email Services:** https://dashboard.emailjs.com/admin/integration
- **Templates:** https://dashboard.emailjs.com/admin/template
- **Public Key:** https://dashboard.emailjs.com/admin/account

---

## ✅ Checklist Final

- [ ] Conta EmailJS criada
- [ ] Serviço SMTP configurado com `mail.olvinternacional.com.br`
- [ ] Service ID copiado
- [ ] Template de Contato criado
- [ ] Template ID de Contato copiado
- [ ] Template de Aderência criado
- [ ] Template ID de Aderência copiado
- [ ] Public Key copiada
- [ ] `script.js` atualizado com os 3 valores (2 locais)
- [ ] Upload feito para o servidor
- [ ] Teste realizado com sucesso

---

**Pronto! Depois disso, os formulários vão enviar emails direto para `consultores@olvinternacional.com.br` usando o servidor SMTP da OLV.**
