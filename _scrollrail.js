/* ============================================================================
   _scrollrail.js — sleek, tap-and-draggable mobile scroll rail (site-wide)

   Self-mounting. On a mobile page it appends a fixed right-rail scrollbar that
   reflects the document's scroll position and lets the user drag (or flick) the
   thumb to scroll. Pairs with _scrollrail.css. Desktop: CSS keeps it hidden.

   Default target is the document scroller (window scroll — what every full page
   uses). The reader's own container-bound rail (in reader.html) is separate and
   unaffected; this module deliberately does not touch it.

   Public hook: window.HubbellScrollRail.mount(opts?) — opts.scroller lets a page
   bind the rail to a specific overflow container instead of the document.
   ============================================================================ */
(function(){
  if (window.HubbellScrollRail) return;

  function mount(opts){
    opts = opts || {};
    // body/document scroll: read position from scrollingElement, listen on window
    var docMode  = !opts.scroller;
    var scroller = opts.scroller || document.scrollingElement || document.documentElement;
    var host     = opts.host || document.body;
    if (!host) return null;
    if (host.querySelector(':scope > .hub-scrollrail')) return null;   // mount once per host

    var rail  = document.createElement('div'); rail.className  = 'hub-scrollrail';
    var thumb = document.createElement('div'); thumb.className = 'hub-scrollthumb';
    rail.appendChild(thumb); host.appendChild(rail);

    function viewport(){ return docMode ? window.innerHeight : scroller.clientHeight; }
    // measure a top-docked sticky/fixed navbar so the rail starts BELOW it (never spans the nav)
    function topInset(){
      if (typeof opts.topInset === 'number') return opts.topInset;
      if (!docMode) return 0;
      var vw = window.innerWidth, max = 0;
      document.querySelectorAll('nav, header, .site-nav, #site-nav, [data-rail-clear]').forEach(function(el){
        var cs = getComputedStyle(el);
        if (cs.position === 'fixed' || cs.position === 'sticky'){
          var r = el.getBoundingClientRect();
          if (r.top <= 1 && r.height > 8 && r.width > vw * 0.6) max = Math.max(max, r.bottom);
        }
      });
      return max;
    }
    function metrics(){
      var vh = viewport();
      var inset = topInset();
      var sh = scroller.scrollHeight;
      var railH = Math.max(40, vh - inset);              // track is the viewport BELOW the nav
      var thumbH = Math.max(38, railH * (vh / sh));
      return { vh:vh, inset:inset, sh:sh, overflow: sh - vh, railH:railH, thumbH:thumbH, maxTop: railH - thumbH };
    }
    // the element whose CSS scroll-behavior governs programmatic scrolls
    var sbEl = docMode ? document.documentElement : scroller;
    var savedSB = null;
    function suspendSmooth(){ savedSB = sbEl.style.scrollBehavior; sbEl.style.scrollBehavior = 'auto'; }
    function restoreSmooth(){ if (savedSB !== null){ sbEl.style.scrollBehavior = savedSB; savedSB = null; } }

    function getScrollTop(){ return docMode ? (scroller.scrollTop || window.pageYOffset || 0) : scroller.scrollTop; }
    function setScrollTop(v){
      // INSTANT scroll while dragging. Pages set scroll-behavior:smooth, and the
      // per-call behavior:'auto' override isn't reliably honored — so we force the
      // element's scroll-behavior to auto for the duration of the drag (see suspendSmooth).
      if (docMode) window.scrollTo(0, v);
      else scroller.scrollTop = v;
    }

    function update(){
      var m = metrics();
      if (m.overflow <= 8){ rail.style.display = 'none'; return; }   // nothing to scroll → hide
      rail.style.display = 'block';
      rail.style.top = m.inset + 'px';     // start below the navbar
      rail.style.height = m.railH + 'px';
      var top = m.overflow > 0 ? (getScrollTop() / m.overflow) * m.maxTop : 0;
      thumb.style.height = m.thumbH + 'px';
      thumb.style.transform = 'translateY(' + Math.max(0, Math.min(m.maxTop, top)) + 'px)';
    }

    (docMode ? window : scroller).addEventListener('scroll', update, { passive:true });
    window.addEventListener('resize', update);
    if (window.ResizeObserver){ try{ new ResizeObserver(update).observe(docMode ? document.body : scroller); }catch(e){} }

    // drag the thumb → scroll
    var dragging = false, startY = 0, startScroll = 0;
    thumb.addEventListener('pointerdown', function(e){
      dragging = true; startY = e.clientY; startScroll = getScrollTop();
      thumb.classList.add('is-dragging');
      suspendSmooth();   // instant tracking under the finger
      try{ thumb.setPointerCapture(e.pointerId); }catch(_){}
      e.preventDefault(); e.stopPropagation();
    });
    thumb.addEventListener('pointermove', function(e){
      if (!dragging) return;
      var m = metrics();
      var dScroll = m.maxTop > 0 ? ((e.clientY - startY) / m.maxTop) * m.overflow : 0;
      setScrollTop(startScroll + dScroll);
    });
    function endDrag(e){
      dragging = false; thumb.classList.remove('is-dragging');
      restoreSmooth();
      try{ thumb.releasePointerCapture(e.pointerId); }catch(_){}
    }
    thumb.addEventListener('pointerup', endDrag);
    thumb.addEventListener('pointercancel', endDrag);

    update();
    return { update: update, el: rail };
  }

  function autoInit(){ mount(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autoInit);
  else autoInit();

  window.HubbellScrollRail = { mount: mount };
})();
