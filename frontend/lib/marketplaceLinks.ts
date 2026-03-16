/**
 * Condition tier label to Carousell condition query value mapping.
 * Carousell SG uses "brand_new", "like_new", "good", "used" as filter values.
 */
const CAROUSELL_CONDITION_MAP: Record<string, string> = {
  'Brand New': 'brand_new',
  'Like New': 'like_new',
  'Good': 'good',
  'Well Used': 'used',
};

export interface MarketplaceLinks {
  carousell: string;
  facebook: string;
}

/**
 * Generate Carousell SG and Facebook Marketplace SG search URLs
 * for a given product and condition tier.
 *
 * @param productName - Canonical product name (e.g. "Logitech G Pro X Superlight")
 * @param condition - Condition tier label (e.g. "Like New", "Good")
 */
export function getMarketplaceLinks(productName: string, condition: string): MarketplaceLinks {
  const carousellCondition = CAROUSELL_CONDITION_MAP[condition] ?? '';

  const carousellParams = new URLSearchParams({ query: productName });
  if (carousellCondition) carousellParams.set('condition_v2', carousellCondition);
  const carousell = `https://www.carousell.sg/search/?${carousellParams.toString()}`;

  const facebook = `https://www.facebook.com/marketplace/singapore/search/?${new URLSearchParams({ query: productName }).toString()}`;

  return { carousell, facebook };
}
