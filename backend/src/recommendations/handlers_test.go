package recommendations

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"secondsense/backend/src/shared/domain"
)

func setupTestHandler() *gin.Engine {
	router := gin.Default()
	router.POST("/api/recommend", HandleRecommendation)
	return router
}

func TestHandleRecommendationValidRequest(t *testing.T) {
	router := setupTestHandler()
	req := domain.RecommendationRequest{
		Item: "test product",
		Preferences: domain.Preferences{
			BudgetFlexibility:  5,
			ConditionStandards: 5,
			HassleTolerances:   5,
		},
	}
	body, _ := json.Marshal(req)
	httpReq, _ := http.NewRequest("POST", "/api/recommend", bytes.NewReader(body))
	httpReq.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, httpReq)

	if w.Code != http.StatusOK {
		t.Errorf("Valid request status: got %d, want %d", w.Code, http.StatusOK)
	}
}

func TestHandleRecommendationInvalidJSON(t *testing.T) {
	router := setupTestHandler()
	httpReq, _ := http.NewRequest("POST", "/api/recommend", bytes.NewReader([]byte("invalid json")))
	httpReq.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, httpReq)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Invalid JSON status: got %d, want %d", w.Code, http.StatusBadRequest)
	}
}

func TestParseRequestSuccess(t *testing.T) {
	c, _ := gin.CreateTestContext(httptest.NewRecorder())
	req := domain.RecommendationRequest{
		Item: "test",
		Preferences: domain.Preferences{
			BudgetFlexibility:  5,
			ConditionStandards: 5,
			HassleTolerances:   5,
		},
	}
	body, _ := json.Marshal(req)
	c.Request, _ = http.NewRequest("POST", "/", bytes.NewReader(body))
	c.Request.Header.Set("Content-Type", "application/json")

	parsed, err := parseRequest(c)
	if err != nil {
		t.Errorf("parseRequest failed: %v", err)
	}
	if parsed.Item != "test" {
		t.Errorf("Item: got %s, want test", parsed.Item)
	}
}

func TestValidatePreferencesInRange(t *testing.T) {
	prefs := &domain.Preferences{
		BudgetFlexibility:  0,
		ConditionStandards: 5,
		HassleTolerances:   10,
	}
	err := validatePreferences(prefs)
	if err != nil {
		t.Errorf("Valid preferences should not error, got %v", err)
	}
}

func TestValidatePreferencesOutOfRange(t *testing.T) {
	testCases := []struct {
		name string
		prefs *domain.Preferences
		field string
	}{
		{
			name:  "BudgetFlexibility too low",
			prefs: &domain.Preferences{BudgetFlexibility: -1, ConditionStandards: 5, HassleTolerances: 5},
			field: "BudgetFlexibility",
		},
		{
			name:  "BudgetFlexibility too high",
			prefs: &domain.Preferences{BudgetFlexibility: 11, ConditionStandards: 5, HassleTolerances: 5},
			field: "BudgetFlexibility",
		},
		{
			name:  "ConditionStandards too low",
			prefs: &domain.Preferences{BudgetFlexibility: 5, ConditionStandards: -1, HassleTolerances: 5},
			field: "ConditionStandards",
		},
		{
			name:  "HassleTolerances too high",
			prefs: &domain.Preferences{BudgetFlexibility: 5, ConditionStandards: 5, HassleTolerances: 11},
			field: "HassleTolerances",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			err := validatePreferences(tc.prefs)
			if err == nil {
				t.Error("Out of range preferences should error")
			}
		})
	}
}
