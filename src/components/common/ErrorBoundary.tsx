import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
          <div className="bg-red-500/10 border-2 border-red-500/30 rounded-3xl p-8 max-w-md">
            <div className="text-center">
              <div className="text-6xl mb-4">💥</div>
              <h2 className="text-white text-2xl font-bold mb-3">
                哎呀，出錯了！
              </h2>
              <p className="text-gray-400 text-sm mb-6">
                {this.state.error?.message || '發生未知錯誤'}
              </p>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="bg-emerald-500 hover:bg-emerald-400 text-gray-900 px-6 py-3 rounded-xl font-bold transition-all active:scale-95"
              >
                重新載入
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
