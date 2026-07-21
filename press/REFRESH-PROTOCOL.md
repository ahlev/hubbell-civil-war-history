# Outreach Refresh Protocol — the gate every record passes before formal outreach begins

**Created:** 2026-07-20 (per `tasks/faq-presskit-public-surface-PLAN.md` WI-5).
**Status:** STANDING PROTOCOL — not yet executed. Formal outreach has NOT started; nothing here authorizes sends.
**What this is:** the checklist every dossier, pitch draft, kit master, and tracker row must pass **when the user gives the formal outreach "go."** The engine was built 2026-07-07; the site and strategy have kept moving; this protocol closes that gap systematically instead of piecemeal.

## Why it exists (user, 2026-07-20)
The v2 dossiers and pitches are good enough to use — but they were written against a July-7 snapshot of the project. Before any send, every record must be re-anchored to: (1) context-adjusted timelines, (2) final details of the site, (3) strategic and tactical adjustments to the value proposition and experience. "Not necessarily big things — lots of little things."

---

## Pass 1 — Site facts (run once, produces the master fact sheet all records check against)
- [ ] **Corpus count is 272** everywhere (the 07-16 sweep fixed user-facing surfaces; internal kit masters still carry 273 — e.g. `06-faq.md`. Fix all `press/` masters).
- [ ] **No reference to the removed letter** (`LTR-1864-09-25-001`) survives in any dossier, pitch, angle, or kit file. Grep, don't trust.
- [ ] **Feature list is current**: everything shipped since 2026-07-07 — canonical bio stage view, map hybrid playback + camera, ledger push drawer, people-web rebuild (when Wave 3 lands), landing scene 1 + preview runway + teasers, `/faq`, "The Project" nav, per-page updates. Pitches that demo a surface must describe the surface as it exists at send time.
- [ ] **URLs**: production URL confirmed (custom-domain decision resolved or explicitly deferred); every deep link in every pitch resolves (letters via `reader.html?id=LTR-…`; bios via `who-they-were.html#<id>`; the old `brother-*.html` pages are redirect stubs — never cite them).
- [ ] **Contact email**: the dedicated project address (user creating; decided 2026-07-20) is live and present in every kit artifact — especially the downloadable ZIP/PDF, which freezes whatever address it ships with.
- [ ] **Methodology posture**: paper is internal, **available on request** (post `tasks/methodology-docs-fable-review-2026-07-20.md` edits, v1.1). No pitch may link a public methodology URL unless that decision changes.

## Pass 2 — Value-prop / strategy alignment (run once, then apply per record)
- [ ] **Retired angles stay retired — completely**: the asymmetry-of-register finding appears NOWHERE public or press-facing (user calls 2026-07-08 and 2026-07-20 — not as a data claim, not as a first-publication card, not even as a personal impression). Future experience-sections are teased only generically ("new ways to experience what they articulated, voiced, and shared"), never named or specified. Sweep pitches for any survival of the ONE first-publication card noted in `project_outreach_v2`.
- [ ] **Henry framing = KIA at Antietam** (not "missing then found") in every angle and pitch.
- [ ] **Hero-asset lineup current** (per `04-key-discoveries.md`): Antietam triptych · July 4 Culp's Hill letter · James date correction · five-generation stewardship. Confirm each pitch leads with the angle its target actually fits.
- [ ] **Positioning language current**: AI-enabled historian/archivist; "filter, never a source"; self-audit culture framed as standing practice (never incident language — user rule 2026-07-20); pre-launch work described as system-modeling learning.
- [ ] **Timelines re-anchored**: no "recently," "this spring," "just completed" that has drifted; project duration stated as of send date (repo since 2026-03-31).

## Pass 3 — Per-record verification (every dossier + pitch, at send-wave time)
For each of the ~130 dossiers (`press/dossiers/**`) and drafts (`press/outreach-drafts/**`), in wave order per `targets-v2/SHORTLIST.md`:
- [ ] **Contact re-verified against a live source** — email, role, outlet, byline recency. People move; emails die. Re-apply the cardinal rule: verified-and-cited, or flagged `INFERRED`/`UNVERIFIED`. A dossier whose contact can't be re-verified gets downgraded, not guessed.
- [ ] **Personalization hook still true** — their "recent piece" may be a year old at send time; refresh or replace the hook.
- [ ] **Pitch body**: apply Pass-1 facts + Pass-2 framing; deep links click-tested; the ask still matches the asset.
- [ ] **Dedupe** cross-vertical name collisions (known issue, D1).
- [ ] Log the refresh in the tracker row (see below) before any send.

## Pass 4 — Tracker v2 (first execution step of the formal go)
- [ ] Fix CSV quoting; add `wave`, `asset`, `ask`, `refreshed_on` columns; import targets-v2 finalists; dedupe.
- [ ] Rule: **no send without a `refreshed_on` date from Pass 3.**

## Explicitly out of scope for this protocol
Writing new dossiers · choosing send waves (that's `targets-v2/SHORTLIST.md` + user) · any actual sending. This file is the quality gate, not the campaign.
