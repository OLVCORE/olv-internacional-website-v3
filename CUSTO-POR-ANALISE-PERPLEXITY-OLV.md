# Custo por análise (Perplexity) — cenário OLV

**Sua pergunta:** Quando puxamos notícias da web, o motor de análise gera análises que colocam a OLV no contexto (supply chain, comércio exterior, gestão internacional, desenvolvimento de negócios). **Qual o custo médio por análise com a Perplexity?** E faz sentido um plano mais “suave” para não ficar caro (ex.: 3–5 análises/dia = R$ 5, 10, 20, 30)?

---

## 1. Fluxo que você descreveu

1. **Puxar** notícias das fontes escolhidas (RSS, etc.).
2. **Filtrar** o que é relevante para supply chain, comércio exterior, gestão internacional, negócios locais/globais.
3. **Analisar** cada notícia no contexto OLV (conjuntura, insights, sugestões).
4. **Publicar** no blog (análise + notícia linkada).

A dúvida é o custo do passo 3 quando usamos **Perplexity** para fazer essa análise contextualizada.

---

## 2. Custo médio por análise com a Perplexity

### 2.1 Por chamada (1 notícia → 1 análise OLV)

Estimativa por **uma** análise (uma notícia → um texto de análise no contexto OLV):

| Opção | Input (notícia + contexto OLV) | Output (análise) | **Custo por análise (USD)** |
|-------|--------------------------------|------------------|-----------------------------|
| **Sonar** (mais barato) | ~1.000 tokens × $1/1M = $0.001 | ~500 tokens × $1/1M = $0.0005 | **~$0.0015** (**~0,15 centavo USD**) |
| **Search API** (fixo por request) | — | — | **$0.005** (**0,5 centavo USD**) por request |

Ou seja:

- **Sonar:** ~**US$ 0,0015** por análise (~R$ 0,008 com dólar ~5,50).
- **Search API:** **US$ 0,005** por análise (~R$ 0,03).

Isso é **bem mais barato** que os US$ 0,25 (25 centavos) que você citou de outra plataforma. Aqui estamos na faixa de **0,15 a 0,5 centavo USD** por análise.

### 2.2 Em reais (aproximado, dólar ~R$ 5,50)

| Análises por dia | Sonar (USD/dia) | Sonar (BRL/mês) | Search API (USD/dia) | Search API (BRL/mês) |
|------------------|------------------|------------------|----------------------|----------------------|
| 3 | ~$0,005 | ~**R$ 0,80** | ~$0,015 | ~**R$ 2,50** |
| 5 | ~$0,008 | ~**R$ 1,30** | ~$0,025 | ~**R$ 4,10** |
| 10 | ~$0,015 | ~**R$ 2,50** | ~$0,05 | ~**R$ 8,25** |
| 20 | ~$0,03 | ~**R$ 5,00** | ~$0,10 | ~**R$ 16,50** |

Conclusão: com 3–5 análises por dia, a conta fica na faixa de **R$ 1–5/mês**, não R$ 5–30/dia. O “caro” que você imaginou (5, 10, 20, 30 reais) seria só se cada análise custasse dezenas de centavos de dólar; com Perplexity nesse uso, não é o caso.

---

## 3. Comparação com “25 centavos” ou “0,05 centavo”

- Se a **outra plataforma** cobra **US$ 0,25 por análise**:  
  - 5 análises/dia = US$ 1,25/dia ≈ **R$ 7/dia** ≈ **R$ 210/mês** — aí sim fica pesado.
- Com **Perplexity (Sonar)** em ~US$ 0,0015 por análise:  
  - 5 análises/dia ≈ **R$ 0,04/dia** ≈ **R$ 1,30/mês** — muito mais suave.

Ou seja: no cenário OLV (1 notícia → 1 análise contextualizada), **vale a pena** usar Perplexity do ponto de vista de custo; o risco de “5, 10, 20, 30 reais” por dia só aparece se o custo por análise for dezenas de vezes maior (como nessa outra plataforma a US$ 0,25).

---

## 4. Plano “suave” (custo controlado)

Para deixar previsível e barato:

1. **Limite diário de análises**  
   Ex.: no máximo **10 notícias/dia** viram análise OLV.  
   - Com Sonar: ~**R$ 2,50/mês**.  
   - Com Search: ~**R$ 8/mês**.

2. **Usar só o modelo mais barato (Sonar)**  
   Para “analisar no contexto OLV e sugerir categoria/insight”, Sonar costuma bastar. Sonar Pro / Deep Research só se quiser análises muito longas ou com mais pesquisa.

3. **Orçamento fixo por mês**  
   Ex.: “Não passar de US$ 2/mês” (~R$ 11).  
   - Com Sonar: dá para **~1.300 análises/mês** (~43/dia se usar todo dia).  
   - Na prática, 5–10 análises/dia fica bem abaixo disso.

4. **Implementação**  
   - Chamar a API **só para notícias que passaram no filtro** (supply chain, comex, gestão internacional).  
   - Enviar: título + trecho da notícia + prompt fixo com contexto OLV.  
   - Receber: texto da análise + (opcional) categoria sugerida.  
   - Gravar no post e publicar no blog.

Assim você tem **custo por análise** baixo (~0,15–0,5 centavo USD) e um **teto** tranquilo (ex.: 10 análises/dia ou US$ 2/mês), sem surpresa de “5, 10, 20, 30 reais” por dia.

---

## 5. Resumo direto

| Pergunta | Resposta |
|----------|----------|
| Custo médio **por análise** com Perplexity? | **~US$ 0,0015 (Sonar)** ou **~US$ 0,005 (Search)** por análise. Em reais: **~R$ 0,01 a R$ 0,03** por análise. |
| 3–5 análises por dia fica caro? | Não. Fica na faixa de **R$ 1–5/mês**, não R$ 5–30/dia. |
| Faz sentido plano mais suave? | Sim: **teto de análises/dia** (ex.: 10) e **só Sonar** = custo previsível e baixo (ex.: **R$ 2,50–8/mês**). |
| Vale usar Perplexity nesse cenário? | Sim: custo por análise é baixo e encaixa bem no fluxo “notícia → análise OLV → blog”. |

Se quiser, no próximo passo podemos desenhar o prompt exato (contexto OLV + supply chain + comex) e onde encaixar a chamada à API no seu pipeline (ex.: após puxar a notícia, antes de salvar no blog).
