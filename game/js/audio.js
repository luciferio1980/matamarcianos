/* AETHER RAZE — hard techno soundtrack + SFX (Web Audio) */
AR.Audio = {
  ctx: null,
  master: null,
  musicG: null,
  sfxG: null,
  duck: null,
  delay: null,
  delayG: null,
  started: false,
  track: null,
  nextT: 0,
  step: 0,
  muted: false,
  _noise: null,

  boot: function () {
    if (this.ctx || this._failed) return;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { this._failed = true; return; }
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.musicG = this.ctx.createGain();
      this.sfxG = this.ctx.createGain();
      this.duck = this.ctx.createGain();
      this.delayG = this.ctx.createGain();
      this.delayG.gain.value = 0.28;
      this.delay = this.ctx.createDelay();
      this.delay.delayTime.value = 0.31;
      var fb = this.ctx.createGain();
      fb.gain.value = 0.42;
      var df = this.ctx.createBiquadFilter();
      df.type = "highpass";
      df.frequency.value = 550;
      this.delay.connect(fb);
      fb.connect(this.delay);
      this.delay.connect(df);
      df.connect(this.delayG);
      this.delayG.connect(this.musicG);
      this.duck.connect(this.musicG);
      this.musicG.connect(this.master);
      this.sfxG.connect(this.master);
      this.master.connect(this.ctx.destination);
      this._makeNoise();
      this.applyVol();
    } catch (e) {
      this._failed = true;
      this.ctx = null;
    }
  },
  unlock: function () {
    this.boot();
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume().catch(function () {});
    this.started = true;
    if (this._pending && this.ctx.state === "running") {
      var id = this._pending;
      this._pending = null;
      this.play(id);
    }
  },
  applyVol: function () {
    if (!this.master) return;
    var o = AR.Save.data.options;
    this.master.gain.value = this.muted ? 0 : o.master;
    this.musicG.gain.value = o.music;
    this.sfxG.gain.value = o.sfx;
  },
  _makeNoise: function () {
    var n = 2 * this.ctx.sampleRate;
    var buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    this._noise = buf;
  },
  noise: function (t, dur, gain, hp, dest) {
    var src = this.ctx.createBufferSource();
    src.buffer = this._noise;
    src.loop = true;
    var f = this.ctx.createBiquadFilter();
    f.type = hp > 0 ? "highpass" : "lowpass";
    f.frequency.value = Math.abs(hp) || 800;
    var g = this.ctx.createGain();
    g.gain.setValueAtTime(Math.max(0.0001, gain), t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(dest || this.sfxG);
    src.start(t); src.stop(t + dur + 0.02);
  },
  osc: function (type, freq, t, dur, gain, dest, slide) {
    var o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + dur);
    var g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this.sfxG);
    o.start(t); o.stop(t + dur + 0.02);
    return o;
  },
  toDelay: function (node) {
    if (this.delay) node.connect(this.delay);
  },
  pump: function (t) {
    if (!this.duck) return;
    this.duck.gain.cancelScheduledValues(t);
    this.duck.gain.setValueAtTime(0.38, t);
    this.duck.gain.exponentialRampToValueAtTime(1, t + 0.14);
  },
  kick: function (t, g) {
    this.osc("sine", 190, t, 0.26, g || 1.12, this.musicG, 38);
    this.osc("sine", 78, t, 0.14, 0.52, this.musicG, 30);
    this.osc("triangle", 980, t, 0.018, 0.22, this.musicG, 90);
    this.noise(t, 0.022, 0.18, 1400, this.musicG);
    this.pump(t);
  },
  snare: function (t, g) {
    this.noise(t, 0.16, (g || 0.4), 1800, this.musicG);
    this.osc("triangle", 210, t, 0.1, 0.16, this.musicG, 70);
    this.noise(t, 0.04, 0.12, 6000, this.musicG);
  },
  hat: function (t, open, g) {
    this.noise(t, open ? 0.13 : 0.024, (g || 0.14), 9000, this.duck || this.musicG);
  },
  bass: function (t, freq, dur, g) {
    var dest = this.duck || this.musicG;
    var o = this.ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(freq, t);
    var o2 = this.ctx.createOscillator();
    o2.type = "square";
    o2.frequency.setValueAtTime(freq * 0.5, t);
    var f = this.ctx.createBiquadFilter();
    f.type = "lowpass";
    f.Q.value = 9;
    f.frequency.setValueAtTime(900, t);
    f.frequency.exponentialRampToValueAtTime(140, t + dur * 0.7);
    var gn = this.ctx.createGain();
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.exponentialRampToValueAtTime(g || 0.26, t + 0.01);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f); o2.connect(f); f.connect(gn); gn.connect(dest);
    o.start(t); o.stop(t + dur + 0.02);
    o2.start(t); o2.stop(t + dur + 0.02);
  },
  acid: function (t, freq, dur, g) {
    var dest = this.duck || this.musicG;
    var o = this.ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(freq, t);
    var f = this.ctx.createBiquadFilter();
    f.type = "lowpass";
    f.Q.value = 14;
    f.frequency.setValueAtTime(2800, t);
    f.frequency.exponentialRampToValueAtTime(220, t + dur * 0.85);
    var gn = this.ctx.createGain();
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.exponentialRampToValueAtTime(g || 0.11, t + 0.008);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f); f.connect(gn); gn.connect(dest);
    if (this.delay) gn.connect(this.delay);
    o.start(t); o.stop(t + dur + 0.02);
  },
  lead: function (t, freq, dur, g) {
    var dest = this.duck || this.musicG;
    var gn = this.ctx.createGain();
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.exponentialRampToValueAtTime(g || 0.09, t + 0.035);
    gn.gain.setValueAtTime(g || 0.09, t + dur * 0.55);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    var f = this.ctx.createBiquadFilter();
    f.type = "lowpass";
    f.Q.value = 1.4;
    f.frequency.setValueAtTime(4200, t);
    f.frequency.exponentialRampToValueAtTime(1400, t + dur * 0.8);
    var det = [0.996, 1, 1.004];
    for (var i = 0; i < 3; i++) {
      var o = this.ctx.createOscillator();
      o.type = i === 1 ? "triangle" : "sawtooth";
      o.frequency.setValueAtTime(freq * det[i], t);
      o.connect(f);
      o.start(t); o.stop(t + dur + 0.02);
    }
    f.connect(gn); gn.connect(dest);
    if (this.delay) gn.connect(this.delay);
  },
  harmony: function (t, freq, dur, g) {
    var dest = this.duck || this.musicG;
    var o = this.ctx.createOscillator();
    o.type = "triangle";
    o.frequency.setValueAtTime(freq, t);
    var gn = this.ctx.createGain();
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.exponentialRampToValueAtTime(g || 0.045, t + 0.05);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(gn); gn.connect(dest);
    if (this.delay) gn.connect(this.delay);
    o.start(t); o.stop(t + dur + 0.02);
  },
  pad: function (t, freq, dur, g) {
    var dest = this.duck || this.musicG;
    var thirds = [1, Math.pow(2, 3 / 12), Math.pow(2, 7 / 12)];
    for (var n = 0; n < 3; n++) {
      for (var i = 0; i < 2; i++) {
        var o = this.ctx.createOscillator();
        o.type = "sawtooth";
        o.frequency.setValueAtTime(freq * thirds[n] * (1 + i * 0.006), t);
        var f = this.ctx.createBiquadFilter();
        f.type = "lowpass";
        f.frequency.value = 540;
        var gn = this.ctx.createGain();
        gn.gain.setValueAtTime(0.0001, t);
        gn.gain.linearRampToValueAtTime((g || 0.028) * (n === 0 ? 1 : 0.7), t + 0.3);
        gn.gain.linearRampToValueAtTime(0.0001, t + dur);
        o.connect(f); f.connect(gn); gn.connect(dest);
        if (this.delay) gn.connect(this.delay);
        o.start(t); o.stop(t + dur + 0.02);
      }
    }
  },
  alarm: function (t) {
    this.osc("square", 880, t, 0.1, 0.04, this.duck || this.musicG);
    this.osc("square", 660, t + 0.12, 0.1, 0.04, this.duck || this.musicG);
  },

  note: function (name, oct) {
    var map = { C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3, E: 4, F: 5, "F#": 6, Gb: 6, G: 7, "G#": 8, Ab: 8, A: 9, "A#": 10, Bb: 10, B: 11 };
    return 440 * Math.pow(2, (map[name] - 9) / 12 + ((oct || 4) - 4));
  },

  TRACKS: null,
  _initTracks: function () {
    var R = -1;
    this.TRACKS = {
      title: {
        bpm: 138, bars: 8, root: "F#",
        melody: [7,R,12,R, 15,R,12,10, 7,R,3,0, 7,5,3,R, 12,R,10,7, 15,R,19,15, 12,10,7,5, 3,R,0,R]
      },
      menu: {
        bpm: 130, bars: 8, root: "E",
        melody: [0,R,7,R, 12,R,10,7, 8,R,7,5, 3,R,0,R, 7,R,12,15, 12,10,8,7, 5,R,3,R, 0,R,R,R]
      },
      steel: {
        bpm: 142, bars: 8, root: "A",
        melody: [0,R,3,7, 12,R,10,7, 5,R,3,0, 7,R,R,R, 12,R,10,7, 15,R,12,10, 7,5,3,0, 7,R,0,R]
      },
      steelBoss: {
        bpm: 150, bars: 8, root: "A", boss: 1,
        melody: [0,3,7,12, 15,12,10,7, 12,R,15,R, 12,10,7,3, 0,7,12,15, 19,15,12,10, 7,R,3,R, 0,R,R,R]
      },
      ocean: {
        bpm: 138, bars: 8, root: "D",
        melody: [7,R,12,R, 10,7,5,3, 0,R,7,R, 12,10,7,R, 15,R,12,10, 7,R,5,3, 7,5,3,0, R,R,0,R]
      },
      oceanBoss: {
        bpm: 146, bars: 8, root: "D", boss: 1,
        melody: [0,7,12,15, 12,10,7,3, 10,R,7,R, 12,15,12,7, 0,3,7,12, 15,12,10,7, 5,R,3,R, 0,R,R,R]
      },
      red: {
        bpm: 144, bars: 8, root: "E",
        melody: [0,R,3,7, 8,R,7,3, 5,R,3,0, 7,R,12,R, 8,7,5,3, 0,R,7,R, 12,8,7,5, 3,R,0,R]
      },
      redBoss: {
        bpm: 152, bars: 8, root: "E", boss: 1,
        melody: [0,3,7,8, 12,8,7,3, 10,R,8,7, 5,3,0,R, 12,R,15,12, 8,7,5,3, 8,7,3,0, R,R,0,R]
      },
      neon: {
        bpm: 140, bars: 8, root: "F#",
        melody: [0,R,7,12, 15,R,12,7, 8,R,7,5, 3,R,0,R, 12,R,15,19, 15,12,10,7, 8,7,5,3, 0,R,R,R]
      },
      neonBoss: {
        bpm: 150, bars: 8, root: "F#", boss: 1,
        melody: [0,7,12,15, 19,15,12,8, 7,R,5,3, 0,R,7,R, 12,15,19,15, 12,10,8,7, 5,R,3,R, 0,R,R,R]
      },
      bio: {
        bpm: 136, bars: 8, root: "G#",
        melody: [0,R,3,6, 8,R,6,3, 1,R,0,R, 8,6,3,R, 11,R,8,6, 3,R,1,0, 6,3,1,0, R,R,0,R]
      },
      bioBoss: {
        bpm: 144, bars: 8, root: "G#", boss: 1,
        melody: [0,1,3,6, 8,6,3,1, 0,R,11,8, 6,3,0,R, 8,11,13,11, 8,6,3,1, 3,R,0,R, R,R,0,R]
      },
      core: {
        bpm: 148, bars: 8, root: "A",
        melody: [0,R,7,12, 15,R,12,7, 10,R,7,5, 3,R,0,R, 12,R,15,19, 15,12,10,7, 8,7,5,3, 0,R,7,R]
      },
      coreBoss: {
        bpm: 154, bars: 8, root: "A", boss: 1, final: 1,
        melody: [0,3,7,12, 15,19,15,12, 10,7,12,15, 19,15,12,7, 0,7,12,15, 19,22,19,15, 12,10,7,3, 0,R,7,R]
      },
      victory: {
        bpm: 128, bars: 8, root: "A",
        melody: [0,R,4,7, 12,R,16,12, 9,R,7,4, 0,R,R,R, 7,R,12,16, 19,16,12,9, 7,R,4,R, 0,R,R,R]
      },
      over: {
        bpm: 96, bars: 8, root: "A",
        melody: [0,R,R,R, 3,R,7,R, 5,R,3,R, 0,R,R,R, 7,R,5,R, 3,R,0,R, R,R,R,R, 0,R,R,R]
      }
    };
  },

  play: function (id) {
    this.trackId = id;
    if (!this.TRACKS) this._initTracks();
    if (!this.ctx || this.ctx.state !== "running") {
      this._pending = id;
      this.unlock();
      if (!this.ctx || this.ctx.state !== "running") return;
    }
    this.track = this.TRACKS[id] || this.TRACKS.steel;
    this.step = 0;
    this.nextT = this.ctx.currentTime + 0.04;
  },
  stopMusic: function () { this.track = null; },
  tick: function () {
    if (!this.ctx || !this.track || this.ctx.state !== "running") return;
    try {
      var look = 0.14;
      var stepDur = 60 / this.track.bpm / 4;
      var guard = 0;
      var loop = this.track.bars * 16;
      while (this.nextT < this.ctx.currentTime + look && guard++ < 32) {
        this._sched(this.step, this.nextT, this.track, stepDur);
        this.nextT += stepDur;
        this.step = (this.step + 1) % loop;
      }
    } catch (err) {}
  },
  _sched: function (st, t, tr, stepDur) {
    var s = st % 16;
    var bar = (st / 16) | 0;
    var boss = !!tr.boss;
    var root = tr.root || "A";
    var lose = this.trackId === "over";
    var menuish = this.trackId === "title" || this.trackId === "menu";

    if (s === 0 || s === 4 || s === 8 || s === 12) this.kick(t, lose ? 0.5 : boss ? 1.05 : 0.92);
    if (boss && (s === 2 || s === 6 || s === 10 || s === 14)) this.kick(t, 0.38);
    if (!lose && (s === 4 || s === 12)) this.snare(t, boss ? 0.46 : 0.34);
    if (!lose) {
      this.hat(t, s === 6 || s === 14, (s % 2 === 0) ? 0.12 : 0.055);
      if (s === 2 || s === 10) this.hat(t, true, 0.08);
    }

    var bassPat = boss
      ? [0, -1, 0, 7, 0, -1, 3, 10, 0, -1, 0, 7, 3, -1, 10, 7]
      : [0, -1, -1, 0, 7, -1, 0, 3, 0, -1, -1, 0, 5, -1, 7, 3];
    if (menuish) bassPat = [0, -1, -1, -1, 7, -1, -1, 3, 0, -1, 5, -1, 3, -1, 0, -1];
    if (lose) bassPat = [0, -1, -1, -1, -1, -1, -1, -1, 3, -1, -1, -1, -1, -1, -1, -1];
    var bd = bassPat[s];
    if (bd >= 0) this.bass(t, this.note(root, 1) * Math.pow(2, bd / 12), stepDur * (boss ? 1.05 : 1.28), boss ? 0.24 : 0.2);

    if (!lose && !menuish && (s % 2 === 1) && bar % 2 === 1) {
      var ad = [0, 0, 7, 3, 0, 10, 7, 5][(s >> 1) % 8];
      this.acid(t, this.note(root, 2) * Math.pow(2, ad / 12), stepDur * 0.82, boss ? 0.12 : 0.09);
    }

    if (s === 0 && bar % 2 === 0) this.pad(t, this.note(root, 3), stepDur * 16, lose ? 0.022 : 0.03);

    var mel = tr.melody || [];
    var mi = st % mel.length;
    var deg = mel[mi];
    if (deg >= 0) {
      var hold = 1;
      for (var k = 1; k < 8 && mel[(mi + k) % mel.length] < 0; k++) hold++;
      var freq = this.note(root, 4) * Math.pow(2, deg / 12);
      this.lead(t, freq, stepDur * hold * 0.94, boss ? 0.11 : 0.095);
      if (hold >= 2) this.harmony(t, freq * 0.5 * Math.pow(2, 7 / 12), stepDur * hold * 0.9, 0.04);
    }
    if (boss && s === 0) this.alarm(t);
    if (tr.final && s === 8) this.alarm(t);
  },

  sfx: function (name, x) {
    if (!this.ctx || !this.started) return;
    var t = this.ctx.currentTime;
    var pan = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    if (pan) {
      pan.pan.value = AR.clamp(((x || AR.W * 0.5) / AR.W) * 2 - 1, -0.8, 0.8);
      pan.connect(this.sfxG);
    }
    var dest = pan || this.sfxG;
    switch (name) {
      case "shot": this.osc("square", 920, t, 0.045, 0.07, dest, 420); break;
      case "laser": this.osc("sawtooth", 1400, t, 0.08, 0.06, dest, 600); break;
      case "missile": this.noise(t, 0.08, 0.1, 900, dest); this.osc("sawtooth", 240, t, 0.12, 0.08, dest, 80); break;
      case "charge": this.osc("sine", 200, t, 0.15, 0.08, dest, 700); break;
      case "chargeFire": this.osc("sawtooth", 180, t, 0.28, 0.22, dest, 60); this.noise(t, 0.2, 0.2, 400, dest); break;
      case "special": this.osc("sine", 80, t, 0.5, 0.4, dest, 30); this.noise(t, 0.45, 0.35, 200, dest); break;
      case "hit": this.osc("square", 180, t, 0.05, 0.08, dest, 70); this.noise(t, 0.04, 0.08, 1200, dest); break;
      case "hurt": this.osc("sawtooth", 140, t, 0.2, 0.2, dest, 50); this.noise(t, 0.18, 0.22, 300, dest); break;
      case "explode": this.noise(t, 0.35, 0.4, 300, dest); this.osc("sine", 90, t, 0.32, 0.35, dest, 28); break;
      case "explodeBig": this.noise(t, 0.7, 0.55, 180, dest); this.osc("sine", 55, t, 0.8, 0.55, dest, 18); break;
      case "pickup": this.osc("square", 660, t, 0.08, 0.12, dest); this.osc("square", 990, t + 0.07, 0.1, 0.1, dest); break;
      case "shield": this.osc("sine", 480, t, 0.15, 0.12, dest, 200); break;
      case "menu": this.osc("square", 440, t, 0.05, 0.08, dest); break;
      case "confirm": this.osc("square", 520, t, 0.06, 0.1, dest); this.osc("square", 780, t + 0.06, 0.08, 0.08, dest); break;
      case "warn": this.osc("square", 720, t, 0.12, 0.1, dest); this.osc("square", 720, t + 0.16, 0.12, 0.1, dest); break;
      case "boss": this.osc("sawtooth", 60, t, 0.8, 0.3, dest, 30); this.noise(t, 0.6, 0.25, 200, dest); break;
      case "text": this.osc("square", 1800, t, 0.02, 0.04, dest); break;
    }
  }
};
