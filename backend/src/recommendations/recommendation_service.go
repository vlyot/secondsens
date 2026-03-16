package recommendations

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"time"

	"secondsense/backend/src/shared/domain"
)

// jsonClient is the subset of LLMClient used by RecommendationService.
type jsonClient interface {
	GenerateJSON(ctx context.Context, prompt string) (string, error)
}

// RecommendationService generates ranked recommendations from price data and user preferences.
type RecommendationService struct {
	llm jsonClient
}

// NewRecommendationService creates a new RecommendationService.
func NewRecommendationService(llm jsonClient) *RecommendationService {
	return &RecommendationService{llm: llm}
}

// tierStats holds computed statistics for one condition tier.
type tierStats struct {
	avg float64
	min float64
	max float64
}

// rankingResponse is the JSON schema returned by Gemini for recommendation ranking.
type rankingResponse struct {
	Rankings []struct {
		Rank          int     `json:"rank"`
		Condition     string  `json:"condition"`
		AvgPrice      float64 `json:"avg_price"`
		Justification string  `json:"justification"`
	} `json:"rankings"`
	Reasoning       string `json:"reasoning"`
	ConfidenceScore string `json:"confidence_score"`
}

// Generate produces ranked recommendations for a product given price data and user preferences.
func (rs *RecommendationService) Generate(
	ctx context.Context,
	canonicalName string,
	prices *domain.PriceData,
	prefs *domain.Preferences,
) (*domain.RecommendationResponse, error) {
	brandNew := computeStats(prices.BrandNew)
	likeNew := computeStats(prices.LikeNew)
	good := computeStats(prices.Good)
	wellUsed := computeStats(prices.WellUsed)

	budgetLine := fmt.Sprintf("Budget Flexibility: %d/10  (0=very tight budget, 10=very flexible)", prefs.BudgetFlexibility)
	if !prefs.BudgetFlexibilityActive {
		budgetLine = "Budget Flexibility: user does not consider this factor — ignore it in your ranking"
	}

	qualityLine := fmt.Sprintf("Quality Priority: %d/10  (0=any condition acceptable, 10=pristine only)", prefs.QualityPriority)
	if !prefs.QualityPriorityActive {
		qualityLine = "Quality Priority: user does not consider this factor — ignore it in your ranking"
	}

	riskLine := fmt.Sprintf("Risk Tolerance: %d/10  (0=comfortable with uncertainty, 10=needs guaranteed quality)", prefs.RiskTolerance)
	if !prefs.RiskToleranceActive {
		riskLine = "Risk Tolerance: user does not consider this factor — ignore it in your ranking"
	}

	useFreqMap := map[string]string{
		"occasional":   "occasional use",
		"regular":      "regular use",
		"daily_driver": "daily driver (heavy, frequent use)",
	}
	urgencyMap := map[string]string{
		"no_rush":      "no rush — happy to wait for a better deal",
		"soon":         "looking to buy soon",
		"need_it_now":  "needs it urgently — timing is critical",
	}
	resaleMap := map[string]string{
		"keeping":              "planning to keep long-term",
		"maybe":               "might resell eventually",
		"definitely_reselling": "definitely reselling — high resale value matters",
	}

	useFreqLine := fmt.Sprintf("Use Frequency: %s", useFreqMap[prefs.UseFrequency])
	urgencyLine := fmt.Sprintf("Deal Urgency: %s", urgencyMap[prefs.DealUrgency])
	resaleLine := fmt.Sprintf("Resale Priority: %s", resaleMap[prefs.ResalePriority])

	contextLine := ""
	if prefs.Context != "" {
		contextLine = "\nAdditional user context: " + prefs.Context
	}

	prompt := fmt.Sprintf(
		`Product: %s
Market prices (SGD):
  Brand New: avg S$%.2f, range S$%.2f–%.2f
  Like New:  avg S$%.2f, range S$%.2f–%.2f
  Good:      avg S$%.2f, range S$%.2f–%.2f
  Well Used: avg S$%.2f, range S$%.2f–%.2f

User preferences:
  %s
  %s
  %s
  %s
  %s
  %s%s

Rank the top 3 condition tiers for this user. Factor in all six preferences together:
- Budget Flexibility and Quality Priority guide which price/condition tradeoff suits them
- Risk Tolerance indicates how much uncertainty they can accept in a used purchase
- Use Frequency affects how much reliability and durability matter
- Deal Urgency affects whether current market pricing is acceptable or they should aim differently
- Resale Priority affects whether condition retention and brand value matter

Return JSON ONLY (no markdown):
{
  "rankings": [
    {"rank": 1, "condition": "like_new", "avg_price": 90.0, "justification": "..."},
    {"rank": 2, "condition": "good", "avg_price": 70.0, "justification": "..."},
    {"rank": 3, "condition": "brand_new", "avg_price": 150.0, "justification": "..."}
  ],
  "reasoning": "overall explanation of why these tiers suit the user",
  "confidence_score": "High"
}
Valid condition values: "brand_new", "like_new", "good", "well_used". confidence_score: "High", "Medium", or "Low".`,
		canonicalName,
		brandNew.avg, brandNew.min, brandNew.max,
		likeNew.avg, likeNew.min, likeNew.max,
		good.avg, good.min, good.max,
		wellUsed.avg, wellUsed.min, wellUsed.max,
		budgetLine, qualityLine, riskLine, useFreqLine, urgencyLine, resaleLine, contextLine,
	)

	raw, err := rs.llm.GenerateJSON(ctx, prompt)
	if err != nil {
		return nil, fmt.Errorf("recommendation generation failed: %w", err)
	}

	var ranking rankingResponse
	if err := json.Unmarshal([]byte(raw), &ranking); err != nil {
		return nil, fmt.Errorf("failed to parse ranking response: %w (raw: %.200s)", err, raw)
	}

	statsMap := map[string]tierStats{
		"brand_new": brandNew,
		"like_new":  likeNew,
		"good":      good,
		"well_used": wellUsed,
	}

	brandNewAvg := brandNew.avg
	recommendations := make([]domain.RankedOption, 0, len(ranking.Rankings))
	for _, r := range ranking.Rankings {
		stats := statsMap[r.Condition]
		savingsAbs := math.Max(0, brandNewAvg-stats.avg)
		savingsPct := 0.0
		if brandNewAvg > 0 {
			savingsPct = math.Round(savingsAbs/brandNewAvg*1000) / 10
		}
		recommendations = append(recommendations, domain.RankedOption{
			Rank:      r.Rank,
			Condition: r.Condition,
			AvgPrice:  stats.avg,
			PriceRange: domain.PriceRange{
				Min: stats.min,
				Max: stats.max,
			},
			SavingsVsNew: domain.SavingsInfo{
				Absolute: math.Round(savingsAbs*100) / 100,
				Percent:  savingsPct,
			},
			Justification: r.Justification,
		})
	}

	return &domain.RecommendationResponse{
		Success:     true,
		ProductName: canonicalName,
		Recommendations: recommendations,
		MarketStats: domain.MarketStats{
			BrandNew: domain.MarketTier{AvgPrice: brandNew.avg, Range: domain.PriceRange{Min: brandNew.min, Max: brandNew.max}},
			LikeNew:  domain.MarketTier{AvgPrice: likeNew.avg, Range: domain.PriceRange{Min: likeNew.min, Max: likeNew.max}},
			Good:     domain.MarketTier{AvgPrice: good.avg, Range: domain.PriceRange{Min: good.min, Max: good.max}},
			WellUsed: domain.MarketTier{AvgPrice: wellUsed.avg, Range: domain.PriceRange{Min: wellUsed.min, Max: wellUsed.max}},
		},
		Reasoning:       ranking.Reasoning,
		ConfidenceScore: ranking.ConfidenceScore,
		Timestamp:       time.Now().UTC().Format(time.RFC3339),
	}, nil
}

// computeStats calculates avg, min, max for a price tier. Returns zero-value stats for empty slices.
func computeStats(prices []float64) tierStats {
	if len(prices) == 0 {
		return tierStats{}
	}
	var sum, minP, maxP float64
	minP = prices[0]
	maxP = prices[0]
	for _, p := range prices {
		sum += p
		if p < minP {
			minP = p
		}
		if p > maxP {
			maxP = p
		}
	}
	avg := math.Round(sum/float64(len(prices))*100) / 100
	return tierStats{avg: avg, min: minP, max: maxP}
}
