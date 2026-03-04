package products

import (
	"testing"
)

func setupTestService(t *testing.T) *ProductService {
	repo, err := NewProductRepository("../../data/products.yaml")
	if err != nil {
		t.Fatalf("Failed to load product repository: %v", err)
	}
	return NewProductService(repo, nil, nil)
}

func TestSearch_ExactMatch(t *testing.T) {
	service := setupTestService(t)

	tests := []struct {
		name            string
		query           string
		expectedStatus  string
		expectedProduct string
	}{
		{
			name:            "Exact canonical name",
			query:           "Logitech G Pro X Superlight",
			expectedStatus:  "EXACT",
			expectedProduct: "logitech_gpro_x_superlight",
		},
		{
			name:            "Exact alias",
			query:           "gpro superlight",
			expectedStatus:  "EXACT",
			expectedProduct: "logitech_gpro_x_superlight",
		},
		{
			name:            "Case insensitive exact",
			query:           "GPRO SUPERLIGHT",
			expectedStatus:  "EXACT",
			expectedProduct: "logitech_gpro_x_superlight",
		},
		{
			name:            "With extra spaces",
			query:           "  gpro superlight  ",
			expectedStatus:  "EXACT",
			expectedProduct: "logitech_gpro_x_superlight",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := service.Search(tt.query)
			if result.Status != tt.expectedStatus {
				t.Errorf("Expected status %s, got %s", tt.expectedStatus, result.Status)
			}
			if result.Product == nil {
				t.Fatalf("Expected product, got nil")
			}
			if result.Product.ID != tt.expectedProduct {
				t.Errorf("Expected product ID %s, got %s", tt.expectedProduct, result.Product.ID)
			}
		})
	}
}

func TestSearch_FuzzyMatch_Unique(t *testing.T) {
	service := setupTestService(t)

	tests := []struct {
		name            string
		query           string
		expectedStatus  string
		expectedProduct string
	}{
		{
			name:            "Abbreviated query",
			query:           "g pro superlight",
			expectedStatus:  "UNIQUE",
			expectedProduct: "logitech_gpro_x_superlight",
		},
		{
			name:            "Partial match",
			query:           "superlight",
			expectedStatus:  "UNIQUE",
			expectedProduct: "logitech_gpro_x_superlight",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := service.Search(tt.query)
			if result.Status != tt.expectedStatus {
				t.Errorf("Expected status %s, got %s", tt.expectedStatus, result.Status)
			}
			if result.Product == nil {
				t.Fatalf("Expected product, got nil")
			}
			if result.Product.ID != tt.expectedProduct {
				t.Errorf("Expected product ID %s, got %s", tt.expectedProduct, result.Product.ID)
			}
		})
	}
}

func TestSearch_Ambiguous(t *testing.T) {
	service := setupTestService(t)

	result := service.Search("logitech")
	if result.Status != "AMBIGUOUS" {
		t.Errorf("Expected status AMBIGUOUS, got %s", result.Status)
	}
	if len(result.Matches) == 0 {
		t.Error("Expected multiple matches, got empty slice")
	}
	if len(result.Matches) > 5 {
		t.Errorf("Expected max 5 matches, got %d", len(result.Matches))
	}

	t.Logf("Found %d matches for 'logitech'", len(result.Matches))
	for i, match := range result.Matches {
		t.Logf("  %d. %s (ID: %s)", i+1, match.CanonicalName, match.ID)
	}
}

func TestSearch_NotFound(t *testing.T) {
	service := setupTestService(t)

	tests := []struct {
		name  string
		query string
	}{
		{
			name:  "Completely unrelated",
			query: "xyznonexistent123",
		},
		{
			name:  "Random text",
			query: "asdfghjkl",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := service.Search(tt.query)
			if result.Status != "NOT_FOUND" {
				t.Errorf("Expected status NOT_FOUND, got %s", result.Status)
			}
			if result.Product != nil {
				t.Error("Expected nil product for not found")
			}
		})
	}
}

func TestSearch_CaseInsensitivity(t *testing.T) {
	service := setupTestService(t)

	queries := []string{
		"gpro superlight",
		"GPRO SUPERLIGHT",
		"GpRo SuPeRlIgHt",
		"gpro SUPERLIGHT",
	}

	for _, query := range queries {
		result := service.Search(query)
		if result.Status != "EXACT" {
			t.Errorf("Query '%s': expected EXACT match, got %s", query, result.Status)
		}
		if result.Product == nil || result.Product.ID != "logitech_gpro_x_superlight" {
			t.Errorf("Query '%s': expected logitech_gpro_x_superlight", query)
		}
	}
}

func TestNewProductService(t *testing.T) {
	repo, err := NewProductRepository("../../data/products.yaml")
	if err != nil {
		t.Fatalf("Failed to load repository: %v", err)
	}

	service := NewProductService(repo, nil, nil)
	if service == nil {
		t.Error("Expected service, got nil")
	}
	if service.repo == nil {
		t.Error("Expected service to have repository")
	}
}
