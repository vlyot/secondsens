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

/**
 * Preference presets for quick setup
 */
export const PRESETS: { label: string; preferences: Preferences }[] = [
  {
    label: 'Budget First',
    preferences: {
      budget_flexibility: 2,
      budget_flexibility_active: true,
      quality_priority: 3,
      quality_priority_active: true,
      risk_tolerance: 7,
      risk_tolerance_active: true,
      use_frequency: 'occasional',
      deal_urgency: 'no_rush',
      resale_priority: 'maybe',
    },
  },
  {
    label: 'Quality First',
    preferences: {
      budget_flexibility: 8,
      budget_flexibility_active: true,
      quality_priority: 9,
      quality_priority_active: true,
      risk_tolerance: 2,
      risk_tolerance_active: true,
      use_frequency: 'daily_driver',
      deal_urgency: 'soon',
      resale_priority: 'keeping',
    },
  },
  {
    label: 'Need It Now',
    preferences: {
      budget_flexibility: 6,
      budget_flexibility_active: true,
      quality_priority: 5,
      quality_priority_active: true,
      risk_tolerance: 4,
      risk_tolerance_active: true,
      use_frequency: 'regular',
      deal_urgency: 'need_it_now',
      resale_priority: 'maybe',
    },
  },
  {
    label: 'Just Browsing',
    preferences: {
      budget_flexibility: 5,
      budget_flexibility_active: true,
      quality_priority: 5,
      quality_priority_active: true,
      risk_tolerance: 5,
      risk_tolerance_active: true,
      use_frequency: 'occasional',
      deal_urgency: 'no_rush',
      resale_priority: 'definitely_reselling',
    },
  },
];
