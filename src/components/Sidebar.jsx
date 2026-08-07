import React from 'react';

const NAV_GROUPS = [
  {
    label: 'ANÁLISE',
    items: [
      { id: 'resumo',         label: 'Resumo Geral',  icon: '🧭', color: '#00d4ff' },
      { id: 'market',        label: 'Macro Análise', icon: '🌍', color: '#58a6ff' },
      { id: 'charts',        label: 'Gráficos',      icon: '📈', color: '#06b6d4' },
      { id: 'news',          label: 'Notícias',      icon: '📰', color: '#fbbf24' },
      { id: 'opportunities', label: 'Oportunidades', icon: '⚡', color: '#a855f7' },
    ],
  },
  {
    label: 'FERRAMENTAS',
    items: [
      { id: 'simulator', label: 'Simulador', icon: '📈', color: '#10b981' },
      { id: 'report',    label: 'Relatório', icon: '📋', color: '#f97316' },
    ],
  },
  {
    label: 'CONFIGURAÇÕES',
    items: [
      { id: 'config', label: 'Corretoras', icon: '⚙️', color: '#fbbf24' },
    ],
  },
];

const Sidebar = ({ view, setView, mobileOpen, onClose }) => {
  const handleSelect = (id) => {
    setView(id);
    onClose?.();
  };

  return (
    <>
      {mobileOpen && <div className="sidebar-scrim" onClick={onClose}></div>}

      <aside className={`app-sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <span className="logo-sparkle">🚨</span>
          <div>
            <div className="sidebar-title">MERCADO <span className="text-blue">MG</span></div>
            <div className="sidebar-subtitle">Terminal Macro</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_GROUPS.map(group => (
            <div key={group.label} className="sidebar-group">
              <div className="sidebar-group-label">{group.label}</div>
              {group.items.map(item => (
                <button
                  key={item.id}
                  className={`sidebar-item ${view === item.id ? 'active' : ''}`}
                  style={{ '--item-color': item.color }}
                  onClick={() => handleSelect(item.id)}
                >
                  <span className="sidebar-item-icon">{item.icon}</span>
                  <span className="sidebar-item-label">{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        <style jsx="true">{`
          .sidebar-scrim {
            display: none;
          }

          .app-sidebar {
            width: 220px; flex-shrink: 0;
            display: flex; flex-direction: column;
            background: rgba(8, 10, 15, 0.96);
            border-right: 1px solid var(--border-color);
            backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
            position: sticky; top: 0; height: 100vh;
            z-index: 100;
          }

          .sidebar-logo {
            display: flex; align-items: center; gap: .6rem;
            padding: 1.1rem 1.2rem; border-bottom: 1px solid var(--border-color);
          }
          .logo-sparkle { font-size: 1.3rem; }
          .sidebar-title {
            font-size: .92rem; font-weight: 800; letter-spacing: -0.4px;
            text-transform: uppercase; white-space: nowrap;
          }
          .sidebar-subtitle {
            font-size: .58rem; color: var(--text-muted);
            text-transform: uppercase; letter-spacing: .06em; margin-top: 1px;
          }

          .sidebar-nav {
            flex: 1; overflow-y: auto;
            padding: 1rem .8rem; display: flex; flex-direction: column; gap: 1.1rem;
          }
          .sidebar-group { display: flex; flex-direction: column; gap: .2rem; }
          .sidebar-group-label {
            font-size: .58rem; font-weight: 800; color: var(--text-muted);
            text-transform: uppercase; letter-spacing: .08em;
            padding: 0 .6rem; margin-bottom: .3rem;
          }
          .sidebar-item {
            display: flex; align-items: center; gap: .65rem;
            background: transparent; border: none; border-radius: 8px;
            padding: .55rem .6rem; cursor: pointer; text-align: left;
            color: var(--text-muted); font-size: .8rem; font-weight: 600;
            transition: all .15s; border-left: 2px solid transparent;
          }
          .sidebar-item:hover { background: rgba(255,255,255,.04); color: var(--text-primary); }
          .sidebar-item.active {
            color: var(--item-color, white);
            background: color-mix(in srgb, var(--item-color, #ffffff) 10%, transparent);
            border-left-color: var(--item-color, white);
          }
          .sidebar-item-icon { font-size: 1rem; flex-shrink: 0; }
          .sidebar-item-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

          @media (max-width: 900px) {
            .app-sidebar {
              position: fixed; left: 0; top: 0;
              transform: translateX(-100%);
              transition: transform .25s ease;
              box-shadow: 8px 0 24px rgba(0,0,0,.4);
            }
            .app-sidebar.open { transform: translateX(0); }
            .sidebar-scrim {
              display: block; position: fixed; inset: 0;
              background: rgba(0,0,0,.5); z-index: 99;
            }
          }
        `}</style>
      </aside>
    </>
  );
};

export default Sidebar;
