/* AETHER RAZE — procedural electronic soundtrack + SFX (Web Audio) */
AR.Audio = {
  ctx: null,
  master: null,
  musicG: null,
  sfxG: null,
  started: false,
  track: null,
  nextT: 0,
  step: 0,
  timer: 0,
  muted: false,
  _noise: null,
  _delay: null,

  boot: function () {
    if (this.ctx || this._failed) return;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { this._failed = true; return; }
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.musicG = this.ctx.createGain();
      this.sfxG = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
      this.musicG.connect(this.master);
      this.sfxG.connect(this.master);
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
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(function () {});
    }
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
    g.gain.setValueAtTime(gain, t);
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
    g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this.sfxG);
    o.start(t); o.stop(t + dur + 0.02);
    return o;
  },
  kick: function (t, g) {
    this.osc("sine", 140, t, 0.18, (g || 0.9), this.musicG, 38);
    this.noise(t, 0.04, 0.12, 200, this.musicG);
  },
  snare: function (t, g) {
    this.noise(t, 0.12, (g || 0.35), 1800, this.musicG);
    this.osc("triangle", 220, t, 0.08, 0.12, this.musicG, 90);
  },
  hat: function (t, open, g) {
    this.noise(t, open ? 0.12 : 0.035, (g || 0.16), 7000, this.musicG);
  },
  bass: function (t, freq, dur, g) {
    var o = this.ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(freq, t);
    var f = this.ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(900, t);
    f.frequency.exponentialRampToValueAtTime(180, t + dur * 0.8);
    f.Q.value = 8;
    var gn = this.ctx.createGain();
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.exponentialRampToValueAtTime(g || 0.22, t + 0.02);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f); f.connect(gn); gn.connect(this.musicG);
    o.start(t); o.stop(t + dur + 0.02);
  },
  lead: function (t, freq, dur, g, type) {
    var o = this.ctx.createOscillator();
    o.type = type || "square";
    o.frequency.setValueAtTime(freq, t);
    var f = this.ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 2200;
    var gn = this.ctx.createGain();
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.exponentialRampToValueAtTime(g || 0.08, t + 0.01);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f); f.connect(gn); gn.connect(this.musicG);
    o.start(t); o.stop(t + dur + 0.02);
    var o2 = this.ctx.createOscillator();
    o2.type = "square";
    o2.frequency.setValueAtTime(freq * 1.005, t);
    var g2 = this.ctx.createGain();
    g2.gain.setValueAtTime(0.0001, t);
    g2.gain.exponentialRampToValueAtTime((g || 0.08) * 0.4, t + 0.01);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o2.connect(g2); g2.connect(this.musicG);
    o2.start(t); o2.stop(t + dur + 0.02);
  },
  pad: function (t, freq, dur, g) {
    for (var i = 0; i < 3; i++) {
      var o = this.ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(freq * (1 + i * 0.007), t);
      var f = this.ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = 700;
      var gn = this.ctx.createGain();
      gn.gain.setValueAtTime(0.0001, t);
      gn.gain.linearRampToValueAtTime((g || 0.04), t + 0.2);
      gn.gain.linearRampToValueAtTime(0.0001, t + dur);
      o.connect(f); f.connect(gn); gn.connect(this.musicG);
      o.start(t); o.stop(t + dur + 0.02);
    }
  },
  alarm: function (t) {
    this.osc("square", 880, t, 0.12, 0.05, this.musicG);
    this.osc("square", 660, t + 0.12, 0.12, 0.05, this.musicG);
  },

  TRACKS: null,
  _initTracks: function () {
    var n = function (name, oct) { return AR.Audio.note(name, oct); };
    this.TRACKS = {
      title: { bpm: 128, bars: 8, mood: "title" },
      menu: { bpm: 110, bars: 8, mood: "menu" },
      steel: { bpm: 140, bars: 8, mood: "ind" },
      steelBoss: { bpm: 150, bars: 8, mood: "boss" },
      ocean: { bpm: 132, bars: 8, mood: "deep" },
      oceanBoss: { bpm: 148, bars: 8, mood: "boss" },
      red: { bpm: 155, bars: 8, mood: "brk" },
      redBoss: { bpm: 162, bars: 8, mood: "boss" },
      neon: { bpm: 138, bars: 8, mood: "wave" },
      neonBoss: { bpm: 158, bars: 8, mood: "boss" },
      bio: { bpm: 128, bars: 8, mood: "dark" },
      bioBoss: { bpm: 144, bars: 8, mood: "boss" },
      core: { bpm: 170, bars: 8, mood: "max" },
      coreBoss: { bpm: 174, bars: 8, mood: "final" },
      victory: { bpm: 118, bars: 8, mood: "win" },
      over: { bpm: 90, bars: 8, mood: "lose" }
    };
    this._notes = n;
  },
  note: function (name, oct) {
    var map = { C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3, E: 4, F: 5, "F#": 6, Gb: 6, G: 7, "G#": 8, Ab: 8, A: 9, "A#": 10, Bb: 10, B: 11 };
    return 440 * Math.pow(2, (map[name] - 9) / 12 + ((oct || 4) - 4));
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
    this.nextT = this.ctx.currentTime + 0.05;
  },
  stopMusic: function () { this.track = null; },
  tick: function () {
    if (!this.ctx || !this.track || this.ctx.state !== "running") return;
    try {
      var look = 0.12;
      var stepDur = 60 / this.track.bpm / 4;
      var guard = 0;
      while (this.nextT < this.ctx.currentTime + look && guard++ < 32) {
        this._sched(this.step, this.nextT, this.track);
        this.nextT += stepDur;
        this.step = (this.step + 1) % (this.track.bars * 16);
      }
    } catch (err) {}
  },
  _sched: function (st, t, tr) {
    var bar = (st / 16) | 0;
    var s = st % 16;
    var mood = tr.mood;
    var accent = (s === 0 || s === 8);
    if (mood === "lose") {
      if (s === 0) this.kick(t, 0.5);
      if (s === 8) this.snare(t, 0.2);
      if (s % 4 === 0) this.bass(t, this.note("A", 1), 0.4, 0.16);
      if (s === 0) this.pad(t, this.note("A", 3), 1.6, 0.03);
      return;
    }
    if (mood === "win") {
      if (s % 4 === 0) this.kick(t, 0.7);
      if (s === 4 || s === 12) this.snare(t, 0.3);
      if (s % 2 === 0) this.hat(t, false, 0.1);
      var winN = [this.note("A", 3), this.note("C", 4), this.note("E", 4), this.note("A", 4)][s % 4];
      if (s % 2 === 0) this.lead(t, winN, 0.18, 0.07, "triangle");
      if (s === 0) this.pad(t, this.note("A", 3), 1.8, 0.045);
      return;
    }
    if (mood === "title" || mood === "menu") {
      if (s === 0 || s === 6 || s === 10) this.kick(t, 0.55);
      if (s === 4 || s === 12) this.snare(t, 0.22);
      if (s % 2 === 0) this.hat(t, s % 8 === 6, 0.09);
      if (s === 0) this.pad(t, this.note(mood === "title" ? "F#" : "E", 3), 1.7, 0.035);
      if (s % 4 === 0) this.bass(t, this.note("F#", 1), 0.28, 0.18);
      if (mood === "title" && (s === 0 || s === 6)) this.lead(t, this.note("C#", 4), 0.22, 0.06);
      return;
    }

    var boss = mood === "boss" || mood === "final";
    var fast = mood === "max" || mood === "brk" || mood === "final";

    if (s === 0 || s === 8 || (fast && (s === 4 || s === 12))) this.kick(t, boss ? 1 : 0.8);
    if (mood === "ind" && (s === 3 || s === 11)) this.kick(t, 0.45);
    if (s === 4 || s === 12) this.snare(t, boss ? 0.42 : 0.32);
    if (mood === "brk" && (s === 6 || s === 14)) this.snare(t, 0.18);
    if (s % 2 === 0) this.hat(t, false, boss ? 0.18 : 0.12);
    else if (fast) this.hat(t, false, 0.07);
    if (s === 7 || s === 15) this.hat(t, true, 0.14);

    var root = {
      ind: "A", deep: "D", brk: "E", wave: "F#", dark: "G#", max: "A", boss: "A", final: "A"
    }[mood] || "A";
    var bassSeq = [0, 0, 7, 0, 3, 0, 5, 7];
    var deg = bassSeq[(s / 2) | 0];
    if (s % 2 === 0) {
      this.bass(t, this.note(root, 1) * Math.pow(2, deg / 12), fast ? 0.16 : 0.22, boss ? 0.28 : 0.2);
    } else if (boss && s % 4 === 1) {
      this.bass(t, this.note(root, 1) * 1.5, 0.1, 0.12);
    }

    if (s === 0 && (bar % 2 === 0)) this.pad(t, this.note(root, 3), 1.9, mood === "deep" ? 0.05 : 0.03);

    var leadSeq = mood === "wave"
      ? [0, 3, 7, 10, 7, 3, 0, 5]
      : mood === "dark"
        ? [0, 1, 3, 6, 3, 1, 0, 7]
        : [0, 3, 7, 8, 7, 5, 3, 0];
    if (s % 2 === 0 && (boss || s % 4 === 0 || mood === "wave" || mood === "max")) {
      var lf = this.note(root, 4) * Math.pow(2, leadSeq[(s / 2) | 0] / 12);
      this.lead(t, lf, boss ? 0.12 : 0.16, boss ? 0.09 : 0.06, mood === "wave" ? "sawtooth" : "square");
    }
    if (boss && s === 0) this.alarm(t);
    if (mood === "final" && s === 8) this.alarm(t);
    if (mood === "deep" && s === 0) this.noise(t, 0.4, 0.04, 400, this.musicG);
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
      case "shot":
        this.osc("square", 920, t, 0.045, 0.07, dest, 420);
        break;
      case "laser":
        this.osc("sawtooth", 1400, t, 0.08, 0.06, dest, 600);
        break;
      case "missile":
        this.noise(t, 0.08, 0.1, 900, dest);
        this.osc("sawtooth", 240, t, 0.12, 0.08, dest, 80);
        break;
      case "charge":
        this.osc("sine", 200, t, 0.15, 0.08, dest, 700);
        break;
      case "chargeFire":
        this.osc("sawtooth", 180, t, 0.28, 0.22, dest, 60);
        this.noise(t, 0.2, 0.2, 400, dest);
        break;
      case "special":
        this.osc("sine", 80, t, 0.5, 0.4, dest, 30);
        this.noise(t, 0.45, 0.35, 200, dest);
        this.osc("square", 520, t, 0.2, 0.12, dest, 90);
        break;
      case "hit":
        this.osc("square", 180, t, 0.05, 0.08, dest, 70);
        this.noise(t, 0.04, 0.08, 1200, dest);
        break;
      case "hurt":
        this.osc("sawtooth", 140, t, 0.2, 0.2, dest, 50);
        this.noise(t, 0.18, 0.22, 300, dest);
        break;
      case "explode":
        this.noise(t, 0.35, 0.4, 300, dest);
        this.osc("sine", 90, t, 0.32, 0.35, dest, 28);
        break;
      case "explodeBig":
        this.noise(t, 0.7, 0.55, 180, dest);
        this.osc("sine", 55, t, 0.8, 0.55, dest, 18);
        this.osc("triangle", 120, t, 0.4, 0.2, dest, 40);
        break;
      case "pickup":
        this.osc("square", 660, t, 0.08, 0.12, dest);
        this.osc("square", 990, t + 0.07, 0.1, 0.1, dest);
        break;
      case "shield":
        this.osc("sine", 480, t, 0.15, 0.12, dest, 200);
        break;
      case "menu":
        this.osc("square", 440, t, 0.05, 0.08, dest);
        break;
      case "confirm":
        this.osc("square", 520, t, 0.06, 0.1, dest);
        this.osc("square", 780, t + 0.06, 0.08, 0.08, dest);
        break;
      case "warn":
        this.osc("square", 720, t, 0.12, 0.1, dest);
        this.osc("square", 720, t + 0.16, 0.12, 0.1, dest);
        break;
      case "boss":
        this.osc("sawtooth", 60, t, 0.8, 0.3, dest, 30);
        this.noise(t, 0.6, 0.25, 200, dest);
        break;
      case "text":
        this.osc("square", 1800, t, 0.02, 0.04, dest);
        break;
    }
  }
};
