"""Print a compact review sample from the Henry proposals: old -> draft ->
final, plus each lens's FACT ISSUES line, for a chosen set of letter ids.
"""
import json
import re
import sys

P = json.load(open("04-analysis/sigsummary-v2-henry-proposals.json", encoding="utf-8"))
by = {r["id"]: r for r in P}

ids = sys.argv[1:] or [r["id"] for r in P if r["final"]][:5]


def fact_line(text):
    m = re.search(r"FACT ISSUES:(.*?)(?:FEEDBACK:|$)", text, re.S | re.I)
    if not m:
        return ""
    s = " ".join(m.group(1).split())
    return s[:240]


for lid in ids:
    r = by.get(lid)
    if not r:
        continue
    print("=" * 78)
    print(f"{lid}  ({r['date']})   [{r['status']}]")
    print(f"\nOLD   ({len(r['old'])}): {r['old']}")
    print(f"\nDRAFT ({len(r['draft']) if r['draft'] else 0}): {r['draft']}")
    if r["final"]:
        print(f"\nFINAL ({len(r['final'])}): {r['final']}")
    print("\nPANEL fact-checks:")
    for c in r["critiques"]:
        fl = fact_line(c["text"])
        print(f"  - {c['lens']}: {fl}")
    print()
