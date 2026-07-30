import React, { useState, useRef } from 'react';

const STORAGE_KEY = 'daily_pnl';
const HISTORY_KEY = 'report_history';

const loadToday = () => {
  try {
    const d = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return d.date ? d : null;
  } catch { return null; }
};

const loadHistory = () => {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
};

const saveToHistory = (report) => {
  const hist = loadHistory().filter(r => r.date !== report.date);
  hist.unshift(report);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(hist.slice(0, 90)));
};

const fmtDate = (iso) => {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

const fmtCurrency = (v) => {
  const prefix = v >= 0 ? '+' : '';
  return `${prefix}R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// ── Veredito direto do ativo pesquisado ──────────────────────────────────────

const VERDICT_CFG = {
  'COMPRA':        { label: (a) => `COMPRE ${a}`,        icon: '▲', color: '#00ff88', bg: 'rgba(0,255,136,.09)',  border: 'rgba(0,255,136,.4)'  },
  'VENDA':         { label: (a) => `VENDA ${a}`,         icon: '▼', color: '#ff3355', bg: 'rgba(255,51,85,.09)',  border: 'rgba(255,51,85,.4)'  },
  'SEM OPERAÇÃO':  { label: () => `FIQUE FORA — SEM SINAL CLARO`, icon: '⏸', color: '#fbbf24', bg: 'rgba(251,191,36,.08)', border: 'rgba(251,191,36,.35)' },
};

const AssetVerdict = ({ asset, result }) => {
  const label = asset?.label ?? 'o ativo';

  if (!result) {
    return (
      <div className="av-wrap av-empty">
        <div className="av-empty-title">🔎 Nenhuma análise rodada ainda para {label}</div>
        <div className="av-empty-tip">
          Vá em <strong>Macro Análise → Robô Analista Técnico</strong>, escolha {label} e clique em <strong>ANALISAR AGORA</strong> para gerar o veredito aqui.
        </div>
      </div>
    );
  }

  const v = VERDICT_CFG[result.direction] ?? VERDICT_CFG['SEM OPERAÇÃO'];

  return (
    <div className="av-wrap" style={{ background: v.bg, borderColor: v.border }}>
      <div className="av-verdict-row">
        <span className="av-icon" style={{ color: v.color, textShadow: `0 0 18px ${v.color}` }}>{v.icon}</span>
        <div className="av-main">
          <div className="av-label" style={{ color: v.color }}>{v.label(label)}</div>
          {result.direction !== 'SEM OPERAÇÃO' && (
            <div className="av-sub">{result.score}/5 confluências técnicas · {result.prob}% de probabilidade</div>
          )}
        </div>
      </div>

      {result.direction !== 'SEM OPERAÇÃO' && result.confs?.length > 0 && (
        <div className="av-reasons">
          <div className="av-reasons-title">Por que {result.direction === 'COMPRA' ? 'comprar' : 'vender'}</div>
          {result.confs.map((c, i) => (
            <div key={i} className="av-reason-row">✅ {c}</div>
          ))}
        </div>
      )}

      {result.direction === 'SEM OPERAÇÃO' && result.motivo && (
        <div className="av-reasons">
          <div className="av-reason-row av-reason-wait">⏸ {result.motivo}</div>
        </div>
      )}

      {result.direction !== 'SEM OPERAÇÃO' && result.entry && (
        <div className="av-setup">
          <div className="av-setup-row"><span>📌 Entrada</span><span className="font-mono">{result.entry}</span></div>
          <div className="av-setup-row"><span>🛑 Stop</span><span className="font-mono">{result.stopL}</span></div>
          <div className="av-setup-row"><span>💰 Alvo 1</span><span className="font-mono">{result.t1}</span></div>
          <div className="av-setup-row"><span>💰 Alvo 2</span><span className="font-mono">{result.t2}</span></div>
        </div>
      )}

      <div className="av-disclaimer">⚠️ Baseado em indicadores técnicos (MA9/MA21/MA200, RSI, MACD, volume). Educacional — use sempre stop loss.</div>
    </div>
  );
};

const DailyReport = ({ asset, assetResult }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const printRef = useRef(null);

  const today = new Date().toISOString().slice(0, 10);
  const todayData = loadToday();
  const history = loadHistory();

  // Auto-save today to history
  if (todayData && todayData.date === today && todayData.ops.length > 0) {
    const existing = history.find(h => h.date === today);
    if (!existing || existing.ops.length !== todayData.ops.length) {
      saveToHistory(todayData);
    }
  }

  const allReports = todayData && todayData.date === today
    ? [todayData, ...history.filter(h => h.date !== today)]
    : history;

  const report = allReports.find(r => r.date === selectedDate) || null;

  const wins = report ? report.ops.filter(o => o.valor > 0) : [];
  const losses = report ? report.ops.filter(o => o.valor < 0) : [];
  const totalWins = wins.reduce((s, o) => s + o.valor, 0);
  const totalLosses = losses.reduce((s, o) => s + o.valor, 0);
  const winRate = report && report.ops.length > 0 ? Math.round((wins.length / report.ops.length) * 100) : 0;

  const handlePrint = () => {
    const el = printRef.current;
    if (!el) return;
    const w = window.open('', '_blank', 'width=800,height=600');
    w.document.write(`
      <!DOCTYPE html>
      <html><head>
        <title>Relatório Mercado MG — ${report ? fmtDate(report.date) : selectedDate}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 32px; color: #1a1a2e; background: #fff; }
          .rpt-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #e0e0e0; }
          .rpt-logo { font-size: 20px; font-weight: 900; color: #1a1a2e; }
          .rpt-date { font-size: 14px; color: #666; }
          .rpt-stats { display: flex; gap: 16px; margin-bottom: 20px; }
          .rpt-stat { flex: 1; padding: 14px; border-radius: 8px; border: 1px solid #e0e0e0; text-align: center; }
          .rpt-stat-label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 4px; }
          .rpt-stat-value { font-size: 22px; font-weight: 900; font-family: 'Courier New', monospace; }
          .rpt-stat-value.gain { color: #16a34a; }
          .rpt-stat-value.loss { color: #dc2626; }
          .rpt-stat-value.neutral { color: #1a1a2e; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th { background: #f5f5f5; padding: 8px 12px; text-align: left; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #666; border-bottom: 2px solid #e0e0e0; }
          td { padding: 8px 12px; font-size: 13px; border-bottom: 1px solid #eee; }
          td.gain { color: #16a34a; font-weight: 700; }
          td.loss { color: #dc2626; font-weight: 700; }
          .rpt-footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e0e0e0; font-size: 11px; color: #999; text-align: center; }
          @media print { body { padding: 16px; } }
        </style>
      </head><body>
        <div class="rpt-header">
          <div class="rpt-logo">🚨 Mercado MG — Relatório de Operações</div>
          <div class="rpt-date">${report ? fmtDate(report.date) : ''}</div>
        </div>
        <div class="rpt-stats">
          <div class="rpt-stat">
            <div class="rpt-stat-label">Resultado</div>
            <div class="rpt-stat-value ${report && report.total >= 0 ? 'gain' : 'loss'}">${report ? fmtCurrency(report.total) : '—'}</div>
          </div>
          <div class="rpt-stat">
            <div class="rpt-stat-label">Operações</div>
            <div class="rpt-stat-value neutral">${report ? report.ops.length : 0}</div>
          </div>
          <div class="rpt-stat">
            <div class="rpt-stat-label">Win Rate</div>
            <div class="rpt-stat-value neutral">${winRate}%</div>
          </div>
          <div class="rpt-stat">
            <div class="rpt-stat-label">Ganhos</div>
            <div class="rpt-stat-value gain">${fmtCurrency(totalWins)}</div>
          </div>
          <div class="rpt-stat">
            <div class="rpt-stat-label">Perdas</div>
            <div class="rpt-stat-value loss">${fmtCurrency(totalLosses)}</div>
          </div>
        </div>
        <table>
          <thead><tr><th>#</th><th>Hora</th><th>Operação</th><th>Resultado</th></tr></thead>
          <tbody>
            ${report ? report.ops.map((op, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${op.time}</td>
                <td>${op.desc}</td>
                <td class="${op.valor >= 0 ? 'gain' : 'loss'}">${fmtCurrency(op.valor)}</td>
              </tr>
            `).join('') : '<tr><td colspan="4" style="text-align:center;color:#999;padding:24px">Nenhuma operação registrada</td></tr>'}
          </tbody>
        </table>
        <div class="rpt-footer">Gerado por Mercado MG · ${new Date().toLocaleString('pt-BR')}</div>
      </body></html>
    `);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  const handleShare = async () => {
    if (!report) return;
    const text = [
      `📋 Mercado MG — Relatório ${fmtDate(report.date)}`,
      `💰 Resultado: ${fmtCurrency(report.total)}`,
      `📊 Operações: ${report.ops.length} (Win Rate: ${winRate}%)`,
      `✅ Ganhos: ${fmtCurrency(totalWins)}`,
      `🛑 Perdas: ${fmtCurrency(totalLosses)}`,
      '',
      ...report.ops.map((op, i) => `${i + 1}. ${op.time} — ${op.desc}: ${fmtCurrency(op.valor)}`),
    ].join('\n');

    if (navigator.share) {
      try { await navigator.share({ title: 'Relatório Mercado MG', text }); } catch {}
    } else {
      try { await navigator.clipboard.writeText(text); alert('Relatório copiado!'); } catch {}
    }
  };

  return (
    <div className="dr-wrap">
      <div className="dr-header">
        <div className="dr-title-row">
          <span className="dr-icon">📋</span>
          <div>
            <div className="dr-title">Relatório de Operações</div>
            <div className="dr-sub">Histórico diário com detalhes de cada operação</div>
          </div>
        </div>
        <div className="dr-actions">
          <button className="dr-btn dr-btn-print" onClick={handlePrint} disabled={!report}>🖨 Imprimir / PDF</button>
          <button className="dr-btn dr-btn-share" onClick={handleShare} disabled={!report}>📤 Compartilhar</button>
        </div>
      </div>

      {/* Relatório do ativo pesquisado */}
      <div className="dr-asset-section">
        <div className="dr-asset-title">Relatório do Ativo{asset ? ` — ${asset.icon ?? ''} ${asset.label}` : ''}</div>
        <AssetVerdict asset={asset} result={assetResult} />
      </div>

      {/* Seletor de data */}
      <div className="dr-date-bar">
        <span className="dr-date-label">Data:</span>
        <div className="dr-date-chips">
          {allReports.slice(0, 10).map(r => (
            <button key={r.date}
              className={`dr-date-chip ${selectedDate === r.date ? 'active' : ''}`}
              onClick={() => setSelectedDate(r.date)}>
              {r.date === today ? 'Hoje' : fmtDate(r.date)}
              <span className={`dr-chip-pnl ${r.total >= 0 ? 'gain' : 'loss'}`}>{fmtCurrency(r.total)}</span>
            </button>
          ))}
          {allReports.length === 0 && (
            <span className="dr-empty-hint">Nenhuma operação registrada ainda. Opere com o robô e o relatório aparece aqui.</span>
          )}
        </div>
      </div>

      {/* Resumo */}
      {report && (
        <div ref={printRef}>
          <div className="dr-stats">
            <div className={`dr-stat-card ${report.total >= 0 ? 'gain' : 'loss'}`}>
              <div className="dr-stat-label">Resultado</div>
              <div className="dr-stat-value font-mono">{fmtCurrency(report.total)}</div>
            </div>
            <div className="dr-stat-card neutral">
              <div className="dr-stat-label">Operações</div>
              <div className="dr-stat-value font-mono">{report.ops.length}</div>
            </div>
            <div className="dr-stat-card neutral">
              <div className="dr-stat-label">Win Rate</div>
              <div className="dr-stat-value font-mono">{winRate}%</div>
            </div>
            <div className="dr-stat-card gain">
              <div className="dr-stat-label">Ganhos</div>
              <div className="dr-stat-value font-mono">{fmtCurrency(totalWins)}</div>
            </div>
            <div className="dr-stat-card loss">
              <div className="dr-stat-label">Perdas</div>
              <div className="dr-stat-value font-mono">{fmtCurrency(totalLosses)}</div>
            </div>
          </div>

          {/* Tabela de operações */}
          <div className="dr-table-wrap">
            <table className="dr-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Hora</th>
                  <th>Operação</th>
                  <th>Resultado</th>
                </tr>
              </thead>
              <tbody>
                {report.ops.map((op, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td className="font-mono">{op.time}</td>
                    <td>{op.desc}</td>
                    <td className={`font-mono ${op.valor >= 0 ? 'gain' : 'loss'}`}>{fmtCurrency(op.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style jsx="true">{`
        .dr-wrap {
          background: linear-gradient(135deg,rgba(8,10,18,.97),rgba(12,16,28,.97));
          border: 1px solid rgba(249,115,22,.15);
          border-radius: 16px; padding: 1.4rem;
          display: flex; flex-direction: column; gap: 1rem;
        }
        .dr-header {
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: .75rem;
          padding-bottom: .85rem; border-bottom: 1px solid rgba(255,255,255,.06);
        }
        .dr-title-row { display: flex; align-items: center; gap: .65rem; }
        .dr-icon { font-size: 1.4rem; }
        .dr-title { font-size: 1rem; font-weight: 800; color: var(--text-primary); }
        .dr-sub { font-size: .6rem; color: var(--text-muted); margin-top: 2px; }
        .dr-actions { display: flex; gap: .4rem; }
        .dr-btn {
          padding: .4rem .8rem; border-radius: 8px; font-size: .66rem; font-weight: 800;
          cursor: pointer; border: 1px solid; transition: all .15s;
        }
        .dr-btn:disabled { opacity: .35; cursor: not-allowed; }
        .dr-btn-print {
          background: rgba(249,115,22,.1); border-color: rgba(249,115,22,.35); color: #f97316;
        }
        .dr-btn-print:hover:not(:disabled) { background: rgba(249,115,22,.2); }
        .dr-btn-share {
          background: rgba(99,149,255,.1); border-color: rgba(99,149,255,.35); color: #6395ff;
        }
        .dr-btn-share:hover:not(:disabled) { background: rgba(99,149,255,.2); }

        /* Relatório do ativo */
        .dr-asset-section { display: flex; flex-direction: column; gap: .5rem; }
        .dr-asset-title {
          font-size: .6rem; font-weight: 800; color: var(--text-muted);
          text-transform: uppercase; letter-spacing: .08em;
        }
        .av-wrap {
          border: 1px solid rgba(255,255,255,.08); border-radius: 12px;
          padding: 1rem; display: flex; flex-direction: column; gap: .8rem;
        }
        .av-empty {
          background: rgba(255,255,255,.02); text-align: center; padding: 1.4rem 1rem;
        }
        .av-empty-title { font-size: .78rem; font-weight: 700; color: var(--text-secondary); margin-bottom: .4rem; }
        .av-empty-tip { font-size: .65rem; color: var(--text-muted); line-height: 1.6; }
        .av-verdict-row { display: flex; align-items: center; gap: .8rem; }
        .av-icon { font-size: 2rem; font-weight: 900; line-height: 1; flex-shrink: 0; }
        .av-main { flex: 1; }
        .av-label { font-size: 1.15rem; font-weight: 900; letter-spacing: -.3px; }
        .av-sub { font-size: .65rem; color: var(--text-muted); margin-top: 2px; }
        .av-reasons { display: flex; flex-direction: column; gap: .3rem; }
        .av-reasons-title { font-size: .58rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: .06em; margin-bottom: .1rem; }
        .av-reason-row { font-size: .68rem; color: var(--text-secondary); line-height: 1.5; }
        .av-reason-wait { color: #fbbf24; }
        .av-setup {
          display: grid; grid-template-columns: 1fr 1fr; gap: .4rem .8rem;
          padding: .6rem .7rem; border-radius: 8px; background: rgba(255,255,255,.03);
          border: 1px solid rgba(255,255,255,.06);
        }
        .av-setup-row { display: flex; justify-content: space-between; gap: .5rem; font-size: .65rem; color: var(--text-secondary); }
        .av-disclaimer { font-size: .58rem; color: var(--text-muted); line-height: 1.5; }

        /* Date bar */
        .dr-date-bar { display: flex; align-items: center; gap: .5rem; flex-wrap: wrap; }
        .dr-date-label { font-size: .62rem; font-weight: 700; color: var(--text-muted); }
        .dr-date-chips { display: flex; gap: .35rem; flex-wrap: wrap; }
        .dr-date-chip {
          padding: .3rem .6rem; border-radius: 8px; font-size: .62rem; font-weight: 700;
          background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1);
          color: var(--text-secondary); cursor: pointer; transition: all .15s;
          display: flex; align-items: center; gap: .4rem;
        }
        .dr-date-chip:hover { background: rgba(255,255,255,.08); }
        .dr-date-chip.active {
          background: rgba(249,115,22,.12); border-color: rgba(249,115,22,.4); color: #f97316;
        }
        .dr-chip-pnl { font-size: .55rem; font-weight: 800; font-family: var(--font-mono); }
        .dr-chip-pnl.gain { color: #00ff88; }
        .dr-chip-pnl.loss { color: #ff3355; }
        .dr-empty-hint { font-size: .62rem; color: var(--text-muted); font-style: italic; }

        /* Stats */
        .dr-stats { display: flex; gap: .5rem; flex-wrap: wrap; margin-bottom: .5rem; }
        .dr-stat-card {
          flex: 1; min-width: 100px; padding: .7rem; border-radius: 10px;
          border: 1px solid rgba(255,255,255,.08); text-align: center;
          background: rgba(255,255,255,.02);
        }
        .dr-stat-card.gain { border-color: rgba(0,255,136,.2); }
        .dr-stat-card.loss { border-color: rgba(255,51,85,.2); }
        .dr-stat-label { font-size: .55rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: .04em; margin-bottom: .2rem; }
        .dr-stat-value { font-size: 1rem; font-weight: 900; }
        .dr-stat-card.gain .dr-stat-value { color: #00ff88; }
        .dr-stat-card.loss .dr-stat-value { color: #ff3355; }
        .dr-stat-card.neutral .dr-stat-value { color: var(--text-primary); }

        /* Table */
        .dr-table-wrap { overflow-x: auto; }
        .dr-table {
          width: 100%; border-collapse: collapse;
        }
        .dr-table th {
          padding: .45rem .6rem; text-align: left; font-size: .58rem; font-weight: 800;
          text-transform: uppercase; letter-spacing: .04em; color: var(--text-muted);
          border-bottom: 1px solid rgba(255,255,255,.1); background: rgba(255,255,255,.02);
        }
        .dr-table td {
          padding: .4rem .6rem; font-size: .65rem; color: var(--text-secondary);
          border-bottom: 1px solid rgba(255,255,255,.04);
        }
        .dr-table td.gain { color: #00ff88; font-weight: 800; }
        .dr-table td.loss { color: #ff3355; font-weight: 800; }
        .dr-table tr:hover td { background: rgba(255,255,255,.02); }
      `}</style>
    </div>
  );
};

export default DailyReport;
