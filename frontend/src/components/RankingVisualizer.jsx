import React from 'react';
import { Trophy } from 'lucide-react';
import { getCustomIcon } from './IconHelper';

export default function RankingVisualizer({ data }) {
  if (!data || data.length < 2) return null;

  const firstRow = data[0];
  const keys = Object.keys(firstRow);
  if (keys.length < 2) return null;

  const nameKey = keys.find(k => (k || '').toLowerCase().includes('product') ||
                                 (k || '').toLowerCase().includes('name') ||
                                 (k || '').toLowerCase().includes('channel') ||
                                 (k || '').toLowerCase().includes('region')) || keys[0];
  const valKey = keys.find(k => k !== nameKey && typeof firstRow[k] === 'number') || keys.find(k => k !== nameKey);

  if (!nameKey || !valKey) return null;

  const maxVal = Math.max(...data.map(d => Number(d[valKey]) || 0));

  const getRankBadge = (idx) => {
    if (idx === 0) return <span style={{ backgroundColor: '#18181b', color: '#ffffff', padding: '2px 7px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>#1</span>;
    if (idx === 1) return <span style={{ backgroundColor: '#e5e7eb', color: '#1f2937', padding: '2px 7px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>#2</span>;
    if (idx === 2) return <span style={{ backgroundColor: '#f3f4f6', color: '#4b5563', padding: '2px 7px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>#3</span>;
    return <span style={{ color: '#9ca3af', fontSize: '11px', fontWeight: '600' }}>#{idx + 1}</span>;
  };

  const isCurrency = (valKey || '').toLowerCase().includes('rev') ||
                     (valKey || '').toLowerCase().includes('sale') ||
                     (valKey || '').toLowerCase().includes('price');

  return (
    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', margin: '14px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '13px', fontWeight: '700', color: '#111827' }}>
        <Trophy size={16} color="#18181b" />
        <span>Performance Ranking ({nameKey.replace(/_/g, ' ')})</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {data.slice(0, 5).map((item, idx) => {
          const name = item[nameKey];
          const val = Number(item[valKey]) || 0;
          const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;

          return (
            <div key={idx} style={{ padding: '8px 12px', backgroundColor: idx === 0 ? '#f9fafb' : '#ffffff', border: '1px solid #f3f4f6', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {getRankBadge(idx)}
                  <div style={{ color: '#374151', display: 'flex', alignItems: 'center' }}>
                    {getCustomIcon(name, 16, '#374151')}
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>{name}</span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#111827' }}>
                  {isCurrency ? `$${val.toLocaleString()}` : val.toLocaleString()}
                </div>
              </div>

              <div style={{ height: '4px', width: '100%', backgroundColor: '#e5e7eb', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, backgroundColor: idx === 0 ? '#18181b' : '#9ca3af', borderRadius: '2px' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
