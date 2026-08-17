import React, { useEffect, useRef } from 'react';

// Widget oficial embutido do TradingView — carrega direto do domínio deles (sem proxy/CORS),
// então não depende da nossa cadeia de proxies instável. Documentação:
// https://www.tradingview.com/widget/advanced-chart/
const TradingViewWidget = ({ symbol = 'BMFBOVESPA:IBOV', height = 320 }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.height = '100%';
    widgetDiv.style.width = '100%';
    containerRef.current.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      width: '100%',
      height,
      symbol,
      interval: '5',
      timezone: 'America/Sao_Paulo',
      theme: 'dark',
      style: '1',
      locale: 'br',
      backgroundColor: 'rgba(10, 13, 20, 1)',
      enable_publishing: false,
      allow_symbol_change: true,
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      calendar: false,
      support_host: 'https://www.tradingview.com',
    });
    containerRef.current.appendChild(script);
  }, [symbol, height]);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container"
      style={{ height, width: '100%' }}
    />
  );
};

export default React.memo(TradingViewWidget);
