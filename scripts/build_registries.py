#!/usr/bin/env python
"""
Build people registry and places gazetteer from all-letters.json.

Outputs:
  03-data/people/people-registry.json   — canonical person records
  03-data/places/places-gazetteer.json  — canonical place records
"""

import os
import re
import json
from collections import defaultdict, Counter

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JSON_FILE = os.path.join(BASE_DIR, "03-data", "all-letters.json")
PEOPLE_DIR = os.path.join(BASE_DIR, "03-data", "people")
PLACES_DIR = os.path.join(BASE_DIR, "03-data", "places")


# ─── People Registry ──────────────────────────────────────────────────────────

# Known Hubbell family members with canonical info
HUBBELL_FAMILY = {
    "henry hubbell": {
        "canonicalName": "Henry Hubbell",
        "category": "family",
        "role": "Soldier, Co. D, 34th NY Volunteers",
        "relationship": "Son",
        "notes": "Killed at Battle of Antietam, September 17, 1862",
        "warService": "1861-1862",
    },
    "alexander hubbell": {
        "canonicalName": "Alexander F. Hubbell",
        "category": "family",
        "role": "Soldier, 60th NY / 102nd NY Volunteers",
        "relationship": "Son",
        "notes": "Served 1862-1865",
        "warService": "1862-1865",
    },
    "charles hubbell": {
        "canonicalName": "Charles Hubbell",
        "category": "family",
        "role": "Soldier, Invalid Corps / Veteran Reserve Corps",
        "relationship": "Son",
        "notes": "Stationed in Washington area",
        "warService": "1862-1865",
    },
    "james hubbell": {
        "canonicalName": "James Hubbell",
        "category": "family",
        "role": "Student / Soldier",
        "relationship": "Son (youngest)",
        "notes": "Attended academy, later served",
        "warService": "1864-1865",
    },
    "mother": {
        "canonicalName": "Frances M. Hubbell (Mother)",
        "category": "family",
        "role": "Mother, home front",
        "relationship": "Mother",
        "notes": "Widowed mother in Champlain, NY. Wrote to sons at front.",
    },
    "frances hubbell": {
        "canonicalName": "Frances ('Fannie') Hubbell",
        "category": "family",
        "role": "Daughter / Teacher",
        "relationship": "Sister",
        "notes": "Taught school, including in Canada (Montreal)",
    },
}


def normalize_person_name(name):
    """Normalize a person name for grouping."""
    n = name.lower().strip()
    # Remove parenthetical notes
    n = re.sub(r'\s*\([^)]*\)\s*', ' ', n).strip()
    # Remove titles/ranks for grouping key
    n = re.sub(r'^(capt\.?|captain|lt\.?|lieut\.?|lieutenant|col\.?|colonel|'
               r'sgt\.?|sergeant|pvt\.?|private|mr\.?|mrs\.?|miss|dr\.?|gen\'?l?\.?|'
               r'general|major|corporal|orderly\s+sgt\.?|brevet\s+maj\.?\s+gen\.?)\s+',
               '', n, flags=re.IGNORECASE).strip()
    # Remove "the" prefix
    n = re.sub(r'^the\s+', '', n).strip()
    return n

# Merge rules: map variant normalized names to canonical normalized name
PERSON_MERGE_RULES = {
    # Hubbell family
    "james": "james hubbell",
    "henry": "henry hubbell",
    "charles": "charles hubbell",
    "alexander": "alexander hubbell",
    "alexander f. hubbell": "alexander hubbell",
    "charley": "charles hubbell",
    "charlie": "charles hubbell",
    "frances": "frances hubbell",
    "fannie": "frances hubbell",
    "mother": "mrs. hubbell",
    "mother mrs. hubbell": "mrs. hubbell",
    "mother mrs. f. a. hubbell": "mrs. hubbell",
    # Common variants
    "alex douglas": "alex douglass",
    "alek douglas": "alex douglass",
    "a. douglas": "alex douglass",
    "a. douglass": "alex douglass",
}


def extract_rank(name):
    """Extract military rank from a name string."""
    ranks = {
        r'\bgen(?:eral)?\.?\b': "General",
        r'\bcol(?:onel)?\.?\b': "Colonel",
        r'\blt\.?\s*col\.?\b': "Lieutenant Colonel",
        r'\blieut\.?\s*col\.?\b': "Lieutenant Colonel",
        r'\bmajor\b': "Major",
        r'\bcapt(?:ain)?\.?\b': "Captain",
        r'\blieut(?:enant)?\.?\b': "Lieutenant",
        r'\blt\.?\b': "Lieutenant",
        r'\bsgt\.?\b|sergeant': "Sergeant",
        r'\bcorporal\b': "Corporal",
        r'\bpvt\.?\b|private': "Private",
        r'\bdr\.?\b': "Doctor",
    }
    for pattern, rank in ranks.items():
        if re.search(pattern, name.lower()):
            return rank
    return None


def build_people_registry(letters):
    """Build a people registry from all letter data."""
    # Collect all person mentions
    raw_mentions = defaultdict(lambda: {
        "variants": set(),
        "roles": set(),
        "ranks": set(),
        "letters": set(),
        "first_letter_date": None,
        "last_letter_date": None,
    })

    for letter in letters:
        doc_id = letter["id"]
        letter_date = letter["date"]

        for person in letter.get("people", []):
            name = person["name"]
            role = person.get("role", "")
            norm = normalize_person_name(name)

            if not norm or norm in ('—', '-', ''):
                continue

            # Apply merge rules
            norm = PERSON_MERGE_RULES.get(norm, norm)
            entry = raw_mentions[norm]
            entry["variants"].add(name)
            if role and role != '—':
                entry["roles"].add(role)
            rank = extract_rank(name)
            if rank:
                entry["ranks"].add(rank)
            entry["letters"].add(doc_id)
            if entry["first_letter_date"] is None or letter_date < entry["first_letter_date"]:
                entry["first_letter_date"] = letter_date
            if entry["last_letter_date"] is None or letter_date > entry["last_letter_date"]:
                entry["last_letter_date"] = letter_date

    # Build registry entries
    registry = []
    for norm_name, data in sorted(raw_mentions.items(), key=lambda x: -len(x[1]["letters"])):
        # Check if this is a known Hubbell family member
        family_info = None
        for key, info in HUBBELL_FAMILY.items():
            if key in norm_name or norm_name in key:
                family_info = info
                break

        # Pick best canonical name (longest variant, excluding rank prefixes for non-military)
        variants = sorted(data["variants"], key=lambda x: len(x), reverse=True)
        canonical = variants[0]

        entry = {
            "id": f"PER-{re.sub(r'[^a-z0-9]', '-', norm_name.lower()).strip('-')}",
            "canonicalName": family_info["canonicalName"] if family_info else canonical,
            "variants": sorted(data["variants"]),
            "category": family_info["category"] if family_info else (
                "military" if data["ranks"] else "civilian"
            ),
            "roles": sorted(data["roles"]),
            "ranks": sorted(data["ranks"]),
            "letterCount": len(data["letters"]),
            "letters": sorted(data["letters"]),
            "firstAppearance": data["first_letter_date"],
            "lastAppearance": data["last_letter_date"],
        }
        if family_info:
            entry["relationship"] = family_info.get("relationship", "")
            entry["notes"] = family_info.get("notes", "")

        registry.append(entry)

    return registry


# ─── Places Gazetteer ──────────────────────────────────────────────────────────

def normalize_place_name(written):
    """Normalize a place name for grouping."""
    p = written.lower().strip()
    p = re.sub(r'\s+', ' ', p)
    # Remove quotes
    p = p.strip('"\'')
    return p


def build_places_gazetteer(letters):
    """Build a places gazetteer from all letter data."""
    raw_places = defaultdict(lambda: {
        "variants_written": set(),
        "modern_ids": set(),
        "coordinates": [],
        "letters": set(),
    })

    for letter in letters:
        doc_id = letter["id"]
        for place in letter.get("places", []):
            written = place.get("written", "")
            modern = place.get("modern", "")
            if not written or written == '—':
                continue

            norm = normalize_place_name(written)
            entry = raw_places[norm]
            entry["variants_written"].add(written)
            if modern and modern != '—':
                # Strip contextual notes from modern ID for canonical use
                clean_modern = re.sub(r'\s*—\s*.*$', '', modern).strip()
                clean_modern = re.sub(r'\s*--\s*.*$', '', clean_modern).strip()
                # Strip parenthetical notes like "(went to church)"
                clean_modern = re.sub(r'\s*\([^)]*\)\s*$', '', clean_modern).strip()
                # Skip non-place values
                skip_patterns = [
                    r'^`',              # confidence tags like `inferred`
                    r'^Where\b',        # editorial notes
                    r'^Home$',          # generic
                    r'^Family home',    # generic
                    r'^Camp somewhere', # vague
                ]
                if clean_modern and not any(re.match(p, clean_modern) for p in skip_patterns):
                    entry["modern_ids"].add(clean_modern)

            if "lat" in place and "lon" in place:
                entry["coordinates"].append((place["lat"], place["lon"]))
            entry["letters"].add(doc_id)

    gazetteer = []
    for norm_name, data in sorted(raw_places.items(), key=lambda x: -len(x[1]["letters"])):
        # Pick best coordinates (average if multiple)
        coords = None
        if data["coordinates"]:
            avg_lat = sum(c[0] for c in data["coordinates"]) / len(data["coordinates"])
            avg_lon = sum(c[1] for c in data["coordinates"]) / len(data["coordinates"])
            coords = {"lat": round(avg_lat, 4), "lon": round(avg_lon, 4)}

        # Pick canonical modern name (most common, or longest)
        modern_names = sorted(data["modern_ids"], key=len, reverse=True)
        canonical_modern = modern_names[0] if modern_names else None

        # Determine state from modern ID
        state = None
        if canonical_modern:
            state_m = re.search(r',\s*(\w[\w\s]*?)$', canonical_modern)
            if state_m:
                state = state_m.group(1).strip()

        entry = {
            "id": f"PLC-{re.sub(r'[^a-z0-9]', '-', norm_name).strip('-')[:50]}",
            "canonicalName": canonical_modern if canonical_modern else norm_name.title(),
            "asWritten": sorted(data["variants_written"]),
            "modernIdentifications": sorted(data["modern_ids"]),
            "state": state,
            "coordinates": coords,
            "letterCount": len(data["letters"]),
            "letters": sorted(data["letters"]),
        }
        gazetteer.append(entry)

    return gazetteer


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    with open(JSON_FILE, 'r', encoding='utf-8') as f:
        letters = json.load(f)

    print(f"Loaded {len(letters)} letters")

    # Build people registry
    print("\n-- Building People Registry --")
    people = build_people_registry(letters)
    print(f"  {len(people)} unique people identified")
    print(f"  Categories: {Counter(p['category'] for p in people)}")
    print(f"  Top 10 by letter count:")
    for p in people[:10]:
        print(f"    {p['canonicalName']}: {p['letterCount']} letters, {len(p['variants'])} variants")

    os.makedirs(PEOPLE_DIR, exist_ok=True)
    people_file = os.path.join(PEOPLE_DIR, "people-registry.json")
    with open(people_file, 'w', encoding='utf-8') as f:
        json.dump(people, f, indent=2, ensure_ascii=False)
    print(f"  Written to {people_file}")

    # Build places gazetteer
    print("\n-- Building Places Gazetteer --")
    places = build_places_gazetteer(letters)
    print(f"  {len(places)} unique places identified")
    with_coords = sum(1 for p in places if p["coordinates"])
    print(f"  {with_coords} with coordinates ({with_coords/len(places)*100:.0f}%)")
    print(f"  Top 10 by letter count:")
    for p in places[:10]:
        coord_str = f" ({p['coordinates']['lat']}, {p['coordinates']['lon']})" if p["coordinates"] else ""
        print(f"    {p['canonicalName']}{coord_str}: {p['letterCount']} letters")

    os.makedirs(PLACES_DIR, exist_ok=True)
    places_file = os.path.join(PLACES_DIR, "places-gazetteer.json")
    with open(places_file, 'w', encoding='utf-8') as f:
        json.dump(places, f, indent=2, ensure_ascii=False)
    print(f"  Written to {places_file}")

    print("\nDone!")


if __name__ == "__main__":
    main()
