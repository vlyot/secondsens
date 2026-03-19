package recommendations

import (
	"context"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"hash/fnv"
	"log"
	"sort"
	"strings"
	"sync"

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
	supabaseClient *shared.SupabaseClient,
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
		forceRefresh := c.Query("force_refresh") == "true"
		countryCode := strings.ToUpper(strings.TrimSpace(c.GetHeader("X-Country")))

		// runPipeline executes the full price-fetch + recommendation pipeline for a single product.
		// It checks and writes both the in-memory cache and the Supabase shared cache.
		runPipeline := func(canonicalName string) (*domain.RecommendationResponse, error) {
			memCacheKey := buildCacheKey(canonicalName, &req.Preferences, countryCode)
			if !forceRefresh {
				if cached, ok := recCache.Get(memCacheKey); ok {
					if resp, ok := cached.(*domain.RecommendationResponse); ok {
						return resp, nil
					}
				}
			}

			prefsHash := buildPrefsHash(&req.Preferences, countryCode)
			if !forceRefresh && supabaseClient != nil {
				if supabaseCached, fetchedAt, err := supabaseClient.GetCachedRecommendation(canonicalName, prefsHash); err != nil {
					log.Printf("supabase cache lookup failed (skipping): %v", err)
				} else if supabaseCached != nil {
					recCache.Set(memCacheKey, supabaseCached)
					resp := *supabaseCached
					resp.Cached = true
					resp.CachedAt = fetchedAt
					return &resp, nil
				}
			}

			priceData, priceSource, err := priceSvc.FetchPrices(ctx, canonicalName, countryCode)
			if err != nil {
				return nil, fmt.Errorf("failed to fetch prices: %w", err)
			}
			response, err := recSvc.Generate(ctx, canonicalName, priceData, &req.Preferences)
			if err != nil {
				return nil, fmt.Errorf("failed to generate recommendation: %w", err)
			}
			response.PriceSource = priceSource

			recCache.Set(memCacheKey, response)
			if supabaseClient != nil {
				prefsHashCopy := prefsHash
				responseCopy := response
				go func() {
					if err := supabaseClient.UpsertCachedRecommendation(canonicalName, prefsHashCopy, responseCopy); err != nil {
						log.Printf("supabase cache upsert failed: %v", err)
					}
				}()
			}
			return response, nil
		}

		// Step 1: Resolve primary product.
		canonicalName, disambig, httpStatus, apiErr := resolveProduct(ctx, req.Item, productSvc)
		if apiErr != "" {
			c.JSON(httpStatus, gin.H{"error": apiErr})
			return
		}
		if disambig != nil {
			c.JSON(200, gin.H{"status": "AMBIGUOUS", "matches": disambig})
			return
		}

		// Compare mode: run both pipelines concurrently when compare_product is present.
		if req.CompareProduct != "" {
			compareCanonical, compareDisambig, httpStatus, apiErr := resolveProduct(ctx, req.CompareProduct, productSvc)
			if apiErr != "" {
				c.JSON(httpStatus, gin.H{"error": apiErr})
				return
			}
			if compareDisambig != nil {
				// Signal to the frontend that it's the compare product that is ambiguous.
				c.JSON(200, gin.H{"status": "AMBIGUOUS", "matches": compareDisambig, "context": "compare"})
				return
			}

			var (
				primaryResult  *domain.RecommendationResponse
				compareResult  *domain.RecommendationResponse
				primaryErr     error
				compareErr     error
				wg             sync.WaitGroup
			)
			wg.Add(2)
			go func() {
				defer wg.Done()
				primaryResult, primaryErr = runPipeline(canonicalName)
			}()
			go func() {
				defer wg.Done()
				compareResult, compareErr = runPipeline(compareCanonical)
			}()
			wg.Wait()

			if primaryErr != nil {
				c.JSON(502, gin.H{"error": primaryErr.Error()})
				return
			}
			if compareErr != nil {
				c.JSON(502, gin.H{"error": compareErr.Error()})
				return
			}
			c.JSON(200, &domain.CompareResponse{Primary: primaryResult, Compare: compareResult})
			return
		}

		// Single-product path.
		response, err := runPipeline(canonicalName)
		if err != nil {
			c.JSON(502, gin.H{"error": err.Error()})
			return
		}
		c.JSON(200, response)
	}
}

// buildPrefsHash returns a SHA-256 hex digest of the preferences struct
// serialised as canonical JSON (keys sorted alphabetically), scoped by countryCode
// so users from different regions don't share cached prices.
func buildPrefsHash(prefs *domain.Preferences, countryCode string) string {
	// Marshal to a map so we can sort keys deterministically.
	raw, _ := json.Marshal(prefs)
	var m map[string]any
	_ = json.Unmarshal(raw, &m)

	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	type kv struct {
		K string
		V any
	}
	ordered := make([]kv, 0, len(keys))
	for _, k := range keys {
		ordered = append(ordered, kv{k, m[k]})
	}
	canonical, _ := json.Marshal(ordered)
	sum := sha256.Sum256(append(canonical, []byte(":"+countryCode)...))
	return fmt.Sprintf("%x", sum)
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

// buildCacheKey creates a deterministic cache key from product name, preferences, and country.
func buildCacheKey(canonicalName string, prefs *domain.Preferences, countryCode string) string {
	h := fnv.New32a()
	h.Write([]byte(fmt.Sprintf("%d:%d:%d:%s:%s:%s:%s", prefs.BudgetFlexibility, prefs.QualityPriority, prefs.RiskTolerance, prefs.UseFrequency, prefs.DealUrgency, prefs.ResalePriority, countryCode)))
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
	if prefs.QualityPriority < 0 || prefs.QualityPriority > 10 {
		return &ValidationError{"QualityPriority must be between 0 and 10"}
	}
	if prefs.RiskTolerance < 0 || prefs.RiskTolerance > 10 {
		return &ValidationError{"RiskTolerance must be between 0 and 10"}
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
