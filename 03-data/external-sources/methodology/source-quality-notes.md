# Source-Quality Notes

What each source actually delivered in practice, its reliability grade, and its failure modes. Updated as we hit each source. Grades use the confidence model's `source-certainty` axis: `definite` / `secondhand` / `rumor`.

**First populated:** 2026-06-05 (Henry pilot, Sweep 1.0).

---

## Tier 1 — Definite (government-compiled primary)

### NY State Adjutant-General's Roster (DMNA / NY State Military Museum) — `definite`
- **What it gave us:** The single highest-value record of the whole sweep. One roster line filled three of Henry's data gaps (age 23, enlistment May 22 1861 at Champlain, muster-in June 15 1861) and confirmed rank/company/fate.
- **Access:** Direct PDF download works (`dmna.ny.gov/.../34th_Infantry_CW_Roster.pdf`). The web-fetch model choked on the binary; a subagent downloaded and extracted text with pdfplumber. **Lesson: roster PDFs need download+local-extract, not WebFetch summarization.**
- **Failure modes:** OCR artifacts ('Co.'→'Go.', stray digit ages elsewhere). The Hubbell line was clean. Always quote verbatim and flag OCR.
- **Reliability:** Highest. This is the canonical compiled roster from muster rolls. Make it the FIRST pull for any NY soldier.

### Antietam National Cemetery 1867 interment list (WHILBR) — `definite`
- **What it gave us:** A definitive NULL on the named roll (no Hubbell) — which is itself evidence corroborating "body never recovered."
- **Access:** Direct PDF; full-text searchable after extraction.
- **Failure modes:** Column misalignment in extraction prevents tying a name to a unit; ~38% of interments are unknowns (names absent by definition).

### American Battlefield Trust + CWSAC battle data — `definite`
- **What it gave us:** Clean Antietam facts (date, location, casualties). CWSAC values came from the GitHub CSV, not the readthedocs page (schema only).
- **Failure mode:** ABT renders some numbers via JS; the CSV is the programmatic source of truth.

---

## Tier 2 — Secondhand (published histories / derivative databases)

### Chapin, *A Brief History of the 34th N.Y.S.V.* (1903) — `secondhand` (high value)
- **What it gave us:** Independent published corroboration of the AG roster AND an explicit Antietam killed-list naming "Hubbell, Henry — D." The best corroborating witness of the sweep.
- **Access:** archive.org full text (djvu.txt) — search directly. **Lesson: archive.org djvu.txt is a goldmine and is fully fetchable.**
- **Reliability:** High for a published source; written by a veteran, decades post-war.

### Antietam on the Web (AOTW) — `secondhand` (derivative)
- **What it gave us:** Ready-made battle context (II Corps, Sedgwick, Suiter; 32 KIA) and a clean soldier profile (#8050).
- **Caveat:** Transcribed FROM the NY AG report — corroborates but is NOT independent. Do not double-count it as a separate confirmation.

### Phisterer, *New York in the War of the Rebellion* — `secondhand` (unit-level only)
- **What it gave us:** Best concise unit narrative + casualty totals; confirms Co. D = Champlain. Does NOT name individual soldiers.

---

## Tier 3 — Rumor / noisy (newspapers, OCR)

### Chronicling America (LOC) — `rumor` (for unverified hits)
- **Two hard lessons:**
  1. **The legacy JSON API is DEAD** (`chroniclingamerica.loc.gov` → 308→404). Use `https://www.loc.gov/collections/chronicling-america/?q=...&fa=location_state:new+york&dates=YYYY/YYYY&fo=json`. Per-page OCR comes from each item's `?fo=json` → `fulltext_service` (tile.loc.gov ALTO), not inline.
  2. **Coverage gap:** NO northern-NY / Clinton County papers for 1862 — NY-1862 is almost entirely NYC titles. A hometown casualty notice is NOT here. Route Clinton County searches to **NYS Historic Newspapers** instead.
- **Failure mode:** OCR splits/garbles surnames ('HenHubbell'); most "Hubbell" hits are civilians (Masonic, politics, classifieds) or other regiments. Verdicts must lean on C8 (OCR penalty) and corroboration.

---

## Inaccessible to automation (→ handoff, not failure)

- **NPS CWSS** — JS-only search form; no record retrievable via URL. Index-level only anyway.
- **FindAGrave** — HTTP 403 + CAPTCHA UI. Needs logged-in manual search.
- **SUVCW Graves DB** — CAPTCHA + POST form. Manual only.
- **FamilySearch indexed record collections** — login-gated. The likely home of a Compiled Service Record / muster card.

**General lesson:** the high-value, authoritative sources (NY AG roster, archive.org regimental histories, CWSAC CSV) are all freely fetchable; the *gated* sources (CWSS card, FindAGrave, SUVCW, FamilySearch records, NARA pension) are exactly the ones needing human/authenticated retrieval. The methodology gets ~80% of the way on free, fetchable primaries.
