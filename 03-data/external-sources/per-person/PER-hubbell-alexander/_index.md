# Alexander F. Hubbell — External Source Index

**Person:** `PER-hubbell-alexander` · Sgt., 60th NY Vol. Infantry, Co. H · wounded Lookout Mountain · veteran reenlistment · **survived**, mustered out July 17 1865 · d. Fonda, Iowa (1894)
**Last updated:** 2026-06-06 (Sweep 2.0 — Alexander)
**Identity status:** ✅ **CONFIRMED** (`external · n/a · definite`) — official NY AG roster (one Hubbell in the regiment) + independent Eddy (1864) regimental history naming him in the Co. H roll AND the Lookout Mountain wounded list.

---

## Source checklist

| Source | Checked | Result | Verdict | File |
|--------|:------:|--------|---------|------|
| NY AG Roster (DMNA, 60th NY) | ✅ | **HIT** — full service line, unique Hubbell | `confirmed` | `ny-ag-roster.json` |
| Regimental history (Eddy 1864) | ✅ | **HIT** — Co. H roll + Lookout Mtn wounded list | `confirmed` | `regimental-bibliography.json` |
| Phisterer / NYSMM sketch | ✅ | **HIT** — Co. H = Champlain; muster-out July 17 1865 | `confirmed` (unit) | `regimental-bibliography.json` |
| CWSAC / ABT battle facts | ✅ | **HIT** — Lookout Mtn (Chattanooga TN024), Gettysburg PA002 | `confirmed` (facts) | `battle-units.json`, `../../shared/battle-details/lookout-mountain.json` |
| Letter-associates cross-ref | ✅ | **HIT** — 11 Co. H comrades confirmed; ~25 honest nulls | `confirmed` | `letter-associates-crossref.json` |
| Iowa post-war (Pocahontas CW DB) | ✅ | **HIT** — DOD 7 Dec 1894; GAR star; Cedar twp. Fonda | `likely` (death date) | `iowa-postwar-records.json` |
| FindAGrave | ⚠️ | INACCESSIBLE (403) → handoff (cemetery confirmed) | — | `findagrave.json` |
| Iowa WPA grave record | ⚠️ | Hubbell entry EXISTS; detail page 403 → handoff | — | `iowa-postwar-records.json` |
| Post-war census (1870–1900) | ⛔ | login-gated → handoff (1900 = absence test) | — | `iowa-postwar-records.json` |
| Pension index (#710.072 / #658.842) | ⛔ | login-gated → handoff (widow filing date = death-date proof) | — | `pension.json` |
| Chronicling America | ✅ | NULL (NY = wrong-unit Hubbells; IA = F. M. Hubbell namesake) | `rejected`/null | `chronicling-america.json` |
| NYS Historic Newspapers | ⚠️ | INACCESSIBLE (Cloudflare) → handoff (color-bearer proof) | — | `nys-historic-newspapers.json` |

## Verified findings (new vs. the letters)
- **Unique Hubbell in the 60th NY** — identity needs no disambiguation.
- **Lookout Mountain wound INDEPENDENTLY confirmed** — Eddy names "Sergeant A. F. Hubbell, Co. H" in the casualty list (the family tradition, corroborated by a published source).
- **Veteran reenlistment Dec 14 1863** confirmed against the official roster.
- **Muster-out July 17 1865, Alexandria** (record; family said July 7 — discrepancy).
- **Sergeant promotion Oct 1 1862** (record; family said Oct 21 — discrepancy).
- **Death date resolved toward Dec 7 1894** (IAGenWeb Pocahontas CW DB + GAR star), against the family's alternative "Dec 7 1899."
- **Company circle recovered:** 11 Co. H comrades confirmed (Ransom, White, Fitch, Dickinson, Brockway, Luther, Howes, Rider, Lablue, Porter, J.E. White) + Col. Goodrich; fates recovered the letters never knew (White typhoid; Porter killed by cars; Lablue deserted).

## Discrepancies surfaced
- **DSC-2026-06-06-002** (notable, resolved) — death date 1894 vs 1899; external record + GAR star favor **Dec 7 1894**.
- Minor (tabulated): sergeant promotion Oct 1 (record) vs Oct 21 (family); muster-out July 17 (record, ×2 sources) vs July 7 (family).
- Open (not a discrepancy): color-bearer & ambulance-corps roles are in the letters/genealogy but NOT in roster/Eddy/Phisterer → newspaper/pension handoff.

## Open (handoff)
FindAGrave/WPA stone (death date) · post-war census (1900 absence test) · pension index #710.072/#658.842 (widow filing date) · NYS Historic Newspapers (color-bearer corroboration) · Fonda Times Dec 1894 obituary (microfilm). See `tasks/PHASE-3-SWEEP-2-HANDOFF.md`.
