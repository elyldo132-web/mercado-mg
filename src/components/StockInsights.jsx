import React from 'react';
import { Star, TrendingUp, Zap, ExternalLink, ShieldCheck, PieChart } from 'lucide-react';

const stocks = [
  {
    name: 'Taesa',
    ticker: 'TAEE11',
    yield: 9.5,
    growth: 5.0,
    tag: 'Setor Elétrico',
    description: 'Referência em dividendos, com fluxos de caixa previsíveis indexados à inflação.',
    color: '#10b981',
    icon: ShieldCheck
  },
  {
    name: 'BB Seguridade',
    ticker: 'BBSE3',
    yield: 8.8,
    growth: 6.0,
    tag: 'Seguros',
    description: 'Modelo de negócio leve em capital com alto índice de distribuição de lucros.',
    color: '#34d399',
    icon: PieChart
  },
  {
    name: 'Microsoft',
    ticker: 'MSFT',
    yield: 0.7,
    growth: 16.0,
    tag: 'Tecnologia (Dividend Growth)',
    description: 'Crescimento explosivo de patrimônio com proventos subindo há décadas.',
    color: '#60a5fa',
    icon: Zap
  },
  {
    name: 'Coca-Cola',
    ticker: 'KO',
    yield: 3.1,
    growth: 7.5,
    tag: 'Consumo Estável',
    description: 'Dividend Aristocrat clássica, ideal para preservação de capital e renda constante.',
    color: '#f87171',
    icon: Star
  },
  {
    name: 'HGLG11',
    ticker: 'HGLG11',
    yield: 8.2,
    growth: 4.5,
    tag: 'FII Logístico',
    description: 'Fundo imobiliário robusto com ativos de alta qualidade e rendimentos isentos.',
    color: '#fbbf24',
    icon: TrendingUp
  }
];

const StockInsights = ({ onInject }) => {
  return (
    <section id="portfolio" className="stock-insights" style={{ marginTop: '4rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
        <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '12px', color: '#10b981' }}>
          <Star size={24} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Seleção de Ativos de Qualidade</h2>
          <p style={{ color: '#8b949e' }}>Ativos fundamentais para uma estratégia de longo prazo focada em Yield Growth.</p>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
        gap: '2rem' 
      }}>
        {stocks.map((stock) => (
          <div key={stock.ticker} className="glass-panel stock-card" style={{ 
            padding: '1.75rem',
            position: 'relative',
            overflow: 'hidden',
            transition: 'transform 0.3s ease, border-color 0.3s ease',
            cursor: 'default',
            background: 'rgba(22, 27, 34, 0.7)',
            border: '1px solid #30363d',
            borderRadius: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ 
                  fontSize: '0.75rem', 
                  textTransform: 'uppercase', 
                  fontWeight: '700', 
                  color: stock.color,
                  letterSpacing: '1px',
                  display: 'block',
                  marginBottom: '4px'
                }}>
                  {stock.tag}
                </span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '800' }}>{stock.ticker}</h3>
                <p style={{ fontSize: '0.9rem', color: '#8b949e' }}>{stock.name}</p>
              </div>
              <div style={{ color: stock.color, opacity: 0.8 }}>
                <stock.icon size={28} />
              </div>
            </div>

            <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: '#8b949e', marginBottom: '1.5rem', minHeight: '3.2rem' }}>
              {stock.description}
            </p>

            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', padding: '1rem', background: 'rgba(0,0,0,0.15)', borderRadius: '12px' }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.7rem', color: '#8b949e', textTransform: 'uppercase' }}>Yield</span>
                <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#10b981' }}>{stock.yield}%</span>
              </div>
              <div style={{ paddingLeft: '1.5rem', borderLeft: '1px solid #30363d' }}>
                <span style={{ display: 'block', fontSize: '0.7rem', color: '#8b949e', textTransform: 'uppercase' }}>Val. Esperada</span>
                <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#60a5fa' }}>{stock.growth}%</span>
              </div>
            </div>

            <button 
              onClick={() => onInject && onInject(stock)}
              className="inject-btn"
              style={{ 
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #30363d',
                background: 'transparent',
                color: 'white',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                transition: 'all 0.3s ease'
              }}
            >
              Simular este Ativo <ExternalLink size={14} />
            </button>
          </div>
        ))}
      </div>

      <style>{`
        .stock-card:hover {
          transform: translateY(-5px);
          border-color: #10b981;
        }
        .inject-btn:hover {
          background: rgba(255,255,255,0.05);
          border-color: #10b981;
          color: #10b981;
        }
      `}</style>
    </section>
  );
};

export default StockInsights;
