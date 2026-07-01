#!/usr/bin/env python
"""Sibling-correspondence voice analysis (test for tasks/future-sibling-correspondence-section.md).

Question: does a brother write a measurably different letter to a brother-in-uniform
than to Mother or to sister Fannie? We use the 15 event flags + emotion + length
already in the corpus. Controls for the WRITER by also reporting within-author.

Run:  python scripts/_sibling_voice_analysis.py
"""
import json, os, re, sys
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
from collections import Counter, defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
L = json.load(open(os.path.join(ROOT, "03-data", "all-letters.json"), encoding="utf-8"))

FLAGS = ["hasBattle","hasIllness","hasDeath","hasWound","hasPromotion","hasCapture",
         "hasDesertion","hasDischarge","hasHomeNews","hasPolitical","hasMoraleCrisis",
         "hasSupplyRequest","hasReceipt","hasCampMovement","hasEyewitness"]

def rclass(r):
    r = (r or "").lower()
    is_mother = ("mother" in r) or ("mrs. hubbell" in r)
    is_sister = ("sister" in r) or ("fannie" in r) or ("frances" in r and not is_mother)
    is_bro = bool(re.search(r"(charles|alexander|james|henry)\s+(f\.?\s+)?hubbell", r)) or \
             (any(b in r for b in ["charles","alexander","james","henry"]) and "brother" in r)
    tags = []
    if is_mother: tags.append("mother")
    if is_sister: tags.append("sister")
    if is_bro:    tags.append("brother")
    if not tags:  return "other"
    if len(tags) > 1: return "mixed(" + "+".join(tags) + ")"
    return tags[0]

def words(x):
    return len((x.get("transcription") or "").split())

# ---- bucket letters ----
pure = ["mother","sister","brother"]
buckets = defaultdict(list)              # class -> [letters]
by_author = defaultdict(lambda: defaultdict(list))  # author -> class -> [letters]
for x in L:
    c = rclass(x.get("recipient"))
    buckets[c].append(x)
    base = c if c in pure else None
    if base:
        by_author[x.get("author")][base].append(x)

def profile(letters):
    n = len(letters)
    if n == 0: return None
    row = {"n": n, "avg_words": round(sum(words(x) for x in letters)/n)}
    for f in FLAGS:
        row[f] = round(100*sum(1 for x in letters if x.get(f))/n)
    em = Counter((x.get("emotion") or "?") for x in letters)
    row["emotion_top"] = em.most_common(4)
    return row

def show(title, prof):
    if not prof:
        print(f"\n{title}: (none)"); return
    print(f"\n### {title}  (n={prof['n']}, avg {prof['avg_words']} words/letter)")
    cand = ["hasBattle","hasDeath","hasWound","hasEyewitness","hasPolitical","hasMoraleCrisis","hasCampMovement"]
    home = ["hasHomeNews","hasReceipt","hasSupplyRequest","hasIllness"]
    print("  candor:  " + " ".join(f"{f.replace('has',''):>10}={prof[f]:>2}%" for f in cand))
    print("  homefr:  " + " ".join(f"{f.replace('has',''):>10}={prof[f]:>2}%" for f in home))
    print("  emotion: " + ", ".join(f"{k}:{v}" for k,v in prof["emotion_top"]))

print("="*72)
print("RECIPIENT-CLASS COUNTS")
for c in sorted(buckets, key=lambda k:-len(buckets[k])):
    print(f"  {len(buckets[c]):>4}  {c}")

print("\n" + "="*72)
print("POOLED BY RECIPIENT CLASS (all authors)")
for c in pure:
    show(c.upper(), profile(buckets[c]))

print("\n" + "="*72)
print("WITHIN-AUTHOR (controls for who is writing)")
for a in ["henry","alexander","charles","james"]:
    d = by_author[a]
    if not any(d.values()): continue
    print(f"\n----- {a.upper()} -----")
    for c in pure:
        if d[c]: show(f"{a} -> {c}", profile(d[c]))

# ---- candidate paired letters (same author, same month, different class) ----
print("\n" + "="*72)
print("CANDIDATE DIPTYCHS (same author & YYYY-MM, brother-letter paired w/ mother/sister)")
by_am = defaultdict(lambda: defaultdict(list))
for x in L:
    c = rclass(x.get("recipient"))
    base = c if c in pure else None
    if base:
        ym = (x.get("date") or "")[:7]
        by_am[(x.get("author"), ym)][base].append(x)
pairs = 0
for (a, ym), d in sorted(by_am.items()):
    if d["brother"] and (d["mother"] or d["sister"]):
        pairs += 1
        others = []
        if d["mother"]: others.append(f"mother×{len(d['mother'])}")
        if d["sister"]: others.append(f"sister×{len(d['sister'])}")
        print(f"  {a:9} {ym}: brother×{len(d['brother'])}  +  {', '.join(others)}")
print(f"\n  → {pairs} month-level pairings where a brother wrote to BOTH a brother and mother/sister")
