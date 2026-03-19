import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SearchBar from '@/components/SearchBar';
import BackgroundLayout from '@/components/layout/BackgroundLayout';
import { H1, H2, Small } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { staggerContainerVariants, staggerItemVariants } from '@/animations/variants';
import { useAuth } from '@/context/AuthContext';
import { History, User, LogIn, Plus, X, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SearchPageProps {
  onSearch: (query: string) => void;
  onCompareSearch: (primary: string, compare: string) => void;
  isLoading: boolean;
  onGoToAuth?: () => void;
  onGoToHistory?: () => void;
  onGoToProfile?: () => void;
}

export function SearchPage({ onSearch, onCompareSearch, isLoading, onGoToAuth, onGoToHistory, onGoToProfile }: SearchPageProps) {
  const prefersReducedMotion = useReducedMotion();
  const { user } = useAuth();
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [compareQuery, setCompareQuery] = useState('');

  // In compare mode, SearchBar's onSearch fires with the primary query on submit.
  // We pair it with compareQuery at that moment.
  const handlePrimarySearch = (query: string) => {
    if (isCompareMode && compareQuery.trim()) {
      onCompareSearch(query, compareQuery.trim());
    } else {
      onSearch(query);
    }
  };

  const handleCancelCompare = () => {
    setIsCompareMode(false);
    setCompareQuery('');
  };

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
              {isCompareMode ? 'Compare two products' : 'What are you looking for?'}
            </H2>
          </motion.div>

          <motion.div variants={staggerItemVariants} className="space-y-3">
            <SearchBar
              onSearch={handlePrimarySearch}
              isLoading={isLoading}
              placeholder={isCompareMode ? 'First product…' : 'Try: Logitech G Pro X, iPhone 15, AirPods Pro...'}
            />

            <AnimatePresence>
              {isCompareMode && (
                <motion.div
                  key="compare-input"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-2"
                >
                  <Small className="text-white/70 pl-1">vs.</Small>
                  <div className="flex gap-2">
                    <Input
                      value={compareQuery}
                      onChange={(e) => setCompareQuery(e.target.value)}
                      placeholder="Second product to compare…"
                      className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-white/40"
                      autoFocus
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleCancelCompare}
                      className="shrink-0 text-white/70 hover:text-white hover:bg-white/10"
                      aria-label="Cancel compare"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Small className="text-white/50 pl-1">Enter both products above, then click Search on the first field</Small>
                </motion.div>
              )}
            </AnimatePresence>

            {!isCompareMode && (
              <div className="flex items-center justify-between px-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="flex items-center gap-1.5 text-white/50 hover:text-white/80 transition-colors cursor-default">
                        <Info className="h-3.5 w-3.5" />
                        <span className="text-xs">improve results</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[220px] text-center">
                      More specific queries give better results — e.g. "AirPods Pro 3" is more accurate than "AirPods Pro"
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCompareMode(true)}
                  className="text-white/60 hover:text-white hover:bg-white/10 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Compare two products
                </Button>
              </div>
            )}

          </motion.div>
        </motion.div>
      </div>
    </BackgroundLayout>
  );
}

export default SearchPage;
