# Iteration Journal

Dated notes on what the *methodology* learned each working session — not what the data showed (that lives in the per-person files and discrepancy registry).

---

## 2026-06-05 — Henry pilot (Sweep 1.0)

**What we ran.** Full Phase 3a source loop on Henry Hubbell via five parallel retrieval agents (service records, battle data, newspapers, burial, secondary-push) + one background agent on NYS Historic Newspapers. Retrieval and verdict were SPLIT: agents fetched raw candidates with citations; the main thread applied the rubric and wrote verdicts. This separation kept the verification log auditable and reduced hallucination risk.

**What worked.**
- The split (agent = retrieval, main = filter) is the right shape. Agents returned verbatim quotes + URLs; the rubric was applied once, consistently, by one judge.
- The **NY AG roster as first pull** is decisive — one line confirmed identity (C1+C2+C4+C6) and filled three data gaps. For any NY soldier, pull this first.
- **Independent corroboration mattered.** Chapin (1903) is a genuinely independent witness; AOTW only looks independent but is derivative of the AG report. The rubric needs to distinguish independent vs. derivative corroboration (see rubric change below).
- A garbled newspaper hit became *more* credible via cross-binding: the OCR'd "Peter Jolly" beside "HenHubbell" matches Chapin's killed list ("Jolly, Peter — D"). Cross-source token-binding is a useful disambiguation move.

**What broke / surprised.**
- Chronicling America's legacy JSON API is dead; coverage excludes the hometown county for 1862. The single most likely primary corroboration (a Clinton County death notice) is in a DIFFERENT archive (NYS Historic Newspapers) — which wasn't in our original source list. **The catalog had a gap.**
- The gated sources (CWSS card, FindAGrave, SUVCW, FamilySearch, NARA pension) are exactly the ones automation can't reach. Plan for these as handoffs from the start, not as failures discovered mid-run.
- Roster PDFs defeat WebFetch summarization; they need download + local text extraction.

**Rubric changes made (v0.1 → v0.2).**
- Filled **TODO-1** with validated, source-checked per-brother distinguishing signals (Henry's are now battle-tested).
- Added a note under C1/corroboration: **weight independent vs. derivative sources differently** — AOTW/various aggregators transcribe the AG roster and must not be counted as separate confirmations.
- Confirmed the **C8 OCR penalty** is essential; it correctly held the NY Herald hit at "possible."

**Verdict tally this session:** confirmed 4 · possible 1 · rejected 5 (3 batched) · null 2. Total log entries: 10.

**Discrepancies filed:** DSC-2026-06-05-001 (first-letter June/July date vs. regiment departure — notable, resolved); DSC-2026-06-05-002 (Capt. "Reich" → Capt. Davis J. Rich — minor, resolved). One minor external-vs-external casualty-figure discrepancy tabulated.

**Net read on the method:** It is REAL, not aspirational. On free, fetchable primaries it confirmed identity to `definite`, filled gaps, and surfaced two genuine letter-vs-record discrepancies in a single pass — exactly the Phase-3 promise. The improvements for the next brothers are mostly about (a) catalog additions (NYS Historic Newspapers, archive.org regimental histories, FamilySearch) and (b) front-loading the handoff list. Captured in the Phase 3 V2 plan.

---

## 2026-06-06 — Alexander pilot (Sweep 2.0) — the survivor case + Lane D standardized

**What we ran.** Full V2 sweep on Alexander F. Hubbell (60th NY, Co. H) via FOUR parallel retrieval agents: Lane A (spine), Lane B (burial/post-war), Lane C (newspapers), and a now-standard **Lane D (letter-associates cross-reference)**. Retrieval/judgment split held. Mid-run the researcher set a standing directive: for *every* brother, revisit results to recover what the records can say about the man's world and relationships (the Henry Sweep-1.1 company-circle move) — so Lane D is now a permanent lane, not an addendum.

**What worked.**
- **The roster-first rule held perfectly:** the 60th NY roster returned exactly ONE Hubbell — instant dispositive identity, no disambiguation needed. Two brothers, two regiments, same outcome: pull the AG roster first.
- **Independent corroboration was even stronger than Henry's:** Eddy's 1864 regimental history named "Sergeant A. F. Hubbell" in the Lookout Mountain WOUNDED list — corroborating the family's proudest tradition from a contemporaneous published source (C9).
- **The survivor lane-shift (V2 §4) is validated:** rotating Lane B post-war (death record + GAR + grave + census-absence-test) carried identity across 30 years to an Iowa grave. This is now a confirmed branch of the template.
- **Lane D scaled and proved the discipline:** 11 Co. H comrades confirmed, ~25 honest nulls. The nulls (Perkins=34th NY, Burdick=153rd NY) are the clearest demonstration yet that curated, non-fuzzy identity matching is correct — a fuzzy matcher would have mis-assigned them.

**What broke / surprised.**
- **Both of the *right* newspapers were out of reach at once:** the wartime honor (Plattsburgh papers, NYS Historic Newspapers — Cloudflare) AND the death-fixing obituary (Fonda Times — not digitized anywhere). For an emigrant survivor, plan TWO newspaper geographies and expect both gated.
- **A namesake corrupted a VITAL DATE, not just an attribution:** the spurious "Dec 7 1899" almost certainly rode in on Frederick M. Hubbell (Des Moines financier) saturating 1890s Iowa print. New lesson: run the same-town/namesake check on vital dates too.
- **Rosters omit duty assignments:** color-bearer and ambulance-corps service (cherished in the letters) are simply not roster fields — "unverified," not "contradicted." Route such claims to newspapers/pension from the start.

**Rubric changes made.** TODO-1 Alexander signals upgraded draft → **VALIDATED** (Co. H, color bearer [letters-only], Lookout Mountain wound [Eddy-confirmed], veteran reenlistment, Champlain, d. 1894 Fonda IA). No new criteria needed; C4/C9 and the same-town check did the work (extended in practice to vital dates).

**Verdict tally this session:** confirmed 5 · likely 1 (death date) · rejected 1 (newspaper namesakes) + comrade batch. Total log entries now 20.

**Discrepancies filed:** DSC-2026-06-06-002 (death date 1894 vs 1899 — notable, resolved toward 1894); two minor tabulated (sergeant-promotion date; muster-out date); plus the color-bearer claim flagged open.

**Net read:** The method generalizes from the fallen to the survivor without modification beyond the planned lane-shift. Lane D is the highest-yield-per-token addition — it turns a confirmed identity into a reconstructed social world. Carry the four-lane shape into Charles and James unchanged.

---

## 2026-06-06 — Charles pilot (Sweep 3.0) — the DISAMBIGUATION case + a structural-gap lesson

**What we ran.** Full four-lane V2 sweep on Charles F. Hubbell (153rd NY, Co. I). Same retrieval/judgment split.

**What worked.**
- **The disambiguation rubric earned its keep.** The 153rd held FOUR Hubbells, TWO named Charles. Identity came from C1 (Co. I) + C4 (Champlain) JOINTLY — not roster uniqueness (which carried Henry/Alexander). First project case where surname/given-name alone would have failed or mis-attached. The two Minden (Co. E) Hubbells are a separate family; one was even wounded at Cedar Creek the same day as brother James — proving COMPANY, not surname or battle, is the load-bearing field.
- **Family-wide identity model paid off:** Co. I's captain Davis J. Rich = Henry's "Capt. Reich"/Rich of the 34th NY ("prior service, 34th Infantry"). A name resolved in Henry's sweep unlocked an officer in Charles's. Per-person matching could never find this.
- **Lane D was the richest yet** — 16/19 confirmed, fates recovered (Lucas KILLED at Cedar Creek though letters hoped otherwise; Douglass survived though feared captured; Trombly → 20th USCT officer; Gokey deserted). With NO published regimental history for the 153rd, the company-circle's internal consistency became the CORROBORATION, not just enrichment.
- Captured **James's roster line for free** (same company) — jump-starts Sweep 4.

**What broke / surprised.**
- **No published regimental history of the 153rd exists** (only the unpublished Enders ms. at NYSL). Charles's external stack is thinner than his brothers' — logged honestly; corroboration leaned on the NYSMM sketch + Lane D.
- **NEW DISTINCTION: structural gap ≠ meaningful null.** Charles's 1875 Iowa death record is simply NOT in free sources (Pocahontas Co. death records begin 1880). This is coverage failing, NOT evidence — unlike Henry's cemetery null (which proved body-never-recovered). Conflating them would manufacture false significance. The engine now labels the two differently.
- **Disease is the archival blind spot.** The weapon that killed Charles (and 161 of the 153rd's 202 dead) is the worst-documented; the pension file is the designed-in handoff for it.

**Rubric changes.** TODO-1 Charles signals validated (Co. I, Champlain, corporal, mustered out Oct 2 1865, d. 1875 disease). Added the structural-gap-vs-null distinction as a logging convention (no new criterion needed). Same-surname disambiguation guidance reaffirmed (C1+C4 jointly).

**Verdict tally this session:** confirmed 5 · possible 1 (1875 death, unconfirmed) · rejected 1 (newspaper namesakes) + comrade batch + 2 source-NULLs. Total log entries now 27.

**Discrepancies filed:** DSC-2026-06-06-003 (birth year 1837 vs 1840 — notable, open); tabulated: Capt. Rich cross-link; Lucas record-corrects-letter; the 1875 structural data gap.

**Net read:** Charles is the proof the engine disambiguates, not just deduplicates. The four-lane shape held; the only adaptation was honesty about a thinner corroboration stack and a missing death record. Carry into James — whose roster line is already in hand and who shares Charles's Co. I circle.
