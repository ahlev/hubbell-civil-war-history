from PIL import Image, ImageDraw, ImageFont
CW, CH, PAD, LH, GUT = 470, 264, 14, 30, 8
rows = [
    ("CH01 \"What a Bedlam!\" (1861)", "figure - recruit, age 17", "ch01-bedlam-v1.png", "ch01-bedlam-v2.png"),
    ("CH02 Baltimore & Enfield Rifle", "action - column, Baltimore", "ch02-baltimore-enfield-v1.png", "ch02-baltimore-enfield-v2.png"),
    ("CH03 First Combat (Pine Mtn sunset)", "landscape - vista", "ch03-pine-mountain-v1.png", "ch03-pine-mountain-v2.png"),
    ("CH04 Antietam", "action - firing line", "ch04-antietam-v1.png", "ch04-antietam-v2.png"),
    ("CH05 The Hospital & Five Dollars", "object - still life", "ch05-five-dollars-v1.png", "ch05-five-dollars-v2.png"),
    ("CH06 Thanksgiving/Fireside Patriots", "BENCHMARK - real portrait outpainted", "ch06-thanksgiving-ORIGINAL-16x9.png", None),
    ("CH07 They Saw Henry Grasp His Leg", "symbol - Antietam memory", "ch07-henry-leg-v1.png", "ch07-henry-leg-v2.png"),
    ("CH08 Chancellorsville", "landscape - Wilderness/baggage", "ch08-chancellorsville-v1.png", "ch08-chancellorsville-v2.png"),
    ("CH09 Gettysburg (Culp's Hill)", "action - firing line", "ch09-gettysburg-v1.png", "ch09-gettysburg-v2.png"),
    ("CH10 Henry's Ghost", "figure - march, turns head", "ch10-henrys-ghost-v1.png", "ch10-henrys-ghost-v2.png"),
    ("CH11 The Rappahannock", "landscape - picket truce", "ch11-rappahannock-v1.png", "ch11-rappahannock-v2.png"),
    ("CH12 Lookout Mountain (WOUNDED)", "action - clutches side", "ch12-lookout-mountain-v1.png", "ch12-lookout-mountain-v2.png"),
    ("CH13 The Blues at Nashville", "figure - melancholy by fire", "ch13-blues-nashville-v1.png", "ch13-blues-nashville-v2.png"),
    ("CH14 The Atlanta Campaign", "action - night entrenching", "ch14-atlanta-campaign-v1.png", "ch14-atlanta-campaign-v2.png"),
    ("CH15 Scurvy, Lincoln, and a Vote", "figure - hospital, dignified", "ch15-scurvy-lincoln-vote-v1.png", "ch15-scurvy-lincoln-vote-v2.png"),
    ("CH16 \"Three Hopeful Sons\"", "object - letter + 3 caps", "ch16-three-hopeful-sons-v1.png", "ch16-three-hopeful-sons-v2.png"),
    ("CH17 The Valedictory (1865)", "figure - veteran, full beard", "ch17-valedictory-v1.png", "ch17-valedictory-v2.png"),
    ("CH18 The Tea Table (homecoming)", "landscape - farmhouse, golden", "ch18-tea-table-v1.png", "ch18-tea-table-v2.png"),
]
def font(sz, b=False):
    try: return ImageFont.truetype("arialbd.ttf" if b else "arial.ttf", sz)
    except OSError: return ImageFont.load_default()
FH, FS, FT = font(17, True), font(12), font(11, True)
W = PAD*2 + CW*2 + GUT
rowh = LH + CH + GUT
H = PAD*2 + 30 + rowh*len(rows)
img = Image.new("RGB", (W, H), (26, 24, 21)); d = ImageDraw.Draw(img)
d.text((PAD, PAD), "ALEXANDER F. HUBBELL - 60th NY - 18 chapter scenes (1861-65 aging arc: clean recruit -> bearded veteran). v1 left | v2 right; single = locked. CH06 = outpainted real portrait.",
       font=FS, fill=(214, 204, 188))
y = PAD + 28
for title, shot, f1, f2 in rows:
    d.text((PAD, y), title, font=FH, fill=(232, 224, 208))
    d.text((PAD + 340, y + 3), f"[{shot}]", font=FT, fill=(184, 134, 11))
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
