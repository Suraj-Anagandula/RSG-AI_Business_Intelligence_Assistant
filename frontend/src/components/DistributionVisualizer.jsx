import React from 'react';
import { PieChart } from 'lucide-react';
import { getCustomIcon } from './IconHelper';

export default function DistributionVisualizer({ data }) {
  if (!data || data.length < 2) return null;

  const firstRow = data[0];
  const keys = Object.keys(firstRow);
  if (keys.length < 2) return null;

  const dimKey = keys.find(k => ['region', 'sales_channel', 'category'].includes((k || '').toLowerCase())) || keys[0];
  const valKey = keys.find(k => k !== dimKey && typeof firstRow[k] === 'number') || keys.find(k => k !== dimKey);

  if (!dimKey || !valKey) return null;

  const totalSum = data.reduce((acc, row) => acc + (Number(row[valKey]) || 0), 0);
  const isCurrency = (valKey || '').toLowerCase().includes('rev') ||
                     (valKey || '').toLowerCase().includes('sale') ||
                     (valKey || '').toLowerCase().includes('price');

  const palette = ['#18181b', '#3f3f46', '#71717a', '#a1a1aa', '#d4d4d8'];

  return (
    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', margin: '14px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', fontSize: '13px', fontWeight: '700', color: '#111827' }}>
        <PieChart size={16} color="#18181b" />
        <span>Categorical Breakdown ({dimKey.replace(/_/g, ' ')})</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
        {data.map((item, idx) => {
          const name = item[dimKey];
          const val = Number(item[valKey]) || 0;
          const share = totalSum > 0 ? ((val / totalSum) * 100).toFixed(1) : '0';
          const color = palette[idx % palette.length];

          return (
            <div
              key={idx}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px',
                backgroundColor: '#f9fafb',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#374151' }}>{getCustomIcon(name, 16, '#374151')}</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>{name}</span>
                </div>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280' }}>{share}%</span>
              </div>

              <div style={{ marginTop: '10px' }}>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>
                  {isCurrency ? `$${val.toLocaleString()}` : val.toLocaleString()}
                </div>
                <div style={{ height: '4px', width: '100%', backgroundColor: '#e5e7eb', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${share}%`, backgroundColor: color, borderRadius: '2px' }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
