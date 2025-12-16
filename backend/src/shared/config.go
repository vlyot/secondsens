package shared

import (
	"os"

	"github.com/joho/godotenv"
)

// Config holds all application configuration.
type Config struct {
	Port         string
	LLMAPIKey    string
	LLMModel     string
	CacheTTL     int64
}

// LoadConfig loads configuration from environment variables and .env file.
func LoadConfig() *Config {
	godotenv.Load()

	return &Config{
		Port:      getEnv("PORT", "8080"),
		LLMAPIKey: getEnv("ANTHROPIC_API_KEY", ""),
		LLMModel:  getEnv("LLM_MODEL", "claude-3-5-sonnet-20241022"),
		CacheTTL:  86400, // 24 hours in seconds
	}
}

// getEnv returns an environment variable or a default value.
func getEnv(key, defaultVal string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultVal
}
