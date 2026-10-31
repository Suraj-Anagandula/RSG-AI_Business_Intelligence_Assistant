import React from 'react';
import { Table, Download } from 'lucide-react';

export default function DataTable({ data }) {
  if (!data || data.length === 0) return null;

  const columns = Object.keys(data[0]);

  const formatCellValue = (val) => {
    if (typeof val === 'number') {
      return Number.isInteger(val) ? val.toLocaleString() : val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    if (val === null || val === undefined) return '-';
    return String(val);
  };

  const handleDownloadCsv = () => {
    if (!data || data.length === 0) return;
    const headers = columns.join(',');
    const rows = data.map((row) =>
      columns.map((col) => {
        let val = row[col];
        if (typeof val === 'string' && val.includes(',')) {
          return `"${val}"`;
        }
        return val !== null && val !== undefined ? val : '';
      }).join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'sales_query_results.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="table-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div className="table-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <Table size={18} />
          <span>Supporting Database Records ({data.length} rows)</span>
        </div>
        <button
          onClick={handleDownloadCsv}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: '500',
            cursor: 'pointer',
            color: '#334155'
          }}
          title="Download records as CSV for Excel"
        >
          <Download size={14} />
          <span>Export CSV</span>
        </button>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col}>{col.replace(/_/g, ' ')}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx}>
                {columns.map((col) => (
                  <td key={col}>{formatCellValue(row[col])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
