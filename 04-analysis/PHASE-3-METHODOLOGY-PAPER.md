# Reconstructing Four Soldiers from the Free Record: An LLM-Mediated Cross-Reference Method for Family Letter Collections

> **v1 · 2026-06-23.** A methodology paper drawn from the Phase 3 cross-reference engine, evidenced by four completed sweeps (Henry, Alexander, Charles, James Hubbell). A repository methodology paper for the AI-enabled-historian positioning; **not rendered on the public project site** (per §7). Every factual claim below was fact-checked against the repository artifacts cited throughout — the four dossiers, the 33-entry verification log, and the discrepancy registry.

---

## Abstract

We describe and evaluate a reproducible method for cross-referencing a family's Civil War letter collection against the external historical record using a large language model as a *disciplined judge* rather than a generator. The method's cardinal rule is **"filter, never a source"**: the model never invents a record; it only adjudicates records that a real archive actually returned. We physically separate **retrieval** (parallel agents that fetch verbatim text, exact URLs, and explicit nulls) from **judgment** (a single model applying a written disambiguation rubric and logging every verdict with cited criteria). Applied to the four soldier-brothers of the Hubbell family — across three different regiments and four distinct evidentiary challenges — the method positively identified all four to the highest confidence the free record allows, filled documented data gaps, surfaced and resolved discrepancies between family tradition and the record, and reconstructed each soldier's social world by cross-referencing the comrades named in his letters. We report the workflow, the rubric, the confidence model, four case studies, an honest account of failure modes and limitations, and the front-loaded handoff list of records that remain behind authentication walls.

---

## 1. The problem

A family letter collection is a *first-person, in-the-moment, partial* record. It is rich in voice and relationship but unreliable on dates, spellings, and fates; it is silent on what the writers did not know or could not say. The external archival record is the inverse: *third-person, after-the-fact, authoritative on facts* but mute on daily life and prone to its own gaps and namesake confusion. Genealogical value lies in *binding the two together* — using each to correct, corroborate, and enrich the other — without (a) hallucinating records that do not exist, or (b) misattributing a same-name stranger's record to the subject.

LLMs are tempting and dangerous for this task. Tempting because they can read messy 1860s prose, normalize dialect and phonetic spelling, and reason across sources. Dangerous because their default behavior — fluent generation — is exactly the failure mode genealogy cannot tolerate: a plausible but fabricated muster line is worse than no line at all. The method below is designed to extract the upside while structurally preventing the downside.

---

## 2. The method

### 2.1 Cardinal rule: filter, never a source

The model is permitted to *judge* records and *never* to *produce* them. Operationally this is enforced by separation of powers.

### 2.2 Separation of retrieval and judgment

- **Retrieval agents** (run in parallel, one per "lane") are instructed to fetch only: verbatim quotes, exact URLs, occurrence counts, and explicit NULLs. They are forbidden to infer or fabricate; a 404 or a CAPTCHA is reported as such, not papered over. Their entire output is consumed as *data*.
- **The judge** (a single model instance, the main thread) applies the written rubric to each returned candidate, assigns a verdict with cited criteria, and appends it to an auditable log. One judge, one rubric, one log — so any verdict can be replayed and challenged.

This separation is the single most important design choice. It keeps the log auditable, makes "filter, never a source" mechanically true (the judge has no retrieval channel to fabricate from), and lets retrieval scale horizontally.

### 2.3 The four-lane sweep (per person)

Each person is swept along four parallel lanes, then a judgment-and-write phase:

- **Lane A — Authoritative spine.** The state Adjutant-General roster first (for New York soldiers, the DMNA roster PDFs — downloaded and text-extracted, never WebFetch-summarized); then an independent published regimental history (archive.org djvu text); then the unit summary (Phisterer / NY State Military Museum). Lane A alone often confirms identity.
- **Lane B — Battle, burial, and (for survivors) the post-war trail.** Programmatic battle facts (the CWSAC battle CSV; American Battlefield Trust); burial rolls or, for survivors, census / GAR / death records. This lane *rotates in time* depending on the subject's fate (see §3.2).
- **Lane C — Newspapers, routed by geography.** The right archive for the subject's county, not by habit — for northern New York, NYS Historic Newspapers (not the Library of Congress's Chronicling America, which lacks the relevant titles). Always with a same-town/namesake screen.
- **Lane D — Letter-associates cross-reference.** Extract every comrade/officer the subject names across the letters; look each up in the regimental roster; confirm the real ones, recover the fates the letters never knew, and return *honest nulls* for names that belong to other units or to home. (Added after the Henry pilot; now standing.)

### 2.4 The disambiguation rubric and confidence model

Every verdict cites criteria from a living rubric. Key criteria: regiment+company match (`dispositive`), date envelope, hometown/family signal, rank trajectory, co-mention with known associates, an OCR penalty, and — added during the pilots — an **independent-vs-derivative corroboration** rule (an aggregator that transcribes a roster is not a second vote). Verdicts use a five-level vocabulary (`confirmed / likely / possible / unlikely / rejected`) and a three-axis confidence notation (`basis · legibility · source-certainty`). Hard contradictions (wrong death date, wrong regiment with no transfer path, Confederate service, irreconcilable age) force `rejected`. The rubric is versioned; each sweep that teaches it something bumps the version (v0.1 → v0.5 across the four cases).

### 2.5 Curated, never fuzzy, identity

Person identity is resolved against curated alias tables and the rubric — *never* fuzzy string matching. This is what lets the method confidently return ~25 "this name is not in this regiment" nulls per sweep instead of forcing false matches. The nulls are not a failure of recall; they are the evidence that the confirmations are trustworthy.

---

## 3. Four cases, four challenges

The four brothers were chosen — and sequenced — so that each stresses a different part of the method. That the same four-lane shape handled all four, with only the planned Lane-B rotation, is the central evidence for generalizability.

### 3.1 Henry (34th NY) — the hardest identity

A private killed at Antietam, body never recovered: the rank and fate that leave the faintest trail. Lane A was dispositive — the AG roster returned exactly one Hubbell, confirmed by Chapin's independent 1903 regimental history, which also lists him among the Antietam dead. A *meaningful null* (absence from the named cemetery roll) corroborated "body never recovered." A garbled newspaper hit was confirmed by cross-binding (a comrade, "Peter Jolly," named beside him). Verdict: `confirmed · external · n/a · definite`. (Dossier: `PHASE-3A-HENRY-DOSSIER.md`.)

### 3.2 Alexander (60th NY) — the survivor

A color-bearer who survived, reenlisted, and lived thirty more years in Iowa. Identity could not rest on a death record, so **Lane B rotated forward in time** — reenlistment, muster-out, GAR membership, an Iowa grave. Eddy's 1864 regimental history *independently* named "Sergeant A. F. Hubbell" among the Lookout Mountain wounded, corroborating the family's proudest tradition. The sweep also resolved a conflict *within* the family's own records (death 1894 vs 1899) toward 1894. (Dossier: `PHASE-3A-ALEXANDER-DOSSIER.md`.)

### 3.3 Charles (153rd NY) — disambiguation

The regiment held **four** Hubbells, two named Charles. Identity came not from uniqueness but from criteria working *jointly* (company + hometown + rank — corporal, Company I, Champlain). (Age, by contrast, was *not* a disambiguator here: the roster age conflicts with the family's record and is itself one of the discrepancies surfaced below.) The sweep surfaced a cross-brother thread invisible to any per-person method: Charles's company captain, **Davis J. Rich**, was the same officer who had commanded Henry's company in the 34th NY. It also distinguished a **structural data gap** (Charles's 1875 Iowa death record, predating county record-keeping) from a *meaningful* null. (Dossier: `PHASE-3A-CHARLES-DOSSIER.md`.)

### 3.4 James (153rd NY) — a non-military claim

The youngest brother's defining family story — that he was appointed to **West Point** — is invisible to a military roster. It was verified by **cross-binding**: James's 1862 cadet letters name two contemporaries (Cadet Lt. Peter S. Michie, Class of 1863; Chaplain-Professor John W. French) who are independently confirmable West Point figures. The honest verdict — *present as a cadet, not a graduate, formal admission terms unverified* — illustrates the method landing precisely between flattering and discarding a family claim. (Dossier: `PHASE-3A-JAMES-DOSSIER.md`.)

---

## 4. Findings

### 4.1 Identity
All four brothers `confirmed` to `external · n/a · definite`, with no fuzzy matching, across three regiments. Two were dispositive by roster uniqueness (Henry, Alexander); one required active disambiguation (Charles); one required verifying a claim outside the military record (James).

### 4.2 Facts recovered or sharpened
Ages and exact enlistment dates/places (Henry, Alexander); an *independently corroborated* battle wound (Alexander, Lookout Mountain — named in Eddy's 1864 regimental history) alongside a *roster-confirmed* one (James, Cedar Creek — from the 153rd NY Adjutant-General roster); a precise death date and place (James, Albany, Oct 12 1865); a resolved death-year conflict (Alexander, 1894). The verification log holds 33 adjudicated verdicts with cited criteria.

### 4.3 Discrepancies surfaced (the core Phase-3 deliverable)
Filed in the discrepancy registry: a misdated first letter (Henry); a phonetic officer name, "Reich" → Rich (Henry); a missing→killed casualty signature (Henry); a death-year conflict (Alexander); a birth-year conflict (Charles; James); a death-date conflict resolved against an anniversary conflation (James). A recurring **pattern finding**: enlistment-age and gravestone-age fields are systematically soft across three brothers — a single pre-war census pull would likely resolve all of them.

### 4.4 Relationships reconstructed (Lane D)
Each soldier's company circle was recovered by name-then-verify: Henry's ~17 Company D townsmen; Alexander's 11 Company H comrades; Charles's 16-of-19 (12 in Company I); James's two distinct worlds (West Point cadre + Company I). The method recovered *fates the letters never knew* (a comrade killed though the letter hoped otherwise; another who survived a guerrilla scare; a deserter; a man who left to officer a U.S. Colored Troops regiment) — and a cross-brother officer link (Capt. Rich). One shared artifact — the Glenwood four-brothers memorial — cross-validated facts for all four men at once, leverage available only because identity is modeled family-wide.

---

## 5. Failure modes and limitations (honest accounting)

- **The free record reaches ~80%.** The authoritative primaries (AG rosters, archive.org regimental histories, the CWSAC CSV, county GenWeb databases) are freely fetchable. The richest *remaining* sources — NARA pension files, Compiled Service Records, FindAGrave/SUVCW, USMA cadet application papers, post-1860 censuses — sit behind login, CAPTCHA, paywall, or the postal system. We plan these as **handoffs from the start**, not as failures discovered mid-run.
- **Coverage gaps masquerade as absence — and gating is not the same as absence.** Chronicling America lacks the subjects' home-county papers. Of the titles that *do* hold them, the failure modes differ and must not be conflated: the Plattsburgh Republican/Sentinel for 1864–65 is digitized but **gated** (behind a Cloudflare wall on NYS Historic Newspapers), whereas the Fonda-area papers and the relevant county death registers (Pocahontas Co., Iowa, pre-1880) are **genuinely not digitized**. We distinguish a *structural gap* (coverage failing) from a *meaningful null* (a record that should exist and does not) — conflating them would manufacture false significance.
- **OCR and namesakes.** Surnames split and garble ("HenHubbell"); same-surname strangers abound (the Des Moines financier Frederick M. Hubbell saturates 1890s Iowa print; an Ohio congressman named James R. Hubbell dominates a national search). The OCR penalty and the mandatory same-town/namesake screen are essential, and were extended during the pilots to cover *vital dates*, not just attributions.
- **Gated retrieval is fragile.** One archive (NYS Historic Newspapers) was reachable only via a scripted browser; another (FindAGrave) never by automation. Reproducibility of the *gated* lanes is therefore partial and is documented per source.
- **No claim is upgraded by a derivative source.** Aggregators that transcribe a primary are logged as corroboration, not as independent confirmation.

---

## 6. Reproducibility

Every verdict is replayable: the verification log (`methodology/verification-log.jsonl`, 33 entries) records, per candidate, the source, the verbatim basis, the criteria cited and against, and the reasoning. Per-source JSON artifacts preserve the raw retrieved text and URLs. The rubric is versioned with an override log. The iteration journal records what the *method* learned each session, separately from what the *data* showed. A second researcher with the same rubric and the same archives should reach the same verdicts; where a verdict depends on a gated source, that dependency is flagged.

A note on the verdict count. The log holds 33 verdicts, not more, because of how cleanly the identities resolved rather than any truncation of scrutiny: three of the four regiments yielded a dispositive roster match on the first pass, so fewer candidates required extended adjudication. An internal project milestone had provisionally set a ≥50-verdict target as a proxy for thoroughness; we revise that target to match this outcome. The rigor of the method lives in the per-verdict criteria and the logged reasoning, not in the tally — a higher count produced by adjudicating weaker candidates would be *less* trustworthy, not more.

---

## 7. Ethics and scope

This is identification of long-deceased historical persons from public records, for a family history. We surface discrepancies as *questions resolved with reasoning*, never as silent overwrites of the family's account; the family's tradition and the record are both preserved, with the divergence documented. Provenance is never modified — display-layer enrichments do not alter source data. (Per project constraint, these findings are stored in the repository for future use and are **not** rendered on the public site.)

---

## 8. Conclusion

A large language model, confined to the role of a disciplined judge over real retrieved records, can reconstruct individual Civil War soldiers from free public archives at high confidence — and can do so *honestly*, returning nulls where the record is silent and landing precise verdicts on claims that are neither fully provable nor false. The four Hubbell brothers, spanning the hardest identity, the survivor, the disambiguation, and the non-military claim, were each confirmed, enriched, and set in their social world by one unchanged four-lane method. The method's discipline — filter never a source; retrieval separated from judgment; nulls and gaps named honestly; identity curated, never fuzzy — is what makes its confirmations worth trusting. What remains is the ~20% behind archive walls, itemized as handoffs, each of which would deepen but none of which is needed to establish who these four men were.

---

## Appendix — Artifacts

- Dossiers: `04-analysis/PHASE-3A-{HENRY,ALEXANDER,CHARLES,JAMES}-DOSSIER.md`
- Per-person source records: `03-data/external-sources/per-person/PER-hubbell-{henry,alexander,charles,james}/`
- Verification log: `03-data/external-sources/methodology/verification-log.jsonl` (33 verdicts)
- Disambiguation rubric (v0.5): `03-data/external-sources/methodology/disambiguation-rubric.md`
- Discrepancy registry: `04-analysis/phase-3-discrepancies/INDEX.md` (+ DSC-*.md)
- Source-quality notes & iteration journal: `03-data/external-sources/methodology/`
- Per-sweep handoff lists: `tasks/PHASE-3-SWEEP-{1,2,3,4}-HANDOFF.md`
- Shared battle details: `03-data/external-sources/shared/battle-details/{antietam,lookout-mountain,cedar-creek}.json`
