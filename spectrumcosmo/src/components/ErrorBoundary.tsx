'use client';
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="mb-4">Please refresh the page or clear your browser cache.</p>
          <button onClick={() => window.location.reload()} className="bg-orange-500 text-white px-4 py-2 rounded">
            Refresh
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
