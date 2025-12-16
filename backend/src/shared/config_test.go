package shared

import (
	"os"
	"testing"
)

func TestLoadConfigDefaults(t *testing.T) {
	// Clear environment to test defaults
	os.Clearenv()

	cfg := LoadConfig()

	if cfg.Port != "8080" {
		t.Errorf("Port: got %s, want 8080", cfg.Port)
	}
	if cfg.LLMAPIKey != "" {
		t.Errorf("LLMAPIKey: got %s, want empty string", cfg.LLMAPIKey)
	}
	if cfg.LLMModel != "claude-3-5-sonnet-20241022" {
		t.Errorf("LLMModel: got %s, want claude-3-5-sonnet-20241022", cfg.LLMModel)
	}
	if cfg.CacheTTL != 86400 {
		t.Errorf("CacheTTL: got %d, want 86400", cfg.CacheTTL)
	}
}

func TestLoadConfigFromEnv(t *testing.T) {
	os.Setenv("PORT", "9000")
	os.Setenv("ANTHROPIC_API_KEY", "test-key-123")
	os.Setenv("LLM_MODEL", "test-model")

	cfg := LoadConfig()

	if cfg.Port != "9000" {
		t.Errorf("Port: got %s, want 9000", cfg.Port)
	}
	if cfg.LLMAPIKey != "test-key-123" {
		t.Errorf("LLMAPIKey: got %s, want test-key-123", cfg.LLMAPIKey)
	}
	if cfg.LLMModel != "test-model" {
		t.Errorf("LLMModel: got %s, want test-model", cfg.LLMModel)
	}

	// Cleanup
	os.Unsetenv("PORT")
	os.Unsetenv("ANTHROPIC_API_KEY")
	os.Unsetenv("LLM_MODEL")
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
