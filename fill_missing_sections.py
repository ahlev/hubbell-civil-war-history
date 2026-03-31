#!/usr/bin/env python
"""
Fill missing Places Mentioned and Temporal Context sections across letter files.

Places: Extracts from Author Location, Recipient Location, and transcription date lines.
Temporal: Computes War Year, Campaign Period, and Days Since/Until from letter dates.
"""
import os, re, glob, json
from datetime import date

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LETTERS_DIR = os.path.join(BASE_DIR, "02-transcribed-markdown", "letters")

# ─── Known campaign periods ───────────────────────────────────────────────────
CAMPAIGNS = [
    (date(1861, 4, 12), date(1861, 7, 31), "Initial mobilization"),
    (date(1861, 8, 1), date(1861, 12, 31), "Early defensive operations"),
    (date(1862, 1, 1), date(1862, 3, 31), "Winter quarters / Upper Potomac"),
    (date(1862, 4, 1), date(1862, 7, 1), "Peninsula Campaign"),
    (date(1862, 7, 2), date(1862, 9, 1), "Northern Virginia Campaign"),
    (date(1862, 9, 2), date(1862, 9, 30), "Maryland Campaign (Antietam)"),
    (date(1862, 10, 1), date(1862, 12, 31), "Fredericksburg Campaign"),
    (date(1863, 1, 1), date(1863, 4, 30), "Winter quarters (Mud March period)"),
    (date(1863, 5, 1), date(1863, 5, 31), "Chancellorsville Campaign"),
    (date(1863, 6, 1), date(1863, 7, 31), "Gettysburg Campaign"),
    (date(1863, 8, 1), date(1863, 9, 30), "Transfer to Western Theater"),
    (date(1863, 10, 1), date(1863, 12, 31), "Chattanooga Campaign"),
    (date(1864, 1, 1), date(1864, 4, 30), "Winter quarters / reorganization"),
    (date(1864, 5, 1), date(1864, 9, 1), "Atlanta Campaign"),
    (date(1864, 9, 2), date(1864, 12, 31), "Shenandoah / March to the Sea"),
    (date(1865, 1, 1), date(1865, 4, 9), "Final campaigns"),
    (date(1865, 4, 10), date(1865, 12, 31), "Post-war occupation / muster-out"),
]


def extract_field(text, field_name):
    pattern = rf'\|\s*\*\*{re.escape(field_name)}\*\*\s*\|\s*(.*?)\s*\|'
    m = re.search(pattern, text, re.IGNORECASE)
    if m:
        val = m.group(1).strip().replace('`', '')
        return val
    return ""


def has_section(text, heading):
    return bool(re.search(rf'###?\s+{re.escape(heading)}', text))


def parse_letter_date(doc_id, text):
    """Get the letter's date."""
    date_str = extract_field(text, "Date Written")
    # Try corrected date first
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

    # Fallback: from ID
    m = re.match(r'LTR-(\d{4})-(\d{2})-(\d{2})', doc_id)
    if m:
        try:
            return date(int(m.group(1)), int(m.group(2)), int(m.group(3)))
        except ValueError:
            pass
    return None


def get_war_year(d):
    if d.year == 1861:
        return "1st"
    elif d.year == 1862:
        return "2nd"
    elif d.year == 1863:
        return "3rd"
    elif d.year == 1864:
        return "4th"
    elif d.year == 1865:
        if d.month <= 4:
            return "4th (final)"
        return "Post-war"
    return "Post-war"


def get_campaign(d):
    for start, end, name in CAMPAIGNS:
        if start <= d <= end:
            return name
    return "Unknown"


def build_places_section(text):
    """Build a Places Mentioned section from available metadata."""
    author_loc = extract_field(text, "Author Location")
    recipient_loc = extract_field(text, "Recipient Location")

    places = []

    if author_loc and author_loc not in ('—', '-', ''):
        # Clean up location string
        loc = re.sub(r'\s*\|.*$', '', author_loc)  # remove trailing pipe content
        loc = re.sub(r'\s*\(.*?\)\s*', '', loc).strip()  # remove parenthetical
        if loc:
            places.append((loc, loc, "Author location"))

    if recipient_loc and recipient_loc not in ('—', '-', ''):
        loc = re.sub(r'\s*\|.*$', '', recipient_loc)
        loc = re.sub(r'\s*\(.*?\)\s*', '', loc).strip()
        if loc:
            places.append((loc, loc, "Recipient location"))

    if not places:
        return None

    lines = [
        "### Places Mentioned",
        "",
        "| Place as Written | Modern Identification | Coordinates | Confidence |",
        "|-----------------|----------------------|-------------|------------|",
    ]
    for written, modern, note in places:
        lines.append(f"| {written} | {modern} | — | `stated · clear · definite` |")

    return "\n".join(lines)


def build_temporal_section(d, all_dates, doc_id):
    """Build a Temporal Context section from computed values."""
    war_year = get_war_year(d)
    campaign = get_campaign(d)

    # Find previous and next letter dates
    sorted_dates = sorted(all_dates.items(), key=lambda x: x[1])
    my_idx = None
    for i, (did, dt) in enumerate(sorted_dates):
        if did == doc_id:
            my_idx = i
            break

    days_since = "Unknown"
    days_until = "Unknown"

    if my_idx is not None:
        if my_idx > 0:
            prev_id, prev_date = sorted_dates[my_idx - 1]
            gap = (d - prev_date).days
            days_since = f"{gap} days (since `{prev_id}`)"
        else:
            days_since = "First letter in collection"

        if my_idx < len(sorted_dates) - 1:
            next_id, next_date = sorted_dates[my_idx + 1]
            gap = (next_date - d).days
            days_until = f"{gap} days (until `{next_id}`)"
        else:
            days_until = "Last letter in collection"

    lines = [
        "## Temporal Context",
        "",
        "| Field | Value | Confidence |",
        "|-------|-------|------------|",
        f"| **War Year** | {war_year} | `certain` |",
        f"| **Campaign Period** | {campaign} | `external · n/a · n/a` |",
        f"| **Days Since Last Letter** | {days_since} | `calculated` |",
        f"| **Days Until Next Letter** | {days_until} | `calculated` |",
    ]

    return "\n".join(lines)


def insert_section(text, section_content, before_heading, level="###"):
    """Insert a section before a given heading."""
    # Try to insert before the target heading
    pattern = rf'\n({level}\s+{re.escape(before_heading)})'
    m = re.search(pattern, text)
    if m:
        return text[:m.start()] + "\n\n" + section_content + "\n\n" + text[m.start()+1:]

    # Try before "---" that separates sections
    # Find the last "---" before the end
    return text  # Can't find insertion point


def insert_temporal(text, temporal_content):
    """Insert Temporal Context before Cross-Reference Notes or Editorial Notes."""
    for heading in ["## Cross-Reference Notes", "## Editorial Notes"]:
        m = re.search(rf'\n({re.escape(heading)})', text)
        if m:
            return text[:m.start()] + "\n\n---\n\n" + temporal_content + "\n" + text[m.start():]

    # Append before end
    return text.rstrip() + "\n\n---\n\n" + temporal_content + "\n"


def insert_places(text, places_content):
    """Insert Places Mentioned after People Mentioned or in Content Tags area."""
    for heading in ["### Military References", "### Health & Condition",
                     "### Domestic/Home Front", "### Objects & Material Culture"]:
        m = re.search(rf'\n({re.escape(heading)})', text)
        if m:
            return text[:m.start()] + "\n\n" + places_content + "\n" + text[m.start():]

    # Try after People Mentioned section
    m = re.search(r'(### People Mentioned.*?)(\n---|\n## )', text, re.DOTALL)
    if m:
        end = m.end(1)
        # Find end of the people table
        return text[:end] + "\n\n" + places_content + text[end:]

    # Try before Temporal Context
    m = re.search(r'\n(## Temporal Context)', text)
    if m:
        return text[:m.start()] + "\n\n" + places_content + "\n" + text[m.start():]

    # Try before Cross-Reference Notes
    m = re.search(r'\n(## Cross-Reference Notes)', text)
    if m:
        return text[:m.start()] + "\n\n" + places_content + "\n" + text[m.start():]

    # Try before Editorial Notes
    m = re.search(r'\n(## Editorial Notes)', text)
    if m:
        return text[:m.start()] + "\n\n" + places_content + "\n" + text[m.start():]

    return text


def main():
    files = sorted(glob.glob(os.path.join(LETTERS_DIR, "LTR-*.md")))
    print(f"Found {len(files)} files")

    # First pass: collect all dates for temporal calculations
    all_dates = {}
    all_texts = {}
    for filepath in files:
        doc_id = os.path.basename(filepath).replace('.md', '')
        with open(filepath, 'r', encoding='utf-8') as f:
            text = f.read()
        all_texts[doc_id] = (filepath, text)
        d = parse_letter_date(doc_id, text)
        if d:
            all_dates[doc_id] = d

    # Second pass: fix missing sections
    places_added = 0
    temporal_added = 0

    for doc_id, (filepath, text) in sorted(all_texts.items()):
        original = text
        changed = False

        # Add Places Mentioned if missing
        if not has_section(text, "Places Mentioned"):
            places_content = build_places_section(text)
            if places_content:
                text = insert_places(text, places_content)
                if text != original:
                    places_added += 1
                    changed = True

        # Add Temporal Context if missing
        if not has_section(text, "Temporal Context"):
            d = all_dates.get(doc_id)
            if d:
                temporal_content = build_temporal_section(d, all_dates, doc_id)
                text = insert_temporal(text, temporal_content)
                if text != (original if not changed else text):
                    temporal_added += 1
                    changed = True

        if text != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(text)

    print(f"\nPlaces Mentioned sections added: {places_added}")
    print(f"Temporal Context sections added: {temporal_added}")
    print("Done!")


if __name__ == "__main__":
    main()
