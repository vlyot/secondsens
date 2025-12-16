package products

import "secondsense/backend/src/shared/domain"

// ProductService handles product matching logic.
type ProductService struct{}

// NewProductService creates a new ProductService.
func NewProductService() *ProductService {
	return &ProductService{}
}

// Search finds a product by query. Stub implementation returns nil (Phase 3).
func (ps *ProductService) Search(query string) (*domain.Product, error) {
	return nil, nil
}
