# Press Kit v2 — Full Build Plan (industry standard for a humanities/technology/media project)
**Date:** 2026-07-07 · **Status:** SPEC — build items checked off as completed.
**Requirement (user, 2026-07-07):** a full press kit following industry best practices, plus an "about me" and direct, visible ownership of the project on the website.

## Architecture — two surfaces, one source of truth
- **Public press page on the site** (`press.html` → `/press`): the kit as a clean web page + a downloadable ZIP. This is what a journalist who gets a pitch actually visits. NOTE: the internal `press/` directory is deploy-gated by `.vercelignore` — the public page is built as a site page with its own asset copies; internal dossiers/tracker/drafts NEVER ship.
- **Internal `press/` directory**: working masters, dossiers, tracker, drafts.

## Components (industry-standard checklist)

### A. Written core
- [ ] **A1. Boilerplate** (~100 words) — the reusable "about" paragraph that ends every pitch and press release; written once, used verbatim everywhere.
- [x] **A2. Fact sheet** (`00-fact-sheet.md`) — exists; needs final URL + Henry-KIA-accurate framing check + press-page version.
- [ ] **A3. About the project** — 300 / 800-word narratives (what it is, why it matters, how it was made, the five-generation chain).
- [~] **A4. About the creator** (`02-about-the-creator.md`) — 50/150/400w DRAFTED 2026-07-07; awaiting user's voice pass + professional-background and motivation paragraphs + headshot.
- [x] **A5. Key discoveries & story starters** (`04-key-discoveries.md`) — the hero assets written as 150–250-word stories with verbatim letter quotes, dates, and deep links: (1) Antietam triptych — Henry KIA, mother writing to a dead son; (2) July 4, 1863 Culp's Hill letter; (3) James death-date correction; (4) the stewardship chain incl. Gladys's 1947–49 typescripts. *(The asymmetry-of-register finding was RETIRED from press use 2026-07-08 — user call, not robust enough under scrutiny; the information-lag story serves as the data angle instead.)*
- [ ] **A6. Story angles by audience** (`03-story-angles.md`) — exists; REWRITE to v2: one story per audience keyed to the asset map in `targets-v2/SHORTLIST.md`, replacing the generic 12-angle taxonomy.
- [ ] **A7. Quotes & soundbites** (`05-quotes-and-soundbites.md`) — 6–8 creator quotes journalists can lift verbatim (drafted for user's voice pass) + 8–10 sourced pull-quotes from the letters with letter IDs.
- [ ] **A8. FAQ** (`06-faq.md`) — the questions every journalist asks: How accurate is AI transcription and how do you know? Are you a professional historian? What did AI actually do vs humans? Is the data open / how licensed? Can other families do this? What surprised you most? What's next? Rights to reproduce letter text/images?
- [ ] **A9. Methods one-pager** — for technical/scholarly audiences: schema, three-layer architecture, alias tables, confidence model, verification workflow, links to methodology paper + discrepancy registry.
- [ ] **A10. Citation guide** — "How to cite this archive" (site-wide + per-letter formats). Signals resource-grade seriousness; educators and journal reviewers look for it.
- [ ] **A11. Rights & permissions statement** — what press may reproduce (letter text, screenshots, images), required credit line, and the license on the data.

### B. Visual & media assets
- [ ] **B1. Screenshot library** — 6–10 hi-res captures (dashboard, campaign map, a letter in the reader, People Web, health ledger, landing) in 16:9 + vertical crops, each with a caption + credit, consistent filenames.
- [ ] **B2. Document imagery** — Gladys's typescript pages (the July 4 letter and triptych letters first), any family-held originals/photos as rights allow. These are what history editors actually print.
- [ ] **B3. Headshot** — user to supply/choose; 2 crops, hi-res.
- [ ] **B4. Project wordmark** — simple title treatment consistent with site aesthetic (nice-to-have).
- [ ] **B5. 90-second demo video** — screen capture with voiceover, YouTube unlisted; podcast/TV producers use it to pre-screen guests.
- [ ] **B6. Media kit ZIP** — all of the above + PDF fact sheet, one download link on the press page.

### C. Site surfaces (visible ownership — user-flagged)
- [ ] **C1. About page** (`about.html` → `/about`): the creator, the five-generation chain, the method in plain language (link to methodology paper), contact, how to cite. v2 aesthetic; matches the site's oil-painting/lamplight language.
- [ ] **C2. Press page** (`press.html` → `/press`): kit-as-webpage + ZIP + contact + "as seen in" section (grows with coverage).
- [ ] **C3. Sitewide footer attribution** — "Created by Alexander Hubbell Levitt · About · Press · Contact" on every page.
- [ ] **C4. Metadata** — schema.org author/creator markup + OpenGraph images so shared links preview properly.
- [ ] **C5. Deep-link check** — stable URLs to individual letters for pitch use.

### D. Operations
- [ ] **D1. Tracker v2** — fix CSV quoting; add `wave`, `asset`, `ask` columns; dedupe cross-vertical names; import targets-v2 finalists.
- [ ] **D2. Follow-up templates** — 7–10-day polite nudge; response playbook (interview → schedule; "send more" → which kit piece; decline → graceful close, log reason).
- [ ] **D3. Coverage log** — every placement recorded with URL for the "as seen in" section and social-proof pitch refresh.

## Build order
1. **A1, A3, A5, A6-rewrite, A7, A8** (written core — Claude drafts, user voice-passes A4/A7) →
2. **C1–C3** (About + Press pages + footer — the ownership requirement; needs B1 screenshots + B3 headshot) →
3. **B1, B2, B5, B6** (assets) →
4. **A9–A11, C4–C5, D1–D3** (finish + ops).

Prerequisite running alongside: publish methodology paper/essays; confirm production URL.
