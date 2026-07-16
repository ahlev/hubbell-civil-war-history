# External Sources — Directory Map

Operational scope: see [`docs/PHASE-3-PLAN.md`](../../docs/PHASE-3-PLAN.md) at project root.
Source catalog (canonical list of databases and archives): [`civil-war-source-catalog.md`](civil-war-source-catalog.md)

---

## Layout

```
external-sources/
├── README.md                         ← this file
├── civil-war-source-catalog.md       ← canonical source list (50+ sources)
├── per-person/                       ← one folder per person being cross-referenced
│   └── PER-<id>/
│       ├── _index.md                 ← summary view + status checklist
│       ├── cwss.json                 ← NPS Civil War Soldiers & Sailors
│       ├── battle-units.json         ← NPS Battle Units (regiment history)
│       ├── findagrave.json
│       ├── suvcw.json
│       ├── ny-muster-rolls.json
│       ├── chronicling-america-candidates.json    ← all hits, pre-verification
│       ├── chronicling-america-verified.json      ← post-verification subset
│       ├── regimental-bibliography.json
│       └── comparative-letters.json
├── shared/                           ← data referenced by multiple persons
│   ├── acw-battle-data.csv           ← downloaded once
│   └── battle-details/               ← per-battle ABT fetches keyed by slug
└── methodology/
    ├── disambiguation-rubric.md      ← criteria for verdict assignment
    ├── verification-log.jsonl        ← append-only log of every Claude verdict
    ├── source-quality-notes.md       ← what we've learned about each source
    └── iteration-journal.md          ← weekly notes on what's working / not
```

Folders materialize as work fills them — do not pre-create empty dirs.

## Conventions

- **Negative results are recorded explicitly.** A `cwss.json` with `null_result: true` is as important as one with a verified hit.
- **External findings never modify letter or person source data.** They reference IDs and live alongside.
- **Per-source JSON uses the uniform schema** documented in `docs/PHASE-3-PLAN.md` §7.
- **Every Claude verdict is logged** to `methodology/verification-log.jsonl` with its full reasoning. Append-only.
