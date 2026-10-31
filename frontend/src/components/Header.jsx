import React, { useRef } from 'react';
import { Database, Upload } from 'lucide-react';
import { uploadCsvFile } from '../services/apiService';

export default function Header({ onCsvUploaded, showNotification }) {
  const fileInputRef = useRef(null);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      showNotification('Uploading and cleaning CSV data...');
      const result = await uploadCsvFile(file);
      showNotification(`Success: ${result.message}`);
      if (onCsvUploaded) {
        onCsvUploaded();
      }
    } catch (err) {
      showNotification(`Error: ${err.message}`);
    } finally {
      event.target.value = '';
    }
  };

  return (
    <header className="app-header">
      <div className="brand">
        <div className="brand-icon">
          <Database size={24} />
        </div>
        <div>
          <h1 className="brand-title">AI Business Intelligence Assistant</h1>
          <p className="brand-subtitle">Natural Language Querying for Sales Analytics</p>
        </div>
      </div>

      <div className="header-actions">
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".csv"
          onChange={handleFileChange}
        />
        <button
          className="upload-btn"
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          title="Upload a new CSV file to clean and export to database in one click"
        >
          <Upload size={16} />
          <span>Upload CSV to Database</span>
        </button>
      </div>
    </header>
  );
}

