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

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	_ "secondsense/backend/docs"
	"secondsense/backend/src/history"
	"secondsense/backend/src/prices"
	"secondsense/backend/src/products"
	"secondsense/backend/src/recommendations"
	"secondsense/backend/src/shared"
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
	router.Use(corsMiddleware())

	// Initialise Supabase client (optional — nil disables cache + history)
	var supabaseClient *shared.SupabaseClient
	if cfg.SupabaseURL != "" && cfg.SupabaseServiceRoleKey != "" {
		supabaseClient = shared.NewSupabaseClient(cfg.SupabaseURL, cfg.SupabaseServiceRoleKey)
	}

	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	router.GET("/health", healthHandler)
	router.GET("/api/products", products.HandleProductList(productService))
	router.GET("/api/products/popular", products.HandlePopularProducts(supabaseClient))
	router.GET("/api/products/search", products.HandleProductSearch(productService))
	router.POST("/api/recommend", recommendations.HandleRecommendation(productService, priceService, recService, recCache, supabaseClient))

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

	log.Printf("Server running on :%s", cfg.Port)
	router.Run(":" + cfg.Port)
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Country")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
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
