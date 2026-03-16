# SecondSense Improvement Plan

## Status
Core flow complete (Phases 1–5 of original roadmap). This plan covers UI/UX polish, features, and accessibility improvements.

> Search history is deferred — it will be implemented as part of the upcoming User Profiles feature.

> **Preference Overhaul (completed):** The 3-slider system was replaced with 6 orthogonal preferences — Budget Flexibility, Quality Priority, Risk Tolerance (sliders + toggles) and Use Frequency, Deal Urgency, Resale Priority (segmented pill selectors). Gemini prompt updated accordingly. Phase 1 emoji/icon work and Phase 6/6.5 toggle + context work were completed as part of this overhaul.

---

## Phase 1 — Emoji Removal ✅
**Files:** `frontend/components/PersonalisationSliders.tsx`, `frontend/components/ErrorState.tsx`

- Replace `getEmojiForBudget()`, `getEmojiForCondition()`, `getEmojiForHassle()` emoji returns with FontAwesome or Lucide icon components
- Replace `💡` in `ErrorState.tsx` suggestion text with a `faLightbulb` / `Lightbulb` icon
- All icons must have `aria-hidden={true}` as they are decorative

---

## Phase 2 — API Timeout & Loading Message
**Files:** `frontend/services/api.ts`, `frontend/App.tsx`

- Add `AbortController` with a 60-second timeout to the `fetchRecommendation` call
- On timeout, surface a specific error: "The request timed out — the backend may be slow. Please try again."
- Remove hardcoded "~30-45 seconds" from the loading message in `App.tsx`; replace with "Fetching real-time prices, this may take a moment…"

---

## Phase 3 — Breadcrumbs for Multi-Step Flow
**Files:** New `frontend/components/FlowBreadcrumbs.tsx`, `frontend/pages/SearchPage.tsx`, `frontend/pages/PreferencesPage.tsx`, `frontend/pages/ResultsPage.tsx`

- Create `FlowBreadcrumbs` component using shadcn/ui `Breadcrumb`
- Steps: **Search** → **Preferences** → **Results**
- Active step highlighted; completed steps are clickable (navigate back)
- Add to `SearchPage`, `PreferencesPage`, and `ResultsPage` — NOT on `Landing.tsx`

---

## Phase 4 — Vertical Stack Layout Fix
**Files:** `frontend/pages/PreferencesPage.tsx`

- Change button row from `flex gap-3` to `flex flex-col sm:flex-row gap-3` so buttons stack on narrow viewports
- Audit all other pages for similar horizontal overflow issues

---

## Phase 5 — Consistent Theme Toggle
**Files:** `frontend/pages/Landing.tsx`, `frontend/pages/SearchPage.tsx`

- Add `ModeToggle` component to `Landing.tsx` and `SearchPage.tsx`
- Position top-right, consistent with other pages

---

## Phase 6 — Custom Context Input ✅
**Files:** `frontend/pages/PreferencesPage.tsx` (or `frontend/components/PersonalisationSliders.tsx`), `frontend/App.tsx`, `frontend/services/api.ts`, `backend/src/...` (prompt injection)

- Add a shadcn/ui `Textarea` below the sliders, max 150 characters
- Label: "Anything specific?" with placeholder: "e.g. must include original box, UK seller only…"
- Show a live character counter below the textarea
- Pass value through `App.tsx` state → API request body as optional `context` field
- Backend `/api/recommend` must accept `context` and inject it into the LLM prompt
- This could include specifcs. For example, a user might include which apple chip for a macbook (m5 pro for example)

## Phase 6.5 — Mark Sliders As Irrelevant ✅

If a user wants to mark a slider : say hassle tolerance, as somnething they do not consider, they can toggle a switch so that the LLM knows that that slider does not need to be considered.
---

## Phase 7 — "None of the Above" in Disambiguation
**Files:** `frontend/components/ProductDisambiguation.tsx`, `frontend/App.tsx`

- Add a "None of these" option at the bottom of the product list in `ProductDisambiguation`
- On selection, call an `onNoneSelected` callback (passed from `App.tsx`)
- In `App.tsx`, handle by clearing disambiguation state and returning to `SearchPage` with the original query pre-filled

---

## Phase 8 — Marketplace URL Encoding
**Files:** `frontend/lib/marketplaceLinks.ts`

- Wrap product name in `encodeURIComponent()` when constructing eBay and CeX search URLs
- Prevents broken links for products with spaces, ampersands, or special characters

---

## Phase 9 — Accessibility Fixes
**Files:** `frontend/components/RecommendationDisplay.tsx`, `frontend/components/LoadingState.tsx`, `frontend/components/PersonalisationSliders.tsx`

- `RecommendationDisplay`: Add `aria-label` to each pricing section (e.g. `aria-label="Brand New pricing"`)
- `LoadingState`: Move focus to loading container on mount via `useEffect` + `ref.focus()`; restore focus on unmount
- `PersonalisationSliders`: Add `aria-hidden={true}` to replaced icons; add `sr-only` span with descriptive text for each slider section label
- Audit all animated components for `prefers-reduced-motion` — ensure `useReducedMotion` hook is applied consistently

---

## Deferred
- **Search history** — tied to User Profiles feature (next major phase)
- **Preference persistence** — tied to User Profiles feature

---

## Verification Checklist
- [ ] No emojis visible anywhere in the UI
- [ ] Loading state times out after 60s with a clear message
- [ ] Breadcrumbs show correct active step on each inner page
- [ ] Narrow viewport (375px): all layouts stack vertically
- [ ] Theme toggle visible on all pages
- [ ] Custom context input appears below sliders, enforces 150-char limit
- [ ] "None of these" exits disambiguation and returns to search
- [ ] Marketplace links work for products with special characters
- [ ] `npm run lint` passes with no new errors
