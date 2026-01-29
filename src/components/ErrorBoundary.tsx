import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onReset?: () => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI.
 */
class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        // Update state so the next render will show the fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // Log error to console in development
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        // Update state with error details
        this.setState({
            error,
            errorInfo,
        });

        // TODO: Log to error tracking service (e.g., Sentry, LogRocket)
        // logErrorToService(error, errorInfo);
    }

    handleReset = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });

        // Call optional reset handler
        if (this.props.onReset) {
            this.props.onReset();
        }
    };

    handleGoHome = (): void => {
        this.handleReset();
        window.location.href = '/';
    };

    render(): ReactNode {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default fallback UI
            return (
                <div
                    style={{
                        height: '100vh',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'var(--color-bg-primary)',
                        padding: '2rem',
                    }}
                >
                    <div
                        style={{
                            maxWidth: '600px',
                            textAlign: 'center',
                            background: 'var(--color-bg-elevated)',
                            padding: '3rem',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--color-border)',
                        }}
                    >
                        <div
                            style={{
                                width: '80px',
                                height: '80px',
                                margin: '0 auto 1.5rem',
                                background: 'var(--color-error-light)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <AlertTriangle size={40} color="var(--color-error)" />
                        </div>

                        <h1 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>
                            Oops! Something went wrong
                        </h1>

                        <p
                            style={{
                                color: 'var(--color-text-secondary)',
                                marginBottom: '2rem',
                                lineHeight: '1.6',
                            }}
                        >
                            We encountered an unexpected error. Don't worry, your data is safe.
                            Try refreshing the page or returning to the home screen.
                        </p>

                        {/* Show error details in development */}
                        {import.meta.env.DEV && this.state.error && (
                            <details
                                style={{
                                    marginBottom: '2rem',
                                    textAlign: 'left',
                                    background: 'var(--color-bg-secondary)',
                                    padding: '1rem',
                                    borderRadius: 'var(--radius-md)',
                                    fontSize: '0.875rem',
                                }}
                            >
                                <summary
                                    style={{
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        marginBottom: '0.5rem',
                                        color: 'var(--color-error)',
                                    }}
                                >
                                    Error Details (Development Only)
                                </summary>
                                <pre
                                    style={{
                                        overflow: 'auto',
                                        fontSize: '0.75rem',
                                        color: 'var(--color-text-tertiary)',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                    }}
                                >
                                    {this.state.error.toString()}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </details>
                        )}

                        <div
                            style={{
                                display: 'flex',
                                gap: '1rem',
                                justifyContent: 'center',
                                flexWrap: 'wrap',
                            }}
                        >
                            <button
                                className="btn btn-primary"
                                onClick={this.handleReset}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <RefreshCw size={16} />
                                Try Again
                            </button>

                            <button
                                className="btn btn-secondary"
                                onClick={this.handleGoHome}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <Home size={16} />
                                Go Home
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
