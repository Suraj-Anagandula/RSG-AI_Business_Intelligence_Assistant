import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
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
  Package,
  Layers,
  Database
} from 'lucide-react';
import MarkdownResponse from './components/MarkdownResponse';
import ErrorBoundary from './components/ErrorBoundary';
import { askQuestion, uploadCsvFile } from './services/apiService';

export default function App() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `### Welcome to your Business AI Assistant

I am your intelligent assistant. I can help you with:
- **Business & Sales Analytics**: Query our sales database for revenue, product rankings, monthly trends, and regional metrics.
- **General Knowledge & Concepts**: Explain business strategy, economics, financial formulas, and technical concepts.
- **Educational & Interview Preparation**: Break down complex questions step-by-step.

Ask me any question below or pick a core exploration topic.`,
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
        followups: response.suggested_followups || [],
        is_success: response.is_success
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `### Error Processing Request\n\n${err.message || 'An unexpected error occurred while processing your question.'}`,
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
      showNotification('Importing and processing CSV dataset...');
      const result = await uploadCsvFile(file);
      showNotification(`Success: ${result.message}`);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `### Database Updated Successfully\n\nLoaded **${result.loaded_records}** clean records into PostgreSQL.\n- **Raw Rows Processed**: ${result.total_raw_rows}\n- **Dropped Anomalies**: ${result.dropped_rows}\n- **Imputed Records**: ${result.imputed_rows}`,
          followups: ['What is the new total revenue?', 'Show top products', 'What is the monthly revenue trend?']
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
        content: `### New Session Started\n\nAsk me any question regarding company sales records, general business theory, educational concepts, or interview preparation.`,
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
      {/* Left Closable Sidebar (Monochromatic, zero overlap) */}
      <aside className={`sidebar ${isSidebarOpen ? '' : 'closed'}`}>
        <div className="sidebar-inner">
          <button className="new-chat-btn" onClick={handleNewChat} title="Start new session">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={16} />
              <span>New conversation</span>
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

            <span className="assistant-title">Business AI Assistant</span>
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
              <div key={idx} className="message-turn-container">
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
                      {/* Intelligent Markdown + Visual Component Renderer */}
                      <ErrorBoundary>
                        <MarkdownResponse content={msg.content} />
                      </ErrorBoundary>

                      {/* Discrete SQL Query Accordion (Clean, no noisy tags) */}
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
            {/* Quick Suggestions Horizontal Pills */}
            <div className="suggestions-horizontal-bar">
              {[
                'What is the total revenue?',
                'Which product generated the highest revenue?',
                'What is the monthly revenue trend?',
                'Which sales channel is more profitable?',
                'Explain how gross margin differs from net margin.'
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

            {/* Input Form */}
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
                placeholder="Ask any question about sales, products, trends, or business concepts..."
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
    <div className="query-accordion-wrapper">
      <button
        className="query-accordion-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Code size={12} />
        <span>{isOpen ? 'Hide SQL Query' : 'View SQL Query'}</span>
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
