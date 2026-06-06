# Phase 3 Dossier — Charles Fullerton Hubbell: The Disambiguation Case, and the Brother the War Killed Slowly

> **Sweep 3.0 · 2026-06-06.** The third run of the Hubbell cross-reference engine. Charles is the case that tests the *disambiguation* rubric rather than the roster-uniqueness shortcut — and the case where the war's deadliest weapon (disease) leaves the faintest paper trail. Reinforced by the artifacts in [`03-data/external-sources/per-person/PER-hubbell-charles/`](../03-data/external-sources/per-person/PER-hubbell-charles/), the [verification log](../03-data/external-sources/methodology/verification-log.jsonl), and [DSC-2026-06-06-003](phase-3-discrepancies/DSC-2026-06-06-003.md).

---

## 1. Why Charles is the hard *identity* case

Henry and Alexander were each the **only Hubbell in their regiment** — identity fell out of a single roster scan. Charles breaks that shortcut. The 153rd NY carried **four** Hubbells, **two of them named Charles**. If the method matched on surname — or even on "Charles Hubbell" — it would fail or, worse, silently attach the wrong man's record. Charles is therefore the test of whether the engine can *disambiguate*: separate the right man from his namesakes using the rubric's combined criteria, not a uniqueness fluke.

It passed. And in passing it surfaced a thread that reaches back into Henry's sweep.

**Ground truth going in** (letters + genealogy G08 + the 1996 introduction): Charles Fullerton Hubbell, b. April 1840, Champlain; Co. I, 153rd NY (the same company his brother James would later join); a regimental clerk and "newspaper correspondent"; survived the war; died **March 1875** of a disease contracted in service, by then settled with Alexander in Dover Township, Iowa.

---

## 2. The disambiguation, worked

A full-text scan of the 153rd roster returned four Hubbells. The rubric assigned each:

| Roster entry | Co. | Town | Age | Verdict | Why |
|---|---|---|---|---|---|
| **HUBBELL, CHARLES F.** | **I** | **Champlain** | 25 | ✅ **TARGET** | C1 (Co. I) + C4 (Champlain) + C6 (corporal) — the family's man |
| HUBBELL, JAMES | I | (7th Cong. Dist.) | 22 | → James | younger brother; later enlistment (Mar 1864); the James sweep |
| HUBBELL, CHARLES B. | E | Minden | 44 | ❌ rejected | wrong company, wrong town, age 44, middle initial B |
| HUBBELL, J. ELBERT | E | Minden | 18 | ❌ rejected | Co. E, Minden — same unrelated family as Charles B. |

The decisive move was **not** "find the Hubbell" but "find the *Champlain Co. I* Hubbell named Charles **F.**" — C1 and C4 working *jointly*. The two Minden men (Montgomery County) are a separate Hubbell family; one of them (J. Elbert) was even wounded at Cedar Creek the same day as the target's brother — a coincidence that shows exactly why **company**, not surname or even battle, is the load-bearing field. Verdict on the target: **`confirmed` · `external · n/a · definite`.**

> **The corroboration problem, named.** Unlike Henry (Chapin 1903) and Alexander (Eddy 1864), Charles has **no published regimental history** — none of the 153rd NY exists in full text (the only narrative is the unpublished Enders manuscript at the NY State Library). So Charles's identity rests on the AG roster plus the NYSMM/Phisterer unit sketch (which confirms Co. I = Champlain) and the *internal* corroboration of the company-circle cross-reference (§5). This is an honest weakening of the evidence stack relative to his brothers, and it is logged as such.

---

## 3. The cross-brother thread: Captain Davis J. Rich

Charles's first company commander, named in his earliest letter ("Rich is Captain"), is in the roster as:
> **RICH, DAVIS J.**—Age 31... captain, Co. I, October 11, 1862... **prior service as captain, 34th Infantry.**

That is the same **Capt. Davis J. Rich** who commanded **Henry's** Company D in the 34th NY — the officer Henry spelled by ear as "Capt. Reich" ([DSC-2026-06-05-002](phase-3-discrepancies/DSC-2026-06-05-002.md)). After the 34th, Rich took a captaincy in the 153rd and led Charles's company. **One officer links two brothers' regiments** — a connection only a *family-wide* curated identity model could surface, because it required a name resolved in Henry's sweep to unlock a record in Charles's. (Rich resigned in November 1863; Charles's Lt. McGuire rose to captain "vice D. J. Rich resigned" — the chain closes.)

---

## 4. The war's real weapon — and the trail that goes cold

The 153rd's own numbers tell Charles's fate before any death record does: **of 202 deaths in the regiment, 161 were from disease** — four times the combat toll. Charles came home in 1865 and died in **1875** of the illness he carried out of the army. He is the only brother the war killed *slowly*.

And here the engine hit a genuine wall — instructively different from Henry's. Henry's burial *null* was evidence (no grave ⇒ body never recovered). Charles's 1875 death record simply **does not exist in any free source**: Pocahontas County, Iowa death records begin in **1880**, five years too late; FindAGrave and the WPA grave index are gated; the only 19th-century Pocahontas Hubbell with a transcribed stone is brother Alexander. This is a **structural gap, not a meaningful absence** — and the distinction is itself a methodological finding (see §7). His grave and the name of his disease wait behind two handoffs: the **pension file** (whose invalid-claim affidavits would name the disease and date its onset in service) and the **1880-census absence** (which would bound the death).

---

## 5. Charles's company circle — the richest recovery yet

> *Methodology: extract every comrade Charles names across his letters, look each up in the 153rd roster, confirm the real ones, recover the fates he never knew, and return honest nulls for the men who belong elsewhere. Full data: [`letter-associates-crossref.json`](../03-data/external-sources/per-person/PER-hubbell-charles/letter-associates-crossref.json).*

Of **19 named associates, 16 were confirmed** in the 153rd (12 in Company I). The Company I officer chain reconstructs exactly: **Capt. Davis J. Rich** → **Capt. John F. McGuire**; Lieut. **Charles L. Knapp**. And the cross-reference recovered the fates Charles's letters — written in hope, in the moment — could not know:

- **Sgt. James Lucas**, Charles's tentmate. Charles wrote that Lucas was "reported killed... shot through the head and arm," then seemed to hope he'd survived. The roster is final: **killed in action, October 19, 1864, at Cedar Creek.** (The same letter's detail that Lucas had earlier been "reduced to the ranks... for stealing rations" matches the roster's "returned to ranks, August 1, 1863.")
- **Com. Sgt. Alexander Douglass**, whom the family feared "captured or killed... by guerillas" in October 1864 — the roster gives the **happy ending the letters never got**: he survived, rose to commissary sergeant, and mustered out in 1865.
- **Cpl. Bruno Trombly** — left Co. I to become **an officer in the 20th U.S. Colored Troops.**
- **Pvt. Moses Gokey** — **deserted**, November 1863.
- **Lt. Col. Alexander Strain** — the officer who got Charles his clerk's post; James asked in a letter whether Strain "lost a leg" at Cedar Creek. The roster answers: **wounded and discharged for disability from wounds, but no amputation recorded.**

The three **honest nulls** — "Welky," "Savage," a garbled "Col. Sabastine" — were *not* forced into the regiment; they are likely phonetic renderings of Champlain French-Canadian names beyond recovery, and saying so is the discipline that makes the 16 confirmations trustworthy.

**Cedar Creek (October 19, 1864) was the deadliest day for Charles's circle:** Lucas killed; brother James, 1st Sgt. Peltier, and Lt. Col. Strain all wounded — precisely as Charles reported it. Battle facts cached in [`shared/battle-details/cedar-creek.json`](../03-data/external-sources/shared/battle-details/cedar-creek.json).

---

## 6. Discrepancies surfaced

1. **[DSC-2026-06-06-003](phase-3-discrepancies/DSC-2026-06-06-003.md) — birth year (notable, open).** Roster age 25 in Aug 1862 → **b. c. 1837**, vs. the genealogy's **April 1840**. The roster's *age* field is only as good as what the enlistee said, so the engine flags rather than overrides; the census/pension will settle it. (Note: a c. 1837 birth would make Charles and Henry nearly the same age — which the genealogy's 1840 obscures.)
2. **Capt. Rich cross-link (tabulated).** Not a contradiction but a cross-brother finding extending DSC-2026-06-05-002.
3. **Lucas's fate (resolved within the circle).** The letters' hopeful "shot through the head and arm" vs. the roster's "killed in action" — the record corrects the correspondence.

---

## 7. Identity verdict & what this sweep teaches

**Charles F. Hubbell is positively identified** — `external · n/a · definite` — by disambiguation rather than uniqueness, the first such case in the project. Seven new verification-log entries.

1. **Disambiguation beats uniqueness as the real test.** When a regiment holds multiple same-surname (even same-given-name) men, identity must come from C1+C4 jointly (company + hometown), never from surname. Charles proves the rubric does this.
2. **A family-wide identity model finds cross-person threads** (Capt. Rich) that per-person matching cannot.
3. **Distinguish a meaningful null from a structural gap.** Henry's missing grave was *evidence*; Charles's missing 1875 death record is merely *coverage failing* (county records postdate the death). Conflating the two would manufacture false significance — so the engine labels them differently.
4. **When there is no published regimental history, the company-circle cross-reference becomes the corroboration**, not just enrichment — its internal consistency (officers, promotions, Cedar Creek casualties all matching the letters) is what backstops a thinner external stack.
5. **Disease is the archival blind spot.** The weapon that killed Charles (and 161 of his regiment) is exactly the one the free record documents worst; the pension file is the designed-in handoff for it.

---

## 8. Open threads (→ handoff)

Itemized in [`tasks/PHASE-3-SWEEP-3-HANDOFF.md`](../tasks/PHASE-3-SWEEP-3-HANDOFF.md):
- **Pension file** ⭐ — names the disease and dates its service onset; the evidentiary core of "died of war disease."
- **NYS Historic Newspapers** ⭐ — Charles the "newspaper correspondent"; signed 153rd dispatches in the Plattsburgh/Fonda papers would be a first-person published voice.
- **1870 + 1880 U.S. Census (Iowa)** — confirm the migration; the 1880 absence bounds the 1875 death.
- **FindAGrave / Clinton Co. NY records** — locate the 1875 grave.
- **Enders manuscript history of the 153rd** (NY State Library) — the only narrative history; may name Co. I men.

---

## 9. Definition-of-done check (V2 §6)

- [x] Identity verdict logged with confidence (`confirmed`, by disambiguation).
- [x] Every Lane A/B/C/D source checked — hit, null, or structural gap — with per-source JSON.
- [x] `PER-hubbell-charles.md` created; `_index.md` + External Source Records table written.
- [x] Discrepancy filed (DSC-2026-06-06-003) + tabulated items; registry updated.
- [x] Narrative dossier written (this document).
- [x] Handoff doc lists every gated/missing item.

**Charles sweep: complete.** The engine disambiguated him from three same-regiment namesakes, tied his company to Henry's through Captain Rich, recovered the truest fates of his comrades, and named honestly the one thing it could not find — the grave and the disease of the brother the war killed slowly. Both wait behind the pension handoff.
