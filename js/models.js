'use strict';
/* ===== procedural low-poly models + procedural animation ===== */
const TEAM_COL = [0x4d9dff, 0xff5148, 0xc9b36b];
const TEAM_CSS = ['#5aa7ff', '#ff5c52', '#c9b36b'];
function PM(color, o) { return new THREE.MeshPhongMaterial(Object.assign({ color, flatShading: true, shininess: 10, specular: 0x0a0a0a }, o || {})); }
function addMesh(geo, mt, x, y, z, parent) { const m = new THREE.Mesh(geo, mt); m.position.set(x, y, z); m.castShadow = true; if (parent) parent.add(m); return m; }
const BX = (w, h, d) => new THREE.BoxGeometry(w, h, d), CY = (a, b, h, n) => new THREE.CylinderGeometry(a, b, h, n || 6),
  CN = (r, h, n) => new THREE.ConeGeometry(r, h, n || 6), IC = (r, d) => new THREE.IcosahedronGeometry(r, d || 0), OC = r => new THREE.OctahedronGeometry(r, 0);
function glowSprite(color, size) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.8 }));
  s.scale.set(size, size, 1); s.userData.own = true; return s;
}
function groundRing(color, r, op) {
  const m = new THREE.Mesh(FX.geo.flat, new THREE.MeshBasicMaterial({ map: TEX.ring, color, transparent: true, opacity: op || 0.7, depthWrite: false, blending: THREE.AdditiveBlending }));
  m.position.y = 0.09; m.scale.set(r * 2 * RK, 1, r * 2 * RK); m.renderOrder = 5; return m;
}

/* ---------- minions / monsters (merged bodies) ---------- */
const _minGeo = {};
function minionGeo(type, team) {
  const key = type + team; if (_minGeo[key]) return _minGeo[key];
  const tc = team === 0 ? 0x355f9c : (team === 1 ? 0x9c3d35 : 0x5e5a40), tb = team === 0 ? 0x69a8ff : (team === 1 ? 0xff7a6e : 0xd8c070), dk = 0x2b2d33, sk = 0x77695c;
  let parts;
  if (type === 'melee') parts = [
    { g: BX(0.72, 0.62, 0.56), m: TRS(0, 0.72, 0), c: tc }, { g: BX(0.46, 0.4, 0.44), m: TRS(0, 1.24, 0.02), c: sk }, { g: BX(0.52, 0.2, 0.5), m: TRS(0, 1.42, 0), c: dk },
    { g: BX(0.22, 0.42, 0.26), m: TRS(-0.2, 0.21, 0), c: dk }, { g: BX(0.22, 0.42, 0.26), m: TRS(0.2, 0.21, 0), c: dk },
    { g: BX(0.08, 0.08, 0.9), m: TRS(0.48, 0.8, 0.4), c: 0x8a8f99 }, { g: BX(0.1, 0.56, 0.46), m: TRS(-0.44, 0.78, 0.18), c: tb }];
  else if (type === 'ranged') parts = [
    { g: CY(0.24, 0.5, 0.95, 6), m: TRS(0, 0.5, 0), c: tc }, { g: CN(0.34, 0.56, 6), m: TRS(0, 1.24, 0), c: dk }, { g: BX(0.26, 0.2, 0.1), m: TRS(0, 1.08, 0.2), c: sk },
    { g: CY(0.04, 0.04, 1.5, 4), m: TRS(0.42, 0.82, 0.2), c: 0x3b2f28 }, { g: IC(0.16), m: TRS(0.42, 1.66, 0.2), c: tb }];
  else if (type === 'siege') parts = [
    { g: BX(1.25, 0.6, 1.7), m: TRS(0, 0.62, 0), c: dk }, { g: BX(1.3, 0.2, 0.5), m: TRS(0, 1.0, -0.5), c: tc },
    { g: CY(0.24, 0.32, 1.5, 7), m: TRS(0, 1.15, 0.45, Math.PI / 2 - 0.25), c: 0x595d66 }, { g: IC(0.2), m: TRS(0, 1.36, 1.2), c: tb },
    ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(s => ({ g: CY(0.36, 0.36, 0.2, 8), m: TRS(s[0] * 0.72, 0.36, s[1] * 0.55, 0, 0, Math.PI / 2), c: 0x3b2f28 }))];
  else if (type === 'wolf') { const fur = 0x5b5a56, dkf = 0x3a3936; parts = [ // lean grey wolf: long body, wedge head, ears, tail
    { g: BX(0.5, 0.52, 1.3), m: TRS(0, 0.82, 0), c: fur }, { g: BX(0.58, 0.3, 0.6), m: TRS(0, 1.06, 0.3), c: dkf }, { g: BX(0.38, 0.36, 0.46), m: TRS(0, 1.02, 0.84), c: fur }, { g: BX(0.22, 0.2, 0.36), m: TRS(0, 0.92, 1.18), c: dkf },
    { g: CN(0.08, 0.24, 4), m: TRS(-0.13, 1.3, 0.76), c: dkf }, { g: CN(0.08, 0.24, 4), m: TRS(0.13, 1.3, 0.76), c: dkf }, { g: BX(0.07, 0.05, 0.04), m: TRS(-0.1, 1.08, 1.08), c: tb }, { g: BX(0.07, 0.05, 0.04), m: TRS(0.1, 1.08, 1.08), c: tb },
    { g: BX(0.14, 0.14, 0.6), m: TRS(0, 0.98, -0.88, 0.5), c: dkf },
    ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(s => ({ g: BX(0.14, 0.6, 0.16), m: TRS(s[0] * 0.2, 0.3, s[1] * 0.46), c: dkf }))]; }
  else if (type === 'spitter') { const sk2 = 0x4d6a3a, bl = 0x2f4426, sac = 0xb6e23a; parts = [ // squat swamp toad with a bloated glowing throat and stalk eyes
    { g: IC(0.62, 1), m: TRS(0, 0.62, 0), c: sk2 }, { g: IC(0.4, 1), m: TRS(0, 0.56, 0.5), c: sac }, { g: BX(0.7, 0.16, 0.5), m: TRS(0, 0.92, 0.42), c: bl },
    { g: CY(0.05, 0.07, 0.4, 5), m: TRS(-0.22, 1.2, 0.3), c: bl }, { g: CY(0.05, 0.07, 0.4, 5), m: TRS(0.22, 1.2, 0.3), c: bl }, { g: IC(0.11), m: TRS(-0.22, 1.44, 0.3), c: tb }, { g: IC(0.11), m: TRS(0.22, 1.44, 0.3), c: tb },
    { g: CN(0.1, 0.34, 4), m: TRS(0, 1.24, -0.1, -0.5), c: sac }, { g: CN(0.09, 0.3, 4), m: TRS(0, 1.12, -0.42, -0.9), c: sac },
    ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(s => ({ g: BX(0.3, 0.24, 0.44), m: TRS(s[0] * 0.56, 0.12, s[1] * 0.34, 0, s[0] * 0.4), c: bl }))]; }
  else if (type === 'ogre') { const hide = 0x6a5a48, dkh = 0x3f352b, tusk = 0xd8d0b8; parts = [ // hunched forest giant: barrel chest, low head with tusks, long arms, a tree-trunk club
    { g: BX(1.2, 1.0, 0.85), m: TRS(0, 1.5, 0, 0.18), c: hide }, { g: BX(0.9, 0.5, 0.7), m: TRS(0, 0.86, -0.02), c: dkh }, { g: BX(0.56, 0.5, 0.52), m: TRS(0, 2.08, 0.3), c: hide }, { g: BX(0.6, 0.14, 0.2), m: TRS(0, 2.2, 0.52), c: dkh },
    { g: BX(0.08, 0.06, 0.04), m: TRS(-0.14, 2.1, 0.57), c: tb }, { g: BX(0.08, 0.06, 0.04), m: TRS(0.14, 2.1, 0.57), c: tb }, { g: CN(0.06, 0.24, 4), m: TRS(-0.17, 1.98, 0.56), c: tusk }, { g: CN(0.06, 0.24, 4), m: TRS(0.17, 1.98, 0.56), c: tusk },
    { g: BX(0.36, 1.2, 0.4), m: TRS(-0.82, 1.28, 0.12, 0.2), c: hide }, { g: BX(0.36, 1.2, 0.4), m: TRS(0.82, 1.28, 0.12, 0.2), c: hide }, { g: BX(0.44, 0.34, 0.46), m: TRS(-0.82, 0.62, 0.26), c: dkh }, { g: BX(0.44, 0.34, 0.46), m: TRS(0.82, 0.62, 0.26), c: dkh },
    { g: CY(0.2, 0.12, 1.7, 6), m: TRS(0.86, 1.2, 0.72, 1.1), c: 0x4a3828 }, { g: CN(0.12, 0.3, 4), m: TRS(0.86, 1.76, 1.3, 0.3), c: tb }, { g: CN(0.12, 0.3, 4), m: TRS(0.72, 1.6, 1.1, 0, 0, 1.2), c: tb },
    { g: BX(0.44, 0.7, 0.5), m: TRS(-0.32, 0.35, 0), c: dkh }, { g: BX(0.44, 0.7, 0.5), m: TRS(0.32, 0.35, 0), c: dkh }, { g: BX(1.0, 0.14, 0.72), m: TRS(0, 0.98, 0), c: 0x2e2a24 }]; }
  else parts = [ // monster beast
    { g: BX(0.95, 0.8, 1.5), m: TRS(0, 0.85, 0), c: 0x4a4f45 }, { g: BX(0.66, 0.58, 0.66), m: TRS(0, 1.15, 0.9), c: 0x5a5f52 }, { g: BX(0.5, 0.2, 0.4), m: TRS(0, 0.9, 1.2), c: 0x32352f },
    { g: CN(0.1, 0.5, 4), m: TRS(-0.26, 1.6, 0.85, -0.4), c: tb }, { g: CN(0.1, 0.5, 4), m: TRS(0.26, 1.6, 0.85, -0.4), c: tb },
    { g: CN(0.16, 0.6, 4), m: TRS(0, 1.5, 0, -0.5), c: tb }, { g: CN(0.14, 0.5, 4), m: TRS(0, 1.4, -0.5, -0.7), c: tb },
    ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(s => ({ g: BX(0.26, 0.5, 0.3), m: TRS(s[0] * 0.34, 0.25, s[1] * 0.5), c: 0x32352f }))];
  return (_minGeo[key] = mergeParts(parts));
}
function buildMinion(type, team, scale) {
  const root = new THREE.Group(), body = new THREE.Mesh(minionGeo(type, team), new THREE.MeshPhongMaterial({ vertexColors: true, flatShading: true, shininess: 8, specular: 0x0a0a0a }));
  body.castShadow = true; root.add(body); root.scale.setScalar(scale || 1);
  return { root, body, mats: [body.material], type: 'minion', height: (type === 'ogre' ? 2.5 : type === 'siege' ? 1.9 : type === 'wolf' || type === 'spitter' ? 1.6 : 1.8) * (scale || 1) };
}
function animMinion(u, dt) {
  const r = u.rig, a = u.anim;
  if (u.flash > 0) { u.flash = Math.max(0, u.flash - dt * 7); r.mats[0].emissive.setScalar(u.flash * 0.5); }
  if (u.dead) { const k = Math.min(1, u.deathT / 0.5); r.root.scale.setScalar(Math.max(0.01, (u.scale || 1) * (1 - k * 0.8))); r.root.position.y = -k * 0.8; r.body.rotation.x = -k * 1.2; return; }
  r.root.rotation.y += angDiff(r.root.rotation.y, u.facing) * Math.min(1, dt * 12);
  r.root.position.y = u.yOff || 0;
  let y = 0, rx = 0, z = 0;
  if (u.moving) { a.walk += dt * 11; y = Math.abs(Math.sin(a.walk)) * 0.14; rx = 0.08; }
  if (a.atkT > 0) { a.atkT -= dt; const p = 1 - Math.max(0, a.atkT) / a.atkDur, s = Math.sin(Math.PI * p); z = s * 0.45; rx = s * 0.4; y += s * 0.1; }
  if (u.stunned) rx = Math.sin(G.time * 13) * 0.15;
  const k = Math.min(1, dt * 18);
  r.body.position.y += (y - r.body.position.y) * k; r.body.position.z += (z - r.body.position.z) * k; r.body.rotation.x += (rx - r.body.rotation.x) * k;
}

/* ---------- structures ---------- */
function buildTower(team, tier) {
  const root = new THREE.Group(), tc = team === 0 ? 0x2f5288 : 0x883a32, col = TEAM_COL[team];
  const parts = [
    { g: CY(2.1, 2.5, 1.0, 8), m: TRS(0, 0.5, 0), c: 0x4b4e56 }, { g: CY(1.25, 1.75, 5.2, 6), m: TRS(0, 3.6, 0), c: 0x5a5d66 },
    { g: CY(1.35, 1.35, 0.4, 6), m: TRS(0, 2.2, 0), c: tc }, { g: CY(1.3, 1.3, 0.4, 6), m: TRS(0, 4.6, 0), c: tc },
    { g: CY(1.9, 1.3, 0.8, 6), m: TRS(0, 6.5, 0), c: 0x43464e }];
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.52; parts.push({ g: BX(0.36, 1.5, 0.36), m: TRS(Math.sin(a) * 1.55, 7.5, Math.cos(a) * 1.55, 0.25 * Math.cos(a), 0, -0.25 * Math.sin(a)), c: i % 2 ? tc : 0x5a5d66 }); }
  const body = new THREE.Mesh(mergeParts(parts), new THREE.MeshPhongMaterial({ vertexColors: true, flatShading: true, shininess: 14, specular: 0x111111 }));
  body.castShadow = true; body.receiveShadow = true; root.add(body);
  const cr = new THREE.Mesh(OC(0.95), new THREE.MeshBasicMaterial({ color: col })); cr.scale.set(0.8, 1.5, 0.8); cr.position.y = 8.6; root.add(cr);
  const sp = glowSprite(col, 7); sp.position.y = 8.6; root.add(sp);
  const ring = groundRing(col, 2.9, 0.5); root.add(ring);
  if (tier === 2) root.scale.setScalar(1.12);
  return { root, body, crystal: cr, spr: sp, mats: [body.material], type: 'tower', height: 9.6 };
}
function buildCore(team) {
  const root = new THREE.Group(), tc = team === 0 ? 0x2f5288 : 0x883a32, col = TEAM_COL[team];
  const parts = [{ g: CY(4.2, 4.8, 1.0, 10), m: TRS(0, 0.5, 0), c: 0x4b4e56 }, { g: CY(3.0, 3.6, 0.8, 10), m: TRS(0, 1.4, 0), c: 0x5a5d66 }, { g: CY(3.1, 3.1, 0.3, 10), m: TRS(0, 1.1, 0), c: tc }];
  for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; parts.push({ g: BX(0.7, 3.6, 0.7), m: TRS(Math.sin(a) * 3.3, 2.6, Math.cos(a) * 3.3, 0.3 * Math.cos(a), 0, -0.3 * Math.sin(a)), c: i % 2 ? 0x5a5d66 : tc }, { g: CN(0.5, 1.2, 4), m: TRS(Math.sin(a) * 2.95, 4.9, Math.cos(a) * 2.95, 0.3 * Math.cos(a), 0, -0.3 * Math.sin(a)), c: 0x43464e }); }
  const body = new THREE.Mesh(mergeParts(parts), new THREE.MeshPhongMaterial({ vertexColors: true, flatShading: true, shininess: 14, specular: 0x111111 }));
  body.castShadow = true; body.receiveShadow = true; root.add(body);
  const cr = new THREE.Mesh(OC(1.9), new THREE.MeshBasicMaterial({ color: col })); cr.scale.set(0.8, 1.6, 0.8); cr.position.y = 5.4; root.add(cr);
  const orbit = new THREE.Group(); orbit.position.y = 5.4; root.add(orbit);
  for (let i = 0; i < 4; i++) { const a = i / 4 * TAU; const s = new THREE.Mesh(OC(0.4), cr.material); s.scale.set(0.6, 1.6, 0.6); s.position.set(Math.sin(a) * 2.8, 0, Math.cos(a) * 2.8); orbit.add(s); }
  const sp = glowSprite(col, 14); sp.position.y = 5.4; root.add(sp);
  root.add(groundRing(col, 5.6, 0.5));
  return { root, body, crystal: cr, spr: sp, orbit, mats: [body.material], type: 'tower', height: 9 };
}
function animStruct(u, dt) {
  const r = u.rig, t = G.time;
  if (u.flash > 0) { u.flash = Math.max(0, u.flash - dt * 7); r.mats[0].emissive.setScalar(u.flash * 0.3); }
  if (!u.alive) return;
  r.crystal.rotation.y += dt * (u.target ? 3.5 : 0.9); r.crystal.position.y += ((u.kind === 'core' ? 5.4 : 8.6) + Math.sin(t * 1.8 + u.id) * 0.2 - r.crystal.position.y) * 0.1;
  r.spr.material.opacity = 0.55 + Math.sin(t * 3 + u.id) * 0.12 + (u.shotFlash || 0); if (u.shotFlash > 0) u.shotFlash = Math.max(0, u.shotFlash - dt * 3);
  if (r.orbit) r.orbit.rotation.y -= dt * 0.9;
}
function buildFountainFx(scene, team) {
  const b = BASES[team], col = TEAM_COL[team];
  const ring = groundRing(col, 8.6, 0.28); ring.position.set(b.fountain.x, 0.24, b.fountain.z); ring.material.map = TEX.rune; scene.add(ring);
  const pil = new THREE.Mesh(FX.geo.cyl, FX.mat('pillar', col, 0.09)); pil.position.set(b.fountain.x, 0.2, b.fountain.z); pil.scale.set(8.4, 7, 8.4); pil.renderOrder = 6; scene.add(pil);
  return { ring, pil };
}
