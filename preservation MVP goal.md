# Preservation Sequence MVP — `/goal` Prompt (proof-of-concept build)

> **What this is:** A ready-to-run `/goal` that BUILDS the real Preservation-sequence MVP — the proof-of-concept for the whole v2 graphic revamp pipeline — on the `outreach-engine` branch. Unlike the planning goals, this one ships code and generates media. It does **not** deploy to production.
>
> **Plan it executes:** [`tasks/site-v2-graphic-revamp-PLAN.md`](./tasks/site-v2-graphic-revamp-PLAN.md) §6.3 (preservation sequence), §4 P1-PRES-1…5 (image prompts), §6.1 (reusable hero/loop component), §7 (production + QA), §9 step 2 (this is the recommended first build).
>
> **How to run:** copy the block below into `/goal`.

---

## Locked decisions baked in
- **Media scope:** full MVP including real media this run, **gated** — free placeholder MVP first, then generate → pause for still approval → animate → swap real loops in.
- **Still-approval gate:** when you're AFK, the run **pauses and waits** for your sign-off before animating (it self-critiques to a recommended pick per image first).
- **Placeholder-first:** wire all 5 stages with the existing `loop-preservation-v2.webm` so the component + page + reader tie-in + QA are provable for **zero credits** before any bespoke media exists.
- **1996 doc:** add `DOC-INTRO-1996-10-28-001` so the letter reader can open it, but **keep it out of global site search**.
- **Scene rationale at review:** every generated still is presented at the approval gate with a written rationale — why it's the right scene to include and what details bring it to life — so you judge intent, not just aesthetics.
- **Key grounding:** `the-collection.html` already EXISTS (649 lines, finished) and already narrates the five stewardship eras with real names (Frances → **Gladys Sands Hubbell**/typewriter 1947–49 → **Fred Alexander Hubbell Jr.**/1996 → **Bruce Levitt**/scanner → analysis). EXTEND it; don't rebuild. No prod deploy; build on `outreach-engine`.

---

## The prompt

```
/goal Build the Preservation-sequence MVP — the proof-of-concept for the v2 graphic revamp — by extending the EXISTING the-collection.html with the v2 oil-painting/loop treatment across its five stewardship eras, via a new reusable _hero.css loop component, plus a letter-reader tie-in to the 1996 family introduction. Build on the current branch `outreach-engine`. DO NOT deploy to production — the user reviews and deploys. Generated media spends real higgsfield credits, so honor the budget checkpoint and the still-approval gate below.

=== GROUNDING (verify these before building; they are the load-bearing seams) ===
- `tasks/site-v2-graphic-revamp-PLAN.md` — the spec. Read §6.3 (preservation sequence UX), §4 P1-PRES-1…P1-PRES-5 (the five image prompts + motion plans + reference-locks), §6.1 (the reusable hero/loop component), §2 (style & motion contract), §7 (production + QA), §8 (provenance rules). This goal executes that plan's §9 step 2.
- `the-collection.html` (project root) — ALREADY A FINISHED 649-line page. <title> "The Collection — Five Generations of Stewardship". It already narrates the five eras IN PROSE with real names: Era 01 Frances + the trunk; Era 02 **Gladys Sands Hubbell** transcribes by typewriter (1947–49); Era 03 **Fred Alexander Hubbell Jr.** writes the 1996 introduction; Era 04 **Bruce Levitt** digitizes (scanner); Era 05 analysis (this site). EXTEND this page — reuse its existing copy and these exact names; do NOT rebuild it or reinvent the narrative. The five P1-PRES images map 1:1 onto these five eras. It loads `_design.css`, `_overlay.css`, `_design-data.js`, `_design-ui.js`, `_deeplink.js`, `_overlay-data.js`, `_letter-nav.js`, `_overlay.js`, and already calls `HubbellOverlay.bindPage(...)` + `HubbellDeepLink.injectShareButton()`. Its sections use max-width ~920–960px (NOT --col-max/--reading-max) — match the page's own conventions.
- Reusable component target: NEW file `_hero.css` (none exists yet) + a small init that REUSES `_cinematic.js` (existing scroll/fade helpers) — do not add an animation library. Pattern from plan §6.1: poster `.webp` shows immediately → `.webm` loop lazy-loads via IntersectionObserver and fades in → optional gradient scrim for legibility → `prefers-reduced-motion` serves the poster only → posters reserve aspect ratio so there's no layout shift (CLS≈0). Mirror the landing page's own lazy pattern (`experience-v2/landing.html` uses `data-src` swap + `preload="none"` + poster).
- Letter-reader API (for the keystone tie-in): `HubbellReader.open(id, opts)` from `_reader.js`; real call-site pattern in brother-*.html is a local `openLetter(id)` wrapper. Required scripts to add to the-collection.html: `_search-data.js`, `_letter-nav.js`, `_reader.js`. The reader resolves a doc by ID from the LETTERS array (`_search-data.js`) first, then LETTER_INDEX (`_overlay-data.js`).
- Keystone source doc: `02-transcribed-markdown/other-documents/DOC-INTRO-1996-10-28-001.md` (Fred Alexander Hubbell Jr., Oct 28 1996 — trunk in basement, water-stained originals, Gladys's 1947–49 typewritten transcription, "trusting that these letters may be of interest to others"). It is NOT currently in any reader data source — it must be ADDED so `HubbellReader.open('DOC-INTRO-1996-10-28-001')` works.
- Existing media references for higgsfield continuity: `experience-v2/assets/loops/loop-preservation-v2.webm` (contains trunk→typewriter→scanner→laptop) and `experience-v2/assets/preservation/thumbs/typewriter-poster.webp` — use as REFERENCE images so new stills match the montage. NEW media lands under `experience-v2/assets/preservation/stages/` (create it): one `.webp` poster + `.webm` + `.mp4` per stage (triple-asset pattern like the landing page).
- Style tokens (from `_design.css` / `landing.html`): --col-max:1200px, --reading-max:68ch, fonts Source Serif 4 / Inter / JetBrains Mono, palette --paper #ece3d2 / --ink #16130d / --lantern #e0b070. New art inherits the plan §2.1 house-style string + §2.5 motion contract (4–8s seamless loop, only 2–3 elements move).
- Branch state: on `outreach-engine`; no `_hero.css` and no `stages/` dir yet; `the-collection.html` IS git-tracked and public (fine to ship). `main` untouched.

=== DECIDED (do not re-litigate) ===
1. EXTEND the-collection.html using its existing copy + the real steward names above; the 5 images map to its 5 eras. Do not rebuild the page or rewrite its narrative.
2. Reusable `_hero.css` loop component (poster-first → lazy `.webm` → scrim → IntersectionObserver → reduced-motion poster → no CLS), reusing `_cinematic.js`. This component is the proof-of-pattern later sections will reuse — build it clean and generic.
3. Placeholder-first: wire all five stages with `loop-preservation-v2.webm` + `typewriter-poster.webp` as stand-ins so the component, scroll sequence, reader tie-in, and full QA are provable with ZERO higgsfield credits, BEFORE generating bespoke media.
4. Media pipeline (higgsfield): generate stills with the existing assets attached as reference images → STILL-APPROVAL GATE (pause for user sign-off) → image-to-video into 4–8s seamless loops per each image's §4 motion plan → export `.webp`+`.webm`+`.mp4` to `experience-v2/assets/preservation/stages/` → swap out placeholders.
5. Keystone tie-in: add `DOC-INTRO-1996-10-28-001` so the reader can open it, and wire a "Read his actual words" control at the Fred-Jr./1996 era. The doc must be READER-OPENABLE BUT EXCLUDED FROM GLOBAL SITE SEARCH (verify how `_search-engine.js` builds its index and exclude this ID, or add via a reader path search doesn't scan).
6. Provenance/voice (plan §8 + CLAUDE.md): interpretive paintings, no invented history, honest captions. Preservation scenes are objects/later-era people (lower likeness-sensitivity than the brother battle scenes) but still get honest captions.
6b. SCENE RATIONALE IS PART OF APPROVAL: every generated still is presented at the gate (D3) with a written rationale — why this scene earns its place in the preservation chain, why this composition over the alternates, and the concrete period/emotional details that bring it to life on-style and historically honest. Review judges intent + craft, not just the picture.
7. No production deploy this run. Build + commit on `outreach-engine`; user reviews/deploys.
8. Internal files never ship (memory: Vercel deploys every tracked file). the-collection.html + new public assets are fine; do NOT surface any tasks/ or Phase-3/analysis content; confirm the keystone only exposes the already-public 1996 intro doc.

=== SCOPE & SEQUENCE (finish + verify each before the next) ===
A. REUSABLE LOOP COMPONENT (zero credits). Create `_hero.css` + the small init in/alongside `_cinematic.js`. Prove it on a throwaway test using an existing landing `.webm` + poster: poster instant, loop lazy-fades in on scroll, scrim renders, reduced-motion shows poster only, no layout shift. This is the foundation everything else uses.
B. KEYSTONE DATA + READER WIRING (zero credits). Add `DOC-INTRO-1996-10-28-001` to the reader's data (transcription from the markdown), READER-OPENABLE but EXCLUDED FROM SEARCH (verify + implement the exclusion). Add required scripts to the-collection.html. Wire a "Read his actual words" affordance at the 1996/Fred-Jr. era that calls `HubbellReader.open('DOC-INTRO-1996-10-28-001', …)`. Test: button opens the reader with the real 1996 text; the doc does NOT appear in site search.
C. INTEGRATE THE 5-STAGE SEQUENCE — PLACEHOLDER MEDIA (zero credits). Using the component from A, add a loop to each of the five existing eras of the-collection.html (Archetype B, plan §6.3): unobstructed image, caption/text in side column or lower scrim, one stage readable per viewport, generous margins, provenance caption per stage. Use `loop-preservation-v2.webm` + `typewriter-poster.webp` as the placeholder for all five for now. AT THIS POINT THE MVP IS FUNCTIONALLY COMPLETE AND TESTABLE FOR FREE — run the full QA (item-rhythm step 2) on desktop 1280px + mobile 390px. Do not proceed to D until the placeholder MVP passes QA.
D. BESPOKE MEDIA — GATED, SPENDS CREDITS. (D1) BUDGET CHECKPOINT: check higgsfield balance/credits and STOP to confirm with the user before mass generation. (D2) Generate the five P1-PRES stills using the §4 first-pass prompt for each, with the reference asset attached (loop-preservation-v2 frames + typewriter-poster.webp); if a still is off, try alt-1 then alt-2; self-critique to a recommended pick per image. For each scene, WRITE A RATIONALE while generating (don't bolt it on after): (a) why this scene is the right one to include — its narrative role in the five-era preservation chain and its link to the real provenance record (e.g. the trunk + Gladys's typewriter + Fred Jr.'s 1996 intro are documented in DOC-INTRO-1996); (b) why the chosen composition/angle/light won over the alternates; (c) the concrete period and emotional details that bring it to life while staying on the §2 house-style and historically honest (and, where relevant, what was deliberately avoided — anachronism, sentimentality, invented specifics). (D3) STILL-APPROVAL GATE: present the five recommended stills AS A REVIEW PACKAGE — each still shown alongside its written rationale from D2 — and PAUSE. Do not animate until the user approves (or asks to regenerate specific scenes). (D4) After approval: animate each into a 4–8s seamless loop per its §4 motion plan; export `.webp`+`.webm`+`.mp4` to `experience-v2/assets/preservation/stages/`; upscale stills before export. (D5) Swap the placeholders for the bespoke media in the-collection.html; re-run full QA.

IN SCOPE: A–D on the-collection.html + `_hero.css` + the reader doc-data add. OUT OF SCOPE (named next steps): the brother bios, the data-page heroes (Map/Wellness), and any production deploy.

=== PER-ITEM RHYTHM (apply to every item A–D) ===
1. Build the core.
2. Test it CONCRETELY: render the real page (use the project's run/browser tooling) at desktop 1280px AND mobile 390px; check the QA checklist from plan §7 Stage 4 — data/interaction reachable within one scroll/tap; loop seamless (no visible jump); poster instant + loop fades in; no layout shift (CLS≈0); `prefers-reduced-motion` serves posters; per-page performance budget (~6–8 MB mobile total, poster-first, lazy); text legibility over art (scrim/negative space, no text on faces); provenance caption present; accessibility `alt` text on every image; loops muted. Check the browser console for errors. Fix until correct.
3. THREE self-critique loops: once as a senior design engineer (is the component clean/generic/reusable? seams honored? no drift? performant?) and once as a simulated end-user on mobile + desktop (is it beautiful, cohesive with the landing, smooth, easy to read? does the imagery enhance — not bury — the story and the reader tie-in?). Iterate each loop.
4. Capture for the recap: what was built, approach + key decisions/tradeoffs, where & how to test it, and exactly what the user should review or might want to change.

=== GUARDRAILS / USER-GATED — flag and pause, do not push past ===
- BUDGET CHECKPOINT (D1): higgsfield generation spends real credits — check balance and get explicit user confirmation BEFORE mass generation.
- STILL-APPROVAL GATE (D3): generate stills, recommend picks, write each scene's rationale (why this scene + why this take + what details bring it to life), present stills+rationales together, then PAUSE for user sign-off; do NOT animate until approved.
- NO production deploy. Build + commit on `outreach-engine` only; let the user review and deploy.
- Internal content never ships: do not expose tasks/, Phase-3, dossiers, or analysis on any public page; verify the keystone exposes only the already-public 1996 intro doc; keep that doc OUT of global search per the decision.
- Provenance: honest captions on every depicted scene; no invented history; do not imply the paintings are photographs.
- Do not modify the brother bios, data-viz pages, or `main`.

=== OPEN VALUES (propose sensible defaults; mark user-tunable) ===
- Asset naming under `experience-v2/assets/preservation/stages/`: default `pres-01-trunk.{webp,webm,mp4}` … `pres-05-digital.{…}` (user-tunable).
- Which data file gets the 1996 doc: default the reader's primary lookup (`_search-data.js` LETTERS) with a search-exclusion flag; fall back to a reader-only path if cleaner (verify at build).
- Loop length default 6s (range 4–8s); scrim opacity tuned for legibility; mobile hero stage height ≤70vh. All user-tunable.
- If higgsfield generation stalls or quality is off after alts, FALLBACK: keep the placeholder media in place, ship the MVP as-is, and log the gap for a follow-up — do not block the working MVP on perfect art.

=== DELIVERABLES ===
1. Working `the-collection.html` preservation MVP on `outreach-engine` (committed; NOT deployed): five eras each carrying a loop via the new component, plus the "Read his actual words" reader tie-in at the 1996 era.
1b. The STILL-APPROVAL REVIEW PACKAGE — the five recommended stills each paired with its written scene rationale (why this scene + why this take + what details bring it to life) — presented at the gate and recorded in the recap (or a sibling `tasks/preservation-mvp-stills-review.md`) so the reasoning is preserved alongside the chosen art.
2. New reusable `_hero.css` loop component (+ `_cinematic.js` init) — generic, documented inline, ready for bios/data pages to reuse.
3. The 1996 doc wired into the reader (reader-openable, excluded from search) and the bespoke media under `experience-v2/assets/preservation/stages/` (after the gate; placeholder until then).
4. EDITORIAL RECAP doc at `tasks/preservation-mvp-recap.md` (tasks/ is local/gitignored — correct home) — MANDATORY, layman-termed, well-referenced (link real paths). Per stage A–D: what was built, approach + why, decisions/tradeoffs/learnings, where & how to test it, and exactly what to review/feedback on.
5. KEY CONSIDERATIONS (section in the recap) — MANDATORY: watch-outs and tradeoffs on credits spent, performance/mobile load, the search-exclusion approach, provenance, and the reusable-component design choices that lock in future work.
6. SUGGESTED NEXT STEPS (section in the recap) — MANDATORY: prioritized shortlist seeding the next /goal (e.g. "roll the component to one brother bio — Alexander," "data-page heroes — Wellness + Map"), naming dependencies (e.g. user deploy/review of this MVP first).

=== DONE WHEN ===
- `_hero.css` loop component exists, is generic/reusable, and passes its standalone test (poster-instant, lazy loop, scrim, reduced-motion poster, no CLS).
- the-collection.html shows all five eras with the loop treatment (bespoke media if the gate was passed; otherwise placeholder with the gap logged), reuses the existing copy/names, and keeps the story readable and primary.
- The "Read his actual words" button opens DOC-INTRO-1996-10-28-001 in the reader with the real 1996 text; the doc is confirmed ABSENT from global site search.
- Each generated still was presented at the approval gate with its written scene rationale (why this scene + why this take + the details that bring it to life), and the rationales are preserved in the recap / stills-review doc.
- Full QA checklist passes at 1280px and 390px; no console errors; performance budget met.
- Recap + Key Considerations + Suggested Next Steps written (layman-termed) at `tasks/preservation-mvp-recap.md`.
- All work committed on `outreach-engine`; nothing deployed; `main` untouched; no internal/analysis content exposed on any public page.
```
