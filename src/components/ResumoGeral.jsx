import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { fetchYahooQuote, fetchBinance24h } from '../utils/MarketStatus';

const SCORE_HISTORY_KEY  = 'mercadomg_macro_history_v1';
const REGIME_HISTORY_KEY = 'mercadomg_regime_history_v1';
const MAX_SCORE_POINTS   = 500;
const MAX_REGIME_POINTS  = 30;

const loadJSON = (key) => {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
};
const saveJSON = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* indisponível */ } };

const scoreZone = (score) => {
  if (score >= 50)  return { label: 'FORTE COMPRA', color: '#00ff88' };
  if (score >= 15)  return { label: 'COMPRA',        color: '#4ade80' };
  if (score <= -50) return { label: 'FORTE VENDA',   color: '#ff3355' };
  if (score <= -15) return { label: 'VENDA',          color: '#f97316' };
  return                   { label: 'NEUTRO',         color: '#fbbf24' };
};

const confZone = (c) => {
  if (c >= 80) return { label: 'MUITO ALTA', color: '#00ff88' };
  if (c >= 60) return { label: 'ALTA',        color: '#4ade80' };
  if (c >= 40) return { label: 'MÉDIA',       color: '#fbbf24' };
  return              { label: 'BAIXA',       color: '#ff3355' };
};

const relTime = (ts) => {
  const diffMin = Math.round((Date.now() - ts) / 60000);
  if (diffMin < 1)   return 'agora';
  if (diffMin < 60)  return `há ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `há ${diffH}h`;
  return `há ${Math.round(diffH / 24)} dias`;
};

// ── Ativos individuais — todos com fonte real (Yahoo/Binance) ───────────────

const ASSET_DEFS = [
  { key: 'win',    label: 'WIN Mini',       icon: '🇧🇷', symbol: '^BVSP',    source: 'yahoo',   fmt: (n) => Math.round(n).toLocaleString('pt-BR') },
  { key: 'usdbrl', label: 'Dólar (USD/BRL)', icon: '💵', symbol: 'USDBRL=X', source: 'yahoo',   fmt: (n) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) },
  { key: 'sp500',  label: 'S&P 500',        icon: '🇺🇸', symbol: 'ES=F',     source: 'yahoo',   fmt: (n) => n.toLocaleString('en-US', { maximumFractionDigits: 2 }) },
  { key: 'nasdaq', label: 'Nasdaq',         icon: '💻', symbol: 'NQ=F',     source: 'yahoo',   fmt: (n) => n.toLocaleString('en-US', { maximumFractionDigits: 2 }) },
  { key: 'dxy',    label: 'DXY',            icon: '💱', symbol: 'DX=F',     source: 'yahoo',   fmt: (n) => n.toLocaleString('en-US', { maximumFractionDigits: 2 }) },
  { key: 'vix',    label: 'VIX',            icon: '📉', symbol: '^VIX',     source: 'yahoo',   fmt: (n) => n.toLocaleString('en-US', { maximumFractionDigits: 2 }) },
  { key: 'gold',   label: 'Ouro',           icon: '🥇', symbol: 'GC=F',     source: 'yahoo',   fmt: (n) => n.toLocaleString('en-US', { maximumFractionDigits: 2 }) },
  { key: 'oil',    label: 'Petróleo',       icon: '🛢️', symbol: 'CL=F',     source: 'yahoo',   fmt: (n) => n.toLocaleString('en-US', { maximumFractionDigits: 2 }) },
  { key: 'btc',    label: 'Bitcoin',        icon: '₿',  symbol: 'BTCUSDT',  source: 'binance', fmt: (n) => '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 }) },
];

// ── Velocímetro (gauge) do Macro Score, -100 a +100 ─────────────────────────

const MacroGauge = ({ score }) => {
  const zone = scoreZone(score);
  const needleDeg = (Math.max(-100, Math.min(100, score)) / 100) * 90;
  return (
    <div className="gauge-wrap">
      <div className="gauge-outer">
        <div className="gauge-ring" />
        <div className="gauge-hole" />
        <div className="gauge-needle" style={{ transform: `rotate(${needleDeg}deg)` }} />
        <div className="gauge-pivot" />
      </div>
      <div className="gauge-axis"><span>-100</span><span>0</span><span>+100</span></div>
      <div className="gauge-value" style={{ color: zone.color }}>{score > 0 ? '+' : ''}{score}</div>
      <div className="gauge-label" style={{ color: zone.color, background: zone.color + '18', borderColor: zone.color + '44' }}>{zone.label}</div>
    </div>
  );
};

// ── Anel de confiança do sinal ──────────────────────────────────────────────

const ConfidenceRing = ({ confidence, available, total }) => {
  const zone = confZone(confidence);
  const r = 50, c = 2 * Math.PI * r;
  const offset = c * (1 - confidence / 100);
  return (
    <div className="conf-wrap">
      <div className="conf-ring-box">
        <svg viewBox="0 0 120 120" width="120" height="120">
          <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="10" />
          <circle cx="60" cy="60" r={r} fill="none" stroke={zone.color} strokeWidth="10" strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 60 60)" style={{ transition: 'stroke-dashoffset .6s ease' }} />
        </svg>
        <div className="conf-center">
          <div className="conf-pct" style={{ color: zone.color }}>{confidence}%</div>
          <div className="conf-lbl" style={{ color: zone.color }}>{zone.label}</div>
        </div>
      </div>
      <div className="conf-meta"><span className="conf-meta-val">{available} / {total}</span><span className="conf-meta-txt">indicadores alinhados</span></div>
    </div>
  );
};

// ── Radar macro — agrega os fatores reais em 5 categorias ───────────────────

const RADAR_R = 52, RADAR_CX = 70, RADAR_CY = 70;
const ptFor = (value, i, r) => {
  const angle = (-90 + i * 72) * Math.PI / 180;
  const rn = ((Math.max(-100, Math.min(100, value)) + 100) / 200) * r;
  return `${(RADAR_CX + rn * Math.cos(angle)).toFixed(1)},${(RADAR_CY + rn * Math.sin(angle)).toFixed(1)}`;
};
const axisEnd = (i, r) => {
  const angle = (-90 + i * 72) * Math.PI / 180;
  return { x: RADAR_CX + r * Math.cos(angle), y: RADAR_CY + r * Math.sin(angle) };
};

const RadarMacro = ({ factorsByKey }) => {
  const cat = (keys) => {
    const vals = keys.map(k => factorsByKey[k]?.raw?.change).filter(v => v != null);
    if (!vals.length) return 0;
    return (vals.reduce((s, v) => s + v, 0) / vals.length) * 10;
  };
  const values = [
    cat(['sp500', 'nasdaq']),
    cat(['dxy', 'usdbrl']),
    cat(['gold', 'oil']),
    cat(['btc']),
    -cat(['vix']),
  ];
  const labels = ['Índices', 'Moedas', 'Commodities', 'Cripto', 'Volatilidade'];
  const dataPoints = values.map((v, i) => ptFor(v, i, RADAR_R)).join(' ');
  const gridOuter = labels.map((_, i) => ptFor(100, i, RADAR_R)).join(' ');
  const gridMid = labels.map((_, i) => ptFor(0, i, RADAR_R * 0.5)).join(' ');

  return (
    <svg viewBox="0 0 140 150" width="150" height="160">
      <polygon points={gridOuter} fill="none" stroke="rgba(255,255,255,.10)" strokeWidth="1" />
      <polygon points={gridMid} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="1" />
      {labels.map((_, i) => {
        const e = axisEnd(i, RADAR_R);
        return <line key={i} x1={RADAR_CX} y1={RADAR_CY} x2={e.x} y2={e.y} stroke="rgba(255,255,255,.08)" />;
      })}
      <polygon points={dataPoints} fill="rgba(0,212,255,.18)" stroke="#00d4ff" strokeWidth="2" />
      {labels.map((lb, i) => {
        const e = axisEnd(i, RADAR_R + 12);
        return <text key={lb} x={e.x} y={e.y} textAnchor="middle" fontSize="7" fill="#8b93a7">{lb}</text>;
      })}
    </svg>
  );
};

// ── Página principal ─────────────────────────────────────────────────────────

const ResumoGeral = ({ globalMacro }) => {
  const [scoreHistory, setScoreHistory] = useState(loadJSON(SCORE_HISTORY_KEY));
  const [regimeHistory, setRegimeHistory] = useState(loadJSON(REGIME_HISTORY_KEY));
  const [assetQuotes, setAssetQuotes] = useState({});

  useEffect(() => {
    let alive = true;
    const load = () => {
      Promise.allSettled(ASSET_DEFS.map(a => a.source === 'binance' ? fetchBinance24h(a.symbol) : fetchYahooQuote(a.symbol)))
        .then(results => {
          if (!alive) return;
          const next = {};
          results.forEach((r, i) => { next[ASSET_DEFS[i].key] = r.status === 'fulfilled' ? r.value : null; });
          setAssetQuotes(next);
        });
    };
    load();
    const t = setInterval(load, 120000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  useEffect(() => {
    const score = globalMacro?.score;
    if (score == null) return;
    setScoreHistory(prev => {
      const next = [...prev, { t: Date.now(), score }].slice(-MAX_SCORE_POINTS);
      saveJSON(SCORE_HISTORY_KEY, next);
      return next;
    });
    const zone = scoreZone(score);
    setRegimeHistory(prev => {
      const last = prev[prev.length - 1];
      if (last && last.label === zone.label) return prev;
      const next = [...prev, { t: Date.now(), label: zone.label, color: zone.color }].slice(-MAX_REGIME_POINTS);
      saveJSON(REGIME_HISTORY_KEY, next);
      return next;
    });
  }, [globalMacro]);

  const score      = globalMacro?.score ?? null;
  const confidence = globalMacro?.confidence ?? 0;
  const factors    = globalMacro?.factors ?? [];
  const available  = factors.filter(f => f.normalized != null).length;
  const total      = factors.length || 9;
  const lastUpdate = scoreHistory.length ? new Date(scoreHistory[scoreHistory.length - 1].t) : null;

  const factorsByKey = {};
  factors.forEach(f => { factorsByKey[f.key] = f; });

  const chartData = scoreHistory.map(h => ({
    time: new Date(h.t).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    score: h.score,
  }));

  const topFactors = factors
    .filter(f => f.normalized != null)
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
    .slice(0, 3);

  const whyText = topFactors.length === 0
    ? 'Aguardando dados suficientes dos indicadores para gerar a leitura do mercado.'
    : topFactors.map(f => {
        const up = f.raw.change >= 0;
        const helps = (f.contribution >= 0) === (score >= 0);
        return `${f.label} ${up ? 'em alta' : 'em queda'} (${f.raw.change > 0 ? '+' : ''}${f.raw.change.toFixed(2)}%) ${helps ? 'reforça' : 'pesa contra'} o viés atual`;
      }).join('. ') + '.';

  return (
    <div className="resumo-geral animate-fade-in">
      <div className="rg-header">
        <div>
          <div className="rg-title">Resumo do Mercado Global</div>
          <div className="rg-sub">Visão geral do sentimento macroeconômico</div>
        </div>
        {lastUpdate && <div className="rg-updated">Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}</div>}
      </div>

      {score == null ? (
        <div className="rg-empty">⏳ Calculando Macro Score — buscando dados em tempo real...</div>
      ) : (
        <>
          <div className="rg-grid-top">
            <div className="rg-card rg-card-center"><div className="rg-card-title">Macro Score</div><MacroGauge score={score} /></div>
            <div className="rg-card rg-card-center"><div className="rg-card-title">Confiança do Sinal</div><ConfidenceRing confidence={confidence} available={available} total={total} /></div>
            <div className="rg-card rg-card-evo">
              <div className="rg-card-title">Evolução do Macro Score</div>
              {chartData.length < 2 ? (
                <div className="rg-evo-empty">📡 Coletando histórico ao vivo — sem dados simulados. Volte em alguns minutos.</div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)" />
                    <XAxis dataKey="time" stroke="var(--text-muted)" tick={{ fontSize: 9 }} />
                    <YAxis domain={[-100, 100]} stroke="var(--text-muted)" tick={{ fontSize: 9 }} />
                    <Tooltip contentStyle={{ background: '#0d1117', border: '1px solid rgba(99,149,255,.3)', borderRadius: 8, fontSize: 11 }} />
                    <ReferenceLine y={0} stroke="rgba(255,255,255,.15)" />
                    <ReferenceLine y={15} stroke="#4ade80" strokeDasharray="4 4" />
                    <ReferenceLine y={-15} stroke="#f97316" strokeDasharray="4 4" />
                    <Line type="monotone" dataKey="score" stroke={scoreZone(score).color} strokeWidth={2} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="rg-card rg-why">
            <div className="rg-card-title">Por que o mercado está assim?</div>
            <div className="rg-why-text">{whyText}</div>
          </div>

          <div className="rg-mini-row">
            {ASSET_DEFS.map(a => {
              const q = assetQuotes[a.key];
              const up = q && q.change >= 0;
              return (
                <div key={a.key} className="rg-mini-card">
                  <div className="rg-mini-label">{a.icon} {a.label}</div>
                  {q ? (
                    <>
                      <div className="rg-mini-price font-mono">{a.fmt(q.price)}</div>
                      <div className={`rg-mini-change font-mono ${up ? 'up' : 'down'}`}>{up ? '▲' : '▼'} {Math.abs(q.change).toFixed(2)}%</div>
                    </>
                  ) : (
                    <div className="rg-mini-price muted">—</div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="rg-grid-bottom">
            <div className="rg-card rg-heatmap">
              <div className="rg-card-title">Heatmap Global</div>
              <div className="rg-heat-grid">
                {ASSET_DEFS.map(a => {
                  const q = assetQuotes[a.key];
                  if (!q) return <div key={a.key} className="rg-heat-cell muted">{a.label}<br />—</div>;
                  const up = q.change >= 0;
                  const intensity = Math.min(1, Math.abs(q.change) / 3);
                  const bg = up ? `rgba(74,222,128,${0.12 + intensity * 0.22})` : `rgba(255,51,85,${0.12 + intensity * 0.22})`;
                  return (
                    <div key={a.key} className="rg-heat-cell" style={{ background: bg, color: up ? '#4ade80' : '#ff3355' }}>
                      {a.label}<br />{up ? '+' : ''}{q.change.toFixed(2)}%
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rg-card rg-radar-card">
              <div className="rg-card-title">Radar Macro</div>
              <RadarMacro factorsByKey={factorsByKey} />
            </div>

            <div className="rg-card rg-regime">
              <div className="rg-card-title">Histórico de Regimes</div>
              {regimeHistory.length === 0 ? (
                <div className="rg-regime-empty">Nenhuma mudança registrada ainda — o histórico começa a partir de agora.</div>
              ) : (
                <div className="rg-regime-list">
                  {[...regimeHistory].reverse().slice(0, 6).map((r, i) => (
                    <div key={i} className="rg-regime-row">
                      <span className="rg-regime-dot" style={{ background: r.color }} />
                      <div><div className="rg-regime-label">{r.label}</div><div className="rg-regime-time">{relTime(r.t)}</div></div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rg-card rg-backtest">
              <div className="rg-card-title">Backtesting do Macro Score</div>
              <div className="rg-backtest-empty">📊 Ainda não há histórico suficiente acumulado para calcular retorno, win rate, drawdown, Sharpe e profit factor. Isso se constrói com o tempo de uso do app — sem números inventados aqui.</div>
            </div>
          </div>
        </>
      )}

      <style jsx="true">{`
        .resumo-geral { padding: 0 0 1.5rem; }
        .rg-header { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: .5rem; margin-bottom: 1.2rem; }
        .rg-title { font-size: 1.3rem; font-weight: 900; letter-spacing: -.5px; }
        .rg-sub   { font-size: .75rem; color: var(--text-muted); margin-top: 2px; }
        .rg-updated { font-size: .62rem; color: var(--text-muted); font-family: var(--font-mono); margin-top: 4px; }

        .rg-empty {
          padding: 2rem 1.2rem; text-align: center; font-size: .78rem; color: var(--text-muted);
          background: rgba(8,10,18,.6); border: 1px solid rgba(99,149,255,.15); border-radius: 16px;
        }

        .rg-card {
          background: linear-gradient(135deg, rgba(8,10,18,.98), rgba(12,16,30,.98));
          border: 1px solid rgba(99,149,255,.22); border-radius: 16px; padding: 1.1rem;
        }
        .rg-card-title { font-size: .6rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: .08em; margin-bottom: .6rem; }

        .rg-grid-top { display: grid; grid-template-columns: minmax(220px,1fr) minmax(200px,1fr) minmax(300px,1.6fr); gap: 1rem; margin-bottom: 1rem; }
        .rg-card-center { display: flex; flex-direction: column; align-items: center; }
        .rg-card-evo { display: flex; flex-direction: column; }

        .gauge-wrap { display: flex; flex-direction: column; align-items: center; gap: .3rem; }
        .gauge-outer { position: relative; width: 190px; height: 95px; overflow: hidden; }
        .gauge-ring { position: absolute; top: 0; left: 0; width: 190px; height: 190px; border-radius: 50%;
          background: conic-gradient(from -90deg, #ff3355 0% 10%, #f97316 10% 20%, #fbbf24 20% 30%, #4ade80 30% 40%, #00ff88 40% 50%, transparent 50% 100%); }
        .gauge-hole { position: absolute; top: 25px; left: 25px; width: 140px; height: 140px; border-radius: 50%; background: #0a0d16; }
        .gauge-needle { position: absolute; bottom: 0; left: 50%; width: 3px; height: 86px; background: linear-gradient(to top, #fff, rgba(255,255,255,.3));
          transform-origin: bottom center; margin-left: -1.5px; border-radius: 2px; transition: transform .6s cubic-bezier(.34,1.4,.64,1); }
        .gauge-pivot { position: absolute; bottom: -6px; left: 50%; width: 12px; height: 12px; background: #fff; border-radius: 50%; margin-left: -6px; box-shadow: 0 0 8px rgba(255,255,255,.5); }
        .gauge-axis { display: flex; justify-content: space-between; width: 190px; font-size: .58rem; color: var(--text-muted); font-family: var(--font-mono); }
        .gauge-value { font-size: 2.1rem; font-weight: 900; margin-top: .2rem; line-height: 1; }
        .gauge-label { font-size: .66rem; font-weight: 800; padding: 3px 12px; border-radius: 20px; border: 1px solid; letter-spacing: .4px; margin-top: .15rem; }

        .conf-wrap { display: flex; flex-direction: column; align-items: center; gap: .5rem; }
        .conf-ring-box { position: relative; width: 120px; height: 120px; }
        .conf-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .conf-pct { font-size: 1.3rem; font-weight: 900; line-height: 1; }
        .conf-lbl { font-size: .54rem; font-weight: 800; letter-spacing: .06em; margin-top: 2px; }
        .conf-meta { display: flex; flex-direction: column; align-items: center; }
        .conf-meta-val { font-size: .76rem; font-weight: 800; color: var(--text-secondary); font-family: var(--font-mono); }
        .conf-meta-txt { font-size: .57rem; color: var(--text-muted); }

        .rg-evo-empty { flex: 1; display: flex; align-items: center; justify-content: center; text-align: center; font-size: .7rem; color: var(--text-muted); min-height: 150px; padding: 1rem; }

        .rg-why { margin-bottom: 1rem; }
        .rg-why-text { font-size: .72rem; color: #c3cbe0; line-height: 1.6; }

        .rg-mini-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: .6rem; margin-bottom: 1rem; }
        .rg-mini-card { background: rgba(8,10,18,.7); border: 1px solid rgba(99,149,255,.15); border-radius: 12px; padding: .6rem .75rem; }
        .rg-mini-label { font-size: .6rem; color: var(--text-muted); font-weight: 700; }
        .rg-mini-price { font-size: .82rem; font-weight: 800; margin: 3px 0; }
        .rg-mini-price.muted { color: var(--text-muted); }
        .rg-mini-change { font-size: .6rem; font-weight: 800; }
        .rg-mini-change.up { color: #4ade80; }
        .rg-mini-change.down { color: #ff3355; }

        .rg-grid-bottom { display: grid; grid-template-columns: 1.3fr 1fr 1fr 1fr; gap: 1rem; }
        .rg-heat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
        .rg-heat-cell { border-radius: 8px; padding: 6px 4px; font-size: .56rem; font-weight: 700; text-align: center; line-height: 1.4; }
        .rg-heat-cell.muted { background: rgba(255,255,255,.03); color: var(--text-muted); }

        .rg-radar-card { display: flex; flex-direction: column; align-items: center; }

        .rg-regime-empty, .rg-backtest-empty { font-size: .68rem; color: var(--text-muted); line-height: 1.5; }
        .rg-regime-list { display: flex; flex-direction: column; gap: .55rem; }
        .rg-regime-row { display: flex; align-items: center; gap: .5rem; font-size: .66rem; }
        .rg-regime-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .rg-regime-label { font-weight: 700; }
        .rg-regime-time { color: var(--text-muted); font-size: .6rem; }

        .rg-backtest { grid-column: 1 / -1; }

        @media (max-width: 1150px) {
          .rg-grid-top { grid-template-columns: 1fr 1fr; }
          .rg-card-evo { grid-column: 1 / -1; }
          .rg-grid-bottom { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 640px) {
          .rg-grid-top { grid-template-columns: 1fr; }
          .rg-grid-bottom { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default ResumoGeral;
