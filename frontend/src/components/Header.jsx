import React from 'react';
import { Sparkles, Search, Settings, PanelLeftClose, PanelLeftOpen, MessageSquare, LayoutDashboard } from 'lucide-react';

export default function Header({
  activeTab = 'dashboard',
  setActiveTab,
  isDashboardOpen,
  setIsDashboardOpen,
  isChatOpen,
  setIsChatOpen,
}) {
  return (
    <header className="luminare-header">
      {/* Brand Logo */}
      <div className="header-brand">
        <div className="brand-logo-badge">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="#ffffff" />
          </svg>
        </div>
        <span className="brand-name">Luminare</span>
      </div>

      {/* Navigation Pills */}
      <nav className="header-nav">
        <button
          className={`nav-pill ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={`nav-pill ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          Performance
        </button>
        <button
          className={`nav-pill ${activeTab === 'records' ? 'active' : ''}`}
          onClick={() => setActiveTab('records')}
        >
          Data Explorer
        </button>
      </nav>

      {/* Right Controls */}
      <div className="header-actions">
        {/* Toggle Left Dashboard */}
        <button
          className="action-icon-btn"
          onClick={() => setIsDashboardOpen(!isDashboardOpen)}
          title={isDashboardOpen ? 'Collapse Left Dashboard' : 'Expand Left Dashboard'}
        >
          {isDashboardOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
        </button>

        {/* Toggle Chat Assistant */}
        <button
          className={`action-icon-btn ${isChatOpen ? 'active-icon' : ''}`}
          onClick={() => setIsChatOpen(!isChatOpen)}
          title={isChatOpen ? 'Hide Chat Assistant' : 'Show Chat Assistant'}
        >
          <MessageSquare size={16} />
        </button>

        <button className="action-icon-btn" title="Search Analytics">
          <Search size={16} />
        </button>
        <button className="action-icon-btn" title="Settings">
          <Settings size={16} />
        </button>

        {/* User Avatar */}
        <div className="user-avatar" title="Executive User">
          <span className="avatar-text">AI</span>
          <span className="online-indicator"></span>
        </div>
      </div>
    </header>
  );
}
