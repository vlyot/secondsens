# SecondSense - Phase 2 Detailed Implementation Plan

**Objective:** Implement core UI components and establish the component hierarchy with state management, preparing the frontend for API integration.

**Duration:** 5 days
**Expected Output:** Fully functional UI with internal state management (no API calls yet)

---

## Phase 2 Overview

### What Phase 2 Implements for MVP

Phase 2 builds the **complete user interface** and **state management layer** for SecondSense. This phase includes:

1. **SearchBar Component** - Product search input with validation
2. **PersonalisationSliders Component** - Three interactive sliders (budget, condition, hassle)
3. **RecommendationDisplay Component** - Display ranked recommendations and market stats
4. **ProductDisambiguation Component** - Handle ambiguous search results
5. **LoadingState & ErrorState Components** - Feedback during operations and errors
6. **App State Management** - Coordinate flow between all components

By the end of Phase 2, users can:
- Search for products
- Adjust preference sliders
- See a mock recommendation display
- Navigate between different UI states (search → sliders → results → error handling)

The key principle: **All components accept mocked data and manage state locally.** No API calls occur in Phase 2. API integration happens in Phase 5.

---

## Architecture & Key Principles

### State Flow

```
App (root state)
├─ searchQuery: string (current user input)
├─ currentStep: "search" | "sliders" | "results" | "disambiguation" | "error"
├─ selectedProduct: Product | null (after disambiguation)
├─ preferences: { budget_flexibility, condition_standards, hassle_tolerance } (0-10)
├─ mockRecommendation: RecommendationResponse | null (test data)
├─ isLoading: boolean (UI feedback during API calls in Phase 5)
├─ error: string | null (error message to display)
└─ disambiguation: Product[] | null (list of candidate products)
```

### Component Responsibilities

| Component | Input Props | Output Events | State | UI Pattern |
|-----------|-------------|---|-------|---|
| **SearchBar** | `onSearch(query)`, `isLoading` | Fires `onSearch` on submit | Local: `query` | Text input + button |
| **PersonalisationSliders** | `preferences`, `onPreferencesChange` | Fires `onPreferencesChange` on slide | Lifted to parent | Three sliders 0-10 |
| **RecommendationDisplay** | `data: RecommendationResponse` | `onFindListings(condition)` | None (presentational) | Cards with market stats |
| **ProductDisambiguation** | `products`, `onSelect`, `onCancel` | Fires `onSelect` or `onCancel` | None (presentational) | Modal or list |
| **LoadingState** | None (shown/hidden by App) | None | None (presentational) | Spinner + text |
| **ErrorState** | `error`, `onRetry` | Fires `onRetry` | None (presentational) | Error card + retry |

---

## Component Specifications

### 1. SearchBar Component

**File:** `src/components/SearchBar.tsx`

**Purpose:** Accept user input and submit product search queries.

#### Functions

1. **SearchBar (main component)** - Renders text input and submit button, manages local query state
2. **handleSubmit** - Validates input, prevents empty searches, calls `onSearch` callback
3. **validateQuery** - Checks query is non-empty and reasonable length (3-50 chars)

#### Props
```typescript
interface SearchBarProps {
  onSearch: (query: string) => void;  // Called when user submits
  isLoading: boolean;                  // Disables input during search
  placeholder?: string;                // Custom placeholder text
}
```

#### Tests
- [ ] User types in input → state updates
- [ ] Submit with empty input → no API call, input disabled
- [ ] Submit with valid input → `onSearch` called with query
- [ ] `isLoading=true` → input and button disabled, button shows "Searching..."
- [ ] Input clears after successful submit
- [ ] Keyboard Enter key triggers submit

#### Implementation Notes
- Use `useState` for local `query` state
- Input should have `type="text"` with sensible max-width
- Submit button shows different text based on `isLoading` state
- Prevent form submission with `e.preventDefault()`

---

### 2. PersonalisationSliders Component

**File:** `src/components/PersonalisationSliders.tsx`

**Purpose:** Allow users to adjust three preference dimensions on 0-10 scale with visual feedback.

#### Functions

1. **PersonalisationSliders (main component)** - Renders three slider groups
2. **Slider (sub-component)** - Reusable slider input with label and value display
3. **getEmojiForValue** - Returns emoji based on slider position to provide visual feedback
4. **handleSliderChange** - Updates parent state via callback

#### Props
```typescript
interface PersonalisationSlidersProps {
  preferences: Preferences;  // Current state
  onPreferencesChange: (prefs: Preferences) => void;  // Parent update callback
}

interface Preferences {
  budget_flexibility: number;   // 0-10
  condition_standards: number;  // 0-10
  hassle_tolerance: number;     // 0-10
}
```

#### Tests
- [ ] Render three sliders labeled "Budget Flexibility", "Condition Standards", "Hassle Tolerance"
- [ ] Initial values render correctly from props
- [ ] Drag slider → `onPreferencesChange` fires with updated value
- [ ] Emoji changes as slider moves (0-3: 💸, 4-6: 💰, 7-10: 🤑 for budget as example)
- [ ] Display current value as "X/10" next to each slider
- [ ] All three sliders work independently (moving one doesn't affect others)
- [ ] Cannot move slider outside 0-10 range

#### Implementation Notes
- Each slider has HTML `<input type="range" min="0" max="10" />`
- Store emoji logic in a helper function for maintainability
- Each slider updates only its field in preferences object
- Sub-component `Slider` is presentational (no state)
- Consider using Tailwind for responsive layout

---

### 3. RecommendationDisplay Component

**File:** `src/components/RecommendationDisplay.tsx`

**Purpose:** Present ranked recommendations with market statistics, savings info, and call-to-action buttons.

#### Functions

1. **RecommendationDisplay (main component)** - Top-level layout orchestrator
2. **RankingCard** - Displays single ranked option with condition, price, savings
3. **MarketStatsTable** - Renders market tier averages and ranges
4. **formatPrice** - Formats numbers with £ symbol and 2 decimals
5. **formatPercent** - Formats percentage with % sign and handling edge cases

#### Props
```typescript
interface RecommendationDisplayProps {
  data: RecommendationResponse;
  onFindListings: (condition: string) => void;  // Called when user clicks "Find listings"
}

interface RecommendationResponse {
  product_name: string;
  recommendations: RankedOption[];  // Top 3 ranked
  market_stats: MarketStats;
  reasoning: string;
  confidence_score: string;
  timestamp: string;
}
```

#### Tests
- [ ] Render product name as heading
- [ ] Display all 3 ranked recommendations
- [ ] Each recommendation shows: Rank, Condition, Avg Price (£X.XX), Price Range (£X-Y)
- [ ] Savings section shows absolute (£X) and percentage (X%) off RRP
- [ ] Market stats table shows: Brand New, Like New, Good, Well Used with avg price and range
- [ ] Confidence score displays as badge (High/Medium/Low with color)
- [ ] Reasoning text is readable and justified
- [ ] "Find Listings" button for each rank fires `onFindListings` with condition
- [ ] Responsive on mobile (cards stack vertically)
- [ ] Prices always formatted with currency symbol and 2 decimals

#### Implementation Notes
- Use shadcn/ui components where available (e.g., Card, Badge, Button)
- Display recommendations as separate cards or list items
- Market stats table should be clear and scannable
- Consider using Lucide icons for condition tiers (new = 🟢, like new = 🟡, etc.)
- Format prices using helper function to ensure consistency

---

### 4. ProductDisambiguation Component

**File:** `src/components/ProductDisambiguation.tsx`

**Purpose:** Handle cases where user search matches multiple products; allow selection of intended product.

#### Functions

1. **ProductDisambiguation (main component)** - Renders modal/overlay with product list
2. **ProductOption** - Renders single product as selectable item
3. **handleSelect** - Calls parent callback with selected product
4. **handleCancel** - Closes disambiguation without selection

#### Props
```typescript
interface ProductDisambiguationProps {
  products: Product[];
  onSelect: (product: Product) => void;
  onCancel: () => void;
}

interface Product {
  id: string;
  canonical_name: string;
  category: string;
  aliases: string[];
}
```

#### Tests
- [ ] Render list of products with canonical names
- [ ] Each product clickable and calls `onSelect` with product
- [ ] Close/Cancel button calls `onCancel`
- [ ] Show count: "Found X matches for your search"
- [ ] Render "Try more specific search" option
- [ ] Product items highlight on hover
- [ ] Keyboard: Escape key calls `onCancel`
- [ ] Modal blocks interaction with background

#### Implementation Notes
- Render as modal/overlay (can use shadcn Dialog if available)
- Show product category as secondary text
- Consider showing common aliases to help users identify correct product
- Make it clear this is a selection step, not an error

---

### 5. LoadingState Component

**File:** `src/components/LoadingState.tsx`

**Purpose:** Provide visual feedback during API calls and long-running operations.

#### Functions

1. **LoadingState (main component)** - Renders spinner and loading message
2. **Spinner** - Animated spinner graphic (CSS animation or Lucide icon)

#### Props
```typescript
interface LoadingStateProps {
  message?: string;  // Optional custom message
  progress?: number; // 0-100 for progress bar (optional)
}
```

#### Tests
- [ ] Render spinner animation
- [ ] Show default message: "Searching for prices across conditions..."
- [ ] Show custom message if provided
- [ ] Message visible and readable
- [ ] Spinner continues animating until unmounted
- [ ] (Optional) Progress bar shows 0-100% if provided

#### Implementation Notes
- Use Lucide `Loader2` icon with `animate-spin` class or custom CSS animation
- Center on screen with flex layout
- Dim background to indicate blocking operation
- Keep message concise and user-friendly

---

### 6. ErrorState Component

**File:** `src/components/ErrorState.tsx`

**Purpose:** Display errors with actionable recovery options.

#### Functions

1. **ErrorState (main component)** - Renders error message and retry button
2. **handleRetry** - Calls parent callback to retry operation

#### Props
```typescript
interface ErrorStateProps {
  error: string;
  onRetry: () => void;
  suggestion?: string;  // Optional: "Try searching for a different product"
}
```

#### Tests
- [ ] Display error message
- [ ] Display optional suggestion
- [ ] "Retry" button calls `onRetry`
- [ ] Error text visible and readable
- [ ] Clear visual hierarchy (error message prominent)
- [ ] (Optional) Show error icon

#### Implementation Notes
- Use red/warning color scheme
- Keep error message user-friendly (don't expose raw backend errors)
- Provide helpful suggestions when possible
- "Retry" button should clearly indicate action

---

## App State Management

**File:** `src/App.tsx`

### State Structure

```typescript
interface AppState {
  // UI Flow
  currentStep: 'search' | 'sliders' | 'results' | 'disambiguation' | 'error';

  // Search
  searchQuery: string;
  selectedProduct: Product | null;

  // Preferences
  preferences: Preferences;

  // Results (mock data in Phase 2)
  mockRecommendation: RecommendationResponse | null;

  // Loading/Error
  isLoading: boolean;
  error: string | null;

  // Disambiguation
  disambiguation: Product[] | null;
}
```

### State Transitions

```
[SEARCH]
  ↓ (enter query)
[CHECK IF EXACT MATCH]
  ├─→ [NOT FOUND] → Show error, retry
  ├─→ [UNIQUE] → Go to [SLIDERS]
  └─→ [AMBIGUOUS] → Show [DISAMBIGUATION]

[DISAMBIGUATION]
  ↓ (select product)
  → [SLIDERS]

[SLIDERS]
  ↓ (adjust preferences, submit)
  → [RESULTS] (in Phase 2, use mock data)

[RESULTS]
  ↓ (search again)
  → [SEARCH]

[ERROR]
  ↓ (retry)
  → [SEARCH]
```

### Key Functions

1. **handleSearch(query: string)** - Process search query, check if exact/ambiguous/not found
2. **handleSelectProduct(product: Product)** - Move from disambiguation to sliders
3. **handlePreferencesChange(prefs: Preferences)** - Update preferences, don't auto-fetch (user controls flow)
4. **handleSubmitPreferences()** - Generate mock recommendation and go to results
5. **handleRetry()** - Clear error and return to search
6. **handleFindListings(condition: string)** - (Phase 5) Open marketplace link
7. **getMockRecommendation()** - Return realistic mock data for testing

### Mock Data Helper

Phase 2 should include a helper function that generates realistic mock recommendations:

```typescript
function getMockRecommendation(productName: string, preferences: Preferences): RecommendationResponse {
  // Return deterministic mock data based on product name
  // Simulate different recommendations for different slider values
  // Ensure UI looks good with realistic data
}
```

---

## Implementation Order (Day by Day)

### Day 1: Foundation & SearchBar
- [ ] Create component files: `SearchBar.tsx`
- [ ] Implement SearchBar with local state and validation
- [ ] Create mock product data in constants
- [ ] Update App.tsx with basic state structure
- [ ] Render SearchBar in App and test user input

### Day 2: Sliders & Mock Data
- [ ] Create `PersonalisationSliders.tsx` component
- [ ] Implement slider component with emoji feedback
- [ ] Update App state to handle preference updates
- [ ] Create mock product catalog (10-15 products for testing)
- [ ] Test slider interaction and state updates

### Day 3: Results Display
- [ ] Create `RecommendationDisplay.tsx` component
- [ ] Implement ranking cards and market stats table
- [ ] Create `getMockRecommendation()` helper
- [ ] Add formatters for prices and percentages
- [ ] Integrate into App flow (search → sliders → results)

### Day 4: Error & Disambiguation
- [ ] Create `LoadingState.tsx` and `ErrorState.tsx`
- [ ] Create `ProductDisambiguation.tsx`
- [ ] Update App to handle disambiguation flow
- [ ] Add error handling for edge cases (product not found, etc.)
- [ ] Implement retry flow

### Day 5: Polish & Integration
- [ ] Full end-to-end testing (search → sliders → results cycle)
- [ ] Responsive design on mobile
- [ ] Visual polish (spacing, colors, typography)
- [ ] Accessibility audit (semantic HTML, ARIA labels)
- [ ] Code cleanup and documentation

---

## Files to Create/Modify

### New Components
```
src/components/
├── SearchBar.tsx              ← Create
├── PersonalisationSliders.tsx ← Create
├── RecommendationDisplay.tsx  ← Create
├── ProductDisambiguation.tsx  ← Create
├── LoadingState.tsx           ← Create
├── ErrorState.tsx             ← Create
└── (existing ui/ folder for shadcn components)
```

### Modified Files
```
src/
├── App.tsx                    ← Update with state management
├── lib/types.ts               ← Add mock data type (optional)
├── lib/constants.ts           ← Add mock products and recommendations
└── services/api.ts            ← No changes (API calls in Phase 5)
```

---

## Testing Strategy for Phase 2

### Manual Testing
1. **Happy Path:** Search → Disambiguate → Sliders → Results
2. **Error Path:** Search not found → Error → Retry
3. **Slider Changes:** Adjust each slider and see state update
4. **Results Display:** Verify all data displays correctly
5. **Mobile Responsive:** Test on mobile viewport

### Mock Data Scenarios
1. **Exact Match:** "Logitech G Pro X Superlight" → Direct to sliders
2. **Ambiguous:** "Logitech" → Disambiguation list
3. **Not Found:** "made up product" → Error message
4. **Slider Extremes:** 0/10 vs 10/10 → Different recommendations generated

### Accessibility
- [ ] Tab navigation works through all inputs
- [ ] Color contrast meets WCAG AA standards
- [ ] Error messages are semantic (not just color)
- [ ] Form labels associated with inputs

---

## Success Criteria for Phase 2

By end of this phase:

✅ **Functionality:**
- Search input accepts and validates text
- Three sliders adjust from 0-10 with visual feedback
- Results display with mock data looks professional
- Disambiguation flow works end-to-end
- Error states provide clear feedback
- Can cycle through entire flow: search → sliders → results → search again

✅ **Code Quality:**
- All components are TypeScript with proper types
- Props are documented with JSDoc comments
- State management is centralized in App.tsx
- No prop drilling more than 2 levels deep

✅ **UI/UX:**
- Responsive on desktop, tablet, mobile
- Buttons and inputs have hover/focus states
- Loading states provide feedback
- Error messages are user-friendly
- Typography is readable with good contrast

✅ **Documentation:**
- Component files have function descriptions
- State transitions documented in App.tsx
- Mock data source documented

---

## Future Considerations (Phase 3+)

- API integration will replace mock data in Phase 5
- Marketplace links will be added to buttons in Phase 5
- Caching layer will be implemented in backend (Phase 4)
- Additional filters/preferences may be added later
- Analytics/logging can be added to track user flow

---

## Quick Reference: File Templates

All component files should follow this structure:

```tsx
import { useState } from 'react';
import type { PropsType } from '@/lib/types';

/**
 * ComponentName - Brief description
 *
 * @param props - Component props
 * @returns Rendered component
 */
export function ComponentName(props: PropsType) {
  // Implementation
}

export default ComponentName;
```

Use relative imports within components:
```tsx
import { Button } from '@/components/ui/button';  // shadcn/ui
import { MyComponent } from './MyComponent';       // Same folder
import type { MyType } from '@/lib/types';         // Types
```
