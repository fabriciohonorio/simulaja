import React from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-red-100 p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500 mb-2">
              <AlertCircle size={32} />
            </div>
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Ocorreu um erro inesperado</h1>
            <p className="text-sm text-slate-500 leading-relaxed italic">
              O sistema encontrou uma instabilidade nos dados e não conseguiu renderizar a página.
            </p>
            <div className="bg-slate-50 rounded-lg p-3 text-[10px] text-left font-mono text-slate-400 overflow-auto max-h-32 mb-4">
              {this.state.error?.message}
            </div>
            <Button 
                onClick={() => window.location.reload()}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-12 rounded-xl"
            >
              Tentar Novamente
            </Button>
            <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">
                Support ID: {Math.random().toString(36).substring(7).toUpperCase()}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
