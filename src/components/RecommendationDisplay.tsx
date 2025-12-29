import { motion } from 'framer-motion';
import type { RecommendationResponse, RankedOption } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { H3, Muted, Small, Display, PriceDisplay, StatDisplay } from '@/components/ui/typography';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { staggerContainerVariants, staggerItemVariants } from '@/animations/variants';

/**
 * RecommendationDisplay - Shows ranked recommendations with staggered animations
 *
 * Displays top 3 ranked options with prices, savings info, and justifications.
 * Shows market stats for all condition tiers and overall reasoning.
 * Features cascading entrance animations for visual polish.
 *
 * @param data - Recommendation response with rankings and statistics
 * @param onFindListings - Callback when user clicks to find listings
 * @returns Rendered recommendations component
 */
export function RecommendationDisplay({
  data,
  onFindListings,
}: {
  data: RecommendationResponse;
  onFindListings: (condition: string) => void;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className="w-full space-y-8"
      initial={prefersReducedMotion ? false : 'initial'}
      animate="animate"
      variants={staggerContainerVariants}
    >
      {/* Product header */}
      <motion.div variants={staggerItemVariants}>
        <Display>{data.product_name}</Display>
        <div className="flex items-center gap-3 mt-2">
          <Badge variant={getConfidenceVariant(data.confidence_score)}>
            {data.confidence_score} Confidence
          </Badge>
        </div>
      </motion.div>

      {/* Rankings */}
      <motion.div className="space-y-4" variants={staggerItemVariants}>
        <H3 className="border-0 scroll-m-0">Top Recommendations</H3>
        <div className="flex flex-col gap-6 max-w-2xl mx-auto">
          {data.recommendations.map((rec, index) => (
            <motion.div
              key={rec.rank}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
            >
              <RankingCard
                recommendation={rec}
                onFindListings={onFindListings}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Market stats */}
      <motion.div className="space-y-3" variants={staggerItemVariants}>
        <H3 className="border-0 scroll-m-0">Market Statistics</H3>
        <MarketStatsTable data={data} />
      </motion.div>

      {/* Reasoning */}
      <motion.div variants={staggerItemVariants}>
        <Alert>
          <AlertTitle>Why This Recommendation?</AlertTitle>
          <AlertDescription>{data.reasoning}</AlertDescription>
        </Alert>
      </motion.div>
    </motion.div>
  );
}

/**
 * RankingCard - Display single ranked recommendation option
 *
 * @param recommendation - Ranked option to display
 * @param onFindListings - Callback for marketplace button
 * @returns Rendered card component
 */
function RankingCard({
  recommendation,
  onFindListings,
}: {
  recommendation: RankedOption;
  onFindListings: (condition: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{recommendation.condition}</CardTitle>
            <CardDescription>
              <Badge className="mt-2">#{recommendation.rank}</Badge>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Prices */}
        <div className="bg-accent rounded p-3">
          <div className="flex justify-between items-baseline mb-2">
            <Muted className="mt-0">Average Price:</Muted>
            <PriceDisplay>
              S${formatPrice(recommendation.avg_price)}
            </PriceDisplay>
          </div>
          <Muted className="mt-0">
            Range: S${formatPrice(recommendation.price_range.min)} - S${formatPrice(recommendation.price_range.max)}
          </Muted>
        </div>

        {/* Savings */}
        <div className="border-t border-border pt-3">
          <Small className="mb-2">Savings vs. New:</Small>
          <div className="flex gap-4">
            <div className="flex-1">
              <StatDisplay>
                S${formatPrice(recommendation.savings_vs_new.absolute)}
              </StatDisplay>
              <Muted className="mt-0 text-xs">Absolute</Muted>
            </div>
            <div className="flex-1">
              <StatDisplay>
                {recommendation.savings_vs_new.percent}%
              </StatDisplay>
              <Muted className="mt-0 text-xs">Off RRP</Muted>
            </div>
          </div>
        </div>

        {/* Justification */}
        <Muted className="italic bg-secondary/50 p-3 rounded border border-border mt-0">
          {recommendation.justification}
        </Muted>

        {/* CTA Button */}
        <Button
          onClick={() => onFindListings(recommendation.condition)}
          className="w-full transition-all duration-200 hover:scale-105 active:scale-95"
          aria-label={`Find ${recommendation.condition} listings`}
        >
          Find Listings
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * MarketStatsTable - Display market tier statistics
 *
 * @param data - Full recommendation response with market stats
 * @returns Rendered table component
 */
function MarketStatsTable({ data }: { data: RecommendationResponse }) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="w-full overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-secondary border-b border-border">
                <th className="px-4 py-3 text-left"><Small>Condition</Small></th>
                <th className="px-4 py-3 text-right"><Small>Avg Price</Small></th>
                <th className="px-4 py-3 text-right"><Small>Range</Small></th>
              </tr>
            </thead>
            <tbody>
              {[
                { tier: 'Brand New', stats: data.market_stats.brand_new },
                { tier: 'Like New', stats: data.market_stats.like_new },
                { tier: 'Good', stats: data.market_stats.good },
                { tier: 'Well Used', stats: data.market_stats.well_used },
              ].map((row) => (
                <tr key={row.tier} className="border-b border-border hover:bg-accent/50">
                  <td className="px-4 py-3"><Small>{row.tier}</Small></td>
                  <td className="px-4 py-3 text-right"><Muted className="mt-0">S${formatPrice(row.stats.avg_price)}</Muted></td>
                  <td className="px-4 py-3 text-right"><Muted className="mt-0">S${formatPrice(row.stats.range.min)} - S${formatPrice(row.stats.range.max)}</Muted></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * formatPrice - Format number as GBP price with 2 decimals
 *
 * @param price - Price value to format
 * @returns Formatted price string (e.g., "89.99")
 */
function formatPrice(price: number): string {
  return price.toFixed(2);
}

/**
 * getConfidenceVariant - Map confidence level to Badge variant
 *
 * @param confidence - Confidence level ("High", "Medium", "Low")
 * @returns Badge variant type
 */
function getConfidenceVariant(confidence: string): 'default' | 'destructive' {
  switch (confidence.toLowerCase()) {
    case 'high':
    case 'medium':
      return 'default';
    case 'low':
      return 'destructive';
    default:
      return 'default';
  }
}

export default RecommendationDisplay;
