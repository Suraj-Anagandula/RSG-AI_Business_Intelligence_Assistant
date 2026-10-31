import React, { useState } from 'react';
import { ArrowUpRight, TrendingUp, BarChart3 } from 'lucide-react';

/**
 * Intelligent Visual Component matching user specification (Image 1).
 * Automatically renders a hero KPI, growth/trend badge, and an SVG comparison bar chart
 * derived directly from Markdown tabular data.
 */
export default function ChartVisualizer({ title, subtitle, kpiValue, kpiSubtitle, badgeText, items }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!items || items.length === 0) return null;

  // Calculate scales
  const values = items.map((it) => it.value);
  const maxVal = Math.max(...values, 1);
  const minVal = Math.min(...values, 0);

  // Generate 4 clean Y-axis ticks
  const tickCount = 4;
  const tickInterval = Math.ceil(maxVal / tickCount);
  const adjustedMax = tickInterval * tickCount;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => i * tickInterval);

  const formatTick = (val) => {
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(val % 1000 === 0 ? 0 : 1)}K`;
    if (val === 0) return '$0';
    return `$${val}`;
  };

  return (
    <div className="intelligent-visual-card">
      {/* Top Header Row with Title and Trend Badge */}
      <div className="iv-header-row">
        <div className="iv-title">{title || 'Performance Overview'}</div>
        {badgeText && (
          <div className="iv-badge">
            <ArrowUpRight size={13} />
            <span>{badgeText}</span>
          </div>
        )}
      </div>

      {/* Hero KPI Callout */}
      {kpiValue && (
        <div className="iv-kpi-container">
          <div className="iv-kpi-number">{kpiValue}</div>
          {kpiSubtitle && <div className="iv-kpi-subtitle">{kpiSubtitle}</div>}
        </div>
      )}

      {/* Chart Section Header */}
      <div className="iv-chart-header">
        <div className="iv-chart-title">Comparison breakdown</div>
        {subtitle && <div className="iv-chart-sub">{subtitle}</div>}
      </div>

      {/* Clean SVG / HTML Bar Chart */}
      <div className="iv-chart-viewport">
        {/* Y-Axis Grid Lines */}
        <div className="iv-grid-lines">
          {ticks.slice().reverse().map((tickVal, tIdx) => (
            <div key={tIdx} className="iv-grid-line-row">
              <span className="iv-tick-label">{formatTick(tickVal)}</span>
              <div className="iv-grid-dash" />
            </div>
          ))}
        </div>

        {/* Bars Container */}
        <div className="iv-bars-container">
          {items.map((item, idx) => {
            const heightPercent = adjustedMax > 0 ? (item.value / adjustedMax) * 100 : 0;
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={idx}
                className="iv-bar-col"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Tooltip on hover */}
                {isHovered && (
                  <div className="iv-bar-tooltip">
                    <span className="tooltip-label">{item.label}</span>
                    <span className="tooltip-val">{item.formatted || `$${item.value.toLocaleString()}`}</span>
                  </div>
                )}

                {/* The Bar */}
                <div className="iv-bar-track">
                  <div
                    className={`iv-bar-fill ${isHovered ? 'hovered' : ''}`}
                    style={{ height: `${Math.max(heightPercent, 4)}%` }}
                  />
                </div>

                {/* X-Axis Label */}
                <div className="iv-x-label" title={item.label}>
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
