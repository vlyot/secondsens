package products

import (
	"testing"
)

func TestNewProductRepository(t *testing.T) {
	repo, err := NewProductRepository("../../data/products.yaml")
	if err != nil {
		t.Fatalf("Failed to load product repository: %v", err)
	}

	products := repo.GetAll()
	if len(products) == 0 {
		t.Error("Expected products to be loaded, got empty slice")
	}

	t.Logf("Loaded %d products", len(products))
}

func TestGetByID(t *testing.T) {
	repo, err := NewProductRepository("../../data/products.yaml")
	if err != nil {
		t.Fatalf("Failed to load product repository: %v", err)
	}

	product, err := repo.GetByID("logitech_gpro_x_superlight")
	if err != nil {
		t.Fatalf("Failed to get product: %v", err)
	}

	if product.CanonicalName != "Logitech G Pro X Superlight" {
		t.Errorf("Expected 'Logitech G Pro X Superlight', got '%s'", product.CanonicalName)
	}
}

func TestGetByID_NotFound(t *testing.T) {
	repo, err := NewProductRepository("../../data/products.yaml")
	if err != nil {
		t.Fatalf("Failed to load product repository: %v", err)
	}

	_, err = repo.GetByID("nonexistent_product")
	if err == nil {
		t.Error("Expected error for non-existent product, got nil")
	}
}

func TestFindByAlias(t *testing.T) {
	repo, err := NewProductRepository("../../data/products.yaml")
	if err != nil {
		t.Fatalf("Failed to load product repository: %v", err)
	}

	tests := []struct {
		name          string
		alias         string
		expectedID    string
		expectedFound bool
	}{
		{
			name:          "Exact canonical name",
			alias:         "Logitech G Pro X Superlight",
			expectedID:    "logitech_gpro_x_superlight",
			expectedFound: true,
		},
		{
			name:          "Alias match",
			alias:         "gpro superlight",
			expectedID:    "logitech_gpro_x_superlight",
			expectedFound: true,
		},
		{
			name:          "Case insensitive",
			alias:         "GPRO SUPERLIGHT",
			expectedID:    "logitech_gpro_x_superlight",
			expectedFound: true,
		},
		{
			name:          "With extra spaces",
			alias:         "  gpro superlight  ",
			expectedID:    "logitech_gpro_x_superlight",
			expectedFound: true,
		},
		{
			name:          "Not found",
			alias:         "nonexistent product",
			expectedID:    "",
			expectedFound: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			id, found := repo.FindByAlias(tt.alias)
			if found != tt.expectedFound {
				t.Errorf("Expected found=%v, got %v", tt.expectedFound, found)
			}
			if found && id != tt.expectedID {
				t.Errorf("Expected ID=%s, got %s", tt.expectedID, id)
			}
		})
	}
}

func TestAliasIndex(t *testing.T) {
	repo, err := NewProductRepository("../../data/products.yaml")
	if err != nil {
		t.Fatalf("Failed to load product repository: %v", err)
	}

	if len(repo.aliasIndex) == 0 {
		t.Error("Alias index should not be empty")
	}

	t.Logf("Alias index has %d entries", len(repo.aliasIndex))
}
