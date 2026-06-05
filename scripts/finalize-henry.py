"""Finalize Henry summaries: for the 55 letters the panel cleared, final = draft.
For the 3 letters with real fact issues, apply the minimal hand-corrections
below (grounded in the letter, panel-flagged). Writes back to the proposals
file and reports. Nothing touches canonical data yet.
"""
import json

PROP = "04-analysis/sigsummary-v2-henry-proposals.json"

# Minimal, grounded corrections for the 3 panel-flagged letters.
FIXES = {
    "LTR-1861-11-30-002": (
        "Writing from Camp McClellan, Henry sketches his brigade — the 2nd New "
        "York, a Minnesota regiment, and his own 34th NY — drilling together two "
        "or three times a week under General Gorman. He gently corrects a report "
        "that the company has been suffering — “It is not correct” — while "
        "admitting one hard stretch in Virginia."
    ),
    "LTR-1862-01-09-001": (
        "Writing from Camp McClellan after a New Year’s of beer “from the Capt.” "
        "and a few boys too drunk, Henry reports his company presented Capt. Reich "
        "a $125 sword, to which he gave a dollar. He longs for a furlough, but only "
        "married men may go — so he waits, lonesome for letters and the box of "
        "socks still stuck in Washington."
    ),
    "LTR-1861-10-17-001": (
        "Henry relays a daring escape from rebel captivity: a fellow prisoner taken "
        "in the same skirmish as Kellogg feigned illness to hoard his daily opium, "
        "then drugged his guard’s coffee and made his way past three rebel "
        "regiments — and confirms Kellogg is held unwounded at Richmond. Henry "
        "also reports a drunken stabbing in camp that killed a man by morning, and "
        "Brig. Gen. Gormon’s inspection of the 34th, lately dubbed “the sharp "
        "shooters” in the papers."
    ),
}

P = json.load(open(PROP, encoding="utf-8"))
for r in P:
    fix = FIXES.get(r["id"])
    r["final"] = fix if fix else r["draft"]
    r["chosen"] = r["final"]
    r["status"] = "hand-fixed" if fix else "draft-clean"

json.dump(P, open(PROP, "w", encoding="utf-8"), ensure_ascii=False, indent=2)

ls = sorted(len(r["final"]) for r in P)
print(f"Finalized {len(P)} letters | hand-fixed: {len(FIXES)} | draft=final: {len(P)-len(FIXES)}")
print(f"FINAL length: min {ls[0]}, median {ls[len(ls)//2]}, max {ls[-1]}")
print(f"Wrote {PROP}")
