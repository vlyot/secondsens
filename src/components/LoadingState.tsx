import { Progress } from '@/components/ui/progress';

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
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-card rounded-lg shadow-lg p-8 max-w-sm mx-4 text-center space-y-6 border border-border">
        {/* Spinner */}
        <div className="flex justify-center">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-muted rounded-full" />
            <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin" />
          </div>
        </div>

        {/* Message */}
        <p className="text-foreground font-medium">{message}</p>

        {/* Progress bar (optional) */}
        {progress !== undefined && (
          <Progress value={Math.min(progress, 100)} className="w-full" />
        )}
      </div>
    </div>
  );
}

export default LoadingState;
