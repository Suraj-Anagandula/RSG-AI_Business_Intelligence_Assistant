import React, { useState } from 'react';
import DataTable from './DataTable';

export default function PerformanceCard({
  monthlyData = [],
  records = [],
}) {
  const [activeView, setActiveView] = useState('chart'); // 'chart' or 'table'
  const [hoveredBar, setHoveredBar] = useState(null);

  // Fallback monthly data if still loading from backend
  const defaultMonthly = [
    { month: '2026-01', revenue: 210250, orders: 8 },
    { month: '2026-02', revenue: 234600, orders: 8 },
    { month: '2026-03', revenue: 223900, orders: 8 },
    { month: '2026-04', revenue: 240700, orders: 8 },
    { month: '2026-05', revenue: 318500, orders: 8 }, // Peak month
    { month: '2026-06', revenue: 217250, orders: 9 },
  ];

  const trend = monthlyData.length > 0 ? monthlyData : defaultMonthly;
  const maxRevenue = Math.max(...trend.map(d => d.revenue || 0), 350000);

  const getMonthLabel = (mStr) => {
    if (!mStr) return '';
    const parts = mStr.split('-');
    if (parts.length < 2) return mStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const idx = parseInt(parts[1], 10) - 1;
    return `${months[idx] || parts[1]} 2026`;
  };

  return (
    <div className="luminare-card performance-card">
      <div className="performance-header">
        <div>
          <h3 className="card-title">Platform Performance</h3>
          <p className="card-subtitle">Track revenue and order volume across all months in 2026</p>
        </div>

        {/* View Toggles */}
        <div className="performance-toggles">
          <button
            className={`toggle-btn ${activeView === 'chart' ? 'active' : ''}`}
            onClick={() => setActiveView('chart')}
          >
            Monthly Trend
          </button>
          <button
            className={`toggle-btn ${activeView === 'table' ? 'active' : ''}`}
            onClick={() => setActiveView('table')}
          >
            Data Records ({records.length || 50})
          </button>
        </div>
      </div>

      {activeView === 'chart' ? (
        <div className="performance-chart-body">
          {/* Y-Axis Labels */}
          <div className="chart-y-axis">
            <span>$400k</span>
            <span>$300k</span>
            <span>$200k</span>
            <span>$100k</span>
            <span>0</span>
          </div>

          {/* Chart Bars Container */}
          <div className="chart-bars-area">
            {trend.map((item, idx) => {
              const heightPct = Math.min(100, Math.round(((item.revenue || 0) / maxRevenue) * 100));
              const isPeak = item.month === '2026-05' || item.revenue === Math.max(...trend.map(d => d.revenue));
              const isHovered = hoveredBar === idx;

              return (
                <div
                  key={item.month || idx}
                  className="bar-column-wrapper"
                  onMouseEnter={() => setHoveredBar(idx)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  {/* Floating Tooltip */}
                  {(isPeak || isHovered) && (
                    <div className={`bar-tooltip ${isPeak ? 'peak-tooltip' : ''}`}>
                      <div className="tooltip-title">{getMonthLabel(item.month)}</div>
                      <div className="tooltip-amount">${Number(item.revenue).toLocaleString()}</div>
                      <div className="tooltip-orders">{item.orders} orders {isPeak ? '(Peak Month 🚀)' : ''}</div>
                    </div>
                  )}

                  {/* The Bar */}
                  <div className="bar-track">
                    <div
                      className={`bar-fill ${isPeak ? 'peak-bar' : ''}`}
                      style={{ height: `${heightPct}%` }}
                    >
                      {/* Top striped cap matching Luminare style */}
                      {isPeak && <div className="bar-striped-cap"></div>}
                    </div>
                  </div>

                  {/* X-Axis Label */}
                  <span className="bar-x-label">{getMonthLabel(item.month).split(' ')[0]}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="performance-table-body">
          <DataTable data={records} pageSize={10} />
        </div>
      )}
    </div>
  );
}
