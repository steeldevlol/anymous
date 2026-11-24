'use strict';
(function (AX) {
  const R = AX.R, px = AX.px, rows = AX.fromRows;
  const SPR = (AX.SPR = { item: {}, bld: {}, belt: [[], []], curve: [{}, {}], misc: {}, chute: [], avatar: {} });

  const ITEM_ART = {
    mango: [
      '.......gG.', '......gGg.', '...kkkkk..', '..kYYyyyk.', '.kYyyyyyok',
      '.kyyyyyyok', '.kyyyyyook', '.kuyyyoook', '..kuuooUk.', '...kkkkk..',
    ],
    log: [
      '.kkkkkkkk.', 'kwwwwwwwwk', 'kwbbwLLLwk', 'kwwwwwwwwk', 'kwLLLLLwwk',
      'kwwwwwwwLk', '.kkwwkkkk.', '..kwk.....', '..kk......', '..........',
    ],
    juice: [
      '...kkkk...', '...kLlk...', '..kkkkkk..', '.kwccccLk.', '.kwYYYYok.',
      '.kwyoooUk.', '.kwoooouk.', '.kwoooouk.', '.kLuuuuuk.', '..kkkkkk..',
    ],
    tokens: [
      '..kkkkkk..', '.kcwwccck.', 'kcwkkkkcck', 'kccckkccck', 'kccckkccck',
      'kccckkccbk', 'kbcccccbbk', '.kbbbbbbk.', '..kkkkkk..', '..........',
    ],
    dataset: [
      '.kkkkkkkk.', '.koLLLmok.', '.koLLLmok.', '.kooooook.', '.kowwwwok.',
      '.kowgowok.', '.kowwwwok.', '.kuuuuuuk.', '.kkkkkkkk.', '..........',
    ],
    weights: [
      '....kk....', '...kiik...', '..kiwiik..', '.kiiiippk.', 'kiiiipppPk',
      'kpppppPPPk', '.kpppPPPk.', '..kppPPk..', '...kPPk...', '....kk....',
    ],
    quant: [
      '..........', '....kk....', '...kcck...', '..kcwcbk..', '.kcccbbBk.',
      '.kbbbBBBk.', '..kbbBBk..', '...kBBk...', '....kk....', '..........',
    ],
    ckpt: [
      '...L..L...', '.kkkkkkkk.', 'LknnnnnnkL', '.knoyyonk.', 'LknyYYynkL',
      '.knyYyynk.', 'LknoyyonkL', '.knnnnnnk.', '.kkkkkkkk.', '...L..L...',
    ],
    junk: [
      '.kkkkkkkk.', 'kmPwwwmPmk', 'kPmPmPwmPk', 'kmPmPwwPmk', 'kPmPwmPmPk',
      'kmPmmPmPmk', 'kPmPwmPmPk', 'kmPmPmPmPk', '.kkkkkkkk.', '..........',
    ],
    lobo: [
      '....kk....', '...kLLk...', '..kLwkLk..', '.kLLLkllk.', 'kLLLklllmk',
      'klllkllmmk', '.klllkmmk.', '..kllmmk..', '...kmmk...', '....kk....',
    ],
  };
  for (const k in ITEM_ART) SPR.item[k] = rows(ITEM_ART[k]);
  SPR.misc.b67 = rows(['.kkkkkkk.', 'krYYrYYYk', 'kYrrrrrYk', 'kYYYrrrYk', 'kYrYrrYrk', 'kYYYrrYrk', '.kkkkkkk.']);
  SPR.misc.bm = rows(['..k..', '.kgk.', 'kgggk', 'kkgkk', '.kgk.', '.kkk.']);

  const BELT_COL = [
    { rail: 'm', hi: 'l', lo: 'n', tread: 'K', chev: 'n' },
    { rail: 'u', hi: 'y', lo: 'U', tread: 'K', chev: 'o' },
  ];
  function beltEast(tier, f) {
    const C = BELT_COL[tier];
    const [c, x] = AX.canvas(16, 16);
    R(x, C.tread, 0, 3, 16, 10);
    for (let r = 3; r <= 12; r++) {
      const d = Math.floor(Math.abs(r - 7.5));
      for (const c0 of [4, 12]) {
        const X = (((c0 - d + f) % 16) + 16) % 16;
        px(x, C.chev, X, r);
        px(x, C.chev, (X + 15) % 16, r);
      }
    }
    R(x, 'k', 0, 0, 16, 1);
    R(x, C.hi, 0, 1, 16, 1);
    R(x, C.rail, 0, 2, 16, 1);
    R(x, C.rail, 0, 13, 16, 1);
    R(x, C.lo, 0, 14, 16, 1);
    R(x, 'k', 0, 15, 16, 1);

    for (let X = 0; X < 16; X += 8) {
      px(x, C.lo, (X + f) % 16, 1);
      px(x, C.hi, (X + f + 4) % 16, 14);
    }
    return c;
  }
  function rotated(src, dir) {
    const w = src.width, h = src.height;
    const sw = dir % 2 ? h : w, sh = dir % 2 ? w : h;
    const [c, x] = AX.canvas(sw, sh);
    x.translate(sw / 2, sh / 2);
    x.rotate((dir * Math.PI) / 2);
    x.drawImage(src, -w / 2, -h / 2);
    return c;
  }
  AX.rotated = rotated;

  function beltCorner(tier, entry, exit, f) {
    const C = BELT_COL[tier];
    const [c, x] = AX.canvas(16, 16);
    R(x, C.tread, 0, 0, 16, 16);
    const edge = (side, col, depth) => {
      if (side === 0) R(x, col, 15 - depth, 0, 1, 16);
      if (side === 2) R(x, col, depth, 0, 1, 16);
      if (side === 1) R(x, col, 0, 15 - depth, 16, 1);
      if (side === 3) R(x, col, 0, depth, 16, 1);
    };
    for (let s = 0; s < 4; s++) {
      if (s === entry || s === exit) continue;
      edge(s, 'k', 0);
      edge(s, C.hi, 1);
      edge(s, C.rail, 2);
    }

    const cx = entry === 0 || exit === 0 ? 13 : 0;
    const cy = entry === 1 || exit === 1 ? 13 : 0;
    R(x, C.rail, cx, cy, 3, 3);
    R(x, 'k', cx + (cx ? 2 : 0), cy + (cy ? 2 : 0), 1, 1);

    for (let Y = 0; Y < 16; Y++)
      for (let X = 0; X < 16; X++) {
        const dx = X + 0.5 - 8, dy = Y + 0.5 - 8, d = Math.hypot(dx, dy);
        if (d <= 5.2) px(x, d > 4.2 ? 'k' : 'n', X, Y);
      }
    const a = (f / 8) * Math.PI * 2 * (entry % 2 === 0 ? 1 : -1);
    for (let i = 0; i < 4; i++) {
      const aa = a + (i * Math.PI) / 2;
      px(x, i ? 'm' : C.hi, 8 + Math.cos(aa) * 2.6 - 0.5, 8 + Math.sin(aa) * 2.6 - 0.5);
    }
    px(x, 'l', 7, 7);
    return c;
  }
  for (let t = 0; t < 2; t++) {
    for (let d = 0; d < 4; d++) SPR.belt[t][d] = [];
    for (let f = 0; f < 8; f++) {
      const e = beltEast(t, f);
      for (let d = 0; d < 4; d++) SPR.belt[t][d][f] = rotated(e, d);
    }
    for (let entry = 0; entry < 4; entry++)
      for (let exit = 0; exit < 4; exit++) {
        if (entry === exit || (entry + 2) % 4 === exit) continue;
        const key = entry * 4 + exit;
        SPR.curve[t][key] = [];
        for (let f = 0; f < 8; f++) SPR.curve[t][key][f] = beltCorner(t, entry, exit, f);
      }
  }

  const chuteE = rows(['kk...', 'kyk..', 'kyyk.', 'kyyyk', 'kyyyk', 'kyyk.', 'kyk..', 'kk...']);
  for (let d = 0; d < 4; d++) SPR.chute[d] = rotated(chuteE, d);

  function shape(x, x0, y0, x1, y1, inside, color, outline) {
    for (let Y = y0; Y <= y1; Y++)
      for (let X = x0; X <= x1; X++) {
        if (!inside(X, Y)) continue;
        const edge = !inside(X + 1, Y) || !inside(X - 1, Y) || !inside(X, Y + 1) || !inside(X, Y - 1);
        const col = edge && outline ? outline : color(X, Y);
        if (col) px(x, col, X, Y);
      }
  }
  const ell = (cx, cy, rx, ry) => (X, Y) => ((X + 0.5 - cx) / rx) ** 2 + ((Y + 0.5 - cy) / ry) ** 2 <= 1;
  const hash = (X, Y) => {
    let h = (X * 374761393 + Y * 668265263) | 0;
    h = (h ^ (h >>> 13)) * 1274126177;
    return (h ^ (h >>> 16)) >>> 0;
  };
  function shadow(x, X, Y, W, H) {
    R(x, 'rgba(10,8,20,0.35)', X, Y, W, H);
  }
  function box(x, X, Y, W, H, depth, top, front, hi, lo) {
    R(x, 'k', X, Y, W, H);
    R(x, top, X + 1, Y + 1, W - 2, H - 2 - depth);
    R(x, front, X + 1, Y + H - 1 - depth, W - 2, depth);
    if (hi) R(x, hi, X + 1, Y + 1, W - 2, 1);
    if (lo) R(x, lo, X + 1, Y + H - 2, W - 2, 1);
  }

  const PAINT = {};

  PAINT.tree = function (x, f) {
    shadow(x, 4, 28, 24, 3);

    R(x, 'k', 5, 18, 22, 12);
    R(x, 'e', 6, 19, 20, 3);
    R(x, 't', 6, 22, 20, 6);
    R(x, 's', 6, 22, 20, 1);
    R(x, 'T', 6, 27, 20, 1);
    R(x, 'T', 12, 23, 1, 4);
    R(x, 'T', 19, 23, 1, 4);
    px(x, 'S', 8, 24);
    px(x, 'S', 22, 24);

    R(x, 'k', 13, 7, 6, 13);
    R(x, 'T', 14, 7, 4, 13);
    R(x, 't', 14, 8, 1, 11);
    R(x, 'e', 17, 8, 1, 11);
    R(x, 'T', 12, 18, 2, 1);
    R(x, 'T', 18, 18, 2, 1);

    const sway = f % 4 < 2 ? 0 : 1;
    const parts = [ell(16 + sway * 0.4, 0.5, 9, 8.5), ell(9, 6, 7.5, 6.5), ell(23 + sway * 0.4, 6, 7.5, 6.5), ell(16, 9, 7, 5.5)];
    const inside = (X, Y) => Y >= -8 && parts.some((p) => p(X, Y));
    shape(x, 0, -8, 31, 16, inside, (X, Y) => {
      const v = (X - 16) * 0.55 + (Y - 3);
      let c = v < -6 ? 'g' : v < 4 ? 'G' : 'j';
      const hh = hash(X + sway, Y) % 9;
      if (hh === 0) c = c === 'g' ? 'G' : c === 'G' ? 'j' : 'J';
      else if (hh === 1 && c !== 'g') c = c === 'j' ? 'G' : 'g';
      if (v < -9 && hash(X, Y + sway) % 5 === 0) c = 'Y';
      return c;
    }, 'k');
  };
  SPR.treeMangoes = [[7, 9], [21, 10], [14, 12], [25, 4], [5, 3], [17, 5]];

  PAINT.logger = function (x, f) {
    shadow(x, 2, 28, 28, 3);

    R(x, 'k', 1, 15, 30, 8);
    R(x, 't', 2, 16, 28, 3);
    R(x, 's', 2, 16, 28, 1);
    R(x, 'T', 2, 19, 28, 3);
    R(x, 'k', 3, 22, 4, 8);
    R(x, 'e', 4, 22, 2, 7);
    R(x, 'k', 25, 22, 4, 8);
    R(x, 'e', 26, 22, 2, 7);

    R(x, 'k', 8, 16, 16, 3);
    R(x, 'n', 9, 17, 14, 1);
    for (let X = 9; X < 23; X += 2) px(x, 'l', X, 17);

    R(x, 'k', 5, -6, 22, 20);
    R(x, 'L', 6, -5, 20, 18);
    R(x, 'l', 24, -5, 2, 18);
    R(x, 'l', 6, 10, 20, 3);
    R(x, 'w', 6, -5, 18, 1);
    R(x, 'k', 8, -3, 16, 12);
    R(x, 'K', 9, -2, 14, 10);
    const cols = ['y', 'r', 'l', 'g', 'y', 'p', 'l', 'y'];
    const lens = [9, 6, 11, 4, 8, 10, 5, 7];
    for (let i = 0; i < 4; i++) {
      const li = (i + f) % 8;
      const Y = -1 + i * 2;
      px(x, cols[li], 10, Y);
      R(x, li % 3 === 0 ? 'L' : 'l', 12, Y, lens[li], 1);
    }
    px(x, 'g', 22, 11);
    R(x, 'l', 14, 13, 4, 2);

    px(x, 'k', 22, -7);
    px(x, 'k', 23, -8);
    px(x, f % 2 ? 'h' : 'R', 24, -8);
  };

  PAINT.juicer = function (x, f) {
    shadow(x, 3, 28, 26, 3);
    box(x, 3, 13, 26, 17, 10, 'l', 'm', 'L', 'n');
    R(x, 'o', 4, 21, 24, 2);
    R(x, 'y', 4, 21, 24, 1);
    px(x, 'L', 5, 25);
    px(x, 'L', 26, 25);

    R(x, 'k', 14, 24, 4, 5);
    R(x, 'n', 15, 24, 2, 4);
    if (f % 4 < 2) px(x, 'o', 15 + (f % 2), 29 + (f % 2));

    R(x, 'k', 5, 23, 7, 5);
    R(x, 'S', 6, 24, 5, 3);
    px(x, 'o', 7, 25);
    px(x, 'y', 8, 25);
    px(x, 'g', 9, 24);

    R(x, 'k', 9, -8, 14, 3);
    R(x, 'm', 10, -7, 12, 1);
    R(x, 'k', 8, -5, 16, 19);
    R(x, 'n', 9, -4, 14, 17);
    R(x, 'l', 10, -3, 1, 14);
    px(x, 'L', 10, -3);
    px(x, 'L', 21, -2);
  };
  SPR.juiceJar = { x: 11, y: -4, w: 11, h: 17 };

  PAINT.tokenizer = function (x, f) {
    shadow(x, 2, 28, 28, 3);
    box(x, 2, 4, 28, 26, 14, 'l', 'm', 'L', 'n');
    R(x, 'k', 8, 8, 16, 3);
    R(x, 'K', 9, 9, 14, 1);

    const feed = f % 4;
    R(x, 'k', 10, 1 + feed, 12, 8 - feed);
    R(x, 'w', 11, 2 + feed, 10, 7 - feed);
    for (let Y = 3 + feed; Y < 8; Y += 2) R(x, 'l', 12, Y, 7, 1);

    const gear = (cx, cy, dir) => {
      shape(x, cx - 6, cy - 6, cx + 6, cy + 6, ell(cx, cy, 4.6, 4.6), () => 'l', 'k');
      const a = ((f * dir) / 8) * Math.PI;
      for (let i = 0; i < 6; i++) {
        const aa = a + (i * Math.PI) / 3;
        px(x, 'L', cx + Math.cos(aa) * 5.2 - 0.5, cy + Math.sin(aa) * 5.2 - 0.5);
      }
      for (let i = 0; i < 2; i++) {
        const aa = a + i * Math.PI;
        px(x, 'm', cx + Math.cos(aa) * 2.4 - 0.5, cy + Math.sin(aa) * 2.4 - 0.5);
      }
      R(x, 'k', cx - 1, cy - 1, 2, 2);
    };
    gear(9, 21, 1);
    gear(22, 21, -1);
    R(x, 'k', 12, 25, 8, 4);
    R(x, 'c', 13, 26, 6, 2);
    px(x, 'w', 14, 26);
    px(x, f % 2 ? 'c' : 'b', 27, 17);
  };

  PAINT.blender = function (x, f) {
    shadow(x, 3, 28, 27, 3);

    R(x, 'k', 2, 8, 28, 19);
    R(x, 'm', 3, 8, 26, 18);
    R(x, 'l', 4, 8, 3, 18);
    R(x, 'L', 5, 9, 1, 15);
    R(x, 'n', 25, 8, 3, 18);
    R(x, 'n', 3, 15, 26, 1);
    R(x, 'n', 3, 22, 26, 1);
    shape(x, 2, 22, 29, 30, (X, Y) => Y >= 25 && ell(16, 25.5, 13.5, 4)(X, Y), (X, Y) => (Y > 27 ? 'k' : 'n'), 'k');

    shape(x, 2, 0, 29, 16, ell(16, 8.5, 14, 6.5), () => 'L', 'k');
    const inner = ell(16, 8.5, 11.5, 4.6);
    for (let Y = 2; Y <= 15; Y++)
      for (let X = 4; X <= 28; X++) {
        if (!inner(X, Y)) continue;
        const dx = X + 0.5 - 16, dy = (Y + 0.5 - 8.5) * 2.4;
        const r = Math.hypot(dx, dy);
        const ang = Math.atan2(dy, dx) + r * 0.32 - (f / 8) * Math.PI * 2;
        const s = Math.sin(ang * 2);
        px(x, s > 0.55 ? 'Y' : s > 0 ? 'o' : s > -0.6 ? 'c' : 'b', X, Y);
      }

    R(x, 'k', 3, 7, 26, 3);
    R(x, 'l', 4, 8, 24, 1);
    R(x, 'k', 11, 1, 10, 8);
    R(x, 'l', 12, 2, 8, 6);
    R(x, 'L', 12, 2, 8, 1);
    R(x, 'n', 12, 6, 8, 1);
    px(x, f % 2 ? 'g' : 'G', 18, 4);

    R(x, 'k', 10, 17, 12, 5);
    R(x, 'S', 11, 18, 10, 3);
    px(x, 'o', 12, 19);
    px(x, 'g', 13, 18);
    px(x, 'c', 15, 19);
    R(x, 'l', 17, 19, 3, 1);
  };

  PAINT.trainer = function (x, f) {
    shadow(x, 2, 28, 28, 3);
    R(x, 'k', 2, -7, 28, 37);
    R(x, 'n', 3, -6, 26, 8);
    R(x, 'm', 3, -6, 26, 1);
    R(x, 'K', 3, 2, 26, 27);
    R(x, 'k', 3, 2, 26, 1);

    const fan = (cx, cy) => {
      shape(x, cx - 5, cy - 5, cx + 5, cy + 5, ell(cx, cy, 3.6, 3.6), () => 'k', 'k');
      const a = (f / 8) * Math.PI * 2;
      for (let i = 0; i < 3; i++) {
        const aa = a + (i * Math.PI * 2) / 3;
        px(x, 'l', cx + Math.cos(aa) * 2 - 0.5, cy + Math.sin(aa) * 2 - 0.5);
      }
      px(x, 'L', cx - 0.5, cy - 0.5);
    };
    fan(9.5, -2);
    fan(22.5, -2);

    for (let i = 0; i < 3; i++) {
      const Y = 4 + i * 7;
      R(x, 'k', 5, Y, 21, 6);
      R(x, 'j', 6, Y + 1, 19, 4);
      R(x, 'g', 6, Y + 1, 1, 4);
      R(x, 'n', 9, Y + 1, 14, 4);
      R(x, 'm', 9, Y + 1, 14, 1);
      px(x, 'K', 12, Y + 3);
      px(x, 'K', 19, Y + 3);
      px(x, 'l', 12, Y + 2);
      px(x, 'l', 19, Y + 2);
      const on = (f + i * 3) % 8;
      px(x, on < 4 ? 'g' : 'G', 27, Y + 1);
      px(x, on % 3 === 0 ? 'c' : 'B', 27, Y + 3);
    }
    for (let X = 6; X < 26; X += 2) px(x, 'k', X, 26);
    R(x, 'y', 5, 27, 3, 1);
    px(x, 'g', 8, 27);
  };

  PAINT.quantizer = function (x, f) {
    shadow(x, 2, 28, 28, 3);

    R(x, 'k', 2, 17, 28, 13);
    R(x, 'l', 3, 18, 26, 4);
    R(x, 'L', 3, 18, 26, 1);
    for (let Y = 22; Y < 29; Y++)
      for (let X = 3; X < 29; X++) px(x, ((X + Y) >> 1) % 2 ? 'y' : 'k', X, Y);

    for (const X of [3, 24]) {
      R(x, 'k', X, -5, 5, 23);
      R(x, 'L', X + 1, -4, 3, 21);
      R(x, 'l', X + 3, -4, 1, 21);
    }

    R(x, 'k', 2, -8, 28, 5);
    R(x, 'P', 3, -7, 26, 3);
    R(x, 'p', 3, -7, 26, 1);
    px(x, f % 2 ? 'h' : 'R', 27, -6);

    const pos = [0, 3, 6, 9, 9, 6, 3, 0][f];
    const hy = -3 + pos;
    R(x, 'k', 13, -4, 6, hy + 5);
    R(x, 'L', 14, -4, 4, hy + 4);
    R(x, 'k', 8, hy, 16, 6);
    R(x, 'p', 9, hy + 1, 14, 4);
    R(x, 'i', 9, hy + 1, 14, 1);
    R(x, 'P', 9, hy + 4, 14, 1);

    const ch = pos >= 9 ? 3 : 5;
    R(x, 'k', 13, 18 - ch, 6, ch + 1);
    R(x, 'c', 14, 19 - ch, 4, ch - 1);
    px(x, 'w', 14, 19 - ch);
  };

  const DIG = { 6: '.##|#..|###|#.#|###', 7: '###|..#|..#|.#.|.#.' };
  function bigDigit(x, d, X, Y, col) {
    DIG[d].split('|').forEach((r, yy) => {
      for (let xx = 0; xx < 3; xx++) if (r[xx] === '#') R(x, col, X + xx * 2, Y + yy * 2, 2, 2);
    });
  }
  PAINT.press = function (x, f) {
    shadow(x, 2, 28, 28, 3);
    box(x, 2, 8, 28, 22, 14, 'r', 'R', 'i', 'e');
    R(x, 'k', 8, 18, 16, 6);
    R(x, 'e', 9, 19, 14, 4);
    R(x, 'Y', 11, 21 - (f % 4 < 2 ? 1 : 0), 10, 2);

    R(x, 'm', 6, 2, 2, 7);
    R(x, 'm', 24, 2, 2, 7);
    R(x, 'k', 3, -8, 26, 12);
    R(x, 'y', 4, -7, 24, 10);
    R(x, 'Y', 4, -7, 24, 1);
    bigDigit(x, 6, 9, -7, 'R');
    bigDigit(x, 7, 17, -7, 'R');

    let i = 0;
    const bulb = (X, Y) => {
      px(x, (i++ + f) % 3 === 0 ? 'w' : 'o', X, Y);
    };
    for (let X = 4; X < 28; X += 3) bulb(X, -8);
    for (let Y = -6; Y < 3; Y += 3) bulb(28, Y);
    for (let X = 27; X > 3; X -= 3) bulb(X, 3);
    for (let Y = 2; Y > -7; Y -= 3) bulb(3, Y);
  };

  PAINT.bench = function (x, f) {
    shadow(x, 2, 28, 28, 3);
    box(x, 2, 2, 28, 28, 21, 'm', 'n', 'l', 'K');
    R(x, 'k', 5, 9, 22, 15);
    R(x, 'J', 6, 10, 20, 13);
    for (let X = 6; X < 26; X += 4) R(x, 'j', X, 10, 1, 13);
    const comp = [5, 7, 6];
    comp.forEach((h, i) => R(x, 'l', 8 + i * 4, 22 - h, 3, h));
    const hh = [3, 5, 7, 9, 11, 12, 12, 12][f];
    R(x, 'g', 20, 22 - hh, 3, hh);
    R(x, 'Y', 20, 22 - hh, 3, 1);
    if (f >= 5) {
      px(x, 'Y', 21, 8 + (f % 2));
      px(x, 'w', 24, 11);
    }

    px(x, 'r', 6, 26);
    px(x, 'y', 8, 26);
    px(x, 'g', 10, 26);
    R(x, 'k', 20, 26, 7, 1);

    const by = f % 4 < 2 ? 0 : 1;
    const arrow = rows(['..k..', '.kgk.', 'kgggk', 'kkgkk', '.kgk.', '.kgk.', '.kkk.']);
    x.drawImage(arrow, 13, -6 + by);
  };

  PAINT.merger = function (x, f) {
    shadow(x, 2, 28, 28, 3);

    R(x, 'k', 2, 24, 28, 6);
    R(x, 'n', 3, 25, 26, 4);
    shape(x, 1, 16, 30, 30, ell(16, 24, 14.5, 5), () => 'm', 'k');
    shape(x, 3, 19, 28, 28, ell(16, 24, 11, 3.2), () => 'l', null);

    R(x, 'k', 0, 10, 6, 9);
    R(x, 'u', 1, 11, 4, 7);
    R(x, 'y', 1, 11, 4, 1);
    px(x, 'o', 2, 13);
    px(x, 'y', 3, 13);
    px(x, 'g', 3, 12);

    const dome = (X, Y) => Y <= 23 && ell(16, 12, 11.5, 11.5)(X, Y);
    shape(x, 3, -1, 29, 24, dome, (X, Y) => (hash(X, Y) % 17 === 0 ? 'b' : 'B'), 'k');

    const s = f % 4 < 2 ? 0 : 0.6;
    shape(x, 8, 5, 24, 20, ell(16, 13, 6 + s, 5 + s), (X, Y) => ((X + Y * 2) % 5 === 0 ? 'p' : (X * 3 + Y) % 7 === 0 ? 'p' : 'i'), 'P');
    px(x, 'w', 13, 10);
    R(x, 'k', 13, 18, 6, 3);
    R(x, 'y', 14, 19, 4, 1);

    for (const [X, Y] of [[8, 4], [7, 5], [6, 7], [6, 8], [10, 2], [11, 2]]) px(x, 'c', X, Y);
    px(x, 'w', 9, 3);

    const a = (f / 8) * Math.PI * 2;
    px(x, 'Y', 16 + Math.cos(a) * 9, 12 + Math.sin(a) * 4);
    px(x, 'c', 16 + Math.cos(a + Math.PI) * 9, 12 + Math.sin(a + Math.PI) * 4);
  };

  PAINT.hq = function (x, f) {
    shadow(x, 3, 44, 43, 4);

    R(x, 'k', 2, 4, 44, 42);
    R(x, 'n', 3, 5, 42, 16);
    R(x, 'm', 3, 5, 42, 1);
    R(x, 'K', 3, 20, 42, 1);

    for (const X of [6, 34]) {
      R(x, 'k', X, 10, 8, 6);
      R(x, 'B', X + 1, 11, 6, 4);
      R(x, 'c', X + 1, 11, 6, 1);
      px(x, 'w', X + 2, 12);
    }
    R(x, 'k', 19, 12, 10, 6);
    R(x, 'l', 20, 13, 8, 4);
    R(x, 'L', 20, 13, 8, 1);
    for (let X = 21; X < 28; X += 2) px(x, 'm', X, 15);

    R(x, 'L', 3, 21, 42, 24);
    for (let X = 8; X < 44; X += 6) R(x, 'l', X, 21, 1, 23);
    R(x, 'l', 3, 43, 42, 2);
    R(x, 'w', 3, 21, 42, 1);

    const win = [[16, 24], [22, 24], [28, 24], [34, 24], [40, 24]];
    win.forEach(([X, Y], i) => {
      R(x, 'k', X - 1, Y - 1, 5, 6);
      R(x, (i + f) % 5 === 0 ? 'Y' : 'c', X, Y, 3, 4);
      px(x, 'w', X, Y);
    });

    x.drawImage(SPR.item.mango, 4, 24);

    R(x, 'k', 18, 31, 14, 14);
    for (let Y = 32; Y < 45; Y++) R(x, Y % 2 ? 'm' : 'l', 19, Y, 12, 1);
    for (let X = 18; X < 32; X++) px(x, (X >> 1) % 2 ? 'y' : 'k', X, 31);

    R(x, 'k', 2, -9, 44, 14);
    R(x, 'K', 3, -8, 42, 12);
    R(x, 'n', 3, -8, 42, 1);
    AX.text(x, 'AXON', 6, -6, 'R', { s: 2 });
    if (f === 5) AX.text(x, 'AXON', 6, -7, 'u', { s: 2 });
    else {
      AX.text(x, 'AXON', 6, -7, 'y', { s: 2 });
      x.save();
      x.beginPath();
      x.rect(0, -5, 48, 12);
      x.clip();
      AX.text(x, 'AXON', 6, -7, 'o', { s: 2 });
      x.restore();
    }
    px(x, f % 2 ? 'Y' : 'u', 3, -8);
    px(x, f % 2 ? 'u' : 'Y', 44, -8);
    px(x, f % 2 ? 'u' : 'Y', 3, 3);
    px(x, f % 2 ? 'Y' : 'u', 44, 3);
  };

  PAINT.split = function (x, f) {
    shadow(x, 1, 13, 14, 3);
    box(x, 1, 1, 14, 14, 4, 'n', 'K', 'm', 'k');
    const c = f % 4 < 2 ? 'y' : 'Y';
    R(x, c, 7, 3, 2, 7);
    R(x, c, 3, 6, 10, 2);
    px(x, c, 2, 6);
    px(x, c, 2, 7);
    px(x, c, 13, 6);
    px(x, c, 13, 7);
    px(x, c, 7, 2);
    px(x, c, 8, 2);
    px(x, 'k', 7, 6);
    px(x, 'k', 8, 7);
  };

  PAINT.upload = function (x, f) {
    R(x, 'k', 0, 0, 16, 16);
    R(x, 'y', 1, 1, 14, 14);
    R(x, 'Y', 1, 1, 14, 1);
    R(x, 'u', 1, 14, 14, 1);
    R(x, 'k', 3, 3, 10, 10);
    R(x, 'B', 4, 4, 8, 8);
    for (let i = 0; i < 2; i++) {
      const Y = 4 + ((10 - f + i * 4) % 8);
      if (Y < 4 || Y > 10) continue;
      px(x, 'c', 7, Y);
      px(x, 'c', 8, Y);
      if (Y + 1 <= 11) {
        px(x, 'c', 6, Y + 1);
        px(x, 'c', 9, Y + 1);
      }
    }
    for (const [X, Y] of [[1, 1], [14, 1], [1, 14], [14, 14]]) px(x, 'k', X, Y);
  };

  SPR.frames = 8;
  for (const k in PAINT) {
    const size = k === 'hq' ? 3 : k === 'split' || k === 'upload' ? 1 : 2;
    SPR.bld[k] = [];
    for (let f = 0; f < 8; f++) {
      const [c, x] = AX.canvas(size * 16, size * 16 + 8);
      x.translate(0, 8);
      PAINT[k](x, f);
      SPR.bld[k][f] = c;
    }
  }

  SPR.icon = {};
  for (const k in SPR.bld) SPR.icon[k] = SPR.bld[k][0];
  SPR.icon.belt = SPR.belt[0][0][0];
  SPR.icon.fbelt = SPR.belt[1][0][0];

  SPR.silhouette = function (img) {
    const [c, x] = AX.canvas(img.width, img.height);
    x.drawImage(img, 0, 0);
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = AX.PAL.n;
    x.fillRect(0, 0, c.width, c.height);
    return c;
  };

  SPR.floor = [];
  for (let v = 0; v < 6; v++) {
    const [c, x] = AX.canvas(16, 16);
    R(x, 'K', 0, 0, 16, 16);
    R(x, 'n', 0, 0, 16, 1);
    R(x, 'n', 0, 0, 1, 16);
    R(x, '#1f2339', 15, 1, 1, 15);
    R(x, '#1f2339', 1, 15, 15, 1);
    const rr = AX.mulberry32(v * 977 + 13);
    const dots = v < 3 ? 2 : 5;
    for (let i = 0; i < dots; i++) px(x, rr() < 0.6 ? '#2e3454' : 'n', 2 + rr() * 12, 2 + rr() * 12);
    if (v === 4) {
      px(x, 'l', 5, 9);
      px(x, 'n', 6, 9);
      px(x, 'n', 5, 10);
    }
    if (v === 5) {
      R(x, '#2e3454', 3, 4, 3, 1);
      R(x, '#2e3454', 10, 11, 4, 1);
    }
    SPR.floor.push(c);
  }
  {
    const [c, x] = AX.canvas(16, 16);
    R(x, 'L', 0, 0, 16, 16);
    R(x, 'l', 7, 0, 1, 16);
    R(x, 'w', 8, 0, 1, 16);
    R(x, 'l', 15, 0, 1, 16);
    R(x, 'w', 0, 0, 1, 16);
    SPR.wall = c;
  }
  SPR.ice = [];
  for (let v = 0; v < 2; v++) {
    const [c, x] = AX.canvas(16, 24);
    x.translate(0, 8);
    shadow(x, 1, 13, 15, 3);
    box(x, 1, 1 + v, 14, 14 - v, 4, 'c', 'b', 'w', 'B');
    R(x, 'k', 1, 1 + v, 14, 1);
    px(x, 'w', 3, 4 + v);
    px(x, 'w', 4, 4 + v);
    px(x, 'w', 3, 5 + v);
    px(x, 'L', 10, 8);
    px(x, 'c', 4, 12);
    SPR.ice.push(c);
  }

  SPR.misc.cursor = rows(['k.........', 'kk........', 'kwk.......', 'kwwk......', 'kwwwk.....', 'kwwwwk....', 'kwwwwwk...', 'kwwwwwwk..', 'kwwwkkkk..', 'kwkwk.....', 'kk.kwk....', '...kk.....']);
  SPR.misc.hand = rows(['...kk.....', '..kwwk....', '..kwwk....', '..kwwkkk..', '..kwwkwwkk', 'kkkwwwwwwk', 'kwkwwwwwwk', 'kwwwwwwwwk', '.kwwwwwwk.', '..kwwwwk..', '..kkkkkk..']);
  SPR.misc.lock = rows(['.kkk.', 'k...k', 'k...k', 'kkkkkk', 'kyyyyk', 'kyykyk', 'kyyyyk', 'kkkkkk'].map((r) => r.slice(0, 6)));
  SPR.misc.bubble = rows(['.kkkkkkkkkk.', 'kwwwwwwwwwwk', 'kwwwwwwwwwwk', 'kwwwwwwwwwwk', 'kwwwwwwwwwwk', 'kwwwwwwwwwwk', 'kwwwwwwwwwwk', 'kwwwwwwwwwwk', 'kwwwwwwwwwwk', 'kwwwwwwwwwwk', 'kwwwwwwwwwwk', '.kkkkwwkkkk.', '....kwk.....', '....kk......']);
  SPR.misc.bsod = (function () {
    const [c, x] = AX.canvas(22, 16);
    R(x, 'k', 0, 0, 22, 16);
    R(x, 'B', 1, 1, 20, 14);
    R(x, 'b', 1, 1, 20, 1);
    AX.text(x, ':(', 4, 4, 'w');
    R(x, 'L', 11, 5, 7, 1);
    R(x, 'L', 11, 8, 5, 1);
    R(x, 'L', 4, 11, 13, 1);
    return c;
  })();
  SPR.misc.bang = rows(['.kkkkk.', 'kwwrwwk', 'kwwrwwk', 'kwwrwwk', 'kwwwwwk', 'kwwrwwk', '.kkkkk.', '..kk...', '..k....']);
  SPR.misc.zzz = rows(['kkkk', '..k.', '.k..', 'kkkk']);

  SPR.gremlin = [];
  for (let f = 0; f < 4; f++) {
    const [c, x] = AX.canvas(14, 14);
    const bob = f % 2;
    shape(x, 0, 0, 13, 13, ell(7, 6.5 + bob * 0.5, 6, 5.2), (X, Y) => (Y < 4 + bob ? 'p' : hash(X, Y + f) % 6 === 0 ? 'i' : 'P'), 'k');
    R(x, 'w', 3, 5 + bob, 3, 3);
    R(x, 'w', 8, 5 + bob, 3, 3);
    px(x, 'k', 4 + (f > 1 ? 1 : 0), 6 + bob);
    px(x, 'k', 9 + (f > 1 ? 1 : 0), 6 + bob);
    R(x, 'k', 5, 10 + bob, 4, 1);

    px(x, 'k', 3 + (f % 2), 12);
    px(x, 'k', 10 - (f % 2), 12);
    px(x, 'k', 3 + (f % 2), 13);
    px(x, 'k', 10 - (f % 2), 13);

    if (f === 3) {
      R(x, 'c', 9, 3, 4, 1);
      R(x, 'h', 0, 8, 3, 1);
    }
    SPR.gremlin.push(c);
  }
  SPR.golden = [];
  for (let f = 0; f < 4; f++) {
    const [c, x] = AX.canvas(18, 18);
    const glow = ['Y', 'y', 'Y', 'w'][f];
    shape(x, 0, 0, 17, 17, ell(9, 10, 7.5, 6.5), (X, Y) => {
      const v = (X - 9) + (Y - 10);
      return v < -6 ? 'w' : v < 0 ? 'Y' : v < 5 ? 'y' : 'o';
    }, 'U');
    R(x, 'G', 10, 1, 2, 3);
    R(x, 'g', 12, 1, 3, 2);
    px(x, glow, 1 + (f % 2) * 15, 2 + (f >> 1) * 12);
    px(x, 'w', 6, 7);
    SPR.golden.push(c);
  }

  const AV = {
    anym: ['....gG..', '..uyyyu.', '.uyYyyyu', 'ukkkkkku', 'uykkykku', 'uyyyyyou', '.uykkyu.', '..uuuu..'],
    proof: ['..rrrr..', '.rrwwrr.', 'rrwrrwrr', 'rrrrwrrr', 'rrrwrrrr', 'rrrrrrrr', '.rrwrrr.', '..rrrr..'],
    lurk: ['..mmmm..', '.mmmmmm.', 'mmmmmmmm', 'mwkmmwkm', 'mmmmmmmm', 'mmmmmmmm', '.mmmmmm.', '..mmmm..'],
    jensen: ['..GGGG..', '.GkkkkG.', 'GGksskGG', 'GGkLLkGG', 'GGGssGGG', 'GkkkkkkG', '.kkLkkk.', '..kkkk..'],
    glm: ['..pppp..', '.pppppp.', 'ppwPpwPp', 'ppPPpPPp', 'pppppppp', 'pPcPcPpp', '.pppppp.', '..pppp..'],
    fable: ['..SSSS..', '.SSSuSS.', 'SSSSuSSS', 'SuuuuuuS', 'SSSSuSSS', 'SSSuSuSS', '.SuSSSu.', '..SSSS..'],
    vc: ['..ggGG..', '.gYYYYg.', 'gYkYYkYg', 'gYYYYYYg', 'gYkkkkYg', 'gYYYYYYg', '.gYYYYg.', '..gggg..'],
  };
  for (const k in AV) SPR.avatar[k] = rows(AV[k]);
})(window.AX);
