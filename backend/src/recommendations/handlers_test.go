package recommendations

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"secondsense/backend/src/shared"
	"secondsense/backend/src/shared/domain"
)

// setupTestHandler creates a router using a stub handler that exercises
// parseRequest and validatePreferences (the parts that don't need LLM).
func setupTestHandler() *gin.Engine {
	router := gin.Default()
	// Use a simple stub that mirrors what the real handler does for validation.
	router.POST("/api/recommend", func(c *gin.Context) {
		req, err := parseRequest(c)
		if err != nil {
			c.JSON(400, gin.H{"error": "Invalid request"})
			return
		}
		if err := validatePreferences(&req.Preferences); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}
		c.JSON(200, gin.H{"message": "ok"})
	})
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
		name  string
		prefs *domain.Preferences
	}{
		{
			name:  "BudgetFlexibility too low",
			prefs: &domain.Preferences{BudgetFlexibility: -1, ConditionStandards: 5, HassleTolerances: 5},
		},
		{
			name:  "BudgetFlexibility too high",
			prefs: &domain.Preferences{BudgetFlexibility: 11, ConditionStandards: 5, HassleTolerances: 5},
		},
		{
			name:  "ConditionStandards too low",
			prefs: &domain.Preferences{BudgetFlexibility: 5, ConditionStandards: -1, HassleTolerances: 5},
		},
		{
			name:  "HassleTolerances too high",
			prefs: &domain.Preferences{BudgetFlexibility: 5, ConditionStandards: 5, HassleTolerances: 11},
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

func TestBuildCacheKey_Deterministic(t *testing.T) {
	prefs := &domain.Preferences{BudgetFlexibility: 7, ConditionStandards: 5, HassleTolerances: 4}
	k1 := buildCacheKey("Logitech G Pro X Superlight", prefs)
	k2 := buildCacheKey("Logitech G Pro X Superlight", prefs)
	if k1 != k2 {
		t.Errorf("cache key is not deterministic: %q vs %q", k1, k2)
	}
}

func TestBuildCacheKey_DifferentPrefs(t *testing.T) {
	p1 := &domain.Preferences{BudgetFlexibility: 7, ConditionStandards: 5, HassleTolerances: 4}
	p2 := &domain.Preferences{BudgetFlexibility: 3, ConditionStandards: 9, HassleTolerances: 1}
	k1 := buildCacheKey("Product", p1)
	k2 := buildCacheKey("Product", p2)
	if k1 == k2 {
		t.Error("different preferences should produce different cache keys")
	}
}

func TestBuildCacheKey_CacheHit(t *testing.T) {
	cache := shared.NewCache(10, time.Minute)
	prefs := &domain.Preferences{BudgetFlexibility: 5, ConditionStandards: 5, HassleTolerances: 5}
	key := buildCacheKey("Test Product", prefs)
	cache.Set(key, "stored")
	val, ok := cache.Get(key)
	if !ok {
		t.Fatal("expected cache hit")
	}
	if val.(string) != "stored" {
		t.Errorf("got %v, want stored", val)
	}
}
