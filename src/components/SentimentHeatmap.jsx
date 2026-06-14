import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SentimentHeatmap = ({ lastAlert, activeTicker, chartData = [] }) => {
  const [selectedSector, setSelectedSector] = useState(null);
  const sectors = [
    { id: 'Macro', label: 'Macro / Juros', icon: '🏦', desc: 'Indicadores econômicos e política monetária' },
    { id: 'AI', label: 'AI Narrative', icon: '🤖', desc: 'Narrativa de inteligência artificial' },
    { id: 'RWA', label: 'RWA / Banking', icon: '🧱', desc: 'Ativos do mundo real e setor bancário' },
    { id: 'Crypto', label: 'Crypto Beta', icon: '🪙', desc: 'Mercado de criptomoedas' },
    { id: 'Commodities', label: 'Commodities', icon: '🛢️', desc: 'Metais, petróleo, agrícolas' },
    { id: 'MEME', label: 'Speculation', icon: '🤡', desc: 'Especulação e ativos virais' }
  ];

  const getHeatColor = (sectorId) => {
    if (!lastAlert || lastAlert === 'IGNORAR') return 'rgba(255, 255, 255, 0.04)';
    
    if (lastAlert.sector === sectorId) {
      const strength = lastAlert.strength || 'Médio';
      if (lastAlert.impact.win === 'Alta' || lastAlert.impact.crypto === 'Alta') {
        if (strength === 'Forte') return 'rgba(16, 185, 129, 0.35)';
        if (strength === 'Médio') return 'rgba(16, 185, 129, 0.22)';
        return 'rgba(16, 185, 129, 0.12)';
      }
      if (lastAlert.impact.win === 'Queda' || lastAlert.impact.crypto === 'Queda') {
        if (strength === 'Forte') return 'rgba(239, 68, 68, 0.35)';
        if (strength === 'Médio') return 'rgba(239, 68, 68, 0.22)';
        return 'rgba(239, 68, 68, 0.12)';
      }
    }
    return 'rgba(255, 255, 255, 0.04)';
  };

  const getBorderColor = (sectorId) => {
    if (lastAlert?.sector === sectorId) {
       if (lastAlert.impact.win === 'Alta' || lastAlert.impact.crypto === 'Alta') return 'var(--accent-green)';
       if (lastAlert.impact.win === 'Queda' || lastAlert.impact.crypto === 'Queda') return 'var(--accent-red)';
    }
    return 'rgba(255, 255, 255, 0.1)';
  };

  const getStrengthLabel = (sectorId) => {
    if (lastAlert?.sector === sectorId) {
      return lastAlert.strength || 'Médio';
    }
    return null;
  };

  const getSentimentEmoji = (sectorId) => {
    if (lastAlert?.sector === sectorId) {
      if (lastAlert.impact.win === 'Alta' || lastAlert.impact.crypto === 'Alta') return '📈';
      if (lastAlert.impact.win === 'Queda' || lastAlert.impact.crypto === 'Queda') return '📉';
    }
    return null;
  };

  const getChartDataForSector = (sectorId) => {
    if (sectorId === 'Crypto' || sectorId === 'AI' || sectorId === 'MEME') {
      return chartData.filter(d => d.activeAssetVal !== undefined).slice(-20).map((d, i) => ({
        time: d.time || `${i}m`,
        price: d.activeAssetVal || 0,
        sentiment: d.sentiment || 50
      }));
    }
    if (sectorId === 'Macro') {
      return chartData.slice(-20).map((d, i) => ({
        time: d.time || `${i}m`,
        price: d.dolar || 5.02,
        sentiment: d.sentiment || 50
      }));
    }
    if (sectorId === 'Commodities') {
      return chartData.slice(-20).map((d, i) => ({
        time: d.time || `${i}m`,
        price: d.win / 24000 || 0.005,
        sentiment: d.sentiment || 50
      }));
    }
    return chartData.slice(-20).map((d, i) => ({
      time: d.time || `${i}m`,
      price: Math.random() * 100,
      sentiment: d.sentiment || 50
    }));
  };

  const handleSectorClick = (sectorId) => {
    setSelectedSector(selectedSector === sectorId ? null : sectorId);
  };

  return (
    <div className="sentiment-heatmap glass animate-fade-in">
      <div className="heatmap-header">
        <h4 className="title">Mapa de Calor do Sentimento</h4>
        <span className="live-tag">LIVE ALPHA</span>
      </div>
      <div className="heatmap-grid">
        {sectors.map((sector, idx) => (
          <div 
            key={sector.id} 
            className={`sector-cell ${selectedSector === sector.id ? 'selected' : ''}`}
            style={{ 
              backgroundColor: getHeatColor(sector.id),
              borderColor: getBorderColor(sector.id),
              animationDelay: `${idx * 0.05}s`
            }}
            title={sector.desc}
            onClick={() => handleSectorClick(sector.id)}
          >
            <div className="sector-content">
              <span className="sector-icon">{sector.icon}</span>
              {getSentimentEmoji(sector.id) && (
                <span className="sentiment-emoji">{getSentimentEmoji(sector.id)}</span>
              )}
              <span className="sector-label">{sector.label}</span>
              {getStrengthLabel(sector.id) && (
                <span className="strength-badge">{getStrengthLabel(sector.id)}</span>
              )}
            </div>
            {lastAlert?.sector === sector.id && (
              <div className="active-glow"></div>
            )}
          </div>
        ))}
      </div>

      {selectedSector && (
        <div className="sector-chart-panel">
          <div className="chart-header">
            <h5>{sectors.find(s => s.id === selectedSector)?.label}</h5>
            <button className="close-chart" onClick={() => setSelectedSector(null)}>×</button>
          </div>
          {getChartDataForSector(selectedSector).length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={getChartDataForSector(selectedSector)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="time" stroke="var(--text-muted)" style={{ fontSize: '0.7rem' }} />
                <YAxis stroke="var(--text-muted)" style={{ fontSize: '0.7rem' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(10, 12, 16, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px' }}
                  labelStyle={{ color: 'var(--text-primary)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke="var(--accent-blue)" 
                  dot={false}
                  strokeWidth={2}
                  isAnimationActive={true}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>
              Dados insuficientes
            </div>
          )}
        </div>
      )}

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
          grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
          gap: 0.6rem;
        }

        .sector-cell {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 0.85rem 0.35rem;
          border-radius: 8px;
          border: 2px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          cursor: pointer;
          animation: cellEntry 0.4s ease-out forwards;
          opacity: 0;
        }

        @keyframes cellEntry {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.92);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .sector-cell:hover {
          border-color: rgba(255, 255, 255, 0.25);
          background: rgba(255, 255, 255, 0.08) !important;
          transform: translateY(-2px);
        }

        .sector-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          z-index: 2;
        }

        .sector-icon {
          font-size: 1.4rem;
        }

        .sentiment-emoji {
          font-size: 0.85rem;
          animation: bounce 1.5s infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }

        .sector-label {
          font-size: 0.62rem;
          font-weight: 700;
          text-align: center;
          color: var(--text-secondary);
          letter-spacing: 0.3px;
        }

        .strength-badge {
          font-size: 0.52rem;
          font-weight: 900;
          text-transform: uppercase;
          color: white;
          background: rgba(0, 0, 0, 0.3);
          padding: 2px 5px;
          border-radius: 999px;
          letter-spacing: 0.5px;
          margin-top: 0.15rem;
        }

        .active-glow {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.15), 0 0 15px rgba(255, 255, 255, 0.08);
          animation: pulse-glow 2s infinite;
          border-radius: 8px;
        }

        @keyframes pulse-glow {
          0% { opacity: 0.4; }
          50% { opacity: 0.8; }
          100% { opacity: 0.4; }
        }

        @media (max-width: 500px) {
          .heatmap-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 0.5rem;
          }
          .sector-cell {
            padding: 0.7rem 0.25rem;
          }
        }
      `}</style>
    </div>
  );
};

export default SentimentHeatmap;
