import React, { useMemo } from 'react';

const TradingPanel = ({ balance, positions, activeTicker, activePrice, onTrade, suggestion }) => {
  const currentPosition = positions.find(p => p.ticker === activeTicker);
  const tradeLog = useMemo(() => {
    return positions
      .slice(-5)
      .reverse()
      .map(pos => ({
        id: `${pos.ticker}-${pos.timestamp}`,
        msg: `ORDEM EXECUTADA: ${pos.type === 'BUY' ? 'COMPRA' : 'VENDA'} ${pos.ticker} @ ${pos.entryPrice.toFixed(2)}`,
        type: 'exec'
      }));
  }, [positions]);

  return (
    <div className="trading-panel glass animate-fade-in">
      <div className="panel-header">
        <h4 className="title">Terminal de Operação</h4>
        <div className="balance-info font-mono">
          <span className="label">Saldo:</span>
          <span className="value">${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      <div className="terminal-grid">
        <div className="controls-section">
          {!activeTicker ? (
            <div className="empty-state">
              <p>Selecione um ativo para operar</p>
            </div>
          ) : (
            <div className="trade-controls">
              <div className="active-info">
                <span className="ticker-badge">${activeTicker}</span>
                <span className="price font-mono">${activePrice?.toFixed(2)}</span>
              </div>

              {suggestion && (
                <div className={`suggestion-badge ${suggestion.includes('COMPRA') ? 'suggest-buy' : suggestion.includes('VENDA') ? 'suggest-sell' : ''}`}>
                  SUGESTÃO: {suggestion}
                </div>
              )}

              <div className="button-group">
                <button 
                  className="trade-btn buy" 
                  onClick={() => onTrade('BUY')}
                  disabled={!!currentPosition}
                >
                  COMPRAR
                </button>
                <button 
                  className="trade-btn sell" 
                  onClick={() => onTrade('SELL')}
                  disabled={!!currentPosition}
                >
                  VENDER
                </button>
              </div>

              {currentPosition && (
                <div className="current-position-highlight">
                  <div className="pos-header">
                    <span className="pos-type">{currentPosition.type === 'BUY' ? 'COMPRA' : 'VENDA'} ATIVA</span>
                    <span className="pos-entry">Início: ${currentPosition.entryPrice.toFixed(2)}</span>
                  </div>
                  <div className={`pos-pl font-mono ${currentPosition.pl >= 0 ? 'text-green' : 'text-red'}`}>
                    {currentPosition.pl >= 0 ? '+' : ''}{currentPosition.pl.toFixed(2)}%
                  </div>
                  <button className="close-btn" onClick={() => onTrade('CLOSE')}>
                    ENCERRAR POSIÇÃO
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="positions-list-section">
          <h5 className="section-title">Posições Abertas ({positions.length})</h5>
          <div className="positions-scroll">
            {positions.length === 0 ? (
              <div className="no-positions">Nenhuma posição aberta</div>
            ) : (
              positions.map((pos, idx) => (
                <div key={idx} className={`pos-item ${pos.ticker === activeTicker ? 'active' : ''}`}>
                  <span className="pos-ticker">{pos.ticker}</span>
                  <span className={`pos-side ${pos.type === 'BUY' ? 'up' : 'down'}`}>{pos.type}</span>
                  <span className={`pos-pl-small font-mono ${pos.pl >= 0 ? 'text-green' : 'text-red'}`}>
                    {pos.pl >= 0 ? '+' : ''}{pos.pl.toFixed(1)}%
                  </span>
                </div>
              ))
            )}
          </div>
          
          <div className="mini-log font-mono">
            {tradeLog.map(log => (
              <div key={log.id} className="log-entry">{`> ${log.msg}`}</div>
            ))}
          </div>
        </div>
      </div>

      <style jsx="true">{`
        .trading-panel {
          padding: 1rem;
          margin-top: 1rem;
          background: linear-gradient(135deg, rgba(0, 245, 212, 0.05) 0%, rgba(0, 0, 0, 0.6) 100%);
          border: 1px solid rgba(0, 245, 212, 0.2);
          border-radius: 8px;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 0.5rem;
        }

        .terminal-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .title {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--accent-blue);
          margin: 0;
        }

        .balance-info { font-size: 0.75rem; }
        .balance-info .label { color: var(--text-muted); margin-right: 0.5rem; }
        .balance-info .value { color: var(--accent-green); font-weight: 700; }

        .empty-state {
          padding: 2rem 1rem;
          text-align: center;
          color: var(--text-muted);
          font-size: 0.7rem;
          border: 1px dashed rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }

        .active-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .ticker-badge {
          background: rgba(168, 85, 247, 0.2);
          color: #a855f7;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 800;
          font-size: 0.8rem;
        }

        .price { font-size: 1.1rem; font-weight: 700; }

        .suggestion-badge {
          font-size: 0.6rem;
          font-weight: 800;
          padding: 4px 8px;
          border-radius: 4px;
          margin-bottom: 0.75rem;
          text-align: center;
          border: 1px solid transparent;
        }

        .suggest-buy {
          background: rgba(16, 185, 129, 0.1);
          color: var(--accent-green);
          border-color: rgba(16, 185, 129, 0.3);
          animation: suggest-pulse-green 2s infinite;
        }

        .suggest-sell {
          background: rgba(239, 68, 68, 0.1);
          color: var(--accent-red);
          border-color: rgba(239, 68, 68, 0.3);
          animation: suggest-pulse-red 2s infinite;
        }

        .button-group {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .trade-btn {
          padding: 0.6rem;
          border: none;
          border-radius: 4px;
          font-weight: 800;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .trade-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .buy { background: var(--accent-green); color: black; }
        .sell { background: var(--accent-red); color: white; }

        .current-position-highlight {
          background: rgba(255, 255, 255, 0.05);
          padding: 0.75rem;
          border-radius: 6px;
          border-left: 3px solid var(--accent-blue);
        }

        .pos-header {
          display: flex;
          justify-content: space-between;
          font-size: 0.6rem;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .pos-pl { font-size: 1.5rem; font-weight: 800; text-align: center; margin: 0.25rem 0; }

        .close-btn {
          width: 100%;
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          border-radius: 4px;
          font-size: 0.6rem;
          font-weight: 700;
          cursor: pointer;
          margin-top: 0.5rem;
        }

        .section-title {
          font-size: 0.6rem;
          color: var(--text-muted);
          text-transform: uppercase;
          margin-bottom: 0.5rem;
        }

        .positions-scroll {
          height: 100px;
          overflow-y: auto;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
          padding: 0.5rem;
          margin-bottom: 1rem;
        }

        .pos-item {
          display: flex;
          justify-content: space-between;
          padding: 0.25rem 0.5rem;
          font-size: 0.65rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .pos-item.active { background: rgba(0, 245, 212, 0.1); }
        .pos-ticker { font-weight: 700; width: 50px; }
        .pos-side { font-weight: 800; font-size: 0.6rem; }
        .up { color: var(--accent-green); }
        .down { color: var(--accent-red); }

        .no-positions {
          font-size: 0.65rem;
          color: var(--text-muted);
          text-align: center;
          padding-top: 1.5rem;
        }

        .mini-log {
          font-size: 0.55rem;
          color: #00f5d4;
          opacity: 0.7;
          height: 60px;
          overflow: hidden;
          background: rgba(0, 0, 0, 0.3);
          padding: 0.4rem;
          border-radius: 4px;
          line-height: 1.4;
        }

        .log-entry { margin-bottom: 2px; }

        @media (max-width: 600px) {
          .terminal-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default TradingPanel;
