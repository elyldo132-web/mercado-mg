import React, { useState, useEffect, useRef } from 'react';

const TV_SYMBOLS = [
  { id: 'WINFUT', symbol: 'BMFBOVESPA:WINFUT', label: '🇧🇷 WINFUT', color: '#10b981', desc: 'Mini Ibovespa' },
  { id: 'DOLFUT', symbol: 'BMFBOVESPA:DOLFUT', label: '💵 DOLFUT',  color: '#06b6d4', desc: 'Mini Dólar'    },
  { id: 'IBOV',   symbol: 'BMFBOVESPA:IBOV',   label: '📊 IBOV',    color: '#a855f7', desc: 'Ibovespa'      },
  { id: 'BTC',    symbol: 'BITSTAMP:BTCUSD',    label: '₿ BTC',     color: '#f97316', desc: 'Bitcoin/USD'   },
  { id: 'USDBRL', symbol: 'OANDA:USDBRL',       label: '💱 USD/BRL', color: '#fbbf24', desc: 'Câmbio'        },
];

const PERIODS = [
  { v: '1',  l: '1m'     },
  { v: '5',  l: '5m'     },
  { v: '15', l: '15m'    },
  { v: '60', l: '1H'     },
  { v: 'D',  l: 'Diário' },
];

// Single script loader — shared across all chart instances
let tvReady = false, tvLoading = false;
const tvQueue = [];

const loadTV = (cb) => {
  if (tvReady) { cb(); return; }
  tvQueue.push(cb);
  if (tvLoading) return;
  tvLoading = true;
  const s   = document.createElement('script');
  s.id      = 'tv-lib';
  s.src     = 'https://s3.tradingview.com/tv.js';
  s.async   = true;
  s.onload  = () => { tvReady = true; tvQueue.forEach(fn => fn()); tvQueue.length = 0; };
  document.head.appendChild(s);
};

// Inner chart widget
const TVWidget = ({ symbol, period, height = 460 }) => {
  const wrapRef = useRef(null);
  const uid     = useRef(`tv_${Math.random().toString(36).slice(2, 10)}`);

  useEffect(() => {
    if (!wrapRef.current) return;
    wrapRef.current.innerHTML = '';

    const div   = document.createElement('div');
    div.id      = uid.current;
    div.style.height = `${height}px`;
    wrapRef.current.appendChild(div);

    loadTV(() => {
      if (!window.TradingView || !document.getElementById(uid.current)) return;
      new window.TradingView.widget({
        autosize:          true,
        symbol,
        interval:          period,
        timezone:          'America/Sao_Paulo',
        theme:             'dark',
        style:             '1',
        locale:            'br',
        toolbar_bg:        '#0d1117',
        enable_publishing: false,
        allow_symbol_change: false,
        container_id:      uid.current,
        hide_side_toolbar: false,
        studies: [
          'RSI@tv-basicstudies',
          'MACD@tv-basicstudies',
          'BB@tv-basicstudies',
        ],
        overrides: {
          'paneProperties.background':          '#0d1117',
          'paneProperties.backgroundType':      'solid',
          'paneProperties.vertGridProperties.color': '#1a1f2e',
          'paneProperties.horzGridProperties.color': '#1a1f2e',
        },
      });
    });

    return () => { if (wrapRef.current) wrapRef.current.innerHTML = ''; };
  }, [symbol, period, height]);

  return <div ref={wrapRef} style={{ width: '100%' }} />;
};

// Public component
const TradingViewCharts = () => {
  const [active, setActive]   = useState('WINFUT');
  const [period, setPeriod]   = useState('15');

  const sym = TV_SYMBOLS.find(s => s.id === active);

  return (
    <div className="tv-panel">
      {/* ── Toolbar ───────────────────────────────────────────── */}
      <div className="tv-toolbar">
        <div className="tv-sym-tabs">
          {TV_SYMBOLS.map(s => (
            <button key={s.id}
              className={`tv-sym-btn ${active === s.id ? 'active' : ''}`}
              style={active === s.id ? { '--tc': s.color } : {}}
              onClick={() => setActive(s.id)}>
              <span>{s.label}</span>
              <span className="tv-sym-desc">{s.desc}</span>
            </button>
          ))}
        </div>
        <div className="tv-period-tabs">
          {PERIODS.map(p => (
            <button key={p.v}
              className={`tv-period-btn ${period === p.v ? 'active' : ''}`}
              onClick={() => setPeriod(p.v)}>
              {p.l}
            </button>
          ))}
        </div>
      </div>

      {/* ── Chart ─────────────────────────────────────────────── */}
      <div className="tv-chart-wrap">
        <TVWidget key={`${active}-${period}`} symbol={sym.symbol} period={period} />
      </div>

      {/* ── Note ──────────────────────────────────────────────── */}
      <div className="tv-note">
        📡 Dados ao vivo via TradingView · RSI · MACD · Bollinger Bands
        <span className="tv-note-sym" style={{ color: sym.color }}>{sym.symbol}</span>
      </div>

      <style jsx="true">{`
        .tv-panel {
          background: linear-gradient(135deg,rgba(10,12,20,.97),rgba(13,17,23,.97));
          border: 1px solid rgba(88,166,255,.12); border-radius: 16px;
          overflow: hidden; margin-bottom: 1.5rem;
        }
        .tv-toolbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: .75rem 1rem; gap: .75rem; flex-wrap: wrap;
          border-bottom: 1px solid rgba(255,255,255,.06);
          background: rgba(255,255,255,.02);
        }
        .tv-sym-tabs { display: flex; gap: .35rem; flex-wrap: wrap; }
        .tv-sym-btn {
          display: flex; flex-direction: column; align-items: flex-start;
          padding: .35rem .7rem; border-radius: 10px; border: 1px solid rgba(255,255,255,.1);
          background: rgba(255,255,255,.04); color: var(--text-muted);
          font-size: .7rem; font-weight: 700; cursor: pointer; transition: all .2s; line-height: 1.2;
        }
        .tv-sym-btn:hover { background: rgba(255,255,255,.08); color: var(--text-primary); }
        .tv-sym-btn.active {
          background: color-mix(in srgb,var(--tc,#fff) 15%,transparent);
          border-color: color-mix(in srgb,var(--tc,#fff) 50%,transparent);
          color: var(--tc,#fff);
          box-shadow: 0 0 14px color-mix(in srgb,var(--tc,#fff) 25%,transparent);
        }
        .tv-sym-desc { font-size: .54rem; font-weight: 400; opacity: .7; margin-top: 1px; }

        .tv-period-tabs { display: flex; gap: .25rem; }
        .tv-period-btn {
          padding: .3rem .55rem; border-radius: 6px; border: 1px solid rgba(255,255,255,.1);
          background: rgba(255,255,255,.04); color: var(--text-muted);
          font-size: .65rem; font-weight: 700; cursor: pointer; transition: all .15s;
        }
        .tv-period-btn:hover { background: rgba(255,255,255,.08); }
        .tv-period-btn.active {
          background: rgba(88,166,255,.15); border-color: rgba(88,166,255,.4); color: #58a6ff;
        }

        .tv-chart-wrap { width: 100%; }

        .tv-note {
          display: flex; align-items: center; justify-content: space-between; gap: .5rem;
          padding: .45rem 1rem; font-size: .58rem; color: var(--text-muted);
          border-top: 1px solid rgba(255,255,255,.05); flex-wrap: wrap;
        }
        .tv-note-sym { font-weight: 700; font-family: var(--font-mono); }
      `}</style>
    </div>
  );
};

export default TradingViewCharts;
