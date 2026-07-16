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
    henry: 'who-they-were.html#henry', alexander: 'who-they-were.html#alexander',
    james: 'who-they-were.html#james', charles: 'who-they-were.html#charles',
    mother: 'who-they-were.html#mother'
  };

  /* ── Collapsible reader sections (.rc) ──────────────────────────────
     Editor's note / People Mentioned / Places Mentioned collapse behind
     a compact mono header. ONE sticky preference per section, site-wide
     (localStorage 'hubReaderCollapse'): toggle it in any reader and the
     choice follows the user across letters and reader surfaces until
     toggled again. The identical contract lives in _overlay.js and the
     Parallel Lives dashboard's inline readers; styles in _overlay.css.
     Defaults: editor's note starts COLLAPSED; people/places start open. */
  var RC_KEY = 'hubReaderCollapse';
  var RC_DEFAULTS = { editorial: 1, people: 0, places: 0 };
  function rcCollapsed(sec) {
    try {
      var p = JSON.parse(localStorage.getItem(RC_KEY)) || {};
      return (sec in p) ? !!p[sec] : !!RC_DEFAULTS[sec];
    } catch (e) { return !!RC_DEFAULTS[sec]; }
  }
  function rcWrap(sec, label, inner, count) {
    if (!inner) return '';
    var c = rcCollapsed(sec);
    var cta = sec === 'editorial' ? 'click to read' : 'show';
    return '<div class="rc' + (c ? ' rc-collapsed' : '') + '" data-rc="' + sec + '">' +
      '<button class="rc-h" type="button" aria-expanded="' + (!c) + '">' +
        '<svg class="rc-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>' +
        '<span class="rc-t">' + label + '</span>' +
        (count ? '<span class="rc-n">' + count + '</span>' : '') +
        '<span class="rc-cta">' + cta + '</span>' +
      '</button>' +
      '<div class="rc-b">' + inner + '</div></div>';
  }
  // One document-level toggle handler serves every .rc on the page,
  // wired by whichever reader script parses first (capture phase so it
  // runs ahead of overlay/backdrop click handlers).
  if (!window.__hubRcWired) {
    window.__hubRcWired = true;
    document.addEventListener('click', function (e) {
      var h = e.target && e.target.closest ? e.target.closest('.rc-h') : null;
      if (!h) return;
      e.preventDefault(); e.stopPropagation();
      var rc = h.parentNode, sec = rc.getAttribute('data-rc');
      var col = rc.classList.toggle('rc-collapsed');
      h.setAttribute('aria-expanded', String(!col));
      try {
        var p = JSON.parse(localStorage.getItem(RC_KEY)) || {};
        p[sec] = col ? 1 : 0;
        localStorage.setItem(RC_KEY, JSON.stringify(p));
      } catch (err) {}
    }, true);
  }

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

  // ── Excerpt anchor ─────────────────────────────────────────────────────
  // When the reader is opened FROM a teased quote (a bio pull-quote, a map
  // context line), we softly grey the matching passage in the letter so the
  // reader lands on the very words that invited the click. Matching is
  // whitespace/punctuation/case-insensitive: we project the raw text to a
  // normalized string while keeping a map back to raw offsets, find the
  // excerpt there, then wrap that raw slice with sentinel chars (U+E000/U+E001)
  // that survive escaping + paragraphing and become a <mark class="reader-anchor">.
  function normalizeWithMap(raw) {
    var s = '', map = [], prevSpace = true;
    for (var i = 0; i < raw.length; i++) {
      var ch = raw.charAt(i).toLowerCase();
      if ((ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9')) {
        s += ch; map.push(i); prevSpace = false;
      } else if (!prevSpace) {
        s += ' '; map.push(i); prevSpace = true;
      }
    }
    return { s: s, map: map };
  }
  // Map a normalized [idx..endN] span back to a raw {start,end} range.
  function _rawRange(body, idx, endN) {
    while (endN > idx && body.s.charAt(endN) === ' ') endN--;   // land on a real char
    var start = body.map[idx], end = body.map[endN];
    if (start == null || end == null) return null;
    return { start: start, end: end + 1 };
  }

  // Find every substantial contiguous run of the excerpt that actually appears
  // in the letter, and return their raw ranges. Why runs (plural) instead of one
  // prefix probe: editorial pull-quotes routinely differ from the source at the
  // EDGES or MIDDLE — dialect cleaned up ("wasn't"↔"was not"), a word dropped, or
  // several sentences stitched with "…". A single leading-prefix match then finds
  // nothing and the passage never greys. Matching the longest verbatim run(s)
  // greys the real source words wherever they survived the editing.
  var ANCHOR_MIN_N = 16;        // a run must be ≥16 normalized chars (~3-4 words)
  function findAnchorRanges(rawText, excerpt) {
    if (!rawText || !excerpt) return [];
    var body = normalizeWithMap(rawText);
    var exN = normalizeWithMap(excerpt).s.trim();
    if (exN.length < 12) return [];
    var padded = ' ' + body.s + ' ';

    // Fast path: the whole excerpt is present verbatim.
    var whole = body.s.indexOf(exN);
    if (whole !== -1) {
      var r = _rawRange(body, whole, whole + exN.length - 1);
      return r ? [r] : [];
    }

    // Otherwise walk the excerpt word by word, greedily taking the longest
    // contiguous run that matches the body, then continuing past it.
    var words = exN.split(' ');
    var ranges = [], i = 0;
    while (i < words.length) {
      var bestLen = 0, bestPhrase = '';
      var phrase = '';
      for (var j = i; j < words.length; j++) {
        phrase = phrase ? phrase + ' ' + words[j] : words[j];
        if (padded.indexOf(' ' + phrase + ' ') !== -1) { bestLen = j - i + 1; bestPhrase = phrase; }
        else break;   // contiguous run ended
      }
      if (bestPhrase.length >= ANCHOR_MIN_N) {
        var at = body.s.indexOf(bestPhrase);
        if (at !== -1) {
          var rr = _rawRange(body, at, at + bestPhrase.length - 1);
          if (rr) ranges.push(rr);
        }
        i += bestLen;
      } else {
        i++;
      }
    }
    // Merge ranges that touch/overlap (and sort by position).
    ranges.sort(function (a, b) { return a.start - b.start; });
    var merged = [];
    for (var k = 0; k < ranges.length; k++) {
      var cur = ranges[k];
      if (merged.length && cur.start <= merged[merged.length - 1].end + 1) {
        if (cur.end > merged[merged.length - 1].end) merged[merged.length - 1].end = cur.end;
      } else merged.push({ start: cur.start, end: cur.end });
    }
    return merged;
  }

  // Back-compat single-range helper (first/longest run).
  function findAnchorRange(rawText, excerpt) {
    var rs = findAnchorRanges(rawText, excerpt);
    return rs.length ? rs[0] : null;
  }

  // ── Sentence-overlap fallback ──────────────────────────────────────────
  // When no contiguous run of the teased quote survives in the source (the
  // editor cleaned dialect, dropped words, or stitched several sentences with
  // an ellipsis), we still want to land the reader on context rather than grey
  // nothing. Find the single sentence in the letter that shares the most
  // distinctive words with the quote and grey that whole sentence — a "closest
  // we could find" anchor. Distinctive = words >=4 chars (skips the/and/was…).
  function _sentenceSpans(raw) {
    var spans = [], start = 0;
    raw.replace(/[.?!]["'”’)]?(?=\s)|\n\n+/g, function (m, idx) {
      var end = idx + m.length;
      spans.push({ start: start, end: end });
      start = end;
      return m;
    });
    if (start < raw.length) spans.push({ start: start, end: raw.length });
    return spans;
  }
  function _bestSentenceRange(raw, excerpt) {
    var exTokens = normalizeWithMap(excerpt).s.trim().split(' ').filter(function (w) { return w.length >= 4; });
    if (exTokens.length < 2) return null;
    var exSet = {}; exTokens.forEach(function (w) { exSet[w] = 1; });
    var spans = _sentenceSpans(raw), best = null, bestScore = 0;
    spans.forEach(function (sp) {
      var toks = normalizeWithMap(raw.slice(sp.start, sp.end)).s.trim().split(' ');
      var hit = 0, seen = {};
      toks.forEach(function (w) { if (exSet[w] && !seen[w]) { seen[w] = 1; hit++; } });
      if (hit > bestScore) { bestScore = hit; best = sp; }
    });
    // Require a real overlap: >=2 shared distinctive words, or >=35% of the quote's.
    if (!best || (bestScore < 2 && bestScore / exTokens.length < 0.35)) return null;
    var s = best.start, e = best.end;
    while (s < e && /\s/.test(raw.charAt(s))) s++;          // trim to the words
    while (e > s && /\s/.test(raw.charAt(e - 1))) e--;
    return s < e ? { start: s, end: e } : null;
  }

  // ── Shared anchor application (modal + infopanel readers) ──────────────
  // Insert private-use sentinels around the matched passage in RAW text; they
  // survive HTML-escaping + paragraphing, then swapAnchorSentinels() turns them
  // into the grey <mark class="reader-anchor"> once the body HTML is built.
  // Returns {text, active}. Exported so the infopanel renders anchors 1:1.
  var ANCHOR_A = String.fromCharCode(0xE000), ANCHOR_Z = String.fromCharCode(0xE001);
  function wrapExcerptSentinels(rawText, excerpt) {
    var exStr = Array.isArray(excerpt) ? excerpt.filter(Boolean).join(' ') : excerpt;
    if (!rawText || !exStr) return { text: rawText, active: false };
    var ranges = findAnchorRanges(rawText, exStr);
    if (!ranges.length) {
      var sent = _bestSentenceRange(rawText, exStr);   // graceful fallback: closest sentence
      if (sent) ranges = [sent];
    }
    if (!ranges.length) return { text: rawText, active: false };
    for (var ri = ranges.length - 1; ri >= 0; ri--) {  // back-to-front keeps offsets valid
      var range = ranges[ri];
      var seg = rawText.slice(range.start, range.end);
      var nn = seg.indexOf('\n\n');                    // never straddle a paragraph break
      if (nn !== -1) range.end = range.start + nn;
      rawText = rawText.slice(0, range.start) + ANCHOR_A +
        rawText.slice(range.start, range.end) + ANCHOR_Z + rawText.slice(range.end);
    }
    return { text: rawText, active: true };
  }
  function swapAnchorSentinels(html) {
    return html.split(ANCHOR_A).join('<mark class="reader-anchor">').split(ANCHOR_Z).join('</mark>');
  }

  // ── Term anchors (person / place mentioned) ────────────────────────────
  // For reference previews that are a NAME rather than a quote (open a letter
  // from a person or place), grey every verbatim occurrence of that name so the
  // reader lands on the mention — the same soft grey as a teased quote. Operates
  // on text BETWEEN HTML tags only, so it won't corrupt attributes or nest
  // illegally inside an existing tag's markup.
  function wrapTermAnchors(html, terms) {
    if (!terms || !terms.length) return html;
    terms.forEach(function (term) {
      var t = term ? String(term).trim() : '';
      if (t.length < 2) return;
      var re;
      try { re = new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi'); }
      catch (e) { return; }
      html = html.split(/(<[^>]+>)/).map(function (part, i) {
        if (i % 2 === 1) return part;                  // HTML tag — leave alone
        return part.replace(re, '<mark class="reader-anchor">$1</mark>');
      }).join('');
    });
    return html;
  }

  // ── Mobile scroll rail ─────────────────────────────────────────────────
  // A visible, draggable scrollbar for the letter region on touch screens
  // (CSS hides it >=641px). Mounted once on the panel; sized to the scroll
  // viewport so it spans exactly the letter, clearing header + footer rail.
  function mountReaderScrollRail() {
    var panel = overlay && overlay.querySelector('.reader-panel');
    var content = contentEl;
    if (!panel || !content || panel.querySelector('.era-scrollrail')) return;
    var rail = document.createElement('div'); rail.className = 'era-scrollrail';
    var thumb = document.createElement('div'); thumb.className = 'era-scrollthumb';
    rail.appendChild(thumb); panel.appendChild(rail);
    function metrics() {
      var ch = content.clientHeight, sh = content.scrollHeight;
      var railH = ch, thumbH = Math.max(30, railH * (ch / sh));
      return { ch: ch, sh: sh, overflow: sh - ch, railH: railH, thumbH: thumbH, maxThumbTop: railH - thumbH };
    }
    function update() {
      var m = metrics();
      if (m.overflow <= 4) { rail.style.display = 'none'; return; }
      rail.style.display = 'block';
      rail.style.top = content.offsetTop + 'px';
      rail.style.height = m.ch + 'px';
      var top = m.overflow > 0 ? (content.scrollTop / m.overflow) * m.maxThumbTop : 0;
      thumb.style.height = m.thumbH + 'px';
      thumb.style.transform = 'translateY(' + top + 'px)';
    }
    content.addEventListener('scroll', update, { passive: true });
    if (window.ResizeObserver) { try { new ResizeObserver(update).observe(content); } catch (e) {} }
    window.addEventListener('resize', update);
    var dragging = false, startY = 0, startScroll = 0;
    thumb.addEventListener('pointerdown', function (e) {
      dragging = true; startY = e.clientY; startScroll = content.scrollTop;
      try { thumb.setPointerCapture(e.pointerId); } catch (_) {}
      e.preventDefault(); e.stopPropagation();
    });
    thumb.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var m = metrics();
      var dScroll = m.maxThumbTop > 0 ? ((e.clientY - startY) / m.maxThumbTop) * m.overflow : 0;
      content.scrollTop = startScroll + dScroll;
    });
    function endDrag(e) { dragging = false; try { thumb.releasePointerCapture(e.pointerId); } catch (_) {} }
    thumb.addEventListener('pointerup', endDrag);
    thumb.addEventListener('pointercancel', endDrag);
    update();
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
        // Context-strip dock — the corpus timeline now rides the panel FOOTER,
        // fused to the nav bar below it (era CSS orders: content 0 → dock 89 →
        // nav-bar 90), instead of pushing the letter down from the top.
        '<div class="reader-ctx-dock" id="readerCtxDock"></div>' +
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
      // Drop letter/health (refetched per letter) AND excerpt (the teased
      // anchor belongs only to the letter we opened from, not its siblings).
      if (k !== 'letter' && k !== 'health' && k !== 'excerpt') navOpts[k] = currentOpts[k];
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
  // Why ticks + tap-to-nearest instead of 272 tappable dots: at corpus density
  // (~272 letters across ~600px) individual dots overlap and are far smaller
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
    if (!overlay || !currentLetterId) return;
    var existing = overlay.querySelector('.reader-context-strip');
    if (!existing) return;
    existing.insertAdjacentHTML('beforebegin', buildLetterContextStrip(currentLetterId));
    existing.remove();
    bindContextStrip();
  }

  // bindContextStrip() with no args wires the modal reader's own strip (tap →
  // HubbellReader.open). Pass (stripEl, onPick) to reuse the same strip inside
  // another surface (e.g. the infopanel reader), routing taps to onPick(id).
  function bindContextStrip(stripEl, onPick) {
    var strip = stripEl || (overlay && overlay.querySelector('.reader-context-strip'));
    if (!strip || !_ctxStrip) return;
    var pick = onPick || function (id) { open(id, currentOpts); };
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
      if (near && near.id !== _ctxStrip.activeId) { clear(); pick(near.id); }
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

    // People tags — clickable links to People Web. Collapsible (.rc, sticky
    // site-wide preference); the .rc header replaces the old inline <h4>.
    var ppl = '';
    if (letter.ppl && letter.ppl.length) {
      ppl = rcWrap('people', 'People Mentioned',
        '<div class="reader-people"><div class="reader-tags">' +
        letter.ppl.map(function (p) {
          return '<a href="viz-people-web?person=' + encodeURIComponent(p) +
            '" class="reader-tag person" onclick="event.stopPropagation()">' + esc(p) + '</a>';
        }).join('') + '</div></div>',
        '(' + letter.ppl.length + ')');
    }

    // Place tags — clickable links to Map, centered on location. Collapsible.
    var plc = '';
    if (letter.plc && letter.plc.length) {
      plc = rcWrap('places', 'Places Mentioned',
        '<div class="reader-places"><div class="reader-tags">' +
        letter.plc.map(function (p) {
          return '<a href="viz-map-fullwar?date=' + encodeURIComponent(letter.d) +
            '&brother=' + encodeURIComponent(letter.a) +
            '&place=' + encodeURIComponent(p) +
            '" class="reader-tag place" onclick="event.stopPropagation()">' + esc(p) + '</a>';
        }).join('') + '</div></div>',
        '(' + letter.plc.length + ')');
    }

    // Health context section
    var healthHtml = '';
    if (opts.health) {
      healthHtml = buildHealthHtml(opts.health, activeFlags);
    }

    // Body text — strip redundant date/location header
    var rawText = stripLetterHeader(letter.t || '');

    // Excerpt anchor: wrap the teased passage with sentinels in the RAW text so
    // the markers survive escaping + paragraphing. Skipped when health-sentence
    // highlighting owns the body (the ledger never opens from a teased quote).
    var anchorActive = false;
    if (opts.excerpt && !(opts.health && opts.health.sentences)) {
      var anchored = wrapExcerptSentinels(rawText, opts.excerpt);
      rawText = anchored.text; anchorActive = anchored.active;
    }

    var bodyText;
    if (opts.health && opts.health.sentences) {
      bodyText = formatBody(highlightHealthSentences(rawText, opts.health.sentences));
    } else {
      bodyText = formatBody(esc(rawText));
    }
    if (anchorActive) bodyText = swapAnchorSentinels(bodyText);

    // Apply search-term highlights (gold) — opts.highlight is search/term context.
    var highlightTermsList = [];
    if (opts.highlight) {
      // Can be string or array
      var terms = Array.isArray(opts.highlight) ? opts.highlight : [opts.highlight];
      highlightTermsList = highlightTermsList.concat(terms);
    }
    bodyText = highlightTerms(bodyText, highlightTermsList);
    // Flag-category keyword highlighting: wrap matched terms with rhl-<flag>
    // spans, only for categories whose flag pill is rendered. Toggling a pill
    // off via CSS (.reader-body.hide-<flag>) collapses these spans to plain.
    bodyText = wrapFlagCategoryTerms(bodyText, activeFlags);
    // Person / place reference previews: grey the named mention (the same soft
    // anchor as a teased quote) so opening a letter FROM a name lands on it.
    // personHighlight was formerly a gold search hit; it is a reference, so grey.
    // Either option accepts a single name or an ARRAY of names/aliases (the
    // People Web passes its curated alias set — letters rarely use canonical
    // names verbatim, so canonical-only matching found nothing to anchor).
    var anchorNames = [];
    if (opts.personHighlight) anchorNames = anchorNames.concat(opts.personHighlight);
    if (opts.placeHighlight) anchorNames = anchorNames.concat(opts.placeHighlight);
    // longest first so an alias inside a longer matched name doesn't nest marks
    anchorNames.sort(function (a, b) { return String(b).length - String(a).length; });
    if (anchorNames.length) bodyText = wrapTermAnchors(bodyText, anchorNames);

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

    // Letter Context Strip — the corpus-wide "you are here" timeline. Now shown
    // in EVERY reader by default (below the date/location, above the summary),
    // except the non-corpus document (which has no position on the war timeline)
    // or when a caller explicitly opts out with contextStrip:false.
    var contextStrip = (asDocument || opts.contextStrip === false) ? '' : buildLetterContextStrip(letterId);
    // Executive summary — the one-line editorial "what this letter is" the user
    // values. Shown in every reader (above people/places/tags), color-coded to
    // the author, whenever the letter has a summary.
    // Collapsible (.rc) and COLLAPSED BY DEFAULT — it was crowding the letter
    // itself down the panel; one click reopens it, and that choice sticks
    // across letters and readers until toggled again.
    var summaryHtml = letter.ss
      ? rcWrap('editorial', "Editor's Note",
          '<div class="reader-exec-summary" style="--exec-c:' + color + '">' + esc(letter.ss) + '</div>')
      : '';

    // "Health context:" — a medical-historian's read of the letter's health
    // content, shown ONLY when the caller supplies it (the Wellness Ledger). A
    // distinct CLINICAL voice with a medical-pulse icon; never replaces the
    // editor's summary above it (both can show).
    var _hc = (opts.health && opts.health.healthContext) ? opts.health.healthContext : '';
    var healthContextHtml = _hc
      ? '<div class="reader-health-context">' +
          '<div class="rhc-eyebrow">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h4l2 5 4-12 2 7h6"/></svg>' +
            'Health context' +
          '</div>' +
          '<div class="rhc-body">' + esc(_hc) + '</div>' +
        '</div>'
      : '';

    contentEl.innerHTML =
      '<div class="reader-header" style="border-bottom-color:' + color + '">' +
        '<div class="reader-correspondence">' +
          '<span class="reader-pill-label">From</span>' + senderPill +
          '<span class="reader-pill-label" style="min-width:auto">To</span>' + recipientPill +
        '</div>' +
        // Flag tags live on the META line (right-aligned float): that row always
        // has horizontal slack, so their presence never pushes the date down the
        // way a wrapped second line under the From/To pills did.
        '<div class="reader-meta">' +
          (flags ? '<span class="reader-flags-inline">' + flags + '</span>' : '') +
          '<span class="rm-date">' + d + '</span>' +
          ' <span class="rm-loc">from ' + esc(letter.loc || 'Unknown location') + '</span>' +
          mapLink + '</div>' +
      '</div>' +
      // Desktop: header stays locked at top; everything below it (summary,
      // health context, condition note, tags, and the letter) scrolls together
      // inside .reader-scroll. The corpus timeline no longer sits here — it is
      // docked at the panel FOOTER (#readerCtxDock), locked just above the
      // letter-nav / author-toggle rail.
      '<div class="reader-scroll">' +
        summaryHtml +
        healthContextHtml +
        healthHtml +
        ppl + plc +
        '<div class="reader-body">' + bodyText + '</div>' +
      '</div>';

    // Corpus timeline → footer dock (locked above the nav rail; empty dock
    // collapses via CSS when a document view or opts.contextStrip:false skips it).
    var ctxDock = document.getElementById('readerCtxDock');
    if (ctxDock) {
      ctxDock.textContent = '';
      if (contextStrip) ctxDock.insertAdjacentHTML('afterbegin', contextStrip);
    }

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

    if (contextStrip) bindContextStrip();

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    updateNavBar();
    mountReaderScrollRail();   // mobile draggable scrollbar (once; CSS hides >=641px)

    // Scroll behaviour: the reader ALWAYS opens at the top, EXCEPT for an explicit
    // search match, which jumps to the first hit (that IS the search intent).
    //  • Excerpt anchor (grey) and contextual gold highlights (a place name or
    //    person opened from an infopanel) GROUND the reader in its source — the
    //    highlight is there to find, not to chase. Yanking the scroll to it breaks
    //    spatial consistency as the user moves letter to letter, so we don't.
    //  • Only opts.scrollToMatch (set by the site search) opts into the jump.
    setTimeout(function () {
      var mark = (opts.scrollToMatch && !anchorActive && highlightTermsList.length > 0)
        ? contentEl.querySelector('.reader-body mark') : null;
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
    return currentLetterId;   // the ref id is no longer rendered in the meta; use the state var
  }

  // ── Quote-hook auto-wiring ──────────────────────────────────────────────
  // Editorial pages tease a letter with a pull-quote (.letter-quote → .lq-link)
  // or an inline narrative reference (a.ref) whose onclick is openLetter('ID').
  // This rewires those hooks so the reader opens with the TEASED PASSAGE softly
  // greyed (the excerpt anchor). Centralized here so every page gets identical
  // behavior from one call — HubbellReader.bindQuoteHooks() — instead of copying
  // the DOM-scraping into each page. Routes through the page's own openLetter()
  // when present (preserving its deep-link URL sync), else opens directly.
  function _openWithExcerpt(id, excerpt) {
    if (typeof window.openLetter === 'function') window.openLetter(id, excerpt);
    else open(id, { excerpt: excerpt, contextStrip: true });
  }
  function _idFromOnclick(el) {
    var oc = el.getAttribute('onclick'); if (!oc) return null;
    var m = oc.match(/openLetter\(\s*'([^']+)'/); return m ? m[1] : null;
  }
  function bindQuoteHooks(root) {
    root = root || document;
    // Pull-quotes — anchor the whole quoted passage (minus its citation).
    root.querySelectorAll('.lq-link').forEach(function (link) {
      var id = _idFromOnclick(link); if (!id) return;
      link.removeAttribute('onclick');
      link.style.cursor = 'pointer';
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var excerpt = '';
        var box = link.closest('.letter-quote');
        if (box) {
          var clone = box.cloneNode(true);
          var cite = clone.querySelector('cite'); if (cite) cite.remove();
          excerpt = clone.textContent.trim();
        }
        _openWithExcerpt(id, excerpt);
      });
    });
    // Inline refs — anchor the quote THIS ref introduces. A paragraph often
    // holds several refs and several <em> quotes (e.g. "James on April 6 … 'A' …
    // Charles on April 18 … 'B'"); the teased passage is the <em> that FOLLOWS
    // the link, not merely the longest one — pairing by proximity keeps each ref
    // matched to its own source letter so the grey anchor lands. Falls back to
    // the nearest preceding <em>, then the longest, then none.
    root.querySelectorAll('a.ref[onclick]').forEach(function (link) {
      var id = _idFromOnclick(link); if (!id) return;
      link.removeAttribute('onclick');
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var para = link.closest('p') || link.parentElement;
        var best = '';
        if (para) {
          var ems = [].slice.call(para.querySelectorAll('em'));
          var after = '', before = '', longest = '';
          ems.forEach(function (em) {
            var t = em.textContent.trim().replace(/^[“”"']+|[“”"']+$/g, '').trim();
            if (t.length < 8) return;
            if (t.length > longest.length) longest = t;
            var pos = link.compareDocumentPosition(em);
            if (pos & Node.DOCUMENT_POSITION_FOLLOWING) { if (!after) after = t; }   // first quote after the ref
            else before = t;                                                          // nearest quote before
          });
          best = after || before || longest;
        }
        _openWithExcerpt(id, best);
      });
    });
  }

  return {
    open: open,
    close: close,
    isOpen: isOpen,
    getCurrentLetterId: getCurrentLetterId,
    bindQuoteHooks: bindQuoteHooks,
    // Reusable corpus "you are here" strip for other reader surfaces.
    buildContextStrip: buildLetterContextStrip,
    bindContextStrip: bindContextStrip,
    // Shared body helpers so other reader surfaces (the infopanel) render 1:1:
    // strip the redundant date/location header, and tint flag-category keywords.
    stripLetterHeader: stripLetterHeader,
    wrapFlagCategoryTerms: wrapFlagCategoryTerms,
    // Shared grey-anchor engine. wrapExcerptSentinels() marks a teased quote in
    // RAW text (run match → sentence fallback); swapAnchorSentinels() turns the
    // sentinels into grey <mark>s once the body HTML is built; wrapTermAnchors()
    // greys verbatim person/place name mentions. Lets the infopanel anchor 1:1.
    wrapExcerptSentinels: wrapExcerptSentinels,
    swapAnchorSentinels: swapAnchorSentinels,
    wrapTermAnchors: wrapTermAnchors
  };
})();
