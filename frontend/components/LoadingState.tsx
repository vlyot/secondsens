import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Large } from '@/components/ui/typography';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { backdropVariants, scaleVariants } from '@/animations/variants';

/**
 * LoadingState - Animated visual feedback component for async operations
 *
 * Displays an animated spinner with fade-in backdrop and scale-in card.
 * Message pulses to indicate ongoing activity.
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
  const prefersReducedMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    cardRef.current?.focus();
    return () => {
      previousFocus?.focus();
    };
  }, []);

  return (
    <motion.div
      className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
      initial={prefersReducedMotion ? false : 'initial'}
      animate="animate"
      exit="exit"
      variants={backdropVariants}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <motion.div
        ref={cardRef}
        tabIndex={-1}
        className="bg-card rounded-lg shadow-lg p-8 max-w-sm mx-4 text-center space-y-6 border border-border outline-none"
        variants={scaleVariants}
      >
        {/* Spinner */}
        <div className="flex justify-center">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-muted rounded-full" />
            <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin" />
          </div>
        </div>

        {/* Message with pulse */}
        <motion.div
          animate={prefersReducedMotion ? {} : { opacity: [1, 0.7, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Large className="text-foreground">{message}</Large>
        </motion.div>

        {/* Progress bar (optional) */}
        {progress !== undefined && (
          <Progress value={Math.min(progress, 100)} className="w-full" />
        )}
      </motion.div>
    </motion.div>
  );
}

export default LoadingState;
