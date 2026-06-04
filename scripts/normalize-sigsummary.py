#!/usr/bin/env python
"""Normalize letter sigSummary fields toward clean, reader-facing editorial prose.

WHY (web-polish item #5): ~68 of 273 letters open their `sigSummary` with an
ALLCAPS research-note label — e.g. "CRITICAL SOURCE:", "GETTYSBURG —",
"MOTHER'S GRIEF —". These read as internal scaffolding, not reader prose, and
surface verbatim in the reader's executive summary, map info panels, and (post
Phase-6) press-kit screenshots. The style target is a person-centred one-line
claim, no caps-label header.

PROVENANCE / CARDINAL RULE — "Claude is a filter, never a source":
This script NEVER invents or alters facts. It only *removes* the leading
caps-label scaffolding and re-cases the first letter. The deeper voice rewrite
(per `04-analysis/sigsummary-style-guide.md`) is intentionally left to a human-
reviewed pass — this script's `proposals` output is the review surface, and
`--apply` only writes back what a human has approved. Every original is
preserved in the proposals file, and all changes are reversible via git.

USAGE:
  python scripts/normalize-sigsummary.py                 # generate proposals (no mutation)
  python scripts/normalize-sigsummary.py --apply         # apply approved proposals to canonical JSON
                                                          #   (run only AFTER reviewing/editing the proposals file)

The proposals file (04-analysis/sigsummary-proposals.json) is an array of:
  { "id", "prefix", "classification": "auto-clean"|"needs-review",
    "original", "proposed", "approved": false }
Review it, fix any `proposed` text, set `"approved": true` on the ones you want,
then run --apply. Only `approved: true` entries are written back.
"""

import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LETTERS = os.path.join(ROOT, "03-data", "all-letters.json")
PROPOSALS = os.path.join(ROOT, "04-analysis", "sigsummary-proposals.json")

# Leading "ALLCAPS LABEL <sep> " — the research-note header pattern. The label is
# 5+ chars of caps/space/punctuation; the separator is a colon or dash.
PREFIX_RE = re.compile(r"^\s*([A-Z][A-Z &'’.\-/()0-9]{4,}?)\s*(:|—|–|-)\s+")


def _looks_clean(text: str) -> bool:
    """Heuristic: the de-prefixed remainder reads as a complete prose sentence."""
    if len(text) < 40:
        return False
    if not re.match(r'^["“‘A-Z]', text):   # starts with a quote or capital
        return False
    if not re.search(r'[.!?]["”’]?\s*$', text):  # ends like a sentence
        return False
    # Numbered/parenthetical lists still read as notes, not prose.
    if re.match(r'^\(?\d[).]', text):
        return False
    return True


def _recase(text: str) -> str:
    if text and text[0].islower():
        return text[0].upper() + text[1:]
    return text


def generate():
    letters = json.load(open(LETTERS, encoding="utf-8"))
    proposals = []
    for l in letters:
        s = l.get("sigSummary", "") or ""
        m = PREFIX_RE.match(s)
        if not m:
            continue
        rest = _recase(s[m.end():].strip())
        clean = _looks_clean(rest)
        proposals.append({
            "id": l["id"],
            "prefix": m.group(1).strip(),
            "classification": "auto-clean" if clean else "needs-review",
            "original": s,
            "proposed": rest,
            "approved": False,
        })
    os.makedirs(os.path.dirname(PROPOSALS), exist_ok=True)
    json.dump({"count": len(proposals), "items": proposals}, open(PROPOSALS, "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    auto = sum(1 for p in proposals if p["classification"] == "auto-clean")
    print(f"Flagged {len(proposals)} sigSummary fields with a caps-label prefix.")
    print(f"  {auto} classified 'auto-clean' (de-prefix reads as clean prose)")
    print(f"  {len(proposals) - auto} classified 'needs-review' (bare quote / list / fragment)")
    print(f"Wrote proposals -> {os.path.relpath(PROPOSALS, ROOT)}")
    print("Review/edit that file, set approved:true on the ones you want, then run --apply.")


def apply():
    if not os.path.exists(PROPOSALS):
        sys.exit("No proposals file. Run without --apply first, then review it.")
    data = json.load(open(PROPOSALS, encoding="utf-8"))
    approved = {p["id"]: p["proposed"] for p in data["items"] if p.get("approved")}
    if not approved:
        sys.exit("No entries have \"approved\": true. Review the proposals file first.")
    letters = json.load(open(LETTERS, encoding="utf-8"))
    n = 0
    for l in letters:
        if l["id"] in approved and l.get("sigSummary") != approved[l["id"]]:
            l["sigSummary"] = approved[l["id"]]
            n += 1
    json.dump(letters, open(LETTERS, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"Applied {n} approved sigSummary rewrites to {os.path.relpath(LETTERS, ROOT)}.")
    print("NOTE: the source markdown (02-transcribed-markdown/letters/*.md) is NOT touched by this")
    print("script — sync those separately if you keep sigSummary there. Changes are reversible via git.")


if __name__ == "__main__":
    apply() if "--apply" in sys.argv else generate()
