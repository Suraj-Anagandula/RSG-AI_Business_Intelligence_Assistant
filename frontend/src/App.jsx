import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  User,
  Send,
  Upload,
  Database,
  Sparkles,
  Code,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Zap
} from 'lucide-react';
import DataVisualizer from './components/DataVisualizer';
import { askQuestion, uploadCsvFile, fetchHealth } from './services/apiService';

export default function App() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am your AI Sales BI Assistant. Ask me any dynamic question about sales revenue, products, channels, discounts, or monthly performance.',
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
        execution_time_ms: response.execution_time_ms,
        engine_source: response.engine_source,
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
      showNotification('Uploading and ingesting CSV into database...');
      const result = await uploadCsvFile(file);
      showNotification(`Success: ${result.message}`);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Data Updated: Successfully cleaned and imported ${result.loaded_records} records into PostgreSQL. You can now ask questions on the new data!`,
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
      {/* Top Navbar */}
      <header className="chat-navbar">
        <div className="brand-wrapper">
          <div className="brand-badge">
            <Bot size={20} />
          </div>
          <div>
            <div className="brand-title">AI Business Intelligence Assistant</div>
            <div className="brand-subtitle">Dynamic Sales Analytics Powered by PostgreSQL & Gemini</div>
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
            title="Import a new CSV into PostgreSQL in one click"
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
                {/* Engine Source Badge */}
                {msg.engine_source && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '11px', color: '#64748b' }}>
                    <Zap size={12} color="#2563eb" />
                    <span>{msg.engine_source} ({msg.execution_time_ms || 0} ms)</span>
                  </div>
                )}

                {/* Natural Answer */}
                <div className="assistant-text">{msg.content}</div>

                {/* Pictorial Representation as Per Data Suited */}
                {msg.data && msg.data.length > 0 && (
                  <DataVisualizer result={msg} />
                )}

                {/* Collapsible SQL Query Block */}
                {msg.sql && (
                  <SqlAccordion sql={msg.sql} />
                )}

                {/* Dynamic Proactive Follow-ups */}
                {msg.followups && msg.followups.length > 0 && (
                  <div className="followups-container">
                    <div className="followups-title">
                      <Sparkles size={13} color="#2563eb" />
                      <span>Suggested Follow-up Inquiries:</span>
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

        {/* Loading / Typing indicator */}
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

      {/* Floating Bottom Input Area (Like ChatGPT) */}
      <footer className="chat-input-wrapper">
        {/* Quick Suggestion Pills */}
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

        {/* Input Bar */}
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
            placeholder="Ask any dynamic question about sales, products, regions, or trends..."
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
    <div className="sql-accordion">
      <div className="sql-header" onClick={() => setIsOpen(!isOpen)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Code size={13} />
          <span>Executed PostgreSQL Query</span>
        </div>
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </div>
      {isOpen && <pre className="sql-code">{sql}</pre>}
    </div>
  );
}
