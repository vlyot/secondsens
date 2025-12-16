package recommendations

import (
	"secondsense/backend/src/shared/domain"
	"testing"
)

func TestNewRecommendationService(t *testing.T) {
	rs := NewRecommendationService()
	if rs == nil {
		t.Error("NewRecommendationService should return non-nil service")
	}
}

func TestGenerateReturnsNil(t *testing.T) {
	rs := NewRecommendationService()
	prefs := &domain.Preferences{BudgetFlexibility: 5}
	result, err := rs.Generate("test", nil, prefs)
	if result != nil {
		t.Error("Generate stub should return nil response")
	}
	if err != nil {
		t.Error("Generate stub should return nil error")
	}
}
