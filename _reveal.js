/* ============================================================
   _reveal.js — Scroll-choreography controller for _reveal.css.

   Generic + standalone so any page can drop in `[data-reveal]` /
   `[data-reveal-stagger]` / `[data-parallax]` and get the same entrance +
   parallax behaviour (preservation sequence today; bios / data pages next).
   Pairs with _reveal.css; independent of _hero.js (the loop component) — the
   two compose (the loop fades in; the figure wipes in) without sharing state.

   Behaviour
   • Entrances are ONE-SHOT: an IntersectionObserver adds `is-revealed` when an
     element first enters, then stops watching it.
   • `[data-reveal-stagger]` containers get a per-child `--rvl-i` index so the
     children cascade (the CSS turns that into a transition-delay).
   • `[data-parallax="N"]` elements drift ±N px against the scroll while in
     view, via a throttled rAF loop that writes `--prlx` (transform-only).
   • prefers-reduced-motion OR no IntersectionObserver → reveal everything
     immediately and skip parallax. Parallax is also OFF on mobile (≤700px),
     where it fights touch-scroll and buys little.
   ============================================================ */

window.HubbellReveal = (function () {
  'use strict';

  // Mark JS-on so the scoped hidden states in _reveal.css apply. Runs the
  // instant this script parses — load _reveal.js (or the equivalent one-line
  // head snippet) in <head> to set this BEFORE first paint and avoid a flash.
  document.documentElement.classList.add('reveal-on');

  var reduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mqMobile = window.matchMedia ? window.matchMedia('(max-width: 700px)') : { matches: false };

  function revealAll(root) {
    var els = (root || document).querySelectorAll('[data-reveal], [data-reveal-stagger]');
    for (var i = 0; i < els.length; i++) els[i].classList.add('is-revealed');
  }

  // ── Entrance reveals (one-shot) ──────────────────────────────
  function initReveals(root) {
    var els = Array.prototype.slice.call(
      (root || document).querySelectorAll('[data-reveal], [data-reveal-stagger]')
    );
    if (!els.length) return;

    // Index stagger children so the CSS can delay each by --rvl-i.
    els.forEach(function (el) {
      if (el.hasAttribute('data-reveal-stagger')) {
        var kids = el.children, k = 0;
        for (var c = 0; c < kids.length; c++) kids[c].style.setProperty('--rvl-i', k++);
      }
    });

    if (reduced || !('IntersectionObserver' in window)) { revealAll(root); return; }

    // threshold:0 (fire on ANY intersection), NOT a positive ratio: a
    // [data-reveal="wipe"] element starts fully clip-path-hidden, and Chromium
    // counts the target's own clip-path in intersectionRatio — so its ratio is
    // pinned at 0 and a positive threshold would never fire. The negative
    // bottom rootMargin holds the trigger until the element is meaningfully up
    // into the viewport rather than just peeking at the bottom edge.
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-revealed');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -18% 0px', threshold: 0 });

    els.forEach(function (el) { io.observe(el); });
  }

  // ── Parallax drift (continuous, in-view only) ────────────────
  function initParallax(root) {
    if (reduced || mqMobile.matches) return;   // off on mobile + reduced-motion

    var els = Array.prototype.slice.call(
      (root || document).querySelectorAll('[data-parallax]')
    );
    if (!els.length) return;

    var ticking = false;
    function frame() {
      ticking = false;
      var vh = window.innerHeight, vc = vh / 2;
      for (var i = 0; i < els.length; i++) {
        var el = els[i], r = el.getBoundingClientRect();
        if (r.bottom < -60 || r.top > vh + 60) continue;        // skip well off-screen
        var peak = parseFloat(el.getAttribute('data-parallax')) || 12;  // ± px at the edges
        var prog = ((r.top + r.height / 2) - vc) / vh;          // ~ -0.5 (above) .. 0.5 (below)
        var y = -prog * 2 * peak;
        if (y > peak) y = peak; else if (y < -peak) y = -peak;  // clamp to ±peak
        el.style.setProperty('--prlx', y.toFixed(1) + 'px');
      }
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    frame();   // set initial positions
  }

  // A11y: a keyboard user can tab to a control inside a not-yet-revealed group
  // (e.g. a button still at opacity:0 before scroll reveals it). Reveal its
  // group on focus so focus never lands on an invisible element.
  function initFocusReveal() {
    document.addEventListener('focusin', function (e) {
      var host = e.target.closest && e.target.closest('[data-reveal], [data-reveal-stagger]');
      if (host && !host.classList.contains('is-revealed')) host.classList.add('is-revealed');
    });
  }

  function init(root) { initReveals(root); initParallax(root); initFocusReveal(); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { init(); });
  } else {
    init();
  }

  return { init: init, reveal: revealAll };
})();
