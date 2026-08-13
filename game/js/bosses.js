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
  var hp = [520, 640, 780, 860, 980, 1400][id] * g.diff.hp;
  this.hp = this.max = hp;
  this.name = AR.STAGES[id].boss;
  this.title = AR.STAGES[id].bossTitle;
  this._setupParts(id);
};

AR.Boss.prototype._setupParts = function (id) {
  var self = this;
  function part(name, ox, oy, r, hp, score) {
    self.parts.push({ name: name, ox: ox, oy: oy, r: r, hp: hp, max: hp, alive: true, score: score || 1500, flash: 0 });
  }
  if (id === 0) {
    part("cañón izq", -80, -90, 34, 90, 2000);
    part("cañón der", -80, 90, 34, 90, 2000);
    part("núcleo", -20, 0, 42, 9999, 0);
  } else if (id === 1) {
    part("ojo", 40, -20, 36, 9999, 0);
    part("aleta", -60, 80, 40, 110, 1800);
    part("aleta", -60, -80, 40, 110, 1800);
  } else if (id === 2) {
    part("corona", 20, -110, 40, 140, 2200);
    part("brazo", -90, 70, 36, 120, 1800);
    part("núcleo", -10, 10, 44, 9999, 0);
  } else if (id === 3) {
    part("puente", 50, -40, 38, 160, 2500);
    part("motor", -100, 60, 40, 130, 2000);
    part("batería", -20, 80, 34, 100, 1600);
  } else if (id === 4) {
    part("tentáculo", -120, -130, 30, 80, 1400);
    part("tentáculo", -90, 150, 30, 80, 1400);
    part("tentáculo", 40, -160, 30, 80, 1400);
    part("corazón", 10, 10, 48, 9999, 0);
  } else {
    part("ala izq", -40, -140, 42, 150, 2400);
    part("ala der", -40, 140, 42, 150, 2400);
    part("máscara", 30, -20, 40, 180, 3000);
    part("núcleo", 0, 20, 50, 9999, 0);
  }
};

AR.Boss.prototype.px = function (p) { return this.x + p.ox; };
AR.Boss.prototype.py = function (p) { return this.y + p.oy; };

AR.Boss.prototype.hurt = function (dmg, x, y) {
  if (this.intro > 0 || this.dying) return;
  var hitPart = null, best = 80;
  for (var i = 0; i < this.parts.length; i++) {
    var p = this.parts[i];
    if (!p.alive) continue;
    var d = AR.len(this.px(p) - x, this.py(p) - y);
    if (d < p.r + 18 && d < best) { best = d; hitPart = p; }
  }
  if (hitPart && hitPart.max < 9000) {
    hitPart.hp -= dmg;
    hitPart.flash = 1;
    if (hitPart.hp <= 0) {
      hitPart.alive = false;
      this.g.addScore(hitPart.score, true);
      AR.Particles.explode(this.px(hitPart), this.py(hitPart), true);
      AR.Audio.sfx("explodeBig", this.x);
      AR.FX.boom(10);
      this.hp -= this.max * 0.08;
    }
    dmg *= 0.45;
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
  if (this.x > x && this.y > y0 - 40 && this.y < y1 + 40) this.hurt(dmg, this.x - 40, this.y);
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
  if (this.dying) {
    this.deadT += dt;
    if ((this.deadT * 12 | 0) !== ((this.deadT - dt) * 12 | 0)) {
      AR.Particles.explode(this.x + AR.rand(-80, 80), this.y + AR.rand(-80, 80), true);
      AR.Audio.sfx("explode", this.x);
      AR.FX.boom(8);
    }
    if (this.deadT > 3.2) {
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
  var p = this.g.combat.player;
  if (!p.dead && p.inv <= 0 && AR.circleHit(p.x, p.y, 6, this.x, this.y, this.bodyR() * 0.55)) {
    this.g.combat.hurtPlayer(this.x, this.y);
  }
};

AR.Boss.prototype.ai0 = function (dt) {
  var c = this.g.combat, p = c.player;
  this.y = AR.H * 0.5 + Math.sin(this.t * 0.7) * 160;
  this.x = AR.W - 340 + Math.sin(this.t * 0.3) * 30;
  this.patT += dt;
  if (this.phase >= 2 && this.patT > 3.5) {
    this.patT = 0;
    AR.Background.smash(this.x - 200, AR.rand(120, 900));
    AR.FX.boom(10);
  }
  this.fire += dt;
  var rate = this.phase === 1 ? 0.9 : this.phase === 2 ? 0.65 : 0.48;
  if (this.fire > rate) {
    this.fire = 0;
    this.pat = (this.pat + 1) % 4;
    if (this.pat === 0) c.fanShot(this.x - 90, this.y, p.x, p.y, 5, 0.12, 320, "#ff6644");
    else if (this.pat === 1) {
      for (var i = 0; i < 3; i++) c.eShot(this.x - 80, this.y - 80 + i * 80, -380, 0, 6, "#ffaa44");
    } else if (this.pat === 2) c.aimedShot(this.x - 40, this.y, p.x, p.y, 420, 7, "#ff3366");
    else c.ringShot(this.x - 20, this.y, this.phase === 3 ? 10 : 8, 210, "#ff8866", this.t);
  }
  if (this.phase === 3 && (this.t * 2 | 0) !== ((this.t - dt) * 2 | 0)) {
    c.eShot(this.x - 100, this.y + Math.sin(this.t * 8) * 200, -500, 0, 5, "#fff0a0");
  }
};

AR.Boss.prototype.ai1 = function (dt) {
  var c = this.g.combat, p = c.player;
  var ang = this.t * 0.55;
  this.x = AR.W * 0.62 + Math.cos(ang) * 220;
  this.y = AR.H * 0.5 + Math.sin(ang * 1.3) * 260;
  if (this.phase >= 2) this.y = AR.clamp(AR.lerp(this.y, p.y, 0.4 * dt), 140, AR.H - 140);
  this.fire += dt;
  var rate = this.phase === 1 ? 0.85 : 0.55;
  if (this.fire > rate) {
    this.fire = 0;
    this.pat = (this.pat + 1) % 3;
    if (this.pat === 0) c.ringShot(this.x, this.y, 9, 200, "#44e0ff", this.t);
    else if (this.pat === 1) c.fanShot(this.x - 40, this.y, p.x, p.y, 4, 0.2, 280, "#66ffcc");
    else {
      for (var i = 0; i < 5; i++) c.eShot(this.x, this.y, -160 - i * 30, Math.sin(this.t + i) * 140, 6, "#88ffff");
    }
  }
  if (this.phase === 3) {
    var pull = AR.norm(this.x - p.x, this.y - p.y);
    p.x += pull.x * 40 * dt; p.y += pull.y * 40 * dt;
    if (this.fire > rate * 0.5) c.aimedShot(this.x, this.y, p.x, p.y, 360, 6, "#aaffee");
  }
};

AR.Boss.prototype.ai2 = function (dt) {
  var c = this.g.combat, p = c.player;
  this.x = AR.W - 300;
  this.y = AR.H * 0.5 + Math.sin(this.t * 0.5) * 200;
  this.fire += dt;
  if (this.fire > (this.phase === 1 ? 0.7 : 0.5)) {
    this.fire = 0;
    this.pat = (this.pat + 1) % 4;
    if (this.pat === 0) {
      for (var i = 0; i < 6; i++) c.eShot(AR.W + 10, AR.rand(60, AR.H - 60), -AR.rand(180, 340), AR.rand(-40, 40), 8, "#ff8844");
    } else if (this.pat === 1) c.fanShot(this.x - 50, this.y, p.x, p.y, 6, 0.1, 300, "#ff5522");
    else if (this.pat === 2) c.ringShot(this.x, this.y, 12, 180, "#ffaa55", this.t);
    else c.aimedShot(this.x, this.y - 80, p.x, p.y, 400, 8, "#fff0c0");
  }
  if (this.phase >= 2 && Math.random() < dt * 1.2) {
    c.spawnEnemy("kami", { x: AR.W + 20, y: AR.rand(80, AR.H - 80) });
  }
  if (this.phase === 3 && (this.t * 3 | 0) !== ((this.t - dt) * 3 | 0)) {
    c.eShot(this.x - 70, 80, -220, 80, 6, "#ff6644");
    c.eShot(this.x - 70, AR.H - 80, -220, -80, 6, "#ff6644");
  }
};

AR.Boss.prototype.ai3 = function (dt) {
  var c = this.g.combat, p = c.player;
  this.x = AR.W - 280 + Math.sin(this.t * 0.4) * 40;
  this.y = AR.H * 0.5 + Math.sin(this.t * 0.9) * 90;
  this.fire += dt;
  if (this.fire > 0.42) {
    this.fire = 0;
    this.pat = (this.pat + 1) % 5;
    if (this.pat === 0) {
      for (var i = 0; i < 8; i++) c.eShot(this.x - 120, 80 + i * 120, -420, 0, 5, "#ff3d8a");
    } else if (this.pat === 1) c.fanShot(this.x - 80, this.y, p.x, p.y, 5, 0.16, 360, "#3cf0ff");
    else if (this.pat === 2) c.ringShot(this.x, this.y, 10, 240, "#ff3d8a", this.t);
    else if (this.pat === 3) {
      c.spawnEnemy("wasp", { x: this.x - 40, y: this.y - 40 });
      c.spawnEnemy("wasp", { x: this.x - 40, y: this.y + 40 });
    } else {
      var y = ((this.t * 140) % (AR.H - 80)) + 40;
      for (var j = 0; j < 10; j++) c.eShot(AR.W, y + j * 8 - 40, -500, 0, 4, "#fff");
    }
  }
  if (this.phase === 3) {
    var a = this.t * 2.2;
    c.eShot(this.x, this.y, Math.cos(a) * 280, Math.sin(a) * 280, 5, "#c04cff");
  }
};

AR.Boss.prototype.ai4 = function (dt) {
  var c = this.g.combat, p = c.player;
  this.x = AR.W - 320;
  this.y = AR.H * 0.5 + Math.sin(this.t * 0.6) * 140;
  for (var i = 0; i < this.parts.length; i++) {
    if (this.parts[i].name === "tentáculo") {
      this.parts[i].ox = -120 + Math.sin(this.t * 1.7 + i) * 50;
      this.parts[i].oy = this.parts[i].oy * 0.99 + Math.sin(this.t + i * 2) * 8;
    }
  }
  this.fire += dt;
  if (this.fire > (this.phase === 1 ? 0.75 : 0.5)) {
    this.fire = 0;
    this.pat = (this.pat + 1) % 4;
    if (this.pat === 0) {
      for (var k = 0; k < this.parts.length; k++) {
        if (this.parts[k].alive && this.parts[k].name === "tentáculo") {
          c.aimedShot(this.px(this.parts[k]), this.py(this.parts[k]), p.x, p.y, 300, 6, "#ff6688");
        }
      }
    } else if (this.pat === 1) c.ringShot(this.x, this.y, 11, 190, "#88ff99", this.t);
    else if (this.pat === 2) c.fanShot(this.x - 20, this.y, p.x, p.y, 6, 0.14, 260, "#ff8899");
    else c.spawnEnemy("squid", { x: AR.W + 20, y: AR.rand(100, 900) });
  }
  if (this.phase === 3 && (this.t * 4 | 0) !== ((this.t - dt) * 4 | 0)) {
    c.eShot(this.x, this.y, -220, Math.sin(this.t * 9) * 200, 7, "#ff4466");
  }
};

AR.Boss.prototype.ai5 = function (dt) {
  var c = this.g.combat, p = c.player;
  this.x = AR.W - 300 + Math.sin(this.t * 0.35) * 50;
  this.y = AR.H * 0.5 + Math.sin(this.t * 0.8) * (this.phase >= 3 ? 220 : 120);
  this.fire += dt;
  var rate = [0.7, 0.55, 0.42, 0.34][this.phase - 1] || 0.4;
  if (this.fire > rate) {
    this.fire = 0;
    this.pat = (this.pat + 1) % 6;
    if (this.pat === 0) c.ringShot(this.x, this.y, 14, 230, "#ff3355", this.t);
    else if (this.pat === 1) c.fanShot(this.x - 60, this.y, p.x, p.y, 7, 0.1, 340, "#ffaa33");
    else if (this.pat === 2) {
      for (var i = 0; i < 5; i++) c.aimedShot(this.x - 40, this.y - 80 + i * 40, p.x, p.y, 380, 6, "#fff");
    } else if (this.pat === 3) {
      c.spawnEnemy("armor", { x: AR.W + 30, y: 200 });
      c.spawnEnemy("kami", { x: AR.W + 30, y: 800 });
    } else if (this.pat === 4) {
      for (var j = 0; j < 12; j++) {
        var yy = 60 + j * 85;
        c.eShot(AR.W, yy, -300 - (j % 2) * 80, 0, 5, j % 2 ? "#ff3355" : "#66ddff");
      }
    } else {
      c.ringShot(this.x - 40, this.y - 100, 8, 200, "#c04cff", this.t);
      c.ringShot(this.x - 40, this.y + 100, 8, 200, "#c04cff", -this.t);
    }
  }
  if (this.phase === 4) {
    var a = this.t * 3.4;
    c.eShot(this.x, this.y, Math.cos(a) * 320, Math.sin(a) * 320, 6, "#ffffff");
    if (Math.random() < dt * 2) c.spawnEnemy("swarm", { x: AR.W + 10, y: AR.rand(80, 1000) });
  }
};

AR.Boss.prototype.draw = function (ctx) {
  ctx.save();
  ctx.translate(this.x, this.y);
  if (this.flash > 0.4) ctx.globalAlpha = 0.55;
  if (this.dying) ctx.globalAlpha = Math.max(0.15, 1 - this.deadT / 3.2);
  var d = this["draw" + this.id];
  if (d) d.call(this, ctx);
  ctx.restore();
  for (var i = 0; i < this.parts.length; i++) {
    var p = this.parts[i];
    if (!p.alive) continue;
    ctx.save();
    ctx.strokeStyle = p.max > 9000 ? "rgba(255,80,80,0.85)" : "rgba(255,220,80,0.7)";
    ctx.lineWidth = 2;
    if (p.flash > 0) ctx.strokeStyle = "#fff";
    ctx.beginPath(); ctx.arc(this.px(p), this.py(p), p.r, 0, 6.28); ctx.stroke();
    ctx.restore();
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
