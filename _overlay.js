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
  function openPanel(html) {
    ensureDOM();
    hideDotTooltip();
    if (window.hideTooltip) window.hideTooltip();
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
    return '<div class="hubbell-overlay-header-actions">' +
      (hasBack ? '<button class="hubbell-overlay-back" onclick="HubbellOverlay._back()" title="Back">\u2190</button>' : '') +
      '<button class="hubbell-overlay-close" onclick="HubbellOverlay._close()" title="Close">\u2715</button>' +
      (function() {
        if (!window.HubbellDeepLink) return '';
        var top = overlayStack[overlayStack.length - 1];
        if (top && top.type === 'letter') return HubbellDeepLink.letterShareBtn(top.key);
        return '';
      })() +
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

  /* ── Timeline dot + letter row hover: show summary tooltip ── */
  function bindTimelineDots(container) {
    if (!container) return;
    // Timeline dots
    container.querySelectorAll('.hubbell-overlay-tl-dot').forEach(function (dot) {
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
      dot.addEventListener('click', function () {
        showLetterReader(dot.getAttribute('data-letter-id'));
      });
    });
    // Letter list rows
    container.querySelectorAll('.hubbell-overlay-letter-row[data-letter-id]').forEach(function (row) {
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

  /* ── Show Person Overlay ── */
  function showPerson(name) {
    const person = lookupPerson(name);
    if (!person) return false;

    pushStack('person', name);

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
        '<a class="hubbell-overlay-nav-btn hubbell-overlay-nav-btn--header ' + person.cat + '" href="viz-people-web.html?person=' + encodeURIComponent(person.n) + '">' +
          'View in People Web <span class="arrow">\u2192</span>' +
        '</a>' +
        headerActions() +
      '</div>' +
      '<div class="hubbell-overlay-body">' +
        '<div class="hubbell-overlay-section">' +
          '<div class="hubbell-overlay-stats">' +
            '<span><span class="hubbell-overlay-stat-value">' + person.lc + '</span> letters</span>' +
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
        '<div class="hubbell-overlay-section">' +
          '<div class="hubbell-overlay-section-title">Letters (' + person.lc + ')</div>' +
          letterListHTML(person.ltrs) +
        '</div>' +
      '</div>';

    openPanel(html);
    return true;
  }

  /* ── Show Place Overlay ── */
  function showPlace(name) {
    const place = lookupPlace(name);
    if (!place) return false;

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
          '<a class="hubbell-overlay-nav-btn hubbell-overlay-nav-btn--header place" href="viz-map-fullwar.html?date=' + encodeURIComponent(firstDate) + '&place=' + encodeURIComponent(place.n) + '&lat=' + place.co.lat + '&lon=' + place.co.lon + '">' +
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

    openPanel(html);
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

  function showLetterReader(letterId, opts) {
    var meta = letterMeta(letterId);
    if (!meta) return;
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

    var mapBtn = '<a class="hubbell-overlay-nav-btn hubbell-overlay-nav-btn--header" ' +
      'href="viz-map-fullwar.html?date=' + encodeURIComponent(meta.d) +
      '&brother=' + encodeURIComponent(meta.a) +
      '&letter=' + encodeURIComponent(letterId) + '">' +
      '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>' +
      ' View on Map</a>';

    var headerHtml =
      '<div class="hubbell-overlay-header">' +
        '<div class="hubbell-overlay-header-left">' +
          '<h2 class="hubbell-overlay-title">' + fromPill + ' <span class="hubbell-overlay-arrow">\u2192</span> ' + toPill + '</h2>' +
          '<div class="hubbell-overlay-subtitle">' + subtitleParts + subtitleExtra + '</div>' +
        '</div>' +
        mapBtn +
        headerActions() +
      '</div>';

    // Nav bar
    var navBarHtml = _buildOverlayNavBar(letterId);

    openPanel(headerHtml + navBarHtml + '<div class="hubbell-overlay-body"><div class="hubbell-overlay-loading">Loading letter</div></div>');

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

      // Format: collapse single \n to space, \n\n = paragraph break
      var paragraphs = text.split(/\n\n+/);
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
      }

      body.innerHTML = healthHtml + '<div class="hubbell-overlay-reader-body">' + formatted + '</div>';
      autoLinkProse(body.querySelector('.hubbell-overlay-reader-body'));
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
