import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, RefreshCw } from 'lucide-react';
import RecommendationDisplay from '@/components/RecommendationDisplay';
import { Button } from '@/components/ui/button';
import { Muted } from '@/components/ui/typography';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { staggerContainerVariants, staggerItemVariants } from '@/animations/variants';
import type { RecommendationResponse } from '@/lib/types';

export function daysAgo(isoString: string): number {
  const then = new Date(isoString).getTime();
  const now = new Date().getTime();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

interface ResultsPageProps {
  recommendation: RecommendationResponse;
  onFindListings: (condition: string, productName: string) => void;
  onNewSearch: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

/**
 * ResultsPage - Display recommendations with animated entrance
 *
 * Shows RecommendationDisplay component with staggered animations
 * and provides "Search Another Product" button.
 */
export function ResultsPage({ recommendation, onFindListings, onNewSearch, onRefresh, isRefreshing }: ResultsPageProps) {
  const prefersReducedMotion = useReducedMotion();
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const cachedDaysAgo = recommendation.cached_at
    ? daysAgo(recommendation.cached_at)
    : null;

  return (
    <motion.div
      className="space-y-6"
      initial={prefersReducedMotion ? false : 'initial'}
      animate="animate"
      variants={staggerContainerVariants}
    >
      {recommendation.cached && (
        <motion.div variants={staggerItemVariants} className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <Muted>
              Prices sourced {cachedDaysAgo === 0 ? 'today' : `${cachedDaysAgo}d ago`}
            </Muted>
          </div>
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="h-7 gap-1.5 text-xs"
            >
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing…' : 'Refresh'}
            </Button>
          )}
        </motion.div>
      )}

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
