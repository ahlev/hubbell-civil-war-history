#!/usr/bin/env python
"""Add 1863-1865 events to the EVENTS constant in the dashboard."""
import json

DASHBOARD = "hubbell-dashboard.html"

with open(DASHBOARD, "r", encoding="utf-8") as f:
    html = f.read()

# Complete events list: original 13 + new events for 1863-1865
all_events = [
    # 1861
    {"date": "1861-07-21", "label": "First Bull Run", "type": "battle"},
    {"date": "1861-09-20", "label": "Alexander enlists", "type": "personal"},
    {"date": "1861-11-13", "label": "60th NY to Baltimore", "type": "movement"},
    # 1862
    {"date": "1862-02-26", "label": "34th NY to Harpers Ferry", "type": "movement"},
    {"date": "1862-04-05", "label": "Siege of Yorktown begins", "type": "battle"},
    {"date": "1862-05-05", "label": "Yorktown evacuated", "type": "battle"},
    {"date": "1862-05-31", "label": "Battle of Fair Oaks", "type": "battle"},
    {"date": "1862-06-25", "label": "Seven Days begin", "type": "battle"},
    {"date": "1862-07-01", "label": "Battle of Malvern Hill", "type": "battle"},
    {"date": "1862-08-28", "label": "Second Bull Run", "type": "battle"},
    {"date": "1862-09-09", "label": "Charles enlists", "type": "personal"},
    {"date": "1862-09-17", "label": "Battle of Antietam", "type": "battle"},
    {"date": "1862-09-27", "label": "Alexander hospitalized", "type": "personal"},
    # 1863
    {"date": "1863-01-01", "label": "Emancipation Proclamation", "type": "personal"},
    {"date": "1863-05-02", "label": "Battle of Chancellorsville", "type": "battle"},
    {"date": "1863-05-04", "label": "Henry confirmed dead", "type": "personal"},
    {"date": "1863-07-02", "label": "Battle of Gettysburg", "type": "battle"},
    {"date": "1863-11-24", "label": "Battle of Lookout Mountain", "type": "battle"},
    # 1864
    {"date": "1864-05-05", "label": "Battle of the Wilderness", "type": "battle"},
    {"date": "1864-05-10", "label": "Battle of Rocky Face Ridge", "type": "battle"},
    {"date": "1864-09-19", "label": "Third Battle of Winchester", "type": "battle"},
    {"date": "1864-11-15", "label": "Sherman's March begins", "type": "movement"},
    {"date": "1864-12-15", "label": "Battle of Nashville", "type": "battle"},
    # 1865
    {"date": "1865-04-09", "label": "Lee surrenders", "type": "personal"},
    {"date": "1865-04-14", "label": "Lincoln assassinated", "type": "personal"},
    {"date": "1865-06-12", "label": "Charles to Savannah", "type": "movement"},
]

new_json = json.dumps(all_events, ensure_ascii=False)

# Find and replace the first EVENTS constant
marker = "const EVENTS = ["
idx = html.find(marker)
if idx < 0:
    print("ERROR: Could not find EVENTS")
    exit(1)

# Find the closing ];
i = idx + len("const EVENTS = ")
depth = 0
end = -1
for j in range(i, len(html)):
    if html[j] == "[": depth += 1
    elif html[j] == "]":
        depth -= 1
        if depth == 0:
            end = j + 1
            break

if end < 0:
    print("ERROR: Could not find end of EVENTS")
    exit(1)

html = html[:idx] + "const EVENTS = " + new_json + html[end:]

# Also update the Emotional Arcs EVENTS (second occurrence, inside the IIFE)
# Find the second EVENTS
idx2 = html.find("const EVENTS = [", idx + len(new_json))
if idx2 > 0:
    i2 = idx2 + len("const EVENTS = ")
    depth = 0
    end2 = -1
    for j in range(i2, len(html)):
        if html[j] == "[": depth += 1
        elif html[j] == "]":
            depth -= 1
            if depth == 0:
                end2 = j + 1
                break
    if end2 > 0:
        html = html[:idx2] + "const EVENTS = " + new_json + html[end2:]
        print(f"Updated both EVENTS constants (13 -> {len(all_events)} events)")
    else:
        print("Updated first EVENTS only")
else:
    print(f"Updated first EVENTS ({len(all_events)} events)")

with open(DASHBOARD, "w", encoding="utf-8") as f:
    f.write(html)
print(f"Dashboard: {len(html)} chars ({len(html)//1024} KB)")
