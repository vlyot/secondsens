package products

import (
	"fmt"
	"os"
	"strings"

	"github.com/goccy/go-yaml"
	"secondsense/backend/src/shared/domain"
)

// ProductRepository manages the product catalog.
type ProductRepository struct {
	products   []domain.Product
	aliasIndex map[string]string // normalized alias → product ID
}

// ProductsYAML represents the root structure of products.yaml.
type ProductsYAML struct {
	Products []domain.Product `yaml:"products"`
}

// NewProductRepository loads the product catalog from a YAML file.
func NewProductRepository(yamlPath string) (*ProductRepository, error) {
	data, err := os.ReadFile(yamlPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read products file: %w", err)
	}

	var productsYAML ProductsYAML
	if err := yaml.Unmarshal(data, &productsYAML); err != nil {
		return nil, fmt.Errorf("failed to parse products YAML: %w", err)
	}

	repo := &ProductRepository{
		products:   productsYAML.Products,
		aliasIndex: make(map[string]string),
	}

	// Build alias index
	for _, product := range repo.products {
		// Index canonical name
		normalized := normalizeString(product.CanonicalName)
		repo.aliasIndex[normalized] = product.ID

		// Index all aliases
		for _, alias := range product.Aliases {
			normalized := normalizeString(alias)
			repo.aliasIndex[normalized] = product.ID
		}
	}

	return repo, nil
}

// GetByID retrieves a product by its ID.
func (r *ProductRepository) GetByID(id string) (*domain.Product, error) {
	for i := range r.products {
		if r.products[i].ID == id {
			return &r.products[i], nil
		}
	}
	return nil, fmt.Errorf("product not found: %s", id)
}

// GetAll returns all products in the catalog.
func (r *ProductRepository) GetAll() []domain.Product {
	return r.products
}

// FindByAlias looks up a product ID using a normalized alias.
func (r *ProductRepository) FindByAlias(alias string) (string, bool) {
	normalized := normalizeString(alias)
	id, found := r.aliasIndex[normalized]
	return id, found
}

// normalizeString converts a string to lowercase and trims whitespace.
func normalizeString(s string) string {
	return strings.ToLower(strings.TrimSpace(s))
}
