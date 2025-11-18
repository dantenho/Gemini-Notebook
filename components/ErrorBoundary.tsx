/**
 * @fileoverview Error Boundary Component
 *
 * React Error Boundary that catches JavaScript errors anywhere in the
 * child component tree, logs errors, and displays a fallback UI instead
 * of crashing the entire application.
 *
 * Features:
 * - Catches rendering errors in child components
 * - Displays user-friendly error message
 * - Shows error details in development mode
 * - Provides reset functionality to recover
 * - Logs errors to console for debugging
 *
 * @module components/ErrorBoundary
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ExclamationCircleIcon } from '../constants';

/**
 * Props for the ErrorBoundary component
 * @interface ErrorBoundaryProps
 */
interface ErrorBoundaryProps {
  /** Child components to render */
  children: ReactNode;
  /** Optional custom fallback UI */
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

/**
 * State for the ErrorBoundary component
 * @interface ErrorBoundaryState
 */
interface ErrorBoundaryState {
  /** Whether an error has been caught */
  hasError: boolean;
  /** The error that was caught */
  error: Error | null;
  /** Additional error information from React */
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 *
 * Wraps components to catch and handle errors gracefully.
 * When an error occurs, displays a fallback UI instead of crashing.
 *
 * @class ErrorBoundary
 * @extends {Component<ErrorBoundaryProps, ErrorBoundaryState>}
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 * ```
 *
 * @example
 * ```tsx
 * // With custom fallback
 * <ErrorBoundary
 *   fallback={(error, reset) => (
 *     <CustomErrorScreen error={error} onReset={reset} />
 *   )}
 * >
 *   <App />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  /**
   * Initialize error boundary state
   */
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Static method called when an error is thrown
   *
   * Updates state to trigger fallback UI rendering.
   * This is called during the "render" phase.
   *
   * @static
   * @param {Error} error - The error that was thrown
   * @returns {ErrorBoundaryState} Updated state
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  /**
   * Lifecycle method called after an error is caught
   *
   * Used for logging errors and additional error handling.
   * This is called during the "commit" phase.
   *
   * @param {Error} error - The error that was thrown
   * @param {ErrorInfo} errorInfo - Additional error information from React
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error details:', errorInfo);

    // Update state with error info
    this.setState({
      errorInfo,
    });

    // TODO: Send error to error reporting service (e.g., Sentry)
    // reportErrorToService(error, errorInfo);
  }

  /**
   * Reset error boundary state
   *
   * Clears error state and attempts to re-render children.
   * Useful for "Try Again" functionality.
   */
  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  /**
   * Render method
   *
   * Renders children if no error, otherwise renders fallback UI.
   *
   * @returns {ReactNode} Children or fallback UI
   */
  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback } = this.props;

    // If error occurred, render fallback UI
    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback(error, this.resetError);
      }

      // Default fallback UI
      return (
        <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-zinc-800 border border-zinc-700 rounded-lg p-8">
            {/* Error Icon and Title */}
            <div className="flex items-center gap-3 mb-6">
              <ExclamationCircleIcon className="w-8 h-8 text-red-400 flex-shrink-0" />
              <h1 className="text-2xl font-bold text-zinc-100">
                Something went wrong
              </h1>
            </div>

            {/* Error Message */}
            <div className="mb-6">
              <p className="text-zinc-300 mb-4">
                The application encountered an unexpected error and couldn't continue.
              </p>
              <p className="text-zinc-400 text-sm">
                You can try to reload the application or contact support if the problem persists.
              </p>
            </div>

            {/* Error Details (Development Mode) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mb-6 p-4 bg-zinc-900 rounded-md border border-zinc-700">
                <h2 className="text-sm font-semibold text-zinc-300 mb-2">
                  Error Details:
                </h2>
                <pre className="text-xs text-red-400 overflow-x-auto mb-3">
                  {error.toString()}
                </pre>
                {errorInfo && (
                  <>
                    <h3 className="text-sm font-semibold text-zinc-300 mb-2">
                      Component Stack:
                    </h3>
                    <pre className="text-xs text-zinc-400 overflow-x-auto">
                      {errorInfo.componentStack}
                    </pre>
                  </>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={this.resetError}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 font-medium rounded-md transition-colors"
              >
                Reload Page
              </button>
            </div>

            {/* Additional Help */}
            <div className="mt-6 pt-6 border-t border-zinc-700">
              <p className="text-xs text-zinc-500">
                If this error persists, try clearing your browser cache or local storage.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // No error, render children normally
    return children;
  }
}

export default ErrorBoundary;
