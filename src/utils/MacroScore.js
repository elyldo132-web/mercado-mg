/**
 * MacroScore — Mercado MG
 * Índice composto global (-100 a +100) combinando 9 indicadores reais,
 * cada um normalizado pela variação do dia e ponderado.
 *
 * Peso original (conforme spec do usuário, com Liquidez Global removida
 * por falta de fonte gratuita em tempo real — peso redistribuído
 * proporcionalmente pelos outros 9):
 *   DXY 20 · VIX 15 · Treasury 15 · S&P500 15 · Nasdaq 10 ·
 *   BTC 5 · ETH 2 · Ouro 2 · Petróleo 1   (soma original sem Liquidez: 85)
 */

import { fetchYahooQuote, fetchBinance24h } from './MarketStatus.js';

// weight: peso redistribuído (soma 100) · invert: true = alta do indicador pesa negativo no score
// scale: fator de normalização — quanto maior, mais sensível (indicador de baixa volatilidade diária)
const FACTORS = [
  { key: 'dxy',      label: 'DXY',           symbol: 'DX=F',    source: 'yahoo',   weight: 20 / 85 * 100, invert: true,  scale: 150 },
  { key: 'vix',      label: 'VIX',           symbol: '^VIX',    source: 'yahoo',   weight: 15 / 85 * 100, invert: true,  scale: 8   },
  { key: 'treasury', label: 'Treasury 10Y',  symbol: '^TNX',    source: 'yahoo',   weight: 15 / 85 * 100, invert: true,  scale: 35  },
  { key: 'sp500',    label: 'S&P 500',       symbol: 'ES=F',    source: 'yahoo',   weight: 15 / 85 * 100, invert: false, scale: 70  },
  { key: 'nasdaq',   label: 'Nasdaq',        symbol: 'NQ=F',    source: 'yahoo',   weight: 10 / 85 * 100, invert: false, scale: 60  },
  { key: 'btc',      label: 'Bitcoin',       symbol: 'BTCUSDT', source: 'binance', weight: 5  / 85 * 100, invert: false, scale: 25  },
  { key: 'eth',      label: 'Ethereum',      symbol: 'ETHUSDT', source: 'binance', weight: 2  / 85 * 100, invert: false, scale: 20  },
  { key: 'gold',     label: 'Ouro',          symbol: 'GC=F',    source: 'yahoo',   weight: 2  / 85 * 100, invert: true,  scale: 90  },
  { key: 'oil',      label: 'Petróleo',      symbol: 'CL=F',    source: 'yahoo',   weight: 1  / 85 * 100, invert: true,  scale: 35  },
];

// Normaliza a variação % do dia para -100..+100
const normalize = (changePct, scale, invert) => {
  const n = Math.max(-100, Math.min(100, changePct * scale));
  return invert ? -n : n;
};

export const computeMacroScore = async () => {
  const results = await Promise.allSettled(
    FACTORS.map(f => f.source === 'binance' ? fetchBinance24h(f.symbol) : fetchYahooQuote(f.symbol))
  );

  const factors = FACTORS.map((f, i) => {
    const r = results[i];
    const data = r.status === 'fulfilled' ? r.value : null;
    if (!data) return { ...f, raw: null, normalized: null, contribution: null };
    const normalized = normalize(data.change, f.scale, f.invert);
    return { ...f, raw: data, normalized, contribution: (normalized * f.weight) / 100 };
  });

  const available = factors.filter(f => f.normalized != null);
  if (available.length === 0) return { score: null, confidence: 0, factors };

  // Score ponderado só com os indicadores disponíveis (renormaliza o peso pra não penalizar por falha de API)
  const weightSum = available.reduce((s, f) => s + f.weight, 0);
  const score = Math.round(
    available.reduce((s, f) => s + f.normalized * f.weight, 0) / weightSum
  );
  const confidence = Math.round((available.length / FACTORS.length) * 100);

  return { score, confidence, factors };
};
