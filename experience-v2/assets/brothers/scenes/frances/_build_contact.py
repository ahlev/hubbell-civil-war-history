from PIL import Image, ImageDraw, ImageFont
CW, CH, PAD, LH, GUT = 470, 264, 14, 30, 8
rows = [
    ("CH01 \"If I Was a Man\"", "figure - reads casualty list at dawn window", "ch01-casualty-list-v1.png", "ch01-casualty-list-v2.png"),
    ("CH02 The Wounded List", "object - unfinished letter, guttering candle", "ch02-wounded-list-v1.png", "ch02-wounded-list-v2.png"),
    ("CH03 The Investigation", "figure - cross-referencing letters by lamp", "ch03-investigation-v1.png", "ch03-investigation-v2.png"),
    ("CH04 Hope Dies", "landscape - lone widow, wintry post-office road", "ch04-hope-dies-v1.png", "ch04-hope-dies-v2.png"),
    ("CH05 The Formal Inquiry", "figure - composed, writing to authority", "ch05-formal-inquiry-v1.png", "ch05-formal-inquiry-v2.png"),
    ("CH06 Reading His Letters", "BENCHMARK - HERO portrait outpainted to 16:9", "ch06-reading-letters-BENCHMARK-16x9.png", None),
    ("CH07 The Campaign for Charles", "object - sealed letters ready to post", "ch07-campaign-charles-v1.png", "ch07-campaign-charles-v2.png"),
    ("CH08 The Empty House", "interior - silent parlor, empty chairs, dusk", "ch08-empty-house-v1.png", "ch08-empty-house-v2.png"),
    ("CH09 \"Among the Living\"", "figure - relief, two letters + bone ring", "ch09-among-living-v1.png", "ch09-among-living-v2.png"),
    ("CH10 The War Ends", "symbol - churchyard, two graves, autumn", "ch10-war-ends-v1.png", "ch10-war-ends-v2.png"),
    ("CH11 The Cheese Factory", "landscape - Champlain valley, recovery 1870", "ch11-cheese-factory-v1.png", "ch11-cheese-factory-v2.png"),
]
def font(sz, b=False):
    try: return ImageFont.truetype("arialbd.ttf" if b else "arial.ttf", sz)
    except OSError: return ImageFont.load_default()
FH, FS, FT = font(17, True), font(12), font(11, True)
W = PAD*2 + CW*2 + GUT
rowh = LH + CH + GUT
H = PAD*2 + 30 + rowh*len(rows)
img = Image.new("RGB", (W, H), (24, 22, 26)); d = ImageDraw.Draw(img)
d.text((PAD, PAD), "FRANCES M. HUBBELL - chapter scenes (INTERPRETIVE appearance, no photo survives). v1 left | v2 right; single = locked. CH06 = outpainted HERO portrait.",
       font=FS, fill=(214, 204, 222))
y = PAD + 28
for title, shot, f1, f2 in rows:
    d.text((PAD, y), title, font=FH, fill=(232, 224, 240))
    d.text((PAD + 330, y + 3), f"[{shot}]", font=FT, fill=(170, 150, 200))
    cy = y + LH
    for i, fn in enumerate((f1, f2)):
        x = PAD + i*(CW + GUT)
        if fn is None:
            d.rectangle([x, cy, x+CW-1, cy+CH-1], outline=(70, 66, 76), width=1); continue
        try:
            th = Image.open(fn).convert("RGB").resize((CW, CH)); img.paste(th, (x, cy))
        except Exception:
            d.rectangle([x, cy, x+CW-1, cy+CH-1], fill=(60, 40, 60))
        d.rectangle([x, cy, x+CW-1, cy+CH-1], outline=(70, 66, 76), width=1)
        d.rectangle([x, cy, x+34, cy+18], fill=(40, 38, 44))
        d.text((x+5, cy+3), "v1" if i == 0 else "v2", font=FT, fill=(235, 230, 240))
    y += rowh
img.save("_CONTACT-SHEET.png")
print("wrote _CONTACT-SHEET.png", img.size)
