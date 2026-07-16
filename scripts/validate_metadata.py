#!/usr/bin/env python
"""
Metadata Quality Evaluation for the Hubbell Civil War Letter Collection.

Three-part validation:
  1. Schema compliance — required fields, enum values, format checks
  2. JSON fidelity — compare all-letters.json against markdown source
  3. Cross-collection consistency — name variants, timeline coherence, place normalization

Outputs a structured report to 04-analysis/validation-report.md
"""

import os
import re
import json
import glob
from collections import defaultdict, Counter
from datetime import date, timedelta

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LETTERS_DIR = os.path.join(BASE_DIR, "02-transcribed-markdown", "letters")
JSON_FILE = os.path.join(BASE_DIR, "03-data", "all-letters.json")
REPORT_FILE = os.path.join(BASE_DIR, "04-analysis", "validation-report.md")

# ─── Expected values ───────────────────────────────────────────────────────────

REQUIRED_FIELDS = [
    "Document ID", "Date Written", "Author", "Recipient",
    "Direction", "Author Location", "Regiment/Unit",
    "Source File", "Transcriber"
]

VALID_SIGNIFICANCE = {"routine", "notable", "major"}
VALID_EMOTION = {"low", "moderate", "high", "extreme"}
VALID_DIRECTION = {"front-to-home", "home-to-front", "other"}

ALL_EVENT_FLAGS = [
    "Battle/combat described",
    "Death reported",
    "Wound/injury reported",
    "Illness reported",
    "Promotion/demotion",
    "Capture/POW",
    "Desertion mentioned",
    "Discharge/muster-out",
    "Major news from home",
    "Political commentary",
    "Morale crisis",
    "Request for supplies/money",
    "Receipt of package/letter",
    "Camp movement/march",
    "Eyewitness to named event",
]

# Short-form flag names that appear in some letters
FLAG_ALIASES = {
    "Battle": "Battle/combat described",
    "Death": "Death reported",
    "Wound": "Wound/injury reported",
    "Illness": "Illness reported",
    "Promotion": "Promotion/demotion",
    "Capture": "Capture/POW",
    "Desertion": "Desertion mentioned",
    "Discharge": "Discharge/muster-out",
    "Camp movement": "Camp movement/march",
}

KNOWN_AUTHORS = {
    "henry hubbell", "henry", "alexander hubbell", "alexander",
    "alexander f. hubbell", "james hubbell", "james",
    "charles hubbell", "charles", "mrs. hubbell (mother)",
    "mrs. hubbell", "mother", "frances m. hubbell",
    "frances hubbell", "mrs. f. hubbell", "mrs. frances hubbell",
    "r.w. mcdonald", "amos c. luther", "mary j. mcneil",
}


# ─── Extraction helpers ───────────────────────────────────────────────────────

def extract_metadata_field(text, field_name):
    pattern = rf'\|\s*\*\*{re.escape(field_name)}\*\*\s*\|\s*(.*?)\s*\|'
    m = re.search(pattern, text, re.IGNORECASE)
    if m:
        val = m.group(1).strip()
        val = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', val)
        val = val.replace('`', '')
        return val
    return ""


def extract_significance(text):
    m = re.search(r'###\s*Historical\s+Significance:\s*`([^`]+)`', text)
    return m.group(1).strip().lower() if m else None


def extract_emotion(text):
    m = re.search(r'###\s*Emotional\s+Intensity:\s*`([^`]+)`', text)
    return m.group(1).strip().lower() if m else None


def extract_event_flags_present(text):
    """Return dict of {canonical_flag_name: 'yes'|'no'} for flags found in the table."""
    section = re.search(r'### Event Flags(.*?)(?=\n---|\n##[^#])', text, re.DOTALL)
    if not section:
        return {}

    found = {}
    for line in section.group(1).split('\n'):
        line = line.strip()
        if not line.startswith('|'):
            continue
        # Extract flag name from bold
        flag_match = re.search(r'\*\*(.+?)\*\*', line)
        if not flag_match:
            continue
        flag_name = flag_match.group(1).strip()
        # Resolve aliases
        canonical = FLAG_ALIASES.get(flag_name, flag_name)

        # Extract yes/no
        cells = [c.strip() for c in line.split('|')]
        cells = [c for c in cells if c]
        if len(cells) >= 2:
            present_val = cells[1].strip().lower()
            if present_val in ('yes', 'no'):
                found[canonical] = present_val
            elif 'yes' in present_val:
                found[canonical] = 'yes'
            elif 'no' in present_val:
                found[canonical] = 'no'
    return found


def extract_confidence_values(text):
    """Extract all confidence column entries from the metadata table."""
    confidences = []
    # Match metadata table rows with 4+ columns
    for m in re.finditer(r'\|\s*\*\*(.+?)\*\*\s*\|[^|]*\|\s*(.*?)\s*\|', text):
        field = m.group(1)
        conf = m.group(2).strip()
        if conf and conf != '—' and conf != '-' and conf != '':
            confidences.append((field, conf))
    return confidences


def extract_people(text):
    """Extract people from ### People Mentioned table."""
    people = []
    m = re.search(r'### People Mentioned\s*\n(.*?)(?=\n###|\n---|\n## )', text, re.DOTALL)
    if not m:
        return people
    for line in m.group(1).split('\n'):
        line = line.strip()
        if not line.startswith('|'):
            continue
        cells = [c.strip() for c in line.split('|')]
        cells = [c for c in cells if c]
        if len(cells) < 2:
            continue
        name = cells[0]
        if name.startswith('---') or name.startswith('Name') or name.startswith('**'):
            continue
        if name.startswith('`') or 'First Mention' in name:
            continue
        if name and name != '—':
            people.append(name)
    return people


def extract_places(text):
    """Extract places from ### Places Mentioned table."""
    places = []
    m = re.search(r'### Places Mentioned\s*\n(.*?)(?=\n###|\n---|\n## )', text, re.DOTALL)
    if not m:
        return places
    for line in m.group(1).split('\n'):
        line = line.strip()
        if not line.startswith('|'):
            continue
        cells = [c.strip() for c in line.split('|')]
        cells = [c for c in cells if c]
        if len(cells) < 2:
            continue
        written = cells[0]
        modern = cells[1] if len(cells) > 1 else ""
        if written.startswith('---') or written.startswith('Place') or written.startswith('**'):
            continue
        if written.startswith('`') or written == '—':
            continue
        coords = cells[2] if len(cells) > 2 else ""
        if written:
            places.append({"written": written, "modern": modern, "coords": coords})
    return places


def extract_cross_refs(text):
    """Extract previous/next letter IDs from cross-reference section."""
    refs = {}
    prev_m = re.search(r'\*\*Previous letter:\*\*\s*`?(LTR-[\d-]+)`?', text)
    next_m = re.search(r'\*\*Next letter:\*\*\s*`?(LTR-[\d-]+)`?', text)
    if prev_m:
        refs['previous'] = prev_m.group(1)
    if next_m:
        refs['next'] = next_m.group(1)
    return refs


def extract_temporal(text):
    """Extract temporal context fields."""
    temporal = {}
    m = re.search(r'## Temporal Context\s*\n(.*?)(?=\n---|\n## |\Z)', text, re.DOTALL)
    if not m:
        return temporal
    section = m.group(1)
    for field in ["War Year", "Campaign Period", "Days Since Last Letter", "Days Until Next Letter"]:
        fm = re.search(rf'\*\*{re.escape(field)}\*\*\s*\|\s*(.*?)\s*\|', section)
        if fm:
            temporal[field] = fm.group(1).strip()
    return temporal


def parse_date_from_field(date_str):
    """Try to parse a date from a Date Written field value."""
    if not date_str:
        return None
    # Check for bold corrected date first
    corrected = re.search(r'\*\*(\w+ \d{1,2},?\s*\d{4})\*\*', date_str)
    candidates = []
    if corrected:
        candidates.append(corrected.group(1))
    candidates.append(date_str)

    months = {"january":1,"february":2,"march":3,"april":4,"may":5,"june":6,
              "july":7,"august":8,"september":9,"october":10,"november":11,"december":12}
    for candidate in candidates:
        m = re.search(r'(\w+)\s+(\d{1,2}),?\s*(\d{4})', candidate)
        if m:
            month_num = months.get(m.group(1).lower())
            if month_num:
                try:
                    return date(int(m.group(3)), month_num, int(m.group(2)))
                except ValueError:
                    pass
    return None


def date_from_id(doc_id):
    """Extract date from document ID like LTR-1862-09-21-002."""
    m = re.match(r'LTR-(\d{4})-(\d{2})-(\d{2})', doc_id)
    if m:
        try:
            return date(int(m.group(1)), int(m.group(2)), int(m.group(3)))
        except ValueError:
            return None
    return None


def has_section(text, heading):
    """Check if a markdown ## or ### section exists."""
    return bool(re.search(rf'###?\s+{re.escape(heading)}', text))


def extract_health(text):
    """Extract health & condition entries."""
    entries = []
    m = re.search(r'### Health & Condition\s*\n(.*?)(?=\n###|\n---|\n## )', text, re.DOTALL)
    if not m:
        return entries
    for line in m.group(1).split('\n'):
        line = line.strip()
        if not line.startswith('|'):
            continue
        cells = [c.strip() for c in line.split('|')]
        cells = [c for c in cells if c]
        if len(cells) < 3:
            continue
        who = cells[0]
        if who.startswith('---') or who.startswith('Who') or who.startswith('**'):
            continue
        if who and who != '—':
            entries.append({"who": who, "type": cells[1], "detail": cells[2]})
    return entries


def extract_domestic(text):
    """Extract domestic/home front entries."""
    entries = []
    m = re.search(r'### Domestic/Home Front\s*\n(.*?)(?=\n###|\n---|\n## )', text, re.DOTALL)
    if not m:
        return entries
    for line in m.group(1).split('\n'):
        line = line.strip()
        if not line.startswith('|'):
            continue
        cells = [c.strip() for c in line.split('|')]
        cells = [c for c in cells if c]
        if len(cells) < 2:
            continue
        topic = cells[0]
        if topic.startswith('---') or topic.startswith('Topic') or topic.startswith('**'):
            continue
        if topic and topic != '—':
            entries.append({"topic": topic, "detail": cells[1]})
    return entries


def extract_military_refs(text):
    """Extract military references table."""
    entries = []
    m = re.search(r'### Military References\s*\n(.*?)(?=\n###|\n---|\n## )', text, re.DOTALL)
    if not m:
        return entries
    for line in m.group(1).split('\n'):
        line = line.strip()
        if not line.startswith('|'):
            continue
        cells = [c.strip() for c in line.split('|')]
        cells = [c for c in cells if c]
        if len(cells) < 2:
            continue
        detail = cells[0]
        if detail.startswith('---') or detail.startswith('Detail') or detail.startswith('**'):
            # Bold field names are data in this table
            bold_m = re.search(r'\*\*(.+?)\*\*', detail)
            if bold_m:
                entries.append({"field": bold_m.group(1), "value": cells[1]})
            continue
        if detail and detail != '—':
            entries.append({"field": detail, "value": cells[1]})
    return entries


def extract_objects(text):
    """Extract objects & material culture (bullet list)."""
    m = re.search(r'### Objects & Material Culture\s*\n(.*?)(?=\n---|\n## |\Z)', text, re.DOTALL)
    if not m:
        return []
    items = []
    for line in m.group(1).strip().split('\n'):
        line = line.strip()
        if line.startswith('- ') or line.startswith('* '):
            items.append(line[2:].strip())
    return items


# ─── Part 1: Schema Compliance ────────────────────────────────────────────────

def validate_schema(filepath, text, all_doc_ids):
    """Validate a single letter's schema compliance. Returns list of violations."""
    violations = []
    filename = os.path.basename(filepath)
    doc_id = filename.replace('.md', '')

    # 1. Required fields
    for field in REQUIRED_FIELDS:
        val = extract_metadata_field(text, field)
        if not val or val == '—' or val == '-':
            # Regiment/Unit can legitimately be — for non-soldier letters
            if field == "Regiment/Unit":
                direction = extract_metadata_field(text, "Direction")
                if direction in ("home-to-front", "other"):
                    continue
            violations.append(("MISSING_FIELD", field, f"Required field '{field}' is empty or missing"))

    # 2. Enum validation
    sig = extract_significance(text)
    if sig is None:
        violations.append(("MISSING_SECTION", "Historical Significance", "No Historical Significance heading found"))
    elif sig not in VALID_SIGNIFICANCE:
        violations.append(("INVALID_ENUM", "significance", f"'{sig}' not in {VALID_SIGNIFICANCE}"))

    emo = extract_emotion(text)
    if emo is None:
        violations.append(("MISSING_SECTION", "Emotional Intensity", "No Emotional Intensity heading found"))
    elif emo not in VALID_EMOTION:
        violations.append(("INVALID_ENUM", "emotion", f"'{emo}' not in {VALID_EMOTION}"))

    direction = extract_metadata_field(text, "Direction")
    if direction and direction not in VALID_DIRECTION:
        violations.append(("INVALID_ENUM", "direction", f"'{direction}' not in {VALID_DIRECTION}"))

    # 3. Event flags completeness
    flags = extract_event_flags_present(text)
    if not flags:
        violations.append(("MISSING_SECTION", "Event Flags", "No event flags found"))
    else:
        # Check if it's a complete table (has yes AND no entries) or abbreviated (yes-only)
        has_no_entries = any(v == 'no' for v in flags.values())
        if has_no_entries:
            # Complete table — check all 15 flags are present
            for flag in ALL_EVENT_FLAGS:
                if flag not in flags:
                    violations.append(("MISSING_FLAG", flag, f"Event flag '{flag}' missing from complete table"))
        # If abbreviated (yes-only), that's acceptable

    # 4. Required sections
    if not has_section(text, "Full Transcription"):
        violations.append(("MISSING_SECTION", "Full Transcription", "No transcription section"))
    if not has_section(text, "People Mentioned"):
        violations.append(("MISSING_SECTION", "People Mentioned", "No people section"))
    if not has_section(text, "Places Mentioned"):
        violations.append(("MISSING_SECTION", "Places Mentioned", "No places section"))
    if not has_section(text, "Temporal Context"):
        violations.append(("MISSING_SECTION", "Temporal Context", "No temporal context section"))

    # 5. Cross-reference integrity
    refs = extract_cross_refs(text)
    for ref_type, ref_id in refs.items():
        if ref_id not in all_doc_ids:
            violations.append(("BROKEN_XREF", ref_type, f"Cross-reference '{ref_id}' does not match any file"))

    # 6. Date consistency (metadata date vs filename date)
    date_written = extract_metadata_field(text, "Date Written")
    parsed_date = parse_date_from_field(date_written)
    id_date = date_from_id(doc_id)
    if parsed_date and id_date and parsed_date != id_date:
        # Check for documented correction or multi-day letter
        has_correction = bool(re.search(r'(?:DATING CORRECTION|corrected|mislabeled|Multi-day letter|multi-day)', text, re.IGNORECASE))
        if not has_correction:
            violations.append(("DATE_MISMATCH", "Date Written",
                f"Metadata date {parsed_date} ≠ filename date {id_date} (no correction documented)"))

    # 7. Author normalization
    author = extract_metadata_field(text, "Author")
    if author:
        cleaned = author.lower().strip()
        cleaned = re.sub(r'\s*\(.*?\)\s*', ' ', cleaned).strip()
        if cleaned not in KNOWN_AUTHORS:
            # Check partial matches
            found = False
            for known in KNOWN_AUTHORS:
                if known in cleaned or cleaned in known:
                    found = True
                    break
            if not found:
                violations.append(("UNKNOWN_AUTHOR", "Author", f"Author '{author}' not in known set"))

    return violations


# ─── Part 2: JSON Fidelity ────────────────────────────────────────────────────

def check_json_fidelity(json_data, md_files):
    """Compare JSON data against markdown source files."""
    issues = []
    json_by_id = {item["id"]: item for item in json_data}
    md_ids = {os.path.basename(f).replace('.md', '') for f in md_files}

    # Letters in markdown but not in JSON
    for md_id in sorted(md_ids):
        if md_id not in json_by_id:
            issues.append(("MISSING_FROM_JSON", md_id, "Letter exists in markdown but not in JSON"))

    # Letters in JSON but not in markdown
    for json_id in sorted(json_by_id.keys()):
        if json_id not in md_ids:
            issues.append(("ORPHAN_JSON", json_id, "Letter exists in JSON but not in markdown"))

    # Field-level comparison for matched letters
    missing_fields_summary = Counter()
    value_drifts = []

    for md_file in md_files:
        doc_id = os.path.basename(md_file).replace('.md', '')
        if doc_id not in json_by_id:
            continue

        with open(md_file, 'r', encoding='utf-8') as f:
            text = f.read()

        jl = json_by_id[doc_id]

        # Check author match
        md_author = extract_metadata_field(text, "Author").lower().strip()
        if md_author and jl.get("author") == "unknown" and md_author != "unknown":
            value_drifts.append((doc_id, "author", f"JSON='unknown', MD='{md_author}'"))

        # Check significance
        md_sig = extract_significance(text)
        if md_sig and md_sig != jl.get("significance"):
            value_drifts.append((doc_id, "significance", f"JSON='{jl.get('significance')}', MD='{md_sig}'"))

        # Check emotion
        md_emo = extract_emotion(text)
        if md_emo and md_emo != jl.get("emotion"):
            value_drifts.append((doc_id, "emotion", f"JSON='{jl.get('emotion')}', MD='{md_emo}'"))

        # Check event flags — JSON only has 4, markdown has up to 15
        md_flags = extract_event_flags_present(text)
        for flag_name, flag_val in md_flags.items():
            if flag_val == 'yes':
                # Map to JSON key
                json_key_map = {
                    "Battle/combat described": "hasBattle",
                    "Death reported": "hasDeath",
                    "Wound/injury reported": "hasWound",
                    "Illness reported": "hasIllness",
                }
                json_key = json_key_map.get(flag_name)
                if json_key:
                    if not jl.get(json_key, False):
                        value_drifts.append((doc_id, flag_name, f"MD=yes but JSON {json_key}=false"))
                else:
                    missing_fields_summary[flag_name] += 1

        # Check for markdown fields with no JSON representation
        if extract_metadata_field(text, "Recipient Location"):
            missing_fields_summary["Recipient Location"] += 1
        if extract_cross_refs(text):
            missing_fields_summary["Cross-references"] += 1
        if extract_temporal(text):
            missing_fields_summary["Temporal Context"] += 1
        if extract_health(text):
            missing_fields_summary["Health & Condition"] += 1
        if extract_domestic(text):
            missing_fields_summary["Domestic/Home Front"] += 1
        if extract_military_refs(text):
            missing_fields_summary["Military References"] += 1
        if extract_objects(text):
            missing_fields_summary["Objects & Material Culture"] += 1

        # Check places for coordinates
        md_places = extract_places(text)
        has_coords = any(p["coords"] and p["coords"] != '—' and p["coords"] != '-' for p in md_places)
        if has_coords:
            missing_fields_summary["Place Coordinates"] += 1

        # Check confidence data
        confs = extract_confidence_values(text)
        if confs:
            missing_fields_summary["Confidence Metadata"] += 1

    return issues, missing_fields_summary, value_drifts


# ─── Part 3: Cross-Collection Consistency ─────────────────────────────────────

def check_cross_collection(md_files):
    """Check consistency across the entire collection."""
    all_people = defaultdict(list)   # name -> [doc_ids]
    all_places = defaultdict(list)   # (written, modern) -> [doc_ids]
    letter_dates = {}                # doc_id -> date
    letter_authors = {}              # doc_id -> author
    prev_next_chain = {}             # doc_id -> {prev, next}
    temporal_data = {}               # doc_id -> temporal dict

    for md_file in md_files:
        doc_id = os.path.basename(md_file).replace('.md', '')
        with open(md_file, 'r', encoding='utf-8') as f:
            text = f.read()

        # Collect people
        for person in extract_people(text):
            all_people[person.lower().strip()].append(doc_id)

        # Collect places
        for place in extract_places(text):
            key = (place["written"].lower().strip(), place["modern"].lower().strip())
            all_places[key].append(doc_id)

        # Collect dates
        date_str = extract_metadata_field(text, "Date Written")
        parsed = parse_date_from_field(date_str)
        if parsed:
            letter_dates[doc_id] = parsed
        else:
            id_d = date_from_id(doc_id)
            if id_d:
                letter_dates[doc_id] = id_d

        # Collect authors
        author = extract_metadata_field(text, "Author")
        letter_authors[doc_id] = author

        # Collect cross-refs
        refs = extract_cross_refs(text)
        if refs:
            prev_next_chain[doc_id] = refs

        # Collect temporal
        temporal_data[doc_id] = extract_temporal(text)

    results = {}

    # ── People name variants ──
    # Group names that might be the same person
    name_variants = defaultdict(set)
    for name in all_people:
        # Normalize: strip titles, abbreviations
        base = re.sub(r'^(capt\.?|captain|lt\.?|lieutenant|col\.?|colonel|sgt\.?|sergeant|pvt\.?|private|mr\.?|mrs\.?|miss|dr\.?)\s+', '', name, flags=re.IGNORECASE).strip()
        # Extract surname
        parts = base.split()
        if parts:
            surname = parts[-1].lower()
            if len(surname) > 2:  # skip initials
                name_variants[surname].add(name)

    # Filter to surnames with multiple variant spellings
    variant_report = {}
    for surname, variants in name_variants.items():
        if len(variants) > 1:
            variant_report[surname] = sorted(variants)
    results["name_variants"] = variant_report

    # ── Place inconsistencies ──
    # Group by written name, check for different modern identifications
    place_by_written = defaultdict(set)
    for (written, modern), doc_ids in all_places.items():
        place_by_written[written].add(modern)

    place_inconsistencies = {}
    for written, moderns in place_by_written.items():
        if len(moderns) > 1 and written != '—':
            place_inconsistencies[written] = sorted(moderns)
    results["place_inconsistencies"] = place_inconsistencies

    # ── Timeline coherence ──
    # Check that previous/next chain links are consistent
    chain_issues = []
    for doc_id, refs in prev_next_chain.items():
        if 'next' in refs:
            next_id = refs['next']
            if next_id in prev_next_chain:
                next_refs = prev_next_chain[next_id]
                if 'previous' in next_refs and next_refs['previous'] != doc_id:
                    chain_issues.append(
                        f"{doc_id} says next={next_id}, but {next_id} says previous={next_refs['previous']}")

        if 'previous' in refs:
            prev_id = refs['previous']
            if prev_id in prev_next_chain:
                prev_refs = prev_next_chain[prev_id]
                if 'next' in prev_refs and prev_refs['next'] != doc_id:
                    chain_issues.append(
                        f"{doc_id} says previous={prev_id}, but {prev_id} says next={prev_refs['next']}")

    # Check temporal "days since/until" values
    temporal_issues = []
    for doc_id, temp in temporal_data.items():
        if doc_id not in letter_dates:
            continue
        my_date = letter_dates[doc_id]

        for direction, field in [("previous", "Days Since Last Letter"), ("next", "Days Until Next Letter")]:
            if field not in temp:
                continue
            days_str = temp[field]
            # Extract number
            days_m = re.search(r'(\d+)\s*(?:days?)?', days_str)
            if not days_m:
                continue
            claimed_days = int(days_m.group(1))

            # Find the referenced letter
            refs = prev_next_chain.get(doc_id, {})
            ref_id = refs.get(direction)
            if ref_id and ref_id in letter_dates:
                ref_date = letter_dates[ref_id]
                actual_days = abs((my_date - ref_date).days)
                if actual_days != claimed_days and abs(actual_days - claimed_days) > 1:
                    temporal_issues.append(
                        f"{doc_id}: {field} claims {claimed_days} days, actual gap to {ref_id} is {actual_days} days")

    results["chain_issues"] = chain_issues
    results["temporal_issues"] = temporal_issues

    # ── Collection statistics ──
    results["total_people_unique"] = len(all_people)
    results["total_places_unique"] = len(all_places)
    results["people_counts"] = {name: len(ids) for name, ids in sorted(all_people.items(), key=lambda x: -len(x[1]))[:50]}
    results["all_people"] = dict(all_people)
    results["all_places"] = {f"{w} → {m}": ids for (w, m), ids in all_places.items()}

    return results


# ─── Report Generation ────────────────────────────────────────────────────────

def generate_report(schema_violations, json_issues, json_missing, json_drifts, cross_results):
    """Generate a markdown report."""
    lines = []
    lines.append("# Metadata Quality Evaluation Report")
    lines.append(f"\n*Generated: {date.today().isoformat()}*\n")

    # ── Summary ──
    total_files = len(schema_violations)
    files_with_violations = sum(1 for v in schema_violations.values() if v)
    total_violations = sum(len(v) for v in schema_violations.values())

    lines.append("## Executive Summary\n")
    lines.append(f"| Metric | Value |")
    lines.append(f"|--------|-------|")
    lines.append(f"| Total letters scanned | {total_files} |")
    lines.append(f"| Letters with schema violations | {files_with_violations} |")
    lines.append(f"| Total schema violations | {total_violations} |")
    lines.append(f"| JSON value drifts | {len(json_drifts)} |")
    lines.append(f"| JSON missing field categories | {len(json_missing)} |")
    lines.append(f"| Cross-ref chain issues | {len(cross_results.get('chain_issues', []))} |")
    lines.append(f"| Temporal calculation issues | {len(cross_results.get('temporal_issues', []))} |")
    lines.append(f"| Unique people across corpus | {cross_results.get('total_people_unique', 0)} |")
    lines.append(f"| Unique places across corpus | {cross_results.get('total_places_unique', 0)} |")
    lines.append(f"| Name variant groups | {len(cross_results.get('name_variants', {}))} |")
    lines.append(f"| Place inconsistencies | {len(cross_results.get('place_inconsistencies', {}))} |")
    lines.append("")

    # ── Part 1: Schema Violations ──
    lines.append("---\n")
    lines.append("## Part 1: Schema Compliance\n")

    # Aggregate by violation type
    by_type = defaultdict(list)
    for doc_id, viols in sorted(schema_violations.items()):
        for vtype, field, msg in viols:
            by_type[vtype].append((doc_id, field, msg))

    for vtype in ["MISSING_FIELD", "MISSING_SECTION", "INVALID_ENUM", "MISSING_FLAG",
                   "BROKEN_XREF", "DATE_MISMATCH", "UNKNOWN_AUTHOR"]:
        items = by_type.get(vtype, [])
        if not items:
            continue
        lines.append(f"### {vtype} ({len(items)} issues)\n")

        if vtype == "INVALID_ENUM":
            lines.append("| File | Field | Issue |")
            lines.append("|------|-------|-------|")
            for doc_id, field, msg in items:
                lines.append(f"| `{doc_id}` | {field} | {msg} |")
        elif vtype == "MISSING_FLAG":
            # Summarize by flag name
            flag_counts = Counter(field for _, field, _ in items)
            lines.append("| Missing Flag | Count |")
            lines.append("|-------------|-------|")
            for flag, count in flag_counts.most_common():
                lines.append(f"| {flag} | {count} |")
            lines.append(f"\n*Affects {len(set(d for d, _, _ in items))} letters with complete flag tables.*")
        elif vtype == "MISSING_FIELD":
            field_counts = Counter(field for _, field, _ in items)
            lines.append("| Missing Field | Count | Sample Files |")
            lines.append("|--------------|-------|-------------|")
            for field, count in field_counts.most_common():
                samples = [d for d, f, _ in items if f == field][:3]
                lines.append(f"| {field} | {count} | {', '.join(f'`{s}`' for s in samples)} |")
        elif vtype == "MISSING_SECTION":
            section_counts = Counter(field for _, field, _ in items)
            lines.append("| Missing Section | Count |")
            lines.append("|----------------|-------|")
            for section, count in section_counts.most_common():
                lines.append(f"| {section} | {count} |")
        else:
            lines.append("| File | Field | Issue |")
            lines.append("|------|-------|-------|")
            for doc_id, field, msg in items[:50]:
                lines.append(f"| `{doc_id}` | {field} | {msg} |")
            if len(items) > 50:
                lines.append(f"\n*...and {len(items) - 50} more*")
        lines.append("")

    if not any(by_type.values()):
        lines.append("**No schema violations found.**\n")

    # ── Part 2: JSON Fidelity ──
    lines.append("---\n")
    lines.append("## Part 2: JSON Fidelity\n")

    if json_issues:
        lines.append("### Coverage Issues\n")
        lines.append("| Type | ID | Detail |")
        lines.append("|------|-----|--------|")
        for itype, iid, msg in json_issues:
            lines.append(f"| {itype} | `{iid}` | {msg} |")
        lines.append("")

    lines.append("### Fields Present in Markdown but Missing from JSON\n")
    lines.append("*These are data categories that exist in the markdown source but have no representation in `all-letters.json`.*\n")
    lines.append("| Field Category | Letters Affected | % of Corpus |")
    lines.append("|---------------|-----------------|-------------|")
    for field, count in json_missing.most_common():
        pct = count / total_files * 100
        lines.append(f"| {field} | {count} | {pct:.0f}% |")
    lines.append("")

    if json_drifts:
        lines.append("### Value Drift (JSON ≠ Markdown)\n")
        lines.append("| File | Field | Discrepancy |")
        lines.append("|------|-------|-------------|")
        for doc_id, field, msg in json_drifts[:100]:
            lines.append(f"| `{doc_id}` | {field} | {msg} |")
        if len(json_drifts) > 100:
            lines.append(f"\n*...and {len(json_drifts) - 100} more*")
        lines.append("")

    # ── Part 3: Cross-Collection Consistency ──
    lines.append("---\n")
    lines.append("## Part 3: Cross-Collection Consistency\n")

    # Name variants
    variants = cross_results.get("name_variants", {})
    if variants:
        lines.append("### People Name Variants\n")
        lines.append("*Surnames with multiple variant spellings/titles that may refer to the same person:*\n")
        lines.append("| Surname | Variants |")
        lines.append("|---------|----------|")
        for surname, vars_list in sorted(variants.items()):
            lines.append(f"| {surname} | {', '.join(vars_list)} |")
        lines.append("")

    # Place inconsistencies
    place_issues = cross_results.get("place_inconsistencies", {})
    if place_issues:
        lines.append("### Place Name Inconsistencies\n")
        lines.append("*Same written name mapped to different modern identifications:*\n")
        lines.append("| As Written | Modern Identifications |")
        lines.append("|-----------|----------------------|")
        for written, moderns in sorted(place_issues.items()):
            lines.append(f"| {written} | {' / '.join(moderns)} |")
        lines.append("")

    # Chain issues
    chain = cross_results.get("chain_issues", [])
    if chain:
        lines.append("### Cross-Reference Chain Issues\n")
        for issue in chain:
            lines.append(f"- {issue}")
        lines.append("")

    # Temporal issues
    temporal = cross_results.get("temporal_issues", [])
    if temporal:
        lines.append("### Temporal Calculation Issues\n")
        for issue in temporal:
            lines.append(f"- {issue}")
        lines.append("")

    # Top people
    people_counts = cross_results.get("people_counts", {})
    if people_counts:
        lines.append("### Most Frequently Mentioned People (Top 30)\n")
        lines.append("| Name | Letter Count |")
        lines.append("|------|-------------|")
        for name, count in list(people_counts.items())[:30]:
            lines.append(f"| {name} | {count} |")
        lines.append("")

    # ── Recommendations ──
    lines.append("---\n")
    lines.append("## Recommendations\n")
    lines.append("### HIGH Priority\n")
    if json_missing:
        lines.append("1. **Expand `scripts/parse_all_letters.py`** to extract all missing field categories listed above")
        lines.append("   - All 15 event flags (not just 4)")
        lines.append("   - Confidence metadata")
        lines.append("   - Place coordinates")
        lines.append("   - Cross-references (prev/next)")
        lines.append("   - Military references")
        lines.append("   - Temporal context")
        lines.append("   - Health & condition")
        lines.append("   - Domestic/home front")
        lines.append("   - Objects & material culture")
    if any(vtype == "INVALID_ENUM" for vtype in by_type):
        lines.append("2. **Standardize non-conforming enum values** across affected files")

    lines.append("\n### MEDIUM Priority\n")
    if variants:
        lines.append(f"3. **Build people registry** — {len(variants)} surname groups need canonical resolution")
    if place_issues:
        lines.append(f"4. **Build places gazetteer** — {len(place_issues)} place names have inconsistent identifications")
    lines.append("5. **Add CI-style validation** — run this script before JSON regeneration")

    lines.append("\n### LOW Priority\n")
    lines.append("6. **Move HTML visualizations** from project root into `05-web-app/`")

    return '\n'.join(lines)


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    print("=" * 70)
    print("HUBBELL CIVIL WAR LETTER COLLECTION — METADATA QUALITY EVALUATION")
    print("=" * 70)

    # Gather all letter files
    md_files = sorted(glob.glob(os.path.join(LETTERS_DIR, "LTR-*.md")))
    print(f"\nFound {len(md_files)} letter files")

    all_doc_ids = {os.path.basename(f).replace('.md', '') for f in md_files}

    # ── Part 1: Schema Compliance ──
    print("\n-- Part 1: Schema Compliance --")
    schema_violations = {}
    for md_file in md_files:
        doc_id = os.path.basename(md_file).replace('.md', '')
        with open(md_file, 'r', encoding='utf-8') as f:
            text = f.read()
        violations = validate_schema(md_file, text, all_doc_ids)
        schema_violations[doc_id] = violations

    files_with_issues = sum(1 for v in schema_violations.values() if v)
    total_issues = sum(len(v) for v in schema_violations.values())
    print(f"  {files_with_issues} files with violations, {total_issues} total violations")

    # Quick breakdown
    type_counts = Counter()
    for viols in schema_violations.values():
        for vtype, _, _ in viols:
            type_counts[vtype] += 1
    for vtype, count in type_counts.most_common():
        print(f"    {vtype}: {count}")

    # ── Part 2: JSON Fidelity ──
    print("\n-- Part 2: JSON Fidelity --")
    json_data = []
    if os.path.exists(JSON_FILE):
        with open(JSON_FILE, 'r', encoding='utf-8') as f:
            json_data = json.load(f)
        print(f"  Loaded {len(json_data)} entries from all-letters.json")
    else:
        print("  WARNING: all-letters.json not found!")

    json_issues, json_missing, json_drifts = check_json_fidelity(json_data, md_files)
    print(f"  Coverage issues: {len(json_issues)}")
    print(f"  Missing field categories: {len(json_missing)}")
    print(f"  Value drifts: {len(json_drifts)}")
    for field, count in json_missing.most_common(5):
        print(f"    {field}: {count} letters")

    # ── Part 3: Cross-Collection ──
    print("\n-- Part 3: Cross-Collection Consistency --")
    cross_results = check_cross_collection(md_files)
    print(f"  Unique people: {cross_results['total_people_unique']}")
    print(f"  Unique places: {cross_results['total_places_unique']}")
    print(f"  Name variant groups: {len(cross_results.get('name_variants', {}))}")
    print(f"  Place inconsistencies: {len(cross_results.get('place_inconsistencies', {}))}")
    print(f"  Chain issues: {len(cross_results.get('chain_issues', []))}")
    print(f"  Temporal issues: {len(cross_results.get('temporal_issues', []))}")

    # ── Generate Report ──
    print("\n-- Generating Report --")
    report = generate_report(schema_violations, json_issues, json_missing, json_drifts, cross_results)

    os.makedirs(os.path.dirname(REPORT_FILE), exist_ok=True)
    with open(REPORT_FILE, 'w', encoding='utf-8') as f:
        f.write(report)
    print(f"  Report written to {REPORT_FILE}")
    print(f"  Report size: {len(report)} chars")

    # Also write raw data for programmatic use
    raw_data = {
        "schema_violations": {k: v for k, v in schema_violations.items() if v},
        "json_issues": json_issues,
        "json_missing_fields": dict(json_missing),
        "json_value_drifts": json_drifts,
        "name_variants": cross_results.get("name_variants", {}),
        "place_inconsistencies": cross_results.get("place_inconsistencies", {}),
        "chain_issues": cross_results.get("chain_issues", []),
        "temporal_issues": cross_results.get("temporal_issues", []),
        "people_counts": cross_results.get("people_counts", {}),
    }
    raw_file = os.path.join(BASE_DIR, "04-analysis", "validation-raw.json")
    with open(raw_file, 'w', encoding='utf-8') as f:
        json.dump(raw_data, f, indent=2, ensure_ascii=False, default=str)
    print(f"  Raw data written to {raw_file}")

    print("\n" + "=" * 70)
    print("DONE")


if __name__ == "__main__":
    main()
