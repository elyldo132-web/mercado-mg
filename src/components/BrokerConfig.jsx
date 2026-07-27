import React, { useState } from 'react';

const BROKERS = [
  {
    key: 'profit',
    name: 'Profit Pro',
    icon: '⚡',
    desc: 'Nelogica — XP, Rico, Clear, BTG e outras',
    color: '#a855f7',
    fields: [
      { key: 'port',   label: 'Porta local',  type: 'text',     placeholder: '51777',           hint: 'Porta que o Profit Pro expõe a API (padrão: 51777)' },
      { key: 'apiKey', label: 'API Key',       type: 'password', placeholder: 'Chave da API',    hint: 'Gerada em Ferramentas → Automação no Profit Pro' },
    ],
  },
  {
    key: 'toro',
    name: 'Toro Investimentos',
    icon: '🐂',
    desc: 'Santander — Mini contratos WIN e DOL',
    color: '#00ff88',
    fields: [
      { key: 'token', label: 'Bearer Token', type: 'password', placeholder: 'Token da API Toro', hint: 'Gerado na área do desenvolvedor da Toro' },
    ],
  },
  {
    key: 'xp',
    name: 'XP Investimentos',
    icon: '🟠',
    desc: 'Renda variável — ações e futuros',
    color: '#f97316',
    fields: [
      { key: 'apiKey',    label: 'API Key',    type: 'password', placeholder: 'Chave da API XP',    hint: 'Disponível no portal XP Developers' },
      { key: 'apiSecret', label: 'API Secret', type: 'password', placeholder: 'Secret da API XP',  hint: 'Gerado junto com a API Key' },
    ],
  },
  {
    key: 'binance',
    name: 'Binance',
    icon: '🟡',
    desc: 'Criptomoedas — BTC, ETH, BNB e mais',
    color: '#f0b90b',
    fields: [
      { key: 'apiKey',    label: 'API Key',    type: 'password', placeholder: 'Binance API Key',    hint: 'Gerado em Perfil → Gerenciar API na Binance' },
      { key: 'apiSecret', label: 'API Secret', type: 'password', placeholder: 'Binance API Secret', hint: 'Mostrado apenas uma vez ao criar a API Key' },
    ],
  },
];

const STORAGE_KEY = 'broker_config';

const load = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
};
const save = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

export const getBrokerConfig = (brokerKey) => load()[brokerKey] || {};

const BrokerConfig = () => {
  const [config, setConfig] = useState(load);
  const [show, setShow]     = useState({});
  const [saved, setSaved]   = useState({});
  const [testing, setTesting] = useState({});
  const [testResult, setTestResult] = useState({});

  const update = (brokerKey, fieldKey, value) => {
    setConfig(prev => {
      const next = { ...prev, [brokerKey]: { ...prev[brokerKey], [fieldKey]: value } };
      save(next);
      return next;
    });
  };

  const saveAll = (brokerKey) => {
    save(config);
    setSaved(prev => ({ ...prev, [brokerKey]: true }));
    setTimeout(() => setSaved(prev => ({ ...prev, [brokerKey]: false })), 2000);
  };

  const testConnection = async (broker) => {
    setTesting(prev => ({ ...prev, [broker.key]: true }));
    setTestResult(prev => ({ ...prev, [broker.key]: null }));
    const cfg = config[broker.key] || {};

    try {
      let ok = false, msg = '';

      if (broker.key === 'profit') {
        const port = cfg.port || '51777';
        const r = await fetch(`http://localhost:${port}/ping`, { signal: AbortSignal.timeout(3000) });
        ok = r.ok;
        msg = ok ? `✅ Profit Pro respondeu na porta ${port}` : `❌ Erro ${r.status}`;
      } else if (broker.key === 'toro') {
        const r = await fetch('https://api.toro.com.br/v1/account', {
          headers: { Authorization: `Bearer ${cfg.token || ''}` },
          signal: AbortSignal.timeout(5000),
        });
        ok = r.ok;
        msg = ok ? '✅ Token Toro válido' : `❌ ${r.status === 401 ? 'Token inválido' : `Erro ${r.status}`}`;
      } else if (broker.key === 'binance') {
        const r = await fetch('https://api.binance.com/api/v3/ping', { signal: AbortSignal.timeout(5000) });
        ok = r.ok;
        msg = ok ? '✅ Binance acessível — insira as chaves para operar' : '❌ Binance inacessível';
      } else if (broker.key === 'xp') {
        msg = '⚠️ Teste manual necessário — consulte o portal XP Developers';
        ok = null;
      }

      setTestResult(prev => ({ ...prev, [broker.key]: { ok, msg } }));
    } catch (e) {
      const isCors = e.message?.includes('fetch') || e.name === 'TypeError';
      setTestResult(prev => ({
        ...prev,
        [broker.key]: { ok: null, msg: isCors ? '⚠️ CORS — API só acessível via Profit Pro local ou backend' : `❌ ${e.message}` }
      }));
    } finally {
      setTesting(prev => ({ ...prev, [broker.key]: false }));
    }
  };

  const isConfigured = (brokerKey) => {
    const cfg = config[brokerKey] || {};
    const broker = BROKERS.find(b => b.key === brokerKey);
    return broker?.fields.every(f => cfg[f.key]?.trim());
  };

  return (
    <div className="bc-wrap">
      <div className="bc-header">
        <span className="bc-icon">⚙️</span>
        <div>
          <div className="bc-title">Configuração de Corretoras</div>
          <div className="bc-sub">APIs para execução automática de ordens</div>
        </div>
      </div>

      <div className="bc-brokers">
        {BROKERS.map(broker => {
          const cfg = config[broker.key] || {};
          const configured = isConfigured(broker.key);
          const result = testResult[broker.key];

          return (
            <div key={broker.key} className="bc-card" style={{ borderColor: configured ? broker.color + '44' : 'rgba(255,255,255,.08)' }}>
              {/* Card header */}
              <div className="bc-card-header">
                <div className="bc-card-left">
                  <span className="bc-card-icon">{broker.icon}</span>
                  <div>
                    <div className="bc-card-name" style={{ color: configured ? broker.color : 'var(--text-primary)' }}>
                      {broker.name}
                    </div>
                    <div className="bc-card-desc">{broker.desc}</div>
                  </div>
                </div>
                <div className={`bc-status-badge ${configured ? 'configured' : 'not-configured'}`}
                  style={configured ? { color: broker.color, borderColor: broker.color + '44', background: broker.color + '11' } : {}}>
                  {configured ? '✓ Configurado' : '○ Pendente'}
                </div>
              </div>

              {/* Fields */}
              <div className="bc-fields">
                {broker.fields.map(field => (
                  <div key={field.key} className="bc-field">
                    <label className="bc-label">{field.label}</label>
                    <div className="bc-input-row">
                      <input
                        type={show[`${broker.key}_${field.key}`] ? 'text' : field.type}
                        className="bc-input font-mono"
                        placeholder={field.placeholder}
                        value={cfg[field.key] || ''}
                        onChange={e => update(broker.key, field.key, e.target.value)}
                      />
                      {field.type === 'password' && (
                        <button className="bc-eye" onClick={() => setShow(p => ({ ...p, [`${broker.key}_${field.key}`]: !p[`${broker.key}_${field.key}`] }))}>
                          {show[`${broker.key}_${field.key}`] ? '🙈' : '👁'}
                        </button>
                      )}
                    </div>
                    <div className="bc-hint">{field.hint}</div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="bc-actions">
                <button className="bc-test-btn" onClick={() => testConnection(broker)} disabled={testing[broker.key]}>
                  {testing[broker.key] ? '⟳ Testando...' : '🔌 Testar Conexão'}
                </button>
                <button className="bc-save-btn" onClick={() => saveAll(broker.key)}
                  style={{ borderColor: broker.color + '66', color: broker.color, background: broker.color + '11' }}>
                  {saved[broker.key] ? '✓ Salvo!' : '💾 Salvar'}
                </button>
              </div>

              {result && (
                <div className={`bc-test-result ${result.ok === true ? 'ok' : result.ok === false ? 'err' : 'warn'}`}>
                  {result.msg}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bc-disclaimer">
        🔒 Todas as chaves são salvas <strong>somente no seu navegador</strong> (localStorage). Nunca são enviadas para servidores externos.
      </div>

      <style jsx="true">{`
        .bc-wrap {
          background: linear-gradient(135deg,rgba(8,10,18,.97),rgba(12,16,28,.97));
          border: 1px solid rgba(99,149,255,.15);
          border-radius: 16px; padding: 1.4rem;
          display: flex; flex-direction: column; gap: 1.2rem;
        }
        .bc-header {
          display: flex; align-items: center; gap: .75rem;
          padding-bottom: .9rem; border-bottom: 1px solid rgba(255,255,255,.06);
        }
        .bc-icon { font-size: 1.6rem; }
        .bc-title { font-size: 1rem; font-weight: 800; color: var(--text-primary); }
        .bc-sub { font-size: .62rem; color: var(--text-muted); margin-top: 2px; }

        .bc-brokers { display: flex; flex-direction: column; gap: .85rem; }

        .bc-card {
          border: 1px solid; border-radius: 12px;
          padding: .95rem; display: flex; flex-direction: column; gap: .75rem;
          background: rgba(255,255,255,.02); transition: border-color .3s;
        }
        .bc-card-header { display: flex; align-items: center; justify-content: space-between; gap: .5rem; }
        .bc-card-left { display: flex; align-items: center; gap: .65rem; }
        .bc-card-icon { font-size: 1.4rem; }
        .bc-card-name { font-size: .82rem; font-weight: 800; }
        .bc-card-desc { font-size: .6rem; color: var(--text-muted); margin-top: 1px; }
        .bc-status-badge {
          font-size: .58rem; font-weight: 800; padding: 3px 8px; border-radius: 20px;
          border: 1px solid; white-space: nowrap;
        }
        .bc-status-badge.not-configured { color: var(--text-muted); border-color: rgba(255,255,255,.1); background: rgba(255,255,255,.04); }
        .bc-status-badge.configured {}

        .bc-fields { display: flex; flex-direction: column; gap: .55rem; }
        .bc-field { display: flex; flex-direction: column; gap: .25rem; }
        .bc-label { font-size: .63rem; font-weight: 700; color: var(--text-secondary); }
        .bc-input-row { display: flex; gap: .35rem; }
        .bc-input {
          flex: 1; padding: .35rem .55rem; border-radius: 7px; font-size: .68rem;
          background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1);
          color: var(--text-primary); transition: border-color .2s;
        }
        .bc-input:focus { outline: none; border-color: rgba(99,149,255,.45); }
        .bc-eye {
          background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1);
          border-radius: 6px; cursor: pointer; font-size: .8rem; padding: 0 .4rem;
          opacity: .6; transition: opacity .2s;
        }
        .bc-eye:hover { opacity: 1; }
        .bc-hint { font-size: .58rem; color: var(--text-muted); line-height: 1.4; }

        .bc-actions { display: flex; gap: .5rem; }
        .bc-test-btn {
          flex: 1; padding: .4rem; border-radius: 7px; font-size: .66rem; font-weight: 700;
          background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.12);
          color: var(--text-secondary); cursor: pointer; transition: all .15s;
        }
        .bc-test-btn:hover:not(:disabled) { background: rgba(255,255,255,.1); }
        .bc-test-btn:disabled { opacity: .5; cursor: not-allowed; }
        .bc-save-btn {
          flex: 1; padding: .4rem; border-radius: 7px; font-size: .66rem; font-weight: 800;
          border: 1px solid; cursor: pointer; transition: all .15s;
        }
        .bc-save-btn:hover { filter: brightness(1.2); }

        .bc-test-result {
          font-size: .63rem; padding: .4rem .6rem; border-radius: 7px; border: 1px solid; line-height: 1.4;
        }
        .bc-test-result.ok   { color: #00ff88; background: rgba(0,255,136,.07); border-color: rgba(0,255,136,.25); }
        .bc-test-result.err  { color: #ff3355; background: rgba(255,51,85,.07);  border-color: rgba(255,51,85,.25); }
        .bc-test-result.warn { color: #fbbf24; background: rgba(251,191,36,.07); border-color: rgba(251,191,36,.25); }

        .bc-disclaimer {
          font-size: .6rem; color: var(--text-muted); padding: .5rem .65rem;
          background: rgba(99,149,255,.05); border: 1px solid rgba(99,149,255,.15);
          border-radius: 8px; line-height: 1.5;
        }
      `}</style>
    </div>
  );
};

export default BrokerConfig;
