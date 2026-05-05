/**
 * Macro Analysis Engine for Mercado MG
 * Rules based on USER_REQUEST:
 * 1. Filter news with real impact (Macro/Geopolitical)
 * 2. Relevance criteria: Fed, Inflação, PIB, Emprego, Commodities, Juros, Geopolítica.
 * 3. Classification: Dólar (USD/BRL) and WIN (Ibovespa)
 */

export const analyzeNews = (text) => {
  const content = text.toLowerCase();

  // Criteria check
  const hasRelevance = [
    'fed', 'juros', 'banco central', 'selic', 'cpom', 'fomc',
    'inflação', 'ipca', 'cpi', 'pce', 
    'payroll', 'emprego', 'desemplego',
    'pib', 'gdp',
    'petróleo', 'minério', 'soja', 'commodities', 'brent',
    'guerra', 'conflito', 'tensão', 'geopolítica',
    'hawkish', 'dovish', 'monetária',
    'dólar global', 'dxy', 'tesouro', 'treasury',
    'cripto', 'bitcoin', 'btc', 'ether', 'eth', 'solana', 'sol', 'etf', 'whale', 'baleia',
    'halving', 'binance', 'coinbase', 'sec', 'token', 'web3',
    'inteligência artificial', 'ai crypto', 'rwa', 'memecoin',
    'nvidia', 'nvda', 'apple', 'aapl', 'microsoft', 'msft', 'tech', 'tesla', 'tsla'
  ].some(keyword => content.includes(keyword));

  if (!hasRelevance) return 'IGNORAR';

  // Analysis logic (Heuristic-based)
  let summary = text.split('.')[0].substring(0, 100) + '...';
  let impact = { dollar: 'Neutro', win: 'Neutro', crypto: 'Neutro', sector: 'Macro' };
  let strength = 'Médio';
  let timing = 'Curto prazo';
  let tradeReading = 'Aguardar confirmação de fluxo antes de entrar.';

  // Scenario 1: FED/Interest (Macro)
  if ((content.includes('fed') || content.includes('fomc')) && (content.includes('sobe') || content.includes('alta') || content.includes('manter')) ) {
    impact = { dollar: 'Alta', win: 'Queda', crypto: 'Queda', sector: 'Macro' };
    strength = 'Forte';
    tradeReading = '🚨 TRABALHE NA VENDA. Dólar forte globalmente pressiona ativos de risco.';
  } else if (content.includes('corte') || content.includes('cair') || content.includes('queda') && (content.includes('juros') || content.includes('selic'))) {
    impact = { dollar: 'Queda', win: 'Alta', crypto: 'Alta', sector: 'Macro' };
    strength = 'Forte';
    tradeReading = '✅ TRABALHE NA COMPRA. Apetite ao risco liberado. Vamos comprar ativos de crescimento.';

  // Scenario 2: Tech & AI
  } else if (content.includes('ia') || content.includes('inteligência artificial') || content.includes('nvidia') || content.includes('rndr') || content.includes('fet') || content.includes('near')) {
    impact = { dollar: 'Neutro', win: 'Alta', crypto: 'Alta', sector: 'AI' };
    strength = 'Forte';
    tradeReading = '🚀 VAMOS COMPRAR ESSA AÇÃO/TOKEN. Narrativa de IA lidera o mercado. Foco em Tech.';

  // Scenario 3: RWA (Real World Assets)
  } else if (content.includes('rwa') || content.includes('tokenização') || content.includes('ondo') || content.includes('link') || content.includes('blackrock')) {
    impact = { dollar: 'Neutro', win: 'Neutro', crypto: 'Alta', sector: 'RWA' };
    strength = 'Médio';
    tradeReading = '💎 TRABALHE NA COMPRA. Tokenização institucional em foco. Acumule ONDO/LINK.';

  // Scenario 4: Crypto Market specific
  } else if (content.includes('bitcoin') || content.includes('halving') || (content.includes('etf') && content.includes('cripto'))) {
    if (content.includes('alta') || content.includes('aprova') || content.includes('compra') || content.includes('whale')) {
      impact = { dollar: 'Neutro', win: 'Neutro', crypto: 'Alta', sector: 'Crypto' };
      strength = 'Forte';
      tradeReading = '📈 TRABALHE NA COMPRA. Fluxo institucional forte no BTC. Alavancagem permitida.';
    }
  } else if (content.includes('memecoin') || content.includes('pepe') || content.includes('wif') || content.includes('doge')) {
    impact = { dollar: 'Neutro', win: 'Neutro', crypto: 'Alta', sector: 'MEME' };
    strength = 'Forte';
    timing = 'Day Trading';
    tradeReading = '🎰 TRABALHE NA COMPRA (Curto Prazo). Puro sentimento especulativo. Entre e saia rápido.';

  // Scenario 5: Commodities & Geopolitics
  } else if (content.includes('petróleo') || content.includes('brent')) {
    if (content.includes('sobe') || content.includes('alta')) {
      impact = { dollar: 'Queda', win: 'Alta', crypto: 'Neutro', sector: 'Commodities' }; 
      strength = 'Médio';
      tradeReading = '🛢️ TRABALHE NA COMPRA DE COMMODITIES. Petróleo em alta favorece o Real e ativos vinculados.';
    }
  } else if (content.includes('geopolítica') || content.includes('guerra') || content.includes('conflito')) {
    impact = { dollar: 'Alta', win: 'Queda', crypto: 'Neutro', sector: 'Macro' };
    strength = 'Forte';
    timing = 'Médio prazo';
    tradeReading = '🛡️ TRABALHE NA COMPRA DE DÓLAR. Incerteza global exige proteção. Saia do risco.';
  }

  return {
    summary,
    impact,
    strength,
    timing,
    tradeReading
  };
};
