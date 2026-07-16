# Reader Revamp — Recap

**What this was:** redesign the letter-reader that opens on the experience-v2 landing page so it
evokes the 1860s era — "a letter read by lamplight" — instead of looking like a generic modern data
panel, while keeping (and improving) everything it does. Run AFK via `/goal`, hardened through 3 rounds
of simulated expert + user testing, then deployed to production.

**Status: DONE and LIVE on production** (`hubbell-civil-war-history.vercel.app`), on branch `v2-ui`.
The shared dashboard/collection readers are untouched.

To see it: open the homepage, scroll to the "What they wrote" voices, and tap a **Read letter** pill.
(Open in a fresh tab or add `?v=2` to dodge the 1-hour browser cache.)

---

## What was built, stage by stage

### The big discovery (why this is more than a re-skin)
The landing's "Read letter" pills were opening a **stripped-down** reader (a simple header + the letter
text). The richer reader you remembered from the Preservation page — the one with the **key-event toggle
pills**, the editor's summary, and the people/places lists — is a *different* reader (`HubbellReader.open`
in `_reader.js`). It needs the full letter dataset, which the landing's lightweight iframe wasn't loading.

**The fix:** point the landing at the full reader and give it the data it needs.
- `reader.html` (the isolated frame the landing opens) now loads **`_search-data.js`** (the full 272-letter
  dataset) and calls **`HubbellReader.open(id)`** instead of the stripped overlay.
- Result: the landing reader now has the **key-event toggles, the editor's summary, and the people/places
  apparatus** — the same as the Preservation page — all in one move. *(This is what your mid-run note about
  the "key event pill toggles" surfaced — they were never in the landing reader before.)*

### The era theme — `_reader-era.css` (new file)
A single new stylesheet, loaded **only** inside the `reader.html` iframe, so it physically cannot affect
the dashboard/collection/people-web/search readers (verified: those pages load 0 references to it). It:
- turns the panel into a **dark, warm, lamplit frame** with a soft amber glow pooling behind the letter;
- lifts the letter body out as a **luminous parchment document** (warm cream, faint paper texture, an
  **illuminated gold drop-cap** opening the first line) — the letter is the hero;
- styles the **From → To letterhead** with small wax-seal dots in each person's color, and a serif dateline;
- **redesigns the key-event toggles** (Battle / Illness / Wound / Death) into clear on/off controls under a
  "HIGHLIGHT IN LETTER" label — ON = filled pill with a bright dot, OFF = dimmed hollow pill — and ties each
  toggle's color to the soft wash it produces in the letter;
- keys the in-letter highlight color to the **severity** (slate for death, umber for illness, rust for
  battle) so it reads as dignified emphasis, not a highlighter pen;
- de-weights the people/places "mentioned" tags into a quiet reference index so they don't bury the letter;
- gives the footer nav (brother filter + prev/next) a warm, legible treatment.

**Files touched:** `_reader-era.css` (new, ~260 lines), `reader.html` (loads the data + full reader + era
css), `experience-v2/landing.html` (cache-bust bumped to `rv=3`). No changes to the shared reader code or CSS.

### How to test it
- Production: homepage → "What they wrote" → **Read letter** (fresh tab / `?v=2`).
- Any specific letter directly: `hubbell-civil-war-history.vercel.app/reader?id=<LTR-ID>&rv=3`
  (e.g. `…/reader?id=LTR-1862-12-08-001&rv=3` — a rich letter with all three toggles).
- **Try the toggles:** click "Wound"/"Illness"/"Death" — the matching passages in the letter light up /
  go dark; the pill shows filled (on) vs hollow (off).
- **Close it** with the ✕, click the backdrop, or Esc, then open another — it should reopen cleanly.

### What was verified
- **Functional (in a real browser, on the live preview & prod):** open → the full era reader renders with
  the key-event toggles; the toggles correctly highlight/un-highlight passages; **close releases the overlay
  (pointer-events → none)** so the page stays interactive; reclicking another letter reopens. No console
  errors beyond the harmless favicon.
- **Isolation:** the-collection / hubbell-dashboard / viz-people-web readers load 0 references to the era
  CSS — they look and work exactly as before.
- **Gate intact:** internal files (`docs/PHASE-3-PLAN.md`, `04-analysis/*`) still return 404 after deploy.

---

## What each of the 3 testing rounds changed

Each round rendered the reader across representative letters (a wound/many-mentions letter, a mother's
letter, a short one, a clean one) and gathered critique from an **expert trio** (UI designer, UX specialist,
Civil-War/archival historian) plus **3 user personas** (descendant-researcher, casual enthusiast,
museum educator). 18 independent reviews total.

| Round | Focus | Top things they flagged | What changed |
|---|---|---|---|
| **1** | Look & feel | "The lamp isn't lit" (flat black frame); flat textureless parchment; candy-LED seal dots; **a Share button overlapping the recipient name** (a real bug); monospace dateline reads techy; **drop-cap landing on the date** | Added the warm lamp glow; warmed + textured the parchment, squared/lit its edge; matte wax-seal dots; reseated the Share button (it was `position:absolute`); serif dateline; moved the illuminated initial off the date. *(Also surfaced the deeper structural pivot to the full reader.)* |
| **2** | Hierarchy & flow | The **key-event toggles looked identical to the passive tags** — no signal they're controls; apparatus front-loads the letter (tag-soup); in-text highlights "paint over" the words / look like links; summary confusable with the soldier's words; salutation wrongly right-aligned | Redesigned toggles into labeled stateful controls ("HIGHLIGHT IN LETTER", color-contract with the wash); de-weighted the mentioned tags to a quiet index; softened highlights to dignified washes (no underline); relabeled the summary "EDITOR'S SUMMARY"; fixed the salutation/drop-cap to be robust across letters |
| **3** | Craft & polish | Toggle ON-brightness varied by hue (dark Death/Wound looked OFF); the "HIGHLIGHT" label too faint; in-text death/illness words all colored alarm-rust; drop-cap sat a hair high | Made **fill-presence** the consistent ON/OFF rule (hue carried by a dot + border, so all categories read equally "on"; grey→slate to avoid "disabled" look); lifted the label contrast; keyed highlight word-color to severity + lifted the washes; refined the drop-cap to a true 2-line illuminated initial |

---

## Key considerations (worth your attention)

- **The landing reader and the shared readers now diverge in look** (the landing is era-themed; the
  dashboard/collection readers still wear the original style). This is intentional — this was the *pilot*.
  If you like it, the same theme can later be promoted to the shared readers (see next steps).
- **The era reader is now a heavier load** — `reader.html` pulls in `_search-data.js` (~900 KB, the full
  letter dataset) so it can show the rich apparatus. It loads once when a reader is first opened inside the
  (cached) iframe; acceptable, but worth knowing.
- **Cache discipline:** `reader.html` and `_reader-era.css` are cached for an hour. The landing opens the
  reader at `…&rv=3`; **bump `rv` (in `experience-v2/landing.html`'s `openReader`) and the `?v=` on the era
  CSS link in `reader.html` whenever either file changes**, or returning visitors get a stale version.
- **Several genuinely good asks are feature/data work, not visual polish, so they were deliberately left
  out of this CSS-only pass** (and flagged by reviewers): a per-letter **source/provenance + "view original
  scan"** block and a copy-ready citation (the museum educator's repeated ask); a **byline on the editor's
  summary** ("who wrote this — human or AI?") and a one-line **"why" rationale** under the highlight
  controls; a **"clear all / none selected"** state for the toggles; and one **matching-accuracy bug** the
  historian caught — the word "grave" in *"graveyard fence"* gets flagged as a death moment because the
  highlighter does a loose substring match (this lives in `_reader.js`, not the theme).

---

## Suggested next steps (seeds the next /goal)

1. **Founder review of the look** (no dependency) — open the homepage, read a few letters, toggle the
   key-event pills. Decide: ship as-is, tweak, or adjust the palette (all the colors/sizes are tunable
   custom-properties at the top of `_reader-era.css`).
2. **Provenance + citation layer** (highest-value feature ask) — add a per-letter source line (collection /
   reference) + a "view original" affordance + copy-ready citation, and a short editorial-method/byline note
   on the summary. This is what moves it from "beautiful" to "citable" for the academic/museum audience.
   *(Touches `_reader.js` + data; a real feature, scope it on its own.)*
3. **Fix the highlight word-matching** (`_reader.js`) — word-boundary/sense matching so "graveyard" doesn't
   trip the death flag; add a "clear all" control for the toggles. Small but credibility-relevant.
4. **Promote the era theme to the shared readers** (depends on #1 approval) — once the look is signed off,
   bring the dashboard/collection/people-web readers onto the same aesthetic, as the next step of the
   broader per-section-page redesign already on the roadmap.

---

*Reviewer screenshots from each round are saved at the repo root as `era-*.png` (gitignored, local only).*
