/* 个人站交互：时钟 / 黑白切换 / 导航高亮 */

(function () {
  'use strict';

  var root = document.documentElement;

  /* ---------- 时钟 ---------- */
  var clock = document.getElementById('clock');

  function tick() {
    if (!clock) return;
    var d = new Date();
    var p = function (n) { return String(n).padStart(2, '0'); };
    clock.textContent = p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
  }
  tick();
  setInterval(tick, 1000);

  /* ---------- 黑白切换 ---------- */
  var themeBtn = document.getElementById('themeBtn');
  var STORE = 'site-theme';
  var mq = window.matchMedia('(prefers-color-scheme: dark)');

  function currentIsDark() {
    var set = root.getAttribute('data-theme');
    if (set === 'dark') return true;
    if (set === 'light') return false;
    return mq.matches;
  }

  function applyTheme(theme) {
    if (theme) {
      root.setAttribute('data-theme', theme);
    } else {
      root.removeAttribute('data-theme');
    }
    if (themeBtn) {
      themeBtn.textContent = currentIsDark() ? '◑' : '◐';
      themeBtn.title = currentIsDark() ? '切换到浅色' : '切换到深色';
    }
  }

  var saved = null;
  try { saved = localStorage.getItem(STORE); } catch (e) {}
  applyTheme(saved);

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = currentIsDark() ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem(STORE, next); } catch (e) {}
    });
  }

  /* ---------- 导航高亮 ---------- */
  var links = [].slice.call(document.querySelectorAll('#tabs a'));
  var targets = links
    .map(function (a) {
      var id = a.getAttribute('href').slice(1);
      return { link: a, el: document.getElementById(id) };
    })
    .filter(function (t) { return t.el; });

  function setActive(link) {
    links.forEach(function (a) { a.classList.toggle('active', a === link); });
  }

  if ('IntersectionObserver' in window && targets.length) {
    var spy = new IntersectionObserver(function (entries) {
      if (window.scrollY < 100) { setActive(links[0]); return; }
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        for (var i = 0; i < targets.length; i++) {
          if (targets[i].el === entry.target) setActive(targets[i].link);
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });

    targets.forEach(function (t) { spy.observe(t.el); });
  }

  links.forEach(function (a) {
    a.addEventListener('click', function () { setActive(a); });
  });

})();
