# Mercado MG

Mercado MG é uma plataforma de suporte à decisão para análise macroeconômica, correlação de ativos e direção de mercado em tempo real.

## Visão geral

O objetivo do projeto é oferecer um painel enxuto e inteligente para acompanhar:

- cenários macro e geopolíticos
- impacto em dólar e WIN
- sinais de criptomoedas e tecnologia
- regime de mercado e correlação de ativos
- uma pontuação de direção com confiança e drivers principais

## Recursos principais

- `Market Pulse` com direção de mercado e confiança
- `Macro Alert` interpretando notícias e gerando ações
- `Histórico de alertas` com resumo, direção e drivers
- `Regime de mercado` distinguindo `NORMAL`, `TRENDING` e `CORR_ANOMALY`
- `Simulador de yield` para projeção de investimento
- `Feed de notícias simulado` para demonstração de fluxo e testes

## Como executar

1. Instale as dependências:

```bash
npm install
```

2. Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

3. Abra o navegador em:

```bash
http://localhost:5173
```

4. Use a chave de acesso demo:

```text
MG-ALPHA-2026
```

## Como o motor de análise funciona

A análise está em `src/utils/MacroRules.js` e funciona assim:

- detecta temas macro e de impacto real
- classifica impactos em `dólar`, `WIN`, `crypto` e `setor`
- gera um score de direção de mercado
- apresenta confiança e drivers para cada alerta

## Estrutura do projeto

- `src/App.jsx` - autenticação e rota para painel principal
- `src/components/Dashboard.jsx` - tela principal
- `src/components/MarketPulse.jsx` - painel de direção e métricas
- `src/components/MacroAlert.jsx` - resumo e instruções de trade
- `src/utils/NewsFetcher.js` - feed de notícias simulado
- `src/utils/MacroRules.js` - lógica de análise macro

## Observações

Esta ferramenta é um suporte à decisão e não substitui análise de risco pessoal ou backtesting adicional em operações reais.

## O que foi aprimorado

- motor de análise com classificação de setor, direção de mercado e ação recomendada
- painel `Market Pulse` mais claro com confiança e drivers de risco
- histórico de alertas enriquecido com setor, timing e trade action
- metadata do app ajustada para `pt-BR` e tema de navegador
