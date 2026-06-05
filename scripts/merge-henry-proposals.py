"""Merge the Henry-pilot workflow output with the prep files into a single
reviewable proposals file: old summary -> draft (v1) -> refined final (if any),
per letter. Reports coverage + length stats. Writes nothing to canonical data.

Usage: python scripts/merge-henry-proposals.py <workflow-output.json>
"""
import json
import os
import sys

PREP = "04-analysis/_henry-pilot"
OUT = "04-analysis/sigsummary-v2-henry-proposals.json"


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
        r = res.get(lid)
        v1 = r.get("v1") if r else None
        final = r.get("final") if r else None
        rows.append({
            "id": lid,
            "date": item["date"],
            "old": prep.get("currentSummary", ""),
            "draft": v1,
            "final": final,
            "chosen": final or v1,            # best available
            "changeNotes": (r or {}).get("changeNotes"),
            "status": ("refined" if final else ("draft" if v1 else "MISSING")),
            "approved": False,
        })

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False, indent=2)

    have_draft = [r for r in rows if r["draft"]]
    have_final = [r for r in rows if r["final"]]
    missing = [r["id"] for r in rows if not r["draft"]]
    def stats(xs):
        ls = sorted(len(x) for x in xs)
        if not ls:
            return "n/a"
        return f"min {ls[0]}, median {ls[len(ls)//2]}, max {ls[-1]}"
    print(f"Total Henry letters: {len(rows)}")
    print(f"  with draft: {len(have_draft)} | with refined final: {len(have_final)} | missing: {len(missing)}")
    if missing:
        print("  MISSING ids:", ", ".join(missing))
    print(f"  OLD summary length: {stats([r['old'] for r in rows if r['old']])}")
    print(f"  DRAFT length:       {stats([r['draft'] for r in have_draft])}")
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
