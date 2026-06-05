# Collection-Wide `sigSummary` Rewrite — Plan

**Status:** PROPOSED (awaiting "go"). Authored 2026-06-05.
**Goal:** Rewrite all 273 letter summaries to one consistent, stronger editorial voice — a 1–3 sentence (4 if the letter is short) executive hook that always grounds the reader in the one or two most important facts, invites click-in, and surfaces the *humanity* of the letters without being heavy-handed. Do it carefully so nothing is lost or broken across the derived data.

This supersedes the partial `sigsummary-style-guide.md` / `sigsummary-proposals.json` effort (which only de-labeled 68 ALLCAPS-prefixed entries) and folds it in.

---

## 1. The editorial framework (the new voice)

Every summary is a standalone **executive hook** for one letter. It must work in a tooltip, an info panel, search results, and the reader's summary box.

**Always include — the anchor (non-negotiable):**
- The **one or two most important facts** a historian connecting the dots needs: the key event, place, person, milestone, or stake. This is the grounding *and* the hook. If a reader takes one thing away, it is this.

**Then, as space allows:**
- A second clause of context that situates the anchor (where in the war, why it matters, what it connects to).
- A **human beat** — the texture that makes these people real (a fear, a small domestic detail, a flash of humor, a moral turn). Woven in, not tacked on. *Optional:* skip it when the historical substance is itself the core and a human note would dilute it.

**Form:**
- 1–3 complete sentences; a 4th only when the letter is short and a fuller hook genuinely adds value. Soft target ~110–280 characters.
- Consistent register: editorial-historical, warm but never sentimental or melodramatic.
- Reads as prose, standalone and skimmable.

**Hard rules (carried over + tightened):**
- **Filter, never a source** — every fact must come from this letter's transcription/metadata. No invented dates, names, units, outcomes, or inferences beyond the text. (This is the project's cardinal rule.)
- No ALLCAPS label prefixes ("BATTLE OF FAIR OAKS —", "CRITICAL SOURCE:").
- No bare topic-lists ("Winter conditions, furlough, Thanksgiving, taxes.").
- No markdown. Preserve real dates/names/units/places exactly as in the source.
- Don't spoil the letter's emotional payoff — tease the stakes, invite the click.

**Before / after illustration (from real entries):**
- Before: `BATTLE OF FAIR OAKS — FIRSTHAND COMBAT ACCOUNT. "You can have no conception of how exciting it is to be in a battle`
- After (shape): `Henry's first firsthand account of combat, written days after Fair Oaks — the exhilaration and terror of the line, in a voice still surprised to have survived it.`

---

## 2. Data flow — what the rewrite must touch (and not break)

Canonical source → derived copies. Mapped from the codebase:

| File | Field | Records | How it updates |
|---|---|---|---|
| `03-data/all-letters.json` | `sigSummary` | 273 | **CANONICAL — edit here** |
| `_search-data.js` | `ss` | 273 | **Manual today — propagation gap (see §3)** |
| `_overlay-data.js` | `LETTER_INDEX[].ss` | 273 | auto: `build-overlay-data.py` (truncates ~160 char) |
| `03-data/map-movements.js` | `sigSummary` | 273 | auto: `generate-map-movements.py` |
| `viz-people-web.html` | `sigSummary` | ~230 | auto: `build-people-web-data.py` |
| `viz-emotional-arcs*.html`, `viz-what-they-didnt-know.html` | `sigSummary` | 273 | `build-emotional-arcs.py` (pass-through) |
| `hubbell-dashboard.html`, `viz-map-fullwar.html`, `viz-map-moves.html` | `sigSummary` (embedded blob) | 273 | **hardcoded — no clean build step today (see §3)** |
| `02-transcribed-markdown/letters/*.md` | "Historical Significance" section | 273 | **not auto-synced — decision needed (§5)** |

**Also worth a concurrent cleanup:** several summaries contain a `?` where an en/em-dash belongs (a pre-existing encoding artifact). Fix during the same pass.

---

## 3. Infrastructure to build FIRST (de-risks everything)

The biggest risk isn't the writing — it's drift between the canonical JSON and the hand-maintained copies. Fix that before rewriting:

1. **One `propagate-summaries.py`** that regenerates **every** derived copy from `all-letters.json` in a single command — including the two gaps the audit found:
   - `_search-data.js` (`ss`) — currently hand-maintained.
   - the embedded `sigSummary` blobs in `hubbell-dashboard.html`, `viz-map-fullwar.html`, `viz-map-moves.html` — currently hardcoded. The script patches each blob in place (regex/anchored replace keyed by letter `id`), leaving all other fields byte-identical.
   - It should also call the existing `build-overlay-data.py`, `generate-map-movements.py`, `build-people-web-data.py`, `build-emotional-arcs.py` so one run fully syncs the tree.
2. **A verifier** (`verify-summaries.py`): after propagation, assert every file's summary for each `id` matches the canonical (modulo the documented ~160-char overlay truncation), and that all 273 ids are present everywhere. Fails loud on drift.

These two scripts are reusable for all future edits — they pay for themselves immediately.

---

## 4. Execution approach (proposals → adversarial review → apply → propagate)

Mirrors the project's existing safe pattern (proposals file, `approved:false`, git-reviewable), scaled with multi-agent orchestration since it's 273 records.

**Phase A — Generate (multi-agent workflow).** Fan out the 273 letters in batches. Each agent receives a letter's **full transcription + metadata** (date, author, recipient, place, flags, people/places) and the current `sigSummary`, and returns a new summary plus a grounding trace:
```
{ id, old, new, keyFacts:[…], humanBeat:"…"|null, charCount, groundedIn:"quote/line refs" }
```
The `groundedIn` field forces the model to point at the source for its claims — the anti-invention guardrail. Output → `04-analysis/sigsummary-v2-proposals.json`.

**Phase B — Verify (adversarial pass).** Independent agents re-read each letter and judge each proposal on: (1) factual grounding — no invented facts; (2) contains the key fact(s); (3) length/voice/format compliance; (4) hook quality. Anything failing (1) is auto-rejected back to Phase A; (2)–(4) flagged for human review. You spot-check a sample + every flagged entry; approval flips `approved:true`.

**Phase C — Apply + propagate.** Apply approved summaries to `all-letters.json`; run `propagate-summaries.py`; run `verify-summaries.py`; fix `?` dash artifacts; resolve the markdown decision (§5).

**Phase D — Ship.** `git diff 03-data/all-letters.json` is the human-readable record of every change. Browser spot-check across dashboard/map/people-web/search tooltips. Commit in reviewable batches (e.g., by author or year) so nothing lands as one opaque blob.

---

## 5. Open decisions for you (need answers before "go")

1. **Markdown sync** — the per-letter `.md` files carry a "Historical Significance" copy that isn't auto-synced. Options: (a) extend `propagate-summaries.py` to rewrite that section too, or (b) declare JSON canonical and let the markdown copy go stale / drop it. *Recommendation: (a)* — keep them in sync for provenance.
2. **Scope of run** — all 273 in one campaign, or pilot one author (e.g. Henry's 59) first to lock the voice, then roll the rest? *Recommendation: pilot Henry, you approve the voice, then fan out.*
3. **Length ceiling** — confirm the ~110–280 char soft target and the "4 sentences only if the letter is short" rule.
4. **Existing 68 proposals** — fold into this v2 pass (regenerate fresh under the new rules) rather than running the old de-label-only normalize. *Recommendation: supersede.*
5. **Orchestration** — this is the textbook case for a multi-agent **workflow** (fan-out generate → adversarial verify → synthesize). It will spawn dozens of agents and use significant tokens. Confirm you want me to run it that way when we execute.

---

## 6. Why this is safe

- Canonical-first edits; every change shows in `git diff` before commit.
- `propagate-summaries.py` + `verify-summaries.py` close the two drift gaps and make sync one command + one assertion.
- Filter-never-source + a per-summary `groundedIn` trace + an adversarial verification pass guard against invented history.
- Proposals are reviewable and `approved:false` by default — nothing lands without sign-off.
- Pilot-then-scale locks the voice before touching the whole collection.
