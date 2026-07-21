# The Brain Engine: How 273 Civil War Letters Became a Living Dataset

*The architecture that turned a box of handwriting into something you can query, visualize, and cross-reference — and the design decisions that make it trustworthy.*

> Companion to [`PHASE-3-METHODOLOGY-BLOG.md`](./PHASE-3-METHODOLOGY-BLOG.md). That piece is about **connection** — binding the letters outward to the national archival record. This one is about **construction** — how the letters became structured data in the first place. The second can't exist without the first: there is nothing to cross-reference until the raw material has been given shape. Every number below is drawn from the project's own [`DATA-ARCHITECTURE.md`](../DATA-ARCHITECTURE.md) and the live data files.

## A letter is four things at once

Pick up a single Hubbell letter — say, one Henry wrote from a camp outside Washington in 1861 — and notice how many different *kinds* of thing it contains simultaneously. There is a **hard fact**: a date, a place, a name. There is a **soft fact**: a health complaint that might be understated for his mother's sake, a dollar figure buried in a run-on sentence, a town spelled the way it sounded. There is **interpretation**: what this letter *means*, written as it was three days before a battle the writer didn't know was coming. And there is an **absence**: what he couldn't say, didn't know, or chose to leave out.

No single database field can hold all four. The naïve move — the one most digital-humanities projects make — is to flatten them: dump everything into one record and tag it. The problem is that once you've flattened, you can never again tell whether a given data point is bedrock or opinion. Was that date *written by Henry*, or *corrected by a researcher*? Is "significant" something the letter says, or something someone decided? Flattening destroys exactly the distinction that makes historical data trustworthy.

The "brain engine" of this project is the set of architectural choices that refuse to flatten. Four moves, in order: **structure, derive, supplement, connect.**

## Structure: keep fact, judgment, and computation in separate rooms

The foundational decision is a **three-layer architecture**, and the layers are kept rigorously apart.

- **Layer 1 — Factual.** What the letter itself contains: `date`, `author`, `location`, the verbatim `transcription`, the people and places named. This layer is *permanent*. The letter says what it says.
- **Layer 2 — Editorial.** What the researcher judged: `significance`, `emotion`, a one-line `sigSummary`, multi-paragraph `editorial` analysis. This layer is *durable but revisable* — a letter first tagged "routine" can become "notable" once you learn what was about to happen. It changes slowly and on purpose.
- **Layer 3 — Computed.** What each visualization derives at the moment a page loads: a health status, an extracted dollar amount, a social-graph weight, a position on a map. This layer is *ephemeral*. Change the algorithm and every result updates at once, without touching a byte of source data.

The reason this matters is that the three layers have genuinely different lifespans and error profiles. A fact is wrong if it's mis-transcribed. A judgment is wrong if the analysis is weak. A computation is wrong if the algorithm is. Collapsing them hides which kind of error you're looking at. Keeping them separate means you can *always* trace a data point back to its origin — and that traceability is the whole game.

Reinforcing the layers is a second structural choice: **confidence is three-dimensional.** Instead of a single star rating, every core fact carries three independent axes — *basis* (how do we know this: stated, inferred, or external?), *legibility* (could we physically read it: clear, partial, or damaged?), and *source certainty* (how sure was the writer: definite, uncertain, secondhand, rumor?). These are orthogonal. "I think it was Thursday," written in flawless handwriting, is high-legibility and low-source-certainty — and a timeline that plots it needs to know the difference. One number would erase that. Three numbers preserve it, and feed it downstream: basis drives provenance displays, legibility drives quality control, source certainty drives how much analytical weight a point can bear.

## Derive: turn prose into fast, honest handles

Structure gives you somewhere to put things. The next move is pulling *queryable signal* out of dense 1860s prose without pretending to more precision than you have.

The workhorse here is a set of **fifteen boolean event flags** — `hasBattle`, `hasIllness`, `hasDeath`, `hasWound`, `hasPromotion`, and eleven more — each paired with a `flagDetails` string that explains, in a human sentence, *how* that flag is true for that letter. The two-tier design is deliberate: the boolean lets a visualization **filter fast** ("show me every letter touching illness"), and the detail string lets it **display meaningfully** once filtered. The flags are intentionally conservative — someone "feeling poorly" trips `hasIllness` even if they recover a paragraph later. The flag opens a door; the transcription and the detail supply the nuance.

There's an honest footnote built into this layer: of the fifteen flags, **only four are currently consumed by any visualization.** Eleven — promotion, capture, desertion, discharge, and more — are fully populated across all 273 letters but not yet surfaced anywhere. The architecture documents this as untapped opportunity rather than quietly pretending the data is all in use. That candor is itself part of the engine's design.

## Supplement: enrich the record — and reject most of what you find

A structured corpus is only as good as it is complete, and the first pass is never complete. The supplement step is where the dataset was systematically audited and filled — and it is the step that best shows the project's discipline, because *most proposed additions were thrown away.*

A metadata audit drove schema violations from **806 to zero** and temporal coverage from **83% to 100%**, so that every one of the 273 letters carries all fifteen event flags and a place in the war's chronology. Then a corpus-wide gap-fix pass scanned the collection and generated **2,072 candidate additions** — possible missing people, places, and flags. Crucially, roughly **80% were rejected** on review as false positives; only **427 verified additions across 172 files** survived. That ratio is the point. An enrichment process that accepts everything it proposes is a hallucination machine. One that rejects four out of five is doing the slow, skeptical work that keeps a dataset honest — the same "filter, never a source" discipline the cross-reference method applies to the outside world, turned inward on the corpus itself.

## Connect: curated identity, not fuzzy matching

The final move is what turns a pile of well-structured records into a *web* — and it rests on one hard rule: **identity is curated, never fuzzy.**

People in these letters are named inconsistently — "Alek," "Alex," "Alexander," "your brother," "the Captain." Resolving those to real, single people is done with hand-built alias tables (`PERSON_ALIASES` in the dashboard, `MERGE_MAP` in the social graph), not with string-similarity guessing. The distinction is decisive. Fuzzy matching would happily merge "Mrs. Brown" with "Mr. Brown," or split "Alek" from "Alexander," or decide that "the Captain" in two different letters is one man when it's two. The alias tables encode knowledge no algorithm can derive — that *this* "Captain" is Capt. Ransom and *that* one isn't — built letter by letter by someone who knows the family. The cost is manual maintenance; the payoff is **zero false merges**, which is the only acceptable error rate when a single bad merge would corrupt the social network, the health timeline, and the narrative all at once.

That curated identity feeds entity registries — a canonical roster that currently holds **486 distinct people and 353 places**. And those registries are what make the connective, runtime-computed Layer 3 possible: the People Web counts co-mentions across canonical names to build its graph; the Map geocodes locations against a place lookup; the dramatic-irony view cross-references each letter's date and place against an external battle database. None of it works without trustworthy identity underneath.

## Why the engine matters

The visible artifacts of this project — the timeline, the map, the social web, the novel, and the [cross-reference work](./PHASE-3-METHODOLOGY-BLOG.md) that binds the family to the national record — are all *downstream* of the architecture described here. They are powerful because the data beneath them is layered (so you always know fact from judgment), confidence-rated on three axes (so uncertainty survives into the visuals), honestly supplemented (so additions were earned, not invented), and connected through curated identity (so the network is real, not approximate).

A flat dataset would have produced flat visualizations — pretty, but unfalsifiable. This one was built so that every dot on every chart can be traced back to a letter a human can go read. That traceability is not a feature bolted on at the end. It is the engine. It is what made the whole project operational, and it is what makes it worth trusting.

---

*For how this structured corpus was then bound to the external historical record — the four soldier-brothers verified against the national archive — see the companion piece, [`PHASE-3-METHODOLOGY-BLOG.md`](./PHASE-3-METHODOLOGY-BLOG.md), and the full methodology paper, [`PHASE-3-METHODOLOGY-PAPER.md`](./PHASE-3-METHODOLOGY-PAPER.md). The complete schema reference lives in [`DATA-ARCHITECTURE.md`](../DATA-ARCHITECTURE.md).*
