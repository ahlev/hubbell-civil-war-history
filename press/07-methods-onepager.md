# Methods One-Pager — for technical, scholarly, and archivist audiences

**The rule:** *AI is a filter, never a source.* The model reads, sorts, proposes, and points; nothing enters the record without human verification against a document.

**Corpus:** 273 letters, 1861–1870, five writers (four soldier-brothers + their mother), Champlain NY. Source materials: complete 1947–49 typescripts (Gladys Sands Hubbell) + scans of surviving originals. Transcription: AI vision + human review of every letter; single line breaks collapsed (paper-width artifacts), paragraph breaks preserved.

**Three-layer data architecture** (each letter, ~dozens of fields):
1. **Source facts** — date, writer, recipient, location, transcription. Never modified by enrichment.
2. **Editorial judgment** — significance, emotional register, topical flags (battle, illness, money…), editorial summaries. Human-authored, marked as such.
3. **Computed analysis** — derived views (information lag, health arcs, network graphs). Recomputable from layers 1–2.

**Identity resolution:** 486 people and 353 places resolved via **curated alias tables — never fuzzy matching**. A name variant joins a person's record only when a human confirms it against context. (Documented rationale: fuzzy matching manufactures confident errors in exactly the places history is least forgiving.)

**Cross-referencing:** each brother verified against public archives (NYS muster rolls/AG registers, NPS Soldiers & Sailors, pension indexes, Chronicling America newspapers, cemetery records) via LLM-mediated search with human adjudication. Confidence model + disambiguation rubric documented. **33 adjudicated verdicts in the verification log.** Outcomes include: Henry's Antietam death confirmed in the state register; Alexander's Lookout Mountain wound independently corroborated; James's precise death date and place established (Albany, Oct 12, 1865) — correcting the family's own 160-year-old memory; a death-year conflict for Alexander resolved (1894). Seven discrepancies formally registered.

**Interface:** 9 interactive visualizations (timeline, animated campaign map, social network, health ledger, household economics, information-lag view, emotional arcs, topic flows) over a single structured dataset; unified letter reader with per-letter provenance.

**Preservation:** [in progress — data export + repository deposit + Internet Archive copy; see press kit plan D-items].

**Documentation:** methodology paper + two companion essays [links when published]. Discrepancy registry: `04-analysis/phase-3-discrepancies/` [public version pending].
