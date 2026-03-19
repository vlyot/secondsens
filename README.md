# SecondSens

AI-powered recommendations on whether to buy a product new or used. Enter any product, tune your preferences, and get a data-backed verdict with real-time pricing across condition tiers.

**Live:** [secondsens.vercel.app](https://secondsens.vercel.app)

---

## Features

- **Smart recommendations** — Gemini analyses condition tiers, real-time prices, and your preferences to recommend Buy New or Buy Used with a confidence score and reasoning
- **Compare mode** — run two products side-by-side in a single request, rendered as dual-column results with a summary banner
- **Real-time pricing** — live price ranges per condition tier (New / Like New / Good / Fair) via Gemini
- **Personalisation sliders** — tune budget sensitivity, quality tolerance, and risk aversion; save as presets
- **Product disambiguation** — when a search is ambiguous, shows matching products with thumbnails to confirm
- **Search history** — saved searches with full recommendation replay, paginated (requires sign-in)
- **Auth** — passwordless magic link sign-in via Supabase OTP
- **Share links** — `?s=<base64>` URLs encode product + preferences for instant replay by anyone
- **Dark / light mode**
- **Docs page** — in-app documentation

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite 7 |
| Styling | Tailwind CSS v4, shadcn/ui (new-york style), Lucide icons |
| Animation | Framer Motion |
| Backend | Go 1.24, Gin |
| LLM | Google Gemini (`gemini-2.5-flash`) |
| Auth + DB | Supabase (OTP magic link, Postgres via REST) |
| Hosting | Vercel (frontend), Render (backend) |

---

## Project Structure

```
secondsens/
├── frontend/                  # React SPA — path alias @/* maps here
│   ├── pages/                 # One file per AppStep
│   │   ├── Landing.tsx
│   │   ├── SearchPage.tsx
│   │   ├── PreferencesPage.tsx
│   │   ├── ResultsPage.tsx
│   │   ├── ErrorPage.tsx
│   │   ├── DocsPage.tsx
│   │   ├── AuthPage.tsx
│   │   ├── HistoryPage.tsx
│   │   └── ProfilePage.tsx
│   ├── components/
│   │   ├── ui/                # shadcn/ui + custom base components
│   │   ├── layout/            # BackgroundLayout, etc.
│   │   ├── ErrorBoundary.tsx  # React error boundary
│   │   ├── ErrorState.tsx
│   │   ├── FlowBreadcrumbs.tsx
│   │   ├── LoadingState.tsx
│   │   ├── PersonalisationSliders.tsx
│   │   ├── ProductDisambiguation.tsx
│   │   ├── ProductThumbnail.tsx
│   │   ├── RecommendationDisplay.tsx
│   │   ├── SearchBar.tsx
│   │   └── SearchHistoryCard.tsx
│   ├── context/
│   │   └── AuthContext.tsx    # Supabase session, useAuth() hook
│   ├── services/
│   │   └── api.ts             # All fetch calls
│   ├── lib/
│   │   ├── types.ts           # TypeScript interfaces mirroring Go structs
│   │   ├── constants.ts       # API_URL, DEFAULT_PREFERENCES, PRESETS
│   │   ├── utils.ts           # cn() utility
│   │   ├── supabase.ts        # Singleton Supabase client (anon key)
│   │   └── marketplaceLinks.ts
│   └── App.tsx                # State machine + top-level providers
├── backend/
│   └── src/
│       ├── main.go            # Gin router, CORS allowlist, rate limiting
│       ├── shared/            # Config, TTL cache, Gemini client, Supabase client, JWT middleware
│       ├── products/          # YAML catalog, fuzzy search, LLM validation
│       ├── prices/            # Real-time price fetch via Gemini (+ optional eBay)
│       ├── recommendations/   # Ranked Buy New/Used via Gemini; compare mode pipeline
│       ├── history/           # Auth-gated search history (Supabase-backed)
│       ├── images/            # Product image OG scraping
│       └── docs/              # Auto-generated Swagger spec (never edit manually)
├── data/
│   └── products.yaml          # Product catalog
├── docs/                      # Developer references
│   ├── typography.md
│   ├── shadcn-workflow.md
│   └── component-examples.md
├── public/
│   └── icon.png               # App icon
├── index.html                 # Vite entry point + SEO/OG meta tags
├── vite.config.ts
├── vercel.json                # Vercel build + SPA rewrite config
└── CLAUDE.md                  # Project guidelines for Claude Code
```

---

## Navigation (State Machine)

Navigation is a state machine in `frontend/App.tsx` — there is no React Router.

```
AppStep = 'landing' | 'search' | 'sliders' | 'results' | 'disambiguation'
        | 'compare_disambiguation' | 'error' | 'docs' | 'auth' | 'history' | 'profile'
```

- `landing`, `search`, `docs` render full-page outside the card layout
- All other steps render inside `BackgroundLayout → Card`
- `FlowBreadcrumbs` renders step progress + auth nav (History / Profile / Sign in icons)

### Compare Mode

`AppState` carries `isCompareMode`, `compareQuery`, `compareProduct`, `compareRecommendation`, `compareDisambiguation`. The `compare_disambiguation` step handles ambiguous compare-side products independently of the primary flow. Results render dual-column with a `CompareSummaryBanner`.

### Share Links

`?s=<base64>` on mount auto-runs the encoded product + preferences. `encodeSharePayload` / `decodeSharePayload` live in `App.tsx`. `sessionStorage` guards against double-invoke in React Strict Mode.

---

## API

Base URL: `https://secondsens.onrender.com`
Swagger UI: `https://secondsens.onrender.com/swagger/index.html`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | — | Health check |
| GET | `/api/products` | — | Full product catalog |
| GET | `/api/products/popular` | — | Trending searches |
| GET | `/api/products/search?q=` | — | Fuzzy search + LLM validation |
| POST | `/api/recommend` | — | Full recommendation pipeline |
| GET | `/api/history` | Bearer | Paginated saved searches |
| POST | `/api/history` | Bearer | Save a search result |

### POST /api/recommend

```json
{
  "product": "Sony WH-1000XM5",
  "preferences": {
    "budget_sensitivity": 7,
    "quality_tolerance": 4,
    "risk_aversion": 6
  },
  "compare_product": "Bose QuietComfort 45"
}
```

Omit `compare_product` for single mode. Include it for compare mode — response shape becomes `{ primary: RecommendationResponse, compare: RecommendationResponse }`.

Rate limited: burst of 5 requests, refills at 3/minute per IP.

---

## Development Setup

### Prerequisites

- Node.js 20+
- Go 1.24+
- A [Google Gemini API key](https://aistudio.google.com/apikey)
- Supabase project (optional — disables auth + history if absent)

### Install

```bash
git clone https://github.com/vlyot/secondsens
cd secondsens
npm install
```

### Configure

Create `backend/.env` (copy from `backend/.env.example`):

```env
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash

# Optional — disables auth + history if unset
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret

# Optional — restricts CORS in production; leave empty for local dev
CORS_ALLOWED_ORIGINS=
```

Create `.env` at repo root (Vite reads from here, not `frontend/`):

```env
VITE_API_BACKEND_URL=http://localhost:8080
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Run

```bash
npm start            # Backend + frontend concurrently (recommended)
npm run dev          # Frontend only (Vite HMR on :5173)
npm run dev:backend  # Backend only (Go on :8080)
```

### Build & Test

```bash
npm run build        # TypeScript check → Vite production build → dist/
npm run lint         # ESLint
npm run test:run     # Vitest single run

# Backend (run from backend/)
go build ./...
go test ./...
go vet ./...
# Regenerate Swagger after changing handler annotations:
go run github.com/swaggo/swag/cmd/swag@latest init -g src/main.go -o docs
```

---

## Deployment

### Frontend → Vercel

- Root directory: `.` (repo root — `vite.config.ts` is here)
- Build command: `npm run build`
- Output directory: `dist`
- Env vars: `VITE_API_BACKEND_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

`vercel.json` is already configured at the repo root.

### Backend → Render

- Root directory: `backend/`
- Build command: `go build -o server ./src/main.go`
- Start command: `./server`
- Env vars: see `backend/.env.example`

After deploying both, set `CORS_ALLOWED_ORIGINS=https://secondsens.vercel.app` in Render and add `https://secondsens.vercel.app/**` to Supabase → Authentication → URL Configuration → Redirect URLs.

---

## Caching

- **Product validation**: 10,000 entries, 7-day TTL
- **Recommendations**: 10,000 entries, 24-hour TTL
- Cache key: FNV32 hash of preferences + canonical product name
- Compare mode checks each product's cache independently — a hit on one costs zero extra Gemini calls

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Notes |
|----------|----------|-------|
| `GEMINI_API_KEY` | Yes | [Get one here](https://aistudio.google.com/apikey) |
| `GEMINI_MODEL` | No | Default: `gemini-2.5-flash` |
| `PORT` | No | Default: `8080`; set automatically by Render |
| `SUPABASE_URL` | For auth/history | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | For auth/history | Never expose to frontend |
| `SUPABASE_JWT_SECRET` | For auth/history | Dashboard → Settings → API → JWT Secret |
| `CORS_ALLOWED_ORIGINS` | Production | Comma-separated allowed origins |
| `EBAY_APP_ID` | No | Falls back to Gemini for prices if unset |

### Frontend (`.env` at repo root)

| Variable | Notes |
|----------|-------|
| `VITE_API_BACKEND_URL` | Default: `http://localhost:8080` |
| `VITE_SUPABASE_URL` | Required for auth |
| `VITE_SUPABASE_ANON_KEY` | Safe to expose (anon/public key) |

---

## Developer Docs

- [docs/typography.md](docs/typography.md) — Typography component reference
- [docs/shadcn-workflow.md](docs/shadcn-workflow.md) — shadcn/ui workflow and philosophy
- [docs/component-examples.md](docs/component-examples.md) — Real-world code patterns
- [frontend/CLAUDE.md](frontend/CLAUDE.md) — Frontend coding guidelines
- [backend/CLAUDE.md](backend/CLAUDE.md) — Backend coding guidelines