import React, { useMemo } from 'react';

// ── Setup calculators ────────────────────────────────────────────────────────

const calcWinSetup = (price, dir, conviction) => {
  if (!price || dir === 'NEUTRO') return null;
  const isCompra = dir === 'COMPRA';
  const high     = conviction >= 65;
  const stopPct  = high ? 0.010 : 0.014;
  const t1Pct    = high ? 0.020 : 0.018;
  const t2Pct    = high ? 0.038 : 0.028;
  const d        = isCompra ? 1 : -1;
  const entry    = Math.round(price);
  const stopL    = Math.round(price * (1 - d * stopPct));
  const t1       = Math.round(price * (1 + d * t1Pct));
  const t2       = Math.round(price * (1 + d * t2Pct));
  const stopDist = Math.abs(stopL - entry);
  const f        = (n) => Math.round(n).toLocaleString('pt-BR');
  return {
    asset: 'MINI WIN (WINFUT)', ptValue: 0.20, unit: 'pts', isCompra, dir,
    entry: f(entry), stop: f(stopL), t1: f(t1), t2: f(t2),
    stopDist, t1Dist: Math.abs(t1 - entry), t2Dist: Math.abs(t2 - entry),
    rr1: (Math.abs(t1 - entry) / stopDist).toFixed(1),
    rr2: (Math.abs(t2 - entry) / stopDist).toFixed(1),
    stopRisk: (stopDist * 0.20).toFixed(0),
    t1Gain:   (Math.abs(t1 - entry) * 0.20).toFixed(0),
    t2Gain:   (Math.abs(t2 - entry) * 0.20).toFixed(0),
    margin:   150,
  };
};

const calcDolSetup = (dolarPrice, winDir, conviction) => {
  if (!dolarPrice || winDir === 'NEUTRO') return null;
  // DOL é inversamente correlacionado ao WIN em mercados emergentes
  const isCompra = winDir === 'VENDA';
  const pts      = Math.round(dolarPrice * 1000);
  const high     = conviction >= 65;
  const stopPct  = high ? 0.008 : 0.012;
  const t1Pct    = high ? 0.015 : 0.013;
  const t2Pct    = high ? 0.028 : 0.022;
  const d        = isCompra ? 1 : -1;
  const entry    = pts;
  const stopL    = Math.round(pts * (1 - d * stopPct));
  const t1       = Math.round(pts * (1 + d * t1Pct));
  const t2       = Math.round(pts * (1 + d * t2Pct));
  const stopDist = Math.abs(stopL - entry);
  return {
    asset: 'MINI DOL (DOLFUT)', ptValue: 10.00, unit: 'pts', isCompra,
    dir: isCompra ? 'COMPRA' : 'VENDA',
    entry: entry.toLocaleString('pt-BR'),
    stop:  stopL.toLocaleString('pt-BR'),
    t1:    t1.toLocaleString('pt-BR'),
    t2:    t2.toLocaleString('pt-BR'),
    stopDist, t1Dist: Math.abs(t1 - entry), t2Dist: Math.abs(t2 - entry),
    rr1: (Math.abs(t1 - entry) / stopDist).toFixed(1),
    rr2: (Math.abs(t2 - entry) / stopDist).toFixed(1),
    stopRisk: (stopDist * 10).toFixed(0),
    t1Gain:   (Math.abs(t1 - entry) * 10).toFixed(0),
    t2Gain:   (Math.abs(t2 - entry) * 10).toFixed(0),
    margin:   2000,
    note: 'DOL sobe quando bolsa cai (correlação inversa)',
  };
};

// ── Checklist evaluator ──────────────────────────────────────────────────────

const evalGuide = (macroSignal, lastAlert) => {
  const score      = macroSignal?.score      ?? 0;
  const conviction = macroSignal?.conviction ?? 50;
  const dir        = macroSignal?.direction  ?? 'NEUTRO';
  const newsAction = lastAlert?.tradeAction;
  const newsStr    = lastAlert?.strength;

  const st = (ok, bad) => ok ? 'ok' : bad ? 'bad' : 'wait';

  const macroSt  = st(Math.abs(score) >= 15 && score !== 0, false);
  const convSt   = st(conviction >= 60, conviction < 40);
  const newsSt   = newsAction === 'Compra' && dir === 'COMPRA' ? 'ok'
                 : newsAction === 'Venda'  && dir === 'VENDA'  ? 'ok'
                 : newsAction === 'Compra' && dir === 'VENDA'  ? 'bad'
                 : newsAction === 'Venda'  && dir === 'COMPRA' ? 'bad'
                 : 'wait';
  const strSt    = st(Math.abs(score) >= 30, Math.abs(score) < 15);

  const checks = [
    {
      num: 1, label: 'Direção Macro',
      detail: score !== 0 ? `Score ${score > 0 ? '+' : ''}${score}` : 'Score zero',
      tip: Math.abs(score) >= 30 ? 'Sinal forte — boa assimetria'
         : Math.abs(score) >= 15 ? 'Sinal moderado — operar com cautela'
         : 'Sinal fraco — AGUARDAR mais definição',
      status: macroSt,
    },
    {
      num: 2, label: 'Notícia Confirma?',
      detail: newsAction ? `${newsAction} · ${newsStr || ''}` : 'Nenhuma notícia analisada',
      tip: newsSt === 'ok'  ? 'Notícia alinha com o viés macro'
         : newsSt === 'bad' ? 'Notícia CONTRA o viés — cuidado!'
         : 'Aguardando notícia relevante',
      status: newsSt,
    },
    {
      num: 3, label: 'Convicção do Sinal',
      detail: `${conviction}%`,
      tip: conviction >= 65 ? 'Alta convicção — stoplosse menor e alvos maiores'
         : conviction >= 45 ? 'Convicção moderada — operar tamanho reduzido'
         : 'Baixa convicção — melhor aguardar',
      status: convSt,
    },
    {
      num: 4, label: 'Força da Tendência',
      detail: Math.abs(score) >= 30 ? 'FORTE' : Math.abs(score) >= 15 ? 'MODERADA' : 'FRACA',
      tip: Math.abs(score) >= 30 ? 'Tendência clara — maior probabilidade direcional'
         : Math.abs(score) >= 15 ? 'Tendência em formação'
         : 'Sem tendência definida',
      status: strSt,
    },
  ];

  const okCount  = checks.filter(c => c.status === 'ok').length;
  const badCount = checks.filter(c => c.status === 'bad').length;

  let verdict;
  if (dir === 'NEUTRO' || Math.abs(score) < 15)          verdict = 'AGUARDAR';
  else if (okCount >= 3 && badCount === 0 && dir === 'COMPRA') verdict = 'FORTE_COMPRA';
  else if (okCount >= 3 && badCount === 0 && dir === 'VENDA')  verdict = 'FORTE_VENDA';
  else if (okCount >= 2 && badCount <= 1 && dir === 'COMPRA')  verdict = 'COMPRA';
  else if (okCount >= 2 && badCount <= 1 && dir === 'VENDA')   verdict = 'VENDA';
  else verdict = 'AGUARDAR';

  return { checks, verdict, dir, score, conviction };
};

// ── Verdict config ───────────────────────────────────────────────────────────

const VERDICTS = {
  FORTE_COMPRA: { label: 'COMPRA FORTE',  icon: '▲▲', color: '#00ff88', bg: 'rgba(0,255,136,.09)',   border: 'rgba(0,255,136,.4)',   action: 'ENTRE COMPRADO AGORA' },
  COMPRA:       { label: 'COMPRA',         icon: '▲',  color: '#4ade80', bg: 'rgba(74,222,128,.07)',  border: 'rgba(74,222,128,.35)', action: 'ENTRE COMPRADO' },
  AGUARDAR:     { label: 'AGUARDAR',       icon: '⏸',  color: '#fbbf24', bg: 'rgba(251,191,36,.07)', border: 'rgba(251,191,36,.3)',  action: 'FIQUE FORA — aguarde sinal mais claro' },
  VENDA:        { label: 'VENDA',          icon: '▼',  color: '#f97316', bg: 'rgba(249,115,22,.07)', border: 'rgba(249,115,22,.35)', action: 'ENTRE VENDIDO' },
  FORTE_VENDA:  { label: 'VENDA FORTE',   icon: '▼▼', color: '#ff3355', bg: 'rgba(255,51,85,.09)',   border: 'rgba(255,51,85,.4)',   action: 'ENTRE VENDIDO AGORA' },
};

const STATUS_CFG = {
  ok:   { icon: '✅', color: '#00ff88', label: 'OK' },
  wait: { icon: '⏳', color: '#fbbf24', label: 'AGUARDAR' },
  bad:  { icon: '❌', color: '#ff3355', label: 'ALERTA' },
};

// ── Setup card ───────────────────────────────────────────────────────────────

const SetupCard = ({ s, verdictColor }) => {
  if (!s) return (
    <div className="tg-setup-card neutral-card">
      <div className="setup-asset">{s?.asset ?? '—'}</div>
      <div className="setup-wait">● Aguardar sinal direcional claro</div>
    </div>
  );
  const dc = s.isCompra ? '#00ff88' : '#ff3355';
  return (
    <div className="tg-setup-card" style={{ borderColor: dc + '33', background: dc + '06' }}>
      <div className="setup-asset-row">
        <span className="setup-asset">{s.asset}</span>
        <span className="setup-dir-badge" style={{ color: dc, borderColor: dc + '44', background: dc + '12' }}>
          {s.isCompra ? '▲ COMPRAR' : '▼ VENDER'}
        </span>
      </div>

      {/* Price ladder */}
      <div className="setup-ladder">
        <div className="ladder-row t2-row">
          <span className="lr-label">ALVO 2</span>
          <span className="lr-value font-mono">{s.t2}</span>
          <span className="lr-meta">+R$ {s.t2Gain} · R:R 1:{s.rr2}</span>
        </div>
        <div className="ladder-row t1-row">
          <span className="lr-label">ALVO 1</span>
          <span className="lr-value font-mono">{s.t1}</span>
          <span className="lr-meta">+R$ {s.t1Gain} · R:R 1:{s.rr1}</span>
        </div>
        <div className="ladder-divider" style={{ borderColor: dc + '55' }}>
          <span className="ld-label" style={{ color: dc }}>▶ ENTRADA</span>
          <span className="ld-value font-mono" style={{ color: dc }}>{s.entry} {s.unit}</span>
        </div>
        <div className="ladder-row stop-row">
          <span className="lr-label stop-lbl">STOP LOSS</span>
          <span className="lr-value font-mono stop-val">{s.stop}</span>
          <span className="lr-meta">−R$ {s.stopRisk} / mini</span>
        </div>
      </div>

      {s.note && <div className="setup-note">{s.note}</div>}

      <div className="setup-margin-row">
        <span className="sm-label">Margem mín. por contrato</span>
        <span className="sm-val font-mono">R$ {s.margin.toLocaleString('pt-BR')}</span>
      </div>
    </div>
  );
};

// ── Setup card para o ativo pesquisado (usa o resultado do Robô Analista) ────

const CustomAssetSetup = ({ asset, result }) => {
  if (!result) {
    return (
      <div className="tg-setup-card neutral-card">
        <div className="setup-asset">{asset.icon} {asset.label}</div>
        <div className="setup-wait">● Rode o Robô Analista Técnico para gerar o setup deste ativo</div>
      </div>
    );
  }
  if (result.direction === 'SEM OPERAÇÃO') {
    return (
      <div className="tg-setup-card neutral-card">
        <div className="setup-asset">{asset.icon} {asset.label}</div>
        <div className="setup-wait">⏸ SEM OPERAÇÃO — {result.motivo}</div>
      </div>
    );
  }
  const isCompra = result.direction === 'COMPRA';
  const dc = isCompra ? '#00ff88' : '#ff3355';
  return (
    <div className="tg-setup-card" style={{ borderColor: dc + '33', background: dc + '06' }}>
      <div className="setup-asset-row">
        <span className="setup-asset">{asset.icon} {asset.label}</span>
        <span className="setup-dir-badge" style={{ color: dc, borderColor: dc + '44', background: dc + '12' }}>
          {isCompra ? '▲ COMPRAR' : '▼ VENDER'}
        </span>
      </div>
      <div className="setup-ladder">
        <div className="ladder-row t2-row">
          <span className="lr-label">ALVO 2</span>
          <span className="lr-value font-mono">{result.t2}</span>
        </div>
        <div className="ladder-row t1-row">
          <span className="lr-label">ALVO 1</span>
          <span className="lr-value font-mono">{result.t1}</span>
        </div>
        <div className="ladder-divider" style={{ borderColor: dc + '55' }}>
          <span className="ld-label" style={{ color: dc }}>▶ ENTRADA</span>
          <span className="ld-value font-mono" style={{ color: dc }}>{result.entry}</span>
        </div>
        <div className="ladder-row stop-row">
          <span className="lr-label stop-lbl">STOP LOSS</span>
          <span className="lr-value font-mono stop-val">{result.stopL}</span>
        </div>
      </div>
      <div className="setup-note">{result.score}/5 confluências técnicas · {result.prob}% probabilidade</div>
    </div>
  );
};

// ── Main component ───────────────────────────────────────────────────────────

const TradeGuide = ({ macroSignal, lastAlert, winPrice, dolarPrice, asset, assetResult }) => {
  const { checks, verdict, dir, score, conviction } = useMemo(
    () => evalGuide(macroSignal, lastAlert),
    [macroSignal, lastAlert],
  );

  const winSetup = useMemo(() => calcWinSetup(winPrice, dir, conviction),  [winPrice, dir, conviction]);
  const dolSetup = useMemo(() => calcDolSetup(dolarPrice, dir, conviction), [dolarPrice, dir, conviction]);

  const v = VERDICTS[verdict];
  const isCustomAsset = asset && !['WIN', 'DOL'].includes(asset.key);

  return (
    <div className="trade-guide">

      {/* ── TÍTULO ─────────────────────────────────────────────────── */}
      <div className="tg-header">
        <div className="tg-title-group">
          <span className="tg-icon">🎯</span>
          <div>
            <div className="tg-title">Guia de Trade</div>
            <div className="tg-sub">
              WIN Mini &amp; DOL Mini{isCustomAsset ? ` & ${asset.label}` : ''} — o que fazer agora
            </div>
          </div>
        </div>
      </div>

      {/* ── VEREDITO ────────────────────────────────────────────────── */}
      <div className="tg-verdict" style={{ background: v.bg, borderColor: v.border }}>
        <div className="tv-icon" style={{ color: v.color }}>{v.icon}</div>
        <div className="tv-main">
          <div className="tv-label" style={{ color: v.color }}>{v.label}</div>
          <div className="tv-action">{v.action}</div>
        </div>
        <div className="tv-score-pill" style={{ color: v.color, borderColor: v.border, background: v.bg }}>
          <div className="tvs-top">Score</div>
          <div className="tvs-val">{score > 0 ? '+' : ''}{score}</div>
        </div>
      </div>

      {/* ── CHECKLIST ───────────────────────────────────────────────── */}
      <div className="tg-checklist">
        <div className="tcl-title">Checklist antes de entrar</div>
        <div className="tcl-items">
          {checks.map(c => {
            const sc = STATUS_CFG[c.status];
            return (
              <div key={c.num} className={`tcl-row ${c.status}`}>
                <div className="tcl-left">
                  <span className="tcl-num">{c.num}</span>
                  <div>
                    <div className="tcl-label">{c.label}</div>
                    <div className="tcl-tip" style={{ color: sc.color }}>{c.tip}</div>
                  </div>
                </div>
                <div className="tcl-right">
                  <span className="tcl-detail font-mono">{c.detail}</span>
                  <span className="tcl-icon">{sc.icon}</span>
                </div>
              </div>
            );
          })}
        </div>

        {verdict === 'AGUARDAR' && (
          <div className="tg-wait-msg">
            ⏸ Aguarde: não há sinal claro suficiente no momento. Operar agora seria especulação sem edge.
          </div>
        )}
      </div>

      {/* ── SETUPS ──────────────────────────────────────────────────── */}
      {(verdict !== 'AGUARDAR' || isCustomAsset) && (
        <div className="tg-setups">
          <div className="tg-setups-title">Setups para operar agora</div>
          <div className={`tg-setups-grid ${isCustomAsset ? 'tg-setups-grid-3' : ''}`}>
            <SetupCard s={winSetup} verdictColor={v.color} />
            <SetupCard s={dolSetup} verdictColor={v.color} />
            {isCustomAsset && <CustomAssetSetup asset={asset} result={assetResult} />}
          </div>
          <div className="tg-disclaimer">
            ⚠️ Use sempre stop loss. Este guia é educacional e não constitui recomendação de investimento.
          </div>
        </div>
      )}

      <style jsx="true">{`
        .trade-guide {
          background: linear-gradient(135deg, rgba(8,10,18,.98), rgba(12,16,30,.98));
          border: 1px solid rgba(99,149,255,.22);
          border-radius: 16px;
          padding: 1.3rem;
          margin-bottom: 1.4rem;
        }

        /* Header */
        .tg-header {
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: .5rem;
          padding-bottom: .9rem; border-bottom: 1px solid rgba(255,255,255,.06);
          margin-bottom: 1rem;
        }
        .tg-title-group { display: flex; align-items: center; gap: .65rem; }
        .tg-icon  { font-size: 1.5rem; }
        .tg-title { font-size: 1rem; font-weight: 800;
          background: linear-gradient(135deg,#6395ff,#a855f7); -webkit-background-clip:text;
          -webkit-text-fill-color:transparent; background-clip:text; }
        .tg-sub   { font-size: .6rem; color: var(--text-muted); margin-top: 1px; }

        /* Verdict */
        .tg-verdict {
          display: flex; align-items: center; gap: 1rem;
          padding: 1rem 1.1rem; border-radius: 12px; border: 1px solid;
          margin-bottom: 1rem;
        }
        .tv-icon  { font-size: 2rem; font-weight: 900; flex-shrink: 0; line-height: 1; }
        .tv-main  { flex: 1; }
        .tv-label { font-size: 1.3rem; font-weight: 900; letter-spacing: -.5px; }
        .tv-action { font-size: .72rem; color: var(--text-muted); margin-top: 2px; }
        .tv-score-pill {
          display: flex; flex-direction: column; align-items: center;
          padding: .5rem .9rem; border-radius: 10px; border: 1px solid; flex-shrink: 0;
        }
        .tvs-top { font-size: .5rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: .06em; }
        .tvs-val { font-size: 1.25rem; font-weight: 900; font-family: var(--font-mono); }

        /* Checklist */
        .tg-checklist { margin-bottom: 1rem; }
        .tcl-title {
          font-size: .6rem; font-weight: 800; color: var(--text-muted);
          text-transform: uppercase; letter-spacing: .08em; margin-bottom: .5rem;
        }
        .tcl-items { display: flex; flex-direction: column; gap: .22rem; }
        .tcl-row {
          display: flex; align-items: center; justify-content: space-between; gap: .5rem;
          padding: .5rem .65rem; border-radius: 8px;
          border: 1px solid rgba(255,255,255,.04); background: rgba(255,255,255,.02);
          transition: background .15s;
        }
        .tcl-row.ok   { border-color: rgba(0,255,136,.12);  background: rgba(0,255,136,.04); }
        .tcl-row.bad  { border-color: rgba(255,51,85,.12);  background: rgba(255,51,85,.04); }
        .tcl-row.wait { border-color: rgba(251,191,36,.10); background: rgba(251,191,36,.03); }
        .tcl-left { display: flex; align-items: flex-start; gap: .45rem; flex: 1; }
        .tcl-num  {
          width: 18px; height: 18px; border-radius: 50%; background: rgba(255,255,255,.07);
          display: flex; align-items: center; justify-content: center;
          font-size: .6rem; font-weight: 800; color: var(--text-muted); flex-shrink: 0;
        }
        .tcl-label { font-size: .68rem; font-weight: 700; color: var(--text-secondary); }
        .tcl-tip   { font-size: .59rem; margin-top: 1px; font-weight: 600; }
        .tcl-right { display: flex; align-items: center; gap: .55rem; flex-shrink: 0; }
        .tcl-detail { font-size: .63rem; color: var(--text-muted); }
        .tcl-icon  { font-size: .85rem; }

        .tg-wait-msg {
          margin-top: .65rem; padding: .6rem .75rem; border-radius: 8px;
          background: rgba(251,191,36,.07); border: 1px solid rgba(251,191,36,.25);
          color: #fbbf24; font-size: .68rem; font-weight: 600; line-height: 1.4;
        }

        /* Setups */
        .tg-setups-title {
          font-size: .6rem; font-weight: 800; color: var(--text-muted);
          text-transform: uppercase; letter-spacing: .08em; margin-bottom: .6rem;
        }
        .tg-setups-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: .8rem;
        }
        .tg-setups-grid-3 { grid-template-columns: 1fr 1fr 1fr; }
        @media (max-width: 700px) { .tg-setups-grid, .tg-setups-grid-3 { grid-template-columns: 1fr; } }

        .tg-setup-card {
          border: 1px solid rgba(255,255,255,.07); border-radius: 12px;
          padding: .85rem; background: rgba(255,255,255,.02);
          display: flex; flex-direction: column; gap: .6rem;
        }
        .neutral-card { opacity: .5; }
        .setup-wait { font-size: .7rem; color: var(--text-muted); text-align: center; padding: .8rem 0; }

        .setup-asset-row { display: flex; align-items: center; justify-content: space-between; gap: .4rem; }
        .setup-asset { font-size: .72rem; font-weight: 800; color: var(--text-secondary); }
        .setup-dir-badge {
          font-size: .58rem; font-weight: 800; padding: 2px 7px; border-radius: 5px;
          border: 1px solid; text-transform: uppercase; letter-spacing: .4px;
        }

        /* Ladder */
        .setup-ladder { display: flex; flex-direction: column; gap: .28rem; }
        .ladder-row {
          display: flex; align-items: center; gap: .45rem; flex-wrap: wrap;
          padding: .35rem .5rem; border-radius: 6px; background: rgba(255,255,255,.02);
        }
        .t2-row { border-left: 2px solid rgba(0,255,136,.6); }
        .t1-row { border-left: 2px solid rgba(74,222,128,.5); }
        .stop-row { border-left: 2px solid rgba(255,51,85,.5); }
        .lr-label     { font-size: .52rem; font-weight: 800; color: var(--text-muted); min-width: 52px; text-transform: uppercase; letter-spacing: .05em; }
        .stop-lbl     { color: #ff3355 !important; }
        .lr-value     { font-size: .82rem; font-weight: 800; color: var(--text-primary); }
        .stop-val     { color: #ff3355 !important; }
        .lr-meta      { font-size: .57rem; color: var(--text-muted); margin-left: auto; }

        .ladder-divider {
          display: flex; align-items: center; justify-content: space-between;
          border: 1px solid; border-radius: 6px; padding: .38rem .55rem;
          background: rgba(255,255,255,.04);
        }
        .ld-label { font-size: .6rem; font-weight: 900; letter-spacing: .04em; }
        .ld-value { font-size: .9rem; font-weight: 900; }

        .setup-note {
          font-size: .58rem; color: var(--text-muted); font-style: italic;
          padding: .3rem .4rem; background: rgba(255,255,255,.025); border-radius: 5px;
        }
        .setup-margin-row {
          display: flex; align-items: center; justify-content: space-between;
          padding-top: .3rem; border-top: 1px solid rgba(255,255,255,.05);
        }
        .sm-label { font-size: .56rem; color: var(--text-muted); }
        .sm-val   { font-size: .7rem; font-weight: 800; color: var(--text-secondary); }

        .tg-disclaimer {
          margin-top: .6rem; font-size: .58rem; color: var(--text-muted);
          text-align: center; line-height: 1.45;
        }
      `}</style>
    </div>
  );
};

export default React.memo(TradeGuide);
