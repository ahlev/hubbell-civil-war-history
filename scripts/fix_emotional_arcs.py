#!/usr/bin/env python
"""Fix Emotional Arcs IIFE: remove duplicate LETTERS, fix frequency chart buckets."""
import re, os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DASHBOARD = os.path.join(BASE, "hubbell-dashboard.html")

with open(DASHBOARD, 'r', encoding='utf-8') as f:
    html = f.read()

changes = []

# ============================================================
# 1. Remove the IIFE's local var LETTERS = [...] so it uses global
#    The IIFE starts after the HTML template literal.
#    The local LETTERS is at: var LETTERS = [{...},...];
#    We need to find the SECOND occurrence of "var LETTERS = [" or
#    specifically the one inside the IIFE.
# ============================================================
# Find the IIFE's LETTERS. It starts with:
# "var LETTERS = [{"date":"1861-06-06"
# inside the (function() { block
marker = '// === EMBEDDED DATA ===\nvar LETTERS = ['
idx = html.find(marker)
if idx >= 0:
    # Find the end of this array (matching bracket)
    arr_start = idx + len('// === EMBEDDED DATA ===\n') + len('var LETTERS = ')
    depth = 0
    end = -1
    for j in range(arr_start, len(html)):
        if html[j] == '[': depth += 1
        elif html[j] == ']':
            depth -= 1
            if depth == 0:
                end = j + 1
                break

    if end > 0:
        # Find the semicolon after ]
        semi = end
        while semi < len(html) and html[semi] in ' \t\n':
            semi += 1
        if html[semi] == ';':
            semi += 1

        # Replace with a comment that uses the global LETTERS
        old_section = html[idx:semi]
        new_section = '// Uses global LETTERS (274 letters) — no local override needed'
        html = html[:idx] + new_section + html[semi:]
        changes.append(f"Removed IIFE's local LETTERS ({len(old_section)} chars)")
    else:
        print("WARNING: Could not find end of IIFE's LETTERS array")
else:
    print(f"WARNING: Could not find IIFE's LETTERS marker")

# Also check for a local EVENTS inside the IIFE
iife_events = html.find('var EVENTS = [', html.find('// Uses global LETTERS') if '// Uses global LETTERS' in html else 0)
if iife_events > 0:
    # Check if this is inside the emotional arcs IIFE (not another one)
    # Look for the next const/var EVENTS
    context = html[iife_events-200:iife_events]
    if 'emotional-arcs' in context or 'EMOTION_MAP' in context or 'Uses global' in context:
        # Find end of this EVENTS array
        arr_start = iife_events + len('var EVENTS = ')
        depth = 0
        end = -1
        for j in range(arr_start, len(html)):
            if html[j] == '[': depth += 1
            elif html[j] == ']':
                depth -= 1
                if depth == 0:
                    end = j + 1
                    break
        if end > 0:
            semi = end
            while semi < len(html) and html[semi] in ' \t\n':
                semi += 1
            if html[semi] == ';':
                semi += 1
            # Check if the EVENTS data is the same as global
            # If it's small, keep it. If it shadows global, remove it.
            old_events = html[iife_events:semi]
            if len(old_events) < 5000:
                print(f"IIFE EVENTS is small ({len(old_events)} chars), keeping it")
            else:
                html = html[:iife_events] + '// Uses global EVENTS' + html[semi:]
                changes.append("Removed IIFE's local EVENTS")

# ============================================================
# 2. Fix the frequency chart bucket range to be dynamic
# ============================================================
old_buckets = """  var buckets = {};
  var cur = new Date('1861-06-01T00:00:00');
  var end = new Date('1862-11-01T00:00:00');
  while (cur < end) {
    var key = cur.getFullYear() + '-' + String(cur.getMonth() + 1).padStart(2, '0');
    buckets[key] = { henry: 0, alexander: 0, james: 0, charles: 0 };
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
  }"""

new_buckets = """  var buckets = {};
  // Dynamic range from actual data
  var dates = letterData.map(function(l) { return l.dateObj; }).filter(function(d) { return !isNaN(d); });
  var minD = new Date(Math.min.apply(null, dates));
  var maxD = new Date(Math.max.apply(null, dates));
  var cur = new Date(minD.getFullYear(), minD.getMonth(), 1);
  var end = new Date(maxD.getFullYear(), maxD.getMonth() + 1, 1);
  while (cur <= end) {
    var key = cur.getFullYear() + '-' + String(cur.getMonth() + 1).padStart(2, '0');
    buckets[key] = { henry: 0, alexander: 0, james: 0, charles: 0, mother: 0, unknown: 0 };
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
  }"""

if old_buckets in html:
    html = html.replace(old_buckets, new_buckets, 1)
    changes.append("Made frequency chart buckets dynamic with mother/unknown slots")
else:
    print("WARNING: Could not find frequency chart bucket code")

# ============================================================
# 3. Update description text
# ============================================================
old_desc = "Tracing the emotional intensity of each Hubbell brother's letters across 16 months of Civil War correspondence, June 1861 through October 1862."
new_desc = "Tracing the emotional intensity of each family member's letters across the full Civil War period and beyond, July 1861 through July 1865."
html = html.replace(old_desc, new_desc, 1)
changes.append("Updated Emotional Arcs description text")

# ============================================================
# Write
# ============================================================
with open(DASHBOARD, 'w', encoding='utf-8') as f:
    f.write(html)

print(f"\nDashboard: {len(html)} chars ({len(html)/1024:.0f} KB)")
print(f"\nChanges ({len(changes)}):")
for c in changes:
    print(f"  - {c}")
