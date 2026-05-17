import React from 'react';
import { TrendingUp, ShieldCheck, Activity, ArrowUpRight, ArrowDownRight, Gauge, Sparkles } from 'lucide-react';

const MarketPulse = ({ lastAlert, correlation, marketRegime, currentWin, currentDolar }) => {
  const direction = lastAlert?.marketDirection || 'Neutro';
  const confidence = lastAlert?.confidence ?? 45;
  const drivers = lastAlert?.drivers || ['Macro'];
  const isBullish = direction === 'Alta';
  const isBearish = direction === 'Queda';

  return (
    <div className="market-pulse glass animate-fade-in">
      <div className="pulse-left">
        <div className="pulse-label">Market Pulse</div>
        <div className="pulse-title">Direção Atual</div>
        <div className={`pulse-direction ${isBullish ? 'bull' : isBearish ? 'bear' : 'neutral'}`}>
          {isBullish && <ArrowUpRight size={18} />}
          {isBearish && <ArrowDownRight size={18} />}
          <span>{direction}</span>
        </div>
        <div className="pulse-confidence">
          <span>Confiança</span>
          <strong>{confidence}%</strong>
        </div>
        <div className="pulse-drivers">
          {drivers.map((driver, idx) => (
            <span key={idx} className="driver-chip">{driver}</span>
          ))}
        </div>
      </div>

      <div className="pulse-right">
        <div className="pulse-metrics">
          <div className="metric-card">
            <div className="metric-icon"><TrendingUp size={18} /></div>
            <div>
              <div className="metric-label">Regime de Mercado</div>
              <div className="metric-value">{marketRegime}</div>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon"><ShieldCheck size={18} /></div>
            <div>
              <div className="metric-label">Correlação</div>
              <div className="metric-value">{correlation?.toFixed(2)}</div>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon"><Gauge size={18} /></div>
            <div>
              <div className="metric-label">WIN</div>
              <div className="metric-value">{currentWin?.toLocaleString('pt-BR')}</div>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon"><Activity size={18} /></div>
            <div>
              <div className="metric-label">USD/BRL</div>
              <div className="metric-value">{currentDolar?.toFixed(4)}</div>
            </div>
          </div>
        </div>
        <div className="pulse-note">
          <Sparkles size={18} />
          <span>Use esse pulso como sinal de confirmação antes de decidir o trade.</span>
        </div>
      </div>

      <style jsx="true">{`
        .market-pulse {
          display: grid;
          grid-template-columns: 1.7fr 1.3fr;
          gap: 1.25rem;
          padding: 1.4rem;
          border-radius: 18px;
          border: 1px solid rgba(148, 163, 184, 0.12);
          background: rgba(12, 16, 24, 0.9);
          box-shadow: 0 16px 50px rgba(0,0,0,0.15);
          margin-bottom: 1.5rem;
        }
        .pulse-left {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .pulse-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }
        .pulse-title {
          font-size: 1.35rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: var(--text-primary);
        }
        .pulse-direction {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.4rem;
          font-weight: 800;
        }
        .pulse-direction.bull { color: var(--accent-green); }
        .pulse-direction.bear { color: var(--accent-red); }
        .pulse-direction.neutral { color: var(--text-muted); }
        .pulse-confidence {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.85rem 1rem;
          border-radius: 14px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(148, 163, 184, 0.08);
          font-size: 0.95rem;
        }
        .pulse-confidence strong {
          font-size: 1.05rem;
          color: white;
        }
        .pulse-drivers {
          display: flex;
          flex-wrap: wrap;
          gap: 0.65rem;
        }
        .driver-chip {
          padding: 0.45rem 0.75rem;
          border-radius: 999px;
          background: rgba(56, 189, 248, 0.12);
          color: var(--text-primary);
          font-size: 0.8rem;
        }
        .pulse-right {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 1rem;
        }
        .pulse-metrics {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.85rem;
        }
        .metric-card {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          padding: 1rem;
          border-radius: 16px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(148, 163, 184, 0.08);
        }
        .metric-icon {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: rgba(56, 189, 248, 0.12);
        }
        .metric-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 0.15rem;
        }
        .metric-value {
          font-size: 1rem;
          font-weight: 700;
          color: white;
        }
        .pulse-note {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          border-radius: 16px;
          border: 1px solid rgba(56, 189, 248, 0.16);
          background: rgba(56, 189, 248, 0.05);
          color: var(--text-muted);
          font-size: 0.9rem;
        }
        .pulse-note span {
          line-height: 1.4;
        }

        @media (max-width: 950px) {
          .market-pulse {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default MarketPulse;
