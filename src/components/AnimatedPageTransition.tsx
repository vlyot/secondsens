import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { pageVariants } from '@/animations/variants';
import type { ReactNode } from 'react';

interface AnimatedPageTransitionProps {
  children: ReactNode;
  pageKey: string;
  className?: string;
}

/**
 * AnimatedPageTransition - Wrapper component for smooth page transitions
 *
 * Provides consistent enter/exit animations for all page-level components.
 * Respects user's reduced motion preferences for accessibility.
 *
 * @param children - Page content to animate
 * @param pageKey - Unique key for AnimatePresence to track transitions
 * @param className - Optional CSS classes for the motion wrapper
 */
export function AnimatedPageTransition({
  children,
  pageKey,
  className,
}: AnimatedPageTransitionProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pageKey}
        initial={prefersReducedMotion ? false : 'initial'}
        animate="animate"
        exit={prefersReducedMotion ? undefined : 'exit'}
        variants={pageVariants}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
