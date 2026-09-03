#!/usr/bin/env python
"""
build_og_cards.py — generate Open Graph link-preview cards for the
Hubbell Civil War Letters site.

Outputs to /og :
  card-<slug>.jpg   1200x630 static cards (all crawlers)
  anim-<slug>.gif    960x504 animated "breathing" cards (Discord/Telegram/Slack)

Run from project root:  python scripts/og/build_og_cards.py [--static-only]
Requires: Pillow, ffmpeg on PATH.
"""

import os, sys, subprocess, shutil
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageEnhance

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OG   = os.path.join(ROOT, 'og')
A    = os.path.join(ROOT, 'experience-v2', 'assets')
P    = os.path.join(ROOT, 'press-assets')
FONT = os.path.join(ROOT, 'scripts', 'og', 'fonts', 'SourceSerif4-VariableFont.ttf')
MONO = r'C:\Windows\Fonts\consola.ttf'   # JetBrains Mono stand-in for the overline

W, H = 1200, 630          # static card size
GW, GH = 960, 504         # animated card size

PAPER   = (236, 227, 210)  # --paper
MUTED   = (201, 195, 182)
LANTERN = (224, 176, 112)  # --lantern
COLORS = {
    'alexander': (184, 134, 11),   # #B8860B
    'henry':     (45, 95, 138),    # #2D5F8A
    'james':     (74, 124, 89),    # #4A7C59
    'charles':   (139, 58, 58),    # #8B3A3A
    'mother':    (123, 94, 167),   # #7B5EA7
    'site':      (224, 176, 112),  # lantern gold
}

def serif(size, weight=560, opsz=40):
    f = ImageFont.truetype(FONT, size)
    try: f.set_variation_by_axes([opsz, weight])
    except Exception: pass
    return f

def mono(size):
    return ImageFont.truetype(MONO, size)

def tracked_text(draw, xy, text, font, fill, tracking=6):
    """Draw text with letterspacing (PIL has no native tracking)."""
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill)
        x += draw.textlength(ch, font=font) + tracking
    return x

def tracked_width(draw, text, font, tracking=6):
    return sum(draw.textlength(c, font=font) + tracking for c in text) - tracking

def cover(im, w, h, focus_y=0.42):
    """Scale+crop to cover w x h, keeping focus_y of source height centered."""
    sw, sh = im.size
    scale = max(w / sw, h / sh)
    im = im.resize((round(sw * scale), round(sh * scale)), Image.LANCZOS)
    sw, sh = im.size
    x = (sw - w) // 2
    y = min(max(round(sh * focus_y - h / 2), 0), sh - h)
    return im.crop((x, y, x + w, y + h))

def bottom_gradient(w, h, strength=215, span=0.60):
    """Transparent->black gradient over the lower part of the card."""
    g = Image.new('L', (1, h), 0)
    top = round(h * (1 - span))
    for y in range(h):
        if y <= top: v = 0
        else:
            t = (y - top) / (h - top)
            v = round(strength * (t ** 1.5))
        g.putpixel((0, y), v)
    grad = Image.new('RGBA', (w, h), (8, 9, 12, 255))
    grad.putalpha(g.resize((w, h)))
    return grad

def text_overlay(w, h, overline, title, sub, accent, scale=1.0, block_w=None, grad=215):
    """Render the branded text block (transparent RGBA) — shared by JPG + GIF paths."""
    ov = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    ov.alpha_composite(bottom_gradient(w, h, strength=grad))
    d = ImageDraw.Draw(ov)

    m = round(56 * scale)
    max_w = (block_w or (w - 2 * m))

    f_over  = mono(round(21 * scale))
    f_sub   = serif(round(27 * scale), weight=420, opsz=20)

    # Title: shrink to fit width
    size = round(78 * scale)
    while size > 30:
        f_title = serif(size, weight=580, opsz=60)
        if d.textlength(title, font=f_title) <= max_w: break
        size -= 3

    # Stack up from the bottom margin
    y = h - m
    if sub:
        y -= round(34 * scale)
        d.text((m, y), sub, font=f_sub, fill=MUTED + (255,))
        y -= round(14 * scale)
    # accent rule
    y -= round(10 * scale)
    d.rectangle([m + 2, y, m + 2 + round(64 * scale), y + round(4 * scale)], fill=accent + (255,))
    y -= round(18 * scale)
    # title
    bbox = d.textbbox((0, 0), title, font=f_title)
    th = bbox[3] - bbox[1]
    y -= th
    d.text((m, y - bbox[1]), title, font=f_title, fill=PAPER + (255,))
    # overline
    y -= round(38 * scale)
    tracked_text(d, (m + 2, y), overline.upper(), f_over, LANTERN + (255,), tracking=round(6 * scale))
    return ov

# ── static layouts ──────────────────────────────────────────────

def card_cover(src, overline, title, sub, accent, focus_y=0.42, darken=0.88):
    im = cover(Image.open(src).convert('RGB'), W, H, focus_y)
    im = ImageEnhance.Brightness(im).enhance(darken)
    im = im.convert('RGBA')
    im.alpha_composite(text_overlay(W, H, overline, title, sub, accent))
    return im.convert('RGB')

def card_split(src, overline, title, sub, accent, fg_focus=0.30):
    """Portrait subject right, blurred backdrop + text left."""
    base = Image.open(src).convert('RGB')
    bg = cover(base, W, H, 0.35).filter(ImageFilter.GaussianBlur(26))
    bg = ImageEnhance.Brightness(bg).enhance(0.42)
    bg = ImageEnhance.Color(bg).enhance(0.8).convert('RGBA')

    sw, sh = base.size
    fw = round(sw * (H / sh))
    fg = base.resize((fw, H), Image.LANCZOS)
    fx = W - fw - 48
    # soft shadow behind the portrait
    sh_im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(sh_im).rectangle([fx - 14, 0, fx + fw + 14, H], fill=(0, 0, 0, 110))
    sh_im = sh_im.filter(ImageFilter.GaussianBlur(18))
    bg.alpha_composite(sh_im)
    bg.paste(fg, (fx, 0))
    bg.alpha_composite(text_overlay(W, H, overline, title, sub, accent, block_w=fx - 100))
    return bg.convert('RGB')

def card_family(srcs, overline, title, sub, accent):
    """N portrait columns side by side (the family strip)."""
    n = len(srcs)
    cw = W // n
    im = Image.new('RGBA', (W, H))
    for i, s in enumerate(srcs):
        col = cover(Image.open(s).convert('RGB'), cw if i < n - 1 else W - cw * (n - 1), H, 0.30)
        col = ImageEnhance.Brightness(col).enhance(0.92)
        im.paste(col, (cw * i, 0))
        if i:  # seam shadow
            seam = Image.new('RGBA', (44, H), (0, 0, 0, 0))
            g = ImageDraw.Draw(seam)
            for x in range(44):
                a = round(90 * (1 - abs(x - 22) / 22))
                g.line([(x, 0), (x, H)], fill=(8, 7, 5, a))
            im.alpha_composite(seam, (cw * i - 22, 0))
    im.alpha_composite(text_overlay(W, H, overline, title, sub, accent))
    return im.convert('RGB')

# ── animated cards ──────────────────────────────────────────────

def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print('FFMPEG FAIL:', ' '.join(cmd[:8]), '…\n', r.stderr[-600:])
        return False
    return True

PALETTE = ("split[s0][s1];[s0]palettegen=max_colors=220[p];"
           "[s1][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle")

def gif_landscape(video, overlay_png, out, speed=1.0, fps=11, ss=0, t=None, gw=GW, gh=GH, darken=0):
    """Cover-crop a landscape loop; optional time-compression keeps loops seamless."""
    setpts = f"setpts={1/speed:.4f}*PTS," if speed != 1.0 else ""
    eq = f"eq=brightness=-{darken:.2f}," if darken else ""
    vf = (f"[0:v]{setpts}fps={fps},scale={gw}:{gh}:force_original_aspect_ratio=increase,"
          f"crop={gw}:{gh},{eq}setsar=1[v];[v][1:v]overlay=0:0,{PALETTE}")
    cmd = ['ffmpeg', '-y']
    if ss: cmd += ['-ss', str(ss)]
    if t:  cmd += ['-t', str(t)]
    cmd += ['-i', video, '-i', overlay_png, '-filter_complex', vf, '-loop', '0', out]
    return run(cmd)

def gif_portrait(video, overlay_png, out, speed=1.0, fps=11, gw=GW, gh=GH):
    """Portrait loop right over its own blurred backdrop, text left."""
    setpts = f"setpts={1/speed:.4f}*PTS," if speed != 1.0 else ""
    vf = (f"[0:v]{setpts}fps={fps},split[a][b];"
          f"[a]scale={gw}:{gh}:force_original_aspect_ratio=increase,crop={gw}:{gh},"
          f"gblur=sigma=22,eq=brightness=-0.22:saturation=0.8[bg];"
          f"[b]scale=-2:{gh}[fg];"
          f"[bg][fg]overlay=W-w-40:0[comp];[comp][1:v]overlay=0:0,{PALETTE}")
    return run(['ffmpeg', '-y', '-i', video, '-i', overlay_png,
                '-filter_complex', vf, '-loop', '0', out])

def gif_kenburns(img, overlay_png, out, fps=11, dur=3.2, zoom=1.075, gw=GW, gh=GH):
    """Slow push-in on a still — a breathing photograph."""
    frames = round(fps * dur)
    zstep = (zoom - 1) / frames
    vf = (f"[0:v]scale={gw*2}:-2,"
          f"zoompan=z='min(1+{zstep:.6f}*on,{zoom})':d={frames}:"
          f"x='iw/2-(iw/zoom/2)':y='ih*0.30-(ih/zoom/2)':s={gw}x{gh}:fps={fps},setsar=1[v];"
          f"[v][1:v]overlay=0:0,{PALETTE}")
    return run(['ffmpeg', '-y', '-loop', '1', '-t', str(dur), '-i', img, '-i', overlay_png,
                '-filter_complex', vf, '-loop', '0', out])

def shrink_if_huge(out, budget_mb=7.5):
    """Re-encode oversized GIFs at 4/5 scale until under budget."""
    for gw in (768, 640, 560):
        if os.path.getsize(out) <= budget_mb * 1024 * 1024: return
        gh = round(gw * GH / GW / 2) * 2
        tmp = out + '.tmp.gif'
        if run(['ffmpeg', '-y', '-i', out, '-filter_complex',
                f"[0:v]scale={gw}:{gh}:flags=lanczos,{PALETTE}", '-loop', '0', tmp]):
            os.replace(tmp, out)
    print(f"  ! {os.path.basename(out)} still {os.path.getsize(out)/1e6:.1f} MB")

# ── manifest ────────────────────────────────────────────────────

SITE_OVER = 'Hubbell Civil War Letters · 1861–1870'

STATIC = [
    # slug, layout, src, overline, title, sub, accent, extra
    ('home',            'cover', f'{A}/hero-poster-v2.jpg', SITE_OVER,
     'The Hubbell Brothers', 'Four brothers, their mother, and 273 letters from the war', 'site', {}),
    ('parallel-lives',  'cover', f'{P}/hubbell-letters-02-parallel-lives-desktop.png', SITE_OVER,
     'Parallel Lives', '273 letters on one interactive timeline', 'site', {'focus_y': 0.5, 'darken': 0.8}),
    ('map',             'cover', f'{P}/hubbell-letters-03-map-that-moves-desktop.png', SITE_OVER,
     'A Map That Moves', 'Follow four brothers across the war, day by day', 'site', {'focus_y': 0.5, 'darken': 0.8}),
    ('health-ledger',   'cover', f'{P}/hubbell-letters-05-wellness-ledger-desktop.png', SITE_OVER,
     'The Wellness Ledger', 'Sickness, wounds, and recovery in their own words', 'site', {'focus_y': 0.5, 'darken': 0.8}),
    ('money-story',     'cover', f'{A}/brothers/scenes/alexander/ch05-five-dollars.webp', SITE_OVER,
     'The Money Story', 'Army pay, family debts, and the price of everything', 'site', {}),
    ('people-web',      'cover', f'{P}/hubbell-letters-04-people-web-desktop.png', SITE_OVER,
     'The People Web', 'Every person, connected across 273 letters', 'site', {'focus_y': 0.5, 'darken': 0.8}),
    ('emotional-arcs',  'cover', f'{A}/brothers/scenes/alexander/ch10-henrys-ghost.webp', SITE_OVER,
     'Emotional Arcs', 'The feeling of the war, letter by letter', 'site', {}),
    ('what-they-didnt-know', 'cover', f'{A}/brothers/scenes/alexander/ch09-gettysburg.webp', SITE_OVER,
     "What They Didn't Know", 'What the letters could not yet see', 'site', {}),
    ('what-they-wrote-about', 'cover', f'{A}/brothers/scenes/charles/ch07-clerk.webp', SITE_OVER,
     'What They Wrote About', "The topics of a family's war", 'site', {}),
    ('collection',      'cover', f'{P}/hubbell-letters-08-the-collection-desktop.png', SITE_OVER,
     'The Archive', 'Five generations of stewardship', 'site', {'focus_y': 0.5, 'darken': 0.8}),
    ('search',          'cover', f'{P}/hubbell-letters-06-letter-reader-desktop.png', SITE_OVER,
     'Search the Letters', 'Full-text search across 273 letters', 'site', {'focus_y': 0.5, 'darken': 0.8}),
    ('reader',          'cover', f'{P}/hubbell-letters-06-letter-reader-desktop.png', SITE_OVER,
     'The Letter Reader', 'Read the letters as they were written', 'site', {'focus_y': 0.45, 'darken': 0.8}),
    ('about',           'cover', f'{A}/hero-poster.jpg', SITE_OVER,
     'About the Project', 'An AI-enabled family archive, opened to everyone', 'site', {}),
    ('faq',             'cover', f'{A}/brothers/scenes/alexander/ch16-three-hopeful-sons.webp', SITE_OVER,
     'Questions & Answers', 'How the archive was built, and why', 'site', {}),
    ('press',           'cover', f'{P}/hubbell-letters-01-landing-desktop.png', SITE_OVER,
     'Press Kit', 'Screenshots, facts, and the story behind the archive', 'site', {'focus_y': 0.5, 'darken': 0.8}),
    ('their-own-words', 'cover', f'{A}/brothers/scenes/alexander/ch01-bedlam.webp', SITE_OVER,
     'In Their Own Words', 'Fifty questions, answered from the letters', 'site', {}),
    ('unguarded-letter','cover', f'{A}/brothers/scenes/alexander/ch11-rappahannock.webp', SITE_OVER,
     'The Unguarded Letter', 'One letter, read closely', 'site', {}),
    ('default',         'cover', f'{A}/hero-poster-v2.jpg', SITE_OVER,
     'Hubbell Civil War Letters', 'An interactive family archive of the American Civil War', 'site', {}),
    # people
    ('henry',     'split', f'{A}/brothers/web/window-henry-v2.webp',  'Who They Were',
     'Henry Hubbell', '34th New York Infantry · the eldest', 'henry', {}),
    ('alexander', 'split', f'{A}/brothers/web/window-alexander-fav.webp', 'Who They Were',
     'Alexander F. Hubbell', 'Co. H, 60th New York Infantry', 'alexander', {}),
    ('james',     'split', f'{A}/brothers/web/window-james-v2-wide.webp', 'Who They Were',
     'James Hubbell', '16th New York Heavy Artillery', 'james', {}),
    ('charles',   'split', f'{A}/brothers/web/window-charles-v2.webp', 'Who They Were',
     'Charles F. Hubbell', 'The home front · Champlain, New York', 'charles', {}),
    ('frances',   'split', f'{A}/brothers/web/window-frances.webp', 'Who They Were',
     'Frances Hubbell', "A mother's war · Champlain, New York", 'mother', {}),
    # letters (per-author, reused for all ?letter= links)
    ('letter-henry',     'split', f'{A}/brothers/web/window-henry-v2.webp', 'From the archive',
     'A letter from Henry', SITE_OVER, 'henry', {}),
    ('letter-alexander', 'split', f'{A}/brothers/web/window-alexander-fav.webp', 'From the archive',
     'A letter from Alexander', SITE_OVER, 'alexander', {}),
    ('letter-james',     'split', f'{A}/brothers/web/window-james-v2-wide.webp', 'From the archive',
     'A letter from James', SITE_OVER, 'james', {}),
    ('letter-charles',   'split', f'{A}/brothers/web/window-charles-v2.webp', 'From the archive',
     'A letter from Charles', SITE_OVER, 'charles', {}),
    ('letter-mother',    'split', f'{A}/brothers/web/window-frances.webp', 'From the archive',
     'A letter from Mother', SITE_OVER, 'mother', {}),
]

# who-they-were family strip
FAMILY = [f'{A}/brothers/web/window-henry-v2.webp',
          f'{A}/brothers/web/window-alexander-fav.webp',
          f'{A}/brothers/web/window-frances.webp',
          f'{A}/brothers/web/window-james-v2-wide.webp',
          f'{A}/brothers/web/window-charles-v2.webp']

ANIM = [
    # slug, kind, src, (overline,title,sub,accent), kwargs
    ('home', 'landscape', f'{A}/loop-field-warm-v3.mp4',
     (SITE_OVER, 'The Hubbell Brothers', 'Four brothers, their mother, and 273 letters', 'site'),
     {'speed': 2.0, 'fps': 11, 'darken': 0.10, 'plain': True}),  # full 9 s loop compressed → seamless;
     # plain: no baked-in text — GIF palette washes it out and the platform's own
     # og:title label already says it (looked like ghost text over the scene)
    ('parallel-lives', 'landscape', f'{A}/teasers/teaser-parallel.mp4',
     (SITE_OVER, 'Parallel Lives', '273 letters on one interactive timeline', 'site'),
     {'ss': 1, 't': 4, 'fps': 11}),
    ('map', 'landscape', f'{A}/teasers/teaser-map.mp4',
     (SITE_OVER, 'A Map That Moves', 'Follow four brothers across the war', 'site'),
     {'ss': 1, 't': 4, 'fps': 11}),
    ('health-ledger', 'landscape', f'{A}/teasers/teaser-ledger.mp4',
     (SITE_OVER, 'The Wellness Ledger', 'Sickness, wounds, and recovery', 'site'),
     {'ss': 1, 't': 4, 'fps': 11}),
    ('people-web', 'landscape', f'{A}/teasers/teaser-web.mp4',
     (SITE_OVER, 'The People Web', 'Every person, connected', 'site'),
     {'ss': 1, 't': 4, 'fps': 11}),
    ('money-story', 'kenburns', f'{A}/brothers/scenes/alexander/ch05-five-dollars.webp',
     (SITE_OVER, 'The Money Story', 'Army pay, debts, and the price of everything', 'site'), {}),
    ('henry', 'portrait', f'{A}/brothers/loops/loop-henry.mp4',
     ('Who They Were', 'Henry Hubbell', '34th New York Infantry · the eldest', 'henry'),
     {'speed': 1.6}),                                # full 5 s loop → ~3.1 s, seamless
    ('alexander', 'portrait', f'{A}/brothers/loops/loop-alexander-fav.mp4',
     ('Who They Were', 'Alexander F. Hubbell', 'Co. H, 60th New York Infantry', 'alexander'),
     {'speed': 1.6}),
    ('james', 'portrait', f'{A}/brothers/loops/loop-james-wide.mp4',
     ('Who They Were', 'James Hubbell', '16th New York Heavy Artillery', 'james'),
     {'speed': 1.6}),
    ('charles', 'portrait', f'{A}/brothers/loops/loop-charles.mp4',
     ('Who They Were', 'Charles F. Hubbell', 'The home front · Champlain, N.Y.', 'charles'),
     {'speed': 1.6}),
    ('frances', 'kenburns', f'{A}/brothers/web/window-frances.webp',
     ('Who They Were', 'Frances Hubbell', "A mother's war · Champlain, New York", 'mother'), {}),
    ('letter-henry', 'portrait', f'{A}/brothers/loops/loop-henry.mp4',
     ('From the archive', 'A letter from Henry', SITE_OVER, 'henry'), {'speed': 1.6}),
    ('letter-alexander', 'portrait', f'{A}/brothers/loops/loop-alexander-fav.mp4',
     ('From the archive', 'A letter from Alexander', SITE_OVER, 'alexander'), {'speed': 1.6}),
    ('letter-james', 'portrait', f'{A}/brothers/loops/loop-james-wide.mp4',
     ('From the archive', 'A letter from James', SITE_OVER, 'james'), {'speed': 1.6}),
    ('letter-charles', 'portrait', f'{A}/brothers/loops/loop-charles.mp4',
     ('From the archive', 'A letter from Charles', SITE_OVER, 'charles'), {'speed': 1.6}),
    ('letter-mother', 'kenburns', f'{A}/brothers/web/window-frances.webp',
     ('From the archive', 'A letter from Mother', SITE_OVER, 'mother'), {}),
]

def main():
    static_only = '--static-only' in sys.argv
    only = sys.argv[sys.argv.index('--only') + 1] if '--only' in sys.argv else None
    os.makedirs(OG, exist_ok=True)
    missing = [s[2] for s in STATIC if not os.path.exists(s[2])] + \
              [s for s in FAMILY if not os.path.exists(s)] + \
              ([] if static_only else [a[2] for a in ANIM if not os.path.exists(a[2])])
    if missing:
        print('MISSING SOURCES:'); [print(' ', m) for m in missing]; sys.exit(1)

    print('— static cards —')
    for slug, layout, src, over, title, sub, accent, extra in STATIC:
        if only and slug != only: continue
        fn = os.path.join(OG, f'card-{slug}.jpg')
        im = (card_cover(src, over, title, sub, COLORS[accent], **extra) if layout == 'cover'
              else card_split(src, over, title, sub, COLORS[accent], **extra))
        im.save(fn, quality=87, progressive=True)
        print(f'  card-{slug}.jpg  {os.path.getsize(fn)//1024} KB')

    fn = os.path.join(OG, 'card-who-they-were.jpg')
    card_family(FAMILY, SITE_OVER, 'Who They Were', 'The Hubbell family of Champlain, New York',
                COLORS['site']).save(fn, quality=87, progressive=True)
    print(f'  card-who-they-were.jpg  {os.path.getsize(fn)//1024} KB')

    if static_only: return
    print('— animated cards —')
    tmpdir = os.path.join(ROOT, 'scripts', 'og', '_tmp')
    os.makedirs(tmpdir, exist_ok=True)
    for slug, kind, src, (over, title, sub, accent), kw in ANIM:
        if only and slug != only: continue
        ovl = os.path.join(tmpdir, f'ovl-{slug}.png')
        if kw.pop('plain', False):
            Image.new('RGBA', (GW, GH), (0, 0, 0, 0)).save(ovl)
        else:
            block_w = round(GW * 0.62) if kind == 'portrait' else None
            text_overlay(GW, GH, over, title, sub, COLORS[accent], scale=0.8, block_w=block_w,
                         grad=245).save(ovl)
        out = os.path.join(OG, f'anim-{slug}.gif')
        ok = (gif_landscape(src, ovl, out, **kw) if kind == 'landscape' else
              gif_portrait(src, ovl, out, **kw)  if kind == 'portrait'  else
              gif_kenburns(src, ovl, out, **kw))
        if ok:
            shrink_if_huge(out)
            print(f'  anim-{slug}.gif  {os.path.getsize(out)/1e6:.2f} MB')
    shutil.rmtree(tmpdir, ignore_errors=True)

if __name__ == '__main__':
    main()
