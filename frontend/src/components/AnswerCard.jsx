import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, Code, ChevronDown, ChevronUp, Zap, Sparkles } from 'lucide-react';

export default function AnswerCard({ result, onSelectFollowup }) {
  const [showSql, setShowSql] = useState(true);

  if (!result) return null;

  const isSuccess = result.is_success;
  const isSecurityViolation = result.query_type === 'security_violation';

  return (
    <div className="result-card">
      <div className="result-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span className="question-badge">
            {result.query_type ? result.query_type.replace(/_/g, ' ').toUpperCase() : 'QUERY RESULT'}
          </span>
          {result.engine_source && (
            <span
              style={{
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: '4px',
                backgroundColor: '#f1f5f9',
                color: '#475569',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: '500'
              }}
            >
              <Zap size={12} color="#2563eb" />
              {result.engine_source} ({result.execution_time_ms || 0} ms)
            </span>
          )}
        </div>

        <div className={`status-badge ${isSuccess ? 'success' : 'error'}`}>
          {isSuccess ? (
            <>
              <CheckCircle2 size={16} />
              <span>Verified Database Result</span>
            </>
          ) : (
            <>
              <AlertTriangle size={16} />
              <span>{isSecurityViolation ? 'Security Blocked' : 'Notice'}</span>
            </>
          )}
        </div>
      </div>

      <div className={`answer-text ${!isSuccess ? 'answer-error' : ''}`}>
        {result.answer}
      </div>

      {result.sql_query && (
        <div>
          <button
            onClick={() => setShowSql(!showSql)}
            style={{
              background: 'none',
              border: 'none',
              color: '#475569',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '10px',
              padding: '0'
            }}
          >
            <Code size={14} />
            <span>{showSql ? 'Hide SQL Query' : 'View SQL Query'}</span>
            {showSql ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showSql && (
            <div className="sql-section">
              <div className="sql-title">Executed PostgreSQL Query</div>
              <pre>{result.sql_query}</pre>
            </div>
          )}
        </div>
      )}

      {/* Proactive Agentic Follow-up Suggestions */}
      {result.suggested_followups && result.suggested_followups.length > 0 && (
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Sparkles size={14} color="#2563eb" />
            <span>Proactive Follow-up Insights (Agentic AI):</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {result.suggested_followups.map((followup, idx) => (
              <button
                key={idx}
                onClick={() => onSelectFollowup && onSelectFollowup(followup)}
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '16px',
                  padding: '5px 12px',
                  fontSize: '12px',
                  color: '#1e293b',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#eff6ff';
                  e.currentTarget.style.borderColor = '#93c5fd';
                  e.currentTarget.style.color = '#1d4ed8';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                  e.currentTarget.style.color = '#1e293b';
                }}
              >
                {followup}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
