/* 主页入场迷雾
   ------------------------------------------------------------
   进入主页时整页盖一层薄雾，鼠标（或手指）划过的地方雾散开，
   像用袖子擦掉起雾的玻璃。擦掉的地方不会回来；停手几秒或擦得
   差不多之后，剩下的雾自己淡掉。
   只在本标签页第一次进主页时出现，之后不再打扰。
   ------------------------------------------------------------ */

(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  if (!document.body) return;

  var KEY = 'fog-seen';
  try {
    if (sessionStorage.getItem(KEY) === '1') return;
    sessionStorage.setItem(KEY, '1');
  } catch (e) {}

  var W = 0, H = 0;
  var RADIUS = 140;
  var IDLE_MS = 6000;     // 停手多久后自动散雾
  var HARD_MS = 22000;    // 最长存在时间

  var layer = document.createElement('canvas');
  layer.className = 'fog-layer';
  layer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(layer);

  var ctx = layer.getContext('2d');
  if (!ctx) { layer.remove(); return; }

  /* 擦除蒙版：白 = 已擦掉 */
  var mask = document.createElement('canvas');
  var mctx = mask.getContext('2d');

  /* 雾的贴图：只生成一次 */
  var fog = document.createElement('canvas');
  var fctx = fog.getContext('2d');

  var cellsX = 0, cellsY = 0, cells = null, cellW = 0, cellH = 0;
  var clearedCells = 0;
  var last = null;
  var done = false;
  var idleTimer = null;
  var hardTimer = null;

  function rand(a, b) { return a + Math.random() * (b - a); }

  function buildFog() {
    fog.width = W;
    fog.height = H;
    fctx.clearRect(0, 0, W, H);

    /* 底雾 */
    fctx.fillStyle = 'rgba(160, 167, 180, 0.46)';
    fctx.fillRect(0, 0, W, H);

    /* 大团浓淡：拉长的椭圆，像一层层飘着的雾带 */
    var big = Math.max(W, H);
    for (var i = 0; i < 46; i++) {
      var x = rand(-0.15, 1.15) * W;
      var y = rand(-0.15, 1.15) * H;
      var r = rand(0.10, 0.34) * big;
      var ang = rand(0, Math.PI * 2);
      var sx = rand(0.5, 1.7);
      var sy = rand(0.5, 1.7);
      var light = Math.random() > 0.4;
      var a = rand(0.05, 0.16);
      var g = fctx.createRadialGradient(0, 0, 0, 0, 0, r);
      g.addColorStop(0, light
        ? 'rgba(255, 255, 255, ' + a.toFixed(3) + ')'
        : 'rgba(76, 82, 94, ' + a.toFixed(3) + ')');
      g.addColorStop(0.55, light
        ? 'rgba(255, 255, 255, ' + (a * 0.5).toFixed(3) + ')'
        : 'rgba(76, 82, 94, ' + (a * 0.5).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');

      fctx.save();
      fctx.translate(x, y);
      fctx.rotate(ang);
      fctx.scale(sx, sy);
      fctx.fillStyle = g;
      fctx.beginPath();
      fctx.arc(0, 0, r, 0, Math.PI * 2);
      fctx.fill();
      fctx.restore();
    }

    /* 边缘略厚一点 */
    var edge = fctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.25, W / 2, H / 2, Math.max(W, H) * 0.72);
    edge.addColorStop(0, 'rgba(0, 0, 0, 0)');
    edge.addColorStop(1, 'rgba(120, 126, 138, 0.16)');
    fctx.fillStyle = edge;
    fctx.fillRect(0, 0, W, H);

    /* 细颗粒，别让雾看起来像一块塑料膜 */
    var tile = document.createElement('canvas');
    tile.width = tile.height = 120;
    var tctx = tile.getContext('2d');
    var img = tctx.createImageData(120, 120);
    for (var p = 0; p < img.data.length; p += 4) {
      var v = 190 + Math.random() * 65;
      img.data[p] = v;
      img.data[p + 1] = v;
      img.data[p + 2] = v;
      img.data[p + 3] = Math.random() * 24;
    }
    tctx.putImageData(img, 0, 0);
    fctx.globalAlpha = 0.55;
    fctx.fillStyle = fctx.createPattern(tile, 'repeat');
    fctx.fillRect(0, 0, W, H);
    fctx.globalAlpha = 1;
  }

  function size() {
    W = window.innerWidth;
    H = window.innerHeight;

    layer.width = W;
    layer.height = H;
    mask.width = W;
    mask.height = H;

    /* 粗网格用来估算擦掉的比例 */
    cellW = 48;
    cellH = 48;
    cellsX = Math.ceil(W / cellW);
    cellsY = Math.ceil(H / cellH);
    cells = new Uint8Array(cellsX * cellsY);
    clearedCells = 0;

    buildFog();
    render();
  }

  function render() {
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(fog, 0, 0);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.drawImage(mask, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
  }

  function markCells(x, y) {
    var x0 = Math.max(0, Math.floor((x - RADIUS * 0.6) / cellW));
    var x1 = Math.min(cellsX - 1, Math.floor((x + RADIUS * 0.6) / cellW));
    var y0 = Math.max(0, Math.floor((y - RADIUS * 0.6) / cellH));
    var y1 = Math.min(cellsY - 1, Math.floor((y + RADIUS * 0.6) / cellH));
    for (var j = y0; j <= y1; j++) {
      for (var i = x0; i <= x1; i++) {
        var k = j * cellsX + i;
        if (!cells[k]) { cells[k] = 1; clearedCells++; }
      }
    }
  }

  function erase(x, y) {
    var g = mctx.createRadialGradient(x, y, 0, x, y, RADIUS);
    g.addColorStop(0, 'rgba(255, 255, 255, 1)');
    g.addColorStop(0.5, 'rgba(255, 255, 255, 0.96)');
    g.addColorStop(0.78, 'rgba(255, 255, 255, 0.45)');
    g.addColorStop(1, 'rgba(255, 255, 255, 0)');
    mctx.fillStyle = g;
    mctx.beginPath();
    mctx.arc(x, y, RADIUS, 0, Math.PI * 2);
    mctx.fill();
    markCells(x, y);
  }

  function dismiss() {
    if (done) return;
    done = true;
    clearTimeout(idleTimer);
    clearTimeout(hardTimer);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('touchmove', onMove);
    layer.style.opacity = '0';
    setTimeout(function () {
      if (layer.parentNode) layer.parentNode.removeChild(layer);
    }, 1300);
  }

  function bumpIdle() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(dismiss, IDLE_MS);
  }

  function onMove(e) {
    if (done) return;
    var touch = e.touches && e.touches[0];
    var x = touch ? touch.clientX : e.clientX;
    var y = touch ? touch.clientY : e.clientY;
    if (x == null) return;

    if (last) {
      var dx = x - last.x, dy = y - last.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      /* 快速移动时补点，轨迹才连续 */
      var steps = Math.min(24, Math.max(1, Math.ceil(dist / (RADIUS * 0.3))));
      for (var i = 1; i <= steps; i++) {
        erase(last.x + dx * i / steps, last.y + dy * i / steps);
      }
    } else {
      erase(x, y);
    }

    last = { x: x, y: y };
    render();
    bumpIdle();

    var total = cellsX * cellsY;
    if (clearedCells / total > 0.7) dismiss();
  }

  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('touchmove', onMove, { passive: true });

  var resizeTimer = null;
  window.addEventListener('resize', function () {
    if (done) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(size, 200);
  });

  size();
  bumpIdle();
  hardTimer = setTimeout(dismiss, HARD_MS);

  /* 下一帧再淡入，避免和启动遮罩抢同一帧 */
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      if (!done) layer.style.opacity = '1';
    });
  });
})();
