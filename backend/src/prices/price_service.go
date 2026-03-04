package prices

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"sort"

	"secondsense/backend/src/shared/domain"
)

// groundingClient is the subset of LLMClient used by PriceService.
type groundingClient interface {
	SearchWithGrounding(ctx context.Context, prompt string) (string, error)
}

// PriceService fetches and validates live secondhand prices using Gemini grounded search.
type PriceService struct {
	llm groundingClient
}

// NewPriceService creates a new PriceService.
func NewPriceService(llm groundingClient) *PriceService {
	return &PriceService{llm: llm}
}

// rawPrices is the JSON structure returned by Gemini for price fetching.
type rawPrices struct {
	BrandNew []float64 `json:"brand_new"`
	LikeNew  []float64 `json:"like_new"`
	Good     []float64 `json:"good"`
	WellUsed []float64 `json:"well_used"`
}

// FetchPrices retrieves current Singapore secondhand prices for the given canonical product name.
// Uses Gemini's Google Search grounding to find live listings on Carousell, Facebook Marketplace SG, and Lazada.
func (ps *PriceService) FetchPrices(ctx context.Context, canonicalName string) (*domain.PriceData, error) {
	prompt := fmt.Sprintf(
		`Search for current Singapore secondhand prices for "%s".`+
			` Find listings from Carousell, Facebook Marketplace Singapore, and Lazada.`+
			` Return a JSON object ONLY (no markdown, no explanation) with this exact structure:`+
			` {"brand_new":[price1,price2,...],"like_new":[price1,price2,...],"good":[price1,price2,...],"well_used":[price1,price2,...]}`+
			` Rules: prices in SGD as numbers only, active listings only, include at least 3 prices per tier where available, exclude obvious outliers.`,
		canonicalName,
	)

	raw, err := ps.llm.SearchWithGrounding(ctx, prompt)
	if err != nil {
		return nil, fmt.Errorf("price search failed: %w", err)
	}

	var prices rawPrices
	if err := json.Unmarshal([]byte(raw), &prices); err != nil {
		return nil, fmt.Errorf("failed to parse price response: %w (raw: %.200s)", err, raw)
	}

	data := &domain.PriceData{
		BrandNew: validateTier(prices.BrandNew),
		LikeNew:  validateTier(prices.LikeNew),
		Good:     validateTier(prices.Good),
		WellUsed: validateTier(prices.WellUsed),
	}

	if len(data.BrandNew) == 0 && len(data.LikeNew) == 0 && len(data.Good) == 0 && len(data.WellUsed) == 0 {
		return nil, fmt.Errorf("no valid prices found for %q", canonicalName)
	}

	return data, nil
}

// validateTier removes negative prices and outliers (>3× median), requires at least 1 price.
func validateTier(prices []float64) []float64 {
	var positive []float64
	for _, p := range prices {
		if p > 0 {
			positive = append(positive, p)
		}
	}
	if len(positive) == 0 {
		return nil
	}

	med := median(positive)
	var filtered []float64
	for _, p := range positive {
		if p <= med*3 {
			filtered = append(filtered, p)
		}
	}
	return filtered
}

func median(prices []float64) float64 {
	sorted := make([]float64, len(prices))
	copy(sorted, prices)
	sort.Float64s(sorted)
	n := len(sorted)
	if n%2 == 0 {
		return math.Round((sorted[n/2-1]+sorted[n/2])/2*100) / 100
	}
	return sorted[n/2]
}
