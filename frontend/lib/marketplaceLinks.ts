export interface MarketplaceLinks {
  carousell: string;
  facebook: string;
}

/**
 * Generate Carousell SG and Facebook Marketplace SG search URLs for a product.
 *
 * @param productName - Canonical product name (e.g. "Logitech G Pro X Superlight")
 */
export function getMarketplaceLinks(productName: string): MarketplaceLinks {
  const carousell = `https://www.carousell.sg/search/${encodeURIComponent(productName)}?canChangeKeyword=true&t-search_query_source=recent_search`;
  const facebook = `https://www.facebook.com/marketplace/singapore/search/?${new URLSearchParams({ query: productName }).toString()}`;

  return { carousell, facebook };
}
