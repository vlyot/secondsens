package products

import (
	"context"
	"encoding/json"
	"fmt"
	"sort"

	"github.com/sahilm/fuzzy"
	"secondsense/backend/src/shared"
	"secondsense/backend/src/shared/domain"
)

// llmClient is the interface ProductService uses — allows mocking in tests.
type llmClient interface {
	GenerateJSON(ctx context.Context, prompt string) (string, error)
}

// ProductService handles product matching logic.
type ProductService struct {
	repo            *ProductRepository
	llm             llmClient
	validationCache *shared.Cache
}

// SearchResult represents the outcome of a product search.
type SearchResult struct {
	Status  string           // "EXACT", "UNIQUE", "AMBIGUOUS", "NOT_FOUND"
	Product *domain.Product  // populated if EXACT or UNIQUE
	Matches []domain.Product // populated if AMBIGUOUS
}

// NewProductService creates a new ProductService.
// llm and validationCache may be nil — dynamic product validation is disabled when either is absent.
func NewProductService(repo *ProductRepository, llm llmClient, validationCache *shared.Cache) *ProductService {
	return &ProductService{repo: repo, llm: llm, validationCache: validationCache}
}

// Search finds a product by query string.
func (ps *ProductService) Search(query string) SearchResult {
	normalized := normalizeString(query)

	if productID, found := ps.repo.FindByAlias(normalized); found {
		product, err := ps.repo.GetByID(productID)
		if err != nil {
			return SearchResult{Status: "NOT_FOUND"}
		}
		return SearchResult{Status: "EXACT", Product: product}
	}

	return ps.fuzzySearch(normalized)
}

// validationResult is the JSON schema returned by Gemini for product validation.
type validationResult struct {
	IsValid       bool   `json:"is_valid"`
	CanonicalName string `json:"canonical_name"`
	Reason        string `json:"reason"`
}

// ValidateDynamicProduct asks Gemini whether a query is a real product with a secondhand market.
// Results are cached for ProductValidationTTL to avoid repeated API calls.
func (ps *ProductService) ValidateDynamicProduct(ctx context.Context, query string) (canonicalName string, isValid bool, err error) {
	if ps.llm == nil || ps.validationCache == nil {
		return "", false, fmt.Errorf("dynamic product validation is not configured")
	}

	cacheKey := "product:" + normalizeString(query)
	if cached, ok := ps.validationCache.Get(cacheKey); ok {
		result := cached.(validationResult)
		return result.CanonicalName, result.IsValid, nil
	}

	prompt := fmt.Sprintf(
		"Is %q a real consumer product with an active secondhand market?"+
			" Return JSON: {\"is_valid\": true, \"canonical_name\": \"...\", \"reason\": \"...\"}"+
			" Only mark is_valid true if you are confident it is a real, purchasable product.",
		query,
	)

	raw, err := ps.llm.GenerateJSON(ctx, prompt)
	if err != nil {
		return "", false, fmt.Errorf("product validation failed: %w", err)
	}

	var result validationResult
	if err := json.Unmarshal([]byte(raw), &result); err != nil {
		return "", false, fmt.Errorf("failed to parse validation response: %w", err)
	}

	ps.validationCache.Set(cacheKey, result)
	return result.CanonicalName, result.IsValid, nil
}

// --- internal fuzzy search helpers ---

type searchEntry struct {
	text      string
	productID string
}

type productMatch struct {
	product domain.Product
	score   int
}

func (ps *ProductService) fuzzySearch(query string) SearchResult {
	var entries []searchEntry
	var searchStrings []string

	for _, product := range ps.repo.GetAll() {
		entries = append(entries, searchEntry{text: product.CanonicalName, productID: product.ID})
		searchStrings = append(searchStrings, product.CanonicalName)
		for _, alias := range product.Aliases {
			entries = append(entries, searchEntry{text: alias, productID: product.ID})
			searchStrings = append(searchStrings, alias)
		}
	}

	matches := fuzzy.Find(query, searchStrings)
	if len(matches) == 0 {
		return SearchResult{Status: "NOT_FOUND"}
	}

	uniqueProducts := ps.deduplicateMatches(matches, entries)

	if len(uniqueProducts) == 1 {
		product, err := ps.repo.GetByID(uniqueProducts[0].ID)
		if err != nil {
			return SearchResult{Status: "NOT_FOUND"}
		}
		return SearchResult{Status: "UNIQUE", Product: product}
	}

	topCount := 5
	if len(uniqueProducts) < topCount {
		topCount = len(uniqueProducts)
	}
	return SearchResult{Status: "AMBIGUOUS", Matches: uniqueProducts[:topCount]}
}

func (ps *ProductService) deduplicateMatches(matches []fuzzy.Match, entries []searchEntry) []domain.Product {
	bestScores := make(map[string]int)
	productMap := make(map[string]domain.Product)

	for _, match := range matches {
		entry := entries[match.Index]
		if existingScore, exists := bestScores[entry.productID]; !exists || match.Score > existingScore {
			bestScores[entry.productID] = match.Score
		}
		if _, exists := productMap[entry.productID]; !exists {
			if product, err := ps.repo.GetByID(entry.productID); err == nil {
				productMap[entry.productID] = *product
			}
		}
	}

	var productMatches []productMatch
	for productID, score := range bestScores {
		if product, exists := productMap[productID]; exists {
			productMatches = append(productMatches, productMatch{product: product, score: score})
		}
	}

	sort.Slice(productMatches, func(i, j int) bool {
		return productMatches[i].score > productMatches[j].score
	})

	products := make([]domain.Product, len(productMatches))
	for i, pm := range productMatches {
		products[i] = pm.product
	}
	return products
}

// SearchLegacy maintains backward compatibility.
// Deprecated: Use Search() instead.
func (ps *ProductService) SearchLegacy(query string) (*domain.Product, error) {
	result := ps.Search(query)
	if result.Product != nil {
		return result.Product, nil
	}
	if len(result.Matches) > 0 {
		return &result.Matches[0], nil
	}
	return nil, fmt.Errorf("product not found: %s", query)
}
