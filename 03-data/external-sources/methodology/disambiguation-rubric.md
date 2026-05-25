# Disambiguation Rubric

> The criteria Claude applies to decide whether a candidate record from an external source refers to the right person. This rubric is the heart of the methodology — every verdict in `verification-log.jsonl` traces back to one or more criteria below. **It is a living document**: when researcher review overrides a Claude verdict, the rubric is updated to capture the learning.

**Last updated:** 2026-05-19 (seed draft)

---

## Verdict Vocabulary

| Verdict | Meaning |
|---------|---------|
| `confirmed` | Dispositive evidence (multiple independent corroborating signals; no contradictions). |
| `likely` | Strong corroborating signals; no contradictions; missing one or two ideal data points. |
| `possible` | Partial match; signals are consistent but insufficient; needs researcher review. |
| `unlikely` | Weak signals; one or more soft contradictions. |
| `rejected` | Confirmed not this person (a hard contradiction — wrong regiment, wrong dates, wrong death record). |

---

## Criteria

Each criterion has a weight class (`dispositive`, `strong`, `supporting`, `weak`) and applies to specific source types. Claude is instructed to cite which criteria it applied for every verdict.

### C1. Regiment & company match — `dispositive`

Applies to: CWSS, NPS Battle Units, Muster Rolls, regimental histories.

If the candidate's regiment and company match the known assignment (e.g., **Henry: 34th NY, Co. D**) and no other Hubbell appears in that unit, this is a near-dispositive signal. Cross-check against published muster rolls for that unit before declaring `confirmed`.

### C2. Date envelope — `strong`

Applies to: all sources with dates.

Candidate's enlistment / event / death date falls within the known window for the person. Outside the window by more than ~3 days is a soft contradiction; outside by months is dispositive against.

### C3. Geographic plausibility — `strong`

Applies to: newspapers, regimental histories, comparative letters.

Candidate appears in a location where the person could plausibly be on that date (regiment was within ~50 miles per battle data / muster movement records). Significantly outside is a soft contradiction.

### C4. Hometown / family signal — `strong`

Applies to: newspapers, FindAGrave, SUVCW, pension records.

Reference to **Champlain, NY** or **Clinton County, NY**, or to a known family member by name (Frederick Augustus Hubbell, Frances Hubbell, etc.). This is highly distinctive given the family's small hometown.

### C5. Name variant against curated alias table — `supporting`

Applies to: all sources.

Candidate's spelling appears in or is consistent with `PERSON_ALIASES` for this person. OCR-induced variants (split tokens, character substitution) accepted only if other criteria corroborate. **Never** create a new alias entry directly from external data — flag for researcher review.

### C6. Rank trajectory — `supporting`

Applies to: muster rolls, service records.

Candidate's rank progression matches what letters and known facts establish (Henry presumed private; Alexander rose to color bearer; etc.).

### C7. Co-mention with known associates — `supporting`

Applies to: newspapers, comparative letters, pension depositions.

Candidate appears alongside other people we can independently verify (e.g., "Capt. Reich of Co. D" lends weight to a Henry Hubbell mention in the same article).

### C8. OCR / transcription quality — `weak` (calibration)

Applies to: Chronicling America, scanned regimental histories.

If the candidate text is heavily OCR-corrupted, **reduce confidence one level** even when other criteria are met. Note in the verdict reasoning.

---

## Hard Contradictions (auto-`rejected`)

A candidate with any of the following is `rejected`, regardless of other signals:

- **R1.** Different death date that the record source treats as authoritative (e.g., FindAGrave entry with a death date that doesn't match the known KIA at Antietam for Henry).
- **R2.** Different regiment with no plausible transfer path (e.g., a "Henry Hubbell" in a 12th NY unit who was clearly the same person across multiple records).
- **R3.** Service in the Confederate Army (the family is Union-only).
- **R4.** Age irreconcilable with known birth window (e.g., a candidate listed as 45 at enlistment when the person was 19).

---

## Verdict Output Format (for `verification-log.jsonl`)

```json
{
  "timestamp": "2026-05-19T14:32:00Z",
  "person_id": "PER-hubbell-henry",
  "source": "chronicling-america",
  "candidate_id": "lccn-sn83030214-1862-09-25",
  "verdict": "likely",
  "criteria_cited": ["C1", "C2", "C4", "C7"],
  "criteria_against": [],
  "reasoning": "Article in Plattsburgh Republican dated 1862-09-25 lists 'H. Hubbell, Co. D, 34th NY' among Antietam casualties. Regiment and company match (C1), date envelope consistent with known KIA on 1862-09-17 (C2), hometown paper for Champlain area (C4), Capt. Reich named in same paragraph (C7). OCR clean. Confidence reduced from 'confirmed' to 'likely' only because the article gives initial 'H.' not full first name.",
  "researcher_reviewed": false,
  "researcher_override": null
}
```

---

## TODO — Your Input Needed

The following are calls only you can make as the researcher with domain knowledge. Each is a small contribution that materially improves the rubric.

### TODO-1: Person-specific distinguishing signals

For each brother, list 3–5 signals that would make a candidate near-certainly *this* person. Examples to react to:

- **Henry:** 34th NY, Co. D; Capt. Reich named; killed at Antietam; body never recovered; pension claim `Mo C 58119` (Mother as claimant); first letter from Washington June 6 1861.
- **Alexander:** 60th NY; color bearer (distinctive — relatively rare role); Shenandoah Valley campaigns; mustered out Jun 27 1865.
- **Charles:** 153rd NY; Red River Campaign; Shenandoah Valley; died 1875 of service-related disease.
- **James:** youngest brother; wounded at Cedar Creek (night blindness — distinctive); died 1865.

→ **Please edit this list with anything I have wrong, missing, or imprecise.** These become the high-weight criteria when Claude evaluates candidates for each specific brother.

### TODO-2: Newspaper match threshold

For Chronicling America hits, what's your tolerance? Two options to react to:

- **Strict:** require `confirmed` (multiple criteria) before a hit enters the verified set. High precision, lower recall — we'll miss some real mentions.
- **Permissive with review:** accept `likely` after researcher review. Higher recall, requires more of your time.

Suggested default: **permissive with review** for newspapers; strict for service records.

### TODO-3: Alias table policy

When an external source uses a name variant we don't have in `PERSON_ALIASES` (e.g., a newspaper writes "Henry F. Hubbell" but we have only "Henry Hubbell"), what's the right move?

- (a) Add to alias table only after researcher confirms it's the same person.
- (b) Add a "candidate alias" namespace and promote to canonical only after multiple corroborating sources.
- (c) Never add — alias table stays curated from letters only.

Suggested default: **(a)**.

### TODO-4: Source-quality grading

For each source listed in `PHASE-3-PLAN.md` §3, your initial `source-certainty` grade (`definite` / `secondhand` / `rumor`) — your prior assumption, before we see real data. We'll revise as we hit each source's failure modes.

---

## Override Log

When the researcher overrides a Claude verdict, append a one-line entry here describing what was missed and how the rubric should change. Patterns across these entries drive rubric revisions.

| Date | Verdict overridden | New verdict | Why the rubric missed it | Rubric change |
|------|--------------------|-------------|--------------------------|---------------|
| _(none yet)_ | | | | |
