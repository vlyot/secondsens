/**
 * Animation Variants - Reusable Framer Motion animation configurations
 *
 * Centralized animation presets following modern UX principles:
 * - 200-400ms for micro-interactions
 * - 400-600ms for page transitions
 * - GPU-accelerated properties only (transform, opacity)
 * - Consistent easing curves
 */

import type { Variants, Transition } from 'framer-motion';

/**
 * Easing curves
 */
export const ease = {
  smooth: [0.4, 0, 0.2, 1], // easeInOut
  snappy: [0.25, 0.1, 0.25, 1], // Material Design standard
  entrance: [0, 0, 0.2, 1], // easeOut
  exit: [0.4, 0, 1, 1], // easeIn
} as const;

/**
 * Page transition variants
 */
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: ease.smooth,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: ease.exit,
    },
  },
};

/**
 * Fade variants
 */
export const fadeVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

/**
 * Scale + fade variants (for modals, cards)
 */
export const scaleVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: ease.entrance,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.2,
      ease: ease.exit,
    },
  },
};

/**
 * Slide up variants
 */
export const slideUpVariants: Variants = {
  initial: {
    opacity: 0,
    y: 30,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: ease.entrance,
    },
  },
  exit: {
    opacity: 0,
    y: -30,
    transition: {
      duration: 0.3,
    },
  },
};

/**
 * Slide in from right
 */
export const slideInRightVariants: Variants = {
  initial: {
    opacity: 0,
    x: 100,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: ease.smooth,
    },
  },
  exit: {
    opacity: 0,
    x: -100,
    transition: {
      duration: 0.3,
    },
  },
};

/**
 * Stagger children container
 */
export const staggerContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

/**
 * Stagger item (child)
 */
export const staggerItemVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: ease.entrance,
    },
  },
  exit: {
    opacity: 0,
    y: 10,
    transition: {
      duration: 0.2,
    },
  },
};

/**
 * Shake animation (for errors)
 */
export const shakeVariants: Variants = {
  initial: {
    x: 0,
  },
  animate: {
    x: [0, -10, 10, -10, 10, 0],
    transition: {
      duration: 0.5,
      ease: 'easeInOut',
    },
  },
};

/**
 * Spring transition configs
 */
export const springTransition: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
};

export const gentleSpring: Transition = {
  type: 'spring',
  stiffness: 200,
  damping: 25,
};

/**
 * Backdrop variants (for modals)
 */
export const backdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.2 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

/**
 * Modal variants
 */
export const modalVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.9,
    y: 20,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: ease.entrance,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: {
      duration: 0.2,
      ease: ease.exit,
    },
  },
};
