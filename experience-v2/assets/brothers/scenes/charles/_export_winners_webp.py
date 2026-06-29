"""Convert the 14 locked Charles chapter winners -> webp at ~1k wide.
Output: ch{NN}-{slug}.webp (version-agnostic, integration-ready)."""
from PIL import Image

MAXW = 1376  # keep 1k; CH07 outpainted original gets downscaled to match
WINNERS = [
    ("ch01-too-honest",        "ch01-too-honest-v1.png"),
    ("ch02-searching-henry",   "ch02-searching-henry-v1.png"),
    ("ch03-convalescent-camp", "ch03-convalescent-camp-v2.png"),
    ("ch04-headboard",         "ch04-headboard-v2.png"),
    ("ch05-chancellorsville",  "ch05-chancellorsville-v2.png"),
    ("ch06-capitol-hill",      "ch06-capitol-hill-v1.png"),
    ("ch07-clerk",             "ch07-clerk-ORIGINAL-16x9.png"),
    ("ch08-red-river",         "ch08-red-river-v2.png"),
    ("ch09-the-burning",       "ch09-the-burning-v2.png"),
    ("ch10-cedar-creek",       "ch10-cedar-creek-v2.png"),
    ("ch11-twenty-two-men",    "ch11-twenty-two-men-v1.png"),
    ("ch12-winter",            "ch12-winter-v2.png"),
    ("ch13-savannah",          "ch13-savannah-v1.png"),
    ("ch14-what-remained",     "ch14-what-remained-v1.png"),
]

for slug, src in WINNERS:
    im = Image.open(src).convert("RGB")
    if im.width > MAXW:
        h = round(im.height * MAXW / im.width)
        im = im.resize((MAXW, h), Image.LANCZOS)
    out = f"{slug}.webp"
    im.save(out, "WEBP", quality=82, method=6)
    print(f"{out:32s} {im.width}x{im.height}")
print("done — 14 webp written")
