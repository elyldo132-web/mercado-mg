import React, { useState, useEffect, useRef } from 'react';
import { isB3Open, fetchBTC24h, fetchSPFutures, computeCryptoScore, toCryptoDir } from '../utils/MarketStatus';
import AssetDirectionCard from './AssetDirectionCard';

// ── Day-of-week patterns (B3 historical tendencies) ─────────────────────────

const DOW = {
  1: { name: 'Segunda-feira', bias: -6,  icon: '🔴', type: 'Volátil',    note: 'Abertura com risco de gap. Aguarde 30 min antes de entrar.' },
  2: { name: 'Terça-feira',   bias: +8,  icon: '🟢', type: 'Tendência',  note: 'Melhor dia para trades direcionais. Tendência mais limpa.' },
  3: { name: 'Quarta-feira',  bias: +6,  icon: '🟢', type: 'Tendência',  note: 'Dia forte. Trades no sentido da macro têm boa performance.' },
  4: { name: 'Quinta-feira',  bias: -3,  icon: '🟡', type: 'Transição',  note: 'Atenção: reversões começam quinta. Reduza tamanho de posição.' },
  5: { name: 'Sexta-feira',   bias: -10, icon: '🔴', type: 'Realização', note: 'Zeragem de posições. Evite carregar trades para o fim de semana.' },
  6: { name: 'Sábado',        bias: 0,   icon: '⚪', type: 'Sem pregão', note: 'Pregão fechado.' },
  0: { name: 'Domingo',       bias: 0,   icon: '⚪', type: 'Sem pregão', note: 'Pregão fechado.' },
};

// ── Session phases (Brasília time, B3 opens 10:00, closes 17:55) ────────────

const getPhase = () => {
  const now = new Date();
  const t   = now.getHours() * 60 + now.getMinutes();

  if (t < 600)  return { phase: 'PRÉ-MERCADO',       color: '#6395ff', ok: false, tip: 'Analise futuros EUA e macro antes de planejar.' };
  if (t < 630)  return { phase: 'ABERTURA (10:00)',   color: '#fbbf24', ok: false, tip: 'Alta volatilidade. Aguarde 30 min para direção definida.' };
  if (t < 690)  return { phase: '✅ JANELA PRIMÁRIA', color: '#00ff88', ok: true,  tip: 'Melhor janela do dia. Entre na direção do sinal.' };
  if (t < 810)  return { phase: 'ALMOÇO (11:30)',     color: '#6395ff', ok: false, tip: 'Liquidez baixa. Movimentos enganosos. Evite entrar.' };
  if (t < 870)  return { phase: 'PRÉ-NY (13:30)',     color: '#fbbf24', ok: false, tip: 'EUA abre em breve. Volatilidade aumenta.' };
  if (t < 960)  return { phase: '✅ POWER HOUR',      color: '#00ff88', ok: true,  tip: 'Janela NY ativa. Operações no sentido macro têm melhor R:R.' };
  if (t < 1080) return { phase: 'FECHAMENTO (16:00)', color: '#f97316', ok: false, tip: 'Posições sendo zeradas. Não abra novas operações.' };
  return          { phase: 'PÓS-MERCADO',             color: '#6395ff', ok: false, tip: 'Pregão encerrado. Planeje o próximo dia.' };
};

// ── Score calculation ────────────────────────────────────────────────────────

const computeDayScore = ({ macroScore, dowBias, newsScore, spChange, timeOk }) => {
  const timeBonus = timeOk ? 4 : -4;
  const spBonus   = spChange != null ? parseFloat((spChange * 4).toFixed(1)) : 0;
  return Math.round(macroScore + dowBias + newsScore / 4 + spBonus + timeBonus);
};

const newsToScore = (alert) => {
  if (!alert || alert === 'IGNORAR') return 0;
  const m = alert.strength === 'Forte' ? 1.0 : alert.strength === 'Médio' ? 0.6 : 0.3;
  if (alert.tradeAction === 'Compra') return Math.round(30 * m);
  if (alert.tradeAction === 'Venda')  return Math.round(-30 * m);
  return 0;
};

const toDir = (score) => {
  if (score >=  35) return { key: 'FORTE_COMPRA',  label: 'COMPRAR FORTE',   icon: '▲▲', color: '#00ff88', winOp: 'COMPRAR',  dolOp: 'VENDER',  winTip: 'Compre pullbacks até suporte.', dolTip: 'Venda rally no dólar.' };
  if (score >=  15) return { key: 'COMPRA',         label: 'FOCAR EM COMPRA', icon: '▲',  color: '#4ade80', winOp: 'COMPRAR',  dolOp: 'VENDER',  winTip: 'Busque entradas longas.', dolTip: 'Evite comprar dólar hoje.' };
  if (score >= -14) return { key: 'NEUTRO',          label: 'AGUARDAR',        icon: '⏸',  color: '#fbbf24', winOp: 'AGUARDAR', dolOp: 'AGUARDAR', winTip: 'Mercado sem direção. Fique de fora.', dolTip: 'Sem edge direcional.' };
  if (score >= -34) return { key: 'VENDA',           label: 'FOCAR EM VENDA',  icon: '▼',  color: '#f97316', winOp: 'VENDER',   dolOp: 'COMPRAR', winTip: 'Venda resistências e pullbacks.', dolTip: 'Dólar sobe quando bolsa cai.' };
  return              { key: 'FORTE_VENDA',   label: 'VENDER FORTE',    icon: '▼▼', color: '#ff3355', winOp: 'VENDER',   dolOp: 'COMPRAR', winTip: 'Opere vendido em cada reação.', dolTip: 'Compre dólar como proteção.' };
};

// ── Sub-components ───────────────────────────────────────────────────────────

const FactorRow = ({ icon, label, value, score, tip }) => {
  const c = score > 5 ? '#00ff88' : score < -5 ? '#ff3355' : '#fbbf24';
  return (
    <div className="dd-factor">
      <span className="ddf-icon">{icon}</span>
      <div className="ddf-body">
        <div className="ddf-label">{label}</div>
        <div className="ddf-tip">{tip}</div>
      </div>
      <div className="ddf-right">
        <span className="ddf-val">{value}</span>
        <span className="ddf-score" style={{ color: c }}>{score > 0 ? '+' : ''}{score}</span>
      </div>
    </div>
  );
};

const AssetBox = ({ asset, op, tip, dir }) => {
  const isCompra = op === 'COMPRAR';
  const isAguarda = op === 'AGUARDAR';
  const bc = isAguarda ? '#fbbf24' : isCompra ? '#00ff88' : '#ff3355';
  return (
    <div className="dd-asset-box" style={{ borderColor: bc + '44', background: bc + '08' }}>
      <div className="dab-header">
        <span className="dab-asset">{asset}</span>
        <span className="dab-op" style={{ color: bc, borderColor: bc + '55', background: bc + '15' }}>
          {isCompra ? '▲' : isAguarda ? '⏸' : '▼'} {op}
        </span>
      </div>
      <div className="dab-tip">{tip}</div>
    </div>
  );
};

// ── Main component ───────────────────────────────────────────────────────────

const OP_FROM_DIRECTION = { 'COMPRA': 'COMPRAR', 'VENDA': 'VENDER', 'SEM OPERAÇÃO': 'AGUARDAR' };

const DayDirection = ({ macroSignal, lastAlert, asset, assetResult }) => {
  const [sp, setSp]         = useState(null);
  const [spLoading, setSpL] = useState(true);
  const [btc, setBtc]       = useState(null);
  const [btcLoading, setBtcL] = useState(true);
  const [phase, setPhase]   = useState(getPhase);
  const [showDetails, setShowDetails] = useState(false);
  const clockRef            = useRef(null);

  // Atualiza só o relógio via DOM; fase só re-renderiza quando muda de etapa
  useEffect(() => {
    const tick = () => {
      if (clockRef.current) {
        clockRef.current.textContent = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      }
      setPhase(prev => {
        const next = getPhase();
        return prev.phase === next.phase ? prev : next;
      });
    };
    const t = setInterval(tick, 60000);
    return () => clearInterval(t);
  }, []);

  // Fetch SP500 futures
  useEffect(() => {
    setSpL(true);
    fetchSPFutures().then(d => { setSp(d); setSpL(false); });
    const t = setInterval(() => fetchSPFutures().then(setSp), 300000); // refresh every 5m
    return () => clearInterval(t);
  }, []);

  // Fetch BTC 24h (modo cripto/internacional quando a B3 está fechada)
  useEffect(() => {
    setBtcL(true);
    fetchBTC24h().then(d => { setBtc(d); setBtcL(false); }).catch(() => setBtcL(false));
    const t = setInterval(() => fetchBTC24h().then(setBtc).catch(() => {}), 120000); // refresh every 2m
    return () => clearInterval(t);
  }, []);

  const today      = new Date();
  const dow        = today.getDay();
  const dowInfo    = DOW[dow];
  const macroScore = macroSignal?.score ?? 0;
  const newsScore  = newsToScore(lastAlert);
  const spChange   = sp?.change ?? null;

  const dayScore = computeDayScore({
    macroScore, dowBias: dowInfo.bias, newsScore,
    spChange, timeOk: phase.ok,
  });

  const dir     = toDir(dayScore);
  const dateStr = today.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' });
  const timeStr = today.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const factors = [
    {
      icon: '📆', label: `Padrão do Dia (${dowInfo.type})`,
      value: dowInfo.name, score: dowInfo.bias, tip: dowInfo.note,
    },
    {
      icon: '🏦', label: 'Análise Macro BCB',
      value: `Score ${macroScore > 0 ? '+' : ''}${macroScore}`,
      score: macroScore, tip: `SELIC, IPCA, USD/BRL — Direção: ${macroSignal?.direction ?? 'CARREGANDO'}`,
    },
    {
      icon: '📰', label: 'Sentimento de Notícias',
      value: lastAlert ? `${lastAlert.tradeAction ?? '—'} · ${lastAlert.strength ?? ''}` : 'Sem análise',
      score: Math.round(newsScore / 4),
      tip: lastAlert?.sector ? `Setor: ${lastAlert.sector}` : 'Aguardando notícia analisada',
    },
    {
      icon: '🌐', label: 'Futuros S&P 500 (EUA)',
      value: spLoading ? 'Buscando...' : sp ? `${sp.change > 0 ? '+' : ''}${sp.change}%` : 'Indisponível',
      score: sp ? Math.round(sp.change * 4) : 0,
      tip: sp ? (sp.change > 0.3 ? 'EUA em alta — fluxo favorece bolsas emergentes' : sp.change < -0.3 ? 'EUA em queda — pressão vendedora no Brasil' : 'EUA lateral — sem influência direcional clara') : 'Dados dos futuros indisponíveis',
    },
    {
      icon: '⏰', label: 'Fase do Pregão',
      value: phase.phase, score: phase.ok ? 5 : -4,
      tip: phase.tip,
    },
  ];

  const isPregao   = dow >= 1 && dow <= 5;
  const marketOpen = isB3Open();

  const btcChange   = btc?.changePct ?? null;
  const cryptoScore = computeCryptoScore(btcChange, spChange);
  const cDir        = toCryptoDir(cryptoScore);
  const nextOpenLabel = (dow === 5 || dow === 6 || dow === 0) ? 'na segunda-feira' : 'amanhã';

  const isCustomAsset = asset && !['WIN', 'DOL'].includes(asset.key);
  const customOp = assetResult ? OP_FROM_DIRECTION[assetResult.direction] : 'AGUARDAR';
  const customTip = assetResult
    ? assetResult.motivo
    : `Rode o Robô Analista Técnico para gerar um setup de ${asset?.label ?? 'o ativo pesquisado'}.`;

  return (
    <div className="day-direction" style={{ '--dc': dir.color, '--db': dir.color + '33', '--dbg': dir.color + '0d' }}>

      {/* ── CABEÇALHO ─────────────────────────────────────────────── */}
      <div className="dd-header">
        <div className="dd-title-row">
          <span className="dd-flag">📅</span>
          <div>
            <div className="dd-title">Diretriz do Dia</div>
            <div className="dd-date">{dateStr} · <span ref={clockRef}>{timeStr}</span></div>
          </div>
        </div>
        <div className="dd-score-pill">
          <span className="dsp-label">Score</span>
          <span className="dsp-val" style={{ color: dir.color }}>{dayScore > 0 ? '+' : ''}{dayScore}</span>
        </div>
      </div>

      {!marketOpen ? (
        <>
          <div className="dd-afterhours-badge">
            {isPregao ? '🌙 Fora do horário de pregão B3' : `⚪ ${dowInfo.name} — B3 fechada`} · Modo 24h: Cripto &amp; Internacional
          </div>

          <div className="dd-verdict" style={{ background: cDir.color + '0d', borderColor: cDir.color + '33' }}>
            <div className="ddv-icon" style={{ color: cDir.color, textShadow: `0 0 20px ${cDir.color}` }}>
              {cDir.icon}
            </div>
            <div className="ddv-main">
              <div className="ddv-label">SENTIMENTO 24H · CRIPTO + FUTUROS EUA</div>
              <div className="ddv-dir" style={{ color: cDir.color }}>{cDir.label}</div>
              <div className="ddv-window" style={{ color: cDir.color }}>Score 24h: {cryptoScore > 0 ? '+' : ''}{cryptoScore}</div>
            </div>
          </div>

          <div className="dd-assets">
            <div className="dd-sect-title">O que acompanhar agora</div>
            <div className="dd-assets-grid">
              <AssetBox
                asset="₿ Bitcoin (BTC)"
                op={cDir.op}
                tip={btc ? `24h: ${btc.changePct > 0 ? '+' : ''}${btc.changePct.toFixed(1)}%` : (btcLoading ? 'Buscando...' : 'Indisponível')}
                dir={cDir}
              />
              <AssetBox
                asset="🌐 S&P 500 (Futuros)"
                op={cDir.op}
                tip={sp ? `${sp.change > 0 ? '+' : ''}${sp.change}%` : (spLoading ? 'Buscando...' : 'Indisponível')}
                dir={cDir}
              />
            </div>
          </div>

          <div className="dd-rules">
            <div className="dd-rule">🕐 <strong>Cripto opera 24/7</strong> — sem janela de pregão, mas use sempre stop de preço.</div>
            <div className="dd-rule">🇧🇷 <strong>B3 reabre</strong> {nextOpenLabel} às 10:00 (horário de Brasília).</div>
            <div className="dd-rule">🔍 Pesquise BTC, ETH ou outro par no <strong>Robô Analista Técnico</strong> para um setup completo.</div>
          </div>
        </>
      ) : (
        <>
          {/* ── JANELA DE TRADE ──────────────────────────────────────── */}
          {dir.key !== 'NEUTRO' && (
            <div className={`dd-window-note ${phase.ok ? '' : 'warn'}`}>
              {phase.ok ? '🟢 Você está na janela de trade — boa hora para entrar' : '⏸ Fora da janela ideal — espere o horário certo'}
            </div>
          )}

          {/* ── ATIVOS ────────────────────────────────────────────── */}
          <div className="dd-assets">
            <div className="dd-sect-title">O que operar hoje</div>
            <div className={`dd-cards-grid ${isCustomAsset ? 'dd-cards-grid-3' : ''}`}>
              <AssetDirectionCard icon="🇧🇷" name="WIN Mini (Ibovespa)" sub="WIN MINI" op={dir.winOp} score={dayScore} tip={dir.winTip} />
              <AssetDirectionCard icon="💵" name="DOL Mini (Dólar)" sub="DÓLAR" op={dir.dolOp} score={-dayScore} tip={dir.dolTip} note="Correlação inversa ao WIN" />
              {isCustomAsset && (
                <AssetDirectionCard
                  icon={asset.icon ?? '🔎'} name={asset.label} sub={asset.label}
                  op={customOp} score={assetResult?.score ?? 0} tip={customTip}
                />
              )}
            </div>
          </div>

          <button className="dd-toggle" onClick={() => setShowDetails(v => !v)}>
            {showDetails ? 'Ocultar fatores e regras ▲' : 'Ver fatores confluentes e regras do dia ▼'}
          </button>

          {showDetails && (
            <>
              {/* ── FATORES ───────────────────────────────────────────── */}
              <div className="dd-factors">
                <div className="dd-sect-title">Fatores confluentes</div>
                {factors.map((f, i) => <FactorRow key={i} {...f} />)}
              </div>

              {/* ── REGRAS DO DIA ─────────────────────────────────────── */}
              <div className="dd-rules">
                <div className="dd-rule">⏰ <strong>Janelas de trade:</strong> 10:30–11:30 e 14:30–16:00 (horário de Brasília)</div>
                <div className="dd-rule">🛑 <strong>Stop obrigatório</strong> em todo trade — sem exceção</div>
                {dowInfo.bias < 0 && <div className="dd-rule warn">⚠️ {dowInfo.note}</div>}
                {dir.key === 'NEUTRO' && <div className="dd-rule warn">⏸ Score neutro — a melhor operação de hoje pode ser não operar</div>}
              </div>
            </>
          )}
        </>
      )}

      <style jsx="true">{`
        .day-direction {
          background: linear-gradient(135deg, rgba(8,10,18,.98), rgba(12,16,30,.98));
          border: 1px solid rgba(99,149,255,.2); border-radius: 16px;
          padding: 1.2rem; margin-bottom: 1.4rem;
        }

        /* Header */
        .dd-header {
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: .5rem;
          padding-bottom: .85rem; border-bottom: 1px solid rgba(255,255,255,.06); margin-bottom: 1rem;
        }
        .dd-title-row { display: flex; align-items: center; gap: .6rem; }
        .dd-flag  { font-size: 1.5rem; }
        .dd-title { font-size: 1rem; font-weight: 800;
          background: linear-gradient(135deg,#06b6d4,#6395ff,#a855f7);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .dd-date  { font-size: .62rem; color: var(--text-muted); margin-top: 1px; }
        .dd-score-pill {
          display: flex; flex-direction: column; align-items: center;
          padding: .4rem .85rem; border-radius: 10px;
          border: 1px solid rgba(255,255,255,.08); background: rgba(255,255,255,.03);
        }
        .dsp-label { font-size: .5rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: .06em; }
        .dsp-val   { font-size: 1.2rem; font-weight: 900; font-family: var(--font-mono); }

        .dd-afterhours-badge {
          font-size: .62rem; font-weight: 700; color: var(--text-muted);
          padding: .5rem .7rem; border-radius: 8px; margin-bottom: .9rem;
          background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.06);
        }

        /* Verdict */
        .dd-verdict {
          display: flex; align-items: center; gap: .9rem;
          padding: .9rem 1rem; border-radius: 12px; border: 1px solid;
          margin-bottom: .9rem;
        }
        .ddv-icon { font-size: 2rem; font-weight: 900; flex-shrink: 0; line-height: 1; }
        .ddv-main { flex: 1; }
        .ddv-label { font-size: .52rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: .07em; }
        .ddv-dir   { font-size: 1.25rem; font-weight: 900; letter-spacing: -.4px; }
        .ddv-window      { font-size: .62rem; font-weight: 700; color: #00ff88; margin-top: 3px; }
        .ddv-window.warn { color: #fbbf24; }

        /* Factors */
        .dd-sect-title {
          font-size: .58rem; font-weight: 800; color: var(--text-muted);
          text-transform: uppercase; letter-spacing: .08em; margin-bottom: .45rem;
        }
        .dd-factors { margin-bottom: .9rem; }
        .dd-factor {
          display: flex; align-items: center; gap: .5rem;
          padding: .42rem .6rem; border-radius: 7px;
          background: rgba(255,255,255,.025); border: 1px solid rgba(255,255,255,.04);
          margin-bottom: .2rem;
        }
        .ddf-icon  { font-size: .9rem; flex-shrink: 0; width: 22px; text-align: center; }
        .ddf-body  { flex: 1; min-width: 0; }
        .ddf-label { font-size: .65rem; font-weight: 700; color: var(--text-secondary); }
        .ddf-tip   { font-size: .57rem; color: var(--text-muted); margin-top: 1px; }
        .ddf-right { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; flex-shrink: 0; }
        .ddf-val   { font-size: .6rem; color: var(--text-muted); font-family: var(--font-mono); }
        .ddf-score { font-size: .72rem; font-weight: 800; font-family: var(--font-mono); }

        .dd-toggle {
          width: 100%; font-size: .62rem; font-weight: 700; color: var(--text-muted);
          background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.07);
          border-radius: 8px; padding: .45rem .6rem; cursor: pointer; transition: all .15s;
          margin-bottom: .9rem;
        }
        .dd-toggle:hover { background: rgba(255,255,255,.06); color: var(--text-secondary); }

        .dd-window-note {
          font-size: .64rem; font-weight: 700; color: #00ff88;
          padding: .5rem .7rem; border-radius: 8px; margin-bottom: .9rem;
          background: rgba(0,255,136,.06); border: 1px solid rgba(0,255,136,.2);
        }
        .dd-window-note.warn {
          color: #fbbf24; background: rgba(251,191,36,.06); border-color: rgba(251,191,36,.2);
        }

        /* Assets */
        .dd-assets { margin-bottom: .9rem; }
        .dd-assets-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .7rem; }
        .dd-assets-grid-3 { grid-template-columns: 1fr 1fr 1fr; }
        .dd-cards-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .8rem; }
        .dd-cards-grid-3 { grid-template-columns: 1fr 1fr 1fr; }
        @media (max-width: 600px) { .dd-assets-grid, .dd-assets-grid-3, .dd-cards-grid, .dd-cards-grid-3 { grid-template-columns: 1fr; } }
        .dd-asset-box { border: 1px solid; border-radius: 10px; padding: .7rem .8rem; }
        .dab-header { display: flex; align-items: center; justify-content: space-between; gap: .4rem; margin-bottom: .35rem; }
        .dab-asset { font-size: .67rem; font-weight: 800; color: var(--text-secondary); }
        .dab-op {
          font-size: .6rem; font-weight: 900; padding: 2px 7px; border-radius: 5px;
          border: 1px solid; text-transform: uppercase; letter-spacing: .04em;
        }
        .dab-tip { font-size: .6rem; color: var(--text-muted); line-height: 1.4; }

        /* Rules */
        .dd-rules {
          display: flex; flex-direction: column; gap: .25rem;
          padding: .6rem .75rem; border-radius: 8px;
          background: rgba(255,255,255,.02); border: 1px solid rgba(255,255,255,.05);
        }
        .dd-rule      { font-size: .65rem; color: var(--text-muted); line-height: 1.45; }
        .dd-rule strong { color: var(--text-secondary); }
        .dd-rule.warn { color: #fbbf24; }
      `}</style>
    </div>
  );
};

export default React.memo(DayDirection);
