/* 个人站交互
   启动遮罩 / 磁吸光标 / 卡片入场 / 逐字浮现 / 滚动进度 / 时钟 / 黑白切换 */

(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ================= 时钟 ================= */
  var clock = document.getElementById('clock');
  function tick() {
    if (!clock) return;
    var d = new Date();
    var p = function (n) { return String(n).padStart(2, '0'); };
    clock.textContent = p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
  }
  tick();
  setInterval(tick, 1000);

  /* ================= 黑白切换 ================= */
  var themeBtn = document.getElementById('themeBtn');
  var STORE = 'site-theme';

  function systemDark() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  function isDark() {
    var set = root.getAttribute('data-theme');
    if (set === 'dark') return true;
    if (set === 'light') return false;
    return systemDark();
  }
  function applyTheme(theme) {
    if (theme) root.setAttribute('data-theme', theme);
    else root.removeAttribute('data-theme');
    if (themeBtn) {
      themeBtn.textContent = isDark() ? '◑' : '◐';
      themeBtn.title = isDark() ? '切换到浅色' : '切换到深色';
    }
  }

  var saved = null;
  try { saved = localStorage.getItem(STORE); } catch (e) {}
  applyTheme(saved);

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = isDark() ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem(STORE, next); } catch (e) {}
    });
  }

  /* ================= 逐字浮现 ================= */
  var splitEls = [].slice.call(document.querySelectorAll('[data-split]'));

  splitEls.forEach(function (el) {
    var text = el.textContent.trim();
    el.textContent = '';
    Array.prototype.forEach.call(text, function (ch, i) {
      var s = document.createElement('span');
      s.textContent = ch;
      s.style.animationDelay = (i * 0.045).toFixed(3) + 's';
      el.appendChild(s);
    });
  });

  function playSplit() {
    splitEls.forEach(function (el) { el.classList.add('play'); });
  }

  /* ================= 卡片入场 ================= */
  var panels = [].slice.call(document.querySelectorAll('.panel, .footer'));

  if (!('IntersectionObserver' in window) || reduce) {
    panels.forEach(function (p) { p.classList.add('in'); });
    window.__revealOK = true;
  } else {
    var seq = 0;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.style.transitionDelay = Math.min(seq++, 6) * 60 + 'ms';
        el.classList.add('in');
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });

    panels.forEach(function (p) { io.observe(p); });
    window.__revealOK = true;
  }

  /* ================= 悬停扫描线 ================= */
  Array.prototype.forEach.call(document.querySelectorAll('.shot, .updates li'), function (el) {
    var s = document.createElement('i');
    s.className = 'scan';
    el.appendChild(s);
  });

  /* ================= 滚动进度 ================= */
  var bar = document.getElementById('scrollBar');
  var ticking = false;

  function updateBar() {
    ticking = false;
    if (!bar) return;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    var p = h > 0 ? Math.min(window.scrollY / h, 1) : 0;
    bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
  }
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateBar);
  }, { passive: true });
  window.addEventListener('resize', updateBar);
  updateBar();

  /* ================= 启动遮罩 ================= */
  var boot = document.getElementById('boot');
  var bootLog = document.getElementById('bootLog');
  var bootDone = false;
  var bootReady = false;
  var bootTimer = null;

  var BOOT_LINES = [
    ['INIT', 'survey protocol v3.5'],
    ['OK',   'grid calibrated · 32px'],
    ['OK',   'contour layer mounted'],
    ['INFO', 'indexing cards ...'],
    ['OK',   'cards indexed · 10'],
    ['INFO', 'loading renderer ...'],
    ['OK',   'renderer ready'],
    ['DONE', 'waiting for operator input']
  ];

  function finishBoot(fast) {
    if (bootDone) return;
    bootDone = true;
    if (boot) {
      boot.classList.add('is-out');
      setTimeout(function () {
        if (boot && boot.parentNode) boot.parentNode.removeChild(boot);
      }, fast ? 60 : 520);
    }
    setTimeout(function () {
      playSplit();
      initCursor();
    }, fast ? 0 : 280);
  }

  function renderLine(animate) {
    var line = BOOT_LINES[bootLog.childElementCount];
    if (!line) return;
    var span = document.createElement('span');
    span.className = 'ln';
    if (!animate) {
      span.style.animation = 'none';
      span.style.opacity = '1';
    }
    span.innerHTML = '<b>[' + line[0] + ']</b>   ' + line[1];
    bootLog.appendChild(span);
  }

  function flushLines() {
    if (bootTimer) { clearInterval(bootTimer); bootTimer = null; }
    while (bootLog.childElementCount < BOOT_LINES.length) renderLine(false);
  }

  function showReady() {
    if (bootReady || !boot) return;
    bootReady = true;
    var el = document.createElement('div');
    el.className = 'boot-ready';
    el.innerHTML = '<span class="k">ENTER</span> 按回车进入站点';
    boot.appendChild(el);
  }

  function advance() {
    if (bootDone) return;
    if (!bootReady) { flushLines(); showReady(); return; }
    finishBoot(false);
  }

  if (!boot || reduce) {
    bootDone = true;
    window.__bootOK = true;
    if (boot && boot.parentNode) boot.parentNode.removeChild(boot);
    playSplit();
    initCursor();
  } else {
    window.__bootOK = true;
    bootTimer = setInterval(function () {
      if (bootLog.childElementCount >= BOOT_LINES.length) {
        clearInterval(bootTimer);
        bootTimer = null;
        setTimeout(showReady, 320);
        return;
      }
      renderLine(true);
    }, 78);

    window.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.keyCode === 13) {
        e.preventDefault();
        advance();
      }
    });

    boot.addEventListener('click', function () { advance(); });
  }

  /* ================= 磁吸光标 ================= */
  function initCursor() {
    if (window.__cursorReady) return;
    if (reduce) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    window.__cursorReady = true;

    var frame = document.createElement('div');
    frame.className = 'cursor-frame';
    frame.innerHTML = '<i class="tl"></i><i class="tr"></i><i class="bl"></i><i class="br"></i>';

    var dot = document.createElement('div');
    dot.className = 'cursor-dot';

    document.body.appendChild(frame);
    document.body.appendChild(dot);
    root.classList.add('has-cursor');

    var IDLE = 28;
    var PAD_MIN = 10;

    var mx = window.innerWidth / 2;
    var my = window.innerHeight / 2;
    var rx = mx;
    var ry = my;
    var target = null;
    var rect = null;
    var raf = null;

    frame.style.setProperty('--w', IDLE + 'px');
    frame.style.setProperty('--h', IDLE + 'px');
    frame.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
    dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';

    var SELECTOR = [
      '[data-magnetic-cursor]',
      'a[href]',
      'button',
      '[role="button"]',
      'input:not([type="hidden"])',
      'textarea',
      'select',
      'summary',
      '[tabindex]:not([tabindex="-1"])'
    ].join(',');

    function measure() {
      if (!target) { rect = null; return; }
      var r = target.getBoundingClientRect();
      rect = { left: r.left, top: r.top, width: r.width, height: r.height };
      var pad = Math.max(PAD_MIN, Math.round(window.innerWidth / 90));
      frame.style.setProperty('--w', Math.round(r.width + pad) + 'px');
      frame.style.setProperty('--h', Math.round(r.height + pad) + 'px');
    }

    function tickFrame() {
      raf = null;
      var tx = mx;
      var ty = my;
      if (target && rect) {
        tx = rect.left + rect.width / 2;
        ty = rect.top + rect.height / 2;
      }
      var ease = target ? 0.22 : 0.3;
      rx += (tx - rx) * ease;
      ry += (ty - ry) * ease;
      frame.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
      if ((tx - rx) * (tx - rx) + (ty - ry) * (ty - ry) > 0.12) {
        raf = requestAnimationFrame(tickFrame);
      }
    }

    function schedule() {
      if (raf == null) raf = requestAnimationFrame(tickFrame);
    }

    function setTarget(next) {
      if (target === next) return;
      target = next;
      if (target) {
        measure();
      } else {
        frame.style.setProperty('--w', IDLE + 'px');
        frame.style.setProperty('--h', IDLE + 'px');
        rect = null;
      }
      schedule();
    }

    document.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
      root.classList.add('cursor-in');
      schedule();
    }, { passive: true });

    document.addEventListener('pointerover', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      var node = e.target;
      if (!(node instanceof Element)) return;
      var hit = node.closest(SELECTOR);
      if (hit) setTarget(hit);
    }, true);

    document.addEventListener('pointerout', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      if (!target) return;
      var next = e.relatedTarget;
      if (next instanceof Node && target.contains(next)) return;
      setTarget(null);
    }, true);

    window.addEventListener('scroll', function () {
      measure();
      if (target) schedule();
    }, { passive: true });

    window.addEventListener('resize', function () {
      measure();
      if (target) schedule();
    });

    document.addEventListener('mouseleave', function () {
      root.classList.remove('cursor-in');
    });
  }

  /* ================= 导航高亮 ================= */
  var links = [].slice.call(document.querySelectorAll('#tabs a'));
  var targets = links.map(function (a) {
    return { link: a, el: document.getElementById(a.getAttribute('href').slice(1)) };
  }).filter(function (t) { return t.el; });

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
