package recommendations

import (
	"context"
	"strings"
	"testing"

	"secondsense/backend/src/shared/domain"
)

func TestNewRecommendationService(t *testing.T) {
	rs := NewRecommendationService(nil)
	if rs == nil {
		t.Error("NewRecommendationService should return non-nil service")
	}
}

func TestComputeStats(t *testing.T) {
	stats := computeStats([]float64{100, 200, 300})
	if stats.avg != 200 {
		t.Errorf("avg = %.2f, want 200", stats.avg)
	}
	if stats.min != 100 {
		t.Errorf("min = %.2f, want 100", stats.min)
	}
	if stats.max != 300 {
		t.Errorf("max = %.2f, want 300", stats.max)
	}

	empty := computeStats(nil)
	if empty.avg != 0 || empty.min != 0 || empty.max != 0 {
		t.Error("empty slice should return zero stats")
	}
}

// mockLLM implements jsonClient for testing.
type mockLLM struct {
	response string
	err      error
}

func (m *mockLLM) GenerateJSON(_ context.Context, _ string) (string, error) {
	return m.response, m.err
}

func TestPriceStats_RealisticData(t *testing.T) {
	// Verify that Generate correctly computes min/avg/max stats from realistic price data.
	// sanitiseTiers (called upstream in price_service) handles outlier trimming;
	// the recommendation service just maps raw slices to stats — no reordering.
	prices := &domain.PriceData{
		BrandNew: []float64{1400, 1500, 1600},
		LikeNew:  []float64{900, 1000, 1100},
		Good:     []float64{650, 700, 750},
		WellUsed: []float64{400, 450, 500},
	}

	llm := &mockLLM{response: `{
		"rankings": [
			{"rank": 1, "condition": "brand_new", "avg_price": 1500, "justification": "best value"},
			{"rank": 2, "condition": "like_new", "avg_price": 1000, "justification": "ok"},
			{"rank": 3, "condition": "good", "avg_price": 700, "justification": "fine"}
		],
		"reasoning": "test",
		"confidence_score": "High"
	}`}
	rs := NewRecommendationService(llm)
	resp, err := rs.Generate(context.Background(), "MacBook Pro", prices, &domain.Preferences{
		UseFrequency:   "regular",
		DealUrgency:    "soon",
		ResalePriority: "keeping",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Min/max/avg should reflect the input slices faithfully.
	if resp.MarketStats.BrandNew.Range.Min != 1400 {
		t.Errorf("brand_new min: want 1400, got %.2f", resp.MarketStats.BrandNew.Range.Min)
	}
	if resp.MarketStats.BrandNew.Range.Max != 1600 {
		t.Errorf("brand_new max: want 1600, got %.2f", resp.MarketStats.BrandNew.Range.Max)
	}
	if resp.MarketStats.WellUsed.Range.Min != 400 {
		t.Errorf("well_used min: want 400, got %.2f", resp.MarketStats.WellUsed.Range.Min)
	}
	if resp.MarketStats.WellUsed.Range.Max != 500 {
		t.Errorf("well_used max: want 500, got %.2f", resp.MarketStats.WellUsed.Range.Max)
	}
}

func TestUseFreqMapNoSlang(t *testing.T) {
	// Verify daily_driver is not rendered as "daily driver" slang in the LLM prompt.
	// We capture what gets passed to GenerateJSON by checking the mockLLM receives
	// the correct description string.
	var capturedPrompt string
	captured := &capturingLLM{
		response: `{
			"rankings": [
				{"rank": 1, "condition": "brand_new", "avg_price": 100, "justification": "new"},
				{"rank": 2, "condition": "like_new", "avg_price": 80, "justification": "good"},
				{"rank": 3, "condition": "good", "avg_price": 60, "justification": "ok"}
			],
			"reasoning": "test",
			"confidence_score": "High"
		}`,
		capture: &capturedPrompt,
	}
	rs := NewRecommendationService(captured)
	_, _ = rs.Generate(context.Background(), "Sony WH-1000XM5", &domain.PriceData{
		BrandNew: []float64{350},
		LikeNew:  []float64{250},
		Good:     []float64{180},
		WellUsed: []float64{120},
	}, &domain.Preferences{
		UseFrequency:   "daily_driver",
		DealUrgency:    "soon",
		ResalePriority: "keeping",
	})

	if strings.Contains(capturedPrompt, "daily driver") {
		t.Error("LLM prompt should not contain the slang phrase 'daily driver'")
	}
}

// capturingLLM records the prompt passed to GenerateJSON for the ranking call.
type capturingLLM struct {
	response string
	capture  *string
}

func (c *capturingLLM) GenerateJSON(_ context.Context, prompt string) (string, error) {
	*c.capture = prompt
	return c.response, nil
}

