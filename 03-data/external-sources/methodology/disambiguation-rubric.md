# Disambiguation Rubric

> The criteria Claude applies to decide whether a candidate record from an external source refers to the right person. This rubric is the heart of the methodology — every verdict in `verification-log.jsonl` traces back to one or more criteria below. **It is a living document**: when researcher review overrides a Claude verdict, the rubric is updated to capture the learning.

**Last updated:** 2026-06-06 (v0.5 — James TODO-1 validated on Sweep 4.0: verifying a NON-military claim [West Point] by cross-binding named cadre; all four brothers now validated. Added principles: "verify the claim where the claim lives" and the Playwright bypass for NYS Historic Newspapers.)

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

### C9. Independent vs. derivative corroboration — `calibration` (added v0.2)

Applies to: all sources.

Before counting a second source as corroboration, ask whether it is **independent** of the first or merely **transcribes** it. Example from the Henry pilot: Antietam on the Web's soldier record is transcribed from the NY Adjutant-General report — so AOTW corroborates the *transcription* but adds no independent weight. Chapin's 1903 regimental history, by contrast, is a genuinely independent published witness. **Two derivative copies of one source = one source.** Only independent corroboration should lift a verdict from `likely` to `confirmed`.

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

### TODO-1: Person-specific distinguishing signals — FILLED v0.2 (validated on Henry)

Per-brother high-weight signals used to lift a candidate toward `confirmed`. Henry's set is now **battle-tested** (every signal below was confirmed or corrected against the record in Sweep 1.0). The other three are drafted from the curated profiles + letter corpus and await first-pass validation — researcher may still refine.

- **Henry (VALIDATED 2026-06-05):**
  - 34th NY Volunteer Infantry, **Company D** — dispositive (only Hubbell in the regiment). ✅ confirmed
  - Enlisted **May 22, 1861, at Champlain**, age **23**; mustered in **June 15, 1861**. ✅ confirmed (NEW from roster)
  - Killed **Sept 17, 1862, Antietam**; **body never recovered** (absent from named cemetery roll). ✅ confirmed
  - Co. D commander **Capt. Davis J. Rich** (Henry's letters phonetically: "Capt. Reich"). ✅ corrected
  - Pension claim **`Mo C 58119`** (mother as claimant) — not yet pulled (NARA handoff).
  - *Namesake caution:* a **Julius O. Hubbell** (surveyor) also lived in Champlain in 1862 — rule out on Clinton-Co. newspaper hits.

- **Alexander (VALIDATED 2026-06-06):**
  - 60th NY Volunteer Infantry, **Company H** — dispositive (only Hubbell in the regiment). ✅ confirmed
  - Enlisted **Sept 21, 1861, at Champlain**, age 18; corporal → **sergeant Oct 1, 1862** → **re-enlisted veteran Dec 14, 1863** → mustered out **July 17, 1865**, Alexandria. ✅ confirmed (NY AG roster)
  - **Wounded at Lookout Mountain** (Nov 24, 1863). ✅ confirmed (Eddy 1864 casualty list, "Sergeant A. F. Hubbell, Co. H") — independent published witness.
  - **Color bearer** + later **ambulance corps**: letters/genealogy only — NOT in roster/Eddy/Phisterer (rosters omit duty assignments). ⚠️ unverified, not contradicted → newspaper/pension handoff.
  - Post-war Iowa (Fonda, Pocahontas Co.); **d. Dec 7, 1894** per IAGenWeb + GAR star (resolves family 1894-vs-1899 conflict; DSC-2026-06-06-002).
  - *Namesake caution:* **Frederick M. Hubbell**, Des Moines financier, dominates 1890s Iowa print — rule out on any Iowa newspaper/vital-date hit (likely origin of the spurious "1899" date).

- **Charles (VALIDATED 2026-06-06):**
  - **Company I**, 153rd NY Volunteer Infantry — DISAMBIGUATION REQUIRED (4 Hubbells in the regiment, 2 named Charles). Identity = C1 (Co. I) + C4 (Champlain) jointly; NOT roster uniqueness. ✅ confirmed
  - Enlisted **Aug 30, 1862, at Champlain**, age 25 (→ b. c. 1837, vs genealogy "Apr 1840" — DSC-2026-06-06-003); corporal Oct 18 1862; **mustered out Oct 2, 1865, Savannah** (survived). ✅ confirmed
  - Co. I captain = **Davis J. Rich** (also Henry's 34th NY captain — cross-brother link).
  - **Died March 1875** of service-contracted disease, in Dover Twp / Pocahontas Co., Iowa — death/burial record NOT in free sources (records begin 1880); pension file would name the disease → handoff.
  - *Namesake caution:* TWO other Hubbells in the 153rd are a separate Minden (Co. E) family — **Charles B.** (age 44) and **J. Elbert/John E.**; do not conflate. Plus brother James (Co. I).

- **James (VALIDATED 2026-06-06):**
  - **Company I**, 153rd NY (his brother Charles's company) — confirmed; one James in the regiment. ✅
  - **West Point cadet, 1862 — APPOINTED AND PRESENT, but NOT a graduate** (cross-bound via named cadre Cadet Lt. Peter S. Michie [USMA 1863] + Chaplain/Prof. John W. French; absent from Cullum/class lists; formal admission terms = NARA RG 404/94 handoff). A non-military claim verified by matching source to assertion.
  - Enlisted/mustered Mar 9 1864 (7th Cong. Dist.); corporal May 1864; **wounded Cedar Creek Oct 19 1864** (flesh wound thigh/hip; family 'night blindness' detail NOT in roster — handoff).
  - **Died Albany NY Oct 12, 1865** (gravestone) "in the service... returning home" — family intro's "Oct 19" is a Cedar-Creek-anniversary conflation (DSC-004). Buried Glenwood Cemetery, Champlain (four-brothers memorial).
  - *Namesake caution:* James R. Hubbell (Ohio congressman) dominates a national 'James Hubbell' search; plus the dense Clinton-Co. Hubbells (Julius C. of Chazy, Silas P. of Champlain).

→ Researcher may still refine the three draft sets. Henry's set is locked as validated.

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

For each source listed in `docs/PHASE-3-PLAN.md` §3, your initial `source-certainty` grade (`definite` / `secondhand` / `rumor`) — your prior assumption, before we see real data. We'll revise as we hit each source's failure modes.

---

## Override Log

When the researcher overrides a Claude verdict, append a one-line entry here describing what was missed and how the rubric should change. Patterns across these entries drive rubric revisions.

| Date | Verdict overridden | New verdict | Why the rubric missed it | Rubric change |
|------|--------------------|-------------|--------------------------|---------------|
| 2026-06-05 | (self-review, not a researcher override) | — | The rubric had no rule for distinguishing an independent corroborating source from one that merely transcribes another (AOTW transcribes the NY AG roster). Risk: double-counting one source as two confirmations. | Added **C9 (independent vs. derivative corroboration)**. |
|------|--------------------|-------------|--------------------------|---------------|
| _(none yet)_ | | | | |
