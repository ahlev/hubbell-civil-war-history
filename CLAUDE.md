# Hubbell Civil War Ancestry — Project Instructions

## Overview
Interactive data visualization dashboard for 273 transcribed Civil War letters from the Hubbell family (1861–1870). Single-file HTML dashboard (`hubbell-dashboard.html`) with multiple tabbed views.

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
