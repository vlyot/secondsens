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

func TestPriceRangeClamping(t *testing.T) {
	// Simulate inverted scrape data: well_used prices higher than brand_new
	prices := &domain.PriceData{
		BrandNew: []float64{100},
		LikeNew:  []float64{120}, // inverted: higher than brand new
		Good:     []float64{130}, // further inverted
		WellUsed: []float64{140}, // worst condition, highest price
	}

	llm := &mockLLM{response: `{
		"rankings": [
			{"rank": 1, "condition": "brand_new", "avg_price": 100, "justification": "best value"},
			{"rank": 2, "condition": "like_new", "avg_price": 100, "justification": "ok"},
			{"rank": 3, "condition": "good", "avg_price": 100, "justification": "fine"}
		],
		"reasoning": "test",
		"confidence_score": "High"
	}`}
	rs := NewRecommendationService(llm)
	resp, err := rs.Generate(context.Background(), "Test Product", prices, &domain.Preferences{
		UseFrequency:   "regular",
		DealUrgency:    "soon",
		ResalePriority: "keeping",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	bn := resp.MarketStats.BrandNew.AvgPrice
	ln := resp.MarketStats.LikeNew.AvgPrice
	g := resp.MarketStats.Good.AvgPrice
	wu := resp.MarketStats.WellUsed.AvgPrice

	if ln > bn {
		t.Errorf("like_new avg (%.2f) should not exceed brand_new avg (%.2f)", ln, bn)
	}
	if g > ln {
		t.Errorf("good avg (%.2f) should not exceed like_new avg (%.2f)", g, ln)
	}
	if wu > g {
		t.Errorf("well_used avg (%.2f) should not exceed good avg (%.2f)", wu, g)
	}

	// Verify max bounds are also clamped
	bnMax := resp.MarketStats.BrandNew.Range.Max
	lnMax := resp.MarketStats.LikeNew.Range.Max
	gMax := resp.MarketStats.Good.Range.Max
	wuMax := resp.MarketStats.WellUsed.Range.Max

	if lnMax > bnMax {
		t.Errorf("like_new max (%.2f) should not exceed brand_new max (%.2f)", lnMax, bnMax)
	}
	if gMax > lnMax {
		t.Errorf("good max (%.2f) should not exceed like_new max (%.2f)", gMax, lnMax)
	}
	if wuMax > gMax {
		t.Errorf("well_used max (%.2f) should not exceed good max (%.2f)", wuMax, gMax)
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

