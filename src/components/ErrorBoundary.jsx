// src/components/ErrorBoundary.jsx
import React from "react";

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log error details
        console.error("[ErrorBoundary] Caught error:", error, errorInfo);
        this.setState({
            error,
            errorInfo,
        });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        if (this.state.hasError) {
            // Fallback UI
            return (
                <div className="flex flex-col items-center justify-center h-full w-full p-8">
                    <div className="max-w-2xl w-full rounded-2xl border border-red-500/20 bg-black/40 p-8">
                        <h2 className="text-2xl font-bold text-white mb-4">
                            Something went wrong
                        </h2>
                        <p className="text-muted mb-6">
                            An error occurred while rendering this page. You can try going back or refreshing the page.
                        </p>
                        
                        {process.env.NODE_ENV === "development" && this.state.error && (
                            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                                <p className="text-red-400 text-sm font-mono mb-2">
                                    {this.state.error.toString()}
                                </p>
                                {this.state.errorInfo && (
                                    <details className="text-xs text-muted">
                                        <summary className="cursor-pointer mb-2">Stack trace</summary>
                                        <pre className="overflow-auto max-h-64">
                                            {this.state.errorInfo.componentStack}
                                        </pre>
                                    </details>
                                )}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                className="btn btn-primary"
                                onClick={this.handleReset}
                            >
                                Try Again
                            </button>
                            <button
                                className="btn btn-secondary"
                                onClick={() => {
                                    window.location.href = "/";
                                }}
                            >
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

