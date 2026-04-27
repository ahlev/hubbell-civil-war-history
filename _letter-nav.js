/* ─── _letter-nav.js — Shared prev/next + author-lock logic ───
   Used by _reader.js (HubbellReader) and _overlay.js (HubbellOverlay).
   Depends on: _search-data.js (LETTERS[]) or _overlay-data.js (LETTER_INDEX{})
   ─────────────────────────────────────────────────────────── */

window.HubbellLetterNav = (function () {
  'use strict';

  var AUTHOR_COLORS = {
    henry: '#2D5F8A', alexander: '#B8860B',
    james: '#4A7C59', charles: '#8B3A3A', mother: '#7B5EA7'
  };
  var AUTHOR_NAMES = {
    henry: 'Henry', alexander: 'Alexander',
    james: 'James', charles: 'Charles', mother: 'Frances'
  };

  var mode = 'author'; // 'author' | 'date'
  var sortedIds = null; // lazy
  var idMeta = null;    // lazy: { id -> { d, a } }

  function buildIndex() {
    if (sortedIds) return;
    idMeta = {};

    // Prefer LETTERS[] (richer, from _search-data.js)
    var letters = null;
    try { letters = typeof LETTERS !== 'undefined' && Array.isArray(LETTERS) ? LETTERS : null; }
    catch (e) { /* const scoping */ }

    if (letters && letters.length) {
      for (var i = 0; i < letters.length; i++) {
        var l = letters[i];
        idMeta[l.id] = { d: l.d || l.date, a: l.a || l.author };
      }
    } else if (window.LETTER_INDEX) {
      for (var id in LETTER_INDEX) {
        if (!LETTER_INDEX.hasOwnProperty(id)) continue;
        var m = LETTER_INDEX[id];
        idMeta[id] = { d: m.d, a: m.a };
      }
    }

    // Sort by date, then by ID for stable order
    sortedIds = Object.keys(idMeta).sort(function (a, b) {
      var cmp = (idMeta[a].d || '').localeCompare(idMeta[b].d || '');
      return cmp !== 0 ? cmp : a.localeCompare(b);
    });
  }

  function findAdjacent(letterId, dir) {
    buildIndex();
    if (!sortedIds || !sortedIds.length) return null;
    var idx = sortedIds.indexOf(letterId);
    if (idx < 0) return null;

    var author = idMeta[letterId] ? idMeta[letterId].a : null;

    if (mode === 'author' && author) {
      var i = idx + dir;
      while (i >= 0 && i < sortedIds.length) {
        if (idMeta[sortedIds[i]].a === author) return sortedIds[i];
        i += dir;
      }
      return null;
    }

    // Date mode: simple +/- 1
    var next = idx + dir;
    return (next >= 0 && next < sortedIds.length) ? sortedIds[next] : null;
  }

  function getAuthor(letterId) {
    buildIndex();
    return idMeta[letterId] ? idMeta[letterId].a : null;
  }

  function getAuthorName(letterId) {
    var a = getAuthor(letterId);
    return a ? (AUTHOR_NAMES[a] || a) : '';
  }

  function getAuthorColor(letterId) {
    var a = getAuthor(letterId);
    return a ? (AUTHOR_COLORS[a] || '#666') : '#666';
  }

  return {
    findAdjacent: findAdjacent,
    setMode: function (m) { mode = m; },
    getMode: function () { return mode; },
    toggleMode: function () { mode = mode === 'author' ? 'date' : 'author'; return mode; },
    getAuthor: getAuthor,
    getAuthorName: getAuthorName,
    getAuthorColor: getAuthorColor
  };
})();
