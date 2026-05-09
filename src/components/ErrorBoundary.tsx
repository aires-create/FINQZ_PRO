// FINQZ PRO - Error Boundary Global
// Componente para capturar erros não tratados e evitar tela branca

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log do erro para debugging (em produção, enviar para serviço de logging)
    console.error('ErrorBoundary capturou erro:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleGoHome = (): void => {
    window.location.href = '/app/dashboard';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="finqz-shell flex min-h-screen items-center justify-center p-4">
          <div className="finqz-card w-full max-w-md p-8 text-center">
            {/* Icone de erro */}
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-lg bg-red-500/10">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>

            {/* Título */}
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
              Algo deu errado
            </h1>
            
            {/* Mensagem de erro amigável */}
            <p className="text-[var(--text-secondary)] mb-6">
              Encontramos um problema inesperado. Por favor, tente novamente.
            </p>

            {/* Detalhes técnicos em desenvolvimento */}
          {import.meta.env.DEV && this.state.error && (
              <div className="mb-6 rounded-lg bg-[var(--bg-elevated)] p-4 text-left">
                <p className="text-sm font-mono text-red-600 break-words">
                  {this.state.error.message}
                </p>
              </div>
            )}

            {/* Botões de ação */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-white transition-colors hover:bg-primary-hover"
              >
                <RefreshCw className="w-4 h-4" />
                Recarregar Página
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-6 py-3 font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"
              >
                <Home className="w-4 h-4" />
                Voltar ao Início
              </button>
            </div>

            {/* Código de erro para suporte */}
            <p className="text-xs text-[var(--text-muted)] mt-6">
              Se o problema persistir, entre em contato com o suporte.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
