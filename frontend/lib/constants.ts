import type { Preferences, Product, RecommendationResponse } from './types';

/**
 * API Configuration
 */
export const API_URL = import.meta.env.VITE_API_BACKEND_URL || 'http://localhost:8080';

/**
 * Default preference values (middle of 0-10 scale)
 */
export const DEFAULT_PREFERENCES: Preferences = {
  budget_flexibility: 5,
  condition_standards: 5,
  hassle_tolerance: 5,
};

/**
 * Condition tiers in order
 */
export const CONDITION_TIERS = ['Brand New', 'Like New', 'Good', 'Well Used'] as const;

/**
 * Mock product catalog for Phase 2 testing
 */
export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'logitech_gpro_x_superlight',
    canonical_name: 'Logitech G Pro X Superlight',
    category: 'gaming_mouse',
    aliases: ['gpro superlight', 'g pro x sl', 'g pro x', 'logitech superlight'],
  },
  {
    id: 'razer_deathadder_v3',
    canonical_name: 'Razer DeathAdder V3',
    category: 'gaming_mouse',
    aliases: ['deathadder v3', 'deathadder 3', 'da v3', 'razer da'],
  },
  {
    id: 'steelseries_rival_600',
    canonical_name: 'SteelSeries Rival 600',
    category: 'gaming_mouse',
    aliases: ['rival 600', 'steelseries rival', 'ss rival'],
  },
  {
    id: 'corsair_k95',
    canonical_name: 'Corsair K95 Platinum',
    category: 'gaming_keyboard',
    aliases: ['k95', 'corsair k95', 'k95 platinum'],
  },
  {
    id: 'corsair_k65_mini',
    canonical_name: 'Corsair K65 Mini',
    category: 'gaming_keyboard',
    aliases: ['k65 mini', 'corsair k65', 'k65'],
  },
  {
    id: 'hyperx_cloud_2',
    canonical_name: 'HyperX Cloud II',
    category: 'gaming_headset',
    aliases: ['cloud ii', 'hyperx cloud', 'cloud 2'],
  },
  {
    id: 'astro_a50',
    canonical_name: 'ASTRO A50',
    category: 'gaming_headset',
    aliases: ['a50', 'astro a50'],
  },
];

/**
 * Generate realistic mock recommendation data based on product and preferences
 */
export function getMockRecommendation(
  productName: string,
  preferences: Preferences
): RecommendationResponse {
  // Base prices vary by product
  const priceMap: Record<string, number> = {
    'Logitech G Pro X Superlight': 135,
    'Razer DeathAdder V3': 70,
    'SteelSeries Rival 600': 100,
    'Corsair K95 Platinum': 195,
    'Corsair K65 Mini': 230,
    'HyperX Cloud II': 99,
    'ASTRO A50': 299,
  };

  const newPrice = priceMap[productName] || 150;

  // Adjust recommendations based on preferences
  const budgetWeight = preferences.budget_flexibility / 10;
  const conditionWeight = preferences.condition_standards / 10;

  // Generate market stats
  const brandNewAvg = newPrice;
  const likeNewAvg = newPrice * 0.7;
  const goodAvg = newPrice * 0.5;
  const wellUsedAvg = newPrice * 0.35;

  return {
    success: true,
    product_name: productName,
    recommendations: [
      {
        rank: 1,
        condition: conditionWeight > 0.6 ? 'Like New' : 'Good',
        avg_price: conditionWeight > 0.6 ? likeNewAvg : goodAvg,
        price_range: {
          min: (conditionWeight > 0.6 ? likeNewAvg : goodAvg) * 0.95,
          max: (conditionWeight > 0.6 ? likeNewAvg : goodAvg) * 1.05,
        },
        savings_vs_new: {
          absolute: newPrice - (conditionWeight > 0.6 ? likeNewAvg : goodAvg),
          percent: Math.round(((newPrice - (conditionWeight > 0.6 ? likeNewAvg : goodAvg)) / newPrice) * 100),
        },
        justification:
          budgetWeight > 0.6
            ? 'Great balance of savings and reliability. Widely available with strong seller feedback.'
            : 'Minimal compromise on condition with excellent value for money.',
      },
      {
        rank: 2,
        condition: 'Good',
        avg_price: goodAvg,
        price_range: {
          min: goodAvg * 0.95,
          max: goodAvg * 1.05,
        },
        savings_vs_new: {
          absolute: newPrice - goodAvg,
          percent: Math.round(((newPrice - goodAvg) / newPrice) * 100),
        },
        justification:
          budgetWeight > 0.7
            ? 'Maximum savings with acceptable cosmetic wear. Fully functional with warranty options available.'
            : 'Solid alternative if Like New is unavailable in your region.',
      },
      {
        rank: 3,
        condition: 'Well Used',
        avg_price: wellUsedAvg,
        price_range: {
          min: wellUsedAvg * 0.95,
          max: wellUsedAvg * 1.05,
        },
        savings_vs_new: {
          absolute: newPrice - wellUsedAvg,
          percent: Math.round(((newPrice - wellUsedAvg) / newPrice) * 100),
        },
        justification:
          preferences.hassle_tolerance < 5
            ? 'Not recommended—may require repairs or have cosmetic issues.'
            : 'Deepest discounts for budget-conscious buyers willing to refurbish. Verify warranty.',
      },
    ],
    market_stats: {
      brand_new: {
        avg_price: brandNewAvg,
        range: { min: brandNewAvg * 0.98, max: brandNewAvg * 1.05 },
      },
      like_new: {
        avg_price: likeNewAvg,
        range: { min: likeNewAvg * 0.9, max: likeNewAvg * 1.1 },
      },
      good: {
        avg_price: goodAvg,
        range: { min: goodAvg * 0.85, max: goodAvg * 1.15 },
      },
      well_used: {
        avg_price: wellUsedAvg,
        range: { min: wellUsedAvg * 0.8, max: wellUsedAvg * 1.2 },
      },
    },
    reasoning:
      'Based on your preferences, I recommend prioritizing ' +
      (conditionWeight > 0.6 ? 'lightly-used items' : 'used items with more discount') +
      ' from reputable sellers. Check multiple listings to find the best regional prices.',
    confidence_score: 'High',
    timestamp: new Date().toISOString(),
  };
}
