import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-[480px] mx-auto min-h-screen bg-bg-cream flex flex-col items-center justify-center p-6 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-brand-gold flex items-center justify-center mb-5 shadow-card">
            <AlertTriangle size={32} strokeWidth={2} />
          </div>
          <h2 className="font-heading font-black text-[20px] text-brand-blue mb-2">
            Terjadi Kendala Memuat Halaman
          </h2>
          <p className="font-body text-[13px] text-text-secondary mb-6 max-w-[320px] leading-relaxed">
            Halaman mengalami sedikit kendala teknis saat memuat data. Silakan muat ulang halaman untuk melanjutkan.
          </p>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 bg-brand-gold hover:bg-brand-gold-hover text-white font-body font-bold text-[14px] px-6 py-3.5 rounded-full shadow-card active:scale-95 transition-all cursor-pointer"
          >
            <RefreshCw size={18} />
            Muat Ulang Halaman
          </button>
          {(import.meta.env?.DEV) && this.state.error && (
            <div className="mt-8 p-3 bg-red-50 border border-red-200 rounded-xl text-left w-full text-[11px] text-red-700 overflow-x-auto">
              <p className="font-bold mb-1">Debug Info:</p>
              <code>{this.state.error?.toString()}</code>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
