import type { RecommendationResponse, RankedOption } from '@/lib/types';

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
        <h2 className="text-3xl font-bold text-gray-900">{data.product_name}</h2>
        <div className="flex items-center gap-3 mt-2">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold text-white ${getConfidenceColor(data.confidence_score)}`}>
            {data.confidence_score} Confidence
          </span>
        </div>
      </div>

      {/* Rankings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Top Recommendations</h3>
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
        <h3 className="text-lg font-semibold text-gray-900">Market Statistics</h3>
        <MarketStatsTable data={data} />
      </div>

      {/* Reasoning */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Why This Recommendation?</h4>
        <p className="text-blue-800 leading-relaxed">{data.reasoning}</p>
      </div>
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
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
      {/* Rank badge */}
      <div className="mb-3">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm">
          #{recommendation.rank}
        </span>
      </div>

      {/* Condition */}
      <h4 className="text-lg font-semibold text-gray-900 mb-3">{recommendation.condition}</h4>

      {/* Prices */}
      <div className="space-y-2 mb-4 bg-gray-50 rounded p-3">
        <div className="flex justify-between items-baseline">
          <span className="text-gray-600">Average Price:</span>
          <span className="text-2xl font-bold text-green-600">
            £{formatPrice(recommendation.avg_price)}
          </span>
        </div>
        <div className="text-sm text-gray-600">
          Range: £{formatPrice(recommendation.price_range.min)} - £{formatPrice(recommendation.price_range.max)}
        </div>
      </div>

      {/* Savings */}
      <div className="border-t border-gray-200 pt-3 mb-4">
        <div className="text-sm font-medium text-gray-700 mb-2">Savings vs. New:</div>
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="text-lg font-bold text-orange-600">
              £{formatPrice(recommendation.savings_vs_new.absolute)}
            </div>
            <div className="text-xs text-gray-600">Absolute</div>
          </div>
          <div className="flex-1">
            <div className="text-lg font-bold text-orange-600">
              {recommendation.savings_vs_new.percent}%
            </div>
            <div className="text-xs text-gray-600">Off RRP</div>
          </div>
        </div>
      </div>

      {/* Justification */}
      <p className="text-sm text-gray-700 italic mb-4 bg-yellow-50 p-3 rounded border border-yellow-200">
        {recommendation.justification}
      </p>

      {/* CTA Button */}
      <button
        onClick={() => onFindListings(recommendation.condition)}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
        aria-label={`Find ${recommendation.condition} listings`}
      >
        Find Listings
      </button>
    </div>
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
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Condition</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Avg Price</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Range</th>
          </tr>
        </thead>
        <tbody>
          {[
            { tier: 'Brand New', stats: data.market_stats.brand_new },
            { tier: 'Like New', stats: data.market_stats.like_new },
            { tier: 'Good', stats: data.market_stats.good },
            { tier: 'Well Used', stats: data.market_stats.well_used },
          ].map((row) => (
            <tr key={row.tier} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.tier}</td>
              <td className="px-4 py-3 text-right text-sm text-gray-700">
                £{formatPrice(row.stats.avg_price)}
              </td>
              <td className="px-4 py-3 text-right text-sm text-gray-600">
                £{formatPrice(row.stats.range.min)} - £{formatPrice(row.stats.range.max)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
 * getConfidenceColor - Map confidence level to Tailwind color class
 *
 * @param confidence - Confidence level ("High", "Medium", "Low")
 * @returns Tailwind background color class
 */
function getConfidenceColor(confidence: string): string {
  switch (confidence.toLowerCase()) {
    case 'high':
      return 'bg-green-600';
    case 'medium':
      return 'bg-yellow-600';
    case 'low':
      return 'bg-orange-600';
    default:
      return 'bg-gray-600';
  }
}

export default RecommendationDisplay;
