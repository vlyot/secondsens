package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func setupTestRouter() *gin.Engine {
	router := gin.Default()
	router.Use(corsMiddleware())
	router.GET("/health", healthHandler)
	router.POST("/api/recommend", recommendStubHandler)
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

func TestRecommendStubEndpoint(t *testing.T) {
	router := setupTestRouter()
	req, _ := http.NewRequest("POST", "/api/recommend", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Recommend endpoint status: got %d, want %d", w.Code, http.StatusOK)
	}

	var resp map[string]string
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp["message"] != "Not implemented yet" {
		t.Errorf("Recommend message: got %s, want Not implemented yet", resp["message"])
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
