#!/usr/bin/env python
"""
Phase 3: Apply verified metadata patches to letter files.

Reads verified_batch*.json files produced by subagent verification,
then surgically inserts confirmed people, places, and event flag
corrections into the actual letter markdown files.

Run with --dry-run to preview changes without writing.
"""
import os, re, json, glob, sys

LETTERS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                           "02-transcribed-markdown", "letters")
ANALYSIS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                            "04-analysis")

DRY_RUN = '--dry-run' in sys.argv


def load_verified_patches():
    """Load all verified batch files and merge into a dict keyed by doc_id."""
    patches = {}
    pattern = os.path.join(ANALYSIS_DIR, "verified_batch*.json")
    batch_files = sorted(glob.glob(pattern))

    if not batch_files:
        print("ERROR: No verified_batch*.json files found in %s" % ANALYSIS_DIR)
        sys.exit(1)

    for bf in batch_files:
        with open(bf, 'r', encoding='utf-8') as f:
            data = json.load(f)
        for entry in data:
            doc_id = entry['doc_id']
            patches[doc_id] = entry
        print("Loaded %d entries from %s" % (len(data), os.path.basename(bf)))

    return patches


def add_people_rows(text, people):
    """Insert verified people into the People Mentioned table."""
    if not people:
        return text, 0

    # Find the People Mentioned table
    pattern = r'(### People Mentioned\s*\n\s*\|[^\n]*\|\s*\n\s*\|[-|]+\|\s*\n)(.*?)(\n\s*###|\n---)'
    m = re.search(pattern, text, re.DOTALL)
    if not m:
        return text, 0

    table_header = m.group(1)
    existing_rows = m.group(2)
    next_section = m.group(3)

    # Build new rows
    new_rows = []
    for p in people:
        if isinstance(p, str):
            name = p
            role = ''
            confidence = 'stated'
        else:
            name = p.get('name', '')
            role = p.get('role', p.get('relationship', ''))
            confidence = p.get('confidence', 'stated')
        conf_str = '`%s`' % confidence if confidence else ''
        new_rows.append("| %s | %s | %s | no |" % (name, role, conf_str))

    # Append new rows after existing rows
    patched = existing_rows.rstrip('\n') + '\n' + '\n'.join(new_rows) + '\n'
    text = text[:m.start(2)] + patched + text[m.start(3):]

    return text, len(new_rows)


def add_places_rows(text, places):
    """Insert verified places into the Places Mentioned table."""
    if not places:
        return text, 0

    # Find the Places Mentioned table
    pattern = r'(### Places Mentioned\s*\n\s*\|[^\n]*\|\s*\n\s*\|[-|]+\|\s*\n)(.*?)(\n\s*###|\n---)'
    m = re.search(pattern, text, re.DOTALL)
    if not m:
        return text, 0

    existing_rows = m.group(2)

    new_rows = []
    for p in places:
        if isinstance(p, str):
            written = p
            modern = ''
            confidence = 'stated'
        else:
            written = p.get('place_as_written', p.get('place', p.get('name', '')))
            modern = p.get('modern_id', p.get('modern_identification', ''))
            confidence = p.get('confidence', 'stated')
        conf_str = '`%s`' % confidence if confidence else ''
        new_rows.append("| %s | %s | %s |" % (written, modern, conf_str))

    patched = existing_rows.rstrip('\n') + '\n' + '\n'.join(new_rows) + '\n'
    text = text[:m.start(2)] + patched + text[m.start(3):]

    return text, len(new_rows)


def normalize_flags(flags):
    """Normalize verified_flags from various subagent formats to a standard dict.

    Handles three formats:
    1. Dict with nested dicts: {"Flag Name": {"present": "yes", "detail": "..."}}
    2. Dict with bool values: {"Flag Name": True}
    3. List of dicts: [{"flag": "Flag Name", "detail": "..."}]
    """
    if isinstance(flags, list):
        result = {}
        for item in flags:
            name = item.get('flag', '')
            if name:
                result[name] = {
                    'detail': item.get('detail', ''),
                    'confidence': item.get('confidence', 'stated'),
                }
        return result
    elif isinstance(flags, dict):
        result = {}
        for name, val in flags.items():
            if isinstance(val, bool):
                result[name] = {'detail': '', 'confidence': 'stated'}
            elif isinstance(val, dict):
                result[name] = val
            elif isinstance(val, str):
                result[name] = {'detail': val, 'confidence': 'stated'}
        return result
    return {}


def fix_event_flags(text, flags):
    """Update event flags from 'no' to 'yes' with details."""
    if not flags:
        return text, 0

    normalized = normalize_flags(flags)
    count = 0
    append_rows = []

    for flag_name, flag_data in normalized.items():
        detail = flag_data.get('detail', '')
        confidence = flag_data.get('confidence', 'stated')
        conf_str = '`%s`' % confidence if confidence else ''

        # Skip if already flagged 'yes'
        escaped_name = re.escape(flag_name)
        if re.search(r'\| \*\*%s\*\* \|\s*yes\s*\|' % escaped_name, text):
            continue

        # Try to find existing 'no' row and replace it
        pattern = r'(\| \*\*%s\*\* \|)\s*no\s*\|[^|]*\|[^|]*\|' % escaped_name
        replacement = r'\1 yes | %s | %s |' % (detail, conf_str)

        new_text = re.sub(pattern, replacement, text)
        if new_text != text:
            text = new_text
            count += 1
        else:
            # Flag row doesn't exist — collect for appending to the table
            append_rows.append("| **%s** | yes | %s | %s |" % (flag_name, detail, conf_str))

    # Append missing flag rows to the end of the Event Flags table
    if append_rows:
        # Find the last row of the event flags table (last line starting with |
        # before the next --- or ### section)
        flag_section = re.search(
            r'(### Event Flags\s*\n.*?)(\n\s*---|\n\s*##[^#])',
            text, re.DOTALL
        )
        if flag_section:
            section_text = flag_section.group(1)
            # Find last table row
            lines = section_text.split('\n')
            last_row_idx = -1
            for i, line in enumerate(lines):
                if line.strip().startswith('|') and '**' in line:
                    last_row_idx = i

            if last_row_idx >= 0:
                # Insert after the last table row
                insert_pos = flag_section.start(1)
                for i in range(last_row_idx + 1):
                    insert_pos = text.index('\n', insert_pos) + 1 if i > 0 else insert_pos
                    # Find the actual position
                # Simpler: find end of last | row in the section
                last_pipe = section_text.rfind('|')
                if last_pipe >= 0:
                    # Find the end of that line
                    abs_pos = flag_section.start(1) + last_pipe
                    eol = text.index('\n', abs_pos)
                    insert_text = '\n' + '\n'.join(append_rows)
                    text = text[:eol] + insert_text + text[eol:]
                    count += len(append_rows)

    return text, count


def apply_patches(patches):
    """Apply all verified patches to letter files."""
    stats = {
        'files_patched': 0,
        'people_added': 0,
        'places_added': 0,
        'flags_fixed': 0,
        'errors': [],
    }

    for doc_id, patch in sorted(patches.items()):
        filepath = os.path.join(LETTERS_DIR, doc_id + '.md')
        if not os.path.exists(filepath):
            stats['errors'].append("File not found: %s" % doc_id)
            continue

        with open(filepath, 'r', encoding='utf-8') as f:
            text = f.read()

        original = text
        people_count = 0
        places_count = 0
        flags_count = 0

        # Apply people additions
        if patch.get('verified_people'):
            text, people_count = add_people_rows(text, patch['verified_people'])

        # Apply places additions
        if patch.get('verified_places'):
            text, places_count = add_places_rows(text, patch['verified_places'])

        # Apply flag fixes
        if patch.get('verified_flags'):
            text, flags_count = fix_event_flags(text, patch['verified_flags'])

        if text != original:
            if not DRY_RUN:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(text)
            stats['files_patched'] += 1
            stats['people_added'] += people_count
            stats['places_added'] += places_count
            stats['flags_fixed'] += flags_count

            if people_count + places_count + flags_count > 0:
                action = "WOULD patch" if DRY_RUN else "Patched"
                print("  %s %s: +%d people, +%d places, %d flags" % (
                    action, doc_id, people_count, places_count, flags_count))

    return stats


def main():
    if DRY_RUN:
        print("=== DRY RUN MODE (no files will be modified) ===\n")

    patches = load_verified_patches()
    print("\nTotal verified patches: %d letters\n" % len(patches))

    stats = apply_patches(patches)

    print("\n--- Summary ---")
    print("Files patched: %d" % stats['files_patched'])
    print("People added:  %d" % stats['people_added'])
    print("Places added:  %d" % stats['places_added'])
    print("Flags fixed:   %d" % stats['flags_fixed'])

    if stats['errors']:
        print("\nErrors:")
        for e in stats['errors']:
            print("  %s" % e)

    if DRY_RUN:
        print("\n(Dry run -- no changes written. Remove --dry-run to apply.)")


if __name__ == "__main__":
    main()
