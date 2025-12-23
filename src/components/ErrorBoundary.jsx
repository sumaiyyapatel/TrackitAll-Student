import React from 'react';
import { Layout } from '@/components/Layout';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Layout>
          <div className="max-w-2xl mx-auto">
            <div className="bg-slate-900/50 backdrop-blur-md border border-rose-500/20 rounded-2xl p-8 text-center">
              <AlertCircle className="w-16 h-16 mx-auto text-rose-400 mb-4" />
              <h1 className="text-3xl font-bold mb-4 text-slate-200" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Oops! Something went wrong
              </h1>
              <p className="text-slate-400 mb-4">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              <details className="mb-6 text-left p-4 bg-slate-950 rounded-lg">
                <summary className="cursor-pointer text-slate-300 font-semibold">
                  Error details (click to expand)
                </summary>
                <pre className="mt-2 text-xs text-slate-500 overflow-auto max-h-40">
                  {this.state.error?.stack}
                </pre>
              </details>
              <Button 
                onClick={this.resetError}
                className="bg-violet-600 hover:bg-violet-500"
              >
                Try Again
              </Button>
            </div>
          </div>
        </Layout>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;