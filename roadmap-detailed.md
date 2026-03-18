# SecondSense — Detailed Roadmap

> Goal: Complete the app incrementally, keeping all hosting and API costs at $0.

---

## Phase 1 — Polish & Fix ✅

---

## Phase 2 — UX Improvements ✅

---

## Phase 4 — Long Term Features

### 4.1 User Profiles & Personal History ✅

---

### 4.2 Shared Cross-User Search Cache ✅


#### 4.2.1 Cache-Backed Smart Search Suggestions

---

### 4.3 Real Marketplace Pricing

**Goal:** Replace LLM-estimated prices with real sold-listing data where available.

**eBay Browse API (free, read-only, no billing required for basic search):**
- Register for an eBay Developer account → get `App ID` (Client ID)
- Use `GET /buy/browse/v1/item_summary/search?q={product}&filter=conditionIds:{condition}`
- Map eBay condition IDs: 1000 = New, 2500 = Like New, 3000 = Good, 5000 = Used
- Extract `currentBidPrice` or `price` from results, compute min/max across top 10 listings
- Cache eBay results in the existing in-memory cache (24h TTL) to avoid hammering the API

**Integration approach:**
- Create `backend/src/prices/ebay_client.go`
- In `price_service.go`, try eBay first; fall back to Gemini search if eBay returns < 3 results
- eBay covers UK/US markets well; Gemini grounded search continues to cover SG (Carousell/Facebook)

**Frontend:** No changes needed — the response shape is identical. The results will just have tighter, more accurate price ranges.

---

### 4.4 Product Images

**Goal:** Show a product thumbnail in the disambiguation panel and results card so users can visually confirm they have the right item.

**Approach — Open Graph scrape (free, no API key):**
- When a product is confirmed, the backend fetches the first Google Shopping result URL for the product
- Extracts the `og:image` meta tag from the HTML response
- Returns the image URL alongside the product data
- cache images in the db, can fuzzy search images, meaning the name doesnt have to be 1:1 to show the image, i will accept some level of inaccuracy here.

**Alternative — Google Custom Search JSON API (free: 100 queries/day):**
- More reliable but has a daily cap
- Suitable for a personal-use app at low volume

**Implementation:**
- Backend: new `GET /api/product-image?q={product}` endpoint
- Frontend: `RecommendationDisplay.tsx` and `ProductDisambiguation.tsx` call this endpoint on mount
- Display as a 48×48px rounded thumbnail with `object-cover`
- On error or timeout (>2s), show a FontAwesome `fa-box` placeholder icon — never block the UI

---

### 4.5 Batch / Compare Mode

**Goal:** Let users compare two products side-by-side using the same preference set.

**UI flow:**
- On the search page, add a "+ Compare" button that reveals a second search input
- Both products go through disambiguation independently if needed
- Preferences page is shared — one set of sliders applies to both
- Results page splits into two columns: left product vs right product
- Each column has its own verdict banner, price bars, and marketplace links
- A summary row at the bottom: "For your preferences, [Product A] is the better buy" based on whichever has higher confidence

**Backend changes:**
- Extend `/api/recommend` to accept an optional `compare_product` field
- If present, run two recommendation pipelines (can be goroutines in parallel)
- Return both results in a single response: `{ primary: {...}, compare: {...} }`
- Both results benefit from the shared cache (Phase 4.2) independently

**Frontend changes:**
- `App.tsx` state machine adds optional `compareProduct` and `compareRecommendation` fields
- `ResultsPage.tsx` conditionally renders single or dual column layout
- On mobile, dual column stacks vertically

---
### 5 - Getting ready for release to public
- suggest final features to polish and optimize the app
- give instructions on how to prepare env and secrets
- will host on vercel
---
## Staying Free — Full Cost Table

| Service | Usage | Free Tier Limit | Risk |
|---|---|---|---|
| Gemini 2.5 Flash | 2–4 calls per recommendation | 1,500 req/day, 15 req/min | Low — cache reduces real calls |
| Vercel | Frontend static hosting | Unlimited on hobby plan | None |
| Railway / Fly.io | Go backend | ~$0 at <1000 req/day | Low |
| Supabase | DB + Auth | 500MB storage, 50,000 MAU | None at personal scale |
| eBay Browse API | Price lookups | 5,000 calls/day | None |
| Google Custom Search | Product images (opt.) | 100 queries/day | Low — cache images aggressively |

**Rate limiting recommendation:** Add a simple IP-based rate limiter middleware on the Go backend — max 1 recommendation request per 10 seconds per IP. This prevents any single user (or bot) from draining the Gemini free tier. Implementation: in-memory token bucket per IP, ~10 lines of Go.
