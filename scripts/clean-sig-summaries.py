"""
Clean sigSummary fields in all-letters.json.

Transforms the **bold markdown** note-style entries into clean, concise prose
matching the style of the earliest letters (1-2 sentences, no formatting,
captures the key distinguishing content of the letter within the collection).

Run: python scripts/clean-sig-summaries.py
"""

import json
import re
import sys

INPUT = '03-data/all-letters.json'
OUTPUT = '03-data/all-letters.json'

def clean_summary(raw):
    """Strip markdown bold, collapse note-style fragments into prose."""
    if not raw:
        return raw

    # If no bold markers, it's already clean-style — leave as-is
    if '**' not in raw:
        return raw

    # Strip bold markers
    text = raw.replace('**', '')

    # Remove emoji/symbols that snuck in (⚠️ etc.)
    text = re.sub(r'[\u26a0\u2757\ufe0f\u2b50\u274c\u2705\u26a1]', '', text)

    # Replace em-dash fragments used as separators with periods or commas
    # Pattern: "Topic — detail. Topic — detail" → "Topic: detail. Topic: detail"
    # But only when — starts a clause after a short phrase
    text = re.sub(r'\s*[—–]\s*', ' — ', text)  # normalize dashes first

    # Collapse multiple spaces
    text = re.sub(r' {2,}', ' ', text)

    # Remove leading/trailing whitespace
    text = text.strip()

    # Truncate to ~2 substantive sentences if too long
    sentences = re.findall(r'[^.!?]+[.!?]+', text)
    if sentences and len(text) > 200:
        # Keep first 2 sentences that are substantive (>15 chars)
        kept = []
        for s in sentences:
            s = s.strip()
            if len(s) > 15:
                kept.append(s)
            if len(' '.join(kept)) > 160:
                break
            if len(kept) >= 2:
                break
        if kept:
            text = ' '.join(kept)

    # Final length cap
    if len(text) > 220:
        # Cut at last sentence boundary before 220
        cut = text[:220]
        last_period = max(cut.rfind('.'), cut.rfind('!'), cut.rfind('?'))
        if last_period > 80:
            text = text[:last_period + 1]
        else:
            text = cut.rstrip() + '...'

    return text


def main():
    with open(INPUT, 'r', encoding='utf-8') as f:
        letters = json.load(f)

    changed = 0
    for letter in letters:
        old = letter.get('sigSummary', '')
        if '**' in old:
            letter['sigSummary'] = clean_summary(old)
            changed += 1

    print(f'Cleaned {changed} of {len(letters)} sigSummary entries.')

    # Show some examples
    print('\n--- Samples ---')
    count = 0
    for letter in letters:
        if letter.get('_was_bold'):
            continue
        old_raw = letter.get('sigSummary', '')
        if count < 8 and '—' in old_raw and len(old_raw) < 200:
            print(f"  {letter['id']}: {old_raw[:150]}")
            count += 1

    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(letters, f, ensure_ascii=False, indent=2)

    print(f'\nWritten to {OUTPUT}')


if __name__ == '__main__':
    main()
