import { useState } from 'react';
import { motion } from 'framer-motion';
import RecommendationDisplay from '@/components/RecommendationDisplay';
import { Button } from '@/components/ui/button';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { staggerContainerVariants, staggerItemVariants } from '@/animations/variants';
import type { RecommendationResponse } from '@/lib/types';

interface ResultsPageProps {
  recommendation: RecommendationResponse;
  onFindListings: (condition: string, productName: string) => void;
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
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

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
          onFindListings={(condition) => onFindListings(condition, recommendation.product_name)}
        />
      </motion.div>

      <motion.div variants={staggerItemVariants} className="flex gap-3">
        <Button
          onClick={onNewSearch}
          className="flex-1 transition-all duration-200 hover:scale-105 active:scale-95"
        >
          Search Another Product
        </Button>
        <Button
          variant="outline"
          onClick={handleCopyLink}
          className="transition-all duration-200"
        >
          {copied ? 'Copied!' : 'Copy Link'}
        </Button>
      </motion.div>
    </motion.div>
  );
}

export default ResultsPage;
