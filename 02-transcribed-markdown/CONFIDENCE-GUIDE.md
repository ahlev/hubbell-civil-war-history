# Confidence Scoring Guide

Every factual data point in this collection carries up to three independent confidence dimensions. These are orthogonal — any combination is valid.

---

## Axis 1: Basis — "How do we know this?"

Where the information comes from.

| Code | Meaning | Example |
|------|---------|---------|
| `stated` | Explicitly written in the source document | Date line reads "March 12, 1863" |
| `inferred` | Deduced from content, context, or related documents | Letter describes snow and Christmas — inferred December |
| `external` | Not in this document; sourced from a public record or database | Regiment confirmed via NPS CWSS lookup |
| `estimated` | Best guess from partial evidence; needs verification | Approximate date range based on neighboring letters |
| `assigned` | Label created by transcriber, not present in original | Document title we gave an untitled clipping |

---

## Axis 2: Legibility — "How clearly could we read it?"

Physical readability of the source material at the point where this data appears.

| Code | Meaning | Example |
|------|---------|---------|
| `clear` | Fully legible, no ambiguity in reading | Crisp handwriting, clean print, undamaged |
| `partial` | Readable but some characters/words are ambiguous | "That's probably a 7 but could be a 1" |
| `damaged` | Physically torn, stained, faded, or obscured | Ink blot covers part of a name; fold crease through a date |
| `reconstructed` | Pieced together from fragments or context | Missing word filled in from surrounding sentence |
| `n/a` | Legibility doesn't apply (inferred or external data) | Data came from a database lookup, not the physical document |

---

## Axis 3: Source Certainty — "How sure was the writer?"

The author's own confidence in what they're reporting. This captures uncertainty *in the original voice* — distinct from our ability to read the document.

| Code | Meaning | Example |
|------|---------|---------|
| `definite` | Writer states this as fact, no hedging | "We arrived at Gettysburg on July 1st" |
| `uncertain` | Writer expresses doubt or approximation | "I believe it was Thursday" / "sometime last week" |
| `secondhand` | Writer is relaying what someone else told them | "John says the 5th Corps lost 200 men" |
| `rumor` | Writer flags this as unverified talk | "There is talk we may be moving south" |
| `contradicted` | Another source in our collection disagrees | Letter says battle was Tuesday; muster roll says Wednesday |
| `n/a` | Source certainty doesn't apply | Official records, printed material, or data we extracted |

---

## How to Record Confidence

Each data point uses a compact triple notation: `basis · legibility · source-certainty`

Examples:
- `stated · clear · definite` — Written plainly, easy to read, writer was sure. Highest confidence.
- `stated · partial · definite` — Writer was sure, but we can't quite read it. Check the scan.
- `stated · clear · uncertain` — We can read it perfectly, but the writer said "I think."
- `inferred · n/a · n/a` — We deduced this from context; legibility and writer certainty don't apply.
- `external · n/a · n/a` — Came from a database; our reading and the writer's certainty aren't factors.
- `stated · damaged · secondhand` — Writer was relaying someone else's account, and the page is torn.

---

## When to Use Each Axis

| Situation | Basis | Legibility | Source Certainty |
|-----------|-------|------------|-----------------|
| Reading a date from a clear letter | `stated` | `clear` | `definite` |
| Reading a smudged date from a letter | `stated` | `partial` or `damaged` | `definite` |
| Writer says "I think we're near Spotsylvania" | `stated` | [actual legibility] | `uncertain` |
| Writer says "Jim told me the Colonel was killed" | `stated` | [actual legibility] | `secondhand` |
| We figure the date from context clues | `inferred` | `n/a` | `n/a` |
| NPS database confirms the regiment | `external` | `n/a` | `n/a` |
| Half the page is missing; we guess the name | `estimated` | `damaged` | `n/a` |

---

## Shorthand for Tables

In the structured markdown files, use the triple notation in a single `Confidence` column:

```
| Field | Value | Confidence |
|-------|-------|------------|
| Date Written | March 12, 1863 | stated · clear · definite |
| Author Location | Near Fredericksburg | stated · clear · uncertain |
| Casualties | "200 men lost" | stated · partial · secondhand |
```

When only basis matters (e.g., for external lookups or simple facts), a single value is fine:

```
| Regiment | 27th CT Vol. Inf. | external |
```

---

## Why Three Axes?

These serve different downstream purposes:

- **Basis** tells the web app *what kind of evidence* supports a claim — useful for provenance displays and source linking
- **Legibility** tells a researcher *whether to go back to the original scan* — useful for quality control and crowdsourced correction
- **Source certainty** tells an analyst *how much weight to put on this data point* — critical for timeline accuracy, event verification, and narrative reliability
