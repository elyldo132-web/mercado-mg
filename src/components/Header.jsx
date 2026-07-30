import React from 'react';

const Header = ({ isMuted, toggleMute, correlation, marketRegime, onLogout, balance, view, setView }) => {
  const navTabs = [
    { id: 'market',        label: 'Macro Análise',  icon: '🌍', color: '#58a6ff' },
    { id: 'opportunities', label: 'Oportunidades',  icon: '⚡', color: '#a855f7' },
    { id: 'simulator',     label: 'Simulador',       icon: '📈', color: '#10b981' },
    { id: 'report',        label: 'Relatório',       icon: '📋', color: '#f97316' },
    { id: 'config',        label: 'Corretoras',      icon: '⚙️', color: '#fbbf24' },
  ];

  return (
    <header className="app-header glass">
      <div className="header-container">
        <div className="logo-section">
          <span className="logo-sparkle">🚨</span>
          <h1 className="app-title">MERCADO <span className="text-blue">MG</span></h1>
        </div>

        <nav className="main-navigation">
          {navTabs.map(tab => (
            <button
              key={tab.id}
              className={`nav-tab ${view === tab.id ? 'active' : ''}`}
              style={{ '--tab-color': tab.color }}
              onClick={() => setView(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              {tab.label}
              {view === tab.id && <div className="active-indicator" style={{ background: tab.color, boxShadow: `0 -2px 10px ${tab.color}88` }}></div>}
            </button>
          ))}
        </nav>

        <div className="market-status font-mono">
          <div className="status-item wallet-badge">
            <span className="text-muted" style={{fontSize: '0.65rem', marginRight: '4px'}}>SALDO:</span>
            <span className="text-green">${balance?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="status-item regime-pill-wrapper">
            <span className="text-muted" style={{fontSize: '0.65rem', marginRight: '4px'}}>REGIME:</span>
            <span className={`regime-pill ${marketRegime === 'TRENDING' ? 'trending' : marketRegime === 'CORR_ANOMALY' ? 'anomaly' : 'normal'}`}>
              {marketRegime}
            </span>
          </div>
          <div className="status-item">
            <span className="text-muted" style={{fontSize: '0.65rem', marginRight: '4px'}}>CORR:</span>
            <span className={correlation >= 0 ? 'text-green' : 'text-red'}>{correlation?.toFixed(2)}</span>
          </div>
        </div>

        <div className="actions-section">
          <div className="hotkey-note">Atalhos: M · O · S · T</div>
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

        .logo-section {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          flex-shrink: 0;
        }

        .app-title {
          font-size: 1.1rem;
          font-weight: 800;
          letter-spacing: -0.5px;
          text-transform: uppercase;
          margin: 0;
          white-space: nowrap;
        }

        .main-navigation {
          display: flex;
          height: 100%;
          gap: 0.25rem;
          flex: 1;
          justify-content: center;
          max-width: 520px;
        }

        .nav-tab {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 0.85rem;
          font-weight: 600;
          padding: 0 0.85rem;
          cursor: pointer;
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          transition: all 0.25s ease;
          height: 100%;
          border-radius: 0;
          white-space: nowrap;
        }

        .nav-tab:hover {
          color: var(--text-primary);
          background: rgba(255,255,255,0.04);
        }

        .nav-tab.active {
          color: var(--tab-color, white);
          background: color-mix(in srgb, var(--tab-color, #ffffff) 8%, transparent);
        }

        .active-indicator {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 2px;
          border-radius: 2px 2px 0 0;
          animation: slideUp 0.25s ease forwards;
        }

        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .tab-icon { font-size: 1rem; }

        .market-status {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.75rem;
          flex-shrink: 0;
          flex-wrap: nowrap;
        }

        .regime-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 72px;
          padding: 0.2rem 0.55rem;
          border-radius: 999px;
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          border: 1px solid rgba(148, 163, 184, 0.2);
          background: rgba(255, 255, 255, 0.04);
        }

        .regime-pill.normal  { color: var(--text-primary); }
        .regime-pill.trending { color: #00ff88; border-color: rgba(0,255,136,0.3); box-shadow: 0 0 8px rgba(0,255,136,0.2); }
        .regime-pill.anomaly  { color: #ff3355; border-color: rgba(255,51,85,0.3);  box-shadow: 0 0 8px rgba(255,51,85,0.2); }

        .status-item { display: flex; align-items: center; gap: 0.35rem; }

        .wallet-badge {
          background: rgba(0,255,136,0.08);
          padding: 4px 10px;
          border-radius: 8px;
          border: 1px solid rgba(0,255,136,0.2);
          font-weight: 800;
        }

        .actions-section {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          flex-shrink: 0;
        }

        .hotkey-note {
          color: var(--text-muted);
          font-size: 0.65rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          white-space: nowrap;
          opacity: 0.7;
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

        @media (max-width: 1024px) {
          .hotkey-note { display: none; }
          .market-status { gap: 0.5rem; }
        }

        @media (max-width: 768px) {
          .main-navigation { gap: 0; max-width: none; }
          .nav-tab { font-size: 0.75rem; padding: 0 0.6rem; }
          .market-status { display: none; }
          .header-container { padding: 0 1rem; }
        }
      `}</style>
    </header>
  );
};

export default Header;
