package domain

// RecommendationRequest is the incoming request from the frontend.
type RecommendationRequest struct {
	Item        string      `json:"item"`
	Preferences Preferences `json:"preferences"`
}

// Preferences captures user's three-slider inputs (0-10 scale).
type Preferences struct {
	BudgetFlexibility  int `json:"budget_flexibility"`   // 0=tight budget, 10=flexible
	ConditionStandards int `json:"condition_standards"`   // 0=don't care, 10=pristine
	HassleTolerances   int `json:"hassle_tolerance"`      // 0=willing to fix, 10=plug & play
}

// RecommendationResponse is the complete response with rankings and reasoning.
type RecommendationResponse struct {
	Success         bool            `json:"success"`
	ProductName     string          `json:"product_name"`
	Recommendations []RankedOption  `json:"recommendations"`
	MarketStats     MarketStats     `json:"market_stats"`
	Reasoning       string          `json:"reasoning"`
	ConfidenceScore string          `json:"confidence_score"`
	Timestamp       string          `json:"timestamp"`
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
