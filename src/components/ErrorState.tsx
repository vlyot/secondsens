import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

/**
 * ErrorState - Error display component with retry option
 *
 * Shows error message and suggestion to user with actionable retry button.
 * Provides clear visual hierarchy with error styling.
 *
 * @param error - Error message to display
 * @param onRetry - Callback when retry button is clicked
 * @param suggestion - Optional helpful suggestion text
 * @returns Rendered error state component
 */
export function ErrorState({
  error,
  onRetry,
  suggestion,
}: {
  error: string;
  onRetry: () => void;
  suggestion?: string;
}) {
  return (
    <div className="w-full space-y-4">
      {/* Error alert */}
      <Alert variant="destructive">
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>

      {/* Suggestion */}
      {suggestion && (
        <div className="bg-secondary/50 rounded px-3 py-2 text-sm">
          💡 {suggestion}
        </div>
      )}

      {/* Retry button */}
      <Button
        onClick={onRetry}
        className="w-full"
        variant="destructive"
        aria-label="Retry the operation"
      >
        Try Again
      </Button>
    </div>
  );
}

export default ErrorState;
