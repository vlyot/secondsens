/**
 * Frontend TypeScript types mirroring backend Go structs.
 * Ensures type safety across the API boundary.
 */

export interface RecommendationRequest {
  item: string;
  preferences: Preferences;
}

export interface Preferences {
  budget_flexibility: number;          // 0-10: tight budget to flexible
  budget_flexibility_active?: boolean;
  quality_priority: number;            // 0-10: any condition fine to pristine only
  quality_priority_active?: boolean;
  risk_tolerance: number;              // 0-10: comfortable with uncertainty to needs guarantees
  risk_tolerance_active?: boolean;
  use_frequency: 'occasional' | 'regular' | 'daily_driver';
  deal_urgency: 'no_rush' | 'soon' | 'need_it_now';
  resale_priority: 'keeping' | 'maybe' | 'definitely_reselling';
  context?: string;
}

export interface RecommendationResponse {
  success: boolean;
  product_name: string;
  product_description?: string;
  recommendations: RankedOption[];
  market_stats: MarketStats;
  reasoning: string;
  confidence_score: string;
  timestamp: string;
  new_product_exception?: boolean;
  exception_message?: string;
  estimated_prices?: EstimatedTierPrice[];
  cached?: boolean;
  cached_at?: string;
}

export interface EstimatedTierPrice {
  condition: string;
  avg_price: number;
  min: number;
  max: number;
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
