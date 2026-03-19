package images

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"secondsense/backend/src/shared"
)

type googleSearchResponse struct {
	Items []struct {
		Link string `json:"link"`
	} `json:"items"`
}

// HandleProductImage godoc
// @Summary      Fetch product image URL
// @Description  Returns a product thumbnail URL from the image cache or Google Custom Search API.
//               Always returns 200 — image_url is empty string on failure or missing config.
// @Tags         products
// @Produce      json
// @Param        q  query  string  true  "Product name"
// @Success      200  {object}  map[string]string
// @Router       /api/product-image [get]
func HandleProductImage(supabase *shared.SupabaseClient, cfg *shared.Config) gin.HandlerFunc {
	httpClient := &http.Client{Timeout: 5 * time.Second}

	return func(c *gin.Context) {
		q := strings.TrimSpace(c.Query("q"))
		if q == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "q parameter is required"})
			return
		}

		normalized := strings.ToLower(q)

		// Check Supabase cache first.
		if supabase != nil {
			if cached, err := supabase.GetImageCache(normalized); err == nil && cached != "" {
				c.JSON(http.StatusOK, gin.H{"image_url": cached})
				return
			}
		}

		// No Google API key configured — return empty gracefully.
		if cfg.GoogleSearchAPIKey == "" || cfg.GoogleSearchCX == "" {
			c.JSON(http.StatusOK, gin.H{"image_url": ""})
			return
		}

		imageURL, err := fetchGoogleImage(httpClient, cfg.GoogleSearchAPIKey, cfg.GoogleSearchCX, q)
		if err != nil {
			log.Printf("images: google search failed for %q: %v", q, err)
			c.JSON(http.StatusOK, gin.H{"image_url": ""})
			return
		}

		// Fire-and-forget cache write.
		if supabase != nil && imageURL != "" {
			go func() {
				if err := supabase.UpsertImageCache(normalized, imageURL); err != nil {
					log.Printf("images: upsert cache failed for %q: %v", normalized, err)
				}
			}()
		}

		c.JSON(http.StatusOK, gin.H{"image_url": imageURL})
	}
}

func fetchGoogleImage(client *http.Client, apiKey, cx, query string) (string, error) {
	endpoint := fmt.Sprintf(
		"https://www.googleapis.com/customsearch/v1?key=%s&cx=%s&q=%s&searchType=image&num=1",
		url.QueryEscape(apiKey),
		url.QueryEscape(cx),
		url.QueryEscape(query+" product"),
	)

	resp, err := client.Get(endpoint)
	if err != nil {
		return "", fmt.Errorf("http get: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("google api returned %d", resp.StatusCode)
	}

	var result googleSearchResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("decode response: %w", err)
	}

	if len(result.Items) == 0 {
		return "", nil
	}
	return result.Items[0].Link, nil
}
