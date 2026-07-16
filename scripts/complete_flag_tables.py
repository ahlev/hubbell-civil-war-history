#!/usr/bin/env python
"""
Complete abbreviated Event Flags tables by adding missing 'no' rows.

Some letters only list flags that are 'yes', omitting 'no' flags.
This script adds the missing rows so all 15 flags are present.
"""
import os, re, glob

LETTERS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                           "02-transcribed-markdown", "letters")

ALL_FLAGS = [
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

# Aliases that map to canonical names
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


def parse_flag_table(section_text):
    """Parse existing flag rows from the table. Returns dict of {canonical_name: full_row_text}."""
    existing = {}
    for line in section_text.split('\n'):
        line_stripped = line.strip()
        if not line_stripped.startswith('|'):
            continue
        # Extract flag name from bold
        flag_match = re.search(r'\*\*(.+?)\*\*', line_stripped)
        if not flag_match:
            continue
        flag_name = flag_match.group(1).strip()
        canonical = FLAG_ALIASES.get(flag_name, flag_name)
        if canonical in ALL_FLAGS:
            existing[canonical] = line  # preserve original line including indentation
    return existing


def build_complete_table(existing_flags):
    """Build a complete flag table with all 15 rows."""
    lines = [
        "| Flag | Present | Detail | Confidence |",
        "|------|---------|--------|------------|",
    ]
    for flag in ALL_FLAGS:
        if flag in existing_flags:
            # Use the existing row but normalize the flag name
            original_line = existing_flags[flag].strip()
            # If the flag name is an alias, replace with canonical
            for alias, canonical in FLAG_ALIASES.items():
                if canonical == flag:
                    original_line = original_line.replace(f"**{alias}**", f"**{flag}**")
            lines.append(original_line)
        else:
            lines.append(f"| **{flag}** | no | | |")
    return "\n".join(lines)


def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        text = f.read()

    # Find the Event Flags section
    section_match = re.search(r'(### Event Flags\s*\n)(.*?)(?=\n---|\n##[^#])', text, re.DOTALL)
    if not section_match:
        return False

    section_start = section_match.start(2)
    section_end = section_match.end(2)
    section_text = section_match.group(2)

    # Parse existing flags
    existing = parse_flag_table(section_text)

    # Check if already complete (has all 15)
    if len(existing) >= 15:
        return False

    # Check if it has at least one flag (not an empty section)
    if len(existing) == 0:
        return False  # Skip empty tables (handled separately)

    # Check if it's a yes-only table (abbreviated)
    has_no = any('| no |' in line.lower() or '| no |' in line for line in section_text.split('\n')
                 if '**' in line)

    # Only complete tables that are missing flags
    missing_count = 15 - len(existing)
    if missing_count == 0:
        return False

    # Build complete table
    complete_table = build_complete_table(existing)

    # Replace the section content (preserve any text before the table header)
    # Find the table start within the section
    table_start = re.search(r'\|[^\n]*Flag[^\n]*\|', section_text)
    pre_table = ""
    if table_start:
        pre_table = section_text[:table_start.start()]

    new_section = pre_table + complete_table + "\n"

    new_text = text[:section_start] + new_section + text[section_end:]

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_text)

    return True, len(existing), missing_count


def main():
    files = sorted(glob.glob(os.path.join(LETTERS_DIR, "LTR-*.md")))
    print(f"Scanning {len(files)} files for incomplete event flag tables...")

    completed = 0
    total_flags_added = 0

    for filepath in files:
        result = fix_file(filepath)
        if result and result is not True:
            _, existing_count, missing_count = result
            completed += 1
            total_flags_added += missing_count
            if completed <= 10 or missing_count > 5:
                print(f"  {os.path.basename(filepath)}: had {existing_count}, added {missing_count} 'no' rows")
        elif result is True:
            completed += 1

    print(f"\nCompleted {completed} tables, added {total_flags_added} missing flag rows")


if __name__ == "__main__":
    main()
