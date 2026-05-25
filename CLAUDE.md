# Hubbell Civil War Ancestry — Project Instructions

## Overview
Interactive data visualization dashboard for 273 transcribed Civil War letters from the Hubbell family (1861–1870). Single-file HTML dashboard (`hubbell-dashboard.html`) with multiple tabbed views.

## Current Phase — Visibility, Cross-Reference & Outreach
**Status: PENDING — planned 2026-05-18, scaffolded 2026-05-19. Awaiting "go" from user before execution begins.**

Shipping a cross-reference engine v1 + press kit + first-wave personalized outreach within ~6 weeks. Positioning is **AI-enabled historian/archivist**.

Two coordinated plans drive the work:
- **`tasks/outreach-plan.md`** — visibility / press kit / outreach execution playbook (positioning, outlet taxonomy, message frameworks, decision points).
- **`tasks/phase-3-plan.md`** — cross-reference & discrepancy detection execution playbook (per-brother source pulls, LLM-mediated verification, discrepancy registry, methodology paper). Delivers the cross-reference engine v1 that outreach Phase 1A depends on.
- **`PHASE-3-PLAN.md`** (project root) — the architectural / methodological spec behind `tasks/phase-3-plan.md`. File layout, disambiguation rubric integration, confidence model, definition of done. **The spec wins where the task plan diverges.**

Phase 3 scaffolding in place (no data yet): `03-data/external-sources/{README.md, methodology/disambiguation-rubric.md}`, `04-analysis/phase-3-discrepancies/INDEX.md`. Awaiting user input on rubric TODO-1 and NARA pension-order decision before pulls begin.

Prior phases (transcription, knowledge graph, visualizations, novel, web platform) are complete or descoped. See `tasks/todo.md` for legacy phase tracking.

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

## File Locations
- Dashboard: `hubbell-dashboard.html` (this directory)
- Source data: `03-data/all-letters.json`
- Letter files: `02-transcribed-markdown/LTR-YYYY-MM-DD-###.md`
- Session logs: `SESSION-SUMMARY-*.md`

## System
- Platform: Windows/MSYS — use `python` not `python3`
- Source PDFs: `C:\Users\ahlev\OneDrive\Desktop\Hubbell Ancestry\`
