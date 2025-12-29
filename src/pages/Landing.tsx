import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Display, Lead } from "@/components/ui/typography";
import BackgroundLayout from "@/components/layout/BackgroundLayout";
import { ChevronRight } from "lucide-react";
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { staggerContainerVariants, staggerItemVariants } from '@/animations/variants';

interface LandingPageProps {
  onGetStarted: () => void;
  onExplore?: () => void;
}

/**
 * LandingPage - Hero landing page with animated gradient background
 *
 * Features SecondSense branding, animated WebGL gradient background,
 * staggered entrance animations, and call-to-action buttons.
 */
export function LandingPage({ onGetStarted, onExplore }: LandingPageProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <BackgroundLayout>
      <main className="flex min-h-screen flex-col">
        {/* App Name Header */}
        <motion.header
          className="absolute top-8 left-1/2 -translate-x-1/2"
          initial={prefersReducedMotion ? false : { opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Display className="text-white drop-shadow-2xl text-4xl md:text-5xl">
            SecondSense
          </Display>
        </motion.header>

        {/* Hero Section */}
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center justify-center min-h-screen w-full px-5 sm:px-20">
            <motion.div
              className="flex max-w-4xl flex-col items-center gap-8 text-center"
              initial={prefersReducedMotion ? false : 'initial'}
              animate="animate"
              variants={staggerContainerVariants}
            >
              <motion.div variants={staggerItemVariants}>
                <Display className="text-5xl leading-tight tracking-tight text-white md:text-7xl text-balance drop-shadow-2xl">
                  Find Your Perfect
                  <br />
                  Gaming Gear
                </Display>
              </motion.div>

              <motion.div variants={staggerItemVariants}>
                <Lead className="text-xl text-white/90 max-w-3xl text-pretty drop-shadow-lg">
                  Discover the best value on used gaming peripherals. Smart recommendations based on your preferences and market data.
                </Lead>
              </motion.div>

              <motion.div
                className="flex flex-col sm:flex-row gap-4 mt-4 pointer-events-auto"
                variants={staggerItemVariants}
              >
                <Button
                  onClick={onGetStarted}
                  size="lg"
                  className="rounded-full bg-white px-8 py-4 text-lg font-semibold text-black transition-all duration-200 hover:bg-white/90 hover:scale-105 active:scale-95 shadow-2xl"
                >
                  Start Searching
                </Button>

                <Button
                  onClick={onExplore}
                  variant="outline"
                  size="lg"
                  className="rounded-full border-2 border-white/30 bg-white/10 px-8 py-4 text-lg font-semibold text-white backdrop-blur transition-all duration-200 hover:bg-white/20 hover:border-white/50 hover:scale-105 active:scale-95 shadow-xl"
                >
                  Learn How It Works
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </main>
    </BackgroundLayout>
  );
}

export default LandingPage;
