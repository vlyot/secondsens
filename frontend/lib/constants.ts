import type { Preferences } from './types';

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
