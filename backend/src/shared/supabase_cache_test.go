package shared

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"secondsense/backend/src/shared/domain"
)

func newTestClient(server *httptest.Server) *SupabaseClient {
	return &SupabaseClient{
		baseURL:        server.URL,
		serviceRoleKey: "test-key",
		httpClient:     &http.Client{},
	}
}

func TestGetCachedRecommendation_Hit(t *testing.T) {
	fetchedAt := time.Now().UTC().Add(-1 * time.Hour).Truncate(time.Second)
	rec := domain.RecommendationResponse{
		Success:     true,
		ProductName: "Logitech G Pro X Superlight",
		Reasoning:   "cached result",
	}
	recJSON, _ := json.Marshal(rec)

	rows := []CacheRecord{{
		ProductName:     "Logitech G Pro X Superlight",
		PreferencesHash: "abc123",
		Recommendation:  json.RawMessage(recJSON),
		FetchedAt:       fetchedAt,
	}}
	body, _ := json.Marshal(rows)

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write(body)
	}))
	defer srv.Close()

	client := newTestClient(srv)
	result, at, err := client.GetCachedRecommendation("Logitech G Pro X Superlight", "abc123")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result == nil {
		t.Fatal("expected a result, got nil")
	}
	if result.ProductName != rec.ProductName {
		t.Errorf("ProductName: got %q, want %q", result.ProductName, rec.ProductName)
	}
	if at == nil {
		t.Fatal("expected fetchedAt, got nil")
	}
	if !at.Equal(fetchedAt) {
		t.Errorf("FetchedAt: got %v, want %v", at, fetchedAt)
	}
}

func TestGetCachedRecommendation_Miss(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte("[]"))
	}))
	defer srv.Close()

	client := newTestClient(srv)
	result, at, err := client.GetCachedRecommendation("Unknown Product", "deadbeef")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result != nil {
		t.Errorf("expected nil result on miss, got %+v", result)
	}
	if at != nil {
		t.Errorf("expected nil fetchedAt on miss, got %v", at)
	}
}

func TestGetCachedRecommendation_ServerError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(`{"message":"internal error"}`))
	}))
	defer srv.Close()

	client := newTestClient(srv)
	_, _, err := client.GetCachedRecommendation("product", "hash")
	if err == nil {
		t.Fatal("expected error on 500, got nil")
	}
}

func TestUpsertCachedRecommendation(t *testing.T) {
	var gotBody map[string]any
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			t.Errorf("expected POST, got %s", r.Method)
		}
		if r.Header.Get("Prefer") == "" {
			t.Error("expected Prefer header to be set")
		}
		json.NewDecoder(r.Body).Decode(&gotBody)
		w.WriteHeader(http.StatusCreated)
	}))
	defer srv.Close()

	client := newTestClient(srv)
	rec := &domain.RecommendationResponse{Success: true, ProductName: "Sony WH-1000XM5"}
	err := client.UpsertCachedRecommendation("Sony WH-1000XM5", "hash456", rec)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if gotBody["product_name"] != "Sony WH-1000XM5" {
		t.Errorf("product_name: got %v", gotBody["product_name"])
	}
	if gotBody["preferences_hash"] != "hash456" {
		t.Errorf("preferences_hash: got %v", gotBody["preferences_hash"])
	}
}

func TestGetPopularProducts_Dedup(t *testing.T) {
	rows := []map[string]string{
		{"product_name": "Sony WH-1000XM5"},
		{"product_name": "Logitech G Pro X"},
		{"product_name": "Sony WH-1000XM5"}, // duplicate
		{"product_name": "Apple AirPods Pro"},
	}
	body, _ := json.Marshal(rows)

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write(body)
	}))
	defer srv.Close()

	client := newTestClient(srv)
	names, err := client.GetPopularProducts(50)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(names) != 3 {
		t.Errorf("expected 3 unique names, got %d: %v", len(names), names)
	}
	if names[0] != "Sony WH-1000XM5" {
		t.Errorf("first name should be Sony WH-1000XM5, got %s", names[0])
	}
}

func TestGetPopularProducts_Empty(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte("[]"))
	}))
	defer srv.Close()

	client := newTestClient(srv)
	names, err := client.GetPopularProducts(50)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(names) != 0 {
		t.Errorf("expected empty slice, got %v", names)
	}
}
