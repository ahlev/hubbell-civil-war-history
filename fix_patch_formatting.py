#!/usr/bin/env python
"""
Fix structural inconsistencies introduced by apply_verified_patches.py:

1. PLACES_COL_MISMATCH: Added rows have 3 columns but header has 4 (missing Coordinates)
2. PEOPLE_COL_MISMATCH: Added rows have 3 columns but header has 4
3. FLAG_SLASH_CONF: Confidence uses ' / ' instead of ' \u00b7 ' (middle dot)

This script reads each file, detects mismatches, and fixes them in place.
"""
import os, re, glob

LETTERS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                           "02-transcribed-markdown", "letters")

MIDDLE_DOT = "\u00b7"  # The project standard separator


def count_table_cols(line):
    """Count columns in a markdown table row by counting pipe separators."""
    # A row like '| A | B | C |' has 3 columns
    # Split by | gives ['', ' A ', ' B ', ' C ', '']
    # Columns = total parts - 2 (leading/trailing empty)
    parts = line.split('|')
    if len(parts) < 3:  # Not a valid table row
        return 0
    return len(parts) - 2  # Subtract leading and trailing empty strings


def fix_table_columns(text, section_header):
    """Fix column count mismatches in a markdown table section."""
    pattern = r'(### %s\s*\n)(.*?)(\n###|\n---)' % re.escape(section_header)
    match = re.search(pattern, text, re.DOTALL)
    if not match:
        return text, 0

    section = match.group(2)
    lines = section.split('\n')

    # Find header row and count columns
    header_line = None
    header_cols = 0
    for line in lines:
        if line.strip().startswith('|') and '---' not in line:
            header_line = line
            header_cols = count_table_cols(line)
            break

    if not header_line or header_cols < 3:
        return text, 0

    is_places = 'Places' in section_header
    is_people = 'People' in section_header

    fixed_count = 0
    new_lines = []
    for line in lines:
        if not line.strip().startswith('|') or '---' in line or line == header_line:
            new_lines.append(line)
            continue

        row_cols = count_table_cols(line)
        if row_cols == header_cols:
            new_lines.append(line)
            continue

        if row_cols < header_cols:
            cells = line.split('|')
            real_cells = cells[1:-1]  # Strip leading/trailing empty strings
            missing = header_cols - row_cols

            if is_places and header_cols == 4:
                # Insert empty Coordinates column(s) before Confidence (last real cell)
                for _ in range(missing):
                    real_cells.insert(-1, ' -- ')
                new_line = '|' + '|'.join(real_cells) + '|'
                new_lines.append(new_line)
                fixed_count += 1
            elif is_people and header_cols == 4:
                # Append missing columns at end (First Mention? = no)
                for _ in range(missing):
                    real_cells.append(' no ')
                new_line = '|' + '|'.join(real_cells) + '|'
                new_lines.append(new_line)
                fixed_count += 1
            else:
                new_lines.append(line)
        else:
            new_lines.append(line)

    if fixed_count > 0:
        new_section = '\n'.join(new_lines)
        text = text[:match.start(2)] + new_section + text[match.end(2):]

    return text, fixed_count


def fix_slash_confidence(text):
    """Replace ' / ' with ' \u00b7 ' in event flag confidence values."""
    # Only fix within Event Flags section
    pattern = r'(### Event Flags\s*\n)(.*?)(\n---|\n##[^#])'
    match = re.search(pattern, text, re.DOTALL)
    if not match:
        return text, 0

    section = match.group(2)
    count = 0

    # Find confidence values using slashes: `stated / clear / definite`
    def replace_slashes(m):
        nonlocal count
        old = m.group(0)
        new = old.replace(' / ', ' %s ' % MIDDLE_DOT)
        if new != old:
            count += 1
        return new

    # Match backtick-enclosed confidence values with slashes
    new_section = re.sub(r'`[^`]*?/[^`]*?`', replace_slashes, section)

    # Also fix non-backtick confidence values at end of flag rows
    # Pattern: | stated / clear / definite |
    def replace_bare_slashes(m):
        nonlocal count
        val = m.group(1)
        new_val = val.replace(' / ', ' %s ' % MIDDLE_DOT)
        if new_val != val:
            count += 1
            return '| %s |' % new_val
        return m.group(0)

    new_section = re.sub(r'\|\s*([^|]*?stated[^|]*?/[^|]*?)\s*\|', replace_bare_slashes, new_section)

    if count > 0:
        text = text[:match.start(2)] + new_section + text[match.end(2):]

    return text, count


def main():
    files = sorted(glob.glob(os.path.join(LETTERS_DIR, "LTR-*.md")))
    print("Scanning %d files for structural issues..." % len(files))

    stats = {
        'places_fixed': 0,
        'people_fixed': 0,
        'slashes_fixed': 0,
        'files_modified': 0,
    }

    for filepath in files:
        with open(filepath, 'r', encoding='utf-8') as f:
            text = f.read()

        original = text
        places_count = 0
        people_count = 0
        slash_count = 0

        text, places_count = fix_table_columns(text, 'Places Mentioned')
        text, people_count = fix_table_columns(text, 'People Mentioned')
        text, slash_count = fix_slash_confidence(text)

        if text != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(text)
            stats['files_modified'] += 1
            stats['places_fixed'] += places_count
            stats['people_fixed'] += people_count
            stats['slashes_fixed'] += slash_count

            if places_count + people_count + slash_count > 2:
                print("  %s: places=%d people=%d slashes=%d" % (
                    os.path.basename(filepath), places_count, people_count, slash_count))

    print("\n--- Summary ---")
    print("Files modified:     %d" % stats['files_modified'])
    print("Places cols fixed:  %d" % stats['places_fixed'])
    print("People cols fixed:  %d" % stats['people_fixed'])
    print("Slash confs fixed:  %d" % stats['slashes_fixed'])


if __name__ == "__main__":
    main()
