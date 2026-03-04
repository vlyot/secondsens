import { motion } from 'framer-motion';
import RecommendationDisplay from '@/components/RecommendationDisplay';
import { Button } from '@/components/ui/button';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { staggerContainerVariants, staggerItemVariants } from '@/animations/variants';
import type { RecommendationResponse } from '@/lib/types';

interface ResultsPageProps {
  recommendation: RecommendationResponse;
  onFindListings: (condition: string) => void;
  onNewSearch: () => void;
}

/**
 * ResultsPage - Display recommendations with animated entrance
 *
 * Shows RecommendationDisplay component with staggered animations
 * and provides "Search Another Product" button.
 */
export function ResultsPage({ recommendation, onFindListings, onNewSearch }: ResultsPageProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className="space-y-6"
      initial={prefersReducedMotion ? false : 'initial'}
      animate="animate"
      variants={staggerContainerVariants}
    >
      <motion.div variants={staggerItemVariants}>
        <RecommendationDisplay
          data={recommendation}
          onFindListings={onFindListings}
        />
      </motion.div>

      <motion.div variants={staggerItemVariants}>
        <Button
          onClick={onNewSearch}
          className="w-full transition-all duration-200 hover:scale-105 active:scale-95"
        >
          Search Another Product
        </Button>
      </motion.div>
    </motion.div>
  );
}

export default ResultsPage;
