import type { Preferences } from '@/lib/types';

/**
 * PersonalisationSliders - Three interactive sliders for user preferences
 *
 * Manages budget flexibility, condition standards, and hassle tolerance on 0-10 scale.
 * Each slider is independent and updates parent state via callback.
 * Provides emoji feedback that changes based on slider position.
 *
 * @param preferences - Current preference values from parent
 * @param onPreferencesChange - Callback to update parent state
 * @returns Rendered sliders component
 */
export function PersonalisationSliders({
  preferences,
  onPreferencesChange,
}: {
  preferences: Preferences;
  onPreferencesChange: (prefs: Preferences) => void;
}) {
  const getEmojiForBudget = (value: number): string => {
    if (value < 4) return '💸';
    if (value < 7) return '💰';
    return '🤑';
  };

  const getEmojiForCondition = (value: number): string => {
    if (value < 4) return '🔧';
    if (value < 7) return '⭐';
    return '✨';
  };

  const getEmojiForHassle = (value: number): string => {
    if (value < 4) return '🛠️';
    if (value < 7) return '⚡';
    return '🎯';
  };

  const handleChange = (key: keyof Preferences, value: number) => {
    onPreferencesChange({
      ...preferences,
      [key]: value,
    });
  };

  return (
    <div className="space-y-8 w-full">
      <Slider
        label="Budget Flexibility"
        value={preferences.budget_flexibility}
        emoji={getEmojiForBudget(preferences.budget_flexibility)}
        onChange={(v) => handleChange('budget_flexibility', v)}
        description="0 = tight budget, 10 = very flexible"
      />
      <Slider
        label="Condition Standards"
        value={preferences.condition_standards}
        emoji={getEmojiForCondition(preferences.condition_standards)}
        onChange={(v) => handleChange('condition_standards', v)}
        description="0 = any condition, 10 = pristine only"
      />
      <Slider
        label="Hassle Tolerance"
        value={preferences.hassle_tolerance}
        emoji={getEmojiForHassle(preferences.hassle_tolerance)}
        onChange={(v) => handleChange('hassle_tolerance', v)}
        description="0 = willing to fix, 10 = must work immediately"
      />
    </div>
  );
}

/**
 * Slider - Reusable range input component
 *
 * Sub-component for rendering individual slider with label, value display, and emoji.
 *
 * @param label - Display name for the slider
 * @param value - Current value (0-10)
 * @param emoji - Emoji icon to display
 * @param onChange - Callback when slider changes
 * @param description - Optional help text
 * @returns Rendered slider component
 */
function Slider({
  label,
  value,
  emoji,
  onChange,
  description,
}: {
  label: string;
  value: number;
  emoji: string;
  onChange: (value: number) => void;
  description?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-base font-medium text-gray-900">
          <span className="text-2xl">{emoji}</span>
          {label}
        </label>
        <span className="text-lg font-semibold text-blue-600">{value}/10</span>
      </div>
      {description && <p className="text-sm text-gray-600">{description}</p>}
      <input
        type="range"
        min="0"
        max="10"
        value={value}
        onChange={(e) => onChange(Number.parseInt(e.target.value, 10))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={10}
        aria-valuenow={value}
      />
      <div className="flex justify-between text-xs text-gray-500">
        <span>Low</span>
        <span>High</span>
      </div>
    </div>
  );
}

export default PersonalisationSliders;
