'use strict';
(function (AX) {
  const { DX, DY } = AX;
  const B = AX.BUILD, I = AX.ITEMS;
  const MW = 64, MH = 40;
  const HQX = (MW >> 1) - 1, HQY = (MH >> 1) - 1;
  const SAVE_KEY = 'axon-factory-save-v1';
  const ITEM_COL = { mango: 'o', log: 'L', juice: 'y', tokens: 'c', dataset: 'o', weights: 'p', quant: 'c', ckpt: 'Y', junk: 'P', lobo: 'l' };

  const G = (AX.G = {
    MW, MH, HQX, HQY, S: null, grid: null, obst: null, floorV: null,
    ents: new Map(), nextId: 1, belts: [], order: [], machines: [], splits: [], sells: [], dirty: true,
    parts: [], floats: [], gremlins: [], golden: null,
    chat: [], chatQ: [], clock: 0, toasts: [], modal: null, shake: 0, unread: 0, chatOpen: true,
    view: { x0: 0, y0: 0, x1: 640, y1: 360 },
    buckets: new Float64Array(10), bucketSec: 0, rate: 0, popAcc: new Map(), popT: 0, saveT: 0,
    relCache: null, lastDeliver: 0,
  });
  const claimBag = AX.Bag(AX.CLAIMS, 8);
  const jokeBag = AX.Bag(AX.JOKES, 3);
  const ambientBags = {};
  for (const k in AX.AMBIENT) ambientBags[k] = AX.Bag(AX.AMBIENT[k]);

  const idx = (x, y) => y * MW + x;
  const inb = (x, y) => x >= 0 && y >= 0 && x < MW && y < MH;
  const kindOf = (e) => B[e.type].kind;

  function defaultState(seed) {
    return {
      v: 1, seed, money: 267, time: 0, hype: 1, sus: 0, exposedT: 0, rushT: 0, mood: 1, moodT: 0,
      larpCD: 0, jokeCD: 0, rel: 0, relProg: 0, delivered: 0, earned: 0, exposures: 0, larps: 0, killed: 0,
      up: { mangoes: 0, lockin: 0, grease: 0, opsec: 0, newpc: 0, gpu: 0, quants: 0, sub: 0, sense: 0 },
      stats: {}, flags: {}, removed: [], nextEvent: 0, nextGolden: 0, nextAmbient: 30, ended: false,
    };
  }

  function genWorld(seed) {
    G.grid = new Int32Array(MW * MH);
    G.obst = new Uint8Array(MW * MH);
    G.floorV = new Uint8Array(MW * MH);
    G.ents.clear();
    G.nextId = 1;
    G.dirty = true;
    G.parts.length = 0;
    G.floats.length = 0;
    G.gremlins.length = 0;
    G.golden = null;
    G.relCache = null;
    const r = AX.mulberry32(seed);
    for (let i = 0; i < MW * MH; i++) {
      const v = r();
      G.floorV[i] = v < 0.5 ? 0 : v < 0.7 ? 1 : v < 0.82 ? 2 : v < 0.92 ? 3 : v < 0.97 ? 5 : 4;
    }
    const nearHQ = (x, y) => Math.abs(x - HQX - 1) < 8 && Math.abs(y - HQY - 1) < 6;
    for (let c = 0; c < 26; c++) {
      const cx = Math.floor(r() * MW), cy = Math.floor(r() * MH);
      const n = 1 + Math.floor(r() * 4);
      for (let k = 0; k < n; k++) {
        const x = cx + Math.floor(r() * 3) - 1, y = cy + Math.floor(r() * 3) - 1;
        if (inb(x, y) && !nearHQ(x, y)) G.obst[idx(x, y)] = 1 + (r() < 0.5 ? 1 : 0);
      }
    }
    addEnt('hq', HQX, HQY, 1);
  }

  function fronts(e) {
    const s = e.size, r = e.rot, out = [];
    for (let i = 0; i < s; i++) {
      if (r === 0) out.push([e.x + s, e.y + i]);
      else if (r === 1) out.push([e.x + i, e.y + s]);
      else if (r === 2) out.push([e.x - 1, e.y + i]);
      else out.push([e.x + i, e.y - 1]);
    }
    return out;
  }
  function addEnt(type, x, y, rot) {
    const d = B[type];
    const e = { id: G.nextId++, type, x, y, rot: rot || 0, size: d.size };
    if (d.kind === 'belt') Object.assign(e, { item: null, prog: 0, inDir: e.rot, curve: -1 });
    else if (d.kind === 'split') Object.assign(e, { buf: null, bufDir: 0, rr: 0 });
    else if (d.kind !== 'sell')
      Object.assign(e, { inv: {}, q: [], out: [], cur: null, work: false, t: 0, rr: 0, crashed: false, crashT: 0, rebootT: 0, stuck: 0, idle: 0, need: null, blocked: false, made: 0 });
    e.fr = fronts(e);
    for (let dy = 0; dy < e.size; dy++) for (let dx = 0; dx < e.size; dx++) G.grid[idx(x + dx, y + dy)] = e.id;
    G.ents.set(e.id, e);
    G.dirty = true;
    return e;
  }
  function entAt(x, y) {
    if (!inb(x, y)) return null;
    const id = G.grid[idx(x, y)];
    return id ? G.ents.get(id) : null;
  }
  function canPlace(type, x, y) {
    const s = B[type].size;
    for (let dy = 0; dy < s; dy++)
      for (let dx = 0; dx < s; dx++) {
        const X = x + dx, Y = y + dy;
        if (!inb(X, Y) || G.obst[idx(X, Y)] || G.grid[idx(X, Y)]) return false;
      }
    return true;
  }
  function unlocked(type) {
    return B[type].u <= G.S.rel;
  }
  function tryPlace(type, x, y, rot) {
    const d = B[type], S = G.S;
    if (!unlocked(type)) return 'locked';
    if (d.kind === 'belt') {
      const e = entAt(x, y);
      if (e && kindOf(e) === 'belt') {
        if (e.type === type) {
          if (e.rot !== rot) {
            e.rot = rot;
            e.fr = fronts(e);
            G.dirty = true;
            return 'rot';
          }
          return 'same';
        }
        const diff = d.cost - Math.floor(B[e.type].cost * 0.67);
        if (S.money < diff) return 'money';
        S.money -= diff;
        e.type = type;
        e.rot = rot;
        e.fr = fronts(e);
        G.dirty = true;
        return 'ok';
      }
    }
    if (!canPlace(type, x, y)) return 'blocked';
    if (S.money < d.cost) return 'money';
    S.money -= d.cost;
    const e = addEnt(type, x, y, rot);
    onBuilt(e);
    return 'ok';
  }
  function removeEnt(e) {
    if (e.type === 'hq') return false;
    G.S.money += Math.floor(B[e.type].cost * 0.67);
    for (let dy = 0; dy < e.size; dy++) for (let dx = 0; dx < e.size; dx++) G.grid[idx(e.x + dx, e.y + dy)] = 0;
    G.ents.delete(e.id);
    G.dirty = true;
    return true;
  }
  function removeAt(x, y) {
    const e = entAt(x, y);
    if (e) return removeEnt(e) ? 'ok' : 'hq';
    if (inb(x, y) && G.obst[idx(x, y)]) {
      if (G.S.money < 67) return 'money';
      G.S.money -= 67;
      G.obst[idx(x, y)] = 0;
      G.S.removed.push(idx(x, y));
      burst(x * 16 + 8, y * 16 + 8, ['c', 'w', 'L'], 14, 50);
      return 'ice';
    }
    return null;
  }
  function rotateEnt(e) {
    if (!e || e.type === 'hq') return;
    e.rot = (e.rot + 1) % 4;
    e.fr = fronts(e);
    G.dirty = true;
  }

  function rebuild() {
    G.belts = [];
    G.machines = [];
    G.splits = [];
    G.sells = [];
    for (const e of G.ents.values()) {
      const k = kindOf(e);
      if (k === 'belt') G.belts.push(e);
      else if (k === 'split') G.splits.push(e);
      else if (k === 'sell') G.sells.push(e);
      else G.machines.push(e);
    }

    const depth = new Map();
    for (const b of G.belts) {
      if (depth.has(b.id)) continue;
      const path = [], seen = new Set();
      let cur = b;
      while (cur && !depth.has(cur.id) && !seen.has(cur.id)) {
        path.push(cur);
        seen.add(cur.id);
        const n = entAt(cur.x + DX[cur.rot], cur.y + DY[cur.rot]);
        cur = n && kindOf(n) === 'belt' ? n : null;
      }
      let base = cur && depth.has(cur.id) ? depth.get(cur.id) + 1 : 0;
      for (let i = path.length - 1; i >= 0; i--) depth.set(path[i].id, base++);
    }
    G.order = G.belts.slice().sort((a, b) => depth.get(a.id) - depth.get(b.id));

    for (const b of G.belts) {
      let back = false, sides = 0, side = -1;
      for (let k = 0; k < 4; k++) {
        const n = entAt(b.x - DX[k], b.y - DY[k]);
        if (!n || n === b) continue;
        const nk = kindOf(n);
        const feeds = (nk === 'belt' || nk === 'src' || nk === 'proc' || nk === 'mod') && n.rot === k;
        if (!feeds) continue;
        if (k === b.rot) back = true;
        else if (k !== (b.rot + 2) % 4) {
          sides++;
          side = k;
        }
      }
      b.curve = !back && sides === 1 ? side : -1;
    }
    G.dirty = false;
  }

  function insertAt(x, y, item, dir, carry) {
    const e = entAt(x, y);
    if (!e) return false;
    if (kindOf(e) === 'belt') {
      if (e.item || e.rot === (dir + 2) % 4) return false;
      e.item = item;
      e.prog = Math.min(carry || 0, 0.5);
      e.inDir = dir;
      return true;
    }
    return accept(e, item, dir);
  }
  function accept(e, item, dir) {
    const d = B[e.type], k = d.kind;
    if (k === 'sell') {
      deliver(item, e);
      return true;
    }
    if (k === 'split') {
      if (e.buf) return false;
      e.buf = item;
      e.bufDir = dir;
      return true;
    }
    if (k === 'src' || e.crashed) return false;
    if (I[item.t].junk) {
      const cx = (e.x + e.size / 2) * 16, cy = (e.y + e.size / 2) * 16;
      burst(cx, cy - 6, ['P', 'm', 'l'], 5, 20);
      return true;
    }
    if (k === 'proc') {
      const need = d.inp[item.t];
      if (!need) return false;
      const have = e.inv[item.t] || 0;
      if (have >= need * 2) return false;
      e.inv[item.t] = have + 1;
      return true;
    }
    if (k === 'mod') {
      if (e.q.length >= 2) return false;
      e.q.push(item);
      return true;
    }
    return false;
  }
  const outCount = (d) => {
    let n = 0;
    for (const k in d.out) n += d.out[k];
    return n;
  };
  function speedOf(m) {
    const S = G.S;
    let s = 1 + 0.12 * S.up.lockin;
    if (m.type === 'tree') s *= 1 + 0.25 * S.up.mangoes;
    if (m.type === 'trainer') s *= Math.pow(1.5, S.up.gpu);
    if (S.rushT > 0) s *= 1.67;
    return s;
  }
  function pushOut(m) {
    if (!m.out.length) return;
    const n = m.fr.length;
    for (let k = 0; k < n; k++) {
      const i = (m.rr + k) % n;
      const [x, y] = m.fr[i];
      if (insertAt(x, y, m.out[0], m.rot, 0)) {
        m.out.shift();
        m.rr = i + 1;
        return;
      }
    }
  }
  function updMachine(m, dt) {
    const d = B[m.type];
    if (m.crashed) {
      m.crashT += dt;
      if (m.rebootT > 0) {
        m.rebootT -= dt;
        if (m.rebootT <= 0) {
          m.crashed = false;
          AX.Audio.play('reboot');
          float((m.x + m.size / 2) * 16, m.y * 16 - 4, 'back online', 'g');
        }
      } else if (m.crashT > 45) m.rebootT = 1.2;
      return;
    }
    if (m.stuck > 0) {
      m.stuck -= dt;
      return;
    }
    pushOut(m);
    const cap = d.kind === 'proc' ? Math.max(2, outCount(d) * 2) : 2;
    if (!m.work) {
      let ok = false;
      m.blocked = false;
      if (d.kind === 'src') {
        ok = m.out.length < cap;
        m.blocked = !ok;
      } else if (d.kind === 'proc') {
        if (m.out.length + outCount(d) > cap) m.blocked = true;
        else {
          ok = true;
          for (const it in d.inp)
            if ((m.inv[it] || 0) < d.inp[it]) {
              ok = false;
              m.need = it;
              break;
            }
          if (ok) for (const it in d.inp) m.inv[it] -= d.inp[it];
        }
      } else if (d.kind === 'mod') {
        if (m.out.length >= cap) m.blocked = true;
        else if (m.q.length) {
          const it = m.q[0];
          const eligible = !(it.m & d.mod) && !I[it.t].junk && (d.mod !== 2 || I[it.t].model);
          if (!eligible) m.out.push(m.q.shift());
          else {
            m.cur = m.q.shift();
            ok = true;
          }
        }
      }
      if (ok) {
        m.work = true;
        m.t = 0;
        m.idle = 0;
        m.need = null;
      } else m.idle += dt;
    }
    if (m.work) {
      m.t += dt * speedOf(m);
      if (m.t >= d.time) {
        m.work = false;
        m.t = 0;
        produce(m, d);
      }
    }
  }
  function produce(m, d) {
    m.made++;
    const S = G.S;
    let col = 'w';
    if (d.kind === 'src') {
      m.out.push({ t: d.out, m: 0 });
      col = ITEM_COL[d.out];
    } else if (d.kind === 'proc') {
      for (const it in d.out)
        for (let i = 0; i < d.out[it]; i++) {
          let t = it;
          if (d.lobo && Math.random() < Math.max(0, d.lobo - 0.05 * S.up.quants)) t = 'lobo';
          m.out.push({ t, m: 0 });
          col = ITEM_COL[it];
        }
    } else if (d.kind === 'mod' && m.cur) {
      m.cur.m |= d.mod;
      m.out.push(m.cur);
      col = d.mod === 1 ? 'r' : 'g';
      m.cur = null;
    }
    const [fx, fy] = m.fr[0];
    const ox = (m.x + m.size / 2) * 16 + DX[m.rot] * m.size * 6;
    const oy = (m.y + m.size / 2) * 16 + DY[m.rot] * m.size * 6;
    void fx, void fy;
    burst(ox, oy, [col, 'w'], 3, 18);
  }
  function updSplit(s) {
    if (!s.buf) return;
    const b = s.bufDir;
    const dirs = [(b + 3) % 4, b, (b + 1) % 4];
    for (let k = 0; k < 3; k++) {
      const i = (s.rr + k) % 3, d = dirs[i];
      if (insertAt(s.x + DX[d], s.y + DY[d], s.buf, d, 0)) {
        s.buf = null;
        s.rr = i + 1;
        return;
      }
    }
  }
  function updBelts(dt) {
    const mul = 1 + 0.25 * G.S.up.grease;
    for (const b of G.order) {
      if (!b.item) continue;
      b.prog += B[b.type].speed * mul * dt;
      if (b.prog >= 1) {
        if (insertAt(b.x + DX[b.rot], b.y + DY[b.rot], b.item, b.rot, b.prog - 1)) {
          b.item = null;
          b.prog = 0;
        } else b.prog = 1;
      }
    }
  }

  function itemValue(item) {
    const S = G.S;
    return I[item.t].v * (item.m & 1 ? 1.67 : 1) * (item.m & 2 ? 2 : 1) * S.hype * S.mood;
  }
  function deliver(item, e) {
    const S = G.S, def = I[item.t];
    let v = itemValue(item);
    let jackpot = false;
    if (def.v > 1) {
      S.delivered++;
      if (S.delivered % 67 === 0) {
        v *= 6.7;
        jackpot = true;
      }
    }
    S.money += v;
    S.earned += v;
    G.buckets[Math.floor(S.time) % 10] += v;
    S.stats[item.t] = (S.stats[item.t] || 0) + 1;
    G.lastDeliver = S.time;
    if (item.m & 2) addSus(0.35);
    const acc = G.popAcc.get(e.id) || { v: 0, n: 0, e };
    acc.v += v;
    acc.n++;
    G.popAcc.set(e.id, acc);
    if (def.v > 0) AX.Audio.play('sell');
    const cx = (e.x + e.size / 2) * 16, cy = e.y * 16;
    if (jackpot) {
      float(cx, cy - 18, 'SIX SEVEN! x6.7', 'Y', 2, 2.2);
      burst(cx, cy, ['y', 'Y', 'o', 'w'], 22, 70);
      AX.Audio.play('six7');
      if (Math.random() < 0.5) say(AX.pick(['lurk', 'anym']), AX.pick(['SIX SEVEN 🤣✌️', 'six seven', '67 🔥', 'bro said sussy number 😂']), 0.6);
    }
    if (!S.flags.delivered) {
      S.flags.delivered = 1;
      say('lurk', 'W', 0.8);
    }
    const R = curRelease();
    if (R && !G.modal && item.t === R.item && (!R.mod || item.m & R.mod)) {
      S.relProg++;
      if (S.relProg >= R.n) releaseDone();
    }
  }
  function addSus(v) {
    const S = G.S;
    if (S.exposedT > 0) return;
    S.sus += v * (1 - 0.18 * S.up.opsec);
    if (S.sus >= 100) expose();
  }

  function curRelease() {
    const S = G.S;
    if (G.relCache && G.relCache.i === S.rel) return G.relCache.r;
    const r = S.rel < AX.RELEASES.length ? AX.RELEASES[S.rel] : AX.endlessRelease(S.rel - AX.RELEASES.length + 1);
    G.relCache = { i: S.rel, r };
    return r;
  }
  function releaseDone() {
    const S = G.S, R = curRelease();
    S.money += R.reward;
    S.earned += R.reward;
    S.hype = Math.max(S.hype, 1) + 0.25;
    const unlockedNow = AX.TOOLBAR.filter((k) => B[k].u === S.rel + 1);
    S.rel++;
    S.relProg = 0;
    G.relCache = null;
    const benches = [];
    const pool = AX.BENCHES.slice().sort(() => Math.random() - 0.5);
    const base = Math.min(96, 58 + S.rel * 3.4);
    if (R.final) {
      benches.push(['SWE-MANGO', 67.0, 66.9], ['ARC-67', 67.0, 66.9], ["HUMANITY'S LAST MANGO", 67.0, 66.9]);
    } else
      for (let i = 0; i < 3; i++) {
        const a = Math.min(99.9, base + Math.random() * 3);
        benches.push([pool[i], a, Math.max(1, a - 0.1 - Math.random() * (i === 2 ? 30 : 3))]);
      }
    G.modal = { type: R.final ? 'ending' : 'release', R, unlocked: unlockedNow, benches, t: 0, pause: true };
    if (R.final) S.ended = true;
    AX.Audio.play('release');
    G.shake = 10;
    const hq = [...G.sells].find((e) => e.type === 'hq');
    if (hq) burst((hq.x + 1.5) * 16, hq.y * 16, ['o', 'y', 'Y', 'g', 'c', 'w'], 60, 120);
    script([
      ['anym', R.name.toLowerCase() + ' is out 😱'],
      ['proof', 'benchmarks?'],
      ['anym', 'beats ' + R.vs.toLowerCase() + ' on everyones life'],
      ['lurk', AX.pick(['tuff', 'W', 'lowk tuff', 'holy'])],
    ], 0.5);
    save();
  }

  function larp() {
    const S = G.S;
    if (S.rel < 1) return 'locked';
    if (S.exposedT > 0) return 'exposed';
    if (S.larpCD > 0) return 'cd';
    say('anym', claimBag());
    S.hype = Math.min(6.7, S.hype + 0.3 * (1 + 0.2 * S.up.sub));
    S.sus += 17 * (1 - 0.18 * S.up.opsec);
    S.larpCD = 16.7;
    S.larps++;
    S.flags.larped = 1;
    const r = AX.pick(AX.LARP_REACT);
    say(r[0], r[1], 1.1 + Math.random());
    AX.Audio.play('larp');
    if (S.sus >= 100) expose();
    else if (S.sus >= 70) {
      const w = AX.pick(AX.SUS_WARN);
      say(w[0], w[1], 2.8);
    }
    return 'ok';
  }
  function joke() {
    const S = G.S;
    if (S.sus <= 0.5 || S.jokeCD > 0 || S.exposedT > 0) return false;
    say('anym', jokeBag());
    S.sus = 0;
    S.hype = 1 + Math.max(0, S.hype - 1) * 0.5;
    S.jokeCD = 30;
    AX.Audio.play('joke');
    if (Math.random() < 0.5) say(AX.pick(['proof', 'lurk']), AX.pick(['knew it', 'son', 'ofc', 'larp confirmed', 'haha sometimes']), 1.2);
    return true;
  }
  function expose() {
    const S = G.S;
    S.sus = 0;
    S.exposedT = 67;
    S.hype = 0.67;
    S.exposures++;
    script(AX.EXPOSED, 0.4);
    toast('EXPOSED. hype tanked to x0.67 for 67s', 'r');
    AX.Audio.play('exposed');
    G.shake = 8;
  }

  function schedEvent() {
    G.S.nextEvent = G.S.time + AX.rand(48, 92);
  }
  function machineCenter(m) {
    return [(m.x + m.size / 2) * 16, (m.y + m.size / 2) * 16];
  }
  function doEvent() {
    const S = G.S;
    const opts = [];
    const comps = G.machines.filter((m) => !m.crashed && !m.stuck && m.type !== 'tree');
    if (comps.length) opts.push(['crash', 3 * (1 - 0.3 * S.up.newpc)]);
    if (G.belts.length >= 8 && !G.gremlins.length) opts.push(['gremlin', 3]);
    const procs = G.machines.filter((m) => B[m.type].kind !== 'src' && !m.crashed && !m.stuck);
    if (procs.length) opts.push(['stuck', 2]);
    if (S.money >= 140) opts.push(['axe', 0.8]);
    opts.push(['vc', 1], ['mood', 1.1]);
    let tot = 0;
    for (const o of opts) tot += o[1];
    let r = Math.random() * tot, ev = opts[opts.length - 1][0];
    for (const o of opts) {
      if ((r -= o[1]) <= 0) {
        ev = o[0];
        break;
      }
    }
    if (ev === 'crash') {
      const m = AX.pick(comps);
      m.crashed = true;
      m.crashT = 0;
      m.rebootT = 0;
      script(AX.EVENTS_TXT.crash);
      toast('PC CRASHED. click the blue screen to reboot', 'b');
      AX.Audio.play('crash');
      const [x, y] = machineCenter(m);
      burst(x, y, ['b', 'c', 'w'], 12, 40);
    } else if (ev === 'gremlin') {
      const n = Math.min(4, 1 + Math.floor(S.rel / 3));
      for (let i = 0; i < n; i++) spawnGremlin();
      script(AX.EVENTS_TXT.gremlin);
      toast('GLM 5.3 FLASH GOT IN. click it before it hallucinates your belts', 'p');
    } else if (ev === 'stuck') {
      const m = AX.pick(procs);
      m.stuck = 14;
      script(AX.EVENTS_TXT.stuck);
      toast('THINKING LOOP. click the machine so it locks in', 'y');
    } else if (ev === 'axe') {
      S.money -= 70;
      S.hype = Math.min(6.7, S.hype + 0.1);
      script(AX.EVENTS_TXT.axe);
      toast('-$70. the factory smells like axe now (+0.1 hype)', 'o');
    } else if (ev === 'vc') {
      const amt = Math.max(67, Math.round(G.rate * 25));
      S.money += amt;
      S.earned += amt;
      script(AX.EVENTS_TXT.vc);
      toast('+' + AX.money(amt) + ' from some vc. no questions', 'g');
      AX.Audio.play('buy');
    } else if (ev === 'mood') {
      const rich = Math.random() < 0.55;
      S.mood = rich ? 1.25 : 0.8;
      S.moodT = 40;
      script(rich ? AX.EVENTS_TXT.rich : AX.EVENTS_TXT.broke);
      toast(rich ? 'RICH ERA: +25% sell price for 40s' : 'BROKE ERA: -20% sell price for 40s', rich ? 'g' : 'r');
    }
  }
  function spawnGremlin() {
    const v = G.view;
    const side = Math.floor(Math.random() * 4);
    const x = side === 0 ? v.x0 + 8 : side === 1 ? v.x1 - 8 : AX.rand(v.x0 + 20, v.x1 - 20);
    const y = side === 2 ? v.y0 + 40 : side === 3 ? v.y1 - 50 : AX.rand(v.y0 + 40, v.y1 - 50);
    G.gremlins.push({ x: AX.clamp(x, 8, MW * 16 - 8), y: AX.clamp(y, 8, MH * 16 - 8), target: null, life: 45, t: Math.random() * 3, pause: 0, eaten: 0, dead: 0 });
  }
  function updGremlins(dt) {
    for (const g of G.gremlins) {
      g.t += dt;
      if (g.dead) {
        g.dead += dt;
        continue;
      }
      g.life -= dt;
      if (g.life <= 0) {
        g.dead = 0.001;
        g.fled = true;
        burst(g.x, g.y, ['p', 'P'], 8, 30);
        continue;
      }
      if (g.pause > 0) {
        g.pause -= dt;
        continue;
      }
      if (!g.target || !G.ents.has(g.target.id) || !g.target.item || I[g.target.item.t].junk) {
        let best = null, bd = 1e9;
        for (const b of G.belts) {
          if (!b.item || I[b.item.t].junk) continue;
          const d = Math.hypot(b.x * 16 + 8 - g.x, b.y * 16 + 8 - g.y) + Math.random() * 90;
          if (d < bd) {
            bd = d;
            best = b;
          }
        }
        g.target = best;
        if (!best) {
          g.x += Math.cos(g.t) * 10 * dt;
          g.y += Math.sin(g.t * 0.7) * 10 * dt;
          continue;
        }
      }
      const tx = g.target.x * 16 + 8, ty = g.target.y * 16 + 8;
      const dx = tx - g.x, dy = ty - g.y, d = Math.hypot(dx, dy);
      if (d < 3) {
        if (g.target.item && !I[g.target.item.t].junk) {
          g.target.item = { t: 'junk', m: 0 };
          g.eaten++;
          burst(tx, ty, ['P', 'c', 'h'], 6, 30);
          if (g.eaten === 3 && Math.random() < 0.6) say('glm', AX.pick(AX.AMBIENT.glm));
        }
        g.target = null;
        g.pause = 0.5;
      } else {
        const sp = 30 * dt;
        g.x += (dx / d) * Math.min(sp, d);
        g.y += (dy / d) * Math.min(sp, d);
      }
    }
    G.gremlins = G.gremlins.filter((g) => !g.dead || g.dead < 0.4);
  }
  function spawnGolden() {
    const v = G.view;
    G.golden = { x: AX.rand(v.x0 + 50, v.x1 - 60), y: AX.rand(v.y0 + 70, v.y1 - 80), vx: AX.rand(-14, 14), vy: AX.rand(-7, 7), t: 0, life: 13 };
  }
  function collectGolden() {
    const S = G.S, g = G.golden;
    G.golden = null;
    const r = AX.pick(['rush', 'cash', 'hype']);
    burst(g.x, g.y, ['Y', 'y', 'w', 'o'], 30, 90);
    AX.Audio.play('golden');
    if (r === 'rush') {
      S.rushT = 67;
      float(g.x, g.y - 10, 'MANGO RUSH! x1.67 speed for 67s', 'Y', 1, 2.5);
    } else if (r === 'cash') {
      const amt = Math.max(167, Math.round(G.rate * 67));
      S.money += amt;
      S.earned += amt;
      float(g.x, g.y - 10, '+' + AX.money(amt), 'Y', 2, 2.5);
    } else {
      S.hype = Math.min(6.7, S.hype + 0.67);
      float(g.x, g.y - 10, '+0.67 HYPE', 'Y', 1, 2.5);
    }
    say('anym', AX.pick(['MANGOMANGOMANGO', 'MANGO 🥭🥭', 'golden mango. its a sign', 'ouu shii']), 0.4);
  }
  function clickAt(wx, wy) {
    if (G.golden && Math.hypot(G.golden.x - wx, G.golden.y - wy) < 13) {
      collectGolden();
      return 'golden';
    }
    for (const g of G.gremlins) {
      if (g.dead) continue;
      if (Math.hypot(g.x - wx, g.y - wy) < 10) {
        g.dead = 0.001;
        const S = G.S;
        const amt = Math.max(27, Math.round(G.rate * 8));
        S.money += amt;
        S.earned += amt;
        S.killed++;
        float(g.x, g.y - 12, 'squashed +' + AX.money(amt), 'p');
        burst(g.x, g.y, ['p', 'P', 'i', 'c'], 20, 70);
        AX.Audio.play('squash');
        G.shake = 3;
        if (Math.random() < 0.4) say(AX.pick(['lurk', 'anym']), AX.pick(['W', 'get out glm', 'smollm is better than glm 5.3 flash', 'NEVER EVER']), 0.5);
        return 'gremlin';
      }
    }
    const e = entAt(Math.floor(wx / 16), Math.floor(wy / 16));
    if (e && e.crashed && e.rebootT <= 0) {
      e.rebootT = 1.2;
      AX.Audio.play('ui');
      float((e.x + e.size / 2) * 16, e.y * 16 - 4, 'rebooting...', 'c');
      return 'reboot';
    }
    if (e && e.stuck > 0) {
      e.stuck = 0;
      float((e.x + e.size / 2) * 16, e.y * 16 - 4, 'locked in', 'y');
      AX.Audio.play('reboot');
      return 'unstuck';
    }
    return null;
  }

  function say(who, text, delay) {
    G.chatQ.push({ who, text, at: G.clock + (delay || 0) });
    G.chatQ.sort((a, b) => a.at - b.at);
  }
  function script(lines, start) {
    let t = start || 0;
    for (const [w, tx] of lines) {
      say(w, tx, t);
      t += 0.8 + Math.min(2, tx.length * 0.03) + Math.random() * 0.4;
    }
    return t;
  }
  function processChat() {
    while (G.chatQ.length && G.chatQ[0].at <= G.clock) {
      const m = G.chatQ.shift();
      G.chat.push({ who: m.who, text: m.text, t: G.clock });
      if (G.chat.length > 60) G.chat.shift();
      if (!G.chatOpen) G.unread++;
      AX.Audio.play('msg');
    }
  }
  function toast(text, col) {
    G.toasts.push({ text, col: col || 'y', t: 0, life: 5 });
    if (G.toasts.length > 3) G.toasts.shift();
  }
  function float(x, y, text, col, s, life) {
    G.floats.push({ x, y, text, col: col || 'w', s: s || 1, t: 0, life: life || 1.4 });
  }
  function burst(x, y, cols, n, sp) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = (0.3 + Math.random() * 0.7) * (sp || 40);
      G.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - sp * 0.3, c: AX.pick(cols), t: 0, life: 0.4 + Math.random() * 0.6 });
    }
    if (G.parts.length > 900) G.parts.splice(0, G.parts.length - 900);
  }
  function tickFx(dt) {
    for (const p of G.parts) {
      p.t += dt;
      p.vy += 140 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    G.parts = G.parts.filter((p) => p.t < p.life);
    for (const f of G.floats) f.t += dt;
    G.floats = G.floats.filter((f) => f.t < f.life);
    for (const t of G.toasts) t.t += dt;
    G.toasts = G.toasts.filter((t) => t.t < t.life);
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 30);
  }

  const FIRST = {
    tree: [['anym', 'more mangoes so that it locks in']],
    juicer: [['anym', 'mango juice. the secret ingredient']],
    logger: [['jensen', 'are you logging my gc']],
    tokenizer: [['lurk', 'tuff']],
    blender: [['anym', 'mango flavoured datasets. nobody else is doing this']],
    trainer: [['anym', 'time to train axon fr'], ['jensen', 'is that my gpu']],
    quantizer: [['anym', 'im the master of quants trust']],
    press: [['lurk', 'six seven 🤣✌️']],
    merger: [['anym', 'the mango is load-bearing']],
    bench: [['proof', 'bro is literally benchmaxxing']],
    upload: [['anym', 'uploading to huggingface rn']],
    fbelt: [['anym', 'greased the belts with mango juice. dont ask']],
  };
  function onBuilt(e) {
    const S = G.S;
    const key = 'b_' + e.type;
    if (!S.flags[key]) {
      S.flags[key] = 1;
      if (FIRST[e.type]) script(FIRST[e.type], 0.4);
    }
  }
  function hint() {
    const S = G.S, f = S.flags;
    if (S.rel === 0) {
      if (!f.b_tree) return 'pick MANGO TREE [5] and place it near AXON HQ. it drops mangoes out of its yellow arrow. R rotates';
      if (!f.delivered) return 'drag BELTS [1] from the arrow into AXON HQ, or put the tree right against HQ';
      return 'deliver 67 mangoes to ship AXON 2 COBALT. more trees = faster';
    }
    if (S.rel === 1 && !f.b_juicer) return 'new: JUICER [7]. mango in, juice out (3x value). AXON 2 REGENT needs 67 juice';
    if (S.rel >= 1 && !f.larped) return 'new: the LARP button. claims pump HYPE (x money) but raise SUS. hit 100% SUS and you get exposed';
    if (S.rel === 2 && !f.b_logger) return 'new: GC LOGGER [6] + TOKENIZER [8]. chat logs > tokens. next release: 67 tokens';
    if (S.rel === 3 && !f.b_blender) return 'new: DATASET BLENDER [9]. needs juice AND tokens. belts side-load, so merge two lines into one';
    if (S.rel === 4 && !f.b_trainer) return 'new: GPU TRAINER [0]. 2 datasets > 1 axon weights ($67 each)';
    if (S.rel === 5 && !f.b_quantizer) return 'new: QUANTIZER + GREASED BELT. 1 weights > 2 q4 weights. ~10% come out lobotomized';
    if (S.rel === 6 && !f.b_press) return 'new: 67 PRESS. stamps [67] on anything (x1.67). next release needs [67] axon weights';
    if (S.rel === 7 && !f.b_merger) return 'new: CHECKPOINT MERGER. 2 q4 + 1 mango > axon checkpoint ($267)';
    if (S.rel === 8 && !f.b_bench) return 'new: BENCHMAXXER. x2 value on model items, but every delivery adds SUS';
    if (S.rel === 9) return 'last one. AXON 6.7. 667 [67] checkpoints. lock in';
    return null;
  }

  function update(dt) {
    const S = G.S;
    if (!S) return;
    G.clock += dt;
    processChat();
    tickFx(dt);
    if (G.modal && G.modal.pause) return;
    if (G.dirty) rebuild();
    S.time += dt;

    const sec = Math.floor(S.time);
    while (G.bucketSec < sec) {
      G.bucketSec++;
      G.buckets[G.bucketSec % 10] = 0;
    }
    let sum = 0;
    for (let i = 0; i < 10; i++) if (i !== sec % 10) sum += G.buckets[i];
    G.rate = sum / Math.min(9, Math.max(1, S.time - 1));

    S.larpCD = Math.max(0, S.larpCD - dt);
    S.jokeCD = Math.max(0, S.jokeCD - dt);
    S.rushT = Math.max(0, S.rushT - dt);
    if (S.moodT > 0) {
      S.moodT -= dt;
      if (S.moodT <= 0) S.mood = 1;
    }
    if (S.exposedT > 0) {
      S.exposedT -= dt;
      S.hype = 0.67;
      if (S.exposedT <= 0) {
        S.hype = 1;
        say('anym', AX.pick(['ok everyone forgot right', 'anyway', 'that never happened', 'Oh-kay.']));
      }
    } else if (S.hype > 1) S.hype = 1 + (S.hype - 1) * Math.exp((-dt * 0.025) / (1 + 0.35 * S.up.sub));
    S.sus = Math.max(0, S.sus - dt * 0.3);

    for (const m of G.machines) updMachine(m, dt);
    updBelts(dt);
    for (const s of G.splits) updSplit(s);
    updGremlins(dt);
    if (G.golden) {
      const g = G.golden;
      g.t += dt;
      g.x += g.vx * dt;
      g.y += g.vy * dt + Math.sin(g.t * 3) * 0.3;
      if (g.t > g.life) {
        G.golden = null;
        say('anym', 'nooo the mango 😢', 0.3);
      }
    }
    if (S.rel >= 1) {
      if (!S.nextEvent) schedEvent();
      if (S.time >= S.nextEvent) {
        doEvent();
        schedEvent();
      }
      if (!S.nextGolden) S.nextGolden = S.time + AX.rand(40, 80);
      if (!G.golden && S.time >= S.nextGolden) {
        spawnGolden();
        S.nextGolden = S.time + AX.rand(70, 150) / (1 + 0.4 * S.up.sense);
      }
    }
    if (S.time >= S.nextAmbient) {
      S.nextAmbient = S.time + AX.rand(22, 46);
      if (S.rel > 0 && S.time - G.lastDeliver > 60 && Math.random() < 0.6) say('proof', AX.pick(['bro is NOT locked in', 'factory looking dead', 'lock in']));
      else {
        const r = Math.random();
        const who = r < 0.45 ? 'anym' : r < 0.6 ? 'proof' : r < 0.8 ? 'lurk' : r < 0.9 ? 'jensen' : 'glm';
        say(who, ambientBags[who]());
      }
    }

    G.popT += dt;
    if (G.popT > 0.5) {
      G.popT = 0;
      for (const [id, a] of G.popAcc) {
        if (a.v >= 0.5) float((a.e.x + a.e.size / 2) * 16, a.e.y * 16 - 2, '+' + AX.money(a.v), a.e.type === 'hq' ? 'g' : 'Y');
        G.popAcc.delete(id);
      }
    }
    G.saveT += dt;
    if (G.saveT > 20) save();
  }

  function buyUpgrade(id) {
    const S = G.S;
    const u = AX.UPGRADES.find((x) => x.id === id);
    const lvl = S.up[id];
    if (!u || lvl >= u.max || (u.need && S.rel < u.need)) return false;
    const c = AX.upCost(u, lvl);
    if (S.money < c) return false;
    S.money -= c;
    S.up[id]++;
    AX.Audio.play('buy');
    return true;
  }

  function save() {
    G.saveT = 0;
    if (!G.S) return;
    try {
      const ents = [];
      for (const e of G.ents.values()) if (e.type !== 'hq') ents.push([e.type, e.x, e.y, e.rot]);
      localStorage.setItem(SAVE_KEY, JSON.stringify({ S: G.S, ents }));
    } catch (err) {

    }
  }
  function hasSave() {
    try {
      return !!localStorage.getItem(SAVE_KEY);
    } catch (e) {
      return false;
    }
  }
  function load() {
    try {
      const d = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (!d || !d.S) return false;
      const S = Object.assign(defaultState(d.S.seed), d.S);
      S.up = Object.assign(defaultState(0).up, d.S.up || {});
      G.S = S;
      genWorld(S.seed);
      for (const i of S.removed) G.obst[i] = 0;
      for (const [t, x, y, r] of d.ents) {
        if (!B[t] || t === 'hq') continue;
        const s = B[t].size;
        for (let dy = 0; dy < s; dy++) for (let dx = 0; dx < s; dx++) if (inb(x + dx, y + dy)) G.obst[idx(x + dx, y + dy)] = 0;
        if (canPlace(t, x, y)) addEnt(t, x, y, r);
      }
      G.chat.length = 0;
      G.chatQ.length = 0;
      G.bucketSec = Math.floor(S.time);
      G.buckets.fill(0);
      G.lastDeliver = S.time;
      return true;
    } catch (err) {
      console.warn('save broke', err);
      return false;
    }
  }
  function newGame(silent) {
    const seed = (Math.random() * 1e9) | 0;
    G.S = defaultState(seed);
    genWorld(seed);
    G.chat.length = 0;
    G.chatQ.length = 0;
    G.buckets.fill(0);
    G.bucketSec = 0;
    G.lastDeliver = 0;
    G.modal = null;
    if (!silent) save();
  }
  function welcomeBack() {
    G.chat.length = 0;
    G.chatQ.length = 0;
    script([['anym', AX.pick(['im bcak', 'hi guys 😱', 'ok im back. lock in'])], ['lurk', AX.pick(['W', 'son', 'he lives'])]], 0.6);
  }
  function intro() {
    script([
      ['anym', 'guys im building the axon factory'],
      ['lurk', 'where'],
      ['anym', 'jensen huangs fridge. its cold in here. good for the gpus'],
      ['jensen', 'what'],
      ['proof', 'proof'],
      ['anym', 'just watch. axon 2.5 better'],
    ], 0.8);
  }
  function wipe() {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch (e) {}
  }

  AX.Sim = {
    update, tryPlace, removeAt, removeEnt, rotateEnt, entAt, canPlace, unlocked, clickAt, larp, joke, buyUpgrade,
    curRelease, hint, save, load, hasSave, newGame, wipe, intro, welcomeBack, say, script, toast, float, burst, itemValue, speedOf,
    inb, idx,
  };
})(window.AX);
