import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';

const ResultCharts = ({ data }) => {
  if (!data || data.length === 0) return null;

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '300px' }}>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorDiv" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis 
            dataKey="year" 
            stroke="var(--text-muted)" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="var(--text-muted)" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--bg-card)', 
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--text-main)'
            }}
            itemStyle={{ color: 'var(--text-main)' }}
          />
          <Legend />
          <Area 
            type="monotone" 
            dataKey="totalValue" 
            name="Patrimônio"
            stroke="var(--primary)" 
            fillOpacity={1} 
            fill="url(#colorValue)" 
          />
          <Area 
            type="monotone" 
            dataKey="cumulativeDividends" 
            name="Dividendos Acumulados"
            stroke="var(--accent)" 
            fillOpacity={1} 
            fill="url(#colorDiv)" 
          />
          {data.find(d => d.cumulativeDividends > data[0].totalValue) && (
            <ReferenceLine 
              x={data.find(d => d.cumulativeDividends > data[0].totalValue).year} 
              stroke="var(--secondary)" 
              strokeDasharray="5 5"
              label={{ value: 'PONTO DE INFLEXÃO', fill: 'var(--secondary)', fontSize: 10, position: 'top' }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ResultCharts;
