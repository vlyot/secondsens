package domain

import "time"

// RecommendationRequest is the incoming request from the frontend.
type RecommendationRequest struct {
	Item        string      `json:"item"`
	Preferences Preferences `json:"preferences"`
}

// Preferences captures the user's six-preference inputs.
type Preferences struct {
	BudgetFlexibility       int    `json:"budget_flexibility"`
	BudgetFlexibilityActive bool   `json:"budget_flexibility_active,omitempty"`
	QualityPriority         int    `json:"quality_priority"`
	QualityPriorityActive   bool   `json:"quality_priority_active,omitempty"`
	RiskTolerance           int    `json:"risk_tolerance"`
	RiskToleranceActive     bool   `json:"risk_tolerance_active,omitempty"`
	UseFrequency            string `json:"use_frequency"`
	DealUrgency             string `json:"deal_urgency"`
	ResalePriority          string `json:"resale_priority"`
	Context                 string `json:"context,omitempty"`
}

// RecommendationResponse is the complete response with rankings and reasoning.
type RecommendationResponse struct {
	Success              bool              `json:"success"`
	ProductName          string            `json:"product_name"`
	ProductDescription   string            `json:"product_description,omitempty"`
	Recommendations      []RankedOption    `json:"recommendations"`
	MarketStats          MarketStats       `json:"market_stats"`
	Reasoning            string            `json:"reasoning"`
	ConfidenceScore      string            `json:"confidence_score"`
	Timestamp            string            `json:"timestamp"`
	NewProductException  bool              `json:"new_product_exception,omitempty"`
	ExceptionMessage     string            `json:"exception_message,omitempty"`
	Cached               bool              `json:"cached,omitempty"`
	CachedAt             *time.Time        `json:"cached_at,omitempty"`
	// PriceSource indicates the data origin per condition tier.
	// Values: "ebay" | "ai_estimate". Omitted when empty (legacy cached responses).
	PriceSource          map[string]string `json:"price_source,omitempty"`
}

// RankedOption represents a single ranked recommendation.
type RankedOption struct {
	Rank          int         `json:"rank"`
	Condition     string      `json:"condition"`
	AvgPrice      float64     `json:"avg_price"`
	PriceRange    PriceRange  `json:"price_range"`
	SavingsVsNew  SavingsInfo `json:"savings_vs_new"`
	Justification string      `json:"justification"`
}

// PriceRange represents min/max prices for a condition tier.
type PriceRange struct {
	Min float64 `json:"min"`
	Max float64 `json:"max"`
}

// SavingsInfo represents absolute and percentage savings.
type SavingsInfo struct {
	Absolute float64 `json:"absolute"`
	Percent  float64 `json:"percent"`
}

// MarketStats aggregates pricing across all condition tiers.
type MarketStats struct {
	BrandNew MarketTier `json:"brand_new"`
	LikeNew  MarketTier `json:"like_new"`
	Good     MarketTier `json:"good"`
	WellUsed MarketTier `json:"well_used"`
}

// MarketTier represents average price and range for one condition.
type MarketTier struct {
	AvgPrice float64    `json:"avg_price"`
	Range    PriceRange `json:"range"`
}

// PriceData holds raw price arrays for each condition tier.
type PriceData struct {
	BrandNew []float64 `json:"brand_new"`
	LikeNew  []float64 `json:"like_new"`
	Good     []float64 `json:"good"`
	WellUsed []float64 `json:"well_used"`
}

// Product represents a product from the catalog.
type Product struct {
	ID            string   `yaml:"id" json:"id"`
	CanonicalName string   `yaml:"canonical_name" json:"canonical_name"`
	Category      string   `yaml:"category" json:"category"`
	Aliases       []string `yaml:"aliases" json:"aliases"`
}
