import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import MacroAlert from './MacroAlert';
import History from './History';
import NewsFeed from './NewsFeed';
import OpportunityScanner from './OpportunityScanner';
import WinAnalysis from './WinAnalysis';
import SignalPanel from './SignalPanel';
import DayDirection from './DayDirection';
import MarketCharts from './MarketCharts';
import TradeGuide from './TradeGuide';
import ResumoGeral from './ResumoGeral';
import TechAnalysisBot from './TechAnalysisBot';
import BankPositions from './BankPositions';
import BrokerConfig from './BrokerConfig';
import DailyReport from './DailyReport';
import YieldSimulator from './YieldSimulator';
import { Activity, Zap } from 'lucide-react';
import { analyzeNews } from '../utils/MacroRules';
import { startNewsFeed } from '../utils/NewsFetcher';
import { fetchExchangeRates, fetchBitcoinPrice } from '../data/connectors';
import { scanRealOpportunities } from '../utils/OpportunityScan';
import { fetchBTC24h, fetchSPFutures, fetchYahooQuote, fetchUsdBrl, computeCryptoScore, toCryptoDir } from '../utils/MarketStatus';
import { computeMacroScore } from '../utils/MacroScore';

// ── Pesquisa de ativos para simulação ────────────────────────────────────────
const PROXIES = [
  url => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  url => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  url => `https://thingproxy.freeboard.io/fetch/${url}`,
];

const SIM_SUGGESTIONS = [
  // Ações
  { ticker: 'PETR4.SA', label: 'Petrobras', cat: 'acao' }, { ticker: 'VALE3.SA', label: 'Vale', cat: 'acao' },
  { ticker: 'ITUB4.SA', label: 'Itaú', cat: 'acao' }, { ticker: 'WEGE3.SA', label: 'WEG', cat: 'acao' },
  { ticker: 'TAEE11.SA', label: 'Taesa', cat: 'acao' },
  // FIIs
  { ticker: 'HGLG11.SA', label: 'HGLG11', cat: 'fii' }, { ticker: 'MXRF11.SA', label: 'MXRF11', cat: 'fii' },
  { ticker: 'KNRI11.SA', label: 'KNRI11', cat: 'fii' }, { ticker: 'XPML11.SA', label: 'XPML11', cat: 'fii' },
  { ticker: 'VISC11.SA', label: 'VISC11', cat: 'fii' }, { ticker: 'HGBS11.SA', label: 'HGBS11', cat: 'fii' },
  { ticker: 'BCFF11.SA', label: 'BCFF11', cat: 'fii' }, { ticker: 'RECR11.SA', label: 'RECR11', cat: 'fii' },
  // ETFs e Internacional
  { ticker: 'IVVB11.SA', label: 'S&P500 BR', cat: 'etf' }, { ticker: 'BOVA11.SA', label: 'IBOV', cat: 'etf' },
  { ticker: 'AAPL', label: 'Apple', cat: 'int' }, { ticker: 'MSFT', label: 'Microsoft', cat: 'int' },
  // Cripto
  { ticker: 'BTC-USD', label: 'Bitcoin', cat: 'cripto' }, { ticker: 'ETH-USD', label: 'Ethereum', cat: 'cripto' },
];

const SimSearchBar = ({ onSelect }) => {
  const [query, setQuery] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState(null);
  const [error, setError]   = React.useState(null);

  const search = async (ticker) => {
    const t = (ticker || query).trim().toUpperCase();
    if (!t) return;
    setLoading(true); setError(null); setResult(null);

    const symbol = t.match(/^\d/) || t.endsWith('.SA') || t.includes('-') ? t : t + '.SA';
    const isFII = /^\w+11(\.SA)?$/i.test(symbol);
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=5y&interval=1mo&includePrePost=false&events=div`;

    for (const proxy of PROXIES) {
      try {
        const r = await fetch(proxy(url), { cache: 'no-store', signal: AbortSignal.timeout(10000) });
        if (!r.ok) continue;
        const j = await r.json();
        const res = j?.chart?.result?.[0];
        if (!res) continue;

        const meta = res.meta;
        const closes = res.indicators.quote[0].close.filter(c => c != null);
        if (closes.length < 12) throw new Error('Dados insuficientes');

        const first = closes[0];
        const last = closes[closes.length - 1];
        const years = closes.length / 12;
        const totalReturn = (last / first - 1) * 100;
        const annualReturn = (Math.pow(last / first, 1 / years) - 1) * 100;

        const name = meta.shortName || meta.symbol || symbol;
        const currency = meta.currency || 'BRL';

        // Dividendos
        const divEvents = res.events?.dividends ? Object.values(res.events.dividends) : [];
        const now = Date.now() / 1000;
        const oneYearAgo = now - 365 * 86400;
        const recentDivs = divEvents.filter(d => d.date > oneYearAgo);
        const divAnual = recentDivs.reduce((s, d) => s + d.amount, 0);
        const divMensal = recentDivs.length > 0 ? divAnual / 12 : 0;
        const divYield = last > 0 ? (divAnual / last) * 100 : 0;
        const lastDiv = recentDivs.length > 0 ? recentDivs[recentDivs.length - 1] : null;

        setResult({
          ticker: symbol, name, currency, isFII,
          price: last, first,
          totalReturn: totalReturn.toFixed(1),
          annualReturn: annualReturn.toFixed(1),
          years: years.toFixed(1),
          yield: divYield > 0 ? Math.round(divYield * 10) / 10 : Math.max(0, Math.round(annualReturn * 0.3 * 10) / 10),
          growth: Math.round(annualReturn * 10) / 10,
          divAnual: Math.round(divAnual * 100) / 100,
          divMensal: Math.round(divMensal * 100) / 100,
          divYield: Math.round(divYield * 10) / 10,
          divCount: recentDivs.length,
          lastDivAmount: lastDiv ? lastDiv.amount : null,
          lastDivDate: lastDiv ? new Date(lastDiv.date * 1000).toLocaleDateString('pt-BR') : null,
        });
        setLoading(false);
        return;
      } catch { /* next proxy */ }
    }
    setError('Não encontrado. Tente: PETR4, HGLG11, MXRF11, AAPL, BTC-USD');
    setLoading(false);
  };

  const handleUse = () => {
    if (result && onSelect) onSelect(result);
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg,rgba(8,10,18,.97),rgba(12,16,28,.97))',
      border: '1px solid rgba(249,115,22,.15)', borderRadius: 16, padding: '1.2rem',
      marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '.75rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
        <span style={{ fontSize: '1.3rem' }}>🔍</span>
        <div>
          <div style={{ fontSize: '.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>Pesquisar Ativo</div>
          <div style={{ fontSize: '.58rem', color: 'var(--text-muted)' }}>Ações, FIIs, ETFs, Fundos, Criptos — dados reais dos últimos 5 anos</div>
        </div>
      </div>

      <form onSubmit={e => { e.preventDefault(); search(); }} style={{ display: 'flex', gap: '.4rem' }}>
        <input
          type="text" value={query} onChange={e => setQuery(e.target.value.toUpperCase())}
          placeholder="PETR4, VALE3, AAPL, BTC-USD..."
          style={{
            flex: 1, padding: '.4rem .7rem', borderRadius: 8, fontSize: '.72rem',
            background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.12)',
            color: 'var(--text-primary)', fontFamily: 'var(--font-mono)',
          }}
        />
        <button type="submit" disabled={loading} style={{
          padding: '.4rem .9rem', borderRadius: 8, fontSize: '.68rem', fontWeight: 800,
          background: 'rgba(249,115,22,.12)', border: '1px solid rgba(249,115,22,.4)',
          color: '#f97316', cursor: 'pointer',
        }}>
          {loading ? '⟳' : '🔍 Buscar'}
        </button>
      </form>

      {/* Sugestões por categoria */}
      {[
        { cat: 'fii', label: 'FIIs', color: '#fbbf24' },
        { cat: 'acao', label: 'Ações', color: '#6395ff' },
        { cat: 'etf', label: 'ETFs', color: '#a855f7' },
        { cat: 'int', label: 'Internacional', color: '#60a5fa' },
        { cat: 'cripto', label: 'Cripto', color: '#f0b90b' },
      ].map(grp => (
        <div key={grp.cat} style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '.5rem', fontWeight: 800, color: grp.color, textTransform: 'uppercase', letterSpacing: '.04em', minWidth: 55 }}>{grp.label}</span>
          {SIM_SUGGESTIONS.filter(s => s.cat === grp.cat).map(s => (
            <button key={s.ticker} onClick={() => { setQuery(s.ticker); search(s.ticker); }}
              style={{
                padding: '.2rem .45rem', borderRadius: 6, fontSize: '.55rem', fontWeight: 700,
                background: 'rgba(255,255,255,.04)', border: `1px solid ${grp.color}22`,
                color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all .15s',
              }}>
              {s.label}
            </button>
          ))}
        </div>
      ))}

      {error && <div style={{ fontSize: '.65rem', color: '#ff3355' }}>⚠️ {error}</div>}

      {/* Resultado */}
      {result && (
        <div style={{
          padding: '.85rem', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: '.6rem',
          background: 'rgba(255,255,255,.03)', border: `1px solid ${result.isFII ? 'rgba(251,191,36,.2)' : 'rgba(255,255,255,.08)'}`,
        }}>
          {/* Header: ticker + preço */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <span style={{ fontSize: '.9rem', fontWeight: 900, color: 'var(--text-primary)' }}>{result.ticker.replace('.SA','')}</span>
              <span style={{ fontSize: '.6rem', color: 'var(--text-muted)' }}>{result.name}</span>
              {result.isFII && <span style={{ fontSize: '.5rem', fontWeight: 800, padding: '1px 6px', borderRadius: 4, background: 'rgba(251,191,36,.12)', border: '1px solid rgba(251,191,36,.3)', color: '#fbbf24' }}>FII</span>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '.55rem', color: 'var(--text-muted)' }}>Valor Unitário</div>
              <div style={{ fontSize: '1rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                {result.currency === 'USD' ? '$' : 'R$'} {result.price.toLocaleString(result.currency === 'USD' ? 'en-US' : 'pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Dividendos */}
          {result.divAnual > 0 && (
            <div style={{
              display: 'flex', gap: '.5rem', flexWrap: 'wrap',
              padding: '.6rem', borderRadius: 8,
              background: 'rgba(16,185,129,.06)', border: '1px solid rgba(16,185,129,.15)',
            }}>
              <div style={{ flex: 1, minWidth: 80, textAlign: 'center' }}>
                <div style={{ fontSize: '.48rem', color: '#10b981', textTransform: 'uppercase', fontWeight: 700 }}>Dividendo/mês</div>
                <div style={{ fontSize: '.95rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#00ff88' }}>
                  R$ {result.divMensal.toFixed(2)}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 80, textAlign: 'center' }}>
                <div style={{ fontSize: '.48rem', color: '#10b981', textTransform: 'uppercase', fontWeight: 700 }}>Dividendo/ano</div>
                <div style={{ fontSize: '.95rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#00ff88' }}>
                  R$ {result.divAnual.toFixed(2)}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 80, textAlign: 'center' }}>
                <div style={{ fontSize: '.48rem', color: '#10b981', textTransform: 'uppercase', fontWeight: 700 }}>Dividend Yield</div>
                <div style={{ fontSize: '.95rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#00ff88' }}>
                  {result.divYield}%
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 80, textAlign: 'center' }}>
                <div style={{ fontSize: '.48rem', color: '#10b981', textTransform: 'uppercase', fontWeight: 700 }}>Pagamentos/ano</div>
                <div style={{ fontSize: '.95rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#00ff88' }}>
                  {result.divCount}x
                </div>
              </div>
              {result.lastDivAmount && (
                <div style={{ width: '100%', fontSize: '.58rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  Último: R$ {result.lastDivAmount.toFixed(4)} em {result.lastDivDate}
                </div>
              )}
            </div>
          )}

          {/* Exemplo com 100 cotas */}
          {result.divMensal > 0 && (
            <div style={{
              padding: '.5rem .7rem', borderRadius: 7,
              background: 'rgba(0,0,0,.25)', fontSize: '.65rem', color: 'var(--text-secondary)', lineHeight: 1.6,
            }}>
              💡 <strong>100 cotas</strong> a R$ {result.price.toFixed(2)} = <strong style={{ color: 'var(--text-primary)' }}>R$ {(result.price * 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> investidos
              → recebe <strong style={{ color: '#00ff88' }}>R$ {(result.divMensal * 100).toFixed(2)}/mês</strong> em dividendos
              ({(result.divAnual * 100).toFixed(2)}/ano)
            </div>
          )}

          {/* Performance */}
          <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 80, padding: '.4rem .5rem', borderRadius: 7, background: 'rgba(0,0,0,.2)', textAlign: 'center' }}>
              <div style={{ fontSize: '.48rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Retorno {result.years}a</div>
              <div style={{ fontSize: '.82rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: parseFloat(result.totalReturn) >= 0 ? '#00ff88' : '#ff3355' }}>
                {result.totalReturn}%
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 80, padding: '.4rem .5rem', borderRadius: 7, background: 'rgba(0,0,0,.2)', textAlign: 'center' }}>
              <div style={{ fontSize: '.48rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Retorno Anual</div>
              <div style={{ fontSize: '.82rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: parseFloat(result.annualReturn) >= 0 ? '#00ff88' : '#ff3355' }}>
                {result.annualReturn}%
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 80, padding: '.4rem .5rem', borderRadius: 7, background: 'rgba(0,0,0,.2)', textAlign: 'center' }}>
              <div style={{ fontSize: '.48rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>DY Real</div>
              <div style={{ fontSize: '.82rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#10b981' }}>
                {result.divYield > 0 ? result.divYield + '%' : '—'}
              </div>
            </div>
          </div>

          <button onClick={handleUse} style={{
            padding: '.5rem', borderRadius: 8, fontSize: '.7rem', fontWeight: 800,
            background: 'rgba(16,185,129,.12)', border: '1px solid rgba(16,185,129,.4)',
            color: '#10b981', cursor: 'pointer', width: '100%',
          }}>
            ▶ Usar no Simulador — Yield {result.yield}% · Crescimento {result.growth}%
          </button>
        </div>
      )}
    </div>
  );
};


const REAL_PRICE_STALE_MS = 90000; // se a última cotação real tiver mais que isso, marca como "não ao vivo"

// Hook genérico: busca uma cotação real periodicamente, faz backfill de todo o histórico do
// gráfico na primeira vez que chega (evita salto artificial entre valor simulado e real) e
// marca "ao vivo" só enquanto a última atualização for recente.
const useRealPrice = (fetcher, { field, setPrice, setChartData, round = (n) => n, intervalMs = 30000 }) => {
  const [isLive, setIsLive] = useState(false);
  const lastUpdateRef = useRef(null);

  useEffect(() => {
    let alive = true;
    let backfilled = false;
    const load = () => {
      fetcher().then(q => {
        if (!alive || !q) return;
        const price = round(q.price);
        setPrice?.(price);
        lastUpdateRef.current = Date.now();
        setIsLive(true);
        // A mutação de "backfilled" precisa ficar FORA da função passada a setChartData:
        // em StrictMode o React chama updaters de estado duas vezes pra checar pureza, e uma
        // função impura (que muda uma variável externa) vê valores diferentes em cada chamada.
        const doBackfill = !backfilled;
        backfilled = true;
        setChartData(prev => {
          if (prev.length === 0) return prev;
          if (doBackfill) {
            return prev.map(p => ({ ...p, [field]: price }));
          }
          const next = [...prev];
          next[next.length - 1] = { ...next[next.length - 1], [field]: price };
          return next;
        });
      }).catch(() => {});
    };
    load();
    const t = setInterval(load, intervalMs);
    return () => { alive = false; clearInterval(t); };
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setIsLive(!!lastUpdateRef.current && (Date.now() - lastUpdateRef.current) < REAL_PRICE_STALE_MS);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  return isLive;
};

const Dashboard = ({ onLogout }) => {
  const [lastAlert, setLastAlert] = useState(null);
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('mercado_mg_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [newsFeed, setNewsFeed] = useState(() => {
    const saved = localStorage.getItem('mercado_mg_newsfeed');
    return saved ? JSON.parse(saved) : [];
  });
  const newsFeedRef = useRef([]);
  useEffect(() => { newsFeedRef.current = newsFeed; }, [newsFeed]);
  const [chartData, setChartData] = useState(() => {
    return Array.from({ length: 15 }, (_, i) => {
      const baseWin = 125000 + (Math.random() * 600 - 300);
      const baseDolar = 5.02 + (Math.random() * 0.06 - 0.03);
      const baseBtc = 67000 + (Math.random() * 1200 - 600);
      return {
        time: new Date(Date.now() - (15 - i) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sentiment: 50 + Math.floor(Math.random() * 20 - 10),
        win: Math.floor(baseWin),
        dolar: parseFloat(baseDolar.toFixed(4)),
        btc: Math.floor(baseBtc),
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
  const [marketRegime, setMarketRegime] = useState('NORMAL');
  const [toast, setToast] = useState(null);
  const [macroSignal, setMacroSignal] = useState(null);
  const [searchedAsset, setSearchedAsset] = useState({ key: 'WIN', label: 'WIN Mini', icon: '📊', group: 'futuros' });
  const [searchedAssetResult, setSearchedAssetResult] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [btcChange24h, setBtcChange24h] = useState(null);
  const [spChange, setSpChange] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [globalMacro, setGlobalMacro] = useState(null);
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

  // Simulator states
  const [initialInvestment, setInitialInvestment]     = useState(10000);
  const [monthlyContribution, setMonthlyContribution] = useState(500);
  const [expectedYield, setExpectedYield]              = useState(8);
  const [expectedGrowth, setExpectedGrowth]            = useState(12);
  const [simYears, setSimYears]                        = useState(10);

  // Unified View State
  const [view, setView] = useState('market');


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

  const processNewAlert = useCallback((rawAlert, time) => {
    // Evita empilhar a mesma manchete repetida (o feed às vezes sorteia o mesmo item do lote)
    if (historyRef.current.slice(0, 3).some(h => h.summary === rawAlert.summary)) return;
    const alert = { ...rawAlert, time: time || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) };
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

      // Sentiment
      if (alert.impact.win === 'Alta') newSentiment += 12;
      if (alert.impact.win === 'Queda') newSentiment -= 12;
      newSentiment = Math.max(10, Math.min(90, newSentiment + (Math.random() * 6 - 3)));

      // WIN e Dólar não são mais movidos por notícia — vêm das cotações reais (useRealPrice)
      const updatedWin = last.win;
      const updatedDolar = last.dolar;

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
        btc: last.btc, // herda o BTC atual — sem isso o ponto novo ficava sem valor até o próximo poll real
        activeAssetVal: parseFloat(newActiveVal.toFixed(2)),
        winSignal,
        dolarSignal,
        assetSignal,
        news: alert.summary
      }];

      // Calculate Correlation & Regime
      const corrValue = calculateCorrelation(nextPoints);

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

      // Feed bruto de notícias (tudo que chega, relevante ou não) — dedup contra as últimas 3
      if (!newsFeedRef.current.slice(0, 3).some(n => n.text === incomingNews.text)) {
        const item = {
          text: incomingNews.text,
          source: incomingNews.source || (incomingNews.live ? 'Feed ao vivo' : '⚠️ Offline (simulado)'),
          time: incomingNews.time || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        };
        const nextFeed = [item, ...newsFeedRef.current].slice(0, 30);
        setNewsFeed(nextFeed);
        newsFeedRef.current = nextFeed;
        localStorage.setItem('mercado_mg_newsfeed', JSON.stringify(nextFeed));
      }

      const result = analyzeNews(incomingNews.text);
      if (result !== 'IGNORAR') {
        processNewAlert(result, incomingNews.time);
      }
    });

    return () => stopFeed();
  }, [processNewAlert]);

  // Varredura de oportunidades (cripto/B3/EUA com dado real) para o Guia de Trade
  useEffect(() => {
    let alive = true;
    const scan = () => scanRealOpportunities().then(list => { if (alive) setOpportunities(list); }).catch(() => {});
    scan();
    const t = setInterval(scan, 180000); // a cada 3 min
    return () => { alive = false; clearInterval(t); };
  }, []);

  // Macro Score global (DXY/VIX/Treasury/S&P/Nasdaq/BTC/ETH/Ouro/Petróleo) — alimenta o Guia de Trade
  useEffect(() => {
    let alive = true;
    const load = () => computeMacroScore().then(r => { if (alive) setGlobalMacro(r); }).catch(() => {});
    load();
    const t = setInterval(load, 180000); // a cada 3 min
    return () => { alive = false; clearInterval(t); };
  }, []);

  // BTC 24h + futuros S&P 500 — alimenta o indicador de cripto nos gráficos de preço
  useEffect(() => {
    let alive = true;
    const loadBtc = () => fetchBTC24h().then(d => { if (alive) setBtcChange24h(d.changePct); }).catch(() => {});
    const loadSp = () => fetchSPFutures().then(d => { if (alive) setSpChange(d?.change ?? null); }).catch(() => {});
    loadBtc(); loadSp();
    const t = setInterval(() => { loadBtc(); loadSp(); }, 120000); // a cada 2 min
    return () => { alive = false; clearInterval(t); };
  }, []);

  // WIN, Dólar e BTC reais — mesmas fontes já usadas no ticker superior (Yahoo/Binance).
  // Substituem a simulação: os três gráficos passam a refletir o mercado de verdade.
  const winIsLive   = useRealPrice(() => fetchYahooQuote('^BVSP'),   { field: 'win',   setPrice: setWinPrice,   setChartData, round: Math.round });
  const dolarIsLive = useRealPrice(fetchUsdBrl, { field: 'dolar', setPrice: setDolarPrice, setChartData, round: (n) => parseFloat(n.toFixed(4)) });
  const btcIsLive   = useRealPrice(fetchBTC24h,                       { field: 'btc',   setPrice: null,          setChartData, round: Math.floor });

  // Market Pulse: Pequenas oscilações para manter o dashboard "vivo"
  useEffect(() => {
    const pulse = setInterval(() => {
      setChartData(prev => {
        if (prev.length === 0) return prev;
        const last = { ...prev[prev.length - 1] };

        // WIN, Dólar e BTC não entram mais aqui — vêm das cotações reais (useRealPrice)
        if (activeTicker) {
          last.activeAssetVal = parseFloat((last.activeAssetVal + (Math.random() * 0.2 - 0.1)).toFixed(2));
          setActiveTickerPrice(last.activeAssetVal);
        }

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

  const cryptoScore = computeCryptoScore(btcChange24h, spChange);
  const cryptoDir = toCryptoDir(cryptoScore);
  const cryptoDirection = cryptoDir.op === 'COMPRAR' ? 'COMPRA' : cryptoDir.op === 'VENDER' ? 'VENDA' : 'NEUTRO';

  return (
    <div className={`dashboard regime-${marketRegime.toLowerCase()}`}>
      <Sidebar view={view} setView={setView} mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="dashboard-main">
        <Header
          isMuted={isMuted}
          toggleMute={toggleMute}
          onLogout={onLogout}
          onMenuClick={() => setSidebarOpen(v => !v)}
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
        {view === 'resumo' ? (
          <ResumoGeral globalMacro={globalMacro} />
        ) : view === 'market' ? (
          <div className="market-view animate-fade-in" style={{ animationDuration: '0.5s' }}>

            <DayDirection macroSignal={macroSignal} lastAlert={lastAlert} asset={searchedAsset} assetResult={searchedAssetResult} />

            <WinAnalysis currentWin={winPrice} currentDolar={dolarPrice} onSignal={setMacroSignal} lastAlert={lastAlert} asset={searchedAsset} />

            <TradeGuide macroSignal={macroSignal} lastAlert={lastAlert} winPrice={winPrice} dolarPrice={dolarPrice} asset={searchedAsset} assetResult={searchedAssetResult} opportunities={opportunities} globalMacro={globalMacro} />

            <TechAnalysisBot onAssetChange={setSearchedAsset} onResult={setSearchedAssetResult} />

            <BankPositions macroSignal={macroSignal} asset={searchedAsset} />

            <SignalPanel macroSignal={macroSignal} lastAlert={lastAlert} />
          </div>
        ) : view === 'charts' ? (
          <div className="charts-view animate-fade-in" style={{ animationDuration: '0.5s' }}>
            <MarketCharts
              data={chartData}
              currentWin={winPrice}
              currentDolar={dolarPrice}
              currentBtc={chartData[chartData.length - 1]?.btc}
              direction={macroSignal?.direction}
              cryptoDirection={cryptoDirection}
              winIsLive={winIsLive}
              dolarIsLive={dolarIsLive}
              btcIsLive={btcIsLive}
            />
          </div>
        ) : view === 'news' ? (
          <div className="news-view animate-fade-in" style={{ animationDuration: '0.5s' }}>
            <div className="layout-grid">
              <div className="left-panel">
                <NewsFeed items={newsFeed} />
              </div>
              <div className="right-panel">
                {lastAlert === 'IGNORAR' && (
                  <div className="status-badge ignore-badge">IGNORAR</div>
                )}
                {lastAlert && lastAlert !== 'IGNORAR' && (
                  <MacroAlert alert={lastAlert} />
                )}
                <History history={history} />
              </div>
            </div>
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
        ) : view === 'simulator' ? (
          <div className="animate-fade-in" style={{ animationDuration: '0.4s', padding: '1.5rem 0' }}>
            <SimSearchBar
              onSelect={(stock) => {
                setExpectedYield(stock.yield);
                setExpectedGrowth(stock.growth);
              }}
            />
            <YieldSimulator
              onUpdate={() => {}}
              initialInvestment={initialInvestment} setInitialInvestment={setInitialInvestment}
              monthlyContribution={monthlyContribution} setMonthlyContribution={setMonthlyContribution}
              expectedYield={expectedYield} setExpectedYield={setExpectedYield}
              expectedGrowth={expectedGrowth} setExpectedGrowth={setExpectedGrowth}
              years={simYears} setYears={setSimYears}
            />
          </div>
        ) : view === 'report' ? (
          <div className="animate-fade-in" style={{ animationDuration: '0.4s', maxWidth: 900, margin: '0 auto', padding: '1.5rem 0' }}>
            <DailyReport asset={searchedAsset} assetResult={searchedAssetResult} />
          </div>
        ) : view === 'config' ? (
          <div className="animate-fade-in" style={{ animationDuration: '0.4s', maxWidth: 720, margin: '0 auto', padding: '1.5rem 0' }}>
            <BrokerConfig />
          </div>
        ) : null}
        </main>
      </div>

      <style jsx="true">{`
        .dashboard {
          flex: 1;
          display: flex;
          flex-direction: row;
          align-items: stretch;
          min-height: 100vh;
          transition: background-color 0.5s;
        }

        .dashboard-main {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          padding-bottom: 2rem;
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

