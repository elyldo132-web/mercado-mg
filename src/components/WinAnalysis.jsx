import React, { useState, useEffect, useCallback, useRef } from 'react';

// ── Macro scoring functions ──────────────────────────────────────────────────

const scoreSelic = (s) => {
  if (s <= 9.5)   return { score: +52, status: 'MUITO EXPANSIONISTA', color: '#00ff88' };
  if (s <= 11.5)  return { score: +24, status: 'EXPANSIONISTA',       color: '#4ade80' };
  if (s <= 13.25) return { score:   0, status: 'NEUTRO',              color: '#6395ff' };
  if (s <= 14.75) return { score: -24, status: 'RESTRITIVO',          color: '#fbbf24' };
  return           { score: -48, status: 'MUITO RESTRITIVO',           color: '#ff3355' };
};

const scoreSelicTrend = (cur, prev) => {
  const diff = cur - prev;
  if (diff < -0.25)          return { score: +32, status: 'CICLO DE CORTES', color: '#00ff88' };
  if (diff < -0.01)          return { score: +16, status: 'CORTE RECENTE',   color: '#4ade80' };
  if (Math.abs(diff) <= 0.01) return { score:  0, status: 'PAUSA',           color: '#6395ff' };
  if (diff < 0.50)           return { score: -18, status: 'ALTA RECENTE',    color: '#f97316' };
  return                      { score: -34, status: 'CICLO DE ALTA',          color: '#ff3355' };
};

const scoreIpca = (i) => {
  if (i <= 3.5)  return { score: +22, status: 'CONTROLADA',      color: '#00ff88' };
  if (i <= 4.5)  return { score:  +8, status: 'NA META',         color: '#4ade80' };
  if (i <= 6.0)  return { score:  -8, status: 'ACIMA DA META',   color: '#fbbf24' };
  if (i <= 8.0)  return { score: -20, status: 'PRESSIONADA',     color: '#f97316' };
  return          { score: -36, status: 'FORA DE CONTROLE',       color: '#ff3355' };
};

const scoreUsdBrl = (r) => {
  if (r <= 4.80) return { score: +28, status: 'REAL FORTE',      color: '#00ff88' };
  if (r <= 5.10) return { score: +10, status: 'ESTÁVEL',         color: '#4ade80' };
  if (r <= 5.40) return { score:  -8, status: 'DEPRECIANDO',     color: '#fbbf24' };
  if (r <= 5.80) return { score: -22, status: 'PRESSÃO CAMBIAL', color: '#f97316' };
  return          { score: -38, status: 'CRISE CAMBIAL',          color: '#ff3355' };
};

const scoreCommodities = (ibovChange) => {
  const v = ibovChange ?? 0;
  if (v > 1.5)   return { score: +20, status: 'BULL CYCLE',    color: '#00ff88' };
  if (v > 0.3)   return { score: +10, status: 'ALTA',          color: '#4ade80' };
  if (v > -0.3)  return { score:   0, status: 'LATERALIZAÇÃO', color: '#6395ff' };
  if (v > -1.5)  return { score: -10, status: 'QUEDA',         color: '#fbbf24' };
  return          { score: -20, status: 'BEAR',                  color: '#ff3355' };
};

const WEIGHTS = {
  selic:        0.24,
  selicTrend:   0.15,
  ipca:         0.14,
  usdBrl:       0.16,
  commodities:  0.10,
  geopolitical: 0.12,
  fiscal:       0.05,
  globalRisk:   0.04,
};

const FISCAL_DEFAULT = { score: -12, status: 'DÉFICIT PRIMÁRIO', color: '#fbbf24' };
const GLOBAL_DEFAULT = { score: -5,  status: 'S&P NEUTRO / VIX MODERADO', color: '#6395ff' };

// Geopolítica: score dinâmico baseado na última notícia analisada
const scoreGeopolitical = (alert) => {
  if (!alert || alert === 'IGNORAR') return { score: -5, status: 'INCERTO', color: '#fbbf24' };
  const drivers = Array.isArray(alert.drivers) ? alert.drivers : [];
  const sector  = alert.sector  || '';
  const impact  = alert.impact  || {};
  const action  = alert.tradeAction || '';
  if (sector === 'Geopolítica' || drivers.includes('Segurança') || drivers.includes('Geopolítica'))
    return { score: -28, status: 'TENSÃO GLOBAL',   color: '#ff3355' };
  if (impact.win === 'Alta'  && action === 'Compra') return { score: +18, status: 'FLUXO POSITIVO', color: '#00ff88' };
  if (impact.win === 'Queda' && action === 'Venda')  return { score: -18, status: 'FLUXO NEGATIVO', color: '#f97316' };
  if (sector === 'Commodities' && impact.win === 'Alta') return { score: +12, status: 'COMMODITIES +', color: '#4ade80' };
  if (action === 'Venda')  return { score: -10, status: 'ADVERSO',   color: '#fbbf24' };
  if (action === 'Compra') return { score: +10, status: 'FAVORÁVEL', color: '#4ade80' };
  return { score: -5, status: 'NEUTRO', color: '#6395ff' };
};

// ── Compass gauge SVG ───────────────────────────────────────────────────────

const CompassGauge = ({ score, direction, maxScore = 38 }) => {
  const clamped = Math.max(-maxScore, Math.min(maxScore, score));
  const angle   = (clamped / maxScore) * 82;
  const cx = 100, cy = 90, r = 70;
  const { color, glow } = direction;
  return (
    <svg viewBox="0 0 200 130" style={{ width: '100%', maxWidth: '270px', display: 'block', margin: '0 auto', overflow: 'visible' }}>
      <defs>
        <linearGradient id="gWin" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#ff3355"/>
          <stop offset="28%"  stopColor="#f97316"/>
          <stop offset="50%"  stopColor="#fbbf24"/>
          <stop offset="72%"  stopColor="#4ade80"/>
          <stop offset="100%" stopColor="#00ff88"/>
        </linearGradient>
        <filter id="nGlw">
          <feGaussianBlur stdDeviation="3" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {/* Track */}
      <path d={`M ${cx-r},${cy} A ${r},${r} 0 0,1 ${cx+r},${cy}`}
        fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="18" strokeLinecap="round"/>
      {/* Colored arc */}
      <path d={`M ${cx-r},${cy} A ${r},${r} 0 0,1 ${cx+r},${cy}`}
        fill="none" stroke="url(#gWin)" strokeWidth="13" strokeLinecap="round" opacity="0.8"/>
      {/* Center tick */}
      <line x1={cx} y1={cy-r-7} x2={cx} y2={cy-r+5}
        stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
      {/* Needle group */}
      <g transform={`rotate(${angle}, ${cx}, ${cy})`} filter="url(#nGlw)">
        <line x1={cx} y1={cy+12} x2={cx} y2={cy-r+13} stroke={color} strokeWidth="3" strokeLinecap="round"/>
        <polygon points={`${cx},${cy-r+9} ${cx-5},${cy-r+21} ${cx+5},${cy-r+21}`} fill={color}/>
      </g>
      {/* Hub */}
      <circle cx={cx} cy={cy} r="9" fill="#0a0d14" stroke={color} strokeWidth="2.5"/>
      <circle cx={cx} cy={cy} r="3.5" fill={color}/>
      {/* Labels */}
      <text x="22"  y="107" fontSize="8" fill="#ff3355cc" textAnchor="middle" fontWeight="800" fontFamily="system-ui">QUEDA</text>
      <text x="100" y="28"  fontSize="7" fill="rgba(255,255,255,0.3)" textAnchor="middle" fontFamily="system-ui">NEUTRO</text>
      <text x="178" y="107" fontSize="8" fill="#00ff88cc" textAnchor="middle" fontWeight="800" fontFamily="system-ui">ALTA</text>
      {/* Score */}
      <text x={cx} y="118" fontSize="15" fill={color} textAnchor="middle" fontWeight="900" fontFamily="monospace">
        {score > 0 ? '+' : ''}{score}
      </text>
      <text x={cx} y="128" fontSize="7" fill="rgba(255,255,255,0.3)" textAnchor="middle" fontFamily="system-ui">
        SCORE MACRO
      </text>
    </svg>
  );
};

const getDirection = (t) => {
  if (t >=  40) return { dir: 'COMPRA', strength: 'FORTE',    color: '#00ff88', icon: '▲▲', glow: 'rgba(0,255,136,.4)' };
  if (t >=  15) return { dir: 'COMPRA', strength: 'MODERADA', color: '#4ade80', icon: '▲',  glow: 'rgba(74,222,128,.3)' };
  if (t >= -15) return { dir: 'NEUTRO', strength: 'AGUARDAR', color: '#6395ff', icon: '●',  glow: 'rgba(99,149,255,.2)' };
  if (t >= -40) return { dir: 'VENDA',  strength: 'MODERADA', color: '#f97316', icon: '▼',  glow: 'rgba(249,115,22,.3)' };
  return         { dir: 'VENDA',  strength: 'FORTE',    color: '#ff3355', icon: '▼▼', glow: 'rgba(255,51,85,.4)' };
};

const pts = (n) => Math.round(n).toLocaleString('pt-BR');

const buildSetup = (ibov, total, direction) => {
  if (direction.dir === 'NEUTRO' || !ibov) return null;

  const P = ibov;
  const isCompra  = direction.dir === 'COMPRA';
  const absTotal  = Math.abs(total);
  const highConv  = absTotal >= 38;

  const stopPct  = highConv ? 0.010 : 0.014;
  const t1Pct    = highConv ? 0.020 : 0.018;
  const t2Pct    = highConv ? 0.038 : 0.028;
  const pullPct  = 0.003;

  const d = isCompra ? 1 : -1;

  const entry   = P;
  const pull    = Math.round(P * (1 - d * pullPct));
  const stop    = Math.round(P * (1 + d * stopPct));
  const t1      = Math.round(P * (1 + d * t1Pct));
  const t2      = Math.round(P * (1 + d * t2Pct));

  const stopDist = Math.abs(stop - entry);

  return {
    entry: pts(entry), pull: pts(pull),
    stop:  pts(stop),  stopDelta: stopDist, stopPct: (stopPct * 100).toFixed(1),
    t1:    pts(t1),    t1Delta:   Math.abs(t1 - entry), t1Pct: (t1Pct * 100).toFixed(1),
    t2:    pts(t2),    t2Delta:   Math.abs(t2 - entry), t2Pct: (t2Pct * 100).toFixed(1),
    rr1:  (Math.abs(t1 - entry) / stopDist).toFixed(1),
    rr2:  (Math.abs(t2 - entry) / stopDist).toFixed(1),
    validity:   highConv ? 'Swing 2-3 sessões' : 'Intraday / overnight',
    conviction: Math.min(94, Math.round(40 + absTotal * 1.3)),
    isCompra,
    color:     direction.color,
    glow:      direction.glow,
    icon:      direction.icon,
    strength:  direction.strength,
    dir:       direction.dir,
  };
};

// ── Component ────────────────────────────────────────────────────────────────

const WinAnalysis = ({ currentWin, currentDolar, onSignal, lastAlert, asset }) => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Controle interno
  const lastAlertRef  = useRef(lastAlert);
  const hasLoadedOnce = useRef(false);
  const prevIbovRef   = useRef(null);
  const macroKeyRef   = useRef(null);
  useEffect(() => { lastAlertRef.current = lastAlert; }, [lastAlert]);

  const load = useCallback(async () => {
    // Só mostra spinner na primeira carga — atualizações seguintes são silenciosas
    if (!hasLoadedOnce.current) setLoading(true);
    try {
      const [selicRes, ipcaRes, fxRes, ibovRes] = await Promise.allSettled([
        fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/2?formato=json').then(r => r.json()),
        fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.13522/dados/ultimos/1?formato=json').then(r => r.json()),
        fetch('https://open.er-api.com/v6/latest/USD').then(r => r.json()),
        fetch('https://brapi.dev/api/quote/%5EBVSP').then(r => r.json()),
      ]);

      // ── SELIC
      let selic = 14.75, selicPrev = 14.75;
      if (selicRes.status === 'fulfilled' && Array.isArray(selicRes.value) && selicRes.value.length) {
        const arr = selicRes.value;
        selic     = parseFloat(arr[arr.length - 1].valor.replace(',', '.'));
        selicPrev = arr.length >= 2 ? parseFloat(arr[0].valor.replace(',', '.')) : selic;
      }

      // ── IPCA 12M
      let ipca = 5.2;
      if (ipcaRes.status === 'fulfilled' && Array.isArray(ipcaRes.value) && ipcaRes.value.length) {
        ipca = parseFloat(ipcaRes.value[0].valor.replace(',', '.'));
      }

      // ── USD/BRL
      let usdBrl = currentDolar || 5.25;
      if (fxRes.status === 'fulfilled' && fxRes.value?.result === 'success') {
        usdBrl = parseFloat((fxRes.value.rates?.BRL ?? usdBrl).toFixed(4));
      }

      // ── IBOV
      let ibovPrice = currentWin || 135000;
      let ibovChangePct = null;
      if (ibovRes.status === 'fulfilled') {
        const r = ibovRes.value?.results?.[0];
        if (r?.regularMarketPrice) {
          ibovPrice     = r.regularMarketPrice;
          ibovChangePct = r.regularMarketChangePercent ?? null;
        }
      }
      prevIbovRef.current = Math.round(ibovPrice);
      const ibovChange = ibovChangePct;

      // ── Scores
      const fSelic = scoreSelic(selic);
      const fTrend = scoreSelicTrend(selic, selicPrev);
      const fIpca  = scoreIpca(ipca);
      const fUsd   = scoreUsdBrl(usdBrl);
      const fComm  = scoreCommodities(ibovChange);
      const fGeo   = scoreGeopolitical(lastAlertRef.current);

      const rawScore =
        fSelic.score * WEIGHTS.selic +
        fTrend.score * WEIGHTS.selicTrend +
        fIpca.score  * WEIGHTS.ipca +
        fUsd.score   * WEIGHTS.usdBrl +
        fComm.score  * WEIGHTS.commodities +
        fGeo.score   * WEIGHTS.geopolitical +
        FISCAL_DEFAULT.score * WEIGHTS.fiscal +
        GLOBAL_DEFAULT.score * WEIGHTS.globalRisk;

      const total     = Math.round(rawScore);
      const direction = getDirection(total);
      const setup     = buildSetup(ibovPrice, total, direction);

      const trendLabel = selic < selicPrev ? '▼ Cortes' : selic > selicPrev ? '▲ Alta' : '— Pausa';

      // Divergência: preço sobe mas macro é negativa (ou vice-versa)
      let divergence = null;
      if (ibovChange != null) {
        if (ibovChange > 0.5 && total < -10)
          divergence = { type: 'bearish', msg: `⚠️ DIVERGÊNCIA BEARISH — B3 +${ibovChange.toFixed(2)}% mas macro Score ${total}. Rally pode não sustentar.` };
        else if (ibovChange < -0.5 && total < -15)
          divergence = { type: 'confirmed', msg: `🔴 QUEDA CONFIRMADA — B3 ${ibovChange.toFixed(2)}% alinha com Score macro ${total}. Sem suporte comprador.` };
        else if (ibovChange < -0.3 && total > 15)
          divergence = { type: 'bullish', msg: `⚠️ DIVERGÊNCIA ALTISTA — B3 ${ibovChange.toFixed(2)}% mas macro Score +${total}. Pode ser oportunidade de compra.` };
      }

      // Só re-renderiza se SELIC, IPCA ou câmbio (1 decimal) mudaram — ignora micro-variações de score
      const macroKey = `${selic.toFixed(2)}|${selicPrev.toFixed(2)}|${ipca.toFixed(1)}|${usdBrl.toFixed(1)}`;
      if (macroKey !== macroKeyRef.current) {
        macroKeyRef.current = macroKey;
        setData({
          selic, selicPrev, ipca, usdBrl, ibovPrice, ibovChange,
          total, direction, setup, divergence,
          factors: [
            { label: 'SELIC Meta',     value: `${selic.toFixed(2)}% a.a.`,  icon: '🏦', ...fSelic, w: WEIGHTS.selic },
            { label: 'Ciclo de Juros', value: trendLabel,                   icon: '📉', ...fTrend, w: WEIGHTS.selicTrend },
            { label: 'IPCA 12 meses',  value: `${ipca.toFixed(2)}%`,        icon: '📊', ...fIpca,  w: WEIGHTS.ipca },
            { label: 'USD/BRL',        value: `R$ ${usdBrl.toFixed(4)}`,    icon: '💵', ...fUsd,   w: WEIGHTS.usdBrl },
            { label: 'Commodities',    value: ibovChange != null ? `B3 ${ibovChange > 0 ? '+' : ''}${ibovChange.toFixed(2)}%` : '—', icon: '🛢', ...fComm, w: WEIGHTS.commodities },
            { label: 'Geopolítica',    value: fGeo.status,                  icon: '🌍', ...fGeo,   w: WEIGHTS.geopolitical },
            { label: 'Risco Fiscal',   value: 'Déficit primário',            icon: '🏛', ...FISCAL_DEFAULT, w: WEIGHTS.fiscal },
            { label: 'Risco Global',   value: 'S&P / VIX',                  icon: '🌐', ...GLOBAL_DEFAULT, w: WEIGHTS.globalRisk },
          ],
        });
        if (onSignal) {
          onSignal({ score: total, direction: direction.dir, conviction: setup?.conviction ?? 50 });
        }
      }

      hasLoadedOnce.current = true;
    } catch (err) {
      console.error('WinAnalysis error:', err);
    } finally {
      setLoading(false);
    }
  }, [currentWin, currentDolar]);

  useEffect(() => {
    load();
    const t = setInterval(load, 120000);
    return () => clearInterval(t);
  }, [load]);

  const setup = data?.setup;
  const dir   = data?.direction;

  return (
    <div className="win-analysis">
      {loading && !data ? (
        <div className="win-loading">
          <div className="win-scan"><div className="win-scan-bar"></div></div>
          <span>Carregando dados macro do BCB...</span>
        </div>
      ) : data ? (
        <div className="win-body">

          {/* ── COMPASS GAUGE (full-width) ────────────────────────────── */}
          <div className="win-compass-wrap">
            <div className="compass-title">
              Indicador Direcional {asset && asset.key !== 'WIN' ? asset.label : 'WINFUT'}
              <span className="compass-sub">
                {asset && !['WIN', 'DOL'].includes(asset.key) ? 'Contexto macro Brasil (backdrop)' : 'Macro + Geopolítica'}
              </span>
            </div>
            <div className="compass-gauge-area">
              <CompassGauge score={data.total} direction={data.direction} />
              <div className="compass-side-info">
                <div className="csi-dir" style={{ color: data.direction.color, textShadow: `0 0 16px ${data.direction.color}` }}>
                  {data.direction.icon} {data.direction.dir}
                </div>
                <div className="csi-strength">{data.direction.strength}</div>
                {data.divergence && (
                  <div className={`csi-divergence ${data.divergence.type}`}>
                    {data.divergence.msg}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── SCORECARD ────────────────────────────────────────────── */}
          <div className="win-scorecard">
            <div className="win-scorecard-title">Fatores Macroeconômicos</div>
            <div className="win-factors">
              {data.factors.map(f => {
                const absScore = Math.abs(f.score);
                const barW     = Math.min(100, absScore * 1.8);
                const barCol   = f.score > 0 ? '#00ff88' : f.score < 0 ? '#ff3355' : '#6395ff';
                return (
                  <div key={f.label} className="factor-row">
                    <div className="factor-left">
                      <span className="factor-icon">{f.icon}</span>
                      <div>
                        <div className="factor-label">{f.label}</div>
                        <div className="factor-value font-mono">{f.value}</div>
                      </div>
                    </div>
                    <div className="factor-right">
                      <div className="factor-bar-wrap">
                        <div className="factor-bar" style={{ width: `${barW}%`, background: barCol, boxShadow: `0 0 6px ${barCol}88` }}></div>
                      </div>
                      <span className="factor-score" style={{ color: barCol }}>
                        {f.score > 0 ? '+' : ''}{f.score}
                      </span>
                      <span className="factor-tag" style={{ color: f.color, borderColor: f.color + '44', background: f.color + '14' }}>
                        {f.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total score bar */}
            <div className="total-score-row">
              <span className="total-score-label">SCORE MACRO TOTAL</span>
              <div className="total-bar-wrap">
                <div className="total-bar-track negative">
                  <div className="total-bar-fill"
                    style={{
                      width:  `${Math.abs(Math.min(0, data.total)) / 50 * 50}%`,
                      background: '#ff3355',
                      right: '50%', left: 'unset',
                      boxShadow: '0 0 12px rgba(255,51,85,.5)',
                    }}>
                  </div>
                </div>
                <div className="total-bar-track positive">
                  <div className="total-bar-fill"
                    style={{
                      width:  `${Math.abs(Math.max(0, data.total)) / 50 * 50}%`,
                      background: '#00ff88',
                      boxShadow: '0 0 12px rgba(0,255,136,.5)',
                    }}>
                  </div>
                </div>
              </div>
              <span className="total-score-value font-mono" style={{ color: dir?.color }}>
                {data.total > 0 ? '+' : ''}{data.total}
              </span>
            </div>
          </div>

          {/* ── DIRECTION + SETUP ─────────────────────────────────────── */}
          <div className="win-right">

            {/* Direction verdict */}
            <div className="win-verdict" style={{ borderColor: dir?.color + '44', background: dir?.glow?.replace('.4', '.06') }}>
              <div className="verdict-icon" style={{ color: dir?.color, textShadow: `0 0 20px ${dir?.color}` }}>
                {dir?.icon}
              </div>
              <div>
                <div className="verdict-dir" style={{ color: dir?.color }}>{dir?.dir}</div>
                <div className="verdict-strength">{dir?.strength}</div>
              </div>
              {setup && (
                <div className="verdict-conviction">
                  <div className="conv-label">Convicção</div>
                  <div className="conv-bar-wrap">
                    <div className="conv-bar"
                      style={{ width: `${setup.conviction}%`, background: `linear-gradient(90deg, ${dir.color}88, ${dir.color})`, boxShadow: `0 0 10px ${dir.color}66` }}>
                    </div>
                  </div>
                  <div className="conv-value" style={{ color: dir?.color }}>{setup.conviction}%</div>
                </div>
              )}
            </div>

            {/* Trade Setup */}
            {setup ? (
              <div className="win-setup">
                <div className="setup-title">Setup de Trade — WINFUT</div>

                <div className="setup-grid">
                  {/* Entry */}
                  <div className="setup-block entry-block">
                    <div className="setup-block-label">ENTRADA</div>
                    <div className="setup-block-value font-mono">{setup.entry}</div>
                    <div className="setup-block-sub">pts · a mercado</div>
                    <div className="setup-block-alt">Pullback: <span className="font-mono">{setup.pull}</span></div>
                  </div>

                  {/* Stop */}
                  <div className="setup-block stop-block">
                    <div className="setup-block-label">STOP LOSS</div>
                    <div className="setup-block-value font-mono stop-val">{setup.stop}</div>
                    <div className="setup-block-sub">
                      -{setup.stopPct}% · {Math.round(setup.stopDelta).toLocaleString('pt-BR')} pts
                    </div>
                    <div className="setup-block-alt">Risco por contrato (mini): R$ {(setup.stopDelta * 0.20).toFixed(0)}</div>
                  </div>
                </div>

                <div className="setup-targets">
                  {/* T1 */}
                  <div className="target-row t1">
                    <div className="target-label">ALVO 1</div>
                    <div className="target-value font-mono">{setup.t1} pts</div>
                    <div className="target-meta">
                      <span className="target-pct">{setup.isCompra ? '+' : '-'}{setup.t1Pct}%</span>
                      <span className="target-rr" style={{ color: setup.color }}>R:R 1:{setup.rr1}</span>
                      <span className="target-gain">+R$ {(setup.t1Delta * 0.20).toFixed(0)} / mini</span>
                    </div>
                  </div>

                  {/* T2 */}
                  <div className="target-row t2">
                    <div className="target-label">ALVO 2</div>
                    <div className="target-value font-mono">{setup.t2} pts</div>
                    <div className="target-meta">
                      <span className="target-pct">{setup.isCompra ? '+' : '-'}{setup.t2Pct}%</span>
                      <span className="target-rr" style={{ color: setup.color }}>R:R 1:{setup.rr2}</span>
                      <span className="target-gain">+R$ {(setup.t2Delta * 0.20).toFixed(0)} / mini</span>
                    </div>
                  </div>
                </div>

                <div className="setup-footer">
                  <span className="setup-validity">⏱ {setup.validity}</span>
                  <span className="setup-warn">⚠️ Sempre use stop loss. Análise não é recomendação.</span>
                </div>
              </div>
            ) : (
              <div className="win-neutral-msg">
                <div style={{ fontSize: '2rem' }}>●</div>
                <strong>Score NEUTRO</strong>
                <p>Fatores macro sem direção clara.<br />Aguardar gatilho antes de operar.</p>
              </div>
            )}

            {/* Macro Reading */}
            <div className="win-reading">
              <div className="reading-title">Leitura Macro</div>
              <p className="reading-text">{buildReading(data)}</p>
            </div>

          </div>
        </div>
      ) : null}

      <style jsx="true">{`
        .win-analysis {
          background: linear-gradient(135deg,rgba(8,10,18,.97),rgba(12,16,28,.97));
          border: 1px solid rgba(16,185,129,.18);
          border-radius: 16px;
          padding: 1.4rem;
          margin-bottom: 1.5rem;
        }

        /* Header */
        .win-header {
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: .75rem; margin-bottom: 1.2rem;
          padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,.06);
        }
        .win-title-group { display: flex; align-items: center; gap: .7rem; }
        .win-flag { font-size: 1.6rem; }
        .win-title {
          font-size: 1.05rem; font-weight: 800; margin: 0;
          background: linear-gradient(135deg,#10b981,#06b6d4,#a855f7);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .win-sub { font-size: .62rem; color: var(--text-muted); margin: 2px 0 0; }
        .win-live-row { display: flex; align-items: center; gap: .65rem; flex-wrap: wrap; }
        .win-price-pill {
          display: flex; align-items: center; gap: .4rem;
          padding: .35rem .75rem; background: rgba(16,185,129,.1);
          border: 1px solid rgba(16,185,129,.3); border-radius: 999px;
        }
        .win-price-label { font-size: .58rem; color: #10b981; font-weight: 800; text-transform: uppercase; }
        .win-price-value { font-size: .95rem; font-weight: 800; color: #10b981; }
        @keyframes priceUpdate {
          0%   { color: #fff; text-shadow: 0 0 12px #10b981; }
          100% { color: #10b981; text-shadow: none; }
        }
        .win-price-value.price-flash { animation: priceUpdate .9s ease; }
        .win-pts { font-size: .55rem; font-weight: 400; opacity: .7; }
        .win-change { font-size: .8rem; font-weight: 800; }
        .win-change.pos { color: #00ff88; }
        .win-change.neg { color: #ff3355; }
        .win-refresh {
          background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1);
          color: var(--text-muted); width: 28px; height: 28px; border-radius: 8px;
          cursor: pointer; font-size: 1rem; transition: all .2s; display: flex; align-items: center; justify-content: center;
        }
        .win-refresh:hover { color: #10b981; border-color: rgba(16,185,129,.4); }
        .spin-btn { animation: winSpin 1s linear infinite; }
        @keyframes winSpin { to { transform: rotate(360deg); } }
        .win-ts { font-size: .6rem; color: var(--text-muted); font-family: var(--font-mono); }

        /* Loading */
        .win-loading {
          display: flex; flex-direction: column; align-items: center; gap: .75rem;
          padding: 2.5rem; color: var(--text-muted); font-size: .8rem;
        }
        .win-scan { width: 200px; height: 3px; background: rgba(255,255,255,.06); border-radius: 999px; overflow: hidden; }
        .win-scan-bar { height: 100%; width: 40%; background: linear-gradient(90deg,transparent,#10b981,#06b6d4,transparent); animation: scanSlide 1.2s ease-in-out infinite; }
        @keyframes scanSlide { 0%{transform:translateX(-100%)} 100%{transform:translateX(350%)} }

        /* Body */
        .win-body {
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: auto auto;
          gap: 1.2rem;
          transition: opacity .25s ease;
        }
        .win-body.refreshing { opacity: .7; }
        .win-compass-wrap {
          grid-column: 1 / -1;
          background: rgba(255,255,255,.02);
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 14px;
          padding: .9rem 1rem;
        }
        .compass-title {
          font-size: .63rem; font-weight: 800; color: var(--text-muted);
          text-transform: uppercase; letter-spacing: .08em;
          display: flex; align-items: center; gap: .6rem; margin-bottom: .65rem;
        }
        .compass-sub {
          font-size: .55rem; color: var(--text-muted); font-weight: 400;
          padding: 1px 6px; border-radius: 4px; background: rgba(255,255,255,.05);
          text-transform: none; letter-spacing: 0;
        }
        .compass-gauge-area {
          display: flex; align-items: center; gap: 1.2rem; flex-wrap: wrap;
        }
        .compass-gauge-area > svg, .compass-gauge-area > div:first-child { flex: 0 0 auto; }
        .compass-side-info {
          display: flex; flex-direction: column; gap: .4rem; flex: 1; min-width: 140px;
        }
        .csi-dir {
          font-size: 1.5rem; font-weight: 900; letter-spacing: -.5px; line-height: 1;
        }
        .csi-strength {
          font-size: .68rem; font-weight: 800; color: var(--text-muted);
          text-transform: uppercase; letter-spacing: .07em;
        }
        .csi-divergence {
          font-size: .68rem; font-weight: 700; line-height: 1.4;
          padding: .45rem .6rem; border-radius: 8px; margin-top: .2rem;
        }
        .csi-divergence.bearish   { color: #fbbf24; background: rgba(251,191,36,.08); border: 1px solid rgba(251,191,36,.25); }
        .csi-divergence.confirmed { color: #ff3355; background: rgba(255,51,85,.08);  border: 1px solid rgba(255,51,85,.25); }
        .csi-divergence.bullish   { color: #4ade80; background: rgba(74,222,128,.08); border: 1px solid rgba(74,222,128,.25); }

        @media (max-width: 900px) { .win-body { grid-template-columns: 1fr; } }

        /* Scorecard */
        .win-scorecard { display: flex; flex-direction: column; gap: .5rem; }
        .win-scorecard-title { font-size: .65rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: .08em; margin-bottom: .25rem; }

        .win-factors { display: flex; flex-direction: column; gap: .22rem; }
        .factor-row {
          display: flex; align-items: center; justify-content: space-between; gap: .5rem;
          padding: .45rem .55rem; border-radius: 8px; background: rgba(255,255,255,.025);
          border: 1px solid rgba(255,255,255,.04); transition: background .15s;
        }
        .factor-row:hover { background: rgba(255,255,255,.04); }
        .factor-left { display: flex; align-items: center; gap: .45rem; flex: 1; min-width: 0; }
        .factor-icon { font-size: .85rem; flex-shrink: 0; }
        .factor-label { font-size: .65rem; color: var(--text-muted); }
        .factor-value { font-size: .72rem; font-weight: 700; color: var(--text-primary); }
        .factor-right { display: flex; align-items: center; gap: .4rem; flex-shrink: 0; }
        .factor-bar-wrap { width: 52px; height: 4px; background: rgba(255,255,255,.06); border-radius: 999px; overflow: hidden; }
        .factor-bar { height: 100%; border-radius: 999px; transition: width .5s ease; }
        .factor-score { font-size: .62rem; font-weight: 800; font-family: var(--font-mono); min-width: 26px; text-align: right; }
        .factor-tag {
          font-size: .5rem; font-weight: 800; padding: 1px 5px; border-radius: 4px;
          border: 1px solid; text-transform: uppercase; letter-spacing: .4px;
          white-space: nowrap; max-width: 100px; overflow: hidden; text-overflow: ellipsis;
        }

        /* Total score */
        .total-score-row {
          display: flex; align-items: center; gap: .6rem; margin-top: .55rem;
          padding: .6rem .55rem; background: rgba(255,255,255,.03);
          border-radius: 8px; border: 1px solid rgba(255,255,255,.06);
        }
        .total-score-label { font-size: .58rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: .05em; white-space: nowrap; }
        .total-bar-wrap { flex: 1; display: flex; height: 6px; border-radius: 999px; overflow: hidden; background: rgba(255,255,255,.04); }
        .total-bar-track { flex: 1; position: relative; overflow: hidden; }
        .total-bar-track.negative { display: flex; justify-content: flex-end; }
        .total-bar-fill { height: 6px; border-radius: 999px; transition: width .6s ease; }
        .total-score-value { font-size: .85rem; font-weight: 800; min-width: 32px; text-align: right; }

        /* Right panel */
        .win-right { display: flex; flex-direction: column; gap: .9rem; }

        /* Verdict */
        .win-verdict {
          display: flex; align-items: center; gap: .9rem;
          padding: .9rem 1rem; border-radius: 12px; border: 1px solid;
          background: rgba(255,255,255,.02);
        }
        .verdict-icon { font-size: 1.8rem; font-weight: 900; line-height: 1; flex-shrink: 0; }
        .verdict-dir { font-size: 1.3rem; font-weight: 900; letter-spacing: -0.5px; }
        .verdict-strength { font-size: .65rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: .08em; }
        .verdict-conviction { flex: 1; display: flex; flex-direction: column; gap: .28rem; align-items: flex-end; }
        .conv-label { font-size: .57rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: .06em; }
        .conv-bar-wrap { width: 100%; max-width: 100px; height: 6px; background: rgba(255,255,255,.06); border-radius: 999px; overflow: hidden; }
        .conv-bar { height: 100%; border-radius: 999px; transition: width .7s ease; }
        .conv-value { font-size: .8rem; font-weight: 800; font-family: var(--font-mono); }

        /* Setup */
        .win-setup {
          background: rgba(255,255,255,.025); border: 1px solid rgba(255,255,255,.07);
          border-radius: 12px; padding: .9rem;
        }
        .setup-title { font-size: .63rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: .08em; margin-bottom: .75rem; }
        .setup-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .55rem; margin-bottom: .6rem; }
        .setup-block { padding: .6rem .7rem; border-radius: 10px; border: 1px solid rgba(255,255,255,.07); background: rgba(255,255,255,.02); }
        .entry-block { border-color: rgba(99,149,255,.3); background: rgba(99,149,255,.04); }
        .stop-block  { border-color: rgba(255,51,85,.3);  background: rgba(255,51,85,.04); }
        .setup-block-label { font-size: .55rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: .08em; margin-bottom: .22rem; }
        .setup-block-value { font-size: 1.05rem; font-weight: 800; color: var(--text-primary); }
        .stop-val { color: #ff3355 !important; }
        .setup-block-sub { font-size: .6rem; color: var(--text-muted); margin-top: 2px; }
        .setup-block-alt { font-size: .58rem; color: var(--text-muted); margin-top: 4px; font-style: italic; }
        .setup-block-alt .font-mono { color: var(--text-primary); }

        .setup-targets { display: flex; flex-direction: column; gap: .45rem; margin-bottom: .65rem; }
        .target-row {
          display: flex; align-items: center; gap: .55rem; flex-wrap: wrap;
          padding: .48rem .65rem; border-radius: 8px; border: 1px solid;
        }
        .t1 { border-color: rgba(74,222,128,.3); background: rgba(74,222,128,.04); }
        .t2 { border-color: rgba(0,255,136,.4);  background: rgba(0,255,136,.05);  }
        .target-label { font-size: .58rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: .06em; min-width: 42px; }
        .target-value { font-size: .85rem; font-weight: 800; color: #00ff88; }
        .target-meta { display: flex; align-items: center; gap: .55rem; flex-wrap: wrap; margin-left: auto; }
        .target-pct  { font-size: .65rem; color: #00ff88; font-weight: 700; }
        .target-rr   { font-size: .7rem; font-weight: 800; font-family: var(--font-mono); }
        .target-gain { font-size: .6rem; color: var(--text-muted); }

        .setup-footer { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: .35rem; }
        .setup-validity { font-size: .63rem; color: #06b6d4; font-weight: 700; }
        .setup-warn { font-size: .57rem; color: var(--text-muted); }

        /* Neutral */
        .win-neutral-msg {
          display: flex; flex-direction: column; align-items: center; gap: .35rem;
          padding: 1.5rem; text-align: center; color: var(--text-muted);
          background: rgba(99,149,255,.05); border: 1px solid rgba(99,149,255,.2); border-radius: 12px;
        }
        .win-neutral-msg strong { color: #6395ff; }
        .win-neutral-msg p { font-size: .75rem; margin: 0; line-height: 1.5; }

        /* Reading */
        .win-reading {
          padding: .7rem .8rem; border-radius: 10px;
          background: rgba(255,255,255,.02); border: 1px solid rgba(255,255,255,.05);
        }
        .reading-title { font-size: .58rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: .08em; margin-bottom: .35rem; }
        .reading-text { font-size: .73rem; color: var(--text-secondary); line-height: 1.55; margin: 0; }
      `}</style>
    </div>
  );
};

// ── Reading generator ────────────────────────────────────────────────────────

const buildReading = (d) => {
  if (!d) return '';
  const { selic, selicPrev, ipca, usdBrl, total, direction, divergence, factors } = d;
  const selicDir  = selic < selicPrev ? 'em ciclo de cortes' : selic > selicPrev ? 'em ciclo de alta' : 'estável';
  const ipcaOk    = ipca <= 4.5;
  const brlOk     = usdBrl <= 5.20;
  const geoFactor = factors?.find(f => f.label === 'Geopolítica');

  const parts = [
    `SELIC ${selic.toFixed(2)}% ${selicDir} — ${ipcaOk ? 'inflação controlada favorece risco' : 'inflação acima da meta pressiona o BC'}. `,
    `Câmbio ${usdBrl.toFixed(2)} — ${brlOk ? 'real forte dá espaço para compra de bolsa' : 'dólar elevado pressiona fluxo estrangeiro'}. `,
    geoFactor && geoFactor.score !== -5 ? `Geopolítica: ${geoFactor.status} (${geoFactor.score > 0 ? '+' : ''}${geoFactor.score}). ` : '',
    direction.dir === 'COMPRA'
      ? `Score macro +${total}: viés de COMPRA ${direction.strength === 'FORTE' ? 'com alta convicção' : 'moderada'}. Prefira entrada no pullback com stop definido.`
      : direction.dir === 'VENDA'
      ? `Score macro ${total}: viés de VENDA ${direction.strength === 'FORTE' ? 'com alta convicção' : 'moderada'}. Priorizar proteção e aguardar força para vender.`
      : `Score neutro (${total}): macro sem direção clara. Aguardar rompimento de suporte ou resistência.`,
    divergence ? ` ${divergence.msg}` : '',
  ];
  return parts.filter(Boolean).join('');
};

// Só re-renderiza se currentWin ou currentDolar mudar
// lastAlert é tratado via ref internamente — não precisa causar re-render
export default React.memo(WinAnalysis, (prev, next) =>
  prev.currentWin === next.currentWin &&
  prev.currentDolar === next.currentDolar
);
