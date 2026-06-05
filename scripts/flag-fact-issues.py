"""Scan the cached panel critiques and flag letters with REAL fact issues
(any lens whose FACT ISSUES section is not 'none'). Letters with no issues:
draft = final. Letters flagged: need a minimal correction.
"""
import json
import re

P = json.load(open("04-analysis/sigsummary-v2-henry-proposals.json", encoding="utf-8"))


def fact_section(text):
    m = re.search(r"FACT ISSUES:(.*?)(?:\n\s*FEEDBACK:|\n\s*SUGGESTED:|$)", text, re.S | re.I)
    return (m.group(1).strip() if m else "").strip()


def is_none(s):
    t = re.sub(r"[^a-z]", "", s.lower())
    return t in ("", "none", "noneeverything", "nonenull") or s.lower().startswith("none")


clean, flagged = [], []
for r in P:
    issues = []
    for c in r["critiques"]:
        fs = fact_section(c["text"])
        if fs and not is_none(fs):
            issues.append((c["lens"], " ".join(fs.split())))
    (flagged if issues else clean).append((r["id"], issues))

print(f"Letters with NO fact issues (draft = final): {len(clean)}")
print(f"Letters FLAGGED with fact issues: {len(flagged)}\n")
for lid, issues in flagged:
    print("=" * 76)
    print(lid)
    for lens, txt in issues:
        print(f"  [{lens}] {txt[:300]}")
