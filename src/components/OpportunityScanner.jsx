import React, { useState, useCallback, useEffect } from 'react';
import { fetchForexRates, fetchCryptoMarket, fetchBrazilianStocksBatch, fetchUSStocks } from '../data/connectors';

const CATEGORIES = [
  { id: 'TOP',         label: '⚡ TOP',    color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.35)' },
  { id: 'ALL',         label: '🌐 TUDO',   color: '#00bfff', bg: 'rgba(0,191,255,0.08)',   border: 'rgba(0,191,255,0.25)' },
  { id: 'FOREX',       label: '💱 FOREX',  color: '#06b6d4', bg: 'rgba(6,182,212,0.08)',   border: 'rgba(6,182,212,0.3)'  },
  { id: 'CRYPTO',      label: '₿ CRYPTO',  color: '#a855f7', bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.3)' },
  { id: 'B3',          label: '🇧🇷 B3',    color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.3)' },
  { id: 'EUA',         label: '🇺🇸 EUA',   color: '#ef4444', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.3)'  },
  { id: 'COMMODITIES', label: '🛢 COMOD',  color: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.3)' },
];

const FOREX_PAIRS = [
  { pair: 'EUR/USD', qKey: 'EUR', inv: true,  region: 'Majors',         vol: 0.45 },
  { pair: 'GBP/USD', qKey: 'GBP', inv: true,  region: 'Majors',         vol: 0.55 },
  { pair: 'USD/JPY', qKey: 'JPY', inv: false, region: 'Majors',         vol: 0.40 },
  { pair: 'AUD/USD', qKey: 'AUD', inv: true,  region: 'Majors',         vol: 0.60 },
  { pair: 'USD/CAD', qKey: 'CAD', inv: false, region: 'Majors',         vol: 0.50 },
  { pair: 'USD/CHF', qKey: 'CHF', inv: false, region: 'Majors',         vol: 0.38 },
  { pair: 'NZD/USD', qKey: 'NZD', inv: true,  region: 'Majors',         vol: 0.58 },
  { pair: 'EUR/JPY', qKey: null,  inv: false, region: 'Minors',         vol: 0.70, crossB: 'EUR', crossQ: 'JPY' },
  { pair: 'GBP/JPY', qKey: null,  inv: false, region: 'Minors',         vol: 0.90, crossB: 'GBP', crossQ: 'JPY' },
  { pair: 'AUD/JPY', qKey: null,  inv: false, region: 'Minors',         vol: 0.80, crossB: 'AUD', crossQ: 'JPY' },
  { pair: 'EUR/GBP', qKey: null,  inv: false, region: 'Minors',         vol: 0.30, crossB: 'EUR', crossQ: 'GBP' },
  { pair: 'EUR/BRL', qKey: null,  inv: false, region: 'Cross',          vol: 1.80, crossB: 'EUR', crossQ: 'BRL' },
  { pair: 'USD/BRL', qKey: 'BRL', inv: false, region: 'América Latina', vol: 1.50 },
  { pair: 'USD/MXN', qKey: 'MXN', inv: false, region: 'América Latina', vol: 1.00 },
  { pair: 'USD/CLP', qKey: 'CLP', inv: false, region: 'América Latina', vol: 1.50 },
  { pair: 'USD/COP', qKey: 'COP', inv: false, region: 'América Latina', vol: 1.80 },
  { pair: 'USD/PEN', qKey: 'PEN', inv: false, region: 'América Latina', vol: 0.70 },
  { pair: 'USD/ARS', qKey: 'ARS', inv: false, region: 'América Latina', vol: 5.00 },
  { pair: 'USD/ZAR', qKey: 'ZAR', inv: false, region: 'África',         vol: 1.30 },
  { pair: 'USD/TRY', qKey: 'TRY', inv: false, region: 'Oriente Médio',  vol: 2.50 },
  { pair: 'USD/INR', qKey: 'INR', inv: false, region: 'Ásia',           vol: 0.40 },
  { pair: 'USD/CNY', qKey: 'CNY', inv: false, region: 'Ásia',           vol: 0.20 },
  { pair: 'USD/KRW', qKey: 'KRW', inv: false, region: 'Ásia',           vol: 0.70 },
  { pair: 'USD/SGD', qKey: 'SGD', inv: false, region: 'Ásia',           vol: 0.30 },
  { pair: 'USD/HKD', qKey: 'HKD', inv: false, region: 'Ásia',           vol: 0.10 },
  { pair: 'USD/THB', qKey: 'THB', inv: false, region: 'Ásia',           vol: 0.50 },
  { pair: 'USD/IDR', qKey: 'IDR', inv: false, region: 'Ásia',           vol: 0.80 },
  { pair: 'USD/MYR', qKey: 'MYR', inv: false, region: 'Ásia',           vol: 0.50 },
  { pair: 'USD/NOK', qKey: 'NOK', inv: false, region: 'Escandinávia',   vol: 0.90 },
  { pair: 'USD/SEK', qKey: 'SEK', inv: false, region: 'Escandinávia',   vol: 0.80 },
  { pair: 'USD/PLN', qKey: 'PLN', inv: false, region: 'Europa',         vol: 1.20 },
  { pair: 'USD/HUF', qKey: 'HUF', inv: false, region: 'Europa',         vol: 1.10 },
];

const CRYPTO_ASSETS = [
  { ticker: 'BTC',  name: 'Bitcoin',      id: 'bitcoin',        vol: 8  },
  { ticker: 'ETH',  name: 'Ethereum',     id: 'ethereum',       vol: 10 },
  { ticker: 'BNB',  name: 'BNB',          id: 'binancecoin',    vol: 8  },
  { ticker: 'SOL',  name: 'Solana',       id: 'solana',         vol: 14 },
  { ticker: 'XRP',  name: 'Ripple',       id: 'ripple',         vol: 11 },
  { ticker: 'ADA',  name: 'Cardano',      id: 'cardano',        vol: 9  },
  { ticker: 'DOGE', name: 'Dogecoin',     id: 'dogecoin',       vol: 14 },
  { ticker: 'AVAX', name: 'Avalanche',    id: 'avalanche-2',    vol: 14 },
  { ticker: 'LINK', name: 'Chainlink',    id: 'chainlink',      vol: 11 },
  { ticker: 'DOT',  name: 'Polkadot',     id: 'polkadot',       vol: 9  },
  { ticker: 'NEAR', name: 'NEAR',         id: 'near',           vol: 13 },
  { ticker: 'TAO',  name: 'Bittensor',    id: 'tao',            vol: 16 },
  { ticker: 'FET',  name: 'Fetch.ai',     id: 'fetch-ai',       vol: 20 },
  { ticker: 'RNDR', name: 'Render',       id: 'render-token',   vol: 17 },
  { ticker: 'PEPE', name: 'Pepe',         id: 'pepe',           vol: 30 },
  { ticker: 'WIF',  name: 'dogwifhat',    id: 'wif',            vol: 22 },
  { ticker: 'ONDO', name: 'Ondo Finance', id: 'ondo-finance',   vol: 19 },
];

const US_STOCKS = [
  { ticker: 'AAPL',  name: 'Apple',           sector: 'Tech',       vol: 2.0 },
  { ticker: 'MSFT',  name: 'Microsoft',        sector: 'Tech',       vol: 1.8 },
  { ticker: 'NVDA',  name: 'NVIDIA',           sector: 'Chips',      vol: 4.5 },
  { ticker: 'TSLA',  name: 'Tesla',            sector: 'EV',         vol: 5.0 },
  { ticker: 'META',  name: 'Meta',             sector: 'Tech',       vol: 2.5 },
  { ticker: 'AMZN',  name: 'Amazon',           sector: 'Tech',       vol: 2.2 },
  { ticker: 'GOOGL', name: 'Alphabet',         sector: 'Tech',       vol: 2.0 },
  { ticker: 'NFLX',  name: 'Netflix',          sector: 'Mídia',      vol: 3.5 },
  { ticker: 'AMD',   name: 'AMD',              sector: 'Chips',      vol: 4.8 },
  { ticker: 'INTC',  name: 'Intel',            sector: 'Chips',      vol: 3.5 },
  { ticker: 'AVGO',  name: 'Broadcom',         sector: 'Chips',      vol: 2.8 },
  { ticker: 'COIN',  name: 'Coinbase',         sector: 'Crypto',     vol: 7.0 },
  { ticker: 'JPM',   name: 'JP Morgan',        sector: 'Finanças',   vol: 1.5 },
  { ticker: 'V',     name: 'Visa',             sector: 'Finanças',   vol: 1.2 },
  { ticker: 'MA',    name: 'Mastercard',       sector: 'Finanças',   vol: 1.3 },
  { ticker: 'BAC',   name: 'Bank of America',  sector: 'Finanças',   vol: 2.0 },
  { ticker: 'UNH',   name: 'UnitedHealth',     sector: 'Saúde',      vol: 2.0 },
  { ticker: 'PFE',   name: 'Pfizer',           sector: 'Saúde',      vol: 2.5 },
  { ticker: 'ABBV',  name: 'AbbVie',           sector: 'Saúde',      vol: 1.8 },
  { ticker: 'WMT',   name: 'Walmart',          sector: 'Varejo',     vol: 1.5 },
  { ticker: 'HD',    name: 'Home Depot',       sector: 'Varejo',     vol: 1.8 },
  { ticker: 'MCD',   name: "McDonald's",       sector: 'Varejo',     vol: 1.2 },
  { ticker: 'XOM',   name: 'ExxonMobil',       sector: 'Energia',    vol: 2.2 },
  { ticker: 'CVX',   name: 'Chevron',          sector: 'Energia',    vol: 2.0 },
  { ticker: 'PYPL',  name: 'PayPal',           sector: 'Fintech',    vol: 3.5 },
  { ticker: 'UBER',  name: 'Uber',             sector: 'Mobilidade', vol: 3.8 },
  { ticker: 'DIS',   name: 'Disney',           sector: 'Mídia',      vol: 2.5 },
  { ticker: 'ABNB',  name: 'Airbnb',           sector: 'Turismo',    vol: 3.0 },
];

const BR_TICKERS = ['PETR4','VALE3','ITUB4','BBDC4','BBAS3','MGLU3','WEGE3','RENT3','ABEV3','LREN3'];
const BR_NAMES = {
  PETR4:'Petrobras', VALE3:'Vale', ITUB4:'Itaú Unibanco', BBDC4:'Bradesco',
  BBAS3:'Banco do Brasil', MGLU3:'Magazine Luiza', WEGE3:'WEG',
  RENT3:'Localiza', ABEV3:'Ambev', LREN3:'Lojas Renner',
};

const COMMODITY_ASSETS = [
  { ticker: 'XAU',   name: 'Ouro',          pair: 'XAU/USD',   basePrice: 2345.6, vol: 0.8, tvSym: 'XAUUSD'     },
  { ticker: 'XAG',   name: 'Prata',         pair: 'XAG/USD',   basePrice: 31.42,  vol: 1.5, tvSym: 'XAGUSD'     },
  { ticker: 'WTI',   name: 'Petróleo WTI',  pair: 'WTI/USD',   basePrice: 78.34,  vol: 2.0, tvSym: 'USOIL'      },
  { ticker: 'BRENT', name: 'Petróleo Brent',pair: 'BRENT/USD', basePrice: 82.45,  vol: 2.0, tvSym: 'UKOIL'      },
  { ticker: 'NG',    name: 'Gás Natural',   pair: 'NG/USD',    basePrice: 2.87,   vol: 5.0, tvSym: 'NATURALGAS'  },
  { ticker: 'COPPER',name: 'Cobre',         pair: 'XCU/USD',   basePrice: 4.52,   vol: 1.5, tvSym: 'COPPER'     },
  { ticker: 'WHEAT', name: 'Trigo',         pair: 'WHEAT/USD', basePrice: 587.2,  vol: 2.5, tvSym: 'WHEAT'      },
  { ticker: 'SOYA',  name: 'Soja',          pair: 'SOYA/USD',  basePrice: 1189.4, vol: 2.5, tvSym: 'SOYBEAN'    },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
const simChange  = (vol) => parseFloat(((Math.random() * 2 - 1) * vol).toFixed(2));
const calcScore  = (change, cat) => {
  const abs  = Math.abs(change);
  const mult = { FOREX: 28, CRYPTO: 5, B3: 14, EUA: 14, COMMODITIES: 16 }[cat] || 10;
  return Math.min(100, Math.round(abs * mult));
};
const getSignal  = (change, score) => score < 8 ? 'NEUTRO' : change > 0 ? 'COMPRA' : 'VENDA';

const SIG = {
  COMPRA: { bg: 'rgba(0,255,120,0.12)', border: 'rgba(0,255,120,0.45)', text: '#00ff88', arrow: '▲' },
  VENDA:  { bg: 'rgba(255,51,85,0.12)',  border: 'rgba(255,51,85,0.45)',  text: '#ff3355', arrow: '▼' },
  NEUTRO: { bg: 'rgba(99,149,255,0.10)', border: 'rgba(99,149,255,0.35)', text: '#6395ff', arrow: '●' },
};

const fmtPrice = (p, cat) => {
  if (p === null || p === undefined) return '--';
  if ((cat === 'CRYPTO') && p < 0.001) return p.toFixed(8);
  if ((cat === 'CRYPTO') && p < 1)     return p.toFixed(4);
  if (p >= 10000) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (p >= 100)   return p.toFixed(2);
  return p.toFixed(4);
};

const fmtBig = (v) => {
  if (!v) return '--';
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9)  return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6)  return `$${(v / 1e6).toFixed(0)}M`;
  if (v >= 1e3)  return `${(v / 1e3).toFixed(0)}K`;
  return String(v);
};

const catColor = (cat) =>
  ({ FOREX:'#06b6d4', CRYPTO:'#a855f7', B3:'#10b981', EUA:'#ef4444', COMMODITIES:'#f97316' }[cat] || '#fff');

// ── External links ────────────────────────────────────────────────────────────
const getTVUrl = (asset) => {
  if (asset.cat === 'CRYPTO')      return `https://br.tradingview.com/symbols/${asset.id}USD/`;
  if (asset.cat === 'B3')          return `https://br.tradingview.com/symbols/BMFBOVESPA-${asset.id}/`;
  if (asset.cat === 'EUA')         return `https://br.tradingview.com/symbols/${asset.id}/`;
  if (asset.cat === 'COMMODITIES') {
    const ca = COMMODITY_ASSETS.find(c => c.ticker === asset.id);
    return `https://br.tradingview.com/symbols/${ca?.tvSym || asset.id}/`;
  }
  if (asset.cat === 'FOREX') {
    const [b, q] = asset.label.split('/');
    return `https://br.tradingview.com/symbols/FX_IDC-${b}${q}/`;
  }
  return 'https://br.tradingview.com/';
};

const getExternalLinks = (asset) => {
  const links = [{ label: '📊 TradingView', url: getTVUrl(asset), color: '#2962ff' }];

  if (asset.cat === 'CRYPTO') {
    const ca = CRYPTO_ASSETS.find(c => c.ticker === asset.id);
    if (ca) links.push({ label: '🦎 CoinGecko', url: `https://www.coingecko.com/en/coins/${ca.id}`, color: '#8ac249' });
    links.push({ label: '₿ Binance', url: `https://www.binance.com/en/trade/${asset.id}_USDT`, color: '#f0b90b' });
  }

  if (asset.cat === 'B3') {
    links.push({ label: '📈 Status Invest', url: `https://statusinvest.com.br/acoes/${asset.id.toLowerCase()}`, color: '#00c49a' });
    links.push({ label: '🔎 Brapi.dev', url: `https://brapi.dev/api/quote/${asset.id}`, color: '#7c3aed' });
  }

  if (asset.cat === 'EUA') {
    links.push({ label: '📰 Yahoo Finance', url: `https://finance.yahoo.com/quote/${asset.id}`, color: '#6001d2' });
    links.push({ label: '🔍 Seeking Alpha', url: `https://seekingalpha.com/symbol/${asset.id}`, color: '#ff6b35' });
    links.push({ label: '📋 Macrotrends', url: `https://www.macrotrends.net/assets/php/fundamental_iframe.php?t=${asset.id}`, color: '#e05c5c' });
  }

  if (asset.cat === 'FOREX') {
    const pair = asset.label.replace('/', '-').toLowerCase();
    links.push({ label: '💱 Investing.com', url: `https://br.investing.com/currencies/${pair}`, color: '#e05c5c' });
  }

  return links;
};

// ── Detail data fetcher ───────────────────────────────────────────────────────
const fetchAssetDetail = async (asset) => {
  if (asset.cat === 'CRYPTO') {
    const ca = CRYPTO_ASSETS.find(c => c.ticker === asset.id);
    if (!ca) return null;
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/${ca.id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`,
        { cache: 'no-store' }
      );
      if (!res.ok) throw new Error(res.statusText);
      const d  = await res.json();
      const md = d.market_data || {};
      return {
        price:     md.current_price?.usd,
        high24h:   md.high_24h?.usd,
        low24h:    md.low_24h?.usd,
        volume24h: md.total_volume?.usd,
        marketCap: md.market_cap?.usd,
        ath:       md.ath?.usd,
        athDate:   md.ath_date?.usd ? new Date(md.ath_date.usd).toLocaleDateString('pt-BR') : null,
        change24h: md.price_change_percentage_24h,
        change7d:  md.price_change_percentage_7d,
        change30d: md.price_change_percentage_30d,
        rank:      d.market_cap_rank,
        description: d.description?.en?.split('. ')[0]?.substring(0, 220) || '',
        source:    'CoinGecko (ao vivo)',
      };
    } catch {
      return { price: asset.price, change24h: asset.change, source: 'Simulado' };
    }
  }

  if (asset.cat === 'B3') {
    try {
      const res = await fetch(`https://brapi.dev/api/quote/${asset.id}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(res.statusText);
      const d = await res.json();
      const s = d.results?.[0];
      if (!s) throw new Error('sem dados');
      return {
        price:     s.regularMarketPrice,
        high24h:   s.regularMarketDayHigh,
        low24h:    s.regularMarketDayLow,
        volume24h: s.regularMarketVolume,
        open:      s.regularMarketOpen,
        prevClose: s.regularMarketPreviousClose,
        change24h: s.regularMarketChangePercent,
        w52High:   s.fiftyTwoWeekHigh,
        w52Low:    s.fiftyTwoWeekLow,
        longName:  s.longName || s.shortName,
        source:    'Brapi.dev (ao vivo)',
      };
    } catch {
      return { price: asset.price, change24h: asset.change, source: 'Simulado' };
    }
  }

  if (asset.cat === 'EUA') {
    try {
      const url = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${asset.id}&lang=en&region=US`;
      const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(res.statusText);
      const json = await res.json();
      const s = json?.quoteResponse?.result?.[0];
      if (!s) throw new Error('sem dados');
      return {
        price:     s.regularMarketPrice,
        high24h:   s.regularMarketDayHigh,
        low24h:    s.regularMarketDayLow,
        volume24h: s.regularMarketVolume,
        open:      s.regularMarketOpen,
        prevClose: s.regularMarketPreviousClose,
        change24h: s.regularMarketChangePercent,
        marketCap: s.marketCap,
        w52High:   s.fiftyTwoWeekHigh,
        w52Low:    s.fiftyTwoWeekLow,
        longName:  s.longName || s.shortName,
        exchange:  s.fullExchangeName,
        source:    'Yahoo Finance (ao vivo)',
      };
    } catch {
      return { price: asset.price, change24h: asset.change, source: 'Simulado' };
    }
  }

  // FOREX e COMMODITIES
  return {
    price:    asset.price,
    change24h: asset.change,
    source:   asset.cat === 'FOREX' ? 'ExchangeRate-API' : 'Mercado MG (simulado)',
  };
};

// ── Main Component ────────────────────────────────────────────────────────────
const OpportunityScanner = () => {
  const [category, setCategory]     = useState('TOP');
  const [assets, setAssets]         = useState([]);
  const [loading, setLoading]       = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [search, setSearch]         = useState('');
  const [sortBy, setSortBy]         = useState('score');
  const [selected, setSelected]     = useState(null);
  const [detail, setDetail]         = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // ── Build lists ───────────────────────────────────────────────────────────
  const buildForexList = (rates) => {
    const seen = new Set();
    return FOREX_PAIRS.filter(fp => {
      if (seen.has(fp.pair)) return false;
      seen.add(fp.pair);
      return true;
    }).map(fp => {
      let price;
      if (fp.crossB && fp.crossQ) price = (rates[fp.crossQ] || 1) / (rates[fp.crossB] || 1);
      else if (fp.inv)            price = 1 / (rates[fp.qKey] || 1);
      else                        price = rates[fp.qKey] || 0;
      const change = simChange(fp.vol);
      const score  = calcScore(change, 'FOREX');
      return { id: fp.pair, name: fp.pair, label: fp.pair, sub: fp.region,
               price, change, score, signal: getSignal(change, score), cat: 'FOREX' };
    });
  };

  const buildCryptoList = (data) => CRYPTO_ASSETS.map(ca => {
    const entry  = data[ca.id] || {};
    const price  = entry.usd ?? (ca.vol * 10 * Math.random());
    const change = typeof entry.usd_24h_change === 'number'
      ? parseFloat(entry.usd_24h_change.toFixed(2)) : simChange(ca.vol);
    const score  = calcScore(change, 'CRYPTO');
    return { id: ca.ticker, name: ca.name, label: `${ca.ticker}/USD`,
             sub: fmtBig(entry.usd_market_cap), price, change, score,
             signal: getSignal(change, score), cat: 'CRYPTO' };
  });

  const buildBRList = (stocks) => stocks.map(s => {
    const change = typeof s.change === 'number' ? parseFloat(s.change.toFixed(2)) : simChange(2.5);
    const score  = calcScore(change, 'B3');
    return { id: s.ticker, name: BR_NAMES[s.ticker] || s.ticker, label: s.ticker,
             sub: 'B3 • BRL', price: s.price, change, score,
             signal: getSignal(change, score), cat: 'B3' };
  });

  const buildUSList = (stocks) => stocks.map(s => {
    const usRef  = US_STOCKS.find(u => u.ticker === s.ticker);
    const change = typeof s.change === 'number' ? parseFloat(s.change.toFixed(2)) : simChange(usRef?.vol ?? 2.5);
    const score  = calcScore(change, 'EUA');
    const sector = usRef?.sector || 'US';
    return { id: s.ticker, name: s.name || usRef?.name || s.ticker,
             label: s.ticker, sub: `${sector} • ${s.exchange || 'US'}`,
             price: s.price, change, score,
             signal: getSignal(change, score), cat: 'EUA',
             marketCap: s.marketCap };
  });

  const buildCommodityList = () => COMMODITY_ASSETS.map(ca => {
    const change = simChange(ca.vol);
    const price  = ca.basePrice * (1 + change / 100);
    const score  = calcScore(change, 'COMMODITIES');
    return { id: ca.ticker, name: ca.name, label: ca.pair, sub: 'Commodity',
             price, change, score, signal: getSignal(change, score), cat: 'COMMODITIES' };
  });

  // ── Scan ──────────────────────────────────────────────────────────────────
  const scan = useCallback(async () => {
    setLoading(true);
    const usTickers = US_STOCKS.map(s => s.ticker);
    try {
      const [fxRes, cryptoRes, brRes, usRes] = await Promise.allSettled([
        fetchForexRates(),
        fetchCryptoMarket(),
        fetchBrazilianStocksBatch(BR_TICKERS),
        fetchUSStocks(usTickers),
      ]);
      const rates    = fxRes.status     === 'fulfilled' ? fxRes.value.rates    : {};
      const crypto   = cryptoRes.status === 'fulfilled' ? cryptoRes.value.data  : {};
      const brStocks = brRes.status     === 'fulfilled' ? brRes.value.stocks    : [];
      const usStocks = usRes.status     === 'fulfilled' ? usRes.value.stocks
        : US_STOCKS.map(s => ({ ticker: s.ticker, name: s.name, price: 100, change: simChange(s.vol) }));

      setAssets([
        ...buildForexList(rates),
        ...buildCryptoList(crypto),
        ...buildBRList(brStocks),
        ...buildUSList(usStocks),
        ...buildCommodityList(),
      ]);
      setLastUpdate(new Date().toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit', second:'2-digit' }));
    } catch (err) {
      console.error('Scan error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { scan(); const t = setInterval(scan, 60000); return () => clearInterval(t); }, [scan]);

  // ── Detail panel ──────────────────────────────────────────────────────────
  const openDetail = useCallback(async (asset) => {
    setSelected(asset);
    setDetail(null);
    setDetailLoading(true);
    const result = await fetchAssetDetail(asset);
    setDetail(result);
    setDetailLoading(false);
  }, []);
  const closeDetail = () => { setSelected(null); setDetail(null); };

  // ── Derived ───────────────────────────────────────────────────────────────
  const topOpps  = [...assets].sort((a, b) => b.score - a.score).slice(0, 6);
  const filtered = assets
    .filter(a => {
      if (category === 'TOP') return topOpps.some(t => t.id === a.id && t.cat === a.cat);
      if (category === 'ALL') return true;
      return a.cat === category;
    })
    .filter(a => !search || a.label.toLowerCase().includes(search.toLowerCase()) || a.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'score')  return b.score - a.score;
      if (sortBy === 'change') return Math.abs(b.change) - Math.abs(a.change);
      return a.label.localeCompare(b.label);
    });

  const catCounts = {
    FOREX: assets.filter(a => a.cat === 'FOREX').length,
    CRYPTO: assets.filter(a => a.cat === 'CRYPTO').length,
    B3: assets.filter(a => a.cat === 'B3').length,
    EUA: assets.filter(a => a.cat === 'EUA').length,
    COMMODITIES: assets.filter(a => a.cat === 'COMMODITIES').length,
  };

  return (
    <div className="opp-scanner">

      {/* ── DETAIL MODAL ──────────────────────────────────────────── */}
      {selected && (
        <div className="detail-overlay" onClick={closeDetail}>
          <div className="detail-modal" onClick={e => e.stopPropagation()}>

            <div className="detail-header" style={{ borderColor: catColor(selected.cat) + '44' }}>
              <div className="detail-title-group">
                <div className="detail-cat-dot" style={{ background: catColor(selected.cat), boxShadow: `0 0 12px ${catColor(selected.cat)}` }}></div>
                <div>
                  <div className="detail-label">{selected.label}</div>
                  <div className="detail-name">
                    {selected.name}
                    <span className="detail-cat-badge" style={{ color: catColor(selected.cat), borderColor: catColor(selected.cat)+'44', background: catColor(selected.cat)+'18' }}>
                      {selected.cat}
                    </span>
                  </div>
                </div>
              </div>
              <button className="detail-close" onClick={closeDetail}>✕</button>
            </div>

            {/* Price hero */}
            <div className="detail-price-hero">
              {detailLoading ? (
                <div className="detail-skeleton">
                  <div className="skel-bar wide"></div>
                  <div className="skel-bar narrow"></div>
                </div>
              ) : (
                <>
                  <div className="detail-price font-mono">
                    {selected.cat === 'B3' ? 'R$' : '$'}{fmtPrice(detail?.price ?? selected.price, selected.cat)}
                  </div>
                  <div className={`detail-change ${(detail?.change24h ?? selected.change) >= 0 ? 'pos' : 'neg'}`}>
                    {(detail?.change24h ?? selected.change) >= 0 ? '▲' : '▼'}
                    {' '}{Math.abs(detail?.change24h ?? selected.change).toFixed(2)}%
                    <span className="change-period">24h</span>
                  </div>
                </>
              )}
            </div>

            {/* Signal */}
            {(() => {
              const sig = SIG[selected.signal];
              return (
                <div className="detail-signal-bar" style={{ background: sig.bg, borderColor: sig.border, color: sig.text }}>
                  <span>{sig.arrow} {selected.signal}</span>
                  <span className="detail-score">Score: <strong>{selected.score}</strong>/100</span>
                </div>
              );
            })()}

            {/* Stats */}
            {!detailLoading && detail && (
              <div className="detail-stats">
                {detail.high24h   && <StatRow label="Máx. 24h"        val={`${selected.cat==='B3'?'R$':'$'}${fmtPrice(detail.high24h, selected.cat)}`}  color="#00ff88" />}
                {detail.low24h    && <StatRow label="Mín. 24h"        val={`${selected.cat==='B3'?'R$':'$'}${fmtPrice(detail.low24h,  selected.cat)}`}  color="#ff3355" />}
                {detail.open      && <StatRow label="Abertura"         val={`${selected.cat==='B3'?'R$':'$'}${parseFloat(detail.open).toFixed(2)}`} />}
                {detail.prevClose && <StatRow label="Fechamento ant."  val={`${selected.cat==='B3'?'R$':'$'}${parseFloat(detail.prevClose).toFixed(2)}`} />}
                {detail.volume24h && <StatRow label="Volume 24h"       val={fmtBig(detail.volume24h)} color="#fbbf24" />}
                {detail.marketCap && <StatRow label="Market Cap"       val={fmtBig(detail.marketCap)} />}
                {detail.ath       && <StatRow label="ATH"              val={`$${fmtPrice(detail.ath, selected.cat)}`} color="#a855f7" />}
                {detail.rank      && <StatRow label="Rank CoinGecko"   val={`#${detail.rank}`} color="#fbbf24" />}
                {detail.w52High   && <StatRow label="52 sem. Máx"      val={`${selected.cat==='B3'?'R$':'$'}${parseFloat(detail.w52High).toFixed(2)}`}  color="#00ff88" />}
                {detail.w52Low    && <StatRow label="52 sem. Mín"      val={`${selected.cat==='B3'?'R$':'$'}${parseFloat(detail.w52Low).toFixed(2)}`}   color="#ff3355" />}
                {detail.exchange  && <StatRow label="Bolsa"            val={detail.exchange} />}
                {detail.longName  && <StatRow label="Nome completo"    val={detail.longName} />}
                {detail.change7d  != null && <StatRow label="Var. 7 dias"  val={`${detail.change7d>=0?'+':''}${detail.change7d?.toFixed(2)}%`}  color={detail.change7d>=0?'#00ff88':'#ff3355'} />}
                {detail.change30d != null && <StatRow label="Var. 30 dias" val={`${detail.change30d>=0?'+':''}${detail.change30d?.toFixed(2)}%`} color={detail.change30d>=0?'#00ff88':'#ff3355'} />}
              </div>
            )}

            {detailLoading && (
              <div className="detail-stats">
                {[1,2,3,4].map(i => (
                  <div key={i} className="stat-row-skel">
                    <div className="skel-bar narrow"></div>
                    <div className="skel-bar wide"></div>
                  </div>
                ))}
              </div>
            )}

            {detail?.description && <div className="detail-desc">{detail.description}.</div>}

            {detail?.source && (
              <div className="detail-source">
                <span className="source-dot" style={{ background: detail.source.includes('vivo') ? '#00ff88' : '#fbbf24' }}></span>
                Fonte: {detail.source}
              </div>
            )}

            <div className="detail-links">
              <div className="links-label">Abrir em:</div>
              <div className="links-row">
                {getExternalLinks(selected).map(link => (
                  <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer"
                    className="ext-link-btn" style={{ '--link-color': link.color }}>
                    {link.label} ↗
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── HEADER ────────────────────────────────────────────────── */}
      <div className="opp-header">
        <div className="opp-title-row">
          <div className="opp-title-group">
            <span className="opp-icon">🔍</span>
            <div>
              <h2 className="opp-title">Buscador de Oportunidades</h2>
              <p className="opp-sub">Clique em qualquer ativo para detalhes • Forex · Crypto · B3 · 🇺🇸 EUA · Commodities</p>
            </div>
          </div>
          <div className="opp-controls">
            <div className="opp-search-box">
              <span>🔎</span>
              <input type="text" placeholder="Buscar ativo..." value={search}
                onChange={e => setSearch(e.target.value)} className="opp-search-input" />
            </div>
            <select className="opp-sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="score">Oportunidade</option>
              <option value="change">Variação</option>
              <option value="name">Nome</option>
            </select>
            <button className={`btn-scan ${loading ? 'loading' : ''}`} onClick={scan} disabled={loading}>
              {loading ? <><span className="spin">⟳</span> Varrendo...</> : <><span>⚡</span> BUSCAR</>}
            </button>
          </div>
        </div>

        <div className="opp-stats-bar">
          <div className="stat-item"><span className="stat-label">ATIVOS</span><span className="stat-value">{assets.length}</span></div>
          <div className="stat-item"><span className="stat-label">COMPRA</span><span className="stat-value buy-val">{assets.filter(a=>a.signal==='COMPRA').length}</span></div>
          <div className="stat-item"><span className="stat-label">VENDA</span><span className="stat-value sell-val">{assets.filter(a=>a.signal==='VENDA').length}</span></div>
          <div className="stat-item"><span className="stat-label">🇺🇸 US STOCKS</span><span className="stat-value" style={{color:'#ef4444'}}>{catCounts.EUA}</span></div>
          {lastUpdate && <div className="stat-item"><span className="stat-label">ATUALIZADO</span><span className="stat-value" style={{color:'#00bfff'}}>{lastUpdate}</span></div>}
        </div>
      </div>

      {/* ── FILTERS ───────────────────────────────────────────────── */}
      <div className="opp-filters">
        {CATEGORIES.map(cat => (
          <button key={cat.id}
            className={`opp-cat-btn ${category === cat.id ? 'active' : ''}`}
            style={category === cat.id ? {'--cat-color':cat.color,'--cat-bg':cat.bg,'--cat-border':cat.border} : {}}
            onClick={() => setCategory(cat.id)}>
            {cat.label}
            {catCounts[cat.id]
              ? <span className="cat-count">{catCounts[cat.id]}</span>
              : cat.id === 'TOP' ? <span className="cat-count">{topOpps.length}</span> : null}
          </button>
        ))}
      </div>

      {/* ── LOADING ───────────────────────────────────────────────── */}
      {loading && assets.length === 0 && (
        <div className="opp-loading">
          <div className="scan-animation"><div className="scan-bar"></div></div>
          <p>Varrendo mercados globais incluindo Wall Street...</p>
        </div>
      )}

      {/* ── GRID ──────────────────────────────────────────────────── */}
      {assets.length > 0 && (
        <div className="opp-grid">
          {filtered.map(asset => {
            const sig        = SIG[asset.signal];
            const isTop      = topOpps.some(t => t.id === asset.id && t.cat === asset.cat);
            const cc         = catColor(asset.cat);
            const isSelected = selected?.id === asset.id && selected?.cat === asset.cat;
            return (
              <div key={`${asset.cat}-${asset.id}`}
                className={`opp-card ${isTop && category !== 'TOP' ? 'is-top' : ''} ${isSelected ? 'is-selected' : ''}`}
                style={{ '--sig-bg': sig.bg, '--sig-border': sig.border, '--cat-color': cc }}
                onClick={() => openDetail(asset)}
                title={`Clique para ver detalhes de ${asset.label}`}>

                {isTop && <div className="top-badge">⚡ TOP</div>}

                <div className="card-header-row">
                  <div>
                    <div className="card-label">{asset.label}</div>
                    <div className="card-name">{asset.name}</div>
                  </div>
                  <div className="card-cat-badge" style={{ color:cc, borderColor:cc+'55', background:cc+'15' }}>
                    {asset.cat}
                  </div>
                </div>

                <div className="card-price-row">
                  <span className="card-price font-mono">
                    {asset.cat === 'B3' ? 'R$' : '$'}{fmtPrice(asset.price, asset.cat)}
                  </span>
                  <span className={`card-change ${asset.change >= 0 ? 'pos' : 'neg'}`}>
                    {asset.change >= 0 ? '+' : ''}{asset.change}%
                  </span>
                </div>

                {asset.sub && <div className="card-sub">{asset.sub}</div>}

                <div className="card-score-row">
                  <div className="score-bar-wrap">
                    <div className="score-bar" style={{
                      width: `${asset.score}%`,
                      background: asset.score >= 70 ? '#fbbf24' : asset.score >= 40 ? sig.text : '#374151'
                    }}></div>
                  </div>
                  <span className="score-label" style={{ color: asset.score >= 70 ? '#fbbf24' : sig.text }}>{asset.score}</span>
                </div>

                <div className="card-signal" style={{ background: sig.bg, border: `1px solid ${sig.border}`, color: sig.text }}>
                  <span>{sig.arrow}</span>
                  <span className="signal-text">{asset.signal}</span>
                  <span className="click-hint">DETALHES →</span>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && !loading && (
            <div className="no-results">
              <span style={{fontSize:'2rem'}}>🔍</span>
              <p>Nenhum ativo encontrado{search ? ` para "${search}"` : ''}.</p>
            </div>
          )}
        </div>
      )}

      {/* ── STYLES ────────────────────────────────────────────────── */}
      <style jsx="true">{`
        .opp-scanner {
          background: linear-gradient(135deg,rgba(10,12,20,.95),rgba(15,18,30,.95));
          border: 1px solid rgba(88,166,255,.12); border-radius: 16px;
          padding: 1.5rem; position: relative;
        }

        /* MODAL */
        .detail-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,.72);
          backdrop-filter: blur(7px); z-index: 500;
          display: flex; align-items: center; justify-content: center; padding: 1rem;
          animation: fadeOverlay .2s ease;
        }
        @keyframes fadeOverlay { from{opacity:0} to{opacity:1} }

        .detail-modal {
          background: linear-gradient(145deg,#0d1020,#111828);
          border-radius: 20px; border: 1px solid rgba(255,255,255,.1);
          width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto;
          padding: 1.5rem;
          box-shadow: 0 30px 80px rgba(0,0,0,.8), 0 0 60px rgba(124,58,237,.15);
          animation: slideModal .25s cubic-bezier(.34,1.56,.64,1);
        }
        @keyframes slideModal { from{transform:scale(.92) translateY(20px);opacity:0} to{transform:scale(1) translateY(0);opacity:1} }

        .detail-header { display:flex; align-items:flex-start; justify-content:space-between; padding-bottom:.9rem; border-bottom:1px solid; margin-bottom:.9rem; }
        .detail-title-group { display:flex; align-items:center; gap:.7rem; }
        .detail-cat-dot { width:11px; height:11px; border-radius:50%; flex-shrink:0; }
        .detail-label { font-size:1.15rem; font-weight:800; color:var(--text-primary); }
        .detail-name { font-size:.78rem; color:var(--text-muted); margin-top:2px; display:flex; align-items:center; gap:.4rem; }
        .detail-cat-badge { font-size:.52rem; font-weight:800; padding:1px 5px; border-radius:4px; border:1px solid; text-transform:uppercase; letter-spacing:.5px; }
        .detail-close { background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); color:var(--text-muted); width:28px; height:28px; border-radius:8px; cursor:pointer; font-size:.8rem; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all .2s; }
        .detail-close:hover { background:rgba(255,51,85,.15); color:#ff3355; border-color:rgba(255,51,85,.3); }

        .detail-price-hero { text-align:center; padding:.9rem 0 .7rem; }
        .detail-price { font-size:2.1rem; font-weight:800; color:var(--text-primary); line-height:1; margin-bottom:.4rem; }
        .detail-change { font-size:1.05rem; font-weight:800; display:flex; align-items:center; gap:.3rem; justify-content:center; }
        .detail-change.pos { color:#00ff88; text-shadow:0 0 12px rgba(0,255,136,.4); }
        .detail-change.neg { color:#ff3355; text-shadow:0 0 12px rgba(255,51,85,.4); }
        .change-period { font-size:.6rem; opacity:.7; font-weight:400; }

        .detail-signal-bar { display:flex; align-items:center; justify-content:space-between; padding:.5rem 1rem; border-radius:10px; border:1px solid; font-weight:800; font-size:.82rem; margin-bottom:.9rem; }
        .detail-score { font-size:.72rem; opacity:.85; }

        .detail-stats { display:flex; flex-direction:column; gap:0; margin-bottom:.75rem; border:1px solid rgba(255,255,255,.06); border-radius:12px; overflow:hidden; }

        .detail-desc { font-size:.73rem; color:var(--text-muted); line-height:1.55; padding:.55rem .75rem; background:rgba(255,255,255,.02); border-radius:8px; margin-bottom:.7rem; }

        .detail-source { display:flex; align-items:center; gap:.4rem; font-size:.62rem; color:var(--text-muted); margin-bottom:.9rem; }
        .source-dot { width:6px; height:6px; border-radius:50%; animation:blink 2s infinite; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.35} }

        .links-label { font-size:.62rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:.06em; margin-bottom:.5rem; }
        .links-row { display:flex; flex-wrap:wrap; gap:.45rem; }
        .ext-link-btn {
          padding:.38rem .75rem; border-radius:8px;
          border:1px solid color-mix(in srgb,var(--link-color) 35%,transparent);
          background:color-mix(in srgb,var(--link-color) 12%,transparent);
          color:var(--link-color); font-size:.7rem; font-weight:700;
          text-decoration:none; transition:all .2s; white-space:nowrap;
        }
        .ext-link-btn:hover { background:color-mix(in srgb,var(--link-color) 22%,transparent); box-shadow:0 0 14px color-mix(in srgb,var(--link-color) 35%,transparent); transform:translateY(-1px); }

        /* Skeleton */
        .detail-skeleton { display:flex; flex-direction:column; gap:.5rem; align-items:center; }
        .skel-bar { height:12px; border-radius:6px; background:linear-gradient(90deg,rgba(255,255,255,.04),rgba(255,255,255,.1),rgba(255,255,255,.04)); background-size:200% 100%; animation:shimmer 1.4s infinite; }
        .skel-bar.wide { width:60%; height:26px; border-radius:8px; }
        .skel-bar.narrow { width:35%; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        .stat-row-skel { display:flex; justify-content:space-between; align-items:center; padding:.5rem .75rem; border-bottom:1px solid rgba(255,255,255,.04); }
        .stat-row-skel .skel-bar { height:9px; }
        .stat-row-skel .narrow { width:80px; }
        .stat-row-skel .wide { width:100px; }

        /* HEADER */
        .opp-header { margin-bottom:1.25rem; }
        .opp-title-row { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; flex-wrap:wrap; margin-bottom:1rem; }
        .opp-title-group { display:flex; align-items:center; gap:.75rem; }
        .opp-icon { font-size:1.8rem; }
        .opp-title { font-size:1.3rem; font-weight:800; margin:0; background:linear-gradient(135deg,#00bfff,#a855f7); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .opp-sub { font-size:.7rem; color:var(--text-muted); margin:2px 0 0; }
        .opp-controls { display:flex; align-items:center; gap:.7rem; flex-wrap:wrap; }
        .opp-search-box { display:flex; align-items:center; gap:.4rem; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); border-radius:999px; padding:.35rem .7rem; }
        .opp-search-input { background:transparent; border:none; outline:none; color:var(--text-primary); font-size:.78rem; width:115px; }
        .opp-search-input::placeholder { color:var(--text-muted); }
        .opp-sort-select { background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); border-radius:8px; color:var(--text-secondary); font-size:.72rem; padding:.38rem .55rem; cursor:pointer; outline:none; }
        .btn-scan { display:flex; align-items:center; gap:.45rem; padding:.58rem 1rem; border:none; border-radius:10px; background:linear-gradient(135deg,#7c3aed,#2563eb,#0891b2); color:#fff; font-weight:800; font-size:.78rem; letter-spacing:.5px; cursor:pointer; transition:all .25s; box-shadow:0 0 18px rgba(124,58,237,.35); text-transform:uppercase; white-space:nowrap; }
        .btn-scan:hover:not(:disabled) { box-shadow:0 0 28px rgba(124,58,237,.6); transform:translateY(-2px); }
        .btn-scan:disabled { opacity:.7; cursor:not-allowed; }
        .btn-scan.loading { animation:scanPulse 1.5s infinite; }
        @keyframes scanPulse { 0%,100%{box-shadow:0 0 18px rgba(124,58,237,.35)} 50%{box-shadow:0 0 38px rgba(37,99,235,.65)} }
        .spin { display:inline-block; animation:spin 1s linear infinite; }
        @keyframes spin { to{transform:rotate(360deg)} }

        .opp-stats-bar { display:flex; gap:1.5rem; flex-wrap:wrap; padding:.65rem 1rem; background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.06); border-radius:10px; }
        .stat-item { display:flex; flex-direction:column; gap:1px; }
        .stat-label { font-size:.57rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:.08em; }
        .stat-value { font-size:1rem; font-weight:800; color:var(--text-primary); font-family:var(--font-mono); }
        .buy-val  { color:#00ff88; text-shadow:0 0 8px rgba(0,255,136,.35); }
        .sell-val { color:#ff3355; text-shadow:0 0 8px rgba(255,51,85,.35); }

        .opp-filters { display:flex; gap:.45rem; flex-wrap:wrap; margin-bottom:1.25rem; }
        .opp-cat-btn { padding:.42rem .9rem; border-radius:999px; border:1px solid rgba(255,255,255,.1); background:rgba(255,255,255,.04); color:var(--text-secondary); font-size:.73rem; font-weight:700; cursor:pointer; transition:all .2s; display:flex; align-items:center; gap:.38rem; white-space:nowrap; }
        .opp-cat-btn:hover { background:rgba(255,255,255,.09); color:var(--text-primary); transform:translateY(-1px); }
        .opp-cat-btn.active { background:var(--cat-bg); border-color:var(--cat-border); color:var(--cat-color); box-shadow:0 0 14px var(--cat-border); }
        .cat-count { background:rgba(255,255,255,.08); border-radius:999px; padding:0 5px; font-size:.6rem; font-weight:800; }

        .opp-loading { display:flex; flex-direction:column; align-items:center; gap:1rem; padding:3rem; color:var(--text-muted); }
        .scan-animation { width:200px; height:3px; background:rgba(255,255,255,.06); border-radius:999px; overflow:hidden; }
        .scan-bar { height:100%; width:40%; background:linear-gradient(90deg,transparent,#7c3aed,#2563eb,transparent); animation:scanMove 1.2s ease-in-out infinite; }
        @keyframes scanMove { 0%{transform:translateX(-100%)} 100%{transform:translateX(350%)} }

        .opp-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(162px,1fr)); gap:.68rem; }

        .opp-card { background:rgba(15,18,30,.85); border:1px solid rgba(255,255,255,.07); border-radius:10px; padding:.78rem; cursor:pointer; transition:all .22s cubic-bezier(.4,0,.2,1); position:relative; overflow:hidden; user-select:none; }
        .opp-card:hover { border-color:var(--cat-color,rgba(255,255,255,.25)); transform:translateY(-3px); box-shadow:0 8px 28px rgba(0,0,0,.35),0 0 18px color-mix(in srgb,var(--cat-color,#fff) 15%,transparent); }
        .opp-card:hover .click-hint { opacity:1; }
        .opp-card.is-top { border-color:rgba(251,191,36,.3); background:linear-gradient(135deg,rgba(251,191,36,.04),rgba(15,18,30,.9)); }
        .opp-card.is-selected { border-color:var(--cat-color,rgba(255,255,255,.4)) !important; box-shadow:0 0 0 2px var(--cat-color,rgba(255,255,255,.3)); }

        .top-badge { position:absolute; top:0; right:0; background:linear-gradient(135deg,#fbbf24,#f59e0b); color:#0a0c10; font-size:.5rem; font-weight:900; padding:2px 6px; border-radius:0 10px 0 6px; letter-spacing:.5px; }

        .card-header-row { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:.4rem; }
        .card-label { font-size:.83rem; font-weight:800; color:var(--text-primary); }
        .card-name  { font-size:.58rem; color:var(--text-muted); margin-top:1px; }
        .card-cat-badge { font-size:.49rem; font-weight:800; padding:1px 5px; border-radius:4px; border:1px solid; text-transform:uppercase; letter-spacing:.5px; white-space:nowrap; }

        .card-price-row { display:flex; align-items:baseline; justify-content:space-between; margin-bottom:.12rem; }
        .card-price  { font-size:.8rem; font-weight:600; color:var(--text-primary); }
        .card-change { font-size:.7rem; font-weight:800; }
        .card-change.pos { color:#00ff88; }
        .card-change.neg { color:#ff3355; }
        .card-sub { font-size:.56rem; color:var(--text-muted); margin-bottom:.4rem; }

        .card-score-row { display:flex; align-items:center; gap:.35rem; margin-bottom:.42rem; }
        .score-bar-wrap { flex:1; height:3px; background:rgba(255,255,255,.06); border-radius:999px; overflow:hidden; }
        .score-bar { height:100%; border-radius:999px; transition:width .5s ease; }
        .score-label { font-size:.62rem; font-weight:800; min-width:22px; text-align:right; font-family:var(--font-mono); }

        .card-signal { display:flex; align-items:center; justify-content:space-between; gap:.38rem; padding:.27rem .48rem; border-radius:6px; font-size:.62rem; font-weight:800; letter-spacing:.3px; }
        .signal-text { text-transform:uppercase; flex:1; text-align:center; }
        .click-hint { font-size:.5rem; opacity:0; transition:opacity .2s; white-space:nowrap; }

        .no-results { grid-column:1/-1; display:flex; flex-direction:column; align-items:center; gap:.5rem; padding:3rem; color:var(--text-muted); }

        @media (max-width:768px) {
          .opp-title-row { flex-direction:column; }
          .opp-controls { width:100%; }
          .detail-modal { max-width:100%; }
          .opp-grid { grid-template-columns:repeat(auto-fill,minmax(140px,1fr)); }
        }
      `}</style>
    </div>
  );
};

const StatRow = ({ label, val, color }) => (
  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'.4rem .75rem', borderBottom:'1px solid rgba(255,255,255,.04)' }}>
    <span style={{ fontSize:'.68rem', color:'var(--text-muted)' }}>{label}</span>
    <span style={{ fontSize:'.73rem', fontWeight:700, fontFamily:'var(--font-mono)', color: color || 'var(--text-primary)' }}>{val}</span>
  </div>
);

export default OpportunityScanner;
