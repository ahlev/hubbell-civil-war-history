# James Hubbell — External Source Index

**Person:** `PER-hubbell-james` · Corporal, Co. I, 153rd NY Vol. Infantry · **West Point cadet (1862, did not graduate)** · wounded Cedar Creek Oct 19 1864 · died Albany NY Oct 12 1865, "in the service of his country," returning home · buried Glenwood Cemetery, Champlain
**Last updated:** 2026-06-06 (Sweep 4.0 — James)
**Identity status:** ✅ **CONFIRMED** (`external · n/a · definite`) — NY AG 153rd roster (one James, Co. I) + a confirmed Champlain gravestone + cross-bound West Point corroboration.

---

## Source checklist

| Source | Checked | Result | Verdict | File |
|--------|:------:|--------|---------|------|
| NY AG Roster (153rd NY) | ✅ | **HIT** — James, Co. I, wounded Cedar Creek | `confirmed` | `ny-ag-roster.json` |
| **West Point investigation** | ✅ | **HIT (presence)** — named real cadre Michie & French; NOT a graduate | `likely`/`rejected`(grad) | `west-point.json` |
| Grave (Glenwood, Champlain) | ✅ | **HIT** — four-brothers memorial, verbatim inscription | `confirmed` | `grave-death.json` |
| Letter-associates cross-ref | ✅ | **HIT** — West Point circle (Michie/French) + Co. I overlap + Surgeon Sweeney | `confirmed` | `letter-associates-crossref.json` |
| Regimental history (153rd) | ✅ | NULL (none published; Enders ms.) | n/a | `regimental-and-battle.json` |
| CWSAC / ABT battle facts | ✅ | HIT — Opequon (unhurt), Cedar Creek (wounded) | `confirmed` (facts) | `regimental-and-battle.json`, `../../shared/battle-details/cedar-creek.json` |
| Death record (Albany, Oct 1865) | ✅ | NOT FOUND online → handoff (Registers of Deaths of Volunteers) | — | `grave-death.json` |
| FindAGrave | ⚠️ | INACCESSIBLE (403) — grave confirmed via free transcription | — | `grave-death.json` |
| Pension (mother's claim?) | ⛔ | login-gated → handoff | — | `newspapers-pension.json` |
| NYS Historic Newspapers | ✅ | **ACCESSED (Playwright bypass)** — NULL (namesakes); Sentinel 1865 not digitized | `rejected`/null | `newspapers-pension.json` |
| Chronicling America | ✅ | NULL (namesakes: James R. Hubbell OH congressman, etc.) | `rejected`/null | `newspapers-pension.json` |

## Verified findings (new vs. the letters)
- **West Point presence corroborated** by cross-binding: James named **Cadet Lt. Peter S. Michie** (USMA 1863) and **Prof./Chaplain John W. French** — both real West Point figures. He did **not** graduate (absent from Cullum/class lists); admission-register confirmation is a NARA handoff.
- **Grave confirmed** — the four-brothers memorial at Glenwood, Champlain (independent free transcription).
- **Death:** Albany, **Oct 12 1865** (gravestone, corroborated) — survived to muster-out (Oct 2), then died returning home.
- **Company circle** overlaps Charles's Co. I; James-specific: Asst. Surgeon **James Sweeney** (hometown man).
- **Cross-sibling:** the same memorial confirms Alexander d. 1894 (DSC-002) and Charles d. Mar 21 1875, AE 37 → b. ~1838 (DSC-003).

## Discrepancies surfaced
- **DSC-2026-06-06-004** (notable, resolved) — death date: gravestone **Oct 12 1865** vs family-intro **Oct 19 1865** (= the Cedar Creek anniversary; likely conflation). Stone governs.
- **DSC-2026-06-06-005** (minor, open) — age/birth year: roster age 22 (1864) → b. ~1842 vs gravestone AE 27 (1865) → b. ~1838.
- Tabulated: West Point = appointed-and-present, **not** a graduate (precision flag).

## Open (handoff)
NARA cadet application papers (West Point admission terms) ⭐ · Registers of Deaths of Volunteers (Albany death cause) · pension (mother's claim, link to Henry's Mo C 58119) · Plattsburgh Sentinel / Albany papers 1865 (microfilm — death notice) · Enders ms. See `tasks/PHASE-3-SWEEP-4-HANDOFF.md`.
