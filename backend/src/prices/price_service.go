package prices

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"regexp"
	"sort"
	"strings"
	"sync"

	"secondsense/backend/src/shared/domain"
)

type priceClient interface {
	SearchWithGrounding(ctx context.Context, prompt string) (string, error)
	GenerateJSON(ctx context.Context, prompt string) (string, error)
}

type PriceService struct {
	llm   priceClient
	ebay  *EbayClient // nil when EBAY_APP_ID is not configured
}

func NewPriceService(llm priceClient, ebay *EbayClient) *PriceService {
	return &PriceService{llm: llm, ebay: ebay}
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

// FetchPrices fetches prices for all condition tiers.
// When eBay is configured, eBay and Gemini run in parallel; results are merged
// per-tier (eBay wins when it has ≥3 listings, Gemini fills the rest).
// Returns the price data and a source map (per tier: "ebay" or "ai_estimate").
func (ps *PriceService) FetchPrices(ctx context.Context, canonicalName, countryCode string) (*domain.PriceData, map[string]string, error) {
	if ps.ebay == nil {
		// No eBay client — Gemini only.
		data, err := ps.fetchFromGemini(ctx, canonicalName, countryCode)
		if err != nil {
			return nil, nil, err
		}
		sources := map[string]string{
			"brand_new": "ai_estimate",
			"like_new":  "ai_estimate",
			"good":      "ai_estimate",
			"well_used": "ai_estimate",
		}
		return data, sources, nil
	}

	// Launch eBay and Gemini in parallel.
	var (
		ebayResult *EbayPriceResult
		ebayErr    error
		geminiData *domain.PriceData
		geminiErr  error
		wg         sync.WaitGroup
	)
	wg.Add(2)
	go func() {
		defer wg.Done()
		ebayResult, ebayErr = ps.ebay.FetchPrices(ctx, canonicalName, countryCode)
	}()
	go func() {
		defer wg.Done()
		geminiData, geminiErr = ps.fetchFromGemini(ctx, canonicalName, countryCode)
	}()
	wg.Wait()

	if ebayErr != nil {
		log.Printf("eBay price fetch failed: %v", ebayErr)
	}
	if geminiErr != nil {
		log.Printf("Gemini price fetch failed: %v", geminiErr)
	}

	// Merge: eBay wins per-tier when it has ≥3 listings; Gemini fills the rest.
	data, sources := mergePriceData(ebayResult, geminiData)
	if data != nil {
		return sanitiseTiers(data), sources, nil
	}

	return nil, nil, fmt.Errorf("all price sources failed for %q", canonicalName)
}

// mergePriceData combines eBay and Gemini results. eBay wins per-tier when it
// has ≥3 price points; Gemini fills any tier where eBay is sparse or absent.
// Returns nil data only when both inputs are nil.
func mergePriceData(ebay *EbayPriceResult, gemini *domain.PriceData) (*domain.PriceData, map[string]string) {
	sources := map[string]string{
		"brand_new": "ai_estimate",
		"like_new":  "ai_estimate",
		"good":      "ai_estimate",
		"well_used": "ai_estimate",
	}

	if ebay == nil && gemini == nil {
		return nil, sources
	}

	tierKeys := []string{"brand_new", "like_new", "good", "well_used"}
	result := &domain.PriceData{}

	for _, key := range tierKeys {
		var ebayPrices []float64
		if ebay != nil {
			ebayPrices = ebay.Tiers[key]
		}

		if len(ebayPrices) >= 3 {
			// eBay has sufficient coverage for this tier.
			sources[key] = "ebay"
			switch key {
			case "brand_new":
				result.BrandNew = validateTier(ebayPrices)
			case "like_new":
				result.LikeNew = validateTier(ebayPrices)
			case "good":
				result.Good = validateTier(ebayPrices)
			case "well_used":
				result.WellUsed = validateTier(ebayPrices)
			}
		} else if gemini != nil {
			// Gemini fills the gap.
			switch key {
			case "brand_new":
				result.BrandNew = gemini.BrandNew
			case "like_new":
				result.LikeNew = gemini.LikeNew
			case "good":
				result.Good = gemini.Good
			case "well_used":
				result.WellUsed = gemini.WellUsed
			}
		}
	}

	if len(result.BrandNew) == 0 && len(result.LikeNew) == 0 && len(result.Good) == 0 && len(result.WellUsed) == 0 {
		return nil, sources
	}
	return result, sources
}

// fetchFromGemini uses a single SearchWithGrounding call to both find live
// secondhand prices and return them classified into condition tiers as JSON.
// Combining search + extraction into one call saves one Gemini round-trip.
func (ps *PriceService) fetchFromGemini(ctx context.Context, canonicalName, countryCode string) (*domain.PriceData, error) {
	marketContext := geminiMarketContext(countryCode)

	prompt := fmt.Sprintf(
		"Search for current secondhand market prices for \"%s\". "+
			"%s\n\n"+
			"Find realistic asking prices across these four condition tiers:\n"+
			"- brand_new: sealed or near-retail condition (full price or slight discount)\n"+
			"- like_new: opened/lightly used, no visible wear, fully functional\n"+
			"- good: normal signs of use (minor scratches/scuffs), fully functional\n"+
			"- well_used: visible wear consistent with regular use, still working\n\n"+
			"Exclude broken, for-parts, or heavily damaged listings.\n"+
			"Collect at least 3 real price examples per tier from actual listings.\n\n"+
			"Return ONLY a JSON object — no prose, no markdown fences — in exactly this shape:\n"+
			"{\"brand_new\":[<numbers>],\"like_new\":[<numbers>],\"good\":[<numbers>],\"well_used\":[<numbers>]}\n"+
			"Use [] for any tier where no prices were found. Numbers only, no currency symbols.",
		canonicalName, marketContext,
	)

	raw, err := ps.llm.SearchWithGrounding(ctx, prompt)
	if err != nil {
		return nil, fmt.Errorf("price search failed: %w", err)
	}

	raw = extractJSON(raw)
	raw = sanitisePriceJSON(raw)

	var prices rawPrices
	if err := json.Unmarshal([]byte(raw), &prices); err != nil {
		return nil, fmt.Errorf("failed to parse price response: %w (raw: %.200s)", err, raw)
	}

	data := sanitiseTiers(&domain.PriceData{
		BrandNew: validateTier(prices.BrandNew),
		LikeNew:  validateTier(prices.LikeNew),
		Good:     validateTier(prices.Good),
		WellUsed: validateTier(prices.WellUsed),
	})

	if len(data.BrandNew) == 0 && len(data.LikeNew) == 0 && len(data.Good) == 0 && len(data.WellUsed) == 0 {
		return nil, fmt.Errorf("no valid prices found for %q", canonicalName)
	}

	return data, nil
}

// extractJSON isolates the first complete JSON object in s, tolerating any
// surrounding prose that the model may emit before or after the JSON block.
func extractJSON(s string) string {
	s = strings.TrimSpace(s)
	// Strip markdown fences first (```json ... ``` or ``` ... ```).
	if strings.HasPrefix(s, "```") {
		s = s[3:]
		if strings.HasPrefix(s, "json") {
			s = s[4:]
		}
		if idx := strings.LastIndex(s, "```"); idx != -1 {
			s = s[:idx]
		}
		s = strings.TrimSpace(s)
	}
	start := strings.Index(s, "{")
	end := strings.LastIndex(s, "}")
	if start != -1 && end != -1 && end > start {
		return s[start : end+1]
	}
	return s
}

// geminiMarketContext returns a market-specific search instruction based on the country code.
func geminiMarketContext(countryCode string) string {
	switch countryCode {
	case "SG":
		return "Find listings from Carousell SG, Facebook Marketplace SG, and Lazada SG. List prices in SGD."
	case "GB":
		return "Find listings from eBay UK, Gumtree, and Facebook Marketplace UK. List prices in GBP."
	case "AU":
		return "Find listings from eBay AU, Gumtree AU, and Facebook Marketplace AU. List prices in AUD."
	case "DE", "FR", "ES", "IT":
		return "Find listings from eBay, Facebook Marketplace, and local classified sites. List prices in EUR."
	case "CA":
		return "Find listings from eBay CA, Kijiji, and Facebook Marketplace Canada. List prices in CAD."
	default:
		return "Find listings from eBay US and Facebook Marketplace USA. List prices in USD."
	}
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

// trimLowOutliers removes prices that are implausibly cheap relative to the brand-new
// median. Any price below floor (brandNewMedian * ratio) is dropped. This prevents
// Gemini hallucinations like "$50 MacBook Pro" from pulling ranges down without
// distorting the whole tier via proportional rescaling.
func trimLowOutliers(prices []float64, floor float64) []float64 {
	if floor <= 0 || len(prices) == 0 {
		return prices
	}
	var out []float64
	for _, p := range prices {
		if p >= floor {
			out = append(out, p)
		}
	}
	if len(out) == 0 {
		return prices // floor would eliminate everything — keep original
	}
	return out
}

// sanitiseTiers drops implausibly low outliers from each tier using a floor
// derived from the brand-new median. Real secondhand markets never produce
// Well Used prices below ~5% of brand new for premium electronics.
func sanitiseTiers(d *domain.PriceData) *domain.PriceData {
	if len(d.BrandNew) == 0 {
		return d
	}
	bnMedian := median(d.BrandNew)
	// Floors as a fraction of brand-new median: progressively more lenient per tier.
	d.LikeNew = trimLowOutliers(d.LikeNew, bnMedian*0.15)
	d.Good = trimLowOutliers(d.Good, bnMedian*0.10)
	d.WellUsed = trimLowOutliers(d.WellUsed, bnMedian*0.05)
	return d
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
