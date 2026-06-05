"""Merge the Henry-pilot workflow output with the prep files into a reviewable
proposals file: old -> draft -> panel-refined final, plus the 4 expert-lens
critiques per letter. Flags rate-limited / errored finals as invalid. Writes
nothing to canonical data.

Usage: python scripts/merge-henry-proposals.py <workflow-output.json>
"""
import json
import os
import sys

PREP = "04-analysis/_henry-pilot"
OUT = "04-analysis/sigsummary-v2-henry-proposals.json"


def bad_final(s):
    if not s:
        return True
    s2 = s.strip()
    return s2.startswith("API Error") or "Rate limited" in s2 or len(s2) < 40


def main():
    wf_path = sys.argv[1]
    with open(wf_path, encoding="utf-8") as f:
        wf = json.load(f)
    res = {r["id"]: r for r in wf.get("result", {}).get("results", [])}

    index = json.load(open(os.path.join(PREP, "_index.json"), encoding="utf-8"))
    rows = []
    for item in index:
        lid = item["id"]
        prep = json.load(open(os.path.join(PREP, lid + ".json"), encoding="utf-8"))
        r = res.get(lid, {})
        v1 = r.get("v1")
        raw_final = r.get("final")
        final = None if bad_final(raw_final) else raw_final.strip()
        rows.append({
            "id": lid,
            "date": item["date"],
            "old": prep.get("currentSummary", ""),
            "draft": v1,
            "final": final,
            "finalRateLimited": bool(raw_final) and bad_final(raw_final) and not (raw_final or "").strip().startswith("API") is False,
            "chosen": final or v1,
            "critiques": r.get("critiques", []),
            "status": ("refined" if final else ("draft" if v1 else "MISSING")),
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
