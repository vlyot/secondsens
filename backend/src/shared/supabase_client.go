package shared

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
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

// GetSearches returns the last 20 searches for a user, newest first.
func (s *SupabaseClient) GetSearches(userID string) ([]SearchRecord, error) {
	url := fmt.Sprintf("%s/rest/v1/user_searches?user_id=eq.%s&order=created_at.desc&limit=20", s.baseURL, userID)

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

func (s *SupabaseClient) setHeaders(req *http.Request) {
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("apikey", s.serviceRoleKey)
	req.Header.Set("Authorization", "Bearer "+s.serviceRoleKey)
}
