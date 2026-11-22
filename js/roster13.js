'use strict';
/* ===== roster, parts 38–39 (heroes 65–66). Loaded after roster12.js (uses twGhost); glyphs go to GLYPH at the end.
   65. Akuro — the king of curses: slashes that come out of nowhere, a cleave that adapts to the target, a bow of fire, and the open domain
       of the Shrine of Malice. Talks with Kaisei (the strongest) when they share a match — the lines go to the chat on the left.
   66. Seiryu — the white knight: an athlete on foot with a «Live!» that will not let him die, and a mech he climbs into — the Paladin,
       with its own four abilities: the VARIS rifle, MVS blades, a slash harken and, once per sortie, the FLEIJA warhead. ===== */
const AKU = { c: 0xff2a3a, deep: 0x5a0610, ink: 0x0c0a0e, fire: 0xff7a2a, gold: 0xffd06a, white: 0xfff2f0 };
const SEI = { c: 0x3affb0, pale: 0xc8ffe8, gold: 0xd8b04a, flj: 0xff5ad8, fljPale: 0xffd0f4 };

/* ==================================================================== 65. AKURO ==================================================================== */
// a cut: a thin bright line in the air — white core, a red edge — gone in a blink. They are what his slashes look like: you never see the blade
// Three layers: a soft red halo, a red edge and a white-hot core, all tapering to points; the line draws itself from one end to the other.
// A big cut (o.slit) also leaves a black slit hanging in the air for a moment after the light is gone, as if space itself was cut
let _akCG = null;
function akMat(tex, color, add) { return new THREE.MeshBasicMaterial({ map: tex ? TEX[tex] : null, color, transparent: true, opacity: 0, blending: add === false ? THREE.NormalBlending : THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }); }
function akCut(x, y, z, len, ry, rz, life, col, o) {
  if (!FX.near(x, z, 60)) return; if (!_akCG) _akCG = new THREE.PlaneGeometry(1, 1);
  const g = new THREE.Group(), hal = new THREE.Mesh(_akCG, akMat('glow', col || AKU.c)), r = new THREE.Mesh(_akCG, akMat('beam', col || AKU.c)), w = new THREE.Mesh(_akCG, akMat('beam', 0xffffff));
  hal.userData.own = r.userData.own = w.userData.own = true; g.add(hal, r, w); g.position.set(x, y, z); g.rotation.set(0, ry, rz); const L = life || 0.16;
  FX.add(g, L, (k, me) => {
    const s = k < 0.3 ? easeOut(k / 0.3) : 1, f = 1 - k, off = -(1 - s) * len * 0.5;
    w.position.x = r.position.x = off; w.scale.set(len * s, 0.045 * f + 0.012, 1); r.scale.set(len * s * 1.06, 0.15 * f + 0.03, 1); hal.scale.set(len * 1.3 * s, 0.7 * f + 0.15, 1);
    w.material.opacity = f; r.material.opacity = 0.95 * f; hal.material.opacity = 0.5 * f;
  });
  if (o && o.slit) {   // the black slit: normal blending, so it reads as a tear even over bright ground
    const sl = new THREE.Mesh(_akCG, akMat('beam', 0x0a0004, false)); sl.position.set(x, y, z); sl.rotation.set(0, ry, rz); sl.renderOrder = 11;
    FX.add(sl, L * 2.6, (k, me) => { const a = k < 0.12 ? 0 : (k < 0.3 ? (k - 0.12) / 0.18 : 1); me.scale.set(len * 0.92, 0.09 * (1 - k * 0.6) + 0.02, 1); me.material.opacity = 0.9 * a * (1 - k) * (1 - k); });
  }
}
// a travelling crescent: the invisible blade of Dismantle shown only by its edge as it rushes outward
const _akWG = {};
function akWave(x, z, dir, R, half, life, y) {
  if (!FX.near(x, z, 60)) return; const key = half.toFixed(2);
  if (!_akWG[key]) { const a = new THREE.RingGeometry(0.86, 1, 36, 1, -half, half * 2), b = new THREE.RingGeometry(0.955, 1, 36, 1, -half * 0.94, half * 1.88); a.rotateX(-HPI); b.rotateX(-HPI); _akWG[key] = [a, b]; }
  const [ga, gb] = _akWG[key], m = new THREE.Mesh(ga, akMat(null, AKU.c)), c = new THREE.Mesh(gb, akMat(null, 0xffffff)); c.userData.own = true; m.add(c);
  m.position.set(x, y || 1.0, z); m.rotation.y = dir - HPI; const L = life || 0.18;
  FX.add(m, L, (k, me) => { const s = 0.8 + (R - 0.8) * easeOut(k); me.scale.set(s, 1, s); me.material.opacity = 0.85 * (1 - k * k); c.material.opacity = 1 - k; });
}
// a scar left on the ground by a cut: a dark thin line with a red glow in it, cooling
function akScar(x, z, len, ang, life) {
  if (!FX.near(x, z, 60) || !GFX.decals) return; const m = new THREE.Mesh(FX.geo.line, new THREE.MeshBasicMaterial({ color: 0x150406, transparent: true, opacity: 0.85, depthWrite: false })), m2 = new THREE.Mesh(FX.geo.line, new THREE.MeshBasicMaterial({ color: AKU.c, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  m2.userData.own = true; m.add(m2); m2.scale.set(0.4, 1, 1); m2.position.y = 0.005; m.position.set(x - Math.sin(ang) * len / 2, 0.06, z - Math.cos(ang) * len / 2); m.rotation.y = ang; m.scale.set(0.12, 1, len); m.renderOrder = 4;
  const L = life || 2.5; FX.add(m, L, (k, me) => { me.material.opacity = 0.85 * (1 - k * k); m2.material.opacity = 0.9 * Math.max(0, 1 - k * 3); });
}
// a burst of cuts through one body: n lines at random angles crossing at the target, sparks of blood-red light
function akCutsOn(t, n, big) {
  if (!FX.near(t.x, t.z, 55)) return; const H = (t.height || 2) * 0.55;
  for (let i = 0; i < n; i++) after(i * 0.03, () => { if (!t) return; akCut(t.x + rand(-0.3, 0.3), H + rand(-0.4, 0.5), t.z + rand(-0.3, 0.3), big ? rand(2.6, 3.8) : rand(1.8, 2.6), rand(TAU), rand(-1.2, 1.2), 0.15, AKU.c, { slit: big && i % 2 === 0 }); });
  FX.sparks(t.x, H, t.z, { n: big ? 12 : 6, color: 0xffffff, color2: AKU.c, speed: [4, 11], life: [0.12, 0.32], w: 0.08 });
  FX.burst(t.x, H, t.z, { n: big ? 8 : 4, color: 0xc00a1c, color2: 0x3a0005, speed: [1.5, 5], life: [0.3, 0.7], size: [0.28, 0.05], grav: -12 });
  FX.glow(t.x, H, t.z, big ? 3.2 : 1.8, big ? 0xffffff : AKU.c, 0.1, 'star');
}
// the basic blow: two cuts crossing through the target; every third one is a deep one — longer, with a slit and a scar on the ground
function akBasic(h, t) {
  if (!FX.near(t.x, t.z, 45)) return; const H = (t.height || 2) * 0.55, a = h.facing + HPI, big = ((h.akN = (h.akN || 0) + 1) % 3) === 0;
  akCut(t.x, H, t.z, big ? 3.4 : 2.3, a + rand(-0.3, 0.3), 0.7, 0.15, AKU.c, { slit: big });
  after(0.05, () => akCut(t.x, H + 0.1, t.z, big ? 3.1 : 2.0, a + rand(-0.3, 0.3), -0.7, 0.15, AKU.c, { slit: big }));
  FX.sparks(t.x, H, t.z, { n: big ? 10 : 5, color: 0xffffff, color2: AKU.c, speed: [4, 10], life: [0.1, 0.26], w: 0.07, dir: h.facing, spread: 0.9 });
  FX.burst(t.x, H, t.z, { n: big ? 6 : 2, color: 0xc00a1c, color2: 0x3a0005, speed: [1, 4], life: [0.3, 0.6], size: [0.24, 0.05], grav: -12 });
  if (big) { FX.hitstop(0.03); FX.glow(t.x, H, t.z, 2.6, 0xffffff, 0.08, 'star'); akScar(t.x, t.z, 2.2, h.facing + rand(-0.5, 0.5), 1.6); SFX.at('bigcut', t.x, t.z, 0.4); }
}
// fingers (innate): the king grows stronger with every hero taken down near him — up to ten fingers, +3% damage each
function akFingers(h) { const n = h.fingers || 1, b = h.buffs.find(o => o.id === 'fingers'); if (!b) addBuff(h, { id: 'fingers', dur: 1e9, dmgOut: 1 + 0.03 * n }); else b.dmgOut = 1 + 0.03 * n; }
// dismantle: three invisible slashes fan out ahead; everything in the cone is cut
function akDismantle(h, dir, dmg) {
  const R = 7, half = 0.5, x0 = h.x, z0 = h.z; SFX.at('bigcut', x0, z0, 0.75); SFX.at('whoosh', x0, z0, 0.6);
  for (const e of enemiesIn(h, x0, z0, R + 0.5)) { if (e.struct) continue; const a = angTo(x0, z0, e.x, e.z); if (Math.abs(angDiff(dir, a)) > half + 0.15) continue; damage(h, e, dmg, 0); after(udist(h, e) / 42, () => { akCutsOn(e, 4, false); SFX.at('cut', e.x, e.z, 0.55); }); }
  if (!FX.near(x0, z0, 60)) return;
  // two crescents rush out, a hair apart — the edge of a blade nobody can see
  akWave(x0, z0, dir, R + 0.4, half + 0.12, 0.17, 1.05); after(0.05, () => akWave(x0, z0, dir + 0.06, R, half, 0.2, 1.35));
  FX.glow(x0 + Math.sin(dir) * 1.1, 1.5, z0 + Math.cos(dir) * 1.1, 2.6, 0xffffff, 0.1, 'star');
  for (let i = -1; i <= 1; i++) { const a = dir + i * 0.32; after(0.03 * (i + 1), () => { for (let s = 1; s <= 3; s++) { const d = s * 2.2, x = x0 + Math.sin(a) * d, z = z0 + Math.cos(a) * d; akCut(x, 1.0 + s * 0.1, z, 2.8, a + HPI + rand(-0.2, 0.2), rand(-0.3, 0.3), 0.17, AKU.c, { slit: s === 3 }); } }); }
  // the ground is cut as the wave passes over it: scars open one after another, chips of stone and dust jump up
  for (let s = 1; s <= 3; s++) after(s * 0.045, () => { for (let i = -1; i <= 1; i++) { const a = dir + i * 0.32 + rand(-0.06, 0.06), d = s * 2.2, x = x0 + Math.sin(a) * d, z = z0 + Math.cos(a) * d; if (s === 2) akScar(x0 + Math.sin(a) * (R * 0.55), z0 + Math.cos(a) * (R * 0.55), R * 0.9, a, 2.8); FX.debris(x, 0.2, z, { n: 2, color: 0x3a3436, speed: [1, 3], up: 6, size: [0.12, 0.28] }); FX.burst(x, 0.3, z, { smoke: true, n: 1, color: 0x6a5a58, color2: 0x1a1214, speed: [0.5, 1.5], life: [0.4, 0.8], size: [0.8, 1.6], a: 0.35 }); } });
  FX.slash(x0 + Math.sin(dir) * 1.4, z0 + Math.cos(dir) * 1.4, dir, { r: 3, color: AKU.c, life: 0.18, sweep: 1.2 });
}
// cleave: a storm of cuts on one target that adapts to it — the tougher he is, the deeper they go
function akCleave(h, t, dmg) {
  h.trueT = Math.max(h.trueT || 0, G.time + 1.2); SFX.at('cut', t.x, t.z, 0.9); const low = t.kind === 'hero' && t.hp / t.maxHp < 0.35, k = low ? 1.4 : 1, H = (t.height || 2) * 0.55;
  // the cage closes: a thin red ring shrinks onto the target, then the cuts come from every side at once
  if (FX.near(t.x, t.z, 55)) { FX.ring(t.x, t.z, { r0: 2.6, r1: 0.5, color: AKU.c, life: 0.4, tex: 'ringThin', y: H }); FX.ring(t.x, t.z, { r0: 2.2, r1: 0.4, color: AKU.deep, life: 0.4, tex: 'crack', y: 0.1, op: 0.8 }); }
  for (let i = 0; i < 8; i++) after(0.05 * i, () => {
    if (!t.alive) return; damage(h, t, (dmg + t.maxHp * 0.06) / 8 * k, 0, { dot: i > 0 }); SFX.at('cut', t.x, t.z, 0.45);
    if (FX.near(t.x, t.z, 55)) { const a = rand(TAU); akCut(t.x + rand(-0.2, 0.2), H + rand(-0.6, 0.6), t.z + rand(-0.2, 0.2), rand(2.4, 3.6), a, rand(-1.4, 1.4), 0.16, AKU.c, { slit: i % 3 === 1 }); FX.sparks(t.x, H, t.z, { n: 3, color: 0xffffff, color2: AKU.c, speed: [3, 8], life: [0.1, 0.22], w: 0.06 }); if (i % 2) FX.burst(t.x, H, t.z, { n: 2, color: 0xc00a1c, color2: 0x3a0005, speed: [1, 4], life: [0.3, 0.6], size: [0.24, 0.05], grav: -12 }); }
  });
  after(0.42, () => {
    if (!t.alive) return; slow(h, t, 0.3, 1, 'akcleave'); akCutsOn(t, 6, true); SFX.at('bigcut', t.x, t.z, 0.85); if (low) FX.text(t.x, (t.height || 2) + 1, t.z, 'глубже', '#ff6a7a', 14);
    if (FX.near(t.x, t.z, 50)) {   // the finishing cross: two long cuts in an X, slits left hanging, a cross scarred into the ground
      const a = h.facing + HPI; akCut(t.x, H, t.z, 4.6, a, 0.75, 0.3, AKU.c, { slit: true }); akCut(t.x, H, t.z, 4.6, a, -0.75, 0.3, AKU.c, { slit: true });
      akScar(t.x, t.z, 3.2, h.facing + 0.7, 2.5); akScar(t.x, t.z, 3.2, h.facing - 0.7, 2.5);
      FX.hitstop(low ? 0.08 : 0.05); FX.shake(low ? 0.3 : 0.18); FX.glow(t.x, H, t.z, 4.5, 0xffffff, 0.12, 'flare');
      FX.ring(t.x, t.z, { r0: 0.3, r1: 2.8, color: AKU.c, life: 0.3, tex: 'shock', y: 0.2 }); FX.shock(t.x, t.z, 2.5, 0.6, 0.3);
    }
  });
}
// open — the fire arrow: a bow of flame takes shape in his hands, an arrow of white fire is loosed; it bursts on the first enemy hero
// (or at the end of its flight) into a column of fire, and the ground keeps burning
function akFuga(h, dir, dmg, burn) {
  const T = 0.45, near = FX.near(h.x, h.z, 60); h.trueT = Math.max(h.trueT || 0, G.time + 1); SFX.at('fire', h.x, h.z, 0.8); SFX.at('cast', h.x, h.z, 0.5);
  if (near) {   // the bow: an arc of fire in front of him, a white-hot arrow drawn back on it; the air pulls flame into his hands
    FX.text(h.x, h.height + 1.4, h.z, 'Открыть', '#ffb07a', 17);
    const g = new THREE.Group(), tor = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.07, 6, 20, Math.PI * 1.1), FX.mat('pillar', AKU.fire, 0.9)), tor2 = new THREE.Mesh(tor.geometry, akMat(null, 0xffe0b0));
    tor.userData.own = tor2.userData.own = true; tor.rotation.z = tor2.rotation.z = Math.PI * 0.45; tor2.scale.set(1, 1, 0.5); g.add(tor, tor2);
    const arr = new THREE.Mesh(FX.geo.bolt || _akCG, akMat(null, 0xffe8c0)); arr.userData.own = true; g.add(arr);
    FX.add(g, T + 0.15, (k, me, dt, en) => {
      if (!h.alive) { en.dead = true; return; } const a = h.facing, t = en.t, d = Math.min(1, t / T), hx = h.x + Math.sin(a) * 1.1, hz = h.z + Math.cos(a) * 1.1;
      me.position.set(hx, 1.6, hz); me.rotation.y = a + HPI; me.scale.setScalar(Math.min(1, t / 0.15)); const fo = t > T ? Math.max(0, 1 - (t - T) / 0.15) : 1;
      tor.material.opacity = 0.9 * fo; tor2.material.opacity = 0.7 * fo * (0.6 + 0.4 * Math.sin(t * 40));
      arr.visible = t < T; arr.rotation.set(0, -HPI, 0); arr.position.set(-0.2 + d * 0.5, 0, 0); arr.scale.set(0.5 + d * 0.7, 0.5 + d * 0.7, 1.2 + d * 1.2); arr.material.opacity = 0.5 + d * 0.5;
      if (Math.random() < dt * 30) FX.flame(hx, 1.6 + rand(-0.6, 0.6), hz, { n: 1, color: AKU.fire, color2: 0x8a1a05, size: [0.3, 0.7], life: [0.2, 0.4], up: 1 });
      if (t < T && Math.random() < dt * 40) FX.implode(hx, 1.6, hz, 2.6, { n: 1, color: 0xffd08a, color2: AKU.fire, life: 0.28, streak: true });
    });
  }
  after(T, () => {
    if (!h.alive) return; const a = h.facing; SFX.at('boom', h.x, h.z, 0.5); SFX.at('fire', h.x, h.z, 0.9);
    if (FX.near(h.x, h.z, 55)) { const hx = h.x + Math.sin(a) * 1.4, hz = h.z + Math.cos(a) * 1.4; FX.glow(hx, 1.6, hz, 5, 0xffd08a, 0.2, 'flare'); FX.ring(hx, hz, { r0: 0.3, r1: 2.4, color: AKU.fire, life: 0.3, tex: 'shock', y: 1.4 }); FX.light(hx, 2, hz, AKU.fire, 3, 14, 0.4); FX.shock(hx, hz, 2.2, 0.6, 0.3); FX.sparks(hx, 1.6, hz, { n: 10, color: 0xffffff, color2: AKU.fire, speed: [5, 12], life: [0.15, 0.3], w: 0.08, dir: a, spread: 0.5 }); }
    const p = shot(h, { dir: a, speed: 42, range: 13, w: 0.9, mesh: 'arrow', size: 1.6, color: AKU.fire, ribbon: 1.2, heroOnly: true,
      trail: q => { if (FX.near(q.x, q.z, 55)) FX.flame(q.x, q.y, q.z, { n: 2, color: 0xffd08a, color2: AKU.fire, size: [0.5, 1.1], life: [0.15, 0.3], up: 0.5 }); },
      onHit: () => { }, onEnd: (x, z) => akFugaBurst(h, x, z, dmg, burn) });
  });
}
function akFugaBurst(h, x, z, dmg, burn) {
  const R = 3.5; for (const e of enemiesIn(h, x, z, R)) { damage(h, e, dmg, 1); }
  SFX.at('bigboom', x, z, 0.75); SFX.at('fire', x, z, 1);
  if (FX.near(x, z, 60)) {
    FX.explosion(x, z, 2.8, AKU.fire, { color2: 0x8a1a05, el: 'fire' }); FX.pillar(x, z, { r: 1.7, h: 13, color: AKU.fire, life: 0.7, op: 0.55 }); FX.flame(x, 1, z, { n: 18, color: 0xffd08a, color2: AKU.fire, size: [1.4, 3.2], life: [0.5, 1], rad: 1.5, up: 4 });
    FX.heat(x, 2, z, 3.5, 1.4); FX.scorch(x, z, 2.6, AKU.fire, 7); FX.shake(0.5); FX.punch(0.5); FX.light(x, 3, z, AKU.fire, 4, 22, 0.9);
    FX.ring(x, z, { r0: 0.5, r1: 4.6, color: 0xffd08a, life: 0.4, tex: 'shock' }); FX.shock(x, z, 4.5, 1, 0.45);
    FX.sparks(x, 1, z, { n: 16, color: 0xffe0a0, color2: AKU.fire, speed: [3, 9], up: 8, grav: -5, life: [0.6, 1.2], w: 0.08 });
    // a fire whirl climbs out of the blast: flames thrown round a rising spiral
    let t = 0, ang = rand(TAU); G.actors.push({ update(dt) { t += dt; ang += dt * 11; if (FX.near(x, z, 60)) for (let i = 0; i < 2; i++) { const a = ang + i * Math.PI, y = (t * 9 + i * 2) % 8, r = 0.6 + y * 0.18; FX.flame(x + Math.sin(a) * r, 0.4 + y, z + Math.cos(a) * r, { n: 1, color: 0xffc070, color2: AKU.fire, size: [0.6, 1.4], life: [0.25, 0.45], up: 2 }); } return t < 0.9; } });
  }
  zone(h, { x, z, r: 2.8, every: 0.5, dur: 3, tick: Z => { for (const e of enemiesIn(h, x, z, 2.8)) { damage(h, e, burn, 1, { dot: true }); if (e.alive) slow(h, e, 0.25, 0.6, 'akburn'); } if (FX.near(x, z, 50)) { FX.flame(x, 0.4, z, { n: 6, color: AKU.fire, color2: 0x5a1005, size: [0.8, 1.8], life: [0.4, 0.8], rad: 2.2, up: 2 }); FX.sparks(x, 0.5, z, { n: 3, color: 0xffd08a, color2: AKU.fire, speed: [0.5, 2], up: 5, grav: -2, life: [0.6, 1.1], w: 0.06, rad: 2 }); } } });
}
// the Shrine of Malice: a temple of bone rises behind him — no barrier at all, the domain is simply there; for its whole duration
// everything inside is cut, again and again (his true form shows: four arms, four eyes ablaze)
let _akShrine = null;
function akShrineMesh() {
  if (!_akShrine) {
    const g = new THREE.Group(), k = kit(), wood = 0x2a0e10, red = 0x7a1218, bone = 0xd8ccb4, stone = 0x2a2628, dk = 0x070506;
    k.b(5.2, 0.5, 3.6, stone, 0, 0.25, 0).b(4.6, 0.3, 3.2, 0x3a3436, 0, 0.6, 0);
    for (const [x, z] of [[-1.9, 1.2], [1.9, 1.2], [-1.9, -1.2], [1.9, -1.2]]) k.y(0.2, 0.24, 3.6, 8, red, x, 2.5, z).b(0.6, 0.2, 0.6, wood, x, 0.8, z).b(0.5, 0.2, 0.5, wood, x, 4.2, z);
    k.b(4.6, 0.3, 3.0, wood, 0, 4.4, 0).t(3.2, 2.2, 5.6, 4.0, 0.9, dk, 0, 4.95, 0).t(1.6, 1.2, 3.4, 2.4, 0.8, dk, 0, 5.8, 0).b(0.4, 0.5, 0.4, wood, 0, 6.4, 0);
    for (const [x, z] of [[-2.8, 2.0], [2.8, 2.0], [-2.8, -2.0], [2.8, -2.0]]) k.c(0.14, 0.7, 4, dk, x, 4.75, z, z > 0 ? -0.9 : 0.9, 0, x > 0 ? 0.9 : -0.9);
    for (const sd of [-1, 1]) k.c(0.22, 1.6, 6, bone, sd * 0.9, 7.0, 0, 0, 0, -sd * 0.6).c(0.13, 0.9, 6, bone, sd * 1.5, 7.9, 0, 0, 0, -sd * 0.15);   // great horns on the roof
    // the mouth: between the front pillars a black maw with rows of teeth and lips of raw red
    k.b(3.2, 2.6, 0.2, dk, 0, 2.3, 1.25).b(3.4, 0.35, 0.3, red, 0, 3.65, 1.3).b(3.4, 0.35, 0.3, red, 0, 0.95, 1.3);
    for (let i = 0; i < 10; i++) { const x = -1.4 + i * 0.31; k.c(0.12, 0.6, 4, bone, x, 3.2, 1.38, Math.PI).c(0.12, 0.55, 4, bone, x + 0.15, 1.38, 1.38); }
    k.b(0.18, 0.18, 0.1, { g: 0xff2030 }, -0.7, 4.0, 1.42).b(0.18, 0.18, 0.1, { g: 0xff2030 }, 0.7, 4.0, 1.42);
    // skulls heaped round the base
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, r = 2.6 + (i % 3) * 0.25, x = Math.sin(a) * r * 1.1, z = Math.cos(a) * r * 0.8; k.i(0.28, bone, x, 0.55 + (i % 2) * 0.25, z, 1).b(0.08, 0.08, 0.05, dk, x - 0.09, 0.6 + (i % 2) * 0.25, z + 0.26).b(0.08, 0.08, 0.05, dk, x + 0.09, 0.6 + (i % 2) * 0.25, z + 0.26); }
    k.into(g, new THREE.MeshPhongMaterial({ vertexColors: true, flatShading: true, shininess: 10 }), new THREE.MeshBasicMaterial({ vertexColors: true })); _akShrine = g;
  }
  return _akShrine.clone(true);
}
function akShrine(h, tick, last) {
  const R = 9, DUR = 4.5, x = h.x, z = h.z, sa = h.facing + Math.PI, sx = x + Math.sin(sa) * 4.5, sz = z + Math.cos(sa) * 4.5, near = FX.near(x, z, 80);
  h.trueT = G.time + DUR + 0.3; h.shrineT = G.time + DUR; SFX.at('shrine', x, z, 1); SFX.at('dark', x, z, 0.8); G.dim = Math.max(G.dim || 0, FX.near(x, z, 40) ? 0.7 : 0);
  globalWarn(h, null, 'Расширение территории: Храм злобы');
  if (G.player && h.team === G.player.team) mmMark({ x, z, r: R, color: '#ff4a5a', until: G.time + DUR });
  if (near) {
    FX.text(x, h.height + 1.6, z, 'Расширение территории', '#ff8a96', 18);
    const sh = akShrineMesh(), q = NAV.nearest(sx, sz), my = sa + Math.PI, mx = q.x + Math.sin(my) * 1.5, mz = q.z + Math.cos(my) * 1.5;
    FX.add(sh, DUR + 0.8, (k, me, dt, en) => {
      const t = en.t, up = easeOut(Math.min(1, t / 0.6)), dn = t > DUR ? Math.min(1, (t - DUR) / 0.8) : 0; me.position.set(q.x, -7 * (1 - up) - 7 * dn * dn, q.z); me.rotation.y = my;
      if (t < 0.7 && Math.random() < dt * 40) FX.debris(q.x + rand(-2.5, 2.5), 0.3, q.z + rand(-2, 2), { n: 1, color: 0x2a2426, speed: [1, 3], up: 6, size: [0.2, 0.5] });
      // the maw breathes: dark red smoke and a glow from the mouth, the shrine's light pulsing on the ground
      if (t > 0.5 && t < DUR && Math.random() < dt * 14) FX.flame(mx, 2.2 + rand(-0.6, 0.6), mz, { n: 1, color: 0x8a0a14, color2: 0x1a0204, size: [0.8, 1.8], life: [0.5, 0.9], up: 1.5, a: 0.6 });
      if (t > 0.5 && t < DUR && Math.floor(t / 0.45) !== Math.floor((t - dt) / 0.45)) FX.light(mx, 3, mz, AKU.c, 2.6, 16, 0.5);
    });
    FX.burst(q.x, 0.5, q.z, { smoke: true, n: 18, color: 0x2a0a0e, color2: 0x050203, speed: [1, 4], life: [0.8, 1.5], size: [1.5, 3.2], rad: 2.5, up: 2, a: 0.6 }); FX.shake(0.6); FX.punch(0.6);
    // the hand sign: a red flash on him, and the domain spreads out from him in one wave
    FX.glow(h.x, h.height * 0.8, h.z, 5, AKU.c, 0.4, 'star'); FX.glow(h.x, h.height * 0.8, h.z, 8, 0xffffff, 0.15, 'flare');
    FX.ring(x, z, { r0: 0.5, r1: R, color: AKU.c, life: 0.45, tex: 'shock' }); FX.shock(x, z, R, 1.2, 0.55);
    // the ground of the domain: dark, veined with red, covered in fresh cuts; it spreads from the centre with the wave
    const disc = new THREE.Mesh(FX.geo.flat, new THREE.MeshBasicMaterial({ map: TEX.disc, color: 0x1a0306, transparent: true, opacity: 0, depthWrite: false })); disc.position.set(x, 0.07, z); disc.renderOrder = 3;
    FX.add(disc, DUR + 0.5, (k, me, dt, en) => { const s = R * 2 * RK * easeOut(Math.min(1, en.t / 0.45)); me.scale.set(s, 1, s); me.material.opacity = 0.6 * Math.min(1, en.t / 0.3, (DUR + 0.5 - en.t) / 0.5); });
    FX.zone(x, z, R, AKU.c, DUR, { tex: 'crack', spin: 0, op: 0.7 }); FX.zone(x, z, R, AKU.c, DUR, { tex: 'ringThin', spin: 0, op: 1 }); FX.wall(x, z, R, AKU.deep, DUR, { h: 1.6, op: 0.3, spin: 0 });
  }
  let acc = 0, t = 0, vis = 0, big = 0.35, snd = 0;
  G.actors.push({ update(dt) {
    t += dt; acc += dt; vis += dt; big -= dt; snd -= dt;
    if (near && vis > 0.04) { vis = 0; for (let i = 0; i < 2; i++) { const a = rand(TAU), r = Math.sqrt(Math.random()) * R, cx = x + Math.sin(a) * r, cz = z + Math.cos(a) * r; akCut(cx, rand(0.4, 3.2), cz, rand(2.2, 4.8), rand(TAU), rand(-1.4, 1.4), 0.16, AKU.c, { slit: Math.random() < 0.15 }); if (Math.random() < 0.3) akScar(cx, cz, rand(1.5, 3.5), rand(TAU), 2); } }
    if (snd <= 0 && t < DUR) { snd = 0.11; SFX.at('cut', x + rand(-R, R) * 0.6, z + rand(-R, R) * 0.6, 0.3); }
    // every third of a second one huge cut slices straight across the whole circle, scarring the ground end to end
    if (big <= 0 && t < DUR - 0.2) { big = 0.32; const p = rand(TAU), d = rand(-R, R) * 0.6, cx = x + Math.sin(p) * d, cz = z + Math.cos(p) * d, len = 2 * Math.sqrt(R * R - d * d);
      SFX.at('bigcut', cx, cz, 0.5);
      if (near) { akCut(cx, rand(0.9, 2.2), cz, len, p, rand(-0.25, 0.25), 0.24, AKU.c, { slit: true }); akScar(cx, cz, len * 0.9, p + HPI, 2.4); for (let i = -1; i <= 1; i++) { const ex = cx + Math.sin(p + HPI) * i * len * 0.3, ez = cz + Math.cos(p + HPI) * i * len * 0.3; FX.debris(ex, 0.2, ez, { n: 2, color: 0x2a2426, speed: [1, 4], up: 7, size: [0.15, 0.35] }); } } }
    while (acc >= 0.25 && t <= DUR) { acc -= 0.25;
      for (const e of enemiesIn(h, x, z, R)) { if (e.struct) continue; damage(h, e, tick + (e.kind === 'hero' ? e.maxHp * 0.005 : 0), 0, { dot: true }); if (e.alive) slow(h, e, 0.25, 0.35, 'akshrine'); if (Math.random() < 0.5) akCutsOn(e, 2, false); }
      if (Math.random() < 0.5) SFX.at('slash', x + rand(-R, R) * 0.5, z + rand(-R, R) * 0.5, 0.35);
    }
    if (t >= DUR) {   // it closes with one last sweep of cuts across the whole circle
      for (const e of enemiesIn(h, x, z, R)) { if (e.struct) continue; damage(h, e, last, 0); akCutsOn(e, 6, true); }
      if (FX.near(x, z, 70)) { for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; akCut(x + Math.sin(a) * R * 0.5, 1.4, z + Math.cos(a) * R * 0.5, R, a + HPI, rand(-0.2, 0.2), 0.3, AKU.c, { slit: i % 2 === 0 }); } FX.shock(x, z, R, 1.2, 0.5); FX.shake(0.6); FX.hitstop(0.07); FX.punch(0.6); FX.glow(x, 2, z, 12, 0xffffff, 0.14, 'flare'); FX.ring(x, z, { r0: 1, r1: R + 1, color: AKU.c, life: 0.4, tex: 'shock' }); FX.burst(x, 0.5, z, { smoke: true, n: 14, color: 0x3a1418, color2: 0x050203, speed: [3, 7], life: [0.6, 1.2], size: [1.2, 2.6], ring: true, rad: R * 0.5, a: 0.5 }); }
      SFX.at('heavy', x, z, 0.9); SFX.at('bigcut', x, z, 1); return false;
    }
    return true;
  } });
  akClash(h);
}

/* ---------- the strongest and the king of curses: lines in the chat when they share a match ---------- */
const AK_LINES = {
  startFoe: [['akuro', 'Сильнейший, говорите? Посмотрим, сколько ты продержишься.'], ['kaisei', 'Не обольщайся. Я ещё даже не начинал.']],
  startAlly: [['kaisei', 'Только попробуй ударить в спину.'], ['akuro', 'Не льсти себе. Мне интересны только сильные враги.']],
  meet: [['akuro', 'Наконец-то. Ну же, развлеки меня.'], ['kaisei', 'Ты слишком много болтаешь для того, кто веками сидел в пальцах.']],
  akuroWins: [['akuro', 'Неплохо. Даже жаль, что всё кончилось так быстро.']],
  kaiseiWins: [['kaisei', 'Я же говорил: сильнейший здесь я.'], ['akuro', 'Хм. В следующий раз я не буду сдерживаться.']],
  clash: [['akuro', 'Барьер? Мне он не нужен.'], ['kaisei', 'Территория без стен... Наглость, конечно, впечатляет.']]
};
// lines are queued one after another (two exchanges never get mixed); the queue lives on Akuro, so it starts fresh every match
function akTalk(key) {
  if (typeof UI === 'undefined' || !G.player) return; const lines = AK_LINES[key], A = G.heroes.find(o => o.def.id === 'akuro'); if (!lines || !A) return;
  const t0 = Math.max(G.time, A.dlgAt || 0); A.dlgAt = t0 + lines.length * 1.7 + 0.4;
  lines.forEach(([id, text], i) => after(t0 - G.time + i * 1.7, () => { const who = G.heroes.find(o => o.def.id === id); if (who) UI.say(who, text); }));
}
function akKaisei() { return G.heroes.find(o => o.def.id === 'kaisei'); }
function akDialog(h) {
  const K = akKaisei(); if (!K) return; const D = h.dlg || (h.dlg = { start: false, meet: false, killT: -99 });
  if (!D.start && G.time > 4) { D.start = true; akTalk(K.team === h.team ? 'startAlly' : 'startFoe'); }
  if (!D.meet && K.team !== h.team && h.alive && K.alive && udist(h, K) < 14 && G.time > 10) { D.meet = true; akTalk('meet'); }
}
// two domains at once: the open one wins — it does not need walls
function akClash(h) { const K = akKaisei(); if (K && K.team !== h.team && K.domainT > G.time && udist(h, K) < 18 && !(h.dlg && h.dlg.clash)) { (h.dlg || (h.dlg = {})).clash = true; akTalk('clash'); } }

/* ==================================================================== 66. SEIRYU & THE PALADIN ==================================================================== */
const SEI_MECH = { bulk: 1.15, h: 1.12, scale: 1.95, c1: 0x868c98, c2: 0x23262f, c3: 0x18191f, skin: 0x343844, hands: 0x868c98, cuff: 0x868c98, metal: 0x8a6c2a, glow: SEI.c, head: 'paladin', chest: 'paladin', sh: 'paladin', legs: 'paladin', weapon: 'mvs', wc: 'melee', back: 'lightwings' };
function seInit(h) { const B = h.def; h.def = Object.create(B); h.mech = null; h.pilotCd = [0, 0, 0, 0]; }
// «Live!» (innate): the command burned into him will not let him die — below a quarter of his health his eyes flash red and for 2.5 s
// he takes 40% less damage, moves 40% faster and slips a third of all attacks; on foot it also hands him back his leap and his wall-run
function seLive(h) {
  if (G.time < (h.liveCd || 0) || !h.alive) return; h.liveCd = G.time + 60; h.liveT = G.time + 2.5;
  addBuff(h, { id: 'live', dur: 2.5, dmgIn: 0.6, ms: 0.4 }); FX.text(h.x, h.height + 1.2, h.z, 'Живи!', '#ff4a5a', 20); SFX.at('heartbeat', h.x, h.z, 0.8); SFX.at('charge', h.x, h.z, 0.45);
  if (!h.mech) { h.cd[0] = Math.min(h.cd[0], 0); h.cd[2] = Math.min(h.cd[2], 0); }
  if (FX.near(h.x, h.z, 50)) { FX.ring(h.x, h.z, { r0: 2.2, r1: 0.4, color: 0xff2a3a, life: 0.35, tex: 'ringThin' }); FX.glow(h.x, h.height * 0.8, h.z, 3, 0xff2a3a, 0.3, 'star'); FX.aura(h, 0xff2a3a, 2.5, 1.6, 'ringThin', 3); }
}
// the knee: a burst to the target and a knee to the body — damage and a stun
function seKnee(h, t, dmg) {
  const a = angTo(h.x, h.z, t.x, t.z); h.facing = a; h.anim.castT = h.anim.castDur = 0.4; h.anim.castType = 'thrust';
  damage(h, t, dmg, 0); if (t.alive) stun(h, t, 0.9); SFX.at('kick', t.x, t.z, 0.9); SFX.at('impact', t.x, t.z, 0.6);
  if (FX.near(t.x, t.z, 50)) { FX.hit(t.x, 1.4, t.z, SEI.c, true); FX.ring(t.x, t.z, { r0: 0.3, r1: 2.2, color: SEI.c, life: 0.28, tex: 'shock', y: 1.3 }); FX.hitstop(0.05); FX.shake(0.15); FX.text(t.x, t.height + 0.8, t.z, 'контрудар', '#9fffd4', 14); }
}
// reflexes: while they last, he slips every attack; the first hero (or monster) whose blow he slips gets a counter — he is on him at once with a knee
function seDodge(h, src) {
  h.jolt = { a: angTo(src.x, src.z, h.x, h.z) + (Math.random() < 0.5 ? HPI : -HPI), p: 0.9, t: 0.16 }; SFX.at('whoosh', h.x, h.z, 0.35);
  if (FX.near(h.x, h.z, 45)) { dshGhost(h, SEI.c, 0.35, 0.35); FX.text(h.x, h.height + 0.5, h.z, 'уклон', '#b8ffe6', 13); FX.sparks(h.x, 1.4, h.z, { n: 3, color: 0xffffff, color2: SEI.c, speed: [1, 3], life: [0.12, 0.25], w: 0.06 }); }
  if (!h.counter || h.reflexT < G.time || !src.alive || src.struct || (src.kind !== 'hero' && src.kind !== 'monster') || udist(h, src) > 9.5 || h.dash || h.stunned) return;
  const dmg = h.counter; h.counter = 0;
  if (udist(h, src) < src.radius + 2) { seKnee(h, src, dmg); return; }
  dashTo(h, src.x, src.z, 44, { follow: src, stop: src.radius + 1.2, ribbon: SEI.c, onEnd: () => { if (src.alive && h.alive) seKnee(h, src, dmg); } });
}
// the second flip: a spinning kick in place that throws everyone around him back
function seWhirl(h, dmg) {
  h.spinning = true; h.spinEnd = G.time + 0.4; SFX.at('whoosh', h.x, h.z, 0.8); SFX.at('kick', h.x, h.z, 0.85);
  for (const e of enemiesIn(h, h.x, h.z, 3)) { if (e.struct) continue; damage(h, e, dmg, 0); knock(e, h.x, h.z, 3.5, 0.25); }
  if (FX.near(h.x, h.z, 55)) { FX.slash(h.x, h.z, h.facing, { r: 3, color: SEI.c, life: 0.3, sweep: 6.2, y: 0.9 }); FX.ring(h.x, h.z, { r0: 0.5, r1: 3.6, color: SEI.c, life: 0.35, tex: 'shock' }); FX.shock(h.x, h.z, 3.5, 0.7, 0.35); FX.burst(h.x, 0.3, h.z, { smoke: true, n: 8, color: 0xc8c0b0, color2: 0x4a4038, speed: [2, 5], life: [0.4, 0.8], size: [0.7, 1.4], ring: true, a: 0.4 }); }
}
let _seHex = null;
// Blaze Luminous (the mech's own): a hexagonal shield of green light flashes up toward the blow and takes most of it; once every 6 s, abilities only
function seBlaze(h, src) {
  h.blazeT = G.time + 6; SFX.at('shield', h.x, h.z, 0.8); SFX.at('arcane', h.x, h.z, 0.45); if (!FX.near(h.x, h.z, 50)) return;
  if (!_seHex) _seHex = [new THREE.CircleGeometry(1.45, 6), new THREE.RingGeometry(1.33, 1.48, 6)];
  const a = src ? angTo(h.x, h.z, src.x, src.z) : h.facing, g = new THREE.Mesh(_seHex[0], akMat(null, SEI.c)), w = new THREE.Mesh(_seHex[1], akMat(null, 0xeafff4)); w.userData.own = true; g.add(w);
  FX.add(g, 0.5, (k, me) => { me.position.set(h.x + Math.sin(a) * 2, 2.6, h.z + Math.cos(a) * 2); me.rotation.set(0, a, Math.PI / 6); me.scale.setScalar(0.7 + 0.3 * easeOut(Math.min(1, k * 4))); me.material.opacity = 0.2 * (1 - k); w.material.opacity = 0.9 * (1 - k); });
  FX.sparks(h.x + Math.sin(a) * 2, 2.6, h.z + Math.cos(a) * 2, { n: 8, color: 0xffffff, color2: SEI.c, speed: [3, 8], life: [0.15, 0.3], w: 0.07, dir: a, spread: 1 });
}
// climbing in: the Paladin comes down out of the sky on wings of green light, lands, he leaps into the cockpit — and the knight is twice a man's height
function seMechOn(h, fuel, armor) {
  if (h.mech) return; const lv = Math.max(1, h.al[3]); h.flipT = 0; h.reflexT = 0;
  for (let i = 0; i < 4; i++) h.pilotCd[i] = h.cd[i];
  if (!h.mechRig) h.mechRig = buildHero(SEI_MECH, h.isPlayer ? 0xeaffea : TEAM_COL[h.team]);
  h.humanRig = h.rig; const old = h.rig, nr = h.mechRig; G.scene.remove(old.root); h.rig = nr; nr.root.visible = true; nr.root.position.set(h.x, 0, h.z); nr.root.rotation.y = h.facing; nr.root.scale.setScalar(nr.sc0); nr.tilt.rotation.x = 0; G.scene.add(nr.root);
  h.height = nr.height; h.radius = 1.45; h.anim.castT = 0; h.anim.atkT = 0; h.range = 3.2;
  const B = Object.getPrototypeOf(h.def); h.def.abilities = B.mechKit; h.def.noSlash = false; h.pcol = SEI.c;
  for (let i = 0; i < 4; i++) h.cd[i] = 0; h.fleija = true;
  h.mech = { fuel, max: fuel, hold: 0 };
  addBuff(h, { id: 'mech', dur: 999, ad: 30 + lv * 12, def: 25, ms: 0.1, shield: armor, onEnd: (u, b) => seMechOff(u, b.shield <= 1) });
  if (h.isPlayer) seHud(h);
}
function seMechOff(h, broken) {
  if (!h.mech) return; h.mech = null; const old = h.rig, hr = h.humanRig || old; const mx = h.x, mz = h.z, face = h.facing;
  G.scene.remove(old.root); h.rig = hr; hr.root.visible = h.alive; hr.root.position.set(h.x, 0, h.z); hr.root.rotation.y = h.facing; G.scene.add(hr.root);
  h.height = hr.height || 2.2; h.radius = 0.9; h.range = h.def.stats.range; const B = Object.getPrototypeOf(h.def); h.def.abilities = B.abilities;
  for (let i = 0; i < 4; i++) h.cd[i] = Math.max(0, h.pilotCd[i] - 0); h.cd[3] = B.abilities[3].cd * 100 / (100 + h.haste); h.fleija = false;
  for (const b of h.buffs) if (b.id === 'mech') b.dead = true;
  if (h.isPlayer) seHud(h);
  if (!FX.near(mx, mz, 60)) return;
  if (broken && h.alive) { const a = face + Math.PI; dashTo(h, h.x + Math.sin(a) * 4, h.z + Math.cos(a) * 4, 18, { arc: 2.6, ribbon: SEI.c }); }
  if (broken) {   // shot down: the knight bursts in green fire and the pilot is thrown clear
    FX.explosion(mx, mz, 2.5, SEI.c, { color2: 0x0a4a2a }); FX.debris(mx, 2, mz, { n: 14, color: 0xdfe3ea, speed: [3, 9], up: 9, size: [0.2, 0.5] }); SFX.at('bigboom', mx, mz, 1); SFX.at('servo', mx, mz, 0.5); FX.text(mx, 4, mz, 'Паладин сбит', '#9fffd4', 16);
  } else {   // its time is up: the knight spreads its wings and rises away
    const g = twGhost(old, SEI.c, 1.2, 0.5, mx, mz); if (g) { g.mesh.rotation.y = face; const e = g.fn; g.fn = (k, me, dt, en) => { e(k, me, dt, en); me.position.y = 18 * k * k; }; }
    FX.pillar(mx, mz, { r: 1.2, h: 14, color: SEI.c, life: 0.6, op: 0.35 }); SFX.at('flap', mx, mz, 0.75); SFX.at('gust', mx, mz, 0.5);
  }
  SFX.at('servo', h.x, h.z, 0.45);
}
function seHud(h) {
  if (typeof UI === 'undefined' || !$('abs')) return; const D = h.def, col = h.mech ? SEI.c : D.look.glow;
  for (let i = 0; i < 4; i++) { const a = D.abilities[i], el = $('ab' + i); if (!a || !el) continue; el.children[0].src = iconURL(a.icon, a.iconCol || col); const c = el.querySelector('.cost'); if (c) c.textContent = a.fuel ? '⚡' + a.fuel : (a.cost || ''); }
  UI.lastCd = h.cd.slice(); G.aim = -1; UI.tip();
}
// the Paladin's arrival: it drops from high above with its wings blazing, the ground cracks under it
function seMechArrive(h, cb) {
  const x = h.x, z = h.z, T = 0.75; SFX.at('ultcue', x, z, 0.7); SFX.at('flap', x, z, 0.8); SFX.at('gust', x, z, 0.6);
  if (FX.near(x, z, 70)) {
    if (!h.mechRig) h.mechRig = buildHero(SEI_MECH, h.isPlayer ? 0xeaffea : TEAM_COL[h.team]);
    const g = twGhost(h.mechRig, SEI.c, T, 0.8, x, z); if (g) { const f0 = g.fn; g.fn = (k, me, dt, en) => { f0(k, me, dt, en); me.position.set(h.x, 26 * (1 - easeOut(k)), h.z); me.rotation.y = h.facing; me.scale.setScalar(h.mechRig.sc0); if (Math.random() < 0.6) FX.trail(h.x + rand(-1, 1), me.position.y + 3, h.z + rand(-1, 1), SEI.c, 1.2, 2); }; }
    FX.decal(x, z, 3, SEI.c, T);
  }
  after(T, () => { if (!h.alive) return; SFX.at('heavy', h.x, h.z, 1); SFX.at('rubble', h.x, h.z, 0.6); SFX.at('servo', h.x, h.z, 0.7); if (FX.near(h.x, h.z, 60)) { FX.ring(h.x, h.z, { r0: 0.5, r1: 5, color: SEI.c, life: 0.5, tex: 'shock' }); FX.shock(h.x, h.z, 5, 1.1, 0.45); FX.debris(h.x, 0.3, h.z, { n: 14, color: 0x45423c, speed: [3, 9], up: 9, size: [0.2, 0.5] }); FX.burst(h.x, 0.5, h.z, { smoke: true, n: 12, color: 0xb8c0b8, color2: 0x3a3e3a, speed: [2, 6], life: [0.6, 1.2], size: [1.2, 2.6], ring: true, a: 0.45 }); FX.shake(0.5); FX.scorch(h.x, h.z, 2.2, SEI.c, 6); }
    for (const e of enemiesIn(h, h.x, h.z, 3.5)) { if (!e.struct) { damage(h, e, cb.land, 0); if (e.alive) stun(h, e, 0.8, 1); } }
    cb.on();
  });
}
// the VARIS: a charged round from the rifle in the knight's arms — a bolt of green-white energy that goes through everything and throws them back
function seVaris(h, dir, dmg) {
  SFX.at('railgun', h.x, h.z, 0.9); SFX.at('rifle', h.x, h.z, 0.5); const sx = h.x + Math.sin(dir) * 2.2, sz = h.z + Math.cos(dir) * 2.2;
  if (FX.near(sx, sz, 60)) { FX.glow(sx, 3, sz, 4, SEI.c, 0.2, 'star'); FX.ring(sx, sz, { r0: 0.3, r1: 2.2, color: SEI.pale, life: 0.25, tex: 'ringThin', y: 3 }); FX.warp('lens', sx, 3, sz, { r: 2.5, str: 0.8, life: 0.25 }); }
  shot(h, { x: sx, z: sz, y: 3, dir, speed: 55, range: 14, w: 1.0, pierce: true, mesh: 'bolt', size: 2.4, color: SEI.c, ribbon: 1.4,
    onHit: e => { damage(h, e, dmg, 0); knock(e, h.x, h.z, 2, 0.2); SFX.at('impact', e.x, e.z, 0.5); if (FX.near(e.x, e.z, 50)) { FX.sparks(e.x, 1.4, e.z, { n: 12, color: 0xffffff, color2: SEI.c, speed: [4, 11], life: [0.15, 0.35], w: 0.09, dir, spread: 0.5 }); FX.hit(e.x, 1.4, e.z, SEI.c, true); } } });
}
// MVS: the knight lunges through the enemy line with both blades out, cutting everyone it passes, and ends the run in one wide spin
function seMvsDash(h, dir, dmg) {
  const L = 7.5, tx = h.x + Math.sin(dir) * L, tz = h.z + Math.cos(dir) * L; SFX.at('dash', h.x, h.z, 0.8); SFX.at('blade', h.x, h.z, 0.7); SFX.at('sizzle', h.x, h.z, 0.3);
  dashTo(h, tx, tz, 34, { ribbon: 0xff4a3a, w: 2, onHit: e => { if (e.struct) return; damage(h, e, dmg, 0); if (e.alive) slow(h, e, 0.3, 1.5, 'semvs'); SFX.at('blade', e.x, e.z, 0.6); if (FX.near(e.x, e.z, 50)) { FX.slash(e.x, e.z, dir + HPI, { r: 2.4, color: 0xff4a3a, life: 0.2, sweep: 1.6, y: 1.6 }); FX.sparks(e.x, 1.6, e.z, { n: 8, color: 0xffffff, color2: 0xff4a3a, speed: [4, 10], life: [0.12, 0.3], w: 0.08, dir, spread: 0.7 }); } },
    onEnd: () => { if (h.alive) seMvs(h, dmg * 0.5); } });
}
// the spin at the end of the run: a ring of hot red edges
function seMvs(h, dmg) {
  h.spinning = true; h.spinEnd = G.time + 0.45; SFX.at('scythe', h.x, h.z, 0.9); SFX.at('blade', h.x, h.z, 0.6);
  for (const e of enemiesIn(h, h.x, h.z, 4.2)) { if (e.struct) continue; damage(h, e, dmg, 0); if (e.alive) slow(h, e, 0.3, 1.5, 'semvs'); }
  if (FX.near(h.x, h.z, 55)) { FX.slash(h.x, h.z, h.facing, { r: 4.2, color: 0xff4a3a, life: 0.3, sweep: 6.2, y: 2.5 }); FX.slash(h.x, h.z, h.facing + Math.PI, { r: 3.8, color: SEI.c, life: 0.3, sweep: 6.2, y: 2.0, flip: true }); FX.ring(h.x, h.z, { r0: 1, r1: 4.6, color: 0xff4a3a, life: 0.35, tex: 'shock' }); FX.sparks(h.x, 2.5, h.z, { n: 18, color: 0xffffff, color2: 0xff4a3a, speed: [5, 12], life: [0.15, 0.35], w: 0.09, ring: true }); }
}
// slash harken: a cable fired from the waist; it bites the first enemy (the knight is hauled to him and he is stunned) or the ground (the knight is hauled there)
function seHarken(h, x, z, dmg) {
  const dir = angTo(h.x, h.z, x, z), len = Math.min(11, dist(h.x, h.z, x, z) + 0.5); let hitU = null; SFX.at('crossbow', h.x, h.z, 0.6); SFX.at('chain', h.x, h.z, 0.7);
  for (const e of stripHits(h, h.x, h.z, dir, len, 0.8)) if (!e.struct && (!hitU || udist(h, e) < udist(h, hitU))) hitU = e;
  const tx = hitU ? hitU.x : h.x + Math.sin(dir) * len, tz = hitU ? hitU.z : h.z + Math.cos(dir) * len;
  if (FX.near(h.x, h.z, 60)) FX.beam(h.x, h.z, tx, tz, { color: SEI.c, w: 0.25, life: 0.35, y: 1.8 });
  const stop = hitU ? hitU.radius + 1.5 : 0;
  dashTo(h, tx, tz, 34, { stop, ribbon: SEI.c, fly: true, onEnd: () => { if (hitU && hitU.alive) { damage(h, hitU, dmg, 0); stun(h, hitU, 0.6); if (FX.near(hitU.x, hitU.z, 50)) FX.hit(hitU.x, 1.6, hitU.z, SEI.c, true); SFX.at('mace', hitU.x, hitU.z, 0.8); } } });
}
// a bot fires the warhead when it pays: the tank is nearly dry, two heroes stand together, or the target is low
function seFleijaAI(h, mode, tgt) {
  if (!h.mech || !h.fleija || !tgt || tgt.kind !== 'hero' || udist(h, tgt) > 14) return null;
  if (h.mech.fuel < 6 || foesNear(h, tgt.x, tgt.z, 6) >= 2 || tgt.hp / tgt.maxHp < 0.4) return { x: tgt.x, z: tgt.z };
  return null;
}
// FLEIJA: a warhead fired at a point — a sphere of pink light swells, swallowing everything inside, then collapses into nothing
function seFleija(h, x, z, dmg) {
  const R = 7, T = 0.7, near = FX.near(x, z, 80); h.fleija = false; SFX.at('ultcue', h.x, h.z, 0.9); SFX.at('rocket', h.x, h.z, 0.7); globalWarn(h, null, 'ФЛЕЙЯ!');
  // the warhead drinks the knight's whole energy filler: the fuller the tank, the bigger the blast — and the Paladin leaves once it is over
  if (h.mech) { const f = h.mech.fuel / h.mech.max; dmg *= 0.55 + 0.75 * f; h.mech.fuel = 0; h.mech.hold = G.time + 2.4; if (FX.near(h.x, h.z, 45)) FX.text(h.x, h.height + 1.2, h.z, 'заряд ' + Math.round(f * 100) + '%', '#ffb0ea', 15); }
  G.dangers.push({ x, z, r: R, team: h.team, until: G.time + T + 1 });
  if (near) {
    FX.decal(x, z, R, SEI.flj, T);
    const w = new THREE.Mesh(FX.geo.orb, new THREE.MeshBasicMaterial({ color: SEI.flj })), sx = h.x, sz = h.z;
    FX.add(w, T, (k, me) => { me.position.set(lerp(sx, x, k), 3 + Math.sin(Math.PI * k) * 8, lerp(sz, z, k)); me.scale.setScalar(0.8); FX.trail(me.position.x, me.position.y, me.position.z, SEI.flj, 0.8, 3); });
  }
  after(T, () => {
    SFX.at('bigboom', x, z, 1); SFX.at('warp', x, z, 1); SFX.at('charge', x, z, 0.6); if (FX.near(x, z, 60)) { G.dim = Math.max(G.dim || 0, 0.6); FX.punch(0.8); FX.shake(0.8); FX.hitstop(0.08); }
    const GROW = 0.7, HOLD = 0.5, FALL = 0.45, TOT = GROW + HOLD + FALL;
    if (FX.near(x, z, 80)) {
      const sh = new THREE.Mesh(FX.geo.sphere, FX.rimMat(SEI.flj, 1.4)), core = new THREE.Mesh(FX.geo.sphere, new THREE.MeshBasicMaterial({ color: 0xffb0ea, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false })); core.userData.own = true; sh.add(core); core.scale.setScalar(0.96);
      FX.add(sh, TOT, (k, me, dt, en) => { const t = en.t, s = t < GROW ? R * easeOut(t / GROW) : (t < GROW + HOLD ? R * (1 + Math.sin(t * 30) * 0.01) : R * Math.max(0.01, 1 - easeOut((t - GROW - HOLD) / FALL))); me.position.set(x, 0, z); me.scale.setScalar(s); me.material.uniforms.o.value = 1.4 * (t < GROW + HOLD ? 1 : Math.max(0, 1 - (t - GROW - HOLD) / FALL)); core.material.opacity = 0.25 * (t < GROW + HOLD ? 1 : 1 - (t - GROW - HOLD) / FALL); });
      FX.warp('lens', x, 2, z, { r: R * 1.2, str: 1.5, life: GROW + HOLD }); FX.light(x, 4, z, SEI.flj, 3, 30, TOT);
      after(GROW + HOLD, () => { FX.warp('lens', x, 2, z, { r: R, str: -1.6, life: FALL }); FX.implode(x, 2, z, R, { color: SEI.fljPale, color2: SEI.flj, n: 40, life: FALL, streak: true }); });
      after(TOT, () => { FX.glow(x, 2, z, 8, SEI.flj, 0.3, 'star'); FX.ring(x, z, { r0: 0.3, r1: R + 1, color: SEI.flj, life: 0.5, tex: 'shock', op: 0.7 }); FX.scorch(x, z, 3.2, SEI.flj, 8); SFX.at('void', x, z, 0.8); SFX.at('blink', x, z, 0.6); });
    }
    let t = 0, ticks = 0; const hit = new Set();
    G.actors.push({ update(dt) { t += dt; const r = t < GROW ? R * t / GROW : R;
      for (const e of enemiesIn(h, x, z, r)) { if (e.struct || hit.has(e.id)) continue; hit.add(e.id); damage(h, e, dmg * 0.65, 1); }
      if (t >= GROW + HOLD && ticks === 0) { ticks = 1; for (const e of enemiesIn(h, x, z, R)) { if (e.struct) continue; damage(h, e, dmg * 0.35, 1); if (e.alive) slow(h, e, 0.5, 1.5, 'fleija'); } }
      return t < TOT; } });
  });
}

HEROES.push(
  /* ================= 65. Akuro ================= */
  {
    id: 'akuro', name: 'Акуро', title: 'Король проклятий', role: 'front', roleName: 'Король проклятий', build: 'bruiser', bars: [5, 3, 3, 3], diffc: 2, atkSfx: 'slash',
    lore: 'Тысячу лет назад Акуро был проклятием, перед которым склонялись маги, — четырёхрукий, четырёхглазый король. Его разрезали на пальцы и спрятали, но пальцы находят, а король возвращается. Он режет, не касаясь: удар невидим, есть только тонкая красная линия — и то, что от неё осталось. Ему скучно с теми, кто слаб, и интересно с одним: с тем, кого называют сильнейшим.',
    look: { bulk: 1.0, h: 1.04, scale: 1.0, c1: 0xe0dad0, c2: 0x1c1a22, c3: 0x15131a, skin: 0xe6c8b4, hands: 0xe6c8b4, cuff: 0xe0dad0, metal: 0x9a2a2a, glow: AKU.c, head: 'akuro', hair: 0xe08a84, tie: 0x15121a, chest: 'heian', legs: 'hakama', sh: 'kimono', weapon: 'none', wc: 'fist', tatt: 0x0c0a0e },
    stats: ST(620, 90, 330, 34, 62, 3.8, 26, 2.9, 0.85, 9.2, 2.4), noSlash: true, hitSfx: 'cut',
    innate: { name: 'Пальцы короля', icon: 'akinn', desc: 'Акуро становится сильнее, возвращая себе пальцы: каждый вражеский герой, погибший рядом с ним (до 14), даёт палец — +3% урона за каждый, до десяти. Первый палец у него с начала матча.', count: h => h.fingers || 1 },
    onDeal(h, t, d, o) { if (o.basic) akBasic(h, t); },
    onHeroDeath(h, u) { if (u.team !== h.team) { h.fingers = Math.min(10, (h.fingers || 1) + 1); akFingers(h); if (FX.near(h.x, h.z, 45)) FX.text(h.x, h.height + 1.1, h.z, 'палец ' + h.fingers, '#ff8a96', 14); if (u.def.id === 'kaisei' && G.time - (u.dmgBy[h.id] || -99) < 3 && G.time - (h.dlg && h.dlg.killT || -99) > 60) { (h.dlg || (h.dlg = {})).killT = G.time; akTalk('akuroWins'); } } },
    onDeath(h) { const K = akKaisei(); if (K && K.team !== h.team && G.time - (h.dmgBy[K.id] || -99) < 3 && G.time - (h.dlg && h.dlg.lossT || -99) > 60) { (h.dlg || (h.dlg = {})).lossT = G.time; akTalk('kaiseiWins'); } },
    whileDead(h) { akDialog(h); },
    tick(h, dt) { if (!h.buffs.some(b => b.id === 'fingers')) akFingers(h); akDialog(h); if (h.trueT > G.time && FX.near(h.x, h.z, 40) && Math.random() < dt * 8) FX.burst(h.x + rand(-0.5, 0.5), rand(0.5, 2.2), h.z + rand(-0.5, 0.5), { n: 1, color: AKU.c, color2: 0x2a0005, speed: [0.2, 0.8], life: [0.4, 0.7], size: [0.18, 0.03], up: 1 }); },
    abilities: [
      {
        key: 'Q', name: 'Расщепление', icon: 'akdism', cd: 6, cost: 45, range: 7, ind: { type: 'cone', r: 7 }, anim: 'dismantle', animDur: 0.4, lock: 0.2, ai: { t: 'cone', farm: true },
        desc: 'Взмах ладони — и вперёд (до 7) веером уходят три невидимых разреза. Все враги в конусе получают физический урон, а на земле остаются красные шрамы.',
        cast(h, p) { akDismantle(h, p.dir, D(h, 70, 18, 0.65, 0)); }
      },
      {
        key: 'W', name: 'Рассечение', icon: 'akcleave', cd: 9, cost: 55, range: 4, ind: { type: 'target' }, anim: 'cleave', animDur: 0.45, lock: 0.3, ai: { t: 'target' },
        desc: 'Акуро разрезает врага (до 4) восемью ударами за полсекунды. Разрез подстраивается под цель: физический урон плюс 6% её максимального здоровья, а по герою слабее 35% здоровья — ещё в полтора раза больше. Под конец цель замедлена на 30%.',
        cast(h, p) { const t = p.unit; if (!t || !t.alive) return false; akCleave(h, t, D(h, 60, 16, 0.55, 0)); }
      },
      {
        key: 'E', name: 'Открыть: огненная стрела', icon: 'akfuga', cd: 15, cost: 70, range: 13, ind: { type: 'line', w: 1.8, fixed: true }, anim: 'fuga', animDur: 0.6, lock: 0.45, ai: { t: 'shot', sp: 42 },
        desc: 'В руках Акуро вспыхивает огненный лук. Через 0.45 сек стрела белого огня летит вперёд (до 13) и взрывается на первом вражеском герое или в конце пути: магический урон в радиусе 3.5, а земля ещё 3 сек горит — урон и замедление.',
        cast(h, p) { akFuga(h, p.dir, D(h, 110, 30, 0.7, 0), D(h, 14, 4, 0.08, 0)); }
      },
      {
        key: 'R', name: 'Расширение территории: Храм злобы', icon: 'akshrine', cd: 100, cost: 120, range: 0, ind: { type: 'self', r: 9 }, anim: 'shrine', animDur: 0.7, lock: 0.5, ai: { t: 'nova', r: 7, ult: true, hp: 0.75, rad: 9 },
        desc: 'Акуро складывает печать — и за его спиной из земли поднимается храм из костей. Это открытая территория: стен нет, она просто есть. 4.5 сек всё в радиусе 9 режется снова и снова: физический урон каждые 0.25 сек (по героям — ещё 0.5% их здоровья) и замедление; в конце — последний взмах по всему кругу. Акуро в это время в истинной форме: четыре руки, четыре горящих глаза.',
        cast(h) { akShrine(h, D(h, 9, 3.2, 0.11, 0), D(h, 90, 30, 0.6, 0)); }
      }
    ]
  },
  /* ================= 66. Seiryu ================= */
  {
    id: 'seiryu', name: 'Сэйрю', title: 'Белый рыцарь', role: 'front', roleName: 'Пилот', build: 'bruiser', bars: [4, 4, 3, 4], diffc: 2, atkSfx: 'slash',
    lore: 'Сэйрю — рыцарь, который давно разучился бояться за себя: в него вложили приказ «Живи!», и тело выполняет его само. На ногах он — гимнаст и боец, бьющий быстрее, чем видит глаз. А когда становится по-настоящему жарко, с неба на крыльях зелёного света опускается «Паладин» — белый найтмер с золотой короной, — и рыцарь уходит в бой уже в нём.',
    look: { bulk: 0.95, h: 1.04, scale: 1.0, c1: 0xe0e2e8, c2: 0x1e2a4a, c3: 0x1a1c24, skin: 0xe8cdb4, hands: 0xe0e2e8, cuff: 0xe0e2e8, metal: SEI.gold, glow: SEI.c, head: 'seiryu', hair: 0x5e3e26, shirt: 0xe8eaf0, chest: 'knight0', legs: 'boots', sh: 'none', weapon: 'none', wc: 'fist', cape: 0x1e2a4a },
    stats: ST(640, 94, 300, 32, 60, 3.8, 30, 3.2, 0.85, 9.6, 2.4),
    init(h) { seInit(h); },
    innate: { name: 'Живи!', icon: 'seinn', desc: 'В Сэйрю вложен приказ «Живи!»: когда у него остаётся меньше четверти здоровья, глаза вспыхивают красным, и 2.5 сек он получает на 40% меньше урона, бегает на 40% быстрее и уклоняется от трети атак. Пешком приказ ещё и сразу перезаряжает «Удар в прыжке» и «Бег по стенам» — тело само находит выход. Не чаще раза в минуту. В мехе здесь видно, сколько энергии осталось.', count: h => h.mech ? '⚡' + Math.max(0, Math.ceil(h.mech.fuel)) : (h.liveCd > G.time ? Math.ceil(h.liveCd - G.time) : '') },
    onHurt(h) { if (h.alive && h.hp < h.maxHp * 0.25) seLive(h); },
    onDeath(h) { if (h.mech) seMechOff(h, true); },
    onDodge(h, src) { seDodge(h, src); },
    // Blaze Luminous: in the mech, the first ability that hits it every 6 s is mostly stopped by a shield of light
    preHurt(h, src, d, type, o) { if (h.mech && src && !o.basic && !o.dot && d > 25 && G.time > (h.blazeT || 0)) { seBlaze(h, src); return d * 0.3; } return d; },
    tick(h, dt) {
      for (let i = 0; i < (h.mech ? 3 : 4); i++) if (h.pilotCd[i] > 0) h.pilotCd[i] -= dt;
      h.dodge = h.mech ? 0 : (h.reflexT > G.time ? 1 : (h.liveT > G.time ? 0.33 : 0));
      // the energy filler runs down by itself; when it is dry the knight lifts off and leaves him on foot
      if (h.mech) { h.mech.fuel = Math.max(0, h.mech.fuel - dt); if (h.mech.fuel <= 0 && G.time > h.mech.hold) seMechOff(h, false); }
      if (h.spinEnd && G.time > h.spinEnd) { h.spinning = false; h.spinEnd = 0; }
      if (h.flipT && G.time > h.flipT) h.flipT = 0;
    },
    abilities: [
      {
        key: 'Q', name: 'Удар в прыжке', icon: 'seflip', cd: 8, cost: 50, range: 6, ind: { type: 'circle', r: 2.2 }, anim: 'slam', animDur: 0.55, lock: 0, ai: { t: 'gap', rad: 2.2 },
        desc: 'Сэйрю в сальто перелетает к точке (до 6) и обрушивает удар ногой: физический урон всем врагам в радиусе 2.2 и оглушение на 0.6 сек. Если удар попал по герою, в течение 3 сек можно ударить ещё раз — «Вихрь»: удар с разворота на месте, урон в радиусе 3 и отбрасывание.',
        cast(h, p) {
          if (h.flipT > G.time) { h.flipT = 0; seWhirl(h, D(h, 60, 16, 0.8, 0)); return; }
          const dmg = D(h, 70, 18, 0.9, 0), T = Math.max(0.25, p.dist / 20); dashTo(h, p.x, p.z, 20, { arc: 2.4, ribbon: SEI.c }); SFX.at('whoosh', h.x, h.z, 0.55);
          after(T, () => {
            if (!h.alive) return; let hero = false;
            for (const e of enemiesIn(h, h.x, h.z, 2.2)) { if (e.struct) continue; damage(h, e, dmg, 0); if (e.alive) stun(h, e, 0.6, 1.4); if (e.kind === 'hero') hero = true; }
            SFX.at('kick', h.x, h.z, 0.9); SFX.at('impact', h.x, h.z, 0.6);
            if (hero && !h.mech) { h.flipT = G.time + 3; h.cd[0] = Math.min(h.cd[0], 0.25); if (FX.near(h.x, h.z, 45)) FX.text(h.x, h.height + 0.9, h.z, 'ещё раз!', '#9fffd4', 14); }
            if (FX.near(h.x, h.z, 55)) { FX.ring(h.x, h.z, { r0: 0.3, r1: 2.8, color: SEI.c, life: 0.35, tex: 'shock' }); FX.burst(h.x, 0.3, h.z, { smoke: true, n: 6, color: 0xc8c0b0, color2: 0x4a4038, speed: [1, 3], life: [0.4, 0.8], size: [0.7, 1.4], ring: true, a: 0.4 }); FX.sparks(h.x, 0.5, h.z, { n: 10, color: 0xffffff, color2: SEI.c, speed: [3, 8], life: [0.2, 0.4], w: 0.07, up: 3 }); }
          });
        }
      },
      {
        key: 'W', name: 'Рефлексы', icon: 'seknee', cd: 11, cost: 50, range: 0, ind: { type: 'self', r: 9.5 }, anim: 'feint', animDur: 0.3, lock: 0, ai: { t: 'parry' },
        desc: 'На 2 сек Сэйрю уклоняется от всех атак (от умений — нет) и бегает на 20% быстрее. Первый вражеский герой или чудовище, от чьей атаки он уклонился, получает контрудар: Сэйрю в рывке (до 9.5) оказывается рядом и бьёт коленом — физический урон и оглушение на 0.9 сек.',
        cast(h) {
          h.reflexT = G.time + 2; h.counter = D(h, 70, 18, 0.9, 0); addBuff(h, { id: 'sereflex', dur: 2, ms: 0.2 }); SFX.at('cue', h.x, h.z, 0.55); SFX.at('blink', h.x, h.z, 0.45);
          if (FX.near(h.x, h.z, 50)) { FX.ring(h.x, h.z, { r0: 2.4, r1: 0.6, color: SEI.c, life: 0.3, tex: 'ringThin', y: 1.2 }); FX.aura(h, SEI.c, 2, 1.3, 'ringThin', 4); FX.glow(h.x, h.height * 0.85, h.z, 2.2, SEI.c, 0.25, 'star'); FX.ring(h.x, h.z, { r0: 0.4, r1: 2.6, color: 0x1ab878, life: 0.35, tex: 'shock', op: 0.6 }); FX.sparks(h.x, 1.3, h.z, { n: 10, color: SEI.pale, color2: SEI.c, speed: [2, 6], life: [0.2, 0.45], w: 0.07, ring: true }); }
          // while the reflexes hold he leaves green afterimages of himself
          let gt = 0; FX.add(new THREE.Group(), 2, (k, me, dt) => { if (!h.alive || !(h.reflexT > G.time)) return; gt += dt; if (gt < 0.14) return; gt = 0; if (FX.near(h.x, h.z, 45)) { dshGhost(h, SEI.c, 0.3, 0.28); if (h.moving) FX.sparks(h.x, 0.9, h.z, { n: 1, color: SEI.pale, color2: SEI.c, speed: [0.5, 1.5], life: [0.2, 0.4], w: 0.05 }); } });
        }
      },
      {
        key: 'E', name: 'Бег по стенам', icon: 'sewall', cd: 12, cost: 45, range: 7, ind: { type: 'circle', r: 0.8 }, anim: 'feint', animDur: 0.35, lock: 0, ai: { t: 'escape' },
        desc: 'Сэйрю одним махом перелетает к точке (до 7), не замечая стен и обрывов, и 2 сек бегает на 30% быстрее.',
        cast(h, p) {
          let n = 0; const x0 = h.x, z0 = h.z;
          if (FX.near(x0, z0, 50)) { FX.ring(x0, z0, { r0: 0.3, r1: 2.2, color: 0x1ab878, life: 0.3, tex: 'shock', op: 0.6 }); FX.burst(x0, 0.3, z0, { smoke: true, n: 5, color: 0x9a9488, color2: 0x3a3630, speed: [1, 3], life: [0.3, 0.6], size: [0.6, 1.2], up: 0.6, a: 0.35 }); }
          dashTo(h, p.x, p.z, 26, { arc: 3, fly: true, ribbon: SEI.c,
            trail: u => { if (++n % 2 === 0) dshGhost(u, SEI.c, 0.3, 0.3); },
            onEnd: u => { if (FX.near(u.x, u.z, 50)) { FX.ring(u.x, u.z, { r0: 0.3, r1: 2.4, color: SEI.c, life: 0.3, tex: 'ringThin', op: 0.7 }); FX.sparks(u.x, 0.4, u.z, { n: 8, color: SEI.pale, color2: SEI.c, speed: [2, 6], life: [0.2, 0.4], up: 3, w: 0.07 }); FX.burst(u.x, 0.3, u.z, { smoke: true, n: 5, color: 0x9a9488, color2: 0x3a3630, speed: [1, 3], life: [0.3, 0.6], size: [0.6, 1.2], up: 0.6, a: 0.35 }); } SFX.at('heavy', u.x, u.z, 0.3); } });
          const b = addBuff(h, { id: 'sewall', dur: 2, ms: 0.3 }); if (b && FX.near(h.x, h.z, 50)) b.fx = FX.aura(h, SEI.c, 2, 1.1, 'ringThin', 6);
          SFX.at('dash', h.x, h.z, 0.6); SFX.at('whoosh', h.x, h.z, 0.6);
        }
      },
      {
        key: 'R', name: 'Паладин', icon: 'semech', cd: 90, cost: 100, range: 0, ind: { type: 'self', r: 3.5 }, anim: 'cast', animDur: 0.6, lock: 0.75, ai: { t: 'buff', ult: true, hp: 0.9 },
        desc: 'С неба на крыльях зелёного света спускается найтмер «Паладин»: приземление бьёт и оглушает врагов в радиусе 3.5, и Сэйрю забирается внутрь. Меха вдвое выше человека, сильнее бьёт мечом, крепче и быстрее, а броня — щит, который принимает удары на себя (если его пробить, меха взорвётся и пилот вылетит). Меха работает на энергии: 18 единиц (+2 за уровень умения), которые тратятся сами по одной в секунду и на каждое умение; кончилась — Паладин улетает. Его щит «Блейз Люминус» раз в 6 сек гасит 70% урона от умения. В мехе другие умения: винтовка ВАРИС, мечи МВС, слэш-харкен и боеголовка «Флейя».',
        cast(h) { const lv = Math.max(1, h.al[3]); seMechArrive(h, { land: D(h, 80, 30, 0.6, 0), on: () => seMechOn(h, 16 + lv * 2, 450 + lv * 220 + h.maxHp * 0.35) }); }
      }
    ],
    mechKit: [
      {
        key: 'Q', name: 'Винтовка ВАРИС', icon: 'sevaris', cd: 2.5, cost: 0, fuel: 1.5, range: 14, ind: { type: 'line', w: 2, fixed: true }, anim: 'shoot', animDur: 0.4, lock: 0.25, ai: { t: 'shot', sp: 55 },
        desc: 'Энергия: 1.5. Выстрел из винтовки: энергетический снаряд летит на 14, пробивает всех врагов на пути (физический урон) и отбрасывает их.',
        cast(h, p) { if (!h.mech || h.mech.fuel < 1.5) return false; h.mech.fuel -= 1.5; seVaris(h, p.dir, D(h, 70, 20, 0.8, 0)); }
      },
      {
        key: 'W', name: 'Мечи МВС', icon: 'semvs', cd: 6, cost: 0, fuel: 2.5, range: 7.5, ind: { type: 'line', w: 2.4, fixed: true }, anim: 'thrust', animDur: 0.4, lock: 0, ai: { t: 'shot', sp: 34 },
        desc: 'Энергия: 2.5. Паладин рывком (на 7.5) проносится сквозь врагов с двумя раскалёнными мечами: физический урон всем на пути и замедление на 30% на 1.5 сек. В конце рывка — разворот с мечами: ещё половина урона всем в радиусе 4.2.',
        cast(h, p) { if (!h.mech || h.mech.fuel < 2.5) return false; h.mech.fuel -= 2.5; seMvsDash(h, p.dir, D(h, 70, 20, 1.0, 0)); }
      },
      {
        key: 'E', name: 'Слэш-харкен', icon: 'seharken', cd: 8, cost: 0, fuel: 1.5, range: 11, ind: { type: 'line', w: 1.6 }, anim: 'thrust', animDur: 0.3, lock: 0, ai: { t: 'gap' },
        desc: 'Энергия: 1.5. Из пояса мехи вылетает якорь на тросе (до 11). Зацепив врага, он подтягивает Паладина к нему — удар и оглушение на 0.6 сек; иначе подтягивает к точке.',
        cast(h, p) { if (!h.mech || h.mech.fuel < 1.5) return false; h.mech.fuel -= 1.5; seHarken(h, p.x, p.z, D(h, 60, 16, 0.6, 0)); }
      },
      {
        key: 'R', name: 'Флейя', icon: 'sefleija', cd: 0, cost: 0, range: 14, ind: { type: 'circle', r: 7 }, anim: 'shoot', animDur: 0.5, lock: 0.3, ai: { t: 'fn', fn: seFleijaAI, fnUlt: true },
        desc: 'Боеголовка «Флейя» уходит в точку (до 14) и забирает всю оставшуюся энергию: чем полнее бак, тем сильнее взрыв (от 55% до 130% урона). Там раздувается розовая сфера радиусом 7 — каждый, кого она коснулась, получает огромный магический урон, — а потом схлопывается в ничто, ударив ещё раз и замедлив. После взрыва Паладин улетает: выстрелишь рано — взрыв мощнее, но и в мехе пробудешь меньше.',
        cast(h, p) { if (!h.fleija || !h.mech) return false; seFleija(h, p.x, p.z, D(h, 240, 80, 0, 1.0) + h.ad * 0.8); return { cd: 999 }; }
      }
    ]
  }
);

/* ---------- icons ---------- */
Object.assign(GLYPH, {
  // a finger, bound with a strip of paper
  akinn(T) { T.rot(0.4, () => { T.g.fillRect(-6, -22, 12, 40); T.C(0, -22, 6); T.cut(() => { T.g.fillRect(-7, -6, 14, 2); T.g.fillRect(-7, 4, 14, 2); }); }); T.al(0.5, () => T.S(3, -18, 2, 18, -6)); },
  // three thin lines fanning out from a hand
  akdism(T) { for (const a of [-0.35, 0, 0.35]) T.rot(a, () => T.g.fillRect(-1.5, -24, 3, 30), -14, 14); T.C(-14, 14, 5); T.hi(() => T.C(-14, 14, 2)); },
  // a body crossed by many cuts
  akcleave(T) { T.al(0.4, () => { T.C(0, -12, 7); T.P(-8, -4, 8, -4, 10, 20, -10, 20); }); for (const [a, y] of [[0.5, -10], [-0.4, 0], [0.6, 8], [-0.5, 14]]) T.rot(a, () => T.g.fillRect(-20, -1.5, 40, 3), 0, y); },
  // a bow of fire with an arrow drawn
  akfuga(T) { T.A(-4, 0, 20, -1.2, 1.2, 4); T.S(2, 4, -18, 4, 18); T.blade(-18, 0, 24, 0, 6); T.flame(14, 0, 0.4); },
  // a shrine roof with horns over an open mouth
  akshrine(T) { T.P(-24, -6, 0, -18, 24, -6); T.g.fillRect(-16, -6, 32, 6); T.P(-14, -18, -20, -26, -10, -18); T.P(14, -18, 20, -26, 10, -18); T.g.fillRect(-14, 2, 28, 18); T.cut(() => { T.g.fillRect(-10, 6, 20, 10); }); for (let i = 0; i < 4; i++) T.P(-9 + i * 5, 6, -7 + i * 5, 10, -5 + i * 5, 6); },
  // an eye flashing red in a ring
  seinn(T) { T.E(0, 0, 20, 11); T.cut(() => T.C(0, 0, 8)); T.C(0, 0, 4); T.al(0.4, () => T.O(0, 0, 24, 2.5)); T.hi(() => T.C(-2, -2, 1.6)); },
  // a figure in a flip, a foot coming down
  seflip(T) { T.C(-4, -14, 6); T.S(5, -4, -8, 4, 6, 18, 2); T.S(4, 4, 6, -10, 14); T.A(0, 0, 22, 3.6, 5.8, 3); T.head(18, 2, 0.4, 6); },
  // a knee driven up
  seknee(T) { T.S(6, -8, -20, -4, -2, 10, -8); T.S(6, 10, -8, 12, 14); T.C(10, -8, 5); T.al(0.5, () => { T.S(2.5, 18, -14, 24, -18); T.S(2.5, 18, -6, 24, -6); }); },
  // a leap over a wall
  sewall(T) { T.g.fillRect(-4, 0, 8, 22); T.A(0, 2, 18, 3.4, 6.0, 3.5); T.C(16, -2, 4); T.head(18, 6, 1.6, 6); },
  // a knight's crowned head
  semech(T) { T.P(-10, -6, 10, -6, 12, 14, 0, 20, -12, 14); T.cut(() => { T.P(-8, 0, -1, 4, -1, 6, -8, 3); T.P(8, 0, 1, 4, 1, 6, 8, 3); }); T.P(-4, -6, -20, -26, -1, -10); T.P(4, -6, 20, -26, 1, -10); T.hi(() => T.C(0, -2, 2)); },
  // a long rifle and its bolt
  sevaris(T) { T.g.fillRect(-24, -3, 30, 6); T.g.fillRect(-12, 3, 6, 8); T.blade(8, 0, 26, 0, 8); T.al(0.4, () => T.S(10, 6, 0, 26, 0)); },
  // two blades crossing in a ring
  semvs(T) { T.sword(-18, 18, 18, -18, 5); T.sword(18, 18, -18, -18, 5); T.al(0.4, () => T.O(0, 0, 22, 3)); },
  // an anchor on a cable
  seharken(T) { T.S(2.5, -22, 18, 8, -8); T.P(8, -16, 20, -4, 14, -2, 12, -8, 6, -2, 4, -10); },
  // a pink sphere swallowing the ground
  sefleija(T) { T.O(0, 0, 18, 4); T.al(0.35, () => T.C(0, 0, 18)); T.C(0, 0, 5); T.al(0.5, () => T.O(0, 0, 24, 1.5)); T.hi(() => T.A(0, 0, 13, 3.6, 4.6, 2)); }
});
