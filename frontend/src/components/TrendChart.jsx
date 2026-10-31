import React from 'react';
import { BarChart3 } from 'lucide-react';

export default function TrendChart({ data }) {
  if (!data || data.length === 0) return null;

  // Check if data has monthly structure
  const hasMonth = 'month' in data[0];
  const revKey = 'monthly_revenue' in data[0] ? 'monthly_revenue' : ('revenue' in data[0] ? 'revenue' : null);

  if (!hasMonth || !revKey) return null;

  const maxVal = Math.max(...data.map((d) => d[revKey] || 0));

  return (
    <div className="chart-container">
      <div className="table-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <BarChart3 size={18} />
        <span>Monthly Revenue Visualizer</span>
      </div>

      <div className="chart-bars">
        {data.map((item, idx) => {
          const val = item[revKey] || 0;
          const heightPercent = maxVal > 0 ? (val / maxVal) * 100 : 0;
          return (
            <div key={idx} className="chart-bar-col">
              <span className="chart-bar-val">${Math.round(val / 1000)}k</span>
              <div
                className="chart-bar-fill"
                style={{ height: `${Math.max(heightPercent, 5)}%` }}
                title={`${item.month}: $${val.toLocaleString()}`}
              />
              <span className="chart-bar-label">{item.month}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

