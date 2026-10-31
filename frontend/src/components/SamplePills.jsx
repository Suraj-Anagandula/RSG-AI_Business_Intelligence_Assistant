import React from 'react';
import { HelpCircle } from 'lucide-react';

export default function SamplePills({ sampleQuestions, onSelectQuestion }) {
  if (!sampleQuestions || sampleQuestions.length === 0) return null;

  return (
    <div className="sample-section">
      <div className="section-label">
        <HelpCircle size={15} />
        <span>Try Example Business Questions:</span>
      </div>
      <div className="sample-pills">
        {sampleQuestions.map((item) => (
          <button
            key={item.id}
            className="sample-pill"
            onClick={() => onSelectQuestion(item.question)}
          >
            {item.question}
          </button>
        ))}
      </div>
    </div>
  );
}

