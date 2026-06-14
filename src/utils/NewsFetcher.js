/**
 * NewsFetcher — Mercado MG
 * Fontes (em ordem de prioridade):
 *  1. Google News RSS  — mercado financeiro Brasil (gratuito, sem chave)
 *  2. InfoMoney RSS    — notícias financeiras BR
 *  3. Valor Econômico RSS
 *  4. Pool simulado    — fallback quando todas as fontes falham
 */

const CORS = 'https://api.allorigins.win/raw?url=';
const CORS2 = 'https://corsproxy.io/?';

const RSS_SOURCES = [
  {
    name: 'Google News BR',
    url: 'https://news.google.com/rss/search?q=mercado+financeiro+ibovespa+bolsa+selic&hl=pt-BR&gl=BR&ceid=BR:pt-419',
    proxy: CORS,
    parse: parseGoogleRSS,
  },
  {
    name: 'InfoMoney',
    url: 'https://www.infomoney.com.br/feed/',
    proxy: CORS,
    parse: parseGenericRSS,
  },
  {
    name: 'Valor Econômico',
    url: 'https://valor.globo.com/financas/rss',
    proxy: CORS2,
    parse: parseGenericRSS,
  },
  {
    name: 'Google News Cripto BR',
    url: 'https://news.google.com/rss/search?q=bitcoin+ethereum+cripto+brasil&hl=pt-BR&gl=BR&ceid=BR:pt-419',
    proxy: CORS,
    parse: parseGoogleRSS,
  },
];

const FALLBACK_POOL = [
  'Banco Central do Brasil sinaliza manutenção da taxa Selic em reunião do Copom. Mercado aguarda definição de política monetária.',
  'FED indica que inflação persistente nos EUA pode atrasar corte de juros. Dólar global se fortalece.',
  'NVIDIA reporta lucros recordes e impulsiona narrativas de Inteligência Artificial em mercados globais.',
  'BlackRock aumenta exposição em RWA através de novo fundo tokenizado na rede Ethereum.',
  'Baleia de Bitcoin movimenta 5.000 BTC após 10 anos de inatividade, gerando especulação de alta.',
  'Relatório de Emprego (Payroll) dos EUA supera projeções. Mercado revisa expectativas de juros.',
  'Petróleo Brent sobe com tensões no Oriente Médio. Commodities energéticas em alta.',
  'IPCA-15 registra variação levemente abaixo do consenso do mercado. Desinflação em curso.',
  'Proposta de ETF de Solana nos EUA ganha força com interesse institucional crescente.',
  'Tensão geopolítica aumenta e investidores buscam refúgio em títulos do Tesouro americano.',
  'Dólar (DXY) se fortalece contra moedas emergentes após dados fortes de varejo nos EUA.',
  'Fitch mantém perspectiva estável para o Brasil após revisão positiva do crescimento do PIB.',
  'Ouro reage à expectativa de cortes de juros nos EUA. Commodity sobe para máxima histórica.',
  'Fluxo estrangeiro para corretoras brasileiras avança com otimismo no setor de commodities.',
  'Ibovespa supera resistência em ambiente de liquidez global favorável a emergentes.',
  'IPCA anualizado fica dentro da meta do Banco Central, abrindo espaço para política expansiva.',
  'Minério de ferro sobe na China, favorecendo ações de empresas do setor de metais na B3.',
  'Vale e Petrobras lideram alta do Ibovespa com recuperação de commodities globais.',
  'Tesouro Direto registra captação recorde em meio à busca por proteção contra inflação.',
  'Resultado primário do governo sinaliza melhora fiscal e reduz prêmio de risco do Brasil.',
];

// ── RSS parsers ───────────────────────────────────────────────────────────────

function parseGoogleRSS(xmlText) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xmlText)) !== null) {
    const block = match[1];
    const title = (/<title><!\[CDATA\[(.*?)\]\]><\/title>/.exec(block) ||
                   /<title>(.*?)<\/title>/.exec(block) || [])[1] || '';
    const desc  = (/<description><!\[CDATA\[(.*?)\]\]><\/description>/.exec(block) ||
                   /<description>(.*?)<\/description>/.exec(block) || [])[1] || '';
    const pub   = (/<pubDate>(.*?)<\/pubDate>/.exec(block) || [])[1] || '';
    const clean = (s) => s.replace(/<[^>]*>/g, '').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").trim();
    const text  = clean(title);
    if (text.length > 20) items.push({ text, source: 'Google News BR', time: pub ? new Date(pub).toLocaleTimeString('pt-BR') : null });
  }
  return items;
}

function parseGenericRSS(xmlText) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xmlText)) !== null) {
    const block = match[1];
    const title = (/<title><!\[CDATA\[(.*?)\]\]><\/title>/.exec(block) ||
                   /<title>(.*?)<\/title>/.exec(block) || [])[1] || '';
    const pub   = (/<pubDate>(.*?)<\/pubDate>/.exec(block) || [])[1] || '';
    const clean = (s) => s.replace(/<[^>]*>/g, '').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").trim();
    const text  = clean(title);
    if (text.length > 20) items.push({ text, time: pub ? new Date(pub).toLocaleTimeString('pt-BR') : null });
  }
  return items;
}

// ── Fetch a single RSS source ─────────────────────────────────────────────────

async function fetchRSSSource(src) {
  const encoded = encodeURIComponent(src.url);
  const proxyUrl = `${src.proxy}${encoded}`;
  const res = await fetch(proxyUrl, { cache: 'no-store', signal: AbortSignal.timeout(7000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const xml   = await res.text();
  const items = src.parse(xml);
  if (!items.length) throw new Error('Nenhum item no feed');
  return { items, name: src.name };
}

// ── Main fetcher ──────────────────────────────────────────────────────────────

let lastItems = [];
let sourceIdx = 0;

const fetchLiveNews = async () => {
  // Rotate sources to spread load
  const attempts = [...RSS_SOURCES.slice(sourceIdx), ...RSS_SOURCES.slice(0, sourceIdx)];
  sourceIdx = (sourceIdx + 1) % RSS_SOURCES.length;

  for (const src of attempts) {
    try {
      const { items, name } = await fetchRSSSource(src);
      lastItems = items;
      // Pick a random recent item
      const pick = items[Math.floor(Math.random() * Math.min(items.length, 8))];
      return {
        text:   pick.text,
        source: name,
        time:   pick.time || new Date().toLocaleTimeString('pt-BR'),
        live:   true,
      };
    } catch (err) {
      console.warn(`[NewsFetcher] ${src.name} falhou:`, err.message);
    }
  }
  throw new Error('Todas as fontes falharam');
};

// ── Public API ────────────────────────────────────────────────────────────────

export const startNewsFeed = (onNewNews) => {
  let running = true;

  const tick = async () => {
    if (!running) return;
    try {
      const item = await fetchLiveNews();
      if (running) onNewNews(item);
    } catch {
      // All live sources failed → fallback pool
      const text  = FALLBACK_POOL[Math.floor(Math.random() * FALLBACK_POOL.length)];
      if (running) onNewNews({ text, source: 'Feed Simulado', time: new Date().toLocaleTimeString('pt-BR'), live: false });
    }
  };

  tick();
  const interval = setInterval(tick, 25000);
  return () => { running = false; clearInterval(interval); };
};
