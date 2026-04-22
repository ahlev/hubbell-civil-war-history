#!/usr/bin/env python
"""Build _overlay-data.js from people-registry.json and places-gazetteer.json.

Produces lookup tables with deduplication:
  OVERLAY_PEOPLE_PROFILES  — array of person profiles (indexed)
  OVERLAY_PEOPLE_LOOKUP    — variant name (lowercase) → index into profiles
  OVERLAY_PLACES_PROFILES  — array of place profiles (indexed)
  OVERLAY_PLACES_LOOKUP    — variant name (lowercase) → index into profiles
  LETTER_INDEX             — letter ID → lightweight metadata (no transcriptions)
"""

import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

PEOPLE_PATH = os.path.join(ROOT, "03-data", "people", "people-registry.json")
PLACES_PATH = os.path.join(ROOT, "03-data", "places", "places-gazetteer.json")
LETTERS_PATH = os.path.join(ROOT, "03-data", "all-letters.json")
SUMMARIES_PATH = os.path.join(ROOT, "03-data", "entity-summaries.json")
OUTPUT_PATH = os.path.join(ROOT, "_overlay-data.js")


def load_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def build_letter_index(letters):
    """Build lightweight letter index (no transcriptions)."""
    index = {}
    for ltr in letters:
        entry = {
            "d": ltr.get("date", ""),
            "a": ltr.get("author", ""),
            "an": ltr.get("authorName", ""),
            "r": ltr.get("recipient", ""),
            "l": ltr.get("location", ""),
        }
        sig = ltr.get("sigSummary", "")
        if sig:
            # Strip bold markdown, truncate to ~160 chars
            sig = sig.replace("**", "")
            if len(sig) > 160:
                cut = sig[:160]
                last = max(cut.rfind("."), cut.rfind("!"), cut.rfind("?"))
                sig = sig[: last + 1] if last > 60 else cut.rstrip() + "..."
            entry["ss"] = sig
        index[ltr["id"]] = entry
    return index


def build_people(people, summaries=None):
    """Build people profiles array + variant→index lookup."""
    summaries = summaries or {}
    profiles = []
    lookup = {}
    for person in people:
        idx = len(profiles)
        # Store just letter IDs — metadata resolved at render time via LETTER_INDEX
        letter_ids = sorted(person.get("letters", []))
        profile = {
            "id": person["id"],
            "n": person["canonicalName"],
            "cat": person.get("category", "civilian"),
            "roles": person.get("roles", [])[:5],
            "rel": person.get("relationship", ""),
            "lc": person.get("letterCount", 0),
            "ltrs": letter_ids,
            "first": person.get("firstAppearance", ""),
            "last": person.get("lastAppearance", ""),
        }
        s = summaries.get(person["id"], "")
        if s:
            profile["s"] = s
        profiles.append(profile)
        for variant in person.get("variants", []):
            key = variant.strip().lower()
            if key and key not in lookup:
                lookup[key] = idx
        canon_key = person["canonicalName"].strip().lower()
        if canon_key not in lookup:
            lookup[canon_key] = idx

    return profiles, lookup


def build_places(places, summaries=None):
    """Build places profiles array + variant→index lookup."""
    summaries = summaries or {}
    profiles = []
    lookup = {}
    skip = {"`inferred`", "`stated`", "`unclear`", "`envelope`"}

    for place in places:
        idx = len(profiles)
        coords = place.get("coordinates", {})
        letter_ids = sorted(place.get("letters", []))

        # Guard against metadata tags leaking into display name
        canon = place["canonicalName"]
        if canon in skip:
            alts = [v for v in place.get("modernIdentifications", []) if v not in skip]
            aw = [v for v in place.get("asWritten", []) if v not in skip]
            canon = alts[0] if alts else (aw[0] if aw else place["id"].replace("PLC-", ""))

        profile = {
            "id": place["id"],
            "n": canon,
            "aw": [v for v in place.get("asWritten", []) if v not in skip],
            "st": place.get("state", ""),
            "co": {"lat": coords.get("lat"), "lon": coords.get("lon")} if coords else None,
            "lc": place.get("letterCount", 0),
            "ltrs": letter_ids,
        }
        s = summaries.get(place["id"], "")
        if s:
            profile["s"] = s
        profiles.append(profile)
        for variant in place.get("asWritten", []):
            key = variant.strip().lower()
            if key and key not in skip and key not in lookup:
                lookup[key] = idx
        for variant in place.get("modernIdentifications", []):
            key = variant.strip().lower()
            if key and key not in skip and key not in lookup:
                lookup[key] = idx
        canon_key = place["canonicalName"].strip().lower()
        if canon_key not in lookup:
            lookup[canon_key] = idx

    return profiles, lookup


def main():
    print("Loading source data...")
    people = load_json(PEOPLE_PATH)
    places = load_json(PLACES_PATH)
    letters = load_json(LETTERS_PATH)
    summaries = load_json(SUMMARIES_PATH) if os.path.exists(SUMMARIES_PATH) else {}
    if summaries:
        print(f"  {len(summaries)} entity summaries loaded")

    print(f"  {len(people)} people, {len(places)} places, {len(letters)} letters")

    letter_index = build_letter_index(letters)
    people_profiles, people_lookup = build_people(people, summaries)
    places_profiles, places_lookup = build_places(places, summaries)

    print(f"  {len(people_profiles)} person profiles, {len(people_lookup)} person variants")
    print(f"  {len(places_profiles)} place profiles, {len(places_lookup)} place variants")

    sep = (",", ":")
    # Use var (not const) so globals attach to window — needed by _overlay.js IIFE
    js_parts = [
        "/* Auto-generated by scripts/build-overlay-data.py — do not edit */",
        "var OVERLAY_PEOPLE_PROFILES=" + json.dumps(people_profiles, separators=sep) + ";",
        "var OVERLAY_PEOPLE_LOOKUP=" + json.dumps(people_lookup, separators=sep) + ";",
        "var OVERLAY_PLACES_PROFILES=" + json.dumps(places_profiles, separators=sep) + ";",
        "var OVERLAY_PLACES_LOOKUP=" + json.dumps(places_lookup, separators=sep) + ";",
        "var LETTER_INDEX=" + json.dumps(letter_index, separators=sep) + ";",
    ]

    output = "\n".join(js_parts) + "\n"

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        f.write(output)

    size_kb = os.path.getsize(OUTPUT_PATH) / 1024
    print(f"Wrote {OUTPUT_PATH} ({size_kb:.0f} KB)")


if __name__ == "__main__":
    main()
