import React, { useEffect, useState, useCallback } from 'react';
import { fetchYahooQuote, fetchBinance24h } from '../utils/MarketStatus';

const TICKER_DEFS = [
  { key: 'usdbrl', label: 'USD/BRL',  symbol: 'USDBRL=X', source: 'yahoo',   fmt: (n) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) },
  { key: 'win',    label: 'WIN',      symbol: '^BVSP',    source: 'yahoo',   fmt: (n) => Math.round(n).toLocaleString('pt-BR') },
  { key: 'sp',     label: 'S&P 500',  symbol: 'ES=F',     source: 'yahoo',   fmt: (n) => n.toLocaleString('en-US', { maximumFractionDigits: 2 }) },
  { key: 'nasdaq', label: 'Nasdaq',   symbol: 'NQ=F',     source: 'yahoo',   fmt: (n) => n.toLocaleString('en-US', { maximumFractionDigits: 2 }) },
  { key: 'dxy',    label: 'DXY',      symbol: 'DX=F',     source: 'yahoo',   fmt: (n) => n.toLocaleString('en-US', { maximumFractionDigits: 2 }) },
  { key: 'vix',    label: 'VIX',      symbol: '^VIX',     source: 'yahoo',   fmt: (n) => n.toLocaleString('en-US', { maximumFractionDigits: 2 }) },
  { key: 'btc',    label: 'Bitcoin',  symbol: 'BTCUSDT',  source: 'binance', fmt: (n) => '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 }) },
  { key: 'eth',    label: 'Ethereum', symbol: 'ETHUSDT',  source: 'binance', fmt: (n) => '$' + n.toLocaleString('en-US', { maximumFractionDigits: 2 }) },
];

const TopTicker = () => {
  const [quotes, setQuotes] = useState({});
  const [lastUpdate, setLastUpdate] = useState(null);

  const load = useCallback(async () => {
    const results = await Promise.allSettled(
      TICKER_DEFS.map(t => t.source === 'binance' ? fetchBinance24h(t.symbol) : fetchYahooQuote(t.symbol))
    );
    const next = {};
    results.forEach((r, i) => {
      next[TICKER_DEFS[i].key] = r.status === 'fulfilled' ? r.value : null;
    });
    setQuotes(next);
    setLastUpdate(new Date());
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 120000); // a cada 2 min
    return () => clearInterval(t);
  }, [load]);

  return (
    <div className="top-ticker">
      <div className="ticker-scroll">
        {TICKER_DEFS.map(t => {
          const q = quotes[t.key];
          const up = q && q.change >= 0;
          return (
            <div key={t.key} className="ticker-item">
              <span className="ticker-label">{t.label}</span>
              {q ? (
                <>
                  <span className="ticker-price font-mono">{t.fmt(q.price)}</span>
                  <span className={`ticker-change font-mono ${up ? 'up' : 'down'}`}>
                    {up ? '▲' : '▼'} {Math.abs(q.change).toFixed(2)}%
                  </span>
                </>
              ) : (
                <span className="ticker-price font-mono muted">—</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="ticker-meta">
        <span className="ticker-updated">
          {lastUpdate ? lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
        </span>
        <span className="ticker-status"><span className="status-dot"></span> Online</span>
      </div>

      <style jsx="true">{`
        .top-ticker {
          display: flex; align-items: center; gap: 1rem;
          min-width: 0; flex: 1;
        }
        .ticker-scroll {
          display: flex; align-items: center; gap: 1.1rem;
          overflow-x: auto; scrollbar-width: none; min-width: 0;
        }
        .ticker-scroll::-webkit-scrollbar { display: none; }
        .ticker-item {
          display: flex; align-items: baseline; gap: .4rem;
          white-space: nowrap; flex-shrink: 0;
        }
        .ticker-label { font-size: .65rem; font-weight: 700; color: var(--text-muted); }
        .ticker-price { font-size: .72rem; font-weight: 700; color: var(--text-primary); }
        .ticker-price.muted { color: var(--text-muted); }
        .ticker-change { font-size: .65rem; font-weight: 800; }
        .ticker-change.up { color: #00ff88; }
        .ticker-change.down { color: #ff3355; }

        .ticker-meta {
          display: flex; align-items: center; gap: .7rem;
          flex-shrink: 0; padding-left: .8rem; border-left: 1px solid var(--border-color);
        }
        .ticker-updated { font-size: .62rem; color: var(--text-muted); font-family: var(--font-mono); white-space: nowrap; }
        .ticker-status {
          display: flex; align-items: center; gap: .3rem;
          font-size: .62rem; font-weight: 700; color: #00ff88; white-space: nowrap;
        }
        .status-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #00ff88;
          box-shadow: 0 0 6px #00ff88; animation: pulseDot 2s infinite;
        }
        @keyframes pulseDot { 0%,100% { opacity: 1; } 50% { opacity: .4; } }

        @media (max-width: 768px) {
          .ticker-meta { display: none; }
        }
      `}</style>
    </div>
  );
};

export default React.memo(TopTicker);
