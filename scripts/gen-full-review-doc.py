"""Full-collection side-by-side review (markdown): OLD vs NEW summary for all
273 letters, grouped by author, with character counts and a flag on the few
substance-dense entries kept intentionally above the 460 target.
Output: 04-analysis/sigsummary-v2-full-review.md
Reads only 04-analysis/sigsummary-v2-all-proposals.json (nothing canonical).
"""
import json
import re
from collections import defaultdict

PROP = "04-analysis/sigsummary-v2-all-proposals.json"
OUT = "04-analysis/sigsummary-v2-full-review.md"

AUTHOR_NAME = {
    "henry": "Henry", "alexander": "Alexander", "charles": "Charles",
    "james": "James", "mother": "Mother (Caroline)", "mcdonald": "McDonald",
    "luther": "Luther", "mcneil": "McNeil",
}
ORDER = ["henry", "alexander", "charles", "james", "mother",
         "mcdonald", "luther", "mcneil"]


def cell(s):
    if not s:
        return "—"
    s = s.replace("ï¿½", "—").replace("�", "—")
    s = re.sub(r"\s+", " ", s).strip()
    return s.replace("|", "\\|")


P = json.load(open(PROP, encoding="utf-8"))
by_author = defaultdict(list)
for r in P:
    by_author[r["author"]].append(r)

total = len(P)
in_band = sum(1 for r in P if 350 <= len(r["final"]) <= 460)
tol = sum(1 for r in P if 460 < len(r["final"]) <= 490)
over = sum(1 for r in P if len(r["final"]) > 490)
ls = sorted(len(r["final"]) for r in P)

lines = [
    "# Hubbell letter summaries — full review (old → new)\n",
    f"**All {total} letters.** Each new summary is a 1–3 sentence executive hook "
    "(target ~350–460 characters) that leads with the one or two key facts a reader needs "
    "for grounding, weaves in the human beat without sentimentality, and is **grounded only "
    "in that letter** — *filter, never a source*: nothing invented, no outside or biographical "
    "context imported.\n",
    "Every summary was written by a single expert-editor pass channeling four perspectives — "
    "**Civil War historian · American military-history expert · David McCullough (narrative) · "
    "historical copywriter** — then put through a craft-compression pass to reach the length target.\n",
    "### Length\n",
    f"- Within target (≤460): **{in_band}** · within tolerance (461–490): **{tol}** · "
    f"substance-dense, kept longer by design (>490): **{over}**\n",
    f"- min {ls[0]} · median {ls[len(ls)//2]} · max {ls[-1]} characters\n",
    "Rows marked **⟡** run over 490: these are the few letters carrying enough essential "
    "substance that compressing further would have cost real content, so they were kept whole. "
    "Flag any you'd like cut harder.\n",
    "---\n",
]

for key in ORDER:
    rows = sorted(by_author.get(key, []), key=lambda r: r["date"])
    if not rows:
        continue
    name = AUTHOR_NAME.get(key, key.title())
    lines.append(f"\n## {name} — {len(rows)} letters\n")
    lines.append("| # | Date | Old summary | New summary | Len |")
    lines.append("|---|------|-------------|-------------|-----|")
    for i, r in enumerate(rows, 1):
        n = len(r["final"])
        flag = " ⟡" if n > 490 else ""
        lines.append(f"| {i} | {r['date']} | {cell(r['old'])} | {cell(r['final'])} | {n}{flag} |")

open(OUT, "w", encoding="utf-8").write("\n".join(lines) + "\n")
print(f"Wrote {OUT}")
print(f"  {total} rows | in-band {in_band} | tol {tol} | over-490 {over}")
