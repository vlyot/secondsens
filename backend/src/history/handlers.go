package history

import (
	"encoding/json"
	"strconv"

	"github.com/gin-gonic/gin"
	"secondsense/backend/src/shared"
	"secondsense/backend/src/shared/domain"
)

// SaveRequest is the body for POST /api/history.
type SaveRequest struct {
	ProductName    string                      `json:"product_name" binding:"required"`
	Preferences    domain.Preferences          `json:"preferences"`
	Recommendation domain.RecommendationResponse `json:"recommendation"`
}

// HistoryItem is a single history entry returned to the frontend.
type HistoryItem struct {
	ID             string                      `json:"id"`
	ProductName    string                      `json:"product_name"`
	Preferences    domain.Preferences          `json:"preferences"`
	Recommendation domain.RecommendationResponse `json:"recommendation"`
	CreatedAt      string                      `json:"created_at"`
}

// HandleSave godoc
// @Summary      Save search to history
// @Description  Saves a completed recommendation to the authenticated user's history
// @Tags         history
// @Accept       json
// @Produce      json
// @Param        body  body      SaveRequest  true  "Search to save"
// @Success      201   {object}  map[string]bool
// @Failure      400   {object}  map[string]string
// @Failure      401   {object}  map[string]string
// @Failure      502   {object}  map[string]string
// @Security     BearerAuth
// @Router       /api/history [post]
func HandleSave(db *shared.SupabaseClient) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, _ := c.Get(shared.ContextUserID)

		var req SaveRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, gin.H{"error": "invalid request body"})
			return
		}

		if err := db.InsertSearch(userID.(string), req.ProductName, req.Preferences, req.Recommendation); err != nil {
			c.JSON(502, gin.H{"error": "failed to save history"})
			return
		}

		c.JSON(201, gin.H{"saved": true})
	}
}

// HandleList godoc
// @Summary      Get search history
// @Description  Returns the authenticated user's last 20 searches, newest first
// @Tags         history
// @Produce      json
// @Success      200  {array}   HistoryItem
// @Failure      401  {object}  map[string]string
// @Failure      502  {object}  map[string]string
// @Security     BearerAuth
// @Router       /api/history [get]
func HandleList(db *shared.SupabaseClient) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, _ := c.Get(shared.ContextUserID)

		limit := 10
		offset := 0
		if l, err := strconv.Atoi(c.Query("limit")); err == nil && l > 0 {
			limit = l
		}
		if o, err := strconv.Atoi(c.Query("offset")); err == nil && o >= 0 {
			offset = o
		}

		records, err := db.GetSearches(userID.(string), limit, offset)
		if err != nil {
			c.JSON(502, gin.H{"error": "failed to fetch history"})
			return
		}

		items := make([]HistoryItem, 0, len(records))
		for _, r := range records {
			var prefs domain.Preferences
			var rec domain.RecommendationResponse
			json.Unmarshal(r.Preferences, &prefs)     //nolint:errcheck
			json.Unmarshal(r.Recommendation, &rec)     //nolint:errcheck

			items = append(items, HistoryItem{
				ID:             r.ID,
				ProductName:    r.ProductName,
				Preferences:    prefs,
				Recommendation: rec,
				CreatedAt:      r.CreatedAt.Format("2006-01-02T15:04:05Z"),
			})
		}

		c.JSON(200, items)
	}
}
