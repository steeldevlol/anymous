'use strict';
(function (AX) {
  let ctx = null, master, sfxBus, musBus, noiseBuf, pulse25;
  const pref = JSON.parse(localStorage.getItem('axon-audio') || '{"mute":false,"music":true}');
  const last = {};

  function savePref() {
    localStorage.setItem('axon-audio', JSON.stringify(pref));
  }
  function init() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = pref.mute ? 0 : 0.7;
    master.connect(ctx.destination);
    sfxBus = ctx.createGain();
    sfxBus.gain.value = 0.55;
    sfxBus.connect(master);
    musBus = ctx.createGain();
    musBus.gain.value = pref.music ? 0.32 : 0;
    musBus.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

    const n = 32, re = new Float32Array(n), im = new Float32Array(n);
    for (let k = 1; k < n; k++) im[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * 0.25);
    pulse25 = ctx.createPeriodicWave(re, im);
    startMusic();
  }

  function tone(freq, dur, o) {
    o = o || {};
    const t = (o.at || ctx.currentTime) + (o.delay || 0);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    if (o.wave === 'pulse') osc.setPeriodicWave(pulse25);
    else osc.type = o.wave || 'square';
    osc.frequency.setValueAtTime(freq, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t + dur);
    const v = o.vol == null ? 0.2 : o.vol;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + (o.att || 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(o.bus || sfxBus);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }
  function noise(dur, o) {
    o = o || {};
    const t = (o.at || ctx.currentTime) + (o.delay || 0);
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = o.type || 'lowpass';
    f.frequency.setValueAtTime(o.freq || 2000, t);
    if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(o.vol == null ? 0.2 : o.vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(o.bus || sfxBus);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.02);
  }
  const mid = (m) => 440 * Math.pow(2, (m - 69) / 12);

  const SFX = {
    ui: () => tone(1400, 0.04, { vol: 0.06 }),
    place: () => {
      tone(520, 0.06, { vol: 0.12, to: 780 });
      noise(0.05, { vol: 0.08, freq: 3000 });
    },
    belt: () => tone(880 + Math.random() * 60, 0.03, { vol: 0.05 }),
    del: () => {
      noise(0.12, { vol: 0.16, freq: 1500, to: 200 });
      tone(300, 0.1, { vol: 0.08, to: 120 });
    },
    deny: () => {
      tone(180, 0.09, { vol: 0.12 });
      tone(150, 0.12, { vol: 0.12, delay: 0.08 });
    },
    sell: () => {
      tone(1568, 0.06, { vol: 0.05, wave: 'triangle' });
      tone(2093, 0.08, { vol: 0.04, wave: 'triangle', delay: 0.04 });
    },
    six7: () => {
      tone(mid(81), 0.14, { vol: 0.14, wave: 'pulse' });
      tone(mid(83), 0.28, { vol: 0.14, wave: 'pulse', delay: 0.13 });
      tone(mid(88), 0.3, { vol: 0.08, wave: 'triangle', delay: 0.13 });
    },
    release: () => {
      [72, 76, 79, 84, 88, 91, 96].forEach((m, i) => tone(mid(m), 0.18, { vol: 0.12, wave: 'pulse', delay: i * 0.07 }));
      [60, 67, 72].forEach((m, i) => tone(mid(m), 0.6, { vol: 0.1, wave: 'triangle', delay: 0.5 + i * 0.02 }));
      noise(0.5, { vol: 0.08, type: 'highpass', freq: 4000, delay: 0.5 });
    },
    crash: () => {
      tone(mid(64), 0.18, { vol: 0.13, wave: 'triangle' });
      tone(mid(57), 0.35, { vol: 0.13, wave: 'triangle', delay: 0.16 });
    },
    reboot: () => [60, 64, 67, 72].forEach((m, i) => tone(mid(m), 0.1, { vol: 0.07, wave: 'triangle', delay: i * 0.06 })),
    squash: () => {
      noise(0.18, { vol: 0.2, freq: 900, to: 120 });
      tone(400, 0.18, { vol: 0.1, to: 60 });
    },
    golden: () => [79, 83, 86, 91, 95].forEach((m, i) => tone(mid(m), 0.12, { vol: 0.09, wave: 'triangle', delay: i * 0.05 })),
    larp: () => {
      tone(300, 0.25, { vol: 0.1, to: 1200, wave: 'pulse' });
      noise(0.25, { vol: 0.06, type: 'highpass', freq: 2000, to: 8000 });
    },
    joke: () => tone(900, 0.2, { vol: 0.08, to: 400, wave: 'triangle' }),
    exposed: () => [67, 66, 65, 61].forEach((m, i) => tone(mid(m - 12), i === 3 ? 0.7 : 0.25, { vol: 0.13, wave: 'square', delay: i * 0.26 })),
    buy: () => {
      tone(mid(76), 0.08, { vol: 0.1, wave: 'pulse' });
      tone(mid(83), 0.14, { vol: 0.1, wave: 'pulse', delay: 0.06 });
    },
    msg: () => tone(mid(84), 0.05, { vol: 0.035, wave: 'triangle' }),
    ice: () => {
      noise(0.2, { vol: 0.14, type: 'highpass', freq: 3000 });
      tone(2400, 0.1, { vol: 0.04, to: 1800 });
    },
  };
  const THROTTLE = { sell: 0.09, belt: 0.03, msg: 0.15, place: 0.04, del: 0.05, deny: 0.2 };

  function play(name) {
    if (!ctx || pref.mute || !SFX[name]) return;
    const now = ctx.currentTime;
    if (last[name] && now - last[name] < (THROTTLE[name] || 0.02)) return;
    last[name] = now;
    SFX[name]();
  }

  const BPM = 112, STEP = 60 / BPM / 4;
  const CH = [
    { root: 41, arp: [65, 69, 72] },
    { root: 38, arp: [62, 65, 69] },
    { root: 46, arp: [65, 70, 74] },
    { root: 43, arp: [64, 67, 72] },
  ];
  const LEAD = [
    { 0: 84, 3: 81, 6: 79, 8: 77, 10: 79, 12: 81 },
    { 0: 77, 3: 74, 6: 72, 8: 74, 12: 77 },
    { 0: 74, 2: 77, 4: 81, 6: 82, 8: 81, 10: 77, 12: 74 },
    { 0: 76, 3: 79, 6: 84, 8: 79, 12: 76, 14: 79 },
    { 0: 84, 3: 86, 6: 84, 8: 81, 10: 84, 12: 86, 14: 89 },
    { 0: 86, 3: 84, 6: 81, 8: 77, 12: 74 },
    { 0: 74, 2: 77, 4: 81, 6: 82, 8: 86, 10: 84, 12: 82 },
    { 0: 81, 3: 79, 6: 76, 8: 72, 12: 77 },
  ];
  let nextT = 0, step = 0, timer = null;
  function playStep(s, t) {
    const bar = Math.floor(s / 16) % 8, st = s % 16, ch = CH[bar % 4];
    const v = { at: t, bus: musBus };

    const bassPat = { 0: 0, 3: 12, 6: 7, 8: 0, 11: 12, 14: 7 };
    if (bassPat[st] != null) tone(mid(ch.root + bassPat[st]), STEP * 1.8, { ...v, wave: 'triangle', vol: 0.22 });

    if (st % 2 === 0) tone(mid(ch.arp[(st / 2) % 3] + 12), STEP * 0.9, { ...v, wave: 'square', vol: 0.018 });

    const loop = Math.floor(s / 128);
    const note = LEAD[bar][st];
    if (note && loop % 2 === 1) tone(mid(note), STEP * 2.2, { ...v, wave: 'pulse', vol: 0.05, att: 0.01 });
    if (note && loop % 2 === 0 && bar >= 4) tone(mid(note - 12), STEP * 1.5, { ...v, wave: 'triangle', vol: 0.06 });

    if (st === 0 || st === 8 || st === 11) tone(150, 0.12, { ...v, wave: 'sine', vol: 0.3, to: 45 });
    if (st === 4 || st === 12) noise(0.1, { ...v, vol: 0.06, type: 'bandpass', freq: 1800 });
    if (st % 4 === 2) noise(0.03, { ...v, vol: 0.035, type: 'highpass', freq: 7000 });
  }
  function startMusic() {
    if (timer) return;
    nextT = ctx.currentTime + 0.1;
    timer = setInterval(() => {
      if (!ctx || ctx.state !== 'running') return;
      if (nextT < ctx.currentTime - 0.5) nextT = ctx.currentTime + 0.05;
      while (nextT < ctx.currentTime + 0.2) {
        if (pref.music && !pref.mute) playStep(step, nextT);
        nextT += STEP;
        step = (step + 1) % 256;
      }
    }, 40);
  }

  AX.Audio = {
    init,
    play,
    get muted() {
      return pref.mute;
    },
    get music() {
      return pref.music;
    },
    toggleMute() {
      pref.mute = !pref.mute;
      if (master) master.gain.value = pref.mute ? 0 : 0.7;
      savePref();
    },
    toggleMusic() {
      pref.music = !pref.music;
      if (musBus) musBus.gain.value = pref.music ? 0.32 : 0;
      savePref();
    },
  };
})(window.AX);
