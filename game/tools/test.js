/**
 * Headless tests for AETHER RAZE core systems.
 * Run: node tools/test.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const root = path.join(__dirname, "..");
const sandbox = {
  console,
  Math,
  performance: { now: () => Date.now() },
  window: {},
  document: { fullscreenElement: null },
  localStorage: {
    _d: {},
    getItem(k) { return this._d[k] || null; },
    setItem(k, v) { this._d[k] = String(v); }
  },
  navigator: {},
  requestAnimationFrame: () => 0
};
sandbox.window = sandbox;
sandbox.global = sandbox;

function load(rel) {
  const code = fs.readFileSync(path.join(root, rel), "utf8");
  vm.runInNewContext(code, sandbox, { filename: rel });
}

load("js/core.js");
load("js/stages.js");

const AR = sandbox.AR;
let failed = 0;
function ok(name, fn) {
  try { fn(); console.log("  OK  " + name); }
  catch (e) { failed++; console.error("  FAIL " + name + " — " + e.message); }
}

console.log("AETHER RAZE tests");
ok("clamp", () => {
  assert.strictEqual(AR.clamp(5, 0, 3), 3);
  assert.strictEqual(AR.clamp(-1, 0, 3), 0);
});
ok("circleHit", () => {
  assert.ok(AR.circleHit(0, 0, 5, 3, 4, 1));
  assert.ok(!AR.circleHit(0, 0, 5, 10, 10, 1));
});
ok("aabbHit", () => {
  assert.ok(AR.aabbHit(0, 0, 10, 10, 8, 0, 10, 10));
  assert.ok(!AR.aabbHit(0, 0, 10, 10, 40, 0, 10, 10));
});
ok("norm", () => {
  const n = AR.norm(3, 4);
  assert.ok(Math.abs(n.x - 0.6) < 1e-9);
  assert.ok(Math.abs(n.y - 0.8) < 1e-9);
});
ok("pool reuse", () => {
  const p = new AR.Pool(2, () => ({ alive: false, n: 0 }));
  const a = p.spawn((it) => { it.n = 1; });
  const b = p.spawn((it) => { it.n = 2; });
  const c = p.spawn((it) => { it.n = 3; });
  assert.ok(a && b && !c);
  a.alive = false;
  const d = p.spawn((it) => { it.n = 4; });
  assert.strictEqual(d.n, 4);
});
ok("save roundtrip", () => {
  AR.Save.load();
  AR.Save.addScore({ name: "AER", score: 12345, diff: "arcade", stage: 3 });
  AR.Save.load();
  assert.strictEqual(AR.Save.data.scores[0].score, 12345);
  assert.ok(AR.Save.data.progress.best.arcade >= 12345);
});
ok("six stages with bosses", () => {
  assert.strictEqual(AR.STAGES.length, 6);
  for (let i = 0; i < 6; i++) {
    const ev = AR.Stages.build(i, 0);
    assert.ok(ev.length >= 20, "stage " + i + " too short: " + ev.length);
    const last = ev[ev.length - 1];
    let started = false;
    last.fn({ startBoss() { started = true; }, toast() {}, combat: { spawnEnemy() {} }, scrollMul: 1 });
    assert.ok(started, "stage " + i + " does not start boss");
  }
});
ok("difficulty curve", () => {
  assert.ok(AR.DIFF.novice.hp < AR.DIFF.arcade.hp);
  assert.ok(AR.DIFF.arcade.hp < AR.DIFF.veteran.hp);
  assert.ok(AR.DIFF.veteran.hp < AR.DIFF.inferno.hp);
});
ok("weapons and pickups exist", () => {
  assert.ok(AR.WEAPONS.indexOf("laser") >= 0);
  assert.ok(AR.WEAPONS.indexOf("missile") >= 0);
  assert.strictEqual(AR.WEAPONS.length, 4);
});
ok("four crafts with unique weapons", () => {
  assert.strictEqual(AR.CRAFTS.length, 4);
  const weps = AR.CRAFTS.map((c) => c.weapon);
  assert.strictEqual(new Set(weps).size, 4);
  assert.strictEqual(AR.craft("sable").weapon, "laser");
  assert.strictEqual(AR.craft("missing").id, "aurora");
});

if (failed) {
  console.error("\n" + failed + " failed");
  process.exit(1);
}
console.log("\nAll tests passed.");
