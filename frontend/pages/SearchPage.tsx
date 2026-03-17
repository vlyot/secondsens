import { motion } from 'framer-motion';
import SearchBar from '@/components/SearchBar';
import BackgroundLayout from '@/components/layout/BackgroundLayout';
import { H1, H2 } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { staggerContainerVariants, staggerItemVariants } from '@/animations/variants';
import { useAuth } from '@/context/AuthContext';
import { History, User, LogIn } from 'lucide-react';

interface SearchPageProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  onGoToAuth?: () => void;
  onGoToHistory?: () => void;
  onGoToProfile?: () => void;
}

export function SearchPage({ onSearch, isLoading, onGoToAuth, onGoToHistory, onGoToProfile }: SearchPageProps) {
  const prefersReducedMotion = useReducedMotion();
  const { user } = useAuth();

  return (
    <BackgroundLayout>
      {/* Auth nav — top right, matching ModeToggle position offset */}
      <div className="absolute right-16 top-4 z-50 flex items-center gap-1">
        {user ? (
          <>
            <Button variant="ghost" size="sm" onClick={onGoToHistory} title="Search history"
              className="text-white/80 hover:text-white hover:bg-white/10">
              <History className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onGoToProfile} title={user.email ?? 'Profile'}
              className="text-white/80 hover:text-white hover:bg-white/10">
              <User className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <Button variant="ghost" size="sm" onClick={onGoToAuth}
            className="text-white/80 hover:text-white hover:bg-white/10">
            <LogIn className="h-4 w-4 mr-1" />
            <span className="text-xs">Sign in</span>
          </Button>
        )}
      </div>

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
