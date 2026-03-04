# SecondSense: Roadmap to Completion

**Last Updated:** March 2026
**Current Progress:** ~40% Complete

---

## Executive Summary

SecondSense is a decision-support tool that helps users decide whether to buy products new or used by comparing prices across condition tiers and providing AI-powered recommendations.

**Current Status:**
- ✅ **Frontend**: Complete UI with mock data, all components working
- ✅ **Backend**: Infrastructure ready, product catalog matching complete
- ❌ **Integration**: Mock data only, no real API connections
- ❌ **Deployment**: Not deployed

**Remaining Work:** 2-3 weeks (14-18 days)

---

## What's Working (40% Complete)

### Frontend - Phase 2 Complete ✅
- All UI components: SearchBar, PersonalisationSliders, RecommendationDisplay
- Complete user flow: Landing → Search → Disambiguation → Preferences → Results
- State management with centralized AppState
- Mock data generation with realistic recommendations
- Animations, dark/light theme support
- 8 mock products with simulated fuzzy matching

### Backend - Phase 1 & 3 Complete ✅
- HTTP server (Gin) with CORS and health endpoint
- Full type system (all request/response schemas defined)
- 26 real products in YAML catalog (initial focus: tech/electronics)
- Module structure: `products/`, `prices/`, `recommendations/`, `shared/`
- **Product catalog search with exact and fuzzy matching**
- **Search endpoint: GET /api/products/search?q=query**
- **Handles 4 outcomes: EXACT, UNIQUE, AMBIGUOUS, NOT_FOUND**
- Environment configuration
- All unit tests passing

---

## What's Missing (60% Remaining)

### Critical Path to MVP:
1. ~~**Phase 3**: Product catalog matching - Load YAML, implement fuzzy search~~ ✅ **COMPLETE**
2. **Phase 4**: LLM integration - Price fetching + recommendation ranking + **dynamic product search**
3. **Phase 5**: Frontend-backend integration - Replace mock with real API
4. **Phase 6**: Testing & refinement
5. **Phase 7**: Deployment

### Key Architecture Decision: Hybrid Search with Smart Caching

**Philosophy:** YAML catalog is a **performance optimization**, not a requirement. The app works for any product.

**Three-Layer Search Strategy:**

1. **In-Memory Cache (Fastest - <1ms):**
   - Stores recent product validations from all sources
   - TTL: 7 days for validated products
   - Both YAML and LLM-validated products cached here
   - Zero cost, zero latency for cached items

2. **YAML Catalog (Fast - <10ms) - Optional:**
   - Pre-populated with ~26 common products
   - Includes curated aliases for better UX ("gpro superlight")
   - Enables fuzzy matching and disambiguation
   - Can be empty or removed - app still works

3. **LLM Validation (Flexible - ~2-3s):**
   - Validates any product not in cache/YAML
   - Returns canonical name for price fetching
   - Result stored in cache for 7 days
   - Handles unlimited products

**Flow Example:**
```
First search "iPhone 15":
  → Cache miss → YAML miss → LLM validates (~3s) → Cache it

Second search "iPhone 15" (same day):
  → Cache hit → Return instantly (<1ms)

Search "iphone 15 pro" (different variant):
  → Cache miss → YAML miss → LLM validates (~3s) → Cache it

Search "gpro superlight":
  → Cache/YAML hit → Return instantly (<10ms)
  → Fuzzy matching & disambiguation available
```

**Key Insight:** After initial LLM validation, products become "fast" automatically. YAML just pre-warms the cache for common searches.

---

## Phase 3: Product Catalog & Matching (2-3 days)

**Goal:** Enable backend to search the product catalog and match user queries

### Tasks:

**3.1 Load Product Catalog**
- File: `backend/src/products/product_repository.go`
- Load `products.yaml` on startup
- Parse YAML into Product structs
- Build search index (map aliases to product IDs)

**3.2 Implement Exact Match Search**
- File: `backend/src/products/product_service.go`
- Normalize query (lowercase, trim)
- Check exact match against canonical names and aliases
- Return result or continue to fuzzy matching

**3.3 Implement Fuzzy Matching**
- Add dependency: `github.com/sahilm/fuzzy`
- Score matches and return top N results
- Handle 4 outcomes: EXACT, UNIQUE, AMBIGUOUS, NOT_FOUND

**3.4 Wire into Main**
- File: `backend/src/main.go`
- Load catalog on startup
- Create product service with catalog

**Testing:**
- Exact match: "Logitech G Pro X Superlight" → finds product
- Fuzzy match: "gpro superlight" → finds product
- Disambiguation: "logitech" → returns multiple Logitech products
- Not found: "nonexistent" → returns error
- Case insensitivity works

---

## Phase 4: LLM Integration (6-8 days)

**Goal:** Implement price fetching and recommendation ranking using **Google Gemini Flash** with native web search grounding, supporting both catalog and dynamic products.

**Provider:** Google Gemini Flash (`gemini-2.0-flash`)
- Free tier: 1,500 requests/day, 1M tokens/minute
- Native grounding: Built-in web search, no tool setup required
- Go SDK: `google.golang.org/genai`
- API Key: `GEMINI_API_KEY` environment variable

### Tasks:

**4.1 Create Gemini Client**
- File: `backend/src/shared/llm_client.go` (new)
- Initialize Gemini client using `google.golang.org/genai`
- Method: `SearchWithGrounding(prompt string) (string, error)` — uses Gemini's built-in Google Search grounding for live price data
- Method: `GenerateJSON(prompt string, schema any) (string, error)` — for structured JSON output (product validation, recommendation ranking)
- Add retry logic (max 3 retries with exponential backoff)
- Add timeouts (60s for grounded searches, 15s for JSON generation)

**4.2 Implement Product Validation with Caching**
- File: `backend/src/products/product_service.go` (extend)
- Add `ValidateDynamicProduct(query string) (productName string, isValid bool, err error)`
- Check in-memory cache first (7-day TTL)
- If cache miss: call `GenerateJSON` with validation prompt
- Gemini returns `{is_valid: bool, canonical_name: string, reason: string}`
- Store result in cache regardless of valid/invalid (prevents re-calling for known-bad queries)
- Examples:
  - "iPhone 15" (first time) → Gemini validates → "Apple iPhone 15" → Cache it
  - "iPhone 15" (again) → Cache hit → Instant
  - "unicorn detector" → Gemini rejects → Cache rejection → Return error

**Validation Prompt:**
```
Is "{query}" a real consumer product with an active secondhand market?
Return JSON: {"is_valid": true/false, "canonical_name": "...", "reason": "..."}
Only mark valid if you are confident it is a real, purchasable product.
```

**4.3 Implement Price Fetching**
- File: `backend/src/prices/price_service.go`
- Accept canonical product name (from YAML catalog OR Gemini-validated dynamic product)
- Call `SearchWithGrounding` — Gemini searches Google in real time for current listings
- Parse JSON price arrays per condition tier from Gemini's response
- Validate prices: reject negatives, reject outliers (>3x median), require 3+ prices per tier

**Price Fetch Prompt:**
```
Search for current Singapore secondhand prices for "{product_name}".
Find listings from Carousell, Facebook Marketplace Singapore, and Lazada.
Return JSON:
{
  "brand_new": [price1, price2, ...],
  "like_new": [price1, price2, ...],
  "good": [price1, price2, ...],
  "well_used": [price1, price2, ...]
}
Rules: prices in SGD, active listings only, 3+ per tier, exclude outliers.
```

**4.4 Implement Recommendation Ranking**
- File: `backend/src/recommendations/recommendation_service.go`
- Calculate market stats from price arrays: avg, min, max per tier
- Calculate savings vs brand new (absolute S$ and percentage)
- Call `GenerateJSON` with stats + user preferences for ranking
- Parse into `RecommendationResponse` struct

**Ranking Prompt:**
```
Product: {canonical_name}
Market prices (SGD):
  Brand New: avg S${X}, range S${min}-{max}
  Like New:  avg S${X}, range S${min}-{max}
  Good:      avg S${X}, range S${min}-{max}
  Well Used: avg S${X}, range S${min}-{max}

User preferences (0-10 scale):
  Budget Flexibility: {n}   (0=tight, 10=very flexible)
  Condition Standards: {n}  (0=don't care, 10=pristine only)
  Hassle Tolerance: {n}     (0=willing to fix, 10=plug & play)

Rank the top 3 condition tiers for this user.
Return JSON: {
  "rankings": [
    {"rank": 1, "condition": "...", "avg_price": X, "justification": "..."},
    ...
  ],
  "reasoning": "overall explanation",
  "confidence_score": "High|Medium|Low"
}
```

**4.5 Implement Multi-Layer Caching**
- File: `backend/src/shared/cache.go` (new)
- Thread-safe in-memory cache with two TTLs:

**Product Validation Cache (7-day TTL):**
- Key: `product:{normalized_query}`
- Value: `{canonical_name, is_valid}`
- Avoids repeated Gemini validation calls for the same product

**Recommendation Cache (24-hour TTL):**
- Key: `recommendation:{normalized_name}:{fnv32(preferences)}`
- Value: Full `RecommendationResponse`
- Avoids re-fetching prices for the same product+preference combo

- LRU eviction at 10,000 entries per cache
- On server restart: cache is empty (cold start), re-warms from usage

**Testing:**
- Mock Gemini responses to test parsing without API calls
- Product validation: first search hits Gemini, repeat hits cache
- Recommendation: first search slow (~35-50s), repeat <1s
- Cache expiry: 7-day validation, 24-hour recommendations
- Error paths: Gemini timeout, malformed JSON, invalid product

---

## Phase 5: Frontend-Backend Integration (2-3 days)

**Goal:** Replace mock data with real API calls

### Tasks:

**5.1 Wire Services into HTTP Handler**
- File: `backend/src/recommendations/handlers.go`
- Update `HandleRecommendation()` to orchestrate all services:
  1. Parse request
  2. Search product catalog (Phase 3)
  3. Handle outcomes:
     - **EXACT/UNIQUE**: Use catalog product → proceed to step 5
     - **AMBIGUOUS**: Return disambiguation choices to user
     - **NOT_FOUND**: Validate as dynamic product (Phase 4.2)
       - If valid: Use validated name → proceed to step 5
       - If invalid: Return "product not recognized" error
  4. Check cache (catalog or dynamic)
  5. Fetch prices (if cache miss)
  6. Generate recommendation
  7. Cache and return result

**5.2 Update Frontend to Use Real API**
- File: `frontend/App.tsx`
- Replace `getMockRecommendation()` with real `getRecommendation()` API call
- Handle disambiguation response
- Handle errors gracefully
- Show loading states during 30-45 second price search

**5.3 Implement Marketplace Links**
- File: `frontend/lib/marketplaceLinks.ts` (new)
- Generate eBay search URLs with condition filters
- Generate Facebook Marketplace search URLs
- Open links in new tab when "Find Listings" clicked

**Testing:**
- Full flow: search → preferences → real recommendation
- Error handling: invalid product, timeout, network failure
- Disambiguation flow works
- Marketplace links open correctly
- Caching works (second search instant)

---

## Phase 6: Testing & Refinement (3-5 days)

### 6.1 Integration Testing

**Manual Test Cases:**
1. **Happy path (catalog):** Search "gpro superlight" → adjust sliders → get recommendations → click eBay link
2. **Happy path (dynamic):** Search "iPhone 15" → LLM validates → get recommendations
3. **Disambiguation:** Search "Logitech" → select from list → get recommendations
4. **Cache:** First search 30-45s → repeat search <1s (both catalog and dynamic)
5. **Errors:** Invalid product (LLM rejects), network failure, invalid input
6. **Performance:** No memory leaks after 50+ searches (mix of catalog and dynamic)

### 6.2 Prompt Optimization

**Process:**
1. Run 10 searches with various slider combinations
2. Evaluate: Does top recommendation match intuition?
3. Spot-check prices on eBay (within 10%?)
4. Adjust prompts if quality is poor
5. Document results in `PROMPT_TESTING.md`

**Metrics:**
- Recommendation accuracy (>75% match intuition)
- Price accuracy (±10% of real listings)
- Reasoning quality (clear and relevant)

### 6.3 Product Catalog Optimization (Optional)

**Goal:** Optimize catalog for most commonly searched items

**Rationale:** With dynamic product search, catalog expansion is less critical but still beneficial for:
- Faster search (<10ms vs 2-3s LLM validation)
- Lower API costs (no LLM call needed)
- Better control over aliases and categorization

**Process:**
1. Monitor usage logs to identify most searched products
2. Add top 20-30 frequently searched items to `data/products.yaml`
3. Add natural aliases based on real user queries
4. Focus on products with high search-to-conversion rate

**Recommended Categories for Catalog:**
- Popular tech/electronics (iPhone, MacBook, AirPods)
- Gaming peripherals (current focus - already 8 items)
- Mechanical keyboards (current focus - already 8 items)
- High-value items with active used markets

**Note:** This is now optional since dynamic search handles any product. Prioritize based on actual usage patterns rather than pre-planning.

---

## Phase 7: Deployment (1-2 days)

### 7.1 Backend Deployment (Fly.io)

```bash
# Install Fly CLI and deploy
fly launch
fly secrets set GEMINI_API_KEY=your_key
fly deploy
```

**Dockerfile:** Multi-stage build (golang → alpine)

### 7.2 Frontend Deployment (Vercel)

```bash
# Deploy to Vercel
npm i -g vercel
vercel deploy --prod
```

**Environment:** Set `VITE_API_BACKEND_URL` to Fly.io backend URL

### 7.3 Production Checklist
- [ ] CORS configured for production domain
- [ ] API keys in environment variables
- [ ] HTTPS enabled
- [ ] Error logging configured
- [ ] Cache TTL set to 24 hours
- [ ] README updated with deployment URLs

---

## Timeline Summary

| Phase | Tasks | Time | Status |
|-------|-------|------|--------|
| 1 | Project setup | 2 days | ✅ Complete |
| 2 | Frontend UI | 5 days | ✅ Complete |
| 3 | Product matching | 2-3 days | ✅ Complete |
| 4 | LLM integration + dynamic search | 6-8 days | ❌ Not started |
| 5 | Frontend-backend integration | 2-3 days | ❌ Not started |
| 6 | Testing & refinement | 3-5 days | ❌ Not started |
| 7 | Deployment | 1-2 days | ❌ Not started |
| **TOTAL** | **End-to-end MVP** | **21-28 days** | **~40% complete** |

**Remaining:** 15-19 days (2-3 weeks)

---

## Success Criteria (MVP Complete)

### Functionality
- [x] Frontend UI with all components
- [x] Mock data flow working
- [x] Search 26 products by name (catalog with fuzzy matching)
- [x] Fuzzy matching with disambiguation
- [ ] **Dynamic product validation (any product, not just catalog)**
- [ ] Real price fetching via LLM (30-45 seconds)
- [ ] AI-powered recommendations based on preferences
- [ ] Results cached (24 hours, <1 second on repeat)
- [ ] Marketplace links (eBay, Facebook) working
- [ ] Deployed and accessible via web

### Quality
- [ ] No crashes during normal use
- [ ] Recommendations match intuition (>75% accuracy)
- [ ] Prices match reality (±10%)
- [ ] UI responsive on desktop and mobile
- [ ] Clear error messages for edge cases

### Documentation
- [ ] README with setup instructions
- [ ] API documentation
- [ ] Deployment guide
- [ ] Product catalog explained

---

## Next Immediate Step

**Recommended:** Start with **Phase 4** (LLM Integration + Dynamic Product Search)

**What's Been Completed (Phase 3):**
- ✅ Product catalog loads on server startup (26 products)
- ✅ Exact match search working (case-insensitive, alias support)
- ✅ Fuzzy matching working (handles typos and partial queries)
- ✅ Disambiguation working (returns top 5 matches when ambiguous)
- ✅ Search endpoint: `GET /api/products/search?q=query`
- ✅ All unit tests passing
- ✅ Integration tests verified manually

**Next Steps (Phase 4):**
1. Add `google.golang.org/genai` SDK, implement Gemini client (`llm_client.go`)
2. Implement multi-layer cache (`cache.go`)
3. Extend `product_service.go` with `ValidateDynamicProduct()` using Gemini
4. Implement price fetching with Gemini grounding (`price_service.go`)
5. Implement recommendation ranking (`recommendation_service.go`)
6. Wire full pipeline in `recommendations/handlers.go`

**Provider:** Google Gemini Flash (`gemini-2.0-flash`) — free tier, native web search grounding, one SDK for all three LLM tasks.

---

## Key Files to Modify

### Phase 3:
- `backend/src/products/product_repository.go`
- `backend/src/products/product_service.go`
- `backend/src/main.go`

### Phase 4:
- `backend/src/shared/llm_client.go` (new)
- `backend/src/products/product_service.go` (extend for dynamic validation)
- `backend/src/prices/price_service.go`
- `backend/src/recommendations/recommendation_service.go`
- `backend/src/shared/cache.go` (new)

### Phase 5:
- `backend/src/recommendations/handlers.go`
- `backend/src/main.go`
- `frontend/App.tsx`
- `frontend/services/api.ts`
- `frontend/lib/marketplaceLinks.ts` (new)

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│  Frontend (React + Vite) — localhost:5173               │
│                                                          │
│  SearchBar → PersonalisationSliders → Results           │
│  (disambiguation UI if AMBIGUOUS)                        │
└────────────────────┬─────────────────────────────────────┘
                     │ POST /api/recommend
                     │ { item: "gpro superlight",
                     │   preferences: {budget: 7,
                     │                 condition: 5,
                     │                 hassle: 4} }
                     ▼
┌──────────────────────────────────────────────────────────┐
│  Backend (Go + Gin) — localhost:8080                    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Step 1: Resolve Product Name                    │  │
│  │                                                  │  │
│  │  Check cache (7-day TTL)                         │  │
│  │    ↓ miss                                        │  │
│  │  Check YAML catalog (fuzzy match)                │  │
│  │    → EXACT/UNIQUE  → canonical name              │  │
│  │    → AMBIGUOUS     → return choices to user      │  │
│  │    ↓ NOT_FOUND                                   │  │
│  │  Gemini Flash: validate product                  │  │
│  │    → valid   → canonical name + cache (7d)       │  │
│  │    → invalid → return error                      │  │
│  └──────────────────────┬───────────────────────────┘  │
│                         │ canonical name                 │
│  ┌──────────────────────▼───────────────────────────┐  │
│  │  Step 2: Check Recommendation Cache              │  │
│  │                                                  │  │
│  │  Key: {canonical_name}:{hash(preferences)}       │  │
│  │  TTL: 24 hours                                   │  │
│  │    → HIT  → return cached response               │  │
│  │    → MISS → continue                             │  │
│  └──────────────────────┬───────────────────────────┘  │
│                         │ cache miss                     │
│  ┌──────────────────────▼───────────────────────────┐  │
│  │  Step 3: Fetch Prices via Gemini Grounding       │  │
│  │                                                  │  │
│  │  Gemini Flash searches Google in real time:      │  │
│  │  eBay UK, Facebook Marketplace, CEX              │  │
│  │                                                  │  │
│  │  Returns price arrays per condition tier:        │  │
│  │    brand_new:  [£135, £130, £140]                │  │
│  │    like_new:   [£85, £92, £88]                   │  │
│  │    good:       [£68, £75, £70]                   │  │
│  │    well_used:  [£52, £58, £55]                   │  │
│  │                                                  │  │
│  │  ~25-40 seconds                                  │  │
│  └──────────────────────┬───────────────────────────┘  │
│                         │ price data                     │
│  ┌──────────────────────▼───────────────────────────┐  │
│  │  Step 4: Generate Recommendation via Gemini      │  │
│  │                                                  │  │
│  │  Input: market stats + user preferences          │  │
│  │  Gemini ranks condition tiers + writes           │  │
│  │  justifications tailored to sliders              │  │
│  │                                                  │  │
│  │  ~5-10 seconds                                   │  │
│  └──────────────────────┬───────────────────────────┘  │
│                         │ store in recommendation cache  │
│                         │ return JSON response           │
└─────────────────────────┼────────────────────────────────┘
                          ▼
             Frontend renders results:
             ranked tiers, savings, reasoning,
             market stats, "Find listings" links
```

---

## End-to-End Request Walkthrough

### Happy Path — YAML Product, First Search

```
User types: "gpro superlight"

Step 1 — Product Resolution (~0ms):
  Cache miss
  YAML fuzzy match → EXACT: "Logitech G Pro X Superlight"
  Store in cache

Step 2 — Recommendation Cache (~0ms):
  Key: "logitech g pro x superlight:7-5-4"
  Miss → proceed to price fetch

Step 3 — Price Fetch via Gemini (~30s):
  Prompt: "Search current Singapore prices for Logitech G Pro X Superlight
           across Carousell, Facebook Marketplace SG, Lazada..."
  Gemini uses Google Search grounding, returns:
  {
    "brand_new":  [134, 139, 132],
    "like_new":   [87, 91, 85],
    "good":       [70, 68, 74],
    "well_used":  [54, 58, 51]
  }

Step 4 — Recommendation (~8s):
  Stats: brand_new avg S$135, like_new avg S$88, ...
  Preferences: budget 7/10, condition 5/10, hassle 4/10
  Gemini ranks: #1 Like New, #2 Good, #3 Brand New
  Writes justification for each

Cache result for 24 hours.
Total: ~38 seconds
```

### Happy Path — Same Search, Cached

```
User types: "gpro superlight" (within 24 hours)

Step 1 — Product Resolution (~0ms):
  Cache hit → "Logitech G Pro X Superlight"

Step 2 — Recommendation Cache (~0ms):
  Key: "logitech g pro x superlight:7-5-4"
  HIT → return cached response

Total: <1 second
```

### Dynamic Product — Not in YAML

```
User types: "iPhone 15 Pro"

Step 1 — Product Resolution:
  Cache miss
  YAML miss
  Gemini validates: "Is 'iPhone 15 Pro' a real product with a used market?"
  → {"is_valid": true, "canonical_name": "Apple iPhone 15 Pro"}
  → Cache for 7 days
  Continue to Step 2...

Total (first time): ~40-50s
Total (repeat):     <1s (cache hit on product + recommendation)
```

### Disambiguation

```
User types: "logitech"

Step 1 — Product Resolution:
  Cache miss
  YAML fuzzy match → AMBIGUOUS
  Return to frontend: [Logitech G Pro X Superlight, Logitech G502 X]

Frontend shows disambiguation UI.
User selects → re-submits with specific product name.
```

### Invalid Product

```
User types: "banana slicer 3000"

Step 1 — Product Resolution:
  Cache miss
  YAML miss
  Gemini validates → {"is_valid": false, "reason": "Not a consumer product with a used market"}
  Cache rejection for 7 days
  Return error: "We couldn't find this product"

Total: ~3s (first time), <1s (cached rejection)
```

---

## Gemini Flash Integration Details

**Model:** `gemini-2.0-flash`
**Go SDK:** `google.golang.org/genai`
**Free Tier:** 1,500 requests/day, 1M tokens/minute

**Two usage modes:**

**1. Grounded Search (price fetching)**
- Enables `GoogleSearchRetrieval` tool in Gemini
- Gemini searches Google in real time
- Returns prices from live Carousell/Facebook Marketplace SG/Lazada listings
- Used only for Step 3 (price fetching)

**2. Structured JSON generation (validation + ranking)**
- Standard generation with JSON response schema enforced
- No web access needed — pure reasoning
- Used for Step 1 (validation) and Step 4 (ranking)

**Why Gemini Flash over alternatives:**
- Only free provider with native web search grounding
- No tool setup overhead — grounding is a single flag
- 1,500 req/day free covers ~750 full searches/day (2 calls each)
- Consistent structured JSON output with schema enforcement

---

## Future Enhancements (Post-MVP Good-to-Haves)

- **Multi-provider LLM support:** Allow users to supply their own `ANTHROPIC_API_KEY` (Claude) or `OPENAI_API_KEY` (GPT-4) as an alternative to Gemini. Config fields and `.env.example` are already commented with placeholder references.
- **Persistent cache:** Replace in-memory cache with Redis for cache survival across server restarts.
- **More marketplaces:** Expand Singapore coverage to Shopee, HardwareZone classifieds.
- **User accounts:** Save search history and preferences across sessions.

---

## Questions?

- See [CLAUDE.md](CLAUDE.md) for development guidelines
- See [secondsens.md](secondsens.md) for the original PRD
- See [ARCHITECTURE_DECISION.md](ARCHITECTURE_DECISION.md) for hybrid search rationale
