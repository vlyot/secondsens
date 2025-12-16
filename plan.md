# SecondSense - MVP Implementation Plan (Phase 1-4)

**Last Updated:** December 2024
**Target Timeline:** 8 weeks
**Current Status:** Ready for implementation

---

## Overview

This document provides a detailed, step-by-step implementation plan for SecondSense MVP (Phases 1-4). The project uses a **modular monolith architecture** where business logic is cleanly separated into modules within a single codebase:

### Core Modules:

1. **Product Module** (`src/products/`)
   - Manages product database (20-50 gaming peripherals)
   - Handles fuzzy matching and product disambiguation
   - Business logic: `product_service.go`, `product_repository.go`
   - HTTP handlers: `handlers.go`

2. **Price Module** (`src/prices/`)
   - Fetches prices across condition tiers
   - LLM-powered web search integration
   - Validates and parses price data
   - Business logic: `price_service.go`, `llm_client.go`

3. **Recommendation Module** (`src/recommendations/`)
   - LLM reasoning and ranking logic
   - Generates recommendations based on user preferences
   - Calculates confidence scores
   - Business logic: `recommendation_service.go`, `prompt_builder.go`

4. **Frontend** (`frontend-service/`)
   - React + TypeScript/Vite + shadcn/ui
   - User-facing web application
   - Single HTTP POST entry point to backend

5. **Shared/Infrastructure** (`src/shared/`)
   - Database connections
   - Cache layer (in-memory or Redis)
   - Domain types and events
   - HTTP client utilities

---

## Architecture Overview (Modular Monolith)

```
┌────────────────────────────────────────────────────────┐
│  Frontend (React + TypeScript + Vite)                  │
│  - SearchBar component                                 │
│  - PersonalisationSliders component                    │
│  - RecommendationDisplay component                     │
│  - Communicates via: POST /api/recommend               │
└────────────────────────┬─────────────────────────────┘
                         │
                         │ HTTP POST
                         │ {item, preferences}
                         ↓
    ┌────────────────────────────────────────┐
    │  Backend (Go) - Single Binary           │
    │                                         │
    │  ┌──────────────────────────────────┐  │
    │  │ HTTP Handler Layer               │  │
    │  │ - main.rs: Route POST /recommend │  │
    │  │ - CORS, logging, errors          │  │
    │  └──────────────┬───────────────────┘  │
    │                 │                      │
    │  ┌──────────────┴───────────────────┐  │
    │  │ Recommendation Handler           │  │
    │  │ - Orchestrates all modules       │  │
    │  │ - Manages request flow           │  │
    │  └──────────────┬───────────────────┘  │
    │                 │                      │
    │  ┌──────────────┴───────────────────┐  │
    │  │ Product Module                   │  │
    │  │ ├─ product_service.rs            │  │
    │  │ ├─ product_repository.rs         │  │
    │  │ └─ handlers.rs                   │  │
    │  │                                  │  │
    │  │ Responsibilities:                │  │
    │  │ - Fuzzy match products           │  │
    │  │ - Return canonical names         │  │
    │  │ - Handle disambiguation          │  │
    │  └──────────────┬───────────────────┘  │
    │                 │                      │
    │  ┌──────────────┴───────────────────┐  │
    │  │ Price Module                     │  │
    │  │ ├─ price_service.rs              │  │
    │  │ ├─ llm_client.rs                 │  │
    │  │ └─ handlers.rs                   │  │
    │  │                                  │  │
    │  │ Responsibilities:                │  │
    │  │ - Call LLM for web search        │  │
    │  │ - Parse & validate prices        │  │
    │  │ - Return price data              │  │
    │  └──────────────┬───────────────────┘  │
    │                 │                      │
    │  ┌──────────────┴───────────────────┐  │
    │  │ Recommendation Module            │  │
    │  │ ├─ recommendation_service.rs      │  │
    │  │ ├─ prompt_builder.rs             │  │
    │  │ └─ handlers.rs                   │  │
    │  │                                  │  │
    │  │ Responsibilities:                │  │
    │  │ - Generate LLM prompts           │  │
    │  │ - Parse LLM responses            │  │
    │  │ - Rank & score options           │  │
    │  └──────────────┬───────────────────┘  │
    │                 │                      │
    │  ┌──────────────┴───────────────────┐  │
    │  │ Shared Module (Infrastructure)   │  │
    │  │ ├─ cache.rs                      │  │
    │  │ ├─ config.rs                     │  │
    │  │ ├─ domain/types.rs               │  │
    │  │ └─ http_client.rs                │  │
    │  │                                  │  │
    │  │ Shared across all modules        │  │
    │  └──────────────────────────────────┘  │
    │                                         │
    └─────────────────────────────────────────┘
```

### Request Flow:

```
1. Frontend sends: POST /api/recommend {item, preferences}
                         ↓
2. Handler receives request
   - Validates input
   - Calls recommendation handler
                         ↓
3. Product Module: Search & match product
   - Check cache
   - Fuzzy match against catalog
   - Return canonical product name
                         ↓
4. Price Module: Fetch prices
   - Check cache
   - Call LLM with web search
   - Validate & parse prices
                         ↓
5. Recommendation Module: Generate ranking
   - Check cache
   - Build LLM prompt
   - Call LLM for reasoning
   - Parse & rank options
                         ↓
6. Handler returns: RecommendationResponse
                         ↓
7. Frontend displays results
```

---

## Phase 1: Project Setup & Scaffolding (Days 1-2)

### Directory Structure (Modular Monolith)

```
secondsense/
├── backend/                    # Go monolith backend
│   ├── src/
│   │   ├── products/           # Product module
│   │   ├── prices/             # Price module
│   │   ├── recommendations/    # Recommendation module
│   │   ├── shared/             # Shared infrastructure
│   │   └── main.go             # Entry point
│   ├── go.mod
│   ├── go.sum
│   ├── data/
│   │   └── products.yaml       # Product catalog
│   ├── Dockerfile
│   └── README.md
│
├── frontend-service/           # React + TypeScript app
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── lib/
│   │   └── App.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
│
└── .env.example                # Shared environment
```

### Key Principle:
- **One backend binary** - All modules compiled into a single Go executable
- **Clean module boundaries** - Modules have internal structure but share the same process
- **Minimal coupling** - Modules only depend on shared infrastructure (cache, config, types)
- **Easy to test** - Import modules directly in tests, no HTTP mocking needed initially

---

### 1.1 Initialize Go Backend Project

**Goal:** Set up modular Go monolith with clear module structure

**Location:** `backend/`

**Steps:**
- [ ] Create backend directory: `mkdir backend && cd backend`
- [ ] Initialize Go module: `go mod init secondsense/backend`
- [ ] Install dependencies:
  ```bash
  go get github.com/gin-gonic/gin
  go get github.com/anthropics/anthropic-sdk-go
  go get github.com/joho/godotenv
  go get gopkg.in/yaml.v2
  ```
- [ ] Create directory structure:
  ```
  backend/
  ├── src/
  │   ├── products/
  │   │   ├── product_service.go
  │   │   ├── product_repository.go
  │   │   └── handlers.go
  │   ├── prices/
  │   │   ├── price_service.go
  │   │   ├── llm_client.go
  │   │   ├── validators.go
  │   │   └── handlers.go
  │   ├── recommendations/
  │   │   ├── recommendation_service.go
  │   │   ├── prompt_builder.go
  │   │   └── handlers.go
  │   ├── shared/
  │   │   ├── cache.go
  │   │   ├── config.go
  │   │   ├── domain/
  │   │   │   └── types.go
  │   │   └── http_client.go
  │   └── main.go
  ├── data/
  │   └── products.yaml
  ├── go.mod
  ├── go.sum
  ├── .env.example
  ├── Dockerfile
  └── README.md
  ```
- [ ] Create basic `main.go`:
  ```go
  package main

  import (
      "log"
      "github.com/gin-gonic/gin"
      "secondsense/backend/src/shared"
      "secondsense/backend/src/recommendations"
  )

  func main() {
      cfg := shared.LoadConfig()

      router := gin.Default()
      router.Use(corsMiddleware())

      router.GET("/health", func(c *gin.Context) {
          c.JSON(200, gin.H{"status": "ok"})
      })

      router.POST("/api/recommend", recommendations.HandleRecommendation)

      log.Printf("Server running on port %s\n", cfg.Port)
      router.Run(":" + cfg.Port)
  }
  ```
- [ ] Create `.env.example`:
  ```
  PORT=8080
  LLM_API_KEY=your_key_here
  LLM_MODEL=claude-3-5-sonnet-20241022
  CACHE_TTL=86400
  ```

**Deliverable:** Go backend compiles and runs on port 8080

---

### 1.2 Initialize Frontend Service

**Goal:** Set up React + Vite + TypeScript project with shadcn/ui

**Location:** `frontend-service/`

**Steps:**
- [ ] Create frontend directory: `mkdir frontend-service && cd frontend-service`
- [ ] Initialize Vite React with TypeScript: `npm create vite@latest . -- --template react-ts`
- [ ] Install dependencies:
  ```bash
  npm install tailwindcss @tailwindcss/vite
  npm install shadcn-ui lucide-react
  npm install axios
  npm install --save-dev @types/react @types/react-dom typescript
  npm install --save-dev eslint @typescript/eslint-plugin
  ```
- [ ] Setup shadcn/ui: `npx shadcn-ui@latest init`
- [ ] Create directory structure:
  ```
  frontend-service/
  ├── src/
  │   ├── components/
  │   │   ├── SearchBar.tsx
  │   │   ├── PersonalisationSliders.tsx
  │   │   ├── RecommendationDisplay.tsx
  │   │   ├── ProductDisambiguation.tsx
  │   │   ├── LoadingState.tsx
  │   │   ├── ErrorState.tsx
  │   │   └── ui/              # shadcn/ui components
  │   ├── hooks/
  │   │   └── useRecommendation.ts
  │   ├── services/
  │   │   ├── api.ts           # HTTP client for backend
  │   │   └── marketplaceLinks.ts
  │   ├── lib/
  │   │   ├── utils.ts
  │   │   ├── types.ts         # TypeScript interfaces
  │   │   └── constants.ts
  │   ├── App.tsx
  │   ├── index.css
  │   └── main.tsx
  ├── .env.example
  ├── package.json
  ├── tsconfig.json
  ├── vite.config.ts
  ├── tailwind.config.js
  ├── Dockerfile
  └── README.md
  ```
- [ ] Create `.env.example`:
  ```
  VITE_API_BACKEND_URL=http://localhost:8080
  ```
- [ ] Initialize Git

**Deliverable:** Working Vite dev environment (npm run dev on :5173)

---

### 1.3 Setup Shared Types

**Goal:** Define types shared between backend modules and frontend

**Location:** `backend/src/shared/domain/types.go`

**Steps:**
- [ ] Create `backend/src/shared/domain/types.go` with all domain types:
  ```go
  package domain

  type RecommendationRequest struct {
      Item        string `json:"item"`
      Preferences Preferences `json:"preferences"`
  }

  type Preferences struct {
      BudgetFlexibility  int `json:"budget_flexibility"`   // 0-10
      ConditionStandards int `json:"condition_standards"`   // 0-10
      HassleTolerances   int `json:"hassle_tolerance"`      // 0-10
  }

  type RecommendationResponse struct {
      Success        bool                `json:"success"`
      ProductName    string              `json:"product_name"`
      Recommendations []RankedOption     `json:"recommendations"`
      MarketStats    MarketStats         `json:"market_stats"`
      Reasoning      string              `json:"reasoning"`
      ConfidenceScore string              `json:"confidence_score"`
      Timestamp      string              `json:"timestamp"`
  }

  type RankedOption struct {
      Rank         int         `json:"rank"`
      Condition    string      `json:"condition"`
      AvgPrice     float64     `json:"avg_price"`
      PriceRange   PriceRange  `json:"price_range"`
      SavingsVsNew SavingsInfo `json:"savings_vs_new"`
      Justification string     `json:"justification"`
  }

  type PriceRange struct {
      Min float64 `json:"min"`
      Max float64 `json:"max"`
  }

  type SavingsInfo struct {
      Absolute float64 `json:"absolute"`
      Percent  float64 `json:"percent"`
  }

  type MarketStats struct {
      BrandNew MarketTier `json:"brand_new"`
      LikeNew  MarketTier `json:"like_new"`
      Good     MarketTier `json:"good"`
      WellUsed MarketTier `json:"well_used"`
  }

  type MarketTier struct {
      AvgPrice float64   `json:"avg_price"`
      Range    PriceRange `json:"range"`
  }

  type PriceData struct {
      BrandNew []float64 `json:"brand_new"`
      LikeNew  []float64 `json:"like_new"`
      Good     []float64 `json:"good"`
      WellUsed []float64 `json:"well_used"`
  }

  type Product struct {
      ID            string   `yaml:"id"`
      CanonicalName string   `yaml:"canonical_name"`
      Category      string   `yaml:"category"`
      Aliases       []string `yaml:"aliases"`
  }
  ```

**Deliverable:** Shared types used across all backend modules

---

### 1.4 Create Product Catalog Data

**Goal:** Initialize product database

**Location:** `backend/data/products.yaml`

**Steps:**
- [ ] Create YAML file with 20-30 products:
  ```yaml
  products:
    - id: logitech_gpro_x_superlight
      canonical_name: "Logitech G Pro X Superlight"
      category: gaming_mouse
      aliases:
        - "gpro superlight"
        - "g pro x sl"
        - "910-005878"

    - id: razer_deathadder_v3
      canonical_name: "Razer DeathAdder V3"
      category: gaming_mouse
      aliases:
        - "deathadder v3"
        - "deathadder 3"
        - "da v3"

    # ... 28 more products
  ```

**Deliverable:** Product database ready for module to use

---

## Phase 2: Component Development (Days 3-7)

### 2.1 Frontend: Basic Components (No API calls yet)

**Goal:** Build UI components that accept input and manage state

#### 2.1.1 SearchBar Component

**File:** `frontend/src/components/SearchBar.jsx`

**Functionality:**
- Text input for product search
- Handle onChange events to track input state
- Submit handler (will connect to parent state, not API yet)
- Error display if no input

**Implementation:**
```jsx
export function SearchBar({ onSearch, isLoading }) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
      setQuery("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search product (e.g., 'Logitech G Pro X Superlight')"
        disabled={isLoading}
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? "Searching..." : "Get Recommendation"}
      </button>
    </form>
  );
}
```

**Tests (Manual):**
- [ ] Type in search box → state updates
- [ ] Submit → onSearch callback fires
- [ ] Disabled when isLoading=true
- [ ] Clear input after submit

---

#### 2.1.2 PersonalisationSliders Component

**File:** `frontend/src/components/PersonalisationSliders.jsx`

**Functionality:**
- Three sliders (budget, condition, hassle) with 0-10 scale
- Display current values
- Show emoji indicators (changes with slider value)
- onChange handler to update parent state

**Implementation:**
```jsx
export function PersonalisationSliders({ preferences, onPreferencesChange }) {
  const handleChange = (key, value) => {
    onPreferencesChange({
      ...preferences,
      [key]: parseInt(value, 10),
    });
  };

  const getEmoji = (key, value) => {
    // Return emoji based on slider value
    // e.g., budget: 0-3 = 💸, 4-6 = 💰, 7-10 = 🤑
  };

  return (
    <div className="slider-container">
      <Slider
        label="Budget Flexibility"
        value={preferences.budget_flexibility}
        onChange={(v) => handleChange("budget_flexibility", v)}
        emoji={getEmoji("budget", preferences.budget_flexibility)}
      />
      {/* Similar for condition_standards and hassle_tolerance */}
    </div>
  );
}

function Slider({ label, value, onChange, emoji }) {
  return (
    <div className="slider-group">
      <label>{emoji} {label}</label>
      <input
        type="range"
        min="0"
        max="10"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <span>{value}/10</span>
    </div>
  );
}
```

**Tests (Manual):**
- [ ] Drag sliders → values update and emit onChange
- [ ] Emoji changes with slider position
- [ ] Values default to 5 on first render
- [ ] All three sliders work independently

---

#### 2.1.3 RecommendationDisplay Component

**File:** `frontend/src/components/RecommendationDisplay.jsx`

**Functionality:**
- Display ranked recommendations (top 3 options)
- Show market stats
- Display overall reasoning
- CTA buttons to find listings

**Props Structure:**
```jsx
{
  recommendations: [
    {
      rank: 1,
      condition: "Like New",
      avg_price: 89,
      price_range: { min: 85, max: 95 },
      savings_vs_new: { absolute: 46, percent: 34 },
      justification: "Best value for your preferences..."
    },
    // ... rank 2, 3
  ],
  market_stats: { /* ... */ },
  reasoning: "Your moderate condition standards...",
  confidence_score: "High",
  product_name: "Logitech G Pro X Superlight"
}
```

**Tests (Manual):**
- [ ] Display all 3 ranked options
- [ ] Format prices with £ symbol and percentages
- [ ] Show market stats table
- [ ] CTA buttons are clickable (no action yet)

---

#### 2.1.4 ProductDisambiguation Component

**File:** `frontend/src/components/ProductDisambiguation.jsx`

**Functionality:**
- Show list of product options if search is ambiguous
- Allow user to select one product
- Show "more specific" option
- Close button

**Tests (Manual):**
- [ ] Render with list of products
- [ ] Click product → onSelect callback fires
- [ ] Close button works

---

#### 2.1.5 LoadingState & ErrorState Components

**File:** `frontend/src/components/LoadingState.jsx` and `ErrorState.jsx`

**LoadingState:**
- Spinner animation
- "Searching for prices across conditions..."
- Progress indicator (optional)

**ErrorState:**
- Error message display
- Retry button
- Suggestions (e.g., "Try a different product name")

**Tests (Manual):**
- [ ] Show/hide based on state
- [ ] Spinner animates
- [ ] Retry button calls handler

---

### 2.2 Frontend: App State Management

**File:** `frontend/src/App.jsx`

**Functionality:**
- Top-level state management (search, preferences, results)
- Coordinate component rendering
- Manage flow (search → sliders → results)

**State Structure:**
```javascript
const [state, setState] = useState({
  // UI flow state
  currentStep: "search", // "search", "sliders", "results", "disambiguation", "error"

  // Search state
  searchQuery: "",
  selectedProduct: null,

  // Preferences
  preferences: {
    budget_flexibility: 5,
    condition_standards: 5,
    hassle_tolerance: 5,
  },

  // Results
  recommendations: null,

  // Loading/Error
  isLoading: false,
  error: null,

  // Disambiguation
  disambiguation: null, // Array of products if ambiguous
});
```

**State Transitions:**
```
START → search → Enter query → disambiguation (if ambiguous)
  → sliders → Adjust preferences → results → Try another item → search
```

**Tests (Manual):**
- [ ] Components render in correct order
- [ ] State transitions work smoothly
- [ ] No console errors
- [ ] Can navigate between steps

---

### 2.3 Backend: Type Definitions & Models

**File:** `backend/models/types.go`

**Already defined in Phase 1.3, but verify:**
- [ ] All request types defined
- [ ] All response types defined
- [ ] JSON tags added for marshaling
- [ ] Go lint clean

**Tests:**
- [ ] Types compile: `go build`
- [ ] Can marshal/unmarshal JSON

---

### 2.4 Backend: Configuration & Environment

**File:** `backend/config/config.go`

**Functionality:**
- Load environment variables
- Validate required fields (API keys, etc.)
- Provide configuration to other services

**Implementation:**
```go
package config

import (
    "os"
    "github.com/joho/godotenv"
)

type Config struct {
    Port              string
    LLMAPIKey        string
    LLMModel         string
    RedisURL         string
    CacheTTL         int64
}

func Load() *Config {
    godotenv.Load()

    return &Config{
        Port:         getEnv("PORT", "8080"),
        LLMAPIKey:    getEnv("ANTHROPIC_API_KEY", ""),
        LLMModel:     getEnv("LLM_MODEL", "claude-3-5-sonnet-20241022"),
        RedisURL:     getEnv("REDIS_URL", ""),
        CacheTTL:     86400, // 24 hours
    }
}

func getEnv(key, defaultVal string) string {
    if value, exists := os.LookupEnv(key); exists {
        return value
    }
    return defaultVal
}
```

**Files:**
- [ ] Create `backend/.env.example`
- [ ] Document required API keys

---

## Phase 3: Product Catalog & Matching (Days 8-9)

### 3.1 Create Product Catalog

**File:** `backend/products.yaml`

**Content:** 20-30 gaming peripherals with aliases and metadata

**Structure:**
```yaml
products:
  - id: logitech_gpro_x_superlight
    canonical_name: "Logitech G Pro X Superlight"
    category: gaming_mouse
    aliases:
      - "gpro superlight"
      - "g pro x sl"
      - "g pro superlight"
      - "910-005878"  # Model number
      - "logitech superlight"

  - id: razer_deathadder_v3
    canonical_name: "Razer DeathAdder V3"
    category: gaming_mouse
    aliases:
      - "deathadder v3"
      - "deathadder 3"
      - "da v3"
      - "razer da v3"

  # ... 28 more products
```

**Steps:**
- [ ] Research 20-30 popular gaming peripherals
- [ ] Add model numbers, common nicknames
- [ ] Organize by category (mouse, keyboard, headset, etc.)
- [ ] Test fuzzy matching with each product

---

### 3.2 Product Catalog Service

**File:** `backend/services/product_catalog.go`

**Functionality:**
- Load products.yaml on startup
- Search product by name/alias (fuzzy matching)
- Return canonical product name or disambiguation list

**Implementation:**
```go
package services

import (
    "gopkg.in/yaml.v2"
    "strings"
    "github.com/sahilm/fuzzy"
)

type ProductCatalog struct {
    Products map[string]Product
}

type Product struct {
    ID            string   `yaml:"id"`
    CanonicalName string   `yaml:"canonical_name"`
    Category      string   `yaml:"category"`
    Aliases       []string `yaml:"aliases"`
}

func NewProductCatalog(filePath string) (*ProductCatalog, error) {
    // Load YAML file
    // Build index of aliases for fast lookup
    // Return initialized catalog
}

func (pc *ProductCatalog) Search(query string) (SearchResult, error) {
    // Exact match first (fast path)
    if product := pc.exactMatch(query); product != nil {
        return SearchResult{
            Type:    "EXACT",
            Product: product,
        }, nil
    }

    // Fuzzy match (slower, but flexible)
    matches := pc.fuzzyMatch(query, topN: 5)

    if len(matches) == 0 {
        return SearchResult{Type: "NOT_FOUND"}, nil
    } else if len(matches) == 1 {
        return SearchResult{
            Type:    "UNIQUE",
            Product: matches[0],
        }, nil
    } else {
        return SearchResult{
            Type:       "AMBIGUOUS",
            Candidates: matches,
        }, nil
    }
}
```

**Tests:**
- [ ] Load products.yaml without error
- [ ] Exact match: "logitech gpro x superlight" → Logitech G Pro X Superlight
- [ ] Fuzzy match: "gpro x" → Logitech G Pro X Superlight
- [ ] Fuzzy match: "razer da v3" → Razer DeathAdder V3
- [ ] Case insensitive: "LOGITECH" → matches
- [ ] Not found: "made up product" → NOT_FOUND
- [ ] Ambiguous: "logitech" → returns 5 logitech products

---

## Phase 4: Backend Services (Days 10-15)

### 4.1 Cache Service

**File:** `backend/services/cache.go`

**Functionality:**
- Abstract interface for caching (can be in-memory or Redis)
- Get/Set operations with TTL
- Cache invalidation

**Implementation:**
```go
package services

import (
    "encoding/json"
    "time"
)

type CacheStore interface {
    Get(key string, dest interface{}) (bool, error)
    Set(key string, value interface{}, ttl time.Duration) error
    Delete(key string) error
    Clear() error
}

// In-memory implementation (MVP)
type InMemoryCache struct {
    data map[string]cacheEntry
    mu   sync.RWMutex
}

type cacheEntry struct {
    value      []byte
    expiration time.Time
}

func (ic *InMemoryCache) Get(key string, dest interface{}) (bool, error) {
    ic.mu.RLock()
    defer ic.mu.RUnlock()

    entry, exists := ic.data[key]
    if !exists {
        return false, nil
    }

    if time.Now().After(entry.expiration) {
        return false, nil // Expired
    }

    return true, json.Unmarshal(entry.value, dest)
}

func (ic *InMemoryCache) Set(key string, value interface{}, ttl time.Duration) error {
    data, err := json.Marshal(value)
    if err != nil {
        return err
    }

    ic.mu.Lock()
    defer ic.mu.Unlock()

    ic.data[key] = cacheEntry{
        value:      data,
        expiration: time.Now().Add(ttl),
    }
    return nil
}
```

**Cache Key Strategy:**
- Format: `recommendation:{product_id}:{hash(preferences)}`
- Ensures different preference sets cache separately

**Tests:**
- [ ] Set and Get work correctly
- [ ] Expired entries return false
- [ ] Delete removes entry
- [ ] Concurrent access doesn't cause panics

---

### 4.2 Price Search Service (LLM-Powered)

**File:** `backend/services/price_search.go`

**Functionality:**
- Call LLM with web search capability
- Parse prices for each condition tier
- Validate prices (reject outliers)
- Return structured price data

**Implementation Strategy:**

1. **Prompt Design** - Create structured prompt that returns JSON:
```
You are a price researcher. Search the web for:
"{product_name}" prices across these conditions:
- Brand New
- Like New
- Good
- Well Used

Return JSON only (no explanation):
{
  "brand_new": [89.99, 92.50, 88.00],
  "like_new": [70.00, 72.50, 68.00],
  "good": [55.00, 57.50, 52.00],
  "well_used": [35.00, 38.00, 32.00]
}

Rules:
- Get at least 3 prices per condition
- Include UK/EU prices in GBP
- Only include active listings (not sold)
- Ignore outliers (prices >2x median are suspicious)
```

2. **Implementation:**
```go
type PriceData struct {
    BrandNew  []float64 `json:"brand_new"`
    LikeNew   []float64 `json:"like_new"`
    Good      []float64 `json:"good"`
    WellUsed  []float64 `json:"well_used"`
}

func (ps *PriceSearchService) Search(productName string) (*PriceData, error) {
    prompt := buildSearchPrompt(productName)

    response, err := ps.llmClient.CallWithWebSearch(prompt)
    if err != nil {
        return nil, err
    }

    var prices PriceData
    if err := json.Unmarshal([]byte(response), &prices); err != nil {
        return nil, err
    }

    // Validate prices
    if err := ps.validatePrices(&prices); err != nil {
        return nil, err
    }

    return &prices, nil
}

func (ps *PriceSearchService) validatePrices(prices *PriceData) error {
    // Check each tier has at least 3 prices
    // Check no prices are negative or zero
    // Check for outliers (prices >2x median)
    return nil
}
```

**Tests:**
- [ ] Mock LLM response → Correctly parses JSON
- [ ] Validation rejects prices with <3 entries per tier
- [ ] Validation rejects outliers
- [ ] Error handling for timeout
- [ ] Error handling for invalid JSON

---

### 4.3 LLM Client Service

**File:** `backend/services/llm_client.go`

**Functionality:**
- Initialize Claude/Gemini API client
- Call reasoning endpoint
- Parse structured responses
- Handle errors and retries

**Implementation:**
```go
type LLMClient struct {
    client *anthropic.Client // or OpenAI, Gemini
    model  string
}

func NewLLMClient(apiKey, model string) *LLMClient {
    return &LLMClient{
        client: anthropic.NewClient(apiKey),
        model:  model,
    }
}

// For web search (price search)
func (lc *LLMClient) CallWithWebSearch(prompt string) (string, error) {
    // Use Claude API with web search tool
    // Implementation depends on chosen LLM provider
}

// For reasoning (recommendations)
func (lc *LLMClient) CallWithStructuredOutput(prompt string, schema interface{}) (interface{}, error) {
    // Use JSON mode or structured output
    // Parse response into given schema
}

func (lc *LLMClient) GenerateRecommendation(
    productName string,
    prices *services.PriceData,
    prefs *models.Preferences,
) (*models.RecommendationResponse, error) {
    prompt := buildRecommendationPrompt(productName, prices, prefs)

    response, err := lc.CallWithStructuredOutput(prompt, &models.RecommendationResponse{})
    if err != nil {
        return nil, err
    }

    return response.(*models.RecommendationResponse), nil
}
```

**Prompt for Recommendations:**
```
Product: {product_name}

Prices (GBP):
- Brand New: £{avg}, range £{min}-£{max}
- Like New: £{avg}, range £{min}-£{max}
- Good: £{avg}, range £{min}-£{max}
- Well Used: £{avg}, range £{min}-£{max}

User Preferences:
- Budget Flexibility: {0-10} (0=tight budget, 10=flexible)
- Condition Standards: {0-10} (0=don't care, 10=pristine)
- Hassle Tolerance: {0-10} (0=willing to fix, 10=plug & play)

Return JSON with top 3 recommendations ranked by fit:
{
  "recommendations": [
    {
      "rank": 1,
      "condition": "...",
      "avg_price": X,
      "savings_vs_new": {"absolute": X, "percent": X},
      "justification": "..."
    }
  ],
  "reasoning": "...",
  "confidence_score": "High|Medium|Low"
}
```

**Tests:**
- [ ] Mock LLM response → Correctly parsed
- [ ] Handles API errors gracefully
- [ ] Retries on transient errors
- [ ] Structured output matches schema

---

### 4.4 Recommendation Handler

**File:** `backend/handlers/recommendation.go`

**Functionality:**
- HTTP endpoint: POST /api/recommend
- Orchestrate services (catalog → cache → price search → LLM)
- Return formatted response

**Implementation:**
```go
func (h *RecommendationHandler) GetRecommendation(c *gin.Context) {
    // 1. Parse request
    var req models.RecommendationRequest
    if err := c.BindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": "Invalid request"})
        return
    }

    // 2. Search product catalog
    searchResult := h.productCatalog.Search(req.Item)

    if searchResult.Type == "NOT_FOUND" {
        c.JSON(404, gin.H{"error": "Product not found"})
        return
    }

    if searchResult.Type == "AMBIGUOUS" {
        c.JSON(200, gin.H{
            "disambiguation": searchResult.Candidates,
        })
        return
    }

    // 3. Check cache
    cacheKey := h.buildCacheKey(searchResult.Product.ID, req.Preferences)
    var cached *models.RecommendationResponse
    if found, _ := h.cache.Get(cacheKey, &cached); found {
        c.JSON(200, cached)
        return
    }

    // 4. Search prices (call LLM)
    prices, err := h.priceSearch.Search(searchResult.Product.CanonicalName)
    if err != nil {
        c.JSON(500, gin.H{"error": "Price search failed"})
        return
    }

    // 5. Generate recommendation (call LLM)
    recommendation, err := h.llmClient.GenerateRecommendation(
        searchResult.Product.CanonicalName,
        prices,
        &req.Preferences,
    )
    if err != nil {
        c.JSON(500, gin.H{"error": "Recommendation generation failed"})
        return
    }

    // 6. Cache result
    h.cache.Set(cacheKey, recommendation, time.Duration(h.config.CacheTTL)*time.Second)

    // 7. Return response
    c.JSON(200, recommendation)
}
```

**Tests:**
- [ ] Valid product search → Returns recommendation
- [ ] Invalid product → Returns 404
- [ ] Ambiguous search → Returns disambiguation list
- [ ] Cache hit → Returns cached result (test with fake cache)
- [ ] Malformed request → Returns 400

---

## Phase 5: Frontend Integration & API Connection (Days 16-18)

### 5.1 API Service

**File:** `frontend/src/services/api.js`

**Functionality:**
- Wrapper around fetch API
- Call /api/recommend endpoint
- Error handling and retry logic
- Timeout management

**Implementation:**
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export async function getRecommendation(item, preferences) {
  try {
    const response = await fetch(`${API_URL}/api/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        item,
        preferences,
      }),
      timeout: 60000, // 60 seconds
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API error:', error);
    throw error;
  }
}
```

---

### 5.2 Connect Components to API

**Update:** `frontend/src/App.jsx`

**Steps:**
- [ ] Add state for API response
- [ ] Create async function to call API
- [ ] Wire SearchBar submit → API call
- [ ] Show loading state during API call
- [ ] Display results on success
- [ ] Display error on failure
- [ ] Handle disambiguation from API

**Implementation Pattern:**
```jsx
async function handleSearch(query) {
  setState(s => ({ ...s, isLoading: true, error: null }));

  try {
    const result = await getRecommendation(query, state.preferences);

    if (result.disambiguation) {
      setState(s => ({
        ...s,
        currentStep: "disambiguation",
        disambiguation: result.disambiguation
      }));
    } else {
      setState(s => ({
        ...s,
        currentStep: "results",
        recommendations: result.recommendations,
        // ... other fields
      }));
    }
  } catch (error) {
    setState(s => ({
      ...s,
      currentStep: "error",
      error: error.message,
    }));
  } finally {
    setState(s => ({ ...s, isLoading: false }));
  }
}
```

**Tests:**
- [ ] Search product → API called with correct payload
- [ ] Success response → Results displayed
- [ ] Error response → Error message shown
- [ ] Disambiguation response → Disambiguation component shown
- [ ] Loading state shows during API call
- [ ] Can retry after error

---

### 5.3 Marketplace Links (eBay/CeX)

**File:** `frontend/src/lib/marketplaceLinks.js`

**Functionality:**
- Generate marketplace search URLs based on condition and product
- Open in new tab

**Implementation:**
```javascript
export function generateEbayLink(productName, condition) {
  const conditionMap = {
    "Brand New": "1000",     // eBay condition code
    "Like New": "3000",
    "Good": "4000",
    "Well Used": "5000",
  };

  const baseUrl = "https://www.ebay.co.uk/sch/i.html";
  const params = new URLSearchParams({
    _nkw: productName,
    LH_ItemCondition: conditionMap[condition],
  });

  return `${baseUrl}?${params}`;
}

export function generateCexLink(productName, condition) {
  // Similar for CeX.io marketplace
}

export function openMarketplaceSearch(link) {
  window.open(link, '_blank');
}
```

**Update RecommendationDisplay:**
- [ ] Add button for each ranking: "Find on eBay"
- [ ] onClick → generateLink + openMarketplaceSearch

---

## Phase 6: Testing & Refinement (Days 19-24)

### 6.1 Manual Integration Testing

**Goal:** Test full workflow end-to-end

**Test Cases:**

1. **Happy Path:**
   - [ ] Start dev servers (frontend + backend)
   - [ ] Search for "Logitech G Pro X Superlight"
   - [ ] Adjust sliders to various positions
   - [ ] See recommendation results
   - [ ] Click "Find Like New listings" → Opens eBay

2. **Disambiguation:**
   - [ ] Search for "Logitech" (ambiguous)
   - [ ] See list of Logitech products
   - [ ] Click one product
   - [ ] Get recommendation for selected product

3. **Cache Testing:**
   - [ ] Search for product → Takes 30-45 seconds
   - [ ] Search same product again → Returns <1 second (from cache)

4. **Error Cases:**
   - [ ] Search for "made up product" → Shows "not found"
   - [ ] Adjust sliders to different values → Recommendation changes
   - [ ] Network error simulation → Shows error message

5. **UI/UX:**
   - [ ] Responsive on mobile
   - [ ] Good loading state feedback
   - [ ] Readable typography and contrast
   - [ ] Smooth animations

**Documentation:**
- [ ] Create `TESTING.md` with test procedures
- [ ] Document expected results

---

### 6.2 Prompt Optimization

**Goal:** Refine LLM prompts for better outputs

**Iterations:**
1. Run 10 searches with various slider combinations
2. Evaluate recommendations:
   - Does top recommendation match your intuition?
   - Is reasoning sensible?
   - Do prices match market reality?
3. Adjust prompt if outputs are poor
4. Test again

**Track Results:**
- [ ] Create `PROMPT_TESTING.md`
- [ ] Log test case: (product, sliders) → recommendation → evaluation
- [ ] Note any improvements

---

### 6.3 Product Catalog Expansion

**Goal:** Expand from 20 to 50+ products

**Steps:**
- [ ] Use tool for actual searches
- [ ] Note products you search for
- [ ] Add top 10 missing products to catalog
- [ ] Test fuzzy matching
- [ ] Refine aliases based on real queries

---

## Phase 7: Deployment (Days 25-26)

### 7.1 Environment Setup

**Frontend Deployment (Vercel):**
- [ ] Create `.env.production`
- [ ] Set VITE_API_URL to backend URL
- [ ] Install Vercel CLI: `npm i -g vercel`
- [ ] Deploy: `vercel deploy --prod`
- [ ] Test: Visit deployed URL

**Backend Deployment (Fly.io):**
- [ ] Install Fly CLI
- [ ] Create Dockerfile (Go app)
- [ ] Deploy: `flyctl deploy`
- [ ] Get URL and update frontend env

**Alternative:** Cloudflare Pages (frontend) + Cloudflare Workers (backend)

---

### 7.2 Production Checklist

- [ ] CORS configured (allow frontend domain)
- [ ] API keys stored securely (environment variables)
- [ ] Error logging enabled (Sentry optional)
- [ ] Rate limiting configured (prevent abuse)
- [ ] Cache TTL set appropriately (24 hours)
- [ ] README with setup instructions
- [ ] .env.example with all required keys

---

## Phase 8: Real-World Testing & Iteration (Weeks 5-8)

### 8.1 Use for Real Purchases

**Goal:** Validate recommendations in practice

**Process:**
- [ ] Plan 5-10 actual purchases
- [ ] Use tool before purchase
- [ ] Track recommendation vs. actual choice
- [ ] Note accuracy and any issues
- [ ] Document feedback

**Scoring:**
- ✅ Recommendation was my choice → Success
- ⚠️ Recommendation was second choice, but I picked differently for good reason → Partial
- ❌ Recommendation didn't match my intuition → Failure

**Target:** >75% accuracy

---

### 8.2 Iterate Based on Reality

**Common Issues & Fixes:**

| Issue | Fix |
|-------|-----|
| Prices are stale/inaccurate | Reduce cache TTL to 12 hours, add "Refresh prices" button |
| Recommendations ignore my stated preferences | Refine prompt to weight preferences more explicitly |
| No used market exists for product | Add special case handling in LLM prompt |
| Fuzzy matching fails for common queries | Expand aliases in product catalog |
| API too slow (>60 seconds) | Add progress indicator, optimize prompts |

---

## Success Criteria for MVP Completion

### Phase 4 (End Goal):

**Functionality:**
- [ ] Search for 20+ products by name
- [ ] Disambiguation for ambiguous searches
- [ ] Get recommendation in 30-45 seconds
- [ ] Results cached for 24 hours (sub-1 second on repeat)
- [ ] Link to marketplace listings for each tier

**Quality:**
- [ ] No crashes or errors during normal use
- [ ] Recommendations make intuitive sense
- [ ] Prices match market reality
- [ ] UI is clean and usable on desktop & mobile

**Documentation:**
- [ ] Setup instructions (README)
- [ ] API contract documented
- [ ] Product catalog explained
- [ ] Deployment guide

**Deployment:**
- [ ] Live on web (Vercel/Cloudflare Pages)
- [ ] API running (Fly.io/Cloudflare Workers)
- [ ] Can be shared with others

---

## File Structure Summary (Modular Monolith)

```
secondsense/
│
├── backend/                          # Go monolith (single binary)
│   ├── src/
│   │   ├── products/                 # Product Module
│   │   │   ├── product_service.go    # Business logic: matching, fuzzy search
│   │   │   ├── product_repository.go # Data access: load catalog, YAML parsing
│   │   │   └── handlers.go           # HTTP handlers (if separate endpoints)
│   │   │
│   │   ├── prices/                   # Price Module
│   │   │   ├── price_service.go      # Business logic: orchestrate LLM search
│   │   │   ├── llm_client.go         # Call Claude API for web search
│   │   │   ├── validators.go         # Price validation, outlier detection
│   │   │   └── handlers.go           # HTTP handlers
│   │   │
│   │   ├── recommendations/          # Recommendation Module
│   │   │   ├── recommendation_service.go  # Business logic: ranking, scoring
│   │   │   ├── prompt_builder.go     # Build LLM prompts
│   │   │   ├── response_parser.go    # Parse LLM JSON responses
│   │   │   └── handlers.go           # HTTP handlers
│   │   │
│   │   ├── shared/                   # Shared Infrastructure (used by all modules)
│   │   │   ├── cache.go              # In-memory cache implementation
│   │   │   ├── config.go             # Load environment variables
│   │   │   ├── domain/
│   │   │   │   └── types.go          # All domain types & structs
│   │   │   ├── http_client.go        # Reusable HTTP client utilities
│   │   │   └── logger.go             # Logging utilities (optional)
│   │   │
│   │   └── main.go                   # Entry point: router setup, initialization
│   │
│   ├── data/
│   │   └── products.yaml             # Product catalog database
│   │
│   ├── go.mod
│   ├── go.sum
│   ├── .env.example
│   ├── Dockerfile
│   └── README.md
│
├── frontend-service/                 # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── SearchBar.tsx         # Product search input
│   │   │   ├── PersonalisationSliders.tsx
│   │   │   ├── RecommendationDisplay.tsx
│   │   │   ├── ProductDisambiguation.tsx
│   │   │   ├── LoadingState.tsx
│   │   │   ├── ErrorState.tsx
│   │   │   └── ui/                   # shadcn/ui components
│   │   ├── hooks/
│   │   │   └── useRecommendation.ts
│   │   ├── services/
│   │   │   ├── api.ts                # HTTP client for backend
│   │   │   └── marketplaceLinks.ts
│   │   ├── lib/
│   │   │   ├── utils.ts
│   │   │   ├── types.ts              # TypeScript interfaces (mirror Go types)
│   │   │   └── constants.ts
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── Dockerfile
│   └── README.md
│
├── docs/
│   ├── ARCHITECTURE.md                # Detailed module architecture
│   ├── API.md                         # HTTP API documentation
│   ├── SETUP.md                       # Developer setup guide
│   ├── TESTING.md                     # Testing procedures
│   └── DEPLOYMENT.md                  # Deployment guide
│
├── .env.example                       # Shared environment variables
├── CLAUDE.md                          # Project instructions
├── plan.md                            # This file
└── secondsens.md                      # Original specification
```

### Module Responsibilities:

| Module | Responsibility | Input | Output |
|--------|-----------------|-------|--------|
| **Products** | Match user query to product catalog | Query string | Canonical product name or disambiguation list |
| **Prices** | Fetch prices across condition tiers | Product name | Price data (arrays per condition) |
| **Recommendations** | Rank options & generate reasoning | Prices + preferences | RecommendationResponse (rankings, reasoning, stats) |
| **Shared** | Infrastructure for all modules | - | Cache, config, types, HTTP utilities |

---

## Key Decisions & Rationale

### Architecture
1. **Modular Monolith:** Single Go binary with clear module separation. Simpler deployment than microservices, no inter-process communication overhead, easier to debug and test initially.
2. **Module Boundaries:** Each module (products, prices, recommendations) owns its business logic but shares infrastructure (cache, config, types). Modules import each other directly.
3. **Single HTTP Entry Point:** Frontend calls `/api/recommend` which orchestrates all modules internally. No need for service-to-service HTTP calls.

### Technology Choices
4. **Single Go Binary:** All modules compile into one executable. Easy deployment, minimal operational complexity for MVP.
5. **React + TypeScript + Vite:** Modern frontend with type safety and fast HMR development experience.
6. **shadcn/ui Components:** Pre-built accessible components save development time vs. custom Tailwind components.
7. **Shared Domain Types:** Single source of truth for data types (Go structs) used across all modules.

### Data & Performance
8. **LLM Web Search (MVP):** Fastest to implement, works across any product without custom scraping. Migrate to dedicated scrapers only if costs become prohibitive.
9. **In-Memory Cache (MVP):** Simple for personal project, no external dependencies. Upgrade to Redis later if needed.
10. **24hr Cache TTL:** Balances freshness vs. API costs (used prices don't change hourly).
11. **YAML Product Catalog:** Simple, version-controllable, easy to iterate and expand.

### Migration Path
12. **Can migrate to microservices later:** If a single module becomes a bottleneck, extract it to a separate service with minimal refactoring (modules already have clear boundaries).
13. **No architectural lock-in:** Module structure is identical to microservice structure—just extract a module's package into its own binary and add HTTP handlers.

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| LLM hallucinated prices | Validate prices (reject outliers), show confidence scores |
| Slow API responses | Progress indicator, optimize prompts, aggressive caching |
| Product not found | Fuzzy matching + disambiguation, expand catalog |
| API rate limits | Aggressive caching, use free tier LLMs (Groq, Gemini) |
| CORS issues in prod | Configure CORS headers in backend |
| Cache size grows unbounded | Implement max cache size, evict oldest entries |

---

## Next Steps

1. **Week 1:** Complete Phases 1-2 (setup + basic components)
2. **Week 2:** Complete Phase 3 (product catalog + matching)
3. **Week 3:** Complete Phase 4 (backend services)
4. **Week 4:** Complete Phase 5 (frontend integration)
5. **Weeks 5-8:** Phase 6-8 (testing, refinement, real-world use)

**Expected MVP Completion:** 8 weeks total

