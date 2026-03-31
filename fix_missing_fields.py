#!/usr/bin/env python
"""
Fix missing Direction and Transcriber fields across all letter files.

These fields are missing entirely from the metadata table (no row exists),
so we need to INSERT rows, not update existing ones.
"""
import os, re, glob

LETTERS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                           "02-transcribed-markdown", "letters")

SOLDIER_AUTHORS = {"henry", "alexander", "james", "charles"}


def extract_field(text, field_name):
    pattern = rf'\|\s*\*\*{re.escape(field_name)}\*\*\s*\|\s*(.*?)\s*\|'
    m = re.search(pattern, text, re.IGNORECASE)
    if m:
        val = m.group(1).strip().replace('`', '')
        return val
    return None  # None = field row doesn't exist


def normalize_name(name):
    return re.sub(r'\s*\(.*?\)\s*', ' ', name.lower().strip()).strip()


def infer_direction(author, recipient):
    a = normalize_name(author)
    r = normalize_name(recipient)

    a_is_soldier = any(s in a for s in SOLDIER_AUTHORS)
    a_is_mother = any(f in a for f in ("mother", "mrs. hubbell", "frances m."))

    if "mcdonald" in a or "luther" in a or "mcneil" in a:
        return "other"
    if a_is_soldier:
        return "front-to-home"
    if a_is_mother:
        return "home-to-front"
    return "other"


def infer_transcriber(source_format):
    if not source_format:
        return "Claude AI"
    sf = source_format.lower()
    if "typewritten" in sf:
        return "Claude AI from typewritten transcription"
    elif "handwritten" in sf:
        return "Claude AI from handwritten original"
    return "Claude AI"


def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        text = f.read()

    original = text
    changes = []

    author = extract_field(text, "Author") or ""
    recipient = extract_field(text, "Recipient") or ""
    source_format = extract_field(text, "Source Format") or ""
    direction = extract_field(text, "Direction")
    transcriber = extract_field(text, "Transcriber")
    condition = extract_field(text, "Condition")
    source_file = extract_field(text, "Source File")

    # Fix missing Direction (row doesn't exist)
    if direction is None:
        new_dir = infer_direction(author, recipient)
        # Insert Direction row after Recipient row
        recipient_pattern = r'(\|\s*\*\*Recipient\*\*\s*\|[^\n]*\|[^\n]*\|[^\n]*\|)'
        m = re.search(recipient_pattern, text)
        if m:
            insert_row = f"\n| **Direction** | {new_dir} | | |"
            text = text[:m.end()] + insert_row + text[m.end():]
            changes.append(f"  +direction: '{new_dir}'")

    # Fix empty Direction (row exists but empty)
    elif direction in ('', '—', '-'):
        new_dir = infer_direction(author, recipient)
        text = re.sub(
            r'(\|\s*\*\*Direction\*\*\s*\|)\s*[—\-]?\s*(\|)',
            rf'\1 {new_dir} \2',
            text
        )
        if text != original:
            changes.append(f"  direction: '' -> '{new_dir}'")

    # Fix missing Transcriber (row doesn't exist)
    if transcriber is None:
        new_trans = infer_transcriber(source_format)
        # Insert after Condition row, or after Source File if no Condition
        if condition is not None:
            anchor_pattern = r'(\|\s*\*\*Condition\*\*\s*\|[^\n]*\|[^\n]*\|[^\n]*\|)'
        elif source_file is not None:
            anchor_pattern = r'(\|\s*\*\*Source File\*\*\s*\|[^\n]*\|[^\n]*\|[^\n]*\|)'
        else:
            anchor_pattern = None

        if anchor_pattern:
            m = re.search(anchor_pattern, text)
            if m:
                insert_row = f"\n| **Transcriber** | {new_trans} | — | |"
                text = text[:m.end()] + insert_row + text[m.end():]
                changes.append(f"  +transcriber: '{new_trans}'")

    # Fix empty Transcriber (row exists but empty)
    elif transcriber in ('', '—', '-'):
        new_trans = infer_transcriber(source_format)
        # Need to replace the value cell specifically
        text = re.sub(
            r'(\|\s*\*\*Transcriber\*\*\s*\|)\s*[—\-]?\s*(\|)',
            rf'\1 {new_trans} \2',
            text
        )
        changes.append(f"  transcriber: '' -> '{new_trans}'")

    if text != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(text)

    return changes


def main():
    files = sorted(glob.glob(os.path.join(LETTERS_DIR, "LTR-*.md")))
    print(f"Scanning {len(files)} files for missing Direction/Transcriber...")

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
