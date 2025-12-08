# SecondSense: Decision-Support Tool for New vs. Used Purchases

## Project Overview

**Version:** 0.1 (Personal Project / Proof of Concept)  
**Last Updated:** December 2024  
**Status:** Pre-implementation / Ideation Phase

### Executive Summary

SecondSense is a lightweight web application that helps consumers make informed decisions when purchasing items by comparing prices across different condition tiers (brand new, like new, good, well used) and providing personalised recommendations based on user preferences.

Unlike traditional price comparison tools that only show new item prices, SecondSense analyses the entire market spectrum and uses LLM reasoning to recommend the optimal condition tier based on the user's budget flexibility, condition standards, and hassle tolerance.

**Core Value Proposition:** Answer the question "Should I buy this new or used?" with confidence, backed by real market data and personalised reasoning.

### Problem Statement

Consumers frequently face decision paralysis when choosing between new and used items:
- **Analysis paralysis:** Uncertain whether the used discount justifies potential risks
- **Information asymmetry:** Don't know what "good" used prices actually are
- **Subjective trade-offs:** Struggle to weight personal preferences (budget vs. condition vs. convenience) against market realities
- **Time cost:** Manually searching across multiple marketplaces and condition tiers is tedious

**What exists today:**
- Price trackers for new items only (CamelCamelCamel, Honey)
- Marketplace searches requiring manual condition filtering
- No tools that reason about trade-offs or provide recommendations

**What's missing:**
A simple tool that aggregates prices across conditions, understands personal preferences, and provides a clear recommendation with justification.

---

## User Flow (Three-Step Process)

```
┌─────────────┐      ┌──────────────┐      ┌──────────────┐
│   Search    │  →   │ Personalise  │  →   │    Result    │
│   (Item)    │      │  (Sliders)   │      │  (Ranking)   │
└─────────────┘      └──────────────┘      └──────────────┘
```

### Step 1: Item Search

**User Input:**
- Free-text search box: "gaming mouse", "logitech g pro x superlight", "razer deathadder v3"

**System Behaviour:**
- If query is specific enough (matches known product) → Proceed to Step 2
- If query is ambiguous → Show disambiguation menu

**Disambiguation UI:**
```
We found several options. Which one?

🖱️ Logitech G Pro X Superlight [Most Popular]
🖱️ Logitech G Pro Wireless
🖱️ Logitech G502 X
⋮
[Show more] or [Be more specific]
```

**Implementation Notes:**
- Start with a curated catalogue of ~50 popular gaming peripherals
- Expand catalogue based on actual user searches (personal use will guide this)
- Use fuzzy matching for common typos/abbreviations
- Model numbers should map to canonical product names

---

### Step 2: Personalisation Sliders

Three sliders that capture the user's preferences on a 0-10 scale:

#### Slider 1: Budget Flexibility
```
How flexible is your budget?
[💰━━━━━━━━━━━━━━━━━━━━━━🤑]
 Tight Budget          Flexible
```
- **Low (0-3):** Price is the primary concern. Willing to compromise on other factors for savings.
- **Medium (4-6):** Balanced approach. Price matters but not at the expense of quality/convenience.
- **High (7-10):** Money is less of a constraint. Willing to pay premium for other benefits.

#### Slider 2: Condition Standards
```
How perfect does it need to look?
[📦━━━━━━━━━━━━━━━━━━━━━━✨]
 Don't Care            Pristine
```
- **Low (0-3):** Comfortable with visible wear, scratches, scuffs. Function over form.
- **Medium (4-6):** Minor wear acceptable but wants good overall appearance.
- **High (7-10):** Wants item to look new or near-new. Appearance matters significantly.

#### Slider 3: Hassle Tolerance
```
How much hassle can you handle?
[🛠️━━━━━━━━━━━━━━━━━━━━━━😴]
 I'll Fix It        Plug & Play
```
- **Low (0-3):** Willing to deal with potential issues, repairs, seller communication. DIY mindset.
- **Medium (4-6):** Some hassle acceptable but prefers straightforward transactions.
- **High (7-10):** Values convenience, warranties, and peace of mind. Wants it to "just work."

**UI/UX Considerations:**
- Sliders should have visual feedback (emoji changes, colour gradients)
- Default all sliders to 5 (middle position) on first load
- Show brief tooltip on hover explaining what each slider affects
- Keep this screen clean—three sliders, one "Get Recommendation" button, nothing else

---

### Step 3: Recommendation Output

The system displays a ranked list of the top 3 condition options with clear justification.

```
┌───────────────────────────────────────────────┐
│  🎯 Your Best Options (Ranked)                 │
│                                                │
│  🥇 LIKE NEW - £89                             │
│     💰 Save £46 (34%) vs. new                  │
│     ───────────────────────────────────────    │
│     Best value for your preferences. You get   │
│     essentially mint condition at a significant│
│     discount, hitting the sweet spot between   │
│     price and quality.                         │
│                                                │
│  🥈 GOOD - £72                                 │
│     💰 Save £63 (47%) vs. new                  │
│     ───────────────────────────────────────    │
│     Maximum savings if you can accept minor    │
│     cosmetic wear. Functionally identical to   │
│     new, just shows use.                       │
│                                                │
│  🥉 BRAND NEW - £135                           │
│     💰 No savings (baseline)                   │
│     ───────────────────────────────────────    │
│     Full warranty and pristine condition.      │
│     Worth it if peace of mind matters more     │
│     than the £46 premium.                      │
│                                                │
│  💡 Why This Ranking?                          │
│  Your moderate condition standards and budget  │
│  consciousness make Like New the optimal       │
│  choice. You save substantially while getting  │
│  near-pristine quality.                        │
│                                                │
│  📊 Market Overview:                           │
│  • Brand New:    £135 avg (£130-£140 range)   │
│  • Like New:     £89 avg  (£85-£95 range)     │
│  • Good:         £72 avg  (£68-£78 range)     │
│  • Well Used:    £58 avg  (£52-£65 range)     │
│                                                │
│  Confidence: High ✓                            │
│  (Based on stable pricing and good availability)│
│                                                │
│  [🔍 Find Like New listings]  [Try another item]│
└───────────────────────────────────────────────┘
```

**Key Output Elements:**

1. **Ranked Options (Top 3):**
   - Condition name (clearly labelled)
   - Average price
   - Savings vs. new (absolute £ and percentage)
   - 2-3 sentence justification

2. **Overall Reasoning:**
   - Synthesises why the #1 option is best given user's slider inputs
   - Mentions key trade-offs (price vs. condition vs. convenience)

3. **Market Stats:**
   - Average prices for each condition tier
   - Price ranges (helps user understand variability)
   - Shows completeness of data

4. **Confidence Score:**
   - High: Stable pricing, good data availability, clear winner
   - Medium: Some price volatility or close rankings
   - Low: Limited data or very tight price clustering

5. **Call-to-Action:**
   - "Find [Condition] listings" → Opens pre-filtered marketplace search
   - "Try another item" → Returns to search

---

## Technical Architecture

### High-Level System Design

```
┌─────────────┐
│   Frontend  │ (React/HTML)
│   - Search  │
│   - Sliders │
│   - Results │
└──────┬──────┘
       │
       │ HTTP POST /api/recommend
       ↓
┌─────────────────────────┐
│   Backend (FastAPI)     │
│   ┌─────────────────┐   │
│   │ Price Search    │   │
│   │   Module        │   │
│   └────────┬────────┘   │
│            ↓             │
│   ┌─────────────────┐   │
│   │ LLM Reasoning   │   │
│   │   Module        │   │
│   └────────┬────────┘   │
│            ↓             │
│   ┌─────────────────┐   │
│   │ Response        │   │
│   │   Formatter     │   │
│   └─────────────────┘   │
└─────────────────────────┘
       │
       │ External API Calls
       ↓
┌─────────────────────────┐
│  External Services      │
│  - LLM API (GPT/Claude) │
│  - Web Search (optional)│
│  - Marketplace APIs     │
└─────────────────────────┘
```

### Component Breakdown

#### 1. Frontend (User Interface)

**Technology Options:**
- **Option A (Simplest):** Vanilla HTML/CSS/JavaScript
- **Option B (Recommended):** React.js with Vite
- **Option C (Rapid Prototyping):** Streamlit (Python-based)

**Recommendation:** **React + Vite** for balance of simplicity and maintainability.

**Key Components:**
```
src/
├── components/
│   ├── SearchBar.jsx          # Item search input
│   ├── ProductDisambiguation.jsx  # Product selection if ambiguous
│   ├── PersonalisationSliders.jsx # Three preference sliders
│   ├── RecommendationDisplay.jsx  # Ranked results output
│   └── LoadingState.jsx       # Loading indicator during API call
├── App.jsx                    # Main application component
├── api.js                     # API client for backend calls
└── main.jsx                   # Entry point
```

**State Management:**
- Simple React hooks (useState, useEffect) sufficient for MVP
- No need for Redux/Zustand at this scale

**UI Framework:**
- **Tailwind CSS** (utility-first, fast iteration) or
- **shadcn/ui** (pre-built components, React) or
- **Vanilla CSS** (no dependencies, full control)

**Recommendation:** Tailwind CSS for speed of development.

---

#### 2. Backend (Business Logic)

**Technology:** **Go (Golang)** *(Updated recommendation)*

**Why Go:**
- **Excellent concurrency** - Goroutines make parallel price searches across marketplaces trivial
- **Fast development** - Simpler than Rust, faster than Python for this use case
- **Single binary deployment** - Easy deployment, no dependency management
- **Great web frameworks** - Fiber, Gin, or Chi for production-ready APIs
- **Mature LLM libraries** - Good SDKs for OpenAI, Anthropic, and other providers
- **Lower resource usage** - Better performance per dollar on cloud platforms

**Alternative Considered:**
- **Rust**: Maximum performance but steeper learning curve, slower iteration for MVP
- **Python + FastAPI**: Easier initially but slower runtime, higher memory usage
- **Node.js + Express**: Good option if team prefers JavaScript ecosystem

**Recommendation:** Go balances development speed with runtime performance, perfect for an MVP that makes concurrent API calls.

**Project Structure (Go):**
```
backend/
├── main.go                    # Entry point, server setup
├── go.mod                     # Go module definition
├── go.sum                     # Dependency checksums
├── handlers/
│   └── recommendation.go      # HTTP handlers for /api/recommend
├── services/
│   ├── price_search.go        # Price aggregation logic
│   ├── llm_client.go          # LLM API integration
│   └── product_catalog.go     # Product database/matching
├── models/
│   └── types.go               # Request/response structs
├── config/
│   └── config.go              # Environment variables, API keys
└── README.md                  # Setup instructions
```


---

#### 3. Price Search Module

This is the core data aggregation component. Two implementation approaches:

##### Approach A: LLM-Powered Web Search (MVP Recommendation)

**How It Works:**
1. Send prompt to LLM with web search capability (Claude, GPT-4, Perplexity)
2. LLM searches web for prices across conditions
3. LLM returns structured JSON with price lists

**Pros:**
- ✅ Fastest to implement (30-60 minutes)
- ✅ Works across any product without custom scraping
- ✅ LLM can interpret ambiguous listings (e.g., "barely used" → like_new)
- ✅ Handles dynamic marketplace changes automatically

**Cons:**
- ❌ Slower (20-40 seconds per search)
- ❌ Higher cost per query (~£0.10-0.15)
- ❌ Potential for hallucinated prices (though rare with web search tools)
- ❌ Less control over data sources

**Mitigation for Cons:**
- Cache results (same item shouldn't be re-searched within 6 hours)
- Add validation (reject prices >2x or <0.5x median)
- Budget for ~100 searches/month = £10-15

---

##### Approach B: Dedicated Web Scraping (Production Version)

**How It Works:**
1. Build scrapers for specific marketplaces
2. Use APIs where available (eBay API, Amazon Product API)
3. Scrape where APIs don't exist (Facebook Marketplace, CeX)

**Tools/Libraries:**
- **httpx** (async HTTP client)
- **BeautifulSoup4** (HTML parsing)
- **Playwright** (for JS-heavy sites like Facebook Marketplace)
- **eBay Finding API** (free tier: 5,000 calls/day)
- **Rainforest API** (paid Amazon scraper, ~£0.005/request)
- **ScraperAPI** (proxy rotation, handles anti-bot, ~£0.001/request)

**Pros:**
- ✅ Faster (2-5 seconds per search)
- ✅ More reliable data structure
- ✅ Lower cost at scale (~£0.01-0.02/search)
- ✅ Full control over data sources

**Cons:**
- ❌ Significant development time (2-4 weeks for robust scrapers)
- ❌ Fragile (site structure changes break scrapers)
- ❌ Maintenance burden (monitor and fix broken scrapers)
- ❌ Legal considerations (respect ToS, rate limiting)

**Recommendation:** **Start with Approach A** (LLM search) for MVP. Migrate to Approach B only if:
- You're doing >500 searches/month (cost becomes material)
- Speed becomes a user complaint
- Accuracy issues emerge

---

#### 4. LLM Reasoning Module

This component takes price data + user preferences and generates the ranked recommendation.

**Key Design Decisions:**

1. **Structured Output (JSON):**
   - Easier to parse and display
   - Reduces parsing errors
   - Specify exact schema in prompt

2. **Explicit Preference Mapping:**
   - Tell LLM exactly how to interpret each slider value
   - Reduces ambiguity and inconsistent recommendations

3. **Price Data Included:**
   - LLM sees actual numbers, not just user input
   - Enables data-driven reasoning (e.g., "only £5 more for Like New vs Good")

4. **Confidence Scoring:**
   - Helps user calibrate trust in recommendation
   - Based on objective metrics (price variance, sample size)

---

#### 5. Product Catalogue

For MVP, maintain a simple JSON/YAML catalogue of known products:

```yaml
# products.yaml

- id: logitech_gpro_x_superlight
  name: "Logitech G Pro X Superlight"
  aliases:
    - "gpro superlight"
    - "g pro x sl"
    - "910-005878"  # Model/SKU number
  category: gaming_mouse
  
- id: razer_deathadder_v3
  name: "Razer DeathAdder V3"
  aliases:
    - "deathadder v3"
    - "deathadder 3"
  category: gaming_mouse

- id: logitech_g502_x
  name: "Logitech G502 X"
  aliases:
    - "g502x"
    - "g502 x"
  category: gaming_mouse

# ... 50-100 products initially
```
**Growing the Catalogue:**
- Start with 20-30 products you personally want to buy
- Add products as users search for them
- Track unmatched queries to identify gaps
- Eventually: Use LLM to suggest canonical product name from query

---

### Data Flow (Complete Request Lifecycle)

```
1. User submits search + sliders
   ↓
2. Frontend sends POST /api/recommend
   {
     "item": "logitech g pro x superlight",
     "preferences": {budget: 7, condition: 6, hassle: 3}
   }
   ↓
3. Backend: Match product in catalogue
   → "Logitech G Pro X Superlight" (canonical name)
   ↓
4. Backend: Check cache
   → Cache miss (or expired) → proceed
   → Cache hit → return cached result
   ↓
5. Backend: Call price_search module
   → LLM searches web (20-30 seconds)
   → Returns price arrays for each condition
   ↓
6. Backend: Calculate price statistics
   → Averages, min/max, std deviation
   ↓
7. Backend: Call LLM reasoning module
   → Generate ranked recommendations (5-10 seconds)
   → Parse JSON response
   ↓
8. Backend: Cache result (6 hour TTL)
   ↓
9. Backend: Return JSON response to frontend
   ↓
10. Frontend: Render RecommendationDisplay component
    → Show rankings, reasoning, stats
```

**Total Latency:** 30-45 seconds for first search, <1 second for cached results.

---

### Caching Strategy

Critical for cost reduction and speed:

**Cache Invalidation:**
- TTL: 24 hours (balances freshness vs. cost)
- Manual: Add "Refresh prices" button in UI
- Scheduled: Clear cache weeklu at midnight (optional)

**Why 24 hours:**
- Used prices don't fluctuate minute-to-minute
- Reduces API costs dramatically (same item searched multiple times)
- Still fresh enough for purchasing decisions

---

## Tech Stack Recommendations

### MVP (Weeks 1-4)

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Frontend** | React + Vite + Tailwind CSS + shadcn/ui | Fast development, modern tooling, beautiful components |
| **Backend** | **Go 1.21+** | Excellent concurrency, fast, single binary deployment |
| **LLM (Primary)** | **Google Gemini 2.0 Flash** or **Groq** (free tiers) | FREE up to 1500 req/day, good reasoning quality |
| **LLM (Reasoning)** | **Groq Llama 3.1 70B** (free) or **Gemini Flash** | Free tier, fast inference, good for ranking logic |
| **Price Search** | LLM web search (Gemini) + eBay API (5k/day free) | Fastest to implement, free tier generous |
| **Cache** | **Upstash Redis** (10k commands/day free) | Free tier sufficient, fast, persistent cache |
| **Hosting (Frontend)** | **Cloudflare Pages** or Vercel | Unlimited bandwidth (CF) vs 100GB (Vercel) |
| **Hosting (Backend)** | **Fly.io** (3 VMs free) or **Cloudflare Workers** | Better free tier than Render, global edge |
| **Version Control** | Git + GitHub | Standard, enables collaboration |

**Development Environment:**
- Node.js 20+ (for frontend)
- Go 1.21+ (for backend)
- VS Code (recommended IDE) with Go extension

**Package Management:**
- npm/pnpm (frontend)
- go mod (backend)

**Cost Optimization:**
- All services using FREE tiers
- Estimated cost: **$0-5/month** for 100-200 searches
- vs. original estimate of £7-15/month for 50 searches

---

### Production-Ready (Post-MVP, Optional)

| Component | Upgrade Path | Why Upgrade |
|-----------|-------------|-------------|
| **Price Search** | Dedicated scrapers + APIs | Faster, more reliable, cheaper at scale |
| **Database** | PostgreSQL | Persistent cache, user accounts, analytics |
| **Cache** | Redis | Distributed caching, faster than DB |
| **Queue** | Celery + Redis | Background price updates, async jobs |
| **Hosting** | AWS/GCP/Azure | More control, better scaling |
| **Monitoring** | Sentry (errors) + Mixpanel (analytics) | Track issues and usage patterns |
| **Auth** | Auth0 or Firebase Auth | User accounts, saved searches |

**Only implement if:**
- Daily active users > 100
- Monthly searches > 1,000
- Revenue model identified and validated

---

## Implementation Roadmap

### Phase 1: Proof of Concept (Week 1-2)

**Goal:** Validate that the core concept works with a single hardcoded product.

**Tasks:**
1. **Setup Development Environment**
   - [ ] Initialize React project (`npm create vite@latest`)
   - [ ] Initialize Python FastAPI project
   - [ ] Setup Git repository
   - [ ] Get API keys (Anthropic/OpenAI)

2. **Build Hardcoded MVP**
   - [ ] Frontend: Simple search box (hardcoded to "Logitech G Pro X Superlight")
   - [ ] Frontend: Three sliders component
   - [ ] Backend: `/api/recommend` endpoint
   - [ ] Backend: LLM reasoning module (skip price search, use fake prices)
   - [ ] Frontend: Display recommendation output

3. **Test LLM Reasoning**
   - [ ] Run 10+ searches with different slider combinations
   - [ ] Verify recommendations make sense
   - [ ] Iterate on prompt if outputs are poor

**Success Criteria:**
- Given hardcoded prices, LLM generates sensible rankings
- Sliders affect the recommendation appropriately
- Output displays clearly and looks decent

**Time Estimate:** 15-20 hours total

**Deliverable:** A working single-product prototype you can demo to each other.

---

### Phase 2: Live Price Search (Week 3)

**Goal:** Replace hardcoded prices with real web search.

**Tasks:**
1. **Implement Price Search Module**
   - [ ] Create `price_search.py` service
   - [ ] Implement LLM-powered web search function
   - [ ] Add error handling (product not found, search timeout)
   - [ ] Test with 5-10 different products manually

2. **Integrate Price Search**
   - [ ] Connect `/api/recommend` to price search
   - [ ] Add loading state in frontend (progress indicator)
   - [ ] Display actual market prices in output

3. **Add Basic Caching**
   - [ ] Implement in-memory cache with 6hr TTL
   - [ ] Add cache hit/miss logging
   - [ ] Test cache behaviour

**Success Criteria:**
- Can search any gaming peripheral and get real prices
- Latency <45 seconds per search
- Cached searches return <1 second

**Time Estimate:** 10-15 hours

**Deliverable:** Working price search for arbitrary products (within gaming peripherals).

---

### Phase 3: Product Catalogue & UI Polish (Week 4)

**Goal:** Handle multiple products gracefully and improve UX.

**Tasks:**
1. **Build Product Catalogue**
   - [ ] Create `products.yaml` with 20-30 gaming peripherals
   - [ ] Implement fuzzy matching for user queries
   - [ ] Add disambiguation UI for ambiguous searches

2. **UI Improvements**
   - [ ] Better styling (consistent design system)
   - [ ] Add market stats visualization (simple bar chart?)
   - [ ] Improve loading states (skeleton screens)
   - [ ] Add error messages (product not found, API error)

3. **Add "Find Listings" Links**
   - [ ] Generate pre-filtered eBay search URLs
   - [ ] Add buttons for each condition tier
   - [ ] Open in new tab

**Success Criteria:**
- Can search 20+ products by name
- Disambiguation works for ambiguous queries
- UI looks polished and professional
- Can click through to marketplace searches

**Time Estimate:** 12-18 hours

**Deliverable:** Functional tool you'd actually use for real purchases.

---

### Phase 4: Testing & Refinement (Week 5-8)

**Goal:** Use the tool for real purchases and iterate based on experience.

**Tasks:**
1. **Real-World Testing**
   - [ ] Use tool for 5-10 actual purchases
   - [ ] Track accuracy (did recommendation make sense?)
   - [ ] Note missing features or pain points

2. **Prompt Optimization**
   - [ ] Refine LLM reasoning prompt based on poor outputs
   - [ ] A/B test different prompt variations
   - [ ] Add edge case handling (e.g., no used market for item)

3. **Expand Product Catalogue**
   - [ ] Add 30 more products based on what you search for
   - [ ] Improve fuzzy matching based on failed searches

4. **Analytics (Optional)**
   - [ ] Log searches (item, preferences, recommendation)
   - [ ] Basic dashboard (most searched items, avg latency)
   - [ ] Helps prioritize product catalogue additions

**Success Criteria:**
- Tool successfully guided 5+ real purchases
- Recommendations were accurate >80% of the time
- No major bugs or UX frustrations

**Time Estimate:** Ongoing (use naturally over 4-6 weeks)

**Decision Point:** After Phase 4, decide whether to:
- Keep as personal tool (done!)
- Expand to production (see Phase 5+)
- Pivot based on learnings

---

### Phase 5+: Production Features (Optional, Post-Personal Project)

Only pursue if Phase 4 validates the tool is genuinely useful.

**Potential Features:**
- User accounts & saved searches
- Price alert emails ("G Pro X dropped to £85 in Like New")
- Historical price charts
- Expand beyond gaming peripherals (phones, laptops, cameras)
- Browser extension (see Extension section below)
- Mobile app (React Native)
- Affiliate links (monetization)

**Don't build these until you've proven value to yourselves.**

---

## Development Setup Guide

**Project Structure:**
```
secondsense-frontend/
├── src/
│   ├── components/
│   │   ├── SearchBar.jsx
│   │   ├── PersonalisationSliders.jsx
│   │   └── RecommendationDisplay.jsx
│   ├── App.jsx
│   ├── api.js
│   └── main.jsx
├── package.json
└── vite.config.js
```

---

### Backend Setup

**Project Structure:**
```
secondsense-backend/
├── main.py
├── config.py
├── requirements.txt
├── products.yaml
├── routers/
│   └── recommendation.py
├── services/
│   ├── price_search.py
│   ├── llm_client.py
│   └── product_catalog.py
└── models/
    ├── request_models.py
    └── response_models.py
```
---

## Testing Strategy

### Manual Testing (MVP Phase)

**Test Cases:**

1. **Functionality Tests:**
   - [ ] Search for known product → Returns recommendation
   - [ ] Search for unknown product → Shows disambiguation or "not found"
   - [ ] Adjust sliders → Recommendation changes appropriately
   - [ ] Multiple searches → Cache works (faster 2nd time)

2. **Edge Cases:**
   - [ ] Very long product name
   - [ ] Typos in search (fuzzy matching)
   - [ ] No used listings available (new item)
   - [ ] API timeout or error

3. **Recommendation Quality:**
   - [ ] Low budget + low condition → Recommends "Well Used"
   - [ ] High budget + high condition → Recommends "Brand New" or "Like New"
   - [ ] Balanced sliders → Recommends middle option
   - [ ] Check reasoning makes sense

**Testing Protocol:**
- Each team member tests 10 searches
- Note any bugs or UX issues
- Compare recommendations to your intuition

---

### Automated Testing (Production Phase)

Only add if expanding beyond personal project.

```python
# tests/test_recommendation.py

import pytest
from services.llm_client import generate_recommendation

def test_budget_conscious_user():
    prices = {
        'new': [100, 105, 98],
        'like_new': [70, 75, 68],
        'good': [50, 55, 48],
        'well_used': [30, 35, 28]
    }
    prefs = {'budget_flexibility': 2, 'condition_standards': 5, 'hassle_tolerance': 4}
    
    result = generate_recommendation("Test Mouse", prices, prefs)
    
    # Should recommend cheaper options
    assert result.rankings[0].condition in ['Good', 'Well Used']

def test_pristine_condition_user():
    # ... similar structure
```

---

## Deployment Guide

### MVP Deployment (Free Tier) - UPDATED

#### **Option A: Cloudflare Pages + Workers (RECOMMENDED)**

**Frontend (Cloudflare Pages):**
```bash
# In frontend directory
npm install -g wrangler
wrangler login
npm run build
npx wrangler pages deploy dist --project-name=secondsense

# Get URL: https://secondsense.pages.dev
```

**Backend (Cloudflare Workers):**
```bash
# In backend directory
# Create wrangler.toml for Workers configuration
wrangler init
wrangler deploy

# Get URL: https://secondsense-api.workers.dev
```

**Why Cloudflare:**
- ✅ Unlimited bandwidth (no 100GB limit like Vercel)
- ✅ Global edge network (faster worldwide)
- ✅ Workers run at edge (sub-10ms response in most regions)
- ✅ Free tier very generous (100k requests/day)
- ✅ Integrated KV storage for caching

---

#### **Option B: Fly.io (Best for Go Apps)**

**Backend (Fly.io):**
```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# In backend directory
fly launch
# Dockerfile will be auto-generated for Go
fly deploy

# Get URL: https://secondsense-api.fly.dev
```

**Frontend (Vercel - unchanged):**
```bash
npm install -g vercel
vercel login
vercel deploy
```

**Why Fly.io:**
- ✅ 3 shared VMs free (256MB RAM each)
- ✅ Better than Render's free tier (faster, more reliable)
- ✅ Go support excellent (compiles to single binary)
- ✅ Global regions available
- ✅ No cold starts like serverless

---

**Update Frontend API URL:**
```typescript
// src/config.ts
export const API_URL = import.meta.env.PROD
  ? 'https://secondsense-api.fly.dev' // or workers.dev
  : 'http://localhost:8080';
```

---

### Cost Estimates (Updated with Free Tier Strategy)

**MVP Personal Project (100-200 searches/month) - OPTIMIZED:**
- LLM API calls (Gemini Flash or Groq): **£0** (free tier: 1500 req/day)
- Price search (eBay API + web scraping): **£0** (free tier: 5000 calls/day)
- Cache (Upstash Redis): **£0** (free tier: 10k commands/day)
- Hosting Frontend (Cloudflare Pages): **£0** (unlimited bandwidth)
- Hosting Backend (Fly.io or CF Workers): **£0** (free tier sufficient)
- **Total: £0-5/month** (only if exceeding free tiers)

**Original estimate was £7-15/month for 50 searches - now 4x searches for FREE**

**If Scaling to 500 searches/month:**
- LLM costs (if exceeding free tier): £10-20/month
- Hosting (still free or minimal): £0-10/month
- Cache (upgrade if needed): £0-5/month
- **Total: £10-35/month**
- **Revenue needed:** ~£50-75/month to break even (vs. original £100-150)

**Cost Optimization Strategies:**
1. **Aggressive caching**: 72-hour TTL instead of 24 hours (prices don't change that fast)
2. **Free LLM tiers**: Gemini 2.0 Flash (1500/day), Groq (generous limits)
3. **Free APIs**: eBay Finding API (5000/day), avoid paid scraping services
4. **Edge computing**: Cloudflare Workers eliminates server costs
5. **Batch requests**: Group multiple product searches when possible

---

## Browser Extension (Future Consideration)

### Why an Extension Makes Sense

**Use Case:** User is shopping on Amazon/eBay, extension automatically checks used market and suggests alternatives.

**UX Flow:**
1. User views product page (e.g., Amazon: Logitech G Pro X)
2. Extension detects product, adds button: "Check Used Options"
3. User clicks → Extension opens popup with SecondSense results
4. User decides whether to buy new or switch to used listing

**Advantages:**
- ✅ Catches user at point of purchase (high intent)
- ✅ No need to remember to visit separate website
- ✅ Can scrape product details from current page (easier product identification)

**Challenges:**
- ❌ Must work across multiple retailer websites
- ❌ More complex development (web extension APIs)
- ❌ Requires product page parsing (varies by site)

---

### Extension Architecture

```
┌─────────────────────────────────────┐
│  Content Script (Injected in page) │
│  - Detect product page              │
│  - Extract product name/model       │
│  - Show "Check Used" button         │
└──────────────┬──────────────────────┘
               │
               │ postMessage
               ↓
┌─────────────────────────────────────┐
│  Background Script                  │
│  - Receive product info             │
│  - Call SecondSense API             │
│  - Return recommendation            │
└──────────────┬──────────────────────┘
               │
               │ API call
               ↓
┌─────────────────────────────────────┐
│  SecondSense Backend (same as web)  │
│  - Price search                     │
│  - LLM reasoning                    │
│  - Return recommendation            │
└─────────────────────────────────────┘
               │
               │ Response
               ↓
┌─────────────────────────────────────┐
│  Extension Popup                    │
│  - Display recommendation           │
│  - Show rankings & reasoning        │
│  - Link to used listings            │
└─────────────────────────────────────┘
```

---

## Alternative Form Factors

### Mobile App

**Pros:**
- Native camera → Scan barcodes/products
- Push notifications for price drops
- Better offline experience

**Cons:**
- 2x development effort (iOS + Android)
- App store review process
- Higher user acquisition friction

**Recommendation:** Not worth it for MVP. Web app works fine on mobile browsers.

---

### WhatsApp/Telegram Bot

**Use Case:** Send product name to bot, get recommendation back.

**Pros:**
- ✅ Very low friction (no install needed)
- ✅ Fast interaction model
- ✅ Easy to share with friends

**Cons:**
- ❌ Limited UI (text + images only)
- ❌ Harder to display complex data (rankings, stats)

**Example Flow:**
```
User: Logitech G Pro X Superlight
Bot: [3 second delay]
Bot: 🎯 Recommendation: Buy Like New

💰 £89 (save £46 vs. new)

Your best bet given typical preferences. 
Like New condition is essentially pristine 
while saving you 34%.

Rankings:
🥇 Like New - £89
🥈 Good - £72
🥉 Brand New - £135

[Find Like New Listings 🔗]
```

**Implementation:** FastAPI webhook + Telegram Bot API (easier than WhatsApp)

**Effort:** 1-2 weeks after web API is stable

**Recommendation:** Interesting future option if users request it, but web app is more feature-rich.

---

## Monetization Options (Future)

**Only relevant if expanding beyond personal project.**

### Option 1: Affiliate Revenue
- Earn commission on purchases through your links
- **Pros:** Passive income, no paywall
- **Cons:** Creates conflict of interest, low margins

### Option 2: Freemium
- 3 free searches/month, £5/month for unlimited
- **Pros:** Directly captures value
- **Cons:** High friction, hard to justify for sporadic use

### Option 3: B2B Licensing
- Sell API access to price comparison sites or retailers
- **Pros:** High value, enterprise deals
- **Cons:** Requires sales effort, different product focus

### Option 4: Sponsored Listings
- Highlight "certified refurbished" sellers for fee
- **Pros:** High margins
- **Cons:** Risks user trust, requires seller partnerships

**Recommendation:** Don't monetise during personal project phase. Validate value first, monetize later.

---

## Risks & Mitigation

### Technical Risks

| Risk | Impact | Likelihood | Mitigation |
|------|---------|-----------|------------|
| LLM hallucinates prices | Users make bad decisions | Low-Medium | Validate prices (reject outliers), show confidence score |
| API rate limits hit | Tool becomes unusable | Medium | Implement caching, upgrade API tier |
| Product matching fails | Can't find user's item | Medium | Manual catalogue curation, better fuzzy matching |
| Site structure changes | Scrapers break | High (if scraping) | Use APIs when possible, monitor for failures |
| Slow API responses | Poor UX, users leave | Low | Optimize prompts, use faster models, cache aggressively |

### Business Risks

| Risk | Impact | Likelihood | Mitigation |
|------|---------|-----------|------------|
| No one finds it useful | Wasted effort | Medium | Personal project first = low stakes |
| Can't scale beyond gaming peripherals | Limited TAM | Medium | Start focused, expand if validated |
| Legal issues (scraping ToS) | Shutdown, lawsuits | Low | Use APIs, respect robots.txt, low profile for MVP |
| API costs balloon | Unsustainable | Medium | Aggressive caching, transition to scraping if needed |

---

## Success Metrics

### Personal Project Phase (Weeks 1-8)

**Quantitative:**
- [ ] Tool used for 5+ real purchases by team
- [ ] Recommendation accuracy >75% (subjectively judged)
- [ ] API costs <£20/month
- [ ] Avg response time <45 seconds

**Qualitative:**
- [ ] We actually want to use it
- [ ] Recommendations feel sensible
- [ ] Saves us time vs. manual research
- [ ] Clear value proposition

**Decision Point:** If ≥3 of 4 qualitative criteria met, consider expanding.

---

### Production Phase (If Pursued)

**Adoption:**
- 100 monthly active users within 3 months
- 50% return usage rate (users come back)

**Engagement:**
- Avg 3 searches per user per month
- <30 second time-to-recommendation

**Quality:**
- <5% error rate (API failures, bad recommendations)
- Confidence score correlates with user satisfaction

**Financial:**
- If monetized: £200/month revenue by month 6
- Cost per search <£0.10

---

## Conclusion

SecondSense is an achievable personal project with clear scope and realistic timelines. By focusing on gaming peripherals, leveraging LLM reasoning, and starting with a web app MVP, you can build a functional tool within 4-8 weeks.

**Key Success Factors:**
1. **Start small:** One category, one form factor (web), simple UI
2. **Use LLMs effectively:** Let them handle reasoning and initial price search
3. **Validate personally:** Use it for real purchases before expanding
4. **Iterate based on reality:** Don't over-engineer, build what you actually need

**Next Steps:**
1. Set up development environments (1 day)
2. Build hardcoded proof-of-concept (1 week)
3. Add live price search (1 week)
4. Polish and test (2-3 weeks)
5. Use tool for real purchases (4-6 weeks)
6. Decide: keep personal or expand to production

