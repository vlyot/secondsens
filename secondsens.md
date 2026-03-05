# SecondSense: Decision-Support Tool for New vs. Used Purchases

## Project Overview

**Version:** 0.2 (MVP -- Functional)
**Last Updated:** March 2026
**Status:** Feature complete, pending testing and deployment

### Executive Summary

SecondSense is a lightweight web application that helps consumers make informed decisions when purchasing items by comparing prices across different condition tiers (brand new, like new, good, well used) and providing personalised recommendations based on user preferences.

Unlike traditional price comparison tools that only show new item prices, SecondSense analyses the entire market spectrum and uses LLM reasoning to recommend the optimal condition tier based on the user's budget flexibility, condition standards, and hassle tolerance.

**Core Value Proposition:** Answer the question "Should I buy this new or used?" with confidence, backed by real market data and personalised reasoning.

---

## Current Implementation

The app is fully functional end-to-end. The stack that was actually built:

| Component | Technology | Notes |
|-----------|-----------|-------|
| Frontend | React 19 + TypeScript + Vite 7 | shadcn/ui "new-york", Tailwind CSS v4 |
| Backend | Go + Gin | Modular monolith: products, prices, recommendations, shared |
| LLM | Google Gemini 2.5 Flash | Two modes: grounded search + structured JSON |
| Cache | In-memory (Go sync.Map) | Two TTLs: 7d product validation, 24h recommendations |
| Marketplace links | Carousell SG + Facebook Marketplace SG | Client-side URL generation |
| Hosting | Not yet deployed | Planned: Fly.io (backend) + Vercel (frontend) |

---

## User Flow

```
Landing -> Search -> Preferences -> Results
              |
              v (if ambiguous)
         Disambiguation picker -> Preferences -> Results
```

### Step 1: Search
User types any product name. The backend resolves it:
- Exact or unique match in the 26-product YAML catalog -> proceed
- Ambiguous (e.g. "logitech") -> disambiguation picker shown
- Not in catalog -> Gemini validates whether it is a real buyable product

### Step 2: Preferences
Three sliders (0-10 scale):
- **Budget Flexibility**: 0 = tight budget, 10 = flexible
- **Condition Standards**: 0 = cosmetic wear OK, 10 = pristine only
- **Hassle Tolerance**: 0 = willing to repair/negotiate, 10 = plug and play

All sliders default to 5. User submits when ready.

### Step 3: Results
After ~30-45 seconds (or under 1s if cached), the backend returns:
- Three ranked condition options (Brand New / Like New / Good / Well Used)
- Average price in SGD for each, with min/max range
- Savings vs. brand new (absolute S$ and percentage)
- AI-written justification for each option, tailored to the slider values
- Overall reasoning paragraph
- Confidence score (High / Medium / Low)
- Market statistics table showing all four tiers

Each condition card has a "Find Listings" button that opens:
- Carousell SG with product name and condition filter pre-filled
- Facebook Marketplace SG with product name pre-filled

---

## Technical Architecture

### Backend Pipeline (POST /api/recommend)

```
Request arrives: { item, preferences }

Step 1 -- Product Resolution
  Check in-memory cache (7-day TTL)
  miss -> YAML catalog fuzzy match
    EXACT/UNIQUE -> canonical name
    AMBIGUOUS    -> return 200 {status: "AMBIGUOUS", matches: [...]}
    NOT_FOUND    -> Gemini validates: is this a real product?
      valid   -> canonical name, cache 7 days
      invalid -> 404 "We couldn't find this product"

Step 2 -- Recommendation Cache
  Check in-memory cache keyed by {canonical_name}:{hash(preferences)}
  HIT  -> return immediately
  MISS -> continue

Step 3 -- Price Fetching (two-step)
  SearchWithGrounding: Gemini searches Carousell SG, Facebook
    Marketplace SG, Lazada SG and returns prose (~25-40s)
  GenerateJSON: extract {brand_new:[...], like_new:[...], ...}
    from that prose; sanitiser repairs missing array values

Step 4 -- Recommendation Ranking
  Compute avg/min/max per tier
  GenerateJSON: rank tiers against preferences, write justifications

Cache result 24h, return RecommendationResponse
```

### Why Two-Step Price Fetching

Gemini's grounding mode returns prose with citations -- it cannot produce
structured JSON in that mode. The two-step approach separates concerns:
SearchWithGrounding for web access, GenerateJSON for structured extraction.
A sanitiser (sanitisePriceJSON) handles the edge case where Gemini omits
empty array values ("brand_new":, instead of "brand_new":[]).

### Caching Strategy

Two independent in-memory caches:
- **Product validation cache** (7-day TTL): avoids re-calling Gemini to
  validate the same product. Caches both valid and invalid results.
- **Recommendation cache** (24-hour TTL): avoids re-fetching prices for
  the same product + preference combination. Key includes a hash of all
  three slider values.

On cold start, both caches are empty. They warm up from usage. Products
in the YAML catalog are never re-validated (catalog is treated as ground truth).

---

## Problem Statement

Consumers frequently face decision paralysis when choosing between new and used items:
- **Analysis paralysis:** Uncertain whether the used discount justifies potential risks
- **Information asymmetry:** Don't know what "good" used prices actually are
- **Subjective trade-offs:** Struggle to weight personal preferences against market realities
- **Time cost:** Manually searching across multiple marketplaces is tedious

SecondSense solves this by aggregating real prices from live marketplace listings,
understanding personal preferences through three sliders, and providing a clear
ranked recommendation with AI-written justification.

---

## Product Catalog

The YAML catalog at backend/data/products.yaml contains 26 products (initial focus: gaming peripherals and mechanical keyboards). Each product has:
- Canonical name (used for price fetching and display)
- Category
- Aliases (common abbreviations, model numbers, nicknames)

Products in the catalog benefit from instant fuzzy matching and disambiguation.
Products not in the catalog go through Gemini dynamic validation (~3s extra).
Both paths produce a canonical name that feeds into the same price + ranking pipeline.

---

## What Was Deferred

The following were considered but not built for MVP:

- **Persistent cache** (Redis): in-memory cache is sufficient for personal use; restarts clear it
- **User accounts**: not needed for single-user personal project
- **Historical price charts**: requires persistence; out of scope
- **Browser extension**: future consideration if web app proves useful
- **Dedicated scrapers**: LLM-powered search is sufficient and faster to maintain
- **eBay/Shopee links**: only Carousell SG and Facebook Marketplace SG implemented for now

---

## Remaining Work

### Phase 6: Testing and Refinement (2-4 days)
Run 10 test searches with varied slider combinations. Spot-check prices against real Carousell listings. Document results in PROMPT_TESTING.md. Tune prompts if recommendation quality is poor or prices are consistently off.

### Phase 7: Deployment (1-2 days)
- Backend: Fly.io (`fly launch && fly secrets set GEMINI_API_KEY=... && fly deploy`)
- Frontend: Vercel (`vercel deploy --prod`)
- Set VITE_API_BACKEND_URL to Fly.io URL
- Update CORS in main.go for production domain

---

## Key Files

| File | Purpose |
|------|---------|
| backend/src/main.go | Server, routing, dependency wiring |
| backend/src/shared/llm_client.go | Gemini grounding + JSON modes, retry logic |
| backend/src/shared/cache.go | Thread-safe in-memory cache |
| backend/src/products/product_service.go | YAML catalog search + Gemini dynamic validation |
| backend/src/prices/price_service.go | Two-step price fetch, JSON sanitiser |
| backend/src/recommendations/recommendation_service.go | Ranking prompt + savings calculation |
| backend/src/recommendations/handlers.go | Full pipeline orchestration |
| backend/data/products.yaml | 26-product catalog with aliases |
| frontend/App.tsx | App state machine, all API calls and handlers |
| frontend/services/api.ts | HTTP client, union return type, error handling |
| frontend/lib/types.ts | TypeScript types mirroring Go domain structs |
| frontend/lib/marketplaceLinks.ts | Carousell SG + Facebook Marketplace URL builder |
| frontend/components/RecommendationDisplay.tsx | Results UI: ranked cards, stats table |
| frontend/components/ProductDisambiguation.tsx | Disambiguation picker UI |
