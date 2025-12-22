import ErrorState from '@/components/ErrorState';

interface ErrorPageProps {
  error: string;
  suggestion?: string;
  onRetry: () => void;
}

/**
 * ErrorPage - Error display wrapper for consistency
 *
 * Thin wrapper around ErrorState component.
 * Exists for architectural consistency in page structure.
 */
export function ErrorPage({ error, suggestion, onRetry }: ErrorPageProps) {
  return (
    <ErrorState
      error={error}
      onRetry={onRetry}
      suggestion={suggestion}
    />
  );
}

export default ErrorPage;
