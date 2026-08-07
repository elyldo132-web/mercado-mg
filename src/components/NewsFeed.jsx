import React from 'react';

const NewsFeed = ({ items }) => {
  return (
    <div className="card glass news-feed-card">
      <div className="card-header">
        <h2 className="card-title">Notícias</h2>
        <span className="card-subtitle">Feed ao vivo — todas as manchetes capturadas</span>
      </div>
      <div className="news-feed-list">
        {items.length === 0 ? (
          <div className="empty-state text-muted">Aguardando notícias...</div>
        ) : (
          items.map((n, i) => (
            <div key={i} className="news-feed-item animate-fade-in">
              <div className="nf-text">{n.text}</div>
              <div className="nf-meta">
                <span className="nf-source">{n.source}</span>
                {n.time && <span className="nf-time font-mono">{n.time}</span>}
              </div>
            </div>
          ))
        )}
      </div>

      <style jsx="true">{`
        .news-feed-card {
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
        .news-feed-list {
          flex: 1;
          overflow-y: auto;
          margin-top: 0.5rem;
          display: flex;
          flex-direction: column;
        }
        .empty-state {
          text-align: center;
          margin-top: 2rem;
          font-size: 0.9rem;
        }
        .news-feed-item {
          padding: 0.75rem;
          border-bottom: 1px solid var(--border-color);
          transition: background 0.2s;
        }
        .news-feed-item:hover {
          background: rgba(255, 255, 255, 0.03);
        }
        .nf-text {
          font-size: 0.82rem;
          font-weight: 500;
          color: var(--text-primary);
          line-height: 1.45;
        }
        .nf-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          margin-top: 0.4rem;
        }
        .nf-source {
          font-size: 0.62rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .nf-time {
          font-size: 0.62rem;
          color: var(--text-muted);
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
};

export default NewsFeed;
