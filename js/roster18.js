'use strict';
/* ===== roster, part 44 (hero 72). Loaded after roster17.js; glyphs go to GLYPH at the end.
   72. Taiga — a storm courier with a folding compound bow. His arrows leave storm marks on the enemy (up to five), every fourth arrow is charged,
       a gust step loads three charged arrows at once, «Thunderclap» calls one bolt of lightning for every mark, and «Sky quiver» rains arrows
       over an area, marking everyone in it, and ends in a thunderclap of its own. ===== */
const TG = { c: 0x5ad8ff, vio: 0x9a6aff, hot: 0xe8f6ff, deep: 0x1a3a6a };
const TG_MAX = 5, TG_LIFE = 6;

// storm marks live on the target: { src, n, t (expires), fx }; a mark from another Taiga replaces them
function tgMarks(h, e) { const m = e.tgM; return m && m.src === h && m.t > G.time && e.alive ? m.n : 0; }
function tgMark(h, e, n) {
  if (!e || !e.alive || e.struct || !hostile(h, e)) return;
  let m = e.tgM;
  if (!m || m.src !== h || !(m.t > G.time)) { if (m && m.fx) m.fx.dead = true; m = e.tgM = { src: h, n: 0, t: 0, fx: null }; }
  const was = m.n; m.n = Math.min(TG_MAX, m.n + n); m.t = G.time + TG_LIFE;
  if (!m.fx && FX.near(e.x, e.z, 60)) m.fx = tgMarkFx(e, m);
  if (m.n >= TG_MAX && was < TG_MAX && FX.near(e.x, e.z, 50)) { FX.aura(e, TG.c, 0.6, 1.4, 'ringThin', 3); SFX.at('charge', e.x, e.z, 0.35); }
}
// five small diamonds circling over the head, lit one per mark; at five they spin faster and flicker violet
function tgMarkFx(e, m) {
  const g = new THREE.Group(), orbs = [];
  for (let i = 0; i < TG_MAX; i++) {
    const o = new THREE.Mesh(FX.geo.bolt, new THREE.MeshBasicMaterial({ color: TG.c, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    o.userData.own = true; o.scale.set(0.8, 0.8, 0.28); g.add(o); orbs.push(o);
  }
  return FX.add(g, 9999, (k, me, dt, en) => {
    if (!e.alive || e.tgM !== m || !(m.t > G.time) || m.n <= 0) { en.dead = true; if (e.tgM === m) m.fx = null; return; }
    const t = G.time, full = m.n >= TG_MAX, sp = full ? 5.5 : 2.4;
    me.position.set(e.x, e.height + 0.3, e.z);
    for (let i = 0; i < TG_MAX; i++) {
      const o = orbs[i], a = t * sp + i / TG_MAX * TAU; o.visible = i < m.n;
      o.position.set(Math.sin(a) * 0.8, Math.sin(t * 6 + i * 1.3) * 0.08, Math.cos(a) * 0.8); o.rotation.set(HPI, a, 0);
      o.material.color.setHex(full && Math.floor(t * 10 + i) % 2 ? TG.vio : TG.c);
    }
  });
}
// one bolt of lightning from the sky onto a point
function tgStrike(x, z, big) {
  if (!FX.near(x, z, 60)) return;
  FX.bolt(x + rand(-2, 2), 15, z + rand(-2, 2), x, 0.3, z, { color: big ? TG.vio : TG.c, w: big ? 1.6 : 1.0, life: big ? 0.3 : 0.2 });
  if (big) FX.bolt(x + rand(-3, 3), 15, z + rand(-3, 3), x, 0.3, z, { color: TG.c, w: 0.8, life: 0.25 });
  FX.glow(x, 0.8, z, big ? 5.5 : 3, TG.hot, 0.12, 'flare'); FX.glow(x, 1.2, z, big ? 3 : 1.8, TG.c, 0.18, 'star');
  FX.ring(x, z, { r0: 0.2, r1: big ? 3.4 : 1.8, color: TG.c, life: 0.3, tex: 'shock' });
  FX.sparks(x, 0.6, z, { n: big ? 14 : 6, color: 0xffffff, color2: TG.c, speed: [4, 11], life: [0.1, 0.3], w: 0.06 });
  FX.light(x, 3, z, TG.c, big ? 3 : 1.6, big ? 14 : 8, 0.18);
  if (big) { FX.scorch(x, z, 1.6, 0x101828, 2.5); FX.shake(0.18); }
}
// detonates every mark on one enemy: a strike of lightning per mark; at five marks the last one stuns
function tgDetonate(h, e, per) {
  const n = tgMarks(h, e); if (!n) return 0;
  e.tgM.n = 0; e.tgM.t = 0;
  for (let i = 0; i < n; i++) after(i * 0.09, () => {
    if (!e.alive || !h.alive) return; const last = i === n - 1, full = n >= TG_MAX;
    damage(h, e, per, 0); tgStrike(e.x, e.z, last && full);
    SFX.at(last && full ? 'thunder' : 'zap', e.x, e.z, last && full ? 0.7 : 0.4);
    if (last && full && e.alive) { stun(h, e, 0.8); if (FX.near(e.x, e.z, 50) && e.kind === 'hero') FX.text(e.x, e.height + 1, e.z, 'РАЗРЯД!', '#9fe8ff', 15); }
  });
  return n;
}
// an arrow on the bow: a flash and a few sparks at the string
function tgLoose(h, dir, big) {
  const x = h.x + Math.sin(dir) * 1.2, z = h.z + Math.cos(dir) * 1.2; if (!FX.near(x, z, 55)) return;
  FX.glow(x, 1.6, z, big ? 3.2 : 1.6, big ? TG.vio : TG.c, 0.1, 'star');
  FX.sparks(x, 1.6, z, { n: big ? 8 : 3, color: 0xffffff, color2: TG.c, speed: [3, 8], life: [0.08, 0.2], w: 0.05, dir, spread: 0.6 });
  if (big) FX.arcs(x, 1.5, z, 0.8, 2, TG.c);
}
// a charged arrow: a bigger violet arrow that adds two marks and jumps in sparks to two enemies near the target
function tgChargedShot(u, t, dir) {
  tgLoose(u, dir, true); SFX.at('stormbow', u.x, u.z, 0.6);
  homing(u, t, {
    speed: 48, color: TG.vio, size: 0.85, mesh: 'arrow', y: u.height * 0.62,
    onHit: tt => {
      basicHit(u, tt); if (u.blinded) return;
      if (tt.alive) damage(u, tt, D(u, 12, 5, 0.3, 0), 0, { dot: true });
      tgMark(u, tt, 2);
      let k = 0; for (const e of enemiesIn(u, tt.x, tt.z, 4)) { if (e === tt || e.struct || k >= 2) continue; k++; damage(u, e, u.ad * 0.35, 0, { dot: true }); tgMark(u, e, 1); if (FX.near(e.x, e.z, 50)) FX.bolt(tt.x, 1.4, tt.z, e.x, 1.2, e.z, { color: TG.c, w: 0.5, life: 0.18, fork: false }); }
      SFX.at('zap', tt.x, tt.z, 0.45);
      if (FX.near(tt.x, tt.z, 50)) { FX.hit(tt.x, tt.height * 0.55, tt.z, TG.vio, true); FX.arcs(tt.x, 1.2, tt.z, 1.1, 3, TG.c); }
    }
  });
}
// one arrow falling from the sky, tip down, with a spark where it lands
function tgRainArrow(x, z) {
  if (!FX.near(x, z, 60)) return;
  const m = new THREE.Mesh(FX.geo.arrow, FX.mat(null, Math.random() < 0.3 ? TG.vio : TG.c, 1)); m.rotation.x = HPI; m.scale.set(1.2, 1.2, 1.1);
  FX.add(m, 0.22, (k, me) => { me.position.set(x, 0.4 + 13 * (1 - k), z); });
  after(0.22, () => { FX.sparks(x, 0.3, z, { n: 3, color: 0xffffff, color2: TG.c, speed: [2, 6], life: [0.08, 0.2], w: 0.05 }); if (Math.random() < 0.3) FX.glow(x, 0.4, z, 1.4, TG.c, 0.12, 'star'); if (Math.random() < 0.35) FX.ring(x, z, { r0: 0.1, r1: 0.9, color: 0x1a5ab0, life: 0.25, tex: 'ringThin', op: 0.7 }); });
}
// «Sky quiver»: a shot straight up, then 2.6 sec of arrows over the area; every third volley marks everyone inside; at the end a thunderclap over them all
function tgQuiver(h, x, z, R, per, det) {
  SFX.at('ultcue', h.x, h.z, 0.7); SFX.at('bow', h.x, h.z, 0.8); SFX.at('charge', h.x, h.z, 0.6);
  if (FX.near(h.x, h.z, 60)) { FX.bolt(h.x, 1.8, h.z, h.x, 18, h.z, { color: TG.c, w: 1.2, life: 0.35 }); FX.glow(h.x, 2, h.z, 4, TG.c, 0.2, 'flare'); FX.text(h.x, h.height + 1.3, h.z, 'Небесный колчан!', '#9fe8ff', 17); }
  const zf = FX.near(x, z, 60) ? FX.zone(x, z, R, 0x1a5ab0, 3.4, { tex: 'rune', spin: 0.8, op: 0.5 }) : null;
  if (FX.near(x, z, 60)) {
    FX.ring(x, z, { r0: R, r1: R, color: TG.vio, life: 3.3, tex: 'ringThin' }); FX.zone(x, z, R * 0.6, 0x3a2a8a, 3.4, { tex: 'swirl', spin: -1.6, op: 0.3 });
    // a storm cloud turns over the place and crackles for as long as the arrows fall
    const cl = new THREE.Mesh(FX.geo.flat, FX.mat('swirl', 0x2a4a7a, 0.55)); cl.position.set(x, 12.5, z); let ct = 0;
    FX.add(cl, 3.6, (k, me, dt, en) => { const s = R * 2.4 * 2 * RK * Math.min(1, en.t * 3); me.scale.set(s, 1, s); me.rotation.y += dt * 1.6; me.material.opacity = 0.55 * Math.min(1, (3.6 - en.t) * 3); ct += dt; if (ct > 0.16) { ct = 0; const a = rand(TAU), b = rand(TAU); FX.bolt(x + Math.sin(a) * rand(R), 12.3, z + Math.cos(a) * rand(R), x + Math.sin(b) * rand(R), 12.3 + rand(-0.4, 0.4), z + Math.cos(b) * rand(R), { color: Math.random() < 0.3 ? TG.vio : TG.c, w: 0.3, life: 0.1, jag: 0.8 }); } });
  }
  let t = 0, n = 0; const N = 12, gap = 0.22, t0 = 0.5;
  G.actors.push({ update(dt) {
    t += dt;
    while (n < N && t >= t0 + n * gap) {
      n++; const mark = n % 3 === 0;
      if (mark && FX.near(x, z, 60)) { FX.ring(x, z, { r0: 0.5, r1: R, color: 0x1a5ab0, life: 0.4, tex: 'shock', op: 0.5 }); const a = rand(TAU), r = rand(R * 0.7); FX.bolt(x + Math.sin(a) * r, 12, z + Math.cos(a) * r, x + Math.sin(a) * r + rand(-1, 1), 0.2, z + Math.cos(a) * r + rand(-1, 1), { color: TG.vio, w: 0.7, life: 0.16 }); }
      for (let i = 0; i < 7; i++) { const a = rand(TAU), r = Math.sqrt(Math.random()) * R; tgRainArrow(x + Math.sin(a) * r, z + Math.cos(a) * r); }
      after(0.22, () => {
        for (const e of enemiesIn(h, x, z, R)) { if (e.struct) continue; damage(h, e, per, 0); if (!e.alive) continue; slow(h, e, 0.25, 0.4, 'tgrain'); if (mark) tgMark(h, e, 1); }
        SFX.at(n % 2 ? 'arrow' : 'bow', x, z, 0.35); if (mark) SFX.at('zap', x, z, 0.3);
      });
    }
    if (n >= N && t >= t0 + N * gap + 0.3) {
      SFX.at('thunder', x, z, 1); SFX.at('bigboom', x, z, 0.4);
      if (FX.near(x, z, 60)) { tgStrike(x, z, true); FX.shock(x, z, R + 1, 1.2, 0.4); FX.ring(x, z, { r0: 0.5, r1: R + 1.2, color: TG.vio, life: 0.45, tex: 'shock' }); FX.punch(0.35); FX.hitstop(0.04); }
      for (const e of enemiesIn(h, x, z, R + 1)) { if (e.struct) continue; tgMark(h, e, 1); tgDetonate(h, e, det); }
      if (zf) zf.dead = true;
      return false;
    }
    return true;
  } });
}

HEROES.push(
  /* ================= 72. Taiga ================= */
  {
    id: 'taiga', name: 'Тайга', title: 'Курьер грозы', role: 'marks', roleName: 'Стрелок', build: 'marks', bars: [5, 2, 3, 3], diffc: 2, projMesh: 'arrow', atkSfx: 'bow',
    lore: 'Тайга возит посылки через Разлом там, где не ходят караваны: под грозой, по крышам, напрямик. Работу он считает скучной, а начальство — ещё скучнее, но если посылку пытаются отнять, курьер раскладывает складной лук, и каждая его стрела оставляет на враге искру. Пять искр — и с неба за ними приходит молния.',
    look: { bulk: 0.88, h: 1.04, scale: 1.0, c1: 0x1c2a40, c2: 0x2a3a58, c3: 0x14161c, skin: 0xeed6c4, hands: 0x1a1c22, cuff: TG.c, metal: 0x8a94a8, glow: TG.c, head: 'taiga', hair: 0x6a86b0, shirt: 0xe8eef6, chest: 'courier', legs: 'boots', sh: 'none', weapon: 'stormbow', wc: 'bow', back: 'quiver' },
    stats: ST(560, 82, 300, 34, 58, 3.3, 22, 2.4, 0.78, 9.1, 9.0),
    init(h) { h.tgN = 0; h.tgCharged = 0; },
    innate: { name: 'Метки грозы', icon: 'tginn', desc: 'Каждая стрела Тайги оставляет на враге метку грозы (до 5, держатся 6 сек). Каждая четвёртая атака — заряженная стрела: дополнительный физический урон, 2 метки цели и разряд в двух врагов рядом (по метке каждому). «Раскат» и конец ульты превращают метки в удары молнии, а пятая метка в конце оглушает.', count: h => h.tgCharged > 0 ? h.tgCharged : 4 - ((h.tgN || 0) % 4) },
    shootAtk(u, t) {
      const dir = angTo(u.x, u.z, t.x, t.z); u.tgN = (u.tgN || 0) + 1;
      if ((u.tgCharged || 0) > 0 || u.tgN % 4 === 0) { if (u.tgCharged > 0) u.tgCharged--; tgChargedShot(u, t, dir); return; }
      tgLoose(u, dir, false); SFX.at('bow', u.x, u.z, 0.45);
      homing(u, t, {
        speed: 44, color: TG.c, size: 0.6, mesh: 'arrow', y: u.height * 0.62,
        onHit: tt => { basicHit(u, tt); if (!u.blinded) tgMark(u, tt, 1); if (FX.near(tt.x, tt.z, 45)) FX.hit(tt.x, tt.height * 0.55, tt.z, TG.c, false); SFX.at('arrow', tt.x, tt.z, 0.25); }
      });
    },
    abilities: [
      {
        key: 'Q', name: 'Громовая стрела', icon: 'tgarrow', cd: 7, cost: 50, range: 12, ind: { type: 'line', w: 1.4, fixed: true }, anim: 'shoot', animDur: 0.4, lock: 0.25, ai: { t: 'shot', sp: 46, farm: true },
        desc: 'Тайга пускает стрелу-молнию (до 12), которая пробивает всех на пути: физический урон, замедление на 20% на 1 сек и 2 метки грозы каждому.',
        cast(h, p) {
          const dir = p.dir, dmg = D(h, 60, 17, 0.8, 0), x0 = h.x + Math.sin(dir) * 1.2, z0 = h.z + Math.cos(dir) * 1.2;
          tgLoose(h, dir, true); SFX.at('stormbow', h.x, h.z, 0.85); SFX.at('whoosh', h.x, h.z, 0.4);
          if (FX.near(h.x, h.z, 55)) {
            FX.bolt(x0, 1.5, z0, x0 + Math.sin(dir) * 6, 1.5, z0 + Math.cos(dir) * 6, { color: TG.c, w: 0.6, life: 0.16, fork: false });
            // the arrow leaves the air charged: a second bolt runs the whole length a moment later, the ground under the path stays scorched
            after(0.14, () => { FX.bolt(x0, 1.4, z0, x0 + Math.sin(dir) * 12, 1.3, z0 + Math.cos(dir) * 12, { color: TG.vio, w: 0.45, life: 0.18, fork: false }); FX.beam(x0, z0, x0 + Math.sin(dir) * 12, z0 + Math.cos(dir) * 12, { color: 0x1a3a7a, w: 0.35, life: 0.6, y: 0.14, op: 0.6 }); });
            FX.ring(h.x, h.z, { r0: 0.3, r1: 1.8, color: 0x1a5ab0, life: 0.25, tex: 'shock', op: 0.6 }); FX.light(x0, 2, z0, TG.c, 1.6, 10, 0.2);
          }
          shot(h, { dir, speed: 46, range: 12, w: 1.4, pierce: true, mesh: 'arrow', size: 1.5, color: TG.c, ribbon: 0.7, x: x0, z: z0, y: 1.5,
            trail: q => { if (!FX.near(q.x, q.z, 55)) return; FX.trail(q.x, q.y, q.z, TG.c, 0.7, 2); if (Math.random() < 0.45) FX.bolt(q.x, q.y, q.z, q.x - Math.sin(dir) * 2.5 + rand(-0.6, 0.6), q.y + rand(-0.4, 0.4), q.z - Math.cos(dir) * 2.5 + rand(-0.6, 0.6), { color: Math.random() < 0.3 ? TG.vio : TG.c, w: 0.35, life: 0.1, fork: false }); },
            onHit: e => {
              damage(h, e, dmg, 0); if (e.alive) { slow(h, e, 0.2, 1, 'tgslow'); tgMark(h, e, 2); }
              SFX.at('zap', e.x, e.z, 0.5);
              if (FX.near(e.x, e.z, 50)) { FX.hit(e.x, 1.3, e.z, TG.c, true); FX.arcs(e.x, 1.2, e.z, 1.2, 3, TG.c); }
            },
            onEnd: (x, z) => { if (FX.near(x, z, 50)) { FX.sparks(x, 1.5, z, { n: 6, color: 0xffffff, color2: TG.c, speed: [3, 8], life: [0.1, 0.25], w: 0.05 }); FX.glow(x, 1.5, z, 2, TG.c, 0.12, 'star'); } } });
        }
      },
      {
        key: 'W', name: 'Шаг ветра', icon: 'tgstep', cd: 11, cost: 40, range: 5.5, ind: { type: 'circle', r: 0.8 }, anim: 'roll', animDur: 0.32, lock: 0, ai: { t: 'escape', kite: true },
        desc: 'Тайга рывком уходит к точке (до 5.5) порывом ветра. Следующие 3 атаки — заряженные стрелы, первая готова сразу, а 4 сек скорость атаки выше на 40%.',
        cast(h, p) {
          const x0 = h.x, z0 = h.z; dashTo(h, p.x, p.z, 26, { ribbon: TG.c });
          h.tgCharged = 3; h.atkCd = 0; addBuff(h, { id: 'tgwind', dur: 4, as: 0.4, src: h });
          SFX.at('dash', h.x, h.z, 0.7); SFX.at('gust', h.x, h.z, 0.6); SFX.at('charge', h.x, h.z, 0.4);
          if (FX.near(x0, z0, 55)) {
            FX.burst(x0, 0.8, z0, { n: 10, color: 0xdff4ff, color2: TG.c, speed: [3, 8], life: [0.25, 0.5], size: [0.4, 0.9], a: 0.5 });
            FX.ring(x0, z0, { r0: 0.3, r1: 2.6, color: TG.c, life: 0.3, tex: 'shock' }); FX.arcs(x0, 1, z0, 1, 3, TG.c);
            FX.aura(h, TG.vio, 4, 1.1, 'ringThin', 2);
          }
        }
      },
      {
        key: 'E', name: 'Раскат', icon: 'tgclap', cd: 10, cost: 60, range: 0, ind: { type: 'self', r: 11 }, anim: 'cast', animDur: 0.4, lock: 0.2,
        ai: { t: 'fn', fn: h => { let s = 0; for (const e of enemiesIn(h, h.x, h.z, 10.5, true)) { const n = tgMarks(h, e); if (n >= 4 || (n >= 3 && e.hp < e.maxHp * 0.4)) return { x: h.x, z: h.z }; s += n; } return s >= 6 ? { x: h.x, z: h.z } : null; } },
        desc: 'Тайга поднимает лук к небу, и на каждого врага в радиусе 11 с метками грозы падает по молнии за каждую метку: физический урон за удар. Метки снимаются; враг с 5 метками ещё и оглушён на 0.8 сек. Если меток ни на ком нет, перезарядка — всего 3 сек.',
        cast(h) {
          const per = D(h, 26, 8, 0.3, 0); let hit = 0;
          for (const e of enemiesIn(h, h.x, h.z, 11)) { if (e.struct) continue; if (tgDetonate(h, e, per)) hit++; }
          SFX.at('charge', h.x, h.z, 0.6); SFX.at(hit ? 'thunder' : 'zap', h.x, h.z, hit ? 0.6 : 0.4);
          if (FX.near(h.x, h.z, 55)) { FX.bolt(h.x, 2.2, h.z, h.x + rand(-1, 1), 16, h.z + rand(-1, 1), { color: TG.c, w: 0.9, life: 0.25 }); FX.glow(h.x, 2.3, h.z, 3.5, TG.c, 0.18, 'flare'); FX.ring(h.x, h.z, { r0: 1, r1: 11, color: TG.c, life: 0.4, tex: 'ringThin' }); }
          if (!hit) { after(0, () => { h.cd[2] = Math.min(h.cd[2], 3); }); if (FX.near(h.x, h.z, 40)) FX.text(h.x, h.height + 0.8, h.z, 'нет меток', '#9fb8d4', 12); }
        }
      },
      {
        key: 'R', name: 'Небесный колчан', icon: 'tgult', cd: 75, cost: 100, range: 12, ind: { type: 'circle', r: 4.5 }, anim: 'cast', animDur: 0.5, lock: 0.35, ai: { t: 'point', rad: 4.5, ult: true, delay: 0.5 },
        desc: 'Тайга пускает стрелу в небо, и 2.6 сек на область (радиус 4.5, до 12) падает ливень стрел: каждые 0.22 сек физический урон и замедление на 25% всем внутри, каждый третий залп ставит метку грозы. В конце над областью гремит раскат: всем внутри ещё метка, и все метки разом превращаются в молнии, как у «Раската».',
        cast(h, p) { tgQuiver(h, p.x, p.z, 4.5, D(h, 12, 4, 0.15, 0), D(h, 26, 8, 0.3, 0)); }
      }
    ]
  }
);

/* ---------- icons ---------- */
Object.assign(GLYPH, {
  // five diamonds in a ring, one lit
  tginn(T) { for (let i = 0; i < 5; i++) { const a = i / 5 * TAU - HPI, x = Math.cos(a) * 17, y = Math.sin(a) * 17; T.P(x, y - 7, x + 4.5, y, x, y + 7, x - 4.5, y); } T.bolt(0, 0, 0.55); T.hi(() => T.C(0, -17, 2.5)); },
  // an arrow with a jagged lightning shaft
  tgarrow(T) { T.S(3.5, -24, 18, -14, 6, -6, 12, 4, -2, 12, 2, 18, -12); T.P(24, -20, 13, -16, 20, -9); T.al(0.5, () => { T.S(2, -26, 10, -18, 20); T.S(2, -18, 22, -28, 24); }); },
  // a figure-stride through gust lines and a charged arrow over it
  tgstep(T) { for (let i = 0; i < 3; i++) T.S(3, -26, -8 + i * 9, -6 + i * 4, -8 + i * 9); T.S(4, 0, 18, 22, -4); T.P(26, -8, 16, -6, 22, 2); T.al(0.6, () => T.star(-14, 18, 8, 3, 4)); },
  // a bow raised to a cloud, a bolt striking down
  tgclap(T) { T.C(-8, -16, 9); T.C(6, -18, 11); T.C(16, -12, 7); T.g.fillRect(-14, -14, 32, 8); T.bolt(2, 8, 0.75); T.hi(() => T.C(2, 22, 3)); },
  // a quiver tipped up and arrows falling in a slant
  tgult(T) { for (let i = 0; i < 4; i++) { const x = -18 + i * 12, y = -20 + (i % 2) * 8; T.S(2.5, x, y, x + 5, y + 22); T.P(x + 7, y + 28, x + 2, y + 21, x + 8.5, y + 19); } T.al(0.5, () => T.A(0, 0, 26, 3.6, 5.8, 3)); }
});
