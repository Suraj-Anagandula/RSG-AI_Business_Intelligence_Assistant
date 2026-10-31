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
    if (idx === 0) return <span style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '2px 6px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>#1 Top</span>;
    if (idx === 1) return <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>#2</span>;
    if (idx === 2) return <span style={{ backgroundColor: '#ffedd5', color: '#c2410c', padding: '2px 6px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>#3</span>;
    return <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '600' }}>#{idx + 1}</span>;
  };

  const isCurrency = (valKey || '').toLowerCase().includes('rev') ||
                     (valKey || '').toLowerCase().includes('sale') ||
                     (valKey || '').toLowerCase().includes('price');

  return (
    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', margin: '14px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>
        <Trophy size={16} color="#d97706" />
        <span>Performance Leaderboard ({nameKey.replace(/_/g, ' ')})</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {data.slice(0, 5).map((item, idx) => {
          const name = item[nameKey];
          const val = Number(item[valKey]) || 0;
          const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;

          return (
            <div key={idx} style={{ padding: '8px 12px', backgroundColor: idx === 0 ? '#f8fafc' : '#ffffff', border: '1px solid #f1f5f9', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {getRankBadge(idx)}
                  <div style={{ color: '#2563eb', display: 'flex', alignItems: 'center' }}>
                    {getCustomIcon(name, 16, '#2563eb')}
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{name}</span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                  {isCurrency ? `$${val.toLocaleString()}` : val.toLocaleString()}
                </div>
              </div>

              <div style={{ height: '4px', width: '100%', backgroundColor: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, backgroundColor: idx === 0 ? '#2563eb' : '#60a5fa', borderRadius: '2px' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
