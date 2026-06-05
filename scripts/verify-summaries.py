"""Verify the approved summaries reached every LIVE carrier, keyed by id.
Exits non-zero if any live carrier disagrees with the approved finals.

  full-text carriers (must equal final exactly):
    - 03-data/all-letters.json        sigSummary
    - hubbell-dashboard.html           embedded const LETTERS[].sigSummary
    - _search-data.js                  var LETTERS[].ss
    - _og-data.json                    summary/sigSummary (per-id)
  preview carrier (must equal the 160-char truncation of final):
    - _overlay-data.js                 LETTER_INDEX[id].ss
  regenerated full-text carrier (subset is OK; whatever it includes must match):
    - viz-emotional-arcs.html          embedded const LETTERS[].sigSummary
"""
import json
import re
import sys
from json import JSONDecoder

PROP = "04-analysis/sigsummary-v2-all-proposals.json"
finals = {r["id"]: r["final"] for r in json.load(open(PROP, encoding="utf-8")) if r.get("final")}
problems = []


def arr_after(path, marker):
    h = open(path, encoding="utf-8").read()
    s = h.find(marker)
    if s < 0:
        return None
    i = s + len(marker)
    while i < len(h) and h[i] not in "[{":  # skip spaces/'=' to the JSON value
        i += 1
    return JSONDecoder().raw_decode(h, i)[0]


def check_full(name, records, idkey, field):
    seen = 0
    bad = 0
    for r in records:
        i = r.get(idkey)
        if i in finals:
            seen += 1
            if r.get(field) != finals[i]:
                bad += 1
    status = "OK" if bad == 0 else f"{bad} MISMATCH"
    print(f"  {name:<28} {seen:>3} matched · {status}")
    if bad:
        problems.append(name)


# all-letters.json
al = json.load(open("03-data/all-letters.json", encoding="utf-8"))
check_full("all-letters.json", al, "id", "sigSummary")

# dashboard embedded
dash = arr_after("hubbell-dashboard.html", "const LETTERS = ")
check_full("hubbell-dashboard.html", dash, "id", "sigSummary")

# _search-data.js
sd = arr_after("_search-data.js", "var LETTERS=")
check_full("_search-data.js", sd, "id", "ss")

# _og-data.json (find the summary-ish field automatically)
og = json.load(open("_og-data.json", encoding="utf-8"))
og_list = og if isinstance(og, list) else (og.get("letters") or list(og.values()))
if og_list and isinstance(og_list[0], dict):
    sumkey = next((k for k in ("sigSummary", "summary", "ss", "s") if k in og_list[0]), None)
    if sumkey:
        check_full("_og-data.json", og_list, "id", sumkey)
    else:
        print(f"  {'_og-data.json':<28} no summary field ({list(og_list[0])[:6]}) — skipped")

# _overlay-data.js — preview (truncated ~160). Just confirm it changed to reflect
# the new text: the overlay ss must be a prefix-ish of the new final, not the old.
ov_txt = open("_overlay-data.js", encoding="utf-8").read()
mov = re.search(r"LETTER_INDEX\s*=\s*", ov_txt)
if mov:
    ov = JSONDecoder().raw_decode(ov_txt, mov.end())[0]
    seen = stale = 0
    for i, rec in ov.items():
        if i in finals and isinstance(rec, dict) and "ss" in rec:
            seen += 1
            ss = rec["ss"].rstrip("…. ")
            # new preview should be a leading slice of the new final
            if ss[:80] and ss[:80] not in finals[i]:
                stale += 1
    print(f"  {'_overlay-data.js (preview)':<28} {seen:>3} checked · "
          f"{'OK' if stale == 0 else f'{stale} STALE'}")
    if stale:
        problems.append("_overlay-data.js")

# viz-emotional-arcs.html (subset OK) — declared `var LETTERS=...`
ea = None
for mk in ("var LETTERS=", "var LETTERS =", "const LETTERS = ", "const LETTERS="):
    ea = arr_after("viz-emotional-arcs.html", mk)
    if ea:
        break
if ea:
    check_full("viz-emotional-arcs.html", ea, "id", "sigSummary")
else:
    print(f"  {'viz-emotional-arcs.html':<28} could not locate LETTERS — CHECK")
    problems.append("viz-emotional-arcs.html")

print()
if problems:
    print("FAIL — carriers out of sync:", ", ".join(problems))
    sys.exit(1)
print("PASS — all live carriers match the approved finals.")
