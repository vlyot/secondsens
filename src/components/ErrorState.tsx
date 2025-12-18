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
    <div className="w-full bg-red-50 border border-red-200 rounded-lg p-6 space-y-4">
      {/* Error header */}
      <div className="flex items-start gap-3">
        <div className="text-2xl">⚠️</div>
        <div className="flex-1">
          <h3 className="font-semibold text-red-900">Something went wrong</h3>
          <p className="text-red-800 mt-1">{error}</p>
        </div>
      </div>

      {/* Suggestion */}
      {suggestion && (
        <div className="bg-red-100 rounded px-3 py-2 text-sm text-red-900">
          💡 {suggestion}
        </div>
      )}

      {/* Retry button */}
      <button
        onClick={onRetry}
        className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
        aria-label="Retry the operation"
      >
        Try Again
      </button>
    </div>
  );
}

export default ErrorState;
