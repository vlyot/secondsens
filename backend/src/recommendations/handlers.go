package recommendations

import (
	"context"
	"fmt"
	"hash/fnv"
	"strings"

	"github.com/gin-gonic/gin"
	"secondsense/backend/src/prices"
	"secondsense/backend/src/products"
	"secondsense/backend/src/shared"
	"secondsense/backend/src/shared/domain"
)

// HandleRecommendation returns a Gin handler that orchestrates the full recommendation pipeline.
// Dependencies are injected via closure to keep the handler testable.
func HandleRecommendation(
	productSvc *products.ProductService,
	priceSvc *prices.PriceService,
	recSvc *RecommendationService,
	recCache *shared.Cache,
) gin.HandlerFunc {
	return func(c *gin.Context) {
		req, err := parseRequest(c)
		if err != nil {
			c.JSON(400, gin.H{"error": "Invalid request"})
			return
		}
		if err := validatePreferences(&req.Preferences); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}

		ctx := c.Request.Context()

		// Step 1: Resolve canonical product name.
		canonicalName, disambig, httpStatus, apiErr := resolveProduct(ctx, req.Item, productSvc)
		if apiErr != "" {
			c.JSON(httpStatus, gin.H{"error": apiErr})
			return
		}
		if disambig != nil {
			c.JSON(200, gin.H{"status": "AMBIGUOUS", "matches": disambig})
			return
		}

		// Step 2: Check recommendation cache.
		cacheKey := buildCacheKey(canonicalName, &req.Preferences)
		if cached, ok := recCache.Get(cacheKey); ok {
			c.JSON(200, cached)
			return
		}

		// Step 3: Fetch prices.
		priceData, err := priceSvc.FetchPrices(ctx, canonicalName)
		if err != nil {
			c.JSON(502, gin.H{"error": fmt.Sprintf("Failed to fetch prices: %v", err)})
			return
		}

		// Step 4: Generate recommendation.
		response, err := recSvc.Generate(ctx, canonicalName, priceData, &req.Preferences)
		if err != nil {
			c.JSON(502, gin.H{"error": fmt.Sprintf("Failed to generate recommendation: %v", err)})
			return
		}

		// Step 5: Cache and return.
		recCache.Set(cacheKey, response)
		c.JSON(200, response)
	}
}

// resolveProduct returns (canonicalName, disambigMatches, httpStatusOnError, errorMessage).
func resolveProduct(ctx context.Context, query string, svc *products.ProductService) (string, []domain.Product, int, string) {
	result := svc.Search(query)
	switch result.Status {
	case "EXACT", "UNIQUE":
		return result.Product.CanonicalName, nil, 0, ""
	case "AMBIGUOUS":
		return "", result.Matches, 0, ""
	case "NOT_FOUND":
		name, valid, err := svc.ValidateDynamicProduct(ctx, query)
		if err != nil {
			return "", nil, 502, fmt.Sprintf("Product validation failed: %v", err)
		}
		if !valid {
			return "", nil, 404, "We couldn't find this product. Try a more specific name."
		}
		return name, nil, 0, ""
	}
	return "", nil, 404, "Product not found"
}

// buildCacheKey creates a deterministic cache key from product name and preferences.
func buildCacheKey(canonicalName string, prefs *domain.Preferences) string {
	h := fnv.New32a()
	h.Write([]byte(fmt.Sprintf("%d:%d:%d", prefs.BudgetFlexibility, prefs.ConditionStandards, prefs.HassleTolerances)))
	return fmt.Sprintf("recommendation:%s:%d", strings.ToLower(canonicalName), h.Sum32())
}

// parseRequest binds and parses the JSON request body.
func parseRequest(c *gin.Context) (*domain.RecommendationRequest, error) {
	var req domain.RecommendationRequest
	if err := c.BindJSON(&req); err != nil {
		return nil, err
	}
	return &req, nil
}

// validatePreferences validates that all preference values are within the 0–10 range.
func validatePreferences(prefs *domain.Preferences) error {
	if prefs.BudgetFlexibility < 0 || prefs.BudgetFlexibility > 10 {
		return &ValidationError{"BudgetFlexibility must be between 0 and 10"}
	}
	if prefs.ConditionStandards < 0 || prefs.ConditionStandards > 10 {
		return &ValidationError{"ConditionStandards must be between 0 and 10"}
	}
	if prefs.HassleTolerances < 0 || prefs.HassleTolerances > 10 {
		return &ValidationError{"HassleTolerances must be between 0 and 10"}
	}
	return nil
}

// ValidationError is a custom error for validation failures.
type ValidationError struct {
	Message string
}

func (e *ValidationError) Error() string {
	return e.Message
}
