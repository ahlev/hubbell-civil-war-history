/* ─── Hubbell Overlay System ─── */
/* Provides cross-page person/place overlays with letter sub-reader */

(function () {
  'use strict';

  /* ── Constants ── */
  const AUTHOR_COLORS = {
    henry: '#2D5F8A', alexander: '#B8860B',
    james: '#4A7C59', charles: '#8B3A3A', mother: '#7B5EA7'
  };
  const CATEGORY_LABELS = { family: 'Family', military: 'Military', civilian: 'Civilian' };
  const DATE_MIN = new Date('1861-01-01');
  const DATE_MAX = new Date('1865-12-31');
  const MAX_STACK = 10;

  /* ── State ── */
  let backdrop = null;
  let panel = null;
  let overlayStack = [];
  let cachedLetters = null; // lazy-loaded transcriptions
  let fetchingLetters = false;
  // Optional external letter reader. When a host page registers one via
  // HubbellOverlay.setLetterOpener(fn), letters drilled into from a person/place
  // overlay hand off to fn instead of rendering the overlay's own sub-reader —
  // letting the map route every letter into the shared lamplit HubbellReader.
  let _externalLetterOpener = null;

  /* ── Helpers ── */
  function lookupPerson(name) {
    if (!window.OVERLAY_PEOPLE_LOOKUP || !window.OVERLAY_PEOPLE_PROFILES) return null;
    const idx = OVERLAY_PEOPLE_LOOKUP[name.trim().toLowerCase()];
    return idx !== undefined ? OVERLAY_PEOPLE_PROFILES[idx] : null;
  }

  function lookupPlace(name) {
    if (!window.OVERLAY_PLACES_LOOKUP || !window.OVERLAY_PLACES_PROFILES) return null;
    const idx = OVERLAY_PLACES_LOOKUP[name.trim().toLowerCase()];
    return idx !== undefined ? OVERLAY_PLACES_PROFILES[idx] : null;
  }

  function letterMeta(id) {
    return window.LETTER_INDEX ? LETTER_INDEX[id] : null;
  }

  // Full letter record (executive summary, people, places, event flags, full
  // transcription) from the shared LETTERS array. LETTER_INDEX only carries the
  // light {d,a,an,r,l,ss-teaser} fields, so the reader pulls the rest here.
  function fullLetter(id) {
    // getLettersGlobal() resolves LETTERS whether it's a window var OR a top-level
    // const (which never attaches to window) — matching HubbellReader.findLetter,
    // so the lamplit hand-off and the sub-reader's footer both see the same data.
    var arr = getLettersGlobal();
    if (!arr) return null;
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].id === id) return arr[i];
    }
    return null;
  }

  function fmtDate(d) {
    if (!d) return '';
    const parts = d.split('-');
    if (parts.length < 3) return d;
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months[parseInt(parts[1], 10) - 1] + ' ' + parseInt(parts[2], 10) + ', ' + parts[0];
  }

  function shortDate(d) {
    if (!d) return '';
    return d.slice(0, 10);
  }

  function esc(s) {
    const el = document.createElement('span');
    el.textContent = s;
    return el.innerHTML;
  }

  function dateFrac(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    return (d - DATE_MIN) / (DATE_MAX - DATE_MIN);
  }

  /* ── Ensure DOM containers ── */
  function ensureDOM() {
    if (backdrop) return;
    backdrop = document.createElement('div');
    backdrop.className = 'hubbell-overlay-backdrop';
    backdrop.addEventListener('click', closeOverlay);
    document.body.appendChild(backdrop);

    panel = document.createElement('div');
    panel.className = 'hubbell-overlay-panel';
    document.body.appendChild(panel);

    document.addEventListener('keydown', function (e) {
      if (!panel.classList.contains('visible')) return;
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeOverlay();
        return;
      }
      // Arrow keys for letter navigation when top-of-stack is a letter
      if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && overlayStack.length > 0) {
        var top = overlayStack[overlayStack.length - 1];
        if (top.type === 'letter') {
          e.preventDefault();
          _navigateOverlayLetter(e.key === 'ArrowLeft' ? -1 : 1);
        }
      }
    });
  }

  /* ── Open / Close ── */
  function openPanel(html, viewType) {
    ensureDOM();
    hideDotTooltip();
    if (window.hideTooltip) window.hideTooltip();
    // Per-view modifier (e.g. 'place') for view-specific theming, without
    // disturbing .visible (so the panel doesn't re-slide on every navigation).
    panel.classList.remove('hubbell-overlay-panel--person', 'hubbell-overlay-panel--place', 'hubbell-overlay-panel--letter');
    if (viewType) panel.classList.add('hubbell-overlay-panel--' + viewType);
    panel.innerHTML = html;
    // Force reflow before adding visible class for transition
    void panel.offsetWidth;
    backdrop.classList.add('visible');
    panel.classList.add('visible');
    document.body.style.overflow = 'hidden';

    // Bind internal links
    bindInternalLinks(panel);

    // Bind timeline dot hover interactions
    bindTimelineDots(panel);

    // Sync overlay param in URL
    _syncOverlayParam();
  }

  function closeOverlay() {
    if (!panel) return;
    hideDotTooltip();
    if (window.hideTooltip) window.hideTooltip();
    backdrop.classList.remove('visible');
    panel.classList.remove('visible');
    document.body.style.overflow = '';
    overlayStack = [];
    currentOverlayLetterId = null;
    currentLetterOpts = null;

    // Remove overlay param from URL
    if (window.HubbellDeepLink) HubbellDeepLink.remove('overlay');
  }

  /* ── Navigation Stack ── */
  function pushStack(type, key) {
    if (overlayStack.length >= MAX_STACK) overlayStack.shift();
    // Save scroll position of current view
    const body = panel ? panel.querySelector('.hubbell-overlay-body') : null;
    if (overlayStack.length > 0 && body) {
      overlayStack[overlayStack.length - 1].scrollPos = body.scrollTop;
    }
    overlayStack.push({ type, key, scrollPos: 0 });
  }

  function goBack() {
    if (overlayStack.length <= 1) {
      closeOverlay();
      return;
    }
    overlayStack.pop();
    const prev = overlayStack[overlayStack.length - 1];
    // Re-render without pushing to stack
    overlayStack.pop(); // will be re-pushed by show*
    if (prev.type === 'person') showPerson(prev.key);
    else if (prev.type === 'place') showPlace(prev.key);
    else if (prev.type === 'letter') showLetterReader(prev.key);
  }

  function headerActions() {
    const hasBack = overlayStack.length > 1;
    var share = (function() {
      if (!window.HubbellDeepLink) return '';
      var top = overlayStack[overlayStack.length - 1];
      if (top && top.type === 'letter') return HubbellDeepLink.letterShareBtn(top.key);
      return '';
    })();
    // Order: back, share, close \u2014 close (X) stays rightmost (the conventional
    // dismiss slot) and the icons read as one tidy cluster.
    return '<div class="hubbell-overlay-header-actions">' +
      (hasBack ? '<button class="hubbell-overlay-back" onclick="HubbellOverlay._back()" title="Back">\u2190</button>' : '') +
      share +
      '<button class="hubbell-overlay-close" onclick="HubbellOverlay._close()" title="Close">\u2715</button>' +
      '</div>';
  }

  /* ── Deep-Link: overlay param sync ── */
  function _syncOverlayParam() {
    if (!window.HubbellDeepLink) return;
    if (overlayStack.length === 0) return;
    var top = overlayStack[overlayStack.length - 1];
    HubbellDeepLink.set('overlay', top.type + ':' + top.key);
  }

  /* Apply ?overlay= on page load */
  function _applyOverlayParam() {
    if (!window.HubbellDeepLink) return;
    var p = HubbellDeepLink.read();
    if (!p.overlay) return;
    var parts = p.overlay.match(/^(person|place|letter):(.+)$/);
    if (!parts) return;
    var type = parts[1], key = parts[2];
    // Defer to allow page data to load
    setTimeout(function () {
      if (type === 'person') showPerson(key);
      else if (type === 'place') showPlace(key);
      else if (type === 'letter') showLetterReader(key);
    }, 400);
  }

  // Auto-apply on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _applyOverlayParam);
  } else {
    setTimeout(_applyOverlayParam, 100);
  }

  /* ── Mini Timeline SVG ── */
  function miniTimeline(letterIds) {
    const w = 380, h = 40, pad = 20;
    const innerW = w - pad * 2;
    let dots = '';
    for (const lid of letterIds) {
      const meta = letterMeta(lid);
      if (!meta) continue;
      const x = pad + dateFrac(meta.d) * innerW;
      const color = AUTHOR_COLORS[meta.a] || '#999';
      dots += '<circle cx="' + x.toFixed(1) + '" cy="20" r="4" fill="' + color +
        '" opacity="0.8" class="hubbell-overlay-tl-dot" data-letter-id="' + lid +
        '" style="cursor:pointer;transition:r 0.1s"/>';
    }
    return '<div class="hubbell-overlay-timeline">' +
      '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="xMidYMid meet">' +
      '<line x1="' + pad + '" y1="20" x2="' + (w - pad) + '" y2="20" stroke="#E8E4DF" stroke-width="1.5"/>' +
      '<text x="' + pad + '" y="36" font-size="9" fill="#9B9590" font-family="Inter,sans-serif">1861</text>' +
      '<text x="' + (w - pad) + '" y="36" font-size="9" fill="#9B9590" text-anchor="end" font-family="Inter,sans-serif">1865</text>' +
      dots +
      '</svg></div>';
  }

  /* ── Timeline dot + letter row hover: show summary tooltip ──
     Hover affordance is desktop-only. Skip binding on devices without a
     fine pointer so iOS Safari can't fire mouseenter on tap and leave a
     sticky dark tip behind the letter reader. Click handlers still bind. */
  function bindTimelineDots(container) {
    if (!container) return;
    var _hasFinePointer = window.matchMedia && window.matchMedia('(any-pointer: fine)').matches;
    // Timeline dots
    container.querySelectorAll('.hubbell-overlay-tl-dot').forEach(function (dot) {
      if (_hasFinePointer) {
        dot.addEventListener('mouseenter', function (e) {
          dot.setAttribute('r', '6');
          dot.setAttribute('opacity', '1');
          showDotTooltip(e, dot.getAttribute('data-letter-id'));
        });
        dot.addEventListener('mouseleave', function () {
          dot.setAttribute('r', '4');
          dot.setAttribute('opacity', '0.8');
          hideDotTooltip();
        });
      }
      dot.addEventListener('click', function () {
        hideDotTooltip();
        showLetterReader(dot.getAttribute('data-letter-id'));
      });
    });
    // Letter list rows
    container.querySelectorAll('.hubbell-overlay-letter-row[data-letter-id]').forEach(function (row) {
      if (!_hasFinePointer) return;
      row.addEventListener('mouseenter', function (e) {
        showDotTooltip(e, row.getAttribute('data-letter-id'));
      });
      row.addEventListener('mousemove', function (e) {
        if (dotTip && dotTip.style.display !== 'none') {
          var x = e.clientX + 12, y = e.clientY - 10;
          if (x + 300 > window.innerWidth) x = e.clientX - 310;
          dotTip.style.left = x + 'px';
          dotTip.style.top = y + 'px';
        }
      });
      row.addEventListener('mouseleave', function () {
        hideDotTooltip();
      });
    });
  }

  var dotTip = null;
  function showDotTooltip(e, lid) {
    var meta = letterMeta(lid);
    if (!meta) return;
    if (!dotTip) {
      dotTip = document.createElement('div');
      dotTip.className = 'hubbell-overlay-dot-tip';
      document.body.appendChild(dotTip);
    }
    var color = AUTHOR_COLORS[meta.a] || '#999';
    var summary = meta.ss ? '<div class="hubbell-overlay-dot-tip-summary">' + esc(meta.ss) + '</div>' : '';
    dotTip.innerHTML =
      '<div style="display:flex;align-items:center;gap:5px;margin-bottom:2px">' +
        '<span style="width:8px;height:8px;border-radius:50%;background:' + color + ';display:inline-block"></span>' +
        '<strong>' + fmtDate(meta.d) + '</strong>' +
      '</div>' +
      '<div style="font-size:0.72rem;opacity:0.7">' + esc(meta.an) + ' \u2192 ' + esc(meta.r) + '</div>' +
      summary;
    dotTip.style.display = 'block';
    var x = e.clientX + 12, y = e.clientY - 10;
    if (x + 300 > window.innerWidth) x = e.clientX - 310;
    dotTip.style.left = x + 'px';
    dotTip.style.top = y + 'px';
  }
  function hideDotTooltip() {
    if (dotTip) dotTip.style.display = 'none';
  }

  /* ── Letter List HTML ── */
  function letterListHTML(letterIds) {
    let html = '<ul class="hubbell-overlay-letters">';
    for (const lid of letterIds) {
      const meta = letterMeta(lid);
      if (!meta) continue;
      html += '<li class="hubbell-overlay-letter-row" data-letter-id="' + lid + '">' +
        '<span class="hubbell-overlay-letter-date">' + shortDate(meta.d) + '</span>' +
        '<span class="hubbell-overlay-letter-author" data-author="' + esc(meta.a) + '">' + esc(meta.an) + '</span>' +
        '<span class="hubbell-overlay-letter-detail">\u2192 ' + esc(meta.r) + (meta.l ? ' &middot; ' + esc(meta.l) : '') + '</span>' +
        '</li>';
    }
    html += '</ul>';
    return html;
  }

  // Family authors (incl. the mother) keyed precisely by profile id — used to
  // split a profile's letters into "written" vs "mentioned in".
  var _FAMILY_AUTHOR_KEY = {
    'PER-henry-hubbell': 'henry', 'PER-alexander-hubbell': 'alexander',
    'PER-james-hubbell': 'james', 'PER-charles-hubbell': 'charles',
    'PER-mother-alice': 'mother'
  };
  function _profileAuthorKey(person) { return (person && _FAMILY_AUTHOR_KEY[person.id]) || null; }

  /* ── Show Person Overlay ── */
  function showPerson(name) {
    const person = lookupPerson(name);
    if (!person) return false;

    pushStack('person', name);

    // Split the profile's letters into WRITTEN (authored by this person) and
    // MENTIONED IN (in someone else's letter). Non-authors are all "mentioned in".
    var _authorKey = _profileAuthorKey(person);
    var written = [], mentioned = [];
    (person.ltrs || []).forEach(function (id) {
      var m = letterMeta(id);
      if (_authorKey && m && m.a === _authorKey) written.push(id);
      else mentioned.push(id);
    });

    let rolesHtml = '';
    if (person.roles && person.roles.length > 0) {
      rolesHtml = '<div class="hubbell-overlay-section">' +
        '<div class="hubbell-overlay-section-title">From the letters</div>' +
        '<ul class="hubbell-overlay-roles">' +
        person.roles.map(r => '<li>' + esc(r) + '</li>').join('') +
        '</ul></div>';
    }

    const dateRange = person.first && person.last
      ? fmtDate(person.first) + ' \u2013 ' + fmtDate(person.last)
      : '';

    const html =
      '<div class="hubbell-overlay-header">' +
        '<div class="hubbell-overlay-header-left">' +
          '<h2 class="hubbell-overlay-title">' + esc(person.n) +
            '<span class="hubbell-overlay-badge ' + person.cat + '">' + (CATEGORY_LABELS[person.cat] || person.cat) + '</span>' +
          '</h2>' +
          '<div class="hubbell-overlay-subtitle">' +
            (person.rel ? esc(person.rel) : '') +
          '</div>' +
        '</div>' +
        '<a class="hubbell-overlay-nav-btn hubbell-overlay-nav-btn--header ' + person.cat + '" href="viz-people-web?person=' + encodeURIComponent(person.n) + '">' +
          'View in People Web <span class="arrow">\u2192</span>' +
        '</a>' +
        headerActions() +
      '</div>' +
      '<div class="hubbell-overlay-body">' +
        '<div class="hubbell-overlay-section">' +
          '<div class="hubbell-overlay-stats">' +
            (written.length ? '<span><span class="hubbell-overlay-stat-value">' + written.length + '</span> written</span>' : '') +
            (mentioned.length ? '<span><span class="hubbell-overlay-stat-value">' + mentioned.length + '</span> mentioned in</span>' : '') +
            (dateRange ? '<span>' + dateRange + '</span>' : '') +
          '</div>' +
        '</div>' +
        (person.s ? '<div class="hubbell-overlay-section"><p class="hubbell-overlay-summary">' +
          '<span class="hubbell-overlay-summary-text">' + esc(person.s) + '</span>' +
          (person.s.length > 150 ? '<button class="hubbell-overlay-expand-btn" onclick="var t=this.previousElementSibling;var ex=t.classList.toggle(\'expanded\');this.textContent=ex?\'Show less\':\'Read more\u2026\'">Read more\u2026</button>' : '') +
        '</p></div>' : '') +
        rolesHtml +
        (person.ltrs.length > 0 ? '<div class="hubbell-overlay-section">' +
          '<div class="hubbell-overlay-section-title">Timeline</div>' +
          miniTimeline(person.ltrs) +
        '</div>' : '') +
        (written.length ? '<div class="hubbell-overlay-section">' +
          '<div class="hubbell-overlay-section-title">Written (' + written.length + ')</div>' +
          letterListHTML(written) +
        '</div>' : '') +
        (mentioned.length ? '<div class="hubbell-overlay-section">' +
          '<div class="hubbell-overlay-section-title">Mentioned in (' + mentioned.length + ')</div>' +
          letterListHTML(mentioned) +
        '</div>' : '') +
      '</div>';

    openPanel(html);
    return true;
  }

  /* ── Show Place Overlay ── */
  function showPlace(name) {
    const place = lookupPlace(name);
    if (!place) return false;

    // On the map page, navigate directly instead of opening place overlay
    if (window._mapNavigateToPlace && place.co && place.co.lat != null) {
      closeOverlay();
      if (window.HubbellReader && HubbellReader.isOpen()) HubbellReader.close();
      window._mapNavigateToPlace(place);
      return true;
    }

    pushStack('place', name);

    const coordStr = place.co && place.co.lat != null
      ? place.co.lat.toFixed(2) + '\u00B0N, ' + Math.abs(place.co.lon).toFixed(2) + '\u00B0W'
      : '';

    const firstDate = place.ltrs.length > 0 ? (letterMeta(place.ltrs[0]) || {}).d || '' : '';

    const stateRedundant = place.st && place.n.toLowerCase().includes(place.st.toLowerCase());
    const showSt = place.st && !stateRedundant && place.st.length < 30;

    const html =
      '<div class="hubbell-overlay-header">' +
        '<div class="hubbell-overlay-header-left">' +
          '<h2 class="hubbell-overlay-title">' + esc(place.n) +
            '<span class="hubbell-overlay-badge place">Place</span>' +
          '</h2>' +
          '<div class="hubbell-overlay-subtitle">' +
            (showSt ? esc(place.st) : '') +
            (coordStr ? (showSt ? ' &middot; ' : '') + '<span class="hubbell-overlay-coords">' + coordStr + '</span>' : '') +
          '</div>' +
        '</div>' +
        (place.co && place.co.lat != null ?
          '<a class="hubbell-overlay-nav-btn hubbell-overlay-nav-btn--header place" href="viz-map-fullwar?date=' + encodeURIComponent(firstDate) + '&place=' + encodeURIComponent(place.n) + '&lat=' + place.co.lat + '&lon=' + place.co.lon + '">' +
            'View on Map <span class="arrow">\u2192</span>' +
          '</a>' : '') +
        headerActions() +
      '</div>' +
      '<div class="hubbell-overlay-body">' +
        '<div class="hubbell-overlay-section">' +
          '<div class="hubbell-overlay-stats">' +
            '<span>Referenced in <span class="hubbell-overlay-stat-value">' + place.lc + '</span> letters</span>' +
          '</div>' +
        '</div>' +
        (place.s ? '<div class="hubbell-overlay-section"><p class="hubbell-overlay-summary">' +
          '<span class="hubbell-overlay-summary-text">' + esc(place.s) + '</span>' +
          (place.s.length > 150 ? '<button class="hubbell-overlay-expand-btn" onclick="var t=this.previousElementSibling;var ex=t.classList.toggle(\'expanded\');this.textContent=ex?\'Show less\':\'Read more\u2026\'">Read more\u2026</button>' : '') +
        '</p></div>' : '') +
        (place.ltrs.length > 0 ? '<div class="hubbell-overlay-section">' +
          '<div class="hubbell-overlay-section-title">When &amp; Who</div>' +
          miniTimeline(place.ltrs) +
        '</div>' : '') +
        '<div class="hubbell-overlay-section">' +
          '<div class="hubbell-overlay-section-title">Letters (' + place.lc + ')</div>' +
          letterListHTML(place.ltrs) +
        '</div>' +
      '</div>';

    openPanel(html, 'place');
    return true;
  }

  /* ── Person pill helper ── */
  function personPill(displayName, color) {
    var person = lookupPerson(displayName);
    // If direct lookup fails, try the portion before parenthetical
    if (!person && displayName.indexOf('(') > 1) {
      person = lookupPerson(displayName.replace(/\s*\(.*$/, '').trim());
    }
    var bg = color || (person && person.cat === 'family' ? '#2D5F8A' : '#6B6560');
    if (person) {
      return '<span class="hubbell-overlay-person-pill" data-person-name="' + esc(person.n) + '" ' +
        'style="--pill-color:' + bg + '">' + esc(displayName) + '</span>';
    }
    return '<span class="hubbell-overlay-person-pill hubbell-overlay-person-pill--inert" ' +
      'style="--pill-color:' + bg + '">' + esc(displayName) + '</span>';
  }

  /* ── Letter Sub-Reader ── */
  var currentLetterOpts = null;
  var currentOverlayLetterId = null;

  // The person/place this letter was drilled into FROM — the nearest non-letter
  // frame still on the overlay stack. Used to grey that name in the letter body
  // so a reference preview lands the eye on its mention even when no quote/excerpt
  // was passed. Returns null when the reader was opened standalone.
  function _currentReference() {
    for (var i = overlayStack.length - 1; i >= 0; i--) {
      var e = overlayStack[i];
      if (e && (e.type === 'person' || e.type === 'place')) return { name: e.key, type: e.type };
    }
    return null;
  }
  function _currentReferenceName() {
    var r = _currentReference();
    return r ? r.name : null;
  }

  function showLetterReader(letterId, opts) {
    var meta = letterMeta(letterId);
    if (!meta) return;

    // Hand off to the host page's reader when one is registered (e.g. the map's
    // lamplit HubbellReader). The overlay panel is dismissed first so the richer
    // reader takes the stage — exactly like clicking a letter card in the map's
    // docked info-panel. The originating person/place (still on top of the stack,
    // since we return before pushStack) rides along so its name can be greyed.
    if (_externalLetterOpener && !(opts && opts.forceInternal)) {
      var ref = _currentReference();
      var handoff = {
        excerpt: opts && opts.excerpt,
        health: opts && opts.health,
        referenceName: ref ? ref.name : null,
        referenceType: ref ? ref.type : null
      };
      closeOverlay();
      _externalLetterOpener(letterId, handoff);
      return;
    }

    // Built-in default: with no custom opener, prefer the shared lamplit reader
    // (HubbellReader) whenever the host page loads it AND has this letter's data —
    // so person/place drilling opens the same up-to-date reader site-wide without
    // per-page wiring. Two carve-outs stay on the built-in sub-reader below:
    //   • the Wellness Ledger's medical view (opts.health) — a purpose-built flow;
    //   • pages without HubbellReader / without the letter loaded (no regression).
    if (!(opts && opts.forceInternal) && !(opts && opts.health) &&
        window.HubbellReader && window.HubbellReader.open && fullLetter(letterId)) {
      var ref2 = _currentReference();
      var ropts = { letter: fullLetter(letterId) };
      if (opts && opts.excerpt) ropts.excerpt = opts.excerpt;
      if (ref2) {
        if (ref2.type === 'place') ropts.placeHighlight = ref2.name;
        else ropts.personHighlight = ref2.name;
      }
      closeOverlay();
      window.HubbellReader.open(letterId, ropts);
      return;
    }

    pushStack('letter', letterId);
    currentLetterOpts = opts || null;
    currentOverlayLetterId = letterId;

    // Apply initial nav mode if caller specified
    if (opts && opts.initialNavMode && window.HubbellLetterNav) {
      HubbellLetterNav.setMode(opts.initialNavMode);
    }

    _renderLetterReader(letterId, opts);
  }

  function _renderLetterReader(letterId, opts) {
    var meta = letterMeta(letterId);
    if (!meta) return;

    var healthCtx = (opts && opts.health) ? opts.health : null;

    // Build subtitle line
    var subtitleParts = fmtDate(meta.d);
    if (meta.l) subtitleParts += ' &middot; ' + esc(meta.l);

    // Health status badge in subtitle
    var subtitleExtra = '';
    if (healthCtx && healthCtx.status && healthCtx.status !== 'nodata') {
      subtitleExtra = ' <span class="hubbell-overlay-health-status" style="background:' +
        esc(healthCtx.statusColor || '#D0D0D0') + '">' +
        esc(healthCtx.statusLabel || healthCtx.status) + '</span>';
    }

    var authorColor = AUTHOR_COLORS[meta.a] || '#6B6560';
    var fromPill = personPill(meta.an, authorColor);
    var toPill = personPill(meta.r, null);

    // Compact "View on Map" \u2014 a small inline pill that rides on the date/loc
    // line instead of claiming its own column, so the header stays uncrowded.
    var mapBtn = '<a class="hubbell-overlay-maplink" ' +
      'href="viz-map-fullwar?date=' + encodeURIComponent(meta.d) +
      '&brother=' + encodeURIComponent(meta.a) +
      '&letter=' + encodeURIComponent(letterId) + '">' +
      '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>' +
      ' Map</a>';

    // Header: From\u2192To title + a single meta line (date \u00b7 loc \u00b7 Map pill); the
    // back/share/close icons are pinned top-right by CSS so nothing competes for
    // the cramped top edge.
    var headerHtml =
      '<div class="hubbell-overlay-header hubbell-overlay-letterhead">' +
        headerActions() +
        '<div class="hubbell-overlay-header-left">' +
          '<h2 class="hubbell-overlay-title">' +
            '<span class="hubbell-overlay-pill-label">From</span>' + fromPill +
            '<span class="hubbell-overlay-pill-label">To</span>' + toPill +
          '</h2>' +
          '<div class="hubbell-overlay-subtitle">' +
            '<span class="hubbell-overlay-subtitle-meta">' + subtitleParts + subtitleExtra + '</span>' +
            mapBtn +
          '</div>' +
        '</div>' +
      '</div>';

    // Nav bar (prev / author toggle / next) — now lives in the FROZEN bottom
    // panel, beneath the people/places it shares that panel with, so the controls
    // stay put while the letter scrolls.
    var navBarHtml = _buildOverlayNavBar(letterId);

    openPanel(
      headerHtml +
      '<div class="hubbell-overlay-body"><div class="hubbell-overlay-loading">Loading letter</div></div>' +
      '<div class="hubbell-overlay-footer" id="overlayFooter">' +
        '<div class="hubbell-overlay-footer-flags" id="overlayFooterFlags"></div>' +
        '<div class="hubbell-overlay-footer-meta" id="overlayFooterMeta"></div>' +
        navBarHtml +
      '</div>'
    );

    // Wire nav bar events
    _bindOverlayNav(letterId);

    // Load transcription
    loadTranscription(letterId, function (text) {
      var body = panel.querySelector('.hubbell-overlay-body');
      if (!body) return;

      if (!text) {
        body.innerHTML = '<div class="hubbell-overlay-reader-fallback">' +
          'Transcription not available.<br>' +
          '<a href="index.html">Read on Parallel Lives \u2192</a>' +
          '</div>';
        return;
      }

      // Build health context section if provided
      var healthHtml = '';
      if (healthCtx) {
        healthHtml = buildHealthSection(healthCtx);
      }

      // Strip the redundant date/location header at the top of the transcription
      // (parity with the modal reader, which never shows the "Sept. 21st, 1864 /
      // In the field… / Dear Mother" block since the header rail already carries
      // the date, From and To).
      var srcText = (window.HubbellReader && HubbellReader.stripLetterHeader)
        ? HubbellReader.stripLetterHeader(text) : text;

      // Reference anchor — grey the passage / name that invited the click, exactly
      // like the modal reader. A teased quote (opts.excerpt) greys via run match →
      // sentence fallback; otherwise the person/place this letter was opened FROM
      // greys its verbatim name mentions. Sentinels go in pre-split, survive esc().
      var R = window.HubbellReader || null;
      var anchorHealthOwns = !!(healthCtx && healthCtx.sentences);
      var _anc = { active: false };
      if (R && R.wrapExcerptSentinels && opts && opts.excerpt && !anchorHealthOwns) {
        _anc = R.wrapExcerptSentinels(srcText, opts.excerpt);
        srcText = _anc.text;
      }

      // Format: collapse single \n to space, \n\n = paragraph break
      var paragraphs = srcText.split(/\n\n+/);
      var formatted;

      if (healthCtx && healthCtx.sentences) {
        // Apply health sentence highlighting
        formatted = paragraphs
          .map(function (p) {
            return '<p>' + highlightHealthSentences(p.replace(/\n/g, ' ').trim(), healthCtx.sentences) + '</p>';
          })
          .filter(function (p) { return p !== '<p></p>'; })
          .join('');
      } else {
        formatted = paragraphs
          .map(function (p) { return '<p>' + esc(p.replace(/\n/g, ' ').trim()) + '</p>'; })
          .filter(function (p) { return p !== '<p></p>'; })
          .join('');
        // Tint flag-category keywords (Battle/Wound/Illness/Death) in the body,
        // exactly like the modal reader, so the two surfaces read 1:1.
        var _lfFlags = fullLetter(letterId);
        if (_lfFlags && R && R.wrapFlagCategoryTerms) {
          var activeFlags = [];
          if (_lfFlags.bat) activeFlags.push('battle');
          if (_lfFlags.ill) activeFlags.push('illness');
          if (_lfFlags.dth) activeFlags.push('death');
          if (_lfFlags.wnd) activeFlags.push('wound');
          if (activeFlags.length) formatted = R.wrapFlagCategoryTerms(formatted, activeFlags);
        }
      }

      // Turn excerpt sentinels into grey <mark>s; or, when opened from a person /
      // place rather than a quote, grey that name's mentions — so a reference
      // preview always lands the eye on its context (parity with the modal).
      if (_anc.active && R && R.swapAnchorSentinels) {
        formatted = R.swapAnchorSentinels(formatted);
      } else if (R && R.wrapTermAnchors && !anchorHealthOwns) {
        var _refName = (opts && (opts.personHighlight || opts.placeHighlight)) || _currentReferenceName();
        if (_refName) formatted = R.wrapTermAnchors(formatted, [_refName]);
      }

      body.innerHTML = healthHtml + '<div class="hubbell-overlay-reader-body">' + formatted + '</div>';

      // Editorial context — pulled from the full LETTERS record. The exec
      // summary orients the reader ABOVE the parchment; people / places / event
      // tags sit BELOW it as a reference footer, mirroring the v2 reader's set
      // of fields while keeping the letter itself the hero. All inserted via
      // insertAdjacentHTML around the parchment (values escaped through esc()).
      var rb = body.querySelector('.hubbell-overlay-reader-body');
      var lf = fullLetter(letterId);
      if (lf && rb) {
        if (lf.ss) {
          rb.insertAdjacentHTML('beforebegin',
            '<div class="hubbell-overlay-exec">' + esc(lf.ss) + '</div>');
        }
        // "Health context:" — the medical-historian clinical read (Wellness Ledger
        // only; present when the caller passes opts.health.healthContext). Distinct
        // teal voice with a medical-pulse icon; never replaces the editor's summary.
        var _ohc = (currentLetterOpts && currentLetterOpts.health && currentLetterOpts.health.healthContext) ? currentLetterOpts.health.healthContext : '';
        if (_ohc) {
          rb.insertAdjacentHTML('beforebegin',
            '<div class="hubbell-overlay-health-context">' +
              '<div class="ohc-eyebrow">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h4l2 5 4-12 2 7h6"/></svg>' +
                'Health context' +
              '</div>' + esc(_ohc) +
            '</div>');
        }
        // Event flags as clickable FILTERS (1:1 with the modal reader): each pill
        // toggles its category's body highlighting on/off. data-flag drives the
        // handler wired after insertion.
        var flagTags = '';
        var _fp = function (on, key, label) {
          return on ? '<span class="hubbell-overlay-flagtag ' + key + '" data-flag="' + key +
            '" role="button" tabindex="0" title="Toggle ' + key + ' highlighting">' + label + '</span>' : '';
        };
        flagTags += _fp(lf.bat, 'battle', 'Battle');
        flagTags += _fp(lf.ill, 'illness', 'Illness');
        flagTags += _fp(lf.dth, 'death', 'Death');
        flagTags += _fp(lf.wnd, 'wound', 'Wound');
        var pplTags = (lf.ppl || []).map(function (p) {
          return '<a class="hubbell-overlay-tag person" href="viz-people-web?person=' +
            encodeURIComponent(p) + '">' + esc(p) + '</a>';
        }).join('');
        var plcTags = (lf.plc || []).map(function (p) {
          return '<a class="hubbell-overlay-tag place" href="viz-map-fullwar?date=' +
            encodeURIComponent(meta.d) + '&brother=' + encodeURIComponent(meta.a) +
            '&place=' + encodeURIComponent(p) + '">' + esc(p) + '</a>';
        }).join('');
        var metaGroup = function (title, tags) {
          return tags ? '<div class="hubbell-overlay-meta-group">' +
            '<div class="hubbell-overlay-meta-title">' + title + '</div>' +
            '<div class="hubbell-overlay-tags">' + tags + '</div></div>' : '';
        };
        // Event flags become the TOP ROW of the frozen bottom panel — labeled
        // ("Highlight in letter") and clickable exactly like the modal reader's
        // flag cluster. Each pill toggles its category's parchment highlighting,
        // even though it now lives in the footer (the handler holds a ref to rb).
        var footFlags = panel.querySelector('#overlayFooterFlags');
        if (footFlags && flagTags) {
          footFlags.innerHTML = metaGroup('Highlight in letter', flagTags);
          footFlags.querySelectorAll('.hubbell-overlay-flagtag[data-flag]').forEach(function (pill) {
            var toggle = function (e) {
              e.preventDefault(); e.stopPropagation();
              var f = pill.getAttribute('data-flag');
              var off = pill.classList.toggle('flag-off');
              rb.classList.toggle('hide-' + f, off);
            };
            pill.addEventListener('click', toggle);
            pill.addEventListener('keydown', function (e) {
              if (e.key === 'Enter' || e.key === ' ') toggle(e);
            });
          });
        }
        // People / Places Mentioned sit below the flags in the frozen bottom panel
        // (above the nav controls), always visible without scrolling to the
        // letter's end. Rendered into the #overlayFooterMeta slot from openPanel().
        var footMeta = panel.querySelector('#overlayFooterMeta');
        if (footMeta) {
          footMeta.innerHTML = metaGroup('People Mentioned', pplTags) +
                               metaGroup('Places Mentioned', plcTags);
        }
      }

      // Corpus "you are here" strip — the same timeline the modal reader shows,
      // now in every reader. Sits at the top of the body (below the header's
      // date/location, above the editor's summary). Taps jump WITHIN the
      // infopanel via showLetterReader, not the modal reader.
      if (window.HubbellReader && HubbellReader.buildContextStrip) {
        var stripHtml = HubbellReader.buildContextStrip(letterId);
        if (stripHtml) {
          body.insertAdjacentHTML('afterbegin', stripHtml);
          var stripEl = body.querySelector('.reader-context-strip');
          if (stripEl && HubbellReader.bindContextStrip) {
            HubbellReader.bindContextStrip(stripEl, function (id) { showLetterReader(id); });
          }
        }
      }

      autoLinkProse(rb);
      bindInternalLinks(body);
      // Scroll to top of letter content
      body.scrollTop = 0;
    });
  }

  function _buildOverlayNavBar(letterId) {
    var Nav = window.HubbellLetterNav;
    if (!Nav) return '';

    var mode = Nav.getMode();
    var authorName = Nav.getAuthorName(letterId);
    var authorColor = Nav.getAuthorColor(letterId);
    var prevId = Nav.findAdjacent(letterId, -1);
    var nextId = Nav.findAdjacent(letterId, 1);

    return '<div class="overlay-letter-nav" id="overlayLetterNav">' +
      '<button class="reader-nav-arrow" id="overlayNavPrev"' + (prevId ? '' : ' disabled') + '>\u2190</button>' +
      '<div class="reader-nav-mode" id="overlayNavMode">' +
        '<button class="reader-nav-mode-btn' + (mode === 'author' ? ' active' : '') + '" data-mode="author">' +
          '<span class="nav-author-dot" style="background:' + authorColor + '"></span> ' +
          (authorName ? authorName + '\u2019s Letters' : 'Author\u2019s Letters') +
        '</button>' +
        '<button class="reader-nav-mode-btn' + (mode === 'date' ? ' active' : '') + '" data-mode="date">All Letters</button>' +
      '</div>' +
      '<button class="reader-nav-arrow" id="overlayNavNext"' + (nextId ? '' : ' disabled') + '>\u2192</button>' +
    '</div>';
  }

  function _bindOverlayNav(letterId) {
    var Nav = window.HubbellLetterNav;
    if (!Nav || !panel) return;

    var prevBtn = panel.querySelector('#overlayNavPrev');
    var nextBtn = panel.querySelector('#overlayNavNext');
    var modeWrap = panel.querySelector('#overlayNavMode');

    if (prevBtn) prevBtn.addEventListener('click', function () { _navigateOverlayLetter(-1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { _navigateOverlayLetter(1); });
    if (modeWrap) modeWrap.addEventListener('click', function (e) {
      var btn = e.target.closest('.reader-nav-mode-btn');
      if (!btn || !btn.dataset.mode) return;
      Nav.setMode(btn.dataset.mode);
      _updateOverlayNavBar();
    });
  }

  function _navigateOverlayLetter(dir) {
    var Nav = window.HubbellLetterNav;
    if (!Nav || !currentOverlayLetterId) return;
    var nextId = Nav.findAdjacent(currentOverlayLetterId, dir);
    if (!nextId) return;

    // Lateral navigation: replace top of stack
    if (overlayStack.length > 0) {
      overlayStack[overlayStack.length - 1] = { type: 'letter', key: nextId, scrollPos: 0 };
    }
    currentOverlayLetterId = nextId;
    // Strip stale health context when navigating to a different letter
    var navOpts = currentLetterOpts ? {} : null;
    if (currentLetterOpts) {
      for (var k in currentLetterOpts) {
        if (k !== 'health') navOpts[k] = currentLetterOpts[k];
      }
    }
    _renderLetterReader(nextId, navOpts);
    _syncOverlayParam();
  }

  function _updateOverlayNavBar() {
    var Nav = window.HubbellLetterNav;
    if (!Nav || !panel || !currentOverlayLetterId) return;

    var mode = Nav.getMode();
    var authorName = Nav.getAuthorName(currentOverlayLetterId);
    var authorColor = Nav.getAuthorColor(currentOverlayLetterId);
    var prevId = Nav.findAdjacent(currentOverlayLetterId, -1);
    var nextId = Nav.findAdjacent(currentOverlayLetterId, 1);

    var prevBtn = panel.querySelector('#overlayNavPrev');
    var nextBtn = panel.querySelector('#overlayNavNext');
    if (prevBtn) prevBtn.disabled = !prevId;
    if (nextBtn) nextBtn.disabled = !nextId;

    var btns = panel.querySelectorAll('#overlayNavMode .reader-nav-mode-btn');
    btns.forEach(function (b) { b.classList.toggle('active', b.dataset.mode === mode); });

    var authorBtn = panel.querySelector('#overlayNavMode [data-mode="author"]');
    if (authorBtn) {
      authorBtn.innerHTML = '<span class="nav-author-dot" style="background:' + authorColor + '"></span> ' +
        (authorName ? authorName + '\u2019s Letters' : 'Author\u2019s Letters');
    }
  }

  /* ── Health Context Rendering ── */
  function buildHealthSection(ctx) {
    var html = '<div class="hubbell-overlay-health">';

    // Flags row
    var flags = [];
    if (ctx.ill) flags.push('<span class="hubbell-overlay-hflag illness">Illness flagged</span>');
    if (ctx.wnd) flags.push('<span class="hubbell-overlay-hflag wound">Wound flagged</span>');
    if (ctx.dth) flags.push('<span class="hubbell-overlay-hflag death">Death mentioned</span>');
    if (ctx.bat) flags.push('<span class="hubbell-overlay-hflag battle">Battle</span>');
    if (flags.length) {
      html += '<div class="hubbell-overlay-hflags">' + flags.join('') + '</div>';
    }

    // Evidence confidence
    if (ctx.confidence && ctx.confidence !== 'nodata') {
      html += '<div class="hubbell-overlay-hconf">' +
        '<span class="hubbell-overlay-hconf-label" style="border-color:' + esc(ctx.confColor || '#9B9B9B') +
        ';color:' + esc(ctx.confColor || '#9B9B9B') + '">' + esc(ctx.confLabel || ctx.confidence) + '</span>' +
        (ctx.confExplanation ? '<span class="hubbell-overlay-hconf-desc">' + esc(ctx.confExplanation) + '</span>' : '') +
        '</div>';
    }

    // Detected symptom keywords
    if (ctx.symptoms && ctx.symptoms.length) {
      html += '<div class="hubbell-overlay-hsymptoms">' +
        ctx.symptoms.map(function (s) { return '<span class="hubbell-overlay-hsymptom">' + esc(s) + '</span>'; }).join('') +
        '</div>';
    }

    html += '</div>';
    return html;
  }

  function highlightHealthSentences(text, sentences) {
    if (!sentences) return esc(text);
    // Split into sentences preserving delimiters
    var parts = text.split(/(?<=[.!?])\s+/);
    var result = [];
    for (var i = 0; i < parts.length; i++) {
      var sent = parts[i];
      var key = sent.trim().replace(/[.!?]+$/, '').substring(0, 40);
      var cls = null;
      if (sentences.hospital && sentences.hospital.has(key)) cls = 'hl-hospital';
      else if (sentences.wound && sentences.wound.has(key)) cls = 'hl-hospital';
      else if (sentences.sick && sentences.sick.has(key)) cls = 'hl-sick';
      else if (sentences.healthy && sentences.healthy.has(key)) cls = 'hl-healthy';
      if (cls) {
        result.push('<span class="hubbell-overlay-' + cls + '">' + esc(sent) + '</span>');
      } else {
        result.push(esc(sent));
      }
    }
    return result.join(' ');
  }

  /* ── Transcription Loader ── */
  function getLettersGlobal() {
    // Handle both var and const declarations (const doesn't attach to window)
    try { return typeof LETTERS !== 'undefined' && Array.isArray(LETTERS) ? LETTERS : null; }
    catch (e) { return null; }
  }

  function loadTranscription(letterId, callback) {
    // Try LETTERS global first (from _search-data.js)
    var lettersArr = getLettersGlobal();
    if (lettersArr) {
      var found = lettersArr.find(function (l) {
        return l.id === letterId;
      });
      if (found && found.t) {
        callback(found.t);
        return;
      }
      if (found && found.transcription) {
        callback(found.transcription);
        return;
      }
    }

    // Try cached
    if (cachedLetters) {
      const found = cachedLetters.find(function (l) { return l.id === letterId; });
      callback(found ? (found.transcription || '') : null);
      return;
    }

    // Fetch all-letters.json (once)
    if (fetchingLetters) {
      // Wait and retry
      setTimeout(function () { loadTranscription(letterId, callback); }, 200);
      return;
    }

    fetchingLetters = true;
    fetch('03-data/all-letters.json')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        cachedLetters = data;
        fetchingLetters = false;
        var found = data.find(function (l) { return l.id === letterId; });
        callback(found ? (found.transcription || '') : null);
      })
      .catch(function () {
        fetchingLetters = false;
        callback(null);
      });
  }

  /* ── Bind Internal Links ── */
  function bindInternalLinks(container) {
    // Bind letter rows
    container.querySelectorAll('.hubbell-overlay-letter-row[data-letter-id]').forEach(function (row) {
      row.addEventListener('click', function (e) {
        e.preventDefault();
        showLetterReader(row.dataset.letterId);
      });
    });

    // Bind any .hubbell-link elements
    container.querySelectorAll('.hubbell-link[data-overlay-type]').forEach(function (el) {
      if (el._overlayBound) return;
      el._overlayBound = true;
      el.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (el.dataset.overlayType === 'person') showPerson(el.dataset.overlayKey);
        else if (el.dataset.overlayType === 'place') showPlace(el.dataset.overlayKey);
      });
    });

    // Bind person pills (clickable name chips in reader header)
    container.querySelectorAll('.hubbell-overlay-person-pill[data-person-name]').forEach(function (el) {
      if (el._overlayBound) return;
      el._overlayBound = true;
      el.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        showPerson(el.dataset.personName);
      });
    });
  }

  /* ── Auto-Link Prose Text ── */
  function autoLinkProse(selectorOrEl) {
    if (!window.OVERLAY_PEOPLE_LOOKUP || !window.OVERLAY_PLACES_LOOKUP) return;

    var containers;
    if (typeof selectorOrEl === 'string') {
      containers = document.querySelectorAll(selectorOrEl);
    } else if (selectorOrEl && selectorOrEl.nodeType === 1) {
      containers = [selectorOrEl];
    } else {
      return;
    }
    if (!containers.length) return;

    // Build sorted variant list (longest first to avoid partial matches)
    // Filter: skip annotations, metadata strings, and overly short/long names
    const variants = [];
    var skipRe = /--|`|possibly|unknown|unclear|inferred|false|misread|\bthe\b.*\bof\b/i;
    // Skip common English words that happen to be place/person variants
    var skipWords = { home: 1, hospital: 1, camp: 1, ford: 1, church: 1, mill: 1, point: 1 };
    // Skip places that can't meaningfully center on a map or display useful info:
    // states, countries, metadata entries, and "Near X" descriptors
    var placeSkipRe = /^(error|unknown|uncertain|anticipated|pursued|near |two miles|us-canadian|frances|farm near|river near)/i;
    var stateNames = { texas:1, mississippi:1, maryland:1, louisiana:1, georgia:1, kentucky:1,
      illinois:1, indiana:1, vermont:1, massachusetts:1, virginia:1, tennessee:1, canada:1,
      'new york':1, ohio:1, 'south carolina':1, 'north carolina':1, connecticut:1, michigan:1 };
    for (var key in OVERLAY_PEOPLE_LOOKUP) {
      if (key.length >= 4 && key.length <= 50 && !skipRe.test(key) && !skipWords[key]) {
        variants.push({ text: key, type: 'person' });
      }
    }
    for (var key in OVERLAY_PLACES_LOOKUP) {
      if (key.length >= 4 && key.length <= 50 && !skipRe.test(key) && !skipWords[key]) {
        // Skip state/country names and metadata place entries
        if (stateNames[key]) continue;
        var placeProfile = OVERLAY_PLACES_PROFILES[OVERLAY_PLACES_LOOKUP[key]];
        if (placeProfile && placeSkipRe.test(placeProfile.n)) continue;
        variants.push({ text: key, type: 'place' });
      }
    }
    variants.sort(function (a, b) { return b.text.length - a.text.length; });

    // Build regex from variants (escape special chars)
    const escaped = variants.map(function (v) {
      return v.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    });
    if (!escaped.length) return;

    const regex = new RegExp('\\b(' + escaped.join('|') + ')\\b', 'gi');

    // Build quick type lookup
    const typeLookup = {};
    variants.forEach(function (v) { typeLookup[v.text] = v.type; });

    const skipTags = { A: 1, BUTTON: 1, SCRIPT: 1, STYLE: 1, INPUT: 1, TEXTAREA: 1 };

    containers.forEach(function (container) {
      const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
      const textNodes = [];
      let node;
      while ((node = walker.nextNode())) {
        // Skip if inside a skip tag or already linked
        let parent = node.parentElement;
        let skip = false;
        while (parent && parent !== container) {
          if (skipTags[parent.tagName] || parent.classList.contains('hubbell-link')) {
            skip = true;
            break;
          }
          parent = parent.parentElement;
        }
        if (!skip && node.textContent.trim().length > 0) {
          textNodes.push(node);
        }
      }

      textNodes.forEach(function (textNode) {
        const text = textNode.textContent;
        regex.lastIndex = 0;
        const matches = [];
        let match;
        while ((match = regex.exec(text)) !== null) {
          const key = match[1].toLowerCase();
          matches.push({
            index: match.index,
            length: match[1].length,
            original: match[1],
            type: typeLookup[key] || 'person',
            key: key
          });
        }

        if (matches.length === 0) return;

        // Build replacement fragment
        const frag = document.createDocumentFragment();
        let lastIdx = 0;
        matches.forEach(function (m) {
          if (m.index > lastIdx) {
            frag.appendChild(document.createTextNode(text.slice(lastIdx, m.index)));
          }
          const span = document.createElement('span');
          span.className = 'hubbell-link';
          span.dataset.overlayType = m.type;
          span.dataset.overlayKey = m.key;
          span.textContent = m.original;
          span.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (m.type === 'person') showPerson(m.key);
            else showPlace(m.key);
          });
          frag.appendChild(span);
          lastIdx = m.index + m.length;
        });
        if (lastIdx < text.length) {
          frag.appendChild(document.createTextNode(text.slice(lastIdx)));
        }
        textNode.parentNode.replaceChild(frag, textNode);
      });
    });
  }

  /* ── Tag Binding ── */
  function bindTags(root) {
    root = root || document;
    // .reader-tag.person
    root.querySelectorAll('.reader-tag.person').forEach(function (el) {
      if (el._overlayBound) return;
      const name = el.textContent.trim();
      if (!lookupPerson(name)) return;
      el._overlayBound = true;
      el.style.cursor = 'pointer';
      el.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        showPerson(name);
      });
    });

    // .reader-tag.place
    root.querySelectorAll('.reader-tag.place').forEach(function (el) {
      if (el._overlayBound) return;
      const name = el.textContent.trim();
      if (!lookupPlace(name)) return;
      el._overlayBound = true;
      el.style.cursor = 'pointer';
      el.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        showPlace(name);
      });
    });

    // .people-chip
    root.querySelectorAll('.people-chip').forEach(function (el) {
      if (el._overlayBound) return;
      // Get name from chip text (may have count badge)
      const nameEl = el.querySelector('.chip-name') || el;
      const name = nameEl.textContent.trim();
      if (!lookupPerson(name)) return;
      el._overlayBound = true;
      el.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        showPerson(name);
      });
    });

    // [data-person-name]
    root.querySelectorAll('[data-person-name]').forEach(function (el) {
      if (el._overlayBound) return;
      const name = el.dataset.personName;
      if (!lookupPerson(name)) return;
      el._overlayBound = true;
      el.style.cursor = 'pointer';
      el.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        showPerson(name);
      });
    });
  }

  /* ── Location Binding ── */
  function bindLocations(root) {
    root = root || document;
    var selectors = '.detail-location, .dp-location, .letter-location, .reader-meta .loc, .info-meta .loc, .lr-loc';
    root.querySelectorAll(selectors).forEach(function (el) {
      if (el._overlayBound) return;
      const text = el.textContent.trim();
      if (!text || !lookupPlace(text)) return;
      el._overlayBound = true;
      el.style.cursor = 'pointer';
      el.style.textDecoration = 'underline';
      el.style.textDecorationColor = '#C0B8B0';
      el.style.textUnderlineOffset = '2px';
      el.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        showPlace(text);
      });
    });
  }

  /* ── Public API ── */
  window.HubbellOverlay = {
    showPerson: showPerson,
    showPlace: showPlace,
    showLetter: showLetterReader,
    showHealthLetter: function (id, healthCtx) { showLetterReader(id, { health: healthCtx }); },
    close: closeOverlay,

    // Register an external letter reader. Pass a fn(letterId, ctx) to route
    // letters (opened from a person/place overlay) to it instead of the overlay's
    // built-in sub-reader; ctx = {excerpt, health, referenceName, referenceType}.
    // Pass null to restore the built-in reader.
    setLetterOpener: function (fn) { _externalLetterOpener = (typeof fn === 'function') ? fn : null; },

    bindPage: function (options) {
      options = options || {};
      if (options.tags !== false) bindTags();
      if (options.locations !== false) bindLocations();
      if (options.prose) autoLinkProse(options.prose);
    },

    // Bind overlay links within a dynamically-rendered container
    bindDynamic: function (container) {
      if (!container) return;
      bindTags(container);
      bindLocations(container);
    },

    // Internal callbacks for onclick attributes
    _close: closeOverlay,
    _back: goBack
  };

})();
