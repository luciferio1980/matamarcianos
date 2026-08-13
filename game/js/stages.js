/* AETHER RAZE — six stage scripts, minibosses, scenery hazards */
AR.Stages = {
  build: function (id, extra) {
    extra = extra || 0;
    var ev = [];
    function at(t, fn) { ev.push({ t: t, fn: fn }); }
    function wave(t, kind, n, gap, yfn, extraOpt) {
      for (var i = 0; i < n; i++) {
        (function (ii) {
          at(t + ii * gap, function (g) {
            var y = typeof yfn === "function" ? yfn(ii, g) : yfn;
            g.combat.spawnEnemy(kind, Object.assign({ y: y, phase: ii * 0.7 }, extraOpt || {}));
          });
        })(i);
      }
    }
    function formV(t, kind, n, cy) {
      for (var i = 0; i < n; i++) {
        (function (ii) {
          var mid = (n - 1) / 2;
          at(t + Math.abs(ii - mid) * 0.12, function (g) {
            g.combat.spawnEnemy(kind, { y: cy + (ii - mid) * 48, phase: ii });
          });
        })(i);
      }
    }
    function hazard(t, y, w, h) {
      at(t, function (g) {
        g.combat.spawnEnemy("hazard", { y: y, w: w, h: h, theme: g.stage });
      });
    }
    function coil(t, y) {
      at(t, function (g) {
        g.toast("CULEBRA HELIXAR");
        var head = g.combat.spawnEnemy("coil", { y: y });
        if (!head) return;
        head.trail = [];
        for (var i = 1; i <= 10; i++) g.combat.spawnEnemy("coilseg", { y: y, head: head, seg: i });
      });
    }
    function walker(t, side) {
      at(t, function (g) {
        g.combat.spawnEnemy("walker", { y: side < 0 ? 90 : AR.H - 90, side: side });
      });
    }

    if (id === 0) this._steel(at, wave, formV, extra, hazard, coil, walker);
    if (id === 1) this._ocean(at, wave, formV, extra, hazard, coil, walker);
    if (id === 2) this._red(at, wave, formV, extra, hazard, coil, walker);
    if (id === 3) this._neon(at, wave, formV, extra, hazard, coil, walker);
    if (id === 4) this._bio(at, wave, formV, extra, hazard, coil, walker);
    if (id === 5) this._core(at, wave, formV, extra, hazard, coil, walker);
    ev.sort(function (a, b) { return a.t - b.t; });
    return ev;
  },

  _steel: function (at, wave, formV, extra, hazard, coil, walker) {
    at(0.8, function (g) { g.toast("OLEADA DE RECONOCIMIENTO"); });
    wave(1.6, "wasp", 4, 0.45, function (i) { return 280 + i * 90; });
    wave(5.0, "wasp", 5, 0.28, function (i) { return 200 + (i % 2) * 280; });
    formV(8.2, "wasp", 5, 500);
    wave(11.5, "drone", 3, 0.6, function (i) { return 240 + i * 220; });
    at(14, function (g) { g.toast("TORRETAS EN RASCACIELOS"); });
    wave(15, "turret", 4, 0.7, function (i) { return i % 2 ? 140 : 940; });
    walker(16, -1);
    wave(18, "wasp", 6, 0.22, function (i) { return 180 + i * 70; });
    wave(21, "kami", 3, 0.5, function (i) { return 300 + i * 160; });
    formV(24, "drone", 3, 540);
    wave(27, "diver", 4, 0.4, function (i) { return i % 2 ? 80 : 1000; });
    at(30, function (g) { g.combat.spawnEnemy("armor", { y: 500 }); g.toast("UNIDAD BLINDADA"); });
    hazard(32, 260, 40, 150);
    wave(33, "wasp", 8, 0.18, function (i) { return 160 + (i % 4) * 160; });
    wave(36, "mine", 5, 0.5, function (i) { return 200 + i * 140; });
    wave(39, "pop", 4, 0.45, function (i) { return 250 + i * 150; });
    formV(43, "wasp", 7, 520);
    wave(47, "drone", 4, 0.4, function (i) { return 200 + i * 180; });
    wave(50, "kami", 4, 0.35, function (i) { return AR.rand(120, 960); });
    at(53, function (g) { g.combat.spawnEnemy("gunship", { y: 400 }); g.toast("CAÑONERA MAGLEV"); });
    walker(54, 1);
    wave(56, "turret", 3, 0.5, function (i) { return 120 + i * 400; });
    wave(59, "wasp", 10, 0.15, function (i) { return 140 + (i % 5) * 140; });
    wave(63, "heavy", 2, 0.8, function (i) { return 300 + i * 400; });
    if (extra) wave(66, "kami", 4, 0.3, function () { return AR.rand(100, 980); });
    coil(72, 520);
    wave(76, "wasp", 8, 0.18, function (i) { return 180 + (i % 4) * 160; });
    hazard(84, 780, 44, 170);
    at(88, function (g) { g.toast("SEGUNDO CINTURÓN"); });
    wave(90, "wasp", 10, 0.16, function (i) { return 160 + (i % 5) * 140; });
    formV(97, "drone", 5, 520);
    walker(99, -1);
    wave(101, "turret", 4, 0.4, function (i) { return i % 2 ? 140 : 940; });
    at(105, function (g) { g.combat.spawnEnemy("gunship", { y: 360 }); g.combat.spawnEnemy("armor", { y: 720 }); });
    wave(108, "wasp", 8, 0.18, function (i) { return 180 + i * 80; });
    hazard(110, 420, 38, 140);
    wave(112, "heavy", 2, 0.7, function (i) { return 280 + i * 420; });
    if (extra) wave(114, "kami", 5, 0.22, function () { return AR.rand(80, 1000); });
    at(118, function (g) { g.startBoss(); });
  },

  _ocean: function (at, wave, formV, extra, hazard, coil, walker) {
    at(0.6, function (g) { g.toast("PROFUNDIDAD 4000 m"); });
    wave(1.4, "squid", 4, 0.5, function (i) { return 220 + i * 140; });
    wave(5, "mine", 6, 0.4, function (i) { return 160 + (i % 3) * 220; });
    wave(8, "drone", 4, 0.45, function (i) { return 180 + i * 180; });
    wave(11, "diver", 5, 0.35, function (i) { return i % 2 ? 70 : 1010; });
    formV(14, "squid", 5, 540);
    at(17, function (g) { g.toast("TURBINAS"); });
    wave(18, "turret", 4, 0.55, function (i) { return i % 2 ? 160 : 920; });
    hazard(20, 300, 72, 72);
    wave(21, "wasp", 8, 0.2, function (i) { return 200 + Math.sin(i) * 200 + 300; });
    wave(25, "kami", 4, 0.4, function (i) { return 240 + i * 140; });
    at(28, function (g) { g.combat.spawnEnemy("armor", { y: 360 }); g.combat.spawnEnemy("armor", { y: 720 }); });
    wave(32, "pop", 5, 0.4, function (i) { return 180 + i * 140; });
    wave(36, "squid", 6, 0.3, function (i) { return 150 + (i % 2) * 500; });
    walker(38, 1);
    wave(40, "mine", 8, 0.28, function (i) { return 120 + i * 100; });
    at(44, function (g) { g.combat.spawnEnemy("gunship", { y: 500 }); g.toast("GUARDIÁN DE TUBERÍAS"); });
    wave(47, "diver", 6, 0.28, function (i) { return i % 2 ? 60 : 1020; });
    wave(51, "drone", 5, 0.35, function (i) { return 220 + i * 140; });
    formV(55, "squid", 7, 500);
    wave(59, "heavy", 2, 0.7, function (i) { return 280 + i * 420; });
    if (extra) wave(62, "kami", 5, 0.25, function () { return AR.rand(80, 1000); });
    coil(70, 500);
    hazard(82, 760, 80, 80);
    wave(84, "squid", 6, 0.28, function (i) { return 200 + i * 110; });
    at(87, function (g) { g.toast("CÁMARA DE PRESIÓN"); });
    wave(91, "diver", 8, 0.22, function (i) { return i % 2 ? 80 : 1000; });
    formV(96, "squid", 7, 520);
    walker(98, -1);
    wave(101, "drone", 6, 0.3, function (i) { return 180 + i * 130; });
    at(106, function (g) { g.combat.spawnEnemy("gunship", { y: 320 }); g.combat.spawnEnemy("gunship", { y: 760 }); });
    hazard(108, 420, 70, 70);
    wave(110, "pop", 6, 0.28, function (i) { return 200 + i * 120; });
    if (extra) wave(114, "kami", 6, 0.2, function () { return AR.rand(80, 1000); });
    at(118, function (g) { g.startBoss(); });
  },

  _red: function (at, wave, formV, extra, hazard, coil, walker) {
    at(0.5, function (g) { g.toast("TORMENTA DE POLVO"); });
    wave(1.2, "wasp", 6, 0.25, function (i) { return 180 + i * 110; });
    wave(4.5, "kami", 5, 0.3, function (i) { return AR.rand(100, 980); });
    formV(8, "drone", 5, 500);
    wave(11, "diver", 6, 0.28, function (i) { return i % 2 ? 80 : 1000; });
    at(14, function (g) { g.toast("METEORITOS"); });
    wave(15, "mine", 8, 0.22, function (i) { return AR.rand(80, 1000); });
    hazard(17, 240, 96, 70);
    wave(18, "pop", 5, 0.35, function (i) { return 200 + i * 140; });
    wave(22, "squid", 4, 0.4, function (i) { return 240 + i * 160; });
    at(25, function (g) { g.combat.spawnEnemy("gunship", { y: 300 }); g.combat.spawnEnemy("armor", { y: 760 }); });
    walker(27, 1);
    wave(29, "wasp", 10, 0.14, function (i) { return 140 + (i % 5) * 150; });
    wave(33, "turret", 5, 0.4, function (i) { return i % 2 ? 130 : 950; });
    wave(37, "heavy", 3, 0.55, function (i) { return 220 + i * 220; });
    formV(41, "kami", 5, 540);
    wave(45, "drone", 6, 0.28, function (i) { return 160 + i * 120; });
    at(48, function (g) { g.toast("FORTALEZA ALIENÍGENA"); });
    wave(49, "pop", 6, 0.3, function (i) { return 180 + i * 120; });
    wave(53, "armor", 2, 0.8, function (i) { return 280 + i * 400; });
    wave(56, "wasp", 12, 0.12, function (i) { return 120 + (i % 6) * 130; });
    wave(60, "gunship", 1, 1, 500);
    wave(62, "diver", 8, 0.2, function (i) { return i % 2 ? 70 : 1010; });
    if (extra) {
      wave(64, "kami", 6, 0.2, function () { return AR.rand(80, 1000); });
      wave(66, "mine", 6, 0.2, function () { return AR.rand(80, 1000); });
    }
    coil(74, 540);
    hazard(86, 820, 100, 74);
    at(90, function (g) { g.toast("PASO FORTIFICADO"); });
    wave(94, "wasp", 12, 0.12, function (i) { return 140 + (i % 6) * 130; });
    walker(96, -1);
    wave(99, "turret", 5, 0.35, function (i) { return i % 2 ? 130 : 950; });
    formV(104, "drone", 5, 520);
    at(108, function (g) { g.combat.spawnEnemy("gunship", { y: 400 }); g.combat.spawnEnemy("armor", { y: 780 }); });
    hazard(110, 360, 88, 68);
    wave(112, "diver", 8, 0.2, function (i) { return i % 2 ? 70 : 1010; });
    if (extra) wave(116, "kami", 6, 0.18, function () { return AR.rand(80, 1000); });
    at(120, function (g) { g.startBoss(); });
  },

  _neon: function (at, wave, formV, extra, hazard, coil, walker) {
    at(0.4, function (g) { g.toast("NOXVEIL · 02:17 AM"); });
    wave(1.0, "wasp", 7, 0.2, function (i) { return 160 + i * 100; });
    formV(4.5, "drone", 5, 480);
    wave(8, "kami", 5, 0.28, function (i) { return 200 + i * 140; });
    wave(11, "pop", 5, 0.32, function (i) { return 220 + i * 130; });
    at(14, function (g) { g.combat.spawnEnemy("gunship", { y: 360 }); });
    hazard(16, 220, 42, 170);
    wave(17, "diver", 6, 0.25, function (i) { return i % 2 ? 90 : 990; });
    wave(21, "heavy", 2, 0.7, function (i) { return 260 + i * 480; });
    formV(24, "wasp", 7, 520);
    walker(28, -1);
    wave(29, "mine", 6, 0.28, function (i) { return 180 + (i % 3) * 220; });
    wave(33, "turret", 4, 0.4, function (i) { return i % 2 ? 120 : 960; });
    wave(36, "wasp", 10, 0.14, function (i) { return 200 + Math.sin(i * 1.2) * 300 + 300; });
    at(40, function (g) { g.toast("CIRCUITO MEDIANOCHE"); });
    wave(42, "drone", 6, 0.25, function (i) { return 180 + i * 120; });
    wave(46, "squid", 4, 0.35, function (i) { return 240 + i * 150; });
    at(50, function (g) { g.combat.spawnEnemy("gunship", { y: 280 }); g.combat.spawnEnemy("gunship", { y: 760 }); });
    wave(54, "pop", 6, 0.25, function (i) { return 160 + i * 130; });
    wave(58, "armor", 2, 0.6, function (i) { return 300 + i * 400; });
    wave(61, "wasp", 12, 0.1, function (i) { return 130 + (i % 6) * 130; });
    if (extra) wave(64, "kami", 8, 0.15, function () { return AR.rand(80, 1000); });
    coil(72, 500);
    hazard(84, 800, 40, 180);
    wave(88, "wasp", 12, 0.12, function (i) { return 140 + (i % 6) * 130; });
    walker(92, 1);
    wave(96, "drone", 6, 0.24, function (i) { return 180 + i * 120; });
    at(102, function (g) { g.combat.spawnEnemy("gunship", { y: 300 }); g.combat.spawnEnemy("gunship", { y: 760 }); });
    hazard(104, 380, 44, 160);
    wave(106, "pop", 6, 0.22, function (i) { return 180 + i * 120; });
    wave(111, "kami", 8, 0.16, function () { return AR.rand(80, 1000); });
    if (extra) wave(114, "heavy", 2, 0.5, function (i) { return 260 + i * 480; });
    at(118, function (g) { g.startBoss(); });
  },

  _bio: function (at, wave, formV, extra, hazard, coil, walker) {
    at(0.4, function (g) { g.toast("TEJIDO HOSTIL"); });
    wave(1.2, "squid", 6, 0.28, function (i) { return 180 + i * 120; });
    wave(5, "pop", 6, 0.3, function (i) { return 200 + i * 120; });
    wave(9, "kami", 6, 0.25, function (i) { return AR.rand(100, 980); });
    formV(12, "squid", 7, 520);
    wave(16, "diver", 8, 0.22, function (i) { return i % 2 ? 70 : 1010; });
    at(19, function (g) { g.toast("PULSO ORGÁNICO"); g.combat.spawnEnemy("gunship", { y: 500 }); });
    hazard(21, 280, 86, 92);
    wave(22, "mine", 8, 0.22, function (i) { return 140 + (i % 4) * 180; });
    wave(26, "heavy", 3, 0.5, function (i) { return 240 + i * 220; });
    wave(30, "wasp", 12, 0.12, function (i) { return 150 + (i % 6) * 130; });
    wave(34, "turret", 6, 0.3, function (i) { return i % 2 ? 120 : 960; });
    at(38, function (g) { g.combat.spawnEnemy("armor", { y: 280 }); g.combat.spawnEnemy("armor", { y: 540 }); g.combat.spawnEnemy("armor", { y: 800 }); });
    walker(40, 1);
    wave(42, "squid", 8, 0.2, function (i) { return 160 + i * 100; });
    wave(46, "kami", 8, 0.18, function () { return AR.rand(80, 1000); });
    formV(50, "pop", 6, 500);
    wave(54, "gunship", 2, 0.9, function (i) { return 300 + i * 400; });
    wave(58, "diver", 10, 0.16, function (i) { return i % 2 ? 60 : 1020; });
    wave(62, "swarm", 14, 0.1, function (i) { return 120 + (i % 7) * 120; });
    if (extra) {
      wave(64, "heavy", 2, 0.5, function (i) { return 260 + i * 500; });
      wave(66, "kami", 6, 0.18, function () { return AR.rand(80, 1000); });
    }
    coil(74, 520);
    hazard(88, 760, 90, 96);
    wave(92, "pop", 8, 0.2, function (i) { return 170 + i * 100; });
    formV(98, "squid", 7, 500);
    walker(102, -1);
    wave(105, "diver", 8, 0.18, function (i) { return i % 2 ? 70 : 1010; });
    at(110, function (g) { g.combat.spawnEnemy("gunship", { y: 500 }); g.combat.spawnEnemy("armor", { y: 240 }); });
    hazard(112, 400, 84, 88);
    wave(114, "swarm", 12, 0.1, function (i) { return 130 + (i % 6) * 130; });
    if (extra) wave(117, "kami", 6, 0.16, function () { return AR.rand(80, 1000); });
    at(122, function (g) { g.startBoss(); });
  },

  _core: function (at, wave, formV, extra, hazard, coil, walker) {
    at(0.3, function (g) { g.toast("ALARMA GENERAL · NÚCLEO"); });
    wave(1.0, "wasp", 10, 0.12, function (i) { return 140 + (i % 5) * 150; });
    wave(3.5, "kami", 8, 0.16, function () { return AR.rand(80, 1000); });
    formV(6, "drone", 7, 500);
    wave(9, "diver", 8, 0.18, function (i) { return i % 2 ? 70 : 1010; });
    at(12, function (g) { g.toast("MINIJEFATURA ALFA"); g.combat.spawnEnemy("gunship", { y: 280 }); g.combat.spawnEnemy("gunship", { y: 760 }); });
    wave(15, "armor", 3, 0.5, function (i) { return 240 + i * 220; });
    hazard(17, 250, 48, 150);
    wave(18, "pop", 8, 0.2, function (i) { return 160 + i * 100; });
    wave(22, "mine", 10, 0.16, function (i) { return 100 + (i % 5) * 180; });
    wave(25, "swarm", 16, 0.08, function (i) { return 120 + (i % 8) * 110; });
    at(28, function (g) { g.toast("CAMPOS DE ENERGÍA"); });
    wave(29, "turret", 8, 0.22, function (i) { return i % 2 ? 110 : 970; });
    walker(31, -1);
    wave(32, "heavy", 4, 0.4, function (i) { return 200 + i * 180; });
    wave(36, "kami", 10, 0.12, function () { return AR.rand(70, 1010); });
    at(40, function (g) { g.toast("MINIJEFATURA BETA"); g.combat.spawnEnemy("gunship", { y: 500 }); g.combat.spawnEnemy("armor", { y: 240 }); g.combat.spawnEnemy("armor", { y: 800 }); });
    wave(44, "squid", 8, 0.18, function (i) { return 180 + i * 100; });
    wave(48, "wasp", 14, 0.09, function (i) { return 130 + (i % 7) * 120; });
    wave(52, "diver", 10, 0.14, function (i) { return i % 2 ? 60 : 1020; });
    wave(56, "pop", 8, 0.18, function (i) { return 170 + i * 100; });
    at(60, function (g) { g.scrollMul = 1.35; g.toast("EMBESTIDA FINAL"); });
    wave(61, "kami", 12, 0.1, function () { return AR.rand(80, 1000); });
    wave(63, "gunship", 2, 0.7, function (i) { return 300 + i * 400; });
    wave(66, "armor", 3, 0.4, function (i) { return 250 + i * 220; });
    wave(69, "swarm", 18, 0.07, function (i) { return 100 + (i % 9) * 100; });
    if (extra) {
      wave(71, "heavy", 3, 0.3, function (i) { return 200 + i * 250; });
      wave(73, "kami", 8, 0.1, function () { return AR.rand(80, 1000); });
    }
    coil(80, 500);
    hazard(92, 780, 52, 160);
    walker(96, 1);
    wave(100, "wasp", 14, 0.09, function (i) { return 130 + (i % 7) * 120; });
    coil(108, 420);
    wave(110, "armor", 3, 0.4, function (i) { return 240 + i * 220; });
    at(115, function (g) { g.combat.spawnEnemy("gunship", { y: 280 }); g.combat.spawnEnemy("gunship", { y: 760 }); });
    hazard(117, 360, 50, 150);
    wave(118, "swarm", 16, 0.08, function (i) { return 120 + (i % 8) * 110; });
    if (extra) wave(122, "kami", 8, 0.12, function () { return AR.rand(80, 1000); });
    at(126, function (g) { g.scrollMul = 1; g.startBoss(); });
  }
};
