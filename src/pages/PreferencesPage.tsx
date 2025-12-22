import PersonalisationSliders from '@/components/PersonalisationSliders';
import { Button } from '@/components/ui/button';
import { H2, P } from '@/components/ui/typography';
import type { Preferences, Product } from '@/lib/types';

interface PreferencesPageProps {
  selectedProduct: Product;
  preferences: Preferences;
  isLoading: boolean;
  onPreferencesChange: (prefs: Preferences) => void;
  onSubmit: () => void;
  onGoBack: () => void;
}

/**
 * PreferencesPage - Preference adjustment interface with action buttons
 *
 * Displays product context, PersonalisationSliders, and two action buttons.
 * Uses shadcn/ui Button components with proper variants.
 */
export function PreferencesPage({
  selectedProduct,
  preferences,
  isLoading,
  onPreferencesChange,
  onSubmit,
  onGoBack,
}: PreferencesPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <H2 className="text-foreground mb-2 border-0">
          {selectedProduct.canonical_name}
        </H2>
        <P className="text-muted-foreground mb-6 mt-0">
          Adjust your preferences to get personalized recommendations
        </P>
      </div>
      <PersonalisationSliders
        preferences={preferences}
        onPreferencesChange={onPreferencesChange}
      />
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onGoBack}
          className="flex-1"
        >
          Search Different
        </Button>
        <Button
          onClick={onSubmit}
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading ? 'Loading...' : 'Get Recommendations'}
        </Button>
      </div>
    </div>
  );
}

export default PreferencesPage;
