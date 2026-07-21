/* Their Own Words — game engine.
   Data: _learn-data.js (TOW_ACTS, TOW_BONDS, TOW_QUESTIONS — generated,
   validated by scripts/validate_learn_quotes.py). Reader: _reader.js
   (HubbellReader.open(id, {excerpt}) — the lamplight overlay; closing it
   leaves game state untouched because the game never unmounts).
   All dynamic text lands via textContent (no HTML injection anywhere).
   State is exposed on window.TOW for the Playwright verification run. */
(function () {
  'use strict';

  var STORE_KEY = 'hubTOWProgress';
  var REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var PEOPLE = {
    henry:     { name: 'Henry',     color: '#5A8BC4', poster: '/experience-v2/assets/brothers/web/window-henry-v1.webp',      loop: '/experience-v2/assets/brothers/loops/loop-henry',         crop: { pz: 1.6,  px: '35%' } },
    alexander: { name: 'Alexander', color: '#D4A843', poster: '/experience-v2/assets/brothers/web/window-alexander-fav.webp', loop: '/experience-v2/assets/brothers/loops/loop-alexander-fav', crop: { pz: 1.75 } },
    james:     { name: 'James',     color: '#6BAF6B', poster: '/experience-v2/assets/brothers/web/window-james-v2.webp',      loop: '/experience-v2/assets/brothers/loops/loop-james-wide',    crop: { pz: 1.3, opy: '62%', py: '74%' } },
    charles:   { name: 'Charles',   color: '#C46A5A', poster: '/experience-v2/assets/brothers/web/window-charles-v1.webp',    loop: '/experience-v2/assets/brothers/loops/loop-charles',       crop: { pz: 1.75, px: '70%' } },
    mother:    { name: 'Frances',   color: '#7B5EA7', poster: '/experience-v2/assets/brothers/web/window-frances.webp',       loop: null,                                                       crop: { pz: 1 } }
  };
  var ROMAN = ['I', 'II', 'III', 'IV', 'V'];
  var THEME_META = {
    camp:   { label: 'Camp & March', icon: '▲' },
    body:   { label: 'The Body',     icon: '✚' },
    purse:  { label: 'The Purse',    icon: '$' },
    nation: { label: 'The Nation',   icon: '★' },
    family: { label: 'The Family',   icon: '✉' }
  };
  var THEME_ORDER = ['camp', 'body', 'purse', 'nation', 'family'];

  var QBY = {};
  TOW_QUESTIONS.forEach(function (q) { (QBY[q.act] = QBY[q.act] || []).push(q); });

  // ── state ──
  var S = null;
  function freshState() {
    return { screen: 'overture', act: 0, qi: 0, score: 0, streak: 0, bestStreak: 0,
             unlocked: 1, finished: false,
             bonds: { henry: 0, alexander: 0, james: 0, charles: 0, mother: 0 },
             answers: {} };
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) {}
  }
  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return null;
      var s = JSON.parse(raw);
      if (!s || typeof s.score !== 'number' || !s.bonds) return null;
      return s;
    } catch (e) { return null; }
  }

  // ── DOM builders (textContent only — no HTML injection) ──
  function h(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function add(parent) {
    for (var i = 1; i < arguments.length; i++) {
      var c = arguments[i];
      if (c == null) continue;
      parent.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return parent;
  }
  var root;

  // Ring portrait — the shared circular-crop grammar from the landing rings.
  function ring(author, sizeCls) {
    var p = PEOPLE[author];
    var c = p.crop || {};
    var s = h('span', 'tow-ring' + (sizeCls ? ' ' + sizeCls : ''));
    s.dataset.author = author;
    if (p.loop) s.dataset.loop = p.loop;
    s.style.setProperty('--c', p.color);
    if (c.pz) s.style.setProperty('--pz', c.pz);
    if (c.px) s.style.setProperty('--px', c.px);
    if (c.py) s.style.setProperty('--py', c.py);
    if (c.opy) s.style.setProperty('--opy', c.opy);
    var img = h('img');
    img.src = p.poster; img.alt = ''; img.loading = 'lazy';
    s.appendChild(img);
    return s;
  }
  function animateRings(scope) {
    if (REDUCED) return;
    (scope || document).querySelectorAll('.tow-ring[data-loop]').forEach(function (r) {
      if (r.querySelector('video')) return;
      var v = document.createElement('video');
      v.muted = true; v.loop = true; v.playsInline = true;
      v.setAttribute('playsinline', ''); v.preload = 'none';
      v.setAttribute('aria-hidden', 'true');
      ['webm', 'mp4'].forEach(function (ext) {
        var src = document.createElement('source');
        src.src = r.dataset.loop + '.' + ext; src.type = 'video/' + ext;
        v.appendChild(src);
      });
      r.appendChild(v);
      var pr = v.play(); if (pr && pr.catch) pr.catch(function () {});
    });
  }

  function mult() { return S.streak >= 5 ? 1.5 : (S.streak >= 3 ? 1.25 : 1); }
  function clearEl(e) { while (e.firstChild) e.removeChild(e.firstChild); }

  // ── screens ──
  function show(screen) {
    S.screen = screen;
    root.querySelectorAll('.tow-screen').forEach(function (s) {
      s.classList.toggle('on', s.dataset.screen === screen);
    });
    window.scrollTo(0, 0);
  }

  function renderOverture() {
    var o = root.querySelector('[data-screen="overture"]');
    clearEl(o);
    var hero = h('div', 'tow-hero');
    add(hero,
      h('div', 'tow-kicker', 'HUBBELL FAMILY ARCHIVE · A LEARNING GAME'),
      h('h1', 'tow-title', 'Their Own Words'),
      h('p', 'tow-sub', 'Four brothers wrote the Civil War as they lived it — and their mother wrote it from the kitchen window. Twenty-five of their sentences, five years of war. How much of their war do you know?'));
    var rr = h('div', 'tow-ringrow');
    ['henry', 'alexander', 'james', 'charles', 'mother'].forEach(function (a) {
      rr.appendChild(ring(a, 'tow-ring--hero'));
    });
    add(hero, rr,
      h('p', 'tow-note', 'Every quotation is verbatim from the family’s 272 letters. Wrong answers teach too — and every question opens doors into the real archive.'));
    o.appendChild(hero);

    var rail = h('div', 'tow-actrail');
    TOW_ACTS.forEach(function (a) {
      var locked = a.act > S.unlocked;
      var qs = QBY[a.act] || [];
      var b = h('button', 'tow-act' + (locked ? ' locked' : ''));
      b.dataset.act = a.act;
      if (locked) b.disabled = true;
      add(b,
        h('span', 'tow-act-years', a.years),
        h('span', 'tow-act-title', 'Act ' + ROMAN[a.act - 1] + ' — ' + a.title),
        h('span', 'tow-act-scene', a.scene));
      var dots = h('span', 'tow-act-dots');
      var answered = 0;
      THEME_ORDER.forEach(function (t) {
        var q = qs.filter(function (x) { return x.theme === t; })[0];
        var ans = q && S.answers[q.qid];
        if (ans) answered += 1;
        var d = h('span', 'tow-tdot' + (ans ? (ans.correct ? ' done' : ' seen') : ''),
                  THEME_META[t].icon);
        d.title = THEME_META[t].label;
        dots.appendChild(d);
      });
      add(b, dots,
        locked ? h('span', 'tow-act-lock', 'Finish the act before it to unlock')
               : h('span', 'tow-act-go', (answered >= 5 ? 'Replay this act' :
                   answered > 0 ? 'Continue — ' + answered + ' of 5 answered' : 'Play this act') + ' →'));
      if (!locked) b.addEventListener('click', function () { startAct(a.act); });
      rail.appendChild(b);
    });
    o.appendChild(rail);

    if (Object.keys(S.answers).length) {
      var row = h('div', 'tow-reset-row');
      var reset = h('button', 'tow-reset', 'Start over from the beginning');
      reset.addEventListener('click', function () {
        if (confirm('Erase your progress and start over?')) {
          S = freshState(); save(); renderOverture(); show('overture');
        }
      });
      row.appendChild(reset);
      o.appendChild(row);
    }
    animateRings(o);
  }

  function startAct(act) {
    S.act = act;
    var qs = QBY[act];
    S.qi = 0;
    for (var i = 0; i < qs.length; i++) {
      if (!S.answers[qs[i].qid]) { S.qi = i; break; }
      if (i === qs.length - 1) S.qi = 0;
    }
    save();
    renderQuestion();
    show('stage');
  }

  function currentQ() { return QBY[S.act][S.qi]; }

  function bondRail() {
    var w = h('div', 'tow-bonds');
    w.setAttribute('aria-label', 'How well you know each family member');
    Object.keys(PEOPLE).forEach(function (a) {
      var v = S.bonds[a] || 0, max = TOW_BONDS.thresholds[2];
      var ti = TOW_BONDS.thresholds.filter(function (t) { return v >= t; }).length;
      var title = ti > 0 ? TOW_BONDS.titles[ti - 1] : TOW_BONDS.titles[0];
      var d = h('div', 'tow-bond');
      d.dataset.author = a;
      d.title = PEOPLE[a].name + ' — ' + title + ' (' + v + '/' + max + ')';
      d.style.setProperty('--c', PEOPLE[a].color);
      d.style.setProperty('--p', Math.min(100, Math.round(v / max * 100)));
      add(d, ring(a, 'tow-ring--chip'), h('span', 'tow-bond-name', PEOPLE[a].name));
      w.appendChild(d);
    });
    return w;
  }

  function renderQuestion() {
    var q = currentQ();
    var actMeta = TOW_ACTS[S.act - 1];
    var st = root.querySelector('[data-screen="stage"]');
    clearEl(st);

    var banner = h('div', 'tow-banner');
    banner.style.setProperty('--acc', PEOPLE[q.author].color);
    add(banner,
      h('span', 'tow-banner-act', 'ACT ' + ROMAN[q.act - 1] + ' · ' + actMeta.years +
        ' — ' + actMeta.title.toUpperCase()),
      h('span', 'tow-banner-q', (S.qi + 1) + ' of 5 · ' + THEME_META[q.theme].label +
        (S.answers[q.qid] ? ' · replay' : '')),
      h('span', 'tow-banner-score', 'Score ' + S.score +
        (S.streak >= 3 ? ' · streak ×' + mult() : '')));
    st.appendChild(banner);

    var grid = h('div', 'tow-stagegrid');
    var main = h('div', 'tow-stagemain');

    var fig = h('figure', 'tow-quote');
    var bq = h('blockquote', null, q.excerpt);
    var cap = h('figcaption');
    add(cap, ring(q.author, 'tow-ring--attr'), h('span', null, q.attribution));
    add(fig, bq, cap);
    main.appendChild(fig);

    var qb = h('div', 'tow-qblock');
    qb.id = 'towQBlock';
    qb.appendChild(h('h2', 'tow-stem', q.stem));
    var choices = h('div', 'tow-choices');
    choices.setAttribute('role', 'group');
    choices.setAttribute('aria-label', 'Answer choices');
    q.choices.forEach(function (c, i) {
      var b = h('button', 'tow-choice');
      b.dataset.i = i;
      add(b, h('span', 'tow-choice-key', 'ABCD'[i]), h('span', null, c));
      b.addEventListener('click', function () { answer(i); });
      choices.appendChild(b);
    });
    qb.appendChild(choices);
    var fb = h('div', 'tow-feedback');
    fb.id = 'towFeedback';
    fb.setAttribute('aria-live', 'polite');
    qb.appendChild(fb);
    main.appendChild(qb);

    var side = h('aside', 'tow-stageside');
    side.appendChild(bondRail());
    add(grid, main, side);
    st.appendChild(grid);

    if (REDUCED) qb.classList.add('on');
    else setTimeout(function () { qb.classList.add('on'); }, 650);
    animateRings(st);
    save();
  }

  function stripLead(s) {
    return String(s || '').replace(/^That's the truth of it\.\s*/, '');
  }

  function answer(i) {
    var q = currentQ();
    var st = root.querySelector('[data-screen="stage"]');
    var choicesEl = st.querySelector('.tow-choices');
    if (!choicesEl || choicesEl.classList.contains('decided')) return;
    var correct = i === q.answerIdx;
    var already = S.answers[q.qid];
    if (!already) {
      if (correct) {
        S.streak += 1;
        S.bestStreak = Math.max(S.bestStreak, S.streak);
        S.score += Math.round(100 * mult());
        S.bonds[q.author] = Math.min(TOW_BONDS.thresholds[2], (S.bonds[q.author] || 0) + 1);
      } else {
        S.streak = 0;
      }
      S.answers[q.qid] = { choice: i, correct: correct, spokes: [] };
      save();
    }
    choicesEl.classList.add('decided');
    choicesEl.querySelectorAll('.tow-choice').forEach(function (b, bi) {
      b.disabled = true;
      if (bi === q.answerIdx) b.classList.add('is-right');
      else if (bi === i) b.classList.add('is-chosen');
      else b.classList.add('is-dim');
    });
    var scoreEl = st.querySelector('.tow-banner-score');
    if (scoreEl) scoreEl.textContent = 'Score ' + S.score +
      (S.streak >= 3 ? ' · streak ×' + mult() : '');

    var fb = st.querySelector('#towFeedback');
    clearEl(fb);
    if (correct) {
      fb.appendChild(h('div', 'tow-fb-lead right', 'That’s the truth of it.'));
      fb.appendChild(h('p', null, stripLead(q.whyRight)));
    } else {
      fb.appendChild(h('div', 'tow-fb-lead wrong', 'A fair guess — but the letters say otherwise.'));
      var ww = (q.whyWrong && (q.whyWrong[String(i)] || q.whyWrong['default'])) || '';
      if (ww) fb.appendChild(h('p', null, ww));
      var pr = h('p', 'tow-fb-right');
      add(pr, h('strong', null, 'The answer: ' + q.choices[q.answerIdx] + '. '),
          stripLead(q.whyRight));
      fb.appendChild(pr);
    }
    var ex = h('div', 'tow-expand');
    add(ex, h('span', 'tow-expand-k', 'WHAT WAS REALLY HAPPENING'),
        h('p', null, q.expansion));
    fb.appendChild(ex);

    var spokes = h('div', 'tow-spokes');
    var readBtn = h('button', 'tow-spoke', 'Read the whole letter');
    readBtn.addEventListener('click', function () {
      creditSpoke(q, 'letter');
      if (window.HubbellReader) {
        // same wiring as the map page: the body flag suppresses game keys
        // while the lamplight overlay is up; onClose restores them
        document.body.classList.add('letter-reader-open');
        HubbellReader.open(q.letterId, {
          excerpt: q.excerpt,
          onClose: function () { document.body.classList.remove('letter-reader-open'); }
        });
      }
    });
    spokes.appendChild(readBtn);
    [['map', q.spokes.map, 'See this moment on the map'],
     ['bio', 'who-they-were.html#' + q.spokes.bio, 'Meet ' + PEOPLE[q.author].name],
     ['extra', q.spokes.extra, 'Open the Wellness Ledger']].forEach(function (row) {
      if (!row[1]) return;
      var a = h('a', 'tow-spoke', row[2]);
      a.href = row[1]; a.target = '_blank'; a.rel = 'noopener';
      a.addEventListener('click', function () { creditSpoke(q, row[0]); });
      spokes.appendChild(a);
    });
    fb.appendChild(spokes);

    var nextBtn = h('button', 'tow-next', S.qi < 4 ? 'Next question →' : 'Close the act →');
    nextBtn.id = 'towNext';
    nextBtn.addEventListener('click', next);
    fb.appendChild(nextBtn);
    fb.classList.add('on');
  }

  function creditSpoke(q, kind) {
    var rec = S.answers[q.qid];
    if (!rec) return;
    rec.spokes = rec.spokes || [];
    if (rec.spokes.indexOf(kind) !== -1) return;
    rec.spokes.push(kind);
    if (rec.spokes.length <= 2) {
      S.bonds[q.author] = Math.min(TOW_BONDS.thresholds[2], (S.bonds[q.author] || 0) + 1);
      var side = root.querySelector('.tow-stageside');
      if (side) {
        clearEl(side);
        side.appendChild(bondRail());
        var chip = side.querySelector('.tow-bond[data-author="' + q.author + '"]');
        if (chip) chip.classList.add('pulse');
        animateRings(side);
      }
    }
    save();
  }

  function next() {
    if (S.qi < 4) { S.qi += 1; save(); renderQuestion(); }
    else renderInterlude();
  }

  function renderInterlude() {
    var a = TOW_ACTS[S.act - 1];
    var qs = QBY[S.act];
    var right = qs.filter(function (q) {
      return S.answers[q.qid] && S.answers[q.qid].correct;
    }).length;
    if (S.act >= S.unlocked && S.act < 5) S.unlocked = S.act + 1;
    var isFinale = S.act === 5;
    if (isFinale) S.finished = true;
    save();

    var it = root.querySelector('[data-screen="interlude"]');
    clearEl(it);
    var box = h('div', 'tow-inter');
    add(box,
      h('span', 'tow-inter-k', 'ACT ' + ROMAN[S.act - 1] + ' · CLOSED'),
      h('h2', null, a.title),
      h('p', 'tow-inter-score', right + ' of 5 first time through · score ' + S.score));
    if (a.memorial) {
      var mem = h('div', 'tow-memorial');
      add(mem, ring(a.memorial, 'tow-ring--mem'),
        h('span', 'tow-mem-name', PEOPLE[a.memorial].name + ' Hubbell'),
        h('span', 'tow-mem-dates', a.memorial === 'henry'
          ? '34th New York · killed at Antietam, September 17, 1862'
          : '153rd New York · died October 19, 1865, on the journey home'));
      box.appendChild(mem);
    }
    box.appendChild(h('p', 'tow-inter-bridge', a.bridge));
    var go = h('button', 'tow-next', isFinale ? 'See what the war left →'
      : 'On to Act ' + ROMAN[S.act] + ' · ' + TOW_ACTS[S.act].years + ' →');
    go.id = 'towInterNext';
    go.addEventListener('click', function () {
      if (isFinale) { renderFinale(); show('finale'); }
      else startAct(S.act + 1);
    });
    var home = h('button', 'tow-quiet', 'Back to all acts');
    home.addEventListener('click', function () { renderOverture(); show('overture'); });
    add(box, go, home);
    it.appendChild(box);
    animateRings(it);
    show('interlude');
  }

  function renderFinale() {
    var f = root.querySelector('[data-screen="finale"]');
    clearEl(f);
    var right = Object.keys(S.answers).filter(function (k) {
      return S.answers[k].correct;
    }).length;

    var fin = h('div', 'tow-fin');
    add(fin,
      h('span', 'tow-inter-k', 'THE WAR IN FIVE ACTS · COMPLETE'),
      h('h2', null, 'Two came home. Their words became an archive.'),
      h('p', 'tow-fin-score', right + ' of ' + TOW_QUESTIONS.length +
        ' on the first try · final score ' + S.score +
        (S.bestStreak >= 3 ? ' · best streak ' + S.bestStreak : '')),
      h('h3', 'tow-fin-h', 'What you covered'));

    var mx = h('div', 'tow-matrix');
    mx.setAttribute('aria-label', 'What you covered');
    var head = h('div', 'tow-mx-row tow-mx-head');
    head.appendChild(h('span'));
    THEME_ORDER.forEach(function (t) {
      var s = h('span', null, THEME_META[t].icon);
      s.title = THEME_META[t].label;
      head.appendChild(s);
    });
    mx.appendChild(head);
    TOW_ACTS.forEach(function (a) {
      var row = h('div', 'tow-mx-row');
      row.appendChild(h('span', 'tow-mx-act', a.years));
      THEME_ORDER.forEach(function (t) {
        var q = (QBY[a.act] || []).filter(function (x) { return x.theme === t; })[0];
        var ans = q && S.answers[q.qid];
        var cell = h('span', 'tow-mx-cell ' + (ans ? (ans.correct ? 'solid' : 'hollow') : 'empty'));
        if (q) {
          cell.style.setProperty('--c', PEOPLE[q.author].color);
          cell.title = q.curriculum;
        }
        row.appendChild(cell);
      });
      mx.appendChild(row);
    });
    fin.appendChild(mx);
    var mxCaption = h('p', 'tow-fin-note tow-mx-caption', 'Tap any square for the lesson it carried. Hollow squares are ones the letters had to teach you — replay any act to make them solid.');
    mx.querySelectorAll('.tow-mx-cell').forEach(function (cell) {
      cell.setAttribute('tabindex', '0');
      function reveal() { if (cell.title) mxCaption.textContent = cell.title; }
      cell.addEventListener('click', reveal);
      cell.addEventListener('focus', reveal);
    });
    fin.appendChild(mxCaption);

    fin.appendChild(h('h3', 'tow-fin-h', 'Who you came to know'));
    var bonds = h('div', 'tow-fin-bonds');
    Object.keys(PEOPLE).sort(function (a, b) {
      return (S.bonds[b] || 0) - (S.bonds[a] || 0);
    }).forEach(function (a) {
      var v = S.bonds[a] || 0;
      var ti = TOW_BONDS.thresholds.filter(function (t) { return v >= t; }).length;
      var d = h('div', 'tow-fin-bond');
      var nm = h('span', 'tow-fin-name', PEOPLE[a].name);
      nm.style.color = PEOPLE[a].color;
      add(d, ring(a, 'tow-ring--fin'), nm,
          h('span', 'tow-fin-title', ti > 0 ? TOW_BONDS.titles[ti - 1] : TOW_BONDS.titles[0]));
      bonds.appendChild(d);
    });
    fin.appendChild(bonds);

    fin.appendChild(h('h3', 'tow-fin-h', 'The archive is open'));
    var doors = h('div', 'tow-doors');
    [['hubbell-dashboard.html', 'Parallel Lives', 'every letter on one timeline'],
     ['viz-map-fullwar.html', 'A Map That Moves', 'follow them day by day'],
     ['viz-health-ledger.html', 'The Wellness Ledger', 'the war against their bodies'],
     ['who-they-were.html', 'Who They Were', 'the five of them, in full']].forEach(function (row) {
      var d = h('a', 'tow-door', row[1]);
      d.href = row[0];
      d.appendChild(h('span', null, row[2]));
      doors.appendChild(d);
    });
    fin.appendChild(doors);

    var rrow = h('div', 'tow-reset-row');
    var back = h('button', 'tow-quiet', 'Back to the acts');
    back.addEventListener('click', function () { renderOverture(); show('overture'); });
    rrow.appendChild(back);
    fin.appendChild(rrow);
    f.appendChild(fin);
    animateRings(f);
  }

  // ── keyboard ──
  document.addEventListener('keydown', function (e) {
    if (!S || S.screen !== 'stage') return;
    if (document.body.classList.contains('letter-reader-open')) return;
    var k = e.key.toUpperCase();
    var idx = 'ABCD'.indexOf(k);
    if (idx === -1 && /^[1-4]$/.test(k)) idx = +k - 1;
    var undecided = root.querySelector('.tow-choices:not(.decided)');
    if (idx > -1 && undecided) { answer(idx); e.preventDefault(); return; }
    if (e.key === 'Enter' && !undecided) {
      var btn = root.querySelector('#towNext');
      if (btn) { btn.click(); e.preventDefault(); }
    }
  });

  // ── boot ──
  function init() {
    root = document.getElementById('tow-root');
    if (!root) return;
    S = load() || freshState();
    renderOverture();
    if (S.finished && S.screen === 'finale') { renderFinale(); show('finale'); }
    else show('overture');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // test / diagnostics surface
  window.TOW = {
    state: function () { return JSON.parse(JSON.stringify(S)); },
    startAct: startAct,
    answer: answer,
    next: next,
    _reset: function () { S = freshState(); save(); renderOverture(); show('overture'); }
  };
})();
