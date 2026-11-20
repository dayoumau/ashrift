'use strict';
/* ===== roster, part 45 (hero 73). Loaded after roster18.js; glyphs go to GLYPH at the end.
   73. Korvin — a concertmaster of fire with a pair of duelling pistols. Each ability tunes his next two attacks into double shots with a burning
       second bullet; a staccato of three shots, a backflip that leaves a ring of fire, a ricochet that jumps between three enemies,
       and «Burning rhapsody» — for ten seconds every attack of every ally near him calls one of his burning bullets onto the target. ===== */
const KV = { c: 0xff5a2a, hot: 0xffc060, deep: 0x7a1408, gold: 0xe8b860 };

function kvMuzzle(h, dir, left) { const s = left ? -0.35 : 0.35, a = dir + HPI; return { x: h.x + Math.sin(dir) * 1.3 + Math.sin(a) * s, y: 1.55, z: h.z + Math.cos(dir) * 1.3 + Math.cos(a) * s }; }
function kvFlash(h, dir, left, big) {
  const m = kvMuzzle(h, dir, left); if (!FX.near(m.x, m.z, 55)) return m;
  FX.glow(m.x, m.y, m.z, big ? 3.2 : 1.8, KV.hot, 0.08, 'flare'); FX.glow(m.x, m.y, m.z, big ? 2 : 1.1, KV.c, 0.12, 'star');
  FX.sparks(m.x, m.y, m.z, { n: big ? 8 : 3, color: 0xffffff, color2: KV.c, speed: [4, 10], life: [0.08, 0.2], w: 0.05, dir, spread: 0.4 });
  if (big) FX.burst(m.x, m.y, m.z, { smoke: true, n: 2, color: 0x8a6a60, color2: 0x2a1a18, speed: [1, 2.5], life: [0.4, 0.7], size: [0.4, 0.9], dir, spread: 0.4, a: 0.3 });
  return m;
}
// burning: a magic tick every half second, small flames on the target
function kvBurn(h, e, dur) {
  if (!e.alive || e.struct) return;
  addBuff(e, { id: 'kvburn', dur, every: 0.5, src: h, onTick(u) {
    damage(h, u, D(h, 5, 2, 0.05, 0), 1, { dot: true });
    if (FX.near(u.x, u.z, 50)) { FX.flame(u.x + rand(-0.3, 0.3), u.height * 0.6, u.z + rand(-0.3, 0.3), { n: 3, color: KV.c, color2: KV.hot, size: [0.3, 0.6] }); }
  } });
}
// one burning bullet from Korvin to a unit (the rhapsody and the second pistol of a double shot)
function kvBullet(h, t, dmg, burn, o) {
  o = o || {}; const dir = angTo(h.x, h.z, t.x, t.z), m = kvFlash(h, dir, o.left, false);
  homing(h, t, { speed: 46, color: o.color || KV.c, size: o.size || 0.5, mesh: 'bolt', y: 1.55, x: m.x, z: m.z,
    onHit: tt => {
      if (!h.alive && !o.dead) return; damage(h, tt, dmg, 0, { dot: !!o.dot }); kvBurn(h, tt, burn);
      if (FX.near(tt.x, tt.z, 45)) { FX.hit(tt.x, tt.height * 0.55, tt.z, KV.c, !!o.big); FX.sparks(tt.x, tt.height * 0.55, tt.z, { n: 4, color: KV.hot, color2: KV.c, speed: [3, 7], life: [0.1, 0.25], w: 0.05 }); }
    } });
}
// «Crescendo»: every ability tunes the next two attacks
function kvTune(h) {
  h.kvDouble = 2; if (FX.near(h.x, h.z, 45)) { FX.aura(h, KV.c, 0.5, 1.1, 'ringThin', 3); FX.glow(h.x, h.height + 0.4, h.z, 1.6, KV.hot, 0.2, 'star'); }
}
// the ricochet: a bullet to the target, then on to the nearest enemy not yet hit (within 6), three targets at most, each 15% weaker
function kvRicochet(h, from, t, dmg, left, hit) {
  hit.add(t);
  homing(h, t, { speed: 52, color: KV.hot, size: 0.75, mesh: 'bolt', y: 1.5, x: from.x, z: from.z,
    onHit: tt => {
      damage(h, tt, dmg, 0); kvBurn(h, tt, 3); SFX.at('gunshot', tt.x, tt.z, 0.4); SFX.at('clink', tt.x, tt.z, 0.5);
      if (FX.near(tt.x, tt.z, 50)) { FX.hit(tt.x, tt.height * 0.55, tt.z, KV.c, true); FX.ring(tt.x, tt.z, { r0: 0.2, r1: 1.6, color: KV.c, life: 0.25, tex: 'shock' }); FX.sparks(tt.x, 1.4, tt.z, { n: 8, color: 0xffffff, color2: KV.hot, speed: [5, 11], life: [0.1, 0.25], w: 0.06 }); }
      if (left <= 1 || !h.alive) { if (FX.near(tt.x, tt.z, 50)) { FX.glow(tt.x, 1.2, tt.z, 4, KV.c, 0.2, 'flare'); FX.shock(tt.x, tt.z, 2.5, 0.6, 0.3); } return; }
      let best = null, bd = 6.5; for (const e of enemiesIn(h, tt.x, tt.z, 6.5)) { if (e.struct || hit.has(e) || !e.alive) continue; const d = udist(tt, e); if (d < bd) { bd = d; best = e; } }
      if (best) { if (FX.near(tt.x, tt.z, 50)) FX.beam(tt.x, tt.z, best.x, best.z, { color: KV.hot, w: 0.08, life: 0.2, y: 1.5 }); kvRicochet(h, { x: tt.x, z: tt.z }, best, dmg * 0.85, left - 1, hit); }
    } });
}
// «Burning rhapsody»: allies near him carry a buff whose attacks call his bullets; a slow ring of fire and a few notes over each of them
function kvRhapsody(h, R, dmg) {
  const dur = 10; SFX.at('ultcue', h.x, h.z, 0.7); SFX.at('chord', h.x, h.z, 0.8); SFX.at('fire', h.x, h.z, 0.7);
  if (FX.near(h.x, h.z, 60)) {
    FX.text(h.x, h.height + 1.3, h.z, 'Пылающая рапсодия!', '#ffb080', 17); FX.ring(h.x, h.z, { r0: 1, r1: R, color: KV.c, life: 0.6, tex: 'ringThin' });
    FX.pillar(h.x, h.z, { color: KV.c, r: 1.4, h: 9, life: 0.7, grow: true }); FX.light(h.x, 3, h.z, KV.c, 3, 16, 0.5); FX.shock(h.x, h.z, 5, 0.8, 0.4);
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; FX.flame(h.x + Math.sin(a) * 2.2, 0.4, h.z + Math.cos(a) * 2.2, { n: 4, color: KV.c, color2: KV.hot, size: [0.5, 1] }); }
  }
  for (const o of alliesIn(h, h.x, h.z, R, true)) {
    if (!o.alive) continue;
    const b = addBuff(o, { id: 'kvrhap', dur, src: h, nextT: 0, every: 0.6, onTick(u) { if (FX.near(u.x, u.z, 45)) FX.flame(u.x + rand(-0.4, 0.4), 0.3, u.z + rand(-0.4, 0.4), { n: 2, color: KV.c, color2: KV.hot, size: [0.3, 0.6] }); },
      onHit(u, t, bb) {
        if (t.struct || !h.alive || G.time < bb.nextT || udist(h, t) > 16) return 0; bb.nextT = G.time + (u === h ? 0.4 : 0.8);
        after(0.05, () => { if (t.alive && h.alive) { kvBullet(h, t, dmg, 1.5, { left: Math.random() < 0.5, color: KV.hot }); SFX.at('gunshot', h.x, h.z, 0.35); } }); return 0;
      } });
    if (b && FX.near(o.x, o.z, 50)) { FX.aura(o, KV.c, dur, 1.2, 'ringThin', 1.5); FX.glow(o.x, o.height + 0.4, o.z, 2, KV.hot, 0.25, 'star'); }
  }
}

HEROES.push(
  /* ================= 73. Korvin ================= */
  {
    id: 'korvin', name: 'Корвин', title: 'Дирижёр пламени', role: 'marks', roleName: 'Стрелок', build: 'marks', bars: [4, 2, 3, 3], diffc: 2, projMesh: 'bolt', atkSfx: 'gunshot',
    lore: 'Корвин был первой скрипкой оркестра, пока оркестр не сгорел вместе с залом. С тех пор он дирижирует только огнём: два дуэльных пистолета вместо смычка, выстрелы вместо нот. Говорит он тихо и вежливо, перчатки у него всегда белые, а если союзники держат ритм, то каждая их атака становится частью его партитуры.',
    look: { bulk: 0.86, h: 1.08, scale: 1.0, c1: 0x1a1418, c2: 0x241c22, c3: 0x121014, skin: 0xead2c2, hands: 0xf2eee8, cuff: 0xf2eee8, metal: KV.gold, glow: KV.c, head: 'korvin', hair: 0x7a1a18, shirt: 0xf0ece4, chest: 'tailcoat', legs: 'boots', sh: 'none', weapon: 'duelpistols', wc: 'pistol' },
    stats: ST(570, 84, 300, 34, 59, 3.3, 22, 2.4, 0.8, 9.1, 8.5),
    init(h) { h.kvDouble = 0; h.kvAlt = false; },
    innate: { name: 'Крещендо', icon: 'kvinn', desc: 'После каждого умения две следующие атаки Корвина — двойные: второй пистолет добивает цель огненной пулей (35% урона атаки) и поджигает её на 2 сек (магический урон каждые 0.5 сек).', count: h => h.kvDouble || 0 },
    shootAtk(u, t) {
      const dir = angTo(u.x, u.z, t.x, t.z); u.kvAlt = !u.kvAlt; const m = kvFlash(u, dir, u.kvAlt, false); SFX.at('flintlock', u.x, u.z, 0.45);
      homing(u, t, { speed: 44, color: KV.c, size: 0.45, mesh: 'bolt', y: 1.55, x: m.x, z: m.z,
        onHit: tt => { basicHit(u, tt); if (FX.near(tt.x, tt.z, 45)) FX.hit(tt.x, tt.height * 0.55, tt.z, KV.c, false); } });
      if (u.kvDouble > 0) { u.kvDouble--; after(0.09, () => { if (u.alive && t.alive && !u.blinded) { kvBullet(u, t, u.ad * 0.35, 2, { left: !u.kvAlt, color: KV.hot, size: 0.6, dot: true }); SFX.at('gunshot', u.x, u.z, 0.35); } }); }
    },
    abilities: [
      {
        key: 'Q', name: 'Стаккато', icon: 'kvstac', cd: 7, cost: 50, range: 11, ind: { type: 'line', w: 1.2, fixed: true }, anim: 'shoot', animDur: 0.45, lock: 0.3, ai: { t: 'shot', sp: 48, farm: true },
        desc: 'Три быстрых выстрела по прямой (до 11), попеременно из двух пистолетов: каждая пуля бьёт первого врага на пути — физический урон и поджог на 2 сек.',
        cast(h, p) {
          const dir = p.dir, dmg = D(h, 36, 11, 0.45, 0);
          for (let i = 0; i < 3; i++) after(i * 0.11, () => {
            if (!h.alive) return; const left = i % 2 === 1, a = dir + (i - 1) * 0.04, m = kvFlash(h, a, left, true);
            SFX.at('flintlock', h.x, h.z, 0.6); h.anim.castT = h.anim.castDur = 0.15; h.anim.castType = 'shoot';
            shot(h, { dir: a, speed: 48, range: 11, w: 1.0, mesh: 'bolt', size: 0.7, color: i === 2 ? KV.hot : KV.c, ribbon: 0.45, x: m.x, z: m.z, y: 1.5,
              onHit: e => { damage(h, e, dmg, 0); kvBurn(h, e, 2); if (FX.near(e.x, e.z, 50)) { FX.hit(e.x, 1.3, e.z, KV.c, i === 2); FX.flame(e.x, 1, e.z, { n: 4, color: KV.c, color2: KV.hot, size: [0.4, 0.8] }); } } });
          });
          after(0.3, () => kvTune(h));
        }
      },
      {
        key: 'W', name: 'Фермата', icon: 'kvferm', cd: 12, cost: 40, range: 5, ind: { type: 'circle', r: 0.8 }, anim: 'roll', animDur: 0.35, lock: 0, ai: { t: 'escape', kite: true },
        desc: 'Корвин сальто уходит к точке (до 5), а на месте, где он стоял, через 0.3 сек вспыхивает кольцо огня радиусом 3: магический урон, поджог на 2 сек и замедление на 30% на 1.5 сек.',
        cast(h, p) {
          const x0 = h.x, z0 = h.z, dmg = D(h, 50, 15, 0.35, 0); dashTo(h, p.x, p.z, 24, { ribbon: KV.c }); SFX.at('dash', h.x, h.z, 0.6); SFX.at('whoosh', h.x, h.z, 0.5); kvTune(h);
          if (FX.near(x0, z0, 55)) FX.zone(x0, z0, 3, KV.c, 0.45, { tex: 'rune', spin: 2, op: 0.6 });
          after(0.3, () => {
            for (const e of enemiesIn(h, x0, z0, 3)) { if (e.struct) continue; damage(h, e, dmg, 1); if (e.alive) { kvBurn(h, e, 2); slow(h, e, 0.3, 1.5, 'kvslow'); } }
            SFX.at('fire', x0, z0, 0.8); SFX.at('boom', x0, z0, 0.4);
            if (FX.near(x0, z0, 55)) {
              FX.ring(x0, z0, { r0: 0.5, r1: 3.4, color: KV.c, life: 0.35, tex: 'shock' }); FX.shock(x0, z0, 3, 0.8, 0.3); FX.light(x0, 2, z0, KV.c, 2.5, 10, 0.3);
              for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; FX.flame(x0 + Math.sin(a) * 2.6, 0.3, z0 + Math.cos(a) * 2.6, { n: 3, color: KV.c, color2: KV.hot, size: [0.5, 1.1] }); }
              FX.scorch(x0, z0, 2.8, 0x2a1008, 3);
            }
          });
        }
      },
      {
        key: 'E', name: 'Рикошет', icon: 'kvrico', cd: 10, cost: 60, range: 10, ind: { type: 'target' }, anim: 'shoot', animDur: 0.4, lock: 0.25, ai: { t: 'target' },
        desc: 'Выстрел в выбранного врага (до 10) пулей, которая рикошетит ещё в двух ближайших врагов (до 6 от предыдущего): физический урон каждому (каждый следующий на 15% меньше) и поджог на 3 сек.',
        cast(h, p) {
          const t = p.unit; if (!t || !t.alive) return false;
          const dir = angTo(h.x, h.z, t.x, t.z), m = kvFlash(h, dir, false, true); h.facing = dir; SFX.at('flintlock', h.x, h.z, 0.85); SFX.at('chime', h.x, h.z, 0.3);
          kvRicochet(h, m, t, D(h, 70, 20, 0.75, 0), 3, new Set()); kvTune(h);
        }
      },
      {
        key: 'R', name: 'Пылающая рапсодия', icon: 'kvult', cd: 70, cost: 100, range: 0, ind: { type: 'self', r: 12 }, anim: 'cast', animDur: 0.5, lock: 0.2, ai: { t: 'rally', r: 12, ult: true },
        desc: 'Корвин взмахивает пистолетами, как дирижёр, и на 10 сек он сам и союзные герои в радиусе 12 играют в его ритме: каждая их атака по врагу (не чаще раза в 0.8 сек у союзника и 0.4 сек у Корвина) вызывает его огненную пулю в ту же цель — физический урон и поджог на 1.5 сек. Цель должна быть не дальше 16 от Корвина.',
        cast(h) { kvRhapsody(h, 12, D(h, 16, 6, 0.18, 0)); kvTune(h); }
      }
    ]
  }
);

/* ---------- icons ---------- */
Object.assign(GLYPH, {
  // a rising hairpin of crescendo over two bullets
  kvinn(T) { T.S(3.5, -22, -4, 22, -16); T.S(3.5, -22, -4, 22, 8); T.P(-14, 14, -2, 10, -2, 18); T.P(4, 20, 16, 16, 16, 24); T.hi(() => T.C(22, -4, 2.5)); },
  // three dots of staccato in a line, each with a short streak
  kvstac(T) { for (let i = 0; i < 3; i++) { const x = -16 + i * 16, y = 10 - i * 10; T.C(x, y, 5); T.al(0.5, () => T.S(2, x - 12, y + 6, x - 4, y + 2)); } T.hi(() => T.C(16, -10, 2)); },
  // a fermata: an arc over a dot, with a ring of flame below
  kvferm(T) { T.A(0, 4, 18, Math.PI, TAU, 5); T.C(0, -2, 5); T.al(0.6, () => T.A(0, 16, 20, 0.2, Math.PI - 0.2, 3)); },
  // a bullet path bouncing between three points
  kvrico(T) { T.S(3, -24, 18, -6, -14, 8, 12, 24, -16); T.C(-6, -14, 4); T.C(8, 12, 4); T.C(24, -16, 4); T.al(0.5, () => T.star(-6, -14, 9, 3, 4)); },
  // a conductor's two raised pistols crossed, a flame between them
  kvult(T) { T.S(4.5, -22, 20, 6, -14); T.S(4.5, 22, 20, -6, -14); T.g.fillRect(-26, 14, 10, 8); T.g.fillRect(16, 14, 10, 8); T.P(0, -24, 7, -8, 0, 0, -7, -8); T.hi(() => T.C(0, -10, 2.5)); }
});
