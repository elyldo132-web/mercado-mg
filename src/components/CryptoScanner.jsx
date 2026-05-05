import React from 'react';

const CryptoScanner = ({ lastAlert }) => {
  const gems = [
    { ticker: 'FET', name: 'Fetch.ai', sector: 'AI', price: 2.45, change: '+12.4%', risk: 'Alto' },
    { ticker: 'RNDR', name: 'Render', sector: 'AI', price: 10.12, change: '+5.2%', risk: 'Médio' },
    { ticker: 'ONDO', name: 'Ondo Finance', sector: 'RWA', price: 0.78, change: '+8.1%', risk: 'Médio' },
    { ticker: 'PEPE', name: 'Pepe', sector: 'MEME', price: 0.0000084, change: '+24.5%', risk: 'Extremo' },
    { ticker: 'SOL', name: 'Solana', sector: 'L1', price: 174.20, change: '+3.2%', risk: 'Baixo' },
  ];

  const getSentimentColor = (gem) => {
    if (!lastAlert || lastAlert === 'IGNORAR') return 'var(--text-muted)';
    if (lastAlert.sector === gem.sector && lastAlert.impact.crypto === 'Alta') return 'var(--accent-green)';
    if (lastAlert.impact.crypto === 'Alta' && gem.ticker === 'SOL') return 'var(--accent-green)';
    return 'var(--text-muted)';
  };

  return (
    <div className="crypto-scanner glass animate-fade-in">
      <div className="scanner-header">
        <div className="title-group">
          <span className="icon">💎</span>
          <h4 className="title">Crypto Alpha Scanner</h4>
        </div>
        <div className="status-indicator">
          <span className="pulse"></span> LIVE ALPHA
        </div>
      </div>

      <div className="gems-grid">
        {gems.map((gem) => (
          <div key={gem.ticker} className="gem-card">
            <div className="gem-main">
              <span className="gem-ticker" style={{ color: getSentimentColor(gem) }}>${gem.ticker}</span>
              <span className="gem-sector badge">{gem.sector}</span>
            </div>
            <div className="gem-details font-mono">
              <div className="gem-price">${gem.price < 0.01 ? gem.price.toFixed(8) : gem.price.toFixed(2)}</div>
              <div className={`gem-change ${gem.change.startsWith('+') ? 'text-green' : 'text-red'}`}>
                {gem.change}
              </div>
            </div>
            <div className="gem-footer">
              <span className={`risk-label risk-${gem.risk.toLowerCase()}`}>Risco: {gem.risk}</span>
              {lastAlert?.sector === gem.sector && (
                <span className="alert-tag">SENTIMENT MATCH</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <style jsx="true">{`
        .crypto-scanner {
          margin-top: 1rem;
          padding: 1rem;
          background: linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(0, 0, 0, 0.4) 100%);
          border: 1px solid rgba(168, 85, 247, 0.3);
          border-radius: 8px;
        }

        .scanner-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .title-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .title {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: #a855f7;
          margin: 0;
          font-weight: 800;
        }

        .status-indicator {
          font-size: 0.6rem;
          font-weight: 700;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .pulse {
          width: 6px;
          height: 6px;
          background: #a855f7;
          border-radius: 50%;
          box-shadow: 0 0 10px #a855f7;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(168, 85, 247, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(168, 85, 247, 0); }
        }

        .gems-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 0.75rem;
        }

        .gem-card {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 0.75rem;
          border-radius: 6px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .gem-card:hover {
          border-color: rgba(168, 85, 247, 0.5);
          transform: translateY(-2px);
          background: rgba(168, 85, 247, 0.05);
        }

        .gem-main {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .gem-ticker {
          font-weight: 800;
          font-size: 0.9rem;
          letter-spacing: -0.5px;
        }

        .badge {
          font-size: 0.55rem;
          padding: 1px 4px;
          border-radius: 3px;
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-muted);
        }

        .gem-details {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 0.5rem;
        }

        .gem-price {
          font-size: 0.8rem;
          font-weight: 600;
        }

        .gem-change {
          font-size: 0.65rem;
          font-weight: 700;
        }

        .gem-footer {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .risk-label {
          font-size: 0.55rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .risk-extremo { color: #ff0055; }
        .risk-alto { color: #ff8800; }
        .risk-médio { color: #ffcc00; }
        .risk-baixo { color: #00ff88; }

        .alert-tag {
          font-size: 0.5rem;
          background: var(--accent-green);
          color: black;
          padding: 1px 4px;
          border-radius: 2px;
          font-weight: 900;
          text-align: center;
          animation: blink 1s infinite;
        }

        @keyframes blink {
          50% { opacity: 0.5; }
        }

        @media (max-width: 500px) {
          .gems-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </div>
  );
};

export default CryptoScanner;
