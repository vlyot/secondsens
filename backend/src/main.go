package main

import (
	"context"
	"log"

	"github.com/gin-gonic/gin"
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
	priceService := prices.NewPriceService(llmClient)
	recService := recommendations.NewRecommendationService(llmClient)

	router := gin.Default()
	router.Use(corsMiddleware())

	router.GET("/health", healthHandler)
	router.GET("/api/products/search", products.HandleProductSearch(productService))
	router.POST("/api/recommend", recommendations.HandleRecommendation(productService, priceService, recService, recCache))

	log.Printf("Server running on :%s", cfg.Port)
	router.Run(":" + cfg.Port)
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}

func healthHandler(c *gin.Context) {
	c.JSON(200, gin.H{"status": "ok"})
}
