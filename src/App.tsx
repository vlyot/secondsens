import { useState } from 'react';
import SearchBar from '@/components/SearchBar';
import PersonalisationSliders from '@/components/PersonalisationSliders';
import RecommendationDisplay from '@/components/RecommendationDisplay';
import ProductDisambiguation from '@/components/ProductDisambiguation';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';
import { DEFAULT_PREFERENCES, MOCK_PRODUCTS, getMockRecommendation } from '@/lib/constants';
import type { Preferences, Product, RecommendationResponse } from '@/lib/types';

type AppStep = 'search' | 'sliders' | 'results' | 'disambiguation' | 'error';

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
    currentStep: 'search',
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">SecondSense</h1>
          <p className="text-gray-600">Find the best deals on used gaming peripherals</p>
        </header>

        {/* Main content area */}
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          {state.currentStep === 'search' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">What are you looking for?</h2>
              <SearchBar
                onSearch={handleSearch}
                isLoading={state.isLoading}
                placeholder="Try: Logitech G Pro X, Razer DeathAdder..."
              />
              <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-blue-900">
                <p className="font-semibold mb-2">🎮 Available products for Phase 2:</p>
                <ul className="list-disc list-inside space-y-1">
                  {MOCK_PRODUCTS.map((p) => (
                    <li key={p.id}>{p.canonical_name}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {state.currentStep === 'sliders' && state.selectedProduct && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {state.selectedProduct.canonical_name}
                </h2>
                <p className="text-gray-600 mb-6">Adjust your preferences to get personalized recommendations</p>
              </div>
              <PersonalisationSliders
                preferences={state.preferences}
                onPreferencesChange={handlePreferencesChange}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setState((prev) => ({ ...prev, currentStep: 'search', selectedProduct: null }))}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Search Different
                </button>
                <button
                  onClick={handleSubmitPreferences}
                  disabled={state.isLoading}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
                >
                  {state.isLoading ? 'Loading...' : 'Get Recommendations'}
                </button>
              </div>
            </div>
          )}

          {state.currentStep === 'results' && state.mockRecommendation && (
            <div className="space-y-6">
              <RecommendationDisplay
                data={state.mockRecommendation}
                onFindListings={handleFindListings}
              />
              <button
                onClick={handleNewSearch}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Search Another Product
              </button>
            </div>
          )}

          {state.currentStep === 'error' && (
            <ErrorState
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
  );
}

export default App;
