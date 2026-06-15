import { Component, type ErrorInfo, type ReactNode } from 'react';

type ErrorBoundaryProps = {
  children: ReactNode;
  label?: string;
};

type ErrorBoundaryState = {
  hasError: boolean;
  message: string | null;
};

/**
 * Catches render-time exceptions in a subtree so a single broken panel does not
 * blank the entire dashboard. Shows a recoverable inline card instead of the
 * raw React error screen.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: null };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Unexpected error.'
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surfaced to the browser console for diagnostics; the UI stays usable.
    console.error(`[ErrorBoundary${this.props.label ? `:${this.props.label}` : ''}]`, error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, message: null });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="m-4 rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
        <h2 className="text-lg font-semibold text-red-300">Something went wrong on this page</h2>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          {this.props.label ? `The ${this.props.label} view ` : 'This view '}hit an unexpected error and could not render.
          Your data is safe — try again, or reload the page.
        </p>
        {this.state.message ? (
          <p className="mt-2 break-words rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 font-mono text-xs text-[var(--muted-foreground)]">
            {this.state.message}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={this.handleReset}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--accent)]"
          >
            Try Again
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] transition hover:opacity-90"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
}
