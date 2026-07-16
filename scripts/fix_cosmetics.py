#!/usr/bin/env python
"""
Standardize cosmetic inconsistencies in Places Mentioned tables:
1. Double-dash (--) -> em dash for empty Coordinates cells
2. Single-word confidence -> three-axis format
"""
import re, glob, os

LETTERS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                           "02-transcribed-markdown", "letters")

# Confidence expansion map
CONF_MAP = {
    'stated': 'stated \u00b7 clear \u00b7 definite',
    'inferred': 'inferred \u00b7 n/a \u00b7 n/a',
    'uncertain': 'stated \u00b7 unclear \u00b7 uncertain',
}

files_modified = 0
dashes_fixed = 0
confs_fixed = 0

for filepath in sorted(glob.glob(os.path.join(LETTERS_DIR, "LTR-*.md"))):
    with open(filepath, 'r', encoding='utf-8') as f:
        text = f.read()

    original = text

    # Fix within Places Mentioned section only
    places_match = re.search(
        r'(### Places Mentioned\s*\n)(.*?)(\n###|\n---)',
        text, re.DOTALL
    )
    if not places_match:
        continue

    section = places_match.group(2)
    new_lines = []
    local_dashes = 0
    local_confs = 0

    for line in section.split('\n'):
        if line.strip().startswith('|') and '---' not in line and 'Place' not in line:
            # Fix double-dash to em dash
            if '| -- |' in line:
                line = line.replace('| -- |', '| \u2014 |')
                local_dashes += 1

            # Fix single-word confidence in backticks
            for single, expanded in CONF_MAP.items():
                old_pat = '`%s`' % single
                new_pat = '`%s`' % expanded
                if old_pat in line:
                    line = line.replace(old_pat, new_pat)
                    local_confs += 1

        new_lines.append(line)

    if local_dashes > 0 or local_confs > 0:
        new_section = '\n'.join(new_lines)
        text = text[:places_match.start(2)] + new_section + text[places_match.end(2):]

    # Also fix single-word confidence in People Mentioned added rows
    people_match = re.search(
        r'(### People Mentioned\s*\n)(.*?)(\n###|\n---)',
        text, re.DOTALL
    )
    if people_match:
        section = people_match.group(2)
        new_section = section
        for single, expanded in CONF_MAP.items():
            old_pat = '`%s`' % single
            new_pat = '`%s`' % expanded
            count = new_section.count(old_pat)
            if count > 0:
                new_section = new_section.replace(old_pat, new_pat)
                local_confs += count
        if new_section != section:
            text = text[:people_match.start(2)] + new_section + text[people_match.end(2):]

    if text != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(text)
        files_modified += 1
        dashes_fixed += local_dashes
        confs_fixed += local_confs

print("Files modified:     %d" % files_modified)
print("Dashes standardized: %d" % dashes_fixed)
print("Confs expanded:     %d" % confs_fixed)
