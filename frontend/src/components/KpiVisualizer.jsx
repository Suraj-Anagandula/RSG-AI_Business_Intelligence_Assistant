import React from 'react';
import { TrendingUp, DollarSign, Activity } from 'lucide-react';

export default function KpiVisualizer({ data }) {
  if (!data || data.length === 0) return null;

  const firstRow = data[0];
  const keys = Object.keys(firstRow);
  const primaryKey = keys[0];
  const primaryVal = firstRow[primaryKey];

  const isCurrency = primaryKey.toLowerCase().includes('rev') ||
                     primaryKey.toLowerCase().includes('price') ||
                     primaryKey.toLowerCase().includes('sale') ||
                     primaryKey.toLowerCase().includes('profit') ||
                     primaryKey.toLowerCase().includes('discount') ||
                     primaryKey.toLowerCase().includes('avg');

  const formattedVal = typeof primaryVal === 'number'
    ? (isCurrency ? `$${primaryVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : primaryVal.toLocaleString())
    : String(primaryVal);

  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '24px',
      margin: '16px 0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      display: 'flex',
      alignItems: 'center',
      gap: '20px'
    }}>
      <div style={{
        backgroundColor: '#eff6ff',
        color: '#2563eb',
        padding: '16px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {isCurrency ? <DollarSign size={32} /> : <Activity size={32} />}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {primaryKey.replace(/_/g, ' ')}
        </div>
        <div style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a', margin: '4px 0' }}>
          {formattedVal}
        </div>
        {keys.length > 1 && (
          <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '13px', color: '#475569' }}>
            {keys.slice(1).map(k => (
              <span key={k}>
                <strong>{k.replace(/_/g, ' ')}:</strong> {typeof firstRow[k] === 'number' ? firstRow[k].toLocaleString() : String(firstRow[k])}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

