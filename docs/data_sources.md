# Fontes de Dados — Mercado MG

Resumo das fontes recomendadas para análise macro e geopolítica.

- Oficiais / Econômicos:
  - Banco Central do Brasil (Copom, séries históricas): https://www.bcb.gov.br/
  - IBGE (PIB, IPCA, emprego): https://www.ibge.gov.br/
  - FRED (EUA — GDP, CPI, Unemployment): https://fred.stlouisfed.org/
  - OECD data / Eurostat: https://data.oecd.org/

- Renda fixa / yields / mercado de juros:
  - Tesouro Direto / Relatórios de títulos locais
  - US Treasury Data (Treasury.gov) e FRED

- Commodities & Energy:
  - EIA, OPEC, ICE, Bloomberg Commodities
  - APIs de preços (Yahoo Finance, Quandl, Investing)

- Dados de mercado e preços:
  - Yahoo Finance / Alpha Vantage / IEX Cloud (ações, FX, ETFs)
  - Binance / Coinbase (crypto spot/derivativos)

- Notícias e geopolítica:
  - Feeds de notícias: NewsAPI, GDELT, Event Registry, RSS de agências (Reuters, Bloomberg, Valor)
  - ACLED para eventos de conflito: https://acleddata.com/
  - Twitter/X e Mastodon para sinalização em tempo real (streaming, cuidado com rate limits)

- Alternativas de alto-frequência e alternativas:
  - Google Trends (tempo real por tópico)
  - Dados de mobilidade / cartões (quando disponíveis)
  - Dados de shipping / AIS (vessels) para riscos de commodities

Notas de integração:
- Priorize fontes com boa cobertura temporal e API/CSV export.
- Normalizar timestamps para UTC e armazenar uma versão raw + normalized.
- Versionar schemas (ex.: `schema_v1`) e registrar origem para auditoria.

Próximo passo: criar conectores simulados e um runner de ingestão para normalizar amostras.
