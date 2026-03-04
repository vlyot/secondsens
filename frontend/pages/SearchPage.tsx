import { motion } from 'framer-motion';
import SearchBar from '@/components/SearchBar';
import BackgroundLayout from '@/components/layout/BackgroundLayout';
import { H1, H2 } from '@/components/ui/typography';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { staggerContainerVariants, staggerItemVariants } from '@/animations/variants';

interface SearchPageProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export function SearchPage({ onSearch, isLoading }: SearchPageProps) {
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
              placeholder="Try: Logitech G Pro X, iPhone 15, AirPods Pro..."
            />
          </motion.div>
        </motion.div>
      </div>
    </BackgroundLayout>
  );
}

export default SearchPage;
