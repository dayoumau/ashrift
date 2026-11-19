'use strict';
/* ===== roster, parts 24–26: Reiner the armoured titan, Sung Jinwoo the shadow monarch, Misaka the railgun.
   Loaded after roster4.js (and so after icons.js): the glyphs are added to GLYPH at the end ===== */
const REI = { c: 0xffb04a, bolt: 0xffd27a, steam: 0xe8e4dc, hard: 0xf6dca0 };
const JNW = { c: 0xa060ff, deep: 0x2a0a5a, pale: 0xe0c8ff, red: 0xff4a6a };
const MIS = { c: 0x7ad8ff, rail: 0xffa040, pale: 0xe8f8ff };

/* ================= Reiner ================= */
// the armoured titan: a second rig built once per hero, swapped in for the human one while the transformation lasts
const REI_TITAN = { bulk: 1.45, h: 1.08, scale: 2.5, c1: 0xd9cfba, c2: 0xd9cfba, c3: 0x7a2c24, cuff: 0xd9cfba, skin: 0x8a3a30, hands: 0xd9cfba, metal: 0xece4d0, glow: 0xffb04a, head: 'armored', hair: 0xe8d090, chest: 'titan', legs: 'titan', sh: 'titan', weapon: 'titanfists', wc: 'fist', arm: 1.2 };
function reiTitan(h, on) {
  if (!!h.titan === on) return;
  const old = h.rig; let nr;
  if (on) { if (!h.titanRig) h.titanRig = buildHero(REI_TITAN, h.isPlayer ? 0xeaffea : TEAM_COL[h.team]); h.humanRig = old; nr = h.titanRig; h.radius = 1.5; }
  else { nr = h.humanRig || old; h.radius = 0.9; }
  G.scene.remove(old.root); h.rig = nr; nr.root.visible = true; nr.root.position.set(h.x, 0, h.z); nr.root.rotation.y = h.facing; nr.root.scale.setScalar(nr.sc0); nr.tilt.rotation.x = 0; G.scene.add(nr.root);
  h.height = nr.height; h.titan = on; h.anim.castT = 0; h.anim.atkT = 0;
}
// steam pouring off the titan's body (and off the husk when it ends)
function reiSteam(h, n, big) {
  if (!FX.near(h.x, h.z, 50)) return; const H = h.height || 3;
  FX.burst(h.x, H * (big ? 0.5 : 0.75), h.z, { smoke: true, n, color: 0xe8e4dc, color2: 0x8a8680, speed: [0.5, big ? 3 : 1.2], life: [0.8, 1.6], size: [big ? 2 : 1.2, big ? 4.5 : 2.6], up: 3, rad: big ? 2.4 : 1.2, a: 0.35, drag: 1.2 });
}
// hardening: a shell of amber hexagon crystals closes over the body
function reiHarden(h, dur) {
  r3Tex(); const m = new THREE.Mesh(frHexGeo(), FX.mat('hex', REI.hard, 0.7)), R = h.titan ? 4.6 : 2.1;
  return FX.add(m, dur, (k, me, dt, en) => {
    if (!h.alive) { en.dead = true; return; } const t = en.t, g = easeOut(Math.min(1, t / 0.18)), q = R * (0.5 + 0.5 * g);
    me.position.set(h.x, 0.05 + (h.yOff || 0), h.z); me.scale.set(q, q * (0.3 + 0.9 * g), q); me.rotation.y = -t * 0.4;
    me.material.opacity = (0.5 + 0.15 * Math.sin(t * 9)) * Math.min(1, (dur - t) / 0.3);
  });
}
// the transformation: a bolt of golden lightning out of a clear sky, a blast of fire and steam
function reiLightning(x, z) {
  if (!FX.near(x, z, 60)) return;
  for (let i = 0; i < 4; i++) after(i * 0.07, () => FX.bolt(x + rand(-1.5, 1.5), 36, z + rand(-1.5, 1.5), x + rand(-0.4, 0.4), 0.3, z + rand(-0.4, 0.4), { color: REI.bolt, w: 2.6 - i * 0.4, life: 0.3, jag: 1.8 }));
  FX.pillar(x, z, { r: 2.4, h: 40, color: 0xff8a1a, life: 0.6, op: 0.4 }); FX.pillar(x, z, { r: 0.8, h: 44, color: REI.bolt, life: 0.4, op: 0.5 });
  FX.glow(x, 3, z, 10, REI.c, 0.3, 'star'); FX.light(x, 6, z, REI.c, 3, 40, 0.8); FX.punch(1.2);
}

/* ================= Sung Jinwoo ================= */
// a shadow soldier's rig: the shape of whatever died (a hero's look, a beast, a plain knight), drawn in dark violet with burning eyes
const JIN_SHADE = { bulk: 1.0, h: 1.0, scale: 1.0, c1: 0x6a6a7a, c2: 0x55556a, c3: 0x3a3a48, metal: 0x8a8aa0, skin: 0x6a6a7a, glow: 0xa060ff, head: 'helm', chest: 'plate', sh: 'plate', weapon: 'sword', wc: 'melee' };
const JIN_IGRIS = { bulk: 1.15, h: 1.12, scale: 1.25, c1: 0x7a7a8a, c2: 0x5a5a6a, c3: 0x8a1a28, metal: 0x9a9ab0, skin: 0x6a6a7a, glow: 0xff3a5a, head: 'helm', chest: 'plate', sh: 'spike', weapon: 'sword', wc: 'melee', cape: 0x9a1424 };
function jinShadeRig(src, elite, team) {
  const rig = src.mrig ? buildMinion(src.mrig, 2, src.scale || 1) : buildHero(src.look, TEAM_COL[team]);
  const lit = new THREE.MeshPhongMaterial({ flatShading: true, color: elite ? 0x3a1e2c : 0x241c3a, emissive: elite ? 0x2a0812 : 0x1c0a3a, shininess: 40, specular: 0x7a5ab0 }), glow = new THREE.MeshBasicMaterial({ color: elite ? JNW.red : JNW.c });
  rig.root.traverse(o => { if (!o.isMesh || o === rig.ring) return; const m = o.material; if (!m || m.map) return; if (m.isMeshBasicMaterial) o.material = glow; else o.material = lit; });
  rig.mats = [new THREE.MeshPhongMaterial()]; rig.shade = true; return rig;   // the hit flash goes to a spare material: the violet glow of the shadow stays
}
// a fallen enemy leaves its shadow on the ground for a while: a black pool with a violet flame flickering over it
function jinCorpseFx(c) {
  if (!FX.near(c.x, c.z, 70)) return null;
  const m = new THREE.Mesh(FX.geo.flat, FX.mat('fill', 0x0a0412, 0.8, false)); m.position.set(c.x, 0.06, c.z); m.renderOrder = 4; const S = (c.hero ? 1.6 : 1.1) * 2 * RK;
  return FX.add(m, Math.max(0.1, c.until - G.time), (k, me, dt, en) => {
    const t = en.t; me.scale.set(S * Math.min(1, t / 0.4), 1, S * Math.min(1, t / 0.4)); me.material.opacity = 0.8 * Math.min(1, (en.life - t) / 0.5);
    if (Math.random() < dt * (c.hero ? 8 : 3) && FX.near(c.x, c.z, 45)) FX.sparks(c.x + rand(-0.5, 0.5), 0.2, c.z + rand(-0.5, 0.5), { n: 1, color: JNW.pale, color2: JNW.c, speed: [0.2, 0.6], life: [0.5, 0.9], up: 3, grav: 0, drag: 1, w: 0.08, stretch: 0.05 });
  });
}
// raise one shadow: a unit of the summoner's side that rises out of the pool, fights for him and is gone when its time runs out
function jinRaise(h, c, elite, dur) {
  const lv = h.level, strong = !!(c.hero || elite), q = strong ? 1 : (c.big ? 0.75 : 0.5);
  const hp = (260 + lv * 34) * (strong ? 2.1 : 1) * (c.big ? 1.4 : 1) + h.ap * 1.2, ad = (18 + lv * 2.4) * (strong ? 1.7 : 1) * (c.big ? 1.25 : 1) + h.ad * 0.18;
  const range = c.range > 5 ? 8 : 2.4;
  const u = makeUnit({ kind: 'summon', owner: h, team: h.team, x: c.x, z: c.z, radius: strong ? 0.85 : 0.72, maxHp: hp, bAd: ad, bDef: 10 + lv * 1.2, bAs: strong ? 0.95 : 0.85, bMs: 9.2, range, pcol: elite ? JNW.red : JNW.c, name: elite ? 'Игрис' : 'Тень', facing: h.facing, until: G.time + dur, riseT: G.time, elite: !!elite, wdT: G.time, wdX: c.x, wdZ: c.z, path: null, think: rand(0.2) });
  u.rig = jinShadeRig(elite ? { look: JIN_IGRIS } : c, !!elite, h.team); placeRig(u); u.yOff = -2.4;
  (h.shadows || (h.shadows = [])).push(u);
  if (FX.near(c.x, c.z, 55)) { FX.pillar(c.x, c.z, { r: strong ? 1.1 : 0.7, h: strong ? 9 : 6, color: elite ? JNW.red : JNW.c, life: 0.6, op: 0.55 }); FX.burst(c.x, 0.4, c.z, { smoke: true, n: strong ? 10 : 5, color: 0x1c0a30, color2: 0x05020a, speed: [0.5, 2], life: [0.6, 1.1], size: [0.8, 1.8], up: 2, rad: 0.8, a: 0.6 }); FX.ring(c.x, c.z, { r0: 0.3, r1: strong ? 2.6 : 1.6, color: elite ? JNW.red : JNW.c, life: 0.4, tex: 'shock' }); }
  SFX.at(elite ? 'necro' : 'ghost', c.x, c.z, strong ? 0.55 : 0.3);
  return u;
}
function jinFade(u) { if (FX.near(u.x, u.z, 50)) { FX.burst(u.x, 1, u.z, { smoke: true, n: 8, color: 0x1c0a30, color2: 0x05020a, speed: [0.5, 2], life: [0.5, 1], size: [0.8, 1.6], up: 2, rad: 0.6, a: 0.6 }); FX.sparks(u.x, 1.2, u.z, { n: 8, color: JNW.pale, color2: JNW.c, speed: [1, 4], life: [0.3, 0.6], up: 2, w: 0.07 }); } }
// the shadow soldier's own mind: rise, guard the master, go for whatever he goes for (or the nearest enemy near him), come back if left far behind
function updateSummon(u, dt) {
  if (u.dead) { if (!u.fadeDone) { u.fadeDone = true; jinFade(u); } u.deathT += dt; if (u.deathT > 0.7) u.remove = true; return; }
  const h = u.owner;
  if (G.time > u.until || !h || h.dead) { kill(u, null); return; }
  if (u.riseT !== undefined) { const q = Math.min(1, (G.time - u.riseT) / 0.6); u.yOff = -2.4 * (1 - easeOut(q)); if (q >= 1) u.riseT = undefined; else { u.moving = false; return; } }
  if (Math.random() < dt * 4 && FX.near(u.x, u.z, 40)) FX.burst(u.x + rand(-0.3, 0.3), 0.3, u.z + rand(-0.3, 0.3), { smoke: true, n: 1, color: 0x1c0a30, color2: 0x05020a, speed: [0.2, 0.6], life: [0.5, 0.9], size: [0.6, 1.1], up: 1.5, a: 0.45 });
  if (u.atkCd > 0) u.atkCd -= dt;
  if (u.stunned || u.forced) { u.moving = false; u.windup = 0; return; }
  if (u.windup > 0) { u.windup -= dt; u.moving = false; const t = u.windupTgt; if (!t || !t.alive) u.windup = 0; else if (u.windup <= 0) performHit(u, t); return; }
  if (udist(u, h) > 28) { jinFade(u); const a = rand(TAU), q = NAV.nearest(h.x + Math.sin(a) * 2, h.z + Math.cos(a) * 2); u.x = q.x; u.z = q.z; u.path = null; u.target = null; jinFade(u); }
  u.think -= dt;
  if (u.think <= 0) {
    u.think = 0.25; let t = null;
    if (u.focus && u.focus.alive && G.time < u.focusT) t = u.focus;
    const ho = h.order && h.order.type === 'attack' && h.order.tgt && h.order.tgt.alive && hostile(u, h.order.tgt) && udist(h, h.order.tgt) < 14 ? h.order.tgt : null;
    if (!t && ho && targetable(u, ho)) t = ho;
    if (!t) { let bd = 9; for (const o of G.units) { if (!o.alive || o.struct || !hostile(u, o) || o.team === 2 && !(o.target && (o.target === h || o.target.owner === h))) continue; if (udist(o, h) > 16) continue; const d = udist(u, o) - (o.kind === 'hero' ? 2 : 0); if (d < bd) { bd = d; t = o; } } }
    u.target = t;
  }
  const t = u.target;
  if (t && t.alive) {
    const d = udist(u, t) - t.radius;
    if (d <= u.range) { u.moving = false; u.path = null; u.wdT = G.time; u.wdX = u.x; u.wdZ = u.z; u.facing = angTo(u.x, u.z, t.x, t.z); if (u.atkCd <= 0) startAttack(u, t); }
    else if (!u.rooted) minionGo(u, t.x, t.z, dt); else u.moving = false;
  } else if (!u.rooted && udist(u, h) > 4.5) { const a = h.facing + Math.PI + ((u.id % 5) - 2) * 0.5; minionGo(u, h.x + Math.sin(a) * 2.6, h.z + Math.cos(a) * 2.6, dt); }
  else u.moving = false;
}

/* ================= Misaka ================= */
// one supersonic railgun round: an orange core with a white heart, the air torn in rings along it, a burnt trench in the ground
function misRail(x0, z0, dir, L, big) {
  const sx = Math.sin(dir), sz = Math.cos(dir), x1 = x0 + sx * L, z1 = z0 + sz * L, w = big ? 1.15 : 0.6;
  if (!FX.near(x0, z0, 70) && !FX.near(x1, z1, 70)) return;
  r3Ray(x0, 1.55, z0, x1, 1.3, z1, { color: MIS.rail, w, life: big ? 0.5 : 0.3, grow: true, core: 0.35 }); r3Ray(x0, 1.55, z0, x1, 1.3, z1, { color: 0xff5a10, w: w * 2.6, life: big ? 0.32 : 0.2, op: 0.35 });
  FX.warp('line', x0, 1.5, z0, { ang: dir, w: w * 2.8, len: L, str: big ? 0.9 : 0.5, life: 0.4 }); FX.lineDecal(x0, z0, dir, L, w * 0.8, MIS.rail, big ? 1.4 : 0.8);
  FX.glow(x0, 1.55, z0, big ? 6 : 3.5, MIS.rail, 0.2, 'flare'); FX.light(x0, 2, z0, MIS.rail, big ? 2.4 : 1.2, 20, 0.35);
  const n = Math.round(L / (big ? 3 : 4));
  for (let i = 0; i <= n; i++) {
    const f = i / n, px = lerp(x0, x1, f), pz = lerp(z0, z1, f), py = lerp(1.55, 1.3, f);
    after(f * 0.06, () => {
      FX.sparks(px, py, pz, { n: big ? 4 : 2, color: 0xffffff, color2: MIS.rail, speed: [3, 9], life: [0.15, 0.4], w: 0.08, dir: dir + (i % 2 ? HPI : -HPI), spread: 0.7 });
      if (big && i % 2 === 0) FX.scorch(px, pz, 0.8, MIS.rail, 5);
      if (big && i < 5) { const m = new THREE.Mesh(FX.geo.flat, FX.mat('shock', i % 2 ? 0xffffff : MIS.rail, 0.8)); m.rotation.order = 'YXZ'; m.rotation.set(HPI, dir, 0); m.position.set(px, py, pz); FX.add(m, 0.35, k => { const s = (0.6 + k * 3.2) * 2 * RK; m.scale.set(s, 1, s); m.material.opacity = 0.8 * (1 - k); }); }
      if (i % 2) FX.bolt(px, py, pz, px + rand(-1.5, 1.5), rand(0.2, 2.5), pz + rand(-1.5, 1.5), { color: MIS.c, w: 0.3, life: 0.12, jag: 0.4, fork: false });
    });
  }
}
// an electric arc from one point to a unit
function misArc(x, y, z, u, w) { if (FX.near(x, z, 60)) FX.bolt(x, y, z, u.x, (u.height || 2) * 0.55 + (u.yOff || 0), u.z, { color: MIS.c, w: w || 0.45, life: 0.14, jag: 0.6 }); }

HEROES.push(
  /* ================= 51. Reiner ================= */
  {
    id: 'reiner', name: 'Райнер', title: 'Бронированный титан', role: 'front', roleName: 'Танк', build: 'tank', bars: [3, 5, 4, 2], diffc: 2, atkSfx: 'hit',
    lore: 'Воин, который слишком долго притворялся солдатом другой армии и сам уже не помнит, кем был на самом деле. В бою он прикрывает своих широкой спиной, а когда становится совсем плохо, в небе бьёт золотая молния — и на поле встаёт Бронированный титан, о чью броню ломаются клинки.',
    look: { bulk: 1.12, h: 1.06, scale: 1.12, c1: 0xb0905a, c2: 0xe8e2d4, c3: 0x4a2e1c, cuff: 0xb0905a, skin: 0xe8c8a8, hands: 0xe8c8a8, metal: 0xb8bcc4, glow: 0xffb04a, head: 'reiner', hair: 0xe0c070, chest: 'scout', sh: 'none', band: 0xb02028, wc: 'fist' },
    stats: ST(700, 110, 280, 30, 58, 3.4, 32, 3.6, 0.72, 8.8, 2.4),
    innate: { name: 'Броня', icon: 'reiinn', desc: 'Райнер получает на 15% меньше физического урона (атаки и физические умения). В облике Бронированного титана — на 35% меньше.' },
    tick(h, dt) {
      h.physIn = h.titan ? 0.65 : 0.85; h.range = h.titan ? 3.6 : h.def.stats.range;
      if (h.titan) { if (G.time > h.titanT) { reiSteam(h, 18, true); SFX.at('sizzle', h.x, h.z, 0.8); reiTitan(h, false); reiSteam(h, 10, true); } else if (Math.random() < dt * 5) reiSteam(h, 1, false); }
    },
    onDeath(h) { if (h.titan) { reiSteam(h, 16, true); reiTitan(h, false); } },
    // the titan's fists crush the ground: half the blow reaches everyone around the target
    onDeal(h, t, d, o) {
      if (!o.basic || !h.titan || !t.alive && !t.dead) return;
      for (const e of enemiesIn(h, t.x, t.z, 2.4)) if (e !== t) damage(h, e, d * 0.5, 0, { dot: true });
      if (FX.near(t.x, t.z, 45)) { FX.ring(t.x, t.z, { r0: 0.4, r1: 2.6, color: REI.c, life: 0.3, tex: 'crack' }); FX.debris(t.x, 0.3, t.z, { n: 4, color: 0x4a4038, speed: [2, 5], up: 6, size: [0.15, 0.35] }); }
      SFX.at('stone', t.x, t.z, 0.4); if (h === G.player) FX.shake(0.15);
    },
    abilities: [
      {
        key: 'Q', name: 'Таран', icon: 'reicharge', cd: 11, cost: 60, range: 7, ind: { type: 'line', w: 1.8 }, anim: 'charge', animDur: 0.5, lock: 0, ai: { t: 'gap' },
        desc: 'Райнер срывается с места плечом вперёд на 7 и сносит всех на пути: физический урон (растёт от здоровья Райнера), отбрасывание в сторону и оглушение на 0.6 сек (героев — на 0.9). Титан таранит на 10, шире и оглушает на 1.2 сек.',
        cast(h, p) {
          const T = h.titan, L = T ? 10 : 7, dmg = D(h, 70, 15, 0.4) + h.maxHp * 0.03, st = T ? 1.2 : 0.9, dir = p.dir, tx = h.x + Math.sin(dir) * L, tz = h.z + Math.cos(dir) * L;
          SFX.at('dash', h.x, h.z, 1); SFX.at('stone', h.x, h.z, 0.45); if (FX.near(h.x, h.z, 50)) { FX.ring(h.x, h.z, { r0: 0.4, r1: T ? 4 : 2.5, color: REI.c, life: 0.3, tex: 'shock' }); FX.burst(h.x, 0.3, h.z, { smoke: true, n: T ? 10 : 5, color: 0x8a8070, color2: 0x3a3630, speed: [1, 3], life: [0.4, 0.8], size: [0.8, 1.8], ring: true, a: 0.45 }); }
          dashTo(h, tx, tz, T ? 30 : 26, { ribbon: REI.c, w: T ? 2.2 : 1.3,
            trail: u => { if (FX.near(u.x, u.z, 45) && Math.random() < 0.6) FX.burst(u.x, 0.3, u.z, { smoke: true, n: T ? 3 : 1, color: 0x8a8070, color2: 0x3a3630, speed: [0.5, 2], life: [0.4, 0.7], size: [0.6, T ? 2 : 1.2], a: 0.4 }); },
            onHit: (e, u) => {
              damage(u, e, dmg, 0); if (!e.alive) return; const side = ((e.x - u.x) * Math.cos(dir) - (e.z - u.z) * Math.sin(dir)) >= 0 ? 1 : -1;
              knock(e, e.x - Math.cos(dir) * side, e.z + Math.sin(dir) * side, T ? 3.2 : 2.2, 0.22); stun(u, e, e.kind === 'hero' ? st : 0.6, T ? 1.2 : 0.5);
              if (FX.near(e.x, e.z, 45)) { FX.hit(e.x, 1.3, e.z, REI.c, true); FX.debris(e.x, 0.4, e.z, { n: 4, color: 0x4a4038, speed: [2, 6], up: 6, size: [0.15, 0.35] }); } SFX.at('mace', e.x, e.z, 0.7); SFX.at('punch', e.x, e.z, 0.4); FX.shake(T ? 0.35 : 0.2);
            },
            onEnd: u => { if (FX.near(u.x, u.z, 45)) { FX.ring(u.x, u.z, { r0: 0.4, r1: T ? 4 : 2.4, color: REI.c, life: 0.3, tex: 'crack' }); FX.shock(u.x, u.z, T ? 4 : 2.5, 0.6, 0.3); } } });
        }
      },
      {
        key: 'W', name: 'Затвердение', icon: 'reitaunt', cd: 14, cost: 70, range: 0, ind: { type: 'self', r: 5 }, anim: 'flex', animDur: 0.65, lock: 0.3, ai: { t: 'nova', r: 4.5 }, noCue: true,
        desc: 'Тело Райнера покрывается янтарными кристаллами брони: щит на 4 сек (растёт от здоровья), а враги в радиусе 5 — герои, миньоны и чудовища — 1.4 / 1.6 / 1.8 / 2 сек не могут делать ничего, кроме как бить его. У титана — радиус 7.',
        cast(h) {
          const lv = Math.max(1, h.al[1]), R = h.titan ? 7 : 5, dur = 1.2 + 0.2 * lv, sh = D(h, 90, 28) + h.maxHp * 0.08;
          const b = shield(h, h, sh, 4, REI.c); if (b) { if (b.fx) b.fx.dead = true; b.fx = reiHarden(h, 4); }
          for (const e of enemiesIn(h, h.x, h.z, R)) { if (e.boss) continue; e.tauntBy = h; e.tauntT = G.time + dur; if (e.kind !== 'hero') e.target = h; else { e.order = { type: 'attack', tgt: h, rp: 0 }; e.windup = 0; }
            const bb = addBuff(e, { id: 'taunted', dur, src: h }); if (bb) bb.fx = FX.aura(e, REI.c, dur, e.radius + 0.5, 'ring', 6); if (FX.near(e.x, e.z, 45)) FX.beam(h.x, h.z, e.x, e.z, { color: REI.c, w: 0.15, life: 0.3, y: 1.4 }); }
          SFX.at('mace', h.x, h.z, 0.7); SFX.at('shield', h.x, h.z, 0.6); SFX.at('horn', h.x, h.z, 0.45); FX.shake(0.25);
          if (FX.near(h.x, h.z, 50)) { FX.ring(h.x, h.z, { r0: 0.5, r1: R, color: REI.c, life: 0.45, tex: 'shock' }); FX.ring(h.x, h.z, { r0: R, r1: R + 0.5, color: REI.hard, life: 0.7, tex: 'ringThin' }); FX.shock(h.x, h.z, R, 0.8, 0.4); FX.debris(h.x, h.height * 0.6, h.z, { glow: true, n: 10, color: REI.hard, speed: [2, 5], up: 4, size: [0.1, 0.25], life: 0.5 }); FX.text(h.x, h.height + 1.2, h.z, 'СЮДА!', '#ffc870', 18); }
        }
      },
      {
        key: 'E', name: 'Удар оземь', icon: 'reistomp', cd: 12, cost: 65, range: 0, ind: { type: 'self', r: 3.5 }, anim: 'slam', animDur: 0.55, lock: 0.4, ai: { t: 'nova', r: 3.2 },
        desc: 'Райнер обрушивает кулаки на землю: через 0.3 сек — физический урон (растёт от здоровья) всем в радиусе 3.5 и подброс с оглушением на 0.8 сек. Титан бьёт в радиусе 5.5 так, что трескается земля.',
        cast(h) {
          const T = h.titan, R = T ? 5.5 : 3.5, dmg = D(h, 80, 17, 0.35) + h.maxHp * 0.035;
          after(0.3, () => {
            if (!h.alive) return; const x = h.x + Math.sin(h.facing) * (T ? 1.8 : 0.8), z = h.z + Math.cos(h.facing) * (T ? 1.8 : 0.8);
            for (const e of enemiesIn(h, x, z, R)) { damage(h, e, dmg, 0); if (e.alive) stun(h, e, 0.8, T ? 1.8 : 1.2); }
            SFX.at('punch', x, z, 0.9); SFX.at('quake', x, z, 0.8); SFX.at('rubble', x, z, 0.7); if (T) SFX.at('bigboom', x, z, 0.5); FX.shake(T ? 0.7 : 0.4); if (h === G.player) FX.hitstop(0.05);
            if (FX.near(x, z, 55)) {
              FX.ring(x, z, { r0: 0.5, r1: R + 0.6, color: REI.c, life: 0.45, tex: 'shock' }); FX.ring(x, z, { r0: R * 0.9, r1: R, color: 0x8a7050, life: 1.6, tex: 'crack' }); FX.shock(x, z, R * 1.3, 1.1, 0.4);
              FX.debris(x, 0.4, z, { n: T ? 18 : 10, color: 0x4a4038, speed: [3, 9], up: 10, size: [0.2, T ? 0.7 : 0.45], rad: R * 0.4 }); FX.smoke(x, z, R * 0.6, T ? 10 : 6, 0x6a6050); FX.scorch(x, z, R * 0.55, REI.c, 6);
            }
          });
        }
      },
      {
        key: 'R', name: 'Бронированный титан', icon: 'reititan', cd: 100, cost: 120, range: 0, ind: { type: 'self', r: 6 }, anim: 'roar', animDur: 0.9, lock: 0.75, ai: { t: 'buff', ult: true },
        desc: 'С ясного неба бьёт золотая молния — и на месте Райнера встаёт Бронированный титан: взрыв в радиусе 6 (физический урон, отбрасывание), лечение на 25% здоровья. На 12 / 15 / 18 сек: +45 / 60 / 75 защиты, +40% к силе атаки, 35% меньше физического урона, удары кулаками крошат землю вокруг цели (половина урона), а умения бьют дальше и шире. Из-под брони всё время валит пар.',
        cast(h) {
          const lv = Math.max(1, h.al[3]), dur = 9 + 3 * lv, x = h.x, z = h.z, dmg = D(h, 150, 40, 0.5) + h.maxHp * 0.05; h.order = null; h.path = null;
          SFX.at('ultcue', x, z, 0.6); SFX.at('charge', x, z, 0.6); G.dim = Math.max(G.dim || 0, FX.near(x, z, 40) ? 0.7 : 0);
          if (FX.near(x, z, 55)) { FX.implode(x, 2, z, 5, { n: 24, color: 0xfff0c0, color2: REI.c, life: 0.45, streak: true }); FX.bolt(x + 6, 30, z - 4, x + 1, 22, z, { color: REI.bolt, w: 0.8, life: 0.2 }); }
          after(0.45, () => {
            if (!h.alive) return; reiLightning(h.x, h.z); SFX.at('thunder', h.x, h.z, 1); SFX.at('bigboom', h.x, h.z, 1); SFX.at('roar', h.x, h.z, 0.9); FX.shake(1.0); if (FX.near(h.x, h.z, 36)) FX.hitstop(0.1);
            for (const e of enemiesIn(h, h.x, h.z, 6)) { damage(h, e, dmg, 0); if (e.alive) knock(e, h.x, h.z, 3.5, 0.3); }
            reiTitan(h, true); h.titanT = G.time + dur; heal(h, h, h.maxHp * 0.25);
            addBuff(h, { id: 'titan', dur, def: 30 + 15 * lv, ad: h.bAd * 0.4, src: h });
            if (FX.near(h.x, h.z, 55)) { FX.explosion(h.x, h.z, 2.5, REI.c, { el: 'fire', color2: 0x6a1a00 }); FX.ring(h.x, h.z, { r0: 0.5, r1: 7, color: REI.c, life: 0.5, tex: 'shock' }); FX.warp('ring', h.x, 0.3, h.z, { r0: 1, r1: 10, str: 1.4, life: 0.5 }); reiSteam(h, 24, true); FX.text(h.x, h.height + 1, h.z, 'ТИТАН', '#ffc870', 26); }
          });
        }
      }
    ]
  },
  /* ================= 52. Sung Jinwoo ================= */
  {
    id: 'jinwoo', name: 'Сун Джину', title: 'Монарх теней', role: 'assassin', roleName: 'Призыватель', build: 'assassin', bars: [5, 3, 3, 4], diffc: 3, atkSfx: 'slash',
    lore: 'Когда-то он был самым слабым охотником на свете — пока данж не выбрал его. Теперь за ним идёт армия, которой не нужно ни есть, ни спать: всякий, кто пал рядом с ним, может встать снова, уже его тенью. Он говорит одно слово — и из чёрных луж поднимаются солдаты.',
    look: { bulk: 0.95, h: 1.04, scale: 1.06, c1: 0x15141c, c2: 0x15141c, c3: 0x0c0b10, cuff: 0x15141c, skin: 0xead2c0, hands: 0xead2c0, metal: 0x8a8aa0, glow: 0xa060ff, head: 'jinwoo', hair: 0x111018, shirt: 0x1e1c28, chest: 'monarch', sh: 'none', coat: 0x15141c, weapon: 'kamish', wc: 'dual' },
    stats: ST(600, 88, 300, 34, 62, 3.6, 24, 2.7, 0.86, 9.4, 2.4),
    innate: { name: 'Извлечение тени', icon: 'jininn', desc: 'Каждый враг, павший в радиусе 14 от Сун Джину, — герой, миньон или чудовище — оставляет на 12 сек свою тень: чёрную лужу с фиолетовым огнём. «Восстань!» поднимает эти тени солдатами. Тени героев получаются сильнее, тени чудовищ — крупнее.', count: h => (h.corpses || []).filter(c => c.until > G.time).length },
    onNearDeath(h, u) {
      const C = h.corpses || (h.corpses = []); for (let i = C.length - 1; i >= 0; i--) if (C[i].until <= G.time) C.splice(i, 1);
      if (C.length >= 14) { const o = C.shift(); if (o.fx) o.fx.dead = true; }
      const c = { x: u.x, z: u.z, until: G.time + 12, hero: u.kind === 'hero', big: u.kind === 'monster' && (u.boss || ['big', 'ogre'].includes(u.mtype)), range: u.range || 2 };
      if (u.kind === 'hero') c.look = u.def.look; else if (u.kind === 'monster' && !u.boss) { c.mrig = MON[u.mtype].rig; c.scale = u.scale; } else c.look = JIN_SHADE;
      c.fx = jinCorpseFx(c); C.push(c);
    },
    onDeath(h) { for (const s of h.shadows || []) if (s.alive) kill(s, null); h.shadows = []; },
    tick(h) { if (h.shadows && h.shadows.length > 0 && Math.random() < 0.05) h.shadows = h.shadows.filter(s => s.alive); },
    abilities: [
      {
        key: 'Q', name: 'Рывок кинжалов', icon: 'jindash', cd: 8, cost: 50, range: 7, ind: { type: 'line', w: 1.4 }, lock: 0, ai: { t: 'gap', escape: true },
        desc: 'Сун Джину проносится на 7 вперёд, полосуя кинжалами всех на пути (физический урон). Его тени в радиусе 20 тут же возникают у ближайшего врага в конце рывка и набрасываются на него.',
        cast(h, p) {
          const dmg = D(h, 64, 14, 0.75), dir = p.dir; dshGhost(h, JNW.c, 0.4, 0.45); SFX.at('dash', h.x, h.z, 0.8); SFX.at('shadowblade', h.x, h.z, 0.6);
          dashTo(h, p.x, p.z, 36, { ribbon: JNW.c, w: 1.3,
            onHit: (e, u) => { damage(u, e, dmg, 0); if (FX.near(e.x, e.z, 45)) { FX.slash(e.x, e.z, dir + HPI, { r: 1.8, sweep: 1.4, color: JNW.c, life: 0.18, y: 1.2 }); FX.hit(e.x, 1.2, e.z, JNW.c, e.kind === 'hero'); } SFX.at('dagger', e.x, e.z, 0.5); },
            onEnd: u => {
              let t = null, bd = 6; for (const e of G.units) if (e.alive && !e.struct && hostile(u, e)) { const d = udist(u, e) - (e.kind === 'hero' ? 2 : 0); if (d < bd) { bd = d; t = e; } }
              if (!t) return;
              for (const s of u.shadows || []) { if (!s.alive || udist(s, u) > 20 || s.riseT !== undefined) continue; s.focus = t; s.focusT = G.time + 4; if (udist(s, t) > 3) { jinFade(s); const a = rand(TAU), q = NAV.nearest(t.x + Math.sin(a) * 1.8, t.z + Math.cos(a) * 1.8); s.x = q.x; s.z = q.z; s.path = null; s.atkCd = 0; jinFade(s); } }
            } });
        }
      },
      {
        key: 'W', name: 'Власть правителя', icon: 'jingrip', cd: 13, cost: 75, range: 9, ind: { type: 'circle', r: 2.8 }, anim: 'grip', animDur: 0.9, lock: 0.35, ai: { t: 'point', rad: 2.8, delay: 0.3 },
        desc: 'Невидимая рука хватает врагов в круге радиусом 2.8, поднимает их в воздух (оглушение на 0.9 сек) и с размаху бьёт о землю: магический урон и замедление на 30% на 1.5 сек.',
        cast(h, p) {
          const x = p.x, z = p.z, R = 2.8, dmg = D(h, 95, 19, 0.3, 0.6); SFX.at('dark', x, z, 0.7); SFX.at('warp', x, z, 0.6);
          if (FX.near(x, z, 55)) { FX.warp('lens', x, 1.6, z, { r: R + 0.5, str: 1, life: 0.9 }); FX.sphere(x, 1.6, z, { r0: R + 1, r1: R * 0.6, color: JNW.c, life: 0.4, op: 0.5 }); FX.zone(x, z, R, JNW.c, 1.0, { tex: 'rune2', spin: 1.5, op: 0.6 }); }
          after(0.15, () => {
            const foes = enemiesIn(h, x, z, R);
            for (const e of foes) { if (!e.boss) stun(h, e, 0.9, 2.3); if (FX.near(e.x, e.z, 45)) FX.sparks(e.x, 0.4, e.z, { n: 8, color: JNW.pale, color2: JNW.c, speed: [1, 3], life: [0.4, 0.7], up: 8, grav: 0, w: 0.08, stretch: 0.1 }); }
            after(0.75, () => {
              for (const e of enemiesIn(h, x, z, R + 0.6)) { damage(h, e, dmg, 1); if (e.alive) slow(h, e, 0.3, 1.5, 'jinslow'); FX.hit(e.x, 0.6, e.z, JNW.c, true); }
              SFX.at('heavy', x, z, 1); SFX.at('stone', x, z, 0.7); FX.shake(0.4);
              if (FX.near(x, z, 55)) { FX.ring(x, z, { r0: 0.4, r1: R + 1, color: JNW.c, life: 0.4, tex: 'shock' }); FX.ring(x, z, { r0: R * 0.8, r1: R, color: 0x5a3a8a, life: 1.4, tex: 'crack' }); FX.debris(x, 0.3, z, { n: 10, color: 0x2a2430, speed: [2, 7], up: 8, size: [0.15, 0.4], rad: R * 0.5 }); FX.shock(x, z, R + 1.5, 1, 0.35); }
            });
          });
        }
      },
      {
        key: 'E', name: 'Обмен тенями', icon: 'jinswap', cd: 12, cost: 40, range: 70, noReach: true, global: true, ind: { type: 'circle', r: 1.5 }, lock: 0, ai: { t: 'gap', escape: true },
        desc: 'Сун Джину меняется местами со своей тенью — где бы та ни была (укажите место рядом с тенью, можно по мини-карте). Если теней нет или рядом с указанным местом ни одной, он просто проходит сквозь тьму на 6. Атака после обмена готова сразу.',
        cast(h, p) {
          let best = null, bd = 12; for (const s of h.shadows || []) if (s.alive && s.riseT === undefined) { const d = dist(s.x, s.z, p.x, p.z); if (d < bd) { bd = d; best = s; } }
          const x0 = h.x, z0 = h.z;
          if (best) { const bx = best.x, bz = best.z; blink(h, bx, bz); best.x = x0; best.z = z0; best.path = null; jinFade(best); }
          else { const d = Math.min(6, dist(h.x, h.z, p.x, p.z)); blink(h, h.x + Math.sin(p.dir) * d, h.z + Math.cos(p.dir) * d); }
          h.facing = p.dir; h.atkCd = 0; if (h === G.player) G.camSnap = true; SFX.at('blink', x0, z0, 0.7); SFX.at('ghost', h.x, h.z, 0.5); SFX.at('dark', h.x, h.z, 0.4);
          for (const [x, z] of [[x0, z0], [h.x, h.z]]) if (FX.near(x, z, 55)) { FX.burst(x, 0.8, z, { smoke: true, n: 10, color: 0x1c0a30, color2: 0x05020a, speed: [0.5, 2.5], life: [0.5, 0.9], size: [0.8, 1.8], up: 1.5, rad: 0.6, a: 0.65 }); FX.implode(x, 1.2, z, 2.2, { n: 10, color: JNW.pale, color2: JNW.c, life: 0.22, streak: true }); FX.ring(x, z, { r0: 2.2, r1: 0.3, color: JNW.c, life: 0.3, tex: 'ringThin' }); }
        }
      },
      {
        key: 'R', name: 'Восстань!', icon: 'jinarise', cd: 75, cost: 120, range: 0, ind: { type: 'self', r: 15 }, anim: 'arise', animDur: 1.0, lock: 0.6, ai: { t: 'arise', ult: true },
        desc: '«Восстань». Все тени павших в радиусе 15 поднимаются солдатами армии Сун Джину (до 6 / 8 / 10 одновременно) и сражаются за него 30 / 35 / 40 сек; рядом с ним всегда встаёт рыцарь Игрис. Тени героев сильнее, тени чудовищ — крупнее. Тени идут за Сун Джину, бьют его цель, а если хозяин погибнет — исчезают.',
        cast(h) {
          const lv = Math.max(1, h.al[3]), dur = 25 + 5 * lv, cap = 4 + 2 * lv, R = 15, x = h.x, z = h.z;
          h.shadows = (h.shadows || []).filter(s => s.alive);
          const C = (h.corpses || []).filter(c => c.until > G.time && dist(c.x, c.z, x, z) < R).sort((a, b) => (b.hero - a.hero) || (b.big - a.big) || (dist(a.x, a.z, x, z) - dist(b.x, b.z, x, z)));
          SFX.at('ultcue', x, z, 0.7); SFX.at('necro', x, z, 1); SFX.at('dark', x, z, 0.6); G.dim = Math.max(G.dim || 0, FX.near(x, z, 40) ? 0.8 : 0);
          if (FX.near(x, z, 60)) { FX.text(x, h.height + 1.5, z, 'ВОССТАНЬ', '#c8a0ff', 26); FX.ring(x, z, { r0: 0.5, r1: R, color: JNW.c, life: 0.8, tex: 'shock', op: 0.7 }); FX.zone(x, z, R, JNW.c, 1.4, { tex: 'rune2', spin: -0.5, op: 0.45 }); FX.light(x, 3, z, JNW.c, 1.5, 30, 1); }
          // Igris rises at his side (an old one is renewed)
          let ig = h.shadows.find(s => s.elite && s.alive);
          if (ig) { ig.until = G.time + dur; ig.hp = ig.maxHp; } else { const a = h.facing + 2.3, q = NAV.nearest(x + Math.sin(a) * 2, z + Math.cos(a) * 2); after(0.3, () => { if (h.alive) jinRaise(h, { x: q.x, z: q.z, hero: true, range: 2 }, true, dur); }); }
          let n = 0;
          for (const c of C) {
            if (h.shadows.length + n >= cap + 1) { const old = h.shadows.find(s => s.alive && !s.elite); if (!old) break; kill(old, null); h.shadows = h.shadows.filter(s => s !== old); }
            const d = dist(c.x, c.z, x, z), cc = c; n++; if (cc.fx) cc.fx.dead = true; cc.until = 0;
            after(0.25 + d * 0.035, () => { if (h.alive) jinRaise(h, cc, false, dur); });
          }
          if (!n && h === G.player) UI.msg('Поблизости нет теней павших — встаёт только Игрис');
        }
      }
    ]
  },
  /* ================= 53. Misaka ================= */
  {
    id: 'misaka', name: 'Мисака', title: 'Рейлган', role: 'marks', roleName: 'Стрелок', build: 'marks', bars: [5, 2, 3, 4], diffc: 2, atkSfx: 'zap',
    lore: 'Третий по силе эспер Академгорода и, по её собственным словам, совершенно обычная школьница. Она управляет электричеством так, как другие дышат: стреляет молниями, ходит по стенам на магнитах и сплетает из железного песка хлыст. А если подбросить монетку — та улетает со скоростью, втрое быстрее звука.',
    look: { bulk: 0.82, h: 0.92, scale: 0.97, c1: 0xf2f0ec, c2: 0x6e7078, c3: 0x4a2a1a, cuff: 0xf2f0ec, skin: 0xf6e0d2, hands: 0xf6e0d2, metal: 0xd8b04a, glow: 0x7ad8ff, head: 'misaka', hair: 0x9a6a3a, lin: 0xd8c8a0, chest: 'tokiwa', legs: 'socks', sh: 'none', weapon: 'coin', wc: 'pistol' },
    stats: ST(530, 74, 330, 36, 54, 3.0, 19, 2.2, 0.82, 9.1, 10.0, 0.026),
    innate: { name: 'Электромастер', icon: 'misinn', desc: 'Атаки Мисаки — разряды молнии: попадают мгновенно и перескакивают на ещё одного врага рядом с целью (35% урона, магический).' },
    shootAtk(u, t) {
      const f = u.facing, hx = u.x + Math.sin(f) * 0.9, hz = u.z + Math.cos(f) * 0.9;
      misArc(hx, 1.7, hz, t, 0.5); basicHit(u, t); if (FX.near(t.x, t.z, 50)) FX.hit(t.x, t.height * 0.55, t.z, MIS.c, false);
      if (t.alive || t.dead) { let n = null, bd = 4.5; for (const e of G.units) if (e !== t && e.alive && !e.struct && hostile(u, e)) { const d = udist(e, t); if (d < bd) { bd = d; n = e; } } if (n) { damage(u, n, u.ad * 0.35, 1, { dot: true }); misArc(t.x, t.height * 0.55, t.z, n, 0.3); } }
      SFX.at('zap', u.x, u.z, 0.4);
    },
    abilities: [
      {
        key: 'Q', name: 'Рейлган', icon: 'misrail', cd: 9, cost: 60, range: 20, noReach: true, ind: { type: 'line', w: 1.8, len: 20, fixed: true }, anim: 'railgun', animDur: 0.7, lock: 0.45, ai: { t: 'shot', sp: 999, farm: true },
        desc: 'Мисака подбрасывает монетку, ловит её на большой палец — и монета уходит на втрое сверхзвуковой скорости: луч на 20, огромный физический урон всем на линии и отбрасывание. За выстрелом остаётся выжженная борозда.',
        cast(h, p) {
          const dir = p.dir, L = 20, dmg = D(h, 105, 22, 0.9), sx = Math.sin(dir), sz = Math.cos(dir); SFX.at('coin', h.x, h.z, 0.7); SFX.at('charge', h.x, h.z, 0.4);
          if (FX.near(h.x, h.z, 50)) {   // the coin flicked up and falling back
            const c = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: 0xffc860, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
            FX.add(c, 0.4, k => { c.position.set(h.x + sx * 0.7, 1.7 + Math.sin(Math.PI * k) * 1.6, h.z + sz * 0.7); c.scale.setScalar(0.45 + Math.abs(Math.sin(k * 20)) * 0.25); c.material.opacity = 1; });
          }
          after(0.4, () => {
            if (!h.alive) return; const x0 = h.x + sx * 1.1, z0 = h.z + sz * 1.1;
            for (const e of stripHits(h, x0, z0, dir, L, 0.95)) { damage(h, e, dmg, 0); FX.hit(e.x, 1.4, e.z, MIS.rail, true); if (e.alive) knock(e, e.x - sx, e.z - sz, 1.6, 0.18); }
            misRail(x0, z0, dir, L, true); SFX.at('railgun', h.x, h.z, 1); SFX.at('boom', h.x, h.z, 0.5); SFX.at('zap', h.x, h.z, 0.6); FX.shake(0.45); if (h === G.player) { FX.punch(0.9); FX.hitstop(0.04); }
          });
        }
      },
      {
        key: 'W', name: 'Железный песок', icon: 'missand', cd: 9, cost: 55, range: 6.5, ind: { type: 'cone', r: 6.5 }, anim: 'whip', animDur: 0.5, lock: 0.25, ai: { t: 'cone', farm: true },
        desc: 'Мисака поднимает из земли железный песок и хлещет им, как кнутом: физический урон всем врагам в конусе перед собой (до 6.5) и замедление на 35% на 1.5 сек. По хлысту бегут искры.',
        cast(h, p) {
          const dir = p.dir, R = 6.5, half = 0.8, dmg = D(h, 75, 16, 0.5, 0.4); SFX.at('sand', h.x, h.z, 0.8); SFX.at('zap', h.x, h.z, 0.3);
          after(0.12, () => {
            if (!h.alive) return; const x = h.x, z = h.z;
            for (const e of enemiesIn(h, x, z, R)) if (inCone(h, e, dir, half, R)) { damage(h, e, dmg, 0); if (e.alive) slow(h, e, 0.35, 1.5, 'missand'); FX.hit(e.x, 1.2, e.z, MIS.c, false); }
            SFX.at('whip', x, z, 0.9); SFX.at('zap', x, z, 0.4);
            if (!FX.near(x, z, 55)) return;
            // the black crescent of the whip and the sand pouring along it
            const m = new THREE.Mesh(FX.geo.flat, FX.mat('slash', 0x101016, 0.9, false)); m.position.set(x, 1.1, z);
            FX.add(m, 0.32, k => { const s = R * 2 * RK * (0.8 + 0.2 * k); m.scale.set(s, 1, s); m.rotation.y = dir + (easeOut(k) - 0.5) * 1.6; m.material.opacity = 0.9 * (1 - k * k); });
            FX.slash(x, z, dir, { r: R * 0.95, sweep: 1.6, color: MIS.c, life: 0.2, y: 1.15 });
            for (let i = 0; i <= 8; i++) { const a = dir - half + i / 8 * half * 2; after(i * 0.025, () => { for (const r of [2, 3.6, 5.2, 6.3]) FX.burst(x + Math.sin(a) * r, 1.1, z + Math.cos(a) * r, { smoke: true, n: 1, color: 0x22222a, color2: 0x0a0a0e, speed: [0.5, 1.5], life: [0.4, 0.8], size: [0.5, 1.0], a: 0.75, grav: -2 }); FX.sparks(x + Math.sin(a) * 5, 1.1, z + Math.cos(a) * 5, { n: 2, color: 0xffffff, color2: MIS.c, speed: [2, 6], life: [0.1, 0.25], w: 0.06 }); }); }
          });
        }
      },
      {
        key: 'E', name: 'Магнитный рывок', icon: 'misdash', cd: 12, cost: 45, range: 8, ind: { type: 'line', w: 1.2 }, lock: 0, ai: { t: 'escape', kite: true },
        desc: 'Мисака притягивает себя магнитом на 8 — по стенам и над ними. Следующая атака в течение 3 сек — малый рейлган: +60% урона и луч на 7 за целью, задевающий всех на нём (половина урона).',
        cast(h, p) {
          SFX.at('dash', h.x, h.z, 0.7); SFX.at('zap', h.x, h.z, 0.6); SFX.at('servo', h.x, h.z, 0.35);
          dashTo(h, p.x, p.z, 34, { fly: true, arc: 1.2, ribbon: MIS.c, trail: u => { if (FX.near(u.x, u.z, 45) && Math.random() < 0.5) FX.bolt(u.x, 1.2 + (u.yOff || 0), u.z, u.x + rand(-1.5, 1.5), rand(0.2, 2), u.z + rand(-1.5, 1.5), { color: MIS.c, w: 0.25, life: 0.1, jag: 0.3, fork: false }); },
            onEnd: u => {
              if (FX.near(u.x, u.z, 45)) { FX.ring(u.x, u.z, { r0: 0.3, r1: 2.4, color: MIS.c, life: 0.3, tex: 'shock' }); FX.arcs(u.x, 1, u.z, 1.8, 3, MIS.c); }
              addBuff(u, { id: 'misamp', dur: 3, onHit: (s, t, bf) => {
                if (bf.used) return 0; bf.used = true; bf.dead = true; const a = angTo(s.x, s.z, t.x, t.z);
                after(0.01, () => { for (const e of stripHits(s, t.x, t.z, a, 7, 0.7)) if (e !== t) damage(s, e, s.ad * 0.8, 0, { dot: true }); misRail(t.x - Math.sin(a) * 0.5, t.z - Math.cos(a) * 0.5, a, 7.5, false); SFX.at('railgun', t.x, t.z, 0.55); });
                return s.ad * 0.6;
              } });
            } });
        }
      },
      {
        key: 'R', name: 'Миллиард вольт', icon: 'misstorm', cd: 85, cost: 140, range: 14, ind: { type: 'circle', r: 5 }, anim: 'storm', animDur: 1.25, lock: 1.05, ai: { t: 'point', rad: 5, delay: 1.0, ult: true, hp: 0.6 },
        desc: 'Мисака вскидывает руки, и над точкой (до 14) сгущается грозовой заряд. Через 1 сек в землю бьёт колонна молний: огромный магический урон и оглушение на 1 сек в радиусе 5, а разряды перескакивают ещё на врагов в радиусе 10 (30% урона). Ещё 3 сек на месте удара трещит электрическое поле: урон и замедление на 30%.',
        cast(h, p) {
          const x = p.x, z = p.z, R = 5, dmg = D(h, 190, 40, 0.5, 0.85), tk = D(h, 24, 5, 0, 0.15); telegraph(h, x, z, R, 1.0, MIS.c); SFX.at('ultcue', h.x, h.z, 0.6); SFX.at('overload', x, z, 0.6); SFX.at('zap', h.x, h.z, 0.5);
          if (FX.near(x, z, 60)) {
            FX.zone(x, z, R, MIS.c, 4.2, { tex: 'rune2', spin: 1.2, op: 0.5 });
            const cl = new THREE.Mesh(FX.geo.flat, FX.mat('swirl', 0x4a8ac0, 0.5)); cl.position.set(x, 11, z); FX.add(cl, 1.3, (k, me, dt) => { const s = R * 2.6 * 2 * RK * Math.min(1, k * 3); me.scale.set(s, 1, s); me.rotation.y += dt * 2; me.material.opacity = 0.5 * Math.min(1, (1 - k) * 6); });
            for (let i = 0; i < 10; i++) after(i * 0.09, () => { const a = rand(TAU), b = rand(TAU); FX.bolt(x + Math.sin(a) * rand(R * 1.2), 11, z + Math.cos(a) * rand(R * 1.2), x + Math.sin(b) * rand(R * 1.2), 11 + rand(-0.5, 0.5), z + Math.cos(b) * rand(R * 1.2), { color: MIS.c, w: 0.4, life: 0.12, jag: 0.8 }); if (i % 3 === 0) SFX.at('zap', x, z, 0.3); });
            if (FX.near(h.x, h.z, 50)) FX.arcs(h.x, 1.6, h.z, 1.6, 4, MIS.c);
          }
          after(1.0, () => {
            if (!h.alive) return; const hit = enemiesIn(h, x, z, R);
            for (const e of hit) { damage(h, e, dmg, 1); FX.hit(e.x, 1.3, e.z, MIS.c, true); if (e.alive) stun(h, e, 1); }
            for (const e of G.units) { if (!e.alive || e.struct || !hostile(h, e) || hit.includes(e)) continue; const d = dist(e.x, e.z, x, z); if (d > 10) continue; damage(h, e, dmg * 0.3, 1, { dot: true }); misArc(x, 2, z, e, 0.6); }
            SFX.at('thunder', x, z, 1); SFX.at('bigboom', x, z, 0.8); SFX.at('zap', x, z, 0.8); FX.shake(0.9); if (FX.near(x, z, 36)) { FX.hitstop(0.08); FX.punch(1); }
            if (FX.near(x, z, 60)) {
              for (let i = 0; i < 5; i++) after(i * 0.05, () => FX.bolt(x + rand(-2, 2), 26, z + rand(-2, 2), x + rand(-0.6, 0.6), 0.2, z + rand(-0.6, 0.6), { color: i % 2 ? MIS.pale : MIS.c, w: 3 - i * 0.4, life: 0.35, jag: 1.4 }));
              FX.pillar(x, z, { r: 2.2, h: 28, color: MIS.c, life: 0.6, op: 0.55 }); FX.pillar(x, z, { r: 0.8, h: 32, color: 0xffffff, life: 0.35, op: 0.6 });
              FX.explosion(x, z, 2.5, MIS.c, { el: 'elec', color2: 0x1a4a8a }); for (let i = 0; i < 3; i++) after(i * 0.07, () => FX.ring(x, z, { r0: 0.5 + i, r1: R + 1 + i * 1.2, color: i % 2 ? 0xffffff : MIS.c, life: 0.45, tex: i ? 'ringThin' : 'shock' }));
              FX.scorch(x, z, R * 0.7, MIS.c, 8); FX.warp('ring', x, 0.3, z, { r0: 1, r1: R * 1.8, str: 1.4, life: 0.5 }); FX.light(x, 5, z, MIS.c, 3, 36, 0.8); FX.glow(x, 2, z, 10, MIS.c, 0.3, 'star');
            }
            zone(h, { x, z, r: R, dur: 3, every: 0.5, tick: () => {
              for (const e of enemiesIn(h, x, z, R)) { damage(h, e, tk, 1, { dot: true }); slow(h, e, 0.3, 0.6, 'misfield'); }
              if (FX.near(x, z, 55)) { FX.arcs(x, 0.8, z, R, 4, MIS.c); for (let i = 0; i < 2; i++) { const a = rand(TAU), d = rand(R); FX.bolt(x + Math.sin(a) * d, 8, z + Math.cos(a) * d, x + Math.sin(a) * d, 0.2, z + Math.cos(a) * d, { color: MIS.c, w: 0.6, life: 0.15, jag: 0.6 }); } SFX.at('zap', x, z, 0.35); }
            } });
          });
        }
      }
    ]
  }
);

/* ---------- icons of the three ---------- */
Object.assign(GLYPH, {
  reiinn(T) { T.shield(0, 0, 1); T.cut(() => { T.S(2.5, -10, -6, 10, -6); T.S(2.5, 0, -16, 0, 14); }); T.hi(() => T.C(-6, -11, 2)); },
  reicharge(T) { T.arrow(-24, 0, 23, 0, 10, 6); for (let i = -1; i <= 1; i++) T.al(0.45, () => T.S(2.2, -27, i * 11, -14, i * 11)); T.C(-12, 0, 8); T.hi(() => T.C(-14, -3, 2)); },
  reitaunt(T) { T.star(0, 0, 11, 6, 6, 0); for (const r of [16, 21, 26]) T.al(1.1 - r / 30, () => { T.A(0, 0, r, -0.9, 0.9, 3); T.A(0, 0, r, Math.PI - 0.9, Math.PI + 0.9, 3); }); T.hi(() => T.C(-3, -4, 2)); },
  reistomp(T) { T.fist(0, -9, 1.1, HPI); T.S(3, -25, 20, -9, 13, 0, 20, 9, 13, 25, 20); T.al(0.5, () => T.E(0, 19, 25, 5)); T.hi(() => T.C(-4, -14, 2)); },
  reititan(T) { T.P(-16, -21, 16, -21, 21, 0, 14, 23, -14, 23, -21, 0); T.cut(() => { T.P(-13, -4, -3, -2, -4, 2, -13, 1); T.P(13, -4, 3, -2, 4, 2, 13, 1); for (let i = -3; i <= 3; i++) T.g.fillRect(i * 3.5 - 1, 12, 2, 6); }); T.hi(() => T.C(-8, -13, 2)); },
  jininn(T) { T.al(0.5, () => T.E(0, 17, 23, 6)); T.P(-18, 12, -18, -10, -9, 0, 0, -18, 9, 0, 18, -10, 18, 12); T.cut(() => { T.C(-7, 4, 2.6); T.C(7, 4, 2.6); }); T.hi(() => T.C(0, -12, 1.8)); },
  jindash(T) { T.blade(-24, 14, 12, -12, 5); T.blade(-16, 24, 22, -2, 5); T.al(0.45, () => { T.S(2, -27, 2, -12, 2); T.S(2, -27, 10, -16, 10); }); T.hi(() => T.S(1.2, -4, 1, 8, -7)); },
  jingrip(T) { T.P(-14, -25, 14, -25, 16, -2, -16, -2); for (let i = 0; i < 4; i++) T.S(5, -12 + i * 8, -2, -12 + i * 8, 13); T.S(5, -17, -14, -24, -2); T.al(0.5, () => T.E(0, 23, 20, 4)); T.hi(() => T.C(0, -16, 2)); },
  jinswap(T) { T.C(-14, -9, 5); T.P(-20, 15, -8, 15, -10, -2, -18, -2); T.al(0.5, () => { T.C(14, -9, 5); T.P(8, 15, 20, 15, 18, -2, 10, -2); }); T.Q(2.5, -8, -19, 0, -29, 8, -19); T.head(8, -19, 1.0, 5); T.Q(2.5, 8, 21, 0, 29, -8, 21); T.head(-8, 21, 1.0 + Math.PI, 5); },
  jinarise(T) { for (const x of [-16, 16, 0]) T.al(x ? 0.6 : 1, () => { const y = x ? 6 : 0; T.C(x, -9 + y, 5); T.P(x - 6, 22, x + 6, 22, x + 5, -3 + y, x - 5, -3 + y); }); T.al(0.5, () => T.E(0, 23, 27, 4)); T.cut(() => { T.C(-2, -10, 1.2); T.C(2, -10, 1.2); }); },
  misinn(T) { T.bolt(0, 0, 1.1); T.al(0.4, () => T.O(0, 0, 24, 2)); T.hi(() => T.C(2, -12, 2)); },
  misrail(T) { T.O(-19, 0, 7, 3); T.P(-10, -4, 28, -2, 28, 2, -10, 4); T.al(0.4, () => T.P(-10, -9, 28, -5, 28, 5, -10, 9)); T.hi(() => T.S(1.4, -8, 0, 26, 0)); },
  missand(T) { T.A(-6, 16, 28, -1.7, -0.25, 6); for (let i = 0; i < 9; i++) { const a = -1.7 + i * 0.18; T.C(-6 + Math.cos(a) * 34, 16 + Math.sin(a) * 34, 1.7); } T.hi(() => T.C(10, -6, 2)); },
  misdash(T) { T.A(-6, 0, 12, HPI, HPI * 3, 7); T.g.fillRect(-6, -15.5, 10, 7); T.g.fillRect(-6, 8.5, 10, 7); T.arrow(8, 0, 27, 0, 7, 4); T.hi(() => T.C(-16, -2, 1.8)); },
  misstorm(T) { T.C(-10, -14, 9); T.C(4, -16, 11); T.C(14, -10, 8); T.g.fillRect(-18, -12, 34, 9); T.bolt(2, 12, 0.72); T.hi(() => T.C(0, -18, 2.2)); }
});
