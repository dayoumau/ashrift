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
let _akCG = null;
function akCut(x, y, z, len, ry, rz, life, col) {
  if (!FX.near(x, z, 60)) return; if (!_akCG) _akCG = new THREE.PlaneGeometry(1, 1);
  const g = new THREE.Group(), w = new THREE.Mesh(_akCG, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })),
    r = new THREE.Mesh(_akCG, new THREE.MeshBasicMaterial({ color: col || AKU.c, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  w.userData.own = r.userData.own = true; g.add(r, w); g.position.set(x, y, z); g.rotation.set(0, ry, rz); const L = life || 0.16;
  FX.add(g, L, (k, me) => { const s = k < 0.2 ? k / 0.2 : 1, f = 1 - k; w.scale.set(len * s, 0.035 * f + 0.01, 1); r.scale.set(len * s * 1.05, 0.12 * f + 0.02, 1); w.material.opacity = f; r.material.opacity = 0.8 * f; });
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
  for (let i = 0; i < n; i++) after(i * 0.03, () => { if (!t) return; akCut(t.x + rand(-0.3, 0.3), H + rand(-0.4, 0.5), t.z + rand(-0.3, 0.3), big ? rand(2.4, 3.4) : rand(1.6, 2.4), rand(TAU), rand(-1.2, 1.2), 0.14); });
  FX.sparks(t.x, H, t.z, { n: big ? 10 : 5, color: 0xffffff, color2: AKU.c, speed: [4, 10], life: [0.12, 0.3], w: 0.07 });
  FX.burst(t.x, H, t.z, { n: big ? 6 : 3, color: 0xb00818, color2: 0x3a0005, speed: [1, 4], life: [0.3, 0.6], size: [0.25, 0.05], grav: -10 });
}
// fingers (innate): the king grows stronger with every hero taken down near him — up to ten fingers, +3% damage each
function akFingers(h) { const n = h.fingers || 1, b = h.buffs.find(o => o.id === 'fingers'); if (!b) addBuff(h, { id: 'fingers', dur: 1e9, dmgOut: 1 + 0.03 * n }); else b.dmgOut = 1 + 0.03 * n; }
// dismantle: three invisible slashes fan out ahead; everything in the cone is cut
function akDismantle(h, dir, dmg) {
  const R = 7, half = 0.5; SFX.at('slash', h.x, h.z, 0.9); SFX.at('whoosh', h.x, h.z, 0.6);
  for (const e of enemiesIn(h, h.x, h.z, R + 0.5)) { if (e.struct) continue; const a = angTo(h.x, h.z, e.x, e.z); if (Math.abs(angDiff(dir, a)) > half + 0.15) continue; damage(h, e, dmg, 0); akCutsOn(e, 4, false); }
  if (!FX.near(h.x, h.z, 60)) return;
  for (let i = -1; i <= 1; i++) { const a = dir + i * 0.32; after(0.03 * (i + 1), () => { for (let s = 1; s <= 3; s++) { const d = s * 2.2, x = h.x + Math.sin(a) * d, z = h.z + Math.cos(a) * d; akCut(x, 1.0 + s * 0.1, z, 2.6, a + HPI + rand(-0.2, 0.2), rand(-0.3, 0.3), 0.16); } akScar(h.x + Math.sin(a) * (R * 0.55), h.z + Math.cos(a) * (R * 0.55), R * 0.9, a, 2.5); }); }
  FX.slash(h.x + Math.sin(dir) * 1.4, h.z + Math.cos(dir) * 1.4, dir, { r: 3, color: AKU.c, life: 0.18, sweep: 1.2 });
}
// cleave: a storm of cuts on one target that adapts to it — the tougher he is, the deeper they go
function akCleave(h, t, dmg) {
  h.trueT = Math.max(h.trueT || 0, G.time + 1.2); SFX.at('slash', t.x, t.z, 1); const low = t.kind === 'hero' && t.hp / t.maxHp < 0.35, k = low ? 1.4 : 1;
  for (let i = 0; i < 8; i++) after(0.05 * i, () => { if (!t.alive) return; damage(h, t, (dmg + t.maxHp * 0.06) / 8 * k, 0, { dot: i > 0 }); if (FX.near(t.x, t.z, 55)) { akCut(t.x + rand(-0.2, 0.2), (t.height || 2) * 0.55 + rand(-0.5, 0.5), t.z + rand(-0.2, 0.2), rand(2, 3.2), rand(TAU), rand(-1.4, 1.4), 0.15); if (i % 2) SFX.at('hit', t.x, t.z, 0.25); } });
  after(0.42, () => { if (!t.alive) return; slow(h, t, 0.3, 1, 'akcleave'); akCutsOn(t, 6, true); if (low) FX.text(t.x, (t.height || 2) + 1, t.z, 'глубже', '#ff6a7a', 14); if (FX.near(t.x, t.z, 50)) { FX.hitstop(0.05); FX.ring(t.x, t.z, { r0: 0.3, r1: 2.2, color: AKU.c, life: 0.25, tex: 'ringThin', y: 1.2 }); } });
}
// open — the fire arrow: a bow of flame takes shape in his hands, an arrow of white fire is loosed; it bursts on the first enemy hero
// (or at the end of its flight) into a column of fire, and the ground keeps burning
function akFuga(h, dir, dmg, burn) {
  const T = 0.45, near = FX.near(h.x, h.z, 60); h.trueT = Math.max(h.trueT || 0, G.time + 1); SFX.at('fire', h.x, h.z, 0.8);
  if (near) {   // the bow: two arcs of fire either side of the left hand, a drawn string of light
    const g = new THREE.Group(), tor = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.06, 6, 18, Math.PI * 1.1), FX.mat('pillar', AKU.fire, 0.9)); tor.userData.own = true; tor.rotation.z = Math.PI * 0.45; g.add(tor);
    FX.add(g, T + 0.15, (k, me, dt, en) => { if (!h.alive) { en.dead = true; return; } const a = h.facing; me.position.set(h.x + Math.sin(a) * 1.1, 1.6, h.z + Math.cos(a) * 1.1); me.rotation.y = a + HPI; me.scale.setScalar(Math.min(1, en.t / 0.15)); tor.material.opacity = 0.9 * (en.t > T ? Math.max(0, 1 - (en.t - T) / 0.15) : 1); if (Math.random() < dt * 30) FX.flame(me.position.x, 1.6 + rand(-0.6, 0.6), me.position.z, { n: 1, color: AKU.fire, color2: 0x8a1a05, size: [0.3, 0.7], life: [0.2, 0.4], up: 1 }); });
  }
  after(T, () => {
    if (!h.alive) return; const a = h.facing; SFX.at('boom', h.x, h.z, 0.5); SFX.at('fire', h.x, h.z, 0.9);
    const p = shot(h, { dir: a, speed: 42, range: 13, w: 0.9, mesh: 'arrow', size: 1.6, color: AKU.fire, ribbon: 1.2, heroOnly: true,
      trail: q => { if (FX.near(q.x, q.z, 55)) FX.flame(q.x, q.y, q.z, { n: 2, color: 0xffd08a, color2: AKU.fire, size: [0.5, 1.1], life: [0.15, 0.3], up: 0.5 }); },
      onHit: () => { }, onEnd: (x, z) => akFugaBurst(h, x, z, dmg, burn) });
  });
}
function akFugaBurst(h, x, z, dmg, burn) {
  const R = 3.5; for (const e of enemiesIn(h, x, z, R)) { damage(h, e, dmg, 1); }
  SFX.at('boom', x, z, 1); SFX.at('fire', x, z, 1);
  if (FX.near(x, z, 60)) { FX.explosion(x, z, 2.4, AKU.fire, { color2: 0x8a1a05 }); FX.pillar(x, z, { r: 1.6, h: 12, color: AKU.fire, life: 0.6, op: 0.5 }); FX.flame(x, 1, z, { n: 16, color: 0xffd08a, color2: AKU.fire, size: [1.4, 3], life: [0.5, 1], rad: 1.5, up: 4 }); FX.heat(x, 2, z, 3, 1.2); FX.scorch(x, z, 2.4, AKU.fire, 6); FX.shake(0.4); }
  zone(h, { x, z, r: 2.8, every: 0.5, dur: 3, tick: Z => { for (const e of enemiesIn(h, x, z, 2.8)) { damage(h, e, burn, 1, { dot: true }); if (e.alive) slow(h, e, 0.25, 0.6, 'akburn'); } if (FX.near(x, z, 50)) FX.flame(x, 0.4, z, { n: 5, color: AKU.fire, color2: 0x5a1005, size: [0.8, 1.8], life: [0.4, 0.8], rad: 2.2, up: 2 }); } });
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
  h.trueT = G.time + DUR + 0.3; h.shrineT = G.time + DUR; SFX.at('ultcue', x, z, 0.8); SFX.at('dark', x, z, 1); G.dim = Math.max(G.dim || 0, FX.near(x, z, 40) ? 0.7 : 0);
  globalWarn(h, null, 'Расширение территории: Храм злобы');
  if (G.player && h.team === G.player.team) mmMark({ x, z, r: R, color: '#ff4a5a', until: G.time + DUR });
  if (near) {
    FX.text(x, h.height + 1.6, z, 'Расширение территории', '#ff8a96', 18);
    const sh = akShrineMesh(), q = NAV.nearest(sx, sz);
    FX.add(sh, DUR + 0.8, (k, me, dt, en) => { const t = en.t, up = easeOut(Math.min(1, t / 0.6)), dn = t > DUR ? Math.min(1, (t - DUR) / 0.8) : 0; me.position.set(q.x, -7 * (1 - up) - 7 * dn * dn, q.z); me.rotation.y = sa + Math.PI; if (t < 0.7 && Math.random() < dt * 40) FX.debris(q.x + rand(-2.5, 2.5), 0.3, q.z + rand(-2, 2), { n: 1, color: 0x2a2426, speed: [1, 3], up: 6, size: [0.2, 0.5] }); });
    FX.burst(q.x, 0.5, q.z, { smoke: true, n: 18, color: 0x2a0a0e, color2: 0x050203, speed: [1, 4], life: [0.8, 1.5], size: [1.5, 3.2], rad: 2.5, up: 2, a: 0.6 }); FX.shake(0.5);
    // the ground of the domain: dark, veined with red, covered in fresh cuts
    const disc = new THREE.Mesh(FX.geo.flat, new THREE.MeshBasicMaterial({ map: TEX.disc, color: 0x1a0306, transparent: true, opacity: 0, depthWrite: false })); disc.scale.set(R * 2 * RK, 1, R * 2 * RK); disc.position.set(x, 0.07, z); disc.renderOrder = 3;
    FX.add(disc, DUR + 0.5, (k, me, dt, en) => { me.material.opacity = 0.55 * Math.min(1, en.t / 0.3, (DUR + 0.5 - en.t) / 0.5); });
    FX.zone(x, z, R, AKU.c, DUR, { tex: 'crack', spin: 0, op: 0.7 }); FX.wall(x, z, R, AKU.deep, DUR, { h: 1.6, op: 0.3, spin: 0 });
  }
  let acc = 0, t = 0, vis = 0;
  G.actors.push({ update(dt) {
    t += dt; acc += dt; vis += dt;
    if (near && vis > 0.04) { vis = 0; for (let i = 0; i < 3; i++) { const a = rand(TAU), r = Math.sqrt(Math.random()) * R, cx = x + Math.sin(a) * r, cz = z + Math.cos(a) * r; akCut(cx, rand(0.4, 3.2), cz, rand(2, 4.5), rand(TAU), rand(-1.4, 1.4), 0.15); if (Math.random() < 0.35) akScar(cx, cz, rand(1.5, 3.5), rand(TAU), 2); } }
    while (acc >= 0.25 && t <= DUR) { acc -= 0.25;
      for (const e of enemiesIn(h, x, z, R)) { if (e.struct) continue; damage(h, e, tick + (e.kind === 'hero' ? e.maxHp * 0.005 : 0), 0, { dot: true }); if (e.alive) slow(h, e, 0.25, 0.35, 'akshrine'); if (Math.random() < 0.5) akCutsOn(e, 2, false); }
      if (Math.random() < 0.5) SFX.at('slash', x + rand(-R, R) * 0.5, z + rand(-R, R) * 0.5, 0.35);
    }
    if (t >= DUR) {   // it closes with one last sweep of cuts across the whole circle
      for (const e of enemiesIn(h, x, z, R)) { if (e.struct) continue; damage(h, e, last, 0); akCutsOn(e, 6, true); }
      if (FX.near(x, z, 70)) { for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; akCut(x + Math.sin(a) * R * 0.5, 1.4, z + Math.cos(a) * R * 0.5, R, a + HPI, rand(-0.2, 0.2), 0.25); } FX.shock(x, z, R, 1, 0.5); FX.shake(0.5); FX.hitstop(0.06); }
      SFX.at('heavy', x, z, 0.9); return false;
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
// he takes 40% less damage, moves 40% faster and slips a third of all attacks; once a minute
function seLive(h) {
  if (G.time < (h.liveCd || 0) || !h.alive) return; h.liveCd = G.time + 60; h.liveT = G.time + 2.5;
  addBuff(h, { id: 'live', dur: 2.5, dmgIn: 0.6, ms: 0.4 }); FX.text(h.x, h.height + 1.2, h.z, 'Живи!', '#ff4a5a', 20); SFX.at('cue', h.x, h.z, 0.8);
  if (FX.near(h.x, h.z, 50)) { FX.ring(h.x, h.z, { r0: 2.2, r1: 0.4, color: 0xff2a3a, life: 0.35, tex: 'ringThin' }); FX.glow(h.x, h.height * 0.8, h.z, 3, 0xff2a3a, 0.3, 'star'); FX.aura(h, 0xff2a3a, 2.5, 1.6, 'ringThin', 3); }
}
// climbing in: the Paladin comes down out of the sky on wings of green light, lands, he leaps into the cockpit — and the knight is twice a man's height
function seMechOn(h, dur, armor) {
  if (h.mech) return; const lv = Math.max(1, h.al[3]);
  for (let i = 0; i < 4; i++) h.pilotCd[i] = h.cd[i];
  if (!h.mechRig) h.mechRig = buildHero(SEI_MECH, h.isPlayer ? 0xeaffea : TEAM_COL[h.team]);
  h.humanRig = h.rig; const old = h.rig, nr = h.mechRig; G.scene.remove(old.root); h.rig = nr; nr.root.visible = true; nr.root.position.set(h.x, 0, h.z); nr.root.rotation.y = h.facing; nr.root.scale.setScalar(nr.sc0); nr.tilt.rotation.x = 0; G.scene.add(nr.root);
  h.height = nr.height; h.radius = 1.45; h.anim.castT = 0; h.anim.atkT = 0; h.range = 3.2;
  const B = Object.getPrototypeOf(h.def); h.def.abilities = B.mechKit; h.def.noSlash = false; h.pcol = SEI.c;
  for (let i = 0; i < 4; i++) h.cd[i] = 0; h.fleija = true;
  h.mech = { until: G.time + dur };
  addBuff(h, { id: 'mech', dur, ad: 30 + lv * 12, def: 25, ms: 0.1, shield: armor, onEnd: (u, b) => seMechOff(u, b.shield <= 1) });
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
  if (broken) {   // shot down: the knight bursts in green fire and the pilot is thrown clear
    FX.explosion(mx, mz, 2.5, SEI.c, { color2: 0x0a4a2a }); FX.debris(mx, 2, mz, { n: 14, color: 0xdfe3ea, speed: [3, 9], up: 9, size: [0.2, 0.5] }); SFX.at('boom', mx, mz, 1); FX.text(mx, 4, mz, 'Паладин сбит', '#9fffd4', 16);
  } else {   // its time is up: the knight spreads its wings and rises away
    const g = twGhost(old, SEI.c, 1.2, 0.5, mx, mz); if (g) { g.mesh.rotation.y = face; const e = g.fn; g.fn = (k, me, dt, en) => { e(k, me, dt, en); me.position.y = 18 * k * k; }; }
    FX.pillar(mx, mz, { r: 1.2, h: 14, color: SEI.c, life: 0.6, op: 0.35 }); SFX.at('whoosh', mx, mz, 0.8);
  }
  SFX.at('whoosh', h.x, h.z, 0.5);
}
function seHud(h) {
  if (typeof UI === 'undefined' || !$('abs')) return; const D = h.def, col = h.mech ? SEI.c : D.look.glow;
  for (let i = 0; i < 4; i++) { const a = D.abilities[i], el = $('ab' + i); if (!a || !el) continue; el.children[0].src = iconURL(a.icon, a.iconCol || col); const c = el.querySelector('.cost'); if (c) c.textContent = a.cost || ''; }
  UI.lastCd = h.cd.slice(); G.aim = -1; UI.tip();
}
// the Paladin's arrival: it drops from high above with its wings blazing, the ground cracks under it
function seMechArrive(h, cb) {
  const x = h.x, z = h.z, T = 0.75; SFX.at('whoosh', x, z, 1); SFX.at('ultcue', x, z, 0.6);
  if (FX.near(x, z, 70)) {
    if (!h.mechRig) h.mechRig = buildHero(SEI_MECH, h.isPlayer ? 0xeaffea : TEAM_COL[h.team]);
    const g = twGhost(h.mechRig, SEI.c, T, 0.8, x, z); if (g) { const f0 = g.fn; g.fn = (k, me, dt, en) => { f0(k, me, dt, en); me.position.set(h.x, 26 * (1 - easeOut(k)), h.z); me.rotation.y = h.facing; me.scale.setScalar(h.mechRig.sc0); if (Math.random() < 0.6) FX.trail(h.x + rand(-1, 1), me.position.y + 3, h.z + rand(-1, 1), SEI.c, 1.2, 2); }; }
    FX.decal(x, z, 3, SEI.c, T);
  }
  after(T, () => { if (!h.alive) return; SFX.at('heavy', h.x, h.z, 1); SFX.at('rubble', h.x, h.z, 0.7); if (FX.near(h.x, h.z, 60)) { FX.ring(h.x, h.z, { r0: 0.5, r1: 5, color: SEI.c, life: 0.5, tex: 'shock' }); FX.shock(h.x, h.z, 5, 1.1, 0.45); FX.debris(h.x, 0.3, h.z, { n: 14, color: 0x45423c, speed: [3, 9], up: 9, size: [0.2, 0.5] }); FX.burst(h.x, 0.5, h.z, { smoke: true, n: 12, color: 0xb8c0b8, color2: 0x3a3e3a, speed: [2, 6], life: [0.6, 1.2], size: [1.2, 2.6], ring: true, a: 0.45 }); FX.shake(0.5); FX.scorch(h.x, h.z, 2.2, SEI.c, 6); }
    for (const e of enemiesIn(h, h.x, h.z, 3.5)) { if (!e.struct) { damage(h, e, cb.land, 0); if (e.alive) stun(h, e, 0.8, 1); } }
    cb.on();
  });
}
// the VARIS: a charged round from the rifle in the knight's arms — a bolt of green-white energy that goes through everything and throws them back
function seVaris(h, dir, dmg) {
  SFX.at('laser', h.x, h.z, 0.9); SFX.at('boom', h.x, h.z, 0.4); const sx = h.x + Math.sin(dir) * 2.2, sz = h.z + Math.cos(dir) * 2.2;
  if (FX.near(sx, sz, 60)) { FX.glow(sx, 3, sz, 4, SEI.c, 0.2, 'star'); FX.ring(sx, sz, { r0: 0.3, r1: 2.2, color: SEI.pale, life: 0.25, tex: 'ringThin', y: 3 }); FX.warp('lens', sx, 3, sz, { r: 2.5, str: 0.8, life: 0.25 }); }
  shot(h, { x: sx, z: sz, y: 3, dir, speed: 55, range: 14, w: 1.0, pierce: true, mesh: 'bolt', size: 2.4, color: SEI.c, ribbon: 1.4,
    onHit: e => { damage(h, e, dmg, 0); knock(e, h.x, h.z, 2, 0.2); if (FX.near(e.x, e.z, 50)) { FX.sparks(e.x, 1.4, e.z, { n: 12, color: 0xffffff, color2: SEI.c, speed: [4, 11], life: [0.15, 0.35], w: 0.09, dir, spread: 0.5 }); FX.hit(e.x, 1.4, e.z, SEI.c, true); } } });
}
// MVS: both blades out, one wide spin — a ring of hot red edges
function seMvs(h, dmg) {
  h.spinning = true; h.spinEnd = G.time + 0.45; SFX.at('slash', h.x, h.z, 1); SFX.at('whoosh', h.x, h.z, 0.7);
  for (const e of enemiesIn(h, h.x, h.z, 4.2)) { if (e.struct) continue; damage(h, e, dmg, 0); if (e.alive) slow(h, e, 0.3, 1.5, 'semvs'); }
  if (FX.near(h.x, h.z, 55)) { FX.slash(h.x, h.z, h.facing, { r: 4.2, color: 0xff4a3a, life: 0.3, sweep: 6.2, y: 2.5 }); FX.slash(h.x, h.z, h.facing + Math.PI, { r: 3.8, color: SEI.c, life: 0.3, sweep: 6.2, y: 2.0, flip: true }); FX.ring(h.x, h.z, { r0: 1, r1: 4.6, color: 0xff4a3a, life: 0.35, tex: 'shock' }); FX.sparks(h.x, 2.5, h.z, { n: 18, color: 0xffffff, color2: 0xff4a3a, speed: [5, 12], life: [0.15, 0.35], w: 0.09, ring: true }); }
}
// slash harken: a cable fired from the waist; it bites the first enemy (the knight is hauled to him and he is stunned) or the ground (the knight is hauled there)
function seHarken(h, x, z, dmg) {
  const dir = angTo(h.x, h.z, x, z), len = Math.min(11, dist(h.x, h.z, x, z) + 0.5); let hitU = null; SFX.at('dash', h.x, h.z, 0.8);
  for (const e of stripHits(h, h.x, h.z, dir, len, 0.8)) if (!e.struct && (!hitU || udist(h, e) < udist(h, hitU))) hitU = e;
  const tx = hitU ? hitU.x : h.x + Math.sin(dir) * len, tz = hitU ? hitU.z : h.z + Math.cos(dir) * len;
  if (FX.near(h.x, h.z, 60)) FX.beam(h.x, h.z, tx, tz, { color: SEI.c, w: 0.25, life: 0.35, y: 1.8 });
  const stop = hitU ? hitU.radius + 1.5 : 0;
  dashTo(h, tx, tz, 34, { stop, ribbon: SEI.c, fly: true, onEnd: () => { if (hitU && hitU.alive) { damage(h, hitU, dmg, 0); stun(h, hitU, 0.6); if (FX.near(hitU.x, hitU.z, 50)) FX.hit(hitU.x, 1.6, hitU.z, SEI.c, true); SFX.at('heavy', hitU.x, hitU.z, 0.7); } } });
}
// FLEIJA: a warhead fired at a point — a sphere of pink light swells, swallowing everything inside, then collapses into nothing
function seFleija(h, x, z, dmg) {
  const R = 7, T = 0.7, near = FX.near(x, z, 80); h.fleija = false; SFX.at('ultcue', h.x, h.z, 0.9); globalWarn(h, null, 'ФЛЕЙЯ!');
  G.dangers.push({ x, z, r: R, team: h.team, until: G.time + T + 1 });
  if (near) {
    FX.decal(x, z, R, SEI.flj, T);
    const w = new THREE.Mesh(FX.geo.orb, new THREE.MeshBasicMaterial({ color: SEI.flj })), sx = h.x, sz = h.z;
    FX.add(w, T, (k, me) => { me.position.set(lerp(sx, x, k), 3 + Math.sin(Math.PI * k) * 8, lerp(sz, z, k)); me.scale.setScalar(0.8); FX.trail(me.position.x, me.position.y, me.position.z, SEI.flj, 0.8, 3); });
  }
  after(T, () => {
    SFX.at('boom', x, z, 1); SFX.at('warp', x, z, 1); SFX.at('heavy', x, z, 0.8); if (FX.near(x, z, 60)) { G.dim = Math.max(G.dim || 0, 0.6); FX.punch(0.8); FX.shake(0.8); FX.hitstop(0.08); }
    const GROW = 0.7, HOLD = 0.5, FALL = 0.45, TOT = GROW + HOLD + FALL;
    if (FX.near(x, z, 80)) {
      const sh = new THREE.Mesh(FX.geo.sphere, FX.rimMat(SEI.flj, 1.4)), core = new THREE.Mesh(FX.geo.sphere, new THREE.MeshBasicMaterial({ color: 0xffb0ea, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false })); core.userData.own = true; sh.add(core); core.scale.setScalar(0.96);
      FX.add(sh, TOT, (k, me, dt, en) => { const t = en.t, s = t < GROW ? R * easeOut(t / GROW) : (t < GROW + HOLD ? R * (1 + Math.sin(t * 30) * 0.01) : R * Math.max(0.01, 1 - easeOut((t - GROW - HOLD) / FALL))); me.position.set(x, 0, z); me.scale.setScalar(s); me.material.uniforms.o.value = 1.4 * (t < GROW + HOLD ? 1 : Math.max(0, 1 - (t - GROW - HOLD) / FALL)); core.material.opacity = 0.25 * (t < GROW + HOLD ? 1 : 1 - (t - GROW - HOLD) / FALL); });
      FX.warp('lens', x, 2, z, { r: R * 1.2, str: 1.5, life: GROW + HOLD }); FX.light(x, 4, z, SEI.flj, 3, 30, TOT);
      after(GROW + HOLD, () => { FX.warp('lens', x, 2, z, { r: R, str: -1.6, life: FALL }); FX.implode(x, 2, z, R, { color: SEI.fljPale, color2: SEI.flj, n: 40, life: FALL, streak: true }); });
      after(TOT, () => { FX.glow(x, 2, z, 8, SEI.flj, 0.3, 'star'); FX.ring(x, z, { r0: 0.3, r1: R + 1, color: SEI.flj, life: 0.5, tex: 'shock', op: 0.7 }); FX.scorch(x, z, 3.2, SEI.flj, 8); SFX.at('void', x, z, 0.8); });
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
    stats: ST(620, 90, 330, 34, 62, 3.8, 26, 2.9, 0.85, 9.2, 2.4), noSlash: true,
    innate: { name: 'Пальцы короля', icon: 'akinn', desc: 'Акуро становится сильнее, возвращая себе пальцы: каждый вражеский герой, погибший рядом с ним (до 14), даёт палец — +3% урона за каждый, до десяти. Первый палец у него с начала матча.', count: h => h.fingers || 1 },
    onDeal(h, t, d, o) { if (o.basic && FX.near(t.x, t.z, 45)) akCut(t.x, (t.height || 2) * 0.55, t.z, rand(1.4, 2.2), h.facing + HPI + rand(-0.4, 0.4), rand(-0.8, 0.8), 0.12); },
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
    innate: { name: 'Живи!', icon: 'seinn', desc: 'В Сэйрю вложен приказ «Живи!»: когда у него остаётся меньше четверти здоровья, глаза вспыхивают красным, и 2.5 сек он получает на 40% меньше урона и бегает на 40% быстрее. Не чаще раза в минуту — и в мехе тоже.', count: h => h.liveCd > G.time ? Math.ceil(h.liveCd - G.time) : '' },
    onHurt(h) { if (h.alive && h.hp < h.maxHp * 0.25) seLive(h); },
    onDeath(h) { if (h.mech) seMechOff(h, true); },
    // a spent warhead: the R slot counts down the time left in the mech
    tick(h, dt) { if (!h.mech) for (let i = 0; i < 4; i++) if (h.pilotCd[i] > 0) h.pilotCd[i] -= dt; if (h.mech) for (let i = 0; i < 3; i++) if (h.pilotCd[i] > 0) h.pilotCd[i] -= dt; if (h.mech && !h.fleija) h.cd[3] = Math.max(0.1, h.mech.until - G.time); if (h.spinEnd && G.time > h.spinEnd) { h.spinning = false; h.spinEnd = 0; } },
    abilities: [
      {
        key: 'Q', name: 'Удар в прыжке', icon: 'seflip', cd: 8, cost: 50, range: 6, ind: { type: 'circle', r: 2.2 }, anim: 'slam', animDur: 0.55, lock: 0, ai: { t: 'gap', rad: 2.2 },
        desc: 'Сэйрю в сальто перелетает к точке (до 6) и обрушивает удар ногой: физический урон всем врагам в радиусе 2.2, и их подбрасывает — оглушение на 0.6 сек.',
        cast(h, p) { const dmg = D(h, 70, 18, 0.9, 0), T = Math.max(0.25, p.dist / 20); dashTo(h, p.x, p.z, 20, { arc: 2.4, ribbon: SEI.c }); after(T, () => { if (!h.alive) return; for (const e of enemiesIn(h, h.x, h.z, 2.2)) { if (e.struct) continue; damage(h, e, dmg, 0); if (e.alive) stun(h, e, 0.6, 1.4); } SFX.at('heavy', h.x, h.z, 0.8); if (FX.near(h.x, h.z, 55)) { FX.ring(h.x, h.z, { r0: 0.3, r1: 2.8, color: SEI.c, life: 0.35, tex: 'shock' }); FX.burst(h.x, 0.3, h.z, { smoke: true, n: 6, color: 0xc8c0b0, color2: 0x4a4038, speed: [1, 3], life: [0.4, 0.8], size: [0.7, 1.4], ring: true, a: 0.4 }); FX.sparks(h.x, 0.5, h.z, { n: 10, color: 0xffffff, color2: SEI.c, speed: [3, 8], life: [0.2, 0.4], w: 0.07, up: 3 }); } }); }
      },
      {
        key: 'W', name: 'Удар коленом', icon: 'seknee', cd: 10, cost: 50, range: 3, ind: { type: 'target', hero: false }, anim: 'thrust', animDur: 0.4, lock: 0.25, ai: { t: 'target' },
        desc: 'Сэйрю врывается к врагу (до 3) и бьёт коленом: физический урон и оглушение на 0.9 сек.',
        cast(h, p) { const t = p.unit; if (!t || !t.alive) return false; const a = angTo(h.x, h.z, t.x, t.z); blink(h, t.x - Math.sin(a) * 1.4, t.z - Math.cos(a) * 1.4); h.facing = a; damage(h, t, D(h, 55, 15, 0.8, 0), 0); if (t.alive) stun(h, t, 0.9); SFX.at('heavy', t.x, t.z, 0.8); if (FX.near(t.x, t.z, 50)) { FX.hit(t.x, 1.4, t.z, SEI.c, true); FX.ring(t.x, t.z, { r0: 0.3, r1: 1.8, color: SEI.c, life: 0.25, tex: 'ringThin', y: 1.3 }); } }
      },
      {
        key: 'E', name: 'Бег по стенам', icon: 'sewall', cd: 12, cost: 45, range: 7, ind: { type: 'circle', r: 0.8 }, anim: 'feint', animDur: 0.35, lock: 0, ai: { t: 'escape' },
        desc: 'Сэйрю одним махом перелетает к точке (до 7), не замечая стен и обрывов, и 2 сек бегает на 30% быстрее.',
        cast(h, p) { dashTo(h, p.x, p.z, 26, { arc: 3, fly: true, ribbon: SEI.c }); addBuff(h, { id: 'sewall', dur: 2, ms: 0.3 }); SFX.at('whoosh', h.x, h.z, 0.8); }
      },
      {
        key: 'R', name: 'Паладин', icon: 'semech', cd: 95, cost: 100, range: 0, ind: { type: 'self', r: 3.5 }, anim: 'cast', animDur: 0.6, lock: 0.75, ai: { t: 'buff', ult: true, hp: 0.9 },
        desc: 'С неба на крыльях зелёного света спускается найтмер «Паладин»: приземление бьёт и оглушает врагов в радиусе 3.5, и Сэйрю забирается внутрь на 15 сек. Меха вдвое выше человека, сильнее бьёт мечом, крепче и быстрее, а броня — щит, который принимает удары на себя (если его пробить, меха взорвётся и пилот выпадет). В мехе у Сэйрю другие умения: винтовка ВАРИС, мечи МВС, слэш-харкен и — один раз за вылет — боеголовка «Флейя».',
        cast(h) { const lv = Math.max(1, h.al[3]); seMechArrive(h, { land: D(h, 80, 30, 0.6, 0), on: () => seMechOn(h, 15, 450 + lv * 220 + h.maxHp * 0.35) }); }
      }
    ],
    mechKit: [
      {
        key: 'Q', name: 'Винтовка ВАРИС', icon: 'sevaris', cd: 5, cost: 0, range: 14, ind: { type: 'line', w: 2, fixed: true }, anim: 'shoot', animDur: 0.4, lock: 0.25, ai: { t: 'shot', sp: 55 },
        desc: 'Заряженный выстрел из винтовки: энергетический снаряд летит на 14, пробивает всех врагов на пути (физический урон) и отбрасывает их.',
        cast(h, p) { seVaris(h, p.dir, D(h, 90, 26, 1.0, 0)); }
      },
      {
        key: 'W', name: 'Мечи МВС', icon: 'semvs', cd: 6, cost: 0, range: 0, ind: { type: 'self', r: 4.2 }, anim: 'cast', animDur: 0.4, lock: 0.3, ai: { t: 'nova', r: 4 },
        desc: 'Паладин раскручивается с двумя раскалёнными мечами: физический урон всем врагам в радиусе 4.2 и замедление на 30% на 1.5 сек.',
        cast(h) { seMvs(h, D(h, 80, 22, 1.1, 0)); }
      },
      {
        key: 'E', name: 'Слэш-харкен', icon: 'seharken', cd: 9, cost: 0, range: 11, ind: { type: 'line', w: 1.6 }, anim: 'thrust', animDur: 0.3, lock: 0, ai: { t: 'gap' },
        desc: 'Из пояса мехи вылетает якорь на тросе (до 11). Зацепив врага, он подтягивает Паладина к нему — удар и оглушение на 0.6 сек; иначе подтягивает к точке.',
        cast(h, p) { seHarken(h, p.x, p.z, D(h, 60, 16, 0.6, 0)); }
      },
      {
        key: 'R', name: 'Флейя', icon: 'sefleija', cd: 0, cost: 0, range: 14, ind: { type: 'circle', r: 7 }, anim: 'shoot', animDur: 0.5, lock: 0.3, ai: { t: 'point', rad: 7, delay: 1.2, ult: true, hp: 0.9 },
        desc: 'Один раз за вылет: боеголовка «Флейя» уходит в точку (до 14). Там раздувается розовая сфера радиусом 7 — каждый, кого она коснулась, получает огромный магический урон, — а потом схлопывается в ничто, ударив ещё раз и замедлив.',
        cast(h, p) { if (!h.fleija) return false; seFleija(h, p.x, p.z, D(h, 240, 80, 0, 1.0) + h.ad * 0.8); return { cd: 999 }; }
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
