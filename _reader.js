/* ============================================================
   _reader.js — Unified letter reader overlay for all pages.
   Depends on: _search-data.js (LETTERS array), _search-engine.js (AUTHOR_COLORS/NAMES)
   ============================================================ */

window.HubbellReader = (function () {
  var overlay = null;
  var contentEl = null;
  var currentOpts = {};

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

  function buildHealthHtml(h) {
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

    // Symptom keywords
    if (h.symptoms && h.symptoms.length) {
      html += '<div class="reader-health-symptoms">' +
        h.symptoms.map(function (s) { return '<span class="reader-health-symptom">' + esc(s) + '</span>'; }).join('') +
        '</div>';
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
    // Escape key — only if this overlay is open
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('open')) close();
    });
  }

  function findLetter(id) {
    if (typeof LETTERS !== 'undefined') {
      return LETTERS.find(function (l) { return l.id === id; });
    }
    return null;
  }

  function open(letterId, opts) {
    opts = opts || {};
    currentOpts = opts;

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

    // Map link
    var mapLink = '<a class="reader-map-link" href="viz-map-fullwar.html?date=' +
      encodeURIComponent(letter.d) + '&brother=' + encodeURIComponent(letter.a) +
      '&letter=' + encodeURIComponent(letter.id) + '">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>' +
      ' View on map \u2192</a>';

    // Flags
    var flags = '';
    if (letter.bat) flags += '<span class="reader-flag rf-battle">Battle</span>';
    if (letter.ill) flags += '<span class="reader-flag rf-illness">Illness</span>';
    if (letter.dth) flags += '<span class="reader-flag rf-death">Death</span>';
    if (letter.wnd) flags += '<span class="reader-flag rf-wound">Wound</span>';

    // People tags — clickable links to People Web
    var ppl = '';
    if (letter.ppl && letter.ppl.length) {
      ppl = '<div class="reader-people"><h4>People Mentioned</h4><div class="reader-tags">' +
        letter.ppl.map(function (p) {
          return '<a href="viz-people-web.html?person=' + encodeURIComponent(p) +
            '" class="reader-tag person" onclick="event.stopPropagation()">' + esc(p) + '</a>';
        }).join('') + '</div></div>';
    }

    // Place tags — clickable links to Map, centered on location
    var plc = '';
    if (letter.plc && letter.plc.length) {
      plc = '<div class="reader-places"><h4>Places Mentioned</h4><div class="reader-tags">' +
        letter.plc.map(function (p) {
          return '<a href="viz-map-fullwar.html?date=' + encodeURIComponent(letter.d) +
            '&brother=' + encodeURIComponent(letter.a) +
            '&place=' + encodeURIComponent(p) +
            '" class="reader-tag place" onclick="event.stopPropagation()">' + esc(p) + '</a>';
        }).join('') + '</div></div>';
    }

    // Health context section
    var healthHtml = '';
    if (opts.health) {
      healthHtml = buildHealthHtml(opts.health);
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

    // Build sender pill
    var senderPage = BIO_PAGES[letter.a] || '';
    var senderPill = senderPage
      ? '<a href="' + senderPage + '" class="reader-pill" style="background:' + color + '" onclick="event.stopPropagation()">' + esc(name) + '</a>'
      : '<span class="reader-pill" style="background:' + color + '">' + esc(name) + '</span>';

    // Build recipient pill
    var recipientName = letter.r || 'Unknown';
    var recipientKey = resolveAuthorKey(recipientName);
    var recipientColor = recipientKey ? getColor(recipientKey) : '#666';
    var recipientPage = recipientKey ? BIO_PAGES[recipientKey] : '';
    var recipientPill = recipientPage
      ? '<a href="' + recipientPage + '" class="reader-pill" style="background:' + recipientColor + '" onclick="event.stopPropagation()">' + esc(recipientName) + '</a>'
      : '<span class="reader-pill" style="background:' + recipientColor + '">' + esc(recipientName) + '</span>';

    contentEl.innerHTML =
      '<div class="reader-header" style="border-bottom-color:' + color + '">' +
        '<div class="reader-correspondence">' +
          '<span class="reader-pill-label">From</span>' + senderPill +
          '<span class="reader-pill-label" style="min-width:auto">To</span>' + recipientPill +
        '</div>' +
        '<div class="reader-meta">' +
          '<span class="rm-date">' + d + '</span>' +
          ' <span class="rm-loc">from ' + esc(letter.loc || 'Unknown location') + '</span>' +
          mapLink +
          '<span class="rm-id">' + esc(letter.id) + '</span></div>' +
      '</div>' +
      (flags ? '<div class="reader-flags">' + flags + '</div>' : '') +
      healthHtml +
      ppl + plc +
      '<div class="reader-body">' + bodyText + '</div>';

    // Inject share button
    if (window.HubbellDeepLink) {
      var closeBtn = document.getElementById('hubbellReaderClose');
      var existing = overlay.querySelector('.dl-modal-share');
      if (existing) existing.remove();
      if (closeBtn) closeBtn.insertAdjacentHTML('afterend', HubbellDeepLink.letterShareBtn(letter.id));
    }

    // Bind overlay links (people/place tags rendered as overlays by _overlay.js)
    if (window.HubbellOverlay) HubbellOverlay.bindDynamic(contentEl);

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Scroll: to first highlight if present, otherwise to the top of the letter
    setTimeout(function () {
      var mark = highlightTermsList.length > 0 ? contentEl.querySelector('.reader-body mark') : null;
      if (mark) {
        mark.scrollIntoView({ block: 'center', behavior: 'smooth' });
      } else {
        var panelEl = overlay.querySelector('.reader-panel');
        if (panelEl) panelEl.scrollTop = 0;
      }
    }, 100);
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    if (currentOpts.onClose) currentOpts.onClose();
    currentOpts = {};
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
