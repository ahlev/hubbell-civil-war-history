"""Sync the per-letter markdown 'Historical Significance' blockquote to the
approved summary, keyed by letter id (the filename). Only the blockquote that
immediately follows the '### Historical Significance:' header is touched —
nothing else in the file. Idempotent.

Usage: python scripts/sync-markdown-significance.py [--dry]
"""
import json
import os
import re
import sys

PROP = "04-analysis/sigsummary-v2-all-proposals.json"
MD_DIR = "02-transcribed-markdown/letters"

# header line, the blank line(s) after it, then the consecutive '>' blockquote
PAT = re.compile(
    r"(###\s+Historical Significance:[^\n]*\n\s*\n)((?:>[^\n]*\n?)+)")


def main():
    dry = "--dry" in sys.argv
    finals = {r["id"]: r["final"] for r in json.load(open(PROP, encoding="utf-8")) if r.get("final")}
    changed = skipped = missing = nohdr = 0
    for lid, final in finals.items():
        path = os.path.join(MD_DIR, lid + ".md")
        if not os.path.exists(path):
            missing += 1
            continue
        txt = open(path, encoding="utf-8").read()
        m = PAT.search(txt)
        if not m:
            nohdr += 1
            continue
        new_block = "> " + final + "\n"
        if m.group(2) == new_block:
            skipped += 1
            continue
        new_txt = txt[:m.start(2)] + new_block + txt[m.end(2):]
        if not dry:
            open(path, "w", encoding="utf-8").write(new_txt)
        changed += 1
    print(f"{'DRY ' if dry else ''}changed {changed} | already-synced {skipped} "
          f"| no-header {nohdr} | missing-file {missing} | total {len(finals)}")


if __name__ == "__main__":
    main()
