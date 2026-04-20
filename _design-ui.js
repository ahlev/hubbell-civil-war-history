/* Hubbell Brothers — shared behavior: theme, tweaks, nav, search input, scroll reveals.
 * Persists user prefs (theme, density, typeface, accent) across pages in localStorage. */
(function () {
  var LS = 'hubbell.prefs.v1';
  var defaults = {
    theme: 'light',
    density: 'cozy',
    typeface: 'serif-body',
    accent: 'rust'
  };
  var accentMap = {
    rust:  { h: 24,  c: 0.13, l: 58 },
    moss:  { h: 150, c: 0.12, l: 54 },
    slate: { h: 240, c: 0.10, l: 56 },
    ink:   { h: 60,  c: 0.02, l: 38 }
  };

  function load() {
    try { return Object.assign({}, defaults, JSON.parse(localStorage.getItem(LS) || '{}')); }
    catch (e) { return Object.assign({}, defaults); }
  }
  function save(p) { try { localStorage.setItem(LS, JSON.stringify(p)); } catch (e) {} }

  var prefs = load();

  function applyPrefs() {
    var root = document.documentElement;
    root.setAttribute('data-theme', prefs.theme);
    root.setAttribute('data-density', prefs.density);
    root.setAttribute('data-typeface', prefs.typeface);
    var a = accentMap[prefs.accent] || accentMap.rust;
    root.style.setProperty('--accent-h', a.h);
    root.style.setProperty('--accent-c', a.c);
    var lift = prefs.theme === 'dark' ? 12 : 0;
    root.style.setProperty('--accent-l', (a.l + lift) + '%');
    window.dispatchEvent(new CustomEvent('hubbell:prefs', { detail: Object.assign({}, prefs) }));
  }

  function setPref(k, v) {
    prefs[k] = v;
    save(prefs);
    applyPrefs();
    renderTweakStates();
  }

  function renderNav() {
    var mount = document.getElementById('site-nav');
    if (!mount) return;
    var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    var links = [
      { href: 'index.html',                      label: 'Home' },
      { href: 'hubbell-dashboard.html',           label: 'Parallel Lives' },
      { href: 'viz-map-fullwar.html',             label: 'Map That Moves' },
      { href: 'viz-health-ledger.html',           label: 'Health Ledger' },
      { href: 'viz-money-story.html',             label: 'Money Story' },
      { href: 'viz-people-web.html',              label: 'People Web' },
      { href: 'who-they-were.html',               label: 'Who They Were' }
    ];
    var navHTML =
      '<nav class="site-nav" aria-label="Primary">' +
        '<div class="site-nav-inner">' +
          '<a href="index.html" class="site-brand" aria-label="Hubbell Brothers, home">' +
            'The Hubbell Brothers' +
            '<span class="dim">Civil War Letters &middot; 1861&ndash;1865</span>' +
          '</a>' +
          '<div class="nav-spacer"></div>' +
          '<div class="nav-links" role="menubar">' +
            links.map(function (l) {
              var active = (l.href.toLowerCase() === here) || (here === '' && l.href === 'index.html');
              return '<a role="menuitem" class="nav-link ' + (active ? 'active' : '') + '" href="' + l.href + '">' + l.label + '</a>';
            }).join('') +
          '</div>' +
          '<div class="search-wrap" id="navSearch">' +
            '<svg class="search-icon-nav" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">' +
              '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/>' +
            '</svg>' +
            '<input type="text" class="search-input-nav" id="searchInput" placeholder="Search 274 letters\u2026" autocomplete="off">' +
            '<div class="search-dropdown" id="searchDropdown"></div>' +
          '</div>' +
          '<button class="nav-tool" id="themeToggle" aria-label="Toggle light/dark">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
              '<circle cx="12" cy="12" r="4.5"/>' +
              '<path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>' +
            '</svg>' +
          '</button>' +
          '<button class="nav-tool" id="tweaksToggle" aria-label="Design tweaks">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
              '<circle cx="6" cy="7" r="2.2"/><path d="M6 2v2.8M6 9.2V22"/>' +
              '<circle cx="18" cy="17" r="2.2"/><path d="M18 2v12.8M18 19.2V22"/>' +
              '<circle cx="12" cy="12" r="2.2"/><path d="M12 2v7.8M12 14.2V22"/>' +
            '</svg>' +
          '</button>' +
          '<button class="nav-menu-btn" id="menuBtn" aria-label="Menu">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>' +
          '</button>' +
        '</div>' +
        '<div class="mobile-drawer" id="mobileDrawer">' +
          links.map(function (l) {
            var active = (l.href.toLowerCase() === here);
            return '<a class="nav-link ' + (active ? 'active' : '') + '" href="' + l.href + '">' + l.label + '</a>';
          }).join('') +
        '</div>' +
      '</nav>';
    mount.outerHTML = navHTML;
  }

  function renderTweaksPanel() {
    if (document.getElementById('tweaksPanel')) return;
    var panel = document.createElement('aside');
    panel.className = 'tweaks-panel';
    panel.id = 'tweaksPanel';
    panel.innerHTML =
      '<h4>Tweaks</h4>' +
      '<div class="tweak-row">' +
        '<div class="tweak-label">Theme</div>' +
        '<div class="tweak-segment" data-tweak="theme">' +
          '<button data-value="light">Paper</button>' +
          '<button data-value="dark">Ink</button>' +
        '</div>' +
      '</div>' +
      '<div class="tweak-row">' +
        '<div class="tweak-label">Accent</div>' +
        '<div class="tweak-colors" data-tweak="accent">' +
          '<div class="tweak-color" data-value="rust"  title="Rust"  style="background: oklch(60% 0.13 24);"></div>' +
          '<div class="tweak-color" data-value="moss"  title="Moss"  style="background: oklch(58% 0.12 150);"></div>' +
          '<div class="tweak-color" data-value="slate" title="Slate" style="background: oklch(58% 0.10 240);"></div>' +
          '<div class="tweak-color" data-value="ink"   title="Ink"   style="background: oklch(38% 0.02 60);"></div>' +
        '</div>' +
      '</div>' +
      '<div class="tweak-row">' +
        '<div class="tweak-label">Body type</div>' +
        '<div class="tweak-segment" data-tweak="typeface">' +
          '<button data-value="serif-body">Serif</button>' +
          '<button data-value="sans-body">Sans</button>' +
        '</div>' +
      '</div>' +
      '<div class="tweak-row">' +
        '<div class="tweak-label">Density</div>' +
        '<div class="tweak-segment" data-tweak="density">' +
          '<button data-value="compact">Compact</button>' +
          '<button data-value="cozy">Cozy</button>' +
          '<button data-value="spacious">Spacious</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(panel);

    panel.addEventListener('click', function (e) {
      var seg = e.target.closest('[data-tweak]');
      if (!seg) return;
      var btn = e.target.closest('[data-value]');
      if (!btn) return;
      setPref(seg.getAttribute('data-tweak'), btn.getAttribute('data-value'));
    });
  }

  function renderTweakStates() {
    var panel = document.getElementById('tweaksPanel');
    if (!panel) return;
    panel.querySelectorAll('[data-tweak]').forEach(function (seg) {
      var k = seg.getAttribute('data-tweak');
      var cur = prefs[k];
      seg.querySelectorAll('[data-value]').forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-value') === cur);
      });
    });
  }

  function wireToggles() {
    var theme = document.getElementById('themeToggle');
    if (theme) theme.addEventListener('click', function () { setPref('theme', prefs.theme === 'light' ? 'dark' : 'light'); });
    var tk = document.getElementById('tweaksToggle');
    if (tk) tk.addEventListener('click', function () {
      document.getElementById('tweaksPanel').classList.toggle('open');
    });
    var mb = document.getElementById('menuBtn');
    if (mb) mb.addEventListener('click', function () {
      document.getElementById('mobileDrawer').classList.toggle('open');
    });
  }

  function wireReveals() {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  }

  window.HubbellUI = { getPrefs: function () { return Object.assign({}, prefs); }, setPref: setPref };

  /* ─── Search: dynamic script loading + universal dropdown ─── */
  var _searchReady = false;
  var _searchLoading = false;

  function ensureSearchScripts(cb) {
    if (_searchReady) { cb(); return; }
    if (_searchLoading) {
      var check = setInterval(function () { if (_searchReady) { clearInterval(check); cb(); } }, 50);
      return;
    }
    // Already on a page that loaded these scripts?
    if (typeof search === 'function' && typeof LETTERS !== 'undefined') {
      _searchReady = true; cb(); return;
    }
    _searchLoading = true;
    var loaded = 0;
    var need = (typeof LETTERS === 'undefined') ? 2 : 1;
    function done() { loaded++; if (loaded >= need) { if (typeof buildIndex === 'function') buildIndex(); _searchReady = true; _searchLoading = false; cb(); } }
    if (typeof LETTERS === 'undefined') {
      var s1 = document.createElement('script'); s1.src = '_search-data.js'; s1.onload = done; document.head.appendChild(s1);
    }
    var s2 = document.createElement('script'); s2.src = '_search-engine.js'; s2.onload = done; document.head.appendChild(s2);
  }

  /* Curated suggestions */
  var SEARCH_SUGGESTIONS = [
    { label: 'Battle letters',       query: 'battle',         desc: 'Letters mentioning combat' },
    { label: 'Money & pay',          query: 'money',          desc: 'Pay, bounties, expenses' },
    { label: 'Illness & hospitals',  query: 'illness',        desc: 'Fever, scurvy, disease' },
    { label: 'Henry\u2019s letters', query: 'henry',          desc: '59 letters, 1861\u201362' },
    { label: 'Alexander\u2019s letters', query: 'alexander',  desc: '120 letters, 1861\u201365' },
    { label: 'Mother\u2019s letters',query: 'mother',         desc: '17 letters from Frances' },
    { label: 'Death & grief',        query: 'death',          desc: 'Loss, mourning, casualty lists' },
    { label: 'Antietam',             query: 'antietam',       desc: 'The bloodiest single day' },
    { label: 'Homesick',             query: 'homesick',       desc: 'Missing home and family' },
    { label: 'Letters from 1864',    query: '1864',           desc: 'The war\u2019s hardest year' }
  ];

  function renderSuggestions(dd) {
    var html = '<div class="search-suggestions">' +
      '<div class="ss-label">Try searching for</div>';
    SEARCH_SUGGESTIONS.forEach(function (s) {
      html += '<div class="ss-item" data-query="' + s.query + '">' +
        '<span class="ss-name">' + s.label + '</span>' +
        '<span class="ss-desc">' + s.desc + '</span>' +
      '</div>';
    });
    html += '</div>';
    dd.innerHTML = html;
    dd.classList.add('open');
    dd.querySelectorAll('.ss-item').forEach(function (el) {
      el.addEventListener('click', function () {
        var q = this.dataset.query;
        var si = document.getElementById('searchInput');
        si.value = q;
        dd.classList.remove('open');
        window.location.href = 'search.html?q=' + encodeURIComponent(q);
      });
    });
  }

  function renderSearchDropdown(query, dd) {
    ensureSearchScripts(function () {
      var results = search(query, { maxResults: 40 });
      // Apply minimum score threshold — filter noise
      results = results.filter(function (r) { return r.score >= 8; });

      if (results.length === 0) {
        dd.innerHTML = '<div class="search-empty">No results for \u201c' + esc(query) + '\u201d</div>';
        dd.classList.add('open');
        return;
      }

      var terms = query.toLowerCase().split(/\s+/).filter(function (t) { return t.length > 1; });
      var authorCounts = {};
      results.forEach(function (r) { authorCounts[r.letter.a] = (authorCounts[r.letter.a] || 0) + 1; });

      var html = '<div class="search-summary">';
      html += '<span>' + results.length + ' result' + (results.length !== 1 ? 's' : '') + '</span>';
      for (var a in authorCounts) {
        var color = AUTHOR_COLORS[a] || '#999';
        html += '<span class="author-count"><span class="dot" style="background:' + color + '"></span>' + (AUTHOR_NAMES[a] || a) + ': ' + authorCounts[a] + '</span>';
      }
      html += '</div>';

      // Show top 8 results flat (no grouping for dropdown — cleaner)
      var limit = Math.min(8, results.length);
      for (var i = 0; i < limit; i++) {
        var r = results[i];
        var l = r.letter;
        var clr = AUTHOR_COLORS[l.a] || '#999';
        var excerpt = findBestExcerpt(l.t, terms, 100);
        var highlighted = highlightTerms(excerpt, terms, 180);
        var badges = '';
        if (l.bat) badges += '<span class="sr-badge" style="background:#FCE4EC;color:#C62828">battle</span>';
        if (l.ill) badges += '<span class="sr-badge" style="background:#FFF3E0;color:#E65100">illness</span>';
        if (l.dth) badges += '<span class="sr-badge" style="background:#EFEBE9;color:#4E342E">death</span>';

        html += '<div class="search-result" data-lid="' + l.id + '">' +
          '<div class="sr-dot" style="background:' + clr + '"></div>' +
          '<div class="sr-body">' +
            '<div class="sr-meta"><strong>' + esc(l.an || AUTHOR_NAMES[l.a] || l.a) + '</strong> \u2014 ' + esc(l.d) + ', ' + esc(l.loc) + '</div>' +
            '<div class="sr-excerpt">' + highlighted + '</div>' +
            (badges ? '<div class="sr-badges">' + badges + '</div>' : '') +
          '</div></div>';
      }

      if (results.length > 8) {
        html += '<a href="search.html?q=' + encodeURIComponent(query) + '" style="display:block;padding:10px 16px;font-family:var(--font-mono);font-size:12px;color:var(--accent);text-align:center;text-decoration:none;border-top:1px solid var(--rule);letter-spacing:.04em">View all ' + results.length + ' results \u2192</a>';
      }

      dd.innerHTML = html;
      dd.classList.add('open');

      // Wire result clicks → navigate to search page with letter open
      dd.querySelectorAll('.search-result').forEach(function (el) {
        el.addEventListener('click', function () {
          var lid = this.dataset.lid;
          dd.classList.remove('open');
          // Use shared reader if available, else fall back to page reader
          if (window.HubbellReader && typeof LETTERS !== 'undefined') {
            HubbellReader.open(lid, { highlight: terms });
            return;
          }
          if (typeof openReader === 'function' && typeof LETTERS !== 'undefined') {
            var letter = LETTERS.find(function (ll) { return ll.id === lid; });
            if (letter) { openReader(letter, terms); return; }
          }
          window.location.href = 'search.html?q=' + encodeURIComponent(query) + '&letter=' + encodeURIComponent(lid);
        });
      });
    });
  }

  function wireSearch() {
    var si = document.getElementById('searchInput');
    var dd = document.getElementById('searchDropdown');
    if (!si || !dd) return;
    var ddTimeout = null;

    // On search.html the page's own script handles search — skip dropdown there
    var here = (location.pathname.split('/').pop() || '').toLowerCase();
    var isSearchPage = (here === 'search.html');

    si.addEventListener('input', function () {
      if (isSearchPage) return; // search.html handles its own dropdown
      clearTimeout(ddTimeout);
      var q = this.value.trim();
      if (q.length < 2) { dd.classList.remove('open'); return; }
      ddTimeout = setTimeout(function () { renderSearchDropdown(q, dd); }, 180);
    });

    si.addEventListener('focus', function () {
      if (isSearchPage) return;
      var q = this.value.trim();
      if (q.length >= 2) {
        renderSearchDropdown(q, dd);
      } else {
        // Show suggestions when empty
        renderSuggestions(dd);
      }
    });

    si.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && this.value.trim()) {
        e.preventDefault();
        dd.classList.remove('open');
        window.location.href = 'search.html?q=' + encodeURIComponent(this.value.trim());
      }
      if (e.key === 'Escape') {
        dd.classList.remove('open');
        si.blur();
      }
    });

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.search-wrap')) dd.classList.remove('open');
    });

    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        si.focus();
        si.select();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    applyPrefs();
    renderNav();
    renderTweaksPanel();
    renderTweakStates();
    wireToggles();
    wireSearch();
    wireReveals();
  });

  // Apply ASAP to avoid FOUC
  applyPrefs();
})();
