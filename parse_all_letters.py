#!/usr/bin/env python
"""
Parse all 274 markdown letter files into the JSON format used by hubbell-dashboard.html.
Outputs: 03-data/all-letters.json

v2: Expanded to extract all 15 event flags, confidence metadata, coordinates,
    cross-references, military references, temporal context, health/condition,
    domestic/home front, and objects/material culture.
"""
import os, re, json, glob

LETTERS_DIR = os.path.join(os.path.dirname(__file__), "02-transcribed-markdown", "letters")
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), "03-data", "all-letters.json")

# Author name normalization
AUTHOR_MAP = {
    "henry hubbell": "henry",
    "henry": "henry",
    "alexander hubbell": "alexander",
    "alexander f. hubbell": "alexander",
    "alex hubbell": "alexander",
    "alexander": "alexander",
    "alex": "alexander",
    "james hubbell": "james",
    "james": "james",
    "charles hubbell": "charles",
    "charles": "charles",
    "mrs. hubbell (mother)": "mother",
    "mrs. hubbell": "mother",
    "mother": "mother",
    "frances m. hubbell": "mother",
    "frances hubbell": "mother",
    "mrs. f. hubbell": "mother",
    "mrs. frances hubbell": "mother",
    "r.w. mcdonald": "mcdonald",
    "amos c. luther": "luther",
    "mary j. mcneil": "mcneil",
}

AUTHOR_DISPLAY = {
    "henry": "Henry",
    "alexander": "Alexander",
    "james": "James",
    "charles": "Charles",
    "mother": "Mother",
    "mcdonald": "R.W. McDonald",
    "luther": "Amos C. Luther",
    "mcneil": "Mary J. McNeil",
}

# Canonical event flag names and their JSON keys
EVENT_FLAG_MAP = {
    "Battle/combat described": "hasBattle",
    "Battle": "hasBattle",
    "Death reported": "hasDeath",
    "Death": "hasDeath",
    "Wound/injury reported": "hasWound",
    "Wound": "hasWound",
    "Illness reported": "hasIllness",
    "Illness": "hasIllness",
    "Promotion/demotion": "hasPromotion",
    "Promotion": "hasPromotion",
    "Capture/POW": "hasCapture",
    "Capture": "hasCapture",
    "Desertion mentioned": "hasDesertion",
    "Desertion": "hasDesertion",
    "Discharge/muster-out": "hasDischarge",
    "Discharge": "hasDischarge",
    "Major news from home": "hasHomeNews",
    "Political commentary": "hasPolitical",
    "Morale crisis": "hasMoraleCrisis",
    "Request for supplies/money": "hasSupplyRequest",
    "Receipt of package/letter": "hasReceipt",
    "Camp movement/march": "hasCampMovement",
    "Eyewitness to named event": "hasEyewitness",
}

ALL_FLAG_KEYS = sorted(set(EVENT_FLAG_MAP.values()))


def extract_metadata_field(text, field_name):
    """Extract a value from a markdown metadata table row like | **Field** | Value | ..."""
    pattern = rf'\|\s*\*\*{re.escape(field_name)}\*\*\s*\|\s*(.*?)\s*\|'
    m = re.search(pattern, text, re.IGNORECASE)
    if m:
        val = m.group(1).strip()
        val = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', val)
        val = val.replace('`', '')
        return val
    return ""


def extract_metadata_confidence(text, field_name):
    """Extract the confidence column value for a metadata field."""
    pattern = rf'\|\s*\*\*{re.escape(field_name)}\*\*\s*\|[^|]*\|\s*(.*?)\s*\|'
    m = re.search(pattern, text, re.IGNORECASE)
    if m:
        val = m.group(1).strip().replace('`', '')
        if val and val != '—' and val != '-':
            return val
    return None


def extract_date(text):
    """Extract date from the Date Written field. Handle corrected dates."""
    date_str = extract_metadata_field(text, "Date Written")
    if not date_str:
        date_str = extract_metadata_field(text, "Date")

    corrected = re.search(r'\*\*(\w+ \d{1,2},?\s*\d{4})\*\*', date_str)
    date_candidates = []
    if corrected:
        date_candidates.append(corrected.group(1))
    date_candidates.append(date_str)

    for candidate in date_candidates:
        m = re.search(r'(\w+)\s+(\d{1,2}),?\s*(\d{4})', candidate)
        if m:
            month_name, day, year = m.group(1), m.group(2), m.group(3)
            months = {"january":1,"february":2,"march":3,"april":4,"may":5,"june":6,
                      "july":7,"august":8,"september":9,"october":10,"november":11,"december":12}
            month_num = months.get(month_name.lower())
            if month_num:
                return int(year), month_num, int(day)

    return None, None, None


def extract_date_from_id(doc_id):
    """Extract date components from document ID like LTR-1862-09-21-002"""
    m = re.match(r'LTR-(\d{4})-(\d{2})-(\d{2})', doc_id)
    if m:
        return int(m.group(1)), int(m.group(2)), int(m.group(3))
    return None, None, None


def extract_significance(text):
    m = re.search(r'###\s*Historical\s+Significance:\s*`([^`]+)`', text)
    return m.group(1).strip() if m else "routine"


def extract_emotion(text):
    m = re.search(r'###\s*Emotional\s+Intensity:\s*`([^`]+)`', text)
    return m.group(1).strip() if m else "low"


def extract_event_flags(text):
    """Extract all 15 event flags from the Event Flags table.

    Returns dict with all flag JSON keys set to True/False,
    plus a 'flagDetails' dict mapping active flags to their detail text.
    """
    flags = {key: False for key in ALL_FLAG_KEYS}
    details = {}

    section_m = re.search(r'### Event Flags(.*?)(?=\n---|\n##[^#])', text, re.DOTALL)
    if not section_m:
        return flags, details

    section = section_m.group(1)

    for line in section.split('\n'):
        line = line.strip()
        if not line.startswith('|'):
            continue

        # Extract flag name from bold
        flag_match = re.search(r'\*\*(.+?)\*\*', line)
        if not flag_match:
            continue
        flag_name = flag_match.group(1).strip()
        json_key = EVENT_FLAG_MAP.get(flag_name)
        if not json_key:
            continue

        # Parse cells
        cells = [c.strip() for c in line.split('|')]
        cells = [c for c in cells if c]
        if len(cells) < 2:
            continue

        present_val = cells[1].strip().lower()
        if present_val == 'yes' or 'yes' in present_val:
            flags[json_key] = True
            # Extract detail (third column if present)
            if len(cells) >= 3:
                detail = cells[2].strip()
                if detail and detail != '—':
                    details[json_key] = detail

    return flags, details


def extract_transcription(text):
    m = re.search(r'## Full Transcription\s*\n(.*?)(?=\n---)', text, re.DOTALL)
    if not m:
        return ""
    raw = m.group(1).strip()
    lines = []
    for line in raw.split('\n'):
        line = re.sub(r'^>\s?', '', line)
        lines.append(line)
    return '\n'.join(lines).strip()


def extract_sig_summary(text):
    m = re.search(r'### Historical Significance:\s*`[^`]+`\s*\n\s*\n>\s*(.*?)(?=\n\n|\n###)', text, re.DOTALL)
    if m:
        raw = m.group(1).strip()
        lines = []
        for line in raw.split('\n'):
            line = re.sub(r'^>\s?', '', line)
            lines.append(line)
        return ' '.join(lines).strip()
    return ""


def extract_editorial(text):
    m = re.search(r'## Editorial Notes\s*\n(.*?)(?=\n---|\n## |\Z)', text, re.DOTALL)
    if m:
        raw = m.group(1).strip()
        lines = []
        for line in raw.split('\n'):
            line = re.sub(r'^>\s?', '', line)
            lines.append(line)
        return '\n'.join(lines).strip()
    return ""


def extract_people(text):
    people = []
    m = re.search(r'### People Mentioned\s*\n(.*?)(?=\n###|\n---|\n## )', text, re.DOTALL)
    if not m:
        return people
    section = m.group(1)
    for line in section.split('\n'):
        line = line.strip()
        if not line.startswith('|'):
            continue
        cells = [c.strip() for c in line.split('|')]
        cells = [c for c in cells if c]
        if len(cells) < 2:
            continue
        name = cells[0]
        role = cells[1]
        if name.startswith('---') or name.startswith('Name') or name.startswith('**'):
            continue
        if role.startswith('---') or role.startswith('Role'):
            continue
        if name.startswith('`') or 'First Mention' in name:
            continue
        if name and name != '—':
            confidence = cells[2] if len(cells) > 2 else ""
            first_mention = cells[3].strip().lower() if len(cells) > 3 else ""
            entry = {"name": name, "role": role}
            if confidence and confidence != '---':
                entry["confidence"] = confidence.replace('`', '')
            if first_mention in ('yes', 'no'):
                entry["firstMention"] = first_mention == 'yes'
            people.append(entry)
    return people


def extract_places(text):
    places = []
    m = re.search(r'### Places Mentioned\s*\n(.*?)(?=\n###|\n---|\n## )', text, re.DOTALL)
    if not m:
        return places
    section = m.group(1)
    for line in section.split('\n'):
        line = line.strip()
        if not line.startswith('|'):
            continue
        cells = [c.strip() for c in line.split('|')]
        cells = [c for c in cells if c]
        if len(cells) < 2:
            continue
        written = cells[0]
        modern = cells[1]
        if written.startswith('---') or written.startswith('Place') or written.startswith('**'):
            continue
        if modern.startswith('---') or modern.startswith('Modern'):
            continue
        if written.startswith('`') or written == '—':
            continue
        if written:
            entry = {"written": written, "modern": modern}
            # Extract coordinates (3rd column)
            if len(cells) > 2:
                coords = cells[2].strip()
                if coords and coords != '—' and coords != '-':
                    # Try to parse lat, lon
                    coord_m = re.search(r'(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)', coords)
                    if coord_m:
                        entry["lat"] = float(coord_m.group(1))
                        entry["lon"] = float(coord_m.group(2))
            # Extract confidence (4th column)
            if len(cells) > 3:
                conf = cells[3].strip().replace('`', '')
                if conf and conf != '—' and conf != '---':
                    entry["confidence"] = conf
            places.append(entry)
    return places


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
        value = cells[1]
        # Extract bold field names
        bold_m = re.search(r'\*\*(.+?)\*\*', detail)
        if bold_m:
            field = bold_m.group(1)
        else:
            field = detail
        if field.startswith('---') or field == 'Detail':
            continue
        if value.startswith('---') or value == 'Value':
            continue
        if field and value and value != '—':
            entries.append({"field": field, "value": value})
    return entries


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
        if who.startswith('---') or who.startswith('Who') or who == '**':
            continue
        if who and who != '—':
            entry = {"who": who, "type": cells[1], "detail": cells[2]}
            if len(cells) > 3:
                conf = cells[3].strip().replace('`', '')
                if conf and conf != '—' and conf != '---':
                    entry["confidence"] = conf
            entries.append(entry)
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
        if topic.startswith('---') or topic.startswith('Topic') or topic == '**':
            continue
        if topic and topic != '—':
            entries.append({"topic": topic, "detail": cells[1]})
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


def extract_temporal(text):
    """Extract temporal context fields."""
    temporal = {}
    m = re.search(r'## Temporal Context\s*\n(.*?)(?=\n---|\n## |\Z)', text, re.DOTALL)
    if not m:
        return temporal
    section = m.group(1)

    field_map = {
        "War Year": "warYear",
        "Campaign Period": "campaignPeriod",
        "Known Battles .30 Days": "nearbyBattles",
        "Season/Weather": "season",
        "Days Since Last Letter": "daysSinceLast",
        "Days Until Next Letter": "daysUntilNext",
    }

    for md_field, json_key in field_map.items():
        fm = re.search(rf'\*\*{re.escape(md_field)}\*\*\s*\|\s*(.*?)\s*\|', section)
        if not fm:
            # Try without escaping the ± character
            if md_field == "Known Battles .30 Days":
                fm = re.search(r'\*\*Known Battles.*?\*\*\s*\|\s*(.*?)\s*\|', section)
        if fm:
            val = fm.group(1).strip()
            if val and val != '—' and val != '-':
                temporal[json_key] = val
    return temporal


def extract_cross_refs(text):
    """Extract cross-reference links."""
    refs = {}
    prev_m = re.search(r'\*\*Previous letter:\*\*\s*`?(LTR-[\d-]+)`?', text)
    next_m = re.search(r'\*\*Next letter:\*\*\s*`?(LTR-[\d-]+)`?', text)
    related_m = re.search(r'\*\*Related letters.*?\*\*\s*(.*?)(?=\n-|\n\n|\n###|\Z)', text)
    if prev_m:
        refs['previous'] = prev_m.group(1)
    if next_m:
        refs['next'] = next_m.group(1)
    if related_m:
        related_text = related_m.group(1).strip()
        related_ids = re.findall(r'(LTR-[\d-]+)', related_text)
        if related_ids:
            refs['related'] = related_ids
    return refs


def normalize_author(author_str):
    """Map author string to normalized key"""
    if not author_str:
        return "unknown"

    cleaned = author_str.lower().strip()
    cleaned = re.sub(r'\s*\(.*?\)\s*', ' ', cleaned).strip()
    cleaned = re.sub(r'\s*\|.*$', '', cleaned).strip()

    if cleaned in AUTHOR_MAP:
        return AUTHOR_MAP[cleaned]

    for key, val in AUTHOR_MAP.items():
        if key in cleaned or cleaned in key:
            return val

    for name in ["henry", "alexander", "alex", "james", "charles"]:
        if name in cleaned:
            return AUTHOR_MAP.get(name, "unknown")

    if "mother" in cleaned or "mrs" in cleaned or "frances" in cleaned:
        return "mother"

    return "unknown"


def parse_letter(filepath):
    """Parse a single markdown letter file into the expanded JSON format."""
    with open(filepath, 'r', encoding='utf-8') as f:
        text = f.read()

    filename = os.path.basename(filepath)
    doc_id = filename.replace('.md', '')

    # Core metadata
    author_raw = extract_metadata_field(text, "Author")
    author_key = normalize_author(author_raw)
    author_name = AUTHOR_DISPLAY.get(author_key, author_raw.split('(')[0].strip() if author_raw else "Unknown")

    recipient = extract_metadata_field(text, "Recipient")
    location = extract_metadata_field(text, "Author Location")
    recipient_location = extract_metadata_field(text, "Recipient Location")
    direction = extract_metadata_field(text, "Direction")

    notes = ""
    id_row = re.search(r'\|\s*\*\*Document ID\*\*\s*\|\s*.*?\s*\|\s*.*?\s*\|\s*(.*?)\s*\|', text)
    if id_row:
        notes = id_row.group(1).strip()

    # Date
    year, month, day = extract_date(text)
    if year is None:
        year, month, day = extract_date_from_id(doc_id)
    if year is None:
        print(f"  WARNING: Could not extract date from {filename}")
        return None

    date_str = f"{year}-{month:02d}-{day:02d}"

    # Significance & emotion
    significance = extract_significance(text)
    emotion = extract_emotion(text)
    sig_summary = extract_sig_summary(text)

    # Event flags (all 15)
    flags, flag_details = extract_event_flags(text)

    # Content
    transcription = extract_transcription(text)
    editorial = extract_editorial(text)

    # Content tags
    people = extract_people(text)
    places = extract_places(text)
    military_refs = extract_military_refs(text)
    health = extract_health(text)
    domestic = extract_domestic(text)
    objects = extract_objects(text)

    # Temporal & cross-references
    temporal = extract_temporal(text)
    cross_refs = extract_cross_refs(text)

    # Confidence for key fields
    confidence = {}
    for field in ["Date Written", "Author", "Author Location", "Direction"]:
        conf = extract_metadata_confidence(text, field)
        if conf:
            confidence[field.lower().replace(' ', '_')] = conf

    result = {
        # Core (backward-compatible with v1)
        "id": doc_id,
        "date": date_str,
        "year": year,
        "month": month,
        "day": day,
        "author": author_key,
        "authorName": author_name,
        "recipient": recipient,
        "location": location,
        "significance": significance,
        "emotion": emotion,
        "notes": notes,
        # Original 4 event flags (backward-compatible)
        "hasBattle": flags.get("hasBattle", False),
        "hasIllness": flags.get("hasIllness", False),
        "hasDeath": flags.get("hasDeath", False),
        "hasWound": flags.get("hasWound", False),
        # Content (backward-compatible)
        "transcription": transcription,
        "editorial": editorial,
        "sigSummary": sig_summary,
        "people": people,
        "places": places,
        # ── NEW in v2 ──
        # Additional event flags
        "hasPromotion": flags.get("hasPromotion", False),
        "hasCapture": flags.get("hasCapture", False),
        "hasDesertion": flags.get("hasDesertion", False),
        "hasDischarge": flags.get("hasDischarge", False),
        "hasHomeNews": flags.get("hasHomeNews", False),
        "hasPolitical": flags.get("hasPolitical", False),
        "hasMoraleCrisis": flags.get("hasMoraleCrisis", False),
        "hasSupplyRequest": flags.get("hasSupplyRequest", False),
        "hasReceipt": flags.get("hasReceipt", False),
        "hasCampMovement": flags.get("hasCampMovement", False),
        "hasEyewitness": flags.get("hasEyewitness", False),
        # Flag details (only for active flags)
        "flagDetails": flag_details if flag_details else None,
        # Additional metadata
        "direction": direction if direction else None,
        "recipientLocation": recipient_location if recipient_location else None,
        # Rich content tags
        "militaryRefs": military_refs if military_refs else None,
        "health": health if health else None,
        "domestic": domestic if domestic else None,
        "objects": objects if objects else None,
        # Temporal context
        "temporal": temporal if temporal else None,
        # Cross-references
        "crossRefs": cross_refs if cross_refs else None,
        # Confidence metadata
        "confidence": confidence if confidence else None,
    }

    # Remove None values to keep JSON clean
    return {k: v for k, v in result.items() if v is not None}


def main():
    files = sorted(glob.glob(os.path.join(LETTERS_DIR, "LTR-*.md")))
    print(f"Found {len(files)} letter files")

    letters = []
    author_counts = {}
    errors = []

    for filepath in files:
        try:
            letter = parse_letter(filepath)
            if letter:
                letters.append(letter)
                a = letter["author"]
                author_counts[a] = author_counts.get(a, 0) + 1
            else:
                errors.append(os.path.basename(filepath))
        except Exception as e:
            print(f"  ERROR parsing {os.path.basename(filepath)}: {e}")
            errors.append(os.path.basename(filepath))

    # Sort by date
    letters.sort(key=lambda l: l["date"])

    print(f"\nParsed {len(letters)} letters successfully")
    print(f"Errors: {len(errors)}")
    if errors:
        print(f"  Failed files: {errors}")
    print(f"\nAuthor breakdown:")
    for author, count in sorted(author_counts.items(), key=lambda x: -x[1]):
        print(f"  {author}: {count}")
    print(f"\nDate range: {letters[0]['date']} to {letters[-1]['date']}")

    # Count new field coverage
    new_fields = ["hasPromotion", "hasCapture", "hasDesertion", "hasDischarge",
                  "hasHomeNews", "hasPolitical", "hasMoraleCrisis", "hasSupplyRequest",
                  "hasReceipt", "hasCampMovement", "hasEyewitness"]
    new_flag_counts = {f: sum(1 for l in letters if l.get(f, False)) for f in new_fields}
    print(f"\nNew event flag counts:")
    for flag, count in sorted(new_flag_counts.items(), key=lambda x: -x[1]):
        if count > 0:
            print(f"  {flag}: {count}")

    content_fields = ["militaryRefs", "health", "domestic", "objects", "temporal", "crossRefs", "confidence"]
    print(f"\nNew content field coverage:")
    for field in content_fields:
        count = sum(1 for l in letters if field in l)
        pct = count / len(letters) * 100
        print(f"  {field}: {count} ({pct:.0f}%)")

    # Write output
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(letters, f, indent=2, ensure_ascii=False)

    print(f"\nWritten to {OUTPUT_FILE}")
    print(f"File size: {os.path.getsize(OUTPUT_FILE) / 1024:.0f} KB")


if __name__ == "__main__":
    main()
