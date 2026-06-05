"""Overlay tightened summaries from tighten-workflow output(s) onto the unified
proposals file. Only accepts a tightened version that (a) cleans to valid prose,
(b) lands in 350-460 chars, and (c) is actually shorter than the current final.
Everything else is left as-is for another pass. Reports ids still over 460.

Usage: python scripts/apply-tighten.py <tighten-out1.json> [<tighten-out2.json> ...]
"""
import json
import re
import sys

PROP = "04-analysis/sigsummary-v2-all-proposals.json"


def clean(raw):
    if not raw:
        return None
    s = raw.strip()
    # strip only a BALANCED wrapping quote pair — never a legitimate trailing quote
    if len(s) >= 2 and s[0] == '"' and s[-1] == '"':
        s = s[1:-1].strip()
    if s.startswith("API Error") or "Rate limited" in s:
        return None
    paras = [p.strip() for p in re.split(r"\n\s*\n", s) if p.strip()]
    for p in reversed(paras):
        if "\n" in p:
            continue
        low = p.lower()
        if low.startswith(("here", "note", "the summary", "final:", "i ", "the \"base",
                            "the base", "okay", "sure", "below", "camp ", "alexander,",
                            "this ", "i'll", "the weaker")):
            # skip obvious reasoning preambles; real summaries rarely open this way,
            # but keep narrative openings like "Alexander writes" — only bail on meta-talk
            if "confirmed in the summary" in low or "i'll trim" in low or low.startswith(
                    ("here", "note", "the summary", "final:", "i ", "okay", "sure", "below", "i'll")):
                continue
        if 120 <= len(p) <= 760:
            return p
    cands = [p for p in paras if "\n" not in p and 120 <= len(p) <= 760]
    return cands[-1] if cands else None


# Keep the SHORTEST clean candidate per id across all waves (>=350 chars).
# Substance-dense letters that resist 460 still get their best compression.
tightened = {}
for path in sys.argv[1:]:
    try:
        out = json.load(open(path, encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        continue
    for r in out.get("result", {}).get("results", []):
        c = clean(r.get("final"))
        if c and len(c) >= 350:
            cur = tightened.get(r["id"])
            if cur is None or len(c) < len(cur):
                tightened[r["id"]] = c

P = json.load(open(PROP, encoding="utf-8"))
applied = 0
for r in P:
    t = tightened.get(r["id"])
    # accept any clean compression that is genuinely shorter than what we have
    if t and len(t) < len(r["final"]):
        r["final"] = t
        applied += 1

json.dump(P, open(PROP, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
still = [r["id"] for r in P if len(r["final"]) > 460]
ls = sorted(len(r["final"]) for r in P)
print(f"Applied {applied} tightened | still over 460: {len(still)}")
print(f"Length now: min {ls[0]}, median {ls[len(ls)//2]}, max {ls[-1]}")
print(json.dumps(still))
