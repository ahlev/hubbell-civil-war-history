#!/usr/bin/env python
"""
Update hubbell-dashboard.html with all 274 letters and add Mother as a tracked individual.
"""
import json, re, os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DASHBOARD = os.path.join(BASE, "hubbell-dashboard.html")
LETTERS_JSON = os.path.join(BASE, "03-data", "all-letters.json")

# Read files
with open(DASHBOARD, 'r', encoding='utf-8') as f:
    html = f.read()
with open(LETTERS_JSON, 'r', encoding='utf-8') as f:
    letters = json.load(f)

print(f"Dashboard size: {len(html)} chars")
print(f"Letters to embed: {len(letters)}")

changes = []

# ============================================================
# 1. Add Mother CSS variables after --charles-mid
# ============================================================
old_css = """            --charles: #8B3A3A;
            --charles-light: #8B3A3A18;
            --charles-mid: #8B3A3A55;

            --bg:"""
new_css = """            --charles: #8B3A3A;
            --charles-light: #8B3A3A18;
            --charles-mid: #8B3A3A55;
            --mother: #7B5EA7;
            --mother-light: #7B5EA718;
            --mother-mid: #7B5EA755;

            --bg:"""
if old_css in html:
    html = html.replace(old_css, new_css, 1)
    changes.append("Added Mother CSS variables (--mother: #7B5EA7 purple)")
else:
    print("WARNING: Could not find CSS insertion point for Mother variables")

# ============================================================
# 2. Add Mother to KPI card CSS
# ============================================================
old_kpi_css = ".kpi-card.charles .brother-name, .kpi-card.charles .letter-count { color: var(--charles); }"
new_kpi_css = old_kpi_css + "\n        .kpi-card.mother .brother-name, .kpi-card.mother .letter-count { color: var(--mother); }"
if old_kpi_css in html:
    html = html.replace(old_kpi_css, new_kpi_css, 1)
    changes.append("Added Mother KPI card CSS")
else:
    print("WARNING: Could not find KPI card CSS for Mother")

# ============================================================
# 3. Update header subtitle: "116 Letters" -> "274 Letters"
# ============================================================
old_subtitle = "116 Letters Transcribed"
new_subtitle = f"{len(letters)} Letters Transcribed"
if old_subtitle in html:
    html = html.replace(old_subtitle, new_subtitle, 1)
    changes.append(f"Updated header subtitle to {len(letters)} Letters")

# Also update date range in subtitle
old_range = "June 1861 — October 1862"
new_range = "July 1861 — November 1870"
html = html.replace(old_range, new_range)
changes.append("Updated date range to July 1861 — November 1870")

# ============================================================
# 4. Replace the main LETTERS constant (line ~2631)
# ============================================================
# The LETTERS constant is a massive single-line array. Find it.
# Pattern: "const LETTERS = [..." at the global script level (not inside IIFEs)
# We need the first occurrence (the global one at ~line 2631)
letters_json_str = json.dumps(letters, ensure_ascii=False)

# Find the first const LETTERS = [...];
# This is tricky because it's all on one line. Let's find position.
match = re.search(r'(const LETTERS = \[)(.+?)(\];\s*\n\s*const EVENTS)', html)
if match:
    start = match.start(1)
    end = match.start(3)
    old_len = end - start
    html = html[:start] + 'const LETTERS = ' + letters_json_str + ';\n    const EVENTS' + html[match.end(3):]
    changes.append(f"Replaced LETTERS constant ({old_len} chars -> {len(letters_json_str)} chars)")
else:
    print("WARNING: Could not find LETTERS constant to replace")
    # Try alternative pattern
    idx = html.find('const LETTERS = [')
    if idx >= 0:
        # Find the matching ];
        bracket_depth = 0
        i = idx + len('const LETTERS = ')
        while i < len(html):
            if html[i] == '[':
                bracket_depth += 1
            elif html[i] == ']':
                bracket_depth -= 1
                if bracket_depth == 0:
                    end = i + 1
                    # Find the semicolon
                    while i < len(html) and html[i] in ' \t\n;':
                        i += 1
                    old_section = html[idx:end+1]
                    html = html[:idx] + 'const LETTERS = ' + letters_json_str + ';' + html[end+1:]
                    changes.append(f"Replaced LETTERS constant (fallback method, {len(old_section)} chars)")
                    break
            i += 1

# ============================================================
# 5. Update COLORS to include Mother
# ============================================================
old_colors = "const COLORS = { henry: '#2D5F8A', alexander: '#B8860B', james: '#4A7C59', charles: '#8B3A3A' };"
new_colors = "const COLORS = { henry: '#2D5F8A', alexander: '#B8860B', james: '#4A7C59', charles: '#8B3A3A', mother: '#7B5EA7', unknown: '#9B9B9B' };"
if old_colors in html:
    html = html.replace(old_colors, new_colors, 1)
    changes.append("Added Mother and unknown to COLORS")

# ============================================================
# 6. Update NAMES to include Mother
# ============================================================
old_names = """    const NAMES = {
        henry: 'Henry Hubbell',
        alexander: 'Alexander F. Hubbell',
        james: 'James Hubbell',
        charles: 'Charles F. Hubbell'
    };"""
new_names = """    const NAMES = {
        henry: 'Henry Hubbell',
        alexander: 'Alexander F. Hubbell',
        james: 'James Hubbell',
        charles: 'Charles F. Hubbell',
        mother: 'Mrs. Frances Hubbell',
        unknown: 'Other Correspondents'
    };"""
if old_names in html:
    html = html.replace(old_names, new_names, 1)
    changes.append("Added Mother and unknown to NAMES")

# ============================================================
# 7. Update UNITS to include Mother
# ============================================================
old_units = """    const UNITS = {
        henry: 'Co. D, 34th New York Volunteers',
        alexander: 'Co. H, 60th New York Volunteers',
        james: 'U.S. Military Academy, West Point',
        charles: 'U.S. Barracks, Plattsburgh'
    };"""
new_units = """    const UNITS = {
        henry: 'Co. D, 34th New York Volunteers',
        alexander: 'Co. H, 60th New York Volunteers',
        james: 'U.S. Military Academy, West Point',
        charles: 'U.S. Barracks, Plattsburgh',
        mother: 'Home Front — Champlain, NY',
        unknown: 'Various'
    };"""
if old_units in html:
    html = html.replace(old_units, new_units, 1)
    changes.append("Added Mother and unknown to UNITS")

# ============================================================
# 8. Update KPI cards loop to include Mother
# ============================================================
old_kpi_loop = "['henry','alexander','james','charles'].forEach(b => {"
new_kpi_loop = "['henry','alexander','james','charles','mother'].forEach(b => {"
# Replace only in the buildKPIs function context (first occurrence)
if old_kpi_loop in html:
    html = html.replace(old_kpi_loop, new_kpi_loop, 1)
    changes.append("Added Mother to KPI cards loop")

# ============================================================
# 9. Update swim lane brothers array in buildTimeline
# ============================================================
old_swim = "const brothers = ['henry','alexander','james','charles'].filter(b => LETTERS.some(l => l.author === b));"
new_swim = "const brothers = ['henry','alexander','james','charles','mother'].filter(b => LETTERS.some(l => l.author === b));"
if old_swim in html:
    html = html.replace(old_swim, new_swim, 1)
    changes.append("Added Mother to swim lane brothers array")

# ============================================================
# 10. Update timeline date range (minDate/maxDate)
# ============================================================
old_min = "const minDate = parseDate('1861-06-01');"
new_min = "const minDate = parseDate('1861-06-01');"  # Keep start
old_max = "const maxDate = parseDate('1862-10-15');"
new_max = "const maxDate = parseDate('1870-12-31');"
if old_max in html:
    html = html.replace(old_max, new_max, 1)
    changes.append("Extended timeline maxDate to 1870-12-31")

# ============================================================
# 11. Update Emotional Arcs section (line ~3009 area)
# ============================================================
# AUTHORS object
old_authors = """var AUTHORS = {
  henry:     { name: 'Henry',     color: '#2D5F8A' },
  alexander: { name: 'Alexander', color: '#B8860B' },
  james:     { name: 'James',     color: '#4A7C59' },
  charles:   { name: 'Charles',   color: '#8B3A3A' }
};"""
new_authors = """var AUTHORS = {
  henry:     { name: 'Henry',     color: '#2D5F8A' },
  alexander: { name: 'Alexander', color: '#B8860B' },
  james:     { name: 'James',     color: '#4A7C59' },
  charles:   { name: 'Charles',   color: '#8B3A3A' },
  mother:    { name: 'Mother',    color: '#7B5EA7' }
};"""
if old_authors in html:
    html = html.replace(old_authors, new_authors, 1)
    changes.append("Added Mother to Emotional Arcs AUTHORS")

# knownAuthors
old_known = "var knownAuthors = ['henry','alexander','james','charles'];"
new_known = "var knownAuthors = ['henry','alexander','james','charles','mother'];"
if old_known in html:
    html = html.replace(old_known, new_known, 1)
    changes.append("Added Mother to knownAuthors")

# Emotional Arcs xMin/xMax
old_xmin = "var xMin = new Date('1861-06-01T00:00:00');"
new_xmin = "var xMin = new Date('1861-06-01T00:00:00');"  # keep
old_xmax = "var xMax = new Date('1862-10-31T00:00:00');"
new_xmax = "var xMax = new Date('1871-01-01T00:00:00');"
if old_xmax in html:
    html = html.replace(old_xmax, new_xmax, 1)
    changes.append("Extended Emotional Arcs xMax to 1871-01-01")

# Visibility state
old_vis = "var visible = { henry: true, alexander: true, james: true, charles: true };"
new_vis = "var visible = { henry: true, alexander: true, james: true, charles: true, mother: true };"
if old_vis in html:
    html = html.replace(old_vis, new_vis, 1)
    changes.append("Added Mother to visibility state")

# authorOrder arrays in Emotional Arcs
old_ao1 = "var authorOrder = ['henry', 'alexander', 'james', 'charles'];"
new_ao1 = "var authorOrder = ['henry', 'alexander', 'james', 'charles', 'mother'];"
html = html.replace(old_ao1, new_ao1)

old_ao2 = "var authorOrder = ['henry','alexander','james','charles'];"
new_ao2 = "var authorOrder = ['henry','alexander','james','charles','mother'];"
html = html.replace(old_ao2, new_ao2)
changes.append("Added Mother to all authorOrder arrays")

# ============================================================
# 12. Update other viz COLORS objects that have the 4-brother pattern
# ============================================================
# Money Story, Health Ledger, etc. have their own color objects inside IIFEs
# Add mother to any COLORS-like objects we find
old_colors2 = """henry: '#2D5F8A',
  alexander: '#B8860B',
  james: '#4A7C59',
  charles: '#8B3A3A',
  unknown: '#9B9B9B'"""
new_colors2 = """henry: '#2D5F8A',
  alexander: '#B8860B',
  james: '#4A7C59',
  charles: '#8B3A3A',
  mother: '#7B5EA7',
  unknown: '#9B9B9B'"""
count = html.count(old_colors2)
if count > 0:
    html = html.replace(old_colors2, new_colors2)
    changes.append(f"Added Mother to {count} other COLORS objects")

# ============================================================
# Write output
# ============================================================
with open(DASHBOARD, 'w', encoding='utf-8') as f:
    f.write(html)

print(f"\nDashboard updated: {len(html)} chars ({len(html)/1024:.0f} KB)")
print(f"\nChanges made ({len(changes)}):")
for c in changes:
    print(f"  ✓ {c}")
