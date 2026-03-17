# SecondSense — Detailed Roadmap

> Goal: Complete the app incrementally, keeping all hosting and API costs at $0.

---

## Phase 1 — Polish & Fix ✅

### 1.1 Price Validation
**File:** `backend/src/prices/price_service.go`

After the LLM returns condition tier prices, a sorting/clamping pass must enforce the invariant:
`Brand New ≥ Like New ≥ Good ≥ Well Used`

**Implementation:**
- After parsing the four price values from the LLM JSON response, run a descending sort pass
- For each adjacent pair where lower tier > upper tier, cap the lower tier at the upper tier's value
- Apply to both `min_price` and `max_price` fields independently
- Add a unit test with a deliberately inverted price set to confirm the clamp works

**Why this matters:** Without this, the results card can show "Well Used" costing more than "Like New", which completely undermines user trust in the recommendation.

---

### 1.2 Use Frequency Wording
**Files:** `frontend/components/PersonalisationSliders.tsx`, `frontend/lib/constants.ts`

The internal enum values (`occasional`, `regular`, `daily_driver`) are fine to keep — only the display labels need updating.

**Changes:**
- `occasional` → label: **"Occasionally"**
- `regular` → label: **"Sometimes"**
- `daily_driver` → label: **"Daily"**

Also review the tooltip copy for each option to make sure the explanation matches the new label tone. Default preference in `constants.ts` stays as `regular` (maps to "Sometimes").

---

### 1.3 Recommendation Verdict Prominence
**File:** `frontend/components/RecommendationDisplay.tsx`

Currently the verdict is inline text with `font-semibold`. It should be the dominant visual element.

**Changes:**
- Replace the `<Large>` verdict line with a dedicated verdict banner at the very top of the results card
- Use a large `<H2>` or `<Display>` component with a colored background pill/badge
- Green background for "Buy Secondhand", neutral/blue for "Buy Brand New"
- Secondary line below in `<Muted>`: "Based on your preferences and current market prices"
- The confidence score meter should sit directly beneath this banner

---

## Phase 2 — UX Improvements ✅

### 2.1 Preference Presets
**File:** `frontend/components/PersonalisationSliders.tsx`, `frontend/lib/constants.ts`

Add a preset selector row above the sliders so users can fill everything in one tap.

**Presets to define in `constants.ts`:**
- **"Budget First"** — budget_flexibility: 2, quality_priority: 3, risk_tolerance: 7, use_frequency: occasional, deal_urgency: no_rush, resale_priority: maybe
- **"Quality First"** — budget_flexibility: 8, quality_priority: 9, risk_tolerance: 2, use_frequency: daily, deal_urgency: soon, resale_priority: keeping
- **"Need It Now"** — budget_flexibility: 6, quality_priority: 5, risk_tolerance: 4, use_frequency: regular, deal_urgency: need_it_now, resale_priority: maybe
- **"Just Browsing"** — budget_flexibility: 5, quality_priority: 5, risk_tolerance: 5, use_frequency: occasional, deal_urgency: no_rush, resale_priority: definitely_reselling

**UI:** A row of 4 pill buttons above the sliders. Clicking one calls `onPreferencesChange` with the full preset object. Active preset highlights. Manually adjusting any slider after selecting a preset deselects it (no active preset shown).

---

### 2.2 Condition Tier Visualization
**File:** `frontend/components/RecommendationDisplay.tsx`

Replace the raw market stats number table with a visual price bar chart.

**Implementation:**
- Use shadcn `Progress` component (already installed) for each condition tier bar
- Scale each bar relative to Brand New price (Brand New = 100% width, others proportional)
- Color coding: Brand New = stone/neutral, Like New = blue, Good = green, Well Used = amber
- Show the price range as text to the right of each bar: e.g. `$45 – $80`
- Highlight the recommended tier with a subtle ring or bold label
- Animate bars in on mount using Framer Motion (stagger, already set up via `variants.ts`)

---

### 2.3 Search Autocomplete
**Backend file:** `backend/src/main.go` + products module handler
**Frontend file:** `frontend/components/SearchBar.tsx`

**Backend changes:**
- Add `GET /api/products` route that returns the full product catalog as a JSON array of strings
- No LLM call — just reads the in-memory product list directly
- Add CORS header to match existing `/api/recommend` setup

**Frontend changes:**
- On `SearchBar` mount, fetch `/api/products` and store in local state
- Replace the plain `Input` with a shadcn `Command` (Combobox) component
- Filter the list client-side as the user types (case-insensitive substring match)
- Selecting a suggestion fills the input and auto-advances to the sliders step
- If the fetch fails (backend down), fall back silently to plain text input — no error shown

---

### 2.4 Share / Export Results
**Files:** `frontend/App.tsx`, `frontend/pages/ResultsPage.tsx`

Allow users to share or bookmark a specific recommendation.

**Implementation:**
- When results are displayed, serialize `{ product: string, preferences: Preferences }` to a base64 URL-safe string and push it to `window.history.replaceState` as a `?s=<encoded>` query param
- On app load, check for `?s=` param — if present, decode and automatically run the recommendation (showing a loading state)
- Add a "Copy Link" button on the results page that writes `window.location.href` to clipboard and shows a brief "Copied!" toast (use shadcn `Sonner` toast if available, otherwise a simple inline state change)
- No backend changes needed — all state is encoded client-side

---

## Phase 3 — Documentation & Mobile ✅

### 3.1 "Learn How It Works" Documentation Page
**Files:** New `frontend/pages/DocsPage.tsx`, `frontend/App.tsx`

The "Learn How It Works" button already exists in `Landing.tsx` with an `onExplore` prop — it just isn't wired to anything yet. This phase wires it to a dedicated documentation page.

**What the page covers (no source code, no IP leakage):**
- **What is SecondSense?** — A brief, plain-English description of the app's purpose: helping users decide whether to buy a product brand new or secondhand using AI-powered market analysis.
- **Motivation** — Why it was built: the secondhand market is fragmented, prices vary wildly by condition, and most people don't know if they're getting a fair deal. SecondSense removes that guesswork.
- **How it works (user-facing steps):**
  1. Search for a product by name
  2. Tune your preferences (budget sensitivity, quality expectations, urgency, etc.)
  3. SecondSense analyses current market prices across condition tiers
  4. You receive a ranked recommendation with reasoning and savings breakdown
- **Tech stack (high-level, no architecture details):**
  - Frontend: React + TypeScript, modern component library
  - Backend: Go API server
  - AI: Google Gemini with live web search for real-time price data
  - Marketplace coverage: Carousell SG, Facebook Marketplace SG, Lazada SG
- **Preference sliders explained** — Plain-English explanation of what each of the 6 preference dimensions means and how they influence the recommendation (no algorithm details, just user-facing meaning)
- **Condition tiers explained** — What "Brand New", "Like New", "Good", and "Well Used" mean in the context of a recommendation
- **FAQ section** — e.g. "Is this free?", "How current are the prices?", "What products are supported?", "How is my recommendation calculated?"
- **Limitations & disclaimers** — Prices are estimates, not guarantees; always verify before purchasing; AI can make mistakes

**UI approach:**
- Full-page layout with `BackgroundLayout` (same as landing) or a clean white/dark card layout
- Use the existing typography system: `H2`, `H3`, `P`, `Lead`, `Muted` — no raw HTML
- Sections separated by `<Separator>` (shadcn, already installed or easy to add)
- A "Back to Home" button at the top-left using the existing `Button` component
- No external links to source code, GitHub, or any internal tooling
- Page is entirely static — no API calls, no auth required

**Wiring in `App.tsx`:**
- Add `'docs'` to the `AppStep` type union
- `onExplore` callback in `LandingPage` sets step to `'docs'`
- `DocsPage` receives an `onBack` prop that resets step to `'landing'`
- No router needed — fits the existing step-machine pattern

---

### 3.2 Mobile Polish Pass
**Files:** `frontend/components/PersonalisationSliders.tsx`, `frontend/components/ProductDisambiguation.tsx`, `frontend/pages/ResultsPage.tsx`

**Specific fixes:**
- Sliders: add `touch-action: none` CSS and increase thumb hit area to ≥ 44×44px via Tailwind padding
- Disambiguation modal: wrap content in a scrollable `max-h-[80vh] overflow-y-auto` div
- Results card: audit all fixed widths — replace with `w-full max-w-*` patterns
- Preset buttons (from 2.1): ensure they wrap gracefully on narrow screens (use `flex-wrap`)
- DocsPage (from 3.1): verify readable line length on mobile — cap prose width at `max-w-prose`
- Test viewport: 375px (iPhone SE), 390px (iPhone 15), 412px (Android mid-range)

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
