import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught render error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-[300px] flex items-center justify-center p-8">
          <div className="ws-panel p-8 max-w-lg w-full space-y-4 border-[var(--danger)]/30 text-center">
            <div className="w-12 h-12 rounded-full bg-[var(--danger)]/10 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 text-[var(--danger)]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">Component Render Error</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                A rendering error occurred in this view. This is usually caused by unexpected or missing data from the API.
              </p>
            </div>
            {this.state.error && (
              <div className="bg-[var(--surface-secondary)] rounded p-3 text-left border border-[var(--border)]">
                <p className="text-[11px] font-mono text-[var(--danger)] break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-1.5 px-4 py-2 ws-button-secondary text-xs"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="flex items-center gap-1.5 px-4 py-2 ws-button-primary text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Page</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
