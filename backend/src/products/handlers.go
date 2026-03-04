package products

import (
	"github.com/gin-gonic/gin"
)

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
