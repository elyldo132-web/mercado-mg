import React, { useMemo, useRef, useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { isB3Open, fetchBTC24h } from '../utils/MarketStatus';

// ── Signal aggregation ───────────────────────────────────────────────────────

const SIGNAL_LEVELS = {
  FORTE_COMPRA:   { label: 'FORTE COMPRA',   color: '#00ff88', bg: 'rgba(0,255,136,.10)', border: 'rgba(0,255,136,.40)', icon: '▲▲', glow: 'rgba(0,255,136,.45)', light: '#00ff88' },
  COMPRA:         { label: 'COMPRA',          color: '#4ade80', bg: 'rgba(74,222,128,.08)', border: 'rgba(74,222,128,.35)', icon: '▲',  glow: 'rgba(74,222,128,.30)', light: '#4ade80' },
  AGUARDAR:       { label: 'AGUARDAR',        color: '#fbbf24', bg: 'rgba(251,191,36,.08)', border: 'rgba(251,191,36,.30)', icon: '●',  glow: 'rgba(251,191,36,.25)', light: '#fbbf24' },
  VENDA:          { label: 'VENDA',           color: '#f97316', bg: 'rgba(249,115,22,.08)', border: 'rgba(249,115,22,.35)', icon: '▼',  glow: 'rgba(249,115,22,.30)', light: '#f97316' },
  FORTE_VENDA:    { label: 'FORTE VENDA',     color: '#ff3355', bg: 'rgba(255,51,85,.10)',  border: 'rgba(255,51,85,.40)',  icon: '▼▼', glow: 'rgba(255,51,85,.45)',  light: '#ff3355' },
};

const scoreToLevel = (score) => {
  if (score >= 75)  return 'FORTE_COMPRA';
  if (score >= 45)  return 'COMPRA';
  if (score >= -44) return 'AGUARDAR';
  if (score >= -74) return 'VENDA';
  return 'FORTE_VENDA';
};

const newsSentimentScore = (lastAlert) => {
  if (!lastAlert || lastAlert === 'IGNORAR') return 0;
  const action = lastAlert.tradeAction;
  const strength = lastAlert.strength;
  const mult = strength === 'Forte' ? 1.0 : strength === 'Médio' ? 0.6 : 0.3;
  if (action === 'Compra') return Math.round(60 * mult);
  if (action === 'Venda')  return Math.round(-60 * mult);
  return 0;
};

const newsSentimentLabel = (score) => {
  if (score >= 40)  return { label: 'OTIMISTA',  color: '#00ff88' };
  if (score >= 10)  return { label: 'POSITIVO',  color: '#4ade80' };
  if (score >= -9)  return { label: 'NEUTRO',    color: '#6395ff' };
  if (score >= -39) return { label: 'NEGATIVO',  color: '#f97316' };
  return               { label: 'PESSIMISTA', color: '#ff3355' };
};

// ── Histórico do sinal (localStorage) ────────────────────────────────────────

const HISTORY_KEY = 'signal_history';
const SAMPLE_INTERVAL_MS = 5 * 60 * 1000; // amostra a cada 5 min
const MAX_SAMPLES = 96; // ~8h de histórico

const loadSignalHistory = () => {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
};

const pushSignalSample = (sample) => {
  const hist = loadSignalHistory();
  const now = Date.now();
  const last = hist[hist.length - 1];
  if (last && now - last.t < SAMPLE_INTERVAL_MS) return hist;
  const next = [...hist, { t: now, ...sample }].slice(-MAX_SAMPLES);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
};

// ── Pulse animation (sound-like) ─────────────────────────────────────────────
const usePrevSignal = (signal) => {
  const ref = useRef(signal);
  useEffect(() => { ref.current = signal; }, [signal]);
  return ref.current;
};

// ── Component ────────────────────────────────────────────────────────────────

const SignalPanel = ({ macroSignal, lastAlert }) => {
  const macroScore  = macroSignal?.score   ?? 0;
  const macroDir    = macroSignal?.direction ?? 'NEUTRO';
  const macroConv   = macroSignal?.conviction ?? 50;

  const newsScore   = useMemo(() => newsSentimentScore(lastAlert), [lastAlert]);
  const newsSent    = useMemo(() => newsSentimentLabel(newsScore), [newsScore]);

  // B3 fechada → prioriza cripto (BTC 24h) como momentum, já que o macro Brasil fica parado à noite
  const b3Open = isB3Open();
  const [btc, setBtc] = useState(null);
  useEffect(() => {
    let alive = true;
    const load = () => fetchBTC24h().then(d => { if (alive) setBtc(d); }).catch(() => {});
    load();
    const t = setInterval(load, 120000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  // Momentum: baseline do macro (mercado aberto) ou BTC 24h (mercado fechado)
  const macroMomentum = macroScore > 0 ? Math.min(40, macroScore * 0.5) : Math.max(-40, macroScore * 0.5);
  const btcMomentum   = btc ? Math.max(-40, Math.min(40, btc.changePct * 3)) : macroMomentum;
  const momentumScore = b3Open ? macroMomentum : btcMomentum;
  const momentumLabel = momentumScore > 15 ? { label: 'ALTA', color: '#00ff88' }
    : momentumScore < -15 ? { label: 'QUEDA', color: '#ff3355' }
    : { label: 'LATERAL', color: '#6395ff' };

  // Pesos: com a B3 aberta o macro domina; fechada, o momentum 24h (cripto) ganha peso
  const WEIGHTS = b3Open
    ? { macro: 0.60, news: 0.25, momentum: 0.15 }
    : { macro: 0.20, news: 0.25, momentum: 0.55 };

  const combined = Math.round(macroScore * WEIGHTS.macro + newsScore * WEIGHTS.news + momentumScore * WEIGHTS.momentum);
  const levelKey = scoreToLevel(combined);
  const level    = SIGNAL_LEVELS[levelKey];

  const prev = usePrevSignal(levelKey);
  const changed = prev !== levelKey;

  // ── Histórico para o gráfico de evolução ────────────────────────────────
  const [history, setHistory] = useState(loadSignalHistory);
  const [showHistory, setShowHistory] = useState(false);
  useEffect(() => {
    setHistory(pushSignalSample({ macro: macroScore, news: newsScore, momentum: Math.round(momentumScore), combinado: combined }));
  }, [macroScore, newsScore, momentumScore, combined]);

  const chartData = history.map(h => ({
    time: h.t, Macro: h.macro, Notícias: h.news, Momentum: h.momentum, Combinado: h.combinado,
  }));

  const conviction = Math.min(98, Math.max(10, Math.round(50 + Math.abs(combined) * 0.65)));

  const sources = [
    {
      key:    'macro',
      label:  'Análise Macro (B3)',
      icon:   '🏦',
      score:  macroScore,
      weight: Math.round(WEIGHTS.macro * 100),
      status: macroDir,
      color:  macroDir === 'COMPRA' ? '#00ff88' : macroDir === 'VENDA' ? '#ff3355' : '#6395ff',
      note:   macroConv ? `Convicção ${macroConv}%` : 'SELIC · IPCA · USD/BRL',
    },
    {
      key:    'news',
      label:  'Sentimento de Notícias',
      icon:   '📰',
      score:  newsScore,
      weight: Math.round(WEIGHTS.news * 100),
      status: newsSent.label,
      color:  newsSent.color,
      note:   lastAlert && lastAlert !== 'IGNORAR' ? `${lastAlert.strength || ''} · ${lastAlert.sector || ''}` : 'Nenhuma notícia analisada',
    },
    {
      key:    'momentum',
      label:  b3Open ? 'Momentum de Mercado' : 'Momentum (BTC 24h)',
      icon:   b3Open ? '📈' : '₿',
      score:  Math.round(momentumScore),
      weight: Math.round(WEIGHTS.momentum * 100),
      status: momentumLabel.label,
      color:  momentumLabel.color,
      note:   b3Open ? 'Derivado da análise macro' : (btc ? `BTC 24h: ${btc.changePct > 0 ? '+' : ''}${btc.changePct.toFixed(1)}%` : 'Buscando BTC 24h...'),
    },
  ];

  return (
    <div className={`signal-panel ${changed ? 'signal-changed' : ''}`}
      style={{ '--sc': level.color, '--sg': level.glow, '--sb': level.border, '--sbg': level.bg }}>

      {/* ── Main signal ─────────────────────────────────────────── */}
      <div className="sp-main">
        <div className="sp-traffic">
          {['FORTE_COMPRA','COMPRA','AGUARDAR','VENDA','FORTE_VENDA'].map(k => (
            <div key={k} className={`sp-light ${levelKey === k ? 'lit' : ''}`}
              style={{ '--lc': SIGNAL_LEVELS[k].light }}>
            </div>
          ))}
        </div>

        <div className="sp-verdict">
          <div className="sp-icon">{level.icon}</div>
          <div>
            <div className="sp-label">{level.label}</div>
            <div className="sp-sub">Sinal Consolidado</div>
          </div>
        </div>

        <div className="sp-conv-wrap">
          <div className="sp-conv-label">Convicção</div>
          <div className="sp-conv-bar-outer">
            <div className="sp-conv-bar-fill"
              style={{ width: `${conviction}%`, background: `linear-gradient(90deg,${level.color}66,${level.color})`, boxShadow: `0 0 12px ${level.color}55` }}>
            </div>
          </div>
          <div className="sp-conv-value">{conviction}%</div>
        </div>

        <div className="sp-score-pill">
          <span className="sp-score-label">Score</span>
          <span className="sp-score-val" style={{ color: level.color }}>{combined > 0 ? '+' : ''}{combined}</span>
        </div>
      </div>

      {/* ── Sub signals ─────────────────────────────────────────── */}
      <div className="sp-sources">
        {sources.map(s => {
          const barW = Math.min(100, Math.abs(s.score) * 1.4);
          const barC = s.score > 0 ? '#00ff88' : s.score < 0 ? '#ff3355' : '#6395ff';
          return (
            <div key={s.key} className="sp-source-row">
              <div className="sp-source-left">
                <span className="sp-source-icon">{s.icon}</span>
                <div>
                  <div className="sp-source-label">{s.label}</div>
                  <div className="sp-source-note">{s.note}</div>
                </div>
              </div>
              <div className="sp-source-right">
                <div className="sp-mini-bar-wrap">
                  <div className="sp-mini-bar" style={{ width: `${barW}%`, background: barC }}></div>
                </div>
                <span className="sp-source-score" style={{ color: barC }}>
                  {s.score > 0 ? '+' : ''}{s.score}
                </span>
                <span className="sp-source-status" style={{ color: s.color, borderColor: s.color + '44', background: s.color + '12' }}>
                  {s.status}
                </span>
                <span className="sp-weight">{s.weight}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Evolução do sinal ───────────────────────────────────── */}
      {chartData.length >= 2 && (
        <div className="sp-history">
          <button className="sp-history-toggle" onClick={() => setShowHistory(v => !v)}>
            {showHistory ? 'Ocultar evolução do sinal ▲' : 'Ver evolução do sinal ▼'}
          </button>
          {showHistory && (
          <>
          <div className="sp-history-title">Evolução do Sinal — últimas horas</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ top: 6, right: 8, bottom: 0, left: -12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
              <XAxis
                dataKey="time" tick={{ fontSize: 9, fill: 'rgba(255,255,255,.4)' }}
                tickFormatter={(t) => new Date(t).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                axisLine={{ stroke: 'rgba(255,255,255,.1)' }} tickLine={false}
              />
              <YAxis tick={{ fontSize: 9, fill: 'rgba(255,255,255,.4)' }} axisLine={false} tickLine={false} width={30} />
              <Tooltip
                contentStyle={{ background: '#0a0d14', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, fontSize: 11 }}
                labelFormatter={(t) => new Date(t).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Line type="monotone" dataKey="Macro"     stroke="#6395ff" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="Notícias"  stroke="#a855f7" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="Momentum"  stroke="#fbbf24" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="Combinado" stroke="#00ff88" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          </>
          )}
        </div>
      )}

      {/* ── Action row ──────────────────────────────────────────── */}
      <div className="sp-action">
        {levelKey === 'AGUARDAR' ? (
          <div className="sp-wait-msg">
            ● Score neutro — aguardar sinal mais claro antes de abrir posição.
          </div>
        ) : (
          <div className="sp-action-msg" style={{ color: level.color }}>
            {level.icon} {level.label}: consulte o setup no painel de Análise Macro acima.
          </div>
        )}
      </div>

      <style jsx="true">{`
        .signal-panel {
          background: linear-gradient(135deg,rgba(8,10,18,.97),rgba(12,16,28,.97));
          border: 1px solid var(--sb); border-radius: 16px; padding: 1.1rem;
          margin-bottom: 1.2rem;
          box-shadow: 0 0 30px var(--sg,transparent);
          transition: box-shadow .4s ease;
        }
        .signal-changed { animation: signalFlash .6s ease; }
        @keyframes signalFlash { 0%,100%{opacity:1} 50%{opacity:.7} }

        .sp-main {
          display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;
          padding-bottom: .9rem; border-bottom: 1px solid rgba(255,255,255,.06); margin-bottom: .85rem;
        }

        .sp-traffic { display: flex; flex-direction: column; gap: .25rem; padding: .2rem; }
        .sp-light {
          width: 10px; height: 10px; border-radius: 50%;
          background: rgba(255,255,255,.08); transition: all .4s;
        }
        .sp-light.lit {
          background: var(--lc); box-shadow: 0 0 10px var(--lc), 0 0 20px var(--lc)44;
        }

        .sp-verdict { display: flex; align-items: center; gap: .65rem; flex: 1; min-width: 140px; }
        .sp-icon  { font-size: 1.9rem; color: var(--sc); text-shadow: 0 0 18px var(--sc); line-height: 1; }
        .sp-label { font-size: 1.1rem; font-weight: 900; color: var(--sc); letter-spacing: -.5px; }
        .sp-sub   { font-size: .6rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: .06em; }

        .sp-conv-wrap { flex: 1; min-width: 120px; display: flex; flex-direction: column; gap: .28rem; }
        .sp-conv-label { font-size: .57rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: .06em; }
        .sp-conv-bar-outer { height: 7px; background: rgba(255,255,255,.06); border-radius: 999px; overflow: hidden; }
        .sp-conv-bar-fill  { height: 100%; border-radius: 999px; transition: width .8s cubic-bezier(.4,0,.2,1); }
        .sp-conv-value { font-size: .82rem; font-weight: 800; color: var(--sc); font-family: var(--font-mono); }

        .sp-score-pill {
          display: flex; flex-direction: column; align-items: center;
          padding: .5rem .85rem; border-radius: 10px;
          border: 1px solid var(--sb); background: var(--sbg);
        }
        .sp-score-label { font-size: .52rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: .06em; }
        .sp-score-val   { font-size: 1.3rem; font-weight: 900; font-family: var(--font-mono); }

        .sp-sources { display: flex; flex-direction: column; gap: .22rem; margin-bottom: .8rem; }
        .sp-source-row {
          display: flex; align-items: center; justify-content: space-between; gap: .5rem;
          padding: .45rem .6rem; border-radius: 8px;
          background: rgba(255,255,255,.025); border: 1px solid rgba(255,255,255,.04);
        }
        .sp-source-left  { display: flex; align-items: center; gap: .45rem; flex: 1; min-width: 0; }
        .sp-source-icon  { font-size: .9rem; flex-shrink: 0; }
        .sp-source-label { font-size: .65rem; color: var(--text-secondary); font-weight: 600; }
        .sp-source-note  { font-size: .57rem; color: var(--text-muted); }
        .sp-source-right { display: flex; align-items: center; gap: .4rem; flex-shrink: 0; }
        .sp-mini-bar-wrap { width: 48px; height: 4px; background: rgba(255,255,255,.06); border-radius: 999px; overflow: hidden; }
        .sp-mini-bar      { height: 100%; border-radius: 999px; transition: width .5s; }
        .sp-source-score  { font-size: .62rem; font-weight: 800; font-family: var(--font-mono); min-width: 22px; text-align: right; }
        .sp-source-status {
          font-size: .5rem; font-weight: 800; padding: 1px 5px; border-radius: 4px;
          border: 1px solid; text-transform: uppercase; letter-spacing: .4px; white-space: nowrap;
        }
        .sp-weight { font-size: .55rem; color: var(--text-muted); min-width: 24px; text-align: right; }

        .sp-history { margin-bottom: .8rem; }
        .sp-history-toggle {
          width: 100%; font-size: .6rem; font-weight: 700; color: var(--text-muted);
          background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.07);
          border-radius: 8px; padding: .4rem .6rem; cursor: pointer; transition: all .15s;
        }
        .sp-history-toggle:hover { background: rgba(255,255,255,.06); color: var(--text-secondary); }
        .sp-history-title {
          font-size: .58rem; font-weight: 800; color: var(--text-muted);
          text-transform: uppercase; letter-spacing: .08em; margin-bottom: .3rem;
        }

        .sp-action { display: flex; align-items: center; justify-content: space-between; gap: .5rem; flex-wrap: wrap; }
        .sp-action-msg { font-size: .73rem; font-weight: 700; }
        .sp-wait-msg   { font-size: .73rem; color: #fbbf24; }
        .sp-changed-badge {
          font-size: .6rem; font-weight: 800; padding: .25rem .6rem;
          background: rgba(251,191,36,.15); border: 1px solid rgba(251,191,36,.35); border-radius: 999px;
          color: #fbbf24; animation: pulse 1.5s infinite;
        }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
      `}</style>
    </div>
  );
};

export default React.memo(SignalPanel);
