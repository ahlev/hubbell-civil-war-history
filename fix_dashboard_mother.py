#!/usr/bin/env python
"""Fix Mother's display name, legend, and timeline scale issues."""
import re, os

BASE = os.path.dirname(__file__)
DASHBOARD = os.path.join(BASE, "hubbell-dashboard.html")

with open(DASHBOARD, 'r', encoding='utf-8') as f:
    html = f.read()

changes = []

# ============================================================
# 1. Fix Mother's display name in NAMES
#    "Mrs. Frances Hubbell" -> "Mother (Frances Hubbell)"
#    So .split(' ')[0] gives "Mother"
# ============================================================
html = html.replace(
    "mother: 'Mrs. Frances Hubbell'",
    "mother: 'Mother (Frances Hubbell)'"
)
changes.append("Fixed Mother display name")

# ============================================================
# 2. Add Mother to the Parallel Lives legend
# ============================================================
# Find the legend HTML in buildTimeline
old_legend = """s += '<circle cx="' + (lx+6) + '" cy="' + ly + '" r="4" fill="' + COLORS.charles + '"/>';
            s += '<text x="' + (lx+14) + '" y="' + (ly+4) + '" font-size="11" fill="#6B6B6B">Charles (Plattsburgh)</text>';"""
new_legend = """s += '<circle cx="' + (lx+6) + '" cy="' + ly + '" r="4" fill="' + COLORS.charles + '"/>';
            s += '<text x="' + (lx+14) + '" y="' + (ly+4) + '" font-size="11" fill="#6B6B6B">Charles (Plattsburgh)</text>';
            lx += 140;
            s += '<circle cx="' + (lx+6) + '" cy="' + ly + '" r="4" fill="' + (COLORS.mother || '#7B5EA7') + '"/>';
            s += '<text x="' + (lx+14) + '" y="' + (ly+4) + '" font-size="11" fill="#6B6B6B">Mother (Champlain)</text>';"""
if old_legend in html:
    html = html.replace(old_legend, new_legend, 1)
    changes.append("Added Mother to timeline legend")
else:
    print("WARNING: Could not find legend insertion point")
    # Try a simpler search
    idx = html.find("Charles (Plattsburgh)</text>'")
    if idx > 0:
        print(f"  Found 'Charles (Plattsburgh)' at char {idx}")

# ============================================================
# 3. Fix the swim lane label truncation for Mother
#    The swim lane label uses NAMES[b].split(' ')[0] which gives "Mother" now
#    And the unit label truncates at 20 chars. "Home Front -- Champlain, NY" is 27 chars.
#    Let's check and fix if needed.
# ============================================================
# The unit line in buildTimeline:
old_unit_trunc = "const unitLabel = UNITS[b].length > 20 ? UNITS[b].substring(0, 20) : UNITS[b];"
if old_unit_trunc in html:
    html = html.replace(old_unit_trunc,
        "const unitLabel = UNITS[b].length > 28 ? UNITS[b].substring(0, 28) : UNITS[b];")
    changes.append("Extended unit label truncation from 20 to 28 chars")

# ============================================================
# 4. Fix timeline date range - use 1861-06 to 1866-01 as default
#    This covers the full war (Apr 1865) plus a buffer.
#    The 1870 letter will be off-screen but that's okay for the main view.
#    We could add a note about it.
# ============================================================
html = html.replace(
    "const maxDate = parseDate('1870-12-31');",
    "const maxDate = parseDate('1866-01-01');"
)
changes.append("Adjusted timeline maxDate to 1866-01-01 (war era)")

# Also fix the Emotional Arcs xMax
html = html.replace(
    "var xMax = new Date('1871-01-01T00:00:00');",
    "var xMax = new Date('1866-02-01T00:00:00');"
)
changes.append("Adjusted Emotional Arcs xMax to 1866-02-01")

# ============================================================
# 5. Fix the header subtitle to reflect the full range properly
# ============================================================
html = html.replace(
    "July 1861 — November 1870",
    "July 1861 — July 1865"
)
# Actually the 1870 letter exists, let's keep it accurate
# but the timeline shows the war period
html = html.replace(
    "July 1861 — July 1865",
    "July 1861 — November 1870"
)
# Keep it as is - accurate to the data

# ============================================================
# 6. Update the footer to include Mother
# ============================================================
old_footer = "Letters of Henry, Alexander, James &amp; Charles Hubbell"
new_footer = "Letters of Henry, Alexander, James, Charles &amp; Frances Hubbell"
if old_footer in html:
    html = html.replace(old_footer, new_footer, 1)
    changes.append("Updated footer to include Frances (Mother)")
else:
    # Try without &amp;
    old_footer2 = "Letters of Henry, Alexander, James & Charles Hubbell"
    new_footer2 = "Letters of Henry, Alexander, James, Charles & Frances Hubbell"
    if old_footer2 in html:
        html = html.replace(old_footer2, new_footer2, 1)
        changes.append("Updated footer to include Frances (Mother)")

# ============================================================
# 7. Improve the X-axis tick marks for a multi-year timeline
#    The existing code generates monthly ticks which is too dense for 5 years
# ============================================================
# Find the month tick generation code in buildTimeline
# The code iterates months and draws tick labels
# For a 5-year span, we should show quarterly or yearly ticks instead
old_ticks = """            // Month ticks
            let tick = new Date(minDate);
            while (tick <= maxDate) {
                const x = xPos(tick.toISOString().slice(0,10));
                const label = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][tick.getMonth()];
                s += '<line x1="' + x + '" y1="' + margin.top + '" x2="' + x + '" y2="' + (margin.top + brothers.length * laneHeight) + '" stroke="#E8E4DF" stroke-width="0.5"/>';
                s += '<text x="' + x + '" y="' + (margin.top - 8) + '" text-anchor="middle" fill="#9B9B9B" font-size="10">' + label + '</text>';
                // Year label on January
                if (tick.getMonth() === 0) {
                    s += '<text x="' + x + '" y="' + (margin.top - 22) + '" text-anchor="middle" fill="#6B6B6B" font-size="12" font-weight="600">' + tick.getFullYear() + '</text>';
                }
                tick.setMonth(tick.getMonth() + 1);
            }"""
new_ticks = """            // Month/Year ticks - adaptive density based on date range
            let tick = new Date(minDate);
            const totalMonths = (maxDate.getFullYear() - minDate.getFullYear()) * 12 + (maxDate.getMonth() - minDate.getMonth());
            const showAllMonths = totalMonths <= 24;
            while (tick <= maxDate) {
                const x = xPos(tick.toISOString().slice(0,10));
                const label = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][tick.getMonth()];
                const isJan = tick.getMonth() === 0;
                const isQuarter = tick.getMonth() % 3 === 0;
                // Grid lines: show monthly for short ranges, quarterly for long
                if (showAllMonths || isQuarter) {
                    s += '<line x1="' + x + '" y1="' + margin.top + '" x2="' + x + '" y2="' + (margin.top + brothers.length * laneHeight) + '" stroke="#E8E4DF" stroke-width="0.5"/>';
                }
                // Month labels
                if (showAllMonths || isQuarter) {
                    s += '<text x="' + x + '" y="' + (margin.top - 8) + '" text-anchor="middle" fill="#9B9B9B" font-size="10">' + label + '</text>';
                }
                // Year label on January
                if (isJan) {
                    s += '<text x="' + x + '" y="' + (margin.top - 22) + '" text-anchor="middle" fill="#6B6B6B" font-size="12" font-weight="600">' + tick.getFullYear() + '</text>';
                }
                tick.setMonth(tick.getMonth() + 1);
            }"""
if old_ticks in html:
    html = html.replace(old_ticks, new_ticks, 1)
    changes.append("Made X-axis ticks adaptive (quarterly for multi-year ranges)")
else:
    print("WARNING: Could not find month tick code to update")

# ============================================================
# Write output
# ============================================================
with open(DASHBOARD, 'w', encoding='utf-8') as f:
    f.write(html)

print(f"\nDashboard updated: {len(html)} chars")
print(f"\nChanges made ({len(changes)}):")
for c in changes:
    print(f"  - {c}")
