/**
 * NewsFetcher for Mercado MG
 * Simulates real-time news arriving for macro analysis.
 */

const simulatedNewsPool = [
  "Banco Central do Brasil sinaliza manutenção da taxa Selic em 10.50% na próxima reunião do Copom.",
  "FED indica que inflação persistente nos EUA pode atrasar corte de juros para o final do ano.",
  "Nvidia reporta lucros recordes e impulsiona narrativas de Inteligência Artificial em Cripto.",
  "BlackRock aumenta exposição em RWA através de novo fundo tokenizado na rede Ethereum.",
  "Baleia de Bitcoin movimenta 5.000 BTC após 10 anos de inatividade, gerando especulação.",
  "Relatório de Emprego (Payroll) dos EUA mostra criação de 250 mil vagas, superando projeções.",
  "Preço do barril de Petróleo Brent sobe 3% com tensões no Oriente Médio.",
  "IPCA-15 de Março registra alta de 0.36%, levemente abaixo do consenso do mercado.",
  "Proposta de ETF de Solana nos EUA ganha força após aprovação histórica dos ETFs de Ether.",
  "Protocolo ONDO lidera ganhos no setor RWA com anúncio de parceria institucional.",
  "Tensão geopolítica aumenta e investidores buscam refúgio em títulos do tesouro americano.",
  "Dólar global (DXY) se fortalece contra moedas emergentes após dados fortes de varejo nos EUA."
];

export const startNewsFeed = (onNewNews) => {
  // Simulate a news item arriving every 15-30 seconds
  const interval = setInterval(() => {
    const randomIndex = Math.floor(Math.random() * simulatedNewsPool.length);
    const news = simulatedNewsPool[randomIndex];
    const timestamp = new Date().toLocaleTimeString();
    
    onNewNews({
      text: news,
      source: 'Agência Automática',
      time: timestamp
    });
  }, 20000); // 20 seconds for demo purposes

  return () => clearInterval(interval);
};
