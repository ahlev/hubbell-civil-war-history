#!/usr/bin/env python
"""
Build the "Who They Were" REWORKS review page (round 1 of user picks, 2026-06-30).

For each NEITHER / REDO / refine item the user flagged, show:
  - chapter title + anchor quote + the user's verbatim note
  - "what changed" (research-grounded) + "why it fits the chapter"
  - the ORIGINAL image(s) the user rejected (for side-by-side comparison)
  - the two new RW variants (-RW-v1 / -RW-v2) with click-to-zoom + pick buttons
  - localStorage picks + "copy my picks" export

INTERNAL ONLY. Output in tasks/, references PNGs by relative path; never deployed.
Re-run any time reworks are regenerated:  python scripts/_build_reworks_review.py
"""
import os, html, glob, json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCENES = os.path.join(ROOT, "experience-v2", "assets", "brothers", "scenes")
OUT = os.path.join(ROOT, "tasks", "who-they-were-REWORKS-REVIEW.html")
REL = "../experience-v2/assets/brothers/scenes"

ACCENT = {"frances": "#7B5EA7", "henry": "#2D5F8A", "james": "#4A7C59", "alexander": "#B8860B"}

# subject -> [ {id, title, quote, note, changed, fits, originals:[files]} ]  (originals minus .png)
ITEMS = {
 "frances": [
   {"id":"ch05-formal-inquiry","title":"05 · The Formal Inquiry",
    "quote":"My son, Henry Hubbell, of Co. D, 34th N.Y. reg't., has been missing since the battle of Antietam.",
    "note":"We need a more distinctive and varied staging of this character — sitting at a desk writing in every chapter is not compelling.",
    "changed":"Dropped the desk-writing pose entirely. She now <b>stands</b> at a tall farmhouse window holding the sealed official inquiry and its envelope — a mother conducting her own investigation, not just another seated scribe.",
    "fits":"April 1863, her one letter to the army — her most composed, controlled beat. A standing, resolute posture reads as agency and restrained strength, and breaks the repetition of her writing scenes.",
    "originals":["ch05-formal-inquiry-v1","ch05-formal-inquiry-v2"]},
   {"id":"ch06-reading-letters","title":"06 · Reading His Letters",
    "quote":"I can see his sweet face and hear his sweet voice — it seems as if I have had a visit with him.",
    "note":"This image is not smooth or seamless.",
    "changed":"The original was the real-portrait <i>outpainted</i> to 16:9, which left a faint vertical seam. Re-done as a <b>fully-painted single figure scene</b> (no panels, no seam) — Frances reading the letter-packet by lamplight.",
    "fits":"The line is about feeling his presence again. A seamless, intimate lamplit reading turns grief into gentle communion — and removes the technical seam artifact.",
    "originals":["ch06-reading-letters-BENCHMARK-16x9"]},
   {"id":"ch09-among-living","title":"09 · “Among the Living”",
    "quote":"You are among the living while my fears had numbered you with the dead.",
    "note":"More joy and happiness (reflected in the setting and lighting with some warm home touches) should be evident in this scene.",
    "changed":"Re-lit warm and bright: Frances at a <b>glowing hearth</b>, face lit with relief, holding the <b>two letters</b> that proved a son alive; cozy home touches (kettle, quilt, the little ring on the sill).",
    "fits":"Research pins this to Jan 1865 — two letters from <b>Alexander</b> arrived in one mail after the dread of Nashville (“Praise the Lord… for preserving the precious life of my darling child”). It is the single warmest, most luminous beat of her whole war.",
    "originals":["ch09-among-living-v1","ch09-among-living-v2"]},
 ],
 "henry": [
   {"id":"ch01-arrival","title":"01 · Arrival",
    "quote":"It seems to me I never got into such a drunken set as I have here.",
    "note":"I like V1, but he should look a bit hardier and fuller-faced.",
    "changed":"Pushed the face <b>fuller and hardier</b> — a fit, fresh, robust 21-year-old recruit, not the gaunt baseline; kept the V1 recruit-camp staging.",
    "fits":"July 1861, first Hubbell to enlist. His decline is documented to begin a year later (Fair Oaks, June 1862), so a healthy, hopeful look here is the accurate one.",
    "originals":["ch01-arrival-v1","ch01-arrival-v2"]},
   {"id":"ch05-yorktown","title":"05 · Siege of Yorktown",
    "quote":"Nothing livens me up more than to hear the firing cannon and musketry.",
    "note":"He looks too old and haggard. He should look a bit healthier and fuller-faced.",
    "changed":"Rendered <b>younger, healthier, fuller-faced</b> — eager and alive at the siege earthworks, leaning toward the distant artillery glow.",
    "fits":"April 1862 — still two months before his health breaks. The eager line and a vigorous look match the documented man at this point.",
    "originals":["ch05-yorktown-v1","ch05-yorktown-v2"]},
   {"id":"ch06-fair-oaks","title":"06 · Fair Oaks & the Slow Decline",
    "quote":"How I long to have one good meal at home… I cannot bear to look at hard crackers.",
    "note":"(your call: moderately healthy, but weathered and tired and looking hungry)",
    "changed":"Tuned to <b>moderately healthy but weathered, tired and hungry</b> — drawn, shadowed eyes, a plate of hardtack he can't eat — without going skeletal.",
    "fits":"June 1862 on the Peninsula is exactly where his decline is documented to start (dysentery, can't keep food down). This is the honest turn of the chapter — worn, not yet a corpse.",
    "originals":["ch06-fair-oaks-v1","ch06-fair-oaks-v2"]},
 ],
 "james": [
   {"id":"silence1-transformation","title":"— · Two Years of Silence",
    "quote":"has not shaved since he left West Point and has quite a pair of whiskers.",
    "note":"Show him as a more filled-out, bearded young man. Same identity lock with updated features. A mundane moment in a distinctive realistic landscape around his actual writing location (what was the setting?).",
    "changed":"Recast from an object beat to a <b>figure</b>: James, newly bearded and filled-out, writing home in a quiet camp moment. <b>The setting is Morganza, Louisiana</b> — the first documented place he reappears after the gap.",
    "fits":"The 1862–64 gap has no surviving James letters; his first documented reappearance is the 153rd's camp on the Mississippi at Morganza (June 1864) — a flat riverbank of low whitewashed Louisiana cabins, sugar mills, Spanish-moss oaks. That's where he turns up bearded.",
    "originals":["silence1-transformation"]},
   {"id":"ch03-morganza","title":"03 · Morganza",
    "quote":"They said they had not seen wheat flour for about two years.",
    "note":"The wagons facing each other is awkward.",
    "changed":"Rebuilt the wagons as a <b>single orderly receding column</b> (no two wagons nose-to-nose), a foraging train loading from a barn in French-plantation country.",
    "fits":"His own June 1864 letter describes a 100-wagon foraging train through Louisiana plantation country — a coherent column reads truer than the awkward facing pair.",
    "originals":["ch03-morganza"]},
   {"id":"ch06-valley-burning","title":"06 · The Valley (the Burning)",
    "quote":"Ma, there is a Yankee down cellar taking all our preserves.",
    "note":"Isn't this Alexander's letter? …the men in the foreground look too much alike.",
    "changed":"Kept it under James (see note) and made the foreground soldiers <b>clearly distinct men</b> — different heights, builds, ages, beards — no clones.",
    "fits":"CONFIRMED James's: the letter (LTR-1864-10-04) is <i>addressed to</i> Alexander but <i>written by</i> James, who was physically in Sheridan's Burning with the 153rd. Alexander was in Georgia that autumn. So it correctly stays his.",
    "originals":["ch06-valley-burning"]},
   {"id":"ch07-cedar-creek","title":"07 · Cedar Creek",
    "quote":"I walked several miles after being hit in order not to fall into the Johnnies' hands.",
    "note":"The scene should be more battle PAST — remnants of firefights, wounded and dead — as he tracks back to seek medical help away from the fighting.",
    "changed":"Reframed as the <b>aftermath</b>: James limping rearward across an emptied field strewn with remnants (dropped gear, broken rails, a dead horse, other wounded), the battle's smoke now distant. Wound is the correct <b>left thigh</b>, bandaged with a strip of his own drawers.",
    "fits":"His letter: “wounded in the left thigh… walked several miles.” The walk away from a finished fight, not into one, is the documented moment.",
    "originals":["ch07-cedar-creek-v1","ch07-cedar-creek-v2"]},
   {"id":"ch08-hospital-vote","title":"08 · The Hospital Chain",
    "quote":"I shall cast my vote for Abraham Lincoln.",
    "note":"(V2 picked) Bedmates in various states of repose, not all upright. Zoom closer on the arm + ballot box. Bandaged leg should reflect James's actual wound.",
    "changed":"Framed <b>closer</b> on his outstretched arm dropping the ballot into the wooden box; bedmates now in <b>varied repose</b> (some lying, reclining, reading); bandage on the correct <b>left thigh</b>.",
    "fits":"Patterson Park Hospital, Baltimore, Nov 1864 — he did intend to vote Lincoln there. (Bedmates/ballot-box aren't described in the letter — kept as a reasonable interpretive staging of the documented vote.)",
    "originals":["ch08-hospital-vote-v1","ch08-hospital-vote-v2"]},
   {"id":"ch09-the-ring","title":"09 · The Ring",
    "quote":"Enclosed you will find a ring.",
    "note":"The ring looks too large.",
    "changed":"Rendered a <b>small, slim, hand-whittled wooden band</b> — modest and fragile, not oversized.",
    "fits":"The letter says only that he made several small rings on the march and they “got broke in my pocket book” — i.e. small & fragile. Material isn't documented; per your call it's rendered as <b>carved wood</b>.",
    "originals":["ch09-the-ring"]},
   {"id":"silence2-grave","title":"— · October 19, 1865",
    "quote":"died exactly one year after Cedar Creek.",
    "note":"The tombstone needs some form of mark, and should be in a larger cemetery with variously-aged details.",
    "changed":"Gave the stone a <b>carved (but illegible) inscription</b> and set it in a <b>larger cemetery</b> with markers of varying ages — old leaning slate, newer marble, an obelisk or two.",
    "fits":"He died one year to the day after his wound. A marked stone among many honors that without fabricating a real epitaph (lettering kept impressionistic per provenance rules).",
    "originals":["silence2-grave"]},
   {"id":"ch10-what-remains","title":"10 · What Remains",
    "quote":"Nine letters — the full arc of the Civil War experience.",
    "note":"The ring looks way too large, and I think it's supposed to be carved from wood — confirm and adjust.",
    "changed":"Ring is now <b>small carved wood</b> resting on the bundle of <b>nine letters</b>.",
    "fits":"The closing still-life of his whole short war. Confirmed via the letters: material undocumented, rendered as wood per your call; size corrected to small.",
    "originals":["ch10-what-remains"]},
 ],
 "alexander": [
   {"id":"ch04-antietam","title":"04 · Antietam",
    "quote":"I only wish I could report the same of Henry… he is missing.",
    "note":"I like V2 but the density of soldiers and the explosions in the sky are wrong. Whatever attachment is on his gun seems really weird.",
    "changed":"<b>Thinned the line</b> to a scattered handful (no wall of men); removed the aerial explosions for <b>drifting powder-smoke</b>; gave him a <b>clean, ordinary rifle-musket</b> (no strange attachment); he stands upright and unhurt.",
    "fits":"Alexander came through Antietam nearly untouched (“an inconsiderable bruise below the right knee”). The chapter's weight is emotional — Henry missing — not his own combat, so he is intact and stricken, not in the densest melee.",
    "originals":["ch04-antietam-v1","ch04-antietam-v2"]},
   {"id":"ch07-henry-leg","title":"07 · “They Saw Henry Grasp His Leg”",
    "quote":"(relayed account — rendered symbolically)",
    "note":"Other soldiers ought to be around him.",
    "changed":"Added <b>witnessing comrades</b> of the 34th NY around the falling figure — one reaching, others reacting — while keeping Henry <b>faceless/half-silhouetted</b> in smoke.",
    "fits":"The fall is known only because “a number of” the 34th saw him grasp his leg and go down. Surrounding witnesses are exactly what the relayed account describes; his face stays unrendered (no body was ever found).",
    "originals":["ch07-henry-leg-v1","ch07-henry-leg-v2"]},
   {"id":"ch09-gettysburg","title":"09 · Gettysburg",
    "quote":"…firing fifty or sixty shots into the very teeth of the rebels…",
    "note":"The wall of approaching soldiers is too dense and uniform — it would be a more sporadic advance and a mix of men actively rushing and seeking cover.",
    "changed":"The advancing side is now the <b>Confederates</b>, coming up the slope as a <b>broken, sporadic</b> assault (some rushing, some behind boulders); Alexander and the 60th NY <b>defend from behind log works</b>.",
    "fits":"The 60th held Culp's Hill from behind breastworks; the rebels charged uphill through timber and rock — a genuinely ragged, terrain-fractured advance. Your instinct was right; it just belongs to the attackers.",
    "originals":["ch09-gettysburg-v1","ch09-gettysburg-v2"]},
   {"id":"ch12-lookout-mountain","title":"12 · Lookout Mountain (wounded)",
    "quote":"…wounded in my left side by a minie ball. Rather a close call…",
    "note":"He should be crouching for shelter in pain as men advance around him — rougher countryside, more men crawling or kneeling as they advance slowly.",
    "changed":"Alexander now <b>crouches against a boulder, hand to his left side</b>, in pain; around and above him men <b>advance uphill slowly</b> — crawling, kneeling, hauling up by saplings — on a rough, misty slope.",
    "fits":"“Battle above the clouds,” Nov 1863: a steep, fog-shrouded ascent where men climbed hand-over-hand under fire. Left-side wound is his own word.",
    "originals":["ch12-lookout-mountain-v1","ch12-lookout-mountain-v2"]},
   {"id":"ch16-three-hopeful-sons","title":"16 · “Three Hopeful Sons”",
    "quote":"…three hopeful sons being in the hospital at the one and same time.",
    "note":"An abstract aggregate with three scenes — silhouetted/profiled medical tent, field hospital, recovery ward — each brother in a different stage and pose aligned with their actual ailments.",
    "changed":"Built as a <b>three-vignette aggregate</b>: a scurvy convalescent half-writing (Alexander), a depleted man lying back exhausted (James), a healthier one just entering the ward (Charles) — each a different stage and pose.",
    "fits":"Aug 1864: Alexander had scurvy, James was furthest into hospital time, Charles least sick. These are illness cases, not battle wounds — wry, not grim (he was <i>laughing</i> about it).",
    "originals":["ch16-three-hopeful-sons-v1","ch16-three-hopeful-sons-v2"]},
   {"id":"ch18-tea-table","title":"18 · The Tea Table",
    "quote":"I will tell you all about it at the tea table.",
    "note":"I like V2, but Alexander's distant figure should be visible through the open gate crack as a soldier approaching from a distance toward the gate.",
    "changed":"Kept the garden-gate homecoming; the gate now stands <b>ajar</b> and through its crack, far down the lane, <b>Alexander's small distant figure</b> approaches as a returning veteran.",
    "fits":"July 1865, the war over — the lone surviving brother coming home. Anticipation reads stronger with him distant beyond the threshold than already arrived.",
    "originals":["ch18-tea-table-v1","ch18-tea-table-v2"]},
 ],
}

def esc(s): return html.escape(s, quote=True)

def imgs_exist(subject, stems):
    out=[]
    for s in stems:
        p=os.path.join(SCENES, subject, s+".png")
        if os.path.exists(p): out.append(s)
    return out

def tile(subject, stem, label, cls=""):
    src=f"{REL}/{subject}/{stem}.png"
    return f'''<figure class="tile {cls}">
      <img loading="lazy" src="{esc(src)}" onclick="zoom(this.src)" alt="{esc(label)}">
      <figcaption>{esc(label)}</figcaption></figure>'''

def render_item(subject, it):
    origs=imgs_exist(subject, it["originals"])
    rw=imgs_exist(subject, [f"{it['id']}-RW-v1", f"{it['id']}-RW-v2"])
    orig_tiles="".join(tile(subject,s,"original — rejected","orig") for s in origs) or '<p class="miss">(original not found)</p>'
    rw_tiles="".join(tile(subject,s, ("NEW · "+("V1" if s.endswith("v1") else "V2")), "rw") for s in rw) or '<p class="miss">(rendering… re-run builder)</p>'
    return f'''<article class="item" id="{subject}-{it['id']}">
      <header><h3>{esc(it['title'])}</h3>
        <blockquote>“{esc(it['quote'])}”</blockquote>
        <p class="note"><b>Your note:</b> {esc(it['note'])}</p>
        <p class="changed"><b>What changed:</b> {it['changed']}</p>
        <p class="fits"><b>Why it fits:</b> {it['fits']}</p>
      </header>
      <div class="cmp">
        <div class="col"><div class="lab">Before</div><div class="tiles">{orig_tiles}</div></div>
        <div class="col"><div class="lab">New — pick one</div><div class="tiles">{rw_tiles}</div></div>
      </div>
      <div class="picker" data-subject="{subject}" data-chapter="{esc(it['id'])}">
        <button class="pk" data-v="rw-v1">Pick&nbsp;V1</button>
        <button class="pk" data-v="rw-v2">Pick&nbsp;V2</button>
        <button class="pk neither" data-v="redo">Still&nbsp;not&nbsp;right&nbsp;— redo</button>
        <input class="note-in" placeholder="note (what to change)…">
      </div>
    </article>'''

sections=[]
total=0
for subj in ["frances","henry","james","alexander"]:
    items=ITEMS[subj]; total+=len(items)
    cards="".join(render_item(subj,it) for it in items)
    sections.append(f'''<section class="subject" id="subj-{subj}" style="--accent:{ACCENT[subj]}">
      <div class="head"><h2>{subj.title()}</h2><span>{len(items)} reworked</span></div>
      {cards}</section>''')

nav="".join(f'<a href="#subj-{s}">{s.title()}</a>' for s in ["frances","henry","james","alexander"])

PAGE=f'''<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Who They Were — Reworks Review</title><style>
:root{{--bg:#15110c;--panel:#1f1810;--ink:#efe4d2;--mut:#b6a88f;--line:#3a2e1f;--gold:#c9a227}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--bg);color:var(--ink);
font-family:"Iowan Old Style","Palatino Linotype",Georgia,serif;line-height:1.5}}
header.top{{padding:26px 30px 12px;border-bottom:1px solid var(--line)}}
header.top h1{{margin:0 0 4px;font-size:25px}}header.top p{{margin:0;color:var(--mut);font-size:14px;max-width:74ch}}
nav{{position:sticky;top:0;z-index:30;display:flex;gap:6px;flex-wrap:wrap;padding:9px 30px;
background:rgba(21,17,12,.95);backdrop-filter:blur(6px);border-bottom:1px solid var(--line)}}
nav a{{color:var(--ink);text-decoration:none;font-size:13px;padding:5px 13px;border:1px solid var(--line);border-radius:20px}}
nav a:hover{{border-color:var(--gold)}}
.subject{{padding:26px 30px;border-bottom:1px solid var(--line)}}
.head{{display:flex;align-items:baseline;gap:12px;border-left:4px solid var(--accent);padding-left:13px;margin-bottom:18px}}
.head h2{{margin:0;font-size:23px;color:var(--accent)}}.head span{{color:var(--mut);font-size:13px}}
.item{{background:var(--panel);border:1px solid var(--line);border-radius:11px;padding:17px 19px;margin:0 0 20px}}
.item h3{{margin:0 0 6px;font-size:18px}}
.item blockquote{{margin:0 0 8px;color:var(--mut);font-style:italic;font-size:14px;border-left:2px solid var(--line);padding-left:11px}}
.item .note{{font-size:13.5px;color:#e7c46b;background:rgba(201,162,39,.08);border:1px solid rgba(201,162,39,.28);border-radius:6px;padding:7px 11px;margin:6px 0}}
.item .changed,.item .fits{{font-size:13.5px;margin:5px 0;color:#ddd0b8}}
.cmp{{display:flex;gap:18px;flex-wrap:wrap;margin:12px 0}}
.col{{flex:1 1 360px;min-width:300px}}
.col .lab{{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--mut);margin-bottom:6px}}
.tiles{{display:flex;gap:10px;flex-wrap:wrap}}
.tile{{margin:0;flex:1 1 220px;min-width:180px}}
.tile img{{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:7px;border:3px solid transparent;cursor:zoom-in;display:block;background:#000}}
.tile.orig img{{opacity:.62;border-color:#5a2c28}}
.tile.rw img{{border-color:#2c3a2a}}
.tile.picked img{{border-color:var(--gold);box-shadow:0 0 20px rgba(201,162,39,.4);opacity:1}}
.tile figcaption{{margin-top:4px;font-size:11px;color:var(--mut);text-align:center}}
.miss{{color:#8a7a5f;font-size:12px;font-style:italic}}
.picker{{display:flex;gap:8px;align-items:center;flex-wrap:wrap;border-top:1px dashed var(--line);padding-top:11px;margin-top:6px}}
.pk{{font:inherit;font-size:13px;cursor:pointer;color:var(--ink);background:#2a2114;border:1px solid var(--line);border-radius:7px;padding:7px 14px}}
.pk:hover{{border-color:var(--gold)}}.pk.sel{{background:var(--gold);color:#1a1408;border-color:var(--gold);font-weight:600}}
.pk.neither.sel{{background:#8a3b2e;color:#fff;border-color:#8a3b2e}}
.note-in{{flex:1 1 200px;min-width:160px;font:inherit;font-size:13px;background:#120e09;color:var(--ink);border:1px solid var(--line);border-radius:7px;padding:7px 10px}}
.bar{{position:fixed;right:16px;bottom:16px;z-index:40;display:flex;gap:8px}}
.bar button{{font:inherit;font-size:13px;cursor:pointer;border:1px solid var(--gold);background:var(--gold);color:#1a1408;border-radius:8px;padding:10px 16px;font-weight:600;box-shadow:0 6px 22px rgba(0,0,0,.5)}}
.bar button.ghost{{background:var(--panel);color:var(--ink);border-color:var(--line)}}
.lb{{position:fixed;inset:0;z-index:60;background:rgba(0,0,0,.93);display:none;align-items:center;justify-content:center;cursor:zoom-out}}
.lb.on{{display:flex}}.lb img{{max-width:96vw;max-height:96vh;border-radius:6px}}
.modal{{position:fixed;inset:0;z-index:70;background:rgba(0,0,0,.85);display:none;align-items:center;justify-content:center;padding:24px}}
.modal.on{{display:flex}}.modal .box{{background:var(--panel);border:1px solid var(--line);border-radius:10px;width:min(720px,96vw);max-height:88vh;display:flex;flex-direction:column;padding:18px}}
.modal textarea{{flex:1;min-height:320px;font-family:ui-monospace,Menlo,monospace;font-size:12.5px;background:#120e09;color:var(--ink);border:1px solid var(--line);border-radius:8px;padding:12px}}
.modal .row{{display:flex;gap:8px;margin-top:10px;justify-content:flex-end}}
</style></head><body>
<header class="top"><h1>“Who They Were” — Reworks Review (round 1)</h1>
<p>The {total} chapters you flagged NEITHER / REDO / refine, reworked with the letter-research corrections baked in. Each shows the <b>Before</b> (dimmed) beside <b>two new variants</b>. Click any image to enlarge. Pick V1 or V2 per chapter — choices save in this browser; hit <b>Copy my picks</b> when done.</p></header>
<nav>{nav}<a href="#" onclick="showPicks();return false" style="border-color:var(--gold)">⎘ Picks</a></nav>
{''.join(sections)}
<div class="bar"><button class="ghost" onclick="if(confirm('Clear picks?')){{localStorage.removeItem(KEY);location.reload()}}">Reset</button>
<button onclick="showPicks()">Copy my picks ⎘</button></div>
<div class="lb" id="lb" onclick="this.classList.remove('on')"><img id="lbimg" src=""></div>
<div class="modal" id="modal"><div class="box"><h4>Your picks — paste back to me</h4>
<textarea id="out" readonly></textarea><div class="row">
<button class="pk" onclick="document.getElementById('modal').classList.remove('on')">Close</button>
<button class="pk sel" onclick="copyOut()">Copy</button></div></div></div>
<script>
const KEY="wtw-reworks-picks-v1";let store=JSON.parse(localStorage.getItem(KEY)||"{{}}");
function save(){{localStorage.setItem(KEY,JSON.stringify(store))}}
function zoom(s){{document.getElementById('lbimg').src=s;document.getElementById('lb').classList.add('on')}}
const TITLES={json.dumps({s:{it['id']:it['title'] for it in ITEMS[s]} for s in ITEMS})};
document.querySelectorAll('.picker').forEach(p=>{{
 const subj=p.dataset.subject,ch=p.dataset.chapter;const rec=(store[subj]&&store[subj][ch])||{{}};
 const card=p.closest('.item');
 function mark(pick){{card.querySelectorAll('.tile.rw').forEach(t=>{{
   const v=t.querySelector('img').src.endsWith('v1.png')?'rw-v1':'rw-v2';
   t.classList.toggle('picked',!!pick&&v===pick);}});}}
 p.querySelectorAll('.pk').forEach(b=>{{ if(rec.pick===b.dataset.v)b.classList.add('sel');
   b.onclick=()=>{{store[subj]=store[subj]||{{}};const cur=store[subj][ch]||{{}};
     cur.pick=(cur.pick===b.dataset.v)?null:b.dataset.v;store[subj][ch]=cur;
     p.querySelectorAll('.pk').forEach(x=>x.classList.toggle('sel',x.dataset.v===cur.pick));mark(cur.pick);save();}};}});
 const ni=p.querySelector('.note-in');if(rec.note)ni.value=rec.note;
 ni.oninput=()=>{{store[subj]=store[subj]||{{}};store[subj][ch]=store[subj][ch]||{{}};store[subj][ch].note=ni.value;save();}};
 mark(rec.pick);
}});
function showPicks(){{let o="WHO THEY WERE — REWORK PICKS (round 1)\\n=====================================\\n";
 for(const s of ["frances","henry","james","alexander"]){{if(!store[s])continue;const rows=[];
  for(const c in store[s]){{const r=store[s][c];if(!r||(!r.pick&&!r.note))continue;
   const t=(TITLES[s]&&TITLES[s][c])||c;let l="  "+(r.pick?("["+r.pick.toUpperCase()+"]").padEnd(9):"[ - ]    ")+t;
   if(r.note)l+="   — "+r.note;rows.push(l);}}
  if(rows.length)o+="\\n"+s.toUpperCase()+"\\n"+rows.join("\\n")+"\\n";}}
 document.getElementById('out').value=o;document.getElementById('modal').classList.add('on');}}
function copyOut(){{const t=document.getElementById('out');t.select();navigator.clipboard.writeText(t.value);}}
</script></body></html>'''

os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT,"w",encoding="utf-8").write(PAGE)
print("Wrote", OUT)
for s in ITEMS:
    for it in ITEMS[s]:
        rw=imgs_exist(s,[f"{it['id']}-RW-v1",f"{it['id']}-RW-v2"])
        print(f"  {s}/{it['id']}: {len(rw)} RW variants on disk")
