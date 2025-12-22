import RecommendationDisplay from '@/components/RecommendationDisplay';
import { Button } from '@/components/ui/button';
import type { RecommendationResponse } from '@/lib/types';

interface ResultsPageProps {
  recommendation: RecommendationResponse;
  onFindListings: (condition: string) => void;
  onNewSearch: () => void;
}

/**
 * ResultsPage - Display recommendations with new search option
 *
 * Shows RecommendationDisplay component and provides "Search Another Product" button.
 * Minimal wrapper that delegates rendering to RecommendationDisplay.
 */
export function ResultsPage({ recommendation, onFindListings, onNewSearch }: ResultsPageProps) {
  return (
    <div className="space-y-6">
      <RecommendationDisplay
        data={recommendation}
        onFindListings={onFindListings}
      />
      <Button
        onClick={onNewSearch}
        className="w-full"
      >
        Search Another Product
      </Button>
    </div>
  );
}

export default ResultsPage;
