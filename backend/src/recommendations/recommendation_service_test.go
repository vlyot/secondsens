package recommendations

import (
	"testing"
)

func TestNewRecommendationService(t *testing.T) {
	rs := NewRecommendationService(nil)
	if rs == nil {
		t.Error("NewRecommendationService should return non-nil service")
	}
}
