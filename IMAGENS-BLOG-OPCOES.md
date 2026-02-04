# Imagens dos cards do blog — Canva, Gamma e alternativas

## Situação atual

- **Notícias RSS** que trazem imagem da matéria → o card usa essa imagem.
- **Insights, Análises, Guias** (e posts sem imagem) → o sistema usa **ícone Font Awesome + gradiente** (gerado por `blog-image-fallback.js`), que fica mais “superficial” que uma foto real.

---

## Cursor, Canva e Gamma

- **Cursor** (este editor/IA) **não tem integração nativa** com Canva, Gamma ou ferramentas visuais de design. Não dá para “pedir ao Cursor” que crie um layout no Canva ou no Gamma automaticamente.
- **Canva** e **Gamma** são usados por você, manualmente: você cria o visual e exporta (imagem ou link). Para automatizar, seria preciso usar as **APIs** deles (se existirem e forem adequadas para geração em massa).

---

## Opções para imagens que “combinem com o assunto”

### 1. **API de geração de imagem por IA (recomendado para automação)**

Na **ingestão** (quando o post é criado/salvo), chamar uma API que gera uma imagem a partir do **título + categoria** do post:

- **OpenAI DALL·E 3** (ou 2): você envia um prompt tipo “Imagem corporativa, abstrata, sobre logística e comércio exterior, tons azuis, sem texto” + variações por categoria. Custo por imagem (ex.: ~US$ 0,04–0,08 por chamada).
- **Stability AI / Stable Diffusion** (via API): mesmo conceito, outro custo.
- **Serviços de “OG image” dinâmica**: alguns geram imagem sob demanda a partir de título/categoria (ex.: Vercel OG, Cloudinary com overlay de texto). Podem ser usados na **hora de exibir** o card (URL dinâmica) em vez de salvar arquivo.

**Vantagem:** totalmente automático; cada post pode ter uma imagem coerente com o tema.  
**Desvantagem:** custo por imagem e (no caso de DALL·E) possível fila/limite de uso.

### 2. **Banco de imagens por categoria**

- Ter um conjunto de **imagens stock** (Unsplash, Pexels, ou compradas) por categoria (ex.: “análise”, “guia”, “insight”, “notícia”).
- Na ingestão, escolher uma imagem **aleatória** (ou por hash do título) da categoria.
- Pode ser implementado em `blog-image-fallback.js`: em vez de só ícone + gradiente, retornar uma URL de imagem fixa ou de um CDN.

**Vantagem:** sem custo por geração, visual mais “foto” que ícone.  
**Desvantagem:** não é única por post; repetição entre posts da mesma categoria.

### 3. **Canva / Gamma manual (sem integração no Cursor)**

- Você (ou a equipe) cria **templates** no Canva ou no Gamma (ex.: um para “Análise”, um para “Guia”, um para “Insight”).
- Exporta as imagens e as coloca no projeto (ex.: `/assets/blog-cards/`) ou em um CDN.
- No código, posts sem imagem usam uma dessas imagens por categoria (como no item 2, mas com arte feita por você).

**Vantagem:** controle total do visual, identidade da marca.  
**Desvantagem:** não é automático; cada novo tipo de card pode exigir novo template e nova exportação.

### 4. **Serviço de “OG image” dinâmica (link preview + card)**

- Ferramentas como **Vercel OG** (@vercel/og), **Cloudinary**, ou um **microserviço** que gera uma imagem (ex.: PNG) a partir de parâmetros na URL (título, categoria, data).
- No blog, o **card** usa a URL dessa API, ex.:  
  `https://seu-site.com/api/og-image?title=...&category=insights`
- A API gera a imagem (layout fixo + texto do título/categoria) e devolve o PNG.

**Vantagem:** uma imagem “de verdade” por post, sempre alinhada ao título/categoria; pode ser a mesma usada para redes sociais.  
**Desvantagem:** exige implementar e hospedar o endpoint (ex.: serverless na Vercel).

---

## Resumo prático

| Objetivo | Opção mais direta |
|----------|--------------------|
| Automático e único por post | API de IA (DALL·E/Stable) ou OG image dinâmica |
| Sem custo extra e rápido | Banco de imagens por categoria (stock ou templates Canva/Gamma exportados) |
| Controle total do design | Templates no Canva/Gamma, exportar e usar como imagens por categoria |

Cursor não substitui Canva/Gamma; ele pode **orquestrar** o código que chama APIs (DALL·E, OG image, ou escolha de imagem por categoria). Se quiser seguir por uma dessas opções (ex.: “gerar imagem com DALL·E na ingestão” ou “endpoint de OG image”), posso indicar os passos no código (onde chamar, onde salvar a URL no post, etc.).
