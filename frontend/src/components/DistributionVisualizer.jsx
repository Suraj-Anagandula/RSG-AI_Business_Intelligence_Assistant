import React from 'react';
import { PieChart } from 'lucide-react';
import { getCustomIcon } from './IconHelper';

export default function DistributionVisualizer({ data }) {
  if (!data || data.length === 0) return null;

  const firstRow = data[0];
  const keys = Object.keys(firstRow);
  const dimKey = keys.find(k => ['region', 'sales_channel', 'category'].includes(k.toLowerCase())) || keys[0];
  const valKey = keys.find(k => k !== dimKey && typeof firstRow[k] === 'number') || keys[1];

  const totalSum = data.reduce((acc, row) => acc + (Number(row[valKey]) || 0), 0);
  const isCurrency = valKey.toLowerCase().includes('rev') || valKey.toLowerCase().includes('sale') || valKey.toLowerCase().includes('price');

  const palette = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

  return (
    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', margin: '16px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>
        <PieChart size={18} color="#2563eb" />
        <span>Categorical Distribution ({dimKey.replace(/_/g, ' ')})</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        {data.map((item, idx) => {
          const name = item[dimKey];
          const val = Number(item[valKey]) || 0;
          const share = totalSum > 0 ? ((val / totalSum) * 100).toFixed(1) : '0';
          const color = palette[idx % palette.length];

          return (
            <div
              key={idx}
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '14px',
                backgroundColor: '#f8fafc',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color }}>{getCustomIcon(name, 18, color)}</span>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{name}</span>
                </div>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>{share}%</span>
              </div>

              <div style={{ marginTop: '12px' }}>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                  {isCurrency ? `$${val.toLocaleString()}` : val.toLocaleString()}
                </div>
                <div style={{ height: '4px', width: '100%', backgroundColor: '#e2e8f0', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
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
