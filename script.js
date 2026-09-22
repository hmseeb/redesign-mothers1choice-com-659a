/* =========================================================
   Mother's 1st Choice Cleaning Co. — interactions
   Vanilla JS, no dependencies, no external calls.
   ========================================================= */
(function () {
  'use strict';

  var onReady = function (fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  };

  onReady(function () {

    /* ---------------------------------------------------
       Footer year
       --------------------------------------------------- */
    var yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

    /* ---------------------------------------------------
       Mobile navigation
       --------------------------------------------------- */
    var burger = document.getElementById('burger');
    var nav = document.getElementById('nav');

    function closeNav() {
      if (!nav || !burger) return;
      nav.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Open menu');
    }

    if (burger && nav) {
      burger.addEventListener('click', function () {
        var open = nav.classList.toggle('is-open');
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
        burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      });

      nav.addEventListener('click', function (e) {
        if (e.target.tagName === 'A') closeNav();
      });

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeNav();
      });

      document.addEventListener('click', function (e) {
        if (!nav.classList.contains('is-open')) return;
        if (nav.contains(e.target) || burger.contains(e.target)) return;
        closeNav();
      });

      window.addEventListener('resize', function () {
        if (window.innerWidth > 820) closeNav();
      });
    }

    /* ---------------------------------------------------
       Header shadow on scroll + announce bar offset
       --------------------------------------------------- */
    var header = document.getElementById('header');
    var announce = document.getElementById('announce');

    function setAnnounceOffset() {
      if (!announce) return;
      var rect = announce.getBoundingClientRect();
      var visible = Math.max(0, rect.bottom);
      document.documentElement.style.setProperty(
        '--announce-h',
        Math.min(visible, rect.height) + 'px'
      );
    }

    function onScroll() {
      if (header) header.classList.toggle('is-stuck', window.scrollY > 8);
      setAnnounceOffset();
    }

    setAnnounceOffset();
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', setAnnounceOffset);

    /* ---------------------------------------------------
       Scroll reveal
       --------------------------------------------------- */
    var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

      revealEls.forEach(function (el, i) {
        el.style.transitionDelay = (i % 4) * 70 + 'ms';
        io.observe(el);
      });
    } else {
      revealEls.forEach(function (el) { el.classList.add('is-in'); });
    }

    /* ---------------------------------------------------
       Pricing: square-footage estimator
       --------------------------------------------------- */
    var sqft = document.getElementById('sqft');
    var sqftOut = document.getElementById('sqftOut');
    var amounts = Array.prototype.slice.call(document.querySelectorAll('.plan .amt'));

    function fmt(n) {
      return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    function updatePricing() {
      if (!sqft) return;
      var size = parseInt(sqft.value, 10) || 1000;
      var extraThousands = Math.max(0, (size - 1000) / 1000);

      if (sqftOut) sqftOut.textContent = fmt(size) + ' sq ft';

      amounts.forEach(function (el) {
        var base = parseFloat(el.getAttribute('data-base')) || 0;
        var rate = parseFloat(el.getAttribute('data-rate')) || 0;
        var price = Math.round(base + rate * extraThousands);
        el.textContent = fmt(price);
      });

      // paint the filled portion of the track
      var pct = ((size - 1000) / (8000 - 1000)) * 100;
      sqft.style.background =
        'linear-gradient(90deg, #e11b2c 0%, #e11b2c ' + pct + '%, #e3ded5 ' + pct + '%, #e3ded5 100%)';
    }

    if (sqft) {
      sqft.addEventListener('input', updatePricing);
      sqft.addEventListener('change', updatePricing);
      updatePricing();
    }

    /* ---------------------------------------------------
       Generic carousel factory
       --------------------------------------------------- */
    function makeSlider(config) {
      var track = document.getElementById(config.track);
      var dotsWrap = document.getElementById(config.dots);
      if (!track) return;

      var slides = Array.prototype.slice.call(track.children);
      if (!slides.length) return;

      var index = 0;
      var dots = [];

      // build dots
      if (dotsWrap) {
        slides.forEach(function (_, i) {
          var b = document.createElement('button');
          b.type = 'button';
          b.setAttribute('role', 'tab');
          b.setAttribute('aria-label', config.label + ' ' + (i + 1));
          b.addEventListener('click', function () { go(i); });
          dotsWrap.appendChild(b);
          dots.push(b);
        });
      }

      function render() {
        track.style.transform = 'translateX(' + (-index * 100) + '%)';
        dots.forEach(function (d, i) {
          d.classList.toggle('is-active', i === index);
          d.setAttribute('aria-selected', i === index ? 'true' : 'false');
        });
        slides.forEach(function (s, i) {
          // keep offscreen slides out of the tab order
          s.setAttribute('aria-hidden', i === index ? 'false' : 'true');
        });
      }

      function go(i) {
        index = (i + slides.length) % slides.length;
        render();
      }

      document.querySelectorAll('[data-' + config.attr + ']').forEach(function (btn) {
        btn.addEventListener('click', function () {
          go(index + (btn.getAttribute('data-' + config.attr) === 'next' ? 1 : -1));
        });
      });

      // keyboard support
      track.parentElement.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft') { go(index - 1); }
        if (e.key === 'ArrowRight') { go(index + 1); }
      });

      // touch / swipe
      var startX = 0;
      var startY = 0;
      var dragging = false;

      track.addEventListener('touchstart', function (e) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        dragging = true;
      }, { passive: true });

      track.addEventListener('touchend', function (e) {
        if (!dragging) return;
        dragging = false;
        var dx = e.changedTouches[0].clientX - startX;
        var dy = e.changedTouches[0].clientY - startY;
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
          go(index + (dx < 0 ? 1 : -1));
        }
      }, { passive: true });

      render();
    }

    makeSlider({ track: 'memTrack', dots: 'memDots', attr: 'mem', label: 'Slide' });
    makeSlider({ track: 'quoteTrack', dots: 'quoteDots', attr: 'quote', label: 'Review' });

    /* ---------------------------------------------------
       Smooth in-page scrolling with sticky-header offset
       --------------------------------------------------- */
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var id = link.getAttribute('href');
        if (!id || id === '#' || id.length < 2) return;

        var target = document.querySelector(id);
        if (!target) return;

        e.preventDefault();
        closeNav();

        var headerH = header ? header.offsetHeight : 0;
        var top = target.getBoundingClientRect().top + window.pageYOffset - headerH - 16;

        window.scrollTo({
          top: top,
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
        });
      });
    });

  });
})();
