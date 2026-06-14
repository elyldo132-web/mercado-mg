import React, { useState, useEffect, useRef } from 'react';
import { analyzeNews } from '../utils/MacroRules';

const NewsInput = ({ news, setNews, onAnalyze }) => {
  const [analysis, setAnalysis] = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    // Debounce analysis to avoid running rules on every keystroke
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (!news || !news.trim()) {
        setAnalysis(null);
        return;
      }
      try {
        const result = analyzeNews(news);
        setAnalysis(result);
      } catch (err) {
        setAnalysis(null);
      }
    }, 650);

    return () => clearTimeout(debounceRef.current);
  }, [news]);

  const directionColor = (dir) => {
    if (!dir) return 'var(--text-muted)';
    if (dir === 'Alta') return 'var(--accent-green)';
    if (dir === 'Queda') return 'var(--accent-red)';
    return 'var(--text-primary)';
  };

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

        <div className="controls-row">
          <div className="analysis-badge">
            {analysis ? (
              <>
                <div className="dir" style={{ color: directionColor(analysis.marketDirection) }}>
                  {analysis.marketDirection}
                </div>
                <div className="conf">Conf: {analysis.confidence}%</div>
                <div className="action">{analysis.tradeAction}</div>
              </>
            ) : (
              <div className="idle">Aguardando texto...</div>
            )}
          </div>

          <button className="btn btn-primary" onClick={onAnalyze}>
            FILTRAR IMPACTO ⚡
          </button>
        </div>
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
        .controls-row {
          display: flex;
          gap: 0.75rem;
          align-items: center;
          justify-content: space-between;
        }
        .analysis-badge {
          display: flex;
          gap: 0.6rem;
          align-items: center;
          background: rgba(255,255,255,0.03);
          padding: 0.45rem 0.65rem;
          border-radius: 8px;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }
        .analysis-badge .dir { font-weight: 800; min-width: 64px; text-align: center; }
        .analysis-badge .conf { font-weight: 600; color: var(--text-muted); }
        .analysis-badge .action { font-size: 0.8rem; background: rgba(255,255,255,0.02); padding: 0.2rem 0.45rem; border-radius: 6px; }
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
          background: linear-gradient(135deg, #4fa8ff, #7c3aed);
          color: #fff;
          box-shadow: 0 0 18px rgba(79,168,255,0.35), 0 0 35px rgba(124,58,237,0.2);
          font-weight: 800;
        }
        .btn-primary:hover {
          filter: brightness(1.12);
          transform: translateY(-2px);
          box-shadow: 0 0 28px rgba(79,168,255,0.55), 0 0 55px rgba(124,58,237,0.35);
        }
      `}</style>
    </div>
  );
};

export default NewsInput;
