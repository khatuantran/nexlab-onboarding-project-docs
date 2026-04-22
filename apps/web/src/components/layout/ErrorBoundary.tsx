import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Class component per React requirement for error boundary.
 * Exception to convention-fe §2 (functional only).
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // Wire to Sentry/Rollbar v2; v1 console only (dev + prod).
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  override render(): ReactNode {
    if (this.state.error) {
      return (
        this.props.fallback ?? (
          <div role="alert" className="mx-auto max-w-lg p-6 text-center text-destructive">
            <h2 className="text-lg font-semibold">Có lỗi xảy ra</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Thử reload lại trang. Nếu lỗi lặp lại, liên hệ admin.
            </p>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
