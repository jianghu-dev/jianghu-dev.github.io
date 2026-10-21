/* 动态等高线背景
   值噪声高度场 + marching squares 等值线，缓慢演化。
   零依赖，单 canvas，页面不可见时自动暂停。 */

(function () {
  'use strict';

  var canvas = document.getElementById('contours');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  var W = 0, H = 0, cell = 30, cols = 0, rows = 0;
  var field = null;
  var clock = 0;
  var raf = null;
  var running = true;

  var LEVELS = 6;
  var STEP = 0.075;
  var BASE = 0.24;
  var NOISE_SCALE = 1 / 190;

  function hash(x, y, z) {
    var n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
    return n - Math.floor(n);
  }

  function smoothStep(t) { return t * t * (3 - 2 * t); }

  function noise2(x, y, z) {
    var xi = Math.floor(x), yi = Math.floor(y);
    var xf = x - xi, yf = y - yi;
    var u = smoothStep(xf), v = smoothStep(yf);
    var a = hash(xi, yi, z);
    var b = hash(xi + 1, yi, z);
    var c = hash(xi, yi + 1, z);
    var d = hash(xi + 1, yi + 1, z);
    var ab = a + (b - a) * u;
    var cd = c + (d - c) * u;
    return ab + (cd - ab) * v;
  }

  function fbm(x, y, z) {
    var v = 0, amp = 0.58, freq = 1;
    for (var i = 0; i < 3; i++) {
      v += noise2(x * freq, y * freq, z + i * 13.7) * amp;
      freq *= 2.05;
      amp *= 0.5;
    }
    return v;
  }

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    cell = W < 760 ? 38 : 30;
    cols = Math.ceil(W / cell) + 2;
    rows = Math.ceil(H / cell) + 2;
    field = new Float32Array(cols * rows);
    draw(true);
  }

  /* 边编号：0 上、1 右、2 下、3 左 */
  var CASES = [
    [], [[3, 0]], [[0, 1]], [[3, 1]],
    [[1, 2]], [[3, 0], [1, 2]], [[0, 2]], [[3, 2]],
    [[2, 3]], [[2, 0]], [[0, 1], [2, 3]], [[2, 1]],
    [[1, 3]], [[1, 0]], [[0, 3]], []
  ];

  function lerp(a, b, t) { return a + (b - a) * t; }

  function draw(staticFrame) {
    ctx.clearRect(0, 0, W, H);

    var t = clock;
    for (var j = 0; j < rows; j++) {
      var yPart = j * cell * NOISE_SCALE;
      for (var i = 0; i < cols; i++) {
        field[j * cols + i] = fbm(
          i * cell * NOISE_SCALE + t * 0.055,
          yPart + t * 0.028,
          t * 0.5
        );
      }
    }

    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    ctx.strokeStyle = staticFrame
      ? 'rgba(110, 240, 160, 0.17)'
      : 'rgba(110, 240, 160, 0.175)';

    for (var k = 0; k < LEVELS; k++) {
      var level = BASE + k * STEP;
      ctx.beginPath();
      march(level);
      ctx.stroke();
    }
  }

  function march(level) {
    var idx, pts, seg, a, b, x0, y0, x1, y1;
    var v0, v1, v2, v3;

    for (var j = 0; j < rows - 1; j++) {
      for (var i = 0; i < cols - 1; i++) {
        v0 = field[j * cols + i];
        v1 = field[j * cols + i + 1];
        v2 = field[(j + 1) * cols + i + 1];
        v3 = field[(j + 1) * cols + i];

        idx = (v0 > level ? 1 : 0) | (v1 > level ? 2 : 0) |
              (v2 > level ? 4 : 0) | (v3 > level ? 8 : 0);
        seg = CASES[idx];
        if (!seg.length) continue;

        x0 = i * cell;
        y0 = j * cell;
        x1 = x0 + cell;
        y1 = y0 + cell;

        for (var s = 0; s < seg.length; s++) {
          a = edge(seg[s][0], x0, y0, x1, y1, v0, v1, v2, v3, level);
          b = edge(seg[s][1], x0, y0, x1, y1, v0, v1, v2, v3, level);
          if (!a || !b) continue;
          ctx.moveTo(a[0], a[1]);
          ctx.lineTo(b[0], b[1]);
        }
      }
    }
  }

  function edge(id, x0, y0, x1, y1, v0, v1, v2, v3, level) {
    var t;
    if (id === 0) {
      if (v1 === v0) return null;
      t = (level - v0) / (v1 - v0);
      return [lerp(x0, x1, t), y0];
    }
    if (id === 1) {
      if (v2 === v1) return null;
      t = (level - v1) / (v2 - v1);
      return [x1, lerp(y0, y1, t)];
    }
    if (id === 2) {
      if (v2 === v3) return null;
      t = (level - v3) / (v2 - v3);
      return [lerp(x0, x1, t), y1];
    }
    if (v3 === v0) return null;
    t = (level - v0) / (v3 - v0);
    return [x0, lerp(y0, y1, t)];
  }

  function loop() {
    raf = null;
    clock += 0.0062;
    draw(false);
    if (running) raf = requestAnimationFrame(loop);
  }

  function start() {
    if (reduce || raf) return;
    running = true;
    raf = requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    if (raf) { cancelAnimationFrame(raf); raf = null; }
  }

  var resizeTimer = null;
  window.addEventListener('resize', function () {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      resize();
      if (!reduce && running && !raf) start();
    }, 180);
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop();
    else if (!reduce) start();
  });

  resize();

  if (!reduce) {
    start();
  }
})();
