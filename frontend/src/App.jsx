import React, { useState, useEffect, useRef } from 'react';
import { Download, Upload, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import Header from './components/Header';
import KpiCards from './components/KpiCards';
import ChannelBreakdownCard from './components/ChannelBreakdownCard';
import FulfillmentGaugeCard from './components/FulfillmentGaugeCard';
import PerformanceCard from './components/PerformanceCard';
import ChatAssistant from './components/ChatAssistant';
import { askQuestion, fetchSummaryKpis, uploadCsvFile } from './services/apiService';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDashboardOpen, setIsDashboardOpen] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(true);

  // High-level KPI and dashboard metrics
  const [summaryData, setSummaryData] = useState({
    total_revenue: 1445200,
    total_orders: 50,
    completed_orders: 49,
    returned_orders: 1,
    completion_rate: 98.0,
    top_product: 'Monitor',
    top_product_revenue: 473000,
    top_region: 'South',
    top_region_revenue: 411200,
    monthly_trend: [],
    channel_stats: [],
    records: [],
  });

  // Conversation history
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Welcome to Luminare Sales Intelligence! Ask any business question about our sales, revenue, products, channels, or regional performance.',
      followups: [
        'What is the total revenue?',
        'Which product generated the highest revenue?',
        'What is the monthly revenue trend?',
        'Which region generated the highest sales?',
        'List all products',
      ],
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const headerFileRef = useRef(null);

  const showNotification = (msg, isErr = false) => {
    setNotification({ text: msg, isErr });
    setTimeout(() => setNotification(null), 4000);
  };

  // Load executive dashboard summary upon mount
  const loadSummary = async () => {
    try {
      const data = await fetchSummaryKpis();
      setSummaryData(data);
    } catch (err) {
      console.warn('Using initial state for summary:', err);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  // Handle asking questions
  const handleSendMessage = async (queryText) => {
    if (!queryText || isLoading) return;

    // Add user message to conversation
    setMessages((prev) => [...prev, { role: 'user', content: queryText }]);
    setIsLoading(true);

    try {
      const response = await askQuestion(queryText);
      const assistantMessage = {
        role: 'assistant',
        content: response.answer,
        sql: response.sql_query,
        data: response.data,
        visualization_type: response.visualization_type,
        business_insight: response.business_insight,
        execution_time_ms: response.execution_time_ms,
        followups: response.suggested_followups,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Unable to process query: ${err.message || 'Server connection error.'}`,
          followups: ['What is the total revenue?', 'List all products'],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Conversation reset. What sales insight would you like to explore next?',
        followups: [
          'What is the total revenue?',
          'Which product generated the highest revenue?',
          'What is the monthly revenue trend?',
          'Which region generated the highest sales?',
          'List all products',
        ],
      },
    ]);
  };

  const handleUploadCsv = async (file) => {
    if (!file) return;
    try {
      setIsLoading(true);
      const res = await uploadCsvFile(file);
      showNotification(`Uploaded ${file.name}: ${res.message}`);
      await loadSummary();
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `CSV file **${file.name}** processed successfully! Loaded **${res.loaded_records}** records into PostgreSQL.`,
          followups: ['What is the total revenue?', 'What is the monthly revenue trend?'],
        },
      ]);
    } catch (err) {
      showNotification(`Upload failed: ${err.message}`, true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportFullCsv = () => {
    if (!summaryData.records || summaryData.records.length === 0) return;
    const cols = Object.keys(summaryData.records[0]);
    const headers = cols.join(',');
    const rows = summaryData.records.map((r) =>
      cols.map((c) => {
        const v = r[c];
        return typeof v === 'string' && v.includes(',') ? `"${v}"` : v ?? '';
      }).join(',')
    );
    const blob = new Blob([[headers, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'luminare_sales_transactions.csv';
    link.click();
    URL.revokeObjectURL(url);
    showNotification('Exported all transactions to CSV');
  };

  return (
    <div className="luminare-app-wrapper">
      {/* Toast Notification */}
      {notification && (
        <div className={`luminare-toast ${notification.isErr ? 'toast-err' : 'toast-success'}`}>
          {notification.isErr ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Top Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDashboardOpen={isDashboardOpen}
        setIsDashboardOpen={setIsDashboardOpen}
        isChatOpen={isChatOpen}
        setIsChatOpen={setIsChatOpen}
      />

      {/* Main Container */}
      <main className="luminare-main-content">
        {/* Subheader / Title Row */}
        <div className="luminare-sub-header">
          <div>
            <h1 className="dashboard-title">Dashboard</h1>
            <p className="dashboard-subtitle">
              AI-powered analytics for smarter strategies and faster decisions.
            </p>
          </div>

          <div className="sub-header-controls">
            {/* Hidden CSV file input */}
            <input
              type="file"
              ref={headerFileRef}
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleUploadCsv(e.target.files[0]);
                  e.target.value = '';
                }
              }}
              accept=".csv"
              style={{ display: 'none' }}
            />

            {/* Date Range Filter */}
            <div className="date-filter-pill">
              <Calendar size={14} color="#6b7280" />
              <span>Jan - Jun 2026</span>
            </div>

            {/* Upload Button */}
            <button
              className="action-pill-btn"
              onClick={() => headerFileRef.current?.click()}
              title="Upload new CSV data"
            >
              <Upload size={14} />
              <span>Ingest CSV</span>
            </button>

            {/* Export Button */}
            <button
              className="action-pill-btn primary"
              onClick={handleExportFullCsv}
              title="Download entire dataset as CSV"
            >
              <Download size={14} />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Top 4 KPI Metric Cards Row */}
        <KpiCards kpis={summaryData} />

        {/* 2-Column Responsive Body */}
        <div className="luminare-dashboard-grid">
          {/* Left Column (Executive Visuals & Performance) */}
          {isDashboardOpen && (
            <div className={`dashboard-left-col ${!isChatOpen ? 'full-width' : ''}`}>
              {/* Row 1: Channel Breakdown + Fulfillment Gauge */}
              <div className="dashboard-subgrid-row">
                <ChannelBreakdownCard channels={summaryData.channel_stats} />
                <FulfillmentGaugeCard
                  completionRate={summaryData.completion_rate}
                  completedRevenue={summaryData.total_revenue}
                  returnedRevenue={32000}
                />
              </div>

              {/* Row 2: Platform Performance (Monthly Trend & Records Table) */}
              <PerformanceCard
                monthlyData={summaryData.monthly_trend}
                records={summaryData.records}
              />
            </div>
          )}

          {/* Right Column (Embedded Chat AI Assistant) */}
          {isChatOpen && (
            <div className={`dashboard-right-col ${!isDashboardOpen ? 'full-width' : ''}`}>
              <ChatAssistant
                messages={messages}
                onSendMessage={handleSendMessage}
                onResetChat={handleResetChat}
                onUploadCsv={handleUploadCsv}
                isLoading={isLoading}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
