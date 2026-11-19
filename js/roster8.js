'use strict';
/* ===== roster, part 31 (hero 58): Wлад the tycoon — banknotes thrown to the wind, a whirl of gold coins for a cushion, a bribe nobody refuses,
   a golden safe dropped out of the sky, and a life bought back at the fountain. Loaded after roster7.js: the glyphs are added to GLYPH at the end ===== */
const WLD = { c: 0xffd040, gold: 0xe8b84a, deep: 0x9a6a18, bill: 0x4f9a5a, pale: 0xd8f0c0, spark: 0xfff0b0 };
const WL_BUY = 1000, WL_BUYCD = 120;
const _wv = new THREE.Vector3();
let _wlBill = null, _wlBillG = null, _wlCoinG = null, _wlCoinM = null, _wlWad = null, _wlSafe = null;

/* ---------- money props ---------- */
// a banknote: green paper, a dark border, a pale oval with his W in it, the value in two corners
function wlBillMat() {
  if (_wlBill) return _wlBill;
  const c = document.createElement('canvas'); c.width = 128; c.height = 64; const g = c.getContext('2d');
  g.fillStyle = '#4c9858'; g.fillRect(0, 0, 128, 64); g.strokeStyle = '#2a6036'; g.lineWidth = 5; g.strokeRect(3, 3, 122, 58);
  g.strokeStyle = '#b8e0a8'; g.lineWidth = 1.5; g.strokeRect(10, 9, 108, 46);
  g.fillStyle = '#d4f0c4'; g.beginPath(); g.ellipse(64, 32, 19, 17, 0, 0, TAU); g.fill();
  g.fillStyle = '#2a6036'; g.font = 'bold 26px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('W', 64, 34);
  g.fillStyle = '#e4f8d8'; g.font = 'bold 11px Georgia, serif'; g.fillText('1000', 28, 19); g.fillText('1000', 100, 46);
  const t = new THREE.CanvasTexture(c); t.anisotropy = 2;
  return (_wlBill = new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide }));
}
const wlBillGeo = () => _wlBillG || (_wlBillG = new THREE.PlaneGeometry(0.62, 0.31));
const wlCoinGeo = () => _wlCoinG || (_wlCoinG = new THREE.CylinderGeometry(0.15, 0.15, 0.04, 14));
const wlCoinMat = () => _wlCoinM || (_wlCoinM = new THREE.MeshPhongMaterial({ color: 0xf0c040, emissive: 0x4a3000, specular: 0xfff0c0, shininess: 70 }));
// where his right hand is (the money hand)
function wlHand(h) { if (h.rig && h.rig.handR && h.rig.root.visible) { h.rig.handR.getWorldPosition(_wv); return { x: _wv.x, y: _wv.y, z: _wv.z }; } return { x: h.x + Math.sin(h.facing) * 0.7, y: 1.5, z: h.z + Math.cos(h.facing) * 0.7 }; }

// one banknote loose in the air: flung out at (vx, vy, vz), it brakes hard, then rocks and spins down like a leaf, lies flat a moment and shrinks away
function wlBill(x, y, z, vx, vy, vz, life) {
  const g = new THREE.Group(), m = new THREE.Mesh(wlBillGeo(), wlBillMat()); g.add(m);
  const ph = rand(TAU), sw = rand(2.4, 4.2), spin = rand(-7, 7), yaw = rand(TAU); let px = x, py = y, pz = z, down = false;
  m.rotation.set(rand(TAU), yaw, rand(TAU));
  return FX.add(g, life, (k, me, dt, en) => {
    if (!down) {
      const dr = Math.exp(-dt * 2.8); vx *= dr; vz *= dr; vy = Math.max(-1.5, vy * Math.exp(-dt * 1.2) - 5 * dt);
      px += (vx + Math.sin(en.t * sw + ph) * 0.8) * dt; py += vy * dt; pz += (vz + Math.cos(en.t * sw * 0.7 + ph) * 0.8) * dt;
      m.rotation.x += spin * dt * (vy < -1 ? 0.35 : 1); m.rotation.z = Math.sin(en.t * sw + ph) * 0.8;
      if (py <= 0.06) { py = 0.06; down = true; m.rotation.set(-HPI, 0, yaw); }
    }
    me.position.set(px, py, pz); me.scale.setScalar(Math.min(1, en.t * 10) * (k > 0.82 ? (1 - k) / 0.18 : 1));
  });
}
// a burst of notes from a point: n of them thrown out in every direction and up
function wlBills(x, y, z, n, spd, up, life) {
  if (!FX.near(x, z, 50)) return; n = FX.cnt(n);
  for (let i = 0; i < n; i++) { const a = rand(TAU), v = rand(spd * 0.4, spd); wlBill(x, y, z, Math.sin(a) * v, rand(up * 0.4, up), Math.cos(a) * v, rand(life * 0.7, life)); }
}
// a gold coin tossed out: a ballistic arc with a spin, a small bounce, then it lies glinting on the ground and shrinks away
function wlCoin(x, y, z, vx, vy, vz, life) {
  const g = new THREE.Group(), m = new THREE.Mesh(wlCoinGeo(), wlCoinMat()); g.add(m); m.rotation.set(rand(TAU), 0, rand(TAU)); m.scale.setScalar(1.45);
  const sx = rand(8, 18), sz = rand(-6, 6); let px = x, py = y, pz = z, b = 0;
  return FX.add(g, life, (k, me, dt) => {
    if (b < 2) {
      vy -= 22 * dt; px += vx * dt; py += vy * dt; pz += vz * dt; m.rotation.x += sx * dt; m.rotation.z += sz * dt;
      if (py <= 0.05) { py = 0.05; b++; vy = -vy * 0.32; vx *= 0.5; vz *= 0.5; if (b >= 2 || vy < 1) { b = 2; m.rotation.set(0, rand(TAU), 0); } }
    }
    me.position.set(px, py, pz); me.scale.setScalar(k > 0.8 ? (1 - k) / 0.2 : 1);
  });
}
function wlCoins(x, y, z, n, spd, up, life) {
  if (!FX.near(x, z, 50)) return; n = FX.cnt(n);
  for (let i = 0; i < n; i++) { const a = rand(TAU), v = rand(spd * 0.3, spd); wlCoin(x, y, z, Math.sin(a) * v, rand(up * 0.5, up), Math.cos(a) * v, rand(life * 0.7, life)); }
}
// a banded wad of notes (the thrown one in «Пачка налички»)
function wlWadMesh() {
  if (!_wlWad) {
    const g = new THREE.Group(), k = kit();
    k.b(0.56, 0.2, 0.3, 0x4c9858, 0, 0, 0).b(0.58, 0.025, 0.31, 0x3a7a46, 0, 0.055, 0).b(0.58, 0.025, 0.31, 0x3a7a46, 0, -0.055, 0).b(0.58, 0.02, 0.31, 0xd4f0c4, 0, 0.1, 0).b(0.11, 0.22, 0.32, { g: 0xffd040 }, 0, 0, 0);
    k.into(g, new THREE.MeshLambertMaterial({ vertexColors: true }), new THREE.MeshBasicMaterial({ vertexColors: true })); _wlWad = g;
  }
  const c = _wlWad.clone(true); c.scale.setScalar(1.35); return c;
}
// the safe: a polished gold box with dark banded edges and feet, a heavy door (its own group, named 'door', so it can be blown off) with a combination dial, a three-spoke handle, hinges and his W; behind the door a dark opening
function wlSafeMesh() {
  if (!_wlSafe) {
    const g = new THREE.Group(), door = new THREE.Group(), k = kit(), kd = kit(), au = 0xe0b040, dk = 0x8a5e14, st = 0x2a2a30, lt = 0xf6d468, chr = 0xc8ccd4, W = { g: 0xffe070 };
    k.b(2.2, 2.2, 2.2, au, 0, 0, 0);
    for (const y of [-1.05, 1.05]) k.b(2.34, 0.16, 2.34, dk, 0, y, 0);
    for (const [x, z] of [[-1.08, -1.08], [1.08, -1.08], [-1.08, 1.08], [1.08, 1.08]]) k.b(0.2, 2.3, 0.2, dk, x, 0, z);
    for (const x of [-0.75, 0.75]) for (const z of [-0.75, 0.75]) k.b(0.3, 0.2, 0.3, st, x, -1.2, z);
    k.b(1.78, 1.78, 0.05, 0x1a1006, 0, 0, 1.105);
    for (const y of [-0.5, 0.5]) k.y(0.09, 0.09, 0.42, 8, dk, -0.93, y, 1.16);
    kd.b(1.74, 1.74, 0.12, lt, 0, 0, 0).b(1.5, 1.5, 0.04, au, 0, 0, 0.075)
      .y(0.36, 0.36, 0.1, 18, st, 0.18, 0.32, 0.12, HPI).y(0.29, 0.29, 0.12, 18, chr, 0.18, 0.32, 0.14, HPI).y(0.07, 0.07, 0.16, 8, st, 0.18, 0.32, 0.2, HPI)
      .y(0.08, 0.08, 0.14, 8, st, 0.18, -0.42, 0.15, HPI);
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; kd.b(0.025, 0.06, 0.02, st, 0.18 + Math.sin(a) * 0.33, 0.32 + Math.cos(a) * 0.33, 0.19, 0, 0, -a); }
    for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + 0.3; kd.b(0.06, 0.34, 0.06, chr, 0.18 + Math.sin(a) * 0.17, -0.42 + Math.cos(a) * 0.17, 0.17, 0, 0, -a).i(0.065, st, 0.18 + Math.sin(a) * 0.36, -0.42 + Math.cos(a) * 0.36, 0.17); }
    for (const [x, rz] of [[-0.7, 0.3], [-0.6, -0.3], [-0.5, 0.3], [-0.4, -0.3]]) kd.b(0.065, 0.4, 0.03, W, x, -0.02, 0.1, 0, 0, rz);
    for (const x of [-0.76, 0.76]) for (const y of [-0.76, 0.76]) kd.i(0.05, dk, x, y, 0.08);
    const mat = new THREE.MeshPhongMaterial({ vertexColors: true, flatShading: true, shininess: 80, specular: 0xffe8a0, emissive: 0x1c1200 }), gm = new THREE.MeshBasicMaterial({ vertexColors: true });
    k.into(g, mat, gm); kd.into(door, mat, gm); door.position.set(0, 0, 1.17); door.name = 'door'; g.add(door); _wlSafe = g;
  }
  return _wlSafe.clone(true);
}

/* ---------- the shots ---------- */
// his attack: a gold coin flicked off the thumb, spinning edge over edge to the target
function wlFlick(u, t) {
  const A = wlHand(u); let done = false;
  const p = homing(u, t, { x: A.x, z: A.z, y: A.y, speed: 30, color: WLD.c, size: 0.16, onHit: tt => { done = true; basicHit(u, tt); FX.sparks(tt.x, tt.height * 0.55, tt.z, { n: 5, color: 0xffffff, color2: WLD.c, speed: [3, 8], life: [0.12, 0.3], w: 0.08 }); FX.glow(tt.x, tt.height * 0.55, tt.z, 1.6, WLD.c, 0.12, 'star'); SFX.at('pop', tt.x, tt.z, 0.25); } });
  SFX.at('coin', u.x, u.z, 0.35);
  if (!FX.near(u.x, u.z, 55)) return;
  const g = new THREE.Group(), m = new THREE.Mesh(wlCoinGeo(), wlCoinMat()); g.add(m); m.scale.setScalar(1.25);
  FX.add(g, 2, (k, me, dt, en) => { if (done || !G.proj.includes(p)) { en.dead = true; return; } me.position.set(p.x, p.y, p.z); m.rotation.x += dt * 34; me.rotation.y = u.facing; });
}
// the wad bursts: a cloud of notes, gold glitter, magic damage and a slow on everyone in the radius
function wlCashBurst(h, x, z, R, dmg) {
  for (const e of enemiesIn(h, x, z, R)) { damage(h, e, dmg, 1); if (e.alive) slow(h, e, 0.3, 1.5, 'wlq'); FX.hit(e.x, 1.2, e.z, WLD.c, false); }
  SFX.at('cash', x, z, 0.9); SFX.at('pop', x, z, 0.5); SFX.at('flap', x, z, 0.3);
  if (!FX.near(x, z, 55)) return;
  FX.glow(x, 1.3, z, 4.2, WLD.pale, 0.22, 'flare'); FX.glow(x, 1.3, z, 3, WLD.c, 0.3); FX.ring(x, z, { r0: 0.4, r1: R + 0.4, color: WLD.c, life: 0.4, tex: 'shock' }); FX.ring(x, z, { r0: R * 0.8, r1: R, color: 0x8ad08a, life: 0.6, tex: 'ringThin', op: 0.7 });
  FX.sparks(x, 1.3, z, { n: 14, color: 0xffffff, color2: WLD.c, speed: [4, 10], life: [0.2, 0.5], w: 0.1, up: 2 });
  FX.burst(x, 1.2, z, { puff: true, n: 6, color: 0x9ad890, color2: 0x2a5a30, speed: [1, 3], life: [0.3, 0.6], size: [1, 2], a: 0.35 });
  wlBills(x, 1.4, z, 18, 7, 6, 2.6); wlCoins(x, 1.2, z, 4, 5, 6, 1.8);
}
// the coins of the cushion fly off in every direction
function wlCoinNova(h, dmg) {
  if (!h.alive) return; const R = 3.5;
  for (const e of enemiesIn(h, h.x, h.z, R)) { damage(h, e, dmg, 1); FX.hit(e.x, 1.2, e.z, WLD.c, true); }
  SFX.at('coin', h.x, h.z, 0.8); SFX.at('chime', h.x, h.z, 0.5); SFX.at('impact', h.x, h.z, 0.4);
  if (!FX.near(h.x, h.z, 55)) return;
  FX.ring(h.x, h.z, { r0: 0.6, r1: R + 0.3, color: WLD.c, life: 0.4, tex: 'shock' }); FX.glow(h.x, 1.3, h.z, 3.4, WLD.c, 0.25, 'star');
  FX.sparks(h.x, 1.3, h.z, { n: 18, color: 0xffffff, color2: WLD.c, speed: [6, 13], life: [0.2, 0.45], w: 0.1, up: 1 });
  const n = FX.cnt(18); for (let i = 0; i < n; i++) { const a = i / n * TAU + rand(-0.15, 0.15), v = rand(7, 11); wlCoin(h.x + Math.sin(a) * 1.2, 1.3, h.z + Math.cos(a) * 1.2, Math.sin(a) * v, rand(4, 7), Math.cos(a) * v, rand(1.2, 1.8)); }
}
// the cushion: two rings of coins whirling round him at different heights and speeds, a thin gold bubble; returns a handle whose .dead ends both
function wlCoinOrbit(h, dur) {
  const g = new THREE.Group(), coins = [];
  for (let i = 0; i < 14; i++) { const m = new THREE.Mesh(wlCoinGeo(), wlCoinMat()); m.scale.setScalar(1.35); g.add(m); coins.push({ m, a: i / 14 * TAU, ring: i % 2, y: i % 2 ? 1.75 : 0.85 }); }
  const A = FX.add(g, dur, (k, me, dt, en) => {
    if (!h.alive) { en.dead = true; return; } me.position.set(h.x, h.yOff || 0, h.z); const q = Math.min(1, en.t / 0.25);
    for (const c of coins) { const sp = c.ring ? -4.2 : 5.2, r = (c.ring ? 1.25 : 1.45) * q, a = c.a + en.t * sp; c.m.position.set(Math.sin(a) * r, c.y * q + Math.sin(en.t * 6 + c.a * 3) * 0.12, Math.cos(a) * r); c.m.rotation.set(HPI, 0, -a + en.t * 9); }
    if (FX.near(h.x, h.z, 40) && Math.random() < dt * 10) { const c = coins[(Math.random() * coins.length) | 0]; c.m.getWorldPosition(_wv); FX.glow(_wv.x, _wv.y, _wv.z, 0.9, 0xffffff, 0.15, 'star'); }
  });
  // a thin gold bubble, fainter than the usual shield so the coins and the man inside stay visible
  const bm = new THREE.Mesh(FX.geo.sphere, FX.rimMat(WLD.c, 0.4)), r = h.radius + 1.0;
  const B = FX.add(bm, dur, (k, me, dt, en) => { if (!h.alive) { en.dead = true; return; } me.position.set(h.x, 1.3 + (h.yOff || 0), h.z); me.scale.setScalar(r * (1 + Math.sin(en.t * 6) * 0.04) * Math.min(1, en.t / 0.15)); me.material.uniforms.o.value = 0.4 * Math.min(1, (dur - en.t) / 0.3); });
  return { set dead(v) { A.dead = v; B.dead = v; }, get dead() { return A.dead; } };
}
// a note sails from his hand to the bribed one on a high arc, then flutters about them
function wlBillTo(from, u, T) {
  const g = new THREE.Group(), m = new THREE.Mesh(wlBillGeo(), wlBillMat()); g.add(m); const sp = rand(6, 10), ph = rand(TAU);
  return FX.add(g, T + 0.5, (k, me, dt, en) => {
    const f = Math.min(1, en.t / T), ty = (u.height || 2) * 0.9, x = lerp(from.x, u.x, f), y = lerp(from.y, ty, f) + Math.sin(Math.PI * f) * 1.6, z = lerp(from.z, u.z, f);
    if (f < 1) me.position.set(x, y, z); else { const s = en.t - T; me.position.set(u.x + Math.sin(s * 5 + ph) * 0.5, ty - s * 1.5, u.z + Math.cos(s * 5 + ph) * 0.5); }
    m.rotation.x += sp * dt; m.rotation.z = Math.sin(en.t * 7 + ph) * 0.7; me.scale.setScalar(k > 0.8 ? (1 - k) / 0.2 : 1);
  });
}
// the bribed one: a slow ring of notes circling the head and a gold ring on the ground, for as long as the bribe lasts
function wlBribeFx(u, dur) {
  const g = new THREE.Group(), bills = [];
  for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(wlBillGeo(), wlBillMat()); m.scale.setScalar(0.75); g.add(m); bills.push(m); }
  const A = FX.add(g, dur, (k, me, dt, en) => {
    if (!u.alive) { en.dead = true; return; } me.position.set(u.x, (u.height || 2) + 0.35 + (u.yOff || 0), u.z); const q = Math.min(1, en.t / 0.2);
    bills.forEach((m, i) => { const a = i / 6 * TAU + en.t * 2.6; m.position.set(Math.sin(a) * 0.75 * q, Math.sin(en.t * 4 + i) * 0.1, Math.cos(a) * 0.75 * q); m.rotation.set(0.25, a + HPI, Math.sin(en.t * 5 + i) * 0.3); });
  });
  const B = FX.aura(u, WLD.c, dur, u.radius + 0.5, 'ring', 3);
  return { set dead(v) { A.dead = v; if (B) B.dead = v; }, get dead() { return A.dead; } };
}

/* ---------- the safe ---------- */
function wlSafeDrop(h, x, z, R, T, face, dmg) {
  const S = wlSafeMesh(), door = S.getObjectByName('door'), H0 = 1.29, LIFE = T + 3.2, near = FX.near(x, z, 70); let hit = false, dv = null, acc = 0;
  // the shadow on the ground: it grows and darkens as the safe comes down
  const sh = new THREE.Mesh(FX.geo.flat, FX.mat('fill', 0x000000, 0, false)); sh.position.set(x, 0.09, z);
  FX.add(sh, T + 0.1, (k, me, dt, en) => { const f = Math.min(1, en.t / T), s = lerp(0.6, 1.9, f * f) * 2 * RK; me.scale.set(s, 1, s); me.material.opacity = 0.15 + 0.5 * f; });
  FX.decal(x, z, R, WLD.c, T);
  FX.add(S, LIFE, (k, me, dt, en) => {
    const t = en.t;
    if (t < T) {
      const f = t / T; me.position.set(x, H0 + 30 * (1 - f * f), z); me.rotation.set(Math.sin(t * 3) * 0.12 * (1 - f), face + (1 - f) * 1.4, Math.cos(t * 2.5) * 0.1 * (1 - f));
      acc += dt; if (near && acc > 0.04) { acc = 0; FX.sparks(x + rand(-1, 1), me.position.y + 1.2, z + rand(-1, 1), { n: 1, color: 0xffffff, color2: WLD.c, speed: [0, 0.5], up: 14, life: [0.12, 0.2], w: 0.12, stretch: 0.2, grav: 0 }); }
      return;
    }
    const s = t - T;
    if (!hit) { hit = true; me.rotation.set(0, face, 0); }
    // a squash on landing, then it settles; the last 0.7 s it sinks into the ground
    const sq = s < 0.5 ? Math.sin(s * 22) * 0.12 * (1 - s / 0.5) : 0; me.scale.set(1 + sq * 0.5, 1 - sq, 1 + sq * 0.5);
    me.position.set(x, H0 * (1 - sq) - (s > LIFE - T - 0.7 ? (s - (LIFE - T - 0.7)) / 0.7 * 2.8 : 0), z);
    // the door is blown off a beat after the landing, spins away and lies on the ground in front
    if (s > 0.32 && door) {
      if (!dv) dv = { y: 0, vy: 7, z: 1.17, vz: 5.5, r: 0 };
      if (dv.y > -1.22 || dv.vy > 0) { dv.vy -= 22 * dt; dv.y += dv.vy * dt; dv.z += dv.vz * dt; dv.r += dt * 9; if (dv.y <= -1.22) { dv.y = -1.22; dv.vy = 0; dv.r = -HPI; dv.vz = 0; } }
      door.position.set(0, dv.y, dv.z); door.rotation.x = dv.r;
    }
  });
  after(T - 0.75, () => SFX.at('falling', x, z, 0.9)); after(T - 0.35, () => SFX.at('whoosh', x, z, 1));
  after(T, () => {
    for (const e of enemiesIn(h, x, z, R)) { damage(h, e, dmg, 1); if (e.alive) stun(h, e, 1.25); FX.hit(e.x, 1.3, e.z, WLD.c, true); }
    SFX.at('mace', x, z, 1); SFX.at('heavy', x, z, 0.8); SFX.at('rubble', x, z, 0.9); SFX.at('coin', x, z, 0.6); FX.shake(0.9); if (FX.near(x, z, 36)) { FX.hitstop(0.09); FX.punch(0.9); }
    if (near) {
      FX.ring(x, z, { r0: 0.8, r1: R + 0.8, color: WLD.c, life: 0.5, tex: 'shock' }); FX.ring(x, z, { r0: 2.6, r1: 3.4, color: 0x8a6a40, life: 2.6, tex: 'crack', op: 0.9 }); FX.shock(x, z, R * 1.5, 1.2, 0.45);
      FX.burst(x, 0.4, z, { smoke: true, n: 18, color: 0xb0a080, color2: 0x4a4030, speed: [3, 8], life: [0.6, 1.4], size: [1.2, 2.8], ring: true, a: 0.55, drag: 1.5 });
      FX.debris(x, 0.3, z, { n: 16, color: 0x5a4a38, speed: [4, 10], up: 9, size: [0.15, 0.45], rad: 1.4 }); FX.scorch(x, z, 2.4, 0x6a5038, 6);
      FX.light(x, 2, z, WLD.c, 3, 18, 0.6); FX.glow(x, 1.2, z, 7, WLD.c, 0.25, 'flare');
    }
  });
  // the door pops: gold light from inside, a fountain of coins and notes for a second, the ground around littered with gold
  after(T + 0.32, () => {
    SFX.at('cash', x, z, 1); SFX.at('pop', x, z, 0.6); if (!h) return;
    const fx = Math.sin(face), fz = Math.cos(face), ox = x + fx * 1.2, oz = z + fz * 1.2;
    if (near) { FX.light(ox, 1.4, oz, WLD.c, 3.5, 14, 1.4); FX.glow(ox, 1.3, oz, 4, WLD.c, 0.5); }
    for (let i = 0; i < 20; i++) after(i * 0.05, () => {
      if (!FX.near(ox, oz, 55)) return;
      for (let j = 0; j < 2; j++) { const a = face + rand(-1.1, 1.1), v = rand(3, 8); wlCoin(ox, 1.3, oz, Math.sin(a) * v, rand(5, 10), Math.cos(a) * v, rand(2.2, 3.2)); }
      if (i % 2 === 0) { const a = face + rand(-1, 1), v = rand(2, 5); wlBill(ox, 1.6, oz, Math.sin(a) * v, rand(5, 9), Math.cos(a) * v, rand(2.4, 3.4)); }
      if (i % 3 === 0) FX.sparks(ox, 1.3, oz, { n: 3, color: 0xffffff, color2: WLD.c, speed: [3, 8], life: [0.2, 0.4], w: 0.08, up: 4 });
    });
    // 3 s of gold on the ground: enemies wading through it are slowed, allied heroes pick it up
    const Z = 3, got = new Map(); let el = 0, tk = 0;
    if (near) FX.zone(x, z, R, WLD.c, Z, { tex: 'fill', op: 0.22, spin: 0 });
    G.actors.push({ update(dt) {
      el += dt; tk += dt;
      if (tk >= 0.25) {
        tk -= 0.25;
        for (const e of enemiesIn(h, x, z, R)) slow(h, e, 0.4, 0.4, 'wlgold');
        for (const a of G.heroes) if (a.alive && a.team === h.team && dist(a.x, a.z, x, z) < R) { addGold(a, 2.5, false); got.set(a, (got.get(a) || 0) + 2.5); }
        if (FX.near(x, z, 45)) for (let i = 0; i < 3; i++) { const a = rand(TAU), r = Math.sqrt(Math.random()) * R; FX.glow(x + Math.sin(a) * r, 0.25, z + Math.cos(a) * r, 0.9, 0xffffff, 0.2, 'star'); }
      }
      if (el < Z) return true;
      for (const [a, g] of got) if (a === G.player && g >= 1) { FX.text(a.x, a.height + 1.4, a.z, '+' + Math.round(g) + ' з', '#ffd84a', 13); SFX.play('coin', 0.45); }
      return false;
    } });
  });
}

/* ---------- the life he buys back ---------- */
function wlBuyState(h) {
  if (G.time - (h.diedAt || -99) < 2) return { ok: false, text: 'Выкуп жизни — через мгновение…' };
  if (h.buyCd > G.time) return { ok: false, text: 'Выкуп жизни перезаряжается: ' + Math.ceil(h.buyCd - G.time) + ' сек' };
  if (h.gold < WL_BUY) return { ok: false, text: 'Выкупить жизнь: нужно ' + WL_BUY + ' золота, у вас ' + Math.floor(h.gold) };
  return { ok: true, text: 'Выкупить жизнь за ' + WL_BUY + ' золота · ' + kl('recall') };
}
function wlBuyback(h) {
  if (!h.dead || G.over) return false; const s = wlBuyState(h);
  if (!s.ok) { if (h === G.player) { UI.msg(s.text); SFX.play('deny'); } return false; }
  h.gold -= WL_BUY; h.buyCd = G.time + WL_BUYCD; const dx = h.x, dz = h.z;
  REP.ev({ k: 'buy', who: G.heroes.indexOf(h) });
  if (FX.near(dx, dz, 60)) { FX.pillar(dx, dz, { r: 1.1, h: 12, color: WLD.c, life: 0.6 }); wlCoins(dx, 0.6, dz, 8, 4, 7, 1.4); }
  respawn(h);
  if (FX.near(h.x, h.z, 70)) {
    FX.pillar(h.x, h.z, { r: 2.2, h: 20, color: WLD.c, life: 1.2 }); FX.ring(h.x, h.z, { r1: 5.5, color: WLD.c, life: 0.7, tex: 'shock' }); FX.glow(h.x, 2, h.z, 8, WLD.c, 0.5, 'flare'); FX.light(h.x, 3, h.z, WLD.c, 3, 16, 1);
    const n = FX.cnt(26); for (let i = 0; i < n; i++) { const a = rand(TAU), r = rand(0.5, 4); wlBill(h.x + Math.sin(a) * r, rand(5, 9), h.z + Math.cos(a) * r, rand(-1, 1), rand(-1, 0), rand(-1, 1), rand(2.4, 3.4)); }
    wlCoins(h.x, 1.4, h.z, 14, 6, 9, 1.8);
  }
  SFX.at('cash', h.x, h.z, 1); SFX.at('chime', h.x, h.z, 0.5); if (h === G.player) { SFX.play('buy'); G.camSnap = true; UI.announce('Жизнь выкуплена: −' + WL_BUY + ' золота', '#ffd86a'); }
  else if (G.player) UI.announce(h.name + (h.team === G.player.team ? ' (союзник)' : ' (враг)') + ' выкупил жизнь', '#ffd86a');
  return true;
}

HEROES.push(
  /* ================= 58. Wлад ================= */
  {
    id: 'wlad', name: 'Wлад', title: 'Человек, у которого есть всё', role: 'mage', roleName: 'Толстосум', build: 'mage', bars: [4, 3, 4, 1], diffc: 2, atkSfx: 'coin',
    lore: 'Откуда у Wлада столько денег, не знает никто — кажется, и сам Wлад тоже. Он носит песочный костюм, расстёгнутую шёлковую рубашку и тёмные очки даже ночью и платит за всё: за обед, за мост, за чужую преданность. Говорят, однажды его убили, но он просто заплатил — и вернулся. Деньги для него не цель, а снаряд.',
    look: { bulk: 1.45, h: 0.98, scale: 1.08, arm: 1.12, c1: 0x8a7450, c2: 0x7a6444, c3: 0xc89a38, cuff: 0xd0c8b8, skin: 0xe8b896, hands: 0xe8b896, metal: 0xe8c050, glow: 0xffd040, head: 'wlad', hair: 0x24160e, shirt: 0x6a1e8a, lin: 0x18161c, chest: 'tycoon', legs: 'suit', sh: 'none', weapon: 'cash', wc: 'toss' },
    stats: ST(600, 88, 460, 46, 50, 2.6, 24, 2.8, 0.66, 8.6, 7.5),
    innate: { name: 'Купленная жизнь', icon: 'wlinn', desc: 'Смерть для Wлада — вопрос цены. Пока он мёртв, он может не ждать: за 1000 золота сразу возрождается на фонтане (кнопка на экране гибели или клавиша возврата на базу). Не раньше чем через 2 сек после гибели и не чаще раза в 120 сек. А пока жив — деньги к деньгам: +1 золото в секунду.', count: h => h.buyCd > G.time ? Math.ceil(h.buyCd - G.time) : '' },
    shootAtk(u, t) { wlFlick(u, t); },
    buyback: wlBuyback, buyInfo: wlBuyState,
    onDeath(h) { h.diedAt = G.time; },
    whileDead(h) { if (h.ai && h.respawnT > 9 && h.gold >= WL_BUY + 100 && wlBuyState(h).ok) wlBuyback(h); },
    tick(h, dt) {
      h.gold += dt; h.goldTotal += dt;
      if (!FX.near(h.x, h.z, 40)) return;
      if (h.moving && Math.random() < dt * 0.9) { const a = h.facing + Math.PI + rand(-0.6, 0.6); wlBill(h.x + Math.sin(a) * 0.6, 1.3, h.z + Math.cos(a) * 0.6, Math.sin(a) * 0.8, 1, Math.cos(a) * 0.8, rand(1.6, 2.2)); }
      const r = h.rig; if (r && r.shades) { if (!(h.glintT > G.time - 0.3) && Math.random() < dt * 0.35) h.glintT = G.time; const g = clamp((G.time - (h.glintT || -9)) / 0.3, 0, 1), s = g < 1 ? Math.sin(Math.PI * g) * 0.32 : 0.01; for (const sp of r.shades) sp.scale.setScalar(s); }
    },
    abilities: [
      {
        key: 'Q', name: 'Пачка налички', icon: 'wlwad', cd: 7, cost: 55, range: 10, ind: { type: 'line', w: 1.4 }, anim: 'cashthrow', animDur: 0.5, lock: 0.25, ai: { t: 'shot', sp: 24, farm: true },
        desc: 'Wлад швыряет перетянутую золотой лентой пачку купюр (до 10). Она лопается на первом задетом враге или в конце пути: деньги разлетаются облаком — магический урон всем врагам в радиусе 2.8 и замедление на 30% на 1.5 сек. Сквозь летящие купюры не разглядеть дороги.',
        cast(h, p) {
          const dir = p.dir, dmg = D(h, 85, 18, 0, 0.6), R = 2.8; SFX.at('card', h.x, h.z, 0.5); SFX.at('whoosh', h.x, h.z, 0.5);
          after(0.17, () => {
            if (!h.alive) return; let done = false, acc = 0; const wad = wlWadMesh(), P = { x: h.x, y: 1.6, z: h.z };
            const e = FX.add(wad, 2, (k, me, dt) => { me.position.set(P.x, P.y, P.z); me.rotation.set(dt ? me.rotation.x + dt * 14 : 0, dir, 0); });
            const pop = (x, z) => { if (done) return; done = true; e.dead = true; wlCashBurst(h, x, z, R, dmg); };
            shot(h, { dir, speed: 24, range: 10, w: 0.8, mesh: false, ribbon: false, color: WLD.bill,
              trail: q => { P.x = q.x; P.y = 1.6; P.z = q.z; acc++; if (acc % 3 === 0 && FX.near(q.x, q.z, 45)) { wlBill(q.x, 1.6, q.z, rand(-1, 1), rand(0, 1.5), rand(-1, 1), rand(1.2, 1.7)); FX.trail(q.x, 1.6, q.z, WLD.c, 0.3, 1); } },
              onHit: u => pop(u.x, u.z), onEnd: (x, z) => pop(x, z) });
          });
        }
      },
      {
        key: 'W', name: 'Финансовая подушка', icon: 'wlcush', cd: 14, cost: 60, range: 0, ind: { type: 'self', r: 3.5 }, anim: 'cushion', animDur: 0.6, lock: 0.15, ai: { t: 'shield' }, noCue: true,
        desc: 'Wлад подбрасывает горсть золотых монет, и они вихрем кружат вокруг него: щит на 4 сек — от уровня умения, силы умений и денег в кошельке (+3% золота, не больше +200: чем богаче Wлад, тем мягче подушка). Когда щит пробит или время вышло, монеты разлетаются во все стороны — магический урон врагам в радиусе 3.5.',
        cast(h) {
          const amt = D(h, 80, 14, 0, 0.5) + Math.min(200, h.gold * 0.03), dmg = D(h, 50, 11, 0, 0.35);
          const b = addBuff(h, { id: 'wlcush', dur: 4, shield: amt, src: h, onEnd: () => wlCoinNova(h, dmg) }); if (b) b.fx = wlCoinOrbit(h, 4);
          SFX.at('coin', h.x, h.z, 0.8); SFX.at('chime', h.x, h.z, 0.5); SFX.at('shield', h.x, h.z, 0.4);
          if (FX.near(h.x, h.z, 50)) { const A = wlHand(h); FX.sparks(A.x, A.y, A.z, { n: 12, color: 0xffffff, color2: WLD.c, speed: [1, 3], up: 7, life: [0.25, 0.5], w: 0.08 }); wlCoins(h.x, 2.2, h.z, 6, 2, 6, 0.9); }
        }
      },
      {
        key: 'E', name: 'Взятка', icon: 'wlbribe', cd: 16, cost: 60, costText: '60 маны + 100 золота', range: 7, ind: { type: 'target', hero: true }, anim: 'bribe', animDur: 0.55, lock: 0.3, ai: { t: 'target' },
        desc: 'Wлад протягивает вражескому герою (до 7) веер купюр — и от этого предложения не отказываются. 1.25 / 1.4 / 1.55 / 1.7 сек подкупленный не атакует и не применяет умения: он идёт к Wладу, ловя деньги на лету, и получает на 15% больше урона. Стоит 100 золота сверх маны; деньги достаются ветру, а не врагу.',
        cast(h, p) {
          const t = p.unit; if (!t || t.kind !== 'hero' || !hostile(h, t)) return false;
          if (h.gold < 100) { if (h === G.player) { UI.msg('Не хватает золота на взятку: нужно 100'); SFX.play('deny'); } return false; }
          h.gold -= 100; const lv = Math.max(1, h.al[2]), dur = 1.1 + 0.15 * lv, from = wlHand(h);
          SFX.at('card', h.x, h.z, 0.7); SFX.at('whoosh', h.x, h.z, 0.3);
          if (FX.near(h.x, h.z, 55)) for (let i = 0; i < 5; i++) after(i * 0.05, () => wlBillTo(from, t, 0.3));
          after(0.3, () => {
            if (!t.alive || !h.alive) return;
            const b = addBuff(t, { id: 'bribe', dur, silence: true, blind: true, dmgIn: 1.15, slow: 0.3, src: h }); if (!b) return;
            b.fx = wlBribeFx(t, b.dur); t.tauntT = G.time + b.dur; t.tauntBy = null; t.bribeT = t.tauntT; t.windup = 0; if (t.recall > 0) breakRecall(t);
            SFX.at('cash', t.x, t.z, 1); if (FX.near(t.x, t.z, 50)) { FX.glow(t.x, 1.6, t.z, 2.6, WLD.c, 0.25, 'star'); if (t === G.player || h === G.player) FX.text(t.x, t.height + 0.9, t.z, 'подкуплен!', '#ffd86a', 16); }
            let rp = 0;
            G.actors.push({ update(dt) {
              if (!t.alive || G.time > t.bribeT || b.dead || !t.buffs.includes(b)) { t.tauntT = 0; t.bribeT = 0; if (t.order && t.order.type === 'move') { t.order = null; t.path = null; } return false; }
              if (!h.alive) return true; rp -= dt;
              if (udist(h, t) > 2.6) { if (rp <= 0) { rp = 0.25; setMove(t, h.x, h.z); t.order = { type: 'move' }; } }
              else if (t.order) { t.order = null; t.path = null; }
              if (FX.near(t.x, t.z, 40) && Math.random() < dt * 4) FX.glow(t.x + rand(-0.4, 0.4), 1.3, t.z + rand(-0.4, 0.4), 0.8, WLD.c, 0.2, 'star');
              return true;
            } });
          });
        }
      },
      {
        key: 'R', name: 'Тяжёлый капитал', icon: 'wlsafe', cd: 90, cost: 100, range: 12, ind: { type: 'circle', r: 4 }, anim: 'wlsnap', animDur: 0.8, lock: 0.4, ai: { t: 'point', rad: 4, delay: 1.0, ult: true, hp: 0.55 }, noCue: true,
        desc: 'Wлад щёлкает пальцами — и с неба падает огромный золотой сейф (до 12). Через секунду он врезается в землю: магический урон всем врагам в радиусе 4 (сверху +3% золота в кошельке, не больше +300) и оглушение на 1.25 сек. Дверца слетает, из сейфа фонтаном бьют монеты и купюры, и 3 сек земля вокруг усыпана золотом: враги на нём замедлены на 40%, а союзные герои подбирают до 30 золота.',
        cast(h, p) {
          const x = p.x, z = p.z, R = 4, T = 1.0, dmg = D(h, 170, 38, 0, 0.8) + Math.min(300, h.gold * 0.03), face = angTo(x, z, h.x, h.z);
          G.dangers.push({ x, z, r: R, team: h.team, until: G.time + T }); SFX.at('ultcue', h.x, h.z, 0.6);
          after(0.3, () => { if (!h.alive) return; SFX.at('pop', h.x, h.z, 0.6); SFX.at('coin', h.x, h.z, 0.4); if (FX.near(h.x, h.z, 50)) { const A = wlHand(h); FX.glow(A.x, A.y, A.z, 1.6, WLD.c, 0.2, 'star'); FX.sparks(A.x, A.y, A.z, { n: 6, color: 0xffffff, color2: WLD.c, speed: [2, 5], life: [0.15, 0.3], w: 0.06 }); FX.ring(A.x, A.z, { r0: 0.2, r1: 1.4, color: WLD.c, life: 0.3, tex: 'ringThin', y: A.y }); } });
          wlSafeDrop(h, x, z, R, T, face, dmg);
        }
      }
    ]
  }
);

/* ---------- icons ---------- */
Object.assign(GLYPH, {
  // a gold coin with his W
  wlinn(T) { T.C(0, 0, 22); T.cut(() => { T.O(0, 0, 17, 2.5); T.S(4, -11, -8, -6, 9, 0, -2, 6, 9, 11, -8); }); T.hi(() => T.C(-10, -13, 2)); },
  // a banded wad of notes flying, two loose notes behind it
  wlwad(T) { T.rot(-0.35, () => { T.g.fillRect(-14, -9, 28, 18); T.cut(() => T.g.fillRect(-3, -10, 6, 20)); }, 6, 4); T.al(0.55, () => { T.rot(0.5, () => T.g.fillRect(-7, -4, 14, 8), -16, -14); T.rot(-0.9, () => T.g.fillRect(-6, -3.5, 12, 7), -20, 14); }); T.hi(() => T.C(10, -2, 1.6)); },
  // coins whirling round a shield
  wlcush(T) { T.O(0, 2, 15, 3); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; T.E(Math.cos(a) * 22, Math.sin(a) * 10 + 2, 5, 3); } T.al(0.4, () => T.C(0, 2, 12)); T.hi(() => T.C(-5, -4, 1.6)); },
  // a hand holding out a fan of notes
  wlbribe(T) { for (let i = -2; i <= 2; i++) T.rot(i * 0.28, () => { T.g.fillRect(-4, -26, 8, 20); }, 4, 4); T.P(-20, 10, 4, 4, 12, 10, 8, 20, -20, 22); T.hi(() => T.C(4, -18, 1.6)); },
  // a safe falling, speed lines over it
  wlsafe(T) { T.g.fillRect(-15, -6, 30, 28); T.cut(() => { T.O(3, 7, 7, 2.5); T.g.fillRect(-11, -2, 3, 20); }); for (const x of [-10, 0, 10]) T.al(0.5, () => T.S(2.5, x, -26, x, -12)); T.hi(() => T.C(3, 7, 1.6)); }
});
