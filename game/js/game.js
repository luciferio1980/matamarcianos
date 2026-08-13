/* AETHER RAZE — game state machine + main loop */
AR.Game = {
  state: "boot",
  canvas: null,
  ctx: null,
  last: 0,
  acc: 0,
  t: 0,
  stage: 0,
  diff: AR.DIFF.arcade,
  score: 0,
  events: [],
  ei: 0,
  clock: 0,
  boss: null,
  scroll: 140,
  scrollMul: 1,
  tunnel: 0,
  noDeath: true,
  kills: 0,
  deaths: 0,
  statsKills: 0,
  runTime: 0,
  clearBonus: { noDeath: 0, boss: 0, time: 0 },
  continueStage: 0,
  pausedFrom: "play",
  fade: 0,
  introT: 0,
  clearT: 0,
  overT: 0,

  boot: function (canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });
    canvas.width = AR.W;
    canvas.height = AR.H;
    AR.Save.load();
    AR.Input.init();
    AR.Particles.init();
    AR.Combat.init(this);
    this.combat = AR.Combat;
    AR.fitCanvas(canvas);
    var self = this;
    window.addEventListener("resize", function () { AR.fitCanvas(canvas); });
    window.addEventListener("keydown", function (e) {
      if (e.code === "F11") { e.preventDefault(); AR.toggleFullscreen(); }
      if (e.code === "KeyF" && e.altKey) AR.toggleFullscreen();
    });
    this.state = "title";
    this.last = performance.now();
    requestAnimationFrame(function (n) { self.frame(n); });
  },

  frame: function (now) {
    var self = this;
    var dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    try { AR.Audio.tick(); } catch (err) {}
    try {
      if (AR.FX.hitstop > 0) {
        AR.FX.update(dt);
      } else {
        this.update(dt);
        AR.FX.update(dt);
      }
      this.draw();
    } catch (err) {
      if (!this._logged) { this._logged = true; console.error(err); }
    }
    AR.Input.endFrame();
    requestAnimationFrame(function (n) { self.frame(n); });
  },

  setState: function (s) {
    this.state = s;
    AR.UI.idx = 0;
    if (s === "title") AR.Audio.play("title");
    if (s === "menu") AR.Audio.play("menu");
    if (s === "hangar") AR.Audio.play("hangar");
    if (s === "victory") AR.Audio.play("victory");
    if (s === "gameover") AR.Audio.play("over");
  },

  newRun: function (diffId, startStage) {
    this.diff = AR.DIFF[diffId] || AR.DIFF.arcade;
    this.stage = startStage || 0;
    this.score = 0;
    this.kills = 0;
    this.deaths = 0;
    this.statsKills = 0;
    this.runTime = 0;
    this.continueStage = this.stage;
    this._flushed = false;
    AR.Save.data.stats.runs++;
    AR.Save.write();
    AR.Combat.player = AR.Combat._player();
    AR.Combat.applyCraft(AR.craft(this.craftPick || AR.Save.data.options.craft || "aurora"));
    this.startStage();
  },

  startStage: function () {
    this.boss = null;
    this.clock = 0;
    this.ei = 0;
    this.scrollMul = 1;
    this.tunnel = 0;
    this.tunnelGap = 330;
    this.tunnelSway = 80;
    this.noDeath = true;
    this.kills = 0;
    this.events = AR.Stages.build(this.stage, this.diff.extra);
    AR.Combat.clearWorld();
    AR.Combat.resetPlayer();
    AR.Particles.pool.clear();
    AR.Background.reset();
    this.fade = 1;
    this.setState("stageTitle");
    this.introT = 0;
    var keys = ["steel", "ocean", "red", "neon", "bio", "core"];
    AR.Audio.play(keys[this.stage]);
  },

  tunnelShape: function () {
    if (this.tunnel <= 0) return null;
    var gap = this.tunnelGap || 330;
    var sway = this.tunnelSway || 80;
    var mid = AR.H * 0.5 + Math.sin(this.t * 0.85 + AR.Background.cam * 0.004) * sway;
    var top = AR.clamp(mid - gap * 0.5, 50, 420);
    var bot = AR.clamp(AR.H - (mid + gap * 0.5), 50, 420);
    return { top: top, bot: bot };
  },
  drawTunnel: function (ctx) {
    var sh = this.tunnelShape();
    if (!sh) return;
    var cam = AR.Background.cam;
    var t = this.t;
    ctx.fillStyle = "#0a0610";
    ctx.fillRect(0, 0, AR.W, sh.top);
    ctx.fillRect(0, AR.H - sh.bot, AR.W, sh.bot);
    var span = 52;
    var off = -((cam * 1.55) % span);
    for (var x = off; x < AR.W + span; x += span) {
      ctx.fillStyle = "#161018";
      ctx.fillRect(x, 0, 14, sh.top);
      ctx.fillRect(x, AR.H - sh.bot, 14, sh.bot);
      ctx.fillStyle = "#2a2030";
      ctx.fillRect(x + 3, 0, 4, sh.top);
      ctx.fillRect(x + 3, AR.H - sh.bot, 4, sh.bot);
      ctx.fillStyle = "rgba(255,80,140," + (0.18 + Math.sin(t * 8 + x * 0.02) * 0.12) + ")";
      ctx.beginPath();
      ctx.moveTo(x + 6, sh.top);
      ctx.lineTo(x + 18, sh.top - 16);
      ctx.lineTo(x - 6, sh.top - 16);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + 6, AR.H - sh.bot);
      ctx.lineTo(x + 18, AR.H - sh.bot + 16);
      ctx.lineTo(x - 6, AR.H - sh.bot + 16);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(255,70,140,0.35)";
    ctx.fillRect(0, sh.top - 8, AR.W, 8);
    ctx.fillRect(0, AR.H - sh.bot, AR.W, 8);
    ctx.fillStyle = "rgba(255,180,80,0.15)";
    ctx.fillRect(0, sh.top - 3, AR.W, 3);
    ctx.fillRect(0, AR.H - sh.bot, AR.W, 3);
  },

  startBoss: function () {
    if (this.boss) return;
    this.boss = new AR.Boss(this.stage, this);
    AR.Audio.sfx("boss");
    AR.Audio.play(["steelBoss", "oceanBoss", "redBoss", "neonBoss", "bioBoss", "coreBoss"][this.stage]);
    AR.FX.boom(14);
    AR.UI.toastMsg("¡ALERTA DE JEFE!");
    this.setState("bossIntro");
    this.introT = 0;
  },

  onBossDead: function () {
    var timeB = Math.max(0, 8000 - (this.clock | 0) * 40);
    this.clearBonus = {
      noDeath: this.noDeath ? 20000 * (this.stage + 1) : 0,
      boss: 15000 * (this.stage + 1),
      time: timeB
    };
    this.addScore(this.clearBonus.noDeath + this.clearBonus.boss + this.clearBonus.time, false);
    AR.Save.data.stats.bosses++;
    AR.Save.data.progress.unlockedStage = Math.max(AR.Save.data.progress.unlockedStage, this.stage + 1);
    AR.Save.write();
    this.boss = null;
    this.clearT = 0;
    this.setState("stageClear");
    AR.Audio.play("menu");
  },

  addScore: function (n, mul) {
    var m = mul ? this.combat.player.mul : 1;
    this.score += Math.round(n * m);
  },
  flushStats: function () {
    if (this._flushed) return;
    this._flushed = true;
    AR.Save.data.stats.kills += this.statsKills;
    AR.Save.data.stats.deaths += this.deaths;
    AR.Save.data.stats.time += this.runTime | 0;
    AR.Save.write();
  },

  toast: function (s) { AR.UI.toastMsg(s); },

  update: function (dt) {
    this.t += dt;
    AR.UI.updateToast(dt);
    var st = this.state;
    if (st === "title") {
      if (AR.Input.anyPressed() || AR.Input.pressed.Space || AR.Input.pressed.Enter) {
        AR.Audio.unlock();
        this.setState("menu");
      }
      AR.Background.update(dt, 40);
      return;
    }
    if (st === "menu") this.updMenu();
    else if (st === "difficulty") this.updDiff();
    else if (st === "hangar") this.updHangar();
    else if (st === "options") this.updOptions();
    else if (st === "audio") this.updAudio();
    else if (st === "video") this.updVideo();
    else if (st === "controls") this.updControls();
    else if (st === "credits") { if (AR.Input.anyPressed() || AR.Input.btnPressed("pause")) this.setState("menu"); }
    else if (st === "scores") { if (AR.Input.anyPressed() || AR.Input.btnPressed("pause")) this.setState("menu"); }
    else if (st === "stageSelect") this.updStageSelect();
    else if (st === "intro") this.updIntro(dt);
    else if (st === "stageTitle") this.updStageTitle(dt);
    else if (st === "play" || st === "bossIntro") this.updPlay(dt);
    else if (st === "pause") this.updPause();
    else if (st === "gameover") this.updOver();
    else if (st === "stageClear") this.updClear(dt);
    else if (st === "victory") { if (AR.Input.pressed.Space || AR.Input.pressed.Enter || AR.Input.btnPressed("fire")) { AR.UI.nameI = 0; this.setState("name"); } }
    else if (st === "name") this.updName();
  },

  updMenu: function () {
    var a = AR.UI.step(AR.UI.menu.length);
    if (a === "ok") {
      var i = AR.UI.idx;
      if (i === 0) { this._continue = false; AR.UI.idx = 1; this.setState("difficulty"); }
      else if (i === 1) {
        AR.UI.idx = 1;
        this.continueStage = Math.min(5, AR.Save.data.progress.unlockedStage);
        this.setState("difficulty");
        this._continue = true;
      } else if (i === 2) { AR.UI.idx = 0; this.setState("stageSelect"); }
      else if (i === 3) this.setState("scores");
      else if (i === 4) this.setState("options");
      else if (i === 5) this.setState("credits");
    }
  },
  updDiff: function () {
    var a = AR.UI.step(4);
    if (AR.Input.btnPressed("pause") || AR.Input.pressed.Escape) { this._continue = false; this.setState("menu"); return; }
    if (a === "ok") {
      var id = AR.UI.diffs[AR.UI.idx];
      if (id === "inferno" && !AR.Save.data.progress.inferno) {
        AR.Audio.sfx("warn");
        AR.UI.toastMsg("INFIERNO BLOQUEADO");
        return;
      }
      var start = this._continue ? this.continueStage : 0;
      this._continue = false;
      this.diffPick = id;
      this.startPick = start;
      AR.UI.craftI = AR.craftIndex(AR.Save.data.options.craft || "aurora");
      this.setState("hangar");
    }
  },
  updHangar: function () {
    var n = AR.CRAFTS.length;
    var x = 0;
    if (AR.Input.pressed.ArrowLeft || AR.Input.pressed.KeyA) x = -1;
    if (AR.Input.pressed.ArrowRight || AR.Input.pressed.KeyD) x = 1;
    var gp = AR.Input.pad();
    if (gp) {
      var lf = gp.buttons[14] && gp.buttons[14].pressed;
      var rt = gp.buttons[15] && gp.buttons[15].pressed;
      if (lf && !AR.Input.padPrev.menuLeft) x = -1;
      if (rt && !AR.Input.padPrev.menuRight) x = 1;
      AR.Input.padPrev.menuLeft = !!lf;
      AR.Input.padPrev.menuRight = !!rt;
    }
    if (x) {
      AR.UI.craftI = (AR.UI.craftI + x + n) % n;
      AR.Audio.sfx("menu");
    }
    if (AR.Input.btnPressed("pause") || AR.Input.pressed.Escape) {
      this.setState("difficulty");
      return;
    }
    if (AR.Input.pressed.Enter || AR.Input.pressed.Space || AR.Input.btnPressed("fire") || AR.Input.btnPressed("confirm")) {
      var c = AR.CRAFTS[AR.UI.craftI] || AR.CRAFTS[0];
      this.craftPick = c.id;
      AR.Save.data.options.craft = c.id;
      AR.Save.write();
      AR.Audio.sfx("confirm");
      this.introT = 0;
      this.setState("intro");
      AR.Audio.play("title");
    }
  },
  updOptions: function () {
    var a = AR.UI.step(4);
    if (a === "ok") {
      if (AR.UI.idx === 0) this.setState("audio");
      else if (AR.UI.idx === 1) this.setState("video");
      else if (AR.UI.idx === 2) this.setState("controls");
      else this.setState(this.pausedFrom === "pause" ? "pause" : "menu");
    }
    if (AR.Input.pressed.Escape) this.setState(this.pausedFrom === "pause" ? "pause" : "menu");
  },
  updAudio: function () {
    var o = AR.Save.data.options;
    if (AR.Input.pressed.ArrowLeft || AR.Input.pressed.KeyA) {
      if (AR.UI.idx === 0) o.master = AR.clamp(o.master - 0.05, 0, 1);
      if (AR.UI.idx === 1) o.music = AR.clamp(o.music - 0.05, 0, 1);
      if (AR.UI.idx === 2) o.sfx = AR.clamp(o.sfx - 0.05, 0, 1);
      AR.Audio.applyVol(); AR.Save.write(); AR.Audio.sfx("menu");
    }
    if (AR.Input.pressed.ArrowRight || AR.Input.pressed.KeyD) {
      if (AR.UI.idx === 0) o.master = AR.clamp(o.master + 0.05, 0, 1);
      if (AR.UI.idx === 1) o.music = AR.clamp(o.music + 0.05, 0, 1);
      if (AR.UI.idx === 2) o.sfx = AR.clamp(o.sfx + 0.05, 0, 1);
      AR.Audio.applyVol(); AR.Save.write(); AR.Audio.sfx("menu");
    }
    var a = AR.UI.step(4);
    if (a === "ok" && AR.UI.idx === 3) this.setState("options");
    if (AR.Input.pressed.Escape) this.setState("options");
  },
  updVideo: function () {
    var o = AR.Save.data.options;
    var a = AR.UI.step(5);
    if (a === "ok") {
      if (AR.UI.idx === 0) AR.toggleFullscreen();
      if (AR.UI.idx === 1) o.shake = !o.shake;
      if (AR.UI.idx === 2) o.bloom = !o.bloom;
      if (AR.UI.idx === 3) o.flash = !o.flash;
      if (AR.UI.idx === 4) this.setState("options");
      AR.Save.write();
    }
    if (AR.Input.pressed.Escape) this.setState("options");
  },
  updControls: function () {
    if (AR.Input.remap) return;
    var a = AR.UI.step(10);
    var keys = ["up", "down", "left", "right", "fire", "special", "focus", "pause"];
    if (a === "ok") {
      if (AR.UI.idx < 8) AR.Input.remap = keys[AR.UI.idx];
      else if (AR.UI.idx === 8) {
        AR.Save.data.options.keys = Object.assign({}, AR.DEFAULT_KEYS);
        AR.Save.write();
      } else this.setState("options");
    }
    if (AR.Input.pressed.Escape && !AR.Input.remap) this.setState("options");
  },
  updIntro: function (dt) {
    this.introT += dt;
    if (this.introT > 8.5 || AR.Input.pressed.Space || AR.Input.pressed.Enter || AR.Input.btnPressed("fire")) {
      this.newRun(this.diffPick, this.startPick);
    }
  },
  updStageTitle: function (dt) {
    this.introT += dt;
    AR.Background.update(dt, 80);
    if (this.introT > 2.2 || AR.Input.pressed.Space) this.setState("play");
  },
  updPlay: function (dt) {
    if (this.state === "bossIntro") {
      this.introT += dt;
      if (this.introT > 2.4) this.setState("play");
    }
    if (AR.Input.btnPressed("pause") || AR.Input.pressed.Escape) {
      this.pausedFrom = "pause";
      this.setState("pause");
      return;
    }
    this.runTime += dt;
    this.clock += dt;
    this.fade = Math.max(0, this.fade - dt * 1.5);
    if (this.tunnel > 0) {
      this.tunnel = Math.max(0, this.tunnel - dt);
      var sh = this.tunnelShape();
      var pl = AR.Combat.player;
      if (sh && !pl.dead && (pl.y < sh.top + 12 || pl.y > AR.H - sh.bot - 12)) AR.Combat.hurtPlayer(pl.x, pl.y);
    }

    var speed = this.scroll * this.scrollMul * (1 + this.stage * 0.06);
    AR.Background.update(dt, speed);
    AR.Particles.update(dt);

    while (this.ei < this.events.length && this.clock >= this.events[this.ei].t) {
      this.events[this.ei].fn(this);
      this.ei++;
    }

    AR.Combat.updatePlayer(dt);
    AR.Combat.updateEnemies(dt);
    AR.Combat.updateBullets(dt);
    AR.Combat.updatePickups(dt);
    if (this.boss && this.boss.alive) this.boss.update(dt);
    AR.Combat.collide();

    if (this.combat.player.dead && this.combat.player.lives <= 0 && this.combat.player.deadT > 1.6) {
      this.flushStats();
      this.setState("gameover");
    }
  },
  updPause: function () {
    var a = AR.UI.step(3);
    if (a === "back") { this.setState("play"); return; }
    if (a === "ok") {
      if (AR.UI.idx === 0) this.setState("play");
      else if (AR.UI.idx === 1) { this.pausedFrom = "pause"; this.setState("options"); }
      else { this.flushStats(); this.setState("menu"); }
    }
    if (AR.Input.btnPressed("pause") || AR.Input.pressed.Escape) this.setState("play");
  },
  updStageSelect: function () {
    var a = AR.UI.step(6);
    if (AR.Input.pressed.Escape || AR.Input.btnPressed("pause")) { this.setState("menu"); return; }
    if (a === "ok") {
      if (AR.UI.idx > AR.Save.data.progress.unlockedStage) {
        AR.Audio.sfx("warn");
        AR.UI.toastMsg("FASE BLOQUEADA");
        return;
      }
      this._continue = true;
      this.continueStage = AR.UI.idx;
      AR.UI.idx = 1;
      this.setState("difficulty");
    }
  },
  updOver: function () {
    var a = AR.UI.step(2);
    if (a === "ok") {
      if (AR.UI.idx === 0) this.startStage();
      else this.setState("menu");
    }
  },
  updClear: function (dt) {
    this.clearT += dt;
    if (this.clearT > 0.8 && (AR.Input.pressed.Space || AR.Input.pressed.Enter || AR.Input.btnPressed("fire"))) {
      if (this.stage >= 5) {
        AR.Save.data.progress.beaten = true;
        AR.Save.data.progress.inferno = true;
        this.flushStats();
        this.setState("victory");
      } else {
        this.stage++;
        this.continueStage = this.stage;
        this.startStage();
      }
    }
  },
  updName: function () {
    var L = AR.UI.letters;
    if (AR.Input.pressed.ArrowLeft || AR.Input.pressed.KeyA) AR.UI.nameI = (AR.UI.nameI + 2) % 3;
    if (AR.Input.pressed.ArrowRight || AR.Input.pressed.KeyD) AR.UI.nameI = (AR.UI.nameI + 1) % 3;
    if (AR.Input.pressed.ArrowUp || AR.Input.pressed.KeyW) {
      var i = L.indexOf(AR.UI.name[AR.UI.nameI]);
      AR.UI.name[AR.UI.nameI] = L[(i + 1) % L.length];
      AR.Audio.sfx("menu");
    }
    if (AR.Input.pressed.ArrowDown || AR.Input.pressed.KeyS) {
      var j = L.indexOf(AR.UI.name[AR.UI.nameI]);
      AR.UI.name[AR.UI.nameI] = L[(j - 1 + L.length) % L.length];
      AR.Audio.sfx("menu");
    }
    if (AR.Input.pressed.Enter || AR.Input.pressed.Space) {
      AR.Save.addScore({
        name: AR.UI.name.join(""),
        score: this.score | 0,
        diff: this.diff.id,
        stage: 6,
        t: Date.now()
      });
      this.setState("scores");
    }
  },

  draw: function () {
    var ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, AR.W, AR.H);

    var sh = AR.Save.data.options.shake ? AR.FX.shake : 0;
    if (sh > 0) ctx.translate((Math.random() - 0.5) * sh, (Math.random() - 0.5) * sh);

    var st = this.state;
    var playing = st === "play" || st === "pause" || st === "bossIntro" || st === "stageClear" || st === "gameover" || st === "victory" || st === "stageTitle";

    if (st === "title") {
      AR.UI.title(ctx, this.t, this);
    } else if (st === "menu") AR.UI.main(ctx, this.t);
    else if (st === "difficulty") AR.UI.difficulty(ctx);
    else if (st === "hangar") AR.UI.hangar(ctx, this.t);
    else if (st === "options") AR.UI.options(ctx);
    else if (st === "audio") AR.UI.audioMenu(ctx);
    else if (st === "video") AR.UI.videoMenu(ctx);
    else if (st === "controls") AR.UI.controls(ctx);
    else if (st === "credits") AR.UI.credits(ctx, this.t);
    else if (st === "scores") AR.UI.scores(ctx);
    else if (st === "stageSelect") AR.UI.stageSelect(ctx);
    else if (st === "intro") AR.UI.intro(ctx, this.introT);
    else if (st === "name") AR.UI.nameEntry(ctx, this);
    else if (playing) {
      AR.Background.drawBack(ctx, this.stage);
      if (this.tunnel > 0) this.drawTunnel(ctx);
      AR.Combat.draw(ctx, this.t);
      if (this.boss && this.boss.alive) this.boss.draw(ctx);
      AR.Particles.draw(ctx);
      AR.Background.drawFront(ctx, this.stage);

      if (AR.Save.data.options.bloom) {
        var b = AR.Gfx.bctx, b2 = AR.Gfx.bctx2;
        if (b && b2) {
          b.clearRect(0, 0, 640, 360);
          b.globalCompositeOperation = "source-over";
          b.drawImage(this.canvas, 0, 0, 640, 360);
          b2.clearRect(0, 0, 320, 180);
          b2.drawImage(AR.Gfx.bloom, 0, 0, 320, 180);
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          ctx.globalAlpha = 0.22;
          ctx.drawImage(AR.Gfx.bloom2, -18, -18, AR.W + 36, AR.H + 36);
          ctx.globalAlpha = 0.1;
          ctx.drawImage(AR.Gfx.bloom, -8, -8, AR.W + 16, AR.H + 16);
          ctx.restore();
        }
      }

      ctx.save();
      ctx.globalAlpha = 0.07;
      ctx.drawImage(AR.Gfx.grain, 0, 0, AR.W, AR.H);
      ctx.restore();

      var vg = ctx.createRadialGradient(960, 540, 280, 960, 540, 820);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(0,0,0,0.22)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, AR.W, AR.H);

      AR.UI.hud(ctx, this);
      if (st === "stageTitle") AR.UI.stageTitle(ctx, this, this.introT);
      if (st === "bossIntro") AR.UI.bossIntro(ctx, this);
      if (st === "pause") AR.UI.pause(ctx);
      if (st === "gameover") AR.UI.gameover(ctx, this);
      if (st === "stageClear") AR.UI.stageClear(ctx, this);
      if (st === "victory") AR.UI.victory(ctx, this, this.t);
      if (this.fade > 0) {
        ctx.fillStyle = "rgba(0,0,0," + this.fade + ")";
        ctx.fillRect(0, 0, AR.W, AR.H);
      }
    }

    if (AR.Save.data.options.flash && AR.FX.flash > 0) {
      ctx.fillStyle = "rgba(255,255,255," + AR.FX.flash * 0.55 + ")";
      ctx.fillRect(0, 0, AR.W, AR.H);
    }
  }
};

AR.boot = function () {
  var c = document.getElementById("game");
  var boot = document.getElementById("boot");
  var bar = document.getElementById("bootbar");
  AR.Gfx.init(function () {
    if (boot) boot.classList.add("hidden");
    AR.Game.boot(c);
    try {
      var q = new URLSearchParams(location.search);
      if (q.get("play") === "1") {
        var diff = q.get("diff") || "arcade";
        var st = parseInt(q.get("stage") || "0", 10);
        if (isNaN(st)) st = 0;
        AR.Game.craftPick = q.get("craft") || "aurora";
        try { AR.Audio.unlock(); } catch (e2) {}
        AR.Game.newRun(diff, AR.clamp(st, 0, 5));
      }
    } catch (e) {}
  }, function (p) {
    if (bar) bar.style.width = Math.round(p * 100) + "%";
  });
};
