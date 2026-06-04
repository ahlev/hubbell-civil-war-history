# `sigSummary` Style Guide & Normalization

**Created:** 2026-06-04 (web-polish item #5)
**Status:** Pipeline + proposals built. **Canonical data NOT yet mutated — awaiting your review.**

## Why this exists

Each letter carries a `sigSummary` — the one- or two-line editorial summary shown
to readers in the letter reader's executive summary, the Map info panels, search
results, and (in Phase 6) press-kit screenshots. An audit of all 273 found **68**
that open with an ALLCAPS research-note label:

- Pure source-scaffolding: `CRITICAL SOURCE:`, `RESOLVES DATING DISCREPANCY:`,
  `MULTI-FACETED MAJOR SOURCE:`, `COMPLETE DAILY SCHEDULE:`
- Topical headers: `GETTYSBURG —`, `ATLANTA CAMPAIGN —`, `MOTHER'S GRIEF —`,
  `FAIR OAKS —`

These read as internal notes-to-self, not reader-facing prose. The other ~205 are
already clean editorial sentences.

## Target style

> **A person-centred, one-line claim, followed by ≤1–2 sentences of context.**
> No ALLCAPS label header. ~200 characters. Present tense for narration of the
> letter's content; past tense for established historical fact.

Good: *"Alexander's regiment storms Lookout Mountain; he is wounded in the assault."*
Good: *"Henry describes the grand review of the Army of the Potomac — the most
relaxed letter in his collection, written 51 days before Antietam."*
Avoid: *"WOUNDED AT LOOKOUT MOUNTAIN — Alexander's regiment storms…"* (label header)
Avoid: *"MULTI-FACETED MAJOR SOURCE: (1)… (2)…"* (research note / list)

## The cardinal rule applies

**Claude is a filter, never a source.** Normalization may *restructure and de-label*
the existing summary; it may **never** add a claim the summary did not already make,
change a date/name/number, or soften/strengthen an assertion. When unsure, keep the
original wording. Every edit is reviewable in git and reversible.

## Workflow (review-then-apply — provenance-safe)

1. **Generate proposals** (already done):
   ```
   python scripts/normalize-sigsummary.py
   ```
   → writes `04-analysis/sigsummary-proposals.json` — 68 entries, each with
   `original`, a deterministic `proposed` (caps-label stripped, first letter
   re-cased), a `classification` (`auto-clean` | `needs-review`), and
   `"approved": false`.

2. **Review.** Open the proposals file. The 53 `auto-clean` entries are usually
   fine as-is; the 15 `needs-review` (bare quotes, numbered lists, fragments) need
   a real rewrite toward the target style above. Edit any `proposed` text, then set
   `"approved": true` on the ones you accept. *Tip: even some `auto-clean` ones lost
   useful framing when the label was stripped (e.g. `RESOLVES DATING DISCREPANCY:` →
   a bare quote) — fold that meaning back into the prose before approving.*

3. **Apply** (writes only `approved:true` entries back to `03-data/all-letters.json`):
   ```
   python scripts/normalize-sigsummary.py --apply
   ```
   Then review `git diff 03-data/all-letters.json` and commit.

### Optional: batch LLM rewrite for the `needs-review` set

For the harder 15, you can draft rewrites with the Claude API (Batches, 50% cost,
async — see the `/claude-api` skill). Strict prompt:

> *You are normalizing an editorial summary of a Civil War letter. Rewrite the
> SUMMARY below into one clean reader-facing sentence (≤2 short sentences, ~200
> chars), person-centred, no ALLCAPS label header. PRESERVE EVERY FACT — every
> date, name, number, place, and claim — exactly. Do NOT add anything not already
> in the summary. If you cannot rewrite without inventing, return the original
> unchanged. SUMMARY: «...»*

Stage the output back into the `proposed` fields, review, then `--apply`.

## Known data-quality note (separate issue)

Several summaries contain a `�` replacement character where an en-dash/em-dash
belongs (e.g. *"Feb. 11 � 13, 1862"*) — a pre-existing encoding artifact in the
source, NOT introduced here. Worth a separate cleanup pass (a targeted
`� → –` replace, verified case-by-case); deliberately left untouched here to avoid
guessing the intended character.
