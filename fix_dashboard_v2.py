#!/usr/bin/env python
"""Fix timeline grid, legend, and Mother display for multi-year range."""
import re, os

BASE = os.path.dirname(__file__)
DASHBOARD = os.path.join(BASE, "hubbell-dashboard.html")

with open(DASHBOARD, 'r', encoding='utf-8') as f:
    html = f.read()

changes = []

# ============================================================
# 1. Fix the hardcoded month grid (1861-1862) to cover full range
# ============================================================
old_grid = """        // Month grid
        const fm = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        for (let y = 1861; y <= 1862; y++) {
            for (let m = (y===1861?6:1); m <= (y===1862?10:12); m++) {
                const ds = `${y}-${String(m).padStart(2,'0')}-01`;
                const x = xPos(ds);
                s += `<line x1="${x}" y1="${margin.top-20}" x2="${x}" y2="${height-margin.bottom}" stroke="#E8E4DF" stroke-width="1"/>`;
                s += `<text x="${x+4}" y="${margin.top-28}" font-size="10" fill="#9B9B9B" font-weight="500">${fm[m-1]}</text>`;
                if (m === 1) s += `<text x="${x+4}" y="${margin.top-42}" font-size="12" fill="#6B6B6B" font-weight="600">${y}</text>`;
            }
        }
        s += `<text x="${xPos('1861-06-01')+4}" y="${margin.top-42}" font-size="12" fill="#6B6B6B" font-weight="600">1861</text>`;"""

new_grid = """        // Month grid — adaptive: quarterly ticks for multi-year ranges
        const fm = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const startYear = minDate.getFullYear(), endYear = maxDate.getFullYear();
        const totalMonths = (endYear - startYear) * 12 + (maxDate.getMonth() - minDate.getMonth());
        const showAllMonths = totalMonths <= 24;
        for (let y = startYear; y <= endYear; y++) {
            for (let m = 1; m <= 12; m++) {
                const ds = `${y}-${String(m).padStart(2,'0')}-01`;
                const d = parseDate(ds);
                if (d < minDate || d > maxDate) continue;
                const x = xPos(ds);
                const isQuarter = (m % 3 === 1);
                const isJan = (m === 1);
                if (showAllMonths || isQuarter) {
                    s += `<line x1="${x}" y1="${margin.top-20}" x2="${x}" y2="${height-margin.bottom}" stroke="#E8E4DF" stroke-width="${isJan ? '1.5' : '1'}"/>`;
                    s += `<text x="${x+4}" y="${margin.top-28}" font-size="10" fill="#9B9B9B" font-weight="500">${fm[m-1]}</text>`;
                }
                if (isJan || (y === startYear && m <= minDate.getMonth()+1)) {
                    const yearX = isJan ? x : xPos(`${y}-${String(minDate.getMonth()+1).padStart(2,'0')}-01`);
                    if (isJan) s += `<text x="${x+4}" y="${margin.top-42}" font-size="12" fill="#6B6B6B" font-weight="600">${y}</text>`;
                }
            }
        }
        // First year label if not January-aligned
        if (minDate.getMonth() > 0) {
            const firstX = xPos(`${startYear}-${String(minDate.getMonth()+1).padStart(2,'0')}-01`);
            s += `<text x="${firstX+4}" y="${margin.top-42}" font-size="12" fill="#6B6B6B" font-weight="600">${startYear}</text>`;
        }"""

if old_grid in html:
    html = html.replace(old_grid, new_grid, 1)
    changes.append("Replaced hardcoded month grid with adaptive multi-year grid")
else:
    print("WARNING: Could not find month grid code")

# ============================================================
# 2. Add Mother to the HTML legend
# ============================================================
old_legend_html = '<div class="legend-item"><div class="legend-dot" style="background:var(--charles)"></div> Charles (Plattsburgh)</div>'
new_legend_html = old_legend_html + '\n                <div class="legend-item"><div class="legend-dot" style="background:var(--mother)"></div> Mother (Champlain)</div>'
if old_legend_html in html:
    html = html.replace(old_legend_html, new_legend_html, 1)
    changes.append("Added Mother to HTML legend")

# ============================================================
# 3. Fix NAMES so Mother's display uses first word properly
#    NAMES[b].split(' ')[0] is used for swim lane labels
#    Also in swim lane: UNITS[b].split(',')[0]
# ============================================================
# Already fixed 'Mother (Frances Hubbell)' - verify
if "mother: 'Mother (Frances Hubbell)'" in html:
    changes.append("Mother display name already fixed")
else:
    print("WARNING: Mother display name not in expected format")

# ============================================================
# 4. Handle letters outside the visible date range gracefully
#    The 1870 letter will have xPos beyond the SVG width.
#    Add a bounds check in the dot rendering.
# ============================================================
old_dots = """        LETTERS.forEach((l, i) => {
            if (!brothers.includes(l.author)) return;
            const k = l.date+'-'+l.author;
            dateIndex[k] = (dateIndex[k]||0)+1;
            const idx = dateIndex[k], total = dateCounts[k];

            const cx = xPos(l.date), cy = yPos(l.author);"""
new_dots = """        LETTERS.forEach((l, i) => {
            if (!brothers.includes(l.author)) return;
            const k = l.date+'-'+l.author;
            dateIndex[k] = (dateIndex[k]||0)+1;
            const idx = dateIndex[k], total = dateCounts[k];

            const cx = xPos(l.date), cy = yPos(l.author);
            // Skip letters outside visible date range
            if (cx < margin.left - 10 || cx > width - margin.right + 10) return;"""
if old_dots in html:
    html = html.replace(old_dots, new_dots, 1)
    changes.append("Added bounds check to skip letters outside visible range")
else:
    print("WARNING: Could not find dots rendering code")

# ============================================================
# Write
# ============================================================
with open(DASHBOARD, 'w', encoding='utf-8') as f:
    f.write(html)

print(f"\nDashboard updated: {len(html)} chars")
print(f"\nChanges ({len(changes)}):")
for c in changes:
    print(f"  - {c}")
