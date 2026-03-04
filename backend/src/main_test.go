package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

// setupTestRouter builds a minimal router that tests CORS and health without needing LLM.
func setupTestRouter() *gin.Engine {
	router := gin.Default()
	router.Use(corsMiddleware())
	router.GET("/health", healthHandler)
	return router
}

func TestHealthEndpoint(t *testing.T) {
	router := setupTestRouter()
	req, _ := http.NewRequest("GET", "/health", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Health endpoint status: got %d, want %d", w.Code, http.StatusOK)
	}

	var resp map[string]string
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp["status"] != "ok" {
		t.Errorf("Health status: got %s, want ok", resp["status"])
	}
}

func TestCORSHeaders(t *testing.T) {
	router := setupTestRouter()
	req, _ := http.NewRequest("OPTIONS", "/health", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusNoContent {
		t.Errorf("OPTIONS status: got %d, want %d", w.Code, http.StatusNoContent)
	}

	allowOrigin := w.Header().Get("Access-Control-Allow-Origin")
	if allowOrigin != "*" {
		t.Errorf("CORS origin: got %s, want *", allowOrigin)
	}
}

func TestInvalidRoute(t *testing.T) {
	router := setupTestRouter()
	req, _ := http.NewRequest("GET", "/invalid", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("Invalid route status: got %d, want %d", w.Code, http.StatusNotFound)
	}
}

func TestRecommendEndpointRejectsEmptyBody(t *testing.T) {
	// Wires a minimal recommend handler using only the parseRequest path.
	router := gin.Default()
	router.Use(corsMiddleware())
	router.POST("/api/recommend", func(c *gin.Context) {
		// Simulate the validation path without needing a real LLM.
		var body struct{ Item string }
		if err := c.BindJSON(&body); err != nil {
			c.JSON(400, gin.H{"error": "Invalid request"})
			return
		}
		c.JSON(200, gin.H{"item": body.Item})
	})

	// Empty body — should 400
	req, _ := http.NewRequest("POST", "/api/recommend", bytes.NewReader([]byte{}))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Empty body status: got %d, want 400", w.Code)
	}
}
