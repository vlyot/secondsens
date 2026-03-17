package shared

import (
	"context"
	"fmt"
	"strings"
	"time"

	"google.golang.org/genai"
)

// LLMClient wraps the Gemini API for two usage modes:
// - SearchWithGrounding: live web search via Google Search grounding (price fetching)
// - GenerateJSON: structured JSON generation without web access (validation, ranking)
type LLMClient struct {
	client *genai.Client
	model  string
}

// NewLLMClient creates a new LLMClient using the Gemini API.
func NewLLMClient(ctx context.Context, apiKey, model string) (*LLMClient, error) {
	client, err := genai.NewClient(ctx, &genai.ClientConfig{
		APIKey:  apiKey,
		Backend: genai.BackendGeminiAPI,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create Gemini client: %w", err)
	}
	return &LLMClient{client: client, model: model}, nil
}

// SearchWithGrounding calls Gemini with Google Search grounding enabled.
// Use for prompts that require live web data (e.g. price fetching).
// Timeout: 90s. Retries: 3 with exponential backoff.
func (l *LLMClient) SearchWithGrounding(ctx context.Context, prompt string) (string, error) {
	ctx, cancel := context.WithTimeout(ctx, 90*time.Second)
	defer cancel()

	config := &genai.GenerateContentConfig{
		Tools: []*genai.Tool{
			{GoogleSearch: &genai.GoogleSearch{}},
		},
	}

	return l.generateWithRetry(ctx, prompt, config)
}

// GenerateJSON calls Gemini for structured JSON output without web access.
// Use for product validation and recommendation ranking.
// Timeout: 60s. Retries: 3 with exponential backoff.
func (l *LLMClient) GenerateJSON(ctx context.Context, prompt string) (string, error) {
	ctx, cancel := context.WithTimeout(ctx, 60*time.Second)
	defer cancel()

	config := &genai.GenerateContentConfig{
		ResponseMIMEType: "application/json",
	}

	return l.generateWithRetry(ctx, prompt, config)
}

// generateWithRetry calls GenerateContent with up to 3 retries on transient errors.
func (l *LLMClient) generateWithRetry(ctx context.Context, prompt string, config *genai.GenerateContentConfig) (string, error) {
	contents := []*genai.Content{
		genai.NewContentFromText(prompt, genai.RoleUser),
	}

	var lastErr error
	backoff := time.Second

	for attempt := range 3 {
		resp, err := l.client.Models.GenerateContent(ctx, l.model, contents, config)
		if err == nil {
			text := stripMarkdownFences(resp.Text())
			if text == "" {
				return "", fmt.Errorf("Gemini returned empty response")
			}
			return text, nil
		}

		lastErr = err

		// Don't retry on context cancellation or deadline exceeded
		if ctx.Err() != nil {
			return "", ctx.Err()
		}

		if attempt < 2 {
			select {
			case <-time.After(backoff):
				backoff *= 2
			case <-ctx.Done():
				return "", ctx.Err()
			}
		}
	}

	return "", fmt.Errorf("Gemini request failed after 3 attempts: %w", lastErr)
}

// stripMarkdownFences removes ```json ... ``` or ``` ... ``` wrappers that Gemini sometimes adds.
func stripMarkdownFences(s string) string {
	s = strings.TrimSpace(s)
	if strings.HasPrefix(s, "```") {
		s = s[3:]
		if strings.HasPrefix(s, "json") {
			s = s[4:]
		}
		if idx := strings.LastIndex(s, "```"); idx != -1 {
			s = s[:idx]
		}
		s = strings.TrimSpace(s)
	}
	return s
}
