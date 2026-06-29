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
  }

  function renderNav() {
    var mount = document.getElementById('site-nav');
    if (!mount) return;
    var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    // Canonical link set = the v2 landing navbar's six (same labels, targets and
    // per-section accent hues, in the same order) so the bar persists 1:1 across
    // the whole site. Home is reachable via the brand logo; Money Story lives in
    // the body nav, not this bar. The search field is retained for findability.
    var links = [
      { href: 'the-collection.html',              label: 'The Collection', acc: '#CE8A46' },
      { href: 'hubbell-dashboard.html',           label: 'Parallel Lives', acc: '#3E86C4' },
      { href: 'viz-map-fullwar.html',             label: 'Map That Moves', acc: '#52A86E' },
      { href: 'viz-health-ledger.html',           label: 'Wellness Ledger',acc: '#CB5C5C' },
      { href: 'viz-people-web.html',              label: 'People Web',     acc: '#9A78C7' },
      { href: 'who-they-were.html',               label: 'Who They Were',  acc: '#6FB0A6' }
    ];
    var navHTML =
      '<nav class="site-nav" aria-label="Primary">' +
        '<div class="site-nav-inner">' +
          '<a href="index.html" class="site-brand" aria-label="Hubbell Brothers, home">' +
            '<svg class="site-brand-logo" viewBox="0 0 100 100" width="20" height="20" aria-hidden="true">' +
              '<circle cx="32" cy="32" r="15" fill="#2D5F8A"/>' +
              '<circle cx="68" cy="32" r="15" fill="#B8860B"/>' +
              '<circle cx="32" cy="68" r="15" fill="#4A7C59"/>' +
              '<circle cx="68" cy="68" r="15" fill="#8B3A3A"/>' +
            '</svg>' +
            '<span class="site-brand-text">The Hubbell Brothers' +
              '<span class="dim">Civil War Letters &middot; 1861&ndash;1865</span>' +
            '</span>' +
          '</a>' +
          // Search sits centrally between the brand and the links; the links are
          // pinned to the right edge (CSS), so they never shift as the search
          // field is focused/resized.
          '<div class="search-wrap" id="navSearch">' +
            '<svg class="search-icon-nav" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">' +
              '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/>' +
            '</svg>' +
            '<input type="text" class="search-input-nav" id="searchInput" placeholder="Search 273 letters\u2026" autocomplete="off" aria-label="Search the letter collection">' +
            '<div class="search-dropdown" id="searchDropdown"></div>' +
          '</div>' +
          '<div class="nav-links" role="menubar">' +
            links.map(function (l) {
              var active = (l.href.toLowerCase() === here) || (here === '' && l.href === 'index.html');
              return '<a role="menuitem" class="nav-link ' + (active ? 'active' : '') + '" style="--acc:' + l.acc + '" href="' + l.href + '">' + l.label + '</a>';
            }).join('') +
          '</div>' +
          '<button class="nav-menu-btn" id="menuBtn" aria-label="Menu">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>' +
          '</button>' +
        '</div>' +
        '<div class="mobile-drawer" id="mobileDrawer">' +
          '<div class="mobile-drawer-search">' +
            '<svg class="search-icon-nav" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">' +
              '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/>' +
            '</svg>' +
            '<input type="text" class="search-input-nav" id="searchInputMobile" placeholder="Search 273 letters\u2026" autocomplete="off" aria-label="Search the letter collection">' +
            '<div class="search-dropdown" id="searchDropdownMobile"></div>' +
          '</div>' +
          links.map(function (l) {
            var active = (l.href.toLowerCase() === here);
            return '<a class="nav-link ' + (active ? 'active' : '') + '" style="--acc:' + l.acc + '" href="' + l.href + '">' + l.label + '</a>';
          }).join('') +
        '</div>' +
      '</nav>';
    mount.outerHTML = navHTML;
  }

  function wireToggles() {
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

  function renderSuggestions(dd, linkedInput) {
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
        if (linkedInput) linkedInput.value = q;
        dd.classList.remove('open');
        window.location.href = 'search?q=' + encodeURIComponent(q);
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
        html += '<a href="search?q=' + encodeURIComponent(query) + '" style="display:block;padding:10px 16px;font-family:var(--font-mono);font-size:12px;color:var(--accent);text-align:center;text-decoration:none;border-top:1px solid var(--rule);letter-spacing:.04em">View all ' + results.length + ' results \u2192</a>';
      }

      dd.innerHTML = html;
      dd.classList.add('open');

      // Wire result hover tooltips + clicks
      dd.querySelectorAll('.search-result').forEach(function (el) {
        el.addEventListener('mouseenter', function (e) { _showNavTooltip(e, this.dataset.lid); });
        el.addEventListener('mousemove', function (e) { _moveNavTooltip(e); });
        el.addEventListener('mouseleave', _hideNavTooltip);
        el.addEventListener('click', function () {
          _hideNavTooltip();
          var lid = this.dataset.lid;
          dd.classList.remove('open');
          // Use shared reader if available, else fall back to page reader
          if (window.HubbellReader && typeof LETTERS !== 'undefined') {
            HubbellReader.open(lid, { highlight: terms, scrollToMatch: true });
            return;
          }
          if (typeof openReader === 'function' && typeof LETTERS !== 'undefined') {
            var letter = LETTERS.find(function (ll) { return ll.id === lid; });
            if (letter) { openReader(letter, terms); return; }
          }
          window.location.href = 'search?q=' + encodeURIComponent(query) + '&letter=' + encodeURIComponent(lid);
        });
      });
    });
  }

  /* ── Nav search hover tooltip (suppressed on touch) ── */
  var _navTip = null;
  var _navIsTouch = false;
  window.addEventListener('touchstart', function () { _navIsTouch = true; }, { once: true });
  function _ensureNavTip() {
    if (_navTip) return;
    _navTip = document.createElement('div');
    _navTip.style.cssText = 'position:fixed;z-index:100000;pointer-events:none;opacity:0;transition:opacity .15s;max-width:320px;padding:10px 12px;background:var(--bg-elev,#fff);border:1px solid var(--rule,#e0e0e0);border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.12);font-family:var(--font-sans,Inter,system-ui,sans-serif)';
    document.body.appendChild(_navTip);
  }
  function _showNavTooltip(e, lid) {
    if (_navIsTouch) return;
    if (typeof LETTERS === 'undefined') return;
    var letter = LETTERS.find(function (l) { return l.id === lid; });
    if (!letter || !letter.ss) return;
    _ensureNavTip();
    var color = (window.AUTHOR_COLORS || {})[letter.a] || '#999';
    var name = (window.AUTHOR_NAMES || {})[letter.a] || letter.an || letter.a;
    var summary = letter.ss.replace(/\*\*/g, '');
    var sents = summary.match(/[^.!?]+[.!?]+/g);
    if (sents && sents.length > 2) summary = sents.slice(0, 2).join('').trim();
    if (summary.length > 200) summary = summary.slice(0, 197) + '...';
    _navTip.innerHTML =
      '<div style="font-size:0.74rem;font-weight:600;color:' + color + ';margin-bottom:2px">' + esc(name) + ' \u2192 ' + esc(letter.r) + '</div>' +
      '<div style="font-size:0.68rem;color:var(--ink-2,#777);margin-bottom:6px">' + esc(letter.d) + ' \u00b7 ' + esc(letter.loc) + '</div>' +
      '<div style="font-size:0.76rem;color:var(--ink,#333);line-height:1.45;font-style:italic">' + esc(summary) + '</div>';
    _moveNavTooltip(e);
    _navTip.style.opacity = '1';
  }
  function _moveNavTooltip(e) {
    if (!_navTip) return;
    var x = e.clientX + 16, y = e.clientY - 10;
    var r = _navTip.getBoundingClientRect();
    if (x + r.width > window.innerWidth - 12) x = e.clientX - r.width - 12;
    if (y + r.height > window.innerHeight - 12) y = e.clientY - r.height - 8;
    if (y < 8) y = 8;
    _navTip.style.left = x + 'px';
    _navTip.style.top = y + 'px';
  }
  function _hideNavTooltip() {
    if (_navTip) _navTip.style.opacity = '0';
  }

  function _wireOneSearch(si, dd) {
    if (!si || !dd) return;
    var ddTimeout = null;
    var here = (location.pathname.split('/').pop() || '').toLowerCase();
    var isSearchPage = (here === 'search.html');

    si.addEventListener('input', function () {
      if (isSearchPage) return;
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
        renderSuggestions(dd, si);
      }
    });

    si.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && this.value.trim()) {
        e.preventDefault();
        dd.classList.remove('open');
        window.location.href = 'search?q=' + encodeURIComponent(this.value.trim());
      }
      if (e.key === 'Escape') {
        dd.classList.remove('open');
        si.blur();
      }
    });
  }

  function wireSearch() {
    // Desktop search
    _wireOneSearch(
      document.getElementById('searchInput'),
      document.getElementById('searchDropdown')
    );
    // Mobile drawer search
    _wireOneSearch(
      document.getElementById('searchInputMobile'),
      document.getElementById('searchDropdownMobile')
    );

    // Close any open dropdown when clicking outside
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.search-wrap') && !e.target.closest('.mobile-drawer-search')) {
        var dd = document.getElementById('searchDropdown');
        var ddm = document.getElementById('searchDropdownMobile');
        if (dd) dd.classList.remove('open');
        if (ddm) ddm.classList.remove('open');
      }
    });

    // Ctrl+K focuses desktop search
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        var si = document.getElementById('searchInput');
        if (si) { si.focus(); si.select(); }
      }
    });
  }

  var LOGO_SVG_MINI = '<svg class="hubbell-logo-mini" viewBox="0 0 100 100" width="14" height="14" aria-hidden="true">' +
    '<circle cx="32" cy="32" r="15" fill="#2D5F8A"/>' +
    '<circle cx="68" cy="32" r="15" fill="#B8860B"/>' +
    '<circle cx="32" cy="68" r="15" fill="#4A7C59"/>' +
    '<circle cx="68" cy="68" r="15" fill="#8B3A3A"/>' +
    '</svg>';

  function brandPageTitles() {
    var h1 = document.querySelector('h1');
    if (!h1) return;
    // Skip if already branded
    if (h1.querySelector('.hubbell-logo-mini')) return;
    h1.insertAdjacentHTML('beforeend', ' ' + LOGO_SVG_MINI);
  }

  /* ── Global letter hover tooltip ── */
  var AUTHOR_COLORS = {
    henry: '#2D5F8A', alexander: '#B8860B',
    james: '#4A7C59', charles: '#8B3A3A', mother: '#7B5EA7'
  };
  var AUTHOR_NAMES = {
    henry: 'Henry', alexander: 'Alexander',
    james: 'James', charles: 'Charles', mother: 'Mother'
  };
  var _ltip = null;
  var _ltipActive = null;

  function _fmtDate(d) {
    if (!d) return '';
    var p = d.split('-');
    if (p.length < 3) return d;
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months[parseInt(p[1], 10) - 1] + ' ' + parseInt(p[2], 10) + ', ' + p[0];
  }
  function _esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  // Resolve a letter's hover metadata. Prefers LETTER_INDEX (rich, on overlay
  // pages); falls back to the global LETTERS array (loaded everywhere via
  // _search-data.js) so the hover tip also works on pages that don't ship the
  // heavier overlay data — e.g. the bio pages' letter drawers. LETTERS uses
  // `loc` where LETTER_INDEX uses `l`, so we adapt the one field that differs.
  var _ltMap = null;
  function _letterMeta(lid) {
    if (window.LETTER_INDEX && LETTER_INDEX[lid]) return LETTER_INDEX[lid];
    if (typeof LETTERS === 'undefined') return null;
    if (!_ltMap) {
      _ltMap = {};
      LETTERS.forEach(function (l) { if (l && l.id) _ltMap[l.id] = l; });
    }
    var l = _ltMap[lid];
    if (!l) return null;
    return { d: l.d, a: l.a, an: l.an, r: l.r, l: l.loc, ss: l.ss };
  }

  function _showLetterTip(e, lid) {
    var meta = _letterMeta(lid);
    if (!meta) return;
    if (!_ltip) {
      _ltip = document.createElement('div');
      _ltip.className = 'hubbell-letter-tip';
      document.body.appendChild(_ltip);
    }
    var color = AUTHOR_COLORS[meta.a] || '#999';
    var dot = '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + color + ';margin-right:4px;vertical-align:middle"></span>';
    var summary = meta.ss ? '<div class="hubbell-letter-tip-summary">' + _esc(meta.ss) + '</div>' : '';
    var loc = meta.l ? '<div class="hubbell-letter-tip-loc">' + _esc(meta.l) + '</div>' : '';
    _ltip.innerHTML =
      '<div class="hubbell-letter-tip-date">' + dot + _fmtDate(meta.d) + '</div>' +
      '<div class="hubbell-letter-tip-author">' + _esc(meta.an || '') + ' \u2192 ' + _esc(meta.r || '') + '</div>' +
      loc + summary;
    _ltip.style.display = 'block';
    _posLetterTip(e);
  }
  function _posLetterTip(e) {
    if (!_ltip) return;
    var x = e.clientX + 14, y = e.clientY - 10;
    if (x + 340 > window.innerWidth) x = e.clientX - 354;
    if (y + _ltip.offsetHeight > window.innerHeight) y = window.innerHeight - _ltip.offsetHeight - 8;
    if (y < 4) y = 4;
    _ltip.style.left = x + 'px';
    _ltip.style.top = y + 'px';
  }
  function _hideLetterTip() {
    if (_ltip) _ltip.style.display = 'none';
    _ltipActive = null;
  }

  function _getLetterIdFromEl(el) {
    // Walk up to 3 levels to find a letter ID attribute
    for (var i = 0; i < 4 && el; i++, el = el.parentElement) {
      var lid = el.getAttribute('data-letter-id') || el.getAttribute('data-lid');
      if (lid) return lid;
    }
    return null;
  }

  function wireLetterTooltips() {
    if (!window.LETTER_INDEX && typeof LETTERS === 'undefined') return;
    // Hover preview is a desktop affordance only — gate on a fine pointer
    // (mouse/trackpad/stylus) so it never flashes on phones/tablets where a
    // tap would otherwise fire mouseover. Mirrors the Map That Moves tip.
    var finePointer = !window.matchMedia || window.matchMedia('(any-pointer: fine)').matches;
    if (!finePointer) return;
    // Use event delegation on body for maximum coverage (including dynamically rendered content)
    document.body.addEventListener('mouseover', function (e) {
      var lid = _getLetterIdFromEl(e.target);
      if (!lid) return;
      // Don't override page-specific tooltips on SVG circles (dashboard, health ledger, money story)
      if (e.target.tagName === 'circle' && e.target.hasAttribute('onmouseenter')) return;
      // Don't double-up with the overlay panel's own tooltip system
      if (e.target.closest && e.target.closest('.hubbell-overlay-panel')) return;
      if (_ltipActive === lid) return;
      _ltipActive = lid;
      _showLetterTip(e, lid);
    });
    document.body.addEventListener('mousemove', function (e) {
      if (_ltipActive) _posLetterTip(e);
    });
    document.body.addEventListener('mouseout', function (e) {
      if (!_ltipActive) return;
      var lid = _getLetterIdFromEl(e.target);
      if (lid === _ltipActive) _hideLetterTip();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    applyPrefs();
    renderNav();
    wireToggles();
    wireSearch();
    wireReveals();
    brandPageTitles();
    wireLetterTooltips();
  });

  // Apply ASAP to avoid FOUC
  applyPrefs();
})();
