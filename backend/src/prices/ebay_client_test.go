package prices

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func makeEbayServer(t *testing.T, items []map[string]any) *httptest.Server {
	t.Helper()
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{"itemSummaries": items})
	}))
}

func TestResolveMarketplaces_KnownCode(t *testing.T) {
	c := NewEbayClient("test-id")
	mps := c.resolveMarketplaces("SG")
	if len(mps) != 1 || mps[0].MarketplaceID != "EBAY_SG" {
		t.Errorf("expected EBAY_SG, got %+v", mps)
	}
}

func TestResolveMarketplaces_UnknownCode(t *testing.T) {
	c := NewEbayClient("test-id")
	mps := c.resolveMarketplaces("ZZ")
	if len(mps) != 2 {
		t.Errorf("unknown code should return 2 default marketplaces, got %d", len(mps))
	}
}

func TestResolveMarketplaces_CaseInsensitive(t *testing.T) {
	c := NewEbayClient("test-id")
	lower := c.resolveMarketplaces("gb")
	upper := c.resolveMarketplaces("GB")
	if lower[0].MarketplaceID != upper[0].MarketplaceID {
		t.Error("marketplace resolution should be case-insensitive")
	}
}

func TestFetchTierPrices_ParsesPrices(t *testing.T) {
	items := []map[string]any{
		{"price": map[string]any{"value": "149.99", "currency": "USD"}},
		{"price": map[string]any{"value": "120.00", "currency": "USD"}},
		{"price": map[string]any{"value": "135.50", "currency": "USD"}},
	}
	srv := makeEbayServer(t, items)
	defer srv.Close()

	client := &EbayClient{
		appID:      "test",
		httpClient: srv.Client(),
	}
	// Patch the base URL to point at our test server.
	origBase := ebayBrowseBase
	ebayBrowseBase = srv.URL
	defer func() { ebayBrowseBase = origBase }()

	prices, err := client.fetchTierPrices(context.Background(), "iPhone 14", "1000", ebayMarketplace{"EBAY_US", "USD"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(prices) != 3 {
		t.Errorf("expected 3 prices, got %d", len(prices))
	}
	if prices[0] != 149.99 {
		t.Errorf("expected 149.99, got %f", prices[0])
	}
}

func TestFetchTierPrices_SkipsZeroPrice(t *testing.T) {
	items := []map[string]any{
		{"price": map[string]any{"value": "0.00", "currency": "USD"}},
		{"price": map[string]any{"value": "99.99", "currency": "USD"}},
	}
	srv := makeEbayServer(t, items)
	defer srv.Close()

	client := &EbayClient{appID: "test", httpClient: srv.Client()}
	origBase := ebayBrowseBase
	ebayBrowseBase = srv.URL
	defer func() { ebayBrowseBase = origBase }()

	prices, err := client.fetchTierPrices(context.Background(), "item", "1000", ebayMarketplace{"EBAY_US", "USD"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(prices) != 1 {
		t.Errorf("zero-price item should be filtered; got %d prices", len(prices))
	}
}

func TestFetchPrices_SourceLabels(t *testing.T) {
	// Return 5 items for brand_new and like_new, 0 for others → those get "ai_estimate".
	callCount := 0
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		callCount++
		filter := r.URL.Query().Get("filter")
		var items []map[string]any
		// Return data only for conditionId 1000 (brand_new) and 2500 (like_new).
		if filter == "conditionIds:{1000},buyingOptions:{FIXED_PRICE|AUCTION}" ||
			filter == "conditionIds:{2500},buyingOptions:{FIXED_PRICE|AUCTION}" {
			items = []map[string]any{
				{"price": map[string]any{"value": "100", "currency": "USD"}},
				{"price": map[string]any{"value": "110", "currency": "USD"}},
				{"price": map[string]any{"value": "105", "currency": "USD"}},
			}
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{"itemSummaries": items})
	}))
	defer srv.Close()

	client := &EbayClient{appID: "test", httpClient: srv.Client()}
	origBase := ebayBrowseBase
	ebayBrowseBase = srv.URL
	defer func() { ebayBrowseBase = origBase }()

	result, err := client.FetchPrices(context.Background(), "iPhone 14", "US")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.Sources["brand_new"] != "ebay" {
		t.Errorf("brand_new should be 'ebay', got %q", result.Sources["brand_new"])
	}
	if result.Sources["like_new"] != "ebay" {
		t.Errorf("like_new should be 'ebay', got %q", result.Sources["like_new"])
	}
	if result.Sources["good"] != "ai_estimate" {
		t.Errorf("good should be 'ai_estimate', got %q", result.Sources["good"])
	}
	if result.Sources["well_used"] != "ai_estimate" {
		t.Errorf("well_used should be 'ai_estimate', got %q", result.Sources["well_used"])
	}
}
