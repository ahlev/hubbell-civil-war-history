"""Merge the Henry-pilot workflow output with the prep files into a reviewable
proposals file: old -> draft -> panel-refined final, plus the 4 expert-lens
critiques per letter. Flags rate-limited / errored finals as invalid. Writes
nothing to canonical data.

Usage: python scripts/merge-henry-proposals.py <workflow-output.json>
"""
import json
import os
import re
import sys

PREP = "04-analysis/_henry-pilot"
OUT = "04-analysis/sigsummary-v2-henry-proposals.json"


def clean_final(raw):
    """Extract the actual summary from a refine output that may be prefixed with
    the agent's verification reasoning. The summary is the last prose paragraph."""
    if not raw:
        return None
    s = raw.strip()
    if s.startswith("API Error") or "Rate limited" in s:
        return None
    paras = [p.strip() for p in re.split(r"\n\s*\n", s) if p.strip()]
    bad_starts = ("- ", "* ", "•", "fact issues", "feedback", "suggested",
                  "verifying", "applying", "the only", "here ", "here's", "note:",
                  "i ", "i'", "1.", "2.", "minimal fix", "correction")
    for p in reversed(paras):
        low = p.lower()
        if low.startswith(bad_starts):
            continue
        if p.count("\n") > 1:           # multi-line block = reasoning, not a summary
            continue
        if 120 <= len(p) <= 700:
            return p
    cands = [p for p in paras if "\n" not in p and 120 <= len(p) <= 700]
    return cands[-1] if cands else (max(paras, key=len) if paras else None)


def load_results(path):
    with open(path, encoding="utf-8") as f:
        return {r["id"]: r for r in json.load(f).get("result", {}).get("results", [])}


def good_crits(crits):
    return crits and all(not (c.get("text") or "").startswith("API Error") for c in crits)


def main():
    # arg1 = enriched-finals source; arg2 (optional) = complete-critiques source
    res = load_results(sys.argv[1])
    crit_src = load_results(sys.argv[2]) if len(sys.argv) > 2 else res

    index = json.load(open(os.path.join(PREP, "_index.json"), encoding="utf-8"))
    rows = []
    for item in index:
        lid = item["id"]
        prep = json.load(open(os.path.join(PREP, lid + ".json"), encoding="utf-8"))
        r = res.get(lid, {})
        v1 = r.get("v1") or crit_src.get(lid, {}).get("v1")
        raw_final = r.get("final")
        final = clean_final(raw_final)
        # prefer the complete critiques (arg2) over any rate-limited ones in arg1
        crits = crit_src.get(lid, {}).get("critiques") or []
        if not good_crits(crits):
            crits = r.get("critiques") or crits
        rows.append({
            "id": lid,
            "date": item["date"],
            "old": prep.get("currentSummary", ""),
            "draft": v1,
            "final": final,
            "chosen": final or v1,
            "critiques": crits,
            "status": ("enriched" if final else ("draft" if v1 else "MISSING")),
            "approved": False,
        })

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False, indent=2)

    have_draft = [r for r in rows if r["draft"]]
    have_final = [r for r in rows if r["final"]]
    rate_limited = [r for r in rows if r["draft"] and not r["final"] and (res.get(r["id"], {}).get("final"))]
    def stats(xs):
        ls = sorted(len(x) for x in xs)
        return "n/a" if not ls else f"min {ls[0]}, median {ls[len(ls)//2]}, max {ls[-1]}"
    print(f"Total: {len(rows)} | drafts: {len(have_draft)} | valid finals: {len(have_final)} | finals lost to rate-limit/err: {len(rate_limited)}")
    print(f"  OLD len:   {stats([r['old'] for r in rows if r['old']])}")
    print(f"  DRAFT len: {stats([r['draft'] for r in have_draft])}")
    print(f"  FINAL len: {stats([r['final'] for r in have_final])}")
    crit_counts = [len(r['critiques']) for r in rows]
    print(f"  critiques per letter: min {min(crit_counts)}, max {max(crit_counts)}")
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
