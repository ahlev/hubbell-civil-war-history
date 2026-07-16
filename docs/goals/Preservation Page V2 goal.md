# Preservation Page V2 — Choreographed Reveal + Parallax — `/goal` Prompt

> **What this is:** A ready-to-run `/goal` that adds a **distinctive, animated narrative layer** to the
> already-shipped Collection preservation sequence — the painted eras now *develop in*, the captions
> rise, the year-markers animate, and the image drifts subtly against the text as you scroll. It builds
> a **reusable** reveal/parallax module so the same vocabulary can roll to the brother bios + data pages
> next. It does **not** rebuild the MVP, and it does **not** deploy.
>
> **Builds on:** the finished `the-collection.html` preservation MVP (five `.era` blocks + the `_hero`
> loop component) and `tasks/site-v2-graphic-revamp-PLAN.md` §6.1/§6.3/§2.5.
>
> **How to run:** copy the block below into `/goal`.

---

## Locked decisions baked in
- **Concept = "Choreographed reveal + parallax"** (chosen from 3 directions). Keep the readable, stacked
  layout — *enhance* each era's entrance + add parallax. NOT pinned-scrollytelling, NOT a re-layout.
- **Reusable module:** build `_reveal.js` + `_reveal.css` (generic `[data-reveal]` / `[data-parallax]`),
  wire into the-collection's eras. Keep `_hero.js` focused on the loop — don't merge them.
- **Branch:** retire the stale `outreach-engine` name → do this work on **`v2-ui`** (suggested name,
  user-tunable). **Commit there; DO NOT deploy** — the user reviews live + deploys.
- **2× expert-panel review at the end:** five lenses run *simultaneously* (motion/design eng,
  accessibility, performance, narrative-UX, first-time end-user), then the run **triages the net
  collective substance of all reviews at once** and applies one coherent set of improvements — twice.
- **Guardrails are part of the motion:** readability primary; loops stay lazy; `prefers-reduced-motion`
  → calm static page; transform/opacity only (no CLS); parallax off on mobile.

---

## The prompt

```
/goal Add a "choreographed reveal + parallax" narrative animation layer to the EXISTING five-era
preservation sequence in the-collection.html — building a NEW reusable _reveal.js + _reveal.css module
and wiring it into the eras — so the painted eras develop in, captions rise, year-markers animate, and
each image drifts subtly against its text as the reader scrolls. Do this on a NEW branch `v2-ui` (we are
retiring the stale `outreach-engine` name). DO NOT rebuild the preservation MVP or its loops, DO NOT
touch the v2 landing page (a concurrent session owns it), and DO NOT deploy — the user reviews live and
deploys. End the run with a 2× expert-panel review (below).

=== GROUNDING (verify these before building; they are the load-bearing seams) ===
- `the-collection.html` (project root) — the FINISHED preservation MVP. The "Five Generations of
  Stewardship" section has five `.era` blocks, each = `.era-marker` (`.era-number` "Era 0X" + `.era-year`)
  + `.era-body` (a `<figure class="hero-loop era-loop" data-hero-loop>` + an `<h3>` + a `<p>` + a
  `<p class="era-detail">`; Era 03 also has a `.era-read-doc` "Read his actual words" button → the 1996
  reader tie-in). Layout: `.era` is a CSS grid `140px | 1fr`; mobile collapses to 1 column at
  `@media (max-width:700px)` and `480px`. The page uses the design tokens `--accent`, `--ease`
  (`cubic-bezier(.22,.61,.36,1)`), `--ease-out`, `--font-display/serif/mono`. It loads `_hero.css`/
  `_hero.js` (+ `_reader.js`, `_overlay*`, `_letter-nav`, etc.). EXTEND this page; reuse its eras +
  conventions; do NOT rebuild the loops or rewrite the prose.
- `_hero.css` / `_hero.js` — the loop component (poster `.webp` → lazy `.webm`/`.mp4` via
  IntersectionObserver → fades in by adding `is-playing` to the figure → pauses off-screen →
  `prefers-reduced-motion` serves the poster only). This MUST keep working unchanged. The new reveal
  layer COMPOSES with it: the figure's "develop-in" entrance is separate from the loop's `is-playing`
  fade — make sure they don't fight (no double transform on the same element, no IO that re-pauses the
  loop). Treat `_hero` as a finished dependency; do not regress its lazy/pause/reduced-motion behavior.
- `tasks/site-v2-graphic-revamp-PLAN.md` — §6.1 (reusable hero/loop component intent), §6.3 (preservation
  sequence UX: imagery invites, the data/letters are the destination — readability is primary), §2.5
  (motion contract: subtle, only 2–3 things move, `prefers-reduced-motion` falls back). The reveal
  vocabulary must feel of-a-piece with this restraint.
- `experience-v2/landing.html` — the v2 landing whose cinematic "settle / cross-fade" scroll sets the
  HOUSE MOTION FEEL (gentle ease, scenes that settle to near-stillness). Reference its TONE only.
  DO NOT EDIT IT — a concurrent session is actively committing to it.
- `_design.css` `:root` — reuse `--ease`, `--ease-out`, `--accent`, fonts, `--reading-max`. Don't invent
  new easings/colors; inherit the system.
- `tasks/preservation-mvp-recap.md` + `tasks/preservation-mvp-stills-review.md` — context on what the
  five eras depict (trunk→typewriter→1996 letter→scan→digital) and the data-helix motif (Era 05), useful
  for the final "resolution" beat.
- Git state: the project is on the stale-named `outreach-engine`; a concurrent session has been committing
  ~8 recent `experience-v2/landing.html` changes there. the-collection.html + _hero.* were last touched
  only by the preservation-MVP commits and nothing since — they are a clean, collision-free area.

=== DECIDED (do not re-litigate) ===
1. Concept = choreographed reveal + parallax. Keep the stacked, readable era layout; enhance entrances +
   add parallax. NOT the pinned-scrollytelling concept, NOT a re-layout.
2. Build a REUSABLE module: `_reveal.js` + `_reveal.css` — generic `[data-reveal]` entrance (with a
   `[data-reveal-stagger]` option for staggered children) + `[data-parallax]` drift. Documented, generic,
   ready for the bios/data pages to reuse. Keep it SEPARATE from `_hero.js` (loop) — don't merge.
3. Signature motion vocabulary (ONE consistent language across all five eras): (a) the `.hero-loop`
   "develops in" — a soft clip-path wipe + a gentle `scale(1.04)→1` settle + fade as it enters; (b) the
   caption lines (eyebrow → title → provenance) stagger-rise over the scrim; (c) the `.era-marker`
   ("Era 0X" + year) + a short accent rule animate in; (d) a subtle parallax drift between the image and
   its text across the era's scroll span; (e) the `<h3>` + prose do a quick guided fade-rise on entry.
4. Guardrails baked into the motion: readability is primary (text reveals are FAST and never delay
   reading; no text over faces — the scrim already handles this); loops STAY lazy + pause-offscreen
   (do not regress `_hero`); `prefers-reduced-motion` → EVERYTHING appears statically (no entrance
   transforms, no parallax), poster shown; use transform/opacity ONLY (GPU-composited → no reflow, no
   CLS); on mobile (≤700px) parallax is OFF (touch-scroll jank) and entrances are kept lighter.
5. Branch hygiene: retire the `outreach-engine` name; do this work on `v2-ui`. Commit there; DO NOT
   deploy (user reviews live + deploys).
6. Honor the project's house style + the landing's motion feel; reuse the existing `--ease` tokens.

=== SCOPE & SEQUENCE (finish + verify each before the next) ===
A. REUSABLE REVEAL/PARALLAX MODULE (`_reveal.js` + `_reveal.css`). Generic + documented. `_reveal.js`:
   an IntersectionObserver that adds an `is-revealed` class to `[data-reveal]` when it enters (one-shot),
   with optional staggered children via `[data-reveal-stagger]`; and a throttled rAF loop that applies a
   small `translateY` to `[data-parallax]` elements ONLY while in view (transform-only). Guards: if
   `prefers-reduced-motion` OR no `IntersectionObserver`, reveal everything immediately and skip parallax.
   `_reveal.css`: the initial-hidden + revealed states (opacity/transform), the clip-path "develop"
   keyframe, and the stagger timing — all using `--ease`. PROVE IT on a throwaway test page first (poster
   + a couple of `[data-reveal]`/`[data-parallax]` blocks), exactly as `_hero` was proven, then delete it.
B. WIRE THE FIVE ERAS (the-collection.html). Add `data-reveal` / `data-reveal-stagger` / `data-parallax`
   + the signature classes to each `.era` (marker, the `.hero-loop` figure, the caption lines, the
   heading + prose). Add the page-level tuning in `_reveal.css` (or a small page `<style>` block for
   Collection-specific values). Do NOT rebuild the loops; keep the 1996 keystone button + reader working
   and the doc still ABSENT from site search.
C. THE "DEVELOPS-IN" LOOP ENTRANCE. Implement the clip-path wipe + `scale(1.04)→1` settle on the
   `.hero-loop`, composed cleanly with `_hero`'s `is-playing` fade (the loop fades in; the wipe is the
   figure's entrance — no conflicting transform on the same node). Verify the loop still lazy-loads,
   plays, and pauses off-screen exactly as before.
D. DISTINCTIVE FINAL RESOLUTION. A tasteful resolve from Era 05 (digital) into the "What the Archive
   Reveals" section — e.g. the data-helix / a connective accent that hands the reader into the live
   archive grid, making the "unbroken chain → today" land. Keep it light. FALLBACK if it reads busy or
   risky: a clean settle/fade into the grid (log the simpler choice in the recap).

IN SCOPE: A–D on the-collection.html + the new `_reveal.js`/`_reveal.css`. OUT OF SCOPE (named next
steps): rolling `_reveal` to a brother bio; the data-page heroes; the pinned-scrollytelling concept;
any edit to the landing page; any deploy.

=== PER-ITEM RHYTHM (apply to every item A–D) ===
1. Build the core.
2. Test it CONCRETELY with the project's browser tooling (Playwright): render the REAL page at desktop
   1280px AND mobile 390px and check — reveals fire as elements enter view; parallax is smooth with NO
   jank and NO layout shift (CLS≈0); the `_hero` loops still lazy-load, play, and pause off-screen;
   `prefers-reduced-motion` yields a calm STATIC page (no parallax/entrance transforms, posters shown);
   the 1996 "Read his actual words" reader still opens and the doc is still absent from search; the
   browser console is clean. Fix until correct.
3. THREE self-critique loops: once as a senior design/front-end engineer (is the module clean, generic,
   reusable? is the choreography cohesive and on-brand? transform/opacity-only? no drift, no regression
   of `_hero`?) and once as a simulated end-user on mobile + desktop (is it beautiful, smooth, does the
   motion enhance — not bury — the story and reading?). Iterate each loop.
4. Capture for the recap: what was built, approach + key decisions/tradeoffs, where & how to test it, and
   exactly what the user should review or might want to change.

=== 2× EXPERT-PANEL REVIEW (MANDATORY — run AFTER A–D pass, twice) ===
Run TWO full review-and-iterate rounds. In EACH round:
1. Render the finished sequence live at 1280px AND 390px, in BOTH normal and reduced-motion modes.
2. Critique it SIMULTANEOUSLY through FIVE lenses (consider all at once, not one-by-one):
   • Senior motion / design engineer — is the choreography distinctive, cohesive, on-brand, free of
     jank/drift? clean reusable module?
   • Accessibility specialist — is `prefers-reduced-motion` fully honored? any vestibular / motion-
     sickness risk (parallax magnitude, speed)? focus order intact? nothing hidden from assistive tech?
     alt text + contrast still good?
   • Performance engineer — transform/opacity only? zero CLS? no long tasks / scroll-handler cost? mobile
     cost acceptable? loops still lazy + paused off-screen?
   • Narrative-UX designer — does the choreography SERVE the chain-of-care story + the reading, or just
     decorate? does the final resolution land?
   • First-time end-user (mobile + desktop) — is it beautiful, smooth, intuitive? does the imagery
     enhance rather than bury the story?
3. THOUGHTFULLY TRIAGE the NET COLLECTIVE SUBSTANCE of all five reviews AT ONCE — dedupe overlapping
   notes, RESOLVE CONFLICTS toward the guardrails (e.g. "add more motion" vs "less, for a11y" → reconcile
   to subtle + reduced-motion-safe), and prioritize by impact — then apply ONE COHERENT set of
   improvements (not siloed per-role patches).
4. Re-verify (the §PER-ITEM step-2 concrete test) after applying the improvements.
Round 2 repeats the whole panel on the improved result. Record BOTH rounds — the collective findings, the
triage decisions, and exactly what changed — in the recap.

=== GUARDRAILS / USER-GATED — flag and pause, do not push past ===
- DO NOT touch `experience-v2/landing.html` (a concurrent session owns it), the brother bios
  (`brother-*.html`), the viz/data pages (`viz-*.html`, `hubbell-dashboard.html`), or `main`.
- DO NOT deploy. Commit on `v2-ui`; the user reviews live (and runs `vercel --prod`) themselves.
- DO NOT regress `_hero` (loops lazy + pause-offscreen + reduced-motion poster) or the 1996 reader
  tie-in / its search-exclusion. Re-verify both after wiring.
- `prefers-reduced-motion` MUST produce a calm, fully static page (no parallax, no entrance transforms).
- Branch move: verify git state first. If another session is mid-commit on `outreach-engine`, prefer
  creating `v2-ui` off the current HEAD over a force-rename — coordinate, don't clobber the concurrent
  work. Never rewrite shared history under a live concurrent editor.
- Internal files never ship (the `.vercelignore` default-deny allowlist is the gate). New `_reveal.css`/
  `_reveal.js` ship via the `!/_*.css` / `!/_*.js` allow rules — fine. Keep any review scratch in a
  gitignored dir (e.g. `_reveal-test/`); delete the throwaway test page before committing.

=== OPEN VALUES (propose sensible defaults; mark user-tunable) ===
- Branch name: `v2-ui` (suggested; user-tunable — could be `v2-ui-revamp`, `site-v2`, etc.).
- Parallax magnitude: ±12px on desktop, 0 on mobile (≤700px). Tunable.
- Reveal easing = existing `--ease`; entrance duration ~0.6–0.9s; caption stagger ~60–90ms. Tunable.
- "Develops-in" treatment: bottom-up clip-path wipe + `scale(1.04)→1` + fade. Tunable (direction/scale).
- Final-resolution (Item D): a data-helix / connective accent into the archive grid; if it reads busy,
  fall back to a clean settle-fade and log it.

=== DELIVERABLES ===
1. The implemented choreography committed on `v2-ui` (NOT deployed).
2. `_reveal.js` + `_reveal.css` — reusable, documented, generic; ready for bios/data pages to reuse.
3. the-collection.html wired (the five eras animate; loops + 1996 reader still work; doc still absent
   from search).
4. EDITORIAL RECAP at `tasks/preservation-page-v2-recap.md` (tasks/ is gitignored — correct local home)
   — MANDATORY, layman-termed, well-referenced (link real paths). Per item A–D AND the 2× review: what
   was built, approach + why, decisions/tradeoffs/learnings, where & how to test it, and exactly what the
   user should review or might want to change.
5. KEY CONSIDERATIONS (section in the recap) — MANDATORY: watch-outs + tradeoffs on motion taste,
   accessibility (reduced-motion / vestibular), performance/mobile cost, the reusable-module design
   choices that lock in future bio/data work, and the branch move.
6. SUGGESTED NEXT STEPS (section in the recap) — MANDATORY: prioritized shortlist seeding the next
   /goal (e.g. "roll `_reveal` to a brother bio — Alexander," "data-page heroes — Wellness + Map,"
   "revisit the pinned-scrollytelling concept if you want more"), naming dependencies (e.g. user
   review/deploy of this page first).

=== DONE WHEN ===
- `_reveal.js` + `_reveal.css` exist, are generic/reusable/documented, and passed their standalone test.
- the-collection.html's five eras carry the choreographed reveal + parallax (develops-in loops, rising
  captions, animated year-markers, image↔text parallax, guided prose) plus the final resolution into the
  archive grid — and the story stays readable and primary.
- The `_hero` loops still lazy-load / play / pause off-screen; `prefers-reduced-motion` yields a calm
  static page; the 1996 reader still opens and the doc is still absent from search.
- The 2× expert-panel review was run; the collective findings were triaged and a coherent set of
  improvements applied each round; both rounds are recorded in the recap.
- Full QA passes at 1280px and 390px (normal + reduced-motion); no console errors; CLS≈0;
  transform/opacity-only.
- Recap + Key Considerations + Suggested Next Steps written at `tasks/preservation-page-v2-recap.md`.
- All work committed on `v2-ui`; nothing deployed; `main` untouched; `experience-v2/landing.html` and the
  bios/viz pages untouched; no internal content exposed.
```
