# 🚨 CORREÇÃO: Template de Aderência - Erro 422

## ⚠️ Problema

O erro `422 - The recipients address is empty` acontece porque o template de aderência no EmailJS não tem o campo **"To Email"** configurado.

## ✅ Solução Rápida (2 minutos)

### Passo 1: Editar o Template no EmailJS

1. Acesse: **https://dashboard.emailjs.com/admin/template**
2. Clique no template **"Auto-Reply"** (Template ID: `template_ybtzkne`)
3. Procure o campo **"To Email"** (geralmente no topo do formulário de edição)
4. Configure de uma das seguintes formas:

**Opção 1 (Recomendada - Email Fixo):**
```
consultores@olvinternacional.com.br
```

**Opção 2 (Email Dinâmico - usando variável):**
```
{{email}}
```
*(O código já está configurado para enviar o campo `email` com o valor `consultores@olvinternacional.com.br`)*

### Passo 2: Salvar

1. Clique em **"Save"** ou **"Update Template"**
2. Pronto! O template agora vai enviar para o email correto

---

## 📋 Verificação

Após configurar, teste novamente o formulário de aderência. O email deve chegar em `consultores@olvinternacional.com.br`.

---

## ⚠️ Importante

- O campo **"To Email"** é obrigatório no EmailJS
- Se não estiver configurado, o EmailJS retorna erro 422
- O template de contato já está funcionando porque tem o "To Email" configurado

---

**Depois de configurar o "To Email" no template, o formulário de aderência vai funcionar!** 🚀
