import SearchBar from '@/components/SearchBar';
import GradientBlinds from '@/components/ui/GradientBlinds';
import { H1, H2, Medium } from '@/components/ui/typography';
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
 * and list of available products. Features Lakers purple gradient background.
 */
export function SearchPage({ onSearch, isLoading, availableProducts }: SearchPageProps) {
  return (
    <div className="relative min-h-screen overflow-hidden">
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

      <div className="relative z-10 flex items-center justify-center min-h-screen px-5 sm:px-20">
        <div className="w-full max-w-2xl space-y-6">
          <H1 className="text-white text-center drop-shadow-2xl mb-2">
            SecondSense
          </H1>

          <H2 className="text-white mb-6 border-0 text-center drop-shadow-lg">
            What are you looking for?
          </H2>

          <SearchBar
            onSearch={onSearch}
            isLoading={isLoading}
            placeholder="Try: Logitech G Pro X, Razer DeathAdder..."
          />

          <div className="mt-6 p-4 bg-white/10 backdrop-blur-md rounded-lg text-sm text-white/90 border border-white/20">
            <p className="mb-2">
              <Medium className="text-white">Available products for Phase 2:</Medium>
            </p>
            <ul className="list-disc list-inside space-y-1">
              {availableProducts.map((p) => (
                <li key={p.id}>{p.canonical_name}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SearchPage;
