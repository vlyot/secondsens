import { motion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Muted } from '@/components/ui/typography';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { shakeVariants, staggerContainerVariants, staggerItemVariants } from '@/animations/variants';

/**
 * ErrorState - Animated error display component with shake effect
 *
 * Shows error message with shake animation and suggestion to user.
 * Provides clear visual hierarchy with error styling and retry button.
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
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className="w-full space-y-4"
      initial={prefersReducedMotion ? false : 'initial'}
      animate="animate"
      variants={prefersReducedMotion ? staggerContainerVariants : { ...staggerContainerVariants, ...shakeVariants }}
    >
      {/* Error alert */}
      <motion.div variants={staggerItemVariants}>
        <Alert variant="destructive">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </motion.div>

      {/* Suggestion */}
      {suggestion && (
        <motion.div variants={staggerItemVariants}>
          <Muted className="bg-secondary/50 rounded px-3 py-2 mt-0 flex items-center gap-1.5">
            <Lightbulb className="h-4 w-4 shrink-0" aria-hidden={true} />
            {suggestion}
          </Muted>
        </motion.div>
      )}

      {/* Retry button */}
      <motion.div variants={staggerItemVariants}>
        <Button
          onClick={onRetry}
          className="w-full transition-all duration-200 hover:scale-105 active:scale-95"
          variant="destructive"
          aria-label="Retry the operation"
        >
          Try Again
        </Button>
      </motion.div>
    </motion.div>
  );
}

export default ErrorState;
