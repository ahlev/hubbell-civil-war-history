/* ============================================================
   _hero.js — Lazy poster→loop controller for the .hero-loop component.

   Pairs with _hero.css. Kept standalone and generic so every page that drops
   in a `<figure class="hero-loop" data-hero-loop>` gets the same behaviour for
   free (preservation sequence today; brother bios / data heroes next).

   Design notes / why this is its own file rather than folded into _cinematic.js:
   _cinematic.js is the Leaflet map-tour player (window.CinematicPlayer) — it
   has no generic scroll/fade helpers and isn't loaded on most pages. This
   controller instead mirrors the v2 landing page's proven media pattern
   (data-src swap + preload="none" + poster) in ~50 self-contained lines.

   Contract per figure:
   • Poster <img> paints immediately (CSS reserves the box → no layout shift).
   • When the figure nears the viewport, the <video data-src>'s src is set
     once, it plays muted + looping, and fades in over the poster.
   • The loop plays ONLY while on screen (paused when scrolled away) so a page
     with five stages never runs five videos at once.
   • prefers-reduced-motion → the loop is never loaded; the poster is the hero.
   ============================================================ */

window.HubbellHero = (function () {
  'use strict';

  var reduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Set the real source(s) exactly once, and fade the loop in when it can paint.
  // Two markup forms are supported:
  //   • <video data-src="loop.webm">                     (single source)
  //   • <video><source data-src="a.webm"><source data-src="a.mp4"></video>
  //     (the browser picks the first type it supports — webm for Chrome/Firefox/
  //     Android, mp4/h264 for Safari/iOS — so loops play everywhere).
  function ensureLoaded(fig, video) {
    if (video.dataset.heroLoaded) return;

    var reveal = function () { fig.classList.add('is-playing'); };
    // 'loadeddata' = first frame decoded; 'playing' = actually rolling. Either
    // is a safe moment to cross-fade the loop over the poster.
    var armReveal = function () {
      video.addEventListener('loadeddata', reveal, { once: true });
      video.addEventListener('playing', reveal, { once: true });
    };

    var sources = video.querySelectorAll('source[data-src]');
    if (sources.length) {
      var any = false;
      for (var i = 0; i < sources.length; i++) {
        if (sources[i].dataset.src) { sources[i].src = sources[i].dataset.src; any = true; }
      }
      if (!any) return;
      video.dataset.heroLoaded = '1';
      armReveal();
      video.load();   // re-evaluate <source> list now that srcs are populated
      return;
    }

    var src = video.getAttribute('data-src');
    if (!src) return;
    video.dataset.heroLoaded = '1';
    armReveal();
    video.src = src;
  }

  // A <video> that carries its URL on child <source> elements has an EMPTY
  // video.src — so a naive `if (!video.src)` guard wrongly skips play() and the
  // loop freezes on its first frame. Treat a populated source list (heroLoaded)
  // or a resolved currentSrc as "has a source".
  function hasSource(video) {
    return !!(video && (video.src || video.currentSrc || video.dataset.heroLoaded));
  }

  function tryPlay(video) {
    if (!hasSource(video)) return;
    var p = video.play();
    // Autoplay can be blocked until a user gesture; we retry on first input.
    if (p && p.catch) p.catch(function () {});
  }

  function init(root) {
    root = root || document;
    var figs = Array.prototype.slice.call(
      root.querySelectorAll('[data-hero-loop]')
    );
    if (!figs.length) return;

    // Reduced motion: leave every poster in place, load no video. Done.
    if (reduced) return;

    if (!('IntersectionObserver' in window)) {
      // Old browser: just load + play them (still poster-first).
      figs.forEach(function (f) {
        var v = f.querySelector('.hero-loop__video');
        if (v) { ensureLoaded(f, v); tryPlay(v); }
      });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target.querySelector('.hero-loop__video');
        if (!v) return;
        if (e.isIntersecting) {
          ensureLoaded(e.target, v);   // lazy: load only as it nears view
          tryPlay(v);
        } else if (hasSource(v) && !v.paused) {
          v.pause();                   // off screen → stop burning cycles
        }
      });
    }, { rootMargin: '200px 0px', threshold: 0.01 });

    figs.forEach(function (f) { io.observe(f); });

    // If the browser blocked autoplay, the first interaction kicks any
    // already-loaded, on-screen loop back into life.
    var resume = function () {
      figs.forEach(function (f) {
        var v = f.querySelector('.hero-loop__video');
        if (hasSource(v) && v.paused) tryPlay(v);
      });
    };
    ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) {
      window.addEventListener(ev, resume, { once: true, passive: true });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { init(); });
  } else {
    init();
  }

  return { init: init, ensureLoaded: ensureLoaded };
})();
