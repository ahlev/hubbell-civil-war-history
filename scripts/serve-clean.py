"""Local dev server that emulates Vercel's cleanUrls + root rewrite.

The production site runs on Vercel with `cleanUrls: true` and a rewrite of
`/` -> `/hubbell-dashboard.html` (see vercel.json). Plain `python -m http.server`
does NOT strip `.html`, so internal links like `viz-people-web?person=X`
404 locally even though they work in production. This server reproduces the
production routing so links can be reviewed faithfully on localhost.

Usage:  python scripts/serve-clean.py [port]   (default 8731)
"""
import http.server
import socketserver
import os
import sys
import urllib.parse

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8731


class CleanUrlsHandler(http.server.SimpleHTTPRequestHandler):
    def _resolve(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        suffix = ('?' + parsed.query) if parsed.query else ''

        # Root rewrite -> dashboard (matches vercel.json rewrites)
        if path == '/':
            self.path = '/hubbell-dashboard.html' + suffix
            return

        # cleanUrls: a request with no file extension that doesn't exist on
        # disk should serve the matching `.html` (query string preserved).
        fs_path = self.translate_path(path)
        if not os.path.exists(fs_path) and not os.path.splitext(path)[1]:
            if os.path.exists(fs_path + '.html'):
                self.path = path + '.html' + suffix

    def end_headers(self):
        # Dev server: never let the browser cache. Without this, an edited
        # CSS/JS file can be served stale from the browser cache during review.
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_GET(self):
        self._resolve()
        super().do_GET()

    def do_HEAD(self):
        self._resolve()
        super().do_HEAD()


# Threaded server: a single-threaded TCPServer hangs the whole port when one
# client (e.g. a browser/Playwright) holds a keep-alive connection open or a
# large file is mid-transfer. ThreadingHTTPServer serves each request on its
# own daemon thread so the port stays responsive.
class ThreadingCleanUrls(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


with ThreadingCleanUrls(("127.0.0.1", PORT), CleanUrlsHandler) as httpd:
    print(f"Serving (cleanUrls emulation) on http://127.0.0.1:{PORT}")
    httpd.serve_forever()
