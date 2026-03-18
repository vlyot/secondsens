import { describe, it, expect } from 'vitest';
import { daysAgo } from './ResultsPage';

describe('daysAgo', () => {
  it('returns 0 for a timestamp less than 24h ago', () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    expect(daysAgo(oneHourAgo)).toBe(0);
  });

  it('returns 1 for a timestamp ~25h ago', () => {
    const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    expect(daysAgo(twentyFiveHoursAgo)).toBe(1);
  });

  it('returns 7 for a timestamp 7 days ago', () => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    expect(daysAgo(sevenDaysAgo)).toBe(7);
  });

  it('returns 13 for a timestamp just under 14 days ago', () => {
    const almostFourteen = new Date(Date.now() - 13.9 * 24 * 60 * 60 * 1000).toISOString();
    expect(daysAgo(almostFourteen)).toBe(13);
  });
});
