'use strict';
/* ===== roster, part 47 (hero 75). Loaded after roster20.js; glyphs go to GLYPH at the end.
   75. Miro — the fog cardsharp: a marksman who never fights alone. Mist doubles of himself stand at his shoulders and shoot whenever he shoots;
       a fan of bullets that every double repeats, a sidestep that leaves a decoy to burst in the enemy's face, a gate of mist that gilds every
       allied projectile flying through it, and «A thousand faces» — three more doubles join for a few seconds, volley on their own and at the
       end throw themselves at the enemy.
   New mechanics here: the doubles are ghost copies of the hero's own rig, animated by animHero through a stand-in unit (no units, no
   targeting, nothing to kill); the gate watches G.proj and wraps the onHit of any allied projectile that crosses its line. ===== */
const MR = { c: 0x5ae8d8, pale: 0xd8fff8, gold: 0xe8c878, deep: 0x1a4a52, vio: 0x8aa0ff };
const MR_SLOTS = [[2.35, 1.9], [-2.35, 1.9], [1.35, 2.5], [-1.35, 2.5], [Math.PI, 2.3]];   // [angle from his facing, distance]
let _mrMats = null, _mrGateG = null;
function mrMats() {
  if (!_mrMats) _mrMats = {
    body: new THREE.MeshPhongMaterial({ flatShading: true, color: 0x9adcd6, emissive: 0x1a6a6a, specular: 0xd8fff8, shininess: 30, transparent: true, opacity: 0.42, depthWrite: false }),
    glow: new THREE.MeshBasicMaterial({ color: MR.c, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending })
  };
  return _mrMats;
}
// a ghost copy of the hero's own model: every surface made of pale mist, the glowing parts left glowing
function mrGhostRig(h) {
  const rig = buildHero(h.def.look, 0xffffff), M = mrMats(); rig.ring.visible = false;
  rig.root.traverse(o => { if (!o.isMesh) return; const m = o.material; if (!m || m.map) { o.visible = false; return; } o.material = m.isMeshBasicMaterial ? M.glow : M.body; o.renderOrder = 12; });
  rig.mats = [new THREE.MeshPhongMaterial()];
  return rig;
}
function mrPuff(x, z, big) {
  if (!FX.near(x, z, 50)) return;
  FX.burst(x, 1, z, { smoke: true, n: big ? 10 : 5, color: 0x9adcd6, color2: 0x2a5a60, speed: [0.5, 2], life: [0.5, 0.9], size: [0.8, 1.6], up: 1.5, rad: 0.6, a: 0.45 });
  FX.sparks(x, 1.2, z, { n: big ? 10 : 5, color: MR.pale, color2: MR.c, speed: [1, 4], life: [0.25, 0.5], up: 2, w: 0.06 });
}
// the doubles' manager: one actor per hero while any double exists
function mrActor(h) {
  if (h.mrAct) return; h.mrAct = true;
  let vol = 0;
  G.actors.push({ update(dt) {
    const L = h.mrD || [];
    if (h.mrVolleyUntil > G.time && h.alive) { vol += dt; if (vol >= 1) { vol -= 1; mrVolley(h); } } else vol = 0;
    for (let i = L.length - 1; i >= 0; i--) { const d = L[i]; if (mrStep(h, d, dt)) { L.splice(i, 1); G.scene.remove(d.rig.root); } }
    if (!L.length) { h.mrAct = false; return false; }
    return true;
  } });
}
// spawn a double; kind 'reg' (the innate, at most 2), 'ult' (from the ultimate) or 'decoy' (stays where it was left)
function mrSpawn(h, kind, dur, x, z) {
  const L = h.mrD || (h.mrD = []);
  const used = L.filter(d => d.kind !== 'decoy').map(d => d.slot);
  let slot = -1; const want = kind === 'ult' ? [2, 3, 4, 0, 1] : [0, 1, 2, 3, 4];
  if (kind !== 'decoy') { for (const s of want) if (!used.includes(s)) { slot = s; break; } if (slot < 0) return null; }
  const rig = mrGhostRig(h), f = { id: 900 + Math.floor(Math.random() * 99), rig, facing: h.facing, moving: false, ms: h.ms, yOff: 0, flash: 0, dead: false,
    anim: { walk: 0, atkT: 0, atkDur: 1, castT: 0, castDur: 1, castType: 'cast', deathT: 0, spinA: 0, alt: false } };
  let px = x, pz = z;
  if (px === undefined) { const S = MR_SLOTS[slot], a = h.facing + S[0]; px = h.x + Math.sin(a) * S[1]; pz = h.z + Math.cos(a) * S[1]; }
  rig.root.position.set(px, 0, pz); rig.root.rotation.y = h.facing; rig.root.scale.setScalar(0.2); G.scene.add(rig.root);
  const d = { rig, f, x: px, z: pz, kind, slot, born: G.time, until: G.time + dur, strike: null };
  L.push(d); mrActor(h); mrPuff(px, pz, false); SFX.at('mist', px, pz, 0.3);
  return d;
}
function mrCount(h) { return (h.mrD || []).filter(d => d.kind === 'reg').length; }
// one frame of one double; returns true when it is gone
function mrStep(h, d, dt) {
  const f = d.f, A = f.anim; if (A.atkT > 0) A.atkT -= dt; if (A.castT > 0) A.castT -= dt;
  const age = G.time - d.born; d.rig.root.scale.setScalar(Math.min(1, 0.2 + age * 3.2));
  if (d.strike) {   // the last act of an ultimate double: it throws itself at an enemy and bursts
    const s = d.strike, t = s.tgt && s.tgt.alive ? s.tgt : null; if (t) { s.x = t.x; s.z = t.z; }
    const dx = s.x - d.x, dz = s.z - d.z, dd = Math.hypot(dx, dz), st = 26 * dt; s.t += dt;
    if (dd > 0.01) f.facing = Math.atan2(dx, dz);
    if (dd <= st + 0.6 || s.t > 0.7) { mrStrikeBurst(h, d.x + (dd > 0 ? dx / dd * Math.min(dd, st) : 0), d.z + (dd > 0 ? dz / dd * Math.min(dd, st) : 0), s.dmg); return true; }
    d.x += dx / dd * st; d.z += dz / dd * st; f.moving = true; f.ms = 26;
    if (FX.near(d.x, d.z, 45)) FX.trail(d.x, 1.2, d.z, MR.c, 0.9, 2);
  } else {
    if (!h.alive || G.time > d.until) {
      if (d.kind === 'ult' && h.alive) { const t = mrNearest(h, d.x, d.z, 9); if (t) { d.strike = { tgt: t, x: t.x, z: t.z, t: 0, dmg: h.mrStrikeDmg || 100 }; SFX.at('whoosh', d.x, d.z, 0.4); return false; } }
      if (d.kind === 'decoy' && d.onEnd) d.onEnd(d);
      mrPuff(d.x, d.z, d.kind === 'decoy'); return true;
    }
    if (d.kind !== 'decoy') {
      const S = MR_SLOTS[d.slot], a = h.facing + S[0], tx = h.x + Math.sin(a) * S[1], tz = h.z + Math.cos(a) * S[1], k = Math.min(1, dt * 7);
      const mx = (tx - d.x) * k, mz = (tz - d.z) * k; d.x += mx; d.z += mz; f.moving = Math.hypot(tx - d.x, tz - d.z) > 0.35; f.ms = h.ms;
      const o = h.order && h.order.type === 'attack' && h.order.tgt && h.order.tgt.alive ? h.order.tgt : null;
      f.facing = o && udist(o, d) < 16 ? Math.atan2(o.x - d.x, o.z - d.z) : h.facing;
    } else f.moving = false;
  }
  d.rig.root.position.x = d.x; d.rig.root.position.z = d.z;
  if (FX.near(d.x, d.z, 55)) { animHero(f, dt); if (Math.random() < dt * 3) FX.burst(d.x + rand(-0.3, 0.3), 0.3, d.z + rand(-0.3, 0.3), { smoke: true, n: 1, color: 0x9adcd6, color2: 0x2a5a60, speed: [0.2, 0.5], life: [0.5, 0.8], size: [0.5, 0.9], up: 1, a: 0.3 }); }
  return false;
}
function mrNearest(h, x, z, r) {
  let best = null, bd = 1e9;
  for (const e of enemiesIn(h, x, z, r)) { if (e.struct) continue; const dd = dist(x, z, e.x, e.z) - (e.kind === 'hero' ? 4 : 0); if (dd < bd) { bd = dd; best = e; } }
  return best;
}
// where a pistol held by a figure at (x, z) facing `dir` fires from
function mrMuzzle(x, z, dir) { const s = Math.sin(dir), c = Math.cos(dir); return { x: x + s * 0.95 + c * 0.3, y: 1.5, z: z + c * 0.95 - s * 0.3 }; }
function mrBullet(h, fx, fz, t, dmg, o) {
  o = o || {}; const dir = Math.atan2(t.x - fx, t.z - fz), m = mrMuzzle(fx, fz, dir);
  if (FX.near(m.x, m.z, 45)) { FX.glow(m.x, m.y, m.z, o.big ? 1.6 : 1, o.col || MR.c, 0.1, 'star'); FX.sparks(m.x, m.y, m.z, { n: 3, color: MR.pale, speed: [3, 7], life: [0.1, 0.2] }); }
  return homing(h, t, { speed: 40, color: o.col || MR.c, size: o.size || 0.4, mesh: 'bolt', y: m.y, x: m.x, z: m.z,
    onHit: tt => { if (o.basic) basicHit(h, tt); else damage(h, tt, dmg, 0); if (FX.near(tt.x, tt.z, 45)) FX.hit(tt.x, tt.height * 0.55, tt.z, o.col || MR.c, false); } });
}
// every double repeats Miro's attack: a weaker mist bullet into the same target
function mrEcho(h, t) {
  const L = (h.mrD || []).filter(d => d.kind !== 'decoy' && !d.strike); let i = 0;
  for (const d of L) { const k = i++; after(0.05 + k * 0.05, () => { if (!h.alive || !t.alive || d.strike) return; d.f.facing = Math.atan2(t.x - d.x, t.z - d.z); d.f.anim.atkDur = 0.3; d.f.anim.atkT = 0.3; mrBullet(h, d.x, d.z, t, h.ad * 0.25, { size: 0.32 }); }); }
  if (L.length) SFX.at('gunshot', h.x, h.z, 0.15 + L.length * 0.04);
}
// during the ultimate: once a second every double fires on its own at the nearest enemy
function mrVolley(h) {
  const dmg = D(h, 14, 5, 0.25, 0);
  for (const d of h.mrD || []) { if (d.kind === 'decoy' || d.strike) continue; const t = mrNearest(h, d.x, d.z, 10); if (!t) continue; d.f.facing = Math.atan2(t.x - d.x, t.z - d.z); d.f.anim.atkDur = 0.3; d.f.anim.atkT = 0.3; mrBullet(h, d.x, d.z, t, dmg, { col: MR.pale }); }
  SFX.at('gunshot', h.x, h.z, 0.3);
}
function mrStrikeBurst(h, x, z, dmg) {
  for (const e of enemiesIn(h, x, z, 2.2)) { if (e.struct) continue; damage(h, e, dmg, 0); if (e.alive) slow(h, e, 0.3, 1, 'mrstrike'); }
  SFX.at('boom', x, z, 0.35); SFX.at('mist', x, z, 0.5);
  if (FX.near(x, z, 50)) { FX.ring(x, z, { r0: 0.3, r1: 2.6, color: MR.c, life: 0.35, tex: 'shock' }); FX.glow(x, 1.2, z, 3.5, MR.pale, 0.25, 'flare'); mrPuff(x, z, true); FX.shock(x, z, 2.4, 0.8, 0.3); }
}
// «Mist gate»: an arch of mist across the field; allied projectiles flying through it are gilded (they hit for extra magic damage from Miro),
// enemies walking through it are slowed
function mrGateMesh(L) {
  if (!_mrGateG) _mrGateG = { post: new THREE.CylinderGeometry(0.11, 0.14, 2.4, 6), arch: new THREE.TorusGeometry(1, 0.09, 6, 24, Math.PI), plane: new THREE.PlaneGeometry(1, 1) };
  const G0 = _mrGateG, g = new THREE.Group();
  const gold = new THREE.MeshBasicMaterial({ color: MR.gold }), glow = new THREE.MeshBasicMaterial({ color: MR.c, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }),
    veil = new THREE.MeshBasicMaterial({ color: MR.c, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  for (const sd of [-1, 1]) { const p = new THREE.Mesh(G0.post, gold); p.position.set(sd * L, 1.2, 0); p.userData.own = true; g.add(p); const c = new THREE.Mesh(G0.post, glow); c.scale.set(0.5, 1.02, 0.5); c.position.set(sd * L, 1.2, 0); c.userData.own = true; g.add(c); }
  const a = new THREE.Mesh(G0.arch, glow); a.scale.set(L, L * 0.5, 1); a.position.y = 2.4; a.userData.own = true; g.add(a);
  const v = new THREE.Mesh(G0.plane, veil); v.scale.set(L * 2, 2.4 + L * 0.5, 1); v.position.y = (2.4 + L * 0.5) / 2; v.userData.own = true; g.add(v);
  g.userData.veil = veil; g.userData.glow = glow; return g;
}
function mrGate(h, x, z, dir, DUR, gd) {
  const L = 2.4, nx = Math.sin(dir), nz = Math.cos(dir), tx = Math.cos(dir), tz = -Math.sin(dir), prev = new Map(), gilded = [];
  let pulse = 0;
  SFX.at('mist', x, z, 0.8); SFX.at('chime', x, z, 0.4);
  if (FX.near(x, z, 60)) {
    const g = mrGateMesh(L); g.position.set(x, 0, z); g.rotation.y = dir;
    FX.add(g, DUR, (k, me, dt) => { const e = k * DUR, up = Math.min(1, e * 4), out = Math.min(1, (DUR - e) * 3); me.scale.set(1, up * out + 0.001, 1); pulse = Math.max(0, pulse - dt * 3); me.userData.veil.opacity = 0.14 + 0.05 * Math.sin(e * 5) + pulse * 0.35; });
    FX.ring(x, z, { r0: 0.4, r1: 3, color: MR.c, life: 0.4, tex: 'shock' }); mrPuff(x - tx * L, z - tz * L, true); mrPuff(x + tx * L, z + tz * L, true);
  }
  let t = 0, acc = 0, fxT = 0;
  G.actors.push({ update(dt) {
    t += dt; acc += dt; fxT += dt;
    for (const p of G.proj) {
      if (!p.src || p.src.team !== h.team || p.mrGold) continue;
      const q = prev.get(p); prev.set(p, { x: p.x, z: p.z }); if (!q) continue;
      const s0 = (q.x - x) * nx + (q.z - z) * nz, s1 = (p.x - x) * nx + (p.z - z) * nz; if (s0 * s1 > 0 || s0 === s1) continue;
      const k = s0 / (s0 - s1), ix = q.x + (p.x - q.x) * k, iz = q.z + (p.z - q.z) * k; if (Math.abs((ix - x) * tx + (iz - z) * tz) > L) continue;
      p.mrGold = true; gilded.push(p); pulse = 1;
      const o0 = p.o, f0 = o0.onHit; let done = false;
      p.o = Object.assign({}, o0, { color: MR.gold, onHit(u, pp) { f0(u, pp); if (done || !u.alive || u.struct) return; done = true; damage(h, u, gd, 1); SFX.at('coin', u.x, u.z, 0.3); if (FX.near(u.x, u.z, 45)) { FX.glow(u.x, u.height * 0.6, u.z, 2.6, MR.gold, 0.2, 'star'); FX.sparks(u.x, u.height * 0.6, u.z, { n: 8, color: MR.gold, color2: MR.pale, speed: [2, 6], life: [0.2, 0.4] }); } } });
      if (FX.near(ix, iz, 45)) { FX.glow(ix, p.y, iz, 2.2, MR.gold, 0.15, 'star'); FX.sparks(ix, p.y, iz, { n: 6, color: MR.gold, speed: [2, 5], life: [0.15, 0.3] }); }
      SFX.at('chime', ix, iz, 0.15);
    }
    if (prev.size > 64) for (const k of prev.keys()) if (!G.proj.includes(k)) prev.delete(k);
    for (let i = gilded.length - 1; i >= 0; i--) { const p = gilded[i]; if (!G.proj.includes(p)) { gilded.splice(i, 1); continue; } if (FX.near(p.x, p.z, 45)) FX.trail(p.x, p.y, p.z, MR.gold, 0.7, 2); }
    if (acc >= 0.25) {
      acc -= 0.25;
      for (const e of enemiesIn(h, x, z, L + 1.5)) { if (e.struct) continue; const s = (e.x - x) * nx + (e.z - z) * nz, a = (e.x - x) * tx + (e.z - z) * tz; if (Math.abs(s) < 0.9 + e.radius && Math.abs(a) < L) slow(h, e, 0.35, 0.6, 'mrgate'); }
    }
    if (fxT > 0.08 && FX.near(x, z, 50)) { fxT = 0; const a = rand(-L, L); FX.sparks(x + tx * a, rand(0.3, 2.6), z + tz * a, { n: 1, color: Math.random() < 0.3 ? MR.gold : MR.pale, speed: [0.3, 0.8], life: [0.4, 0.7], up: 1.5, grav: 0, w: 0.05 }); }
    if (t >= DUR) { if (FX.near(x, z, 50)) { mrPuff(x, z, true); FX.ring(x, z, { r0: 2.6, r1: 0.4, color: MR.c, life: 0.3, tex: 'ringThin' }); } return false; }
    return true;
  } });
}

HEROES.push(
  /* ================= 75. Miro ================= */
  {
    id: 'miro', name: 'Миро', title: 'Туманный шулер', role: 'marks', roleName: 'Стрелок', build: 'marks', bars: [4, 2, 3, 3], diffc: 3, projMesh: 'bolt', atkSfx: 'gunshot',
    lore: 'Миро торговал слухами в портовых кабаках у Разлома, пока не выиграл в карты у старого контрабандиста флакон живого тумана. Туман оказался с характером: он запоминает лицо хозяина и повторяет каждый его жест. С тех пор Миро никогда не садится за стол один — рядом с ним всегда пара его же копий, и никто не знает, какая из них настоящая. Сам он уверяет, что все три.',
    look: { bulk: 0.86, h: 1.06, scale: 1.0, c1: 0x4e5e66, c2: 0x262c32, c3: 0x16191c, skin: 0xecd6c6, hands: 0x1a1e22, cuff: 0x2a3a40, metal: MR.gold, glow: MR.c, head: 'miro', hair: 0xc8dcdc, shirt: 0x1a1e24, lin: MR.c, coat: 0x4e5e66, chest: 'fogcoat', legs: 'suit', sh: 'none', weapon: 'fogpistol', wc: 'pistol' },
    stats: ST(560, 82, 310, 36, 57, 3.2, 21, 2.3, 0.78, 9.1, 8.5),
    init(h) { h.mrD = []; h.mrAct = false; h.mrN = 0; h.mrVolleyUntil = 0; },
    innate: { name: 'Туманные двойники', icon: 'mrinn', desc: 'Каждая третья атака Миро вызывает двойника из тумана (до 2, живёт 6 сек). Двойники держатся у него за плечами и повторяют каждую его атаку: их пуля бьёт ту же цель на 25% урона атаки. Двойников нельзя атаковать, и они исчезают, если Миро погибнет.', count: h => mrCount(h) },
    shootAtk(u, t) {
      SFX.at('gunshot', u.x, u.z, 0.4);
      mrBullet(u, u.x, u.z, t, 0, { basic: true, big: true, size: 0.45 });
      mrEcho(u, t);
      u.mrN = (u.mrN || 0) + 1; if (u.mrN % 3 === 0 && mrCount(u) < 2) mrSpawn(u, 'reg', 6);
    },
    abilities: [
      {
        key: 'Q', name: 'Шулерский веер', icon: 'mrfan', cd: 7, cost: 50, range: 10, ind: { type: 'line', w: 2.6, fixed: true }, anim: 'shoot', animDur: 0.4, lock: 0.25, ai: { t: 'shot', sp: 34, farm: true },
        desc: 'Миро веером выпускает три пули (до 10): каждая бьёт первого врага на пути физическим уроном. Каждый двойник повторяет веер из своего места — его пули наносят 40% урона.',
        cast(h, p) {
          const dir = p.dir, dmg = D(h, 40, 12, 0.5, 0);
          const fan = (fx, fz, k, col, sz) => { for (let i = -1; i <= 1; i++) { const a = dir + i * 0.13, m = mrMuzzle(fx, fz, a);
            shot(h, { dir: a, speed: 34, range: 10, w: 0.5, mesh: 'bolt', size: sz, color: col, x: m.x, z: m.z, y: m.y,
              onHit: e => { damage(h, e, dmg * k, 0); if (FX.near(e.x, e.z, 45)) FX.hit(e.x, e.height * 0.55, e.z, col, false); } }); }
            if (FX.near(fx, fz, 50)) { const m = mrMuzzle(fx, fz, dir); FX.glow(m.x, m.y, m.z, 2.2, col, 0.14, 'star'); FX.sparks(m.x, m.y, m.z, { n: 8, color: MR.pale, speed: [4, 9], life: [0.12, 0.25] }); } };
          fan(h.x, h.z, 1, MR.c, 0.55); SFX.at('gunshot', h.x, h.z, 0.7); SFX.at('cardfan', h.x, h.z, 0.6);
          let i = 0; for (const d of h.mrD) { if (d.kind === 'decoy' || d.strike) continue; const k = i++; after(0.06 + k * 0.06, () => { if (!h.alive || d.strike) return; d.f.facing = dir; d.f.anim.castType = 'shoot'; d.f.anim.castDur = 0.35; d.f.anim.castT = 0.35; fan(d.x, d.z, 0.4, MR.pale, 0.4); SFX.at('gunshot', d.x, d.z, 0.3); }); }
        }
      },
      {
        key: 'W', name: 'Отвод глаз', icon: 'mrstep', cd: 11, cost: 45, range: 5.5, ind: { type: 'circle', r: 0.8 }, anim: 'roll', animDur: 0.32, lock: 0, ai: { t: 'escape', kite: true },
        desc: 'Миро отскакивает в точку (до 5.5), а на старом месте остаётся двойник-приманка. Через 1.2 сек приманка взрывается туманом: враги в радиусе 3 получают физический урон, на 1.2 сек слепнут (их атаки промахиваются) и замедляются на 25%. Если двойников меньше двух, Миро сразу получает ещё одного.',
        cast(h, p) {
          const sx = h.x, sz = h.z, burst = D(h, 55, 16, 0.6, 0);
          const dcy = mrSpawn(h, 'decoy', 1.2, sx, sz);
          if (dcy) { dcy.f.facing = h.facing; dcy.rig.root.scale.setScalar(1); dcy.born = G.time - 1; dcy.onEnd = d => {
            for (const e of enemiesIn(h, d.x, d.z, 3)) { if (e.struct) continue; damage(h, e, burst, 0); if (e.alive) { addBuff(e, { id: 'mrblind', dur: 1.2, blind: true, src: h }); slow(h, e, 0.25, 1.5, 'mrdecoy'); } }
            SFX.at('mist', d.x, d.z, 0.8); SFX.at('boom', d.x, d.z, 0.35);
            if (FX.near(d.x, d.z, 55)) { FX.ring(d.x, d.z, { r0: 0.4, r1: 3.2, color: MR.c, life: 0.4, tex: 'shock' }); FX.glow(d.x, 1.2, d.z, 4, MR.pale, 0.25, 'flare'); FX.shock(d.x, d.z, 3, 1, 0.35); for (let i = 0; i < 3; i++) mrPuff(d.x + rand(-1.2, 1.2), d.z + rand(-1.2, 1.2), true); }
          }; }
          dashTo(h, p.x, p.z, 28, { ribbon: MR.c });
          if (mrCount(h) < 2) after(0.2, () => { if (h.alive) mrSpawn(h, 'reg', 6); });
          SFX.at('whoosh', h.x, h.z, 0.5); SFX.at('mist', h.x, h.z, 0.4);
        }
      },
      {
        key: 'E', name: 'Врата обмана', icon: 'mrgate', cd: 14, cost: 60, range: 9, ind: { type: 'circle', r: 2.4 }, anim: 'cast', animDur: 0.4, lock: 0.2,
        ai: { t: 'fn', fn: h => { const t = mrNearest(h, h.x, h.z, 10); if (!t || t.kind !== 'hero') return null; const k = Math.max(0.35, 1 - 2.5 / Math.max(2.6, udist(h, t))); return { x: h.x + (t.x - h.x) * k, z: h.z + (t.z - h.z) * k }; } },
        desc: 'Миро ставит в точке (до 9) врата из тумана поперёк своего взгляда на 6 сек. Любой снаряд союзника (его самого, двойников и союзных героев), пролетевший сквозь врата, становится золотым: при попадании он наносит цели ещё и магический урон от Миро. Враги, проходящие сквозь врата, замедляются на 35%.',
        cast(h, p) { const dir = angTo(h.x, h.z, p.x, p.z); mrGate(h, p.x, p.z, dir, 6, D(h, 12, 4, 0.15, 0)); }
      },
      {
        key: 'R', name: 'Тысяча лиц', icon: 'mrult', cd: 75, cost: 100, range: 0, ind: { type: 'self', r: 10 }, anim: 'heroic', animDur: 0.5, lock: 0.3, ai: { t: 'rally', r: 10, ult: true },
        desc: 'Миро рассыпается туманом (0.5 сек неуязвимости) и собирается вновь — с ним уже пятеро: два обычных двойника и ещё трое на 7 сек. Каждую секунду все двойники сами стреляют в ближайшего врага (физический урон), а атаки Миро они повторяют, как обычно. Когда время выходит, трое бросаются на ближайших врагов в радиусе 9 и взрываются: физический урон по области 2.2 и замедление.',
        cast(h) {
          h.mrStrikeDmg = D(h, 60, 20, 0.5, 0); h.mrVolleyUntil = G.time + 7;
          addBuff(h, { id: 'mrveil', dur: 0.5, invuln: true, src: h });
          for (const d of h.mrD) if (d.kind === 'reg') d.until = G.time + 7;
          while (mrCount(h) < 2) if (!mrSpawn(h, 'reg', 7)) break;
          for (let i = 0; i < 3; i++) after(0.12 + i * 0.1, () => { if (h.alive) mrSpawn(h, 'ult', 7 - 0.12 - i * 0.1); });
          SFX.at('ultcue', h.x, h.z, 0.7); SFX.at('mist', h.x, h.z, 1); SFX.at('cardfan', h.x, h.z, 0.8);
          if (FX.near(h.x, h.z, 60)) {
            FX.text(h.x, h.height + 1.3, h.z, 'Тысяча лиц!', '#8af0e4', 18);
            for (let i = 0; i < 6; i++) mrPuff(h.x + Math.sin(i / 6 * TAU) * 2.5, h.z + Math.cos(i / 6 * TAU) * 2.5, true);
            FX.ring(h.x, h.z, { r0: 0.4, r1: 5, color: MR.c, life: 0.5, tex: 'shock' }); FX.ring(h.x, h.z, { r0: 4.5, r1: 3, color: MR.gold, life: 0.6, tex: 'ringThin' });
            FX.zone(h.x, h.z, 4, MR.c, 1.2, { tex: 'rune2', spin: 1.5, op: 0.4 }); FX.glow(h.x, 1.5, h.z, 6, MR.pale, 0.35, 'flare'); FX.light(h.x, 3, h.z, MR.c, 2.5, 14, 0.5);
          }
        }
      }
    ]
  }
);

/* ---------- icons ---------- */
Object.assign(GLYPH, {
  // a figure with two fainter copies of itself behind
  mrinn(T) { T.al(0.35, () => { T.C(-14, -10, 6); T.P(-22, 22, -6, 22, -9, -2, -19, -2); T.C(14, -10, 6); T.P(6, 22, 22, 22, 19, -2, 9, -2); }); T.C(0, -14, 7); T.P(-10, 24, 10, 24, 7, -4, -7, -4); },
  // three bullets fanning out
  mrfan(T) { T.C(-20, 0, 5); for (const a of [-0.35, 0, 0.35]) T.al(a ? 0.75 : 1, () => T.S(4, -14, 0, -14 + Math.cos(a) * 36, Math.sin(a) * 36)); },
  // a figure dashing away from its own outline
  mrstep(T) { T.al(0.35, () => { T.C(-12, -12, 6); T.P(-20, 20, -4, 20, -7, -4, -17, -4); }); T.C(12, -12, 6); T.P(4, 20, 20, 20, 17, -4, 7, -4); T.al(0.6, () => T.S(3, -2, 4, 4, 4)); },
  // an arch gate with a bullet passing through, turning gold
  mrgate(T) { T.g.lineWidth = 4; T.g.beginPath(); T.g.arc(0, 0, 14, Math.PI, TAU); T.g.stroke(); T.g.fillRect(-16, 0, 4, 22); T.g.fillRect(12, 0, 4, 22); T.al(0.7, () => T.S(4, -26, 8, 26, 8)); T.star(22, 8, 7, 3, 4); },
  // a ring of masks
  mrult(T) { for (let i = 0; i < 5; i++) { const a = i / 5 * TAU - HPI; T.al(i ? 0.6 : 1, () => T.C(Math.cos(a) * 17, Math.sin(a) * 17, 6)); } T.C(0, 0, 7); }
});
