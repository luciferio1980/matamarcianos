/* AETHER RAZE — core: config, math, input, save, pools */
var AR = {
  W: 1920,
  H: 1080,
  VERSION: "1.0.0",
  TITLE: "AETHER RAZE",
  FPS: 60
};

AR.DIFF = {
  novice:  { id: "novice",  name: "NOVATO",   hp: 0.72, rate: 0.72, dmg: 1.20, drops: 1.35, iframes: 2.4, extra: 0 },
  arcade:  { id: "arcade",  name: "ARCADE",   hp: 1.00, rate: 1.00, dmg: 1.00, drops: 1.00, iframes: 2.0, extra: 0 },
  veteran: { id: "veteran", name: "VETERANO", hp: 1.28, rate: 1.18, dmg: 0.95, drops: 0.85, iframes: 1.6, extra: 1 },
  inferno: { id: "inferno", name: "INFIERNO", hp: 1.55, rate: 1.38, dmg: 0.90, drops: 0.70, iframes: 1.2, extra: 2 }
};

AR.STAGES = [
  { id: 0, key: "steel",   name: "FRONTERA DE ACERO",     sub: "Distrito Maglev · Sector 07",     boss: "KRAST-09",        bossTitle: "DERIBAMUROS" },
  { id: 1, key: "ocean",   name: "OCÉANO DE TITANIO",     sub: "Complejo Abisal Helixar",         boss: "MYRION",          bossTitle: "EL VIENTRE DE MAREA" },
  { id: 2, key: "red",     name: "PLANETA ROJO",          sub: "Superficie de Vhar-Kesh",         boss: "SKARATH",         bossTitle: "EL SOL DE ASEDIO" },
  { id: 3, key: "neon",    name: "CIUDAD NEÓN",           sub: "Noxveil · Circuito Medianoche",   boss: "VELA-NOVA",       bossTitle: "ACORAZADO ESPECTRO" },
  { id: 4, key: "bio",     name: "MUNDO BIOMECÁNICO",     sub: "Interior de Orthos",              boss: "ORTHOS",          bossTitle: "LA PUERTA VIVA" },
  { id: 5, key: "core",    name: "EL NÚCLEO",             sub: "Espina Helixar · Cámara Cero",    boss: "HELIXAR PRIME",   bossTitle: "VOLUNTAD DEL DOMINIO" }
];

AR.WEAPONS = ["vulcan", "laser", "spread", "missile"];
AR.WEAPON_NAME = { vulcan: "VULCANO", laser: "LÁSER", spread: "DISPERSIÓN", missile: "MISILES" };

AR.DEFAULT_KEYS = {
  up: "KeyW", down: "KeyS", left: "KeyA", right: "KeyD",
  up2: "ArrowUp", down2: "ArrowDown", left2: "ArrowLeft", right2: "ArrowRight",
  fire: "Space", special: "ShiftLeft", focus: "ControlLeft", pause: "Escape", bomb: "KeyQ"
};

AR.DEFAULT_PAD = {
  fire: 0, special: 5, bomb: 1, focus: 6, pause: 9, confirm: 0, back: 1
};

AR.clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
AR.lerp = function (a, b, t) { return a + (b - a) * t; };
AR.rand = function (a, b) { return a + Math.random() * (b - a); };
AR.irand = function (a, b) { return (a + Math.random() * (b - a + 1)) | 0; };
AR.pick = function (arr) { return arr[(Math.random() * arr.length) | 0]; };
AR.ang = function (x1, y1, x2, y2) { return Math.atan2(y2 - y1, x2 - x1); };
AR.len = function (x, y) { return Math.hypot(x, y); };
AR.norm = function (x, y) {
  var l = Math.hypot(x, y) || 1;
  return { x: x / l, y: y / l };
};

AR.circleHit = function (ax, ay, ar, bx, by, br) {
  var dx = ax - bx, dy = ay - by;
  return dx * dx + dy * dy <= (ar + br) * (ar + br);
};

AR.aabbHit = function (ax, ay, aw, ah, bx, by, bw, bh) {
  return Math.abs(ax - bx) < (aw + bw) * 0.5 && Math.abs(ay - by) < (ah + bh) * 0.5;
};

AR.Pool = function (n, factory) {
  this.items = new Array(n);
  for (var i = 0; i < n; i++) this.items[i] = factory();
};
AR.Pool.prototype.spawn = function (init) {
  var it, i, n = this.items.length;
  for (i = 0; i < n; i++) {
    it = this.items[i];
    if (!it.alive) {
      init(it);
      it.alive = true;
      return it;
    }
  }
  return null;
};
AR.Pool.prototype.each = function (fn) {
  var it, i, n = this.items.length;
  for (i = 0; i < n; i++) {
    it = this.items[i];
    if (it.alive) fn(it, i);
  }
};
AR.Pool.prototype.clear = function () {
  var i, n = this.items.length;
  for (i = 0; i < n; i++) this.items[i].alive = false;
};

AR.Save = {
  key: "aether-raze-save-v1",
  data: null,
  defaults: function () {
    return {
      options: {
        master: 0.85, music: 0.72, sfx: 0.9,
        fullscreen: true, shake: true, bloom: true, flash: true,
        keys: Object.assign({}, AR.DEFAULT_KEYS),
        pad: Object.assign({}, AR.DEFAULT_PAD)
      },
      progress: {
        unlockedStage: 0,
        inferno: false,
        beaten: false,
        best: { novice: 0, arcade: 0, veteran: 0, inferno: 0 }
      },
      scores: [],
      stats: { runs: 0, kills: 0, deaths: 0, time: 0, bosses: 0 }
    };
  },
  load: function () {
    try {
      var raw = localStorage.getItem(this.key);
      this.data = raw ? Object.assign(this.defaults(), JSON.parse(raw)) : this.defaults();
      this.data.options.keys = Object.assign(AR.DEFAULT_KEYS, this.data.options.keys || {});
      this.data.options.pad = Object.assign(AR.DEFAULT_PAD, this.data.options.pad || {});
    } catch (e) {
      this.data = this.defaults();
    }
    return this.data;
  },
  write: function () {
    try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) {}
  },
  addScore: function (entry) {
    this.data.scores.push(entry);
    this.data.scores.sort(function (a, b) { return b.score - a.score; });
    this.data.scores = this.data.scores.slice(0, 12);
    var d = entry.diff || "arcade";
    if (entry.score > (this.data.progress.best[d] || 0)) this.data.progress.best[d] = entry.score;
    this.write();
  }
};

AR.Input = {
  down: Object.create(null),
  pressed: Object.create(null),
  released: Object.create(null),
  padPrev: Object.create(null),
  remap: null,
  mouse: { x: 0, y: 0, down: false },
  gamepadIndex: 0,
  rumble: function (ms, mag) {
    try {
      var gps = navigator.getGamepads && navigator.getGamepads();
      var gp = gps && gps[this.gamepadIndex];
      if (gp && gp.vibrationActuator) {
        gp.vibrationActuator.playEffect("dual-rumble", {
          duration: ms || 80, strongMagnitude: mag || 0.4, weakMagnitude: mag || 0.2
        });
      }
    } catch (e) {}
  },
  init: function () {
    var self = this;
    window.addEventListener("keydown", function (e) {
      if (self.remap) {
        e.preventDefault();
        AR.Save.data.options.keys[self.remap] = e.code;
        AR.Save.write();
        self.remap = null;
        return;
      }
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(e.code) >= 0) e.preventDefault();
      if (!self.down[e.code]) self.pressed[e.code] = true;
      self.down[e.code] = true;
    });
    window.addEventListener("keyup", function (e) {
      self.down[e.code] = false;
      self.released[e.code] = true;
    });
    window.addEventListener("blur", function () {
      self.down = Object.create(null);
    });
    window.addEventListener("mousemove", function (e) {
      self.mouse.x = e.clientX;
      self.mouse.y = e.clientY;
    });
    window.addEventListener("mousedown", function () { self.mouse.down = true; });
    window.addEventListener("mouseup", function () { self.mouse.down = false; });
  },
  endFrame: function () {
    this.pressed = Object.create(null);
    this.released = Object.create(null);
  },
  axis: function () {
    var k = AR.Save.data.options.keys;
    var x = 0, y = 0;
    if (this.down[k.left] || this.down[k.left2]) x -= 1;
    if (this.down[k.right] || this.down[k.right2]) x += 1;
    if (this.down[k.up] || this.down[k.up2]) y -= 1;
    if (this.down[k.down] || this.down[k.down2]) y += 1;
    var gp = this.pad();
    if (gp) {
      var ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
      if (Math.abs(ax) > 0.22) x += ax;
      if (Math.abs(ay) > 0.22) y += ay;
      if (gp.buttons[14] && gp.buttons[14].pressed) x -= 1;
      if (gp.buttons[15] && gp.buttons[15].pressed) x += 1;
      if (gp.buttons[12] && gp.buttons[12].pressed) y -= 1;
      if (gp.buttons[13] && gp.buttons[13].pressed) y += 1;
    }
    x = AR.clamp(x, -1, 1);
    y = AR.clamp(y, -1, 1);
    var l = Math.hypot(x, y);
    if (l > 1) { x /= l; y /= l; }
    return { x: x, y: y };
  },
  pad: function () {
    var gps = navigator.getGamepads && navigator.getGamepads();
    if (!gps) return null;
    for (var i = 0; i < gps.length; i++) if (gps[i]) { this.gamepadIndex = i; return gps[i]; }
    return null;
  },
  btn: function (which) {
    var k = AR.Save.data.options.keys;
    var p = AR.Save.data.options.pad;
    var code = k[which];
    var held = !!(code && this.down[code]);
    if (which === "special" && this.down.ShiftRight) held = true;
    if (which === "focus" && this.down.ControlRight) held = true;
    var gp = this.pad();
    if (gp && p[which] != null && gp.buttons[p[which]]) held = held || gp.buttons[p[which]].pressed;
    if (which === "fire" && gp && gp.buttons[7] && gp.buttons[7].value > 0.4) held = true;
    return held;
  },
  btnPressed: function (which) {
    var k = AR.Save.data.options.keys;
    var p = AR.Save.data.options.pad;
    if (k[which] && this.pressed[k[which]]) return true;
    if (which === "pause" && this.pressed.Escape) return true;
    var gp = this.pad();
    if (!gp || p[which] == null) return false;
    var b = gp.buttons[p[which]];
    var now = !!(b && b.pressed);
    var prev = !!this.padPrev[which];
    this.padPrev[which] = now;
    return now && !prev;
  },
  anyPressed: function () {
    for (var k in this.pressed) if (this.pressed[k]) return true;
    var gp = this.pad();
    if (gp) {
      for (var i = 0; i < gp.buttons.length; i++) {
        if (gp.buttons[i] && gp.buttons[i].pressed && !this.padPrev["b" + i]) {
          this.padPrev["b" + i] = true;
          return true;
        }
      }
      for (var j = 0; j < gp.buttons.length; j++) this.padPrev["b" + j] = !!(gp.buttons[j] && gp.buttons[j].pressed);
    }
    return false;
  }
};

AR.fitCanvas = function (canvas) {
  var ww = window.innerWidth || document.documentElement.clientWidth || AR.W;
  var wh = window.innerHeight || document.documentElement.clientHeight || AR.H;
  if (ww < 64) ww = AR.W;
  if (wh < 64) wh = AR.H;
  var s = Math.min(ww / AR.W, wh / AR.H);
  canvas.style.width = Math.round(AR.W * s) + "px";
  canvas.style.height = Math.round(AR.H * s) + "px";
};

AR.toggleFullscreen = function () {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(function () {});
  } else {
    document.exitFullscreen().catch(function () {});
  }
};

AR.codeLabel = function (code) {
  var map = {
    Space: "ESPACIO", ShiftLeft: "SHIFT", ShiftRight: "SHIFT D",
    ControlLeft: "CTRL", ControlRight: "CTRL D", Escape: "ESC",
    ArrowUp: "↑", ArrowDown: "↓", ArrowLeft: "←", ArrowRight: "→",
    KeyQ: "Q", KeyW: "W", KeyA: "A", KeyS: "S", KeyD: "D"
  };
  if (map[code]) return map[code];
  if (!code) return "—";
  return code.replace("Key", "").replace("Digit", "");
};
