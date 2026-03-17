package shared

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/MicahParks/keyfunc/v3"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

const ContextUserID = "user_id"

// NewAuthMiddleware fetches Supabase's JWKS and returns a Gin middleware that
// validates incoming JWTs. Keys are refreshed automatically every 15 minutes.
// Supports both the new ECC P-256 (ES256) keys and legacy HS256 keys.
func NewAuthMiddleware(supabaseURL string) (gin.HandlerFunc, error) {
	base := strings.TrimRight(supabaseURL, "/")
	// In tests the base URL is the mock server root; in production it's the Supabase project URL.
	var jwksURL string
	if strings.Contains(base, "supabase.co") {
		jwksURL = base + "/auth/v1/.well-known/jwks.json"
	} else {
		jwksURL = base + "/.well-known/jwks.json"
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	k, err := keyfunc.NewDefaultCtx(ctx, []string{jwksURL})
	if err != nil {
		return nil, fmt.Errorf("failed to fetch JWKS from %s: %w", jwksURL, err)
	}

	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			c.AbortWithStatusJSON(401, gin.H{"error": "missing or malformed authorization header"})
			return
		}

		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")

		token, err := jwt.Parse(tokenStr, k.Keyfunc,
			jwt.WithValidMethods([]string{"ES256", "RS256", "HS256"}),
		)
		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(401, gin.H{"error": "invalid or expired token"})
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.AbortWithStatusJSON(401, gin.H{"error": "invalid token claims"})
			return
		}

		sub, ok := claims["sub"].(string)
		if !ok || sub == "" {
			c.AbortWithStatusJSON(401, gin.H{"error": "token missing sub claim"})
			return
		}

		c.Set(ContextUserID, sub)
		c.Next()
	}, nil
}
