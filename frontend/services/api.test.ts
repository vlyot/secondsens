import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getPopularProducts } from './api';

describe('getPopularProducts', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns parsed names on success', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ['Sony WH-1000XM5', 'Logitech G Pro X'],
    } as Response);

    const result = await getPopularProducts();
    expect(result).toEqual(['Sony WH-1000XM5', 'Logitech G Pro X']);
  });

  it('returns empty array on non-ok response', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    const result = await getPopularProducts();
    expect(result).toEqual([]);
  });

  it('returns empty array on network error', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await getPopularProducts();
    expect(result).toEqual([]);
  });
});
