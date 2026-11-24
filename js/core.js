'use strict';
(function () {
  const AX = (window.AX = {});

  AX.PAL = {
    k: '#181425',
    K: '#262b44',
    n: '#3a4466',
    m: '#5a6988',
    l: '#8b9bb4',
    L: '#c0cbdc',
    w: '#ffffff',
    e: '#3e2731',
    T: '#733e39',
    t: '#b86f50',
    s: '#e4a672',
    S: '#ead4aa',
    U: '#be4a2f',
    u: '#d77643',
    o: '#f77622',
    y: '#feae34',
    Y: '#fee761',
    R: '#a22633',
    r: '#e43b44',
    h: '#ff0044',
    g: '#63c74d',
    G: '#3e8948',
    j: '#265c42',
    J: '#193c3e',
    B: '#124e89',
    b: '#0099db',
    c: '#2ce8f5',
    P: '#68386c',
    p: '#b55088',
    i: '#f6757a',
  };
  const P = AX.PAL;

  AX.DX = [1, 0, -1, 0];
  AX.DY = [0, 1, 0, -1];
  AX.TILE = 16;

  AX.canvas = function (w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, w | 0);
    c.height = Math.max(1, h | 0);
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    return [c, x];
  };

  AX.fromRows = function (rows, pal) {
    pal = pal || P;
    const h = rows.length;
    let w = 0;
    for (const r of rows) w = Math.max(w, r.length);
    const [c, x] = AX.canvas(w, h);
    for (let yy = 0; yy < h; yy++) {
      const r = rows[yy];
      for (let xx = 0; xx < r.length; xx++) {
        const ch = r[xx];
        if (ch === '.' || ch === ' ') continue;
        x.fillStyle = pal[ch] || '#f0f';
        x.fillRect(xx, yy, 1, 1);
      }
    }
    return c;
  };

  AX.R = function (x, c, X, Y, W, H) {
    x.fillStyle = P[c] || c;
    x.fillRect(X | 0, Y | 0, W | 0, H | 0);
  };
  AX.px = function (x, c, X, Y) {
    x.fillStyle = P[c] || c;
    x.fillRect(X | 0, Y | 0, 1, 1);
  };

  AX.mulberry32 = function (a) {
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  AX.rand = (a, b) => a + Math.random() * (b - a);
  AX.ri = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
  AX.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  AX.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  AX.lerp = (a, b, t) => a + (b - a) * t;

  AX.Bag = function (pool, memory) {
    const recent = [];
    memory = memory == null ? Math.min(6, Math.floor(pool.length / 2)) : memory;
    return function () {
      let v, tries = 0;
      do {
        v = pool[Math.floor(Math.random() * pool.length)];
      } while (recent.includes(v) && tries++ < 20);
      recent.push(v);
      if (recent.length > memory) recent.shift();
      return v;
    };
  };

  AX.fmt = function (n) {
    n = Math.floor(n);
    const neg = n < 0;
    if (neg) n = -n;
    let s;
    if (n < 100000) s = n.toLocaleString('en-US');
    else {
      const units = [[1e15, 'Q'], [1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K']];
      for (const [v, u] of units) {
        if (n >= v) {
          const x = n / v;
          s = x >= 100 ? String(Math.floor(x)) : x >= 10 ? (Math.floor(x * 10) / 10).toFixed(1) : (Math.floor(x * 100) / 100).toFixed(2);
          if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
          s += u;
          break;
        }
      }
    }
    return (neg ? '-' : '') + s;
  };
  AX.money = (n) => '$' + AX.fmt(n);
  AX.rate = function (n) {
    if (n < 10) return '$' + n.toFixed(1);
    return '$' + AX.fmt(n);
  };
})();
