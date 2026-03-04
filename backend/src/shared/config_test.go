package shared

import (
	"os"
	"testing"
)

func TestLoadConfigDefaults(t *testing.T) {
	os.Clearenv()

	cfg := LoadConfig()

	if cfg.Port != "8080" {
		t.Errorf("Port: got %s, want 8080", cfg.Port)
	}
	if cfg.GeminiAPIKey != "" {
		t.Errorf("GeminiAPIKey: got %s, want empty string", cfg.GeminiAPIKey)
	}
	if cfg.GeminiModel != "gemini-2.0-flash" {
		t.Errorf("GeminiModel: got %s, want gemini-2.0-flash", cfg.GeminiModel)
	}
}

func TestLoadConfigFromEnv(t *testing.T) {
	os.Setenv("PORT", "9000")
	os.Setenv("GEMINI_API_KEY", "test-key-123")
	os.Setenv("GEMINI_MODEL", "gemini-2.0-flash-exp")

	cfg := LoadConfig()

	if cfg.Port != "9000" {
		t.Errorf("Port: got %s, want 9000", cfg.Port)
	}
	if cfg.GeminiAPIKey != "test-key-123" {
		t.Errorf("GeminiAPIKey: got %s, want test-key-123", cfg.GeminiAPIKey)
	}
	if cfg.GeminiModel != "gemini-2.0-flash-exp" {
		t.Errorf("GeminiModel: got %s, want gemini-2.0-flash-exp", cfg.GeminiModel)
	}

	os.Unsetenv("PORT")
	os.Unsetenv("GEMINI_API_KEY")
	os.Unsetenv("GEMINI_MODEL")
}

func TestGetEnvFallback(t *testing.T) {
	os.Clearenv()

	val := getEnv("NONEXISTENT_VAR", "default-value")
	if val != "default-value" {
		t.Errorf("getEnv: got %s, want default-value", val)
	}

	os.Setenv("EXISTING_VAR", "existing-value")
	val = getEnv("EXISTING_VAR", "default-value")
	if val != "existing-value" {
		t.Errorf("getEnv: got %s, want existing-value", val)
	}

	os.Unsetenv("EXISTING_VAR")
}
