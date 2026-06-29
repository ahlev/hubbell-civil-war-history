"""Cache-bust the shared _bio.css: href="_bio.css" -> href="_bio.css?v=1" on
every page that links it (per CLAUDE.md cache-busting rule). Asserts exactly one
link per file; skips a file already bumped."""
import io, sys

ROOT = r"C:\Users\ahlev\OneDrive\Documents\Claude\Projects\Hubbell Civil War Ancestry"
PAGES = ["brother-charles.html", "brother-henry.html", "brother-alexander.html",
         "brother-james.html", "mother-frances.html", "who-they-were.html"]
OLD = 'href="_bio.css"'
NEW = 'href="_bio.css?v=1"'

for page in PAGES:
    path = f"{ROOT}\\{page}"
    with io.open(path, "r", encoding="utf-8") as f:
        html = f.read()
    if NEW in html:
        print(f"{page:26s} already bumped — skip")
        continue
    n = html.count(OLD)
    if n != 1:
        sys.exit(f"ABORT {page}: found {n} link tags (expected 1)")
    html = html.replace(OLD, NEW, 1)
    with io.open(path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"{page:26s} bumped -> _bio.css?v=1")
print("done")
