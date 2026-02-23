# Folio — Full App Context

A single reference for the entire Folio scrapbook app: architecture, data flow, functions, and component logic.

---

## 1. High-Level Overview

**Folio** is a digital scrapbook editor. Users sign in with email/password (Supabase Auth), then create **spreads** (two-page spreads). Each spread has:

- **Elements**: photos, text, stickers, shapes — each draggable, resizable, rotatable, with z-index layering.
- **Drawing strokes**: freehand lines drawn on a canvas layer, persisted as a single `doodle` element per spread.

All data lives in **Supabase** (Postgres + Storage + Realtime). The UI state (selection, tool, zoom, sidebar) and optimistic data live in **Zustand**. Every user action updates Zustand first (instant UI), then syncs to Supabase in the background. Real-time subscriptions keep other tabs in sync.

---

## 2. Tech Stack & Entry Points

| Layer | Technology |
|-------|------------|
| Build | Vite |
| UI | React 18, TypeScript |
| Routing | react-router-dom |
| State | Zustand |
| Backend | Supabase (Auth, Postgres, Storage, Realtime) |
| Drag/Resize | react-rnd |
| Export | html-to-image |
| Toasts | sonner |

**Entry:** `main.tsx` → renders `<App />`, loads `index.css`.

**App.tsx** wraps the app in: `QueryClientProvider` → `AuthProvider` → `TooltipProvider` → `Toaster` / `Sonner` → `BrowserRouter` → `Routes`. Routes:

- `/login` → `Login` page (unprotected).
- `/` → `ProtectedRoute` → `Index` (main app). Redirects to `/login` if not authenticated.
- `*` → `NotFound`.

---

## 3. Data Model & Types

**File:** `src/lib/types.ts`

### App-side types

- **`ToolMode`**: `'select' | 'draw'` — current tool.
- **`ElementType`**: `'photo' | 'text' | 'sticker' | 'shape' | 'doodle'`. `doodle` is only used in DB for drawing data; the UI never renders it as a SpreadElement.
- **`ShapeVariant`**: `'rectangle' | 'circle' | 'line' | 'arrow'`.

- **`SpreadElement`**: One item on a spread.
  - Common: `id`, `type`, `x`, `y`, `width`, `height`, `rotation`, `zIndex`.
  - Text: `text`, `fontFamily`, `fontSize`, `fontColor`, `bold`, `italic`.
  - Photo: `imageUrl`.
  - Sticker: `sticker` (emoji string).
  - Shape: `shapeVariant`, `fillColor`, `strokeColor`.

- **`DrawingStroke`**: One freehand stroke: `points: { x, y }[]`, `color`, `thickness`.

- **`Spread`**: `id`, `title`, `date`, `tags[]`, `elements: SpreadElement[]`, `drawingStrokes: DrawingStroke[]`.

### DB mapping types

- **`DbSpreadRow`**: Spread row from Postgres (`user_id`, `page_order`, `created_at`, `updated_at`, etc.).
- **`DbElementRow`**: Element row (`spread_id`, `z_index`, `data`, `style` jsonb, etc.). App uses `data` for single-value payloads (text content, image URL, sticker emoji); `style` for the rest.

---

## 4. Supabase & Environment

**File:** `src/lib/supabase.ts`

- `createClient(supabaseUrl, supabaseAnonKey)`.
- Env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (Vite exposes `import.meta.env.VITE_*`).

**Tables (conceptual):**

- **spreads**: `id`, `user_id`, `title`, `date`, `tags[]`, `page_order`, timestamps. RLS: user owns their rows.
- **elements**: `id`, `spread_id`, `type`, `x`, `y`, `width`, `height`, `rotation`, `z_index`, `data` (text), `style` (jsonb). RLS: user can access elements whose spread they own. Type `doodle` stores JSON array of `DrawingStroke[]` in `data`.

**Storage:** Bucket `scrapbook-images` (public). Photos stored at `{userId}/{uuid}.{ext}`; public URL is saved in the photo element’s `data` in DB.

---

## 5. Auth

**File:** `src/lib/auth.tsx`

- **AuthProvider**: React context that:
  - On mount: `supabase.auth.getSession()` then `onAuthStateChange` to keep `user` and `session` in state.
  - Exposes `user`, `session`, `loading`, `signIn(email, password)`, `signOut()`.
- **signIn**: `supabase.auth.signInWithPassword({ email, password })`; returns `{ error: string | null }`.
- **signOut**: `supabase.auth.signOut()`.
- **useAuth()**: hook to read the context; throws if used outside `AuthProvider`.

**Login page** (`src/pages/Login.tsx`): Form with email/password; on submit calls `signIn`, shows error or redirects (already logged-in users are redirected to `/`). No sign-up UI; users are created in Supabase dashboard.

---

## 6. API Layer (`src/lib/api.ts`)

All functions are async and throw on Supabase errors. Used by the store and (for upload) by components.

### Type conversion (internal)

- **elementToDbRow(el, spreadId)**: Maps `SpreadElement` → DB row. Puts text/imageUrl/sticker in `data`; font/shape/etc. in `style`.
- **dbRowToElement(row)**: Maps `DbElementRow` → `SpreadElement` (including `data`/`style` unpacking).

### Spreads

- **getSpreads(userId)**: `from('spreads').eq('user_id', userId).order('page_order')` → array of spread rows.
- **createSpread(userId, { id, title, date, tags, page_order? })**: Insert one row; returns created row.
- **updateSpread(id, { title?, date?, tags? })**: Partial update; sets `updated_at`.
- **deleteSpread(id)**: Delete spread (elements cascade in DB).

### Elements & drawing

- **getSpreadData(spreadId)**: Fetches all elements for the spread. Splits into:
  - `elements`: rows with `type !== 'doodle'` → converted to `SpreadElement[]`.
  - `drawingStrokes`: from the single `type === 'doodle'` row’s `data` JSON (array of `DrawingStroke`).
- **createElement(element, spreadId)**: Insert one element row (from `elementToDbRow`).
- **updateElement(id, element, spreadId)**: Update row by `id` (all fields except `id`/`spread_id`).
- **deleteElement(id)**: Delete one element row.
- **saveDoodleStrokes(spreadId, strokes)**: If a doodle row exists for the spread, update its `data` with `JSON.stringify(strokes)`; else if `strokes.length > 0`, insert a new doodle row.
- **clearDoodleStrokes(spreadId)**: Delete the doodle row for that spread.
- **uploadImage**: Re-exported from `storage.ts`.

---

## 7. Storage (`src/lib/storage.ts`)

- **uploadImage(file, userId)**: Uploads `file` to bucket `scrapbook-images` at path `{userId}/{uuid}.{ext}`. Returns **public URL** from `getPublicUrl(path)`. Used when adding a photo from toolbar or when replacing a photo by double-clicking a placeholder.

---

## 8. Zustand Store (`src/lib/store.ts`)

Single store: `useFolioStore`. Pattern: **optimistic update** — `set()` first for instant UI, then call API in background; on API failure, log and optionally toast (no automatic rollback).

### State (slices)

| State | Type | Meaning |
|-------|------|--------|
| `spreads` | `Spread[]` | All spreads for the current user (loaded once). |
| `activeSpreadId` | `string \| null` | Currently viewed spread. |
| `selectedElementId` | `string \| null` | Selected element on the active spread. |
| `activeTool` | `ToolMode` | `'select'` or `'draw'`. |
| `drawColor` / `drawThickness` | string / number | Drawing tool options. |
| `sidebarOpen` | boolean | Sidebar visibility. |
| `zoom` | number | Canvas scale (e.g. 0.3–2). |
| `loading` | boolean | True while `initialize()` is running. |
| `userId` | `string \| null` | Set after login; used for API and uploads. |

### Initialization

- **initialize(userId)**:
  1. Sets `loading: true`, `userId`.
  2. `api.getSpreads(userId)` → for each spread, `api.getSpreadData(row.id)` → build `Spread[]` with `elements` and `drawingStrokes`.
  3. Sets `spreads`, `activeSpreadId` (first spread or null), `loading: false`. On error: toast, then `loading: false`.

### Spread actions

- **setActiveSpread(id)**: `activeSpreadId = id`, `selectedElementId = null`.
- **addSpread()**: Creates new spread with `crypto.randomUUID()`, appends to `spreads`, sets `activeSpreadId`. Calls `api.createSpread(...)` in background; toast on error.
- **duplicateSpread(id)**: Finds spread, deep-clones with new ids for spread and all elements; appends to `spreads`. Then async: `createSpread`, then `createElement` for each, then `saveDoodleStrokes` if any; toast on error.
- **deleteSpread(id)**: Removes from `spreads`; if that was active, switches to first remaining. Calls `api.deleteSpread(id)` in background.
- **updateSpreadMeta(id, updates)**: Merges `title`/`date`/`tags` into the spread in state. **Debounced 800 ms** per spread id: after delay, calls `api.updateSpread(id, updates)`.

### Element actions

- **addElement(element)** (element is `Omit<SpreadElement, 'id' | 'zIndex'>`): Generates `id`, computes `zIndex = max(existing zIndex) + 1`, adds to active spread’s `elements`, sets `selectedElementId`, `activeTool = 'select'`. Calls `api.createElement(ne, activeSpreadId)` in background.
- **updateElement(elementId, updates)**: Merges `updates` into the element in the active spread; then `api.updateElement(elementId, merged, activeSpreadId)`.
- **deleteElement(elementId)**: Removes from active spread’s `elements`, clears `selectedElementId`. Calls `api.deleteElement(elementId)`.
- **duplicateElement(elementId)**: Clones element with new `id`, `x += 20`, `y += 20`, `zIndex = max + 1`; appends and selects. Calls `api.createElement(ne, activeSpreadId)`.
- **moveToFront(elementId)**: Sets that element’s `zIndex` to `max(zIndex) + 1` (via `updateElement`).
- **moveToBack(elementId)**: Sets `zIndex` to `min(zIndex) - 1` (via `updateElement`).

### UI state

- **selectElement(id)**, **setTool(tool)** (and clear selection when switching to draw), **setDrawColor**, **setDrawThickness**, **toggleSidebar**, **setZoom** (clamped 0.3–2). All synchronous.

### Drawing

- **addDrawingStroke(stroke)**: Appends stroke to active spread’s `drawingStrokes`. **Debounced 1 s**: after 1 s of no new strokes, calls `api.saveDoodleStrokes(activeSpreadId, spread.drawingStrokes)`.
- **clearDrawing()**: Sets active spread’s `drawingStrokes = []`, calls `api.clearDoodleStrokes(activeSpreadId)`.

Debounce state lives outside the store (module-level `Map` for spread meta timers, single timer for stroke save).

---

## 9. Real-time (`src/lib/realtime.ts`)

- **subscribeToRealtime()**: Creates one Supabase channel, subscribes to:
  - **elements** table: INSERT/UPDATE/DELETE. For `doodle`: update that spread’s `drawingStrokes` in the store. For other types: insert/update/delete the corresponding element in the matching spread (with duplicate-insert guard).
  - **spreads** table: INSERT/UPDATE/DELETE. Updates or removes spreads in the store; on DELETE, may reset `activeSpreadId` to first remaining.
- **unsubscribeFromRealtime()**: Removes channel. Called on Index unmount.

Used so that other tabs (or other clients) see changes without refresh.

---

## 10. Pages

### Index (`src/pages/Index.tsx`)

- **Layout**: TopBar, then flex row (SpreadsSidebar, Canvas), then SelectionMenu, BottomToolbar.
- **Effects:**
  - When `user` is set and not yet initialized: call `initialize(user.id)`, then `subscribeToRealtime()`. On unmount: `unsubscribeFromRealtime()`.
  - Global keydown: if not in input/textarea/select — Delete/Backspace → delete selected element; Escape → deselect; Ctrl/Cmd+D → duplicate selected. All call store actions.
- **Loading**: If `loading`, show spinner and “Loading your scrapbook…”.
- **Otherwise**: Render the layout; no spread is handled inside Canvas (empty state).

### Login (`src/pages/Login.tsx`)

- If auth `loading`, show “Loading…”.
- If `user` exists, `<Navigate to="/" replace />`.
- Form: email, password, submit → `signIn(email, password)`; display error or rely on redirect.

---

## 11. Components (Folio)

### TopBar (`src/components/folio/TopBar.tsx`)

- **Left**: Current spread’s title (input), date (input), tags (comma-separated input). All call `updateSpreadMeta(spread.id, { ... })`.
- **Right**: Zoom out/in buttons and percentage, Export PNG button, user email (truncated), Logout button (`signOut()`).
- **Export PNG**: Finds `#spread-capture` and its child `<canvas>` (drawing layer). Uses `toPng` with a filter to exclude the canvas; then draws the DOM result onto a new canvas and draws the drawing canvas on top; downloads the composite as `{spread.title}.png`. Toast on error.

### SpreadsSidebar (`src/components/folio/SpreadsSidebar.tsx`)

- Toggle button (top-left): `toggleSidebar`.
- Sliding panel: “Folio” title, “New Spread” button (`addSpread`), list of spreads. Each item: click → `setActiveSpread(spread.id)`; inline editable title and date via `updateSpreadMeta`; duplicate and delete buttons (`duplicateSpread`, `deleteSpread`). Tags shown as chips (read-only). Active spread visually highlighted.

### Canvas (`src/components/folio/Canvas.tsx`)

- **No active spread**: Empty state message (“Your scrapbook is empty”, “Open the sidebar…”).
- **With active spread**: Two “pages” (left/right) plus spine, total width `PAGE_WIDTH*2+2`, height `PAGE_HEIGHT`. Zoom applied via CSS `transform: scale(zoom)`.
- **Elements layer**: `pointer-events: none` when `activeTool === 'draw'` so drawing gets clicks. Elements rendered as `SpreadElement` in order of `zIndex`. Click on background → `selectElement(null)`.
- **Drawing layer**: `<DrawingLayer>` with `width`, `height`, `strokes={activeSpread.drawingStrokes}`. Always on top (z-index 50 in DrawingLayer).

### SpreadElement (`src/components/folio/SpreadElement.tsx`)

- **Wrapper**: `react-rnd` for position/size; `position` and `size` from `element`; `onDragStop` / `onResizeStop` call `updateElement` with new x,y and width,height. Dragging disabled when not select tool or when text is editing; resizing only when select tool and selected and not editing. `style.zIndex = element.zIndex`, `bounds="parent"`.
- **Click**: In select mode, `selectElement(element.id)`.
- **Double-click**: Text → set local `isEditing` (contentEditable); photo → open file input, on choose file upload via `uploadImage`, then `updateElement(element.id, { imageUrl })`.
- **Content by type**: Photo (img or placeholder icon), text (contentEditable div with font/style from element), sticker (emoji), shape (SVG rectangle/circle/line/arrow from `shapeVariant` and colors). Rotation applied as CSS `transform` on inner div.

### SelectionMenu (`src/components/folio/SelectionMenu.tsx`)

- Renders only when `selectedElementId` is set and that element exists on the active spread. Floating bar (centered under top bar) with:
  - Move to front/back, rotate ±15°, duplicate, delete (all call store).
  - **Text**: Font select, fontSize number input, color, Bold/Italic toggles → `updateElement(id, { ... })`.
  - **Shape**: Fill and stroke color inputs → `updateElement(id, { fillColor, strokeColor })`.

### BottomToolbar (`src/components/folio/BottomToolbar.tsx`)

- Hidden file input for images. Buttons:
  - **Select** / **Draw**: `setTool('select')` / `setTool('draw')`.
  - **Photo**: Trigger file input; on change, if `userId` then `uploadImage(file, userId)` then `addElement({ type: 'photo', ..., imageUrl })`; else add photo without URL.
  - **Text**: `addElement({ type: 'text', ... })`.
  - **Sticker**: Popover of emojis; click → `addElement({ type: 'sticker', sticker, ... })`.
  - **Shape**: Popover (rectangle/circle/line/arrow); click → `addElement({ type: 'shape', shapeVariant, ... })`.
  - When draw tool: color picker and thickness slider (`setDrawColor`, `setDrawThickness`).
- Toolbar has `overflow-x-auto` and `toolbar-scroll` (scrollbar hidden in CSS) for narrow screens.

### DrawingLayer (`src/components/folio/DrawingLayer.tsx`)

- **Canvas**: Absolute, full width/height; `pointer-events: auto` only when `activeTool === 'draw'`; `zIndex: 50`.
- **Render**: `useEffect` redraws all `strokes` (path from points, strokeStyle, lineWidth).
- **Mouse**: Down (draw mode) → start new stroke in ref. Move → append point, draw segment. Up/Leave → if stroke has enough points, `addDrawingStroke({ points, color, thickness })`. Strokes are persisted by the store’s debounced `saveDoodleStrokes`.

---

## 12. Data Flow Summary

1. **App load**: Auth resolves → ProtectedRoute renders Index → `initialize(user.id)` loads spreads + elements + doodles into Zustand → realtime subscribes.
2. **Spread CRUD**: Sidebar/top bar → store (optimistic) → API in background. Realtime can add/update/delete spreads in other tabs.
3. **Element CRUD**: Toolbar / SelectionMenu / SpreadElement (drag, resize, delete, duplicate, etc.) → store (optimistic) → API. Realtime syncs elements (and doodle data) across tabs.
4. **Drawing**: Draw on canvas → `addDrawingStroke` → store appends stroke → after 1 s debounce, `saveDoodleStrokes`. Realtime pushes doodle updates to other tabs.
5. **Export**: TopBar Export → DOM + canvas composite → PNG download.

---

## 13. Keyboard Shortcuts (Index)

- **Delete / Backspace**: Delete selected element (when focus not in input/textarea/select).
- **Escape**: Deselect.
- **Ctrl+D / Cmd+D**: Duplicate selected element.

---

## 14. File Structure (relevant)

```
src/
├── main.tsx
├── App.tsx
├── index.css
├── pages/
│   ├── Index.tsx      # Main app + init + shortcuts
│   ├── Login.tsx
│   └── NotFound.tsx
├── components/folio/
│   ├── TopBar.tsx
│   ├── SpreadsSidebar.tsx
│   ├── Canvas.tsx
│   ├── SpreadElement.tsx
│   ├── SelectionMenu.tsx
│   ├── BottomToolbar.tsx
│   └── DrawingLayer.tsx
└── lib/
    ├── supabase.ts    # Client
    ├── types.ts       # App + DB types
    ├── api.ts         # CRUD + type conversion
    ├── storage.ts     # Image upload
    ├── auth.tsx       # AuthProvider, useAuth
    ├── store.ts       # Zustand store
    ├── realtime.ts    # Supabase realtime subscriptions
    └── utils.ts       # cn() etc.
```

---

## 15. Constants

- **Canvas**: `PAGE_WIDTH = 480`, `PAGE_HEIGHT = 640` (single “page”); spread total width = `PAGE_WIDTH * 2 + 2` (spine).
- **Debounce**: Spread meta 800 ms; drawing strokes 1 s.
- **Zoom**: Clamped between 0.3 and 2 in `setZoom`.

This document is the single source of truth for how the Folio app is wired and how each part works.
