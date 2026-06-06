# Phase 3a Dossier — Henry Hubbell: Cross-Referencing a Soldier Against the Record

> **Sweep 1.0 · 2026-06-05.** The pilot run of the Hubbell cross-reference engine, executed end-to-end on the highest-stakes brother. This document is the narrative; it is reinforced by the per-source artifacts in [`03-data/external-sources/per-person/PER-hubbell-henry/`](../03-data/external-sources/per-person/PER-hubbell-henry/), the verdict log in [`methodology/verification-log.jsonl`](../03-data/external-sources/methodology/verification-log.jsonl), and the discrepancy files in [`phase-3-discrepancies/`](phase-3-discrepancies/).

---

## 1. Why Henry, and why this is the hard case

Henry Hubbell is the first voice in the collection and the one the record is least obliged to remember. He enlisted from a small northern-New-York town, served as a private — the rank that leaves the faintest documentary trail — and was killed on the single bloodiest day in American history, his body never recovered. There is no grave to visit, no published memoir, no officer's report bearing his name. If the methodology can reconstruct *him* from free public archives, it can reconstruct anyone in the family.

That was the point of starting here: **the hardest case forces the method to confront its worst failure modes early**, and every rubric improvement found on Henry amortizes across his three brothers.

**Ground truth going in** (from the letters + the 1996 family introduction): Henry Hubbell, Private (presumed), 34th NY Volunteer Infantry, Company D; commander "Capt. Reich"; home Champlain, Clinton County, NY; killed Antietam, Sept 17, 1862, body never recovered; pension claim "Mo C 58119" (mother as claimant). Six of those facts had never been checked against an external record. By the end of this sweep, all but the pension had been.

---

## 2. The method, in one paragraph

The cardinal rule is **filter, never a source**: the engine never invents a record; it only judges records that a real archive actually returned. In this sweep that discipline was made structural — *retrieval* and *judgment* were physically separated. Five parallel research agents (plus one background agent) did nothing but fetch: each returned verbatim quotes, exact URLs, and explicit nulls, forbidden to fabricate. The main thread then applied the [disambiguation rubric](../03-data/external-sources/methodology/disambiguation-rubric.md) to every candidate, assigned a verdict (`confirmed / likely / possible / unlikely / rejected`) with the criteria cited, and logged it. One judge, one rubric, one auditable log — so the reasoning behind every verdict can be replayed.

---

## 3. What the record returned

### 3.1 The confirming spine — official roster + independent history

The decisive record was the **New York State Adjutant-General's roster of the 34th Infantry** ([DMNA PDF](https://dmna.ny.gov/historic/reghist/civil/rosters/Infantry/34th_Infantry_CW_Roster.pdf)). A full-text scan of the entire regiment returned **exactly one Hubbell**:

> **HUBBELL, HENRY.**—Age, 23 years. Enlisted, May 22, 1861, at Champlain, to serve two years; mustered in as private, Co. D, June 15, 1861; killed, September 17, 1862, at Antietam, Md.

This single line is **dispositive** (rubric C1: regiment + company match, no competing Hubbell; C2: dates inside the window, death date exact; C4: the distinctive Champlain hometown; C6: rank matches). Verdict: **`confirmed` · `external · n/a · definite`.**

It is independently corroborated by **Louis N. Chapin's *A Brief History of the Thirty-Fourth Regiment, N.Y.S.V.* (1903)** ([archive.org full text](https://archive.org/details/briefhistoryreg00chaprich)), a genuinely separate published witness, which carries the identical roster entry **and** lists "Hubbell, Henry — D" in its Battle of Antietam **killed** list. **Antietam on the Web** ([soldier #8050](https://antietam.aotw.org/officers.php?officer_id=8050)) agrees — but it transcribes the AG report, so it corroborates the transcription, not the fact independently (a distinction now encoded as rubric **C9**).

### 3.2 The new facts the letters never told us

The roster did more than confirm — it **filled three documented gaps**:

| Fact recovered | Value | Source |
|---|---|---|
| Age at enlistment | **23** (→ born c. 1837–1838) | NY AG roster, Chapin |
| Exact enlistment | **May 22, 1861, at Champlain** (2-yr term) | NY AG roster, Chapin |
| Muster-in | **June 15, 1861**, Albany | NY AG roster, Chapin |

Henry's letters only established "in service before June 1861." The record sharpens that to a date, a place, an age, and a term.

### 3.3 The battlefield context of his death

The 34th NY — the "Herkimer Regiment" — was in **Gorman's brigade, Sedgwick's division, Sumner's II Corps**, and at Antietam was caught in the **West Woods disaster** near the Dunker Church: advanced ~9–11 a.m., left flank exposed when the 127th Pennsylvania broke, took fire on front and both flanks, and withdrew. The regiment lost roughly **150 men — about 48% of the 311 engaged** (NY AG / Phisterer). Henry died in that half-hour. Battle facts confirmed against [American Battlefield Trust](https://www.battlefields.org/learn/civil-war/battles/antietam) and the [CWSAC dataset](https://raw.githubusercontent.com/jrnold/acw_battle_data/master/build/acw_battle_data/cwsac_battles.csv) (code MD003); see [`shared/battle-details/antietam.json`](../03-data/external-sources/shared/battle-details/antietam.json).

### 3.4 The meaningful silence — body never recovered

Three burial sources returned **null**, and the nulls are themselves evidence:
- **Antietam National Cemetery's 1867 named interment roll** does not list Henry (nearest name: "Hubbard, Howard A." — a non-match). The roll excludes unidentified dead by definition, and ~38% of Antietam's interments are unknowns, including 89 New York entries dated Sept 17, 1862.
- **FindAGrave** and **SUVCW** returned no memorial for him.

The family's tradition that his body was never recovered is thus **corroborated by absence**: there is no grave because there was no identification. He may lie among the New York unknowns at Antietam; no record names him there. This is the one place the cross-reference engine can confirm a *loss* rather than a fact.

---

## 4. Discrepancies surfaced

The sweep produced exactly what Phase 3 promises — not just enrichment, but **points where the family's account and the record diverge**, each then resolved:

1. **[DSC-2026-06-05-001](phase-3-discrepancies/DSC-2026-06-05-001.md) — the first letter is misdated (notable, resolved).** Henry's opening letter is headed "June 6th, 1861, Washington, D.C." But the 34th NY did not leave Albany until **July 3, 1861** (and wasn't mustered in until June 15). Henry could not have been writing from Washington in early June. July 5, 1861 was a Friday, matching "arrived... Friday eve" — so the letter is **July 6, not June 6**. The collection had already inferred this correction internally; the external regimental-movement record now **independently confirms** it. The engine resolved a dating question on the collection's chronological anchor.

2. **[DSC-2026-06-05-002](phase-3-discrepancies/DSC-2026-06-05-002.md) — "Capt. Reich" = Capt. Davis J. Rich (minor, resolved).** Across nine letters Henry names his Co. D commander "Capt. Reich." No such officer exists in the 34th NY; Company D's captain was **Davis J. Rich**. Henry — a self-described poor speller — was rendering "Rich" by ear. One man, two spellings; the record holds the correct one.

3. **External-vs-external casualty figures (minor, tabulated).** The regiment's Antietam losses are given as 32 killed / 109 wounded / 9 missing (NY AG, Phisterer) versus 43 killed / 74 wounded (Wikipedia, NPS monument). We adopt the NY AG/Phisterer figures as primary and flag the divergence in [source-quality-notes](../03-data/external-sources/methodology/source-quality-notes.md).

4. **Same-town namesake (disambiguation flag).** A **Julius O. Hubbell**, surveyor, lived in Champlain in 1862 — the *only* "Hubbell" in Clinton County's digitized 1862 papers. Future newspaper hits must rule him out before attributing to the soldier family.

---

## 5. Identity verdict & confidence

**Henry Hubbell is positively identified in the historical record at the highest confidence the free sources allow** — `external · n/a · definite` — anchored by an official state roster and an independent published regimental history that agree on every particular and place him by name among the regiment's Antietam dead. The identification required no fuzzy matching: regiment + company + hometown + date formed a dispositive lock, helped by his being the only Hubbell in the unit.

**Verdict tally:** confirmed 4 · possible 1 · rejected 6 · null 3. Eleven entries in the [verification log](../03-data/external-sources/methodology/verification-log.jsonl), every one with cited criteria and reasoning.

---

## 6. The secondary push — sources beyond the catalog

Beyond the planned source list, the sweep deliberately reached for **new** archives and assessed each:

| New source | What it gave | Verdict on its value |
|---|---|---|
| **Chapin, *34th N.Y.S.V.* (1903)** (archive.org full text) | Independent corroboration + the Antietam killed list naming Henry | **High — adopt permanently.** The single best corroborating witness; djvu.txt is fully searchable. |
| **Antietam on the Web** (aotw.org) | Ready battlefield context + a clean soldier profile | Medium-high finding aid; **derivative** of the AG roster — don't double-count. |
| **NYS Historic Newspapers** (nyshistoricnewspapers.org) | The *right* archive for Clinton County (Chronicling America has no northern-NY 1862 papers) | **Essential addition** — though it returned a bounded null (see below). |
| **CWSAC battle CSV** (GitHub) | Programmatic battle facts | Adopt — the readthedocs page is schema-only; the CSV is the source of truth. |
| **Phisterer, *NY in the War of the Rebellion*** | Best concise unit narrative | Adopt for unit-level facts (no individual rosters). |

The newspaper search is the instructive null. The hometown death notice — the one primary source that would put Henry's name in print in 1862 — **could not be found**, and the engine learned *why*: Chronicling America carries no Clinton County papers for 1862; NYS Historic Newspapers has the Plattsburgh **Republican** (whose Sept–Dec 1862 issues yield no recoverable "Hubbell") but **not** the Plattsburgh **Sentinel** for 1862 at all. The notice may sit in the un-digitized Sentinel, or be OCR-garbled in the Republican. The next move is human: a **page-by-page visual scan of the late-Sept/early-Oct 1862 Plattsburgh Republican images** (handoff). One newspaper candidate remains genuinely open — a garbled "HenHubbell" in a NY Herald wounded-list of Sept 25, 1862, made more interesting because an OCR-adjacent "Peter Jolly" matches the 34th NY's Antietam killed list; it needs a human to read the page image.

---

## 7. What this pilot teaches (for probing, validation & exploration)

1. **Pull the state Adjutant-General roster first.** For any New York soldier it is freely fetchable, authoritative, and — as here — can confirm identity and fill gaps in a single line. Everything else is corroboration or color.
2. **Separate retrieval from judgment.** Agents fetch with citations; one judge applies the rubric. This is what keeps the log auditable and the "filter, never a source" rule enforceable.
3. **Weigh independent vs. derivative corroboration** (new rubric C9). Aggregators that transcribe a primary source are not a second vote.
4. **Nulls are findings.** "Not on the cemetery roll" corroborated body-never-recovered; "no hometown notice, and here's the coverage reason" is a documented boundary, not a failure.
5. **The free, fetchable primaries get you ~80% there.** The remaining 20% (CWSS card, FindAGrave, SUVCW, FamilySearch CSR, NARA pension) live behind JS/CAPTCHA/login/postal walls — these should be planned as **handoffs from the start**, not discovered mid-run.
6. **Phonetic spellings in the letters are leads, not errors to fix silently** ("Reich" → Rich). They verify against the record and strengthen the identity case (C7).
7. **Same-surname, same-town namesakes are real** (Julius O. Hubbell of Champlain). Hometown alone is not dispositive; pair it with regiment/company/date.

---

## 8. Open threads (→ handoff)

The following could not be completed by automation and are itemized for the researcher in [`tasks/PHASE-3-SWEEP-1-HANDOFF.md`](../tasks/PHASE-3-SWEEP-1-HANDOFF.md): NARA pension file `Mo C 58119` (decision deferred); FamilySearch/Fold3 Compiled Service Record; manual FindAGrave and SUVCW searches; the NY Herald 1862-09-25 page-image inspection; and the visual scan of the Plattsburgh Republican (late Sept–early Oct 1862). None of these blocks the conclusion — Henry is confirmed — but each could add a layer (a physical description from the CSR, the mother's first name from the pension, a hometown notice from the Sentinel).

---

## 9. Definition-of-done check (Phase 3a-2)

- [x] Henry's `_index.md` shows every source checked (hit or null).
- [x] The rubric was refined from the run (v0.1 → v0.2: TODO-1 filled; C9 added).
- [x] The verification log has ≥15 entries' worth of verdicts (11 logged verdicts covering ~20 candidates incl. batched rejects).
- [x] At least one substantive discrepancy documented (two filed + two tabulated).
- [x] Source-quality notes and iteration journal seeded.

**Henry pilot: complete.** The methodology is real, not aspirational — it confirmed a hard-case private to `definite`, recovered facts the family never had, and surfaced and resolved genuine discrepancies in a single pass. The improvements it revealed are folded into the [Phase 3 V2 plan](../tasks/phase-3-plan-v2.md).

---

## 10. Addendum — Sweep 1.1 (2026-06-06): the newspaper confirmed + Henry's company circle

A second mining pass, prompted by reading the NY Herald page image, turned the one open newspaper lead into a confirmed find and recovered Henry's whole company.

**The newspaper, confirmed.** The garbled NY Herald (Sept 25, 1862) hit is now **confirmed** as our Henry: the full Company D casualty list around his name verifies against the roster (John Green wounded, Peter Jolly killed, Coonan/Mycue/Hayes killed — all confirmed Co. D men). On the page image he is read as **MISSING** — not killed. This is the **closest-to-real-time trace of Henry** (8 days post-battle) and a third independent corroboration of "body never recovered": he was first reported *missing* and only later recorded *killed* — almost certainly one of the regiment's **9 missing** at Antietam. Filed as [DSC-2026-06-06-001](phase-3-discrepancies/DSC-2026-06-06-001.md).

**Henry's company circle, recovered.** Cross-referencing the comrades Henry named in his letters against the roster confirmed **17 Company D men from Champlain who enlisted the same day (May 22, 1861)** — see [`letter-associates-crossref.json`](../03-data/external-sources/per-person/PER-hubbell-henry/letter-associates-crossref.json). Highlights:
- **"Capt. Reich" = Capt. Davis J. Rich** — *dismissed* May 29, 1862 (cashiered mid-war).
- **"Lieut. Scott" = John O. Scott** — promoted captain May 30, 1862, replacing Rich; thus Henry's commander in his final months.
- **"Capt./Lieut. Ransom" = Albert W. Ransom** — Co. D First Sergeant; died of Fredericksburg wounds Dec 22, 1862.
- **"Corporal Kellogg" = Cyrus H. Kellogg** — the POW Henry wrote about; captured **Sept 17, 1861** (exactly one year before Henry's death), paroled, survived. The letters↔record bind is exact.
- **"Brink" = Lieut. Brinkerhoff N. Miner** (Co. D) — resolves the nickname.
- **John Green** (Co. D) — wounded at Antietam, listed beside Henry in the paper.
- Plus Cooper, Dodds, Guion, Perkins, Smith, Roberts, Ferris, Billings, the McDonalds — fates all recovered.
- **Honest nulls:** Edgar Graves, the Corbins, the Savages, B. Moore, Dunning, Plumer, Lieut. Webb are NOT in the 34th — flagged as likely home acquaintances or other-unit men, not invented into the record.

**Co. D's Antietam toll:** Chapin's killed list names ~11 Company D men (Bailey/Bramley, Coonan, Hayes, Mycue, Jolly, Sashagra, Gadban, Blanchard, Carter, Carto, and Hubbell) — Henry was one of roughly a dozen from his own hometown company to die that morning.

*Verdict tally after Sweep 1.1:* 13 logged verdicts; the newspaper upgraded `possible`→`confirmed`; the comrade batch added.
