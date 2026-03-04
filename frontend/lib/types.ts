/**
 * Frontend TypeScript types mirroring backend Go structs.
 * Ensures type safety across the API boundary.
 */

export interface RecommendationRequest {
  item: string;
  preferences: Preferences;
}

export interface Preferences {
  budget_flexibility: number;   // 0-10: tight budget to flexible
  condition_standards: number;   // 0-10: don't care to pristine
  hassle_tolerance: number;      // 0-10: willing to fix to plug & play
}

export interface RecommendationResponse {
  success: boolean;
  product_name: string;
  recommendations: RankedOption[];
  market_stats: MarketStats;
  reasoning: string;
  confidence_score: string;
  timestamp: string;
}

export interface RankedOption {
  rank: number;
  condition: string;
  avg_price: number;
  price_range: PriceRange;
  savings_vs_new: SavingsInfo;
  justification: string;
}

export interface PriceRange {
  min: number;
  max: number;
}

export interface SavingsInfo {
  absolute: number;
  percent: number;
}

export interface MarketStats {
  brand_new: MarketTier;
  like_new: MarketTier;
  good: MarketTier;
  well_used: MarketTier;
}

export interface MarketTier {
  avg_price: number;
  range: PriceRange;
}

export interface Product {
  id: string;
  canonical_name: string;
  category: string;
  aliases: string[];
}

/** Returned by POST /api/recommend when the query is ambiguous */
export interface AmbiguousResponse {
  status: 'AMBIGUOUS';
  matches: Product[];
}

/** Union of all possible successful API responses */
export type RecommendationResult = RecommendationResponse | AmbiguousResponse;
