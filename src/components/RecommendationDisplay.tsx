import type { RecommendationResponse, RankedOption } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

/**
 * RecommendationDisplay - Shows ranked recommendations and market statistics
 *
 * Displays top 3 ranked options with prices, savings info, and justifications.
 * Shows market stats for all condition tiers and overall reasoning.
 * Provides "Find Listings" buttons for marketplace integration.
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
  return (
    <div className="w-full space-y-8">
      {/* Product header */}
      <div>
        <h2 className="text-3xl font-bold">{data.product_name}</h2>
        <div className="flex items-center gap-3 mt-2">
          <Badge variant={getConfidenceVariant(data.confidence_score)}>
            {data.confidence_score} Confidence
          </Badge>
        </div>
      </div>

      {/* Rankings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Top Recommendations</h3>
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
          {data.recommendations.map((rec) => (
            <RankingCard
              key={rec.rank}
              recommendation={rec}
              onFindListings={onFindListings}
            />
          ))}
        </div>
      </div>

      {/* Market stats */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Market Statistics</h3>
        <MarketStatsTable data={data} />
      </div>

      {/* Reasoning */}
      <Alert>
        <AlertTitle>Why This Recommendation?</AlertTitle>
        <AlertDescription>{data.reasoning}</AlertDescription>
      </Alert>
    </div>
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
            <span className="text-sm text-muted-foreground">Average Price:</span>
            <span className="text-2xl font-bold text-primary">
              £{formatPrice(recommendation.avg_price)}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            Range: £{formatPrice(recommendation.price_range.min)} - £{formatPrice(recommendation.price_range.max)}
          </div>
        </div>

        {/* Savings */}
        <div className="border-t border-border pt-3">
          <div className="text-sm font-medium mb-2">Savings vs. New:</div>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="text-lg font-bold text-primary">
                £{formatPrice(recommendation.savings_vs_new.absolute)}
              </div>
              <div className="text-xs text-muted-foreground">Absolute</div>
            </div>
            <div className="flex-1">
              <div className="text-lg font-bold text-primary">
                {recommendation.savings_vs_new.percent}%
              </div>
              <div className="text-xs text-muted-foreground">Off RRP</div>
            </div>
          </div>
        </div>

        {/* Justification */}
        <p className="text-sm italic bg-secondary/50 p-3 rounded border border-border">
          {recommendation.justification}
        </p>

        {/* CTA Button */}
        <Button
          onClick={() => onFindListings(recommendation.condition)}
          className="w-full"
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
                <th className="px-4 py-3 text-left text-sm font-semibold">Condition</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Avg Price</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Range</th>
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
                  <td className="px-4 py-3 text-sm font-medium">{row.tier}</td>
                  <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                    £{formatPrice(row.stats.avg_price)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                    £{formatPrice(row.stats.range.min)} - £{formatPrice(row.stats.range.max)}
                  </td>
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
