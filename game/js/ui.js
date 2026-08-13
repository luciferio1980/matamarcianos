/* AETHER RAZE — menus, HUD, cinematics */
AR.UI = {
  menu: ["NUEVA PARTIDA", "CONTINUAR", "SELECCIÓN DE FASE", "PUNTUACIONES", "OPCIONES", "CRÉDITOS"],
  opt: ["AUDIO", "PANTALLA", "CONTROLES", "VOLVER"],
  audio: ["VOLUMEN MAESTRO", "MÚSICA", "EFECTOS", "VOLVER"],
  video: ["PANTALLA COMPLETA", "TEMBLOR", "BLOOM", "DESTELLOS", "VOLVER"],
  diffs: ["novice", "arcade", "veteran", "inferno"],
  idx: 0,
  craftI: 0,
  sub: 0,
  toast: "",
  toastT: 0,
  name: ["A", "E", "R"],
  nameI: 0,
  letters: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789- ",

  toastMsg: function (s) { this.toast = s; this.toastT = 2.2; },
  updateToast: function (dt) { this.toastT = Math.max(0, this.toastT - dt); },

  nav: function (n) {
    this.idx = (this.idx + n + 99) % n;
  },
  step: function (listLen, dt) {
    if (AR.Input.btnPressed("pause")) return "back";
    var y = 0;
    if (AR.Input.pressed.ArrowUp || AR.Input.pressed.KeyW) y = -1;
    if (AR.Input.pressed.ArrowDown || AR.Input.pressed.KeyS) y = 1;
    var gp = AR.Input.pad();
    if (gp) {
      var up = gp.buttons[12] && gp.buttons[12].pressed;
      var dn = gp.buttons[13] && gp.buttons[13].pressed;
      if (up && !AR.Input.padPrev.menuUp) y = -1;
      if (dn && !AR.Input.padPrev.menuDown) y = 1;
      AR.Input.padPrev.menuUp = !!up;
      AR.Input.padPrev.menuDown = !!dn;
    }
    if (y) {
      this.idx = (this.idx + y + listLen) % listLen;
      AR.Audio.sfx("menu");
    }
    if (AR.Input.pressed.Enter || AR.Input.pressed.Space || AR.Input.btnPressed("fire") || AR.Input.btnPressed("confirm")) {
      AR.Audio.sfx("confirm");
      return "ok";
    }
    return null;
  },

  panel: function (ctx, t) {
    ctx.fillStyle = "rgba(4,8,14,0.72)";
    ctx.fillRect(0, 0, AR.W, AR.H);
    var g = ctx.createRadialGradient(960, 200, 40, 960, 400, 700);
    g.addColorStop(0, "rgba(60,240,255,0.08)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, AR.W, AR.H);
  },

  title: function (ctx, t, g) {
    if (AR.Gfx.titleBg && AR.Gfx.titleBg.complete) {
      ctx.drawImage(AR.Gfx.titleBg, 0, 0, AR.W, AR.H);
    } else {
      AR.Background.draw(ctx, 0, 40);
    }
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0, 0, AR.W, AR.H);
    if (AR.Gfx.logo && AR.Gfx.logo.complete) {
      var lw = 1100, lh = lw * 9 / 16;
      ctx.drawImage(AR.Gfx.logo, (AR.W - lw) / 2, 80, lw, lh);
    } else {
      ctx.textAlign = "center";
      ctx.fillStyle = "#3cf0ff";
      ctx.font = "bold 92px sans-serif";
      ctx.fillText("AETHER RAZE", 960, 280);
    }
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(180,240,255," + (0.45 + Math.sin(t * 3) * 0.35) + ")";
    ctx.font = "22px sans-serif";
    ctx.letterSpacing = "0.4em";
    ctx.fillText("PULSA ESPACIO / START", 960, 820);
    ctx.fillStyle = "rgba(160,200,220,0.7)";
    ctx.font = "16px sans-serif";
    ctx.fillText("MATAMARCIANOS HORIZONTAL  ·  6 PANTALLAS  ·  ARCADE", 960, 860);
    ctx.fillText("v" + AR.VERSION, 960, 1020);
  },

  main: function (ctx, t) {
    this.panel(ctx, t);
    this.header(ctx, "AETHER RAZE");
    this.list(ctx, this.menu, this.idx, 420);
    var prog = AR.Save.data.progress;
    ctx.textAlign = "center";
    ctx.fillStyle = "#6ab";
    ctx.font = "16px sans-serif";
    ctx.fillText(prog.beaten ? "DOMINIO HELIXAR DESTRUIDO" : "PANTALLA DESBLOQUEADA: " + (prog.unlockedStage + 1) + "/6", 960, 920);
    if (!prog.inferno) {
      ctx.fillStyle = "#667";
      ctx.fillText("Termina el modo Arcade para desbloquear INFIERNO", 960, 950);
    }
  },

  difficulty: function (ctx) {
    this.panel(ctx);
    this.header(ctx, "DIFICULTAD");
    var labels = this.diffs.map(function (d) {
      var inf = d === "inferno" && !AR.Save.data.progress.inferno;
      return AR.DIFF[d].name + (inf ? "  [BLOQUEADO]" : "");
    });
    this.list(ctx, labels, this.idx, 400);
    var d = AR.DIFF[this.diffs[this.idx]];
    ctx.textAlign = "center";
    ctx.fillStyle = "#8cf";
    ctx.font = "18px sans-serif";
    var blurb = {
      novice: "Más vida efectiva, menos densos los disparos. Ideal para aprender patrones.",
      arcade: "La experiencia pensada por el diseñador. Justa, rápida, adictiva.",
      veteran: "Más agresivo. Los errores se pagan. El multiplicador es tu aliado.",
      inferno: "Sin piedad. Para quien ya se sabe cada oleada de memoria."
    }[d.id];
    ctx.fillText(blurb, 960, 820);
  },

  hangar: function (ctx, t) {
    this.panel(ctx, t);
    this.header(ctx, "HANGAR");
    var i = this.craftI || 0;
    var c = AR.CRAFTS[i];
    ctx.textAlign = "center";
    ctx.fillStyle = "#6ab";
    ctx.font = "18px sans-serif";
    ctx.fillText("◄  A / D  o  flechas  ►", 960, 210);

    var dummy = {
      x: 960, y: 430, vy: 0, roll: Math.sin(t * 1.7) * 0.42,
      art: c.art, craftId: c.id, shield: 0, focus: 0, hurtBlink: false, drawScale: 2.35
    };
    AR.Gfx.drawPlayer(ctx, dummy, t);

    ctx.fillStyle = c.accent;
    ctx.font = "bold 44px sans-serif";
    ctx.fillText(c.name, 960, 600);
    ctx.fillStyle = "#cfe";
    ctx.font = "20px sans-serif";
    ctx.fillText(c.sub + "  ·  ARMA: " + AR.WEAPON_NAME[c.weapon], 960, 638);
    ctx.fillStyle = "#8ab";
    ctx.font = "18px sans-serif";
    ctx.fillText(c.blurb, 960, 676);

    function bar(label, v, x, y, col) {
      ctx.textAlign = "left";
      ctx.fillStyle = "#8ab";
      ctx.font = "14px sans-serif";
      ctx.fillText(label, x, y);
      ctx.fillStyle = "#123";
      ctx.fillRect(x + 110, y - 12, 160, 10);
      ctx.fillStyle = col;
      ctx.fillRect(x + 110, y - 12, 160 * AR.clamp(v, 0, 1), 10);
    }
    bar("VELOCIDAD", (c.speed - 0.55) / 0.8, 520, 730, "#3cf0ff");
    bar("BLINDAJE", c.hp / 6, 980, 730, "#ff5a6a");
    bar("POTENCIA", (c.dmg - 0.8) / 0.55, 520, 768, "#ffe14a");
    bar("BOMBAS", c.bombs / 3, 980, 768, "#fa6");

    var slotW = 220, gap = 28;
    var total = AR.CRAFTS.length * slotW + (AR.CRAFTS.length - 1) * gap;
    var x0 = (AR.W - total) / 2;
    for (var s = 0; s < AR.CRAFTS.length; s++) {
      var sc = AR.CRAFTS[s];
      var x = x0 + s * (slotW + gap);
      var sel = s === i;
      ctx.strokeStyle = sel ? sc.accent : "rgba(80,120,140,0.45)";
      ctx.lineWidth = sel ? 3 : 1;
      ctx.fillStyle = sel ? "rgba(8,16,28,0.9)" : "rgba(4,8,14,0.55)";
      ctx.fillRect(x, 820, slotW, 88);
      ctx.strokeRect(x, 820, slotW, 88);
      ctx.textAlign = "center";
      ctx.fillStyle = sel ? sc.accent : "#6a8a9a";
      ctx.font = sel ? "bold 18px sans-serif" : "16px sans-serif";
      ctx.fillText(sc.name, x + slotW / 2, 856);
      ctx.font = "13px sans-serif";
      ctx.fillStyle = "#9ab";
      ctx.fillText(AR.WEAPON_NAME[sc.weapon], x + slotW / 2, 882);
    }
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(180,240,255," + (0.45 + Math.sin(t * 3) * 0.35) + ")";
    ctx.font = "18px sans-serif";
    ctx.fillText("ESPACIO / START  —  DESPEGAR     ESC  —  VOLVER", 960, 1040);
  },

  options: function (ctx) {
    this.panel(ctx);
    this.header(ctx, "OPCIONES");
    this.list(ctx, this.opt, this.idx, 420);
  },
  audioMenu: function (ctx) {
    this.panel(ctx);
    this.header(ctx, "AUDIO");
    var o = AR.Save.data.options;
    var rows = [
      "MAESTRO   " + Math.round(o.master * 100) + "%",
      "MÚSICA    " + Math.round(o.music * 100) + "%",
      "EFECTOS   " + Math.round(o.sfx * 100) + "%",
      "VOLVER"
    ];
    this.list(ctx, rows, this.idx, 400);
    ctx.textAlign = "center";
    ctx.fillStyle = "#8ab";
    ctx.font = "16px sans-serif";
    ctx.fillText("← → para ajustar", 960, 860);
  },
  videoMenu: function (ctx) {
    this.panel(ctx);
    this.header(ctx, "PANTALLA");
    var o = AR.Save.data.options;
    var on = function (v) { return v ? "ON" : "OFF"; };
    var rows = [
      "PANTALLA COMPLETA   " + on(!!document.fullscreenElement),
      "TEMBLOR DE CÁMARA   " + on(o.shake),
      "BLOOM / RESPLANDOR  " + on(o.bloom),
      "DESTELLOS           " + on(o.flash),
      "VOLVER"
    ];
    this.list(ctx, rows, this.idx, 380);
  },
  controls: function (ctx) {
    this.panel(ctx);
    this.header(ctx, "CONTROLES");
    var k = AR.Save.data.options.keys;
    var rows = [
      "ARRIBA        " + AR.codeLabel(k.up) + " / " + AR.codeLabel(k.up2),
      "ABAJO         " + AR.codeLabel(k.down) + " / " + AR.codeLabel(k.down2),
      "IZQUIERDA     " + AR.codeLabel(k.left) + " / " + AR.codeLabel(k.left2),
      "DERECHA       " + AR.codeLabel(k.right) + " / " + AR.codeLabel(k.right2),
      "DISPARO       " + AR.codeLabel(k.fire) + "   (mantener = cargar)",
      "ESPECIAL      " + AR.codeLabel(k.special),
      "FOCO / PRECISIÓN  " + AR.codeLabel(k.focus),
      "PAUSA         " + AR.codeLabel(k.pause),
      "RESTAURAR PREDETERMINADOS",
      "VOLVER"
    ];
    this.list(ctx, rows, this.idx, 300);
    if (AR.Input.remap) {
      ctx.fillStyle = "#ffe14a";
      ctx.textAlign = "center";
      ctx.font = "22px sans-serif";
      ctx.fillText("Pulsa una tecla para reasignar…", 960, 980);
    } else {
      ctx.fillStyle = "#8ab";
      ctx.textAlign = "center";
      ctx.font = "16px sans-serif";
      ctx.fillText("Enter para reasignar · Mando: palanca/cruceta, A disparo, RB especial, LT foco, Start pausa", 960, 980);
    }
  },
  credits: function (ctx, t) {
    this.panel(ctx);
    this.header(ctx, "CRÉDITOS");
    ctx.textAlign = "center";
    ctx.fillStyle = "#cfe";
    ctx.font = "22px sans-serif";
    var lines = [
      "AETHER RAZE",
      "Un matamarcianos original de desplazamiento lateral",
      "",
      "Diseño, código, audio procedural y dirección — Aether Line Studio",
      "Identidad visual generada para este título. Ningún elemento de R-Type u otros clásicos.",
      "",
      "Naves: Aurora-IX · Sable-V · Halcón-3 · Lanza-M  ·  Enemigo: Dominio Helixar",
      "Pantallas: Frontera de Acero · Océano de Titanio · Planeta Rojo",
      "Ciudad Neón · Mundo Biomecánico · El Núcleo",
      "",
      "Música electrónica original sintetizada en tiempo real",
      "Techno · Drum & Bass · Breakbeat · Synthwave · Industrial",
      "",
      "Gracias por jugar. Sube tu marca. Rompe el Núcleo otra vez.",
      "",
      "Pulsa ESC o ESPACIO para volver"
    ];
    for (var i = 0; i < lines.length; i++) {
      ctx.globalAlpha = 0.55 + 0.45 * Math.sin(t * 2 + i * 0.2);
      ctx.fillText(lines[i], 960, 260 + i * 36);
    }
    ctx.globalAlpha = 1;
  },
  scores: function (ctx) {
    this.panel(ctx);
    this.header(ctx, "MEJORES PUNTUACIONES");
    var list = AR.Save.data.scores;
    ctx.textAlign = "left";
    ctx.font = "22px monospace";
    if (!list.length) {
      ctx.textAlign = "center";
      ctx.fillStyle = "#89a";
      ctx.fillText("Aún no hay marcas. Juega una partida Arcade.", 960, 480);
    }
    for (var i = 0; i < 12; i++) {
      var s = list[i];
      ctx.fillStyle = i === 0 ? "#ffe14a" : "#cfe";
      var y = 280 + i * 48;
      ctx.fillText(String(i + 1).padStart(2, "0"), 520, y);
      if (s) {
        ctx.fillText((s.name || "---") + "   " + String(s.score).padStart(9, "0") + "   " + (s.diff || "").toUpperCase() + "   P" + (s.stage || 1), 600, y);
      } else ctx.fillText("---   000000000", 600, y);
    }
    var st = AR.Save.data.stats;
    ctx.textAlign = "center";
    ctx.fillStyle = "#8ab";
    ctx.font = "16px sans-serif";
    ctx.fillText("Partidas " + st.runs + "   Bajas " + st.kills + "   Derribos de jefe " + st.bosses + "   Muertes " + st.deaths, 960, 940);
    ctx.fillText("ESPACIO / ESC para volver", 960, 980);
  },
  stageSelect: function (ctx) {
    this.panel(ctx);
    this.header(ctx, "SELECCIÓN DE FASE");
    var unlocked = AR.Save.data.progress.unlockedStage;
    var labels = AR.STAGES.map(function (s, i) {
      return (i <= unlocked ? "" : "[BLOQUEADA]  ") + "0" + (i + 1) + "  " + s.name;
    });
    this.list(ctx, labels, this.idx, 320);
  },

  header: function (ctx, title) {
    ctx.textAlign = "center";
    ctx.fillStyle = "#3cf0ff";
    ctx.font = "bold 42px sans-serif";
    ctx.fillText(title, 960, 160);
    ctx.strokeStyle = "rgba(60,240,255,0.35)";
    ctx.beginPath(); ctx.moveTo(720, 180); ctx.lineTo(1200, 180); ctx.stroke();
  },
  list: function (ctx, items, idx, y0) {
    ctx.textAlign = "center";
    ctx.font = "28px sans-serif";
    for (var i = 0; i < items.length; i++) {
      var sel = i === idx;
      ctx.fillStyle = sel ? "#fff" : "#6a8a9a";
      if (sel) {
        ctx.fillStyle = "#041018";
        ctx.fillRect(660, y0 + i * 56 - 34, 600, 48);
        ctx.strokeStyle = "#3cf0ff";
        ctx.strokeRect(660, y0 + i * 56 - 34, 600, 48);
        ctx.fillStyle = "#3cf0ff";
      }
      ctx.fillText((sel ? "▸ " : "  ") + items[i], 960, y0 + i * 56);
    }
  },

  hud: function (ctx, g) {
    var p = g.combat.player;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0, 0, AR.W, 52);
    ctx.fillRect(0, AR.H - 46, AR.W, 46);
    ctx.font = "18px monospace";
    ctx.fillStyle = "#9ff";
    ctx.textAlign = "left";
    ctx.fillText("PUNTOS " + String(g.score | 0).padStart(9, "0"), 24, 32);
    ctx.fillStyle = "#ffe14a";
    ctx.fillText("x" + g.combat.player.mul.toFixed(1), 280, 32);
    ctx.fillStyle = "#cfe";
    ctx.fillText(AR.craft(p.craftId).name + "  ·  " + AR.WEAPON_NAME[p.weapon] + "  POW " + p.power, 380, 32);
    ctx.textAlign = "right";
    ctx.fillStyle = "#9ff";
    ctx.fillText("PANTALLA " + (g.stage + 1) + "  " + AR.STAGES[g.stage].name, AR.W - 24, 32);

    ctx.textAlign = "left";
    ctx.fillStyle = "#f66";
    ctx.fillText("VIDA", 24, AR.H - 16);
    for (var i = 0; i < p.maxHp; i++) {
      ctx.fillStyle = i < p.hp ? "#ff5a6a" : "#332";
      ctx.fillRect(90 + i * 28, AR.H - 32, 22, 16);
    }
    ctx.fillStyle = "#6cf";
    ctx.fillText("ENRG", 260, AR.H - 16);
    ctx.fillStyle = "#123";
    ctx.fillRect(330, AR.H - 32, 160, 16);
    ctx.fillStyle = "#3cf0ff";
    ctx.fillRect(330, AR.H - 32, 160 * (p.energy / 100), 16);
    ctx.fillStyle = "#fa6";
    ctx.fillText("BOMBAS " + p.bombs, 520, AR.H - 16);
    ctx.fillStyle = "#cfe";
    ctx.fillText("NAVES " + p.lives, 680, AR.H - 16);
    if (p.charge > 0.05) {
      ctx.fillStyle = "#fff";
      ctx.fillText("CARGA", 800, AR.H - 16);
      ctx.fillStyle = "#222";
      ctx.fillRect(870, AR.H - 32, 120, 16);
      ctx.fillStyle = p.charge >= 0.82 ? "#ffe14a" : "#8cf";
      ctx.fillRect(870, AR.H - 32, 120 * p.charge, 16);
    }
    if (g.boss && g.boss.alive) {
      ctx.textAlign = "center";
      ctx.fillStyle = "#fff";
      ctx.font = "14px sans-serif";
      ctx.fillText(g.boss.name + "  —  " + g.boss.title + "  ·  FASE " + g.boss.phase, 960, 70);
      ctx.fillStyle = "#311";
      ctx.fillRect(360, 80, 1200, 14);
      var pct = Math.max(0, g.boss.hp / g.boss.max);
      var grd = ctx.createLinearGradient(360, 0, 1560, 0);
      grd.addColorStop(0, "#ff3355");
      grd.addColorStop(1, "#ffe14a");
      ctx.fillStyle = grd;
      ctx.fillRect(360, 80, 1200 * pct, 14);
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.strokeRect(360, 80, 1200, 14);
    }
    if (this.toastT > 0) {
      ctx.textAlign = "center";
      ctx.globalAlpha = Math.min(1, this.toastT);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 28px sans-serif";
      ctx.fillText(this.toast, 960, 160);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  },

  pause: function (ctx) {
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, AR.W, AR.H);
    this.header(ctx, "PAUSA");
    this.list(ctx, ["REANUDAR", "OPCIONES", "ABANDONAR PARTIDA"], this.idx, 420);
  },
  gameover: function (ctx, g) {
    ctx.fillStyle = "rgba(10,0,0,0.6)";
    ctx.fillRect(0, 0, AR.W, AR.H);
    ctx.textAlign = "center";
    ctx.fillStyle = "#ff4466";
    ctx.font = "bold 72px sans-serif";
    ctx.fillText("GAME OVER", 960, 360);
    ctx.fillStyle = "#cfe";
    ctx.font = "28px monospace";
    ctx.fillText("PUNTUACIÓN  " + (g.score | 0), 960, 450);
    ctx.fillText("PANTALLA " + (g.stage + 1) + "  ·  " + AR.DIFF[g.diff.id].name, 960, 500);
    this.list(ctx, ["REINTENTAR PANTALLA", "MENÚ PRINCIPAL"], this.idx, 600);
  },
  stageTitle: function (ctx, g, t) {
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(0, 0, AR.W, AR.H);
    var st = AR.STAGES[g.stage];
    ctx.textAlign = "center";
    ctx.fillStyle = "#6ab";
    ctx.font = "22px sans-serif";
    ctx.fillText("PANTALLA  " + String(g.stage + 1).padStart(2, "0") + " / 06", 960, 380);
    ctx.fillStyle = "#3cf0ff";
    ctx.font = "bold 64px sans-serif";
    ctx.fillText(st.name, 960, 470);
    ctx.fillStyle = "#cfe";
    ctx.font = "24px sans-serif";
    ctx.fillText(st.sub, 960, 530);
  },
  bossIntro: function (ctx, g) {
    ctx.fillStyle = "rgba(20,0,0,0.35)";
    ctx.fillRect(0, 0, AR.W, AR.H);
    ctx.textAlign = "left";
    ctx.fillStyle = "#ff3355";
    ctx.font = "bold 28px sans-serif";
    ctx.fillText("ALERTA DE JEFE", 80, 160);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 56px sans-serif";
    ctx.fillText(g.boss.name, 80, 240);
    ctx.fillStyle = "#ffaa88";
    ctx.font = "28px sans-serif";
    ctx.fillText(g.boss.title, 80, 290);
  },
  stageClear: function (ctx, g) {
    ctx.fillStyle = "rgba(0,10,16,0.5)";
    ctx.fillRect(0, 0, AR.W, AR.H);
    ctx.textAlign = "center";
    ctx.fillStyle = "#3cf0ff";
    ctx.font = "bold 56px sans-serif";
    ctx.fillText("PANTALLA SUPERADA", 960, 320);
    ctx.fillStyle = "#cfe";
    ctx.font = "24px monospace";
    ctx.fillText("BONUS SIN MUERTE   " + g.clearBonus.noDeath, 960, 420);
    ctx.fillText("BONUS DE JEFE      " + g.clearBonus.boss, 960, 460);
    ctx.fillText("BONUS DE TIEMPO    " + g.clearBonus.time, 960, 500);
    ctx.fillText("TOTAL              " + (g.score | 0), 960, 560);
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "18px sans-serif";
    ctx.fillText("Pulsa ESPACIO para continuar", 960, 680);
  },
  victory: function (ctx, g, t) {
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(0, 0, AR.W, AR.H);
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffe14a";
    ctx.font = "bold 70px sans-serif";
    ctx.fillText("DOMINIO DESTRUIDO", 960, 300);
    ctx.fillStyle = "#cfe";
    ctx.font = "24px sans-serif";
    ctx.fillText("El Núcleo Helixar se apaga. La Aurora-IX abre un corredor de luz.", 960, 380);
    ctx.fillText("La Frontera de Acero vuelve a respirar.", 960, 420);
    ctx.font = "28px monospace";
    ctx.fillStyle = "#3cf0ff";
    ctx.fillText("PUNTUACIÓN FINAL  " + (g.score | 0), 960, 520);
    ctx.fillStyle = "#cfe";
    ctx.font = "20px sans-serif";
    ctx.fillText("Bajas " + g.statsKills + "   Muertes " + g.deaths + "   Tiempo " + (g.runTime | 0) + "s", 960, 570);
    ctx.fillText("Pulsa ESPACIO para registrar tu marca", 960, 700);
  },
  nameEntry: function (ctx, g) {
    this.panel(ctx);
    this.header(ctx, "REGISTRA TU MARCA");
    ctx.textAlign = "center";
    ctx.fillStyle = "#cfe";
    ctx.font = "24px sans-serif";
    ctx.fillText((g.score | 0) + "  pts", 960, 260);
    ctx.font = "bold 80px monospace";
    for (var i = 0; i < 3; i++) {
      ctx.fillStyle = i === this.nameI ? "#3cf0ff" : "#fff";
      ctx.fillText(this.name[i], 820 + i * 120, 480);
      if (i === this.nameI) {
        ctx.fillRect(790 + i * 120, 500, 70, 4);
      }
    }
    ctx.fillStyle = "#8ab";
    ctx.font = "18px sans-serif";
    ctx.fillText("↑↓ letra   ←→ posición   ESPACIO confirmar", 960, 640);
  },
  intro: function (ctx, t) {
    ctx.fillStyle = "#03050a";
    ctx.fillRect(0, 0, AR.W, AR.H);
    ctx.fillStyle = "#9cd";
    ctx.font = "22px sans-serif";
    ctx.textAlign = "left";
    var lines = [
      "AÑO 2287.  EL DOMINIO HELIXAR HA DOBLADO EL CIELO.",
      "",
      "Seis frentes. Una sola nave de ruptura.",
      "Aurora-IX — prototipo de la Flota Umbral —",
      "es lanzada desde la Frontera de Acero",
      "hacia el corazón biomecánico del enemigo.",
      "",
      "No hay refuerzos. No hay retirada.",
      "Solo el corredor, el cañón, y la marca que dejes."
    ];
    var shown = Math.min(lines.length, (t * 1.15) | 0);
    for (var i = 0; i < shown; i++) ctx.fillText(lines[i], 360, 280 + i * 42);
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(180,240,255,0.7)";
    ctx.font = "16px sans-serif";
    ctx.fillText("ESPACIO para saltar", 960, 980);
  }
};
