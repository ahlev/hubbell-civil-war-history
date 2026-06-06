# Phase 3 Dossier — Alexander Fullerton Hubbell: The Brother Who Came Home

> **Sweep 2.0 · 2026-06-06.** The second full run of the Hubbell cross-reference engine, executed on the family's survivor — the only brother whose voice spans the entire war and outlives it. This is the narrative; it is reinforced by the per-source artifacts in [`03-data/external-sources/per-person/PER-hubbell-alexander/`](../03-data/external-sources/per-person/PER-hubbell-alexander/), the verdict log in [`methodology/verification-log.jsonl`](../03-data/external-sources/methodology/verification-log.jsonl), and the discrepancy file in [`phase-3-discrepancies/`](phase-3-discrepancies/). It applies the V2 workflow proven on Henry; the lane-shifts for a survivor are flagged where they occur.

---

## 1. Why Alexander is the methodological mirror of Henry

Henry was the hardest case because he was a *private who died* — the rank and the fate that leave the faintest trail. Alexander is the opposite case, and tests a different claim. He **survived**, **rose through the ranks**, **reenlisted**, and **lived another thirty years** in a state two thousand miles from where he was born. His identity therefore can't rest on a single dispositive death record the way Henry's did; it has to be carried *forward through time* — from a wartime roster line, across a veteran reenlistment, out to an Iowa grave with a GAR star on it.

That makes him the right second case: **if the method only worked on a soldier frozen at his moment of death, it would not be a genealogy engine — it would be a casualty lookup.** Alexander forces the engine to reconstruct a *whole life*, and to do it for a man the war did not stop to record.

**Ground truth going in** (from the 28 letters, the transcribed muster roll [M01], and the family genealogy [G03]): Alexander Fullerton Hubbell, b. March 28 1844, Champlain; Corporal, Co. H, 60th NY; promoted Sergeant; color bearer, later ambulance corps; wounded at Lookout Mountain; reenlisted; mustered out 1865; moved to Iowa; died 1894 *or* 1899. The external record was asked to confirm the spine and resolve the conflicts.

---

## 2. The method, unchanged — with one lane turned forward in time

The cardinal rule is the same: **filter, never a source** — the engine judges only records a real archive returned, never invents one. Retrieval and judgment were again physically separated: **four parallel agents** did nothing but fetch (Lane A authoritative spine; Lane B burial/post-war; Lane C newspapers; Lane D letter-associates), each returning verbatim quotes, exact URLs, and explicit nulls. The main thread then applied the [disambiguation rubric](../03-data/external-sources/methodology/disambiguation-rubric.md) and logged every verdict.

The **one deliberate change for a survivor** (anticipated in the [V2 plan §4](../tasks/phase-3-plan-v2.md)): Lane B's burial sub-lane was rotated *post-war* — instead of a cemetery roll fixing a death in 1862, it sought the death record, GAR membership, census, and grave that fix a life ending in 1894. This worked, and is now a validated branch of the template.

---

## 3. What the record returned

### 3.1 The confirming spine — official roster + independent regimental history

The decisive record was again the **NY State Adjutant-General's roster**, this time of the 60th Infantry ([DMNA PDF](https://dmna.ny.gov/historic/reghist/civil/rosters/Infantry/60th_Infantry_CW_Roster.pdf)). A full-text scan of the entire 175-page roster returned **exactly one Hubbell**:

> **HUBBELL, ALEXANDER F.**—Age, 18 years. Enlisted, September 21, 1861, at Champlain, to serve three years; mustered in as corporal, Co. H, October 30, 1861; promoted sergeant, October 1, 1862; re-enlisted as a veteran, December 14, 1863; mustered out with company, July 17, 1865, at Alexandria, Va.

This single line is **dispositive** (rubric C1: regiment + company match, no competing Hubbell in ~1,371 entries; C2: dates inside the window; C4: the distinctive Champlain hometown; C6: the corporal→sergeant→veteran trajectory the letters describe). Verdict: **`confirmed` · `external · n/a · definite`.**

It is independently corroborated by **Richard Eddy's *History of the Sixtieth Regiment New York State Volunteers* (1864)** ([archive.org full text](https://archive.org/details/historyofsixtiet00eddy)) — a genuinely separate published witness, written by the regiment's own chaplain during the war. Eddy names "Hubbell, A. F." in the **Company H organization roll** *and* — decisively — lists **"Sergeant A. F. Hubbell"** among the 60th's **wounded at Lookout Mountain** (Nov 24, 1863). That is the family's proudest tradition about Alexander, corroborated by a contemporaneous published source (rubric C9: independent, not derivative).

### 3.2 The facts the record sharpened or confirmed

| Family record said | The record shows | Source |
|---|---|---|
| Enlisted "from Champlain" | **At Champlain**, age 18, Sept 21 1861 (Co. H "recruited principally at Champlain") | NY AG roster; Phisterer/NYSMM |
| "Wounded at Lookout Mountain" | **Confirmed** — "Sergeant A. F. Hubbell, Co. H" in the wounded list | Eddy 1864 |
| "Reenlisted Dec 14 1863" | **Confirmed** — "re-enlisted as a veteran, December 14, 1863" | NY AG roster |
| Mustered out "1865, Alexandria VA" | **July 17, 1865, Alexandria** (×2 sources) | NY AG roster; Phisterer |

### 3.3 The battlefield arc

The 60th NY — the "St. Lawrence Regiment" — served in the **XII Corps** (later consolidated into the **XX Corps**): Antietam (where the regiment's Col. Goodrich was killed), Chancellorsville, **Gettysburg's Culp's Hill** (the extreme left of the corps — the family-tradition site where a descendant was later named), **Lookout Mountain** (where Alexander was wounded and the regiment "captured one cannon and battle flag"), and the Atlanta Campaign through to the Carolinas. Battle facts confirmed against [CWSAC](https://raw.githubusercontent.com/jrnold/acw_battle_data/master/build/acw_battle_data/cwsac_battles.csv) (Chattanooga **TN024**; Gettysburg **PA002**) and the American Battlefield Trust; see [`shared/battle-details/lookout-mountain.json`](../03-data/external-sources/shared/battle-details/lookout-mountain.json).

### 3.4 The survivor's trail — an Iowa grave with a GAR star

Where Henry's burial lane ended in a meaningful *null*, Alexander's ended in a *life*. The **IAGenWeb Pocahontas County Civil War Soldiers Database** records him at the far end of it:

> Hubbell, Alexander F. … Buried: Cedar twp., Fonda … DOB: 28 Mar 1844 … **DOD: 7 Dec 1894** … Marker: **GAR star**

The matching birth date and burial place anchor this to our Alexander; the **GAR star** confirms he lived as a Union veteran in his Iowa community to the end. This record also **resolves a conflict in the family's own files** (see §4).

---

## 4. Discrepancies surfaced

The sweep produced the Phase-3 deliverable — points where the family's account and the record diverge, each then resolved:

1. **[DSC-2026-06-06-002](phase-3-discrepancies/DSC-2026-06-06-002.md) — death date 1894 vs 1899 (notable, resolved).** The family genealogy carried both "Dec 7, 1899" (with pension numbers) and "1894." The external IAGenWeb record + GAR star favor **December 7, 1894**, reconciling the family's "Dec 7" day with the 1894 year. The likely source of the "1899" error is doubly instructive: it is the exact year the unrelated Des Moines financier **Frederick M. Hubbell** saturates Iowa newspapers — a namesake-as-noise hazard (see §6).

2. **Sergeant-promotion date (minor, tabulated).** Roster: "October 1, 1862." Family: "Oct 21, 1862." A clean day-transcription variant (1 ↔ 21); the official roster governs.

3. **Muster-out date (minor, tabulated).** Roster *and* Phisterer: "July 17, 1865." Family: "July 7, 1865." Two independent record sources agree on the 17th; a 7↔17 day transposition in the family copy.

4. **Color bearer / ambulance corps (open, not a contradiction).** The letters and genealogy say Alexander carried the colors and later served in the ambulance corps. Neither the roster, Eddy, nor Phisterer records duty *assignments* (they record rank/company/fate), so this is **unverified, not contradicted** — flagged for the newspaper/pension handoff, where a color-bearer honor would most plausibly appear.

---

## 5. Identity verdict & confidence

**Alexander Fullerton Hubbell is positively identified in the historical record at the highest confidence the free sources allow** — `external · n/a · definite` — anchored by an official state roster (the unique Hubbell in his regiment) and an independent published regimental history that names him in both the company roll and the Lookout Mountain casualty list. As with Henry, the identification required **no fuzzy matching**: regiment + company + hometown + a clean rank trajectory formed a dispositive lock.

**Verdict tally (this sweep):** confirmed 5 · likely 1 (death date) · rejected 1 (newspaper namesakes) · plus the comrade batch. Seven new entries in the [verification log](../03-data/external-sources/methodology/verification-log.jsonl), every one with cited criteria and reasoning.

---

## 6. Alexander's company circle — what the letters and the record recover together

> *This section answers the standing question across all four brothers: knowing whom each man named, what can the external record now tell us about his world that he could not? Methodology, then findings, with every match sourced.*

**The method (why it works).** A soldier's letters are an *in-the-moment, partial, self-censored* record: he names the men around him but rarely their fates, and never the ones the censor or his mother shouldn't read. The regimental roster is the *omniscient, after-the-fact* record: it knows every man's end but nothing of the daily bonds. **Cross-referencing the two turns a name into a life.** Concretely: extract every comrade/officer Alexander names across his 28 letters, then look each up in the 60th NY roster and Eddy's history — confirming the real ones, recovering fates he never knew, and (critically) returning honest **nulls** for the men who belong to *other* regiments or to home, never forcing a match. This is the same move that recovered Henry's whole Company D in Sweep 1.1; full data in [`letter-associates-crossref.json`](../03-data/external-sources/per-person/PER-hubbell-alexander/letter-associates-crossref.json).

**What it recovered — 11 confirmed Company H men + the regiment's fallen colonel:**

- **Capt. James M. Ransom** — Alexander's company commander, the man the family hosted for tea; the record shows he *resigned Feb 2, 1863* (Eddy: "Captain Ransom Resigns"). [NY AG roster; Eddy]
- **Amos G. Luther** — the "Luther" of the letters, Alexander's closest comrade (the muster roll already paired them); rose to first sergeant, commissioned 2nd Lt. (not mustered) at war's end. [NY AG roster; Eddy]
- **Sgt. Alvah S. Howes** — "Commissary Howes… he rooms with me"; a same-day Champlain-cohort enlistee; survived. [NY AG roster]
- **Charles H. Dickinson** — the "orderly" whose promotion to lieutenant (the letters anticipate it) opened the NCO chain Alexander climbed; the record confirms he made 2nd Lt. then was discharged Nov 1862. [NY AG roster; Eddy]
- **Capt. Patrick H. Brockway** — the Co. H sergeant who *ended the war commanding the company*. [NY AG roster]
- **Pvt. Sidney Rider** — listed in Eddy's casualty roll *immediately beside* "Sergeant A. F. Hubbell": a same-day, same-town (Champlain) enlistee, **wounded alongside Alexander at Lookout Mountain.** (The exact source-binding that anchored Henry — a comrade's name next to his in a casualty list.) [Eddy; NY AG roster]
- **Fates the letters never knew** — recovered from the record: **Lt. Loring E. White** died of *typhoid* (Jul 26 1862); **Pvt. Edwin H. Porter** was *accidentally killed by railroad cars* near Baltimore (Jan 8 1862) — echoing the family's "Capt. Ransom had a narrow escape" railroad story; **Pvt. Alexander Lablue** (a Champlain same-day enlistee) *deserted* from Loudon Heights (Oct 24 1862); **Pvt. James E. White** *died of wounds* (Aug 28 1862).
- **Col. William B. Goodrich** — the "Col." Mother wrote of the 60th losing: Eddy preserves Gen. Greene's words, "the death of Colonel Goodrich by the hands of the insurgents, whilst gallantly leading my Brigade into action, at the battle of Antietam."

**What it correctly refused to recover — ~25 honest nulls.** The discipline is the point. Names that *look* like they should be in the 60th but aren't: **"Corporal Perkins"** (explicitly Henry's *34th NY* messmate), **"Lieut. Burdick"** (Charles's *153rd NY*), and a long tail of home-and-academy acquaintances. A fuzzy matcher would have forced Perkins or Burdick into Alexander's company; the curated method assigned them to the right brothers' regiments instead. **The nulls are the proof the confirmations are real.**

---

## 7. The secondary push & the newspaper boundary

Lane C found the instructive null again — but for the *opposite* reason from Henry. For Alexander there were *two* right newspapers and **both are out of automated reach**: the wartime honor would be in the **Plattsburgh Republican/Sentinel** (NYS Historic Newspapers — Cloudflare-gated), and the obituary that would carve the death date in stone would be in the **Fonda Times** (Pocahontas County, Iowa — *not digitized in any archive*). Chronicling America holds neither: its NY coverage is NYC-only (yielding two wrong-regiment Hubbells), and it holds no Pocahontas County paper at all. Every Iowa "Hubbell" in print in the 1890s is **Frederick M. Hubbell**, the Des Moines millionaire — the namesake that almost certainly seeded the spurious "1899" death date. The color-bearer corroboration and the obituary are therefore both **handoffs**, itemized in §8.

---

## 8. Open threads (→ handoff)

Itemized for the researcher in [`tasks/PHASE-3-SWEEP-2-HANDOFF.md`](../tasks/PHASE-3-SWEEP-2-HANDOFF.md). None blocks the conclusion — Alexander is **confirmed** — but each adds a layer:

- **Death-date lock:** the FindAGrave / Iowa WPA *stone transcription* for Cedar Township Cemetery; and the **widow's pension filing date** (if Lois filed in 1894–95, it dates the death). Check the family's app #710.072 / cert #658.842 there.
- **1900 census absence test:** a widow-headed Lois household (children Frederick/Affa/Wolcott/Helen) in 1900 corroborates a pre-1900 death.
- **Color-bearer corroboration:** unblock **NYS Historic Newspapers** and search the Plattsburgh papers 1863–1865 for a 60th-NY / Lookout-Mountain / color-bearer mention.
- **Physical description:** the **Compiled Service Record** (FamilySearch/Fold3) — the descriptive roll.
- **The Fonda obituary:** the **Fonda Times**, Dec 1894, via State Historical Society of Iowa or the Pocahontas County Historical Society (microfilm).

---

## 9. Definition-of-done check (V2 §6)

- [x] Identity verdict logged with confidence (`confirmed · external · n/a · definite`).
- [x] Every Lane A/B/C/D source checked — hit or explicit null — with per-source JSON.
- [x] `PER-hubbell-alexander.md` created; `_index.md` + External Source Records table written.
- [x] Discrepancies filed (one dedicated DSC + two tabulated) and registry updated.
- [x] Narrative dossier written (this document).
- [x] Front-loaded handoff doc lists every gated item.

**Alexander sweep: complete.** The engine confirmed a survivor across thirty years and two thousand miles, corroborated his proudest war tradition (the Lookout Mountain wound) against an independent 1864 source, resolved a conflict in the family's own death records, and recovered his whole company circle — including the fates of comrades his letters never lived to tell. The survivor's lane-shift is now a validated branch of the V2 template, carried into Charles and James.

---

## 10. What this sweep teaches (folded into the method)

1. **For a survivor, push the spine forward in time.** Reenlistment + muster-out + GAR + grave carry identity the way a death record carries it for the fallen.
2. **A family's *internal* contradictions are resolvable targets, not noise.** The engine settled 1894-vs-1899 with an outside source rather than by choosing one family document over another.
3. **Namesakes corrupt dates, not just attributions.** The famous F. M. Hubbell is the likely origin of the bad "1899" — a reminder to run the same-town/namesake check on *vital dates*, not only on newspaper hits.
4. **The letter-associates cross-reference scales.** It worked on Henry (Co. D) and Alexander (Co. H); it is now a standing Lane D for every brother — and its **nulls** are the clearest evidence the curated, non-fuzzy identity method is sound.
5. **Some corroborations live only behind a wall.** The color-bearer honor and the obituary are real, locatable, and gated — planned as handoffs from the start, not discovered as failures.
