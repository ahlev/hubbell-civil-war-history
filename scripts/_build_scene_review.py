#!/usr/bin/env python
"""
Build the "Who They Were" interactive scene-review gallery.

Auto-discovers every scene PNG on disk (so no <img> link can be stale or typo'd),
overlays chapter title + verbatim letter quote + provenance flags from the review
doc, and emits a single self-contained HTML page with:
  - click-to-enlarge lightbox
  - per-chapter v1/v2 pick buttons (or keep/flag for locked singles)
  - per-chapter notes
  - localStorage persistence + a "Copy my picks" export

INTERNAL ONLY. Output lives in tasks/ and references the PNGs by relative path;
never deployed. Re-run any time scenes are regenerated.

Usage:  python scripts/_build_scene_review.py
"""
import os, html, json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCENES = os.path.join(ROOT, "experience-v2", "assets", "brothers", "scenes")
OUT = os.path.join(ROOT, "tasks", "who-they-were-SCENE-REVIEW.html")
# relative path the browser uses to reach a scene file from tasks/<this>.html
REL = "../experience-v2/assets/brothers/scenes"

# subject -> (display title, regiment/role line, accent hex, locked-identity line)
SUBJECTS = {
    "henry": ("Henry", "34th NY · d. 1862, body never recovered",
              "#2D5F8A",
              "Lean rangy 21-yr-old; long oval face, straight nose, sharp cheekbones; fair; dark hazel-brown eyes; dark-brown side-parted tousled hair; clean-shaven (youngest-looking). Minimal aging — serves 1861–62."),
    "james": ("James", "153rd NY · d. 1865, one year after his Cedar Creek wound",
              "#4A7C59",
              "Youngest brother, lean & YOUTHFUL (not gaunt — your correction); oval face, straight nose; warm hazel-brown eyes; mid-brown auburn tousled hair; fair. Arc: clean-shaven cadet GREY (1862) → full soft auburn beard, enlisted BLUE (1864–65)."),
    "alexander": ("Alexander", "60th NY · the survivor — served the whole war",
                  "#B8860B",
                  "Enlisted at 17; healthy, wiry, upright (not gaunt); oval face, firm jaw; fair sun-touched; clear grey-blue eyes; sandy light-brown short side-parted hair. Aging 1861→65: clean-shaven recruit → faint mustache → short beard → fuller veteran beard."),
    "frances": ("Frances", "the mother · home front, Champlain NY",
                "#7B5EA7",
                "Careworn dignified widowed farm woman ~50; long weathered oval face; pale fair; grey-blue eyes; greying center-parted hair in low bun; plain near-black high-collared 1860s wool dress, small white collar, no jewelry. Aging ~48–54 (1862–70)."),
}

# subject -> ordered { prefix: (title, quote, flag) }   (prefix = filename minus -v1/-v2/-ORIGINAL/-BENCHMARK)
META = {
  "henry": {
    "ch01-arrival": ("01 · Arrival", "such a drunken set as I have here", ""),
    "ch02-bull-run": ("02 · Cannons at Bull Run", "a battle going on… cannons firing not over twenty-eight miles from here", "Landscape"),
    "ch03-camp-life": ("03 · Camp Life & a Brother's Advice", "I put that down as a command", "BENCHMARK — real portrait outpainted to 16:9 (locked)"),
    "ch04-harpers-ferry": ("04 · Harpers Ferry", "Nothing but the brick walls remain", "Landscape"),
    "ch05-yorktown": ("05 · Siege of Yorktown", "Nothing livens me up more than to hear the firing", "Action"),
    "ch06-fair-oaks": ("06 · Fair Oaks & the Slow Decline", "How I long to have one good meal at home", "Figure — ill"),
    "ch07-seven-days": ("07 · The Seven Days", "The Irish Brigade charged a rebel battery — it was a splendid sight", "Action"),
    "ch08-last-letter": ("08 · The Last Letter", "peace… just before Sugar time", "Landscape — grand review"),
    "silence-antietam": ("— · Forty-Three Days of Silence", "his death; body never recovered", "SILENCE beat (Antietam, no figure) — goes in .silence block, not a chapter"),
    "ch09-family-learns": ("09 · The Family Learns", "Thank God your name has not yet appeared", "Figure — the MOTHER, face turned"),
    "ch10-what-remains": ("10 · What Remains", "the only record of his voice", "Object — the surviving letters"),
  },
  "james": {
    "ch01-cadet": ("01 · The Cadet", "They dragged me around one night but could not get my gun away", "Cadet grey, hazing"),
    "ch02-what-he-didnt-know": ("02 · What He Didn't Know", "Have you heard from Henry and Alex yet?", "Cadet writing"),
    "silence1-transformation": ("— · Two Years of Silence", "has not shaved since he left West Point… quite a pair of whiskers", "SILENCE — object (cadet → soldier)"),
    "ch03-morganza": ("03 · Morganza", "had not seen wheat flour for about two years", "Landscape (Louisiana)"),
    "ch04-played-out": ("04 · Generally Unwell & Played Out", "My sickness was generally unwell and played out", "BENCHMARK — real portrait → 16:9 (locked)"),
    "ch05-winchester": ("05 · Winchester", "James came out of the battle near Winchester… unhurt", "Action — first battle"),
    "ch06-valley-burning": ("06 · The Valley (the Burning)", "Ma, there is a Yankee down cellar taking all our preserves", "Landscape"),
    "ch07-cedar-creek": ("07 · Cedar Creek", "I walked several miles after being hit… not to fall into the Johnnies' hands", "Figure — wounded, walking"),
    "ch08-hospital-vote": ("08 · The Hospital Chain", "I shall cast my vote for Abraham Lincoln", "Votes Lincoln from a cot"),
    "ch09-the-ring": ("09 · The Ring", "Enclosed you will find a ring", "Object"),
    "silence2-grave": ("— · October 19, 1865", "died exactly one year after Cedar Creek", "SILENCE — symbol (autumn grave)"),
    "ch10-what-remains": ("10 · What Remains", "nine letters — the full arc", "Object — letters + ring"),
  },
  "alexander": {
    "ch01-bedlam": ("01 · “What a Bedlam!”", "…what a bedlam!", "Figure"),
    "ch02-baltimore-enfield": ("02 · Baltimore & the Enfield", "I am as ready to fight Britons as Southerners.", "Action"),
    "ch03-pine-mountain": ("03 · First Combat (Pine Mtn)", "…the sun setting behind the Blue Ridge… I almost forgot I was a soldier.", "Landscape"),
    "ch04-antietam": ("04 · Antietam", "I only wish I could report the same of Henry… he is missing.", "Action"),
    "ch05-five-dollars": ("05 · Hospital & the Five Dollars", "…spare me five dollars", "Object"),
    "ch06-thanksgiving": ("06 · Thanksgiving & Fireside", "…as tho I had a Mother upon her knees praying for me…", "BENCHMARK — real portrait → 16:9 (locked)"),
    "ch07-henry-leg": ("07 · “They Saw Henry Grasp His Leg”", "(relayed account — rendered symbolically)", "Symbol — faceless silhouette, no verbatim quote"),
    "ch08-chancellorsville": ("08 · Chancellorsville", "(on guard detail / baggage train — he MISSED the battle)", "⛔ PROVENANCE: corrected — NOT color-bearer; bio wins. Confirm framing."),
    "ch09-gettysburg": ("09 · Gettysburg", "…firing fifty or sixty shots into the very teeth of the rebels…", "Action"),
    "ch10-henrys-ghost": ("10 · Henry's Ghost", "…how I longed to leave the ranks and hunt for some trace of Henry…", "Figure"),
    "ch11-rappahannock": ("11 · The Rappahannock", "We sit and look at each other very composedly.", "Landscape"),
    "ch12-lookout-mountain": ("12 · Lookout Mountain (wounded)", "…wounded in my left side by a minie ball. Rather a close call…", "Action"),
    "ch13-blues-nashville": ("13 · The Blues at Nashville", "…I have the blues.", "Figure"),
    "ch14-atlanta-campaign": ("14 · The Atlanta Campaign", "…fighting nearly every day… entrenching ourselves…", "Action"),
    "ch15-scurvy-lincoln-vote": ("15 · Scurvy, Lincoln, and a Vote", "If I live I shall cast a vote this fall.", "Figure — documentary"),
    "ch16-three-hopeful-sons": ("16 · “Three Hopeful Sons”", "…three hopeful sons being in the hospital at the one and same time.", "Object"),
    "ch17-valedictory": ("17 · The Valedictory", "…we stand a free and united nation…", "Figure"),
    "ch18-tea-table": ("18 · The Tea Table", "I will tell you all about it at the tea table.", "Landscape"),
  },
  "frances": {
    "ch01-casualty-list": ("01 · “If I Was a Man”", "I read the sad record day after day… with trembling.", "Figure — casualty list, dawn window"),
    "ch02-wounded-list": ("02 · The Wounded List", "My heart is aching to bursting, and I can write no more.", "Object — unfinished letter"),
    "ch03-investigation": ("03 · The Investigation", "Where, where is the dear, dear boy? Echo answers — where?", "Figure — letters by lamp"),
    "ch04-hope-dies": ("04 · Hope Dies", "I cannot endure to look at his letters or pictures…", "Landscape — wintry post-office road"),
    "ch05-formal-inquiry": ("05 · The Formal Inquiry", "My son, Henry Hubbell, of Co. D, 34th N.Y. reg't., has been missing…", "Figure — writing to authority"),
    "ch06-reading-letters": ("06 · Reading His Letters", "I can see his sweet face and hear his sweet voice…", "BENCHMARK — HERO outpainted → 16:9. ⛔ faint vertical seam (brighter center) — can redo as painted figure."),
    "ch07-campaign-charles": ("07 · The Campaign for Charles", "Now, Mother… you are at the bottom of this matter.", "Object — sealed letters"),
    "ch08-empty-house": ("08 · The Empty House", "How can I when all my boys are away! I cannot.", "Interior — silent parlor"),
    "ch09-among-living": ("09 · “Among the Living”", "You are among the living while my fears had numbered you with the dead.", "Figure — two letters + ring"),
    "ch10-war-ends": ("10 · The War Ends", "(silence beat — no Frances letter for this gap)", "Symbol — churchyard, two graves"),
    "ch11-cheese-factory": ("11 · The Cheese Factory", "Your Uncle William built a cheese factory last summer… better than bonds.", "Landscape — Champlain valley, 1870"),
  },
}

def variant_of(stem, prefix):
    suffix = stem[len(prefix):]
    if suffix == "-v1": return "v1"
    if suffix == "-v2": return "v2"
    return "single"  # -ORIGINAL-16x9 / -BENCHMARK-16x9 / bare

def discover(subject):
    """Return ordered list of chapter dicts with their on-disk variant files."""
    d = os.path.join(SCENES, subject)
    files = [f for f in os.listdir(d) if f.lower().endswith(".png")]
    # exclude infra
    files = [f for f in files if not f.startswith("_") and "CONTACT" not in f]
    used = set()
    chapters = []
    for prefix, (title, quote, flag) in META[subject].items():
        matches = sorted(f for f in files
                         if f[:-4].startswith(prefix) and variant_of(f[:-4], prefix) in ("v1","v2","single"))
        # guard: only files whose stem == prefix or prefix + -vN / -ORIGINAL.. (avoid partial-prefix collisions)
        matches = [f for f in matches if f[:-4] == prefix or f[:-4][len(prefix):].startswith("-v")
                   or "ORIGINAL" in f or "BENCHMARK" in f]
        if not matches:
            continue
        variants = []
        for f in matches:
            variants.append((variant_of(f[:-4], prefix), f))
            used.add(f)
        # order v1, v2, single
        order = {"v1":0, "v2":1, "single":2}
        variants.sort(key=lambda x: order[x[0]])
        chapters.append({"id": prefix, "title": title, "quote": quote,
                         "flag": flag, "variants": variants})
    leftover = sorted(f for f in files if f not in used)
    return chapters, leftover

def esc(s): return html.escape(s, quote=True)

def render_chapter(subject, ch):
    has_pair = any(v[0] in ("v1","v2") for v in ch["variants"]) and len([v for v in ch["variants"] if v[0] in ("v1","v2")]) >= 2
    tiles = []
    for variant, fname in ch["variants"]:
        src = f"{REL}/{subject}/{fname}"
        label = {"v1":"Version 1","v2":"Version 2","single":"Locked / single"}[variant]
        tiles.append(f'''
        <figure class="tile" data-variant="{variant}">
          <img loading="lazy" src="{esc(src)}" alt="{esc(ch['title'])} {label}" onclick="zoom(this.src)">
          <figcaption>{label}</figcaption>
        </figure>''')
    flag_html = f'<div class="flag">{esc(ch["flag"])}</div>' if ch["flag"] else ""
    if has_pair:
        picker = f'''
        <div class="picker" data-subject="{subject}" data-chapter="{esc(ch['id'])}">
          <button class="pk" data-v="v1">Pick&nbsp;V1</button>
          <button class="pk" data-v="v2">Pick&nbsp;V2</button>
          <button class="pk neither" data-v="neither">Neither&nbsp;— redo</button>
          <input class="note" placeholder="note (optional: what to change…)">
        </div>'''
    else:
        picker = f'''
        <div class="picker" data-subject="{subject}" data-chapter="{esc(ch['id'])}">
          <button class="pk" data-v="keep">✓ Keep</button>
          <button class="pk neither" data-v="redo">⛔ Redo</button>
          <input class="note" placeholder="note (optional)…">
        </div>'''
    return f'''
      <article class="chapter" id="{subject}-{esc(ch['id'])}">
        <header>
          <h3>{esc(ch['title'])}</h3>
          <blockquote>“{esc(ch['quote'])}”</blockquote>
          {flag_html}
        </header>
        <div class="tiles">{''.join(tiles)}</div>
        {picker}
      </article>'''

def render_frances_appearance():
    d = os.path.join(SCENES, "frances", "_appearance")
    if not os.path.isdir(d): return ""
    cands = sorted(f for f in os.listdir(d) if f.startswith("candidate-") and f.endswith(".png"))
    picked = "PICKED-candidate-1-HERO.png"
    tiles = []
    for f in cands:
        src = f"{REL}/frances/_appearance/{f}"
        num = f.replace("candidate-","").replace(".png","")
        chosen = " chosen" if num == "1" else ""
        tiles.append(f'''
        <figure class="tile{chosen}" data-variant="cand{num}">
          <img loading="lazy" src="{esc(src)}" alt="Frances appearance candidate {num}" onclick="zoom(this.src)">
          <figcaption>Candidate {num}{' · currently chosen' if num=='1' else ''}</figcaption>
        </figure>''')
    return f'''
      <article class="chapter gate" id="frances-appearance">
        <header>
          <h3>⚑ APPEARANCE GATE — no photograph of Frances survives</h3>
          <blockquote>This is a wholly interpretive reconstruction. Everything below is anchored to whichever face you lock here. Currently chosen = <b>Candidate&nbsp;1</b> (cleanest neutral background). Swapping = I regenerate her anchors + every figure scene.</blockquote>
          <div class="flag">PRIMARY DECISION — confirm Candidate 1, or pick another. (Candidate 1 could also fill her still-placeholder frontispiece on mother-frances.html.)</div>
        </header>
        <div class="tiles">{''.join(tiles)}</div>
        <div class="picker" data-subject="frances" data-chapter="APPEARANCE">
          <button class="pk" data-v="cand1">Lock&nbsp;Cand&nbsp;1</button>
          <button class="pk" data-v="cand2">Cand&nbsp;2</button>
          <button class="pk" data-v="cand3">Cand&nbsp;3</button>
          <button class="pk" data-v="cand4">Cand&nbsp;4</button>
          <input class="note" placeholder="note…">
        </div>
      </article>'''

# ---- assemble ----
sections = []
counts = {}
for subj, (title, sub, accent, identity) in SUBJECTS.items():
    chapters, leftover = discover(subj)
    counts[subj] = len(chapters)
    cards = ""
    if subj == "frances":
        cards += render_frances_appearance()
    cards += "".join(render_chapter(subj, ch) for ch in chapters)
    note = ""
    if leftover:
        note = f'<p class="leftover">Unmapped files on disk (shown nowhere above): {esc(", ".join(leftover))}</p>'
    sections.append(f'''
    <section class="subject" id="subj-{subj}" style="--accent:{accent}">
      <div class="subject-head">
        <h2>{esc(title)}</h2>
        <p class="sub">{esc(sub)}</p>
        <p class="identity"><b>Locked identity:</b> {esc(identity)}</p>
      </div>
      {cards}
      {note}
    </section>''')

nav = "".join(f'<a href="#subj-{s}">{SUBJECTS[s][0]} <span>{counts[s]}</span></a>' for s in SUBJECTS)
total = sum(counts.values())

PAGE = f'''<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Who They Were — Scene Review</title>
<style>
:root{{--bg:#15110c;--panel:#1f1810;--ink:#efe4d2;--mut:#b6a88f;--line:#3a2e1f;--gold:#c9a227}}
*{{box-sizing:border-box}}
body{{margin:0;background:var(--bg);color:var(--ink);
  font-family:"Iowan Old Style","Palatino Linotype",Georgia,serif;line-height:1.5}}
header.top{{padding:28px 32px 14px;border-bottom:1px solid var(--line)}}
header.top h1{{margin:0 0 4px;font-size:26px;letter-spacing:.3px}}
header.top p{{margin:0;color:var(--mut);font-size:14px;max-width:60ch}}
nav{{position:sticky;top:0;z-index:30;display:flex;gap:6px;flex-wrap:wrap;
  padding:10px 32px;background:rgba(21,17,12,.94);backdrop-filter:blur(6px);
  border-bottom:1px solid var(--line)}}
nav a{{color:var(--ink);text-decoration:none;font-size:13px;padding:5px 12px;
  border:1px solid var(--line);border-radius:20px;display:flex;gap:7px;align-items:center}}
nav a span{{color:var(--mut);font-size:11px}}
nav a:hover{{border-color:var(--gold)}}
.subject{{padding:30px 32px;border-bottom:1px solid var(--line)}}
.subject-head{{border-left:4px solid var(--accent);padding-left:14px;margin-bottom:22px}}
.subject-head h2{{margin:0;font-size:24px;color:var(--accent)}}
.subject-head .sub{{margin:2px 0 0;color:var(--mut);font-size:14px;font-style:italic}}
.subject-head .identity{{margin:8px 0 0;color:var(--mut);font-size:12.5px;max-width:90ch}}
.chapter{{background:var(--panel);border:1px solid var(--line);border-radius:10px;
  padding:16px 18px;margin:0 0 18px}}
.chapter.gate{{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent) inset}}
.chapter header h3{{margin:0 0 6px;font-size:18px}}
.chapter blockquote{{margin:0;color:var(--mut);font-style:italic;font-size:14.5px;
  border-left:2px solid var(--line);padding-left:12px}}
.flag{{margin-top:8px;font-size:12.5px;color:#e7c46b;background:rgba(201,162,39,.09);
  border:1px solid rgba(201,162,39,.3);border-radius:6px;padding:6px 10px;display:inline-block}}
.tiles{{display:flex;gap:14px;flex-wrap:wrap;margin:14px 0 12px}}
.tile{{margin:0;flex:1 1 420px;min-width:300px;max-width:560px}}
.tile img{{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:8px;
  border:3px solid transparent;cursor:zoom-in;display:block;background:#000}}
.tile.picked img{{border-color:var(--gold);box-shadow:0 0 22px rgba(201,162,39,.4)}}
.tile.chosen img{{border-color:var(--accent)}}
.tile figcaption{{margin-top:5px;font-size:12px;color:var(--mut);text-align:center}}
.picker{{display:flex;gap:8px;align-items:center;flex-wrap:wrap;
  border-top:1px dashed var(--line);padding-top:12px}}
.pk{{font:inherit;font-size:13px;cursor:pointer;color:var(--ink);
  background:#2a2114;border:1px solid var(--line);border-radius:7px;padding:7px 14px}}
.pk:hover{{border-color:var(--gold)}}
.pk.sel{{background:var(--gold);color:#1a1408;border-color:var(--gold);font-weight:600}}
.pk.neither{{opacity:.8}}
.pk.neither.sel{{background:#8a3b2e;color:#fff;border-color:#8a3b2e}}
.note{{flex:1 1 200px;min-width:160px;font:inherit;font-size:13px;
  background:#120e09;color:var(--ink);border:1px solid var(--line);
  border-radius:7px;padding:7px 10px}}
.leftover{{color:#8a7a5f;font-size:12px}}
/* floating bar */
.bar{{position:fixed;right:18px;bottom:18px;z-index:40;display:flex;gap:8px}}
.bar button{{font:inherit;font-size:13px;cursor:pointer;border:1px solid var(--gold);
  background:var(--gold);color:#1a1408;border-radius:8px;padding:10px 16px;font-weight:600;
  box-shadow:0 6px 22px rgba(0,0,0,.5)}}
.bar button.ghost{{background:var(--panel);color:var(--ink);border-color:var(--line)}}
.count{{position:fixed;left:18px;bottom:18px;z-index:40;font-size:12.5px;color:var(--mut);
  background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:8px 12px}}
/* lightbox */
.lb{{position:fixed;inset:0;z-index:60;background:rgba(0,0,0,.92);display:none;
  align-items:center;justify-content:center;cursor:zoom-out}}
.lb.on{{display:flex}}
.lb img{{max-width:96vw;max-height:96vh;border-radius:6px}}
/* export modal */
.modal{{position:fixed;inset:0;z-index:70;background:rgba(0,0,0,.85);display:none;
  align-items:center;justify-content:center;padding:24px}}
.modal.on{{display:flex}}
.modal .box{{background:var(--panel);border:1px solid var(--line);border-radius:10px;
  width:min(720px,96vw);max-height:88vh;display:flex;flex-direction:column;padding:18px}}
.modal h4{{margin:0 0 10px}}
.modal textarea{{flex:1;min-height:340px;font-family:ui-monospace,Menlo,monospace;font-size:12.5px;
  background:#120e09;color:var(--ink);border:1px solid var(--line);border-radius:8px;padding:12px;resize:vertical}}
.modal .row{{display:flex;gap:8px;margin-top:10px;justify-content:flex-end}}
</style></head><body>

<header class="top">
  <h1>“Who They Were” — Per-Chapter Scene Review</h1>
  <p>Two versions per chapter (where applicable). Click any image to enlarge. Hit <b>Pick&nbsp;V1/V2</b> on each — choices save in this browser. When done, <b>Copy my picks</b> and paste them back to me. {total} chapters across 4 subjects. Charles (14) is already chosen + integrated.</p>
</header>

<nav>{nav}<a href="#" onclick="showPicks();return false" style="border-color:var(--gold)">⎘ Picks</a></nav>

{''.join(sections)}

<div class="count" id="count">0 picked</div>
<div class="bar">
  <button class="ghost" onclick="if(confirm('Clear all picks on this page?')){{localStorage.removeItem(KEY);location.reload()}}">Reset</button>
  <button onclick="showPicks()">Copy my picks ⎘</button>
</div>

<div class="lb" id="lb" onclick="this.classList.remove('on')"><img id="lbimg" src=""></div>

<div class="modal" id="modal">
  <div class="box">
    <h4>Your picks — copy this and paste it back to me</h4>
    <textarea id="out" readonly></textarea>
    <div class="row">
      <button class="pk" onclick="document.getElementById('modal').classList.remove('on')">Close</button>
      <button class="pk sel" onclick="copyOut()">Copy to clipboard</button>
    </div>
  </div>
</div>

<script>
const KEY="wtw-scene-picks-v1";
let store=JSON.parse(localStorage.getItem(KEY)||"{{}}");
function save(){{localStorage.setItem(KEY,JSON.stringify(store));refresh()}}
function zoom(src){{const lb=document.getElementById('lb');document.getElementById('lbimg').src=src;lb.classList.add('on')}}

document.querySelectorAll('.picker').forEach(p=>{{
  const subj=p.dataset.subject, ch=p.dataset.chapter;
  const rec=(store[subj]&&store[subj][ch])||{{}};
  p.querySelectorAll('.pk').forEach(b=>{{
    if(rec.pick===b.dataset.v)b.classList.add('sel');
    b.onclick=()=>{{
      store[subj]=store[subj]||{{}};
      const cur=store[subj][ch]||{{}};
      cur.pick=(cur.pick===b.dataset.v)?null:b.dataset.v;
      store[subj][ch]=cur;
      p.querySelectorAll('.pk').forEach(x=>x.classList.toggle('sel',x.dataset.v===cur.pick));
      markTiles(p,cur.pick);
      save();
    }};
  }});
  const note=p.querySelector('.note');
  if(rec.note)note.value=rec.note;
  note.oninput=()=>{{store[subj]=store[subj]||{{}};store[subj][ch]=store[subj][ch]||{{}};
    store[subj][ch].note=note.value;save()}};
  markTiles(p,rec.pick);
}});

function markTiles(picker,pick){{
  const card=picker.closest('.chapter');
  card.querySelectorAll('.tile').forEach(t=>{{
    const v=t.dataset.variant;
    t.classList.toggle('picked', !!pick && (v===pick));
  }});
}}

function refresh(){{
  let n=0;
  for(const s in store)for(const c in store[s])if(store[s][c]&&store[s][c].pick)n++;
  document.getElementById('count').textContent=n+" picked / {total}+";
}}
refresh();

const TITLES={json.dumps({s: {ch['id']: ch['title'] for ch in discover(s)[0]} for s in SUBJECTS})};
function showPicks(){{
  let out="WHO THEY WERE — SCENE PICKS\\n========================\\n";
  const order=["frances","henry","james","alexander"];
  for(const s of Object.keys(store).sort((a,b)=>order.indexOf(a)-order.indexOf(b))){{
    const rows=[];
    for(const c in store[s]){{
      const r=store[s][c];if(!r||(!r.pick&&!r.note))continue;
      const t=(TITLES[s]&&TITLES[s][c])||c;
      let line="  "+(r.pick?("["+r.pick.toUpperCase()+"]").padEnd(9):"[ - ]    ")+t;
      if(r.note)line+="   — "+r.note;
      rows.push(line);
    }}
    if(rows.length){{out+="\\n"+s.toUpperCase()+"\\n"+rows.join("\\n")+"\\n";}}
  }}
  document.getElementById('out').value=out;
  document.getElementById('modal').classList.add('on');
}}
function copyOut(){{const t=document.getElementById('out');t.select();
  navigator.clipboard.writeText(t.value).then(()=>{{}});}}
</script>
</body></html>'''

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    f.write(PAGE)
print("Wrote", OUT)
for s in SUBJECTS:
    ch, left = discover(s)
    print(f"  {s}: {len(ch)} chapters" + (f"  | leftover: {left}" if left else ""))
