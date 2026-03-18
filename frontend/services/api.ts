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
export async function getRecommendation(
  item: string,
  preferences: Preferences,
  forceRefresh = false
): Promise<RecommendationResult> {
  const request: RecommendationRequest = { item, preferences };
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60_000);
  const endpoint = forceRefresh
    ? `${API_URL}/api/recommend?force_refresh=true`
    : `${API_URL}/api/recommend`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw await handleAPIError(response);
    }

    return response.json();
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('The request timed out — the backend may be slow. Please try again.');
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
