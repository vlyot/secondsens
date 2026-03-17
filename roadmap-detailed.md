# SecondSense — Detailed Roadmap

> Goal: Complete the app incrementally, keeping all hosting and API costs at $0.

---

## Phase 1 — Polish & Fix ✅

---

## Phase 2 — UX Improvements ✅

---

## Phase 4 — Long Term Features

### 4.1 User Profiles & Personal History

**Goal:** Let returning users see their past searches and re-run them without re-entering preferences.

**Infrastructure:** Supabase free tier (already connected via MCP)

**Database schema:**
```
users         — managed by Supabase Auth (email/OAuth)
user_searches — id, user_id (fk), product_name, preferences (jsonb), recommendation (jsonb), created_at
```

**Backend changes (`backend/src/`):**
- Add Supabase client initialisation using `SUPABASE_URL` + `SUPABASE_ANON_KEY` env vars
- Add JWT validation middleware that reads the Supabase auth token from `Authorization: Bearer` header
- New routes:
  - `POST /api/history` — saves a recommendation (called after successful `/api/recommend`)
  - `GET /api/history` — returns the authenticated user's last 20 searches, newest first

**Frontend changes:**
- Add Supabase JS client (`@supabase/supabase-js`) to the frontend
- Auth flow: email magic link or Google OAuth (Supabase handles this out of the box)
- New `HistoryPage.tsx`: grid of past search cards, each showing product name, date, and verdict badge
- Clicking a history card re-runs the recommendation with the saved preferences
- Auth state stored in React context, token passed with every API request
- NavBar "History" link becomes active once auth is wired up

---

### 4.2 Shared Cross-User Search Cache

**Goal:** If User A searches "Logitech G Pro X" with a given set of preferences, and User B searches the same within 2 weeks, return the cached result instantly — 0 LLM calls.

**Infrastructure:** Supabase (same project as 4.1, or standalone if auth not yet done)

**Database schema:**
```
search_cache — id, product_name (text), preferences_hash (text), recommendation (jsonb), fetched_at (timestamptz)
  UNIQUE constraint on (product_name, preferences_hash)
```

**How the hash works:**
- On the backend, deterministically serialize the `Preferences` struct to a canonical JSON string (sorted keys), then SHA-256 hash it
- This ensures that two users with identical slider values produce identical cache keys

**Request flow:**
1. Receive `/api/recommend` request
2. Compute `preferences_hash`
3. Query Supabase: `SELECT * FROM search_cache WHERE product_name = $1 AND preferences_hash = $2 AND fetched_at > NOW() - INTERVAL '14 days'`
4. **Cache hit** → return `recommendation` JSON directly, add `"cached": true, "cached_at": "<date>"` to response
5. **Cache miss** → run full Gemini pipeline → upsert result into `search_cache` → return to user

**TTL strategy:**
- Default TTL: **14 days** (electronics prices shift faster than furniture)
- Future enhancement: per-category TTL based on product type tag

**Frontend changes:**
- Results page shows a subtle "Prices sourced X days ago · Refresh" label when `cached: true`
- "Refresh" button forces a cache-bypass by passing `?force_refresh=true` to the API
- No auth required — cache benefits all users anonymously

**Fallback:** If Supabase is unreachable, skip cache check entirely and run live. Log the miss for monitoring.

#### 4.2.1 Cache-Backed Smart Search Suggestions

**Goal:** Surface popular/recently-searched product names as autocomplete suggestions, sourced from the shared `search_cache` table — making suggestions smarter over time without any extra infrastructure.

**Backend:**
- Add `GET /api/products/popular` route that queries Supabase for distinct `product_name` values from `search_cache` where `fetched_at > NOW() - INTERVAL '30 days'`, ordered by recency, capped at 50 results
- No schema changes needed — reads directly from the existing `search_cache` table

**Frontend (`SearchBar`):**
- On mount, fetch both `/api/products` (static catalog) and `/api/products/popular` (cache-sourced) in parallel
- Merge results: cache-sourced names first, then static catalog, deduped
- Cache-sourced suggestions show a small clock icon or "popular" indicator so users know these are real searches others have run
- Falls back silently to catalog-only if the popular endpoint is unreachable

**Why it matters:** Surfaces dynamic products (not in the YAML catalog) that real users have successfully searched before. Self-improving — more usage = smarter suggestions. Zero additional Gemini cost.

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
