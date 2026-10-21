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
  var panels = [].slice.call(
    document.querySelectorAll('.panel, .footer, .work-card, .contact-card')
  );

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
  Array.prototype.forEach.call(
    document.querySelectorAll('.shot, .updates li, .work-card, .contact-card'),
    function (el) {
      var s = document.createElement('i');
      s.className = 'scan';
      el.appendChild(s);
    }
  );

  /* 作品缩略图的取景标记 */
  Array.prototype.forEach.call(document.querySelectorAll('.work-thumb'), function (t) {
    var a = document.createElement('span');
    a.className = 'aim';
    t.appendChild(a);
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
    try { sessionStorage.setItem('boot-seen', '1'); } catch (e) {}
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

  var bootSeen = false;
  try { bootSeen = sessionStorage.getItem('boot-seen') === '1'; } catch (e) {}

  if (!boot || reduce || bootSeen) {
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
  var here = location.pathname.split('/').pop();
  if (!here || here.indexOf('.') === -1) here = 'index.html';

  Array.prototype.forEach.call(document.querySelectorAll('#tabs a'), function (a) {
    a.classList.toggle('active', a.getAttribute('href') === here);
  });

  /* ================= QQ 解锁 ================= */
  var qqEntry = document.getElementById('qqEntry');
  var qqLock = document.getElementById('qqLock');

  if (qqEntry && qqLock) {
    /* 只存哈希，源码里没有明文：'透明人' → 91e17de */
    var ANSWER_HASH = '91e17de';
    var QQ_UIN = (function () { try { return atob('Mzk1MDI0ODE4Ng=='); } catch (e) { return ''; } })();

    var qqForm = document.getElementById('qqForm');
    var qqInput = document.getElementById('qqInput');
    var qqMsg = document.getElementById('qqMsg');
    var qqClose = document.getElementById('qqClose');

    function hashAnswer(str) {
      var h = 5381;
      for (var i = 0; i < str.length; i++) {
        h = ((h * 33) ^ str.charCodeAt(i)) >>> 0;
      }
      return h.toString(16);
    }

    function alreadyOpen() {
      try { return sessionStorage.getItem('qq-open') === '1'; } catch (e) { return false; }
    }

    function openLock() {
      qqLock.hidden = false;
      document.body.style.overflow = 'hidden';
      setTimeout(function () { if (qqInput) qqInput.focus(); }, 60);
    }

    function closeLock() {
      qqLock.hidden = true;
      document.body.style.overflow = '';
    }

    function unlockSuccess() {
      var box = qqLock.querySelector('.lock-box');
      box.innerHTML =
        '<div class="lock-head"><span>ACCESS GRANTED</span><span>QC-01</span></div>' +
        '<p class="lock-q">解锁成功。</p>' +
        '<p class="lock-result"><span>QQ</span>' + (QQ_UIN || '—') + '</p>' +
        '<a class="lock-open" href="https://wpa.qq.com/msgrd?v=3&uin=' + QQ_UIN + '&site=qq&menu=yes" target="_blank" rel="noopener">打开 QQ 对话</a>' +
        '<button class="lock-close" id="qqClose2" type="button">关闭</button>';
      box.querySelector('#qqClose2').addEventListener('click', closeLock);
      try { sessionStorage.setItem('qq-open', '1'); } catch (e) {}
    }

    qqEntry.addEventListener('click', function (e) {
      e.preventDefault();
      openLock();
      if (alreadyOpen()) unlockSuccess();
    });

    qqForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var val = qqInput.value.trim();
      if (!val) {
        qqMsg.textContent = '先输入答案';
        qqMsg.className = 'lock-msg err';
        return;
      }
      if (hashAnswer(val) === ANSWER_HASH) {
        qqMsg.textContent = '';
        unlockSuccess();
      } else {
        qqMsg.textContent = '答案不对，再想想';
        qqMsg.className = 'lock-msg err';
        qqLock.classList.add('shake');
        setTimeout(function () { qqLock.classList.remove('shake'); }, 380);
        qqInput.select();
      }
    });

    qqClose.addEventListener('click', closeLock);
    qqLock.addEventListener('click', function (e) {
      if (e.target === qqLock) closeLock();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !qqLock.hidden) closeLock();
    });
  }

})();
