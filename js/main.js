'use strict';
(function (AX) {
  const G = AX.G, B = AX.BUILD, cam = AX.cam;
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  let W = 640, H = 360, scale = 1;

  const In = (AX.In = {
    mx: -99, my: -99, down: false, pressed: false, released: false, rdown: false, rpressed: false, mdown: false,
    wheel: 0, keys: new Set(), kp: new Set(), used: false, touch: false, shift: false,
  });
  const T = (AX.Tool = { sel: null, rot: 0, inspect: null, drag: null });
  AX.state = 'title';

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const pw = Math.round(window.innerWidth * dpr), ph = Math.round(window.innerHeight * dpr);
    const phone = Math.min(window.innerWidth, window.innerHeight) < 500;
    if (phone) {
      const short = Math.min(pw, ph);
      scale = Math.max(1, Math.round(short / (pw < ph ? 280 : 270)));
      while (scale > 1 && short / scale < 250) scale--;
    } else if (pw < ph) scale = Math.max(1, Math.round(pw / 400));
    else {
      scale = Math.max(1, Math.round(ph / 400));
      if (pw / scale < 560) scale = Math.max(1, Math.floor(pw / 560));
    }
    W = Math.ceil(pw / scale);
    H = Math.ceil(ph / scale);
    canvas.width = W;
    canvas.height = H;
    canvas.style.width = (W * scale) / dpr + 'px';
    canvas.style.height = (H * scale) / dpr + 'px';
    ctx.imageSmoothingEnabled = false;
  }
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 150));
  resize();

  function toInternal(e) {
    const r = canvas.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H];
  }
  function setPos(e) {
    [In.mx, In.my] = toInternal(e);
  }

  const touches = new Map();
  let tp = null, gest = null, ignoreTouch = false, late = null;
  function startGesture() {
    const [a, b] = [...touches.values()];
    gest = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, cx: cam.x, cy: cam.y };
  }
  function updateGesture() {
    const [a, b] = [...touches.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    cam.x = gest.cx - (mx - gest.mx) / cam.z;
    cam.y = gest.cy - (my - gest.my) / cam.z;
    AX.clampCam();
    const k = d / gest.d;
    if (k > 1.45 || k < 0.69) {
      AX.zoom(k > 1 ? 1 : -1, mx, my);
      gest = { d, mx, my, cx: cam.x, cy: cam.y };
    }
  }
  function touchDown(e) {
    const [x, y] = toInternal(e);
    touches.set(e.pointerId, { x, y });
    if (touches.size === 1 && !ignoreTouch) {
      tp = { id: e.pointerId, sx: x, sy: y, fired: false };
      In.mx = x;
      In.my = y;
    } else if (touches.size === 2) {
      if (tp && tp.fired) {
        In.down = false;
        T.drag = null;
      }
      tp = null;
      ignoreTouch = true;
      startGesture();
    }
  }
  function touchMove(e) {
    if (!touches.has(e.pointerId)) return;
    const [x, y] = toInternal(e);
    touches.set(e.pointerId, { x, y });
    if (gest) {
      if (touches.size >= 2) updateGesture();
      return;
    }
    if (!tp || tp.id !== e.pointerId) return;
    if (!tp.fired) {
      if (Math.hypot(x - tp.sx, y - tp.sy) > 5) {
        tp.fired = true;
        In.touchDrag = true;
        In.mx = tp.sx;
        In.my = tp.sy;
        In.down = true;
        In.pressed = true;
        late = [x, y];
      }
    } else if (In.pressed) late = [x, y];
    else {
      In.mx = x;
      In.my = y;
    }
  }
  function touchUp(e) {
    if (!touches.has(e.pointerId)) return;
    touches.delete(e.pointerId);
    if (gest || ignoreTouch) {
      if (touches.size < 2) gest = null;
      if (touches.size === 0) ignoreTouch = false;
      return;
    }
    if (tp && tp.id === e.pointerId) {
      if (!tp.fired) {
        In.mx = tp.sx;
        In.my = tp.sy;
        In.down = true;
        In.pressed = true;
        In.touchDrag = false;
        In.tapRelease = true;
      } else {
        In.down = false;
        In.released = true;
      }
      tp = null;
    }
  }
  AX.inputEndFrame = function () {
    if (late) {
      In.mx = late[0];
      In.my = late[1];
      late = null;
    }
    if (In.tapRelease) {
      In.tapRelease = false;
      In.down = false;
    }
  };

  canvas.addEventListener('pointerdown', (e) => {
    AX.Audio.init();
    e.preventDefault();
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch (err) {}
    if (e.pointerType === 'touch') {
      In.touch = true;
      touchDown(e);
      return;
    }
    In.touch = false;
    In.touchDrag = false;
    setPos(e);
    if (e.button === 0) {
      In.down = true;
      In.pressed = true;
    } else if (e.button === 2) {
      In.rdown = true;
      In.rpressed = true;
    } else if (e.button === 1) {
      In.mdown = true;
      T.mpan = { sx: In.mx, sy: In.my, cx: cam.x, cy: cam.y };
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') {
      touchMove(e);
      return;
    }
    In.touch = false;
    setPos(e);
  });
  const up = (e) => {
    if (e.pointerType === 'touch') {
      touchUp(e);
      return;
    }
    setPos(e);
    if (e.button === 0) {
      In.down = false;
      In.released = true;
    } else if (e.button === 2) In.rdown = false;
    else if (e.button === 1) {
      In.mdown = false;
      T.mpan = null;
    }
  };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('pointerleave', (e) => {
    if (e.pointerType !== 'touch' && !In.down && !In.rdown) {
      In.mx = -99;
      In.my = -99;
    }
  });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas.addEventListener('wheel', (e) => {
    In.wheel += Math.sign(e.deltaY);
    e.preventDefault();
  }, { passive: false });
  window.addEventListener('keydown', (e) => {
    AX.Audio.init();
    if (!In.keys.has(e.code)) In.kp.add(e.code);
    In.keys.add(e.code);
    In.shift = e.shiftKey;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab'].includes(e.code)) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => {
    In.keys.delete(e.code);
    In.shift = e.shiftKey;
  });
  window.addEventListener('blur', () => {
    In.keys.clear();
    In.down = In.rdown = In.mdown = false;
    T.drag = null;
  });
  const saveNow = () => {
    if (AX.state === 'game') AX.Sim.save();
  };
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) saveNow();
  });
  window.addEventListener('pagehide', saveNow);

  AX.zoom = function (dir, ax, ay) {
    const nz = AX.clamp(cam.z + dir, 1, 3);
    if (nz === cam.z) return;
    ax = ax == null ? W / 2 : ax;
    ay = ay == null ? H / 2 : ay;
    const [bx, by] = AX.screenToWorld(ax, ay, W, H);
    cam.z = nz;
    const [nx, ny] = AX.screenToWorld(ax, ay, W, H);
    cam.x += bx - nx;
    cam.y += by - ny;
    AX.clampCam();
  };
  AX.rotateTool = function () {
    if (T.sel && T.sel !== 'delete') T.rot = (T.rot + (In.shift ? 3 : 1)) % 4;
    else if (T.inspect) AX.Sim.rotateEnt(G.ents.get(T.inspect));
  };
  AX.selectTool = function (type) {
    if (type && type !== 'delete' && !AX.Sim.unlocked(type)) {
      AX.Audio.play('deny');
      return;
    }
    T.sel = T.sel === type ? null : type;
    T.drag = null;
    if (T.sel) T.inspect = null;
  };
  AX.start = function (mode) {
    AX.Audio.init();
    if (mode === 'new') {
      AX.Sim.wipe();
      AX.Sim.newGame();
      AX.Sim.intro();
    } else AX.Sim.welcomeBack();
    centerCam();
    if (W < 560) G.chatOpen = false;
    AX.state = 'game';
    G.modal = null;
    T.sel = null;
    T.inspect = null;
  };
  function centerCam() {
    cam.x = (G.HQX + 1.5) * 16;
    cam.y = (G.HQY + 1.5) * 16 + 20;
  }

  let brokeT = 0;
  function feedback(res, wx, wy, isClick) {
    if (res === 'ok' || res === 'rot') return;
    if (res === 'money') {
      if (performance.now() - brokeT > 700) {
        brokeT = performance.now();
        AX.Audio.play('deny');
        AX.Sim.float(wx, wy - 8, AX.pick(['broke', 'broke ass', 'need more $', 'cant afford ts']), 'r');
      }
    } else if ((res === 'blocked' || res === 'locked') && isClick) AX.Audio.play('deny');
  }
  function anchorFor(type, wx, wy) {
    const s = B[type].size;
    return [Math.floor(wx / 16 - s / 2 + 0.5), Math.floor(wy / 16 - s / 2 + 0.5)];
  }
  function placeBelt(x, y, dir, isClick) {
    const r = AX.Sim.tryPlace(T.sel, x, y, dir);
    if (r === 'ok') {
      AX.Audio.play('belt');
      AX.Sim.burst(x * 16 + 8, y * 16 + 8, ['l', 'm'], 2, 15);
    }
    feedback(r, x * 16 + 8, y * 16, isClick);
    return r;
  }
  function delAt(x, y, allowIce) {
    const e = AX.Sim.entAt(x, y);
    if (!e && !allowIce) return;
    const r = AX.Sim.removeAt(x, y);
    if (r === 'ok') {
      AX.Audio.play('del');
      AX.Sim.burst(x * 16 + 8, y * 16 + 8, ['m', 'l', 'k'], 6, 30);
      if (e && T.inspect === e.id) T.inspect = null;
    } else if (r === 'ice') AX.Audio.play('ice');
    else if (r === 'money') feedback('money', x * 16 + 8, y * 16);
  }

  function worldInput(dt) {
    const S = G.S;
    const overUI = UIover();
    const [wx, wy] = AX.screenToWorld(In.mx, In.my, W, H);
    const tx = Math.floor(wx / 16), ty = Math.floor(wy / 16);
    const kp = In.kp;

    if (!G.modal) {
      for (let i = 0; i < 10; i++) {
        if (kp.has('Digit' + ((i + 1) % 10)) || kp.has('Numpad' + ((i + 1) % 10))) AX.selectTool(AX.TOOLBAR[i]);
      }
      if (kp.has('KeyR')) {
        if (T.sel) AX.rotateTool();
        else {
          const e = AX.Sim.entAt(tx, ty);
          if (e) AX.Sim.rotateEnt(e);
        }
      }
      if (kp.has('KeyQ')) {
        const e = AX.Sim.entAt(tx, ty);
        if (e && e.type !== 'hq' && AX.Sim.unlocked(e.type)) {
          T.sel = e.type;
          T.rot = e.rot;
          T.inspect = null;
        } else T.sel = null;
      }
      if (kp.has('KeyX') || kp.has('Delete')) AX.selectTool('delete');
      if (kp.has('KeyL')) AX.Sim.larp();
      if (kp.has('KeyJ')) AX.Sim.joke();
      if (kp.has('KeyH') || kp.has('F1')) AX.UI.openHelp();
      if (kp.has('Escape')) {
        if (T.sel) T.sel = null;
        else T.inspect = null;
      }
    }
    if (kp.has('KeyU') && (!G.modal || G.modal.type === 'lab')) AX.UI.toggleLab();
    if (kp.has('KeyM')) AX.Audio.toggleMute();
    if (G.modal && G.modal.type !== 'lab') return;

    const pan = 260 / cam.z * dt;
    if (In.keys.has('KeyW') || In.keys.has('ArrowUp')) cam.y -= pan;
    if (In.keys.has('KeyS') || In.keys.has('ArrowDown')) cam.y += pan;
    if (In.keys.has('KeyA') || In.keys.has('ArrowLeft')) cam.x -= pan;
    if (In.keys.has('KeyD') || In.keys.has('ArrowRight')) cam.x += pan;
    if (In.wheel && !overUI && !G.modal) AX.zoom(-Math.sign(In.wheel), In.mx, In.my);
    if (T.mpan) {
      cam.x = T.mpan.cx - (In.mx - T.mpan.sx) / cam.z;
      cam.y = T.mpan.cy - (In.my - T.mpan.sy) / cam.z;
    }
    AX.clampCam();
    if (G.modal) return;

    if (In.pressed && !overUI && !In.used) {
      const hit = AX.Sim.clickAt(wx, wy);
      if (hit) {
        T.drag = { mode: 'none' };
      } else if (T.sel === 'delete') {
        T.drag = { mode: 'del', last: [tx, ty] };
        delAt(tx, ty, true);
      } else if (T.sel && B[T.sel].kind === 'belt') {
        T.drag = { mode: 'belt', last: [tx, ty] };
        placeBelt(tx, ty, T.rot, true);
      } else if (T.sel && In.touchDrag) {
        T.drag = { mode: 'pan', sx: In.mx, sy: In.my, cx: cam.x, cy: cam.y };
      } else if (T.sel) {
        const [ax, ay] = anchorFor(T.sel, wx, wy);
        const r = AX.Sim.tryPlace(T.sel, ax, ay, T.rot);
        if (r === 'ok') {
          AX.Audio.play('place');
          const s = B[T.sel].size;
          AX.Sim.burst((ax + s / 2) * 16, (ay + s) * 16, ['l', 'L', 'm'], 12, 40);
          G.shake = Math.max(G.shake, 1.5);
        }
        feedback(r, wx, wy, true);
        T.drag = { mode: 'none' };
      } else {
        const e = AX.Sim.entAt(tx, ty);
        if (e) {
          T.inspect = T.inspect === e.id ? null : e.id;
          AX.Audio.play('ui');
          T.drag = { mode: 'none' };
        } else {
          T.inspect = null;
          T.drag = { mode: 'pan', sx: In.mx, sy: In.my, cx: cam.x, cy: cam.y };
        }
      }
    }
    if (In.rpressed && !overUI) {
      const e = AX.Sim.entAt(tx, ty);
      if (!e && T.sel && !(AX.Sim.inb(tx, ty) && G.obst[AX.Sim.idx(tx, ty)])) T.sel = null;
      else {
        T.rdrag = { last: [tx, ty] };
        delAt(tx, ty, true);
      }
    }
    if (In.rdown && T.rdrag) {
      const [lx, ly] = T.rdrag.last;
      if (lx !== tx || ly !== ty) {
        T.rdrag.last = [tx, ty];
        delAt(tx, ty, false);
      }
    } else T.rdrag = null;

    if (In.down && T.drag) {
      const d = T.drag;
      if (d.mode === 'pan') {
        cam.x = d.cx - (In.mx - d.sx) / cam.z;
        cam.y = d.cy - (In.my - d.sy) / cam.z;
        AX.clampCam();
      } else if (d.mode === 'del') {
        const [lx, ly] = d.last;
        if (lx !== tx || ly !== ty) {
          d.last = [tx, ty];
          delAt(tx, ty, false);
        }
      } else if (d.mode === 'belt') {
        let [lx, ly] = d.last;
        let guard = 0;
        while ((lx !== tx || ly !== ty) && guard++ < 200) {
          const ddx = tx - lx, ddy = ty - ly;
          let dir;
          if (ddx !== 0 && Math.abs(ddx) >= Math.abs(ddy)) dir = ddx > 0 ? 0 : 2;
          else dir = ddy > 0 ? 1 : 3;
          const prev = AX.Sim.entAt(lx, ly);
          if (prev && B[prev.type].kind === 'belt') AX.Sim.tryPlace(T.sel, lx, ly, dir);
          lx += AX.DX[dir];
          ly += AX.DY[dir];
          T.rot = dir;
          placeBelt(lx, ly, dir, false);
        }
        d.last = [tx, ty];
      }
    }
    if (!In.down) T.drag = null;
  }
  function UIover() {
    return AX.UI.over(In.mx, In.my);
  }

  let last = performance.now(), time = 0;
  function frame(now) {
    const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
    last = now;
    time += dt;
    if (AX.state === 'game') {
      worldInput(dt);
      const n = Math.max(1, Math.ceil(dt / (1 / 60)));
      for (let i = 0; i < n; i++) AX.Sim.update(dt / n);
    } else {
      cam.x += Math.cos(time * 0.1) * 6 * dt;
      cam.y += Math.sin(time * 0.13) * 4 * dt;
      if (In.kp.has('Enter') && !G.modal) AX.start(AX.Sim.hasSave() && G.S.time > 1 ? 'continue' : 'new');
    }
    render(dt);
    In.pressed = In.released = In.rpressed = false;
    In.wheel = 0;
    In.kp.clear();
    In.used = false;
    AX.inputEndFrame();
    requestAnimationFrame(frame);
  }

  function render(dt) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    const [wx, wy] = AX.screenToWorld(In.mx, In.my, W, H);
    const tx = Math.floor(wx / 16), ty = Math.floor(wy / 16);
    const overUI = UIover();
    const hover = { wx, wy, tool: T.sel, e: !overUI && AX.state === 'game' ? AX.Sim.entAt(tx, ty) : null };
    AX.Render.drawWorld(ctx, W, H, time, hover);
    if (AX.state === 'game' && !overUI && !G.modal && In.mx >= 0) {
      if (T.sel === 'delete') AX.Render.drawDeleteCursor(ctx, tx, ty, time);
      else if (T.sel) {
        const [ax, ay] = B[T.sel].kind === 'belt' ? [tx, ty] : anchorFor(T.sel, wx, wy);
        const ok = (AX.Sim.canPlace(T.sel, ax, ay) || (B[T.sel].kind === 'belt' && AX.Sim.entAt(ax, ay) && B[AX.Sim.entAt(ax, ay).type].kind === 'belt')) && G.S.money >= B[T.sel].cost;
        AX.Render.drawGhost(ctx, T.sel, ax, ay, T.rot, ok, time);
      }
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    AX.UI.frame(ctx, W, H, time);
  }

  if (!(AX.Sim.hasSave() && AX.Sim.load())) AX.Sim.newGame(true);
  centerCam();
  requestAnimationFrame(frame);
  AX.debug = { G, T, In, get W() { return W; }, get H() { return H; } };
})(window.AX);
