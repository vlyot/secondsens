package prices

import "testing"

func TestNewPriceService(t *testing.T) {
	ps := NewPriceService()
	if ps == nil {
		t.Error("NewPriceService should return non-nil service")
	}
}

func TestFetchPricesReturnsNil(t *testing.T) {
	ps := NewPriceService()
	result, err := ps.FetchPrices("test")
	if result != nil {
		t.Error("FetchPrices stub should return nil prices")
	}
	if err != nil {
		t.Error("FetchPrices stub should return nil error")
	}
}
