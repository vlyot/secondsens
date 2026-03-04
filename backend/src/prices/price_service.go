package prices

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"regexp"
	"sort"

	"secondsense/backend/src/shared/domain"
)

type priceClient interface {
	SearchWithGrounding(ctx context.Context, prompt string) (string, error)
	GenerateJSON(ctx context.Context, prompt string) (string, error)
}

type PriceService struct {
	llm priceClient
}

func NewPriceService(llm priceClient) *PriceService {
	return &PriceService{llm: llm}
}

type rawPrices struct {
	BrandNew []float64 `json:"brand_new"`
	LikeNew  []float64 `json:"like_new"`
	Good     []float64 `json:"good"`
	WellUsed []float64 `json:"well_used"`
}

var missingValue = regexp.MustCompile(`("[^"]+")\s*:(\s*[,}])`)

func sanitisePriceJSON(s string) string {
	return missingValue.ReplaceAllString(s, `$1:[]$2`)
}

func (ps *PriceService) FetchPrices(ctx context.Context, canonicalName string) (*domain.PriceData, error) {
	searchPrompt := fmt.Sprintf(
		"Search for current Singapore secondhand prices for \"%s\". "+
			"Find listings from Carousell SG, Facebook Marketplace SG, and Lazada SG. "+
			"List specific asking prices in SGD for each condition: brand new, like new, good, well used. "+
			"Give at least 3 price examples per tier.",
		canonicalName,
	)

	searchResults, err := ps.llm.SearchWithGrounding(ctx, searchPrompt)
	if err != nil {
		return nil, fmt.Errorf("price search failed: %w", err)
	}

	extractPrompt := fmt.Sprintf(
		"Extract all prices from the text below about \"%s\" secondhand in Singapore.\n"+
			"TEXT:\n%s\n\n"+
			"Classify each price into: brand_new, like_new, good, well_used.\n"+
			"Output ONLY valid JSON. Every key MUST have an array value; use [] when no prices for that tier.\n"+
			"No markdown, no prose, no trailing commas.\n"+
			"Example: {\"brand_new\":[199.0],\"like_new\":[130.0,125.0],\"good\":[95.0],\"well_used\":[]}\n"+
			"Output the JSON:",
		canonicalName, searchResults,
	)

	raw, err := ps.llm.GenerateJSON(ctx, extractPrompt)
	if err != nil {
		return nil, fmt.Errorf("price extraction failed: %w", err)
	}

	raw = sanitisePriceJSON(raw)

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
