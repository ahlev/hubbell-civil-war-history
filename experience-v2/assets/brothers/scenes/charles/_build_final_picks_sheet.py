"""Compose a single reference sheet of the 5 pending Charles chapters (v1|v2),
labeled with my recommended pick. Reads existing PNGs only — no generation."""
from PIL import Image, ImageDraw, ImageFont

CELL_W, CELL_H = 640, 360          # 16:9 thumbnails
PAD, LABEL_H, GUT = 18, 34, 10
COLS = 2

rows = [
    ("CH05", "Chancellorsville", "ch05-chancellorsville-v1.png", "ch05-chancellorsville-v2.png", "v2", "REWORK: Wilderness woods"),
    ("CH10", "Cedar Creek",      "ch10-cedar-creek-v1.png",      "ch10-cedar-creek-v2.png",      "v2", ""),
    ("CH12", "Winter",           "ch12-winter-v1.png",           "ch12-winter-v2.png",           "v1", "3rd try"),
    ("CH13", "Savannah",         "ch13-savannah-v1.png",         "ch13-savannah-v2.png",         "v1", "close call"),
    ("CH14", "What Remained",    "ch14-what-remained-v1.png",    "ch14-what-remained-v2.png",    "v1", "REWORK: at his ledger"),
]

def font(sz, bold=False):
    for name in (("arialbd.ttf",) if bold else ("arial.ttf",)):
        try: return ImageFont.truetype(name, sz)
        except OSError: pass
    return ImageFont.load_default()

F_HEAD = font(22, bold=True)
F_SUB  = font(15)
F_TAG  = font(14, bold=True)

sheet_w = PAD*2 + CELL_W*COLS + GUT
row_h   = LABEL_H + CELL_H + GUT
sheet_h = PAD*2 + row_h*len(rows) + 40

img = Image.new("RGB", (sheet_w, sheet_h), (24, 22, 20))
d = ImageDraw.Draw(img)
d.text((PAD, PAD-2), "Charles — FINAL PICKS (5 pending) · green = my rec · open + pick v1/v2",
       font=F_SUB, fill=(210, 200, 185))

y = PAD + 30
for code, title, f1, f2, rec, tag in rows:
    # row header
    d.text((PAD, y), f"{code}  {title}", font=F_HEAD, fill=(230, 222, 208))
    if tag:
        d.text((PAD + 320, y + 4), f"[{tag}]", font=F_TAG, fill=(200, 150, 110))
    cy = y + LABEL_H
    for i, (fn, ver) in enumerate(((f1, "v1"), (f2, "v2"))):
        x = PAD + i*(CELL_W + GUT)
        try:
            thumb = Image.open(fn).convert("RGB").resize((CELL_W, CELL_H))
        except FileNotFoundError:
            thumb = Image.new("RGB", (CELL_W, CELL_H), (60, 40, 40))
        img.paste(thumb, (x, cy))
        picked = (ver == rec)
        border = (90, 200, 110) if picked else (70, 66, 60)
        d.rectangle([x, cy, x+CELL_W-1, cy+CELL_H-1], outline=border, width=4 if picked else 1)
        tagtxt = f"{ver}  ✓ REC" if picked else ver
        bg = (40, 90, 50) if picked else (40, 38, 34)
        d.rectangle([x, cy, x+96, cy+24], fill=bg)
        d.text((x+6, cy+4), tagtxt, font=F_TAG, fill=(235, 235, 225))
    y += row_h

img.save("_FINAL-PICKS-SHEET.png")
print("wrote _FINAL-PICKS-SHEET.png", img.size)
