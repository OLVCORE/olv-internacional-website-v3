# Tradução automática do blog (inglês → português)

## O que é traduzido

Quando um artigo RSS vem **em inglês**, o sistema traduz **tudo** para português brasileiro antes de publicar:

| Onde aparece | Campo traduzido | Onde o usuário vê |
|--------------|------------------|-------------------|
| **Cards do blog** (listagem) | `title` + `excerpt` | Título e resumo em cada card |
| **Página do artigo** | `title` + `excerpt` + `content` | Cabeçalho, resumo e corpo da matéria |
| **Ticker** | `title` | Manchete na barra de notícias |

Ou seja: **título dos cards e corpo da matéria** são traduzidos. O visitante vê o conteúdo inteiro em português.

## Como funciona

1. **Detecção:** O código usa heurística (palavras comuns em inglês vs português) no título + resumo. Se parecer inglês, marca `_needsTranslation = true`.
2. **Tradução:** Chama `translateToPortuguese()` (API OpenAI, modelo gpt-4o-mini) para:
   - título
   - resumo (excerpt)
   - texto do corpo (até ~4900 caracteres; textos muito longos têm só o início traduzido)
3. **Publicação:** O artigo é salvo já em português (título, resumo e conteúdo).

## Recomendação: traduzir ou publicar em inglês?

Para o **blog da OLV em português** (público brasileiro):

- **Traduzir para português** é a melhor opção:
  - SEO em PT-BR (palavras-chave que o público busca).
  - Leitura mais fácil para a maioria.
  - Blog uniforme em um só idioma.

Publicar **só em inglês** (original) faz sentido se o alvo for leitores internacionais ou um site em inglês. No site atual, o fluxo está configurado para **traduzir e publicar em português**.

## Configuração

- **Variável de ambiente:** `OPENAI_API_KEY` (mesma chave usada para a análise OLV / fallback).
- Se `OPENAI_API_KEY` não estiver definida, a tradução não é feita e o artigo permanece no idioma original (evita quebrar a ingestão).
