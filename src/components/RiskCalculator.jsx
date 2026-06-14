import React, { useState, useMemo } from 'react';

const ASSETS = [
  {
    id:       'WIN',
    label:    'WIN Mini (Ibovespa)',
    icon:     '🇧🇷',
    color:    '#10b981',
    ptValue:  0.20,    // R$ por ponto por contrato
    margin:   150,     // R$ por contrato (aproximado)
    unit:     'pts',
    example:  { entry: 135000, stop: 133500, t1: 137000, t2: 139000 },
  },
  {
    id:       'WDO',
    label:    'WDO Mini (Dólar)',
    icon:     '💵',
    color:    '#06b6d4',
    ptValue:  10.00,   // R$ por ponto (1 ponto = 0.001 em USD/BRL × 10000)
    margin:   2000,    // R$ por contrato (aproximado)
    unit:     'ticks',
    example:  { entry: 5250, stop: 5220, t1: 5290, t2: 5340 },
  },
];

const fmt = (n) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtI = (n) => Math.round(n).toLocaleString('pt-BR');
const pct  = (n) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;

const Row = ({ label, value, color, sub, bold }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '.42rem .6rem', borderBottom: '1px solid rgba(255,255,255,.04)',
  }}>
    <span style={{ fontSize: '.68rem', color: 'var(--text-muted)' }}>{label}</span>
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: bold ? '.92rem' : '.75rem', fontWeight: bold ? 800 : 700,
        color: color || 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '.57rem', color: 'var(--text-muted)', marginTop: 1 }}>{sub}</div>}
    </div>
  </div>
);

const RiskCalculator = () => {
  const [assetId, setAssetId]   = useState('WIN');
  const [opType,  setOpType]    = useState('COMPRA');
  const [balance, setBalance]   = useState('50000');
  const [riskPct, setRiskPct]   = useState('2');
  const [entry,   setEntry]     = useState('');
  const [stop,    setStop]      = useState('');
  const [t1,      setT1]        = useState('');
  const [t2,      setT2]        = useState('');

  const asset = ASSETS.find(a => a.id === assetId);

  // Load example values when asset changes
  const loadExample = () => {
    const ex = asset.example;
    setEntry(String(ex.entry));
    setStop (String(ex.stop));
    setT1   (String(ex.t1));
    setT2   (String(ex.t2));
  };

  const calc = useMemo(() => {
    const bal  = parseFloat(balance)  || 0;
    const risk = parseFloat(riskPct)  || 0;
    const E    = parseFloat(entry)    || 0;
    const S    = parseFloat(stop)     || 0;
    const A1   = parseFloat(t1)       || 0;
    const A2   = parseFloat(t2)       || 0;
    if (!bal || !E || !S) return null;

    const stopDist  = Math.abs(E - S);
    const t1Dist    = A1 ? Math.abs(A1 - E) : 0;
    const t2Dist    = A2 ? Math.abs(A2 - E) : 0;
    const isCompra  = opType === 'COMPRA';

    // Direction check
    const stopOk = isCompra ? S < E : S > E;
    const t1Ok   = A1 ? (isCompra ? A1 > E : A1 < E) : true;

    if (!stopOk) return { error: `Stop deve ser ${isCompra ? 'abaixo' : 'acima'} da entrada para COMPRA/VENDA.` };
    if (A1 && !t1Ok) return { error: `Alvo 1 deve ser ${isCompra ? 'acima' : 'abaixo'} da entrada.` };

    const riskPerContract = stopDist * asset.ptValue;
    if (riskPerContract <= 0) return null;

    const maxRiskBRL   = bal * (risk / 100);
    const contracts    = Math.max(1, Math.floor(maxRiskBRL / riskPerContract));
    const totalRisk    = contracts * riskPerContract;
    const totalMargin  = contracts * asset.margin;
    const g1           = A1 ? contracts * t1Dist * asset.ptValue : 0;
    const g2           = A2 ? contracts * t2Dist * asset.ptValue : 0;
    const rr1          = t1Dist > 0 ? (t1Dist / stopDist).toFixed(1) : null;
    const rr2          = t2Dist > 0 ? (t2Dist / stopDist).toFixed(1) : null;
    const be1          = rr1 ? (1 / (1 + parseFloat(rr1)) * 100) : null;
    const be2          = rr2 ? (1 / (1 + parseFloat(rr2)) * 100) : null;

    const stopPct  = ((stopDist / E) * 100).toFixed(2);
    const t1Pct    = A1 ? ((t1Dist / E) * 100).toFixed(2) : null;
    const t2Pct    = A2 ? ((t2Dist / E) * 100).toFixed(2) : null;

    return {
      contracts, riskPerContract, totalRisk, totalMargin,
      stopDist: fmtI(stopDist), stopPct,
      g1, g2, rr1, rr2, be1, be2,
      t1Pct, t2Pct,
      maxRiskBRL,
      riskedPct:  ((totalRisk / bal) * 100).toFixed(2),
      profitPct1: A1 ? ((g1 / bal) * 100).toFixed(2) : null,
      profitPct2: A2 ? ((g2 / bal) * 100).toFixed(2) : null,
    };
  }, [assetId, opType, balance, riskPct, entry, stop, t1, t2, asset]);

  const isBuy = opType === 'COMPRA';

  return (
    <div className="risk-calc">
      {/* Header */}
      <div className="rc-header">
        <div className="rc-title-group">
          <span className="rc-icon">🧮</span>
          <div>
            <div className="rc-title">Calculadora de Risco</div>
            <div className="rc-sub">Gestão de posição · Stop · R:R · Breakeven</div>
          </div>
        </div>
        <button className="rc-example-btn" onClick={loadExample}>Carregar exemplo</button>
      </div>

      {/* Asset + Op type */}
      <div className="rc-row-2">
        <div className="rc-field-group">
          <label className="rc-label">Ativo</label>
          <div className="rc-toggle-row">
            {ASSETS.map(a => (
              <button key={a.id} className={`rc-toggle ${assetId === a.id ? 'active' : ''}`}
                style={assetId === a.id ? { '--tc': a.color } : {}}
                onClick={() => setAssetId(a.id)}>
                {a.icon} {a.id}
              </button>
            ))}
          </div>
        </div>
        <div className="rc-field-group">
          <label className="rc-label">Tipo</label>
          <div className="rc-toggle-row">
            {['COMPRA','VENDA'].map(t => (
              <button key={t} className={`rc-toggle ${opType === t ? 'active' : ''}`}
                style={opType === t ? { '--tc': t === 'COMPRA' ? '#00ff88' : '#ff3355' } : {}}
                onClick={() => setOpType(t)}>
                {t === 'COMPRA' ? '▲' : '▼'} {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Account + Risk */}
      <div className="rc-row-2">
        <div className="rc-field-group">
          <label className="rc-label">Saldo da Conta (R$)</label>
          <input type="number" className="rc-input" value={balance} onChange={e => setBalance(e.target.value)} placeholder="50000" />
        </div>
        <div className="rc-field-group">
          <label className="rc-label">Risco por Op. (%)</label>
          <div style={{ position: 'relative' }}>
            <input type="number" className="rc-input" value={riskPct} onChange={e => setRiskPct(e.target.value)} placeholder="2" step="0.5" min="0.1" max="10" />
            <span className="rc-risk-badge" style={{ color: parseFloat(riskPct) > 3 ? '#ff3355' : '#10b981' }}>
              {riskPct ? `R$ ${fmt(parseFloat(balance || 0) * parseFloat(riskPct || 0) / 100)}` : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Price levels */}
      <div className="rc-levels">
        <div className="rc-field-group">
          <label className="rc-label">📍 Entrada ({asset.unit})</label>
          <input type="number" className="rc-input rc-entry" value={entry} onChange={e => setEntry(e.target.value)} placeholder={String(asset.example.entry)} />
        </div>
        <div className="rc-field-group">
          <label className="rc-label">🛑 Stop Loss</label>
          <input type="number" className="rc-input rc-stop" value={stop} onChange={e => setStop(e.target.value)} placeholder={String(asset.example.stop)} />
        </div>
        <div className="rc-field-group">
          <label className="rc-label">🎯 Alvo 1</label>
          <input type="number" className="rc-input rc-t1" value={t1} onChange={e => setT1(e.target.value)} placeholder={String(asset.example.t1)} />
        </div>
        <div className="rc-field-group">
          <label className="rc-label">🎯 Alvo 2</label>
          <input type="number" className="rc-input rc-t2" value={t2} onChange={e => setT2(e.target.value)} placeholder={String(asset.example.t2)} />
        </div>
      </div>

      {/* Results */}
      {calc?.error ? (
        <div className="rc-error">{calc.error}</div>
      ) : calc ? (
        <div className="rc-results">

          {/* Headline */}
          <div className="rc-headline" style={{ '--dc': isBuy ? '#00ff88' : '#ff3355' }}>
            <div className="rc-headline-dir">{isBuy ? '▲' : '▼'} {opType}</div>
            <div className="rc-headline-contracts">
              <span className="rc-big-num">{calc.contracts}</span>
              <span className="rc-big-unit">mini{calc.contracts > 1 ? 's' : ''}</span>
            </div>
            <div className="rc-headline-risk">
              Risco: <strong style={{ color: '#ff3355' }}>R$ {fmt(calc.totalRisk)}</strong>
              <span style={{ color: 'var(--text-muted)', fontSize: '.7rem' }}> ({calc.riskedPct}%)</span>
            </div>
          </div>

          {/* Details grid */}
          <div className="rc-detail-grid">
            <div className="rc-detail-col">
              <div className="rc-col-title">Risco</div>
              <Row label="Stop dist."       value={`${calc.stopDist} pts`}                  sub={`-${calc.stopPct}% da entrada`} />
              <Row label="Risco/contrato"   value={`R$ ${fmt(calc.riskPerContract)}`}       />
              <Row label="Risco total"      value={`R$ ${fmt(calc.totalRisk)}`}             color="#ff3355" bold />
              <Row label="Margem estimada"  value={`R$ ${fmtI(calc.totalMargin)}`}          sub="(aproximado)" />
              <Row label="% da conta"       value={pct(parseFloat(calc.riskedPct))}         color={parseFloat(calc.riskedPct) > 3 ? '#ff3355' : '#fbbf24'} />
            </div>

            <div className="rc-detail-col">
              <div className="rc-col-title">Alvos</div>
              {calc.g1 > 0 && <>
                <Row label="Alvo 1 ganho" value={`R$ ${fmt(calc.g1)}`} color="#00ff88" bold
                  sub={`+${calc.t1Pct}% · ${calc.profitPct1}% da conta`} />
                <Row label="R:R Alvo 1"   value={`1:${calc.rr1}`} color="#4ade80" />
                <Row label="Breakeven 1"  value={`${calc.be1?.toFixed(1)}% de acerto`}
                  sub={`Precisar acertar ${Math.ceil(parseFloat(calc.be1))}% das op.`} />
              </>}
              {calc.g2 > 0 && <>
                <Row label="Alvo 2 ganho" value={`R$ ${fmt(calc.g2)}`} color="#00ff88" bold
                  sub={`+${calc.t2Pct}% · ${calc.profitPct2}% da conta`} />
                <Row label="R:R Alvo 2"   value={`1:${calc.rr2}`} color="#4ade80" />
                <Row label="Breakeven 2"  value={`${calc.be2?.toFixed(1)}% de acerto`} />
              </>}
            </div>
          </div>

          {/* Asset spec */}
          <div className="rc-asset-spec">
            <span style={{ color: asset.color }}>ℹ️ {asset.label}:</span>
            <span>1 ponto = R$ {asset.ptValue.toFixed(2)} · Margem ≈ R$ {asset.margin}/contrato</span>
          </div>
        </div>
      ) : (
        <div className="rc-placeholder">Preencha entrada e stop para calcular</div>
      )}

      <style jsx="true">{`
        .risk-calc {
          background: linear-gradient(135deg,rgba(8,10,18,.97),rgba(12,16,28,.97));
          border: 1px solid rgba(255,255,255,.08); border-radius: 16px;
          padding: 1.2rem; margin-bottom: 1.2rem;
        }

        .rc-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 1rem; flex-wrap: wrap; gap: .5rem;
        }
        .rc-title-group { display: flex; align-items: center; gap: .6rem; }
        .rc-icon { font-size: 1.4rem; }
        .rc-title { font-size: .92rem; font-weight: 800; color: var(--text-primary); }
        .rc-sub   { font-size: .6rem;  color: var(--text-muted); }
        .rc-example-btn {
          padding: .3rem .7rem; border-radius: 8px; font-size: .65rem; font-weight: 700;
          border: 1px solid rgba(88,166,255,.3); background: rgba(88,166,255,.08);
          color: #58a6ff; cursor: pointer; transition: all .2s;
        }
        .rc-example-btn:hover { background: rgba(88,166,255,.16); }

        .rc-row-2   { display: grid; grid-template-columns: 1fr 1fr; gap: .7rem; margin-bottom: .7rem; }
        .rc-levels  { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: .55rem; margin-bottom: .8rem; }
        @media (max-width: 720px) { .rc-levels { grid-template-columns: 1fr 1fr; } .rc-row-2 { grid-template-columns: 1fr; } }

        .rc-field-group { display: flex; flex-direction: column; gap: .28rem; }
        .rc-label { font-size: .6rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: .06em; }

        .rc-toggle-row { display: flex; gap: .3rem; }
        .rc-toggle {
          flex: 1; padding: .38rem .5rem; border-radius: 8px; border: 1px solid rgba(255,255,255,.1);
          background: rgba(255,255,255,.04); color: var(--text-muted); font-size: .7rem; font-weight: 700;
          cursor: pointer; transition: all .2s; text-align: center;
        }
        .rc-toggle.active {
          background: color-mix(in srgb,var(--tc,#fff) 15%,transparent);
          border-color: color-mix(in srgb,var(--tc,#fff) 45%,transparent);
          color: var(--tc,#fff);
        }

        .rc-input {
          width: 100%; padding: .42rem .55rem; border-radius: 8px;
          border: 1px solid rgba(255,255,255,.1); background: rgba(255,255,255,.04);
          color: var(--text-primary); font-size: .8rem; font-family: var(--font-mono);
          outline: none; transition: border-color .2s;
        }
        .rc-input:focus { border-color: rgba(88,166,255,.4); }
        .rc-entry { border-color: rgba(99,149,255,.25) !important; }
        .rc-stop  { border-color: rgba(255,51,85,.25)  !important; }
        .rc-t1, .rc-t2 { border-color: rgba(0,255,136,.2) !important; }

        .rc-risk-badge {
          position: absolute; right: .55rem; top: 50%; transform: translateY(-50%);
          font-size: .58rem; font-weight: 700; font-family: var(--font-mono); pointer-events: none;
        }

        .rc-error { background: rgba(255,51,85,.1); border: 1px solid rgba(255,51,85,.3); border-radius: 10px; padding: .75rem 1rem; font-size: .75rem; color: #ff3355; }
        .rc-placeholder { padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: .75rem; }

        .rc-results { display: flex; flex-direction: column; gap: .65rem; }

        .rc-headline {
          display: flex; align-items: center; gap: 1rem; padding: .8rem 1rem;
          background: color-mix(in srgb,var(--dc,#fff) 8%,transparent);
          border: 1px solid color-mix(in srgb,var(--dc,#fff) 30%,transparent);
          border-radius: 12px; flex-wrap: wrap;
        }
        .rc-headline-dir { font-size: .85rem; font-weight: 900; color: var(--dc,#fff); }
        .rc-headline-contracts { display: flex; align-items: baseline; gap: .25rem; }
        .rc-big-num  { font-size: 2rem; font-weight: 900; color: var(--text-primary); font-family: var(--font-mono); }
        .rc-big-unit { font-size: .75rem; color: var(--text-muted); }
        .rc-headline-risk { font-size: .75rem; color: var(--text-secondary); }

        .rc-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .6rem; }
        @media (max-width: 600px) { .rc-detail-grid { grid-template-columns: 1fr; } }
        .rc-detail-col { background: rgba(255,255,255,.025); border: 1px solid rgba(255,255,255,.06); border-radius: 10px; overflow: hidden; }
        .rc-col-title { font-size: .58rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: .08em; padding: .4rem .6rem; border-bottom: 1px solid rgba(255,255,255,.04); background: rgba(255,255,255,.02); }

        .rc-asset-spec {
          display: flex; align-items: center; gap: .5rem; flex-wrap: wrap;
          font-size: .6rem; color: var(--text-muted); padding: .5rem .7rem;
          background: rgba(255,255,255,.02); border: 1px solid rgba(255,255,255,.05); border-radius: 8px;
        }
      `}</style>
    </div>
  );
};

export default RiskCalculator;
