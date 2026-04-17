# Atomic Design

Atomic Design is a methodology for creating design systems, introduced by Brad Frost. It breaks UI components into five hierarchical levels, from simplest to most complex.

## The Five Levels

### 1. Atoms
Basic HTML elements that can't be broken down further. They are the smallest functional units.
- Examples: `Button`, `Input`, `Badge`, `Label`, `Separator`, `Card`
- In this project: existing components in `components/ui/`

### 2. Molecules
Simple groups of atoms that function together as a unit.
- Example: A `Label` + `Input` grouped together = `UrlInput` molecule
- Example: A list of `SelectorItem` atoms with an "Add" button = `SelectorList` molecule
- In this project: `components/scrape/SelectorItem.tsx`, `components/scrape/SelectorList.tsx`

### 3. Organisms
Complex UI components composed of molecules and atoms. They have distinct functionality.
- Example: `ScrapeForm` — a full configuration panel with URL input, selector list, JS toggle, and submit button
- Example: `ScrapeResults` — a results display with loading state, error display, and JSON output
- In this project: `components/scrape/ScrapeForm.tsx`, `components/scrape/ScrapeResults.tsx`

### 4. Templates
Page-level layouts that arrange organisms into a structure.
- Example: `ScrapeLayout` — a two-column grid with `ScrapeForm` on the left and `ScrapeResults` on the right
- In this project: `components/scrape/ScrapeLayout.tsx`

### 5. Pages
Instances of templates with real content (data, auth state, etc.).
- Example: `app/scrape-v1/page.tsx` — the public scrape page
- Example: `app/(dashboard)/scrape/page.tsx` — the authenticated dashboard scrape page

## Component Inventory

### Atoms

#### `SelectorItem`
A single selector row with a name input, type selector (CSS/XPath), and value input.
- **Props:** `selector`, `index`, `onUpdate`, `onRemove`
- **State:** Fully controlled by parent

#### `UrlInput`
A labeled text input for the scrape URL.
- **Props:** `value`, `onChange`
- **State:** Fully controlled by parent

### Molecules

#### `RenderJsToggle`
A toggle button for the "Render JS" option.
- **Props:** `enabled`, `onToggle`
- **State:** Fully controlled by parent

#### `ScrapeSubmitButton`
The submit button with loading spinner state.
- **Props:** `loading`, `disabled`, `onClick`
- **State:** Fully controlled by parent

#### `SelectorList`
A list of `SelectorItem` components with an "Add" button.
- **Props:** `selectors`, `onAdd`, `onRemove`, `onUpdate`
- **State:** Fully controlled by parent

### Organisms

#### `ScrapeForm`
The left panel: URL input, selector list, JS toggle, and submit button.
- **Props:** `scrapeState`, `onScrape`, `onClear`
- **State:** Owns URL, selectors, JS toggle state internally; exposes submit via callback

#### `ScrapeResults`
The right panel: displays loading/error/success states with JSON output.
- **Props:** `result`, `submitting`, `error`
- **State:** Fully controlled by parent

### Templates

#### `ScrapeLayout`
Two-column grid layout with `ScrapeForm` and `ScrapeResults`.
- **Props:** Inherited from `ScrapeContext`
- **State:** Managed via `ScrapeContext`

## Context

`ScrapeContext` provides shared state between `ScrapeForm` and `ScrapeResults`:
- `url`, `setUrl`
- `selectors`, `setSelectors`
- `renderJs`, `setRenderJs`
- `submitting`, `setSubmitting`
- `result`, `setResult`

## Props Strategy

All scrape components are configurable via props. No hardcoded API calls inside organisms.

**ScrapeForm props:**
```typescript
interface ScrapeFormProps {
  // Callbacks for the parent to handle the actual scrape logic
  onSubmit: (data: { url: string; selectors: Selector[]; renderJs: boolean }) => void
  disabled?: boolean
}
```

**ScrapeResults props:**
```typescript
interface ScrapeResultsProps {
  result: ScrapeResult | null
  submitting: boolean
  error?: string
}
```

This allows both the public scrape (SSE flow) and dashboard scrape (direct POST) to share the same UI components while handling the API call differently in their respective pages.
