package shared

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"

	"secondsense/backend/src/shared/domain"
)

// SupabaseClient is a lightweight REST client for the Supabase PostgREST API.
// It uses the service role key for server-to-server calls that bypass RLS.
type SupabaseClient struct {
	baseURL        string
	serviceRoleKey string
	httpClient     *http.Client
}

// NewSupabaseClient creates a new SupabaseClient.
func NewSupabaseClient(baseURL, serviceRoleKey string) *SupabaseClient {
	return &SupabaseClient{
		baseURL:        baseURL,
		serviceRoleKey: serviceRoleKey,
		httpClient:     &http.Client{Timeout: 10 * time.Second},
	}
}

// SearchRecord is a row from the user_searches table.
type SearchRecord struct {
	ID             string          `json:"id"`
	UserID         string          `json:"user_id"`
	ProductName    string          `json:"product_name"`
	Preferences    json.RawMessage `json:"preferences"`
	Recommendation json.RawMessage `json:"recommendation"`
	CreatedAt      time.Time       `json:"created_at"`
}

// InsertSearch saves a search record to the user_searches table.
func (s *SupabaseClient) InsertSearch(userID, productName string, preferences, recommendation any) error {
	prefsJSON, err := json.Marshal(preferences)
	if err != nil {
		return fmt.Errorf("marshal preferences: %w", err)
	}
	recJSON, err := json.Marshal(recommendation)
	if err != nil {
		return fmt.Errorf("marshal recommendation: %w", err)
	}

	payload := map[string]any{
		"user_id":        userID,
		"product_name":   productName,
		"preferences":    json.RawMessage(prefsJSON),
		"recommendation": json.RawMessage(recJSON),
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal payload: %w", err)
	}

	req, err := http.NewRequest(http.MethodPost, s.baseURL+"/rest/v1/user_searches", bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("create request: %w", err)
	}
	s.setHeaders(req)
	req.Header.Set("Prefer", "return=minimal")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("insert search: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		b, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("supabase insert failed (%d): %s", resp.StatusCode, string(b))
	}
	return nil
}

// GetSearches returns searches for a user, newest first, with limit/offset pagination.
func (s *SupabaseClient) GetSearches(userID string, limit, offset int) ([]SearchRecord, error) {
	url := fmt.Sprintf("%s/rest/v1/user_searches?user_id=eq.%s&order=created_at.desc&limit=%d&offset=%d", s.baseURL, userID, limit, offset)

	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	s.setHeaders(req)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("get searches: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		b, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("supabase get failed (%d): %s", resp.StatusCode, string(b))
	}

	var records []SearchRecord
	if err := json.NewDecoder(resp.Body).Decode(&records); err != nil {
		return nil, fmt.Errorf("decode response: %w", err)
	}
	return records, nil
}

// CacheRecord is a row from the search_cache table.
type CacheRecord struct {
	ProductName    string          `json:"product_name"`
	PreferencesHash string         `json:"preferences_hash"`
	Recommendation json.RawMessage `json:"recommendation"`
	FetchedAt      time.Time       `json:"fetched_at"`
}

// GetCachedRecommendation looks up a cached recommendation within the last 14 days.
// Returns nil, nil when there is no valid cache entry.
func (s *SupabaseClient) GetCachedRecommendation(productName, prefsHash string) (*domain.RecommendationResponse, *time.Time, error) {
	cutoff := time.Now().UTC().Add(-14 * 24 * time.Hour).Format(time.RFC3339)
	endpoint := fmt.Sprintf(
		"%s/rest/v1/search_cache?product_name=eq.%s&preferences_hash=eq.%s&fetched_at=gte.%s&limit=1",
		s.baseURL,
		url.QueryEscape(productName),
		url.QueryEscape(prefsHash),
		url.QueryEscape(cutoff),
	)

	req, err := http.NewRequest(http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, nil, fmt.Errorf("create request: %w", err)
	}
	s.setHeaders(req)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, nil, fmt.Errorf("get cache: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		b, _ := io.ReadAll(resp.Body)
		return nil, nil, fmt.Errorf("supabase get cache failed (%d): %s", resp.StatusCode, string(b))
	}

	var records []CacheRecord
	if err := json.NewDecoder(resp.Body).Decode(&records); err != nil {
		return nil, nil, fmt.Errorf("decode cache response: %w", err)
	}
	if len(records) == 0 {
		return nil, nil, nil
	}

	var rec domain.RecommendationResponse
	if err := json.Unmarshal(records[0].Recommendation, &rec); err != nil {
		return nil, nil, fmt.Errorf("unmarshal recommendation: %w", err)
	}
	return &rec, &records[0].FetchedAt, nil
}

// UpsertCachedRecommendation inserts or updates a cache entry for the given product+hash pair.
func (s *SupabaseClient) UpsertCachedRecommendation(productName, prefsHash string, rec *domain.RecommendationResponse) error {
	recJSON, err := json.Marshal(rec)
	if err != nil {
		return fmt.Errorf("marshal recommendation: %w", err)
	}

	payload := map[string]any{
		"product_name":     productName,
		"preferences_hash": prefsHash,
		"recommendation":   json.RawMessage(recJSON),
		"fetched_at":       time.Now().UTC().Format(time.RFC3339),
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal payload: %w", err)
	}

	req, err := http.NewRequest(http.MethodPost, s.baseURL+"/rest/v1/search_cache?on_conflict=product_name,preferences_hash", bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("create request: %w", err)
	}
	s.setHeaders(req)
	req.Header.Set("Prefer", "resolution=merge-duplicates,return=minimal")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("upsert cache: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		b, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("supabase upsert cache failed (%d): %s", resp.StatusCode, string(b))
	}
	return nil
}

// GetPopularProducts returns up to limit distinct product names searched in the last 30 days.
func (s *SupabaseClient) GetPopularProducts(limit int) ([]string, error) {
	cutoff := time.Now().UTC().Add(-30 * 24 * time.Hour).Format(time.RFC3339)
	endpoint := fmt.Sprintf(
		"%s/rest/v1/search_cache?select=product_name&fetched_at=gte.%s&order=fetched_at.desc&limit=%d",
		s.baseURL,
		url.QueryEscape(cutoff),
		limit,
	)

	req, err := http.NewRequest(http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	s.setHeaders(req)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("get popular: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		b, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("supabase get popular failed (%d): %s", resp.StatusCode, string(b))
	}

	var rows []struct {
		ProductName string `json:"product_name"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&rows); err != nil {
		return nil, fmt.Errorf("decode popular response: %w", err)
	}

	// Dedup while preserving order.
	seen := make(map[string]bool, len(rows))
	names := make([]string, 0, len(rows))
	for _, r := range rows {
		if !seen[r.ProductName] {
			seen[r.ProductName] = true
			names = append(names, r.ProductName)
		}
	}
	return names, nil
}

func (s *SupabaseClient) setHeaders(req *http.Request) {
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("apikey", s.serviceRoleKey)
	req.Header.Set("Authorization", "Bearer "+s.serviceRoleKey)
}
