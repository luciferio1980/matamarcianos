/* AETHER RAZE — six original multi-phase bosses */
AR.Boss = function (id, g) {
  this.id = id;
  this.g = g;
  this.alive = true;
  this.intro = 2.4;
  this.deadT = 0;
  this.dying = false;
  this.t = 0;
  this.phase = 1;
  this.flash = 0;
  this.parts = [];
  this.x = AR.W + 200;
  this.y = AR.H * 0.5;
  this.tx = AR.W - 340;
  this.ty = AR.H * 0.5;
  this.fire = 0;
  this.pat = 0;
  this.patT = 0;
  this.special = null;
  this.specCd = 1.6;
  this.destT = 0;
  var hp = [780, 960, 1180, 1320, 1500, 2100][id] * g.diff.hp;
  this.hp = this.max = hp;
  this.name = AR.STAGES[id].boss;
  this.title = AR.STAGES[id].bossTitle;
  this._setupParts(id);
};

AR.Boss.prototype._setupParts = function (id) {
  var self = this;
  this.wreck = [];
  function part(name, ox, oy, r, hp, score, kind) {
    self.parts.push({
      name: name, ox: ox, oy: oy, r: r, hp: Math.round(hp * 1.55), max: Math.round(hp * 1.55), alive: true,
      score: score || 1500, flash: 0, kind: kind || "armor"
    });
  }
  if (id === 0) {
    part("cañón sup", -90, -100, 32, 110, 2200, "gun");
    part("cañón inf", -90, 100, 32, 110, 2200, "gun");
    part("ala sup", 20, -130, 40, 100, 1800, "armor");
    part("ala inf", 20, 130, 40, 100, 1800, "armor");
    part("motor", -130, 0, 36, 120, 2000, "engine");
    part("morro", 90, 0, 34, 90, 1600, "armor");
    part("núcleo", -10, 0, 44, 9999, 0, "core");
  } else if (id === 1) {
    part("ojo", 50, -16, 34, 9999, 0, "core");
    part("aleta sup", -50, -95, 38, 100, 1800, "armor");
    part("aleta inf", -50, 95, 38, 100, 1800, "armor");
    part("cabeza", 80, -40, 30, 90, 1500, "armor");
    part("cola", -130, 10, 36, 110, 1700, "engine");
    part("branquia", -20, 70, 28, 80, 1400, "armor");
  } else if (id === 2) {
    part("corona", 10, -120, 38, 130, 2200, "armor");
    part("brazo", -100, 80, 36, 120, 1800, "gun");
    part("hombrera", 40, -70, 34, 100, 1600, "armor");
    part("escudo", -70, -40, 36, 110, 1700, "armor");
    part("pierna", -40, 120, 34, 90, 1500, "armor");
    part("núcleo", -10, 10, 44, 9999, 0, "core");
  } else if (id === 3) {
    part("puente", 60, -50, 36, 140, 2500, "armor");
    part("motor", -120, 50, 40, 130, 2000, "engine");
    part("torreta", -40, -90, 30, 90, 1600, "gun");
    part("ala", 20, 90, 38, 110, 1800, "armor");
    part("proa", 110, 10, 32, 90, 1500, "armor");
    part("batería", -20, 70, 32, 100, 1600, "armor");
    part("núcleo", 0, 0, 42, 9999, 0, "core");
  } else if (id === 4) {
    part("tentáculo", -130, -140, 28, 85, 1400, "armor");
    part("tentáculo", -100, 150, 28, 85, 1400, "armor");
    part("tentáculo", 50, -170, 28, 85, 1400, "armor");
    part("caparazón", -40, -80, 36, 110, 1800, "armor");
    part("mandíbula", 70, 40, 32, 90, 1500, "gun");
    part("corazón", 10, 10, 48, 9999, 0, "core");
  } else {
    part("ala izq", -30, -150, 40, 140, 2400, "armor");
    part("ala der", -30, 150, 40, 140, 2400, "armor");
    part("máscara", 40, -30, 38, 160, 3000, "armor");
    part("cañón", -90, 0, 34, 120, 2000, "gun");
    part("motor", -140, 80, 32, 100, 1800, "engine");
    part("corona", 20, -110, 30, 90, 1600, "armor");
    part("núcleo", 0, 20, 50, 9999, 0, "core");
  }
};

AR.Boss.prototype.partAlive = function (name) {
  for (var i = 0; i < this.parts.length; i++) {
    if (this.parts[i].name.indexOf(name) === 0 && this.parts[i].alive && this.parts[i].kind !== "core") return true;
  }
  return false;
};

AR.Boss.prototype.stripPart = function (p) {
  if (!p.alive || p.kind === "core") return;
  p.alive = false;
  p.hp = 0;
  this.g.addScore(p.score, true);
  AR.Particles.explode(this.px(p), this.py(p), true);
  AR.Audio.sfx("explodeBig", this.x);
  AR.FX.boom(10);
  this.hp -= this.max * 0.07;
  var n = 8 + ((p.r / 7) | 0);
  var cols = ["#5a4a40", "#8a7060", "#3a322c", "#6a5850", "#2a221c"];
  for (var i = 0; i < n; i++) {
    this.wreck.push({
      x: this.px(p), y: this.py(p),
      vx: AR.rand(-280, 60), vy: AR.rand(-220, 220),
      rot: Math.random() * 6, vr: AR.rand(-6, 6),
      w: AR.rand(14, 46), h: AR.rand(8, 28),
      life: AR.rand(1.4, 3.2), col: cols[i % cols.length],
      kind: i % 3
    });
  }
};

AR.Boss.prototype.px = function (p) { return this.x + p.ox; };
AR.Boss.prototype.py = function (p) { return this.y + p.oy; };

AR.Boss.prototype.hurt = function (dmg, x, y) {
  if (this.intro > 0 || this.dying) return;
  dmg *= 0.38;
  var hitPart = null, best = 90;
  for (var i = 0; i < this.parts.length; i++) {
    var p = this.parts[i];
    if (!p.alive) continue;
    var d = AR.len(this.px(p) - x, this.py(p) - y);
    if (d < p.r + 20 && d < best) { best = d; hitPart = p; }
  }
  if (hitPart && hitPart.kind !== "core") {
    hitPart.hp -= dmg;
    hitPart.flash = 1;
    if (hitPart.hp <= 0) this.stripPart(hitPart);
    dmg *= 0.4;
  }
  this.hp -= dmg;
  this.flash = 1;
  this.g.addScore(Math.round(dmg * 2), false);
  var pct = this.hp / this.max;
  var np = pct > 0.66 ? 1 : pct > 0.33 ? 2 : 3;
  if (this.id === 5) np = pct > 0.7 ? 1 : pct > 0.4 ? 2 : pct > 0.15 ? 3 : 4;
  if (np !== this.phase) {
    this.phase = np;
    AR.Audio.sfx("warn");
    AR.FX.white(0.2);
  }
  if (this.hp <= 0) this.startDeath();
};

AR.Boss.prototype.hitBullet = function (b) {
  if (this.intro > 0 || this.dying) return false;
  for (var i = 0; i < this.parts.length; i++) {
    var p = this.parts[i];
    if (!p.alive) continue;
    if (AR.circleHit(b.x, b.y, b.r, this.px(p), this.py(p), p.r)) {
      this.hurt(b.dmg, b.x, b.y);
      AR.Particles.spark(b.x, b.y, "#fff");
      return true;
    }
  }
  if (AR.circleHit(b.x, b.y, b.r + 8, this.x, this.y, this.bodyR())) {
    this.hurt(b.dmg * 0.35, b.x, b.y);
    AR.Particles.spark(b.x, b.y, "#ffaa88");
    return true;
  }
  return false;
};

AR.Boss.prototype.laserHit = function (x, y0, y1, dmg) {
  if (this.intro > 0 || this.dying) return;
  if (this.x > x && this.y > y0 - 40 && this.y < y1 + 40) this.hurt(dmg * 0.45, this.x - 40, this.y);
};

AR.Boss.prototype.bodyR = function () {
  return [110, 120, 130, 150, 140, 160][this.id];
};

AR.Boss.prototype.startDeath = function () {
  if (this.dying) return;
  this.dying = true;
  this.deadT = 0;
  this.g.combat.eBullets.clear();
  AR.Audio.sfx("explodeBig", this.x);
  AR.FX.boom(20); AR.FX.white(0.7);
};

AR.Boss.prototype.update = function (dt) {
  this.t += dt;
  this.flash = Math.max(0, this.flash - dt * 5);
  for (var i = 0; i < this.parts.length; i++) this.parts[i].flash = Math.max(0, this.parts[i].flash - dt * 5);
  for (var w = this.wreck.length - 1; w >= 0; w--) {
    var fr = this.wreck[w];
    fr.x += fr.vx * dt; fr.y += fr.vy * dt;
    fr.vy += 90 * dt; fr.rot += fr.vr * dt; fr.life -= dt;
    if (fr.life <= 0) this.wreck.splice(w, 1);
  }
  if (!this.dying && !this.intro) {
    for (var d = 0; d < this.parts.length; d++) {
      var dp = this.parts[d];
      if (!dp.alive && Math.random() < dt * 6) AR.Particles.spark(this.px(dp), this.py(dp), "#ff6622");
      if (dp.alive && dp.kind === "engine" && Math.random() < dt * 8) {
        AR.Particles.smoke(this.px(dp) - 18, this.py(dp));
      }
    }
  }
  if (this.dying) {
    this.deadT += dt;
    if ((this.deadT * 4.5 | 0) !== ((this.deadT - dt) * 4.5 | 0)) {
      for (var j = 0; j < this.parts.length; j++) {
        if (this.parts[j].alive && this.parts[j].kind !== "core") {
          this.stripPart(this.parts[j]);
          break;
        }
      }
    }
    if ((this.deadT * 10 | 0) !== ((this.deadT - dt) * 10 | 0)) {
      AR.Particles.explode(this.x + AR.rand(-90, 90), this.y + AR.rand(-90, 90), true);
      AR.Audio.sfx("explode", this.x);
      AR.FX.boom(6);
    }
    if (this.deadT > 4.2) {
      this.alive = false;
      this.g.onBossDead();
    }
    return;
  }
  if (this.intro > 0) {
    this.intro -= dt;
    this.x = AR.lerp(this.x, this.tx, 1 - Math.pow(0.02, dt));
    this.y = AR.lerp(this.y, this.ty, 1 - Math.pow(0.04, dt));
    return;
  }
  this["ai" + this.id](dt);
  this.tickSpecial(dt);
  var p = this.g.combat.player;
  if (!p.dead && p.inv <= 0 && AR.circleHit(p.x, p.y, 6, this.x, this.y, this.bodyR() * 0.55)) {
    this.g.combat.hurtPlayer(this.x, this.y);
  }
};

AR.Boss.prototype.roam = function (dt, xmin, xmax, ymin, ymax) {
  xmin = xmin == null ? AR.W * 0.36 : xmin;
  xmax = xmax == null ? AR.W - 150 : xmax;
  ymin = ymin == null ? 150 : ymin;
  ymax = ymax == null ? AR.H - 150 : ymax;
  this.destT -= dt;
  if (this.destT <= 0 || AR.len(this.x - this.tx, this.y - this.ty) < 28) {
    var nx, ny, tries = 0;
    do {
      nx = AR.rand(xmin, xmax);
      ny = AR.rand(ymin, ymax);
      tries++;
    } while (tries < 8 && AR.len(nx - this.x, ny - this.y) < 220);
    this.tx = nx;
    this.ty = ny;
    this.destT = AR.rand(1.15, 2.5);
  }
  var sp = this.special ? 210 : 420;
  var dx = this.tx - this.x, dy = this.ty - this.y;
  var d = AR.len(dx, dy) || 1;
  var step = Math.min(d, sp * dt);
  this.x += dx / d * step;
  this.y += dy / d * step;
};

AR.Boss.prototype.tickSpecial = function (dt) {
  if (this.dying || this.intro > 0) return;
  if (this.special) {
    this.updateSpecial(dt);
    return;
  }
  this.specCd -= dt;
  if (this.specCd <= 0) {
    var pool = [
      ["fire"],
      ["lightning"],
      ["fire"],
      ["laser"],
      ["lightning"],
      ["laser", "lightning", "fire"]
    ][this.id] || ["fire"];
    this.startSpecial(pool[(Math.random() * pool.length) | 0]);
    this.specCd = this.phase >= 3 ? 2.8 : 4.0;
  }
};

AR.Boss.prototype.startSpecial = function (kind) {
  var p = this.g.combat.player;
  var s = { kind: kind, t: 0, wind: 0.55, dur: 1.35, hit: 0 };
  if (kind === "fire") {
    s.wind = 0.5; s.dur = 1.45;
    s.ang = Math.atan2(p.y - this.y, p.x - this.x);
    s.spread = 0.38; s.len = 780; s.vang = (p.y > this.y ? 1 : -1) * 0.85;
    AR.FX.color("255,90,20", 0.35);
    AR.Audio.sfx("warn", this.x);
  } else if (kind === "lightning") {
    s.wind = 0.42; s.dur = 1.05;
    s.aims = [
      { x: p.x, y: p.y },
      { x: AR.rand(80, AR.W * 0.55), y: AR.rand(80, AR.H - 80) },
      { x: AR.rand(80, AR.W * 0.55), y: AR.rand(80, AR.H - 80) },
      { x: p.x, y: AR.clamp(p.y + AR.rand(-220, 220), 60, AR.H - 60) }
    ];
    AR.FX.color("180,220,255", 0.3);
    AR.Audio.sfx("warn", this.x);
  } else {
    s.wind = 0.7; s.dur = 1.25;
    s.beams = [
      { y: p.y, vy: AR.rand(-40, 40) },
      { y: AR.clamp(p.y + (p.y > 540 ? -240 : 240), 80, AR.H - 80), vy: AR.rand(-30, 30) }
    ];
    if (this.phase >= 3) s.beams.push({ y: AR.rand(120, AR.H - 120), vy: 0 });
    s.w = 26 + this.phase * 4;
    AR.FX.color("255,60,200", 0.32);
    AR.Audio.sfx("charge", this.x);
  }
  this.special = s;
  AR.FX.boom(10);
};

AR.Boss.prototype.updateSpecial = function (dt) {
  var s = this.special, p = this.g.combat.player, c = this.g.combat;
  if (!s) return;
  var prev = s.t;
  s.t += dt;
  if (prev < s.wind && s.t >= s.wind) {
    AR.FX.boom(22);
    AR.FX.white(0.55);
    AR.Input.rumble(220, 1);
    if (s.kind === "fire") {
      AR.FX.color("255,70,10", 0.85);
      AR.Audio.sfx("flame", this.x);
      AR.Particles.burst(this.x - 40, this.y, 40, "#ff6622", 380, 8);
    } else if (s.kind === "lightning") {
      AR.FX.color("210,240,255", 0.95);
      AR.Audio.sfx("thunder", this.x);
      AR.Particles.burst(this.x, this.y, 36, "#cceeff", 420, 5);
    } else {
      AR.FX.color("255,80,220", 0.8);
      AR.Audio.sfx("beam", this.x);
    }
  }
  if (s.t >= s.dur) { this.special = null; return; }
  var live = s.t >= s.wind && !p.dead && p.inv <= 0;

  if (s.kind === "fire") {
    s.ang += s.vang * dt;
    var ang = Math.atan2(p.y - this.y, p.x - this.x);
    var dlt = ang - s.ang;
    while (dlt > Math.PI) dlt -= 6.283;
    while (dlt < -Math.PI) dlt += 6.283;
    var dist = AR.len(p.x - this.x, p.y - this.y);
    if (live && Math.abs(dlt) < s.spread && dist < s.len && dist > 30) c.hurtPlayer(p.x, p.y);
    if (s.t >= s.wind && Math.random() < dt * 28) {
      var fd = AR.rand(80, 560);
      AR.Particles.spark(this.x + Math.cos(s.ang) * fd, this.y + Math.sin(s.ang) * fd, "#ffaa44");
    }
  } else if (s.kind === "lightning") {
    if (s.t >= s.wind && (s.t * 10 | 0) !== (prev * 10 | 0)) AR.FX.color("200,230,255", 0.42);
    if (live) {
      for (var i = 0; i < s.aims.length; i++) {
        var a = s.aims[i];
        if (this.distSeg(p.x, p.y, this.x - 40, this.y, a.x, a.y) < 22) c.hurtPlayer(p.x, p.y);
      }
    }
  } else {
    for (var b = 0; b < s.beams.length; b++) {
      s.beams[b].y += s.beams[b].vy * dt;
      if (live && p.x < this.x + 40 && Math.abs(p.y - s.beams[b].y) < s.w * 0.55) c.hurtPlayer(p.x, p.y);
    }
  }
};

AR.Boss.prototype.distSeg = function (px, py, x0, y0, x1, y1) {
  var dx = x1 - x0, dy = y1 - y0, l2 = dx * dx + dy * dy;
  var t = l2 ? AR.clamp(((px - x0) * dx + (py - y0) * dy) / l2, 0, 1) : 0;
  return AR.len(px - (x0 + t * dx), py - (y0 + t * dy));
};

AR.Boss.prototype.drawSpecial = function (ctx) {
  var s = this.special;
  if (!s) return;
  var wind = s.t < s.wind;
  var u = wind ? s.t / s.wind : 1;
  var burst = wind ? 0 : Math.max(0, 1 - (s.t - s.wind) * 2.2);
  ctx.save();
  if (s.kind === "fire") {
    var heat = ctx.createRadialGradient(this.x, this.y, 20, this.x, this.y, 980);
    heat.addColorStop(0, wind ? "rgba(255,120,20," + (0.12 * u) + ")" : "rgba(255,90,10," + (0.22 + burst * 0.35) + ")");
    heat.addColorStop(1, "rgba(255,40,0,0)");
    ctx.fillStyle = heat;
    ctx.fillRect(0, 0, AR.W, AR.H);
    var len = (wind ? 220 * u : s.len);
    ctx.globalCompositeOperation = "lighter";
    ctx.translate(this.x, this.y);
    ctx.rotate(s.ang);
    var grd = ctx.createLinearGradient(0, 0, len, 0);
    grd.addColorStop(0, wind ? "rgba(255,180,40,0.35)" : "rgba(255,240,180,0.9)");
    grd.addColorStop(0.35, wind ? "rgba(255,80,10,0.15)" : "rgba(255,90,10,0.65)");
    grd.addColorStop(1, "rgba(255,40,0,0)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(len, -len * s.spread);
    ctx.lineTo(len, len * s.spread);
    ctx.closePath();
    ctx.fill();
    if (!wind) {
      for (var i = 0; i < 10; i++) {
        ctx.fillStyle = i % 2 ? "rgba(255,200,60,0.45)" : "rgba(255,80,20,0.35)";
        ctx.beginPath();
        ctx.ellipse(80 + i * 70 + Math.random() * 20, (Math.random() - 0.5) * i * 28, 40 + i * 6, 18 + i * 3, 0, 0, 6.28);
        ctx.fill();
      }
    }
  } else if (s.kind === "lightning") {
    ctx.fillStyle = "rgba(8,16,40," + (wind ? 0.28 * u : 0.18 + burst * 0.22) + ")";
    ctx.fillRect(0, 0, AR.W, AR.H);
    if (!wind && ((s.t * 18) & 1)) {
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = "rgba(210,235,255," + (0.18 + burst * 0.45) + ")";
      ctx.fillRect(0, 0, AR.W, AR.H);
    }
    if (wind) {
      ctx.strokeStyle = "rgba(180,220,255," + (0.25 + u * 0.4) + ")";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 12]);
      for (var j = 0; j < s.aims.length; j++) {
        ctx.beginPath(); ctx.moveTo(this.x - 40, this.y); ctx.lineTo(s.aims[j].x, s.aims[j].y); ctx.stroke();
      }
      ctx.setLineDash([]);
    } else {
      ctx.globalCompositeOperation = "lighter";
      for (var k = 0; k < s.aims.length; k++) {
        this.drawBolt(ctx, this.x - 40, this.y, s.aims[k].x, s.aims[k].y);
      }
    }
  } else {
    if (!wind) {
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = "rgba(255,40,200," + (0.1 + burst * 0.28) + ")";
      ctx.fillRect(0, 0, AR.W, AR.H);
    }
    for (var n = 0; n < s.beams.length; n++) {
      var by = s.beams[n].y, hw = s.w;
      if (wind) {
        ctx.strokeStyle = "rgba(255,80,220," + (0.25 + u * 0.5) + ")";
        ctx.lineWidth = 3;
        ctx.setLineDash([14, 10]);
        ctx.beginPath(); ctx.moveTo(0, by); ctx.lineTo(this.x, by); ctx.stroke();
        ctx.setLineDash([]);
      } else {
        ctx.globalCompositeOperation = "lighter";
        var lg = ctx.createLinearGradient(0, by, this.x, by);
        lg.addColorStop(0, "rgba(255,255,255,0)");
        lg.addColorStop(0.2, "rgba(255,120,240,0.85)");
        lg.addColorStop(1, "rgba(255,255,255,0.95)");
        ctx.fillStyle = lg;
        ctx.fillRect(0, by - hw * 0.5, this.x, hw);
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, by - 4, this.x, 8);
        AR.Gfx.glow(ctx, this.x - 20, by, 50, "rgba(255,80,220,0.9)", 0.8);
        AR.Gfx.glow(ctx, 80, by, 90, "rgba(255,180,255,0.55)", 0.7);
      }
    }
  }
  ctx.restore();
};

AR.Boss.prototype.drawBolt = function (ctx, x0, y0, x1, y1) {
  var segs = 10, i, u, x, y;
  ctx.strokeStyle = "rgba(160,210,255,0.55)";
  ctx.lineWidth = 10;
  ctx.beginPath(); ctx.moveTo(x0, y0);
  var pts = [[x0, y0]];
  for (i = 1; i < segs; i++) {
    u = i / segs;
    x = x0 + (x1 - x0) * u + (Math.random() - 0.5) * 48;
    y = y0 + (y1 - y0) * u + (Math.random() - 0.5) * 48;
    pts.push([x, y]);
    ctx.lineTo(x, y);
  }
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x0, y0);
  for (i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  var mid = pts[4] || pts[pts.length >> 1];
  ctx.strokeStyle = "rgba(200,230,255,0.7)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(mid[0], mid[1]);
  ctx.lineTo(mid[0] + (Math.random() - 0.5) * 160, mid[1] + (Math.random() - 0.5) * 140);
  ctx.stroke();
};

AR.Boss.prototype.ai0 = function (dt) {
  var c = this.g.combat, p = c.player;
  this.roam(dt, AR.W * 0.4, AR.W - 140, 160, AR.H - 160);
  if (this.special) return;
  this.patT += dt;
  if (this.phase >= 2 && this.patT > 3.5) {
    this.patT = 0;
    AR.Background.smash(this.x - 200, AR.rand(120, 900));
    AR.FX.boom(10);
  }
  this.fire += dt;
  var rate = this.phase === 1 ? 0.95 : this.phase === 2 ? 0.7 : 0.55;
  if (this.fire > rate) {
    this.fire = 0;
    this.pat = (this.pat + 1) % 3;
    if (this.pat === 0 && this.partAlive("cañón")) c.fanShot(this.x - 90, this.y, p.x, p.y, 4, 0.12, 300, "#ff6644");
    else if (this.pat === 1) c.aimedShot(this.x - 40, this.y, p.x, p.y, 380, 7, "#ff3366");
    else c.ringShot(this.x - 20, this.y, 7, 200, "#ff8866", this.t);
  }
};

AR.Boss.prototype.ai1 = function (dt) {
  var c = this.g.combat, p = c.player;
  this.roam(dt, AR.W * 0.32, AR.W - 160, 140, AR.H - 140);
  if (this.special) return;
  this.fire += dt;
  if (this.fire > (this.phase === 1 ? 0.9 : 0.6)) {
    this.fire = 0;
    this.pat = (this.pat + 1) % 2;
    if (this.pat === 0) c.ringShot(this.x, this.y, 8, 190, "#44e0ff", this.t);
    else c.fanShot(this.x - 40, this.y, p.x, p.y, 4, 0.18, 260, "#66ffcc");
  }
};

AR.Boss.prototype.ai2 = function (dt) {
  var c = this.g.combat, p = c.player;
  this.roam(dt, AR.W * 0.38, AR.W - 150, 130, AR.H - 130);
  if (this.special) return;
  this.fire += dt;
  if (this.fire > (this.phase === 1 ? 0.8 : 0.55)) {
    this.fire = 0;
    this.pat = (this.pat + 1) % 3;
    if (this.pat === 0) c.fanShot(this.x - 50, this.y, p.x, p.y, 5, 0.1, 280, "#ff5522");
    else if (this.pat === 1) c.ringShot(this.x, this.y, 10, 170, "#ffaa55", this.t);
    else c.aimedShot(this.x, this.y - 80, p.x, p.y, 360, 8, "#fff0c0");
  }
  if (this.phase >= 2 && Math.random() < dt * 0.6) {
    c.spawnEnemy("kami", { x: AR.W + 20, y: AR.rand(80, AR.H - 80) });
  }
};

AR.Boss.prototype.ai3 = function (dt) {
  var c = this.g.combat, p = c.player;
  this.roam(dt, AR.W * 0.34, AR.W - 140, 150, AR.H - 150);
  if (this.special) return;
  this.fire += dt;
  if (this.fire > 0.55) {
    this.fire = 0;
    this.pat = (this.pat + 1) % 3;
    if (this.pat === 0) {
      if (this.partAlive("torreta")) c.fanShot(this.x - 80, this.y, p.x, p.y, 4, 0.16, 320, "#3cf0ff");
      else c.ringShot(this.x, this.y, 8, 210, "#3cf0ff", this.t);
    } else if (this.pat === 1) c.ringShot(this.x, this.y, 8, 220, "#ff3d8a", this.t);
    else c.aimedShot(this.x - 40, this.y, p.x, p.y, 400, 6, "#fff");
  }
};

AR.Boss.prototype.ai4 = function (dt) {
  var c = this.g.combat, p = c.player;
  this.roam(dt, AR.W * 0.4, AR.W - 160, 160, AR.H - 160);
  for (var i = 0; i < this.parts.length; i++) {
    if (this.parts[i].name === "tentáculo") {
      this.parts[i].ox = -120 + Math.sin(this.t * 1.7 + i) * 50;
      this.parts[i].oy = this.parts[i].oy * 0.99 + Math.sin(this.t + i * 2) * 8;
    }
  }
  if (this.special) return;
  this.fire += dt;
  if (this.fire > (this.phase === 1 ? 0.8 : 0.55)) {
    this.fire = 0;
    this.pat = (this.pat + 1) % 3;
    if (this.pat === 0) {
      for (var k = 0; k < this.parts.length; k++) {
        if (this.parts[k].alive && this.parts[k].name === "tentáculo") {
          c.aimedShot(this.px(this.parts[k]), this.py(this.parts[k]), p.x, p.y, 280, 6, "#ff6688");
        }
      }
    } else if (this.pat === 1) c.ringShot(this.x, this.y, 9, 180, "#88ff99", this.t);
    else c.fanShot(this.x - 20, this.y, p.x, p.y, 5, 0.14, 240, "#ff8899");
  }
};

AR.Boss.prototype.ai5 = function (dt) {
  var c = this.g.combat, p = c.player;
  this.roam(dt, AR.W * 0.3, AR.W - 130, 120, AR.H - 120);
  if (this.special) return;
  this.fire += dt;
  var rate = [0.75, 0.6, 0.48, 0.4][this.phase - 1] || 0.5;
  if (this.fire > rate) {
    this.fire = 0;
    this.pat = (this.pat + 1) % 4;
    if (this.pat === 0) c.ringShot(this.x, this.y, 12, 210, "#ff3355", this.t);
    else if (this.pat === 1) {
      if (this.partAlive("cañón")) c.fanShot(this.x - 60, this.y, p.x, p.y, 6, 0.1, 320, "#ffaa33");
      else c.ringShot(this.x, this.y, 9, 240, "#ffaa33", this.t);
    } else if (this.pat === 2) c.aimedShot(this.x - 40, this.y, p.x, p.y, 360, 6, "#fff");
    else {
      c.ringShot(this.x - 40, this.y - 80, 7, 190, "#c04cff", this.t);
    }
  }
};

AR.Boss.prototype.draw = function (ctx) {
  var i, p;
  ctx.save();
  ctx.translate(this.x, this.y + Math.sin(this.t * 1.5) * 5);
  ctx.rotate(Math.sin(this.t * 0.65) * 0.035 + Math.sin(this.t * 2.4) * 0.012);
  if (this.flash > 0.45) ctx.globalAlpha = 0.72;
  this.drawChassis(ctx);
  this.drawSkin(ctx);
  this.drawAnim(ctx);
  ctx.restore();
  for (i = 0; i < this.wreck.length; i++) {
    var fr = this.wreck[i];
    ctx.save();
    ctx.globalAlpha = Math.min(1, fr.life);
    ctx.translate(fr.x, fr.y);
    ctx.rotate(fr.rot);
    ctx.fillStyle = fr.col;
    ctx.beginPath();
    if (fr.kind === 1) {
      ctx.moveTo(-fr.w / 2, 0);
      ctx.lineTo(0, -fr.h / 2);
      ctx.lineTo(fr.w / 2, fr.h / 4);
      ctx.lineTo(-fr.w / 6, fr.h / 2);
    } else if (fr.kind === 2) {
      ctx.rect(-fr.w / 2, -3, fr.w, 6);
      ctx.moveTo(-4, -fr.h / 2);
      ctx.lineTo(4, -fr.h / 2);
      ctx.lineTo(4, fr.h / 2);
      ctx.lineTo(-4, fr.h / 2);
    } else {
      ctx.moveTo(-fr.w / 2, -fr.h / 2);
      ctx.lineTo(fr.w / 2, -fr.h / 3);
      ctx.lineTo(fr.w / 3, fr.h / 2);
      ctx.lineTo(-fr.w / 2, fr.h / 4);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255,90,40,0.4)";
    ctx.fillRect(-fr.w / 2, -2, fr.w, 3);
    ctx.fillStyle = "rgba(255,220,180,0.35)";
    ctx.fillRect(-3, -3, 6, 6);
    ctx.restore();
  }
  for (i = 0; i < this.parts.length; i++) {
    p = this.parts[i];
    if (!p.alive) continue;
    ctx.save();
    ctx.strokeStyle = p.kind === "core" ? "rgba(255,70,70,0.5)" : "rgba(255,210,90,0.5)";
    ctx.lineWidth = 2;
    if (p.flash > 0) ctx.strokeStyle = "#fff";
    ctx.beginPath(); ctx.arc(this.px(p), this.py(p) + Math.sin(this.t * 1.5) * 5, p.r, 0, 6.28); ctx.stroke();
    if (p.kind !== "core") {
      var ratio = Math.max(0, p.hp / p.max);
      ctx.strokeStyle = ratio > 0.45 ? "#8f8" : "#f84";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.px(p), this.py(p) + Math.sin(this.t * 1.5) * 5, p.r + 4, -1.2, -1.2 + 6.28 * ratio);
      ctx.stroke();
    }
    ctx.restore();
  }
  this.drawSpecial(ctx);
};

AR.Boss.prototype.drawChassis = function (ctx) {
  var t = this.t, pulse = 0.5 + Math.sin(t * 7) * 0.5;
  AR.Gfx.glow(ctx, 8, 4, 70 + pulse * 20, this.dying ? "rgba(255,50,20,0.55)" : "rgba(255,140,50,0.28)", 0.7);
  var fn = this["chassis" + this.id];
  if (fn) fn.call(this, ctx, t, pulse);
  else this.chassis0(ctx, t, pulse);
  ctx.fillStyle = this.dying ? "#ff2a10" : "#ffb040";
  ctx.globalAlpha = 0.45 + pulse * 0.5;
  ctx.beginPath(); ctx.arc(10, 2, 14 + pulse * 8, 0, 6.28); ctx.fill();
  ctx.globalAlpha = 1;
};

AR.Boss.prototype.chassis0 = function (ctx, t) {
  ctx.strokeStyle = "#6a5c52";
  ctx.lineWidth = 3;
  for (var i = -5; i <= 5; i++) {
    ctx.beginPath();
    ctx.moveTo(-120, i * 24);
    ctx.lineTo(90, i * 16 + Math.sin(t * 2.2 + i) * 4);
    ctx.stroke();
  }
  ctx.strokeStyle = "#3a342e";
  ctx.lineWidth = 5;
  ctx.strokeRect(-125, -88, 220, 176);
  ctx.fillStyle = "#1a1612";
  ctx.fillRect(-36, -110, 28, 220);
  var pist = 18 + Math.sin(t * 3.1) * 10;
  ctx.fillStyle = "#8a7360";
  ctx.fillRect(-150, -70, pist + 40, 12);
  ctx.fillRect(-150, 58, pist + 40, 12);
  ctx.strokeStyle = "#a09080";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-80, -50);
  ctx.quadraticCurveTo(10, Math.sin(t * 4) * 14, 80, -30);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-80, 50);
  ctx.quadraticCurveTo(10, Math.sin(t * 4 + 2) * 14, 80, 30);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,180,80,0.4)";
  ctx.lineWidth = 2;
  ctx.strokeRect(-70, -50, 90, 100);
};

AR.Boss.prototype.chassis1 = function (ctx, t) {
  ctx.strokeStyle = "#3a7080";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(0, 0, 130, 58, 0, 0, 6.28);
  ctx.stroke();
  for (var i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.ellipse(-10, 0, 90 + i * 8, 22 + Math.abs(i) * 6 + Math.sin(t * 2 + i) * 3, 0, 0, 6.28);
    ctx.stroke();
  }
  ctx.strokeStyle = "#7ad";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-130, 8);
  ctx.quadraticCurveTo(-90, Math.sin(t * 3) * 20, -40, 0);
  ctx.stroke();
  ctx.fillStyle = "#0a2830";
  ctx.beginPath(); ctx.ellipse(40, -8, 28, 18, 0, 0, 6.28); ctx.fill();
};

AR.Boss.prototype.chassis2 = function (ctx, t) {
  ctx.strokeStyle = "#6a3020";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(20, -20); ctx.lineTo(20, 40); ctx.lineTo(-20, 110); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(20, -20); ctx.lineTo(-10, -90); ctx.lineTo(30, -130 + Math.sin(t * 2) * 6); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(10, 10);
  ctx.lineTo(-90 + Math.sin(t * 1.6) * 8, 70);
  ctx.lineTo(-40, 120);
  ctx.stroke();
  ctx.strokeRect(-50, -40, 80, 70);
  ctx.fillStyle = "#2a1008";
  ctx.fillRect(-18, -18, 40, 36);
  for (var i = 0; i < 5; i++) {
    ctx.strokeStyle = "#a05030";
    ctx.beginPath();
    ctx.moveTo(0, -100);
    ctx.lineTo(-20 + i * 12, -150 - Math.sin(t * 3 + i) * 8);
    ctx.stroke();
  }
};

AR.Boss.prototype.chassis3 = function (ctx, t) {
  ctx.strokeStyle = "#4a3060";
  ctx.lineWidth = 4;
  ctx.strokeRect(-170, -70, 320, 140);
  for (var i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(-150 + i * 50, -70);
    ctx.lineTo(-150 + i * 50, 70);
    ctx.stroke();
  }
  ctx.fillStyle = "#1a1028";
  ctx.fillRect(40, -40, 80, 36);
  var pulse = 0.4 + Math.sin(t * 16) * 0.6;
  ctx.fillStyle = "rgba(60,240,255," + (0.25 + pulse * 0.4) + ")";
  ctx.fillRect(-160, -8, 40 + pulse * 30, 16);
  ctx.fillRect(-160, 20, 30 + pulse * 22, 10);
  ctx.strokeStyle = "#ff3d8a";
  ctx.lineWidth = 2;
  ctx.strokeRect(-140, -50, 260, 8);
  ctx.strokeRect(-140, 42, 260, 8);
};

AR.Boss.prototype.chassis4 = function (ctx, t) {
  ctx.strokeStyle = "#6a3038";
  ctx.lineWidth = 6;
  for (var i = 0; i < 7; i++) {
    var x = -90 + i * 28;
    ctx.beginPath();
    ctx.arc(x, Math.sin(t * 2.2 + i) * 8, 16, 0, 6.28);
    ctx.stroke();
  }
  ctx.fillStyle = "#2a1014";
  ctx.beginPath(); ctx.ellipse(8, 6, 50, 40, 0, 0, 6.28); ctx.fill();
  var beat = 0.5 + Math.sin(t * 5) * 0.5;
  ctx.fillStyle = "rgba(255,40,70," + (0.35 + beat * 0.4) + ")";
  ctx.beginPath(); ctx.ellipse(10, 8, 18 + beat * 8, 14 + beat * 6, 0, 0, 6.28); ctx.fill();
  ctx.strokeStyle = "#a44";
  ctx.lineWidth = 8;
  for (i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(10, 8);
    ctx.quadraticCurveTo(-40, -80 + i * 80 + Math.sin(t * 2 + i) * 18, -110, -60 + i * 50);
    ctx.stroke();
  }
};

AR.Boss.prototype.chassis5 = function (ctx, t) {
  ctx.save();
  ctx.rotate(t * 0.35);
  ctx.strokeStyle = "#5a2040";
  ctx.lineWidth = 3;
  for (var i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.arc(0, 0, 30 + i * 12, t + i, t + i + 2.2);
    ctx.stroke();
  }
  ctx.restore();
  ctx.strokeStyle = "#8a4060";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-20, -140); ctx.lineTo(10, 0); ctx.lineTo(-20, 140); ctx.stroke();
  ctx.strokeRect(-50, -50, 90, 100);
  ctx.fillStyle = "#180810";
  ctx.beginPath(); ctx.arc(8, 12, 22, 0, 6.28); ctx.fill();
};

AR.Boss.prototype.drawSkin = function (ctx) {
  var img = AR.Gfx.bossArt && AR.Gfx.bossArt[this.id];
  var w = [540, 560, 560, 620, 540, 640][this.id];
  if (AR.Gfx._imgOk(img)) {
    var h = w * img.naturalHeight / img.naturalWidth;
    if (!this._skin) this._skin = document.createElement("canvas");
    var buf = this._skin;
    if (buf.width !== w) { buf.width = w; buf.height = h; }
    var bx = buf.getContext("2d");
    bx.clearRect(0, 0, w, h);
    bx.globalCompositeOperation = "source-over";
    bx.drawImage(img, 0, 0, w, h);
    bx.globalCompositeOperation = "destination-out";
    var live = 0, armor = 0;
    for (var i = 0; i < this.parts.length; i++) {
      var p = this.parts[i];
      if (p.kind === "core") continue;
      armor++;
      var cx = w * 0.45 + p.ox, cy = h * 0.5 + p.oy;
      if (!p.alive) {
        bx.beginPath();
        bx.ellipse(cx, cy, p.r * 1.7, p.r * 1.35, 0, 0, 6.28);
        bx.fill();
        bx.beginPath();
        bx.ellipse(cx + p.r * 0.4, cy - p.r * 0.2, p.r, p.r * 0.7, 0.4, 0, 6.28);
        bx.fill();
      } else live++;
    }
    var wear = 1 - this.hp / this.max;
    if (wear > 0.2) {
      for (var k = 0; k < 10; k++) {
        bx.beginPath();
        bx.arc(w * 0.25 + (k * 53) % 220, h * 0.3 + (k * 37) % 110, 8 + wear * 22, 0, 6.28);
        bx.fill();
      }
    }
    var skinA = this.dying ? Math.max(0.08, 0.82 - this.deadT * 0.32) : 0.22 + 0.7 * (armor ? live / armor : 1);
    ctx.save();
    ctx.globalAlpha = skinA;
    ctx.drawImage(buf, -w * 0.45, -h * 0.5);
    ctx.restore();
  } else {
    ctx.save();
    var d = this["draw" + this.id];
    if (d) d.call(this, ctx);
    ctx.restore();
  }
};

AR.Boss.prototype.drawAnim = function (ctx) {
  var pl = this.g.combat.player;
  var t = this.t;
  var i, p;
  for (i = 0; i < 6; i++) {
    var lx = -90 + ((t * 70 + i * 40) % 200);
    ctx.fillStyle = "rgba(255,200,90," + (0.15 + Math.sin(t * 8 + i) * 0.12) + ")";
    ctx.fillRect(lx, -6, 18, 3);
  }
  for (i = 0; i < this.parts.length; i++) {
    p = this.parts[i];
    if (!p.alive) {
      ctx.fillStyle = "#140806";
      ctx.beginPath(); ctx.arc(p.ox, p.oy, p.r * 0.78, 0, 6.28); ctx.fill();
      ctx.strokeStyle = "rgba(255,70,30," + (0.35 + Math.sin(t * 9 + i) * 0.2) + ")";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(p.ox, p.oy, p.r * 0.5 + Math.sin(t * 8) * 3, 0, 6.28); ctx.stroke();
      ctx.strokeStyle = "rgba(40,20,16,0.9)";
      ctx.lineWidth = 3;
      for (var s = 0; s < 3; s++) {
        ctx.beginPath();
        ctx.moveTo(p.ox - p.r * 0.4, p.oy - p.r * 0.2 + s * 6);
        ctx.lineTo(p.ox + p.r * 0.35, p.oy + p.r * 0.15 + s * 4);
        ctx.stroke();
      }
      continue;
    }
    if (p.kind === "armor") {
      ctx.save();
      ctx.translate(p.ox, p.oy + Math.sin(t * 3 + i) * 3);
      ctx.rotate(Math.sin(t * 1.4 + i) * 0.08);
      ctx.fillStyle = "rgba(180,160,140,0.28)";
      ctx.fillRect(-p.r * 0.7, -p.r * 0.35, p.r * 1.4, p.r * 0.7);
      ctx.strokeStyle = "rgba(255,220,180,0.35)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-p.r * 0.7, -p.r * 0.35, p.r * 1.4, p.r * 0.7);
      ctx.restore();
    }
    if (p.kind === "gun") {
      var ang = Math.atan2(pl.y - (this.y + p.oy), pl.x - (this.x + p.ox));
      ctx.save();
      ctx.translate(p.ox, p.oy);
      ctx.rotate(ang);
      ctx.fillStyle = "#6a727c";
      ctx.fillRect(-8, -8, 18, 16);
      ctx.fillStyle = "#9aa8b4";
      ctx.fillRect(8, -5, 36 + Math.sin(t * 14) * 3, 10);
      ctx.fillStyle = "#2a3038";
      ctx.fillRect(12, -2, 24, 4);
      ctx.fillStyle = "#ff5533";
      ctx.fillRect(42, -2, 10, 4);
      if (Math.sin(t * 18 + i) > 0.7) {
        ctx.fillStyle = "rgba(255,180,80,0.7)";
        ctx.fillRect(50, -3, 16, 6);
      }
      ctx.restore();
    }
    if (p.kind === "engine") {
      var pulse = 0.45 + Math.sin(t * 20 + i) * 0.55;
      AR.Gfx.glow(ctx, p.ox - 18, p.oy, 22 + pulse * 14, "rgba(80,230,255,0.9)", 0.65);
      ctx.fillStyle = "rgba(180,255,255," + (0.3 + pulse * 0.4) + ")";
      ctx.beginPath();
      ctx.moveTo(p.ox - 8, p.oy - 8);
      ctx.lineTo(p.ox - 40 - pulse * 18, p.oy);
      ctx.lineTo(p.ox - 8, p.oy + 8);
      ctx.fill();
    }
  }
  var ex = -this.bodyR() * 0.62;
  for (var k = -1; k <= 1; k++) {
    var g = 0.4 + Math.sin(t * 18 + k) * 0.6;
    AR.Gfx.glow(ctx, ex, k * 30, 20 + g * 16, this.id === 1 ? "rgba(40,220,255,0.85)" : "rgba(255,140,50,0.7)", 0.55);
  }
  ctx.fillStyle = this.phase >= 3 ? "#ff3344" : "#3cf0ff";
  ctx.globalAlpha = 0.45 + Math.sin(t * 6) * 0.35;
  ctx.fillRect(40, -8, 18, 6);
  ctx.fillRect(40, 4, 18, 6);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "rgba(255,240,180,0.2)";
  ctx.lineWidth = 1;
  for (i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(-80, -40 + i * 22 + Math.sin(t * 5 + i) * 4);
    ctx.lineTo(60, -30 + i * 18);
    ctx.stroke();
  }
  if (this.id === 4) {
    ctx.strokeStyle = "rgba(255,80,110,0.55)";
    ctx.lineWidth = 8;
    for (i = 0; i < this.parts.length; i++) {
      p = this.parts[i];
      if (p.name === "tentáculo" && p.alive) {
        ctx.beginPath();
        ctx.moveTo(10, 8);
        ctx.quadraticCurveTo(p.ox * 0.4, p.oy * 0.5 + Math.sin(t * 2.2 + i) * 24, p.ox, p.oy);
        ctx.stroke();
        ctx.fillStyle = "rgba(255,100,120,0.45)";
        ctx.beginPath(); ctx.arc(p.ox, p.oy, 10 + Math.sin(t * 4 + i) * 3, 0, 6.28); ctx.fill();
      }
    }
  }
  if (this.id === 3) {
    ctx.fillStyle = "rgba(60,240,255," + (0.2 + Math.sin(t * 10) * 0.15) + ")";
    for (i = 0; i < 5; i++) ctx.fillRect(-140 + i * 55, -62 + Math.sin(t * 6 + i) * 3, 36, 6);
  }
};

AR.Boss.prototype.draw0 = function (ctx) {
  AR.Gfx.glow(ctx, 0, 0, 160, "rgba(255,120,40,0.35)", 0.5);
  ctx.fillStyle = "#2a323c";
  ctx.fillRect(-140, -160, 220, 320);
  ctx.fillStyle = "#44505c";
  ctx.fillRect(-160, -40, 80, 80);
  ctx.fillStyle = this.phase >= 2 ? "#ff4422" : "#3cf0ff";
  ctx.fillRect(-20, -24, 50, 48);
  ctx.fillStyle = "#1a2028";
  ctx.fillRect(-120, -140, 70, 50);
  ctx.fillRect(-120, 90, 70, 50);
  ctx.fillStyle = "#8899aa";
  ctx.fillRect(40, -180, 24, 360);
};

AR.Boss.prototype.draw1 = function (ctx) {
  AR.Gfx.glow(ctx, 0, 0, 180, "rgba(40,200,255,0.4)", 0.55);
  ctx.strokeStyle = "#3ad";
  ctx.fillStyle = "#0a3040";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.ellipse(0, 0, 130, 70, 0, 0, 6.28);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#6ff";
  ctx.beginPath(); ctx.ellipse(50, -10, 22, 16, 0, 0, 6.28); ctx.fill();
  ctx.strokeStyle = "#4cf";
  for (var i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(-40, 20);
    ctx.quadraticCurveTo(-80 - i * 10, 60 + Math.sin(this.t * 3 + i) * 20, -140, 40 + i * 16);
    ctx.stroke();
  }
};

AR.Boss.prototype.draw2 = function (ctx) {
  AR.Gfx.glow(ctx, 0, 0, 170, "rgba(255,80,30,0.4)", 0.5);
  ctx.fillStyle = "#5a2010";
  ctx.beginPath();
  ctx.moveTo(80, 0); ctx.lineTo(-40, -160); ctx.lineTo(-140, -40); ctx.lineTo(-140, 40); ctx.lineTo(-40, 160);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#2a0c08";
  ctx.fillRect(-30, -30, 70, 60);
  ctx.fillStyle = this.phase === 3 ? "#fff0a0" : "#ff6622";
  ctx.beginPath(); ctx.arc(10, 0, 22, 0, 6.28); ctx.fill();
  ctx.fillStyle = "#8a4030";
  ctx.fillRect(-100, 40, 90, 28);
  ctx.fillRect(0, -140, 40, 70);
};

AR.Boss.prototype.draw3 = function (ctx) {
  AR.Gfx.glow(ctx, 0, 0, 200, "rgba(255,60,180,0.35)", 0.5);
  ctx.fillStyle = "#12081c";
  ctx.fillRect(-180, -90, 340, 180);
  ctx.fillStyle = "#3cf0ff";
  ctx.globalAlpha = 0.5 + Math.sin(this.t * 8) * 0.2;
  ctx.fillRect(-160, -70, 300, 8);
  ctx.fillRect(-160, 62, 300, 8);
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#ff3d8a";
  ctx.fillRect(40, -50, 90, 40);
  ctx.fillStyle = "#2a1438";
  ctx.fillRect(-140, 40, 80, 50);
  ctx.fillRect(-40, -110, 160, 30);
};

AR.Boss.prototype.draw4 = function (ctx) {
  AR.Gfx.glow(ctx, 0, 0, 190, "rgba(255,40,70,0.4)", 0.55);
  ctx.fillStyle = "#3a1818";
  ctx.beginPath(); ctx.ellipse(0, 0, 120, 100, 0, 0, 6.28); ctx.fill();
  ctx.fillStyle = "#ff4466";
  ctx.globalAlpha = 0.5 + Math.sin(this.t * 4) * 0.2;
  ctx.beginPath(); ctx.ellipse(10, 8, 36, 30, 0, 0, 6.28); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "#a44";
  ctx.lineWidth = 10;
  for (var i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(20, -20);
    ctx.quadraticCurveTo(-80, -120 + i * 80 + Math.sin(this.t * 2 + i) * 30, -160, -80 + i * 50);
    ctx.stroke();
  }
};

AR.Boss.prototype.draw5 = function (ctx) {
  var cols = ["#ff3355", "#c04cff", "#66ddff", "#fff"][this.phase - 1] || "#ff3355";
  AR.Gfx.glow(ctx, 0, 0, 210, cols, 0.45);
  ctx.fillStyle = "#140810";
  ctx.beginPath();
  ctx.moveTo(90, 0); ctx.lineTo(20, -170); ctx.lineTo(-150, -80); ctx.lineTo(-150, 80); ctx.lineTo(20, 170);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = cols;
  ctx.globalAlpha = 0.8;
  ctx.beginPath(); ctx.arc(10, 10, 28 + this.phase * 4, 0, 6.28); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = cols;
  ctx.lineWidth = 3;
  ctx.strokeRect(-60, -60, 80, 120);
  ctx.fillStyle = "#2a1420";
  ctx.fillRect(-40, -150, 50, 40);
  ctx.fillRect(-40, 110, 50, 40);
};
