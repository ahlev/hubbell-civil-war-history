#!/usr/bin/env python
"""Fix 20 over-corrected people rows and 1 remaining slash confidence."""
import re, glob, os

LETTERS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                           "02-transcribed-markdown", "letters")

MIDDLE_DOT = "\u00b7"

# Fix people rows with duplicate 'no' columns
fixed = 0
for filepath in sorted(glob.glob(os.path.join(LETTERS_DIR, "LTR-1864-*.md"))):
    with open(filepath, 'r', encoding='utf-8') as f:
        text = f.read()

    original = text
    # Pattern: | Name |  | `conf` | no | no |  ->  | Name |  | `conf` | no |
    # Match rows that end with | no | no |
    text = re.sub(r'(\|[^|]+\|[^|]*\|[^|]+\| no) \| no \|', r'\1 |', text)

    if text != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(text)
        fixed += 1
        print("  Fixed duplicate 'no' in: %s" % os.path.basename(filepath))

print("People rows fixed: %d" % fixed)

# Fix the one remaining slash confidence
filepath = os.path.join(LETTERS_DIR, "LTR-1862-06-22-002.md")
with open(filepath, 'r', encoding='utf-8') as f:
    text = f.read()

# Only replace slashes in the Event Flags section
flags_match = re.search(r'(### Event Flags\s*\n)(.*?)(\n---)', text, re.DOTALL)
if flags_match:
    section = flags_match.group(2)
    new_section = section.replace(' / ', ' %s ' % MIDDLE_DOT)
    if new_section != section:
        text = text[:flags_match.start(2)] + new_section + text[flags_match.end(2):]
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(text)
        print("  Fixed slash confidence in LTR-1862-06-22-002.md")
