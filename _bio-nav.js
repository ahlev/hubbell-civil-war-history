/* _bio-nav.js — Left navigation sidebar for bio pages
   Dynamically builds a sticky sidebar from .chapter / .silence elements.
   Requires: _bio.css sidebar styles loaded. */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var narrative = document.querySelector('.narrative');
    if (!narrative) return;

    var sections = narrative.querySelectorAll('.chapter, .silence');
    if (!sections.length) return;

    // --- Assign IDs to each section ---
    var chIdx = 0, silIdx = 0;
    sections.forEach(function (el) {
      if (el.classList.contains('silence')) {
        el.id = el.id || ('silence-' + silIdx++);
      } else {
        el.id = el.id || ('ch-' + chIdx++);
      }
    });

    // --- Build sidebar data: extract title + year ---
    var items = [];
    var lastYear = null;

    sections.forEach(function (el) {
      var title, year;
      var h2 = el.querySelector('h2');
      title = h2 ? h2.textContent.trim() : '';

      if (el.classList.contains('silence')) {
        year = lastYear; // assign to preceding year
      } else {
        var dateEl = el.querySelector('.ch-date');
        if (dateEl) {
          var m = dateEl.textContent.match(/\b(1[89]\d{2})\b/);
          year = m ? m[1] : lastYear;
        } else {
          year = lastYear;
        }
      }
      if (year) lastYear = year;

      items.push({
        id: el.id,
        title: title,
        year: year || '—',
        isSilence: el.classList.contains('silence'),
        el: el
      });
    });

    // --- Create sidebar DOM ---
    var sidebar = document.createElement('nav');
    sidebar.className = 'bio-sidebar';
    sidebar.setAttribute('aria-label', 'Chapter navigation');

    var currentYear = null;
    var yearEls = {}; // year -> year heading element

    items.forEach(function (item) {
      // Year heading
      if (item.year !== currentYear) {
        currentYear = item.year;
        var yearDiv = document.createElement('div');
        yearDiv.className = 'bio-sidebar-year';
        yearDiv.textContent = currentYear;
        sidebar.appendChild(yearDiv);
        yearEls[currentYear] = yearDiv;
      }

      // Chapter/silence link
      var link = document.createElement('a');
      link.className = 'bio-sidebar-link';
      if (item.isSilence) link.className += ' silence-link';
      link.textContent = item.title;
      link.title = item.title;
      link.href = '#' + item.id;
      link.dataset.target = item.id;
      link.dataset.year = item.year;

      link.addEventListener('click', function (e) {
        e.preventDefault();
        var target = document.getElementById(item.id);
        if (target) {
          isClickScrolling = true;
          setActive(item.id);
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          history.replaceState(null, '', '#' + item.id);
          setTimeout(function () { isClickScrolling = false; }, 600);
        }
      });

      sidebar.appendChild(link);
    });

    // --- Wrap narrative in flex layout ---
    var wrapper = document.createElement('div');
    wrapper.className = 'bio-nav-layout';
    narrative.parentNode.insertBefore(wrapper, narrative);
    wrapper.appendChild(sidebar);
    wrapper.appendChild(narrative);

    // --- Scroll tracking via IntersectionObserver ---
    var isClickScrolling = false;
    var allLinks = sidebar.querySelectorAll('.bio-sidebar-link');
    var allYearHeadings = sidebar.querySelectorAll('.bio-sidebar-year');

    function setActive(targetId) {
      var activeLink = null;
      allLinks.forEach(function (l) {
        var isActive = l.dataset.target === targetId;
        l.classList.toggle('active', isActive);
        if (isActive) activeLink = l;
      });
      // Highlight parent year
      var activeYear = activeLink ? activeLink.dataset.year : null;
      allYearHeadings.forEach(function (y) {
        y.classList.toggle('active', y.textContent === activeYear);
      });
      // Keep active link visible in sidebar (skip during click-scroll to avoid conflicts)
      if (activeLink && !isClickScrolling) {
        activeLink.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }

    // Observer: trigger when section enters upper 30% of viewport
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          setActive(entry.target.id);
        }
      });
    }, {
      rootMargin: '-10% 0px -70% 0px',
      threshold: 0
    });

    sections.forEach(function (el) {
      observer.observe(el);
    });
  });
})();
