import React from 'react';

const MacroAlert = ({ alert }) => {
  const { summary, impact, strength, timing, tradeReading } = alert;

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
        <h2 className="alert-title">ALERTA MACRO</h2>
      </div>

      <div className="alert-section summary-section">
        <div className="label">📰 Resumo:</div>
        <div className="content">{summary}</div>
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
            <div className="label">🪙 Crypto {alert.sector ? `(${alert.sector})` : ''}:</div>
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
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        .alert-title {
          font-size: 1.2rem;
          font-weight: 800;
          letter-spacing: 1px;
          color: var(--text-primary);
        }
        .emoji-pulse {
          font-size: 1.25rem;
          animation: pulse 1s infinite;
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
          margin-bottom: 0.5rem;
        }
        .content {
          font-size: 0.95rem;
          line-height: 1.5;
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
        .reading-section {
          background: rgba(22, 27, 34, 0.5);
          padding: 1rem;
          border-radius: 6px;
        }
        .active-instruction {
          border: 1px solid var(--accent-blue);
          background: rgba(0, 112, 243, 0.1);
          box-shadow: 0 0 15px rgba(0, 112, 243, 0.1);
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
        .bg-surface {
          background-color: var(--bg-secondary);
        }
      `}</style>
    </div>
  );
};

export default MacroAlert;
