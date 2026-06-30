from PIL import Image, ImageDraw, ImageFont
CW, CH, PAD, LH, GUT = 470, 264, 14, 30, 8
rows = [
    ("CH01 Arrival", "figure", "ch01-arrival-v1.png", "ch01-arrival-v2.png"),
    ("CH02 Cannons at Bull Run", "landscape", "ch02-bull-run-v1.png", "ch02-bull-run-v2.png"),
    ("CH03 Camp Life & Advice", "BENCHMARK - real portrait outpainted", "ch03-camp-life-ORIGINAL-16x9.png", None),
    ("CH04 Harpers Ferry", "landscape", "ch04-harpers-ferry-v1.png", "ch04-harpers-ferry-v2.png"),
    ("CH05 Siege of Yorktown", "action", "ch05-yorktown-v1.png", "ch05-yorktown-v2.png"),
    ("CH06 Fair Oaks / Decline", "figure - illness", "ch06-fair-oaks-v1.png", "ch06-fair-oaks-v2.png"),
    ("CH07 The Seven Days", "action", "ch07-seven-days-v1.png", "ch07-seven-days-v2.png"),
    ("CH08 The Last Letter", "landscape - grand review", "ch08-last-letter-v1.png", "ch08-last-letter-v2.png"),
    ("SILENCE Antietam (his death)", "symbol - no figure", "silence-antietam-v1.png", "silence-antietam-v2.png"),
    ("CH09 The Family Learns", "the mother, face turned", "ch09-family-learns-v1.png", "ch09-family-learns-v2.png"),
    ("CH10 What Remains", "object - the letters", "ch10-what-remains-v1.png", "ch10-what-remains-v2.png"),
]
def font(sz, b=False):
    try: return ImageFont.truetype("arialbd.ttf" if b else "arial.ttf", sz)
    except OSError: return ImageFont.load_default()
FH, FS, FT = font(17, True), font(12), font(11, True)
W = PAD*2 + CW*2 + GUT
rowh = LH + CH + GUT
H = PAD*2 + 30 + rowh*len(rows)
img = Image.new("RGB", (W, H), (26, 24, 21)); d = ImageDraw.Draw(img)
d.text((PAD, PAD), "HENRY HUBBELL - chapter scenes (v1 left | v2 right) - pick one per chapter; CH03 is the outpainted real portrait",
       font=FS, fill=(214, 204, 188))
y = PAD + 28
for title, shot, f1, f2 in rows:
    d.text((PAD, y), title, font=FH, fill=(232, 224, 208))
    d.text((PAD + 300, y + 3), f"[{shot}]", font=FT, fill=(190, 150, 105))
    cy = y + LH
    for i, fn in enumerate((f1, f2)):
        x = PAD + i*(CW + GUT)
        if fn is None:
            d.rectangle([x, cy, x+CW-1, cy+CH-1], outline=(70, 66, 60), width=1); continue
        try:
            th = Image.open(fn).convert("RGB").resize((CW, CH))
            img.paste(th, (x, cy))
        except Exception:
            d.rectangle([x, cy, x+CW-1, cy+CH-1], fill=(60, 40, 40))
        d.rectangle([x, cy, x+CW-1, cy+CH-1], outline=(70, 66, 60), width=1)
        d.rectangle([x, cy, x+34, cy+18], fill=(40, 38, 34))
        d.text((x+5, cy+3), "v1" if i == 0 else "v2", font=FT, fill=(235, 235, 225))
    y += rowh
img.save("_CONTACT-SHEET.png")
print("wrote _CONTACT-SHEET.png", img.size)
