package recommendations

import (
	"github.com/gin-gonic/gin"
	"secondsense/backend/src/shared/domain"
)

// HandleRecommendation handles the POST /api/recommend endpoint.
func HandleRecommendation(c *gin.Context) {
	req, err := parseRequest(c)
	if err != nil {
		c.JSON(400, gin.H{"error": "Invalid request"})
		return
	}

	if err := validatePreferences(&req.Preferences); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	// Stub response for now
	c.JSON(200, gin.H{"message": "Request received but not implemented yet"})
}

// parseRequest binds and parses the JSON request.
func parseRequest(c *gin.Context) (*domain.RecommendationRequest, error) {
	var req domain.RecommendationRequest
	if err := c.BindJSON(&req); err != nil {
		return nil, err
	}
	return &req, nil
}

// validatePreferences validates that preferences are within 0-10 range.
func validatePreferences(prefs *domain.Preferences) error {
	if prefs.BudgetFlexibility < 0 || prefs.BudgetFlexibility > 10 {
		return &ValidationError{"BudgetFlexibility must be between 0 and 10"}
	}
	if prefs.ConditionStandards < 0 || prefs.ConditionStandards > 10 {
		return &ValidationError{"ConditionStandards must be between 0 and 10"}
	}
	if prefs.HassleTolerances < 0 || prefs.HassleTolerances > 10 {
		return &ValidationError{"HassleTolerances must be between 0 and 10"}
	}
	return nil
}

// ValidationError is a custom error for validation failures.
type ValidationError struct {
	Message string
}

func (e *ValidationError) Error() string {
	return e.Message
}
