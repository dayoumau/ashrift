'use strict';
/* ===== hero roster, part 1 (16 heroes; ten more are added in roster2.js). abilities = [Q, W, E, R]; an ability may be { passive: true, stats(level) } instead of castable; R is the ultimate ===== */
function skyBolt(x, z, color, r) {
  FX.bolt(x + rand(-3, 3), 22, z - rand(3, 7), x, 0.2, z, { color, w: 1.6, jag: 1.4, life: 0.28 });
  FX.pillar(x, z, { r: 0.5, h: 18, color, life: 0.2, op: 0.55 }); FX.ring(x, z, { r1: r || 2.2, color, life: 0.35, tex: 'shock' });
  FX.sparks(x, 0.4, z, { n: 14, color: 0xffffff, color2: color, speed: [6, 18], life: [0.1, 0.35], up: 4, w: 0.12, stretch: 0.09 });
  FX.arcs(x, 0.8, z, (r || 2.2) * 0.9, 3, color); FX.glow(x, 1, z, 5, color, 0.2); FX.glow(x, 1, z, 8, 0xffffff, 0.1, 'flare'); FX.light(x, 3, z, color, 2.6, 18, 0.3); FX.scorch(x, z, (r || 2.2) * 0.55); SFX.at('zap', x, z);
}
function poison(src, e, tick, ticks, id) {
  addBuff(e, { id: (id || 'psn') + src.id, dur: ticks * 0.5 + 0.05, every: 0.5, src, onTick: u => { damage(src, u, tick, 1, { dot: true }); FX.flame(u.x, 1.2, u.z, { n: 2, color: 0xb8ff5a, color2: 0x143800, size: [0.5, 1.1], life: [0.4, 0.8], up: 1.2, a: 0.4 }); } });
}
function nearestEnemyTo(src, x, z, r, skip) {
  let b = null, bd = 1e9; for (const e of enemiesIn(src, x, z, r)) { if (skip && skip.has(e.id)) continue; const d = dist(x, z, e.x, e.z) - (e.kind === 'hero' ? 2 : 0); if (d < bd) { bd = d; b = e; } } return b;
}
const castGlow = (h, c) => { FX.glow(h.x, 2.1, h.z, 3.2, c, 0.25); FX.implode(h.x, 1.6, h.z, 2.4, { n: 8, color: c, color2: 0xffffff, life: 0.22, streak: true }); };
const byHeroDist = h => (a, b) => ((a.kind === 'hero' ? -100 : 0) + udist(h, a)) - ((b.kind === 'hero' ? -100 : 0) + udist(h, b));
const ST = (hp, hpL, mana, manaL, ad, adL, def, defL, as, ms, range, asL) => ({ hp, hpL, mana, manaL, ad, adL, def, defL, as, ms, range, asL: asL || 0.02 });

const HEROES = [
  /* ================= 1. Brand ================= */
  {
    id: 'brand', name: 'Бранд', title: 'Железный страж', role: 'front', roleName: 'Танк', build: 'tank', bars: [2, 5, 4, 2], diffc: 1,
    lore: 'Держит линию фронта и открывает бой. Таран в цель, щит на союзников, разлом под ноги врагам.',
    look: { bulk: 1.28, h: 1.03, c1: 0x4b505a, c2: 0x3c4048, c3: 0x6a5430, metal: 0x7d838d, glow: 0xffb84a, head: 'helm', chest: 'plate', sh: 'plate', legs: 'greaves', weapon: 'mace', wc: 'melee', cape: 0x5a4326 },
    stats: ST(740, 98, 280, 35, 56, 3.2, 36, 3.8, 0.68, 8.5, 2.7),
    abilities: [
      {
        key: 'Q', name: 'Таран щитом', icon: 'ramshield', cd: 9, cost: 45, range: 8.5, ind: { type: 'line', w: 3 }, anim: 'thrust', ai: { t: 'gap' },
        desc: 'Рывок вперёд. Первый враг на пути получает урон и оглушается на 1 сек.',
        cast(h, p) {
          const dmg = D(h, 70, 10, 0.5); SFX.at('dash', h.x, h.z, 0.8); SFX.at('chain', h.x, h.z, 0.3); FX.ring(h.x, h.z, { r1: 2.6, color: 0xffb84a, life: 0.3, tex: 'shock' });
          dashTo(h, p.x, p.z, 30, {
            w: 1.5, trail: u => { FX.sparks(u.x, 0.4, u.z, { n: 2, color: 0xffe2a8, color2: 0xff8a1a, speed: [2, 6], life: [0.2, 0.45], dir: u.facing + Math.PI, spread: 0.8 }); if (Math.random() < 0.5) FX.smoke(u.x, u.z, 0.7, 1, 0x4a4238); },
            onHit: (e, u) => { damage(u, e, dmg, 0); stun(u, e, 1.0); FX.explosion(e.x, e.z, 2.4, 0xffb84a, { smoke: false }); FX.slash(e.x, e.z, u.facing, { r: 3.2, color: 0xffd9a0 }); FX.sparks(e.x, 1.2, e.z, { n: 18, color: 0xffffff, color2: 0xffa530, speed: [6, 16], life: [0.2, 0.5], dir: u.facing, spread: 1 }); SFX.at('mace', e.x, e.z, 1); SFX.at('impact', e.x, e.z, 0.6); return true; }
          });
        }
      },
      {
        key: 'W', name: 'Бастион', icon: 'bastion', cd: 13, cost: 55, range: 0, ind: { type: 'self', r: 8 }, ai: { t: 'shield' }, lock: 0.1,
        desc: 'Щит себе и союзным героям рядом на 4 сек. Бранд получает +25 защиты.',
        cast(h) {
          const amt = D(h, 90, 16) + h.maxHp * 0.1;
          shield(h, h, amt, 4, 0xffb84a); addBuff(h, { id: 'bastion', dur: 4, def: 25 });
          for (const a of alliesIn(h, h.x, h.z, 8, true)) if (a !== h) { shield(h, a, amt * 0.6, 4, 0xffb84a); FX.beam(h.x, h.z, a.x, a.z, { color: 0xffb84a, w: 1, life: 0.4 }); FX.pillar(a.x, a.z, { r: 1.2, h: 7, color: 0xffb84a, life: 0.5 }); }
          FX.ring(h.x, h.z, { r1: 8, color: 0xffb84a, life: 0.55, tex: 'shock' }); FX.ring(h.x, h.z, { r0: 1, r1: 7.6, color: 0xffd98a, life: 0.8, tex: 'rune2', spin: 2, op: 0.7 }); FX.pillar(h.x, h.z, { r: 2, h: 10, color: 0xffb84a, life: 0.6 });
          FX.sphere(h.x, 1.4, h.z, { r0: 1, r1: 8, color: 0xffb84a, life: 0.5, op: 0.22 }); FX.sparks(h.x, 0.4, h.z, { n: 22, color: 0xfff0c8, color2: 0xffa530, speed: [0.5, 2], life: [0.5, 1], up: 8, rad: 2, grav: -3, ring: true, w: 0.1 }); SFX.at('shield', h.x, h.z); SFX.at('mace', h.x, h.z, 0.45); SFX.at('horn', h.x, h.z, 0.35);
        }
      },
      { key: 'E', name: 'Железная воля', icon: 'ironwill', passive: true, desc: 'Пассивно: +6 / 12 / 18 / 24 защиты, а оглушения и обездвиживания по Бранду короче на 5 / 10 / 15 / 20%.', stats: l => ({ def: 6 * l, ten: 0.05 * l }) },
      {
        key: 'R', name: 'Раскол', icon: 'quake', noReach: true, cd: 75, cost: 100, range: 15, ind: { type: 'line', w: 4.4, fixed: true }, anim: 'slam', animDur: 0.75, lock: 0.5, ai: { t: 'shot', r: 12.5, ult: true, hp: 0.75 },
        desc: 'Удар раскалывает землю по прямой: враги получают большой урон и подбрасываются на 1.2 сек.',
        cast(h, p) {
          const dmg = D(h, 160, 22, 0.6), dir = p.dir, x0 = h.x, z0 = h.z, hit = new Set();
          FX.lineDecal(x0, z0, dir, 15, 4.4, 0xffb84a, 0.45); SFX.at('ultcue', x0, z0, 0.8); SFX.at('charge', x0, z0, 0.5); castGlow(h, 0xffb84a);
          for (let k = 0; k < 6; k++) G.dangers.push({ x: x0 + Math.sin(dir) * (2 + k * 2.5), z: z0 + Math.cos(dir) * (2 + k * 2.5), r: 2.6, team: h.team, until: G.time + 0.8 });
          after(0.45, () => {
            SFX.at('quake', x0, z0); SFX.at('mace', x0, z0, 1); SFX.at('rubble', x0, z0, 0.7); FX.shake(0.8); FX.shock(x0 + Math.sin(dir) * 7, z0 + Math.cos(dir) * 7, 9, 1.2, 0.6); FX.punch(0.8);
            for (let k = 0; k < 6; k++) after(k * 0.055, () => {
              const d = 2 + k * 2.5, x = x0 + Math.sin(dir) * d, z = z0 + Math.cos(dir) * d;
              FX.scorch(x, z, 2.5, 0xffb347, 7); FX.pillar(x, z, { r: 1.8, h: 8, color: 0xffb347, life: 0.5 }); FX.debris(x, 0.3, z, { n: 7, color: 0x4a443c, speed: [2, 7], up: 13, size: [0.3, 0.8] });
              FX.flame(x, 0.4, z, { n: 6, color: 0xffd98a, color2: 0x7a2a00, size: [1.2, 2.6], up: 6, life: [0.3, 0.7] }); FX.sparks(x, 0.3, z, { n: 10, color: 0xffe9bf, color2: 0xff7a1a, speed: [3, 10], up: 9, life: [0.3, 0.8] });
              FX.smoke(x, z, 1.8, 3, 0x3a3128); FX.light(x, 2, z, 0xffa040, 1.8, 13, 0.35);
              for (const e of enemiesIn(h, x, z, 2.3)) if (!hit.has(e.id)) { hit.add(e.id); damage(h, e, dmg, 0); stun(h, e, 1.2, 2.4); }
            });
          });
        }
      }
    ]
  },
  /* ================= 2. Keira ================= */
  {
    id: 'keira', name: 'Кейра', title: 'Теневой клинок', role: 'assassin', roleName: 'Убийца', build: 'assassin', bars: [5, 2, 2, 5], diffc: 3,
    lore: 'Врывается в тыл, добивает раненых и исчезает. Хрупкая, но смертоносная.',
    look: { bulk: 0.84, c1: 0x2c2638, c2: 0x1e1a28, c3: 0x3e3452, glow: 0xc04dff, head: 'shade', chest: 'straps', sh: 'cloth', legs: 'boots', weapon: 'daggers', wc: 'dual', cape: 0x241e30 },
    stats: ST(590, 80, 260, 30, 62, 3.7, 24, 2.7, 0.82, 9.3, 2.5),
    abilities: [
      {
        key: 'Q', name: 'Клинок-тень', icon: 'kunai', cd: 6, cost: 35, range: 13, ind: { type: 'line', w: 1.6, fixed: true }, anim: 'thrust', ai: { t: 'shot', sp: 34, farm: true },
        desc: 'Метает клинок: урон и замедление на 35% на 1.5 сек.',
        cast(h, p) {
          const dmg = D(h, 58, 8, 0.7); SFX.at('whoosh', h.x, h.z, 0.6); SFX.at('dark', h.x, h.z, 0.3);
          shot(h, { dir: p.dir, speed: 34, range: 13, w: 0.8, mesh: 'blade', color: 0xc04dff, size: 0.9, spin: 30, onHit: e => { damage(h, e, dmg, 0); slow(h, e, 0.35, 1.5); FX.hit(e.x, 1.3, e.z, 0xc04dff, true); FX.slash(e.x, e.z, p.dir, { r: 2.4, color: 0xc04dff }); FX.smoke(e.x, e.z, 0.9, 2, 0x24163a); SFX.at('dagger', e.x, e.z, 0.8); } });
        }
      },
      {
        key: 'W', name: 'Шаг в тень', icon: 'vanish', cd: 12, cost: 40, range: 9, ind: { type: 'circle', r: 1.2 }, lock: 0.05, ai: { t: 'gap', escape: true },
        desc: 'Мгновенно переносится в точку, ускоряется на 2 сек. Следующая атака наносит бонусный урон.',
        cast(h, p) {
          const x0 = h.x, z0 = h.z, bonus = D(h, 36, 7, 0.45);
          FX.explosion(x0, z0, 1.8, 0xc04dff, { el: 'shadow' });
          blink(h, p.x, p.z); FX.beam(x0, z0, h.x, h.z, { color: 0xc04dff, w: 1.6, life: 0.4 }); FX.beam(x0, z0, h.x, h.z, { color: 0xffffff, w: 0.5, life: 0.25 });
          FX.explosion(h.x, h.z, 2, 0xc04dff, { el: 'shadow' }); SFX.at('blink', h.x, h.z, 0.8); SFX.at('dark', h.x, h.z, 0.4);
          addBuff(h, { id: 'shadowstep', dur: 2, ms: 0.35 });
          addBuff(h, { id: 'shadowstrike', dur: 4, onHit: (u, t, b) => { b.dur = 0; FX.explosion(t.x, t.z, 1.7, 0xc04dff, { el: 'shadow' }); SFX.at('shadowblade', t.x, t.z, 0.7); return bonus; } });
        }
      },
      {
        key: 'E', name: 'Веер клинков', icon: 'bladefan', cd: 9, cost: 40, range: 0, ind: { type: 'self', r: 4.5 }, lock: 0.1, ai: { t: 'nova', r: 3.8, farm: true },
        desc: 'Клинки разлетаются по кругу: урон всем рядом. Каждый задетый герой сокращает перезарядку «Шага в тень» на 2 сек.',
        cast(h) {
          const dmg = D(h, 50, 7, 0.5); SFX.at('dagger', h.x, h.z, 1); SFX.at('whoosh', h.x, h.z, 0.6);
          for (let i = 0; i < 3; i++) FX.slash(h.x, h.z, h.facing + i * 2.1, { r: 4.6, color: i % 2 ? 0xffffff : 0xc04dff, sweep: 2.4, life: 0.26, y: 1 + i * 0.25 });
          FX.sparks(h.x, 1.2, h.z, { n: 26, color: 0xf0d0ff, color2: 0x7a1aff, speed: [14, 20], life: [0.15, 0.3], ring: true, grav: 0, drag: 3, w: 0.2, stretch: 0.1 }); FX.ring(h.x, h.z, { r1: 4.5, color: 0xc04dff, life: 0.3, tex: 'shock' });
          for (const e of enemiesIn(h, h.x, h.z, 4.5)) { damage(h, e, dmg, 0); FX.hit(e.x, 1.3, e.z, 0xc04dff, true); if (e.kind === 'hero') h.cd[1] = Math.max(0, h.cd[1] - 2); }
        }
      },
      {
        key: 'R', name: 'Казнь', icon: 'execute', cd: 60, cost: 80, range: 10.5, ind: { type: 'target', hero: true }, anim: 'thrust', ai: { t: 'target', ult: true, hp: 0.5 },
        desc: 'Бросок к вражескому герою: урон, растущий от недостающего здоровья цели. Убийство возвращает половину перезарядки.',
        cast(h, p) {
          const t = p.unit; SFX.at('ultcue', h.x, h.z, 0.7); SFX.at('shadowblade', h.x, h.z, 0.7); FX.explosion(h.x, h.z, 1.6, 0xc04dff, { el: 'shadow' });
          addBuff(h, { id: 'execdash', dur: 0.6, dmgIn: 0.4 });
          dashTo(h, t.x, t.z, 50, {
            fly: true, follow: t, stop: 1.6, trail: u => FX.flame(u.x, 1.2, u.z, { n: 2, color: 0xc04dff, color2: 0x1a0a30, size: [0.8, 1.6], life: [0.25, 0.5], up: 0.5 }),
            onEnd: u => {
              if (!t.alive) return;
              const d = D(u, 140, 19, 0.85) + (t.maxHp - t.hp) * 0.18;
              FX.slash(t.x, t.z, u.facing + 0.8, { r: 4, color: 0xc04dff, life: 0.32 }); FX.slash(t.x, t.z, u.facing - 0.8, { r: 4, color: 0xffffff, flip: true, life: 0.32 });
              FX.explosion(t.x, t.z, 3, 0xc04dff, { el: 'shadow' }); FX.punch(0.9); SFX.at('dagger', t.x, t.z, 1); SFX.at('shadowblade', t.x, t.z, 1); SFX.at('flesh', t.x, t.z, 0.5);
              damage(u, t, d, 0); if (!t.alive) u.cd[3] *= 0.5; else u.order = { type: 'attack', tgt: t, rp: 0 };
            }
          });
        }
      }
    ]
  },
  /* ================= 3. Mora ================= */
  {
    id: 'mora', name: 'Мора', title: 'Пепельная ведьма', role: 'mage', roleName: 'Маг', build: 'mage', bars: [5, 2, 3, 1], diffc: 2,
    lore: 'Взрывной урон по площади. Столп пламени оглушает, метеор стирает всё под собой.',
    look: { bulk: 0.9, robe: true, c1: 0x4c2b27, c2: 0x2c1b1b, c3: 0x1e1414, glow: 0xff5a1f, head: 'ember', chest: 'robe', sh: 'cloth', weapon: 'staff', wc: 'staff' },
    stats: ST(565, 80, 440, 45, 48, 2.6, 20, 2.3, 0.68, 8.6, 9.5), projMesh: 'orb', atkSfx: 'cast',
    abilities: [
      {
        key: 'Q', name: 'Огненный шар', icon: 'fire', cd: 5.5, cost: 50, range: 15, ind: { type: 'line', w: 2, fixed: true }, ai: { t: 'shot', sp: 24, farm: true },
        desc: 'Шар взрывается при первом попадании: урон по области и короткое горение.',
        cast(h, p) {
          const dmg = D(h, 70, 10, 0, 0.6), tick = D(h, 5, 1, 0, 0.05); SFX.at('firebolt', h.x, h.z, 0.8); castGlow(h, 0xff7a2a);
          shot(h, {
            dir: p.dir, speed: 24, range: 15, w: 1.0, mesh: 'orb', color: 0xff7a2a, size: 1.2, onHit() { },
            trail: q => { FX.flame(q.x, q.y, q.z, { n: 2, color: 0xffd27a, color2: 0x8a1400, size: [0.9, 1.9], life: [0.25, 0.55], up: 1 }); FX.sparks(q.x, q.y, q.z, { n: 1, color: 0xffe0a0, color2: 0xff4a00, speed: [1, 4], life: [0.3, 0.6], grav: -3, w: 0.08 }); },
            onEnd: (x, z) => {
              FX.explosion(x, z, 3.2, 0xff5a1f, { el: 'fire', color2: 0x7a1500 }); SFX.at('boom', x, z, 0.7); SFX.at('ember', x, z, 0.5);
              for (const e of enemiesIn(h, x, z, 3.2)) { damage(h, e, dmg, 1); addBuff(e, { id: 'burn' + h.id, dur: 2.05, every: 0.5, onTick: u => { damage(h, u, tick, 1, { dot: true }); FX.flame(u.x, 1, u.z, { n: 2, color: 0xffa040, color2: 0x601000, size: [0.6, 1.2], life: [0.3, 0.6], up: 3 }); } }); }
            }
          });
        }
      },
      {
        key: 'W', name: 'Столп пламени', icon: 'firepillar', cd: 11, cost: 70, range: 13, ind: { type: 'circle', r: 3.4 }, ai: { t: 'point', delay: 0.7 },
        desc: 'Через 0.7 сек из земли вырывается пламя: урон и оглушение на 0.9 сек.',
        cast(h, p) {
          const dmg = D(h, 65, 9, 0, 0.5), x = p.x, z = p.z; telegraph(h, x, z, 3.4, 0.7, 0xff5a1f); SFX.at('hex', h.x, h.z, 0.6); SFX.at('ember', x, z, 0.4); castGlow(h, 0xff7a2a);
          FX.implode(x, 0.5, z, 4.5, { n: 26, color: 0xff8a2a, color2: 0xffe0a0, life: 0.65, streak: true }); FX.zone(x, z, 3.4, 0xff5a1f, 0.7, { tex: 'rune2', spin: 5 });
          after(0.7, () => {
            FX.pillar(x, z, { r: 3.3, h: 17, color: 0xff6a1f, life: 0.75 }); FX.pillar(x, z, { r: 1.7, h: 22, color: 0xfff0c0, life: 0.5 });
            FX.explosion(x, z, 3.4, 0xff5a1f, { el: 'fire', color2: 0x7a1500 }); FX.flame(x, 0.5, z, { n: 22, color: 0xffe0a0, color2: 0xa81800, size: [1.4, 3], life: [0.4, 1], up: 14, rad: 2.4, drag: 1.2 });
            FX.sparks(x, 0.5, z, { n: 26, color: 0xfff0c0, color2: 0xff3000, speed: [1, 4], life: [0.5, 1.2], up: 16, rad: 2.6, grav: -6, w: 0.1 }); SFX.at('fire', x, z); SFX.at('boom', x, z, 0.5);
            for (const e of enemiesIn(h, x, z, 3.4)) { damage(h, e, dmg, 1); stun(h, e, 0.9, 1.2); }
          });
        }
      },
      {
        key: 'E', name: 'Кольцо огня', icon: 'firering', cd: 16, cost: 60, range: 0, ind: { type: 'self', r: 4 }, lock: 0.1, ai: { t: 'shield' },
        desc: 'На 3 сек окружает себя огнём: щит и урон врагам вплотную.',
        cast(h) {
          const tick = D(h, 15, 2.2, 0, 0.09), c0 = hexRGB(0xffd27a), c1 = hexRGB(0x8a1400); shield(h, h, D(h, 70, 12, 0, 0.45), 3, 0xff7a2a); SFX.at('firebolt', h.x, h.z, 0.7); SFX.at('shield', h.x, h.z, 0.4);
          FX.ring(h.x, h.z, { r1: 4.2, color: 0xff5a1f, life: 0.4, tex: 'shock' });
          const b = addBuff(h, { id: 'firering', dur: 3.05, every: 0.5, onTick: u => { for (const e of enemiesIn(u, u.x, u.z, 4)) { damage(u, e, tick, 1); FX.hit(e.x, 1.2, e.z, 0xff7a2a); } } });
          b.fx = FX.aura(h, 0xff5a1f, 3.05, 4, 'swirl', 6); let t = 0;
          G.actors.push({ update(dt) { t += dt; if (!h.alive || t > 3) return false; for (let i = 0; i < 3; i++) { const a = t * 7 + i * 2.09; FX.pf.emit(h.x + Math.sin(a) * 3.8, 0.6, h.z + Math.cos(a) * 3.8, 0, rand(2, 5), 0, rand(0.3, 0.6), 1.3, 2.2, c0, c1, 0, 1, 0.5); } return true; } });
        }
      },
      {
        key: 'R', name: 'Метеор', icon: 'meteor', cd: 80, cost: 100, range: 17, ind: { type: 'circle', r: 6 }, animDur: 0.8, lock: 0.4, ai: { t: 'point', delay: 1.4, ult: true, hp: 0.7, rad: 6 },
        desc: 'Через 1.4 сек на область падает метеор: огромный урон и горящая земля на 4 сек.',
        cast(h, p) {
          const dmg = D(h, 220, 29, 0, 0.85), burn = D(h, 17, 3, 0, 0.07), x = p.x, z = p.z; telegraph(h, x, z, 6, 1.4, 0xff5a1f); SFX.at('ultcue', h.x, h.z, 0.8); SFX.at('hex', h.x, h.z, 0.5); SFX.at('fire', x, z, 0.4); castGlow(h, 0xff7a2a);
          FX.zone(x, z, 6, 0xff5a1f, 1.4, { tex: 'rune2', spin: 2 });
          const m = new THREE.Mesh(FX.geo.rock, new THREE.MeshBasicMaterial({ color: 0xff9a3a })); m.add(glowSprite(0xff5a1f, 10)); const rib = FX.ribbon(0xff7a2a, 5, 16);
          FX.add(m, 1.4, (k, me) => {
            const q = k * k; me.position.set(x + 13 * (1 - q), 52 * (1 - q) + 1, z - 9 * (1 - q)); me.scale.setScalar(2.5); me.rotation.x += 0.2; me.rotation.z += 0.13; rib.add(me.position.x, me.position.y, me.position.z);
            FX.flame(me.position.x, me.position.y, me.position.z, { n: 3, color: 0xffd27a, color2: 0x801000, size: [2, 4], life: [0.4, 0.9], up: 0 }); if (Math.random() < 0.5) FX.smoke(me.position.x, me.position.z, 1.2, 1);
          });
          after(1.4, () => {
            rib.end(); FX.explosion(x, z, 6.5, 0xff5a1f, { el: 'fire', color2: 0x7a1500 }); FX.pillar(x, z, { r: 3.4, h: 26, color: 0xff7a2a, life: 0.9, op: 0.45 });
            FX.ring(x, z, { r0: 2, r1: 12, color: 0xffa040, life: 0.8, tex: 'shock' }); FX.scorch(x, z, 6.2, 0xff5a1f, 10); FX.debris(x, 0.5, z, { n: 16, color: 0x3a2a22, speed: [4, 13], up: 15, size: [0.3, 0.9] });
            FX.sparks(x, 0.5, z, { n: 50, color: 0xfff0c0, color2: 0xff3000, speed: [6, 22], life: [0.5, 1.3], up: 10 }); FX.smoke(x, z, 5, 14); FX.shock(x, z, 13, 1.5, 0.7); FX.punch(1.2);
            FX.shake(1); SFX.at('bigboom', x, z); SFX.at('fire', x, z, 0.8); SFX.at('rubble', x, z, 0.6);
            for (const e of enemiesIn(h, x, z, 6)) damage(h, e, dmg, 1);
            zone(h, { x, z, r: 6, dur: 4, every: 0.5, tick: () => { FX.flame(x, 0.3, z, { n: 10, color: 0xffb040, color2: 0x601000, size: [1, 2.2], life: [0.5, 1.1], up: 4, rad: 5.5 }); FX.sparks(x, 0.2, z, { n: 5, color: 0xffe0a0, color2: 0xff4a00, speed: [0.5, 2], up: 6, rad: 5.5, grav: -3, life: [0.5, 1], w: 0.08 }); for (const e of enemiesIn(h, x, z, 6)) damage(h, e, burn, 1); } });
          });
        }
      }
    ]
  },
  /* ================= 4. Vale ================= */
  {
    id: 'vale', name: 'Вейл', title: 'Штормовой стрелок', role: 'marks', roleName: 'Стрелок', build: 'marks', bars: [5, 1, 3, 3], diffc: 2,
    lore: 'Постоянный урон с дистанции. Перекат спасает от рывков, сеть ловит преследователя, грозовой залп достаёт через пол-карты.',
    look: { bulk: 0.9, c1: 0x2f4551, c2: 0x26333a, c3: 0x4a3a2c, metal: 0x7a858c, glow: 0x4de3ff, head: 'scout', hair: 0x6a5a48, chest: 'straps', sh: 'round', legs: 'boots', weapon: 'crossbow', wc: 'gun', cape: 0x25343c, back: 'quiver' },
    stats: ST(540, 74, 300, 35, 56, 3.1, 20, 2.2, 0.84, 8.7, 10.5, 0.026), projMesh: 'bolt', atkSfx: 'arrow',
    abilities: [
      {
        key: 'Q', name: 'Пронзающий болт', icon: 'arrow', cd: 7, cost: 45, range: 20, ind: { type: 'line', w: 1.8, fixed: true }, anim: 'shoot', ai: { t: 'shot', sp: 44, farm: true },
        desc: 'Болт пробивает всех на пути. Каждая следующая цель получает на 15% меньше урона.',
        cast(h, p) {
          const dmg = D(h, 52, 8, 0.85); SFX.at('crossbow', h.x, h.z, 0.9); SFX.at('zap', h.x, h.z, 0.4);
          FX.beam(h.x, h.z, h.x + Math.sin(p.dir) * 7, h.z + Math.cos(p.dir) * 7, { color: 0x4de3ff, w: 1.4, life: 0.2 }); FX.glow(h.x + Math.sin(p.dir), 1.5, h.z + Math.cos(p.dir), 5, 0x4de3ff, 0.15, 'flare');
          shot(h, { dir: p.dir, speed: 44, range: 20, w: 0.9, pierce: true, mesh: 'bolt', color: 0x4de3ff, size: 1.3, onHit: (e, q) => { damage(h, e, dmg * Math.max(0.55, 1 - 0.15 * q.n), 0); FX.hit(e.x, 1.3, e.z, 0x4de3ff, true); FX.arcs(e.x, 1.2, e.z, 1.6, 2, 0x4de3ff); FX.ring(e.x, e.z, { r1: 1.8, color: 0x4de3ff, life: 0.25, y: 1.2 }); SFX.at('impact', e.x, e.z, 0.4); SFX.at('zap', e.x, e.z, 0.4); } });
        }
      },
      {
        key: 'W', name: 'Перекат', icon: 'roll', cd: 9, cost: 35, range: 6.5, ind: { type: 'circle', r: 1 }, lock: 0, ai: { t: 'escape', kite: true },
        desc: 'Короткий рывок. После него +45% скорости атаки на 3.5 сек, а следующая атака бьёт сильнее.',
        cast(h, p) {
          const bonus = D(h, 20, 4, 0.25); SFX.at('dash', h.x, h.z, 0.6); SFX.at('whoosh', h.x, h.z, 0.5); FX.ring(h.x, h.z, { r1: 2, color: 0x4de3ff, life: 0.3 }); FX.smoke(h.x, h.z, 0.9, 3, 0x26333a);
          dashTo(h, p.x, p.z, 27, { trail: u => FX.sparks(u.x, 0.5, u.z, { n: 1, color: 0x9ff2ff, color2: 0x0a6a9a, speed: [1, 3], life: [0.2, 0.4], grav: -2, w: 0.09 }), onEnd: u => { u.atkCd = Math.min(u.atkCd, 0.1); FX.arcs(u.x, 1, u.z, 1.6, 2, 0x4de3ff); } });
          addBuff(h, { id: 'tumble', dur: 3.5, as: 0.45 });
          addBuff(h, { id: 'tumblehit', dur: 4, onHit: (u, t, b) => { b.dur = 0; FX.hit(t.x, 1.3, t.z, 0xffffff, true); FX.arcs(t.x, 1.2, t.z, 1.8, 3, 0x4de3ff); SFX.at('zap', t.x, t.z, 0.6); return bonus; } });
        }
      },
      {
        key: 'E', name: 'Шоковая сеть', icon: 'net', cd: 14, cost: 50, range: 13, ind: { type: 'line', w: 2, fixed: true }, anim: 'shoot', ai: { t: 'shot', sp: 32 },
        desc: 'Сеть обездвиживает первого врага на 1 сек и бьёт током.',
        cast(h, p) {
          const dmg = D(h, 40, 6, 0.3); SFX.at('crossbow', h.x, h.z, 0.7); SFX.at('zap', h.x, h.z, 0.3);
          shot(h, { dir: p.dir, speed: 32, range: 13, w: 1.0, mesh: 'orb', color: 0x4de3ff, size: 0.9, spin: 12, trail: q => { if (Math.random() < 0.5) FX.arcs(q.x, q.y, q.z, 1, 1, 0x4de3ff); }, onHit: e => { damage(h, e, dmg, 1); root(h, e, 1.0, 0x4de3ff); FX.explosion(e.x, e.z, 2, 0x4de3ff, { el: 'elec' }); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; FX.beam(e.x + Math.sin(a) * 2, e.z + Math.cos(a) * 2, e.x, e.z, { color: 0x4de3ff, w: 0.4, life: 0.8, y: 0.5 }); } SFX.at('zap', e.x, e.z); SFX.at('string', e.x, e.z, 0.5); } });
        }
      },
      {
        key: 'R', name: 'Грозовой залп', icon: 'volley', cd: 70, cost: 100, range: 38, ind: { type: 'line', w: 3.2, fixed: true }, anim: 'shoot', animDur: 0.7, lock: 0.35, ai: { t: 'shot', sp: 52, r: 30, ult: true, hp: 0.55 },
        desc: 'Дальнобойный заряд летит сквозь миньонов. Первый герой получает большой урон и оглушение на 1.2 сек, молния бьёт врагов рядом.',
        cast(h, p) {
          const dmg = D(h, 190, 26, 0.95); SFX.at('ultcue', h.x, h.z, 0.7); SFX.at('railgun', h.x, h.z, 1); SFX.at('zap', h.x, h.z, 0.5); FX.shake(0.3); FX.punch(0.6);
          FX.ring(h.x, h.z, { r1: 3.5, color: 0x4de3ff, life: 0.35, tex: 'shock' }); FX.arcs(h.x, 1.4, h.z, 3, 5, 0x4de3ff); FX.glow(h.x, 1.5, h.z, 9, 0xffffff, 0.2, 'flare');
          shot(h, {
            dir: p.dir, speed: 52, range: 38, w: 1.6, heroOnly: true, mesh: 'bolt', color: 0x9ff2ff, size: 2.6, ribbon: 3.4,
            trail: q => { FX.sparks(q.x, q.y, q.z, { n: 3, color: 0xffffff, color2: 0x2aa8ff, speed: [2, 9], life: [0.15, 0.4], grav: 0, drag: 3, w: 0.12 }); if (Math.random() < 0.4) FX.bolt(q.x, q.y, q.z, q.x + rand(-3.5, 3.5), 0.2, q.z + rand(-3.5, 3.5), { color: 0x4de3ff, w: 0.5, life: 0.15, fork: false }); },
            onHit: e => {
              damage(h, e, dmg, 0); stun(h, e, 1.2); FX.explosion(e.x, e.z, 4, 0x4de3ff, { el: 'elec' }); skyBolt(e.x, e.z, 0x4de3ff, 4); SFX.at('thunder', e.x, e.z, 1); SFX.at('boom', e.x, e.z, 0.6);
              for (const o of enemiesIn(h, e.x, e.z, 6)) if (o !== e) { FX.bolt(e.x, 1.5, e.z, o.x, 1.3, o.z, { color: 0x4de3ff }); FX.hit(o.x, 1.3, o.z, 0x4de3ff, true); damage(h, o, dmg * 0.5, 1); }
            }
          });
        }
      }
    ]
  },
  /* ================= 5. Oriel ================= */
  {
    id: 'oriel', name: 'Ориэль', title: 'Хранительница света', role: 'support', roleName: 'Поддержка', build: 'support', bars: [2, 2, 4, 2], diffc: 1,
    lore: 'Лечит и прикрывает союзников. Святилище переворачивает командные бои.',
    look: { bulk: 0.88, robe: true, c1: 0x8a8370, c2: 0x5d5848, c3: 0x4a4638, metal: 0xb89a55, glow: 0xffe9a0, head: 'sun', chest: 'robe', sh: 'cloth', weapon: 'staffsun', wc: 'staff', cape: 0x6f6a58 },
    stats: ST(550, 78, 460, 48, 46, 2.4, 20, 2.4, 0.7, 8.8, 9.5), projMesh: 'orb', atkSfx: 'cast',
    abilities: [
      {
        key: 'Q', name: 'Луч рассвета', icon: 'sunbeam', noReach: true, cd: 6.5, cost: 55, range: 16, ind: { type: 'line', w: 2.8, fixed: true }, lock: 0.3, ai: { t: 'shot', healLine: true, farm: true },
        desc: 'Луч ранит врагов и лечит союзных героев на линии. Ориэль исцеляется за каждого союзника.',
        cast(h, p) {
          const dmg = D(h, 62, 9, 0, 0.52), hl = D(h, 55, 8, 0, 0.45), x0 = h.x, z0 = h.z, x1 = x0 + Math.sin(p.dir) * 16, z1 = z0 + Math.cos(p.dir) * 16;
          FX.lineDecal(x0, z0, p.dir, 16, 2.8, 0xffe9a0, 0.25); SFX.at('spirit', x0, z0, 0.6); castGlow(h, 0xffe9a0);
          after(0.25, () => {
            FX.beam(x0, z0, x1, z1, { color: 0xffd97a, w: 4.6, life: 0.5, y: 1.4 }); FX.beam(x0, z0, x1, z1, { color: 0xffffff, w: 1.8, life: 0.35, y: 1.5 }); FX.glow(x0, 1.6, z0, 8, 0xffffff, 0.25, 'flare');
            for (let k = 0; k < 16; k++) FX.sparks(lerp(x0, x1, k / 16), 1.3, lerp(z0, z1, k / 16), { n: 2, color: 0xfff6d0, color2: 0xffb030, speed: [0.5, 3], life: [0.3, 0.8], up: 3, grav: -2, w: 0.09, stretch: 0.05 });
            FX.light(lerp(x0, x1, 0.4), 3, lerp(z0, z1, 0.4), 0xffe0a0, 2.2, 24, 0.4); SFX.at('holy', x0, z0, 0.9); SFX.at('laser', x0, z0, 0.35);
            for (const u of G.units) {
              if (!u.alive || u.struct || u === h) continue; if (segDist(u.x, u.z, x0, z0, x1, z1) > 1.4 + u.radius) continue;
              if (u.team !== h.team) { damage(h, u, dmg, 1); FX.hit(u.x, 1.3, u.z, 0xffe9a0, true); }
              else if (u.kind === 'hero') { heal(h, u, hl); FX.heal(u, 0xffe9a0); heal(h, h, hl * 0.4); }
            }
          });
        }
      },
      {
        key: 'W', name: 'Оберег', icon: 'ward', cd: 10, cost: 60, range: 12, ind: { type: 'ally' }, lock: 0.1, ai: { t: 'shieldAlly' },
        desc: 'Щит союзному герою (или себе) на 3.5 сек и +25% скорости на 2 сек.',
        cast(h, p) {
          const t = p.unit; shield(h, t, D(h, 80, 13, 0, 0.6), 3.5, 0xffe9a0); addBuff(t, { id: 'wardms', dur: 2, ms: 0.25 });
          if (t !== h) FX.beam(h.x, h.z, t.x, t.z, { color: 0xffe9a0, w: 1.1, life: 0.4 }); FX.ring(t.x, t.z, { r1: 2.6, color: 0xffe9a0, life: 0.4, tex: 'shock' }); FX.pillar(t.x, t.z, { r: 1.3, h: 8, color: 0xffe9a0, life: 0.5 }); FX.heal(t, 0xffe9a0); SFX.at('shield', t.x, t.z, 0.8); SFX.at('chime', t.x, t.z, 0.5);
        }
      },
      {
        key: 'E', name: 'Слепящая вспышка', icon: 'flash', cd: 11, cost: 55, range: 12, ind: { type: 'circle', r: 3.6 }, ai: { t: 'point', delay: 0.45 },
        desc: 'Через 0.45 сек в точке вспыхивает свет: урон и замедление на 45% на 1.5 сек.',
        cast(h, p) {
          const dmg = D(h, 58, 8, 0, 0.48), x = p.x, z = p.z; telegraph(h, x, z, 3.6, 0.45, 0xffe9a0); castGlow(h, 0xffe9a0); SFX.at('spirit', x, z, 0.6);
          FX.implode(x, 1, z, 4, { n: 18, color: 0xffe9a0, color2: 0xffffff, life: 0.42, streak: true });
          after(0.45, () => { FX.explosion(x, z, 3.6, 0xffe9a0, { el: 'holy' }); FX.glow(x, 1.4, z, 14, 0xffffff, 0.25, 'flare'); FX.glow(x, 1.4, z, 9, 0xffffff, 0.2, 'star'); SFX.at('holy', x, z, 1); SFX.at('impact', x, z, 0.4); for (const e of enemiesIn(h, x, z, 3.6)) { damage(h, e, dmg, 1); slow(h, e, 0.45, 1.5); } });
        }
      },
      {
        key: 'R', name: 'Святилище', icon: 'sanctuary', cd: 85, cost: 100, range: 12, ind: { type: 'circle', r: 8 }, animDur: 0.7, ai: { t: 'sanct' },
        desc: 'На 6 сек создаёт круг света: союзные герои внутри исцеляются, враги замедляются и получают урон.',
        cast(h, p) {
          const hl = D(h, 21, 4, 0, 0.13), dmg = D(h, 12, 2, 0, 0.06), x = p.x, z = p.z;
          FX.zone(x, z, 8, 0xffe9a0, 6, { spin: 0.4 }); FX.zone(x, z, 8, 0xffb84a, 6, { spin: -0.25, tex: 'rune2', op: 0.6 }); FX.wall(x, z, 8, 0xffe9a0, 6, { h: 4, op: 0.3 });
          FX.pillar(x, z, { r: 8, h: 12, color: 0xffe9a0, life: 1, op: 0.5, grow: true }); FX.ring(x, z, { r1: 9, color: 0xffffff, life: 0.6, tex: 'shock' }); FX.shock(x, z, 9, 0.6, 0.6); SFX.at('ultcue', x, z, 0.7); SFX.at('holy', x, z, 1); SFX.at('bell', x, z, 0.7); SFX.at('heal', x, z, 0.6);
          zone(h, {
            x, z, r: 8, dur: 6, every: 0.5, first: true, tick: () => {
              FX.sparks(x, 0.2, z, { n: 14, color: 0xfff6d0, color2: 0xffb030, speed: [0.1, 0.5], life: [0.8, 1.5], up: 6, rad: 7.6, ring: true, grav: -1, drag: 0.8, w: 0.08, stretch: 0.05 });
              if (Math.random() < 0.6) { const a = rand(TAU), d = rand(7); FX.pillar(x + Math.sin(a) * d, z + Math.cos(a) * d, { r: 0.4, h: 9, color: 0xffe9a0, life: 0.7, op: 0.5 }); }
              for (const a of alliesIn(h, x, z, 8, true)) heal(h, a, hl);
              for (const e of enemiesIn(h, x, z, 8)) { damage(h, e, dmg, 1); slow(h, e, 0.3, 0.7, 'sanct'); }
            }
          });
        }
      }
    ]
  },
  /* ================= 6. Groh ================= */
  {
    id: 'groh', name: 'Грох', title: 'Каменный бродяга', role: 'front', roleName: 'Боец', build: 'bruiser', bars: [3, 4, 3, 3], diffc: 1,
    lore: 'Тяжёлый боец ближнего боя. Прыжок в толпу, широкие удары и ярость, которая лечит.',
    look: { bulk: 1.5, h: 1.1, c1: 0x4e4b45, c2: 0x34322e, c3: 0x2a2825, skin: 0x4e4b45, glow: 0x5dffb0, head: 'golem', chest: 'bare', sh: 'crystal', legs: 'boots', weapon: 'fists', wc: 'fist', arm: 1.45, back: 'crystals' },
    stats: ST(690, 92, 260, 30, 62, 3.7, 30, 3.3, 0.74, 8.7, 2.9),
    abilities: [
      {
        key: 'Q', name: 'Крушащий удар', icon: 'smash', cd: 6, cost: 35, range: 5.8, ind: { type: 'cone', r: 5.8 }, anim: 'slam', animDur: 0.5, lock: 0.3, ai: { t: 'cone', farm: true },
        desc: 'Широкий удар по конусу перед собой: урон и замедление на 40% на 1.5 сек.',
        cast(h, p) {
          const dmg = D(h, 65, 10, 0.7), dir = p.dir;
          after(0.22, () => {
            if (!h.alive) return; const fx = h.x + Math.sin(dir) * 2.8, fz = h.z + Math.cos(dir) * 2.8;
            FX.slash(h.x, h.z, dir, { r: 5.9, color: 0x5dffb0, life: 0.3, y: 0.9 }); FX.scorch(fx, fz, 3, 0x5dffb0, 6); FX.debris(fx, 0.3, fz, { n: 9, color: 0x45423c, speed: [3, 9], up: 10, size: [0.25, 0.7] }); FX.debris(fx, 0.3, fz, { glow: true, n: 4, color: 0x9dffd0, speed: [3, 8], up: 9, size: [0.2, 0.4] });
            FX.sparks(fx, 0.4, fz, { n: 16, color: 0xd8ffe8, color2: 0x1a8a58, speed: [4, 13], life: [0.3, 0.7], up: 5, dir, spread: 0.9 });
            FX.smoke(fx, fz, 1.8, 4, 0x35332f); FX.shake(0.4); FX.shock(fx, fz, 5, 0.7, 0.4); SFX.at('stone', fx, fz, 1); SFX.at('punch', fx, fz, 0.7); SFX.at('quake', h.x, h.z, 0.4);
            for (const e of enemiesIn(h, h.x, h.z, 5.8)) if (inCone(h, e, dir, 0.87, 5.8)) { damage(h, e, dmg, 0); slow(h, e, 0.4, 1.5); FX.hit(e.x, 1.3, e.z, 0x5dffb0, true); }
          });
        }
      },
      {
        key: 'W', name: 'Ярость недр', icon: 'roar', cd: 14, cost: 45, range: 0, ind: { type: 'self', r: 2 }, lock: 0, ai: { t: 'buff' },
        desc: 'На 5 сек: +40% скорости атаки, +20% скорости, 15% вампиризма и +15 защиты.',
        cast(h) {
          const b = addBuff(h, { id: 'fury', dur: 5, as: 0.4, ms: 0.2, ls: 0.15, def: 15 }); b.fx = FX.aura(h, 0x5dffb0, 5, 1.7, 'rune2', 4);
          FX.ring(h.x, h.z, { r1: 4, color: 0x5dffb0, life: 0.45, tex: 'shock' }); FX.pillar(h.x, h.z, { r: 1.6, h: 9, color: 0x5dffb0, life: 0.5 });
          FX.debris(h.x, 0.5, h.z, { glow: true, n: 8, color: 0x9dffd0, speed: [3, 8], up: 10, size: [0.2, 0.45] }); FX.flame(h.x, 1, h.z, { n: 8, color: 0x5dffb0, color2: 0x0a4a2a, size: [1, 2.2], up: 4 }); SFX.at('roar', h.x, h.z, 0.9); SFX.at('stone', h.x, h.z, 0.4);
        }
      },
      { key: 'E', name: 'Каменная кожа', icon: 'stoneskin', passive: true, desc: 'Пассивно: +60 / 120 / 180 / 240 здоровья и +4 / 8 / 12 / 16 защиты.', stats: l => ({ hp: 60 * l, def: 4 * l }) },
      {
        key: 'R', name: 'Обвал', icon: 'rockfall', cd: 70, cost: 90, range: 13, ind: { type: 'circle', r: 5.5 }, anim: 'slam', animDur: 0.6, ai: { t: 'gap', ult: true, hp: 0.7, rad: 5.5 },
        desc: 'Прыжок в точку. При приземлении — большой урон по области, подбрасывание на 1 сек и замедление.',
        cast(h, p) {
          const dmg = D(h, 170, 24, 0.8), q = NAV.nearest(p.x, p.z); telegraph(h, q.x, q.z, 5.5, dist(h.x, h.z, q.x, q.z) / 26 + 0.05, 0x5dffb0);
          SFX.at('ultcue', h.x, h.z, 0.7); SFX.at('roar', h.x, h.z, 0.7); SFX.at('rubble', h.x, h.z, 0.4); FX.ring(h.x, h.z, { r1: 3, color: 0x5dffb0, life: 0.3, tex: 'shock' }); FX.smoke(h.x, h.z, 1.5, 5, 0x35332f); FX.debris(h.x, 0.3, h.z, { n: 5, color: 0x45423c, speed: [2, 6], up: 8 });
          dashTo(h, q.x, q.z, 26, {
            fly: true, arc: 5.5, onEnd: u => {
              FX.explosion(u.x, u.z, 5.5, 0x5dffb0, { el: 'earth', rock: 0x45423c }); FX.ring(u.x, u.z, { r0: 1, r1: 9.5, color: 0xd8ffe8, life: 0.6, tex: 'shock' }); FX.debris(u.x, 0.4, u.z, { glow: true, n: 10, color: 0x9dffd0, speed: [4, 12], up: 13, size: [0.25, 0.55] });
              FX.sparks(u.x, 0.3, u.z, { n: 36, color: 0xe8fff2, color2: 0x1a8a58, speed: [5, 18], life: [0.4, 1.1], up: 9 }); FX.shock(u.x, u.z, 10, 1.4, 0.6); FX.punch(1);
              FX.shake(0.9); SFX.at('quake', u.x, u.z); SFX.at('stone', u.x, u.z, 1); SFX.at('rubble', u.x, u.z, 0.8); SFX.at('boom', u.x, u.z, 0.6);
              for (const e of enemiesIn(u, u.x, u.z, 5.5)) { damage(u, e, dmg, 0); stun(u, e, 1.0, 2.2); slow(u, e, 0.3, 2.5); }
            }
          });
        }
      }
    ]
  },
  /* ================= 7. Nox ================= */
  {
    id: 'nox', name: 'Нокс', title: 'Грозовой жрец', role: 'mage', roleName: 'Маг', build: 'mage', bars: [4, 1, 4, 3], diffc: 2,
    lore: 'Молнии перескакивают между целями, статическое поле приковывает к месту, гнев небес накрывает всех вокруг.',
    look: { bulk: 0.9, robe: true, c1: 0x2b3452, c2: 0x1c2238, c3: 0x4a5270, metal: 0x8a94b0, glow: 0x6f9bff, head: 'storm', chest: 'tabard', sh: 'plate', weapon: 'orb', wc: 'wand', cape: 0x1a2034 },
    stats: ST(570, 80, 430, 45, 48, 2.6, 20, 2.3, 0.7, 8.6, 9.5), projMesh: 'orb', atkSfx: 'zap',
    abilities: [
      {
        key: 'Q', name: 'Цепная молния', icon: 'chainbolt', cd: 6, cost: 55, range: 12, ind: { type: 'target' }, ai: { t: 'target', farm: true },
        desc: 'Молния бьёт цель и перескакивает ещё на 3 врагов рядом, слабея на 15% за скачок.',
        cast(h, p) {
          const dmg = D(h, 66, 9, 0, 0.56), hit = new Set(); let cur = p.unit, from = { x: h.x, y: 2.4, z: h.z }; castGlow(h, 0x6f9bff); SFX.at('thunder', h.x, h.z, 0.45);
          for (let i = 0; i < 4 && cur; i++) {
            const t = cur, f = from, d = dmg * Math.pow(0.85, i);
            after(i * 0.09, () => { FX.bolt(f.x, f.y, f.z, t.x, t.height * 0.6, t.z, { color: 0x6f9bff, w: 1.1 }); FX.hit(t.x, t.height * 0.6, t.z, 0x6f9bff, true); FX.arcs(t.x, 1.2, t.z, 1.8, 3, 0x6f9bff); FX.light(t.x, 2, t.z, 0x6f9bff, 2, 13, 0.25); SFX.at('zap', t.x, t.z, 0.8); damage(h, t, d, 1); });
            hit.add(t.id); from = { x: t.x, y: t.height * 0.6, z: t.z }; cur = nearestEnemyTo(h, t.x, t.z, 7, hit);
          }
        }
      },
      {
        key: 'W', name: 'Статическое поле', icon: 'field', cd: 11, cost: 65, range: 13, ind: { type: 'circle', r: 3.6 }, ai: { t: 'point', delay: 0.6 },
        desc: 'Через 0.6 сек область разряжается: урон и обездвиживание на 1.3 сек.',
        cast(h, p) {
          const dmg = D(h, 52, 8, 0, 0.42), x = p.x, z = p.z; telegraph(h, x, z, 3.6, 0.6, 0x6f9bff); SFX.at('charge', x, z, 0.6); castGlow(h, 0x6f9bff);
          FX.zone(x, z, 3.6, 0x6f9bff, 0.6, { spin: 6 }); let t = 0; G.actors.push({ update(dt) { t += dt; if (Math.random() < dt * 14) FX.arcs(x, 0.6, z, 3.4, 1, 0x6f9bff); return t < 0.6; } });
          after(0.6, () => {
            skyBolt(x, z, 0x6f9bff, 3.6); SFX.at('thunder', x, z, 0.8); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; FX.bolt(x, 0.6, z, x + Math.sin(a) * 3.5, 0.4, z + Math.cos(a) * 3.5, { color: 0x6f9bff, w: 0.6 }); }
            FX.explosion(x, z, 3.2, 0x6f9bff, { el: 'elec' }); FX.ring(x, z, { r0: 3.4, r1: 3.7, color: 0x6f9bff, life: 1.3, tex: 'ring' });
            for (const e of enemiesIn(h, x, z, 3.6)) { damage(h, e, dmg, 1); root(h, e, 1.3, 0x6f9bff); }
          });
        }
      },
      {
        key: 'E', name: 'Громовой шаг', icon: 'thunderstep', cd: 15, cost: 60, range: 8, ind: { type: 'circle', r: 3 }, lock: 0, ai: { t: 'escape' },
        desc: 'Мгновенно переносится молнией и бьёт разрядом врагов в точке прибытия.',
        cast(h, p) {
          const dmg = D(h, 48, 7, 0, 0.38), x0 = h.x, z0 = h.z; blink(h, p.x, p.z);
          FX.bolt(x0, 1.6, z0, h.x, 1.6, h.z, { color: 0x6f9bff, w: 1.8, jag: 0.6, life: 0.3 }); FX.explosion(x0, z0, 1.6, 0x6f9bff, { el: 'elec' }); FX.explosion(h.x, h.z, 3, 0x6f9bff, { el: 'elec' }); skyBolt(h.x, h.z, 0x6f9bff, 3); SFX.at('blink', x0, z0, 0.7); SFX.at('thunder', h.x, h.z, 0.7);
          for (const e of enemiesIn(h, h.x, h.z, 3)) damage(h, e, dmg, 1);
        }
      },
      {
        key: 'R', name: 'Гнев небес', icon: 'storm', cd: 80, cost: 100, range: 0, ind: { type: 'self', r: 12 }, animDur: 0.8, ai: { t: 'nova', r: 9.5, ult: true, hp: 0.8 },
        desc: 'На 3.2 сек вокруг Нокса бушует гроза: 8 молний бьют врагов в радиусе, нанося урон по области и сбивая с ног.',
        cast(h) {
          const dmg = D(h, 66, 9, 0, 0.33);
          const b = addBuff(h, {
            id: 'wrath', dur: 3.25, every: 0.4, onTick: u => {
              const es = enemiesIn(u, u.x, u.z, 12), hs = es.filter(e => e.kind === 'hero'), t = hs.length && Math.random() < 0.75 ? pick(hs) : (es.length ? pick(es) : null);
              const x = t ? t.x : u.x + rand(-9, 9), z = t ? t.z : u.z + rand(-9, 9);
              skyBolt(x, z, 0x6f9bff, 2.4); SFX.at('thunder', x, z, 0.3); FX.shake(0.22); FX.shock(x, z, 4, 0.6, 0.3);
              for (const e of enemiesIn(u, x, z, 2.4)) { damage(u, e, dmg, 1); stun(u, e, 0.25); }
            }
          });
          b.fx = FX.zone(h.x, h.z, 12, 0x6f9bff, 3.25, { follow: h, spin: 1.5, op: 0.6 }); FX.wall(h.x, h.z, 12, 0x6f9bff, 3.25, { follow: h, h: 5, op: 0.22, spin: 2 });
          FX.ring(h.x, h.z, { r1: 12, color: 0x6f9bff, life: 0.6, tex: 'shock' }); FX.pillar(h.x, h.z, { r: 2, h: 22, color: 0x6f9bff, life: 0.7 }); FX.arcs(h.x, 1.5, h.z, 5, 8, 0x6f9bff); SFX.at('ultcue', h.x, h.z, 0.8); SFX.at('overload', h.x, h.z, 0.9); SFX.at('thunder', h.x, h.z, 0.8);
        }
      }
    ]
  },
  /* ================= 8. Silva ================= */
  {
    id: 'silva', name: 'Сильва', title: 'Лесная охотница', role: 'marks', roleName: 'Стрелок', build: 'marks', bars: [4, 1, 3, 2], diffc: 2,
    lore: 'Стрелок с контролем зоны. Капканы ловят неосторожных, ливень стрел запирает проход.',
    look: { bulk: 0.86, c1: 0x3b4b31, c2: 0x2a3524, c3: 0x4c3e2b, glow: 0x7de05a, head: 'stag', chest: 'straps', sh: 'fur', legs: 'boots', weapon: 'bow', wc: 'bow', cape: 0x2c3a26, back: 'quiver' },
    stats: ST(535, 74, 310, 36, 55, 3.3, 20, 2.2, 0.86, 8.8, 10.5, 0.026), projMesh: 'arrow', atkSfx: 'arrow',
    abilities: [
      {
        key: 'Q', name: 'Тройной залп', icon: 'arrows', cd: 6.5, cost: 45, range: 14, ind: { type: 'cone', r: 14, narrow: true }, anim: 'shoot', ai: { t: 'shot', sp: 38, farm: true },
        desc: 'Три стрелы веером. Повторные попадания по одной цели наносят половину урона.',
        cast(h, p) {
          const dmg = D(h, 45, 7, 0.6), cnt = {}; SFX.at('bow', h.x, h.z, 1); SFX.at('arrow', h.x, h.z, 0.5);
          for (const a of [-0.2, 0, 0.2]) shot(h, { dir: p.dir + a, speed: 38, range: 14, w: 0.7, mesh: 'arrow', color: 0x7de05a, size: 1.2, onHit: e => { damage(h, e, dmg * (cnt[e.id] ? 0.5 : 1), 0); cnt[e.id] = 1; FX.hit(e.x, 1.3, e.z, 0x7de05a, true); SFX.at('impact', e.x, e.z, 0.45); } });
        }
      },
      {
        key: 'W', name: 'Капкан', icon: 'beartrap', cd: 13, cost: 50, range: 11, ind: { type: 'circle', r: 1.7 }, ai: { t: 'point', delay: 0.5, trap: true },
        desc: 'Ставит капкан на 30 сек (до трёх). Вражеский герой, наступив, получает урон и обездвиживается на 1.5 сек.',
        cast(h, p) {
          const dmg = D(h, 60, 9, 0.4), x = p.x, z = p.z; h.traps = (h.traps || []).filter(t => !t.done); if (h.traps.length >= 3) h.traps.shift().done = true;
          const tr = { done: false, t: 0 }; h.traps.push(tr);
          const fx = FX.zone(x, z, 1.7, 0x7de05a, 31, { tex: 'rune2', spin: 0.8, op: 0.5 }); FX.ring(x, z, { r1: 2.2, color: 0x7de05a, life: 0.4 }); FX.sparks(x, 0.3, z, { n: 8, color: 0xd8ffc8, color2: 0x2f8a1a, speed: [1, 4], up: 4, life: [0.3, 0.6] }); SFX.at('clack', x, z, 0.6); SFX.at('chain', x, z, 0.3);
          G.actors.push({
            update(dt) {
              tr.t += dt; if (tr.done || tr.t > 30) { fx.dead = true; tr.done = true; return false; }
              if (tr.t < 0.8) return true;
              for (const e of G.heroes) if (e.alive && e.team !== h.team && dist(e.x, e.z, x, z) < 1.7 + e.radius) {
                damage(h, e, dmg, 0); root(h, e, 1.5, 0x7de05a); FX.explosion(x, z, 2, 0x7de05a, { smoke: false }); FX.debris(x, 0.3, z, { glow: true, n: 6, color: 0xb8ffa0, speed: [2, 6], up: 8, size: [0.15, 0.35] });
                for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; FX.beam(x + Math.sin(a) * 2, z + Math.cos(a) * 2, e.x, e.z, { color: 0x7de05a, w: 0.5, life: 0.6, y: 0.6 }); }
                SFX.at('bite', x, z, 1); SFX.at('mace', x, z, 0.4); fx.dead = true; tr.done = true; return false;
              }
              return true;
            }
          });
        }
      },
      { key: 'E', name: 'Глаз охотницы', icon: 'eye', passive: true, desc: 'Пассивно: +6 / 12 / 18 / 24% скорости атаки и +5 / 10 / 15 / 20% шанса критического удара.', stats: l => ({ as: 0.06 * l, crit: 0.05 * l }) },
      {
        key: 'R', name: 'Ливень стрел', icon: 'rain', cd: 75, cost: 100, range: 16, ind: { type: 'circle', r: 7 }, anim: 'shoot', animDur: 0.7, ai: { t: 'point', delay: 0.4, ult: true, hp: 0.75, rad: 7 },
        desc: '3.5 сек стрелы накрывают область: урон каждые полсекунды и замедление на 35%.',
        cast(h, p) {
          const dmg = D(h, 34, 5, 0.32), x = p.x, z = p.z, c0 = hexRGB(0xf0ffe0), c1 = hexRGB(0x4fae28);
          FX.zone(x, z, 7, 0x7de05a, 3.6, { tex: 'ring', spin: 0.3 }); FX.zone(x, z, 7, 0x7de05a, 3.6, { spin: -0.5, op: 0.5 }); SFX.at('ultcue', h.x, h.z, 0.6); SFX.at('horn', h.x, h.z, 0.6); SFX.at('bow', h.x, h.z, 1);
          let acc = 0, t = 0;
          G.actors.push({ update(dt) { t += dt; acc += dt * 80; while (acc > 1) { acc--; const a = rand(TAU), r = Math.sqrt(Math.random()) * 7; FX.st.emit(x + Math.sin(a) * r + 3.2, 18, z + Math.cos(a) * r - 2.2, -7, -40, 5, 0.42, 0.13, 0.055, c0, c1, 0, 0); } return t < 3.5; } });
          zone(h, {
            x, z, r: 7, dur: 3.5, every: 0.5, first: true, tick: () => {
              FX.sparks(x, 0.2, z, { n: 20, color: 0xe8ffd0, color2: 0x4fae28, speed: [1, 5], life: [0.2, 0.45], up: 3, rad: 6.6, ring: true, w: 0.09 }); FX.smoke(x + rand(-4, 4), z + rand(-4, 4), 1.2, 1, 0x3a3a30); SFX.at('arrow', x, z, 0.5);
              for (const e of enemiesIn(h, x, z, 7)) { damage(h, e, dmg, 0); slow(h, e, 0.35, 0.8, 'rain'); }
            }
          });
        }
      }
    ]
  },
  /* ================= 9. Morg ================= */
  {
    id: 'morg', name: 'Морг', title: 'Жнец чумы', role: 'mage', roleName: 'Маг', build: 'mage', bars: [4, 3, 2, 1], diffc: 2,
    lore: 'Травит врагов и пьёт их жизнь. Чем дольше бой, тем он сильнее.',
    look: { bulk: 1.0, robe: true, c1: 0x2e3428, c2: 0x1d2019, c3: 0x14160f, metal: 0x6a6f60, glow: 0xa6ff3d, head: 'plague', chest: 'robe', sh: 'cloth', weapon: 'scythe', wc: 'staff', cape: 0x1a1d16 },
    stats: ST(595, 84, 420, 44, 50, 2.7, 22, 2.5, 0.7, 8.5, 8.5), projMesh: 'orb', atkSfx: 'poison',
    abilities: [
      {
        key: 'Q', name: 'Гнилостный снаряд', icon: 'plagueorb', cd: 5.5, cost: 50, range: 14, ind: { type: 'line', w: 2, fixed: true }, ai: { t: 'shot', sp: 22, farm: true },
        desc: 'Сгусток лопается при попадании: урон по области, яд на 3 сек и замедление на 20%.',
        cast(h, p) {
          const dmg = D(h, 40, 6, 0, 0.3), tick = D(h, 10, 1.6, 0, 0.09); SFX.at('hex', h.x, h.z, 0.5); SFX.at('poison', h.x, h.z, 0.6); castGlow(h, 0xa6ff3d);
          shot(h, {
            dir: p.dir, speed: 22, range: 14, w: 1.0, mesh: 'orb', color: 0xa6ff3d, size: 1.1, onHit() { },
            trail: q => FX.flame(q.x, q.y, q.z, { n: 2, color: 0xd8ff8a, color2: 0x143800, size: [0.8, 1.7], life: [0.35, 0.75], up: -0.5, a: 0.45 }),
            onEnd: (x, z) => {
              FX.explosion(x, z, 2.6, 0xa6ff3d, { el: 'toxic', color2: 0x1e4a00 }); SFX.at('poison', x, z, 1); SFX.at('water', x, z, 0.4);
              for (const e of enemiesIn(h, x, z, 2.6)) { damage(h, e, dmg, 1); poison(h, e, tick, 6); slow(h, e, 0.2, 3, 'rot'); }
            }
          });
        }
      },
      {
        key: 'W', name: 'Жатва душ', icon: 'soul', cd: 10, cost: 60, range: 9.5, ind: { type: 'target' }, ai: { t: 'target' },
        desc: '2.5 сек вытягивает жизнь из цели: урон каждые полсекунды и лечение Морга. Связь рвётся на большой дистанции.',
        cast(h, p) {
          const t = p.unit, tick = D(h, 18, 3, 0, 0.14), c0 = hexRGB(0xd8ff8a), c1 = hexRGB(0x2a7a00); SFX.at('necro', h.x, h.z, 0.7); SFX.at('blood', t.x, t.z, 0.6); castGlow(h, 0xa6ff3d);
          const b = addBuff(t, {
            id: 'drain' + h.id, dur: 2.55, every: 0.5, src: h, onTick: (u, bb) => {
              if (!h.alive || udist(h, u) > 13.5) { bb.dead = true; return; }
              const d = damage(h, u, tick, 1); heal(h, h, d * (u.kind === 'hero' ? 0.75 : 0.35)); SFX.at('blood', u.x, u.z, 0.3); FX.hit(u.x, 1.3, u.z, 0xa6ff3d); FX.implode(h.x, 1.3, h.z, 2.5, { n: 6, color: 0xa6ff3d, color2: 0xffffff, life: 0.35, streak: true });
            }
          });
          if (b) G.actors.push({ update(dt) { if (b.dead || b.dur <= 0 || !t.alive || !h.alive) return false; FX.beam(t.x, t.z, h.x, h.z, { color: 0xa6ff3d, w: 0.9 + Math.random() * 0.5, life: 0.08, y: 1.4, op: 0.8 }); if (Math.random() < dt * 40) { const l = 0.4, sx = t.x + rand(-0.5, 0.5), sz = t.z + rand(-0.5, 0.5); FX.st.emit(sx, 1.4, sz, (h.x - sx) / l, 0, (h.z - sz) / l, l, 0.14, 0.05, c0, c1, 0, 0); } return true; } });
        }
      },
      { key: 'E', name: 'Чумная сила', icon: 'plague', passive: true, desc: 'Пассивно: +10 / 20 / 30 / 40 силы умений и +1.5 / 3 / 4.5 / 6 маны в секунду.', stats: l => ({ ap: 10 * l, manaRegen: 1.5 * l }) },
      {
        key: 'R', name: 'Мор', icon: 'miasma', cd: 80, cost: 100, range: 0, ind: { type: 'self', r: 11 }, anim: 'slam', animDur: 0.7, ai: { t: 'nova', r: 9, ult: true, hp: 0.8 },
        desc: 'Волна чумы расходится вокруг: урон, безмолвие на 2 сек и сильный яд. Морг лечится за каждого задетого героя.',
        cast(h) {
          const dmg = D(h, 120, 16, 0, 0.5), tick = D(h, 14, 2, 0, 0.07);
          FX.ring(h.x, h.z, { r0: 0.5, r1: 11, color: 0xa6ff3d, life: 0.6, tex: 'shock' }); FX.ring(h.x, h.z, { r0: 0.5, r1: 11, color: 0x3a7a10, life: 0.8, tex: 'disc', op: 0.8 });
          FX.ring(h.x, h.z, { r0: 2, r1: 10.5, color: 0xa6ff3d, life: 1.4, tex: 'swirl', spin: 3 }); FX.pillar(h.x, h.z, { r: 2.5, h: 13, color: 0xa6ff3d, life: 0.7 });
          FX.flame(h.x, 0.7, h.z, { n: 46, color: 0xd8ff8a, color2: 0x143800, speed: [8, 17], life: [0.5, 1], size: [1.6, 3.6], ring: true, drag: 1.4, up: 0.5, a: 0.4 }); FX.smoke(h.x, h.z, 6, 12, 0x1c2c0c); FX.scorch(h.x, h.z, 5);
          SFX.at('ultcue', h.x, h.z, 0.7); SFX.at('scythe', h.x, h.z, 1); SFX.at('necro', h.x, h.z, 0.9); SFX.at('poison', h.x, h.z, 0.6); FX.shake(0.5); FX.shock(h.x, h.z, 12, 1.1, 0.7);
          for (const e of enemiesIn(h, h.x, h.z, 11)) after(udist(h, e) / 22, () => {
            if (!e.alive) return; damage(h, e, dmg, 1); addBuff(e, { id: 'silence', dur: 2, silence: true }); poison(h, e, tick, 8, 'plague');
            FX.hit(e.x, 1.3, e.z, 0xa6ff3d, true); if (e.kind === 'hero') { heal(h, h, h.maxHp * 0.08); FX.heal(h, 0xa6ff3d); }
          });
        }
      }
    ]
  },
  /* ================= 10. Aisa ================= */
  {
    id: 'aisa', name: 'Айса', title: 'Ледяная провидица', role: 'mage', roleName: 'Маг', build: 'mage', bars: [3, 3, 5, 1], diffc: 2,
    lore: 'Замедляет, приковывает и замораживает. Буран делает любую драку её территорией.',
    look: { bulk: 0.88, robe: true, c1: 0x4a5d70, c2: 0x6e8496, c3: 0x2f3c4a, metal: 0xa9cfe6, glow: 0xbfefff, head: 'frost', hair: 0xdfe9f0, chest: 'tabard', sh: 'round', weapon: 'stafice', wc: 'staff', cape: 0x3c4c5c },
    stats: ST(565, 80, 440, 46, 47, 2.6, 20, 2.3, 0.7, 8.6, 9.5), projMesh: 'shard', atkSfx: 'ice',
    abilities: [
      {
        key: 'Q', name: 'Ледяное копьё', icon: 'icelance', cd: 5.5, cost: 50, range: 16, ind: { type: 'line', w: 1.8, fixed: true }, ai: { t: 'shot', sp: 30, farm: true },
        desc: 'Копьё замедляет на 35% на 2 сек. Уже замедленную холодом цель — обездвиживает на 1.1 сек.',
        cast(h, p) {
          const dmg = D(h, 66, 9, 0, 0.56); SFX.at('arcane', h.x, h.z, 0.5); SFX.at('ice', h.x, h.z, 0.7); castGlow(h, 0xbfefff);
          shot(h, {
            dir: p.dir, speed: 30, range: 16, w: 0.9, mesh: 'shard', color: 0xbfefff, size: 1.2,
            trail: q => { FX.flame(q.x, q.y, q.z, { n: 1, color: 0xe8f8ff, color2: 0x3a80b0, size: [0.6, 1.4], life: [0.3, 0.6], up: -0.6, a: 0.3 }); FX.sparks(q.x, q.y, q.z, { n: 1, color: 0xffffff, color2: 0x5ab8e8, speed: [0.5, 2], life: [0.3, 0.6], grav: -4, w: 0.07 }); },
            onHit: e => {
              damage(h, e, dmg, 1); if (hasBuff(e, 'chill')) { root(h, e, 1.1, 0xbfefff); FX.pillar(e.x, e.z, { r: 1.3, h: 5, color: 0xbfefff, life: 1.1 }); FX.debris(e.x, 0.4, e.z, { glow: true, n: 6, color: 0xdff4ff, speed: [1, 3], up: 5, size: [0.3, 0.7], life: 1.1 }); } else slow(h, e, 0.35, 2, 'chill');
              FX.explosion(e.x, e.z, 1.9, 0xbfefff, { el: 'ice' }); SFX.at('ice', e.x, e.z, 0.8); SFX.at('shatter', e.x, e.z, 0.5);
            }
          });
        }
      },
      {
        key: 'W', name: 'Морозная вспышка', icon: 'snow', cd: 11, cost: 60, range: 0, ind: { type: 'self', r: 5.5 }, lock: 0.1, ai: { t: 'nova', r: 4.6 },
        desc: 'Взрыв холода вокруг: урон, замедление на 45% и ледяной щит для Айсы на 3 сек.',
        cast(h) {
          const dmg = D(h, 52, 8, 0, 0.38);
          FX.explosion(h.x, h.z, 5.2, 0xbfefff, { el: 'ice' }); FX.ring(h.x, h.z, { r1: 5.5, color: 0xffffff, life: 0.5, tex: 'shock' }); FX.sparks(h.x, 0.8, h.z, { n: 36, color: 0xffffff, color2: 0x5ab8e8, speed: [10, 17], life: [0.2, 0.45], ring: true, grav: 0, drag: 3, w: 0.13 });
          FX.shock(h.x, h.z, 6.5, 0.8, 0.4); SFX.at('ice', h.x, h.z, 1); SFX.at('gust', h.x, h.z, 0.6); SFX.at('shield', h.x, h.z, 0.4);
          shield(h, h, D(h, 60, 10, 0, 0.4), 3, 0xbfefff);
          for (const e of enemiesIn(h, h.x, h.z, 5.5)) { damage(h, e, dmg, 1); slow(h, e, 0.45, 1.5, 'chill'); }
        }
      },
      {
        key: 'E', name: 'Ледяная гробница', icon: 'tomb', cd: 30, cost: 40, range: 0, ind: { type: 'self', r: 4.5 }, lock: 1.6, animDur: 1.6, ai: { t: 'panic', hp: 0.32 },
        desc: 'На 1.6 сек закрывается во льду: неуязвима, но не может действовать. Затем лёд взрывается, замедляя врагов.',
        cast(h) {
          const dmg = D(h, 48, 7, 0, 0.34); addBuff(h, { id: 'tomb', dur: 1.6, invuln: true }); h.order = null; h.path = null; SFX.at('ice', h.x, h.z, 1); SFX.at('chime', h.x, h.z, 0.4);
          const m = new THREE.Mesh(new THREE.OctahedronGeometry(1, 0), FX.mat(null, 0xbfefff, 0.5)); m.add(glowSprite(0xbfefff, 6));
          FX.add(m, 1.6, (k, me, dt, e) => { me.position.set(h.x, 1.7, h.z); me.scale.set(1.5, 2.6 * Math.min(1, e.t / 0.12), 1.5); me.rotation.y += dt * 0.6; me.material.opacity = 0.42 + Math.sin(e.t * 9) * 0.06; }, true);
          FX.ring(h.x, h.z, { r1: 2.6, color: 0xbfefff, life: 0.4, tex: 'shock' }); FX.debris(h.x, 0.3, h.z, { glow: true, n: 6, color: 0xdff4ff, speed: [1, 3], up: 5, size: [0.2, 0.5] });
          after(1.6, () => { if (!h.alive) return; FX.explosion(h.x, h.z, 4.5, 0xbfefff, { el: 'ice' }); FX.debris(h.x, 1.4, h.z, { glow: true, n: 14, color: 0xdff4ff, speed: [5, 12], up: 9, size: [0.3, 0.8] }); FX.shock(h.x, h.z, 6, 0.9, 0.4); SFX.at('shatter', h.x, h.z, 1); SFX.at('ice', h.x, h.z, 0.6); SFX.at('boom', h.x, h.z, 0.3); for (const e of enemiesIn(h, h.x, h.z, 4.5)) { damage(h, e, dmg, 1); slow(h, e, 0.4, 1.5, 'chill'); } });
        }
      },
      {
        key: 'R', name: 'Буран', icon: 'blizzard', cd: 85, cost: 100, range: 14, ind: { type: 'circle', r: 7.5 }, animDur: 0.8, ai: { t: 'point', delay: 0.3, ult: true, hp: 0.8, rad: 7.5 },
        desc: 'Буран на 5 сек: урон и замедление. Враг, простоявший в нём 2 сек, замерзает на 1.4 сек.',
        cast(h, p) {
          const dmg = D(h, 25, 4, 0, 0.115), x = p.x, z = p.z, cnt = {}, c0 = hexRGB(0xffffff), c1 = hexRGB(0x7ac8f0);
          FX.zone(x, z, 7.5, 0xbfefff, 5.1, { tex: 'swirl', spin: 2.2, op: 0.7 }); FX.zone(x, z, 7.5, 0xbfefff, 5.1, { tex: 'ring', spin: 0 }); FX.wall(x, z, 7.5, 0xbfefff, 5.1, { h: 6, op: 0.25, spin: 3 });
          FX.ring(x, z, { r1: 8, color: 0xffffff, life: 0.5, tex: 'shock' }); SFX.at('ultcue', h.x, h.z, 0.7); SFX.at('gust', x, z, 1); SFX.at('ice', x, z, 0.8); SFX.at('sand', x, z, 0.5);
          let t = 0, acc = 0;
          G.actors.push({ update(dt) { t += dt; acc += dt * 90; while (acc > 1) { acc--; const a = rand(TAU), r = Math.sqrt(Math.random()) * 7.5, sp = 11; FX.st.emit(x + Math.sin(a) * r, rand(0.3, 5.5), z + Math.cos(a) * r, Math.cos(a) * sp, rand(-1.5, 0.5), -Math.sin(a) * sp, rand(0.35, 0.7), 0.11, 0.05, c0, c1, 0, 0.4); if (Math.random() < 0.12) FX.pf.emit(x + Math.sin(a) * r, rand(0.5, 3), z + Math.cos(a) * r, Math.cos(a) * 4, 0.3, -Math.sin(a) * 4, rand(0.8, 1.5), 2.5, 4.5, c0, c1, 0, 0.3, 0.2); } return t < 5; } });
          zone(h, {
            x, z, r: 7.5, dur: 5, every: 0.5, first: true, tick: () => {
              SFX.at('gust', x, z, 0.3);
              for (const e of enemiesIn(h, x, z, 7.5)) {
                damage(h, e, dmg, 1); slow(h, e, 0.3, 0.8, 'chill'); cnt[e.id] = (cnt[e.id] || 0) + 1;
                if (cnt[e.id] === 4) { stun(h, e, 1.4); FX.pillar(e.x, e.z, { r: 1.5, h: 6, color: 0xbfefff, life: 1.4 }); FX.explosion(e.x, e.z, 2, 0xbfefff, { el: 'ice' }); SFX.at('ice', e.x, e.z, 0.8); SFX.at('shatter', e.x, e.z, 0.4); }
              }
            }
          });
        }
      }
    ]
  },
  /* ================= 11. Cassius ================= */
  {
    id: 'cassius', name: 'Кассий', title: 'Клинок зари', role: 'assassin', roleName: 'Дуэлянт', build: 'duel', bars: [4, 3, 2, 4], diffc: 3,
    lore: 'Мастер поединков. Выпад сквозь строй, рипост в нужный момент — и вихрь клинков в гуще боя.',
    look: { bulk: 1.0, c1: 0x5c2732, c2: 0x2a2a30, c3: 0x3a2a22, metal: 0xb89a55, glow: 0xff7aa8, head: 'duel', chest: 'vest', sh: 'cloth', legs: 'boots', weapon: 'rapier', wc: 'thrust', cape: 0x471c26 },
    stats: ST(630, 86, 270, 32, 61, 3.6, 28, 3.0, 0.86, 9.0, 2.7),
    abilities: [
      {
        key: 'Q', name: 'Выпад', icon: 'lunge', cd: 6.5, cost: 35, range: 8, ind: { type: 'line', w: 2.6 }, anim: 'thrust', ai: { t: 'gap', escape: true },
        desc: 'Рывок сквозь врагов с уроном каждому. Сбрасывает задержку атаки.',
        cast(h, p) {
          const dmg = D(h, 58, 8, 0.65), x0 = h.x, z0 = h.z; SFX.at('spear', h.x, h.z, 0.8); SFX.at('dash', h.x, h.z, 0.5);
          dashTo(h, p.x, p.z, 34, {
            w: 1.4, trail: u => FX.sparks(u.x, 1.1, u.z, { n: 1, color: 0xffd0e0, color2: 0xff3a70, speed: [1, 3], life: [0.2, 0.4], grav: -2, w: 0.09 }),
            onHit: (e, u) => { damage(u, e, dmg, 0); FX.hit(e.x, 1.3, e.z, 0xff7aa8, true); FX.slash(e.x, e.z, u.facing, { r: 2.6, color: 0xff7aa8 }); SFX.at('blade', e.x, e.z, 0.6); },
            onEnd: u => { u.atkCd = 0; FX.beam(x0, z0, u.x, u.z, { color: 0xff7aa8, w: 1.8, life: 0.35 }); FX.beam(x0, z0, u.x, u.z, { color: 0xffffff, w: 0.5, life: 0.2 }); }
          });
        }
      },
      {
        key: 'W', name: 'Рипост', icon: 'riposte', cd: 12, cost: 40, range: 0, ind: { type: 'self', r: 4 }, lock: 0, ai: { t: 'parry' },
        desc: '1.2 сек получает на 75% меньше урона, затем бьёт по кругу. Если за это время его ранили — враги оглушаются на 1 сек.',
        cast(h) {
          const dmg = D(h, 52, 8, 0.55), t0 = G.time; SFX.at('blade', h.x, h.z, 0.6); SFX.at('shield', h.x, h.z, 0.5); FX.ring(h.x, h.z, { r1: 2.4, color: 0xff7aa8, life: 0.3 });
          const b = addBuff(h, {
            id: 'riposte', dur: 1.2, dmgIn: 0.25, onEnd: u => {
              if (!u.alive) return; const took = u.lastDamageT >= t0;
              FX.slash(u.x, u.z, u.facing, { r: 4.3, color: 0xff7aa8, sweep: 3.2, life: 0.3 }); FX.slash(u.x, u.z, u.facing + Math.PI, { r: 4.3, color: 0xffffff, sweep: 3.2, life: 0.3 });
              FX.ring(u.x, u.z, { r1: 4.2, color: took ? 0xffffff : 0xff7aa8, life: 0.35, tex: 'shock' }); FX.sparks(u.x, 1.2, u.z, { n: 20, color: 0xffffff, color2: 0xff3a70, speed: [9, 16], life: [0.15, 0.35], ring: true, grav: 0, drag: 3 }); SFX.at('blade', u.x, u.z, 1); SFX.at('whoosh', u.x, u.z, 0.5);
              if (took) { FX.shake(0.35); FX.shock(u.x, u.z, 5, 0.8, 0.35); FX.glow(u.x, 1.4, u.z, 9, 0xffffff, 0.2, 'flare'); SFX.at('katana', u.x, u.z, 1); SFX.at('crit', u.x, u.z, 0.6); }
              for (const e of enemiesIn(u, u.x, u.z, 4)) { damage(u, e, dmg, 0); if (took) stun(u, e, 1.0); FX.hit(e.x, 1.3, e.z, 0xff7aa8, true); }
            }
          });
          b.fx = FX.bubble(h, 0xff7aa8, 1.2, 1.9);
        }
      },
      {
        key: 'E', name: 'Клинок ветра', icon: 'windblade', cd: 8, cost: 40, range: 12, ind: { type: 'line', w: 2.8, fixed: true }, anim: 'thrust', ai: { t: 'shot', sp: 30, farm: true },
        desc: 'Режущая волна пролетает сквозь врагов: урон и замедление на 25%.',
        cast(h, p) {
          const dmg = D(h, 50, 7, 0.55); SFX.at('blade', h.x, h.z, 0.7); SFX.at('gust', h.x, h.z, 0.7); FX.slash(h.x, h.z, p.dir, { r: 3, color: 0xff7aa8, life: 0.2 });
          shot(h, {
            dir: p.dir, speed: 30, range: 12, w: 1.4, pierce: true, mesh: false, color: 0xff7aa8, ribbon: 2.6,
            trail: q => { if ((q.tt = (q.tt || 0) + 1) % 2 === 0) FX.slash(q.x, q.z, q.dir, { r: 2.2, color: 0xff7aa8, sweep: 0.2, life: 0.16, y: 1.2 }); FX.sparks(q.x, 1.2, q.z, { n: 1, color: 0xffffff, color2: 0xff3a70, speed: [1, 4], life: [0.15, 0.3], grav: 0, w: 0.08 }); },
            onHit: e => { damage(h, e, dmg, 0); slow(h, e, 0.25, 1.2); FX.hit(e.x, 1.3, e.z, 0xff7aa8, true); SFX.at('slash', e.x, e.z, 0.5); }
          });
        }
      },
      {
        key: 'R', name: 'Вихрь клинков', icon: 'bladestorm', cd: 70, cost: 90, range: 0, ind: { type: 'self', r: 4.2 }, lock: 0, ai: { t: 'nova', r: 4, ult: true, hp: 0.85 },
        desc: '3.2 сек вращается, двигаясь на 30% быстрее и раня всех вокруг. Урон по героям лечит Кассия.',
        cast(h) {
          const dmg = D(h, 38, 6, 0.4); h.spinning = true; SFX.at('ultcue', h.x, h.z, 0.7); SFX.at('blade', h.x, h.z, 1); SFX.at('gust', h.x, h.z, 0.6);
          const b = addBuff(h, {
            id: 'whirl', dur: 3.25, ms: 0.3, every: 0.4, onEnd: u => { u.spinning = false; },
            onTick: u => {
              FX.slash(u.x, u.z, rand(TAU), { r: 4.5, color: 0xff7aa8, sweep: 3.5, life: 0.28 }); FX.slash(u.x, u.z, rand(TAU), { r: 3.5, color: 0xffffff, sweep: 3.5, life: 0.22, y: 1.6 });
              FX.sparks(u.x, 1.2, u.z, { n: 10, color: 0xffd0e0, color2: 0xff3a70, speed: [10, 16], life: [0.15, 0.3], ring: true, grav: 0, drag: 3 }); SFX.at('blade', u.x, u.z, 0.45);
              for (const e of enemiesIn(u, u.x, u.z, 4.2)) { const d = damage(u, e, dmg, 0); FX.hit(e.x, 1.3, e.z, 0xff7aa8); if (e.kind === 'hero') heal(u, u, d * 0.3, true); }
            }
          });
          b.fx = FX.aura(h, 0xff7aa8, 3.25, 4.2, 'swirl', 9);
        }
      }
    ]
  },
  /* ================= 12. Zar ================= */
  {
    id: 'zar', name: 'Зар', title: 'Пожиратель пустоты', role: 'mage', roleName: 'Маг', build: 'mage', bars: [4, 1, 4, 3], diffc: 3,
    lore: 'Искажает пространство. Сингулярность стягивает врагов в одну точку — под удар всей команды.',
    look: { bulk: 0.9, robe: true, c1: 0x1c1526, c2: 0x2d203f, c3: 0x100c18, glow: 0xff3df0, head: 'void', chest: 'robe', sh: 'spike', weapon: 'claws', wc: 'orb', orbit: 4, cape: 0x140f1c },
    stats: ST(555, 78, 450, 47, 47, 2.6, 19, 2.2, 0.68, 8.6, 9.5), projMesh: 'orb', atkSfx: 'void',
    abilities: [
      {
        key: 'Q', name: 'Сфера пустоты', icon: 'voidorb', cd: 6, cost: 55, range: 14, ind: { type: 'line', w: 2.6, fixed: true }, ai: { t: 'shot', sp: 15, farm: true },
        desc: 'Медленная сфера ранит всех на пути и взрывается в конце.',
        cast(h, p) {
          const dmg = D(h, 50, 7, 0, 0.4); SFX.at('warp', h.x, h.z, 0.6); SFX.at('void', h.x, h.z, 0.5); castGlow(h, 0xff3df0);
          shot(h, {
            dir: p.dir, speed: 15, range: 14, w: 1.3, pierce: true, mesh: 'orb', color: 0xff3df0, size: 1.7,
            trail: q => { FX.implode(q.x, q.y, q.z, 2.2, { n: 2, color: 0xff3df0, color2: 0x4a0a8a, life: 0.3, streak: true }); FX.flame(q.x, q.y, q.z, { n: 1, color: 0x8a2aff, color2: 0x100020, size: [1.4, 2.4], life: [0.4, 0.7], up: 0, a: 0.5 }); },
            onHit: e => { damage(h, e, dmg, 1); FX.hit(e.x, 1.3, e.z, 0xff3df0, true); },
            onEnd: (x, z) => { FX.explosion(x, z, 3.2, 0xff3df0, { el: 'void', color2: 0x4a0a8a }); SFX.at('void', x, z); SFX.at('dark', x, z, 0.5); for (const e of enemiesIn(h, x, z, 3.2)) damage(h, e, dmg, 1); }
          });
        }
      },
      {
        key: 'W', name: 'Разрыв', icon: 'rift', cd: 12, cost: 50, range: 8.5, ind: { type: 'circle', r: 1.2 }, lock: 0.05, ai: { t: 'escape' },
        desc: 'Телепорт в точку. На месте ухода остаётся разрыв, который взрывается через 0.6 сек: урон и замедление.',
        cast(h, p) {
          const dmg = D(h, 60, 9, 0, 0.45), x0 = h.x, z0 = h.z;
          telegraph(h, x0, z0, 3, 0.6, 0xff3df0); FX.zone(x0, z0, 3, 0xff3df0, 0.6, { tex: 'swirl', spin: 10 }); FX.implode(x0, 1.2, z0, 3.5, { n: 22, color: 0xff3df0, color2: 0x4a0a8a, life: 0.5, streak: true });
          blink(h, p.x, p.z); FX.beam(x0, z0, h.x, h.z, { color: 0xff3df0, w: 1.3, life: 0.4 }); FX.explosion(h.x, h.z, 1.8, 0xff3df0, { el: 'void' }); SFX.at('blink', h.x, h.z, 0.8); SFX.at('warp', x0, z0, 0.6);
          after(0.6, () => { FX.explosion(x0, z0, 3, 0xff3df0, { el: 'void', color2: 0x4a0a8a }); SFX.at('void', x0, z0, 0.8); SFX.at('boom', x0, z0, 0.5); for (const e of enemiesIn(h, x0, z0, 3)) { damage(h, e, dmg, 1); slow(h, e, 0.3, 1.5); } });
        }
      },
      { key: 'E', name: 'Голод пустоты', icon: 'voidmaw', passive: true, desc: 'Пассивно: умения лечат Зара на 4 / 8 / 12 / 16% нанесённого урона, +8 / 16 / 24 / 32 силы умений.', stats: l => ({ omni: 0.04 * l, ap: 8 * l }) },
      {
        key: 'R', name: 'Сингулярность', icon: 'singularity', cd: 85, cost: 100, range: 14, ind: { type: 'circle', r: 7 }, animDur: 0.8, lock: 0.3, ai: { t: 'point', delay: 0.2, ult: true, hp: 0.8, rad: 6 },
        desc: 'Чёрная дыра 2.6 сек стягивает врагов к центру и ранит их, затем схлопывается с мощным взрывом.',
        cast(h, p) {
          const dmg = D(h, 22, 3, 0, 0.1), fin = D(h, 130, 18, 0, 0.6), x = p.x, z = p.z; SFX.at('ultcue', h.x, h.z, 0.8); SFX.at('void', x, z, 1); SFX.at('warp', x, z, 0.8); castGlow(h, 0xff3df0);
          const core = new THREE.Mesh(FX.geo.sphere, new THREE.MeshBasicMaterial({ color: 0x050008 })); core.add(glowSprite(0xff3df0, 8));
          FX.add(core, 2.6, (k, me, dt, e) => { me.position.set(x, 2, z); me.scale.setScalar(Math.min(1.5, e.t * 6) * (1 + Math.sin(e.t * 20) * 0.05)); });
          FX.zone(x, z, 7, 0xff3df0, 2.6, { tex: 'swirl', spin: -7 }); FX.zone(x, z, 4, 0xb060ff, 2.6, { tex: 'swirl', spin: -12, y: 0.2 }); FX.zone(x, z, 7, 0xff3df0, 2.6, { tex: 'ring', spin: 0 });
          let t = 0, acc = 0, tick = 0, sw = 0;
          G.actors.push({
            update(dt) {
              t += dt; acc += dt; tick += dt; sw += dt;
              while (acc > 0.025) { acc -= 0.025; FX.implode(x, 2, z, 7.5, { n: 2, color: 0xff3df0, color2: 0x7a2aff, life: 0.5, streak: true }); }
              if (sw > 0.5) { sw = 0; FX.shock(x, z, 7, -0.7, 0.5); FX.ring(x, z, { r0: 7, r1: 0.5, color: 0xb060ff, life: 0.5, tex: 'shock', op: 0.6 }); }
              for (const e of enemiesIn(h, x, z, 7)) {
                if (e.boss) continue; const d = dist(e.x, e.z, x, z); if (d > 0.6) { const st = Math.min(d - 0.5, 3.6 * dt), nx = e.x + (x - e.x) / d * st, nz = e.z + (z - e.z) / d * st; if (NAV.ok(nx, nz)) { e.x = nx; e.z = nz; } }
              }
              if (tick >= 0.4) { tick -= 0.4; for (const e of enemiesIn(h, x, z, 7)) damage(h, e, dmg, 1); FX.shake(0.12); SFX.at('warp', x, z, 0.3); }
              if (t >= 2.6) {
                FX.explosion(x, z, 6, 0xff3df0, { el: 'void', color2: 0x4a0a8a }); FX.explosion(x, z, 3.5, 0xffffff, { smoke: false }); FX.ring(x, z, { r0: 1, r1: 12, color: 0xff3df0, life: 0.7, tex: 'shock' });
                FX.sparks(x, 2, z, { n: 40, color: 0xffffff, color2: 0xff3df0, speed: [8, 24], life: [0.3, 0.8], grav: -4 }); FX.shock(x, z, 13, 1.6, 0.7); FX.punch(1.3);
                FX.shake(0.9); SFX.at('bigboom', x, z); SFX.at('void', x, z, 0.8); SFX.at('shatter', x, z, 0.4);
                for (const e of enemiesIn(h, x, z, 5)) damage(h, e, fin, 1);
                return false;
              }
              return true;
            }
          });
        }
      }
    ]
  },
  /* ================= 13. Grimm ================= */
  {
    id: 'grimm', name: 'Гримм', title: 'Цепной тюремщик', role: 'front', roleName: 'Танк', build: 'tank', bars: [2, 5, 5, 1], diffc: 2,
    lore: 'Вытаскивает жертву крюком из-за спин союзников и не отпускает. Медленный, но от него не уйти.',
    look: { bulk: 1.4, h: 1.06, c1: 0x3a3d42, c2: 0x2a2c30, c3: 0x5a3a26, metal: 0x5a5e66, glow: 0x2fd6c0, head: 'warden', chest: 'plate', sh: 'spike', legs: 'greaves', weapon: 'hook', wc: 'melee', back: 'chains' },
    stats: ST(770, 102, 290, 36, 54, 3.1, 38, 3.9, 0.66, 8.4, 2.8),
    abilities: [
      {
        key: 'Q', name: 'Крюк', icon: 'hook', cd: 12, cost: 55, range: 13.5, ind: { type: 'line', w: 2, fixed: true }, anim: 'thrust', lock: 0.3, ai: { t: 'shot', sp: 30 },
        desc: 'Бросает крюк: первый враг на пути притягивается к Гримму, получает урон и оглушается.',
        cast(h, p) {
          const dmg = D(h, 60, 10, 0.4); SFX.at('chain', h.x, h.z, 0.9); SFX.at('whoosh', h.x, h.z, 0.5);
          shot(h, {
            dir: p.dir, speed: 30, range: 13.5, w: 1.0, mesh: 'hook', color: 0x2fd6c0, size: 1.4, ribbon: 0.9,
            trail: q => FX.sparks(q.x, q.y, q.z, { n: 1, color: 0xc8fff5, color2: 0x0a6a5a, speed: [1, 3], life: [0.2, 0.4], grav: -5, w: 0.08 }),
            onHit: e => {
              damage(h, e, dmg, 0); FX.explosion(e.x, e.z, 1.8, 0x2fd6c0, { smoke: false }); SFX.at('spear', e.x, e.z, 0.8); SFX.at('flesh', e.x, e.z, 0.5); SFX.at('chain', e.x, e.z, 0.7);
              const t = pullTo(e, h.x, h.z, 30, 2.6); stun(h, e, t + 0.5); let el = 0;
              G.actors.push({ update(dt) { el += dt; if (!e.alive || !h.alive || el > t + 0.15) return false; FX.beam(h.x, h.z, e.x, e.z, { color: 0x2fd6c0, w: 0.7, life: 0.06, y: 1.3 }); FX.sparks(e.x, 0.3, e.z, { n: 1, color: 0xc8fff5, color2: 0x0a6a5a, speed: [1, 4], life: [0.2, 0.4], w: 0.08 }); return true; } });
            }
          });
        }
      },
      {
        key: 'W', name: 'Тяжёлые цепи', icon: 'chain', cd: 10, cost: 45, range: 0, ind: { type: 'self', r: 5 }, anim: 'slam', animDur: 0.5, lock: 0.25, ai: { t: 'nova', r: 4.2, farm: true },
        desc: 'Цепи хлещут вокруг: урон и замедление на 45% на 1.5 сек. Гримм получает +20 защиты на 3 сек.',
        cast(h) {
          const dmg = D(h, 55, 9, 0.45); addBuff(h, { id: 'chains', dur: 3, def: 20 }); SFX.at('chain', h.x, h.z, 1); SFX.at('whip', h.x, h.z, 0.8); SFX.at('mace', h.x, h.z, 0.5);
          FX.ring(h.x, h.z, { r1: 5, color: 0x2fd6c0, life: 0.4, tex: 'shock' }); FX.slash(h.x, h.z, h.facing, { r: 5.1, color: 0x2fd6c0, sweep: 5, life: 0.35, y: 0.7 }); FX.scorch(h.x, h.z, 3.4, 0x2fd6c0, 5); FX.shock(h.x, h.z, 6, 0.7, 0.35);
          FX.debris(h.x, 0.3, h.z, { n: 8, color: 0x3a3d42, speed: [3, 8], up: 8, rad: 2 }); FX.sparks(h.x, 0.5, h.z, { n: 20, color: 0xc8fff5, color2: 0x0a6a5a, speed: [6, 14], life: [0.2, 0.5], ring: true, up: 3 });
          for (const e of enemiesIn(h, h.x, h.z, 5)) { damage(h, e, dmg, 0); slow(h, e, 0.45, 1.5); FX.beam(h.x, h.z, e.x, e.z, { color: 0x2fd6c0, w: 0.6, life: 0.3, y: 0.8 }); FX.hit(e.x, 1.2, e.z, 0x2fd6c0, true); }
        }
      },
      { key: 'E', name: 'Железная хватка', icon: 'grip', passive: true, desc: 'Пассивно: +70 / 140 / 210 / 280 здоровья и +3 / 6 / 9 / 12 здоровья в секунду.', stats: l => ({ hp: 70 * l, hpRegen: 3 * l }) },
      {
        key: 'R', name: 'Приговор', icon: 'shackle', cd: 80, cost: 100, range: 0, ind: { type: 'self', r: 7.5 }, anim: 'slam', animDur: 0.7, lock: 0.3, ai: { t: 'nova', r: 6, ult: true, hp: 0.75 },
        desc: 'Приковывает вражеских героев рядом и замедляет их. Через 1.6 сек те, кто не разорвал цепь, получают большой урон и оглушаются на 1.5 сек.',
        cast(h) {
          const dmg = D(h, 170, 24, 0.6), vict = enemiesIn(h, h.x, h.z, 7.5, true); SFX.at('ultcue', h.x, h.z, 0.7); SFX.at('chain', h.x, h.z, 1); SFX.at('bell', h.x, h.z, 0.7);
          FX.zone(h.x, h.z, 9, 0x2fd6c0, 1.6, { follow: h, tex: 'rune2', spin: 3, op: 0.7 }); FX.wall(h.x, h.z, 9, 0x2fd6c0, 1.6, { follow: h, h: 3.5, op: 0.3 }); FX.ring(h.x, h.z, { r1: 7.5, color: 0x2fd6c0, life: 0.5, tex: 'shock' }); FX.pillar(h.x, h.z, { r: 2, h: 12, color: 0x2fd6c0, life: 0.6 });
          for (const e of vict) slow(h, e, 0.3, 1.6, 'verdict');
          let t = 0;
          G.actors.push({
            update(dt) {
              t += dt; if (!h.alive) return false;
              for (const e of vict) if (e.alive && udist(h, e) < 9.5) FX.beam(h.x, h.z, e.x, e.z, { color: 0x2fd6c0, w: 0.6 + Math.random() * 0.4, life: 0.06, y: 1.2 });
              if (t < 1.6) return true;
              for (const e of vict) if (e.alive && udist(h, e) < 9.5) { damage(h, e, dmg, 0); stun(h, e, 1.5); FX.explosion(e.x, e.z, 3, 0x2fd6c0, { el: 'earth', rock: 0x3a3d42 }); FX.pillar(e.x, e.z, { r: 1.4, h: 10, color: 0x2fd6c0, life: 0.6 }); }
              FX.shake(0.7); FX.shock(h.x, h.z, 10, 1.1, 0.5); FX.punch(0.9); SFX.at('mace', h.x, h.z, 1); SFX.at('chain', h.x, h.z, 0.8); SFX.at('quake', h.x, h.z, 0.6);
              return false;
            }
          });
        }
      }
    ]
  },
  /* ================= 14. Ragna ================= */
  {
    id: 'ragna', name: 'Рагна', title: 'Кровавая секира', role: 'front', roleName: 'Берсерк', build: 'bruiser', bars: [4, 3, 2, 4], diffc: 2,
    lore: 'Чем меньше у неё здоровья, тем опаснее. Бессмертная ярость позволяет драться до последнего.',
    look: { bulk: 1.16, h: 1.04, c1: 0x5a3024, c2: 0x3a2a22, c3: 0x5a4a3a, skin: 0x9a7560, metal: 0x6a6a70, glow: 0xff3344, head: 'berserk', hair: 0x8a2a1a, chest: 'bare', sh: 'fur', legs: 'boots', weapon: 'axes', wc: 'dual' },
    stats: ST(660, 90, 260, 30, 63, 3.7, 27, 3.0, 0.78, 8.9, 2.7),
    abilities: [
      {
        key: 'Q', name: 'Бросок секиры', icon: 'axe', cd: 7, cost: 35, range: 11, ind: { type: 'line', w: 2.2, fixed: true }, anim: 'thrust', ai: { t: 'shot', sp: 26, farm: true },
        desc: 'Секира летит сквозь врагов и возвращается, раня на обратном пути и замедляя на 30%.',
        cast(h, p) {
          const dmg = D(h, 50, 8, 0.6); SFX.at('whoosh', h.x, h.z, 0.8); SFX.at('axe', h.x, h.z, 0.4);
          const fx = e => { FX.hit(e.x, 1.3, e.z, 0xff3344, true); FX.sparks(e.x, 1.3, e.z, { n: 6, color: 0xff8a90, color2: 0x8a0010, speed: [3, 9], life: [0.2, 0.5] }); SFX.at('axe', e.x, e.z, 0.7); SFX.at('flesh', e.x, e.z, 0.35); };
          shot(h, {
            dir: p.dir, speed: 26, range: 11, w: 1.1, pierce: true, mesh: 'axe', color: 0xff3344, size: 1.2, spin: 28, onHit: e => { damage(h, e, dmg, 0); fx(e); },
            onEnd: (x, z) => { if (!h.alive) return; shot(h, { x, z, dir: angTo(x, z, h.x, h.z), speed: 30, range: dist(x, z, h.x, h.z) + 0.5, w: 1.1, pierce: true, mesh: 'axe', color: 0xff3344, size: 1.2, spin: -28, onHit: e => { damage(h, e, dmg * 0.6, 0); slow(h, e, 0.3, 1); fx(e); } }); }
          });
        }
      },
      {
        key: 'W', name: 'Жажда крови', icon: 'bloodthirst', cd: 12, cost: 35, range: 0, ind: { type: 'self', r: 2 }, lock: 0, ai: { t: 'buff' },
        desc: 'На 5 сек: +35% скорости атаки, каждая атака наносит бонусный урон и лечит Рагну.',
        cast(h) {
          const bonus = D(h, 10, 2, 0.1), hl = D(h, 8, 1.2, 0.12);
          const b = addBuff(h, { id: 'bloodlust', dur: 5, as: 0.35, onHit: (u, t) => { heal(u, u, hl * (t.kind === 'hero' ? 1 : 0.5), true); FX.sparks(t.x, 1.3, t.z, { n: 4, color: 0xff8a90, color2: 0x8a0010, speed: [2, 7], life: [0.2, 0.45] }); SFX.at('blood', t.x, t.z, 0.3); return bonus; } });
          b.fx = FX.aura(h, 0xff3344, 5, 1.6, 'rune2', 5); FX.ring(h.x, h.z, { r1: 3.5, color: 0xff3344, life: 0.4, tex: 'shock' }); FX.flame(h.x, 1, h.z, { n: 10, color: 0xff3344, color2: 0x3a0008, size: [1, 2.2], up: 4 }); SFX.at('heartbeat', h.x, h.z, 0.8); SFX.at('blood', h.x, h.z, 0.6); SFX.at('roar', h.x, h.z, 0.4);
        }
      },
      {
        key: 'E', name: 'Прыжок берсерка', icon: 'leap', cd: 11, cost: 40, range: 8, ind: { type: 'circle', r: 3.2 }, anim: 'slam', animDur: 0.5, ai: { t: 'gap', rad: 3.2 },
        desc: 'Прыжок в точку: урон по области и замедление на 35%.',
        cast(h, p) {
          const dmg = D(h, 55, 8, 0.5), q = NAV.nearest(p.x, p.z); SFX.at('dash', h.x, h.z, 0.6); SFX.at('roar', h.x, h.z, 0.5); FX.smoke(h.x, h.z, 1, 3, 0x3a2a22);
          dashTo(h, q.x, q.z, 25, {
            fly: true, arc: 3, onEnd: u => {
              FX.explosion(u.x, u.z, 3.2, 0xff3344, { el: 'earth', rock: 0x4a3a30 }); FX.slash(u.x, u.z, u.facing, { r: 3.4, color: 0xff3344, sweep: 4, life: 0.3, y: 0.6 }); FX.shake(0.4); SFX.at('axe', u.x, u.z, 1); SFX.at('quake', u.x, u.z, 0.5); SFX.at('stone', u.x, u.z, 0.4);
              for (const e of enemiesIn(u, u.x, u.z, 3.2)) { damage(u, e, dmg, 0); slow(u, e, 0.35, 1.2); }
            }
          });
        }
      },
      {
        key: 'R', name: 'Бессмертная ярость', icon: 'fury', cd: 85, cost: 0, range: 0, ind: { type: 'self', r: 2 }, lock: 0, ai: { t: 'panic', hp: 0.35 },
        desc: '5 сек Рагна не может умереть, атакует быстрее и сильнее. В конце восстанавливает 12% здоровья.',
        cast(h) {
          const c0 = hexRGB(0xff8a90), c1 = hexRGB(0x5a0008);
          const b = addBuff(h, { id: 'undying', dur: 5, undying: true, as: 0.25, ad: 18 + h.level * 2, ms: 0.15, onEnd: u => { if (!u.alive) return; heal(u, u, u.maxHp * 0.12); FX.heal(u, 0xff3344); FX.ring(u.x, u.z, { r1: 4, color: 0xff3344, life: 0.5, tex: 'shock' }); SFX.at('heartbeat', u.x, u.z, 0.6); SFX.at('heal', u.x, u.z, 0.5); } });
          b.fx = FX.aura(h, 0xff3344, 5, 2.2, 'swirl', 8); FX.explosion(h.x, h.z, 3.5, 0xff3344, { smoke: false }); FX.pillar(h.x, h.z, { r: 2, h: 16, color: 0xff3344, life: 0.8 }); FX.shock(h.x, h.z, 7, 1, 0.5); FX.punch(0.8); FX.shake(0.5);
          SFX.at('ultcue', h.x, h.z, 0.7); SFX.at('roar', h.x, h.z, 1); SFX.at('heartbeat', h.x, h.z, 0.8); SFX.at('blood', h.x, h.z, 0.6); let t = 0;
          G.actors.push({ update(dt) { t += dt; if (!h.alive || t > 5) return false; if (Math.random() < dt * 40) FX.pf.emit(h.x + rand(-0.7, 0.7), rand(0.4, 2.2), h.z + rand(-0.7, 0.7), rand(-0.5, 0.5), rand(2, 5), rand(-0.5, 0.5), rand(0.3, 0.6), 0.9, 1.9, c0, c1, 0, 1, 0.5); return true; } });
        }
      }
    ]
  },
  /* ================= 15. Yuki ================= */
  {
    id: 'yuki', name: 'Юки', title: 'Лунная лиса', role: 'assassin', roleName: 'Убийца', build: 'apsin', bars: [4, 2, 3, 5], diffc: 3,
    lore: 'Очаровывает жертву и танцует вокруг неё. Три рывка ультимейта — и добыче некуда бежать.',
    look: { bulk: 0.82, c1: 0x3a2f4a, c2: 0x2a2236, c3: 0x5a2a3a, skin: 0x8a7462, glow: 0x9f8cff, head: 'fox', hair: 0x2a2430, chest: 'robe', sh: 'cloth', legs: 'boots', weapon: 'spirit', wc: 'orb', back: 'tails', orbit: 3, orbitShape: 'orb' },
    stats: ST(585, 80, 360, 40, 50, 2.8, 23, 2.6, 0.76, 9.2, 8.5), projMesh: 'orb', atkSfx: 'cast',
    abilities: [
      {
        key: 'Q', name: 'Лисий огонь', icon: 'foxfire', cd: 6, cost: 50, range: 0, ind: { type: 'self', r: 9.5 }, lock: 0.1, ai: { t: 'nova', r: 8.5, farm: true },
        desc: 'Три огонька сами находят ближайших врагов (сначала героев). Повторные попадания по одной цели слабее.',
        cast(h) {
          const es = enemiesIn(h, h.x, h.z, 9.5); if (!es.length) return false; es.sort(byHeroDist(h));
          const dmg = D(h, 46, 7, 0, 0.36), cnt = {}, n = Math.min(3, es.length); SFX.at('spirit', h.x, h.z, 0.7); SFX.at('ember', h.x, h.z, 0.4); castGlow(h, 0x9f8cff);
          for (let i = 0; i < 3; i++) {
            const t = es[i % n], a = h.facing + (i - 1) * 1.3;
            after(i * 0.08, () => { if (!t.alive || !h.alive) return; homing(h, t, { x: h.x + Math.sin(a) * 1.3, z: h.z + Math.cos(a) * 1.3, y: 2.2, speed: 21, color: 0x9f8cff, size: 0.55, mesh: 'orb', onHit: tt => { damage(h, tt, dmg * (cnt[tt.id] ? 0.55 : 1), 1); cnt[tt.id] = 1; FX.hit(tt.x, 1.3, tt.z, 0x9f8cff, true); FX.flame(tt.x, 1.2, tt.z, { n: 4, color: 0xcfc4ff, color2: 0x2a1a7a, size: [0.8, 1.6], up: 2 }); SFX.at('ember', tt.x, tt.z, 0.45); } }); });
          }
        }
      },
      {
        key: 'W', name: 'Очарование', icon: 'charmheart', cd: 13, cost: 65, range: 12, ind: { type: 'line', w: 2, fixed: true }, ai: { t: 'shot', sp: 26 },
        desc: 'Первый враг на пути очарован на 1.3 сек: идёт к Юки и получает на 15% больше урона.',
        cast(h, p) {
          const dmg = D(h, 50, 8, 0, 0.4), c0 = hexRGB(0xffc4f0), c1 = hexRGB(0x9f8cff); SFX.at('arcane', h.x, h.z, 0.6); SFX.at('ghost', h.x, h.z, 0.3); castGlow(h, 0x9f8cff);
          shot(h, {
            dir: p.dir, speed: 26, range: 12, w: 1.0, mesh: 'orb', color: 0xd9a8ff, size: 1.0, trail: q => FX.sparks(q.x, q.y, q.z, { n: 1, color: 0xffc4f0, color2: 0x9f8cff, speed: [0.5, 2], life: [0.3, 0.6], grav: 2, w: 0.09, stretch: 0.03 }),
            onHit: e => {
              damage(h, e, dmg, 1); const b = addBuff(e, { id: 'charm', dur: 1.3, stun: true, dmgIn: 1.15 }); FX.explosion(e.x, e.z, 1.8, 0xd9a8ff, { smoke: false }); SFX.at('chime', e.x, e.z, 0.9); SFX.at('heartbeat', e.x, e.z, 0.5);
              if (b) G.actors.push({ update(dt) { if (b.dur <= 0 || !e.alive || !h.alive) return false; const d = udist(h, e); if (d > 2 && !e.boss) { const st = 2.6 * dt, nx = e.x + (h.x - e.x) / d * st, nz = e.z + (h.z - e.z) / d * st; if (NAV.ok(nx, nz)) { e.x = nx; e.z = nz; e.facing = angTo(e.x, e.z, h.x, h.z); } } if (Math.random() < dt * 14) FX.ps.emit(e.x + rand(-0.5, 0.5), e.height, e.z + rand(-0.5, 0.5), 0, 2, 0, 0.6, 0.45, 0.05, c0, c1, 0, 0, 1); return true; } });
            }
          });
        }
      },
      {
        key: 'E', name: 'Шаг духа', icon: 'spiritstep', cd: 9, cost: 40, range: 7, ind: { type: 'circle', r: 1 }, lock: 0, ai: { t: 'gap', escape: true },
        desc: 'Рывок в точку и +30% скорости на 1.5 сек.',
        cast(h, p) {
          SFX.at('spirit', h.x, h.z, 0.6); SFX.at('dash', h.x, h.z, 0.5); FX.ring(h.x, h.z, { r1: 2, color: 0x9f8cff, life: 0.3 }); FX.flame(h.x, 1, h.z, { n: 6, color: 0xcfc4ff, color2: 0x2a1a7a, size: [0.8, 1.6], up: 1 });
          dashTo(h, p.x, p.z, 34, { trail: u => FX.sparks(u.x, 1, u.z, { n: 1, color: 0xffffff, color2: 0x9f8cff, speed: [0.5, 2], life: [0.25, 0.5], grav: 1, w: 0.09 }), onEnd: u => FX.ring(u.x, u.z, { r1: 2, color: 0x9f8cff, life: 0.3 }) });
          addBuff(h, { id: 'spirit', dur: 1.5, ms: 0.3 });
        }
      },
      {
        key: 'R', name: 'Лунный танец', icon: 'moon', cd: 75, cost: 100, range: 7, ind: { type: 'circle', r: 1.2 }, lock: 0, ai: { t: 'gap', ult: true, hp: 0.6, re: true },
        desc: 'Три рывка за 8 сек (нажимайте R повторно). После каждого духовные стрелы бьют до трёх ближайших врагов, сначала героев.',
        free: h => !!(h.moon && h.moon.n > 0 && G.time < h.moon.until),
        cast(h, p) {
          const full = this.cd * 100 / (100 + h.haste), dmg = D(h, 52, 8, 0, 0.27);
          if (!(h.moon && h.moon.n > 0 && G.time < h.moon.until)) {
            h.moon = { n: 3, until: G.time + 8 }; const fx = FX.aura(h, 0x9f8cff, 8, 1.8, 'rune', 5); FX.pillar(h.x, h.z, { r: 1.8, h: 14, color: 0x9f8cff, life: 0.6 }); SFX.at('ultcue', h.x, h.z, 0.8); SFX.at('spirit', h.x, h.z, 0.9); SFX.at('yip', h.x, h.z, 0.6); SFX.at('chime', h.x, h.z, 0.5);
            G.actors.push({ update() { const m = h.moon; if (m && h.alive && G.time <= m.until && m.n > 0) return true; if (m && m.n > 0) h.cd[3] = full * 0.85; if (m && (m.n > 0 || !h.alive)) h.moon = null; fx.dead = true; return false; } });
          }
          const m = h.moon; m.n--; const last = m.n <= 0; SFX.at('blink', h.x, h.z, 0.6); SFX.at('dash', h.x, h.z, 0.5); FX.slash(h.x, h.z, p.dir, { r: 3, color: 0x9f8cff, life: 0.25 });
          dashTo(h, p.x, p.z, 42, {
            trail: u => FX.flame(u.x, 1.1, u.z, { n: 1, color: 0xcfc4ff, color2: 0x2a1a7a, size: [0.8, 1.6], life: [0.25, 0.5], up: 0.5 }),
            onEnd: u => {
              FX.ring(u.x, u.z, { r1: 3.5, color: 0x9f8cff, life: 0.35, tex: 'shock' }); FX.slash(u.x, u.z, u.facing, { r: 3.6, color: 0xffffff, sweep: 4.5, life: 0.3 }); SFX.at('arcane', u.x, u.z, 0.7); SFX.at('whoosh', u.x, u.z, 0.5);
              const es = enemiesIn(u, u.x, u.z, 8); es.sort(byHeroDist(u));
              es.slice(0, 3).forEach((t, i) => homing(u, t, { x: u.x + Math.sin(i * 2.1) * 1.2, z: u.z + Math.cos(i * 2.1) * 1.2, y: 2.4, speed: 30, color: 0x9f8cff, size: 0.6, mesh: 'shard', onHit: tt => { damage(u, tt, dmg, 1); FX.hit(tt.x, 1.3, tt.z, 0x9f8cff, true); FX.slash(tt.x, tt.z, rand(TAU), { r: 2, color: 0x9f8cff, life: 0.2 }); SFX.at('spirit', tt.x, tt.z, 0.45); } }));
              if (last) h.moon = null;
            }
          });
          return { cd: last ? full : 0.7 };
        }
      }
    ]
  },
  /* ================= 16. Virr ================= */
  {
    id: 'virr', name: 'Вирр', title: 'Дальний дозор', role: 'marks', roleName: 'Снайпер', build: 'marks', bars: [5, 1, 2, 2], diffc: 3,
    lore: 'Самая большая дальность в игре, но стреляет медленно. Наказывает тех, кто стоит открыто.',
    look: { bulk: 0.92, c1: 0x4a4638, c2: 0x33302a, c3: 0x5a4a34, metal: 0x6a7078, glow: 0xffe14a, head: 'hawk', chest: 'straps', sh: 'cloth', legs: 'boots', weapon: 'rifle', wc: 'gun', cape: 0x3a3a2c },
    stats: ST(520, 72, 300, 35, 62, 3.8, 19, 2.1, 0.64, 8.6, 12.5, 0.022), projMesh: 'bolt', atkSfx: 'shoot',
    abilities: [
      {
        key: 'Q', name: 'Прицельный выстрел', icon: 'aimshot', cd: 8, cost: 50, range: 24, ind: { type: 'line', w: 1.6, fixed: true }, anim: 'shoot', animDur: 0.6, lock: 0.4, ai: { t: 'shot', sp: 62, r: 21, farm: true },
        desc: 'После короткого прицеливания стреляет на огромную дистанцию. Дальние цели получают на 25% больше урона.',
        cast(h, p) {
          const dmg = D(h, 85, 13, 1.0), x0 = h.x, z0 = h.z, dir = p.dir; FX.lineDecal(x0, z0, dir, 24, 0.5, 0xffe14a, 0.35); SFX.at('bolt', x0, z0, 0.9); SFX.at('servo', x0, z0, 0.4);
          after(0.35, () => {
            if (!h.alive || h.stunned) return; SFX.at('rifle', x0, z0, 1); SFX.at('boom', x0, z0, 0.3); FX.shake(0.15);
            FX.glow(h.x + Math.sin(dir) * 1.8, 1.5, h.z + Math.cos(dir) * 1.8, 7, 0xffffff, 0.14, 'flare'); FX.sparks(h.x + Math.sin(dir) * 1.8, 1.5, h.z + Math.cos(dir) * 1.8, { n: 10, color: 0xfff6c0, color2: 0xff9a1a, speed: [6, 16], life: [0.1, 0.3], dir, spread: 0.4, grav: 0 });
            shot(h, { dir, speed: 62, range: 24, w: 0.8, mesh: 'bolt', color: 0xffe14a, size: 1.5, ribbon: 1.2, onHit: e => { damage(h, e, dmg * (dist(x0, z0, e.x, e.z) > 14 ? 1.25 : 1), 0); FX.explosion(e.x, e.z, 1.8, 0xffe14a, { smoke: false }); FX.sparks(e.x, 1.3, e.z, { n: 12, color: 0xffffff, color2: 0xff9a1a, speed: [5, 14], life: [0.2, 0.5], dir, spread: 0.7 }); SFX.at('impact', e.x, e.z, 0.9); } });
          });
        }
      },
      {
        key: 'W', name: 'Шипы', icon: 'caltrops', cd: 14, cost: 45, range: 10, ind: { type: 'circle', r: 4 }, ai: { t: 'point', delay: 0.2, trap: true },
        desc: 'Рассыпает шипы на 5 сек: враги в области замедлены на 35% и получают урон.',
        cast(h, p) {
          const dmg = D(h, 10, 1.5, 0.1), x = p.x, z = p.z; SFX.at('whoosh', h.x, h.z, 0.5); SFX.at('chain', x, z, 0.6); SFX.at('clack', x, z, 0.4); FX.zone(x, z, 4, 0xffe14a, 5, { tex: 'rune2', spin: 0.3, op: 0.5 }); FX.ring(x, z, { r1: 4.2, color: 0xffe14a, life: 0.4 });
          FX.debris(x, 0.6, z, { glow: true, n: 14, color: 0xfff0a0, speed: [1, 5], up: 5, size: [0.12, 0.25], rad: 2, life: 3 });
          zone(h, { x, z, r: 4, dur: 5, every: 0.5, first: true, tick: () => { for (const e of enemiesIn(h, x, z, 4)) { damage(h, e, dmg, 0); slow(h, e, 0.35, 0.8, 'caltrop'); FX.sparks(e.x, 0.3, e.z, { n: 3, color: 0xfff6c0, color2: 0xff9a1a, speed: [1, 4], life: [0.2, 0.4], up: 2, w: 0.08 }); } } });
        }
      },
      {
        key: 'E', name: 'Отскок', icon: 'roll', cd: 11, cost: 35, range: 7, ind: { type: 'circle', r: 1 }, lock: 0, ai: { t: 'escape', kite: true },
        desc: 'Рывок в точку. Следующая атака наносит бонусный урон.',
        cast(h, p) {
          const bonus = D(h, 25, 4, 0.3); SFX.at('dash', h.x, h.z, 0.7); SFX.at('flap', h.x, h.z, 0.6); FX.smoke(h.x, h.z, 1.4, 6, 0x4a4638); FX.ring(h.x, h.z, { r1: 2, color: 0xffe14a, life: 0.3 });
          dashTo(h, p.x, p.z, 28, { onEnd: u => { u.atkCd = Math.min(u.atkCd, 0.15); } });
          addBuff(h, { id: 'vault', dur: 4, onHit: (u, t, b) => { b.dur = 0; FX.hit(t.x, 1.3, t.z, 0xffffff, true); FX.glow(t.x, 1.3, t.z, 6, 0xffe14a, 0.15, 'flare'); SFX.at('crit', t.x, t.z, 0.5); return bonus; } });
        }
      },
      {
        key: 'R', name: 'Последний выстрел', icon: 'scope', cd: 80, cost: 100, range: 42, ind: { type: 'target', hero: true }, anim: 'shoot', animDur: 1.3, lock: 1.1, ai: { t: 'target', ult: true, hp: 0.42 },
        desc: 'Берёт героя на прицел на 1.1 сек и выпускает пулю, от которой не уклониться. Урон растёт от недостающего здоровья цели.',
        cast(h, p) {
          const t = p.unit; SFX.at('warn', h.x, h.z, 1); SFX.at('ultcue', h.x, h.z, 0.6); SFX.at('servo', h.x, h.z, 0.5); SFX.at('bolt', h.x, h.z, 0.7);
          const m = new THREE.Mesh(FX.geo.line, FX.mat('beam', 0xffe14a, 0.9));
          FX.add(m, 1.1, (k, me) => { me.position.set(h.x, 1.5, h.z); me.rotation.y = angTo(h.x, h.z, t.x, t.z); me.scale.set(0.25 + (1 - k) * 0.9, 1, udist(h, t)); me.material.opacity = 0.5 + 0.5 * Math.sin(k * 40); if (!t.alive || !h.alive) me.visible = false; });
          const mark = FX.aura(t, 0xffe14a, 1.1, 1.6, 'rune2', -6);
          after(1.1, () => {
            mark.dead = true; if (!h.alive || h.stunned || !t.alive) return;
            SFX.at('rifle', h.x, h.z, 1); SFX.at('bigboom', h.x, h.z, 0.5); FX.shake(0.5); FX.punch(0.8); FX.explosion(h.x + Math.sin(h.facing) * 1.6, h.z + Math.cos(h.facing) * 1.6, 2, 0xffe14a, { smoke: true }); FX.glow(h.x, 1.5, h.z, 12, 0xffffff, 0.2, 'flare');
            homing(h, t, { speed: 85, color: 0xffe14a, size: 1.4, mesh: 'bolt', y: 1.5, onHit: tt => { damage(h, tt, D(h, 210, 29, 1.05) + (tt.maxHp - tt.hp) * 0.2, 0); FX.explosion(tt.x, tt.z, 3.5, 0xffe14a, { el: 'earth', rock: 0x4a4638 }); FX.shock(tt.x, tt.z, 7, 1.2, 0.5); FX.hitstop(0.07); SFX.at('impact', tt.x, tt.z, 1); SFX.at('boom', tt.x, tt.z, 0.6); } });
          });
        }
      }
    ]
  }
];