/* AETHER RAZE — sprites, particles, 2.5D parallax backgrounds */
AR.Gfx = {
  sprites: {},
  art: {},
  bg: {},
  sky: {},
  mid: {},
  fg: {},
  bossArt: [],
  bloom: null,
  bloom2: null,
  grain: null,
  titleBg: null,
  logo: null,
  ready: false,

  init: function (done, progress) {
    this.bloom = document.createElement("canvas");
    this.bloom.width = 640;
    this.bloom.height = 360;
    this.bctx = this.bloom.getContext("2d");
    this.bloom2 = document.createElement("canvas");
    this.bloom2.width = 320;
    this.bloom2.height = 180;
    this.bctx2 = this.bloom2.getContext("2d");
    this.grain = this._grain();
    this._buildSprites();
    var self = this;
    var files = [
      ["titleBg", "assets/title-bg.jpg"],
      ["logo", "assets/logo-aether-raze.jpg"],
      ["player", "assets/spr-player.png", "art"],
      ["wasp", "assets/spr-wasp.png", "art"],
      ["drone", "assets/spr-drone.png", "art"],
      ["kami", "assets/spr-kami.png", "art"],
      ["armor", "assets/spr-armor.png", "art"],
      ["squid", "assets/spr-squid.png", "art"],
      ["gunship", "assets/spr-gunship.png", "art"],
      ["turret", "assets/spr-turret.png", "art"],
      ["mine", "assets/spr-mine.png", "art"],
      ["steel", "assets/bg-steel.jpg", "bg"],
      ["ocean", "assets/bg-ocean.jpg", "bg"],
      ["red", "assets/bg-red.jpg", "bg"],
      ["neon", "assets/bg-neon.jpg", "bg"],
      ["bio", "assets/bg-bio.jpg", "bg"],
      ["core", "assets/bg-core.jpg", "bg"],
      ["steel", "assets/sky-steel.jpg", "sky"],
      ["ocean", "assets/sky-ocean.jpg", "sky"],
      ["red", "assets/sky-red.jpg", "sky"],
      ["neon", "assets/sky-neon.jpg", "sky"],
      ["bio", "assets/sky-bio.jpg", "sky"],
      ["core", "assets/sky-core.jpg", "sky"],
      ["steel", "assets/mid-steel.webp", "mid"],
      ["ocean", "assets/mid-ocean.webp", "mid"],
      ["red", "assets/mid-red.webp", "mid"],
      ["neon", "assets/mid-neon.webp", "mid"],
      ["bio", "assets/mid-bio.webp", "mid"],
      ["core", "assets/mid-core.webp", "mid"],
      ["steel", "assets/fg-steel.webp", "fg"],
      ["ocean", "assets/fg-ocean.webp", "fg"],
      ["red", "assets/fg-red.webp", "fg"],
      ["neon", "assets/fg-neon.webp", "fg"],
      ["bio", "assets/fg-bio.webp", "fg"],
      ["core", "assets/fg-core.webp", "fg"]
    ];
    var bosses = [
      "assets/boss-krast.png", "assets/boss-myrion.png", "assets/boss-skarath.png",
      "assets/boss-vela.png", "assets/boss-orthos.png", "assets/boss-helixar.png"
    ];
    var total = files.length + bosses.length, loaded = 0;
    function one() {
      loaded++;
      if (progress) progress(loaded / total);
      if (loaded >= total) { self.ready = true; if (done) done(); }
    }
    files.forEach(function (f) {
      var im = new Image();
      im.onload = im.onerror = one;
      im.src = f[1];
      if (f[2] === "art") self.art[f[0]] = im;
      else if (f[2] === "bg") self.bg[f[0]] = im;
      else if (f[2] === "sky") self.sky[f[0]] = im;
      else if (f[2] === "mid") self.mid[f[0]] = im;
      else if (f[2] === "fg") self.fg[f[0]] = im;
      else self[f[0]] = im;
    });
    this.bossArt = bosses.map(function (src) {
      var im = new Image();
      im.onload = im.onerror = one;
      im.src = src;
      return im;
    });
  },

  _c: function (w, h) {
    var c = document.createElement("canvas");
    c.width = w; c.height = h;
    return { c: c, x: c.getContext("2d") };
  },
  _grain: function () {
    var g = this._c(128, 128);
    var id = g.x.createImageData(128, 128);
    for (var i = 0; i < id.data.length; i += 4) {
      var v = 40 + Math.random() * 40;
      id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
      id.data[i + 3] = 28;
    }
    g.x.putImageData(id, 0, 0);
    return g.c;
  },
  _buildSprites: function () {
    this.sprites.player = this._ship(96, 48, "#3cf0ff", "#7dffd4", "#0a2a44", false);
    this.sprites.wasp = this._ship(56, 28, "#ff5a6a", "#ffb070", "#3a1018", true);
    this.sprites.drone = this._ship(48, 36, "#c9d4e8", "#8ab", "#223", true);
    this.sprites.kami = this._ship(50, 22, "#ffcc33", "#ff7722", "#421", true);
    this.sprites.armor = this._ship(80, 44, "#8a9aaa", "#445", "#111", true);
    this.sprites.squid = this._organic(64, 48, "#66ffaa", "#224433");
    this.sprites.gunship = this._ship(120, 56, "#d06070", "#889", "#22080c", true);
    this.sprites.turret = this._turret();
    this.sprites.mine = this._mine();
    this.sprites.pickup = this._pickups();
  },
  _ship: function (w, h, accent, glow, hull, flip) {
    var g = this._c(w, h);
    var x = g.x, cx = w * 0.5, cy = h * 0.5;
    x.translate(cx, cy);
    if (flip) x.scale(-1, 1);
    x.fillStyle = hull;
    x.beginPath();
    x.moveTo(w * 0.46, 0);
    x.lineTo(w * 0.18, -h * 0.42);
    x.lineTo(-w * 0.22, -h * 0.18);
    x.lineTo(-w * 0.42, 0);
    x.lineTo(-w * 0.22, h * 0.18);
    x.lineTo(w * 0.18, h * 0.42);
    x.closePath();
    x.fill();
    var lg = x.createLinearGradient(-w * 0.3, 0, w * 0.4, 0);
    lg.addColorStop(0, hull);
    lg.addColorStop(0.5, accent);
    lg.addColorStop(1, "#fff");
    x.globalAlpha = 0.55;
    x.fillStyle = lg;
    x.fill();
    x.globalAlpha = 1;
    x.fillStyle = glow;
    x.beginPath();
    x.ellipse(w * 0.12, 0, w * 0.12, h * 0.12, 0, 0, 6.28);
    x.fill();
    x.fillStyle = accent;
    x.fillRect(-w * 0.42, -h * 0.08, w * 0.12, h * 0.16);
    x.strokeStyle = "rgba(255,255,255,0.35)";
    x.lineWidth = 1;
    x.beginPath();
    x.moveTo(-w * 0.1, -h * 0.2);
    x.lineTo(w * 0.3, 0);
    x.lineTo(-w * 0.1, h * 0.2);
    x.stroke();
    return g.c;
  },
  _organic: function (w, h, col, dark) {
    var g = this._c(w, h);
    var x = g.x;
    x.fillStyle = dark;
    x.beginPath();
    x.ellipse(w * 0.5, h * 0.5, w * 0.38, h * 0.32, 0, 0, 6.28);
    x.fill();
    x.fillStyle = col;
    x.globalAlpha = 0.7;
    x.beginPath();
    x.ellipse(w * 0.42, h * 0.5, w * 0.16, h * 0.16, 0, 0, 6.28);
    x.fill();
    x.globalAlpha = 1;
    x.strokeStyle = col;
    x.lineWidth = 2;
    for (var i = 0; i < 4; i++) {
      x.beginPath();
      x.moveTo(w * 0.7, h * 0.35 + i * 6);
      x.quadraticCurveTo(w * 0.9, h * 0.2 + i * 10, w * 0.95, h * 0.5);
      x.stroke();
    }
    return g.c;
  },
  _turret: function () {
    var g = this._c(48, 40);
    var x = g.x;
    x.fillStyle = "#334";
    x.fillRect(8, 22, 32, 14);
    x.fillStyle = "#8899aa";
    x.beginPath(); x.arc(24, 20, 12, 0, 6.28); x.fill();
    x.fillStyle = "#3cf0ff";
    x.fillRect(24, 16, 22, 8);
    return g.c;
  },
  _mine: function () {
    var g = this._c(32, 32);
    var x = g.x;
    x.fillStyle = "#c33";
    x.beginPath(); x.arc(16, 16, 10, 0, 6.28); x.fill();
    x.strokeStyle = "#fa5";
    x.lineWidth = 2;
    for (var i = 0; i < 6; i++) {
      var a = i * Math.PI / 3;
      x.beginPath();
      x.moveTo(16 + Math.cos(a) * 8, 16 + Math.sin(a) * 8);
      x.lineTo(16 + Math.cos(a) * 15, 16 + Math.sin(a) * 15);
      x.stroke();
    }
    return g.c;
  },
  _pickups: function () {
    var map = {}, keys = [
      ["P", "#3cf0ff", "POW"], ["L", "#ff4ad2", "LAS"], ["S", "#ffe14a", "SPR"],
      ["M", "#7cff6a", "MIS"], ["H", "#ff5a6a", "HP"], ["D", "#9ad", "SHD"],
      ["B", "#ff8a3c", "BOM"], ["X", "#fff", "x2"], ["V", "#6af", "SPD"]
    ];
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i], g = this._c(36, 36), x = g.x;
      x.fillStyle = "rgba(0,0,0,0.35)";
      x.beginPath(); x.arc(18, 20, 14, 0, 6.28); x.fill();
      var grd = x.createRadialGradient(14, 12, 2, 18, 18, 16);
      grd.addColorStop(0, "#fff");
      grd.addColorStop(0.3, k[1]);
      grd.addColorStop(1, "#000");
      x.fillStyle = grd;
      x.beginPath(); x.arc(18, 18, 13, 0, 6.28); x.fill();
      x.strokeStyle = "#fff";
      x.lineWidth = 2;
      x.stroke();
      x.fillStyle = "#041018";
      x.font = "bold 14px sans-serif";
      x.textAlign = "center";
      x.textBaseline = "middle";
      x.fillText(k[0], 18, 19);
      map[k[0]] = g.c;
    }
    return map;
  },

  glow: function (ctx, x, y, r, col, a) {
    var g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, col);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.save();
    ctx.globalAlpha = a == null ? 0.55 : a;
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 6.28); ctx.fill();
    ctx.restore();
  },

  _imgOk: function (im) { return im && im.complete && im.naturalWidth > 8; },

  drawArt: function (ctx, img, fallback, x, y, dw, dh, rot, flash, sc) {
    sc = sc || 1;
    ctx.save();
    ctx.translate(x, y);
    if (rot) ctx.rotate(rot);
    var w = dw * sc, h = dh * sc;
    if (this._imgOk(img)) {
      ctx.drawImage(img, -w * 0.5, -h * 0.5, w, h);
    } else if (fallback) {
      ctx.drawImage(fallback, -fallback.width * 0.5 * sc, -fallback.height * 0.5 * sc,
        fallback.width * sc, fallback.height * sc);
    }
    if (flash > 0) {
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = "rgba(255,255,255," + Math.min(0.55, flash) + ")";
      ctx.fillRect(-w * 0.5, -h * 0.5, w, h);
    }
    ctx.restore();
  },

  drawPlayer: function (ctx, p, t) {
    var pulse = 0.65 + Math.sin(t * 22) * 0.35;
    this.glow(ctx, p.x - 36, p.y, 42, "rgba(80,230,255,0.95)", 0.55 * pulse);
    this.glow(ctx, p.x - 18, p.y, 22, "rgba(180,255,255,0.8)", 0.35 * pulse);
    var img = this.art.player;
    var dw = 128, dh = this._imgOk(img) ? dw * img.naturalHeight / img.naturalWidth : 44;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.vy * 0.00055);
    if (p.hurtBlink) ctx.globalAlpha = 0.35 + 0.65 * ((t * 20) % 1 > 0.5 ? 1 : 0);
    if (this._imgOk(img)) ctx.drawImage(img, -dw * 0.42, -dh * 0.5, dw, dh);
    else ctx.drawImage(this.sprites.player, -48, -24);
    ctx.fillStyle = "rgba(160,255,255," + (0.35 + pulse * 0.5) + ")";
    ctx.globalCompositeOperation = "lighter";
    ctx.beginPath();
    ctx.moveTo(-48, -7);
    ctx.lineTo(-78 - pulse * 22, 0);
    ctx.lineTo(-48, 7);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    if (p.shield > 0) {
      ctx.strokeStyle = "rgba(120,220,255,0.9)";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(4, 0, 38 + Math.sin(t * 8) * 2, 0, 6.28); ctx.stroke();
      ctx.strokeStyle = "rgba(80,255,200,0.35)";
      ctx.beginPath(); ctx.arc(4, 0, 46, t, t + 2.2); ctx.stroke();
    }
    if (p.focus) {
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(8, 0, 5, 0, 6.28); ctx.stroke();
      ctx.fillStyle = "#ff3d6e";
      ctx.beginPath(); ctx.arc(8, 0, 3, 0, 6.28); ctx.fill();
    }
    ctx.restore();
  },

  drawEnemy: function (ctx, e, t) {
    var img = this.art[e.spr];
    var sizes = { wasp: 78, drone: 64, kami: 72, armor: 110, squid: 92, gunship: 150, turret: 70, mine: 42 };
    var dw = sizes[e.spr] || 72;
    var dh = this._imgOk(img) ? dw * img.naturalHeight / img.naturalWidth : 32;
    this.glow(ctx, e.x + 10, e.y, 18, "rgba(255,80,60,0.35)", 0.35);
    this.drawArt(ctx, img, this.sprites[e.spr] || this.sprites.wasp, e.x, e.y, dw, dh, e.rot || 0, e.flash, e.scale || 1);
    if (e.kind === "pop") this.glow(ctx, e.x, e.y, 22, "rgba(255,180,80,0.5)", 0.3);
  }
};

AR.Particles = {
  pool: null,
  init: function () {
    this.pool = new AR.Pool(900, function () {
      return { alive: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, r: 2, col: "#fff", g: 1, drag: 0.98, type: 0 };
    });
  },
  burst: function (x, y, n, col, spd, r) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * 6.28, s = Math.random() * (spd || 220);
      this.pool.spawn(function (p) {
        p.x = x; p.y = y; p.vx = Math.cos(a) * s; p.vy = Math.sin(a) * s;
        p.life = p.max = AR.rand(0.25, 0.7);
        p.r = AR.rand(1, r || 4); p.col = col || "#ffaa55"; p.g = 1; p.drag = 0.96; p.type = 0;
      });
    }
  },
  spark: function (x, y, col) {
    this.burst(x, y, 8, col || "#cff", 280, 2);
  },
  explode: function (x, y, big) {
    this.burst(x, y, big ? 64 : 22, "#ffcc66", big ? 420 : 260, big ? 7 : 3);
    this.burst(x, y, big ? 28 : 10, "#fff", big ? 180 : 100, 3);
    this.burst(x, y, big ? 18 : 6, "#ff6622", big ? 140 : 70, 8);
    this.pool.spawn(function (p) {
      p.x = x; p.y = y; p.vx = 0; p.vy = 0; p.life = p.max = big ? 0.5 : 0.24;
      p.r = big ? 90 : 32; p.col = "rgba(255,220,160,0.8)"; p.g = 1; p.drag = 1; p.type = 1;
    });
    if (big) {
      for (var i = 0; i < 6; i++) this.smoke(x + AR.rand(-20, 20), y + AR.rand(-16, 16));
    }
  },
  smoke: function (x, y) {
    this.pool.spawn(function (p) {
      p.x = x; p.y = y; p.vx = AR.rand(-20, 20); p.vy = AR.rand(-40, -10);
      p.life = p.max = AR.rand(0.5, 1.1); p.r = AR.rand(6, 16);
      p.col = "rgba(80,90,100,0.5)"; p.g = 0; p.drag = 0.99; p.type = 2;
    });
  },
  update: function (dt) {
    this.pool.each(function (p) {
      p.life -= dt;
      if (p.life <= 0) { p.alive = false; return; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= p.drag; p.vy *= p.drag;
    });
  },
  draw: function (ctx) {
    ctx.save();
    this.pool.each(function (p) {
      var a = p.life / p.max;
      if (p.type === 1) {
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = a * 0.7;
        ctx.fillStyle = "#ffe8b0";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1.2 - a), 0, 6.28); ctx.fill();
      } else if (p.type === 2) {
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = a * 0.35;
        ctx.fillStyle = p.col;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1.4 - a * 0.4), 0, 6.28); ctx.fill();
      } else {
        ctx.globalCompositeOperation = p.g ? "lighter" : "source-over";
        ctx.globalAlpha = a;
        ctx.fillStyle = p.col;
        ctx.fillRect(p.x - p.r * 0.5, p.y - p.r * 0.5, p.r, p.r);
      }
    });
    ctx.restore();
  }
};

AR.FX = {
  shake: 0, flash: 0, hitstop: 0, vignette: 0.55,
  boom: function (n) { this.shake = Math.max(this.shake, n || 8); },
  white: function (n) { this.flash = Math.max(this.flash, n || 0.4); },
  stop: function (n) { this.hitstop = Math.max(this.hitstop, n || 0.04); },
  update: function (dt) {
    this.shake = Math.max(0, this.shake - dt * 28);
    this.flash = Math.max(0, this.flash - dt * 2.2);
    this.hitstop = Math.max(0, this.hitstop - dt);
  }
};

AR.Background = {
  t: 0, cam: 0, debris: [],
  reset: function () { this.t = 0; this.cam = 0; this.debris = []; },
  update: function (dt, speed) {
    this.t += dt;
    this.cam += speed * dt;
    for (var i = this.debris.length - 1; i >= 0; i--) {
      var d = this.debris[i];
      d.x += d.vx * dt; d.y += d.vy * dt; d.rot += d.vr * dt; d.life -= dt;
      if (d.life <= 0) this.debris.splice(i, 1);
    }
  },
  smash: function (x, y) {
    for (var i = 0; i < 6; i++) {
      this.debris.push({
        x: x, y: y, vx: AR.rand(-80, 40), vy: AR.rand(40, 220),
        vr: AR.rand(-3, 3), w: AR.rand(18, 50), h: AR.rand(12, 40),
        life: AR.rand(1.2, 2.4), rot: Math.random() * 6
      });
    }
  },
  keyOf: function (stage) {
    return ["steel", "ocean", "red", "neon", "bio", "core"][stage] || "steel";
  },
  draw: function (ctx, stage) {
    this.drawBack(ctx, stage);
    this.drawFront(ctx, stage);
  },
  drawBack: function (ctx, stage) {
    var key = this.keyOf(stage);
    var sky = AR.Gfx.sky[key];
    var mid = AR.Gfx.mid[key];
    ctx.fillStyle = "#02040a";
    ctx.fillRect(0, 0, AR.W, AR.H);
    if (AR.Gfx._imgOk(sky)) {
      this.pan(ctx, sky, this.cam, 0.08, 0, AR.H, 1);
    } else if (AR.Gfx._imgOk(AR.Gfx.bg[key])) {
      this.pan(ctx, AR.Gfx.bg[key], this.cam, 0.1, 0, AR.H, 1);
    } else {
      var fn = [this.steel, this.ocean, this.red, this.neon, this.bio, this.core][stage] || this.steel;
      fn.call(this, ctx, this.cam, this.t);
      this.atmosphere(ctx, stage, this.t, this.cam);
      return;
    }
    if (AR.Gfx._imgOk(mid)) this.pan(ctx, mid, this.cam, 0.34, 0, AR.H, 1);
    this.atmosphere(ctx, stage, this.t, this.cam);
  },
  drawFront: function (ctx, stage) {
    var fg = AR.Gfx.fg[this.keyOf(stage)];
    if (AR.Gfx._imgOk(fg)) this.pan(ctx, fg, this.cam, 0.96, 0, AR.H, 1);
    for (var i = 0; i < this.debris.length; i++) {
      var d = this.debris[i];
      ctx.save();
      ctx.globalAlpha = Math.min(1, d.life);
      ctx.translate(d.x, d.y);
      ctx.rotate(d.rot);
      ctx.fillStyle = "#6a5848";
      ctx.fillRect(-d.w / 2, -d.h / 2, d.w, d.h);
      ctx.restore();
    }
  },
  pan: function (ctx, img, cam, k, y, h, a) {
    if (!img || !img.naturalWidth) return;
    var destH = h;
    var destW = destH * (img.naturalWidth / img.naturalHeight);
    if (destW < AR.W * 1.12) destW = AR.W * 1.12;
    var period = destW * 2;
    var x = -((cam * k) % period);
    if (x > 0) x -= period;
    ctx.save();
    ctx.globalAlpha = a == null ? 1 : a;
    while (x < AR.W + destW) {
      ctx.drawImage(img, x, y, destW + 0.5, destH);
      ctx.save();
      ctx.translate(x + destW * 2, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, y, destW + 0.5, destH);
      ctx.restore();
      x += period;
    }
    ctx.restore();
  },
  atmosphere: function (ctx, stage, t, cam) {
    var shafts = [
      ["rgba(255,140,50,0.07)", 0.35],
      ["rgba(40,180,255,0.08)", 0.2],
      ["rgba(255,90,40,0.08)", 0.4],
      ["rgba(255,40,180,0.07)", 0.25],
      ["rgba(255,50,70,0.08)", 0.15],
      ["rgba(255,40,60,0.1)", 0.45]
    ][stage] || ["rgba(255,140,50,0.07)", 0.3];
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (var i = 0; i < 7; i++) {
      var x = ((i * 310 - cam * shafts[1]) % (AR.W + 200)) - 40;
      ctx.fillStyle = shafts[0];
      ctx.beginPath();
      ctx.moveTo(x, -20);
      ctx.lineTo(x + 40 + i * 8, -20);
      ctx.lineTo(x + 120 + i * 12, AR.H + 20);
      ctx.lineTo(x + 30, AR.H + 20);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    var g = ctx.createLinearGradient(0, 0, 0, AR.H);
    g.addColorStop(0, "rgba(0,0,0,0.28)");
    g.addColorStop(0.45, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,0.38)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, AR.W, AR.H);
    ctx.fillStyle = "rgba(220,200,160,0.35)";
    for (var d = 0; d < 28; d++) {
      var dx = (d * 211 - cam * (0.5 + (d % 3) * 0.3)) % AR.W;
      if (dx < 0) dx += AR.W;
      var dy = (d * 137 + Math.sin(t * 0.7 + d) * 30) % AR.H;
      ctx.globalAlpha = 0.15 + (d % 5) * 0.05;
      ctx.fillRect(dx, dy, 2, 2);
    }
    ctx.globalAlpha = 1;
  },
  _sky: function (ctx, c1, c2) {
    var g = ctx.createLinearGradient(0, 0, 0, AR.H);
    g.addColorStop(0, c1); g.addColorStop(1, c2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, AR.W, AR.H);
  },
  _stars: function (ctx, cam, n, col) {
    ctx.fillStyle = col || "rgba(180,220,255,0.45)";
    for (var i = 0; i < n; i++) {
      var x = (i * 137 + 90 - cam * 0.04) % AR.W;
      if (x < 0) x += AR.W;
      var y = (i * 89) % 520;
      ctx.fillRect(x, 40 + y * 0.35, i % 5 === 0 ? 2 : 1, i % 5 === 0 ? 2 : 1);
    }
  },
  _fog: function (ctx, y, h, col) {
    var g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(0.5, col);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, y, AR.W, h);
  },
  _building: function (ctx, x, y, w, h, body, win, seed) {
    ctx.fillStyle = body;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(x + w - 8, y, 8, h);
    ctx.fillStyle = win;
    var gy = 14 + (seed % 7);
    var gx = 10 + (seed % 5);
    for (var wy = y + 12; wy < y + h - 20; wy += gy) {
      for (var wx = x + 8; wx < x + w - 10; wx += gx) {
        if (((wx + wy + seed) % 5) !== 0) ctx.fillRect(wx, wy, 5, 7);
      }
    }
    ctx.fillStyle = "rgba(255,180,80,0.35)";
    ctx.fillRect(x + 6, y + 4, w - 12, 3);
  },
  _layer: function (ctx, cam, k, span, drawItem) {
    var off = -((cam * k) % span);
    for (var i = -1; i < Math.ceil(AR.W / span) + 2; i++) drawItem(ctx, off + i * span, i);
  },
  steel: function (ctx, cam, t) {
    this._sky(ctx, "#071018", "#1c100c");
    this._stars(ctx, cam, 70, "rgba(255,210,160,0.35)");
    AR.Gfx.glow(ctx, 1480, 180, 280, "rgba(255,120,40,0.18)", 0.7);
    ctx.fillStyle = "#121c28";
    this._layer(ctx, cam, 0.12, 220, function (c, x, i) {
      var h = 140 + (i % 6) * 36;
      c.fillRect(x + 20, 120, 28, h);
      c.fillRect(x + 70, 90, 18, h + 40);
      c.fillRect(x + 110, 150, 40, h - 20);
    });
    ctx.fillStyle = "#1b2836";
    this._layer(ctx, cam, 0.22, 280, function (c, x, i) {
      AR.Background._building(c, x + 10, 260 + (i % 3) * 30, 70, 420, "#1b2836", "#c88840", i * 3);
      AR.Background._building(c, x + 100, 200, 44, 520, "#15202c", "#ffb060", i * 7);
    });
    var railY = 430 + Math.sin(t * 0.4) * 6;
    ctx.fillStyle = "#2a3848";
    ctx.fillRect(0, railY, AR.W, 10);
    ctx.fillStyle = "rgba(60,240,255,0.35)";
    ctx.fillRect(0, railY + 3, AR.W, 3);
    var train = AR.W - ((cam * 0.62) % (AR.W + 520));
    ctx.fillStyle = "#3a4a5c";
    ctx.fillRect(train, railY - 18, 240, 18);
    ctx.fillStyle = "#3cf0ff";
    ctx.globalAlpha = 0.7;
    ctx.fillRect(train + 8, railY - 12, 220, 4);
    ctx.globalAlpha = 1;
    AR.Gfx.glow(ctx, train + 20, railY - 8, 30, "rgba(80,230,255,0.6)", 0.5);
    this._layer(ctx, cam, 0.48, 320, function (c, x, i) {
      AR.Background._building(c, x, 480, 110, 600, "#243240", "#ffcc77", i * 11);
      AR.Background._building(c, x + 130, 560, 70, 520, "#1e2a36", "#88aacc", i * 13);
    });
    ctx.fillStyle = "#141c24";
    this._layer(ctx, cam, 0.78, 260, function (c, x, i) {
      c.fillRect(x, 820, 150, 280);
      c.fillStyle = "#ff6a2a";
      c.globalAlpha = 0.45;
      c.fillRect(x + 18, 860, 6, 70);
      c.fillRect(x + 40, 900, 6, 50);
      c.globalAlpha = 1;
      c.fillStyle = "#141c24";
      c.fillRect(x + 170, 900, 60, 200);
    });
    this._fog(ctx, 640, 200, "rgba(40,20,10,0.28)");
    ctx.fillStyle = "rgba(255,90,30,0.05)";
    ctx.fillRect(0, 0, AR.W, AR.H);
  },
  ocean: function (ctx, cam, t) {
    this._sky(ctx, "#021018", "#044056");
    this._stars(ctx, cam, 40, "rgba(120,220,255,0.3)");
    ctx.save();
    ctx.globalAlpha = 0.4;
    for (var i = 0; i < 10; i++) {
      ctx.strokeStyle = "rgba(80,220,255,0.22)";
      ctx.beginPath();
      var y = 140 + i * 86 + Math.sin(t * 0.6 + i) * 14;
      ctx.moveTo(0, y);
      for (var x = 0; x < AR.W; x += 36) ctx.lineTo(x, y + Math.sin(x * 0.01 + t + i) * 18);
      ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = "#0a3040";
    this._layer(ctx, cam, 0.2, 360, function (c, x, i) {
      c.fillRect(x + 40, 220, 36, 800);
      c.fillRect(x + 140, 360, 80, 700);
      c.fillStyle = "rgba(60,255,220,0.15)";
      c.fillRect(x + 48, 280, 8, 400);
      c.fillStyle = "#0a3040";
    });
    ctx.strokeStyle = "rgba(60,255,220,0.4)";
    ctx.lineWidth = 3;
    this._layer(ctx, cam, 0.48, 400, function (c, x) {
      c.beginPath(); c.arc(x + 90, 520, 78, 0, 6.28); c.stroke();
      c.strokeRect(x + 180, 460, 100, 100);
      c.beginPath(); c.arc(x + 230, 780, 40, 0, 6.28); c.stroke();
    });
    var caust = ctx.createLinearGradient(0, 0, 0, AR.H);
    caust.addColorStop(0, "rgba(0,0,0,0.2)");
    caust.addColorStop(1, "rgba(0,50,70,0.55)");
    ctx.fillStyle = caust; ctx.fillRect(0, 0, AR.W, AR.H);
    AR.Gfx.glow(ctx, 420 + Math.sin(t) * 80, 220, 220, "rgba(40,180,255,0.28)", 0.55);
  },
  red: function (ctx, cam, t) {
    this._sky(ctx, "#2a120c", "#7a3014");
    AR.Gfx.glow(ctx, 1500, 160, 340, "rgba(255,90,30,0.25)", 0.7);
    ctx.fillStyle = "#3a1a10";
    this._layer(ctx, cam, 0.12, 260, function (c, x, i) {
      c.beginPath();
      c.moveTo(x, 640);
      c.lineTo(x + 90, 300 + (i % 3) * 50);
      c.lineTo(x + 200, 660);
      c.fill();
    });
    ctx.fillStyle = "#5a2818";
    this._layer(ctx, cam, 0.3, 300, function (c, x, i) {
      c.fillRect(x + 30, 500, 130, 280);
      c.fillStyle = "#2a0c08";
      c.beginPath(); c.moveTo(x + 30, 500); c.lineTo(x + 95, 390); c.lineTo(x + 160, 500); c.fill();
      c.fillStyle = "#7a4030";
      for (var wy = 530; wy < 740; wy += 22) c.fillRect(x + 48, wy, 10, 8);
      c.fillStyle = "#5a2818";
    });
    ctx.fillStyle = "rgba(180,90,40,0.16)";
    ctx.fillRect(0, 0, AR.W, AR.H);
    for (var d = 0; d < 55; d++) {
      var dx = ((d * 173 + cam * 0.95) % (AR.W + 40));
      var dy = (d * 97 + Math.sin(t + d) * 8) % AR.H;
      ctx.fillStyle = "rgba(220,160,80,0.28)";
      ctx.fillRect(AR.W - dx, dy, 3, 12);
    }
    ctx.fillStyle = "#1a0806";
    ctx.fillRect(0, 960, AR.W, 120);
  },
  neon: function (ctx, cam, t) {
    this._sky(ctx, "#05010a", "#1a0828");
    this._stars(ctx, cam, 90, "rgba(255,80,200,0.35)");
    this._layer(ctx, cam, 0.16, 180, function (c, x, i) {
      var h = 380 + (i % 7) * 80;
      c.fillStyle = "#0a0614";
      c.fillRect(x, AR.H - h, 64, h);
      c.fillStyle = i % 2 ? "#ff3d8a" : "#3cf0ff";
      c.globalAlpha = 0.55 + Math.sin(t * 4 + i) * 0.25;
      c.fillRect(x + 8, AR.H - h + 20, 10, h - 50);
      c.fillRect(x + 36, AR.H - h + 70, 16, 70);
      c.globalAlpha = 1;
    });
    this._layer(ctx, cam, 0.4, 260, function (c, x, i) {
      c.fillStyle = "#12081c";
      c.fillRect(x + 8, 160, 120, 920);
      c.fillStyle = "rgba(255,60,160,0.45)";
      c.fillRect(x + 18, 220, 100, 28);
      c.fillStyle = "rgba(60,240,255,0.35)";
      c.fillRect(x + 18, 380, 100, 56);
      c.fillStyle = "rgba(255,220,80,0.25)";
      c.fillRect(x + 18, 620, 100, 18);
    });
    for (var r = 0; r < 90; r++) {
      var rx = (r * 47 + cam * 2.4) % (AR.W + 20);
      var ry = (r * 31) % AR.H;
      ctx.strokeStyle = "rgba(160,200,255,0.2)";
      ctx.beginPath(); ctx.moveTo(AR.W - rx, ry); ctx.lineTo(AR.W - rx - 14, ry + 20); ctx.stroke();
    }
    var car = ((cam * 0.85) % (AR.W + 240));
    AR.Gfx.glow(ctx, AR.W - car, 300, 36, "rgba(255,80,180,0.7)", 0.65);
    AR.Gfx.glow(ctx, AR.W - car + 380, 520, 28, "rgba(80,220,255,0.55)", 0.55);
  },
  bio: function (ctx, cam, t) {
    this._sky(ctx, "#10080c", "#221014");
    ctx.strokeStyle = "rgba(180,60,80,0.5)";
    ctx.lineWidth = 20;
    this._layer(ctx, cam, 0.2, 300, function (c, x, i) {
      c.beginPath();
      c.moveTo(x, 70 + Math.sin(i + t) * 36);
      c.bezierCurveTo(x + 80, 300, x + 40, 700, x + 130, 1080);
      c.stroke();
    });
    ctx.fillStyle = "#2a1818";
    this._layer(ctx, cam, 0.38, 340, function (c, x, i) {
      var pulse = 10 + Math.sin(t * 2 + i) * 12;
      var cy = 200 + (i % 3) * 220;
      c.beginPath();
      c.ellipse(x + 80, cy, 56 + pulse, 76 + pulse * 0.5, 0, 0, 6.28);
      c.fill();
      c.fillStyle = "rgba(255,80,100,0.28)";
      c.beginPath();
      c.ellipse(x + 80, cy, 22, 26, 0, 0, 6.28);
      c.fill();
      c.fillStyle = "#2a1818";
    });
    ctx.fillStyle = "rgba(80,20,30,0.28)";
    ctx.fillRect(0, 0, 90 + Math.sin(t) * 22, AR.H);
    ctx.fillRect(AR.W - 100 - Math.sin(t * 1.3) * 26, 0, 140, AR.H);
    AR.Gfx.glow(ctx, 960, 540, 280, "rgba(255,40,70,0.14)", 0.55);
  },
  core: function (ctx, cam, t) {
    this._sky(ctx, "#08040a", "#220810");
    ctx.fillStyle = "#1c141c";
    this._layer(ctx, cam, 0.18, 220, function (c, x) {
      c.fillRect(x, 100, 36, 900);
      c.fillRect(x + 80, 60, 20, 980);
    });
    var pulse = 0.4 + Math.sin(t * 6) * 0.22;
    ctx.fillStyle = "rgba(255,40,60," + pulse * 0.16 + ")";
    ctx.fillRect(0, 0, AR.W, AR.H);
    this._layer(ctx, cam, 0.48, 280, function (c, x, i) {
      c.strokeStyle = "rgba(255,80,80,0.45)";
      c.lineWidth = 2;
      c.strokeRect(x + 24, 220, 150, 150);
      c.fillStyle = i % 2 ? "rgba(255,60,80,0.4)" : "rgba(80,200,255,0.28)";
      c.fillRect(x + 34, 232, 130, 14);
      c.strokeRect(x + 40, 520, 110, 80);
    });
    AR.Gfx.glow(ctx, 1580, 380, 220, "rgba(255,60,80,0.28)", 0.65);
    AR.Gfx.glow(ctx, 1380, 700, 160, "rgba(80,180,255,0.22)", 0.55);
    ctx.fillStyle = "#0a0608";
    ctx.fillRect(0, 0, AR.W, 42);
    ctx.fillRect(0, AR.H - 42, AR.W, 42);
  }
};
