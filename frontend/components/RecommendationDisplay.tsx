import { motion } from 'framer-motion';
import { TriangleAlert } from 'lucide-react';
import type { RecommendationResponse, RankedOption } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
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
        {data.product_description && (
          <Muted className="mt-1">{data.product_description}</Muted>
        )}
        {!data.new_product_exception && data.recommendations.length > 0 && (() => {
          const isBrandNew = data.recommendations[0].condition === 'brand_new';
          return (
            <div className={`mt-4 rounded-xl px-5 py-4 ${isBrandNew ? 'bg-blue-50 dark:bg-blue-950/40' : 'bg-green-50 dark:bg-green-950/40'}`}>
              <H3 className={`border-0 scroll-m-0 ${isBrandNew ? 'text-blue-900 dark:text-blue-200' : 'text-green-900 dark:text-green-200'}`}>
                Buy {isBrandNew ? 'Brand New' : 'Secondhand'}
              </H3>
              <Muted className="mt-1">Based on your preferences and current market prices</Muted>
              <div className="mt-2">
                <Badge variant={getConfidenceVariant(data.confidence_score)}>
                  {data.confidence_score} Confidence
                </Badge>
              </div>
            </div>
          );
        })()}
      </motion.div>

      {/* New product exception — no secondhand market exists */}
      {data.new_product_exception && (
        <motion.div variants={staggerItemVariants}>
          <Alert variant="destructive">
            <TriangleAlert className="h-4 w-4" />
            <AlertTitle>No Secondhand Market Found</AlertTitle>
            <AlertDescription>{data.exception_message}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Rankings */}
      {!data.new_product_exception && (
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
      )}

      {/* Market stats */}
      {!data.new_product_exception && (
        <motion.div className="space-y-3" variants={staggerItemVariants}>
          <H3 className="border-0 scroll-m-0">Market Statistics</H3>
          <PriceBars data={data} prefersReducedMotion={prefersReducedMotion} priceSource={data.price_source} />
        </motion.div>
      )}

      {/* Reasoning */}
      {!data.new_product_exception && (
        <motion.div variants={staggerItemVariants}>
          <Alert>
            <AlertTitle>Why This Recommendation?</AlertTitle>
            <AlertDescription>{data.reasoning}</AlertDescription>
          </Alert>
        </motion.div>
      )}
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
            <CardTitle>{formatCondition(recommendation.condition)}</CardTitle>
            <CardDescription>
              <Badge className="mt-2">#{recommendation.rank}</Badge>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Prices */}
        <div className="bg-accent rounded p-3" aria-label={`${recommendation.condition} pricing`}>
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

const TIER_COLORS: Record<string, string> = {
  'Brand New': 'bg-stone-400',
  'Like New':  'bg-blue-500',
  'Good':      'bg-green-500',
  'Well Used': 'bg-amber-500',
};

function PriceBars({
  data,
  prefersReducedMotion,
  priceSource,
}: {
  data: RecommendationResponse;
  prefersReducedMotion: boolean;
  priceSource?: Record<string, 'ebay' | 'ai_estimate'>;
}) {
  const estimatedKeys = new Set((data.estimated_prices ?? []).map((e) => e.condition));

  const tiers = [
    { label: 'Brand New', stats: data.market_stats.brand_new, key: 'brand_new' },
    { label: 'Like New',  stats: data.market_stats.like_new,  key: 'like_new'  },
    { label: 'Good',      stats: data.market_stats.good,      key: 'good'      },
    { label: 'Well Used', stats: data.market_stats.well_used, key: 'well_used' },
  ];

  const brandNewAvg = data.market_stats.brand_new.avg_price;
  const recommendedCondition = data.recommendations[0]?.condition;

  return (
    <Card>
      <CardContent className="py-4 space-y-4">
        {tiers.map(({ label, stats, key }, index) => {
          const pct = brandNewAvg > 0 ? Math.round((stats.avg_price / brandNewAvg) * 100) : 0;
          const isRecommended = key === recommendedCondition;
          const source = priceSource?.[key];
          return (
            <motion.div
              key={label}
              className="space-y-1"
              initial={prefersReducedMotion ? false : { opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08, duration: 0.35 }}
            >
              <div className="flex justify-between items-baseline">
                <span className="flex items-center gap-1.5 flex-wrap">
                  <Small className={isRecommended ? 'font-bold text-foreground' : ''}>
                    {label}{isRecommended ? ' ★' : ''}
                  </Small>
                  {estimatedKeys.has(key) && (
                    <span className="text-xs text-muted-foreground italic">est.</span>
                  )}
                  {source && (
                    <Badge
                      variant={source === 'ebay' ? 'secondary' : 'outline'}
                      className={cn('text-[10px] px-1.5 py-0 h-4 leading-none', source === 'ebay' ? '' : 'text-muted-foreground')}
                    >
                      {source === 'ebay' ? 'via eBay' : 'via AI estimate'}
                    </Badge>
                  )}
                </span>
                <Muted className="mt-0 text-xs">
                  S${formatPrice(stats.range.min)} – S${formatPrice(stats.range.max)}
                </Muted>
              </div>
              <Progress
                value={pct}
                className={`h-2 ${TIER_COLORS[label] ? '[&>div]:' + TIER_COLORS[label] : ''}`}
                aria-label={`${label} price: ${pct}% of brand new`}
              />
            </motion.div>
          );
        })}
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
const CONDITION_LABELS: Record<string, string> = {
  brand_new: 'Brand New',
  like_new:  'Like New',
  good:      'Good',
  well_used: 'Well Used',
};

function formatCondition(condition: string): string {
  return CONDITION_LABELS[condition] ?? condition;
}

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
