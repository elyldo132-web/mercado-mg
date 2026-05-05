import React from 'react';

const NewsInput = ({ news, setNews, onAnalyze }) => {
  return (
    <div className="card glass news-card">
      <div className="card-header">
        <h2 className="card-title">Nova Análise</h2>
        <span className="card-subtitle">Cole a notícia ou o fato macroeconômico abaixo</span>
      </div>
      <div className="input-container">
        <textarea
          className="news-area font-mono"
          placeholder="Ex: Fed sinaliza manutenção de juros altos por mais tempo..."
          value={news}
          onChange={(e) => setNews(e.target.value)}
        />
        <button className="btn btn-primary" onClick={onAnalyze}>
          FILTRAR IMPACTO ⚡
        </button>
      </div>
      <style jsx="true">{`
        .news-card {
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 0rem;
        }
        .card-header {
          margin-bottom: 1.25rem;
        }
        .card-title {
          font-size: 1.1rem;
          margin-bottom: 0.25rem;
          font-weight: 600;
        }
        .card-subtitle {
          color: var(--text-muted);
          font-size: 0.85rem;
        }
        .input-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .news-area {
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          padding: 1rem;
          color: var(--text-primary);
          min-height: 120px;
          resize: vertical;
          font-size: 0.9rem;
          line-height: 1.6;
          transition: border-color 0.2s;
        }
        .news-area:focus {
          outline: none;
          border-color: var(--accent-blue);
        }
        .btn {
          cursor: pointer;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 0.8rem 1.5rem;
          border-radius: 6px;
          border: none;
          transition: 0.2s;
          font-size: 0.85rem;
        }
        .btn-primary {
          background: var(--accent-blue);
          color: var(--bg-primary);
        }
        .btn-primary:hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
};

export default NewsInput;
