import React, { useState, useEffect, useCallback } from 'react';
import { fetchBrazilianStockPrice, fetchBrazilianStocksBatch } from '../data/connectors';

const CryptoScanner = ({ lastAlert, activeTicker, onSelectCrypto }) => {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchTicker, setSearchTicker] = useState('');

  const gems = [
    { ticker: 'FET', name: 'Fetch.ai', sector: 'AI', price: 2.45, change: '+12.4%', risk: 'Alto' },
    { ticker: 'RNDR', name: 'Render', sector: 'AI', price: 10.12, change: '+5.2%', risk: 'Médio' },
    { ticker: 'ONDO', name: 'Ondo Finance', sector: 'RWA', price: 0.78, change: '+8.1%', risk: 'Médio' },
    { ticker: 'PEPE', name: 'Pepe', sector: 'MEME', price: 0.0000084, change: '+24.5%', risk: 'Extremo' },
    { ticker: 'SOL', name: 'Solana', sector: 'L1', price: 174.20, change: '+3.2%', risk: 'Baixo' },
    { ticker: 'PETR4', name: 'Petrobras', sector: 'BR', price: 31.42, change: '+1.8%', risk: 'Médio' },
    { ticker: 'VALE3', name: 'Vale', sector: 'BR', price: 78.33, change: '-0.6%', risk: 'Médio' },
    { ticker: 'ITUB4', name: 'Itaú', sector: 'BR', price: 27.12, change: '+0.9%', risk: 'Baixo' },
    { ticker: 'MGLU3', name: 'Magazine Luiza', sector: 'BR', price: 5.80, change: '+4.1%', risk: 'Alto' },
  ];

  const tickerToGeckoId = {
    FET: 'fetch-ai',
    RNDR: 'render-token',
    ONDO: 'ondo-finance',
    PEPE: 'pepe',
    SOL: 'solana',
  };

  const filterButtons = [
    { label: 'Tudo', value: 'ALL' },
    { label: 'AI', value: 'AI' },
    { label: 'RWA', value: 'RWA' },
    { label: 'MEME', value: 'MEME' },
  ];

  // State declarations at the top, before any functions that use them
  const [prices, setPrices] = useState(() => Object.fromEntries(gems.map((gem) => [gem.ticker, gem.price])));
  const [loadingTicker, setLoadingTicker] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLoadBRStocks = useCallback(async () => {
    setErrorMessage('');
    setLoadingTicker('BR_BATCH');
    try {
      const result = await fetchBrazilianStocksBatch(['PETR4', 'VALE3', 'ITUB4', 'MGLU3', 'BBDC4', 'BBAS3']);
      const newPrices = {};
      result.stocks.forEach((stock) => {
        newPrices[stock.ticker] = stock.price;
      });
      setPrices((prev) => ({ ...prev, ...newPrices }));
      setActiveFilter('BR');
    } catch (error) {
      console.error('Erro ao carregar ações brasileiras:', error);
      setErrorMessage('Erro ao carregar ações brasileiras. Tente novamente.');
    } finally {
      setLoadingTicker(null);
    }
  }, []);

  const handleSearchTicker = async () => {
    const ticker = searchTicker.trim().toUpperCase();
    if (!ticker) return;

    setErrorMessage('');
    setLoadingTicker(ticker);

    try {
      const stock = await fetchBrazilianStockPrice(ticker);
      if (!stock) {
        setErrorMessage(`Ticker ${ticker} não encontrado`);
        setLoadingTicker(null);
        return;
      }

      setPrices((prev) => ({ ...prev, [ticker]: stock.price }));
      setActiveFilter('BR');
      setSearchTicker('');
      onSelectCrypto?.(ticker, stock.price);
    } catch (error) {
      console.error('Erro ao buscar ação:', error);
      setErrorMessage(`Erro ao buscar ${ticker}. Verifique o ticker e tente novamente.`);
    } finally {
      setLoadingTicker(null);
    }
  };

  const fetchRealTimePrice = async (ticker) => {
    const id = tickerToGeckoId[ticker];
    if (!id) return;

    setErrorMessage('');
    setLoadingTicker(ticker);

    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`
      );
      const data = await response.json();
      const newPrice = data[id]?.usd;

      if (typeof newPrice !== 'number') {
        throw new Error('Preço não encontrado');
      }

      setPrices((prev) => ({ ...prev, [ticker]: newPrice }));
    } catch (error) {
      console.error('Erro ao buscar preço real:', error);
      setErrorMessage(`Erro ao buscar ${ticker}. Tente novamente.`);
    } finally {
      setLoadingTicker(null);
    }
  };

  const fetchAllPrices = async () => {
    setErrorMessage('');
    setLoadingTicker('ALL');

    try {
      const ids = Object.values(tickerToGeckoId).join(',');
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`
      );
      const data = await response.json();
      const nextPrices = {};

      gems.forEach((gem) => {
        const id = tickerToGeckoId[gem.ticker];
        const price = data[id]?.usd;
        if (typeof price === 'number') {
          nextPrices[gem.ticker] = price;
        }
      });

      if (Object.keys(nextPrices).length === 0) {
        throw new Error('Nenhum preço encontrado');
      }

      setPrices((prev) => ({ ...prev, ...nextPrices }));
    } catch (error) {
      console.error('Erro ao atualizar todos os preços:', error);
      setErrorMessage('Erro ao atualizar todos os preços. Tente novamente.');
    } finally {
      setLoadingTicker(null);
    }
  };

  useEffect(() => {
    handleLoadBRStocks();
  }, [handleLoadBRStocks]);

  const getSentimentColor = (gem) => {
    if (!lastAlert || lastAlert === 'IGNORAR') return 'var(--text-muted)';
    if (lastAlert.sector === gem.sector && lastAlert.impact.crypto === 'Alta') return 'var(--accent-green)';
    if (lastAlert.impact.crypto === 'Alta' && gem.ticker === 'SOL') return 'var(--accent-green)';
    return 'var(--text-muted)';
  };

  const filteredGems = gems.filter(
    (gem) => activeFilter === 'ALL' || gem.sector === activeFilter
  );

  return (
    <div className="crypto-scanner glass animate-fade-in">
      <div className="scanner-header">
        <div className="title-group">
          <span className="icon">💎</span>
          <h4 className="title">Crypto Alpha Scanner</h4>
        </div>
        <div className="scanner-actions">
          <div className="scanner-buttons">
            {filterButtons.map((button) => (
              <button
                key={button.value}
                type="button"
                className={`filter-btn ${activeFilter === button.value ? 'active' : ''}`}
                onClick={() => setActiveFilter(button.value)}
              >
                {button.label}
              </button>
            ))}
          </div>
          <div className="search-group">
            <input
              type="text"
              value={searchTicker}
              onChange={(e) => setSearchTicker(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchTicker()}
              placeholder="Buscar ação BR"
            />
            <button type="button" className="search-btn" onClick={handleSearchTicker} disabled={!!loadingTicker}>
              {loadingTicker === searchTicker.trim().toUpperCase() && searchTicker ? 'Buscando...' : 'Buscar'}
            </button>
            <button type="button" className="load-br-btn" onClick={handleLoadBRStocks} disabled={loadingTicker === 'BR_BATCH'}>
              {loadingTicker === 'BR_BATCH' ? 'Carregando...' : 'Carregar BR'}
            </button>
          </div>
          <button type="button" className="update-all-btn" onClick={fetchAllPrices} disabled={loadingTicker === 'ALL'}>
            {loadingTicker === 'ALL' ? '⟳ Atualizando...' : '⟳ Atualizar'}
          </button>
        </div>
        <div className="status-indicator">
          <span className="pulse"></span> LIVE ALPHA
        </div>
      </div>
      <div className="gems-grid">
        {filteredGems.map((gem) => (
          <div key={gem.ticker} className={`gem-card ${activeTicker === gem.ticker ? 'active' : ''}`}>
            <div className="gem-main">
              <span className="gem-ticker" style={{ color: getSentimentColor(gem) }}>${gem.ticker}</span>
              <span className="gem-sector badge">{gem.sector}</span>
            </div>
            <div className="gem-details font-mono">
              <div className="gem-price">${prices[gem.ticker] < 0.01 ? prices[gem.ticker].toFixed(8) : prices[gem.ticker]?.toFixed(2)}</div>
              <div className={`gem-change ${gem.change.startsWith('+') ? 'text-green' : 'text-red'}`}>
                {gem.change}
              </div>
            </div>
            <div className="gem-footer">
              <span className={`risk-label risk-${gem.risk.toLowerCase()}`}>Risco: {gem.risk}</span>
              {lastAlert?.sector === gem.sector && (
                <span className="alert-tag">SENTIMENT MATCH</span>
              )}
              <div className="gem-actions">
                <button
                  className="fetch-price-btn"
                  onClick={() => fetchRealTimePrice(gem.ticker)}
                  disabled={loadingTicker === gem.ticker}
                >
                  {loadingTicker === gem.ticker ? 'Buscando...' : 'Preço real'}
                </button>
                <button
                  className="trade-action-btn"
                  onClick={() => onSelectCrypto && onSelectCrypto(gem.ticker, prices[gem.ticker])}
                >
                  Ir para Trade
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {errorMessage && <div className="fetch-error">{errorMessage}</div>}

      <style jsx="true">{`
        .crypto-scanner {
          margin-top: 1rem;
          padding: 1rem;
          background: linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(0, 0, 0, 0.4) 100%);
          border: 1px solid rgba(168, 85, 247, 0.3);
          border-radius: 8px;
        }

        .scanner-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .title-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .title {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: #a855f7;
          margin: 0;
          font-weight: 800;
        }

        .pulse {
          width: 6px;
          height: 6px;
          background: #a855f7;
          border-radius: 50%;
          box-shadow: 0 0 10px #a855f7;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(168, 85, 247, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(168, 85, 247, 0); }
        }

        .scanner-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .scanner-buttons {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          flex-wrap: wrap;
        }

        .search-group {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 999px;
          padding: 0.25rem 0.35rem;
        }

        .search-group input {
          width: 120px;
          background: transparent;
          border: none;
          color: var(--text-primary);
          padding: 0.35rem 0.45rem;
          font-size: 0.72rem;
          outline: none;
        }

        .search-group input::placeholder {
          color: var(--text-muted);
        }

        .search-btn {
          border: none;
          background: linear-gradient(135deg, #a855f7, #7c3aed);
          color: white;
          padding: 0.35rem 0.7rem;
          border-radius: 999px;
          font-size: 0.7rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 0 10px rgba(168, 85, 247, 0.3);
        }

        .search-btn:hover:not(:disabled) {
          box-shadow: 0 0 18px rgba(168, 85, 247, 0.6);
          transform: translateY(-1px);
        }

        .search-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .load-br-btn {
          border: none;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          padding: 0.35rem 0.7rem;
          border-radius: 999px;
          font-size: 0.7rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
        }

        .load-br-btn:hover:not(:disabled) {
          box-shadow: 0 0 18px rgba(16, 185, 129, 0.6);
          transform: translateY(-1px);
        }

        .load-br-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .update-all-btn {
          border: 1px solid rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.06);
          color: var(--text-secondary);
          padding: 0.35rem 0.7rem;
          border-radius: 999px;
          font-size: 0.7rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .update-all-btn:hover:not(:disabled) {
          background: rgba(255,255,255,0.12);
          color: var(--text-primary);
        }

        .update-all-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .filter-btn {
          padding: 0.5rem 0.8rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-secondary);
          font-size: 0.72rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .filter-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-primary);
        }

        .filter-btn.active {
          background: linear-gradient(135deg, #a855f7, #7c3aed);
          color: white;
          border-color: rgba(168, 85, 247, 0.8);
          box-shadow: 0 0 15px rgba(168, 85, 247, 0.4);
        }

        .status-indicator {
          font-size: 0.6rem;
          font-weight: 700;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .gems-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 0.75rem;
        }

        .gem-card {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 0.75rem;
          border-radius: 6px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .gem-card:hover {
          border-color: rgba(168, 85, 247, 0.5);
          transform: translateY(-2px);
          background: rgba(168, 85, 247, 0.05);
          box-shadow: 0 4px 20px rgba(168, 85, 247, 0.15);
        }

        .gem-main {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .gem-ticker { font-weight: 800; font-size: 0.9rem; letter-spacing: -0.5px; }

        .badge {
          font-size: 0.55rem;
          padding: 1px 4px;
          border-radius: 3px;
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-muted);
        }

        .gem-details {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 0.5rem;
        }

        .gem-price { font-size: 0.8rem; font-weight: 600; }
        .gem-change { font-size: 0.65rem; font-weight: 700; }

        .gem-footer { display: flex; flex-direction: column; gap: 0.5rem; }

        .risk-label { font-size: 0.55rem; font-weight: 600; text-transform: uppercase; }

        .gem-actions { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.25rem; }

        .trade-action-btn {
          padding: 0.35rem 0.6rem;
          border: none;
          border-radius: 4px;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white;
          font-size: 0.65rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 0 8px rgba(34, 197, 94, 0.3);
        }

        .trade-action-btn:hover {
          box-shadow: 0 0 15px rgba(34, 197, 94, 0.5);
          transform: translateY(-1px);
        }

        .gem-card.active {
          border-color: rgba(34, 197, 94, 0.7);
          background: rgba(34, 197, 94, 0.08);
          box-shadow: 0 0 20px rgba(34, 197, 94, 0.15);
        }

        .fetch-price-btn {
          padding: 0.35rem 0.6rem;
          border: none;
          border-radius: 4px;
          background: linear-gradient(135deg, #a855f7, #7c3aed);
          color: white;
          font-size: 0.65rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .fetch-price-btn:hover:not(:disabled) {
          box-shadow: 0 0 12px rgba(168, 85, 247, 0.5);
          transform: translateY(-1px);
        }

        .fetch-price-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .fetch-error {
          margin-top: 1rem;
          padding: 0.65rem 0.8rem;
          background: rgba(255, 85, 85, 0.12);
          color: #ffcccc;
          border: 1px solid rgba(255, 85, 85, 0.25);
          border-radius: 6px;
          font-size: 0.8rem;
        }

        .risk-extremo { color: #ff0055; }
        .risk-alto { color: #ff8800; }
        .risk-médio { color: #ffcc00; }
        .risk-baixo { color: #00ff88; }

        .alert-tag {
          font-size: 0.5rem;
          background: var(--accent-green);
          color: black;
          padding: 1px 4px;
          border-radius: 2px;
          font-weight: 900;
          text-align: center;
          animation: blink 1s infinite;
        }

        @keyframes blink { 50% { opacity: 0.5; } }

        @media (max-width: 500px) {
          .gems-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </div>
  );
};

export default CryptoScanner;
