import React from 'react';
import { TrendingUp } from 'lucide-react';

export default function TrendVisualizer({ data }) {
  if (!data || data.length === 0) return null;

  const firstRow = data[0];
  const keys = Object.keys(firstRow);
  const timeKey = keys.find(k => ['month', 'order_date', 'date'].includes(k.toLowerCase())) || keys[0];
  const valKey = keys.find(k => k !== timeKey && typeof firstRow[k] === 'number') || keys[1];

  const maxVal = Math.max(...data.map(d => Number(d[valKey]) || 0));
  const isCurrency = valKey.toLowerCase().includes('rev') || valKey.toLowerCase().includes('sale') || valKey.toLowerCase().includes('price');

  return (
    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', margin: '16px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>
        <TrendingUp size={18} color="#2563eb" />
        <span>Time-Series Progression ({timeKey.replace(/_/g, ' ')})</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '14px', height: '180px', paddingTop: '20px', borderBottom: '1px solid #e2e8f0' }}>
        {data.map((item, idx) => {
          const val = Number(item[valKey]) || 0;
          const heightPct = maxVal > 0 ? (val / maxVal) * 100 : 0;
          const isPeak = val === maxVal;

          return (
            <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: '11px', fontWeight: isPeak ? '700' : '500', color: isPeak ? '#2563eb' : '#64748b', marginBottom: '6px' }}>
                {isCurrency ? `$${Math.round(val / 1000)}k` : val}
              </span>
              <div
                style={{
                  width: '100%',
                  maxWidth: '44px',
                  backgroundColor: isPeak ? '#2563eb' : '#93c5fd',
                  borderRadius: '4px 4px 0 0',
                  height: `${Math.max(heightPct, 6)}%`,
                  transition: 'height 0.3s ease'
                }}
                title={`${item[timeKey]}: ${isCurrency ? '$' : ''}${val.toLocaleString()}`}
              />
              <span style={{ fontSize: '11px', color: '#64748b', marginTop: '8px', fontWeight: '500' }}>
                {item[timeKey]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
