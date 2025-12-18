/**
 * LoadingState - Visual feedback component for async operations
 *
 * Displays an animated spinner with loading message to indicate
 * that an operation is in progress (e.g., API call).
 *
 * @param message - Optional custom loading message
 * @param progress - Optional progress value 0-100
 * @returns Rendered loading state component
 */
export function LoadingState({
  message = 'Searching for prices across conditions...',
  progress,
}: {
  message?: string;
  progress?: number;
}) {
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm mx-4 text-center space-y-6">
        {/* Spinner */}
        <div className="flex justify-center">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-gray-200 rounded-full" />
            <div className="absolute inset-0 border-4 border-transparent border-t-blue-600 rounded-full animate-spin" />
          </div>
        </div>

        {/* Message */}
        <p className="text-gray-700 font-medium">{message}</p>

        {/* Progress bar (optional) */}
        {progress !== undefined && (
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-300"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default LoadingState;
