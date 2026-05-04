// @title           SecondSense API
// @version         1.0
// @description     Buy new vs used recommendation engine. Analyses product condition tiers with real-time price data and user preferences to recommend the optimal purchase strategy.
// @contact.name    SecondSense
// @host            localhost:8080
// @BasePath        /
// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Bearer token from Supabase Auth (required for /api/history endpoints only)
package main

import (
	"context"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	_ "secondsense/backend/docs"
	"secondsense/backend/src/history"
	"secondsense/backend/src/images"
	"secondsense/backend/src/prices"
	"secondsense/backend/src/products"
	"secondsense/backend/src/recommendations"
	"secondsense/backend/src/shared"
	"golang.org/x/time/rate"
)

func main() {
	cfg := shared.LoadConfig()

	if cfg.GeminiAPIKey == "" {
		log.Fatal("GEMINI_API_KEY is required. Add it to backend/.env")
	}

	// Initialise Gemini client
	ctx := context.Background()
	llmClient, err := shared.NewLLMClient(ctx, cfg.GeminiAPIKey, cfg.GeminiModel)
	if err != nil {
		log.Fatalf("Failed to create Gemini client: %v", err)
	}
	log.Printf("Gemini client ready (model: %s)", cfg.GeminiModel)

	// Initialise caches
	validationCache := shared.NewCache(10000, shared.ProductValidationTTL)
	recCache := shared.NewCache(10000, shared.RecommendationTTL)

	// Load product catalog
	repo, err := products.NewProductRepository("data/products.yaml")
	if err != nil {
		log.Fatalf("Failed to load product catalog: %v", err)
	}
	log.Printf("Loaded %d products from catalog", len(repo.GetAll()))

	// Wire services
	productService := products.NewProductService(repo, llmClient, validationCache)
	var ebayClient *prices.EbayClient
	if cfg.EbayAppID != "" {
		ebayClient = prices.NewEbayClient(cfg.EbayAppID)
		log.Println("eBay Browse API enabled")
	} else {
		log.Println("eBay Browse API disabled (EBAY_APP_ID not set) — using Gemini for prices")
	}
	priceService := prices.NewPriceService(llmClient, ebayClient)
	recService := recommendations.NewRecommendationService(llmClient)

	router := gin.Default()
	router.Use(corsMiddleware(cfg.CORSAllowedOrigins))

	// Initialise Supabase client (optional — nil disables cache + history)
	var supabaseClient *shared.SupabaseClient
	if cfg.SupabaseURL != "" && cfg.SupabaseServiceRoleKey != "" {
		supabaseClient = shared.NewSupabaseClient(cfg.SupabaseURL, cfg.SupabaseServiceRoleKey)
	}

	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	router.GET("/health", healthHandler)
	router.GET("/ping-db", pingDBHandler(supabaseClient))
	router.GET("/api/products", products.HandleProductList(productService))
	router.GET("/api/products/popular", products.HandlePopularProducts(supabaseClient))
	router.GET("/api/products/search", products.HandleProductSearch(productService))
	router.POST("/api/recommend", rateLimitMiddleware(), recommendations.HandleRecommendation(productService, priceService, recService, recCache, supabaseClient))
	router.GET("/api/product-image", images.HandleProductImage(supabaseClient, cfg))

	// History routes — require a valid Supabase JWT (JWKS-based, no secret needed)
	if supabaseClient != nil {
		authMiddleware, err := shared.NewAuthMiddleware(cfg.SupabaseURL)
		if err != nil {
			log.Fatalf("Failed to initialise auth middleware: %v", err)
		}
		historyGroup := router.Group("/api/history")
		historyGroup.Use(authMiddleware)
		{
			historyGroup.POST("", history.HandleSave(supabaseClient))
			historyGroup.GET("", history.HandleList(supabaseClient))
		}
		log.Println("History routes enabled (Supabase JWKS configured)")
	} else {
		log.Println("History routes disabled (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set)")
	}

	// Start in-process keep-warm loop to prevent Supabase free-tier pausing.
	if supabaseClient != nil {
		go func() {
			ticker := time.NewTicker(12 * time.Hour)
			defer ticker.Stop()
			for range ticker.C {
				if err := supabaseClient.Ping(); err != nil {
					log.Printf("keep-warm ping failed: %v", err)
				} else {
					log.Println("keep-warm ping: Supabase reachable")
				}
			}
		}()
		log.Println("Supabase keep-warm loop started (interval: 12h)")
	}

	log.Printf("Server running on :%s", cfg.Port)
	router.Run(":" + cfg.Port)
}

// corsMiddleware allows requests from origins in the CORS_ALLOWED_ORIGINS env var
// (comma-separated). Falls back to wildcard when the var is unset for local dev.
func corsMiddleware(allowedOrigins string) gin.HandlerFunc {
	originSet := make(map[string]struct{})
	if allowedOrigins != "" {
		for _, o := range strings.Split(allowedOrigins, ",") {
			originSet[strings.TrimSpace(o)] = struct{}{}
		}
	}

	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		if len(originSet) == 0 {
			c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		} else if _, ok := originSet[origin]; ok {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
			c.Writer.Header().Set("Vary", "Origin")
		} else if origin != "" {
			c.AbortWithStatus(http.StatusForbidden)
			return
		}
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Country")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}

// ipLimiters stores a rate.Limiter per client IP.
var ipLimiters sync.Map

func getLimiter(ip string) *rate.Limiter {
	if v, ok := ipLimiters.Load(ip); ok {
		return v.(*rate.Limiter)
	}
	// 3 requests/minute with a burst of 5
	l := rate.NewLimiter(rate.Every(20*time.Second), 5)
	ipLimiters.Store(ip, l)
	return l
}

// rateLimitMiddleware enforces per-IP rate limiting on expensive endpoints.
func rateLimitMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if !getLimiter(c.ClientIP()).Allow() {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{"error": "rate limit exceeded — please wait a moment"})
			return
		}
		c.Next()
	}
}

// pingDBHandler godoc
// @Summary      Database keep-warm ping
// @Description  Makes a lightweight request to Supabase to keep the connection pool active. Used by cron jobs to prevent cold starts.
// @Tags         system
// @Produce      json
// @Success      200  {object}  map[string]string
// @Failure      503  {object}  map[string]string
// @Router       /ping-db [get]
func pingDBHandler(supabase *shared.SupabaseClient) gin.HandlerFunc {
	return func(c *gin.Context) {
		if supabase == nil {
			c.JSON(http.StatusOK, gin.H{"status": "ok", "db": "disabled"})
			return
		}
		if err := supabase.Ping(); err != nil {
			log.Printf("ping-db failed: %v", err)
			c.JSON(http.StatusServiceUnavailable, gin.H{"status": "error", "message": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"status": "ok", "db": "reachable"})
	}
}

// healthHandler godoc
// @Summary      Health check
// @Description  Returns ok when the server is running
// @Tags         system
// @Produce      json
// @Success      200  {object}  map[string]string
// @Router       /health [get]
func healthHandler(c *gin.Context) {
	c.JSON(200, gin.H{"status": "ok"})
}
