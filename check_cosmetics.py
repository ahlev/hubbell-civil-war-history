#!/usr/bin/env python
"""Check remaining cosmetic inconsistencies in patched files."""
import re, glob, os

LETTERS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                           "02-transcribed-markdown", "letters")

em_dash = 0
double_dash = 0
single_conf = 0
triple_conf = 0

for filepath in sorted(glob.glob(os.path.join(LETTERS_DIR, "LTR-*.md"))):
    with open(filepath, 'r', encoding='utf-8') as f:
        text = f.read()

    places = re.search(r'### Places Mentioned\s*\n(.*?)(?:\n###|\n---)', text, re.DOTALL)
    if places:
        section = places.group(1)
        for line in section.split('\n'):
            if line.strip().startswith('|') and '---' not in line and 'Place' not in line:
                if '| -- |' in line:
                    double_dash += 1
                elif '| \u2014 |' in line:
                    em_dash += 1

        # Check confidence format
        for m in re.finditer(r'`([^`]+)`', section):
            val = m.group(1).strip()
            if '\u00b7' in val:
                triple_conf += 1
            elif val in ('stated', 'inferred', 'uncertain', 'stated / clear / definite'):
                single_conf += 1

print('Coordinates column style:')
print('  Em dash: %d rows' % em_dash)
print('  Double dash (--): %d rows' % double_dash)
print()
print('Places confidence format:')
print('  Three-axis: %d' % triple_conf)
print('  Single-word: %d' % single_conf)
