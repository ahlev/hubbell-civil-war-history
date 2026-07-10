#!/usr/bin/env python
"""Extract the candidate diptych letters (same brother, same month, to a brother
vs to mother/sister) with FULL transcriptions, so excerpts can be chosen VERBATIM.
Writes tasks/_diptych-source-letters.txt (internal). Run: python scripts/_extract_diptych_letters.py"""
import json, os, re, sys
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
L = json.load(open(os.path.join(ROOT, "03-data", "all-letters.json"), encoding="utf-8"))

def rclass(r):
    r = (r or "").lower()
    if "mother" in r or "mrs. hubbell" in r: return "MOTHER"
    if "sister" in r or "fannie" in r or ("frances" in r): return "SISTER"
    if re.search(r"(charles|alexander|james|henry)\s+(f\.?\s+)?hubbell", r) or \
       (any(b in r for b in ["charles","alexander","james","henry"]) and "brother" in r): return "BROTHER"
    return "other"

HERO = [("henry","1862-04"),("henry","1862-02"),("alexander","1861-12"),
        ("charles","1864-10"),("alexander","1863-05"),("charles","1862-09")]

out = []
for author, ym in HERO:
    out.append("\n" + "#"*78)
    out.append(f"# {author.upper()}  {ym}")
    out.append("#"*78)
    rows = [x for x in L if x.get("author")==author and (x.get("date") or "").startswith(ym)]
    rows.sort(key=lambda x: (rclass(x.get("recipient")), x.get("date") or ""))
    for x in rows:
        cl = rclass(x.get("recipient"))
        if cl == "other": continue
        flags = [k.replace("has","") for k in x if k.startswith("has") and x.get(k)]
        out.append(f"\n----- [{cl}] {x['id']}  {x.get('date')}  -> {x.get('recipient')}  ({len((x.get('transcription') or '').split())} words)")
        out.append(f"      flags: {', '.join(flags)}   emotion: {x.get('emotion')}")
        out.append(f"      loc: {x.get('location')}   summary: {(x.get('sigSummary') or '')[:240]}")
        out.append("      TRANSCRIPTION:")
        out.append((x.get("transcription") or "(none)").strip())
OUT = os.path.join(ROOT, "tasks", "_diptych-source-letters.txt")
open(OUT, "w", encoding="utf-8").write("\n".join(out))
print("wrote", OUT, "-", len(out), "lines")
# quick manifest
for author, ym in HERO:
    rows = [x for x in L if x.get("author")==author and (x.get("date") or "").startswith(ym)]
    by = {}
    for x in rows:
        c = rclass(x.get("recipient"));  by[c] = by.get(c,0)+1
    print(f"  {author} {ym}: " + ", ".join(f"{k}×{v}" for k,v in sorted(by.items()) if k!='other'))
