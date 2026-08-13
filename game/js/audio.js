/* AETHER RAZE — synthwave soundtrack + SFX (Web Audio) */
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
      this.delayG.gain.value = 0.36;
      this.delay = this.ctx.createDelay();
      this.delay.delayTime.value = 0.42;
      var fb = this.ctx.createGain();
      fb.gain.value = 0.48;
      var df = this.ctx.createBiquadFilter();
      df.type = "highpass";
      df.frequency.value = 380;
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
    this.duck.gain.setValueAtTime(0.42, t);
    this.duck.gain.exponentialRampToValueAtTime(1, t + 0.22);
  },
  kick: function (t, g) {
    this.osc("sine", 150, t, 0.32, g || 0.95, this.musicG, 36);
    this.osc("sine", 62, t, 0.18, 0.4, this.musicG, 28);
    this.noise(t, 0.018, 0.08, 900, this.musicG);
    this.pump(t);
  },
  snare: function (t, g) {
    this.noise(t, 0.18, (g || 0.36), 1400, this.musicG);
    this.osc("triangle", 180, t, 0.12, 0.1, this.musicG, 70);
    this.noise(t, 0.05, 0.14, 5000, this.musicG);
  },
  clap: function (t, g) {
    this.noise(t, 0.04, (g || 0.22), 1800, this.musicG);
    this.noise(t + 0.012, 0.09, (g || 0.22) * 0.7, 2400, this.musicG);
    this.osc("triangle", 420, t, 0.05, 0.04, this.musicG, 180);
  },
  tom: function (t, g) {
    this.osc("sine", 220, t, 0.22, g || 0.22, this.musicG, 70);
    this.osc("triangle", 140, t, 0.16, 0.1, this.musicG, 50);
  },
  hat: function (t, open, g) {
    this.noise(t, open ? 0.16 : 0.03, (g || 0.1), 7000, this.duck || this.musicG);
  },
  bass: function (t, freq, dur, g) {
    var dest = this.duck || this.musicG;
    this.osc("sine", freq, t, dur, (g || 0.22) * 0.85, dest);
    var o = this.ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(freq, t);
    var f = this.ctx.createBiquadFilter();
    f.type = "lowpass";
    f.Q.value = 2.2;
    f.frequency.setValueAtTime(520, t);
    f.frequency.exponentialRampToValueAtTime(180, t + dur * 0.8);
    var gn = this.ctx.createGain();
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.exponentialRampToValueAtTime((g || 0.22) * 0.55, t + 0.02);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f); f.connect(gn); gn.connect(dest);
    o.start(t); o.stop(t + dur + 0.02);
  },
  arp: function (t, freq, dur, g) {
    var dest = this.duck || this.musicG;
    var o = this.ctx.createOscillator();
    o.type = "square";
    o.frequency.setValueAtTime(freq, t);
    var f = this.ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 2200;
    var gn = this.ctx.createGain();
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.exponentialRampToValueAtTime(g || 0.05, t + 0.01);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f); f.connect(gn); gn.connect(dest);
    if (this.delay) gn.connect(this.delay);
    o.start(t); o.stop(t + dur + 0.02);
  },
  lead: function (t, freq, dur, g) {
    var dest = this.duck || this.musicG;
    var gn = this.ctx.createGain();
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.exponentialRampToValueAtTime(g || 0.1, t + 0.08);
    gn.gain.setValueAtTime(g || 0.1, t + dur * 0.62);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    var f = this.ctx.createBiquadFilter();
    f.type = "lowpass";
    f.Q.value = 0.9;
    f.frequency.setValueAtTime(2800, t);
    f.frequency.exponentialRampToValueAtTime(1100, t + dur * 0.85);
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
        f.frequency.value = 480;
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
  pulse: function (t, freq, dur, g) {
    var dest = this.duck || this.musicG;
    var o = this.ctx.createOscillator();
    o.type = "square";
    o.frequency.setValueAtTime(freq, t);
    var f = this.ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(1400, t);
    f.frequency.exponentialRampToValueAtTime(500, t + dur * 0.7);
    var gn = this.ctx.createGain();
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.exponentialRampToValueAtTime(g || 0.09, t + 0.02);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f); f.connect(gn); gn.connect(dest);
    if (this.delay) gn.connect(this.delay);
    o.start(t); o.stop(t + dur + 0.02);
  },
  bell: function (t, freq, dur, g) {
    var dest = this.duck || this.musicG;
    this.osc("sine", freq, t, dur, g || 0.08, dest);
    this.osc("sine", freq * 2.01, t, dur * 0.6, (g || 0.08) * 0.35, dest);
    this.osc("triangle", freq * 3, t, dur * 0.25, (g || 0.08) * 0.15, dest);
  },
  brass: function (t, freq, dur, g) {
    var dest = this.duck || this.musicG;
    var gn = this.ctx.createGain();
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.linearRampToValueAtTime(g || 0.1, t + 0.03);
    gn.gain.setValueAtTime(g || 0.1, t + dur * 0.4);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    var f = this.ctx.createBiquadFilter();
    f.type = "lowpass";
    f.Q.value = 4;
    f.frequency.setValueAtTime(900, t);
    f.frequency.linearRampToValueAtTime(1600, t + 0.08);
    f.frequency.exponentialRampToValueAtTime(600, t + dur);
    var o = this.ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(freq, t);
    var o2 = this.ctx.createOscillator();
    o2.type = "sawtooth";
    o2.frequency.setValueAtTime(freq * 1.007, t);
    o.connect(f); o2.connect(f); f.connect(gn); gn.connect(dest);
    if (this.delay) gn.connect(this.delay);
    o.start(t); o2.start(t); o.stop(t + dur + 0.02); o2.stop(t + dur + 0.02);
  },
  alarm: function (t) {
    this.osc("square", 880, t, 0.1, 0.04, this.duck || this.musicG);
    this.osc("square", 660, t + 0.12, 0.1, 0.04, this.duck || this.musicG);
  },
  _voice: function (kind, t, freq, dur, g) {
    if (kind === "bell") this.bell(t, freq, dur, g);
    else if (kind === "pulse") this.pulse(t, freq, dur, g);
    else if (kind === "brass") this.brass(t, freq, dur, g);
    else this.lead(t, freq, dur, g);
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
        bpm: 84, bars: 8, root: "C#", delay: 0.5, wet: 0.42, swing: 0, leadKind: "bell", hat: "off",
        kick:  [1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        snare: [0,0,0,0, 0,0,0,0, 2,0,0,0, 0,0,0,0],
        melody: [0,R,R,R, R,R,7,R, 12,R,R,R, 10,R,7,R, 3,R,R,R, R,R,0,R, 7,R,R,R, R,R,R,R],
        bass: [0,-1,-1,-1, -1,-1,-1,-1, 7,-1,-1,-1, -1,-1,3,-1],
        arp: null, padEvery: 4
      },
      menu: {
        bpm: 94, bars: 8, root: "Bb", delay: 0.33, wet: 0.28, swing: 0, leadKind: "pulse", hat: "8",
        kick:  [1,0,0,0, 0,0,1,0, 0,0,0,0, 1,0,0,0],
        snare: [0,0,0,0, 2,0,0,0, 0,0,0,0, 0,0,2,0],
        melody: [0,R,10,R, R,R,8,7, 5,R,R,R, 3,R,0,R, 10,R,R,8, 7,R,5,R, 0,R,R,R, R,R,3,R],
        bass: [-1,-1,0,-1, -1,-1,5,-1, -1,-1,8,-1, -1,-1,3,-1],
        arp: [0,5,8,12, 0,7,10,15], padEvery: 4
      },
      hangar: {
        bpm: 76, bars: 8, root: "E", delay: 0.55, wet: 0.5, swing: 0, leadKind: "bell", hat: "off",
        kick:  [1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        snare: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        melody: [0,R,R,R, 4,R,R,R, 7,R,R,R, 11,R,R,R, 12,R,R,R, 7,R,R,R, 4,R,R,R, 0,R,R,R],
        bass: [0,-1,-1,-1, -1,-1,-1,-1, 4,-1,-1,-1, -1,-1,-1,-1],
        arp: [0,4,7,12, 4,7,11,16], padEvery: 2
      },
      steel: {
        bpm: 100, bars: 8, root: "D", delay: 0.38, wet: 0.3, swing: 0, leadKind: "brass", hat: "8",
        kick:  [1,0,0,0, 0,0,0,0, 1,0,0,1, 0,0,0,0],
        snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,2],
        melody: [0,R,R,R, 10,R,R,7, R,R,3,R, 0,R,R,R, 7,R,R,R, 5,R,3,R, 0,R,R,10, R,R,R,R],
        bass: [0,-1,-1,0, 0,-1,10,-1, 7,-1,-1,7, 5,-1,3,-1],
        arp: null, padEvery: 4
      },
      steelBoss: {
        bpm: 108, bars: 8, root: "D", delay: 0.3, wet: 0.34, swing: 0, leadKind: "brass", hat: "16", boss: 1,
        kick:  [1,0,0,1, 0,0,1,0, 1,0,0,1, 0,1,0,0],
        snare: [0,0,0,0, 1,0,0,2, 0,0,0,0, 1,0,2,0],
        melody: [0,7,10,7, 12,R,10,7, 3,R,0,R, 7,10,7,R, 14,R,12,10, 7,R,5,3, 0,R,7,R, 10,R,0,R],
        bass: [0,0,7,0, 10,-1,7,3, 0,0,5,0, 7,-1,3,0],
        arp: [0,7,10,14, 7,10,14,17], padEvery: 8
      },
      ocean: {
        bpm: 86, bars: 8, root: "F#", delay: 0.48, wet: 0.4, swing: 0.14, leadKind: "pulse", hat: "offbeat",
        kick:  [1,0,0,0, 0,0,1,0, 0,0,0,0, 1,0,0,0],
        snare: [0,0,0,0, 3,0,0,0, 0,0,0,0, 3,0,0,0],
        melody: [9,R,R,7, R,R,5,R, 4,R,R,R, 0,R,2,R, 7,R,R,9, R,R,12,R, 9,R,7,R, 5,R,R,R],
        bass: [0,-1,-1,-1, 9,-1,-1,7, 5,-1,-1,-1, 4,-1,0,-1],
        arp: [0,4,7,9, 4,7,11,12], padEvery: 2
      },
      oceanBoss: {
        bpm: 96, bars: 8, root: "F#", delay: 0.4, wet: 0.38, swing: 0.08, leadKind: "pulse", hat: "8", boss: 1,
        kick:  [1,0,0,0, 1,0,0,1, 0,0,1,0, 0,0,1,0],
        snare: [0,0,0,0, 3,0,0,0, 0,0,0,0, 1,0,0,3],
        melody: [0,R,4,7, 9,R,7,4, 12,R,11,9, 7,R,4,R, 9,R,7,4, 0,R,4,R, 7,9,7,4, 0,R,R,R],
        bass: [0,-1,4,-1, 7,-1,9,-1, 0,-1,5,-1, 7,-1,4,-1],
        arp: [0,4,9,12, 4,7,11,14], padEvery: 4
      },
      red: {
        bpm: 118, bars: 8, root: "C", delay: 0.22, wet: 0.18, swing: 0, leadKind: "saw", hat: "16",
        kick:  [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,0,1],
        snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
        melody: [0,1,3,R, 0,R,5,R, 7,R,8,7, 5,3,1,0, 8,R,7,R, 5,R,3,R, 0,R,1,R, 3,R,0,R],
        bass: [0,0,0,1, 0,0,5,3, 0,0,8,7, 5,3,1,0],
        arp: null, padEvery: 8
      },
      redBoss: {
        bpm: 126, bars: 8, root: "C", delay: 0.2, wet: 0.22, swing: 0, leadKind: "brass", hat: "16", boss: 1,
        kick:  [1,0,1,0, 1,0,1,1, 1,0,1,0, 1,1,0,1],
        snare: [0,0,0,0, 1,0,2,0, 0,0,0,0, 1,0,2,0],
        melody: [0,1,5,8, 12,R,8,7, 5,3,1,0, 8,7,5,3, 12,8,7,5, 3,1,0,R, 8,R,5,R, 0,R,1,R],
        bass: [0,1,0,5, 0,1,8,7, 0,3,0,5, 8,7,5,0],
        arp: [0,1,5,8, 3,5,8,12], padEvery: 8
      },
      neon: {
        bpm: 128, bars: 8, root: "G#", delay: 0.25, wet: 0.36, swing: 0, leadKind: "pulse", hat: "16",
        kick:  [1,0,0,0, 0,0,1,0, 1,0,0,0, 0,1,0,0],
        snare: [0,0,0,0, 2,0,0,0, 0,0,0,0, 2,0,0,2],
        melody: [0,7,0,12, 0,7,3,10, 0,8,0,12, 7,3,0,7, 12,7,15,12, 10,7,8,3, 0,7,0,10, 12,0,7,0],
        bass: [0,-1,0,12, 0,-1,8,7, 0,-1,0,10, 8,-1,7,0],
        arp: [0,12,7,15, 3,10,7,12, 0,8,12,19, 7,12,15,12], padEvery: 8
      },
      neonBoss: {
        bpm: 136, bars: 8, root: "G#", delay: 0.19, wet: 0.32, swing: 0, leadKind: "pulse", hat: "16", boss: 1,
        kick:  [1,0,1,0, 0,0,1,0, 1,0,0,1, 0,0,1,0],
        snare: [0,0,0,0, 2,0,0,2, 0,0,0,0, 2,0,2,0],
        melody: [0,12,15,19, 12,7,15,12, 8,12,19,15, 12,8,7,0, 19,15,12,7, 15,12,8,7, 0,7,12,19, 15,12,7,0],
        bass: [0,12,0,7, 0,8,15,8, 0,12,7,19, 8,7,3,0],
        arp: [0,12,19,15, 7,15,19,24, 0,8,15,19, 12,19,15,12], padEvery: 8
      },
      bio: {
        bpm: 90, bars: 8, root: "E", delay: 0.44, wet: 0.38, swing: 0.06, leadKind: "bell", hat: "off",
        kick:  [1,0,0,1, 0,0,1,0, 0,0,0,0, 1,0,0,0],
        snare: [0,0,0,0, 0,0,0,0, 3,0,0,0, 0,0,2,0],
        melody: [0,R,R,3, R,R,7,R, 8,R,R,11, 12,R,8,R, 7,R,3,R, 0,R,R,1, 0,R,8,R, R,R,7,R],
        bass: [0,-1,-1,3, -1,-1,8,-1, 7,-1,-1,-1, 11,-1,8,-1],
        arp: [0,3,7,8, 0,3,8,11], padEvery: 2
      },
      bioBoss: {
        bpm: 102, bars: 8, root: "E", delay: 0.36, wet: 0.34, swing: 0, leadKind: "saw", hat: "8", boss: 1,
        kick:  [1,0,0,0, 1,0,1,0, 1,0,0,1, 0,0,1,0],
        snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,3,0],
        melody: [0,3,8,11, 12,R,11,8, 7,3,0,R, 8,7,3,1, 12,11,8,7, 3,R,0,R, 8,R,11,R, 12,R,0,R],
        bass: [0,3,0,8, 0,-1,11,8, 0,3,7,12, 8,-1,1,0],
        arp: [0,8,12,15, 3,8,11,15], padEvery: 4
      },
      core: {
        bpm: 110, bars: 8, root: "A", delay: 0.41, wet: 0.3, swing: 0, leadKind: "saw", hat: "8",
        kick:  [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,1,0],
        snare: [0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
        melody: [0,R,R,R, 7,R,R,R, 3,R,R,R, 10,R,7,R, 12,R,R,R, 10,R,7,R, 5,R,3,R, 0,R,R,R],
        bass: [0,-1,-1,-1, 0,-1,7,-1, 3,-1,-1,-1, 10,-1,7,-1],
        arp: [0,7,12,15, 3,7,10,14], padEvery: 2
      },
      coreBoss: {
        bpm: 118, bars: 8, root: "A", delay: 0.28, wet: 0.28, swing: 0, leadKind: "brass", hat: "16", boss: 1, final: 1,
        kick:  [1,0,0,1, 0,0,1,0, 1,0,0,0, 1,0,1,0],
        snare: [0,0,0,0, 1,0,0,2, 0,0,0,0, 1,0,2,0],
        melody: [0,7,12,15, 19,R,15,12, 10,7,3,0, 12,10,7,3, 19,15,12,7, 15,12,10,7, 0,7,12,19, 15,12,7,0],
        bass: [0,7,0,12, 0,10,15,7, 0,7,3,10, 12,7,3,0],
        arp: [0,12,15,19, 7,12,19,24], padEvery: 4
      },
      victory: {
        bpm: 100, bars: 8, root: "A", delay: 0.36, wet: 0.32, swing: 0, leadKind: "bell", hat: "8",
        kick:  [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
        snare: [0,0,0,0, 2,0,0,0, 0,0,0,0, 2,0,0,0],
        melody: [0,R,4,7, 12,R,16,12, 9,R,7,4, 0,R,R,R, 7,R,12,16, 19,16,12,9, 7,R,4,R, 0,R,R,R],
        bass: [0,-1,-1,4, 7,-1,-1,0, 9,-1,-1,7, 4,-1,0,-1],
        arp: [0,4,7,12, 4,7,12,16], padEvery: 4
      },
      over: {
        bpm: 70, bars: 8, root: "A", delay: 0.6, wet: 0.22, swing: 0, leadKind: "bell", hat: "off",
        kick:  [1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        snare: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
        melody: [0,R,R,R, 3,R,R,R, 7,R,R,R, 5,R,3,R, 0,R,R,R, R,R,R,R, 3,R,R,R, 0,R,R,R],
        bass: [0,-1,-1,-1, -1,-1,-1,-1, 3,-1,-1,-1, -1,-1,-1,-1],
        arp: null, padEvery: 4
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
    if (this.delay && this.track.delay) this.delay.delayTime.value = this.track.delay;
    if (this.delayG && this.track.wet != null) this.delayG.gain.value = this.track.wet;
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
    var root = tr.root || "A";
    var lose = this.trackId === "over";
    if (tr.swing && s % 2 === 1) t += tr.swing * stepDur;

    var kick = tr.kick || [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0];
    if (kick[s]) this.kick(t, lose ? 0.4 : tr.boss ? 0.92 : 0.78);

    var sn = tr.snare || [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0];
    if (!lose) {
      if (sn[s] === 1) this.snare(t, tr.boss ? 0.32 : 0.24);
      if (sn[s] === 2) this.clap(t, tr.boss ? 0.26 : 0.2);
      if (sn[s] === 3) this.tom(t, 0.2);
    }

    if (!lose) {
      if (tr.hat === "16") this.hat(t, s % 4 === 2, s % 2 === 0 ? 0.08 : 0.035);
      else if (tr.hat === "8" && s % 2 === 0) this.hat(t, s % 8 === 6, 0.08);
      else if (tr.hat === "offbeat" && s % 2 === 1) this.hat(t, false, 0.055);
    }

    var bassPat = tr.bass || [0, -1, -1, -1, 7, -1, -1, -1, 0, -1, -1, -1, 3, -1, -1, -1];
    if (lose) bassPat = [0, -1, -1, -1, -1, -1, -1, -1, 3, -1, -1, -1, -1, -1, -1, -1];
    var bd = bassPat[s];
    if (bd >= 0) this.bass(t, this.note(root, 1) * Math.pow(2, bd / 12), stepDur * (tr.boss ? 1.05 : 1.45), tr.boss ? 0.2 : 0.17);

    var arp = tr.arp;
    if (arp && !lose) {
      var ad = arp[s % arp.length];
      if (ad >= 0) this.arp(t, this.note(root, 5) * Math.pow(2, ad / 12), stepDur * 0.62, tr.boss ? 0.05 : 0.036);
    }

    var every = tr.padEvery || 4;
    if (s === 0 && bar % every === 0) this.pad(t, this.note(root, 3), stepDur * 16 * Math.min(every, 4), lose ? 0.02 : 0.036);

    var mel = tr.melody || [];
    var mi = st % mel.length;
    var deg = mel[mi];
    if (deg >= 0) {
      var hold = 1;
      for (var k = 1; k < 8 && mel[(mi + k) % mel.length] < 0; k++) hold++;
      var freq = this.note(root, 4) * Math.pow(2, deg / 12);
      this._voice(tr.leadKind, t, freq, stepDur * hold * 0.94, tr.boss ? 0.11 : 0.095);
      if (hold >= 3 && tr.leadKind === "bell") this.harmony(t, freq * 2, stepDur * hold * 0.4, 0.02);
      else if (hold >= 2 && tr.leadKind !== "pulse") this.harmony(t, freq * Math.pow(2, 7 / 12) * 0.5, stepDur * hold * 0.85, 0.03);
    }
    if (tr.boss && s === 0) this.alarm(t);
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
