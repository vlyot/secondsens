import type { LucideIcon } from 'lucide-react';
import {
  Banknote, Wallet, BadgeDollarSign,
  Star, Gem, Sparkles,
  ShieldAlert, ShieldCheck, ShieldX,
} from 'lucide-react';
import type { Preferences } from '@/lib/types';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Muted, Small } from '@/components/ui/typography';
import { cn } from '@/lib/utils';

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

  const getIconForQuality = (value: number): LucideIcon => {
    if (value < 4) return Star;
    if (value < 7) return Gem;
    return Sparkles;
  };

  const getIconForRisk = (value: number): LucideIcon => {
    if (value < 4) return ShieldX;
    if (value < 7) return ShieldAlert;
    return ShieldCheck;
  };

  const handleSliderChange = (key: keyof Preferences, value: number) => {
    onPreferencesChange({ ...preferences, [key]: value });
  };

  const handleToggle = (key: 'budget_flexibility_active' | 'quality_priority_active' | 'risk_tolerance_active') => {
    onPreferencesChange({ ...preferences, [key]: !(preferences[key] ?? true) });
  };

  const budgetActive = preferences.budget_flexibility_active ?? true;
  const qualityActive = preferences.quality_priority_active ?? true;
  const riskActive = preferences.risk_tolerance_active ?? true;

  return (
    <div className="space-y-8 w-full">
      <SliderField
        label="Budget Flexibility"
        value={preferences.budget_flexibility}
        icon={getIconForBudget(preferences.budget_flexibility)}
        onChange={(v) => handleSliderChange('budget_flexibility', v)}
        description="0 = tight budget, 10 = very flexible"
        active={budgetActive}
        onToggle={() => handleToggle('budget_flexibility_active')}
      />
      <SliderField
        label="Quality Priority"
        value={preferences.quality_priority}
        icon={getIconForQuality(preferences.quality_priority)}
        onChange={(v) => handleSliderChange('quality_priority', v)}
        description="0 = any condition fine, 10 = pristine only"
        active={qualityActive}
        onToggle={() => handleToggle('quality_priority_active')}
      />
      <SliderField
        label="Risk Tolerance"
        value={preferences.risk_tolerance}
        icon={getIconForRisk(preferences.risk_tolerance)}
        onChange={(v) => handleSliderChange('risk_tolerance', v)}
        description="0 = comfortable with uncertainty, 10 = needs guarantees"
        active={riskActive}
        onToggle={() => handleToggle('risk_tolerance_active')}
      />
      <SegmentedField
        label="How often will you use it?"
        value={preferences.use_frequency}
        options={[
          { value: 'occasional', label: 'Occasional' },
          { value: 'regular', label: 'Regular' },
          { value: 'daily_driver', label: 'Daily Driver' },
        ]}
        onChange={(v) => onPreferencesChange({ ...preferences, use_frequency: v as Preferences['use_frequency'] })}
      />
      <SegmentedField
        label="Deal urgency"
        value={preferences.deal_urgency}
        options={[
          { value: 'no_rush', label: 'No Rush' },
          { value: 'soon', label: 'Soon' },
          { value: 'need_it_now', label: 'Need It Now' },
        ]}
        onChange={(v) => onPreferencesChange({ ...preferences, deal_urgency: v as Preferences['deal_urgency'] })}
      />
      <SegmentedField
        label="Resale plans"
        value={preferences.resale_priority}
        options={[
          { value: 'keeping', label: 'Keeping It' },
          { value: 'maybe', label: 'Might Resell' },
          { value: 'definitely_reselling', label: 'Definitely Reselling' },
        ]}
        onChange={(v) => onPreferencesChange({ ...preferences, resale_priority: v as Preferences['resale_priority'] })}
      />
      <div className="space-y-2">
        <Label htmlFor="context-input" className="text-base">Anything specific?</Label>
        <Textarea
          id="context-input"
          placeholder="e.g. must include original box, UK seller only…"
          maxLength={150}
          value={preferences.context ?? ''}
          onChange={(e) => onPreferencesChange({ ...preferences, context: e.target.value })}
          className="resize-none"
          rows={3}
        />
        <Muted>{(preferences.context ?? '').length}/150</Muted>
      </div>
    </div>
  );
}

function SliderField({
  label,
  value,
  icon: Icon,
  onChange,
  description,
  active,
  onToggle,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  onChange: (value: number) => void;
  description?: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4" aria-hidden={true} />
          {label}
        </Label>
        <div className="flex items-center gap-2">
          <Small className={cn("text-primary", !active && "text-muted-foreground")}>{value}/10</Small>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Switch
                  checked={active}
                  onCheckedChange={onToggle}
                  aria-label={`Toggle ${label}`}
                />
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Disable this preference</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      <div className={cn(!active && "opacity-50 pointer-events-none")}>
        {description && <Muted className="mt-0">{description}</Muted>}
        <Slider
          value={[value]}
          onValueChange={(v) => onChange(v[0])}
          min={0}
          max={10}
          step={1}
          aria-label={label}
          className="w-full"
          disabled={!active}
        />
        <div className="flex justify-between">
          <Small className="text-muted-foreground">Low</Small>
          <Small className="text-muted-foreground">High</Small>
        </div>
      </div>
    </div>
  );
}

function SegmentedField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-base">{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isActive = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-150 border",
                isActive
                  ? "bg-stone-800 text-white border-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:border-stone-100"
                  : "bg-transparent text-muted-foreground border-input hover:border-stone-400 hover:text-foreground"
              )}
              aria-pressed={isActive}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default PersonalisationSliders;
