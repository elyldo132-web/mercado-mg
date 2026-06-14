import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from './Header';
import NewsInput from './NewsInput';
import MacroAlert from './MacroAlert';
import History from './History';
import EconomicCalendar from './EconomicCalendar';
import CryptoScanner from './CryptoScanner';
import SentimentHeatmap from './SentimentHeatmap';
import TradingPanel from './TradingPanel';
import YieldSimulator from './YieldSimulator';
import ResultCharts from './ResultCharts';
import StockInsights from './StockInsights';
import FlowRadar from './FlowRadar';
import MarketPulse from './MarketPulse';
import OpportunityScanner from './OpportunityScanner';
import WinAnalysis from './WinAnalysis';
import TradingViewCharts from './TradingViewCharts';
import RiskCalculator from './RiskCalculator';
import SignalPanel from './SignalPanel';
import { TrendingUp, Activity, PieChart, Zap } from 'lucide-react';
import { analyzeNews } from '../utils/MacroRules';
import { startNewsFeed } from '../utils/NewsFetcher';
import { fetchExchangeRates, fetchBitcoinPrice } from '../data/connectors';

const Dashboard = ({ onLogout }) => {
  const [news, setNews] = useState('');
  const [lastAlert, setLastAlert] = useState(null);
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('mercado_mg_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [chartData, setChartData] = useState(() => {
    return Array.from({ length: 15 }, (_, i) => {
      const baseWin = 125000 + (Math.random() * 600 - 300);
      const baseDolar = 5.02 + (Math.random() * 0.06 - 0.03);
      return {
        time: new Date(Date.now() - (15 - i) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sentiment: 50 + Math.floor(Math.random() * 20 - 10),
        win: Math.floor(baseWin),
        dolar: parseFloat(baseDolar.toFixed(4)),
        activeAssetVal: 0,
        winSignal: null,
        dolarSignal: null,
        assetSignal: null,
        news: null
      };
    });
  });
  const [winPrice, setWinPrice] = useState(() => chartData[14]?.win || 125432);
  const [dolarPrice, setDolarPrice] = useState(() => chartData[14]?.dolar || 5.0234);
  const [activeTicker, setActiveTicker] = useState(null);
  const [activeTickerPrice, setActiveTickerPrice] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [correlation, setCorrelation] = useState(-0.85); // Padrão inverso
  const [marketRegime, setMarketRegime] = useState('NORMAL');
  const [toast, setToast] = useState(null);
  const [macroSignal, setMacroSignal] = useState(null);
  const toastTimerRef = useRef(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      showToast(next ? 'Alertas sonoros mutados' : 'Alertas sonoros ativados', 'success');
      return next;
    });
  }, [showToast]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      const key = e.key.toLowerCase();
      if (key === 'm') {
        setView('market');
        showToast('Visão Macro ativada (M)', 'info');
      }
      if (key === 's') {
        setView('simulator');
        showToast('Visão Simulador ativada (S)', 'info');
      }
      if (key === 'o') {
        setView('opportunities');
        showToast('Buscador de Oportunidades ativado (O)', 'info');
      }
      if (key === 't') {
        toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showToast, toggleMute]);

  // Trading State
  const [balance, setBalance] = useState(() => {
    const saved = localStorage.getItem('mercado_mg_balance');
    return saved ? parseFloat(saved) : 10000.00;
  });
  const [positions, setPositions] = useState(() => {
    const saved = localStorage.getItem('mercado_mg_positions');
    return saved ? JSON.parse(saved) : [];
  });

  const [liveFeedSource, setLiveFeedSource] = useState('Simulado');
  const [macroSnapshot, setMacroSnapshot] = useState({ rateUSD: null, rateBRL: null, btcPrice: null, source: 'Local' });

  // Unified View State
  const [view, setView] = useState('market');

  // Yield Simulation State
  const [ygChartData, setYgChartData] = useState([]);
  const [initialInvestment, setInitialInvestment] = useState(() => {
    const saved = localStorage.getItem('yg_initial');
    return saved ? Number(saved) : 10000;
  });
  const [monthlyContribution, setMonthlyContribution] = useState(() => {
    const saved = localStorage.getItem('yg_monthly');
    return saved ? Number(saved) : 1000;
  });
  const [expectedYield, setExpectedYield] = useState(() => {
    const saved = localStorage.getItem('yg_yield');
    return saved ? Number(saved) : 6;
  });
  const [expectedGrowth, setExpectedGrowth] = useState(() => {
    const saved = localStorage.getItem('yg_growth');
    return saved ? Number(saved) : 8;
  });
  const [years, setYears] = useState(() => {
    const saved = localStorage.getItem('yg_years');
    return saved ? Number(saved) : 15;
  });

  // Sync Yield state with localStorage
  useEffect(() => {
    localStorage.setItem('yg_initial', initialInvestment.toString());
    localStorage.setItem('yg_monthly', monthlyContribution.toString());
    localStorage.setItem('yg_yield', expectedYield.toString());
    localStorage.setItem('yg_growth', expectedGrowth.toString());
    localStorage.setItem('yg_years', years.toString());
  }, [initialInvestment, monthlyContribution, expectedYield, expectedGrowth, years]);

  useEffect(() => {
    const loadMacroData = async () => {
      try {
        const [fx, btc] = await Promise.all([fetchExchangeRates(), fetchBitcoinPrice()]);
        setMacroSnapshot({
          rateUSD: fx.value,
          rateBRL: fx.values?.BRL,
          btcPrice: btc.value,
          source: fx.source
        });
      } catch (error) {
        console.warn('Erro ao carregar macro snapshot:', error);
      }
    };

    loadMacroData();
  }, []);

  const handleInjectAsset = (asset) => {
    setExpectedYield(asset.yield);
    setExpectedGrowth(asset.growth);
    // Move to top of simulator
    document.getElementById('estrategia')?.scrollIntoView({ behavior: 'smooth' });
  };

  const historyRef = useRef([]);

  const detectTicker = useCallback((text) => {
    if (!text) return null;
    const cryptoGems = 'SOL|PEPE|RNDR|FET|ONDO|LINK|WIF|NEAR|TAO|BTC|ETH';
    const techStocks = 'AAPL|TSLA|NVDA|MSFT|GOOGL|AMZN|META';
    const brStocks = 'PETR4|VALE3|ITUB4|BBDC4|BBAS3|MGLU3';
    const regex = new RegExp(`\\b([A-Z]{4}[0-9]|${brStocks}|${techStocks}|${cryptoGems})\\b`, 'i');
    const match = text.match(regex);
    return match ? match[1].toUpperCase() : null;
  }, []);


  const calculateCorrelation = useCallback((points) => {
    if (points.length < 5) return -0.85;
    // Simplificado: correlação de Pearson nos últimos N pontos
    const sample = points.slice(-10);
    const n = sample.length;
    const sumX = sample.reduce((a, b) => a + b.win, 0);
    const sumY = sample.reduce((a, b) => a + b.dolar, 0);
    const sumXY = sample.reduce((a, b) => a + (b.win * b.dolar), 0);
    const sumX2 = sample.reduce((a, b) => a + (b.win * b.win), 0);
    const sumY2 = sample.reduce((a, b) => a + (b.dolar * b.dolar), 0);

    const num = (n * sumXY) - (sumX * sumY);
    const den = Math.sqrt(((n * sumX2) - (sumX * sumX)) * ((n * sumY2) - (sumY * sumY)));
    
    if (den === 0) return 0;
    return num / den;
  }, []);

  const processNewAlert = useCallback((alert, time) => {
    const newHistory = [alert, ...historyRef.current].slice(0, 25);
    setHistory(newHistory);
    historyRef.current = newHistory;
    localStorage.setItem('mercado_mg_history', JSON.stringify(newHistory));
    
    // Play alert sound if not muted and impact is 'Forte'
    if (!isMuted && alert.strength === 'Forte') {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); // Bloomberg-like ping
      audio.play().catch(() => {});
    }

    // Detecção automática de ticker no feed
    const foundTicker = detectTicker(alert.summary);
    if (foundTicker && foundTicker !== activeTicker) {
      setActiveTicker(foundTicker);
      setActiveTickerPrice(Math.random() * 80 + 20);
    }

    // Atualizar gráfico
    setChartData(prev => {
      const last = prev[prev.length - 1];
      let newSentiment = last.sentiment;
      let newWin = last.win;
      let newDolar = last.dolar;
      
      // WIN Impact
      if (alert.impact.win === 'Alta') newWin += Math.random() * 400 + 100;
      if (alert.impact.win === 'Queda') newWin -= Math.random() * 400 + 100;
      
      // Dolar Impact
      if (alert.impact.dollar === 'Alta') newDolar += Math.random() * 0.03 + 0.01;
      if (alert.impact.dollar === 'Queda') newDolar -= Math.random() * 0.03 + 0.01;

      // Adicionar ruído de mercado
      newWin += Math.random() * 50 - 25;
      newDolar += Math.random() * 0.005 - 0.0025;

      // Sentiment
      if (alert.impact.win === 'Alta') newSentiment += 12;
      if (alert.impact.win === 'Queda') newSentiment -= 12;
      newSentiment = Math.max(10, Math.min(90, newSentiment + (Math.random() * 6 - 3)));
      
      const updatedWin = Math.floor(newWin);
      const updatedDolar = parseFloat(newDolar.toFixed(4));
      
      setWinPrice(updatedWin);
      setDolarPrice(updatedDolar);

      let newActiveVal = last.activeAssetVal || (activeTicker ? Math.random() * 80 + 20 : 0);
      if (activeTicker) {
        if (alert.impact.win === 'Alta') newActiveVal *= (1 + (Math.random() * 0.02));
        if (alert.impact.win === 'Queda') newActiveVal *= (1 - (Math.random() * 0.02));
        newActiveVal += (Math.random() * 0.4 - 0.2);
        setActiveTickerPrice(parseFloat(newActiveVal.toFixed(2)));
      }

      // Sinais de Compra/Venda (apenas se impacto for Forte)
      let winSignal = null;
      let dolarSignal = null;
      let assetSignal = null;
      
      if (alert.strength === 'Forte') {
        if (alert.impact.win === 'Alta') winSignal = 'buy';
        if (alert.impact.win === 'Queda') winSignal = 'sell';
        if (alert.impact.dollar === 'Alta') dolarSignal = 'buy';
        if (alert.impact.dollar === 'Queda') dolarSignal = 'sell';
        if (activeTicker) {
          if (alert.impact.win === 'Alta') assetSignal = 'buy';
          if (alert.impact.win === 'Queda') assetSignal = 'sell';
        }
      }

      const nextPoints = [...prev.slice(-19), {
        time: time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sentiment: Math.floor(newSentiment),
        win: updatedWin,
        dolar: updatedDolar,
        activeAssetVal: parseFloat(newActiveVal.toFixed(2)),
        winSignal,
        dolarSignal,
        assetSignal,
        news: alert.summary
      }];

      // Calculate Correlation & Regime
      const corrValue = calculateCorrelation(nextPoints);
      setCorrelation(parseFloat(corrValue.toFixed(2)));
      
      const impactsFelt = (alert.impact.win !== 'Neutro' ? 1 : 0) + (alert.impact.dollar !== 'Neutro' ? 1 : 0);
      
      if (corrValue > 0.5) setMarketRegime('CORR_ANOMALY');
      else if (impactsFelt >= 1 && alert.strength === 'Forte') setMarketRegime('TRENDING');
      else setMarketRegime('NORMAL');

      // Calculate P/L for positions
      setPositions(currentPos => {
        const updated = currentPos.map(p => {
          if (p.ticker === activeTicker) {
            const currentVal = newActiveVal;
            const diff = p.type === 'BUY' ? (currentVal - p.entryPrice) : (p.entryPrice - currentVal);
            const plPercent = (diff / p.entryPrice) * 100;
            return { ...p, pl: plPercent, currentPrice: currentVal };
          }
          return p;
        });
        localStorage.setItem('mercado_mg_positions', JSON.stringify(updated));
        return updated;
      });

      return nextPoints;
    });

    setLastAlert(alert);
  }, [isMuted, activeTicker, detectTicker, calculateCorrelation]);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    // Iniciar feed automático
    const stopFeed = startNewsFeed((incomingNews) => {
      setLiveFeedSource(incomingNews.source || 'Simulado');
      const result = analyzeNews(incomingNews.text);
      if (result !== 'IGNORAR') {
        processNewAlert(result, incomingNews.time);
      }
    });

    return () => stopFeed();
  }, [processNewAlert]);

  // Market Pulse: Pequenas oscilações para manter o dashboard "vivo"
  useEffect(() => {
    const pulse = setInterval(() => {
      setChartData(prev => {
        if (prev.length === 0) return prev;
        const last = { ...prev[prev.length - 1] };
        
        // Oscilações leves (ruído de mercado)
        const winDrift = (Math.random() * 30 - 15);
        const dolarDrift = (Math.random() * 0.002 - 0.001);
        
        last.win = Math.floor(last.win + winDrift);
        last.dolar = parseFloat((last.dolar + dolarDrift).toFixed(4));
        
        if (activeTicker) {
          last.activeAssetVal = parseFloat((last.activeAssetVal + (Math.random() * 0.2 - 0.1)).toFixed(2));
          setActiveTickerPrice(last.activeAssetVal);
        }

        setWinPrice(last.win);
        setDolarPrice(last.dolar);

        // Atualizar P/L de todas as posições no pulso
        setPositions(currentPos => {
          if (currentPos.length === 0) return currentPos;
          const updated = currentPos.map(p => {
            let currentPrice = p.currentPrice || p.entryPrice;
            if (p.ticker === activeTicker) {
              currentPrice = last.activeAssetVal;
            } else {
              // Pequena oscilação para ativos fora de foco
              const drift = (Math.random() * 0.04 - 0.02);
              currentPrice = parseFloat((currentPrice + drift).toFixed(2));
            }
            const diff = p.type === 'BUY' ? (currentPrice - p.entryPrice) : (p.entryPrice - currentPrice);
            const plPercent = (diff / p.entryPrice) * 100;
            return { ...p, pl: plPercent, currentPrice };
          });
          localStorage.setItem('mercado_mg_positions', JSON.stringify(updated));
          return updated;
        });

        return [...prev.slice(0, -1), last];
      });
    }, 4000); // A cada 4 segundos

    return () => clearInterval(pulse);
  }, [activeTicker]);

  const handleAnalyze = () => {
    if (!news.trim()) {
      showToast('Digite uma notícia para análise', 'warning');
      return;
    }
    
    const tickerMatch = detectTicker(news);
    if (tickerMatch) {
      setActiveTicker(tickerMatch);
      setActiveTickerPrice(Math.random() * 80 + 20); // Simular preço base inicial
    }

    const result = analyzeNews(news);
    setLastAlert(result);
    
    if (result !== 'IGNORAR') {
      processNewAlert(result);
      showToast('Análise concluída e alertas atualizados', 'success');
    } else {
      showToast('Notícia ignorada pelo terminal', 'info');
    }
  };

  const handleSelectCrypto = (ticker, price) => {
    setActiveTicker(ticker);
    setActiveTickerPrice(price);
    setTimeout(() => {
      document.querySelector('.trading-panel')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
    showToast(`Ativo ${ticker} selecionado`, 'success');
  };

  const handleTrade = (type) => {
    if (type === 'CLOSE') {
      const pos = positions.find(p => p.ticker === activeTicker);
      if (!pos) {
        showToast('Nenhuma posição ativa para fechar', 'warning');
        return;
      }
      
      const profit = (pos.pl / 100) * 1000; // Simulating $1000 lot size
      const newBalance = balance + profit;
      const updatedPositions = positions.filter(p => p.ticker !== activeTicker);
      
      setBalance(newBalance);
      setPositions(updatedPositions);
      
      localStorage.setItem('mercado_mg_balance', newBalance.toString());
      localStorage.setItem('mercado_mg_positions', JSON.stringify(updatedPositions));
      showToast(`Posição ${activeTicker} fechada`, 'success');
      return;
    }

    if (!activeTicker) {
      showToast('Selecione um ativo antes de operar', 'warning');
      return;
    }

    const newPosition = {
      ticker: activeTicker,
      type: type,
      entryPrice: activeTickerPrice,
      currentPrice: activeTickerPrice,
      pl: 0,
      timestamp: Date.now()
    };

    const updatedPositions = [...positions, newPosition];
    setPositions(updatedPositions);
    localStorage.setItem('mercado_mg_positions', JSON.stringify(updatedPositions));
    showToast(`${type === 'BUY' ? 'Compra' : 'Venda'} em ${activeTicker} registrada`, 'success');
  };

  return (
    <div className={`dashboard regime-${marketRegime.toLowerCase()}`}>
      <Header 
        isMuted={isMuted} 
        toggleMute={toggleMute} 
        correlation={correlation}
        marketRegime={marketRegime}
        onLogout={onLogout}
        balance={balance}
        view={view}
        setView={setView}
      />
      {toast && (
        <div className={`toast-notification ${toast.type}`} role="status" aria-live="polite">
          {toast.message}
        </div>
      )}
      {view === 'market' && (
        <div className="globe-bg animate-fade-in">
          <img src="/fundo.jpg" alt="Background" />
          <div className="globe-overlay"></div>
        </div>
      )}
      
      <main className="main-content container relative-z">
        {view === 'market' ? (
          <div className="market-view animate-fade-in" style={{ animationDuration: '0.5s' }}>
            <div className="page-header" style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', background: 'rgba(22, 27, 34, 0.4)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '0.75rem', background: 'rgba(88, 166, 255, 0.1)', borderRadius: '12px', color: 'var(--accent-blue)' }}>
                  <Activity size={28} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.6rem', fontWeight: '800', margin: 0, textTransform: 'uppercase', letterSpacing: '-0.5px' }}>Terminal de Macro Análise</h2>
                  <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>Monitoramento de sentimento global, eventos econômicos e fluxo de capital em tempo real.</p>
                </div>
              </div>
              <div className="live-feed-banner">
                <span
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.25rem 0.6rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700,
                    background: liveFeedSource === 'Feed Simulado' ? 'rgba(251,191,36,0.12)' : 'rgba(0,255,136,0.10)',
                    border: `1px solid ${liveFeedSource === 'Feed Simulado' ? 'rgba(251,191,36,0.35)' : 'rgba(0,255,136,0.35)'}`,
                    color: liveFeedSource === 'Feed Simulado' ? '#fbbf24' : '#00ff88',
                  }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor', display: 'inline-block', animation: 'pulse 2s infinite' }}></span>
                  {liveFeedSource === 'Feed Simulado' ? 'SIMULADO' : 'AO VIVO'}
                </span>
                <strong style={{ fontSize: '0.8rem' }}>{liveFeedSource}</strong>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Atualiza a cada 25s</span>
              </div>
              <div className="market-data-banner">
                <span>USD/BRL: <strong>{macroSnapshot.rateUSD ? macroSnapshot.rateUSD.toFixed(4) : '--'}</strong></span>
                <span>BITCOIN: <strong>{macroSnapshot.btcPrice ? `$${macroSnapshot.btcPrice.toFixed(2)}` : '--'}</strong></span>
                <span>Fonte: <strong>{macroSnapshot.source}</strong></span>
              </div>
            </div>

            {lastAlert && lastAlert !== 'IGNORAR' && (
              <MarketPulse
                lastAlert={lastAlert}
                correlation={correlation}
                marketRegime={marketRegime}
                currentWin={winPrice}
                currentDolar={dolarPrice}
              />
            )}

            <WinAnalysis currentWin={winPrice} currentDolar={dolarPrice} onSignal={setMacroSignal} />

            <SignalPanel macroSignal={macroSignal} lastAlert={lastAlert} />

            <TradingViewCharts />
            <div className="layout-grid">
              <div className="left-panel">
                <NewsInput 
                  news={news} 
                  setNews={setNews} 
                  onAnalyze={handleAnalyze} 
                />
                {lastAlert === 'IGNORAR' && (
                  <div className="status-badge ignore-badge">IGNORAR</div>
                )}
                {lastAlert && lastAlert !== 'IGNORAR' && (
                  <MacroAlert alert={lastAlert} />
                )}
                <EconomicCalendar />
                <FlowRadar lastAlert={lastAlert} correlation={correlation} />
                <SentimentHeatmap lastAlert={lastAlert} />
                <TradingPanel 
                  balance={balance} 
                  positions={positions} 
                  activeTicker={activeTicker} 
                  activePrice={activeTickerPrice}
                  onTrade={handleTrade}
                  suggestion={lastAlert?.tradeReading}
                />
                <RiskCalculator />
                <CryptoScanner
                  lastAlert={lastAlert}
                  activeTicker={activeTicker}
                  onSelectCrypto={handleSelectCrypto}
                />
              </div>
              <div className="right-panel">
                <History history={history} />
              </div>
            </div>
          </div>
        ) : view === 'simulator' ? (
          <div className="simulation-view animate-fade-in" style={{ animationDuration: '0.5s' }}>
            <div className="page-header" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(22, 27, 34, 0.4)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
               <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', color: 'var(--primary)' }}>
                 <TrendingUp size={28} />
               </div>
               <div>
                 <h2 style={{ fontSize: '1.6rem', fontWeight: '800', margin: 0, textTransform: 'uppercase', letterSpacing: '-0.5px' }}>Simulador de Crescimento (Yield)</h2>
                 <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>Projeções matemáticas de longo prazo baseadas em dividendos e efeito bola de neve.</p>
               </div>
            </div>

             <div className="dashboard-grid" style={{ 
              display: 'grid', 
              gridTemplateColumns: 'minmax(350px, 400px) 1fr', 
              gap: '2rem', 
              marginBottom: '2rem' 
            }}>
              <YieldSimulator 
                onUpdate={setYgChartData}
                initialInvestment={initialInvestment}
                setInitialInvestment={setInitialInvestment}
                monthlyContribution={monthlyContribution}
                setMonthlyContribution={setMonthlyContribution}
                expectedYield={expectedYield}
                setExpectedYield={setExpectedYield}
                expectedGrowth={expectedGrowth}
                setExpectedGrowth={setExpectedGrowth}
                years={years}
                setYears={setYears}
              />
              
              <div className="analysis-panels" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div className="glass-panel" style={{ padding: '2rem', flex: 1, minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <TrendingUp color="var(--primary)" />
                      <h3 style={{ fontSize: '1.4rem' }}>Projeção de Longo Prazo</h3>
                    </div>
                  </div>
                  
                  <div style={{ flex: 1, position: 'relative' }}>
                    <ResultCharts data={ygChartData} />
                  </div>
                </div>

                <div className="insights-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                      <PieChart color="var(--accent)" size={20} />
                      <h3 style={{ fontSize: '1.1rem' }}>Efeito Snowball</h3>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      A rentabilidade real sobre o valor investido cresce exponencialmente com o tempo.
                    </p>
                  </div>

                  <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                      <Activity color="var(--primary)" size={20} />
                      <h3 style={{ fontSize: '1.1rem' }}>Consistência</h3>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      Aportes mensais são o motor da sua independência financeira.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <StockInsights onInject={handleInjectAsset} />
          </div>
        ) : view === 'opportunities' ? (
          <div className="opportunities-view animate-fade-in" style={{ animationDuration: '0.5s' }}>
            <div className="page-header" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(22, 27, 34, 0.4)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              <div style={{ padding: '0.75rem', background: 'rgba(124,58,237,0.12)', borderRadius: '12px', color: '#a855f7' }}>
                <Zap size={28} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: '800', margin: 0, textTransform: 'uppercase', letterSpacing: '-0.5px' }}>Buscador de Oportunidades</h2>
                <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>Varredura em tempo real de todas as moedas, criptos, ações e commodities do mercado global.</p>
              </div>
            </div>
            <OpportunityScanner />
          </div>
        ) : null}
      </main>

      <style jsx="true">{`
        .dashboard {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding-bottom: 2rem;
          transition: background-color 0.5s;
        }

        .regime-corr_anomaly {
          background: radial-gradient(circle at top right, rgba(239, 68, 68, 0.05), transparent);
        }

        .regime-trending {
          background: radial-gradient(circle at top right, rgba(16, 185, 129, 0.05), transparent);
        }

        .relative-z {
          position: relative;
          z-index: 10;
        }

        .globe-bg {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: 0;
          overflow: hidden;
          pointer-events: none;
        }

        .globe-bg img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.5;
          mix-blend-mode: normal;
        }

        .globe-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(10, 12, 16, 0.5) 0%, var(--bg-primary) 100%);
        }

        .main-content {
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          padding: 1.5rem;
        }

        .layout-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 1rem;
        }

        .market-direction-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 1rem 1.25rem;
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.18);
          border-radius: 14px;
          margin-bottom: 1.5rem;
        }

        .banner-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          color: var(--text-muted);
          letter-spacing: 0.08em;
          margin-bottom: 0.25rem;
        }

        .banner-value {
          font-size: 1.1rem;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .banner-detail {
          font-size: 0.85rem;
          color: var(--text-muted);
          opacity: 0.92;
        }

        .status-badge {
          margin-top: 1rem;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          font-weight: 600;
          text-align: center;
          font-family: var(--font-mono);
          letter-spacing: 1px;
        }

        .ignore-badge {
          background: rgba(110, 118, 129, 0.1);
          color: var(--text-muted);
          border: 1px dashed var(--border-color);
        }

        .live-feed-banner,
        .market-data-banner {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          align-items: center;
          border-radius: 12px;
          padding: 0.85rem 1rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(148, 163, 184, 0.12);
          color: var(--text-muted);
          font-size: 0.85rem;
        }

        .live-feed-banner strong,
        .market-data-banner strong {
          color: var(--text-primary);
        }

        .market-data-banner {
          justify-content: flex-start;
          gap: 1.5rem;
        }

        .market-data-banner span:first-child {
          font-weight: 700;
          color: var(--text-primary);
        }

        @media (max-width: 900px) {
          .layout-grid {
            grid-template-columns: 1fr;
          }
        }

        .toast-notification {
          position: fixed;
          top: 84px;
          right: 1.5rem;
          z-index: 120;
          padding: 0.95rem 1.2rem;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.95);
          color: #fff;
          font-size: 0.9rem;
          font-weight: 600;
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 18px 45px rgba(0, 0, 0, 0.25);
          backdrop-filter: blur(10px);
          animation: toastIn 0.2s ease-out forwards;
        }

        .toast-notification.info { border-color: rgba(56, 189, 248, 0.3); }
        .toast-notification.success { border-color: rgba(16, 185, 129, 0.3); }
        .toast-notification.warning { border-color: rgba(234, 179, 8, 0.3); }
        .toast-notification.error { border-color: rgba(248, 81, 73, 0.3); }

        @keyframes toastIn {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;

