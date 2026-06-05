"""Propagate the approved rewritten summaries into the two AUTHORITATIVE stores,
keyed by letter id (never by string match):

  1. 03-data/all-letters.json   -> sigSummary   (canonical; pretty-printed, indent=2)
  2. hubbell-dashboard.html      -> embedded `const LETTERS = [...]` JSON, sigSummary

All other carriers (_search-data.js, _overlay-data.js, viz-people-web.html,
viz-emotional-arcs.html, _og-data.json, ...) are DERIVED — regenerate them with
their build scripts after running this. This script touches nothing derived.

Safe by construction: the dashboard array is valid JSON, so we parse it with a
JSON decoder (raw_decode bounds the exact array span), swap sigSummary values by
id, and splice the re-serialized array back — no regex on letter text.

Usage: python scripts/propagate-summaries.py
"""
import json
from json import JSONDecoder

PROP = "04-analysis/sigsummary-v2-all-proposals.json"
ALL = "03-data/all-letters.json"
DASH = "hubbell-dashboard.html"
SEARCH = "_search-data.js"
MARKER = "const LETTERS = "
SEARCH_MARKER = "var LETTERS="


def load_finals():
    rows = json.load(open(PROP, encoding="utf-8"))
    finals = {r["id"]: r["final"] for r in rows if r.get("final")}
    if len(finals) != len(rows):
        raise SystemExit(f"ABORT: {len(rows)-len(finals)} proposals missing a final")
    return finals


def update_all_letters(finals):
    data = json.load(open(ALL, encoding="utf-8"))
    changed = 0
    for r in data:
        f = finals.get(r["id"])
        if f and r.get("sigSummary") != f:
            r["sigSummary"] = f
            changed += 1
    json.dump(data, open(ALL, "w", encoding="utf-8"),
              ensure_ascii=False, indent=2)
    return changed, len(data)


def update_dashboard(finals):
    h = open(DASH, encoding="utf-8").read()
    s = h.find(MARKER)
    if s < 0:
        raise SystemExit("ABORT: could not find `const LETTERS = ` in dashboard")
    s += len(MARKER)
    arr, end = JSONDecoder().raw_decode(h, s)
    changed = 0
    for r in arr:
        f = finals.get(r["id"])
        if f and r.get("sigSummary") != f:
            r["sigSummary"] = f
            changed += 1
    new_arr = json.dumps(arr, ensure_ascii=False, separators=(",", ":"))
    new_h = h[:s] + new_arr + h[end:]
    open(DASH, "w", encoding="utf-8").write(new_h)
    return changed, len(arr)


def update_search_data(finals):
    """_search-data.js is hand-maintained (no generator). Its `ss` holds the
    FULL summary that feeds the reader panels (letter.ss in _reader.js)."""
    h = open(SEARCH, encoding="utf-8").read()
    s = h.find(SEARCH_MARKER)
    if s < 0:
        raise SystemExit("ABORT: could not find `var LETTERS=` in _search-data.js")
    s += len(SEARCH_MARKER)
    arr, end = JSONDecoder().raw_decode(h, s)
    changed = 0
    for r in arr:
        f = finals.get(r["id"])
        if f and r.get("ss") != f:
            r["ss"] = f
            changed += 1
    new_arr = json.dumps(arr, ensure_ascii=False, separators=(",", ":"))
    open(SEARCH, "w", encoding="utf-8").write(h[:s] + new_arr + h[end:])
    return changed, len(arr)


def main():
    finals = load_finals()
    print(f"Loaded {len(finals)} approved finals")
    c1, n1 = update_all_letters(finals)
    print(f"  all-letters.json     : {c1} updated / {n1} letters")
    c2, n2 = update_dashboard(finals)
    print(f"  hubbell-dashboard.html: {c2} updated / {n2} letters")
    c3, n3 = update_search_data(finals)
    print(f"  _search-data.js (ss)  : {c3} updated / {n3} letters")
    print("Done. Now regenerate derived files (build-overlay-data, "
          "build-emotional-arcs, build-people-web-data, build-og-data).")


if __name__ == "__main__":
    main()
