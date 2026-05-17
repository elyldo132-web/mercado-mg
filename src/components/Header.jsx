import React from 'react';

const Header = ({ isMuted, toggleMute, correlation, marketRegime, onLogout, balance, view, setView }) => {
  return (
    <header className="app-header glass">
      <div className="header-container">
        <div className="logo-section">
          <span className="logo-sparkle">🚨</span>
          <h1 className="app-title">MERCADO <span className="text-blue">MG</span></h1>
        </div>

        <nav className="main-navigation">
          <button 
            className={`nav-tab ${view === 'market' ? 'active' : ''}`} 
            onClick={() => setView('market')}
          >
            <span className="tab-icon">🌍</span>
            Macro Análise
            {view === 'market' && <div className="active-indicator"></div>}
          </button>
          <button 
            className={`nav-tab ${view === 'simulator' ? 'active' : ''}`} 
            onClick={() => setView('simulator')}
          >
            <span className="tab-icon">📈</span>
            Simulador de Crescimento
            {view === 'simulator' && <div className="active-indicator"></div>}
          </button>
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
          <button 
            className={`audio-toggle ${isMuted ? 'muted' : 'active'}`} 
            onClick={toggleMute}
            title={isMuted ? "Ativar Alertas Sonoros" : "Mutar Alertas"}
            style={{ marginRight: '1rem' }}
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
          background: rgba(10, 12, 16, 0.85);
          backdrop-filter: blur(12px);
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
          padding: 0 2rem;
          height: 64px;
        }
        .logo-section {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex: 1;
        }
        .app-title {
          font-size: 1.15rem;
          font-weight: 700;
          letter-spacing: -0.5px;
          text-transform: uppercase;
          margin: 0;
        }
        
        .main-navigation {
          display: flex;
          height: 100%;
          gap: 2rem;
          flex: 2;
          justify-content: center;
        }
        
        .nav-tab {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 0.95rem;
          font-weight: 600;
          padding: 0 1rem;
          cursor: pointer;
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: color 0.3s ease;
          height: 100%;
        }
        
        .nav-tab:hover {
          color: var(--text-primary);
        }
        
        .nav-tab.active {
          color: white;
        }
        
        .active-indicator {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 3px;
          background: var(--accent-blue);
          border-radius: 3px 3px 0 0;
          box-shadow: 0 -2px 10px rgba(0, 112, 243, 0.5);
          animation: slideUp 0.3s ease forwards;
        }

        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        .market-status {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 0.75rem;
          flex: 1;
          justify-content: flex-end;
          margin-right: 1.5rem;
          flex-wrap: wrap;
        }
        .regime-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 72px;
          padding: 0.25rem 0.6rem;
          border-radius: 999px;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          border: 1px solid rgba(148, 163, 184, 0.2);
          background: rgba(255, 255, 255, 0.04);
        }
        .regime-pill.normal { color: var(--text-primary); }
        .regime-pill.trending { color: var(--accent-green); border-color: rgba(16, 185, 129, 0.25); }
        .regime-pill.anomaly { color: var(--accent-red); border-color: rgba(248, 81, 73, 0.25); }
        .status-item {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        
        .wallet-badge {
          background: rgba(16, 185, 129, 0.1);
          padding: 4px 12px;
          border-radius: 8px;
          border: 1px solid rgba(16, 185, 129, 0.2);
          font-weight: 800;
          display: flex;
          align-items: center;
        }
        
        .actions-section {
          display: flex;
          align-items: center;
        }
        .audio-toggle {
          background: none;
          border: 1px solid var(--border-color);
          padding: 4px 8px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.2s;
        }
        .audio-toggle:hover {
          background: rgba(255,255,255,0.05);
          border-color: var(--text-secondary);
        }
        .audio-toggle.active {
          border-color: var(--accent-blue);
          box-shadow: 0 0 10px rgba(0, 112, 243, 0.2);
        }
        .btn-logout {
          background: rgba(248, 81, 73, 0.1);
          color: var(--accent-red);
          border: 1px solid rgba(248, 81, 73, 0.3);
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }
        .btn-logout:hover {
          background: var(--accent-red);
          color: white;
        }
        @media (max-width: 900px) {
          .main-navigation { gap: 1rem; }
          .nav-tab { font-size: 0.8rem; }
          .market-status { display: none; }
        }
      `}</style>
    </header>
  );
};

export default Header;
