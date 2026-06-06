# Phase 3 — What We Still Don't Know: A Per-Brother Gap Analysis & Untapped-Record Map

> **2026-06-06 · repository-only working analysis (NOT for the public site).** A fresh analytical pass that revisits each brother's completed sweep and asks the inverse question of the dossiers: not "what did we confirm?" but **"what do we still not know, how do we know we don't know it, and exactly which record would tell us?"** This is the deliberate companion to the four dossiers and the methodology paper. It foregrounds the dimension that first motivated it — the *relationships* each brother named — because each man's letters list people whose own records could deepen his story.
>
> Every gap below is tied to (a) a gap *type* (the method for identifying it), and (b) a cited source that would fill it. Source artifacts live in `03-data/external-sources/per-person/PER-hubbell-<name>/` and the per-sweep handoff docs `tasks/PHASE-3-SWEEP-{1,2,3,4}-HANDOFF.md`.

---

## A. Methodology: how we know what we don't know

A finished sweep has a **negative space** — the shape of what it could not establish — and that shape is informative, not random. We classify every unknown into one of six types, because the *type* points to the *source*:

| # | Gap type | How it is identified during a sweep | What it implies |
|---|----------|-------------------------------------|-----------------|
| **G1** | **Behind-the-wall record** | A retrieval agent hits HTTP 403 / CAPTCHA / login / paywall on a record we have positive reason to believe exists | A *bounded* handoff: we know the record, the collection, often the URL — only authentication is missing |
| **G2** | **Structural coverage gap** | The medium itself isn't digitized (a paper's run starts too late; county records postdate the event) | The record may exist only on **microfilm/in an archive**; NOT a meaningful absence |
| **G3** | **Unverified family claim** | A fact in the letters/genealogy has no corresponding *field* in any record we checked (rosters don't record duty assignments, illnesses, etc.) | Needs a record *type* that carries that field — usually a pension/medical/CSR file |
| **G4** | **Soft field / record conflict** | Two sources disagree on a vital fact (age, date), and neither is dispositive | Resolvable by a *third* independent source (census, pension) |
| **G5** | **Relational dark matter** | A named associate was *confirmed to exist* (Lane D) but their own records — and what those records say *about our subject* — were not pulled | The single largest untapped vein (see §B) |
| **G6** | **Derivative-only corroboration** | Identity/fact rests on one primary + transcriptions of it, with no genuinely independent second witness | Wants one independent source to lift confidence |

Two cross-cutting method notes:
- **A null is not automatically a gap.** Henry's absence from the cemetery roll was *evidence* (body never recovered), not a gap. Charles's missing 1875 death record *is* a gap (G2). The discipline of distinguishing them is what keeps this honest.
- **The "filter, never a source" rule means every gap is stated as a known-unknown, never papered over with a plausible guess.** What follows is the inventory of those known-unknowns.

---

## B. The relationship dimension (the motivating idea), generalized

The original prompt — reacting to Henry — was that *because he named so many people, existing records could paint a clearer picture of his history and relationships.* Lane D executed the **first order** of this: confirm that each named comrade was real and in the regiment, and recover their fates. But that opens a much larger **second order** we have not pulled — the relational dark matter (G5):

1. **Pension files contain comrade depositions.** This is the key untapped fact. To prove a death, a disability, or a dependency, the Pension Bureau collected **sworn affidavits from comrades who served alongside the soldier.** That means:
   - Henry's mother's pension file (`Mo C 58119`) very likely contains **eyewitness statements from the Company D men we already identified** (e.g., those who saw him fall at Antietam) — the closest thing to a first-person account of his death.
   - Alexander's, Charles's, and (a mother's claim for) James's files would similarly contain affidavits from the exact comrades Lane D named — Luther, Howes, Peltier, Douglass, Sweeney.
   - **The company circle is therefore the witness list for the pension files**, and the pension files are where those relationships are documented in the subjects' own world. Pulling them turns "X and Y served together" into "Y swore an oath about X."
2. **Each named comrade has his own record trail** (roster line — already pulled; plus CSR, pension, FindAGrave, descendants). Following even a few would reconstruct the *post-war* social network: who corresponded, who attended reunions/GAR posts together, who the family stayed close to.
3. **Second-order family links.** The letters name patrons and kin (Mr. Wheeler, the tutor Everest, the Champlain church that raised the memorial). These tie the brothers into a *town* network the records could map (church rolls, town histories, the Clinton County Historical Association).

This second order is large, high-value, and almost entirely behind G1/G5 walls. It is the main answer to "what else might we not know."

---

## C. Per-brother gap inventory

Each brother: a one-line state-of-knowledge, then the specific unknowns by type, each with the source that would fill it.

### C.1 Henry (34th NY, Co. D — KIA Antietam) — `confirmed`
**Known:** identity, enlistment (May 22 1861, age 23), KIA Sept 17 1862, body never recovered, ~17-man Company D circle. Dossier: `PHASE-3A-HENRY-DOSSIER.md`.

| Gap | Type | What's unknown | Source that fills it |
|---|---|---|---|
| Mother's first name | G1 | Frances's given name is in the family genealogy but not yet tied via the pension | NARA pension `Mo C 58119` (NATF-85) |
| **Eyewitness account of his death** | **G5** | Who saw Henry fall in the West Woods; the missing→killed transition | **Pension file comrade depositions** — cross-list against the Co. D men in `letter-associates-crossref.json` |
| Physical description | G1 | height/complexion/eyes/occupation | Compiled Service Record descriptive roll (FamilySearch/Fold3) |
| Hometown death notice | G2 | A Clinton Co. notice — the Plattsburgh **Sentinel** is undigitized for 1862 | Sentinel microfilm; Plattsburgh Republican page images |
| Exact birth date | G4 | Age 23 in 1861 → b. c.1837–38; exact date open | 1850/1860 census (Champlain household) |
| NY Herald 1862-09-25 page image | G1 | OCR-garbled "missing" entry; needs human read | LOC page-image inspection (link in Henry handoff) |

### C.2 Alexander (60th NY, Co. H — survivor, d. 1894 Iowa) — `confirmed`
**Known:** identity (unique Hubbell), corporal→sergeant→veteran, **wounded Lookout Mountain** (Eddy), d. Dec 7 1894 Fonda IA (two witnesses), 11-man Company H circle. Dossier: `PHASE-3A-ALEXANDER-DOSSIER.md`.

| Gap | Type | What's unknown | Source that fills it |
|---|---|---|---|
| **Color-bearer & ambulance-corps roles** | **G3** | Cherished in the letters; rosters don't record duty assignments | NYS Historic Newspapers (a 60th-NY honor mention); pension/CSR |
| Nature/severity of the Lookout Mtn wound | G3 | Eddy's wound column was OCR-misaligned | Invalid pension medical affidavits; CSR |
| Death date to `definite` | G1/G4 | Stone + IAGenWeb agree on 1894; widow-filing date would clinch | Widow's pension filing date (Lois Wood Hubbell) |
| Post-war Iowa public life | G5 | "Held many township offices" (family) — which? | 1870/1880/1895 Iowa census; county history; GAR post name |
| **The comrades' post-war network** | **G5** | Luther, Howes, Rider survived — did the circle stay connected? | Their pensions/FindAGrave; GAR post rosters |

### C.3 Charles (153rd NY, Co. I — d. 1875 service disease) — `confirmed` (by disambiguation)
**Known:** identity (disambiguated from 3 same-regiment Hubbells), corporal, mustered out Oct 2 1865, HQ/commissary clerk, "newspaper correspondent," d. Mar 21 1875 (Glenwood stone), 16-of-19 circle incl. Capt. Rich cross-link. Dossier: `PHASE-3A-CHARLES-DOSSIER.md`.

| Gap | Type | What's unknown | Source that fills it |
|---|---|---|---|
| **The disease that killed him** | **G3** | Central family claim ("died of war disease"); no record field yet | **Invalid pension affidavits** (names the disease + service onset) — the single highest-value Charles pull |
| 1875 grave / burial place | G2 | Pocahontas Co. death records begin 1880; not in free sources | Pension filing; 1880-census absence; Clinton Co. NY records if returned east |
| Birth year to `definite` | G4 | Roster (~1837) + stone (AE 37 → ~1838) vs genealogy (1840) | 1850/1860 census |
| **His own published dispatches** | **G3/G5** | He was a "newspaper correspondent" — signed 153rd letters may exist | NYS Historic Newspapers (Plattsburgh/Fonda papers) — a first-person published voice |
| 1870 Iowa residence | G1 | Confirms the migration with Alexander | 1870 U.S. Census, Dover Twp |
| Independent regimental witness | G6 | No published 153rd history exists (only Enders ms.) | Enders manuscript, NYSL — would be the independent narrative the 153rd brothers lack |

### C.4 James (153rd NY, Co. I — West Point cadet, d. 1865) — `confirmed`
**Known:** identity, **West Point cadet 1862** (present, not graduate; cross-bound via Michie & French), wounded Cedar Creek, d. Albany Oct 12 1865, grave at Glenwood, two social worlds. Dossier: `PHASE-3A-JAMES-DOSSIER.md`.

| Gap | Type | What's unknown | Source that fills it |
|---|---|---|---|
| **Formal West Point admission terms** | **G1** | Present is proven; the paperwork (date, conditional/full, withdrawal) is not | NARA cadet application papers (RG 404/RG 94); USMA Official Register 1862–64 |
| Cause of the Albany death | G1/G2 | "While in the service, returning home" — cause unknown | Registers of Deaths of Volunteers (NARA/Ancestry 2123); Albany hospital register |
| Birth year | G4 | Roster age 22 (~1842) vs stone AE 27 (~1838) | 1850/1860 census |
| "Night blindness" | G3 | Family/prior detail; roster says only "wounded" | Pension/medical file |
| Pension (mother's claim) | G1/G5 | Likely a Frances-Hubbell dependent claim, perhaps linked to Henry's `Mo C 58119` | NARA T288; Ancestry 4654 |
| 1865 death notice | G2 | Plattsburgh Sentinel undigitized for 1865; Albany papers absent | Microfilm (NYS Library / NNYLN) |
| **The tutor & patron** (Everest, Mr. Wheeler) | G5 | The people who *made* the West Point chapter possible | Clinton Co. academy/church records; town history |

---

## D. Cross-brother gaps (only visible family-wide)

| Gap | Type | Note | Source |
|---|---|---|---|
| **One census pull resolves three birth years** | G4 | Henry, Charles, James all have soft age fields; the 1850/1860 Champlain household lists all the children's ages at once | 1850 + 1860 U.S. Census, Champlain |
| **The family pension cluster** | G5 | Henry's `Mo C 58119` (mother) + possible James (mother) + the brothers' invalid claims may interlink; comrade deponents recur across files | NARA pension files, pulled together |
| The Champlain church & memorial | G5 | The First Presbyterian Church Sabbath School raised the four-brothers memorial — the congregation knew the family | Church records; Clinton County Historical Association |
| Frances (mother) & sister Frances/Julia | G5 | The women's records (the widow/dependent pensions, the Iowa migration) are an entire un-swept branch (Phase 3b) | Census; pension; Iowa land/probate (Alexander took 1,120 acres on Charles's 1875 death) |

---

## E. Priority recommendation (if/when the walls come down)

Ranked by *information per pull*, emphasizing the relationship dimension:

1. **The pension files, pulled as a family cluster** (Henry's `Mo C 58119` first). Fills G1 facts (mother's name, descriptions, the disease, death cause) **and** G5 relationships (comrade depositions = the company circle speaking, under oath, about the brothers). This single action addresses the most gaps and is the truest realization of "existing records painting a clearer picture of his relationships."
2. **One pre-war census pull** (1850/1860 Champlain) — resolves three birth-year conflicts (G4) and confirms the household.
3. **NYS Historic Newspapers, worked properly** (the Cloudflare gate is now known to be bypassable via a scripted browser) — Charles's dispatches, Alexander's color-bearer honor, the brothers' death notices.
4. **NARA West Point cadet papers** — James's admission record.
5. **Following 2–3 confirmed comrades' own records** (e.g., Luther, Peltier, Douglass) — a pilot of second-order network reconstruction.

None of these changes any identity verdict; all of them deepen the *history and relationships* the letters opened and the rosters only sketched.

---

## F. Source key (where each cited record lives)

- **Per-person source records & nulls:** `03-data/external-sources/per-person/PER-hubbell-{henry,alexander,charles,james}/` (incl. each `letter-associates-crossref.json` = the company circles / witness lists).
- **Gated-collection specifics (URLs, collection numbers):** the per-sweep handoff docs `tasks/PHASE-3-SWEEP-{1,2,3,4}-HANDOFF.md`.
- **Verdicts & reasoning:** `03-data/external-sources/methodology/verification-log.jsonl` (33 entries).
- **Discrepancies (soft fields, conflicts):** `04-analysis/phase-3-discrepancies/INDEX.md` + `DSC-*.md`.
- **Method & source reliability:** `03-data/external-sources/methodology/{disambiguation-rubric.md, source-quality-notes.md, iteration-journal.md}`.
- **Narrative per brother:** `04-analysis/PHASE-3A-{HENRY,ALEXANDER,CHARLES,JAMES}-DOSSIER.md`.
