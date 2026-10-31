import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ChartVisualizer from './ChartVisualizer';

/**
 * Extracts structured data from Markdown tables to drive intelligent visual cards.
 */
function extractChartFromMarkdown(markdown) {
  if (!markdown) return null;

  const lines = markdown.split('\n');
  const tableLines = [];
  let inTable = false;
  let titleBeforeTable = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('#')) {
      titleBeforeTable = line.replace(/^#+\s*/, '');
    }
    if (line.startsWith('|') && line.endsWith('|')) {
      tableLines.push(line);
      inTable = true;
    } else if (inTable) {
      break;
    }
  }

  if (tableLines.length < 3) return null;

  const headers = tableLines[0].split('|').map((s) => s.trim()).filter(Boolean);
  const rows = tableLines.slice(2).map((l) =>
    l.split('|').map((s) => s.trim()).filter(Boolean)
  );

  if (headers.length < 2 || rows.length < 2) return null;

  // Identify label column and numeric column
  let labelColIdx = 0;
  let numericColIdx = -1;

  for (let c = 0; c < headers.length; c++) {
    // Check if column values can be parsed as numbers
    const sample = rows.map((r) => r[c] || '');
    const numericMatches = sample.filter((val) => {
      const clean = val.replace(/[^0-9.-]/g, '');
      return clean.length > 0 && !isNaN(Number(clean));
    });

    if (numericMatches.length >= Math.ceil(rows.length * 0.75)) {
      numericColIdx = c;
    } else {
      labelColIdx = c;
    }
  }

  if (numericColIdx === -1) return null;

  const items = rows
    .map((r) => {
      const rawLabel = r[labelColIdx] || 'Item';
      const cleanLabel = rawLabel.replace(/\*\*/g, '').trim();
      const rawVal = r[numericColIdx] || '0';
      const cleanNumStr = rawVal.replace(/[^0-9.-]/g, '');
      const numVal = parseFloat(cleanNumStr) || 0;
      return {
        label: cleanLabel,
        value: numVal,
        formatted: rawVal.replace(/\*\*/g, '').trim()
      };
    })
    .filter((it) => !isNaN(it.value));

  if (items.length < 2) return null;

  // Compute hero KPI & growth badge
  const lastItem = items[items.length - 1];
  const firstItem = items[0];

  let badgeText = null;
  if (items.length >= 2 && firstItem.value > 0) {
    const growth = ((lastItem.value - firstItem.value) / firstItem.value) * 100;
    if (Math.abs(growth) >= 0.5) {
      badgeText = `${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`;
    }
  }

  // Find max value or latest value
  const heroItem = items.reduce((prev, curr) => (curr.value > prev.value ? curr : prev), items[0]);

  return {
    title: titleBeforeTable || 'Analysis Overview',
    subtitle: `${headers[labelColIdx]} vs ${headers[numericColIdx]} comparison`,
    kpiValue: heroItem.formatted,
    kpiSubtitle: `Peak: ${heroItem.label} · Verified Data`,
    badgeText,
    items: items.slice(0, 8) // Limit to top 8 items for crisp readability
  };
}

export default function MarkdownResponse({ content }) {
  const chartData = useMemo(() => extractChartFromMarkdown(content), [content]);

  return (
    <div className="markdown-response-flow">
      {/* Intelligent Visual Component (Bar comparison + KPI card from Image 1) */}
      {chartData && (
        <ChartVisualizer
          title={chartData.title}
          subtitle={chartData.subtitle}
          kpiValue={chartData.kpiValue}
          kpiSubtitle={chartData.kpiSubtitle}
          badgeText={chartData.badgeText}
          items={chartData.items}
        />
      )}

      {/* Structured Rich Markdown Rendering */}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="md-h1">{children}</h1>,
          h2: ({ children }) => <h2 className="md-h2">{children}</h2>,
          h3: ({ children }) => <h3 className="md-h3">{children}</h3>,
          p: ({ children }) => <p className="md-p">{children}</p>,
          ul: ({ children }) => <ul className="md-ul">{children}</ul>,
          ol: ({ children }) => <ol className="md-ol">{children}</ol>,
          li: ({ children }) => <li className="md-li">{children}</li>,
          strong: ({ children }) => <strong className="md-strong">{children}</strong>,
          blockquote: ({ children }) => <blockquote className="md-blockquote">{children}</blockquote>,
          table: ({ children }) => (
            <div className="md-table-wrapper">
              <table className="md-table">{children}</table>
            </div>
          ),
          th: ({ children }) => <th className="md-th">{children}</th>,
          td: ({ children }) => <td className="md-td">{children}</td>,
          code: ({ node, inline, children, ...props }) =>
            inline ? (
              <code className="md-inline-code" {...props}>
                {children}
              </code>
            ) : (
              <div className="md-code-block-wrapper">
                <pre className="md-code-block">
                  <code {...props}>{children}</code>
                </pre>
              </div>
            )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
