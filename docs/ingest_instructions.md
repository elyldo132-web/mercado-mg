# Ingestão simulada — como executar

Este exemplo executa conectores simulados e grava um arquivo normalizado em `data/normalized.json`.

Passos:

1. No terminal, execute:

```bash
node scripts/ingest_simulate.js
```

2. Verifique o arquivo gerado: `data/normalized.json`.

3. Para forçar o uso de APIs reais (quando disponíveis), execute:

```bash
USE_REAL_API=true node scripts/ingest_simulate.js
```

4. Para usar o modo real no frontend durante o desenvolvimento:

```bash
VITE_USE_REAL_API=true npm run dev
```

Notas:
- O código já suporta fallback quando a API real falha. Em `src/data/connectors.js`, o sistema tenta usar endpoints reais e volta para dados simulados se necessário.
- Normalize timestamps para UTC e versione esquemas quando evoluir.
