/**
 * API Service for communicating with FastAPI backend.
 * Uses standard fetch API with clear error handling.
 */

const API_BASE = '/api';

export async function fetchHealth() {
  const response = await fetch(`${API_BASE}/health`);
  if (!response.ok) {
    throw new Error('Backend health check failed');
  }
  return response.json();
}

export async function fetchSampleQuestions() {
  const response = await fetch(`${API_BASE}/sample-questions`);
  if (!response.ok) {
    throw new Error('Failed to fetch sample questions');
  }
  return response.json();
}

export async function fetchSummaryKpis() {
  const response = await fetch(`${API_BASE}/summary`);
  if (!response.ok) {
    throw new Error('Failed to fetch summary KPIs');
  }
  return response.json();
}

export async function askQuestion(questionText) {
  const response = await fetch(`${API_BASE}/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question: questionText }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to process question');
  }
  return response.json();
}

export async function uploadCsvFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/upload-csv`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to upload CSV');
  }
  return response.json();
}

