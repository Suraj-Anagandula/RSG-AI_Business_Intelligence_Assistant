import React, { useState } from 'react';
import { Table, Lightbulb } from 'lucide-react';
import RankingVisualizer from './RankingVisualizer';
import DistributionVisualizer from './DistributionVisualizer';
import TrendVisualizer from './TrendVisualizer';
import DataTable from './DataTable';

export default function DataVisualizer({ result }) {
  const [showRawTable, setShowRawTable] = useState(false);

  if (!result || !result.data || result.data.length === 0) return null;

  const visType = result.visualization_type || 'none';
  const insight = result.business_insight;

  // Don't render anything if visType is 'none' and no special insight
  const hasVisualization = ['trend', 'ranking', 'distribution'].includes(visType);

  return (
    <div style={{ marginTop: '12px' }}>
      {/* Strategic Observation (only if relevant context) */}
      {insight && (
        <div style={{
          backgroundColor: '#f8fafc',
          borderLeft: '3px solid #2563eb',
          borderRadius: '4px',
          padding: '8px 12px',
          fontSize: '12px',
          color: '#334155',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '10px'
        }}>
          <Lightbulb size={14} color="#2563eb" />
          <span><strong>Observation:</strong> {insight}</span>
        </div>
      )}

      {/* Render pictorial representation ONLY when specifically needed by context */}
      {visType === 'ranking' && <RankingVisualizer data={result.data} />}
      {visType === 'distribution' && <DistributionVisualizer data={result.data} />}
      {visType === 'trend' && <TrendVisualizer data={result.data} />}

      {/* Discrete Supporting Table Toggle */}
      {result.data.length > 0 && (
        <div style={{ marginTop: '6px' }}>
          <button
            onClick={() => setShowRawTable(!showRawTable)}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontSize: '11px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 0'
            }}
          >
            <Table size={12} />
            <span>{showRawTable ? 'Hide Supporting Records' : `View Data Records (${result.data.length})`}</span>
          </button>

          {showRawTable && <DataTable data={result.data} />}
        </div>
      )}
    </div>
  );
}
