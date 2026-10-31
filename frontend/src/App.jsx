import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  User,
  Send,
  Upload,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  Code,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Compass,
  Store,
  DollarSign,
  Package
} from 'lucide-react';
import DataVisualizer from './components/DataVisualizer';
import ErrorBoundary from './components/ErrorBoundary';
import { askQuestion, uploadCsvFile } from './services/apiService';

// Renders numbers, currency, percentages, and quoted entities in clean monochromatic pills
function renderHighlightedText(text) {
  if (!text) return null;

  const regex = /(\$[\d,]+(?:\.\d+)?|\b\d{1,3}(?:,\d{3})+(?:\.\d+)?\b|\b\d+(?:\.\d+)?%|'[^']+'|"[^"]+")/g;
  const parts = text.split(regex);

  return parts.map((part, i) => {
    if (regex.test(part)) {
      const isQuote = part.startsWith("'") || part.startsWith('"');
      return (
        <span
          key={i}
          className={isQuote ? 'highlight-entity' : 'highlight-pill'}
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

export default function App() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am your AI Business Intelligence Assistant. Ask me any question about our sales, revenue, products, channels, or regional performance.',
      followups: [
        'What is the total revenue?',
        'Which product generated the highest revenue?',
        'What is the monthly revenue trend?',
        'Which sales channel is more profitable: Online or Retail?',
        'Which region generated the highest sales?'
      ]
    }
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [notification, setNotification] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (questionText) => {
    const query = (questionText || input).trim();
    if (!query || isLoading) return;

    // Append user query
    setMessages((prev) => [...prev, { role: 'user', content: query }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await askQuestion(query);
      const assistantMessage = {
        role: 'assistant',
        content: response.answer,
        sql: response.sql_query,
        data: response.data,
        visualization_type: response.visualization_type,
        business_insight: response.business_insight,
        followups: response.suggested_followups || [],
        is_success: response.is_success
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: err.message || 'An error occurred while analyzing the dataset.',
          is_success: false
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      showNotification('Importing and updating database records...');
      const result = await uploadCsvFile(file);
      showNotification(`Success: ${result.message}`);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Data Updated: Successfully loaded ${result.loaded_records} records into the PostgreSQL database.`,
          followups: ['What is the new total revenue?', 'Show top products']
        }
      ]);
    } catch (err) {
      showNotification(`Error: ${err.message}`);
    } finally {
      event.target.value = '';
    }
  };

  const handleNewChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'New session started. Ask me any business question regarding sales, products, channels, or revenue performance.',
        followups: [
          'What is the total revenue?',
          'Which product generated the highest revenue?',
          'What is the monthly revenue trend?'
        ]
      }
    ]);
  };

  const presetShortcuts = [
    { label: 'Total Revenue', icon: <DollarSign size={15} />, query: 'What is the total revenue?' },
    { label: 'Top Revenue Product', icon: <Package size={15} />, query: 'Which product generated the highest revenue?' },
    { label: 'Monthly Trend', icon: <TrendingUp size={15} />, query: 'What is the monthly revenue trend?' },
    { label: 'Regional Sales', icon: <Compass size={15} />, query: 'Which region generated the highest sales?' },
    { label: 'Channel Comparison', icon: <Store size={15} />, query: 'Which sales channel is more profitable: Online or Retail?' }
  ];

  return (
    <div className="app-layout">
      {/* Left Closable Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? '' : 'closed'}`}>
        <div className="sidebar-inner">
          <button className="new-chat-btn" onClick={handleNewChat} title="Start new conversation">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={16} />
              <span>New inquiry</span>
            </div>
          </button>

          <div className="sidebar-section-title">Core Explorations</div>
          <nav className="sidebar-nav-list">
            {presetShortcuts.map((item, idx) => (
              <button
                key={idx}
                className="sidebar-nav-item"
                onClick={() => handleSend(item.query)}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="sidebar-footer">
            <div className="status-indicator">
              <div className="status-dot" />
              <span>PostgreSQL 16 Connected</span>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".csv"
              onChange={handleFileUpload}
            />
            <button
              className="upload-action-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Import a new CSV into PostgreSQL"
            >
              <Upload size={14} />
              <span>Import CSV to DB</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Chat Column */}
      <main className="main-chat-container">
        {/* Top Navbar */}
        <header className="chat-navbar">
          <div className="nav-left">
            <button
              className="toggle-sidebar-btn"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              title={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              {isSidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
            </button>

            <span className="assistant-title">AI Business Intelligence Assistant</span>
          </div>

          <button
            className="toggle-sidebar-btn"
            onClick={handleNewChat}
            title="Reset conversation"
          >
            <RotateCcw size={15} />
          </button>
        </header>

        {/* Scrollable Message Thread */}
        <div className="chat-scroll-area">
          <div className="chat-center-wrapper">
            {messages.map((msg, idx) => (
              <div key={idx}>
                {msg.role === 'user' ? (
                  <div className="chat-bubble-user-row">
                    <div className="chat-bubble-user">{msg.content}</div>
                  </div>
                ) : (
                  <div className="chat-bubble-assistant-row">
                    <div className="assistant-avatar">
                      <Bot size={18} />
                    </div>

                    <div className="assistant-card">
                      {/* Highlighted Conversational Answer */}
                      <div className="response-prose">
                        {renderHighlightedText(msg.content)}
                      </div>

                      {/* Data-Adaptive Pictorial Representation */}
                      {msg.data && msg.data.length > 0 && (
                        <ErrorBoundary>
                          <DataVisualizer result={msg} />
                        </ErrorBoundary>
                      )}

                      {/* Discrete Query View */}
                      {msg.sql && (
                        <QueryAccordion sql={msg.sql} />
                      )}

                      {/* Contextual Proactive Follow-ups */}
                      {msg.followups && msg.followups.length > 0 && (
                        <div className="followups-wrapper">
                          <div className="followups-headline">
                            <Sparkles size={12} color="#18181b" />
                            <span>Suggested Follow-ups</span>
                          </div>
                          <div className="followups-pill-row">
                            {msg.followups.map((q, fIdx) => (
                              <button
                                key={fIdx}
                                className="followup-pill-btn"
                                onClick={() => handleSend(q)}
                              >
                                {q}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Typing Loader */}
            {isLoading && (
              <div className="chat-bubble-assistant-row">
                <div className="assistant-avatar">
                  <Bot size={18} />
                </div>
                <div className="assistant-card" style={{ padding: '12px 18px', width: 'fit-content' }}>
                  <div className="typing-dots">
                    <div className="dot" />
                    <div className="dot" />
                    <div className="dot" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Bottom Input Area in Normal Flex Flow (Zero Overlap Guaranteed) */}
        <footer className="chat-input-bottom-zone">
          <div className="input-capsule-container">
            {/* Quick Suggestions Pills */}
            <div className="suggestions-horizontal-bar">
              {[
                'What is the total revenue?',
                'Which product generated the highest revenue?',
                'What is the monthly revenue trend?',
                'Which sales channel is more profitable?',
                'Which region generated the highest sales?'
              ].map((promptText, pIdx) => (
                <button
                  key={pIdx}
                  className="suggestion-pill-tag"
                  onClick={() => handleSend(promptText)}
                >
                  {promptText}
                </button>
              ))}
            </div>

            {/* Input Box */}
            <form
              className="input-box"
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
            >
              <input
                type="text"
                className="chat-textarea"
                placeholder="Ask any question about sales, products, revenue, or trends..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="submit"
                className="send-btn-black"
                disabled={isLoading || !input.trim()}
                title="Send query"
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        </footer>
      </main>

      {notification && <div className="toast-bar">{notification}</div>}
    </div>
  );
}

function QueryAccordion({ sql }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        className="query-accordion-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Code size={12} />
        <span>{isOpen ? 'Hide Query' : 'View Query'}</span>
        {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {isOpen && (
        <pre className="query-code-snippet">
          {sql}
        </pre>
      )}
    </div>
  );
}
