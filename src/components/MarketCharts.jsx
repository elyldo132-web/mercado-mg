import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  AreaChart,
  Area,
  ComposedChart,
  Bar
} from 'recharts';



const SignalDot = (props) => {
  const { cx, cy, payload, signalType } = props;
  const signal = payload[signalType];

  if (!signal) return null;

  if (signal === 'buy') {
    return (
      <g transform={`translate(${cx - 6},${cy - 12})`}>
        <path d="M6 0 L12 10 L0 10 Z" fill="var(--accent-green)" />
        <circle cx="6" cy="5" r="8" fill="var(--accent-green)" fillOpacity="0.2" />
      </g>
    );
  }
  if (signal === 'sell') {
    return (
      <g transform={`translate(${cx - 6},${cy + 2})`}>
        <path d="M0 0 L12 0 L6 10 Z" fill="var(--accent-red)" />
        <circle cx="6" cy="5" r="8" fill="var(--accent-red)" fillOpacity="0.2" />
      </g>
    );
  }
  return null;
};

const CustomTooltip = ({ active, payload, suffix = "" }) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="custom-tooltip glass">
        <p className="label font-mono">{`${item.time}`}</p>
        <p className="val">Fechamento: <span className="text-blue">{item.close ? item.close : payload[0].value}{suffix}</span></p>
        {item.open && (
          <div className="ohlc-data font-mono">
            <div>O: {item.open}</div>
            <div>H: {item.high}</div>
            <div>L: {item.low}</div>
            <div>C: {item.close}</div>
          </div>
        )}
        {item.news && <p className="news-desc text-muted">{item.news}</p>}
        <style jsx="true">{`
          .custom-tooltip {
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            padding: 0.75rem;
            border-radius: 8px;
            max-width: 180px;
            font-size: 0.75rem;
            z-index: 100;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
          }
          .label { margin-bottom: 4px; border-bottom: 1px solid var(--border-color); padding-bottom: 4px; }
          .news-desc { margin-top: 6px; line-height: 1.2; font-style: italic; font-size: 0.7rem; color: #a8b2bd; }
          .ohlc-data { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-top: 4px; font-size: 0.65rem; color: #8b949e; }
        `}</style>
      </div>
    );
  }
  return null;
};

const MarketCharts = ({ data, currentWin, currentDolar, currentBtc, direction, cryptoDirection }) => {
  // Cor do WIN segue o sentimento consolidado; DOL segue invertido (dólar sobe quando bolsa cai)
  const winColor = direction === 'COMPRA' ? '#00ff88' : direction === 'VENDA' ? '#ff3355' : '#00f5d4';
  const dolColor = direction === 'COMPRA' ? '#ff3355' : direction === 'VENDA' ? '#00ff88' : 'var(--accent-gold)';

  // Acende Compra/Venda na legenda conforme o sinal direcional atual (DOL invertido em relação ao WIN)
  const winLit = direction === 'COMPRA' ? 'buy' : direction === 'VENDA' ? 'sell' : null;
  const dolLit = direction === 'COMPRA' ? 'sell' : direction === 'VENDA' ? 'buy' : null;

  // Cripto segue o sinal de risco-on/off (modo 24h) — mesmo cálculo da Diretriz do Dia
  const btcColor = cryptoDirection === 'COMPRA' ? '#00ff88' : cryptoDirection === 'VENDA' ? '#ff3355' : '#f7931a';
  const btcLit = cryptoDirection === 'COMPRA' ? 'buy' : cryptoDirection === 'VENDA' ? 'sell' : null;
  
  const calculateChange = (key) => {
    if (data.length < 2) return 0;
    const first = data[0][key] || 1;
    const last = data[data.length - 1][key] || 1;
    return (((last - first) / first) * 100).toFixed(2);
  };

  // Pre-calculate technical indicators and OHLC
  const processedData = data.map((item, index, self) => {
    const period = 5;
    const k = 2 / (period + 1);
    const prevItem = index > 0 ? self[index - 1] : item;
    
    const calculateEMA = (key, currentVal) => {
      const prevEMA = prevItem[`${key}_ema`] || currentVal;
      return currentVal * k + prevEMA * (1 - k);
    };

    const calculateVWAP = (key) => {
      let sumPrice = 0;
      let count = 0;
      for (let i = 0; i <= index; i++) {
        sumPrice += self[i][key];
        count++;
      }
      return sumPrice / count;
    };

    // Generate fake OHLC based on 'win' and 'dolar'
    const winOpen = prevItem.win;
    const winClose = item.win;
    const winHigh = Math.max(winOpen, winClose) + 70;
    const winLow = Math.min(winOpen, winClose) - 70;
    
    const dolarOpen = prevItem.dolar;
    const dolarClose = item.dolar;
    const dolarHigh = Math.max(dolarOpen, dolarClose) + 0.0075;
    const dolarLow = Math.min(dolarOpen, dolarClose) - 0.0075;

    // We store an array [min, max] for the Bar component to draw the body correctly
    return {
      ...item,
      win_ema: parseFloat(calculateEMA('win', item.win).toFixed(0)),
      win_vwap: parseFloat(calculateVWAP('win').toFixed(0)),
      dolar_ema: parseFloat(calculateEMA('dolar', item.dolar).toFixed(4)),
      dolar_vwap: parseFloat(calculateVWAP('dolar').toFixed(4)),
      btc_ema: item.btc != null ? parseFloat(calculateEMA('btc', item.btc).toFixed(0)) : null,
      btc_vwap: item.btc != null ? parseFloat(calculateVWAP('btc').toFixed(0)) : null,
      
      // OHLC objects for tooltips and custom shape calculations
      win_ohlc: [Math.min(winOpen, winClose), Math.max(winOpen, winClose)],
      open: winOpen, high: winHigh, low: winLow, close: winClose,
      
      dolar_ohlc: [Math.min(dolarOpen, dolarClose), Math.max(dolarOpen, dolarClose)],
      d_open: dolarOpen, d_high: dolarHigh, d_low: dolarLow, d_close: dolarClose,
    };
  });

  return (
    <div className="market-monitor animate-fade-in compact">
      <div className="main-chart-area glass">
        <div className="chart-header">
          <div className="title-group">
            <h3 className="chart-title">Sentimento Macro & Regime</h3>
          </div>
          <div className="chart-stats font-mono">
            <span className="text-green">RISK-ON</span>
            <span className="separator">/</span>
            <span className="text-red">RISK-OFF</span>
          </div>
        </div>
        
        <div className="chart-main sentiment-chart">
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={processedData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSentiment" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#232931" vertical={false} />
              <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'rgba(255,255,255,.4)' }} axisLine={{ stroke: 'rgba(255,255,255,.15)', strokeDasharray: '3 3' }} tickLine={false} />
              <YAxis domain={[0, 100]} hide />
              <Tooltip content={<CustomTooltip suffix="%" />} />
              <ReferenceLine y={50} stroke="#30363d" strokeDasharray="5 5" />
              <Area
                type="monotone"
                dataKey="sentiment"
                stroke="var(--accent-blue)"
                fillOpacity={1}
                fill="url(#colorSentiment)"
                strokeWidth={2}
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="correlation-chart-container">
          <div className="chart-header">
            <h3 className="chart-title">Correlação Inversa (WIN vs USD)</h3>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={processedData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#232931" vertical={false} />
              <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'rgba(255,255,255,.4)' }} axisLine={{ stroke: 'rgba(255,255,255,.15)', strokeDasharray: '3 3' }} tickLine={false} />
              <YAxis yAxisId="left" orientation="left" hide domain={['auto', 'auto']} />
              <YAxis yAxisId="right" orientation="right" hide domain={['auto', 'auto']} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="win"
                stroke={winColor}
                strokeWidth={2}
                dot={false}
                animationDuration={800}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="dolar"
                stroke={dolColor}
                strokeWidth={2}
                dot={false}
                animationDuration={800}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="dual-legend font-mono">
            <span style={{ color: winColor }}>● WIN</span>
            <span style={{ color: dolColor }}>● USD/BRL</span>
          </div>
        </div>
      </div>

      <div className="secondary-charts">
        {/* WIN CANDLESTICK CHART */}
        <div className="sub-chart glass">
          <div className="sub-header">
            <div className="asset-info">
              <span className="asset-name">WIN (MINI IBOV) - M5</span>
              <span className={`asset-change font-mono ${calculateChange('win') >= 0 ? 'text-green' : 'text-red'}`}>
                {calculateChange('win')}%
              </span>
            </div>
            <div className="asset-price font-mono">{currentWin?.toLocaleString('pt-BR')}</div>
          </div>
          <div className="sub-body">
            <ResponsiveContainer width="100%" height={120}>
              <ComposedChart data={processedData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'rgba(255,255,255,.4)' }} axisLine={{ stroke: 'rgba(255,255,255,.15)', strokeDasharray: '3 3' }} tickLine={false} />
                <YAxis domain={['auto', 'auto']} hide />
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                <Area
                  type="monotone"
                  dataKey="win"
                  stroke={winColor}
                  fillOpacity={0.1}
                  fill={winColor}
                  strokeWidth={2}
                  dot={<SignalDot signalType="winSignal" />}
                  isAnimationActive={false}
                />
                <Line type="monotone" dataKey="win_ema" stroke={winColor} strokeOpacity={0.4} strokeWidth={1} dot={false} strokeDasharray="3 3" isAnimationActive={false} />
                <Line type="monotone" dataKey="win_vwap" stroke="#f15bb5" strokeWidth={1.5} dot={false} strokeOpacity={0.7} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="indicator-legend">
              <span className="leg-item"><span className="dot ema"></span> EMA 5</span>
              <span className="leg-item"><span className="dot vwap"></span> VWAP</span>
              <span className={`leg-item signal-leg ${winLit === 'buy' ? 'lit' : ''}`}>▲ Compra</span>
              <span className={`leg-item signal-leg sell ${winLit === 'sell' ? 'lit' : ''}`}>▼ Venda</span>
            </div>
          </div>
        </div>

        {/* DOLAR CANDLESTICK CHART */}
        <div className="sub-chart glass">
          <div className="sub-header">
            <div className="asset-info">
              <span className="asset-name">DÓLAR (USD/BRL) - M5</span>
              <span className={`asset-change font-mono ${calculateChange('dolar') >= 0 ? 'text-green' : 'text-red'}`}>
                {calculateChange('dolar')}%
              </span>
            </div>
            <div className="asset-price font-mono">R$ {currentDolar?.toFixed(4)}</div>
          </div>
          <div className="sub-body">
            <ResponsiveContainer width="100%" height={120}>
              <ComposedChart data={processedData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'rgba(255,255,255,.4)' }} axisLine={{ stroke: 'rgba(255,255,255,.15)', strokeDasharray: '3 3' }} tickLine={false} />
                <YAxis domain={['auto', 'auto']} hide />
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                <Area
                  type="monotone"
                  dataKey="dolar"
                  stroke={dolColor}
                  fillOpacity={0.1}
                  fill={dolColor}
                  strokeWidth={2}
                  dot={<SignalDot signalType="dolarSignal" />}
                  isAnimationActive={false}
                />
                <Line type="monotone" dataKey="dolar_ema" stroke={dolColor} strokeOpacity={0.4} strokeWidth={1} dot={false} strokeDasharray="3 3" isAnimationActive={false} />
                <Line type="monotone" dataKey="dolar_vwap" stroke="#f15bb5" strokeWidth={1.5} dot={false} strokeOpacity={0.7} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="indicator-legend">
              <span className="leg-item"><span className="dot ema-gold"></span> EMA 5</span>
              <span className="leg-item"><span className="dot vwap"></span> VWAP</span>
              <span className={`leg-item signal-leg ${dolLit === 'buy' ? 'lit' : ''}`}>▲ Compra</span>
              <span className={`leg-item signal-leg sell ${dolLit === 'sell' ? 'lit' : ''}`}>▼ Venda</span>
            </div>
          </div>
        </div>

        {/* BTC (CRIPTO) CHART — sinal de risco-on/off (modo 24h) */}
        <div className="sub-chart glass">
          <div className="sub-header">
            <div className="asset-info">
              <span className="asset-name">🪙 BTC/USD - M5</span>
              <span className={`asset-change font-mono ${calculateChange('btc') >= 0 ? 'text-green' : 'text-red'}`}>
                {calculateChange('btc')}%
              </span>
            </div>
            <div className="asset-price font-mono">$ {currentBtc?.toLocaleString('en-US')}</div>
          </div>
          <div className="sub-body">
            <ResponsiveContainer width="100%" height={120}>
              <ComposedChart data={processedData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'rgba(255,255,255,.4)' }} axisLine={{ stroke: 'rgba(255,255,255,.15)', strokeDasharray: '3 3' }} tickLine={false} />
                <YAxis domain={['auto', 'auto']} hide />
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                <Area
                  type="monotone"
                  dataKey="btc"
                  stroke={btcColor}
                  fillOpacity={0.1}
                  fill={btcColor}
                  strokeWidth={2}
                  isAnimationActive={false}
                />
                <Line type="monotone" dataKey="btc_ema" stroke={btcColor} strokeOpacity={0.4} strokeWidth={1} dot={false} strokeDasharray="3 3" isAnimationActive={false} />
                <Line type="monotone" dataKey="btc_vwap" stroke="#f15bb5" strokeWidth={1.5} dot={false} strokeOpacity={0.7} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="indicator-legend">
              <span className="leg-item"><span className="dot ema-btc"></span> EMA 5</span>
              <span className="leg-item"><span className="dot vwap"></span> VWAP</span>
              <span className={`leg-item signal-leg ${btcLit === 'buy' ? 'lit' : ''}`}>▲ Compra</span>
              <span className={`leg-item signal-leg sell ${btcLit === 'sell' ? 'lit' : ''}`}>▼ Venda</span>
            </div>
            <div className="btc-signal-note">Sinal: risco-on/off 24h (BTC + futuros S&amp;P 500)</div>
          </div>
        </div>

      </div>

      <style jsx="true">{`
        .market-monitor {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .main-chart-area {
          padding: 1.25rem;
          border-radius: 12px;
          background: linear-gradient(180deg, rgba(22, 27, 34, 0.3) 0%, rgba(10, 12, 16, 0.4) 100%);
          border: 1px solid rgba(88, 166, 255, 0.15);
        }

        .correlation-chart-container {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border-color);
        }

        .dual-legend {
          display: flex;
          justify-content: center;
          gap: 1.5rem;
          font-size: 0.65rem;
          margin-top: 0.5rem;
          font-weight: 700;
        }

        .secondary-charts {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1rem;
        }

        .sub-chart {
          padding: 1rem;
          border-radius: 12px;
          background: rgba(22, 27, 34, 0.2);
          border: 1px solid var(--border-color);
          backdrop-filter: blur(12px);
        }

        .chart-header, .sub-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.75rem;
        }

        .chart-title {
          font-size: 0.85rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-secondary);
        }

        .chart-stats {
          font-size: 0.7rem;
          display: flex;
          gap: 0.4rem;
          font-weight: 700;
        }

        .asset-info {
          display: flex;
          flex-direction: column;
        }

        .asset-name {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--text-muted);
        }

        .asset-change {
          font-size: 0.7rem;
          margin-top: 2px;
        }

        .asset-price {
          font-size: 1.25rem;
          font-weight: 800;
          letter-spacing: -0.4px;
        }

        .indicator-legend {
          display: flex;
          gap: 0.75rem;
          font-size: 0.6rem;
          margin-top: 0.5rem;
          justify-content: flex-end;
          color: var(--text-muted);
          font-weight: 600;
        }

        .leg-item { display: flex; align-items: center; gap: 6px; }
        .dot { width: 8px; height: 8px; border-radius: 50%; }
        .ema { background: rgba(0, 245, 212, 0.3); border: 1px dashed var(--accent-green); }
        .ema-gold { background: rgba(251, 191, 36, 0.3); border: 1px dashed var(--accent-gold); }
        .ema-btc { background: rgba(247, 147, 26, 0.3); border: 1px dashed #f7931a; }
        .btc-signal-note { font-size: .55rem; color: var(--text-muted); text-align: right; margin-top: .3rem; font-style: italic; }
        .vwap { background: #f15bb5; }
        .signal-leg { color: var(--accent-green); opacity: .4; transition: opacity .25s, text-shadow .25s; }
        .signal-leg.sell { color: var(--accent-red); }
        .signal-leg.lit {
          opacity: 1; font-weight: 800;
          text-shadow: 0 0 8px currentColor;
        }

        .separator { color: var(--border-color); }

        @media (max-width: 600px) {
          .secondary-charts {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default MarketCharts;
