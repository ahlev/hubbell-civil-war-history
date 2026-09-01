#!/usr/bin/env python
"""
inject_static_meta.py — bake a static OG/Twitter baseline into every public
page's <head>, between <!-- og:begin --> / <!-- og:end --> markers (idempotent).

The edge middleware (middleware.js) strips this block for known bots and
injects dynamic tags (letter excerpts, person cards, platform-aware animated
GIFs). The static baseline covers every OTHER crawler and preview agent.

Run from project root:  python scripts/og/inject_static_meta.py
"""

import os, re, glob, html as htmlmod

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ORIGIN = 'https://hubbell-civil-war-history.vercel.app'

SITE_NAME = 'Hubbell Civil War Letters'
DEFAULT_DESC = ("273 letters from four brothers and their mother, 1861–1870 — "
                "an interactive exploration of the American Civil War through one family's words.")

# Mirrors middleware.js PAGE_TITLES / PAGE_CARDS (clean-URL path keys)
PAGE_TITLES = {
    '/': 'The Hubbell Brothers — Civil War Letters, 1861–1870',
    '/experience-v2/landing': 'The Hubbell Brothers — Civil War Letters, 1861–1870',
    '/hubbell-dashboard': 'Parallel Lives — Hubbell Civil War Letters',
    '/search': 'Search — Hubbell Civil War Letters',
    '/reader': 'The Letter Reader — Hubbell Civil War Letters',
    '/brother-henry': 'Henry Hubbell — 34th NY Infantry',
    '/brother-alexander': 'Alexander F. Hubbell — 60th NY Infantry',
    '/brother-james': 'James Hubbell — 16th NY Heavy Artillery',
    '/brother-charles': 'Charles F. Hubbell — Home Front',
    '/mother-frances': "Frances Hubbell — A Mother's War",
    '/who-they-were': 'Who They Were — The Hubbell Family',
    '/viz-emotional-arcs': 'Emotional Arcs — Civil War Letters',
    '/viz-emotional-arcs-v2': 'Emotional Arcs — Civil War Letters',
    '/viz-map-fullwar': 'A Map That Moves — Following the Hubbells',
    '/viz-map-moves': 'A Map That Moves — Following the Hubbells',
    '/viz-map-moves-v1': 'A Map That Moves — Following the Hubbells',
    '/viz-health-ledger': 'The Wellness Ledger — Physical Well-Being in the Civil War',
    '/viz-money-story': 'The Money Story — Wartime Finances',
    '/viz-people-web': 'The People Web — Connections Across 273 Letters',
    '/viz-what-they-didnt-know': "What They Didn't Know — Dramatic Irony",
    '/viz-what-they-wrote-about': 'What They Wrote About — Topic Landscape',
    '/viz-mothers-war': "A Mother's War — Frances Hubbell",
    '/the-collection': 'The Archive — Five Generations of Stewardship',
    '/the-unguarded-letter': 'The Unguarded Letter',
    '/their-own-words': 'In Their Own Words — 50 Questions Answered from the Letters',
    '/about': 'About — Hubbell Civil War Letters',
    '/faq': 'FAQ — Hubbell Civil War Letters',
    '/press': 'Press Kit — Hubbell Civil War Letters',
}

PAGE_CARDS = {
    '/': 'home',
    '/experience-v2/landing': 'home',
    '/hubbell-dashboard': 'parallel-lives',
    '/search': 'search',
    '/reader': 'reader',
    '/brother-henry': 'henry',
    '/brother-alexander': 'alexander',
    '/brother-james': 'james',
    '/brother-charles': 'charles',
    '/mother-frances': 'frances',
    '/who-they-were': 'who-they-were',
    '/viz-emotional-arcs': 'emotional-arcs',
    '/viz-emotional-arcs-v2': 'emotional-arcs',
    '/viz-map-fullwar': 'map',
    '/viz-map-moves': 'map',
    '/viz-map-moves-v1': 'map',
    '/viz-health-ledger': 'health-ledger',
    '/viz-money-story': 'money-story',
    '/viz-people-web': 'people-web',
    '/viz-what-they-didnt-know': 'what-they-didnt-know',
    '/viz-what-they-wrote-about': 'what-they-wrote-about',
    '/viz-mothers-war': 'frances',
    '/the-collection': 'collection',
    '/the-unguarded-letter': 'unguarded-letter',
    '/their-own-words': 'their-own-words',
    '/about': 'about',
    '/faq': 'faq',
    '/press': 'press',
}

MARKER_RE = re.compile(r'[ \t]*<!-- og:begin -->.*?<!-- og:end -->\s*\n?', re.S)
TITLE_RE = re.compile(r'<title>(.*?)</title>', re.S)

def esc(s):
    return htmlmod.escape(s, quote=True)

def block(path, title, desc, card):
    url = ORIGIN + ('' if path == '/' else path)
    img = f'{ORIGIN}/og/card-{card}.jpg'
    return f'''<!-- og:begin -->
<meta property="og:type" content="website">
<meta property="og:site_name" content="{esc(SITE_NAME)}">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:image" content="{img}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="{esc(title)}">
<meta property="og:url" content="{esc(url)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{esc(title)}">
<meta name="twitter:description" content="{esc(desc)}">
<meta name="twitter:image" content="{img}">
<!-- og:end -->
'''

def process(fp, path):
    with open(fp, encoding='utf-8') as f:
        src = f.read()
    if '</head>' not in src:
        print(f'  skip (no head): {os.path.relpath(fp, ROOT)}')
        return
    title = PAGE_TITLES.get(path)
    if not title:
        m = TITLE_RE.search(src)
        title = re.sub(r'\s+', ' ', m.group(1)).strip() if m else SITE_NAME
    card = PAGE_CARDS.get(path, 'default')
    out = MARKER_RE.sub('', src)
    b = block(path, title, DEFAULT_DESC, card)
    m = TITLE_RE.search(out)
    if m:
        out = out[:m.end()] + '\n' + b + out[m.end():]
    else:
        out = out.replace('</head>', b + '</head>', 1)
    if out != src:
        with open(fp, 'w', encoding='utf-8', newline='') as f:
            f.write(out)
        print(f'  ok: {os.path.relpath(fp, ROOT)}  [{card}]')
    else:
        print(f'  unchanged: {os.path.relpath(fp, ROOT)}')

def main():
    pages = [p for p in glob.glob(os.path.join(ROOT, '*.html'))
             if not os.path.basename(p).startswith('_')]
    pages.append(os.path.join(ROOT, 'experience-v2', 'landing.html'))
    for fp in sorted(pages):
        name = os.path.basename(fp)[:-5]
        path = '/experience-v2/landing' if name == 'landing' else '/' + name
        process(fp, path)

if __name__ == '__main__':
    main()
