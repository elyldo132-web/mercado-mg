import React from 'react';

const History = ({ history }) => {
  return (
    <div className="card glass history-card">
      <div className="card-header">
        <h2 className="card-title">Histórico de Alertas</h2>
        <span className="card-subtitle">Últimos fatos relevantes</span>
      </div>
      <div className="history-list">
        {history.length === 0 ? (
          <div className="empty-state text-muted">Nenhum alerta registrado.</div>
        ) : (
          history.map((alert, index) => (
            <div key={index} className="history-item animate-fade-in">
              <div className="item-header">
                <span className="item-emoji">🚨</span>
                <span className="item-summary">{alert.summary}</span>
              </div>
              <div className="item-indicators font-mono">
                <span className={alert.impact.dollar === 'Alta' ? 'text-green' : 'text-red'}>
                  USD: {alert.impact.dollar === 'Alta' ? '▲' : '▼'}
                </span>
                <span className={alert.impact.win === 'Alta' ? 'text-green' : 'text-red'}>
                  WIN: {alert.impact.win === 'Alta' ? '▲' : '▼'}
                </span>
                <span className="text-muted">| {alert.strength}</span>
              </div>
            </div>
          ))
        )}
      </div>
      <style jsx="true">{`
        .history-card {
          border-radius: 8px;
          padding: 1.5rem;
          min-height: 485px;
          display: flex;
          flex-direction: column;
        }
        .card-header {
          margin-bottom: 1.25rem;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 0.75rem;
        }
        .card-title {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 0.15rem;
          text-transform: uppercase;
        }
        .card-subtitle {
          color: var(--text-muted);
          font-size: 0.75rem;
        }
        .history-list {
          flex: 1;
          overflow-y: auto;
          margin-top: 0.5rem;
        }
        .empty-state {
          text-align: center;
          margin-top: 2rem;
          font-size: 0.9rem;
        }
        .history-item {
          padding: 0.75rem;
          border-bottom: 1px solid var(--border-color);
          transition: background 0.2s;
        }
        .history-item:hover {
          background: rgba(255, 255, 255, 0.03);
        }
        .item-header {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.35rem;
        }
        .item-emoji { font-size: 0.9rem; }
        .item-summary { font-size: 0.85rem; font-weight: 500; color: var(--text-primary); }
        .item-indicators {
          display: flex;
          gap: 1rem;
          font-size: 0.7rem;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
};

export default History;
