import React from 'react';

const AssetDirectionCard = ({ icon, name, sub, op, score, tip, note, setup }) => {
  const isCompra = op === 'COMPRAR';
  const isAguarda = op === 'AGUARDAR';
  const color = isAguarda ? '#fbbf24' : isCompra ? '#00ff88' : '#ff3355';
  const dirIcon = isAguarda ? '⏸' : isCompra ? '▲' : '▼';

  return (
    <div className="adc-card" style={{ borderColor: color + '33', background: color + '0a' }}>
      <div className="adc-eyebrow">SENTIMENTO · {sub}</div>

      <div className="adc-verdict">
        <span className="adc-icon" style={{ color, textShadow: `0 0 16px ${color}` }}>{dirIcon}</span>
        <div>
          <div className="adc-label" style={{ color }}>{op}</div>
          <div className="adc-score">Score: {score > 0 ? '+' : ''}{score}</div>
        </div>
      </div>

      <div className="adc-asset-row">
        <span className="adc-asset-name">{icon} {name}</span>
        <span className="adc-badge" style={{ color, borderColor: color + '55', background: color + '15' }}>
          {dirIcon} {op}
        </span>
      </div>

      <div className="adc-tip">{tip}</div>

      {setup && (
        <div className="adc-ladder">
          {setup.t2 && (
            <div className="adc-lrow adc-lrow-t2">
              <span className="adc-lrow-label">ALVO 2</span>
              <span className="adc-lrow-value font-mono">{setup.t2}</span>
              {setup.t2Meta && <span className="adc-lrow-meta">{setup.t2Meta}</span>}
            </div>
          )}
          {setup.t1 && (
            <div className="adc-lrow adc-lrow-t1">
              <span className="adc-lrow-label">ALVO 1</span>
              <span className="adc-lrow-value font-mono">{setup.t1}</span>
              {setup.t1Meta && <span className="adc-lrow-meta">{setup.t1Meta}</span>}
            </div>
          )}
          <div className="adc-ldivider" style={{ borderColor: color + '55' }}>
            <span className="adc-ldivider-label" style={{ color }}>▶ ENTRADA</span>
            <span className="adc-ldivider-value font-mono" style={{ color }}>{setup.entry}</span>
          </div>
          {setup.stop && (
            <div className="adc-lrow adc-lrow-stop">
              <span className="adc-lrow-label adc-lrow-stop-label">STOP</span>
              <span className="adc-lrow-value font-mono adc-lrow-stop-value">{setup.stop}</span>
              {setup.stopMeta && <span className="adc-lrow-meta">{setup.stopMeta}</span>}
            </div>
          )}
        </div>
      )}

      {note && <div className="adc-note">{note}</div>}

      <style jsx="true">{`
        .adc-card {
          border: 1px solid; border-radius: 12px; padding: .9rem;
          display: flex; flex-direction: column; gap: .6rem;
        }
        .adc-eyebrow {
          font-size: .56rem; font-weight: 800; color: var(--text-muted);
          text-transform: uppercase; letter-spacing: .08em;
        }
        .adc-verdict { display: flex; align-items: center; gap: .6rem; }
        .adc-icon { font-size: 1.6rem; font-weight: 900; line-height: 1; }
        .adc-label { font-size: 1rem; font-weight: 900; letter-spacing: -.3px; }
        .adc-score { font-size: .62rem; color: var(--text-muted); margin-top: 1px; font-family: var(--font-mono); }

        .adc-asset-row {
          display: flex; align-items: center; justify-content: space-between; gap: .4rem;
          padding-top: .5rem; border-top: 1px solid rgba(255,255,255,.06);
        }
        .adc-asset-name { font-size: .72rem; font-weight: 700; color: var(--text-secondary); }
        .adc-badge {
          font-size: .58rem; font-weight: 800; padding: 2px 7px; border-radius: 5px;
          border: 1px solid; text-transform: uppercase; letter-spacing: .4px; white-space: nowrap;
        }

        .adc-tip { font-size: .64rem; color: var(--text-muted); line-height: 1.4; }
        .adc-note { font-size: .6rem; color: var(--text-muted); line-height: 1.4; font-style: italic; }

        .adc-ladder { display: flex; flex-direction: column; gap: .28rem; }
        .adc-lrow {
          display: flex; align-items: center; gap: .45rem; flex-wrap: wrap;
          padding: .32rem .5rem; border-radius: 6px; background: rgba(255,255,255,.02);
        }
        .adc-lrow-t2 { border-left: 2px solid rgba(0,255,136,.6); }
        .adc-lrow-t1 { border-left: 2px solid rgba(74,222,128,.5); }
        .adc-lrow-stop { border-left: 2px solid rgba(255,51,85,.5); }
        .adc-lrow-label { font-size: .5rem; font-weight: 800; color: var(--text-muted); min-width: 46px; text-transform: uppercase; letter-spacing: .05em; }
        .adc-lrow-stop-label { color: #ff3355 !important; }
        .adc-lrow-value { font-size: .74rem; font-weight: 800; color: var(--text-primary); }
        .adc-lrow-stop-value { color: #ff3355 !important; }
        .adc-lrow-meta { font-size: .54rem; color: var(--text-muted); margin-left: auto; }

        .adc-ldivider {
          display: flex; align-items: center; justify-content: space-between;
          border: 1px solid; border-radius: 6px; padding: .34rem .5rem;
          background: rgba(255,255,255,.04);
        }
        .adc-ldivider-label { font-size: .56rem; font-weight: 900; letter-spacing: .04em; }
        .adc-ldivider-value { font-size: .82rem; font-weight: 900; }
      `}</style>
    </div>
  );
};

export default AssetDirectionCard;
