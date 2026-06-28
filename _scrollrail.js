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

    // Inset = height of the top-docked sticky/fixed navbar, so the rail starts BELOW it.
    // Measured from offsetHeight (LAYOUT height — immune to the scroll-time transforms that
    // make getBoundingClientRect jitter, which was bouncing the thumb up into the nav). Cached
    // and recomputed only on resize, never per scroll frame.
    var _inset = 0;
    function measureInset(){
      if (typeof opts.topInset === 'number'){ _inset = opts.topInset; return; }
      if (!docMode){ _inset = 0; return; }
      var vw = window.innerWidth, max = 0;
      document.querySelectorAll('nav, header, .site-nav, #site-nav, [data-rail-clear]').forEach(function(el){
        var cs = getComputedStyle(el);
        if (cs.position !== 'fixed' && cs.position !== 'sticky') return;
        var r = el.getBoundingClientRect();
        var h = el.offsetHeight;
        if (h > 8 && r.width > vw * 0.6 && r.top <= h + 1) max = Math.max(max, h);   // top-docked, ~full-width
      });
      _inset = max;
    }

    function metrics(){
      var vh = viewport();
      var sh = scroller.scrollHeight;
      var railH = Math.max(40, vh - _inset);             // track is the viewport BELOW the nav
      var thumbH = Math.max(48, railH * (vh / sh));
      return { vh:vh, inset:_inset, sh:sh, overflow: sh - vh, railH:railH, thumbH:thumbH, maxTop: railH - thumbH };
    }
    // While dragging we add html.hub-dragging, whose CSS forces scroll-behavior:auto
    // and scroll-snap-type:none (!important) on html+body — so no smooth-scroll easing
    // or snap points fight the drag. Applied globally so it covers every page's own rules.
    function suspendSmooth(){ document.documentElement.classList.add('hub-dragging'); }
    function restoreSmooth(){ document.documentElement.classList.remove('hub-dragging'); }

    function getScrollTop(){ return docMode ? (scroller.scrollTop || window.pageYOffset || 0) : scroller.scrollTop; }
    function setScrollTop(v){
      // INSTANT scroll while dragging. Pages set scroll-behavior:smooth, and the
      // per-call behavior:'auto' override isn't reliably honored — so we force the
      // element's scroll-behavior to auto for the duration of the drag (see suspendSmooth).
      if (docMode) window.scrollTo(0, v);
      else scroller.scrollTop = v;
    }

    // drag state. While dragging, the POINTER drives the thumb and the thumb drives
    // the scroll — we never read scrollTop back (that caused a feedback loop) and we
    // FREEZE the metrics captured at grab time (so the mobile URL-bar / lazy content
    // changing innerHeight/scrollHeight mid-drag can't corrupt the mapping → no rattle).
    // Only the captured pointer counts (ignore stray/2nd touches), and scroll writes are
    // throttled to one per animation frame from the LATEST pointer position.
    var dragging = false, activeId = null, startY = 0, lastY = 0,
        startThumbTop = 0, dragMaxTop = 0, dragOverflow = 0, rafId = 0;

    function applyDrag(){
      rafId = 0;
      if (!dragging) return;
      var thumbTop = Math.max(0, Math.min(dragMaxTop, startThumbTop + (lastY - startY)));
      thumb.style.transform = 'translateY(' + thumbTop + 'px)';
      setScrollTop(dragMaxTop > 0 ? (thumbTop / dragMaxTop) * dragOverflow : 0);
    }

    function update(){
      if (dragging) return;   // during a drag the pointer owns the thumb — ignore scroll/resize-driven updates
      var m = metrics();
      if (m.overflow <= 8){ rail.style.display = 'none'; return; }   // nothing to scroll → hide
      rail.style.display = 'block';
      rail.style.top = m.inset + 'px';     // start below the navbar
      rail.style.height = m.railH + 'px';
      var top = m.overflow > 0 ? (getScrollTop() / m.overflow) * m.maxTop : 0;
      thumb.style.height = m.thumbH + 'px';
      thumb.style.transform = 'translateY(' + Math.max(0, Math.min(m.maxTop, top)) + 'px)';
    }

    function remeasure(){ measureInset(); update(); }
    (docMode ? window : scroller).addEventListener('scroll', update, { passive:true });
    window.addEventListener('resize', remeasure);
    window.addEventListener('orientationchange', remeasure);
    if (window.ResizeObserver){ try{ new ResizeObserver(update).observe(docMode ? document.body : scroller); }catch(e){} }

    thumb.addEventListener('pointerdown', function(e){
      if (activeId !== null) return;               // ignore a second finger
      var m = metrics();
      dragging = true; activeId = e.pointerId;
      startY = e.clientY; lastY = e.clientY;
      dragMaxTop = m.maxTop;
      dragOverflow = m.overflow;
      startThumbTop = m.overflow > 0 ? (getScrollTop() / m.overflow) * m.maxTop : 0;
      thumb.style.height = m.thumbH + 'px';        // lock the thumb size for the drag
      thumb.classList.add('is-dragging');
      suspendSmooth();
      try{ thumb.setPointerCapture(e.pointerId); }catch(_){}
      e.preventDefault(); e.stopPropagation();
    });
    thumb.addEventListener('pointermove', function(e){
      if (!dragging || e.pointerId !== activeId) return;   // only the captured pointer
      lastY = e.clientY;                                    // record latest; apply once per frame
      if (!rafId) rafId = requestAnimationFrame(applyDrag);
      e.preventDefault();
    });
    function endDrag(e){
      if (!dragging || (e.pointerId != null && e.pointerId !== activeId)) return;
      dragging = false; activeId = null;
      if (rafId){ cancelAnimationFrame(rafId); rafId = 0; }
      thumb.classList.remove('is-dragging');
      restoreSmooth();
      try{ thumb.releasePointerCapture(e.pointerId); }catch(_){}
      update();   // reconcile the thumb to the true scroll position now that the drag is over
    }
    thumb.addEventListener('pointerup', endDrag);
    thumb.addEventListener('pointercancel', endDrag);

    measureInset();
    update();
    // a sticky navbar can settle its height a frame or two after load — re-measure shortly after
    setTimeout(remeasure, 250);
    return { update: update, el: rail };
  }

  function autoInit(){ mount(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autoInit);
  else autoInit();

  window.HubbellScrollRail = { mount: mount };
})();
