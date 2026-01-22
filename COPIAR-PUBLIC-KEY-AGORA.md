# 🚨 AÇÃO URGENTE: Configurar Public Key

## ⚠️ Problema

O erro `"The Public Key is invalid"` acontece porque a Public Key ainda não foi copiada e colada no código.

## ✅ Solução (2 minutos)

### Passo 1: Copiar a Public Key

1. Acesse: **https://dashboard.emailjs.com/admin/account**
2. Faça login na sua conta EmailJS
3. Na seção **"Public Key"**, copie a chave completa
   - Exemplo: `user_abc123xyz` ou `abc123xyz`
   - **COPIE TUDO!** (geralmente começa com `user_`)

### Passo 2: Colar no script.js

1. Abra o arquivo `script.js` no seu editor
2. Procure por `publicKey: 'COLE_AQUI_A_PUBLIC_KEY'` (aparece em **2 lugares**)
3. Substitua `'COLE_AQUI_A_PUBLIC_KEY'` pela sua Public Key real

**LOCAL 1 (linha ~535) - Relatório de Aderência:**
```javascript
const EMAILJS_CONFIG = {
    serviceId: 'service_kwstqkk', // ✅ Já configurado
    templateId: 'COLE_AQUI_O_TEMPLATE_ID_ADERENCIA',
    publicKey: 'SUA_PUBLIC_KEY_AQUI' // ← COLE A PUBLIC KEY AQUI
};
```

**LOCAL 2 (linha ~774) - Formulário de Contato:**
```javascript
const EMAILJS_CONFIG = {
    serviceId: 'service_kwstqkk', // ✅ Já configurado
    templateId: 'COLE_AQUI_O_TEMPLATE_ID_CONTATO',
    publicKey: 'SUA_PUBLIC_KEY_AQUI' // ← COLE A MESMA PUBLIC KEY AQUI
};
```

### Passo 3: Verificar

Certifique-se de que:
- ✅ A Public Key está entre aspas simples: `'user_abc123xyz'`
- ✅ Não há espaços extras antes ou depois
- ✅ Está configurada nos **2 locais** (aderência e contato)

### Passo 4: Fazer Upload e Testar

1. Salve o arquivo `script.js`
2. Faça upload para o servidor
3. Teste o formulário novamente

---

## 📋 Checklist Rápido

- [ ] Acessei https://dashboard.emailjs.com/admin/account
- [ ] Copiei a Public Key completa
- [ ] Colei no `script.js` linha ~535 (aderência)
- [ ] Colei no `script.js` linha ~774 (contato)
- [ ] Verifiquei que está entre aspas simples
- [ ] Fiz upload do arquivo atualizado
- [ ] Testei o formulário

---

## ⚠️ Importante

- A Public Key é a **MESMA** para ambos os formulários
- Ela deve estar **exatamente** como aparece no dashboard (sem espaços extras)
- Se ainda der erro, verifique se copiou a chave completa

---

**Depois de configurar a Public Key, os formulários vão funcionar!** 🚀
