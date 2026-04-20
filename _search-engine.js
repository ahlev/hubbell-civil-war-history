/* ============================================================
   _search-engine.js — Shared search engine for Hubbell Letters
   Used by index.html (dropdown) and search.html (full page)
   ============================================================ */

/* ===== CONSTANTS ===== */
var AUTHOR_COLORS = {henry:'#2D5F8A',alexander:'#B8860B',james:'#4A7C59',charles:'#8B3A3A',mother:'#7B5EA7',mcdonald:'#666',luther:'#666',mcneil:'#666'};
var AUTHOR_NAMES = {henry:'Henry Hubbell',alexander:'Alexander F. Hubbell',james:'James Hubbell',charles:'Charles F. Hubbell',mother:'Frances Hubbell (Mother)',mcdonald:'R.W. McDonald',luther:'Amos Luther',mcneil:'Mary McNeil'};

/* ===== THEMATIC SYNONYMS ===== */
var THEMES = {
  illness: ['sick','ill','unwell','fever','ague','diarrhea','dysentery','health','hospital','surgeon','doctor','medicine','quinine','pills','measles','rheumatism','cough','scurvy','disease','typhoid','malaria'],
  battle: ['battle','fight','engagement','skirmish','attack','charge','shell','musket','cannon','artillery','wounded','killed','casualty','retreat','advance','picket','fortification','breastwork','rifle'],
  money: ['dollar','dollars','pay','paid','bounty','money','expense','cost','owe','debt','sutler','cent','cents','remittance','send home'],
  family: ['mother','sister','brother','home','family','father','wife','children','frances','fannie'],
  morale: ['lonely','homesick','discouraged','cheerful','hope','despair','tired','weary','courage','fear','anxious','worry','spirit','resign'],
  camp: ['camp','tent','march','drill','ration','rations','guard','picket','duty','fatigue','knapsack','blanket','regiment','company','colonel','captain']
};

/* ===== MONTH LOOKUP ===== */
var MONTH_NAMES = {january:1,february:2,march:3,april:4,may:5,june:6,july:7,august:8,september:9,october:10,november:11,december:12,
  jan:1,feb:2,mar:3,apr:4,jun:6,jul:7,aug:8,sep:9,sept:9,oct:10,nov:11,dec:12};

/* ===== EMOTIONAL QUERY TERMS ===== */
var EMOTIONAL_TERMS = ['death','killed','died','grief','mourning','sorrow','despair','agony','suffering','terrible','horrible','fear','terror','desperate','heartbroken','anguish','pain','weeping','crying','tragedy'];

/* ===== SEARCH INDEX ===== */
var searchIndex = [];
function buildIndex() {
  searchIndex = [];
  LETTERS.forEach(function(l) {
    var textLower = l.t.toLowerCase();
    var peopleLower = (l.ppl || []).map(function(p) { return p.toLowerCase(); });
    var placesLower = (l.plc || []).map(function(p) { return p.toLowerCase(); });
    var metaLower = (l.an + ' ' + l.r + ' ' + l.loc + ' ' + l.d).toLowerCase();
    searchIndex.push({
      letter: l,
      textLower: textLower,
      peopleLower: peopleLower,
      placesLower: placesLower,
      metaLower: metaLower,
      allLower: textLower + ' ' + peopleLower.join(' ') + ' ' + placesLower.join(' ') + ' ' + metaLower
    });
  });
}

/* ===== CORE SEARCH ===== */
function search(query, opts) {
  opts = opts || {};
  var maxResults = opts.maxResults || 0; // 0 = no limit
  if (!query || query.length < 2) return [];
  var terms = query.toLowerCase().split(/\s+/).filter(function(t) { return t.length > 1; });
  if (terms.length === 0) return [];

  var fullPhrase = terms.join(' ');

  // Detect date queries
  var queryYear = null;
  var queryMonth = null;
  terms.forEach(function(term) {
    if (/^\d{4}$/.test(term) && +term >= 1860 && +term <= 1870) queryYear = term;
    if (MONTH_NAMES[term] !== undefined) queryMonth = MONTH_NAMES[term];
  });

  // Detect author queries
  var queryAuthorKeys = [];
  var authorKeywords = {henry:'henry',alexander:'alexander',alex:'alexander',james:'james',charles:'charles',mother:'mother',frances:'mother',fannie:'mother'};
  terms.forEach(function(term) {
    if (authorKeywords[term] && queryAuthorKeys.indexOf(authorKeywords[term]) === -1) {
      queryAuthorKeys.push(authorKeywords[term]);
    }
  });

  // Check if any query terms are emotionally charged
  var hasEmotionalTerm = terms.some(function(t) { return EMOTIONAL_TERMS.indexOf(t) !== -1; });

  // Expand thematic terms
  var expandedTerms = [];
  terms.forEach(function(term) {
    expandedTerms.push(term);
    for (var theme in THEMES) {
      if (theme === term || THEMES[theme].indexOf(term) !== -1) {
        THEMES[theme].forEach(function(syn) {
          if (expandedTerms.indexOf(syn) === -1) expandedTerms.push(syn);
        });
      }
    }
  });

  var results = [];
  searchIndex.forEach(function(entry) {
    var score = 0;
    var matchTypes = new Set();
    var matchedTerms = [];

    terms.forEach(function(term) {
      // Exact metadata match (author, recipient, location, date) — highest weight
      if (entry.metaLower.indexOf(term) !== -1) {
        score += 15;
        matchTypes.add('meta');
        matchedTerms.push(term);
      }
      // People match
      var personMatch = entry.peopleLower.some(function(p) { return p.indexOf(term) !== -1; });
      if (personMatch) {
        score += 12;
        matchTypes.add('person');
        matchedTerms.push(term);
      }
      // Place match
      var placeMatch = entry.placesLower.some(function(p) { return p.indexOf(term) !== -1; });
      if (placeMatch) {
        score += 10;
        matchTypes.add('place');
        matchedTerms.push(term);
      }
      // Direct text match — weight by frequency
      var textMatches = (entry.textLower.match(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      if (textMatches > 0) {
        score += 5 + Math.min(textMatches * 2, 10);
        matchTypes.add('text');
        matchedTerms.push(term);
      }
    });

    // --- NEW: Phrase matching bonus ---
    if (terms.length >= 2) {
      var phraseEsc = fullPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Exact adjacent phrase
      if (entry.allLower.indexOf(fullPhrase) !== -1) {
        score += 20;
      } else {
        // Check proximity: are all terms within 50 chars of each other?
        var firstIdx = -1;
        var allClose = true;
        terms.forEach(function(t) {
          var pos = entry.allLower.indexOf(t);
          if (pos === -1) { allClose = false; return; }
          if (firstIdx === -1) firstIdx = pos;
          else if (Math.abs(pos - firstIdx) > 50) allClose = false;
        });
        if (allClose && firstIdx !== -1) {
          score += 10;
        } else {
          // Within 150 chars?
          var allMedium = true;
          firstIdx = -1;
          terms.forEach(function(t) {
            var pos = entry.allLower.indexOf(t);
            if (pos === -1) { allMedium = false; return; }
            if (firstIdx === -1) firstIdx = pos;
            else if (Math.abs(pos - firstIdx) > 150) allMedium = false;
          });
          if (allMedium && firstIdx !== -1) {
            score += 5;
          }
        }
      }
    }

    // --- NEW: Date query bonus ---
    if (queryYear || queryMonth) {
      var letterDate = entry.letter.d; // "YYYY-MM-DD"
      var parts = letterDate.split('-');
      if (queryYear && parts[0] === queryYear) {
        score += 20;
        matchTypes.add('meta');
      }
      if (queryMonth && +parts[1] === queryMonth) {
        if (queryYear && parts[0] === queryYear) {
          score += 25; // month+year combo
        } else if (!queryYear) {
          score += 15; // just month
        }
        matchTypes.add('meta');
      }
    }

    // --- NEW: Author priority ---
    if (queryAuthorKeys.length > 0) {
      if (queryAuthorKeys.indexOf(entry.letter.a) !== -1) {
        score += 25; // authored by queried person
        matchTypes.add('meta');
      }
    }

    // Thematic expansion matches (lower weight)
    expandedTerms.forEach(function(syn) {
      if (terms.indexOf(syn) !== -1) return;
      var synMatches = (entry.textLower.match(new RegExp(syn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      if (synMatches > 0) {
        score += 1 + Math.min(synMatches, 3);
        matchTypes.add('text');
      }
    });

    // Multi-term bonus
    if (matchedTerms.length > 1) score += matchedTerms.length * 3;

    // Flag bonus — boost letters with dramatic content
    if (entry.letter.bat) score += 3;
    if (entry.letter.ill) score += 2;
    if (entry.letter.dth) score += 4;
    if (entry.letter.wnd) score += 3;

    // --- Significance weight — major letters surface first ---
    var sigMult = entry.letter.sig === 'major' ? 1.35 : (entry.letter.sig === 'notable' ? 1.1 : (entry.letter.sig === 'routine' ? 0.75 : 1.0));
    score = score * sigMult;

    // --- NEW: Emotional intensity bonus ---
    if (hasEmotionalTerm) {
      var emoBonus = entry.letter.emo === 'high' ? 5 : (entry.letter.emo === 'moderate' ? 2 : 0);
      score += emoBonus;
    }

    if (score > 0) {
      results.push({
        letter: entry.letter,
        score: score,
        matchTypes: Array.from(matchTypes),
        matchedTerms: matchedTerms
      });
    }
  });

  results.sort(function(a, b) { return b.score - a.score; });
  if (maxResults > 0) results = results.slice(0, maxResults);
  return results;
}

/* ===== HELPER: HTML escape ===== */
function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

/* ===== HELPER: Highlight terms in text ===== */
function highlightTerms(text, terms, maxLen) {
  var t = text.length > maxLen ? text.substring(0, maxLen) + '...' : text;
  var escaped = esc(t);
  terms.forEach(function(term) {
    var re = new RegExp('(' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
    escaped = escaped.replace(re, '<mark>$1</mark>');
  });
  return escaped;
}

/* ===== HELPER: Sentence-aware best excerpt ===== */
function findBestExcerpt(text, terms, radius) {
  // Try sentence-based approach first
  var sentences;
  try { sentences = text.replace(/\n+/g, ' ').split(/(?<=[.!?])\s+/); }
  catch(e) { sentences = text.replace(/\n+/g, ' ').split(/[.!?]\s+/); }
  if (sentences.length > 1) {
    var bestSentences = [];
    sentences.forEach(function(s, i) {
      var sl = s.toLowerCase();
      var hitCount = 0;
      terms.forEach(function(t) {
        if (sl.indexOf(t.toLowerCase()) !== -1) hitCount++;
      });
      if (hitCount > 0) bestSentences.push({ text: s, score: hitCount, idx: i });
    });
    bestSentences.sort(function(a, b) { return b.score - a.score || a.idx - b.idx; });
    if (bestSentences.length > 0) {
      var excerpt = bestSentences[0].text;
      if (bestSentences.length > 1 && excerpt.length < 120) {
        excerpt += ' ' + bestSentences[1].text;
      }
      if (excerpt.length > radius * 2) excerpt = excerpt.substring(0, radius * 2) + '...';
      var startIdx = sentences.indexOf(bestSentences[0].text);
      if (startIdx > 0) excerpt = '...' + excerpt;
      return excerpt;
    }
  }

  // Fallback: position-based
  var tl = text.toLowerCase();
  var bestPos = -1;
  var bestScore = 0;
  terms.forEach(function(term) {
    var idx = tl.indexOf(term.toLowerCase());
    if (idx !== -1) {
      var nearScore = 0;
      terms.forEach(function(t2) {
        var nearby = tl.indexOf(t2.toLowerCase(), Math.max(0, idx - radius));
        if (nearby !== -1 && nearby < idx + radius) nearScore++;
      });
      if (nearScore > bestScore || (nearScore === bestScore && idx < bestPos)) {
        bestScore = nearScore;
        bestPos = idx;
      }
    }
  });
  if (bestPos === -1) return text.substring(0, radius * 2);
  var start = Math.max(0, bestPos - radius);
  var end = Math.min(text.length, bestPos + radius);
  var excerpt = (start > 0 ? '...' : '') + text.substring(start, end) + (end < text.length ? '...' : '');
  return excerpt;
}

/* ===== AUTO-BUILD INDEX ===== */
if (typeof LETTERS !== 'undefined') buildIndex();
