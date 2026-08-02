import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex items-center justify-center bg-surface p-8">
          <div className="max-w-lg w-full bg-surface-container-lowest rounded-2xl shadow-lg p-8 text-center">
            <span className="material-symbols-outlined text-6xl text-rose-500 mb-4">error</span>
            <h1 className="text-xl font-bold text-on-surface mb-2">Something went wrong</h1>
            <p className="text-sm text-on-surface-variant mb-4">{this.state.error?.message}</p>
            {this.state.errorInfo && (
              <details className="text-left mb-4">
                <summary className="text-xs font-bold text-on-surface-variant cursor-pointer mb-2">Stack trace</summary>
                <pre className="text-xs text-on-surface-variant bg-surface-container-high rounded-xl p-4 overflow-auto max-h-48">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            <button
              onClick={() => { this.setState({ hasError: false, error: null, errorInfo: null }); window.location.reload(); }}
              className="px-6 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold hover:bg-primary-dim transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
