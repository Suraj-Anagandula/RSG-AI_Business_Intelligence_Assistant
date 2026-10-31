import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Captured in ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '8px', color: '#64748b', fontSize: '12px' }}>
          <span>Unable to display this visual. Raw data is still accessible.</span>
        </div>
      );
    }
    return this.props.children;
  }
}

