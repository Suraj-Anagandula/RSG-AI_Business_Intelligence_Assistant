import React from 'react';
import { Search, Loader2 } from 'lucide-react';

export default function SearchBox({ query, setQuery, onSearch, isLoading }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <div className="search-card">
      <form className="search-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="search-input"
          placeholder="Ask a sales question (e.g. 'What is the total revenue?' or 'Which product sold the most?')"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={isLoading}
        />
        <button type="submit" className="submit-btn" disabled={isLoading || !query.trim()}>
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Search size={16} />
              <span>Ask Assistant</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

