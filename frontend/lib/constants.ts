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
  budget_flexibility_active: true,
  quality_priority: 5,
  quality_priority_active: true,
  risk_tolerance: 5,
  risk_tolerance_active: true,
  use_frequency: 'regular',
  deal_urgency: 'soon',
  resale_priority: 'maybe',
};

/**
 * Condition tiers in order
 */
export const CONDITION_TIERS = ['Brand New', 'Like New', 'Good', 'Well Used'] as const;
