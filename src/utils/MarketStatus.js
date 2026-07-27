/**
 * MarketStatus — Mercado MG
 * Utilitários compartilhados para saber se a B3 está aberta e buscar o
 * momentum de cripto (BTC), usados para alternar as ferramentas para o
 * modo cripto/internacional quando a bolsa brasileira está fechada.
 */

// B3: segunda a sexta, 10:00–18:00 (horário de Brasília)
export const isB3Open = (date = new Date()) => {
  const brt = new Date(date.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  const dow = brt.getDay();
  if (dow === 0 || dow === 6) return false;
  const mins = brt.getHours() * 60 + brt.getMinutes();
  return mins >= 600 && mins < 1080;
};

// Ticker 24h da Binance — API pública, sem necessidade de proxy/CORS
export const fetchBTC24h = async () => {
  const r = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT', {
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`Binance HTTP ${r.status}`);
  const d = await r.json();
  return { price: parseFloat(d.lastPrice), changePct: parseFloat(d.priceChangePercent) };
};
