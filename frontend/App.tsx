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
import { FlowBreadcrumbs } from '@/components/FlowBreadcrumbs';
import { DEFAULT_PREFERENCES } from '@/lib/constants';
import { getMarketplaceLinks } from '@/lib/marketplaceLinks';
import { getRecommendation } from '@/services/api';
import type { Preferences, Product, RecommendationResponse } from '@/lib/types';

type AppStep = 'landing' | 'search' | 'sliders' | 'results' | 'disambiguation' | 'error';

interface AppState {
  currentStep: AppStep;
  searchQuery: string;
  selectedProduct: Product | null;
  preferences: Preferences;
  recommendation: RecommendationResponse | null;
  isLoading: boolean;
  error: string | null;
  disambiguation: Product[] | null;
}

function App() {
  const [state, setState] = useState<AppState>({
    currentStep: 'landing',
    searchQuery: '',
    selectedProduct: null,
    preferences: DEFAULT_PREFERENCES,
    recommendation: null,
    isLoading: false,
    error: null,
    disambiguation: null,
  });

  const handleGetStarted = () => {
    setState((prev) => ({ ...prev, currentStep: 'search' }));
  };

  const handleSearch = (query: string) => {
    setState((prev) => ({
      ...prev,
      currentStep: 'sliders',
      searchQuery: query,
      selectedProduct: null,
      error: null,
    }));
  };

  const handlePreferencesChange = (prefs: Preferences) => {
    setState((prev) => ({ ...prev, preferences: prefs }));
  };

  const handleSubmitPreferences = async () => {
    const query = state.selectedProduct?.canonical_name ?? state.searchQuery;
    if (!query) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await getRecommendation(query, state.preferences);

      if ('status' in result && result.status === 'AMBIGUOUS') {
        setState((prev) => ({
          ...prev,
          currentStep: 'disambiguation',
          disambiguation: result.matches,
          isLoading: false,
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        currentStep: 'results',
        recommendation: result as RecommendationResponse,
        isLoading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setState((prev) => ({
        ...prev,
        currentStep: 'error',
        error: message,
        isLoading: false,
      }));
    }
  };

  const handleSelectProduct = (product: Product) => {
    setState((prev) => ({
      ...prev,
      currentStep: 'sliders',
      selectedProduct: product,
      disambiguation: null,
    }));
  };

  const handleCancelDisambiguation = () => {
    setState((prev) => ({
      ...prev,
      currentStep: 'search',
      disambiguation: null,
      searchQuery: '',
    }));
  };

  const handleNoneSelected = () => {
    setState((prev) => ({
      ...prev,
      currentStep: 'search',
      disambiguation: null,
      // preserve searchQuery so the input is pre-filled
    }));
  };

  const handleFindListings = (condition: string, productName: string) => {
    const { carousell, facebook } = getMarketplaceLinks(productName, condition);
    window.open(carousell, '_blank', 'noopener,noreferrer');
    window.open(facebook, '_blank', 'noopener,noreferrer');
  };

  const handleRetry = () => {
    setState((prev) => ({
      ...prev,
      currentStep: 'search',
      error: null,
      searchQuery: '',
    }));
  };

  const handleNewSearch = () => {
    setState((prev) => ({
      ...prev,
      currentStep: 'search',
      selectedProduct: null,
      recommendation: null,
      preferences: DEFAULT_PREFERENCES,
      searchQuery: '',
    }));
  };

  const handleGoBackToSearch = () => {
    setState((prev) => ({
      ...prev,
      currentStep: 'search',
      selectedProduct: null,
    }));
  };

  const handleGoBackToPreferences = () => {
    setState((prev) => ({ ...prev, currentStep: 'sliders' }));
  };

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="absolute right-4 top-4 z-50">
        <ModeToggle />
      </div>

      {state.currentStep === 'landing' && (
        <LandingPage onGetStarted={handleGetStarted} />
      )}

      {state.currentStep === 'search' && (
        <SearchPage
          onSearch={handleSearch}
          isLoading={state.isLoading}
        />
      )}

      {state.currentStep !== 'landing' && state.currentStep !== 'search' && (
        <BackgroundLayout>
          <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-2xl mx-auto">
              <header className="mb-8 text-center relative">
                <H1 className="text-white mb-2 drop-shadow-2xl">SecondSense</H1>
                <P className="text-white/90 mt-0 drop-shadow-lg">Find the best deals on used gaming peripherals</P>
              </header>

              <div className="bg-card text-card-foreground rounded-lg shadow-lg p-6 md:p-8">
                <FlowBreadcrumbs
                  currentStep={
                    state.currentStep === 'sliders' ? 'preferences'
                    : state.currentStep === 'results' ? 'results'
                    : 'search'
                  }
                  onGoToSearch={handleGoBackToSearch}
                  onGoToPreferences={handleGoBackToPreferences}
                />
                {state.currentStep === 'sliders' && (
                  <PreferencesPage
                    selectedProduct={state.selectedProduct ?? { id: '', canonical_name: state.searchQuery, category: '', aliases: [] }}
                    preferences={state.preferences}
                    isLoading={state.isLoading}
                    onPreferencesChange={handlePreferencesChange}
                    onSubmit={handleSubmitPreferences}
                    onGoBack={handleGoBackToSearch}
                  />
                )}

                {state.currentStep === 'results' && state.recommendation && (
                  <ResultsPage
                    recommendation={state.recommendation}
                    onFindListings={handleFindListings}
                    onNewSearch={handleNewSearch}
                  />
                )}

                {state.currentStep === 'error' && (
                  <ErrorPage
                    error={state.error || 'An error occurred'}
                    onRetry={handleRetry}
                    suggestion="Try a more specific product name, or check that the backend is running."
                  />
                )}
              </div>

              {state.currentStep === 'disambiguation' && state.disambiguation && (
                <ProductDisambiguation
                  products={state.disambiguation}
                  onSelect={handleSelectProduct}
                  onCancel={handleCancelDisambiguation}
                  onNoneSelected={handleNoneSelected}
                />
              )}

              {state.isLoading && (
                <LoadingState message="Fetching real-time prices, this may take a moment…" />
              )}
            </div>
          </div>
        </BackgroundLayout>
      )}
    </ThemeProvider>
  );
}

export default App;
