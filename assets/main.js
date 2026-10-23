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
        var delay = Math.min(seq++, 6) * 60;
        io.unobserve(el);
        /* 用延时加 class 来错开，而不是写 transition-delay。
           写 transition-delay 会一直留在元素上，之后 hover 的倾斜也会被拖住。 */
        setTimeout(function () { el.classList.add('in'); }, delay);
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
    el.innerHTML = '<span class="k">ENTER</span> PRESS TO CONTINUE';
    boot.appendChild(el);
  }

  function advance() {
    if (bootDone) return;
    if (!bootReady) { flushLines(); showReady(); return; }
    finishBoot(false);
  }

  /* 本次会话已经进过站就不再播启动动画：
     1) 从站内其它页面点过来（referrer 同源）直接跳过；
     2) 同标签页里已经按过回车（sessionStorage）也不再重播。
     以前只判断 referrer，在预览器/新窗口里每次点“主页”都会重播一遍。 */
  var bootSeen = false;
  try {
    var _r = document.referrer || '';
    bootSeen = (!!_r && _r.indexOf(location.host) !== -1) ||
               sessionStorage.getItem('boot-seen') === '1';
  } catch (e) {}

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

  /* ================= 作品卡等高线贴图 =================
     用和背景同一套 marching squares 生成一张静态等高线 PNG，
     存进 CSS 变量 --contour-img，作品卡悬停时铺上去。 */
  (function contourTexture() {
    var cards = [].slice.call(
      document.querySelectorAll('.panel, .work-card, .contact-card')
    );
    if (!cards.length) return;

    var w = 760, h = 520;
    var c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    var g = c.getContext('2d');
    if (!g) return;

    var cell = 20;
    var cols = Math.ceil(w / cell) + 1;
    var rows = Math.ceil(h / cell) + 1;
    var f = new Float32Array(cols * rows);

    function hs(a, b) {
      var n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
      return n - Math.floor(n);
    }
    function sm(t) { return t * t * (3 - 2 * t); }
    function nz(a, b) {
      var ai = Math.floor(a), bi = Math.floor(b);
      var af = a - ai, bf = b - bi;
      var u = sm(af), v = sm(bf);
      var p = hs(ai, bi), q = hs(ai + 1, bi);
      var r = hs(ai, bi + 1), s = hs(ai + 1, bi + 1);
      var pq = p + (q - p) * u, rs = r + (s - r) * u;
      return pq + (rs - pq) * v;
    }
    function fb(a, b) {
      return 0.66 * nz(a, b) + 0.34 * nz(a * 2.1 + 7.3, b * 2.1 + 1.7);
    }

    for (var j = 0; j < rows; j++) {
      for (var i = 0; i < cols; i++) {
        f[j * cols + i] = fb(i * cell / 200, j * cell / 200);
      }
    }

    var CASES = [
      [], [[3, 0]], [[0, 1]], [[3, 1]],
      [[1, 2]], [[3, 0], [1, 2]], [[0, 2]], [[3, 2]],
      [[2, 3]], [[2, 0]], [[0, 1], [2, 3]], [[2, 1]],
      [[1, 3]], [[1, 0]], [[0, 3]], []
    ];

    function lp(a, b, t) { return a + (b - a) * t; }

    function edge(id, x0, y0, x1, y1, v0, v1, v2, v3, L) {
      var t;
      if (id === 0) {
        if (v1 === v0) return null;
        t = (L - v0) / (v1 - v0);
        return [lp(x0, x1, t), y0];
      }
      if (id === 1) {
        if (v2 === v1) return null;
        t = (L - v1) / (v2 - v1);
        return [x1, lp(y0, y1, t)];
      }
      if (id === 2) {
        if (v2 === v3) return null;
        t = (L - v3) / (v2 - v3);
        return [lp(x0, x1, t), y1];
      }
      if (v3 === v0) return null;
      t = (L - v0) / (v3 - v0);
      return [x0, lp(y0, y1, t)];
    }

    g.strokeStyle = 'rgba(255, 255, 255, 0.34)';
    g.lineWidth = 1;
    g.lineCap = 'round';

    for (var k = 0; k < 6; k++) {
      var L = 0.38 + k * 0.045;
      g.beginPath();
      for (var jj = 0; jj < rows - 1; jj++) {
        for (var ii = 0; ii < cols - 1; ii++) {
          var v0 = f[jj * cols + ii];
          var v1 = f[jj * cols + ii + 1];
          var v2 = f[(jj + 1) * cols + ii + 1];
          var v3 = f[(jj + 1) * cols + ii];
          var idx = (v0 > L ? 1 : 0) | (v1 > L ? 2 : 0) |
                    (v2 > L ? 4 : 0) | (v3 > L ? 8 : 0);
          var seg = CASES[idx];
          if (!seg.length) continue;
          var x0 = ii * cell, y0 = jj * cell;
          var x1 = x0 + cell, y1 = y0 + cell;
          for (var s = 0; s < seg.length; s++) {
            var A = edge(seg[s][0], x0, y0, x1, y1, v0, v1, v2, v3, L);
            var B = edge(seg[s][1], x0, y0, x1, y1, v0, v1, v2, v3, L);
            if (!A || !B) continue;
            g.moveTo(A[0], A[1]);
            g.lineTo(B[0], B[1]);
          }
        }
      }
      g.stroke();
    }

    try {
      document.documentElement.style.setProperty(
        '--contour-img', 'url(' + c.toDataURL('image/png') + ')'
      );
    } catch (e) {}

    /* 每个方块都塞一层纹理 */
    cards.forEach(function (el) {
      var d = document.createElement('div');
      d.className = 'tex';
      d.setAttribute('aria-hidden', 'true');
      el.insertBefore(d, el.firstChild);
    });
  })();

  /* ================= 指针特效 =================
     1. 卡片聚光：柔光跟着鼠标走
     2. 图标磁吸：图标朝光标挪几像素
     3. 顶部大图：轻微视差（放大交给 CSS hover）
     4. 作品卡：跟着光标 3D 倾斜 + 等高线纹理视差
     全部只在有精确指针的设备上启用。 */
  (function pointerFX() {
    if (reduce) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    /* 1. 聚光 */
    Array.prototype.forEach.call(
      document.querySelectorAll('.panel, .work-card, .contact-card'),
      function (el) {
        var raf = null, mx = 0, my = 0;
        el.addEventListener('pointermove', function (e) {
          var r = el.getBoundingClientRect();
          mx = e.clientX - r.left;
          my = e.clientY - r.top;
          if (raf) return;
          raf = requestAnimationFrame(function () {
            raf = null;
            el.style.setProperty('--mx', mx + 'px');
            el.style.setProperty('--my', my + 'px');
          });
        }, { passive: true });
      }
    );

    /* 2. 图标磁吸 */
    Array.prototype.forEach.call(
      document.querySelectorAll('.link-grid a svg, .contact-card svg'),
      function (svg) {
        var host = svg.parentNode;
        host.addEventListener('pointermove', function (e) {
          var r = host.getBoundingClientRect();
          var dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2 || 1);
          var dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2 || 1);
          svg.style.transform = 'translate(' +
            (dx * 3).toFixed(2) + 'px,' + (dy * 3).toFixed(2) + 'px)';
        }, { passive: true });
        host.addEventListener('pointerleave', function () {
          svg.style.transform = '';
        });
      }
    );

    /* 3. 大图视差 */
    var banner = document.querySelector('.banner');
    if (banner) {
      banner.addEventListener('pointermove', function (e) {
        var r = banner.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / r.width;
        var dy = (e.clientY - (r.top + r.height / 2)) / r.height;
        banner.style.setProperty('--bx', (dx * 10).toFixed(2) + 'px');
        banner.style.setProperty('--by', (dy * 6).toFixed(2) + 'px');
      }, { passive: true });
      banner.addEventListener('pointerleave', function () {
        banner.style.setProperty('--bx', '0px');
        banner.style.setProperty('--by', '0px');
      });
    }

    /* 4. 所有方块：3D 倾斜 + 等高线纹理视差
       注意：方块本身带 transform，getBoundingClientRect 会随旋转变大，
       拿它算比例会“自我抵消”，越靠近边缘越不跟手。
       所以用 offsetWidth/Height（不受 transform 影响）做归一化，
       中心点用 rect 的中心（绕中心旋转，中心不变）。

       边缘跳动的成因：卡片一转，投影轮廓会挪开，光标正好在边上时
       会反复触发 pointerleave / pointerenter，卡片就在“回正—再倾”之间抖。
       所以离开时先看光标是否还在卡片的“未旋转矩形”里，在就不回正。 */
    var tilted = [];

    function resetCard(card) {
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
      card.style.setProperty('--cx', '0px');
      card.style.setProperty('--cy', '0px');
      var i = tilted.indexOf(card);
      if (i !== -1) tilted.splice(i, 1);
    }

    /* 未受 transform 影响的布局矩形 */
    function layoutBox(el) {
      var p = el.offsetParent || document.body;
      var pr = p.getBoundingClientRect();
      var left = pr.left + p.clientLeft + el.offsetLeft;
      var top = pr.top + p.clientTop + el.offsetTop;
      return { left: left, top: top, right: left + el.offsetWidth, bottom: top + el.offsetHeight };
    }

    function inBox(b, x, y, pad) {
      return x >= b.left - pad && x <= b.right + pad &&
             y >= b.top - pad && y <= b.bottom + pad;
    }

    Array.prototype.forEach.call(
      document.querySelectorAll('.panel, .work-card, .contact-card'),
      function (card) {
        card.addEventListener('pointermove', function (e) {
          if (tilted.indexOf(card) === -1) tilted.push(card);

          var r = card.getBoundingClientRect();
          var w = card.offsetWidth || 1;
          var h = card.offsetHeight || 1;
          var dx = (e.clientX - (r.left + r.width / 2)) / (w / 2);
          var dy = (e.clientY - (r.top + r.height / 2)) / (h / 2);
          dx = Math.max(-1, Math.min(1, dx));
          dy = Math.max(-1, Math.min(1, dy));
          card.style.setProperty('--ry', (dx * 15).toFixed(2) + 'deg');
          card.style.setProperty('--rx', (-dy * 15).toFixed(2) + 'deg');
          card.style.setProperty('--cx', (dx * 14).toFixed(1) + 'px');
          card.style.setProperty('--cy', (dy * 10).toFixed(1) + 'px');
        }, { passive: true });

        card.addEventListener('pointerleave', function (e) {
          /* 旋转会让投影轮廓挪开，光标可能已经不在卡片上但还在原矩形里；
             这种情况先不回正，等光标真正离开矩形再收 */
          if (inBox(layoutBox(card), e.clientX, e.clientY, 1)) return;
          resetCard(card);
        }, { passive: true });
      }
    );

    /* 光标走远时，把所有还停在倾斜状态的卡片收回来 */
    window.addEventListener('pointermove', function (e) {
      if (!tilted.length) return;
      for (var i = tilted.length - 1; i >= 0; i--) {
        if (!inBox(layoutBox(tilted[i]), e.clientX, e.clientY, 1)) resetCard(tilted[i]);
      }
    }, { passive: true });
  })();

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
