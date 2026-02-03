# Stratevo Visitor Tracking - OLV Internacional

## Status da instalação

- **Script:** `stratevo-tracking.js` (raiz do projeto)
- **Carregamento:** Injetado automaticamente em todas as páginas via `components.js`
- **Domínio:** O site deve estar registrado no Stratevo como `olvinternacional.com.br` para a validação de domínio funcionar

---

## Configuração obrigatória: TENANT_ID

1. Acesse o **Stratevo One**
2. Vá em **Configurações** (ícone de engrenagem)
3. Copie o **Tenant ID** da OLV
4. Abra o arquivo **`stratevo-tracking.js`** na raiz do projeto
5. Localize a linha:
   ```javascript
   TENANT_ID: 'SEU_TENANT_ID_AQUI',
   ```
6. Substitua `SEU_TENANT_ID_AQUI` pelo ID real, por exemplo:
   ```javascript
   TENANT_ID: 'e19ce5ab-bfd4-4d75-abb2-ed9d265d2ef1',
   ```
7. Salve e faça deploy

Enquanto o TENANT_ID não for configurado, o script não envia eventos (apenas um aviso no console se DEBUG estiver true).

---

## Debug

No arquivo `stratevo-tracking.js`, altere para ver logs no console do navegador:

```javascript
DEBUG: true
```

Depois de publicar, abra o site, F12 > Console. Você deve ver mensagens `[Stratevo]` ao navegar e ao enviar eventos.

---

## Dados capturados

- Pageview, tempo na página, scroll depth
- UTM e referrer
- Envios de formulário (email, nome, telefone, empresa)
- Cliques em botões de alta intenção (contato, orçamento, WhatsApp, etc.)
- Evento de saída (beforeunload) com tempo e scroll

A API Stratevo valida o domínio de origem; use o domínio registrado no tenant.
