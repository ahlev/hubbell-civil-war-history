#!/usr/bin/env python
"""Rebuild viz-emotional-arcs.html with full war data and interactive zoom."""
import json
import os

PROJ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Load letter data
with open(os.path.join(PROJ, '03-data', 'all-letters.json'), encoding='utf-8') as f:
    letters = json.load(f)

known = ['henry', 'alexander', 'james', 'charles', 'mother']
fields = ['date','author','authorName','emotion','hasBattle','hasIllness','hasDeath','hasWound','notes','significance','location','sigSummary','id','transcription','editorial','recipient']
out = []
for l in letters:
    if l['author'] not in known:
        continue
    entry = {}
    for fld in fields:
        if fld in ('notes','sigSummary','location','transcription','editorial','recipient','id'):
            entry[fld] = l.get(fld, '')
        elif fld in ('hasBattle','hasIllness','hasDeath','hasWound'):
            entry[fld] = l.get(fld, False)
        else:
            entry[fld] = l.get(fld, '')
    out.append(entry)

letters_json = json.dumps(out, ensure_ascii=False)

# Load events from dashboard
import re
with open(os.path.join(PROJ, 'hubbell-dashboard.html'), encoding='utf-8') as f:
    content = f.read()
m = re.search(r'const EVENTS = (\[.*?\]);', content, re.DOTALL)
events = json.loads(m.group(1))
existing = set(e['date'] for e in events)
extra = [
    {'date':'1862-12-13','label':'Battle of Fredericksburg','type':'battle'},
    {'date':'1863-05-04','label':'Battle of Chancellorsville','type':'battle'},
    {'date':'1863-07-03','label':'Battle of Gettysburg','type':'battle'},
    {'date':'1863-07-04','label':'Vicksburg falls','type':'battle'},
    {'date':'1863-09-20','label':'Battle of Chickamauga','type':'battle'},
    {'date':'1863-11-25','label':'Battle of Chattanooga','type':'battle'},
    {'date':'1864-05-05','label':'Battle of the Wilderness','type':'battle'},
    {'date':'1864-06-03','label':'Battle of Cold Harbor','type':'battle'},
    {'date':'1864-06-18','label':'Siege of Petersburg begins','type':'battle'},
    {'date':'1864-09-02','label':'Atlanta falls','type':'battle'},
    {'date':'1864-11-16','label':'March to the Sea begins','type':'battle'},
    {'date':'1865-04-02','label':'Petersburg falls','type':'battle'},
]
for e in extra:
    if e['date'] not in existing:
        events.append(e)
events.sort(key=lambda x: x['date'])
events_json = json.dumps(events, ensure_ascii=False)

# Read the JS template
js_path = os.path.join(PROJ, 'scripts', 'emotional-arcs-logic.js')
with open(js_path, encoding='utf-8') as f:
    js_code = f.read()

# Read the HTML template
html_path = os.path.join(PROJ, 'scripts', 'emotional-arcs-template.html')
with open(html_path, encoding='utf-8') as f:
    html_template = f.read()

# Assemble
final = html_template.replace('/* __LETTERS_DATA__ */', 'var LETTERS = ' + letters_json + ';')
final = final.replace('/* __EVENTS_DATA__ */', 'var EVENTS = ' + events_json + ';')
final = final.replace('/* __JS_LOGIC__ */', js_code)

outpath = os.path.join(PROJ, 'viz-emotional-arcs.html')
with open(outpath, 'w', encoding='utf-8') as f:
    f.write(final)

print(f"Written {len(final):,} chars to viz-emotional-arcs.html")
print(f"  Letters: {len(out)}, Events: {len(events)}")
