#!/usr/bin/env python
"""
Audit structural integrity of patched letter files.
Checks for column count mismatches, confidence format inconsistencies,
and other issues introduced by the patch applicator.
"""
import re, glob, os
from collections import Counter

LETTERS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                           "02-transcribed-markdown", "letters")

issues = []

for filepath in sorted(glob.glob(os.path.join(LETTERS_DIR, "LTR-*.md"))):
    with open(filepath, 'r', encoding='utf-8') as f:
        text = f.read()

    basename = os.path.basename(filepath)

    # Check 1: Places table column count consistency
    places_section = re.search(r'### Places Mentioned\s*\n(.*?)(?:\n###|\n---)', text, re.DOTALL)
    if places_section:
        rows = [l for l in places_section.group(1).split('\n')
                if l.strip().startswith('|') and '---' not in l]
        if len(rows) >= 2:
            header_cols = len(rows[0].split('|')) - 2
            for row in rows[1:]:
                row_cols = len(row.split('|')) - 2
                if row_cols != header_cols:
                    issues.append((basename, 'PLACES_COL_MISMATCH',
                                   'hdr=%d row=%d: %s' % (header_cols, row_cols, row.strip()[:70])))

    # Check 2: People table column count
    people_section = re.search(r'### People Mentioned\s*\n(.*?)(?:\n###|\n---)', text, re.DOTALL)
    if people_section:
        rows = [l for l in people_section.group(1).split('\n')
                if l.strip().startswith('|') and '---' not in l]
        if len(rows) >= 2:
            header_cols = len(rows[0].split('|')) - 2
            for row in rows[1:]:
                row_cols = len(row.split('|')) - 2
                if row_cols != header_cols:
                    issues.append((basename, 'PEOPLE_COL_MISMATCH',
                                   'hdr=%d row=%d: %s' % (header_cols, row_cols, row.strip()[:70])))

    # Check 3: Confidence format (/ instead of middle dot in flag rows)
    flags_section = re.search(r'### Event Flags\s*\n(.*?)(?:\n---|\n##[^#])', text, re.DOTALL)
    if flags_section:
        for row in flags_section.group(1).split('\n'):
            if '**' in row and row.strip().startswith('|') and ' / ' in row:
                issues.append((basename, 'FLAG_SLASH_CONF', row.strip()[:70]))

    # Check 4: Blank lines inside tables (breaks markdown rendering)
    for section_name in ['People Mentioned', 'Places Mentioned', 'Event Flags']:
        section = re.search(r'### %s\s*\n(.*?)(?:\n###|\n---|\n##[^#])' % section_name, text, re.DOTALL)
        if section:
            lines = section.group(1).split('\n')
            in_table = False
            for i, line in enumerate(lines):
                if line.strip().startswith('|'):
                    in_table = True
                elif in_table and line.strip() == '' and i + 1 < len(lines):
                    next_line = lines[i + 1].strip()
                    if next_line.startswith('|'):
                        issues.append((basename, 'BLANK_IN_TABLE',
                                       '%s: blank line inside table at position %d' % (section_name, i)))

    # Check 5: Duplicate flag names in event flags
    if flags_section:
        flag_names = re.findall(r'\*\*(.+?)\*\*', flags_section.group(1))
        seen = set()
        for fn in flag_names:
            if fn in seen:
                issues.append((basename, 'DUPLICATE_FLAG', fn))
            seen.add(fn)

print('Structural audit of %d letter files' % len(glob.glob(os.path.join(LETTERS_DIR, "LTR-*.md"))))
print('Issues found: %d' % len(issues))
print()

type_counts = Counter(t for _, t, _ in issues)
for t, c in type_counts.most_common():
    print('  %s: %d' % (t, c))
print()

for basename, issue_type, detail in issues[:50]:
    print('  %s [%s] %s' % (basename, issue_type, detail))
if len(issues) > 50:
    print('  ... and %d more' % (len(issues) - 50))
