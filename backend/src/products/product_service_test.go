package products

import "testing"

func TestNewProductService(t *testing.T) {
	ps := NewProductService()
	if ps == nil {
		t.Error("NewProductService should return non-nil service")
	}
}

func TestSearchReturnsNil(t *testing.T) {
	ps := NewProductService()
	result, err := ps.Search("test")
	if result != nil {
		t.Error("Search stub should return nil product")
	}
	if err != nil {
		t.Error("Search stub should return nil error")
	}
}
