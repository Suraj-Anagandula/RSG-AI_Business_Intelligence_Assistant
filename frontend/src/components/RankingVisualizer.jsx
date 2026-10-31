import React from 'react';
import { Award, Trophy } from 'lucide-react';
import { getCustomIcon } from './IconHelper';

export default function RankingVisualizer({ data }) {
  if (!data || data.length === 0) return null;

  const firstRow = data[0];
  const keys = Object.keys(firstRow);
  const nameKey = keys.find(k => k.toLowerCase().includes('product') || k.toLowerCase().includes('name') || k.toLowerCase().includes('channel') || k.toLowerCase().includes('region')) || keys[0];
  const valKey = keys.find(k => k !== nameKey && typeof firstRow[k] === 'number') || keys[1];

  const maxVal = Math.max(...data.map(d => Number(d[valKey]) || 0));

  const getRankBadge = (idx) => {
    if (idx === 0) return <span style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '700' }}>#1 Top</span>;
    if (idx === 1) return <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '700' }}>#2</span>;
    if (idx === 2) return <span style={{ backgroundColor: '#ffedd5', color: '#c2410c', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '700' }}>#3</span>;
    return <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>#{idx + 1}</span>;
  };

  return (
    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', margin: '16px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>
        <Trophy size={18} color="#d97706" />
        <span>Performance Leaderboard ({nameKey.replace(/_/g, ' ')})</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {data.slice(0, 6).map((item, idx) => {
          const name = item[nameKey];
          const val = Number(item[valKey]) || 0;
          const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
          const isCurrency = valKey.toLowerCase().includes('rev') || valKey.toLowerCase().includes('sale') || valKey.toLowerCase().includes('price');

          return (
            <div key={idx} style={{ padding: '10px 14px', backgroundColor: idx === 0 ? '#f8fafc' : '#ffffff', border: '1px solid #f1f5f9', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {getRankBadge(idx)}
                  <div style={{ color: '#2563eb', display: 'flex', alignItems: 'center' }}>
                    {getCustomIcon(name, 18, '#2563eb')}
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{name}</span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                  {isCurrency ? `$${val.toLocaleString()}` : val.toLocaleString()}
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ height: '6px', width: '100%', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, backgroundColor: idx === 0 ? '#2563eb' : '#60a5fa', borderRadius: '3px' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
