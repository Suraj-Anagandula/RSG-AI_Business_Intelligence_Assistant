import React from 'react';
import { MoreHorizontal } from 'lucide-react';

export default function FulfillmentGaugeCard({
  completionRate = 98.0,
  completedRevenue = 1445200,
  returnedRevenue = 32000,
}) {
  return (
    <div className="luminare-card gauge-card">
      <div className="card-top-row">
        <span className="card-title">Fulfillment & Margins</span>
        <button className="card-options-btn" title="Options">
          <MoreHorizontal size={15} />
        </button>
      </div>

      <div className="gauge-content-row">
        {/* Semi-circular Arch */}
        <div className="semi-gauge-wrapper">
          <svg viewBox="0 0 160 90" className="semi-gauge-svg">
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ff5733" />
                <stop offset="60%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
            </defs>
            {/* Background Arch */}
            <path
              d="M 15 80 A 65 65 0 0 1 145 80"
              fill="none"
              stroke="#f3f4f6"
              strokeWidth="14"
              strokeLinecap="round"
            />
            {/* Value Arch (98% fill) */}
            <path
              d="M 15 80 A 65 65 0 0 1 143 76"
              fill="none"
              stroke="url(#gaugeGradient)"
              strokeWidth="14"
              strokeLinecap="round"
            />
          </svg>
          <div className="gauge-center-text">
            <span className="gauge-label">Fulfillment</span>
            <span className="gauge-value">{completionRate}%</span>
          </div>
        </div>

        {/* Breakdown Stats */}
        <div className="gauge-metrics-list">
          <div className="gauge-metric-item">
            <div className="metric-header">
              <span className="metric-dot coral"></span>
              <span className="metric-name">Completed</span>
            </div>
            <div className="metric-num-row">
              <span className="metric-val">${(completedRevenue / 1000).toLocaleString()}k</span>
              <span className="metric-pill green">+11.6%</span>
            </div>
          </div>

          <div className="gauge-metric-item">
            <div className="metric-header">
              <span className="metric-dot red"></span>
              <span className="metric-name">Returns</span>
            </div>
            <div className="metric-num-row">
              <span className="metric-val">${(returnedRevenue / 1000).toLocaleString()}k</span>
              <span className="metric-pill red">-1.58%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
