#!/usr/bin/env python
"""
Build the ROUND-2 reworks review page (2026-06-30) — only the 7 chapters the user
sent back for a second pass. Shows round-1 (rejected, dimmed) beside round-2 (RW2, pick).

INTERNAL ONLY. Output in tasks/. Re-run:  python scripts/_build_reworks_review2.py
"""
import os, html, json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCENES = os.path.join(ROOT, "experience-v2", "assets", "brothers", "scenes")
OUT = os.path.join(ROOT, "tasks", "who-they-were-REWORKS-REVIEW-round2.html")
REL = "../experience-v2/assets/brothers/scenes"
ACCENT = {"henry": "#2D5F8A", "james": "#4A7C59", "alexander": "#B8860B"}

ITEMS = {
 "henry": [
   {"id":"ch06-fair-oaks","title":"06 · Fair Oaks & the Slow Decline",
    "note":"Too dreary and similar. Should be subdued and a bit heavy, but he shouldn't look haggard — and he still needs to look like a healthy version of himself in his (dirty but recognizable) uniform at rest in camp.",
    "changed":"Lightened the whole frame to soft daylight (dropped the gloomy fire-lit mood); rendered him a clearly <b>healthy, recognizable</b> version of himself — just tired and subdued — <b>at rest</b> against his knapsacks in a <b>dirty, worn but recognizable</b> uniform.",
    "prev":["ch06-fair-oaks-RW-v1","ch06-fair-oaks-RW-v2"]},
 ],
 "james": [
   {"id":"ch06-valley-burning","title":"06 · The Valley (the Burning)",
    "note":"Better, but too many men in civilian hats, and one of the soldiers in the foreground looks like a chubby kid.",
    "changed":"Foreground is now <b>uniformed Union soldiers</b> only — forage caps/kepis, blue coats, all <b>lean adult men</b> (explicitly no civilian hats, no children, no chubby boy).",
    "prev":["ch06-valley-burning-RW-v1","ch06-valley-burning-RW-v2"]},
   {"id":"ch07-cedar-creek","title":"07 · Cedar Creek",
    "note":"V2 looks good but you've hallucinated an artist signature in his name. Remove that.",
    "changed":"Kept the V2 aftermath composition and added a hard <b>no-signature / no-text</b> guard — the canvas is clean of any painted name or mark. (Thigh bandage + battlefield-past remnants retained.)",
    "prev":["ch07-cedar-creek-RW-v1","ch07-cedar-creek-RW-v2"]},
   {"id":"ch08-hospital-vote","title":"08 · The Hospital Chain",
    "note":"The new V2 looks great, but his bed is a weird shape and the man's likeness has drifted away from our original.",
    "changed":"Re-locked his face to his <b>real portrait</b> (added it as a second reference) so the likeness matches the other James scenes; rebuilt the bed as a <b>plain ordinary rectangular cot</b>. Ballot box + varied bedmates + left-thigh bandage kept.",
    "prev":["ch08-hospital-vote-RW-v1","ch08-hospital-vote-RW-v2"]},
 ],
 "alexander": [
   {"id":"ch09-gettysburg","title":"09 · Gettysburg",
    "note":"I like the new V1 especially, but there are too many rebels too close to Alexander, and his focus would be on those closest to him instead of looking past them and firing into the distance.",
    "changed":"Pushed the Confederates <b>far down the slope</b> as a distant sporadic advance, with <b>clear open ground</b> between them and Alexander — so his aim and focus reading 'firing into the distance' now makes sense (no enemies on top of the works).",
    "prev":["ch09-gettysburg-RW-v1","ch09-gettysburg-RW-v2"]},
   {"id":"ch16-three-hopeful-sons","title":"16 · “Three Hopeful Sons”",
    "note":"I like the new images, but the brothers' likenesses each need to be consistent with their character presentation in other scenes. Alex and James are moderately credible but Charles has none of his distinct facial hair.",
    "changed":"Attached <b>all three brothers' portraits</b> as references and named each one's facial hair — so Charles now carries his <b>dark-brown mustache and short chin-and-cheek whiskers</b>, Alexander his sandy beard, James his full auburn beard. Each vignette = his real ailment/stage.",
    "prev":["ch16-three-hopeful-sons-RW-v1","ch16-three-hopeful-sons-RW-v2"]},
   {"id":"ch18-tea-table","title":"18 · The Tea Table",
    "note":"I liked the original V2 very much, and only wanted that exact composition to change so that a soldier is visible approaching through the gate opening from a distance, crossing the field.",
    "changed":"Rebuilt directly from your <b>original V2</b> (used it as the composition reference) — same garden, gate, layout and golden light — changing only one thing: a <b>small distant soldier</b> now crosses the field and approaches through the open gate.",
    "prev":["ch18-tea-table-RW-v1","ch18-tea-table-RW-v2"]},
 ],
}

def esc(s): return html.escape(s, quote=True)
def ex(subject, stems):
    return [s for s in stems if os.path.exists(os.path.join(SCENES, subject, s+".png"))]
def tile(subject, stem, label, cls=""):
    return (f'<figure class="tile {cls}"><img loading="lazy" src="{esc(REL)}/{subject}/{stem}.png" '
            f'onclick="zoom(this.src)" alt="{esc(label)}"><figcaption>{esc(label)}</figcaption></figure>')

def render(subject, it):
    prev=ex(subject, it["prev"])
    new=ex(subject, [f"{it['id']}-RW2-v1", f"{it['id']}-RW2-v2"])
    pt="".join(tile(subject,s,"round 1 — rejected","orig") for s in prev) or '<p class="miss">(round-1 not found)</p>'
    nt="".join(tile(subject,s,"NEW · "+("V1" if s.endswith("v1") else "V2"),"rw") for s in new) or '<p class="miss">(rendering…)</p>'
    return f'''<article class="item" id="{subject}-{it['id']}">
      <header><h3>{esc(it['title'])}</h3>
        <p class="note"><b>Your note:</b> {esc(it['note'])}</p>
        <p class="changed"><b>What I changed:</b> {it['changed']}</p></header>
      <div class="cmp">
        <div class="col"><div class="lab">Round 1 (rejected)</div><div class="tiles">{pt}</div></div>
        <div class="col"><div class="lab">Round 2 — pick one</div><div class="tiles">{nt}</div></div></div>
      <div class="picker" data-subject="{subject}" data-chapter="{esc(it['id'])}">
        <button class="pk" data-v="rw2-v1">Pick&nbsp;V1</button>
        <button class="pk" data-v="rw2-v2">Pick&nbsp;V2</button>
        <button class="pk neither" data-v="redo">Still&nbsp;off&nbsp;— redo</button>
        <input class="note-in" placeholder="note…"></div>
    </article>'''

sections=[]
for subj in ["henry","james","alexander"]:
    cards="".join(render(subj,it) for it in ITEMS[subj])
    sections.append(f'<section class="subject" id="subj-{subj}" style="--accent:{ACCENT[subj]}">'
                    f'<div class="head"><h2>{subj.title()}</h2><span>{len(ITEMS[subj])} redo</span></div>{cards}</section>')
total=sum(len(v) for v in ITEMS.values())
nav="".join(f'<a href="#subj-{s}">{s.title()}</a>' for s in ["henry","james","alexander"])

PAGE=f'''<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Reworks Review — Round 2</title><style>
:root{{--bg:#15110c;--panel:#1f1810;--ink:#efe4d2;--mut:#b6a88f;--line:#3a2e1f;--gold:#c9a227}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--bg);color:var(--ink);font-family:"Iowan Old Style","Palatino Linotype",Georgia,serif;line-height:1.5}}
header.top{{padding:26px 30px 12px;border-bottom:1px solid var(--line)}}header.top h1{{margin:0 0 4px;font-size:25px}}
header.top p{{margin:0;color:var(--mut);font-size:14px;max-width:74ch}}
nav{{position:sticky;top:0;z-index:30;display:flex;gap:6px;flex-wrap:wrap;padding:9px 30px;background:rgba(21,17,12,.95);backdrop-filter:blur(6px);border-bottom:1px solid var(--line)}}
nav a{{color:var(--ink);text-decoration:none;font-size:13px;padding:5px 13px;border:1px solid var(--line);border-radius:20px}}nav a:hover{{border-color:var(--gold)}}
.subject{{padding:26px 30px;border-bottom:1px solid var(--line)}}
.head{{display:flex;align-items:baseline;gap:12px;border-left:4px solid var(--accent);padding-left:13px;margin-bottom:18px}}
.head h2{{margin:0;font-size:23px;color:var(--accent)}}.head span{{color:var(--mut);font-size:13px}}
.item{{background:var(--panel);border:1px solid var(--line);border-radius:11px;padding:17px 19px;margin:0 0 20px}}
.item h3{{margin:0 0 6px;font-size:18px}}
.item .note{{font-size:13.5px;color:#e7c46b;background:rgba(201,162,39,.08);border:1px solid rgba(201,162,39,.28);border-radius:6px;padding:7px 11px;margin:6px 0}}
.item .changed{{font-size:13.5px;margin:5px 0;color:#ddd0b8}}
.cmp{{display:flex;gap:18px;flex-wrap:wrap;margin:12px 0}}.col{{flex:1 1 360px;min-width:300px}}
.col .lab{{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--mut);margin-bottom:6px}}
.tiles{{display:flex;gap:10px;flex-wrap:wrap}}.tile{{margin:0;flex:1 1 220px;min-width:180px}}
.tile img{{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:7px;border:3px solid transparent;cursor:zoom-in;display:block;background:#000}}
.tile.orig img{{opacity:.5;border-color:#5a2c28}}.tile.rw img{{border-color:#2c3a2a}}
.tile.picked img{{border-color:var(--gold);box-shadow:0 0 20px rgba(201,162,39,.4);opacity:1}}
.tile figcaption{{margin-top:4px;font-size:11px;color:var(--mut);text-align:center}}.miss{{color:#8a7a5f;font-size:12px;font-style:italic}}
.picker{{display:flex;gap:8px;align-items:center;flex-wrap:wrap;border-top:1px dashed var(--line);padding-top:11px;margin-top:6px}}
.pk{{font:inherit;font-size:13px;cursor:pointer;color:var(--ink);background:#2a2114;border:1px solid var(--line);border-radius:7px;padding:7px 14px}}
.pk:hover{{border-color:var(--gold)}}.pk.sel{{background:var(--gold);color:#1a1408;border-color:var(--gold);font-weight:600}}
.pk.neither.sel{{background:#8a3b2e;color:#fff;border-color:#8a3b2e}}
.note-in{{flex:1 1 200px;min-width:160px;font:inherit;font-size:13px;background:#120e09;color:var(--ink);border:1px solid var(--line);border-radius:7px;padding:7px 10px}}
.bar{{position:fixed;right:16px;bottom:16px;z-index:40;display:flex;gap:8px}}
.bar button{{font:inherit;font-size:13px;cursor:pointer;border:1px solid var(--gold);background:var(--gold);color:#1a1408;border-radius:8px;padding:10px 16px;font-weight:600}}
.bar button.ghost{{background:var(--panel);color:var(--ink);border-color:var(--line)}}
.lb{{position:fixed;inset:0;z-index:60;background:rgba(0,0,0,.93);display:none;align-items:center;justify-content:center;cursor:zoom-out}}
.lb.on{{display:flex}}.lb img{{max-width:96vw;max-height:96vh;border-radius:6px}}
.modal{{position:fixed;inset:0;z-index:70;background:rgba(0,0,0,.85);display:none;align-items:center;justify-content:center;padding:24px}}
.modal.on{{display:flex}}.modal .box{{background:var(--panel);border:1px solid var(--line);border-radius:10px;width:min(720px,96vw);max-height:88vh;display:flex;flex-direction:column;padding:18px}}
.modal textarea{{flex:1;min-height:280px;font-family:ui-monospace,Menlo,monospace;font-size:12.5px;background:#120e09;color:var(--ink);border:1px solid var(--line);border-radius:8px;padding:12px}}
.modal .row{{display:flex;gap:8px;margin-top:10px;justify-content:flex-end}}
</style></head><body>
<header class="top"><h1>Reworks Review — Round 2</h1>
<p>The {total} chapters you sent back, each fixed to your exact note. <b>Round 1 (rejected)</b> on the left, dimmed; <b>Round 2</b> on the right. Click to enlarge, pick V1 or V2, then <b>Copy my picks</b>.</p></header>
<nav>{nav}<a href="#" onclick="showPicks();return false" style="border-color:var(--gold)">⎘ Picks</a></nav>
{''.join(sections)}
<div class="bar"><button class="ghost" onclick="if(confirm('Clear picks?')){{localStorage.removeItem(KEY);location.reload()}}">Reset</button>
<button onclick="showPicks()">Copy my picks ⎘</button></div>
<div class="lb" id="lb" onclick="this.classList.remove('on')"><img id="lbimg" src=""></div>
<div class="modal" id="modal"><div class="box"><h4>Your round-2 picks — paste back to me</h4>
<textarea id="out" readonly></textarea><div class="row">
<button class="pk" onclick="document.getElementById('modal').classList.remove('on')">Close</button>
<button class="pk sel" onclick="copyOut()">Copy</button></div></div></div>
<script>
const KEY="wtw-reworks-picks-r2";let store=JSON.parse(localStorage.getItem(KEY)||"{{}}");
function save(){{localStorage.setItem(KEY,JSON.stringify(store))}}
function zoom(s){{document.getElementById('lbimg').src=s;document.getElementById('lb').classList.add('on')}}
const TITLES={json.dumps({s:{it['id']:it['title'] for it in ITEMS[s]} for s in ITEMS})};
document.querySelectorAll('.picker').forEach(p=>{{
 const subj=p.dataset.subject,ch=p.dataset.chapter;const rec=(store[subj]&&store[subj][ch])||{{}};const card=p.closest('.item');
 function mark(pick){{card.querySelectorAll('.tile.rw').forEach(t=>{{const v=t.querySelector('img').src.endsWith('v1.png')?'rw2-v1':'rw2-v2';t.classList.toggle('picked',!!pick&&v===pick);}});}}
 p.querySelectorAll('.pk').forEach(b=>{{if(rec.pick===b.dataset.v)b.classList.add('sel');
   b.onclick=()=>{{store[subj]=store[subj]||{{}};const cur=store[subj][ch]||{{}};cur.pick=(cur.pick===b.dataset.v)?null:b.dataset.v;store[subj][ch]=cur;
     p.querySelectorAll('.pk').forEach(x=>x.classList.toggle('sel',x.dataset.v===cur.pick));mark(cur.pick);save();}};}});
 const ni=p.querySelector('.note-in');if(rec.note)ni.value=rec.note;
 ni.oninput=()=>{{store[subj]=store[subj]||{{}};store[subj][ch]=store[subj][ch]||{{}};store[subj][ch].note=ni.value;save();}};mark(rec.pick);
}});
function showPicks(){{let o="WHO THEY WERE — REWORK PICKS (round 2)\\n======================================\\n";
 for(const s of ["henry","james","alexander"]){{if(!store[s])continue;const rows=[];
  for(const c in store[s]){{const r=store[s][c];if(!r||(!r.pick&&!r.note))continue;const t=(TITLES[s]&&TITLES[s][c])||c;
   let l="  "+(r.pick?("["+r.pick.toUpperCase()+"]").padEnd(9):"[ - ]    ")+t;if(r.note)l+="   — "+r.note;rows.push(l);}}
  if(rows.length)o+="\\n"+s.toUpperCase()+"\\n"+rows.join("\\n")+"\\n";}}
 document.getElementById('out').value=o;document.getElementById('modal').classList.add('on');}}
function copyOut(){{const t=document.getElementById('out');t.select();navigator.clipboard.writeText(t.value);}}
</script></body></html>'''
os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT,"w",encoding="utf-8").write(PAGE)
print("Wrote", OUT)
for s in ITEMS:
    for it in ITEMS[s]:
        print(f"  {s}/{it['id']}: round2 {len(ex(s,[it['id']+'-RW2-v1',it['id']+'-RW2-v2']))}/2")
