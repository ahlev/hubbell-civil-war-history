# Data Architecture & Design Philosophy

**Hubbell Civil War Letter Collection — 273 Letters, 1861–1870**

*A living document describing how unstructured 19th-century handwriting becomes structured, queryable, visualizable data — and the design decisions that make it work.*

---

## What Makes This Schema Different

> This schema has a genuinely unusual architecture for a humanities data project: it layers **three distinct epistemological tiers** (factual, editorial, computed) with a **three-axis confidence system** that tracks not just "how sure are we" but *why* we're sure and *whose certainty we're measuring*. Most digital humanities projects conflate these. This one doesn't, and that's what makes the visualizations trustworthy.

The separation is the point. A letter's date is a fact. Its significance is a judgment. Its health implications are computed. These three things have different lifespans, different error profiles, and different rules for when they can change. Collapsing them into a single flat record — as most projects do — means you can never tell whether a data point is bedrock or opinion. Here, you always can.

The confidence model reinforces this by refusing to reduce certainty to a single number. "How sure are we?" is actually three questions: *What kind of evidence do we have?* (basis), *Could we physically read it?* (legibility), and *How sure was the person who wrote it?* (source certainty). A perfectly legible letter where the writer says "I think it was Thursday" is high-legibility, low-source-certainty — and that distinction matters for every downstream visualization that plots events on a timeline.

---

## The Core Problem

A Civil War letter is a single artifact that simultaneously contains:

- **Hard facts**: a date, a location, names
- **Soft facts**: health observations that may be understated, financial figures embedded in run-on sentences, place names spelled phonetically
- **Interpretation**: what the letter *means* in the context of a war, a family, a specific week in 1863
- **Unknowns**: what the writer didn't know, couldn't say, or chose not to mention

No single data field can capture this. The schema must hold all four layers without collapsing them into each other.

---

## Design Principles

### 1. Separate What We Know From What We Think

The most important architectural decision: **never mix objective fact with editorial judgment in the same field.**

- `location: "Washington, D.C."` is what Henry wrote.
- `significance: "major"` is what the researcher decided.
- `sigSummary` explains *why* the researcher decided it.

This separation matters because the factual layer is permanent (the letter says what it says), but the editorial layer can evolve as the researcher's understanding deepens. A letter initially tagged `routine` might become `notable` once you realize it was written three days before a battle the author didn't know was coming.

### 2. Preserve the Original Voice

The `transcription` field is sacred. It preserves original spelling ("Mariland"), original line breaks (as paper-width artifacts), original punctuation, and original errors. It is never normalized, corrected, or cleaned.

This principle extends to sub-fields:
- `places[].written` keeps "Mariland" alongside `places[].modern` = "Maryland"
- `people[].name` keeps "Brink" without forcing a full name we don't have
- `health[].detail` uses language close to the original: "Knapsack very heavy but adjusting"

The reason: every normalization is an interpretation. Keeping the original makes interpretations reversible and auditable.

### 3. Confidence Is Three-Dimensional

Most data systems use a single confidence score (1–5 stars, high/medium/low). This project uses **three orthogonal axes**:

| Axis | Question | Why It Matters |
|------|----------|----------------|
| **Basis** | How do we know this? | `stated` vs `inferred` vs `external` — tells you what kind of evidence supports the claim |
| **Legibility** | Could we read it clearly? | `clear` vs `partial` vs `damaged` — tells a researcher whether to go back to the scan |
| **Source Certainty** | How sure was the *writer*? | `definite` vs `uncertain` vs `secondhand` vs `rumor` — tells an analyst how much weight to put on the data point |

Compact notation: `stated · clear · definite` (highest confidence on all three axes)

This matters because these axes are genuinely independent. A letter can be:
- **Perfectly legible but the writer was uncertain**: `stated · clear · uncertain` — "I believe it was Thursday"
- **Damaged but the writer was definite**: `stated · damaged · definite` — ink blot over a date the writer stated firmly
- **External data with no legibility dimension**: `external · n/a · n/a` — regiment location from NPS records

A single confidence score would collapse these distinctions. The three-axis system preserves them for downstream use: basis drives provenance displays, legibility drives quality control, source certainty drives analytical weight.

### 4. Flags Are Entry Points, Not Analysis

The fifteen boolean flags (`hasBattle`, `hasIllness`, `hasDeath`, `hasWound`, `hasPromotion`, `hasCapture`, `hasDesertion`, `hasDischarge`, `hasHomeNews`, `hasPolitical`, `hasMoraleCrisis`, `hasSupplyRequest`, `hasReceipt`, `hasCampMovement`, `hasEyewitness`) serve a specific architectural role: **they are fast filters, not deep analysis**.

A flag says "this letter touches this topic." It does not say how, or how severely, or who was affected. That's what the companion `flagDetails` object does — it provides a one-line human-written explanation for each true flag.

This two-tier design (boolean + detail string) lets visualizations:
- **Filter fast**: "show me all letters with illness" → check `hasIllness`
- **Display meaningfully**: once filtered, show the human-written `flagDetails.hasIllness` string

The flags are intentionally conservative. A letter that mentions someone "feeling poorly" gets `hasIllness: true` even if the person recovered by the next paragraph. The flag opens the door; the transcription and editorial provide the nuance.

### 5. Let Visualizations Compute What They Need

Several important data dimensions are **not stored in the schema** — they are computed at runtime by each visualization:

| Visualization | What It Computes | From What Fields |
|--------------|-----------------|-----------------|
| **Health Ledger** | Health status (`healthy`, `declining`, `sick`, `hospitalized`, `wounded`) | Text-mines `transcription` for first-person health statements |
| **Money Story** | Financial transactions (amounts, categories, directions) | Regex-extracts dollar amounts and keywords from `transcription` |
| **Map That Moves** | Geographic trail with movement status | Geocodes `location` strings via a 134-place lookup table |
| **People Web** | Social network graph (nodes, edges, weights) | Counts co-mentions across `people[]` arrays |
| **What They Didn't Know** | Dramatic irony moments | Cross-references letter `date` + `location` against external battle database |

This is a deliberate design choice, not a gap. These computed fields are:
- **Algorithmic** — they apply consistent rules across all 273 letters
- **Tunable** — adjusting the algorithm changes all results at once
- **Domain-specific** — each visualization needs the data in a different shape

Storing these in the JSON would create coupling: changing the health algorithm would require re-processing all 274 records and re-deploying. Computing at runtime means the algorithm and the data evolve independently.

### 6. Identity Is Curated, Not Fuzzy

People in Civil War letters are referred to inconsistently: "Alek," "Alex," "Alexander," "A. Douglas," "your brother." The project uses **curated alias tables** (`PERSON_ALIASES` in the dashboard, `MERGE_MAP` in the People Web) to resolve these to canonical names.

This is not fuzzy matching. Fuzzy matching would incorrectly merge "Mrs. Brown" and "Mr. Brown" or split "Alek" from "Alexander." The alias tables are hand-built, letter by letter, by a researcher who knows the family. They encode knowledge that no algorithm can derive: that "the Captain" in one letter and "Capt. Ransom" in another are the same person, but "Captain" in a different letter refers to someone else entirely.

The cost is manual maintenance. The benefit is zero false merges in a 274-letter collection where identity errors would corrupt the social network, the health timeline, and the narrative.

---

## The Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────┐
│  LAYER 3: COMPUTED (by each visualization at runtime)   │
│  Health status · Financial extraction · Social graph ·  │
│  Geographic trail · Irony detection                     │
├─────────────────────────────────────────────────────────┤
│  LAYER 2: EDITORIAL (researcher judgment)               │
│  significance · emotion · sigSummary · editorial ·      │
│  flagDetails · temporal context · health assessments    │
├─────────────────────────────────────────────────────────┤
│  LAYER 1: FACTUAL (from the letter itself)              │
│  id · date · author · recipient · location ·           │
│  transcription · people[] · places[] · boolean flags   │
└─────────────────────────────────────────────────────────┘
```

**Layer 1** is permanent. The letter says what it says.

**Layer 2** is durable but revisable. Editorial judgments can change as understanding deepens, but they change slowly and deliberately.

**Layer 3** is ephemeral and algorithmic. It's recomputed every time a page loads. This is where experimentation happens — you can change the health-mining algorithm, the financial regex, or the social network weighting without touching the source data.

---

## Field Inventory

### Layer 1: Factual Fields

| Field | Type | Example | Purpose |
|-------|------|---------|---------|
| `id` | string | `LTR-1861-07-21-001` | Unique identifier; encodes date for natural sort |
| `date` | ISO 8601 | `1861-07-06` | Canonical corrected date (may differ from what letter says) |
| `year`, `month`, `day` | integers | `1861`, `7`, `6` | Decomposed date for filtering |
| `author` | enum | `henry` | One of: `henry`, `alexander`, `james`, `charles`, `mother` |
| `authorName` | string | `Henry` | Display name |
| `recipient` | string | `Mrs. Hubbell (Mother)` | Full name with relationship context |
| `direction` | enum | `front-to-home` | Letter flow direction |
| `location` | string | `Washington, D.C.` | Author's location, as written |
| `recipientLocation` | string | `Champlain, New York` | Recipient's location |
| `transcription` | text | Full letter text | Verbatim; single `\n` = paper edge, `\n\n` = paragraph |
| `notes` | string | Filing/transcription notes | Corrections, source discrepancies |
| `people[]` | array | `[{name, role, confidence, firstMention}]` | Named individuals mentioned |
| `places[]` | array | `[{written, modern, lat, lon, confidence}]` | Locations mentioned |
| `militaryRefs[]` | array | `[{field, value}]` | Unit, battles, camps, officers |
| `objects[]` | array | Strings | Material culture: clothing, food, weapons, money |
| `domestic[]` | array | `[{topic, detail}]` | Home-front: farm, family, weather, economy |
| `health[]` | array | `[{who, type, detail, confidence}]` | Per-person health observations |
| `confidence` | object | `{date_written, author, author_location, direction}` | Three-axis ratings for core metadata |
| `crossRefs` | object | `{next, prev, related[]}` | Links to adjacent/related letters |

### Layer 2: Editorial Fields

| Field | Type | Values | Purpose |
|-------|------|--------|---------|
| `significance` | enum | `critical` · `major` · `notable` · `moderate` · (default `routine`) | Drives dot radius in timeline |
| `emotion` | enum | `extreme` · `high` · `moderate` · `low` | Drives dot opacity in timeline |
| `sigSummary` | string | 1–2 sentence significance statement | Tooltip and detail panel display |
| `editorial` | markdown | Multi-paragraph analysis | Date corrections, historical context, discrepancies |
| `temporal` | object | `{warYear, campaignPeriod, nearbyBattles, season, daysSinceLast, daysUntilNext}` | Places letter in war chronology |
| `flagDetails` | object | Keyed by flag name | Human explanation for each true boolean flag |

### Boolean Event Flags (Layer 1/2 boundary)

The flags straddle layers — they're derived from the letter's content (Layer 1) but require editorial judgment about what counts (Layer 2).

| Flag | Currently Used By | Notes |
|------|------------------|-------|
| `hasBattle` | Dashboard, Health Ledger, Map, Emotional Arcs, What They Didn't Know | Most broadly consumed flag |
| `hasIllness` | Dashboard, Health Ledger, Map | Health Ledger also text-mines independently |
| `hasDeath` | Dashboard, Health Ledger, Map | |
| `hasWound` | Dashboard, Health Ledger, Map | |
| `hasPromotion` | *None* | Available but no visualization reads it yet |
| `hasCapture` | *None* | |
| `hasDesertion` | *None* | |
| `hasDischarge` | *None* | |
| `hasHomeNews` | *None* | |
| `hasPolitical` | *None* | |
| `hasMoraleCrisis` | *None* | |
| `hasSupplyRequest` | *None* | |
| `hasReceipt` | *None* | |
| `hasCampMovement` | *None* | |
| `hasEyewitness` | *None* | |

**11 of 15 flags are currently untapped by any visualization.** These represent immediate opportunities for new views or filters.

---

## What Each Visualization Draws From

| Visualization | Primary Fields | Computed At Runtime |
|--------------|---------------|-------------------|
| **Parallel Lives** (timeline) | date, author, significance, emotion, recipient, location, sigSummary, editorial, transcription, people[], places[], all flags | Dot radius from significance, opacity from emotion |
| **Map That Moves** | location (geocoded), date, author, flags, sigSummary, transcription | Movement trail, status classification, interpolated positions |
| **Health Ledger** | date, author, transcription, hasIllness (fallback) | Health status via NLP text mining of transcription |
| **Money Story** | date, author, transcription | Dollar amounts and categories via regex extraction |
| **People Web** | people[], author, date, id, all detail fields for overlay | Social graph: nodes, edges, weights, categories |
| **What They Didn't Know** | date, location, author, transcription, flags | Irony detection via date proximity to external battle database |
| **Emotional Arcs** | date, author, emotion, flags, sigSummary, editorial | Arc shape from emotion enum sequence |

---

## The Processing Pipeline

```
 PDF Scans (source)
      │
      ▼
 Claude AI Transcription (human-guided)
      │
      ▼
 all-letters.json (canonical, hand-curated)
      │
      ├──► build-people-web-data.py  ──► viz-people-web.html (embedded RAW_LETTERS)
      ├──► generate-map-movements.py ──► map-movements.json ──► viz-map-fullwar.html
      ├──► build-emotional-arcs.py   ──► viz-emotional-arcs.html (embedded data)
      └──► (manual embed / compact)  ──► hubbell-dashboard.html, health-ledger, money-story
```

There is no automated markdown-to-JSON pipeline. Each letter is transcribed directly into the JSON schema by Claude AI under researcher supervision. The TEMPLATE-letter.md defines the *conceptual* schema; all-letters.json is the canonical implementation.

Build scripts read `all-letters.json` and produce compact subsets for each visualization — either embedded inline (for file:// protocol compatibility) or as separate JSON files fetched at runtime.

---

## Untapped Opportunities

### Fields That Exist But No Visualization Uses

These eleven boolean flags and their `flagDetails` companions are fully populated across all 273 letters but currently invisible to users:

1. **`hasPromotion`** — Track career trajectories; overlay rank changes on timeline
2. **`hasCapture`** — Alexander was captured by guerrillas; could drive a POW narrative thread
3. **`hasDesertion`** — Social commentary on unit cohesion and morale
4. **`hasDischarge`** — End-of-service markers; furlough and discharge patterns
5. **`hasHomeNews`** — Home-front events that shaped the soldiers' emotional state
6. **`hasPolitical`** — Political opinions evolving over four years of war
7. **`hasMoraleCrisis`** — Individual vs. unit-wide morale; could correlate with campaign periods
8. **`hasSupplyRequest`** — Material needs over time; logistics of family support
9. **`hasReceipt`** — Package/letter receipt confirmations; map the mail network
10. **`hasCampMovement`** — Marches and relocations; enriches the Map That Moves
11. **`hasEyewitness`** — First-person accounts of named historical events

### Sub-Arrays With Visualization Potential

- **`domestic[]`** — Home-front topics (farm, family, weather, economy) could power a "Life at Home" view
- **`militaryRefs[]`** — Unit references, officer names, battle mentions could enrich the map or timeline
- **`objects[]`** — Material culture inventory across the war years
- **`temporal.nearbyBattles`** — Already populated; could enhance "What They Didn't Know" with near-miss data
- **`temporal.daysSinceLast` / `daysUntilNext`** — Communication gaps as a visualization dimension (silence as signal)

### Computed Dimensions Not Yet Explored

- **Vocabulary complexity over time** — Does writing change as war wears on?
- **Sentiment trajectory** — Beyond the `emotion` enum, full-text sentiment analysis on transcriptions
- **Name frequency networks** — Who stops being mentioned? When do new names appear?
- **Response latency** — Using `crossRefs` + dates to map mail delay
- **Geographic distance from home** — Using `places[].lat/lon` + Champlain coordinates
- **Letter length as signal** — Short letters during battle; long letters during camp boredom

---

## Design Decisions Worth Revisiting

### Things That Work Well

- **Three-axis confidence**: Unusual and worth keeping. No other system in the project provides this level of epistemological honesty.
- **Editorial separation**: `sigSummary` + `editorial` as distinct fields prevents the summary from becoming a paragraph and the analysis from becoming a tagline.
- **Curated identity**: Manual alias tables are labor-intensive but produce zero false merges.
- **Runtime computation**: Health mining and financial extraction improve independently of the data.

### Things That Could Evolve

- **`significance` and `emotion` are enums without numeric equivalents.** Some visualizations (dot radius, opacity) need to convert them to numbers internally. Adding a numeric field (1–5) alongside the enum would simplify and enable continuous-scale visualizations.
- **`health[]` captures observations but not trajectories.** A `healthStatus` enum per-letter (like what the Health Ledger computes at runtime) stored in the JSON would let other visualizations access health trends without reimplementing the text mining.
- **`places[]` has coordinates but `location` doesn't.** The map script geocodes `location` at build time via a 134-entry lookup. Moving coordinates into the main JSON would let any visualization do geographic work without the lookup table.
- **`crossRefs` is sparse.** Many letters lack `prev`/`next` links. Fully populating this would enable richer navigation and conversation threading.
- **No `letterLength` or `wordCount` field.** Trivial to compute but useful for visualization (letter length as a signal of circumstance).

---

## Guiding Questions for Schema Evolution

When considering a new field or modification, ask:

1. **Which layer does it belong to?** Factual (from the letter), editorial (researcher judgment), or computed (algorithmic)?
2. **Is it permanent or will it change?** Factual fields are permanent. Editorial fields should change rarely. Computed fields can change with every algorithm update.
3. **Does it duplicate a computation?** If a visualization already computes this at runtime, storing it creates a coupling. Only store it if multiple visualizations need the same result.
4. **Does it have a confidence dimension?** If it could be wrong, it needs a confidence notation.
5. **Does it preserve the original voice?** Any normalization should have a companion field that keeps the original.
6. **Will a visualization use it?** Fields without consumers are dead weight. Every field should either serve a current visualization or be a named candidate for a future one.

---

*Last updated: April 2026. This document should be revised when new fields are added, new visualizations are built, or the processing pipeline changes.*
