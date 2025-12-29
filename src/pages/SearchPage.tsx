import { motion } from 'framer-motion';
import SearchBar from '@/components/SearchBar';
import BackgroundLayout from '@/components/layout/BackgroundLayout';
import { H1, H2, Medium } from '@/components/ui/typography';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { staggerContainerVariants, staggerItemVariants } from '@/animations/variants';
import type { Product } from '@/lib/types';

interface SearchPageProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  availableProducts: Product[];
}

/**
 * SearchPage - Search interface with animated gradient background
 *
 * Displays SecondSense branding, search heading, SearchBar component,
 * and list of available products with staggered entrance animations.
 */
export function SearchPage({ onSearch, isLoading, availableProducts }: SearchPageProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <BackgroundLayout>
      <div className="flex items-center justify-center min-h-screen px-5 sm:px-20">
        <motion.div
          className="w-full max-w-2xl space-y-6"
          initial={prefersReducedMotion ? false : 'initial'}
          animate="animate"
          variants={staggerContainerVariants}
        >
          <motion.div variants={staggerItemVariants}>
            <H1 className="text-white text-center drop-shadow-2xl mb-2">
              SecondSense
            </H1>
          </motion.div>

          <motion.div variants={staggerItemVariants}>
            <H2 className="text-white mb-6 border-0 text-center drop-shadow-lg">
              What are you looking for?
            </H2>
          </motion.div>

          <motion.div variants={staggerItemVariants}>
            <SearchBar
              onSearch={onSearch}
              isLoading={isLoading}
              placeholder="Try: Logitech G Pro X, Razer DeathAdder..."
            />
          </motion.div>

          <motion.div
            variants={staggerItemVariants}
            className="mt-6 p-4 bg-white/10 backdrop-blur-md rounded-lg text-sm text-white/90 border border-white/20"
          >
            <p className="mb-2">
              <Medium className="text-white">Available products for Phase 2:</Medium>
            </p>
            <ul className="list-disc list-inside space-y-1">
              {availableProducts.map((p) => (
                <li key={p.id}>{p.canonical_name}</li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      </div>
    </BackgroundLayout>
  );
}

export default SearchPage;
