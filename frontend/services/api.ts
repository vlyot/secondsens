import { API_URL } from '@/lib/constants';
import type { Preferences, RecommendationRequest, RecommendationResult, RecommendationResponse } from '@/lib/types';

export interface HistoryItem {
  id: string;
  product_name: string;
  preferences: Preferences;
  recommendation: RecommendationResponse;
  created_at: string;
}

/**
 * Save a recommendation to the user's history (fire-and-forget friendly).
 */
export async function saveHistory(
  productName: string,
  preferences: Preferences,
  recommendation: RecommendationResponse,
  accessToken: string
): Promise<void> {
  await fetch(`${API_URL}/api/history`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ product_name: productName, preferences, recommendation }),
  });
}

/**
 * Fetch the authenticated user's search history with pagination.
 */
export async function getHistory(accessToken: string, limit = 10, offset = 0): Promise<HistoryItem[]> {
  const response = await fetch(`${API_URL}/api/history?limit=${limit}&offset=${offset}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw await handleAPIError(response);
  return response.json();
}

/**
 * Get recommendation from backend API.
 * Returns either a full RecommendationResponse or an AmbiguousResponse
 * when the query matches multiple products.
 * Pass forceRefresh=true to bypass the shared Supabase cache.
 */
/**
 * Derive a 2-letter ISO country code from the browser's navigator.language.
 * e.g. "en-SG" → "SG", "en-US" → "US", "de" → "DE".
 * Returns empty string when detection is unavailable.
 */
function detectCountryCode(): string {
  try {
    const lang = navigator.language ?? '';
    const parts = lang.split('-');
    if (parts.length >= 2) return parts[parts.length - 1].toUpperCase();
    return parts[0].toUpperCase();
  } catch {
    return '';
  }
}

export async function getRecommendation(
  item: string,
  preferences: Preferences,
  forceRefresh = false,
  compareProduct?: string
): Promise<RecommendationResult> {
  const request: RecommendationRequest & { compare_product?: string } = {
    item,
    preferences,
    ...(compareProduct ? { compare_product: compareProduct } : {}),
  };
  const controller = new AbortController();
  const timeoutMs = compareProduct ? 120_000 : 100_000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const endpoint = forceRefresh
    ? `${API_URL}/api/recommend?force_refresh=true`
    : `${API_URL}/api/recommend`;

  const countryCode = detectCountryCode();

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(countryCode ? { 'X-Country': countryCode } : {}),
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw await handleAPIError(response);
    }

    return response.json();
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(
        compareProduct
          ? 'The comparison timed out — both products require fresh price data which can be slow. Please try again.'
          : 'The request timed out — the backend may be slow. Please try again.'
      );
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch recently-searched product names from the shared cache (last 30 days).
 * Returns an empty array silently on failure.
 */
export async function getPopularProducts(): Promise<string[]> {
  try {
    const response = await fetch(`${API_URL}/api/products/popular`);
    if (!response.ok) return [];
    return response.json();
  } catch {
    return [];
  }
}

/**
 * Fetch a product thumbnail URL from the backend image cache / Google Custom Search.
 * Returns null silently on error or timeout — never throws.
 */
export async function getProductImage(productName: string): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2_000);
  try {
    const response = await fetch(
      `${API_URL}/api/product-image?q=${encodeURIComponent(productName)}`,
      { signal: controller.signal }
    );
    if (!response.ok) return null;
    const data = await response.json();
    return data.image_url || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Check backend health status.
 */
export async function healthCheck(): Promise<{ status: string }> {
  const response = await fetch(`${API_URL}/health`);

  if (!response.ok) {
    throw await handleAPIError(response);
  }

  return response.json();
}

/**
 * Convert HTTP response error to Error object, reading error message from body if available.
 */
export async function handleAPIError(response: Response): Promise<Error> {
  try {
    const body = await response.json();
    const message = body?.error ?? `HTTP ${response.status}: ${response.statusText}`;
    return new Error(message);
  } catch {
    return new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
}
