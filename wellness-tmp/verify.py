"""Grounding verifier for the wellness-v2 curation batches.
Checks: (1) every conditions[].quote is a normalized verbatim substring of its
letter's transcription; (2) enums valid; (3) every id exists; (4) coverage.
Usage: python wellness-tmp/verify.py
"""
import json, re, os, glob, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
letters = json.load(open(os.path.join(ROOT, '03-data', 'all-letters.json'), encoding='utf-8'))
TX = {l['id']: l.get('transcription', '') for l in letters}
ALL_IDS = [l['id'] for l in letters]

def norm(s):
    s = s.lower().replace('’', "'").replace('‘', "'").replace('“', '"').replace('”', '"')
    s = re.sub(r'\s+', ' ', s)
    return s.strip()

SEV = {'nodata', 'well', 'minor', 'serious', 'grave'}
TONE = {'reassuring', 'neutral', 'worried'}
VOCAB = {'scurvy','dysentery','diarrhea','typhoid','typho-malarial-fever','ague','measles','mumps',
         'smallpox','erysipelas','rheumatism','jaundice','consumption','pneumonia','debility',
         'sunstroke','frostbite','homesickness','cough-cold','wound','other-injury'}

entries = {}
fails, warns = [], []
for path in sorted(glob.glob(os.path.join(ROOT, 'wellness-tmp', 'batch-*.json'))):
    data = json.load(open(path, encoding='utf-8'))
    for e in data:
        eid = e.get('id')
        if eid in entries:
            fails.append(f"DUPLICATE id {eid} (in {os.path.basename(path)})")
        entries[eid] = e
        if eid not in TX:
            fails.append(f"UNKNOWN id {eid}"); continue
        if e.get('severity') not in SEV:
            fails.append(f"{eid}: bad severity {e.get('severity')!r}")
        if e.get('tone') not in TONE:
            fails.append(f"{eid}: bad tone {e.get('tone')!r}")
        tnorm = norm(TX[eid])
        for c in e.get('conditions', []):
            if c.get('tag') not in VOCAB:
                fails.append(f"{eid}: bad condition tag {c.get('tag')!r}")
            q = norm(c.get('quote', ''))
            if not q:
                fails.append(f"{eid}: empty quote for {c.get('tag')}")
            elif q not in tnorm:
                fails.append(f"{eid}: QUOTE NOT GROUNDED [{c.get('tag')}] -> {c.get('quote')!r}")
        # sanity: serious/grave should usually carry a condition
        if e.get('severity') in ('serious','grave') and not e.get('conditions'):
            warns.append(f"{eid}: {e['severity']} but NO conditions (check)")

missing = [i for i in ALL_IDS if i not in entries]
print(f"entries: {len(entries)} / {len(ALL_IDS)}")
print(f"missing ids: {len(missing)}" + (f" -> {missing[:8]}{'...' if len(missing)>8 else ''}" if missing else ""))
print(f"FAILS: {len(fails)}")
for f in fails[:60]: print("  X", f)
print(f"warnings: {len(warns)}")
for w in warns[:40]: print("  ?", w)
# severity distribution
from collections import Counter
dist = Counter(e['severity'] for e in entries.values())
print("severity dist:", dict(dist))
sys.exit(1 if fails else 0)
