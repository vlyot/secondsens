import type { Preferences } from '@/lib/types';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Muted, Small, Emoji } from '@/components/ui/typography';

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
      <SliderField
        label="Budget Flexibility"
        value={preferences.budget_flexibility}
        emoji={getEmojiForBudget(preferences.budget_flexibility)}
        onChange={(v) => handleChange('budget_flexibility', v)}
        description="0 = tight budget, 10 = very flexible"
      />
      <SliderField
        label="Condition Standards"
        value={preferences.condition_standards}
        emoji={getEmojiForCondition(preferences.condition_standards)}
        onChange={(v) => handleChange('condition_standards', v)}
        description="0 = any condition, 10 = pristine only"
      />
      <SliderField
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
 * SliderField - Reusable slider input component using shadcn/ui
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
function SliderField({
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
        <Label className="flex items-center gap-2 text-base">
          <Emoji>{emoji}</Emoji>
          {label}
        </Label>
        <Small className="text-primary">{value}/10</Small>
      </div>
      {description && <Muted className="mt-0">{description}</Muted>}
      <Slider
        value={[value]}
        onValueChange={(v) => onChange(v[0])}
        min={0}
        max={10}
        step={1}
        aria-label={label}
        className="w-full"
      />
      <div className="flex justify-between">
        <Small className="text-muted-foreground">Low</Small>
        <Small className="text-muted-foreground">High</Small>
      </div>
    </div>
  );
}

export default PersonalisationSliders;
