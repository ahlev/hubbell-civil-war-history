# Hubbell Civil War Ancestry Project Plan

## Vision

Transform a collection of family Civil War letters and documents into a richly interconnected knowledge system — linking personal correspondence to the broader historical record — and build this into an interactive web application others can use with their own family archives.

---

## Phase 1: Document Ingestion & Transcription

**Goal:** Convert all source materials into structured, metadata-rich markdown files.

**Process per document:**
1. Receive source file (scan, PDF, typed transcription)
2. Transcribe to markdown using letter or document template
3. Extract and tag all metadata: people, places, dates, units, events, health, objects
4. Assign document IDs following naming convention
5. Link to source file
6. Flag open questions and illegible sections

**Naming conventions:**
- Letters: `LTR-YYYY-MM-DD-001.md` (date of letter, sequential for same-day)
- Documents: `DOC-TYPE-YYYY-MM-DD-001.md` (TYPE = pension, muster, news, genealogy, etc.)
- People: `PER-lastname-firstname.md`

**Output:** `/02-transcribed-markdown/` populated with structured files

---

## Phase 2: Entity Extraction & Knowledge Graph

**Goal:** Build a connected web of people, places, events, and units from the transcribed letters.

**Tasks:**
1. Create person profiles for every individual mentioned across all letters
2. Build a master timeline of all dated events across the collection
3. Map all locations mentioned (with coordinates where possible)
4. Identify regiment/unit movements implied by the letters
5. Track recurring themes: health, morale, home front conditions, military operations

**Data structures:**
- `03-data/people/` — one file per person
- `03-data/events/` — master timeline + individual event records
- `03-data/places/` — gazetteer of all locations with modern identifications

**Output:** A queryable knowledge base of interconnected entities

---

## Phase 3: External Source Cross-Referencing

**Goal:** Enrich family records with verified historical data from public archives.

**Per soldier:**
1. Search NPS CWSS for service record confirmation
2. Pull regiment history and battle participation
3. Cross-reference letter dates with ACW Battle Data CSV (programmatic)
4. Search Chronicling America for newspaper mentions (name, regiment, hometown)
5. Check FindAGrave/SUVCW for burial records
6. Search pension records for post-war family details
7. Compare with other digitized letter collections for parallel accounts

**Per letter:**
1. Verify stated location against known regiment position on that date
2. Identify battles occurring within 30 days and 50 miles
3. Find newspaper accounts of events described
4. Flag discrepancies between letter claims and official record

**Output:** Cross-reference notes on each letter and person file; enriched timelines

---

## Phase 4: Analysis & Narrative Building

**Goal:** Synthesize structured data into coherent historical narratives.

**Deliverables:**
1. **Family timeline:** Complete chronological narrative from enlistment to post-war
2. **Battle reports:** What happened at each engagement the family participated in, told from their perspective plus the historical record
3. **Home front narrative:** The mother's experience — what she knew, when, and how
4. **Gap analysis:** What periods have no letters? What likely happened?
5. **Comparative analysis:** How does this family's experience compare to others in the same regiment/campaign?
6. **Verification report:** What the letters got right, what they got wrong, what we can't confirm

---

## Phase 5: Interactive Web Application

**Goal:** Build a browsable, searchable web app that brings the collection to life — and that others can use with their own family archives.

### Core Features
- **Letter browser:** Read transcribed letters with metadata sidebar
- **Interactive timeline:** Visual timeline with letters, battles, and events layered together
- **Map view:** Geographic visualization of movements, battles, and letter origins
- **Person profiles:** Biographical pages linking to all associated letters and records
- **Search:** Full-text search across all transcribed content and metadata
- **Cross-reference panel:** Click any entity (person, place, battle) to see all connections

### Advanced Features
- **"Upload your own" mode:** Let other users upload and process their own family letters
- **Auto-tagging suggestions:** ML-assisted metadata extraction for new uploads
- **External source integration:** Live lookups against CWSS, Chronicling America, etc.
- **Collaboration:** Allow family members to add notes, corrections, and context
- **Export:** Generate PDF reports, family trees, or GEDCOM files

### Technology Considerations
- Static site generator (e.g., Astro, Next.js) with markdown as data source
- JSON data files generated from markdown for fast querying
- Leaflet/Mapbox for geographic visualization
- D3.js or similar for timeline visualization
- Optional: database backend (SQLite or PostgreSQL) for multi-user features

---

## Folder Structure

```
Hubbell Civil War Ancestry/
├── 01-source-documents/          ← Original scans, PDFs, typed transcriptions
│   ├── letters/
│   ├── official-records/
│   ├── news-clippings/
│   └── genealogical/
├── 02-transcribed-markdown/      ← Structured markdown files (the core dataset)
│   ├── letters/
│   ├── other-documents/
│   ├── TEMPLATE-letter.md
│   └── TEMPLATE-document.md
├── 03-data/                      ← Extracted entities and cross-references
│   ├── people/
│   ├── events/
│   ├── places/
│   └── external-sources/
├── 04-analysis/                  ← Narratives, reports, visualizations
├── 05-web-app/                   ← Application code
└── PROJECT-PLAN.md               ← This file
```

---

## Current Status

- [x] Project folder structure created
- [x] Markdown templates designed (letter, document, person)
- [x] External source catalog compiled (50+ sources)
- [ ] **Awaiting document uploads to begin transcription**
- [ ] Entity extraction
- [ ] External cross-referencing
- [ ] Narrative synthesis
- [ ] Web application development
