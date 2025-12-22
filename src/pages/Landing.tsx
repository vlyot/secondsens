import { Button } from "@/components/ui/button";
import { Display, Lead } from "@/components/ui/typography";
import GradientBlinds from "@/components/ui/GradientBlinds";
import { ChevronRight } from "lucide-react";

interface LandingPageProps {
  onGetStarted: () => void;
  onExplore?: () => void;
}

/**
 * LandingPage - Hero landing page with animated gradient background
 *
 * Features SecondSense branding, animated WebGL gradient background,
 * and call-to-action buttons to navigate to the search flow.
 */
export function LandingPage({ onGetStarted, onExplore }: LandingPageProps) {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Animated WebGL gradient background */}
      <div className="fixed inset-0 w-full h-full flex items-center justify-center">
        <GradientBlinds
          gradientColors={["#1a0933", "#552583", "#7c3aed", "#a855f7"]}
          angle={15}
          noise={0.25}
          blindCount={13}
          blindMinWidth={50}
          spotlightRadius={0.38}
          spotlightSoftness={1.6}
          spotlightOpacity={0.42}
          mouseDampening={0.15}
          distortAmount={0}
          shineDirection="left"
          mixBlendMode="overlay"
        />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* App Name Header */}
        <header className="absolute top-8 left-1/2 -translate-x-1/2">
          <Display className="text-white drop-shadow-2xl text-4xl md:text-5xl">
            SecondSense
          </Display>
        </header>

        {/* Hero Section */}
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center justify-center min-h-screen w-full px-5 sm:px-20">
            <div className="relative z-10 flex max-w-4xl flex-col items-center gap-8 text-center">
              <Display className="text-5xl leading-tight tracking-tight text-white md:text-7xl text-balance drop-shadow-2xl">
                Find Your Perfect
                <br />
                Gaming Gear
              </Display>

              <Lead className="text-xl text-white/90 max-w-3xl text-pretty drop-shadow-lg">
                Discover the best value on used gaming peripherals. Smart recommendations based on your preferences and market data.
              </Lead>

              <div className="flex flex-col sm:flex-row gap-4 mt-4 pointer-events-auto">
                <Button
                  onClick={onGetStarted}
                  size="lg"
                  className="rounded-full bg-white px-8 py-4 text-lg font-semibold text-black transition-all hover:bg-white/90 shadow-2xl"
                >
                  Start Searching
                </Button>

                <Button
                  onClick={onExplore}
                  variant="outline"
                  size="lg"
                  className="rounded-full border-2 border-white/30 bg-white/10 px-8 py-4 text-lg font-semibold text-white backdrop-blur transition-all hover:bg-white/20 hover:border-white/50 shadow-xl"
                >
                  Learn How It Works
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default LandingPage;
