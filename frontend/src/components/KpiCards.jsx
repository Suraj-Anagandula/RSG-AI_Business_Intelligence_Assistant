import React from 'react';
import { CreditCard, Package, Monitor, Compass, TrendingUp } from 'lucide-react';

export default function KpiCards({ kpis = {} }) {
  const formatCurrency = (val) => {
    if (!val && val !== 0) return '$1,445,200';
    return `$${Number(val).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  const cards = [
    {
      id: 'revenue',
      icon: <CreditCard size={18} color="#ffffff" />,
      value: formatCurrency(kpis.total_revenue || 1445200),
      badge: '+11.6%',
      badgeType: 'green',
      label: 'Revenue (Completed)',
    },
    {
      id: 'orders',
      icon: <Package size={18} color="#ffffff" />,
      value: `${kpis.completed_orders || 49}`,
      badge: '+53%',
      badgeType: 'green',
      label: 'Orders Placed',
    },
    {
      id: 'product',
      icon: <Monitor size={18} color="#ffffff" />,
      value: kpis.top_product || 'Monitor',
      badge: formatCurrency(kpis.top_product_revenue || 473000),
      badgeType: 'coral',
      label: 'Top Product by Sales',
    },
    {
      id: 'region',
      icon: <Compass size={18} color="#ffffff" />,
      value: kpis.top_region || 'South',
      badge: formatCurrency(kpis.top_region_revenue || 411200),
      badgeType: 'coral',
      label: 'Top Performing Region',
    },
  ];

  return (
    <div className="kpi-cards-grid">
      {cards.map((card) => (
        <div key={card.id} className="luminare-card kpi-card">
          <div className="kpi-header">
            <div className="kpi-icon-badge">{card.icon}</div>
            <div className="kpi-value-row">
              <span className="kpi-value">{card.value}</span>
              <span className={`kpi-trend-pill ${card.badgeType}`}>{card.badge}</span>
            </div>
          </div>
          <div className="kpi-label">{card.label}</div>
        </div>
      ))}
    </div>
  );
}
