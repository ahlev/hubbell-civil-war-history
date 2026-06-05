"""Prep ALL 273 letters for the lean enrichment pass. Writes one context file
per letter to 04-analysis/_pilot/<id>.json (transcription + metadata), plus a
`base` field = the current best summary to refine/tighten when we have one
(Henry's enriched finals), else null (generate from scratch). Also writes a
per-author index. Read-only w.r.t. canonical data.
"""
import json
import os

SRC = "03-data/all-letters.json"
HENRY = "04-analysis/sigsummary-v2-henry-proposals.json"
OUT = "04-analysis/_pilot"

FLAG_KEYS = ["hasBattle", "hasIllness", "hasDeath", "hasWound", "hasPromotion",
             "hasCapture", "hasDesertion", "hasDischarge", "hasHomeNews",
             "hasPolitical", "hasMoraleCrisis", "hasSupplyRequest", "hasReceipt",
             "hasCampMovement", "hasEyewitness"]


def fix(s):
    return (s or "").replace("�", "—").replace("\x90", "—")


def names(xs):
    return [p.get("name") if isinstance(p, dict) else p for p in (xs or [])]


def main():
    data = json.load(open(SRC, encoding="utf-8"))
    rows = data if isinstance(data, list) else data.get("letters", data)
    henry_base = {r["id"]: r["final"] for r in json.load(open(HENRY, encoding="utf-8"))} \
        if os.path.exists(HENRY) else {}
    os.makedirs(OUT, exist_ok=True)
    by_author = {}
    for l in rows:
        lid = l["id"]
        rec = {
            "id": lid, "date": l.get("date", ""), "author": l.get("authorName", ""),
            "authorKey": l.get("author", ""), "recipient": l.get("recipient", ""),
            "location": l.get("location", ""),
            "flags": [k[3:] for k in FLAG_KEYS if l.get(k)],
            "people": names(l.get("people")), "places": names(l.get("places")),
            "currentSummary": fix(l.get("sigSummary")), "editorial": fix(l.get("editorial")),
            "transcription": fix(l.get("transcription")),
            "base": henry_base.get(lid),  # enriched draft to tighten, or None
        }
        json.dump(rec, open(os.path.join(OUT, lid + ".json"), "w", encoding="utf-8"),
                  ensure_ascii=False, indent=2)
        by_author.setdefault(l.get("author", "unknown"), []).append({"id": lid, "date": rec["date"]})

    for a, items in by_author.items():
        items.sort(key=lambda r: r["date"])
        json.dump(items, open(os.path.join(OUT, f"_index-{a}.json"), "w", encoding="utf-8"),
                  ensure_ascii=False, indent=2)
        print(f"{a}: {len(items)} letters")
    print(f"Total prepped: {sum(len(v) for v in by_author.values())} -> {OUT}/")


if __name__ == "__main__":
    main()
