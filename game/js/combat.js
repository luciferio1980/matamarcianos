/* AETHER RAZE — player, weapons, enemies, pickups, collisions */
AR.Combat = {
  init: function (g) {
    this.g = g;
    this.pBullets = new AR.Pool(420, function () { return AR.Combat._b(); });
    this.eBullets = new AR.Pool(520, function () { return AR.Combat._b(); });
    this.missiles = new AR.Pool(48, function () { return AR.Combat._b(); });
    this.enemies = new AR.Pool(140, function () { return AR.Combat._e(); });
    this.pickups = new AR.Pool(24, function () { return AR.Combat._u(); });
    this.player = this._player();
  },
  _b: function () {
    return { alive: false, x: 0, y: 0, vx: 0, vy: 0, r: 4, dmg: 1, life: 2, pierce: 0, homing: 0, col: "#fff", friendly: true, w: 10, h: 4, laser: 0 };
  },
  _e: function () {
    return { alive: false, x: 0, y: 0, vx: 0, vy: 0, hp: 1, max: 1, r: 16, score: 100, kind: "wasp", spr: "wasp",
      t: 0, fire: 0, rot: 0, scale: 1, flash: 0, drop: 0.12, w: 40, h: 24, ai: "sine", hpBar: false, mini: false };
  },
  _u: function () {
    return { alive: false, x: 0, y: 0, vx: -40, vy: 0, kind: "P", t: 0, r: 16 };
  },
  _player: function () {
    return {
      x: 220, y: AR.H * 0.5, vx: 0, vy: 0,
      hp: 5, maxHp: 5, lives: 3, bombs: 2, energy: 100,
      weapon: "vulcan", power: 1, shield: 0, speedBoost: 0,
      fireCd: 0, charge: 0, charging: false, inv: 0, hurtBlink: false, focus: false,
      dead: false, deadT: 0, mul: 1, chain: 0, chainT: 0, hidden: false,
      roll: 0, craftId: "aurora", art: "player", speedMul: 1, dmgMul: 1, rateMul: 1
    };
  },
  applyCraft: function (c) {
    var p = this.player;
    c = c || AR.craft(p.craftId);
    p.craftId = c.id;
    p.art = c.art;
    p.weapon = c.weapon;
    p.maxHp = c.hp;
    p.hp = c.hp;
    p.speedMul = c.speed;
    p.dmgMul = c.dmg;
    p.rateMul = c.rate;
    p.bombs = c.bombs;
    p.lives = c.lives;
    p.roll = 0;
  },
  resetPlayer: function (keepScore) {
    var p = this.player;
    p.x = 220; p.y = AR.H * 0.5; p.hp = p.maxHp; p.dead = false; p.inv = 2.2;
    p.energy = Math.max(p.energy, 40); p.charge = 0;
  },
  clearWorld: function () {
    this.pBullets.clear(); this.eBullets.clear(); this.missiles.clear();
    this.enemies.clear(); this.pickups.clear();
  },

  spawnEnemy: function (kind, opt) {
    opt = opt || {};
    var def = AR.Combat.KINDS[kind] || AR.Combat.KINDS.wasp;
    var diff = this.g.diff;
    var stage = this.g.stage || 0;
    return this.enemies.spawn(function (e) {
      e.kind = kind;
      e.spr = def.spr;
      e.x = opt.x != null ? opt.x : AR.W + 40;
      e.y = opt.y != null ? opt.y : AR.rand(80, AR.H - 80);
      e.vx = def.vx; e.vy = def.vy || 0;
      e.hp = e.max = Math.max(1, Math.round(def.hp * diff.hp));
      e.r = def.r; e.w = def.w; e.h = def.h;
      e.score = def.score; e.ai = def.ai;
      e.t = 0; e.fire = opt.fire || 0; e.rot = 0; e.scale = opt.scale || 1;
      e.flash = 0; e.drop = def.drop; e.hpBar = !!def.hpBar; e.mini = !!def.mini;
      e.amp = opt.amp || def.amp || 80;
      e.phase = opt.phase || 0;
      e.shot = def.shot;
      e.rate = (def.rate || 1.4) / diff.rate;
      e.extra = opt;
      e.solid = !!def.solid;
      e.theme = opt.theme != null ? opt.theme : stage;
      e.trail = null;
      if (opt.h) e.h = opt.h;
      if (opt.w) e.w = opt.w;
      if (opt.vx != null) e.vx = opt.vx;
      if (e.solid) e.r = Math.min(e.w, e.h) * 0.42;
    });
  },
  spawnPickup: function (x, y, kind) {
    this.pickups.spawn(function (u) {
      u.x = x; u.y = y; u.vx = -50; u.vy = AR.rand(-40, 40); u.kind = kind; u.t = 0; u.r = 16;
    });
  },
  pShot: function (x, y, vx, vy, dmg, col, r, pierce) {
    this.pBullets.spawn(function (b) {
      b.x = x; b.y = y; b.vx = vx; b.vy = vy; b.dmg = dmg; b.col = col || "#9ff";
      b.r = r || 4; b.life = 1.6; b.pierce = pierce || 0; b.friendly = true; b.laser = 0; b.homing = 0;
      b.w = 16; b.h = 4;
    });
  },
  eShot: function (x, y, vx, vy, r, col) {
    this.eBullets.spawn(function (b) {
      b.x = x; b.y = y; b.vx = vx; b.vy = vy; b.r = r || 5; b.col = col || "#ff4466";
      b.life = 4; b.dmg = 1; b.friendly = false; b.laser = 0; b.homing = 0; b.w = 8; b.h = 8;
    });
  },
  aimedShot: function (x, y, tx, ty, spd, r, col) {
    var n = AR.norm(tx - x, ty - y);
    this.eShot(x, y, n.x * spd, n.y * spd, r, col);
  },
  ringShot: function (x, y, n, spd, col, off) {
    off = off || 0;
    for (var i = 0; i < n; i++) {
      var a = off + i * Math.PI * 2 / n;
      this.eShot(x, y, Math.cos(a) * spd, Math.sin(a) * spd, 5, col);
    }
  },
  fanShot: function (x, y, tx, ty, n, spread, spd, col) {
    var base = AR.ang(x, y, tx, ty);
    for (var i = 0; i < n; i++) {
      var a = base + (i - (n - 1) / 2) * spread;
      this.eShot(x, y, Math.cos(a) * spd, Math.sin(a) * spd, 5, col);
    }
  },

  fireWeapon: function (dt) {
    var p = this.player, g = this.g;
    if (p.dead) return;
    p.fireCd -= dt;
    var firing = AR.Input.btn("fire");
    if (firing) {
      p.charging = true;
      p.charge = Math.min(1, p.charge + dt * 0.85);
      if (p.charge > 0.3 && (p.charge * 10 | 0) !== ((p.charge - dt * 0.85) * 10 | 0)) AR.Audio.sfx("charge", p.x);
    } else if (p.charging) {
      if (p.charge >= 0.82) this.chargedBlast();
      p.charging = false; p.charge = 0;
    }
    if (firing && p.fireCd <= 0 && p.charge < 0.82) {
      this.doShot();
    }
    if (p.weapon === "laser" && firing) this.laserBeam(dt);
  },
  doShot: function () {
    var p = this.player, pow = p.power, w = p.weapon;
    var dmg = 8 * this.g.diff.dmg * (1 + (pow - 1) * 0.22) * (p.dmgMul || 1);
    var rate = p.rateMul || 1;
    if (w === "vulcan") {
      p.fireCd = (0.09 - pow * 0.008) / rate;
      this.pShot(p.x + 28, p.y, 1180, 0, dmg, "#b8ffff", 3);
      if (pow >= 2) { this.pShot(p.x + 20, p.y - 10, 1180, 0, dmg * 0.7, "#b8ffff", 3); this.pShot(p.x + 20, p.y + 10, 1180, 0, dmg * 0.7, "#b8ffff", 3); }
      if (pow >= 4) { this.pShot(p.x + 16, p.y - 18, 1100, -80, dmg * 0.5, "#8ff", 3); this.pShot(p.x + 16, p.y + 18, 1100, 80, dmg * 0.5, "#8ff", 3); }
      AR.Audio.sfx("shot", p.x);
    } else if (w === "spread") {
      p.fireCd = 0.16 / rate;
      var n = 3 + (pow >= 3 ? 2 : 0) + (p.craftId === "halcon" ? 2 : 0);
      var spr = p.craftId === "halcon" ? 0.22 : 0.18;
      for (var i = 0; i < n; i++) {
        var a = (i - (n - 1) / 2) * spr;
        this.pShot(p.x + 24, p.y, Math.cos(a) * 980, Math.sin(a) * 980, dmg * 0.75, "#ffe14a", 4);
      }
      AR.Audio.sfx("shot", p.x);
    } else if (w === "missile") {
      p.fireCd = 0.28 / rate;
      var m = 1 + (pow >= 2 ? 1 : 0) + (pow >= 4 ? 1 : 0) + (p.craftId === "lanza" ? 1 : 0);
      for (var j = 0; j < m; j++) this.launchMissile(p.x + 10, p.y + (j - (m - 1) / 2) * 16, dmg * 1.6);
      AR.Audio.sfx("missile", p.x);
    } else if (w === "laser") {
      p.fireCd = 0.05;
    }
  },
  laserBeam: function (dt) {
    var p = this.player, dmg = 55 * dt * this.g.diff.dmg * p.power * (p.dmgMul || 1);
    var y0 = p.y - 6 - p.power * 2, y1 = p.y + 6 + p.power * 2;
    var self = this;
    this.enemies.each(function (e) {
      if (e.x > p.x && e.y > y0 - e.r && e.y < y1 + e.r) self.hurtEnemy(e, dmg);
    });
    if (this.g.boss) this.g.boss.laserHit(p.x, y0, y1, dmg);
    if (Math.random() < 0.4) AR.Particles.spark(AR.rand(p.x + 40, AR.W), p.y, "#ff4ad2");
  },
  launchMissile: function (x, y, dmg) {
    this.missiles.spawn(function (b) {
      b.x = x; b.y = y; b.vx = 280; b.vy = AR.rand(-40, 40);
      b.dmg = dmg; b.col = "#7cff6a"; b.r = 5; b.life = 2.4; b.homing = 520; b.friendly = true;
    });
  },
  chargedBlast: function () {
    var p = this.player, dmg = 90 * this.g.diff.dmg * (1 + p.power * 0.2);
    for (var i = -2; i <= 2; i++) this.pShot(p.x + 30, p.y + i * 8, 900, i * 40, dmg, "#fff", 10, 6);
    AR.Particles.explode(p.x + 40, p.y, false);
    AR.Audio.sfx("chargeFire", p.x);
    AR.FX.boom(6);
    p.energy = Math.min(100, p.energy + 8);
  },
  doSpecial: function () {
    var p = this.player;
    if (p.dead) return;
    if (p.bombs > 0) {
      p.bombs--;
      this.bomb();
    } else if (p.energy >= 50) {
      p.energy -= 50;
      this.energyWave();
    }
  },
  bomb: function () {
    var p = this.player, self = this;
    AR.Audio.sfx("special", p.x);
    AR.FX.boom(16); AR.FX.white(0.55); AR.Input.rumble(200, 0.8);
    AR.Particles.explode(p.x, p.y, true);
    this.eBullets.clear();
    this.enemies.each(function (e) { self.hurtEnemy(e, 80); });
    if (this.g.boss) this.g.boss.hurt(90, p.x, p.y);
    p.inv = Math.max(p.inv, 1.2);
  },
  energyWave: function () {
    var p = this.player, self = this;
    AR.Audio.sfx("special", p.x);
    AR.FX.boom(10); AR.FX.white(0.3);
    this.eBullets.each(function (b) {
      if (AR.len(b.x - p.x, b.y - p.y) < 280) b.alive = false;
    });
    this.enemies.each(function (e) {
      if (AR.len(e.x - p.x, e.y - p.y) < 340) self.hurtEnemy(e, 45);
    });
    if (this.g.boss) this.g.boss.hurt(40, p.x, p.y);
    p.inv = Math.max(p.inv, 0.6);
  },

  updatePlayer: function (dt) {
    var p = this.player;
    if (p.dead) {
      p.deadT += dt;
      if (p.deadT > 1.4 && p.lives > 0) {
        p.lives--;
        p.power = Math.max(1, p.power - 1);
        this.spawnPickup(p.x + 80, p.y, "P");
        this.resetPlayer();
        this.g.noDeath = false;
      }
      return;
    }
    p.focus = AR.Input.btn("focus");
    var spd = (p.focus ? 210 : 460) * (p.speedBoost > 0 ? 1.35 : 1) * (p.speedMul || 1);
    var ax = AR.Input.axis();
    p.x = AR.clamp(p.x + ax.x * spd * dt, 40, AR.W - 48);
    p.y = AR.clamp(p.y + ax.y * spd * dt, 50, AR.H - 50);
    p.vy = ax.y * spd;
    var want = 0;
    if (ax.y < -0.18) want = 0.82;
    else if (ax.y > 0.18) want = -0.82;
    p.roll += (want - (p.roll || 0)) * Math.min(1, (want ? 18 : 11) * dt);
    p.inv = Math.max(0, p.inv - dt);
    p.hurtBlink = p.inv > 0;
    p.shield = Math.max(0, p.shield - dt);
    p.speedBoost = Math.max(0, p.speedBoost - dt);
    p.energy = Math.min(100, p.energy + dt * 6);
    p.chainT = Math.max(0, p.chainT - dt);
    if (p.chainT <= 0) { p.chain = 0; p.mul = Math.max(1, p.mul - dt * 0.4); }
    this.fireWeapon(dt);
    if (AR.Input.btnPressed("special") || AR.Input.btnPressed("bomb")) this.doSpecial();
  },

  updateBullets: function (dt) {
    var self = this;
    this.pBullets.each(function (b) {
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      if (b.life <= 0 || b.x > AR.W + 40 || b.y < -40 || b.y > AR.H + 40) b.alive = false;
    });
    this.eBullets.each(function (b) {
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      if (b.life <= 0 || b.x < -40 || b.x > AR.W + 60 || b.y < -40 || b.y > AR.H + 40) b.alive = false;
    });
    this.missiles.each(function (b) {
      var tgt = self.nearestEnemy(b.x, b.y);
      if (tgt) {
        var n = AR.norm(tgt.x - b.x, tgt.y - b.y);
        b.vx += n.x * b.homing * dt;
        b.vy += n.y * b.homing * dt;
        var sp = AR.len(b.vx, b.vy);
        if (sp > 720) { b.vx *= 720 / sp; b.vy *= 720 / sp; }
      }
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      AR.Particles.pool.spawn(function (p) {
        p.x = b.x; p.y = b.y; p.vx = 0; p.vy = 0; p.life = p.max = 0.15; p.r = 3; p.col = "#7cff6a"; p.g = 1; p.drag = 1; p.type = 0;
      });
      if (b.life <= 0 || b.x > AR.W + 40) b.alive = false;
    });
  },
  nearestEnemy: function (x, y) {
    var best = null, bd = 1e9;
    this.enemies.each(function (e) {
      var d = (e.x - x) * (e.x - x) + (e.y - y) * (e.y - y);
      if (d < bd) { bd = d; best = e; }
    });
    if (this.g.boss && this.g.boss.alive) {
      var d2 = (this.g.boss.x - x) * (this.g.boss.x - x) + (this.g.boss.y - y) * (this.g.boss.y - y);
      if (d2 < bd) return this.g.boss;
    }
    return best;
  },

  updateEnemies: function (dt) {
    var self = this, p = this.player;
    this.enemies.each(function (e) {
      e.t += dt; e.flash = Math.max(0, e.flash - dt * 8);
      AR.Combat.AI[e.ai](e, dt, self, p);
      if (e.x < -120 || e.y < -160 || e.y > AR.H + 160) e.alive = false;
      if (!p.dead && p.inv <= 0) {
        var hit = e.solid
          ? AR.aabbHit(p.x, p.y, 14, 14, e.x, e.y, e.w, e.h)
          : AR.circleHit(p.x + 4, p.y, 6, e.x, e.y, e.r * 0.7);
        if (hit) self.hurtPlayer(e.x, e.y);
      }
    });
  },
  updatePickups: function (dt) {
    var p = this.player, self = this;
    this.pickups.each(function (u) {
      u.t += dt;
      u.x += u.vx * dt;
      u.y += Math.sin(u.t * 3) * 18 * dt;
      if (u.x < p.x + 180) {
        var n = AR.norm(p.x - u.x, p.y - u.y);
        u.x += n.x * 220 * dt; u.y += n.y * 220 * dt;
      }
      if (!p.dead && AR.circleHit(p.x, p.y, 28, u.x, u.y, u.r)) {
        self.collect(u.kind);
        u.alive = false;
      }
      if (u.x < -40) u.alive = false;
    });
  },
  collect: function (k) {
    var p = this.player;
    AR.Audio.sfx("pickup", p.x);
    AR.Particles.spark(p.x, p.y, "#fff");
    this.g.addScore(200, false);
    if (k === "P") p.power = Math.min(4, p.power + 1);
    else if (k === "L") p.weapon = "laser";
    else if (k === "S") p.weapon = "spread";
    else if (k === "M") p.weapon = "missile";
    else if (k === "H") p.hp = Math.min(p.maxHp, p.hp + 1);
    else if (k === "D") { p.shield = 8; AR.Audio.sfx("shield", p.x); }
    else if (k === "B") p.bombs = Math.min(5, p.bombs + 1);
    else if (k === "X") p.mul = Math.min(8, p.mul + 1);
    else if (k === "V") p.speedBoost = 6;
  },

  collide: function () {
    var self = this;
    this.pBullets.each(function (b) {
      self.enemies.each(function (e) {
        if (!b.alive) return;
        if (AR.circleHit(b.x, b.y, b.r + 4, e.x, e.y, e.r)) {
          self.hurtEnemy(e, b.dmg);
          if (b.pierce > 0) b.pierce--;
          else b.alive = false;
        }
      });
      if (b.alive && self.g.boss && self.g.boss.alive) {
        if (self.g.boss.hitBullet(b)) {
          if (b.pierce > 0) b.pierce--;
          else b.alive = false;
        }
      }
    });
    this.missiles.each(function (b) {
      self.enemies.each(function (e) {
        if (!b.alive) return;
        if (AR.circleHit(b.x, b.y, 10, e.x, e.y, e.r)) {
          self.hurtEnemy(e, b.dmg);
          AR.Particles.explode(b.x, b.y, false);
          b.alive = false;
        }
      });
      if (b.alive && self.g.boss && self.g.boss.alive && self.g.boss.hitBullet(b)) {
        AR.Particles.explode(b.x, b.y, false);
        b.alive = false;
      }
    });
    var p = this.player;
    if (!p.dead && p.inv <= 0) {
      this.eBullets.each(function (b) {
        if (!b.alive) return;
        var rad = p.focus ? 5 : 7;
        if (AR.circleHit(p.x + 4, p.y, rad, b.x, b.y, b.r)) {
          b.alive = false;
          self.hurtPlayer(b.x, b.y);
        }
      });
    }
  },
  hurtEnemy: function (e, dmg) {
    if (e.solid) return;
    e.hp -= dmg;
    e.flash = 1;
    AR.Particles.spark(e.x, e.y, "#fff");
    if (e.hp <= 0) this.killEnemy(e);
  },
  killEnemy: function (e) {
    e.alive = false;
    var big = e.mini || e.max > 40;
    AR.Particles.explode(e.x, e.y, big);
    AR.Audio.sfx(big ? "explodeBig" : "explode", e.x);
    if (big) AR.FX.boom(10);
    this.g.kills++;
    this.g.statsKills++;
    var p = this.player;
    p.chain++;
    p.chainT = 2.2;
    p.mul = Math.min(8, 1 + Math.floor(p.chain / 8));
    var sc = e.score * (big ? 2 : 1);
    this.g.addScore(sc, true);
    if (Math.random() < e.drop * this.g.diff.drops) {
      var table = ["P", "P", "P", "L", "S", "M", "H", "D", "B", "X", "V"];
      this.spawnPickup(e.x, e.y, AR.pick(table));
    }
  },
  hurtPlayer: function (x, y) {
    var p = this.player;
    if (p.dead || p.inv > 0) return;
    if (p.shield > 0) {
      p.shield = 0;
      p.inv = 0.8;
      AR.Audio.sfx("shield", p.x);
      AR.Particles.burst(p.x, p.y, 20, "#8df", 200, 3);
      return;
    }
    p.hp--;
    p.inv = this.g.diff.iframes;
    p.mul = Math.max(1, p.mul * 0.5);
    p.chain = 0;
    AR.Audio.sfx("hurt", p.x);
    AR.FX.boom(12); AR.FX.white(0.25); AR.Input.rumble(140, 0.7);
    AR.Particles.explode(p.x, p.y, false);
    this.g.deaths++;
    if (p.hp <= 0) {
      p.dead = true; p.deadT = 0;
      AR.Audio.sfx("explodeBig", p.x);
      AR.Particles.explode(p.x, p.y, true);
      this.g.noDeath = false;
    }
  },

  draw: function (ctx, t) {
    var self = this;
    this.pickups.each(function (u) {
      var spr = AR.Gfx.sprites.pickup[u.kind];
      AR.Gfx.glow(ctx, u.x, u.y, 22, "rgba(180,255,255,0.5)", 0.5 + Math.sin(u.t * 8) * 0.2);
      if (spr) ctx.drawImage(spr, u.x - 18, u.y - 18);
    });
    this.enemies.each(function (e) { AR.Gfx.drawEnemy(ctx, e, t); });
    this.pBullets.each(function (b) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = b.col;
      ctx.globalAlpha = 0.95;
      ctx.fillRect(b.x - 10, b.y - 2, 18, 4);
      ctx.fillStyle = "#fff";
      ctx.fillRect(b.x - 4, b.y - 1, 8, 2);
      ctx.restore();
    });
    this.missiles.each(function (b) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = "#7cff6a";
      ctx.translate(b.x, b.y);
      ctx.rotate(Math.atan2(b.vy, b.vx));
      ctx.fillRect(-8, -2, 16, 4);
      ctx.restore();
    });
    this.eBullets.each(function (b) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      AR.Gfx.glow(ctx, b.x, b.y, b.r * 2.4, b.col, 0.45);
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(b.x, b.y, Math.max(2.5, b.r * 0.45), 0, 6.28); ctx.fill();
      ctx.strokeStyle = b.col;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 6.28); ctx.stroke();
      ctx.restore();
    });
    var p = this.player;
    if (p.weapon === "laser" && AR.Input.btn("fire") && !p.dead) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      var w = 6 + p.power * 3 + (p.craftId === "sable" ? 4 : 0);
      var col = (AR.craft(p.craftId).accent) || "#ff4ad2";
      var grd = ctx.createLinearGradient(p.x, p.y, AR.W, p.y);
      grd.addColorStop(0, "#fff");
      grd.addColorStop(0.2, col);
      grd.addColorStop(1, "rgba(255,0,120,0)");
      ctx.fillStyle = grd;
      ctx.globalAlpha = 0.85;
      ctx.fillRect(p.x + 20, p.y - w / 2, AR.W - p.x, w);
      ctx.globalAlpha = 0.4;
      ctx.fillRect(p.x + 20, p.y - w, AR.W - p.x, w * 2);
      ctx.restore();
    }
    if (!p.dead) AR.Gfx.drawPlayer(ctx, p, t);
    else {
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - p.deadT);
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(p.x, p.y, 40 + p.deadT * 80, 0, 6.28); ctx.fill();
      ctx.restore();
    }
  }
};

AR.Combat.KINDS = {
  wasp:   { spr: "wasp", hp: 6, r: 16, w: 40, h: 22, vx: -220, score: 150, ai: "sine", drop: 0.08, shot: "aimed", rate: 1.6, amp: 70 },
  drone:  { spr: "drone", hp: 10, r: 18, w: 40, h: 28, vx: -140, score: 200, ai: "hover", drop: 0.12, shot: "aimed", rate: 1.3 },
  kami:   { spr: "kami", hp: 5, r: 14, w: 40, h: 18, vx: -160, score: 220, ai: "kami", drop: 0.06, shot: null, rate: 9 },
  armor:  { spr: "armor", hp: 42, r: 26, w: 70, h: 36, vx: -90, score: 600, ai: "tank", drop: 0.28, shot: "fan", rate: 1.8, hpBar: true },
  turret: { spr: "turret", hp: 18, r: 18, w: 40, h: 30, vx: -120, score: 250, ai: "turret", drop: 0.1, shot: "aimed", rate: 1.1 },
  pop:    { spr: "drone", hp: 8, r: 16, w: 36, h: 28, vx: -80, score: 180, ai: "pop", drop: 0.1, shot: "ring", rate: 2 },
  diver:  { spr: "wasp", hp: 7, r: 16, w: 40, h: 22, vx: -100, score: 170, ai: "diver", drop: 0.08, shot: "aimed", rate: 1.4 },
  squid:  { spr: "squid", hp: 14, r: 20, w: 50, h: 36, vx: -130, score: 280, ai: "snake", drop: 0.14, shot: "aimed", rate: 1.5 },
  gunship:{ spr: "gunship", hp: 70, r: 36, w: 110, h: 50, vx: -70, score: 1200, ai: "gunship", drop: 0.5, shot: "fan", rate: 1.2, hpBar: true, mini: true },
  mine:   { spr: "mine", hp: 4, r: 14, w: 28, h: 28, vx: -100, score: 80, ai: "mine", drop: 0.04, shot: null, rate: 9 },
  swarm:  { spr: "wasp", hp: 3, r: 12, w: 28, h: 16, vx: -260, score: 80, ai: "form", drop: 0.04, shot: null, rate: 3 },
  heavy:  { spr: "armor", hp: 28, r: 22, w: 60, h: 32, vx: -110, score: 400, ai: "hover", drop: 0.2, shot: "fan", rate: 1.6 },
  hazard: { spr: "armor", hp: 9999, r: 36, w: 64, h: 90, vx: -170, score: 0, ai: "drift", drop: 0, shot: null, rate: 99, solid: true },
  coil:   { spr: "wasp", hp: 55, r: 18, w: 44, h: 28, vx: -200, score: 1800, ai: "coil", drop: 0.45, shot: "aimed", rate: 1.1, hpBar: true, mini: true },
  coilseg:{ spr: "wasp", hp: 16, r: 14, w: 30, h: 22, vx: -200, score: 80, ai: "coilseg", drop: 0, shot: null, rate: 99 },
  walker: { spr: "armor", hp: 26, r: 20, w: 56, h: 36, vx: -100, score: 420, ai: "walker", drop: 0.18, shot: "aimed", rate: 1.5 }
};

AR.Combat.AI = {
  drift: function (e, dt) {
    e.x += e.vx * dt;
  },
  sine: function (e, dt, c, p) {
    e.x += e.vx * dt;
    e.y += Math.sin(e.t * 2.2 + e.phase) * e.amp * dt * 2.2;
    e.fire += dt;
    if (e.shot && e.fire > e.rate) { e.fire = 0; c.aimedShot(e.x - 10, e.y, p.x, p.y, 280, 5, "#ff6688"); }
  },
  hover: function (e, dt, c, p) {
    e.x += e.vx * dt;
    if (e.x < AR.W - 180) e.vx = Math.max(e.vx, -40);
    e.y += Math.sin(e.t * 1.4) * 40 * dt;
    e.fire += dt;
    if (e.fire > e.rate) {
      e.fire = 0;
      if (e.shot === "fan") c.fanShot(e.x, e.y, p.x, p.y, 3, 0.18, 300, "#ff5577");
      else c.aimedShot(e.x, e.y, p.x, p.y, 320, 5, "#ff6688");
    }
  },
  kami: function (e, dt, c, p) {
    if (e.t < 0.55) { e.x += e.vx * dt; }
    else {
      var n = AR.norm(p.x - e.x, p.y - e.y);
      e.vx += n.x * 520 * dt; e.vy += n.y * 520 * dt;
      var sp = AR.len(e.vx, e.vy);
      if (sp > 520) { e.vx *= 520 / sp; e.vy *= 520 / sp; }
      e.x += e.vx * dt; e.y += e.vy * dt;
      e.rot = Math.atan2(e.vy, e.vx);
    }
  },
  tank: function (e, dt, c, p) {
    e.x += e.vx * dt;
    e.fire += dt;
    if (e.fire > e.rate) { e.fire = 0; c.fanShot(e.x - 20, e.y, p.x, p.y, 5, 0.14, 260, "#ff8866"); }
  },
  turret: function (e, dt, c, p) {
    e.x += e.vx * dt;
    e.fire += dt;
    if (e.fire > e.rate) { e.fire = 0; c.aimedShot(e.x, e.y, p.x, p.y, 360, 4, "#ffaa44"); }
  },
  pop: function (e, dt, c, p) {
    if (e.t < 0.6) { e.scale = e.t / 0.6; e.x += -30 * dt; }
    else {
      e.scale = 1;
      e.x += e.vx * dt;
      e.fire += dt;
      if (e.fire > e.rate) { e.fire = 0; c.ringShot(e.x, e.y, 6, 180, "#ffcc66", e.t); }
    }
  },
  diver: function (e, dt, c, p) {
    if (!e.extra.from) e.extra.from = e.y < AR.H / 2 ? 1 : -1;
    e.x += -180 * dt;
    e.y += e.extra.from * 220 * dt;
    e.fire += dt;
    if (e.fire > e.rate) { e.fire = 0; c.aimedShot(e.x, e.y, p.x, p.y, 300, 5, "#ff6688"); }
  },
  snake: function (e, dt, c, p) {
    e.x += e.vx * dt;
    e.y += Math.sin(e.t * 3 + e.phase) * 160 * dt;
    e.rot = Math.sin(e.t * 3) * 0.4;
    e.fire += dt;
    if (e.fire > e.rate) { e.fire = 0; c.aimedShot(e.x, e.y, p.x, p.y, 250, 6, "#66ffaa"); }
  },
  gunship: function (e, dt, c, p) {
    e.x += e.vx * dt;
    if (e.x < AR.W - 260) e.vx = -20;
    e.y += Math.sin(e.t * 0.8) * 30 * dt;
    e.fire += dt;
    if (e.fire > e.rate) {
      e.fire = 0;
      c.fanShot(e.x - 30, e.y - 10, p.x, p.y, 4, 0.12, 280, "#ff5577");
      c.eShot(e.x - 20, e.y + 18, -340, 0, 6, "#ffaa44");
    }
  },
  mine: function (e, dt, c, p) {
    e.x += e.vx * dt;
    e.rot += dt * 2;
    if (AR.len(e.x - p.x, e.y - p.y) < 90 && !p.dead) {
      c.ringShot(e.x, e.y, 8, 220, "#ff6622", 0);
      c.killEnemy(e);
    }
  },
  form: function (e, dt, c, p) {
    e.x += e.vx * dt;
    e.y += Math.sin(e.t * 4 + e.phase) * 50 * dt;
  },
  coil: function (e, dt, c, p) {
    if (!e.trail) e.trail = [];
    if (e.t < 1.35) {
      e.x += -240 * dt;
      e.y += (p.y - e.y) * 1.4 * dt;
    } else {
      e.orbit = (e.orbit || 0) + dt * 2.35;
      var rad = 155 + Math.sin(e.t * 0.8) * 18;
      var tx = p.x + 40 + Math.cos(e.orbit) * rad;
      var ty = AR.clamp(p.y + Math.sin(e.orbit) * rad, 70, AR.H - 70);
      e.x += (tx - e.x) * 5.2 * dt;
      e.y += (ty - e.y) * 5.2 * dt;
    }
    var dx = e.x - (e._lx || e.x), dy = e.y - (e._ly || e.y);
    if (dx * dx + dy * dy > 0.4) e.rot = Math.atan2(dy, dx);
    e._lx = e.x; e._ly = e.y;
    e.trail.unshift({ x: e.x, y: e.y, rot: e.rot });
    if (e.trail.length > 90) e.trail.pop();
    e.fire += dt;
    if (e.fire > e.rate && e.t > 1.4) {
      e.fire = 0;
      c.aimedShot(e.x, e.y, p.x, p.y, 280, 5, "#66ffcc");
    }
  },
  coilseg: function (e, dt, c) {
    var head = e.extra && e.extra.head;
    if (!head || !head.alive) {
      e.tDead = (e.tDead || 0) + dt;
      e.x += (e.vx || -40) * dt;
      e.y += Math.sin(e.t * 8) * 40 * dt;
      e.rot += dt * 5;
      if (e.tDead > 0.07 * (e.extra.seg || 1)) c.killEnemy(e);
      return;
    }
    var tr = head.trail || [];
    var idx = Math.min(tr.length - 1, (e.extra.seg || 1) * 6);
    if (idx >= 0 && tr[idx]) {
      e.x = tr[idx].x;
      e.y = tr[idx].y;
      e.rot = tr[idx].rot;
    }
  },
  walker: function (e, dt, c, p) {
    var side = e.extra && e.extra.side < 0 ? -1 : 1;
    var rail = side < 0 ? 88 : AR.H - 88;
    e.x += e.vx * dt;
    e.y += (rail - e.y) * 6 * dt;
    e.rot = side < 0 ? 0.15 : -0.15;
    e.fire += dt;
    if (e.fire > e.rate) {
      e.fire = 0;
      c.aimedShot(e.x, e.y, p.x, p.y, 300, 5, "#ffaa66");
    }
  }
};
