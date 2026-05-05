import React from 'react';

const FlowRadar = ({ lastAlert, correlation }) => {
  const sectors = [
    { id: 'Macro', label: 'MACRO', color: 'var(--accent-blue)' },
    { id: 'Crypto', label: 'CRYPTO', color: '#a855f7' },
    { id: 'AI', label: 'TECH/AI', color: '#00f5d4' }
  ];

  const getMomentum = (sectorId) => {
    if (!lastAlert || lastAlert === 'IGNORAR') return 20;
    if (lastAlert.sector === sectorId) return 90;
    if (sectorId === 'Macro' && Math.abs(correlation) > 0.9) return 70;
    return 30;
  };

  return (
    <div className="flow-radar glass animate-fade-in">
      <div className="radar-header">
        <h4 className="title">Radar de Fluxo & Momentum</h4>
        <div className="leader-badge">
          LEADER: <span className="text-blue">{lastAlert?.sector || 'LATERAL'}</span>
        </div>
      </div>

      <div className="radar-body">
        {sectors.map((s) => {
          const momentum = getMomentum(s.id);
          return (
            <div key={s.id} className="radar-row">
              <div className="sector-info">
                <span className="label">{s.label}</span>
                <span className="val font-mono">{momentum}%</span>
              </div>
              <div className="momentum-bar-bg">
                <div 
                  className="momentum-bar-fill" 
                  style={{ 
                    width: `${momentum}%`, 
                    backgroundColor: s.color,
                    boxShadow: `0 0 10px ${s.color}`
                  }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="radar-footer font-mono">
        <span className="status-blink"></span> MONITORANDO RASTRO DE SENTIMENTO...
      </div>

      <style jsx="true">{`
        .flow-radar {
          padding: 1rem;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, rgba(0, 112, 243, 0.05) 0%, rgba(0, 0, 0, 0.4) 100%);
          border: 1px solid rgba(0, 112, 243, 0.2);
          border-radius: 8px;
        }

        .radar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .title {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--text-muted);
          margin: 0;
        }

        .leader-badge {
          font-size: 0.6rem;
          font-weight: 800;
          color: var(--text-secondary);
        }

        .radar-body {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .radar-row {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }

        .sector-info {
          display: flex;
          justify-content: space-between;
          font-size: 0.65rem;
          font-weight: 700;
        }

        .momentum-bar-bg {
          height: 6px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
          overflow: hidden;
        }

        .momentum-bar-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .radar-footer {
          margin-top: 1rem;
          font-size: 0.55rem;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .status-blink {
          width: 5px;
          height: 5px;
          background: var(--accent-blue);
          border-radius: 50%;
          animation: blink 1s infinite;
        }

        @keyframes blink {
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default FlowRadar;
