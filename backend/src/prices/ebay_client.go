package prices

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// ebayMarketplace maps a country code to an eBay marketplace ID and currency symbol.
type ebayMarketplace struct {
	MarketplaceID string
	Currency      string
}

var countryToMarketplace = map[string]ebayMarketplace{
	"US": {"EBAY_US", "USD"},
	"GB": {"EBAY_GB", "GBP"},
	"AU": {"EBAY_AU", "AUD"},
	"SG": {"EBAY_SG", "SGD"},
	"DE": {"EBAY_DE", "EUR"},
	"FR": {"EBAY_FR", "EUR"},
	"CA": {"EBAY_CA", "CAD"},
	"IT": {"EBAY_IT", "EUR"},
	"ES": {"EBAY_ES", "EUR"},
}

// conditionIDs maps our tier keys to eBay condition IDs.
// 1000=New, 2500=Like New/Certified Refurbished, 3000=Good/Used, 5000=For Parts
var conditionIDs = map[string]string{
	"brand_new": "1000",
	"like_new":  "2500",
	"good":      "3000",
	"well_used": "5000",
}

// ebayBrowseBase is a var so tests can override it with an httptest.Server URL.
var ebayBrowseBase = "https://api.ebay.com/buy/browse/v1/item_summary/search"

// EbayClient fetches sold/active listing prices from the eBay Browse API.
type EbayClient struct {
	appID      string
	httpClient *http.Client
}

// NewEbayClient creates a new EbayClient with the given App ID (Client ID).
func NewEbayClient(appID string) *EbayClient {
	return &EbayClient{
		appID: appID,
		httpClient: &http.Client{
			Timeout: 15 * time.Second,
		},
	}
}

// EbayPriceResult holds raw price arrays per tier and the source label for each tier.
type EbayPriceResult struct {
	// Tiers contains raw price values per condition key (brand_new, like_new, good, well_used).
	Tiers map[string][]float64
	// Sources contains "ebay" for tiers with >= 3 results, "ai_estimate" otherwise.
	Sources map[string]string
}

// ebaySearchResponse is the subset of the eBay Browse API response we care about.
type ebaySearchResponse struct {
	ItemSummaries []struct {
		Price struct {
			Value    string `json:"value"`
			Currency string `json:"currency"`
		} `json:"price"`
	} `json:"itemSummaries"`
}

// FetchPrices queries eBay for prices across all 4 condition tiers.
// countryCode is a 2-letter ISO code (e.g. "US", "SG"). Unknown codes fall back to US+GB merged.
// Tiers with < 3 results are marked as "ai_estimate" in the Sources map.
func (e *EbayClient) FetchPrices(ctx context.Context, query, countryCode string) (*EbayPriceResult, error) {
	result := &EbayPriceResult{
		Tiers:   make(map[string][]float64),
		Sources: make(map[string]string),
	}

	marketplaces := e.resolveMarketplaces(countryCode)

	for tierKey, condID := range conditionIDs {
		var allPrices []float64
		for _, mp := range marketplaces {
			prices, err := e.fetchTierPrices(ctx, query, condID, mp)
			if err != nil {
				// Non-fatal: log and continue; missing tiers trigger fallback in price_service.
				continue
			}
			allPrices = append(allPrices, prices...)
		}
		result.Tiers[tierKey] = allPrices
		if len(allPrices) >= 3 {
			result.Sources[tierKey] = "ebay"
		} else {
			result.Sources[tierKey] = "ai_estimate"
		}
	}

	return result, nil
}

// resolveMarketplaces returns the eBay marketplaces to query for a country code.
// Unknown or empty codes default to US+GB for maximum coverage.
func (e *EbayClient) resolveMarketplaces(countryCode string) []ebayMarketplace {
	code := strings.ToUpper(strings.TrimSpace(countryCode))
	if mp, ok := countryToMarketplace[code]; ok {
		return []ebayMarketplace{mp}
	}
	// Default: merge US and GB results.
	return []ebayMarketplace{
		countryToMarketplace["US"],
		countryToMarketplace["GB"],
	}
}

// fetchTierPrices calls the eBay Browse API for a single condition tier and marketplace.
func (e *EbayClient) fetchTierPrices(ctx context.Context, query, conditionID string, mp ebayMarketplace) ([]float64, error) {
	params := url.Values{}
	params.Set("q", query)
	params.Set("filter", fmt.Sprintf("conditionIds:{%s},buyingOptions:{FIXED_PRICE|AUCTION}", conditionID))
	params.Set("limit", "20")

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, ebayBrowseBase+"?"+params.Encode(), nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+e.appID)
	req.Header.Set("X-EBAY-C-MARKETPLACE-ID", mp.MarketplaceID)
	req.Header.Set("Content-Type", "application/json")

	resp, err := e.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 512))
		return nil, fmt.Errorf("eBay API %d: %s", resp.StatusCode, string(body))
	}

	var parsed ebaySearchResponse
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		return nil, fmt.Errorf("eBay response decode: %w", err)
	}

	var prices []float64
	for _, item := range parsed.ItemSummaries {
		var v float64
		if _, err := fmt.Sscanf(item.Price.Value, "%f", &v); err == nil && v > 0 {
			prices = append(prices, v)
		}
	}
	return prices, nil
}
