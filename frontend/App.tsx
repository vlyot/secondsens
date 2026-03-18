import { useEffect, useState } from 'react';
import LandingPage from '@/pages/Landing';
import SearchPage from '@/pages/SearchPage';
import PreferencesPage from '@/pages/PreferencesPage';
import ResultsPage from '@/pages/ResultsPage';
import ErrorPage from '@/pages/ErrorPage';
import DocsPage from '@/pages/DocsPage';
import AuthPage from '@/pages/AuthPage';
import HistoryPage from '@/pages/HistoryPage';
import ProfilePage from '@/pages/ProfilePage';
import ProductDisambiguation from '@/components/ProductDisambiguation';
import LoadingState from '@/components/LoadingState';
import BackgroundLayout from '@/components/layout/BackgroundLayout';
import { ThemeProvider } from '@/components/theme-provider';
import { ModeToggle } from '@/components/mode-toggle';
import { H1, P } from '@/components/ui/typography';
import { FlowBreadcrumbs } from '@/components/FlowBreadcrumbs';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { DEFAULT_PREFERENCES } from '@/lib/constants';
import { getMarketplaceLinks } from '@/lib/marketplaceLinks';
import { getRecommendation, saveHistory, type HistoryItem } from '@/services/api';
import type { Preferences, Product, RecommendationResponse } from '@/lib/types';

type AppStep = 'landing' | 'search' | 'sliders' | 'results' | 'disambiguation' | 'error' | 'docs' | 'auth' | 'history' | 'profile';

interface SharePayload {
  product: string;
  preferences: Preferences;
}

function encodeSharePayload(product: string, preferences: Preferences): string {
  const payload: SharePayload = { product, preferences };
  return btoa(encodeURIComponent(JSON.stringify(payload)));
}

function decodeSharePayload(encoded: string): SharePayload | null {
  try {
    return JSON.parse(decodeURIComponent(atob(encoded)));
  } catch {
    return null;
  }
}

interface AppState {
  currentStep: AppStep;
  searchQuery: string;
  selectedProduct: Product | null;
  preferences: Preferences;
  recommendation: RecommendationResponse | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  disambiguation: Product[] | null;
}

function AppInner() {
  const { user, session } = useAuth();

  const [state, setState] = useState<AppState>({
    currentStep: 'landing',
    searchQuery: '',
    selectedProduct: null,
    preferences: DEFAULT_PREFERENCES,
    recommendation: null,
    isLoading: false,
    isRefreshing: false,
    error: null,
    disambiguation: null,
  });

  // Decode ?s= share param on mount and auto-run recommendation
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get('s');
    if (!encoded) return;
    const payload = decodeSharePayload(encoded);
    if (!payload) return;
    setState((prev) => ({
      ...prev,
      searchQuery: payload.product,
      preferences: payload.preferences,
      isLoading: true,
      error: null,
    }));
    getRecommendation(payload.product, payload.preferences)
      .then((result) => {
        if ('status' in result && result.status === 'AMBIGUOUS') {
          setState((prev) => ({ ...prev, currentStep: 'disambiguation', disambiguation: result.matches, isLoading: false }));
          return;
        }
        setState((prev) => ({ ...prev, currentStep: 'results', recommendation: result as RecommendationResponse, isLoading: false }));
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'Something went wrong.';
        setState((prev) => ({ ...prev, currentStep: 'error', error: message, isLoading: false }));
      });
  }, []);

  // Ctrl+Shift+R — clean reset to landing page (prevents browser hard-reload)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        window.location.href = window.location.pathname;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleGetStarted = () => setState((prev) => ({ ...prev, currentStep: 'search' }));
  const handleExplore = () => setState((prev) => ({ ...prev, currentStep: 'docs' }));
  const handleDocsBack = () => setState((prev) => ({ ...prev, currentStep: 'landing' }));

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

      const rec = result as RecommendationResponse;
      const encoded = encodeSharePayload(query, state.preferences);
      window.history.replaceState(null, '', `?s=${encoded}`);
      setState((prev) => ({
        ...prev,
        currentStep: 'results',
        recommendation: rec,
        isLoading: false,
      }));

      // Fire-and-forget: save to history if signed in
      if (session?.access_token) {
        saveHistory(query, state.preferences, rec, session.access_token).catch(() => {});
      }
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
    }));
  };

  const handleRefresh = async () => {
    const query = state.selectedProduct?.canonical_name ?? state.searchQuery;
    if (!query) return;
    setState((prev) => ({ ...prev, isRefreshing: true }));
    try {
      const result = await getRecommendation(query, state.preferences, true);
      if ('status' in result && result.status === 'AMBIGUOUS') return;
      const rec = result as RecommendationResponse;
      setState((prev) => ({ ...prev, recommendation: rec, isRefreshing: false }));
      if (session?.access_token) {
        saveHistory(query, state.preferences, rec, session.access_token).catch(() => {});
      }
    } catch {
      setState((prev) => ({ ...prev, isRefreshing: false }));
    }
  };

  const handleFindListings = (_condition: string, productName: string) => {
    const { carousell, facebook } = getMarketplaceLinks(productName);
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
    window.history.replaceState(null, '', window.location.pathname);
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
    setState((prev) => ({ ...prev, currentStep: 'search', selectedProduct: null }));
  };

  const handleGoBackToPreferences = () => {
    setState((prev) => ({ ...prev, currentStep: 'sliders' }));
  };

  const handleRerunHistory = (item: HistoryItem) => {
    setState((prev) => ({
      ...prev,
      currentStep: 'results',
      searchQuery: item.product_name,
      preferences: item.preferences,
      recommendation: item.recommendation,
      selectedProduct: null,
      error: null,
    }));
  };

  const handleGoToHistory = () => setState((prev) => ({ ...prev, currentStep: 'history' }));
  const handleGoToProfile = () => setState((prev) => ({ ...prev, currentStep: 'profile' }));
  const handleGoToAuth = () => setState((prev) => ({ ...prev, currentStep: 'auth' }));

  const fullPageSteps: AppStep[] = ['landing', 'search', 'docs'];
  const isFullPage = fullPageSteps.includes(state.currentStep);

  return (
    <>
      {state.currentStep === 'landing' && (
        <LandingPage onGetStarted={handleGetStarted} onExplore={handleExplore} />
      )}
      {state.currentStep === 'docs' && (
        <DocsPage onBack={handleDocsBack} />
      )}
      {state.currentStep === 'search' && (
        <SearchPage
          onSearch={handleSearch}
          isLoading={state.isLoading}
          onGoToAuth={handleGoToAuth}
          onGoToHistory={handleGoToHistory}
          onGoToProfile={handleGoToProfile}
        />
      )}

      {/* Auth / History / Profile — rendered inside the card layout */}
      {!isFullPage && (
        <BackgroundLayout>
          <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-2xl mx-auto">
              <header className="mb-8 text-center relative">
                <H1 className="text-white mb-2 drop-shadow-2xl">SecondSense</H1>
                <P className="text-white/90 mt-0 drop-shadow-lg">Should you purchase it brand new or used?</P>
              </header>

              <div className="bg-card text-card-foreground rounded-lg shadow-lg p-6 md:p-8">
                {['sliders', 'results', 'error', 'disambiguation'].includes(state.currentStep) && (
                  <FlowBreadcrumbs
                    currentStep={
                      state.currentStep === 'sliders' ? 'preferences'
                      : state.currentStep === 'results' ? 'results'
                      : 'search'
                    }
                    onGoToSearch={handleGoBackToSearch}
                    onGoToPreferences={handleGoBackToPreferences}
                    user={user}
                    onGoToHistory={handleGoToHistory}
                    onGoToProfile={handleGoToProfile}
                    onGoToAuth={handleGoToAuth}
                    onGoToLanding={() => setState((prev) => ({ ...prev, currentStep: 'landing' }))}
                  />
                )}

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
                    onRefresh={handleRefresh}
                    isRefreshing={state.isRefreshing}
                  />
                )}

                {state.currentStep === 'error' && (
                  <ErrorPage
                    error={state.error || 'An error occurred'}
                    onRetry={handleRetry}
                    suggestion="Try a more specific product name, or check that the backend is running."
                  />
                )}

                {state.currentStep === 'auth' && (
                  <AuthPage onBack={() => setState((prev) => ({ ...prev, currentStep: 'search' }))} />
                )}

                {state.currentStep === 'history' && (
                  <HistoryPage
                    onRerun={handleRerunHistory}
                    onBack={() => setState((prev) => ({ ...prev, currentStep: 'search' }))}
                    onGoToLanding={() => setState((prev) => ({ ...prev, currentStep: 'landing' }))}
                  />
                )}

                {state.currentStep === 'profile' && (
                  <ProfilePage
                    onRerun={handleRerunHistory}
                    onBack={() => setState((prev) => ({ ...prev, currentStep: 'search' }))}
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
    </>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AuthProvider>
        <div className="absolute right-4 top-4 z-50">
          <ModeToggle />
        </div>
        <AppInner />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
