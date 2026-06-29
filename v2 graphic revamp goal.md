# v2 Graphic Revamp — `/goal` Prompt

> **What this is:** A ready-to-run, one-shot `/goal` prompt that produces a complete PLAN + a higgsfield prompt library for extending the v2 landing page's impressionist-oil-painting + selective-motion style across the rest of the site. **It plans and writes prompts only — it generates no media and edits no live pages.**
>
> **Source brief it builds on:** [`site v2 graphic revamp prompting jump off.md`](./site%20v2%20graphic%20revamp%20prompting%20jump%20off.md) (project root) — the full ask this goal is scoped from.
>
> **What it will output:** [`tasks/site-v2-graphic-revamp-PLAN.md`](./tasks/site-v2-graphic-revamp-PLAN.md) (created when the goal runs) — the plan, prompt library, research register, per-page UX recommendations, and production/QA roadmap. Review the editorial recap at the top of that file when the run finishes.
>
> **How to run:** copy the block below into `/goal`.

---

## Locked decisions baked into this prompt
- **Run scope:** one comprehensive, site-wide plan, prioritized into P1/P2/P3 tranches.
- **Research:** light inline research for P1 event-based scenes; everything else flagged in a research register.
- **Prompt depth:** tiered — P1 images get full prompt + 2 alternatives + reference-lock + motion plan; P2/P3 listed lightly.
- **Media tooling:** leans fully into the connected higgsfield MCP (image + video + reference-image / character-consistency features).
- **Hard constraints:** UX must mesh with the existing deep data substance (data viz, letter readers, animated maps); data stays the focus; reference-image consistency for brother likenesses is non-negotiable; no media generated and no live page edited this run.

---

## The prompt

```
/goal Produce a comprehensive, prioritized PLAN + a ready-to-run higgsfield prompt library for extending the v2 landing page's impressionist-oil-painting + selective-motion visual language across the rest of the Hubbell Civil War Ancestry site (the Brothers, the Preservation Narrative, and the data pages), while keeping each page's data substance the focus. This run PLANS and WRITES PROMPTS ONLY — it generates NO media and edits NO live pages. Work on the current branch `outreach-engine`; do not touch `main`.

=== GROUNDING (read/verify these first; they are the load-bearing seams) ===
- `site v2 graphic revamp prompting jump off.md` (project root) — THE source brief. Read it in full; it defines the ask (style consistency, selective animation, preservation chain, brother scenes, data-page imagery). The plan must satisfy every part of it.
- `experience-v2/landing.html` — the live v2 reference implementation. The "style" is a VIDEO-LOOP pipeline, not CSS animation: each scene is a baked `.webm` loop + `.webp` poster, scroll-driven by vanilla JS (no animation libraries). Motion is selective — hero figures / certain textures / light / wind move; everything else is a still oil painting. New media MUST follow this still→loop pattern and this motion depth.
- Existing reference assets (REUSE as higgsfield reference images — non-negotiable for consistency):
  - Brothers stills: `experience-v2/assets/brothers/web/window-{alexander-fav,henry-v1,james-v2-wide,charles-v1}.webp` (+ v1/v2 variants in same dir and `/thumbs/`).
  - Brothers loops: `experience-v2/assets/brothers/loops/loop-{alexander-fav,henry,james-wide,charles}.webm`.
  - Preservation montage: `experience-v2/assets/loops/loop-preservation-v2.webm` + poster `experience-v2/assets/preservation/thumbs/typewriter-poster.webp` (this single loop contains trunk→typewriter→scanner→laptop; it is the direct reference for breaking the chain into dedicated per-stage images).
  - Scene loops for tone-matching: `experience-v2/assets/loops/loop-{summer-valley,summer-tent,skirmish-v2,summer-sky}.webm`; transitions in `experience-v2/assets/transitions/`.
- Grandfather's-letter source (the "missing" preservation step — IT EXISTS): `02-transcribed-markdown/other-documents/DOC-INTRO-1996-10-28-001.md` — Fred Alexander Hubbell, Jr. (Alexander's grandson), 1996: trunk in a basement, water-stained originals, typewritten transcription 1947–49, passing the collection to his children. Plan must weave this stage into the preservation chain AND recommend surfacing the real document for readers.
- Target pages the plan will spec imagery for (root dir): `hubbell-dashboard.html` (contains the "Parallel Lives Timeline" INLINE — there is no standalone timeline file), `viz-map-moves.html` (Map That Moves), `viz-health-ledger.html` (Wellness Ledger), `brother-{alexander,henry,james,charles}.html` + `mother-frances.html`.
- Shared design system the plan must mesh with (do not fight it): `_design.css` (tokens: `--col-max:1200px`, `--reading-max:68ch`, fonts Source Serif 4 / Inter / JetBrains Mono, brother colors henry #2D5F8A / alexander #B8860B / james #4A7C59 / charles #8B3A3A, light+dark via `data-theme`), `_bio.css` (bio hero structure), `_cinematic.js` (existing scroll/parallax effects to reuse, not reinvent). New global hero CSS would land in a new `_hero.css`. Quote the v2 palette/filter tokens from `landing.html` (`--paper #ece3d2`, `--lantern #e0b070`, grain/vignette/`saturate(.84) contrast(1.03)`) so prompts match the established look.
- Letter/bio source data for scene-mining + research: `03-data/all-letters.json` and `02-transcribed-markdown/letters/LTR-YYYY-MM-DD-###.md`. Phase-3 dossiers in `04-analysis/PHASE-3A-{HENRY,ALEXANDER,CHARLES,JAMES}-DOSSIER.md` give verified events/places per brother (e.g. Henry KIA Antietam; Alexander Lookout Mountain / 60th NY; James 153rd NY / West Point; Charles).
- Media tooling: the higgsfield MCP image+video tools are connected to THIS session (generate_image, generate_video, show_reference_elements, show_characters, outpaint_image, upscale, motion_control, models_explore). Prompts in the library must be written FOR higgsfield, exploiting its reference-image / character-consistency features.

=== DECIDED (do not re-litigate) ===
1. Deliverable = a written plan + a higgsfield prompt library. NO media generated, NO live page edited, NO code shipped this run.
2. Visual style locked to v2: impressionist oil painting; consistent brush/medium; motion medium = short looping video (still→`.webm` loop), NOT CSS keyframes; selective motion only (hero figures, select textures, light, wind).
3. Reference-image consistency is NON-NEGOTIABLE. Any depiction of an existing subject (especially a brother's likeness, or any preservation-chain object already in `loop-preservation-v2`) MUST cite the specific existing asset(s) above as higgsfield reference images, and the prompt must state which one and why.
4. UX/UI must mesh cleanly with the existing deep substance (data viz, letter readers, animated maps). Imagery is the lead-in / frame; the data visualization stays the focus and must never be buried, slowed, or obscured. Apply real web/mobile/user-behavior expertise: cohesive, smooth, performant, easy to explore.
5. The grandfather/preservation "missing step" is sourced from DOC-INTRO-1996-10-28-001 — depict it AND surface the document.
6. Run scope = ONE comprehensive site-wide plan, prioritized into tranches (P1/P2/P3).
7. Prompt-library depth = TIERED: P1 images get a full first-pass prompt + alt-1 + alt-2 + reference-lock notes + motion plan; P2/P3 get subject + one-line direction + which reference asset, to be expanded in a later wave.
8. Research = LIGHT INLINE for P1 event-based scenes (web/firecrawl), bake findings into those prompts; everything else goes into a research register (flag-only).
9. Honor project voice/provenance rules from `CLAUDE.md` (accuracy, provenance, no fabricated history) in every reader-facing string the plan proposes.

=== SCOPE & SEQUENCE (finish + verify each before the next) ===
A. CONFIRM THE VISUAL+MOTION SYSTEM. Read the jump-off brief, `landing.html`, and the reference assets. Write a one-page "style & motion contract" (palette, brush/medium descriptors, the still→loop workflow, the selective-motion rule, the v2 filter/grain/vignette tokens) that every prompt in the library will inherit. This is the consistency backbone.

B. MINE + PRIORITIZE THE IMAGE SET. From the brief, dossiers, and letters, assemble the full candidate image list across all domains: Brothers (the 4-up grid "thread" reuse; per-brother hero portrait via canvas-extend/outpaint of existing `window-*` stills; 4–6 scene depictions per brother), Preservation chain (trunk, great-grandmother+typewriter, scanner/PDF stage, modern laptop stage, + grandfather-writing-the-letter), and data-page heroes (Map, Wellness Ledger, Timeline/dashboard). Score and tier every candidate P1/P2/P3 by narrative leverage × feasibility × reference-availability. Produce a single prioritized master table.

C. LIGHT INLINE RESEARCH (P1 event scenes only). For the handful of P1 brother scenes anchored to real events (e.g. Antietam, Lookout Mountain, the relevant regiments/locations), do quick web research to get historically accurate, depictable detail (terrain, uniforms, time of day, formation, season). Cite sources + dates. Fold the verified detail into those P1 prompts. Add every non-P1 event scene to a RESEARCH REGISTER (what to research, where, why) without doing it now.

D. WRITE THE P1 PROMPT LIBRARY (full depth). For each P1 image: subject + narrative purpose; the exact existing reference asset(s) to lock identity/style and HOW to use them in higgsfield; a still-first prompt (first-pass) + alt-1 + alt-2 (meaningfully different angle/composition/lighting, since stills take iteration); then the MOTION plan for turning the approved still into a loop (what moves, depth, light/wind, loop length, what stays static). Keep prompts aligned to the Step-A style contract.

E. WRITE P2/P3 (light depth). Subject + one-line art direction + reference asset + intended page slot. Enough to expand later, not full prompts.

F. PER-PAGE UX / LAYOUT RECOMMENDATIONS. For each surface (Brothers grid thread, each brother bio hero, Preservation sequence/`the-collection.html`, Map, Wellness Ledger, dashboard/Timeline): make a FIRM recommendation (with one alternative) on hero-image vs fade-out-into-chart vs background-frame; unobstructed vs text-overlay (and overlay treatment); placement/positioning; and the impact on typography, `--col-max`/`--reading-max`, margins. Every recommendation must protect data primacy and reading comfort, specify desktop AND mobile behavior, and include a PERFORMANCE BUDGET (loop weight, lazy-load, poster fallback, prefers-reduced-motion, not blocking the interactive viz). Tie each to the real CSS seams (`_design.css` tokens, `_bio.css`, `_cinematic.js`, proposed `_hero.css`).

G. PRODUCTION + QA ROADMAP. Sequence the actual media build in the v1→v2 spirit: still generation → user still-approval GATE → loop render (higgsfield) → integration per page → cross-device + performance + accessibility QA. Define the QA checklist and the still-approval gate explicitly. This is a plan for later execution, not execution now.

IN SCOPE: the plan doc + prompt library + research-for-P1 + UX recs + roadmap. OUT OF SCOPE (named next steps): generating any image/loop, editing any live page, building `_hero.css`.

=== PER-ITEM RHYTHM (apply to every item above) ===
1. Build the core (the table / the prompts / the recs).
2. Test it concretely: re-open the cited reference assets and page files to confirm every path, filename, token, and dossier fact is REAL and current (no invented assets, events, or filenames); confirm each P1 prompt names a valid existing reference image; sanity-check research claims against the cited source. Fix until correct.
3. 3 loops of self-critique: once as a senior design engineer (does this mesh with the existing system? is the motion truly selective/lightweight? does it protect data primacy and performance? are the seams real?) and once as a simulated end-user on mobile + desktop (is it beautiful, cohesive, smooth, easy to explore? does imagery enhance rather than obstruct the data/reader?). Iterate.
4. Capture for the recap: what was produced, key decisions/tradeoffs, where/how to verify, what the user should review or might want to change.

=== GUARDRAILS / USER-GATED — flag and pause, do not push past ===
- Generate NO images or video; call no higgsfield generate_* tool. Write prompts only.
- Edit NO live page, NO shared CSS/JS, NO assets; create only the new plan doc (+ optional sub-files under `tasks/`). `main` untouched.
- Do not invent historical facts, events, letter content, brother likenesses, or asset filenames. If a referenced event isn't verifiable in the time/research budget, flag it in the research register rather than guessing.
- Do not finalize anything that depicts a real ancestor's likeness in a fabricated scene without flagging it for the user's provenance/comfort review (honor `CLAUDE.md` accuracy+provenance rules).
- Any UX recommendation that would slow or obscure an interactive viz must be flagged as a tradeoff, not silently adopted.

=== OPEN VALUES (propose sensible defaults; mark user-tunable) ===
- Plan doc path: default `tasks/site-v2-graphic-revamp-PLAN.md` (user-tunable). Prompt library may be a sibling `tasks/site-v2-prompt-library.md` if the main doc gets long.
- Scenes per brother: default 4 (the brief's floor of 4–6), user can request up to 6.
- P1 set size: default the 8–12 highest-leverage images site-wide; flag if a different cut is wanted.
- Loop length / motion intensity defaults: match v2 (short, subtle); mark tunable.

=== DELIVERABLES ===
1. `tasks/site-v2-graphic-revamp-PLAN.md` — the comprehensive plan: style+motion contract (A), prioritized master image table (B), research register + P1 findings with sources (C), per-page UX/layout recommendations with mobile + performance budgets (F), and the production+QA roadmap (G).
2. The higgsfield PROMPT LIBRARY (in the plan doc or sibling file): P1 entries full (first-pass + alt-1 + alt-2 + reference-lock + motion plan), P2/P3 entries light.
3. EDITORIAL RECAP (top of the plan doc) — MANDATORY, layman-termed, well-referenced (link real paths): per stage what was produced, approach + why, decisions/tradeoffs/learnings, where & how to review, and exactly what to give feedback on.
4. KEY CONSIDERATIONS (section) — MANDATORY: watch-outs and tradeoffs on performance/mobile load, data-primacy risk, likeness/provenance sensitivity, production cost/effort, and consistency risks.
5. SUGGESTED NEXT STEPS (section) — MANDATORY: prioritized shortlist seeding the next /goal-prompt (e.g. "generate + approve the P1 stills," "build `_hero.css`," "wire the Preservation sequence into the-collection.html"), naming dependencies that must clear first.

=== DONE WHEN ===
- The plan doc exists with all of A–G, every cited path/filename/token/event verified real, and every P1 prompt naming a valid existing reference asset.
- P1 prompts have first-pass + alt-1 + alt-2 + reference-lock + motion plan; P2/P3 listed lightly; research register complete with P1 findings sourced+dated.
- Per-page UX recs are firm (with one alt each), cover desktop+mobile, protect data primacy, and carry a performance budget tied to real CSS seams.
- Recap + Key Considerations + Suggested Next Steps all present and layman-termed.
- No media generated, no live page/CSS/JS/asset edited; everything committed on `outreach-engine`; `main` untouched.
```
