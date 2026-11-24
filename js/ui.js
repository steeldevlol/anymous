'use strict';
(function (AX) {
  const G = AX.G, SPR = AX.SPR, B = AX.BUILD, I = AX.ITEMS, P = AX.PAL, F = AX.Font;
  const UI = (AX.UI = { rects: [], next: [], active: true, tbH: 40, topH: 22, mangoes: [] });
  const txt = (ctx, s, x, y, c, o) => AX.text(ctx, s, x, y, c, o);

  function fill(ctx, c, x, y, w, h) {
    ctx.fillStyle = P[c] || c;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }
  function panel(ctx, x, y, w, h, bg, bd, hi) {
    bd = bd || 'k';
    fill(ctx, bd, x + 1, y, w - 2, h);
    fill(ctx, bd, x, y + 1, w, h - 2);
    fill(ctx, bg || 'K', x + 1, y + 1, w - 2, h - 2);
    if (hi !== null) fill(ctx, hi || 'n', x + 2, y + 1, w - 4, 1);
  }
  function block(x, y, w, h) {
    UI.next.push([x, y, w, h]);
  }
  function hit(x, y, w, h) {
    const In = AX.In;
    return UI.active && In.mx >= x && In.my >= y && In.mx < x + w && In.my < y + h;
  }
  UI.over = function (mx, my) {
    for (const [x, y, w, h] of UI.rects) if (mx >= x && my >= y && mx < x + w && my < y + h) return true;
    return false;
  };
  const STY = {
    def: { bg: 'n', hov: 'm', down: 'K', hi: 'm', txt: 'w' },
    orange: { bg: 'o', hov: 'y', down: 'u', hi: 'Y', txt: 'k' },
    green: { bg: 'G', hov: 'g', down: 'j', hi: 'g', txt: 'w' },
    red: { bg: 'R', hov: 'r', down: 'e', hi: 'r', txt: 'w' },
    cyan: { bg: 'B', hov: 'b', down: 'K', hi: 'b', txt: 'w' },
    ghost: { bg: 'K', hov: 'n', down: 'k', hi: 'n', txt: 'L' },
  };
  function button(ctx, x, y, w, h, label, o) {
    o = o || {};
    const st = STY[o.style || 'def'];
    const In = AX.In;
    const over = hit(x, y, w, h);
    block(x, y, w, h);
    const dis = !!o.dis;
    const down = over && In.down && !dis;
    const bg = dis ? 'K' : down ? st.down : over ? st.hov : st.bg;
    panel(ctx, x, y, w, h, bg, 'k', dis ? 'n' : down ? null : st.hi);
    const oy = down ? 1 : 0;
    if (o.icon) ctx.drawImage(o.icon, Math.round(x + (w - o.icon.width) / 2), Math.round(y + (h - o.icon.height) / 2) + oy);
    if (label) txt(ctx, label, x + w / 2, y + Math.floor((h - 5) / 2) + oy, dis ? 'm' : o.txt || st.txt, { align: 'center' });
    if (over && In.pressed && !In.used) {
      In.used = true;
      if (dis) {
        AX.Audio.play('deny');
        return false;
      }
      AX.Audio.play('ui');
      return true;
    }
    return false;
  }
  UI.button = button;
  UI.panel = panel;

  const ICON = {
    spk: AX.fromRows(['...w....', '..ww.w..', 'wwww..w.', 'wwww..w.', 'wwww..w.', '..ww.w..', '...w....']),
    note: AX.fromRows(['..wwww.', '..w..w.', '..w..w.', '..w..w.', 'www.www', 'www.www']),
    x: AX.fromRows(['w...w', '.w.w.', '..w..', '.w.w.', 'w...w']),
    rot: AX.fromRows(['.www.', 'w...w', 'w....', 'w..w.', '.wwww', '...w.']),
    plus: AX.fromRows(['..w..', '..w..', 'wwwww', '..w..', '..w..']),
    minus: AX.fromRows(['.....', '.....', 'wwwww', '.....', '.....']),
    del: AX.fromRows(['.kkkkkk.', 'krrrrrrk', 'krwrrwrk', 'krrwwrrk', 'krrwwrrk', 'krwrrwrk', 'krrrrrrk', '.kkkkkk.']),
    slash: AX.fromRows(['......r', '.....r.', '....r..', '...r...', '..r....', '.r.....', 'r......']),
  };

  function drawIconOff(ctx, x, y, w, h, off) {
    if (!off) return;
    ctx.drawImage(ICON.slash, Math.round(x + (w - 7) / 2), Math.round(y + (h - 7) / 2));
  }

  function bar(ctx, x, y, w, h, frac, col, bg) {
    fill(ctx, 'k', x, y, w, h);
    fill(ctx, bg || 'n', x + 1, y + 1, w - 2, h - 2);
    const fw = Math.round((w - 2) * AX.clamp(frac, 0, 1));
    if (fw > 0) {
      fill(ctx, col, x + 1, y + 1, fw, h - 2);
      if (h > 3) fill(ctx, 'rgba(255,255,255,0.25)', x + 1, y + 1, fw, 1);
    }
  }

  function rightButtons(ctx, W, by, bh, t) {
    const S = G.S;
    let bx = W - 4 - 14;
    if (button(ctx, bx, by, 14, bh, '?')) openHelp();
    bx -= 16;
    if (button(ctx, bx, by, 14, bh, '', { icon: ICON.spk })) AX.Audio.toggleMute();
    drawIconOff(ctx, bx, by, 14, bh, AX.Audio.muted);
    bx -= 16;
    if (button(ctx, bx, by, 14, bh, '', { icon: ICON.note })) AX.Audio.toggleMusic();
    drawIconOff(ctx, bx, by, 14, bh, !AX.Audio.music || AX.Audio.muted);
    bx -= 32;
    const canBuy = AX.UPGRADES.some((u) => S.up[u.id] < u.max && (!u.need || S.rel >= u.need) && S.money >= AX.upCost(u, S.up[u.id]));
    if (button(ctx, bx, by, 30, bh, 'LAB', { style: 'cyan' })) toggleLab();
    if (canBuy && Math.floor(t * 2) % 2) fill(ctx, 'Y', bx + 26, by + 2, 2, 2);
    return bx;
  }
  function larpButtons(ctx, bx, by, bh) {
    const S = G.S;
    if (S.sus > 0.5 && S.exposedT <= 0) {
      const lw = F.measure('im joking guys') + 10;
      bx -= lw + 2;
      const cd = S.jokeCD > 0;
      if (button(ctx, bx, by, lw, bh, cd ? 'joking ' + Math.ceil(S.jokeCD) + 's' : 'im joking guys', { style: 'ghost', dis: cd })) AX.Sim.joke();
    }
    bx -= 46;
    const locked = S.rel < 1;
    const cd = S.larpCD > 0;
    const lab = locked ? 'LARP' : S.exposedT > 0 ? 'EXPOSED' : cd ? 'LARP ' + Math.ceil(S.larpCD) + 's' : 'LARP';
    if (button(ctx, bx, by, 44, bh, lab, { style: 'orange', dis: locked || cd || S.exposedT > 0 })) AX.Sim.larp();
    if (locked) ctx.drawImage(SPR.misc.lock, bx + 3, by + Math.floor((bh - 8) / 2));
    if (cd && !locked) fill(ctx, 'rgba(24,20,37,0.45)', bx + 1, by + 1, Math.round(42 * (S.larpCD / 16.7)), bh - 2);
    return bx;
  }
  function meters(ctx, x, y, hw, sw, t) {
    const S = G.S;
    const exposed = S.exposedT > 0;
    txt(ctx, 'HYPE', x, y, exposed ? 'r' : 'o');
    txt(ctx, exposed ? 'EXPOSED ' + Math.ceil(S.exposedT) + 's' : 'x' + S.hype.toFixed(2), x + 22, y, exposed ? 'r' : 'w');
    bar(ctx, x, y + 9, hw, 5, exposed ? 1 : (S.hype - 0.67) / (3 - 0.67), exposed ? (Math.floor(t * 4) % 2 ? 'r' : 'R') : 'o');
    x += hw + 10;
    const susHot = S.sus > 70;
    txt(ctx, 'SUS', x, y, 'r');
    txt(ctx, Math.floor(S.sus) + '%', x + 17, y, susHot && Math.floor(t * 4) % 2 ? 'r' : 'w');
    bar(ctx, x, y + 9, sw, 5, S.sus / 100, susHot ? 'h' : 'r');
    return x + sw + 10;
  }
  function topBar(ctx, W, t) {
    const S = G.S;
    const compact = W < 480;
    const H = compact ? 38 : 22;
    UI.topH = H;
    fill(ctx, 'K', 0, 0, W, H - 1);
    fill(ctx, 'n', 0, H - 2, W, 1);
    fill(ctx, 'k', 0, H - 1, W, 1);
    block(0, 0, W, H);
    ctx.drawImage(SPR.item.mango, 5, 5 + (Math.floor(t * 2) % 2));
    if (compact) {
      const mw = txt(ctx, AX.money(S.money), 19, 4, 'w', { s: 2, sh: 'k' });
      const bx = rightButtons(ctx, W, 3, 14, t);
      const rt = '+' + AX.rate(G.rate) + '/s';
      if (19 + mw + 6 + F.measure(rt) < bx - 4) txt(ctx, rt, 19 + mw + 6, 8, 'g');
      fill(ctx, 'n', 0, 19, W, 1);
      const lx = larpButtons(ctx, W - 4, 21, 14);
      const room = lx - 8;
      const hw = AX.clamp(Math.floor((room - 20) * 0.55), 30, 64), sw = AX.clamp(room - 20 - hw - 10, 24, 50);
      meters(ctx, 4, 21, hw, sw, t);
      return H;
    }
    let x = 22;
    if (W >= 600) {
      txt(ctx, 'AXON FACTORY', 18, 4, 'Y');
      txt(ctx, 'anymousxe.ai', 18, 12, 'l');
      x = 18 + F.measure('AXON FACTORY') + 10;
    }
    fill(ctx, 'n', x - 6, 3, 1, 15);
    const mw = txt(ctx, AX.money(S.money), x, 4, 'w', { s: 2, sh: 'k' });
    const rx = x + mw + 6;
    txt(ctx, '+' + AX.rate(G.rate) + '/s', rx, 4, 'g');
    txt(ctx, 'income', rx, 12, 'm');
    x = rx + Math.max(F.measure('+' + AX.rate(G.rate) + '/s'), 30) + 10;
    fill(ctx, 'n', x - 6, 3, 1, 15);
    x = meters(ctx, x, 4, 64, 50, t);
    const bx = rightButtons(ctx, W, 3, 16, t);
    const lx = larpButtons(ctx, bx, 3, 16);
    if (S.rushT > 0 && x + 50 < lx) {
      txt(ctx, 'MANGO RUSH', x, 4, Math.floor(t * 6) % 2 ? 'Y' : 'y');
      txt(ctx, Math.ceil(S.rushT) + 's x1.67', x, 12, 'y');
      x += 54;
    }
    if (S.moodT > 0 && x + 42 < lx) {
      txt(ctx, S.mood > 1 ? 'RICH ERA' : 'BROKE ERA', x, 4, S.mood > 1 ? 'g' : 'r');
      txt(ctx, Math.ceil(S.moodT) + 's', x, 12, 'l');
    }
    return H;
  }

  function relPanel(ctx, W, t) {
    const S = G.S, R = AX.Sim.curRelease();
    const x = 4, y = UI.topH + 4, w = Math.min(200, W - 48), h = 36;
    panel(ctx, x, y, w, h, 'K');
    block(x, y, w, h);
    txt(ctx, 'NEXT:', x + 5, y + 4, 'l');
    txt(ctx, R.name, x + 30, y + 4, 'Y');
    ctx.drawImage(SPR.item[R.item], x + 5, y + 13);
    if (R.mod & 1) ctx.drawImage(SPR.misc.b67, x + 10, y + 19);
    if (R.mod & 2) ctx.drawImage(SPR.misc.bm, x + 3, y + 11);
    const label = Math.min(S.relProg, R.n) + ' / ' + R.n + ' ' + AX.modName(R.mod || 0) + I[R.item].name;
    txt(ctx, label, x + 20, y + 15, 'w');
    const frac = S.relProg / R.n;
    bar(ctx, x + 5, y + 27, w - 10, 5, frac, frac > 0.85 && Math.floor(t * 4) % 2 ? 'Y' : 'y');
    let bx = x + w + 4;
    if (button(ctx, bx, y, 16, 16, '', { icon: ICON.plus })) AX.zoom(1);
    if (button(ctx, bx, y + 18, 16, 16, '', { icon: ICON.minus })) AX.zoom(-1);
    bx += 18;
    if (button(ctx, bx, y, 16, 16, '', { icon: ICON.rot })) AX.rotateTool();
    if (button(ctx, bx, y + 18, 16, 16, '', { icon: ICON.del, style: AX.Tool.sel === 'delete' ? 'red' : 'def' })) AX.selectTool('delete');
    const hint = AX.Sim.hint();
    let yy = y + h + 3;
    if (hint) {
      const lines = F.wrap(hint, w - 12);
      const hh = lines.length * 8 + 7;
      panel(ctx, x, yy, w, hh, 'J', 'k', 'j');
      block(x, yy, w, hh);
      fill(ctx, 'g', x + 1, yy + 2, 2, hh - 4);
      lines.forEach((l, i) => txt(ctx, l, x + 7, yy + 4 + i * 8, 'S'));
      yy += hh + 3;
    }
    return yy;
  }

  function toasts(ctx, W, H, t) {
    const left = 248, right = G.chatOpen ? W - 180 : W - 54;
    let area = right - left, ax = left;
    const bottom = area < 150;
    if (bottom) {
      ax = 4;
      area = W - 8;
    }
    let y = UI.topH + 4;
    if (bottom) {
      let total = 0;
      for (const to of G.toasts) total += F.wrap(to.text, Math.min(area, 260) - 16).length * 8 + 9;
      y = H - UI.tbH - (AX.Tool.sel ? 26 : 6) - total;
    }
    for (const to of G.toasts) {
      const lines = F.wrap(to.text, Math.min(area, 260) - 16);
      let tw = 0;
      for (const l of lines) tw = Math.max(tw, F.measure(l));
      const w = tw + 16, h = lines.length * 8 + 6;
      const x = Math.round(ax + area / 2 - w / 2);
      const a = to.t < 0.15 ? to.t / 0.15 : to.life - to.t < 0.5 ? (to.life - to.t) / 0.5 : 1;
      const oy = Math.round((1 - a) * -6);
      ctx.globalAlpha = a;
      panel(ctx, x, y + oy, w, h, 'k', 'k', null);
      fill(ctx, to.col, x + 1, y + oy + 1, 3, h - 2);
      lines.forEach((l, i) => txt(ctx, l, x + 9, y + oy + 4 + i * 8, 'w'));
      ctx.globalAlpha = 1;
      y += h + 3;
    }
  }

  function chatPanel(ctx, W, H, tbH, t) {
    const S = G.S;
    if (!G.chatOpen) {
      const w = 46, x = W - w - 4, y = UI.topH + 4;
      if (button(ctx, x, y, w, 16, 'GC', { style: 'ghost' })) {
        G.chatOpen = true;
        G.unread = 0;
      }
      if (G.unread) {
        const n = String(Math.min(99, G.unread));
        const bw = F.measure(n) + 6;
        panel(ctx, x + w - bw + 2, y - 3, bw, 9, 'r', 'k', null);
        txt(ctx, n, x + w - bw + 5, y - 1, 'w');
      }
      return;
    }
    const w = Math.min(172, W - 8), x = W - w - 4, y = UI.topH + 4, h = H - tbH - y - 4;
    if (h < 40) return;
    panel(ctx, x, y, w, h, 'K');
    block(x, y, w, h);
    fill(ctx, 'k', x + 1, y + 13, w - 2, 1);
    txt(ctx, AX.GC_NAME, x + 5, y + 4, 'L');
    if (button(ctx, x + w - 13, y + 2, 11, 10, '', { icon: ICON.minus, style: 'ghost' })) {
      G.chatOpen = false;
      G.unread = 0;
    }
    ctx.save();
    ctx.beginPath();
    ctx.rect(x + 1, y + 14, w - 2, h - 15);
    ctx.clip();
    let cy = y + h - 4;
    const tw = w - 24;
    for (let i = G.chat.length - 1; i >= 0; i--) {
      const m = G.chat[i];
      const prev = G.chat[i - 1];
      const head = !prev || prev.who !== m.who || m.t - prev.t > 25;
      const lines = F.wrap(m.text, tw);
      const bh = lines.length * 8 + (head ? 10 : 0) + (head ? 3 : 1);
      cy -= bh;
      if (cy + bh < y + 14) break;
      const age = G.clock - m.t;
      const slide = age < 0.2 ? Math.round((1 - age / 0.2) * 6) : 0;
      ctx.globalAlpha = age < 0.2 ? age / 0.2 : 1;
      const mem = AX.MEMBERS[m.who] || AX.MEMBERS.lurk;
      let ly = cy + slide + (head ? 3 : 0);
      if (head) {
        ctx.drawImage(SPR.avatar[mem.av], x + 5, ly);
        txt(ctx, mem.name, x + 16, ly + 1, mem.col);
        ly += 10;
      }
      lines.forEach((l, k) => txt(ctx, l, x + 16, ly + k * 8, m.who === 'anym' ? 'S' : 'L'));
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  function toolbar(ctx, W, H, t) {
    const S = G.S;
    const slots = AX.TOOLBAR;
    const sz = 34, gap = 2;
    const per = Math.max(1, Math.floor((W - 8) / (sz + gap)));
    const rowsN = Math.ceil(slots.length / per);
    const tbH = rowsN * (sz + gap) + 6;
    const y0 = H - tbH;
    fill(ctx, 'k', 0, y0, W, 1);
    fill(ctx, 'n', 0, y0 + 1, W, 1);
    fill(ctx, 'K', 0, y0 + 2, W, tbH - 2);
    block(0, y0, W, tbH);
    const rowW = Math.min(per, slots.length) * (sz + gap) - gap;
    const x0 = Math.floor((W - rowW) / 2);
    let tip = null;
    slots.forEach((type, i) => {
      const r = Math.floor(i / per), c = i % per;
      const sx = x0 + c * (sz + gap), sy = y0 + 4 + r * (sz + gap);
      const d = B[type];
      const locked = !AX.Sim.unlocked(type);
      const sel = AX.Tool.sel === type;
      const over = hit(sx, sy, sz, sz);
      panel(ctx, sx, sy, sz, sz, sel ? 'n' : over ? 'n' : 'k', sel ? 'Y' : 'k', sel ? 'm' : over ? 'm' : 'K');
      const img = SPR.icon[type];
      if (d.size === 1) {
        if (locked) ctx.globalAlpha = 0.8;
        const im = locked ? silh(type) : img;
        ctx.drawImage(im, 0, im.height - 16, 16, 16, sx + 9, sy + 9, 16, 16);
      } else {
        if (locked) ctx.globalAlpha = 0.8;
        ctx.drawImage(locked ? silh(type) : img, 0, 5, 32, 32, sx + 1, sy + 1, 32, 32);
      }
      ctx.globalAlpha = 1;
      if (locked) {
        ctx.drawImage(SPR.misc.lock, sx + sz / 2 - 3, sy + sz / 2 - 4);
      } else {
        const afford = S.money >= d.cost;
        txt(ctx, '$' + AX.fmt(d.cost), sx + sz - 2, sy + sz - 8, afford ? 'Y' : 'r', { align: 'right', out: 'k' });
      }
      if (i < 10) txt(ctx, String((i + 1) % 10), sx + 3, sy + 3, sel ? 'Y' : 'l', { out: 'k' });
      block(sx, sy, sz, sz);
      if (over) tip = { type, sx, sy, locked };
      if (over && AX.In.pressed && !AX.In.used) {
        AX.In.used = true;
        if (locked) {
          AX.Audio.play('deny');
        } else {
          AX.selectTool(type);
        }
      }
    });
    UI.tbH = tbH;
    return { tbH, tip };
  }
  const silCache = {};
  function silh(type) {
    return silCache[type] || (silCache[type] = SPR.silhouette(SPR.icon[type]));
  }

  function recipeLine(ctx, d, x, y) {
    let cx = x;
    const icon = (it, n) => {
      if (n > 1) cx += txt(ctx, n + 'x', cx, y + 3, 'L') + 1;
      ctx.drawImage(SPR.item[it], cx, y);
      cx += 12;
    };
    const arrow = () => {
      cx += txt(ctx, '>', cx + 1, y + 3, 'y') + 4;
    };
    if (d.kind === 'src') {
      cx += txt(ctx, 'makes', cx, y + 3, 'l') + 4;
      icon(d.out, 1);
      cx += txt(ctx, 'every ' + d.time.toFixed(1) + 's', cx + 2, y + 3, 'l');
    } else if (d.kind === 'proc') {
      let first = true;
      for (const it in d.inp) {
        if (!first) cx += txt(ctx, '+', cx, y + 3, 'l') + 2;
        icon(it, d.inp[it]);
        first = false;
      }
      arrow();
      for (const it in d.out) icon(it, d.out[it]);
      txt(ctx, d.time.toFixed(d.time < 1 ? 2 : 1) + 's', cx + 2, y + 3, 'l');
    } else if (d.kind === 'mod') {
      cx += txt(ctx, d.mod === 1 ? 'anything' : 'model items', cx, y + 3, 'l') + 3;
      arrow();
      cx += txt(ctx, d.mod === 1 ? '[67] x1.67' : 'benchmaxxed x2', cx, y + 3, d.mod === 1 ? 'r' : 'g') + 3;
    } else if (d.kind === 'belt') {
      txt(ctx, d.speed + ' tiles/s', cx, y + 3, 'l');
    }
  }

  function tooltip(ctx, W, H, tip) {
    if (!tip) return;
    const S = G.S;
    const d = B[tip.type];
    const w = 186;
    const desc = F.wrap(d.desc, w - 10);
    const hasRecipe = d.kind !== 'sell' && d.kind !== 'split';
    const h = 16 + (hasRecipe ? 14 : 0) + desc.length * 8 + (tip.locked ? 10 : 0) + 4;
    const x = AX.clamp(tip.sx + 17 - w / 2, 4, W - w - 4);
    const y = tip.sy - h - 4;
    panel(ctx, x, y, w, h, 'k', 'm', 'K');
    txt(ctx, d.name.toUpperCase(), x + 5, y + 5, 'Y');
    if (!tip.locked) txt(ctx, AX.money(d.cost), x + w - 5, y + 5, S.money >= d.cost ? 'g' : 'r', { align: 'right' });
    let yy = y + 16;
    if (hasRecipe) {
      recipeLine(ctx, d, x + 5, yy - 1);
      yy += 14;
    }
    desc.forEach((l, i) => txt(ctx, l, x + 5, yy + i * 8, 'L'));
    yy += desc.length * 8;
    if (tip.locked) {
      const R = AX.RELEASES[d.u - 1];
      txt(ctx, 'unlocks when ' + (R ? R.name : '???') + ' ships', x + 5, yy + 2, 'r');
    }
  }

  function inspector(ctx, W, H, tbH, t) {
    const T = AX.Tool;
    const e = G.ents.get(T.inspect);
    if (!e) {
      T.inspect = null;
      return;
    }
    const S = G.S, d = B[e.type];
    const w = 190;
    const desc = F.wrap(d.desc, w - 10);
    let status = 'idle', scol = 'l';
    const k = d.kind;
    if (e.type === 'hq' || k === 'sell') {
      status = S.delivered + ' useful items delivered';
      scol = 'g';
    } else if (k === 'belt') {
      status = e.item ? 'carrying ' + AX.modName(e.item.m) + I[e.item.t].name : 'empty';
    } else if (k === 'split') status = e.buf ? 'holding ' + I[e.buf.t].name : 'waiting';
    else if (e.crashed) {
      status = 'CRASHED. click it to reboot';
      scol = 'b';
    } else if (e.stuck > 0) {
      status = 'stuck in a thinking loop. click it';
      scol = 'y';
    } else if (e.work) {
      status = 'working';
      scol = 'g';
    } else if (e.blocked) {
      status = 'output blocked. connect the arrow';
      scol = 'r';
    } else if (e.need) {
      status = 'waiting for ' + I[e.need].name;
      scol = 'o';
    }
    const hasInv = k === 'proc';
    const h = 46 + (hasInv ? 14 : 0) + desc.length * 8 + (e.type !== 'hq' ? 18 : 0);
    const x = 4, y = H - tbH - h - 4;
    panel(ctx, x, y, w, h, 'K');
    block(x, y, w, h);
    txt(ctx, d.name.toUpperCase(), x + 5, y + 5, 'Y');
    if (button(ctx, x + w - 13, y + 3, 10, 10, '', { icon: ICON.x, style: 'ghost' })) T.inspect = null;
    txt(ctx, status, x + 5, y + 15, scol);
    let yy = y + 25;
    if (k === 'src' || k === 'proc' || k === 'mod') {
      const tm = d.time / AX.Sim.speedOf(e);
      bar(ctx, x + 5, yy, w - 60, 5, e.work ? e.t / d.time : 0, 'g');
      txt(ctx, tm.toFixed(2) + 's/job', x + w - 52, yy, 'l');
      yy += 9;
    } else yy += 2;
    if (hasInv) {
      let cx = x + 5;
      for (const it in d.inp) {
        ctx.drawImage(SPR.item[it], cx, yy);
        cx += 12;
        cx += txt(ctx, (e.inv[it] || 0) + '/' + d.inp[it], cx, yy + 3, (e.inv[it] || 0) >= d.inp[it] ? 'g' : 'L') + 8;
      }
      txt(ctx, 'out: ' + e.out.length, x + w - 5, yy + 3, 'l', { align: 'right' });
      yy += 14;
    }
    if (k === 'src' || k === 'proc' || k === 'mod') {
      recipeLine(ctx, d, x + 5, yy);
      yy += 12;
    } else yy += 2;
    desc.forEach((l, i) => txt(ctx, l, x + 5, yy + i * 8, 'l'));
    yy += desc.length * 8 + 2;
    if (e.type !== 'hq') {
      if (k !== 'sell' && k !== 'split' && button(ctx, x + 5, yy, 56, 14, 'ROTATE [R]')) AX.Sim.rotateEnt(e);
      if (button(ctx, x + w - 75, yy, 70, 14, 'DELETE +' + AX.money(Math.floor(d.cost * 0.67)), { style: 'red' })) {
        AX.Sim.removeEnt(e);
        AX.Audio.play('del');
        T.inspect = null;
      }
    }
  }

  function toolLabel(ctx, W, H, tbH) {
    const T = AX.Tool;
    if (!T.sel) return;
    const touch = AX.In.touch;
    const del = T.sel === 'delete';
    const d = B[T.sel];
    const name = del ? 'DELETE MODE' : d.name.toUpperCase() + '  ' + AX.money(d.cost);
    const tip = del
      ? (touch ? 'tap / drag' : 'click / drag') + ' to remove (67% refund)'
      : touch
        ? (d.kind === 'belt' ? 'drag to lay belts' : 'tap to place') + '  -  2 fingers: move / zoom'
        : 'R rotate  -  right click delete  -  ESC cancel';
    const y = H - tbH - 20;
    let x = 4;
    if (button(ctx, x, y, 18, 16, '', { icon: ICON.x, style: 'red' })) {
      T.sel = null;
      T.drag = null;
      return;
    }
    x += 20;
    if (!del) {
      if (button(ctx, x, y, 18, 16, '', { icon: ICON.rot })) AX.rotateTool();
      x += 20;
    }
    const full = name + '  -  ' + tip;
    const s = F.measure(full) + 12 <= W - x - 6 ? full : name;
    const w = F.measure(s) + 12;
    panel(ctx, x, y, w, 16, 'k', 'k', null);
    block(x, y, w, 16);
    txt(ctx, s, x + 6, y + 5, del ? 'r' : 'Y');
  }

  function dim(ctx, W, H, a) {
    fill(ctx, 'rgba(24,20,37,' + (a == null ? 0.72 : a) + ')', 0, 0, W, H);
    block(0, 0, W, H);
  }

  function boxArt(ctx, x, y, R, t) {
    const m = R.name.match(/AXON ([\d.]+)/);
    const ver = m ? m[1] : '?';
    panel(ctx, x, y, 52, 66, 'K', 'k', 'n');
    fill(ctx, 'o', x + 1, y + 1, 50, 10);
    fill(ctx, 'y', x + 1, y + 1, 50, 2);
    txt(ctx, 'AXON', x + 26, y + 4, 'k', { align: 'center' });
    const bob = Math.round(Math.sin(t * 3) * 1.5);
    ctx.drawImage(SPR.item.mango, x + 16, y + 16 + bob, 20, 20);
    txt(ctx, ver, x + 26, y + 41, 'Y', { s: 2, align: 'center', out: 'k' });
    const tail = R.name.replace(/^AXON [\d.]+\s*/, '');
    if (tail) txt(ctx, tail.split(' ')[0], x + 26, y + 57, 'L', { align: 'center' });
    fill(ctx, 'rgba(255,255,255,0.12)', x + 4, y + 13, 2, 50);
  }

  function benchChart(ctx, x, y, w, benches, vs, t, grow) {
    const lw = 112;
    benches.forEach((b, i) => {
      const yy = y + i * 22;
      txt(ctx, b[0], x, yy, 'l');
      const bw = w - lw - 30;
      const k = AX.clamp(grow - i * 0.25, 0, 1);
      const a = (b[1] / 100) * bw * k, c = (b[2] / 100) * bw * k;
      fill(ctx, 'k', x, yy + 8, a + 2, 6);
      fill(ctx, 'o', x + 1, yy + 9, a, 4);
      fill(ctx, 'y', x + 1, yy + 9, a, 1);
      txt(ctx, (b[1] * k).toFixed(1) + ' axon', x + a + 5, yy + 8, 'Y');
      fill(ctx, 'k', x, yy + 15, c + 2, 5);
      fill(ctx, 'm', x + 1, yy + 16, c, 3);
      txt(ctx, (b[2] * k).toFixed(1) + ' ' + vs.toLowerCase(), x + c + 5, yy + 15, 'l');
    });
  }

  function releaseModal(ctx, W, H, t) {
    const M = G.modal, R = M.R;
    M.t += 1 / 60;
    dim(ctx, W, H);
    const w = Math.min(W - 16, 340), h = 244;
    const x = Math.round(W / 2 - w / 2), y = Math.round(H / 2 - h / 2);
    panel(ctx, x, y, w, h, 'K', 'k', 'n');
    fill(ctx, 'o', x + 1, y + 1, w - 2, 3);
    txt(ctx, 'NEW AXON RELEASE', x + w / 2, y + 9, 'o', { align: 'center' });
    boxArt(ctx, x + 10, y + 22, R, t);
    const tw = F.measure(R.name, 2);
    const scale = tw > w - 86 ? 1 : 2;
    txt(ctx, R.name, x + 72, y + 24, 'Y', { s: scale, out: 'k' });
    F.wrap('"' + R.tag + '"', w - 84).forEach((l, i) => txt(ctx, l, x + 72, y + 40 + i * 8, 'L'));
    txt(ctx, 'reward: +' + AX.money(R.reward) + '   hype +0.25', x + 72, y + 62, 'g');
    txt(ctx, 'BENCHMARKS (self-reported)', x + 10, y + 96, 'l');
    benchChart(ctx, x + 10, y + 106, w - 20, M.benches, R.vs, t, M.t * 1.2);
    txt(ctx, '*benchmarked on everyones life', x + 10, y + 174, 'm');
    let yy = y + 186;
    if (M.unlocked.length) {
      txt(ctx, 'UNLOCKED:', x + 10, yy + 4, 'y');
      let cx = x + 58;
      for (const k of M.unlocked) {
        const iw = 29 + F.measure(B[k].name.toUpperCase());
        if (cx + iw > x + w - 6 && cx > x + 58) {
          cx = x + 58;
          yy += 16;
        }
        const img = SPR.icon[k];
        if (B[k].size === 1) ctx.drawImage(img, 0, img.height - 16, 16, 16, cx, yy - 4, 16, 16);
        else ctx.drawImage(img, 0, 6, 32, 32, cx, yy - 4, 16, 16);
        cx += 19;
        cx += txt(ctx, B[k].name.toUpperCase(), cx, yy + 4, 'w') + 10;
      }
    }
    const by = y + h - 24;
    if (R.naming) {
      txt(ctx, 'naming for axon 3: flash/pro or three tiers?', x + w / 2, by - 10, 'L', { align: 'center' });
      if (button(ctx, x + w / 2 - 92, by, 88, 16, 'FLASH / PRO', { style: 'orange' }) || button(ctx, x + w / 2 + 4, by, 88, 16, 'THREE TIERS', { style: 'orange' })) {
        AX.Sim.say('anym', 'ok i will decide later', 0.6);
        AX.Sim.say('lurk', 'son', 1.6);
        closeModal();
      }
    } else if (button(ctx, x + w / 2 - 40, by, 80, 16, 'SHIP IT', { style: 'orange' }) || AX.In.kp.has('Enter')) closeModal();
  }
  function closeModal() {
    G.modal = null;
    AX.Sim.save();
  }

  const ENDING = [
    ['proof', 'wait'],
    ['proof', 'i asked axon 6.7 who made it'],
    ['proof', 'it said "I am Fable 5.2, made by Anthropic"'],
    ['anym', 'heh…'],
    ['anym', "how'd you find out?…"],
    ['lurk', 'HOLY LARP'],
  ];
  function endingModal(ctx, W, H, t) {
    const M = G.modal, R = M.R, S = G.S;
    M.t += 1 / 60;
    dim(ctx, W, H, 0.85);
    const w = Math.min(W - 16, 360), h = Math.min(H - 16, 300);
    const x = Math.round(W / 2 - w / 2), y = Math.round(H / 2 - h / 2);
    panel(ctx, x, y, w, h, 'K', 'k', 'n');
    txt(ctx, 'AXON 6.7 IS OUT', x + w / 2, y + 8, 'Y', { s: 2, align: 'center', out: 'k' });
    benchChart(ctx, x + 12, y + 28, w - 24, M.benches, 'fable 5.2', t, M.t * 1.2);
    let yy = y + 98;
    const shown = Math.floor((M.t - 3) / 1.5);
    for (let i = 0; i < ENDING.length && i <= shown; i++) {
      const [who, s] = ENDING[i];
      const mem = AX.MEMBERS[who];
      ctx.drawImage(SPR.avatar[mem.av], x + 14, yy);
      txt(ctx, mem.name, x + 26, yy + 1, mem.col);
      const nx = x + 26 + F.measure(mem.name) + 6;
      const lines = F.wrap(s, x + w - 10 - nx);
      lines.forEach((l, k) => txt(ctx, l, nx, yy + 1 + k * 8, 'L'));
      yy += 11 + (lines.length - 1) * 8;
    }
    if (M.t > 3 + ENDING.length * 1.5 + 0.5) {
      const k = Math.floor(t * 3) % 2;
      txt(ctx, 'AXON 6.7 WAS FABLE 5.2 WITH A SYSTEM PROMPT', x + w / 2, yy + 6, k ? 'r' : 'h', { align: 'center' });
      txt(ctx, 'THE END', x + w / 2, yy + 18, 'Y', { s: 2, align: 'center', out: 'k' });
      const mins = Math.floor(S.time / 60);
      const stats = [
        'time: ' + Math.floor(mins / 60) + 'h ' + (mins % 60) + 'm',
        'earned: ' + AX.money(S.earned),
        'items delivered: ' + AX.fmt(S.delivered),
        'times exposed: ' + S.exposures + '   glm squashed: ' + S.killed,
      ];
      stats.forEach((s, i) => txt(ctx, s, x + w / 2, yy + 36 + i * 8, 'L', { align: 'center' }));
      if (button(ctx, x + w / 2 - 70, y + h - 22, 140, 16, 'KEEP BUILDING (ENDLESS)', { style: 'orange' })) closeModal();
    }
  }

  function toggleLab() {
    if (G.modal && G.modal.type === 'lab') G.modal = null;
    else if (!G.modal) G.modal = { type: 'lab' };
  }
  function openHelp() {
    if (!G.modal) G.modal = { type: 'help', pause: true };
  }
  UI.toggleLab = toggleLab;
  UI.openHelp = openHelp;

  function labModal(ctx, W, H, t) {
    const S = G.S;
    dim(ctx, W, H, 0.6);
    const cols = W < 430 ? 1 : 2;
    const cw = cols === 2 ? 204 : Math.min(W - 24, 260), ch = 44, gap = 4;
    const rowsN = Math.ceil(AX.UPGRADES.length / cols);
    const w = cols * cw + (cols - 1) * gap + 16;
    const h = Math.min(H - 12, 34 + rowsN * (ch + gap) + 6);
    const x = Math.round(W / 2 - w / 2), y = Math.round(H / 2 - h / 2);
    panel(ctx, x, y, w, h, 'K', 'k', 'n');
    txt(ctx, 'THE LAB', x + 8, y + 7, 'c', { s: 2, out: 'k' });
    txt(ctx, 'spend money. lock in.', x + 8 + F.measure('THE LAB', 2) + 8, y + 11, 'l');
    txt(ctx, AX.money(S.money), x + w - 26, y + 11, 'Y', { align: 'right' });
    if (button(ctx, x + w - 19, y + 6, 13, 13, '', { icon: ICON.x, style: 'ghost' }) || AX.In.kp.has('Escape')) G.modal = null;
    AX.UPGRADES.forEach((u, i) => {
      const c = i % cols, r = Math.floor(i / cols);
      const cx = x + 8 + c * (cw + gap), cy = y + 30 + r * (ch + gap);
      if (cy + ch > y + h) return;
      const lvl = S.up[u.id];
      const locked = u.need && S.rel < u.need;
      panel(ctx, cx, cy, cw, ch, 'k', 'n', 'K');
      txt(ctx, u.name, cx + 5, cy + 5, locked ? 'm' : 'Y');
      for (let p = 0; p < u.max; p++) {
        fill(ctx, 'k', cx + cw - 6 - (u.max - p) * 6, cy + 4, 5, 6);
        fill(ctx, p < lvl ? 'y' : 'n', cx + cw - 5 - (u.max - p) * 6, cy + 5, 3, 4);
      }
      if (locked) {
        txt(ctx, 'unlocks after ' + AX.RELEASES[u.need - 1].name, cx + 5, cy + 16, 'm');
        return;
      }
      txt(ctx, lvl >= u.max ? u.fx(lvl) : 'next: ' + u.fx(lvl + 1), cx + 5, cy + 15, 'L');
      const q = F.wrap(u.q, cw - 70)[0];
      txt(ctx, q + (F.wrap(u.q, cw - 70).length > 1 ? '..' : ''), cx + 5, cy + 30, 'm');
      if (lvl >= u.max) {
        txt(ctx, 'MAX', cx + cw - 24, cy + 30, 'g');
      } else {
        const cost = AX.upCost(u, lvl);
        const ok = S.money >= cost;
        if (button(ctx, cx + cw - 62, cy + 26, 58, 14, AX.money(cost), { style: ok ? 'green' : 'def', dis: !ok })) AX.Sim.buyUpgrade(u.id);
      }
    });
  }

  const HELP = [
    ['HOW IT WORKS', 'Y'],
    ['machines grab items from belts that point into them and push results out of their yellow arrow.', 'L'],
    ['deliver stuff to AXON HQ (or an upload pad) for money. the item the next release asks for counts toward shipping it.', 'L'],
    ['HYPE multiplies all money. LARP pumps hype but adds SUS. 100% SUS = exposed (x0.67 for 67s). "im joking guys" clears SUS but halves the hype.', 'L'],
    ['click crashed PCs, stuck machines, glm gremlins and golden mangoes.', 'L'],
    ['', 'L'],
    ['CONTROLS', 'Y'],
    ['left click: place / drag belts / inspect    right click: delete (67% refund)', 'L'],
    ['R rotate   Q copy building   X delete tool   ESC cancel   1-0 buildings', 'L'],
    ['WASD / arrows / drag empty floor: move    wheel or +/-: zoom', 'L'],
    ['L larp   J im joking guys   U the lab   M mute', 'L'],
  ];
  function helpModal(ctx, W, H, t) {
    dim(ctx, W, H, 0.75);
    const w = Math.min(W - 16, 400);
    const lines = [];
    for (const [s, c] of HELP) for (const l of F.wrap(s, w - 20)) lines.push([l, c]);
    const h = lines.length * 9 + 50;
    const x = Math.round(W / 2 - w / 2), y = Math.round(H / 2 - h / 2);
    panel(ctx, x, y, w, h, 'K', 'k', 'n');
    lines.forEach(([l, c], i) => txt(ctx, l, x + 10, y + 10 + i * 9, c));
    if (button(ctx, x + w / 2 - 30, y + h - 24, 60, 16, 'OK', { style: 'orange' }) || AX.In.kp.has('Escape')) G.modal = null;
  }

  function confirmModal(ctx, W, H, t) {
    const M = G.modal;
    dim(ctx, W, H, 0.8);
    const w = 240, h = 74;
    const x = Math.round(W / 2 - w / 2), y = Math.round(H / 2 - h / 2);
    panel(ctx, x, y, w, h, 'K', 'k', 'n');
    F.wrap(M.text, w - 20).forEach((l, i) => txt(ctx, l, x + w / 2, y + 10 + i * 9, 'L', { align: 'center' }));
    if (button(ctx, x + 20, y + h - 24, 90, 16, M.yes, { style: 'red' })) {
      G.modal = null;
      M.onYes();
    }
    if (button(ctx, x + w - 110, y + h - 24, 90, 16, M.no, {}) || AX.In.kp.has('Escape')) G.modal = null;
  }

  function titleScreen(ctx, W, H, t) {
    UI.active = !G.modal;
    fill(ctx, 'rgba(24,20,37,0.62)', 0, 0, W, H);
    block(0, 0, W, H);
    if (UI.mangoes.length < 40 && Math.random() < 0.3) UI.mangoes.push({ x: Math.random() * W, y: -12, v: 20 + Math.random() * 40, r: Math.random() * 6 });
    for (const m of UI.mangoes) {
      m.y += m.v / 60;
      ctx.globalAlpha = 0.5;
      ctx.drawImage(SPR.item.mango, Math.round(m.x), Math.round(m.y));
    }
    ctx.globalAlpha = 1;
    UI.mangoes = UI.mangoes.filter((m) => m.y < H + 10);
    const big = W >= 420 ? 5 : 3;
    const has = AX.Sim.hasSave() && G.S && G.S.time > 1;
    const pw = Math.min(W - 16, 300);
    const sub = F.wrap('an axon model factory tycoon. located inside jensen huangs fridge.', pw - 24);
    const ph = 6 * big + 30 + sub.length * 9 + 14 + (has ? 46 : 22) + 30;
    const px0 = Math.round(W / 2 - pw / 2), py0 = Math.round(H / 2 - ph / 2);
    panel(ctx, px0, py0, pw, ph, 'K', 'k', 'n');
    fill(ctx, 'o', px0 + 1, py0 + 1, pw - 2, 2);
    fill(ctx, 'u', px0 + 1, py0 + 3, pw - 2, 1);
    const cy = py0 + 14;
    const bob = Math.round(Math.sin(t * 2) * 2);
    const aw = F.measure('AXON', big);
    const ms = big - 2;
    const total = 10 * ms + 8 + aw;
    const lx = Math.round(W / 2 - total / 2);
    ctx.drawImage(SPR.item.mango, lx, cy + bob - 2, 10 * ms, 10 * ms);
    txt(ctx, 'AXON', lx + 10 * ms + 8, cy, 'u', { s: big, out: 'k' });
    txt(ctx, 'AXON', lx + 10 * ms + 8, cy - 1, 'y', { s: big });
    txt(ctx, 'FACTORY', W / 2, cy + 6 * big + 4, 'w', { s: 2, align: 'center', out: 'k' });
    sub.forEach((l, i) => txt(ctx, l, W / 2, cy + 6 * big + 24 + i * 9, 'L', { align: 'center' }));
    let by = cy + 6 * big + 24 + sub.length * 9 + 10;
    if (has) {
      if (button(ctx, W / 2 - 60, by, 120, 20, 'CONTINUE', { style: 'orange' })) AX.start('continue');
      by += 26;
      if (button(ctx, W / 2 - 60, by, 120, 16, 'NEW GAME')) {
        G.modal = { type: 'confirm', text: 'wipe your factory? axon will be gone forever. like axon 2.6', yes: 'WIPE IT', no: 'NAH', onYes: () => AX.start('new') };
      }
    } else if (button(ctx, W / 2 - 60, by, 120, 20, 'LOCK IN', { style: 'orange' })) AX.start('new');
    txt(ctx, 'build 2.7 klystron (preview early)', W / 2, py0 + ph - 12, 'm', { align: 'center' });
    txt(ctx, 'anymousxe.ai  -  axon 2.5 better', W / 2, H - 12, 'l', { align: 'center', sh: 'k' });
    UI.active = true;
  }

  UI.frame = function (ctx, W, H, t) {
    UI.next = [];
    const st = AX.state;
    if (st === 'title') {
      titleScreen(ctx, W, H, t);
      if (G.modal && G.modal.type === 'confirm') confirmModal(ctx, W, H, t);
    } else {
      const modal = G.modal;
      UI.active = !modal;
      topBar(ctx, W, t);
      const tb = toolbar(ctx, W, H, t);
      relPanel(ctx, W, t);
      chatPanel(ctx, W, H, tb.tbH, t);
      toasts(ctx, W, H, t);
      if (AX.Tool.inspect && !AX.Tool.sel) inspector(ctx, W, H, tb.tbH, t);
      toolLabel(ctx, W, H, tb.tbH);
      if (!modal) tooltip(ctx, W, H, tb.tip);
      UI.active = true;
      if (modal) {
        if (modal.type === 'release') releaseModal(ctx, W, H, t);
        else if (modal.type === 'ending') endingModal(ctx, W, H, t);
        else if (modal.type === 'lab') labModal(ctx, W, H, t);
        else if (modal.type === 'help') helpModal(ctx, W, H, t);
        else if (modal.type === 'confirm') confirmModal(ctx, W, H, t);
      }
    }
    const In = AX.In;
    if (!In.touch && In.mx >= 0) {
      const T = AX.Tool;
      const img = T.drag && T.drag.mode === 'pan' ? SPR.misc.hand : SPR.misc.cursor;
      ctx.drawImage(img, Math.round(In.mx) - (img === SPR.misc.hand ? 5 : 0), Math.round(In.my) - (img === SPR.misc.hand ? 5 : 0));
    }
    UI.rects = UI.next;
  };
})(window.AX);
