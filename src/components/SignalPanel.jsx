import React, { useMemo, useRef, useEffect } from 'react';

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

  // Momentum: simulated baseline from macro direction
  const momentumScore = macroScore > 0 ? Math.min(40, macroScore * 0.5) : Math.max(-40, macroScore * 0.5);
  const momentumLabel = momentumScore > 15 ? { label: 'ALTA', color: '#00ff88' }
    : momentumScore < -15 ? { label: 'QUEDA', color: '#ff3355' }
    : { label: 'LATERAL', color: '#6395ff' };

  // Weighted combined score
  // Macro: 60%, News: 25%, Momentum: 15%
  const combined = Math.round(macroScore * 0.60 + newsScore * 0.25 + momentumScore * 0.15);
  const levelKey = scoreToLevel(combined);
  const level    = SIGNAL_LEVELS[levelKey];

  const prev = usePrevSignal(levelKey);
  const changed = prev !== levelKey;

  const conviction = Math.min(98, Math.max(10, Math.round(50 + Math.abs(combined) * 0.65)));

  const sources = [
    {
      key:    'macro',
      label:  'Análise Macro (B3)',
      icon:   '🏦',
      score:  macroScore,
      weight: 60,
      status: macroDir,
      color:  macroDir === 'COMPRA' ? '#00ff88' : macroDir === 'VENDA' ? '#ff3355' : '#6395ff',
      note:   macroConv ? `Convicção ${macroConv}%` : 'SELIC · IPCA · USD/BRL',
    },
    {
      key:    'news',
      label:  'Sentimento de Notícias',
      icon:   '📰',
      score:  newsScore,
      weight: 25,
      status: newsSent.label,
      color:  newsSent.color,
      note:   lastAlert && lastAlert !== 'IGNORAR' ? `${lastAlert.strength || ''} · ${lastAlert.sector || ''}` : 'Nenhuma notícia analisada',
    },
    {
      key:    'momentum',
      label:  'Momentum de Mercado',
      icon:   '📈',
      score:  momentumScore,
      weight: 15,
      status: momentumLabel.label,
      color:  momentumLabel.color,
      note:   'Derivado da análise macro',
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
        {changed && <div className="sp-changed-badge">🔔 Sinal atualizado</div>}
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

export default SignalPanel;
