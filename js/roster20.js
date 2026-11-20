'use strict';
/* ===== roster, part 46 (hero 74). Loaded after roster19.js; glyphs go to GLYPH at the end.
   74. Margo — the moneylender of the Rift: a support who fights with an iron strongbox that doubles as a cannon. Everything her abilities hit
       falls into her debt (it takes more damage from everyone for a while); a gold shell that bursts on the first enemy, a line of credit that
       shields an ally and lets their attacks put enemies in debt too, a thrown safe that opens into a small gravity well, and a bankruptcy —
       a vault that drags every enemy around it into its heart and holds them there. ===== */
const MG = { c: 0xffc83a, hot: 0xfff0b0, vio: 0x8a4aff, deep: 0x2a1446, grn: 0x3ad88a };
let _mgCoinG = null, _mgBoxG = null;
function mgCoinGeo() { if (!_mgCoinG) _mgCoinG = new THREE.CylinderGeometry(0.17, 0.17, 0.045, 14); return _mgCoinG; }
// three gold coins circling over a debtor's head; one ring per unit, its time is extended by fresh debt
function mgDebtFx(e, dur) {
  if (!FX.near(e.x, e.z, 50)) return;
  if (e.mgFx && !e.mgFx.dead) { e.mgFx.until = Math.max(e.mgFx.until, G.time + dur); return; }
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) { const m = new THREE.Mesh(mgCoinGeo(), new THREE.MeshBasicMaterial({ color: i ? MG.c : MG.hot, transparent: true, depthWrite: false })); m.userData.own = true; m.rotation.x = HPI * 0.75; g.add(m); }
  const st = { until: G.time + dur, dead: false };
  FX.add(g, 999, (k, me, dt, ent) => {
    if (!e.alive || G.time > st.until) { ent.dead = true; st.dead = true; if (e.mgFx === st) e.mgFx = null; return; }
    const t = G.time * 3.2, left = st.until - G.time, op = Math.min(1, left * 3);
    me.position.set(e.x, e.height + 0.45 + (e.yOff || 0), e.z);
    me.children.forEach((c, i) => { const a = t + i / 3 * TAU; c.position.set(Math.sin(a) * 0.55, Math.sin(t * 2 + i) * 0.06, Math.cos(a) * 0.55); c.rotation.y = a; c.material.opacity = op; });
  });
  e.mgFx = st;
}
// debt: the unit takes 10% more damage from everyone for `dur` seconds
function mgDebt(h, e, dur) {
  if (!e.alive || e.struct) return;
  addBuff(e, { id: 'mgdebt', dur: dur || 4, dmgIn: 1.1, src: h }); mgDebtFx(e, dur || 4);
}
// the muzzle of the strongbox, carried level at the right hip
function mgMuzzle(h, dir) { const s = Math.sin(dir), c = Math.cos(dir); return { x: h.x + s * 1.0 + c * 0.35, y: 1.15, z: h.z + c * 1.0 - s * 0.35 }; }
function mgFlash(h, dir, big) {
  const m = mgMuzzle(h, dir); if (!FX.near(m.x, m.z, 50)) return m;
  FX.glow(m.x, m.y, m.z, big ? 2.6 : 1.4, MG.c, big ? 0.2 : 0.12, 'star'); FX.sparks(m.x, m.y, m.z, { n: big ? 10 : 4, color: MG.hot, speed: [4, 9], life: [0.15, 0.3] });
  if (big) { FX.light(m.x, m.y, m.z, MG.c, 2, 8, 0.2); FX.burst(m.x, m.y, m.z, { n: 6, color: 0x8a8070, speed: [1, 3], life: [0.4, 0.7], size: [0.5, 1.2] }); }
  return m;
}
// a shower of gold coins spinning out of a point
function mgCoins(x, y, z, n, sp) {
  if (!FX.near(x, z, 50)) return;
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(mgCoinGeo(), new THREE.MeshBasicMaterial({ color: i % 3 ? MG.c : MG.hot, transparent: true, depthWrite: false }));
    const a = rand(TAU), v = rand(0.5, 1) * (sp || 5), vy = rand(4, 8), rs = rand(8, 16);
    FX.add(m, rand(0.6, 0.9), (k, me, dt) => { const t = k * 0.8; me.position.set(x + Math.sin(a) * v * t, Math.max(0.05, y + vy * t - 14 * t * t), z + Math.cos(a) * v * t); me.rotation.x += rs * dt; me.rotation.z += rs * 0.6 * dt; me.material.opacity = k < 0.7 ? 1 : (1 - k) / 0.3; });
  }
}
// the gold shell bursts: magic damage around it, a slow and debt
function mgBurst(h, x, z, dmg) {
  for (const e of enemiesIn(h, x, z, 2.8)) { if (e.struct) continue; damage(h, e, dmg, 1); if (e.alive) { slow(h, e, 0.25, 1.5, 'mgq'); mgDebt(h, e, 4); } }
  SFX.at('boom', x, z, 0.4); SFX.at('cash', x, z, 0.5);
  if (FX.near(x, z, 55)) {
    FX.explosion(x, z, 1.6, MG.c, { smoke: false }); FX.ring(x, z, { r0: 0.4, r1: 3.0, color: MG.c, life: 0.35, tex: 'shock' }); FX.ring(x, z, { r0: 2.6, r1: 2.0, color: MG.hot, life: 0.45, tex: 'ringThin' });
    FX.glow(x, 1.2, z, 4, MG.hot, 0.2, 'flare'); FX.light(x, 1.5, z, MG.c, 2.5, 10, 0.3); FX.scorch(x, z, 1.6); mgCoins(x, 1.1, z, 9, 5);
  }
}
// a strongbox mesh: dark iron with gold corners and a dial
function mgBoxMesh(s) {
  if (!_mgBoxG) _mgBoxG = new THREE.BoxGeometry(1, 0.8, 0.8);
  const g = new THREE.Group(), iron = new THREE.MeshBasicMaterial({ color: 0x2a2630 }), gold = new THREE.MeshBasicMaterial({ color: MG.c }), glow = new THREE.MeshBasicMaterial({ color: MG.vio, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  for (const m of [iron, gold, glow]) m.userData.own = true;
  const box = new THREE.Mesh(_mgBoxG, iron); box.userData.own = true; g.add(box);
  for (const [x, y] of [[-0.5, 0.4], [0.5, 0.4], [-0.5, -0.4], [0.5, -0.4]]) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.84), gold); c.userData.own = true; c.position.set(x, y, 0); g.add(c); }
  const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.06, 12), gold); dial.rotation.x = HPI; dial.position.set(0, 0, 0.42); dial.userData.own = true; g.add(dial);
  const seam = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.05, 0.82), glow); seam.userData.own = true; g.add(seam);
  g.scale.setScalar(s || 1); return g;
}
// «Black box»: the safe lands, opens and pulls everything nearby towards its heart for 2.5 seconds
function mgWell(h, x, z, land, tick) {
  const R = 4.5, DUR = 2.5;
  for (const e of enemiesIn(h, x, z, R)) { if (e.struct) continue; damage(h, e, land, 1); if (e.alive) mgDebt(h, e, 4); }
  SFX.at('vault', x, z, 0.8); SFX.at('void', x, z, 0.5);
  if (FX.near(x, z, 60)) {
    FX.zone(x, z, R, MG.vio, DUR, { tex: 'rune2', spin: -1.6, op: 0.45 }); FX.zone(x, z, R * 0.5, MG.c, DUR, { tex: 'ringThin', spin: 2.4, op: 0.5 });
    FX.ring(x, z, { r0: 0.4, r1: R, color: MG.c, life: 0.4, tex: 'shock' }); FX.shock(x, z, R, 1, 0.4); FX.shake(0.12); mgCoins(x, 1, z, 8, 4);
  }
  const box = FX.near(x, z, 60) ? mgBoxMesh(0.9) : null; let boxE = null;
  if (box) boxE = FX.add(box, DUR + 0.3, (k, me) => { const t = k * (DUR + 0.3); me.position.set(x, 0.45 + Math.sin(t * 5) * 0.05, z); me.rotation.y = t * 1.5; const q = 0.9 * (t > DUR ? Math.max(0.01, 1 - (t - DUR) / 0.3) : 1); me.scale.setScalar(q); });
  let t = 0, acc = 0, fxT = 0, n = 0;
  G.actors.push({ update(dt) {
    t += dt; acc += dt; fxT += dt;
    if (fxT > 0.07 && FX.near(x, z, 55)) { fxT = 0; const a = rand(TAU), r = rand(R * 0.5, R); FX.sparks(x + Math.sin(a) * r, 0.6, z + Math.cos(a) * r, { n: 1, color: Math.random() < 0.5 ? MG.vio : MG.c, speed: [0.5, 1], life: [0.3, 0.45] }); FX.bolt(x + Math.sin(a) * r, 0.4, z + Math.cos(a) * r, x, 0.7, z, { color: MG.vio, w: 0.06, life: 0.16 }); }
    if (acc >= 0.25) {
      acc -= 0.25;
      n++; for (const e of enemiesIn(h, x, z, R)) { if (e.struct) continue; if (n % 2) { damage(h, e, tick, 1, { dot: true }); if (!e.alive) continue; } slow(h, e, 0.3, 0.4, 'mgwell'); if (udist({ x, z }, e) > 1.0) knock(e, x, z, -0.55, 0.12); }
    }
    if (t >= DUR) { SFX.at('clang', x, z, 0.5); if (FX.near(x, z, 55)) { FX.ring(x, z, { r0: R, r1: 0.4, color: MG.vio, life: 0.3, tex: 'ringThin' }); FX.glow(x, 0.8, z, 3, MG.vio, 0.25, 'flare'); } return false; }
    return true;
  } });
  return boxE;
}
// «Bankruptcy»: a vault door opens over the ground; after a moment every enemy around is dragged into it, hurt, put in deep debt and held in the field
function mgBankrupt(h, x, z, hit, end, sh) {
  const R = 6.5, HOLD = 4;
  telegraph(h, x, z, R, 0.6, MG.c); SFX.at('ultcue', h.x, h.z, 0.7); SFX.at('vault', x, z, 0.7);
  if (FX.near(x, z, 60)) {
    FX.text(h.x, h.height + 1.3, h.z, 'Банкротство!', '#ffd86a', 18);
    FX.zone(x, z, R, MG.c, 0.6, { tex: 'rune2', spin: 1.4, op: 0.5 });
    for (let i = 0; i < 6; i++) after(i * 0.08, () => FX.ring(x, z, { r0: R, r1: R * 0.3, color: i % 2 ? MG.vio : MG.c, life: 0.25, tex: 'ringThin' }));
  }
  for (const o of G.heroes) if (o.alive && o.team === h.team && dist(o.x, o.z, x, z) < R) { shield(h, o, sh, HOLD, MG.c); if (FX.near(o.x, o.z, 45)) FX.heal(o, MG.c); }
  after(0.6, () => {
    for (const e of enemiesIn(h, x, z, R + 0.5)) { if (e.struct) continue; pullTo(e, x, z, 16, 1.2); damage(h, e, hit, 1); if (e.alive) { mgDebt(h, e, HOLD + 1); addBuff(e, { id: 'mgbank', dur: HOLD + 0.5, dmgIn: 1.15, src: h }); } }
    SFX.at('boom', x, z, 0.8); SFX.at('void', x, z, 0.8); SFX.at('cash', x, z, 0.8);
    if (FX.near(x, z, 65)) {
      FX.ring(x, z, { r0: R, r1: 0.5, color: MG.c, life: 0.35, tex: 'shock' }); FX.shock(x, z, R, 1.4, 0.5); FX.shake(0.3); FX.glow(x, 2, z, 8, MG.hot, 0.35, 'flare'); FX.light(x, 3, z, MG.c, 3, 18, 0.5);
      FX.pillar(x, z, { r: 1.6, h: 14, color: MG.vio, life: 0.8, op: 0.5, spin: 1 }); FX.pillar(x, z, { r: 0.8, h: 14, color: MG.hot, life: 0.5, op: 0.7 });
      FX.zone(x, z, R, MG.vio, HOLD, { tex: 'rune2', spin: -0.9, op: 0.4 }); FX.zone(x, z, R * 0.6, MG.c, HOLD, { tex: 'ringThin', spin: 1.8, op: 0.45 }); FX.zone(x, z, 2, MG.deep, HOLD, { tex: 'shock', spin: 3, op: 0.6 });
      mgCoins(x, 1.4, z, 16, 7);
      const vault = mgBoxMesh(2.2); FX.add(vault, HOLD + 0.4, (k, me) => { const t = k * (HOLD + 0.4); me.position.set(x, 2.8 + Math.sin(t * 2) * 0.2, z); me.rotation.y = t * 0.9; me.rotation.z = Math.sin(t * 1.3) * 0.15; me.scale.setScalar(2.2 * Math.min(1, t * 4) * (t > HOLD ? Math.max(0.01, 1 - (t - HOLD) / 0.4) : 1)); });
    }
    let t = 0, acc = 0, fxT = 0;
    G.actors.push({ update(dt) {
      t += dt; acc += dt; fxT += dt;
      if (fxT > 0.06 && FX.near(x, z, 60)) { fxT = 0; const a = rand(TAU), r = rand(2, R); FX.bolt(x + Math.sin(a) * r, 0.3, z + Math.cos(a) * r, x, 2.4, z, { color: Math.random() < 0.5 ? MG.vio : MG.c, w: 0.08, life: 0.18 }); if (Math.random() < 0.3) mgCoins(x + Math.sin(a) * r, 0.3, z + Math.cos(a) * r, 1, 1); }
      if (acc >= 0.5) { acc -= 0.5; for (const e of enemiesIn(h, x, z, R)) { if (e.struct) continue; slow(h, e, 0.35, 0.7, 'mgbslow'); if (udist({ x, z }, e) > 1.5) knock(e, x, z, -0.9, 0.15); } }
      if (t >= HOLD) {
        for (const e of enemiesIn(h, x, z, R)) { if (e.struct) continue; damage(h, e, end, 1); }
        SFX.at('vault', x, z, 0.9); SFX.at('boom', x, z, 0.6);
        if (FX.near(x, z, 60)) { FX.explosion(x, z, 3, MG.c, { smoke: false }); FX.ring(x, z, { r0: 0.5, r1: R, color: MG.c, life: 0.45, tex: 'shock' }); FX.ring(x, z, { r0: 1, r1: R * 0.8, color: MG.vio, life: 0.55, tex: 'ringThin' }); FX.shake(0.22); mgCoins(x, 2, z, 14, 7); }
        return false;
      }
      return true;
    } });
  });
}

HEROES.push(
  /* ================= 74. Margo ================= */
  {
    id: 'margo', name: 'Марго', title: 'Ростовщица Разлома', role: 'support', roleName: 'Поддержка', build: 'support', bars: [3, 3, 3, 2], diffc: 2, projMesh: 'orb', atkSfx: 'coinshot',
    lore: 'Марго держит единственную меняльную лавку у самого Разлома и даёт в долг всем — наёмникам, контрабандистам, даже тварям, если те умеют платить. Долги она собирает лично: её железный сейф на ремне стреляет золотом, а если открыть его настежь, он тянет к себе всё, что плохо лежит. Говорят, она ни разу не простила ни одного долга. Сама Марго поправляет зелёный козырёк и уточняет: «Ни одного — без процентов».',
    look: { bulk: 0.88, h: 1.0, scale: 1.0, lin: 0x2e1c34, c1: 0xf2eee6, c2: 0x2a2630, c3: 0x16141a, skin: 0xf0d4c2, hands: 0x2a2630, cuff: 0xb8202c, metal: MG.c, glow: MG.vio, head: 'margo', hair: 0x16141c, shirt: 0xf2eee6, chest: 'banker', legs: 'suit', sh: 'none', weapon: 'strongbox', wc: 'laser' },
    stats: ST(560, 82, 440, 46, 46, 2.6, 22, 2.6, 0.7, 8.9, 7.0),
    innate: { name: 'Проценты', icon: 'mginn', desc: 'Все враги, задетые умениями Марго, на 4 сек становятся её должниками: они получают на 10% больше урона от всех источников (над головой у них кружат монеты). Атаки Марго по должнику продлевают долг.' },
    shootAtk(u, t) {
      const dir = angTo(u.x, u.z, t.x, t.z), m = mgFlash(u, dir, false); SFX.at('coinshot', u.x, u.z, 0.45);
      homing(u, t, { speed: 30, color: MG.c, size: 0.5, mesh: 'orb', y: m.y, x: m.x, z: m.z,
        onHit: tt => { basicHit(u, tt); if (tt.alive && hasBuff(tt, 'mgdebt')) mgDebt(u, tt, 4); if (FX.near(tt.x, tt.z, 45)) { FX.hit(tt.x, tt.height * 0.55, tt.z, MG.c, false); if (Math.random() < 0.5) mgCoins(tt.x, tt.height * 0.6, tt.z, 2, 2); } } });
    },
    abilities: [
      {
        key: 'Q', name: 'Взыскание', icon: 'mgshell', cd: 7, cost: 55, range: 11, ind: { type: 'line', w: 1.4, fixed: true }, anim: 'shoot', animDur: 0.45, lock: 0.25, ai: { t: 'shot', sp: 24, farm: true },
        desc: 'Сейф выстреливает тяжёлым золотым снарядом по прямой (до 11). Снаряд разрывается на первом враге или в конце пути: враги в радиусе 2.8 получают магический урон, замедляются на 25% на 1.5 сек и становятся должниками.',
        cast(h, p) {
          const dir = p.dir, dmg = D(h, 70, 21, 0, 0.55), m = mgFlash(h, dir, true); let boomed = false;
          SFX.at('coinshot', h.x, h.z, 0.8); SFX.at('gunshot', h.x, h.z, 0.4);
          shot(h, { dir, speed: 24, range: 11, w: 0.8, mesh: 'orb', size: 1.1, color: MG.c, x: m.x, z: m.z, y: m.y,
            trail: q => { FX.trail(q.x, q.y, q.z, MG.c, 0.6, 2); if (Math.random() < 0.3 && FX.near(q.x, q.z, 45)) FX.sparks(q.x, q.y, q.z, { n: 1, color: MG.hot, speed: [1, 2], life: [0.2, 0.3] }); },
            onHit: (e, q) => { if (boomed) return; boomed = true; mgBurst(h, e.x, e.z, dmg); },
            onEnd: (x, z) => { if (!boomed) { boomed = true; mgBurst(h, x, z, dmg); } } });
        }
      },
      {
        key: 'W', name: 'Кредит доверия', icon: 'mgcred', cd: 12, cost: 60, range: 9, ind: { type: 'ally' }, anim: 'point', animDur: 0.4, lock: 0.15, ai: { t: 'healAlly' },
        desc: 'Марго открывает союзному герою (до 9) или себе кредит: он получает щит на 4 сек и +25% к скорости атаки на 4 сек, а его три следующие атаки делают цель должником Марго.',
        cast(h, p) {
          const o = p.unit && p.unit.alive && p.unit.team === h.team ? p.unit : h;
          shield(h, o, D(h, 55, 17, 0, 0.4), 4, MG.c);
          addBuff(o, { id: 'mgcred', dur: 4, as: 0.25, n: 3, src: h, onHit(u, t, b) { if (t.struct || b.n <= 0) return 0; b.n--; mgDebt(h, t, 4); if (FX.near(t.x, t.z, 45)) mgCoins(t.x, t.height * 0.6, t.z, 3, 2); return 0; } });
          SFX.at('cash', o.x, o.z, 0.7); SFX.at('coin', h.x, h.z, 0.5);
          if (FX.near(o.x, o.z, 55)) {
            FX.pillar(o.x, o.z, { r: 1.1, h: 8, color: MG.c, life: 0.6, op: 0.45, spin: 0.6 }); FX.ring(o.x, o.z, { r0: 0.4, r1: 2.2, color: MG.c, life: 0.45, tex: 'ringThin' });
            FX.glow(o.x, o.height + 0.5, o.z, 3, MG.hot, 0.3, 'star'); FX.aura(o, MG.c, 4, 1.2, 'ringThin', 2); mgCoins(o.x, o.height + 1.2, o.z, 10, 2.5);
            if (o !== h) FX.beam(h.x, h.z, o.x, o.z, { color: MG.c, w: 0.22, life: 0.3, y: 1.2 });
          }
        }
      },
      {
        key: 'E', name: 'Чёрный ящик', icon: 'mgbox', cd: 13, cost: 70, range: 9, ind: { type: 'circle', r: 4.5 }, anim: 'cast', animDur: 0.4, lock: 0.2, ai: { t: 'point', rad: 4, delay: 0.45 },
        desc: 'Марго бросает сейф в точку (до 9). Приземлившись, он распахивается: враги в радиусе 4.5 получают магический урон и становятся должниками, а 2.5 сек сейф тянет их к себе, замедляет на 30% и понемногу ранит.',
        cast(h, p) {
          const x = p.x, z = p.z, sx = h.x, sz = h.z, land = D(h, 50, 15, 0, 0.4), tick = D(h, 8, 2.8, 0, 0.08);
          SFX.at('whoosh', h.x, h.z, 0.5);
          if (FX.near(x, z, 60) || FX.near(sx, sz, 60)) { const b = mgBoxMesh(0.7); FX.add(b, 0.45, (k, me) => { me.position.set(sx + (x - sx) * k, 1.2 + Math.sin(Math.PI * k) * 3.2, sz + (z - sz) * k); me.rotation.x = k * 7; me.rotation.y = k * 4; }); }
          telegraph(h, x, z, 4.5, 0.45, MG.vio);
          after(0.45, () => mgWell(h, x, z, land, tick));
        }
      },
      {
        key: 'R', name: 'Банкротство', icon: 'mgult', cd: 80, cost: 120, range: 10, ind: { type: 'circle', r: 6.5 }, anim: 'heroic', animDur: 0.6, lock: 0.45, ai: { t: 'point', rad: 5.5, ult: true, delay: 0.6 },
        desc: 'Над точкой (до 10) распахивается дверь огромного хранилища. Союзные герои в радиусе 6.5 сразу получают щит на 4 сек. Через 0.6 сек все враги в радиусе стягиваются в центр, получают магический урон, становятся должниками и вдобавок получают ещё на 15% больше урона. 4 сек хранилище держит их: замедляет на 35% и подтягивает к центру, а в конце захлопывается — ещё раз магический урон.',
        cast(h, p) { mgBankrupt(h, p.x, p.z, D(h, 90, 32, 0, 0.5), D(h, 50, 18, 0, 0.3), D(h, 60, 20, 0, 0.35)); }
      }
    ]
  }
);

/* ---------- icons ---------- */
Object.assign(GLYPH, {
  // a stack of coins with a percent sign
  mginn(T) { for (let i = 0; i < 4; i++) T.E(-8, 16 - i * 7, 13, 4.5); T.al(0.85, () => { T.C(12, -16, 4); T.C(22, -2, 4); T.S(3.5, 24, -20, 10, 2); }); },
  // a heavy round shell bursting at the end of its flight
  mgshell(T) { T.al(0.5, () => T.S(5, -24, 14, -2, 0)); T.C(4, -2, 8); T.al(0.75, () => T.star(4, -2, 20, 9, 8)); },
  // a coin with a shield outline round it
  mgcred(T) { T.S(3.5, 0, -24, 20, -16, 18, 6, 0, 24, -18, 6, -20, -16, 0, -24); T.C(0, 0, 9); T.al(0.6, () => T.g.fillRect(-1.5, -6, 3, 12)); },
  // an open safe with lines pulling in towards it
  mgbox(T) { T.g.fillRect(-12, -6, 24, 20); T.al(0.6, () => T.P(-12, -6, -4, -18, 20, -18, 12, -6)); for (const [a, b] of [[-24, -14], [24, -14], [-24, 20], [24, 20]]) T.al(0.55, () => T.S(3, a, b, a * 0.6, b * 0.6 + 2)); },
  // a vault door: a big ring with a wheel of spokes
  mgult(T) { T.g.lineWidth = 5; T.g.beginPath(); T.g.arc(0, 0, 22, 0, TAU); T.g.stroke(); T.C(0, 0, 5); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; T.S(3.5, Math.cos(a) * 6, Math.sin(a) * 6, Math.cos(a) * 15, Math.sin(a) * 15); } T.al(0.6, () => T.g.fillRect(18, -4, 8, 8)); }
});
