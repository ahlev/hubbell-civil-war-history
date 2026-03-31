# Quality Assurance Protocol

Every transcribed letter and document must pass through this checklist before being considered complete. The goal is to catch errors at the foundation layer — before they propagate into person profiles, timelines, cross-references, and the web app.

---

## 1. Transcription Accuracy

### Text Fidelity
- [ ] **Compare transcription against scan line by line.** Don't paraphrase. Don't "clean up."
- [ ] **Preserve original spelling exactly** (the 1947-1949 transcriber already preserved the soldiers' original spelling; we preserve the transcription's)
- [ ] **Mark every ambiguity explicitly:** `[?]` for uncertain words, `[illegible]` for unreadable passages, `[torn]` for physical damage
- [ ] **Don't fill in gaps with guesses.** If a word is unclear, mark it and note the best-guess reading in the Notes section — not in the transcription body
- [ ] **Check for OCR artifacts** if working from digital text extraction rather than visual reading

### Common Transcription Traps
- Typewriter `l` vs `1` vs `I` — especially in dates and numbers
- Faded or struck-through text: record what's visible, flag the rest
- "Same sheet" / "Following in same letter" notations: these indicate multiple letters on one physical page — treat each as a separate document with its own ID
- P.S. and "Later" addenda: may be written hours or days after the main letter body — note timing if discernible

---

## 2. Date Verification

Every date in the collection must be checked against at least one of these tests:

### Internal Consistency
- [ ] **Does the date match the letter's sequential position?** (A letter dated June 19 shouldn't appear between two July letters)
- [ ] **Does the day-of-week match?** If the author says "Sunday" and gives a date, verify with a perpetual calendar
- [ ] **Do references to other letters align?** ("I wrote a day or two ago" — does a letter from 2 days prior exist?)
- [ ] **Do seasonal references match?** (mentions of snow, heat, harvest, holidays)

### External Verification
- [ ] **Cross-check any referenced historical event.** (Van Buren's death, specific battles, holidays, elections)
- [ ] **Cross-check regiment location against date.** (If Henry says he's in Washington on July 21, was the 34th NY in Washington on July 21?)
- [ ] **Flag any letter where the date seems inconsistent** with surrounding letters, stated events, or known history

### Date Confidence Classification
- **Verified**: Date confirmed by both internal and external evidence
- **Consistent**: Date not contradicted by any evidence, but not independently confirmed
- **Suspect**: Date contradicted by at least one piece of evidence (flag prominently, investigate)
- **Corrected**: Original date was wrong; correct date established with evidence (document the reasoning)

---

## 3. Attribution Verification

- [ ] **Author confirmed.** Is the letter actually by the person it's attributed to? Check: signature, handwriting consistency (for originals), salutation patterns, content consistency
- [ ] **Recipient confirmed.** "Dear Mother" is clear; "Dear Brother" could be Charles, James, or Alex — use content clues to disambiguate, and mark confidence accordingly
- [ ] **"Same sheet" letters split correctly.** When Henry writes to Mother and then Frances on the same sheet, these are separate letters with separate IDs, but linked by a shared source page

---

## 4. Inference Discipline

### Rules for Inferences
1. **State the evidence.** Every inference must cite what it's based on.
2. **Use the confidence system honestly.** Don't mark something `stated · clear · definite` if you deduced it.
3. **Separate "what the letter says" from "what we think it means."** The transcription is the letter. The Content Tags and Editorial Notes are our interpretation.
4. **Don't identify unnamed people without evidence.** "The Captain" is not necessarily Capt. Reich unless the letter says so or the regiment only had one captain.
5. **Don't assume geography.** "Charlotte" could be Charlotte, NY or Charlotte, VT or Charlotte, NC. Mark it `uncertain` until evidence resolves it.
6. **Don't assume battles.** "A hard battle today" on July 21, 1861 is very likely Bull Run — but note this as `inferred` from date and distance, not `stated`.

### Red Flags for Over-Inference
- Filling in regiment positions from regimental histories without noting the source is external
- Assuming emotional states beyond what the text says
- Connecting people across letters without explicit evidence ("Albert" in one letter may not be the same "Albert" in another)
- Treating the introduction letter's claims as absolute (Fred Jr. was writing from family memory in 1996; his dates and details should still be verified)

---

## 5. Historical Context Verification

For every letter, verify against external sources:

- [ ] **Regiment location.** Is where the letter says the soldier is consistent with where the regiment is known to have been?
- [ ] **Battle references.** Can battles mentioned (by name, by sound, by rumor) be matched to documented engagements?
- [ ] **Named officers.** Can commanding officers mentioned be confirmed in regimental records?
- [ ] **Named events.** Deaths of presidents, elections, holidays, weather events — verify dates independently.

### Verification Status Tags
Add to each letter's Cross-Reference Notes:

| Status | Meaning |
|--------|---------|
| `✓ verified` | Checked against external source and confirmed |
| `~ consistent` | Not contradicted, but not independently confirmed |
| `⚠ suspect` | Evidence suggests possible error — needs investigation |
| `✗ corrected` | Error found and corrected — original and correct values documented |
| `○ unchecked` | Not yet verified against external sources |

---

## 6. Provenance Chain Awareness

Every piece of text in this collection has passed through multiple hands:

1. **Soldier writes letter** (1861-1865) — original spelling, possible errors, possible uncertainty in their own claims
2. **Letters stored in trunk** — water damage, deterioration
3. **Mother of Fred Jr. transcribes** (1947-1949) — reading damaged originals, may introduce transcription errors, notes illegible passages
4. **Fred Jr. writes introduction** (1996) — working from family memory and the transcriptions
5. **Bruce Levitt scans** (2025) — digitization of the typewritten transcriptions
6. **Claude reads scans** (2026) — reading images of typewritten pages

Each link in this chain can introduce errors. Our confidence ratings should reflect which link we're assessing:
- **Legibility** reflects our ability to read the scan (link 5→6)
- **Source certainty** reflects the original writer's confidence (link 1)
- **Basis** reflects where the data comes from
- But we should also note when we suspect a **transcription-era error** (link 2→3) vs. an **original error** (link 1)

---

## 7. QA Checklist Per Letter

Apply before marking any letter file as complete:

```
□ Transcription compared against scan, word by word
□ Date verified (internal consistency + external check if possible)
□ Date verification status noted in Cross-Reference Notes
□ Author and recipient confirmed with evidence
□ All confidence ratings are honest (no upgrading to avoid uncertainty)
□ All inferences clearly labeled as inferences, not facts
□ Historical events referenced are verified against external sources
□ People mentioned are identified with appropriate confidence
□ Places are identified with appropriate confidence (no over-resolution)
□ "Open Questions" section captures genuine unknowns
□ No speculative claims in the transcription body
□ Editorial Notes clearly separated from factual content
```

---

## 8. Known Error Patterns to Watch

### Already Caught
| Error | Where | How Caught | Lesson |
|-------|-------|-----------|--------|
| James letter misdated 1861 → actually 1862 | `LTR-1861-08-06-001` | Van Buren death date (July 24, 1862) verified externally | Always cross-check referenced historical events against dates |
| Henry's first 2 letters misdated June → actually July | `LTR-1861-06-06-001`, `LTR-1861-06-09-*` | 34th NY regimental history shows regiment arrived Washington July 5 (a Friday); Henry writes "arrived Friday eve"; June 5 was a Wednesday. Henry was in Albany through June 27. | Cross-check regiment location against letter dates. Verify day-of-week claims against perpetual calendar. Use the Corrected Chronology table in the June 6 letter as the master sequence. |
| Original editorial note claimed regiment arrived "early June" | `LTR-1861-06-06-001` (first draft) | Regimental history contradicted the claim | Never accept letter dates at face value for editorial notes — verify independently first |

### Patterns to Watch For
- **Year errors in January letters** — common for soldiers to write the old year by habit
- **Misdated letters filed in wrong PDF** — the collection is organized by year; letters may be in the wrong file
- **"Dear Brother" ambiguity** — could be Charles, James, or Alex. Must use content clues.
- **Place name variants** — 19th-century spelling differs from modern (e.g., "Mariland" for Maryland, "Senick Falls" for Seneca)
- **Rank/unit errors** — soldiers sometimes misstate their own unit designation early in service
- **Transcriber-era errors** — the 1947-1949 transcriber may have misread damaged originals; strikethrough text in typewritten pages (`xxxxx`) indicates her own corrections or illegible passages
