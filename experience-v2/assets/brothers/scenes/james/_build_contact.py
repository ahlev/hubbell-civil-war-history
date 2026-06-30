from PIL import Image, ImageDraw, ImageFont
CW, CH, PAD, LH, GUT = 470, 264, 14, 30, 8
rows = [
    ("CH01 The Cadet (West Point)", "figure - clean-shaven cadet grey", "ch01-cadet-v1.png", "ch01-cadet-v2.png"),
    ("CH02 What He Didn't Know", "figure - cadet, innocent", "ch02-what-he-didnt-know-v1.png", "ch02-what-he-didnt-know-v2.png"),
    ("SILENCE Two Years (cadet->soldier)", "object/symbol", "silence1-transformation.png", None),
    ("CH03 Morganza, Louisiana", "landscape", "ch03-morganza.png", None),
    ("CH04 Generally Unwell & Played Out", "BENCHMARK - real portrait outpainted", "ch04-played-out-ORIGINAL-16x9.png", None),
    ("CH05 Winchester", "action - first battle", "ch05-winchester-v1.png", "ch05-winchester-v2.png"),
    ("CH06 The Valley (the Burning)", "landscape", "ch06-valley-burning.png", None),
    ("CH07 Cedar Creek (wounded)", "figure - walks wounded", "ch07-cedar-creek-v1.png", "ch07-cedar-creek-v2.png"),
    ("CH08 Hospital Chain (votes Lincoln)", "figure - votes from cot", "ch08-hospital-vote-v1.png", "ch08-hospital-vote-v2.png"),
    ("CH09 The Ring", "object - handmade ring", "ch09-the-ring.png", None),
    ("SILENCE Oct 19 1865 (his death)", "symbol - autumn grave", "silence2-grave.png", None),
    ("CH10 What Remains", "object - letters + ring", "ch10-what-remains.png", None),
]
def font(sz, b=False):
    try: return ImageFont.truetype("arialbd.ttf" if b else "arial.ttf", sz)
    except OSError: return ImageFont.load_default()
FH, FS, FT = font(17, True), font(12), font(11, True)
W = PAD*2 + CW*2 + GUT
rowh = LH + CH + GUT
H = PAD*2 + 30 + rowh*len(rows)
img = Image.new("RGB", (W, H), (26, 24, 21)); d = ImageDraw.Draw(img)
d.text((PAD, PAD), "JAMES HUBBELL - chapter scenes (lean/youthful, NOT gaunt). v1 left | v2 right; single = locked. CH04 = outpainted real portrait.",
       font=FS, fill=(214, 204, 188))
y = PAD + 28
for title, shot, f1, f2 in rows:
    d.text((PAD, y), title, font=FH, fill=(232, 224, 208))
    d.text((PAD + 330, y + 3), f"[{shot}]", font=FT, fill=(150, 185, 120))
    cy = y + LH
    for i, fn in enumerate((f1, f2)):
        x = PAD + i*(CW + GUT)
        if fn is None:
            d.rectangle([x, cy, x+CW-1, cy+CH-1], outline=(70, 66, 60), width=1); continue
        try:
            th = Image.open(fn).convert("RGB").resize((CW, CH)); img.paste(th, (x, cy))
        except Exception:
            d.rectangle([x, cy, x+CW-1, cy+CH-1], fill=(60, 40, 40))
        d.rectangle([x, cy, x+CW-1, cy+CH-1], outline=(70, 66, 60), width=1)
        d.rectangle([x, cy, x+34, cy+18], fill=(40, 38, 34))
        d.text((x+5, cy+3), "v1" if i == 0 else "v2", font=FT, fill=(235, 235, 225))
    y += rowh
img.save("_CONTACT-SHEET.png")
print("wrote _CONTACT-SHEET.png", img.size)
