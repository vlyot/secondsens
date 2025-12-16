package main

import (
	"log"

	"github.com/gin-gonic/gin"
	"secondsense/backend/src/shared"
)

func main() {
	cfg := shared.LoadConfig()

	router := gin.Default()
	router.Use(corsMiddleware())

	// Health check endpoint
	router.GET("/health", healthHandler)

	// Recommendation endpoint (stub for now)
	router.POST("/api/recommend", recommendStubHandler)

	log.Printf("Server running on port %s\n", cfg.Port)
	router.Run(":" + cfg.Port)
}

// corsMiddleware adds CORS headers for frontend communication.
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

// healthHandler returns service health status.
func healthHandler(c *gin.Context) {
	c.JSON(200, gin.H{"status": "ok"})
}

// recommendStubHandler is a stub for the recommendation endpoint.
func recommendStubHandler(c *gin.Context) {
	c.JSON(200, gin.H{"message": "Not implemented yet"})
}
