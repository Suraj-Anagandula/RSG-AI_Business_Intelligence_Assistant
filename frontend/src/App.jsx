import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import KpiCards from './components/KpiCards';
import SamplePills from './components/SamplePills';
import SearchBox from './components/SearchBox';
import AnswerCard from './components/AnswerCard';
import TrendChart from './components/TrendChart';
import DataTable from './components/DataTable';
import { fetchSampleQuestions, fetchSummaryKpis, askQuestion } from './services/apiService';

export default function App() {
  const [kpis, setKpis] = useState(null);
  const [sampleQuestions, setSampleQuestions] = useState([]);
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const loadInitialData = async () => {
    try {
      const [kpiData, questionsData] = await Promise.all([
        fetchSummaryKpis(),
        fetchSampleQuestions(),
      ]);
      setKpis(kpiData);
      setSampleQuestions(questionsData);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
    // Default initial question
    handleSearch('What is the total revenue?');
  }, []);

  const handleSearch = async (questionText) => {
    setQuery(questionText);
    setIsLoading(true);
    try {
      const response = await askQuestion(questionText);
      setResult(response);
    } catch (err) {
      setResult({
        question: questionText,
        answer: err.message || 'An unexpected error occurred while processing your query.',
        is_success: false,
        query_type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCsvReloaded = () => {
    loadInitialData();
    if (query) {
      handleSearch(query);
    }
  };

  return (
    <div className="app-container">
      <Header onCsvUploaded={handleCsvReloaded} showNotification={showNotification} />

      <KpiCards kpis={kpis} />

      <SamplePills
        sampleQuestions={sampleQuestions}
        onSelectQuestion={(q) => handleSearch(q)}
      />

      <SearchBox
        query={query}
        setQuery={setQuery}
        onSearch={handleSearch}
        isLoading={isLoading}
      />

      {result && (
        <>
          <AnswerCard result={result} onSelectFollowup={(f) => handleSearch(f)} />
          {result.data && result.data.length > 0 && (
            <>
              <TrendChart data={result.data} />
              <DataTable data={result.data} />
            </>
          )}
        </>
      )}


      {notification && <div className="toast">{notification}</div>}
    </div>
  );
}

