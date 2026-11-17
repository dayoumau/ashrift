'use strict';
/* ===== roster, parts 17–20: Frieren the elf mage, Lelouch the prince with the geass, Ichigo the substitute soul reaper, Carlotta the crystal gunslinger ===== */
const FRI = { c: 0x9fe6ff, deep: 0x1a5a8a, pale: 0xe8faff, gold: 0xffd87a, red: 0xff3048, leaf: 0x7ad88a };
const LEL = { c: 0xff2a48, deep: 0x5a0818, pale: 0xffb0c0, vio: 0x8a3aff, gold: 0xffd06a };
const ICH = { c: 0x8fd8ff, pale: 0xe8f8ff, deep: 0x1a4a7a, red: 0xff1a2a, ink: 0x0a0408 };
const CAR = { c: 0x8fe0ff, pale: 0xeaffff, deep: 0x1a4a7a, pink: 0xff7a9a, gold: 0xffd87a };

/* ---------- shared: textures drawn once (the geass bird, a hexagon cell, a chessboard disc), a beam between two points in space, a vertical magic circle ---------- */
function r3Tex() {
  if (TEX.geass) return;
  const T = (s, f) => { const c = document.createElement('canvas'); c.width = c.height = s; f(c.getContext('2d'), s); return new THREE.CanvasTexture(c); };
  // the sigil of the geass: a bird with its wings swept up into a V, a pointed tail, a thin ring round it
  TEX.geass = T(256, (g, s) => {
    g.translate(s / 2, s / 2); const R = s * 0.42; g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.shadowColor = '#fff'; g.shadowBlur = 7;
    for (const k of [-1, 1]) {
      g.beginPath(); g.moveTo(0, -R * 0.02);
      g.bezierCurveTo(k * R * 0.28, -R * 0.12, k * R * 0.62, -R * 0.3, k * R * 0.98, -R * 0.78);
      g.bezierCurveTo(k * R * 0.7, -R * 0.58, k * R * 0.46, -R * 0.5, k * R * 0.3, -R * 0.42);
      g.bezierCurveTo(k * R * 0.5, -R * 0.3, k * R * 0.6, -R * 0.12, k * R * 0.62, R * 0.06);
      g.bezierCurveTo(k * R * 0.42, -R * 0.04, k * R * 0.22, R * 0.02, 0, R * 0.2); g.closePath(); g.fill();
    }
    g.beginPath(); g.moveTo(0, -R * 0.36); g.lineTo(R * 0.11, -R * 0.08); g.lineTo(0, R * 0.95); g.lineTo(-R * 0.11, -R * 0.08); g.closePath(); g.fill();
    g.lineWidth = s * 0.012; g.beginPath(); g.arc(0, 0, R * 1.05, 0, TAU); g.stroke();
  });
  // a hexagon cell: a bright rim and a faint fill, vertices on the x axis like a six-segment circle
  TEX.hex = T(128, (g, s) => {
    const R = s * 0.44; g.translate(s / 2, s / 2); g.beginPath(); for (let i = 0; i <= 6; i++) { const a = i / 6 * TAU; i ? g.lineTo(Math.cos(a) * R, Math.sin(a) * R) : g.moveTo(Math.cos(a) * R, Math.sin(a) * R); }
    g.fillStyle = 'rgba(255,255,255,.14)'; g.fill(); g.strokeStyle = '#fff'; g.shadowColor = '#fff'; g.shadowBlur = 6; g.lineWidth = s * 0.045; g.stroke();
  });
  // a disc of chessboard squares fading to the rim
  TEX.checker = T(256, (g, s) => {
    const n = 8, c = s / n; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const x = (i + 0.5) * c - s / 2, y = (j + 0.5) * c - s / 2, d = Math.hypot(x, y) / (s * 0.45); if (d > 1) continue; g.fillStyle = 'rgba(255,255,255,' + (((i + j) % 2 ? 0.75 : 0.12) * (1 - d * d)) + ')'; g.fillRect(i * c, j * c, c, c); }
    g.strokeStyle = '#fff'; g.lineWidth = s * 0.02; g.beginPath(); g.arc(s / 2, s / 2, s * 0.45, 0, TAU); g.stroke();
  });
}
// a beam between two points in space: two crossed bands of colour and a white core, optionally swelling in
function r3Ray(ax, ay, az, bx, by, bz, o) {
  if (!FX.near(ax, az, 70) && !FX.near(bx, bz, 70)) return null;
  const g = new THREE.Group(), len = Math.hypot(bx - ax, by - ay, bz - az), w = o.w || 0.6, op = o.op === undefined ? 1 : o.op;
  for (const [col, ww, oo] of [[o.color, w, op], [0xffffff, w * (o.core || 0.32), 1]]) for (const rz of [0, HPI]) { const m = new THREE.Mesh(FX.geo.line, FX.mat('beam', col, oo)); m.rotation.z = rz; m.userData.own = true; m.userData.w = ww; m.userData.op = oo; g.add(m); }
  g.position.set(ax, ay, az); g.lookAt(bx, by, bz);
  return FX.add(g, o.life || 0.3, k => { const sw = o.grow ? Math.min(1, 0.25 + k * 5) * (1 - k * 0.6) : 1 - k * 0.7; for (const m of g.children) { m.scale.set(m.userData.w * sw, 1, len); m.material.opacity = m.userData.op * (1 - k * k); } });
}
// a vertical magic circle hanging at (x, y, z) facing `face` (pitch > 0 tilts it to look down); it opens, turns, and closes at the end of its life
function frCircle(x, y, z, face, r, col, life, o) {
  o = o || {}; if (!FX.near(x, z, 70)) return null;
  const g = new THREE.Group(), ring = new THREE.Mesh(FX.geo.flat, FX.mat('rune2', col, 0)), core = new THREE.Mesh(FX.geo.flat, FX.mat('ring', o.core || col, 0));
  for (const m of [ring, core]) { m.userData.own = true; g.add(m); } g.rotation.order = 'YXZ'; g.rotation.set(o.pitch || 0, face, 0); g.position.set(x, y, z);
  const s = r * 2 * RK, sp = o.spin === undefined ? 2.2 : o.spin, op = o.op === undefined ? 0.9 : o.op;
  return FX.add(g, life, (k, me, dt, en) => {
    const t = en.t, open = easeOut(Math.min(1, t / (o.open || 0.18))), close = Math.min(1, (life - t) / 0.2), sc = s * open * (0.7 + 0.3 * close);
    ring.scale.set(sc, 1, sc); core.scale.set(sc * 0.55, 1, sc * 0.55); ring.rotation.set(HPI, t * sp, 0); core.rotation.set(HPI, -t * sp * 1.6, 0);
    ring.material.opacity = op * close; core.material.opacity = op * 0.45 * close;
  });
}
// a minimal merge of indexed geometries that keeps their texture coordinates (mergeParts drops them)
function r3Merge(list) {
  const pos = [], uv = [], idx = []; const v = new THREE.Vector3();
  for (const { g, m } of list) { const p = g.attributes.position, u = g.attributes.uv, off = pos.length / 3; for (let i = 0; i < p.count; i++) { v.set(p.getX(i), p.getY(i), p.getZ(i)).applyMatrix4(m); pos.push(v.x, v.y, v.z); uv.push(u.getX(i), u.getY(i)); } const ix = g.index.array; for (let i = 0; i < ix.length; i++) idx.push(ix[i] + off); }
  const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); out.setIndex(idx); return out;
}

/* ================= Frieren ================= */
// a dome of hexagon tiles on a unit hemisphere, built once
let _frHex = null;
function frHexGeo() {
  if (_frHex) return _frHex;
  const base = new THREE.CircleGeometry(1, 6), list = [], O = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), X = new THREE.Vector3(1, 0, 0);
  const rings = [[0.12, 15, 0.215], [0.45, 13, 0.22], [0.78, 11, 0.22], [1.1, 7, 0.22], [1.45, 3, 0.2], [HPI, 1, 0.16]];
  for (const [el, n, tr] of rings) for (let i = 0; i < n; i++) {
    const az = i / n * TAU + el * 2, c = new THREE.Vector3(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az)), m = new THREE.Matrix4();
    m.lookAt(c, O, Math.abs(c.y) > 0.97 ? X : up); m.scale(new THREE.Vector3(tr, tr, 1)); m.setPosition(c); list.push({ g: base, m });
  }
  return (_frHex = r3Merge(list));
}
// the honeycomb dome over a unit: it closes in from above, shimmers, and follows its owner
function frDome(u, dur) {
  r3Tex(); const m = new THREE.Mesh(frHexGeo(), FX.mat('hex', FRI.c, 0.75)), R = 2.1, rim = new THREE.Mesh(FX.geo.sphere, FX.rimMat(FRI.c, 0.5)); rim.userData.own = true; m.add(rim); rim.scale.set(1, 1, 1);
  return FX.add(m, dur, (k, me, dt, en) => {
    if (!u.alive) { en.dead = true; return; } const t = en.t, g = easeOut(Math.min(1, t / 0.2)), q = R * (0.6 + 0.4 * g) * (1 + Math.sin(t * 7) * 0.015);
    me.position.set(u.x, 0.05 + (u.yOff || 0), u.z); me.scale.set(q, q * (0.25 + 0.75 * g), q); me.rotation.y = t * 0.25;
    me.material.opacity = (0.6 + 0.15 * Math.sin(t * 11)) * Math.min(1, (dur - t) / 0.25); rim.material.uniforms.o.value = 0.5 * Math.min(1, (dur - t) / 0.25);
  });
}
// the dome broken: the cells scatter as shards of light
function frDomeBreak(u) {
  if (!FX.near(u.x, u.z, 50)) return;
  FX.debris(u.x, 1.6, u.z, { glow: true, n: 18, color: 0xcff6ff, speed: [3, 9], up: 7, size: [0.12, 0.32], rad: 1.6, life: 0.7 });
  FX.sparks(u.x, 1.6, u.z, { n: 18, color: 0xffffff, color2: FRI.c, speed: [5, 12], life: [0.2, 0.45], w: 0.09 }); FX.ring(u.x, u.z, { r0: 2.2, r1: 3.4, color: FRI.c, life: 0.35, tex: 'ringThin' });
  FX.glow(u.x, 1.6, u.z, 4, FRI.c, 0.22, 'star'); SFX.at('shatter', u.x, u.z, 0.8);
}
// Zoltraak: a straight beam of killing magic with a white core, the air rippling along it, a burst where it ends
function frZolt(x0, y0, z0, x1, y1, z1, s) {
  s = s || 1; const dir = Math.atan2(x1 - x0, z1 - z0), len = Math.hypot(x1 - x0, z1 - z0);
  r3Ray(x0, y0, z0, x1, y1, z1, { color: FRI.c, w: 1.05 * s, life: 0.4, grow: true, core: 0.36 });
  r3Ray(x0, y0, z0, x1, y1, z1, { color: FRI.deep, w: 2.2 * s, life: 0.28, op: 0.45 });
  if (!FX.near(x0, z0, 70)) return;
  FX.warp('line', x0, y0, z0, { ang: dir, w: 2.6 * s, len, str: 0.5, life: 0.35 });
  for (let i = 1; i <= 6; i++) { const f = i / 7; FX.sparks(lerp(x0, x1, f), lerp(y0, y1, f), lerp(z0, z1, f), { n: 3, color: 0xffffff, color2: FRI.c, speed: [2, 6], life: [0.15, 0.35], w: 0.07, dir, spread: 2.5 }); }
  for (let i = 0; i < 3; i++) after(i * 0.05, () => frCircle(lerp(x0, x1, 0.12 + i * 0.12), lerp(y0, y1, 0.12 + i * 0.12), lerp(z0, z1, 0.12 + i * 0.12), dir, 0.9 - i * 0.15, FRI.c, 0.25, { open: 0.06, spin: 6, op: 0.6 }));
  FX.glow(x1, y1, z1, 3.2 * s, FRI.c, 0.25, 'star'); FX.glow(x0, y0, z0, 3 * s, 0xffffff, 0.15, 'flare'); FX.light(x0, y0 + 0.5, z0, FRI.c, 1.6, 14, 0.3);
  FX.burst(x1, y1, z1, { n: 10, color: 0xffffff, color2: FRI.c, speed: [1, 5], life: [0.25, 0.5], size: [0.4, 0.04] });
}
// mana suppression: after 6 s without a spell her next one hits 25% harder and the hidden mana flares out
function frSup(h) {
  const full = G.time - (h.frLast === undefined ? -99 : h.frLast) >= 6; h.frLast = G.time; if (!full) return 1;
  if (FX.near(h.x, h.z, 50)) {
    FX.ring(h.x, h.z, { r0: 0.5, r1: 4.6, color: FRI.c, life: 0.5, tex: 'shock' }); FX.ring(h.x, h.z, { r0: 0.3, r1: 3.2, color: 0xffffff, life: 0.35, tex: 'ringThin' });
    FX.pillar(h.x, h.z, { r: 1.2, h: 10, color: FRI.c, life: 0.5, op: 0.4 }); FX.sparks(h.x, 1, h.z, { n: 16, color: 0xffffff, color2: FRI.c, speed: [3, 8], life: [0.3, 0.6], up: 6, ring: true, w: 0.08 });
    FX.text(h.x, h.height + 1, h.z, 'МАНА', '#c8f4ff', 15);
  }
  SFX.at('warp', h.x, h.z, 0.5); return 1.25;
}
// the flower field: small lit flowers of four colours (petals round a bright middle, a stem and a leaf), built once and shared
let _frFl = null;
function frFlowers() {
  if (_frFl) return _frFl;
  const mk = (petal, mid) => {
    const P = []; P.push({ g: new THREE.CylinderGeometry(0.02, 0.026, 0.42, 4), m: TRS(0, 0.21, 0), c: 0x3a8a3a }, { g: new THREE.BoxGeometry(0.17, 0.02, 0.07), m: TRS(0.07, 0.14, 0, 0, 0, 0.5), c: 0x4a9a4a });
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; P.push({ g: new THREE.IcosahedronGeometry(0.075, 0), m: TRS(Math.sin(a) * 0.085, 0.43, Math.cos(a) * 0.085, 0, a, 0, 1, 0.35, 1.5), c: petal }); }
    P.push({ g: new THREE.IcosahedronGeometry(0.045, 0), m: TRS(0, 0.455, 0), c: mid }); return mergeParts(P);
  };
  return (_frFl = { geos: [mk(0xf6f2ff, 0xffd84a), mk(0xc8a8ff, 0xfff0a0), mk(0x9ad8ff, 0xffffff), mk(0xffb8d8, 0xffd84a)], mat: new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }) });
}
function frField(x, z, R, dur) {
  if (!FX.near(x, z, 70)) return; const F = frFlowers(), grp = new THREE.Group(), list = [];
  for (let i = 0; i < 40; i++) {
    const a = rand(TAU), d = Math.sqrt(Math.random()) * R * 0.95, m = new THREE.Mesh(F.geos[i % 4], F.mat), s = rand(1.0, 1.6);
    m.position.set(x + Math.sin(a) * d, 0.02, z + Math.cos(a) * d); m.rotation.y = rand(TAU); m.scale.setScalar(0.001); grp.add(m); list.push({ m, s, at: d / R * 0.45 + rand(0.12), ph: rand(TAU) });
  }
  FX.add(grp, dur + 0.1, (k, me, dt, en) => {
    const t = en.t, out = Math.max(0, Math.min(1, (dur - t) / 0.45));
    for (const f of list) { const g = easeOut(clamp((t - f.at) / 0.3, 0, 1)); f.m.scale.setScalar(Math.max(0.001, f.s * g * out)); f.m.rotation.z = Math.sin(t * 2.2 + f.ph) * 0.12; f.m.rotation.x = Math.cos(t * 1.7 + f.ph) * 0.08; }
  });
  FX.zone(x, z, R, FRI.leaf, dur, { tex: 'rune', spin: 0.25, op: 0.35 }); FX.ring(x, z, { r0: 0.5, r1: R, color: 0xd8ffd0, life: 0.6, tex: 'shock', op: 0.6 });
  FX.burst(x, 0.4, z, { n: 26, color: 0xffffff, color2: 0xffb8d8, speed: [0.5, 2.5], life: [0.8, 1.6], size: [0.28, 0.06], up: 2.5, rad: R * 0.8, drag: 1.2, grav: -1 });
}

/* ================= Lelouch ================= */
// «Всё по плану»: whoever his spells touch is doomed for 4 s and takes 8% more from everything
function lelDoom(h, e) {
  if (!e.alive || e.struct) return; r3Tex(); const b = addBuff(e, { id: 'lelDoom', dur: 4, dmgIn: 1.08, src: h }); if (b) b.fx = FX.aura(e, LEL.c, 4, e.radius + 0.55, 'geass', 1.2);
}
const lelDoomed = e => e.buffs.some(b => b.id === 'lelDoom');
// the black king: built once from kit parts (glossy black, gold rims and cross, a red gem); every drop is a clone that shares it
let _lelKing = null;
function lelKing() {
  if (!_lelKing) {
    const g = new THREE.Group(), k = kit(), bk = 0x0c0c12, gold = 0xd8b04a, mat = new THREE.MeshPhongMaterial({ vertexColors: true, flatShading: true, shininess: 80, specular: 0x8888aa }), gm = new THREE.MeshBasicMaterial({ vertexColors: true });
    k.y(0.55, 0.62, 0.22, 12, bk, 0, 0.11, 0).y(0.63, 0.63, 0.06, 12, gold, 0, 0.25, 0).y(0.32, 0.5, 1.3, 12, bk, 0, 0.9, 0).y(0.5, 0.42, 0.2, 12, gold, 0, 1.62, 0).y(0.38, 0.5, 0.5, 12, bk, 0, 1.97, 0)
      .b(0.16, 0.7, 0.16, gold, 0, 2.55, 0).b(0.52, 0.16, 0.16, gold, 0, 2.66, 0).o(0.12, { g: 0xff2a48 }, 0, 1.62, 0.5, 1, 1.3, 0.6).o(0.12, { g: 0xff2a48 }, 0, 1.62, -0.5, 1, 1.3, 0.6);
    k.into(g, mat, gm); _lelKing = g;
  }
  return _lelKing.clone(true);
}
// a giant king drops out of the sky onto the target and slams down; `hit` runs on impact
function lelKingDrop(t, hit) {
  const T = 0.32; r3Tex();
  if (FX.near(t.x, t.z, 60)) {
    const kg = lelKing(), x = t.x, z = t.z;
    FX.add(kg, T + 0.7, (k, me, dt, en) => {
      const e = en.t, px = t.alive ? t.x : x, pz = t.alive ? t.z : z;
      if (e < T) { const q = e / T; me.position.set(px, lerp(10, 0.2, q * q), pz); me.scale.setScalar(1.25); me.rotation.y = e * 4; }
      else { const q = (e - T) / 0.7; me.position.y = 0.2 - q * 0.6 + Math.max(0, Math.sin(Math.PI * Math.min(1, q * 3)) * 0.3); me.scale.setScalar(1.25 * (q < 0.6 ? 1 : 1 - (q - 0.6) / 0.4)); }
    });
    FX.decal(x, z, 2.2, LEL.c, T);
  }
  after(T, () => {
    const x = t.alive ? t.x : t.x, z = t.z;
    if (FX.near(x, z, 55)) {
      FX.ring(x, z, { r0: 0.4, r1: 3.6, color: 0xffffff, life: 0.45, tex: 'checker', op: 0.8 }); FX.ring(x, z, { r0: 0.5, r1: 3.2, color: LEL.c, life: 0.4, tex: 'shock' }); FX.shock(x, z, 4, 0.8, 0.35);
      FX.debris(x, 0.3, z, { n: 8, color: 0x2a2630, speed: [2, 6], up: 7, size: [0.14, 0.34] }); FX.sparks(x, 0.6, z, { n: 12, color: 0xffd0d8, color2: LEL.c, speed: [3, 9], life: [0.2, 0.45], w: 0.1, ring: true });
      FX.glow(x, 1.2, z, 3, LEL.c, 0.2, 'star');
    }
    SFX.at('heavy', x, z, 0.8); SFX.at('hit', x, z, 0.6); FX.shake(0.25); hit();
  });
}
// black feathers falling around a unit (Zero's cape)
function lelFeathers(x, y, z, n) { if (FX.near(x, z, 50)) FX.burst(x, y, z, { smoke: true, n, color: 0x15121c, color2: 0x08060c, speed: [0.5, 2], life: [0.8, 1.4], size: [0.25, 0.35], up: 1.2, grav: -1.5, rad: 0.8, a: 0.85, drag: 1.2 }); }
// where a unit's eyes are, in the world
const _lv = new THREE.Vector3();
function lelEyes(u) { if (!u.rig || !u.rig.head) return { x: u.x, y: u.height * 0.9, z: u.z }; u.rig.head.getWorldPosition(_lv); return { x: _lv.x + Math.sin(u.facing) * 0.25, y: _lv.y, z: _lv.z + Math.cos(u.facing) * 0.25 }; }
// the geass taking hold: the puppet's own side becomes its enemy (madT, as in a cyberpsychosis), its owner's input and its bot are switched off, its eyes ring red
function geassStart(by, t, dur) {
  if (t.geass) geassEnd(t); r3Tex();
  const g = t.geass = { by, until: G.time + dur, fx: [], spr: [], think: 0 };
  t.madT = G.time + dur; t.order = null; t.path = null; t.windup = 0; if (t.recall > 0) cancelRecall(t);
  addBuff(t, { id: 'geassed', dur, as: 0.35, ms: 0.1, src: by });
  g.fx.push(FX.aura(t, LEL.c, dur, 2.3, 'geass', 1.4), FX.aura(t, LEL.deep, dur, 2.9, 'ringThin', -2));
  if (t.rig && t.rig.head) {   // a sigil hovering over the head and a red ring in each eye; children of the head so they follow every move
    const mk = (map, col, s) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map, color: col, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); sp.scale.set(s, s, 1); return sp; };
    const top = mk(TEX.geass, LEL.c, 0.9); top.position.set(0, 0.85, 0); t.rig.head.add(top); g.spr.push(top);
    for (const s of [-1, 1]) { const e = mk(TEX.ring, LEL.c, 0.14); e.position.set(s * 0.09, 0.03, 0.24); t.rig.head.add(e); g.spr.push(e); }
  }
  if (FX.near(t.x, t.z, 55)) {
    FX.ring(t.x, t.z, { r0: 0.4, r1: 4.2, color: LEL.c, life: 0.5, tex: 'shock' }); FX.implode(t.x, 1.5, t.z, 4, { n: 18, color: 0xffffff, color2: LEL.c, life: 0.25, streak: true });
    FX.warp('lens', t.x, 1.6, t.z, { r: 4, str: 1, life: 0.35 }); FX.glow(t.x, 2, t.z, 4, LEL.c, 0.3, 'star'); FX.text(t.x, t.height + 1.4, t.z, 'ПОВИНУЙСЯ', '#ff6a7a', 20);
    FX.bolt(t.x, 4.5, t.z, t.x + 1.2, 0.3, t.z - 0.8, { color: LEL.c, w: 0.5, life: 0.2 }); FX.bolt(t.x, 4.5, t.z, t.x - 1.1, 0.3, t.z + 0.9, { color: LEL.c, w: 0.4, life: 0.2 });
  }
  SFX.at('dark', t.x, t.z, 0.9); SFX.at('warp', t.x, t.z, 0.6); if (t === G.player || by === G.player) { FX.punch(0.8); FX.hitstop(0.06); }
  if (t === G.player) { UI.announce('Вами управляет Гиас: ' + dur.toFixed(1) + ' сек', '#ff3a4a'); SFX.play('warn'); }
  else if (by === G.player) UI.announce(t.name + ' подчиняется вашему Гиасу', '#ff6a7a');
}
function geassEnd(t) {
  const g = t.geass; if (!g) return; t.geass = null; t.madT = 0; t.order = null; t.path = null;
  for (const e of g.fx) if (e) e.dead = true; for (const s of g.spr) { if (s.parent) s.parent.remove(s); s.material.dispose(); }
  for (const b of t.buffs) if (b.id === 'geassed') b.dead = true;
  if (t.alive && FX.near(t.x, t.z, 50)) { FX.ring(t.x, t.z, { r0: 2.3, r1: 0.3, color: LEL.c, life: 0.3, tex: 'ringThin' }); FX.sparks(t.x, t.height, t.z, { n: 8, color: 0xffd0d8, color2: LEL.c, speed: [2, 5], life: [0.2, 0.4], w: 0.06 }); }
}
// every quarter second: whom the puppet goes for — what Lelouch himself is attacking if it is one of the puppet's own side, else the nearest hero of its side, else a minion of its side; with nothing near it follows him
function geassDrive(t, dt) {
  const g = t.geass, L = g.by; if (t.recall > 0) cancelRecall(t);
  for (let i = 1; i < g.spr.length; i++) g.spr[i].scale.setScalar(0.12 + Math.sin(G.time * 18 + i) * 0.03); if (g.spr[0]) { g.spr[0].material.rotation += dt * 1.5; g.spr[0].position.y = 0.85 + Math.sin(G.time * 3) * 0.06; }
  g.think -= dt; const cur = t.order && t.order.type === 'attack' ? t.order.tgt : null; if (g.think > 0 && cur && cur.alive) return; g.think = 0.25;
  let tg = null; const lo = L && L.alive && L.order && L.order.type === 'attack' ? L.order.tgt : null;
  if (lo && lo.alive && lo.team === t.team && lo !== t && !lo.struct) tg = lo;
  if (!tg) { let bd = 15; for (const u of G.heroes) if (u.alive && u !== t && u.team === t.team) { const d = udist(t, u); if (d < bd) { bd = d; tg = u; } } }
  if (!tg) { let bd = 11; for (const u of G.units) if (u.alive && u !== t && u.team === t.team && !u.struct && u.kind !== 'hero') { const d = udist(t, u); if (d < bd) { bd = d; tg = u; } } }
  if (tg) {
    if (cur !== tg) t.order = { type: 'attack', tgt: tg, rp: 0 };
    // its own single-target spells, turned on its friends
    if (Math.random() < 0.5) for (let i = 0; i < 3; i++) { const ab = t.def.abilities[i]; if (ab && !ab.passive && ab.ind && ab.ind.type === 'target' && t.al[i] && t.cd[i] <= 0 && t.mana >= ab.cost && udist(t, tg) < abRange(t, ab) + tg.radius) { castAbility(t, i, { x: tg.x, z: tg.z, unit: tg }); break; } }
  } else if (L && L.alive && udist(t, L) > 5) { setMove(t, L.x, L.z); t.order = { type: 'move' }; }
}

/* ================= Ichigo ================= */
// a flying crescent of spiritual pressure: a coloured outer arc, a white (or, for the hollow, black) core, a second arc rolled across it
function ichCres(col, core, s, dark) {
  const g = new THREE.Group();
  const parts = [[col, 1, 0, 1, true], [col, 0.88, 0.55, 0.5, true], [core, 0.74, 0, dark ? 0.9 : 1, !dark]];
  for (const [c, sc, roll, op, add] of parts) { const m = new THREE.Mesh(FX.geo.flat, FX.mat('slash', c, op, add)); m.userData.own = true; m.scale.setScalar(sc * s); m.rotation.z = roll; m.renderOrder = add ? 12 : 13; g.add(m); }
  return g;
}
// a basic attack: a small crescent that homes in on the target
function ichShoot(h, t) {
  const hol = h.hollowT > G.time, col = hol ? ICH.red : ICH.c, s = hol ? 1.7 : 1.3, f = h.facing, p = { x: h.x + Math.sin(f) * 1.1, y: 1.3, z: h.z + Math.cos(f) * 1.1 };
  SFX.at('slash', h.x, h.z, 0.5); SFX.at('whoosh', h.x, h.z, 0.25);
  const g = FX.near(p.x, p.z, 70) ? ichCres(col, hol ? ICH.ink : 0xffffff, s, hol) : null, en = g ? FX.add(g, 4, null) : null; let n = 0;
  if (g) { g.position.set(p.x, p.y, p.z); g.rotation.y = f; }
  G.actors.push({ update(dt) {
    if (!t.alive) { if (en) en.dead = true; return false; }
    const dx = t.x - p.x, dz = t.z - p.z, d = Math.hypot(dx, dz), st = 30 * dt;
    if (d <= st + 0.6) {
      basicHit(h, t); if (en) en.dead = true;
      if (FX.near(t.x, t.z, 50)) { FX.slash(t.x, t.z, Math.atan2(dx, dz), { r: 1.8, sweep: 1.2, color: col, life: 0.2, y: 1.3 }); FX.sparks(t.x, 1.3, t.z, { n: 6, color: 0xffffff, color2: col, speed: [3, 8], life: [0.12, 0.3], dir: Math.atan2(dx, dz), spread: 0.8, w: 0.08 }); }
      SFX.at('hit', t.x, t.z, 0.45); return false;
    }
    p.x += dx / d * st; p.z += dz / d * st; if (g) { g.position.set(p.x, p.y, p.z); g.rotation.y = Math.atan2(dx, dz); }
    if (++n % 2 === 0 && FX.near(p.x, p.z, 50)) FX.burst(p.x, p.y, p.z, { n: 1, color: hol ? 0x2a0408 : 0xffffff, color2: col, speed: [0.2, 0.8], life: [0.15, 0.3], size: [0.35, 0.05] });
    return true;
  } });
}
// the reiatsu flaring round him: blue-white, or black and red in the hollow form
function ichFlare(h, big) {
  if (!FX.near(h.x, h.z, 50)) return; const hol = h.hollowT > G.time, col = hol ? ICH.red : ICH.c;
  FX.flame(h.x, 0.6, h.z, { n: big ? 14 : 7, color: hol ? 0xff3040 : 0xdff6ff, color2: hol ? 0x3a0008 : ICH.deep, speed: [0.5, 2], life: [0.4, 0.8], size: [0.8, 1.8], up: 4, rad: 0.9, a: 0.4 });
  if (hol) FX.burst(h.x, 1.2, h.z, { smoke: true, n: big ? 10 : 4, color: 0x14060a, color2: 0x050203, speed: [0.5, 2], life: [0.6, 1.1], size: [0.8, 1.6], up: 2.5, rad: 0.8, a: 0.6 });
  FX.ring(h.x, h.z, { r0: 0.5, r1: big ? 4 : 2.6, color: col, life: 0.4, tex: 'shock' });
}

/* ================= Carlotta ================= */
// moldable crystals: up to 5 sit in an enemy for 6 s; small ice shards circle him, one for each
function carCry(h, t, n) {
  if (!t.alive || t.struct) return null; let b = null;
  for (let i = 0; i < n; i++) b = addBuff(t, { id: 'cry' + h.id, dur: 6, stackTo: 5, src: h });
  if (b && FX.near(t.x, t.z, 55)) {
    const g = new THREE.Group(), cnt = b.stacks || 1;
    for (let i = 0; i < cnt; i++) { const m = new THREE.Mesh(FX.geo.shard, new THREE.MeshBasicMaterial({ color: 0xcff4ff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })); m.userData.own = true; m.scale.setScalar(0.3); g.add(m); }
    b.fx = FX.add(g, 6, (k, me, dt, en) => {
      if (!t.alive) { en.dead = true; return; } const T = en.t;
      me.position.set(t.x, 0, t.z); me.children.forEach((m, i) => { const a = T * 2.2 + i / cnt * TAU; m.position.set(Math.sin(a) * (t.radius + 0.55), 1.0 + Math.sin(T * 3 + i) * 0.15, Math.cos(a) * (t.radius + 0.55)); m.rotation.set(-HPI + 0.3, a + HPI, 0); m.material.opacity = 0.9 * Math.min(1, (6 - T) / 0.4); });
    });
  }
  return b;
}
// ice spires breaking out of the ground: a cone of pale crystal with a brighter core, growing fast and melting away
let _carSpike = null;
function carSpikes(x, z, n, R, life, big) {
  if (!FX.near(x, z, 60)) return; if (!_carSpike) _carSpike = new THREE.ConeGeometry(0.34, 2.2, 5).translate(0, 1.1, 0);
  for (let i = 0; i < n; i++) {
    const a = rand(TAU), d = R * Math.sqrt(Math.random()), px = x + Math.sin(a) * d, pz = z + Math.cos(a) * d, g = new THREE.Group(), s = (big ? 1.5 : 0.8) * rand(0.7, 1.25), at = rand(0.12);
    const o = new THREE.Mesh(_carSpike, new THREE.MeshBasicMaterial({ color: 0x9fdcff, transparent: true, opacity: 0.55, depthWrite: false })), c = new THREE.Mesh(_carSpike, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
    o.userData.own = c.userData.own = true; c.scale.set(0.45, 0.9, 0.45); g.add(o, c); g.position.set(px, 0, pz); g.rotation.set(rand(-0.35, 0.35), rand(TAU), rand(-0.35, 0.35));
    FX.add(g, life, (k, me, dt, en) => { const q = easeOut(clamp((en.t - at) / 0.12, 0, 1)), out = Math.min(1, (life - en.t) / 0.25); me.scale.set(s * (0.6 + 0.4 * q), Math.max(0.001, s * q), s * (0.6 + 0.4 * q)); o.material.opacity = 0.55 * out; c.material.opacity = 0.8 * out; });
  }
}
function carBurst(x, z, n) {
  carSpikes(x, z, 2 + n, 1.2, 0.6, false);
  if (!FX.near(x, z, 55)) return;
  FX.debris(x, 1.2, z, { glow: true, n: 6 + n * 2, color: 0xcff6ff, speed: [2, 6], up: 6, size: [0.1, 0.26], life: 0.6 }); FX.sparks(x, 1.2, z, { n: 8 + n * 2, color: 0xffffff, color2: CAR.c, speed: [4, 10], life: [0.15, 0.35], w: 0.08 });
  FX.ring(x, z, { r0: 0.3, r1: 1.6 + n * 0.3, color: CAR.c, life: 0.35, tex: 'crack' }); FX.glow(x, 1.2, z, 2.4, CAR.c, 0.2, 'star');
}
/* the screen breaking like glass: cracks run out from the point of impact, then the pane falls apart into shards that tumble away.
   Drawn on its own canvas over the scene and under the HUD */
const GLASS = {
  cv: null, run: false, sh: [], rays: [], cx: 0, cy: 0, t0: 0,
  shatter(sx, sy) {
    if (!GFX.flash) return;
    if (!this.cv) { this.cv = document.createElement('canvas'); this.cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none'; const ov = $('ov'); if (ov) ov.insertAdjacentElement('afterend', this.cv); else document.body.appendChild(this.cv); }
    const W = this.cv.width = innerWidth, H = this.cv.height = innerHeight, N = 18, R = [0, 40, 95, 170, 270, 400, 570, 800, Math.hypot(W, H)];
    this.cx = sx; this.cy = sy; this.rays = [];
    for (let i = 0; i < N; i++) { const a0 = i / N * TAU + rand(-0.12, 0.12), pts = R.map((r, j) => { const a = a0 + (j ? rand(-0.09, 0.09) : 0); return [sx + Math.cos(a) * r, sy + Math.sin(a) * r]; }); this.rays.push(pts); }
    this.sh = [];
    for (let i = 0; i < N; i++) for (let j = 0; j < R.length - 1; j++) {
      const A = this.rays[i], B = this.rays[(i + 1) % N], poly = [A[j], A[j + 1], B[j + 1], B[j]], c = poly.reduce((s, p) => [s[0] + p[0] / 4, s[1] + p[1] / 4], [0, 0]), out = Math.atan2(c[1] - sy, c[0] - sx);
      this.sh.push({ poly: poly.map(p => [p[0] - c[0], p[1] - c[1]]), x: c[0], y: c[1], vx: Math.cos(out) * rand(120, 420) * (1 + j * 0.15), vy: Math.sin(out) * rand(120, 420) - rand(60, 260), r: 0, vr: rand(-4, 4), at: 0.14 + j * 0.035 + rand(0.04), tint: rand(0.08, 0.22), glint: Math.random() < 0.3 });
    }
    this.t0 = performance.now(); if (!this.run) { this.run = true; requestAnimationFrame(() => this.draw()); }
  },
  draw() {
    const g = this.cv.getContext('2d'), W = this.cv.width, H = this.cv.height, t = (performance.now() - this.t0) / 1000;
    g.clearRect(0, 0, W, H);
    if (t > 1.5) { this.run = false; return; }
    // the flash and the cracks running out
    if (t < 0.12) { g.fillStyle = 'rgba(220,245,255,' + (0.35 * (1 - t / 0.12)) + ')'; g.fillRect(0, 0, W, H); }
    if (t < 0.22) {
      const reach = Math.min(1, t / 0.1); g.lineCap = 'round';
      for (const pass of [[6, 'rgba(143,224,255,.35)'], [1.6, 'rgba(255,255,255,.95)']]) {
        g.lineWidth = pass[0]; g.strokeStyle = pass[1]; g.beginPath();
        for (const ray of this.rays) { const n = Math.max(2, Math.ceil(ray.length * reach)); g.moveTo(ray[0][0], ray[0][1]); for (let j = 1; j < n; j++) g.lineTo(ray[j][0], ray[j][1]); }
        for (let j = 1; j < 7; j++) { if (j / 7 > reach) break; g.moveTo(this.rays[0][j][0], this.rays[0][j][1]); for (let i = 1; i <= this.rays.length; i++) { const p = this.rays[i % this.rays.length][j]; g.lineTo(p[0], p[1]); } }
        g.stroke();
      }
    }
    // the shards: each piece of the pane falls and turns away, edged in light, a little bright glass in it
    if (t > 0.1) for (const s of this.sh) {
      const e = Math.max(0, t - s.at), al = t < s.at ? 1 : Math.max(0, 1 - e / 0.95); if (al <= 0) continue;
      const x = s.x + s.vx * e, y = s.y + s.vy * e + 900 * e * e, r = s.vr * e, sc = 1 - e * 0.35;
      g.save(); g.translate(x, y); g.rotate(r); g.scale(sc, sc); g.beginPath(); s.poly.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath();
      const gr = g.createLinearGradient(-60, -60, 60, 60); gr.addColorStop(0, 'rgba(230,250,255,' + (s.tint * 1.6 * al) + ')'); gr.addColorStop(0.5, 'rgba(150,220,255,' + (s.tint * 0.5 * al) + ')'); gr.addColorStop(1, 'rgba(255,255,255,' + (s.tint * 1.2 * al) + ')');
      g.fillStyle = gr; g.fill(); g.lineWidth = 1.4; g.strokeStyle = 'rgba(255,255,255,' + (0.85 * al) + ')'; g.stroke();
      if (s.glint) { g.strokeStyle = 'rgba(255,255,255,' + (0.6 * al) + ')'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(s.poly[0][0] * 0.6, s.poly[0][1] * 0.6); g.lineTo(s.poly[2][0] * 0.6, s.poly[2][1] * 0.6); g.stroke(); }
      g.restore();
    }
    requestAnimationFrame(() => this.draw());
  }
};

HEROES.push(
  /* ================= 44. Frieren ================= */
  {
    id: 'frieren', name: 'Фрирен', title: 'Провожающая в последний путь', role: 'mage', roleName: 'Маг', build: 'mage', bars: [4, 2, 3, 2], diffc: 2, projMesh: 'bolt', atkSfx: 'cast',
    lore: 'Тысячу лет она живёт на свете и половину из них собирает заклинания — как другие собирают ракушки. Победу над Королём демонов она помнит хуже, чем то, как друзья смеялись у костра. Её сила спрятана так глубоко, что враги принимают её за ученицу, — до первого Зольтраака.',
    look: { bulk: 0.84, h: 0.92, scale: 0.98, c1: 0xf2efe8, c2: 0x1c1a24, c3: 0x5a3e2a, cuff: 0xd8b04a, skin: 0xf6e2d6, hands: 0xf6e2d6, metal: 0xd8b04a, glow: 0x9fe6ff, head: 'frieren', hair: 0xe6e8ee, chest: 'elf', sh: 'none', weapon: 'elfstaff', wc: 'staff' },
    stats: ST(545, 76, 480, 52, 46, 2.4, 19, 2.2, 0.7, 8.7, 9.6),
    innate: { name: 'Подавление маны', icon: 'frinn', desc: 'Фрирен прячет свою ману. Если она 6 сек не применяла умений, следующее наносит на 25% больше урона (или лечит на 25% сильнее), и скрытая мана вспыхивает вокруг неё.' },
    tick(h, dt) {
      // while the mana is hidden and ready, a few motes of it slip out
      if (h.alive && G.time - (h.frLast === undefined ? -99 : h.frLast) >= 6 && Math.random() < dt * 2.5 && FX.near(h.x, h.z, 45)) FX.sparks(h.x + rand(-0.6, 0.6), 0.4, h.z + rand(-0.6, 0.6), { n: 1, color: 0xffffff, color2: FRI.c, speed: [0.2, 0.6], life: [0.6, 1], up: 2.5, grav: 0, drag: 1, w: 0.06, stretch: 0.04 });
    },
    abilities: [
      {
        key: 'Q', name: 'Зольтраак', icon: 'frzolt', cd: 7, cost: 60, range: 14, noReach: true, ind: { type: 'line', w: 2.2, len: 14, fixed: true }, anim: 'zolt', animDur: 0.6, lock: 0.3, ai: { t: 'shot', sp: 70, farm: true },
        desc: 'Самое обычное убивающее заклинание — и потому отточенное до совершенства. Через 0.2 сек перед посохом раскрывается магический круг, и из него бьёт луч на 14: магический урон всем на пути.',
        cast(h, p) {
          const dir = p.dir, k = frSup(h), dmg = D(h, 82, 15, 0, 0.7) * k, L = 14, sx = Math.sin(dir), cz = Math.cos(dir), x0 = h.x + sx * 1.3, z0 = h.z + cz * 1.3;
          frCircle(x0, 1.6, z0, dir, 1.0, FRI.c, 0.5, { spin: 3 }); SFX.at('cast', h.x, h.z, 0.7); FX.implode(x0, 1.6, z0, 1.6, { n: 8, color: 0xffffff, color2: FRI.c, life: 0.18, streak: true });
          after(0.2, () => {
            if (!h.alive) return;
            for (const e of stripHits(h, x0, z0, dir, L, 1.1)) { damage(h, e, dmg, 1); FX.hit(e.x, 1.4, e.z, FRI.c, e.kind === 'hero'); }
            frZolt(x0, 1.6, z0, x0 + sx * L, 1.3, z0 + cz * L, k); SFX.at('laser', h.x, h.z, 0.9); SFX.at('zap', h.x, h.z, 0.4); FX.shake(0.15);
          });
        }
      },
      {
        key: 'W', name: 'Поле цветов', icon: 'frbloom', cd: 15, cost: 80, range: 9, ind: { type: 'circle', r: 4.5 }, anim: 'bloom', animDur: 0.6, lock: 0.3, ai: { t: 'sanct' },
        desc: 'Любимое заклинание Фрирен — «совершенно бесполезное», как она сама говорит. На 5 сек в круге радиусом 4.5 распускается поле цветов: союзники в нём восстанавливают здоровье и бегают на 15% быстрее, а враги вязнут в стеблях — замедление на 20%.',
        cast(h, p) {
          const x = p.x, z = p.z, R = 4.5, DUR = 5, k = frSup(h), per = D(h, 95, 20, 0, 0.55) * k / 10;
          frField(x, z, R, DUR); SFX.at('heal', x, z, 0.7); SFX.at('cleanse', x, z, 0.5);
          zone(h, { x, z, r: R, dur: DUR, every: 0.5, tick: () => {
            for (const a of alliesIn(h, x, z, R, true)) { heal(h, a, per, true); addBuff(a, { id: 'frflow', dur: 0.6, ms: 0.15, src: h }); if (FX.near(a.x, a.z, 45)) FX.burst(a.x, 0.8, a.z, { n: 2, color: 0xd8ffd0, color2: FRI.leaf, speed: [0.1, 0.5], life: [0.5, 0.9], size: [0.28, 0.04], up: 2, rad: 0.6 }); }
            for (const e of enemiesIn(h, x, z, R)) slow(h, e, 0.2, 0.6, 'frstem');
            if (FX.near(x, z, 50)) FX.burst(x, 0.3, z, { n: 3, color: 0xffffff, color2: 0xffb8d8, speed: [0.3, 1.2], life: [0.8, 1.4], size: [0.24, 0.06], up: 1.5, rad: R * 0.8, drag: 1, grav: -0.6 });
          } });
        }
      },
      {
        key: 'E', name: 'Защитная магия', icon: 'frbarrier', cd: 13, cost: 70, range: 0, ind: { type: 'self', r: 5 }, anim: 'barrier', animDur: 0.45, lock: 0.1, ai: { t: 'shield' }, noCue: true,
        desc: 'Вокруг Фрирен смыкается купол из шестигранников — щит на 3 сек. Союзные герои в радиусе 5 получают щит вдвое слабее. Если купол Фрирен пробьют, он рассыпается осколками света.',
        cast(h) {
          const k = frSup(h), sh = D(h, 92, 26, 0, 0.6) * k, b = shield(h, h, sh, 3, FRI.c);
          if (b) { if (b.fx) b.fx.dead = true; b.fx = frDome(h, 3); b.onEnd = u => { if (b.shield <= 0) frDomeBreak(u); }; }
          for (const a of alliesIn(h, h.x, h.z, 5, true)) if (a !== h) { shield(h, a, sh * 0.5, 3, FRI.c); if (FX.near(a.x, a.z, 45)) FX.beam(h.x, h.z, a.x, a.z, { color: FRI.c, w: 0.18, life: 0.35, y: 1.4 }); }
          SFX.at('shield', h.x, h.z, 0.9); FX.ring(h.x, h.z, { r0: 0.4, r1: 5, color: FRI.c, life: 0.4, tex: 'ringThin' });
        }
      },
      {
        key: 'R', name: 'Залп Зольтраака', icon: 'frvolley', cd: 85, cost: 130, range: 13, ind: { type: 'circle', r: 6 }, anim: 'volley', animDur: 2.5, lock: 2.3, ai: { t: 'point', rad: 6, delay: 1.0, ult: true, hp: 0.6 },
        desc: 'Фрирен поднимает посох — и над полем раскрываются семь магических кругов. 1.6 сек они бьют лучами Зольтраака по кругу радиусом 6: 21 луч, и каждый наносит магический урон всем рядом с местом попадания. Пока длится залп, Фрирен стоит на месте.',
        cast(h, p) {
          const x = p.x, z = p.z, R = 6, k = frSup(h), dmg = D(h, 56, 11, 0, 0.32) * k, f = angTo(h.x, h.z, x, z), sx = Math.sin(f), cz = Math.cos(f), CIR = [];
          telegraph(h, x, z, R, 2.4, FRI.c); SFX.at('ultcue', h.x, h.z, 0.5); SFX.at('cast', h.x, h.z, 0.8);
          // the circles open one by one in an arc behind and above her, tilted down toward the target
          for (let i = 0; i < 7; i++) {
            const lat = (i - 3) * 2.6, back = 1.8 + Math.abs(i - 3) * 0.45, cx = h.x - sx * back + cz * lat, cy = 5.6 - Math.abs(i - 3) * 0.5 + (i % 2) * 0.5, czz = h.z - cz * back - sx * lat, face = angTo(cx, czz, x, z);
            CIR.push({ x: cx, y: cy, z: czz });
            after(i * 0.08, () => { if (!h.alive) return; frCircle(cx, cy, czz, face, 1.6, FRI.c, 2.5 - i * 0.08, { pitch: 0.55, spin: 2.6, op: 0.7 }); FX.sparks(cx, cy, czz, { n: 5, color: 0xffffff, color2: FRI.c, speed: [1, 3], life: [0.3, 0.5], w: 0.06 }); SFX.at('zap', cx, czz, 0.25); });
          }
          FX.implode(h.x, 2.6, h.z, 3, { n: 14, color: FRI.pale, color2: FRI.c, life: 0.6, streak: true }); FX.light(h.x, 4, h.z, FRI.c, 0.8, 18, 2.4);
          for (let j = 0; j < 21; j++) after(0.75 + j * 0.077, () => {
            if (!h.alive) return; const c = CIR[j % 7], foes = enemiesIn(h, x, z, R, true); let tx, tz;
            if (foes.length && Math.random() < 0.5) { const e = foes[Math.floor(Math.random() * foes.length)]; tx = e.x + rand(-0.6, 0.6); tz = e.z + rand(-0.6, 0.6); } else { const a = rand(TAU), d = R * Math.sqrt(Math.random()); tx = x + Math.sin(a) * d; tz = z + Math.cos(a) * d; }
            r3Ray(c.x, c.y, c.z, tx, 0.2, tz, { color: FRI.c, w: 0.8, life: 0.28, grow: true, core: 0.4 }); FX.glow(c.x, c.y, c.z, 2, FRI.deep, 0.14, 'star');
            for (const e of enemiesIn(h, tx, tz, 1.7)) { damage(h, e, dmg, 1); FX.hit(e.x, 1.3, e.z, FRI.c, false); }
            if (FX.near(tx, tz, 55)) { FX.ring(tx, tz, { r0: 0.3, r1: 1.9, color: FRI.c, life: 0.3, tex: 'shock' }); FX.glow(tx, 0.6, tz, 1.8, FRI.c, 0.16, 'star'); FX.sparks(tx, 0.4, tz, { n: 6, color: 0xffffff, color2: FRI.c, speed: [3, 8], life: [0.15, 0.35], up: 4, w: 0.07 }); if (j % 4 === 0) FX.scorch(tx, tz, 0.9, FRI.c, 4); }
            SFX.at(j % 3 ? 'zap' : 'laser', tx, tz, 0.45); if (j % 5 === 0) FX.shake(0.18);
          });
        }
      }
    ]
  },
  /* ================= 45. Lelouch ================= */
  {
    id: 'lelouch', name: 'Лелуш', title: 'Король-изгнанник', role: 'support', roleName: 'Поддержка', build: 'support', bars: [2, 2, 5, 2], diffc: 3, projMesh: 'blade', atkSfx: 'cast',
    lore: 'Отвергнутый принц, который поклялся разрушить империю отца — и для этого надел маску Зеро. Он не сильнее никого на поле: он просто думает на десять ходов вперёд. А когда планы кончаются, в его левом глазу загорается птица Гиаса, и один приказ меняет всю партию.',
    look: { bulk: 0.9, h: 1.04, scale: 1.05, c1: 0x1e1a30, c2: 0x3a2660, c3: 0x121018, cuff: 0xd8b04a, skin: 0xf2dcd0, hands: 0x1a1622, metal: 0xd8b04a, glow: 0xff2a48, head: 'lelouch', hair: 0x15141c, chest: 'zero', sh: 'cloth', cape: 0x14101c, weapon: 'king', wc: 'wand' },
    stats: ST(560, 80, 450, 48, 46, 2.4, 20, 2.4, 0.72, 8.9, 9.2),
    innate: { name: 'Всё по плану', icon: 'lelinn', desc: 'Враги, задетые умениями Лелуша, обречены на 4 сек: они получают на 8% больше урона от всех. Под ногами обречённого горит знак Гиаса.' },
    // the second of his attacks on a checked target: mate
    onDeal(h, t, d, o) {
      if (!o.basic || !t.alive) return; const b = t.buffs.find(q => q.id === 'lelcheck' + h.id && !q.dead); if (!b) return;
      if (++b.n < 2) { if (FX.near(t.x, t.z, 45)) FX.text(t.x, t.height + 1, t.z, 'шах', '#ffd0d8', 13); return; }
      b.dead = true; stun(h, t, 1); damage(h, t, b.mate, 1, { dot: true }); lelDoom(h, t);
      SFX.at('crit', t.x, t.z, 0.9); SFX.at('heavy', t.x, t.z, 0.6); FX.shake(0.3); if (h === G.player || t === G.player) FX.hitstop(0.06);
      if (FX.near(t.x, t.z, 50)) {
        FX.text(t.x, t.height + 1.4, t.z, 'МАТ', '#ff5a6a', 24); FX.ring(t.x, t.z, { r0: 3.4, r1: 0.4, color: 0xffffff, life: 0.4, tex: 'checker', op: 0.8 }); FX.ring(t.x, t.z, { r0: 0.4, r1: 3.6, color: LEL.c, life: 0.45, tex: 'shock' });
        FX.glow(t.x, 1.6, t.z, 4, LEL.c, 0.25, 'star'); FX.sparks(t.x, 1.4, t.z, { n: 14, color: 0xffd0d8, color2: LEL.c, speed: [4, 10], life: [0.2, 0.45], w: 0.1 });
        const m = chessMesh('queen', 0x1a1622, 0.9); m.position.set(t.x, 0, t.z); m.scale.setScalar(1.6); FX.add(m, 0.7, (k, me) => { me.rotation.z = Math.min(1, k * 3) * 1.3; me.material.opacity = 0.9 * (1 - k); });
      }
    },
    abilities: [
      {
        key: 'Q', name: 'Шах', icon: 'lelcheck', cd: 9, cost: 65, range: 9.5, ind: { type: 'target' }, anim: 'command', animDur: 0.5, lock: 0.25, ai: { t: 'target' },
        desc: 'Лелуш указывает на врага — и на него с неба падает огромный чёрный король: магический урон и замедление на 35% на 1.5 сек. Цели объявлен шах на 4 сек: если за это время Лелуш дважды ударит её атакой, это мат — оглушение на 1 сек и ещё магический урон.',
        cast(h, p) {
          const t = p.unit; if (!t || !t.alive) return false; const dmg = D(h, 72, 14, 0, 0.6), mate = D(h, 60, 14, 0, 0.5);
          SFX.at('whoosh', t.x, t.z, 0.8); lelFeathers(h.x, 2, h.z, 3);
          lelKingDrop(t, () => {
            if (!t.alive) return; damage(h, t, dmg, 1);
            if (!t.alive) return;
            slow(h, t, 0.35, 1.5, 'lelslow'); lelDoom(h, t); r3Tex();
            if (FX.near(t.x, t.z, 45)) FX.text(t.x, t.height + 1.2, t.z, 'ШАХ', '#ffc0cc', 17);
            // the check: two of his attacks on this target before it runs out, and it is mate
            const b = addBuff(t, { id: 'lelcheck' + h.id, dur: 4, src: h, n: 0, mate });
            if (b) b.fx = FX.aura(t, 0xffffff, 4, t.radius + 0.9, 'checker', 0.8);
          });
        }
      },
      {        key: 'W', name: 'Щит Зеро', icon: 'lelknight', cd: 12, cost: 70, range: 10, ind: { type: 'ally' }, anim: 'command', animDur: 0.4, lock: 0.15, ai: { t: 'shieldAlly' }, noCue: true,
        desc: 'Лелуш прикрывает союзного героя (или себя) плащом Зеро: сразу лечит его, даёт щит на 3.5 сек и +20% к скорости бега на 2 сек. Вокруг спасённого кружат чёрные перья.',
        cast(h, p) {
          const a = p.unit && p.unit.alive ? p.unit : h, sh = D(h, 70, 15, 0, 0.42) + a.maxHp * 0.04, hl = D(h, 55, 13, 0, 0.4);
          shield(h, a, sh, 3.5, LEL.vio); heal(h, a, hl); FX.heal(a, LEL.pale); addBuff(a, { id: 'lelrun', dur: 2, ms: 0.2, src: h });
          SFX.at('shield', a.x, a.z, 0.8); SFX.at('whoosh', a.x, a.z, 0.5); lelFeathers(a.x, 2.4, a.z, 10); r3Tex();
          if (a !== h) FX.beam(h.x, h.z, a.x, a.z, { color: LEL.vio, w: 0.2, life: 0.4, y: 1.4 });
          if (FX.near(a.x, a.z, 50)) { FX.zone(a.x, a.z, 2.2, LEL.c, 1.2, { tex: 'geass', spin: 2, op: 0.7, follow: a }); FX.ring(a.x, a.z, { r0: 0.4, r1: 2.8, color: LEL.vio, life: 0.4, tex: 'shock' }); FX.glow(a.x, 1.5, a.z, 3, LEL.vio, 0.25, 'star'); }
        }
      },
      {
        key: 'E', name: 'Рокировка', icon: 'lelcastle', cd: 18, cost: 70, range: 11, ind: { type: 'ally' }, anim: 'castle', animDur: 0.45, lock: 0.1, ai: { t: 'swap' },
        desc: 'Лелуш меняется местами с союзным героем. С того снимаются замедления и обездвиживание, и 1.5 сек он получает на 25% меньше урона. Спасти друга из окружения — и встать туда самому.',
        cast(h, p) {
          const a = p.unit; if (!a || !a.alive || a === h) { if (h === G.player) UI.msg('Укажите союзного героя'); return false; }
          const hx = h.x, hz = h.z, ax = a.x, az = a.z; r3Tex();
          a.dash = null; a.forced = null; if (a.recall > 0) cancelRecall(a);
          blink(h, ax, az); blink(a, hx, hz); h.order = null; if (a.order && a.order.type === 'move') a.order = null; a.path = null;
          for (const b of a.buffs) if (b.slow || b.root) b.dead = true;
          addBuff(a, { id: 'lelcastle', dur: 1.5, dmgIn: 0.75, src: h });
          if (h === G.player || a === G.player) G.camSnap = true;
          SFX.at('warp', hx, hz, 0.8); SFX.at('warp', ax, az, 0.8); SFX.at('whoosh', ax, az, 0.6);
          for (const [x0, z0, x1, z1] of [[hx, hz, ax, az], [ax, az, hx, hz]]) {
            if (FX.near(x0, z0, 55)) { FX.ring(x0, z0, { r0: 0.4, r1: 2.6, color: 0xffffff, life: 0.45, tex: 'checker', op: 0.7 }); FX.ring(x0, z0, { r0: 2.2, r1: 0.3, color: LEL.c, life: 0.3, tex: 'ringThin' }); const m = chessMesh('rook', LEL.vio, 0.55); m.position.set(x0, 0, z0); m.scale.setScalar(1.3); FX.add(m, 0.5, (k, me) => { me.material.opacity = 0.55 * (1 - k); me.position.y = k * 1.2; }); }
            const rib = FX.ribbon(LEL.c, 0.5, 14); for (let i = 0; i <= 8; i++) { const f = i / 8; after(f * 0.18, () => { rib.add(lerp(x0, x1, f), 1.2 + Math.sin(Math.PI * f) * 3, lerp(z0, z1, f)); if (i === 8) rib.end(); }); }
          }
          lelFeathers(h.x, 2, h.z, 5); lelFeathers(a.x, 2, a.z, 5); if (FX.near(h.x, h.z, 45)) FX.text(h.x, h.height + 1.2, h.z, 'РОКИРОВКА', '#d8c0ff', 16);
        }
      },
      {
        key: 'R', name: 'Гиас', icon: 'lelgeass', cd: 90, cost: 120, range: 8.5, ind: { type: 'target', hero: true }, anim: 'geass', animDur: 1.0, lock: 0.7, ai: { t: 'target', ult: true, hp: 0.95, rad: 7 },
        desc: '«Лелуш ви Британия повелевает тебе!» Птица Гиаса срывается из глаза Лелуша в глаза вражеского героя. На 2.5 / 3 / 3.5 сек тот подчиняется Лелушу: бьёт своих же союзников (тех, кого атакует Лелуш, или ближайших), обращает против них свои умения и атакует на 35% быстрее. Хозяин им не управляет, а союзники Лелуша могут бить подчинённого. Убийства подчинённого засчитываются Лелушу.',
        cast(h, p) {
          const t = p.unit; if (!t || !t.alive || t.kind !== 'hero') return false; const lv = Math.max(1, h.al[3]), dur = 2 + 0.5 * lv; r3Tex();
          h.geassCast = G.time + 0.95; SFX.at('ultcue', h.x, h.z, 0.6); SFX.at('dark', h.x, h.z, 0.5);
          if (FX.near(h.x, h.z, 50)) {   // the sigil opens over him like a seal
            const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.geass, color: LEL.c, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })), e0 = lelEyes(h);
            sp.position.set(e0.x, e0.y + 0.6, e0.z); FX.add(sp, 0.9, (k, me) => { const q = easeOut(Math.min(1, k * 3)); me.scale.set(3.6 * q, 3.6 * q, 1); me.material.opacity = k < 0.6 ? 1 : (1 - k) / 0.4; me.material.rotation = k * 0.8; });
            FX.text(h.x, h.height + 1.6, h.z, 'Повелеваю тебе…', '#ff8a9a', 15); FX.zone(h.x, h.z, 2.6, LEL.c, 1.0, { tex: 'geass', spin: -1.5, op: 0.8 });
          }
          after(0.55, () => {
            if (!h.alive || !t.alive) return; const A = lelEyes(h), B = lelEyes(t);
            r3Ray(A.x, A.y, A.z, B.x, B.y, B.z, { color: LEL.c, w: 0.28, life: 0.4, grow: true, core: 0.5 });
            if (FX.near(t.x, t.z, 60)) {   // the bird itself flies the beam
              const bird = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.geass, color: 0xff6a7a, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
              FX.add(bird, 0.16, k => { bird.position.set(lerp(A.x, B.x, k), lerp(A.y, B.y, k), lerp(A.z, B.z, k)); bird.scale.setScalar(1.6 - k); bird.material.opacity = 1; });
            }
            SFX.at('warp', t.x, t.z, 0.8);
            after(0.14, () => { if (t.alive) geassStart(h, t, dur); });
          });
        }
      }
    ]
  },
  /* ================= 46. Ichigo ================= */
  {
    id: 'ichigo', name: 'Ичиго', title: 'Синигами-заместитель', role: 'marks', roleName: 'Стрелок', build: 'marks', bars: [5, 3, 1, 4], diffc: 2, atkSfx: 'slash',
    lore: 'Обычный старшеклассник с рыжими волосами, которого все принимали за хулигана, однажды взял чужой меч, чтобы защитить семью. Теперь он синигами наполовину, пустой наполовину и упрям целиком. Его Зангецу бьёт волнами рейацу издалека, но драться Ичиго предпочитает в упор.',
    look: { bulk: 1.0, h: 1.03, scale: 1.05, c1: 0x141418, c2: 0x141418, c3: 0x7a1a1e, cuff: 0x141418, skin: 0xf0cfb4, hands: 0xf0cfb4, metal: 0xb8bcc4, glow: 0x8fd8ff, head: 'ichigo', hair: 0xff7a1e, chest: 'shihaku', legs: 'hakama', sh: 'none', weapon: 'zangetsu', wc: 'melee' },
    stats: ST(575, 78, 280, 32, 57, 3.3, 22, 2.4, 0.8, 9.0, 8.8, 0.024),
    shootAtk: ichShoot,
    tick(h, dt) {
      if (h.meleeT && (G.time > h.meleeT || !h.alive)) { h.meleeT = 0; h.range = h.def.stats.range; }
      if (h.alive && h.hollowT > G.time && Math.random() < dt * 9 && FX.near(h.x, h.z, 45)) {
        FX.burst(h.x + rand(-0.5, 0.5), 0.4, h.z + rand(-0.5, 0.5), { smoke: true, n: 1, color: 0x1a060a, color2: 0x050203, speed: [0.3, 1], life: [0.5, 0.9], size: [0.6, 1.3], up: 3, a: 0.55 });
        if (Math.random() < 0.5) FX.sparks(h.x + rand(-0.6, 0.6), 0.5, h.z + rand(-0.6, 0.6), { n: 1, color: 0xff6a6a, color2: ICH.red, speed: [0.3, 1], life: [0.4, 0.7], up: 4, grav: 0, drag: 1, w: 0.07, stretch: 0.05 });
      }
    },
    abilities: [
      {
        key: 'Q', name: 'Клинок к клинку', icon: 'ichblade', cd: 11, cost: 40, range: 0, ind: { type: 'self', r: 3 }, anim: 'cut', animDur: 0.35, lock: 0.05, ai: { t: 'buff' }, noCue: true,
        desc: 'Ичиго перестаёт бить волнами и идёт врукопашную: 6 сек он атакует Зангецу вблизи, на 45% быстрее и с прибавкой физического урона, а каждый удар рассекает и тех, кто стоит за целью (40% урона).',
        cast(h) {
          h.meleeT = G.time + 6; h.range = 2.9; h.atkCd = Math.min(h.atkCd, 0.1); const bonus = D(h, 22, 6, 0.3);
          const b = addBuff(h, { id: 'ichmelee', dur: 6, as: 0.45, onHit: (u, t) => {
            if (u.range >= 5) return 0; const f = angTo(u.x, u.z, t.x, t.z), hol = u.hollowT > G.time, col = hol ? ICH.red : ICH.c;
            for (const e of enemiesIn(u, t.x + Math.sin(f) * 1.7, t.z + Math.cos(f) * 1.7, 1.7)) if (e !== t) { damage(u, e, u.ad * 0.4, 0, { dot: true }); FX.hit(e.x, 1.2, e.z, col, false); }
            if (FX.near(t.x, t.z, 50)) { FX.slash(t.x + Math.sin(f) * 0.8, t.z + Math.cos(f) * 0.8, f, { r: 2.6, sweep: 1.6, color: col, life: 0.22, y: 1.2, flip: u.anim.alt }); FX.sparks(t.x, 1.3, t.z, { n: 6, color: 0xffffff, color2: col, speed: [4, 10], life: [0.1, 0.25], dir: f, spread: 0.9, w: 0.08 }); }
            return bonus;
          } });
          if (b) b.fx = FX.aura(h, ICH.c, 6, 1.5, 'ringThin', 5);
          ichFlare(h, false); SFX.at('whoosh', h.x, h.z, 0.8); SFX.at('slash', h.x, h.z, 0.5);
        }
      },
      {
        key: 'W', name: 'Сюмпо', icon: 'ichstep', cd: 9, cost: 35, range: 7, ind: { type: 'line', w: 1.2 }, lock: 0, ai: { t: 'gap', escape: true },
        desc: 'Мгновенный шаг: Ичиго исчезает и возникает в 7 от прежнего места, оставив позади послеобраз. Следующая атака в течение 2 сек наносит на 35% больше урона.',
        cast(h, p) {
          const x0 = h.x, z0 = h.z; dshGhost(h, ICH.c, 0.45, 0.45); blink(h, p.x, p.z); h.facing = p.dir;
          addBuff(h, { id: 'shunpo', dur: 2, onHit: (u, t, bf) => { if (bf.used) return 0; bf.used = true; bf.dead = true; if (FX.near(t.x, t.z, 45)) FX.glow(t.x, 1.4, t.z, 2.8, ICH.c, 0.2, 'star'); return u.ad * 0.35; } });
          SFX.at('dash', x0, z0, 0.8); SFX.at('warp', h.x, h.z, 0.4);
          if (FX.near(x0, z0, 55)) {
            FX.beam(x0, z0, h.x, h.z, { color: ICH.c, w: 0.5, life: 0.18, y: 1.1 }); FX.beam(x0, z0, h.x, h.z, { color: 0xffffff, w: 0.15, life: 0.12, y: 1.4 });
            for (const [x, z] of [[x0, z0], [h.x, h.z]]) { FX.ring(x, z, { r0: 0.3, r1: 2, color: ICH.c, life: 0.25, tex: 'shock' }); FX.burst(x, 0.3, z, { smoke: true, n: 4, color: 0x8a96a8, color2: 0x2a2e36, speed: [1, 3], life: [0.3, 0.6], size: [0.6, 1.2], up: 0.5, a: 0.35 }); }
          }
        }
      },
      {
        key: 'E', name: 'Гецуга Тэнсё', icon: 'ichgetsuga', cd: 16, cost: 90, range: 15, ind: { type: 'line', w: 2.6 }, anim: 'getsuga', animDur: 0.7, lock: 0.42, ai: { t: 'shot', sp: 34 },
        desc: 'Ичиго взмахивает Зангецу и отпускает рейацу огромным полумесяцем: волна летит на 15, прорезая всех на пути (большой физический урон), и оставляет в земле след. В форме пустого волна чёрная с красной каймой, шире и на 30% сильнее.',
        cast(h, p) {
          const dir = p.dir, hol = h.hollowT > G.time, dmg = D(h, 140, 28, 1.0) * (hol ? 1.3 : 1), W = hol ? 3.3 : 2.5, SP = 34, L = 15 + (h.castRange || 0), sx = Math.sin(dir), cz = Math.cos(dir), col = hol ? ICH.red : ICH.c;
          after(0.25, () => {
            if (!h.alive) return; const x0 = h.x + sx * 1.2, z0 = h.z + cz * 1.2, T = L / SP; let acc = 0;
            SFX.at('slash', h.x, h.z, 1); SFX.at('whoosh', h.x, h.z, 1); SFX.at(hol ? 'dark' : 'boom', h.x, h.z, 0.6); FX.shake(0.35);
            shot(h, { dir, x: x0, z: z0, speed: SP, range: 15, w: W * 0.55, color: col, mesh: false, ribbon: false, pierce: true, y: 1.2,
              trail: q => { if (++acc % 2 === 0 && FX.near(q.x, q.z, 55)) { FX.burst(q.x, 0.4, q.z, { n: 3, color: hol ? 0xff4a5a : 0xffffff, color2: col, speed: [0.5, 2.5], life: [0.25, 0.5], size: [0.45, 0.05], rad: W * 0.4 }); if (hol) FX.burst(q.x, 1, q.z, { smoke: true, n: 1, color: 0x14060a, color2: 0x050203, speed: [0.3, 1], life: [0.4, 0.7], size: [1, 1.8], a: 0.5 }); if (acc % 6 === 0) FX.scorch(q.x, q.z, W * 0.35, col, 5); } },
              onHit: e => { damage(h, e, dmg, 0); FX.hit(e.x, 1.3, e.z, col, true); SFX.at('crit', e.x, e.z, 0.6); if (e === G.player || h === G.player) FX.hitstop(0.04); },
              onEnd: (x, z) => { if (FX.near(x, z, 55)) { FX.ring(x, z, { r0: 0.5, r1: 3, color: col, life: 0.3, tex: 'shock' }); FX.sparks(x, 1.2, z, { n: 12, color: 0xffffff, color2: col, speed: [4, 10], life: [0.2, 0.4], dir, spread: 0.8, w: 0.1 }); } }
            });
            if (!FX.near(x0, z0, 70)) return;
            const g = ichCres(col, hol ? ICH.ink : 0xffffff, W * 1.25, hol); g.rotation.y = dir;
            FX.add(g, T, (k, me, dt, en) => { const d = Math.min(L, en.t * SP); me.position.set(x0 + sx * d, 1.2, z0 + cz * d); me.scale.setScalar(0.75 + 0.25 * easeOut(Math.min(1, en.t * 6))); for (const m of me.children) m.material.opacity = (m.userData.op0 === undefined ? (m.userData.op0 = m.material.opacity) : m.userData.op0) * (k > 0.85 ? (1 - k) / 0.15 : 1); });
            FX.warp('line', x0, 1.2, z0, { ang: dir, w: W * 1.6, len: L, str: 0.55, life: T + 0.2 });
            FX.glow(x0, 1.4, z0, 4.5, col, 0.25, 'flare'); FX.light(x0, 2, z0, col, 1.6, 16, 0.4);
          });
        }
      },
      {
        key: 'R', name: 'Форма пустого', icon: 'ichhollow', cd: 75, cost: 100, range: 0, ind: { type: 'self', r: 4 }, anim: 'hollow', animDur: 1.0, lock: 0.75, ai: { t: 'buff', ult: true },
        desc: 'Внутренний пустой вырывается наружу: на лице Ичиго нарастает белая маска с красными полосами и рогами. На 10 / 12 / 14 сек: +35% к урону атак, +30% к скорости атаки, +12% к скорости бега, атаки лечат на 15% нанесённого урона, волны чёрные и крупнее, а «Гецуга Тэнсё» сразу перезаряжается и бьёт на 30% сильнее.',
        cast(h) {
          const lv = Math.max(1, h.al[3]), dur = 8 + 2 * lv;
          SFX.at('ultcue', h.x, h.z, 0.5); SFX.at('dark', h.x, h.z, 0.8);
          if (FX.near(h.x, h.z, 50)) { FX.implode(h.x, 1.8, h.z, 4, { n: 20, color: 0xff6a6a, color2: 0x1a0204, life: 0.45, streak: true }); FX.burst(h.x, 1.2, h.z, { smoke: true, n: 10, color: 0x1a060a, color2: 0x050203, speed: [0.5, 1.5], life: [0.6, 1], size: [1, 2], rad: 2.4, a: 0.6 }); }
          after(0.5, () => {
            if (!h.alive) return; h.hollowT = G.time + dur; h.cd[2] = 0;
            const b = addBuff(h, { id: 'hollow', dur, ad: h.bAd * 0.35, as: 0.3, ms: 0.12, ls: 0.15, src: h, onEnd: u => { u.hollowT = 0; if (u.alive && FX.near(u.x, u.z, 50)) { FX.debris(u.x, u.height, u.z, { glow: true, n: 10, color: 0xf2efe6, speed: [2, 5], up: 5, size: [0.08, 0.2], life: 0.6 }); FX.sparks(u.x, u.height, u.z, { n: 8, color: 0xffffff, color2: ICH.red, speed: [2, 5], life: [0.2, 0.4], w: 0.06 }); SFX.at('shatter', u.x, u.z, 0.5); } } });
            if (b) b.fx = FX.aura(h, ICH.red, dur, 2.1, 'swirl', 3);
            SFX.at('bigboom', h.x, h.z, 0.7); SFX.at('heavy', h.x, h.z, 0.8); FX.shake(0.7); if (h === G.player) { FX.punch(1); FX.hitstop(0.08); }
            if (FX.near(h.x, h.z, 55)) {
              FX.pillar(h.x, h.z, { r: 2, h: 18, color: ICH.red, life: 0.7, op: 0.55 }); FX.ring(h.x, h.z, { r0: 0.5, r1: 6, color: ICH.red, life: 0.5, tex: 'shock' }); FX.shock(h.x, h.z, 7, 1.2, 0.45);
              FX.burst(h.x, 1, h.z, { smoke: true, n: 16, color: 0x1a060a, color2: 0x050203, speed: [2, 6], life: [0.6, 1.2], size: [1.2, 2.6], ring: true, a: 0.7 }); FX.sparks(h.x, 1.4, h.z, { n: 22, color: 0xffd0d0, color2: ICH.red, speed: [5, 14], life: [0.2, 0.5], w: 0.1 });
              FX.text(h.x, h.height + 1.5, h.z, 'ПУСТОЙ', '#ff5a6a', 22); FX.warp('lens', h.x, 1.6, h.z, { r: 5, str: 1.2, life: 0.4 });
            }
            ichFlare(h, true);
          });
        }
      }
    ]
  },
  /* ================= 47. Carlotta ================= */
  {
    id: 'carlotta', name: 'Карлотта', title: 'Ледяной финал', role: 'marks', roleName: 'Стрелок', build: 'marks', bars: [5, 2, 2, 3], diffc: 3, projMesh: 'shard', atkSfx: 'shoot',
    lore: 'Наследница старинного рода Монтелли выбирает выражения так же тщательно, как платья, — и стреляет так же изящно, как говорит. Её пули оставляют в противнике лепные кристаллы, а финальный выстрел разбивает мир вокруг, как стекло витрины. Искусство, по её словам, — это когда всё рассчитано заранее.',
    look: { bulk: 0.85, h: 0.95, scale: 1.0, c1: 0xd8506a, c2: 0x111016, c3: 0x111016, cuff: 0xf2f0f4, skin: 0xf4dccd, hands: 0x15141a, metal: 0xd8b45a, glow: 0x8fe0ff, head: 'carlotta', hair: 0xe8e4ea, tie: 0xd8506a, chest: 'carlo', legs: 'thigh', sh: 'none', weapon: 'crystalgun', wc: 'pistol', orbit: 3 },
    stats: ST(540, 74, 300, 35, 56, 3.1, 20, 2.2, 0.82, 8.8, 10.2, 0.026),
    innate: { name: 'Лепные кристаллы', icon: 'carinn', desc: 'Атаки Карлотты и её «Хроматический веер» оставляют во враге ледяной кристалл (до 5, на 6 сек) — они кружат вокруг цели. «Деконструкция» и «Смертельный финал» взрывают кристаллы.' },
    shootAtk(u, t) {
      homing(u, t, { speed: 42, color: CAR.c, size: 0.45, mesh: 'shard', y: u.height * 0.62, onHit: tt => { basicHit(u, tt); carCry(u, tt, 1); FX.hit(tt.x, tt.height * 0.55, tt.z, CAR.c, true); } });
      SFX.at('shoot', u.x, u.z, 0.55); SFX.at('ice', u.x, u.z, 0.15);
    },
    tick(h) { h.spinning = h.waltzT > G.time && h.alive; },
    abilities: [
      {
        key: 'Q', name: 'Хроматический веер', icon: 'carfan', cd: 7, cost: 45, range: 10, ind: { type: 'line', w: 2.4 }, anim: 'thrust', animDur: 0.45, lock: 0.25, ai: { t: 'shot', sp: 44, farm: true },
        desc: 'Три быстрых выстрела веером: каждая пуля летит на 10, наносит физический урон первому, в кого попадёт, и оставляет в нём кристалл.',
        cast(h, p) {
          const dir = p.dir, dmg = D(h, 48, 10, 0.55);
          [-1, 0, 1].forEach((k, i) => after(i * 0.06, () => {
            if (!h.alive) return; const d = dir + k * 0.16;
            shot(h, { dir: d, speed: 46, range: 10, w: 0.55, color: CAR.c, mesh: 'shard', size: 0.75, ribbon: 0.35, onHit: e => { damage(h, e, dmg, 0); carCry(h, e, 1); FX.hit(e.x, 1.3, e.z, CAR.c, e.kind === 'hero'); SFX.at('ice', e.x, e.z, 0.4); } });
            SFX.at('shoot', h.x, h.z, 0.7); if (FX.near(h.x, h.z, 50)) { FX.glow(h.x + Math.sin(d) * 1.2, 1.5, h.z + Math.cos(d) * 1.2, 2, CAR.c, 0.12, 'flare'); FX.sparks(h.x + Math.sin(d) * 1.2, 1.5, h.z + Math.cos(d) * 1.2, { n: 4, color: 0xffffff, color2: CAR.c, speed: [3, 7], life: [0.1, 0.2], dir: d, spread: 0.4, w: 0.06 }); }
          }));
        }
      },
      {
        key: 'W', name: 'Деконструкция', icon: 'carshatter', cd: 10, cost: 50, range: 0, ind: { type: 'self', r: 11 }, anim: 'snap', animDur: 0.45, lock: 0.15, ai: { t: 'shatter', r: 11 },
        desc: 'Щелчок пальцами — и кристаллы Карлотты во всех врагах в радиусе 11 взрываются изнутри ледяными шипами: физический урон за каждый кристалл и замедление на 30% на 1.5 сек. Если кристаллов ни в ком нет, умение не применяется.',
        cast(h) {
          const list = []; for (const u of G.units) if (u.alive && !u.struct) { const b = u.buffs.find(q => q.id === 'cry' + h.id); if (b && udist(h, u) < 11 + u.radius) list.push([u, b]); }
          if (!list.length) { if (h === G.player) UI.msg('Ни в ком нет кристаллов'); return false; }
          const per = D(h, 30, 7, 0.36); SFX.at('cast', h.x, h.z, 0.5);
          for (const [u, b] of list) {
            const n = b.stacks || 1; b.dead = true;
            if (FX.near(u.x, u.z, 55)) FX.beam(h.x, h.z, u.x, u.z, { color: CAR.c, w: 0.08, life: 0.15, y: 1.4 });
            after(0.12, () => { if (!u.alive) return; damage(h, u, per * n, 0); slow(h, u, 0.3, 1.5, 'carslow'); carBurst(u.x, u.z, n); SFX.at('shatter', u.x, u.z, 0.5 + n * 0.08); });
          }
        }
      },
      {
        key: 'E', name: 'Вальс', icon: 'carwaltz', cd: 12, cost: 40, range: 6, ind: { type: 'line', w: 1.2 }, lock: 0, ai: { t: 'escape', kite: true },
        desc: 'Карлотта уходит лёгким пируэтом (рывок на 6), а на выходе стреляет в ближайшего вражеского героя в радиусе 10: физический урон и сразу два кристалла.',
        cast(h, p) {
          const dmg = D(h, 60, 12, 0.6); h.waltzT = G.time + 0.3; SFX.at('dash', h.x, h.z, 0.7);
          dashTo(h, p.x, p.z, 26, { ribbon: CAR.pink, trail: u => { if (FX.near(u.x, u.z, 45) && Math.random() < 0.5) FX.sparks(u.x, 1.2, u.z, { n: 2, color: 0xffffff, color2: CAR.c, speed: [1, 3], life: [0.2, 0.4], w: 0.06 }); },
            onEnd: u => {
              u.waltzT = 0; let t = null, bd = 10; for (const e of G.heroes) if (e.alive && hostile(u, e)) { const d = udist(u, e); if (d < bd) { bd = d; t = e; } }
              if (FX.near(u.x, u.z, 45)) { FX.ring(u.x, u.z, { r0: 0.3, r1: 2.2, color: CAR.pink, life: 0.3, tex: 'ringThin' }); FX.burst(u.x, 1.2, u.z, { n: 8, color: 0xffd0e0, color2: CAR.pink, speed: [0.5, 2], life: [0.4, 0.8], size: [0.25, 0.04], up: 1.5, rad: 0.8 }); }
              if (!t) return; u.facing = angTo(u.x, u.z, t.x, t.z); u.anim.atkT = u.anim.atkDur = 0.3;
              homing(u, t, { speed: 46, color: CAR.c, size: 0.6, mesh: 'shard', y: 1.5, onHit: tt => { damage(u, tt, dmg, 0); carCry(u, tt, 2); FX.hit(tt.x, 1.3, tt.z, CAR.c, true); } }); SFX.at('shoot', u.x, u.z, 0.8);
            } });
        }
      },
      {
        key: 'R', name: 'Смертельный финал', icon: 'carfinale', cd: 80, cost: 110, range: 12, ind: { type: 'circle', r: 6 }, anim: 'finale', animDur: 1.15, lock: 0.9, ai: { t: 'point', rad: 6, delay: 1.0, ult: true, hp: 0.6 },
        desc: 'Карлотта поднимает пистолет к лицу, собирает в пулю весь холод — и стреляет. В месте попадания вырастает лес ледяных шпилей, а через мгновение мир вокруг трескается и разлетается, как стекло: огромный физический урон всем врагам в радиусе 6 (+12% за каждый кристалл в цели, кристаллы взрываются) и замедление на 40% на 2 сек.',
        cast(h, p) {
          const x = p.x, z = p.z, R = 6, dmg = D(h, 240, 46, 1.5);
          telegraph(h, x, z, R, 1.3, CAR.c); SFX.at('ultcue', h.x, h.z, 0.5); SFX.at('ice', h.x, h.z, 0.6);
          if (FX.near(h.x, h.z, 50)) { FX.implode(h.x, 1.8, h.z, 3.5, { n: 22, color: 0xffffff, color2: CAR.c, life: 0.55, streak: true }); FX.glow(h.x, 2.1, h.z, 2.6, CAR.c, 0.6, 'star'); FX.light(h.x, 2.5, h.z, CAR.c, 1.2, 12, 0.7); }
          after(0.62, () => {
            if (!h.alive) return; const x0 = h.x + Math.sin(h.facing) * 1.2, z0 = h.z + Math.cos(h.facing) * 1.2, T = 0.18;
            SFX.at('shoot', h.x, h.z, 1); SFX.at('laser', h.x, h.z, 0.6); FX.shake(0.3);
            if (FX.near(x0, z0, 60)) {
              const m = FX.projMesh('shard', CAR.c, 2.2), rib = FX.ribbon(CAR.c, 1.1, 14); m.rotation.y = angTo(x0, z0, x, z);
              FX.add(new THREE.Group(), T, k => { m.position.set(lerp(x0, x, k), lerp(1.5, 1.0, k), lerp(z0, z, k)); rib.add(m.position.x, m.position.y, m.position.z); });
              after(T, () => { FX.killMesh(m); rib.end(); });
              FX.glow(x0, 1.5, z0, 4, CAR.c, 0.2, 'flare');
            }
            after(T, () => {
              // the bloom: a ring of ice spires breaks out of the ground, frost crawls over it
              carSpikes(x, z, 14, R * 0.85, 0.75, true); SFX.at('ice', x, z, 1); SFX.at('rubble', x, z, 0.5);
              if (FX.near(x, z, 60)) { FX.ring(x, z, { r0: 0.5, r1: R, color: CAR.c, life: 0.6, tex: 'crack' }); FX.zone(x, z, R, CAR.c, 0.7, { tex: 'rune2', spin: 0.8, op: 0.6 }); FX.light(x, 3, z, CAR.c, 1.4, 20, 0.6); FX.glow(x, 1.5, z, 6, CAR.c, 0.3, 'star'); }
              after(0.38, () => {
                // and it all breaks like glass
                for (const e of enemiesIn(h, x, z, R)) { const b = e.buffs.find(q => q.id === 'cry' + h.id), n = b ? (b.stacks || 1) : 0; if (b) b.dead = true; damage(h, e, dmg * (1 + 0.12 * n), 0); if (e.alive) slow(h, e, 0.4, 2, 'carslow'); FX.hit(e.x, 1.3, e.z, CAR.c, true); if (n) carBurst(e.x, e.z, n); }
                SFX.at('shatter', x, z, 1); SFX.at('bigboom', x, z, 0.8); after(0.06, () => SFX.at('shatter', x, z, 0.9)); FX.shake(1.0); FX.hitstop(0.1);
                if (FX.near(x, z, 60)) {
                  FX.debris(x, 1.5, z, { glow: true, n: 40, color: 0xdff8ff, speed: [4, 13], up: 10, size: [0.15, 0.45], rad: R * 0.6, life: 1.1 });
                  FX.sparks(x, 1.2, z, { n: 36, color: 0xffffff, color2: CAR.c, speed: [6, 18], life: [0.2, 0.5], w: 0.1, rad: R * 0.4 });
                  for (let i = 0; i < 3; i++) after(i * 0.07, () => FX.ring(x, z, { r0: 0.5 + i, r1: R + 1.5 + i * 1.2, color: i % 2 ? 0xffffff : CAR.c, life: 0.45, tex: i ? 'ringThin' : 'shock' }));
                  FX.explosion(x, z, 2.4, CAR.c, { el: 'ice', color2: CAR.deep }); FX.warp('ring', x, 0.3, z, { r0: 1, r1: R * 1.6, str: 1.4, life: 0.5 }); FX.punch(1);
                  const sp = UI.proj(x, 1.2, z); if (sp && FX.near(x, z, 34)) GLASS.shatter(sp.x, sp.y);
                }
              });
            });
          });
        }
      }
    ]
  }
);
