package recommendations

import "secondsense/backend/src/shared/domain"

// RecommendationService handles recommendation generation logic.
type RecommendationService struct{}

// NewRecommendationService creates a new RecommendationService.
func NewRecommendationService() *RecommendationService {
	return &RecommendationService{}
}

// Generate generates recommendations. Stub returns nil (Phase 4).
func (rs *RecommendationService) Generate(
	productName string,
	prices interface{},
	prefs *domain.Preferences,
) (*domain.RecommendationResponse, error) {
	return nil, nil
}
