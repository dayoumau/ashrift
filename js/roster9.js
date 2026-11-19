'use strict';
/* ===== roster, part 32 (hero 59): Nereya, mistress of the tides — a jet of water under pressure, a bubble that holds a foe (or shields a friend),
   a wave she rides, and a maelstrom that ends in a geyser. Her water is one shader (flowing noise, caustics, foam, a bright rim) used on
   every water shape: the jet, the bubble, the wave, the whirlpool, the geyser, the orb on her staff and the hoop around her.
   Loaded after roster8.js: the glyphs are added to GLYPH at the end ===== */
const NER = { c: 0x3ad0ff, deep: 0x0a3a6a, light: 0x8fe8ff, foam: 0xe8fbff, drop: 0x9fe8ff };
const NER_VS = 'varying vec2 vU; varying vec3 vN; varying vec3 vV; void main(){ vU=uv; vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }';
// a body of moving water: two layers of noise flowing along v, caustic light where they meet, foam on the brightest crests (and along the top edge when uC > 0), a pale rim
const NER_FS = 'uniform float uT, uA, uF, uC; uniform vec2 uS; uniform sampler2D uNz; varying vec2 vU; varying vec3 vN; varying vec3 vV;' +
  'void main(){ float f=1.-abs(dot(normalize(vN),normalize(vV))); vec2 p=vU*uS;' +
  ' float n=texture2D(uNz,p*.35+vec2(uT*.05,-uT*uF)).r, n2=texture2D(uNz,p*.9+vec2(-uT*.08,-uT*uF*1.7)).r;' +
  ' float caus=pow(smoothstep(.42,.95,n*n2*2.2),1.5), foam=smoothstep(.62,.82,n2)*.55+smoothstep(.8,1.,vU.y)*uC*(.6+.4*n);' +
  ' vec3 c=mix(vec3(.02,.15,.32),vec3(.1,.58,.88),n)+vec3(.75,.95,1.)*(caus*.9+foam)+vec3(.55,.9,1.)*pow(f,2.)*1.1;' +
  ' gl_FragColor=vec4(c,uA*clamp(.45+.3*n+.5*pow(f,2.)+caus*.4+foam*.6,0.,1.)); }';
// the whirlpool: a spiral of foam arms turning into a dark eye, foam along the rim
const NER_FS_POOL = 'uniform float uT, uA, uF; uniform sampler2D uNz; varying vec2 vU;' +
  'void main(){ vec2 q=vU*2.-1.; float r=length(q); if(r>1.) discard; float a=atan(q.y,q.x), sw=a+uT*uF+(1.-r)*6.;' +
  ' float arm=pow(.5+.5*cos(sw*4.),3.), n=texture2D(uNz,vec2(sw*.16,r*.9-uT*.25)).r;' +
  ' float foam=smoothstep(.5,.85,arm*n*1.7)+smoothstep(.07,0.,abs(r-.93))*.9;' +
  ' vec3 c=mix(vec3(.01,.05,.12),vec3(.08,.45,.75),smoothstep(.05,1.,r))*(.6+.6*n)+vec3(.8,.97,1.)*foam; float eye=smoothstep(0.,.28,r);' +
  ' gl_FragColor=vec4(mix(vec3(0.,.015,.04),c,eye),uA*mix(.94,0.,smoothstep(.93,1.,r))*(.8+.2*foam)); }';
let _nerWave = null, _nerCrown = null;
function nerMat(o) {
  o = o || {};
  return new THREE.ShaderMaterial({ uniforms: { uT: FXU.uT, uNz: FXU.uNz, uA: { value: o.a === undefined ? 1 : o.a }, uF: { value: o.f === undefined ? 0.4 : o.f }, uC: { value: o.c || 0 }, uS: { value: new THREE.Vector2(o.su || 2, o.sv || 2) } },
    vertexShader: NER_VS, fragmentShader: o.pool ? NER_FS_POOL : NER_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide });
}
// a wave seen from the side: a back slope rising to a crest that curls forward over itself; the ends taper away. Faces +z, 5.2 wide
function nerWaveGeo() {
  if (_nerWave) return _nerWave;
  const NU = 18, NV = 16, W = 5.2, pos = [], uv = [], idx = [];
  const prof = v => { if (v < 0.55) { const t = v / 0.55; return [-1.8 + t * 2.0, Math.pow(t, 1.4) * 2.5]; } const t = (v - 0.55) / 0.45, a = t * 2.6; return [0.2 + Math.sin(a) * 0.9, 2.5 - (1 - Math.cos(a)) * 0.9]; };
  for (let i = 0; i <= NU; i++) { const u = i / NU, x = (u - 0.5) * W, s = Math.pow(Math.sin(Math.PI * u), 0.6); for (let j = 0; j <= NV; j++) { const v = j / NV, [z, y] = prof(v); pos.push(x, y * s, z * (0.6 + 0.4 * s)); uv.push(u, v); } }
  for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) { const a = i * (NV + 1) + j, b = a + NV + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  return (_nerWave = g);
}
const nerCrownGeo = () => _nerCrown || (_nerCrown = new THREE.CylinderGeometry(1.5, 0.55, 1, 20, 1, true).translate(0, 0.5, 0));
const _nv = new THREE.Vector3(), _nd = new THREE.Vector3(), _nup = new THREE.Vector3(0, 1, 0);
// the tip of her staff (where the water comes from)
function nerOrb(h) { if (h.rig && h.rig.orb && h.rig.root.visible) { h.rig.orb.getWorldPosition(_nv); return { x: _nv.x, y: _nv.y, z: _nv.z }; } return { x: h.x + Math.sin(h.facing) * 0.6, y: 2.2, z: h.z + Math.cos(h.facing) * 0.6 }; }
// spray: droplets thrown out and falling, a puff of mist
function nerSplash(x, y, z, k, dir) {
  if (!FX.near(x, z, 55)) return; k = k || 1;
  FX.sparks(x, y, z, { n: Math.round(8 * k), color: 0xffffff, color2: NER.c, speed: [2, 6 * k], life: [0.3, 0.7], w: 0.09, up: 4 * k, grav: -18, dir, spread: dir === undefined ? undefined : 0.9 });
  FX.burst(x, y, z, { n: Math.round(5 * k), color: NER.foam, color2: NER.c, speed: [0.5, 2.5 * k], life: [0.3, 0.6], size: [0.35 * k, 0.05], up: 2, grav: -10 });
  FX.burst(x, y * 0.5, z, { smoke: true, n: Math.round(3 * k), color: 0xd8f4ff, color2: 0x6aa8c8, speed: [0.3, 1.2], life: [0.6, 1.1], size: [0.8 * k, 1.8 * k], up: 0.6, a: 0.25, drag: 1.5 });
}

/* ---------- the innate: soaked ---------- */
// soaked: 15% slower for 4 s, and her abilities hit soaked enemies 15% harder; water drips off them and a pale ring lies at their feet
function nerSoak(h, e) {
  if (!e.alive || e.struct) return; const b = addBuff(e, { id: 'soak', dur: 4, slow: 0.15, src: h }); if (!b) return; e.soakBy = h; e.soakT = G.time + 4;
  if (!FX.near(e.x, e.z, 50)) return; let acc = 0;
  const A = FX.add(new THREE.Group(), 4, (k, me, dt, en) => { if (!e.alive) { en.dead = true; return; } acc += dt; if (acc > 0.12) { acc = 0; FX.burst(e.x + rand(-0.35, 0.35), (e.height || 2) * rand(0.5, 0.95) + (e.yOff || 0), e.z + rand(-0.35, 0.35), { n: 1, color: NER.drop, color2: 0x2a7ab0, speed: [0, 0.2], life: [0.35, 0.6], size: [0.14, 0.05], grav: -14 }); } });
  const B = FX.aura(e, NER.c, 4, e.radius + 0.4, 'ringThin', 1);
  b.fx = { set dead(v) { A.dead = v; if (B) B.dead = v; } };
}
// is a unit on the line from h along dir, within reach R and half-width w
function nerInLine(h, e, dir, R, w) { const rx = e.x - h.x, rz = e.z - h.z, s = Math.sin(dir), c = Math.cos(dir), along = rx * s + rz * c; return along > -0.5 && along < R + e.radius && Math.abs(rx * c - rz * s) < w + e.radius; }
const nerAmp = (h, e, d) => (e.soakT > G.time && e.soakBy === h ? d * 1.15 : d);
function nerHit(h, e, d, type) { const r = damage(h, e, nerAmp(h, e, d), type === undefined ? 1 : type); nerSoak(h, e); return r; }

/* ---------- the jet ---------- */
// a beam of water from the staff to the end of its reach: an outer sheath and a bright fast core, spray where it ends
function nerJetFx(h, dir, R, T) {
  const g = new THREE.Group(), sh = new THREE.Mesh(FX.geo.cyl, nerMat({ f: 3.5, su: 1, sv: 6, a: 0.85 })), core = new THREE.Mesh(FX.geo.cyl, FX.mat('pillar', 0xdff8ff, 0.7));
  g.add(sh); g.add(core); let acc = 0;
  return FX.add(g, T, (k, me, dt, en) => {
    if (!h.alive || h.stunned) { en.dead = true; return; }
    const A = nerOrb(h), ex = h.x + Math.sin(dir) * R, ez = h.z + Math.cos(dir) * R, ey = 1.2;
    _nd.set(ex - A.x, ey - A.y, ez - A.z); const L = _nd.length(); _nd.multiplyScalar(1 / L);
    const on = Math.min(1, en.t / 0.08) * (k > 0.88 ? (1 - k) / 0.12 : 1), w = 0.32 * on * (1 + Math.sin(en.t * 40) * 0.08);
    me.position.set(A.x, A.y, A.z); me.quaternion.setFromUnitVectors(_nup, _nd);
    sh.scale.set(w, L * Math.min(1, en.t / 0.1), w); core.scale.set(w * 0.4, L * Math.min(1, en.t / 0.1), w * 0.4);
    acc += dt; if (acc > 0.05 && FX.near(ex, ez, 50)) { acc = 0; nerSplash(ex, ey, ez, 0.6); FX.glow(A.x, A.y, A.z, 1.6, NER.c, 0.1); }
  });
}

/* ---------- the bubble ---------- */
function nerBubbleMesh(r) { const m = new THREE.Mesh(FX.geo.sphere, nerMat({ f: 0.25, su: 3, sv: 3, a: 0.75 })); m.scale.setScalar(r); return m; }
// the bubble flies from the staff on an arc to the target, then closes round it
function nerBubbleFly(h, t, T, then) {
  const A = nerOrb(h), m = nerBubbleMesh(0.45);
  FX.add(m, T, (k, me) => { me.position.set(lerp(A.x, t.x, k), lerp(A.y, (t.height || 2) * 0.6 + (t.yOff || 0), k) + Math.sin(Math.PI * k) * 1.4, lerp(A.z, t.z, k)); me.scale.setScalar(0.45 + k * 0.4); });
  after(T, then);
}
// a bubble round a unit for dur: wobbling, rising with it if it is lifted, drops of light swirling inside; pops at the end
function nerBubbleOn(u, dur, r, lift) {
  const m = nerBubbleMesh(r);
  return FX.add(m, dur, (k, me, dt, en) => {
    if (!u.alive) { en.dead = true; return; } const t = en.t, q = Math.min(1, t / 0.15);
    me.position.set(u.x, (u.height || 2) * 0.55 + (u.yOff || 0), u.z); me.scale.set(r * q * (1 + Math.sin(t * 7) * 0.05), r * q * (1 + Math.cos(t * 6) * 0.06), r * q * (1 + Math.sin(t * 8 + 1) * 0.05));
    if (FX.near(u.x, u.z, 40) && Math.random() < dt * 14) { const a = rand(TAU); FX.glow(u.x + Math.sin(a) * r * 0.7, me.position.y + rand(-r, r) * 0.6, u.z + Math.cos(a) * r * 0.7, 0.6, 0xdff8ff, 0.25, 'star'); }
  });
}
function nerPop(x, y, z, r) {
  if (!FX.near(x, z, 55)) return;
  FX.ring(x, z, { r0: r * 0.5, r1: r * 2.2, color: NER.c, life: 0.4, tex: 'shock', y: Math.max(0.15, y - 1) }); FX.glow(x, y, z, r * 3, NER.light, 0.2, 'flare');
  FX.sparks(x, y, z, { n: 20, color: 0xffffff, color2: NER.c, speed: [4, 9], life: [0.3, 0.7], w: 0.1, up: 3, grav: -16 }); nerSplash(x, Math.max(0.5, y - 0.8), z, 1.3);
}

/* ---------- the wave ---------- */
function nerWaveFx(h, dir, T) {
  const m = new THREE.Mesh(nerWaveGeo(), nerMat({ f: -0.9, su: 3, sv: 2, c: 1, a: 0.92 })); let acc = 0;
  return FX.add(m, T, (k, me, dt, en) => {
    const g = Math.min(1, en.t / 0.12) * (k > 0.8 ? 1 - (k - 0.8) / 0.2 * 0.85 : 1);
    me.position.set(h.x - Math.sin(dir) * 0.6, 0, h.z - Math.cos(dir) * 0.6); me.rotation.y = dir; me.scale.set(0.8 + 0.2 * g, g * (1 + Math.sin(en.t * 9) * 0.04), 1);
    acc += dt; if (acc > 0.03 && FX.near(h.x, h.z, 50)) { acc = 0; const s = rand(-2.3, 2.3), cx = Math.cos(dir), cz = -Math.sin(dir), fx = h.x + Math.sin(dir) * 0.4 + cx * s, fz = h.z + Math.cos(dir) * 0.4 + cz * s;
      FX.burst(fx, 2.2 * g, fz, { n: 2, color: NER.foam, color2: NER.c, speed: [1, 3], life: [0.3, 0.6], size: [0.5, 0.08], up: 2.5, grav: -10, dir, spread: 0.6 });
      FX.burst(h.x - Math.sin(dir) * 1.5 + cx * s, 0.3, h.z - Math.cos(dir) * 1.5 + cz * s, { smoke: true, n: 1, color: 0xd8f4ff, color2: 0x6aa8c8, speed: [0.2, 0.8], life: [0.6, 1], size: [0.8, 1.6], a: 0.3 }); }
  });
}

/* ---------- the maelstrom ---------- */
function nerMaelstrom(h, x, z, R, dur, tick, burst) {
  const near = FX.near(x, z, 70);
  const disc = new THREE.Mesh(FX.geo.flat, nerMat({ pool: true, f: 2.4, a: 0 })); disc.position.set(x, 0.12, z); disc.scale.set(R * 2 * RK, 1, R * 2 * RK);
  // the wall: a low open cylinder of turning water round the rim, and a second, thinner one inside it
  const wall = new THREE.Mesh(FX.geo.cyl, nerMat({ f: 0.3, su: 8, sv: 1, a: 0, c: 1 })), wall2 = new THREE.Mesh(FX.geo.cyl, nerMat({ f: 0.6, su: 6, sv: 1, a: 0, c: 1 }));
  wall.position.set(x, 0, z); wall2.position.set(x, 0, z);
  const fade = (t) => Math.min(1, t / 0.35, (dur + 0.2 - t) / 0.3);
  if (near) {
    FX.add(disc, dur + 0.2, (k, me, dt, en) => { me.material.uniforms.uA.value = 0.95 * fade(en.t); });
    FX.add(wall, dur + 0.2, (k, me, dt, en) => { const f = fade(en.t); me.scale.set(R * 0.98, 0.9 + Math.sin(en.t * 3) * 0.15, R * 0.98); me.rotation.y += dt * 2.2; me.material.uniforms.uA.value = 0.55 * f; });
    FX.add(wall2, dur + 0.2, (k, me, dt, en) => { const f = fade(en.t); me.scale.set(R * 0.6, 0.5 + Math.sin(en.t * 4 + 1) * 0.1, R * 0.6); me.rotation.y -= dt * 3.5; me.material.uniforms.uA.value = 0.4 * f; });
    FX.decal(x, z, R * 0.55, NER.light, dur);
  }
  G.dangers.push({ x, z, r: R * 0.55, team: h.team, until: G.time + dur });
  let el = 0, tk = 0, fx = 0;
  G.actors.push({ update(dt) {
    el += dt; tk += dt; fx += dt;
    // the pull: everyone inside is dragged round and toward the eye, faster the closer they get
    for (const e of enemiesIn(h, x, z, R)) {
      if (e.struct || e.boss || e.dash) continue; const d = dist(e.x, e.z, x, z); if (d < 0.6) continue;
      const a = angTo(e.x, e.z, x, z), sp = (2.6 + (1 - d / R) * 2.4) * dt, tw = 1.6 * dt, nx = e.x + Math.sin(a) * sp + Math.cos(a) * tw, nz = e.z + Math.cos(a) * sp - Math.sin(a) * tw;
      if (NAV.ok(nx, nz)) { e.x = nx; e.z = nz; }
    }
    if (tk >= 0.5) { tk -= 0.5; for (const e of enemiesIn(h, x, z, R)) { nerHit(h, e, tick); if (FX.near(e.x, e.z, 40)) FX.hit(e.x, 1, e.z, NER.c, false); } SFX.at('water', x, z, 0.25); }
    if (near && fx > 0.05) { fx = 0; const a = rand(TAU), r = rand(R * 0.3, R); FX.burst(x + Math.cos(a) * r, 0.3, z + Math.sin(a) * r, { n: 1, color: NER.foam, color2: NER.c, speed: [1, 3], life: [0.4, 0.8], size: [0.45, 0.06], up: 1.5, grav: -6, ring: true });
      FX.burst(x + rand(-1, 1), 0.2, z + rand(-1, 1), { smoke: true, n: 1, color: 0xcfeeff, color2: 0x4a8ab0, speed: [0.3, 1], life: [0.8, 1.4], size: [1, 2.4], up: 1.2, a: 0.22 }); }
    if (el < dur) return true;
    burst(); return false;
  } });
}
// the geyser at the end: a column of water shooting up from the eye with a crown of spray, rain falling all around
function nerGeyser(x, z, r) {
  if (!FX.near(x, z, 70)) return;
  const col = new THREE.Mesh(FX.geo.cyl, nerMat({ f: -2.6, su: 3, sv: 4, a: 0.9, c: 0.6 })), crown = new THREE.Mesh(nerCrownGeo(), nerMat({ f: -1.4, su: 6, sv: 1, a: 0.8, c: 1 }));
  col.position.set(x, 0, z); crown.position.set(x, 0, z);
  FX.add(col, 1.3, (k, me, dt, en) => { const up = Math.min(1, en.t / 0.18), dn = k > 0.55 ? (k - 0.55) / 0.45 : 0; me.scale.set(r * 0.42 * (1 - dn * 0.6), 13 * up * (1 - dn * 0.7), r * 0.42 * (1 - dn * 0.6)); me.rotation.y += dt * 3; me.material.uniforms.uA.value = 0.9 * (1 - dn); });
  FX.add(crown, 1.3, (k, me, dt, en) => { const up = Math.min(1, en.t / 0.2), dn = k > 0.5 ? (k - 0.5) / 0.5 : 0; me.position.y = 11 * up * (1 - dn * 0.8); me.scale.set(r * (0.5 + up * 0.6 + dn * 0.8), 1.6 * (1 - dn * 0.5), r * (0.5 + up * 0.6 + dn * 0.8)); me.rotation.y -= dt * 2; me.material.uniforms.uA.value = 0.8 * (1 - dn); });
  FX.ring(x, z, { r0: 0.5, r1: r * 1.6, color: NER.c, life: 0.5, tex: 'shock' }); FX.shock(x, z, r * 1.8, 1.1, 0.45); FX.light(x, 4, z, NER.c, 3, 22, 0.8); FX.glow(x, 2, z, r * 3, NER.light, 0.3, 'flare');
  FX.sparks(x, 6, z, { n: 40, color: 0xffffff, color2: NER.c, speed: [4, 12], life: [0.6, 1.3], w: 0.12, up: 12, grav: -18, rad: 1 });
  for (let i = 0; i < 4; i++) after(0.15 + i * 0.12, () => FX.burst(x, 8 - i, z, { n: 10, color: NER.foam, color2: NER.c, speed: [2, 7], life: [0.6, 1.1], size: [0.5, 0.06], up: 4, grav: -16, rad: 0.8 }));
  after(0.25, () => { for (let i = 0; i < 14; i++) { const a = rand(TAU), rr = rand(1, r * 1.3); after(rand(0.1, 0.9), () => nerSplash(x + Math.sin(a) * rr, 0.4, z + Math.cos(a) * rr, 0.6)); } });
  FX.burst(x, 1, z, { smoke: true, n: 14, color: 0xe0f6ff, color2: 0x5a9ac0, speed: [2, 6], life: [0.8, 1.6], size: [1.4, 3.2], ring: true, up: 1.5, a: 0.4, drag: 1.4 });
}

HEROES.push(
  /* ================= 59. Nereya ================= */
  {
    id: 'nereya', name: 'Нерея', title: 'Повелительница приливов', role: 'mage', roleName: 'Маг воды', build: 'mage', bars: [4, 2, 5, 3], diffc: 2, atkSfx: 'cast', projMesh: 'orb',
    lore: 'Нерея выросла на дне моря, в храме, который волны помнят дольше, чем люди. Вода слушается её, как пёс хозяина: свивается в струю, способную пробить камень, закрывается пузырём, встаёт волной и, если Нерея по-настоящему разгневана, закручивается в водоворот, из которого не выплывает никто.',
    look: { bulk: 0.86, h: 0.96, scale: 0.98, c1: 0x0e4a66, c2: 0x0a3348, c3: 0x0a2230, cuff: 0x1a7088, skin: 0xe2ecef, hands: 0xe2ecef, metal: 0xe8e4d8, glow: 0x3ad0ff, head: 'nereya', hair: 0x24a4b4, shirt: 0x0e5a6a, chest: 'tide', robe: true, sh: 'cloth', tie: 0x3ad0ff, weapon: 'tidestaff', wc: 'staff', back: 'hoop' },
    stats: ST(540, 78, 500, 48, 46, 2.3, 21, 2.4, 0.66, 8.9, 7.5),
    innate: { name: 'Промокшие', icon: 'nerinn', desc: 'Каждое умение Нереи, задевшее врага, оставляет его промокшим на 4 сек: он медленнее на 15%, с него стекает вода, а умения Нереи бьют его на 15% сильнее.', count: h => G.heroes.filter(e => e.alive && e.team !== h.team && e.soakT > G.time && e.soakBy === h).length || '' },
    tick(h, dt) {
      const r = h.rig; if (!r || !FX.near(h.x, h.z, 40)) return;
      if (r.orb && Math.random() < dt * 5) { r.orb.getWorldPosition(_nv); FX.burst(_nv.x, _nv.y, _nv.z, { n: 1, color: NER.foam, color2: NER.c, speed: [0.1, 0.4], life: [0.4, 0.7], size: [0.12, 0.03], grav: -6 }); }
      if (h.moving && Math.random() < dt * 4) FX.burst(h.x + rand(-0.4, 0.4), 0.15, h.z + rand(-0.4, 0.4), { n: 1, color: NER.drop, color2: NER.c, speed: [0.2, 0.6], life: [0.3, 0.5], size: [0.2, 0.04], up: 0.8, grav: -8, ring: true });
    },
    abilities: [
      {
        key: 'Q', name: 'Струя', icon: 'nerjet', cd: 8, cost: 60, range: 9, ind: { type: 'line', w: 1.4, fixed: true }, anim: 'jet', animDur: 0.8, lock: 0.75, ai: { t: 'shot', sp: 80, farm: true },
        desc: 'Нерея сжимает воду в узкую струю и 0.7 сек бьёт ею по прямой (до 9): каждую десятую долю секунды — магический урон всем врагам на линии и лёгкий толчок назад. Всех задетых струя оставляет промокшими. Если Нерею оглушат, струя оборвётся.',
        cast(h, p) {
          const dir = p.dir, R = 9, per = D(h, 11, 2.2, 0, 0.09), T = 0.7, hit = new Map(); let el = 0, tk = 0;
          h.order = null; h.path = null; nerJetFx(h, dir, R, T); SFX.at('water', h.x, h.z, 0.7); SFX.at('sand', h.x, h.z, 0.45);
          G.actors.push({ update(dt) {
            el += dt; tk += dt; if (!h.alive || h.stunned || el > T) return false; h.facing = dir;
            if (tk >= 0.1) { tk -= 0.1; for (const e of enemiesIn(h, h.x, h.z, R + 1.5)) { if (!nerInLine(h, e, dir, R, 0.75)) continue; nerHit(h, e, per); if (e.alive && !e.boss) { const nx = e.x + Math.sin(dir) * 0.22, nz = e.z + Math.cos(dir) * 0.22; if (NAV.ok(nx, nz)) { e.x = nx; e.z = nz; } } if (!hit.has(e.id) && FX.near(e.x, e.z, 45)) { hit.set(e.id, 1); nerSplash(e.x, 1.3, e.z, 0.8, dir); } } SFX.at('water', h.x, h.z, 0.12); }
            return true;
          } });
        }
      },
      {
        key: 'W', name: 'Пузырь', icon: 'nerbubble', cd: 13, cost: 70, range: 10, ind: { type: 'any' }, anim: 'bubble', animDur: 0.5, lock: 0.25, ai: { t: 'trump' },
        desc: 'Нерея бросает пузырь воды в любого героя (до 10). Враг оказывается внутри и всплывает: 1.2 / 1.4 / 1.6 / 1.8 сек он оглушён, а потом пузырь лопается — магический урон ему и всем врагам рядом (радиус 2.5), все промокают. Союзника пузырь укрывает: щит на 3 сек, который держит удары тем лучше, чем выше сила умений.',
        cast(h, p) {
          const t = p.unit; if (!t || !t.alive || t.struct) return false; const lv = Math.max(1, h.al[1]), foe = hostile(h, t);
          const dmg = D(h, 70, 16, 0, 0.5), amt = D(h, 70, 18, 0, 0.6), dur = 1.0 + 0.2 * lv;
          SFX.at('water', h.x, h.z, 0.6);
          nerBubbleFly(h, t, Math.min(0.4, 0.12 + udist(h, t) / 40), () => {
            if (!t.alive || !h.alive && foe) return; SFX.at('water', t.x, t.z, 0.5); SFX.at('shield', t.x, t.z, 0.35);
            if (!foe) { const b = addBuff(t, { id: 'nerbub', dur: 3, shield: amt, src: h }); if (b) b.fx = nerBubbleOn(t, 3, 1.5); if (t !== h) h.healDone += amt * 0.6; if (FX.near(t.x, t.z, 45)) nerSplash(t.x, 1.4, t.z, 0.7); return; }
            if (t.boss) { nerHit(h, t, dmg); nerPop(t.x, 1.5, t.z, 1.4); return; }
            addBuff(t, { id: 'nerbub', dur, stun: true, air: 1.6, src: h }); const fx = nerBubbleOn(t, dur, 1.35, true);
            if (G.player && (t === G.player || h === G.player)) FX.text(t.x, t.height + 1.2, t.z, 'в пузыре!', '#9fe8ff', 15);
            after(dur, () => { fx.dead = true; const x = t.x, z = t.z, y = (t.height || 2) * 0.55 + 1.2; SFX.at('pop', x, z, 0.9); SFX.at('splash', x, z, 0.6); nerPop(x, y, z, 1.35); for (const e of enemiesIn(h, x, z, 2.5)) nerHit(h, e, e === t ? dmg : dmg * 0.6); });
          });
        }
      },
      {
        key: 'E', name: 'Девятый вал', icon: 'nerwave', cd: 12, cost: 65, range: 8, ind: { type: 'line', w: 2.6 }, anim: 'surf', animDur: 0.5, lock: 0, ai: { t: 'gap', escape: true, re: true },
        desc: 'Нерея поднимает волну и проносится на её гребне вперёд (до 8). Враги, которых накроет волна, получают магический урон, промокают и уносятся вместе с ней до самого конца пути, где волна разбивается о землю брызгами.',
        cast(h, p) {
          const dir = p.dir, dmg = D(h, 60, 14, 0, 0.5), T = p.dist / 20 + 0.15; let hitN = 0;
          nerWaveFx(h, dir, T + 0.25); SFX.at('splash', h.x, h.z, 0.8); SFX.at('gust', h.x, h.z, 0.5);
          dashTo(h, p.x, p.z, 20, { ribbon: false, w: 1.9, onHit: e => { if (e.struct) return; nerHit(h, e, dmg); hitN++; if (e.alive && !e.boss) { const left = Math.max(0.6, dist(e.x, e.z, p.x, p.z) + 1.2); knock(e, e.x - Math.sin(dir), e.z - Math.cos(dir), left, left / 20); } if (FX.near(e.x, e.z, 45)) nerSplash(e.x, 1.4, e.z, 0.9, dir); } });
          after(T, () => { const x = h.x + Math.sin(dir) * 1.5, z = h.z + Math.cos(dir) * 1.5; SFX.at('splash', x, z, 0.8); if (FX.near(x, z, 55)) { nerSplash(x, 1.2, z, 1.6, dir); FX.ring(x, z, { r0: 0.6, r1: 3.6, color: NER.c, life: 0.45, tex: 'shock' }); FX.burst(x, 0.3, z, { smoke: true, n: 8, color: 0xe0f6ff, color2: 0x5a9ac0, speed: [1, 3], life: [0.6, 1.2], size: [1, 2.2], ring: true, a: 0.35 }); } });
        }
      },
      {
        key: 'R', name: 'Мальстрём', icon: 'nermael', cd: 90, cost: 120, range: 11, ind: { type: 'circle', r: 6 }, anim: 'maelstrom', animDur: 1.0, lock: 0.5, ai: { t: 'point', rad: 6, delay: 1.2, ult: true, hp: 0.65 }, noCue: true,
        desc: 'Нерея закручивает в точке (до 11) огромный водоворот радиусом 6. 3.5 сек он тянет всех врагов внутри по спирали к центру — чем ближе к центру, тем сильнее — и каждые полсекунды наносит магический урон, оставляя их промокшими. Потом из воронки бьёт гейзер: огромный магический урон и оглушение на 1.2 сек всем, кто оказался ближе 3.3 к центру.',
        cast(h, p) {
          const x = p.x, z = p.z, R = 6, dur = 3.5, tick = D(h, 14, 3.5, 0, 0.07), big = D(h, 110, 26, 0, 0.6);
          SFX.at('ultcue', h.x, h.z, 0.6); SFX.at('splash', x, z, 0.6); SFX.at('void', x, z, 0.4);
          nerMaelstrom(h, x, z, R, dur, tick, () => {
            SFX.at('splash', x, z, 1); SFX.at('bigboom', x, z, 0.6); SFX.at('water', x, z, 0.6); FX.shake(0.6); if (FX.near(x, z, 36)) FX.hitstop(0.06);
            for (const e of enemiesIn(h, x, z, R * 0.55)) { nerHit(h, e, big); if (e.alive) stun(h, e, 1.2, 2.2); }
            nerGeyser(x, z, 2.6);
          });
        }
      }
    ]
  }
);

/* ---------- icons ---------- */
Object.assign(GLYPH, {
  // a drop with a ripple under it
  nerinn(T) { T.P(0, -24, 12, -2, 10, 8, 0, 14, -10, 8, -12, -2); T.cut(() => T.E(-3, 2, 4, 6)); T.al(0.5, () => T.E(0, 20, 20, 4, 2.5)); T.hi(() => T.C(-4, 0, 1.6)); },
  // a straight jet with spray at the end
  nerjet(T) { T.rot(-0.5, () => { T.g.fillRect(-24, -4, 38, 8); T.al(0.5, () => T.g.fillRect(-24, -8, 30, 16)); }); for (const [x, y] of [[16, -12], [20, -4], [12, -18], [22, -14]]) T.C(x, y, 2.6); T.hi(() => T.C(-10, 4, 1.4)); },
  // a bubble with a figure inside
  nerbubble(T) { T.O(0, 0, 20, 3.5); T.al(0.3, () => T.C(0, 0, 20)); T.C(0, -6, 4); T.P(-5, -1, 5, -1, 6, 10, -6, 10); T.hi(() => T.A(0, 0, 15, 3.6, 4.6, 2.5)); },
  // a curling wave
  nerwave(T) { T.P(-24, 18, -10, 6, 4, -10, 18, -14, 24, -4, 16, -4, 10, 2, 14, 10, 24, 18); T.cut(() => T.E(14, -2, 5, 4)); T.al(0.5, () => T.g.fillRect(-24, 18, 48, 4)); T.hi(() => T.C(18, -10, 1.6)); },
  // a spiral
  nermael(T) { for (let i = 0; i < 3; i++) T.A(0, 0, 8 + i * 7, i * 2.1, i * 2.1 + 4.2, 3.5); T.C(0, 0, 3.5); T.hi(() => T.C(10, -12, 1.6)); }
});
