#!/usr/bin/env python
"""ROUND-3 reworks review (2026-06-30) — the 4 chapters refined a third time.
Shows round-2 (dimmed) beside round-3 (RW3, pick). INTERNAL ONLY.
Re-run:  python scripts/_build_reworks_review3.py"""
import os, html, json
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCENES = os.path.join(ROOT, "experience-v2", "assets", "brothers", "scenes")
OUT = os.path.join(ROOT, "tasks", "who-they-were-REWORKS-REVIEW-round3.html")
REL = "../experience-v2/assets/brothers/scenes"
ACCENT = {"james": "#4A7C59", "alexander": "#B8860B"}
ITEMS = {
 "james": [
   {"id":"ch06-valley-burning","title":"06 · The Valley (the Burning)",
    "note":"I like these but the men look too much alike in facial hair / build / appearance. They should be uniformed but not look exactly the same physically.",
    "changed":"Forced the foreground soldiers to be <b>physically distinct</b> — different heights, builds, ages and facial hair (one tall lean clean-shaven, one stocky older with a full beard, one only a mustache), all still uniformed."},
   {"id":"ch07-cedar-creek","title":"07 · Cedar Creek",
    "note":"I liked the version where he held his gun as a walking stick — he would not yet have crutches if he had just been wounded and was struggling back toward a medical camp.",
    "changed":"Back to a <b>single rifle-musket used as a walking stick</b> (no crutches) — fresh thigh wound, struggling rearward across the emptied field; signature-free."},
 ],
 "alexander": [
   {"id":"ch16-three-hopeful-sons","title":"16 · “Three Hopeful Sons”",
    "note":"I really like the new V2 but Alexander (left) is in a strange jacket and he should look like his character-lock reference, with little or no facial hair.",
    "changed":"Kept the V2 composition and the center/right brothers; fixed <b>Alexander</b> (left) → a normal Union sack coat and <b>clean-shaven / minimal facial hair</b>, matching his portrait."},
   {"id":"ch18-tea-table","title":"18 · The Tea Table",
    "note":"V1 is great but the approaching soldier should be beardless.",
    "changed":"Kept your V1 exactly; the only change is the distant approaching soldier is now <b>clean-shaven / beardless</b>."},
 ],
}
def ex(s, stems): return [x for x in stems if os.path.exists(os.path.join(SCENES, s, x+".png"))]
def esc(x): return html.escape(x, quote=True)
def tile(s, stem, label, cls):
    return (f'<figure class="tile {cls}"><img loading="lazy" src="{esc(REL)}/{s}/{stem}.png" '
            f'onclick="zoom(this.src)" alt="{esc(label)}"><figcaption>{esc(label)}</figcaption></figure>')
def render(s, it):
    prev=ex(s, [it['id']+"-RW2-v1", it['id']+"-RW2-v2"])
    new=ex(s, [it['id']+"-RW3-v1", it['id']+"-RW3-v2"])
    pt="".join(tile(s,x,"round 2","orig") for x in prev) or '<p class="miss">—</p>'
    nt="".join(tile(s,x,"NEW · "+("V1" if x.endswith("v1") else "V2"),"rw") for x in new) or '<p class="miss">(rendering…)</p>'
    return f'''<article class="item"><header><h3>{esc(it['title'])}</h3>
      <p class="note"><b>Your note:</b> {esc(it['note'])}</p><p class="changed"><b>What I changed:</b> {it['changed']}</p></header>
      <div class="cmp"><div class="col"><div class="lab">Round 2</div><div class="tiles">{pt}</div></div>
      <div class="col"><div class="lab">Round 3 — pick one</div><div class="tiles">{nt}</div></div></div>
      <div class="picker" data-subject="{s}" data-chapter="{esc(it['id'])}">
      <button class="pk" data-v="rw3-v1">Pick&nbsp;V1</button><button class="pk" data-v="rw3-v2">Pick&nbsp;V2</button>
      <button class="pk neither" data-v="redo">Redo</button><input class="note-in" placeholder="note…"></div></article>'''
sections=[f'<section style="--accent:{ACCENT[s]}"><div class="head"><h2>{s.title()}</h2></div>'
          + "".join(render(s,it) for it in ITEMS[s]) + '</section>' for s in ["james","alexander"]]
PAGE=f'''<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Reworks Review — Round 3</title><style>
:root{{--bg:#15110c;--panel:#1f1810;--ink:#efe4d2;--mut:#b6a88f;--line:#3a2e1f;--gold:#c9a227}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--bg);color:var(--ink);font-family:"Iowan Old Style",Georgia,serif;line-height:1.5}}
header.top{{padding:24px 30px 12px;border-bottom:1px solid var(--line)}}header.top h1{{margin:0 0 4px;font-size:24px}}
header.top p{{margin:0;color:var(--mut);font-size:14px;max-width:72ch}}
section{{padding:24px 30px;border-bottom:1px solid var(--line)}}.head{{border-left:4px solid var(--accent);padding-left:12px;margin-bottom:16px}}
.head h2{{margin:0;color:var(--accent);font-size:22px}}
.item{{background:var(--panel);border:1px solid var(--line);border-radius:11px;padding:16px 18px;margin:0 0 18px}}
.item h3{{margin:0 0 6px;font-size:18px}}.item .note{{font-size:13.5px;color:#e7c46b;background:rgba(201,162,39,.08);border:1px solid rgba(201,162,39,.28);border-radius:6px;padding:7px 11px;margin:6px 0}}
.item .changed{{font-size:13.5px;margin:5px 0;color:#ddd0b8}}
.cmp{{display:flex;gap:18px;flex-wrap:wrap;margin:12px 0}}.col{{flex:1 1 360px;min-width:300px}}
.col .lab{{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--mut);margin-bottom:6px}}
.tiles{{display:flex;gap:10px;flex-wrap:wrap}}.tile{{margin:0;flex:1 1 220px;min-width:180px}}
.tile img{{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:7px;border:3px solid transparent;cursor:zoom-in;display:block;background:#000}}
.tile.orig img{{opacity:.5;border-color:#5a2c28}}.tile.rw img{{border-color:#2c3a2a}}
.tile.picked img{{border-color:var(--gold);box-shadow:0 0 20px rgba(201,162,39,.4);opacity:1}}
.tile figcaption{{margin-top:4px;font-size:11px;color:var(--mut);text-align:center}}.miss{{color:#8a7a5f;font-size:12px}}
.picker{{display:flex;gap:8px;align-items:center;flex-wrap:wrap;border-top:1px dashed var(--line);padding-top:11px;margin-top:6px}}
.pk{{font:inherit;font-size:13px;cursor:pointer;color:var(--ink);background:#2a2114;border:1px solid var(--line);border-radius:7px;padding:7px 14px}}
.pk.sel{{background:var(--gold);color:#1a1408;border-color:var(--gold);font-weight:600}}.pk.neither.sel{{background:#8a3b2e;color:#fff}}
.note-in{{flex:1 1 200px;min-width:160px;font:inherit;font-size:13px;background:#120e09;color:var(--ink);border:1px solid var(--line);border-radius:7px;padding:7px 10px}}
.bar{{position:fixed;right:16px;bottom:16px;display:flex;gap:8px;z-index:40}}.bar button{{font:inherit;font-size:13px;cursor:pointer;border:1px solid var(--gold);background:var(--gold);color:#1a1408;border-radius:8px;padding:10px 16px;font-weight:600}}
.lb{{position:fixed;inset:0;z-index:60;background:rgba(0,0,0,.93);display:none;align-items:center;justify-content:center;cursor:zoom-out}}.lb.on{{display:flex}}.lb img{{max-width:96vw;max-height:96vh}}
.modal{{position:fixed;inset:0;z-index:70;background:rgba(0,0,0,.85);display:none;align-items:center;justify-content:center;padding:24px}}.modal.on{{display:flex}}
.modal .box{{background:var(--panel);border:1px solid var(--line);border-radius:10px;width:min(680px,96vw);padding:18px;display:flex;flex-direction:column}}
.modal textarea{{min-height:200px;font-family:ui-monospace,monospace;font-size:12.5px;background:#120e09;color:var(--ink);border:1px solid var(--line);border-radius:8px;padding:12px}}
.modal .row{{display:flex;gap:8px;margin-top:10px;justify-content:flex-end}}
</style></head><body>
<header class="top"><h1>Reworks Review — Round 3</h1><p>The last 4 chapters, refined to your notes. Round 2 dimmed on the left; round 3 on the right. Pick V1/V2, then Copy.</p></header>
{''.join(sections)}
<div class="bar"><button onclick="showPicks()">Copy my picks ⎘</button></div>
<div class="lb" id="lb" onclick="this.classList.remove('on')"><img id="lbimg"></div>
<div class="modal" id="modal"><div class="box"><h4>Round-3 picks</h4><textarea id="out" readonly></textarea>
<div class="row"><button class="pk" onclick="modal.classList.remove('on')">Close</button><button class="pk sel" onclick="copyOut()">Copy</button></div></div></div>
<script>
const KEY="wtw-reworks-picks-r3";let store=JSON.parse(localStorage.getItem(KEY)||"{{}}");
const modal=document.getElementById('modal');function save(){{localStorage.setItem(KEY,JSON.stringify(store))}}
function zoom(s){{document.getElementById('lbimg').src=s;document.getElementById('lb').classList.add('on')}}
const TITLES={json.dumps({s:{it['id']:it['title'] for it in ITEMS[s]} for s in ITEMS})};
document.querySelectorAll('.picker').forEach(p=>{{const s=p.dataset.subject,c=p.dataset.chapter;const rec=(store[s]&&store[s][c])||{{}};const card=p.closest('.item');
 function mark(pk){{card.querySelectorAll('.tile.rw').forEach(t=>{{const v=t.querySelector('img').src.endsWith('v1.png')?'rw3-v1':'rw3-v2';t.classList.toggle('picked',!!pk&&v===pk);}});}}
 p.querySelectorAll('.pk').forEach(b=>{{if(rec.pick===b.dataset.v)b.classList.add('sel');b.onclick=()=>{{store[s]=store[s]||{{}};const cur=store[s][c]||{{}};cur.pick=(cur.pick===b.dataset.v)?null:b.dataset.v;store[s][c]=cur;p.querySelectorAll('.pk').forEach(x=>x.classList.toggle('sel',x.dataset.v===cur.pick));mark(cur.pick);save();}};}});
 const ni=p.querySelector('.note-in');if(rec.note)ni.value=rec.note;ni.oninput=()=>{{store[s]=store[s]||{{}};store[s][c]=store[s][c]||{{}};store[s][c].note=ni.value;save();}};mark(rec.pick);}});
function showPicks(){{let o="WHO THEY WERE — REWORK PICKS (round 3)\\n======================================\\n";for(const s of ["james","alexander"]){{if(!store[s])continue;const rows=[];for(const c in store[s]){{const r=store[s][c];if(!r||(!r.pick&&!r.note))continue;const t=(TITLES[s]&&TITLES[s][c])||c;let l="  "+(r.pick?("["+r.pick.toUpperCase()+"]").padEnd(9):"[ - ]    ")+t;if(r.note)l+="   — "+r.note;rows.push(l);}}if(rows.length)o+="\\n"+s.toUpperCase()+"\\n"+rows.join("\\n")+"\\n";}}document.getElementById('out').value=o;modal.classList.add('on');}}
function copyOut(){{const t=document.getElementById('out');t.select();navigator.clipboard.writeText(t.value);}}
</script></body></html>'''
os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT,"w",encoding="utf-8").write(PAGE)
print("Wrote", OUT)
for s in ITEMS:
    for it in ITEMS[s]:
        print(f"  {s}/{it['id']}: RW3 {len(ex(s,[it['id']+'-RW3-v1',it['id']+'-RW3-v2']))}/2")
