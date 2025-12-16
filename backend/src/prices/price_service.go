package prices

import "secondsense/backend/src/shared/domain"

// PriceService handles price search and aggregation.
type PriceService struct{}

// NewPriceService creates a new PriceService.
func NewPriceService() *PriceService {
	return &PriceService{}
}

// FetchPrices fetches prices for a product. Stub returns nil (Phase 4).
func (ps *PriceService) FetchPrices(productName string) (*domain.PriceData, error) {
	return nil, nil
}
