"""Extract Henry's 59 letters into per-letter context files for the sigSummary
rewrite pilot. Each file holds exactly what an agent needs to rewrite one
summary, grounded only in that letter. Reads canonical 03-data/all-letters.json;
writes 04-analysis/_henry-pilot/<id>.json. Read-only w.r.t. canonical data.
"""
import json
import os

SRC = "03-data/all-letters.json"
OUT_DIR = "04-analysis/_henry-pilot"

FLAG_KEYS = [
    "hasBattle", "hasIllness", "hasDeath", "hasWound", "hasPromotion",
    "hasCapture", "hasDesertion", "hasDischarge", "hasHomeNews", "hasPolitical",
    "hasMoraleCrisis", "hasSupplyRequest", "hasReceipt", "hasCampMovement",
    "hasEyewitness",
]


def fix_dashes(s):
    # The source has a stray replacement char where an en/em-dash belongs.
    if not s:
        return s
    return s.replace("�", "—").replace("\x90", "—")


def main():
    with open(SRC, encoding="utf-8") as f:
        data = json.load(f)
    rows = data if isinstance(data, list) else data.get("letters", data)
    henry = [l for l in rows if l.get("author") == "henry"]
    os.makedirs(OUT_DIR, exist_ok=True)
    index = []
    for l in henry:
        flags = [k[3:] for k in FLAG_KEYS if l.get(k)]
        rec = {
            "id": l["id"],
            "date": l.get("date", ""),
            "author": l.get("authorName", "Henry"),
            "recipient": l.get("recipient", ""),
            "location": l.get("location", ""),
            "flags": flags,
            "people": [p.get("name") if isinstance(p, dict) else p for p in (l.get("people") or [])],
            "places": [p.get("name") if isinstance(p, dict) else p for p in (l.get("places") or [])],
            "currentSummary": fix_dashes(l.get("sigSummary", "")),
            "editorial": fix_dashes(l.get("editorial", "")),
            "transcription": fix_dashes(l.get("transcription", "")),
        }
        path = os.path.join(OUT_DIR, l["id"] + ".json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump(rec, f, ensure_ascii=False, indent=2)
        index.append({"id": l["id"], "date": rec["date"], "file": path.replace("\\", "/")})
    index.sort(key=lambda r: r["date"])
    with open(os.path.join(OUT_DIR, "_index.json"), "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=2)
    print(f"Wrote {len(henry)} Henry letters to {OUT_DIR}/")
    print(f"Index: {OUT_DIR}/_index.json")


if __name__ == "__main__":
    main()
