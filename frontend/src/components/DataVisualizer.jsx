import React, { useState } from 'react';
import { Table, BarChart3, Lightbulb } from 'lucide-react';
import KpiVisualizer from './KpiVisualizer';
import RankingVisualizer from './RankingVisualizer';
import DistributionVisualizer from './DistributionVisualizer';
import TrendVisualizer from './TrendVisualizer';
import DataTable from './DataTable';

export default function DataVisualizer({ result }) {
  const [showRawTable, setShowRawTable] = useState(false);

  if (!result || !result.data || result.data.length === 0) return null;

  const visType = result.visualization_type || 'table';
  const insight = result.business_insight;

  return (
    <div style={{ marginTop: '16px' }}>
      {/* Hidden-in-logic Strategic Business Insight */}
      {insight && (
        <div style={{
          backgroundColor: '#eff6ff',
          borderLeft: '4px solid #2563eb',
          borderRadius: '4px',
          padding: '10px 14px',
          fontSize: '13px',
          color: '#1e40af',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '14px'
        }}>
          <Lightbulb size={16} color="#2563eb" />
          <span><strong>Business Observation:</strong> {insight}</span>
        </div>
      )}

      {/* Pictorial Representation as Per Data Suited */}
      {visType === 'kpi' && <KpiVisualizer data={result.data} />}
      {visType === 'ranking' && <RankingVisualizer data={result.data} />}
      {visType === 'distribution' && <DistributionVisualizer data={result.data} />}
      {visType === 'trend' && <TrendVisualizer data={result.data} />}

      {/* Toggle Raw Data Table View */}
      <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={() => setShowRawTable(!showRawTable)}
          style={{
            background: 'none',
            border: 'none',
            color: '#64748b',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <Table size={13} />
          <span>{showRawTable ? 'Hide Supporting Records' : `View Supporting Records (${result.data.length} rows)`}</span>
        </button>
      </div>

      {(showRawTable || visType === 'table') && (
        <DataTable data={result.data} />
      )}
    </div>
  );
}
