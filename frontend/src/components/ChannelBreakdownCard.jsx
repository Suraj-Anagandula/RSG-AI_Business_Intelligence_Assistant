import React from 'react';
import { Globe, Store, MoreHorizontal } from 'lucide-react';

export default function ChannelBreakdownCard({ channels = [] }) {
  // Fallbacks if backend is loading
  const defaultOnline = { channel: 'Online', orders: 29, revenue: 752750 };
  const defaultRetail = { channel: 'Retail', orders: 20, revenue: 692450 };

  const onlineData = channels.find(c => c.channel?.toLowerCase() === 'online') || defaultOnline;
  const retailData = channels.find(c => c.channel?.toLowerCase() === 'retail') || defaultRetail;

  // Generate 36 small bar segments to simulate the visual breakdown pattern in the reference image
  const totalOrders = (onlineData.orders || 29) + (retailData.orders || 20);
  const onlineCount = Math.round((onlineData.orders / totalOrders) * 36);

  return (
    <div className="luminare-card breakdown-card">
      <div className="card-top-row">
        <span className="card-title">Sales Channel Performance</span>
        <button className="card-options-btn" title="Options">
          <MoreHorizontal size={15} />
        </button>
      </div>

      <div className="channel-stats-row">
        <div className="channel-stat-item">
          <div className="stat-num-row">
            <span className="stat-dot coral"></span>
            <span className="stat-num">{retailData.orders || 20}</span>
          </div>
          <span className="stat-desc">Retail Orders (${(retailData.revenue / 1000).toFixed(1)}k)</span>
        </div>

        <div className="channel-stat-item">
          <div className="stat-num-row">
            <span className="stat-dot purple"></span>
            <span className="stat-num">{onlineData.orders || 29}</span>
          </div>
          <span className="stat-desc">Online Orders (${(onlineData.revenue / 1000).toFixed(1)}k)</span>
        </div>

        <div className="channel-stat-item">
          <div className="stat-num-row">
            <span className="stat-dot yellow"></span>
            <span className="stat-num">52.1%</span>
          </div>
          <span className="stat-desc">Online Share</span>
        </div>
      </div>

      {/* Stylized Segmented Graphic (like Luminare reference) */}
      <div className="channel-segmented-bars">
        {Array.from({ length: 36 }).map((_, idx) => {
          let colorClass = 'bar-coral';
          if (idx >= 14 && idx < 28) colorClass = 'bar-purple';
          else if (idx >= 28) colorClass = 'bar-yellow';

          return (
            <div
              key={idx}
              className={`segmented-mini-bar ${colorClass}`}
              style={{
                height: `${24 + ((idx * 7) % 18)}px`,
              }}
              title={idx < 14 ? 'Retail Transaction' : idx < 28 ? 'Online Transaction' : 'Direct Transaction'}
            />
          );
        })}
      </div>
    </div>
  );
}
