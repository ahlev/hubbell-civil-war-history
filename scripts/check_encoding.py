#!/usr/bin/env python
"""Check for mojibake in parsed letter data."""
import json, os, glob

with open("03-data/all-letters.json", "r", encoding="utf-8") as f:
    data = f.read()

# Check raw bytes for mojibake sequences
raw = data.encode("utf-8")
# \xc3\xa2\xc2\x80\xc2\x94 = double-encoded em dash
# But in the JSON text, mojibake looks like: \u00e2\u0080\u0094 rendered as characters
# Actually, let's just search for the text patterns

patterns = [
    (b"\xc3\xa2\xc2\x80\xc2\x94", "double-encoded em-dash"),
    (b"\xc3\xa2\xc2\x80\xc2\x93", "double-encoded en-dash"),
    (b"\xc3\x82\xc2\xb7", "double-encoded middle-dot"),
]

for pat, name in patterns:
    count = raw.count(pat)
    if count:
        print(f"Found {count} occurrences of {name}")

# Also just search for common mojibake text patterns
text_pats = [
    ("\u00e2\u20ac\u201c", "em-dash-mojibake-1"),
    ("\u00e2\u20ac\u201d", "em-dash-mojibake-2"),
    ("\u00c2\u00b7", "middle-dot-mojibake"),
]
for pat, name in text_pats:
    count = data.count(pat)
    if count:
        print(f"Found {count} occurrences of {name} in JSON text")

# Simpler: search for the actual garbled strings the user reported
user_reported = [
    "\u00e2\u20ac\u201c",  # might not be exactly this
]

# Let's just look for bytes that shouldn't be in well-formed UTF-8 JSON
# Search for \xc2 followed by \xb7 (which is the middle dot in proper UTF-8)
# vs \xc3\x82\xc2\xb7 (double encoded)
print(f"\nClean middle dots (U+00B7): {data.count(chr(0xB7))}")
print(f"Clean em-dashes (U+2014): {data.count(chr(0x2014))}")
print(f"Clean en-dashes (U+2013): {data.count(chr(0x2013))}")
print(f"Clean curly quotes: {data.count(chr(0x201C))} left, {data.count(chr(0x201D))} right")
print(f"Clean apostrophes (U+2019): {data.count(chr(0x2019))}")

# Now check a source markdown file
print("\n--- Source markdown check ---")
for fp in sorted(glob.glob("02-transcribed-markdown/letters/LTR-1862-10-29-001.md")):
    with open(fp, "r", encoding="utf-8") as f:
        text = f.read()
    print(f"\n{os.path.basename(fp)}:")
    print(f"  Clean em-dashes: {text.count(chr(0x2014))}")
    print(f"  Clean middle dots: {text.count(chr(0xB7))}")
    # Check for double-encoded bytes
    raw_md = text.encode("utf-8")
    if b"\xc3\xa2" in raw_md:
        print("  WARNING: possible double-encoding detected")
    else:
        print("  No double-encoding detected")

# Check what the dashboard HTML file actually contains
print("\n--- Dashboard HTML check ---")
# Just read a small portion around a known letter
with open("hubbell-dashboard.html", "r", encoding="utf-8") as f:
    html = f.read()
# Find a Mother letter with likely mojibake
idx = html.find("Thanksgiving refusal")
if idx > 0:
    snippet = html[idx-50:idx+200]
    print(f"Snippet around 'Thanksgiving refusal':")
    print(repr(snippet[:200]))
else:
    print("Could not find 'Thanksgiving refusal'")

# Also search for the reported patterns
for term in ["\\u00e2\\u0080", "\\u00c2\\u00b7"]:
    if term in html:
        print(f"Found JSON escape {term} in HTML")

# Check for actual mojibake chars in the HTML
mojibake_count = 0
for ch in ["\u00e2", "\u00c2"]:
    c = html.count(ch)
    if c > 0:
        mojibake_count += c
print(f"\nSuspicious chars (0xE2 as char): {html.count(chr(0xE2))}")
print(f"Suspicious chars (0xC2 as char): {html.count(chr(0xC2))}")
