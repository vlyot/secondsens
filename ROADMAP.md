# SecondSense: Roadmap to Completion

**Last Updated:** March 2026
**Current Progress:** ~85% Complete

---

## Executive Summary

SecondSense helps users decide whether to buy products new or used by comparing prices across condition tiers and providing AI-powered recommendations.

**Current Status:**
- Done - **Frontend**: Complete UI wired to real API, no mock data remaining
- Done - **Backend**: Full pipeline live -- product resolution, price fetching, LLM ranking, caching
- Done - **Integration**: Real API calls, disambiguation flow, marketplace links, error handling
- Todo - **Deployment**: Not yet deployed

---

## What is Working (85% Complete)

### Frontend -- Phases 2 and 5 Complete
- All UI components: SearchBar, PersonalisationSliders, RecommendationDisplay, ProductDisambiguation, LoadingState, ErrorPage
- Complete user flow: Landing -> Search -> Sliders -> Results (or Disambiguation -> Sliders -> Results)
- Real API calls replacing all mock data -- getRecommendation() calls POST /api/recommend
- AMBIGUOUS response handling -- backend returns {status: "AMBIGUOUS", matches: [...]} and frontend shows picker
- Error messages read from backend JSON body, not HTTP status text
- Marketplace links: Find Listings opens Carousell SG and Facebook Marketplace SG in new tabs
- Loading overlay with correct message (~30-45 seconds) during real API call
- Animations, dark/light theme, reduced motion support

### Backend -- Phases 1, 3 and 4 Complete
- HTTP server (Gin) with CORS and health endpoint
- Full type system matching frontend TypeScript interfaces exactly
- 26 real products in YAML catalog with fuzzy matching and disambiguation
- Search endpoint: GET /api/products/search?q=query (EXACT / UNIQUE / AMBIGUOUS / NOT_FOUND)
- Gemini LLM integration (gemini-2.5-flash):
  - SearchWithGrounding: live Google Search, returns prose with citations
  - GenerateJSON: structured output for JSON extraction and ranking
- Price fetching two-step pipeline:
  1. SearchWithGrounding fetches live listing prose from Carousell SG, Facebook Marketplace SG, Lazada SG
  2. GenerateJSON extracts structured price arrays from that prose
  - sanitisePriceJSON() repairs Gemini JSON-mode quirk ("brand_new":, -> "brand_new":[])
- Dynamic product validation via Gemini for products not in the YAML catalog
- Multi-layer caching: product validation (7-day TTL) + recommendations (24-hour TTL)
- Recommendation ranking with savings calculation vs. brand new
- All unit tests passing

---

## What is Missing (15% Remaining)

1. **Phase 6**: Testing and refinement -- prompt quality, price accuracy, edge cases
2. **Phase 7**: Deployment -- Fly.io (backend) + Vercel (frontend)

---

## Phase 3: Product Catalog and Matching -- COMPLETE

- 26 products loaded from data/products.yaml on startup
- Exact + fuzzy matching with alias support (case-insensitive)
- Disambiguation returns top 5 matches when ambiguous
- GET /api/products/search?q=query live
- All unit tests passing

---

## Phase 4: LLM Integration -- COMPLETE

- Gemini client (llm_client.go): SearchWithGrounding + GenerateJSON with 3-retry exponential backoff
- Dynamic product validation (ValidateDynamicProduct) with 7-day cache
- Price fetching: two-step grounding + extraction pipeline with JSON sanitiser
- Recommendation ranking with per-tier avg/min/max stats and savings calculation
- Multi-layer in-memory cache (cache.go)
- Full pipeline wired in recommendations/handlers.go

---

## Phase 5: Frontend-Backend Integration -- COMPLETE

- App.tsx rewritten: all mock data removed, real async API calls
- AMBIGUOUS response correctly triggers disambiguation modal
- Error handling reads message from backend JSON body
- marketplaceLinks.ts generates Carousell SG and Facebook Marketplace SG URLs
- handleFindListings opens both marketplace tabs
- SearchPage updated: open-ended search, no hardcoded product list
- api.ts: union return type RecommendationResult, async error handler
- types.ts: AmbiguousResponse and RecommendationResult types added
- constants.ts: mock helpers removed, real constants kept

---

## Phase 6: Testing and Refinement (2-4 days)

**Goal:** Validate real-world accuracy and fix any issues found in practice.

### 6.1 Prompt Quality Testing

Run 10 searches with varied slider combinations and evaluate whether each recommendation matches intuition.

Suggested test matrix:

| Search | Budget | Condition | Hassle | Expected top pick |
|--------|--------|-----------|--------|-------------------|
| Logitech G Pro X Superlight | 2 | 3 | 5 | Well Used |
| Logitech G Pro X Superlight | 8 | 8 | 8 | Like New or Brand New |
| Razer DeathAdder V3 | 5 | 5 | 5 | Good (balanced) |
| iPhone 15 Pro (dynamic) | 3 | 5 | 5 | Good or Well Used |
| AirPods Pro 2 (dynamic) | 7 | 7 | 7 | Like New |

Evaluation criteria:
- Does the top-ranked condition match intuition for the slider values?
- Is the justification text specific to the sliders, not generic filler?
- Does the reasoning paragraph add real insight?
- Is the confidence score meaningful (High for common products, Low for rare ones)?

If quality is poor, consider:
- Adding explicit rules to the ranking prompt for each slider extreme (e.g. "if budget < 3, always prioritise the cheapest tier")
- Adding worked examples to the prompt (few-shot prompting)
- Checking whether the price data itself is reasonable before blaming the ranker

### 6.2 Price Accuracy Check

For 5 products, manually check 3-4 live listings on Carousell SG and compare to what SecondSense reports.

Target: within 15% of real current listings.

If prices are consistently wrong:
- Add temporary logging in FetchPrices to print the raw searchResults prose from step 1
- Adjust the search prompt to be more explicit about condition tier labelling
- If a tier is always empty, mention it more explicitly in the search prompt

### 6.3 Error and Edge Case Testing

| Scenario | Expected behaviour |
|----------|-------------------|
| banana slicer 3000 | 404 error: "We couldn't find this product" in ~3s |
| logitech | AMBIGUOUS modal with multiple Logitech products |
| gpro superlight, repeated within 24h | Results in under 2 seconds (cache hit) |
| Backend offline | Error page with suggestion to check backend |
| Product with no used market | no valid prices found error or Low confidence score |

### 6.4 Keep a Prompt Iteration Log

Create PROMPT_TESTING.md as you test. For each run: date, product, slider values, recommendation received, whether it was correct, and any prompt change made. This becomes your evidence base for future changes.

---

## Phase 7: Deployment (1-2 days)

### 7.1 Backend on Fly.io

```bash
cd backend
fly launch
fly secrets set GEMINI_API_KEY=your_key_here
fly deploy
```

fly.toml env block:
```toml
[env]
  PORT = "8080"
  GEMINI_MODEL = "gemini-2.5-flash"
```

### 7.2 Frontend on Vercel

```bash
vercel deploy --prod
```

Set VITE_API_BACKEND_URL to your Fly.io URL in the Vercel dashboard.

### 7.3 CORS

Update AllowOrigins in main.go to include the Vercel production domain.

### 7.4 Production Checklist
- [ ] GEMINI_API_KEY set as Fly.io secret (not in fly.toml)
- [ ] CORS updated for production Vercel URL
- [ ] Health endpoint responding: GET /health
- [ ] Full search tested on production after deploy
- [ ] README updated with live URL

---

## Timeline Summary

| Phase | Status |
|-------|--------|
| 1 -- Project setup | Complete |
| 2 -- Frontend UI | Complete |
| 3 -- Product matching | Complete |
| 4 -- LLM integration | Complete |
| 5 -- Frontend-backend integration | Complete |
| 6 -- Testing and refinement | Next |
| 7 -- Deployment | Pending |

---

## Success Criteria

### Functionality
- [x] Frontend UI with all components
- [x] Search 26 catalog products with fuzzy matching and disambiguation
- [x] Dynamic product validation for any product via Gemini
- [x] Real price fetching via LLM grounded search (~30-45s)
- [x] AI-powered recommendations based on preferences
- [x] Results cached 24 hours, under 1s on repeat
- [x] Marketplace links (Carousell SG, Facebook Marketplace SG)
- [ ] Deployed and accessible via web

### Quality
- [ ] No crashes during normal use
- [ ] Recommendations match intuition in more than 75% of test cases
- [ ] Prices within 15% of real listings
- [ ] Clear error messages for all edge cases

---

## Architecture Overview

```
Frontend (React + Vite) -- localhost:5173

  SearchBar -> PersonalisationSliders -> Results
  Disambiguation modal if AMBIGUOUS

        |
        | POST /api/recommend
        | { item: "gpro superlight",
        |   preferences: {budget_flexibility: 7,
        |                 condition_standards: 5,
        |                 hassle_tolerance: 4} }
        v

Backend (Go + Gin) -- localhost:8080

  Step 1: Resolve Product Name
    Check product cache (7-day TTL)
      miss -> Check YAML catalog (fuzzy match)
        EXACT/UNIQUE  -> canonical name
        AMBIGUOUS     -> return choices to frontend
        NOT_FOUND     -> Gemini validates product
          valid   -> canonical name, cache 7 days
          invalid -> 404 error

  Step 2: Check Recommendation Cache
    Key: {canonical_name}:{hash(preferences)}, TTL 24h
      HIT  -> return instantly (<1s)
      MISS -> continue

  Step 3: Fetch Prices (two-step)
    SearchWithGrounding -> Gemini searches Carousell SG,
                          Facebook Marketplace SG, Lazada SG
                          Returns prose (~25-40s)
    GenerateJSON        -> Extracts price arrays from prose
                          sanitisePriceJSON repairs missing values

  Step 4: Generate Recommendation
    Compute avg/min/max per tier
    GenerateJSON -> Gemini ranks tiers against user preferences
                   Returns ranked options + justifications (~5-10s)

  Cache result 24 hours, return JSON to frontend

Frontend renders:
  Ranked condition cards, savings vs new,
  justification text, market stats table,
  Find Listings -> Carousell SG + Facebook Marketplace SG tabs
```

---

## Key Files

| File | Purpose |
|------|---------|
| backend/src/main.go | Server setup, dependency wiring |
| backend/src/shared/llm_client.go | Gemini client, grounding and JSON modes |
| backend/src/shared/cache.go | In-memory cache with two TTLs |
| backend/src/products/product_service.go | Catalog search and dynamic validation |
| backend/src/prices/price_service.go | Two-step price fetch and JSON sanitiser |
| backend/src/recommendations/recommendation_service.go | Ranking prompt and response mapping |
| backend/src/recommendations/handlers.go | Full pipeline orchestration |
| frontend/App.tsx | State machine, API calls, all handlers |
| frontend/services/api.ts | getRecommendation(), union return type |
| frontend/lib/types.ts | Shared types mirroring Go structs |
| frontend/lib/marketplaceLinks.ts | Carousell SG and Facebook URL generation |
