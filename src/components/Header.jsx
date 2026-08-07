import React from 'react';
import TopTicker from './TopTicker';

const Header = ({ isMuted, toggleMute, onLogout, onMenuClick }) => {
  return (
    <header className="app-header glass">
      <div className="header-container">
        <button className="menu-toggle" onClick={onMenuClick} aria-label="Abrir menu" title="Menu">
          ☰
        </button>

        <TopTicker />

        <div className="actions-section">
          <button
            className={`audio-toggle ${isMuted ? 'muted' : 'active'}`}
            onClick={toggleMute}
            title={isMuted ? "Ativar Alertas Sonoros" : "Mutar Alertas"}
            aria-pressed={!isMuted}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
          <button className="btn-logout" onClick={onLogout} title="Sair do Terminal">
            <span>SAIR</span>
            <span style={{ fontSize: '0.8rem' }}>📤</span>
          </button>
        </div>
      </div>

      <style jsx="true">{`
        .app-header {
          padding: 0;
          border-bottom: 1px solid var(--border-color);
          background: rgba(8, 10, 15, 0.92);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .header-container {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 1.5rem;
          height: 64px;
          gap: 1rem;
        }

        .menu-toggle {
          display: none;
          background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1);
          color: var(--text-primary); font-size: 1.1rem; line-height: 1;
          padding: 6px 10px; border-radius: 8px; cursor: pointer; flex-shrink: 0;
        }

        .actions-section {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          flex-shrink: 0;
        }

        .audio-toggle {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          padding: 5px 8px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.2s;
          line-height: 1;
        }

        .audio-toggle:hover {
          background: rgba(255,255,255,0.08);
          border-color: var(--text-secondary);
        }

        .audio-toggle.active {
          border-color: rgba(88,166,255,0.5);
          background: rgba(88,166,255,0.08);
          box-shadow: 0 0 12px rgba(88,166,255,0.2);
        }

        .btn-logout {
          background: rgba(255,51,85,0.08);
          color: #ff3355;
          border: 1px solid rgba(255,51,85,0.3);
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 0.65rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .btn-logout:hover {
          background: #ff3355;
          color: white;
          box-shadow: 0 0 15px rgba(255,51,85,0.35);
          transform: translateY(-1px);
        }

        @media (max-width: 900px) {
          .menu-toggle { display: flex; align-items: center; justify-content: center; }
        }

        @media (max-width: 768px) {
          .header-container { padding: 0 1rem; }
        }
      `}</style>
    </header>
  );
};

export default Header;
