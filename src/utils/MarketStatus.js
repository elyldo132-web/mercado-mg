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
export const fetchBinance24h = async (symbol) => {
  const r = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`, {
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`Binance HTTP ${r.status}`);
  const d = await r.json();
  return { price: parseFloat(d.lastPrice), change: parseFloat(d.priceChangePercent) };
};

export const fetchBTC24h = async () => {
  const d = await fetchBinance24h('BTCUSDT');
  return { price: d.price, changePct: d.change };
};

// USD/BRL via ExchangeRate-API — sem proxy/CORS, muito mais confiável que raspar o Yahoo.
// Não traz variação do dia (só a cotação atual), mas isso é o suficiente pro gráfico do Dólar.
export const fetchUsdBrl = async () => {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', { cache: 'no-store', signal: AbortSignal.timeout(8000) });
    const json = await res.json();
    if (json.result !== 'success' || !json.rates?.BRL) return null;
    return { price: json.rates.BRL };
  } catch {
    return null;
  }
};

// Proxies CORS tentados em sequência — se um estiver fora do ar, tenta o próximo antes de desistir.
const YAHOO_PROXIES = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  (url) => `https://thingproxy.freeboard.io/fetch/${url}`,
];

// Cotação genérica via Yahoo Finance (com proxy) — usada pra WIN, S&P, Nasdaq, DXY, VIX, USD/BRL etc.
export const fetchYahooQuote = async (symbol) => {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=5m`;
  for (const proxy of YAHOO_PROXIES) {
    try {
      const res  = await fetch(proxy(url), { signal: AbortSignal.timeout(5000) });
      if (!res.ok) continue;
      const json = await res.json();
      const r    = json?.chart?.result?.[0];
      if (!r) continue;
      const quotes  = r.indicators.quote[0].close.filter(v => v != null);
      if (!quotes.length) continue;
      const prev    = r.meta?.chartPreviousClose ?? quotes[0];
      const current = quotes[quotes.length - 1];
      const change  = ((current - prev) / prev) * 100;
      return { price: current, change: parseFloat(change.toFixed(2)) };
    } catch {
      // tenta o próximo proxy
    }
  }
  return null;
};

// Futuros do S&P 500 (ES=F) via Yahoo Finance — mantido por compatibilidade
export const fetchSPFutures = () => fetchYahooQuote('ES=F');

// Score de risco-on/off (cripto + internacional) — mesma escala usada na Diretriz do Dia
export const computeCryptoScore = (btcChangePct, spChangePct) =>
  Math.round((btcChangePct ?? 0) * 3 + (spChangePct ?? 0) * 6);

export const toCryptoDir = (score) => {
  if (score >=  25) return { key: 'FORTE_COMPRA', label: 'RISCO-ON FORTE', icon: '▲▲', color: '#00ff88', op: 'COMPRAR' };
  if (score >=  10) return { key: 'COMPRA',        label: 'RISCO-ON',       icon: '▲',  color: '#4ade80', op: 'COMPRAR' };
  if (score >= -9)  return { key: 'NEUTRO',        label: 'LATERAL',        icon: '⏸',  color: '#fbbf24', op: 'AGUARDAR' };
  if (score >= -24) return { key: 'VENDA',         label: 'RISCO-OFF',      icon: '▼',  color: '#f97316', op: 'VENDER' };
  return              { key: 'FORTE_VENDA',  label: 'RISCO-OFF FORTE', icon: '▼▼', color: '#ff3355', op: 'VENDER' };
};
