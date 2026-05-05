import React from 'react';

const SentimentHeatmap = ({ lastAlert }) => {
  const sectors = [
    { id: 'Macro', label: 'Macro / Juros', icon: '🏦' },
    { id: 'AI', label: 'AI Narrative', icon: '🤖' },
    { id: 'RWA', label: 'RWA / Banking', icon: '🧱' },
    { id: 'Crypto', label: 'Crypto Beta', icon: '🪙' },
    { id: 'Commodities', label: 'Commodities', icon: '🛢️' },
    { id: 'MEME', label: 'Speculation', icon: '🤡' }
  ];

  const getHeatColor = (sectorId) => {
    if (!lastAlert || lastAlert === 'IGNORAR') return 'rgba(255, 255, 255, 0.05)';
    
    if (lastAlert.sector === sectorId) {
      if (lastAlert.impact.win === 'Alta' || lastAlert.impact.crypto === 'Alta') return 'rgba(16, 185, 129, 0.2)';
      if (lastAlert.impact.win === 'Queda' || lastAlert.impact.crypto === 'Queda') return 'rgba(239, 68, 68, 0.2)';
    }
    return 'rgba(255, 255, 255, 0.05)';
  };

  const getBorderColor = (sectorId) => {
    if (lastAlert?.sector === sectorId) {
       if (lastAlert.impact.win === 'Alta' || lastAlert.impact.crypto === 'Alta') return 'var(--accent-green)';
       if (lastAlert.impact.win === 'Queda' || lastAlert.impact.crypto === 'Queda') return 'var(--accent-red)';
    }
    return 'rgba(255, 255, 255, 0.1)';
  };

  return (
    <div className="sentiment-heatmap glass animate-fade-in">
      <div className="heatmap-header">
        <h4 className="title">Mapa de Calor do Sentimento</h4>
        <span className="live-tag">LIVE ALPHA</span>
      </div>
      <div className="heatmap-grid">
        {sectors.map((sector) => (
          <div 
            key={sector.id} 
            className="sector-cell"
            style={{ 
              backgroundColor: getHeatColor(sector.id),
              borderColor: getBorderColor(sector.id)
            }}
          >
            <span className="sector-icon">{sector.icon}</span>
            <span className="sector-label">{sector.label}</span>
            {lastAlert?.sector === sector.id && (
              <div className="active-glow"></div>
            )}
          </div>
        ))}
      </div>

      <style jsx="true">{`
        .sentiment-heatmap {
          padding: 1rem;
          margin-bottom: 1rem;
          border-radius: 8px;
          background: var(--bg-secondary);
        }

        .heatmap-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .title {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--text-muted);
          font-weight: 700;
          margin: 0;
        }

        .live-tag {
          font-size: 0.55rem;
          background: var(--accent-blue);
          color: white;
          padding: 1px 4px;
          border-radius: 2px;
          font-weight: 800;
        }

        .heatmap-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.5rem;
        }

        .sector-cell {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 0.75rem 0.25rem;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.5s ease;
          overflow: hidden;
        }

        .sector-icon {
          font-size: 1.2rem;
          margin-bottom: 0.25rem;
        }

        .sector-label {
          font-size: 0.6rem;
          font-weight: 600;
          text-align: center;
          color: var(--text-secondary);
        }

        .active-glow {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          box-shadow: inset 0 0 15px rgba(255, 255, 255, 0.1);
          animation: pulse-glow 2s infinite;
        }

        @keyframes pulse-glow {
          0% { opacity: 0.3; }
          50% { opacity: 0.7; }
          100% { opacity: 0.3; }
        }

        @media (max-width: 400px) {
          .heatmap-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </div>
  );
};

export default SentimentHeatmap;
