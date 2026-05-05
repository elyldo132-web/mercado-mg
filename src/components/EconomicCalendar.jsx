import React from 'react';

const EconomicCalendar = () => {
  const events = [
    { time: '09:00', event: 'IPCA (Mensal)', impact: 'High', currency: 'BRL', status: 'Upcoming' },
    { time: '10:30', event: 'Payroll (EUA)', impact: 'High', currency: 'USD', status: '1h 20m' },
    { time: '14:00', event: 'Decisão Taxa Juros (Fed)', impact: 'High', currency: 'USD', status: 'Upcoming' },
    { time: '18:30', event: 'Fluxo Cambial', impact: 'Medium', currency: 'BRL', status: 'Upcoming' },
  ];

  return (
    <div className="economic-calendar glass animate-fade-in">
      <div className="calendar-header">
        <h4 className="title">Calendário Econômico</h4>
        <span className="date-badge">{new Date().toLocaleDateString('pt-BR')}</span>
      </div>
      <div className="calendar-list">
        {events.map((ev, idx) => (
          <div key={idx} className={`event-item impact-${ev.impact.toLowerCase()}`}>
            <div className="event-time font-mono">{ev.time}</div>
            <div className="event-info">
              <span className="event-name">{ev.event}</span>
              <span className="event-meta">
                <span className="currency-badge">{ev.currency}</span>
                <span className="status-text">{ev.status}</span>
              </span>
            </div>
            <div className={`impact-indicator strength-${ev.impact.toLowerCase()}`}>
              {ev.impact === 'High' ? '!!!' : '!!'}
            </div>
          </div>
        ))}
      </div>

      <style jsx="true">{`
        .economic-calendar {
          padding: 1rem;
          border-radius: 8px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          margin-top: 1rem;
        }

        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--border-color);
        }

        .title {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--text-muted);
          font-weight: 700;
          margin: 0;
        }

        .date-badge {
          font-size: 0.6rem;
          padding: 2px 6px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
          color: var(--text-secondary);
        }

        .calendar-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .event-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem;
          border-radius: 4px;
          background: rgba(0, 0, 0, 0.2);
          border-left: 3px solid transparent;
          transition: transform 0.2s;
        }

        .event-item:hover {
          transform: translateX(4px);
          background: rgba(255, 255, 255, 0.03);
        }

        .event-item.impact-high { border-left-color: var(--accent-red); }
        .event-item.impact-medium { border-left-color: var(--accent-gold); }

        .event-time {
          font-size: 0.75rem;
          color: var(--text-secondary);
          min-width: 40px;
        }

        .event-info {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .event-name {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .event-meta {
          display: flex;
          gap: 0.5rem;
          font-size: 0.6rem;
          margin-top: 2px;
        }

        .currency-badge {
          color: var(--text-muted);
          font-weight: 700;
        }

        .status-text {
          color: var(--accent-green);
        }

        .impact-indicator {
          font-size: 0.7rem;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .strength-high { color: var(--accent-red); }
        .strength-medium { color: var(--accent-gold); }
      `}</style>
    </div>
  );
};

export default EconomicCalendar;
