import type React from "react";
import GradientBlinds from "@/components/ui/GradientBlinds";

interface BackgroundLayoutProps {
  children: React.ReactNode;
}

/**
 * BackgroundLayout - Global background wrapper with gradient and starfield overflow
 *
 * Provides consistent purple gradient background across all pages with elegant
 * vertical overflow handling. The gradient is fixed to the viewport, while
 * scrolling beyond reveals a black starfield background.
 *
 * Features:
 * - Fixed viewport gradient (doesn't scroll or duplicate)
 * - Starfield effect for vertical overflow
 * - Consistent Lakers purple theme
 * - Proper z-index layering for content
 */
export function BackgroundLayout({ children }: BackgroundLayoutProps) {
  return (
    <div className="relative min-h-screen starfield-background">
      {/* Fixed gradient background - only fills viewport, doesn't scroll */}
      <div className="fixed inset-0 h-screen w-full z-0">
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

      {/* Content layer - scrolls normally over background */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

export default BackgroundLayout;
