# Custo: Análise OLV por IA — Perplexity vs OpenAI (GPT-4o mini)

Comparação **custo por análise** para o bloco "Análise OLV" no blog (1 notícia → 1 parágrafo contextualizado em supply chain / comércio exterior).

---

## Uso típico por análise (OLV)

| Conceito | Valor |
|----------|--------|
| Input | system prompt (~200 tokens) + título + trecho da notícia (~800 tokens) ≈ **1.000 tokens** |
| Output | 2–4 frases em PT-BR, máx. 500 tokens ≈ **~300 tokens** em média |

---

## Preços por 1M tokens (APIs oficiais)

| Provedor | Modelo | Input (1M tokens) | Output (1M tokens) |
|----------|--------|--------------------|----------------------|
| **Perplexity** | Sonar | $1,00 | $1,00 |
| **OpenAI** | GPT-4o mini | $0,15 | $0,60 |

---

## Custo por análise (1 notícia → 1 análise OLV)

| Provedor | Modelo | Cálculo | **Custo por análise (USD)** | **~BRL (câmbio 6,0)** |
|----------|--------|--------|-----------------------------|-------------------------|
| **Perplexity** | Sonar | 1k×$1/1M + 300×$1/1M | **~US$ 0,0013** | **~R$ 0,008** |
| **OpenAI** | GPT-4o mini | 1k×$0,15/1M + 300×$0,60/1M | **~US$ 0,00033** | **~R$ 0,002** |

**Conclusão de custo:** GPT-4o mini fica em torno de **3–4× mais barato** que Perplexity Sonar por análise.

---

## Cenário: 2 ingestões/dia (8h e 14h), ~12 análises/dia

| Provedor | Custo/dia (USD) | Custo/mês (USD) | Custo/mês (BRL ~6,0) |
|----------|-----------------|-----------------|----------------------|
| **Perplexity Sonar** | ~$0,016 | ~$0,48 | **~R$ 2,90** |
| **OpenAI GPT-4o mini** | ~$0,004 | ~$0,12 | **~R$ 0,72** |

Os dois são **baratos** nesse volume; a diferença em reais é pequena (poucos reais por mês).

---

## Qual escolher?

| Critério | Perplexity (Sonar) | OpenAI (GPT-4o mini) |
|----------|--------------------|------------------------|
| **Custo** | Maior (~R$ 3/mês no cenário acima) | Menor (~R$ 0,70/mês) |
| **Contexto web** | Sim: pode buscar na web e citar fontes recentes | Não: só o texto que você envia (título + trecho) |
| **Qualidade da análise** | Boa; pode enriquecer com dados atuais | Boa; baseada só na notícia e no prompt OLV |
| **Implementação atual** | Já está no projeto (`perplexity-service.js`) | Seria preciso criar `openai-analysis-service.js` e trocar a chamada |

**Resumo:**  
- Se o foco é **menor custo** e análise só sobre o texto da notícia + contexto OLV: **GPT-4o mini** é melhor (e mais barato).  
- Se quiser **possibilidade de contexto web** (dados, tendências, fontes) na análise: **Perplexity** faz sentido, com custo ainda baixo.

Para “abrir os olhos e ver muitas [análises]” sem preocupação de custo, **os dois** são viáveis; GPT-4o mini é a opção mais econômica por análise.

---

## Próximo passo (se quiser usar GPT-4o mini)

1. Criar `openai-analysis-service.js` (chamada à API OpenAI com o mesmo prompt OLV).  
2. Em `blog-api.js`: usar análise OpenAI em vez de (ou como fallback de) Perplexity.  
3. Variável de ambiente: `OPENAI_API_KEY` em vez de (ou além de) `PERPLEXITY_API_KEY`.

Se quiser, posso desenhar o fluxo exato (qual variável de ambiente priorizar, fallback, etc.).
