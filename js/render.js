'use strict';
(function (AX) {
  const G = AX.G, SPR = AX.SPR, B = AX.BUILD, I = AX.ITEMS, DX = AX.DX, DY = AX.DY, P = AX.PAL;
  const cam = (AX.cam = { x: 0, y: 0, z: 1 });
  const miniMango = AX.fromRows(['..g.', '.yo.', 'oyoo', '.oo.']);
  const THINK = ['OK.', 'Let me go.', 'Let me start.', 'Let me execute.', 'OK.', 'Let me go.'];

  function fill(ctx, c, x, y, w, h) {
    ctx.fillStyle = P[c] || c;
    ctx.fillRect(x, y, w, h);
  }
  AX.screenToWorld = function (sx, sy, W, H) {
    return [(sx - W / 2) / cam.z + cam.x, (sy - H / 2) / cam.z + cam.y];
  };
  AX.clampCam = function () {
    cam.x = AX.clamp(cam.x, -40, G.MW * 16 + 40);
    cam.y = AX.clamp(cam.y, -40, G.MH * 16 + 40);
  };

  function itemPos(b) {
    const cx = b.x * 16 + 8, cy = b.y * 16 + 8;
    const p = b.prog;
    if (p < 0.5) {
      const k = p * 2;
      return [cx - DX[b.inDir] * 8 * (1 - k), cy - DY[b.inDir] * 8 * (1 - k)];
    }
    const k = (p - 0.5) * 2;
    return [cx + DX[b.rot] * 8 * k, cy + DY[b.rot] * 8 * k];
  }
  function drawItem(ctx, it, x, y) {
    x = Math.round(x);
    y = Math.round(y);
    ctx.drawImage(SPR.item[it.t], x - 5, y - 5);
    if (it.m & 1) ctx.drawImage(SPR.misc.b67, x, y + 1);
    if (it.m & 2) ctx.drawImage(SPR.misc.bm, x - 7, y - 7);
  }
  AX.drawItem = drawItem;

  function bubble(ctx, x, y, w, h) {
    fill(ctx, 'k', x + 1, y, w - 2, h);
    fill(ctx, 'k', x, y + 1, w, h - 2);
    fill(ctx, 'w', x + 1, y + 1, w - 2, h - 2);
    fill(ctx, 'k', x + 4, y + h, 3, 1);
    fill(ctx, 'w', x + 5, y + h - 1, 1, 1);
    fill(ctx, 'k', x + 5, y + h + 1, 1, 1);
  }

  function animated(e, t) {
    const d = B[e.type];
    if (e.type === 'hq' || e.type === 'upload' || e.type === 'split') return Math.floor(t * 6) & 7;
    if (e.type === 'tree') return Math.floor(t * 1.5 + e.id) & 7;
    if (e.crashed || e.stuck > 0) return 0;
    if (d.kind === 'proc' || d.kind === 'mod' || d.kind === 'src') {
      if (e.work) return Math.floor(t * 8 * (e.type === 'press' ? 1.5 : 1) + e.id) & 7;
    }
    return 0;
  }

  function drawWorld(ctx, W, H, t, hover) {
    const S = G.S;
    const z = cam.z;
    let shx = 0, shy = 0;
    if (G.shake > 0) {
      shx = Math.round((Math.random() * 2 - 1) * G.shake * 0.4);
      shy = Math.round((Math.random() * 2 - 1) * G.shake * 0.4);
    }
    const ox = Math.round(W / 2 - cam.x * z) + shx, oy = Math.round(H / 2 - cam.y * z) + shy;
    ctx.setTransform(z, 0, 0, z, ox, oy);
    const x0 = -ox / z, y0 = -oy / z, x1 = (W - ox) / z, y1 = (H - oy) / z;
    G.view = { x0, y0, x1, y1 };
    const tx0 = Math.floor(x0 / 16) - 1, ty0 = Math.floor(y0 / 16) - 1, tx1 = Math.ceil(x1 / 16) + 1, ty1 = Math.ceil(y1 / 16) + 2;

    for (let ty = ty0; ty <= ty1; ty++)
      for (let tx = tx0; tx <= tx1; tx++) {
        if (tx >= 0 && ty >= 0 && tx < G.MW && ty < G.MH) ctx.drawImage(SPR.floor[G.floorV[ty * G.MW + tx]], tx * 16, ty * 16);
        else ctx.drawImage(SPR.wall, tx * 16, ty * 16);
      }
    const mw = G.MW * 16, mh = G.MH * 16;
    fill(ctx, 'k', -4, -4, mw + 8, 4);
    fill(ctx, 'k', -4, mh, mw + 8, 4);
    fill(ctx, 'k', -4, 0, 4, mh);
    fill(ctx, 'k', mw, 0, 4, mh);
    fill(ctx, 'l', -5, -5, mw + 10, 1);
    fill(ctx, 'w', -6, -6, mw + 12, 1);
    fill(ctx, 'm', -4, mh + 4, mw + 8, 2);

    const gm = 1 + 0.25 * S.up.grease;
    const inView = (e) => e.x * 16 < x1 + 16 && (e.x + e.size) * 16 > x0 - 16 && e.y * 16 < y1 + 24 && (e.y + e.size) * 16 > y0 - 16;
    for (const b of G.belts) {
      if (!inView(b)) continue;
      const tier = b.type === 'fbelt' ? 1 : 0;
      const f = Math.floor(t * B[b.type].speed * gm * 16) & 7;
      const img = b.curve >= 0 ? SPR.curve[tier][((b.curve + 2) % 4) * 4 + b.rot][f] : SPR.belt[tier][b.rot][f];
      ctx.drawImage(img, b.x * 16, b.y * 16);
    }
    for (const b of G.belts) {
      if (!b.item || !inView(b)) continue;
      const [x, y] = itemPos(b);
      drawItem(ctx, b.item, x, y);
    }

    const list = [];
    for (const e of G.ents.values()) {
      if (B[e.type].kind === 'belt' || !inView(e)) continue;
      list.push([(e.y + e.size) * 16, 0, e]);
    }
    for (let ty = Math.max(0, ty0); ty <= Math.min(G.MH - 1, ty1); ty++)
      for (let tx = Math.max(0, tx0); tx <= Math.min(G.MW - 1, tx1); tx++) {
        const v = G.obst[ty * G.MW + tx];
        if (v) list.push([(ty + 1) * 16, 1, tx, ty, v]);
      }
    list.sort((a, b) => a[0] - b[0]);
    for (const it of list) {
      if (it[1] === 1) {
        ctx.drawImage(SPR.ice[it[4] - 1], it[2] * 16, it[3] * 16 - 8);
        continue;
      }
      const e = it[2];
      const d = B[e.type];
      const f = animated(e, t);
      ctx.drawImage(SPR.bld[e.type][f], e.x * 16, e.y * 16 - 8);
      if (e.type === 'tree') {
        const time = d.time;
        let n = e.work ? Math.floor((e.t / time) * 5) : 0;
        if (e.blocked) n = 5;
        n = Math.min(SPR.treeMangoes.length, n + (e.out ? e.out.length : 0));
        for (let i = 0; i < n; i++) {
          const [mx, my] = SPR.treeMangoes[i];
          ctx.drawImage(miniMango, e.x * 16 + mx - 2, e.y * 16 + my - 2);
        }
      } else if (e.type === 'juicer') {
        const J = SPR.juiceJar;
        const lvl = e.work ? 0.25 + 0.7 * (e.t / d.time) : (e.inv.mango ? 0.18 : 0.06);
        const hh = Math.max(1, Math.round(J.h * lvl));
        const bx = e.x * 16 + J.x, by = e.y * 16 + J.y + J.h - hh;
        fill(ctx, 'o', bx, by, J.w, hh);
        fill(ctx, 'y', bx, by, J.w, 1);
        fill(ctx, 'u', bx + J.w - 2, by + 1, 2, Math.max(0, hh - 1));
        if (e.work) {
          const k = Math.floor(t * 10 + e.id) % 6;
          fill(ctx, 'Y', bx + 2 + k, by + Math.max(1, hh - 2 - k), 1, 1);
          fill(ctx, 'Y', bx + 7 - (k >> 1), by + Math.max(1, hh - 4), 1, 1);
        }
      } else if (e.type === 'split' && e.buf) {
        drawItem(ctx, e.buf, e.x * 16 + 8, e.y * 16 + 6);
      }
      if (d.kind === 'src' || d.kind === 'proc' || d.kind === 'mod') {
        const s = e.size * 16;
        const ex = e.x * 16, ey = e.y * 16;
        const ch = SPR.chute[e.rot];
        if (e.rot === 0) ctx.drawImage(ch, ex + s - 2, ey + s / 2 - 4);
        else if (e.rot === 1) ctx.drawImage(ch, ex + s / 2 - 4, ey + s - 2);
        else if (e.rot === 2) ctx.drawImage(ch, ex - 3, ey + s / 2 - 4);
        else ctx.drawImage(ch, ex + s / 2 - 4, ey - 3);
      }
    }

    for (const e of G.machines) {
      if (!inView(e)) continue;
      const s = e.size * 16, ex = e.x * 16, ey = e.y * 16;
      const cx = ex + s / 2;
      const bob = Math.round(Math.sin(t * 4 + e.id) * 1);
      if (e.crashed) {
        const img = SPR.misc.bsod;
        const bx = cx - 11, by = ey + s / 2 - 12;
        if (e.rebootT > 0) {
          fill(ctx, 'k', bx, by, 22, 16);
          fill(ctx, 'K', bx + 1, by + 1, 20, 14);
          const p = 1 - e.rebootT / 1.2;
          fill(ctx, 'g', bx + 3, by + 10, Math.round(16 * p), 2);
          AX.text(ctx, 'boot', bx + 3, by + 3, 'L');
        } else {
          ctx.drawImage(img, bx, by);
          if (Math.floor(t * 2) % 2) AX.text(ctx, 'click', cx, by + 17, 'c', { align: 'center', out: 'k' });
        }
        continue;
      }
      if (e.stuck > 0) {
        const msg = THINK[Math.floor(t * 1.2) % THINK.length];
        const w = AX.Font.measure(msg) + 8;
        bubble(ctx, Math.round(cx - w / 2), ey - 22 + bob, w, 12);
        AX.text(ctx, msg, Math.round(cx - w / 2) + 4, ey - 19 + bob, 'k');
        continue;
      }
      const d = B[e.type];
      if (d.kind === 'proc' && !e.work && e.idle > 2 && e.need && !e.blocked) {
        ctx.drawImage(SPR.misc.bubble, Math.round(cx - 6), ey - 20 + bob);
        ctx.globalAlpha = 0.85;
        ctx.drawImage(SPR.item[e.need], Math.round(cx - 5), ey - 19 + bob);
        ctx.globalAlpha = 1;
      } else if (e.blocked && e.idle > 3) {
        ctx.drawImage(SPR.misc.bang, Math.round(cx - 3), ey - 14 + bob);
      }
    }

    if (hover && hover.e && !hover.tool) {
      const e = hover.e;
      corners(ctx, e.x * 16, e.y * 16, e.size * 16, e.size * 16, 'Y');
    }

    for (const g of G.gremlins) {
      const f = Math.floor(g.t * 8) & 3;
      if (g.dead) {
        ctx.globalAlpha = Math.max(0, 1 - g.dead / 0.4);
        ctx.drawImage(SPR.gremlin[0], Math.round(g.x - 7), Math.round(g.y - 2), 14, 6);
        ctx.globalAlpha = 1;
        continue;
      }
      ctx.drawImage(SPR.gremlin[f], Math.round(g.x - 7), Math.round(g.y - 11));
      if (g.life < 6 && Math.floor(t * 6) % 2) continue;
      if (hover && Math.hypot(hover.wx - g.x, hover.wy - g.y) < 14) AX.text(ctx, 'glm 5.3 flash', Math.round(g.x), Math.round(g.y - 20), 'i', { align: 'center', out: 'k' });
    }
    if (G.golden) {
      const g = G.golden;
      const f = Math.floor(t * 6) & 3;
      if (!(g.life - g.t < 3 && Math.floor(t * 8) % 2)) {
        const gx = Math.round(g.x - 9), gy = Math.round(g.y - 9);
        for (let i = 0; i < 4; i++) {
          const a = t * 2 + (i * Math.PI) / 2;
          fill(ctx, i % 2 ? 'Y' : 'w', Math.round(g.x + Math.cos(a) * 13), Math.round(g.y + Math.sin(a) * 13), 1, 1);
        }
        ctx.drawImage(SPR.golden[f], gx, gy);
      }
    }

    for (const p of G.parts) {
      ctx.globalAlpha = Math.min(1, (p.life - p.t) * 3);
      fill(ctx, p.c, Math.round(p.x), Math.round(p.y), 1, 1);
    }
    ctx.globalAlpha = 1;
    for (const f of G.floats) {
      const k = f.t / f.life;
      ctx.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
      AX.text(ctx, f.text, Math.round(f.x), Math.round(f.y - f.t * 16), f.col, { s: f.s, align: 'center', out: 'k' });
    }
    ctx.globalAlpha = 1;
  }

  function corners(ctx, x, y, w, h, c) {
    const L = 4;
    for (const [px, py, sx, sy] of [[x - 1, y - 1, 1, 1], [x + w, y - 1, -1, 1], [x - 1, y + h, 1, -1], [x + w, y + h, -1, -1]]) {
      fill(ctx, 'k', sx > 0 ? px - 1 : px - L + 1, sy > 0 ? py - 1 : py, L + 1, 1);
      fill(ctx, c, sx > 0 ? px : px - L + 1, py, L, 1);
      fill(ctx, c, px, sy > 0 ? py : py - L + 1, 1, L);
    }
  }

  function drawGhost(ctx, type, tx, ty, rot, ok, t) {
    const d = B[type];
    const x = tx * 16, y = ty * 16, s = d.size * 16;
    ctx.globalAlpha = 0.65;
    if (d.kind === 'belt') ctx.drawImage(SPR.belt[type === 'fbelt' ? 1 : 0][rot][Math.floor(t * 32) & 7], x, y);
    else ctx.drawImage(SPR.bld[type][0], x, y - 8);
    ctx.globalAlpha = 1;
    if (d.kind !== 'sell' && d.kind !== 'split') {
      const ch = SPR.chute[rot];
      if (rot === 0) ctx.drawImage(ch, x + s - 2, y + s / 2 - 4);
      else if (rot === 1) ctx.drawImage(ch, x + s / 2 - 4, y + s - 2);
      else if (rot === 2) ctx.drawImage(ch, x - 3, y + s / 2 - 4);
      else ctx.drawImage(ch, x + s / 2 - 4, y - 3);
    }
    corners(ctx, x, y, s, s, ok ? 'g' : 'r');
    if (d.kind === 'src' || d.kind === 'proc' || d.kind === 'mod') {
      const ax = x + s / 2 + DX[rot] * (s / 2 + 10), ay = y + s / 2 + DY[rot] * (s / 2 + 10);
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 6);
      fill(ctx, 'y', Math.round(ax) - 1, Math.round(ay) - 1, 2, 2);
      ctx.globalAlpha = 1;
    }
  }
  function drawDeleteCursor(ctx, tx, ty, t) {
    const e = AX.Sim.entAt(tx, ty);
    if (e) corners(ctx, e.x * 16, e.y * 16, e.size * 16, e.size * 16, 'r');
    else corners(ctx, tx * 16, ty * 16, 16, 16, Math.floor(t * 4) % 2 ? 'r' : 'R');
  }

  AX.Render = { drawWorld, drawGhost, drawDeleteCursor, corners, bubble, fill };
})(window.AX);
