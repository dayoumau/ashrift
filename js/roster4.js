'use strict';
/* ===== roster, parts 21–23: Raul the faceless winged one, Tanya the child officer with the cursed computation orb, Setsuna who cuts space itself.
   Loaded after icons.js: the glyphs of their icons are added to GLYPH at the end of this file ===== */
const RAU = { c: 0xff2a3a, deep: 0x4a0410, pale: 0xffb8c0, soul: 0xd8e8ff };
const TAN = { c: 0xffc84a, pale: 0xfff2c8, deep: 0x8a4a08, fire: 0xff7a2a };
const SET = { c: 0xb08aff, pale: 0xece4ff, deep: 0x3a1a8a, void: 0x05020c };

/* ================= Raul ================= */
// a black hand of the abyss: a forearm rising out of the ground, a broad palm leaning forward, four long clawed fingers curling in, crimson veins; built once, every hand is a clone sharing it
let _rauHand = null;
function rauHand() {
  if (!_rauHand) {
    const g = new THREE.Group(), k = kit(), bk = 0x2a2030, sk = 0x46323e, gl = { g: RAU.c };
    k.t(0.2, 0.2, 0.32, 0.32, 1.5, bk, 0, 0.75, 0).b(0.34, 0.16, 0.3, sk, 0, 1.52, 0.02).b(0.42, 0.42, 0.14, bk, 0, 1.78, 0.06, 0.25);
    for (let i = 0; i < 4; i++) { const x = (i - 1.5) * 0.1; k.b(0.075, 0.3, 0.075, bk, x, 2.09, 0.13, 0.35).b(0.065, 0.26, 0.065, bk, x, 2.3, 0.29, 1.05).c(0.035, 0.2, 4, sk, x, 2.33, 0.5, 1.9); }
    k.b(0.08, 0.28, 0.08, bk, -0.25, 1.84, 0.16, 0.6, 0, 0.6).c(0.03, 0.14, 4, sk, -0.32, 1.95, 0.28, 1.4, 0, 0.6)
      .b(0.05, 1.2, 0.05, gl, 0.1, 0.85, 0.165).b(0.05, 0.9, 0.05, gl, -0.12, 0.95, -0.16, 0, 0, 0.1).b(0.04, 0.36, 0.04, gl, 0.02, 1.78, 0.14, 0.25).b(0.04, 0.6, 0.04, gl, 0.165, 0.6, 0, 0, 0, -0.08).b(0.04, 0.5, 0.04, gl, -0.165, 0.5, 0.05, 0, 0, 0.1);
    for (let i = 0; i < 4; i++) k.b(0.03, 0.2, 0.03, gl, (i - 1.5) * 0.1, 2.1, 0.17, 0.35);
    k.into(g, new THREE.MeshPhongMaterial({ vertexColors: true, flatShading: true, shininess: 60, specular: 0x442233 }), new THREE.MeshBasicMaterial({ vertexColors: true }));
    _rauHand = g;
  }
  return _rauHand.clone(true);
}
// one hand bursting out of the ground at (x, z), turned toward `face`; it rises, bends over its prey (lean), holds, and sinks back
function rauHandFx(x, z, face, dur, lean, s) {
  if (!FX.near(x, z, 60)) return null; const g = rauHand(); g.rotation.order = 'YXZ'; g.rotation.y = face; g.scale.setScalar(s); g.position.set(x, -2.6 * s, z);
  FX.burst(x, 0.2, z, { n: 5, color: 0xff8a9a, color2: RAU.deep, speed: [1, 3], life: [0.3, 0.6], size: [0.3, 0.05], up: 4 }); FX.debris(x, 0.2, z, { n: 3, color: 0x2a2228, speed: [1, 3], up: 6, size: [0.12, 0.28] });
  return FX.add(g, dur, (k, me, dt, en) => {
    const t = en.t, up = easeOut(Math.min(1, t / 0.16)), out = Math.max(0, (t - (dur - 0.3)) / 0.3);
    me.position.y = (-2.6 + 2.45 * up - 2.8 * out * out) * s; me.rotation.x = lean * Math.min(1, t / 0.3) * (1 - out) + Math.sin(t * 9 + x) * 0.04;
  });
}
// the pit the hands come out of: a black pool spreading over the ground under a turning red sigil, smoke rising
function rauPit(x, z, R, dur) {
  if (!FX.near(x, z, 60)) return;
  const m = new THREE.Mesh(FX.geo.flat, FX.mat('fill', 0x050208, 0.85, false)); m.position.set(x, 0.07, z); m.renderOrder = 4;
  FX.add(m, dur, (k, me, dt, en) => { const t = en.t, q = easeOut(Math.min(1, t / 0.25)) * Math.min(1, (dur - t) / 0.35), s = Math.max(0.01, R * 2.1 * RK * q); me.scale.set(s, 1, s); });
  FX.zone(x, z, R, RAU.c, dur, { tex: 'rune2', spin: -0.6, op: 0.5 }); FX.ring(x, z, { r0: 0.3, r1: R + 0.5, color: RAU.c, life: 0.4, tex: 'shock' });
  FX.burst(x, 0.3, z, { smoke: true, n: 10, color: 0x14060c, color2: 0x050205, speed: [0.3, 1.2], life: [0.8, 1.4], size: [1, 2], up: 1.5, rad: R * 0.8, a: 0.6 });
}
// one straight cut of the black sword: a black smear, a crimson edge and a white core sweeping from end to end, a scar on the ground
function rauCut(cx, cz, ang, L, y) {
  if (!FX.near(cx, cz, 60)) return; y = y || 1.1;
  const sx = Math.sin(ang), sz = Math.cos(ang), x0 = cx - sx * L / 2, z0 = cz - sz * L / 2;
  for (const [col, w, op, add, ro] of [[0x050206, 1.0, 0.85, false, 11], [RAU.c, 0.55, 1, true, 12], [0xffffff, 0.13, 1, true, 13]]) {
    const m = new THREE.Mesh(FX.geo.line, FX.mat('beam', col, op, add)); m.position.set(x0, y, z0); m.rotation.y = ang; m.renderOrder = ro;
    FX.add(m, 0.4, (k, me, dt, en) => { const t = en.t, sw = Math.min(1, t / 0.07); me.scale.set(w * (t < 0.07 ? 1 : 1 - (t - 0.07) / 0.33 * 0.6), 1, Math.max(0.01, L * sw)); me.material.opacity = op * (t < 0.12 ? 1 : Math.max(0, 1 - (t - 0.12) / 0.28)); });
  }
  FX.warp('line', x0, y, z0, { ang, w: 2.2, len: L, str: 0.5, life: 0.3 }); FX.lineDecal(x0, z0, ang, L, 0.25, RAU.c, 0.7);
  for (let i = 0; i <= 5; i++) { const f = i / 5; after(f * 0.07, () => FX.sparks(x0 + sx * L * f, y, z0 + sz * L * f, { n: 3, color: 0xffd0d8, color2: RAU.c, speed: [3, 8], life: [0.15, 0.35], w: 0.08, dir: ang + HPI * (i % 2 ? 1 : -1), spread: 0.6 })); }
}
// sunder: two streams of soul twist between them, his crimson going out, the victim's pale torn back to him
function rauSunderFx(h, t) {
  const A = { x: h.x, z: h.z }, B = { x: t.x, z: t.z }, d = dist(A.x, A.z, B.x, B.z) || 1, px = (B.z - A.z) / d, pz = -(B.x - A.x) / d;
  if (FX.near(A.x, A.z, 60) || FX.near(B.x, B.z, 60)) {
    for (const [P, Q, col, side] of [[A, B, RAU.c, 1], [B, A, RAU.soul, -1]]) for (let j = 0; j < 2; j++) {
      const rib = FX.ribbon(col, 0.42, 18), ph = j * Math.PI;
      for (let i = 0; i <= 14; i++) { const f = i / 14; after(f * 0.32, () => { const s = Math.sin(Math.PI * f), w = Math.cos(ph + f * 7) * s * 1.1 * side; rib.add(lerp(P.x, Q.x, f) + px * w, 1.3 + s * 1.6 + Math.sin(ph + f * 7) * 0.4, lerp(P.z, Q.z, f) + pz * w); if (i === 14) rib.end(); }); }
    }
    for (const [u, col] of [[h, RAU.c], [t, RAU.soul]]) { FX.pillar(u.x, u.z, { r: 1.1, h: 12, color: col, life: 0.7, op: 0.45 }); FX.ring(u.x, u.z, { r0: 0.4, r1: 3.2, color: col, life: 0.45, tex: 'shock' }); FX.implode(u.x, 1.4, u.z, 2.6, { n: 12, color: 0xffffff, color2: col, life: 0.3, streak: true }); }
    after(0.32, () => { for (const [u, col] of [[h, RAU.soul], [t, RAU.c]]) { if (!u.alive) continue; FX.burst(u.x, 1.4, u.z, { n: 14, color: 0xffffff, color2: col, speed: [1, 4], life: [0.4, 0.8], size: [0.5, 0.05], up: 2, rad: 0.8 }); FX.glow(u.x, 1.5, u.z, 3.4, col, 0.25, 'star'); } });
    FX.text(h.x, h.height + 1.6, h.z, 'САНДЕР', '#ff5a6a', 22);
  }
  SFX.at('dark', h.x, h.z, 0.9); SFX.at('warp', t.x, t.z, 0.8); after(0.3, () => SFX.at('heavy', t.x, t.z, 0.6));
}

/* ================= Tanya ================= */
// an explosion formula going off: a magic circle flashes on the ground, then fire and light
function tanBlast(h, x, z, r, dmg, o) {
  o = o || {}; let n = 0;
  for (const e of enemiesIn(h, x, z, r)) { damage(h, e, dmg, 1, o.dot ? { dot: true } : undefined); n++; if (!e.alive) continue; if (o.slow) slow(h, e, o.slow, o.slowT || 1.2, 'tanslow'); if (o.knock) knock(e, x, z, o.knock, 0.22); }
  if (FX.near(x, z, 55)) {
    const big = r >= 2.6;
    FX.ring(x, z, { r0: r * 0.95, r1: r * 0.55, color: TAN.c, life: 0.2, tex: 'rune2', op: 0.85 });
    FX.ring(x, z, { r0: 0.3, r1: r * 1.1, color: TAN.fire, life: 0.4, tex: 'shock' }); FX.glow(x, 1, z, r * 1.5, TAN.c, 0.22, 'star');
    FX.flame(x, 0.8, z, { n: big ? 10 : 5, color: 0xffd08a, color2: 0x8a2a00, speed: [0.5, r], life: [0.3, 0.7], size: [r * 0.4, r * 0.9], rad: r * 0.4, up: 2, a: 0.4 });
    FX.sparks(x, 0.8, z, { n: big ? 18 : 8, color: 0xffffff, color2: TAN.c, speed: [r * 2, r * 5], life: [0.2, 0.5], up: r, w: 0.1 });
    if (big) { FX.shock(x, z, r * 1.5, 0.9, 0.4); FX.light(x, 2, z, TAN.fire, 1.6, r * 5, 0.35); FX.scorch(x, z, r * 0.6, TAN.fire, 5); FX.smoke(x, z, r * 0.6, 4); }
  }
  SFX.at(r >= 2.6 ? 'boom' : 'hit', x, z, r >= 2.6 ? 0.7 : 0.45); return n;
}
// the halo of the prayer: a golden sigil turning behind her head
function tanHalo(h, dur) {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.rune2, color: TAN.c, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  return FX.add(sp, dur, (k, me, dt, en) => {
    if (!h.alive) { en.dead = true; return; } const t = en.t, q = easeOut(Math.min(1, t / 0.3)) * Math.min(1, (dur - t) / 0.3), hv = (h.rig && h.rig.hover) || 0;
    me.position.set(h.x - Math.sin(h.facing) * 0.45, h.height + 0.25 + hv + (h.yOff || 0), h.z - Math.cos(h.facing) * 0.45); me.scale.set(2.6 * q, 2.6 * q, 1); me.material.opacity = 0.7 * q; me.material.rotation = t * 0.6;
    if (Math.random() < dt * 5 && FX.near(h.x, h.z, 45)) FX.sparks(h.x + rand(-0.5, 0.5), 0.6 + hv, h.z + rand(-0.5, 0.5), { n: 1, color: 0xffffff, color2: TAN.c, speed: [0.2, 0.6], life: [0.5, 0.9], up: 2.5, grav: 0, drag: 1, w: 0.06, stretch: 0.04 });
  });
}
// the great rifle of light, as one merged geometry built once: stock, receiver and bolt, a long barrel bound in rings, the sight, a lance of a bayonet. The muzzle is at (0, 0.1, 3.95)
let _tanGun = null;
function tanGunGeo() {
  if (_tanGun) return _tanGun;
  const k = kit(), g = new THREE.Group(), gold = 0xffd27a, wh = 0xfff4d8, dim = 0xb07a20;
  k.b(0.28, 0.55, 1.5, dim, 0, -0.18, -1.5, 0.12).b(0.3, 0.38, 1.2, gold, 0, 0, -0.15).y(0.05, 0.05, 0.4, 6, wh, 0.22, 0.08, -0.1, 0, 0, HPI).i(0.08, wh, 0.42, 0.08, -0.1)
    .b(0.2, 0.42, 0.3, dim, 0, -0.36, 0.05).b(0.24, 0.24, 1.6, dim, 0, -0.06, 1.25).y(0.09, 0.1, 3.4, 8, gold, 0, 0.1, 2.2, HPI).y(0.14, 0.14, 0.12, 10, wh, 0, 0.1, 3.9, HPI)
    .b(0.06, 0.18, 0.08, wh, 0, 0.27, 3.7).b(0.05, 0.16, 1.4, wh, 0, -0.05, 4.45).c(0.08, 0.4, 4, wh, 0, -0.05, 5.35, HPI);
  for (let i = 0; i < 5; i++) k.y(0.16, 0.16, 0.08, 10, wh, 0, 0.1, 0.9 + i * 0.7, HPI);
  k.into(g, new THREE.MeshBasicMaterial({ vertexColors: true }), new THREE.MeshBasicMaterial({ vertexColors: true }));
  return (_tanGun = g.children[0].geometry);
}
// Deus vult: the rifle forms in the air before her, circle after circle opens along the barrel and beyond the muzzle, then one shot of light; `fire` runs when the shot lands
function tanDeus(h, x, z, fire) {
  const dir = angTo(h.x, h.z, x, z), sx = Math.sin(dir), sz = Math.cos(dir), S = 1.6, P = { x: h.x + sx * 2.4, y: 3.6, z: h.z + sz * 2.4 }, pit = Math.atan2(P.y - 0.4, Math.max(2, dist(P.x, P.z, x, z) - 3.95 * S));
  const cp = Math.cos(pit), sp = Math.sin(pit), at = l => ({ x: P.x + sx * cp * l, y: P.y - sp * l + 0.1 * S * cp, z: P.z + sz * cp * l });   // a point along the barrel axis, `l` world units from the rifle's origin
  const near = FX.near(P.x, P.z, 60) || FX.near(x, z, 60), FIRE = 1.55;
  if (near) {
    // a solid body of pale gold and a glowing shell a little larger around it
    const m = new THREE.Mesh(tanGunGeo(), new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, depthWrite: false })), gl = new THREE.Mesh(tanGunGeo(), new THREE.MeshBasicMaterial({ color: TAN.c, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.userData.own = gl.userData.own = true; gl.scale.set(1.14, 1.14, 1.02); gl.renderOrder = 13; const grp = new THREE.Group(); grp.add(m, gl); grp.rotation.order = 'YXZ'; grp.rotation.set(pit, dir, 0);
    FX.add(grp, 2.2, (k, me, dt, en) => {
      const t = en.t, form = easeOut(Math.min(1, t / 0.5)), rc = t > FIRE ? Math.max(0, 1 - (t - FIRE) / 0.35) : 0, out = t > 1.75 ? (t - 1.75) / 0.45 : 0, kb = rc * rc * 1.4, s = S * (0.6 + 0.4 * form);
      me.scale.set(s * 1.8, s * 1.8, s); me.position.set(P.x - sx * cp * kb, P.y + sp * kb + Math.sin(t * 3) * 0.05, P.z - sz * cp * kb);
      m.material.opacity = 0.8 * form * (1 - out); gl.material.opacity = (0.35 + 0.15 * Math.sin(t * 9)) * form * (1 - out) + (t > FIRE && t < FIRE + 0.1 ? 0.6 : 0);
    });
    FX.implode(P.x, P.y, P.z, 4, { n: 26, color: 0xffffff, color2: TAN.c, life: 0.5, streak: true }); FX.light(P.x, P.y, P.z, TAN.c, 1.4, 18, 2);
    // circles along the barrel, small to large, then three great ones before the muzzle
    const l0 = 3.95 * S, Lm = Math.max(3, dist(P.x, P.z, x, z) / cp - l0), stp = Math.min(1.1, Lm * 0.75 / 7), C = [[3.2, 0.42], [5.0, 0.5]]; for (let i = 0; i < 7; i++) C.push([l0 + 0.8 + i * stp, 0.8 + i * 0.37]);
    C.forEach(([l, r], i) => after(0.3 + i * 0.12, () => { if (!h.alive) return; const q = at(l); frCircle(q.x, q.y, q.z, dir, r, i % 2 ? TAN.fire : TAN.c, FIRE + 0.25 - (0.3 + i * 0.12), { pitch: pit, spin: (i % 2 ? -1 : 1) * (2 + i * 0.3), op: i < 2 ? 0.9 : 0.6 }); SFX.at('zap', q.x, q.z, 0.2); }));
    after(1.25, () => { if (!h.alive) return; const q = at(3.95 * S); FX.implode(q.x, q.y, q.z, 3, { n: 24, color: 0xffffff, color2: TAN.c, life: 0.3, streak: true }); FX.glow(q.x, q.y, q.z, 4, TAN.c, 0.35, 'star'); });
  }
  SFX.at('ultcue', h.x, h.z, 0.5); SFX.at('cast', h.x, h.z, 0.8); after(0.6, () => SFX.at('horn', h.x, h.z, 0.3));
  after(FIRE, () => {
    if (!h.alive) return; const q = at(3.95 * S);
    if (near) { r3Ray(q.x, q.y, q.z, x, 0.3, z, { color: TAN.c, w: 3.2, life: 0.5, grow: true, core: 0.3 }); r3Ray(q.x, q.y, q.z, x, 0.3, z, { color: TAN.fire, w: 5, life: 0.3, op: 0.35 }); FX.glow(q.x, q.y, q.z, 7, 0xffffff, 0.2, 'flare'); FX.warp('line', q.x, 1.5, q.z, { ang: dir, w: 4, len: dist(q.x, q.z, x, z), str: 0.8, life: 0.4 }); }
    SFX.at('laser', h.x, h.z, 1); SFX.at('bigboom', h.x, h.z, 0.6); FX.shake(0.5); if (h === G.player) FX.punch(1);
    after(0.08, fire);
  });
}
// where the shot lands: a column of light, rings rolling out, fire, stone thrown up, a burnt sigil left on the ground
function tanImpact(x, z, R) {
  SFX.at('bigboom', x, z, 1); SFX.at('boom', x, z, 0.9); after(0.1, () => SFX.at('rubble', x, z, 0.8)); FX.shake(1.0);
  if (!FX.near(x, z, 60)) return;
  if (FX.near(x, z, 36)) FX.hitstop(0.1);
  FX.pillar(x, z, { r: 3.4, h: 30, color: TAN.fire, life: 0.9, op: 0.45 }); FX.pillar(x, z, { r: 1.3, h: 36, color: TAN.c, life: 0.5, op: 0.6 });
  for (let i = 0; i < 4; i++) after(i * 0.08, () => FX.ring(x, z, { r0: 0.5 + i, r1: R + 1 + i * 1.3, color: i % 2 ? TAN.pale : TAN.c, life: 0.55, tex: i ? 'ringThin' : 'shock' }));
  FX.explosion(x, z, 2.5, TAN.fire, { el: 'fire', color2: TAN.deep });
  FX.flame(x, 0.8, z, { n: 20, color: 0xffe0a0, color2: 0x8a2a00, speed: [1, 6], life: [0.5, 1.2], size: [1.6, 3.6], rad: R * 0.6, up: 3, a: 0.4 });
  FX.sparks(x, 1, z, { n: 46, color: 0xffffff, color2: TAN.c, speed: [8, 22], life: [0.3, 0.8], up: 6, w: 0.14, rad: 2 });
  FX.debris(x, 0.4, z, { n: 20, color: 0x4a4038, speed: [4, 12], up: 12, size: [0.2, 0.6], rad: R * 0.4 });
  FX.scorch(x, z, R * 0.75, TAN.fire, 9); FX.zone(x, z, R, TAN.c, 1.3, { tex: 'rune2', spin: 1.2, op: 0.7 }); FX.smoke(x, z, R * 0.7, 12);
  FX.warp('ring', x, 0.3, z, { r0: 1, r1: R * 1.8, str: 1.6, life: 0.6 }); FX.light(x, 4, z, TAN.c, 3, 40, 0.8); FX.glow(x, 2, z, 12, TAN.c, 0.3, 'star'); FX.punch(1.2);
}

/* ================= Setsuna ================= */
// a cut in space: a slit of nothing hanging in the air between two points, edged in violet light, turned to face the camera; it stays open `hold` seconds and then snaps shut
const _seCam = new THREE.Vector3(0, 38, 25).normalize(), _seD = new THREE.Vector3(), _seN = new THREE.Vector3(), _seW = new THREE.Vector3(), _seM = new THREE.Matrix4();
function seRift(ax, ay, az, bx, by, bz, o) {
  o = o || {}; const hold = o.hold === undefined ? 0.8 : o.hold, W = o.w || 0.42, col = o.col || SET.c, near = FX.near(ax, az, 70) || FX.near(bx, bz, 70);
  if (near) {
    _seD.set(bx - ax, by - ay, bz - az); const len = _seD.length() || 0.01; _seD.normalize();
    _seN.copy(_seCam).addScaledVector(_seD, -_seCam.dot(_seD)).normalize(); _seW.crossVectors(_seN, _seD).normalize();
    const g = new THREE.Group(); g.quaternion.setFromRotationMatrix(_seM.makeBasis(_seW, _seN, _seD)); g.position.set(ax, ay, az);
    const vm = new THREE.Mesh(FX.geo.line, new THREE.MeshBasicMaterial({ color: SET.void, transparent: true, opacity: 0.94, depthWrite: false, side: THREE.DoubleSide })); vm.renderOrder = 11; vm.userData.own = true;
    const edge = c => { const m = new THREE.Mesh(FX.geo.line, FX.mat('beam', c, 1, true, true)); m.userData.own = true; m.renderOrder = 12; return m; };
    const eA = edge(col), eB = edge(col), core = edge(0xffffff), haze = edge(SET.deep); haze.renderOrder = 10;
    g.add(haze, vm, eA, eB, core);
    FX.add(g, hold + 0.36, (k, me, dt, en) => {
      const t = en.t; let open, snap = 0;
      if (t < 0.06) open = easeOut(t / 0.06); else if (t < hold) open = 1 + Math.sin(t * 13 + ax) * 0.07; else { snap = Math.min(1, (t - hold) / 0.07); open = 1 - snap; }
      const ww = W * open, fade = t > hold + 0.07 ? Math.max(0, 1 - (t - hold - 0.07) / 0.29) : 1;
      vm.scale.set(Math.max(0.001, ww * 0.7), 1, len); vm.visible = open > 0.03;
      eA.position.x = ww * 0.36; eB.position.x = -ww * 0.36; for (const e of [eA, eB]) { e.scale.set(0.14 + 0.18 * (1 - open), 1, len); e.material.opacity = fade; }
      haze.scale.set(ww * 3.2 + 0.2, 1, len * 1.04); haze.position.z = -len * 0.02; haze.material.opacity = 0.5 * fade * (t < hold ? 1 : 1 - snap);
      core.scale.set(t < 0.06 ? 0.5 * (1 - t / 0.06) + 0.05 : (t >= hold ? 0.65 * fade : 0.001), 1, len); core.material.opacity = t < 0.06 || t >= hold ? fade : 0;
    });
    const ang = Math.atan2(bx - ax, bz - az), fl = Math.hypot(bx - ax, bz - az);
    if (fl > 1) FX.warp('line', ax, (ay + by) / 2, az, { ang, w: 1.4, len: fl, str: 0.35, life: hold });
  }
  after(hold, () => {
    if (near) {
      const n = Math.max(2, Math.round(Math.hypot(bx - ax, by - ay, bz - az) / 1.6));
      for (let i = 0; i <= n; i++) { const f = i / n; FX.sparks(lerp(ax, bx, f), lerp(ay, by, f), lerp(az, bz, f), { n: 2, color: 0xffffff, color2: col, speed: [2, 6], life: [0.1, 0.25], w: 0.06, grav: 0 }); }
      FX.glow((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2, 2.4, col, 0.14, 'flare');
    }
    if (o.onSnap) o.onSnap();
  });
}
// enemies on the ground strip under a cut from (ax, az) to (bx, bz)
function seLine(h, ax, az, bx, bz, hw) { return stripHits(h, ax, az, angTo(ax, az, bx, bz), Math.max(0.1, dist(ax, az, bx, bz)), hw); }
// a cut that hurts: `dmg` now to everyone under it, and when the rift snaps shut 40% of it again (o.snap overrides)
function seCut(h, ax, ay, az, bx, by, bz, hw, dmg, o) {
  o = o || {};
  if (dmg > 0) for (const e of seLine(h, ax, az, bx, bz, hw)) { damage(h, e, dmg, 0); if (FX.near(e.x, e.z, 45)) FX.hit(e.x, 1.2, e.z, SET.c, e.kind === 'hero'); }
  const snap = o.snap !== undefined ? o.snap : dmg * 0.4;
  seRift(ax, ay, az, bx, by, bz, { hold: o.hold || 0.8, w: o.w, onSnap: () => {
    if (!(snap > 0)) return; let n = 0;
    for (const e of seLine(h, ax, az, bx, bz, hw)) { damage(h, e, snap, 0, { dot: true }); n++; if (FX.near(e.x, e.z, 45)) FX.sparks(e.x, 1.2, e.z, { n: 6, color: 0xffffff, color2: SET.c, speed: [3, 8], life: [0.12, 0.3], w: 0.07 }); }
    SFX.at(n ? 'crit' : 'zap', (ax + bx) / 2, (az + bz) / 2, n ? 0.45 : 0.2);
  } });
}
/* the picture itself cut: up to three lines across the screen along which the two halves slide apart over a slit of nothing (in the final post pass),
   with a flash of white along each line on a canvas over the scene (that part also shows without post-processing) */
const SCUT = {
  cuts: [], cv: null, dirty: false,
  add(x, y, a, w, life, delay) { if (GFX.flash) this.cuts.push({ x, y, a, w, life, t0: G.time + (delay || 0) }); },
  apply(arr, play) {
    const now = G.time;
    for (let i = this.cuts.length - 1; i >= 0; i--) { const c = this.cuts[i]; if (!play || now > c.t0 + c.life) this.cuts.splice(i, 1); }
    if (arr) for (let i = 0; i < 3; i++) {
      const c = this.cuts[i]; let w = 0;
      if (c && now >= c.t0) { const t = now - c.t0; w = c.w * (t < 0.05 ? easeOut(t / 0.05) : (t > c.life - 0.12 ? Math.max(0, (c.life - t) / 0.12) : 1)); }
      arr[i].set(c ? c.x : 0, c ? c.y : 0, c ? c.a : 0, w);
    }
    const live = this.cuts.some(c => now >= c.t0 && now - c.t0 < 0.22);
    if (!live && !this.dirty) return;
    if (!this.cv) { this.cv = document.createElement('canvas'); this.cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none'; const ov = $('ov'); if (ov) ov.insertAdjacentElement('afterend', this.cv); else document.body.appendChild(this.cv); }
    const cv = this.cv, W = innerWidth, H = innerHeight; if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    const g = cv.getContext('2d'); g.clearRect(0, 0, W, H); this.dirty = live; if (!live) return;
    g.lineCap = 'round';
    for (const c of this.cuts) {
      const t = now - c.t0; if (t < 0 || t > 0.22) continue; const al = 1 - t / 0.22, px = c.x * W, py = (1 - c.y) * H, dx = -Math.sin(c.a) * H, dy = -Math.cos(c.a) * H, L = (W + H) / H * 1.5, reach = Math.min(1, t / 0.04);
      for (const [lw, st] of [[10, 'rgba(160,120,255,' + (0.35 * al) + ')'], [2.4, 'rgba(255,255,255,' + al + ')']]) { g.lineWidth = lw; g.strokeStyle = st; g.beginPath(); g.moveTo(px - dx * L * reach, py - dy * L * reach); g.lineTo(px + dx * L * reach, py + dy * L * reach); g.stroke(); }
    }
  }
};

HEROES.push(
  /* ================= 48. Raul ================= */
  {
    id: 'raul', name: 'Рауль', title: 'Безликий', role: 'front', roleName: 'Боец', build: 'bruiser', bars: [4, 3, 3, 4], diffc: 2, atkSfx: 'slash',
    lore: 'Никто не видел его лица — под капюшоном только пустота, и в ней нечему отражаться. Он приходит на чёрных крыльях с чёрным мечом и не боится умирать: каждая смерть оставляет в нём осколок тьмы, и обратно он возвращается злее. А если бой идёт плохо, он просто забирает чужую жизнь себе — и отдаёт взамен свою.',
    look: { bulk: 1.05, h: 1.08, scale: 1.12, c1: 0x15131a, c2: 0x0d0c11, c3: 0x08070a, cuff: 0x1c1a22, skin: 0x0b0a0e, hands: 0x0d0b10, metal: 0x2a2830, glow: 0xff2a3a, head: 'raul', chest: 'abyss', sh: 'tatter', back: 'wings', wingS: 1.45, weapon: 'abyssblade', wc: 'melee' },
    stats: ST(640, 95, 300, 32, 64, 3.7, 26, 2.9, 0.82, 9.2, 2.5),
    innate: { name: 'Цена смерти', icon: 'rauinn', desc: 'Каждая смерть делает Рауля сильнее: +10 к силе атаки за каждую его смерть в этом матче — до конца матча.', count: h => '+' + 10 * (h.deaths || 0) },
    tick(h, dt) {
      const want = 10 * (h.deaths || 0);
      if (want > 0 && (h.rauScar !== want || !hasBuff(h, 'rauscar'))) { addBuff(h, { id: 'rauscar', dur: 1e9, ad: want }); h.rauScar = want; }
      // on the wing: lifted off the ground, nothing pushes him aside; when the flight ends he lands on the nearest open ground
      const fly = h.flyT > G.time; h.rauLift = (h.rauLift || 0) + ((fly ? 1.7 : 0) - (h.rauLift || 0)) * Math.min(1, dt * 6);
      if (h.rauLift > 0.01 && !h.dash) h.yOff = Math.max(h.yOff || 0, h.rauLift);
      h.phase = fly;
      if (fly && Math.random() < dt * 6) lelFeathers(h.x, 2.4 + h.rauLift, h.z, 1);
      if (h.flyT && !fly) {
        h.flyT = 0;
        if (!NAV.ok(h.x, h.z)) { const q = NAV.nearest(h.x, h.z); h.x = q.x; h.z = q.z; if (h === G.player) G.camSnap = true; }
        const last = h.path && h.path[h.path.length - 1]; h.path = null; if (h.order && h.order.type === 'move' && last) setMove(h, last.x, last.z);
        if (FX.near(h.x, h.z, 45)) { FX.ring(h.x, h.z, { r0: 0.4, r1: 2.8, color: RAU.c, life: 0.35, tex: 'shock' }); FX.burst(h.x, 0.3, h.z, { smoke: true, n: 6, color: 0x2a2228, color2: 0x08060a, speed: [1, 3], life: [0.4, 0.8], size: [0.8, 1.4], ring: true, a: 0.45 }); }
      }
    },
    abilities: [
      {
        key: 'Q', name: 'Руки бездны', icon: 'rauhands', cd: 12, cost: 75, range: 9, ind: { type: 'circle', r: 3 }, anim: 'grasp', animDur: 0.6, lock: 0.3, ai: { t: 'point', rad: 3, delay: 0.45 },
        desc: 'Рауль бьёт ладонью оземь — и в круге радиусом 3 из земли вырываются чёрные руки. Через 0.35 сек они хватают всех врагов в круге: магический урон и обездвиживание на 1.3 / 1.45 / 1.6 / 1.75 сек.',
        cast(h, p) {
          const x = p.x, z = p.z, R = 3, lv = Math.max(1, h.al[0]), dur = 1.15 + 0.15 * lv, dmg = D(h, 80, 16, 0.2, 0.6);
          rauPit(x, z, R, dur + 0.55); SFX.at('dark', x, z, 0.7); SFX.at('rubble', x, z, 0.4);
          for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + rand(0.4), d = R * rand(0.75, 1), hx = x + Math.sin(a) * d, hz = z + Math.cos(a) * d; after(i * 0.03, () => rauHandFx(hx, hz, angTo(hx, hz, x, z), dur + 0.5, 0.55, rand(1.25, 1.6))); }
          after(0.35, () => {
            const foes = enemiesIn(h, x, z, R + 0.3);
            for (const e of foes) {
              damage(h, e, dmg, 1); if (!e.alive) continue; root(h, e, dur, RAU.c);
              for (const s of [-1, 1]) { const a = (e.facing || 0) + s * 1.9, hx = e.x + Math.sin(a) * 0.75, hz = e.z + Math.cos(a) * 0.75; rauHandFx(hx, hz, angTo(hx, hz, e.x, e.z), dur, 0.75, 1.05); }
              if (FX.near(e.x, e.z, 50)) { FX.burst(e.x, 0.6, e.z, { n: 8, color: 0xff6a7a, color2: RAU.deep, speed: [1, 4], life: [0.3, 0.6], size: [0.35, 0.05], up: 3 }); FX.glow(e.x, 1, e.z, 2.6, RAU.c, 0.2, 'star'); }
            }
            if (foes.length) { SFX.at('heavy', x, z, 0.6); FX.shake(0.2); }
            SFX.at('hit', x, z, 0.5);
          });
        }
      },
      {
        key: 'W', name: 'Крест', icon: 'raucross', cd: 9, cost: 55, range: 6, noReach: true, ind: { type: 'line', w: 5.3, len: 6, fixed: true }, anim: 'cross', animDur: 0.6, lock: 0.38, ai: { t: 'cone', farm: true },
        desc: 'Два разреза чёрным мечом крест-накрест перед собой: каждый наносит физический урон всем на своей линии (кто стоит в центре креста, получает оба). Если от «Креста» кто-нибудь умрёт, умение сразу перезаряжается.',
        cast(h, p) {
          const dir = p.dir, cx = h.x + Math.sin(dir) * 3.2, cz = h.z + Math.cos(dir) * 3.2, L = 7.6, dmg = D(h, 62, 13, 0.75); let reset = false;
          [dir + Math.PI / 4, dir - Math.PI / 4].forEach((a, k) => after(0.14 + k * 0.29, () => {
            if (!h.alive) return; const sx = Math.sin(a), sz = Math.cos(a), x0 = cx - sx * L / 2, z0 = cz - sz * L / 2;
            for (const e of stripHits(h, x0, z0, a, L, 0.75)) { const was = e.alive; damage(h, e, dmg, 0); if (was && !e.alive) reset = true; else if (e.alive && FX.near(e.x, e.z, 45)) FX.hit(e.x, 1.2, e.z, RAU.c, e.kind === 'hero'); }
            rauCut(cx, cz, a, L); SFX.at('slash', cx, cz, 0.9); SFX.at('whoosh', cx, cz, 0.6); FX.shake(0.12);
            if (k === 1) {
              if (FX.near(cx, cz, 50)) { FX.glow(cx, 1.1, cz, 3.4, RAU.c, 0.25, 'star'); FX.ring(cx, cz, { r0: 0.3, r1: 2.6, color: RAU.c, life: 0.3, tex: 'shock' }); }
              if (reset) { h.cd[1] = 0; if (FX.near(h.x, h.z, 45)) { FX.text(h.x, h.height + 1.2, h.z, 'ЕЩЁ', '#ff5a6a', 18); FX.ring(h.x, h.z, { r0: 2, r1: 0.3, color: RAU.c, life: 0.3, tex: 'ringThin' }); } SFX.at('cue', h.x, h.z, 0.6); }
            }
          }));
        }
      },
      {
        key: 'E', name: 'Чёрные крылья', icon: 'rauwings', cd: 16, cost: 60, range: 0, ind: { type: 'self', r: 2 }, anim: 'soar', animDur: 0.4, lock: 0.05, ai: { t: 'fly' }, noCue: true,
        desc: 'Рауль расправляет крылья и взлетает на 3 / 3.5 / 4 / 4.5 сек: +30 / 35 / 40 / 45% к скорости бега, замедления спадают, и он летит напрямик — над стенами, скалами и лесом. Атаковать в полёте можно.',
        cast(h) {
          const lv = Math.max(1, h.al[2]), dur = 2.5 + 0.5 * lv; h.flyT = G.time + dur;
          const last = h.path && h.path[h.path.length - 1]; if (h.order && h.order.type === 'move' && last) setMove(h, last.x, last.z);   // the rest of the way goes straight
          for (const b of h.buffs) if (b.slow) b.dead = true;
          addBuff(h, { id: 'rauwing', dur, ms: 0.25 + 0.05 * lv, src: h });
          SFX.at('whoosh', h.x, h.z, 1); SFX.at('dash', h.x, h.z, 0.6);
          if (FX.near(h.x, h.z, 50)) { FX.ring(h.x, h.z, { r0: 0.4, r1: 4.5, color: RAU.c, life: 0.4, tex: 'shock' }); FX.burst(h.x, 0.3, h.z, { smoke: true, n: 12, color: 0x2a2228, color2: 0x08060a, speed: [2, 6], life: [0.5, 1], size: [0.8, 1.6], ring: true, a: 0.5 }); lelFeathers(h.x, 2.4, h.z, 14); FX.shock(h.x, h.z, 4, 0.8, 0.35); }
        }
      },
      {
        key: 'R', name: 'Сандер', icon: 'rausunder', cd: 85, cost: 100, range: 7.5, ind: { type: 'target', hero: true }, anim: 'sunder', animDur: 0.75, lock: 0.5, ai: { t: 'sunder', ult: true },
        desc: 'Рауль вырывает душу вражеского героя и отдаёт ему свою: они меняются долями здоровья. Ни у кого из двоих после обмена не останется меньше 25 / 30 / 35% здоровья. Перезарядка 85 / 70 / 55 сек.',
        cast(h, p) {
          const t = p.unit; if (!t || !t.alive || t.kind !== 'hero' || t.invuln) return false;
          const lv = Math.max(1, h.al[3]), mn = 0.2 + 0.05 * lv; rauSunderFx(h, t);
          after(0.32, () => {
            if (!h.alive || !t.alive) return; const pa = h.hp / h.maxHp, pb = t.hp / t.maxHp, na = Math.max(pb, mn), nb = Math.max(pa, mn), lost = t.hp - nb * t.maxHp;
            h.hp = Math.min(h.maxHp, na * h.maxHp); t.hp = Math.max(1, Math.min(t.maxHp, nb * t.maxHp));
            if (lost > 0) { h.dmgHero += lost; h.dmgDealt += lost; t.dmgTaken += lost; t.lastDamageT = G.time; t.lastHitBy = h; t.dmgBy[h.id] = G.time; h.heroAggroT = G.time; t.flash = 1; if (t.recall > 0) breakRecall(t); }
            if (h === G.player || t === G.player) { if (lost > 0) FX.text(t.x, t.height + 0.6, t.z, '−' + Math.round(lost), '#ff4a5a', 21); FX.text(h.x, h.height + 0.6, h.z, (na >= pa ? '+' : '−') + Math.round(Math.abs(na - pa) * h.maxHp), na >= pa ? '#7dffa8' : '#ff4a5a', 21); FX.hitstop(0.06); }
          });
          return { cd: [85, 70, 55][lv - 1] * 100 / (100 + h.haste) };
        }
      }
    ]
  },
  /* ================= 49. Tanya ================= */
  {
    id: 'tanya', name: 'Таня', title: 'Ржавое серебро', role: 'marks', roleName: 'Стрелок', build: 'marks', bars: [5, 2, 2, 4], diffc: 2, projMesh: 'bolt', atkSfx: 'shoot',
    lore: 'Маленькая девочка с винтовкой и взглядом старого конторского служащего. Говорят, в прошлой жизни она и была служащим, который не верил в Бога, — и Бог отправил её на войну ребёнком. Она мечтает о тихой должности в тылу, а получает ордена: летает выше всех, стреляет точнее всех и молится только тогда, когда без этого не выжить.',
    look: { bulk: 0.8, h: 0.84, scale: 0.92, c1: 0x5a5e48, c2: 0x4a4e3a, c3: 0x1a1612, cuff: 0x4a4e3a, skin: 0xf6e0d2, hands: 0x2a2620, metal: 0xd8b04a, glow: 0xffc84a, head: 'tanya', hair: 0xf0d27a, chest: 'field', sh: 'none', weapon: 'mrifle', wc: 'gun', hover: 0.5 },
    stats: ST(530, 74, 320, 36, 55, 3.1, 19, 2.2, 0.8, 9.1, 10.4, 0.025),
    innate: { name: 'Вычислительное ядро', icon: 'taninn', desc: 'Таня летает над землёй, а в каждый четвёртый патрон вплетает взрывную формулу: пуля взрывается у цели — магический урон всем врагам в радиусе 2.2.', count: h => 4 - ((h.tanN || 0) % 4) },
    shootAtk(u, t) {
      u.tanN = (u.tanN || 0) + 1; const pray = u.prayT > G.time, form = pray || u.tanN % 4 === 0, hv = (u.rig && u.rig.hover) || 0;
      homing(u, t, { speed: 64, color: form ? TAN.c : 0xfff0d0, size: form ? 0.5 : 0.32, mesh: 'bolt', y: 1.25 + hv, onHit: tt => {
        basicHit(u, tt); FX.hit(tt.x, tt.height * 0.55, tt.z, TAN.c, form);
        if (form && u.alive) tanBlast(u, tt.x, tt.z, pray ? 2.6 : 2.2, (25 + 4 * u.level + 0.3 * u.ad + 0.3 * u.ap) * (pray ? 0.8 : 1), { dot: true });
      } });
      SFX.at('shoot', u.x, u.z, 0.6); if (form) SFX.at('cast', u.x, u.z, 0.25);
      if (FX.near(u.x, u.z, 50)) FX.glow(u.x + Math.sin(u.facing) * 1.6, 1.25 + hv, u.z + Math.cos(u.facing) * 1.6, form ? 2 : 1.2, TAN.c, 0.08, 'flare');
    },
    tick(h) { if (h.prayT && G.time > h.prayT) { h.prayT = 0; h.range = h.def.stats.range; } },
    abilities: [
      {
        key: 'Q', name: 'Взрывная формула', icon: 'tanblast', cd: 7, cost: 55, range: 13, ind: { type: 'line', w: 1.2 }, anim: 'shoot', animDur: 0.4, lock: 0.2, ai: { t: 'shot', sp: 52, farm: true },
        desc: 'Таня вкладывает в патрон взрывную формулу и стреляет сквозь магический круг: пуля летит на 13 и взрывается у первого врага (или в конце полёта) — магический урон всем в радиусе 2.8, отбрасывание и замедление на 30% на 1.2 сек.',
        cast(h, p) {
          const dir = p.dir, dmg = D(h, 88, 18, 0.55, 0.55), y0 = 1.25 + ((h.rig && h.rig.hover) || 0); let done = false;
          const boom = (x, z) => { if (done) return; done = true; tanBlast(h, x, z, 2.8, dmg, { slow: 0.3, knock: 1.2 }); };
          shot(h, { dir, speed: 52, range: 13, w: 0.6, color: TAN.c, mesh: 'bolt', size: 0.8, ribbon: 0.5, y: y0, onHit: e => boom(e.x, e.z), onEnd: (x, z) => boom(x, z) });
          SFX.at('shoot', h.x, h.z, 1); SFX.at('cast', h.x, h.z, 0.4);
          const mx = h.x + Math.sin(dir) * 1.8, mz = h.z + Math.cos(dir) * 1.8;
          frCircle(mx, y0, mz, dir, 0.75, TAN.c, 0.35, { open: 0.06, spin: 5, op: 0.8 }); FX.glow(mx, y0, mz, 2.4, TAN.c, 0.15, 'flare');
        }
      },
      {
        key: 'W', name: 'Пикирование', icon: 'tandive', cd: 13, cost: 60, range: 8, ind: { type: 'circle', r: 3 }, anim: 'dive', animDur: 0.4, lock: 0, ai: { t: 'gap', escape: true, rad: 3 },
        desc: 'Таня взмывает и пикирует в точку в пределах 8 — прямо над стенами. В месте приземления срабатывает взрывная формула: магический урон в радиусе 3 и замедление на 35% на 1.5 сек.',
        cast(h, p) {
          const dmg = D(h, 70, 15, 0.35, 0.5); SFX.at('dash', h.x, h.z, 0.8); SFX.at('whoosh', h.x, h.z, 0.6);
          if (FX.near(h.x, h.z, 50)) { FX.ring(h.x, h.z, { r0: 0.3, r1: 2.4, color: TAN.pale, life: 0.3, tex: 'shock' }); FX.burst(h.x, 0.4, h.z, { smoke: true, n: 6, color: 0x9a9488, color2: 0x3a3630, speed: [1, 3], life: [0.4, 0.8], size: [0.8, 1.4], ring: true, a: 0.4 }); }
          dashTo(h, p.x, p.z, 26, { fly: true, arc: 3.2, ribbon: TAN.pale, trail: u => { if (FX.near(u.x, u.z, 45) && Math.random() < 0.6) FX.burst(u.x, 1 + (u.yOff || 0), u.z, { n: 2, color: 0xffffff, color2: TAN.c, speed: [0.2, 1], life: [0.2, 0.4], size: [0.4, 0.05] }); },
            onEnd: u => { tanBlast(u, u.x, u.z, 3, dmg, { slow: 0.35, slowT: 1.5 }); FX.shake(0.25); } });
        }
      },
      {
        key: 'E', name: 'Молитва', icon: 'tanpray', cd: 20, cost: 70, range: 0, ind: { type: 'self', r: 2.5 }, anim: 'pray', animDur: 0.8, lock: 0.55, ai: { t: 'buff' }, noCue: true,
        desc: 'Скрепя сердце Таня молится — и проклятое вычислительное ядро отвечает. На 6 / 7 / 8 / 9 сек её глаза горят золотом: +40% к скорости атаки, +1.5 к дальности, и каждая атака несёт взрывную формулу (взрыв в радиусе 2.6). Пока Таня молится (0.55 сек), она стоит на месте.',
        cast(h) {
          const lv = Math.max(1, h.al[2]), dur = 5 + lv; SFX.at('cast', h.x, h.z, 0.7);
          if (FX.near(h.x, h.z, 50)) { FX.text(h.x, h.height + 1.4, h.z, '…слава Господу', '#ffe08a', 15); FX.implode(h.x, 1.6, h.z, 3, { n: 14, color: 0xffffff, color2: TAN.c, life: 0.5, streak: true }); }
          after(0.5, () => {
            if (!h.alive) return; h.prayT = G.time + dur; h.range = h.def.stats.range + 1.5;
            const b = addBuff(h, { id: 'tanpray', dur, as: 0.4, src: h }); if (b) b.fx = tanHalo(h, dur);
            SFX.at('ultcue', h.x, h.z, 0.3); SFX.at('cleanse', h.x, h.z, 0.6);
            if (FX.near(h.x, h.z, 50)) { FX.pillar(h.x, h.z, { r: 1.2, h: 14, color: TAN.c, life: 0.6, op: 0.45 }); FX.ring(h.x, h.z, { r0: 0.4, r1: 4.5, color: TAN.c, life: 0.5, tex: 'shock' }); FX.burst(h.x, 2, h.z, { n: 16, color: 0xffffff, color2: TAN.c, speed: [0.3, 1.5], life: [0.8, 1.4], size: [0.4, 0.05], up: 3, rad: 1.5, drag: 1 }); }
          });
        }
      },
      {
        key: 'R', name: 'Так хочет Бог', icon: 'tandeus', cd: 95, cost: 150, range: 22, ind: { type: 'circle', r: 7 }, anim: 'deus', animDur: 2.0, lock: 1.85, ai: { t: 'point', rad: 7, delay: 1.65, ult: true, hp: 0.55 },
        desc: 'Перед Таней из света собирается огромная винтовка, и вдоль ствола один за другим раскрываются девять магических кругов. Через 1.6 сек — выстрел: в точке попадания (до 22) столб света и взрыв радиусом 7 — огромный магический урон (в центре радиусом 3 на 25% больше), отбрасывание от центра и замедление на 40% на 2 сек. Пока винтовка собирается, Таня неподвижна.',
        cast(h, p) {
          const x = p.x, z = p.z, R = 7, dmg = D(h, 260, 55, 1.0, 0.9); telegraph(h, x, z, R, 1.63, TAN.c); G.dim = Math.max(G.dim || 0, FX.near(h.x, h.z, 40) ? 0.6 : 0);
          if (FX.near(x, z, 60)) FX.zone(x, z, R, TAN.c, 1.65, { tex: 'rune2', spin: -0.8, op: 0.4 });
          tanDeus(h, x, z, () => {
            for (const e of enemiesIn(h, x, z, R)) { const d = dist(e.x, e.z, x, z); damage(h, e, dmg * (d < 3 ? 1.25 : 1), 1); FX.hit(e.x, 1.3, e.z, TAN.c, true); if (!e.alive) continue; slow(h, e, 0.4, 2, 'tanslow'); if (d > 0.8) knock(e, x, z, 3, 0.3); }
            tanImpact(x, z, R);
          });
        }
      }
    ]
  },
  /* ================= 50. Setsuna ================= */
  {
    id: 'setsuna', name: 'Сэцуна', title: 'Рассекающий пространство', role: 'assassin', roleName: 'Убийца', build: 'assassin', bars: [5, 2, 3, 4], diffc: 3, atkSfx: 'slash',
    lore: 'Мечник, который однажды ударил так быстро, что разрезал не врага, а место, где тот стоял. С тех пор его клинок почти не покидает ножен: зачем, если щель в мире открывается и так? Разрезы висят в воздухе, как трещины на стекле, и смыкаются чуть позже — так что под удар Сэцуны можно попасть дважды.',
    look: { bulk: 0.92, h: 1.08, scale: 1.08, c1: 0x17151f, c2: 0x2a2834, c3: 0x0e0d12, cuff: 0x17151f, skin: 0xf0dccd, hands: 0xf0dccd, metal: 0xc8ccd8, glow: 0xb08aff, head: 'setsuna', hair: 0xeceaf2, shirt: 0xcfccd8, tie: 0x3a2a6a, chest: 'haori', legs: 'hakama', sh: 'cloth', coat: 0x17151f, weapon: 'nodachi', wc: 'melee' },
    stats: ST(590, 84, 290, 32, 63, 3.7, 23, 2.6, 0.84, 9.4, 2.7),
    innate: { name: 'Шрамы пространства', icon: 'setinn', desc: 'Каждый разрез Сэцуны остаётся висеть в воздухе и через мгновение смыкается — ещё 40% урона всем, кто стоит на линии разреза. Каждая четвёртая атака тоже оставляет разрез сквозь цель.', count: h => 4 - ((h.seN || 0) % 4) },
    onDeal(h, t, d, o) {
      if (!o.basic || t.struct || !t.alive) return; h.seN = (h.seN || 0) + 1; if (h.seN % 4) return;
      const a = angTo(h.x, h.z, t.x, t.z) + (Math.random() < 0.5 ? 1 : -1) * rand(0.5, 1.1), sx = Math.sin(a) * 1.9, sz = Math.cos(a) * 1.9;
      seCut(h, t.x - sx, 2.3, t.z - sz, t.x + sx, 0.4, t.z + sz, 0.7, 0, { snap: h.ad * 0.55, hold: 0.6, w: 0.34 }); SFX.at('slash', t.x, t.z, 0.4);
    },
    abilities: [
      {
        key: 'Q', name: 'Иай', icon: 'setiai', cd: 6, cost: 45, range: 9, noReach: true, ind: { type: 'line', w: 1.6, len: 9, fixed: true }, anim: 'iai', animDur: 0.45, lock: 0.22, ai: { t: 'shot', sp: 200, farm: true },
        desc: 'Удар из ножен быстрее взгляда: пространство разрезано на 9 вперёд — физический урон всем на линии. Разрез висит в воздухе и через 0.8 сек смыкается, ударяя ещё раз.',
        cast(h, p) {
          const dir = p.dir, sx = Math.sin(dir), sz = Math.cos(dir), dmg = D(h, 72, 15, 0.85);
          after(0.13, () => {   // the cut lands at the instant the blade leaves the scabbard
            if (!h.alive) return;
            seCut(h, h.x + sx * 0.6, 1.8, h.z + sz * 0.6, h.x + sx * 9, 0.7, h.z + sz * 9, 0.8, dmg); SFX.at('slash', h.x, h.z, 1); SFX.at('whoosh', h.x, h.z, 0.7); FX.shake(0.12);
            FX.slash(h.x + sx, h.z + sz, dir, { r: 2.4, sweep: 1.6, color: SET.c, life: 0.18, y: 1.3 });
          });
        }
      },
      {
        key: 'W', name: 'Шаг сквозь пустоту', icon: 'setstep', cd: 11, cost: 55, range: 7.5, ind: { type: 'line', w: 1.4 }, anim: 'iai', animDur: 0.35, lock: 0, ai: { t: 'gap', escape: true },
        desc: 'Сэцуна прорезает пространство и шагает сквозь разрез — мгновенно оказывается в 7.5 от прежнего места. Враги на пройденном пути получают физический урон, а разрез на этом месте смыкается через 0.8 сек. Атака после шага готова сразу.',
        cast(h, p) {
          const x0 = h.x, z0 = h.z, dmg = D(h, 58, 13, 0.55); dshGhost(h, SET.c, 0.5, 0.4);
          blink(h, p.x, p.z); h.facing = p.dir; h.atkCd = 0; h.drawT = G.time + 0.3; if (h === G.player) G.camSnap = true;
          seCut(h, x0, 0.4, z0, h.x, 2.3, h.z, 1.0, dmg, { w: 0.6 });
          SFX.at('warp', x0, z0, 0.7); SFX.at('slash', h.x, h.z, 0.8);
          if (FX.near(x0, z0, 55)) { FX.ring(x0, z0, { r0: 0.3, r1: 2.2, color: SET.c, life: 0.3, tex: 'shock' }); FX.implode(x0, 1.2, z0, 1.8, { n: 10, color: SET.pale, color2: SET.c, life: 0.2, streak: true }); FX.burst(h.x, 1.2, h.z, { n: 10, color: 0xffffff, color2: SET.c, speed: [1, 4], life: [0.2, 0.4], size: [0.35, 0.04] }); }
        }
      },
      {
        key: 'E', name: 'Сфера разрезов', icon: 'setsphere', cd: 14, cost: 80, range: 10, ind: { type: 'circle', r: 3.2 }, anim: 'flick', animDur: 0.5, lock: 0.25, ai: { t: 'point', rad: 3.2, delay: 0.6 },
        desc: 'Взмах — и пространство в круге радиусом 3.2 разлетается на десятки разрезов. 0.5 сек всё внутри режет (4 удара физического урона, замедление на 40%), затем разрезы разом смыкаются — последний, самый сильный удар.',
        cast(h, p) {
          const x = p.x, z = p.z, R = 3.2, tk = D(h, 26, 6, 0.28), fin = D(h, 60, 13, 0.55), T0 = 0.18, END = 1.16; SFX.at('whoosh', h.x, h.z, 0.7);
          if (FX.near(x, z, 60)) { FX.sphere(x, 1.4, z, { r0: 0.3, r1: R, color: SET.deep, life: 1.1, op: 0.45 }); FX.zone(x, z, R, SET.c, 1.25, { tex: 'crack', spin: 0, op: 0.55 }); FX.warp('lens', x, 1.4, z, { r: R, str: 0.6, life: 1.1 }); }
          for (let i = 0; i < 16; i++) after(T0 + i * 0.032, () => {
            const a = rand(TAU), b2 = rand(-0.8, 0.8), L = rand(2.6, 4.6), cx = x + rand(-1.4, 1.4), cz = z + rand(-1.4, 1.4), cy = rand(0.7, 2.4), dx = Math.sin(a) * Math.cos(b2) * L / 2, dz = Math.cos(a) * Math.cos(b2) * L / 2, dy = Math.sin(b2) * L / 2;
            seRift(cx - dx, Math.max(0.15, cy - dy), cz - dz, cx + dx, cy + dy, cz + dz, { hold: END - (T0 + i * 0.032), w: 0.3 }); if (i % 3 === 0) SFX.at('slash', cx, cz, 0.35);
          });
          for (let j = 0; j < 4; j++) after(T0 + 0.05 + j * 0.13, () => { for (const e of enemiesIn(h, x, z, R)) { damage(h, e, tk, 0); if (e.alive) slow(h, e, 0.4, 0.6, 'setslow'); FX.hit(e.x, 1.2, e.z, SET.c, false); } });
          after(END, () => {
            for (const e of enemiesIn(h, x, z, R + 0.3)) { damage(h, e, fin, 0); FX.hit(e.x, 1.2, e.z, SET.c, true); }
            if (FX.near(x, z, 55)) { FX.implode(x, 1.4, z, R + 1, { n: 22, color: 0xffffff, color2: SET.c, life: 0.2, streak: true }); FX.ring(x, z, { r0: R + 0.8, r1: 0.4, color: SET.c, life: 0.3, tex: 'shock' }); FX.glow(x, 1.4, z, 5, SET.c, 0.25, 'star'); FX.shock(x, z, R + 1, -1, 0.35); }
            SFX.at('shatter', x, z, 0.8); SFX.at('heavy', x, z, 0.6); FX.shake(0.3);
          });
        }
      },
      {
        key: 'R', name: 'Рассечение мира', icon: 'setworld', cd: 90, cost: 140, range: 0, ind: { type: 'self', r: 9 }, anim: 'sheathe', animDur: 1.5, lock: 1.35, ai: { t: 'nova', ult: true, r: 8.5, hp: 0.6, rad: 9 },
        desc: 'Сэцуна замирает, положив ладонь на рукоять, — пространство вокруг густеет, враги в радиусе 9 замедлены на 60%. Через 0.9 сек щёлкает гарда: всё в круге рассечено разом — огромный физический урон и оглушение на 0.8 сек, а сам мир на миг раскалывается по линиям разрезов. Ещё через 0.5 сек разрезы смыкаются: второй удар — 40% урона, вдвое больше по почти мёртвым (чем меньше у цели здоровья, тем сильнее).',
        cast(h) {
          const x = h.x, z = h.z, R = 9, dmg = D(h, 200, 46, 1.2), T = 0.9;
          telegraph(h, x, z, R, T, SET.c); SFX.at('ultcue', x, z, 0.6); SFX.at('dark', x, z, 0.5);
          for (const e of enemiesIn(h, x, z, R)) slow(h, e, 0.6, T, 'setthick');
          if (FX.near(x, z, 60)) { FX.zone(x, z, R, SET.c, T + 0.6, { tex: 'rune2', spin: -0.4, op: 0.5 }); FX.ring(x, z, { r0: R + 2, r1: R, color: SET.c, life: T, tex: 'ringThin' }); FX.implode(x, 1.4, z, R, { n: 40, color: SET.pale, color2: SET.c, life: T, streak: true }); FX.light(x, 3, z, SET.c, 1, 22, T + 0.4); }
          // the stillness: the world darkens while he waits
          G.actors.push({ t: 0, update(dt) { this.t += dt; if (this.t < T && FX.near(x, z, 40)) G.dim = Math.max(G.dim || 0, 0.9); return this.t < T; } });
          after(T, () => {
            if (!h.alive) return; const hit = enemiesIn(h, x, z, R);
            for (const e of hit) { damage(h, e, dmg, 0); FX.hit(e.x, 1.3, e.z, SET.c, true); if (!e.alive) continue; stun(h, e, 0.8); for (let k = 0; k < 2; k++) { const a = rand(TAU), sx = Math.sin(a) * 2.2, sz = Math.cos(a) * 2.2; seRift(e.x - sx, rand(1.6, 2.6), e.z - sz, e.x + sx, rand(0.2, 0.9), e.z + sz, { hold: 0.5, w: 0.5 }); } }
            SFX.at('slash', x, z, 1); SFX.at('crit', x, z, 0.8); SFX.at('bigboom', x, z, 0.5); FX.shake(0.9); FX.punch(1.2); if (FX.near(x, z, 40)) FX.hitstop(0.12);
            // dozens of cuts across the whole circle at once
            for (let i = 0; i < 24; i++) { const a = rand(TAU), d = R * Math.sqrt(Math.random()), cx = x + Math.sin(a) * d, cz = z + Math.cos(a) * d, b2 = rand(TAU), L = rand(4, 9), cy = rand(0.5, 3), tl = rand(-0.35, 0.35), dx = Math.sin(b2) * L / 2, dz = Math.cos(b2) * L / 2;
              seRift(cx - dx, Math.max(0.1, cy - tl * L / 2), cz - dz, cx + dx, Math.max(0.1, cy + tl * L / 2), cz + dz, { hold: 0.5, w: rand(0.3, 0.6) }); }
            if (FX.near(x, z, 60)) { FX.ring(x, z, { r0: 0.5, r1: R + 1, color: 0xffffff, life: 0.35, tex: 'ringThin' }); FX.ring(x, z, { r0: 0.5, r1: R, color: SET.c, life: 0.5, tex: 'shock' }); FX.warp('ring', x, 0.3, z, { r0: 1, r1: R * 1.4, str: 1.3, life: 0.5 }); FX.glow(x, 1.5, z, 9, SET.c, 0.2, 'star'); FX.text(x, h.height + 1.6, z, 'Щёлк.', '#e8dcff', 20); }
            // the picture itself splits along three lines
            if (FX.near(x, z, 34)) { const sp = UI.proj(x, 1.2, z); if (sp) for (let i = 0; i < 3; i++) SCUT.add(sp.x / UI.W + rand(-0.08, 0.08), 1 - sp.y / UI.H + rand(-0.08, 0.08), rand(Math.PI), 0.024 - i * 0.005, 0.5, i * 0.04); }
            after(0.5, () => {
              for (const e of enemiesIn(h, x, z, R + 0.5)) { const miss = 1 - e.hp / e.maxHp; damage(h, e, dmg * 0.4 * (1 + miss), 0); FX.hit(e.x, 1.3, e.z, SET.c, true); }
              SFX.at('shatter', x, z, 1); SFX.at('heavy', x, z, 0.8); FX.shake(0.5);
              if (FX.near(x, z, 60)) { FX.implode(x, 1.4, z, R, { n: 30, color: 0xffffff, color2: SET.c, life: 0.18, streak: true }); FX.ring(x, z, { r0: R, r1: 0.5, color: SET.c, life: 0.3, tex: 'shock' }); FX.shock(x, z, R, -1.2, 0.35); }
            });
          });
        }
      }
    ]
  }
);

/* ---------- icons of the three ---------- */
Object.assign(GLYPH, {
  rauinn(T) { T.skull(0, 4, 1.15); T.S(4, 15, -21, 27, -21); T.S(4, 21, -27, 21, -15); T.hi(() => T.C(-6, 1, 1.6)); },
  rauhands(T) { T.al(0.45, () => T.E(0, 21, 27, 6)); for (const s of [-1, 1]) { const cx = s * 11; T.P(cx - 5, 22, cx + 5, 22, cx + 6, 0, cx - 6, 0); T.P(cx - 7, 2, cx + 7, 2, cx + 6, -8, cx - 6, -8); for (let i = 0; i < 4; i++) { const fx = cx - 5.5 + i * 3.7; T.Q(2.6, fx, -7, fx - s, -18, fx - s * 6, -22); } } T.hi(() => T.S(1.4, -11, 14, -11, 4)); },
  raucross(T) { T.blade(-22, 22, 22, -22, 6.5); T.blade(22, 22, -22, -22, 6.5); T.al(0.4, () => T.O(0, 0, 9, 2)); T.hi(() => T.S(1.4, -14, 14, 12, -12)); },
  rauwings(T) { for (const s of [-1, 1]) T.P(s * 3, -4, s * 26, -22, s * 23, -10, s * 28, -7, s * 21, 3, s * 24, 8, s * 15, 11, s * 13, 20, s * 4, 6); T.C(0, -1, 4.5); T.hi(() => T.C(0, -2, 1.6)); },
  rausunder(T) { T.O(-14, 0, 9, 3); T.al(0.5, () => T.C(-14, 0, 6)); T.C(14, 0, 7); T.Q(3, -6, -11, 0, -24, 10, -11); T.head(11, -10, 0.88, 5); T.Q(3, 6, 11, 0, 24, -10, 11); T.head(-11, 10, 0.88 + Math.PI, 5); T.hi(() => T.C(14, -2, 2)); },
  taninn(T) { T.O(0, 4, 14, 3); T.C(0, 4, 8); T.S(2.5, -9, -22, 0, -10, 9, -22); T.cut(() => T.C(0, 4, 3.5)); T.hi(() => T.C(-3, 1, 2)); },
  tanblast(T) { T.star(9, -5, 17, 7, 8); T.P(-26, 16, -9, 3, -6, 7, -23, 20); T.al(0.45, () => T.O(9, -5, 22, 1.6)); T.hi(() => T.C(9, -5, 3)); },
  tandive(T) { T.arrow(-18, -22, 12, 12, 10, 5); T.al(0.5, () => T.E(14, 19, 13, 4.5)); T.al(0.4, () => { T.S(2, -26, -12, -6, 8); T.S(2, -12, -26, 8, -6); }); T.hi(() => T.C(12, 12, 2)); },
  tanpray(T) { T.O(0, -11, 13, 2.6); T.al(0.4, () => T.O(0, -11, 19, 1.5)); T.P(-4, 25, -9, 9, -3, -1, 0, 5, 3, -1, 9, 9, 4, 25); T.hi(() => T.C(0, -11, 2.5)); },
  tandeus(T) { T.g.fillRect(-27, -3, 31, 6); T.g.fillRect(-27, -3, 9, 12); for (let i = 0; i < 3; i++) T.O(10 + i * 6, 0, 5 + i * 4.5, 2.2); T.hi(() => T.S(1.4, -23, -1, 2, -1)); },
  setinn(T) { T.E(0, 0, 25, 7, 0, -0.7); T.cut(() => T.E(0, 0, 22, 2.6, 0, -0.7)); T.al(0.5, () => { T.C(-18, -14, 2); T.C(17, 13, 2); }); T.hi(() => T.C(0, 0, 1.6)); },
  setiai(T) { T.S(5, -25, 16, -2, 3); T.blade(-2, 3, 26, -13, 5); T.al(0.45, () => T.S(2, -27, -4, 27, -24)); T.hi(() => T.S(1.2, 4, -1, 20, -10)); },
  setstep(T) { T.al(0.5, () => T.E(0, 0, 8, 25, 0, 0.35)); T.cut(() => T.E(0, 0, 3.5, 21, 0, 0.35)); T.arrow(-26, 7, 25, -7, 8, 4); T.al(0.4, () => { T.S(2, -24, 15, -8, 11); T.S(2, -24, -1, -10, -4); }); T.hi(() => T.C(18, -5, 1.8)); },
  setsphere(T) { T.O(0, 0, 23, 2); for (let i = 0; i < 7; i++) { const a = i * 0.93 + 0.3, ox = Math.cos(a * 1.7) * 6, oy = Math.sin(a * 2.3) * 6; T.S(2.6, ox - Math.cos(a) * 16, oy - Math.sin(a) * 16, ox + Math.cos(a) * 16, oy + Math.sin(a) * 16); } T.hi(() => T.C(0, 0, 2)); },
  setworld(T) { T.g.fillRect(-24, 10, 38, 5); T.g.fillRect(12, 8, 11, 9); for (const [a, o] of [[-0.5, -8], [0.3, -14], [-0.12, 1]]) T.al(0.85, () => T.rot(a, () => T.S(2.4, -32, o, 32, o))); T.hi(() => T.S(1.2, -20, 11, 10, 11)); }
});
