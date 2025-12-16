import { API_URL } from '@/lib/constants';
import type { Preferences, RecommendationRequest, RecommendationResponse } from '@/lib/types';

/**
 * Get recommendation from backend API.
 * @param item - Product name/query
 * @param preferences - User preferences (budget, condition, hassle tolerance)
 * @returns Recommendation response with rankings and reasoning
 */
export async function getRecommendation(
  item: string,
  preferences: Preferences
): Promise<RecommendationResponse> {
  const request: RecommendationRequest = { item, preferences };

  const response = await fetch(`${API_URL}/api/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw handleAPIError(response);
  }

  return response.json();
}

/**
 * Check backend health status.
 * @returns Health status object
 */
export async function healthCheck(): Promise<{ status: string }> {
  const response = await fetch(`${API_URL}/health`);

  if (!response.ok) {
    throw handleAPIError(response);
  }

  return response.json();
}

/**
 * Convert HTTP response error to Error object.
 * @param response - HTTP response
 * @returns Error with status code
 */
export function handleAPIError(response: Response): Error {
  return new Error(`HTTP ${response.status}: ${response.statusText}`);
}
