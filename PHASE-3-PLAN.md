# Phase 3: External Source Cross-Referencing

> Operational plan for enriching the Hubbell collection with verified data from public Civil War archives, detecting discrepancies between family letters and the historical record, and producing a publishable methodology for LLM-assisted historical research.

**Status:** Active planning, drafted 2026-05-19. Supersedes the Phase 3 section of `PROJECT-PLAN.md`.

---

## 1. Mission

Triangulate the Hubbell family's lived experience against the wider historical record. For each of the four brothers — Henry, Alexander, Charles, James — locate every credible mention in publicly accessible archives (service records, regimental histories, battle data, newspaper accounts, burial records). Use the resulting evidence to fill gaps the letters can't fill, surface discrepancies between what the family said and what the record shows, and document the methodology itself as a contribution to digital humanities practice.

This is not enrichment for its own sake. The goal is to produce **findings** — verified facts, identified gaps, documented disagreements between sources — that deepen the existing visualizations, novel, and story pages, while generating a portable methodology that's publishable on its own merits.

---

## 2. Scope and Sequencing

**Phase 3a (this plan):** Four brothers only.

1. **Henry Hubbell** — 34th NY, KIA Antietam, body never recovered. Highest narrative priority (the gap is widest).
2. **Alexander Hubbell** — 60th NY, color bearer, mustered out 1865.
3. **Charles Hubbell** — 153rd NY, Red River Campaign, died 1875 from service disease.
4. **James Hubbell** — youngest, Cedar Creek (wounded, night blindness), died 1865.

**Phase 3b (secondary, after 3a proves the methodology):** Frances Hubbell (mother, four extraordinary letters but never a soldier — different source mix: census, pension as widow/dependent).

**Phase 3c (tertiary):** Individuals mentioned 10–20+ times across the corpus who carry a military identity (officers and comrades — to be identified by querying the existing people registry against the letter corpus for mention counts, then filtering for military context).

Everyone else is out of scope for this phase.

---

## 3. Sources in Scope (Phase 3a — Free Only)

| Source | What It Gives Us | Access Method | Per-Brother Output |
|--------|------------------|---------------|---------------------|
| **NPS Civil War Soldiers & Sailors System (CWSS)** | Service record index, unit verification | Firecrawl fetch + URL search | `cwss.json` |
| **NPS Battle Units Search** | Regiment battle participation, unit history | Firecrawl fetch | `battle-units.json` |
| **ACW Battle Data CSV** | Programmatic battle dates/locations | One-time CSV download | Shared `battle-data.csv` |
| **American Battlefield Trust** | Battle context, casualty data, animated maps | Firecrawl fetch | `battle-details/*.json` |
| **Chronicling America (LOC)** | Contemporary newspaper mentions | API + Firecrawl, LLM-verified | `chronicling-america-candidates.json` + `-verified.json` |
| **FindAGrave** | Burial location, gravestone, family links | Firecrawl fetch | `findagrave.json` |
| **SUVCW Graves Registration** | Verified Union soldier graves | Firecrawl fetch | `suvcw.json` |
| **NY State Muster Rolls (NYSMM)** | Enlistment date, age, physical description, company roster | Firecrawl fetch where digitized; otherwise note as "manual retrieval needed" | `ny-muster-rolls.json` |
| **LOC Regimental Histories Guide** | Links to published unit histories (PDF/scanned) | Manual review, then Firecrawl on linked PDFs | `regimental-bibliography.json` |
| **Valley of the Shadow + university letter collections** | Comparative letters from same campaigns | Firecrawl + LLM screening for relevance | `comparative-letters.json` |

Every source produces structured JSON. Negative results are first-class: a `cwss.json` recording "checked, no match" is as important as one with a hit.

---

## 4. Out of Scope (For Now)

- **Ancestry.com**, **Fold3** — subscription. Revisit only after 3a proves substance.
- **Pension files (NARA NATF Form 86)** — manual postal retrieval. Henry's claim number (`Mo C 58119`) is known; this is the single highest-value subscription/manual source. Defer to a Phase 3b decision point.
- **Per-letter location-vs-regiment-position verification** for all 273 letters. Defer until per-person work surfaces specific dates worth checking.
- **Live (in-browser) external lookups** from the public site. The current scope is backstage data work; site integration is a later phase.

---

## 5. Methodology — Claude as Disambiguating Filter

The intellectual core of this phase.

**Problem.** Public archives return noisy results. A Chronicling America search for "H. Hubbell" returns hundreds of OCR'd candidates, most of them irrelevant or false positives from broken token boundaries. A CWSS query for "Hubbell" returns many soldiers. Human review at this scale is slow; pure keyword filtering is wrong.

**Approach.** Claude reads each candidate's surrounding text and applies a structured disambiguation rubric (`03-data/external-sources/methodology/disambiguation-rubric.md`) to produce a verdict:

- `confirmed` — dispositive evidence this is the right person
- `likely` — strong corroborating signals, no contradictions
- `possible` — partial match, ambiguous
- `unlikely` — weak signals or contradicting evidence
- `rejected` — confirmed not this person

Every verdict is logged with its reasoning to `03-data/external-sources/methodology/verification-log.jsonl`. Only `confirmed` and (after researcher review) `likely` matches flow into the per-person source files. `possible` matches sit in a review queue; `unlikely` and `rejected` are recorded for transparency.

**Why this is novel.** Most digital humanities work either trusts full-text OCR rankings (too noisy) or relies on full human review (too slow at scale). LLM-mediated verification with logged reasoning sits in the middle and is auditable in a way pure ML classifiers aren't. This is the methodology paper's central claim.

**Critical discipline.** Claude **never** invents records. It only judges fetched candidates. The source's own data is the only data of record; Claude's role is the filter, never the source.

---

## 6. Confidence Integration

External findings plug into the existing three-axis confidence model:

- **Basis:** always `external` for findings sourced this way.
- **Legibility:** typically `n/a` (these are not handwritten primary sources), but use `partial` for OCR-derived data where character recognition was clearly imperfect.
- **Source certainty:** graded by source quality.
  - `definite` — government-compiled service records (CWSS, CMSR), official muster rolls
  - `secondhand` — user-submitted databases (FindAGrave entries without source citation), regimental histories written decades after the war
  - `rumor` — newspaper accounts of unverified events, hearsay in pension depositions

This grading lives in `methodology/source-quality-notes.md` and is refined as we encounter each source's failure modes.

---

## 7. File Layout

```
PHASE-3-PLAN.md                              ← this document
03-data/
  external-sources/
    civil-war-source-catalog.md              ← existing, the canonical source list
    README.md                                ← directory map and conventions
    per-person/
      PER-hubbell-henry/
        _index.md                            ← summary view + status checklist
        cwss.json
        battle-units.json
        findagrave.json
        suvcw.json
        ny-muster-rolls.json
        chronicling-america-candidates.json
        chronicling-america-verified.json
        regimental-bibliography.json
        comparative-letters.json
      PER-hubbell-alexander/
      PER-hubbell-charles/
      PER-hubbell-james/
    shared/
      acw-battle-data.csv                    ← downloaded once, shared
      battle-details/                        ← per-battle ABT fetches keyed by battle slug
    methodology/
      disambiguation-rubric.md               ← criteria for verdict assignment
      verification-log.jsonl                 ← every Claude verdict + reasoning, append-only
      source-quality-notes.md                ← what we've learned about each source
      iteration-journal.md                   ← what's working, what's not, weekly notes
04-analysis/
  phase-3-discrepancies/
    INDEX.md                                 ← discrepancy registry
    DSC-YYYY-MM-DD-NNN.md                    ← one file per discrepancy
  phase-3-methodology-paper.md               ← working draft of the publishable piece
```

### Per-source JSON schema (uniform across sources)

```json
{
  "source": "NPS CWSS",
  "person_id": "PER-hubbell-henry",
  "checked_date": "2026-05-19",
  "url_searched": "https://www.nps.gov/...",
  "query_used": "Henry Hubbell, 34th NY",
  "candidates_returned": 3,
  "candidates": [
    {
      "raw_record": { ... },
      "claude_verdict": "confirmed | likely | possible | unlikely | rejected",
      "claude_reasoning": "Cited evidence + which rubric criteria applied",
      "researcher_reviewed": false,
      "researcher_override": null
    }
  ],
  "verified_matches": [ ... ],
  "confidence": "external · n/a · definite",
  "null_result": false,
  "notes": ""
}
```

### Per-person `_index.md`

Lightweight summary: checklist of sources × status, count of verified findings, count of pending candidates, last-updated date. Becomes the at-a-glance view when you open a brother's folder.

---

## 8. Per-Person Workflow

For each of the four brothers, repeat this loop:

1. **Read** the existing `PER-*` person profile (or for the three brothers who don't yet have one, create the file from the template using letter-corpus data).
2. **Identify search terms.** Curated name variants, regiment, hometown, date range, known battles. These come from the profile — never invented.
3. **Per source in priority order** (CWSS → Battle Units → FindAGrave → SUVCW → NY Muster Rolls → ABT → Chronicling America → Regimental Histories → Valley of the Shadow / university collections):
   - Fetch via Firecrawl with the curated query.
   - Save raw response (or relevant excerpt) into the per-source JSON.
   - For each candidate, Claude applies the rubric and writes a verdict + reasoning.
   - Append every verdict to `verification-log.jsonl`.
4. **Update** the brother's `PER-*.md` external-source table: check the box, link the artifact, summarize the finding (one line).
5. **Identify discrepancies** between findings and letter content. For each, write a `DSC-*.md` file. Examples:
   - Letter states a location on a date; regiment was elsewhere per CWSS.
   - Family Bible / introduction letter states a death date; the official record disagrees.
   - Letter says "Capt. Reich" but muster roll says "Capt. Reach."
6. **Refine the rubric** when Claude's verdicts disagree with the researcher's. Each override is a learning moment captured in the rubric and the iteration journal.

---

## 9. Discrepancy Detection

Discrepancies are the punchline of Phase 3 — what makes this more than enrichment.

**Severity grading:**

- **Major** — affects narrative, biography, or identification (e.g., disputed death date, mistaken regiment, lost-then-found burial).
- **Notable** — affects a specific event or fact (e.g., location on a given date, name spelling that points to a different person).
- **Minor** — orthographic or trivial (variant spellings of the same person/place, off-by-one dates).

Major and notable get their own `DSC-*.md` files. Minor are tabulated in `INDEX.md` without dedicated files.

**`DSC-*.md` structure:**

```
# Discrepancy: <short title>

- **Date filed:** YYYY-MM-DD
- **Severity:** major | notable
- **Persons involved:** [PER-... IDs]
- **Letters involved:** [LTR-... IDs]
- **External sources involved:** [list with URLs/citations]

## What the family said
(letter excerpt + LTR id)

## What the record shows
(external evidence + citation)

## What's likely true
(researcher's reasoned conclusion + confidence)

## Why this matters
(narrative implication — feeds the methodology paper and possibly the novel)
```

---

## 10. Iteration and Visibility

You asked specifically for ways to work with and explore the findings. Three mechanisms, in increasing build cost:

### 10.1 Static review surfaces (Day 1 — exists as soon as we start)

- `03-data/external-sources/per-person/PER-*/{_index.md, *.json}` — open in any editor, scan in seconds.
- `04-analysis/phase-3-discrepancies/INDEX.md` — running registry.
- `methodology/iteration-journal.md` — short notes after each batch ("Chronicling America OCR splits 'Hubbell' across line breaks ~12% of the time; rubric updated").

### 10.2 Verification log queries (Day 2 — useful from day 5 onward)

`verification-log.jsonl` is append-only JSONL — one verdict per line. Query patterns to add to `iteration-journal.md` as we discover them:

- "Show all `possible` verdicts I haven't reviewed yet."
- "Show every verdict where Claude said `confirmed` but I overrode to `rejected`." (these are the methodology's failure cases — gold for the paper.)
- "Show verdicts by source — which source has the highest disagreement rate?"

A small Python script (`scripts/phase3-query.py`) wraps these queries. Output goes to stdout or markdown.

### 10.3 Phase 3 Console (Phase 3a midpoint — build when there's enough data to make it worth the time)

A local single-file HTML page (`phase3-console.html`) following the same patterns as `hubbell-dashboard.html`:

- **Tab: Per-person status.** A matrix of sources × persons with check states, click any cell to drill into the source JSON rendered as a readable table.
- **Tab: Review queue.** All `possible` and `likely` (unreviewed) candidates with Claude's reasoning. Two buttons (Accept / Reject) write back to the source JSON and append to the verification log.
- **Tab: Discrepancies.** Sortable list of `DSC-*.md` files, severity-filterable, click to open.
- **Tab: Methodology log.** Search/filter `verification-log.jsonl` in-browser. The pattern-spotting view.

Build trigger: when the static review surfaces start to feel cramped — likely 50+ verdicts in the log, or when reviewing the queue takes more than 15 minutes per session.

### 10.4 Feedback loop

Every researcher override of a Claude verdict → update `disambiguation-rubric.md` if the override reveals a missing criterion → re-run any open candidates against the new rubric if it materially changes verdicts. This is how the methodology improves; the rubric is a living document, not a frozen spec.

---

## 11. Methodology Paper (Parallel Deliverable)

A 3,000–5,000 word piece, working title:

> **"Triangulating the Hubbell Letters: LLM-Mediated Disambiguation as a Method for Family-Archive Historical Research"**

**Core argument.** A single family's primary-source archive can be enriched at scale by combining open Civil War data sources with LLM verification — provided the LLM acts strictly as a candidate filter, every verdict is logged with reasoning, and a researcher remains in the loop for override and rubric refinement. The method preserves provenance discipline, generates auditable findings, and scales to the level of an individual researcher with no institutional resources.

**Structure (working outline):**

1. Background — the Hubbell collection in one page (273 letters, four brothers, the gap problem)
2. Architecture — the three-layer / three-axis schema (lifted from `DATA-ARCHITECTURE.md`)
3. The disambiguation problem — concrete examples of noisy returns from CWSS and Chronicling America
4. Method — Claude as filter, the rubric, the verification log
5. Results — discrepancies found, gaps closed, surprises encountered
6. Failure modes — where the method broke and how the rubric evolved
7. Discussion — implications for family-history practice and small-scale digital humanities work
8. Reproducibility — what someone with their own family archive would need

**Source material for the paper:** the `verification-log.jsonl` and the `disambiguation-rubric.md` are the paper's evidence base. Every claim in the paper traces back to a logged line. This is what makes it defensible.

**Draft lives at:** `04-analysis/phase-3-methodology-paper.md`. Start the working draft once 3a is half complete; finalize once 3a wraps. Companion deliverable: a 600-word blog/thought-leadership piece for general audience (separate file, derived from the paper).

---

## 12. Phasing

| Sub-phase | What | Rough effort | Output |
|-----------|------|--------------|--------|
| **3a-1** | Scaffold (this doc, directories, README, rubric stub) | 1 session | Phase 3 plan + directory structure ready |
| **3a-2** | Henry first — pilot the workflow end to end on highest-stakes brother | 2–4 sessions | `PER-hubbell-henry/` populated, ≥1 `DSC-*.md`, rubric refined |
| **3a-3** | Alexander, Charles, James — apply the now-validated workflow | 3–5 sessions | All four brothers' folders populated |
| **3a-4** | Comparative letter scan (Valley of the Shadow, university collections) | 1–2 sessions | `comparative-letters.json` per brother |
| **3a-5** | Methodology paper draft v1 | 1–2 sessions | `phase-3-methodology-paper.md` draft |
| **3a-6** | Phase 3 Console build (only if iteration friction warrants) | 1 session | `phase3-console.html` |
| **3b** | Frances Hubbell + secondary | TBD after 3a | — |

"Session" = one focused working interval. These are estimates, not commitments.

---

## 13. Open Questions / Decisions Pending

These need your input before they block work. None of them block starting 3a-2.

1. **Pension file retrieval (Henry's `Mo C 58119`).** Order from NARA via NATF Form 86 (one-time mail-in cost, ~6–8 week turnaround), check Fold3 via library card, or defer? Recommendation: start the NARA order now in parallel — it has the longest lead time of anything in this plan.
2. **Visualization timing for discrepancies.** You said visualization should aim for "most compelling, surprising, high-confidence discrepancies." When in Phase 3 do we start designing it — after 3a-3 (full corpus available) or after 3a-2 (Henry pilot, smaller dataset, faster iteration)?
3. **Cross-reference back into existing visualizations.** When external findings disagree with letter-derived data, do the existing vizzes (e.g., Map That Moves) show the disagreement, or stay as the "what the family experienced" view with discrepancies surfaced only in the new discrepancy registry? Recommendation: existing vizzes stay primary-source-pure; discrepancies are their own surface.
4. **Methodology paper venue.** Personal blog / Medium first, then submit to a digital humanities journal (e.g., *Digital Humanities Quarterly*, *Journal of Open Humanities Data*)? Or aim straight at a journal? This affects voice and structure.

---

## 14. Definition of Done (Phase 3a)

Phase 3a is complete when:

- [ ] All four brothers have populated per-person external-source folders with at least one row per source (including null results explicitly recorded).
- [ ] Each brother's `PER-*.md` external-source table has every box checked with linked evidence.
- [ ] At least 5 discrepancies (any severity) have been documented in `04-analysis/phase-3-discrepancies/`.
- [ ] `disambiguation-rubric.md` has been refined at least once based on real overrides.
- [ ] `verification-log.jsonl` contains ≥50 logged verdicts.
- [ ] Methodology paper draft exists at v1 status.

---

## Appendix A: Connection to Existing Principles

This plan inherits and respects the foundational discipline established in `DATA-ARCHITECTURE.md` and `CLAUDE.md`:

- **Provenance preservation** — external findings live in their own files, never modify source letters or person profiles' factual layer. Person profiles' `External Source Records` table *references* the artifacts but doesn't replace them.
- **No fuzzy name matching** — `PERSON_ALIASES` remains the curated truth for identity. External hits that mention a new name variant get evaluated for inclusion in the alias table, but only after researcher review.
- **Confidence is three-dimensional** — the existing `basis · legibility · source-certainty` notation absorbs external data cleanly (`external · n/a · definite` for a CMSR; `external · partial · rumor` for an OCR'd newspaper rumor).
- **Negative results are first-class** — checklist tables already accommodate "checked, not found." This plan formalizes that convention.
- **Display-layer enrichments don't modify source data** — the existing rule from `CLAUDE.md`. External findings are display-layer relative to letters; they sit alongside.
