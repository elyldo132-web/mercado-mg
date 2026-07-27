#!/usr/bin/env node
/**
 * Runner de ingestão simulada
 * Executa conectores reais ou simulados e grava em `data/normalized.json`
 */
import fs from 'fs';
import path from 'path';
import { fetchExchangeRates, fetchBitcoinPrice, fetchNewsAPI } from '../src/data/connectors.js';

const outDir = path.resolve(process.cwd(), 'data');
const outFile = path.join(outDir, 'normalized.json');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const run = async () => {
  ensureDir(outDir);
  const results = [];
  try {
    const [fx, btc, news] = await Promise.all([fetchExchangeRates(), fetchBitcoinPrice(), fetchNewsAPI()]);
    results.push(fx, btc, news);
    fs.writeFileSync(outFile, JSON.stringify({ generated_at: new Date().toISOString(), items: results }, null, 2));
    console.log('Ingestão concluída. Arquivo:', outFile);
    process.exit(0);
  } catch (err) {
    console.error('Erro na ingestão', err);
    process.exit(2);
  }
};

run();
