#!/usr/bin/env python
"""
Fix non-standard enum values across all letter markdown files.

Mappings:
  Significance: critical->major, moderate->notable, minor->routine, low-moderate->routine
  Emotion: low-moderate->moderate, moderate-high->high, very high->extreme, n/a->low
  Direction: front-to-front->other, front-to-Canada->other, home-to-authority->other, home-to-sons->home-to-front
"""

import os
import re
import glob

LETTERS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                           "02-transcribed-markdown", "letters")

SIG_MAP = {
    "critical": "major",
    "moderate": "notable",
    "minor": "routine",
    "low-moderate": "routine",
}

EMO_MAP = {
    "low-moderate": "moderate",
    "moderate-high": "high",
    "very high": "extreme",
    "n/a": "low",
}

DIR_MAP = {
    "front-to-front": "other",
    "front-to-Canada": "other",
    "home-to-authority": "other",
    "home-to-sons": "home-to-front",
}


def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        text = f.read()

    original = text
    changes = []

    # Fix significance
    def fix_sig(m):
        old_val = m.group(1).strip()
        if old_val.lower() in SIG_MAP:
            new_val = SIG_MAP[old_val.lower()]
            changes.append(f"  significance: '{old_val}' -> '{new_val}'")
            return f"### Historical Significance: `{new_val}`"
        return m.group(0)

    text = re.sub(r'### Historical Significance:\s*`([^`]+)`', fix_sig, text)

    # Fix emotion
    def fix_emo(m):
        old_val = m.group(1).strip()
        if old_val.lower() in EMO_MAP:
            new_val = EMO_MAP[old_val.lower()]
            changes.append(f"  emotion: '{old_val}' -> '{new_val}'")
            return f"### Emotional Intensity: `{new_val}`"
        return m.group(0)

    text = re.sub(r'### Emotional Intensity:\s*`([^`]+)`', fix_emo, text)

    # Fix direction in metadata table
    dir_pattern = r'(\|\s*\*\*Direction\*\*\s*\|\s*)([^|]+?)(\s*\|)'
    def fix_dir(m):
        old_val = m.group(2).strip()
        if old_val in DIR_MAP:
            new_val = DIR_MAP[old_val]
            changes.append(f"  direction: '{old_val}' -> '{new_val}'")
            return f"{m.group(1)}{new_val}{m.group(3)}"
        return m.group(0)

    text = re.sub(dir_pattern, fix_dir, text)

    if text != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(text)
        return changes
    return []


def main():
    files = sorted(glob.glob(os.path.join(LETTERS_DIR, "LTR-*.md")))
    print(f"Scanning {len(files)} files...")

    total_changes = 0
    files_changed = 0

    for filepath in files:
        changes = fix_file(filepath)
        if changes:
            files_changed += 1
            total_changes += len(changes)
            print(f"{os.path.basename(filepath)}:")
            for c in changes:
                print(c)

    print(f"\nDone: {total_changes} changes across {files_changed} files")


if __name__ == "__main__":
    main()
