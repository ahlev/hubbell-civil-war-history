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
