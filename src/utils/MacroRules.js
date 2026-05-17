/**
 * Macro Analysis Engine for Mercado MG
 * Rules based on USER_REQUEST:
 * 1. Filter news with real impact (Macro/Geopolitical)
 * 2. Relevance criteria: Fed, Inflação, PIB, Emprego, Commodities, Juros, Geopolítica.
 * 3. Classification: Dólar (USD/BRL) and WIN (Ibovespa)
 */

export const analyzeNews = (text) => {
  const content = text.toLowerCase();

  const relevanceKeywords = [
    'fed', 'juros', 'banco central', 'selic', 'cpom', 'fomc', 'taxa',
    'inflação', 'ipca', 'cpi', 'pce', 'pressão', 'desinflação',
    'payroll', 'emprego', 'desemprego',
    'pib', 'gdp', 'crescimento', 'contração',
    'petróleo', 'minério', 'soja', 'commodities', 'brent', 'ouro', 'metal',
    'guerra', 'conflito', 'tensão', 'geopolítica', 'sanções',
    'dólar global', 'dxy', 'tesouro', 'treasury', 'spread',
    'cripto', 'bitcoin', 'btc', 'ether', 'eth', 'solana', 'sol', 'etf', 'whale', 'baleia',
    'halving', 'binance', 'coinbase', 'sec', 'token', 'web3',
    'inteligência artificial', 'ai', 'rwa', 'memecoin',
    'nvidia', 'nvda', 'apple', 'aapl', 'microsoft', 'msft', 'tech', 'tesla', 'tsla',
    'ibov', 'win', 'ibovespa'
  ];

  const hasRelevance = relevanceKeywords.some(keyword => content.includes(keyword));
  if (!hasRelevance) return 'IGNORAR';

  const summary = text.replace(/\s+/g, ' ').trim().split('. ')[0].substring(0, 120) + '...';
  let impact = { dollar: 'Neutro', win: 'Neutro', crypto: 'Neutro', sector: 'Macro' };
  let strength = 'Médio';
  let timing = 'Curto prazo';
  let tradeReading = 'Aguardar confirmação de fluxo antes de entrar.';
  let tradeAction = 'Aguardar';
  let drivers = [];
  let directionScore = 0;
  let sector = 'Macro';

  const addDriver = (label, score) => {
    if (!drivers.includes(label)) drivers.push(label);
    directionScore += score;
  };

  const isFed = content.includes('fed') || content.includes('fomc') || content.includes('banco central');
  const mentionsRate = content.includes('juros') || content.includes('selic') || content.includes('cpom') || content.includes('taxa');
  const mentionsInflation = content.includes('inflação') || content.includes('ipca') || content.includes('cpi') || content.includes('pce');
  const mentionsGrowth = content.includes('pib') || content.includes('gdp') || content.includes('crescimento') || content.includes('expansão');
  const mentionsEmployment = content.includes('payroll') || content.includes('emprego') || content.includes('desemprego');
  const mentionsGeo = content.includes('guerra') || content.includes('conflito') || content.includes('tensão') || content.includes('geopolítica') || content.includes('sanções');
  const mentionsOil = content.includes('petróleo') || content.includes('brent') || content.includes('commodities');
  const mentionsCrypto = content.includes('bitcoin') || content.includes('btc') || content.includes('ether') || content.includes('eth') || content.includes('cripto') || content.includes('altcoin');
  const mentionsTech = content.includes('ia') || content.includes('inteligência artificial') || content.includes('nvidia') || content.includes('apple') || content.includes('microsoft') || content.includes('tesla') || content.includes('tech');
  const mentionsRWA = content.includes('rwa') || content.includes('tokenização') || content.includes('blackrock') || content.includes('ondo') || content.includes('link');

  if (isFed && (content.includes('sobe') || content.includes('alta') || content.includes('apertar') || content.includes('manter'))) {
    impact = { dollar: 'Alta', win: 'Queda', crypto: 'Queda', sector: 'Macro' };
    strength = 'Forte';
    timing = 'Médio prazo';
    tradeReading = 'Defensiva: venda de risco e proteção em dólar. Esperar confirmação antes de girar posição.';
    tradeAction = 'Venda';
    addDriver('Juros', -30);
    addDriver('Dólar', -18);
    addDriver('Risco', -8);
  } else if (mentionsRate && (content.includes('corte') || content.includes('cair') || content.includes('queda') || content.includes('redução'))) {
    impact = { dollar: 'Queda', win: 'Alta', crypto: 'Alta', sector: 'Macro' };
    strength = 'Forte';
    timing = 'Médio prazo';
    tradeReading = 'Convincente: compra de risco com espaço para alta em ativos de crescimento.';
    tradeAction = 'Compra';
    addDriver('Juros', 28);
    addDriver('Risco', 12);
    addDriver('Fluxo', 8);
  } else if (mentionsTech) {
    impact = { dollar: 'Neutro', win: 'Alta', crypto: 'Alta', sector: 'AI' };
    strength = 'Forte';
    timing = 'Curto prazo';
    tradeReading = 'Foco em tecnologia e IA: oportunidade de compra em nomes com momentum.';
    tradeAction = 'Compra';
    sector = 'AI';
    addDriver('Tech', 22);
    addDriver('Crescimento', 10);
  } else if (mentionsRWA) {
    impact = { dollar: 'Neutro', win: 'Neutro', crypto: 'Alta', sector: 'RWA' };
    strength = 'Médio';
    timing = 'Curto prazo';
    tradeReading = 'Acumule RWA: narrativa institucional em alta, exposição seletiva.';
    tradeAction = 'Compra';
    sector = 'RWA';
    addDriver('Tokenização', 16);
  } else if (mentionsCrypto && (content.includes('alta') || content.includes('aprova') || content.includes('compra') || content.includes('whale') || content.includes('fluxo'))) {
    impact = { dollar: 'Neutro', win: 'Neutro', crypto: 'Alta', sector: 'Crypto' };
    strength = 'Forte';
    timing = 'Curto prazo';
    tradeReading = 'Cripto em fluxo positivo: comprar com gestão de risco e stop tight.';
    tradeAction = 'Compra';
    sector = 'Crypto';
    addDriver('Cripto', 20);
  } else if (content.includes('memecoin') || content.includes('pepe') || content.includes('wif') || content.includes('doge')) {
    impact = { dollar: 'Neutro', win: 'Neutro', crypto: 'Alta', sector: 'Meme' };
    strength = 'Forte';
    timing = 'Day Trading';
    tradeReading = 'Operar com cuidado: alto risco e alta volatilidade. Saia rápido.';
    tradeAction = 'Compra';
    sector = 'Meme';
    addDriver('Sentimento', 8);
  } else if (mentionsOil && (content.includes('sobe') || content.includes('alta'))) {
    impact = { dollar: 'Queda', win: 'Alta', crypto: 'Neutro', sector: 'Commodities' };
    strength = 'Médio';
    timing = 'Médio prazo';
    tradeReading = 'Commodities em alta reforçam real e ativos de valor. Compra seletiva.';
    tradeAction = 'Compra';
    sector = 'Commodities';
    addDriver('Commodities', 14);
    addDriver('Real', 8);
  } else if (mentionsGeo) {
    impact = { dollar: 'Alta', win: 'Queda', crypto: 'Neutro', sector: 'Geopolítica' };
    strength = 'Forte';
    timing = 'Médio prazo';
    tradeReading = 'Proteção: dólar e ouro ganham espaço. Reduzir exposição a risco.';
    tradeAction = 'Venda';
    sector = 'Geopolítica';
    addDriver('Geopolítica', -18);
    addDriver('Segurança', -10);
  }

  if (impact.win === 'Alta') addDriver('WIN', 12);
  if (impact.win === 'Queda') addDriver('WIN', -12);
  if (impact.dollar === 'Alta') addDriver('Dólar', -10);
  if (impact.dollar === 'Queda') addDriver('Dólar', 10);
  if (impact.crypto === 'Alta') addDriver('Cripto', 6);
  if (impact.crypto === 'Queda') addDriver('Cripto', -6);

  if (mentionsInflation && content.includes('alta')) {
    addDriver('Inflação', -12);
    if (impact.win === 'Neutro') impact.win = 'Queda';
  }
  if (mentionsGrowth && (content.includes('forte') || content.includes('acelera') || content.includes('expansão'))) {
    addDriver('Crescimento', 10);
  }
  if (mentionsEmployment && (content.includes('forte') || content.includes('melhora') || content.includes('queda de desemprego'))) {
    addDriver('Emprego', 8);
  }

  const marketDirection = directionScore >= 18 ? 'Alta' : directionScore <= -18 ? 'Queda' : 'Neutro';
  const confidence = Math.min(100, Math.max(40, 45 + Math.round(Math.abs(directionScore) * 1.4)));
  const normalizedDrivers = drivers.length ? drivers : ['Macro'];
  const action = tradeAction === 'Aguardar' && marketDirection !== 'Neutro' ? (marketDirection === 'Alta' ? 'Compra' : 'Venda') : tradeAction;

  return {
    summary,
    impact,
    strength,
    timing,
    tradeReading,
    marketDirection,
    confidence,
    drivers: normalizedDrivers,
    sector,
    tradeAction: action
  };
};
