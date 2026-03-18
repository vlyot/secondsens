package prices

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
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
// It tries eBay first (when configured), using countryCode to select the right marketplace.
// Any tier with fewer than 3 eBay results falls back to a Gemini grounded search.
// Returns the price data and a source map (per tier: "ebay" or "ai_estimate").
func (ps *PriceService) FetchPrices(ctx context.Context, canonicalName, countryCode string) (*domain.PriceData, map[string]string, error) {
	sources := map[string]string{
		"brand_new": "ai_estimate",
		"like_new":  "ai_estimate",
		"good":      "ai_estimate",
		"well_used": "ai_estimate",
	}

	// Try eBay when a client is configured.
	if ps.ebay != nil {
		ebayResult, err := ps.ebay.FetchPrices(ctx, canonicalName, countryCode)
		if err != nil {
			log.Printf("eBay price fetch failed (falling back to Gemini): %v", err)
		} else {
			// Check if eBay returned enough data across all tiers to skip Gemini entirely.
			tiersWithData := 0
			for tierKey, prices := range ebayResult.Tiers {
				if len(prices) >= 3 {
					tiersWithData++
					sources[tierKey] = "ebay"
				}
			}

			// If eBay covered at least 2 tiers, build a mixed result:
			// use eBay data where available, fall back to Gemini only for sparse tiers.
			if tiersWithData >= 2 {
				ebayData := &domain.PriceData{
					BrandNew: validateTier(ebayResult.Tiers["brand_new"]),
					LikeNew:  validateTier(ebayResult.Tiers["like_new"]),
					Good:     validateTier(ebayResult.Tiers["good"]),
					WellUsed: validateTier(ebayResult.Tiers["well_used"]),
				}

				// For any tier that eBay couldn't cover, fill from Gemini.
				sparseTiers := []string{}
				for tierKey, src := range sources {
					if src == "ai_estimate" {
						sparseTiers = append(sparseTiers, tierKey)
					}
				}
				if len(sparseTiers) > 0 {
					geminiData, err := ps.fetchFromGemini(ctx, canonicalName, countryCode)
					if err != nil {
						log.Printf("Gemini fallback for sparse tiers failed: %v", err)
					} else {
						if sources["brand_new"] == "ai_estimate" && len(geminiData.BrandNew) > 0 {
							ebayData.BrandNew = geminiData.BrandNew
						}
						if sources["like_new"] == "ai_estimate" && len(geminiData.LikeNew) > 0 {
							ebayData.LikeNew = geminiData.LikeNew
						}
						if sources["good"] == "ai_estimate" && len(geminiData.Good) > 0 {
							ebayData.Good = geminiData.Good
						}
						if sources["well_used"] == "ai_estimate" && len(geminiData.WellUsed) > 0 {
							ebayData.WellUsed = geminiData.WellUsed
						}
					}
				}

				data := sanitiseTiers(ebayData)
				if len(data.BrandNew) > 0 || len(data.LikeNew) > 0 || len(data.Good) > 0 || len(data.WellUsed) > 0 {
					return data, sources, nil
				}
			}
		}
	}

	// Full Gemini fallback (no eBay client, or eBay returned < 2 useful tiers).
	data, err := ps.fetchFromGemini(ctx, canonicalName, countryCode)
	if err != nil {
		return nil, nil, err
	}
	// All tiers come from Gemini — sources map already defaults to "ai_estimate".
	return data, sources, nil
}

// fetchFromGemini performs the original Gemini grounded search for prices.
// countryCode is used to tailor the market context (SG → Carousell/Lazada, others → broader search).
func (ps *PriceService) fetchFromGemini(ctx context.Context, canonicalName, countryCode string) (*domain.PriceData, error) {
	marketContext := geminiMarketContext(countryCode)

	searchPrompt := fmt.Sprintf(
		"Search for current secondhand market prices for \"%s\". "+
			"%s "+
			"List realistic asking prices for each condition tier: brand new (retail/near-retail), "+
			"like new (minimal wear, fully functional), good (normal use marks, fully functional), "+
			"well used (visible wear but working). "+
			"Prices must reflect actual market listings — do not include broken, for-parts, or heavily damaged items. "+
			"Give at least 3 specific price examples per tier.",
		canonicalName, marketContext,
	)

	searchResults, err := ps.llm.SearchWithGrounding(ctx, searchPrompt)
	if err != nil {
		return nil, fmt.Errorf("price search failed: %w", err)
	}

	extractPrompt := fmt.Sprintf(
		"Extract all prices from the text below about \"%s\" secondhand.\n"+
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
