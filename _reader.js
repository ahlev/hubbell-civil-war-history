/* ============================================================
   _reader.js — Unified letter reader overlay for all pages.
   Depends on: _search-data.js (LETTERS array), _search-engine.js (AUTHOR_COLORS/NAMES)
   ============================================================ */

window.HubbellReader = (function () {
  var overlay = null;
  var contentEl = null;
  var currentOpts = {};
  var currentLetterId = null;

  // Color and name lookups — use search-engine constants if available, else fallback
  var COLORS = {
    henry: '#2D5F8A', alexander: '#B8860B', james: '#4A7C59',
    charles: '#8B3A3A', mother: '#7B5EA7'
  };
  var NAMES = {
    henry: 'Henry Hubbell', alexander: 'Alexander F. Hubbell',
    james: 'James Hubbell', charles: 'Charles F. Hubbell',
    mother: 'Frances Hubbell (Mother)'
  };

  var BIO_PAGES = {
    henry: 'brother-henry.html', alexander: 'brother-alexander.html',
    james: 'brother-james.html', charles: 'brother-charles.html',
    mother: 'mother-frances.html'
  };

  function getColor(author) {
    if (window.AUTHOR_COLORS) return window.AUTHOR_COLORS[author] || '#666';
    return COLORS[author] || '#666';
  }
  function getName(author, fallback) {
    if (window.AUTHOR_NAMES) return window.AUTHOR_NAMES[author] || fallback || author;
    return NAMES[author] || fallback || author;
  }
  function resolveAuthorKey(nameStr) {
    if (!nameStr) return null;
    var lower = nameStr.toLowerCase();
    for (var key in NAMES) {
      if (lower.indexOf(key) !== -1) return key;
    }
    if (lower.indexOf('frances') !== -1 || lower.indexOf('mother') !== -1) return 'mother';
    return null;
  }

  function esc(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function formatDate(dateStr) {
    var months = ['','January','February','March','April','May','June','July','August','September','October','November','December'];
    return dateStr.replace(/^(\d{4})-(\d{2})-(\d{2})$/, function (m, y, mo, dy) {
      var day = parseInt(dy);
      if (day === 0) return months[parseInt(mo)] + ' ' + y + ' (approx.)';
      return months[parseInt(mo)] + ' ' + day + ', ' + y;
    });
  }

  function formatBody(text) {
    // Collapse single newlines to spaces, split on double newlines into paragraphs
    var collapsed = text.replace(/([^\n])\n([^\n])/g, '$1 $2');
    var paragraphs = collapsed.split(/\n\n+/);
    return paragraphs.map(function(p) {
      var trimmed = p.trim();
      return trimmed ? '<p class="reader-para">' + trimmed + '</p>' : '';
    }).filter(Boolean).join('');
  }

  function stripLetterHeader(text) {
    // Remove date/location block at the top of transcriptions.
    // The header is everything before the first \n\n, if it contains a year (18xx).
    var idx = text.indexOf('\n\n');
    if (idx < 0 || idx > 300) return text;
    var header = text.substring(0, idx);
    if (/\b18\d{2}\b/.test(header)) return text.substring(idx + 2);
    return text;
  }

  // ── Flag-category highlighting ─────────────────────────────────────────
  // Map each flag pill (Battle/Wound/Illness/Death) to the vocabulary of
  // words/phrases that signal it in the letter body. Keep these focused so
  // every highlight feels earned; better to under-highlight than to paint
  // half the letter red.
  var FLAG_PATTERNS = {
    battle: /\b(battle|battles|fight\w*|fought|engaged|engagement|skirmish\w*|charge[ds]?|charging|attack\w*|advance[ds]?|advancing|retreat\w*|firing|fired|musket\w*|rifles?|cannon\w*|shell\w*|shelling|cannonad\w+|bullets?|balls?|pickets?|enemy|rebels?|reb[s]?|regiments?|brigade[s]?|company|companies)\b/gi,
    wound: /\b(wound\w*|shot|struck|hit|injury|injured|injuries|ball|bullet|bruise[ds]?|bandage[ds]?|hospital|surgeon|ambulance|knee|shoulder|leg|arm|chest)\b/gi,
    illness: /\b(sick\w*|ill|illness|fever\w*|diarr?hea|cough\w*|dysentery|jaundice|typhoid|weak\w*|feeble|fatigue\w*|recover\w*|hospital|infirmary|medicine\w*|doctor\w*)\b/gi,
    death: /\b(died|dead|death\w*|killed|kill\w*|lost|fallen|mortal\w*|deceased|buried|graves?|cemeter\w+|casualt\w+|perish\w*)\b/gi
  };

  // Wrap matches of each active category's pattern in the body HTML with
  // <span class="rhl-<flag>">…</span>. Operates only on text nodes (split
  // on HTML tags) so we don't replace inside class attributes etc.
  function wrapFlagCategoryTerms(html, activeFlags) {
    if (!activeFlags || !activeFlags.length) return html;
    // Priority order: death > wound > illness > battle so the more specific
    // category claims an overlapping word first. Later passes can still nest
    // inside an earlier span (CSS shows the innermost background).
    var order = ['death', 'wound', 'illness', 'battle'];
    order.forEach(function (flag) {
      if (activeFlags.indexOf(flag) === -1) return;
      var pat = FLAG_PATTERNS[flag];
      if (!pat) return;
      var cls = 'rhl-' + flag;
      html = html.split(/(<[^>]+>)/).map(function (part, i) {
        if (i % 2 === 1) return part; // HTML tag — leave alone
        return part.replace(pat, '<span class="' + cls + '">$&</span>');
      }).join('');
    });
    return html;
  }

  function highlightTerms(text, terms) {
    if (!terms || !terms.length) return text;
    var result = text;
    terms.forEach(function (term) {
      if (!term) return;
      try {
        var re = new RegExp('(' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
        result = result.replace(re, '<mark>$1</mark>');
      } catch (e) {}
    });
    return result;
  }

  function buildHealthHtml(h, activeFlags) {
    var hasContent = (h.status && h.status !== 'nodata') ||
      (h.confidence && h.confidence !== 'nodata') ||
      (h.symptoms && h.symptoms.length);
    if (!hasContent) return '';

    var html = '<div class="reader-health">';

    // Status badge
    if (h.status && h.status !== 'nodata') {
      html += '<span class="reader-health-status" style="background:' + esc(h.statusColor || '#D0D0D0') + '">' +
        esc(h.statusLabel || h.status) + '</span>';
    }

    // Confidence
    if (h.confidence && h.confidence !== 'nodata') {
      html += '<span class="reader-health-conf" style="border-color:' + esc(h.confColor || '#9B9B9B') +
        ';color:' + esc(h.confColor || '#9B9B9B') + '">' + esc(h.confLabel || h.confidence) + '</span>';
      if (h.confExplanation) {
        html += '<span class="reader-health-conf-desc">' + esc(h.confExplanation) + '</span>';
      }
    }

    // Symptom keywords — skip any symptom that duplicates an already-rendered
    // flag pill (e.g. "Wounds" when the colored Wound pill is already inline).
    if (h.symptoms && h.symptoms.length) {
      var flagWords = (activeFlags || []).map(function (f) { return f.toLowerCase(); });
      var dedupedSymptoms = h.symptoms.filter(function (s) {
        var sl = String(s).toLowerCase().replace(/s$/, ''); // drop trailing plural
        return flagWords.indexOf(sl) === -1;
      });
      if (dedupedSymptoms.length) {
        html += '<div class="reader-health-symptoms">' +
          dedupedSymptoms.map(function (s) { return '<span class="reader-health-symptom">' + esc(s) + '</span>'; }).join('') +
          '</div>';
      }
    }

    html += '</div>';
    return html;
  }

  function highlightHealthSentences(text, sentences) {
    if (!sentences) return esc(text);
    // Process paragraph by paragraph to preserve \n\n breaks
    var paragraphs = text.split(/\n\n+/);
    var result = [];
    for (var p = 0; p < paragraphs.length; p++) {
      var para = paragraphs[p].replace(/\n/g, ' ').trim();
      if (!para) continue;
      // Split into sentences within this paragraph
      var parts = para.split(/(?<=[.!?])\s+/);
      var paraResult = [];
      for (var i = 0; i < parts.length; i++) {
        var sent = parts[i];
        var key = sent.trim().replace(/[.!?]+$/, '').substring(0, 40);
        var cls = null;
        if (sentences.hospital && sentences.hospital.has(key)) cls = 'rhl-hospital';
        else if (sentences.wound && sentences.wound.has(key)) cls = 'rhl-hospital';
        else if (sentences.sick && sentences.sick.has(key)) cls = 'rhl-sick';
        else if (sentences.healthy && sentences.healthy.has(key)) cls = 'rhl-healthy';
        if (cls) {
          paraResult.push('<span class="' + cls + '">' + esc(sent) + '</span>');
        } else {
          paraResult.push(esc(sent));
        }
      }
      result.push(paraResult.join(' '));
    }
    return result.join('\n\n');
  }

  function ensureOverlay() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.className = 'reader-overlay';
    overlay.id = 'hubbellReaderOverlay';
    overlay.innerHTML =
      '<div class="reader-panel" id="hubbellReaderPanel">' +
        '<button class="reader-close" id="hubbellReaderClose">&times;</button>' +
        '<div class="reader-nav-bar" id="hubbellReaderNav">' +
          '<button class="reader-nav-arrow" id="readerPrev">\u2190</button>' +
          '<div class="reader-nav-mode" id="readerNavMode">' +
            '<button class="reader-nav-mode-btn active" data-mode="author">' +
              '<span class="nav-author-dot"></span> Letters' +
            '</button>' +
            '<button class="reader-nav-mode-btn" data-mode="date">All Letters</button>' +
          '</div>' +
          '<button class="reader-nav-arrow" id="readerNext">\u2192</button>' +
        '</div>' +
        '<div id="hubbellReaderContent"></div>' +
      '</div>';
    document.body.appendChild(overlay);
    contentEl = document.getElementById('hubbellReaderContent');

    // Close on backdrop click
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });
    // Close button
    document.getElementById('hubbellReaderClose').addEventListener('click', close);
    // Nav arrows
    document.getElementById('readerPrev').addEventListener('click', function () { navigateReader(-1); });
    document.getElementById('readerNext').addEventListener('click', function () { navigateReader(1); });

    // Mode buttons
    document.getElementById('readerNavMode').addEventListener('click', function (e) {
      var btn = e.target.closest('.reader-nav-mode-btn');
      if (!btn || !btn.dataset.mode) return;
      if (window.HubbellLetterNav) HubbellLetterNav.setMode(btn.dataset.mode);
      updateNavBar();
      refreshContextStrip();   // re-filter the strip to the new mode
    });

    // Keyboard: Escape, ArrowLeft, ArrowRight
    document.addEventListener('keydown', function (e) {
      if (!overlay.classList.contains('open')) return;
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'ArrowLeft') { e.preventDefault(); navigateReader(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); navigateReader(1); }
    });
  }

  function navigateReader(dir) {
    if (!currentLetterId || !window.HubbellLetterNav) return;
    var nextId = HubbellLetterNav.findAdjacent(currentLetterId, dir);
    if (!nextId) return;
    // Strip stale letter/health from opts so open() fetches fresh data
    var navOpts = {};
    for (var k in currentOpts) {
      if (k !== 'letter' && k !== 'health') navOpts[k] = currentOpts[k];
    }
    open(nextId, navOpts);
  }

  function updateNavBar() {
    if (!overlay || !currentLetterId) return;
    var navBarEl = document.getElementById('hubbellReaderNav');
    // Document mode (e.g. the standalone 1996 letter): no prev/next siblings to
    // walk, so hide the whole nav bar rather than show two dead arrows.
    if (currentOpts && currentOpts.asDocument) {
      if (navBarEl) navBarEl.style.display = 'none';
      return;
    }
    if (navBarEl) navBarEl.style.display = ''; // restore after a doc was shown
    var Nav = window.HubbellLetterNav;
    if (!Nav) {
      if (navBarEl) navBarEl.style.display = 'none';
      return;
    }

    var mode = Nav.getMode();
    var authorName = Nav.getAuthorName(currentLetterId);
    var authorColor = Nav.getAuthorColor(currentLetterId);
    var prevId = Nav.findAdjacent(currentLetterId, -1);
    var nextId = Nav.findAdjacent(currentLetterId, 1);

    document.getElementById('readerPrev').disabled = !prevId;
    document.getElementById('readerNext').disabled = !nextId;

    // Update mode buttons
    var modeWrap = document.getElementById('readerNavMode');
    var btns = modeWrap.querySelectorAll('.reader-nav-mode-btn');
    btns.forEach(function (b) {
      b.classList.toggle('active', b.dataset.mode === mode);
    });

    // Update author button label + dot color
    var authorBtn = modeWrap.querySelector('[data-mode="author"]');
    if (authorBtn) {
      // Expose the author color so the active tab can use a darker shade of it.
      authorBtn.style.setProperty('--author-c', authorColor);
      var dot = authorBtn.querySelector('.nav-author-dot');
      if (dot) dot.style.background = authorColor;
      // Set text: "{Name}'s Letters"
      authorBtn.innerHTML = '<span class="nav-author-dot" style="background:' + authorColor + '"></span> ' +
        (authorName ? authorName + '\u2019s Letters' : 'Author\u2019s Letters');
    }
  }

  function findLetter(id) {
    if (typeof LETTERS !== 'undefined') {
      return LETTERS.find(function (l) { return l.id === id; });
    }
    return null;
  }

  // ── Letter Context Strip ───────────────────────────────────────────────
  // A reusable "where am I in the whole correspondence" strip for the reader.
  // Every letter in the corpus is a faint tick on one shared timeline; the
  // current letter's author is emphasised; the current letter is pinned; and
  // tapping anywhere jumps to the nearest letter. Two layers: an SVG (axis +
  // density ticks — tolerant of non-uniform horizontal scaling) and HTML
  // pins/labels (crisp at any width). Opt-in via opts.contextStrip.
  //
  // Why ticks + tap-to-nearest instead of 273 tappable dots: at corpus density
  // (~273 letters across ~600px) individual dots overlap and are far smaller
  // than a 44px touch target. A density band you tap *near* keeps the full-arc
  // overview while staying usable on mobile.
  var _ctxStrip = null;       // metadata for the binder
  var CTX_INSET = 6;          // % inset each side: keeps end ticks unclipped and
                              // leaves room for the in-line year bookend labels

  function buildLetterContextStrip(activeId) {
    if (typeof LETTERS === 'undefined' || !LETTERS || !LETTERS.length) return '';
    // Follow the reader's nav mode: in "<author>'s Letters" mode show only that
    // author's dots; in "All Letters" mode show the whole corpus.
    var navMode = (window.HubbellLetterNav && HubbellLetterNav.getMode) ? HubbellLetterNav.getMode() : 'date';
    var _aFilter = findLetter(activeId);
    var filterAuthor = (navMode === 'author' && _aFilter) ? _aFilter.a : null;
    var items = [];
    for (var i = 0; i < LETTERS.length; i++) {
      var l = LETTERS[i];
      if (!l || !l.d || !/^\d{4}-\d{2}-\d{2}$/.test(l.d)) continue;
      if (filterAuthor && l.a !== filterAuthor) continue;
      // Mid-month for unknown-day (YYYY-MM-00) dates — matches parseDate convention.
      var t = new Date(l.d.replace(/-00$/, '-15') + 'T12:00:00').getTime();
      if (isNaN(t)) continue;
      items.push({ id: l.id, a: l.a, r: l.r, d: l.d, t: t });
    }
    if (items.length < 2) return '';
    var minT = Infinity, maxT = -Infinity;
    for (var j = 0; j < items.length; j++) {
      if (items[j].t < minT) minT = items[j].t;
      if (items[j].t > maxT) maxT = items[j].t;
    }
    var rangeT = (maxT - minT) || 1;
    var minYear = new Date(minT).getFullYear();
    var maxYear = new Date(maxT).getFullYear();

    var active = findLetter(activeId);
    var activeAuthor = active ? active.a : null;
    var activeT = (active && active.d) ? new Date(active.d.replace(/-00$/, '-15') + 'T12:00:00').getTime() : null;
    if (activeT != null && isNaN(activeT)) activeT = null;

    var VBW = 1000, baseY = 15;
    // Compress anomalously long silences (notably the 5-year 1865→1870 gap) so
    // the dense wartime correspondence isn't squashed into a sliver. Gaps between
    // consecutive letters longer than GAP_THRESHOLD collapse to GAP_COMPRESSED in
    // "effective" time; a dashed break mark shows where time was compressed.
    var DAY = 86400000, GAP_THRESHOLD = 200 * DAY, GAP_COMPRESSED = 70 * DAY;
    var sortedT = items.slice().sort(function (a, b) { return a.t - b.t; });
    var segs = [], eff = 0, breaks = [];
    for (var s = 1; s < sortedT.length; s++) {
      var gap = sortedT[s].t - sortedT[s - 1].t, comp = gap > GAP_THRESHOLD;
      var w = comp ? GAP_COMPRESSED : gap;
      segs.push({ t0: sortedT[s - 1].t, t1: sortedT[s].t, e0: eff, e1: eff + w, comp: comp });
      if (comp) breaks.push(eff + w / 2);
      eff += w;
    }
    var effTotal = eff || 1;
    function effOf(t) {
      if (t <= sortedT[0].t) return 0;
      if (t >= sortedT[sortedT.length - 1].t) return effTotal;
      for (var q = 0; q < segs.length; q++) {
        if (t >= segs[q].t0 && t <= segs[q].t1) {
          var sp = segs[q].t1 - segs[q].t0;
          return segs[q].e0 + (sp ? (t - segs[q].t0) / sp * (segs[q].e1 - segs[q].e0) : 0);
        }
      }
      return effTotal;
    }
    function posPct(t) { return CTX_INSET + (effOf(t) / effTotal) * (100 - 2 * CTX_INSET); }
    function ppX(pp) { return (pp / 100 * VBW).toFixed(1); }
    items.forEach(function (it) { it.pp = posPct(it.t); });

    var ticks = '';
    for (var k = 0; k < items.length; k++) {
      var it = items[k];
      var same = activeAuthor && it.a === activeAuthor;
      var x = ppX(it.pp);
      ticks += '<line x1="' + x + '" y1="' + (same ? baseY - 5 : baseY - 3) +
        '" x2="' + x + '" y2="' + (same ? baseY + 5 : baseY + 3) +
        '" stroke="' + getColor(it.a) + '" stroke-width="1.4" opacity="' + (same ? 0.55 : 0.28) +
        '" vector-effect="non-scaling-stroke"/>';
    }

    // Year gridlines, skipping any year boundary that falls inside a compressed gap.
    var grid = '';
    for (var yy = minYear + 1; yy <= maxYear; yy++) {
      var yt = new Date(yy + '-01-01T12:00:00').getTime();
      if (yt < minT || yt > maxT) continue;
      var inGap = false;
      for (var g2 = 0; g2 < segs.length; g2++) { if (segs[g2].comp && yt > segs[g2].t0 && yt < segs[g2].t1) { inGap = true; break; } }
      if (inGap) continue;
      var gx = ppX(posPct(yt));
      grid += '<line class="rcs-grid" x1="' + gx + '" y1="2" x2="' + gx + '" y2="28" vector-effect="non-scaling-stroke"/>';
    }

    // Dashed break mark wherever a long silence was compressed.
    var brk = '';
    breaks.forEach(function (em) {
      var bx = ppX(CTX_INSET + (em / effTotal) * (100 - 2 * CTX_INSET));
      brk += '<line class="rcs-break" x1="' + bx + '" y1="3" x2="' + bx + '" y2="27" vector-effect="non-scaling-stroke"/>';
    });

    var marker = '';
    if (activeT != null) {
      marker = '<span class="rcs-marker" style="left:' + posPct(activeT).toFixed(2) +
        '%;--rcs-c:' + getColor(activeAuthor) + '"></span>';
    }

    _ctxStrip = { items: items, inset: CTX_INSET, activeId: activeId };

    return '<div class="reader-context-strip" id="readerCtxStrip" role="group" ' +
      'aria-label="Timeline overview of all ' + items.length + ' letters in the collection; the letter you are reading is marked. Tap or drag the strip to jump to a nearby letter.">' +
      '<span class="rcs-caption">tap to jump</span>' +
      '<svg class="rcs-svg" viewBox="0 0 ' + VBW + ' 30" preserveAspectRatio="none" aria-hidden="true">' +
        '<line class="rcs-axis" x1="' + ppX(posPct(minT)) + '" y1="' + baseY + '" x2="' + ppX(posPct(maxT)) +
        '" y2="' + baseY + '" vector-effect="non-scaling-stroke"/>' + grid + brk + ticks +
      '</svg>' +
      marker +
      '<span class="rcs-hover" hidden></span>' +
      '<span class="rcs-yr rcs-yr-start">' + minYear + '</span>' +
      '<span class="rcs-yr rcs-yr-end">' + maxYear + '</span>' +
      '<div class="rcs-tip" hidden></div>' +
    '</div>';
  }

  function _ctxNearest(clientX, rect) {
    if (!_ctxStrip || !rect.width) return null;
    var pct = ((clientX - rect.left) / rect.width) * 100;
    var best = null, bestD = Infinity;
    for (var i = 0; i < _ctxStrip.items.length; i++) {
      var dd = Math.abs(_ctxStrip.items[i].pp - pct);   // nearest by on-strip position
      if (dd < bestD) { bestD = dd; best = _ctxStrip.items[i]; }
    }
    return best;
  }

  // Rebuild the strip in place (e.g. after a nav-mode toggle) without re-opening
  // the whole reader. insertAdjacentHTML (not innerHTML) keeps the rest intact.
  function refreshContextStrip() {
    if (!currentOpts || !currentOpts.contextStrip || !contentEl || !currentLetterId) return;
    var existing = contentEl.querySelector('.reader-context-strip');
    if (!existing) return;
    existing.insertAdjacentHTML('beforebegin', buildLetterContextStrip(currentLetterId));
    existing.remove();
    bindContextStrip();
  }

  function bindContextStrip() {
    var strip = contentEl.querySelector('.reader-context-strip');
    if (!strip || !_ctxStrip) return;
    var tip = strip.querySelector('.rcs-tip');
    var hov = strip.querySelector('.rcs-hover');
    var fine = window.matchMedia && window.matchMedia('(any-pointer: fine)').matches;
    // Press-and-drag scrub state. sx/sy = pointerdown origin; scrubbing once the
    // finger moves horizontally; asScroll if it moves vertically (let the page scroll).
    var sx = null, sy = null, scrubbing = false, asScroll = false;

    function preview(clientX) {
      var near = _ctxNearest(clientX, strip.getBoundingClientRect());
      if (!near) return;
      var lp = near.pp;
      hov.style.left = lp.toFixed(2) + '%';
      hov.style.setProperty('--rcs-c', getColor(near.a));
      hov.hidden = false;
      // Sender → Recipient (color encodes the sender, so name it). formatDate
      // renders unknown-day dates as "Month Year (approx.)" — provenance shown.
      tip.textContent = formatDate(near.d) + '  •  ' + getName(near.a, near.a) + ' → ' + (near.r || 'Unknown');
      tip.style.left = Math.max(8, Math.min(92, lp)) + '%';   // clamp so it can't run off the edge
      tip.hidden = false;
    }
    function clear() { hov.hidden = true; tip.hidden = true; }
    function commit(clientX) {
      var near = _ctxNearest(clientX, strip.getBoundingClientRect());
      if (near && near.id !== _ctxStrip.activeId) { clear(); open(near.id, currentOpts); }
    }

    if (fine) {
      strip.addEventListener('mousemove', function (e) { preview(e.clientX); });
      strip.addEventListener('mouseleave', clear);
    }
    strip.addEventListener('pointerdown', function (e) {
      sx = e.clientX; sy = e.clientY; scrubbing = false; asScroll = false;
      preview(e.clientX);   // touch users get an immediate preview under the finger
    });
    strip.addEventListener('pointermove', function (e) {
      if (sx == null) return;
      var dx = Math.abs(e.clientX - sx), dy = Math.abs(e.clientY - sy);
      if (!scrubbing && !asScroll) {
        if (dy > 10 && dy > dx) { asScroll = true; clear(); return; }  // vertical → let it scroll
        if (dx > 6) scrubbing = true;
      }
      if (scrubbing) preview(e.clientX);
    });
    strip.addEventListener('pointerup', function (e) {
      if (sx != null && !asScroll) commit(e.clientX);
      sx = null; clear();
    });
    strip.addEventListener('pointercancel', function () { sx = null; clear(); });
  }

  function open(letterId, opts) {
    opts = opts || {};
    currentOpts = opts;
    currentLetterId = letterId;

    // Document mode: the id is a standalone document (e.g. the 1996 provenance
    // letter), NOT a dated corpus letter. Suppress the corpus-only affordances
    // — the war-map link, the prev/next letter nav, and the deep-link share —
    // which would all point nowhere meaningful for a non-corpus document.
    var asDocument = !!opts.asDocument;

    // Apply initial nav mode if specified by caller
    if (opts.initialNavMode && window.HubbellLetterNav) {
      HubbellLetterNav.setMode(opts.initialNavMode);
    }

    // Find letter data — merge with LETTERS for ppl/plc/transcription if needed
    var letter = opts.letter || findLetter(letterId);
    if (!letter) return;
    var full = findLetter(letterId);
    if (full) {
      var mergeFields = {};
      if (!letter.ppl && full.ppl) mergeFields.ppl = full.ppl;
      if (!letter.plc && full.plc) mergeFields.plc = full.plc;
      // Prefer LETTERS transcription — it preserves original paragraph breaks
      if (full.t) mergeFields.t = full.t;
      if (Object.keys(mergeFields).length) letter = Object.assign({}, letter, mergeFields);
    }

    ensureOverlay();

    var color = getColor(letter.a);
    var name = getName(letter.a, letter.an);
    var d = formatDate(letter.d);

    // Map link \u2014 lands on the Map That Moves at this letter's date. Frances
    // now appears as a fixed dot at Champlain, so her letters get the link too;
    // the &brother lock-follow is omitted for her (she never moves).
    var mapLink = asDocument ? '' :
      '<a class="reader-map-link" href="viz-map-fullwar?date=' +
      encodeURIComponent(letter.d) +
      (letter.a !== 'mother'
        ? '&brother=' + encodeURIComponent(letter.a) + '&letter=' + encodeURIComponent(letter.id)
        : '&home=1') +
      '">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>' +
      ' View on map \u2192</a>';

    // Flags — clickable pills that toggle body-text highlighting per category.
    // Each pill has data-flag so the click handler attached after render can
    // identify which category to toggle.
    var flags = '';
    var activeFlags = [];
    if (letter.bat) { flags += '<span class="reader-flag rf-battle" data-flag="battle" title="Click to toggle battle highlighting">Battle</span>'; activeFlags.push('battle'); }
    if (letter.ill) { flags += '<span class="reader-flag rf-illness" data-flag="illness" title="Click to toggle illness highlighting">Illness</span>'; activeFlags.push('illness'); }
    if (letter.dth) { flags += '<span class="reader-flag rf-death" data-flag="death" title="Click to toggle death highlighting">Death</span>'; activeFlags.push('death'); }
    if (letter.wnd) { flags += '<span class="reader-flag rf-wound" data-flag="wound" title="Click to toggle wound highlighting">Wound</span>'; activeFlags.push('wound'); }

    // People tags — clickable links to People Web
    var ppl = '';
    if (letter.ppl && letter.ppl.length) {
      ppl = '<div class="reader-people"><h4>People Mentioned</h4><div class="reader-tags">' +
        letter.ppl.map(function (p) {
          return '<a href="viz-people-web?person=' + encodeURIComponent(p) +
            '" class="reader-tag person" onclick="event.stopPropagation()">' + esc(p) + '</a>';
        }).join('') + '</div></div>';
    }

    // Place tags — clickable links to Map, centered on location
    var plc = '';
    if (letter.plc && letter.plc.length) {
      plc = '<div class="reader-places"><h4>Places Mentioned</h4><div class="reader-tags">' +
        letter.plc.map(function (p) {
          return '<a href="viz-map-fullwar?date=' + encodeURIComponent(letter.d) +
            '&brother=' + encodeURIComponent(letter.a) +
            '&place=' + encodeURIComponent(p) +
            '" class="reader-tag place" onclick="event.stopPropagation()">' + esc(p) + '</a>';
        }).join('') + '</div></div>';
    }

    // Health context section
    var healthHtml = '';
    if (opts.health) {
      healthHtml = buildHealthHtml(opts.health, activeFlags);
    }

    // Body text — strip redundant date/location header
    var rawText = stripLetterHeader(letter.t || '');
    var bodyText;
    if (opts.health && opts.health.sentences) {
      bodyText = formatBody(highlightHealthSentences(rawText, opts.health.sentences));
    } else {
      bodyText = formatBody(esc(rawText));
    }

    // Apply highlights
    var highlightTermsList = [];
    if (opts.highlight) {
      // Can be string or array
      var terms = Array.isArray(opts.highlight) ? opts.highlight : [opts.highlight];
      highlightTermsList = highlightTermsList.concat(terms);
    }
    if (opts.personHighlight) {
      highlightTermsList.push(opts.personHighlight);
    }
    bodyText = highlightTerms(bodyText, highlightTermsList);
    // Flag-category keyword highlighting: wrap matched terms with rhl-<flag>
    // spans, only for categories whose flag pill is rendered. Toggling a pill
    // off via CSS (.reader-body.hide-<flag>) collapses these spans to plain.
    bodyText = wrapFlagCategoryTerms(bodyText, activeFlags);

    // Build sender pill
    var senderPage = BIO_PAGES[letter.a] || '';
    var senderPill = senderPage
      ? '<a href="' + senderPage + '" class="reader-pill" style="background:' + color + ';--pc:' + color + '" onclick="event.stopPropagation()">' + esc(name) + '</a>'
      : '<span class="reader-pill" style="background:' + color + ';--pc:' + color + '">' + esc(name) + '</span>';

    // Build recipient pill
    var recipientName = letter.r || 'Unknown';
    var recipientKey = resolveAuthorKey(recipientName);
    var recipientColor = recipientKey ? getColor(recipientKey) : '#666';
    var recipientPage = recipientKey ? BIO_PAGES[recipientKey] : '';
    var recipientPill = recipientPage
      ? '<a href="' + recipientPage + '" class="reader-pill" style="background:' + recipientColor + ';--pc:' + recipientColor + '" onclick="event.stopPropagation()">' + esc(recipientName) + '</a>'
      : '<span class="reader-pill" style="background:' + recipientColor + ';--pc:' + recipientColor + '">' + esc(recipientName) + '</span>';

    // Letter Context Strip (opt-in) — the corpus-wide "you are here" timeline.
    var contextStrip = opts.contextStrip ? buildLetterContextStrip(letterId) : '';
    // Executive summary — the one-line editorial "what this letter is" the user
    // values. Shown in every reader (above people/places/tags), color-coded to
    // the author, whenever the letter has a summary.
    var summaryHtml = letter.ss
      ? '<div class="reader-exec-summary" style="--exec-c:' + color + '">' + esc(letter.ss) + '</div>' : '';

    contentEl.innerHTML =
      '<div class="reader-header" style="border-bottom-color:' + color + '">' +
        '<div class="reader-correspondence">' +
          '<span class="reader-pill-label">From</span>' + senderPill +
          '<span class="reader-pill-label" style="min-width:auto">To</span>' + recipientPill +
          (flags ? '<span class="reader-flags-inline">' + flags + '</span>' : '') +
        '</div>' +
        '<div class="reader-meta">' +
          '<span class="rm-date">' + d + '</span>' +
          ' <span class="rm-loc">from ' + esc(letter.loc || 'Unknown location') + '</span>' +
          mapLink +
          '<span class="rm-id">' + esc(letter.id) + '</span></div>' +
      '</div>' +
      contextStrip +
      summaryHtml +
      healthHtml +
      ppl + plc +
      '<div class="reader-body">' + bodyText + '</div>';

    // Inject the share button into the reader panel. It's absolute-positioned
    // (anchored to .reader-panel) so it sits inline at the top-right beside the
    // close on desktop, and re-centers as a banner on mobile — see the
    // .reader-panel .dl-modal-share rules in _design.css.
    if (window.HubbellDeepLink && !asDocument) {
      var existing = overlay.querySelector('.dl-modal-share');
      if (existing) existing.remove();
      var navBar = overlay.querySelector('.reader-nav-bar');
      if (navBar) navBar.insertAdjacentHTML('beforebegin', HubbellDeepLink.letterShareBtn(letter.id));
    }

    // Bind overlay links (people/place tags rendered as overlays by _overlay.js)
    if (window.HubbellOverlay) HubbellOverlay.bindDynamic(contentEl);

    // Flag pill click handlers — toggle .flag-off on the pill and
    // .hide-<flag> on .reader-body so highlights collapse/reappear.
    var bodyEl = contentEl.querySelector('.reader-body');
    contentEl.querySelectorAll('.reader-flag[data-flag]').forEach(function (pill) {
      pill.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var f = pill.getAttribute('data-flag');
        var off = pill.classList.toggle('flag-off');
        if (bodyEl) bodyEl.classList.toggle('hide-' + f, off);
      });
    });

    if (opts.contextStrip) bindContextStrip();

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    updateNavBar();

    // Scroll: to first highlight if present, otherwise to the top of the content
    setTimeout(function () {
      var mark = highlightTermsList.length > 0 ? contentEl.querySelector('.reader-body mark') : null;
      if (mark) {
        mark.scrollIntoView({ block: 'center', behavior: 'smooth' });
      } else {
        contentEl.scrollTop = 0;
      }
    }, 50);
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    if (currentOpts.onClose) currentOpts.onClose();
    currentOpts = {};
    currentLetterId = null;
  }

  function isOpen() {
    return overlay && overlay.classList.contains('open');
  }

  function getCurrentLetterId() {
    if (!overlay || !overlay.classList.contains('open')) return null;
    var idEl = overlay.querySelector('.rm-id');
    return idEl ? idEl.textContent : null;
  }

  return {
    open: open,
    close: close,
    isOpen: isOpen,
    getCurrentLetterId: getCurrentLetterId
  };
})();
