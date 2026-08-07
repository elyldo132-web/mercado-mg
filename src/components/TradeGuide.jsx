import React, { useMemo } from 'react';
import AssetDirectionCard from './AssetDirectionCard';

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

const evalGuide = (macroSignal, lastAlert, globalMacro) => {
  const score      = macroSignal?.score      ?? 0;
  const conviction = macroSignal?.conviction ?? 50;
  const dir        = macroSignal?.direction  ?? 'NEUTRO';
  const newsAction = lastAlert?.tradeAction;
  const newsStr    = lastAlert?.strength;
  const gScore      = globalMacro?.score;
  const gConfidence = globalMacro?.confidence ?? 0;

  const st = (ok, bad) => ok ? 'ok' : bad ? 'bad' : 'wait';

  const macroSt  = st(Math.abs(score) >= 15 && score !== 0, false);
  const convSt   = st(conviction >= 60, conviction < 40);
  const newsSt   = newsAction === 'Compra' && dir === 'COMPRA' ? 'ok'
                 : newsAction === 'Venda'  && dir === 'VENDA'  ? 'ok'
                 : newsAction === 'Compra' && dir === 'VENDA'  ? 'bad'
                 : newsAction === 'Venda'  && dir === 'COMPRA' ? 'bad'
                 : 'wait';
  const strSt    = st(Math.abs(score) >= 30, Math.abs(score) < 15);
  const gSt      = gScore == null ? 'wait'
                 : dir === 'COMPRA' && gScore >=  10 ? 'ok'
                 : dir === 'VENDA'  && gScore <= -10 ? 'ok'
                 : dir === 'COMPRA' && gScore <= -15 ? 'bad'
                 : dir === 'VENDA'  && gScore >=  15 ? 'bad'
                 : 'wait';

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
    {
      num: 5, label: 'Sentimento Global',
      detail: gScore == null ? 'Sem dado' : `${gScore > 0 ? '+' : ''}${gScore} (${gConfidence}% conf.)`,
      tip: gScore == null ? 'Indicadores globais indisponíveis no momento'
         : gSt === 'ok'  ? 'DXY/VIX/Treasury/S&P/Nasdaq/BTC/ETH/Ouro/Petróleo confirmam o viés'
         : gSt === 'bad' ? 'Indicadores globais CONTRA o viés — cuidado!'
         : 'Cenário global neutro ou pouco conclusivo',
      status: gSt,
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

// ── Adapta os setups (WIN/DOL) e o resultado do Robô Analista para o formato
//    de escada de preço do AssetDirectionCard ───────────────────────────────

const setupToLadder = (s, unit) => !s ? undefined : {
  entry: `${s.entry} ${unit ?? s.unit}`,
  stop: s.stop, stopMeta: `−R$ ${s.stopRisk} / mini`,
  t1: s.t1, t1Meta: `+R$ ${s.t1Gain} · R:R 1:${s.rr1}`,
  t2: s.t2, t2Meta: `+R$ ${s.t2Gain} · R:R 1:${s.rr2}`,
};

const resultToLadder = (result) => !result || result.direction === 'SEM OPERAÇÃO' ? undefined : {
  entry: result.entry, stop: result.stopL, t1: result.t1, t2: result.t2,
};

// ── Linha compacta para oportunidades encontradas pelo scanner automático ───

const OpportunityRow = ({ opp }) => {
  const isCompra = opp.signal === 'COMPRA';
  const dc = isCompra ? '#00ff88' : '#ff3355';
  const fmt = (n) => (opp.group === 'acoes-eua' || opp.group === 'cripto')
    ? '$' + n.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : 'R$ ' + n.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
  return (
    <div className="opp-row">
      <span className="opp-row-asset">{opp.icon} {opp.label}</span>
      <span className="opp-row-cat">{opp.cat}</span>
      <span className="opp-row-dir" style={{ color: dc, borderColor: dc + '44', background: dc + '12' }}>
        {isCompra ? '▲' : '▼'} {opp.signal}
      </span>
      <span className="opp-row-price font-mono">{fmt(opp.price)}</span>
      <span className="opp-row-change font-mono" style={{ color: dc }}>{opp.change > 0 ? '+' : ''}{opp.change}%</span>
    </div>
  );
};

// ── Main component ───────────────────────────────────────────────────────────

const TradeGuide = ({ macroSignal, lastAlert, winPrice, dolarPrice, asset, assetResult, opportunities, globalMacro }) => {
  const { checks, verdict, dir, score, conviction } = useMemo(
    () => evalGuide(macroSignal, lastAlert, globalMacro),
    [macroSignal, lastAlert, globalMacro],
  );

  const winSetup = useMemo(() => calcWinSetup(winPrice, dir, conviction),  [winPrice, dir, conviction]);
  const dolSetup = useMemo(() => calcDolSetup(dolarPrice, dir, conviction), [dolarPrice, dir, conviction]);

  const v = VERDICTS[verdict];
  const isCustomAsset = asset && !['WIN', 'DOL'].includes(asset.key);
  const filteredOpportunities = (opportunities || []).filter(o => !(isCustomAsset && o.key === asset.key));
  const hasOpportunities = filteredOpportunities.length > 0;

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
      {(verdict !== 'AGUARDAR' || isCustomAsset || hasOpportunities) && (
        <div className="tg-setups">
          {(verdict !== 'AGUARDAR' || isCustomAsset) && (
            <>
              <div className="tg-setups-title">Setups para operar agora</div>
              <div className="tg-setups-grid">
                <AssetDirectionCard
                  icon="🇧🇷" name="WIN Mini (Ibovespa)" sub="WIN MINI"
                  op={winSetup ? (winSetup.isCompra ? 'COMPRAR' : 'VENDER') : 'AGUARDAR'}
                  score={score}
                  tip={winSetup ? `Alvo 1: ${winSetup.t1} · Stop: ${winSetup.stop}` : 'Aguardar sinal direcional claro'}
                  setup={setupToLadder(winSetup)}
                />
                <AssetDirectionCard
                  icon="💵" name="DOL Mini (Dólar)" sub="DÓLAR"
                  op={dolSetup ? (dolSetup.isCompra ? 'COMPRAR' : 'VENDER') : 'AGUARDAR'}
                  score={-score}
                  tip={dolSetup ? `Alvo 1: ${dolSetup.t1} · Stop: ${dolSetup.stop}` : 'Aguardar sinal direcional claro'}
                  note={dolSetup?.note ?? 'DOL sobe quando bolsa cai (correlação inversa)'}
                  setup={setupToLadder(dolSetup)}
                />
                {isCustomAsset && (
                  <AssetDirectionCard
                    icon={asset.icon ?? '🔎'} name={asset.label} sub={asset.label}
                    op={!assetResult ? 'AGUARDAR' : assetResult.direction === 'COMPRA' ? 'COMPRAR' : assetResult.direction === 'VENDA' ? 'VENDER' : 'AGUARDAR'}
                    score={assetResult?.score ?? 0}
                    tip={!assetResult ? 'Rode o Robô Analista Técnico para gerar o setup deste ativo'
                       : assetResult.direction === 'SEM OPERAÇÃO' ? `⏸ SEM OPERAÇÃO — ${assetResult.motivo}`
                       : `${assetResult.score}/5 confluências técnicas · ${assetResult.prob}% probabilidade`}
                    setup={resultToLadder(assetResult)}
                  />
                )}
              </div>
            </>
          )}

          {hasOpportunities && (
            <div className="tg-opp-list">
              <div className="tg-setups-title">🔍 Oportunidades encontradas (scanner automático)</div>
              {filteredOpportunities.map(o => <OpportunityRow key={o.key} opp={o} />)}
            </div>
          )}

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
          display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: .8rem;
        }

        /* Lista compacta de oportunidades do scanner */
        .tg-opp-list { margin-top: .9rem; display: flex; flex-direction: column; gap: .3rem; }
        .opp-row {
          display: flex; align-items: center; gap: .5rem;
          padding: .4rem .6rem; border-radius: 8px;
          background: rgba(255,255,255,.02); border: 1px solid rgba(255,255,255,.05);
        }
        .opp-row-asset { font-size: .68rem; font-weight: 700; color: var(--text-secondary); min-width: 90px; }
        .opp-row-cat { font-size: .56rem; color: var(--text-muted); min-width: 44px; }
        .opp-row-dir {
          font-size: .56rem; font-weight: 800; padding: 2px 7px; border-radius: 5px;
          border: 1px solid; text-transform: uppercase; letter-spacing: .3px;
        }
        .opp-row-price { font-size: .66rem; color: var(--text-secondary); margin-left: auto; }
        .opp-row-change { font-size: .64rem; font-weight: 800; min-width: 50px; text-align: right; }

        .tg-disclaimer {
          margin-top: .6rem; font-size: .58rem; color: var(--text-muted);
          text-align: center; line-height: 1.45;
        }
      `}</style>
    </div>
  );
};

export default React.memo(TradeGuide);
