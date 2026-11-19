'use strict';
/* ===== roster, parts 36–37 (heroes 63–64). Loaded after roster11.js (uses twGhost, twBoardMesh from there); glyphs go to GLYPH at the end.
   63. Lumen — a war robot that focuses light: a cutting beam aimed as a vector (the key press fixes where it starts, the mouse gives its
       direction — 'vector' aiming in main.js), mirror drones that bounce his beams, a phase jump with an EMP left behind, and a supernova
       beam from his core that he swings around for three seconds.
   64. Azzar — the undead overlord of the Great Tomb: high undead (small spells are halved), an aura of despair, a heart crushed at a
       distance, a death knight raised from the ground (it survives one killing blow), a black hole, and super-tier magic. ===== */
const LUM = { c: 0x3ad8ff, hot: 0xe8fbff, deep: 0x0a3a6a, burn: 0xff8a3a };
const AZZ = { c: 0xb04aff, red: 0xff2030, gold: 0xd8a838, dk: 0x1a0a28, bone: 0xcfc5ac };

/* ==================================================================== 63. LUMEN ==================================================================== */
// the beam: a cross of two quads (flat and upright) along +z from the start, with its own shader — a white core, a coloured body that
// flickers with noise running down its length, soft ends
const LUM_VS = 'varying vec2 vU; void main(){ vU=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }';
const LUM_FS = 'uniform float uT, uA, uW; uniform vec3 uC; uniform sampler2D uNz; varying vec2 vU;' +
  'void main(){ float x=abs(vU.x-.5)*2.; float n=texture2D(uNz,vec2(vU.y*uW-uT*5.,vU.x*.7+uT*.4)).r; float n2=texture2D(uNz,vec2(vU.y*uW*.5-uT*2.3,vU.x*.3)).g;' +
  ' float core=smoothstep(.3,0.,x); float body=smoothstep(1.,.12,x)*(.4+.6*n); float tip=smoothstep(0.,.03,vU.y)*smoothstep(1.,.97,vU.y);' +
  ' vec3 c=mix(uC*(.75+.5*n2),vec3(1.),core*.85); gl_FragColor=vec4(c*(1.+core*.5),(body*.7+core*.9)*uA*tip); }';
let _lumG = null;
function lumGeo() {
  if (_lumG) return _lumG; const P = [], UV = [], I = [];
  const quad = (a, b, c, d) => { const i = P.length / 3; P.push(...a, ...b, ...c, ...d); UV.push(0, 0, 1, 0, 1, 1, 0, 1); I.push(i, i + 1, i + 2, i, i + 2, i + 3); };
  quad([-0.5, 0, 0], [0.5, 0, 0], [0.5, 0, 1], [-0.5, 0, 1]); quad([0, -0.5, 0], [0, 0.5, 0], [0, 0.5, 1], [0, -0.5, 1]);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(I); return (_lumG = g);
}
function lumBeamMesh(col, len) {
  const m = new THREE.Mesh(lumGeo(), new THREE.ShaderMaterial({ uniforms: { uT: FXU.uT, uNz: FXU.uNz, uA: { value: 0 }, uW: { value: Math.max(1, (len || 8) / 3) }, uC: { value: new THREE.Color(col) } }, vertexShader: LUM_VS, fragmentShader: LUM_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  m.frustumCulled = false; m.renderOrder = 14; return m;
}
const _lmv = new THREE.Vector3();
function lumHand(h) { if (h.rig && h.rig.foreR && h.rig.root.visible) { _lmv.set(0, -0.85, 0); h.rig.foreR.localToWorld(_lmv); return { x: _lmv.x, y: _lmv.y, z: _lmv.z }; } return { x: h.x + Math.sin(h.facing) * 0.8, y: 1.4, z: h.z + Math.cos(h.facing) * 0.8 }; }
// a thin straight beam between two points in space, gone in a blink (attacks, drone zaps, the guide line)
function lumZap(a, b, col, w, life) {
  if (!FX.near(a.x, a.z, 60)) return; const len = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z) || 0.01, m = lumBeamMesh(col, len);
  m.position.set(a.x, a.y, a.z); m.lookAt(b.x, b.y, b.z); m.scale.set(w, w, len); FX.add(m, life, (k, me) => { me.material.uniforms.uA.value = 1 - k * k; });
}
// focus (innate): every enemy hero his abilities hit adds a lens of focus (up to three); with three the next cutting beam is overcharged
function lumFocusHit(h, e) { if (e.kind !== 'hero' || G.time - (h.focusT || 0) < 0.25) return; h.focusT = G.time; const was = h.focus || 0; h.focus = Math.min(3, was + 1); if (h.focus === 3 && was < 3 && FX.near(h.x, h.z, 45)) { FX.ring(h.x, h.z, { r0: 2, r1: 0.5, color: LUM.c, life: 0.35, tex: 'ringThin' }); SFX.at('charge', h.x, h.z, 0.4); SFX.at('blip', h.x, h.z, 0.3); } }
// a burning groove left on the ground by a beam; it cools from orange to dark
function lumGroove(x, z, dir, len, w, life) {
  if (!FX.near(x, z, 60)) return; const m = new THREE.Mesh(FX.geo.line, new THREE.MeshBasicMaterial({ color: LUM.burn, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  m.position.set(x, 0.1, z); m.rotation.y = dir; m.scale.set(w, 1, len); m.renderOrder = 5;
  FX.add(m, life, (k, me) => { me.material.opacity = 0.7 * (1 - k); me.material.color.setHex(k < 0.4 ? LUM.burn : 0xff3a1a); me.scale.x = w * (1 - k * 0.6); });
}
// the cutting beam (Q, overcharged or not): it grows from the start point along its line in `sweep` seconds, hurting each enemy as it reaches him;
// the line it burns erupts a moment later (the aftershock). Beams passing a mirror drone are bounced (lumReflect)
function lumLaser(h, x0, z0, dir, len, hw, dmg, o) {
  o = o || {}; const sx = Math.sin(dir), cz = Math.cos(dir), near = FX.near(x0, z0, 70), sw = o.sweep || 0.3, hit = new Set(), col = o.col || LUM.c;
  const A = lumHand(h); if (near) lumZap(A, { x: x0, y: 1.2, z: z0 }, col, 0.22, 0.25);
  SFX.at('laser', x0, z0, 0.8); SFX.at('sizzle', x0, z0, 0.4);
  let mesh = null, core = null; if (near) { mesh = lumBeamMesh(col, len); core = lumBeamMesh(0xffffff, len); mesh.position.set(x0, 1.2, z0); core.position.set(x0, 1.2, z0); mesh.rotation.y = core.rotation.y = dir; }
  const LIFE = sw + 0.35;
  if (mesh) { FX.add(mesh, LIFE, (k, me, dt, en) => { const t = en.t, g = Math.min(1, t / sw); me.scale.set(hw * 2.2 * (1 + 0.1 * Math.sin(t * 60)), hw * 2.2, Math.max(0.01, len * easeOut(g))); me.material.uniforms.uA.value = t < sw ? 1 : Math.max(0, 1 - (t - sw) / 0.35); });
    FX.add(core, LIFE, (k, me, dt, en) => { const t = en.t, g = Math.min(1, t / sw); me.scale.set(hw * 0.7, hw * 0.7, Math.max(0.01, len * easeOut(g))); me.material.uniforms.uA.value = t < sw ? 1 : Math.max(0, 1 - (t - sw) / 0.25); });
    FX.warp('line', x0, 1.2, z0, { ang: dir, w: hw * 3, len, str: 0.5, life: LIFE }); FX.light(x0 + sx * len / 2, 2, z0 + cz * len / 2, col, 2.2, 16, LIFE); }
  let t = 0, groove = false;
  G.actors.push({ update(dt) {
    t += dt; const cur = len * easeOut(Math.min(1, t / sw)), tx = x0 + sx * cur, tz = z0 + cz * cur;
    for (const e of stripHits(h, x0, z0, dir, cur, hw)) { if (hit.has(e.id)) continue; hit.add(e.id); damage(h, e, dmg, 1); lumFocusHit(h, e); if (FX.near(e.x, e.z, 50)) { FX.sparks(e.x, 1.2, e.z, { n: 10, color: 0xffffff, color2: col, speed: [4, 10], life: [0.15, 0.35], w: 0.08, dir: dir + HPI * (Math.random() < 0.5 ? 1 : -1), spread: 0.8 }); FX.hit(e.x, 1.2, e.z, col, true); } }
    if (near && t < sw + 0.05) { FX.sparks(tx, 0.3, tz, { n: 2, color: 0xffffff, color2: LUM.burn, speed: [3, 8], life: [0.2, 0.4], w: 0.07, up: 4 }); if (Math.random() < 0.5) FX.burst(tx, 0.3, tz, { smoke: true, n: 1, color: 0x6a5a50, color2: 0x1a1612, speed: [0.3, 1], life: [0.5, 0.9], size: [0.5, 1.1], up: 1.5, a: 0.35 }); }
    if (!groove && t >= sw) { groove = true; lumGroove(x0, z0, dir, len, hw * 1.2, (o.after || 0.85) + 0.5); if (h.drones) lumReflect(h, x0, z0, dir, len, hw, dmg * 0.55); }
    return t < sw + 0.05;
  } });
  if (o.after) after(o.after, () => lumAftershock(h, x0, z0, dir, len, hw, dmg * o.k, col, o.big));
}
// the aftershock: the burnt line bursts open, one blast after another from the start to the end
function lumAftershock(h, x0, z0, dir, len, hw, dmg, col, big) {
  const sx = Math.sin(dir), cz = Math.cos(dir), w = hw + (big ? 0.5 : 0.2);
  for (const e of stripHits(h, x0, z0, dir, len, w)) { damage(h, e, dmg, 1); if (big && e.alive) slow(h, e, 0.4, 1.2, 'lumshock'); }
  SFX.at('boom', x0 + sx * len / 2, z0 + cz * len / 2, 0.55); SFX.at('fire', x0 + sx * len / 2, z0 + cz * len / 2, 0.35); if (!FX.near(x0, z0, 70)) return; const n = Math.round(len / 1.3);
  for (let i = 0; i <= n; i++) after(i * 0.025, () => { const x = x0 + sx * len * i / n, z = z0 + cz * len * i / n;
    FX.pillar(x, z, { r: big ? 0.7 : 0.5, h: big ? 4 : 2.8, color: col, life: 0.28, op: 0.4 }); FX.sparks(x, 0.3, z, { n: 3, color: 0xffffff, color2: LUM.burn, speed: [2, 6], life: [0.2, 0.4], w: 0.07, up: 6 });
    if (i % 2 === 0) FX.debris(x, 0.3, z, { n: 2, color: 0x3a3632, speed: [1, 3], up: 6, size: [0.08, 0.2] }); });
  FX.warp('line', x0, 0.6, z0, { ang: dir, w: w * 3, len, str: 0.7, life: 0.4 }); FX.shake(big ? 0.3 : 0.15);
  if (GFX.decals) FX.scorch(x0 + sx * len / 2, z0 + cz * len / 2, Math.min(2, len / 4), LUM.burn, 5);
}
// a beam that passes close to a mirror drone is bounced off it at the nearest enemy hero (or turned aside); each drone at most every half second
function lumReflect(h, x0, z0, dir, len, hw, dmg) {
  const sx = Math.sin(dir), cz = Math.cos(dir);
  for (const d of h.drones || []) {
    if (d.until < G.time || G.time < d.rf) continue; const dx = d.x - x0, dz = d.z - z0, al = dx * sx + dz * cz; if (al < 0 || al > len || Math.abs(dx * cz - dz * sx) > hw + 1.3) continue;
    d.rf = G.time + 0.5; let tg = null, bd = 9; for (const e of G.heroes) if (e.alive && hostile(h, e)) { const dd = dist(d.x, d.z, e.x, e.z); if (dd < bd) { bd = dd; tg = e; } }
    const a2 = tg ? angTo(d.x, d.z, tg.x, tg.z) : dir + (Math.random() < 0.5 ? 1 : -1);
    lumLaser(h, d.x, d.z, a2, 7, 0.55, dmg, { sweep: 0.12 });
    if (FX.near(d.x, d.z, 55)) { FX.glow(d.x, 1.6, d.z, 2.4, LUM.c, 0.2, 'star'); FX.ring(d.x, d.z, { r0: 0.2, r1: 1.4, color: LUM.c, life: 0.25, tex: 'ringThin', y: 1.4 }); }
  }
}
// mirror drones: three little prisms flown out to a point, circling it for 6 s, zapping the nearest enemy now and then
let _lumDG = null;
function lumDroneMesh() {
  if (!_lumDG) { const k = kit(), g = new THREE.Group(); k.o(0.32, 0xb8bec8, 0, 0, 0, 1, 1.6, 1).o(0.2, { g: LUM.c }, 0, 0, 0, 0.7, 1.9, 0.7).b(0.7, 0.03, 0.08, 0x2a2e38, 0, 0, 0); k.into(g, new THREE.MeshPhongMaterial({ vertexColors: true, flatShading: true, shininess: 80, specular: 0xaaccff }), new THREE.MeshBasicMaterial({ vertexColors: true })); _lumDG = g; }
  return _lumDG.clone(true);
}
function lumDrones(h, x, z, dur, zdmg) {
  const A = lumHand(h), set = []; h.drones = set; SFX.at('drone', h.x, h.z, 0.6); SFX.at('servo', h.x, h.z, 0.4);
  for (let i = 0; i < 3; i++) {
    const d = { i, x: A.x, z: A.z, until: G.time + dur, zap: G.time + 0.7 + i * 0.3, rf: 0, t0: G.time }; set.push(d);
    if (FX.near(x, z, 70)) { const m = lumDroneMesh(); FX.add(m, dur + 0.3, (k, me, dt, en) => { if (h.drones !== set && en.t < dur) en.t = dur; const s = en.t > dur ? Math.max(0.01, 1 - (en.t - dur) / 0.3) : 1; me.position.set(d.x, 1.6 + Math.sin(en.t * 3 + i) * 0.15, d.z); me.rotation.y += dt * 4; me.scale.setScalar(s); if (Math.random() < dt * 6) FX.trail(d.x, 1.6, d.z, LUM.c, 0.25, 1); }); }
  }
  G.actors.push({ update(dt) {
    if (h.drones !== set) return false; const t = G.time;
    for (const d of set) {
      const fly = Math.min(1, (t - d.t0) / 0.35), a = t * 1.3 + d.i / 3 * TAU, ox = x + Math.sin(a) * 2, oz = z + Math.cos(a) * 2; d.x = lerp(d.x, ox, fly < 1 ? fly : 1); d.z = lerp(d.z, oz, fly < 1 ? fly : 1);
      if (t >= d.zap && h.alive) { d.zap = t + 0.9; let tg = null, bd = 6; for (const u of G.units) { if (!u.alive || u.struct || !hostile(h, u)) continue; const dd = dist(d.x, d.z, u.x, u.z) - (u.kind === 'hero' ? 1.5 : 0); if (dd < bd) { bd = dd; tg = u; } }
        if (tg) { damage(h, tg, zdmg, 1); lumZap({ x: d.x, y: 1.6, z: d.z }, { x: tg.x, y: tg.height * 0.55, z: tg.z }, LUM.c, 0.14, 0.14); SFX.at('blaster', d.x, d.z, 0.25); } }
    }
    if (t > set[0].until) { h.drones = null; return false; } return true;
  } });
}
// the phase jump: he comes apart into glowing cubes and is somewhere else; half a second later an EMP goes off where he stood
function lumPhase(h, x, z, dmg) {
  const ox = h.x, oz = h.z; if (FX.near(ox, oz, 55)) { twGhost(h.rig, LUM.c, 0.35, 0.5, ox, oz); FX.debris(ox, 1.2, oz, { n: 12, color: LUM.c, speed: [2, 5], up: 3, size: [0.08, 0.2], glow: true }); }
  blink(h, x, z); SFX.at('blink', h.x, h.z, 0.7); SFX.at('servo', h.x, h.z, 0.35);
  if (FX.near(h.x, h.z, 55)) { FX.implode(h.x, 1.2, h.z, 2, { color: LUM.c, color2: 0xffffff, n: 16, life: 0.25, streak: true }); FX.glow(h.x, 1.4, h.z, 3, LUM.c, 0.2, 'star'); FX.beam(ox, oz, h.x, h.z, { color: LUM.c, w: 0.3, life: 0.25, y: 1.2 }); }
  if (FX.near(ox, oz, 55)) { FX.decal(ox, oz, 3.2, LUM.c, 0.5); G.dangers.push({ x: ox, z: oz, r: 3.2, team: h.team, until: G.time + 0.5 }); }
  after(0.5, () => {
    for (const e of enemiesIn(h, ox, oz, 3.2)) { damage(h, e, dmg, 1); lumFocusHit(h, e); if (e.alive) { slow(h, e, 0.4, 1.5, 'lumemp'); addBuff(e, { id: 'silence', dur: 0.8, silence: true, src: h }); } }
    SFX.at('zap', ox, oz, 0.9); SFX.at('warp', ox, oz, 0.5); if (!FX.near(ox, oz, 55)) return;
    FX.ring(ox, oz, { r0: 0.4, r1: 3.6, color: LUM.c, life: 0.4, tex: 'shock' }); FX.sphere(ox, 1, oz, { r0: 0.5, r1: 3, color: LUM.c, life: 0.3, op: 0.5 }); FX.arcs(ox, 1, oz, 3, 7, LUM.c); FX.shock(ox, oz, 3.5, 0.8, 0.35);
  });
}
// the supernova: rooted, the core pours a great beam out of his chest for three seconds; he can swing it (toward the cursor; a bot — toward its target)
function lumNova(h, dir, dur, tick, last) {
  const L = 16, W = 1.25; h.beamT = G.time + dur; h.castLock = Math.max(h.castLock, 0.3);
  h.anim.castT = h.anim.castDur = dur; h.anim.castType = 'supernova'; SFX.at('ultcue', h.x, h.z, 0.7); SFX.at('overload', h.x, h.z, 0.6); SFX.at('servo', h.x, h.z, 0.45); SFX.at('laser', h.x, h.z, 0.9);
  let m = null, c = null; const near = () => FX.near(h.x, h.z, 70);
  if (near()) { m = lumBeamMesh(LUM.c, L); c = lumBeamMesh(0xffffff, L); FX.add(m, dur + 0.4, () => { }); FX.add(c, dur + 0.4, () => { }); }
  let t = 0, acc = 0, d = dir, done = false;
  const end = () => {
    if (done) return; done = true; h.beamT = 0; h.anim.castT = 0;
    const sx = Math.sin(d), cz = Math.cos(d), x0 = h.x + sx * 0.8, z0 = h.z + cz * 0.8;
    for (const e of stripHits(h, x0, z0, d, L, W + 0.4)) damage(h, e, last, 1);
    SFX.at('bigboom', h.x + sx * 8, h.z + cz * 8, 0.9); SFX.at('sizzle', h.x + sx * 8, h.z + cz * 8, 0.5); SFX.at('servo', h.x, h.z, 0.4);
    if (FX.near(x0, z0, 70)) { for (let i = 0; i <= 8; i++) after(i * 0.035, () => { const x = x0 + sx * L * i / 8, z = z0 + cz * L * i / 8; FX.pillar(x, z, { r: 1.0, h: 6, color: LUM.c, life: 0.35, op: 0.35 }); FX.burst(x, 0.5, z, { smoke: true, n: 3, color: 0x6a6a74, color2: 0x15141a, speed: [1, 3], life: [0.6, 1.1], size: [0.9, 1.8], up: 2, a: 0.4 }); FX.sparks(x, 0.5, z, { n: 4, color: 0xffffff, color2: LUM.burn, speed: [3, 9], life: [0.2, 0.45], w: 0.08, up: 6 }); });
      FX.shake(0.45); FX.shock(x0 + sx * L / 2, z0 + cz * L / 2, 6, 1, 0.45); lumGroove(x0, z0, d, L, W * 1.6, 1.6); }
  };
  G.actors.push({ update(dt) {
    if (done) return false; t += dt;
    if (!h.alive || h.stunned || t >= dur) { end(); if (m) { m.visible = false; c.visible = false; } return false; }
    // swing toward the cursor (the player) or the nearest enemy hero in front (a bot), at most 0.9 radians a second
    let want = d; if (h.isPlayer && !h.ai) want = angTo(h.x, h.z, G.mx, G.mz); else { let tg = null, bd = 18; for (const e of G.heroes) if (e.alive && hostile(h, e)) { const dd = udist(h, e); if (dd < bd && Math.abs(angDiff(d, angTo(h.x, h.z, e.x, e.z))) < 1.4) { bd = dd; tg = e; } } if (tg) want = angTo(h.x, h.z, tg.x, tg.z); }
    const df = angDiff(d, want); d += clamp(df, -0.9 * dt, 0.9 * dt); h.facing = d; h.forced = { vx: 0, vz: 0, t: 0.1 }; h.path = null; h.moving = false;   // planted: no walking, no other actions while the core pours out
    const sx = Math.sin(d), cz = Math.cos(d), x0 = h.x + sx * 0.8, z0 = h.z + cz * 0.8;
    if (m) { const f = Math.min(1, t / 0.2), j = 1 + 0.08 * Math.sin(t * 70); m.position.set(x0, 1.55, z0); c.position.set(x0, 1.55, z0); m.rotation.y = c.rotation.y = d; m.scale.set(W * 2.4 * j, W * 2.4, L * f); c.scale.set(W * 0.8, W * 0.8, L * f);
      const fo = Math.min(1, (dur - t) / 0.2); m.material.uniforms.uA.value = fo; c.material.uniforms.uA.value = fo;
      if (near()) { const ex = x0 + sx * L, ez = z0 + cz * L; if (Math.random() < dt * 20) FX.sparks(ex, 0.4, ez, { n: 3, color: 0xffffff, color2: LUM.burn, speed: [3, 9], life: [0.2, 0.45], w: 0.08, up: 5 }); if (Math.random() < dt * 8) FX.burst(ex, 0.4, ez, { smoke: true, n: 1, color: 0x6a5a50, color2: 0x15120f, speed: [0.5, 1.5], life: [0.6, 1.1], size: [0.8, 1.6], up: 2, a: 0.4 }); if (Math.random() < dt * 3) lumGroove(x0 + sx * L * rand(0.3, 0.95), z0 + cz * L * rand(0.3, 0.95), d + rand(-0.2, 0.2), 1.5, 1.2, 1.2);
        if (Math.random() < dt * 10) FX.warp('line', x0, 1.55, z0, { ang: d, w: W * 4, len: L, str: 0.45, life: 0.15 }); FX.light(x0, 2, z0, LUM.c, 1.8, 14, 0.12); FX.shake(0.06); } }
    acc += dt; while (acc >= 0.15) { acc -= 0.15; for (const e of stripHits(h, x0, z0, d, L, W)) { damage(h, e, tick, 1, { dot: true }); if (e.alive) slow(h, e, 0.3, 0.3, 'lumnova'); if (Math.random() < 0.3) lumFocusHit(h, e); } }
    if (h.drones) lumReflect(h, x0, z0, d, L, W, tick * 2.5);
    return true;
  } });
}
// bot aim for the vector beam: start the line short of the enemy and lay it through him; farming — through a group of minions
function lumQAI(h, mode, tgt, nf, ab) {
  const R = abRange(h, ab);
  if (mode !== 'retreat' && tgt && udist(h, tgt) < R + 6) {
    const p = { x: tgt.x + (tgt.moving ? Math.sin(tgt.facing) * 1.2 : 0), z: tgt.z + (tgt.moving ? Math.cos(tgt.facing) * 1.2 : 0) }, a = angTo(h.x, h.z, p.x, p.z), dd = dist(h.x, h.z, p.x, p.z), s = Math.max(1, Math.min(R, dd - 2.5));
    const sx = h.x + Math.sin(a) * s, sz = h.z + Math.cos(a) * s; return { x: sx, z: sz, vdir: angTo(sx, sz, p.x, p.z) };
  }
  if (mode === 'lane' && h.mana / h.maxMana > 0.6) { const m = farmPoint(h, R, 3); if (m) { const a = angTo(h.x, h.z, m.x, m.z), s = Math.min(R, Math.max(1, udist(h, m) - 2)); return { x: h.x + Math.sin(a) * s, z: h.z + Math.cos(a) * s, vdir: a }; } }
  return null;
}

/* ==================================================================== 64. AZZAR ==================================================================== */
// the death knight: a towering undead in blackened plate with a wavy blade and a tower shield; it survives one killing blow
const AZZ_DK = { bulk: 1.35, h: 1.08, scale: 1.45, c1: 0x2c2832, c2: 0x1c1a22, c3: 0x3a1418, metal: 0x55525e, glow: 0xff2a2a, head: 'dknight', chest: 'plate', sh: 'spike', legs: 'greaves', weapon: 'flamberge', wc: 'melee', cape: 0x3a0a10 };
function azKnight(h, x, z) {
  if (h.knight && h.knight.alive) kill(h.knight, null);
  const lv = h.level, hp = 620 + lv * 72 + h.ap * 1.5, ad = 30 + lv * 4.2 + h.ap * 0.22, q = NAV.nearest(x, z);
  const u = makeUnit({ kind: 'summon', owner: h, team: h.team, x: q.x, z: q.z, radius: 1.05, maxHp: hp, bAd: ad, bDef: 30 + lv * 2, bAs: 0.78, bMs: 8.8, range: 2.9, pcol: 0xff2a2a, name: 'Рыцарь смерти', facing: h.facing, until: G.time + 15, riseT: G.time, wdT: G.time, wdX: q.x, wdZ: q.z, path: null, think: 0.6, undying: true });
  u.onUndying = k => { FX.text(k.x, k.height + 1, k.z, 'Не падёт!', '#ff6a5e', 16); SFX.at('necro', k.x, k.z, 0.6); SFX.at('mace', k.x, k.z, 0.5); addBuff(k, { id: 'dkrage', dur: 4, as: 0.5, ms: 0.15 }); if (FX.near(k.x, k.z, 50)) { FX.ring(k.x, k.z, { r0: 0.5, r1: 3, color: 0xff2a2a, life: 0.4, tex: 'shock' }); FX.flame(k.x, 1.5, k.z, { n: 10, color: 0xff3a2a, color2: 0x3a0505, rad: 0.6 }); } };
  u.rig = buildHero(AZZ_DK, TEAM_COL[h.team]); placeRig(u); u.height = u.rig.height || 3; u.yOff = -2.4; h.knight = u;
  SFX.at('necro', x, z, 0.8); SFX.at('rubble', x, z, 0.6); SFX.at('bone', x, z, 0.4);
  if (FX.near(x, z, 60)) {
    FX.zone(q.x, q.z, 2.6, AZZ.c, 1.2, { tex: 'rune', spin: 1.5, op: 0.8 }); FX.pillar(q.x, q.z, { r: 1.2, h: 10, color: 0xff2a2a, life: 0.7, op: 0.45 });
    FX.burst(q.x, 0.4, q.z, { smoke: true, n: 12, color: 0x1a0a14, color2: 0x050205, speed: [0.5, 2.5], life: [0.7, 1.3], size: [1, 2.2], up: 2, rad: 1, a: 0.65 }); FX.debris(q.x, 0.3, q.z, { n: 10, color: 0x3a3430, speed: [2, 6], up: 8, size: [0.15, 0.4] }); FX.scorch(q.x, q.z, 1.6, 0xff2a2a, 6);
  }
  after(0.65, () => {   // risen: it roars and every enemy close by has to fight it
    if (!u.alive) return; for (const e of enemiesIn(u, u.x, u.z, 3.5)) { if (e.boss || e.struct) continue; e.tauntBy = u; e.tauntT = G.time + 1.1; if (e.kind !== 'hero') e.target = u; else { e.order = { type: 'attack', tgt: u, rp: 0 }; e.windup = 0; } }
    SFX.at('roar', u.x, u.z, 0.7); SFX.at('mace', u.x, u.z, 0.4); if (FX.near(u.x, u.z, 50)) { FX.ring(u.x, u.z, { r0: 0.5, r1: 3.8, color: 0xff2a2a, life: 0.45, tex: 'shock' }); FX.text(u.x, u.height + 0.8, u.z, 'РРААА!', '#ff5a4a', 16); }
  });
  return u;
}
// a ghostly heart: two lobes and a point, translucent red, beating
let _azHG = null;
function azHeartMesh() {
  if (!_azHG) { const P = [], C = 0xffffff; P.push({ g: new THREE.IcosahedronGeometry(0.2, 1), m: TRS(-0.12, 0.08, 0), c: C }, { g: new THREE.IcosahedronGeometry(0.2, 1), m: TRS(0.12, 0.08, 0), c: C }, { g: new THREE.ConeGeometry(0.26, 0.42, 8), m: TRS(0, -0.14, 0, Math.PI), c: C }); _azHG = mergeParts(P); }
  return new THREE.Mesh(_azHG, new THREE.MeshBasicMaterial({ color: AZZ.red, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
}
// grasp heart: a heart beats in his hand and in the enemy's chest — the hand closes, both are crushed
function azGrasp(h, t, dmg) {
  const T = 0.55, near = FX.near(t.x, t.z, 60); SFX.at('heartbeat', t.x, t.z, 0.75); SFX.at('dark', t.x, t.z, 0.4);
  if (near) {
    const ht = azHeartMesh(), hh = azHeartMesh(); const H = () => { if (h.rig && h.rig.handR) { h.rig.handR.getWorldPosition(_lmv); return _lmv; } return { x: h.x, y: 1.6, z: h.z }; };
    FX.add(ht, T + 0.1, (k, me, dt, en) => { const q = en.t / T, beat = 1 + 0.15 * Math.abs(Math.sin(en.t * (8 + q * 16))), s = (q < 1 ? 1 : Math.max(0.01, 1 - (en.t - T) * 10)) * beat * (q > 0.85 ? 1 - (q - 0.85) * 3 : 1); me.position.set(t.x, (t.height || 2) * 0.62 + (t.yOff || 0), t.z); me.scale.setScalar(s * 0.9); me.material.opacity = 0.85 * Math.min(1, en.t / 0.1); });
    FX.add(hh, T + 0.1, (k, me, dt, en) => { const p = H(), q = en.t / T, beat = 1 + 0.15 * Math.abs(Math.sin(en.t * (8 + q * 16))); me.position.set(p.x, p.y + 0.05, p.z); me.scale.setScalar(0.55 * beat * (q > 0.8 ? Math.max(0.05, 1 - (q - 0.8) * 4) : 1)); });
    FX.add(new THREE.Group(), T, (k, me, dt) => { if (Math.random() < dt * 14) { const p = H(); FX.implode(p.x, p.y, p.z, 0.8, { color: AZZ.red, color2: 0x3a0005, n: 2, life: 0.3 }); } });
  }
  after(T, () => {
    if (!t.alive) return; damage(h, t, dmg, 1);
    if (t.alive && t.hp < t.maxHp * 0.15) { damage(h, t, t.hp + 5, 2, { raw: true }); FX.text(t.x, (t.height || 2) + 1.4, t.z, 'Смерть', '#ff4a4a', 22); }
    else if (t.alive) stun(h, t, 1.0);
    SFX.at('flesh', t.x, t.z, 0.75); SFX.at('blood', t.x, t.z, 0.6); SFX.at('heavy', t.x, t.z, 0.5); if (!FX.near(t.x, t.z, 55)) return; const y = (t.height || 2) * 0.62;
    FX.burst(t.x, y, t.z, { n: 18, color: AZZ.red, color2: 0x3a0005, speed: [2, 6], life: [0.3, 0.6], size: [0.35, 0.05] }); FX.sparks(t.x, y, t.z, { n: 14, color: 0xff8a8a, color2: AZZ.red, speed: [3, 9], life: [0.2, 0.45], w: 0.08 });
    FX.burst(t.x, y, t.z, { smoke: true, n: 5, color: 0x5a0a14, color2: 0x140205, speed: [0.5, 2], life: [0.5, 0.9], size: [0.6, 1.2], a: 0.5 }); FX.ring(t.x, t.z, { r0: 0.3, r1: 2.2, color: AZZ.red, life: 0.3, tex: 'ringThin', y }); FX.hitstop(0.05); FX.shake(0.2);
  });
}
// the black hole: a black sphere with a burning violet ring round it, light bending into it; everything near is dragged in and torn, then it collapses
function azBlackHole(h, x, z, tick, last) {
  const R = 4.6, DUR = 2.0, near = FX.near(x, z, 70); SFX.at('void', x, z, 0.8); SFX.at('warp', x, z, 0.5);
  if (near) {
    const core = new THREE.Mesh(FX.geo.sphere, new THREE.MeshBasicMaterial({ color: 0x000000 })), shell = new THREE.Mesh(FX.geo.sphere, FX.rimMat(AZZ.c, 1.2));
    const disc = new THREE.Mesh(FX.geo.flat, FX.mat('swirl', AZZ.c, 0.9)), disc2 = new THREE.Mesh(FX.geo.flat, FX.mat('ring', 0xff6ad8, 0.7)); disc.userData.own = disc2.userData.own = shell.userData.own = true;
    const g = new THREE.Group(); g.add(core, shell, disc, disc2); core.userData.own = true;
    FX.add(g, DUR + 0.3, (k, me, dt, en) => { const t = en.t, grow = Math.min(1, t / 0.3), fin = t > DUR ? Math.max(0.01, 1 - (t - DUR) / 0.3) : 1, s = 1.25 * grow * fin * (1 + 0.05 * Math.sin(t * 20));
      me.position.set(x, 2.6, z); core.scale.setScalar(s); shell.scale.setScalar(s * 1.3); disc.scale.set(s * 4.6, 1, s * 4.6); disc2.scale.set(s * 3, 1, s * 3); disc.rotation.set(0.5, t * 4, 0); disc2.rotation.set(0.5, -t * 6, 0); disc.material.opacity = 0.5 * fin; disc2.material.opacity = 0.35 * fin; });
    FX.zone(x, z, R, 0x3a1060, DUR, { tex: 'swirl', spin: -2.5, op: 0.4 }); FX.warp('lens', x, 2.6, z, { r: 5, str: -1.2, life: DUR });
  }
  let t = 0, acc = 0;
  G.actors.push({ update(dt) {
    t += dt; acc += dt;
    if (near && Math.random() < dt * 14) FX.implode(x, 2.6, z, R, { color: 0x8a3ad8, color2: 0x1a0a28, n: 2, life: 0.5, streak: true });
    if (acc >= 0.25) { acc -= 0.25; for (const e of enemiesIn(h, x, z, R)) { if (e.struct || e.boss) continue; damage(h, e, tick, 1, { dot: true }); if (dist(e.x, e.z, x, z) > 0.7) pullTo(e, x, z, 3.6, 0.5); } }
    if (t >= DUR) {
      for (const e of enemiesIn(h, x, z, 3)) { damage(h, e, last, 1); if (e.alive) slow(h, e, 0.4, 1.2, 'azhole'); }
      SFX.at('boom', x, z, 0.7); SFX.at('warp', x, z, 0.6); if (FX.near(x, z, 60)) { FX.ring(x, z, { r0: 4, r1: 0.4, color: AZZ.c, life: 0.3, tex: 'shock' }); after(0.25, () => { FX.ring(x, z, { r0: 0.4, r1: 4.5, color: 0xff6ad8, life: 0.4, tex: 'shock' }); FX.shock(x, z, 5, 1, 0.4); FX.sparks(x, 1.6, z, { n: 20, color: 0xffffff, color2: AZZ.c, speed: [5, 13], life: [0.2, 0.5], w: 0.09 }); FX.shake(0.3); }); }
      return false;
    }
    return true;
  } });
}
// tentacles of the dark mother: black, glistening, rising out of the ground round a point and sinking back
let _azTG = null;
function azTentacles(x, z, n) {
  if (!FX.near(x, z, 60)) return; if (!_azTG) { const P = []; for (let i = 0; i < 6; i++) P.push({ g: new THREE.CylinderGeometry(0.18 - i * 0.025, 0.22 - i * 0.025, 0.55, 6), m: TRS(Math.sin(i * 0.7) * 0.12 * i, 0.28 + i * 0.5, 0, 0, 0, Math.sin(i * 0.9) * 0.25), c: 0xffffff }); P.push({ g: new THREE.ConeGeometry(0.06, 0.4, 5), m: TRS(0.2, 3.2, 0, 0, 0, 0.4), c: 0xffffff }); _azTG = mergeParts(P); }
  for (let i = 0; i < n; i++) { const a = i / n * TAU + rand(0.5), r = rand(0.6, 1.6), m = new THREE.Mesh(_azTG, new THREE.MeshPhongMaterial({ color: 0x120a18, emissive: 0x2a0a40, shininess: 90, specular: 0xb04aff, transparent: true })), L = rand(1.1, 1.5), ry = rand(TAU), sc = rand(0.7, 1.2);
    FX.add(m, L, (k, me) => { const up = k < 0.3 ? easeOut(k / 0.3) : (k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1); me.position.set(x + Math.sin(a) * r, -3.4 * sc * (1 - up), z + Math.cos(a) * r); me.rotation.set(Math.sin(k * 9 + i) * 0.25, ry + k * 2, Math.cos(k * 7 + i) * 0.3 - Math.sin(a) * 0.3); me.scale.setScalar(sc); me.material.opacity = Math.min(1, (1 - k) * 4); }); }
}
// super-tier magic: a vast circle of runes opens round him (he can neither move nor be stopped), then a wave of black death sweeps out;
// whoever it leaves below a fifth of his health dies, and the dark mother's tentacles take him
function azSuper(h, dmg) {
  const R = 10, T = 1.5, x = h.x, z = h.z; h.superT = G.time + T; G.actors.push({ update() { if (!h.alive || G.time > h.superT) return false; h.forced = { vx: 0, vz: 0, t: 0.1 }; h.path = null; h.moving = false; return true; } });   // planted in the circle; nothing can break the casting
  h.anim.castT = h.anim.castDur = T + 0.2; h.anim.castType = 'overload'; SFX.at('ultcue', x, z, 0.8); SFX.at('necro', x, z, 0.9); SFX.at('charge', x, z, 0.5); if (G.player && (h.team !== G.player.team) && udist(h, G.player) < 30) UI.announce('Сверхмагия!', '#c08aff');
  G.dangers.push({ x, z, r: R, team: h.team, until: G.time + T });
  if (FX.near(x, z, 80)) {
    FX.zone(x, z, R, AZZ.c, T + 0.4, { tex: 'rune', spin: 0.6, op: 0.9 }); FX.zone(x, z, R * 0.72, AZZ.gold, T + 0.4, { tex: 'rune', spin: -1.0, op: 0.75 }); FX.zone(x, z, R * 0.42, AZZ.red, T + 0.4, { tex: 'rune', spin: 1.8, op: 0.7 });
    FX.wall(x, z, R, AZZ.c, T + 0.3, { h: 2.5, op: 0.14, spin: 0.2 });
    const sig = new THREE.Group(); for (let i = 0; i < 12; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.rune, color: i % 3 ? AZZ.c : AZZ.gold, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false })); s.userData.own = true; s.scale.set(1.4, 1.4, 1); sig.add(s); }
    FX.add(sig, T + 0.3, (k, me, dt, en) => { const t = en.t; me.position.set(x, 0, z); me.children.forEach((s, i) => { const a = i / 12 * TAU + t * 0.8, r = 4.5 + Math.sin(t * 2 + i) * 0.3; s.position.set(Math.sin(a) * r, 2.2 + Math.sin(t * 3 + i * 0.7) * 0.4 + t * 0.6, Math.cos(a) * r); s.material.opacity = Math.min(1, t / 0.3) * (t > T ? Math.max(0, 1 - (t - T) / 0.3) : 1); }); });
    G.actors.push({ t: 0, update(dt) { this.t += dt; if (FX.near(x, z, 40)) G.dim = Math.max(G.dim || 0, 0.55 * Math.min(1, this.t / 0.6)); if (Math.random() < dt * 30) { const a = rand(TAU), r = rand(2, R); FX.burst(x + Math.sin(a) * r, 0.3, z + Math.cos(a) * r, { n: 1, color: AZZ.c, color2: 0x1a0a28, speed: [0.3, 1], life: [0.6, 1], size: [0.25, 0.04], up: 3 }); } return this.t < T; } });
  }
  after(T, () => {
    h.superT = 0; const hit = enemiesIn(h, x, z, R).filter(e => !e.struct);
    for (const e of hit) { damage(h, e, dmg * (e.kind === 'hero' ? 1 : 0.6), 1); if (!e.alive) continue; if (e.kind === 'hero' && e.hp < e.maxHp * 0.2) { damage(h, e, e.hp + 5, 2, { raw: true }); azTentacles(e.x, e.z, 6); FX.text(e.x, (e.height || 2) + 1.4, e.z, 'Смерть', '#c08aff', 20); } else { slow(h, e, 0.4, 2, 'azsuper'); if (e.kind === 'hero') azTentacles(e.x, e.z, 3); } }
    SFX.at('bigboom', x, z, 1); SFX.at('necro', x, z, 0.8); SFX.at('void', x, z, 0.7); if (!FX.near(x, z, 80)) return;
    FX.shake(0.7); FX.punch(0.5); FX.hitstop(0.06); FX.shock(x, z, R, 1.3, 0.7);
    for (let i = 0; i < 2; i++) after(i * 0.1, () => FX.ring(x, z, { r0: 1, r1: R + 1, color: i ? 0x8a6a20 : 0x5a1a9a, life: 0.6, tex: 'shock', op: 0.7 }));
    for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; after(i % 4 * 0.05, () => FX.burst(x + Math.sin(a) * R * 0.6, 0.6, z + Math.cos(a) * R * 0.6, { smoke: true, n: 3, color: 0x14081c, color2: 0x020104, speed: [2, 6], life: [0.8, 1.4], size: [1.4, 3], dir: a, spread: 0.3, up: 1, a: 0.7 })); }
    FX.burst(x, 1, z, { n: 22, color: 0x7a3ad8, color2: 0x1a0a28, speed: [6, 16], life: [0.4, 0.9], size: [0.35, 0.05], ring: true });
  });
}

HEROES.push(
  /* ================= 63. Lumen ================= */
  {
    id: 'lumen', name: 'Люмен', title: 'Боевой фокусатор', role: 'mage', roleName: 'Лазерный маг', build: 'mage', bars: [5, 2, 2, 3], diffc: 3, atkSfx: 'laser',
    lore: 'Люмен — боевой робот, собранный, чтобы фокусировать свет. В его груди горит призма, в линзе на лице — целое солнце, а излучатель на правой руке режет камень, как бумагу. Он не спорит и не торопится: ставит начало луча, ведёт его — и всё, через что прошёл луч, плавится. Говорят, когда Люмен перегружает ядро, свет видно с другого края Разлома.',
    look: { bulk: 1.05, h: 1.06, scale: 1.0, c1: 0xa4aab6, c2: 0x2a2e38, c3: 0x1a1c22, metal: 0xd4d8e0, skin: 0x8a909e, hands: 0x8a909e, cuff: 0x2a2e38, glow: LUM.c, head: 'lumen', chest: 'robot', legs: 'robot', sh: 'plate', weapon: 'emitter', wc: 'laser', back: 'prisms' },
    stats: ST(540, 78, 500, 50, 46, 2.4, 20, 2.3, 0.66, 8.8, 7.0),
    shootAtk(u, t) { const A = lumHand(u); lumZap(A, { x: t.x, y: t.height * 0.55, z: t.z }, LUM.c, 0.16, 0.12); SFX.at('laser', u.x, u.z, 0.25); after(0.04, () => { if (t.alive) { basicHit(u, t); if (FX.near(t.x, t.z, 45)) FX.sparks(t.x, t.height * 0.55, t.z, { n: 5, color: 0xffffff, color2: LUM.c, speed: [3, 8], life: [0.12, 0.3], w: 0.07 }); } }); },
    innate: { name: 'Фокусировка', icon: 'luminn', desc: 'Каждый вражеский герой, задетый умением Люмена, добавляет линзу фокуса (до 3). С тремя линзами следующий «Режущий луч» перегружен: вдвое шире, на 40% сильнее, а его повторный взрыв мощнее и замедляет.', count: h => h.focus ? h.focus : '' },
    abilities: [
      {
        key: 'Q', name: 'Режущий луч', icon: 'lumray', cd: 7, cost: 60, range: 9, ind: { type: 'vector', w: 1.6, len: 8 }, anim: 'shoot', animDur: 0.45, lock: 0.2, ai: { t: 'fn', fn: lumQAI },
        desc: 'Нажмите — начало луча встанет под курсором (до 9 от Люмена), ведите мышь — луч повернётся, отпустите — выстрел. Луч длиной 8 прорезает землю и наносит магический урон всем на линии, а через 0.85 сек выжженная полоса взрывается ещё раз (45% урона). Если мышь не сдвигать, луч идёт прямо от Люмена.',
        cast(h, p) { const over = (h.focus || 0) >= 3; if (over) h.focus = 0; lumLaser(h, p.x, p.z, p.vdir, 8, over ? 1.5 : 0.8, D(h, 85, 21, 0, 0.6) * (over ? 1.4 : 1), { after: 0.85, k: over ? 0.7 : 0.45, sweep: 0.3, big: over }); if (over && FX.near(h.x, h.z, 50)) FX.text(h.x, h.height + 1, h.z, 'перегрузка', '#9fefff', 14); }
      },
      {
        key: 'W', name: 'Зеркальные дроны', icon: 'lumdrone', cd: 15, cost: 70, range: 9, ind: { type: 'circle', r: 2.2 }, anim: 'cast', animDur: 0.4, lock: 0.15, ai: { t: 'point', rad: 3, delay: 0.3 },
        desc: 'Люмен выпускает три зеркальных дрона: они летят к точке (до 9) и 6 сек кружат над ней, раз в 0.9 сек жаля ближайшего врага (магический урон). Луч Люмена, прошедший рядом с дроном, отражается от него в ближайшего вражеского героя — ещё один луч длиной 7 с половиной урона.',
        cast(h, p) { lumDrones(h, p.x, p.z, 6, D(h, 18, 5, 0, 0.15)); }
      },
      {
        key: 'E', name: 'Фазовый сдвиг', icon: 'lumphase', cd: 13, cost: 65, range: 6, ind: { type: 'circle', r: 0.9 }, anim: 'cast', animDur: 0.3, lock: 0.1, ai: { t: 'escape' },
        desc: 'Люмен рассыпается светящимися кубиками и собирается в точке до 6. Там, где он стоял, через 0.5 сек срабатывает электромагнитный импульс: магический урон, замедление на 40% на 1.5 сек и безмолвие на 0.8 сек всем врагам в радиусе 3.2.',
        cast(h, p) { lumPhase(h, p.x, p.z, D(h, 65, 17, 0, 0.5)); }
      },
      {
        key: 'R', name: 'Протокол «Сверхновая»', icon: 'lumnova', cd: 90, cost: 120, range: 16, ind: { type: 'line', w: 2.5, fixed: true }, anim: 'supernova', animDur: 3, lock: 0.3, ai: { t: 'shot', r: 14, ult: true, hp: 0.8 },
        desc: 'Люмен упирается ногами и 3 сек бьёт из ядра в груди огромным лучом длиной 16: все враги в нём каждые 0.15 сек получают магический урон и замедляются на 30%. Луч можно вести — он медленно поворачивается за курсором. Под конец вся линия взрывается. Оглушение обрывает протокол. Дроны отражают и этот луч.',
        cast(h, p) { lumNova(h, p.dir, 3, D(h, 15, 5, 0, 0.1), D(h, 90, 30, 0, 0.6)); }
      }
    ]
  },
  /* ================= 64. Azzar ================= */
  {
    id: 'azzar', name: 'Аззар', title: 'Владыка Великой Гробницы', role: 'mage', roleName: 'Владыка нежити', build: 'mage', bars: [5, 3, 4, 1], diffc: 2, atkSfx: 'cast', projMesh: 'orb',
    lore: 'Когда-то он был просто игроком. Теперь Аззар — высшая нежить, скелет в чёрной мантии с золотом, верховный владыка Великой Гробницы, и за его спиной стоят легионы. Он знает сотни заклинаний и холодно выбирает нужное: сжать сердце врага на расстоянии, поднять из земли рыцаря смерти, открыть чёрную дыру. А если он начертил под ногами огромный круг — бежать поздно: это сверхмагия.',
    look: { bulk: 1.0, h: 1.08, scale: 1.05, c1: 0x15121c, c2: 0x3e1660, c3: 0x1a1420, metal: AZZ.gold, skin: AZZ.bone, hands: AZZ.bone, cuff: 0x3e1660, glow: AZZ.c, head: 'azzar', chest: 'lich', robe: true, sh: 'lich', weapon: 'lichstaff', wc: 'staff', cape: 0x1a1024 },
    stats: ST(580, 84, 520, 52, 44, 2.2, 22, 2.5, 0.64, 8.6, 6.5),
    innate: { name: 'Высшая нежить', icon: 'azzinn', desc: 'Низшая магия Аззара не берёт: удар умением слабее 6% его здоровья наносит вдвое меньше урона. Вокруг него — аура отчаяния: враги в радиусе 5.5 наносят на 8% меньше урона.' },
    preHurt(h, src, d, type, o) { return !o.basic && d < h.maxHp * 0.06 ? d * 0.5 : d; },
    tick(h, dt) {
      h.despT = (h.despT || 0) - dt; if (h.despT <= 0) { h.despT = 0.5; for (const e of enemiesIn(h, h.x, h.z, 5.5)) if (!e.struct) addBuff(e, { id: 'despair', dur: 0.7, dmgOut: 0.92, src: h }); }
      if (FX.near(h.x, h.z, 40) && Math.random() < dt * 5) { const a = rand(TAU), r = rand(0.5, 2.2); FX.burst(h.x + Math.sin(a) * r, 0.2, h.z + Math.cos(a) * r, { smoke: true, n: 1, color: 0x2a0a3a, color2: 0x050208, speed: [0.1, 0.4], life: [0.8, 1.3], size: [0.6, 1.2], up: 0.6, a: 0.35 }); }
    },
    onDeath(h) { if (h.knight && h.knight.alive) kill(h.knight, null); },
    abilities: [
      {
        key: 'Q', name: 'Хватка сердца', icon: 'azzheart', cd: 10, cost: 70, range: 8, ind: { type: 'target', hero: true }, anim: 'crush', animDur: 0.75, lock: 0.3, ai: { t: 'target' },
        desc: 'Аззар протягивает руку — и сердце вражеского героя (до 8) призрачно бьётся у него в ладони. Через 0.55 сек он сжимает кулак: магический урон и оглушение на 1 сек. Если после этого у врага меньше 15% здоровья, сердце не выдерживает — враг погибает.',
        cast(h, p) { const t = p.unit; if (!t || t.kind !== 'hero') return false; azGrasp(h, t, D(h, 95, 25, 0, 0.7)); }
      },
      {
        key: 'W', name: 'Рыцарь смерти', icon: 'azzknight', cd: 22, cost: 90, range: 5, ind: { type: 'circle', r: 1.5 }, anim: 'arise', animDur: 0.6, lock: 0.3, ai: { t: 'point', rad: 3, delay: 0.5 },
        desc: 'Аззар поднимает из земли рыцаря смерти (до 5) на 15 сек: огромный, в чёрных латах, с волнистым мечом и башенным щитом. Поднявшись, рыцарь ревёт — враги в радиусе 3.5 на 1.1 сек обязаны бить его. Рыцарь переживает один смертельный удар: остаётся с 1 здоровья и звереет. Новый рыцарь заменяет прежнего.',
        cast(h, p) { azKnight(h, p.x, p.z); }
      },
      {
        key: 'E', name: 'Чёрная дыра', icon: 'azzhole', cd: 14, cost: 80, range: 9, ind: { type: 'circle', r: 4.6 }, anim: 'cast', animDur: 0.5, lock: 0.25, ai: { t: 'point', rad: 4.6, delay: 0.4 },
        desc: 'В точке (до 9) на 2 сек открывается чёрная дыра: она затягивает к себе всех врагов в радиусе 4.6 и рвёт их (магический урон каждые 0.25 сек), а затем схлопывается — ещё удар и замедление на 40% в радиусе 3.',
        cast(h, p) { azBlackHole(h, p.x, p.z, D(h, 14, 4, 0, 0.12), D(h, 70, 20, 0, 0.5)); }
      },
      {
        key: 'R', name: 'Сверхмагия: Дар Тёмной Матери', icon: 'azzsuper', cd: 110, cost: 150, range: 0, ind: { type: 'self', r: 10 }, anim: 'overload', animDur: 1.6, lock: 1.5, ai: { t: 'nova', r: 8, ult: true, hp: 0.6, rad: 10 },
        desc: 'Сверхмагия. Под Аззаром раскрывается огромный круг рун радиусом 10; 1.5 сек он не может двигаться, но и прервать его нельзя. Затем по кругу прокатывается волна чёрной смерти: огромный магический урон вражеским героям (миньонам и зверям — 60%) и замедление на 40% на 2 сек. Вражеский герой, у которого остаётся меньше 20% здоровья, погибает — его утаскивают щупальца Тёмной Матери.',
        cast(h) { azSuper(h, D(h, 210, 65, 0, 1.0)); }
      }
    ]
  }
);

/* ---------- icons ---------- */
Object.assign(GLYPH, {
  // a lens with three focus marks
  luminn(T) { T.O(0, 0, 13, 4); T.C(0, 0, 6); for (let i = 0; i < 3; i++) { const a = i / 3 * TAU - HPI; T.C(Math.cos(a) * 21, Math.sin(a) * 21, 3.2); } T.hi(() => T.C(-3, -3, 2)); },
  // a beam laid across the ground from a start point, the line burning behind it
  lumray(T) { T.al(0.35, () => T.S(14, -14, 14, 20, -20)); T.S(6, -14, 14, 20, -20); T.C(-16, 16, 6); for (const [x, y] of [[-4, 12], [4, 4], [12, -4]]) T.al(0.5, () => T.C(x + 4, y + 6, 2)); T.hi(() => T.C(-16, 16, 2.2)); },
  // three prisms round a point, a ray bouncing off one
  lumdrone(T) { for (const [x, y] of [[-14, -10], [14, -10], [0, 14]]) T.P(x, y - 8, x + 6, y, x, y + 8, x - 6, y); T.al(0.6, () => T.S(3, -24, 22, 0, 14, 22, -22)); },
  // a figure breaking into squares, a spark where it stood
  lumphase(T) { for (const [x, y, s] of [[-14, -10, 7], [-6, -2, 6], [-14, 6, 5], [-2, 12, 4], [6, -12, 4]]) T.g.fillRect(x, y, s, s); T.al(0.5, () => T.O(14, 8, 9, 3)); T.bolt(14, 8, 0.45); },
  // a great beam out of a core
  lumnova(T) { T.C(-14, 0, 9); T.cut(() => T.C(-14, 0, 4)); T.P(-6, -8, 26, -16, 26, 16, -6, 8); T.al(0.4, () => T.P(-6, -14, 26, -24, 26, 24, -6, 14)); T.hi(() => T.C(-14, 0, 2)); },
  // a skull with two red points
  azzinn(T) { T.C(0, -4, 15); T.g.fillRect(-9, 6, 18, 11); T.cut(() => { T.C(-6, -4, 4.4); T.C(6, -4, 4.4); T.P(0, 2, -2.5, 7, 2.5, 7); for (let i = -2; i <= 2; i++) T.g.fillRect(i * 3.6 - 1, 12, 2, 5); }); T.hi(() => { T.C(-6, -4, 1.6); T.C(6, -4, 1.6); }); },
  // a bony hand closing on a heart
  azzheart(T) { T.heart(4, 4, 0.75); for (let i = 0; i < 4; i++) T.S(3, -18 + i * 6, -22, -14 + i * 6, -6, -6 + i * 4, 2); T.S(3, -22, 4, -10, 10, 0, 10); },
  // a knight's great helm with horns and a slit
  azzknight(T) { T.P(-12, -10, 12, -10, 13, 14, 0, 22, -13, 14); T.cut(() => T.g.fillRect(-9, -2, 18, 3)); T.P(-12, -10, -22, -24, -16, -6); T.P(12, -10, 22, -24, 16, -6); T.hi(() => { T.C(-5, -1, 1.4); T.C(5, -1, 1.4); }); },
  // a black core in a tilted ring
  azzhole(T) { T.E(0, 2, 24, 8, 3.5, -0.3); T.C(0, 0, 9); T.al(0.4, () => T.E(0, 2, 17, 5, 2.5, -0.3)); T.hi(() => T.A(0, 0, 11, 3.6, 4.6, 2)); },
  // a vast circle of runes
  azzsuper(T) { T.O(0, 0, 22, 2.5); T.O(0, 0, 15, 2); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; T.C(Math.cos(a) * 18.5, Math.sin(a) * 18.5, 2.4); } T.star(0, 0, 10, 4, 6); T.hi(() => T.C(0, 0, 2)); }
});
