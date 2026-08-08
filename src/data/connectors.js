const env = typeof process !== 'undefined' && process?.env ? process.env : (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {});
const USE_REAL_API = env.VITE_USE_REAL_API === 'true' || env.USE_REAL_API === 'true';

const fetchJson = async (url) => {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Falha ao buscar ${url}: ${response.status} ${response.statusText}`);
  }
  return response.json();
};

const safeCall = async (fn, fallback) => {
  if (!USE_REAL_API) return fallback();
  try {
    return await fn();
  } catch (err) {
    console.warn('Real API fallback:', err.message || err);
    return fallback();
  }
};

export const fetchExchangeRates = async () => {
  return safeCall(async () => {
    const json = await fetchJson('https://api.exchangerate.host/latest?base=USD&symbols=BRL,EUR,JPY');
    return {
      source: 'ExchangeRateHost',
      original: json,
      type: 'macro',
      metric: 'fx_usd',
      value: json.rates.BRL ?? null,
      values: json.rates,
      unit: 'BRL per USD',
      timestamp: json.date ? new Date(json.date).toISOString() : new Date().toISOString()
    };
  }, () => ({
    source: 'SimulatedFX',
    original: { series: 'USD/BRL', raw: 5.02 },
    type: 'macro',
    metric: 'fx_usd',
    value: 5.02,
    values: { BRL: 5.02, EUR: 0.94, JPY: 157.8 },
    unit: 'BRL per USD',
    timestamp: new Date().toISOString()
  }));
};

export const fetchBitcoinPrice = async () => {
  return safeCall(async () => {
    const json = await fetchJson('https://api.coindesk.com/v1/bpi/currentprice/USD.json');
    const price = json?.bpi?.USD?.rate_float ?? Number(json?.bpi?.USD?.rate?.replace(',', ''));
    return {
      source: 'CoinDesk',
      original: json,
      type: 'macro',
      metric: 'crypto_btc_usd',
      value: price,
      unit: 'USD',
      timestamp: json.time?.updatedISO ?? new Date().toISOString()
    };
  }, () => ({
    source: 'SimulatedBTC',
    original: { symbol: 'BTC', raw: 68245.12 },
    type: 'macro',
    metric: 'crypto_btc_usd',
    value: 68245.12,
    unit: 'USD',
    timestamp: new Date().toISOString()
  }));
};

export const fetchNewsAPI = async () => {
  return safeCall(async () => {
    const json = await fetchJson('https://api.allorigins.win/raw?url=https://www.reddit.com/r/economics/top.json?limit=10');
    const posts = json?.data?.children ?? [];
    if (!posts.length) throw new Error('Nenhuma notícia encontrada');
    const post = posts[Math.floor(Math.random() * posts.length)].data;
    const headline = `${post.title}${post.selftext ? ` — ${post.selftext}` : ''}`.trim();
    return {
      source: 'Reddit / r/economics',
      original: post,
      type: 'news',
      metric: 'headline',
      value: headline,
      unit: 'text',
      timestamp: new Date(post.created_utc * 1000).toISOString()
    };
  }, () => {
    const text = 'FED indica que inflação persistente nos EUA pode atrasar corte de juros para o final do ano.';
    return {
      source: 'SimulatedNews',
      original: { headline: text },
      type: 'news',
      metric: 'headline',
      value: text,
      unit: 'text',
      timestamp: new Date().toISOString()
    };
  });
};

export const fetchBrazilianStockPrice = async (ticker) => {
  return safeCall(async () => {
    const json = await fetchJson(`https://brapi.dev/api/quote/${ticker}`);
    if (!json?.results || json.results.length === 0) {
      throw new Error(`Ticker ${ticker} não encontrado`);
    }
    const stock = json.results[0];
    return {
      source: 'Brapi',
      original: stock,
      type: 'stock_br',
      ticker: ticker,
      price: stock.regularMarketPrice,
      change: stock.regularMarketChangePercent,
      changeDollar: stock.regularMarketChange,
      currency: 'BRL',
      name: stock.shortName || stock.longName,
      timestamp: new Date().toISOString()
    };
  }, () => {
    const mockStocks = {
      'PETR4': { price: 31.42, change: 1.8, name: 'Petrobras' },
      'VALE3': { price: 78.33, change: -0.6, name: 'Vale' },
      'ITUB4': { price: 27.12, change: 0.9, name: 'Itaú' },
      'MGLU3': { price: 5.80, change: 4.1, name: 'Magazine Luiza' },
      'BBDC4': { price: 15.45, change: 0.5, name: 'Bradesco' },
      'BBAS3': { price: 31.80, change: 1.2, name: 'Banco do Brasil' },
    };
    const mock = mockStocks[ticker] || { price: Math.random() * 100, change: Math.random() * 10 - 5, name: ticker };
    return {
      source: 'SimulatedBR',
      original: {},
      type: 'stock_br',
      ticker: ticker,
      price: mock.price,
      change: mock.change,
      changeDollar: (mock.price * mock.change) / 100,
      currency: 'BRL',
      name: mock.name,
      timestamp: new Date().toISOString()
    };
  });
};

// Brapi (tier anônimo) só permite 1 requisição por vez, com no máximo 3 tickers nela — pedidos
// extras (em lote ou em sequência rápida) voltam 401. Por isso cortamos pros 3 primeiros tickers
// e fazemos uma única chamada, em vez de arriscar o lote inteiro cair pro fallback simulado.
export const fetchBrazilianStocksBatch = async (tickers = ['PETR4', 'VALE3', 'ITUB4', 'MGLU3']) => {
  return safeCall(async () => {
    const tickerList = tickers.slice(0, 3).join(',');
    const json = await fetchJson(`https://brapi.dev/api/quote/${tickerList}`);
    const results = json?.results || [];
    if (results.length === 0) {
      throw new Error('Nenhuma ação encontrada');
    }
    return {
      source: 'Brapi',
      original: results,
      type: 'stock_br_batch',
      stocks: results.map((stock) => ({
        ticker: stock.symbol,
        price: stock.regularMarketPrice,
        change: stock.regularMarketChangePercent,
        changeDollar: stock.regularMarketChange,
        currency: 'BRL',
        name: stock.shortName || stock.longName,
        timestamp: new Date().toISOString()
      })),
      timestamp: new Date().toISOString()
    };
  }, () => {
    const mockStocks = {
      'PETR4': { price: 31.42, change: 1.8, name: 'Petrobras' },
      'VALE3': { price: 78.33, change: -0.6, name: 'Vale' },
      'ITUB4': { price: 27.12, change: 0.9, name: 'Itaú' },
      'MGLU3': { price: 5.80, change: 4.1, name: 'Magazine Luiza' },
      'BBDC4': { price: 15.45, change: 0.5, name: 'Bradesco' },
      'BBAS3': { price: 31.80, change: 1.2, name: 'Banco do Brasil' },
    };
    return {
      source: 'SimulatedBR',
      original: [],
      type: 'stock_br_batch',
      stocks: tickers.map((ticker) => {
        const mock = mockStocks[ticker] || { price: Math.random() * 100, change: Math.random() * 10 - 5, name: ticker };
        return {
          ticker: ticker,
          price: mock.price,
          change: mock.change,
          changeDollar: (mock.price * mock.change) / 100,
          currency: 'BRL',
          name: mock.name,
          timestamp: new Date().toISOString()
        };
      }),
      timestamp: new Date().toISOString()
    };
  });
};

export const fetchForexRates = async () => {
  return safeCall(async () => {
    const json = await fetchJson('https://open.er-api.com/v6/latest/USD');
    if (json.result !== 'success') throw new Error('API error');
    return {
      source: 'ExchangeRate-API',
      base: 'USD',
      rates: json.rates,
      timestamp: json.time_last_update_utc
    };
  }, () => ({
    source: 'Simulated',
    base: 'USD',
    rates: {
      EUR: 0.9234, GBP: 0.7891, JPY: 157.42, AUD: 1.5312, CAD: 1.3621,
      CHF: 0.8912, NZD: 1.6634, BRL: 5.0234, MXN: 17.52, ZAR: 18.72,
      TRY: 32.54, INR: 83.48, CNY: 7.251, HKD: 7.824, SGD: 1.352,
      NOK: 10.51, SEK: 10.82, DKK: 6.853, PLN: 3.971, CZK: 23.51,
      HUF: 358.4, CLP: 941.2, COP: 3912.0, PEN: 3.72, ARS: 874.5,
      SAR: 3.751, AED: 3.673, THB: 36.85, IDR: 15842.0, PHP: 57.82,
      MYR: 4.712, KRW: 1345.2, TWD: 32.41, VND: 24785.0, ILS: 3.72,
      RON: 4.57, BGN: 1.80, HRK: 6.99
    },
    timestamp: new Date().toISOString()
  }));
};

export const fetchCryptoMarket = async () => {
  const ids = 'bitcoin,ethereum,binancecoin,solana,ripple,cardano,dogecoin,avalanche-2,chainlink,polkadot,uniswap,litecoin,cosmos,fetch-ai,render-token,pepe,ondo-finance,near,tao,wif';
  return safeCall(async () => {
    const json = await fetchJson(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`
    );
    return { source: 'CoinGecko', data: json };
  }, () => ({
    source: 'Simulated',
    data: {
      bitcoin:         { usd: 67450,      usd_24h_change: 2.31,  usd_market_cap: 1320000000000 },
      ethereum:        { usd: 3521,        usd_24h_change: 1.84,  usd_market_cap: 423000000000 },
      binancecoin:     { usd: 598,         usd_24h_change: 0.92,  usd_market_cap: 88000000000 },
      solana:          { usd: 174.2,       usd_24h_change: 3.12,  usd_market_cap: 75000000000 },
      ripple:          { usd: 0.521,       usd_24h_change: -1.24, usd_market_cap: 29000000000 },
      cardano:         { usd: 0.452,       usd_24h_change: 1.56,  usd_market_cap: 16000000000 },
      dogecoin:        { usd: 0.162,       usd_24h_change: 4.21,  usd_market_cap: 23000000000 },
      'avalanche-2':   { usd: 37.8,        usd_24h_change: 2.34,  usd_market_cap: 15000000000 },
      chainlink:       { usd: 14.52,       usd_24h_change: 3.87,  usd_market_cap: 8000000000 },
      polkadot:        { usd: 7.12,        usd_24h_change: -0.54, usd_market_cap: 9000000000 },
      uniswap:         { usd: 9.87,        usd_24h_change: 1.23,  usd_market_cap: 5000000000 },
      litecoin:        { usd: 84.3,        usd_24h_change: 0.87,  usd_market_cap: 6000000000 },
      cosmos:          { usd: 9.24,        usd_24h_change: -1.84, usd_market_cap: 3600000000 },
      'fetch-ai':      { usd: 2.45,        usd_24h_change: 12.4,  usd_market_cap: 2100000000 },
      'render-token':  { usd: 10.12,       usd_24h_change: 5.24,  usd_market_cap: 3900000000 },
      pepe:            { usd: 0.0000084,   usd_24h_change: 24.5,  usd_market_cap: 3500000000 },
      'ondo-finance':  { usd: 0.78,        usd_24h_change: 8.12,  usd_market_cap: 1200000000 },
      near:            { usd: 7.45,        usd_24h_change: 5.67,  usd_market_cap: 8100000000 },
      tao:             { usd: 412.0,       usd_24h_change: 9.34,  usd_market_cap: 2800000000 },
      wif:             { usd: 2.87,        usd_24h_change: 14.2,  usd_market_cap: 2900000000 },
    }
  }));
};

const US_MOCK = {
  AAPL:  { name: 'Apple',           price: 227.52,   change:  1.23,  cap: 3420000000000 },
  MSFT:  { name: 'Microsoft',       price: 451.80,   change:  0.87,  cap: 3360000000000 },
  NVDA:  { name: 'NVIDIA',          price: 131.38,   change:  3.45,  cap: 3210000000000 },
  TSLA:  { name: 'Tesla',           price: 352.56,   change: -1.87,  cap: 1130000000000 },
  META:  { name: 'Meta',            price: 614.98,   change:  1.54,  cap: 1560000000000 },
  AMZN:  { name: 'Amazon',          price: 223.45,   change:  0.92,  cap: 2370000000000 },
  GOOGL: { name: 'Alphabet',        price: 193.62,   change:  0.67,  cap: 2380000000000 },
  NFLX:  { name: 'Netflix',         price: 978.34,   change:  2.31,  cap:  425000000000 },
  AMD:   { name: 'AMD',             price: 163.45,   change:  4.21,  cap:  266000000000 },
  INTC:  { name: 'Intel',           price:  21.87,   change: -2.34,  cap:   93000000000 },
  AVGO:  { name: 'Broadcom',        price: 1847.23,  change:  1.87,  cap:  866000000000 },
  COIN:  { name: 'Coinbase',        price: 287.45,   change:  6.78,  cap:   73000000000 },
  JPM:   { name: 'JP Morgan',       price: 264.32,   change:  0.45,  cap:  762000000000 },
  V:     { name: 'Visa',            price: 321.45,   change:  0.38,  cap:  668000000000 },
  MA:    { name: 'Mastercard',      price: 548.90,   change:  0.72,  cap:  513000000000 },
  BAC:   { name: 'Bank of America', price:  47.23,   change: -0.56,  cap:  364000000000 },
  UNH:   { name: 'UnitedHealth',    price: 312.87,   change: -1.23,  cap:  291000000000 },
  PFE:   { name: 'Pfizer',          price:  28.45,   change:  0.32,  cap:  161000000000 },
  ABBV:  { name: 'AbbVie',          price: 187.34,   change:  0.89,  cap:  331000000000 },
  WMT:   { name: 'Walmart',         price:  97.45,   change:  0.23,  cap:  784000000000 },
  HD:    { name: 'Home Depot',      price: 412.67,   change:  0.67,  cap:  409000000000 },
  MCD:   { name: "McDonald's",      price: 312.45,   change:  0.34,  cap:  221000000000 },
  XOM:   { name: 'ExxonMobil',      price: 112.87,   change:  1.23,  cap:  478000000000 },
  CVX:   { name: 'Chevron',         price: 158.23,   change:  0.87,  cap:  292000000000 },
  PYPL:  { name: 'PayPal',          price:  78.34,   change:  2.45,  cap:   78000000000 },
  UBER:  { name: 'Uber',            price:  87.23,   change:  3.12,  cap:  186000000000 },
  DIS:   { name: 'Disney',          price: 112.45,   change: -0.87,  cap:  206000000000 },
  ABNB:  { name: 'Airbnb',          price: 147.23,   change:  1.56,  cap:   94000000000 },
};

// Proxies tentados em sequência — mesma resiliência usada em MarketStatus.js
const US_STOCK_PROXIES = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  (url) => `https://thingproxy.freeboard.io/fetch/${url}`,
];

// v7/finance/quote passou a exigir autenticação (retorna "Unauthorized" mesmo via proxy) — usamos
// o mesmo endpoint v8/finance/chart (por símbolo) que já é confiável em MarketStatus.js.
const fetchOneUSStock = async (ticker) => {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=1d&interval=5m`;
  for (const proxy of US_STOCK_PROXIES) {
    try {
      const res = await fetch(proxy(url), { signal: AbortSignal.timeout(8000) });
      if (!res.ok) continue;
      const json = await res.json();
      const meta = json?.chart?.result?.[0]?.meta;
      if (!meta?.regularMarketPrice) continue;
      const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? meta.regularMarketPrice;
      const change = ((meta.regularMarketPrice - prevClose) / prevClose) * 100;
      return {
        ticker:    meta.symbol || ticker,
        name:      meta.longName || meta.shortName || ticker,
        price:     meta.regularMarketPrice,
        change:    parseFloat(change.toFixed(2)),
        volume:    meta.regularMarketVolume,
        high:      meta.regularMarketDayHigh,
        low:       meta.regularMarketDayLow,
        prevClose,
        w52High:   meta.fiftyTwoWeekHigh,
        w52Low:    meta.fiftyTwoWeekLow,
        exchange:  meta.fullExchangeName || meta.exchangeName || 'US',
        longName:  meta.longName,
      };
    } catch { /* tenta o próximo proxy */ }
  }
  return null;
};

export const fetchUSStocks = async (tickers = []) => {
  return safeCall(async () => {
    const results = await Promise.all(tickers.map(fetchOneUSStock));
    const stocks = results.filter(Boolean);
    if (stocks.length === 0) throw new Error('Sem dados do Yahoo Finance');
    return { source: 'Yahoo Finance', stocks };
  }, () => ({
    source: 'Simulated',
    stocks: tickers.map(t => {
      const m = US_MOCK[t] || { name: t, price: 100, change: 0, cap: 0 };
      const drift = (Math.random() * 2 - 1) * 0.8;
      return {
        ticker:    t,
        name:      m.name,
        price:     parseFloat((m.price * (1 + drift / 100)).toFixed(2)),
        change:    parseFloat((m.change + drift * 0.15).toFixed(2)),
        marketCap: m.cap,
        volume:    null,
        high:      null,
        low:       null,
        exchange:  'US',
      };
    })
  }));
};

export const listConnectors = () => ({ fetchExchangeRates, fetchBitcoinPrice, fetchNewsAPI, fetchForexRates, fetchCryptoMarket, fetchUSStocks });
