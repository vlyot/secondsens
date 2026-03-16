import type { LucideIcon } from 'lucide-react';
import {
  Banknote, Wallet, BadgeDollarSign,
  Wrench, Star, Gem,
  ToolCase, Zap, CircleCheckBig,
} from 'lucide-react';
import type { Preferences } from '@/lib/types';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Muted, Small } from '@/components/ui/typography';

export function PersonalisationSliders({
  preferences,
  onPreferencesChange,
}: {
  preferences: Preferences;
  onPreferencesChange: (prefs: Preferences) => void;
}) {
  const getIconForBudget = (value: number): LucideIcon => {
    if (value < 4) return Banknote;
    if (value < 7) return Wallet;
    return BadgeDollarSign;
  };

  const getIconForCondition = (value: number): LucideIcon => {
    if (value < 4) return Wrench;
    if (value < 7) return Star;
    return Gem;
  };

  const getIconForHassle = (value: number): LucideIcon => {
    if (value < 4) return ToolCase;
    if (value < 7) return Zap;
    return CircleCheckBig;
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
        icon={getIconForBudget(preferences.budget_flexibility)}
        onChange={(v) => handleChange('budget_flexibility', v)}
        description="0 = tight budget, 10 = very flexible"
      />
      <SliderField
        label="Condition Standards"
        value={preferences.condition_standards}
        icon={getIconForCondition(preferences.condition_standards)}
        onChange={(v) => handleChange('condition_standards', v)}
        description="0 = any condition, 10 = pristine only"
      />
      <SliderField
        label="Hassle Tolerance"
        value={preferences.hassle_tolerance}
        icon={getIconForHassle(preferences.hassle_tolerance)}
        onChange={(v) => handleChange('hassle_tolerance', v)}
        description="0 = willing to fix, 10 = must work immediately"
      />
    </div>
  );
}

function SliderField({
  label,
  value,
  icon: Icon,
  onChange,
  description,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  onChange: (value: number) => void;
  description?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4" aria-hidden={true} />
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
