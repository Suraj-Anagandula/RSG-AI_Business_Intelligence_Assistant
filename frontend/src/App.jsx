import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  User,
  Send,
  Upload,
  RotateCcw,
  Code,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import DataVisualizer from './components/DataVisualizer';
import ErrorBoundary from './components/ErrorBoundary';
import { askQuestion, uploadCsvFile } from './services/apiService';

// Highlights figures, percentages, currency, and quoted entity names in the answer
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
          style={{
            fontWeight: '700',
            color: isQuote ? '#1d4ed8' : '#0f172a',
            backgroundColor: isQuote ? '#eff6ff' : '#f1f5f9',
            padding: '1px 5px',
            borderRadius: '4px',
            margin: '0 2px'
          }}
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
      content: 'Hello! I am your AI Sales Assistant. Ask me any question about our sales, revenue, products, channels, or regional performance.',
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

    // Add user message
    const userMessage = { role: 'user', content: query };
    setMessages((prev) => [...prev, userMessage]);
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
          content: err.message || 'An error occurred while analyzing your request.',
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
      showNotification('Importing and updating sales data...');
      const result = await uploadCsvFile(file);
      showNotification(`Success: ${result.message}`);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Data Updated: Successfully loaded ${result.loaded_records} records into the sales database.`,
          followups: ['What is the new total revenue?', 'Show top products']
        }
      ]);
    } catch (err) {
      showNotification(`Error: ${err.message}`);
    } finally {
      event.target.value = '';
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Chat cleared. Ask me any business question regarding sales, products, or revenue performance.',
        followups: [
          'What is the total revenue?',
          'Which product generated the highest revenue?',
          'What is the monthly revenue trend?'
        ]
      }
    ]);
  };

  return (
    <div className="chat-app">
      {/* Clean Header */}
      <header className="chat-navbar">
        <div className="brand-wrapper">
          <div className="brand-badge">
            <Bot size={20} />
          </div>
          <div>
            <div className="brand-title">AI Sales Assistant</div>
            <div className="brand-subtitle">Business Intelligence & Analytics</div>
          </div>
        </div>

        <div className="nav-actions">
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept=".csv"
            onChange={handleFileUpload}
          />
          <button
            className="nav-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Import a new sales CSV in one click"
          >
            <Upload size={14} />
            <span>Import CSV</span>
          </button>

          <button className="nav-btn" onClick={handleClearChat} title="Clear conversation">
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
        </div>
      </header>

      {/* Messages Stream */}
      <div className="messages-stream">
        {messages.map((msg, idx) => (
          <div key={idx} className={msg.role === 'user' ? 'message-row-user' : 'message-row-assistant'}>
            {msg.role === 'assistant' && (
              <div className="assistant-avatar">
                <Bot size={18} />
              </div>
            )}

            {msg.role === 'user' ? (
              <div className="user-bubble">{msg.content}</div>
            ) : (
              <div className="assistant-content">
                {/* Highlighted Clean Answer */}
                <div className="assistant-text">
                  {renderHighlightedText(msg.content)}
                </div>

                {/* Contextual Visualizer (Only when appropriate) */}
                {msg.data && msg.data.length > 0 && (
                  <ErrorBoundary>
                    <DataVisualizer result={msg} />
                  </ErrorBoundary>
                )}

                {/* Discrete Query View */}
                {msg.sql && (
                  <SqlAccordion sql={msg.sql} />
                )}

                {/* Dynamic Proactive Follow-ups */}
                {msg.followups && msg.followups.length > 0 && (
                  <div className="followups-container">
                    <div className="followups-title">
                      <Sparkles size={13} color="#2563eb" />
                      <span>Suggested Follow-ups:</span>
                    </div>
                    <div className="followup-chips">
                      {msg.followups.map((q, fIdx) => (
                        <button
                          key={fIdx}
                          className="followup-chip"
                          onClick={() => handleSend(q)}
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
          <div className="message-row-assistant">
            <div className="assistant-avatar">
              <Bot size={18} />
            </div>
            <div className="assistant-content" style={{ padding: '12px 18px' }}>
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

      {/* Bottom Input Area */}
      <footer className="chat-input-wrapper">
        <div className="preset-suggestions">
          {[
            'What is the total revenue?',
            'Which product generated the highest revenue?',
            'What is the monthly revenue trend?',
            'Which sales channel has higher sales?',
            'Which region generated the highest sales?'
          ].map((promptText, pIdx) => (
            <button
              key={pIdx}
              className="preset-chip"
              onClick={() => handleSend(promptText)}
            >
              {promptText}
            </button>
          ))}
        </div>

        <form
          className="input-box-container"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <input
            type="text"
            className="chat-input-field"
            placeholder="Ask a question about sales, products, revenue, or trends..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <button type="submit" className="send-btn" disabled={isLoading || !input.trim()}>
            <Send size={15} />
          </button>
        </form>
      </footer>

      {notification && <div className="toast-msg">{notification}</div>}
    </div>
  );
}

function SqlAccordion({ sql }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ marginTop: '10px' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'none',
          border: 'none',
          color: '#94a3b8',
          fontSize: '11px',
          fontWeight: '500',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 0'
        }}
      >
        <Code size={12} />
        <span>{isOpen ? 'Hide Query' : 'View Query'}</span>
        {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {isOpen && (
        <pre style={{
          marginTop: '6px',
          backgroundColor: '#0f172a',
          color: '#e2e8f0',
          padding: '10px 14px',
          borderRadius: '6px',
          fontSize: '11px',
          fontFamily: 'monospace',
          overflowX: 'auto',
          whiteSpace: 'pre-wrap'
        }}>
          {sql}
        </pre>
      )}
    </div>
  );
}
