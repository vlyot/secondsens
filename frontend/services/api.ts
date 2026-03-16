import { API_URL } from '@/lib/constants';
import type { Preferences, RecommendationRequest, RecommendationResult } from '@/lib/types';

/**
 * Get recommendation from backend API.
 * Returns either a full RecommendationResponse or an AmbiguousResponse
 * when the query matches multiple products.
 */
export async function getRecommendation(
  item: string,
  preferences: Preferences
): Promise<RecommendationResult> {
  const request: RecommendationRequest = { item, preferences };
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60_000);

  try {
    const response = await fetch(`${API_URL}/api/recommend`, {
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
