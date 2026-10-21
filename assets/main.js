/* 个人主页交互：主题切换 / 移动菜单 / 滚动高亮 / 渐入动画 */

(function () {
  'use strict';

  /* ---------- 主题 ---------- */
  var root = document.documentElement;
  var themeBtn = document.getElementById('themeBtn');
  var STORE = 'site-theme';

  function systemDark() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function apply(theme) {
    if (theme === 'light' || theme === 'dark') {
      root.setAttribute('data-theme', theme);
    } else {
      root.removeAttribute('data-theme');
    }
    if (themeBtn) {
      var dark = theme === 'dark' || (theme !== 'light' && systemDark());
      themeBtn.setAttribute('aria-label', dark ? '切换到浅色' : '切换到深色');
    }
  }

  var saved = null;
  try { saved = localStorage.getItem(STORE); } catch (e) {}
  apply(saved);

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var dark = root.getAttribute('data-theme') === 'dark' ||
        (!root.getAttribute('data-theme') && systemDark());
      var next = dark ? 'light' : 'dark';
      apply(next);
      try { localStorage.setItem(STORE, next); } catch (e) {}
    });
  }

  /* ---------- 导航：吸顶阴影 ---------- */
  var nav = document.getElementById('nav');
  function onScroll() {
    if (!nav) return;
    nav.classList.toggle('is-stuck', window.scrollY > 8);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- 移动菜单 ---------- */
  var menuBtn = document.getElementById('menuBtn');
  var navLinks = document.getElementById('navLinks');

  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', function () {
      var open = navLinks.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
    });
    navLinks.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        navLinks.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- 渐入 ---------- */
  var items = [].slice.call(document.querySelectorAll('.reveal'));

  if (!('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    items.forEach(function (el, i) {
      el.style.transitionDelay = (Math.min(i, 4) * 70) + 'ms';
      io.observe(el);
    });
  }

  /* ---------- 导航高亮 ---------- */
  var sections = [].slice.call(document.querySelectorAll('section[id]'));
  var links = [].slice.call(document.querySelectorAll('.nav-links a'));

  if (sections.length && links.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.id;
        links.forEach(function (a) {
          a.classList.toggle('active', a.getAttribute('href') === '#' + id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- 年份 ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
