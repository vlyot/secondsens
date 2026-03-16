package domain

import (
	"encoding/json"
	"testing"
)

func TestRecommendationRequestJSON(t *testing.T) {
	req := RecommendationRequest{
		Item: "Logitech G Pro X Superlight",
		Preferences: Preferences{
			BudgetFlexibility: 7,
			QualityPriority:   6,
			RiskTolerance:     8,
			UseFrequency:      "regular",
			DealUrgency:       "soon",
			ResalePriority:    "keeping",
		},
	}

	data, err := json.Marshal(req)
	if err != nil {
		t.Fatalf("Marshal failed: %v", err)
	}

	var unmarshaled RecommendationRequest
	err = json.Unmarshal(data, &unmarshaled)
	if err != nil {
		t.Fatalf("Unmarshal failed: %v", err)
	}

	if unmarshaled.Item != req.Item {
		t.Errorf("Item mismatch: got %s, want %s", unmarshaled.Item, req.Item)
	}
	if unmarshaled.Preferences.BudgetFlexibility != req.Preferences.BudgetFlexibility {
		t.Errorf("BudgetFlexibility mismatch: got %d, want %d",
			unmarshaled.Preferences.BudgetFlexibility,
			req.Preferences.BudgetFlexibility)
	}
}

func TestPreferencesValidRange(t *testing.T) {
	prefs := Preferences{
		BudgetFlexibility: 0,
		QualityPriority:   5,
		RiskTolerance:     10,
		UseFrequency:      "daily_driver",
		DealUrgency:       "need_it_now",
		ResalePriority:    "definitely_reselling",
	}

	// Test marshaling of boundary values
	data, err := json.Marshal(prefs)
	if err != nil {
		t.Fatalf("Marshal failed: %v", err)
	}

	var unmarshaled Preferences
	err = json.Unmarshal(data, &unmarshaled)
	if err != nil {
		t.Fatalf("Unmarshal failed: %v", err)
	}

	if unmarshaled.BudgetFlexibility != 0 {
		t.Errorf("BudgetFlexibility: got %d, want 0", unmarshaled.BudgetFlexibility)
	}
	if unmarshaled.QualityPriority != 5 {
		t.Errorf("QualityPriority: got %d, want 5", unmarshaled.QualityPriority)
	}
	if unmarshaled.RiskTolerance != 10 {
		t.Errorf("RiskTolerance: got %d, want 10", unmarshaled.RiskTolerance)
	}
	if unmarshaled.UseFrequency != "daily_driver" {
		t.Errorf("UseFrequency: got %s, want daily_driver", unmarshaled.UseFrequency)
	}
	if unmarshaled.DealUrgency != "need_it_now" {
		t.Errorf("DealUrgency: got %s, want need_it_now", unmarshaled.DealUrgency)
	}
	if unmarshaled.ResalePriority != "definitely_reselling" {
		t.Errorf("ResalePriority: got %s, want definitely_reselling", unmarshaled.ResalePriority)
	}
}

func TestRecommendationResponseJSON(t *testing.T) {
	resp := RecommendationResponse{
		Success:     true,
		ProductName: "Logitech G Pro X Superlight",
		Recommendations: []RankedOption{
			{
				Rank:      1,
				Condition: "Like New",
				AvgPrice:  89.99,
				PriceRange: PriceRange{Min: 85.0, Max: 95.0},
				SavingsVsNew: SavingsInfo{Absolute: 46.0, Percent: 34.0},
				Justification: "Best value",
			},
		},
		MarketStats: MarketStats{
			BrandNew: MarketTier{AvgPrice: 135.99, Range: PriceRange{Min: 130.0, Max: 140.0}},
			LikeNew:  MarketTier{AvgPrice: 89.99, Range: PriceRange{Min: 85.0, Max: 95.0}},
		},
		Reasoning:       "Your moderate preferences fit Like New",
		ConfidenceScore: "High",
		Timestamp:       "2024-01-01T00:00:00Z",
	}

	data, err := json.Marshal(resp)
	if err != nil {
		t.Fatalf("Marshal failed: %v", err)
	}

	var unmarshaled RecommendationResponse
	err = json.Unmarshal(data, &unmarshaled)
	if err != nil {
		t.Fatalf("Unmarshal failed: %v", err)
	}

	if !unmarshaled.Success {
		t.Error("Success should be true")
	}
	if len(unmarshaled.Recommendations) != 1 {
		t.Errorf("Recommendations length: got %d, want 1", len(unmarshaled.Recommendations))
	}
	if unmarshaled.Recommendations[0].AvgPrice != 89.99 {
		t.Errorf("AvgPrice: got %f, want 89.99", unmarshaled.Recommendations[0].AvgPrice)
	}
}

func TestProductYAMLUnmarshal(t *testing.T) {
	p := Product{
		ID:            "logitech_gpro_x_superlight",
		CanonicalName: "Logitech G Pro X Superlight",
		Category:      "gaming_mouse",
		Aliases:       []string{"gpro superlight", "g pro x sl", "910-005878"},
	}

	data, err := json.Marshal(p)
	if err != nil {
		t.Fatalf("Marshal failed: %v", err)
	}

	var unmarshaled Product
	err = json.Unmarshal(data, &unmarshaled)
	if err != nil {
		t.Fatalf("Unmarshal failed: %v", err)
	}

	if unmarshaled.ID != p.ID {
		t.Errorf("ID: got %s, want %s", unmarshaled.ID, p.ID)
	}
	if len(unmarshaled.Aliases) != 3 {
		t.Errorf("Aliases length: got %d, want 3", len(unmarshaled.Aliases))
	}
}
