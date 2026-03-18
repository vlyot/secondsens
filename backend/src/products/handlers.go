package products

import (
	"log"

	"github.com/gin-gonic/gin"
	"secondsense/backend/src/shared"
)

// HandleProductList handles GET /api/products — returns all canonical product names.
func HandleProductList(productService *ProductService) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(200, productService.GetAllCanonicalNames())
	}
}

// HandleProductSearch handles GET /api/products/search?q=query
func HandleProductSearch(productService *ProductService) gin.HandlerFunc {
	return func(c *gin.Context) {
		query := c.Query("q")
		if query == "" {
			c.JSON(400, gin.H{"error": "query parameter 'q' required"})
			return
		}

		result := productService.Search(query)
		c.JSON(200, result)
	}
}

// HandlePopularProducts handles GET /api/products/popular — returns recently searched product names
// sourced from the shared search_cache table. Falls back to an empty list if Supabase is unavailable.
func HandlePopularProducts(supabaseClient *shared.SupabaseClient) gin.HandlerFunc {
	return func(c *gin.Context) {
		if supabaseClient == nil {
			c.JSON(200, []string{})
			return
		}
		names, err := supabaseClient.GetPopularProducts(50)
		if err != nil {
			log.Printf("get popular products failed (returning empty): %v", err)
			c.JSON(200, []string{})
			return
		}
		c.JSON(200, names)
	}
}
