"""Build/refresh the unified proposals for all 273 letters:
04-analysis/sigsummary-v2-all-proposals.json  with id/date/author/old/final.
Reads the _pilot context files for old summaries, then overlays enriched finals
from any number of lean-enrichment workflow output files (later files win).
Extracts the clean summary if an agent prefixed reasoning. Nothing canonical.

Usage: python scripts/build-all-proposals.py <lean-out1.json> [<lean-out2.json> ...]
"""
import glob
import json
import os
import re
import sys

PILOT = "04-analysis/_pilot"
OUT = "04-analysis/sigsummary-v2-all-proposals.json"


def clean(raw):
    if not raw:
        return None
    s = raw.strip()
    if s.startswith("API Error") or "Rate limited" in s or len(s) < 60:
        return None
    paras = [p.strip() for p in re.split(r"\n\s*\n", s) if p.strip()]
    for p in reversed(paras):
        low = p.lower()
        if "\n" in p:
            continue
        if low.startswith(("here", "note", "the summary", "final:", "i ", "the \"base",
                            "the base", "okay", "sure", "below")):
            continue
        if 120 <= len(p) <= 760:
            return p
    cands = [p for p in paras if "\n" not in p and 120 <= len(p) <= 760]
    return cands[-1] if cands else None


# old summaries + metadata from prep files
rows = {}
for fp in glob.glob(os.path.join(PILOT, "LTR-*.json")):
    r = json.load(open(fp, encoding="utf-8"))
    rows[r["id"]] = {
        "id": r["id"], "date": r.get("date", ""), "author": r.get("authorKey", ""),
        "old": r.get("currentSummary", ""), "final": None, "approved": False,
    }

# overlay enriched finals (later args win)
for path in sys.argv[1:]:
    out = json.load(open(path, encoding="utf-8"))
    for r in out.get("result", {}).get("results", []):
        c = clean(r.get("final"))
        if c and r["id"] in rows:
            rows[r["id"]]["final"] = c

ordered = sorted(rows.values(), key=lambda r: (r["date"], r["id"]))
json.dump(ordered, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=2)

done = [r for r in ordered if r["final"]]
need = [r for r in ordered if not r["final"]]
from collections import Counter
by_author = Counter(r["author"] for r in need)
ls = sorted(len(r["final"]) for r in done)
print(f"Total {len(ordered)} | enriched {len(done)} | remaining {len(need)}")
if ls:
    print(f"  final length: min {ls[0]}, median {ls[len(ls)//2]}, max {ls[-1]}")
print("  remaining by author:", dict(by_author))
print(f"Wrote {OUT}")
