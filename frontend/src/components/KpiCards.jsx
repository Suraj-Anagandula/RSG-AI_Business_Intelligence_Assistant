import React from 'react';

export default function KpiCards({ kpis }) {
  if (!kpis) return null;

  return (
    <div className="kpi-grid">
      <div className="kpi-card">
        <div className="kpi-title">Total Revenue</div>
        <div className="kpi-value">${kpis.total_revenue?.toLocaleString() || '0'}</div>
        <div className="kpi-subtext">Completed transactions</div>
      </div>

      <div className="kpi-card">
        <div className="kpi-title">Completed Orders</div>
        <div className="kpi-value">
          {kpis.completed_orders || 0} / {kpis.total_orders || 0}
        </div>
        <div className="kpi-subtext">
          {kpis.returned_orders || 0} returned order
        </div>
      </div>

      <div className="kpi-card">
        <div className="kpi-title">Top Revenue Product</div>
        <div className="kpi-value" style={{ fontSize: '18px' }}>
          {kpis.top_product || 'N/A'}
        </div>
        <div className="kpi-subtext">Highest total sales</div>
      </div>

      <div className="kpi-card">
        <div className="kpi-title">Top Sales Region</div>
        <div className="kpi-value">{kpis.top_region || 'N/A'}</div>
        <div className="kpi-subtext">Leading regional volume</div>
      </div>
    </div>
  );
}

