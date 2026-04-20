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

  function getColor(author) {
    if (window.AUTHOR_COLORS) return window.AUTHOR_COLORS[author] || '#666';
    return COLORS[author] || '#666';
  }
  function getName(author, fallback) {
    if (window.AUTHOR_NAMES) return window.AUTHOR_NAMES[author] || fallback || author;
    return NAMES[author] || fallback || author;
  }

  function esc(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function formatDate(dateStr) {
    var months = ['','January','February','March','April','May','June','July','August','September','October','November','December'];
    return dateStr.replace(/^(\d{4})-(\d{2})-(\d{2})$/, function (m, y, mo, dy) {
      return months[parseInt(mo)] + ' ' + parseInt(dy) + ', ' + y;
    });
  }

  function formatBody(text) {
    // Collapse single newlines to spaces, preserve double newlines as paragraph breaks
    return text.replace(/([^\n])\n([^\n])/g, '$1 $2');
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

    // Find letter data
    var letter = opts.letter || findLetter(letterId);
    if (!letter) return;

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

    // Place tags — clickable links to Map
    var plc = '';
    if (letter.plc && letter.plc.length) {
      plc = '<div class="reader-places"><h4>Places Mentioned</h4><div class="reader-tags">' +
        letter.plc.map(function (p) {
          return '<a href="viz-map-fullwar.html?date=' + encodeURIComponent(letter.d) +
            '&brother=' + encodeURIComponent(letter.a) +
            '" class="reader-tag place" onclick="event.stopPropagation()">' + esc(p) + '</a>';
        }).join('') + '</div></div>';
    }

    // Body text
    var bodyText = formatBody(esc(letter.t || ''));

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

    contentEl.innerHTML =
      '<div class="reader-header" style="border-bottom-color:' + color + '">' +
        '<h3 style="color:' + color + '">' + esc(name) + '</h3>' +
        '<div class="reader-meta">' + d + ' &mdash; ' + esc(letter.loc || 'Unknown location') +
          '<br>To: ' + esc(letter.r || 'Unknown') +
          '<br>' + mapLink +
          '<br><span class="rm-id">' + esc(letter.id) + '</span></div>' +
      '</div>' +
      (flags ? '<div class="reader-flags">' + flags + '</div>' : '') +
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

    // Scroll to first highlight
    if (highlightTermsList.length > 0) {
      setTimeout(function () {
        var mark = contentEl.querySelector('.reader-body mark');
        if (mark) mark.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }, 100);
    }
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
