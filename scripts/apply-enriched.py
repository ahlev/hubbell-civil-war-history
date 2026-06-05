"""Overlay enriched finals (from one or more lean-enrichment workflow outputs)
onto the proposals file. final = enriched where available, else the draft.
Reports how many enriched and lists the ids still needing enrichment.

Usage: python scripts/apply-enriched.py <lean-out1.json> [<lean-out2.json> ...]
"""
import json
import re
import sys

PROP = "04-analysis/sigsummary-v2-henry-proposals.json"


def clean(raw):
    if not raw:
        return None
    s = raw.strip()
    if s.startswith("API Error") or "Rate limited" in s or len(s) < 60:
        return None
    # if the agent reasoned first, take the last substantial prose paragraph
    paras = [p.strip() for p in re.split(r"\n\s*\n", s) if p.strip()]
    for p in reversed(paras):
        if "\n" not in p and 120 <= len(p) <= 700 and not p.lower().startswith(
                ("here", "note", "the summary", "final:", "i ")):
            return p
    return s if 120 <= len(s) <= 700 and "\n" not in s else (paras[-1] if paras else None)


enriched = {}
for path in sys.argv[1:]:
    out = json.load(open(path, encoding="utf-8"))
    for r in out.get("result", {}).get("results", []):
        c = clean(r.get("final"))
        if c:
            enriched[r["id"]] = c

P = json.load(open(PROP, encoding="utf-8"))
need = []
for r in P:
    e = enriched.get(r["id"])
    if e:
        r["final"] = e
        r["status"] = "enriched"
    else:
        r["final"] = r["draft"]
        r["status"] = r.get("status", "draft")
        need.append(r["id"])
    r["chosen"] = r["final"]

json.dump(P, open(PROP, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
ls = sorted(len(r["final"]) for r in P)
print(f"Enriched: {len(P)-len(need)}/{len(P)} | still on draft: {len(need)}")
print(f"Final length: min {ls[0]}, median {ls[len(ls)//2]}, max {ls[-1]}")
if need:
    print("Need enrichment:", " ".join(need))
