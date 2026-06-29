"""Insert one <figure class="ch-scene"> after each chapter's .ch-date in
brother-charles.html. Anchored on each chapter's unique ch-date line; asserts
exactly one match per chapter before writing. Idempotent-guarded."""
import io, sys, os

HTML = r"C:\Users\ahlev\OneDrive\Documents\Claude\Projects\Hubbell Civil War Ancestry\brother-charles.html"
BASE = "/experience-v2/assets/brothers/scenes/charles"

# (unique ch-date line, slug, alt)
CHAPTERS = [
    ('<div class="ch-date">September 1862 &mdash; Plattsburgh, New York</div>',
     "ch01-too-honest",
     "Oil painting: nineteen-year-old Charles Hubbell at his enlistment medical exam in a Plattsburgh recruiting office, 1862."),
    ('<div class="ch-date">September &ndash; December 1862</div>',
     "ch02-searching-henry",
     "Oil painting: Charles at a lamplit table sifting letters and rumors for word of his missing brother Henry."),
    ('<div class="ch-date">November 1862 &ndash; Spring 1863</div>',
     "ch03-convalescent-camp",
     "Oil painting: the convalescent sick-camp near Alexandria, Virginia, rows of tents under a cold winter sky."),
    ('<div class="ch-date">April 27, 1863</div>',
     "ch04-headboard",
     "Oil painting: a lone white-painted wooden headboard standing in an Antietam burial field at low autumn light."),
    ('<div class="ch-date">May 1863</div>',
     "ch05-chancellorsville",
     "Oil painting: a close-range skirmish in the dense Wilderness woods at dusk, Union soldiers taking cover among the trees and smoke at Chancellorsville."),
    ('<div class="ch-date">July 1863 &ndash; February 1864 &mdash; Washington, D.C.</div>',
     "ch06-capitol-hill",
     "Oil painting: Charles on guard duty at the Capitol Hill barracks, the completed Capitol dome behind him."),
    ('<div class="ch-date">March 1864 &mdash; New Orleans, Louisiana</div>',
     "ch07-clerk",
     "Oil painting: Charles at a clerk's writing desk in a third-story New Orleans headquarters office, 1864."),
    ('<div class="ch-date">April &ndash; May 1864 &mdash; Louisiana</div>',
     "ch08-red-river",
     "Oil painting: Charles firing from a steamer deck into the wooded banks of the red-clay Red River under guerrilla fire."),
    ('<div class="ch-date">August &ndash; September 1864 &mdash; Virginia</div>',
     "ch09-the-burning",
     "Oil painting: Sheridan's burning of the Shenandoah Valley, barns and grist-mills aflame across the farmland."),
    ('<div class="ch-date">October 19, 1864 &mdash; Cedar Creek, Virginia</div>',
     "ch10-cedar-creek",
     "Oil painting: the dawn surprise at Cedar Creek, Charles and James scrambling over the breastworks as the attack breaks."),
    ('<div class="ch-date">November 1864</div>',
     "ch11-twenty-two-men",
     "Oil painting: the thinned ranks of Company H at roll call, a full company reduced to twenty-two men."),
    ('<div class="ch-date">November 1864 &ndash; April 1865 &mdash; Camp Russell, Virginia</div>',
     "ch12-winter",
     "Oil painting: the log winter-cabins of Camp Russell in snow, a weary soldier in a cabin doorway."),
    ('<div class="ch-date">June &ndash; July 1865 &mdash; Georgia</div>',
     "ch13-savannah",
     "Oil painting: the deserted Savannah waterfront seen from a steamer deck, the occupied city beyond."),
    ('<div class="ch-date">After the War</div>',
     "ch14-what-remained",
     "Oil painting: an older Charles at his ledger in a sunlit Iowa study after the war, still counting."),
]

with io.open(HTML, "r", encoding="utf-8") as f:
    html = f.read()

if 'class="ch-scene"' in html:
    sys.exit("ABORT: ch-scene figures already present — refusing to double-insert.")

for chdate, slug, alt in CHAPTERS:
    n = html.count(chdate)
    if n != 1:
        sys.exit(f"ABORT: anchor for {slug} matched {n} times (expected 1): {chdate}")
    fig = (
        '\n  <figure class="ch-scene">\n'
        f'    <img src="{BASE}/{slug}.webp"\n'
        f'         alt="{alt}"\n'
        '         loading="lazy" decoding="async" width="1376" height="768">\n'
        '  </figure>'
    )
    html = html.replace(chdate, chdate + fig, 1)

with io.open(HTML, "w", encoding="utf-8") as f:
    f.write(html)

print(f"Inserted {len(CHAPTERS)} ch-scene figures. ch-scene count now:",
      html.count('class="ch-scene"'))
