# Hubbell Civil War Dashboard — Session Summary
## March 31, 2026 | Parallel Lives Tab Overhaul

---

### Overview

In a single intensive session, the Parallel Lives tab — the default and most compelling view in the Hubbell Civil War dashboard — received a comprehensive UX overhaul across five major areas plus a deep rework of the letter detail panel. All changes target the single file `hubbell-dashboard.html`.

The work was guided by a plan-first approach: a detailed implementation plan was drafted and approved before any code was written, with changes ordered by dependency (standalone CSS first, zoom infrastructure second, dependent features last).

---

### 1. KPI Cards: Centering + Date Accuracy

**Problem:** The 5 brother name cards used CSS Grid with `repeat(4, 1fr)`, leaving the orphan 5th card left-aligned on its own row. Date spans showed day-of-month ("Jun 6") which is less meaningful than the year for historical ranges.

**Solution:**
- Converted `.kpi-row` from Grid to **flexbox** with `justify-content: center` — orphan cards center automatically
- `formatDateShort()` now returns `"Jun 1861"` instead of `"Jun 6"`
- Responsive breakpoint updated for flex layout

---

### 2. Battle/Event Label Legibility

**Problem:** Event labels (battles, key dates) rendered at a fixed position below the timeline and collided at default zoom, creating an unreadable cluster of rotated text.

**Solution:**
- Increased `margin.bottom` from 50px to 80px for label breathing room
- Replaced simple `EVENTS.forEach` loop with a **two-pass collision-avoidance system**:
  - Pass 1: Sort events by x-position, assign stagger tiers (bump to next tier if within 40px of a preceding label)
  - Pass 2: Render with vertical offset per tier (`tier * 14px`), add tick lines connecting staggered labels to their event line
- Naturally adaptive: dense clusters stagger at default zoom, labels spread out when zoomed in

---

### 3. Zoom Controls: +/-, Back, Reset with History

**Problem:** Only brush-drag zoom existed, with a simple Reset button. No way to step back through zoom levels, zoom incrementally, or undo a zoom.

**Solution:**
- Added `zoomHistory = []` stack — every zoom-changing action calls `pushZoomState()` first
- `zoomInCenter()` / `zoomOutCenter()` — shrink/expand range by 30% centered on viewport
- `zoomBack()` — pops from history stack (unlimited undo depth)
- `resetZoom()` now pushes state before resetting (Back can undo it)
- `updateZoomButtonVisibility()` manages button show/hide state
- HTML controls bar: `+` / `−` buttons, `← Back` button, pushed right with flex spacer
- All zoom paths (brush, buttons, pan) feed through the same history system

---

### 4. Click Passthrough Fix

**Problem:** The brush overlay `<rect>` rendered after letter dots in SVG markup, sitting on top and intercepting all clicks/hovers. Users couldn't click dots to read letters.

**Solution:**
- Moved the brush overlay rect **before** the dots section in SVG document order — dots now render on top and receive events natively
- Changed cursor from `crosshair` to `default` (drag hint text is sufficient)
- Brush still works because `mousemove`/`mouseup` handlers are on the SVG element itself

**Key insight:** SVG paints in document order. This was a one-line reorder, not a z-index hack.

---

### 5. Pan/Scroll Mechanics

**Problem:** When zoomed in, users had no way to pan across the timeline except zooming out and back in.

**Solution:**

**Scrollbar:**
- Custom scrollbar HTML below the SVG: `◀` arrow | proportional track with draggable thumb | `▶` arrow
- `updateScrollbar()` called at end of every `buildTimeline()` — positions thumb proportionally
- `panLeft()` / `panRight()` shift viewport by 25% of current range
- Thumb is draggable via mousedown/mousemove/mouseup with `requestAnimationFrame` throttling
- Only visible when zoomed in

**Right-click-drag panning:**
- Right-click + drag on the SVG pans the viewport
- Pixel-to-date conversion based on SVG viewBox geometry
- Clamped to full date range boundaries
- Context menu suppressed when zoomed
- Throttled via `requestAnimationFrame` for smooth performance

---

### 6. Letter Detail Panel — Vertical Condensing

**Problem:** The letter reader panel consumed excessive vertical space, requiring too much scrolling to read a letter. Line skips between paragraphs, header elements, and transcription line-height all contributed.

**Changes:**
- **Header condensed:** Date + author/recipient merged onto single line; date font 26px → 20px; header margin 20px → 8px
- **Location + badges merged:** Now share a single row separated by `|` divider instead of stacking vertically
- **Transcription reformatted:** Removed `white-space: pre-wrap` — single `\n` (paper line-wraps) collapsed to spaces; only `\n\n` creates paragraph breaks via `<p>` tags with 6px spacing. Line-height 1.85 → 1.5, font 15px → 14px
- **Editorial condensed:** Line-height 1.75 → 1.55, paragraph margin 10px → 6px, section margin 24px → 14px
- **Overall:** Panel padding 32px → 20px, grid gap 32px → 24px

**Result:** ~40% reduction in panel height for typical letters.

---

### 7. Location Enrichment

**Problem:** Ambiguous location names like "Harpers Ferry", "Camp McClellan", "Fort Royal" lacked geographic context — users couldn't place them without prior knowledge.

**Solution:**
- `enrichLocation()` function appends bracketed details at render time (not modifying source data)
- 16 curated enrichments including `[West Virginia / Virginia border]`, `[Front Royal, Virginia]`, `[near Frederick, Maryland]`, etc.
- Rendered as muted text to distinguish from original transcription data
- Preserves data provenance — enrichments are a display-layer concern

---

### 8. Interactive "People Mentioned" System

This was the deepest and most iteratively refined feature of the session.

#### Phase 1: Interactive Chips
- People rendered as clickable chips with mention count badges (e.g., `Capt. Reich ③`)
- Clicking opens an info panel showing role, total mention count, and per-letter excerpts

#### Phase 2: Contextual Excerpts
- Each mention shows a ~120-character excerpt from that specific letter with the person's name bolded
- `findPersonExcerpt()` searches for the name variant actually used in that letter's transcription

#### Phase 3: Letter Overlay
- Clicking a mention opens a **floating overlay panel** (not navigation away) preserving reader context
- Overlay includes: date, author/recipient, location, significance/emotion badges, **editorial summary** (indented italic block), and full transcription
- Person's name highlighted in yellow (`background: #FFF3CD`) throughout
- Auto-scrolls to first highlighted mention
- Closes via X button, Escape key, or clicking backdrop
- "View letter ›" affordance on hover for clear clickability

#### Phase 4: Identity Accuracy Overhaul (Critical Fix)

**Problem:** Initial fuzzy name matching (`namesOverlap`) matched on any shared 4+ character word. This caused catastrophic false positives:
- "Hubbell" linked ALL family members (6+ people)
- "James" linked James Hubbell, James Lucas, and standalone mentions
- "Albert" linked Albert Cook and Albert Contreras
- "S.P. Hubbell" showed 127 mentions (actually matching all "Hubbell" references)

**Solution:** Replaced fuzzy matching entirely with a **curated identity system:**
- `PERSON_ALIASES` — 30+ hand-verified alias groups, each representing one real person
- `findPersonMentions()` uses exact string match as primary, curated alias group as secondary
- Names not in any alias group get exact-match-only treatment (safe default)
- Carefully verified edge cases:
  - James Luther vs. Amos Luther (different people — split)
  - Albert Cook vs. Mr. Cook vs. F.A. Cook (father, relative — split)
  - Helen Scott vs. Lieut. Scott (civilian vs. officer — split)
  - Aunt Laura vs. Aunt Louise (different aunts — split)
  - Frances/Fannie variants all correctly linked to Frances Hubbell
  - Standalone first names ("Henry", "James") kept OUT of family alias groups

#### Phase 5: Full-Width Info Panel + Closure-Based Click Handling
- Person info panel moved to span full editorial column width (under both People and Places)
- Replaced fragile `JSON.stringify` → HTML attribute → `JSON.parse` pipeline with **direct closure-captured arrays** for click handlers, eliminating serialization edge cases

---

### 9. Golden "Same Day" Badge Fix

**Problem:** Small golden "Same day" / "±1d" text badges above the timeline were illegible at default zoom — too dense, overlapping, and redundant with the golden connector lines already showing the same information.

**Solution:**
- Badges now **hidden at default zoom** — only render when zoomed to < 365 days visible
- When visible, use the same collision-avoidance stagger algorithm as event labels
- Golden connector lines (already present) communicate the relationship at all zoom levels

---

### Technical Decisions & Design Principles

| Decision | Rationale |
|----------|-----------|
| Flexbox over Grid for KPIs | Orphan centering is automatic; Grid requires explicit column defs |
| SVG document order over z-index | SVG has no z-index; paint order = markup order. Simpler, no hacks |
| Zoom history as array stack | Minimal undo pattern — push before change, pop to undo. Zero complexity |
| Curated aliases over fuzzy matching | Genealogical data defeats fuzzy heuristics (shared surnames, common names). Hand-verified is more accurate AND more maintainable for ~200 unique names |
| `formatTranscription()` over pre-wrap | Original `\n` are paper-width artifacts, not authorial intent. Collapsing them to spaces with `\n\n` paragraph breaks is the correct semantic interpretation |
| Closures over JSON serialization | Eliminates an entire class of escaping bugs (quotes, backslashes in names like `Frances (\`) |
| Display-layer enrichment | `enrichLocation()` adds context without modifying source data, preserving provenance |

---

### Architecture Notes

All changes are in a single file (`hubbell-dashboard.html`) which contains:
- Inline CSS (~600 lines of styles for the Parallel Lives tab)
- HTML structure with SVG timeline, detail panel, and overlay elements
- JavaScript: data arrays (LETTERS, EVENTS), rendering functions, interaction handlers
- The `buildTimeline()` function is the core rendering pipeline — called on every zoom/pan/color change
- Person identity system: `PERSON_ALIASES` → `_personCanonical` lookup → `findPersonMentions()` → `findPersonExcerpt()` → `openLetterOverlay()`

---

### What's Next

Potential future improvements identified during this session:
- Wheel-to-zoom on the SVG (natural trackpad gesture)
- Touch/mobile support for pan and zoom
- Person identity graph visualization (who appears together in letters)
- Timeline annotations for letter clusters / gaps in correspondence
- Search/filter by person mentioned across all letters
