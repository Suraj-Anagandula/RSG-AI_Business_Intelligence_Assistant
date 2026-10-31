import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Paperclip,
  Plus,
  Table,
  Terminal,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  ArrowUp,
  HelpCircle
} from 'lucide-react';
import DataTable from './DataTable';
import DataVisualizer from './DataVisualizer';
import ErrorBoundary from './ErrorBoundary';

// Focus-grabbing highlight renderer for currency, numbers, and key entities
function renderFocusText(text) {
  if (!text) return null;

  // Split markdown bold (**text**) first, then currency and percentages
  const tokens = text.split(/(\*\*[^*]+\*\*|\$[\d,]+(?:\.\d+)?|\b\d+(?:\.\d+)?%)/g);

  return tokens.map((token, i) => {
    if (!token) return null;

    if (token.startsWith('**') && token.endsWith('**')) {
      const inner = token.slice(2, -2);
      return (
        <span key={i} className="focus-bold-entity">
          {inner}
        </span>
      );
    }

    if (/^\$[\d,]+(?:\.\d+)?$/.test(token)) {
      return (
        <span key={i} className="focus-currency-badge">
          {token}
        </span>
      );
    }

    if (/^\d+(?:\.\d+)?%$/.test(token)) {
      return (
        <span key={i} className="focus-percent-badge">
          {token}
        </span>
      );
    }

    return token;
  });
}

export default function ChatAssistant({
  messages = [],
  onSendMessage,
  onResetChat,
  onUploadCsv,
  isLoading = false,
}) {
  const [input, setInput] = useState('');
  const [expandedRecords, setExpandedRecords] = useState({});
  const [expandedSql, setExpandedSql] = useState({});
  const [copiedIndex, setCopiedIndex] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const sampleChips = [
    { label: 'Total Revenue', q: 'What is the total revenue?' },
    { label: 'Top Product', q: 'Which product generated the highest revenue?' },
    { label: 'Monthly Trend', q: 'What is the monthly revenue trend?' },
    { label: 'Top Region', q: 'Which region generated the highest sales?' },
    { label: 'MoM Change', q: 'How did revenue change between two months?' },
    { label: 'All Products', q: 'List all products' },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    const query = input.trim();
    if (!query || isLoading) return;
    onSendMessage(query);
    setInput('');
  };

  const handleChipClick = (q) => {
    if (isLoading) return;
    onSendMessage(q);
  };

  const toggleRecords = (idx) => {
    setExpandedRecords(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleSql = (idx) => {
    setExpandedSql(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleCopySql = (sql, idx) => {
    navigator.clipboard.writeText(sql);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadCsv(file);
      e.target.value = '';
    }
  };

  return (
    <div className="luminare-chat-panel">
      {/* Hidden File Picker for Paperclip */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv"
        style={{ display: 'none' }}
      />

      {/* Chat Header */}
      <div className="chat-panel-header">
        <div className="chat-title-group">
          <div className="chat-coral-badge">
            <Sparkles size={15} color="#ffffff" />
          </div>
          <span className="chat-panel-title">Chat AI Assistant</span>
        </div>
        <button
          className="chat-new-btn"
          onClick={onResetChat}
          title="New Conversation"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Quick Inquiry Chips */}
      <div className="chat-quick-chips">
        {sampleChips.map((chip, idx) => (
          <button
            key={idx}
            className="quick-chip-btn"
            onClick={() => handleChipClick(chip.q)}
            disabled={isLoading}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="chat-messages-container">
        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-message-row ${msg.role}`}>
            {msg.role === 'user' ? (
              <div className="user-bubble">
                {msg.content}
              </div>
            ) : (
              <div className="ai-response-card">
                {/* AI Card Meta */}
                <div className="ai-card-meta">
                  <div className="ai-brand-pill">
                    <Sparkles size={12} color="#ff5733" />
                    <span>Luminare Intelligence</span>
                  </div>
                  {msg.execution_time_ms && (
                    <span className="ai-latency-tag">
                      {msg.execution_time_ms}ms
                    </span>
                  )}
                </div>

                {/* Highlight-grabbed Natural Answer */}
                <div className="ai-card-answer">
                  {renderFocusText(msg.content)}
                </div>

                {/* Contextual Visualizer (if trend, ranking, or distribution is requested) */}
                {msg.visualization_type && msg.visualization_type !== 'none' && msg.visualization_type !== 'table' && msg.data && (
                  <div className="ai-card-visualizer">
                    <ErrorBoundary>
                      <DataVisualizer
                        visualizationType={msg.visualization_type}
                        data={msg.data}
                        businessInsight={msg.business_insight}
                      />
                    </ErrorBoundary>
                  </div>
                )}

                {/* Action Badges with Custom Icons for Records and SQL */}
                {((msg.data && msg.data.length > 0) || msg.sql) && (
                  <div className="ai-action-badges-row">
                    {msg.data && msg.data.length > 0 && (
                      <button
                        className={`action-badge-pill ${expandedRecords[idx] ? 'active' : ''}`}
                        onClick={() => toggleRecords(idx)}
                      >
                        <Table size={13} style={{ color: '#ff5733' }} />
                        <span>Data Records ({msg.data.length})</span>
                        {expandedRecords[idx] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                    )}

                    {msg.sql && (
                      <button
                        className={`action-badge-pill ${expandedSql[idx] ? 'active' : ''}`}
                        onClick={() => toggleSql(idx)}
                      >
                        <Terminal size={13} style={{ color: '#ff5733' }} />
                        <span>PostgreSQL Query</span>
                        {expandedSql[idx] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                    )}
                  </div>
                )}

                {/* Collapsible Records View */}
                {expandedRecords[idx] && msg.data && (
                  <div className="collapsible-section records-section">
                    <DataTable data={msg.data} pageSize={6} />
                  </div>
                )}

                {/* Collapsible SQL Query View */}
                {expandedSql[idx] && msg.sql && (
                  <div className="collapsible-section sql-section">
                    <div className="sql-card-header">
                      <div className="sql-badge-text">
                        <Terminal size={12} />
                        <span>SQL Statement (Read-Only)</span>
                      </div>
                      <button
                        className="sql-copy-btn"
                        onClick={() => handleCopySql(msg.sql, idx)}
                        title="Copy SQL Query"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check size={12} color="#10b981" />
                            <span style={{ color: '#10b981' }}>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="sql-code-block">
                      <code>{msg.sql}</code>
                    </pre>
                  </div>
                )}

                {/* Suggested Follow-Ups */}
                {msg.followups && msg.followups.length > 0 && (
                  <div className="ai-followups-container">
                    <div className="followups-label">
                      <Sparkles size={11} color="#ff5733" />
                      <span>SUGGESTED FOLLOW-UPS</span>
                    </div>
                    <div className="followups-pills">
                      {msg.followups.map((q, fIdx) => (
                        <button
                          key={fIdx}
                          className="followup-pill-btn"
                          onClick={() => handleChipClick(q)}
                          disabled={isLoading}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="chat-message-row assistant">
            <div className="ai-response-card loading-card">
              <div className="typing-indicator">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
              <span className="typing-text">Analyzing database records...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Input Capsule */}
      <form className="chat-input-capsule" onSubmit={handleSubmit}>
        <button
          type="button"
          className="capsule-icon-btn"
          onClick={() => fileInputRef.current?.click()}
          title="Upload Sales CSV"
        >
          <Paperclip size={16} />
        </button>

        <input
          type="text"
          className="capsule-text-input"
          placeholder="Ask AI Assistant something..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
        />

        <button
          type="submit"
          className={`capsule-send-btn ${input.trim() ? 'active' : ''}`}
          disabled={!input.trim() || isLoading}
          title="Send Question"
        >
          <ArrowUp size={16} color="#ffffff" />
        </button>
      </form>
    </div>
  );
}
