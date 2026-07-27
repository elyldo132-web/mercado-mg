import React, { useState, useCallback, useEffect, useRef } from 'react';
import { isB3Open } from '../utils/MarketStatus';

// ── Assets ───────────────────────────────────────────────────────────────────

// ── Assets fixos (futuros) ────────────────────────────────────────────────────
const ASSETS = {
  WIN: { label: 'WIN Mini', symbol: '^BVSP',    ptVal: 0.20,  toDisp: (p) => Math.round(p),        fmtDisp: (n) => n.toLocaleString('pt-BR') + ' pts', source: 'yahoo', icon: '📊', group: 'futuros' },
  DOL: { label: 'DOL Mini', symbol: 'USDBRL=X', ptVal: 10.00, toDisp: (p) => Math.round(p * 1000), fmtDisp: (n) => n.toLocaleString('pt-BR') + ' pts', source: 'yahoo', icon: '💵', group: 'futuros' },
};

// ── Sugestões rápidas (chips) ────────────────────────────────────────────────
const STOCK_SUGGESTIONS = [
  { key: 'PETR4', icon: '🛢' }, { key: 'VALE3', icon: '⛏' }, { key: 'ITUB4', icon: '🏦' },
  { key: 'BBAS3', icon: '🏛' }, { key: 'WEGE3', icon: '⚙️' }, { key: 'MGLU3', icon: '🛒' },
  { key: 'ABEV3', icon: '🍺' }, { key: 'B3SA3', icon: '📈' },
];
const CRYPTO_SUGGESTIONS = [
  { key: 'BTCUSDT', label: 'BTC', icon: '₿' }, { key: 'ETHUSDT', label: 'ETH', icon: 'Ξ' },
  { key: 'SOLUSDT', label: 'SOL', icon: '◎' }, { key: 'BNBUSDT', label: 'BNB', icon: '🔶' },
  { key: 'XRPUSDT', label: 'XRP', icon: '💧' }, { key: 'DOGEUSDT', label: 'DOGE', icon: '🐕' },
];

// Gera asset dinâmico a partir de um ticker digitado
const makeAsset = (ticker) => {
  const up = ticker.toUpperCase().trim();
  if (ASSETS[up]) return { key: up, asset: ASSETS[up] };
  if (up.endsWith('USDT') || up.endsWith('BTC')) {
    const label = up.endsWith('USDT') ? up.slice(0, -4) : up.slice(0, -3);
    return { key: up, asset: {
      label, symbol: up, ptVal: 1.00,
      toDisp: (p) => Math.round(p*100)/100,
      fmtDisp: (n) => '$' + n.toLocaleString('en-US'),
      source: 'binance', icon: '🪙', group: 'cripto',
    }};
  }
  const sa = up.endsWith('.SA') ? up : up + '.SA';
  return { key: up, asset: {
    label: up, symbol: sa, ptVal: 1.00,
    toDisp: (p) => Math.round(p*100)/100,
    fmtDisp: (n) => 'R$ ' + n.toLocaleString('pt-BR'),
    source: 'yahoo', icon: '📄', group: 'acoes',
  }};
};

const TIMEFRAMES = [
  { label: '5m',  interval: '5m',  range: '5d',  name: 'Scalping' },
  { label: '15m', interval: '15m', range: '30d', name: 'Day Trade' },
  { label: '1H',  interval: '60m', range: '60d', name: 'Day Trade' },
  { label: '1D',  interval: '1d',  range: '1y',  name: 'Swing' },
];

// ── Math ─────────────────────────────────────────────────────────────────────

const sma = (arr, n) => {
  if (!arr || arr.length < n) return null;
  return arr.slice(-n).reduce((s, v) => s + v, 0) / n;
};

const emaFull = (arr, n) => {
  if (!arr || arr.length < n) return [];
  const k = 2 / (n + 1);
  const out = new Array(arr.length).fill(null);
  out[n - 1] = arr.slice(0, n).reduce((s, v) => s + v, 0) / n;
  for (let i = n; i < arr.length; i++) out[i] = arr[i] * k + out[i - 1] * (1 - k);
  return out;
};

const computeRSI = (closes, period = 14) => {
  if (!closes || closes.length < period * 2 + 1) return null;
  const s = closes.slice(-(period * 3 + 1));
  let ag = 0, al = 0;
  for (let i = 1; i <= period; i++) {
    const d = s[i] - s[i - 1];
    if (d > 0) ag += d; else al -= d;
  }
  ag /= period; al /= period;
  for (let i = period + 1; i < s.length; i++) {
    const d = s[i] - s[i - 1];
    ag = (ag * (period - 1) + (d > 0 ? d : 0)) / period;
    al = (al * (period - 1) + (d < 0 ? -d : 0)) / period;
  }
  return al === 0 ? 100 : 100 - 100 / (1 + ag / al);
};

const computeMACD = (closes) => {
  if (!closes || closes.length < 36) return { line: null, signal: null };
  const e12 = emaFull(closes, 12);
  const e26 = emaFull(closes, 26);
  const macdArr = e12.map((v, i) => (v != null && e26[i] != null) ? v - e26[i] : null).filter(v => v != null);
  const sigArr  = emaFull(macdArr, 9);
  return { line: macdArr[macdArr.length - 1], signal: sigArr[sigArr.length - 1] };
};

const computeATR = (bars, period = 14) => {
  if (!bars || bars.length < period + 1) return null;
  const trs = bars.slice(1).map((b, i) => Math.max(b.h - b.l, Math.abs(b.h - bars[i].c), Math.abs(b.l - bars[i].c)));
  return trs.slice(-period).reduce((s, v) => s + v, 0) / period;
};

// ── Fetch ─────────────────────────────────────────────────────────────────────

const PROXIES = [
  url => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  url => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  url => `https://thingproxy.freeboard.io/fetch/${url}`,
  url => url, // direto (funciona se o servidor permitir)
];

// ── Binance Fetch (público, sem CORS, sem proxy) ─────────────────────────────

const BINANCE_TF_MAP = { '5m': '5m', '15m': '15m', '60m': '1h', '1d': '1d' };
const BINANCE_LIMIT   = { '5m': 200, '15m': 200, '60m': 200, '1d': 365 };

const fetchBinanceBars = async (symbol, interval) => {
  const tf    = BINANCE_TF_MAP[interval] || '15m';
  const limit = BINANCE_LIMIT[interval]  || 200;
  const url   = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${tf}&limit=${limit}`;
  const r     = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(10000) });
  if (!r.ok) throw new Error(`Binance HTTP ${r.status}`);
  const data = await r.json();
  return data
    .map(k => ({ t: Math.floor(k[0] / 1000), c: parseFloat(k[4]), h: parseFloat(k[2]), l: parseFloat(k[3]), v: parseFloat(k[5]) }))
    .filter(b => b.c > 0 && b.h > 0 && b.l > 0);
};

// ── Yahoo Fetch ──────────────────────────────────────────────────────────────

const fetchYahooBars = async (symbol, interval, range) => {
  const yUrl = (host) =>
    `https://${host}/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includePrePost=false`;
  const hosts = ['query1.finance.yahoo.com', 'query2.finance.yahoo.com'];

  const parseJson = async (r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    const res = j?.chart?.result?.[0];
    if (!res) throw new Error('Sem dados');
    const q = res.indicators.quote[0];
    return res.timestamp
      .map((t, i) => ({ t, c: q.close[i], h: q.high[i], l: q.low[i], v: q.volume[i] }))
      .filter(b => b.c != null && b.h != null && b.l != null && b.v != null);
  };

  const errors = [];
  for (const host of hosts) {
    for (const proxy of PROXIES) {
      try {
        const r = await fetch(proxy(yUrl(host)), {
          cache: 'no-store',
          signal: AbortSignal.timeout(12000),
        });
        return await parseJson(r);
      } catch (e) {
        errors.push(e.message);
      }
    }
  }
  throw new Error(`Falha em todos os proxies: ${[...new Set(errors)].slice(0,3).join(' | ')}`);
};

const fetchBars = async (symbol, interval, range, source) => {
  if (source === 'binance') return fetchBinanceBars(symbol, interval);
  return fetchYahooBars(symbol, interval, range);
};

// ── Analysis ──────────────────────────────────────────────────────────────────

const analyze = (bars, assetKey) => {
  const asset = ASSETS[assetKey] || makeAsset(assetKey).asset;
  if (!bars || bars.length < 30) return null;

  const closes  = bars.map(b => b.c);
  const vols    = bars.map(b => b.v);
  const last    = bars[bars.length - 1];

  const ma9   = sma(closes, 9);
  const ma21  = sma(closes, 21);
  const ma200 = sma(closes, Math.min(200, closes.length));
  const rsi   = computeRSI(closes, 14);
  const macd  = computeMACD(closes);
  const atr   = computeATR(bars, 14);
  const volA  = sma(vols, 20);
  const volOk = volA != null && last.v > volA;
  const volRatio = volA ? (last.v / volA).toFixed(1) : null;

  const d = (v) => asset.toDisp(v);
  const f = (n) => n.toLocaleString('pt-BR');
  const raw = last.c;

  // ── Apply user's rules
  const C = {
    ma_trend:  ma9 != null && ma21 != null && ma9 > ma21,
    ma200:     ma200 != null && raw > ma200,
    rsi:       rsi != null && rsi >= 50 && rsi <= 70,
    macd:      macd.line != null && macd.line > 0,
    volume:    volOk,
  };
  const V = {
    ma_trend:  ma9 != null && ma21 != null && ma9 < ma21,
    ma200:     ma200 != null && raw < ma200,
    rsi:       rsi != null && rsi >= 30 && rsi <= 50,
    macd:      macd.line != null && macd.line < 0,
    volume:    volOk,
  };

  const cs = Object.values(C).filter(Boolean).length;
  const vs = Object.values(V).filter(Boolean).length;

  // Require volume + at least 4 total for trade signal
  let direction = 'SEM OPERAÇÃO';
  if (cs >= 4 && C.volume && vs < 3)      direction = 'COMPRA';
  else if (vs >= 4 && V.volume && cs < 3) direction = 'VENDA';

  const score = direction === 'COMPRA' ? cs : direction === 'VENDA' ? vs : Math.max(cs, vs);
  const prob  = direction === 'SEM OPERAÇÃO' ? 0 : score === 5 ? 88 : 74;

  // ── Setup via ATR
  let entry = null, stopL = null, t1 = null, t2 = null;
  let stopRisk = 0, t1Gain = 0, t2Gain = 0, rr1 = 0, rr2 = 0;
  if (direction !== 'SEM OPERAÇÃO' && atr != null) {
    const isC  = direction === 'COMPRA';
    const sgn  = isC ? 1 : -1;
    const ep   = raw;
    const sp   = ep - sgn * atr * 1.5;
    const tp1  = ep + sgn * atr * 2.0;
    const tp2  = ep + sgn * atr * 3.5;
    const dRaw = (v) => Math.abs(v - ep); // raw delta

    const toRisk = (deltaRaw) =>
      assetKey === 'DOL' ? Math.round(deltaRaw * 1000 * 10) : Math.round(deltaRaw * 0.20);

    stopRisk = toRisk(dRaw(sp));
    t1Gain   = toRisk(dRaw(tp1));
    t2Gain   = toRisk(dRaw(tp2));
    rr1      = (dRaw(tp1) / dRaw(sp)).toFixed(1);
    rr2      = (dRaw(tp2) / dRaw(sp)).toFixed(1);
    entry    = `${f(d(ep))} pts`;
    stopL    = `${f(d(sp))} pts  ·  risco R$ ${stopRisk.toLocaleString('pt-BR')}/mini`;
    t1       = `${f(d(tp1))} pts  ·  +R$ ${t1Gain.toLocaleString('pt-BR')}/mini  ·  R:R 1:${rr1}`;
    t2       = `${f(d(tp2))} pts  ·  +R$ ${t2Gain.toLocaleString('pt-BR')}/mini  ·  R:R 1:${rr2}`;
  }

  // ── Confluences (text)
  const activeMap = direction === 'COMPRA' ? C : V;
  const confs = [];
  if (activeMap.ma_trend) {
    const lbl = direction === 'COMPRA'
      ? `Média 9 (${f(d(ma9))}) acima da Média 21 (${f(d(ma21))}) — tendência de alta ▲`
      : `Média 9 (${f(d(ma9))}) abaixo da Média 21 (${f(d(ma21))}) — tendência de baixa ▼`;
    confs.push(lbl);
  }
  if (activeMap.ma200) {
    const lbl = direction === 'COMPRA'
      ? `Preço acima da MA200 (${f(d(ma200))}) — bull market confirmado`
      : `Preço abaixo da MA200 (${f(d(ma200))}) — bear market confirmado`;
    confs.push(lbl);
  }
  if (activeMap.rsi && rsi != null)
    confs.push(`RSI em ${rsi.toFixed(1)} — zona de ${direction === 'COMPRA' ? 'compra' : 'venda'} confirmada (${direction === 'COMPRA' ? '50–70' : '30–50'})`);
  if (activeMap.macd && macd.line != null)
    confs.push(`MACD ${direction === 'COMPRA' ? 'positivo' : 'negativo'} (${assetKey === 'DOL' ? (macd.line * 1000).toFixed(2) : Math.round(macd.line).toLocaleString('pt-BR')} pts) — momentum de ${direction === 'COMPRA' ? 'alta' : 'baixa'}`);
  if (activeMap.volume)
    confs.push(`Volume ${volRatio}× acima da média — ${direction === 'COMPRA' ? 'compradores' : 'vendedores'} no controle`);

  // Motivo SEM OPERAÇÃO
  let motivo = '';
  if (direction === 'SEM OPERAÇÃO') {
    const parts = [];
    if (!volOk)                                     parts.push('volume abaixo da média (sem liquidez)');
    if (rsi != null && (rsi > 70 || rsi < 30))      parts.push(`RSI em sobrecompra/sobrevenda (${rsi.toFixed(1)})`);
    if (Math.abs(cs - vs) <= 1)                     parts.push('indicadores divergentes entre compra e venda');
    if (cs < 4 && vs < 4)                           parts.push('confluência insuficiente — mercado lateral');
    motivo = parts.join(' · ');
  } else {
    motivo = score === 5
      ? `Todos os 5 indicadores confirmam ${direction}. Máxima confluência — entre no sinal com stop definido.`
      : `4 de 5 indicadores alinham para ${direction}. Boa confluência — opere com tamanho moderado.`;
  }

  return {
    direction, prob, score, confs, motivo,
    entry, stopL, t1, t2,
    ind: { ma9, ma21, ma200, rsi, macdLine: macd.line, volOk, volRatio, atr },
    signals: direction === 'COMPRA' ? C : direction === 'VENDA' ? V : null,
    raw, assetKey,
  };
};

// ── Component ─────────────────────────────────────────────────────────────────

const DIR_MAP = {
  'COMPRA':        { icon: '📈', label: 'COMPRA',       color: '#00ff88', bg: 'rgba(0,255,136,.08)',   border: 'rgba(0,255,136,.35)'  },
  'VENDA':         { icon: '📉', label: 'VENDA',        color: '#ff3355', bg: 'rgba(255,51,85,.08)',   border: 'rgba(255,51,85,.35)'  },
  'SEM OPERAÇÃO':  { icon: '⏸',  label: 'SEM OPERAÇÃO', color: '#fbbf24', bg: 'rgba(251,191,36,.07)', border: 'rgba(251,191,36,.3)'  },
};

const Row = ({ ok, label, val, detail }) => {
  const s = ok === true ? { i: '✅', c: '#00ff88', bg: 'rgba(0,255,136,.05)', bc: 'rgba(0,255,136,.15)' }
          : ok === false ? { i: '❌', c: '#ff3355', bg: 'rgba(255,51,85,.05)', bc: 'rgba(255,51,85,.15)' }
          : { i: '—', c: '#fbbf24', bg: 'rgba(251,191,36,.05)', bc: 'rgba(251,191,36,.15)' };
  return (
    <div className="tr-row" style={{ background: s.bg, borderColor: s.bc }}>
      <span className="tr-ic">{s.i}</span>
      <span className="tr-label">{label}</span>
      <span className="tr-val font-mono" style={{ color: s.c }}>{val}</span>
      {detail && <span className="tr-detail">{detail}</span>}
    </div>
  );
};

// ── Cálculo de ordem 3:1 ─────────────────────────────────────────────────────

// Parâmetros fixos de risco por ativo
const RISK_PARAMS = {
  // Futuros: stop/alvo fixo em pontos
  WIN:     { stopPts: 750,  alvoPts: 2500, risco: 150, ganho: 500,  ptVal: 0.20, rr: '1:3,3' },
  DOL:     { stopPts: 10,   alvoPts: 30,   risco: 100, ganho: 300,  ptVal: 10.00, rr: '1:3'  },
  // Cripto: stop/alvo em USD
  BTCUSDT: { stopPts: 500,  alvoPts: 1500, risco: 500, ganho: 1500, ptVal: 1.00, rr: '1:3'  },
  ETHUSDT: { stopPts: 25,   alvoPts: 75,   risco: 25,  ganho: 75,   ptVal: 1.00, rr: '1:3'  },
  SOLUSDT: { stopPts: 3,    alvoPts: 9,    risco: 3,   ganho: 9,    ptVal: 1.00, rr: '1:3'  },
  BNBUSDT: { stopPts: 8,    alvoPts: 24,   risco: 8,   ganho: 24,   ptVal: 1.00, rr: '1:3'  },
};

// Ações: stop/alvo calculado como % do preço (2% stop, 6% alvo = 1:3)
const STOCK_RISK_PCT = { stopPct: 0.02, alvoPct: 0.06, rr: '1:3' };

const calcOrdem = (res, saldo, contratosManual) => {
  if (!res || res.direction === 'SEM OPERAÇÃO') return null;

  const ep = res.raw;
  if (!ep || ep <= 0) return null;

  const asset  = ASSETS[res.assetKey] || makeAsset(res.assetKey).asset;
  const isC    = res.direction === 'COMPRA';
  const sgn    = isC ? 1 : -1;
  const isCrypto = asset.source === 'binance';
  const isStock  = asset.group === 'acoes';
  const params   = RISK_PARAMS[res.assetKey];
  const toDisp   = asset.toDisp;
  const fmt      = (n) => toDisp(n).toLocaleString('pt-BR');

  let stop, alvo, risco, ganho, rr, stopLabel, alvoLabel;

  if (isStock) {
    const stopDist = ep * STOCK_RISK_PCT.stopPct;
    const alvoDist = ep * STOCK_RISK_PCT.alvoPct;
    stop = ep - sgn * stopDist;
    alvo = ep + sgn * alvoDist;
    risco = Math.round(stopDist * 100) / 100;
    ganho = Math.round(alvoDist * 100) / 100;
    rr = STOCK_RISK_PCT.rr;
    stopLabel = `-${(STOCK_RISK_PCT.stopPct * 100).toFixed(0)}%`;
    alvoLabel = `+${(STOCK_RISK_PCT.alvoPct * 100).toFixed(0)}%`;
  } else if (params) {
    const stopRaw = res.assetKey === 'DOL' ? params.stopPts / 1000 : params.stopPts;
    const alvoRaw = res.assetKey === 'DOL' ? params.alvoPts / 1000 : params.alvoPts;
    stop = ep - sgn * stopRaw;
    alvo = ep + sgn * alvoRaw;
    risco = params.risco;
    ganho = params.ganho;
    rr = params.rr;
    stopLabel = isCrypto ? '$' + params.stopPts : params.stopPts + ' pts';
    alvoLabel = isCrypto ? '$' + params.alvoPts : params.alvoPts + ' pts';
  } else {
    return null;
  }

  const autoContratos = isStock
    ? Math.max(1, Math.floor(saldo / ep / 10) * 10 || 100)
    : isCrypto ? 1 : (saldo >= 2000 ? 2 : 1);
  const contratos = contratosManual > 0 ? contratosManual : autoContratos;

  const fmtVal = isCrypto
    ? (n) => '$' + n.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : isStock
      ? (n) => 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : (n) => fmt(n) + ' pts';

  const locale = isCrypto ? 'en-US' : 'pt-BR';
  const moeda  = isCrypto ? '$' : 'R$';
  const qtyLabel = isStock ? 'ações' : isCrypto ? 'unid.' : 'contrato(s)';

  return {
    entrada:    fmtVal(ep),
    stopPts:    fmtVal(stop),
    alvoPts:    fmtVal(alvo),
    contratos,
    autoContratos,
    isManual:   contratosManual > 0,
    riscoTotal: (risco * contratos).toLocaleString(locale, { maximumFractionDigits: 2 }),
    ganhoTotal: (ganho * contratos).toLocaleString(locale, { maximumFractionDigits: 2 }),
    riscoPorContrato: risco.toLocaleString(locale, { maximumFractionDigits: 2 }),
    ganhoPorContrato: ganho.toLocaleString(locale, { maximumFractionDigits: 2 }),
    moeda,
    qtyLabel,
    stopPtsLabel: stopLabel,
    alvoPtsLabel: alvoLabel,
    isCrypto,
    isStock,
    rr,
  };
};

// ── Component ─────────────────────────────────────────────────────────────────

const TechAnalysisBot = ({ onAssetChange, onResult }) => {
  const [assetKey, setAsset]    = useState(() => {
    const saved = localStorage.getItem('tab_asset');
    const b3Open = isB3Open();
    const savedIsCrypto = saved && (saved.endsWith('USDT') || saved.endsWith('BTC'));
    // B3 fechada e o ativo salvo é futuro/ação (preso ao horário da bolsa) → cai pro modo cripto 24h
    if (saved && (b3Open || savedIsCrypto)) return saved;
    return b3Open ? 'WIN' : 'BTCUSDT';
  });
  const [searchTicker, setSearchTicker] = useState('');
  const [openPanel, setOpenPanel] = useState(null); // 'acoes' | 'cripto' | null
  const [tf, setTf]             = useState(TIMEFRAMES[1]);
  const [res, setRes]         = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [ts, setTs]           = useState(null);
  const [saldo, setSaldo]         = useState(() => {
    const s = localStorage.getItem('tab_saldo');
    return s ? parseFloat(s) : 1000;
  });
  const [contratosManual, setContratosManual] = useState(0);
  const [showExec, setShowExec] = useState(false);
  const [toroToken,  setToroToken]  = useState(() => localStorage.getItem('toro_token') || '');
  const [showToken,  setShowToken]  = useState(false);
  const [enviando,   setEnviando]   = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [toroStatus, setToroStatus] = useState(null);
  const [autoMode,   setAutoMode]   = useState(() => localStorage.getItem('auto_mode') === '1');
  const [autoLog,    setAutoLog]    = useState([]);
  const autoIntervalRef = useRef(null);
  const lastAutoOpRef   = useRef(0);
  const opsTodayRef     = useRef({ date: '', count: 0 });
  const [dailyPnl, setDailyPnl] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('daily_pnl') || '{}');
      return saved.date === new Date().toISOString().slice(0, 10) ? saved : { date: new Date().toISOString().slice(0, 10), total: 0, ops: [] };
    } catch { return { date: new Date().toISOString().slice(0, 10), total: 0, ops: [] }; }
  });
  const [activePosition, setActivePosition] = useState(null); // { assetKey, direction, entry, stop, alvo, contratos, breakeven, partialDone }
  const positionMonitorRef = useRef(null);

  const AUTO_MIN_PROB    = 70;
  const AUTO_INTERVAL_MS = 5 * 60 * 1000;
  const AUTO_COOLDOWN_MS = 30 * 60 * 1000;
  const AUTO_MAX_OPS_DAY = 2;
  const DAILY_LOSS_LIMIT = 150;   // R$ — para de operar se perder isso no dia
  const BREAKEVEN_PCT    = 0.50;  // move stop p/ entrada quando atinge 50% do alvo
  const PARTIAL_TAKE_PCT = 0.50;  // realiza 50% do lucro no alvo

  const isMarketOpen = () => {
    const now = new Date();
    const brt = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const day = brt.getDay();
    if (day === 0 || day === 6) return false; // fim de semana
    const h = brt.getHours(), m = brt.getMinutes();
    const mins = h * 60 + m;
    return mins >= 9 * 60 && mins < 17 * 60 + 30;
  };

  const addAutoLog = (msg) => {
    const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    setAutoLog(prev => [`${time} ${msg}`, ...prev].slice(0, 20));
  };

  const updateDailyPnl = (valor, desc) => {
    setDailyPnl(prev => {
      const today = new Date().toISOString().slice(0, 10);
      const base = prev.date === today ? prev : { date: today, total: 0, ops: [] };
      const next = {
        date: today,
        total: Math.round((base.total + valor) * 100) / 100,
        ops: [...base.ops, { time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), valor, desc }].slice(-20),
      };
      localStorage.setItem('daily_pnl', JSON.stringify(next));
      return next;
    });
  };

  // Monitora posição ativa: breakeven + realização parcial
  const startPositionMonitor = useCallback((pos) => {
    clearInterval(positionMonitorRef.current);
    setActivePosition(pos);

    positionMonitorRef.current = setInterval(async () => {
      try {
        const ast = ASSETS[pos.assetKey] || makeAsset(pos.assetKey).asset;
        const bars = await fetchBars(ast.symbol, '5m', '1d', ast.source);
        if (!bars?.length) return;
        const price = bars[bars.length - 1].c;
        const isLong = pos.direction === 'COMPRA';
        const dist = isLong ? price - pos.entry : pos.entry - price;
        const totalDist = isLong ? pos.alvo - pos.entry : pos.entry - pos.alvo;

        // Stop atingido
        if ((isLong && price <= pos.stop) || (!isLong && price >= pos.stop)) {
          const loss = -pos.risco;
          addAutoLog(`🛑 STOP atingido ${pos.assetKey} → ${pos.moeda} ${loss}`);
          updateDailyPnl(loss, `Stop ${pos.assetKey}`);
          setActivePosition(null);
          clearInterval(positionMonitorRef.current);
          return;
        }

        // Alvo atingido
        if ((isLong && price >= pos.alvo) || (!isLong && price <= pos.alvo)) {
          const gain = pos.ganho;
          addAutoLog(`🎯 ALVO atingido ${pos.assetKey} → +${pos.moeda} ${gain}`);
          updateDailyPnl(gain, `Alvo ${pos.assetKey}`);
          setActivePosition(null);
          clearInterval(positionMonitorRef.current);
          return;
        }

        // Breakeven: 50% do caminho → move stop para entrada
        if (!pos.breakeven && dist >= totalDist * BREAKEVEN_PCT) {
          addAutoLog(`🔄 BREAKEVEN ativado ${pos.assetKey} — stop movido para entrada`);
          setActivePosition(prev => prev ? { ...prev, stop: prev.entry, breakeven: true } : null);
          pos.breakeven = true;
          pos.stop = pos.entry;
        }

        // Realização parcial: atingiu o alvo → guarda metade
        if (!pos.partialDone && dist >= totalDist * 0.9) {
          const partial = Math.round(pos.ganho * PARTIAL_TAKE_PCT * 100) / 100;
          addAutoLog(`💰 PARCIAL ${pos.assetKey} — guardando ${pos.moeda} ${partial} (${PARTIAL_TAKE_PCT * 100}%)`);
          updateDailyPnl(partial, `Parcial ${pos.assetKey}`);
          pos.partialDone = true;
          setActivePosition(prev => prev ? { ...prev, partialDone: true } : null);
        }

      } catch { /* silently retry next cycle */ }
    }, 30000); // verifica a cada 30s
  }, []);

  // Cleanup monitor on unmount
  useEffect(() => () => clearInterval(positionMonitorRef.current), []);

  // Lê config da corretora do localStorage
  const getBrokerCfg = () => {
    try { return JSON.parse(localStorage.getItem('broker_config') || '{}'); } catch { return {}; }
  };

  const sendOrder = async (result, ord) => {
    const cfg = getBrokerCfg();
    const ast = ASSETS[result.assetKey] || makeAsset(result.assetKey).asset;
    const isCrypto = ast.source === 'binance';
    const side = result.direction === 'COMPRA' ? 'BUY' : 'SELL';

    // Binance (cripto)
    if (isCrypto && cfg.binance?.apiKey) {
      const r = await fetch('https://api.binance.com/api/v3/order', {
        method: 'POST',
        headers: { 'X-MBX-APIKEY': cfg.binance.apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: ast.symbol, side, type: 'MARKET', quantity: ord.contratos }),
        signal: AbortSignal.timeout(10000),
      });
      return { ok: r.ok, status: r.status, broker: 'Binance' };
    }

    // Profit Pro (local)
    if (cfg.profit?.port) {
      const port = cfg.profit.port || '51777';
      try {
        const r = await fetch(`http://localhost:${port}/api/order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': cfg.profit.apiKey || '' },
          body: JSON.stringify({ symbol: result.assetKey, side, quantity: ord.contratos, type: 'MARKET' }),
          signal: AbortSignal.timeout(5000),
        });
        return { ok: r.ok, status: r.status, broker: 'Profit Pro' };
      } catch { /* Profit não está rodando, tenta próximo */ }
    }

    // XP
    if (cfg.xp?.apiKey) {
      const r = await fetch('https://api.xpi.com.br/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cfg.xp.apiKey}` },
        body: JSON.stringify({ symbol: result.assetKey, side, quantity: ord.contratos, orderType: 'MARKET' }),
        signal: AbortSignal.timeout(10000),
      });
      return { ok: r.ok, status: r.status, broker: 'XP' };
    }

    // Toro (fallback — usa token do config ou do campo local)
    const toroTk = cfg.toro?.token || toroToken;
    if (!toroTk?.trim()) return { ok: false, status: 0, broker: 'nenhuma', noToken: true };
    const symbol = result.assetKey === 'WIN' ? 'WINM25' : result.assetKey === 'DOL' ? 'DOLM25' : result.assetKey;
    const r = await fetch('https://api.toro.com.br/v1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${toroTk}` },
      body: JSON.stringify({ symbol, side, quantity: ord.contratos, orderType: 'MARKET' }),
      signal: AbortSignal.timeout(10000),
    });
    return { ok: r.ok, status: r.status, broker: 'Toro' };
  };

  const autoExecute = useCallback(async (result) => {
    const ord = calcOrdem(result, saldo, contratosManual);
    if (!ord) return;

    try {
      const resp = await sendOrder(result, ord);
      if (resp.noToken) {
        addAutoLog('⚠️ Configure uma corretora na aba ⚙️ Corretoras');
        return;
      }
      const msg = resp.ok
        ? `✅ AUTO ${result.direction} ${result.assetKey} x${ord.contratos} via ${resp.broker}`
        : `⚠️ AUTO erro ${resp.status} (${resp.broker})`;
      addAutoLog(msg);
      if (Notification.permission === 'granted') {
        new Notification('Mercado MG — Ordem Automática', {
          body: `${result.direction} ${result.assetKey} × ${ord.contratos} via ${resp.broker}`,
          icon: '/favicon.svg',
        });
      }
      // Inicia monitor da posição (breakeven + parcial + stop)
      const params = RISK_PARAMS[result.assetKey];
      const isCrypto = (ASSETS[result.assetKey] || makeAsset(result.assetKey).asset).source === 'binance';
      const moeda = isCrypto ? '$' : 'R$';
      startPositionMonitor({
        assetKey: result.assetKey, direction: result.direction,
        entry: result.raw,
        stop: parseFloat(ord.stopPts) || result.raw - (result.direction === 'COMPRA' ? 1 : -1) * (params?.stopPts || result.raw * 0.02),
        alvo: parseFloat(ord.alvoPts) || result.raw + (result.direction === 'COMPRA' ? 1 : -1) * (params?.alvoPts || result.raw * 0.06),
        contratos: ord.contratos,
        risco: params ? params.risco * ord.contratos : result.raw * 0.02 * ord.contratos,
        ganho: params ? params.ganho * ord.contratos : result.raw * 0.06 * ord.contratos,
        moeda, breakeven: false, partialDone: false,
      });
    } catch {
      addAutoLog(`⚠️ AUTO CORS — copie a ordem manualmente`);
    }
  }, [saldo, contratosManual, toroToken, startPositionMonitor]);

  // Pede permissão de notificação quando auto mode liga
  const toggleAutoMode = () => {
    const next = !autoMode;
    setAutoMode(next);
    localStorage.setItem('auto_mode', next ? '1' : '0');
    if (next && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    addAutoLog(next ? '🟢 Modo automático LIGADO' : '🔴 Modo automático DESLIGADO');
  };

  // Resolve asset atual (fixo ou dinâmico)
  const resolvedAsset = ASSETS[assetKey] || makeAsset(assetKey).asset;

  // Avisa o Dashboard sobre o ativo pesquisado, para os outros painéis acompanharem
  useEffect(() => {
    onAssetChange?.({ key: assetKey, label: resolvedAsset.label, icon: resolvedAsset.icon, group: resolvedAsset.group });
  }, [assetKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Avisa o Dashboard sobre o resultado da análise (COMPRA/VENDA/setup) do ativo atual
  useEffect(() => {
    onResult?.(res);
  }, [res]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectTicker = (key) => { setAsset(key); setRes(null); setSearchTicker(''); localStorage.setItem('tab_asset', key); };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const t = searchTicker.trim().toUpperCase();
    if (t) selectTicker(t);
  };

  const run = useCallback(async () => {
    const ast = ASSETS[assetKey] || makeAsset(assetKey).asset;
    setLoading(true); setError(null);
    try {
      const bars = await fetchBars(ast.symbol, tf.interval, tf.range, ast.source);
      const r    = analyze(bars, assetKey);
      if (!r) throw new Error('Dados insuficientes — tente 1H ou 1D');
      setRes(r);
      setTs(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      return r;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [assetKey, tf]);

  // ── Loop automático ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!autoMode) {
      clearInterval(autoIntervalRef.current);
      return;
    }

    const tick = async () => {
      if (!isMarketOpen()) {
        addAutoLog('⏸ Mercado fechado — aguardando abertura');
        return;
      }

      // Limite diário
      const today = new Date().toISOString().slice(0, 10);
      if (opsTodayRef.current.date !== today) opsTodayRef.current = { date: today, count: 0 };
      if (opsTodayRef.current.count >= AUTO_MAX_OPS_DAY) {
        addAutoLog(`🚫 Limite de ${AUTO_MAX_OPS_DAY} ops/dia atingido`);
        return;
      }

      // Stop diário: perda máxima
      if (dailyPnl.date === today && dailyPnl.total <= -DAILY_LOSS_LIMIT) {
        addAutoLog(`🚫 STOP DIÁRIO — perda de R$ ${Math.abs(dailyPnl.total)} atingiu limite de R$ ${DAILY_LOSS_LIMIT}`);
        return;
      }

      // Posição ativa: não abrir outra
      if (activePosition) {
        addAutoLog('📊 Posição ativa em andamento — aguardando saída');
        return;
      }

      // Cooldown entre operações
      if (Date.now() - lastAutoOpRef.current < AUTO_COOLDOWN_MS) {
        const minLeft = Math.ceil((AUTO_COOLDOWN_MS - (Date.now() - lastAutoOpRef.current)) / 60000);
        addAutoLog(`⏳ Cooldown — próxima verificação em ${minLeft} min`);
        return;
      }

      // Varre múltiplos ativos e escolhe o melhor sinal
      const scanList = [
        { key: 'WIN', ast: ASSETS.WIN },
        { key: 'DOL', ast: ASSETS.DOL },
        { key: 'BTCUSDT', ast: makeAsset('BTCUSDT').asset },
        { key: 'ETHUSDT', ast: makeAsset('ETHUSDT').asset },
      ];

      addAutoLog(`🔍 Varrendo ${scanList.length} ativos...`);
      const signals = [];

      for (const { key, ast } of scanList) {
        try {
          const bars = await fetchBars(ast.symbol, tf.interval, tf.range, ast.source);
          const r = analyze(bars, key);
          if (r && r.direction !== 'SEM OPERAÇÃO' && r.prob >= AUTO_MIN_PROB) {
            signals.push(r);
            addAutoLog(`📡 ${key}: ${r.direction} ${r.prob}%`);
          }
        } catch { /* ativo indisponível, pula */ }
      }

      if (signals.length === 0) {
        addAutoLog('📊 Nenhum sinal forte — aguardando próximo ciclo');
        return;
      }

      // Escolhe o sinal com maior probabilidade
      const best = signals.sort((a, b) => b.prob - a.prob)[0];
      setAsset(best.assetKey);
      setRes(best);
      setTs(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

      addAutoLog(`🚀 Melhor: ${best.assetKey} ${best.direction} ${best.prob}% — executando...`);
      lastAutoOpRef.current = Date.now();
      opsTodayRef.current.count += 1;
      await autoExecute(best);
    };

    tick(); // executa imediatamente ao ligar
    autoIntervalRef.current = setInterval(tick, AUTO_INTERVAL_MS);
    return () => clearInterval(autoIntervalRef.current);
  }, [autoMode, assetKey, tf, toroToken, saldo, contratosManual, run, autoExecute]);

  const dc    = res ? DIR_MAP[res.direction] : null;
  const ind   = res?.ind;
  const ordem = calcOrdem(res, saldo, contratosManual);

  const enviarOrdemManual = async () => {
    if (!ordem || !res) return;
    setEnviando(true);
    setToroStatus(null);

    try {
      const resp = await sendOrder(res, ordem);
      if (resp.noToken) {
        setToroStatus({ ok: null, msg: '⚠️ Configure uma corretora na aba ⚙️ Corretoras' });
      } else if (resp.ok) {
        setToroStatus({ ok: true, msg: `✅ Ordem enviada via ${resp.broker}!` });
      } else {
        setToroStatus({ ok: false, msg: `❌ Erro ${resp.status} (${resp.broker})` });
      }
    } catch (e) {
      // CORS ou rede — mostra dados para copiar manualmente
      const copiado = `${res.direction} ${ordem.contratos}x ${symbol}\nEntrada: ${ordem.entrada}\nStop: ${ordem.stopPts}\nAlvo: ${ordem.alvoPts}\nRisco: R$${ordem.riscoTotal}`;
      try { await navigator.clipboard.writeText(copiado); } catch {}
      setToroStatus({
        ok: null,
        msg: `⚠️ CORS bloqueou acesso direto ao api.toro.com.br — os dados foram copiados para o clipboard. Cole no app da Toro ou solicite à corretora o acesso API com permissão CORS.`,
      });
    } finally {
      setEnviando(false);
    }
  };

  const cancelarOrdem = async () => {
    setCancelando(true);
    setToroStatus(null);
    const cfg = getBrokerCfg();
    const tk = cfg.toro?.token || toroToken;
    if (!tk?.trim()) {
      setToroStatus({ ok: null, msg: '⚠️ Configure uma corretora na aba ⚙️ Corretoras' });
      setCancelando(false);
      return;
    }
    try {
      const r = await fetch('https://api.toro.com.br/v1/orders/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tk}` },
        body: JSON.stringify({ symbol: res?.assetKey === 'WIN' ? 'WINM25' : 'DOLM25' }),
        signal: AbortSignal.timeout(10000),
      });
      setToroStatus(r.ok ? { ok: true, msg: '✅ Ordem cancelada.' } : { ok: false, msg: `❌ Erro: ${r.status}` });
    } catch {
      setToroStatus({ ok: null, msg: '⚠️ CORS — cancele pelo app da corretora.' });
    } finally {
      setCancelando(false);
    }
  };

  const handleSaldo = (v) => {
    const n = parseFloat(v);
    if (!isNaN(n) && n >= 0) {
      setSaldo(n);
      localStorage.setItem('tab_saldo', n);
    }
  };

  const fmtMA = (v) => {
    if (!v) return '—';
    return assetKey === 'DOL'
      ? Math.round(v * 1000).toLocaleString('pt-BR')
      : Math.round(v).toLocaleString('pt-BR');
  };
  const fmtMACD = (v) => {
    if (!v) return '—';
    return assetKey === 'DOL'
      ? (v * 1000).toFixed(2)
      : Math.round(v).toLocaleString('pt-BR');
  };

  return (
    <div className="tab-bot">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="tb-top">
        <div className="tb-title-row">
          <span>🤖</span>
          <div>
            <div className="tb-title">Robô Analista Técnico</div>
            <div className="tb-sub">MA9 · MA21 · MA200 · RSI · MACD · Volume — dados reais</div>
          </div>
        </div>
        <div className="tb-top-right">
          {ts && <span className="tb-ts">{ts}</span>}
          <button
            className={`tb-auto-toggle ${autoMode ? 'auto-on' : 'auto-off'}`}
            onClick={toggleAutoMode}
            title={autoMode ? 'Clique para desligar o modo automático' : 'Clique para ligar o modo automático'}
          >
            {autoMode ? '🟢 AUTO ON' : '⚫ AUTO OFF'}
          </button>
        </div>
      </div>

      {/* ── Auto Log ───────────────────────────────────────────────── */}
      {autoLog.length > 0 && (
        <div className="tb-auto-log">
          {autoLog.slice(0, 5).map((l, i) => (
            <div key={i} className="tb-auto-log-line">{l}</div>
          ))}
        </div>
      )}

      {/* ── Controls ───────────────────────────────────────────────── */}
      <div className="tb-controls">
        {/* 4 botões principais */}
        <div className="tb-seg">
          {Object.entries(ASSETS).map(([k, a]) => (
            <button key={k} className={`tsb ${assetKey === k && !openPanel ? 'tsb-active' : ''}`}
              onClick={() => { selectTicker(k); setOpenPanel(null); }}>
              {a.icon} {a.label}
            </button>
          ))}
          <button className={`tsb ${openPanel === 'acoes' || (!ASSETS[assetKey] && resolvedAsset.group === 'acoes') ? 'tsb-active' : ''}`}
            onClick={() => setOpenPanel(p => p === 'acoes' ? null : 'acoes')}>
            📄 Ações
          </button>
          <button className={`tsb ${openPanel === 'cripto' || (!ASSETS[assetKey] && resolvedAsset.group === 'cripto') ? 'tsb-active' : ''}`}
            onClick={() => setOpenPanel(p => p === 'cripto' ? null : 'cripto')}>
            🪙 Cripto
          </button>
        </div>

        {/* Painel de ações */}
        {openPanel === 'acoes' && (
          <div className="tb-panel">
            <form className="tb-search" onSubmit={handleSearchSubmit}>
              <input type="text" className="tb-search-input font-mono"
                placeholder="🔍 Digite o ticker... PETR4, VALE3, MGLU3"
                value={searchTicker} autoFocus
                onChange={e => setSearchTicker(e.target.value.toUpperCase())} />
            </form>
            <div className="tb-chips">
              {STOCK_SUGGESTIONS.map(s => (
                <button key={s.key} className={`tb-chip ${assetKey === s.key ? 'tb-chip-active' : ''}`}
                  onClick={() => { selectTicker(s.key); setOpenPanel(null); }}>{s.icon} {s.key}</button>
              ))}
            </div>
          </div>
        )}

        {/* Painel de cripto */}
        {openPanel === 'cripto' && (
          <div className="tb-panel">
            <form className="tb-search" onSubmit={handleSearchSubmit}>
              <input type="text" className="tb-search-input font-mono"
                placeholder="🔍 Digite o par... BTCUSDT, ETHUSDT, SOLUSDT"
                value={searchTicker} autoFocus
                onChange={e => setSearchTicker(e.target.value.toUpperCase())} />
            </form>
            <div className="tb-chips">
              {CRYPTO_SUGGESTIONS.map(s => (
                <button key={s.key} className={`tb-chip tb-chip-crypto ${assetKey === s.key ? 'tb-chip-active' : ''}`}
                  onClick={() => { selectTicker(s.key); setOpenPanel(null); }}>{s.icon} {s.label}</button>
              ))}
            </div>
          </div>
        )}
        <div className="tb-seg">
          {TIMEFRAMES.map(t => (
            <button key={t.label} className={`tsb tsb-tf ${tf.label === t.label ? 'tsb-active' : ''}`}
              onClick={() => { setTf(t); setRes(null); }}>
              {t.label}<span className="tsb-name">{t.name}</span>
            </button>
          ))}
        </div>
        <button className={`tb-run ${loading ? 'tb-run-spin' : ''}`} onClick={run} disabled={loading}>
          {loading ? '⟳ Analisando...' : '▶ ANALISAR AGORA'}
        </button>
      </div>

      {error && <div className="tb-err">⚠️ {error}</div>}

      {/* ── Result ─────────────────────────────────────────────────── */}
      {res && dc && (
        <div className="tb-result">

          {/* Verdict */}
          <div className="tb-verdict" style={{ background: dc.bg, borderColor: dc.border }}>
            <span className="tbv-icon">{dc.icon}</span>
            <div className="tbv-body">
              <div className="tbv-sub">📈 DIREÇÃO</div>
              <div className="tbv-dir" style={{ color: dc.color }}>{res.direction}</div>
            </div>
            {res.direction !== 'SEM OPERAÇÃO' && (
              <div className="tbv-prob" style={{ borderColor: dc.border }}>
                <div className="tbvp-lbl">🎯 Probabilidade</div>
                <div className="tbvp-val" style={{ color: dc.color }}>{res.prob}%</div>
                <div className="tbvp-score">{res.score}/5 confluências</div>
              </div>
            )}
          </div>

          {/* Indicators */}
          <div className="tb-sect">
            <div className="tb-sect-title">📊 Análise dos Indicadores</div>
            <div className="tr-list">
              <Row
                ok={ind.ma9 != null && ind.ma21 != null ? ind.ma9 > ind.ma21 : null}
                label="Média 9 vs Média 21"
                val={ind.ma9 && ind.ma21 ? `${fmtMA(ind.ma9)} / ${fmtMA(ind.ma21)}` : '—'}
                detail={ind.ma9 && ind.ma21 ? (ind.ma9 > ind.ma21 ? 'MA9 acima ▲' : 'MA9 abaixo ▼') : 'Insuf.'}
              />
              <Row
                ok={ind.ma200 != null ? (res.direction === 'VENDA' ? res.raw < ind.ma200 : res.raw > ind.ma200) : null}
                label={`Preço vs MA200${ind.ma200 == null ? ' (insuf.)' : ''}`}
                val={ind.ma200 ? `MA200: ${fmtMA(ind.ma200)}` : '< 200 barras'}
                detail={ind.ma200 ? (res.raw > ind.ma200 ? 'Preço acima ▲' : 'Preço abaixo ▼') : ''}
              />
              <Row
                ok={ind.rsi != null ? (ind.rsi >= 50 && ind.rsi <= 70 ? true : ind.rsi >= 30 && ind.rsi <= 50 ? true : false) : null}
                label="RSI(14)"
                val={ind.rsi != null ? ind.rsi.toFixed(1) : '—'}
                detail={
                  ind.rsi != null
                    ? ind.rsi > 70 ? '⚠️ Sobrecomprado'
                    : ind.rsi < 30 ? '⚠️ Sobrevendido'
                    : ind.rsi >= 50 ? 'Zona compra ✓'
                    : 'Zona venda ✓'
                    : ''
                }
              />
              <Row
                ok={ind.macdLine != null ? ind.macdLine > 0 : null}
                label="MACD(12,26,9)"
                val={ind.macdLine != null ? fmtMACD(ind.macdLine) : '—'}
                detail={ind.macdLine != null ? (ind.macdLine > 0 ? 'Positivo ▲' : 'Negativo ▼') : ''}
              />
              <Row
                ok={ind.volOk}
                label="Volume vs Média(20)"
                val={ind.volRatio != null ? `${ind.volRatio}× média` : '—'}
                detail={ind.volOk ? 'Acima da média ✓' : 'Abaixo — sem liquidez'}
              />
            </div>
          </div>

          {/* Setup */}
          {res.direction !== 'SEM OPERAÇÃO' && res.entry && (
            <div className="tb-setup" style={{ borderColor: dc.border, background: dc.bg }}>
              <div className="tb-sect-title">Setup para {resolvedAsset.label}</div>
              <div className="sp-lines">
                <div className="sp-row sp-entry">
                  <span className="sp-ico">📌</span>
                  <span className="sp-lbl">Entrada</span>
                  <span className="sp-val font-mono" style={{ color: dc.color }}>{res.entry}</span>
                </div>
                <div className="sp-row sp-stop">
                  <span className="sp-ico">🛑</span>
                  <span className="sp-lbl">Stop Loss</span>
                  <span className="sp-val font-mono">{res.stopL}</span>
                </div>
                <div className="sp-row sp-t1">
                  <span className="sp-ico">💰</span>
                  <span className="sp-lbl">Alvo 1</span>
                  <span className="sp-val font-mono" style={{ color: '#4ade80' }}>{res.t1}</span>
                </div>
                <div className="sp-row sp-t2">
                  <span className="sp-ico">💰</span>
                  <span className="sp-lbl">Alvo 2</span>
                  <span className="sp-val font-mono" style={{ color: '#00ff88' }}>{res.t2}</span>
                </div>
              </div>
              <div className="sp-rule">
                💡 Realize <strong>50%</strong> no Alvo 1, mova stop para entrada e deixe metade ir ao Alvo 2.
              </div>
            </div>
          )}

          {/* Confluences */}
          {res.confs.length > 0 && (
            <div className="tb-sect">
              <div className="tb-sect-title">📊 Confluências encontradas</div>
              <div className="conf-list">
                {res.confs.map((c, i) => (
                  <div key={i} className="conf-item" style={{ color: dc.color }}>
                    <span className="conf-n">{i + 1}.</span><span>{c}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verdict text */}
          <div className={`tb-motivo ${res.direction === 'SEM OPERAÇÃO' ? 'mo-wait' : ''}`}>
            <span className="mo-icon">{res.direction === 'SEM OPERAÇÃO' ? '⏸' : (res.prob === 88 ? '✅' : '⚠️')}</span>
            <div>
              <div className="mo-head">
                {res.direction === 'SEM OPERAÇÃO'
                  ? 'Operação NÃO aprovada'
                  : `Operação ${res.score === 5 ? 'APROVADA' : 'APROVADA com cautela'} — ${res.score}/5 confluências ativas`}
              </div>
              <div className="mo-text">{res.motivo}</div>
            </div>
          </div>

        </div>
      )}

      {/* ── P&L DIÁRIO + POSIÇÃO ATIVA ───────────────────────────────── */}
      {(dailyPnl.ops.length > 0 || activePosition) && (
        <div className="tb-pnl-wrap">
          {/* P&L do dia */}
          <div className="tb-pnl-header">
            <span className="tb-pnl-title">📊 P&L Diário</span>
            <span className={`tb-pnl-total font-mono ${dailyPnl.total >= 0 ? 'gain' : 'loss'}`}>
              {dailyPnl.total >= 0 ? '+' : ''}R$ {dailyPnl.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            {dailyPnl.total <= -DAILY_LOSS_LIMIT && <span className="tb-pnl-stopped">STOP DIÁRIO</span>}
          </div>
          {dailyPnl.ops.length > 0 && (
            <div className="tb-pnl-ops">
              {dailyPnl.ops.slice(-5).reverse().map((op, i) => (
                <div key={i} className={`tb-pnl-op ${op.valor >= 0 ? 'gain' : 'loss'}`}>
                  <span>{op.time}</span>
                  <span>{op.desc}</span>
                  <span className="font-mono">{op.valor >= 0 ? '+' : ''}R$ {op.valor.toLocaleString('pt-BR')}</span>
                </div>
              ))}
            </div>
          )}

          {/* Posição ativa */}
          {activePosition && (
            <div className="tb-pos-active">
              <div className="tb-pos-header">
                <span>🔴 Posição Ativa: {activePosition.direction} {activePosition.assetKey} × {activePosition.contratos}</span>
                {activePosition.breakeven && <span className="tb-pos-be">🔄 BE</span>}
                {activePosition.partialDone && <span className="tb-pos-partial">💰 PARCIAL</span>}
              </div>
              <div className="tb-pos-levels">
                <span>Entrada: {activePosition.entry.toLocaleString('pt-BR')}</span>
                <span style={{color:'#ff3355'}}>Stop: {activePosition.stop.toLocaleString('pt-BR')}{activePosition.breakeven ? ' (BE)' : ''}</span>
                <span style={{color:'#00ff88'}}>Alvo: {activePosition.alvo.toLocaleString('pt-BR')}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ORDEM ─────────────────────────────────────────────────────── */}
      <div className="tab-ordem-wrap">
        <div className="tab-ordem-header">
          <span className="tab-ordem-title">💼 Ordem</span>
          <button className="tab-exec-toggle" onClick={() => setShowExec(v => !v)}>
            {showExec ? 'Ocultar execução ▲' : '⚙️ Configurar execução ▼'}
          </button>
          {showExec && (
            <div className="tab-ordem-inputs">
              <div className="tab-saldo-row">
                <span className="tab-saldo-label">Saldo R$</span>
                <input type="number" className="tab-saldo-input font-mono"
                  value={saldo} min="0" step="100"
                  onChange={e => handleSaldo(e.target.value)} />
              </div>
              <div className="tab-saldo-row">
                <span className="tab-saldo-label">Contratos</span>
                <input type="number" className="tab-saldo-input font-mono"
                  value={contratosManual || ''} min="1" max="99" placeholder="auto"
                  onChange={e => {
                    const v = parseInt(e.target.value);
                    setContratosManual(isNaN(v) || v < 1 ? 0 : v);
                  }} />
              </div>
            </div>
          )}
        </div>

        {ordem ? (
          <div className="tab-ordem-result" style={{ borderColor: dc?.border, background: dc?.bg }}>

            {/* Entrada / Stop / Alvo */}
            <div className="tab-ord-setup">
              <div className="tab-ord-setup-row">
                <span>📌 Entrada</span>
                <span className="font-mono" style={{ color: dc?.color }}>{ordem.entrada}</span>
              </div>
              <div className="tab-ord-setup-row">
                <span>🛑 Stop</span>
                <span className="font-mono" style={{ color: '#ff3355' }}>{ordem.stopPts} <span className="tab-ord-pts">({ordem.stopPtsLabel})</span></span>
              </div>
              <div className="tab-ord-setup-row">
                <span>🎯 Alvo</span>
                <span className="font-mono" style={{ color: '#00ff88' }}>{ordem.alvoPts} <span className="tab-ord-pts">({ordem.alvoPtsLabel})</span></span>
              </div>
            </div>

            {/* Resultado financeiro em destaque */}
            <div className="tab-ord-resultado">
              <div className="tab-res-bloco loss">
                <div className="tab-res-label">Se errar</div>
                <div className="tab-res-valor font-mono">- {ordem.moeda} {ordem.riscoTotal}</div>
                <div className="tab-res-sub">{ordem.moeda} {ordem.riscoPorContrato} × {ordem.contratos}</div>
              </div>
              <div className="tab-res-vs">vs</div>
              <div className="tab-res-bloco gain">
                <div className="tab-res-label">Se acertar</div>
                <div className="tab-res-valor font-mono">+ {ordem.moeda} {ordem.ganhoTotal}</div>
                <div className="tab-res-sub">{ordem.moeda} {ordem.ganhoPorContrato} × {ordem.contratos}</div>
              </div>
            </div>

            {/* Toro — token + botões */}
            {showExec ? (
              <div className="toro-send-wrap">
                <div className="toro-token-row">
                  <span className="toro-logo">🐂 Toro</span>
                  <input type={showToken ? 'text' : 'password'} className="toro-token-input font-mono"
                    placeholder="Token API" value={toroToken}
                    onChange={e => { setToroToken(e.target.value); localStorage.setItem('toro_token', e.target.value); }} />
                  <button className="toro-eye-btn" onClick={() => setShowToken(p => !p)}>
                    {showToken ? '🙈' : '👁'}
                  </button>
                </div>
                <div className="toro-action-row">
                  <button
                    className={`toro-exec-btn${enviando ? ' sending' : ''}`}
                    onClick={enviarOrdemManual}
                    disabled={enviando || cancelando}
                    style={{ background: dc?.color + '22', borderColor: dc?.color + '88', color: dc?.color }}
                  >
                    {enviando ? '⟳ Enviando...' : `▶ Executar Ordem`}
                  </button>
                  <button
                    className={`toro-cancel-btn${cancelando ? ' sending' : ''}`}
                    onClick={cancelarOrdem}
                    disabled={enviando || cancelando}
                  >
                    {cancelando ? '⟳ Cancelando...' : '✕ Cancelar Ordem'}
                  </button>
                </div>
                {toroStatus && (
                  <div className={`toro-status ${toroStatus.ok === true ? 'ok' : toroStatus.ok === false ? 'err' : 'warn'}`}>
                    {toroStatus.msg}
                  </div>
                )}
              </div>
            ) : (
              <div className="tab-exec-hint">⚙️ Clique em "Configurar execução" acima para enviar essa ordem para a corretora.</div>
            )}
          </div>
        ) : (
          <div className="tab-ordem-idle">
            {res && res.direction === 'SEM OPERAÇÃO'
              ? '⏸ Robô não liberou — aguarde sinal.'
              : '▶ Rode o robô para calcular a ordem.'}
          </div>
        )}
      </div>

      {/* Empty */}
      {!res && !loading && !error && (
        <div className="tb-empty">
          <div style={{ fontSize: '2.5rem', opacity: .35 }}>🤖</div>
          <div className="te-title">Selecione o ativo e o tempo gráfico</div>
          <div className="te-sub">O robô busca dados reais e calcula MA9, MA21, MA200, RSI(14), MACD(12,26,9) e Volume — depois gera o setup completo.</div>
        </div>
      )}

      <style jsx="true">{`
        .tab-bot {
          background: linear-gradient(135deg, rgba(8,10,18,.98), rgba(10,14,26,.98));
          border: 1px solid rgba(168,85,247,.22); border-radius: 16px;
          padding: 1.3rem; margin-bottom: 1.4rem;
        }

        /* Top */
        .tb-top {
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: .5rem;
          padding-bottom: .85rem; border-bottom: 1px solid rgba(255,255,255,.06); margin-bottom: 1rem;
        }
        .tb-title-row { display: flex; align-items: center; gap: .65rem; font-size: 1.5rem; }
        .tb-title { font-size: 1rem; font-weight: 800;
          background: linear-gradient(135deg,#a855f7,#6395ff); -webkit-background-clip:text;
          -webkit-text-fill-color:transparent; background-clip:text; }
        .tb-sub { font-size: .59rem; color: var(--text-muted); margin-top: 1px; }
        .tb-ts  { font-size: .6rem; color: var(--text-muted); font-family: var(--font-mono); }
        .tb-top-right { display: flex; align-items: center; gap: .6rem; }
        .tb-auto-toggle {
          font-size: .65rem; font-weight: 900; padding: .3rem .75rem; border-radius: 20px;
          cursor: pointer; border: 1px solid; transition: all .2s; letter-spacing: .04em;
        }
        .tb-auto-toggle.auto-on {
          background: rgba(0,255,136,.12); border-color: rgba(0,255,136,.45); color: #00ff88;
          box-shadow: 0 0 10px rgba(0,255,136,.2);
        }
        .tb-auto-toggle.auto-off {
          background: rgba(255,255,255,.05); border-color: rgba(255,255,255,.15); color: var(--text-muted);
        }
        .tb-auto-log {
          background: rgba(0,0,0,.3); border: 1px solid rgba(255,255,255,.07);
          border-radius: 8px; padding: .5rem .75rem;
          display: flex; flex-direction: column; gap: .2rem;
          margin-bottom: .25rem;
        }
        .tb-auto-log-line {
          font-size: .62rem; color: var(--text-muted); font-family: var(--font-mono);
          line-height: 1.4;
        }

        /* Controls */
        .tb-controls { display: flex; align-items: flex-start; gap: .65rem; flex-wrap: wrap; margin-bottom: 1rem; }
        .tb-seg { display: flex; gap: .3rem; flex-wrap: wrap; align-items: center; }
        .tb-panel {
          width: 100%; display: flex; flex-direction: column; gap: .45rem;
          padding: .6rem; border-radius: 10px;
          background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.08);
          animation: panelIn .2s ease;
        }
        @keyframes panelIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }

        .tb-search {
          width: 100%;
        }
        .tb-search-input {
          width: 100%; padding: .38rem .6rem; border-radius: 8px; font-size: .68rem;
          background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.12);
          color: var(--text-primary); transition: border-color .2s;
        }
        .tb-search-input:focus { outline: none; border-color: rgba(99,149,255,.5); }
        .tb-search-input::placeholder { color: rgba(255,255,255,.3); font-size: .62rem; }

        .tb-chips {
          width: 100%; display: flex; gap: .3rem; flex-wrap: wrap; align-items: center;
        }
        .tb-chips-label {
          font-size: .5rem; font-weight: 800; color: var(--text-muted);
          text-transform: uppercase; letter-spacing: .06em; padding: 0 .2rem;
        }
        .tb-chip {
          padding: .22rem .5rem; border-radius: 6px; font-size: .58rem; font-weight: 700;
          background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1);
          color: var(--text-secondary); cursor: pointer; transition: all .15s; white-space: nowrap;
        }
        .tb-chip:hover { background: rgba(255,255,255,.1); }
        .tb-chip-active {
          background: rgba(99,149,255,.15); border-color: rgba(99,149,255,.4);
          color: #6395ff; font-weight: 800;
        }
        .tb-chip-crypto { border-color: rgba(240,185,11,.15); }
        .tb-chip-crypto.tb-chip-active {
          background: rgba(240,185,11,.12); border-color: rgba(240,185,11,.4); color: #f0b90b;
        }

        .tsb {
          padding: .35rem .75rem; border-radius: 8px; font-size: .65rem; font-weight: 700;
          background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08);
          color: var(--text-muted); cursor: pointer; transition: all .2s;
          display: flex; flex-direction: column; align-items: center; gap: 1px;
        }
        .tsb:hover { background: rgba(255,255,255,.08); color: var(--text-secondary); }
        .tsb-active { background: rgba(168,85,247,.15); border-color: rgba(168,85,247,.5); color: #a855f7; box-shadow: 0 0 12px rgba(168,85,247,.2); }
        .tsb-tf { min-width: 42px; }
        .tsb-name { font-size: .47rem; color: var(--text-muted); font-weight: 400; }

        .tb-run {
          padding: .45rem 1.2rem; border-radius: 8px; font-size: .72rem; font-weight: 900;
          background: linear-gradient(135deg, rgba(168,85,247,.25), rgba(99,149,255,.25));
          border: 1px solid rgba(168,85,247,.45); color: #c084fc; cursor: pointer;
          transition: all .2s; letter-spacing: .04em; white-space: nowrap;
        }
        .tb-run:hover:not(:disabled) { box-shadow: 0 0 20px rgba(168,85,247,.35); }
        .tb-run:disabled { opacity: .6; cursor: not-allowed; }
        .tb-run-spin { animation: spinPulse 1s ease infinite; }
        @keyframes spinPulse { 0%,100%{opacity:1} 50%{opacity:.55} }

        .tb-err {
          padding: .55rem .75rem; border-radius: 8px; margin-bottom: .8rem;
          background: rgba(255,51,85,.07); border: 1px solid rgba(255,51,85,.3); color: #ff3355; font-size: .7rem;
        }

        /* Result */
        .tb-result { display: flex; flex-direction: column; gap: .85rem; }

        .tb-verdict {
          display: flex; align-items: center; gap: .9rem;
          padding: .9rem 1.1rem; border-radius: 12px; border: 1px solid;
        }
        .tbv-icon { font-size: 2rem; flex-shrink: 0; }
        .tbv-body { flex: 1; }
        .tbv-sub  { font-size: .5rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: .07em; }
        .tbv-dir  { font-size: 1.4rem; font-weight: 900; letter-spacing: -.4px; }
        .tbv-prob {
          display: flex; flex-direction: column; align-items: center; padding: .55rem .9rem;
          border-radius: 10px; border: 1px solid; flex-shrink: 0;
        }
        .tbvp-lbl   { font-size: .52rem; font-weight: 700; color: var(--text-muted); }
        .tbvp-val   { font-size: 1.5rem; font-weight: 900; font-family: var(--font-mono); }
        .tbvp-score { font-size: .52rem; color: var(--text-muted); }

        /* Indicators */
        .tb-sect { display: flex; flex-direction: column; gap: .35rem; }
        .tb-sect-title { font-size: .6rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: .08em; }
        .tr-list { display: flex; flex-direction: column; gap: .2rem; }
        .tr-row {
          display: flex; align-items: center; gap: .5rem;
          padding: .42rem .6rem; border-radius: 7px; border: 1px solid;
        }
        .tr-ic     { font-size: .85rem; flex-shrink: 0; width: 20px; text-align: center; }
        .tr-label  { font-size: .65rem; font-weight: 600; color: var(--text-secondary); flex: 1; }
        .tr-val    { font-size: .7rem; font-weight: 800; min-width: 90px; text-align: right; }
        .tr-detail { font-size: .58rem; color: var(--text-muted); min-width: 100px; text-align: right; }

        /* Setup */
        .tb-setup { padding: .85rem .9rem; border-radius: 12px; border: 1px solid; }
        .sp-lines { display: flex; flex-direction: column; gap: .38rem; margin-top: .5rem; }
        .sp-row {
          display: flex; align-items: center; gap: .5rem; flex-wrap: wrap;
          padding: .38rem .5rem; border-radius: 6px; background: rgba(255,255,255,.025);
        }
        .sp-ico    { font-size: .85rem; flex-shrink: 0; }
        .sp-lbl    { font-size: .58rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: .05em; min-width: 65px; }
        .sp-val    { font-size: .73rem; font-weight: 700; }
        .sp-entry  { border-left: 2px solid #6395ff55; }
        .sp-stop   { border-left: 2px solid #ff335555; }
        .sp-t1     { border-left: 2px solid #4ade8055; }
        .sp-t2     { border-left: 2px solid #00ff8855; }
        .sp-rule   { font-size: .63rem; color: var(--text-muted); margin-top: .5rem; padding-top: .5rem; border-top: 1px solid rgba(255,255,255,.05); line-height: 1.4; }
        .sp-rule strong { color: var(--text-secondary); }

        /* Confluences */
        .conf-list { display: flex; flex-direction: column; gap: .2rem; }
        .conf-item { display: flex; gap: .35rem; font-size: .67rem; font-weight: 600; padding: .3rem .5rem; border-radius: 5px; background: rgba(255,255,255,.025); line-height: 1.35; }
        .conf-n    { flex-shrink: 0; opacity: .6; }

        /* Motivo */
        .tb-motivo {
          display: flex; gap: .5rem; padding: .65rem .8rem; border-radius: 8px;
          background: rgba(0,255,136,.06); border: 1px solid rgba(0,255,136,.2);
        }
        .mo-wait { background: rgba(251,191,36,.06); border-color: rgba(251,191,36,.2); }
        .mo-icon { font-size: 1rem; flex-shrink: 0; margin-top: 1px; }
        .mo-head { font-size: .7rem; font-weight: 800; color: var(--text-primary); margin-bottom: 2px; }
        .mo-text { font-size: .65rem; color: var(--text-secondary); line-height: 1.45; }

        /* Empty */
        .tb-empty { display: flex; flex-direction: column; align-items: center; gap: .55rem; padding: 2.5rem 1rem; text-align: center; }
        .te-title { font-size: .8rem; font-weight: 700; color: var(--text-secondary); }
        .te-sub   { font-size: .63rem; color: var(--text-muted); max-width: 360px; line-height: 1.5; }

        /* P&L Diário + Posição */
        .tb-pnl-wrap {
          margin-top: .75rem; padding: .7rem; border-radius: 10px;
          background: rgba(255,255,255,.02); border: 1px solid rgba(255,255,255,.07);
          display: flex; flex-direction: column; gap: .5rem;
        }
        .tb-pnl-header {
          display: flex; align-items: center; gap: .6rem; flex-wrap: wrap;
        }
        .tb-pnl-title { font-size: .72rem; font-weight: 800; color: var(--text-primary); }
        .tb-pnl-total { font-size: .85rem; font-weight: 900; }
        .tb-pnl-total.gain { color: #00ff88; }
        .tb-pnl-total.loss { color: #ff3355; }
        .tb-pnl-stopped {
          font-size: .55rem; font-weight: 900; padding: 2px 8px; border-radius: 4px;
          background: rgba(255,51,85,.15); border: 1px solid rgba(255,51,85,.4); color: #ff3355;
        }
        .tb-pnl-ops { display: flex; flex-direction: column; gap: .15rem; }
        .tb-pnl-op {
          display: flex; justify-content: space-between; gap: .5rem;
          font-size: .6rem; padding: .2rem .4rem; border-radius: 4px;
        }
        .tb-pnl-op.gain { color: #00ff88; background: rgba(0,255,136,.04); }
        .tb-pnl-op.loss { color: #ff3355; background: rgba(255,51,85,.04); }

        .tb-pos-active {
          padding: .55rem; border-radius: 8px;
          background: rgba(168,85,247,.06); border: 1px solid rgba(168,85,247,.2);
          display: flex; flex-direction: column; gap: .3rem;
        }
        .tb-pos-header {
          display: flex; align-items: center; gap: .5rem; font-size: .65rem; font-weight: 800; color: var(--text-primary);
        }
        .tb-pos-be { font-size: .52rem; padding: 1px 5px; border-radius: 3px; background: rgba(99,149,255,.15); color: #6395ff; font-weight: 800; }
        .tb-pos-partial { font-size: .52rem; padding: 1px 5px; border-radius: 3px; background: rgba(0,255,136,.12); color: #00ff88; font-weight: 800; }
        .tb-pos-levels {
          display: flex; gap: .75rem; font-size: .6rem; font-family: var(--font-mono);
          color: var(--text-secondary);
        }

        /* Ordem automática */
        .tab-ordem-wrap {
          margin-top: 1rem; padding: .9rem;
          background: rgba(255,255,255,.02); border: 1px solid rgba(255,255,255,.07);
          border-radius: 12px;
        }
        .tab-ordem-header {
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: .5rem; margin-bottom: .75rem;
        }
        .tab-ordem-title { font-size: .72rem; font-weight: 800; color: var(--text-primary); }
        .tab-exec-toggle {
          font-size: .6rem; font-weight: 700; color: var(--text-muted);
          background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08);
          border-radius: 999px; padding: .28rem .65rem; cursor: pointer; transition: all .15s;
        }
        .tab-exec-toggle:hover { background: rgba(255,255,255,.08); color: var(--text-secondary); }
        .tab-exec-hint {
          font-size: .62rem; color: var(--text-muted); text-align: center;
          padding: .5rem; background: rgba(255,255,255,.02); border-radius: 8px;
        }
        .tab-ordem-inputs { display: flex; align-items: center; gap: .6rem; flex-wrap: wrap; }
        .tab-saldo-row { display: flex; align-items: center; gap: .4rem; }
        .tab-saldo-label { font-size: .6rem; color: var(--text-muted); white-space: nowrap; }
        .tab-saldo-input {
          width: 80px; padding: .28rem .5rem; border-radius: 6px; font-size: .72rem;
          background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12);
          color: var(--text-primary); outline: none; text-align: right;
        }
        .tab-saldo-input:focus { border-color: rgba(99,149,255,.5); }
        .tab-saldo-input::placeholder { color: rgba(255,255,255,.25); font-size: .65rem; }

        .tab-ordem-result {
          border: 1px solid; border-radius: 10px; padding: .8rem; display: flex; flex-direction: column; gap: .65rem;
        }
        /* setup rows: entrada/stop/alvo */
        .tab-ord-setup { display: flex; flex-direction: column; gap: .28rem; }
        .tab-ord-setup-row {
          display: flex; justify-content: space-between; align-items: center;
          font-size: .68rem; color: var(--text-secondary);
        }
        .tab-ord-setup-row .font-mono { font-size: .72rem; font-weight: 800; }
        .tab-ord-pts { font-size: .58rem; color: var(--text-muted); font-weight: 400; }

        /* resultado financeiro em destaque */
        .tab-ord-resultado {
          display: flex; align-items: center; gap: .5rem;
          margin-top: .1rem;
        }
        .tab-res-bloco {
          flex: 1; border-radius: 10px; padding: .65rem .5rem;
          text-align: center; border: 1px solid;
        }
        .tab-res-bloco.loss {
          background: rgba(255,51,85,.08); border-color: rgba(255,51,85,.25);
        }
        .tab-res-bloco.gain {
          background: rgba(0,255,136,.08); border-color: rgba(0,255,136,.25);
        }
        .tab-res-label { font-size: .6rem; color: var(--text-muted); margin-bottom: .2rem; }
        .tab-res-valor {
          font-size: 1.1rem; font-weight: 900; line-height: 1;
        }
        .tab-res-bloco.loss .tab-res-valor { color: #ff3355; }
        .tab-res-bloco.gain .tab-res-valor { color: #00ff88; }
        .tab-res-sub { font-size: .55rem; color: var(--text-muted); margin-top: .2rem; }
        .tab-res-vs {
          font-size: .65rem; font-weight: 900; color: var(--text-muted);
          flex-shrink: 0;
        }
        .tab-ordem-idle {
          text-align: center; padding: .9rem; font-size: .68rem; color: var(--text-muted);
        }

        /* Toro send */
        .toro-send-wrap {
          margin-top: .5rem; padding-top: .65rem;
          border-top: 1px solid rgba(255,255,255,.06);
          display: flex; flex-direction: column; gap: .4rem;
        }
        .toro-token-row { display: flex; align-items: center; gap: .4rem; flex-wrap: wrap; }
        .toro-logo { font-size: .7rem; font-weight: 900; color: var(--text-muted); white-space: nowrap; }
        .toro-token-input {
          flex: 1; min-width: 120px; padding: .3rem .5rem; border-radius: 6px; font-size: .65rem;
          background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1);
          color: var(--text-primary); outline: none;
        }
        .toro-token-input:focus { border-color: rgba(168,85,247,.5); }
        .toro-eye-btn {
          background: none; border: none; cursor: pointer; font-size: .85rem; padding: .2rem;
          opacity: .6; transition: opacity .2s;
        }
        .toro-eye-btn:hover { opacity: 1; }
        .toro-action-row {
          display: flex; gap: .5rem;
        }
        .toro-exec-btn, .toro-cancel-btn {
          flex: 1; padding: .5rem .6rem; border-radius: 8px; font-size: .7rem; font-weight: 800;
          border: 1px solid; cursor: pointer; white-space: nowrap; transition: all .15s;
        }
        .toro-exec-btn:disabled, .toro-cancel-btn:disabled { opacity: .4; cursor: not-allowed; }
        .toro-exec-btn.sending, .toro-cancel-btn.sending { opacity: .7; }
        .toro-cancel-btn {
          background: rgba(255,51,85,.1); border-color: rgba(255,51,85,.4); color: #ff3355;
        }
        .toro-cancel-btn:hover:not(:disabled) { background: rgba(255,51,85,.2); }
        @keyframes tSpin { to { transform: rotate(360deg); } }
        .toro-status {
          font-size: .62rem; line-height: 1.45; padding: .4rem .6rem; border-radius: 6px; border: 1px solid;
        }
        .toro-status.ok   { color: #00ff88; background: rgba(0,255,136,.07); border-color: rgba(0,255,136,.25); }
        .toro-status.err  { color: #ff3355; background: rgba(255,51,85,.07);  border-color: rgba(255,51,85,.25); }
        .toro-status.warn { color: #fbbf24; background: rgba(251,191,36,.07); border-color: rgba(251,191,36,.25); }
      `}</style>
    </div>
  );
};

export default TechAnalysisBot;
