'use strict';
(function (AX) {
  const RAW = {
    A: '.##.|#..#|####|#..#|#..#', B: '###.|#..#|###.|#..#|###.', C: '.###|#...|#...|#...|.###',
    D: '###.|#..#|#..#|#..#|###.', E: '####|#...|###.|#...|####', F: '####|#...|###.|#...|#...',
    G: '.###|#...|#.##|#..#|.###', H: '#..#|#..#|####|#..#|#..#', I: '###|.#.|.#.|.#.|###',
    J: '...#|...#|...#|#..#|.##.', K: '#..#|#.#.|##..|#.#.|#..#', L: '#...|#...|#...|#...|####',
    M: '#...#|##.##|#.#.#|#...#|#...#', N: '#..#|##.#|#.##|#..#|#..#', O: '.##.|#..#|#..#|#..#|.##.',
    P: '###.|#..#|###.|#...|#...', Q: '.##.|#..#|#..#|#.#.|.#.#', R: '###.|#..#|###.|#.#.|#..#',
    S: '.###|#...|.##.|...#|###.', T: '###|.#.|.#.|.#.|.#.', U: '#..#|#..#|#..#|#..#|.##.',
    V: '#.#|#.#|#.#|#.#|.#.', W: '#...#|#...#|#.#.#|##.##|#...#', X: '#.#|#.#|.#.|#.#|#.#',
    Y: '#.#|#.#|.#.|.#.|.#.', Z: '####|...#|.##.|#...|####',
    a: '...|.##|#.#|#.#|.##', b: '#..|#..|##.|#.#|##.', c: '...|.##|#..|#..|.##',
    d: '..#|..#|.##|#.#|.##', e: '...|.##|###|#..|.##', f: '.##|.#.|###|.#.|.#.',
    g: '...|.##|#.#|.##|..#|##.', h: '#..|#..|##.|#.#|#.#', i: '#|.|#|#|#',
    j: '.#|..|.#|.#|.#|#.', k: '#..|#..|#.#|##.|#.#', l: '#.|#.|#.|#.|.#',
    m: '.....|####.|#.#.#|#.#.#|#.#.#', n: '...|##.|#.#|#.#|#.#', o: '...|.#.|#.#|#.#|.#.',
    p: '...|##.|#.#|#.#|##.|#..', q: '...|.##|#.#|#.#|.##|..#', r: '...|#.#|##.|#..|#..',
    s: '...|.##|#..|..#|##.', t: '.#.|###|.#.|.#.|..#', u: '...|#.#|#.#|#.#|.##',
    v: '...|#.#|#.#|#.#|.#.', w: '.....|#...#|#.#.#|#.#.#|.#.#.', x: '...|#.#|.#.|.#.|#.#',
    y: '...|#.#|#.#|.##|..#|##.', z: '...|###|..#|.#.|###',
    0: '###|#.#|#.#|#.#|###', 1: '.#.|##.|.#.|.#.|###', 2: '##.|..#|.#.|#..|###',
    3: '##.|..#|.#.|..#|##.', 4: '#.#|#.#|###|..#|..#', 5: '###|#..|##.|..#|##.',
    6: '.##|#..|###|#.#|###', 7: '###|..#|..#|.#.|.#.', 8: '###|#.#|###|#.#|###',
    9: '###|#.#|###|..#|##.',
    '.': '.|.|.|.|#', ',': '.|.|.|.|#|#', '!': '#|#|#|.|#', '?': '##.|..#|.#.|...|.#.',
    "'": '#|#', '"': '#.#|#.#', ':': '.|#|.|#|.', ';': '.|#|.|#|#', '-': '...|...|###',
    '+': '...|.#.|###|.#.', '=': '...|###|...|###', '/': '..#|..#|.#.|#..|#..',
    '\\': '#..|#..|.#.|..#|..#', '(': '.#|#.|#.|#.|.#', ')': '#.|.#|.#|.#|#.',
    '[': '##|#.|#.|#.|##', ']': '##|.#|.#|.#|##', '$': '.##|##.|.#.|.##|##.',
    '%': '#.#|..#|.#.|#..|#.#', '#': '.#.#.|#####|.#.#.|#####|.#.#.', '&': '.#..|#.#.|.#..|#.#.|.#.#',
    '*': '...|#.#|.#.|#.#', '<': '..#|.#.|#..|.#.|..#', '>': '#..|.#.|..#|.#.|#..',
    '_': '...|...|...|...|###', '^': '.#.|#.#', '|': '#|#|#|#|#', '~': '....|.#.#|#.#.',
    '@': '.##.|#..#|#.##|#...|.###', '`': '#.|.#', '{': '.#|#.|##|#.|.#', '}': '#.|.#|##|.#|#.',
  };
  const SUB = { '’': "'", '‘': "'", '“': '"', '”': '"', '…': '...', '—': '-', '–': '-', '×': 'x', '→': '>' };

  const EMO = {
    mango: ['....gG.', '...gGg.', '.uyyyyu', 'uyYYyyu', 'uyYyyou', '.uyyoou', '..uuuu.'],
    sob: ['.uuuuu.', 'uyyyyyu', 'ukkykku', 'ucyyycu', 'ucykycu', 'ucyyycu', '.uuuuu.'],
    lol: ['.uuuuu.', 'uyyyyyu', 'ukyyyku', 'cyyyyyc', 'ukkkkku', 'uyrrryu', '.uuuuu.'],
    sad: ['.uuuuu.', 'uyyyyyu', 'ukyyyku', 'uyyyycu', 'uyyyycu', 'uykkkyu', '.uuuuu.'],
    plead: ['.uuuuu.', 'uyyyyyu', 'uwkywku', 'ukkykku', 'uyyyyyu', 'uyykyyu', '.uuuuu.'],
    mad: ['.RRRRR.', 'RrrrrrR', 'RkrrrkR', 'RrkrkrR', 'RrrrrrR', 'RrkkkrR', '.RRRRR.'],
    shock: ['.uuuuu.', 'uyyyyyu', 'uwkywku', 'uyyyyyu', 'uyykyyu', 'uyykyyu', '.uuuuu.'],
    meh: ['.uuuuu.', 'uyyyyyu', 'ukyyyku', 'uyyyyyu', 'uykkkyu', 'uyyyyyu', '.uuuuu.'],
    peace: ['.y.y...', '.y.y...', '.y.y...', 'yyyyy..', 'yyyyy..', 'yyyyy..', '.yyy...'],
    thumb: ['..y....', '..y....', '.yy....', 'yyyyy..', 'yyyyy..', 'yyyyy..', 'yyyy...'],
    pray: ['...y...', '..yyy..', '..yyy..', '.yyyyy.', '.yyyyy.', 'yyyyyyy', '.yy.yy.'],
    heart: ['.rr.rr.', 'rwrrrrr', 'rrrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...'],
    broke: ['.rr.rr.', 'rwrkrrr', 'rrrkrrr', 'rrkrrrr', '.rrkrr.', '..rkr..', '...r...'],
    skull: ['.LLLLL.', 'LLLLLLL', 'LkkLkkL', 'LkkLkkL', 'LLLkLLL', '.LLLLL.', '.L.L.L.'],
    fire: ['...o...', '..oo...', '..ooo.o', '.ooyoo.', 'ooyYyoo', 'oyYYYyo', '.oyyyo.'],
    cricket: ['g....g.', '.g..g..', '..ggg..', '.gGgGg.', 'gGgGgGg', '.g.g.g.', 'g..g..g'],
    party: ['.....i.', '..y.y..', 'r.c....', '..kk.y.', '.kyk...', 'kyyk.c.', 'kkk....'],
  };
  const EMO_MAP = {
    '🥭': 'mango', '😭': 'sob', '🤣': 'lol', '😂': 'lol', '😢': 'sad', '🥺': 'plead', '😡': 'mad',
    '😱': 'shock', '😐': 'meh', '😔': 'sad', '✌': 'peace', '👍': 'thumb', '🙏': 'pray', '❤': 'heart',
    '💔': 'broke', '💀': 'skull', '☠': 'skull', '🔥': 'fire', '🦗': 'cricket', '🥳': 'party', '😨': 'shock',
  };

  const H = 6;
  const G = {};
  let atlasW = 0;
  for (const ch in RAW) {
    const rows = RAW[ch].split('|');
    let w = 0;
    for (const r of rows) w = Math.max(w, r.length);
    G[ch] = { rows, w, x: atlasW };
    atlasW += w + 1;
  }
  const [base, bx] = AX.canvas(atlasW, H);
  bx.fillStyle = '#fff';
  for (const ch in G) {
    const g = G[ch];
    g.rows.forEach((r, y) => {
      for (let x = 0; x < r.length; x++) if (r[x] === '#') bx.fillRect(g.x + x, y, 1, 1);
    });
  }
  const tinted = {};
  function atlas(color) {
    let a = tinted[color];
    if (a) return a;
    const [c, x] = AX.canvas(atlasW, H);
    x.drawImage(base, 0, 0);
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = AX.PAL[color] || color;
    x.fillRect(0, 0, atlasW, H);
    tinted[color] = c;
    return c;
  }
  const emo = {};
  for (const k in EMO) emo[k] = AX.fromRows(EMO[k]);

  const emoShadow = {};
  function emoSh(name, color) {
    const key = name + color;
    if (emoShadow[key]) return emoShadow[key];
    const src = emo[name];
    const [c, x] = AX.canvas(src.width, src.height);
    x.drawImage(src, 0, 0);
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = AX.PAL[color] || color;
    x.fillRect(0, 0, c.width, c.height);
    emoShadow[key] = c;
    return c;
  }

  function chars(str) {
    const out = [];
    for (const ch of String(str)) {
      if (ch === '️' || ch === '‍' || ch === '​') continue;
      if (SUB[ch]) {
        for (const c of SUB[ch]) out.push(c);
        continue;
      }
      out.push(ch);
    }
    return out;
  }
  function glyph(ch) {
    return G[ch] || G[ch.toUpperCase()] || null;
  }
  function adv(ch) {
    if (ch === ' ') return 3;
    if (EMO_MAP[ch]) return 8;
    const g = glyph(ch);
    return g ? g.w + 1 : 0;
  }
  function measure(str, s) {
    s = s || 1;
    let w = 0;
    for (const ch of chars(str)) w += adv(ch);
    return Math.max(0, w - 1) * s;
  }
  function raw(ctx, list, x, y, color, s, shadowPass) {
    const a = atlas(color);
    let cx = x;
    for (const ch of list) {
      if (ch === ' ') {
        cx += 3 * s;
        continue;
      }
      const em = EMO_MAP[ch];
      if (em) {
        const img = shadowPass ? emoSh(em, color) : emo[em];
        ctx.drawImage(img, cx, y - s, 7 * s, 7 * s);
        cx += 8 * s;
        continue;
      }
      const g = glyph(ch);
      if (!g) continue;
      ctx.drawImage(a, g.x, 0, g.w, H, cx, y, g.w * s, H * s);
      cx += (g.w + 1) * s;
    }
  }

  function draw(ctx, str, x, y, color, o) {
    o = o || {};
    const s = o.s || 1;
    const list = chars(str);
    let w = 0;
    for (const ch of list) w += adv(ch);
    w = Math.max(0, w - 1) * s;
    if (o.align === 'center') x -= Math.floor(w / 2);
    else if (o.align === 'right') x -= w;
    x = Math.round(x);
    y = Math.round(y);
    if (o.out) {
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1], [-1, 1], [1, -1], [-1, -1]])
        raw(ctx, list, x + dx, y + dy, o.out, s, true);
    } else if (o.sh) raw(ctx, list, x, y + s, o.sh, s, true);
    raw(ctx, list, x, y, color, s, false);
    return w;
  }
  function wrap(str, maxW, s) {
    s = s || 1;
    const words = String(str).split(' ');
    const lines = [];
    let cur = '';
    for (const wd of words) {
      const test = cur ? cur + ' ' + wd : wd;
      if (measure(test, s) <= maxW) {
        cur = test;
        continue;
      }
      if (cur) lines.push(cur);
      if (measure(wd, s) <= maxW) cur = wd;
      else {

        let part = '';
        for (const ch of chars(wd)) {
          if (measure(part + ch, s) > maxW && part) {
            lines.push(part);
            part = '';
          }
          part += ch;
        }
        cur = part;
      }
    }
    if (cur || !lines.length) lines.push(cur);
    return lines;
  }

  AX.Font = { draw, measure, wrap, H, emoji: emo };
  AX.text = draw;
})(window.AX);
