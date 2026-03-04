import { motion } from 'framer-motion';
import PersonalisationSliders from '@/components/PersonalisationSliders';
import { Button } from '@/components/ui/button';
import { H2, P } from '@/components/ui/typography';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { staggerContainerVariants, staggerItemVariants } from '@/animations/variants';
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
 * PreferencesPage - Preference adjustment interface with cascading animations
 *
 * Displays product context, PersonalisationSliders, and action buttons
 * with staggered entrance animations for visual polish.
 */
export function PreferencesPage({
  selectedProduct,
  preferences,
  isLoading,
  onPreferencesChange,
  onSubmit,
  onGoBack,
}: PreferencesPageProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className="space-y-6"
      initial={prefersReducedMotion ? false : 'initial'}
      animate="animate"
      variants={staggerContainerVariants}
    >
      <motion.div variants={staggerItemVariants}>
        <H2 className="text-foreground mb-2 border-0">
          {selectedProduct.canonical_name}
        </H2>
        <P className="text-muted-foreground mb-6 mt-0">
          Adjust your preferences to get personalized recommendations
        </P>
      </motion.div>

      <motion.div variants={staggerItemVariants}>
        <PersonalisationSliders
          preferences={preferences}
          onPreferencesChange={onPreferencesChange}
        />
      </motion.div>

      <motion.div className="flex gap-3" variants={staggerItemVariants}>
        <Button
          variant="outline"
          onClick={onGoBack}
          className="flex-1 transition-all duration-200 hover:scale-105 active:scale-95"
        >
          Search Different
        </Button>
        <Button
          onClick={onSubmit}
          disabled={isLoading}
          className="flex-1 transition-all duration-200 hover:scale-105 active:scale-95"
        >
          {isLoading ? 'Loading...' : 'Get Recommendations'}
        </Button>
      </motion.div>
    </motion.div>
  );
}

export default PreferencesPage;
