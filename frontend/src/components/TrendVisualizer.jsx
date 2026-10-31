import React from 'react';
import { TrendingUp } from 'lucide-react';

export default function TrendVisualizer({ data }) {
  if (!data || data.length < 2) return null;

  const firstRow = data[0];
  const keys = Object.keys(firstRow);
  if (keys.length < 2) return null;

  const timeKey = keys.find(k => ['month', 'order_date', 'date'].includes((k || '').toLowerCase())) || keys[0];
  const valKey = keys.find(k => k !== timeKey && typeof firstRow[k] === 'number') || keys.find(k => k !== timeKey);

  if (!timeKey || !valKey) return null;

  const maxVal = Math.max(...data.map(d => Number(d[valKey]) || 0));
  const isCurrency = (valKey || '').toLowerCase().includes('rev') ||
                     (valKey || '').toLowerCase().includes('sale') ||
                     (valKey || '').toLowerCase().includes('price');

  return (
    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', margin: '14px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>
        <TrendingUp size={16} color="#2563eb" />
        <span>Timeline Progression ({timeKey.replace(/_/g, ' ')})</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '160px', paddingTop: '16px', borderBottom: '1px solid #e2e8f0' }}>
        {data.map((item, idx) => {
          const val = Number(item[valKey]) || 0;
          const heightPct = maxVal > 0 ? (val / maxVal) * 100 : 0;
          const isPeak = val === maxVal;

          return (
            <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: '10px', fontWeight: isPeak ? '700' : '500', color: isPeak ? '#2563eb' : '#64748b', marginBottom: '4px' }}>
                {isCurrency ? `$${Math.round(val / 1000)}k` : val}
              </span>
              <div
                style={{
                  width: '100%',
                  maxWidth: '38px',
                  backgroundColor: isPeak ? '#2563eb' : '#93c5fd',
                  borderRadius: '3px 3px 0 0',
                  height: `${Math.max(heightPct, 6)}%`,
                  transition: 'height 0.3s ease'
                }}
                title={`${item[timeKey]}: ${isCurrency ? '$' : ''}${val.toLocaleString()}`}
              />
              <span style={{ fontSize: '10px', color: '#64748b', marginTop: '6px', fontWeight: '500' }}>
                {item[timeKey]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
