# 🚨 CONFIGURAÇÃO URGENTE - EmailJS Public Key

## ⚠️ Problema Atual

O formulário de contato está retornando o erro:
```
The Public Key is invalid. To find this ID, visit https://dashboard.emailjs.com/admin/account
```

Isso acontece porque a **Public Key do EmailJS não foi configurada** no código.

## ✅ Solução Rápida (5 minutos)

### Passo 1: Obter a Public Key

1. Acesse: **https://dashboard.emailjs.com/admin/account**
2. Faça login na sua conta EmailJS
3. Na seção **"Public Key"**, copie a chave (exemplo: `user_abc123xyz` ou `abc123xyz`)

### Passo 2: Atualizar o Código

1. Abra o arquivo `script.js`
2. Procure por `publicKey: 'YOUR_PUBLIC_KEY'` (aparece em 2 lugares)
3. Substitua `'YOUR_PUBLIC_KEY'` pela sua Public Key real

**Localização 1 (linha ~526) - Checklist Report:**
```javascript
const EMAILJS_CONFIG = {
    serviceId: 'service_olv_internacional',
    templateId: 'template_checklist_report',
    publicKey: 'SUA_PUBLIC_KEY_AQUI' // ← COLE SUA PUBLIC KEY AQUI
};
```

**Localização 2 (linha ~737) - Contact Form:**
```javascript
const EMAILJS_CONFIG = {
    serviceId: 'service_olv_internacional',
    templateId: 'template_contact_form',
    publicKey: 'SUA_PUBLIC_KEY_AQUI' // ← COLE SUA PUBLIC KEY AQUI
};
```

### Passo 3: Verificar Service ID e Template ID

Certifique-se de que:
- `serviceId` corresponde ao ID do serviço criado no EmailJS
- `templateId` corresponde aos IDs dos templates criados

### Passo 4: Testar

1. Faça upload do arquivo `script.js` atualizado
2. Acesse a página de contato no site
3. Preencha e envie um formulário de teste
4. Verifique se o email chegou em `consultores@olvinternacional.com.br`

## 📋 Checklist de Configuração Completa

- [ ] Conta EmailJS criada
- [ ] Serviço de email configurado (Gmail/Outlook/Custom SMTP)
- [ ] Template de Checklist criado (`template_checklist_report`)
- [ ] Template de Contato criado (`template_contact_form`)
- [ ] Public Key copiada do dashboard
- [ ] Public Key atualizada no `script.js` (2 locais)
- [ ] Service ID atualizado no `script.js` (2 locais)
- [ ] Template IDs atualizados no `script.js` (2 locais)
- [ ] Teste de envio realizado com sucesso

## 🔗 Links Úteis

- Dashboard EmailJS: https://dashboard.emailjs.com/
- Account Settings (Public Key): https://dashboard.emailjs.com/admin/account
- Email Services: https://dashboard.emailjs.com/admin/integration
- Email Templates: https://dashboard.emailjs.com/admin/template

## 📞 Se Precisar de Ajuda

Se ainda tiver problemas:
1. Verifique o console do navegador (F12) para mensagens de erro detalhadas
2. Confirme que a Public Key foi copiada corretamente (sem espaços extras)
3. Verifique se os Service IDs e Template IDs estão corretos
4. Consulte a documentação completa em `EMAILJS-CONFIG.md`

---

**Nota sobre Google Tag Manager:** O erro `ERR_BLOCKED_BY_CLIENT` é normal quando o usuário tem bloqueador de anúncios instalado. Isso não afeta o funcionamento do site, apenas o tracking do Google Analytics.
