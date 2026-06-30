#!/usr/bin/env python
"""Integrate the locked 'Who They Were' chapter scenes into the four bio pages,
mirroring the Charles pattern exactly:
  1) convert each picked PNG -> ch{NN}-{slug}.webp at <=1376px wide (current 1k res)
  2) insert  <figure class="ch-scene"><img .../></figure>  right after each
     chapter's <div class="ch-date"> (or after <h2> for date-less silence beats).

Idempotent: skips a chapter if its webp src is already referenced in the file.
Run:  python scripts/_integrate_scenes.py
"""
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCENES = os.path.join(ROOT, "experience-v2", "assets", "brothers", "scenes")
MAXW = 1376

# brother -> bio file
BIO = {
    "henry": "brother-henry.html",
    "james": "brother-james.html",
    "alexander": "brother-alexander.html",
    "frances": "mother-frances.html",
}

# brother -> [ (h2_substring, slug, source_png, alt) ]  in document order.
# h2_substring is a distinctive part of the chapter <h2> (entity-safe).
PLAN = {
 "henry": [
  ("Arrival", "ch01-arrival", "ch01-arrival-RW-v1.png",
   "Oil painting: Henry Hubbell as a fresh, healthy 21-year-old volunteer arriving at a Union recruit camp outside Washington, July 1861."),
  ("Cannons at Bull Run", "ch02-bull-run", "ch02-bull-run-v1.png",
   "Oil painting: a Union camp near Washington as distant battle-smoke rises from Bull Run, July 1861."),
  ("Camp Life, Money", "ch03-camp-life", "ch03-camp-life-ORIGINAL-16x9.png",
   "Period portrait of Henry Hubbell of the 34th New York, widened to a landscape frame."),
  ("Harpers Ferry", "ch04-harpers-ferry", "ch04-harpers-ferry-v2.png",
   "Oil painting: the war-ruined town of Harpers Ferry, only brick walls remaining, 1862."),
  ("Siege of Yorktown", "ch05-yorktown", "ch05-yorktown-RW-v2.png",
   "Oil painting: a healthy, eager Henry Hubbell among Union siege earthworks at Yorktown at dusk, April 1862."),
  ("Fair Oaks and the Slow Decline", "ch06-fair-oaks", "ch06-fair-oaks-RW2-v1.png",
   "Oil painting: a weary, hungry Henry Hubbell resting in a worn Virginia Peninsula camp, June 1862."),
  ("The Seven Days", "ch07-seven-days", "ch07-seven-days-v2.png",
   "Oil painting: the Irish Brigade charging a Confederate battery during the Seven Days, 1862."),
  ("The Last Letter", "ch08-last-letter", "ch08-last-letter-v1.png",
   "Oil painting: the grand review along the James River, summer 1862."),
  ("Forty-Three Days of Silence", "silence-antietam", "silence-antietam-v2.png",
   "Oil painting: Antietam at dusk, drifting smoke over the field where Henry Hubbell was lost."),
  ("The Family Learns", "ch09-family-learns", "ch09-family-learns-v1.png",
   "Oil painting: Frances Hubbell, face turned away, as the family learns of Henry's fate, September 1862."),
  ("What Remains", "ch10-what-remains", "ch10-what-remains-v2.png",
   "Oil painting: a still life of Henry Hubbell's surviving letters, the only record of his voice."),
 ],
 "james": [
  ("The Cadet", "ch01-cadet", "ch01-cadet-v2.png",
   "Oil painting: James Hubbell as a clean-shaven West Point cadet in cadet grey, 1862."),
  ("What He Didn't Know", "ch02-what-he-didnt-know", "ch02-what-he-didnt-know-v2.png",
   "Oil painting: cadet James Hubbell writing home from West Point, September 1862."),
  ("Two Years of Silence", "silence1-transformation", "silence1-transformation-RW-v2.png",
   "Oil painting: a newly bearded James Hubbell writing in camp on the Mississippi riverbank at Morganza, Louisiana, 1864."),
  ("Morganza", "ch03-morganza", "ch03-morganza-RW-v2.png",
   "Oil painting: a Union foraging wagon train on a Louisiana plantation road near Morganza, June 1864."),
  ("Generally Unwell", "ch04-played-out", "ch04-played-out-ORIGINAL-16x9.png",
   "Period portrait of James Hubbell, widened to a landscape frame."),
  ("Winchester", "ch05-winchester", "ch05-winchester-v1.png",
   "Oil painting: James Hubbell's first battle near Winchester in the Shenandoah Valley, September 1864."),
  ("The Valley", "ch06-valley-burning", "ch06-valley-burning-RW3-v1.png",
   "Oil painting: Union soldiers of the 153rd New York burning barns during Sheridan's Burning of the Shenandoah Valley, autumn 1864."),
  ("Cedar Creek", "ch07-cedar-creek", "ch07-cedar-creek-RW5-v1.png",
   "Oil painting: a wounded James Hubbell limping from the Cedar Creek battlefield, leaning on his rifle as a cane, October 1864."),
  ("The Hospital Chain", "ch08-hospital-vote", "ch08-hospital-vote-RW2-v1.png",
   "Oil painting: James Hubbell casting his vote for Lincoln from a hospital cot in Baltimore, November 1864."),
  ("The Ring", "ch09-the-ring", "ch09-the-ring-RW-v2.png",
   "Oil painting: the small carved-wood ring James Hubbell whittled on the march and mailed home, 1864."),
  ("October 19, 1865", "silence2-grave", "silence2-grave-RW-v2.png",
   "Oil painting: an autumn country cemetery, the grave of James Hubbell who died one year after his Cedar Creek wound."),
  ("What Remains", "ch10-what-remains", "ch10-what-remains-RW-v2.png",
   "Oil painting: a still life of James Hubbell's nine surviving letters and his carved-wood ring."),
 ],
 "alexander": [
  ("What a Bedlam", "ch01-bedlam", "ch01-bedlam-v1.png",
   "Oil painting: seventeen-year-old Alexander Hubbell in civilian clothes arriving at a rowdy Union barracks, Ogdensburgh, 1861."),
  ("Baltimore and the Enfield", "ch02-baltimore-enfield", "ch02-baltimore-enfield-v1.png",
   "Oil painting: the 60th New York marching into Baltimore, 1861."),
  ("First Combat", "ch03-pine-mountain", "ch03-pine-mountain-v2.png",
   "Oil painting: sunset behind the Blue Ridge as Alexander Hubbell rests, 1862."),
  ("Antietam", "ch04-antietam", "ch04-antietam-RW-v1.png",
   "Oil painting: Alexander Hubbell at a thinned firing line at the edge of the Antietam cornfield, September 1862."),
  ("The Hospital and the Five Dollars", "ch05-five-dollars", "ch05-five-dollars-v1.png",
   "Oil painting: a still life from Alexander Hubbell's hospital stay at Harpers Ferry, 1862."),
  ("Thanksgiving and Fireside", "ch06-thanksgiving", "ch06-thanksgiving-RW-v1.png",
   "Oil painting: Alexander Hubbell alone at a campfire on Thanksgiving evening, reflective and grateful, Harpers Ferry, November 1862."),
  ("Grasp His Leg", "ch07-henry-leg", "ch07-henry-leg-RW-v1.png",
   "Oil painting: a faceless soldier falling in Antietam smoke as comrades of the 34th New York look on, 1862."),
  ("Chancellorsville", "ch08-chancellorsville", "ch08-chancellorsville-v1.png",
   "Oil painting: the Wilderness and rear baggage train Alexander Hubbell guarded during Chancellorsville, May 1863."),
  ("Gettysburg", "ch09-gettysburg", "ch09-gettysburg-RW2-v2.png",
   "Oil painting: Alexander Hubbell defending Culp's Hill from behind log breastworks as Confederates advance up the wooded slope, July 1863."),
  ("Henry's Ghost", "ch10-henrys-ghost", "ch10-henrys-ghost-v1.png",
   "Oil painting: Alexander Hubbell glancing back on the march, haunted by his lost brother, 1863."),
  ("The Rappahannock", "ch11-rappahannock", "ch11-rappahannock-v1.png",
   "Oil painting: the quiet picket truce across the Rappahannock, 1863."),
  ("Lookout Mountain", "ch12-lookout-mountain", "ch12-lookout-mountain-RW-v1.png",
   "Oil painting: Alexander Hubbell crouched, wounded in the left side, as Union soldiers climb the misty slope of Lookout Mountain, November 1863."),
  ("The Blues at Nashville", "ch13-blues-nashville", "ch13-blues-nashville-v1.png",
   "Oil painting: a melancholy Alexander Hubbell by the fire at Nashville, January 1864."),
  ("The Atlanta Campaign", "ch14-atlanta-campaign", "ch14-atlanta-campaign-v2.png",
   "Oil painting: night entrenching during the Atlanta Campaign, 1864."),
  ("Scurvy, Lincoln", "ch15-scurvy-lincoln-vote", "ch15-scurvy-lincoln-vote-v1.png",
   "Oil painting: a convalescent Alexander Hubbell writing out his Lincoln vote from a hospital near Atlanta, 1864."),
  ("Three Hopeful Sons", "ch16-three-hopeful-sons", "ch16-three-hopeful-sons-RW3-v1.png",
   "Oil painting: a three-part hospital scene of the three Hubbell brothers convalescing at the same time, 1864."),
  ("The Valedictory", "ch17-valedictory", "ch17-valedictory-v1.png",
   "Oil painting: Alexander Hubbell as a bearded veteran at the war's end, 1865."),
  ("The Tea Table", "ch18-tea-table", "ch18-tea-table-RW3-v1.png",
   "Oil painting: a farmhouse garden gate with Alexander Hubbell's distant figure approaching home across the field, July 1865."),
 ],
 "frances": [
  ("If I Was a Man", "ch01-casualty-list", "ch01-casualty-list-v2.png",
   "Oil painting: Frances Hubbell reading the casualty list at a dawn window, 1862."),
  ("The Wounded List", "ch02-wounded-list", "ch02-wounded-list-v2.png",
   "Oil painting: an unfinished letter and a guttering candle, 1862."),
  ("The Investigation", "ch03-investigation", "ch03-investigation-v1.png",
   "Oil painting: Frances Hubbell cross-referencing letters by lamplight, 1862."),
  ("Hope Dies", "ch04-hope-dies", "ch04-hope-dies-v1.png",
   "Oil painting: a lone widow on a wintry post-office road, 1862."),
  ("The Formal Inquiry", "ch05-formal-inquiry", "ch05-formal-inquiry-RW-v2.png",
   "Oil painting: Frances Hubbell standing at a window holding her formal inquiry to the army, April 1863."),
  ("Reading His Letters", "ch06-reading-letters", "ch06-reading-letters-RW-v1.png",
   "Oil painting: Frances Hubbell reading her dead son's letters by lamplight, 1863."),
  ("The Campaign for Charles", "ch07-campaign-charles", "ch07-campaign-charles-v1.png",
   "Oil painting: sealed letters ready to post in Frances Hubbell's campaign to bring Charles home, 1863-64."),
  ("The Empty House", "ch08-empty-house", "ch08-empty-house-v1.png",
   "Oil painting: a silent parlor with empty chairs at dusk, 1863."),
  ("Among the Living", "ch09-among-living", "ch09-among-living-RW-v1.png",
   "Oil painting: Frances Hubbell at a glowing hearth, overjoyed by two letters proving her son alive, January 1865."),
  ("The War Ends", "ch10-war-ends", "ch10-war-ends-v1.png",
   "Oil painting: a churchyard with two graves in autumn."),
  ("The Cheese Factory", "ch11-cheese-factory", "ch11-cheese-factory-v2.png",
   "Oil painting: the Champlain valley in recovery, 1870."),
 ],
}

def make_webp(brother, slug, src):
    sp = os.path.join(SCENES, brother, src)
    op = os.path.join(SCENES, brother, slug + ".webp")
    im = Image.open(sp).convert("RGB")
    if im.width > MAXW:
        h = round(im.height * MAXW / im.width)
        im = im.resize((MAXW, h), Image.LANCZOS)
    im.save(op, "WEBP", quality=82, method=6)
    return im.width, im.height

def figure_block(brother, slug, alt):
    return [
        '  <figure class="ch-scene">',
        f'    <img src="/experience-v2/assets/brothers/scenes/{brother}/{slug}.webp"',
        f'         alt="{alt}"',
        '         loading="lazy" decoding="async" width="1376" height="768">',
        '  </figure>',
    ]

def integrate(brother):
    path = os.path.join(ROOT, BIO[brother])
    with open(path, encoding="utf-8") as f:
        lines = f.read().split("\n")
    inserts = []  # (insert_after_index, block_lines)
    for sub, slug, src, alt in PLAN[brother]:
        webp = make_webp(brother, slug, src)
        ref = f"scenes/{brother}/{slug}.webp"
        if any(ref in ln for ln in lines):
            print(f"  [skip-exists] {brother}/{slug}")
            continue
        # find the chapter h2 line
        h2i = next((i for i, ln in enumerate(lines) if "<h2" in ln and sub in ln), None)
        if h2i is None:
            print(f"  [WARN no-h2] {brother}: '{sub}' not found")
            continue
        after = h2i + 1 if (h2i + 1 < len(lines) and "ch-date" in lines[h2i + 1]) else h2i
        inserts.append((after, figure_block(brother, slug, alt)))
    # apply from bottom up so indices stay valid
    for after, block in sorted(inserts, key=lambda x: -x[0]):
        lines[after + 1:after + 1] = block
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    return len(inserts)

if __name__ == "__main__":
    total = 0
    for b in ["henry", "james", "alexander", "frances"]:
        n = integrate(b)
        total += n
        print(f"{b}: inserted {n} scenes")
    print(f"TOTAL inserted: {total}")
