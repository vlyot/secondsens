package history

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"secondsense/backend/src/shared"
)

func init() {
	gin.SetMode(gin.TestMode)
}

// mockSupabaseServer creates a test HTTP server that mimics Supabase REST responses.
func mockSupabaseServer(t *testing.T, insertStatus int, getBody string) *httptest.Server {
	t.Helper()
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			w.WriteHeader(insertStatus)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(getBody))
	}))
}

func TestHandleSave_Success(t *testing.T) {
	srv := mockSupabaseServer(t, http.StatusCreated, "[]")
	defer srv.Close()

	db := shared.NewSupabaseClient(srv.URL, "test-key")
	router := gin.New()
	router.POST("/api/history", func(c *gin.Context) {
		c.Set(shared.ContextUserID, "user-123")
	}, HandleSave(db))

	body := `{"product_name":"Sony WH-1000XM5","preferences":{},"recommendation":{}}`
	req := httptest.NewRequest(http.MethodPost, "/api/history", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Errorf("expected 201, got %d: %s", w.Code, w.Body.String())
	}
}

func TestHandleSave_BadBody(t *testing.T) {
	srv := mockSupabaseServer(t, http.StatusCreated, "[]")
	defer srv.Close()

	db := shared.NewSupabaseClient(srv.URL, "test-key")
	router := gin.New()
	router.POST("/api/history", func(c *gin.Context) {
		c.Set(shared.ContextUserID, "user-123")
	}, HandleSave(db))

	req := httptest.NewRequest(http.MethodPost, "/api/history", strings.NewReader(`not json`))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestHandleList_Success(t *testing.T) {
	records := []shared.SearchRecord{
		{
			ID:             "id-1",
			UserID:         "user-123",
			ProductName:    "Sony WH-1000XM5",
			Preferences:    json.RawMessage(`{}`),
			Recommendation: json.RawMessage(`{"success":true,"product_name":"Sony WH-1000XM5","recommendations":[],"market_stats":{},"reasoning":"","confidence_score":"","timestamp":""}`),
			CreatedAt:      time.Now(),
		},
	}
	body, _ := json.Marshal(records)

	srv := mockSupabaseServer(t, http.StatusCreated, string(body))
	defer srv.Close()

	db := shared.NewSupabaseClient(srv.URL, "test-key")
	router := gin.New()
	router.GET("/api/history", func(c *gin.Context) {
		c.Set(shared.ContextUserID, "user-123")
	}, HandleList(db))

	req := httptest.NewRequest(http.MethodGet, "/api/history", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d: %s", w.Code, w.Body.String())
	}

	var items []HistoryItem
	if err := json.Unmarshal(w.Body.Bytes(), &items); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if len(items) != 1 || items[0].ProductName != "Sony WH-1000XM5" {
		t.Errorf("unexpected items: %+v", items)
	}
}
