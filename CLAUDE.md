# Hubbell Civil War Ancestry — Project Instructions

## Overview
Interactive data visualization dashboard for 273 transcribed Civil War letters from the Hubbell family (1861–1870). Single-file HTML dashboard (`hubbell-dashboard.html`) with multiple tabbed views.

## Current Phase — Visibility, Cross-Reference & Outreach
**Status: PENDING — planned 2026-05-18, scaffolded 2026-05-19. Awaiting "go" from user before execution begins.**

Shipping a cross-reference engine v1 + press kit + first-wave personalized outreach within ~6 weeks. Positioning is **AI-enabled historian/archivist**.

Two coordinated plans drive the work:
- **`tasks/outreach-plan.md`** — visibility / press kit / outreach execution playbook (positioning, outlet taxonomy, message frameworks, decision points).
- **`tasks/phase-3-plan.md`** — cross-reference & discrepancy detection execution playbook (per-brother source pulls, LLM-mediated verification, discrepancy registry, methodology paper). Delivers the cross-reference engine v1 that outreach Phase 1A depends on.
- **`docs/PHASE-3-PLAN.md`** — the architectural / methodological spec behind `tasks/phase-3-plan.md`. File layout, disambiguation rubric integration, confidence model, definition of done. **The spec wins where the task plan diverges.**

Phase 3 scaffolding in place (no data yet): `03-data/external-sources/{README.md, methodology/disambiguation-rubric.md}`, `04-analysis/phase-3-discrepancies/INDEX.md`. Awaiting user input on rubric TODO-1 and NARA pension-order decision before pulls begin.

Prior phases (transcription, knowledge graph, visualizations, novel, web platform) are complete or descoped. See `tasks/todo.md` for legacy phase tracking.

**Parallel active track — Experience Refinement Sprint (`v2-ui` branch, Phase 5d, ACTIVE 2026-07-16):** pre-outreach UI sprint on the three interactive surfaces (Map That Moves playback/camera, Wellness Ledger push drawer, People Web d3-force rebuild + mobile). **Rails: `tasks/ui-refinement-sprint-PLAN.md`** — decisions in §1 are locked; work runs as three `/goal` sub-sprints (§6). Phase 6 outreach waits on this sprint.

**Parallel active track — V2 Visual Revamp (`v2-ui` branch, Phase 5c):** the cinematic oil-painting aesthetic of the v2 landing (`experience-v2/landing.html`) is being carried across the site. LIVE: the landing, `the-collection.html`'s preservation masthead, and animated portrait heroes via the shared `.hero-loop` component (`_hero.css` / `_hero.js`). Plan + status: `tasks/site-v2-graphic-revamp-PLAN.md` (Execution Log) and `tasks/PROJECT-PHASES.md` §5c.

**One canonical bio per person (2026-07-02):** the `who-they-were.html` individual "stage" view (portrait left + inline service table + footprint map + People Web pill + kin strip) is the ONLY user-facing bio. The dedicated `brother-*.html` / `mother-frances.html` pages are **redirect stubs** — an instant `location.replace('who-they-were.html#<id>')` in `<head>` — kept ONLY because the stage view fetches its `.narrative` prose from them (DOMParser ignores the redirect script). Do NOT link to those pages; all bio links use `who-they-were.html#<henry|alexander|charles|james|mother>`. Editing narrative chapters still happens in the stub files.

## Architecture
- **Single file**: `hubbell-dashboard.html` contains all CSS, HTML, SVG rendering, and JavaScript
- **Data**: `LETTERS` array (~2000 lines, lines 2780–4751) and `EVENTS` array embedded in the file
- **Core rendering**: `buildTimeline()` is the main pipeline — called on every zoom/pan/color change
- **Person identity**: `PERSON_ALIASES` → `_personCanonical` lookup → `findPersonMentions()` → curated, not fuzzy

## Key Conventions
- All letter data has: `id`, `date`, `author`, `recipient`, `location`, `significance`, `emotion`, `transcription`, `editorial`, `people[]`, `places[]`, boolean flags (`hasBattle`, `hasIllness`, etc.)
- Author codes: `henry`, `alexander`, `james`, `charles`, `mother`
- Zoom state: `zoomDateMin`/`zoomDateMax` (null = full range), `zoomHistory[]` stack
- Color modes: `author` (default) or `recipient`

## Critical Rules
- **Never use fuzzy name matching** for person identity — use curated `PERSON_ALIASES` only (see feedback_identity_matching.md)
- **Preserve data provenance** — display-layer enrichments (like `enrichLocation()`) must not modify source data
- **Transcription formatting**: collapse single `\n` to spaces, only `\n\n` creates paragraph breaks — original line breaks are paper-width artifacts
- Use `parseDate(str)` for all date parsing (appends `T12:00:00` to avoid timezone issues)
- SVG paint order = z-index (brush overlay must render BEFORE dots in markup)
- **Animated hero loops** use the shared `.hero-loop` component (`_hero.css` / `_hero.js`): poster-first `<img>` + lazy `<video>` with child `<source>` (webm + mp4), `autoplay muted loop playsinline`. Brother hero assets are **locked to the landing filmstrip** (`experience-v2/landing.html`): Henry=`loop-henry`, Alexander=`loop-alexander-fav`, James=`loop-james-wide`, Charles=`loop-charles`; posters = `brothers/web/window-*.webp`.
- **Cache-busting (`vercel.json`):** static assets (css/js/img/video) cache 1 day; HTML pages revalidate every load. When you change a shared `_*.css` / `_*.js` (e.g. `_hero.js`, `_scrollrail.js`), you MUST bump its `?v=N` query string on every page that links it — otherwise returning visitors keep the stale cached file (this is what caused hero loops to "freeze static on mobile").

## File Locations
- Dashboard: `hubbell-dashboard.html` (this directory)
- Source data: `03-data/all-letters.json`
- Letter files: `02-transcribed-markdown/LTR-YYYY-MM-DD-###.md`
- Internal docs (specs, plans, audits, session logs, goal-prompt archives): `docs/` and `docs/goals/` — root holds ONLY the live site surface (public HTML + `_*` assets), config, and this file
- Session logs: `docs/SESSION-SUMMARY-*.md`
- One-off data-pipeline scripts: `scripts/` (run from project root, e.g. `python scripts/validate_metadata.py`)
- Dev screenshots: `screenshots/dev/` (untracked; don't save working screenshots to root)

## System
- Platform: Windows/MSYS — use `python` not `python3`
- Source PDFs: `C:\Users\ahlev\OneDrive\Desktop\Hubbell Ancestry\`
