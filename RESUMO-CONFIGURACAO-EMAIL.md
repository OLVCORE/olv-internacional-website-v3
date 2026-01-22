# 📧 RESUMO: Como Fazer os Formulários Enviarem Emails

## 🎯 O Que Você Quer

```
Usuário preenche formulário → Email chega em consultores@olvinternacional.com.br
```

## ✅ Solução: EmailJS (5 minutos de configuração)

**EmailJS NÃO é banco de dados!** É apenas um serviço que envia emails usando o servidor SMTP da OLV.

---

## 📋 O Que Você Precisa Fazer

### 1️⃣ Criar conta no EmailJS (grátis)
   - Acesse: https://www.emailjs.com/
   - Crie conta gratuita

### 2️⃣ Configurar servidor SMTP da OLV
   - No EmailJS, escolha "Custom SMTP"
   - Use: `mail.olvinternacional.com.br`
   - Porta: `465`
   - Email: `consultores@olvinternacional.com.br`
   - Senha: [sua senha do email]

### 3️⃣ Criar 2 templates de email
   - Template 1: Formulário de Contato
   - Template 2: Relatório de Aderência

### 4️⃣ Copiar 3 valores
   - Service ID
   - Template ID (contato)
   - Template ID (aderência)
   - Public Key

### 5️⃣ Colar no arquivo `script.js`
   - Substituir `'COLE_AQUI_O_SERVICE_ID'` pelo Service ID
   - Substituir `'COLE_AQUI_O_TEMPLATE_ID_CONTATO'` pelo Template ID do contato
   - Substituir `'COLE_AQUI_O_TEMPLATE_ID_ADERENCIA'` pelo Template ID da aderência
   - Substituir `'COLE_AQUI_A_PUBLIC_KEY'` pela Public Key

### 6️⃣ Fazer upload e testar

---

## ❌ O Que Você NÃO Precisa

- ❌ Criar banco de dados
- ❌ Criar projeto no Supabase
- ❌ Criar tabelas
- ❌ Servidor Node.js rodando
- ❌ Nada complicado!

---

## 🔄 Como Funciona

```
1. Usuário preenche formulário no site
   ↓
2. JavaScript envia dados para EmailJS
   ↓
3. EmailJS usa servidor SMTP da OLV (mail.olvinternacional.com.br)
   ↓
4. Email chega em consultores@olvinternacional.com.br
```

**Simples assim!**

---

## 📖 Guia Completo

Veja o arquivo **`CONFIGURAR-EMAIL-OLV-SIMPLES.md`** para instruções detalhadas passo a passo.

---

## ⚠️ Erro Atual

O erro `"The Public Key is invalid"` acontece porque você ainda não configurou a Public Key no código.

**Solução:** Siga os passos acima e cole a Public Key no `script.js`.

---

**Tempo total: 5-10 minutos** ⏱️
