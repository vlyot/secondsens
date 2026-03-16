# Todo Items Implementation Plan (Phases 1–5)

## Phase 1 — "Daily Driver" Label Fix
**File**: `frontend/components/PersonalisationSliders.tsx`

Rename the three segment labels in the UI only:
- `occasional` → "Infrequent"
- `regular` → "Sometimes"
- `daily_driver` → "Daily"

Underlying API values remain unchanged.

---

## Phase 2 — Price Condition Integrity Check
**File**: `backend/src/recommendations/recommendation_service.go`

After computing `tierStats`, enforce avg price ordering: `brand_new ≥ like_new ≥ good ≥ well_used`. Clamp any inversions before passing data to the LLM.

---

## Phase 3 — New Product Exception Alert
**Files**:
- `backend/src/recommendations/recommendation_service.go`
- `backend/src/shared/domain/types.go`
- `frontend/lib/types.ts`
- `frontend/components/RecommendationDisplay.tsx`

Detect when all non-brand-new price arrays are empty (no secondhand market). Add `new_product_exception: bool` + `exception_message: string` to the response. Frontend renders a prominent alert when the flag is true.

---

## Phase 4 — Item Description in Results Panel
**Files**:
- `backend/src/recommendations/recommendation_service.go` — extend LLM prompt to return `product_description`
- `backend/src/shared/domain/types.go` — add `ProductDescription string` to response struct
- `frontend/lib/types.ts` — add `product_description?: string`
- `frontend/components/RecommendationDisplay.tsx` — render below product title using `Muted`/`Lead` typography

---

## Phase 5 — Buy New vs Secondhand Callout
**File**: `frontend/components/RecommendationDisplay.tsx`

Above ranked cards, add a bold callout:
> "Based on your preferences, you should purchase this **firsthand/secondhand**."

Logic: if `recommendations[0].condition === "Brand New"` → "firsthand", else → "secondhand". No backend changes needed.

---

## Verification
1. Phase 1 — Labels read "Infrequent / Sometimes / Daily"; API payload still sends original values
2. Phase 2 — No worst condition priced higher than a better condition in results
3. Phase 3 — New product search triggers the alert; ranked cards suppressed or noted
4. Phase 4 — Short product description appears below the product title
5. Phase 5 — Bold callout appears above ranked cards, reflects top recommendation correctly
