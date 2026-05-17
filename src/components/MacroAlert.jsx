import React from 'react';

const MacroAlert = ({ alert }) => {
  const { summary, impact, strength, timing, tradeReading, marketDirection, confidence, drivers = [], sector, tradeAction } = alert;

  const getImpactColor = (val) => {
    if (val === 'Alta') return 'text-green';
    if (val === 'Queda') return 'text-red';
    return 'text-muted';
  };

  const getStrengthColor = (val) => {
    if (val === 'Forte') return 'text-red bg-red-glow font-bold';
    if (val === 'Médio') return 'text-gold';
    return 'text-muted';
  };

  return (
    <div className="alert-display animate-fade-in glass">
      <div className="alert-header">
        <span className="emoji-pulse">🚨</span>
        <div>
          <h2 className="alert-title">ALERTA MACRO</h2>
          <div className="alert-pill">{sector || 'Macro'}</div>
        </div>
      </div>

      <div className="alert-section summary-section">
        <div className="label">📰 Resumo:</div>
        <div className="content">{summary}</div>
      </div>

      <div className="alert-section direction-summary">
        <div className="label">📈 Direção do Mercado:</div>
        <div className={`value ${marketDirection === 'Alta' ? 'text-green' : marketDirection === 'Queda' ? 'text-red' : 'text-muted'}`}>
          {marketDirection} · {confidence}%
        </div>
        <div className="direction-subtext">{drivers.join(' · ') || 'Baseado em macro e fluxo'}</div>
      </div>

      <div className="alert-section grid-impact">
        <div className="impact-box">
          <div className="label">📊 Dólar:</div>
          <div className={`value ${getImpactColor(impact.dollar)}`}>
            {impact.dollar === 'Alta' ? '📈 ' : impact.dollar === 'Queda' ? '📉 ' : ''}
            {impact.dollar}
          </div>
        </div>
        <div className="impact-box border-l">
          <div className="label">📉 WIN:</div>
          <div className={`value ${getImpactColor(impact.win)}`}>
            {impact.win === 'Alta' ? '📈 ' : impact.win === 'Queda' ? '📉 ' : ''}
            {impact.win}
          </div>
        </div>
        {impact.crypto !== 'Neutro' && (
          <div className="impact-box full-width">
            <div className="label">🪙 Cripto ({sector || 'Crypto'}):</div>
            <div className={`value ${getImpactColor(impact.crypto)}`}>
              {impact.crypto === 'Alta' ? '🚀 ' : impact.crypto === 'Queda' ? '🧨 ' : ''}
              {impact.crypto}
            </div>
          </div>
        )}
      </div>

      <div className="alert-section flex-details">
        <div className="detail-item">
          <div className="label">🔥 Força:</div>
          <div className={`value ${getStrengthColor(strength)}`}>{strength}</div>
        </div>
        <div className="detail-item border-l">
          <div className="label">⏱️ Timing:</div>
          <div className="value">{timing}</div>
        </div>
      </div>

      <div className="alert-section trade-action">
        <div className="label">🧭 Ação Recomendada:</div>
        <div className={`trade-pill ${tradeAction === 'Compra' ? 'buy' : tradeAction === 'Venda' ? 'sell' : 'neutral'}`}>
          {tradeAction}
        </div>
      </div>

      <div className="alert-section reading-section active-instruction">
        <div className="label">🎯 Instrução de Operação:</div>
        <div className="instruction-content font-mono">{tradeReading}</div>
      </div>

      <style jsx="true">{`
        .alert-display {
          margin-top: 1.5rem;
          padding: 1.5rem;
          border-radius: 8px;
          border-left: 4px solid var(--accent-blue);
        }
        .alert-header {
          display: flex;
          align-items: flex-start;
          gap: 0.85rem;
          margin-bottom: 1rem;
        }
        .alert-title {
          font-size: 1.2rem;
          font-weight: 800;
          letter-spacing: 1px;
          color: var(--text-primary);
          margin: 0;
        }
        .alert-pill {
          margin-top: 0.4rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.35rem 0.75rem;
          border-radius: 999px;
          background: rgba(56, 189, 248, 0.12);
          color: var(--text-primary);
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .emoji-pulse {
          font-size: 1.35rem;
          animation: pulse 1s infinite;
          line-height: 1;
        }
        .alert-section {
          margin-bottom: 1rem;
          padding: 0.75rem 0;
          border-bottom: 1px solid var(--border-color);
        }
        .alert-section:last-child {
          margin-bottom: 0;
          border-bottom: none;
        }
        .label {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: uppercase;
          font-weight: 600;
          margin-bottom: 0.45rem;
        }
        .content {
          font-size: 0.95rem;
          line-height: 1.6;
        }
        .direction-summary {
          padding: 0.75rem 0;
        }
        .direction-subtext {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-top: 0.35rem;
          line-height: 1.4;
        }
        .grid-impact, .flex-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .full-width {
          grid-column: span 2;
          border-top: 1px solid var(--border-color);
          padding-top: 1rem;
          margin-top: 0.5rem;
        }
        .impact-box, .detail-item {
          padding: 0.5rem;
        }
        .border-l {
          border-left: 1px solid var(--border-color);
          padding-left: 1.5rem;
        }
        .value {
          font-size: 1.1rem;
          font-weight: 700;
        }
        .trade-action {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .trade-pill {
          display: inline-flex;
          padding: 0.55rem 0.9rem;
          border-radius: 999px;
          font-weight: 800;
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }
        .trade-pill.buy { background: rgba(16, 185, 129, 0.15); color: var(--accent-green); }
        .trade-pill.sell { background: rgba(248, 81, 73, 0.15); color: var(--accent-red); }
        .trade-pill.neutral { background: rgba(148, 163, 184, 0.15); color: var(--text-muted); }
        .reading-section {
          background: rgba(22, 27, 34, 0.55);
          padding: 1rem;
          border-radius: 6px;
        }
        .active-instruction {
          border: 1px solid rgba(56, 189, 248, 0.32);
          background: rgba(0, 112, 243, 0.1);
          box-shadow: 0 0 15px rgba(0, 112, 243, 0.08);
          animation: glow 2s infinite;
        }
        .instruction-content {
          font-size: 1rem;
          font-weight: 800;
          color: white;
          letter-spacing: -0.2px;
        }
        @keyframes glow {
          50% { border-color: rgba(0, 112, 243, 0.6); }
        }
      `}</style>
    </div>
  );
};

export default MacroAlert;
