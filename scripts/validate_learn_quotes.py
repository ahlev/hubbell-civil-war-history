"""Validate the Their Own Words question bank against the letter corpus.

THE GATE (plan D6): every excerpt in _learn-data.js must be an exact
character-for-character substring of its own letter's transcription in
03-data/all-letters.json. Also enforces: letterId exists, author matches,
exactly 25 questions, exactly one per act x theme cell, 4 choices each,
answerIdx in range. Exit code 1 on any failure. Run from project root:

    python scripts/validate_learn_quotes.py
"""
import io
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, '03-data', 'all-letters.json')
BANK = os.path.join(ROOT, '_learn-data.js')

ACTS = [1, 2, 3, 4, 5]
THEMES = ['camp', 'body', 'purse', 'nation', 'family']


def load_bank():
    if not os.path.exists(BANK):
        print('FAIL: _learn-data.js does not exist yet')
        sys.exit(1)
    src = io.open(BANK, encoding='utf-8').read()
    m = re.search(r'var TOW_QUESTIONS\s*=\s*(\[.*?\]);\s*(?:var|window|$)', src, re.S)
    if not m:
        print('FAIL: could not locate `var TOW_QUESTIONS = [...]` in _learn-data.js')
        sys.exit(1)
    try:
        return json.loads(m.group(1))
    except json.JSONDecodeError as e:
        print(f'FAIL: TOW_QUESTIONS is not strict JSON (keep it JSON-parseable): {e}')
        sys.exit(1)


def main():
    data = json.load(io.open(DATA, encoding='utf-8'))
    letters = data['letters'] if isinstance(data, dict) and 'letters' in data else data
    by_id = {l['id']: l for l in letters}

    qs = load_bank()
    errors = []

    if len(qs) != 25:
        errors.append(f'expected exactly 25 questions, found {len(qs)}')

    cells = {}
    for q in qs:
        qid = q.get('qid', '?')
        letter = by_id.get(q.get('letterId'))
        if letter is None:
            errors.append(f'{qid}: letterId {q.get("letterId")!r} not in corpus')
            continue
        if q.get('excerpt', '') not in letter.get('transcription', ''):
            errors.append(f'{qid}: excerpt is NOT a verbatim substring of '
                          f'{q["letterId"]} — fix the DATA, never this check')
        if q.get('author') != letter.get('author'):
            errors.append(f'{qid}: author {q.get("author")!r} != letter author '
                          f'{letter.get("author")!r}')
        act, theme = q.get('act'), q.get('theme')
        if act not in ACTS:
            errors.append(f'{qid}: bad act {act!r}')
        if theme not in THEMES:
            errors.append(f'{qid}: bad theme {theme!r}')
        key = (act, theme)
        if key in cells:
            errors.append(f'{qid}: duplicate cell {key} (also {cells[key]})')
        cells[key] = qid
        choices = q.get('choices', [])
        if len(choices) != 4:
            errors.append(f'{qid}: expected 4 choices, found {len(choices)}')
        ai = q.get('answerIdx')
        if not isinstance(ai, int) or not 0 <= ai <= 3:
            errors.append(f'{qid}: bad answerIdx {ai!r}')
        for field in ('stem', 'expansion', 'whyRight'):
            if not q.get(field, '').strip():
                errors.append(f'{qid}: missing {field}')

    missing = [(a, t) for a in ACTS for t in THEMES if (a, t) not in cells]
    if missing:
        errors.append(f'unfilled cells: {missing}')

    if errors:
        print(f'FAIL ({len(errors)} problem(s)):')
        for e in errors:
            print('  -', e)
        sys.exit(1)
    print(f'OK: 25/25 verbatim, all {len(cells)} act x theme cells filled, '
          f'authors match, choices well-formed.')


if __name__ == '__main__':
    main()
