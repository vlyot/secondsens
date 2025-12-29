import { useState } from 'react';
import LandingPage from '@/pages/Landing';
import SearchPage from '@/pages/SearchPage';
import PreferencesPage from '@/pages/PreferencesPage';
import ResultsPage from '@/pages/ResultsPage';
import ErrorPage from '@/pages/ErrorPage';
import ProductDisambiguation from '@/components/ProductDisambiguation';
import LoadingState from '@/components/LoadingState';
import BackgroundLayout from '@/components/layout/BackgroundLayout';
import { ThemeProvider } from '@/components/theme-provider';
import { ModeToggle } from '@/components/mode-toggle';
import { H1, P } from '@/components/ui/typography';
import { DEFAULT_PREFERENCES, MOCK_PRODUCTS, getMockRecommendation } from '@/lib/constants';
import type { Preferences, Product, RecommendationResponse } from '@/lib/types';

type AppStep = 'landing' | 'search' | 'sliders' | 'results' | 'disambiguation' | 'error';

interface AppState {
  currentStep: AppStep;
  searchQuery: string;
  selectedProduct: Product | null;
  preferences: Preferences;
  mockRecommendation: RecommendationResponse | null;
  isLoading: boolean;
  error: string | null;
  disambiguation: Product[] | null;
}

/**
 * App - Main application component with centralized state management
 *
 * Manages the complete user flow:
 * - Search for products (with fuzzy matching simulation)
 * - Handle disambiguation when multiple products match
 * - Collect user preferences via sliders
 * - Display recommendations with market statistics
 * - Handle errors with retry capability
 *
 * In Phase 2, all data is mocked. Phase 5 will replace mocked data with real API calls.
 */
function App() {
  const [state, setState] = useState<AppState>({
    currentStep: 'landing',
    searchQuery: '',
    selectedProduct: null,
    preferences: DEFAULT_PREFERENCES,
    mockRecommendation: null,
    isLoading: false,
    error: null,
    disambiguation: null,
  });

  /**
   * Find product matches using fuzzy matching simulation
   * Returns exact/unique matches or disambiguation list
   */
  const findProductMatches = (query: string): { type: string; products?: Product[] } => {
    const searchLower = query.toLowerCase();
    const matches = MOCK_PRODUCTS.filter((product) => {
      const nameMatch = product.canonical_name.toLowerCase().includes(searchLower);
      const aliasMatch = product.aliases.some((alias) => alias.includes(searchLower));
      return nameMatch || aliasMatch;
    });

    if (matches.length === 0) {
      return { type: 'NOT_FOUND' };
    }
    if (matches.length === 1) {
      return { type: 'EXACT', products: matches };
    }
    return { type: 'AMBIGUOUS', products: matches.slice(0, 5) };
  };

  /**
   * Handle search submission
   * Simulates backend search with disambiguation handling
   */
  const handleSearch = (query: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    // Simulate small delay for realistic feel
    setTimeout(() => {
      const result = findProductMatches(query);

      if (result.type === 'NOT_FOUND') {
        setState((prev) => ({
          ...prev,
          currentStep: 'error',
          error: `"${query}" not found. Try another product name.`,
          isLoading: false,
          searchQuery: query,
        }));
        return;
      }

      if (result.type === 'EXACT' && result.products?.[0]) {
        setState((prev) => ({
          ...prev,
          currentStep: 'sliders',
          selectedProduct: result.products![0],
          isLoading: false,
          searchQuery: query,
        }));
        return;
      }

      if (result.type === 'AMBIGUOUS' && result.products) {
        setState((prev) => ({
          ...prev,
          currentStep: 'disambiguation',
          disambiguation: result.products || [],
          isLoading: false,
          searchQuery: query,
        }));
      }
    }, 300);
  };

  /**
   * Handle product selection from disambiguation modal
   */
  const handleSelectProduct = (product: Product) => {
    setState((prev) => ({
      ...prev,
      currentStep: 'sliders',
      selectedProduct: product,
      disambiguation: null,
    }));
  };

  /**
   * Handle disambiguation cancel (return to search)
   */
  const handleCancelDisambiguation = () => {
    setState((prev) => ({
      ...prev,
      currentStep: 'search',
      disambiguation: null,
      searchQuery: '',
    }));
  };

  /**
   * Handle preference slider changes
   */
  const handlePreferencesChange = (prefs: Preferences) => {
    setState((prev) => ({
      ...prev,
      preferences: prefs,
    }));
  };

  /**
   * Submit preferences and generate recommendation
   * Simulates API call with mock data
   */
  const handleSubmitPreferences = () => {
    if (!state.selectedProduct) return;

    setState((prev) => ({ ...prev, isLoading: true }));

    // Simulate API latency
    setTimeout(() => {
      const recommendation = getMockRecommendation(state.selectedProduct!.canonical_name, state.preferences);
      setState((prev) => ({
        ...prev,
        currentStep: 'results',
        mockRecommendation: recommendation,
        isLoading: false,
      }));
    }, 800);
  };

  /**
   * Handle retry after error
   */
  const handleRetry = () => {
    setState((prev) => ({
      ...prev,
      currentStep: 'search',
      error: null,
      searchQuery: '',
    }));
  };

  /**
   * Start new search from results screen
   */
  const handleNewSearch = () => {
    setState((prev) => ({
      ...prev,
      currentStep: 'search',
      selectedProduct: null,
      mockRecommendation: null,
      preferences: DEFAULT_PREFERENCES,
      searchQuery: '',
    }));
  };

  /**
   * Handle "Find Listings" button (Phase 5: will open marketplace)
   */
  const handleFindListings = (condition: string) => {
    // Phase 5: Replace with actual marketplace link generation
    console.log(`Would open listings for condition: ${condition}`);
  };

  /**
   * Handle going back to search from preferences page
   */
  const handleGoBackToSearch = () => {
    setState((prev) => ({
      ...prev,
      currentStep: 'search',
      selectedProduct: null,
    }));
  };

  /**
   * Navigate from landing page to search page
   */
  const handleGetStarted = () => {
    setState((prev) => ({
      ...prev,
      currentStep: 'search',
    }));
  };

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      {state.currentStep === 'landing' && (
        <LandingPage onGetStarted={handleGetStarted} />
      )}

      {state.currentStep === 'search' && (
        <SearchPage
          onSearch={handleSearch}
          isLoading={state.isLoading}
          availableProducts={MOCK_PRODUCTS}
        />
      )}

      {state.currentStep !== 'landing' && state.currentStep !== 'search' && (
        <BackgroundLayout>
          <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-2xl mx-auto">
              {/* Header */}
              <header className="mb-8 text-center relative">
                <div className="absolute right-0 top-0">
                  <ModeToggle />
                </div>
                <H1 className="text-white mb-2 drop-shadow-2xl">SecondSense</H1>
                <P className="text-white/90 mt-0 drop-shadow-lg">Find the best deals on used gaming peripherals</P>
              </header>

              {/* Main content area */}
              <div className="bg-card text-card-foreground rounded-lg shadow-lg p-6 md:p-8">
                {state.currentStep === 'sliders' && state.selectedProduct && (
                  <PreferencesPage
                    selectedProduct={state.selectedProduct}
                    preferences={state.preferences}
                    isLoading={state.isLoading}
                    onPreferencesChange={handlePreferencesChange}
                    onSubmit={handleSubmitPreferences}
                    onGoBack={handleGoBackToSearch}
                  />
                )}

                {state.currentStep === 'results' && state.mockRecommendation && (
                  <ResultsPage
                    recommendation={state.mockRecommendation}
                    onFindListings={handleFindListings}
                    onNewSearch={handleNewSearch}
                  />
                )}

                {state.currentStep === 'error' && (
                  <ErrorPage
                    error={state.error || 'An error occurred'}
                    onRetry={handleRetry}
                    suggestion="Try searching for one of the available products"
                  />
                )}
              </div>

              {/* Disambiguation modal */}
              {state.currentStep === 'disambiguation' && state.disambiguation && (
                <ProductDisambiguation
                  products={state.disambiguation}
                  onSelect={handleSelectProduct}
                  onCancel={handleCancelDisambiguation}
                />
              )}

              {/* Loading overlay */}
              {state.isLoading && <LoadingState message="Finding the best deals..." />}
            </div>
          </div>
        </BackgroundLayout>
      )}
    </ThemeProvider>
  );
}

export default App;
