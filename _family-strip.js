/* ============================================================
   BIO KIN STRIP — "read another life" portrait carousel.
   Renders the portrait row at the bottom of each bio, pulling
   the reader into the next portrait / bio experience.

   Rules (per user spec):
     • Order LEFT→RIGHT by letters written, most → fewest.
     • The mother (Frances) is ALWAYS pinned last when shown.
     • The currently-active person (host[data-active]) is omitted.
       When the mother's page is active she is simply absent, so
       the strip shows the four brothers by letter count.

   Roles are character-based (NOT age-based): brother birth order
   is under review, so this surface asserts nothing about who was
   youngest/eldest — the descriptor is role + uncontested count.

   Markup safety: every card is assembled from the trusted static
   KIN array below (no user input); dynamic values pass through
   esc(). We clear + insertAdjacentHTML rather than assign
   innerHTML, mirroring who-they-were.html's setHTML() pattern.
   ============================================================ */
(function () {
  var KIN = [
    { id: 'alexander', name: 'Alexander', role: 'The survivor',    letters: 120, poster: 'window-alexander-fav.webp', href: 'who-they-were.html#alexander' },
    { id: 'charles',   name: 'Charles',   role: 'The clear-eyed',  letters: 69,  poster: 'window-charles-v1.webp',   href: 'who-they-were.html#charles' },
    { id: 'henry',     name: 'Henry',     role: 'First to enlist', letters: 59,  poster: 'window-henry-v1.webp',     href: 'who-they-were.html#henry' },
    { id: 'james',     name: 'James',     role: 'The scholar',     letters: 9,   poster: 'window-james-v2-wide.webp', href: 'who-they-were.html#james' },
    { id: 'mother',    name: 'Frances',   role: 'The mother',      letters: 17,  poster: 'window-frances.webp',       href: 'who-they-were.html#mother', isMother: true }
  ];
  var BASE = '/experience-v2/assets/brothers/web/';

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function cardHTML(p) {
    var meta = p.role + ' · ' + p.letters + ' letters';
    return '<a class="kin-card" href="' + esc(p.href) + '" style="--kc:var(--' + esc(p.id) + ')"' +
           ' aria-label="Read ' + esc(p.name) + '’s story">' +
           '<div class="kin-portrait"><img loading="lazy" src="' + esc(BASE + p.poster) + '"' +
           ' alt="Portrait of ' + esc(p.name) + ' Hubbell"></div>' +
           '<div class="kin-name">' + esc(p.name) + '</div>' +
           '<div class="kin-role">' + esc(meta) + '</div>' +
           '</a>';
  }

  function build() {
    var host = document.querySelector('.bio-kin');
    if (!host) return;
    var row = host.querySelector('.bio-kin-row');
    if (!row) return;
    var active = host.getAttribute('data-active') || '';

    var list = KIN.filter(function (p) { return p.id !== active; });
    list.sort(function (a, b) {
      if (a.isMother) return 1;   // mother always last
      if (b.isMother) return -1;
      return b.letters - a.letters; // most letters first
    });

    row.textContent = '';
    row.insertAdjacentHTML('beforeend', list.map(cardHTML).join(''));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }

  // Exposed so the canonical bio view (who-they-were.html stage) can rebuild
  // the strip each time it re-renders a person.
  window.HubbellFamilyStrip = { build: build };
})();
