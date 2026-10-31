import React, { useState } from 'react';
import { Table, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { getCustomIcon } from './IconHelper';

export default function DataTable({ data, pageSize = 8 }) {
  const [currentPage, setCurrentPage] = useState(1);
  if (!data || data.length === 0) return null;

  const columns = Object.keys(data[0]);
  const totalPages = Math.ceil(data.length / pageSize);
  const currentRows = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const formatCellValue = (col, val) => {
    if (val === null || val === undefined) return '-';

    const colLower = col.toLowerCase();
    const isCurrency = ['revenue', 'price', 'sales', 'sum', 'total', 'net_revenue', 'unit_price'].some(k => colLower.includes(k));

    if (typeof val === 'number') {
      if (isCurrency) {
        return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
      return val.toLocaleString();
    }

    if (colLower === 'product') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
          <span style={{ color: '#ff5733', display: 'flex', alignItems: 'center' }}>{getCustomIcon(val, 14)}</span>
          <span>{val}</span>
        </span>
      );
    }

    if (colLower === 'sales_channel' || colLower === 'channel') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: '#6b7280', display: 'flex', alignItems: 'center' }}>{getCustomIcon(val, 13)}</span>
          <span>{val}</span>
        </span>
      );
    }

    if (colLower === 'region') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: '#6b7280', display: 'flex', alignItems: 'center' }}>{getCustomIcon(val, 13)}</span>
          <span>{val}</span>
        </span>
      );
    }

    if (colLower === 'status') {
      const isCompleted = String(val).toLowerCase() === 'completed';
      return (
        <span
          style={{
            display: 'inline-flex',
            padding: '2px 8px',
            borderRadius: '9999px',
            fontSize: '11px',
            fontWeight: '600',
            backgroundColor: isCompleted ? '#dcfce7' : '#fee2e2',
            color: isCompleted ? '#15803d' : '#b91c1c',
          }}
        >
          {val}
        </span>
      );
    }

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
    link.setAttribute('download', 'sales_data_records.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ marginTop: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600', color: '#1f2937' }}>
          <Table size={14} style={{ color: '#ff5733' }} />
          <span>Supporting Records ({data.length})</span>
        </div>
        <button
          onClick={handleDownloadCsv}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            padding: '3px 8px',
            fontSize: '11px',
            fontWeight: '600',
            cursor: 'pointer',
            color: '#374151',
            transition: 'background 0.15s ease'
          }}
          title="Download data as CSV"
        >
          <Download size={12} />
          <span>Export CSV</span>
        </button>
      </div>

      <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#ffffff' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              {columns.map((col) => (
                <th key={col} style={{ padding: '8px 12px', fontWeight: '600', color: '#4b5563', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                  {col.replace(/_/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentRows.map((row, idx) => (
              <tr key={idx} style={{ borderBottom: idx === currentRows.length - 1 ? 'none' : '1px solid #f3f4f6' }}>
                {columns.map((col) => (
                  <td key={col} style={{ padding: '8px 12px', color: '#111827', whiteSpace: 'nowrap' }}>
                    {formatCellValue(col, row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '11px', color: '#6b7280' }}>
          <span>Showing page {currentPage} of {totalPages}</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{ padding: '2px 6px', border: '1px solid #e5e7eb', borderRadius: '4px', background: '#fff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
            >
              <ChevronLeft size={12} />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{ padding: '2px 6px', border: '1px solid #e5e7eb', borderRadius: '4px', background: '#fff', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
            >
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
