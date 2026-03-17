package shared

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// makeECToken creates an ES256 JWT signed with the provided private key.
func makeECToken(key *ecdsa.PrivateKey, kid, sub string, expired bool) string {
	exp := time.Now().Add(time.Hour)
	if expired {
		exp = time.Now().Add(-time.Hour)
	}
	t := jwt.NewWithClaims(jwt.SigningMethodES256, jwt.MapClaims{
		"sub": sub,
		"exp": exp.Unix(),
	})
	t.Header["kid"] = kid
	signed, _ := t.SignedString(key)
	return signed
}

// jwksHandler returns an HTTP handler serving a minimal JWKS for the given key.
func jwksHandler(t *testing.T, key *ecdsa.PrivateKey, kid string) http.HandlerFunc {
	t.Helper()
	pub := key.Public().(*ecdsa.PublicKey)
	// Build minimal JWK (EC P-256)
	x, y := pub.X.Bytes(), pub.Y.Bytes()
	// pad to 32 bytes
	pad := func(b []byte) []byte {
		if len(b) < 32 {
			padded := make([]byte, 32)
			copy(padded[32-len(b):], b)
			return padded
		}
		return b
	}
	import64 := func(b []byte) string {
		return encodeBase64URL(pad(b))
	}
	jwks := map[string]any{
		"keys": []map[string]any{
			{
				"kty": "EC",
				"kid": kid,
				"crv": "P-256",
				"alg": "ES256",
				"use": "sig",
				"x":   import64(x),
				"y":   import64(y),
			},
		},
	}
	body, _ := json.Marshal(jwks)
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write(body)
	}
}

// encodeBase64URL encodes bytes as base64url without padding.
func encodeBase64URL(b []byte) string {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
	var out []byte
	for i := 0; i < len(b); i += 3 {
		switch {
		case i+2 < len(b):
			v := uint(b[i])<<16 | uint(b[i+1])<<8 | uint(b[i+2])
			out = append(out, chars[v>>18], chars[(v>>12)&0x3f], chars[(v>>6)&0x3f], chars[v&0x3f])
		case i+1 < len(b):
			v := uint(b[i])<<16 | uint(b[i+1])<<8
			out = append(out, chars[v>>18], chars[(v>>12)&0x3f], chars[(v>>6)&0x3f])
		default:
			v := uint(b[i]) << 16
			out = append(out, chars[v>>18], chars[(v>>12)&0x3f])
		}
	}
	return string(out)
}

func setupTestMiddleware(t *testing.T) (gin.HandlerFunc, *ecdsa.PrivateKey, string) {
	t.Helper()
	key, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		t.Fatalf("generate key: %v", err)
	}
	kid := "test-key-1"

	// Serve JWKS locally
	srv := httptest.NewServer(jwksHandler(t, key, kid))
	t.Cleanup(srv.Close)

	// NewAuthMiddleware but point at local test server
	mw, err := NewAuthMiddleware(srv.URL)
	if err != nil {
		t.Fatalf("NewAuthMiddleware: %v", err)
	}
	return mw, key, kid
}

func TestAuthMiddleware_ValidToken(t *testing.T) {
	mw, key, kid := setupTestMiddleware(t)

	r := gin.New()
	r.GET("/protected", mw, func(c *gin.Context) {
		uid, _ := c.Get(ContextUserID)
		c.JSON(200, gin.H{"user_id": uid})
	})

	token := makeECToken(key, kid, "user-abc", false)
	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d: %s", w.Code, w.Body.String())
	}
}

func TestAuthMiddleware_MissingHeader(t *testing.T) {
	mw, _, _ := setupTestMiddleware(t)

	r := gin.New()
	r.GET("/protected", mw, func(c *gin.Context) { c.JSON(200, nil) })

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", w.Code)
	}
}

func TestAuthMiddleware_ExpiredToken(t *testing.T) {
	mw, key, kid := setupTestMiddleware(t)

	r := gin.New()
	r.GET("/protected", mw, func(c *gin.Context) { c.JSON(200, nil) })

	token := makeECToken(key, kid, "user-abc", true)
	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", w.Code)
	}
}

func TestAuthMiddleware_WrongKey(t *testing.T) {
	mw, _, kid := setupTestMiddleware(t)

	// Sign with a different key not in the JWKS
	otherKey, _ := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	token := makeECToken(otherKey, kid, "user-abc", false)

	r := gin.New()
	r.GET("/protected", mw, func(c *gin.Context) { c.JSON(200, nil) })

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", w.Code)
	}
}
