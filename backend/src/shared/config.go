package shared

import (
	"os"

	"github.com/joho/godotenv"
)

// Config holds all application configuration.
// Future good-to-have: support ANTHROPIC_API_KEY and OPENAI_API_KEY to let users bring their own provider.
type Config struct {
	Port                   string
	GeminiAPIKey           string
	GeminiModel            string
	SupabaseURL            string
	SupabaseServiceRoleKey string
}

// LoadConfig loads configuration from environment variables and .env file.
func LoadConfig() *Config {
	godotenv.Load()

	return &Config{
		Port:                   getEnv("PORT", "8080"),
		GeminiAPIKey:           getEnv("GEMINI_API_KEY", ""),
		GeminiModel:            getEnv("GEMINI_MODEL", "gemini-2.5-flash"),
		SupabaseURL:            getEnv("SUPABASE_URL", ""),
		SupabaseServiceRoleKey: getEnv("SUPABASE_SERVICE_ROLE_KEY", ""),
	}
}

// getEnv returns an environment variable or a default value.
func getEnv(key, defaultVal string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultVal
}
