/**
 * OpportunityScan — Mercado MG
 * Varre cripto (CoinGecko), ações B3 (Brapi) e ações EUA (Yahoo Finance) em
 * busca de sinais de COMPRA/VENDA para alimentar "Setups para operar agora"
 * no Guia de Trade. Usa só dado real — se o conector caiu no fallback
 * simulado (checado via `source`), o lote inteiro é ignorado.
 */

import { fetchCryptoMarket, fetchBrazilianStocksBatch, fetchUSStocks } from '../data/connectors';

const CRYPTO_IDS = {
  BTC: 'bitcoin', ETH: 'ethereum', BNB: 'binancecoin', SOL: 'solana',
  XRP: 'ripple', ADA: 'cardano', DOGE: 'dogecoin', LINK: 'chainlink',
};
// Brapi só aceita até 3 tickers por consulta sem token de autenticação
const BR_TICKERS = ['PETR4', 'VALE3', 'ITUB4'];
const US_TICKERS = ['AAPL', 'MSFT', 'NVDA', 'TSLA', 'META', 'AMZN', 'GOOGL', 'AMD'];

const calcScore = (change, mult) => Math.min(100, Math.round(Math.abs(change) * mult));
const getSignal = (change, score) => (score < 8 ? 'NEUTRO' : change > 0 ? 'COMPRA' : 'VENDA');

export const scanRealOpportunities = async () => {
  const [cryptoRes, brRes, usRes] = await Promise.allSettled([
    fetchCryptoMarket(),
    fetchBrazilianStocksBatch(BR_TICKERS),
    fetchUSStocks(US_TICKERS),
  ]);

  const out = [];

  if (cryptoRes.status === 'fulfilled' && cryptoRes.value.source === 'CoinGecko') {
    const data = cryptoRes.value.data || {};
    for (const [ticker, id] of Object.entries(CRYPTO_IDS)) {
      const entry = data[id];
      if (!entry || typeof entry.usd_24h_change !== 'number') continue;
      const change = parseFloat(entry.usd_24h_change.toFixed(2));
      const score  = calcScore(change, 5);
      const signal = getSignal(change, score);
      if (signal === 'NEUTRO') continue;
      out.push({
        key: `${ticker}USDT`, label: ticker, icon: '🪙', group: 'cripto', cat: 'Cripto',
        price: entry.usd, change, score, signal,
      });
    }
  }

  if (brRes.status === 'fulfilled' && brRes.value.source === 'Brapi') {
    for (const s of brRes.value.stocks || []) {
      if (typeof s.change !== 'number' || !s.price) continue;
      const change = parseFloat(s.change.toFixed(2));
      const score  = calcScore(change, 14);
      const signal = getSignal(change, score);
      if (signal === 'NEUTRO') continue;
      out.push({
        key: s.ticker, label: s.ticker, icon: '📄', group: 'acoes', cat: 'B3',
        price: s.price, change, score, signal,
      });
    }
  }

  if (usRes.status === 'fulfilled' && usRes.value.source === 'Yahoo Finance') {
    for (const s of usRes.value.stocks || []) {
      if (typeof s.change !== 'number' || !s.price) continue;
      const change = parseFloat(s.change.toFixed(2));
      const score  = calcScore(change, 14);
      const signal = getSignal(change, score);
      if (signal === 'NEUTRO') continue;
      out.push({
        key: s.ticker, label: s.ticker, icon: '🌎', group: 'acoes-eua', cat: 'EUA',
        price: s.price, change, score, signal,
      });
    }
  }

  return out.sort((a, b) => b.score - a.score).slice(0, 6);
};
