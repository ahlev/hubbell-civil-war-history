# Hubbell Civil War Ancestry — Visualization & Storytelling Ideas

A working checklist for exploring, testing, and evaluating data experiences built from the letter collection. Each concept leverages a different axis of the structured metadata schema. As we prototype each one, we'll note what works, what doesn't, and what to refine or retire.

---

## 1. Parallel Lives Timeline ^^^ Implemented v1 -- liking this, and refining it

**What it does:** Four horizontal swim lanes (one per brother) with every letter plotted by date. Circle size encodes historical significance; opacity encodes emotional intensity. Dashed vertical lines mark battles and key personal events. Click any dot to open a detail panel with the full transcription, editorial notes, people, and places.

**What makes it unique:** The simultaneity — four brothers writing from four locations, each unaware of the others' reality. The September 21, 1862 moment (James writing about Bible class while Henry is missing at Antietam) is visible as two dots on the same vertical axis in completely different emotional registers.

**Data fields used:** date, author, recipient, location, significance, emotion, event flags, transcription, editorial notes, people, places

**Status:** Built and functional (v2 with detail panel). Embedded in `hubbell-dashboard.html`.

**What works well:**
- [ ] *(to be evaluated)*

**What needs refinement:**
- [ ] *(to be evaluated)*

---

## 2. The Mother's War (Information Delay Visualization)

**What it does:** Centers the experience on Mrs. Hubbell — the one person who never writes but receives every letter. Reconstructs what she knew and when, showing the gap between events happening and her learning about them. A timeline with two layers: the event itself (battle, wound, hospitalization) and the letter that carried the news home, connected by a line whose length represents the information delay.

**What makes it unique:** Tells the home front story through the structure of communication itself. When Alexander writes "Henry is missing" on September 19 and Mother receives it perhaps a week later, the gap is the story. When James asks "have you heard from the boys?" on September 21, he doesn't know what she's about to learn. The visualization makes that dramatic irony tangible.

**Data fields used:** date, recipient (filtered to Mother), author, location, event flags, significance, notes (for news carried)

**Derived data needed:** estimated letter delivery time (typically 5-10 days in 1862), event dates vs. letter dates, "news graph" showing what information each letter carries about other family members

**Status:** Not started

**What works well:**
- [ ] *(to be evaluated)*

**What needs refinement:**
- [ ] *(to be evaluated)*

---

## 3. The Map That Moves (Animated Geographic Visualization) ^^^ Implemented v1 but confusing and doesn't "play"?

**What it does:** An animated map of the Eastern United States showing all four brothers' positions over time as colored dots that move with each letter. The viewer can scrub through the timeline or press play. Dots leave fading trails showing recent movement. Battle sites pulse when active. James is a fixed point at West Point; Charles appears at Plattsburgh in September 1862.

**What makes it unique:** Makes the geography of the war visceral. Henry moving down the Peninsula toward Richmond while Alexander moves through the Shenandoah. The dots nearly converge at Antietam. The physical distance between brothers — and between each brother and home in Champlain, NY — becomes a visible, emotional dimension.

**Data fields used:** date, author, location (with modern identification and coordinates), event flags

**Derived data needed:** Geocoded coordinates for every location mentioned. Interpolated positions between letters. Base map (Leaflet/Mapbox or static SVG of Eastern theater). Route approximations for known marches.

**Status:** Not started

**What works well:**
- [ ] *(to be evaluated)*

**What needs refinement:**
- [ ] *(to be evaluated)*

---

## 4. Emotional Arcs (Sentiment Over Time) ^^^ Implemented v1 but not compelling

**What it does:** Line chart with one line per brother showing emotional intensity over time. Key events (battles, illnesses, deaths, promotions) appear as annotated markers on the line, showing what drives each brother's emotional state up or down. The contrast between brothers tells the story: Henry's decline from eager volunteer to "tempted to desert"; Alexander's arc from idealist to hospitalized; James's steady enthusiasm; Charles's level-headed calm.

**What makes it unique:** Turns qualitative editorial judgment (our emotion ratings) into a legible character arc. The divergence between brothers is the narrative — same war, same family, completely different psychological experiences.

**Data fields used:** date, author, emotion (mapped to numeric: extreme=4, high=3, moderate=2, low=1), event flags, notes

**Possible enhancements:** Layer in letter frequency as a secondary signal (more letters = more communicative, fewer = possibly under stress or in transit). Color-code the line segments by what's driving the emotion (battle vs. illness vs. homesickness).

**Status:** Not started

**What works well:**
- [ ] *(to be evaluated)*

**What needs refinement:**
- [ ] *(to be evaluated)*

---

## 5. The Money Story (Financial Flow Visualization) ^^^ Implemented v1 and interesting, but not sure it holds up well to scrutiny? 

**What it does:** A flow/Sankey diagram or annotated timeline showing money moving between family members, the army, and the war economy. Every financial reference we've tagged — pay, money sent home, expenses, Sutler prices, bounties, requests for money — becomes a node or flow line. Contextual callouts explain the human story behind each transaction.

**What makes it unique:** The economic dimension of Civil War soldiering is rarely visualized. Alexander's six-month expenses totaling $9.90. Henry calculating his $100 bounty against the cost of desertion. Alexander asking his mother for $5 from a hospital bed while $52 in back pay is owed. The numbers are small but the stakes are enormous.

**Data fields used:** financial references (amount, direction, context), date, author

**Derived data needed:** Standardized financial data extracted from each letter. Inflation-adjusted values (1862 → modern). Categorization (pay, remittance home, expenses, Sutler purchases, bounty calculations).

**Status:** Not started

**What works well:**
- [ ] *(to be evaluated)*

**What needs refinement:**
- [ ] *(to be evaluated)*

---

## 6. The Health Ledger (Medical Tracking Over Time) ^^^ Implemented v1, and it's interesting, but health mentions may be too soft in some instances? Review if these are all legitimate claims / health events / valid context for storytelling and accuracy based on the available data

**What it does:** A status board or health timeline tracking each brother's physical condition over time, drawn from illness flags, wound reports, and medical references in the letters. Visual encoding shows health status (healthy / declining / sick / hospitalized / wounded) at each data point, alongside environmental factors (marching distance, combat exposure, season/weather).

**What makes it unique:** Disease killed far more Civil War soldiers than bullets. Henry's diarrhea starts in June 1862 and never relents. Alexander is "the hardiest man in the company" in July and hospitalized by September. The slow erosion of health — and the army's medical infrastructure (or lack thereof) — becomes visible.

**Data fields used:** date, author, illness flag, wound flag, medical references from notes, location (climate/season inference)

**Derived data needed:** Health status classification for each letter (inferred from text). Timeline of medical personnel mentioned (Sherman → Congress, Walker takes over, new doctor from NY).

**Status:** Not started

**What works well:**
- [ ] *(to be evaluated)*

**What needs refinement:**
- [ ] *(to be evaluated)*

---

## 7. The People Web (Relationship Network) ^^^ Implemented v1. Interesting but needs more transparency into who each referenced person is, who mentioned them and how, their significance and major events and dates, etc.

**What it does:** An interactive network graph showing every person mentioned across the collection, connected to the letters they appear in and to each other when co-mentioned. The Hubbell family at the center; comrades, officers, neighbors, and civilians radiating outward. Click any person node to see all their mentions and the context of each.

**What makes it unique:** Reveals the social fabric of the regiment and the community. Some figures appear once (Orderly Dickinson buying bread). Others recur across dozens of letters (Luther, Capt. Reich, Albert Cook). The network shows who mattered to whom, and when relationships formed, intensified, or went silent.

**Data fields used:** people mentioned (name, role), letter ID, date, author

**Derived data needed:** Entity resolution (Capt. Rich = Capt. Reich? different spellings). Person classification (family / military / civilian). Co-occurrence matrix.

**Status:** Not started

**What works well:**
- [ ] *(to be evaluated)*

**What needs refinement:**
- [ ] *(to be evaluated)*

---

## 8. "What They Didn't Know" (Historical Irony Overlay) ^^^ Implemented v1. Interesting but needs more emphasis on the logical output to clearly convey the main theme of "what they didn't know", and to be framed more accurately around the fog of war and communication delays

**What it does:** For any letter, a side panel or overlay showing what was actually happening historically that the writer didn't know. Alexander writing about Richmond's capture on July 1 while Henry is in the Seven Days retreat. James asking about Henry four days after Antietam. This creates a split-screen between the private and the historical, between the letter's world and the archive's world.

**What makes it unique:** This is the dramatic irony engine. Primary sources are electrifying precisely because the writers don't know what we know. The visualization makes that gap legible and navigable — a "what you know vs. what they knew" experience.

**Data fields used:** date, author, location, notes, transcription

**Derived data needed:** Historical event database for the Eastern theater (date, location, significance, outcome). Cross-matching algorithm: for each letter, find events within ±14 days and ±100 miles that the author shows no awareness of.

**Status:** Not started

**What works well:**
- [ ] *(to be evaluated)*

**What needs refinement:**
- [ ] *(to be evaluated)*

---

## Design Principles (Consistent Across All Visualizations)

**Color system:**
- Henry: `#2D5F8A` (steel blue)
- Alexander: `#B8860B` (amber)
- James: `#4A7C59` (sage green)
- Charles: `#8B3A3A` (burgundy)
- Battles: `#C44E52` (muted red)
- Key events: `#B8860B` (gold)
- Background: `#FAF8F5` (warm off-white)
- Cards: `#FFFFFF`
- Text: `#2C2C2C` / `#6B6B6B` / `#9B9B9B` (three-tier hierarchy)

**Typography:**
- Headings: Playfair Display (serif, period-appropriate gravitas)
- Body/UI: Inter (clean, modern readability)
- Transcriptions: Source Serif 4 (readable serif for long-form letter text)

**Interaction patterns:**
- Hover for preview, click for detail
- Smooth panel transitions (no jarring pops)
- Keyboard navigation where applicable
- Consistent tooltip styling

---

## Evaluation Criteria

As we test each visualization, consider:

1. **Clarity** — Does it communicate its core insight without explanation?
2. **Surprise** — Does it reveal something you didn't already know from reading the letters?
3. **Emotion** — Does it make the human story more felt, not just more known?
4. **Navigability** — Can you explore freely without getting lost?
5. **Credibility** — Does it feel trustworthy, grounded in real data, not gimmicky?
6. **Interconnection** — Does it make you want to look at the letters differently?
7. **Scalability** — Will it still work well when we have 250+ letters instead of 116?
