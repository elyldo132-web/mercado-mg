import React, { useMemo, useEffect } from 'react';
import { DollarSign, Percent, Calendar, PlusCircle } from 'lucide-react';

const YieldSimulator = ({ 
  onUpdate, 
  initialInvestment, 
  setInitialInvestment, 
  monthlyContribution, 
  setMonthlyContribution, 
  expectedYield, 
  setExpectedYield, 
  expectedGrowth, 
  setExpectedGrowth, 
  years, 
  setYears 
}) => {
  const yearlyData = useMemo(() => {
    let total = initialInvestment;
    const monthlyYieldRate = expectedYield / 100 / 12;
    const monthlyGrowthRate = expectedGrowth / 100 / 12;
    const totalMonths = years * 12;
    const result = [];
    let cumulativeDivs = 0;

    for (let m = 0; m <= totalMonths; m++) {
      if (m > 0) {
        const monthlyDiv = total * monthlyYieldRate;
        cumulativeDivs += monthlyDiv;
        total = total * (1 + monthlyGrowthRate);
        total += monthlyContribution;
        total += monthlyDiv;
      }

      if (m % 12 === 0) {
        result.push({
          year: `Ano ${m / 12}`,
          totalValue: Math.round(total),
          cumulativeDividends: Math.round(cumulativeDivs)
        });
      }
    }

    return result;
  }, [initialInvestment, monthlyContribution, expectedYield, expectedGrowth, years]);

  useEffect(() => {
    if (onUpdate) {
      onUpdate(yearlyData);
    }
  }, [onUpdate, yearlyData]);

  const results = useMemo(() => {
    const final = yearlyData[yearlyData.length - 1] || { totalValue: 0, cumulativeDividends: 0 };
    const yearlyDividend = final.totalValue * (expectedYield / 100);

    return {
      totalValue: final.totalValue,
      monthlyDividend: yearlyDividend / 12
    };
  }, [yearlyData, expectedYield]);

  const formatCurrency = (val) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div id="estrategia" className="glass-panel" style={{ padding: '2rem', height: 'fit-content', transition: 'border-color 0.3s' }}>
      <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <PlusCircle size={24} color="#10b981" />
        Simulação de Independência
      </h2>

      <div className="simulator-form" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="input-group">
          <label style={{ display: 'block', color: '#8b949e', marginBottom: '0.6rem', fontSize: '0.9rem', fontWeight: '500' }}>Investimento Inicial</label>
          <div style={{ position: 'relative' }}>
            <DollarSign size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#10b981' }} />
            <input 
              type="number" 
              value={initialInvestment}
              onChange={(e) => setInitialInvestment(Number(e.target.value))}
              style={{ width: '100%', background: '#0a0c10', border: '1px solid #30363d', padding: '0.6rem 0.6rem 0.6rem 2.4rem', color: 'white', borderRadius: '8px', fontSize: '0.9rem' }}
            />
          </div>
        </div>

        <div className="input-group">
          <label style={{ display: 'block', color: '#8b949e', marginBottom: '0.6rem', fontSize: '0.9rem', fontWeight: '500' }}>Aporte Mensal</label>
          <div style={{ position: 'relative' }}>
             <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#60a5fa' }} />
             <input 
              type="number" 
              value={monthlyContribution}
              onChange={(e) => setMonthlyContribution(Number(e.target.value))}
              style={{ width: '100%', background: '#0a0c10', border: '1px solid #30363d', padding: '0.6rem 0.6rem 0.6rem 2.4rem', color: 'white', borderRadius: '8px', fontSize: '0.9rem' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          <div className="input-group">
            <label style={{ display: 'block', color: '#8b949e', marginBottom: '0.6rem', fontSize: '0.9rem', fontWeight: '500' }}>Yield Anual (%)</label>
            <div style={{ position: 'relative' }}>
              <Percent size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#8b949e' }} />
              <input 
                type="number" 
                value={expectedYield}
                onChange={(e) => setExpectedYield(Number(e.target.value))}
                style={{ width: '100%', background: '#0a0c10', border: '1px solid #30363d', padding: '0.6rem', color: 'white', borderRadius: '8px', fontSize: '0.9rem' }}
              />
            </div>
          </div>
          <div className="input-group">
            <label style={{ display: 'block', color: '#8b949e', marginBottom: '0.6rem', fontSize: '0.9rem', fontWeight: '500' }}>Valorização (%)</label>
            <div style={{ position: 'relative' }}>
              <TrendingUp size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#8b949e' }} />
              <input 
                type="number" 
                value={expectedGrowth}
                onChange={(e) => setExpectedGrowth(Number(e.target.value))}
                style={{ width: '100%', background: '#0a0c10', border: '1px solid #30363d', padding: '0.6rem', color: 'white', borderRadius: '8px', fontSize: '0.9rem' }}
              />
            </div>
          </div>
        </div>

        <div className="input-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
            <label style={{ color: '#8b949e', fontSize: '0.9rem', fontWeight: '500' }}>Prazo da Estratégia</label>
            <span style={{ color: '#10b981', fontWeight: 'bold' }}>{years} Anos</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="40" 
            value={years} 
            onChange={(e) => setYears(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#10b981', height: '6px', borderRadius: '5px', background: '#30363d', cursor: 'pointer' }}
          />
        </div>

        <div className="results-panel" style={{ 
          marginTop: '1rem', 
          padding: '1.5rem', 
          background: 'rgba(16, 185, 129, 0.05)', 
          borderRadius: '16px', 
          border: '1px solid rgba(16, 185, 129, 0.2)',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
          transition: 'all 0.5s ease'
        }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <span style={{ color: '#8b949e', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Patrimônio Final</span>
            <div className="pulse-text" style={{ fontSize: '2rem', fontWeight: '800', color: '#10b981', marginTop: '4px' }}>
              {formatCurrency(results.pulseValue || results.totalValue)}
            </div>
          </div>
          <div>
            <span style={{ color: '#8b949e', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Renda Mensal Estimada</span>
            <div className="pulse-text" style={{ fontSize: '1.5rem', fontWeight: '700', color: '#34d399', marginTop: '4px' }}>
              {formatCurrency(results.pulseDividend || results.monthlyDividend)}
            </div>
          </div>
        </div>
      </div>

      <style jsx="true">{`
        .pulse-border {
          border-color: #10b981 !important;
          box-shadow: 0 0 15px rgba(16, 185, 129, 0.2) !important;
        }
        .pulse-text {
          transition: all 0.5s ease;
        }
      `}</style>
    </div>
  );
};

const TrendingUp = ({ size, color, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
);

export default YieldSimulator;
