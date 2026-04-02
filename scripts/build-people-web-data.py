#!/usr/bin/env python
"""Inject full letter data (with transcriptions) into viz-people-web.html.

Replaces the async fetch() to 03-data/all-letters.json with inline FULL_LETTERS,
so the file works when opened directly from the filesystem (file:// protocol).
"""
import json
import os
import re

PROJ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Load full letter data
with open(os.path.join(PROJ, '03-data', 'all-letters.json'), encoding='utf-8') as f:
    all_letters = json.load(f)

# Build lookup by ID
letters_by_id = {l['id']: l for l in all_letters}

# Read current HTML
html_path = os.path.join(PROJ, 'viz-people-web.html')
with open(html_path, encoding='utf-8') as f:
    html = f.read()

# Extract RAW_LETTERS IDs from the HTML to only embed what's needed
raw_ids = re.findall(r'"id":"(LTR-[^"]+)"', html)
raw_ids = list(dict.fromkeys(raw_ids))  # deduplicate, preserve order
print(f"Found {len(raw_ids)} letter IDs in RAW_LETTERS")

# Build FULL_LETTERS dict with only the fields needed for the overlay
fields = ['id', 'date', 'author', 'authorName', 'recipient', 'location',
          'sigSummary', 'significance', 'emotion', 'transcription', 'editorial',
          'hasBattle', 'hasIllness', 'hasDeath', 'hasWound']
full_dict = {}
for lid in raw_ids:
    letter = letters_by_id.get(lid)
    if letter:
        entry = {}
        for fld in fields:
            if fld in ('hasBattle', 'hasIllness', 'hasDeath', 'hasWound'):
                entry[fld] = letter.get(fld, False)
            else:
                entry[fld] = letter.get(fld, '')
        full_dict[lid] = entry

print(f"Matched {len(full_dict)} letters with full data")
missing = [lid for lid in raw_ids if lid not in full_dict]
if missing:
    print(f"WARNING: {len(missing)} letters not found in all-letters.json: {missing[:5]}")

full_json = json.dumps(full_dict, ensure_ascii=False)

# Replace the fetch block with inline data
# The block to replace spans from "const FULL_LETTERS = {};" through the catch
old_pattern = r"const FULL_LETTERS = \{\};[^\n]*\nlet lettersLoaded = false;.*?lettersLoaded = true; // mark done even on failure so we don't wait forever\n\s*\}\);"
new_code = f"const FULL_LETTERS = {full_json};\nlet lettersLoaded = true;"

# Use lambda to avoid re.subn interpreting \n in replacement as literal newlines
html_new, count = re.subn(old_pattern, lambda m: new_code, html, count=1, flags=re.DOTALL)
if count == 0:
    print("ERROR: Could not find fetch block to replace!")
    exit(1)

# Also remove the now-unused lettersPromise references
# "if (!lettersLoaded) await lettersPromise;" -> remove
html_new = html_new.replace("if (!lettersLoaded) await lettersPromise;\n", "")
html_new = html_new.replace("if (!lettersLoaded) await lettersPromise;", "")

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html_new)

print(f"Written {len(html_new):,} chars to viz-people-web.html")
print(f"  Transcription data embedded for {len(full_dict)} letters")
