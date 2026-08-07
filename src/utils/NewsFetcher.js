/**
 * NewsFetcher — Mercado MG
 * Fontes oficiais (em ordem de prioridade):
 *  1. Google News RSS  — mercado financeiro Brasil
 *  2. InfoMoney RSS    — notícias financeiras BR
 *  3. Valor Econômico RSS — Globo
 *  4. Google News Cripto — bitcoin e criptomoedas
 *  5. CoinGecko API    — preço + tendência cripto (sem proxy)
 */

const PROXIES = [
  url => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  url => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  url => `https://thingproxy.freeboard.io/fetch/${url}`,
];

const RSS_SOURCES = [
  {
    name: 'Google News BR',
    url: 'https://news.google.com/rss/search?q=mercado+financeiro+ibovespa+bolsa+selic&hl=pt-BR&gl=BR&ceid=BR:pt-419',
    parse: parseGoogleRSS,
  },
  {
    name: 'InfoMoney',
    url: 'https://www.infomoney.com.br/feed/',
    parse: parseGenericRSS,
  },
  {
    name: 'Valor Econômico',
    url: 'https://valor.globo.com/rss/financas/',
    parse: parseGenericRSS,
  },
  {
    name: 'Google News Cripto',
    url: 'https://news.google.com/rss/search?q=bitcoin+ethereum+cripto+brasil&hl=pt-BR&gl=BR&ceid=BR:pt-419',
    parse: parseGoogleRSS,
  },
  {
    name: 'Investing.com BR',
    url: 'https://br.investing.com/rss/news.rss',
    parse: parseGenericRSS,
  },
];

// ── CoinGecko (sem proxy, API pública) ─────────────────────────────────────

async function fetchCoinGeckoNews() {
  const r = await fetch(
    'https://api.coingecko.com/api/v3/search/trending',
    { cache: 'no-store', signal: AbortSignal.timeout(8000) }
  );
  if (!r.ok) throw new Error(`CoinGecko HTTP ${r.status}`);
  const data = await r.json();
  const coins = data?.coins || [];
  if (!coins.length) throw new Error('Sem dados CoinGecko');
  return coins.slice(0, 8).map(c => {
    const item = c.item;
    const price = item.data?.price ? `$${parseFloat(item.data.price).toLocaleString('en-US', { maximumFractionDigits: 2 })}` : '';
    const change = item.data?.price_change_percentage_24h?.usd;
    const dir = change > 0 ? '📈' : change < 0 ? '📉' : '➖';
    const pct = change != null ? `${change > 0 ? '+' : ''}${change.toFixed(1)}%` : '';
    return {
      text: `${dir} ${item.name} (${item.symbol?.toUpperCase()}) ${price} ${pct} — Trending #${item.score + 1} no CoinGecko`,
      source: 'CoinGecko',
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
  });
}

// ── RSS parsers ───────────────────────────────────────────────────────────────

function parseGoogleRSS(xmlText) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xmlText)) !== null) {
    const block = match[1];
    const title = (/<title><!\[CDATA\[(.*?)\]\]><\/title>/.exec(block) ||
                   /<title>(.*?)<\/title>/.exec(block) || [])[1] || '';
    const pub   = (/<pubDate>(.*?)<\/pubDate>/.exec(block) || [])[1] || '';
    const source = (/<source[^>]*>(.*?)<\/source>/.exec(block) || [])[1] || 'Google News';
    const text  = clean(title);
    if (text.length > 20) items.push({ text, source, time: pub ? new Date(pub).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : null });
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
    const text  = clean(title);
    if (text.length > 20) items.push({ text, time: pub ? new Date(pub).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : null });
  }
  return items;
}

const clean = (s) => s.replace(/<[^>]*>/g, '').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").trim();

// ── Fetch a single RSS source (tenta todos os proxies) ───────────────────────

async function fetchRSSSource(src) {
  for (const proxy of PROXIES) {
    try {
      const res = await fetch(proxy(src.url), { cache: 'no-store', signal: AbortSignal.timeout(8000) });
      if (!res.ok) continue;
      const xml   = await res.text();
      const items = src.parse(xml);
      if (items.length) return { items, name: src.name };
    } catch { /* tenta próximo proxy */ }
  }
  throw new Error(`Todos os proxies falharam para ${src.name}`);
}

// ── Main fetcher ──────────────────────────────────────────────────────────────

let lastItems = [];
let sourceIdx = 0;
let lastPickedText = null;

const fetchLiveNews = async () => {
  const attempts = [...RSS_SOURCES.slice(sourceIdx), ...RSS_SOURCES.slice(0, sourceIdx)];
  sourceIdx = (sourceIdx + 1) % RSS_SOURCES.length;

  // Tenta RSS
  for (const src of attempts) {
    try {
      const { items, name } = await fetchRSSSource(src);
      lastItems = items;
      const pool = items.slice(0, Math.min(items.length, 8));
      let pick = pool[Math.floor(Math.random() * pool.length)];
      if (pool.length > 1 && pick.text === lastPickedText) {
        pick = pool.find(p => p.text !== lastPickedText) || pick;
      }
      lastPickedText = pick.text;
      return {
        text:   pick.text,
        source: pick.source || name,
        time:   pick.time || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        live:   true,
      };
    } catch (err) {
      console.warn(`[NewsFetcher] ${src.name} falhou:`, err.message);
    }
  }

  // Fallback: CoinGecko (sem proxy)
  try {
    const coins = await fetchCoinGeckoNews();
    if (coins.length) {
      const pick = coins[Math.floor(Math.random() * coins.length)];
      return { ...pick, live: true };
    }
  } catch (err) {
    console.warn('[NewsFetcher] CoinGecko falhou:', err.message);
  }

  throw new Error('Todas as fontes falharam');
};

// ── Fallback Pool (ÚLTIMO recurso, claramente marcado) ───────────────────────

const FALLBACK_POOL = [
  'Banco Central do Brasil sinaliza manutenção da taxa Selic em reunião do Copom.',
  'FED indica que inflação persistente nos EUA pode atrasar corte de juros.',
  'Relatório de Emprego (Payroll) dos EUA supera projeções. Mercado revisa expectativas.',
  'IPCA-15 registra variação abaixo do consenso. Desinflação em curso no Brasil.',
  'Dólar se fortalece contra moedas emergentes após dados fortes de varejo nos EUA.',
  'Ouro atinge máxima histórica com expectativa de cortes de juros globais.',
  'Minério de ferro sobe na China, favorecendo setor de metais na B3.',
  'Fluxo estrangeiro avança para bolsas emergentes com otimismo em commodities.',
];

// ── Public API ────────────────────────────────────────────────────────────────

export const startNewsFeed = (onNewNews) => {
  let running = true;

  const tick = async () => {
    if (!running) return;
    try {
      const item = await fetchLiveNews();
      if (running) onNewNews(item);
    } catch {
      const text = FALLBACK_POOL[Math.floor(Math.random() * FALLBACK_POOL.length)];
      if (running) onNewNews({ text, source: '⚠️ Offline (simulado)', time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), live: false });
    }
  };

  tick();
  const interval = setInterval(tick, 25000);
  return () => { running = false; clearInterval(interval); };
};
