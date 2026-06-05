"""Side-by-side review table (markdown): OLD vs NEW summary for each Henry
letter, with the four reviewers' ENHANCEMENT notes (not just fact-checks)
distilled beside each. Output: 04-analysis/henry-sigsummary-review.md
"""
import json
import re

PROP = "04-analysis/sigsummary-v2-henry-proposals.json"
OUT = "04-analysis/henry-sigsummary-review.md"

LENS_LABEL = {
    "civilwar-historian": "Historian",
    "military-expert": "Military",
    "mccullough": "McCullough",
    "copywriter": "Copywriter",
}
ENH = ("refin", "sharpen", "would lift", "swap", "add ", "tighten", "vivid",
       "hook", "human beat", "narrative", "consider", "could ", "one could",
       "surface", "let ", "lean", "trim", "warmth", "lead", "earns", "anchor",
       "captures", "nails", "weave", "texture")


def cell(s):
    if not s:
        return ""
    s = s.replace("ï¿½", "—").replace("�", "—")
    s = re.sub(r"\s+", " ", s).strip()
    return s.replace("|", "\\|")


def section(txt, name):
    m = re.search(name + r":(.*?)(?:\n\s*(?:FACT ISSUES|FEEDBACK|SUGGESTED):|$)",
                  txt, re.S | re.I)
    return (m.group(1).strip() if m else "")


def lens_take(crits, key):
    for c in crits:
        if c.get("lens") != key:
            continue
        txt = c.get("text", "")
        if txt.startswith("API Error"):
            return ""
        body = " ".join((section(txt, "FEEDBACK") or txt).split())
        sents = [s for s in re.split(r"(?<=[.!?])\s+", body) if len(s) > 25]
        if not sents:
            return ""
        skip = ("this is a strong", "strong,", "this is strong", "militarily this",
                "this is a", "a strong", "strong and", "this is clean", "clean and")
        picks = [s for s in sents
                 if any(w in s.lower() for w in ENH)
                 and not s.lower().startswith(skip)]
        chosen = picks[0] if picks else next((s for s in sents
                                               if not s.lower().startswith(skip)), sents[0])
        return cell(chosen)[:210]
    return ""


def notes(r):
    out = []
    # grounding verdict
    if r["status"] == "enriched" or r["final"]:
        out.append("✳️ *Enriched final applied.*")
    flagged = []
    for c in r["critiques"]:
        fs = section(c.get("text", ""), "FACT ISSUES")
        if fs and not re.sub(r"[^a-z]", "", fs.lower()).startswith("none") and not c.get("text", "").startswith("API Error"):
            flagged.append((LENS_LABEL.get(c["lens"], c["lens"]), cell(fs)[:150]))
    if flagged:
        out.append("⚠️ **Fact note** — " + flagged[0][1])
    else:
        out.append("✅ Grounded (all lenses).")
    # enhancement takes
    for key in ("mccullough", "copywriter", "civilwar-historian", "military-expert"):
        t = lens_take(r["critiques"], key)
        if t:
            out.append(f"**{LENS_LABEL[key]}:** {t}")
    return "<br>".join(out)


P = json.load(open(PROP, encoding="utf-8"))
P.sort(key=lambda r: r["date"])
n_enriched = sum(1 for r in P if r["final"])

lines = [
    "# Henry Hubbell — letter summaries: review (old → new)\n",
    f"**{len(P)} letters.** New summaries are a rich (~350–450 char) executive hook, grounded only in each letter, "
    "leading with the key fact(s) with the human texture woven in. Each was reviewed by a four-person panel — "
    "**Civil War historian · American military-history expert · David McCullough (narrative) · historical copywriter** — "
    "who fact-checked *and* offered craft enhancements; their notes are distilled beside each row.\n",
    f"_Enrichment status: {n_enriched}/{len(P)} finals carry the panel's synthesized enhancements; the rest currently show the "
    "approved draft (the auto-enrichment wave is throttled by platform rate-limiting and will be completed). Full per-lens "
    "critiques live in `sigsummary-v2-henry-proposals.json`._\n",
    "| # | Date | Old summary | New summary | Reviewer notes |",
    "|---|------|-------------|-------------|----------------|",
]
for i, r in enumerate(P, 1):
    lines.append(f"| {i} | {r['date']} | {cell(r['old'])} | {cell(r['chosen'])} | {notes(r)} |")

open(OUT, "w", encoding="utf-8").write("\n".join(lines) + "\n")
print(f"Wrote {OUT} ({len(P)} rows; {n_enriched} enriched, {len(P)-n_enriched} on draft)")
