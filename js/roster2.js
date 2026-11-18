'use strict';
/* ===== roster, part 2: three supports (Lira, Hald, Nisa) and three assassins (Shaya, Fenris, Reiji) ===== */
const silence = (src, u, dur) => addBuff(u, { id: 'silence', dur, silence: true, src });
// a short tether drawn every frame between two units while cond() holds
function tether(a, b, color, dur, cond, w) {
  let t = 0;
  G.actors.push({ update(dt) { t += dt; if (t > dur || !a.alive || !b.alive || (cond && !cond())) return false; FX.beam(a.x, a.z, b.x, b.z, { color, w: (w || 0.6) + Math.random() * 0.3, life: 0.06, y: 1.3 }); return true; } });
}

HEROES.push(
  /* ================= 17. Lira ================= */
  {
    id: 'lira', name: 'Лира', title: 'Голос ветра', role: 'support', roleName: 'Поддержка', build: 'support', bars: [2, 2, 4, 3], diffc: 1,
    lore: 'Разгоняет союзников и сбивает врагам темп. Лечит напевом, глушит заклинателей и отбрасывает тех, кто подошёл слишком близко.',
    look: { bulk: 0.84, robe: true, c1: 0x3f6076, c2: 0x2a4152, c3: 0x1f2f3c, metal: 0xc9d4de, glow: 0xd5e8ff, head: 'wind', hair: 0xd9e1e8, chest: 'tabard', sh: 'cloth', weapon: 'fan', wc: 'wand', cape: 0x2f4a5e },
    stats: ST(540, 76, 450, 48, 45, 2.4, 20, 2.4, 0.72, 9.0, 9.5), projMesh: 'shard', atkSfx: 'cast',
    abilities: [
      {
        key: 'Q', name: 'Порыв', icon: 'wind', cd: 8, cost: 55, range: 13, ind: { type: 'line', w: 2.6, fixed: true }, anim: 'thrust', ai: { t: 'shot', sp: 26, farm: true },
        desc: 'Волна ветра проходит сквозь всех: враги получают урон, отбрасываются и замедляются на 30%, союзные герои ускоряются на 30% на 2 сек.',
        cast(h, p) {
          const dmg = D(h, 55, 8, 0, 0.45), x0 = h.x, z0 = h.z; SFX.at('dash', h.x, h.z); castGlow(h, 0xd5e8ff);
          FX.slash(h.x, h.z, p.dir, { r: 3, color: 0xffffff, life: 0.22 });
          shot(h, {
            dir: p.dir, speed: 26, range: 13, w: 1.3, mesh: false, color: 0xd5e8ff, ribbon: 2.4, pierce: true,
            trail: q => { FX.sparks(q.x, 1.1, q.z, { n: 2, color: 0xffffff, color2: 0x7fb4e8, speed: [2, 7], life: [0.15, 0.4], dir: p.dir + Math.PI, spread: 1.2, w: 0.1, stretch: 0.12, grav: 0 }); if (Math.random() < 0.45) FX.slash(q.x, q.z, p.dir, { r: 2.3, color: Math.random() < 0.5 ? 0xffffff : 0xb9d8ff, life: 0.2, sweep: 0.5, y: 0.9 + Math.random() * 0.8 }); if (Math.random() < 0.3) FX.smoke(q.x, q.z, 0.7, 1, 0x6c7a88); },
            onHit: e => { damage(h, e, dmg, 1); knock(e, x0, z0, 3, 0.22); slow(h, e, 0.3, 1.2); FX.hit(e.x, 1.3, e.z, 0xd5e8ff, true); FX.ring(e.x, e.z, { r1: 2.2, color: 0xd5e8ff, life: 0.3, tex: 'shock' }); },
            onAlly: a => { addBuff(a, { id: 'tailwind', dur: 2, ms: 0.3 }); FX.heal(a, 0xd5e8ff); }
          });
        }
      },
      {
        key: 'W', name: 'Напев исцеления', icon: 'song', cd: 9, cost: 60, range: 11, ind: { type: 'ally' }, lock: 0.1, ai: { t: 'shieldAlly' },
        desc: 'Лечит союзного героя (или себя) сразу и ещё четыре раза в течение 4 сек.',
        cast(h, p) {
          const t = p.unit, now = D(h, 40, 6, 0, 0.3), tick = D(h, 13, 2.2, 0, 0.09);
          heal(h, t, now); FX.heal(t, 0xd5e8ff); FX.pillar(t.x, t.z, { r: 1.1, h: 9, color: 0x8fbfee, life: 0.6, op: 0.5 }); FX.ring(t.x, t.z, { r1: 3, color: 0x8fbfee, life: 0.45, tex: 'shock' }); SFX.at('heal', t.x, t.z, 1);
          if (t !== h) { FX.beam(h.x, h.z, t.x, t.z, { color: 0xd5e8ff, w: 1.2, life: 0.4 }); FX.beam(h.x, h.z, t.x, t.z, { color: 0xffffff, w: 0.4, life: 0.25 }); }
          const b = addBuff(t, { id: 'chant' + h.id, dur: 4.05, every: 1, src: h, onTick: u => { heal(h, u, tick); FX.sparks(u.x, 0.3, u.z, { n: 6, color: 0xffffff, color2: 0x7fb4e8, speed: [0.2, 0.8], life: [0.5, 1], up: 5, rad: 0.9, ring: true, grav: -1, w: 0.08, stretch: 0.05 }); } });
          if (b) b.fx = FX.aura(t, 0xd5e8ff, 4, 1.5, 'rune', 2.5);
        }
      },
      {
        key: 'E', name: 'Затишье', icon: 'lull', cd: 13, cost: 60, range: 11, ind: { type: 'circle', r: 4.2 }, ai: { t: 'point', delay: 0.5 },
        desc: 'Через 0.5 сек в точке схлопывается воздух: урон и безмолвие на 1.6 сек — враги не могут применять способности.',
        cast(h, p) {
          const dmg = D(h, 50, 8, 0, 0.4), x = p.x, z = p.z; telegraph(h, x, z, 4.2, 0.5, 0xd5e8ff); castGlow(h, 0xd5e8ff); SFX.at('cast', x, z);
          FX.ring(x, z, { r0: 5.5, r1: 0.6, color: 0xd5e8ff, life: 0.5, tex: 'swirl', spin: -6, op: 0.7 }); FX.implode(x, 1.2, z, 5, { n: 22, color: 0xd5e8ff, color2: 0xffffff, life: 0.48, streak: true });
          after(0.5, () => {
            FX.explosion(x, z, 4.2, 0x8fbfee, { smoke: false }); FX.shock(x, z, 5.5, -0.9, 0.4); FX.sphere(x, 1.2, z, { r0: 4.2, r1: 0.4, color: 0x8fbfee, life: 0.35, op: 0.3 }); SFX.at('void', x, z, 0.7); SFX.at('boom', x, z, 0.4);
            for (const e of enemiesIn(h, x, z, 4.2)) { damage(h, e, dmg, 1); const b = silence(h, e, 1.6); if (b) b.fx = FX.aura(e, 0xd5e8ff, b.dur, e.radius + 0.5, 'ringThin', -4); }
          });
        }
      },
      {
        key: 'R', name: 'Попутный шторм', icon: 'tailwind', cd: 85, cost: 100, range: 0, ind: { type: 'self', r: 9 }, animDur: 0.7, lock: 0.3, ai: { t: 'nova', r: 8, ult: true, hp: 0.7, rad: 8 },
        desc: 'Шторм вокруг Лиры: враги отбрасываются и замедляются на 40%. Союзные герои рядом на 6 сек получают +35% скорости, +30% скорости атаки и исцеление.',
        cast(h) {
          const hl = D(h, 16, 3, 0, 0.07), x = h.x, z = h.z; SFX.at('dash', x, z, 1); SFX.at('heal', x, z, 1); FX.shake(0.5); FX.shock(x, z, 10, 1, 0.6); FX.punch(0.5);
          FX.ring(x, z, { r1: 9.5, color: 0x3f7fc4, life: 0.55, tex: 'ringThin', op: 0.9 }); FX.ring(x, z, { r0: 1, r1: 9, color: 0x3f7fc4, life: 0.9, tex: 'swirl', spin: 7, op: 0.45 }); FX.pillar(x, z, { r: 1.5, h: 13, color: 0x4f8fd0, life: 0.8, op: 0.25, grow: true });
          for (let i = 0; i < 3; i++) after(i * 0.1, () => FX.slash(x, z, i * 2.1, { r: 3.8 + i * 1.1, color: 0x4f8fd0, sweep: 4.5, life: 0.36, y: 0.7 + i * 0.5 }));
          FX.sparks(x, 0.5, z, { n: 30, color: 0xffffff, color2: 0x7fb4e8, speed: [8, 20], life: [0.3, 0.7], ring: true, up: 4, w: 0.1, stretch: 0.1 }); FX.smoke(x, z, 4, 6, 0x6c7a88);
          for (const e of enemiesIn(h, x, z, 9)) { knock(e, x, z, 4.5, 0.3); slow(h, e, 0.4, 2, 'gale'); FX.hit(e.x, 1.3, e.z, 0xd5e8ff, true); }
          for (const a of alliesIn(h, x, z, 9, true)) {
            const b = addBuff(a, { id: 'gale' + h.id, dur: 6.05, ms: 0.35, as: 0.3, every: 0.5, src: h, onTick: u => { heal(h, u, hl, true); if (Math.random() < 0.6) FX.sparks(u.x, 0.4, u.z, { n: 3, color: 0xffffff, color2: 0x7fb4e8, speed: [1, 4], life: [0.3, 0.6], up: 4, ring: true, rad: 1, w: 0.08, stretch: 0.08 }); } });
            if (b) b.fx = FX.aura(a, 0x8fbfee, 6, 1.9, 'swirl', 6); if (a !== h) { FX.pillar(a.x, a.z, { r: 1, h: 8, color: 0x8fbfee, life: 0.5, op: 0.4 }); FX.beam(x, z, a.x, a.z, { color: 0x8fbfee, w: 0.9, life: 0.4 }); }
          }
        }
      }
    ]
  },
  /* ================= 18. Hald ================= */
  {
    id: 'hald', name: 'Хальд', title: 'Щит севера', role: 'support', roleName: 'Защитник', build: 'guard', bars: [2, 5, 3, 2], diffc: 2,
    lore: 'Живая стена для своей команды: прыгает к союзнику, принимает удар на себя и не даёт никому умереть в решающий момент.',
    look: { bulk: 1.3, h: 1.05, c1: 0x3b4a5c, c2: 0x2b3644, c3: 0x5a4a3a, metal: 0x8c99a8, glow: 0x3d9cff, head: 'bulwark', chest: 'plate', sh: 'plate', legs: 'greaves', weapon: 'spear', wc: 'thrust', cape: 0x27405e },
    stats: ST(730, 98, 330, 40, 52, 3.0, 35, 3.7, 0.66, 8.5, 3.1),
    abilities: [
      {
        key: 'Q', name: 'Заслон', icon: 'intercept', cd: 11, cost: 55, range: 11, ind: { type: 'ally' }, anim: 'slam', ai: { t: 'shieldAlly' },
        desc: 'Прыгает к союзному герою: оба получают щит на 3.5 сек, враги в точке приземления отбрасываются и замедляются на 40%. На себя — щит и удар на месте.',
        cast(h, p) {
          const t = p.unit, amt = D(h, 70, 12) + h.maxHp * 0.08; SFX.at('dash', h.x, h.z);
          const land = u => {
            shield(h, u, amt, 3.5, 0x3d9cff); if (t !== u && t.alive) { shield(h, t, amt, 3.5, 0x3d9cff); FX.pillar(t.x, t.z, { r: 1.3, h: 9, color: 0x3d9cff, life: 0.5 }); }
            FX.explosion(u.x, u.z, 3.6, 0x3d9cff, { el: 'earth', rock: 0x3b4a5c, smoke: false }); FX.shock(u.x, u.z, 5, 0.8, 0.4); FX.ring(u.x, u.z, { r0: 0.6, r1: 4, color: 0x9fd0ff, life: 0.6, tex: 'rune2', spin: 3, op: 0.7 }); FX.shake(0.4); SFX.at('quake', u.x, u.z, 0.6); SFX.at('shield', u.x, u.z);
            for (const e of enemiesIn(u, u.x, u.z, 3.6)) { damage(u, e, D(u, 55, 8, 0.4), 0); knock(e, u.x, u.z, 3, 0.22); slow(u, e, 0.4, 1.5); }
          };
          if (t === h || udist(h, t) < 2.2) { land(h); return; }
          FX.ring(h.x, h.z, { r1: 2.6, color: 0x3d9cff, life: 0.3, tex: 'shock' });
          dashTo(h, t.x, t.z, 34, { fly: true, follow: t, stop: 1.7, arc: 2.6, trail: u => FX.sparks(u.x, 1 + (u.yOff || 0), u.z, { n: 2, color: 0xcfe6ff, color2: 0x1560c8, speed: [1, 4], life: [0.2, 0.45], w: 0.1 }), onEnd: land });
        }
      },
      {
        key: 'W', name: 'Удар щитом', icon: 'shieldbash', cd: 10, cost: 45, range: 5, ind: { type: 'cone', r: 5, narrow: true }, anim: 'thrust', lock: 0.25, ai: { t: 'cone' },
        desc: 'Бьёт щитом перед собой: урон и оглушение на 0.9 сек всем в узком конусе.',
        cast(h, p) {
          const dmg = D(h, 60, 9, 0.45), x = h.x + Math.sin(p.dir) * 2.4, z = h.z + Math.cos(p.dir) * 2.4; SFX.at('hit', h.x, h.z, 1); SFX.at('boom', h.x, h.z, 0.45);
          FX.slash(h.x, h.z, p.dir, { r: 5.2, color: 0x3d9cff, sweep: 0.9, life: 0.25 }); FX.slash(h.x, h.z, p.dir, { r: 4.2, color: 0xffffff, sweep: 0.7, life: 0.18 });
          FX.ring(x, z, { r1: 3, color: 0x3d9cff, life: 0.3, tex: 'shock' }); FX.shock(x, z, 4, 0.7, 0.3); FX.debris(x, 0.3, z, { n: 5, color: 0x3b4a5c, speed: [3, 7], up: 7 });
          FX.sparks(x, 1.2, z, { n: 18, color: 0xffffff, color2: 0x3d9cff, speed: [7, 16], life: [0.15, 0.4], dir: p.dir, spread: 0.9 });
          for (const e of enemiesIn(h, h.x, h.z, 5 + 1)) if (inCone(h, e, p.dir, 0.5, 5)) { damage(h, e, dmg, 0); stun(h, e, 0.9); FX.hit(e.x, 1.3, e.z, 0x3d9cff, true); }
        }
      },
      {
        key: 'E', name: 'Клятва стража', icon: 'oath', cd: 14, cost: 50, range: 10, ind: { type: 'ally' }, lock: 0.1, ai: { t: 'shieldAlly' },
        desc: 'На 5 сек связывает себя с союзным героем: пока Хальд рядом, союзник получает на 35% меньше урона, а Хальд — +25 защиты. На себя — только защита.',
        cast(h, p) {
          const t = p.unit; addBuff(h, { id: 'oathself', dur: 5, def: 25 }); SFX.at('shield', t.x, t.z); FX.ring(h.x, h.z, { r1: 3, color: 0x3d9cff, life: 0.4, tex: 'shock' });
          if (t === h) { FX.pillar(h.x, h.z, { r: 1.4, h: 9, color: 0x3d9cff, life: 0.5 }); return; }
          const b = addBuff(t, { id: 'oath' + h.id, dur: 5, dmgIn: 0.65, src: h, every: 0.2, onTick: (u, bb) => { if (!h.alive || udist(h, u) > 13) bb.dur = 0; } });
          if (b) { b.fx = FX.aura(t, 0x3d9cff, 5, 1.7, 'rune2', 2.5); tether(h, t, 0x3d9cff, 5, () => hasBuff(t, 'oath' + h.id)); }
          FX.pillar(t.x, t.z, { r: 1.3, h: 9, color: 0x3d9cff, life: 0.5 }); FX.ring(t.x, t.z, { r1: 3, color: 0x9fd0ff, life: 0.4, tex: 'shock' });
        }
      },
      {
        key: 'R', name: 'Нерушимый строй', icon: 'phalanx', cd: 95, cost: 100, range: 0, ind: { type: 'self', r: 8.5 }, anim: 'slam', animDur: 0.7, lock: 0.3, ai: { t: 'save', r: 8, hp: 0.32 },
        desc: 'На 2.8 сек союзные герои рядом не могут умереть — их здоровье не опускается ниже 1. Когда эффект заканчивается, они исцеляются.',
        cast(h) {
          const hl = D(h, 70, 12) + h.maxHp * 0.06, x = h.x, z = h.z; SFX.at('shield', x, z); SFX.at('quake', x, z, 0.8); FX.shake(0.5); FX.shock(x, z, 10, 0.9, 0.6);
          FX.ring(x, z, { r1: 9, color: 0x3d9cff, life: 0.6, tex: 'shock', op: 0.8 }); FX.zone(x, z, 8.5, 0x3d9cff, 2.8, { tex: 'rune2', spin: 1.2, op: 0.5 }); FX.wall(x, z, 8.5, 0x3d9cff, 2.8, { h: 4.5, op: 0.22 });
          FX.pillar(x, z, { r: 1.6, h: 14, color: 0x3d9cff, life: 0.8, op: 0.32, grow: true }); FX.sparks(x, 0.4, z, { n: 24, color: 0xffffff, color2: 0x1560c8, speed: [0.5, 2], life: [0.6, 1.3], up: 9, rad: 8, ring: true, grav: -2, w: 0.1 });
          for (const a of alliesIn(h, x, z, 8.5, true)) {
            const b = addBuff(a, { id: 'bulwark', dur: 2.8, undying: true, def: 15, onEnd: u => { if (!u.alive) return; heal(h, u, hl); FX.heal(u, 0x3d9cff); FX.ring(u.x, u.z, { r1: 3.5, color: 0x3d9cff, life: 0.5, tex: 'shock' }); } });
            if (b) b.fx = FX.bubble(a, 0x3d9cff, 2.8, a.radius + 0.9); if (a !== h) { FX.pillar(a.x, a.z, { r: 1, h: 9, color: 0x3d9cff, life: 0.6, op: 0.4 }); FX.beam(x, z, a.x, a.z, { color: 0x3d9cff, w: 1, life: 0.45 }); }
          }
        }
      }
    ]
  },
  /* ================= 19. Nisa ================= */
  {
    id: 'nisa', name: 'Ниса', title: 'Ткачиха судеб', role: 'support', roleName: 'Поддержка', build: 'support', bars: [3, 1, 5, 1], diffc: 3,
    lore: 'Ловит врагов нитями и вытаскивает союзников из беды. Сама хрупкая, но одна удачная нить решает бой.',
    look: { bulk: 0.86, robe: true, c1: 0x3a2a3e, c2: 0x24182a, c3: 0x1a1220, metal: 0xcbb8d0, glow: 0xff4dae, head: 'weaver', chest: 'robe', sh: 'round', weapon: 'needle', wc: 'wand', cape: 0x2a1c30 },
    stats: ST(555, 78, 440, 46, 46, 2.4, 21, 2.5, 0.72, 8.9, 9.2), projMesh: 'shard', atkSfx: 'arrow',
    abilities: [
      {
        key: 'Q', name: 'Липкая нить', icon: 'thread', cd: 10, cost: 55, range: 14, ind: { type: 'line', w: 1.6, fixed: true }, anim: 'thrust', ai: { t: 'shot', sp: 30 },
        desc: 'Выстреливает нить: первый враг на пути получает урон и приковывается к месту на 1.3 сек.',
        cast(h, p) {
          const dmg = D(h, 60, 9, 0, 0.5), x0 = h.x, z0 = h.z; SFX.at('arrow', h.x, h.z);
          shot(h, {
            dir: p.dir, speed: 30, range: 14, w: 0.8, mesh: 'shard', color: 0xff4dae, size: 0.8, ribbon: 0.5,
            onHit: e => {
              damage(h, e, dmg, 1); root(h, e, 1.3, 0xff4dae); FX.explosion(e.x, e.z, 2, 0xff4dae, { el: 'shadow', smoke: false }); SFX.at('hit', e.x, e.z, 0.8);
              FX.beam(x0, z0, e.x, e.z, { color: 0xff4dae, w: 0.5, life: 0.5, y: 1.3 }); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; FX.beam(e.x, e.z, e.x + Math.sin(a) * 2.4, e.z + Math.cos(a) * 2.4, { color: 0xffb3dc, w: 0.3, life: 1.2, y: 0.25 }); }
            }
          });
        }
      },
      {
        key: 'W', name: 'Нить спасения', icon: 'lifeline', cd: 14, cost: 60, range: 12, ind: { type: 'ally' }, lock: 0.1, ai: { t: 'shieldAlly' },
        desc: 'Притягивает союзного героя к себе и даёт ему щит на 3 сек. На себя — только щит.',
        cast(h, p) {
          const t = p.unit; shield(h, t, D(h, 70, 12, 0, 0.5), 3, 0xff4dae); SFX.at('shield', t.x, t.z); FX.ring(t.x, t.z, { r1: 2.6, color: 0xff4dae, life: 0.4, tex: 'shock' });
          if (t === h) return;
          const tm = pullTo(t, h.x, h.z, 30, 2.4); tether(h, t, 0xff4dae, tm + 0.1, null, 0.8); FX.pillar(h.x, h.z, { r: 1, h: 7, color: 0xff4dae, life: 0.4 }); SFX.at('dash', t.x, t.z);
        }
      },
      {
        key: 'E', name: 'Паутина', icon: 'web', cd: 13, cost: 60, range: 11, ind: { type: 'circle', r: 4.6 }, ai: { t: 'point', delay: 0.2, trap: true },
        desc: 'На 4 сек растягивает паутину: враги внутри замедляются на 45% и получают урон дважды в секунду.',
        cast(h, p) {
          const dmg = D(h, 11, 2, 0, 0.07), x = p.x, z = p.z; SFX.at('cast', x, z); castGlow(h, 0xff4dae);
          FX.zone(x, z, 4.6, 0xff4dae, 4, { tex: 'crack', spin: 0.15, op: 0.9 }); FX.zone(x, z, 4.6, 0xffb3dc, 4, { tex: 'ringThin', spin: -0.3, op: 0.7 }); FX.ring(x, z, { r1: 4.8, color: 0xff4dae, life: 0.4, tex: 'shock' });
          for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; FX.beam(x, z, x + Math.sin(a) * 4.6, z + Math.cos(a) * 4.6, { color: 0xffb3dc, w: 0.28, life: 4, y: 0.22 }); }
          zone(h, { x, z, r: 4.6, dur: 4, every: 0.5, first: true, tick: () => { for (const e of enemiesIn(h, x, z, 4.6)) { damage(h, e, dmg, 1, { dot: true }); slow(h, e, 0.45, 0.7, 'web'); FX.sparks(e.x, 0.6, e.z, { n: 2, color: 0xffb3dc, color2: 0xa0105a, speed: [0.5, 2], life: [0.3, 0.6], up: 2, w: 0.07 }); } } });
        }
      },
      {
        key: 'R', name: 'Кокон', icon: 'cocoon', cd: 80, cost: 100, range: 10, ind: { type: 'target', hero: true }, lock: 0.3, ai: { t: 'target', ult: true, hp: 0.8 },
        desc: 'Заматывает вражеского героя в кокон на 2.2 сек: он оглушён. Затем кокон лопается — урон цели и врагам рядом, замедление на 50%.',
        cast(h, p) {
          const t = p.unit, dmg = D(h, 130, 19, 0, 0.55); SFX.at('dark', t.x, t.z); castGlow(h, 0xff4dae);
          stun(h, t, 2.2, 1.6); FX.bubble(t, 0xff4dae, 2.2, t.radius + 0.7); FX.pillar(t.x, t.z, { r: 1.3, h: 9, color: 0xff4dae, life: 0.5 }); FX.beam(h.x, h.z, t.x, t.z, { color: 0xff4dae, w: 1, life: 0.4 });
          let el = 0, nx = 0;
          G.actors.push({
            update(dt) {
              el += dt; if (!t.alive) return false;
              if (el >= nx && el < 2.1) { nx = el + 0.12; const a = rand(TAU), y = 0.4 + rand(2.4) + (t.yOff || 0); FX.beam(t.x + Math.sin(a) * 1.4, t.z + Math.cos(a) * 1.4, t.x - Math.sin(a) * 1.4, t.z - Math.cos(a) * 1.4, { color: Math.random() < 0.5 ? 0xff4dae : 0xffd0ea, w: 0.3, life: 0.5, y }); }
              if (el < 2.2) return true;
              FX.explosion(t.x, t.z, 4.6, 0xff4dae, { el: 'shadow' }); FX.shock(t.x, t.z, 6, 0.9, 0.45); FX.punch(0.7); SFX.at('boom', t.x, t.z, 0.8); FX.sparks(t.x, 1.3, t.z, { n: 26, color: 0xffd0ea, color2: 0xa0105a, speed: [6, 16], life: [0.2, 0.55], ring: true, up: 4 });
              const x = t.x, z = t.z; damage(h, t, dmg, 1); for (const e of enemiesIn(h, x, z, 4.6)) { if (e !== t) damage(h, e, dmg * 0.5, 1); slow(h, e, 0.5, 2, 'cocoon'); }
              return false;
            }
          });
        }
      }
    ]
  },
  /* ================= 20. Shaya ================= */
  {
    id: 'shaya', name: 'Шая', title: 'Песчаная гадюка', role: 'assassin', roleName: 'Убийца', build: 'assassin', bars: [5, 2, 2, 4], diffc: 2,
    lore: 'Травит жертву издалека, проскальзывает сквозь строй и добивает серией укусов, оставаясь неуязвимой.',
    look: { bulk: 0.84, c1: 0x5c4a2c, c2: 0x3a2f1f, c3: 0x2a2218, skin: 0x7a5c44, metal: 0xb89a55, glow: 0xd6f03a, head: 'viper', chest: 'straps', sh: 'round', legs: 'boots', weapon: 'sickles', wc: 'dual', cape: 0x3d3220 },
    stats: ST(580, 80, 270, 30, 60, 3.6, 24, 2.7, 0.84, 9.3, 2.5),
    abilities: [
      {
        key: 'Q', name: 'Ядовитый плевок', icon: 'spit', cd: 6.5, cost: 35, range: 12, ind: { type: 'line', w: 1.6, fixed: true }, anim: 'thrust', ai: { t: 'shot', sp: 32, farm: true },
        desc: 'Плевок яда: урон, отравление на 4 сек и замедление на 25% на 2 сек.',
        cast(h, p) {
          const dmg = D(h, 45, 7, 0.5), tick = D(h, 8, 1.4, 0.09); SFX.at('poison', h.x, h.z);
          shot(h, {
            dir: p.dir, speed: 32, range: 12, w: 0.8, mesh: 'orb', color: 0xd6f03a, size: 0.7,
            trail: q => FX.flame(q.x, q.y, q.z, { n: 1, color: 0xd6f03a, color2: 0x2a3800, size: [0.4, 0.9], life: [0.2, 0.45], up: 0.4, a: 0.5 }),
            onHit: e => { damage(h, e, dmg, 0); poison(h, e, tick, 8, 'venom'); slow(h, e, 0.25, 2); FX.explosion(e.x, e.z, 1.8, 0xd6f03a, { el: 'toxic', smoke: false }); SFX.at('hit', e.x, e.z, 0.6); }
          });
        }
      },
      {
        key: 'W', name: 'Бросок гадюки', icon: 'viper', cd: 11, cost: 40, range: 8.5, ind: { type: 'line', w: 2.2 }, anim: 'thrust', ai: { t: 'gap', escape: true },
        desc: 'Рывок сквозь врагов: урон всем на пути. Отравленные цели получают на 40% больше урона.',
        cast(h, p) {
          const dmg = D(h, 55, 8, 0.55); SFX.at('dash', h.x, h.z); FX.explosion(h.x, h.z, 1.6, 0xd6f03a, { el: 'toxic', smoke: false });
          dashTo(h, p.x, p.z, 38, {
            w: 1.5, trail: u => { FX.flame(u.x, 0.8, u.z, { n: 2, color: 0xd6f03a, color2: 0x2a3800, size: [0.7, 1.4], life: [0.3, 0.6], up: 0.6, a: 0.45 }); FX.sparks(u.x, 0.4, u.z, { n: 1, color: 0xf4ffb0, color2: 0x6a8a00, speed: [2, 5], life: [0.2, 0.4], dir: u.facing + Math.PI, spread: 0.8 }); },
            onHit: (e, u) => { const ps = hasBuff(e, 'venom' + u.id); damage(u, e, dmg * (ps ? 1.4 : 1), 0); FX.slash(e.x, e.z, u.facing + 0.6, { r: 2.6, color: ps ? 0xffffff : 0xd6f03a, life: 0.22 }); FX.hit(e.x, 1.3, e.z, 0xd6f03a, true); SFX.at('slash', e.x, e.z, 0.7); }
          });
        }
      },
      {
        key: 'E', name: 'Песчаная завеса', icon: 'sandveil', cd: 14, cost: 45, range: 0, ind: { type: 'self', r: 3 }, lock: 0.05, ai: { t: 'shield' },
        desc: 'На 2.5 сек скрывается в вихре песка: получает на 50% меньше урона и +30% скорости. Следующая атака отравляет и наносит бонусный урон.',
        cast(h) {
          const bonus = D(h, 30, 6, 0.4), tick = D(h, 8, 1.4, 0.09); SFX.at('dash', h.x, h.z, 0.7);
          const b = addBuff(h, { id: 'sandveil', dur: 2.5, dmgIn: 0.5, ms: 0.3, every: 0.12, onTick: u => { FX.burst(u.x, 0.8, u.z, { smoke: true, n: 1, color: 0x8a744a, color2: 0x2a2218, speed: [0.5, 2], life: [0.5, 0.9], size: [1, 2.2], up: 1, rad: 1, a: 0.4 }); FX.sparks(u.x, 0.6, u.z, { n: 1, color: 0xf4e8b0, color2: 0x8a6a2a, speed: [3, 7], life: [0.2, 0.4], ring: true, up: 2, rad: 1, w: 0.07 }); } });
          if (b) b.fx = FX.aura(h, 0xd6c070, 2.5, 1.7, 'swirl', 9);
          FX.ring(h.x, h.z, { r1: 3.4, color: 0xd6c070, life: 0.4, tex: 'shock' }); FX.smoke(h.x, h.z, 2, 6, 0x8a744a);
          addBuff(h, { id: 'fang', dur: 5, onHit: (u, t, bb) => { bb.dur = 0; if (!t.struct) poison(u, t, tick, 8, 'venom'); FX.explosion(t.x, t.z, 1.7, 0xd6f03a, { el: 'toxic', smoke: false }); return bonus; } });
        }
      },
      {
        key: 'R', name: 'Тысяча укусов', icon: 'bites', cd: 70, cost: 80, range: 7.5, ind: { type: 'target', hero: true }, lock: 1.05, ai: { t: 'target', ult: true, hp: 0.55 },
        desc: 'Исчезает и наносит герою пять ударов с разных сторон, оставаясь неуязвимой. Последний удар отравляет. Убийство возвращает половину перезарядки.',
        cast(h, p) {
          const t = p.unit, dmg = D(h, 33, 5, 0.31), tick = D(h, 10, 1.8, 0.1); h.order = null; h.path = null; SFX.at('dark', h.x, h.z);
          addBuff(h, { id: 'flurry', dur: 1.1, invuln: true }); FX.explosion(h.x, h.z, 1.8, 0xd6f03a, { el: 'toxic' });
          let el = 0.08, n = 0;
          G.actors.push({
            update(dt) {
              el += dt; if (!h.alive) return false;
              if (!t.alive) { h.castLock = 0; h.cd[3] *= 0.5; return false; }
              if (el < 0.2) return true; el -= 0.2; n++;
              const a = n * 2.513 + rand(-0.3, 0.3), q = NAV.nearest(t.x + Math.sin(a) * 1.9, t.z + Math.cos(a) * 1.9), x0 = h.x, z0 = h.z;
              h.x = q.x; h.z = q.z; h.facing = angTo(h.x, h.z, t.x, t.z); h.anim.atkT = h.anim.atkDur = 0.2; h.anim.alt = !h.anim.alt;
              FX.beam(x0, z0, h.x, h.z, { color: 0xd6f03a, w: 1.1, life: 0.22, y: 1.2 }); FX.slash(t.x, t.z, h.facing + (n % 2 ? 0.7 : -0.7), { r: 3.4, color: n % 2 ? 0xffffff : 0xd6f03a, flip: n % 2 === 0, life: 0.24 });
              FX.hit(t.x, 1.3, t.z, 0xd6f03a, true); FX.flame(h.x, 1, h.z, { n: 3, color: 0xd6f03a, color2: 0x2a3800, size: [0.7, 1.4], life: [0.2, 0.45], up: 0.5, a: 0.45 }); SFX.at('slash', t.x, t.z, 0.9);
              damage(h, t, dmg, 0);
              if (n < 5) return true;
              if (t.alive) { poison(h, t, tick, 8, 'venom'); FX.explosion(t.x, t.z, 2.6, 0xd6f03a, { el: 'toxic' }); h.order = { type: 'attack', tgt: t, rp: 0 }; } else h.cd[3] *= 0.5;
              FX.punch(0.7); return false;
            }
          });
        }
      }
    ]
  },
  /* ================= 21. Fenris ================= */
  {
    id: 'fenris', name: 'Фенрис', title: 'Вожак стаи', role: 'assassin', roleName: 'Охотник', build: 'duel', bars: [4, 3, 2, 4], diffc: 1,
    lore: 'Прыгает на раненую добычу и рвёт её быстрыми ударами. Чем дольше бой один на один, тем он сильнее.',
    look: { bulk: 1.02, h: 1.02, c1: 0x3a4038, c2: 0x282c28, c3: 0x4a3a2c, skin: 0x6e6a60, metal: 0x8a8f88, glow: 0x38f07a, head: 'wolf', chest: 'bare', sh: 'fur', legs: 'boots', weapon: 'wolfclaws', wc: 'fist', arm: 1.12 },
    stats: ST(620, 86, 250, 28, 58, 3.5, 27, 3.0, 0.86, 9.4, 2.6),
    abilities: [
      {
        key: 'Q', name: 'Прыжок на добычу', icon: 'pounce', cd: 8, cost: 40, range: 9, ind: { type: 'target' }, anim: 'slam', ai: { t: 'target', farm: true },
        desc: 'Прыгает на врага: урон и замедление на 35% на 1.5 сек. По целям ниже 40% здоровья урон выше на 40%.',
        cast(h, p) {
          const t = p.unit; SFX.at('dash', h.x, h.z); FX.ring(h.x, h.z, { r1: 2.4, color: 0x38f07a, life: 0.3, tex: 'shock' });
          dashTo(h, t.x, t.z, 36, {
            fly: true, follow: t, stop: 1.5, arc: 2.2, trail: u => FX.flame(u.x, 1 + (u.yOff || 0), u.z, { n: 1, color: 0x38f07a, color2: 0x04301a, size: [0.7, 1.4], life: [0.2, 0.45], up: 0.4, a: 0.45 }),
            onEnd: u => {
              if (!t.alive) return; const low = t.hp / t.maxHp < 0.4, d = D(u, 60, 9, 0.6) * (low ? 1.4 : 1);
              damage(u, t, d, 0); slow(u, t, 0.35, 1.5); for (const s of [-0.7, 0, 0.7]) FX.slash(t.x, t.z, u.facing + s, { r: 2.8, color: s ? 0x38f07a : 0xffffff, life: 0.24, sweep: 0.9 });
              FX.explosion(t.x, t.z, low ? 2.6 : 2, 0x38f07a, { smoke: false }); FX.hit(t.x, 1.3, t.z, 0x38f07a, true); SFX.at('slash', t.x, t.z, 1); if (low) FX.punch(0.5);
              if (t.alive) u.order = { type: 'attack', tgt: t, rp: 0 };
            }
          });
        }
      },
      {
        key: 'W', name: 'Вой стаи', icon: 'howl', cd: 13, cost: 45, range: 0, ind: { type: 'self', r: 3 }, lock: 0.15, ai: { t: 'buff' },
        desc: 'На 4.5 сек: +45% скорости атаки, +20% скорости передвижения и 15% вампиризма от атак.',
        cast(h) {
          const b = addBuff(h, { id: 'howl', dur: 4.5, as: 0.45, ms: 0.2, ls: 0.15 }); if (b) b.fx = FX.aura(h, 0x38f07a, 4.5, 1.6, 'rune', 4);
          SFX.at('dark', h.x, h.z, 0.8); FX.pillar(h.x, h.z, { r: 1.6, h: 13, color: 0x38f07a, life: 0.7 }); FX.shock(h.x, h.z, 6, 0.6, 0.45);
          for (let i = 0; i < 3; i++) after(i * 0.12, () => FX.ring(h.x, h.z, { r0: 0.5, r1: 4 + i * 1.6, color: i ? 0x38f07a : 0xffffff, life: 0.55, tex: 'ringThin' }));
          FX.flame(h.x, 2.4, h.z, { n: 8, color: 0x38f07a, color2: 0x04301a, size: [0.8, 1.8], life: [0.4, 0.9], up: 4, a: 0.5 });
        }
      },
      { key: 'E', name: 'Чутьё хищника', icon: 'paw', passive: true, desc: 'Пассивно: +5 / 10 / 15 / 20 силы атаки и +0.15 / 0.3 / 0.45 / 0.6 скорости передвижения.', stats: l => ({ ad: 5 * l, ms: 0.15 * l }) },
      {
        key: 'R', name: 'Призрачная охота', icon: 'pack', cd: 70, cost: 90, range: 12, ind: { type: 'target', hero: true }, lock: 0.25, ai: { t: 'target', ult: true, hp: 0.6 },
        desc: 'Призрачная стая окружает вражеского героя: три волка по очереди наносят урон и замедляют. Затем Фенрис сам прыгает к цели и на 4 сек получает +50% скорости атаки.',
        cast(h, p) {
          const t = p.unit, dmg = D(h, 52, 8, 0.36); SFX.at('dark', h.x, h.z, 1); castGlow(h, 0x38f07a); FX.aura(t, 0x38f07a, 1.2, t.radius + 1.4, 'rune2', -5);
          for (let i = 0; i < 3; i++) after(i * 0.22, () => {
            if (!t.alive || !h.alive) return; const a = h.facing + 2.1 * (i - 1) + Math.PI, x = t.x + Math.sin(a) * 6, z = t.z + Math.cos(a) * 6;
            FX.explosion(x, z, 1.6, 0x38f07a, { el: 'shadow', smoke: false }); FX.pillar(x, z, { r: 0.9, h: 6, color: 0x38f07a, life: 0.35 });
            homing(h, t, { x, z, y: 1.2, speed: 30, color: 0x38f07a, size: 1.15, mesh: 'shard', onHit: e => { damage(h, e, dmg, 0); slow(h, e, 0.35, 1.2, 'pack'); FX.slash(e.x, e.z, angTo(x, z, e.x, e.z), { r: 3.2, color: i % 2 ? 0xffffff : 0x38f07a, life: 0.24 }); FX.explosion(e.x, e.z, 1.8, 0x38f07a, { smoke: false }); SFX.at('slash', e.x, e.z, 0.8); } });
          });
          after(0.75, () => {
            if (!t.alive || !h.alive || h.stunned) return;
            dashTo(h, t.x, t.z, 44, {
              fly: true, follow: t, stop: 1.5, arc: 1.6, trail: u => FX.flame(u.x, 1 + (u.yOff || 0), u.z, { n: 2, color: 0x38f07a, color2: 0x04301a, size: [0.8, 1.6], life: [0.25, 0.5], up: 0.4, a: 0.5 }),
              onEnd: u => {
                const b = addBuff(u, { id: 'hunt', dur: 4, as: 0.5 }); if (b) b.fx = FX.aura(u, 0xffffff, 4, 1.3, 'ringThin', 7);
                if (!t.alive) return; damage(u, t, dmg * 1.4, 0); FX.explosion(t.x, t.z, 3, 0x38f07a, { el: 'shadow' }); FX.punch(0.8); FX.shock(t.x, t.z, 5, 0.8, 0.35); SFX.at('boom', t.x, t.z, 0.6);
                if (t.alive) u.order = { type: 'attack', tgt: t, rp: 0 };
              }
            });
          });
        }
      }
    ]
  },
  /* ================= 22. Reiji ================= */
  {
    id: 'reiji', name: 'Рэйдзи', title: 'Призрачный ронин', role: 'assassin', roleName: 'Убийца', build: 'assassin', bars: [5, 2, 2, 4], diffc: 3,
    lore: 'Проходит сквозь врагов одним взмахом и отвечает ударом на удар. Его ультимейт рассекает всю линию разом.',
    look: { bulk: 0.94, c1: 0x2a2e4a, c2: 0x1c1f33, c3: 0x3a3340, skin: 0x8a7462, metal: 0xaab0c8, glow: 0x5a5cff, head: 'oni', hair: 0x14141c, chest: 'vest', sh: 'plate', legs: 'boots', weapon: 'katana', wc: 'melee' },
    stats: ST(600, 82, 250, 28, 63, 3.8, 25, 2.8, 0.8, 9.2, 2.9),
    abilities: [
      {
        key: 'Q', name: 'Иай', icon: 'iai', cd: 7, cost: 35, range: 8, ind: { type: 'line', w: 2.4 }, anim: 'thrust', ai: { t: 'gap', escape: true },
        desc: 'Молниеносный рывок с ударом: урон всем врагам на пути.',
        cast(h, p) {
          const dmg = D(h, 62, 9, 0.65), x0 = h.x, z0 = h.z; SFX.at('dash', h.x, h.z); SFX.at('slash', h.x, h.z, 0.8);
          dashTo(h, p.x, p.z, 46, {
            w: 1.6, ribbon: 0x9a9cff, trail: u => FX.sparks(u.x, 1.1, u.z, { n: 2, color: 0xffffff, color2: 0x5a5cff, speed: [1, 5], life: [0.15, 0.4], dir: u.facing + Math.PI, spread: 0.7, w: 0.1, stretch: 0.12 }),
            onHit: (e, u) => { damage(u, e, dmg, 0); FX.slash(e.x, e.z, u.facing, { r: 3, color: 0xffffff, life: 0.22, sweep: 0.6 }); FX.hit(e.x, 1.3, e.z, 0x5a5cff, true); },
            onEnd: u => { FX.beam(x0, z0, u.x, u.z, { color: 0x5a5cff, w: 1.4, life: 0.35, y: 1.1 }); FX.beam(x0, z0, u.x, u.z, { color: 0xffffff, w: 0.35, life: 0.22, y: 1.15 }); FX.slash(u.x, u.z, u.facing, { r: 3.4, color: 0x5a5cff, life: 0.28 }); }
          });
        }
      },
      {
        key: 'W', name: 'Стойка отражения', icon: 'parry', cd: 14, cost: 40, range: 0, ind: { type: 'self', r: 4.2 }, lock: 0.3, ai: { t: 'parry' },
        desc: 'На 1.1 сек принимает стойку: получает на 75% меньше урона. Если за это время его ударили — отвечает круговым ударом с оглушением на 0.7 сек.',
        cast(h) {
          const dmg = D(h, 65, 10, 0.6), t0 = G.time; SFX.at('shield', h.x, h.z, 0.8);
          const b = addBuff(h, { id: 'parry', dur: 1.1, dmgIn: 0.25 }); if (b) b.fx = FX.aura(h, 0x5a5cff, 1.1, 1.9, 'ringThin', 10);
          FX.ring(h.x, h.z, { r0: 3, r1: 1.4, color: 0x9a9cff, life: 0.3 }); FX.glow(h.x, 1.6, h.z, 4, 0x5a5cff, 0.3, 'star');
          G.actors.push({
            update() {
              if (!h.alive || G.time - t0 > 1.1) return false;
              if (h.lastDamageT <= t0 + 0.02) return true;
              SFX.at('slash', h.x, h.z, 1); SFX.at('hit', h.x, h.z, 1); FX.punch(0.6); FX.shock(h.x, h.z, 5, 0.7, 0.3); h.anim.atkT = h.anim.atkDur = 0.35;
              FX.slash(h.x, h.z, h.facing, { r: 4.6, color: 0xffffff, sweep: 6, life: 0.3 }); FX.slash(h.x, h.z, h.facing + 2, { r: 4.2, color: 0x5a5cff, sweep: 6, life: 0.36, y: 0.8 }); FX.ring(h.x, h.z, { r1: 4.4, color: 0x5a5cff, life: 0.35, tex: 'shock' });
              FX.sparks(h.x, 1.2, h.z, { n: 24, color: 0xffffff, color2: 0x5a5cff, speed: [8, 18], life: [0.15, 0.4], ring: true, w: 0.14, stretch: 0.1 });
              for (const e of enemiesIn(h, h.x, h.z, 4.2)) { damage(h, e, dmg, 0); stun(h, e, 0.7); FX.hit(e.x, 1.3, e.z, 0x5a5cff, true); }
              return false;
            }
          });
        }
      },
      {
        key: 'E', name: 'Лунный серп', icon: 'crescent', cd: 8, cost: 40, range: 6, ind: { type: 'cone', r: 6 }, lock: 0.2, ai: { t: 'cone', farm: true },
        desc: 'Широкий взмах перед собой: урон и замедление на 30% на 1.5 сек. Рэйдзи лечится на 25% урона, нанесённого героям.',
        cast(h, p) {
          const dmg = D(h, 55, 8, 0.55); SFX.at('slash', h.x, h.z, 1);
          FX.slash(h.x, h.z, p.dir, { r: 6.2, color: 0x5a5cff, sweep: 2.2, life: 0.3 }); FX.slash(h.x, h.z, p.dir, { r: 5.4, color: 0xffffff, sweep: 2, life: 0.2, y: 1.4 });
          FX.sparks(h.x + Math.sin(p.dir) * 3, 1.1, h.z + Math.cos(p.dir) * 3, { n: 16, color: 0xffffff, color2: 0x5a5cff, speed: [5, 13], life: [0.15, 0.4], dir: p.dir, spread: 1.3, w: 0.12, stretch: 0.1 });
          for (const e of enemiesIn(h, h.x, h.z, 6 + 1)) if (inCone(h, e, p.dir, 0.95, 6)) { const d = damage(h, e, dmg, 0); slow(h, e, 0.3, 1.5); FX.hit(e.x, 1.3, e.z, 0x5a5cff, true); if (e.kind === 'hero' && d > 0) { heal(h, h, d * 0.25); FX.heal(h, 0x5a5cff); } }
        }
      },
      {
        key: 'R', name: 'Семь сечений', icon: 'sevencuts', noReach: true, cd: 70, cost: 90, range: 12, ind: { type: 'line', w: 3.4, fixed: true }, anim: 'thrust', animDur: 0.6, lock: 0.3, ai: { t: 'shot', r: 10, ult: true, hp: 0.55 },
        desc: 'Проносится по прямой, неуязвимый в рывке. Через мгновение все, кого он миновал, получают семь разрезов: большой урон, сильнее по раненым героям.',
        cast(h, p) {
          const dmg = D(h, 150, 22, 0.9), dir = p.dir, x0 = h.x, z0 = h.z, vict = new Set(); SFX.at('dark', h.x, h.z); castGlow(h, 0x5a5cff);
          FX.lineDecal(x0, z0, dir, 12, 3.4, 0x5a5cff, 0.5); addBuff(h, { id: 'sevencut', dur: 0.5, invuln: true });
          dashTo(h, x0 + Math.sin(dir) * 12, z0 + Math.cos(dir) * 12, 60, {
            w: 2.1, ribbon: 0xffffff, trail: u => FX.flame(u.x, 1.1, u.z, { n: 2, color: 0x5a5cff, color2: 0x0a0a40, size: [0.8, 1.6], life: [0.25, 0.5], up: 0.3, a: 0.5 }),
            onHit: e => { vict.add(e); FX.hit(e.x, 1.3, e.z, 0xffffff, false); },
            onEnd: u => {
              const x1 = u.x, z1 = u.z; SFX.at('slash', x1, z1, 1); FX.beam(x0, z0, x1, z1, { color: 0x5a5cff, w: 2.4, life: 0.5, y: 1.1 }); FX.beam(x0, z0, x1, z1, { color: 0xffffff, w: 0.6, life: 0.35, y: 1.15 });
              for (let k = 0; k < 7; k++) after(0.12 + k * 0.05, () => { const f = (k + 0.5) / 7, x = lerp(x0, x1, f), z = lerp(z0, z1, f); FX.slash(x, z, dir + (k % 2 ? 1.2 : -1.2), { r: 3.6, color: k % 2 ? 0xffffff : 0x5a5cff, flip: k % 2 === 0, life: 0.26, sweep: 0.8, y: 0.8 + (k % 3) * 0.35 }); SFX.at('slash', x, z, 0.5); });
              after(0.5, () => {
                FX.shake(0.6); FX.punch(1); FX.shock(lerp(x0, x1, 0.5), lerp(z0, z1, 0.5), 8, 1, 0.45); SFX.at('boom', x1, z1, 0.7);
                for (const e of vict) if (e.alive) { damage(h, e, dmg + (e.kind === 'hero' ? (e.maxHp - e.hp) * 0.12 : 0), 0); FX.explosion(e.x, e.z, 2.4, 0x5a5cff, { el: 'shadow' }); FX.pillar(e.x, e.z, { r: 0.7, h: 10, color: 0xffffff, life: 0.3 }); }
              });
            }
          });
        }
      }
    ]
  }
);

/* ===== roster, part 3: Vint the engineer — laser, drone swarm, heat-seeking rockets, reactor overload ===== */
const VINT = { red: 0xff2d55, pale: 0xffc2cf, hot: 0xffb347, deep: 0x8a0a26 };
const vintOD = h => hasBuff(h, 'overdrive');
// while the reactor is overloaded the basic abilities come back twice as fast
const vintCd = (h, cd) => vintOD(h) ? { cd: cd * 0.5 * 100 / (100 + h.haste) } : undefined;
// where the arm cannon ends in the world (right arm, aimed forward)
function vintMuzzle(h) { const a = h.facing; return { x: h.x + Math.cos(a) * 0.66 + Math.sin(a) * 1.35, z: h.z - Math.sin(a) * 0.66 + Math.cos(a) * 1.35 }; }
// drone and rocket models are built once; every instance is a clone that shares geometry and materials, so effects can drop them freely
const _vint = {};
function vintMesh(kind) {
  if (!_vint.mat) { _vint.mat = new THREE.MeshPhongMaterial({ vertexColors: true, flatShading: true, shininess: 30, specular: 0x333333 }); _vint.gmat = new THREE.MeshBasicMaterial({ vertexColors: true }); }
  if (!_vint[kind]) {
    const g = new THREE.Group(), k = kit(), GL = { g: VINT.red }, brass = 0xb08d4a, dk = 0x23262b;
    if (kind === 'drone') {
      k.i(0.3, brass, 0, 0, 0).y(0.345, 0.345, 0.08, 8, dk, 0, 0.03, 0).y(0.13, 0.13, 0.1, 8, dk, 0, -0.03, 0.26, HPI).y(0.095, 0.095, 0.05, 8, GL, 0, -0.03, 0.31, HPI)
        .c(0.1, 0.24, 6, GL, 0, -0.36, 0, Math.PI).y(0.04, 0.04, 0.22, 5, dk, 0, 0.36, 0).b(0.5, 0.04, 0.16, dk, -0.42, 0.02, -0.06, 0, 0, 0.35).b(0.5, 0.04, 0.16, dk, 0.42, 0.02, -0.06, 0, 0, -0.35)
        .b(0.05, 0.05, 0.05, GL, -0.66, 0.11, -0.06).b(0.05, 0.05, 0.05, GL, 0.66, 0.11, -0.06);
      k.into(g, _vint.mat, _vint.gmat);
      const rot = new THREE.Group(), kr = kit(); kr.b(1.25, 0.02, 0.1, 0x55585e, 0, 0, 0).b(0.1, 0.02, 1.25, 0x55585e, 0, 0, 0).y(0.07, 0.07, 0.06, 6, brass, 0, 0, 0); kr.into(rot, _vint.mat, _vint.gmat); rot.position.y = 0.48; g.add(rot);
      const s = glowSprite(VINT.red, 1.5); s.position.set(0, -0.05, 0.3); g.add(s);
    } else {
      k.y(0.09, 0.09, 0.72, 6, 0xd8d2c4, 0, 0, 0, HPI).c(0.09, 0.28, 6, 0xc0283e, 0, 0, 0.5, HPI).y(0.098, 0.098, 0.08, 6, dk, 0, 0, 0.2, HPI).y(0.075, 0.105, 0.1, 6, dk, 0, 0, -0.4, HPI).y(0.065, 0.065, 0.04, 6, { g: 0xffe6b0 }, 0, 0, -0.46, HPI);
      for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.785; k.b(0.025, 0.22, 0.24, dk, Math.sin(a) * 0.14, Math.cos(a) * 0.14, -0.27, 0, 0, -a); }
      k.into(g, _vint.mat, _vint.gmat);
      const s = glowSprite(0xff9a3a, 2.6); s.position.set(0, 0, -0.62); g.add(s);
    }
    g.traverse(c => { c.castShadow = false; }); if (kind === 'drone') g.children[0].castShadow = true;
    _vint[kind] = g;
  }
  return _vint[kind].clone(true);
}
// laser hit: pure damage, blind, burn marks
function vintZap(h, e, dmg, fromX, fromZ) {
  const dir = angTo(fromX, fromZ, e.x, e.z), ey = e.height * 0.55 + (e.yOff || 0);
  damage(h, e, dmg, 2);
  const b = addBuff(e, { id: 'blind', dur: 2.5, blind: true, src: h, every: 0.25, onTick: u => FX.burst(u.x, u.height * 0.9, u.z, { smoke: true, n: 1, color: 0x3a1018, color2: 0x08080a, speed: [0.1, 0.5], life: [0.4, 0.8], size: [0.5, 1.1], up: 0.8, a: 0.5 }) });
  if (b) b.fx = FX.aura(e, VINT.red, b.dur, e.radius + 0.45, 'ringThin', -9);
  FX.hit(e.x, ey, e.z, VINT.red, true); FX.glow(e.x, ey, e.z, 4.6, VINT.red, 0.3, 'star'); FX.glow(e.x, ey, e.z, 5, 0xffffff, 0.09, 'flare'); FX.light(e.x, 2, e.z, VINT.red, 2.6, 16, 0.35);
  FX.sparks(e.x, ey, e.z, { n: 20, color: 0xffffff, color2: VINT.red, speed: [6, 18], life: [0.15, 0.45], dir, spread: 1.0, w: 0.13, stretch: 0.1 });
  FX.sparks(e.x, ey, e.z, { n: 10, color: VINT.hot, color2: VINT.deep, speed: [2, 7], life: [0.4, 0.9], up: 4, w: 0.09, stretch: 0.05 });
  FX.flame(e.x, ey, e.z, { n: 4, color: VINT.red, color2: VINT.deep, size: [0.7, 1.6], life: [0.25, 0.55], up: 1.2, a: 0.5 }); FX.ring(e.x, e.z, { r1: 2.4, color: VINT.red, life: 0.3, tex: 'shock' }); FX.scorch(e.x, e.z, 1.1, VINT.red, 5);
}
// the beam itself: three stacked ribbons that follow the muzzle and the target while they last, plus a pulse racing down the beam
function vintBeam(h, t, life) {
  const end = () => { const m = vintMuzzle(h); return { x1: m.x, z1: m.z, x2: t.x, z2: t.z }; };
  const layer = (color, w, lf, y, op) => {
    const me = new THREE.Mesh(FX.geo.line, FX.mat('beam', color, 1));
    FX.add(me, lf, (k, m) => { const q = end(); m.position.set(q.x1, y, q.z1); m.rotation.y = angTo(q.x1, q.z1, q.x2, q.z2); m.scale.set(w * (k < 0.12 ? 0.4 + k * 5 : 1 - (k - 0.12) * 0.85) * (0.88 + Math.random() * 0.24), 1, dist(q.x1, q.z1, q.x2, q.z2)); m.material.opacity = op * (1 - k * k * k); });
  };
  layer(VINT.deep, 2.4, life * 1.15, 1.72, 0.55); layer(VINT.red, 1.05, life, 1.75, 0.75); layer(0xffffff, 0.22, life * 0.7, 1.8, 0.75);
  const q = end(), len = dist(q.x1, q.z1, q.x2, q.z2), dir = angTo(q.x1, q.z1, q.x2, q.z2), n = Math.max(3, Math.round(len / 1.1));
  for (let k = 0; k <= n; k++) { const f = k / n, x = lerp(q.x1, q.x2, f), z = lerp(q.z1, q.z2, f); FX.sparks(x, 1.75, z, { n: 2, color: 0xffffff, color2: VINT.red, speed: [1, 5], life: [0.2, 0.5], grav: -2, w: 0.08, stretch: 0.06 }); if (k % 3 === 1) FX.flame(x, 1.75, z, { n: 1, color: VINT.red, color2: VINT.deep, size: [0.4, 0.9], life: [0.2, 0.45], up: 0.5, a: 0.22 }); }
  FX.glow(q.x1, 1.8, q.z1, 3.4, VINT.red, life, 'star'); FX.light(q.x1, 2.2, q.z1, VINT.red, 2.2, 14, 0.3);
  FX.sparks(q.x1, 1.8, q.z1, { n: 10, color: 0xffffff, color2: VINT.red, speed: [4, 12], life: [0.1, 0.3], dir, spread: 0.6, grav: 0 });
  FX.ring(q.x1, q.z1, { r1: 1.8, color: VINT.red, life: 0.25, tex: 'shock', y: 0.2 });
}
// one combat drone: circles its owner, picks the enemy nearest to itself (heroes first) and fires a short bolt
function vintDrone(h, i, n, dur, dmg, gen) {
  const m = vintMesh('drone'), e = FX.add(m, dur + 5, null), ph = i / n * TAU, R = 2.3, rot = m.children[m.children.length - 2];
  let x = h.x, y = 1.5, z = h.z, el = 0, shotT = 0.45 + i * (0.8 / n), face = h.facing, fl = 0;
  m.position.set(x, y, z); m.scale.setScalar(0.01);
  G.actors.push({
    update(dt) {
      el += dt;
      if (!h.alive || h.droneGen !== gen || el >= dur) { e.dead = true; FX.sparks(x, y, z, { n: 8, color: 0xffffff, color2: VINT.red, speed: [2, 7], life: [0.2, 0.45], w: 0.09 }); FX.glow(x, y, z, 2.2, VINT.red, 0.2); return false; }
      const a = ph + el * 2.0, tx = h.x + Math.sin(a) * R, tz = h.z + Math.cos(a) * R, ty = 2.75 + Math.sin(el * 3.1 + i * 2) * 0.22 + (h.yOff || 0), q = Math.min(1, dt * 8);
      x += (tx - x) * q; y += (ty - y) * q; z += (tz - z) * q; fl = Math.max(0, fl - dt * 5);
      let want = a + HPI; shotT -= dt;
      let tg = null, bd = 1e9; for (const u of enemiesIn(h, h.x, h.z, 8)) { if (u.kind === 'monster' && !u.target) continue; const d = dist(x, z, u.x, u.z) - (u.kind === 'hero' ? 4 : 0); if (d < bd) { bd = d; tg = u; } }
      if (tg) {
        want = angTo(x, z, tg.x, tg.z);
        if (shotT <= 0) {
          shotT = 0.8; fl = 1; const ey = tg.height * 0.5 + (tg.yOff || 0), mx = x + Math.sin(want) * 0.35, mz = z + Math.cos(want) * 0.35;
          FX.bolt(mx, y - 0.05, mz, tg.x, ey, tg.z, { color: VINT.red, w: 0.34, jag: 0.1, life: 0.13, fork: false }); FX.glow(mx, y, mz, 2.4, VINT.red, 0.14, 'star');
          FX.hit(tg.x, ey, tg.z, VINT.red, false); FX.sparks(tg.x, ey, tg.z, { n: 4, color: VINT.hot, color2: VINT.deep, speed: [2, 6], life: [0.2, 0.45], up: 2, w: 0.08 });
          SFX.at('shoot', x, z, 0.3); damage(h, tg, dmg, 1); slow(h, tg, 0.15, 1, 'droneslow');
        }
      } else if (shotT < 0.15) shotT = 0.15;
      face += angDiff(face, want) * Math.min(1, dt * 10);
      m.position.set(x, y, z); m.rotation.set(0.12 + fl * -0.25, face, Math.sin(el * 2.4 + i) * 0.1); m.scale.setScalar(Math.max(0.01, Math.min(1, el / 0.25, (dur - el) / 0.25)) * (1.2 + fl * 0.18));
      rot.rotation.y += dt * 42;
      if (Math.random() < dt * 9) FX.trail(x, y - 0.4, z, VINT.red, 0.3, 1);
      return true;
    }
  });
}
// heat-seeking rocket: pops up out of a pod, tips over and runs its target down; it cannot be outrun or dodged
function vintRocket(h, t, dmg, k) {
  const side = k % 2 ? 1 : -1, a = h.facing, m = vintMesh('rocket'), e = FX.add(m, 30, null), rib = FX.ribbon(0xffc27a, 0.6, 22);
  let x = h.x + Math.cos(a) * 0.55 * side - Math.sin(a) * 0.4, y = 3.1 + (h.yOff || 0), z = h.z - Math.sin(a) * 0.55 * side - Math.cos(a) * 0.4;
  let vx = Math.cos(a) * side * 3.5 + Math.sin(a) * 3 + rand(-1.5, 1.5), vy = 15, vz = -Math.sin(a) * side * 3.5 + Math.cos(a) * 3 + rand(-1.5, 1.5), sp = 13, age = 0, sm = 0;
  SFX.at('rocket', x, z, 0.9); FX.glow(x, y, z, 2.6, VINT.hot, 0.18, 'star'); FX.flame(x, y - 0.3, z, { n: 5, color: 0xffd9a0, color2: 0xff4a10, size: [0.6, 1.4], life: [0.2, 0.5], up: -2, a: 0.6 });
  FX.burst(x, y - 0.4, z, { smoke: true, n: 5, color: 0x9a9aa0, color2: 0x202024, speed: [0.5, 2.5], life: [0.6, 1.3], size: [0.8, 2.2], up: -1, a: 0.4 }); FX.light(x, y, z, VINT.hot, 1.8, 12, 0.3);
  const mark = FX.aura(t, VINT.red, 8, t.radius + 1.2, 'rune2', -5); m.position.set(x, y, z);
  const done = () => { e.dead = true; mark.dead = true; rib.end(); };
  G.actors.push({
    update(dt) {
      age += dt; const ty = t.height * 0.5 + (t.yOff || 0);
      if (!t.alive) { done(); FX.explosion(x, z, 1.4, VINT.hot, { smoke: true }); return false; }
      const dx = t.x - x, dy = ty - y, dz = t.z - z, d = Math.hypot(dx, dy, dz) || 0.001, v = Math.hypot(vx, vy, vz) || 1, turn = Math.min(1, dt * (1 + age * age * 16));
      sp = Math.min(30, sp + 26 * dt);
      const ux = vx / v + (dx / d - vx / v) * turn, uy = vy / v + (dy / d - vy / v) * turn, uz = vz / v + (dz / d - vz / v) * turn, ul = Math.hypot(ux, uy, uz) || 1;
      vx = ux / ul * sp; vy = uy / ul * sp; vz = uz / ul * sp; x += vx * dt; y = Math.max(0.7, y + vy * dt); z += vz * dt;
      if (d < sp * dt + 1.0 || age > 7) {
        done(); const hx = t.x, hz = t.z; damage(h, t, dmg, 1);
        FX.explosion(hx, hz, 2.5, 0xff8a2a, { el: 'fire' }); FX.shock(hx, hz, 5, 0.8, 0.35); FX.debris(hx, 0.4, hz, { n: 5, color: 0x3a3a40, speed: [3, 8], up: 8, size: [0.12, 0.3] });
        FX.sparks(hx, 1.2, hz, { n: 16, color: 0xfff0c0, color2: 0xff5a10, speed: [6, 18], life: [0.2, 0.6], up: 4, w: 0.13 }); SFX.at('boom', hx, hz, 0.8); FX.hitstop(0.03);
        return false;
      }
      m.position.set(x, y, z); m.lookAt(x + vx, y + vy, z + vz); m.rotateZ(age * 9); rib.add(x, y, z);
      const bx = x - vx / sp * 0.6, by = y - vy / sp * 0.6, bz = z - vz / sp * 0.6;
      FX.flame(bx, by, bz, { n: 1, color: 0xffe0a8, color2: 0xff4a10, size: [0.5, 1.0], life: [0.1, 0.22], up: 0, speed: [0, 0.5], a: 0.7 });
      if (Math.random() < 0.6) FX.sparks(bx, by, bz, { n: 1, color: 0xffe9b0, color2: 0xff5a10, speed: [1, 4], life: [0.15, 0.4], w: 0.07 });
      sm += dt; if (sm > 0.035) { sm = 0; FX.burst(bx, by, bz, { smoke: true, n: 1, color: 0x8e8e96, color2: 0x1c1c20, speed: [0.1, 0.7], life: [0.7, 1.4], size: [0.45, 1.7], up: 0.5, a: 0.34 }); }
      return true;
    }
  });
}

HEROES.push(
  /* ================= 23. Vint ================= */
  {
    id: 'vint', name: 'Винт', title: 'Мастер реактора', role: 'mage', roleName: 'Инженер', build: 'tech', bars: [5, 1, 2, 1], diffc: 3,
    lore: 'Хрупкий механик с реактором за спиной. Жжёт лазером, выпускает дронов и достаёт ракетами через пол-карты, а «Перегрузка» позволяет сделать всё это ещё раз.',
    look: { bulk: 0.98, h: 0.9, c1: 0x35505a, c2: 0x263840, c3: 0x3a2c22, skin: 0x8a7462, metal: 0xb08d4a, glow: 0xff2d55, head: 'gizmo', chest: 'tech', sh: 'round', legs: 'boots', weapon: 'lasergun', wc: 'laser', back: 'reactor' },
    stats: ST(560, 78, 480, 52, 48, 2.6, 21, 2.4, 0.72, 8.9, 9.8), projMesh: 'bolt', atkSfx: 'shoot',
    abilities: [
      {
        key: 'Q', name: 'Лазер', icon: 'laser', cd: 7, cost: 55, range: 10.5, ind: { type: 'target' }, anim: 'shoot', animDur: 0.5, lock: 0.3, ai: { t: 'target' },
        desc: 'Мгновенный луч по цели: чистый урон, который игнорирует защиту, и ослепление на 2.5 сек — атаки цели промахиваются. Под «Перегрузкой» луч перескакивает ещё на двух врагов.',
        cast(h, p) {
          const t = p.unit, dmg = D(h, 80, 12.5, 0, 0.6), m = vintMuzzle(h); SFX.at('laser', h.x, h.z, 1); FX.shake(0.18);
          vintBeam(h, t, 0.4); vintZap(h, t, dmg, m.x, m.z);
          if (vintOD(h)) {
            const seen = new Set([t.id]); let from = t;
            for (let k = 0; k < 2; k++) {
              const e = nearestEnemyTo(h, from.x, from.z, 6.5, seen); if (!e) break; seen.add(e.id); const f = from;
              after(0.09 * (k + 1), () => {
                if (!e.alive) return; const y = 1.6;
                FX.beam(f.x, f.z, e.x, e.z, { color: VINT.deep, w: 2.6, life: 0.4, y }); FX.beam(f.x, f.z, e.x, e.z, { color: VINT.red, w: 1.4, life: 0.34, y: y + 0.03 }); FX.beam(f.x, f.z, e.x, e.z, { color: 0xffffff, w: 0.35, life: 0.24, y: y + 0.06 });
                vintZap(h, e, dmg * 0.7, f.x, f.z); SFX.at('zap', e.x, e.z, 0.6);
              });
              from = e;
            }
          }
          return vintCd(h, 7);
        }
      },
      {
        key: 'W', name: 'Рой дронов', icon: 'drone', cd: 16, cost: 65, range: 0, ind: { type: 'self', r: 8 }, lock: 0.15, ai: { t: 'nova', r: 7, farm: true },
        desc: 'Выпускает 3 боевых дрона на 7 сек. Они кружат вокруг Винта и расстреливают врагов в радиусе 8, выбирая в первую очередь героев; каждое попадание замедляет на 15%. Под «Перегрузкой» дронов 5.',
        cast(h) {
          const n = vintOD(h) ? 5 : 3, dmg = D(h, 11, 1.9, 0, 0.07); h.droneGen = (h.droneGen || 0) + 1; SFX.at('drone', h.x, h.z, 1);
          for (let i = 0; i < n; i++) vintDrone(h, i, n, 7, dmg, h.droneGen);
          FX.ring(h.x, h.z, { r0: 0.5, r1: 3.2, color: VINT.red, life: 0.45, tex: 'ringThin' }); FX.ring(h.x, h.z, { r1: 8, color: VINT.red, life: 0.6, tex: 'ringThin', op: 0.45 }); FX.pillar(h.x, h.z, { r: 0.9, h: 6, color: VINT.red, life: 0.4, op: 0.5 });
          FX.sparks(h.x, 1.6, h.z, { n: 14, color: 0xffffff, color2: VINT.red, speed: [3, 9], life: [0.2, 0.5], up: 5, w: 0.1 }); FX.burst(h.x, 1.4, h.z, { smoke: true, n: 4, color: 0x8e8e96, color2: 0x1c1c20, speed: [0.5, 2], life: [0.5, 1], size: [0.8, 2], up: 1.5, a: 0.35 });
          return vintCd(h, 16);
        }
      },
      {
        key: 'E', name: 'Самонаводящиеся ракеты', icon: 'rocket', cd: 15, cost: 70, range: 34, ind: { type: 'self', r: 34 }, anim: 'launch', animDur: 0.6, lock: 0.2, ai: { t: 'missile' },
        desc: 'Запускает по ракете в двух ближайших вражеских героев в огромном радиусе. Ракеты сами находят цель, от них нельзя уклониться. На крипов и чудовищ не наводятся. Под «Перегрузкой» целей четыре.',
        cast(h) {
          const n = vintOD(h) ? 4 : 2, dmg = D(h, 95, 14.5, 0, 0.7);
          const ts = G.heroes.filter(o => o.alive && o.team !== h.team && udist(h, o) <= 34).sort((a, b) => udist(h, a) - udist(h, b)).slice(0, n);
          if (!ts.length) { if (h.isPlayer) { UI.msg('Нет вражеских героев в радиусе ракет'); SFX.play('deny'); } return false; }
          ts.forEach((t, k) => after(k * 0.11, () => { if (h.alive) vintRocket(h, t, dmg, k); }));
          FX.ring(h.x, h.z, { r1: 2.4, color: 0xc96a1e, life: 0.35, tex: 'shock', op: 0.6 }); FX.shake(0.2);
          return vintCd(h, 15);
        }
      },
      {
        key: 'R', name: 'Перегрузка реактора', icon: 'core', cd: 20, cost: 100, range: 0, ind: { type: 'self', r: 3 }, anim: 'overload', animDur: 0.9, lock: 0.75, ai: { t: 'rearm', ult: true },
        desc: 'Через 0.7 сек разгоняет реактор: лазер, дроны и ракеты мгновенно перезаряжаются. Следующие 6 / 8 / 10 сек они перезаряжаются вдвое быстрее и усилены: лазер бьёт по трём целям, дронов пять, ракет четыре. Оглушение срывает разгон.',
        cast(h) {
          SFX.at('overload', h.x, h.z, 1); h.hot = G.time + 0.8;
          FX.ring(h.x, h.z, { r0: 6, r1: 0.8, color: VINT.red, life: 0.7, tex: 'swirl', spin: -9, op: 0.7 }); FX.ring(h.x, h.z, { r0: 4.5, r1: 0.6, color: VINT.red, life: 0.7, tex: 'ringThin', op: 0.8 }); FX.sphere(h.x, 1.6, h.z, { r0: 4.2, r1: 0.9, color: VINT.red, life: 0.7, op: 0.5 }); FX.zone(h.x, h.z, 3.2, VINT.red, 0.75, { tex: 'rune2', spin: 9, op: 0.9, follow: h }); FX.pillar(h.x, h.z, { r: 0.8, h: 7, color: 0xb0122e, life: 0.7, op: 0.3, grow: true });
          let el = 0, nx = 0;
          G.actors.push({
            update(dt) {
              el += dt; if (!h.alive) return false;
              if (el < 0.7) {
                if (h.stunned) { h.cd[3] = Math.min(h.cd[3], 8); FX.smoke(h.x, h.z, 1.6, 6, 0x3a3a40); FX.sparks(h.x, 1.5, h.z, { n: 12, color: 0xffffff, color2: VINT.red, speed: [3, 9], life: [0.2, 0.5] }); return false; }
                if (el >= nx) { nx = el + 0.07; const k = el / 0.7; FX.implode(h.x, 1.7, h.z, 5 - k * 2, { n: 8 + Math.round(k * 10), color: VINT.red, color2: 0xffffff, life: 0.26, streak: true }); FX.sparks(h.x, 0.3, h.z, { n: 3, color: 0xffffff, color2: VINT.red, speed: [0.5, 2], life: [0.3, 0.6], up: 7 + k * 6, rad: 1.6, ring: true, grav: 0, w: 0.08, stretch: 0.08 }); FX.arcs(h.x, 1.6, h.z, 1.6 + k, 1, VINT.red); FX.glow(h.x, 1.9, h.z, 2 + k * 5, VINT.red, 0.12); }
                return true;
              }
              const x = h.x, z = h.z; for (let i = 0; i < 3; i++) h.cd[i] = 0;
              const od = 4 + 2 * Math.max(1, h.al[3]), b = addBuff(h, { id: 'overdrive', dur: od, ms: 0.12, every: 0.1, onTick: u => {
                u.hot = G.time + 0.3; const a = u.facing + Math.PI, bx = u.x + Math.sin(a) * 0.7, bz = u.z + Math.cos(a) * 0.7;
                FX.sparks(bx, 2.3, bz, { n: 2, color: 0xffffff, color2: VINT.red, speed: [2, 6], life: [0.2, 0.5], up: 6, grav: -6, w: 0.08, stretch: 0.07 }); FX.flame(bx, 2.5, bz, { n: 1, color: VINT.red, color2: VINT.deep, size: [0.5, 1.2], life: [0.25, 0.5], up: 2.5, a: 0.4 });
                if (Math.random() < 0.3) FX.arcs(u.x, 1.5, u.z, 1.8, 1, VINT.red);
              } });
              if (b) b.fx = FX.aura(h, VINT.red, od, 2.0, 'rune2', 7);
              FX.explosion(x, z, 2.4, 0xc4183a, { el: 'elec' }); FX.pillar(x, z, { r: 1.3, h: 13, color: 0xb0122e, life: 0.7, op: 0.3 }); FX.shock(x, z, 9, 1, 0.5); FX.punch(0.8); FX.shake(0.5);
              for (let i = 0; i < 3; i++) after(i * 0.09, () => FX.ring(x, z, { r0: 0.6, r1: 5 + i * 2.2, color: i === 1 ? VINT.red : 0xb0122e, life: 0.55, tex: 'ringThin', op: 0.8 - i * 0.2 }));
              FX.sparks(x, 1.4, z, { n: 26, color: VINT.pale, color2: VINT.red, speed: [8, 22], life: [0.2, 0.6], ring: true, up: 3, w: 0.11, stretch: 0.1 }); FX.light(x, 3, z, VINT.red, 2, 22, 0.5);
              return false;
            }
          });
        }
      }
    ]
  }
);
/* ===== roster, part 4: Toplak the drowned diver — anchor on a chain, bilge aura (toggle), a gut that grows with every kill, devour ===== */
const TOP = { c: 0xff8c2a, pale: 0xffd9a8, deep: 0x7a3206, rot: 0x9fb832, murk: 0x3c4a1e };
function topAnchor() {
  if (!_vint.mat) vintMesh('rocket');
  if (!_vint.anchor) {
    const g = new THREE.Group(), k = kit(), met = 0x8a7446, GL = { g: TOP.c };
    k.b(0.12, 0.12, 1.5, met, 0, 0, -0.1).b(0.62, 0.09, 0.09, 0x4a3524, 0, 0, -0.62).b(0.14, 0.14, 0.72, met, -0.3, 0, 0.5, 0, 0.96).b(0.14, 0.14, 0.72, met, 0.3, 0, 0.5, 0, -0.96)
      .b(0.28, 0.07, 0.3, met, -0.62, 0, 0.27, 0, 0.3).b(0.28, 0.07, 0.3, met, 0.62, 0, 0.27, 0, -0.3).o(0.14, GL, 0, 0, 0.72, 1, 1, 1.5).b(0.05, 0.06, 1.2, GL, 0, 0.07, -0.05).i(0.12, met, 0, 0, -0.9);
    k.into(g, _vint.mat, _vint.gmat); const s = glowSprite(TOP.c, 2.4); s.position.set(0, 0, 0.7); g.add(s); g.traverse(c => { c.castShadow = false; }); g.children[0].castShadow = true; _vint.anchor = g;
  }
  return _vint.anchor.clone(true);
}
// a chain of n links stretched between two points every frame (shared geometry and material)
function topChain(n) {
  if (!_vint.linkGeo) { _vint.linkGeo = new THREE.BoxGeometry(0.17, 0.07, 0.36); _vint.linkMat = new THREE.MeshPhongMaterial({ color: 0x4a4d54, flatShading: true, shininess: 40 }); }
  const g = new THREE.Group(); for (let i = 0; i < n; i++) g.add(new THREE.Mesh(_vint.linkGeo, _vint.linkMat)); return g;
}
function topChainSet(g, ax, ay, az, bx, by, bz) {
  const n = g.children.length, len = Math.hypot(bx - ax, bz - az), dir = Math.atan2(bx - ax, bz - az), sag = Math.min(0.7, len * 0.05), sc = Math.max(0.5, len / n / 0.36 * 1.05);
  for (let k = 0; k < n; k++) { const f = (k + 0.5) / n, c = g.children[k]; c.position.set(lerp(ax, bx, f), lerp(ay, by, f) - Math.sin(f * Math.PI) * sag, lerp(az, bz, f)); c.rotation.set(0, dir, (k % 2) * HPI); c.scale.z = sc; }
}
const topRotDps = h => [24, 42, 60, 78][Math.max(1, h.al[1]) - 1] + 0.14 * h.ap;
// bilge aura: runs while switched on; hurts and slows enemies around, costs the owner health (never the last point)
function topRot(h) {
  const R = 4.3; let acc = 0, idle = 0, t = 0;
  const z1 = FX.zone(h.x, h.z, R, TOP.rot, 3600, { follow: h, tex: 'swirl', spin: -1.4, op: 0.5 }), z2 = FX.zone(h.x, h.z, R, TOP.c, 3600, { follow: h, tex: 'ringThin', spin: 0.5, op: 0.55 });
  FX.ring(h.x, h.z, { r1: R + 0.4, color: TOP.rot, life: 0.4, tex: 'shock', op: 0.7 }); SFX.at('poison', h.x, h.z, 1);
  G.actors.push({
    update(dt) {
      if (!h.alive || !h.rotOn) { h.rotOn = false; z1.dead = z2.dead = true; FX.ring(h.x, h.z, { r0: R, r1: 0.6, color: TOP.rot, life: 0.3, tex: 'ringThin', op: 0.6 }); return false; }
      acc += dt; t += dt;
      if (FX.near(h.x, h.z, 50)) {
        if (Math.random() < dt * 16) { const a = rand(TAU), r = Math.sqrt(Math.random()) * R; FX.burst(h.x + Math.sin(a) * r, 0.5, h.z + Math.cos(a) * r, { smoke: true, n: 1, color: TOP.murk, color2: 0x10140a, speed: [0.2, 0.9], life: [0.7, 1.4], size: [1, 2.6], up: 1, a: 0.42 }); }
        if (Math.random() < dt * 22) { const a = rand(TAU), r = Math.sqrt(Math.random()) * R; FX.burst(h.x + Math.sin(a) * r, 0.2, h.z + Math.cos(a) * r, { n: 1, color: TOP.rot, color2: 0x2a3800, speed: [0.1, 0.4], life: [0.5, 1.1], size: [0.28, 0.04], up: 2.6, grav: 1.5 }); }
        if (Math.random() < dt * 5) FX.flame(h.x + rand(-R, R) * 0.6, 0.7, h.z + rand(-R, R) * 0.6, { n: 1, color: TOP.rot, color2: 0x1a2400, size: [1, 2.2], life: [0.5, 1], up: 0.8, a: 0.22 });
      }
      while (acc >= 0.25) {
        acc -= 0.25; const d = topRotDps(h) * 0.25, es = enemiesIn(h, h.x, h.z, R), sl = 0.17 + 0.03 * Math.max(1, h.al[1]);
        for (const e of es) { damage(h, e, d, 1, { dot: true }); slow(h, e, sl, 0.5, 'bilge'); if (Math.random() < 0.5) FX.flame(e.x, 1.1, e.z, { n: 1, color: TOP.rot, color2: 0x1a2400, size: [0.5, 1.1], life: [0.3, 0.6], up: 1.2, a: 0.4 }); }
        if (h.hp > d * 0.5 + 1) h.hp -= d * 0.5;
        if (h.ai) { idle = es.length ? 0 : idle + 0.25; if (idle > 1.5 || h.hp < h.maxHp * 0.2) h.rotOn = false; }
      }
      return true;
    }
  });
}

HEROES.push(
  /* ================= 24. Toplak ================= */
  {
    id: 'toplak', name: 'Топляк', title: 'Утопленник с якорем', role: 'front', roleName: 'Ловец', build: 'hooker', bars: [3, 5, 4, 1], diffc: 3,
    lore: 'Ржавый водолаз, которого не приняла трясина. Выдёргивает врага якорем из-за чужих спин, травит всех вокруг гнилой водой и заживо пожирает пойманного. С каждой смертью рядом становится толще.',
    look: { bulk: 1.5, h: 1.0, c1: 0x4a5548, c2: 0x2f3832, c3: 0x4a3524, skin: 0x6f8a7a, metal: 0x8a7446, glow: 0xff8c2a, head: 'diver', chest: 'gut', sh: 'round', legs: 'greaves', weapon: 'anchor', wc: 'melee', back: 'tanks', arm: 1.1 },
    stats: ST(800, 106, 280, 34, 56, 3.2, 28, 3.0, 0.64, 8.3, 2.8),
    onHeroDeath(o) { o.heap++; recalcHero(o); if (o.alive) { FX.heal(o, TOP.c); FX.ring(o.x, o.z, { r0: 3, r1: 0.8, color: TOP.c, life: 0.4, tex: 'ringThin' }); if (o === G.player) FX.text(o.x, o.height + 1.2, o.z, 'утроба +1', '#ffb066', 14); } },
    abilities: [
      {
        key: 'Q', name: 'Якорь', icon: 'anchor', cd: 12, cost: 60, range: 15, ind: { type: 'line', w: 1.8, fixed: true }, anim: 'thrust', animDur: 0.5, lock: 0.45, ai: { t: 'shot', sp: 30 },
        desc: 'Бросает якорь на цепи. Первый враг на пути — герой, крип или чудовище — получает чистый урон и притаскивается к Топляку. Якорь летит сквозь стены и деревья.',
        cast(h, p) {
          const dmg = D(h, 72, 11, 0.5), dir = p.dir, sx = Math.sin(dir), cz = Math.cos(dir), m = topAnchor(), e = FX.add(m, 40, null), ch = topChain(24), ce = FX.add(ch, 40, null);
          let x = h.x + sx * 1.3, z = h.z + cz * 1.3, left = p.range, out = true, vic = null, hb = null, sp = 0;
          h.rig.handR.visible = false; m.scale.setScalar(1.25); SFX.at('arrow', h.x, h.z, 1); SFX.at('hit', h.x, h.z, 0.5); FX.ring(h.x, h.z, { r1: 2.2, color: TOP.c, life: 0.3, tex: 'shock', op: 0.7 });
          const finish = () => { e.dead = ce.dead = true; h.rig.handR.visible = true; };
          G.actors.push({
            update(dt) {
              const hx = h.x + Math.sin(h.facing) * 0.9, hz = h.z + Math.cos(h.facing) * 0.9;
              if (out) {
                const st = 30 * dt, n = Math.max(1, Math.ceil(st / 0.5));
                for (let s = 0; s < n && out; s++) {
                  x += sx * st / n; z += cz * st / n; left -= st / n;
                  for (const u of G.units) {
                    if (!u.alive || u.struct || u.team === h.team || u.invuln) continue; const rr = 0.95 + u.radius, dx = u.x - x, dz = u.z - z; if (dx * dx + dz * dz > rr * rr) continue;
                    damage(h, u, dmg, 2); FX.explosion(u.x, u.z, 2, TOP.c, { smoke: false }); FX.sparks(u.x, 1.2, u.z, { n: 16, color: 0xffffff, color2: TOP.c, speed: [5, 14], life: [0.2, 0.5], dir: dir + Math.PI, spread: 1.1 }); SFX.at('hit', u.x, u.z, 1); FX.hitstop(0.04);
                    if (u.alive && !u.boss) { vic = u; hb = addBuff(u, { id: 'hooked', dur: 3, stun: true, src: h }); u.dash = null; u.forced = null; }
                    out = false; break;
                  }
                  if (left <= 0 || !h.alive) out = false;
                }
              } else {
                sp = Math.min(38, sp + 160 * dt); const dx = hx - x, dz = hz - z, d = Math.hypot(dx, dz), st = sp * dt, stop = vic ? 2.1 : 1.0;
                if (d <= st + stop || !h.alive) {
                  finish();
                  if (vic && vic.alive) { const q = NAV.nearest(vic.x, vic.z); vic.x = q.x; vic.z = q.z; if (hb) hb.dur = 0; stun(h, vic, 0.35); FX.ring(vic.x, vic.z, { r1: 2.4, color: TOP.c, life: 0.3, tex: 'shock' }); FX.smoke(vic.x, vic.z, 1.2, 4, 0x3a3d42); }
                  return false;
                }
                x += dx / d * st; z += dz / d * st;
                if (vic) { if (vic.alive) { vic.x = x; vic.z = z; vic.path = null; if (Math.random() < 0.6) FX.sparks(x, 0.3, z, { n: 1, color: TOP.pale, color2: TOP.deep, speed: [1, 4], life: [0.2, 0.4], w: 0.08 }); } else vic = null; }
              }
              const face = out ? dir : Math.atan2(x - hx, z - hz); m.position.set(x, 1.35, z); m.rotation.set(0, face, out ? G.time * 14 : 0);
              topChainSet(ch, hx, 1.5, hz, x - Math.sin(face) * 1.1, 1.35, z - Math.cos(face) * 1.1);
              if (out) FX.sparks(x, 1.35, z, { n: 1, color: TOP.pale, color2: TOP.deep, speed: [1, 3], life: [0.2, 0.4], grav: -5, w: 0.08 });
              return true;
            }
          });
        }
      },
      {
        key: 'W', name: 'Гнилая вода', icon: 'bubbles', cd: 0.5, cost: 0, range: 0, ind: { type: 'self', r: 4.3 }, toggle: true, lock: 0, active: h => !!h.rotOn, ai: { t: 'toggle', r: 4.3 },
        desc: 'Включается и выключается. Пока включена, враги вокруг получают урон каждую секунду и замедляются на 20 / 23 / 26 / 29%, а сам Топляк теряет здоровье — вдвое медленнее, и умереть от этого не может.',
        cast(h) { h.rotOn = !h.rotOn; if (h.rotOn) topRot(h); else SFX.at('ui', h.x, h.z, 1); }
      },
      {
        key: 'E', name: 'Ненасытная утроба', icon: 'gut', passive: true, count: h => h.heap,
        desc: 'Пассивно: +4 / 8 / 12 / 16 защиты. Каждая смерть вражеского героя рядом с Топляком или от его руки навсегда даёт +22 / 30 / 38 / 46 здоровья. Заряды копятся с начала матча, даже пока умение не изучено.',
        stats: (l, h) => ({ def: 4 * l, hp: (14 + 8 * l) * (h.heap || 0) })
      },
      {
        key: 'R', name: 'Пожирание', icon: 'jaws', cd: 55, cost: 100, range: 3.6, ind: { type: 'target', hero: true }, anim: 'devour', animDur: 2.6, lock: 2.6, ai: { t: 'target', ult: true, hp: 0.8 },
        desc: 'Хватает вражеского героя и 2.6 сек рвёт его: цель оглушена, семь раз получает урон, а Топляк лечится на весь нанесённый урон. Оглушение самого Топляка прерывает пир.',
        cast(h, p) {
          const t = p.unit, tick = D(h, 22, 3.6, 0.15) + h.maxHp * 0.008, b = addBuff(t, { id: 'devour', dur: 2.6, stun: true, src: h }); if (!b) return false;
          const L = b.dur; let el = 0, nx = 0.2, n = 0; pullTo(t, h.x, h.z, 24, 1.8); SFX.at('dark', h.x, h.z, 1); h.order = null; h.path = null;
          const ch = topChain(10), ce = FX.add(ch, 10, null), mark = FX.aura(t, TOP.c, L, t.radius + 1, 'rune2', -6);
          const stop = () => { ce.dead = true; mark.dead = true; h.castLock = 0; h.anim.castT = 0; const bb = t.buffs.find(q => q.id === 'devour'); if (bb) bb.dur = 0; };
          G.actors.push({
            update(dt) {
              el += dt; if (!h.alive || h.stunned || !t.alive || el >= L) { stop(); if (h.alive && t.alive && !h.stunned) h.order = { type: 'attack', tgt: t, rp: 0 }; return false; }
              h.castLock = L - el; h.facing = angTo(h.x, h.z, t.x, t.z); topChainSet(ch, h.x, 1.6, h.z, t.x, 1.2 + Math.sin(el * 20) * 0.2, t.z);
              if (el >= nx && n < 7) {
                nx += (L - 0.25) / 7; n++; const d = damage(h, t, tick, 1); if (d > 0) heal(h, h, d, true);
                FX.slash(t.x, t.z, h.facing + (n % 2 ? 0.8 : -0.8), { r: 2.8, color: n % 2 ? TOP.c : 0xffffff, flip: n % 2 === 0, life: 0.22 }); FX.hit(t.x, 1.3, t.z, TOP.c, true); SFX.at('slash', t.x, t.z, 0.8);
                FX.sparks(t.x, 1.3, t.z, { n: 8, color: TOP.pale, color2: TOP.deep, speed: [3, 9], life: [0.2, 0.5], dir: h.facing + Math.PI, spread: 1.4, w: 0.1 }); FX.implode(h.x, 1.5, h.z, 2.4, { n: 5, color: TOP.c, color2: 0xffffff, life: 0.25, streak: true });
                FX.beam(t.x, t.z, h.x, h.z, { color: TOP.c, w: 0.9, life: 0.2, y: 1.4 }); if (n === 7) { FX.explosion(t.x, t.z, 2.6, TOP.c, { smoke: false }); FX.punch(0.6); FX.heal(h, TOP.c); }
              }
              return true;
            }
          });
        }
      }
    ]
  }
);

/* ===== roster, part 5: Kolombina the card-sharp jester (support) and Kostyan the skeleton skater (assassin) ===== */
const KOL = { c: 0xff4d7a, pale: 0xffc2d2, deep: 0x8a0f34, card: 0xf4efe6 };
// a playing card lying flat (x = width, z = length); every instance is a clone sharing geometry and materials
function kolCardMesh(sc) {
  if (!_vint.mat) vintMesh('rocket');
  if (!_vint.card) {
    const g = new THREE.Group(), k = kit(), GL = { g: KOL.c };
    k.b(0.5, 0.025, 0.72, KOL.card, 0, 0, 0).o(0.13, GL, 0, 0.018, 0, 1, 0.12, 1.4).o(0.13, GL, 0, -0.018, 0, 1, 0.12, 1.4).b(0.07, 0.035, 0.07, GL, -0.17, 0, 0.27).b(0.07, 0.035, 0.07, GL, 0.17, 0, -0.27);
    k.into(g, _vint.mat, _vint.gmat); g.traverse(c => { c.castShadow = false; }); _vint.card = g;
  }
  const m = _vint.card.clone(true); m.scale.setScalar(sc || 1); return m;
}
// burst of loose cards
function kolBurst(x, y, z, n, col) {
  FX.debris(x, y, z, { n: n || 6, color: KOL.card, speed: [2, 6], up: 6, size: [0.14, 0.24] }); FX.sparks(x, y, z, { n: (n || 6) * 2, color: 0xffffff, color2: col || KOL.c, speed: [3, 10], life: [0.2, 0.5], up: 3, w: 0.1 });
}
// up to three small cards circling over a marked hero
function kolOrbit(h, t) {
  const g = new THREE.Group(), e = FX.add(g, 3600, null), id = 'cards' + h.id; for (let i = 0; i < 3; i++) { const c = kolCardMesh(0.62); c.rotation.x = HPI; g.add(c); }
  (t.cardFx || (t.cardFx = {}))[h.id] = true; let a = rand(TAU);
  G.actors.push({
    update(dt) {
      const b = t.buffs.find(q => q.id === id); if (!b || !t.alive) { e.dead = true; t.cardFx[h.id] = false; return false; }
      const n = b.stacks || 1; a += dt * 3.2; g.position.set(t.x, t.height + 0.75 + (t.yOff || 0), t.z);
      for (let i = 0; i < 3; i++) { const c = g.children[i], q = a + i * TAU / 3; c.visible = i < n; c.position.set(Math.sin(q) * 0.75, Math.sin(q * 2) * 0.08, Math.cos(q) * 0.75); c.rotation.set(HPI, 0, -q); }
      return true;
    }
  });
}
// Marked deck (innate): ability hits deal cards to heroes; the third card pays out, then the target is immune to new cards for 8 s
function kolMark(h, t) {
  if (!t.alive || t.kind !== 'hero') return; const lk = t.cardLock || (t.cardLock = {}); if (G.time < (lk[h.id] || 0)) return;
  const b = addBuff(t, { id: 'cards' + h.id, dur: 7, stackTo: 3, src: h }); if (!b) return;
  if (!t.cardFx || !t.cardFx[h.id]) kolOrbit(h, t);
  if ((b.stacks || 1) < 3) return;
  b.dur = 0; lk[h.id] = G.time + 8; const x = t.x, z = t.z, y = t.height * 0.6;
  kolBurst(x, y, z, 8); FX.ring(x, z, { r1: 3, color: KOL.c, life: 0.4, tex: 'shock' }); FX.glow(x, y, z, 4.5, KOL.c, 0.25, 'star'); SFX.at('coin', x, z, 0.9);
  if (t.team !== h.team) { damage(h, t, 26 + 7 * h.level + 0.3 * h.ap, 1); slow(h, t, 0.25, 1.5, 'marked'); FX.pillar(x, z, { r: 0.8, h: 7, color: 0xc2264e, life: 0.4, op: 0.5 }); SFX.at('hit', x, z, 0.8); }
  else { heal(h, t, 24 + 6.5 * h.level + 0.25 * h.ap); FX.heal(t, KOL.c); FX.pillar(x, z, { r: 1, h: 8, color: 0xc2264e, life: 0.5, op: 0.45 }); SFX.at('heal', x, z, 0.8); }
}
function kolHit(h, u, dmg) { damage(h, u, dmg, 1); kolMark(h, u); FX.hit(u.x, u.height * 0.55, u.z, KOL.c, true); kolBurst(u.x, 1.3, u.z, 3); FX.slash(u.x, u.z, rand(TAU), { r: 2.2, color: KOL.c, life: 0.2, sweep: 0.8 }); SFX.at('slash', u.x, u.z, 0.6); }
function kolMend(h, a, hl) { heal(h, a, hl); kolMark(h, a); FX.heal(a, KOL.c); FX.ring(a.x, a.z, { r1: 2.2, color: KOL.c, life: 0.35, tex: 'shock', op: 0.7 }); SFX.at('heal', a.x, a.z, 0.6); }
// Full Deck is up: the ace jumps on to one more target at half strength (another of the same side first, otherwise the other side)
function kolBounce(h, from, dmg, hl, wasEnemy) {
  const foe = nearestEnemyTo(h, from.x, from.z, 7.5, new Set([from.id])); let ally = null, bh = 1;
  for (const o of G.heroes) if (o.alive && o.team === h.team && o !== from && dist(o.x, o.z, from.x, from.z) < 7.5 && o.hp / o.maxHp < bh) { bh = o.hp / o.maxHp; ally = o; }
  const t = wasEnemy ? (foe || ally) : (ally || foe); if (!t) return;
  FX.beam(from.x, from.z, t.x, t.z, { color: KOL.c, w: 0.5, life: 0.2, y: 1.4 });
  homing(h, t, { x: from.x, z: from.z, y: 1.4, speed: 32, color: KOL.c, size: 0.7, mesh: 'blade', onHit: q => { if (q.team !== h.team) kolHit(h, q, dmg * 0.5); else kolMend(h, q, hl * 0.5); } });
}

const KOS = { c: 0x49b8ff, pale: 0xcfeaff, deep: 0x0d3f7a, bone: 0xd8d2bc };
function kosSkull() {
  if (!_vint.mat) vintMesh('rocket');
  if (!_vint.skull) {
    const g = new THREE.Group(), k = kit(), GL = { g: KOS.c }, dkk = 0x15131a;
    k.t(0.5, 0.5, 0.46, 0.44, 0.42, KOS.bone, 0, 0.06, 0).b(0.34, 0.2, 0.34, KOS.bone, 0, -0.2, 0.04).b(0.13, 0.12, 0.05, dkk, -0.11, 0.05, 0.24).b(0.13, 0.12, 0.05, dkk, 0.11, 0.05, 0.24).o(0.05, GL, -0.11, 0.05, 0.26).o(0.05, GL, 0.11, 0.05, 0.26).b(0.28, 0.05, 0.03, 0xf4f0e2, 0, -0.26, 0.21);
    k.into(g, _vint.mat, _vint.gmat); const s = glowSprite(KOS.c, 2.2); g.add(s); g.traverse(c => { c.castShadow = false; }); _vint.skull = g;
  }
  return _vint.skull.clone(true);
}
// fly a mesh from a point to a (moving) unit, then call done; lost() if the unit dies on the way
function kosFly(m, x, z, tgt, sp, done, lost) {
  let y = m.position.y || 1.4;
  G.actors.push({
    update(dt) {
      if (!tgt.alive) { (lost || done)(); return false; }
      const ty = tgt.height * 0.6, dx = tgt.x - x, dz = tgt.z - z, d = Math.hypot(dx, dz), st = sp * dt;
      if (d <= st + 0.8) { done(); return false; }
      x += dx / d * st; z += dz / d * st; y += (ty - y) * Math.min(1, dt * 8); m.position.set(x, y, z); m.rotation.y += dt * 14; m.rotation.x += dt * 9;
      FX.trail(x, y, z, KOS.c, 0.5, 1); return true;
    }
  });
}
const kosFlame = (x, y, z, n, a) => FX.flame(x, y, z, { n: n || 2, color: KOS.c, color2: KOS.deep, size: [0.5, 1.3], life: [0.25, 0.6], up: 1.6, a: a || 0.45 });

HEROES.push(
  /* ================= 25. Kolombina ================= */
  {
    id: 'kolomba', name: 'Коломбина', title: 'Шулер из балагана', role: 'support', roleName: 'Поддержка', build: 'trick', bars: [3, 1, 3, 4], diffc: 2,
    lore: 'Смеётся, сдаёт и не проигрывает. Одной и той же картой лечит своих и режет чужих, а третья карта на цели всегда краплёная. Хрупкая, зато её умения готовы каждые несколько секунд.',
    look: { bulk: 0.8, h: 1.0, c1: 0x7a2a4a, c2: 0x23202c, c3: 0x2a1f2e, skin: 0xe8dccc, metal: 0xd8b04a, glow: 0xff4d7a, head: 'jester', hair: 0x3a2a4a, chest: 'motley', sh: 'puff', legs: 'boots', weapon: 'cards', wc: 'wand' },
    stats: ST(535, 72, 450, 48, 44, 2.3, 19, 2.2, 0.74, 9.2, 9.2), projMesh: 'blade', atkSfx: 'arrow',
    innate: { name: 'Краплёная колода', icon: 'fan', desc: 'Каждое попадание умением сдаёт герою карту. Третья карта на враге — дополнительный магический урон и замедление на 25% на 1.5 сек. Третья карта на союзнике — дополнительное лечение. После срабатывания новые карты на эту цель не ложатся 8 сек. Сила растёт с уровнем героя.' },
    abilities: [
      {
        key: 'Q', name: 'Туз в рукаве', icon: 'card', cd: 3.5, cost: 28, range: 13, ind: { type: 'line', w: 1.5, fixed: true }, anim: 'thrust', animDur: 0.3, lock: 0.12, ai: { t: 'shot', sp: 34, healLine: true, farm: true },
        desc: 'Бросает карту по прямой до первой цели. Враг получает магический урон, раненый союзный герой — лечение. Пока стоит «Полная колода», карта перескакивает ещё на одну цель с половинной силой.',
        cast(h, p) {
          const dmg = D(h, 42, 6.5, 0, 0.45), hl = D(h, 34, 5.5, 0, 0.3), m = kolCardMesh(1.15), e = FX.add(m, 4, null), deck = G.time < (h.deckT || 0);
          m.position.set(h.x, 1.5, h.z); SFX.at('arrow', h.x, h.z, 0.9);
          shot(h, {
            dir: p.dir, speed: 34, range: 13, w: 0.8, mesh: false, color: KOL.c, ribbon: 0.55,
            trail: q => { m.position.set(q.x, q.y, q.z); m.rotation.y += 0.7; if (Math.random() < 0.5) FX.sparks(q.x, q.y, q.z, { n: 1, color: 0xffffff, color2: KOL.c, speed: [1, 3], life: [0.15, 0.35], grav: 0, w: 0.07 }); },
            onHit: u => { kolHit(h, u, dmg); if (deck) kolBounce(h, u, dmg, hl, true); },
            onAlly: (a, q) => { if (a.hp >= a.maxHp - 1) return; q.left = 0; kolMend(h, a, hl); if (deck) kolBounce(h, a, dmg, hl, false); },
            onEnd: () => { e.dead = true; }
          });
        }
      },
      {
        key: 'W', name: 'Козырная карта', icon: 'trump', cd: 6, cost: 45, range: 10, ind: { type: 'any' }, lock: 0.1, animDur: 0.35, ai: { t: 'trump' },
        desc: 'На союзного героя или себя: щит на 2 сек. На врага: магический урон и замедление на 30% на 1.5 сек.',
        cast(h, p) {
          const t = p.unit, m = kolCardMesh(2.2), y0 = t.height + 3; m.rotation.x = HPI;
          FX.add(m, 0.3, (k, me) => { me.position.set(t.x, lerp(y0, t.height * 0.6, easeOut(k)) + (t.yOff || 0), t.z); me.rotation.set(HPI, k * 9, 0); me.scale.setScalar(2.2 * (1 - k * 0.5)); });
          if (t !== h) FX.beam(h.x, h.z, t.x, t.z, { color: KOL.c, w: 0.5, life: 0.25, y: 1.5 });
          if (t.team === h.team) { shield(h, t, D(h, 62, 10, 0, 0.45), 2, KOL.c); kolMark(h, t); FX.ring(t.x, t.z, { r1: 2.6, color: KOL.c, life: 0.4, tex: 'shock' }); SFX.at('shield', t.x, t.z, 0.9); }
          else { kolHit(h, t, D(h, 46, 7.5, 0, 0.45)); slow(h, t, 0.3, 1.5); FX.pillar(t.x, t.z, { r: 0.8, h: 7, color: 0xc2264e, life: 0.35, op: 0.5 }); }
        }
      },
      {
        key: 'E', name: 'Подтасовка', icon: 'shuffle', cd: 8, cost: 40, range: 5.5, ind: { type: 'line', w: 1.6 }, lock: 0, ai: { t: 'escape', kite: true },
        desc: 'Короткий рывок. На месте остаётся карта, которая через 0.45 сек взрывается: магический урон и замедление на 35% на 1.2 сек всем врагам рядом.',
        cast(h, p) {
          const x = h.x, z = h.z, dmg = D(h, 46, 7.5, 0, 0.42), m = kolCardMesh(1.9); SFX.at('dash', x, z, 0.8); telegraph(h, x, z, 3.1, 0.45, KOL.c);
          FX.add(m, 0.45, (k, me) => { me.position.set(x, 1.3 + k * 0.5, z); me.rotation.set(HPI, k * 26, 0); me.scale.setScalar(1.9 * (0.6 + k * 0.5)); });
          after(0.45, () => {
            FX.explosion(x, z, 3.1, 0xc2264e, { smoke: false }); kolBurst(x, 1.3, z, 10); SFX.at('boom', x, z, 0.5);
            for (const u of enemiesIn(h, x, z, 3.1)) { damage(h, u, dmg, 1); slow(h, u, 0.35, 1.2); kolMark(h, u); FX.hit(u.x, 1.3, u.z, KOL.c, true); }
          });
          dashTo(h, p.x, p.z, 36, { ribbon: KOL.c, trail: u => { if (Math.random() < 0.6) FX.debris(u.x, 1.2, u.z, { n: 1, color: KOL.card, speed: [1, 3], up: 3, size: [0.12, 0.2] }); } });
        }
      },
      {
        key: 'R', name: 'Полная колода', icon: 'deck', cd: 45, cost: 90, range: 8, ind: { type: 'circle', r: 6.5 }, animDur: 0.6, lock: 0.25, ai: { t: 'point', ult: true, hp: 0.85, rad: 6, delay: 0.1 },
        desc: 'На 4 сек раскладывает в области хоровод карт. Сразу наносит магический урон врагам и даёт щиты союзным героям внутри. Пока колода на столе, «Туз в рукаве» перескакивает на вторую цель с половинной силой.',
        cast(h, p) {
          const x = p.x, z = p.z, R = 6.5, dmg = D(h, 85, 13, 0, 0.6), sh = D(h, 70, 11, 0, 0.5); h.deckT = G.time + 4; SFX.at('cast', x, z, 1); SFX.at('coin', x, z, 1);
          const g = new THREE.Group(), n1 = 16, n2 = 8; for (let i = 0; i < n1 + n2; i++) g.add(kolCardMesh(i < n1 ? 1.5 : 1.1)); g.position.set(x, 0, z);
          FX.add(g, 4, (k, me, dt, en) => {
            const t = en.t, s = Math.min(1, t / 0.3, (4 - t) / 0.3);
            for (let i = 0; i < n1 + n2; i++) { const c = me.children[i], out = i < n1, a = (out ? i / n1 : (i - n1) / n2) * TAU + t * (out ? 1.5 : -2.4), r = (out ? R : R * 0.5) * (0.4 + 0.6 * s); c.position.set(Math.sin(a) * r, (out ? 1.5 : 2.3) + Math.sin(t * 3 + i) * 0.25, Math.cos(a) * r); c.rotation.set(HPI, a + t * 4, 0); c.scale.setScalar((out ? 1.5 : 1.1) * Math.max(0.01, s)); }
          });
          FX.zone(x, z, R, 0xc2264e, 4, { tex: 'rune2', spin: 0.8, op: 0.55 }); FX.zone(x, z, R, KOL.c, 4, { tex: 'ringThin', spin: -0.5, op: 0.8 }); FX.ring(x, z, { r1: R + 0.5, color: 0xc2264e, life: 0.5, tex: 'shock', op: 0.8 }); FX.shock(x, z, 8, 0.8, 0.45); kolBurst(x, 1.5, z, 14);
          for (const u of enemiesIn(h, x, z, R)) { damage(h, u, dmg, 1); kolMark(h, u); FX.hit(u.x, 1.3, u.z, KOL.c, true); }
          for (const a of alliesIn(h, x, z, R, true)) { shield(h, a, sh, 4, KOL.c); kolMark(h, a); FX.pillar(a.x, a.z, { r: 1, h: 8, color: 0xc2264e, life: 0.5, op: 0.45 }); }
        }
      }
    ]
  },
  /* ================= 26. Kostyan ================= */
  {
    id: 'kostyan', name: 'Костян', title: 'Мёртвый скейтер', role: 'assassin', roleName: 'Налётчик', build: 'assassin', bars: [4, 2, 2, 5], diffc: 2,
    lore: 'Умер, но с доски так и не слез. Чем дольше катится, тем быстрее едет и больнее бьёт; швыряет собственный череп и в «Адском заезде» проезжает сквозь врагов, оставляя за доской холодное пламя.',
    look: { bulk: 0.8, h: 1.0, bones: true, board: true, c1: 0xd8d2bc, c2: 0x34405e, c3: 0xc8402e, metal: 0x8a8f98, glow: 0x49b8ff, head: 'skull', sh: 'none', weapon: 'femur', wc: 'melee' },
    stats: ST(590, 80, 260, 30, 60, 3.6, 23, 2.6, 0.82, 9.6, 2.6),
    // momentum: builds while he keeps rolling, bleeds off fast when he stops; the ultimate holds it at the top
    tick(h, dt) {
      const lv = h.al[2], riding = G.time < (h.rideT || 0); h.phase = riding;
      if (riding) h.mom = 5; else if (lv && (h.moving || h.dash)) h.mom = Math.min(5, (h.mom || 0) + dt * 1.3); else h.mom = Math.max(0, (h.mom || 0) - dt * 4);
      h.momT = (h.momT || 0) - dt; if (h.momT > 0) return; h.momT = 0.2;
      const st = Math.floor(h.mom); if (!st || !lv) return;
      addBuff(h, {
        id: 'mom', dur: 0.35, ms: (0.02 + 0.01 * lv) * st, onHit: st < 5 ? undefined : (u, t, b) => {
          u.mom = 0; b.dur = 0; if (!t.struct) slow(u, t, 0.3, 1, 'slam'); FX.explosion(t.x, t.z, 1.9, KOS.c, { smoke: false }); FX.debris(t.x, 1, t.z, { n: 4, color: KOS.bone, speed: [3, 7], up: 7, size: [0.1, 0.22] }); SFX.at('hit', t.x, t.z, 1);
          return [25, 45, 65, 85][lv - 1] + 0.5 * u.ad;
        }
      });
      if (st >= 3 && h.moving && FX.near(h.x, h.z, 45)) FX.sparks(h.x, 0.15, h.z, { n: st >= 5 ? 3 : 1, color: 0xffffff, color2: KOS.c, speed: [2, 6], life: [0.15, 0.4], dir: h.facing + Math.PI, spread: 0.6, w: 0.07 });
    },
    abilities: [
      {
        key: 'Q', name: 'Олли', icon: 'ollie', cd: 7, cost: 35, range: 8, ind: { type: 'circle', r: 2.8 }, lock: 0, ai: { t: 'gap', escape: true, rad: 2 },
        desc: 'Прыжок на доске в точку, в том числе через стены. При приземлении — урон и замедление на 35% на 1.5 сек всем врагам рядом.',
        cast(h, p) {
          const dmg = D(h, 55, 9, 0.6); SFX.at('dash', h.x, h.z, 0.9); FX.ring(h.x, h.z, { r1: 2.2, color: KOS.c, life: 0.3, tex: 'shock', op: 0.7 }); kosFlame(h.x, 0.4, h.z, 4);
          dashTo(h, p.x, p.z, 27, {
            fly: true, arc: 2.7, ribbon: KOS.c, trail: u => kosFlame(u.x, 0.5 + (u.yOff || 0), u.z, 1, 0.35),
            onEnd: u => {
              FX.explosion(u.x, u.z, 2.8, KOS.c, { el: 'earth', rock: 0x4a4640, smoke: false }); FX.debris(u.x, 0.4, u.z, { n: 6, color: KOS.bone, speed: [3, 8], up: 8, size: [0.1, 0.24] }); FX.shock(u.x, u.z, 4.5, 0.7, 0.3); SFX.at('boom', u.x, u.z, 0.5); SFX.at('hit', u.x, u.z, 1);
              for (const e of enemiesIn(u, u.x, u.z, 2.8)) { damage(u, e, dmg, 0); slow(u, e, 0.35, 1.5); FX.hit(e.x, 1.2, e.z, KOS.c, true); }
            }
          });
        }
      },
      {
        key: 'W', name: 'Черепушка', icon: 'skullthrow', cd: 8, cost: 45, range: 12, ind: { type: 'line', w: 1.6, fixed: true }, anim: 'thrust', animDur: 0.4, lock: 0.2, ai: { t: 'shot', sp: 30 },
        desc: 'Срывает с плеч собственный череп и швыряет его. Первый враг получает урон и оглушается на 0.5 сек, затем череп отскакивает в ещё одного врага рядом (70% урона, оглушение 0.35 сек) и возвращается на место.',
        cast(h, p) {
          const dmg = D(h, 52, 8.5, 0.55), m = kosSkull(), e = FX.add(m, 12, null); let hitAny = false; m.position.set(h.x, 1.6, h.z); h.rig.head.visible = false; SFX.at('arrow', h.x, h.z, 1); kosFlame(h.x, 2.4, h.z, 3);
          const home = () => { e.dead = true; h.rig.head.visible = true; if (h.alive) { FX.glow(h.x, h.rig.headY, h.z, 2.6, KOS.c, 0.2, 'star'); kosFlame(h.x, h.rig.headY, h.z, 2); } };
          const back = (x, z) => kosFly(m, x, z, h, 38, home);
          const strike = (u, k) => { damage(h, u, dmg * k, 0); stun(h, u, k < 1 ? 0.35 : 0.5); FX.explosion(u.x, u.z, 1.9, KOS.c, { smoke: false }); FX.debris(u.x, 1.2, u.z, { n: 3, color: KOS.bone, speed: [3, 7], up: 6, size: [0.1, 0.2] }); SFX.at('hit', u.x, u.z, 1); };
          after(8, () => { h.rig.head.visible = true; });
          shot(h, {
            dir: p.dir, speed: 30, range: 12, w: 0.9, mesh: false, color: KOS.c, ribbon: 0.7,
            trail: q => { m.position.set(q.x, q.y, q.z); m.rotation.y += 0.5; m.rotation.x += 0.3; if (Math.random() < 0.6) kosFlame(q.x, q.y, q.z, 1, 0.3); },
            onHit: u => {
              hitAny = true; strike(u, 1); const s2 = nearestEnemyTo(h, u.x, u.z, 6.5, new Set([u.id]));
              if (s2) kosFly(m, u.x, u.z, s2, 30, () => { strike(s2, 0.7); back(s2.x, s2.z); }, () => back(m.position.x, m.position.z)); else back(u.x, u.z);
            },
            onEnd: (x, z) => { if (!hitAny) back(x, z); }
          });
        }
      },
      {
        key: 'E', name: 'Разгон', icon: 'skate', passive: true, count: h => Math.floor(h.mom || 0) || '', stats: () => ({}),
        desc: 'Пассивно: пока Костян катится без остановки, он набирает до 5 зарядов разгона — каждый даёт +3 / 4 / 5 / 6% скорости. На пяти зарядах следующая атака наносит дополнительный урон, замедляет цель на 30% и сбрасывает разгон. Стоя на месте, он быстро теряет заряды.'
      },
      {
        key: 'R', name: 'Адский заезд', icon: 'hellride', cd: 60, cost: 90, range: 0, ind: { type: 'self', r: 3 }, lock: 0.1, ai: { t: 'buff', ult: true },
        desc: 'На 5 сек: +25% скорости, полный разгон, и Костян проезжает сквозь любых юнитов. Все, кого он задевает, получают урон и замедляются на 30%, а за доской остаётся полоса холодного пламени, которая жжёт врагов 2.2 сек.',
        cast(h) {
          const dur = 5, burn = D(h, 15, 2.5, 0.1), ram = D(h, 42, 7, 0.45), pts = [], hitT = {}; let el = 0, acc = 0, lx = h.x, lz = h.z; h.rideT = G.time + dur;
          const b = addBuff(h, { id: 'ride', dur, ms: 0.25 }); if (b) b.fx = FX.aura(h, KOS.c, dur, 1.8, 'swirl', 9);
          SFX.at('fire', h.x, h.z, 1); SFX.at('dash', h.x, h.z, 1); FX.explosion(h.x, h.z, 2.6, 0x1f78c8, { smoke: false }); FX.pillar(h.x, h.z, { r: 1.2, h: 10, color: 0x1f78c8, life: 0.5, op: 0.4 }); FX.shock(h.x, h.z, 6, 0.8, 0.4);
          G.actors.push({
            update(dt) {
              el += dt; if (!h.alive) h.rideT = 0;
              if (el < dur && h.alive) {
                if (dist(h.x, h.z, lx, lz) > 0.8) { pts.push({ x: h.x, z: h.z, t: G.time + 2.2 }); lx = h.x; lz = h.z; FX.scorch(h.x, h.z, 1.1, KOS.c, 2.6); }
                kosFlame(h.x - Math.sin(h.facing) * 0.6, 0.4, h.z - Math.cos(h.facing) * 0.6, 2, 0.5);
                for (const u of enemiesIn(h, h.x, h.z, 2)) if (G.time > (hitT[u.id] || 0)) { hitT[u.id] = G.time + 1; damage(h, u, ram, 0); slow(h, u, 0.3, 1, 'ram'); FX.hit(u.x, 1.2, u.z, KOS.c, true); FX.slash(u.x, u.z, h.facing, { r: 2.6, color: KOS.c, life: 0.2 }); SFX.at('hit', u.x, u.z, 0.8); }
              }
              while (pts.length && pts[0].t < G.time) pts.shift();
              if (!pts.length && el >= dur) return false;
              for (const q of pts) if (Math.random() < dt * 5) kosFlame(q.x + rand(-0.5, 0.5), 0.4, q.z + rand(-0.5, 0.5), 1, 0.4);
              acc += dt; if (acc >= 0.25) { acc -= 0.25; const done = new Set(); for (const q of pts) for (const u of enemiesIn(h, q.x, q.z, 1.3)) if (!done.has(u.id)) { done.add(u.id); damage(h, u, burn, 1, { dot: true }); } }
              return true;
            }
          });
        }
      }
    ]
  }
);

/* ===== roster, part 6: Shiro the masked ghoul (kagune tentacles), Kaisei the blindfolded sorcerer (blue, red and a map-wide purple), Umbra the lord in shadow (global blink and blast) ===== */
// enemies inside a straight strip that starts at (x0, z0) and runs along dir
function stripHits(h, x0, z0, dir, len, hw) {
  const out = [], sx = Math.sin(dir), cz = Math.cos(dir);
  for (const u of G.units) { if (!u.alive || u.team === h.team || u.struct) continue; const dx = u.x - x0, dz = u.z - z0, al = dx * sx + dz * cz; if (al < -u.radius || al > len + u.radius) continue; if (Math.abs(dx * cz - dz * sx) <= hw + u.radius) out.push(u); }
  return out;
}
// a mark on the minimap while a global ability is on its way: { x, z, r, color, until } or { line: true, x, z, x2, z2, ox, oz, color, until }
function mmMark(o) { (G.mmFx || (G.mmFx = [])).push(o); return o; }
function globalWarn(h, own, foe) { const P = G.player; if (!P || typeof UI === 'undefined') return; if (h.team === P.team) { if (h !== P && own) UI.announce(own, '#c9b8ff'); } else if (foe) { UI.announce(foe, '#ff6a5e'); SFX.play('warn'); } }

/* ---------- Shiro ---------- */
const SHI = { c: 0xe01e2c, hot: 0xff5a4a, mid: 0xb0101c, deep: 0x5a060c, dark: 0x1a0204 };
function shiInit() {
  if (!_vint.mat) vintMesh('rocket');
  if (_vint.kseg) return;
  const mk = fn => { const g = new THREE.Group(), k = kit(); fn(k); k.into(g, _vint.mat, _vint.gmat); g.traverse(c => { c.castShadow = false; }); return g; }, GL = { g: SHI.c };
  _vint.kseg = mk(k => k.t(0.82, 0.66, 1, 0.8, 1, 0x8a111b, 0, 0.5, 0).b(1.2, 0.14, 0.56, 0x4f070e, 0, 0.06, 0).b(0.13, 0.86, 0.13, GL, 0, 0.5, 0.4).b(0.13, 0.86, 0.13, GL, 0, 0.5, -0.4));
  _vint.ktip = mk(k => k.t(0.04, 0.04, 1, 0.8, 1, 0x8a111b, 0, 0.5, 0).b(0.15, 0.72, 0.42, GL, 0, 0.4, 0));
}
// a tentacle thrown from Shiro's back to a point in the world: shoots out, holds, snaps back. side bows it left or right
function shiLash(h, bx, by, bz, o) {
  shiInit(); o = o || {}; const n = o.n || 12, g = new THREE.Group(), th = o.th || 0.3, life = o.life || 0.4, te = o.out || 0.07, tr = o.back || 0.18, side = o.side || 0, bow = o.bow === undefined ? 1 : o.bow;
  for (let j = 0; j < n; j++) g.add((j === n - 1 ? _vint.ktip : _vint.kseg).clone(true));
  const A = new THREE.Vector3(), Pv = new THREE.Vector3(), Q = new THREE.Vector3(), Dv = new THREE.Vector3();
  return FX.add(g, life, (k, me, dt, en) => {
    const t = en.t, ext = t < te ? easeOut(t / te) : (t > life - tr ? Math.max(0.03, (life - t) / tr) : 1), a = h.facing;
    A.set(h.x - Math.sin(a) * 0.35 + Math.cos(a) * side * 0.3, 1.45 + (h.yOff || 0), h.z - Math.cos(a) * 0.35 - Math.sin(a) * side * 0.3);
    const dx = bx - A.x, dz = bz - A.z, L = Math.hypot(dx, dz) || 1, px = dz / L, pz = -dx / L, wob = Math.sin(t * 30 + side * 2) * 0.12; Pv.copy(A);
    for (let j = 0; j < n; j++) {
      const f = (j + 1) / n * ext, w = Math.sin(Math.PI * f) * (bow * side * 0.9 + wob), c = me.children[j];
      Q.set(A.x + dx * f + px * w, lerp(A.y, by, f) + Math.sin(Math.PI * f) * bow * 0.7, A.z + dz * f + pz * w);
      Dv.subVectors(Q, Pv); const len = Dv.length() || 0.001, w2 = th * lerp(1, 0.5, j / n); c.position.copy(Pv); c.quaternion.setFromUnitVectors(_ky, Dv.multiplyScalar(1 / len)); c.scale.set(w2, len, w2); Pv.copy(Q);
    }
  });
}
// a spike bursting out of the ground, leaning by `lean` toward direction a
function shiSpike(x, z, hgt, w, life, lean, a) {
  shiInit(); const m = _vint.ktip.clone(true); m.position.set(x, -0.15, z);
  m.quaternion.setFromUnitVectors(_ky, new THREE.Vector3(Math.sin(a) * Math.sin(lean), Math.cos(lean), Math.cos(a) * Math.sin(lean)));
  return FX.add(m, life, (k, me, dt, en) => { const t = en.t, s = t < 0.09 ? easeOut(t / 0.09) : (t > life - 0.25 ? Math.max(0.02, (life - t) / 0.25) : 1); me.scale.set(w, hgt * s, w); });
}
const shiBlood = e => FX.burst(e.x, 1.3, e.z, { n: 6, color: 0xd0141f, color2: 0x3a0206, speed: [2, 6], life: [0.3, 0.6], size: [0.34, 0.05], grav: -12 });

/* ---------- Kaisei ---------- */
const KAI = { blue: 0x3fa9ff, bdeep: 0x0b3a8a, red: 0xff3344, rdeep: 0x7a0612, pur: 0xb44dff, pdeep: 0x3a0a7a, pale: 0xe6d4ff };
// energy sphere: dark heart, glowing body, bright rim, two thin rings wobbling around it. Materials are its own (disposed with the effect)
function kaiOrb(col, deep, r) {
  const g = new THREE.Group(), add = m => { m.userData.own = true; g.add(m); return m; };
  add(new THREE.Mesh(FX.geo.sphere, new THREE.MeshBasicMaterial({ color: deep }))).scale.setScalar(r * 0.55);
  add(new THREE.Mesh(FX.geo.sphere, FX.mat(null, col, 0.4))).scale.setScalar(r * 0.8);
  add(new THREE.Mesh(FX.geo.sphere, FX.rimMat(col, 1.5))).scale.setScalar(r);
  for (let i = 0; i < 2; i++) { const m = add(new THREE.Mesh(FX.geo.flat, FX.mat('ringThin', 0xffffff, 0.75))); m.scale.set(r * 2.9, 1, r * 2.9); m.rotation.set(i ? 1.1 : -0.7, 0, i ? 0.5 : 1.2); m.userData.ring = i ? -9 : 7; }
  const s = add(new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: col, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.7 }))); s.scale.set(r * 4, r * 4, 1);
  return g;
}
function kaiSpin(g, dt, dir) { for (const c of g.children) if (c.userData.ring) c.rotation.y += dt * c.userData.ring * dir; }
// red and blue meeting: a violet blast
function kaiPurpleBurst(x, z, R) {
  SFX.at('bigboom', x, z, 0.8); SFX.at('void', x, z, 1); FX.explosion(x, z, 2.4, KAI.pur, { el: 'void' }); FX.sphere(x, 1.4, z, { r0: 0.6, r1: R, color: KAI.pur, life: 0.45, op: 0.4 }); FX.ring(x, z, { r0: 0.8, r1: R, color: KAI.pur, life: 0.5, tex: 'shock' }); FX.scorch(x, z, R * 0.8, KAI.pur, 6); FX.shock(x, z, R * 1.6, 1.2, 0.5);
  FX.pillar(x, z, { r: 1.3, h: 16, color: 0x7a2ad8, life: 0.6, op: 0.45 }); FX.ring(x, z, { r0: 0.6, r1: R + 2, color: KAI.pale, life: 0.4, tex: 'ringThin' }); FX.arcs(x, 1.6, z, R * 0.8, 6, KAI.pur);
  FX.sparks(x, 1.3, z, { n: 40, color: 0xffffff, color2: KAI.pur, speed: [10, 26], life: [0.25, 0.6], ring: true, w: 0.15, stretch: 0.1, up: 2 }); FX.shake(0.6); FX.punch(1);
}

/* ---------- Umbra ---------- */
const UMB = { c: 0x8a6cff, pale: 0xd9ccff, mid: 0x5a3cff, deep: 0x2a1470, ink: 0x15121f };
const umbPuff = (x, z) => { FX.burst(x, 1.1, z, { smoke: true, n: 7, color: UMB.ink, color2: 0x050408, speed: [0.5, 2.4], life: [0.5, 1], size: [1.2, 2.8], up: 1, rad: 0.6, a: 0.6 }); FX.flame(x, 1.2, z, { n: 5, color: UMB.c, color2: UMB.deep, size: [0.8, 1.8], life: [0.25, 0.55], up: 1.2, a: 0.4 }); FX.ring(x, z, { r1: 2.4, color: UMB.c, life: 0.3, tex: 'ringThin' }); FX.sparks(x, 1.2, z, { n: 12, color: 0xffffff, color2: UMB.c, speed: [3, 10], life: [0.2, 0.5], w: 0.11 }); };
// shadow mark: Shadow Step burns it for extra damage and a shorter cooldown
function umbMark(h, e) { if (!e.alive) return; const b = addBuff(e, { id: 'umark' + h.id, dur: 4, src: h }); if (b) b.fx = FX.aura(e, UMB.c, 4, e.radius + 0.8, 'rune2', -3); }
// Mana Condensation: ability hits on heroes bank charges for the ultimate
function umbCharge(h, e) {
  if (e.kind !== 'hero' || !h.al[2] || (h.atom || 0) >= 8) return; h.atom = (h.atom || 0) + 1;
  if (FX.near(h.x, h.z, 45)) { FX.implode(h.x, 1.5, h.z, 2, { n: 4, color: UMB.c, color2: 0xffffff, life: 0.3, streak: true }); if (h === G.player) FX.text(h.x, h.height + 1.1, h.z, 'мана ' + h.atom, '#c9b8ff', 13); }
}
// the liquid blade: a black edge that shoots out along a line and withdraws
function umbBlade(x0, z0, dir, len, life) {
  if (!_vint.ubox) _vint.ubox = new THREE.BoxGeometry(1, 1, 1).translate(0, 0, 0.5);
  const ex = x0 + Math.sin(dir) * len, ez = z0 + Math.cos(dir) * len, m = new THREE.Mesh(_vint.ubox, new THREE.MeshBasicMaterial({ color: 0x07060c, transparent: true })); m.position.set(x0, 1.32, z0); m.rotation.y = dir;
  FX.add(m, life, (k, me) => { const e = easeOut(Math.min(1, k / 0.22)), w = 1 - Math.max(0, (k - 0.55) / 0.45); me.scale.set(0.22 * w + 0.02, 0.07, len * e); me.material.opacity = Math.min(1, w * 1.5); });
  FX.beam(x0, z0, ex, ez, { color: UMB.mid, w: 1.5, life: life * 1.15, y: 1.3 }); FX.beam(x0, z0, ex, ez, { color: 0xffffff, w: 0.28, life: life * 0.6, y: 1.36 });
  if (!FX.near(x0, z0, 55)) return;
  for (let i = 1; i <= 6; i++) { const f = i / 6; FX.sparks(lerp(x0, ex, f), 1.3, lerp(z0, ez, f), { n: 3, color: 0xffffff, color2: UMB.c, speed: [2, 7], life: [0.2, 0.45], w: 0.1, grav: -4 }); }
  FX.glow(ex, 1.3, ez, 3.2, UMB.c, 0.25, 'star'); FX.flame(ex, 1.3, ez, { n: 4, color: UMB.c, color2: UMB.deep, size: [0.7, 1.6], life: [0.25, 0.5], up: 0.6, a: 0.4 });
}
// the blast itself
function umbAtom(h, x, z, R, dmg) {
  for (const e of enemiesIn(h, x, z, R)) { damage(h, e, dmg, 1); if (e.alive) slow(h, e, 0.3, 1.5); FX.hit(e.x, 1.3, e.z, UMB.c, true); }
  SFX.at('bigboom', x, z, 1.2); SFX.at('void', x, z, 1); if (!FX.near(x, z, 80)) return;
  FX.shake(1.1); FX.punch(1.5); FX.hitstop(0.07); FX.light(x, 5, z, UMB.c, 4.5, 60, 0.9);
  FX.glow(x, 2.6, z, 12, 0xffffff, 0.1, 'flare'); FX.glow(x, 2.6, z, 12, UMB.mid, 0.45);
  FX.sphere(x, 0.5, z, { r0: 1, r1: R, color: UMB.c, life: 0.7, op: 0.7 }); FX.sphere(x, 0.5, z, { r0: 0.5, r1: R * 0.72, color: UMB.mid, life: 0.4, op: 0.35 }); FX.sphere(x, 0.5, z, { r0: R * 0.5, r1: R * 1.15, color: UMB.mid, life: 1.0, op: 0.25 });
  FX.pillar(x, z, { r: 2.6, h: 32, color: UMB.mid, life: 1.0, op: 0.38 }); FX.pillar(x, z, { r: 1.0, h: 38, color: UMB.c, life: 0.55, op: 0.45 });
  for (let i = 0; i < 3; i++) after(i * 0.09, () => FX.ring(x, z, { r0: 1, r1: R * (1 + i * 0.22), color: i === 1 ? 0xffffff : UMB.c, life: 0.65, tex: i ? 'ringThin' : 'shock' }));
  FX.ring(x, z, { r0: R * 0.9, r1: R, color: UMB.c, life: 2.4, tex: 'crack', op: 0.9 }); FX.shock(x, z, R * 1.7, 1.4, 0.65); after(0.18, () => FX.shock(x, z, R * 2.2, 0.8, 0.6));
  FX.sparks(x, 1.2, z, { n: 70, color: UMB.pale, color2: UMB.c, speed: [14, 36], life: [0.3, 0.85], ring: true, w: 0.17, stretch: 0.1, up: 3 }); FX.sparks(x, 1.5, z, { n: 40, color: UMB.pale, color2: UMB.deep, speed: [4, 14], life: [0.6, 1.3], up: 12, grav: -9, w: 0.12 });
  FX.flame(x, 1, z, { n: 28, color: UMB.c, color2: UMB.deep, size: [2.4, 5.2], life: [0.6, 1.5], rad: R * 0.7, up: 3, a: 0.42 });
  FX.debris(x, 0.4, z, { n: 22, color: 0x2e2a38, speed: [5, 14], up: 13, size: [0.3, 0.8], rad: R * 0.5 }); FX.debris(x, 0.6, z, { glow: true, n: 14, color: UMB.c, speed: [6, 15], up: 11, size: [0.2, 0.5], rad: R * 0.4 });
  FX.scorch(x, z, R * 0.92, UMB.c, 11); FX.smoke(x, z, R * 0.6, 10, 0x1a1626); FX.arcs(x, 2, z, R * 0.9, 7, UMB.c);
  for (let i = 0; i < 9; i++) after(0.1 + i * 0.09, () => { const a = rand(TAU), r = rand(R * 0.2, R * 0.9), px = x + Math.sin(a) * r, pz = z + Math.cos(a) * r; FX.pillar(px, pz, { r: 0.4, h: rand(8, 15), color: i % 2 ? UMB.pale : UMB.c, life: 0.5, op: 0.6 }); FX.burst(px, 0.3, pz, { n: 5, color: UMB.pale, color2: UMB.deep, speed: [0.2, 1], life: [0.6, 1.2], size: [0.32, 0.03], up: 6, rad: 1.2, ring: true }); });
}

HEROES.push(
  /* ================= 27. Shiro ================= */
  {
    id: 'shiro', name: 'Сиро', title: 'Гуль в маске', role: 'assassin', roleName: 'Пожиратель', build: 'duel', bars: [4, 3, 3, 4], diffc: 2,
    lore: 'Полукровка в оскаленной маске. Из его спины растут четыре живых щупальца — кагунэ: ими он бьёт, прыгает, пронзает строй и лечится чужой кровью. Чем дольше длится драка, тем труднее его убить.',
    look: { bulk: 0.9, h: 1.02, c1: 0x1d1e26, c2: 0x14151b, c3: 0x383a46, skin: 0xd8cdc4, metal: 0x8c8f98, glow: 0xe01e2c, head: 'ghoul', hair: 0xbfc1cc, chest: 'suit', sh: 'none', legs: 'boots', weapon: 'none', wc: 'kagune', back: 'kagune' },
    stats: ST(640, 90, 250, 28, 60, 3.5, 26, 2.9, 0.8, 9.2, 3.1),
    innate: { name: 'Голод', icon: 'hunger', desc: 'Сиро лечится на 10% урона, который наносит героям атаками и умениями, и на 4% урона по остальным целям. Во время «Пиршества» — вдвое больше.' },
    onDeal(h, t, d) {
      if (t.struct || !h.alive) return; const hero = t.kind === 'hero'; heal(h, h, d * (hero ? 0.1 : 0.04) * (h.feast > G.time ? 2 : 1), true);
      if (hero && d > 30 && FX.near(h.x, h.z, 45)) FX.implode(h.x, 1.4, h.z, 1.8, { n: 3, color: SHI.c, color2: 0xffffff, life: 0.25, streak: true });
    },
    tick(h) { if (h.feast && (G.time > h.feast || !hasBuff(h, 'feast'))) { h.feast = 0; h.range = h.def.stats.range; } },
    abilities: [
      {
        key: 'Q', name: 'Пронзание', icon: 'kagune', cd: 6, cost: 35, range: 9.5, ind: { type: 'line', w: 2.2, fixed: true }, anim: 'kstab', animDur: 0.45, lock: 0.3, ai: { t: 'shot', sp: 60, farm: true },
        desc: 'Два щупальца бьют по прямой насквозь: урон всем врагам на линии и замедление на 30% на 1.5 сек.',
        cast(h, p) {
          const dmg = D(h, 60, 9.5, 0.6), dir = p.dir, len = p.range, sx = Math.sin(dir), cz = Math.cos(dir); SFX.at('dash', h.x, h.z, 0.9); FX.lineDecal(h.x, h.z, dir, len, 2.2, SHI.c, 0.13);
          after(0.12, () => {
            if (!h.alive) return; const ex = h.x + sx * len, ez = h.z + cz * len; SFX.at('slash', h.x, h.z, 1); SFX.at('hit', ex, ez, 0.7); FX.shake(0.22);
            shiLash(h, ex + cz * 0.5, 1.0, ez - sx * 0.5, { side: 1, n: 14, th: 0.48, life: 0.46 }); shiLash(h, ex - cz * 0.5, 1.0, ez + sx * 0.5, { side: -1, n: 14, th: 0.48, life: 0.46 });
            FX.beam(h.x, h.z, ex, ez, { color: SHI.mid, w: 2.2, life: 0.26, y: 1.1, op: 0.55 }); FX.explosion(ex, ez, 1.5, SHI.mid, { smoke: false });
            for (let i = 1; i <= 5; i++) { const f = i / 5.5; FX.sparks(h.x + sx * len * f, 1.1, h.z + cz * len * f, { n: 4, color: SHI.hot, color2: SHI.deep, speed: [3, 9], life: [0.2, 0.45], dir, spread: 0.9, w: 0.11 }); }
            for (const e of stripHits(h, h.x, h.z, dir, len, 1.1)) { damage(h, e, dmg, 0); slow(h, e, 0.3, 1.5); FX.hit(e.x, 1.3, e.z, SHI.c, true); FX.slash(e.x, e.z, dir + 0.9, { r: 2.4, color: SHI.c, life: 0.2, sweep: 0.8 }); shiBlood(e); }
          });
        }
      },
      {
        key: 'W', name: 'Бросок хищника', icon: 'pounce', cd: 11, cost: 45, range: 8.5, ind: { type: 'circle', r: 3.4 }, lock: 0, ai: { t: 'gap', escape: true, rad: 2.5 },
        desc: 'Отталкивается щупальцами и перелетает в точку, в том числе через стены. При приземлении кагунэ хлещет по кругу: урон и оглушение на 0.5 сек всем врагам рядом.',
        cast(h, p) {
          const dmg = D(h, 55, 9, 0.55); SFX.at('dash', h.x, h.z, 1); FX.ring(h.x, h.z, { r1: 2.4, color: SHI.c, life: 0.3, tex: 'shock', op: 0.7 }); FX.debris(h.x, 0.3, h.z, { n: 5, color: 0x3a3632, speed: [2, 6], up: 7, size: [0.15, 0.4] });
          dashTo(h, p.x, p.z, 30, {
            fly: true, arc: 2.6, ribbon: SHI.c, trail: u => FX.flame(u.x, 1 + (u.yOff || 0), u.z, { n: 1, color: SHI.c, color2: SHI.dark, size: [0.6, 1.3], life: [0.2, 0.45], up: 0.3, a: 0.4 }),
            onEnd: u => {
              u.anim.castT = u.anim.castDur = 0.38; u.anim.castType = 'kflare'; SFX.at('boom', u.x, u.z, 0.5); SFX.at('slash', u.x, u.z, 1);
              FX.explosion(u.x, u.z, 2.2, SHI.mid, { el: 'earth', rock: 0x3a3632, smoke: false }); FX.ring(u.x, u.z, { r0: 0.6, r1: 3.6, color: SHI.c, life: 0.4, tex: 'shock' }); FX.shock(u.x, u.z, 5, 0.8, 0.35); FX.slash(u.x, u.z, u.facing, { r: 3.8, color: SHI.mid, sweep: 3.6, life: 0.28 });
              for (let i = 0; i < 4; i++) { const a = u.facing + 0.8 + i * HPI; shiLash(u, u.x + Math.sin(a) * 3.3, 0.3, u.z + Math.cos(a) * 3.3, { side: i % 2 ? 1 : -1, n: 7, th: 0.42, life: 0.36, bow: 0.8 }); }
              for (const e of enemiesIn(u, u.x, u.z, 3.4)) { damage(u, e, dmg, 0); stun(u, e, 0.5); FX.hit(e.x, 1.2, e.z, SHI.c, true); shiBlood(e); }
            }
          });
        }
      },
      {
        key: 'E', name: 'Шипы из-под земли', icon: 'spikes', cd: 12, cost: 50, range: 8.5, ind: { type: 'circle', r: 3 }, anim: 'kdive', animDur: 0.7, lock: 0.4, ai: { t: 'point', rad: 3, delay: 0.55 },
        desc: 'Вонзает щупальца в землю. Через 0.55 сек они шипами вырываются в указанной области: урон и обездвиживание на 1 / 1.1 / 1.2 / 1.3 сек.',
        cast(h, p) {
          const x = p.x, z = p.z, R = 3, dmg = D(h, 65, 10, 0.6), rt = 0.9 + 0.1 * h.al[2], fx = h.x + Math.sin(h.facing) * 1.4, fz = h.z + Math.cos(h.facing) * 1.4;
          telegraph(h, x, z, R, 0.55, SHI.c); SFX.at('quake', h.x, h.z, 0.5); FX.debris(fx, 0.2, fz, { n: 6, color: 0x3a3632, speed: [2, 5], up: 6, size: [0.15, 0.35], rad: 0.8 }); FX.smoke(fx, fz, 1, 3, 0x3a3632);
          for (let i = 1; i <= 4; i++) after(i * 0.1, () => { const f = i / 5; FX.ring(lerp(fx, x, f), lerp(fz, z, f), { r0: 0.3, r1: 1.3, color: SHI.mid, life: 0.35, tex: 'crack', op: 0.9 }); });
          after(0.55, () => {
            SFX.at('slash', x, z, 1); SFX.at('boom', x, z, 0.5); FX.shake(0.35); FX.shock(x, z, 4.5, 0.7, 0.35); FX.ring(x, z, { r1: R + 0.4, color: SHI.c, life: 0.4, tex: 'shock' }); FX.scorch(x, z, R, SHI.mid, 6);
            FX.debris(x, 0.3, z, { n: 10, color: 0x3a3632, speed: [3, 8], up: 9, size: [0.2, 0.5], rad: R * 0.7 }); FX.flame(x, 0.6, z, { n: 8, color: SHI.c, color2: SHI.dark, size: [1, 2.2], life: [0.3, 0.7], rad: R * 0.6, up: 2.5, a: 0.35 });
            for (let i = 0; i < 13; i++) { const a = i * 0.524 + rand(0.3), r = i === 0 ? 0 : R * (0.4 + (i % 2) * 0.45); shiSpike(x + Math.sin(a) * r, z + Math.cos(a) * r, i === 0 ? 5 : rand(2.8, 4.2), i === 0 ? 0.8 : 0.58, 0.85 + rand(0.15), i === 0 ? 0 : 0.3, a); }
            for (const e of enemiesIn(h, x, z, R)) { damage(h, e, dmg, 0); root(h, e, rt, SHI.c); FX.hit(e.x, 1.2, e.z, SHI.c, true); shiBlood(e); shiSpike(e.x + 0.3, e.z, 3, 0.46, 0.75, 0.12, rand(TAU)); }
          });
        }
      },
      {
        key: 'R', name: 'Пиршество', icon: 'feast', cd: 75, cost: 90, range: 0, ind: { type: 'self', r: 5 }, anim: 'kflare', animDur: 0.7, lock: 0.35, ai: { t: 'buff', ult: true },
        desc: 'Кагунэ разрастается на 8 сек: +35 / 50 / 65% скорости атаки, +20% скорости передвижения, дальность атаки больше на 1.3, каждая атака задевает всех врагов рядом с целью (60% урона), а «Голод» лечит вдвое сильнее. В момент применения — урон и замедление на 40% на 1.5 сек всем врагам вокруг.',
        cast(h) {
          const dur = 8, lv = Math.max(1, h.al[3]), dmg = D(h, 60, 9, 0.5); h.feast = G.time + dur; h.range = h.def.stats.range + 1.3;
          const b = addBuff(h, {
            id: 'feast', dur, as: 0.2 + 0.15 * lv, ms: 0.2, every: 0.15,
            onTick: u => { if (!FX.near(u.x, u.z, 45)) return; const a = rand(TAU), r = rand(0.6, 2); FX.burst(u.x + Math.sin(a) * r, rand(1, 2.6), u.z + Math.cos(a) * r, { n: 1, color: SHI.hot, color2: SHI.deep, speed: [0.2, 0.8], life: [0.4, 0.8], size: [0.3, 0.03], up: 3 }); if (Math.random() < 0.4) FX.flame(u.x, 1.6, u.z, { n: 1, color: SHI.mid, color2: SHI.dark, size: [1, 2.2], life: [0.3, 0.6], up: 1.5, a: 0.25, rad: 1.2 }); },
            onHit: (u, t) => { if (t.struct) return 0; for (const e of enemiesIn(u, t.x, t.z, 3.2)) if (e !== t) { damage(u, e, u.ad * 0.6, 0); FX.hit(e.x, 1.2, e.z, SHI.c, false); } FX.slash(t.x, t.z, u.facing + (u.anim.alt ? 0.8 : -0.8), { r: 3.6, color: SHI.c, life: 0.22, flip: u.anim.alt, sweep: 1.8 }); return 0; }
          });
          if (b) b.fx = FX.aura(h, SHI.c, dur, 2.2, 'swirl', -7);
          SFX.at('dark', h.x, h.z, 1); SFX.at('quake', h.x, h.z, 0.6); FX.explosion(h.x, h.z, 5, SHI.mid, { el: 'shadow' }); FX.pillar(h.x, h.z, { r: 1.6, h: 13, color: SHI.mid, life: 0.6, op: 0.5 }); FX.shock(h.x, h.z, 7, 1, 0.5);
          for (let i = 0; i < 3; i++) after(i * 0.1, () => FX.ring(h.x, h.z, { r0: 0.5, r1: 3.5 + i * 1.2, color: i === 1 ? 0xffffff : SHI.c, life: 0.5, tex: 'ringThin' }));
          for (const e of enemiesIn(h, h.x, h.z, 5)) { damage(h, e, dmg, 0); slow(h, e, 0.4, 1.5); FX.hit(e.x, 1.2, e.z, SHI.c, true); shiBlood(e); }
        }
      }
    ]
  },
  /* ================= 28. Kaisei ================= */
  {
    id: 'kaisei', name: 'Кайсэй', title: 'Сильнейший', role: 'mage', roleName: 'Чародей', build: 'mage', bars: [5, 2, 4, 1], diffc: 3,
    lore: 'Чародей с повязкой на глазах, который и так видит всё. Синева стягивает врагов в точку, багрянец расшвыривает их, а вместе они дают пурпур — сферу, которая летит через всю карту и не замечает стен.',
    look: { bulk: 0.86, h: 1.08, c1: 0x1b1e30, c2: 0x12141f, c3: 0x0b0c13, skin: 0xdcc3b0, metal: 0xb8a468, glow: 0x3fa9ff, head: 'blind', hair: 0xc3c5d0, hands: 0xdcc3b0, chest: 'uniform', sh: 'none', legs: 'boots', weapon: 'sign', wc: 'wand' },
    stats: ST(550, 78, 460, 48, 46, 2.4, 20, 2.4, 0.72, 8.9, 9.5), projMesh: 'orb', atkSfx: 'cast',
    abilities: [
      {
        key: 'Q', name: 'Лазурь', icon: 'attract', iconCol: KAI.blue, cd: 9, cost: 50, range: 10, ind: { type: 'circle', r: 3.8 }, lock: 0.2, ai: { t: 'point', rad: 3.8, delay: 0.15 },
        desc: 'Точка притяжения на 1.2 сек: стягивает врагов к центру и четыре раза наносит магический урон. Если внутри неё взорвётся «Багрянец», они сольются в пурпурную вспышку.',
        cast(h, p) {
          const x = p.x, z = p.z, R = 3.8, dur = 1.2, tick = D(h, 19, 3, 0, 0.14), orb = kaiOrb(KAI.blue, 0x061a44, 1.05); let el = 0, nx = 0.3, n = 0;
          const Z = h.blueZ = { x, z, r: R, until: G.time + dur, dead: false }; orb.position.set(x, 2.5, z);
          const oe = FX.add(orb, dur + 0.05, (k, me, dt, en) => { kaiSpin(me, dt, 1); me.scale.setScalar(Math.min(1, en.t / 0.15) * (1 + Math.sin(en.t * 22) * 0.05)); });
          const z1 = FX.zone(x, z, R, KAI.blue, dur, { tex: 'swirl', spin: -7, op: 0.8 }), z2 = FX.zone(x, z, R, 0x1f6fd8, dur, { tex: 'ringThin', spin: 1, op: 0.9 });
          SFX.at('void', x, z, 1); FX.ring(x, z, { r0: R + 1, r1: 0.5, color: KAI.blue, life: 0.35, tex: 'shock', op: 0.8 }); FX.shock(x, z, 6, -0.9, 0.5); FX.light(x, 2, z, KAI.blue, 2.4, 22, dur);
          G.actors.push({
            update(dt) {
              el += dt; if (Z.dead) { oe.dead = z1.dead = z2.dead = true; return false; }
              if (FX.near(x, z, 50)) { FX.implode(x, 2.5, z, R, { n: 2, color: KAI.blue, color2: 0xffffff, life: 0.28, streak: true }); if (Math.random() < dt * 16) FX.implode(x, 2.3, z, R * 0.9, { n: 1, color: 0x9fd4ff, color2: KAI.bdeep, life: 0.4, size: [0.55, 0.1] }); if (Math.random() < dt * 10) FX.debris(x + rand(-R, R) * 0.6, 0.2, z + rand(-R, R) * 0.6, { n: 1, color: 0x3a3c46, speed: [0, 1], up: 5, size: [0.12, 0.3] }); }
              for (const e of enemiesIn(h, x, z, R)) { if (e.boss || e.invuln) continue; const d = dist(e.x, e.z, x, z); if (d < 0.5) continue; const st = Math.min(d - 0.4, 6.5 * dt), ax = e.x + (x - e.x) / d * st, az = e.z + (z - e.z) / d * st; if (NAV.ok(ax, az)) { e.x = ax; e.z = az; } }
              if (el >= nx && n < 4) { nx += 0.3; n++; for (const e of enemiesIn(h, x, z, R)) { damage(h, e, tick, 1); FX.hit(e.x, 1.2, e.z, KAI.blue, false); } }
              if (el < dur) return true;
              Z.dead = true; if (h.blueZ === Z) h.blueZ = null; FX.explosion(x, z, 2, KAI.blue, { smoke: false }); FX.ring(x, z, { r0: 0.4, r1: R, color: 0x9fd4ff, life: 0.3, tex: 'ringThin' }); return false;
            }
          });
        }
      },
      {
        key: 'W', name: 'Багрянец', icon: 'repel', iconCol: KAI.red, cd: 9, cost: 55, range: 12, ind: { type: 'line', w: 1.8, fixed: true }, anim: 'thrust', animDur: 0.35, lock: 0.15, ai: { t: 'shot', sp: 30, farm: true },
        desc: 'Сфера отталкивания летит по прямой и взрывается у первого врага или в конце пути: магический урон и отбрасывание от центра взрыва. Взорвавшись внутри «Лазури», сливается с ней: пурпурная вспышка бьёт на 60% сильнее по большей области и оглушает на 0.6 сек.',
        cast(h, p) {
          const dmg = D(h, 75, 12, 0, 0.6), orb = kaiOrb(KAI.red, 0x3a0208, 0.55), oe = FX.add(orb, 3, (k, me, dt) => kaiSpin(me, dt, -1)); orb.position.set(h.x, 1.5, h.z); SFX.at('cast', h.x, h.z, 1);
          const boom = (x, z) => {
            oe.dead = true; const Z = h.blueZ;
            if (Z && !Z.dead && G.time < Z.until && dist(x, z, Z.x, Z.z) < Z.r + 1) {   // red meets blue
              Z.dead = true; h.blueZ = null; const R = 5; kaiPurpleBurst(Z.x, Z.z, R); if (h === G.player) FX.text(Z.x, 3.4, Z.z, 'слияние!', '#d9a8ff', 19);
              for (const e of enemiesIn(h, Z.x, Z.z, R)) { damage(h, e, dmg * 1.6, 1); stun(h, e, 0.6); FX.hit(e.x, 1.2, e.z, KAI.pur, true); }
              return;
            }
            const R = 3.4; FX.explosion(x, z, 2, KAI.red, { color2: KAI.rdeep }); FX.ring(x, z, { r0: 0.5, r1: R, color: KAI.red, life: 0.45, tex: 'shock' }); FX.shock(x, z, R * 1.5, 0.9, 0.4); SFX.at('boom', x, z, 0.7); FX.ring(x, z, { r0: 0.5, r1: R + 2.4, color: KAI.red, life: 0.45, tex: 'ringThin' });
            FX.sparks(x, 1.2, z, { n: 28, color: 0xffffff, color2: KAI.red, speed: [10, 22], life: [0.2, 0.45], ring: true, w: 0.14, stretch: 0.11 }); FX.sphere(x, 1.3, z, { r0: 0.4, r1: R, color: KAI.red, life: 0.35, op: 0.4 });
            for (const e of enemiesIn(h, x, z, R)) { damage(h, e, dmg, 1); knock(e, x, z, 4.5, 0.28); FX.hit(e.x, 1.2, e.z, KAI.red, true); }
          };
          shot(h, {
            dir: p.dir, speed: 30, range: 12, w: 0.9, mesh: false, color: KAI.red, ribbon: 0.8, onHit: () => { }, onEnd: (x, z) => boom(x, z),
            trail: q => { orb.position.set(q.x, q.y, q.z); if (!FX.near(q.x, q.z, 50)) return; FX.flame(q.x, q.y, q.z, { n: 1, color: KAI.red, color2: KAI.rdeep, size: [0.6, 1.3], life: [0.2, 0.4], up: 0.3, a: 0.4 }); if (Math.random() < 0.6) FX.sparks(q.x, q.y, q.z, { n: 1, color: 0xffffff, color2: KAI.red, speed: [2, 6], life: [0.15, 0.35], grav: 0, w: 0.08 }); }
          });
        }
      },
      {
        key: 'E', name: 'Бесконечность', icon: 'infinity', iconCol: KAI.pale, cd: 16, cost: 60, range: 0, ind: { type: 'self', r: 4 }, anim: 'sign', animDur: 0.5, lock: 0.1, ai: { t: 'shield' },
        desc: 'На 2.5 / 2.8 / 3.1 / 3.4 сек пространство вокруг Кайсэя растягивается: он получает на 55% меньше урона, а враги ближе 4 метров замедляются на 35%.',
        cast(h) {
          const dur = 2.2 + 0.3 * Math.max(1, h.al[2]); let last = h.lastDamageT; SFX.at('shield', h.x, h.z, 1);
          const b = addBuff(h, {
            id: 'infinity', dur, dmgIn: 0.45, every: 0.2, onTick: u => {
              for (const e of enemiesIn(u, u.x, u.z, 4)) slow(u, e, 0.35, 0.45, 'inf');
              if (u.lastDamageT > last) { last = u.lastDamageT; const a = rand(TAU); FX.ring(u.x, u.z, { r0: 1.4, r1: 2.6, color: 0xffffff, life: 0.25, tex: 'ringThin', y: 1.4 }); FX.glow(u.x + Math.sin(a) * 1.7, rand(1, 2.4), u.z + Math.cos(a) * 1.7, 2, KAI.blue, 0.2, 'star'); }
            }
          });
          if (b) { b.fx = FX.bubble(h, KAI.blue, dur, 2.1); FX.zone(h.x, h.z, 4, KAI.blue, dur, { follow: h, tex: 'ringThin', spin: 2, op: 0.55 }); FX.zone(h.x, h.z, 2.3, 0x9fd4ff, dur, { follow: h, tex: 'rune2', spin: -1.2, op: 0.5 }); }
          FX.ring(h.x, h.z, { r1: 4.2, color: KAI.blue, life: 0.4, tex: 'shock', op: 0.7 }); FX.glow(h.x, 1.7, h.z, 4, 0x9fd4ff, 0.3, 'star');
        }
      },
      {
        key: 'R', name: 'Пурпур', icon: 'purple', iconCol: KAI.pur, global: true, cd: 100, cost: 120, range: 0, ind: { type: 'line', w: 4.6, fixed: true, len: 70 }, anim: 'purple', animDur: 1.35, lock: 1.15, ai: { t: 'gline', ult: true, hp: 0.45, sp: 46, delay: 1.0 },
        desc: 'Глобальное умение. Секунду сводит синеву и багрянец в одну сферу и выпускает её по прямой через всю карту. Сфера проходит сквозь стены и наносит большой магический урон каждому врагу на пути (лесным чудовищам — половину). Направление задаётся на поле или щелчком по мини-карте.',
        cast(h, p) {
          const dir = p.dir, sx = Math.sin(dir), cz = Math.cos(dir), dmg = D(h, 120, 20, 0, 0.75), T = 1.0, SP = 46;
          const bx = sx > 0 ? (104 - h.x) / sx : (sx < 0 ? (-104 - h.x) / sx : 1e9), bz = cz > 0 ? (104 - h.z) / cz : (cz < 0 ? (-104 - h.z) / cz : 1e9), len = Math.max(12, Math.min(bx, bz, 300));
          const fx0 = () => h.x + Math.sin(h.facing) * 1.6, fz0 = () => h.z + Math.cos(h.facing) * 1.6; h.order = null; h.path = null;
          { const lm = new THREE.Mesh(FX.geo.line, FX.mat('line', 0x7a2ad8, 0.2)); lm.position.set(h.x, 0.1, h.z); lm.rotation.y = dir; lm.scale.set(4.6, 1, len); FX.add(lm, T + 0.25, (k, me) => { me.material.opacity = k < 0.8 ? 0.14 + k * 0.3 : 0.38 * (1 - k) / 0.2; }); }
          FX.zone(h.x, h.z, 3, KAI.pur, T, { tex: 'rune2', spin: 3, op: 0.7 }); SFX.at('void', h.x, h.z, 1); SFX.at('overload', h.x, h.z, 0.5);
          const mk = mmMark({ line: true, x: h.x, z: h.z, x2: h.x + sx * len, z2: h.z + cz * len, color: '#c77dff', until: G.time + T + len / SP });
          globalWarn(h, 'Кайсэй выпускает «Пурпур»', 'Вражеский «Пурпур» летит через карту!');
          const half = s => (k, me, dt, en) => { const t = Math.min(1, en.t / (T * 0.7)), a = h.facing, off = (1 - easeOut(t)) * 2 * s; me.position.set(fx0() + Math.cos(a) * off, 1.75, fz0() - Math.sin(a) * off); kaiSpin(me, dt, s); me.scale.setScalar(1 - 0.45 * t * t); };
          FX.add(kaiOrb(KAI.blue, 0x061a44, 0.42), T * 0.72, half(-1)); FX.add(kaiOrb(KAI.red, 0x3a0208, 0.42), T * 0.72, half(1));
          const po = kaiOrb(KAI.pur, 0x16032e, 1.15); let fired = false, el = 0, acc = 0, tk = 0;
          const pe = FX.add(po, T + len / SP + 0.6, (k, me, dt, en) => { kaiSpin(me, dt, 1.6); if (fired) { me.visible = true; me.scale.setScalar(1 + Math.sin(en.t * 26) * 0.05); return; } const g = (en.t - T * 0.66) / (T * 0.34); me.visible = g > 0; me.position.set(fx0(), 1.8, fz0()); me.scale.setScalar(Math.max(0.05, lerp(0.2, 0.9, clamp(g, 0, 1)))); });
          G.actors.push({
            update(dt) {
              el += dt; acc += dt;
              if (!h.alive || h.stunned) { pe.dead = true; mk.until = 0; h.castLock = 0; h.anim.castT = 0; return false; }
              if (el < T) {
                if (acc > 0.05 && FX.near(h.x, h.z, 50)) { acc = 0; const x = fx0(), z = fz0(); FX.implode(x, 1.8, z, 3, { n: 3, color: el < T * 0.6 ? (Math.random() < 0.5 ? KAI.blue : KAI.red) : KAI.pur, color2: 0xffffff, life: 0.25, streak: true }); if (el > T * 0.6 && Math.random() < 0.6) FX.arcs(x, 1.8, z, 1.6, 1, KAI.pur); }
                return true;
              }
              fired = true; const ox = fx0(), oz = fz0(); SFX.at('bigboom', ox, oz, 0.9); SFX.at('laser', ox, oz, 0.7); FX.shake(0.7); FX.punch(1.1); FX.shock(ox, oz, 9, 1.2, 0.5);
              FX.ring(ox, oz, { r0: 1, r1: 5.5, color: 0x7a2ad8, life: 0.45, tex: 'shock', op: 0.8 }); FX.ring(ox, oz, { r0: 0.5, r1: 4, color: KAI.pur, life: 0.3, tex: 'ringThin' }); FX.glow(ox, 1.8, oz, 5, KAI.pur, 0.22); FX.sparks(ox, 1.6, oz, { n: 30, color: 0xffffff, color2: KAI.pur, speed: [8, 22], life: [0.25, 0.6], dir: dir + Math.PI, spread: 1.3, w: 0.14 });
              shot(h, {
                x: ox, z: oz, y: 1.9, dir, speed: SP, range: len, w: 2.3, pierce: true, mesh: false, color: 0x7a2ad8, ribbon: 1.5,
                trail: q => {
                  po.position.set(q.x, 1.9, q.z); mk.ox = q.x; mk.oz = q.z; tk++; if (!FX.near(q.x, q.z, 60)) return;
                  FX.flame(q.x - sx * 1.2, 1.9, q.z - cz * 1.2, { n: 2, color: 0x8a35e0, color2: KAI.pdeep, size: [1.5, 3.2], life: [0.35, 0.8], up: 0.4, a: 0.3, rad: 0.8 });
                  FX.sparks(q.x, 1.9, q.z, { n: 3, color: 0xffffff, color2: KAI.pur, speed: [4, 12], life: [0.25, 0.6], dir: dir + Math.PI, spread: 1.2, w: 0.13, grav: -3 });
                  if (tk % 3 === 0) FX.light(q.x, 3, q.z, KAI.pur, 2.6, 26, 0.3);
                  if (tk % 4 === 0) { FX.ring(q.x, q.z, { r0: 1.2, r1: 4.2, color: 0x8a35e0, life: 0.4, tex: 'ringThin', op: 0.7 }); FX.debris(q.x, 0.3, q.z, { n: 2, color: 0x3a3440, speed: [3, 7], up: 8, size: [0.2, 0.45], rad: 1.6 }); }
                  if (tk % 9 === 0) { FX.scorch(q.x, q.z, 2.2, KAI.pur, 5); FX.shock(q.x, q.z, 5, 0.6, 0.3); }
                },
                onHit: e => { damage(h, e, dmg * (e.kind === 'monster' ? 0.5 : 1), 1); if (e.kind === 'hero') { FX.hit(e.x, 1.3, e.z, KAI.pur, true); FX.ring(e.x, e.z, { r0: 0.5, r1: 3, color: KAI.pur, life: 0.4, tex: 'shock' }); FX.pillar(e.x, e.z, { r: 0.8, h: 9, color: 0x7a2ad8, life: 0.4, op: 0.5 }); FX.flame(e.x, 1.2, e.z, { n: 5, color: KAI.pur, color2: KAI.pdeep, size: [1, 2.2], life: [0.3, 0.7], a: 0.4 }); FX.shake(0.3); SFX.at('boom', e.x, e.z, 0.7); } else { FX.hit(e.x, 1.2, e.z, KAI.pur, true); FX.flame(e.x, 1.1, e.z, { n: 3, color: KAI.pur, color2: KAI.pdeep, size: [0.8, 1.8], life: [0.3, 0.6], a: 0.4 }); } },
                onEnd: (x, z) => { pe.dead = true; mk.until = 0; FX.explosion(x, z, 4, KAI.pur, { el: 'void' }); }
              });
              return false;
            }
          });
        }
      }
    ]
  },
  /* ================= 29. Umbra ================= */
  {
    id: 'umbra', name: 'Умбра', title: 'Владыка из тени', role: 'assassin', roleName: 'Тень', build: 'apsin', bars: [5, 2, 2, 5], diffc: 3,
    lore: 'Притворяется никем, пока не накопит довольно маны. Клинок из живой тени вытягивается на десять шагов, сам он шагает сквозь мрак — а когда приходит время, появляется в любой точке карты и стирает её одной вспышкой.',
    look: { bulk: 0.88, h: 1.04, c1: 0x17161e, c2: 0x0f0e14, c3: 0x241d38, skin: 0x8a7462, metal: 0xb89a55, glow: 0x8a6cff, head: 'umbra', chest: 'longcoat', sh: 'cloth', legs: 'boots', weapon: 'ebon', wc: 'melee', coat: 0x121118 },
    stats: ST(585, 80, 300, 34, 58, 3.4, 23, 2.6, 0.82, 9.3, 2.8),
    abilities: [
      {
        key: 'Q', name: 'Жидкий клинок', icon: 'longblade', cd: 6, cost: 35, range: 10, ind: { type: 'line', w: 1.8, fixed: true }, anim: 'thrust', animDur: 0.4, lock: 0.25, ai: { t: 'shot', sp: 70, farm: true },
        desc: 'Клинок из живой тени вытягивается по прямой и пронзает всех врагов на линии: магический урон и «метка тени» на 4 сек.',
        cast(h, p) {
          const dmg = D(h, 58, 9, 0.3, 0.5), dir = p.dir, len = p.range, sx = Math.sin(dir), cz = Math.cos(dir); SFX.at('dash', h.x, h.z, 0.6);
          after(0.1, () => {
            if (!h.alive) return; SFX.at('slash', h.x, h.z, 1); umbBlade(h.x + sx * 0.9, h.z + cz * 0.9, dir, len - 0.9, 0.3);
            for (const e of stripHits(h, h.x, h.z, dir, len, 0.9)) { damage(h, e, dmg, 1); umbMark(h, e); umbCharge(h, e); FX.hit(e.x, 1.3, e.z, UMB.c, true); FX.slash(e.x, e.z, dir + 1, { r: 2.2, color: UMB.c, life: 0.2, sweep: 0.8 }); }
          });
        }
      },
      {
        key: 'W', name: 'Шаг в тень', icon: 'blink', cd: 12, cost: 45, range: 9, ind: { type: 'circle', r: 3 }, anim: 'cut', animDur: 0.32, lock: 0.14, ai: { t: 'gap', escape: true, rad: 2.5 },
        desc: 'Мгновенно переносится в точку и рассекает всё вокруг: магический урон и замедление на 30% на 1.2 сек. Цель с «меткой тени» получает на 50% больше урона, метка сгорает; если сгорела хоть одна, перезарядка сокращается на 60%.',
        cast(h, p) {
          const dmg = D(h, 50, 8, 0.3, 0.42), x0 = h.x, z0 = h.z; let burnt = false; umbPuff(x0, z0); SFX.at('dark', x0, z0, 0.8); blink(h, p.x, p.z); SFX.at('slash', h.x, h.z, 1);
          FX.beam(x0, z0, h.x, h.z, { color: UMB.mid, w: 1.1, life: 0.3, y: 1.2, op: 0.7 }); umbPuff(h.x, h.z); FX.slash(h.x, h.z, p.dir, { r: 3.3, color: UMB.mid, sweep: 3.4, life: 0.26 }); FX.ring(h.x, h.z, { r0: 0.6, r1: 3.2, color: UMB.c, life: 0.35, tex: 'shock', op: 0.8 });
          for (const e of enemiesIn(h, h.x, h.z, 3)) {
            const b = e.buffs.find(q => q.id === 'umark' + h.id); if (b) { b.dur = 0; burnt = true; FX.pillar(e.x, e.z, { r: 0.7, h: 8, color: UMB.c, life: 0.35 }); FX.explosion(e.x, e.z, 1.6, UMB.c, { smoke: false }); }
            damage(h, e, dmg * (b ? 1.5 : 1), 1); slow(h, e, 0.3, 1.2); umbCharge(h, e); FX.hit(e.x, 1.2, e.z, UMB.c, true);
          }
          if (burnt) return { cd: 12 * 0.4 * 100 / (100 + h.haste) };
        }
      },
      {
        key: 'E', name: 'Сгущение маны', icon: 'mana', passive: true, count: h => h.atom || '', stats: l => ({ ap: 8 * l }),
        desc: 'Пассивно: +8 / 16 / 24 / 32 силы умений. Каждое попадание умением по вражескому герою даёт заряд маны (до 8). Заряды не пропадают со временем и сгорают при «Расщеплении»: каждый усиливает взрыв на 5%.'
      },
      {
        key: 'R', name: 'Расщепление', icon: 'atom', global: true, cd: 130, cost: 140, range: 0, ind: { type: 'circle', r: 8 }, anim: 'atom', animDur: 2.2, lock: 2.15, ai: { t: 'gtele', ult: true, hp: 0.5 },
        desc: 'Глобальное умение. 1.2 сек собирает ману, затем переносится в любую точку карты и ещё через 0.9 сек взрывается: огромный магический урон и замедление всем врагам в радиусе 8. Над точкой он получает на 60% меньше урона. Оглушение прерывает умение. Точку можно указать на поле или щелчком по мини-карте.',
        cast(h, p) {
          const q = NAV.nearest(p.x, p.z), x = q.x, z = q.z, R = 8, T1 = 1.2, T2 = 0.9, base = D(h, 180, 30, 0, 0.9), x0 = h.x, z0 = h.z; let el = 0, ph = 0, acc = 0; h.order = null; h.path = null;
          SFX.at('dark', x0, z0, 1); SFX.at('overload', x0, z0, 0.6);
          const c1 = FX.zone(x0, z0, 3, UMB.c, T1, { tex: 'rune2', spin: 3, op: 0.8 }), c2 = FX.pillar(x0, z0, { r: 1.2, h: 15, color: UMB.mid, life: T1, op: 0.45, grow: true });
          const d1 = FX.zone(x, z, R, UMB.c, T1 + T2, { tex: 'rune', spin: 0.9, op: 0.55 }), d2 = FX.zone(x, z, R, UMB.mid, T1 + T2, { tex: 'ring', spin: -0.4, op: 0.9 }), d3 = FX.zone(x, z, 2.4, UMB.pale, T1 + T2, { tex: 'rune2', spin: -2.5, op: 0.7 });
          const mk = mmMark({ x, z, r: R, color: '#a58cff', until: G.time + T1 + T2 + 0.3 }); let core = null;
          const P = G.player; if (P && P.team !== h.team && P.alive && dist(P.x, P.z, x, z) < 26) globalWarn(h, null, 'Рядом открывается «Расщепление» — уходите!');
          const fail = () => { c1.dead = d1.dead = d2.dead = d3.dead = true; if (c2) c2.dead = true; if (core) core.dead = true; mk.until = 0; h.castLock = 0; h.anim.castT = 0; };
          G.actors.push({
            update(dt) {
              el += dt; acc += dt; if (!h.alive || h.stunned) { fail(); return false; }
              if (ph === 0) {
                if (acc > 0.05) {
                  acc = 0; if (FX.near(h.x, h.z, 50)) { FX.implode(h.x, 1.6, h.z, 4, { n: 3, color: UMB.c, color2: 0xffffff, life: 0.3, streak: true }); FX.burst(h.x, 0.2, h.z, { n: 1, color: UMB.c, color2: UMB.deep, speed: [0.2, 0.8], life: [0.5, 0.9], size: [0.35, 0.03], up: 6, rad: 2.2, ring: true }); }
                  if (FX.near(x, z, 50)) FX.burst(x, 0.2, z, { n: 2, color: UMB.pale, color2: UMB.deep, speed: [0.2, 0.8], life: [0.6, 1.1], size: [0.3, 0.03], up: 5, rad: R * 0.9, ring: true });
                }
                if (el < T1) return true;
                ph = 1; umbPuff(h.x, h.z); FX.pillar(h.x, h.z, { r: 1.4, h: 20, color: UMB.c, life: 0.4, op: 0.6 }); h.x = x; h.z = z; h.path = null; h.order = null; if (h.isPlayer) { G.camLock = true; G.camSnap = true; }
                addBuff(h, { id: 'atomic', dur: T2 + 0.05, dmgIn: 0.4, air: 1.6 }); G.dangers.push({ x, z, r: R, team: h.team, until: G.time + T2 });
                SFX.at('void', x, z, 1); SFX.at('overload', x, z, 0.8); umbPuff(x, z); FX.pillar(x, z, { r: 1.6, h: 26, color: UMB.c, life: 0.5, op: 0.6 }); FX.ring(x, z, { r0: R, r1: 1, color: UMB.c, life: T2, tex: 'shock', op: 0.6 }); FX.shock(x, z, R, -1, T2);
                core = FX.add(kaiOrb(UMB.c, 0x0a0420, 1), T2 + 0.05, (k, me, dt2) => { me.position.set(h.x, 2.5 + (h.yOff || 0), h.z); me.scale.setScalar(0.3 + k * 1.2); kaiSpin(me, dt2, 2); });
                return true;
              }
              const k = (el - T1) / T2;
              if (acc > 0.04 && FX.near(x, z, 55)) { acc = 0; FX.implode(x, 2.6, z, R * (1 - k * 0.45), { n: 5, color: UMB.c, color2: 0xffffff, life: 0.28, streak: true }); FX.implode(x, 2.4, z, R, { n: 2, color: UMB.pale, color2: UMB.deep, life: 0.4, size: [0.2, 0.7] }); if (Math.random() < 0.5) FX.arcs(x, 2.4, z, 2 + k * 2.5, 1, UMB.c); }
              if (el < T1 + T2) return true;
              const n = h.atom || 0; h.atom = 0; umbAtom(h, x, z, R, base * (1 + 0.05 * n)); if (n && h === G.player) FX.text(x, 4, z, '+' + n * 5 + '% от маны', '#c9b8ff', 16);
              return false;
            }
          });
        }
      }
    ]
  }
);

/* ===== roster, part 7: Rampage the blood reaper — a scythe taller than himself, blood paid and blood taken, cooldowns that reset on every takedown ===== */
const RMP = { c: 0xff2a3a, hot: 0xff7a6a, mid: 0xb80f1c, deep: 0x5a060c, dark: 0x1c0306, pool: 0x4a0408 };
// a scythe lying flat (shaft along z, blade curving toward +x), centred so it can spin: the thrown one, and a spectral all-light one for the ultimate
function rmpScythe(spectral) {
  if (!_vint.mat) vintMesh('rocket');
  const key = spectral ? 'rscyG' : 'rscy';
  if (!_vint[key]) {
    const g = new THREE.Group(), k = kit(), GL = { g: RMP.c }, sh = spectral ? { g: RMP.deep } : 0x1c1012, bl = spectral ? { g: RMP.mid } : 0x6c727c, ed = spectral ? { g: 0xffb0a8 } : GL, rho = 1.2, n = 7, f0 = -0.21, f1 = 1.8, Cx = 0.25, Cz = 0.35;
    k.y(0.05, 0.06, 3.4, 6, sh, 0, 0, -0.2, HPI).i(0.13, spectral ? GL : 0x8a7a55, 0, 0, 1.52).c(0.06, 0.3, 5, spectral ? GL : 0x8a7a55, 0, 0, -2.0, -HPI);
    for (let i = 0; i < n; i++) {
      const f = lerp(f0, f1, (i + 0.5) / n), w = lerp(0.46, 0.06, Math.pow((i + 0.5) / n, 1.3)), ro = rho - w / 2 + 0.05, len = rho * (f1 - f0) / n + 0.06;
      k.b(w, 0.05, len, bl, Cx + ro * Math.sin(f), 0, Cz + ro * Math.cos(f), 0, HPI + f).b(0.06, 0.06, len, ed, Cx + (rho - w + 0.07) * Math.sin(f), 0, Cz + (rho - w + 0.07) * Math.cos(f), 0, HPI + f);
    }
    k.into(g, _vint.mat, _vint.gmat); g.traverse(c => { c.castShadow = false; }); _vint[key] = g;
  }
  return _vint[key].clone(true);
}
// blood: heavy drops that fall, a few bright streaks, a puff of dark mist
function rmpBlood(x, y, z, n, dir) {
  if (!FX.near(x, z, 50)) return; n = n || 8;
  FX.burst(x, y, z, { n, color: 0xd8121e, color2: 0x4a0408, speed: [2, 8], life: [0.35, 0.8], size: [0.36, 0.06], grav: -14, up: 3, dir, spread: 0.9 });
  FX.sparks(x, y, z, { n: Math.ceil(n / 2), color: RMP.hot, color2: RMP.deep, speed: [4, 12], life: [0.2, 0.5], w: 0.1, dir, spread: 1 });
  FX.burst(x, y, z, { smoke: true, n: 2, color: 0x6a0810, color2: RMP.dark, speed: [0.3, 1.5], life: [0.4, 0.8], size: [0.8, 1.8], up: 0.6, a: 0.5 });
}
// a dark pool spreading on the ground
function rmpPool(x, z, r, dur) {
  if (!FX.near(x, z, 70)) return; const m = new THREE.Mesh(FX.geo.flat, FX.mat('fill', RMP.pool, 0.8, false)), s = r * 2 * RK; m.position.set(x, 0.06 + Math.random() * 0.02, z); m.renderOrder = 4;
  FX.add(m, dur, (k, me, dt, en) => { const g = 0.3 + 0.7 * easeOut(Math.min(1, en.t / 0.3)); me.scale.set(s * g, 1, s * g); me.material.opacity = 0.8 * Math.min(1, (dur - en.t) / 0.5); });
}
// one crescent stroke in a single colour (FX.slash adds a white core, which burns out on big full-circle strokes)
function rmpArc(x, z, ang, r, sweep, life, col, y, flip, op) {
  if (!FX.near(x, z, 60)) return; const m = new THREE.Mesh(FX.geo.flat, FX.mat('slash', col)), d = flip ? -1 : 1; m.position.set(x, y || 1.2, z);
  FX.add(m, life, (k, me) => { const s = r * 2 * RK * (0.85 + 0.15 * k); me.scale.set(s * d, 1, s); me.rotation.y = ang + (easeOut(k) - 0.5) * sweep * d; me.material.opacity = (op || 1) * (1 - k * k); });
}
function rmpBleed(h, e, tick, n) { if (!e.alive || e.struct) return; addBuff(e, { id: 'bleed' + h.id, dur: n * 0.5 + 0.05, every: 0.5, src: h, onTick: u => { damage(h, u, tick, 0, { dot: true }); rmpBlood(u.x, 1.2, u.z, 3); } }); }

HEROES.push(
  /* ================= 30. Rampage ================= */
  {
    id: 'rampage', name: 'Рэмпэйдж', title: 'Кровавый жнец', role: 'assassin', roleName: 'Жнец', build: 'assassin', bars: [5, 3, 3, 3], diffc: 2,
    lore: 'Алый жнец в ведьминской шляпе с косой выше собственного роста. Платит кровью и берёт кровью: лечится о каждого задетого, а каждая смерть врага рядом мгновенно возвращает ему умения. Один удачный удар — и он уже не останавливается.',
    look: { bulk: 1.0, h: 1.04, c1: 0x8f121c, c2: 0x4a0a10, c3: 0x1c0d0f, skin: 0x8a7462, metal: 0xa8905a, glow: 0xff2a3a, head: 'reaper', hair: 0x3a0a10, chest: 'reaper', sh: 'tatter', legs: 'boots', weapon: 'reapscythe', wc: 'reap', coat: 0x7a0f18 },
    stats: ST(650, 92, 270, 30, 62, 3.6, 27, 3.0, 0.74, 9.0, 3.3),
    innate: { name: 'Резня', icon: 'carnage', desc: 'Убийство вражеского героя или помощь в нём мгновенно перезаряжает Q, W и E, лечит на 12% максимального здоровья и на 6 сек даёт +25% скорости атаки и +15% скорости передвижения. Убийства подряд считаются: пятое за 10 сек — «РЭМПЭЙДЖ».' },
    onHeroDeath(o) {
      if (!o.alive) return; for (let i = 0; i < 3; i++) o.cd[i] = 0; heal(o, o, o.maxHp * 0.12, true);
      o.rampN = G.time < (o.rampT || 0) ? (o.rampN || 0) + 1 : 1; o.rampT = G.time + 10; const n = Math.min(5, o.rampN);
      const b = addBuff(o, { id: 'carnage', dur: 6, as: 0.25, ms: 0.15 }); if (b) b.fx = FX.aura(o, RMP.c, 6, 1.9, 'swirl', 8);
      SFX.at('dark', o.x, o.z, 0.9); FX.heal(o, RMP.c); FX.pillar(o.x, o.z, { r: 1.1 + n * 0.15, h: 9 + n * 2, color: RMP.mid, life: 0.6, op: 0.5 }); FX.ring(o.x, o.z, { r0: 3.5 + n * 0.5, r1: 0.6, color: RMP.c, life: 0.4, tex: 'shock' }); rmpBlood(o.x, 1.6, o.z, 6 + n * 3);
      if (FX.near(o.x, o.z, 45)) FX.text(o.x, o.height + 1.4, o.z, ['резня', 'двойная резня', 'тройная резня', 'бойня', 'РЭМПЭЙДЖ!'][n - 1], n >= 4 ? '#ff5a4a' : '#ff9a8a', 15 + n * 2);
      if (n >= 5 && typeof UI !== 'undefined' && G.player) { UI.announce('РЭМПЭЙДЖ!', '#ff3a3a'); FX.shake(0.6); FX.punch(1); }
    },
    abilities: [
      {
        key: 'Q', name: 'Жатва', icon: 'reap', cd: 6, cost: 35, range: 6.2, ind: { type: 'cone', r: 6.2 }, anim: 'mow', animDur: 0.55, lock: 0.32, ai: { t: 'cone', farm: true },
        desc: 'Широкий взмах косой перед собой. Враги на самом острие, дальше 4 метров, получают на 35% больше урона. За каждого задетого героя Рэмпэйдж лечится на 4% максимального здоровья, за истекающего кровью — на 8%.',
        cast(h, p) {
          const dmg = D(h, 62, 10, 0.65), R = 6.2, dir = p.dir; SFX.at('dash', h.x, h.z, 0.7);
          after(0.2, () => {
            if (!h.alive) return; let fed = 0; SFX.at('slash', h.x, h.z, 1); FX.shake(0.25);
            rmpArc(h.x, h.z, dir, R + 0.4, 2.7, 0.36, 0x8a0a14, 1.2, false, 0.9); rmpArc(h.x, h.z, dir, R - 1.2, 2.5, 0.24, RMP.mid, 1.4, false, 0.6);
            for (let i = -3; i <= 3; i++) { const a = dir + i * 0.36; FX.sparks(h.x + Math.sin(a) * (R - 0.6), 1.2, h.z + Math.cos(a) * (R - 0.6), { n: 3, color: RMP.hot, color2: RMP.deep, speed: [4, 11], life: [0.2, 0.45], dir: a + 1.2, spread: 0.7, w: 0.12 }); }
            for (const e of enemiesIn(h, h.x, h.z, R + 1)) {
              if (!inCone(h, e, dir, 1.3, R)) continue; const tip = udist(h, e) > 4, bled = hasBuff(e, 'bleed' + h.id);
              damage(h, e, dmg * (tip ? 1.35 : 1), 0); FX.hit(e.x, 1.3, e.z, RMP.c, false); rmpBlood(e.x, 1.3, e.z, tip ? 12 : 7, angTo(h.x, h.z, e.x, e.z));
              if (tip && h === G.player) FX.text(e.x, e.height + 1.2, e.z, 'остриё', '#ff9a8a', 13);
              if (e.kind === 'hero') { fed++; heal(h, h, h.maxHp * (bled ? 0.08 : 0.04)); FX.beam(e.x, e.z, h.x, h.z, { color: RMP.mid, w: 0.7, life: 0.3, y: 1.3, op: 0.8 }); }
            }
            if (fed) { FX.heal(h, RMP.c); FX.implode(h.x, 1.4, h.z, 2.6, { n: 8, color: RMP.c, color2: 0xffffff, life: 0.3, streak: true }); }
          });
        }
      },
      {
        key: 'W', name: 'Летящая коса', icon: 'scythe', cd: 10, cost: 45, range: 11, ind: { type: 'line', w: 2.8, fixed: true }, anim: 'thrust', animDur: 0.4, lock: 0.25, ai: { t: 'shot', sp: 26, farm: true },
        desc: 'Швыряет косу по прямой: она пролетает сквозь врагов и возвращается в руку, раня всех на пути туда и обратно. Каждое попадание вызывает кровотечение на 3 сек, а удар на пути туда ещё и замедляет на 35% на 1.5 сек.',
        cast(h, p) {
          const dmg = D(h, 46, 7.5, 0.45), tick = D(h, 7, 1.2, 0.07), dir = p.dir, sx = Math.sin(dir), cz = Math.cos(dir), len = p.range, m = rmpScythe(), e = FX.add(m, 6, null), rib = FX.ribbon(RMP.mid, 1.7, 16), hit = new Set();
          let x = h.x + sx * 1.2, z = h.z + cz * 1.2, out = true, left = len, sp = 34, acc = 0; h.rig.handR.visible = false; m.scale.setScalar(1.2); m.position.set(x, 1.3, z); SFX.at('arrow', h.x, h.z, 1); SFX.at('slash', h.x, h.z, 0.7);
          const finish = () => { e.dead = true; rib.end(); h.rig.handR.visible = true; };
          after(4, () => { h.rig.handR.visible = true; });
          G.actors.push({
            update(dt) {
              if (!h.alive) { finish(); return false; }
              if (out) {
                sp = lerp(10, 34, Math.min(1, left / (len * 0.45))); const st = sp * dt; x += sx * st; z += cz * st; left -= st;
                if (left <= 0.2) { out = false; hit.clear(); sp = 6; FX.ring(x, z, { r0: 0.4, r1: 2.6, color: RMP.c, life: 0.3, tex: 'ringThin' }); SFX.at('slash', x, z, 0.6); }
              } else {
                sp = Math.min(44, sp + 110 * dt); const dx = h.x - x, dz = h.z - z, d = Math.hypot(dx, dz), st = sp * dt;
                if (d <= st + 1.1) { finish(); FX.glow(h.x, 1.6, h.z, 3, RMP.c, 0.2, 'star'); SFX.at('hit', h.x, h.z, 0.5); return false; }
                x += dx / d * st; z += dz / d * st;
              }
              for (const u of G.units) {
                if (!u.alive || u.struct || u.team === h.team || hit.has(u.id)) continue; const rr = 1.5 + u.radius, dx = u.x - x, dz = u.z - z; if (dx * dx + dz * dz > rr * rr) continue;
                hit.add(u.id); damage(h, u, dmg, 0); rmpBleed(h, u, tick, 6); if (out) slow(h, u, 0.35, 1.5); rmpBlood(u.x, 1.3, u.z, 8, out ? dir : dir + Math.PI); FX.hit(u.x, 1.3, u.z, RMP.c, true); SFX.at('slash', u.x, u.z, 0.8);
              }
              m.position.set(x, 1.3, z); m.rotation.y -= dt * 26; rib.add(x, 1.3, z); acc += dt;
              if (acc > 0.04 && FX.near(x, z, 50)) { acc = 0; FX.burst(x, 1.2, z, { n: 1, color: 0xd8121e, color2: 0x4a0408, speed: [0.5, 2.5], life: [0.3, 0.6], size: [0.3, 0.05], grav: -12 }); FX.sparks(x, 1.3, z, { n: 1, color: RMP.hot, color2: RMP.deep, speed: [3, 8], life: [0.15, 0.35], w: 0.09 }); }
              return true;
            }
          });
        }
      },
      {
        key: 'E', name: 'Кровавый след', icon: 'drops', cd: 9, cost: 0, costText: '7% здоровья', range: 7.5, ind: { type: 'line', w: 2.4 }, lock: 0, ai: { t: 'gap', escape: true },
        desc: 'Стоит не маны, а 7% текущего здоровья. Рассыпается алым туманом и проносится сквозь врагов, нанося урон. За ним на 3 сек остаётся кровавая полоса: враги на ней замедлены на 25% и дважды в секунду получают урон.',
        cast(h, p) {
          const dmg = D(h, 40, 7, 0.4), tick = D(h, 9, 1.5, 0.08), pts = [{ x: h.x, z: h.z }], L = 3; let lx = h.x, lz = h.z, el = 0, acc = 0.25, shown = false;
          h.hp = Math.max(1, h.hp * 0.93); SFX.at('dash', h.x, h.z, 1); SFX.at('poison', h.x, h.z, 0.6); rmpBlood(h.x, 1.4, h.z, 14); rmpPool(h.x, h.z, 1.6, L); h.rig.root.visible = false;
          dashTo(h, p.x, p.z, 36, {
            w: 1.5, ribbon: RMP.mid,
            trail: u => {
              if (FX.near(u.x, u.z, 50)) { FX.burst(u.x, 1.2, u.z, { smoke: true, n: 2, color: 0x8a0c16, color2: RMP.dark, speed: [0.3, 1.6], life: [0.35, 0.7], size: [1.2, 2.4], up: 0.5, a: 0.6 }); FX.flame(u.x, 1.2, u.z, { n: 1, color: RMP.mid, color2: RMP.dark, size: [0.9, 1.8], life: [0.2, 0.45], up: 0.3, a: 0.35 }); FX.burst(u.x, 1.4, u.z, { n: 2, color: 0xd8121e, color2: 0x4a0408, speed: [1, 4], life: [0.3, 0.6], size: [0.3, 0.05], grav: -12 }); }
              if (dist(u.x, u.z, lx, lz) > 1.0) { lx = u.x; lz = u.z; pts.push({ x: lx, z: lz }); rmpPool(lx, lz, 1.6, L); }
            },
            onHit: (e, u) => { damage(u, e, dmg, 0); rmpBlood(e.x, 1.3, e.z, 10, u.facing); FX.hit(e.x, 1.3, e.z, RMP.c, false); rmpArc(e.x, e.z, u.facing, 2.2, 1.2, 0.2, RMP.mid, 1.3); SFX.at('slash', e.x, e.z, 0.7); }
          });
          G.actors.push({
            update(dt) {
              el += dt;
              if (!shown && !h.dash) { shown = true; h.rig.root.visible = true; pts.push({ x: h.x, z: h.z }); rmpPool(h.x, h.z, 1.6, L); if (h.alive) { rmpBlood(h.x, 1.4, h.z, 12); FX.ring(h.x, h.z, { r1: 2.6, color: RMP.c, life: 0.3, tex: 'shock', op: 0.8 }); } }
              acc += dt; if (acc < 0.5) return el < L + 0.6; acc -= 0.5; if (el > L) return false;
              const done = new Set(); for (const q of pts) for (const u of enemiesIn(h, q.x, q.z, 1.5)) if (!done.has(u.id)) { done.add(u.id); damage(h, u, tick, 0, { dot: true }); slow(h, u, 0.25, 0.7, 'bloodtrail'); rmpBlood(u.x, 0.8, u.z, 3); }
              return true;
            }
          });
        }
      },
      {
        key: 'R', name: 'Багровая жатва', icon: 'bloodmoon', cd: 90, cost: 100, range: 0, ind: { type: 'self', r: 7.5 }, anim: 'moon', animDur: 1.3, lock: 1.2, ai: { t: 'nova', r: 6, ult: true, hp: 0.5 },
        desc: 'Взмывает над землёй под кровавой луной: 0.9 сек враги в радиусе 7.5 замедлены на 35%, а сам он получает вдвое меньше урона. Затем исполинская коса описывает полный круг: огромный урон и кровотечение всем вокруг, а герои, у которых после удара осталось меньше 14 / 18 / 22% здоровья, казнены. За каждого задетого героя — лечение на 6% максимального здоровья. Если жатва убила героя, её перезарядка сокращается вдвое.',
        cast(h) {
          const R = 7.5, T = 0.9, lv = Math.max(1, h.al[3]), dmg = D(h, 110, 20, 0.8), tick = D(h, 8, 1.4, 0.08), thr = 0.1 + 0.04 * lv; let el = 0, acc = 0, a0 = h.facing, struck = false;
          addBuff(h, { id: 'bloodmoon', dur: T + 0.4, dmgIn: 0.5, air: 1.7 }); h.order = null; h.path = null; SFX.at('dark', h.x, h.z, 1); SFX.at('overload', h.x, h.z, 0.7);
          // the moon: a dark disc on the ground with a sigil, an eclipsed sphere overhead
          const disc = new THREE.Mesh(FX.geo.flat, FX.mat('fill', 0x2a0206, 0.5, false)); disc.position.set(h.x, 0.07, h.z); disc.renderOrder = 4; disc.scale.set(R * 2 * RK, 1, R * 2 * RK);
          FX.add(disc, T + 0.5, (k, me, dt, en) => { me.material.opacity = 0.55 * Math.min(1, en.t / 0.2, (T + 0.5 - en.t) / 0.3); });
          FX.zone(h.x, h.z, R, RMP.mid, T + 0.3, { tex: 'rune', spin: -1.6, op: 0.7 }); FX.zone(h.x, h.z, R, RMP.c, T + 0.3, { tex: 'ring', spin: 0.6, op: 0.9 }); FX.ring(h.x, h.z, { r0: R + 2, r1: R, color: RMP.c, life: 0.35, tex: 'shock', op: 0.7 });
          FX.add(kaiOrb(RMP.c, 0x1c0204, 1.7), T + 0.45, (k, me, dt, en) => { me.position.set(h.x, 9.5, h.z - 2.5); kaiSpin(me, dt, 0.4); me.scale.setScalar(Math.min(1, en.t / 0.3) * Math.min(1, (T + 0.45 - en.t) / 0.2)); });
          FX.pillar(h.x, h.z, { r: 1.3, h: 12, color: RMP.mid, life: T, op: 0.4, grow: true });
          // the spectral scythe: hangs over him growing, then mows the full circle
          const sc = rmpScythe(true), SW = 0.3;
          FX.add(sc, T + SW + 0.25, (k, me, dt, en) => {
            const t = en.t;
            if (t < T) { const g = easeOut(t / T); me.scale.setScalar(0.4 + 2.2 * g); me.position.set(h.x, 5.2 + (h.yOff || 0), h.z); me.rotation.set(0, a0 + t * 3, 0.5 * (1 - g)); return; }
            const q = Math.min(1, (t - T) / SW), a = a0 + q * TAU * 1.08, rr = R * 0.5, fade = t > T + SW ? Math.max(0.05, 1 - (t - T - SW) / 0.25) : 1;
            me.scale.setScalar(2.6 * fade); me.position.set(h.x + Math.sin(a) * rr, 1.5, h.z + Math.cos(a) * rr); me.rotation.set(0, a, 0);
          });
          G.actors.push({
            update(dt) {
              el += dt; acc += dt; if (!h.alive) return false;
              if (el < T) {
                if (acc > 0.2) { acc = 0; for (const e of enemiesIn(h, h.x, h.z, R)) { slow(h, e, 0.35, 0.45, 'moon'); if (FX.near(e.x, e.z, 50)) FX.beam(e.x, e.z, h.x, h.z, { color: RMP.deep, w: 0.5, life: 0.25, y: 1.2, op: 0.7 }); } FX.implode(h.x, 3, h.z, R, { n: 6, color: RMP.c, color2: RMP.deep, life: 0.35, size: [0.2, 0.6] }); }
                return true;
              }
              if (!struck) {
                struck = true; h.spinning = true; const x = h.x, z = h.z, before = G.heroes.filter(o => o.alive && o.team !== h.team); let fed = 0;
                SFX.at('bigboom', x, z, 1); SFX.at('slash', x, z, 1); FX.shake(0.9); FX.punch(1.2); FX.hitstop(0.06); FX.shock(x, z, R * 1.5, 1.2, 0.5); FX.light(x, 4, z, RMP.c, 3.5, 40, 0.6);
                for (let i = 0; i < 3; i++) after(i * 0.09, () => { rmpArc(x, z, a0 + i * 2.1, R + 0.4 - i * 0.9, 6, 0.42, i === 1 ? RMP.mid : 0x8a0a14, 1.1 + i * 0.3, i === 1, i === 1 ? 0.55 : 0.8); FX.ring(x, z, { r0: 1, r1: R + i, color: i === 2 ? RMP.hot : RMP.mid, life: 0.5, tex: i ? 'ringThin' : 'shock' }); });
                FX.burst(x, 1.2, z, { n: 70, ring: true, color: 0xd8121e, color2: 0x3a0206, speed: [8, 20], life: [0.4, 0.9], size: [0.42, 0.06], grav: -10, up: 4 }); FX.sparks(x, 1.2, z, { n: 50, color: RMP.hot, color2: RMP.deep, speed: [12, 30], life: [0.25, 0.6], ring: true, w: 0.15, stretch: 0.1 });
                FX.flame(x, 1, z, { n: 16, color: RMP.mid, color2: RMP.dark, size: [2, 4.2], life: [0.5, 1.1], rad: R * 0.6, up: 2, a: 0.35 }); rmpPool(x, z, R * 0.85, 3.5); FX.scorch(x, z, R * 0.8, RMP.mid, 8);
                for (const e of enemiesIn(h, x, z, R)) {
                  damage(h, e, dmg, 0); rmpBleed(h, e, tick, 6); FX.hit(e.x, 1.3, e.z, RMP.c, false); rmpBlood(e.x, 1.4, e.z, 12, angTo(x, z, e.x, e.z));
                  if (e.kind !== 'hero') continue; fed++;
                  if (e.alive && e.hp / e.maxHp < thr) {   // execution
                    damage(h, e, (e.hp + (e.shield || 0)) * 3 + 500, 2); FX.pillar(e.x, e.z, { r: 1, h: 14, color: RMP.c, life: 0.6, op: 0.6 }); FX.explosion(e.x, e.z, 2, RMP.mid, { smoke: false }); rmpBlood(e.x, 1.6, e.z, 20);
                    if (FX.near(e.x, e.z, 45)) FX.text(e.x, e.height + 1.6, e.z, 'КАЗНЬ', '#ff3a3a', 22);
                  }
                }
                if (fed) { heal(h, h, h.maxHp * 0.06 * fed); FX.heal(h, RMP.c); }
                if (before.some(o => !o.alive)) { h.cd[3] *= 0.5; if (h === G.player) FX.text(x, h.height + 2.2, z, 'жатва продолжается', '#ff9a8a', 15); }
                // blood rain
                for (let i = 0; i < 14; i++) after(0.15 + i * 0.07, () => { const a = rand(TAU), r = Math.sqrt(Math.random()) * R; FX.burst(x + Math.sin(a) * r, 7, z + Math.cos(a) * r, { n: 4, color: 0xd8121e, color2: 0x4a0408, speed: [0, 1], life: [0.45, 0.6], size: [0.34, 0.1], up: -13, rad: 1 }); });
              }
              if (el < T + 0.32) return true;
              h.spinning = false; return false;
            }
          });
        }
      }
    ]
  }
);

/* ===== roster, part 8: Jin, who keeps his hands in his pockets, and Astra, the guardian spirit that fights for him ===== */
const JIN = { c: 0xffcf40, pale: 0xfff0b8, deep: 0x8a5a08, vio: 0x8f7fe0, vdeep: 0x2a2266 };
const JIN_STAND = { bulk: 1.3, h: 1.08, scale: 1.28, c1: 0x3a2f8a, c2: 0x2a2266, c3: 0x1c1746, skin: 0x8f7fe0, metal: 0xe0b84a, glow: 0xffcf40, head: 'astral', hair: 0x17143a, chest: 'bare', sh: 'round', legs: 'boots', weapon: 'fists', wc: 'spirit', arm: 1.2 };
// the spirit is not a unit: it is a second rig kept as a mesh effect for the whole match and posed every frame from its master's state
function jinStand(h) {
  const rig = buildHero(JIN_STAND, 0xffffff), m = rig.mats[0]; rig.ring.visible = false; m.transparent = true; m.opacity = 0.88; m.emissive = new THREE.Color(0x2a1f66); rig.root.traverse(c => { c.castShadow = false; });
  const S = { rig, id: h.id + 0.37, facing: h.facing, moving: false, ms: 8, flash: 0, dead: false, yOff: 0.45, anim: { walk: 0, atkT: 0, atkDur: 1, castT: 0, castDur: 1, castType: 'cast', deathT: 0, spinA: 0, alt: false } };
  const st = h.stand = { S, rig, x: h.x, z: h.z, hold: 0, hx: 0, hz: 0, hf: 0 };
  FX.add(rig.root, 1e9, (k, me, dt) => jinStandTick(h, st, dt)); return st;
}
function jinStandTick(h, st, dt) {
  const S = st.S, rig = st.rig, t = G.time, tgt = h.windupTgt; let tx, tz, face, q = Math.min(1, dt * 14);
  if (!h.alive || !h.rig.root.visible) { rig.root.visible = false; st.x = h.x; st.z = h.z; st.hold = 0; return; }
  rig.root.visible = true;
  if (t < st.hold) { tx = st.hx; tz = st.hz; face = st.hf; q = Math.min(1, dt * 22); }                       // sent somewhere by an ability
  else if (h.anim.atkT > 0 && tgt && tgt.alive) {                                                           // a basic attack: it goes to the target and throws the punch
    const a = angTo(h.x, h.z, tgt.x, tgt.z), d = Math.max(0.6, udist(h, tgt) - tgt.radius - 1.3); tx = h.x + Math.sin(a) * d; tz = h.z + Math.cos(a) * d; face = a; q = Math.min(1, dt * 26);
    S.anim.atkT = h.anim.atkT; S.anim.atkDur = h.anim.atkDur; S.anim.alt = h.anim.alt;
  } else { const f = h.facing; tx = h.x - Math.sin(f) * 0.9 + Math.cos(f) * 1.1; tz = h.z - Math.cos(f) * 0.9 - Math.sin(f) * 1.1; face = f; }   // at rest: behind his shoulder, arms crossed
  const ox = st.x, oz = st.z; st.x += (tx - st.x) * q; st.z += (tz - st.z) * q; S.facing = face; S.yOff = 0.45 + Math.sin(t * 2.4 + h.id) * 0.12 + (h.yOff || 0);
  if (dt > 0) animHero(S, dt); rig.root.position.x = st.x; rig.root.position.z = st.z;
  if (dt > 0 && dist(ox, oz, st.x, st.z) > 0.22 && FX.near(st.x, st.z, 50)) FX.trail(st.x, 1.7, st.z, JIN.vio, 0.75, 2);
}
// send the spirit to a spot for a while, optionally in a pose
function jinHold(h, x, z, face, dur, cast, castDur) {
  const st = h.stand || jinStand(h); st.hold = G.time + dur; st.hx = x; st.hz = z; st.hf = face;
  if (cast) { st.S.anim.castT = st.S.anim.castDur = castDur || dur; st.S.anim.castType = cast; st.S.anim.atkT = 0; }
}
function jinStar(x, y, z, s) { if (!FX.near(x, z, 50)) return; FX.glow(x, y, z, 3.2 * s, JIN.c, 0.2, 'star'); FX.sparks(x, y, z, { n: Math.round(9 * s), color: 0xffffff, color2: JIN.c, speed: [6, 16], life: [0.15, 0.4], w: 0.13 }); FX.ring(x, z, { r0: 0.3, r1: 1.9 * s, color: JIN.c, life: 0.25, tex: 'ringThin', y }); }
function jinOra(x, y, z, big) { FX.text(x + rand(-0.9, 0.9), y + rand(0, 0.9), z + rand(-0.5, 0.5), 'ОРА!', '#ffd84a', big ? 26 : 14 + Math.random() * 7); }
// a fist-sized streak thrown forward: the barrage is too fast to see whole
function jinFist(x, y, z, dir, len) {
  if (!FX.near(x, z, 50)) return; if (!_vint.jfist) _vint.jfist = new THREE.BoxGeometry(0.46, 0.46, 0.62);
  const m = new THREE.Mesh(_vint.jfist, FX.mat(null, JIN.vio, 0.9)), sx = Math.sin(dir), cz = Math.cos(dir); m.rotation.y = dir;
  FX.add(m, 0.13, (k, me) => { const d = len * easeOut(k); me.position.set(x + sx * d, y, z + cz * d); me.material.opacity = 0.9 * (1 - k); me.scale.set(1, 1, 1 + k * 2.4); });
}
// the clock face laid on the ground while time stands still, under a pale dome
function jinClock(x, z, R, dur) {
  const g = new THREE.Group(), add = (m, own) => { m.userData.own = own !== false; g.add(m); return m; }, lm = FX.mat('line', JIN.c, 0.85), L = dur + 0.35; g.position.set(x, 0.12, z);
  const r1 = add(new THREE.Mesh(FX.geo.flat, FX.mat('ring', JIN.c, 0.9))); r1.scale.set(R * 2 * RK, 1, R * 2 * RK); const r2 = add(new THREE.Mesh(FX.geo.flat, FX.mat('ringThin', JIN.pale, 0.7))); r2.scale.set(R * 1.72 * RK, 1, R * 1.72 * RK);
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, m = add(new THREE.Mesh(FX.geo.line, lm), false); m.position.set(Math.sin(a) * R * 0.74, 0, Math.cos(a) * R * 0.74); m.rotation.y = a; m.scale.set(i % 3 ? 0.22 : 0.42, 1, R * (i % 3 ? 0.09 : 0.14)); }
  const hh = add(new THREE.Mesh(FX.geo.line, lm), false), mh = add(new THREE.Mesh(FX.geo.line, lm)); hh.scale.set(0.5, 1, R * 0.4); hh.rotation.y = 2.1; mh.scale.set(0.34, 1, R * 0.64); mh.rotation.y = -0.5;
  FX.add(g, L, (k, me, dt, en) => { const f = Math.min(1, en.t / 0.2, (L - en.t) / 0.35); for (const c of me.children) c.material.opacity = (c === r2 ? 0.6 : 0.85) * f; mh.rotation.y = -0.5 + Math.sin(en.t * 40) * 0.012; });   // the hands only tremble
  const dome = new THREE.Mesh(FX.geo.sphere, FX.rimMat(0xb8c4d8, 0.6)); dome.position.set(x, 0, z);
  FX.add(dome, L, (k, me, dt, en) => { me.scale.setScalar(R * Math.min(1, easeOut(en.t / 0.25))); me.material.uniforms.o.value = 0.6 * Math.min(1, (L - en.t) / 0.35); });
}

HEROES.push(
  /* ================= 31. Jin ================= */
  {
    id: 'jin', name: 'Дзин', title: 'Хозяин духа', role: 'front', roleName: 'Заклинатель', build: 'bruiser', bars: [4, 3, 4, 2], diffc: 2, pal: JIN_STAND, noSlash: true,
    lore: 'Молчит, не вынимает рук из карманов и не сходит с места. За него дерётся Астра — дух-хранитель с кулаками быстрее взгляда: бьёт врага рядом, достаёт дальнего, подбрасывает хозяина через стены. А когда Дзин поправляет кепку, время останавливается для всех, кроме него.',
    look: { bulk: 1.02, h: 1.1, c1: 0x1c1e2e, c2: 0x15161f, c3: 0x26283a, skin: 0xcfa98a, hands: 0xcfa98a, metal: 0xd4af4a, glow: 0xffcf40, head: 'delinq', hair: 0x14141b, shirt: 0x5a3a9a, chest: 'gakuran', sh: 'none', legs: 'boots', weapon: 'none', wc: 'stand', coat: 0x1c1e2e },
    stats: ST(660, 92, 280, 32, 60, 3.5, 28, 3.0, 0.8, 8.8, 3.6),
    innate: { name: 'Дух-хранитель', icon: 'stand', desc: 'Вместо Дзина бьёт Астра: она подлетает к цели сама, пока он стоит в стороне. Каждый четвёртый её удар — тяжёлый: дополнительный урон (растёт с уровнем и силой атаки) и замедление на 25% на 1 сек.' },
    tick(h) { if (!h.stand) jinStand(h); },
    onDeal(h, t, d, o) {
      if (!o.basic || t.struct) return; SFX.at('hit', t.x, t.z, 0.5); jinStar(t.x, t.height * 0.6, t.z, 0.6); h.oraN = (h.oraN || 0) + 1; if (h.oraN < 4) return; h.oraN = 0;
      damage(h, t, 18 + 6 * h.level + 0.35 * h.ad, 0, { dot: true }); if (t.alive) slow(h, t, 0.25, 1, 'ora'); jinStar(t.x, t.height * 0.6, t.z, 1.3); jinOra(t.x, t.height + 0.8, t.z); FX.shake(0.15);
    },
    abilities: [
      {
        key: 'Q', name: 'Шквал ударов', icon: 'barrage', cd: 8, cost: 40, range: 4.8, ind: { type: 'cone', r: 4.8, narrow: true }, anim: 'point', animDur: 1.35, lock: 1.3, ai: { t: 'cone' },
        desc: 'Астра 1.2 сек осыпает кулаками всё перед собой: девять быстрых ударов и десятый, тяжёлый, с отбрасыванием. Оглушение Дзина прерывает шквал.',
        cast(h, p) {
          const hit = D(h, 11, 1.8, 0.13), fin = D(h, 42, 6.5, 0.4), dir = p.dir, R = 4.8, sx = Math.sin(dir), cz = Math.cos(dir); let el = 0, nx = 0.1, n = 0; h.order = null; h.path = null;
          jinHold(h, h.x + sx * 1.5, h.z + cz * 1.5, dir, 0.3, 'flurry', 1.3);
          G.actors.push({
            update(dt) {
              el += dt; if (!h.alive || h.stunned) { h.castLock = 0; h.anim.castT = 0; if (h.stand) { h.stand.hold = 0; h.stand.S.anim.castT = 0; } return false; }
              const fx = h.x + sx * 1.5, fz = h.z + cz * 1.5, foes = () => enemiesIn(h, h.x, h.z, R + 1).filter(e => inCone(h, e, dir, 0.62, R)); jinHold(h, fx, fz, dir, 0.25);
              if (el < nx) return true;
              if (n < 9) {
                nx += 0.125; n++; SFX.at('hit', fx, fz, 0.55); if (n % 2) jinOra(fx + sx * 1.6, 2.5, fz + cz * 1.6);
                for (let k = 0; k < 2; k++) { const o = rand(-0.9, 0.9); jinFist(fx + cz * o, rand(1.1, 2.5), fz - sx * o, dir + rand(-0.22, 0.22), rand(2, 3.3)); }
                for (const e of foes()) { damage(h, e, hit, 0); if (FX.near(e.x, e.z, 50)) { FX.sparks(e.x + rand(-0.5, 0.5), rand(0.9, 2), e.z + rand(-0.5, 0.5), { n: 4, color: JIN.pale, color2: JIN.deep, speed: [5, 13], life: [0.15, 0.35], w: 0.12, dir, spread: 1.1 }); if (n % 3 === 0) FX.glow(e.x, 1.4, e.z, 1.8, JIN.c, 0.15, 'star'); } }
                return true;
              }
              SFX.at('boom', fx, fz, 0.6); SFX.at('hit', fx, fz, 1); FX.shake(0.4); FX.punch(0.6); FX.shock(fx + sx * 1.5, fz + cz * 1.5, 5, 0.9, 0.35); jinOra(fx + sx * 1.6, 3, fz + cz * 1.6, true);
              jinFist(fx, 1.7, fz, dir, 4); FX.ring(fx + sx * 1.6, fz + cz * 1.6, { r0: 0.4, r1: 3.2, color: JIN.c, life: 0.35, tex: 'shock' });
              for (const e of foes()) { damage(h, e, fin, 0); knock(e, h.x, h.z, 3.5, 0.25); jinStar(e.x, 1.4, e.z, 1.4); }
              const a = h.stand.S.anim; a.castT = 0; a.atkT = a.atkDur = 0.3; h.stand.hold = G.time + 0.25; return false;
            }
          });
        }
      },
      {
        key: 'W', name: 'Звёздный удар', icon: 'starfist', cd: 11, cost: 55, range: 8.5, ind: { type: 'circle', r: 2.8 }, anim: 'point', animDur: 0.5, lock: 0.3, ai: { t: 'point', rad: 2.8, delay: 0.42 },
        desc: 'Астра бросается в указанную точку и через 0.4 сек бьёт в землю: урон и оглушение на 0.8 сек всем врагам рядом.',
        cast(h, p) {
          const x = p.x, z = p.z, R = 2.8, dmg = D(h, 70, 11, 0.6); telegraph(h, x, z, R, 0.42, JIN.c); SFX.at('dash', h.x, h.z, 0.8);
          jinHold(h, x - Math.sin(p.dir) * 1.1, z - Math.cos(p.dir) * 1.1, p.dir, 0.8, 'slam', 0.62); FX.beam(h.x, h.z, x, z, { color: JIN.vio, w: 0.9, life: 0.3, y: 1.6, op: 0.6 });
          after(0.42, () => {
            if (!h.alive) return; SFX.at('boom', x, z, 0.8); SFX.at('hit', x, z, 1); FX.explosion(x, z, 2.2, JIN.c, { el: 'earth', rock: 0x4a4640, smoke: false }); FX.ring(x, z, { r0: 0.5, r1: R + 0.3, color: JIN.c, life: 0.4, tex: 'shock' });
            FX.ring(x, z, { r0: R * 0.8, r1: R, color: JIN.c, life: 1.6, tex: 'crack', op: 0.8 }); FX.shock(x, z, 5, 0.9, 0.4); jinStar(x, 1, z, 1.7); jinOra(x, 3, z, true);
            for (const e of enemiesIn(h, x, z, R)) { damage(h, e, dmg, 0); stun(h, e, 0.8); FX.hit(e.x, 1.2, e.z, JIN.c, false); }
          });
        }
      },
      {
        key: 'E', name: 'Толчок духа', icon: 'standleap', cd: 12, cost: 45, range: 8, ind: { type: 'circle', r: 3 }, lock: 0, ai: { t: 'gap', escape: true, rad: 2.5 },
        desc: 'Астра бьёт в землю под ногами, и Дзина подбрасывает в указанную точку, в том числе через стены. При приземлении — урон и замедление на 35% на 1.5 сек всем врагам рядом.',
        cast(h, p) {
          const dmg = D(h, 45, 7.5, 0.45); jinHold(h, h.x, h.z, p.dir, 0.32, 'slam', 0.3); FX.explosion(h.x, h.z, 1.8, JIN.c, { el: 'earth', rock: 0x4a4640, smoke: false }); jinStar(h.x, 0.6, h.z, 1.2); SFX.at('boom', h.x, h.z, 0.5); SFX.at('dash', h.x, h.z, 1);
          dashTo(h, p.x, p.z, 28, {
            fly: true, arc: 3, ribbon: JIN.c, trail: u => { if (FX.near(u.x, u.z, 50)) FX.sparks(u.x, 1 + (u.yOff || 0), u.z, { n: 1, color: 0xffffff, color2: JIN.c, speed: [1, 4], life: [0.2, 0.4], w: 0.09 }); },
            onEnd: u => {
              FX.ring(u.x, u.z, { r0: 0.4, r1: 3.2, color: JIN.c, life: 0.35, tex: 'shock' }); FX.shock(u.x, u.z, 4.5, 0.7, 0.3); FX.debris(u.x, 0.3, u.z, { n: 6, color: 0x4a4640, speed: [3, 7], up: 7, size: [0.15, 0.4] }); SFX.at('hit', u.x, u.z, 1); jinStar(u.x, 0.8, u.z, 1.2);
              for (const e of enemiesIn(u, u.x, u.z, 3)) { damage(u, e, dmg, 0); slow(u, e, 0.35, 1.5); FX.hit(e.x, 1.2, e.z, JIN.c, false); }
            }
          });
        }
      },
      {
        key: 'R', name: 'Остановка времени', icon: 'timestop', cd: 110, cost: 120, range: 0, ind: { type: 'self', r: 9 }, anim: 'cap', animDur: 0.9, lock: 0.45, ai: { t: 'nova', r: 6.5, ult: true, hp: 0.6, rad: 7 },
        desc: 'Через 0.4 сек время вокруг замирает: все враги в радиусе 9 застывают на 1.8 / 2.2 / 2.6 сек и получают на 15% больше урона, а вражеские снаряды в этой области повисают в воздухе. Дзин и его союзники двигаются свободно.',
        cast(h) {
          const R = 9, lv = Math.max(1, h.al[3]), dur = 1.4 + 0.4 * lv, T = 0.4; SFX.at('overload', h.x, h.z, 0.8); SFX.at('dark', h.x, h.z, 0.7);
          jinHold(h, h.x + Math.sin(h.facing) * 1.3, h.z + Math.cos(h.facing) * 1.3, h.facing, T + 0.5, 'cast', T + 0.5);
          FX.ring(h.x, h.z, { r0: R + 3, r1: 0.6, color: JIN.c, life: T, tex: 'ringThin' }); FX.ring(h.x, h.z, { r0: R, r1: 0.6, color: JIN.pale, life: T, tex: 'ringThin', op: 0.6 }); FX.implode(h.x, 1.8, h.z, R, { n: 26, color: JIN.c, color2: 0xffffff, life: T, streak: true });
          after(T, () => {
            if (!h.alive) return; const x = h.x, z = h.z; G.tstop = { x, z, r: R, team: h.team, until: G.time + dur };
            SFX.at('bigboom', x, z, 0.7); SFX.at('void', x, z, 1); FX.shock(x, z, R * 1.6, 1.3, 0.6); FX.punch(1.2); FX.shake(0.5); FX.ring(x, z, { r0: 0.6, r1: R + 1, color: JIN.c, life: 0.45, tex: 'shock' }); jinStar(x, 2.2, z, 2.2);
            if (FX.near(x, z, R + 24)) G.tinv = 1;
            jinClock(x, z, R, dur);
            for (const e of enemiesIn(h, x, z, R)) {
              const b = addBuff(e, { id: 'tstop', dur, stun: true, dmgIn: 1.15, src: h }); if (!b) continue; e.tstopT = G.time + b.dur; b.fx = FX.aura(e, 0xb8c4d8, b.dur, e.radius + 0.7, 'ringThin', 0);
              if (FX.near(e.x, e.z, 50)) FX.glow(e.x, e.height * 0.6, e.z, 2.6, 0xb8c4d8, 0.3, 'star');
            }
            if (G.player && G.player.team !== h.team && G.player.alive && dist(G.player.x, G.player.z, x, z) < R + G.player.radius && typeof UI !== 'undefined') UI.announce('ВРЕМЯ ОСТАНОВЛЕНО', '#ffd84a');
            after(dur, () => { FX.ring(x, z, { r0: R * 0.3, r1: R + 2, color: JIN.pale, life: 0.5, tex: 'ringThin' }); FX.shock(x, z, R, 0.6, 0.4); SFX.at('shield', x, z, 0.8); if (h === G.player && h.alive) FX.text(h.x, h.height + 1.4, h.z, 'время пошло', '#ffe9a0', 15); });
          });
        }
      }
    ]
  }
);

/* ===== roster, part 9: Hikaru, who writes names in a black notebook, and Kurai, the death god who follows him to watch ===== */
const HIK = { c: 0xd4143c, hot: 0xff6a70, mid: 0x9a0c26, deep: 0x4a0612, ink: 0x0b0a0e, page: 0xf2eee2 };
const HIK_GOD = { bulk: 0.86, h: 1.24, scale: 1.3, c1: 0x15141a, c2: 0x0c0b10, c3: 0x26242c, skin: 0x97a3b3, metal: 0xb8b0a0, glow: 0xd4143c, head: 'shinigami', hair: 0x0c0c12, chest: 'feather', sh: 'feather', legs: 'boots', weapon: 'claws', wc: 'ghoul', arm: 0.95, back: 'wings' };
// props built once and cloned: a loose page, the open notebook, an apple
function hikProp(kind) {
  if (!_vint.mat) vintMesh('rocket');
  const key = 'hk_' + kind;
  if (!_vint[key]) {
    const g = new THREE.Group(), k = kit(), GL = { g: HIK.c }, ln = 0x2a2630;
    if (kind === 'page') { k.b(0.44, 0.012, 0.58, HIK.page, 0, 0, 0); for (let i = 0; i < 4; i++) k.b(0.3 - (i % 2) * 0.08, 0.018, 0.022, ln, -0.03 - (i % 2) * 0.04, 0, 0.18 - i * 0.1); }
    else if (kind === 'book') {
      for (const s of [-1, 1]) { k.b(0.5, 0.05, 0.7, HIK.ink, s * 0.25, 0, 0, 0, 0, s * 0.2).b(0.44, 0.03, 0.62, HIK.page, s * 0.25, 0.035, 0, 0, 0, s * 0.2); for (let i = 0; i < 4; i++) k.b(0.3 - (i % 2) * 0.07, 0.012, 0.022, ln, s * 0.25, 0.058, 0.2 - i * 0.12, 0, 0, s * 0.2); }
      k.b(0.05, 0.07, 0.72, HIK.ink, 0, -0.05, 0).b(0.04, 0.012, 0.5, GL, 0.1, 0.07, 0.1);
    } else k.i(0.2, 0xb3121e, 0, 0, 0, 1).y(0.012, 0.012, 0.1, 4, 0x3a2a1a, 0, 0.22, 0).b(0.09, 0.012, 0.05, 0x3f7a2a, 0.05, 0.25, 0);
    k.into(g, _vint.mat, _vint.gmat); g.traverse(c => { c.castShadow = false; }); _vint[key] = g;
  }
  return _vint[key].clone(true);
}
// loose pages thrown into the air: they slow down, flutter and sink
function hikPages(x, y, z, n, sp, life, dir) {
  if (!FX.near(x, z, 55)) return;
  for (let i = 0; i < n; i++) {
    const m = hikProp('page'), sc = rand(0.7, 1.1), a = dir === undefined ? rand(TAU) : dir + rand(-0.7, 0.7), v = rand(sp * 0.4, sp), vx = Math.sin(a) * v, vz = Math.cos(a) * v, vy = rand(2, 6), L = (life || 1) * rand(0.7, 1.2), rx = rand(-7, 7), rz = rand(-7, 7), ph = rand(TAU);
    m.position.set(x, y, z); m.rotation.set(rand(TAU), rand(TAU), rand(TAU)); m.scale.setScalar(sc);
    FX.add(m, L, (k, me, dt, en) => { const t = en.t, d = (1 - Math.exp(-t * 1.6)) / 1.6; me.position.set(x + vx * d + Math.sin(t * 5 + ph) * 0.3, Math.max(0.1, y + vy * d - 2.2 * t * t), z + vz * d); me.rotation.x += rx * dt; me.rotation.z += rz * dt; if (k > 0.8) me.scale.setScalar(Math.max(0.01, sc * (1 - k) / 0.2)); });
  }
}
function hikFeathers(x, y, z, n) {
  if (!FX.near(x, z, 55)) return;
  FX.debris(x, y, z, { n: n || 8, color: 0x0c0c12, speed: [2, 7], up: 6, size: [0.12, 0.26], life: 1.1, rad: 0.6 });
  FX.burst(x, y, z, { smoke: true, n: 4, color: 0x1a1420, color2: 0x050508, speed: [0.5, 2.5], life: [0.5, 1], size: [1, 2.2], up: 0.8, a: 0.55 });
}
// a blot of ink soaking into the ground
function hikInk(x, z, r, dur) {
  if (!FX.near(x, z, 70)) return; const m = new THREE.Mesh(FX.geo.flat, FX.mat('scorch', 0x050408, 0.85, false)), s = r * 2.4; m.position.set(x, 0.06 + Math.random() * 0.02, z); m.rotation.y = rand(TAU); m.renderOrder = 4;
  FX.add(m, dur, (k, me, dt, en) => { const g = 0.4 + 0.6 * easeOut(Math.min(1, en.t / 0.2)); me.scale.set(s * g, 1, s * g); me.material.opacity = 0.85 * Math.min(1, (dur - en.t) / 0.6); });
  FX.burst(x, 0.8, z, { smoke: true, n: 5, color: 0x0a080e, color2: 0x000000, speed: [1.5, 5], life: [0.25, 0.5], size: [0.5, 0.15], up: 2, a: 0.9 });
}
// the death god is not a unit: a second rig kept as an effect for the whole match, drifting behind his shoulder unless an ability sends him somewhere
function hikGod(h) {
  const rig = buildHero(HIK_GOD, 0xffffff), m = rig.mats[0]; rig.ring.visible = false; m.transparent = true; m.opacity = 0.92; rig.root.traverse(c => { c.castShadow = false; });
  const S = { rig, id: h.id + 0.61, facing: h.facing, moving: false, ms: 8, flash: 0, dead: false, yOff: 1, anim: { walk: 0, atkT: 0, atkDur: 1, castT: 0, castDur: 1, castType: 'cast', deathT: 0, spinA: 0, alt: false } };
  const st = h.god = { S, rig, x: h.x, z: h.z, y: 1, hold: 0, hx: 0, hz: 0, hf: 0, hy: 0 };
  FX.add(rig.root, 1e9, (k, me, dt) => hikGodTick(h, st, dt)); return st;
}
function hikGodTick(h, st, dt) {
  const S = st.S, rig = st.rig, t = G.time; let tx, tz, ty, face, q = Math.min(1, dt * 4.5);
  if (!h.alive || !h.rig.root.visible) { rig.root.visible = false; st.x = h.x; st.z = h.z; st.hold = 0; return; }
  rig.root.visible = true;
  if (t < st.hold) { tx = st.hx; tz = st.hz; ty = st.hy; face = st.hf; q = Math.min(1, dt * 15); }
  else { const f = h.facing; tx = h.x - Math.sin(f) * 1.5 - Math.cos(f) * 1.35; tz = h.z - Math.cos(f) * 1.5 + Math.sin(f) * 1.35; ty = h.noteT > t ? 1.6 : 1.0; face = angTo(st.x, st.z, h.x + Math.sin(f) * 4, h.z + Math.cos(f) * 4); }   // behind the left shoulder, peering over it
  const ox = st.x, oz = st.z; st.x += (tx - st.x) * q; st.z += (tz - st.z) * q; st.y += (ty - st.y) * q; S.facing = face; S.moving = dt > 0 && dist(ox, oz, st.x, st.z) > dt * 3; S.yOff = st.y + Math.sin(t * 1.7 + h.id) * 0.14 + (h.yOff || 0);
  if (dt > 0) animHero(S, dt); rig.root.position.x = st.x; rig.root.position.z = st.z;
}
function hikSend(h, x, z, face, dur, y, cast, castDur) {
  const st = h.god || hikGod(h); st.hold = G.time + dur; st.hx = x; st.hz = z; st.hf = face; st.hy = y === undefined ? 0.5 : y;
  if (cast) { st.S.anim.castT = st.S.anim.castDur = castDur || dur; st.S.anim.castType = cast; }
}
// "A name and a face" (innate): ability hits spell out an enemy hero's name letter by letter
const hikKnown = (h, e) => { const b = e.buffs.find(q => q.id === 'hk' + h.id); return b ? b.stacks || 1 : 0; };
function hikLetter(h, e, n) {
  if (!e.alive || e.kind !== 'hero') return; const was = hikKnown(h, e), now = Math.min(4, was + (n || 1)), b = addBuff(e, { id: 'hk' + h.id, dur: 15, src: h }); if (!b) return; b.stacks = now;
  if (now >= 4) b.fx = FX.aura(e, HIK.mid, 15, e.radius + 0.55, 'ringThin', -2.5);
  if (now > was && G.player && (h === G.player || e === G.player)) { const nm = e.name, k = Math.max(1, Math.ceil(nm.length * now / 4)); FX.text(e.x, e.height + 1.5, e.z, now >= 4 ? '«' + nm + '»' : nm.slice(0, k) + '…', now >= 4 ? '#ff5a6a' : '#e8e2d0', now >= 4 ? 17 : 13); }
  if (now >= 4 && was < 4) { FX.ring(e.x, e.z, { r0: 2.6, r1: 0.7, color: HIK.c, life: 0.4, tex: 'ringThin' }); SFX.at('dark', e.x, e.z, 0.4); }
}
// the entry: a name is written, ten seconds to wait. Any wound to the writer before then tears the page out
function hikWrite(h, tgt, dmg) {
  const T = 10, N = h.note = { tgt, until: G.time + T, broken: null, done: false }, P = G.player; h.noteT = N.until; tgt.noteMark = { until: N.until, by: h };
  const book = hikProp('book'); book.scale.setScalar(1.5); book.rotation.x = 0.5;
  const fx = [
    FX.add(book, T + 0.3, (k, me, dt, en) => { me.position.set(h.x, h.height + 1.4 + Math.sin(en.t * 2.4) * 0.12 + (h.yOff || 0), h.z); me.rotation.y += dt * 1.3; }),
    FX.add(new THREE.Mesh(FX.geo.flat, FX.mat('ring', HIK.c, 0.8)), T + 0.3, (k, me, dt, en) => { const s = lerp(3.4, 1.1, Math.min(1, en.t / T)) * 2 * RK; me.position.set(h.x, 0.13, h.z); me.scale.set(s, 1, s); me.material.opacity = 0.5 + 0.3 * Math.sin(en.t * 6); }),
    FX.add(hikProp('page'), T + 0.3, (k, me, dt, en) => { me.position.set(tgt.x, tgt.height + 1.5 + Math.sin(en.t * 3) * 0.1 + (tgt.yOff || 0), tgt.z); me.rotation.set(1.0, en.t * 1.6, 0); me.scale.setScalar(1.7); }),
    FX.add(new THREE.Mesh(FX.geo.flat, FX.mat('rune2', HIK.mid, 0.75)), T + 0.3, (k, me, dt, en) => { const s = lerp(4.6, 1.3, Math.min(1, en.t / T)) * 2 * RK; me.position.set(tgt.x, 0.12, tgt.z); me.scale.set(s, 1, s); me.rotation.y -= dt * (0.6 + en.t * 0.3); }),
    FX.add(new THREE.Mesh(FX.geo.flat, FX.mat('ringThin', HIK.c, 0.9)), T + 0.3, (k, me, dt, en) => { const s = lerp(4.6, 1.3, Math.min(1, en.t / T)) * 2 * RK; me.position.set(tgt.x, 0.14, tgt.z); me.scale.set(s, 1, s); })
  ];
  const mk = P && P.team !== h.team ? mmMark({ x: h.x, z: h.z, r: 5, color: '#ff4a5e', until: N.until }) : null;   // the victim's side is shown where the writer stands
  const stop = () => { for (const e of fx) e.dead = true; N.done = true; if (mk) mk.until = 0; if (h.note === N) { h.note = null; h.noteT = 0; } if (tgt.noteMark && tgt.noteMark.by === h) tgt.noteMark = null; };
  let el = 0, beat = 0.4, last = T;
  G.actors.push({
    update(dt) {
      if (N.done) return false; el += dt; const left = T - el; if (mk) { mk.x = h.x; mk.z = h.z; }
      if (!h.alive || N.broken) { stop(); hikTear(h, tgt); return false; }
      if (!tgt.alive) { stop(); h.cd[3] *= 0.5; if (h === P) UI.msg('Цель погибла раньше срока: половина перезарядки возвращена'); hikPages(h.x, h.height + 1.4, h.z, 4, 4, 0.8); return false; }
      beat -= dt; if (beat <= 0) { beat = lerp(1.0, 0.26, el / T); FX.ring(tgt.x, tgt.z, { r0: 0.4, r1: 1.6 + el * 0.12, color: HIK.c, life: 0.3, tex: 'ringThin', op: 0.85 }); if (P && (tgt === P || h === P)) SFX.at('hit', tgt.x, tgt.z, 0.18 + el * 0.03); }
      const sec = Math.ceil(left); if (sec < last && sec > 0) { last = sec; FX.text(tgt.x, tgt.height + 2.3, tgt.z, String(sec), sec <= 3 ? '#ff3a4a' : '#e8e2d0', sec <= 3 ? 26 : 17); if (sec <= 3 && FX.near(tgt.x, tgt.z, 50)) FX.pillar(tgt.x, tgt.z, { r: 0.7, h: 6 + (3 - sec) * 3, color: HIK.mid, life: 0.4, op: 0.4 }); }
      if (left > 0) return true;
      stop(); hikVerdict(h, tgt, dmg); return false;
    }
  });
}
function hikTear(h, tgt) {
  const P = G.player; h.cd[3] *= 0.65; SFX.at('slash', h.x, h.z, 0.8);
  hikPages(h.x, h.height + 1.4, h.z, 12, 7, 1.2); FX.ring(h.x, h.z, { r0: 0.5, r1: 3.4, color: HIK.c, life: 0.35, tex: 'ringThin' }); FX.sparks(h.x, h.height + 1.2, h.z, { n: 16, color: HIK.hot, color2: HIK.deep, speed: [4, 11], life: [0.2, 0.5], w: 0.11 });
  FX.text(h.x, h.height + 2, h.z, 'запись сорвана', '#cfc8d8', 16);
  if (!P) return;
  if (P === h) { UI.announce('Запись сорвана: вас ранили', '#ff6a5e'); SFX.play('deny'); }
  else if (P === tgt) UI.announce('Запись сорвана — вы спасены', '#7dffa8');
  else if (P.team === tgt.team) UI.announce('Запись в тетради сорвана', '#7dffa8');
}
function hikVerdict(h, tgt, dmg) {
  const n = hikKnown(h, tgt), x = tgt.x, z = tgt.z, P = G.player, near = P && (h === P || tgt === P);
  SFX.at('dark', x, z, 1); SFX.at('bigboom', x, z, 0.8); if (near) FX.hitstop(0.08);
  // the heart stops: two hard beats, a black column, feathers, the page burns away
  FX.ring(x, z, { r0: 0.3, r1: 3.2, color: HIK.c, life: 0.25, tex: 'shock' }); after(0.16, () => FX.ring(tgt.x, tgt.z, { r0: 0.3, r1: 4.6, color: HIK.c, life: 0.4, tex: 'shock' }));
  FX.pillar(x, z, { r: 1.5, h: 16, color: HIK.mid, life: 0.8, op: 0.6 }); FX.pillar(x, z, { r: 0.45, h: 20, color: HIK.c, life: 0.5, op: 0.35 });
  FX.shock(x, z, 7, 1.2, 0.5); FX.shake(0.6); FX.light(x, 3, z, HIK.c, 1.8, 26, 0.5); FX.scorch(x, z, 2.6, HIK.mid, 8); hikInk(x, z, 2.2, 5); hikFeathers(x, 2, z, 18); hikPages(x, tgt.height + 1.5, z, 5, 5, 1);
  FX.sparks(x, 1.4, z, { n: 40, color: HIK.hot, color2: HIK.deep, speed: [8, 22], life: [0.3, 0.7], ring: true, w: 0.15 });
  FX.text(x, tgt.height + 2.7, z, '«' + tgt.name + '»', '#ff4a5a', 24);
  damage(h, tgt, dmg * (1 + 0.1 * n), 2, { note: true });
  if (h.god && h.alive) FX.text(h.god.x, 4.6, h.god.z, 'хе-хе-хе', '#cfc8d8', 14);
  if (P && !tgt.alive && tgt !== P) UI.announce('Приговор исполнен: ' + tgt.name, h.team === P.team ? '#ff9aa5' : '#ff6a5e');
}

HEROES.push(
  /* ================= 32. Hikaru ================= */
  {
    id: 'hikaru', name: 'Хикару', title: 'Вершитель', role: 'mage', roleName: 'Каратель', build: 'mage', bars: [5, 1, 3, 3], diffc: 3, pal: HIK_GOD, palTint: 0x000000, palScale: 0.74, palY: 0.12, projMesh: 'blade', atkSfx: 'cast',
    lore: 'Лучший ученик школы нашёл чёрную тетрадь: тот, чьё имя в неё вписано, умирает. С тех пор за его плечом висит бог смерти Курай и ждёт, чем всё кончится. Хикару слаб в драке, но ему и не нужно драться — достаточно десяти спокойных секунд.',
    look: { bulk: 0.9, h: 1.06, c1: 0xb8a078, c2: 0x3a3a44, c3: 0x1c1c22, skin: 0xe0bfa0, hands: 0xe0bfa0, metal: 0xc9b27a, glow: 0xd4143c, head: 'kira', hair: 0x7a4a26, shirt: 0xe9e6de, tie: 0xa01224, chest: 'blazer', sh: 'none', legs: 'boots', weapon: 'note', wc: 'scribe' },
    stats: ST(540, 76, 470, 50, 46, 2.4, 19, 2.3, 0.72, 8.9, 9.5),
    innate: { name: 'Имя и лицо', icon: 'godeye', desc: 'Попадания умениями по вражескому герою открывают буквы его имени (до 4, держатся 15 сек). Каждая буква — +4% урона Хикару по этому герою и +10% урона записи в тетради.' },
    tick(h) { if (!h.god) hikGod(h); },
    onHurt(h) { if (h.note) h.note.broken = true; },
    onDeal(h, t, d, o) { if (o.dot || o.note || t.kind !== 'hero' || !t.alive) return; const n = hikKnown(h, t); if (n) damage(h, t, d * 0.04 * n / (DMG_K.hikaru || 1), 2, { dot: true }); },
    abilities: [
      {
        key: 'Q', name: 'Росчерк', icon: 'penstroke', cd: 5.5, cost: 40, range: 11, ind: { type: 'line', w: 1.8 }, anim: 'cut', animDur: 0.4, lock: 0.2, ai: { t: 'shot', sp: 32, farm: true },
        desc: 'Взмах пера: чернильный росчерк летит по прямой, ранит первого врага и замедляет его на 30% на 1.5 сек. Герою открывает букву имени.',
        cast(h, p) {
          const dmg = D(h, 68, 11, 0, 0.6), dir = p.dir; let acc = 0; SFX.at('slash', h.x, h.z, 0.7); SFX.at('arrow', h.x, h.z, 0.6);
          rmpArc(h.x + Math.sin(dir) * 1.1, h.z + Math.cos(dir) * 1.1, dir, 2.3, 1.7, 0.2, HIK.mid, 1.5);
          shot(h, {
            dir, speed: 32, range: 11, w: 0.9, color: HIK.c, mesh: 'blade', size: 1.15, ribbon: 1.2,
            trail: q => { acc++; FX.sparks(q.x, 1.5, q.z, { n: 1, color: HIK.hot, color2: HIK.deep, speed: [1, 4], life: [0.15, 0.35], w: 0.08, dir: dir + Math.PI, spread: 0.8 }); if (acc % 2 === 0) FX.burst(q.x, 1.4, q.z, { smoke: true, n: 1, color: 0x0a080e, color2: 0x000000, speed: [0.2, 1.2], life: [0.3, 0.6], size: [0.45, 0.1], up: -1.5, a: 0.85 }); },
            onHit: e => { damage(h, e, dmg, 1); slow(h, e, 0.3, 1.5); hikLetter(h, e); hikInk(e.x, e.z, 1.3, 2.5); FX.hit(e.x, 1.3, e.z, HIK.c, true); rmpArc(e.x, e.z, dir + 1.2, 1.8, 1.4, 0.18, HIK.mid, 1.4); SFX.at('hit', e.x, e.z, 0.7); }
          });
        }
      },
      {
        key: 'W', name: 'Подношение', icon: 'apple', cd: 12, cost: 60, range: 9.5, ind: { type: 'circle', r: 3 }, anim: 'toss', animDur: 0.5, lock: 0.25, ai: { t: 'point', rad: 3, delay: 0.7 },
        desc: 'Бросает яблоко в указанную точку. Через 0.7 сек за ним с неба падает Курай: урон и безмолвие на 1.2 / 1.4 / 1.6 / 1.8 сек всем врагам в радиусе 3. Каждому задетому герою открывается буква имени.',
        cast(h, p) {
          const x = p.x, z = p.z, R = 3, T = 0.7, lv = Math.max(1, h.al[1]), dmg = D(h, 82, 13, 0, 0.7), sil = 1.0 + 0.2 * lv, sx = Math.sin(p.dir), cz = Math.cos(p.dir), x0 = h.x + sx * 0.8, z0 = h.z + cz * 0.8;
          telegraph(h, x, z, R, T, HIK.c); SFX.at('arrow', h.x, h.z, 0.5);
          FX.add(hikProp('apple'), 0.5, (k, me, dt) => { me.position.set(lerp(x0, x, k), 1.7 + Math.sin(Math.PI * k) * 3 - k * 1.3, lerp(z0, z, k)); me.rotation.x += dt * 9; });
          hikSend(h, x - sx * 0.5, z - cz * 0.5, p.dir, T - 0.15, 8.5);
          after(T - 0.16, () => { if (h.alive) hikSend(h, x - sx * 0.4, z - cz * 0.4, p.dir, 1.0, 0.1, 'slam', 0.36); });
          after(T, () => {
            if (!h.alive) return; SFX.at('dark', x, z, 0.9); SFX.at('boom', x, z, 0.7); FX.shake(0.4); FX.shock(x, z, 5, 0.9, 0.4);
            for (let i = -1; i <= 1; i++) { rmpArc(x + cz * i * 0.8, z - sx * i * 0.8, p.dir + 0.5, R + 0.2, 2.2, 0.3, i ? HIK.mid : HIK.c, 1.1 + (i + 1) * 0.25, false, i ? 0.6 : 0.9); }
            FX.ring(x, z, { r0: 0.5, r1: R + 0.4, color: HIK.c, life: 0.4, tex: 'shock' }); FX.scorch(x, z, R * 0.8, HIK.mid, 7); hikInk(x, z, R * 0.7, 4); hikFeathers(x, 1.5, z, 14);
            FX.sparks(x, 1, z, { n: 22, color: HIK.hot, color2: HIK.deep, speed: [5, 15], life: [0.25, 0.6], ring: true, w: 0.13 }); FX.pillar(x, z, { r: 1.2, h: 9, color: HIK.mid, life: 0.45, op: 0.45 });
            if (FX.near(x, z, 45)) FX.text(x, 4.8, z, 'хе-хе', '#cfc8d8', 15);
            for (const e of enemiesIn(h, x, z, R)) { damage(h, e, dmg, 1); const b = silence(h, e, sil); if (b) b.fx = FX.aura(e, HIK.c, b.dur, e.radius + 0.5, 'ringThin', -4); hikLetter(h, e); FX.hit(e.x, 1.3, e.z, HIK.c, false); }
          });
        }
      },
      {
        key: 'E', name: 'Алиби', icon: 'alibi', cd: 16, cost: 55, range: 0, ind: { type: 'self', r: 4.5 }, anim: 'pages', animDur: 0.5, lock: 0.1, ai: { t: 'alibi' },
        desc: 'Вихрь вырванных страниц: щит на 3 сек и +35% скорости на 2.5 сек, а враги в радиусе 4.5 замедлены на 40% на 1.5 сек. Урон, целиком принятый щитом, не срывает запись в тетради.',
        cast(h) {
          const R = 4.5, amt = D(h, 85, 15, 0, 0.55), g = new THREE.Group(), e = FX.add(g, 3.2, null); let a = rand(TAU), el = 0;
          shield(h, h, amt, 3, 0x8a5a66); addBuff(h, { id: 'alibi', dur: 2.5, ms: 0.35 }); SFX.at('dash', h.x, h.z, 0.8); SFX.at('cast', h.x, h.z, 0.6);
          hikPages(h.x, 1.7, h.z, 16, 9, 1.1); FX.ring(h.x, h.z, { r0: 0.5, r1: R, color: HIK.c, life: 0.4, tex: 'ringThin' }); FX.ring(h.x, h.z, { r0: 0.5, r1: R * 0.8, color: 0x8a8490, life: 0.5, tex: 'swirl', spin: 9, op: 0.4 });
          for (const u of enemiesIn(h, h.x, h.z, R)) { slow(h, u, 0.4, 1.5, 'alibi'); FX.hit(u.x, 1.3, u.z, 0xd8d2c8, false); hikPages(u.x, 1.6, u.z, 2, 3, 0.7); }
          for (let i = 0; i < 7; i++) { const c = hikProp('page'); c.scale.setScalar(0.8); g.add(c); }
          G.actors.push({
            update(dt) {
              el += dt; if (el > 3 || !h.alive || !h.buffs.some(b => b.id === 'sh' + h.id && b.shield > 0)) { e.dead = true; if (h.alive && el < 2.9) hikPages(h.x, 1.6, h.z, 6, 5, 0.8); return false; }
              a += dt * 5.5; g.position.set(h.x, 1.5 + (h.yOff || 0), h.z);
              for (let i = 0; i < 7; i++) { const c = g.children[i], q = a + i * TAU / 7; c.position.set(Math.sin(q) * 1.5, Math.sin(q * 2 + i) * 0.5, Math.cos(q) * 1.5); c.rotation.set(HPI + Math.sin(q * 3) * 0.4, 0, -q); }
              return true;
            }
          });
        }
      },
      {
        key: 'R', name: 'Чёрная тетрадь', icon: 'deathnote', cd: 120, cost: 120, range: 0, global: true, ind: { type: 'note' }, anim: 'write', animDur: 1.0, lock: 0.9, ai: { t: 'note', ult: true, est: h => { const k = h.castI; h.castI = 3; const v = D(h, 195, 42, 0, 1.0) * (DMG_K.hikaru || 1); h.castI = k; return v; } },
        desc: 'Открывает тетрадь: выберите в ней любого живого вражеского героя, где бы он ни был. Через 10 сек он получит огромный чистый урон. Но если до этого Хикару потеряет хоть каплю здоровья — запись сорвана (возвращается 35% перезарядки). Враги видят отсчёт и место, где стоит Хикару.',
        cast(h, p) {
          const tgt = p.unit; if (!tgt || tgt.kind !== 'hero' || tgt.team === h.team || !tgt.alive || h.note) return false;
          const dmg = D(h, 195, 42, 0, 1.0), P = G.player, f = h.facing; SFX.at('dark', h.x, h.z, 0.9); SFX.at('cast', h.x, h.z, 0.7);
          hikWrite(h, tgt, dmg); hikSend(h, h.x - Math.sin(f) * 0.9 - Math.cos(f) * 0.9, h.z - Math.cos(f) * 0.9 + Math.sin(f) * 0.9, f, 1.2, 1.7);
          FX.ring(h.x, h.z, { r0: 4, r1: 0.6, color: HIK.c, life: 0.5, tex: 'ringThin' }); FX.pillar(h.x, h.z, { r: 1.1, h: 9, color: HIK.mid, life: 0.7, op: 0.4, grow: true });
          let t = 0; G.actors.push({ update(dt) { t += dt; if (t > 0.85 || !h.alive) return false; if (Math.random() < dt * 30) FX.sparks(h.x + Math.sin(f) * 0.6, 2.1, h.z + Math.cos(f) * 0.6, { n: 1, color: HIK.hot, color2: HIK.deep, speed: [1, 4], life: [0.15, 0.3], w: 0.07 }); return true; } });
          FX.pillar(tgt.x, tgt.z, { r: 1.3, h: 12, color: HIK.mid, life: 0.7, op: 0.5 }); FX.ring(tgt.x, tgt.z, { r0: 5, r1: 1, color: HIK.c, life: 0.5, tex: 'shock' }); SFX.at('dark', tgt.x, tgt.z, 0.8);
          if (FX.near(tgt.x, tgt.z, 45)) FX.text(tgt.x, tgt.height + 2.6, tgt.z, '«' + tgt.name + '»', '#ff4a5a', 20);
          if (P) {
            if (P === tgt) { UI.announce('Ваше имя в тетради! Раньте Хикару за 10 сек', '#ff3a4a'); SFX.play('warn'); }
            else if (P.team === tgt.team) { UI.announce('Имя «' + tgt.name + '» в тетради — раньте Хикару!', '#ff6a5e'); SFX.play('warn'); }
            else if (P !== h) UI.announce('Хикару вписал имя: ' + tgt.name, '#ff9aa5');
            else UI.msg('Имя вписано: ' + tgt.name + '. 10 сек без единой раны');
          }
        }
      }
    ]
  }
);

/* ===== roster, part 10: Dash the edgerunner — a military spine implant that outruns time, chrome arms, and an exo-frame his nerves cannot afford ===== */
const DSH = { c: 0x21f5c1, pale: 0xc8fff0, deep: 0x0a6a58, yel: 0xf2c81e, ydeep: 0x7a5a06, mag: 0xff3d9a, blu: 0x3d8bff, red: 0xff3344 };
const DSH_HUES = [0x21f5c1, 0x3d8bff, 0xff3d9a, 0xf2c81e];
// an afterimage: a frozen copy of the whole rig in one flat colour that fades out (it shares geometry with the hero; only the material is its own)
function dshGhost(h, col, life, op, pulse) {
  if (!h.rig.root.visible || !FX.near(h.x, h.z, 55)) return null; const src = h.rig.root, g = src.clone(true), o0 = op || 0.5, m = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: o0, depthWrite: false });
  g.traverse(c => { if (c.isMesh) { c.material = m; c.castShadow = false; } else if (c.isSprite) c.visible = false; }); const ri = src.children.indexOf(h.rig.ring); if (ri >= 0) g.children[ri].visible = false; g.material = m;   // FX.drop disposes mesh.material
  return FX.add(g, life, (k, me, dt, en) => { m.opacity = pulse ? o0 * (0.6 + 0.4 * Math.sin(en.t * 9)) * Math.min(1, (life - en.t) / 0.3) : o0 * (1 - k) * (1 - k); });
}
function dshGlitch(x, y, z, col, n) { if (!FX.near(x, z, 50)) return; FX.sparks(x, y, z, { n: n || 6, color: col, color2: 0xffffff, speed: [6, 16], life: [0.06, 0.18], grav: 0, drag: 5, w: 0.1, stretch: 0.12 }); }
// load on the nervous system (innate): every implant fired adds to it; at six the mind gives way for a while
function dshChrome(h) { const n = h.strain || 0; if (n > 0) addBuff(h, { id: 'chrome', dur: Math.max(0.1, h.strainT - G.time), as: 0.05 * n, ms: 0.02 * n }); }
function dshStrain(h, n) {
  if (h.psyT > G.time) return; h.strain = Math.min(6, (h.strain || 0) + n); h.strainT = G.time + 9;
  if (h.strain >= 6) dshPsycho(h); else dshChrome(h);
}
function dshPsycho(h) {
  h.psyT = G.time + 6; h.strain = 6; h.strainT = h.psyT; h.madT = h.psyT;   // madT: for these six seconds he and everyone else are enemies (see hostile() in game.js)
  const b = addBuff(h, { id: 'chrome', dur: 6, as: 0.4, ms: 0.15, dmgOut: 1.25, dmgIn: 1.15, ls: 0.15, every: 0.5, onTick: u => { u.hp = Math.max(1, u.hp - u.maxHp * 0.0075); dshGlitch(u.x + rand(-0.6, 0.6), rand(1, 2.4), u.z + rand(-0.6, 0.6), DSH.red, 4); }, onEnd: u => { u.strain = 0; } });
  if (b) b.fx = FX.aura(h, DSH.red, 6, 1.8, 'swirl', 9);
  SFX.at('overload', h.x, h.z, 0.8); SFX.at('dark', h.x, h.z, 0.5); FX.ring(h.x, h.z, { r0: 0.5, r1: 4, color: DSH.red, life: 0.4, tex: 'shock' }); dshGlitch(h.x, 1.8, h.z, DSH.red, 18); FX.pillar(h.x, h.z, { r: 0.9, h: 8, color: DSH.red, life: 0.5, op: 0.45 });
  if (FX.near(h.x, h.z, 45)) FX.text(h.x, h.height + 1.5, h.z, 'КИБЕРПСИХОЗ', '#ff4a55', 18);
  if (h === G.player) UI.msg('Киберпсихоз: все вокруг — враги, и свои тоже');
  else if (G.player && h.team === G.player.team && FX.near(h.x, h.z, 40)) UI.msg('Дэш в киберпсихозе: он бьёт и своих — держитесь подальше');
}
// sandevistan: the world slows around him. Afterimages in shifting colours, a ring of dilated time, slower enemies inside it
function dshSandy(h, dur, lv) {
  const R = 8, gen = h.sandyGen = (h.sandyGen || 0) + 1; h.sandyT = G.time + dur; let acc = 0, sl = 0.25, hue = 0, lx = h.x, lz = h.z;
  addBuff(h, {
    id: 'sandy', dur, ms: 0.4, as: 0.4 + 0.1 * lv,
    onHit: (u, t) => { const col = DSH_HUES[hue % 4]; after(0.13, () => { if (!t.alive || !u.alive) return; damage(u, t, u.ad * 0.3, 0, { dot: true }); FX.hit(t.x, t.height * 0.55, t.z, col, false); rmpArc(t.x, t.z, rand(TAU), 1.8, 1.3, 0.16, col, 1.3, false, 0.8); }); return 0; }
  });
  SFX.at('overload', h.x, h.z, 0.7); SFX.at('dash', h.x, h.z, 1); FX.shock(h.x, h.z, R, 0.9, 0.45); if (h === G.player) FX.punch(0.9);
  FX.ring(h.x, h.z, { r0: 0.5, r1: R, color: DSH.c, life: 0.45, tex: 'ringThin' }); FX.ring(h.x, h.z, { r0: 0.3, r1: R * 0.7, color: DSH.blu, life: 0.6, tex: 'ringThin', op: 0.7 }); FX.implode(h.x, 1.6, h.z, 4, { n: 18, color: DSH.c, color2: 0xffffff, life: 0.25, streak: true });
  FX.zone(h.x, h.z, R, DSH.deep, dur, { tex: 'ringThin', follow: h, spin: 0, op: 0.9 }); FX.zone(h.x, h.z, R, DSH.deep, dur, { tex: 'rune2', follow: h, spin: -0.25, op: 0.35 });
  for (let i = 0; i < 3; i++) after(i * 0.05, () => { if (h.alive) dshGhost(h, DSH_HUES[i], 0.5, 0.55); });
  G.actors.push({
    update(dt) {
      if (gen !== h.sandyGen) return false;
      if (!h.alive || G.time >= h.sandyT) { h.sandyT = 0; if (h.alive) { FX.ring(h.x, h.z, { r0: R * 0.6, r1: 0.5, color: DSH.c, life: 0.3, tex: 'ringThin' }); SFX.at('dash', h.x, h.z, 0.4); } return false; }
      acc += dt; sl += dt;
      if (acc > 0.055 && (dist(h.x, h.z, lx, lz) > 0.55 || (h.anim.atkT > 0 && acc > 0.12))) { acc = 0; lx = h.x; lz = h.z; dshGhost(h, DSH_HUES[hue++ % 4], 0.45, 0.5); }
      if (sl > 0.25) { sl = 0; for (const e of enemiesIn(h, h.x, h.z, R)) { addBuff(e, { id: 'dilate' + h.id, dur: 0.45, slow: 0.3, as: -0.3, src: h }); if (Math.random() < 0.5 && FX.near(e.x, e.z, 50)) FX.burst(e.x, rand(0.6, 2.2), e.z, { n: 1, color: DSH.c, color2: DSH.deep, speed: [0, 0.3], life: [0.5, 0.8], size: [0.22, 0.02], rad: 0.9, a: 0.8 }); } }
      return true;
    }
  });
}

HEROES.push(
  /* ================= 33. Dash ================= */
  {
    id: 'dash', name: 'Дэш', title: 'Бегущий по краю', role: 'assassin', roleName: 'Кибербегун', build: 'assassin', bars: [5, 2, 5, 2], diffc: 2,
    lore: 'Мальчишка с окраины вшил в позвоночник армейский «Сандевистан», который не тянет даже у солдат. Пока имплант работает, мир вокруг едва шевелится. Чем больше хрома он запускает, тем быстрее бьёт — и тем ближе срыв, за которым уже не остановиться.',
    look: { bulk: 0.98, h: 1.06, c1: 0xe6bc1c, c2: 0x1c1d24, c3: 0x26282f, skin: 0xc49a7a, metal: 0x9aa0aa, glow: 0x21f5c1, head: 'runner', hair: 0x1a1418, shirt: 0x101014, lin: 0x1c8f7c, chest: 'jacket', sh: 'none', legs: 'boots', weapon: 'gorilla', wc: 'fist', back: 'sandy', exo: true },
    stats: ST(600, 84, 290, 32, 60, 3.5, 24, 2.7, 0.84, 9.3, 2.6),
    innate: { name: 'Перегрузка хрома', icon: 'chrome', count: h => h.psyT > G.time ? '!!' : (h.strain || ''), desc: 'Каждое применённое умение добавляет нагрузку (сандевистан — две) на 9 сек, до 6. Каждая единица — +5% скорости атаки и +2% скорости передвижения. На шестой — киберпсихоз на 6 сек: +25% урона, +40% скорости атаки, 15% вампиризма, но Дэш получает на 15% больше урона, теряет 1.5% здоровья в секунду и перестаёт различать своих. Все вокруг для него враги: его удары и умения ранят союзников и их крипов, без приказа он бьёт ближайшего, а союзники и их крипы могут бить его в ответ (башни его не трогают). За убийство своего никто ничего не получает.' },
    tick(h) { if ((h.strain || 0) > 0 && G.time > h.strainT) h.strain = 0; if (h.exoT > G.time && !hasBuff(h, 'exo')) h.exoT = 0; },
    abilities: [
      {
        key: 'Q', name: 'Фантомный рывок', icon: 'phantom', cd: 9, cost: 40, range: 7.5, ind: { type: 'line', w: 2.2 }, lock: 0, ai: { t: 'phantom' },
        desc: 'Рывок на форсаже импланта сквозь врагов: урон всем на пути. На месте старта на 3.5 сек остаётся фантом — повторное нажатие бесплатно возвращает Дэша к нему, снова раня всех на пути (70% урона). +1 нагрузка.',
        free: h => !!(h.phan && G.time < h.phan.until),
        cast(h, p) {
          const full = this.cd * 100 / (100 + h.haste), dmg = D(h, 58, 9.5, 0.55); let lx = h.x, lz = h.z, hue = 0;
          const strike = (e, u, k) => { damage(u, e, dmg * k, 0); FX.hit(e.x, 1.3, e.z, DSH.c, false); rmpArc(e.x, e.z, u.facing + 1.57, 2.3, 1.5, 0.2, k < 1 ? DSH.mag : DSH.c, 1.3, false, 0.85); dshGlitch(e.x, 1.4, e.z, DSH.pale, 5); SFX.at('slash', e.x, e.z, 0.6); };
          const trail = u => { if (dist(u.x, u.z, lx, lz) > 1.3) { lx = u.x; lz = u.z; dshGhost(u, DSH_HUES[hue++ % 4], 0.4, 0.5); } };
          if (h.phan && G.time < h.phan.until) {   // back to the phantom
            const ph = h.phan; h.phan = null; ph.fx.dead = true; ph.mark.dead = true; SFX.at('dash', h.x, h.z, 1); FX.ring(h.x, h.z, { r0: 0.4, r1: 2.4, color: DSH.mag, life: 0.3, tex: 'ringThin' });
            dashTo(h, ph.x, ph.z, 54, { fly: true, w: 1.5, ribbon: DSH.mag, trail, onHit: (e, u) => { strike(e, u, 0.7); }, onEnd: u => { FX.ring(u.x, u.z, { r0: 0.4, r1: 2.8, color: DSH.c, life: 0.3, tex: 'shock' }); dshGlitch(u.x, 1.4, u.z, DSH.c, 10); } });
            return { cd: Math.max(0.5, full - (G.time - ph.t0)) };
          }
          dshStrain(h, 1); SFX.at('dash', h.x, h.z, 1); SFX.at('zap', h.x, h.z, 0.4); FX.ring(h.x, h.z, { r0: 0.4, r1: 2.6, color: DSH.c, life: 0.3, tex: 'ringThin' });
          const ph = h.phan = { x: h.x, z: h.z, until: G.time + 3.5, t0: G.time, fx: dshGhost(h, DSH.c, 3.5, 0.6, true) || { dead: false }, mark: FX.zone(h.x, h.z, 1.3, DSH.c, 3.5, { tex: 'ringThin', spin: 3, op: 0.9 }) };
          dashTo(h, p.x, p.z, 46, { w: 1.5, ribbon: DSH.c, trail, onHit: (e, u) => { strike(e, u, 1); }, onEnd: u => { FX.ring(u.x, u.z, { r0: 0.4, r1: 2.4, color: DSH.c, life: 0.3, tex: 'shock' }); } });
          G.actors.push({ update() { if (h.phan !== ph) return false; if (h.alive && G.time < ph.until) return true; h.phan = null; ph.fx.dead = true; ph.mark.dead = true; if (h.alive) h.cd[0] = Math.max(0, full - 3.5); return false; } });
          return { cd: 0.3 };
        }
      },
      {
        key: 'W', name: 'Удар гориллы', icon: 'gorilla', cd: 10, cost: 50, range: 5.5, ind: { type: 'line', w: 2.4, fixed: true }, anim: 'piston', animDur: 0.6, lock: 0, noReach: true, ai: { t: 'shot', sp: 30 },
        desc: 'Выпад с поршневым ударом хромированной руки: первый враг на пути получает урон, отлетает на 5 и оглушён на 0.7 сек, а ударная волна наносит половину урона врагам за его спиной. Под сандевистаном удар сильнее на 40%. +1 нагрузка.',
        cast(h, p) {
          const fast = h.sandyT > G.time, dmg = D(h, 78, 12.5, 0.75) * (fast ? 1.4 : 1), dir = p.dir, sx = Math.sin(dir), cz = Math.cos(dir); dshStrain(h, 1); SFX.at('dash', h.x, h.z, 0.9);
          FX.glow(h.x + sx, 1.6, h.z + cz, 2.4, DSH.yel, 0.25, 'star');
          dashTo(h, h.x + sx * 5.5, h.z + cz * 5.5, 36, {
            w: 1.4, ribbon: DSH.yel, trail: u => { if (fast && Math.random() < 0.5) dshGhost(u, DSH.yel, 0.3, 0.45); FX.sparks(u.x, 1.4, u.z, { n: 1, color: DSH.yel, color2: DSH.ydeep, speed: [2, 6], life: [0.15, 0.3], w: 0.09, dir: dir + Math.PI, spread: 0.6 }); },
            onHit: (e, u) => {
              const x = e.x, z = e.z; damage(u, e, dmg, 0); stun(u, e, 0.7); knock(e, u.x, u.z, 5, 0.28);
              SFX.at('boom', x, z, 0.7); SFX.at('hit', x, z, 1); FX.shake(0.45); FX.punch(0.6); FX.hitstop(u === G.player ? 0.05 : 0); FX.shock(x, z, 5, 1, 0.35);
              FX.glow(x, 1.5, z, 4.2, DSH.yel, 0.2, 'star'); FX.ring(x, z, { r0: 0.4, r1: 3.4, color: DSH.yel, life: 0.3, tex: 'shock' }); FX.sparks(x, 1.4, z, { n: 22, color: 0xffffff, color2: DSH.yel, speed: [8, 22], life: [0.15, 0.4], dir, spread: 0.7, w: 0.14 });
              FX.debris(x, 0.4, z, { n: 6, color: 0x4a4640, speed: [3, 8], up: 7, size: [0.15, 0.4] });
              // the shock wave: a cone thrown past the target
              const m = new THREE.Mesh(FX.geo.flat, FX.mat('cone', DSH.ydeep, 0.8)); m.position.set(x, 0.9, z); m.rotation.y = dir; FX.add(m, 0.3, (k, me) => { const s = (2 + 5 * easeOut(k)) * 2 * RK; me.scale.set(s, 1, s); me.material.opacity = 0.8 * (1 - k); });
              for (const o of enemiesIn(u, x, z, 5.5)) if (o !== e && Math.abs(angDiff(dir, angTo(x, z, o.x, o.z))) < 0.6) { damage(u, o, dmg * 0.5, 0); FX.hit(o.x, 1.3, o.z, DSH.yel, false); }
              return true;
            }
          });
        }
      },
      {
        key: 'E', name: 'Сандевистан', icon: 'sandy', cd: 17, cost: 60, range: 0, ind: { type: 'self', r: 8 }, anim: 'sandy', animDur: 0.4, lock: 0.1, ai: { t: 'buff' },
        desc: 'Имплант разгоняет нервную систему, и на 3 / 3.5 / 4 / 4.5 сек мир вокруг замедляется: +40% скорости передвижения, +50 / 60 / 70 / 80% скорости атаки, каждый удар повторяет фантом (30% урона), а враги в радиусе 8 двигаются и атакуют на 30% медленнее. +2 нагрузки.',
        cast(h) { const lv = Math.max(1, h.al[2]); dshSandy(h, 2.5 + 0.5 * lv, lv); dshStrain(h, 2); }
      },
      {
        key: 'R', name: 'Киберскелет', icon: 'exo', cd: 100, cost: 100, range: 0, ind: { type: 'self', r: 6.5 }, anim: 'exo', animDur: 1.15, lock: 0.95, ai: { t: 'nova', r: 5.5, ult: true, hp: 0.55, rad: 6 },
        desc: 'За 0.65 сек вокруг Дэша смыкается экзорама, и гравитационный пресс вдавливает в землю врагов в радиусе 6.5: урон и оглушение на 0.9 / 1.1 / 1.3 сек. Затем 10 сек он огромен: щит, +25 / 40 / 55 силы атаки, удары бьют по области, сандевистан сразу перезаряжен. Когда рама отключается, нервы не выдерживают — мгновенный киберпсихоз.',
        cast(h) {
          const R = 6.5, T = 0.65, DUR = 10, lv = Math.max(1, h.al[3]), dmg = D(h, 115, 20, 0.8), sh = D(h, 150, 28, 0.6), st = 0.7 + 0.2 * lv; h.order = null; h.path = null;
          addBuff(h, { id: 'exoUp', dur: T + 0.2, dmgIn: 0.6 }); telegraph(h, h.x, h.z, R, T, DSH.yel); SFX.at('overload', h.x, h.z, 1); SFX.at('drone', h.x, h.z, 0.6);
          FX.pillar(h.x, h.z, { r: 1.4, h: 11, color: DSH.ydeep, life: T, op: 0.5, grow: true }); FX.ring(h.x, h.z, { r0: R, r1: 1, color: DSH.yel, life: T, tex: 'ringThin' });
          for (let i = 0; i < 4; i++) after(i * 0.13, () => { if (h.alive) { FX.implode(h.x, 2, h.z, 4.5, { n: 9, color: DSH.yel, color2: 0xffffff, life: 0.22, streak: true }); dshGlitch(h.x + rand(-1, 1), rand(1, 3), h.z + rand(-1, 1), DSH.yel, 5); } });
          after(T, () => {
            if (!h.alive) return; const x = h.x, z = h.z; h.exoT = G.time + DUR; h.cd[2] = 0; h.psyT = 0; h.madT = 0;
            addBuff(h, { id: 'sh' + h.id, dur: DUR, shield: sh, src: h });   // no bubble: it would hide the frame
            addBuff(h, {
              id: 'exo', dur: DUR, ad: 10 + 15 * lv, ms: 0.1,
              onHit: (u, t) => { for (const e of enemiesIn(u, t.x, t.z, 2.8)) if (e !== t) damage(u, e, u.ad * 0.5, 0, { dot: true }); FX.ring(t.x, t.z, { r0: 0.4, r1: 2.8, color: DSH.yel, life: 0.25, tex: 'shock', op: 0.8 }); FX.debris(t.x, 0.3, t.z, { n: 2, color: 0x4a4640, speed: [2, 5], up: 5, size: [0.12, 0.28] }); return 0; },
              onEnd: u => { u.exoT = 0; if (!u.alive) return; FX.ring(u.x, u.z, { r0: 3, r1: 0.5, color: DSH.yel, life: 0.35, tex: 'ringThin' }); FX.debris(u.x, 1.4, u.z, { n: 8, color: 0x3a3d45, speed: [2, 6], up: 5, size: [0.15, 0.35] }); u.strain = 0; dshPsycho(u); }
            });
            // the press: everything inside the circle is driven into the ground
            SFX.at('bigboom', x, z, 1); SFX.at('boom', x, z, 0.8); FX.shake(0.9); FX.punch(1); FX.shock(x, z, R * 1.5, -1.2, 0.5); FX.light(x, 3, z, DSH.yel, 1.8, 30, 0.5);
            const disc = new THREE.Mesh(FX.geo.flat, FX.mat('fill', 0x0c0a02, 0.6, false)); disc.position.set(x, 0.07, z); disc.renderOrder = 4; disc.scale.set(R * 2 * RK, 1, R * 2 * RK); FX.add(disc, 0.8, (k, me) => { me.material.opacity = 0.6 * (1 - k); });
            for (let i = 0; i < 3; i++) after(i * 0.07, () => FX.ring(x, z, { r0: R + 1 - i, r1: 0.6 + i, color: i ? DSH.yel : DSH.ydeep, life: 0.35, tex: i ? 'ringThin' : 'shock', op: i ? 0.8 : 0.9 }));
            FX.ring(x, z, { r0: R * 0.85, r1: R, color: DSH.yel, life: 2, tex: 'crack', op: 0.8 }); FX.scorch(x, z, R * 0.7, undefined, 7); FX.debris(x, 0.3, z, { n: 16, color: 0x4a4640, speed: [3, 9], up: 9, size: [0.2, 0.5], rad: R * 0.6 }); FX.smoke(x, z, R * 0.6, 8, 0x3a3428);
            for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, r = R * rand(0.35, 0.9); FX.sparks(x + Math.sin(a) * r, 5.5, z + Math.cos(a) * r, { n: 3, color: DSH.yel, color2: DSH.ydeep, speed: [0, 1], life: [0.25, 0.4], up: -20, grav: -30, w: 0.14, stretch: 0.12 }); }
            for (const e of enemiesIn(h, x, z, R)) { damage(h, e, dmg, 0); stun(h, e, st); FX.sparks(e.x, 1.3, e.z, { n: 5, color: DSH.yel, color2: DSH.ydeep, speed: [3, 9], life: [0.15, 0.35], w: 0.11 }); FX.pillar(e.x, e.z, { r: 0.8, h: 7, color: DSH.ydeep, life: 0.4, op: 0.5 }); }
            if (FX.near(x, z, 45)) FX.text(x, h.height + 2.4, z, 'КИБЕРСКЕЛЕТ', '#ffe14a', 18);
          });
        }
      }
    ]
  }
);

/* ===== roster, part 11: Tokiko, the girl with a clock for an eye — antique guns, bullets that bend time, a shadow that eats it ===== */
const TOK = { c: 0xffa01e, pale: 0xffe2a8, deep: 0x7a4206, red: 0xd0182a, rdeep: 0x4a060e };
const TOK_LOOK = { bulk: 0.86, h: 1.04, c1: 0x15131a, c2: 0x1c1a22, c3: 0x2a1116, skin: 0xead2c2, hands: 0xead2c2, metal: 0xc9a24a, glow: 0xffa01e, head: 'clockeye', hair: 0x121016, tie: 0xb0141e, chest: 'gothic', sh: 'frill', legs: 'boots', weapon: 'timeguns', wc: 'twin', back: 'dial' };
// a clock face lying on the ground: rim, twelve marks, two hands (userData.hh / mh); every material is listed in userData.mats so the caller can fade it
function tokDial(R, col, op) {
  const g = new THREE.Group(), lm = FX.mat('line', col, op), add = (m, own) => { m.userData.own = own !== false; g.add(m); return m; };
  const r1 = add(new THREE.Mesh(FX.geo.flat, FX.mat('ring', col, op))); r1.scale.set(R * 2 * RK, 1, R * 2 * RK);
  const r2 = add(new THREE.Mesh(FX.geo.flat, FX.mat('ringThin', col, op * 0.7))); r2.scale.set(R * 1.7 * RK, 1, R * 1.7 * RK);
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, m = add(new THREE.Mesh(FX.geo.line, lm), false); m.position.set(Math.sin(a) * R * 0.76, 0, Math.cos(a) * R * 0.76); m.rotation.y = a; m.scale.set(i % 3 ? 0.05 * R : 0.085 * R, 1, R * (i % 3 ? 0.09 : 0.15)); }
  const hh = add(new THREE.Mesh(FX.geo.line, lm), false), mh = add(new THREE.Mesh(FX.geo.line, lm)); hh.scale.set(0.1 * R, 1, R * 0.42); mh.scale.set(0.065 * R, 1, R * 0.66); hh.rotation.y = 2.2; mh.rotation.y = -0.4;
  g.userData.hh = hh; g.userData.mh = mh; g.userData.mats = [[r1.material, op], [r2.material, op * 0.7], [lm, op]]; return g;
}
// a dial on the ground that follows a unit (or stays put) for a while, its hands turning at `speed` (negative = backwards)
function tokClock(x, z, R, dur, speed, col, op, follow) {
  if (!follow && !FX.near(x, z, 70)) return null; const g = tokDial(R, col, op === undefined ? 0.7 : op), hh = g.userData.hh, mh = g.userData.mh; g.position.set(x, 0.13, z);
  return FX.add(g, dur, (k, me, dt, en) => { const f = Math.min(1, en.t / 0.2, (dur - en.t) / 0.3); for (const [m, o] of me.userData.mats) m.opacity = o * f; mh.rotation.y -= dt * speed; hh.rotation.y -= dt * speed / 12; if (follow) { me.position.x = follow.x; me.position.z = follow.z; if (!follow.alive) en.dead = true; } });
}
function tokFlash(x, y, z, s) { if (!FX.near(x, z, 50)) return; FX.glow(x, y, z, 2.6 * s, TOK.c, 0.14, 'star'); FX.sparks(x, y, z, { n: Math.round(6 * s), color: TOK.pale, color2: TOK.deep, speed: [5, 14], life: [0.1, 0.3], w: 0.1 }); FX.burst(x, y, z, { smoke: true, n: 2, color: 0x3a3438, color2: 0x0c0a0c, speed: [0.4, 1.6], life: [0.3, 0.6], size: [0.5, 1.2], up: 1, a: 0.5 }); }
// where she stood three seconds ago (her own past is recorded in def.tick)
function tokPast(h) { const H = h.hist; if (!H || !H.length) return null; const t0 = G.time - 3; for (const p of H) if (p.t >= t0) return p; return H[H.length - 1]; }
// her copies from the past: four more rigs of her own look, darkened, kept for the whole match and shown only while the ultimate lasts
function tokClones(h) {
  if (h.clones) return h.clones; h.clones = [];
  for (let i = 0; i < 4; i++) {
    const rig = buildHero(TOK_LOOK, 0xffffff), m = rig.mats[0]; rig.ring.visible = false; m.color.setHex(0x5a465e); m.transparent = true; m.opacity = 0.92; rig.root.traverse(c => { c.castShadow = false; });
    h.clones.push({ rig, id: h.id + 0.1 + i * 0.2, x: 0, z: 0, facing: 0, moving: false, ms: 8, flash: 0, dead: false, yOff: -3, anim: { walk: 0, atkT: 0, atkDur: 1, castT: 0, castDur: 1, castType: 'cast', deathT: 0, spinA: 0, alt: i % 2 === 0 } });
  }
  return h.clones;
}

HEROES.push(
  /* ================= 34. Tokiko ================= */
  {
    id: 'tokiko', name: 'Токико', title: 'Хозяйка чужого времени', role: 'marks', roleName: 'Стрелок', build: 'marks', bars: [5, 2, 3, 3], diffc: 2, projMesh: 'bolt', atkSfx: 'shoot',
    lore: 'Девушка в чёрно-алом платье, с золотым циферблатом вместо левого глаза и часами за спиной. Стреляет из старинных пистолета и мушкета пулями, которые ускоряют, останавливают и отматывают время. Своё время она давно истратила — теперь живёт на чужом.',
    look: TOK_LOOK,
    stats: ST(545, 74, 300, 35, 57, 3.2, 20, 2.2, 0.8, 8.8, 10.2, 0.026),
    innate: { name: 'Украденное время', icon: 'stolentime', count: h => h.tokN || '', desc: 'Каждая третья атака — выстрел, крадущий время: дополнительный урон (растёт с уровнем и силой атаки), замедление героя на 20% на 1 сек, а перезарядки Q, W и E сокращаются на 0.5 сек. Под ускорением первой пули — каждая вторая.' },
    tick(h, dt) {
      // record her own past for the rewind: a sample every 0.2 s, kept for a little over three seconds
      h.histT = (h.histT || 0) - dt; if (h.histT <= 0) { h.histT = 0.2; const H = h.hist || (h.hist = []); H.push({ t: G.time, x: h.x, z: h.z, hp: h.hp }); while (H.length && H[0].t < G.time - 3.3) H.shift(); }
      if (h !== G.player || !h.al[2]) return;
      // only her own player sees where the rewind would take her
      if (!h.pastFx) { const m = new THREE.Mesh(FX.geo.flat, FX.mat('ringThin', TOK.c, 0.55)); m.scale.set(1.1 * 2 * RK, 1, 1.1 * 2 * RK); h.pastFx = FX.add(m, 1e9, null); }
      const p = tokPast(h), m = h.pastFx.mesh; m.visible = !!p && h.cd[2] <= 0 && dist(p.x, p.z, h.x, h.z) > 1.6; if (p) m.position.set(p.x, 0.12, p.z);
    },
    onDeal(h, t, d, o) {
      if (!o.basic || t.struct) return; const need = h.hasteT > G.time ? 2 : 3; h.tokN = (h.tokN || 0) + 1; if (h.tokN < need) return; h.tokN = 0;
      damage(h, t, 12 + 4 * h.level + 0.3 * h.ad, 0, { dot: true }); for (let i = 0; i < 3; i++) if (h.cd[i] > 0) h.cd[i] = Math.max(0, h.cd[i] - 0.5); if (t.alive && t.kind === 'hero') slow(h, t, 0.2, 1, 'tokslow');
      if (FX.near(t.x, t.z, 50)) { FX.ring(t.x, t.z, { r0: 1.9, r1: 0.5, color: TOK.c, life: 0.3, tex: 'ringThin', y: t.height * 0.55 }); FX.glow(t.x, t.height * 0.55, t.z, 2.6, TOK.c, 0.18, 'star'); FX.beam(t.x, t.z, h.x, h.z, { color: TOK.deep, w: 0.35, life: 0.22, y: 1.5, op: 0.8 }); }
    },
    abilities: [
      {
        key: 'Q', name: 'Первая пуля: Разгон', icon: 'bulletfast', cd: 15, cost: 50, range: 0, ind: { type: 'self', r: 2.5 }, anim: 'temple', animDur: 0.55, lock: 0.28, ai: { t: 'buff' },
        desc: 'Стреляет себе в висок пулей ускоренного времени: на 4.5 сек +40 / 50 / 60 / 70% скорости атаки и +25% скорости передвижения, а «Украденное время» срабатывает на каждой второй атаке.',
        cast(h) {
          const lv = Math.max(1, h.al[0]), dur = 4.5; SFX.at('cast', h.x, h.z, 0.5);
          after(0.24, () => {
            if (!h.alive) return; h.hasteT = G.time + dur; addBuff(h, { id: 'tokfast', dur, as: 0.3 + 0.1 * lv, ms: 0.25 });
            SFX.at('shoot', h.x, h.z, 1); SFX.at('dash', h.x, h.z, 0.6); tokFlash(h.x, h.height * 0.82, h.z, 1.2); FX.ring(h.x, h.z, { r0: 0.4, r1: 3.2, color: TOK.c, life: 0.35, tex: 'shock' });
            tokClock(h.x, h.z, 1.9, dur, 14, TOK.c, 0.75, h); FX.sparks(h.x, 1.4, h.z, { n: 16, color: TOK.pale, color2: TOK.deep, speed: [4, 12], life: [0.2, 0.5], ring: true, w: 0.1 });
            let acc = 0; G.actors.push({ update(dt) { if (!h.alive || G.time >= h.hasteT) return false; acc += dt; if (acc > 0.07 && h.moving && FX.near(h.x, h.z, 50)) { acc = 0; FX.sparks(h.x, rand(0.5, 2), h.z, { n: 1, color: TOK.c, color2: TOK.deep, speed: [3, 7], life: [0.2, 0.4], dir: h.facing + Math.PI, spread: 0.4, w: 0.08, grav: 0 }); } return true; } });
          });
        }
      },
      {
        key: 'W', name: 'Седьмая пуля: Стоп-кадр', icon: 'bulletstop', cd: 13, cost: 65, range: 12, ind: { type: 'line', w: 1.6 }, anim: 'aimlong', animDur: 0.6, lock: 0.34, ai: { t: 'shot', sp: 44 },
        desc: 'Через 0.3 сек стреляет из мушкета пулей, останавливающей время: первый враг на пути получает урон и замирает на 1.0 / 1.2 / 1.4 / 1.6 сек. Застывший получает на 15% больше урона.',
        cast(h, p) {
          const lv = Math.max(1, h.al[1]), dmg = D(h, 72, 11.5, 0.6), dur = 0.8 + 0.2 * lv, dir = p.dir, sx = Math.sin(dir), cz = Math.cos(dir); let n = 0; FX.lineDecal(h.x, h.z, dir, p.range, 0.5, TOK.c, 0.3);
          after(0.3, () => {
            if (!h.alive || h.stunned) return; SFX.at('shoot', h.x, h.z, 1); SFX.at('boom', h.x, h.z, 0.35); tokFlash(h.x + sx * 2, 1.7, h.z + cz * 2, 1.5); FX.ring(h.x + sx * 2, h.z + cz * 2, { r0: 0.3, r1: 1.8, color: TOK.c, life: 0.25, tex: 'ringThin', y: 1.7 }); if (h === G.player) FX.shake(0.2);
            shot(h, {
              dir, x: h.x + sx * 1.8, z: h.z + cz * 1.8, speed: 44, range: 12, w: 0.8, color: TOK.c, mesh: 'bolt', size: 0.9, ribbon: 0.9, y: 1.7,
              trail: q => { n++; if (n % 3 === 0 && FX.near(q.x, q.z, 50)) FX.ring(q.x, q.z, { r0: 0.2, r1: 0.9, color: TOK.c, life: 0.3, tex: 'ringThin', y: 1.7, op: 0.7 }); FX.trail(q.x, 1.7, q.z, TOK.c, 0.5, 1); },
              onHit: e => {
                damage(h, e, dmg, 0); FX.hit(e.x, 1.4, e.z, TOK.c, true); SFX.at('hit', e.x, e.z, 0.8); if (!e.alive) return;
                const b = addBuff(e, { id: 'tokstop', dur, stun: true, dmgIn: 1.15, src: h }); if (!b) return; e.tstopT = G.time + b.dur;
                tokClock(e.x, e.z, e.radius + 1.5, b.dur, 0, 0x9a6a1a, 0.9, e); b.fx = FX.bubble(e, 0x4a5468, b.dur, e.radius + 0.9); FX.ring(e.x, e.z, { r0: 3.4, r1: e.radius + 1.2, color: TOK.c, life: 0.3, tex: 'ringThin' });
                if (FX.near(e.x, e.z, 45) && G.player && (h === G.player || e === G.player)) FX.text(e.x, e.height + 1.3, e.z, 'стоп', '#ffe2a8', 15);
              }
            });
          });
        }
      },
      {
        key: 'E', name: 'Четвёртая пуля: Возврат', icon: 'bulletback', cd: 18, cost: 60, range: 0, ind: { type: 'self', r: 2 }, anim: 'temple', animDur: 0.4, lock: 0.12, ai: { t: 'rewind' },
        desc: 'Пуля, отматывающая время назад: Токико мгновенно возвращается туда, где была 3 сек назад, и восстанавливает 50 / 60 / 70 / 80% здоровья, потерянного за эти 3 сек. Снимает замедления и обездвиживание. Место возврата отмечено на земле кольцом, которое видите только вы.',
        cast(h) {
          const p = tokPast(h); if (!p) return false; const lv = Math.max(1, h.al[2]), x0 = h.x, z0 = h.z, back = Math.max(0, p.hp - h.hp) * (0.4 + 0.1 * lv);
          SFX.at('shoot', x0, z0, 0.8); SFX.at('dark', x0, z0, 0.5); tokFlash(x0, h.height * 0.82, z0, 1); dshGhost(h, TOK.c, 0.6, 0.55); tokClock(x0, z0, 1.8, 0.7, -16, TOK.c, 0.8);
          for (const b of h.buffs) if (b.slow || b.root) b.dead = true;
          blink(h, p.x, p.z); h.order = null; h.hist = [{ t: G.time, x: h.x, z: h.z, hp: h.hp }]; if (back > 0) heal(h, h, back);
          FX.beam(x0, z0, h.x, h.z, { color: TOK.deep, w: 1.1, life: 0.4, y: 1.4, op: 0.8 }); FX.beam(x0, z0, h.x, h.z, { color: TOK.c, w: 0.3, life: 0.3, y: 1.4 });
          tokClock(h.x, h.z, 2.2, 0.8, -18, TOK.c, 0.85); FX.implode(h.x, 1.5, h.z, 3.4, { n: 22, color: TOK.c, color2: 0xffffff, life: 0.3, streak: true }); FX.ring(h.x, h.z, { r0: 3.6, r1: 0.6, color: TOK.c, life: 0.35, tex: 'ringThin' }); FX.pillar(h.x, h.z, { r: 0.9, h: 8, color: TOK.deep, life: 0.45, op: 0.5 });
          if (back > 0) FX.heal(h, TOK.c); SFX.at('heal', h.x, h.z, 0.5);
          if (h === G.player && dist(x0, z0, h.x, h.z) > 16) G.camSnap = true;
        }
      },
      {
        key: 'R', name: 'Пожирающая тень', icon: 'devourtime', cd: 100, cost: 110, range: 9, ind: { type: 'circle', r: 7 }, anim: 'dialup', animDur: 1.0, lock: 0.5, ai: { t: 'point', rad: 7, delay: 0.5, ult: true, hp: 0.6 },
        desc: 'Через 0.5 сек на 6 сек накрывает область радиусом 7 живой тенью под огромным циферблатом. Враги внутри замедлены на 30% и дважды в секунду теряют здоровье — тень пожирает их время, а 35% этого урона возвращается Токико здоровьем. Из тени встают четыре её копии из прошлого и расстреливают врагов внутри.',
        cast(h, p) {
          const x = p.x, z = p.z, R = 7, T = 0.5, DUR = 6, tick = D(h, 15, 2.6, 0.1), sd = D(h, 12, 2.2, 0.2), C = tokClones(h), L = DUR + 0.9; h.zafT = G.time + T + DUR;
          telegraph(h, x, z, R, T, TOK.red); SFX.at('dark', x, z, 1); SFX.at('overload', h.x, h.z, 0.5); FX.ring(x, z, { r0: R + 3, r1: R, color: TOK.c, life: T, tex: 'ringThin' });
          after(T, () => {
            if (!h.alive) { h.zafT = 0; return; }
            G.dangers.push({ x, z, r: R, team: h.team, until: G.time + DUR }); SFX.at('bigboom', x, z, 0.6); FX.shock(x, z, R * 1.3, 0.8, 0.5); FX.shake(0.35);
            // the shadow: a black pool with a crimson rim, the great clock turning over it
            const pool = new THREE.Mesh(FX.geo.flat, FX.mat('fill', 0x070406, 0.82, false)); pool.position.set(x, 0.07, z); pool.renderOrder = 4;
            FX.add(pool, DUR + 0.4, (k, me, dt, en) => { const g = easeOut(Math.min(1, en.t / 0.3)); me.scale.set(R * 2.12 * g, 1, R * 2.12 * g); me.material.opacity = 0.82 * Math.min(1, (DUR + 0.4 - en.t) / 0.4); });
            FX.zone(x, z, R, TOK.red, DUR, { tex: 'ring', spin: 0, op: 1 }); tokClock(x, z, R * 0.86, DUR, 1.6, TOK.c, 0.85); FX.ring(x, z, { r0: 0.5, r1: R, color: TOK.red, life: 0.45, tex: 'shock' });
            // the copies rise at the rim, facing in
            C.forEach((S, i) => {
              const a = i / 4 * TAU + 0.6; S.x = x + Math.sin(a) * (R - 0.9); S.z = z + Math.cos(a) * (R - 0.9); S.facing = a + Math.PI; S.yOff = -3; S.rig.root.visible = true; S.rig.root.rotation.y = S.facing;
              FX.add(S.rig.root, L, (k, me, dt, en) => { const t = en.t; S.yOff = t < 0.45 ? -3 * (1 - easeOut(t / 0.45)) : (t > DUR + 0.3 ? -3.4 * (t - DUR - 0.3) / 0.6 : 0); if (dt > 0) animHero(S, dt); me.position.x = S.x; me.position.z = S.z; });
              FX.burst(S.x, 0.4, S.z, { smoke: true, n: 5, color: 0x1a0c12, color2: 0x000000, speed: [0.4, 1.6], life: [0.5, 1], size: [1, 2.2], up: 2.2, a: 0.7 });
            });
            let el = 0, a1 = 0.25, a2 = 0.6, fed = 0, vol = 0;
            G.actors.push({
              update(dt) {
                el += dt; if (el > DUR) { if (h.alive && fed > 1) FX.heal(h, TOK.c); return false; }
                a1 -= dt; a2 -= dt;
                if (Math.random() < dt * 9 && FX.near(x, z, 55)) { const a = rand(TAU), r = Math.sqrt(Math.random()) * R, px = x + Math.sin(a) * r, pz = z + Math.cos(a) * r; FX.burst(px, 0.2, pz, { smoke: true, n: 1, color: 0x1a0c12, color2: 0x000000, speed: [0.2, 0.8], life: [0.6, 1.1], size: [0.7, 1.7], up: 2.4, a: 0.6 }); FX.sparks(px, 0.3, pz, { n: 1, color: TOK.red, color2: TOK.rdeep, speed: [0.5, 2], life: [0.4, 0.8], up: 4, grav: -1, w: 0.08, stretch: 0.05 }); }
                const foes = enemiesIn(h, x, z, R);
                if (a1 <= 0) {
                  a1 += 0.5; let got = 0;
                  for (const e of foes) { got += damage(h, e, tick, 1, { dot: true }); slow(h, e, 0.3, 0.7, 'tokshade'); if (FX.near(e.x, e.z, 50)) FX.sparks(e.x, 1.2, e.z, { n: 2, color: TOK.c, color2: TOK.deep, speed: [1, 3], life: [0.3, 0.6], up: 5, grav: -1, w: 0.08, stretch: 0.05 }); }
                  if (got > 0 && h.alive) { fed += heal(h, h, got * 0.35, true); if (FX.near(h.x, h.z, 50)) FX.sparks(h.x, 0.4, h.z, { n: 3, color: TOK.pale, color2: TOK.c, speed: [0.3, 1], life: [0.4, 0.7], up: 5, rad: 0.8, ring: true, grav: -1, w: 0.08, stretch: 0.05 }); }
                }
                if (a2 <= 0 && el > 0.5) {
                  a2 += 0.75; vol++; if (!foes.length) return true; foes.sort(byHeroDist({ x, z, radius: 0 }));
                  C.forEach((S, i) => {
                    const e = foes[(i + vol) % Math.min(foes.length, 3)]; S.facing = angTo(S.x, S.z, e.x, e.z); S.anim.atkT = S.anim.atkDur = 0.5; S.anim.alt = !S.anim.alt;
                    after(0.2 + i * 0.05, () => { if (!e.alive || !h.alive) return; damage(h, e, sd, 0, { dot: true }); FX.beam(S.x, S.z, e.x, e.z, { color: TOK.c, w: 0.22, life: 0.1, y: 1.6 }); tokFlash(S.x + Math.sin(S.facing) * 1.4, 1.6, S.z + Math.cos(S.facing) * 1.4, 0.6); FX.hit(e.x, 1.3, e.z, TOK.c, false); SFX.at('shoot', S.x, S.z, 0.35); });
                  });
                }
                return true;
              }
            });
          });
        }
      }
    ]
  }
);

/* ===== roster, part 12: Riku the young hunter — three signs (rock, scissors, paper) that feed each other, and a vow that buys nine seconds of everything he could ever become ===== */
const RIK = { c: 0xffc24a, pale: 0xfff0c0, deep: 0x8a5a0a, grn: 0x58e08a, gdeep: 0x0f5a2c, vio: 0x8a56f0, vdeep: 0x1c1030, red: 0xff5a2a };
const RIK_SIGN = ['КАМЕНЬ', 'НОЖНИЦЫ', 'БУМАГА'];
// aura coming off the body: gold flames and rising motes
function rikAura(h, n, col, col2) {
  if (!FX.near(h.x, h.z, 50)) return;
  FX.flame(h.x, 0.5, h.z, { n: n || 3, color: col || RIK.c, color2: col2 || RIK.deep, speed: [0.2, 0.9], life: [0.35, 0.7], size: [0.8, 1.7], up: 3.6, rad: 0.7, a: 0.4, ring: true });
  FX.sparks(h.x, 0.4, h.z, { n: n || 3, color: RIK.pale, color2: col || RIK.c, speed: [0.3, 1.2], life: [0.4, 0.8], up: 6, grav: -1, drag: 1, rad: 0.9, ring: true, w: 0.08, stretch: 0.05 });
}
// the vow's aura: black-violet smoke licking upward with a few gold sparks left in it
function rikDark(h, n) {
  if (!FX.near(h.x, h.z, 50)) return;
  FX.burst(h.x, 0.6, h.z, { smoke: true, n, color: 0x241438, color2: 0x08040e, speed: [0.3, 1.2], life: [0.5, 1.0], size: [1.0, 2.4], up: 4.2, rad: 0.9, a: 0.5, drag: 1 });
  FX.flame(h.x, 0.8, h.z, { n, color: RIK.vio, color2: RIK.vdeep, speed: [0.3, 1], life: [0.3, 0.65], size: [0.8, 1.8], up: 5, rad: 0.8, a: 0.45, ring: true });
  if (Math.random() < 0.6) FX.sparks(h.x, 0.5, h.z, { n: 2, color: RIK.pale, color2: RIK.c, speed: [0.3, 1], life: [0.5, 0.9], up: 8, grav: -1, drag: 1, rad: 1, ring: true, w: 0.08, stretch: 0.06 });
}
// innate: every sign that differs from the ones before it within six seconds hits harder; the third closes the chain
function rikSign(h, s) {
  const J = h.jk || (h.jk = { seen: [], until: 0 }); if (G.time > J.until || J.seen.includes(s)) J.seen = [];
  J.seen.push(s); J.until = G.time + 6; const n = J.seen.length, k = n === 3 ? 1.5 : (n === 2 ? 1.2 : 1);
  if (FX.near(h.x, h.z, 45)) FX.text(h.x, h.height + 1 + n * 0.3, h.z, n === 3 ? 'ДЗЯН-КЭН-ПОН!' : RIK_SIGN[s] + '!', n === 3 ? '#fff0c0' : '#ffc24a', n === 3 ? 20 : 13 + n * 2);
  if (n === 3) { J.seen = []; J.until = 0; SFX.at('crit', h.x, h.z, 0.6); FX.ring(h.x, h.z, { r0: 0.5, r1: 3.6, color: RIK.pale, life: 0.4, tex: 'shock' }); rikAura(h, 8); }
  return { k, n, cd: (n === 3 ? 0.6 : 1) * (h.vowT > G.time ? 0.5 : 1) };
}

HEROES.push(
  /* ================= 35. Riku ================= */
  {
    id: 'riku', name: 'Рику', title: 'Юный охотник', role: 'front', roleName: 'Боец', build: 'bruiser', bars: [4, 3, 3, 2], diffc: 2,
    lore: 'Мальчишка с рыбацкого острова ушёл искать отца и по дороге выучился тому, чему взрослые учатся годами. Его приём прост, как детская игра: камень, ножницы, бумага — кулак, клинок и сгусток ауры. А если этого мало, у него есть клятва: отдать всё, чем он мог бы стать, за силу прямо сейчас.',
    look: { bulk: 0.9, h: 0.94, scale: 1.02, c1: 0x2f9a48, c2: 0x2a8a40, c3: 0x1f6a34, skin: 0xe8b88a, hands: 0xe8b88a, metal: 0xc9a24a, glow: 0xffc24a, head: 'hunter', hair: 0x14201a, lin: 0xd9541e, chest: 'hunter', sh: 'none', legs: 'shorts', weapon: 'aurafist', wc: 'fist', back: 'rod' },
    stats: ST(610, 88, 280, 30, 58, 3.4, 26, 2.9, 0.82, 9.1, 2.5),
    innate: { name: 'Камень, ножницы, бумага', icon: 'jchain', count: h => h.jk && G.time < h.jk.until ? h.jk.seen.length : '', desc: 'Три умения — три знака. Знак, которого ещё не было в цепочке за последние 6 сек, бьёт сильнее: второй — на 20%, третий — на 50% и перезаряжается на 40% быстрее. После третьего цепочка начинается заново.' },
    tick(h) { if (h.vowT > G.time && !hasBuff(h, 'vow')) h.vowT = 0; if (h.chargeT > G.time && (h.stunned || !h.alive)) h.chargeT = 0; },
    abilities: [
      {
        key: 'Q', name: 'Камень', icon: 'jrock', cd: 9, cost: 50, range: 4.6, ind: { type: 'line', w: 3, fixed: true }, anim: 'jrock', animDur: 0.95, lock: 0.8, noReach: true, ai: { t: 'cone' },
        desc: '«Сначала — камень!» 0.6 сек Рику стягивает ауру в кулак (получая на 20% меньше урона), затем бьёт перед собой на 4.8. Ближайший враг получает полный урон, оглушён на 0.6 сек и отлетает на 5; остальные на пути — 60% урона. Оглушение во время замаха срывает удар.',
        cast(h, p) {
          const T = 0.58, vow = h.vowT > G.time, sg = rikSign(h, 0), dmg = D(h, 125, 23, 1.0) * sg.k, dir = p.dir, sx = Math.sin(dir), cz = Math.cos(dir), full = this.cd * 100 / (100 + h.haste), R = vow ? 5.8 : 4.8;
          h.chargeT = G.time + T; addBuff(h, { id: 'rockUp', dur: T + 0.1, dmgIn: 0.8 });
          SFX.at('cue', h.x, h.z, 0.9); SFX.at('overload', h.x, h.z, 0.3);
          FX.lineDecal(h.x, h.z, dir, R, 3, RIK.c, T); G.dangers.push({ x: h.x + sx * 2.6, z: h.z + cz * 2.6, r: 3, team: h.team, until: G.time + T });
          // the gathering: streaks rush into the fist, rings close on him, the air bends
          for (let i = 0; i < 5; i++) after(i * 0.11, () => { if (!h.alive || !(h.chargeT > G.time)) return; FX.implode(h.x, 1.3, h.z, 3.4 - i * 0.35, { n: 8, color: RIK.c, color2: 0xffffff, life: 0.2, streak: true }); FX.ring(h.x, h.z, { r0: 2.8 - i * 0.35, r1: 0.5, color: i % 2 ? RIK.c : RIK.grn, life: 0.22, tex: 'ringThin' }); rikAura(h, 2); if (vow) rikDark(h, 2); });
          FX.warp('lens', h.x, 1.3, h.z, { r: 3.4, str: 0.8, life: T, follow: h }); FX.light(h.x, 2, h.z, RIK.c, 1.4, 12, T);
          after(T, () => {
            if (!h.alive || h.stunned || !(h.chargeT > 0)) { h.chargeT = 0; return; }
            h.chargeT = 0; const x0 = h.x, z0 = h.z, ix = x0 + sx * 2.4, iz = z0 + cz * 2.4, hit = stripHits(h, x0, z0, dir, R, 1.5);
            let first = null, bd = 1e9; for (const e of hit) { const d0 = udist(h, e) - (e.kind === 'hero' ? 3 : 0); if (d0 < bd) { bd = d0; first = e; } }
            for (const e of hit) { damage(h, e, e === first ? dmg : dmg * 0.6, 0); if (e === first) { stun(h, e, 0.6); knock(e, x0, z0, vow ? 7 : 5, 0.3); } else knock(e, x0, z0, 2.5, 0.25); FX.hit(e.x, 1.3, e.z, RIK.c, true); }
            SFX.at(hit.length ? 'bigboom' : 'boom', ix, iz, hit.length ? 0.9 : 0.6); SFX.at('heavy', ix, iz, 1); FX.shake(hit.length ? 0.8 : 0.4); FX.punch(0.8); if (hit.length && (h === G.player || first === G.player)) FX.hitstop(0.08);
            FX.glow(ix, 1.4, iz, 7, RIK.c, 0.2, 'star'); FX.glow(ix, 1.4, iz, 9, 0xffffff, 0.1, 'flare');
            FX.explosion(ix, iz, vow ? 3.4 : 2.6, RIK.c, { el: 'earth', color2: RIK.deep, rock: 0x4a4640 }); FX.shock(ix, iz, 7.5, 1.3, 0.45);
            // the force goes on past the fist: a cone and a lance of light
            const m = new THREE.Mesh(FX.geo.flat, FX.mat('cone', RIK.c, 0.85)); m.position.set(x0 + sx, 1.0, z0 + cz); m.rotation.y = dir; FX.add(m, 0.34, (k, me) => { const s = (2 + (R + 1) * easeOut(k)) * 2 * RK; me.scale.set(s, 1, s); me.material.opacity = 0.85 * (1 - k); });
            FX.beam(x0 + sx, z0 + cz, x0 + sx * (R + 2.5), z0 + cz * (R + 2.5), { color: RIK.pale, w: 1.7, life: 0.24, y: 1.3 });
            FX.sparks(ix, 1.3, iz, { n: 26, color: 0xffffff, color2: RIK.c, speed: [8, 24], life: [0.15, 0.45], dir, spread: 0.6, w: 0.15 });
            FX.debris(ix, 0.4, iz, { n: vow ? 14 : 8, color: 0x4a4640, speed: [3, 10], up: 9, size: [0.18, 0.5] });
            for (let i = 1; i <= 3; i++) after(i * 0.05, () => FX.ring(x0 + sx * (2 + i * 1.6), z0 + cz * (2 + i * 1.6), { r0: 0.4, r1: 1.6 + i * 0.5, color: i % 2 ? RIK.c : RIK.pale, life: 0.3, tex: 'shock', op: 0.8 - i * 0.15 }));
          });
          return { cd: full * sg.cd };
        }
      },
      {
        key: 'W', name: 'Ножницы', icon: 'jscis', cd: 7, cost: 40, range: 8, ind: { type: 'line', w: 2.6, fixed: true }, anim: 'jscis', animDur: 0.5, lock: 0.3, noReach: true, ai: { t: 'shot', sp: 60, farm: true },
        desc: 'Аура вытягивается из двух пальцев в клинок, и Рику одним взмахом рассекает всё на 8 перед собой: урон и «рассечение» — −10 / 14 / 18 / 22 защиты на 4 сек.',
        cast(h, p) {
          const sg = rikSign(h, 1), dmg = D(h, 82, 13.5, 0.65) * sg.k, cut = 6 + 4 * Math.max(1, h.al[1]), dir = p.dir, sx = Math.sin(dir), cz = Math.cos(dir), L = 8, full = this.cd * 100 / (100 + h.haste), vow = h.vowT > G.time;
          SFX.at('whoosh', h.x, h.z, 1); FX.glow(h.x + sx * 0.8, 1.4, h.z + cz * 0.8, 2.2, RIK.grn, 0.2, 'star');
          after(0.1, () => {
            if (!h.alive) return; const x0 = h.x, z0 = h.z; SFX.at('slash', x0, z0, 1);
            for (const e of stripHits(h, x0, z0, dir, L, 1.3)) { damage(h, e, dmg, 0); addBuff(e, { id: 'rikcut', dur: 4, def: -cut, src: h }); FX.hit(e.x, 1.3, e.z, RIK.grn, true); rmpArc(e.x, e.z, dir + 1.57, 2, 1.4, 0.2, RIK.grn, 1.3, false, 0.85); FX.sparks(e.x, 1.2, e.z, { n: 6, color: 0xffffff, color2: RIK.grn, speed: [4, 12], life: [0.15, 0.35], dir, spread: 0.5, w: 0.1 }); }
            // the blade: a crescent as long as the reach, a hard bright edge down the middle, a second fainter crescent behind it
            FX.slash(x0, z0, dir, { r: L, sweep: 1.25, color: RIK.grn, life: 0.26, y: 1.3 }); FX.slash(x0, z0, dir, { r: L * 0.7, sweep: 1.0, color: vow ? RIK.vio : RIK.c, life: 0.22, y: 1.25, flip: true });
            FX.beam(x0 + sx, z0 + cz, x0 + sx * L, z0 + cz * L, { color: RIK.pale, w: 0.55, life: 0.2, y: 1.3 });
            for (let i = 1; i < 6; i++) { const d0 = i / 6 * L; FX.sparks(x0 + sx * d0, 1.3, z0 + cz * d0, { n: 2, color: RIK.pale, color2: RIK.gdeep, speed: [2, 7], life: [0.15, 0.35], w: 0.09 }); }
            FX.shock(x0 + sx * L * 0.6, z0 + cz * L * 0.6, 3.5, 0.5, 0.3);
          });
          return { cd: full * sg.cd };
        }
      },
      {
        key: 'E', name: 'Бумага', icon: 'jpaper', cd: 10, cost: 45, range: 15, ind: { type: 'line', w: 1.8 }, anim: 'jpaper', animDur: 0.45, lock: 0.25, ai: { t: 'shot', sp: 30 },
        desc: 'Раскрытая ладонь выпускает сгусток ауры на 15: первый враг на пути получает магический урон и замедлен на 35% на 1.5 сек, враги в радиусе 2.8 вокруг него — половину урона.',
        cast(h, p) {
          const sg = rikSign(h, 2), dmg = D(h, 72, 12, 0.3, 0.5) * sg.k, dir = p.dir, sx = Math.sin(dir), cz = Math.cos(dir), full = this.cd * 100 / (100 + h.haste), vow = h.vowT > G.time, col = vow ? RIK.vio : RIK.c;
          SFX.at('cast', h.x, h.z, 0.9); SFX.at('shoot', h.x, h.z, 0.7); FX.glow(h.x + sx, 1.5, h.z + cz, 3.2, col, 0.2, 'star'); FX.ring(h.x + sx, h.z + cz, { r0: 0.3, r1: 2, color: col, life: 0.25, tex: 'ringThin', y: 1.2 });
          shot(h, {
            dir, speed: 30, range: 15, w: 1.0, color: col, size: 1.15, mesh: 'orb', y: 1.4, ribbon: 1.6,
            trail: q => { FX.trail(q.x, q.y, q.z, col, 0.75, 2); if (Math.random() < 0.6) FX.sparks(q.x, q.y, q.z, { n: 1, color: RIK.pale, color2: col, speed: [1, 4], life: [0.15, 0.3], w: 0.08, grav: 0 }); },
            onHit: (e, q) => {
              damage(h, e, dmg, 1); slow(h, e, 0.35, 1.5); for (const o of enemiesIn(h, q.x, q.z, 2.8)) if (o !== e) { damage(h, o, dmg * 0.5, 1); FX.hit(o.x, 1.3, o.z, col, false); }
              SFX.at('boom', q.x, q.z, 0.6); FX.explosion(q.x, q.z, 2.3, col, { color2: RIK.deep, smoke: false }); FX.ring(q.x, q.z, { r0: 0.4, r1: 2.8, color: RIK.pale, life: 0.3, tex: 'ringThin' }); FX.sparks(q.x, 1.3, q.z, { n: 14, color: 0xffffff, color2: col, speed: [5, 14], life: [0.15, 0.4], w: 0.11 });
            },
            onEnd: (x, z, q) => { if (!q.n) { FX.ring(x, z, { r0: 0.3, r1: 1.6, color: col, life: 0.25 }); FX.sparks(x, 1.3, z, { n: 6, color: RIK.pale, color2: col, speed: [2, 6], life: [0.15, 0.3], w: 0.09 }); } }
          });
          return { cd: full * sg.cd };
        }
      },
      {
        key: 'R', name: 'Клятва', icon: 'jvow', cd: 110, cost: 100, range: 0, ind: { type: 'self', r: 5.5 }, anim: 'vow', animDur: 1.35, lock: 1.05, ai: { t: 'nova', r: 6, ult: true, hp: 0.6, rad: 7 },
        desc: 'Рику отдаёт всё ради силы прямо сейчас. 1 сек он собирает ауру (получая на 40% меньше урона), затем волна бьёт и отбрасывает врагов в радиусе 5.5, а сам он на 9 сек вырастает: +45 / 70 / 95 силы атаки, +30% урона, +25% скорости передвижения и атаки, −20% получаемого урона; знаки сразу готовы и перезаряжаются вдвое быстрее. Когда сила уходит — расплата: потеря 20% текущего здоровья, 4 сек безмолвия и замедления на 30%.',
        cast(h) {
          const T = 1.0, DUR = 9, R = 5.5, lv = Math.max(1, h.al[3]), dmg = D(h, 95, 19, 0.7); h.order = null; h.path = null;
          addBuff(h, { id: 'vowUp', dur: T + 0.15, dmgIn: 0.6 }); telegraph(h, h.x, h.z, R, T, RIK.vio); SFX.at('dark', h.x, h.z, 1); SFX.at('overload', h.x, h.z, 0.8);
          FX.pillar(h.x, h.z, { r: 1.5, h: 14, color: RIK.vio, life: T, op: 0.5, grow: true }); FX.zone(h.x, h.z, R, RIK.vio, T, { tex: 'swirl', spin: -5, op: 0.6 });
          for (let i = 0; i < 8; i++) after(i * 0.12, () => { if (!h.alive) return; FX.implode(h.x, 1.6, h.z, 6 - i * 0.4, { n: 10, color: i % 2 ? RIK.vio : RIK.c, color2: 0xffffff, life: 0.25, streak: true }); rikDark(h, 4); FX.shake(0.12 + i * 0.03); if (i % 2) FX.arcs(h.x, 1.6, h.z, 3, 2, RIK.vio); });
          after(T, () => {
            if (!h.alive) return; const x = h.x, z = h.z; h.vowT = G.time + DUR; h.cd[0] = h.cd[1] = h.cd[2] = 0;
            const b = addBuff(h, {
              id: 'vow', dur: DUR, ad: 20 + 25 * lv, ms: 0.25, as: 0.25, dmgOut: 1.3, dmgIn: 0.8, every: 0.22, onTick: u => rikDark(u, 2),
              onEnd: u => {   // the price
                u.vowT = 0; if (!u.alive) return; u.hp = Math.max(1, u.hp * 0.8); addBuff(u, { id: 'price', dur: 4, silence: true, slow: 0.3, src: u });
                FX.ring(u.x, u.z, { r0: 4, r1: 0.5, color: RIK.vio, life: 0.45, tex: 'shock' }); FX.burst(u.x, 1.4, u.z, { smoke: true, n: 10, color: 0x241438, color2: 0x08040e, speed: [1, 3], life: [0.6, 1.2], size: [1, 2.6], up: 2, a: 0.5 }); SFX.at('dark', u.x, u.z, 0.7);
                if (FX.near(u.x, u.z, 45)) FX.text(u.x, u.height + 1.4, u.z, 'РАСПЛАТА', '#b79aff', 17); if (u === G.player) UI.msg('Расплата: умения недоступны 4 сек');
              }
            });
            if (b) b.fx = FX.aura(h, RIK.vio, DUR, 2.3, 'swirl', 6); FX.heat(x, 2.4, z, 2.4, DUR, 0.45, { follow: h, h: 3.2 });
            for (const e of enemiesIn(h, x, z, R)) { damage(h, e, dmg, 0); knock(e, x, z, 4.5, 0.3); FX.hit(e.x, 1.3, e.z, RIK.vio, true); }
            SFX.at('bigboom', x, z, 1); FX.shake(0.9); FX.punch(1); FX.light(x, 3, z, RIK.vio, 2, 30, 0.6);
            FX.explosion(x, z, 4.2, RIK.vio, { el: 'shadow', color2: RIK.vdeep }); FX.shock(x, z, R * 1.7, 1.4, 0.55); FX.pillar(x, z, { r: 2.2, h: 22, color: RIK.vio, life: 0.9, op: 0.5 }); FX.pillar(x, z, { r: 0.8, h: 30, color: RIK.c, life: 0.6, op: 0.6 });
            for (let i = 0; i < 3; i++) after(i * 0.08, () => FX.ring(x, z, { r0: 0.6 + i, r1: R + 1 + i * 1.5, color: i % 2 ? RIK.c : RIK.vio, life: 0.5, tex: i ? 'ringThin' : 'shock' }));
            FX.ring(x, z, { r0: R * 0.8, r1: R * 0.95, color: RIK.vio, life: 2.2, tex: 'crack', op: 0.8 }); FX.scorch(x, z, R * 0.7, RIK.vio, 8); FX.debris(x, 0.3, z, { n: 14, color: 0x4a4640, speed: [3, 10], up: 10, size: [0.2, 0.55], rad: 1.5 });
            if (FX.near(x, z, 45)) FX.text(x, h.height + 2.6, z, 'КЛЯТВА', '#c9b0ff', 19);
          });
        }
      }
    ]
  }
);

/* ===== roster, part 13: the Ashen One (a support who rides on an ally's shoulders), the Chess Master (pieces set on the board and moved by a second press), Mei the shark maid (ice shears and the scent of blood) ===== */
const ASH = { c: 0xb8b4ac, pale: 0xe8e4da, deep: 0x4a4844, emb: 0xff7a2a, edeep: 0x7a2a08, grn: 0x9fe08a };
function ashSmoke(x, y, z, r, n, a) { if (FX.near(x, z, 55)) FX.burst(x, y, z, { smoke: true, n, color: 0x8f8b83, color2: 0x2a2826, speed: [0.2, 1.2], life: [0.8, 1.6], size: [r * 0.6, r * 1.6], up: 0.8, rad: r * 0.6, a: a || 0.4, drag: 1 }); }
function ashEmbers(x, y, z, n, rad) { FX.sparks(x, y, z, { n, color: 0xffd0a0, color2: ASH.emb, speed: [0.3, 1.6], life: [0.5, 1.1], up: 2.5, grav: -1, drag: 1, rad: rad || 0.6, w: 0.07, stretch: 0.05 }); }
// climb down from the ally's shoulders
function ashOff(h) {
  const R = h.ride; if (!R) return; h.ride = null; h.phase = false; h.yOff = 0; if (R.fx) R.fx.dead = true; for (const b of h.buffs) if (b.id === 'ride') b.dead = true;
  const q = NAV.nearest(h.x + Math.sin(h.facing + 2.4) * 1.6, h.z + Math.cos(h.facing + 2.4) * 1.6); h.x = q.x; h.z = q.z; h.cd[0] = h.def.abilities[0].cd * 100 / (100 + h.haste);
  ashSmoke(h.x, 1, h.z, 1.2, 5, 0.5); SFX.at('dash', h.x, h.z, 0.4);
}
let _ashCig = null;
function ashCig() {
  if (!_ashCig) _ashCig = [new THREE.CylinderGeometry(0.07, 0.07, 0.9, 6).rotateZ(Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xe8e4da }), new THREE.CylinderGeometry(0.075, 0.075, 0.16, 6).rotateZ(Math.PI / 2).translate(0.5, 0, 0), new THREE.MeshBasicMaterial({ color: 0xff7a2a }), new THREE.CylinderGeometry(0.075, 0.075, 0.24, 6).rotateZ(Math.PI / 2).translate(-0.36, 0, 0), new THREE.MeshBasicMaterial({ color: 0xc98a3a })];
  const g = new THREE.Group(), C = _ashCig; g.add(new THREE.Mesh(C[0], C[1]), new THREE.Mesh(C[2], C[3]), new THREE.Mesh(C[4], C[5])); return g;
}

const CHS = { c: 0x4dff9a, pale: 0xd0ffe0, deep: 0x0c6a3a, dk: 0x06301c };
const CHS_I = { pawn: 0, bishop: 1, rook: 2, queen: 3 }, CHS_S = { pawn: 1.25, bishop: 1.45, rook: 1.45, queen: 1.9 };
function chsTex() {
  if (TEX.chess) return TEX.chess; const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) { const d = Math.hypot(i - 3.5, j - 3.5) / 4.6, a = Math.max(0, 1 - d * d) * ((i + j) % 2 ? 0.75 : 0.16); g.fillStyle = 'rgba(255,255,255,' + a + ')'; g.fillRect(i * 32 + 1, j * 32 + 1, 30, 30); }
  return (TEX.chess = new THREE.CanvasTexture(c));
}
// the board lies along the map: its "forward" is the direction of the nearest lane at that spot, toward the enemy base
function chsAng(h, x, z) {
  let best = null, bd = 1e9, bs = 0; for (const n of LANE_NAMES) { const s = laneProject(LANES[n], x, z); if (laneProject.d < bd) { bd = laneProject.d; best = LANES[n]; bs = s; } }
  const p = lanePoint(best, bs); return Math.atan2(p.dx, p.dz) + (h.team ? Math.PI : 0);
}
function chsFull(h, kind) { const i = CHS_I[kind]; return h.def.abilities[i].cd * 100 / (100 + h.haste); }
// take a piece off the board: its ability goes on its real cooldown only now
function chsDrop(h, kind) { const p = h.pcs && h.pcs[kind]; if (!p) return; h.pcs[kind] = null; p.e.dead = true; if (kind !== 'queen') h.cd[CHS_I[kind]] = chsFull(h, kind); if (FX.near(p.x, p.z, 50)) { FX.ring(p.x, p.z, { r0: p.R * 0.6, r1: 0.3, color: CHS.c, life: 0.3, tex: 'ringThin' }); FX.sparks(p.x, 1, p.z, { n: 8, color: CHS.pale, color2: CHS.deep, speed: [1, 5], life: [0.2, 0.5], up: 3, w: 0.09 }); } }
// set a piece: it drops from above onto its square, a patch of glowing board under it. `tick(p)` runs twice a second while it stands
function chsPlace(h, kind, x, z, dur, R, tick) {
  if (!h.pcs) h.pcs = {}; if (h.pcs[kind]) { const o = h.pcs[kind]; h.pcs[kind] = null; o.e.dead = true; }
  // the piece itself is solid and faceted (lit, with its own green glow) inside a dark outline shell, so it reads against the bright squares
  const q = { x: clamp(x, -95, 95), z: clamp(z, -95, 95) }, grp = new THREE.Group(), s = CHS_S[kind], ang = chsAng(h, x, z);
  const pc = new THREE.Mesh(chessGeo(kind), new THREE.MeshPhongMaterial({ color: 0x46c98a, emissive: 0x0d4a2c, flatShading: true, shininess: 40, specular: 0x66ddaa, transparent: true })); pc.scale.setScalar(s); pc.userData.own = true;
  const bd = new THREE.Mesh(FX.geo.flat, new THREE.MeshBasicMaterial({ map: chsTex(), color: CHS.c, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); bd.userData.own = true; bd.scale.set(R * 2.3, 1, R * 2.3); bd.position.y = 0.09; bd.renderOrder = 4; bd.rotation.y = ang;
  const core = new THREE.Mesh(chessGeo(kind), new THREE.MeshBasicMaterial({ color: 0x021a0e, side: THREE.BackSide, transparent: true })); core.userData.own = true; core.scale.set(s * 1.22, s * 1.07, s * 1.22);
  const base = new THREE.Mesh(FX.geo.flat, FX.mat('glow', 0x021a0e, 0.7, false)); base.userData.own = true; base.scale.set(s * 1.9, 1, s * 1.9); base.position.y = 0.1; base.renderOrder = 5; grp.add(bd, base, core, pc);
  const p = { kind, x: q.x, z: q.z, R, ang, until: G.time + dur, t0: G.time, acc: 0, moving: false, steps: 0, hit: null };
  p.e = FX.add(grp, dur + 60, (k, me, dt, en) => { const dr = Math.min(1, en.t / 0.22), y = (1 - dr * dr) * 7, left = p.until - G.time, f = Math.min(1, left / 0.4); me.position.set(p.x, 0, p.z); pc.position.y = y + Math.sin(en.t * 2.2) * 0.08 + 0.1; core.position.y = pc.position.y - s * 0.03; pc.rotation.y = core.rotation.y += dt * (p.moving ? 9 : 0.7); bd.material.opacity = 0.5 * dr * f * (0.8 + 0.2 * Math.sin(en.t * 3)); pc.material.opacity = core.material.opacity = f; base.material.opacity = 0.7 * dr * f; });
  h.pcs[kind] = p; after(0.2, () => { if (h.pcs[kind] !== p) return; FX.ring(p.x, p.z, { r0: 0.3, r1: R, color: CHS.c, life: 0.4, tex: 'shock' }); FX.pillar(p.x, p.z, { r: 0.7, h: 9, color: CHS.c, life: 0.4, op: 0.5 }); FX.sparks(p.x, 0.5, p.z, { n: 12, color: CHS.pale, color2: CHS.deep, speed: [2, 8], life: [0.2, 0.5], w: 0.1 }); SFX.at('hit', p.x, p.z, 0.8); SFX.at('ice', p.x, p.z, 0.4); });
  G.actors.push({ update(dt) { if (h.pcs[kind] !== p) return false; if (G.time > p.until) { chsDrop(h, kind); return false; } p.acc += dt; if (p.acc >= 0.5 && G.time - p.t0 > 0.25) { p.acc = 0; tick(p); } return true; } });
  return p;
}
// slide a piece in a straight line; `touch(e)` is called once for every enemy it passes over
function chsSlide(h, p, dir, len, speed, touch, done) {
  const sx = Math.sin(dir), cz = Math.cos(dir); let left = len; p.moving = true; p.hit = new Set(); const rib = FX.ribbon(CHS.c, 1.3, 12); SFX.at('dash', p.x, p.z, 0.6);
  G.actors.push({ update(dt) {
    if (h.pcs[p.kind] !== p) { rib.end(); return false; }
    const st = Math.min(left, speed * dt), nx = p.x + sx * st, nz = p.z + cz * st; left -= st; if (Math.abs(nx) > 95 || Math.abs(nz) > 95) left = 0; else { p.x = nx; p.z = nz; }
    rib.add(p.x, 0.9, p.z); if (touch) for (const e of enemiesIn(h, p.x, p.z, 1.5)) if (!p.hit.has(e.id)) { p.hit.add(e.id); touch(e); }
    if (left <= 0) { rib.end(); p.moving = false; FX.ring(p.x, p.z, { r0: 0.3, r1: 2.2, color: CHS.c, life: 0.3, tex: 'ringThin' }); if (done) done(p); return false; }
    return true;
  } });
}
const chsQ = h => (h.pcs && h.pcs.queen ? 1.4 : 1);   // the queen on the board strengthens every other piece

const MEI = { c: 0x7fdcff, pale: 0xe0f6ff, deep: 0x1a5a8a, red: 0xd0182a, rdeep: 0x4a060e };
function meiIce(x, z, r, n) { FX.debris(x, 0.4, z, { glow: true, n, color: 0xcfefff, speed: [3, 5 + r], up: 7, size: [0.2, 0.5], rad: r * 0.4 }); FX.flame(x, 0.6, z, { n: Math.round(3 + r), color: MEI.pale, color2: MEI.deep, speed: [1, 2 + r], life: [0.4, 0.9], size: [r * 0.5, r * 1.3], up: 0.5, ring: true, a: 0.3 }); }

HEROES.push(
  /* ================= 36. the Ashen One ================= */
  {
    id: 'ashen', name: 'Пепельный', title: 'Попутчик с огоньком', role: 'support', roleName: 'Поддержка', build: 'support', bars: [2, 2, 3, 3], diffc: 2, projMesh: 'orb', atkSfx: 'shoot',
    lore: 'Мужик в сером цилиндре, который не выпускает сигарету изо рта и никуда не ходит сам, если можно доехать на чужих плечах. Дым его табака затягивает раны своим и ест глаза чужим. Говорят, пепел Разлома — это он стряхнул.',
    look: { bulk: 0.96, h: 1.02, c1: 0x56585e, c2: 0x3e4046, c3: 0x2a2b30, skin: 0xcdb8a4, hands: 0xcdb8a4, metal: 0x9a9da4, glow: 0xff8a3a, head: 'smoker', hair: 0x4a4a50, coat: 0x4a4c52, chest: 'longcoat', sh: 'cloth', legs: 'boots', weapon: 'sign', wc: 'wand' },
    stats: ST(520, 74, 420, 46, 44, 2.3, 18, 2.2, 0.72, 8.8, 9.5),
    innate: { name: 'Вторичный дым', icon: 'ashinn', desc: 'Союзные герои в радиусе 6 каждую секунду восстанавливают немного здоровья. Тот, на ком Пепельный сидит, лечится втрое сильнее.' },
    tick(h, dt) {
      h.ashT = (h.ashT || 0) + dt;
      if (h.ride) {
        const a = h.ride.a; if (!a.alive || G.time > h.ride.until || !hasBuff(h, 'ride')) ashOff(h);
        else { h.x = a.x; h.z = a.z; h.yOff = a.height * 0.6 + (a.yOff || 0); h.phase = true; h.path = null; h.moving = false; if (h.order && h.order.type === 'move') h.order = null; if (!(h.windup > 0) && !(h.anim.castT > 0)) h.facing = a.facing; if (Math.random() < dt * 5) ashSmoke(h.x, h.yOff + 2, h.z, 0.5, 1, 0.3); }
      }
      if (h.ashT >= 1) { h.ashT = 0; const amt = 4 + 0.9 * h.level + 0.03 * h.ap; for (const a of alliesIn(h, h.x, h.z, 6, true)) if (a !== h && a.hp < a.maxHp) { heal(h, a, amt * (h.ride && h.ride.a === a ? 3 : 1), true); if (FX.near(a.x, a.z, 45)) FX.burst(a.x, 1.2, a.z, { n: 2, color: ASH.grn, color2: ASH.grn, speed: [0.1, 0.5], life: [0.5, 0.9], size: [0.3, 0.04], up: 2, rad: 0.7, a: 0.6 }); } }
    },
    abilities: [
      {
        key: 'Q', name: 'На закорках', icon: 'ashride', cd: 14, cost: 40, range: 7, ind: { type: 'ally' }, lock: 0, ai: { t: 'shieldAlly' }, noCue: true,
        desc: 'Пепельный запрыгивает на плечи союзному герою и едет на нём до 10 сек: его нельзя ранить, он двигается вместе с носителем, втрое сильнее лечит его своим дымом и может применять умения и атаковать. Повторное нажатие — слезть. Перезарядка начинается, когда он слез.',
        free: h => !!h.ride,
        cast(h, p) {
          if (h.ride) { ashOff(h); return { cd: this.cd * 100 / (100 + h.haste) }; }
          const a = p.unit; if (!a || a === h || a.kind !== 'hero' || a.ride) { if (h === G.player) UI.msg('Наведите на союзного героя'); return false; }
          h.ride = { a, until: G.time + 10, fx: FX.aura(a, ASH.grn, 10, a.radius + 0.7, 'ring', 2) }; addBuff(h, { id: 'ride', dur: 10, invuln: true });
          ashSmoke(h.x, 1, h.z, 1.3, 6, 0.5); FX.beam(h.x, h.z, a.x, a.z, { color: ASH.c, w: 0.6, life: 0.25 }); h.x = a.x; h.z = a.z; ashSmoke(a.x, a.height, a.z, 1, 5, 0.5); ashEmbers(a.x, a.height + 0.5, a.z, 8); SFX.at('dash', a.x, a.z, 0.7); SFX.at('heal', a.x, a.z, 0.4);
          return { cd: 0.7 };
        }
      },
      {
        key: 'W', name: 'Пепелище', icon: 'ashzone', cd: 13, cost: 60, range: 11, ind: { type: 'circle', r: 5.5 }, ai: { t: 'point', rad: 5.5 },
        desc: 'Засыпает большую область горячим пеплом на 5 сек: враги внутри замедлены на 40% и получают магический урон дважды в секунду.',
        cast(h, p) {
          const R = 5.5, x = p.x, z = p.z, dmg = D(h, 13, 2.3, 0, 0.09); SFX.at('fire', x, z, 0.6); SFX.at('dark', x, z, 0.4);
          const disc = new THREE.Mesh(FX.geo.flat, FX.mat('fill', 0x2c2a28, 0.5, false)); disc.position.set(x, 0.07, z); disc.scale.set(R * 2 * RK, 1, R * 2 * RK); disc.renderOrder = 3; FX.add(disc, 5, (k, me, dt, e) => { me.material.opacity = 0.5 * Math.min(1, e.t / 0.3, (5 - e.t) / 0.5); });
          FX.zone(x, z, R, ASH.c, 5, { tex: 'swirl', spin: 0.5, op: 0.45 }); FX.zone(x, z, R, ASH.emb, 5, { tex: 'ringThin', spin: 0, op: 0.7 }); FX.ring(x, z, { r0: 0.5, r1: R, color: ASH.c, life: 0.5, tex: 'shock' }); ashSmoke(x, 0.8, z, R, 14, 0.45);
          zone(h, { x, z, r: R, dur: 5, every: 0.5, first: true, tick: () => {
            for (const e of enemiesIn(h, x, z, R)) { slow(h, e, 0.4, 0.7, 'ashslow'); damage(h, e, dmg, 1, { dot: true }); }
            if (FX.near(x, z, 50)) { ashSmoke(x, 0.6, z, R, 4, 0.35); const a = rand(TAU), d = rand(R); ashEmbers(x + Math.sin(a) * d, 0.3, z + Math.cos(a) * d, 4, 1.5); FX.burst(x, 0.3, z, { n: 6, color: 0x9a968e, color2: 0x4a4844, speed: [0.1, 0.5], life: [0.8, 1.5], size: [0.16, 0.03], up: 0.6, rad: R, a: 0.7 }); }
          } });
        }
      },
      {
        key: 'E', name: 'Затяжка', icon: 'ashcloud', cd: 8, cost: 50, range: 11, ind: { type: 'line', w: 3.2 }, ai: { t: 'shot', sp: 13, healLine: true },
        desc: 'Выдыхает густое облако дыма, которое плывёт вперёд на 11 сквозь всех: союзных героев лечит, врагам наносит магический урон и замедляет их на 20% на 1.5 сек.',
        cast(h, p) {
          const dmg = D(h, 68, 11.5, 0, 0.55), hl = D(h, 48, 8, 0, 0.34), y0 = 1.4 + (h.yOff || 0); SFX.at('cast', h.x, h.z, 0.7); SFX.at('poison', h.x, h.z, 0.5); let acc = 0;
          shot(h, { dir: p.dir, speed: 13, range: 11, w: 1.6, color: ASH.c, size: 1.4, mesh: false, ribbon: false, pierce: true, y: y0,
            trail: q => { acc++; if (acc % 2 === 0) { ashSmoke(q.x, 1.3, q.z, 1.7, 3, 0.5); FX.flame(q.x, 1.3, q.z, { n: 1, color: ASH.grn, color2: 0x1a3a1a, size: [1.2, 2.4], life: [0.4, 0.8], up: 0.4, a: 0.18 }); } if (acc % 5 === 0) ashEmbers(q.x, 1.3, q.z, 3, 1); },
            onAlly: a => { heal(h, a, hl); FX.heal(a, ASH.grn); }, onHit: e => { damage(h, e, dmg, 1); slow(h, e, 0.2, 1.5); ashEmbers(e.x, 1.3, e.z, 6); FX.hit(e.x, 1.3, e.z, ASH.emb, false); },
            onEnd: (x, z) => { ashSmoke(x, 1.2, z, 2.4, 8, 0.4); FX.ring(x, z, { r0: 0.5, r1: 2.6, color: ASH.c, life: 0.4, op: 0.5 }); } });
          if (hl > 0 && h.hp < h.maxHp) heal(h, h, hl * 0.5);
        }
      },
      {
        key: 'R', name: 'Пепельница', icon: 'ashtray', cd: 95, cost: 100, range: 0, ind: { type: 'self', r: 8 }, animDur: 0.7, lock: 0.4, ai: { t: 'save', r: 9, hp: 0.5, ult: true, rad: 8 },
        desc: 'Вытряхивает пепельницу: вокруг на 9 сек разлетаются 10 непотушенных сигарет. Союзный герой, наступив на сигарету, лечится сразу и ещё 3 сек; враг получает урон, отравлен на 4 сек и замедлен на 25%.',
        cast(h) {
          const hl = D(h, 70, 14, 0, 0.4), dmg = D(h, 45, 9, 0, 0.3), dot = D(h, 16, 3.2, 0, 0.1), x0 = h.x, z0 = h.z; SFX.at('boom', x0, z0, 0.5); SFX.at('fire', x0, z0, 0.6);
          FX.ring(x0, z0, { r0: 0.5, r1: 8, color: ASH.emb, life: 0.6, tex: 'shock' }); FX.shock(x0, z0, 7, 0.7, 0.45); ashSmoke(x0, 1.2, z0, 3, 12, 0.5); ashEmbers(x0, 1.4, z0, 24, 2); if (FX.near(x0, z0, 45)) FX.text(x0, h.height + 2, z0, 'ПЕПЕЛЬНИЦА', '#ffb070', 17);
          for (let i = 0; i < 10; i++) {
            const a = i / 10 * TAU + rand(-0.25, 0.25), d = rand(2.4, 7.6), q = NAV.nearest(x0 + Math.sin(a) * d, z0 + Math.cos(a) * d), c = { x: q.x, z: q.z, live: true, t: 0 }, g = ashCig(), spin = rand(TAU);
            const e = FX.add(g, 9.4, (k, me, dt, en) => { const f = Math.min(1, en.t / 0.5); me.position.set(lerp(x0, c.x, f), 0.16 + Math.sin(Math.PI * f) * 3.2 + (f >= 1 ? Math.sin(en.t * 3 + spin) * 0.04 : 0), lerp(z0, c.z, f)); me.rotation.y = spin + (1 - f) * 9; me.rotation.z = (1 - f) * 6; me.scale.setScalar(1.25); });
            const mark = FX.zone(c.x, c.z, 1.25, ASH.emb, 9.4, { tex: 'ringThin', spin: 1.5, op: 0.7 });
            G.actors.push({ update(dt) {
              c.t += dt; if (c.t > 9.4) return false; if (c.t < 0.5) return true;
              if (Math.random() < dt * 4 && FX.near(c.x, c.z, 45)) { ashSmoke(c.x, 0.5, c.z, 0.35, 1, 0.35); if (Math.random() < 0.4) ashEmbers(c.x, 0.3, c.z, 1, 0.2); }
              for (const u of G.heroes) {
                if (!u.alive || dist(u.x, u.z, c.x, c.z) > 1.3 + u.radius * 0.3 || (u.ride && u !== h)) continue;
                if (u.team === h.team) { if (u.hp >= u.maxHp * 0.98) continue; heal(h, u, hl); addBuff(u, { id: 'ashcig' + h.id, dur: 3.05, every: 1, onTick: t => heal(h, t, hl * 0.2, true) }); FX.heal(u, ASH.grn); SFX.at('heal', c.x, c.z, 0.5); }
                else { damage(h, u, dmg, 1); slow(h, u, 0.25, 4, 'ashpoison'); addBuff(u, { id: 'ashtox' + h.id, dur: 4.05, every: 1, onTick: t => { damage(h, t, dot, 1, { dot: true }); FX.burst(t.x, 1.4, t.z, { n: 3, color: 0xb8d070, color2: 0x3a4a10, speed: [0.2, 0.8], life: [0.4, 0.8], size: [0.3, 0.04], up: 1.5, rad: 0.5 }); } }); FX.hit(c.x, 0.8, c.z, ASH.emb, true); SFX.at('poison', c.x, c.z, 0.6); }
                e.dead = true; mark.dead = true; ashSmoke(c.x, 0.7, c.z, 1, 5, 0.5); ashEmbers(c.x, 0.5, c.z, 8); return false;
              }
              return true;
            } });
          }
        }
      }
    ]
  },
  /* ================= 37. the Chess Master ================= */
  {
    id: 'chess', name: 'Шахматист', title: 'Гроссмейстер Разлома', role: 'mage', roleName: 'Стратег', build: 'mage', bars: [3, 2, 4, 2], diffc: 3, projMesh: 'orb', atkSfx: 'shoot',
    lore: 'Он не касается земли и не повышает голоса. Поле боя для него — доска, на которой уже расставлены его фигуры, а чужие ещё не знают, что сделали свой последний ход. Каждую фигуру он ставит сам и сам ведёт: пешку — вперёд, слона — наискось, ладью — по прямой.',
    look: { bulk: 0.88, h: 1.06, robe: true, c1: 0x14291f, c2: 0x0c1a14, c3: 0x1d3b2d, skin: 0xd8cfc4, hands: 0xd8cfc4, metal: 0xc9d2cc, glow: 0x4dff9a, head: 'grandm', hair: 0xc8ccd0, chest: 'longcoat', sh: 'cloth', weapon: 'sign', wc: 'wand', back: 'chess', hover: 0.55 },
    stats: ST(500, 72, 480, 52, 46, 2.4, 17, 2.1, 0.7, 8.7, 10),
    innate: { name: 'Позиция', icon: 'chboard', count: h => { let n = 0; if (h.pcs) for (const k in h.pcs) if (h.pcs[k]) n++; return n || ''; }, desc: 'Каждая фигура на доске даёт Шахматисту силу умений (8 + 2 за уровень героя). Пока стоит ферзь, ауры и удары остальных фигур сильнее на 40%. Перезарядка фигуры начинается, когда она уходит с доски.' },
    tick(h) { let n = 0; if (h.pcs) for (const k in h.pcs) if (h.pcs[k]) n++; if (n) addBuff(h, { id: 'board', dur: 0.3, ap: n * (8 + 2 * h.level) }); },
    onHeroDeath() { },
    abilities: [
      {
        key: 'Q', name: 'Пешка', icon: 'chpawn', cd: 14, cost: 45, range: 9, ind: { type: 'circle', r: 4.5 }, lock: 0.1, ai: { t: 'point', rad: 4 }, noCue: true,
        desc: 'Ставит пешку на 12 сек: союзные герои в радиусе 4.5 лечатся дважды в секунду. Повторное нажатие двигает её на клетку вперёд — на 4.2 к вражеской базе вдоль ближайшей линии (доска всегда лежит по линии). Третий ход — превращение: пешка исчезает во вспышке, которая разом лечит союзников вокруг в четыре раза сильнее.',
        free: h => !!(h.pcs && h.pcs.pawn),
        cast(h, p) {
          let pc = h.pcs && h.pcs.pawn;
          if (pc) {
            if (pc.moving) return { cd: 0.3 }; pc.steps++;
            chsSlide(h, pc, pc.dir, 4.2, 16, null, q => { if (q.steps >= 3) { for (const a of alliesIn(h, q.x, q.z, 5.5, true)) { heal(h, a, q.heal * 4); FX.heal(a, CHS.c); } FX.explosion(q.x, q.z, 3, CHS.c, { el: 'holy', mark: false }); FX.pillar(q.x, q.z, { r: 1.4, h: 14, color: CHS.c, life: 0.7, op: 0.6 }); if (FX.near(q.x, q.z, 45)) FX.text(q.x, 3.4, q.z, 'ПРЕВРАЩЕНИЕ', '#b8ffd6', 16); SFX.at('heal', q.x, q.z, 1); chsDrop(h, 'pawn'); } });
            return { cd: 0.9 };
          }
          const heal0 = D(h, 9, 1.7, 0, 0.07);
          pc = chsPlace(h, 'pawn', p.x, p.z, 12, 4.5, q => { for (const a of alliesIn(h, q.x, q.z, q.R, true)) if (a.hp < a.maxHp) { heal(h, a, q.heal * chsQ(h), true); if (FX.near(a.x, a.z, 45)) FX.burst(a.x, 1, a.z, { n: 2, color: CHS.c, color2: CHS.pale, speed: [0.1, 0.5], life: [0.5, 0.9], size: [0.3, 0.04], up: 2.4, rad: 0.7 }); } });
          pc.heal = heal0; pc.dir = pc.ang; return { cd: 0.9 };
        }
      },
      {
        key: 'W', name: 'Слон', icon: 'chbishop', cd: 12, cost: 55, range: 10, ind: { type: 'circle', r: 3.2 }, lock: 0.1, ai: { t: 'point', rad: 3 }, noCue: true,
        desc: 'Слон падает на поле на 10 сек: магический урон врагам в радиусе 3.2, затем аура — урон дважды в секунду. Повторное нажатие ведёт его по диагонали доски в сторону курсора на 9 клеток: он ранит всех, сквозь кого прошёл.',
        free: h => !!(h.pcs && h.pcs.bishop),
        cast(h, p) {
          let pc = h.pcs && h.pcs.bishop;
          if (pc) {
            if (pc.moving) return { cd: 0.3 }; const a = angTo(pc.x, pc.z, p.x, p.z), dir = pc.ang + Math.round((a - pc.ang - Math.PI / 4) / (Math.PI / 2)) * (Math.PI / 2) + Math.PI / 4;
            chsSlide(h, pc, dir, 9, 30, e => { damage(h, e, pc.dmg * 0.8 * chsQ(h), 1); FX.hit(e.x, 1.3, e.z, CHS.c, true); rmpArc(e.x, e.z, dir + 1.57, 2, 1.4, 0.2, CHS.c, 1.3, false, 0.85); });
            FX.beam(pc.x, pc.z, pc.x + Math.sin(dir) * 9, pc.z + Math.cos(dir) * 9, { color: CHS.c, w: 0.5, life: 0.3, y: 0.3, op: 0.6 }); return { cd: 1.5 };
          }
          const dmg = D(h, 75, 12.5, 0, 0.6), aur = D(h, 14, 2.4, 0, 0.1);
          pc = chsPlace(h, 'bishop', p.x, p.z, 10, 3.2, q => { for (const e of enemiesIn(h, q.x, q.z, q.R)) { damage(h, e, q.aur * chsQ(h), 1, { dot: true }); if (FX.near(e.x, e.z, 45)) FX.sparks(e.x, 1.2, e.z, { n: 2, color: CHS.pale, color2: CHS.deep, speed: [2, 6], life: [0.15, 0.3], w: 0.08 }); } });
          pc.dmg = dmg; pc.aur = aur; telegraph(h, pc.x, pc.z, 3.2, 0.22, CHS.c);
          after(0.22, () => { if (h.pcs.bishop !== pc) return; for (const e of enemiesIn(h, pc.x, pc.z, 3.2)) { damage(h, e, dmg, 1); FX.hit(e.x, 1.3, e.z, CHS.c, true); } FX.explosion(pc.x, pc.z, 2.4, CHS.c, { color2: CHS.deep }); });
          return { cd: 1.5 };
        }
      },
      {
        key: 'E', name: 'Ладья', icon: 'chrook', cd: 15, cost: 60, range: 9, ind: { type: 'circle', r: 4 }, lock: 0.1, ai: { t: 'point', rad: 3 }, noCue: true,
        desc: 'Ладья встаёт на поле на 10 сек крепостью: союзные герои в радиусе 4 получают на 18% меньше урона, враги замедлены на 20%. Повторное нажатие — таран: она мчится по прямой — вдоль линии или поперёк неё — в сторону курсора на 10 клеток, нанося урон, оглушая на 0.8 сек и отталкивая каждого на пути.',
        free: h => !!(h.pcs && h.pcs.rook),
        cast(h, p) {
          let pc = h.pcs && h.pcs.rook;
          if (pc) {
            if (pc.moving) return { cd: 0.3 }; const a = angTo(pc.x, pc.z, p.x, p.z), dir = pc.ang + Math.round((a - pc.ang) / (Math.PI / 2)) * (Math.PI / 2);
            chsSlide(h, pc, dir, 10, 34, e => { damage(h, e, pc.dmg * chsQ(h), 1); stun(h, e, 0.8); knock(e, e.x - Math.sin(dir) * 2, e.z - Math.cos(dir) * 2, 3, 0.25); FX.hit(e.x, 1.3, e.z, CHS.c, true); FX.shock(e.x, e.z, 3, 0.7, 0.3); SFX.at('heavy', e.x, e.z, 0.7); FX.debris(e.x, 0.3, e.z, { n: 3, color: 0x3c3934, speed: [2, 6], up: 6, size: [0.12, 0.3] }); });
            FX.beam(pc.x, pc.z, pc.x + Math.sin(dir) * 10, pc.z + Math.cos(dir) * 10, { color: CHS.c, w: 0.9, life: 0.3, y: 0.3, op: 0.6 }); return { cd: 2 };
          }
          const dmg = D(h, 70, 12, 0, 0.55);
          pc = chsPlace(h, 'rook', p.x, p.z, 10, 4, q => { for (const a of alliesIn(h, q.x, q.z, q.R, true)) addBuff(a, { id: 'rookwall', dur: 0.8, dmgIn: chsQ(h) > 1 ? 0.75 : 0.82, src: h }); for (const e of enemiesIn(h, q.x, q.z, q.R)) slow(h, e, 0.2, 0.8, 'rookslow'); });
          pc.dmg = dmg; after(0.22, () => { if (h.pcs.rook !== pc) return; for (const e of enemiesIn(h, pc.x, pc.z, 2.4)) { damage(h, e, dmg * 0.5, 1); knock(e, pc.x, pc.z, 2.2, 0.2); } FX.shock(pc.x, pc.z, 4, 0.8, 0.35); FX.debris(pc.x, 0.3, pc.z, { n: 5, color: 0x3c3934, speed: [2, 6], up: 6, size: [0.14, 0.34] }); FX.wall(pc.x, pc.z, 4, CHS.c, 9.6, { h: 2.2, op: 0.22, follow: pc }); });
          return { cd: 2 };
        }
      },
      {
        key: 'R', name: 'Ферзь', icon: 'chqueen', cd: 100, cost: 100, range: 12, ind: { type: 'circle', r: 4 }, animDur: 0.8, lock: 0.5, ai: { t: 'point', delay: 0.5, ult: true, hp: 0.7, rad: 5 },
        desc: 'Через 0.5 сек на поле обрушивается ферзь: большой магический урон и оглушение на 0.6 сек в радиусе 4. Затем 8 сек она ходит сама — каждые 1.3 сек бросается к ближайшему вражескому герою в 11 клетках и бьёт всех на пути. Пока ферзь на доске, остальные фигуры сильнее на 40%. Уходя, она объявляет мат: ещё один удар по области.',
        cast(h, p) {
          const x = p.x, z = p.z, dmg = D(h, 150, 28, 0, 0.9), hitD = D(h, 55, 10, 0, 0.35); telegraph(h, x, z, 4, 0.5, CHS.c); SFX.at('cast', h.x, h.z, 1); FX.pillar(x, z, { r: 1, h: 20, color: CHS.c, life: 0.5, op: 0.4, grow: true });
          after(0.3, () => {
            if (!h.alive) return; let acc = 0.6;
            const pc = chsPlace(h, 'queen', x, z, 8.2, 4, q => {
              acc += 0.5; if (acc < 1.3 || q.moving) return; let t = null, bd = 11; for (const e of G.heroes) if (e.alive && hostile(h, e) && dist(e.x, e.z, q.x, q.z) < bd) { bd = dist(e.x, e.z, q.x, q.z); t = e; }
              if (!t) return; acc = 0; const dir = angTo(q.x, q.z, t.x, t.z); chsSlide(h, q, dir, bd + 1.5, 44, e => { damage(h, e, hitD, 1); FX.hit(e.x, 1.3, e.z, CHS.c, true); rmpArc(e.x, e.z, dir + 1.57, 2.4, 1.5, 0.2, CHS.c, 1.3, false, 0.9); SFX.at('slash', e.x, e.z, 0.7); });
            });
            after(0.22, () => { if (h.pcs.queen !== pc) return; for (const e of enemiesIn(h, x, z, 4)) { damage(h, e, dmg, 1); stun(h, e, 0.6); FX.hit(e.x, 1.3, e.z, CHS.c, true); } SFX.at('bigboom', x, z, 0.9); FX.shake(0.7); FX.punch(0.8); FX.explosion(x, z, 4, CHS.c, { color2: CHS.deep }); FX.shock(x, z, 7, 1.2, 0.5); FX.pillar(x, z, { r: 2, h: 24, color: CHS.c, life: 0.8, op: 0.5 }); FX.light(x, 3, z, CHS.c, 2, 26, 0.5); if (FX.near(x, z, 45)) FX.text(x, 5, z, 'ШАХ', '#b8ffd6', 20); });
            G.actors.push({ update() { if (h.pcs.queen === pc) return true; const qx = pc.x, qz = pc.z; for (const e of enemiesIn(h, qx, qz, 3.6)) { damage(h, e, hitD * 1.5, 1); FX.hit(e.x, 1.3, e.z, CHS.c, true); } FX.explosion(qx, qz, 3, CHS.c, { color2: CHS.deep }); if (FX.near(qx, qz, 45)) FX.text(qx, 5, qz, 'МАТ', '#b8ffd6', 20); SFX.at('boom', qx, qz, 0.8); return false; } });
          });
        }
      }
    ]
  },
  /* ================= 38. Mei ================= */
  {
    id: 'mei', name: 'Кила', title: 'Акулья горничная', role: 'assassin', roleName: 'Убийца', build: 'assassin', bars: [5, 2, 3, 4], diffc: 2,
    lore: 'Днём — сонная горничная, которая считает минуты до конца смены и грызёт леденец. Но стоит ей почуять кровь, и от лени не остаётся следа: хвост бьёт по полу, огромные ножницы покрываются инеем, а раненому врагу лучше не оглядываться — она уже идёт по следу.',
    look: { bulk: 0.86, h: 1.0, c1: 0x121218, c2: 0x1a1a22, c3: 0x2a2a34, skin: 0xead6c8, hands: 0xead6c8, metal: 0xb8c0cc, glow: 0x7fdcff, head: 'sharkmaid', hair: 0x15151b, tie: 0xe8e4de, chest: 'gothic', sh: 'frill', legs: 'boots', weapon: 'shears', wc: 'melee', back: 'sharktail' },
    stats: ST(560, 80, 280, 30, 62, 3.7, 22, 2.5, 0.86, 9.4, 2.4),
    tick(h, dt) {
      if (h.frz && h.frz.dead) h.frz = null;
      const lv = h.al[3]; if (!lv) return;
      // the scent (works by itself once the ultimate is learned; pressing it widens it to the whole map): every enemy hero below half health bleeds a trail.
      // Running toward one she is faster, striking one she attacks faster; below a quarter of his health she goes into a frenzy and both bonuses triple
      const act = h.huntT > G.time, R = act ? 300 : 30; h.huntA = (h.huntA || 0) + dt; const drip = h.huntA > 0.2; if (drip) h.huntA = 0;
      const tgt = h.windup > 0 ? h.windupTgt : (h.order && h.order.type === 'attack' ? h.order.tgt : null); let toward = 0, fr = false;
      for (const e of G.heroes) {
        if (!e.alive || !hostile(h, e) || e.hp > e.maxHp * 0.5 || udist(h, e) > R) continue;
        const k = e.hp <= e.maxHp * 0.25 ? 3 : 1; if (k === 3) fr = true;
        if (Math.abs(angDiff(h.facing, angTo(h.x, h.z, e.x, e.z))) < 0.9) toward = Math.max(toward, k);
        if (e === tgt) addBuff(h, { id: 'huntas', dur: 0.5, as: (0.2 + 0.1 * lv) * k });
        if (drip && FX.near(e.x, e.z, 50)) {
          const m = new THREE.Mesh(FX.geo.flat, FX.mat('fill', 0x8a0a14, 0.75, false)), s = rand(0.5, 1.1) * (k === 3 ? 1.5 : 1); m.position.set(e.x + rand(-0.4, 0.4), 0.06 + Math.random() * 0.02, e.z + rand(-0.4, 0.4)); m.scale.set(s, 1, s * rand(0.7, 1.4)); m.rotation.y = rand(TAU); m.renderOrder = 3; FX.add(m, k === 3 ? 4.6 : 3.4, (q, me) => { me.material.opacity = 0.75 * (1 - q * q); });
          FX.burst(e.x, 1.1, e.z, { n: k === 3 ? 4 : 2, color: MEI.red, color2: MEI.rdeep, speed: [0.3, 1.2], life: [0.4, 0.7], size: [0.26, 0.05], grav: -9, rad: 0.3 }); if (Math.random() < (k === 3 ? 0.7 : 0.3)) FX.glow(e.x, e.height + 0.9, e.z, k === 3 ? 2.4 : 1.6, MEI.red, 0.3, 'star');
        }
      }
      if (toward && h.moving) addBuff(h, { id: 'huntrun', dur: 0.25, ms: (0.15 + 0.05 * lv) * toward });
      if (fr && !h.frz) {
        h.frz = FX.aura(h, MEI.red, 999, 1.9, 'swirl', 10); SFX.at('dark', h.x, h.z, 0.8); SFX.at('crit', h.x, h.z, 0.4); FX.ring(h.x, h.z, { r0: 0.5, r1: 5, color: MEI.red, life: 0.45, tex: 'shock' }); FX.glow(h.x, h.height - 0.3, h.z, 3.4, MEI.red, 0.4, 'flare'); FX.burst(h.x, 1, h.z, { n: 14, color: MEI.red, color2: MEI.rdeep, speed: [1, 4], life: [0.4, 0.8], size: [0.4, 0.05], up: 2, ring: true });
        if (FX.near(h.x, h.z, 45)) FX.text(h.x, h.height + 1.6, h.z, 'БЕШЕНСТВО', '#ff3344', 19); if (h === G.player) FX.punch(0.6);
      } else if (!fr && h.frz) { h.frz.dead = true; h.frz = null; }
      h.frenzy = fr;
      if ((fr || toward) && h.moving && Math.random() < dt * (fr ? 30 : 14) && FX.near(h.x, h.z, 45)) { FX.burst(h.x, 0.5, h.z, { n: 1, color: MEI.red, color2: MEI.rdeep, speed: [0.2, 0.8], life: [0.3, 0.6], size: [fr ? 0.6 : 0.4, 0.05], up: 1, rad: 0.4 }); if (fr) FX.sparks(h.x, 1.2, h.z, { n: 1, color: 0xffb0b8, color2: MEI.red, speed: [2, 6], life: [0.12, 0.25], dir: h.facing + Math.PI, spread: 0.5, w: 0.09, grav: 0 }); }
    },
    abilities: [
      {
        key: 'Q', name: 'Ледяной разрез', icon: 'meicut', cd: 6, cost: 35, range: 0, ind: { type: 'self', r: 4.8 }, anim: 'cut', animDur: 0.5, lock: 0.3, ai: { t: 'nova', r: 4.1, farm: true },
        desc: 'Кила распахивает ножницы и, крутанувшись, смыкает их: два ледяных лезвия сходятся перед ней, срезая всё в радиусе 4.8. Физический урон и замедление на 25% на 1.5 сек.',
        cast(h) {
          const dmg = D(h, 70, 11.5, 0.8), R = 4.8, f0 = h.facing, T = 0.26; h.snip0 = G.time; SFX.at('whoosh', h.x, h.z, 1); after(0.06, () => { if (h.alive) h.spinning = true; }); after(0.34, () => { h.spinning = false; });
          // two blades of ice as long as the reach, hinged on her: thrown wide open behind her, they swing round from both sides and shut in front like the shears in her hands
          if (FX.near(h.x, h.z, 55)) for (const s of [1, -1]) {
            const g = new THREE.Group(), bl = new THREE.Mesh(FX.geo.blade, FX.mat(null, MEI.c, 0.75)), ed = new THREE.Mesh(FX.geo.blade, FX.mat(null, 0xffffff, 0.9)), rib = FX.ribbon(s > 0 ? MEI.c : MEI.pale, 1.5, 16);
            bl.userData.own = ed.userData.own = true; bl.scale.set(0.75, 1, R / 2.2); bl.position.z = R / 2; ed.scale.set(0.16, 1.2, R / 2.3); ed.position.set(-s * 0.42, 0.02, R / 2); g.add(bl, ed);
            FX.add(g, T + 0.16, (k, me, dt, en) => {
              const q = Math.min(1, en.t / T), a = f0 + s * 2.75 * (1 - q * q * q), out = en.t > T ? (en.t - T) / 0.16 : 0; me.position.set(h.x, 1.25, h.z); me.rotation.y = a; me.rotation.z = s * 0.12 * (1 - q);
              bl.material.opacity = 0.75 * Math.min(1, en.t / 0.05) * (1 - out); ed.material.opacity = 0.9 * (1 - out); if (q < 1) rib.add(h.x + Math.sin(a) * R * 0.96, 1.25, h.z + Math.cos(a) * R * 0.96); else rib.end();
              if (Math.random() < dt * 40) FX.burst(h.x + Math.sin(a) * R * rand(0.4, 1), 1.2, h.z + Math.cos(a) * R * rand(0.4, 1), { n: 1, color: MEI.pale, color2: MEI.deep, speed: [0.2, 1.2], life: [0.3, 0.6], size: [0.34, 0.04], grav: -3 });
            });
          }
          after(T, () => {
            if (!h.alive) return; const x = h.x, z = h.z, sx = Math.sin(f0), cz = Math.cos(f0), cx = x + sx * R * 0.8, cq = z + cz * R * 0.8; SFX.at('slash', x, z, 1); SFX.at('ice', x, z, 0.8); SFX.at('crit', cx, cq, 0.5);
            for (const e of enemiesIn(h, x, z, R)) { damage(h, e, dmg, 0); slow(h, e, 0.25, 1.5, 'meichill'); FX.hit(e.x, 1.3, e.z, MEI.c, true); FX.debris(e.x, 1, e.z, { glow: true, n: 3, color: 0xcfefff, speed: [2, 6], up: 5, size: [0.14, 0.3], life: 0.6 }); rmpArc(e.x, e.z, f0 + 1.57, 2, 1.4, 0.2, MEI.pale, 1.3, false, 0.85); }
            // the snap: a flash where the points meet, a cross of light, splinters thrown on ahead, a ring of frost left on the ground
            FX.glow(cx, 1.3, cq, 4.5, MEI.pale, 0.16, 'star'); FX.glow(cx, 1.3, cq, 7, 0xffffff, 0.1, 'flare'); FX.beam(x, z, x + sx * (R + 1.5), z + cz * (R + 1.5), { color: MEI.pale, w: 0.5, life: 0.2, y: 1.25 });
            FX.sparks(cx, 1.3, cq, { n: 18, color: 0xffffff, color2: MEI.c, speed: [6, 18], life: [0.15, 0.4], dir: f0, spread: 0.7, w: 0.12 }); FX.debris(cx, 1, cq, { glow: true, n: 8, color: 0xcfefff, speed: [3, 9], up: 6, size: [0.16, 0.4], life: 0.7 });
            FX.ring(x, z, { r0: 1, r1: R, color: MEI.c, life: 0.35, tex: 'shock' }); FX.ring(x, z, { r0: R * 0.85, r1: R, color: 0xbfefff, tex: 'crack', life: 1.2, op: 0.7 }); meiIce(x, z, R * 0.6, 5); FX.shock(x, z, R, 0.7, 0.3); FX.shake(0.25);
          });
        }
      },
      {
        key: 'W', name: 'Нырок', icon: 'meidive', cd: 12, cost: 50, range: 8.5, ind: { type: 'circle', r: 3.6 }, anim: 'slam', animDur: 0.6, lock: 0, ai: { t: 'gap', rad: 3.6, escape: true },
        desc: 'Прыжок в точку. Приземлившись, Кила вбивает ножницы в землю: физический урон и обморожение — враги в радиусе 3.6 обездвижены на 1 сек, а земля ещё 3 сек замедляет их на 30%.',
        cast(h, p) {
          const dmg = D(h, 75, 12, 0.6), R = 3.6; SFX.at('dash', h.x, h.z, 0.9); FX.ring(h.x, h.z, { r1: 2.4, color: MEI.c, life: 0.3, tex: 'shock' }); telegraph(h, p.x, p.z, R, Math.max(0.15, p.dist / 30), MEI.c);
          dashTo(h, p.x, p.z, 30, { fly: true, arc: 3.4, ribbon: MEI.c, trail: u => { if (Math.random() < 0.6) FX.burst(u.x, 1 + (u.yOff || 0), u.z, { n: 1, color: MEI.pale, color2: MEI.deep, speed: [0.2, 1], life: [0.3, 0.6], size: [0.4, 0.05], rad: 0.4 }); },
            onEnd: u => {
              const x = u.x, z = u.z; for (const e of enemiesIn(u, x, z, R)) { damage(u, e, dmg, 0); root(u, e, 1, MEI.c); FX.hit(e.x, 1.3, e.z, MEI.c, true); FX.pillar(e.x, e.z, { r: 0.6, h: 4, color: MEI.pale, life: 0.9, op: 0.5, spin: 0 }); }
              SFX.at('boom', x, z, 0.7); SFX.at('shatter', x, z, 0.8); FX.shake(0.5); FX.explosion(x, z, 3, MEI.c, { el: 'ice', color2: MEI.deep }); FX.shock(x, z, R * 1.5, 0.9, 0.4);
              FX.zone(x, z, R, MEI.c, 3, { tex: 'rune', spin: 0.3, op: 0.5 }); const d = new THREE.Mesh(FX.geo.flat, FX.mat('fill', 0xbfe8ff, 0.22)); d.position.set(x, 0.07, z); d.scale.set(R * 2 * RK, 1, R * 2 * RK); FX.add(d, 3, (k, me) => { me.material.opacity = 0.22 * (1 - k); });
              zone(u, { x, z, r: R, dur: 3, every: 0.5, tick: () => { for (const e of enemiesIn(u, x, z, R)) slow(u, e, 0.3, 0.7, 'meifrost'); if (FX.near(x, z, 45)) FX.burst(x, 0.3, z, { n: 4, color: MEI.pale, color2: MEI.c, speed: [0.1, 0.5], life: [0.6, 1.1], size: [0.2, 0.03], up: 1.2, rad: R }); } });
            } });
        }
      },
      { key: 'E', name: 'Морозный клинок', icon: 'meiedge', passive: true, desc: 'Пассивно: лезвия ножниц покрыты инеем. Каждая атака наносит 15 / 24 / 33 / 42 магического урона сверху и замедляет цель на 9 / 12 / 15 / 18%; скорость атаки +4 / 8 / 12 / 16%.', stats: l => ({ onhit: 6 + 9 * l, slowHit: 0.06 + 0.03 * l, as: 0.04 * l }) },
      {
        key: 'R', name: 'Запах крови', icon: 'meiscent', cd: 60, cost: 80, range: 0, ind: { type: 'self', r: 6 }, animDur: 0.5, lock: 0.2, ai: { t: 'buff', ult: true },
        desc: 'Пассивно: Кила чует вражеских героев ниже 50% здоровья в 30 клетках — за ними тянется кровавый след. Когда она бежит в сторону такого врага, её скорость выше на 20 / 25 / 30%, а когда бьёт его — скорость атаки выше на 30 / 40 / 50%. Если у него меньше 25% здоровья, она впадает в бешенство, и оба бонуса утраиваются. Применение: на 10 сек нюх охватывает всю карту, а первая атака наносит на 60 / 90 / 120% силы атаки больше урона.',
        cast(h) {
          const lv = Math.max(1, h.al[3]); h.huntT = G.time + 10; h.atkCd = Math.min(h.atkCd, 0.1);
          addBuff(h, { id: 'hunt', dur: 10, onHit: (u, t, bf) => { if (bf.used) return 0; bf.used = true; FX.explosion(t.x, t.z, 2.2, MEI.red, { color2: MEI.rdeep, smoke: false, mark: false }); FX.slash(t.x, t.z, u.facing, { r: 3, sweep: 2.4, color: MEI.red, life: 0.26, y: 1.3 }); FX.slash(t.x, t.z, u.facing, { r: 2.7, sweep: 2.4, color: MEI.pale, life: 0.22, y: 1.4, flip: true }); FX.burst(t.x, 1.3, t.z, { n: 14, color: MEI.red, color2: MEI.rdeep, speed: [2, 7], life: [0.3, 0.7], size: [0.4, 0.05], grav: -10 }); SFX.at('crit', t.x, t.z, 0.9); FX.shake(0.45); if (u === G.player) FX.hitstop(0.07); if (FX.near(t.x, t.z, 45)) FX.text(t.x, t.height + 1.2, t.z, 'УКУС', '#ff5a66', 17); return u.ad * (0.3 + 0.3 * lv); } });
          SFX.at('dark', h.x, h.z, 0.8); SFX.at('dash', h.x, h.z, 0.6); FX.ring(h.x, h.z, { r0: 0.5, r1: 6, color: MEI.red, life: 0.5, tex: 'shock' }); FX.ring(h.x, h.z, { r0: 6, r1: 0.6, color: MEI.rdeep, life: 0.45, tex: 'ringThin' }); FX.glow(h.x, h.height - 0.3, h.z, 3, MEI.red, 0.4, 'flare'); FX.burst(h.x, 1, h.z, { n: 16, color: MEI.red, color2: MEI.rdeep, speed: [1, 4], life: [0.4, 0.8], size: [0.4, 0.05], up: 2, ring: true });
          if (FX.near(h.x, h.z, 45)) FX.text(h.x, h.height + 1.6, h.z, 'ЗАПАХ КРОВИ', '#ff5a66', 18);
          for (const e of G.heroes) if (e.alive && hostile(h, e) && e.hp <= e.maxHp * 0.5 && FX.near(e.x, e.z, 50)) FX.pillar(e.x, e.z, { r: 0.5, h: 9, color: MEI.red, life: 0.8, op: 0.5 });
        }
      }
    ]
  }
);

/* ===== roster, part 14: Kagari (threads on her enemies, a blade with a saw ring), Lin (jade orbs: a wall, a slowing field, a healing orb, the fallen called back), Kwame the coach (everything he does makes his allies hit harder) ===== */
const KAG = { c: 0xff2f5e, pale: 0xffc2d0, deep: 0x5a0a22, dk: 0x16060c };
// the thread: a mark that cuts the target's defence for everyone; while it holds, a red line runs from her to a marked hero
function kagMark(h, e, dur) {
  if (!e.alive || e.struct) return; const b = addBuff(e, { id: 'snare' + h.id, dur: dur || 8, def: -(5 + 1.3 * h.level), src: h }); if (!b || (e.kind !== 'hero' && !e.boss)) return;
  const m = new THREE.Mesh(FX.geo.line, FX.mat('beam', KAG.c, 0.5));
  b.fx = FX.add(m, b.dur + 0.1, (k, me, dt, en) => { const d = dist(h.x, h.z, e.x, e.z), vis = h.alive && e.alive && d < 16; me.visible = vis; if (!vis) return; me.position.set(h.x, 1.15 + (h.yOff || 0), h.z); me.rotation.y = angTo(h.x, h.z, e.x, e.z); me.scale.set(0.14 + Math.sin(en.t * 9) * 0.03, 1, d); me.material.opacity = 0.5 * Math.min(1, b.dur / 0.4); });
}
// teeth of the saw: 100 of them turn the first ability into the Serrated Loop
function kagSaw(h, n) {
  if (h.sawT > G.time) return; const was = h.saw || 0; h.saw = Math.min(100, was + n * (h.convT > G.time ? 2 : 1));
  if (was < 100 && h.saw >= 100) { SFX.at('cue', h.x, h.z, 0.7); FX.ring(h.x, h.z, { r0: 2.6, r1: 0.5, color: KAG.c, life: 0.35, tex: 'ringThin' }); if (h === G.player) FX.text(h.x, h.height + 1.2, h.z, 'ПИЛА ГОТОВА', '#ff8aa4', 15); }
}
function kagThreads(x, y, z, n, r) { if (!FX.near(x, z, 55)) return; for (let i = 0; i < n; i++) { const a = rand(TAU), d = rand(r * 0.5, r); FX.bolt(x, y, z, x + Math.sin(a) * d, rand(0.2, 2.2), z + Math.cos(a) * d, { color: KAG.c, w: 0.16, jag: 0.25, life: 0.2, fork: false }); } }
// the last stroke of the saw: one overhead blow in front of her, shields for the allies around; the saw is spent and the first ability starts its cooldown
function kagErad(h) {
  const E = h.sawE; if (!E) return; h.sawT = 0; h.saw = 0; h.sawE = null; for (const b of h.buffs) if (b.id === 'sawmode') { b.onEnd = null; b.dead = true; }
  h.cd[0] = h.def.abilities[0].cd * 100 / (100 + h.haste); if (!h.alive) return;
  const k = h.convT > G.time ? 1.4 : 1, f = h.facing, cx = h.x + Math.sin(f) * 2.4, cz = h.z + Math.cos(f) * 2.4, R = 4.4;
  h.anim.castT = h.anim.castDur = 0.5; h.anim.castType = 'slam'; h.anim.atkT = 0; h.castLock = Math.max(h.castLock, 0.3); h.windup = 0; SFX.at('whoosh', h.x, h.z, 1);
  after(0.22, () => {
    if (!h.alive) return;
    for (const e of enemiesIn(h, cx, cz, R)) { damage(h, e, E.dmg * k, 0); kagMark(h, e, 8); slow(h, e, 0.35, 1.5, 'kagslow'); FX.hit(e.x, 1.3, e.z, KAG.c, true); }
    for (const a of alliesIn(h, h.x, h.z, 7.5, true)) { shield(h, a, E.sh * k, 5, KAG.c); if (a !== h) FX.beam(h.x, h.z, a.x, a.z, { color: KAG.pale, w: 0.2, life: 0.3, y: 1.3 }); }
    SFX.at('bigboom', cx, cz, 0.8); SFX.at('heavy', cx, cz, 0.9); FX.shake(0.7); FX.punch(0.7);
    FX.explosion(cx, cz, 2.5, KAG.c, { color2: KAG.deep, el: 'shadow' }); FX.shock(cx, cz, R * 1.5, 1.1, 0.45); FX.ring(cx, cz, { r0: 0.5, r1: R, color: KAG.c, life: 0.4, tex: 'shock' }); FX.ring(cx, cz, { r0: R * 0.8, r1: R, color: KAG.c, tex: 'crack', life: 1.4, op: 0.7 });
    FX.slash(h.x, h.z, f, { r: R + 1.5, sweep: 0.9, color: KAG.c, life: 0.28, y: 1.4 }); FX.pillar(cx, cz, { r: 1.1, h: 12, color: KAG.c, life: 0.5, op: 0.5 }); kagThreads(cx, 1.2, cz, 8, R);
    FX.debris(cx, 0.3, cz, { n: 9, color: 0x3c3238, speed: [3, 9], up: 9, size: [0.16, 0.45] }); if (FX.near(cx, cz, 45)) FX.text(cx, 3.6, cz, 'ИСКОРЕНЕНИЕ', '#ff8aa4', 18);
  });
}

const LIN = { c: 0x5fe8c8, pale: 0xd8fff2, deep: 0x0e5a4c, dk: 0x062a26 };
let _linWall = null;
function linWallGeo() {
  if (_linWall) return _linWall; const P = [], HS = [3.0, 3.7, 3.2, 4.0, 3.3, 3.8, 2.9];
  for (let i = 0; i < 7; i++) {
    const x = (i / 6 - 0.5) * 7.5, hh = HS[i], zz = i % 2 ? 0.2 : -0.2;
    P.push({ g: new THREE.CylinderGeometry(0.42, 0.86, hh, 6), m: TRS(x, hh / 2, zz, 0, i * 0.7, (i - 3) * 0.035), c: i % 2 ? 0x43bfa6 : 0x2c9a86 });
    P.push({ g: new THREE.ConeGeometry(0.42, 0.7, 6), m: TRS(x + (i - 3) * 0.035 * hh * -0.5, hh + 0.33, zz, 0, i * 0.7, (i - 3) * 0.035), c: 0x8fe0cf });
    P.push({ g: new THREE.ConeGeometry(0.3, 1.5, 5), m: TRS(x + 0.5, 0.6, -zz * 3, 0.5 * (i % 2 ? 1 : -1), i, 0.3), c: 0x24806f });
  }
  return (_linWall = mergeParts(P));
}
// after a wall falls its cells are given back to the map; whatever else still stands there (another wall, a tower) is blocked again
function linReblock() { for (const w of G.walls) for (const c of w.pts) NAV.block(c.x, c.z, 1.1, true); for (const u of G.units) if (u.struct && u.alive && u.blockR) NAV.block(u.x, u.z, u.blockR, true); }
// a wall of jade across the line of the cast: it blocks the way for everyone, throws clear whoever stood where it rose, and breaks when its time is up
function linWall(h, x, z, dir, dur, dmg) {
  const LEN = 7.5, N = 7, px = Math.cos(dir), pz = -Math.sin(dir), fx = Math.sin(dir), fz = Math.cos(dir), W = { pts: [], until: G.time + dur };
  for (let i = 0; i < N; i++) { const o = (i / (N - 1) - 0.5) * LEN; W.pts.push({ x: x + px * o, z: z + pz * o }); }
  (G.walls || (G.walls = [])).push(W); for (const c of W.pts) NAV.block(c.x, c.z, 1.1, true);
  for (const u of G.units) {
    if (!u.alive || u.struct || dist(u.x, u.z, x, z) > 45) continue;
    if (!NAV.ok(u.x, u.z) && !u.boss) {
      const s = ((u.x - x) * fx + (u.z - z) * fz) >= 0 ? 1 : -1; let q = { x: u.x + fx * s * 2.4, z: u.z + fz * s * 2.4 }; if (!NAV.ok(q.x, q.z)) q = NAV.nearest(u.x, u.z);
      u.x = q.x; u.z = q.z; u.dash = null; if (hostile(h, u)) { damage(h, u, dmg, 1); slow(h, u, 0.3, 1.5, 'linslow'); FX.hit(u.x, 1.3, u.z, LIN.c, true); }
    }
    if (u.kind === 'hero') { if (u.path && u.path.length) { const L = u.path[u.path.length - 1]; setMove(u, L.x, L.z); } } else u.path = null;
  }
  const grp = new THREE.Group(), cr = new THREE.Mesh(linWallGeo(), new THREE.MeshPhongMaterial({ vertexColors: true, flatShading: true, transparent: true, opacity: 0.9, emissive: 0x072a24, shininess: 70, specular: 0x55998a })), gl = new THREE.Mesh(FX.geo.flat, FX.mat('glow', LIN.deep, 0.5));
  cr.userData.own = gl.userData.own = true; gl.scale.set(LEN + 3.5, 1, 5); gl.position.y = 0.1; grp.add(gl, cr); grp.position.set(x, 0, z); grp.rotation.y = dir; grp.renderOrder = 2;
  FX.add(grp, dur + 0.35, (k, me, dt, en) => { const up = Math.min(1, en.t / 0.22), dn = en.t > dur ? (en.t - dur) / 0.35 : 0; cr.scale.y = Math.max(0.01, (up < 1 ? easeOut(up) * 1.1 : 1 + 0.1 * Math.max(0, 1 - (en.t - 0.22) / 0.15)) * (1 - dn)); cr.material.opacity = 0.88 * (1 - dn * 0.5); gl.material.opacity = 0.5 * up * (1 - dn) * (0.8 + 0.2 * Math.sin(en.t * 4)); });
  SFX.at('ice', x, z, 1); SFX.at('rubble', x, z, 0.6); FX.shake(0.3); FX.shock(x, z, 6, 0.7, 0.35);
  for (const c of W.pts) { FX.debris(c.x, 0.3, c.z, { glow: true, n: 2, color: 0xbff5e6, speed: [2, 6], up: 7, size: [0.14, 0.34], life: 0.7 }); FX.burst(c.x, 0.4, c.z, { n: 4, color: LIN.pale, color2: LIN.deep, speed: [0.5, 2.5], life: [0.4, 0.9], size: [0.4, 0.05], up: 3, rad: 0.6 }); }
  let acc = 0;
  G.actors.push({ update(dt) {
    if (G.time < W.until) { acc += dt; if (acc > 0.25) { acc = 0; if (FX.near(x, z, 50)) { const c = W.pts[(Math.random() * N) | 0]; FX.sparks(c.x, rand(0.5, 3), c.z, { n: 1, color: LIN.pale, color2: LIN.c, speed: [0.2, 1], life: [0.4, 0.8], up: 2, grav: -1, w: 0.07, stretch: 0.05 }); } } return true; }
    const i = G.walls.indexOf(W); if (i >= 0) G.walls.splice(i, 1); for (const c of W.pts) NAV.block(c.x, c.z, 1.1, false); linReblock();
    SFX.at('shatter', x, z, 0.9); for (const c of W.pts) { FX.debris(c.x, 1.4, c.z, { glow: true, n: 4, color: 0xbff5e6, speed: [2, 7], up: 6, size: [0.16, 0.42], life: 0.8 }); FX.burst(c.x, 1.5, c.z, { n: 5, color: LIN.pale, color2: LIN.deep, speed: [0.5, 3], life: [0.4, 0.9], size: [0.5, 0.05], up: 1, rad: 0.7 }); }
    return false;
  } });
  return W;
}
function linMotes(x, y, z, n, r) { if (FX.near(x, z, 50)) FX.burst(x, y, z, { n, color: LIN.pale, color2: LIN.c, speed: [0.1, 0.6], life: [0.6, 1.1], size: [0.3, 0.04], up: 2.4, rad: r || 0.7 }); }

const KWA = { c: 0xffb52e, pale: 0xfff0c0, deep: 0x7a4a08, red: 0xff5a2a };
// "up!": streaks of gold rising round a unit
function kwaUp(u, n) { if (!FX.near(u.x, u.z, 50)) return; FX.sparks(u.x, 0.4 + (u.yOff || 0), u.z, { n, color: KWA.pale, color2: KWA.c, speed: [0.3, 1.2], life: [0.35, 0.7], up: 9, grav: -1, drag: 1, rad: u.radius + 0.3, ring: true, w: 0.1, stretch: 0.07 }); }

HEROES.push(
  /* ================= 39. Kagari ================= */
  {
    id: 'kagari', name: 'Кагари', title: 'Распускающая нити', role: 'front', roleName: 'Боец', build: 'bruiser', bars: [4, 3, 3, 3], diffc: 3,
    lore: 'Староста, которая привыкла, что любую задачу можно распустить на нити и собрать заново — аккуратнее. Врагов она тоже сначала размечает: на каждом повисает алая нить, по которой удар приходит точнее. А когда разметка закончена, в её клинке просыпается пила.',
    look: { bulk: 0.86, h: 1.0, c1: 0x15141b, c2: 0x1b1a23, c3: 0x2c2a36, skin: 0xf0dccf, hands: 0xf0dccf, metal: 0xb8c0cc, glow: 0xff2f5e, head: 'seamstress', hair: 0x0e0c12, tie: 0xd0182a, chest: 'sailor', sh: 'none', legs: 'thigh', weapon: 'sawblade', wc: 'melee' },
    stats: ST(600, 86, 300, 32, 60, 3.5, 25, 2.8, 0.8, 9.1, 2.7),
    innate: { name: 'Зубья пилы', icon: 'kaginn', count: h => h.sawT > G.time ? Math.ceil(h.sawT - G.time) + 'с' : (h.saw ? Math.round(h.saw) : ''), desc: 'Умения Кагари вешают на врагов «нить» на 8 сек: защита цели ниже (5 + 1.3 за уровень героя) для всех, кто её бьёт. Атаки и попадания умений копят зубья пилы; когда их 100, первое умение превращается в «Зубчатую петлю».' },
    tick(h) { if (h.sawE && !hasBuff(h, 'sawmode')) { h.sawE = null; h.sawT = 0; h.saw = 0; } },
    onDeal(h, t, d, o) {
      if (!o.basic) return; kagSaw(h, t.kind === 'hero' ? 14 : 6);
      if (h.sawT > G.time && h.sawE) {   // the saw mode: every attack grinds through everything round the target
        const sp = (8 + 2.4 * h.level + 0.2 * h.ad) * (h.convT > G.time ? 1.4 : 1); for (const e of enemiesIn(h, t.x, t.z, 2.8)) damage(h, e, e === t ? sp * 0.6 : sp, 1, { dot: true });
        if (FX.near(t.x, t.z, 50)) { FX.sparks(t.x, 1.3, t.z, { n: 9, color: 0xffffff, color2: KAG.c, speed: [4, 13], life: [0.12, 0.3], w: 0.1 }); FX.ring(t.x, t.z, { r0: 0.4, r1: 2.8, color: KAG.c, life: 0.22, tex: 'ringThin', y: 1.2 }); } SFX.at('sizzle', t.x, t.z, 0.35);
      }
    },
    abilities: [
      {
        key: 'Q', name: 'Око распутывания', icon: 'kagneedle', cd: 7, cost: 40, range: 9, ind: { type: 'line', w: 1.8, fixed: true }, anim: 'thrust', animDur: 0.4, lock: 0.2, ai: { t: 'saw', farm: true }, free: h => h.sawT > G.time,
        desc: 'Выпад нитью-иглой на 9 сквозь всех: физический урон, замедление на 25% на 1.5 сек и «нить». Со 100 зубьями умение становится «Зубчатой петлёй»: Кагари дёргает к себе всех, кто на нити (до 11 клеток), раскручивает пилу — урон в радиусе 4.6 — и на 6.5 сек входит в режим пилы: +50% скорости атаки, +12% скорости передвижения, каждая атака бьёт магическим уроном по области. Повторное нажатие (или конец режима) — «Искоренение»: удар сверху перед собой и щиты ей и союзным героям в радиусе 7.5.',
        cast(h, p) {
          if (h.sawT > G.time) { after(0.001, () => kagErad(h)); return { cd: this.cd * 100 / (100 + h.haste) }; }
          const dir = p.dir, sx = Math.sin(dir), cz = Math.cos(dir);
          if ((h.saw || 0) >= 100) {   // the Serrated Loop
            const dmg = D(h, 95, 17, 0.9), R = 4.6, DUR = 6.85; h.sawE = { dmg: D(h, 120, 22, 1.1), sh: D(h, 45, 10, 0.35) }; h.sawT = G.time + DUR;
            for (const e of G.units) if (e.alive && !e.struct && hostile(h, e) && udist(h, e) < 11 && hasBuff(e, 'snare' + h.id)) { pullTo(e, h.x, h.z, 30, 2.3); FX.beam(h.x, h.z, e.x, e.z, { color: KAG.c, w: 0.3, life: 0.25, y: 1.2 }); }
            SFX.at('whoosh', h.x, h.z, 1); SFX.at('overload', h.x, h.z, 0.6); after(0.1, () => { if (h.alive) h.spinning = true; }); after(0.5, () => { h.spinning = false; });
            addBuff(h, { id: 'sawmode', dur: DUR, as: 0.5, ms: 0.12, every: 0.12, onTick: u => { if (FX.near(u.x, u.z, 45)) FX.sparks(u.x + Math.sin(u.facing) * 1.2, 1.3, u.z + Math.cos(u.facing) * 1.2, { n: 2, color: 0xffd0d8, color2: KAG.c, speed: [2, 7], life: [0.1, 0.25], dir: u.facing + 2.4, spread: 0.8, w: 0.07 }); }, onEnd: u => kagErad(u) });
            after(0.3, () => {
              if (!h.alive) return; const x = h.x, z = h.z;
              for (const e of enemiesIn(h, x, z, R)) { damage(h, e, dmg, 0); kagMark(h, e, 8); FX.hit(e.x, 1.3, e.z, KAG.c, true); rmpArc(e.x, e.z, h.facing + 1.57, 2, 1.4, 0.2, KAG.c, 1.3, false, 0.85); }
              SFX.at('slash', x, z, 1); SFX.at('heavy', x, z, 0.7); FX.shake(0.5);
              FX.slash(x, z, h.facing, { r: R, sweep: 5.5, color: KAG.c, life: 0.3, y: 1.3 }); FX.slash(x, z, h.facing + 3.1, { r: R * 0.8, sweep: 5.5, color: KAG.deep, life: 0.34, y: 1.2, flip: true });
              FX.ring(x, z, { r0: 1, r1: R, color: KAG.c, life: 0.35, tex: 'shock' }); FX.shock(x, z, R * 1.3, 0.9, 0.35); kagThreads(x, 1.3, z, 6, R); if (FX.near(x, z, 45)) FX.text(x, h.height + 1.5, z, 'РЕЖИМ ПИЛЫ', '#ff8aa4', 18);
            });
            return { cd: 1.2 };
          }
          const dmg = D(h, 70, 12, 0.7); SFX.at('slash', h.x, h.z, 0.8); SFX.at('shoot', h.x, h.z, 0.4);
          shot(h, {
            dir, speed: 46, range: 9, w: 0.9, color: KAG.c, size: 0.8, mesh: 'bolt', y: 1.3, ribbon: 0.7, pierce: true, trail: q => FX.trail(q.x, q.y, q.z, KAG.c, 0.4, 1),
            onHit: e => { damage(h, e, dmg, 0); slow(h, e, 0.25, 1.5, 'kagslow'); kagMark(h, e, 8); kagSaw(h, e.kind === 'hero' ? 12 : 4); FX.hit(e.x, 1.3, e.z, KAG.c, e.kind === 'hero'); rmpArc(e.x, e.z, dir + 1.57, 1.6, 1.2, 0.18, KAG.c, 1.3, false, 0.8); },
            onEnd: (x, z) => FX.ring(x, z, { r0: 0.2, r1: 1.4, color: KAG.c, life: 0.25, tex: 'ringThin', y: 1.2 })
          });
          FX.beam(h.x + sx, h.z + cz, h.x + sx * 9, h.z + cz * 9, { color: KAG.c, w: 0.12, life: 0.4, y: 1.3, op: 0.7 });
        }
      },
      {
        key: 'W', name: 'Последний стежок', icon: 'kagsnip', cd: 11, cost: 55, range: 8.5, ind: { type: 'circle', r: 3.2 }, anim: 'toss', animDur: 0.5, lock: 0.25, ai: { t: 'point', rad: 3.2, delay: 0.35 },
        desc: 'Бросает в точку призрачные ножницы: физический урон и «нить» всем в радиусе 3.2. Через 0.5 сек ножницы смыкаются — ещё урон, — а сама Кагари и союзные герои в радиусе 7 от неё лечатся: стежок затягивает раны.',
        cast(h, p) {
          const x = p.x, z = p.z, R = 3.2, d1 = D(h, 55, 9.5, 0.5), d2 = D(h, 45, 8, 0.4), hl = D(h, 34, 6.5, 0.25), T = Math.max(0.18, p.dist / 34), x0 = h.x, z0 = h.z, f0 = p.dir;
          telegraph(h, x, z, R, T + 0.5, KAG.c); SFX.at('whoosh', x0, z0, 0.9);
          if (FX.near(x, z, 55)) {   // two spectral blades spin to the spot, hang open over it, then snap shut
            const g = new THREE.Group(), B = [1, -1].map(s => { const bl = new THREE.Mesh(FX.geo.blade, FX.mat(null, KAG.c, 0.8)), ed = new THREE.Mesh(FX.geo.blade, FX.mat(null, 0xffffff, 0.9)), pv = new THREE.Group(); bl.userData.own = ed.userData.own = true; bl.scale.set(0.6, 1, R / 2.3); bl.position.z = R * 0.45; ed.scale.set(0.12, 1.2, R / 2.4); ed.position.set(-s * 0.3, 0.02, R * 0.45); pv.add(bl, ed); g.add(pv); return { pv, bl, ed, s }; });
            FX.add(g, T + 0.66, (k, me, dt, en) => {
              const fl = Math.min(1, en.t / T), hv = en.t - T, open = hv < 0 ? 0.5 : (hv < 0.42 ? 0.5 + 0.55 * easeOut(Math.min(1, hv / 0.2)) : 1.05 * Math.max(0, 1 - (hv - 0.42) / 0.08)), out = hv > 0.5 ? (hv - 0.5) / 0.16 : 0;
              me.position.set(lerp(x0, x, fl) - Math.sin(f0) * R * 0.45 * fl, 1.4 + Math.sin(Math.PI * fl) * 1.6, lerp(z0, z, fl) - Math.cos(f0) * R * 0.45 * fl); me.rotation.y = f0 + (1 - fl) * 14;
              for (const q of B) { q.pv.rotation.y = q.s * open; q.bl.material.opacity = 0.8 * (1 - out); q.ed.material.opacity = 0.9 * (1 - out); }
            });
          }
          after(T, () => { for (const e of enemiesIn(h, x, z, R)) { damage(h, e, d1, 0); kagMark(h, e, 8); kagSaw(h, e.kind === 'hero' ? 10 : 3); FX.hit(e.x, 1.3, e.z, KAG.c, true); } SFX.at('hit', x, z, 0.8); FX.ring(x, z, { r0: 0.4, r1: R, color: KAG.c, life: 0.3, tex: 'shock' }); kagThreads(x, 1.3, z, 4, R); });
          after(T + 0.5, () => {
            for (const e of enemiesIn(h, x, z, R)) { damage(h, e, d2, 0); FX.hit(e.x, 1.3, e.z, KAG.c, true); rmpArc(e.x, e.z, f0 + 1.57, 2, 1.4, 0.2, KAG.pale, 1.3, false, 0.85); }
            SFX.at('slash', x, z, 1); SFX.at('crit', x, z, 0.4); FX.glow(x, 1.4, z, 4, KAG.pale, 0.16, 'star'); FX.sparks(x, 1.4, z, { n: 14, color: 0xffffff, color2: KAG.c, speed: [5, 15], life: [0.15, 0.35], w: 0.1 }); FX.shock(x, z, R, 0.5, 0.3);
            if (h.alive) for (const a of alliesIn(h, h.x, h.z, 7, true)) { if (a.hp < a.maxHp) { heal(h, a, hl); FX.heal(a, KAG.pale); } if (a !== h && FX.near(a.x, a.z, 50)) FX.beam(h.x, h.z, a.x, a.z, { color: KAG.pale, w: 0.14, life: 0.3, y: 1.3, op: 0.7 }); }
          });
        }
      },
      {
        key: 'E', name: 'По нити', icon: 'kagdash', cd: 12, cost: 45, range: 7.5, ind: { type: 'line', w: 2 }, lock: 0, ai: { t: 'gap', escape: true },
        desc: 'Рывок на 7.5 по натянутой нити: физический урон и «нить» всем, сквозь кого она прошла. Первая атака после рывка наносится без задержки.',
        cast(h, p) {
          const dmg = D(h, 55, 9, 0.5), x0 = h.x, z0 = h.z; SFX.at('dash', h.x, h.z, 0.9); FX.ring(h.x, h.z, { r1: 2.2, color: KAG.c, life: 0.25, tex: 'shock' });
          dashTo(h, p.x, p.z, 36, { ribbon: KAG.c, w: 1.4, trail: u => { if (Math.random() < 0.5) FX.burst(u.x, 1.1, u.z, { n: 1, color: KAG.pale, color2: KAG.deep, speed: [0.2, 1], life: [0.25, 0.5], size: [0.35, 0.04], rad: 0.4 }); },
            onHit: e => { damage(h, e, dmg, 0); kagMark(h, e, 8); kagSaw(h, e.kind === 'hero' ? 10 : 3); FX.hit(e.x, 1.3, e.z, KAG.c, true); rmpArc(e.x, e.z, h.facing + 1.57, 1.8, 1.3, 0.18, KAG.c, 1.3, false, 0.85); },
            onEnd: u => { u.atkCd = 0; FX.beam(x0, z0, u.x, u.z, { color: KAG.c, w: 0.14, life: 0.5, y: 1.2, op: 0.8 }); FX.ring(u.x, u.z, { r0: 0.3, r1: 1.8, color: KAG.c, life: 0.25, tex: 'ringThin' }); } });
        }
      },
      {
        key: 'R', name: 'Миг небытия', icon: 'kagnihil', cd: 85, cost: 100, range: 0, ind: { type: 'self', r: 6.5 }, anim: 'atom', animDur: 0.6, lock: 0.6, ai: { t: 'nova', r: 5.5, ult: true, hp: 0.6, rad: 6.5 },
        desc: 'Кагари вскидывает клинок, и через 0.55 сек все нити вокруг рвутся разом: большой физический урон врагам в радиусе 6.5, замедление на 40% на 2 сек и «нить» на каждом; сама она и союзные герои в радиусе лечатся. Зубья +40, и на 12 сек «Схождение»: зубья копятся вдвое быстрее, а режим пилы и «Искоренение» сильнее на 40%.',
        cast(h) {
          const T = 0.55, R = 6.5, dmg = D(h, 130, 26, 0.9), hl = D(h, 70, 16, 0.4); h.order = null; h.path = null;
          telegraph(h, h.x, h.z, R, T, KAG.c); SFX.at('dark', h.x, h.z, 1); FX.pillar(h.x, h.z, { r: 1.2, h: 14, color: KAG.c, life: T, op: 0.45, grow: true }); FX.zone(h.x, h.z, R, KAG.c, T, { tex: 'swirl', spin: -6, op: 0.5 });
          for (let i = 0; i < 4; i++) after(i * 0.12, () => { if (h.alive) { FX.implode(h.x, 1.6, h.z, 6 - i, { n: 9, color: KAG.c, color2: 0xffffff, life: 0.22, streak: true }); kagThreads(h.x, 2.6, h.z, 3, R); } });
          after(T, () => {
            if (!h.alive) return; const x = h.x, z = h.z;
            for (const e of enemiesIn(h, x, z, R)) { damage(h, e, dmg, 0); slow(h, e, 0.4, 2, 'kagslow'); kagMark(h, e, 8); FX.hit(e.x, 1.3, e.z, KAG.c, true); if (FX.near(e.x, e.z, 50)) FX.bolt(x, 2.2, z, e.x, 1.3, e.z, { color: KAG.c, w: 0.3, jag: 0.3, life: 0.3, fork: false }); }
            for (const a of alliesIn(h, x, z, R, true)) { heal(h, a, hl); FX.heal(a, KAG.pale); }
            kagSaw(h, h.convT > G.time ? 20 : 40); h.convT = G.time + 12; const b = addBuff(h, { id: 'conv', dur: 12 }); if (b) b.fx = FX.aura(h, KAG.c, 12, 1.9, 'swirl', 5);
            SFX.at('bigboom', x, z, 1); SFX.at('shatter', x, z, 0.7); FX.shake(0.9); FX.punch(0.9); FX.light(x, 3, z, KAG.c, 2, 28, 0.5);
            FX.explosion(x, z, 2.5, KAG.c, { el: 'shadow', color2: KAG.deep }); FX.shock(x, z, R * 1.6, 1.3, 0.5); FX.pillar(x, z, { r: 1.6, h: 22, color: KAG.c, life: 0.7, op: 0.5 });
            for (let i = 0; i < 3; i++) after(i * 0.07, () => FX.ring(x, z, { r0: 0.6 + i, r1: R + i * 0.8, color: i % 2 ? KAG.pale : KAG.c, life: 0.45, tex: i ? 'ringThin' : 'shock' }));
            FX.ring(x, z, { r0: R * 0.8, r1: R * 0.95, color: KAG.c, life: 2, tex: 'crack', op: 0.7 }); kagThreads(x, 1.6, z, 10, R);
            if (FX.near(x, z, 45)) FX.text(x, h.height + 2.4, z, 'МИГ НЕБЫТИЯ', '#ff8aa4', 19);
          });
        }
      }
    ]
  },
  /* ================= 40. Lin ================= */
  {
    id: 'lin', name: 'Лин', title: 'Нефритовая целительница', role: 'support', roleName: 'Поддержка', build: 'support', bars: [2, 2, 5, 2], diffc: 2, projMesh: 'orb', atkSfx: 'shoot',
    lore: 'Она не повышает голоса и не торопится — вокруг неё всегда находится место, где можно перевести дух. Нефритовые сферы в её руках лечат, вяжут землю льдом и встают стеной поперёк дороги. А тех, кого не успела уберечь, Лин просто зовёт обратно.',
    look: { bulk: 0.86, h: 1.02, c1: 0xe6efe9, c2: 0x2f6a72, c3: 0x1f3a52, skin: 0xf0d9c4, hands: 0xf0d9c4, metal: 0xd9c98a, glow: 0x5fe8c8, head: 'jadesage', hair: 0x14141a, coat: 0xdfeae4, chest: 'jade', sh: 'cloth', legs: 'boots', weapon: 'orb', wc: 'orb', orbit: 2, orbitShape: 'orb' },
    stats: ST(545, 78, 460, 50, 46, 2.4, 19, 2.3, 0.72, 8.9, 9.5),
    innate: { name: 'Тихая вода', icon: 'lininn', desc: 'Каждая атака Лин по врагу лечит самого раненого союзного героя в радиусе 9 (или её саму) на 6 + 1.6 за уровень героя + 10% силы умений.' },
    tick(h, dt) {
      if (h.linCh > G.time && h.stunned) h.linOk = false;
      if (!h.al[3]) return; h.linA = (h.linA || 0) + dt; if (h.linA < 0.3) return; h.linA = 0;
      // the fallen she can still call back: a jade wisp over each
      for (const o of G.heroes) if (o.dead && o.team === h.team && o.respawnT > 1.8 && FX.near(o.x, o.z, 50)) { linMotes(o.x, 0.4, o.z, 2, 0.9); if (Math.random() < 0.34) FX.ring(o.x, o.z, { r0: 2.2, r1: 0.4, color: LIN.c, life: 0.6, tex: 'ringThin', op: 0.7 }); if (Math.random() < 0.3) FX.glow(o.x, 1.6, o.z, 1.8, LIN.c, 0.5, 'star'); }
    },
    onDeal(h, t, d, o) {
      if (!o.basic) return; let a = null; for (const u of G.heroes) if (u.alive && u.team === h.team && u.hp < u.maxHp && udist(h, u) < 9 && (!a || u.hp / u.maxHp < a.hp / a.maxHp)) a = u;
      if (a) { heal(h, a, 6 + 1.6 * h.level + 0.1 * h.ap, true); linMotes(a.x, 1.1, a.z, 2); }
    },
    abilities: [
      {
        key: 'Q', name: 'Нефритовая стена', icon: 'linwall', cd: 16, cost: 60, range: 9, ind: { type: 'wall', len: 7.5 }, anim: 'slam', animDur: 0.5, lock: 0.2, ai: { t: 'wall' },
        desc: 'Поднимает из земли стену нефрита длиной 7.5 поперёк направления на 4 / 4.5 / 5 / 5.5 сек. Пройти сквозь неё не может никто — ни враги, ни свои, ни миньоны. Тех, кто стоял на её месте, отбрасывает; враги при этом получают магический урон и замедление на 30% на 1.5 сек.',
        cast(h, p) { const lv = Math.max(1, h.al[0]); telegraph(h, p.x, p.z, 1.6, 0.18, LIN.c); SFX.at('cast', h.x, h.z, 0.8); const dmg = D(h, 50, 9, 0, 0.4), dir = p.dir, x = p.x, z = p.z; after(0.18, () => linWall(h, x, z, dir, 3.5 + 0.5 * lv, dmg)); }
      },
      {
        key: 'W', name: 'Вяжущая сфера', icon: 'linslow', cd: 12, cost: 55, range: 11, ind: { type: 'circle', r: 4.5 }, lock: 0.2, ai: { t: 'point', rad: 4.5, delay: 0.4, trap: true },
        desc: 'Бросает сферу, которая разбивается о землю и на 5 сек покрывает её нефритовой коркой в радиусе 4.5: враги внутри замедлены на 50% и получают магический урон дважды в секунду.',
        cast(h, p) {
          const x = p.x, z = p.z, R = 4.5, T = Math.max(0.25, p.dist / 26), tick = D(h, 10, 1.8, 0, 0.07), x0 = h.x, z0 = h.z; SFX.at('cast', x0, z0, 0.8); telegraph(h, x, z, R, T, LIN.c);
          if (FX.near(x, z, 60)) { const m = FX.projMesh('orb', LIN.c, 1.1), rib = FX.ribbon(LIN.c, 0.9, 12); FX.add(m, T, (k, me) => { me.position.set(lerp(x0, x, k), 1.5 + Math.sin(Math.PI * k) * 3.2, lerp(z0, z, k)); rib.add(me.position.x, me.position.y, me.position.z); if (k > 0.95) rib.end(); }); }
          after(T, () => {
            SFX.at('ice', x, z, 1); SFX.at('shatter', x, z, 0.5); FX.shock(x, z, R, 0.6, 0.35); FX.ring(x, z, { r0: 0.5, r1: R, color: LIN.c, life: 0.4, tex: 'shock' }); FX.debris(x, 0.4, z, { glow: true, n: 8, color: 0xbff5e6, speed: [2, 7], up: 6, size: [0.14, 0.34], life: 0.7 });
            const d = new THREE.Mesh(FX.geo.flat, FX.mat('fill', 0x0b3a34, 0.5, false)); d.position.set(x, 0.07, z); d.scale.set(R * 2 * RK, 1, R * 2 * RK); d.renderOrder = 3; FX.add(d, 5, (k, me, dt, e) => { me.material.opacity = 0.5 * Math.min(1, e.t / 0.25, (5 - e.t) / 0.5); });
            FX.zone(x, z, R, LIN.c, 5, { tex: 'crack', spin: 0, op: 0.9 }); FX.zone(x, z, R, LIN.c, 5, { tex: 'ringThin', spin: 0.6, op: 0.8 });
            zone(h, { x, z, r: R, dur: 5, every: 0.5, first: true, tick: () => { for (const e of enemiesIn(h, x, z, R)) { slow(h, e, 0.5, 0.7, 'linfield'); damage(h, e, tick, 1, { dot: true }); } const a = rand(TAU), dd = rand(R); linMotes(x + Math.sin(a) * dd, 0.3, z + Math.cos(a) * dd, 3, 1.4); } });
          });
        }
      },
      {
        key: 'E', name: 'Целебная сфера', icon: 'linheal', cd: 9, cost: 60, range: 9, ind: { type: 'ally' }, lock: 0.15, ai: { t: 'healAlly' }, noCue: true,
        desc: 'Отпускает сферу к союзному герою: 5 сек она восстанавливает ему здоровье. На себя (если не навестись на союзника) действует на 70%. Треть лечения приходит сразу.',
        cast(h, p) {
          const a = p.unit || h, total = D(h, 110, 22, 0, 0.8) * (a === h ? 0.7 : 1), each = total / 6; SFX.at('heal', h.x, h.z, 0.7);
          const put = t => { if (!t.alive) return; heal(h, t, each * 2); FX.heal(t, LIN.c); const b = addBuff(t, { id: 'linheal', dur: 4.05, every: 1, src: h, onTick: u => { heal(h, u, each); linMotes(u.x, 1, u.z, 4); } }); if (b) b.fx = FX.aura(t, LIN.c, 4.05, t.radius + 0.6, 'ringThin', 2.5); FX.ring(t.x, t.z, { r0: 2.4, r1: 0.5, color: LIN.c, life: 0.35, tex: 'ringThin' }); };
          if (a === h) put(h); else homing(h, a, { speed: 30, color: LIN.c, size: 0.8, mesh: 'orb', y: 1.6, onHit: put });
        }
      },
      {
        key: 'R', name: 'Возвращение', icon: 'linrev', cd: 140, cost: 150, range: 11, ind: { type: 'circle', r: 3.5 }, animDur: 1.6, lock: 1.5, ai: { t: 'revive', ult: true },
        desc: 'Укажите место, где пал союзный герой (над павшими висит нефритовый огонёк). 1.5 сек Лин зовёт его — и он встаёт там же с 50 / 75 / 100% здоровья и не меньше чем половиной маны. Оглушение или смерть Лин срывают зов: перезарядка тогда всего 30%. Пока некого возвращать, умение не применяется.',
        cast(h, p) {
          let t = null, bd = 4.5; for (const o of G.heroes) if (o.dead && o.team === h.team && o !== h && o.respawnT > 1.8 && !(o.reviving > G.time)) { const d = dist(o.x, o.z, p.x, p.z); if (d < bd) { bd = d; t = o; } }
          if (!t) { if (h === G.player) { UI.msg('Укажите место, где пал союзный герой'); SFX.play('deny'); } return false; }
          const T = 1.5, lv = Math.max(1, h.al[3]), hpK = 0.25 + 0.25 * lv, full = this.cd * 100 / (100 + h.haste), x = t.x, z = t.z; t.reviving = G.time + T + 0.1; h.linCh = G.time + T; h.linOk = true; h.order = null; h.path = null; h.facing = angTo(h.x, h.z, x, z);
          SFX.at('cast', h.x, h.z, 1); SFX.at('heal', x, z, 0.6); FX.pillar(x, z, { r: 1.3, h: 16, color: LIN.c, life: T, op: 0.5, grow: true }); FX.zone(x, z, 3, LIN.c, T, { tex: 'rune', spin: 3, op: 0.8 }); FX.zone(h.x, h.z, 2, LIN.c, T, { tex: 'ringThin', spin: -2, op: 0.7 });
          const bm = new THREE.Mesh(FX.geo.line, FX.mat('beam', LIN.c, 0.6)); FX.add(bm, T, (k, me, dt, en) => { me.position.set(h.x, 1.7, h.z); me.rotation.y = angTo(h.x, h.z, x, z); me.scale.set(0.3 + Math.sin(en.t * 14) * 0.08, 1, dist(h.x, h.z, x, z)); me.material.opacity = h.linOk && h.alive ? 0.6 : 0; });
          for (let i = 0; i < 6; i++) after(i * 0.24, () => { if (h.alive && h.linOk) { FX.implode(x, 1.4, z, 4, { n: 9, color: LIN.c, color2: 0xffffff, life: 0.25, streak: true }); FX.ring(x, z, { r0: 3.4, r1: 0.5, color: LIN.c, life: 0.3, tex: 'ringThin' }); linMotes(h.x, 1.2, h.z, 3); } });
          if (FX.near(x, z, 45)) FX.text(x, 3.2, z, t.name + ', вернись', '#b8fff0', 15);
          after(T, () => {
            t.reviving = 0; h.linCh = 0;
            if (!h.alive || !h.linOk || !t.dead) { if (h.alive) { h.cd[3] = Math.min(h.cd[3], full * 0.3); if (h === G.player) UI.msg('Зов сорван'); } return; }
            revive(t, hpK); SFX.at('bigboom', x, z, 0.5); SFX.at('cleanse', x, z, 1); FX.shake(0.4); FX.light(x, 3, z, LIN.c, 2, 26, 0.6);
            FX.pillar(x, z, { r: 2, h: 26, color: LIN.c, life: 1.0, op: 0.6 }); FX.pillar(x, z, { r: 0.7, h: 34, color: 0xffffff, life: 0.6, op: 0.6 }); FX.shock(x, z, 8, 0.8, 0.5); FX.explosion(x, z, 2.4, LIN.c, { el: 'holy', mark: false });
            for (let i = 0; i < 3; i++) after(i * 0.1, () => FX.ring(x, z, { r0: 0.5, r1: 4 + i * 1.6, color: i % 2 ? LIN.pale : LIN.c, life: 0.55, tex: i ? 'ringThin' : 'shock' }));
            FX.heal(t, LIN.c); if (FX.near(x, z, 45)) FX.text(x, t.height + 1.6, z, 'ВОЗВРАЩЕНИЕ', '#b8fff0', 19);
            const P = G.player; if (P && (P === t || P === h || P.team === h.team)) UI.announce(P === t ? 'Лин вернула вас в бой' : t.name + ' возвращается в бой', '#8ff5dc');
          });
        }
      }
    ]
  },
  /* ================= 41. Kwame ================= */
  {
    id: 'kwame', name: 'Кваме', title: 'Тренер чемпионов', role: 'support', roleName: 'Поддержка', build: 'guard', bars: [2, 4, 4, 1], diffc: 1,
    lore: 'Гора мышц с полотенцем на шее и свистком на груди. Сам он давно выиграл всё, что хотел, и теперь выигрывает чужими руками: рядом с ним бьют сильнее, машут быстрее и не падают там, где упали бы без него. «Ещё один подход!» — и команда идёт вперёд.',
    look: { bulk: 1.34, h: 1.1, scale: 1.2, arm: 1.42, c1: 0xb02a2a, c2: 0xb02a2a, c3: 0x1b1b20, lin: 0xf2c230, skin: 0x5c3a24, skin2: 0x704a30, hands: 0xe8e0d0, metal: 0xf2c230, glow: 0xffb52e, head: 'coach', hair: 0x0c0a0a, tie: 0xd8242c, chest: 'champ', sh: 'delts', legs: 'shorts', weapon: 'none', wc: 'fist' },
    stats: ST(680, 96, 300, 32, 56, 3.2, 28, 3.1, 0.74, 8.9, 2.5),
    innate: { name: 'Личный пример', icon: 'kwinn', desc: 'Союзные герои в радиусе 8 от Кваме получают +6% скорости атаки (+1% за уровень героя) и +4 силы атаки (+1 за уровень).' },
    tick(h, dt) {
      h.kwA = (h.kwA || 0) + dt; if (h.kwA < 0.5) return; h.kwA = 0;
      for (const a of alliesIn(h, h.x, h.z, 8, true)) if (a !== h) addBuff(a, { id: 'kwaura', dur: 0.8, as: 0.06 + 0.01 * h.level, ad: 4 + h.level, src: h });
    },
    abilities: [
      {
        key: 'Q', name: 'Давай-давай!', icon: 'kwpump', cd: 10, cost: 45, range: 9, ind: { type: 'ally' }, anim: 'point', animDur: 0.5, lock: 0.15, ai: { t: 'pump' }, noCue: true,
        desc: 'Кваме заряжает союзного героя (или себя) на 6 сек: +35 / 50 / 65 / 80% скорости атаки, сила атаки выше, +15% скорости передвижения. Если заряжен союзник, половину прибавки к скорости атаки получает и сам Кваме.',
        cast(h, p) {
          const a = p.unit || h, lv = Math.max(1, h.al[0]), as = 0.2 + 0.15 * lv, ad = D(h, 12, 3.2, 0.1);
          const b = addBuff(a, { id: 'kwpump', dur: 6, as, ad, ms: 0.15, src: h, every: 0.3, onTick: u => kwaUp(u, 2) }); if (b) b.fx = FX.aura(a, KWA.c, 6, a.radius + 0.9, 'ringThin', 4);
          if (a !== h) { addBuff(h, { id: 'kwself', dur: 6, as: as * 0.5 }); FX.beam(h.x, h.z, a.x, a.z, { color: KWA.c, w: 0.5, life: 0.3, y: 1.6 }); }
          SFX.at('horn', h.x, h.z, 0.6); SFX.at('cue', a.x, a.z, 0.7); kwaUp(a, 14); FX.ring(a.x, a.z, { r0: 2.6, r1: 0.6, color: KWA.c, life: 0.3, tex: 'ringThin' }); FX.pillar(a.x, a.z, { r: 0.9, h: 9, color: KWA.c, life: 0.45, op: 0.45 }); FX.glow(a.x, a.height + 0.4, a.z, 3, KWA.c, 0.35, 'star');
          if (FX.near(a.x, a.z, 45)) FX.text(a.x, a.height + 1.2, a.z, 'ДАВАЙ!', '#ffd27a', 17);
        }
      },
      {
        key: 'W', name: 'Боевой клич', icon: 'kwroar', cd: 14, cost: 60, range: 0, ind: { type: 'self', r: 6.5 }, anim: 'roar', animDur: 0.7, lock: 0.3, ai: { t: 'nova', r: 5.5 },
        desc: 'Рёв на всю округу. Союзные герои в радиусе 6.5 (и сам Кваме) 5 сек наносят на 11 / 14 / 17 / 20% больше урона и получают защиту; враги в радиусе получают физический урон и замедлены на 30% на 2 сек.',
        cast(h) {
          const R = 6.5, lv = Math.max(1, h.al[1]), dmg = D(h, 60, 11, 0.5), x = h.x, z = h.z;
          for (const a of alliesIn(h, x, z, R, true)) { const b = addBuff(a, { id: 'kwroar', dur: 5, dmgOut: 1.08 + 0.03 * lv, def: 6 + 4 * lv, amp: h, src: h }); if (b) b.fx = FX.aura(a, KWA.red, 5, a.radius + 0.6, 'ring', 3); kwaUp(a, 8); }
          for (const e of enemiesIn(h, x, z, R)) { damage(h, e, dmg, 0); slow(h, e, 0.3, 2, 'kwslow'); FX.hit(e.x, 1.3, e.z, KWA.c, true); }
          SFX.at('horn', x, z, 1); SFX.at('bigboom', x, z, 0.5); FX.shake(0.6); FX.shock(x, z, R * 1.5, 1.2, 0.5); FX.warp('ring', x, 0, z, { r: R, str: 1, life: 0.5 });
          for (let i = 0; i < 3; i++) after(i * 0.09, () => FX.ring(x, z, { r0: 0.6, r1: R - i * 0.8, color: i % 2 ? KWA.red : KWA.c, life: 0.45, tex: i ? 'ringThin' : 'shock' }));
          FX.debris(x, 0.3, z, { n: 8, color: 0x4a4640, speed: [3, 9], up: 8, size: [0.16, 0.4], rad: 1.5 }); if (FX.near(x, z, 45)) FX.text(x, h.height + 1.8, z, 'ВПЕРЁД!', '#ffd27a', 18);
        }
      },
      {
        key: 'E', name: 'Подстраховка', icon: 'kwspot', cd: 15, cost: 55, range: 10, ind: { type: 'ally' }, anim: 'slam', animDur: 0.6, lock: 0, ai: { t: 'shieldAlly' },
        desc: 'Прыжок к союзному герою: Кваме приземляется рядом, и оба получают щит на 4 сек. Враги в радиусе 3.4 от места приземления получают физический урон и отлетают. Без союзника — щит себе и удар вокруг.',
        cast(h, p) {
          const a = p.unit || h, sh = D(h, 70, 16, 0.4) + h.maxHp * 0.06, dmg = D(h, 50, 9, 0.4), R = 3.4;
          const land = u => {
            const x = u.x, z = u.z; shield(u, u, sh, 4, KWA.c); if (a !== u && a.alive) { shield(u, a, sh, 4, KWA.c); kwaUp(a, 10); }
            for (const e of enemiesIn(u, x, z, R)) { damage(u, e, dmg, 0); knock(e, x, z, 3, 0.25); FX.hit(e.x, 1.3, e.z, KWA.c, true); }
            SFX.at('boom', x, z, 0.8); SFX.at('heavy', x, z, 0.8); FX.shake(0.55); FX.shock(x, z, R * 1.6, 1, 0.4); FX.ring(x, z, { r0: 0.4, r1: R, color: KWA.c, life: 0.35, tex: 'shock' }); FX.ring(x, z, { r0: R * 0.8, r1: R, color: KWA.c, tex: 'crack', life: 1.2, op: 0.6 }); FX.debris(x, 0.3, z, { n: 10, color: 0x4a4640, speed: [3, 9], up: 9, size: [0.18, 0.5] });
          };
          SFX.at('dash', h.x, h.z, 0.9); if (a === h || udist(h, a) < 2.2) { land(h); return; }
          const ang = angTo(a.x, a.z, h.x, h.z); telegraph(h, a.x, a.z, R, Math.max(0.15, udist(h, a) / 30), KWA.c);
          dashTo(h, a.x + Math.sin(ang) * 1.7, a.z + Math.cos(ang) * 1.7, 30, { fly: true, arc: 3.6, ribbon: KWA.c, onEnd: land });
        }
      },
      {
        key: 'R', name: 'Чемпионский час', icon: 'kwchamp', cd: 110, cost: 100, range: 0, ind: { type: 'self', r: 9 }, anim: 'flex', animDur: 1.1, lock: 0.7, ai: { t: 'rally', r: 9, ult: true },
        desc: 'Через 0.6 сек Кваме и все союзные герои в радиусе 9 на 8 / 9 / 10 сек становятся чемпионами: они вырастают, наносят на 20 / 27 / 34% больше урона, атакуют на 40 / 55 / 70% быстрее, двигаются на 20% быстрее и получают на 10% меньше урона. Враги рядом с Кваме отлетают.',
        cast(h) {
          const T = 0.6, R = 9, lv = Math.max(1, h.al[3]), dur = 7 + lv, dmg = D(h, 70, 14, 0.5); h.order = null; h.path = null;
          SFX.at('ultcue', h.x, h.z, 0.6); SFX.at('horn', h.x, h.z, 0.8); FX.pillar(h.x, h.z, { r: 1.6, h: 16, color: KWA.c, life: T, op: 0.5, grow: true }); FX.zone(h.x, h.z, R, KWA.c, T, { tex: 'swirl', spin: 5, op: 0.5 });
          for (let i = 0; i < 4; i++) after(i * 0.13, () => { if (h.alive) { FX.implode(h.x, 1.8, h.z, 7 - i, { n: 10, color: KWA.c, color2: 0xffffff, life: 0.24, streak: true }); kwaUp(h, 6); } });
          after(T, () => {
            if (!h.alive) return; const x = h.x, z = h.z;
            for (const a of alliesIn(h, x, z, R, true)) {
              const b = addBuff(a, { id: 'kwchamp', dur, dmgOut: 1.13 + 0.07 * lv, as: 0.25 + 0.15 * lv, ms: 0.2, dmgIn: 0.9, amp: h, src: h, every: 0.25, onTick: u => kwaUp(u, 2) }); if (!b) continue;
              b.fx = FX.aura(a, KWA.c, dur, a.radius + 1.2, 'swirl', 5); a.pumpT = G.time + dur; kwaUp(a, 16); FX.pillar(a.x, a.z, { r: 1.2, h: 14, color: KWA.c, life: 0.7, op: 0.5 }); if (a !== h) FX.beam(x, z, a.x, a.z, { color: KWA.c, w: 0.7, life: 0.35, y: 1.8 });
              if (a === G.player && a !== h) UI.msg('Чемпионский час: вы сильнее на ' + dur + ' сек');
            }
            for (const e of enemiesIn(h, x, z, 5)) { damage(h, e, dmg, 0); knock(e, x, z, 4, 0.3); FX.hit(e.x, 1.3, e.z, KWA.c, true); }
            SFX.at('bigboom', x, z, 0.9); SFX.at('mvp', x, z, 0.5); FX.shake(0.8); FX.punch(0.8); FX.light(x, 4, z, KWA.c, 2.2, 30, 0.7); FX.shock(x, z, R * 1.4, 1.3, 0.55);
            FX.pillar(x, z, { r: 2.2, h: 24, color: KWA.c, life: 0.9, op: 0.5 }); FX.explosion(x, z, 2.5, KWA.c, { color2: KWA.deep, smoke: false, mark: false });
            for (let i = 0; i < 3; i++) after(i * 0.08, () => FX.ring(x, z, { r0: 0.6 + i, r1: R - i, color: i % 2 ? KWA.pale : KWA.c, life: 0.55, tex: i ? 'ringThin' : 'shock' }));
            if (FX.near(x, z, 45)) FX.text(x, h.height + 2.6, z, 'ЧЕМПИОНСКИЙ ЧАС', '#ffd27a', 20);
          });
        }
      }
    ]
  }
);

/* ===== roster, part 15: Agafya the old seamstress — a needle as tall as she is, a ball of yarn bristling with pins, threads that bind and pull, a patch for any wound, and one thread run through every enemy at once ===== */
const AGF = { c: 0xc58aff, pale: 0xf0e2ff, deep: 0x4a2a7a, steel: 0xdfe8f2, yarn: 0xc8643a };
let _agfNeedle = null, _agfBall = null;
// the giant spectral needle of her abilities: lit silver with a violet sheen, the point leads along +z, the eye (a dark slot) at the back. Shared geometry and material: always wrapped in a group, so FX never disposes them
function agfNeedle(s) {
  if (!_agfNeedle) {
    const st = AGF.steel, P = [{ g: new THREE.CylinderGeometry(0.06, 0.14, 3.0, 6).rotateX(HPI), m: TRS(0, 0, 0.2), c: st }, { g: new THREE.ConeGeometry(0.06, 0.65, 6).rotateX(HPI), m: TRS(0, 0, 2.02), c: st },
      { g: new THREE.CylinderGeometry(0.14, 0.15, 0.9, 6).rotateX(HPI), m: TRS(0, 0, -1.7), c: st }, { g: new THREE.ConeGeometry(0.15, 0.22, 6).rotateX(-HPI), m: TRS(0, 0, -2.26), c: st }, { g: new THREE.BoxGeometry(0.05, 0.3, 0.45), m: TRS(0, 0, -1.8), c: 0x1a1028 }];
    _agfNeedle = new THREE.Mesh(mergeParts(P), new THREE.MeshPhongMaterial({ vertexColors: true, flatShading: true, emissive: 0x2a1a4a, shininess: 90, specular: 0xffffff }));
  }
  const g = new THREE.Group(), m = new THREE.Mesh(_agfNeedle.geometry, _agfNeedle.material), gl = glowSprite(AGF.c, 1.6); gl.position.z = 2.1; g.add(m, gl); g.rotation.order = 'YXZ'; g.scale.setScalar(s || 1); return g;
}
// a ball of yarn wound in rust and coral, pins sticking out of it all round
function agfBall() {
  if (!_agfBall) {
    const P = [{ g: new THREE.IcosahedronGeometry(0.62, 1), m: TRS(0, 0, 0), c: AGF.yarn }];
    for (let i = 0; i < 4; i++) P.push({ g: new THREE.CylinderGeometry(0.645, 0.645, 0.09, 14, 1, true), m: TRS(0, 0, 0, i * 0.8, i * 1.3, i * 0.5), c: i % 2 ? 0xe88a5a : 0x9a3a1e });
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * TAU, el = ((i % 3) - 1) * 0.7, v = new THREE.Vector3(Math.cos(el) * Math.sin(a), Math.sin(el), Math.cos(el) * Math.cos(a)), e = new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), v));
      P.push({ g: new THREE.CylinderGeometry(0.02, 0.02, 0.5, 4), m: TRS(v.x * 0.78, v.y * 0.78, v.z * 0.78, e.x, e.y, e.z), c: AGF.steel }, { g: new THREE.IcosahedronGeometry(0.065, 0), m: TRS(v.x * 1.04, v.y * 1.04, v.z * 1.04), c: [0xe04050, 0xf0d050, 0x60a0e0][i % 3] });
    }
    _agfBall = new THREE.Mesh(mergeParts(P), new THREE.MeshPhongMaterial({ vertexColors: true, flatShading: true, shininess: 30, side: THREE.DoubleSide }));
  }
  const g = new THREE.Group(), m = new THREE.Mesh(_agfBall.geometry, _agfBall.material); g.add(m); return g;
}
// a glowing thread between two things that move (units, or a fixed point given as {x, z, alive: true, yOff}); it lives until `until`
function agfTie(a, b, until, w) {
  const m = new THREE.Mesh(FX.geo.line, FX.mat('beam', AGF.c, 0.6));
  return FX.add(m, Math.max(0.1, until - G.time) + 0.1, (k, me, dt, en) => {
    const ok = a.alive && b.alive && G.time < until; me.visible = ok; if (!ok) return;
    const d = dist(a.x, a.z, b.x, b.z); me.position.set(a.x, 1.25 + (a.yOff || 0), a.z); me.rotation.y = angTo(a.x, a.z, b.x, b.z);
    me.scale.set((w || 0.16) * (0.85 + 0.15 * Math.sin(en.t * 7)), 1, Math.max(0.01, d)); me.material.opacity = 0.65 * Math.min(1, (until - G.time) / 0.4, en.t / 0.1);
  });
}
// cross-stitch marks over a head: one bright little cross per stitch
function agfStitchFx(t, n) {
  for (let i = 0; i < n; i++) { const x = t.x + (i - (n - 1) / 2) * 0.55; FX.glow(x, t.height + 0.7, t.z, 0.9, AGF.c, 0.5, 'star'); }
  FX.sparks(t.x, 1.3, t.z, { n: 4, color: AGF.pale, color2: AGF.c, speed: [2, 6], life: [0.15, 0.3], w: 0.07 });
}

HEROES.push(
  /* ================= 42. Agafya ================= */
  {
    id: 'agafya', name: 'Агафья', title: 'Старая швея', role: 'support', roleName: 'Поддержка', build: 'guard', bars: [3, 3, 4, 1], diffc: 2,
    lore: 'Полвека она шила для всей деревни у подножия Разлома: подвенечные платья, саваны и заплатки на чужие беды. Когда пришла война, Агафья просто взяла иглу побольше. Ходит медленно, без очков не видит и никуда не торопится — нитка всё равно дойдёт, куда надо.',
    look: { bulk: 0.9, h: 0.9, scale: 1.0, robe: true, hunch: 0.24, c1: 0x4a3a5e, c2: 0x8a6aa8, c3: 0x2a2230, skin: 0xe8c8b0, hands: 0xe8c8b0, metal: 0xc8d2dc, glow: 0xc58aff, head: 'babushka', hair: 0xd8d8dc, lin: 0xe8dfcf, chest: 'seam', sh: 'cloth', weapon: 'needle', wc: 'thrust', back: 'basket' },
    stats: ST(600, 88, 380, 42, 50, 2.6, 26, 2.8, 0.74, 8.6, 2.9),
    innate: { name: 'Стежок за стежком', icon: 'agfinn', desc: 'Любое попадание Агафьи по вражескому герою — атака или умение — кладёт на него стежок на 5 сек. На третьем стежке враг прошит: обездвижен на 0.9 сек и получает магический урон (20 + 4 за уровень героя + 20% силы умений). Одного и того же героя можно прошить раз в 7 сек.' },
    onDeal(h, t, d, o) {
      if (o.dot || t.kind !== 'hero' || !t.alive || !hostile(h, t)) return;
      const L = t.sewLock || (t.sewLock = {}); if (L[h.id] > G.time) return;
      const b = addBuff(t, { id: 'stitch' + h.id, dur: 5, stackTo: 3, src: h }); if (!b) return; const n = b.stacks || 1;
      if (FX.near(t.x, t.z, 45)) agfStitchFx(t, n);
      if (n >= 3) {
        b.dead = true; L[h.id] = G.time + 7; root(h, t, 0.9, AGF.c); damage(h, t, 20 + 4 * h.level + 0.2 * h.ap, 1, { dot: true });
        SFX.at('slash', t.x, t.z, 0.7); FX.ring(t.x, t.z, { r0: 2.2, r1: 0.6, color: AGF.c, life: 0.3, tex: 'ringThin' });
        for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.4; FX.beam(t.x + Math.sin(a) * 1.4, t.z + Math.cos(a) * 1.4, t.x - Math.sin(a) * 1.4, t.z - Math.cos(a) * 1.4, { color: AGF.c, w: 0.12, life: 0.4, y: 0.6 + i * 0.35 }); }
        if (FX.near(t.x, t.z, 45)) FX.text(t.x, t.height + 1.2, t.z, 'ПРОШИТ', '#e2c6ff', 15);
      }
    },
    abilities: [
      {
        key: 'Q', name: 'Клубок с иглами', icon: 'agfball', cd: 8, cost: 55, range: 13, ind: { type: 'line', w: 2 }, anim: 'toss', animDur: 0.45, lock: 0.25, ai: { t: 'shot', sp: 16, farm: true },
        desc: 'Пускает по земле клубок, утыканный иглами: он катится на 13, разматывая за собой нить, и ранит всех на пути (магический урон, замедление на 25% на 1.5 сек). В конце клубок разлетается иглами — половина урона всем в радиусе 3.5.',
        cast(h, p) {
          const dir = p.dir, sx = Math.sin(dir), cz = Math.cos(dir), SP = 16, L = 13 + (h.castRange || 0), dmg = D(h, 68, 12, 0, 0.55), x0 = h.x + sx * 1.2, z0 = h.z + cz * 1.2; let acc = 0;
          SFX.at('whoosh', h.x, h.z, 0.8);
          shot(h, {
            dir, x: x0, z: z0, speed: SP, range: 13, w: 1.1, color: AGF.c, mesh: false, ribbon: false, pierce: true, y: 0.7,
            trail: q => { if (++acc % 3 === 0 && FX.near(q.x, q.z, 50)) FX.burst(q.x, 0.3, q.z, { n: 1, color: 0xe88a5a, color2: AGF.yarn, speed: [0.3, 1.2], life: [0.3, 0.6], size: [0.3, 0.04], up: 1.5, rad: 0.4 }); },
            onHit: e => { damage(h, e, dmg, 1); slow(h, e, 0.25, 1.5, 'agfslow'); FX.hit(e.x, 1.1, e.z, AGF.c, e.kind === 'hero'); FX.sparks(e.x, 1, e.z, { n: 5, color: AGF.steel, color2: AGF.c, speed: [3, 9], life: [0.12, 0.3], dir, spread: 0.6, w: 0.07 }); SFX.at('hit', e.x, e.z, 0.5); },
            onEnd: (x, z) => {
              for (const e of enemiesIn(h, x, z, 3.5)) { damage(h, e, dmg * 0.5, 1); FX.hit(e.x, 1.1, e.z, AGF.c, false); }
              SFX.at('shatter', x, z, 0.7); SFX.at('boom', x, z, 0.4); FX.ring(x, z, { r0: 0.4, r1: 3.5, color: AGF.c, life: 0.35, tex: 'shock' }); FX.shock(x, z, 4, 0.6, 0.3);
              for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + rand(-0.15, 0.15), r = rand(2.8, 3.8); FX.beam(x + Math.sin(a) * 0.5, z + Math.cos(a) * 0.5, x + Math.sin(a) * r, z + Math.cos(a) * r, { color: AGF.steel, w: 0.14, life: 0.28, y: 0.7 }); }
              FX.burst(x, 0.7, z, { n: 10, color: 0xe88a5a, color2: AGF.yarn, speed: [1, 4], life: [0.4, 0.8], size: [0.35, 0.05], up: 3, grav: -6 }); FX.glow(x, 0.8, z, 3.4, AGF.c, 0.2, 'star');
            }
          });
          if (!FX.near(x0, z0, 70)) return;
          // the ball itself, rolling and shrinking as it unwinds, and the thread it lays down behind it
          const T = L / SP, g = agfBall(), inner = g.children[0], th = new THREE.Mesh(FX.geo.line, FX.mat('beam', AGF.c, 0.55)); th.position.set(x0, 0.13, z0); th.rotation.y = dir; th.renderOrder = 4;
          g.rotation.y = dir; FX.add(g, T, (k, me, dt, en) => { const d = Math.min(L, en.t * SP), s = 1 - 0.35 * k; me.position.set(x0 + sx * d, 0.62 * s, z0 + cz * d); me.scale.setScalar(s); inner.rotation.x = d / (0.62 * s); });
          FX.add(th, T + 1.4, (k, me, dt, en) => { me.scale.set(0.16, 1, Math.max(0.01, Math.min(L, en.t * SP))); me.material.opacity = 0.55 * (en.t < T ? 1 : 1 - (en.t - T) / 1.4); });
        }
      },
      {
        key: 'W', name: 'На живую нитку', icon: 'agfbaste', cd: 13, cost: 70, range: 10, ind: { type: 'circle', r: 3.6 }, anim: 'thrust', animDur: 0.4, lock: 0.25, ai: { t: 'point', rad: 3.6, delay: 0.7 },
        desc: 'Бросает огромную иглу в точку. Воткнувшись, игла пришивает нитями всех врагов в радиусе 3.6 (магический урон), а через 0.5 сек нити натягиваются и стягивают их к игле, где они обездвижены на 1 / 1.2 / 1.4 / 1.6 сек.',
        cast(h, p) {
          const x = p.x, z = p.z, R = 3.6, T = Math.max(0.2, p.dist / 34), dmg = D(h, 60, 10.5, 0, 0.5), rt = 0.8 + 0.2 * Math.max(1, h.al[1]), x0 = h.x, z0 = h.z, dir = p.dir, HOLD = T + 0.5 + rt + 0.4;
          telegraph(h, x, z, R, T + 0.5, AGF.c); SFX.at('whoosh', x0, z0, 1);
          if (FX.near(x, z, 60)) {   // the needle arcs over, turning point-down, and stabs into the ground; it stands there until the knot is tied
            const nd = agfNeedle(0.9);
            FX.add(nd, HOLD, (k, me, dt, en) => {
              const f = Math.min(1, en.t / T), out = en.t > HOLD - 0.3 ? (en.t - HOLD + 0.3) / 0.3 : 0;
              me.position.set(lerp(x0, x, f), lerp(1.6, 2.0, f) + Math.sin(Math.PI * f) * 2.6 + out * 2, lerp(z0, z, f)); me.rotation.y = dir; me.rotation.x = lerp(-0.4, HPI, f * f) + (f >= 1 ? Math.sin(en.t * 30) * 0.04 * Math.max(0, 1 - (en.t - T) * 3) : 0);
              me.scale.setScalar(0.9 * (1 - out));
            });
          }
          after(T, () => {
            SFX.at('hit', x, z, 1); SFX.at('rubble', x, z, 0.5); FX.shake(0.25); FX.ring(x, z, { r0: 0.3, r1: R, color: AGF.c, life: 0.35, tex: 'shock' }); FX.shock(x, z, R, 0.6, 0.3); FX.debris(x, 0.3, z, { n: 6, color: 0x4a4640, speed: [2, 6], up: 7, size: [0.14, 0.34] });
            FX.zone(x, z, R, AGF.c, 0.5 + rt, { tex: 'rune', spin: 1.2, op: 0.55 });
            const pin = { x, z, alive: true, yOff: 0.7 }, caught = [];
            for (const e of enemiesIn(h, x, z, R)) { damage(h, e, dmg, 1); caught.push(e); FX.hit(e.x, 1.2, e.z, AGF.c, true); agfTie(pin, e, G.time + 0.5 + rt, 0.13); }
            after(0.5, () => {
              if (caught.length) { SFX.at('whoosh', x, z, 0.8); SFX.at('crit', x, z, 0.4); }
              for (const e of caught) {
                if (!e.alive || dist(e.x, e.z, x, z) > R + 3) continue; const tt = pullTo(e, x, z, 24, 1.0);
                after(tt, () => { if (!e.alive) return; root(h, e, rt, AGF.c); FX.sparks(e.x, 1.2, e.z, { n: 6, color: AGF.pale, color2: AGF.c, speed: [2, 6], life: [0.15, 0.35], w: 0.08 }); });
              }
              FX.implode(x, 1.2, z, R, { n: 14, color: AGF.c, color2: 0xffffff, life: 0.25, streak: true });
            });
          });
        }
      },
      {
        key: 'E', name: 'Заплатка', icon: 'agfpatch', cd: 12, cost: 60, range: 9, ind: { type: 'ally' }, lock: 0.15, ai: { t: 'shieldAlly' }, noCue: true,
        desc: 'Ставит заплатку союзному герою (или себе): снимает замедления и обездвиживание, даёт щит на 4 сек и за 3 сек восстанавливает здоровье. Пока заплатка держится, герой получает на 10% меньше урона.',
        cast(h, p) {
          const a = p.unit && p.unit.alive ? p.unit : h, sh = D(h, 55, 12, 0, 0.45) + a.maxHp * 0.05, hl = D(h, 48, 9, 0, 0.35);
          for (const b of a.buffs) if (b.slow || b.root) b.dead = true;
          shield(h, a, sh, 4, AGF.c); addBuff(a, { id: 'agfpatch', dur: 3.05, every: 1, dmgIn: 0.9, src: h, onTick: u => { heal(h, u, hl / 3, true); if (FX.near(u.x, u.z, 45)) FX.burst(u.x, 1.2, u.z, { n: 3, color: AGF.pale, color2: AGF.c, speed: [0.1, 0.5], life: [0.5, 0.9], size: [0.3, 0.04], up: 2, rad: 0.7 }); } });
          SFX.at('heal', a.x, a.z, 0.7); SFX.at('slash', h.x, h.z, 0.3); FX.heal(a, AGF.c);
          if (a !== h) FX.beam(h.x, h.z, a.x, a.z, { color: AGF.c, w: 0.14, life: 0.4, y: 1.3 });
          if (FX.near(a.x, a.z, 50)) {   // the patch is sewn on: a square of light at the chest, a ring of running stitches round the feet
            for (let i = 0; i < 8; i++) { const q = i / 8 * TAU; after(i * 0.04, () => { if (a.alive) FX.beam(a.x + Math.sin(q) * 1.5, a.z + Math.cos(q) * 1.5, a.x + Math.sin(q + 0.5) * 1.5, a.z + Math.cos(q + 0.5) * 1.5, { color: AGF.c, w: 0.12, life: 0.6, y: 0.25 }); }); }
            FX.glow(a.x, 1.5 + (a.yOff || 0), a.z, 2.2, AGF.pale, 0.35, 'star');
          }
        }
      },
      {
        key: 'R', name: 'Одной нитью', icon: 'agfthread', cd: 100, cost: 110, range: 10, ind: { type: 'circle', r: 6.5 }, anim: 'atom', animDur: 0.8, lock: 0.55, ai: { t: 'point', rad: 6.5, delay: 0.6, ult: true, hp: 0.55 },
        desc: 'Через 0.5 сек огромная призрачная игла прошивает насквозь всех вражеских героев в радиусе 6.5 — одного за другим: каждому магический урон и стежок. Потом они сшиты одной нитью на 5 / 6 / 7 сек: замедлены на 25%, а 30 / 40 / 50% урона, который получает любой из них, достаётся и всем остальным.',
        cast(h, p) {
          const x = p.x, z = p.z, R = 6.5, T = 0.5, lv = Math.max(1, h.al[3]), dur = 4 + lv, share = 0.2 + 0.1 * lv, dmg = D(h, 110, 22, 0, 0.7);
          telegraph(h, x, z, R, T, AGF.c); SFX.at('ultcue', h.x, h.z, 0.5); SFX.at('dark', x, z, 0.6); FX.zone(x, z, R, AGF.c, T + 0.4, { tex: 'swirl', spin: 3, op: 0.5 }); FX.pillar(x, z, { r: 1, h: 16, color: AGF.c, life: T, op: 0.4, grow: true });
          after(T, () => {
            const foes = G.heroes.filter(e => e.alive && hostile(h, e) && dist(e.x, e.z, x, z) < R + e.radius).sort((a, b) => angTo(x, z, a.x, a.z) - angTo(x, z, b.x, b.z));
            const g = { until: G.time + dur + 0.15 * foes.length, share, list: [], src: h, col: AGF.c }, n = foes.length, SEG = 0.14;
            const last = foes.map(e => ({ x: e.x, z: e.z })), wp = i => i === 0 ? { x: x - 7, y: 7, z: z - 2 } : (i <= n ? (foes[i - 1].alive ? { x: foes[i - 1].x, y: 1.3, z: foes[i - 1].z } : { x: last[i - 1].x, y: 1.3, z: last[i - 1].z }) : (() => { const a = wp(n), b = wp(Math.max(0, n - 1)); const dx = a.x - b.x, dz = a.z - b.z, l = Math.hypot(dx, dz) || 1; return { x: a.x + dx / l * 6, y: 8, z: a.z + dz / l * 6 }; })());
            SFX.at('whoosh', x, z, 1); FX.shake(0.4);
            const nd = agfNeedle(1.1), rib = FX.ribbon(AGF.c, 0.45, 26), en = FX.add(nd, SEG * (n + 1) + 0.6, null); let t = 0, done = 0, fin = false;
            G.actors.push({ update(dt) {
              t += dt; const s = Math.min(n, Math.floor(t / SEG)), f = Math.min(1, (t - s * SEG) / SEG), A = wp(s), B = wp(s + 1), px = lerp(A.x, B.x, f), py = lerp(A.y, B.y, f), pz = lerp(A.z, B.z, f);
              nd.position.set(px, py, pz); const dx = B.x - A.x, dy = B.y - A.y, dz = B.z - A.z; nd.rotation.y = Math.atan2(dx, dz); nd.rotation.x = -Math.atan2(dy, Math.hypot(dx, dz)); rib.add(px, py, pz);
              for (let i = 0; i < n; i++) if (foes[i].alive) last[i] = { x: foes[i].x, z: foes[i].z };
              while (done < n && t >= (done + 1) * SEG) {   // the needle has reached the next one: through him, and he is on the thread
                const e = foes[done++]; if (!e.alive) continue;
                damage(h, e, dmg, 1); if (!e.alive) continue; e.sewG = g; g.list.push(e);
                const b = addBuff(e, { id: 'sewn' + h.id, dur: g.until - G.time, slow: 0.25, src: h, onEnd: u => { if (u.sewG === g) u.sewG = null; } }); if (b) b.fx = FX.aura(e, AGF.c, b.dur, e.radius + 0.5, 'ringThin', 3);
                FX.hit(e.x, 1.3, e.z, AGF.c, true); FX.sparks(e.x, 1.3, e.z, { n: 10, color: 0xffffff, color2: AGF.c, speed: [4, 12], life: [0.15, 0.35], dir: nd.rotation.y, spread: 0.5, w: 0.1 }); SFX.at('slash', e.x, e.z, 0.9); SFX.at('crit', e.x, e.z, 0.4); if (e === G.player || h === G.player) FX.hitstop(0.04);
              }
              if (!fin && t >= SEG * (n + 1)) {
                fin = true; rib.end(); en.dead = true;
                const L2 = g.list.filter(e => e.alive);
                for (let i = 0; i + 1 < L2.length; i++) agfTie(L2[i], L2[i + 1], g.until, 0.18); if (L2.length > 2) agfTie(L2[L2.length - 1], L2[0], g.until, 0.18);
                if (L2.length) { SFX.at('cleanse', x, z, 0.6); if (FX.near(x, z, 45)) FX.text(x, 4, z, L2.length > 1 ? 'СШИТЫ' : 'ПРОШИТ', '#e2c6ff', 19); }
                else { FX.ring(x, z, { r0: 0.5, r1: 3, color: AGF.c, life: 0.4, tex: 'shock' }); }
                return false;
              }
              return true;
            } });
          });
        }
      }
    ]
  }
);

/* ===== roster, part 16: Akito the devil hunter — the future in his right eye, a cursed katana that takes a quarter of him on its fourth cut, a smoke break, a step into the future, and «Кон»: the fox devil's head out of the earth ===== */
const AKI = { c: 0xff8a3a, pale: 0xffe2c0, deep: 0x7a2a08, cur: 0xd0182a, cdk: 0x2a0408, fut: 0x9ad8ff, fdeep: 0x1a3a5a };
// the fox devil's head: built once from kit parts (cranium, ears, snout, upper teeth; a separate hinged lower jaw), every summon gets its own materials so it can fade
let _akiFox = null;
// the fox devil's head: built once from kit parts (cranium, ears, snout, upper teeth; a separate hinged lower jaw), every summon gets its own materials so it can fade
function akiFoxParts() {
  if (_akiFox) return _akiFox;
  const O = 0xb85a1a, OD = 0x7e3410, CR = 0xd2c2a8, DK = 0x1a1210, MO = 0x4a0810, TE = 0xfff8ea, MK = 0xd0202c, EY = { g: 0xffd24a };
  const head = new THREE.Group(), jaw = new THREE.Group(), tmpM = new THREE.MeshBasicMaterial(), tmpG = new THREE.MeshBasicMaterial(), k = kit(), j = kit();
  // cranium and brow, two fluffy cheek tufts, a neck going down into the ground
  k.t(1.3, 1.2, 1.6, 1.5, 1.1, O, 0, 0.3, -0.2).t(1.0, 0.9, 1.35, 1.25, 0.45, OD, 0, 0.98, -0.28).t(1.5, 1.3, 1.25, 1.1, 1.8, O, 0, -1.2, -0.7, 0.25)
    .c(0.5, 1.1, 4, CR, -0.88, -0.1, -0.15, 0, 0.3, 2.0).c(0.5, 1.1, 4, CR, 0.88, -0.1, -0.15, 0, -0.3, -2.0).c(0.45, 0.9, 4, CR, -0.7, -0.75, -0.4, 0.3, 0, 2.6).c(0.45, 0.9, 4, CR, 0.7, -0.75, -0.4, 0.3, 0, -2.6)
    // the long upper snout, the nose, a cream band under it and the dark roof of the mouth
    .t(0.5, 0.36, 1.0, 0.72, 1.7, O, 0, 0.05, 1.0, HPI).t(0.42, 0.06, 0.85, 0.08, 1.55, CR, 0, -0.27, 1.0, HPI).i(0.14, DK, 0, 0.2, 1.86).b(0.7, 0.04, 1.4, MO, 0, -0.31, 0.95)
    // tall ears with cream inside and black tips
    .c(0.4, 1.35, 4, O, -0.58, 1.55, -0.4, -0.1, 0, 0.28).c(0.4, 1.35, 4, O, 0.58, 1.55, -0.4, -0.1, 0, -0.28).c(0.24, 0.95, 4, CR, -0.56, 1.45, -0.26, -0.1, 0, 0.28).c(0.24, 0.95, 4, CR, 0.56, 1.45, -0.26, -0.1, 0, -0.28)
    .c(0.17, 0.42, 4, DK, -0.76, 2.15, -0.46, -0.1, 0, 0.28).c(0.17, 0.42, 4, DK, 0.76, 2.15, -0.46, -0.1, 0, -0.28)
    // slanted glowing eyes with slit pupils, red markings over them and down the brow
    .b(0.36, 0.1, 0.08, EY, -0.46, 0.46, 0.58, 0, 0.35, 0.32).b(0.36, 0.1, 0.08, EY, 0.46, 0.46, 0.58, 0, -0.35, -0.32).b(0.04, 0.12, 0.1, DK, -0.46, 0.46, 0.6).b(0.04, 0.12, 0.1, DK, 0.46, 0.46, 0.6)
    .b(0.07, 0.42, 0.06, MK, -0.32, 0.86, 0.36, 0.4, 0, -0.4).b(0.07, 0.42, 0.06, MK, 0.32, 0.86, 0.36, 0.4, 0, 0.4).b(0.08, 0.5, 0.06, MK, 0, 0.92, 0.42, 0.55, 0, 0);
  for (let i = 0; i < 7; i++) { const z = 0.42 + i * 0.22, x = 0.42 - i * 0.04, big = i === 6 || i === 1; for (const s of [-1, 1]) k.c(big ? 0.08 : 0.055, big ? 0.38 : 0.2, 4, TE, s * x, -0.38 - (big ? 0.08 : 0), z, Math.PI); }
  k.into(head, tmpM, tmpG);
  // the lower jaw hinges at its back end: cream jaw, dark inside, a tongue, a row of lower teeth
  j.t(0.36, 0.24, 0.85, 0.4, 1.45, CR, 0, -0.12, 0.78, HPI).b(0.66, 0.04, 1.25, MO, 0, 0.08, 0.8).b(0.38, 0.06, 0.95, 0xc84a5a, 0, 0.1, 0.72);
  for (let i = 0; i < 6; i++) { const z = 0.3 + i * 0.22, x = 0.36 - i * 0.04, big = i === 5; for (const s of [-1, 1]) j.c(big ? 0.07 : 0.05, big ? 0.32 : 0.18, 4, TE, s * x, 0.14 + (big ? 0.06 : 0), z); }
  j.into(jaw, tmpM, tmpG);
  const pick = g => g.children.map(m => ({ geo: m.geometry, glow: m.material === tmpG }));
  return (_akiFox = { head: pick(head), jaw: pick(jaw) });
}
function akiFox() {
  const P = akiFoxParts(), mat = new THREE.MeshPhongMaterial({ vertexColors: true, flatShading: true, shininess: 18, specular: 0x332211, emissive: 0x0e0402, transparent: true }), gmat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true });
  const root = new THREE.Group(), head = new THREE.Group(), jaw = new THREE.Group(); root.add(head); head.add(jaw); jaw.position.set(0, -0.36, 0.12); head.rotation.order = 'YXZ';
  for (const p of P.head) head.add(new THREE.Mesh(p.geo, p.glow ? gmat : mat)); for (const p of P.jaw) jaw.add(new THREE.Mesh(p.geo, p.glow ? gmat : mat));
  const eyes = [-0.46, 0.46].map(x => { const s = glowSprite(0xffb84a, 0.9); s.position.set(x, 0.46, 0.66); head.add(s); return s; });
  return { root, head, jaw, mat, gmat, eyes };
}
// put the katana away: back to fists
function akiSheath(h) {
  h.kat = null; const r = h.rig; r.wc = 'fist'; r.tipR = null; if (r.katana) r.katana.visible = false; if (r.hilt) r.hilt.visible = true; h.range = h.def.stats.range;
  for (const b of h.buffs) if (b.id === 'katana') b.dead = true;
}
function akiSmoke(x, y, z, n, s) { if (FX.near(x, z, 50)) FX.burst(x, y, z, { smoke: true, n, color: 0xb8b4ac, color2: 0x3a3836, speed: [0.2, 0.8], life: [0.8, 1.5], size: [0.4 * (s || 1), 1.1 * (s || 1)], up: 1.4, rad: 0.2, a: 0.35, drag: 1 }); }

HEROES.push(
  /* ================= 43. Akito ================= */
  {
    id: 'akito', name: 'Акито', title: 'Охотник на демонов', role: 'assassin', roleName: 'Убийца', build: 'assassin', bars: [4, 3, 2, 3], diffc: 3,
    lore: 'Он подписал три договора с демонами и знает, сколько ему за это осталось. Демон будущего живёт в его правом глазу и шепчет, куда ударят через секунду; проклятый клинок берёт за каждое убийство кусок его жизни; а лиса приходит на один короткий слог — «Кон». Между боями он молча курит и не строит планов дальше конца недели.',
    look: { bulk: 0.95, h: 1.02, scale: 1.04, c1: 0x15161c, c2: 0x1c1e26, c3: 0x101014, skin: 0xead2c0, hands: 0xead2c0, metal: 0x9aa0aa, glow: 0xff8a3a, head: 'akito', hair: 0x111218, shirt: 0xf2f0ea, tie: 0x15151a, chest: 'blazer', sh: 'none', weapon: 'akisword', wc: 'fist' },
    stats: ST(620, 92, 300, 32, 62, 3.6, 27, 2.9, 0.85, 9.1, 2.4),
    innate: { name: 'Демон будущего', icon: 'akiinn', desc: 'Правый глаз видит на мгновение вперёд: Акито уклоняется от 20% атак — любых, от героев, миньонов, чудовищ и башен (от умений — нет). Уклоняясь, он оставляет послеобраз и на миг сдвигается в сторону.' },
    tick(h) {
      h.dodge = h.foreT > G.time ? 1 : 0.2;
      if (h.kat && (!h.alive || G.time > h.kat.until)) akiSheath(h);
      const r = h.rig; if (r.cig) r.cig.visible = h.smokeT > G.time && h.alive;
    },
    onDodge(h, src) {
      h.dodgeT = G.time + 0.25; const a = angTo(src.x, src.z, h.x, h.z) + (Math.random() < 0.5 ? HPI : -HPI); h.jolt = { a, p: 0.9, t: 0.16 };
      if (FX.near(h.x, h.z, 45)) { dshGhost(h, AKI.fut, 0.35, 0.35); FX.text(h.x, h.height + 0.5, h.z, 'уклон', '#b8e6ff', 13); FX.sparks(h.x, 1.4, h.z, { n: 3, color: 0xffffff, color2: AKI.fut, speed: [1, 3], life: [0.12, 0.25], w: 0.06 }); }
      SFX.at('whoosh', h.x, h.z, 0.35);
    },
    abilities: [
      {
        key: 'Q', name: 'Проклятый клинок', icon: 'akikat', cd: 12, cost: 50, range: 0, ind: { type: 'self', r: 3 }, anim: 'cut', animDur: 0.4, lock: 0.15, ai: { t: 'buff' },
        desc: 'Акито выхватывает катану, одним движением рассекая всё перед собой (урон в 3 перед ним), и следующие 4 атаки (не дольше 8 сек) бьют клинком: +0.7 к дальности и большой физический урон сверху. Четвёртый удар — проклятый: урон втрое больше, но клинок забирает 35% текущего здоровья Акито.',
        cast(h) {
          const lv = Math.max(1, h.al[0]), f = h.facing, cut = D(h, 45, 8, 0.4); if (h.kat) akiSheath(h);
          const r = h.rig; r.wc = 'melee'; r.tipR = r.katTip; r.katana.visible = true; r.hilt.visible = false; h.range = h.def.stats.range + 0.7; h.atkCd = Math.min(h.atkCd, 0.15);
          h.kat = { n: 4, until: G.time + 8, dmg: D(h, 38, 9, 0.45), big: D(h, 115, 26, 1.25) };
          addBuff(h, { id: 'katana', dur: 8, onHit: (u, t, bf) => {
            const K = u.kat; if (!K) return 0; K.n--; const fin = K.n <= 0, f2 = u.facing;
            if (!fin) { if (FX.near(t.x, t.z, 50)) { FX.slash(t.x, t.z, f2, { r: 2.4, sweep: 1.5, color: AKI.cur, life: 0.2, y: 1.3, flip: u.anim.alt }); FX.sparks(t.x, 1.3, t.z, { n: 6, color: 0xffffff, color2: AKI.cur, speed: [3, 9], life: [0.12, 0.3], dir: f2, spread: 0.7, w: 0.08 }); } SFX.at('slash', t.x, t.z, 0.8); return K.dmg; }
            // the fourth: the curse takes its due
            after(0.02, () => { if (!u.alive) return; const lost = u.hp * 0.35; u.hp = Math.max(1, u.hp - lost); u.flash = 1; if (FX.near(u.x, u.z, 50)) { FX.burst(u.x, 1.5, u.z, { n: 14, color: AKI.cur, color2: AKI.cdk, speed: [1, 4], life: [0.4, 0.8], size: [0.4, 0.05], grav: -10, up: 2 }); FX.text(u.x, u.height + 0.9, u.z, '−' + Math.round(lost), '#ff4a5a', 16); } if (u === G.player) FX.punch(0.5); });
            after(0.3, () => { if (u.kat === K) akiSheath(u); });
            if (FX.near(t.x, t.z, 55)) {
              FX.slash(t.x, t.z, f2, { r: 3.6, sweep: 2.2, color: AKI.cur, life: 0.3, y: 1.3 }); FX.slash(t.x, t.z, f2 + 0.4, { r: 3.2, sweep: 2.2, color: 0x2a0408, life: 0.34, y: 1.4, flip: true });
              FX.explosion(t.x, t.z, 1.8, AKI.cur, { color2: AKI.cdk, smoke: false, mark: false }); FX.glow(t.x, 1.4, t.z, 4, AKI.cur, 0.2, 'star');
              for (let i = 0; i < 3; i++) { const a = f2 + (i - 1) * 0.7; FX.beam(t.x - Math.sin(a) * 2.4, t.z - Math.cos(a) * 2.4, t.x + Math.sin(a) * 0.4, t.z + Math.cos(a) * 0.4, { color: 0x1a0204, w: 0.3, life: 0.5, y: 1.2 + i * 0.25 }); }
              FX.burst(t.x, 1.3, t.z, { n: 18, color: AKI.cur, color2: AKI.cdk, speed: [2, 7], life: [0.3, 0.7], size: [0.4, 0.05], grav: -12 }); FX.text(t.x, t.height + 1.3, t.z, 'ПРОКЛЯТИЕ', '#ff5a6a', 17);
            }
            SFX.at('crit', t.x, t.z, 1); SFX.at('heavy', t.x, t.z, 0.8); SFX.at('dark', t.x, t.z, 0.5); FX.shake(0.5); if (u === G.player || t === G.player) FX.hitstop(0.07);
            return K.big;
          } });
          // the draw itself cuts: a flat red arc in front of him
          SFX.at('slash', h.x, h.z, 1); SFX.at('whoosh', h.x, h.z, 0.6);
          for (const e of enemiesIn(h, h.x + Math.sin(f) * 1.6, h.z + Math.cos(f) * 1.6, 1.6)) { damage(h, e, cut, 0); FX.hit(e.x, 1.3, e.z, AKI.cur, true); }
          if (FX.near(h.x, h.z, 50)) { FX.slash(h.x + Math.sin(f) * 0.6, h.z + Math.cos(f) * 0.6, f, { r: 3.2, sweep: 2.4, color: AKI.cur, life: 0.24, y: 1.25 }); FX.sparks(h.x + Math.sin(f) * 1.5, 1.3, h.z + Math.cos(f) * 1.5, { n: 10, color: 0xffffff, color2: AKI.cur, speed: [4, 12], life: [0.12, 0.3], dir: f, spread: 1.2, w: 0.08 }); FX.glow(h.x - Math.sin(f) * 0.2, 1.2, h.z - Math.cos(f) * 0.2, 2, AKI.cur, 0.2, 'flare'); }
        }
      },
      {
        key: 'W', name: 'Перекур', icon: 'akismoke', cd: 15, cost: 40, range: 0, ind: { type: 'self', r: 1.5 }, anim: 'smoke', animDur: 0.8, lock: 0.1, ai: { t: 'shield' }, noCue: true,
        desc: 'Акито закуривает. 4 сек он восстанавливает здоровье — немного плюс 6% от максимума — и двигается на 10% быстрее. Сигарета дымит у него в зубах, пока действует.',
        cast(h) {
          const total = D(h, 55, 15, 0.25) + h.maxHp * 0.06, per = total / 8; h.smokeT = G.time + 4;
          addBuff(h, { id: 'smoke', dur: 4.02, ms: 0.1, every: 0.5, onTick: u => { heal(u, u, per, true); if (FX.near(u.x, u.z, 45)) { const f = u.facing; akiSmoke(u.x + Math.sin(f) * 0.35, u.height - 0.35, u.z + Math.cos(f) * 0.35, 2, 0.8); FX.burst(u.x, 1.2, u.z, { n: 1, color: 0x9fe08a, color2: 0x9fe08a, speed: [0.1, 0.4], life: [0.5, 0.8], size: [0.26, 0.04], up: 1.8, rad: 0.6 }); } }, onEnd: u => { u.smokeT = 0; if (FX.near(u.x, u.z, 45)) { akiSmoke(u.x, u.height - 0.3, u.z, 4, 1.1); FX.sparks(u.x + Math.sin(u.facing) * 0.4, u.height - 0.4, u.z + Math.cos(u.facing) * 0.4, { n: 4, color: 0xffd0a0, color2: 0xff7a2a, speed: [0.5, 2], life: [0.4, 0.8], up: 1, grav: -6, w: 0.06 }); } } });
          SFX.at('fire', h.x, h.z, 0.35); after(0.35, () => { if (!h.alive) return; const f = h.facing; FX.glow(h.x + Math.sin(f) * 0.4, h.height - 0.35, h.z + Math.cos(f) * 0.4, 0.9, 0xff8a3a, 0.4, 'star'); FX.sparks(h.x + Math.sin(f) * 0.4, h.height - 0.35, h.z + Math.cos(f) * 0.4, { n: 4, color: 0xffd0a0, color2: 0xff7a2a, speed: [0.3, 1.2], life: [0.2, 0.4], up: 1, w: 0.05 }); });
          after(0.75, () => { if (h.alive) akiSmoke(h.x, h.height - 0.3, h.z, 5, 1.2); });
        }
      },
      {
        key: 'E', name: 'Шаг в будущее', icon: 'akistep', cd: 13, cost: 45, range: 7, ind: { type: 'line', w: 1.4 }, lock: 0, ai: { t: 'gap', escape: true },
        desc: 'Демон будущего показывает, куда шагнуть: рывок на 7, и следующие 2 сек Акито уклоняется от всех атак без исключения. Первая атака после рывка критическая (+80% урона).',
        cast(h, p) {
          const x0 = h.x, z0 = h.z; SFX.at('dash', h.x, h.z, 0.8); SFX.at('warp', h.x, h.z, 0.4); dshGhost(h, AKI.fut, 0.5, 0.45); FX.ring(h.x, h.z, { r0: 2, r1: 0.4, color: AKI.fut, life: 0.25, tex: 'ringThin' });
          let n = 0;
          dashTo(h, p.x, p.z, 40, { ribbon: AKI.fut, trail: u => { if (++n % 3 === 0) dshGhost(u, AKI.fut, 0.3, 0.3); },
            onEnd: u => {
              u.foreT = G.time + 2; u.atkCd = Math.min(u.atkCd, 0.1); const b = addBuff(u, { id: 'foresight', dur: 2, onHit: (q, t, bf) => { if (bf.used) return 0; bf.used = true; if (FX.near(t.x, t.z, 45)) { FX.text(t.x, t.height + 1, t.z, 'ПРЕДВИДЕЛ', '#b8e6ff', 15); FX.glow(t.x, 1.4, t.z, 3, AKI.fut, 0.2, 'star'); } SFX.at('crit', t.x, t.z, 0.7); return q.ad * 0.8; } });
              if (b) b.fx = FX.aura(u, AKI.fut, 2, u.radius + 0.6, 'ringThin', 6); FX.ring(u.x, u.z, { r0: 0.4, r1: 2.4, color: AKI.fut, life: 0.3, tex: 'shock' }); FX.beam(x0, z0, u.x, u.z, { color: AKI.fut, w: 0.3, life: 0.3, y: 1.3 });
            } });
        }
      },
      {
        key: 'R', name: 'Кон', icon: 'akifox', cd: 80, cost: 100, range: 9.5, ind: { type: 'target' }, anim: 'kon', animDur: 0.9, lock: 0.5, ai: { t: 'target', ult: true, hp: 0.6 },
        desc: '«Кон». Акито складывает пальцы лисой — и через 0.35 сек под целью разверзается земля: из неё вырывается огромная голова демона-лисы и смыкает пасть на враге. Огромный физический урон и оглушение на 0.8 сек; враги рядом с целью получают треть урона. Потом голова уходит обратно под землю.',
        cast(h, p) {
          const t = p.unit; if (!t || !t.alive) return false; const dmg = D(h, 230, 42, 1.3), T0 = 0.35;
          SFX.at('ultcue', h.x, h.z, 0.5); if (FX.near(h.x, h.z, 45)) FX.text(h.x, h.height + 1.2, h.z, 'Кон.', '#ffc890', 18);
          after(0.12, () => { if (!h.alive) return; const f = h.facing; FX.glow(h.x + Math.sin(f) * 1.0, h.height - 0.1, h.z + Math.cos(f) * 1.0, 2.4, AKI.c, 0.5, 'star'); FX.sparks(h.x + Math.sin(f) * 1.0, h.height - 0.1, h.z + Math.cos(f) * 1.0, { n: 8, color: AKI.pale, color2: AKI.c, speed: [0.5, 2], life: [0.3, 0.6], up: 2, w: 0.06 }); });
          // where the fox comes from: always from beyond the target as the camera sees it, facing the viewer, so its face and open jaws are seen as it strikes
          const S = 3.0, tgt = { x: t.x, z: t.z }, sp = q => ({ x: tgt.x, z: tgt.z - q }), yaw = 0;
          telegraph(h, t.x, t.z, 2.4, T0 + 0.55, AKI.c);
          after(T0, () => {
            if (t.alive) { tgt.x = t.x; tgt.z = t.z; }
            const s0 = sp(3.9), F = akiFox(), LIFE = 1.55, BITE = 0.55; let bit = false;
            F.root.scale.setScalar(S); F.head.rotation.y = 0;
            // the ground splits under it: a dark rift ringed with fox fire
            SFX.at('rubble', s0.x, s0.z, 1); SFX.at('bigboom', s0.x, s0.z, 0.4); FX.shake(0.45); FX.shock(s0.x, s0.z, 7, 1.1, 0.4);
            const rift = new THREE.Mesh(FX.geo.flat, FX.mat('fill', 0x140604, 0.85, false)); rift.position.set(s0.x, 0.08, s0.z); rift.renderOrder = 4;
            FX.add(rift, LIFE + 0.3, (k, me, dt, en) => { const g = easeOut(Math.min(1, en.t / 0.2)), o = en.t > LIFE - 0.1 ? Math.max(0, 1 - (en.t - LIFE + 0.1) / 0.4) : 1; me.scale.set(7.5 * g, 1, 7.5 * g); me.material.opacity = 0.85 * o; });
            FX.ring(s0.x, s0.z, { r0: 0.5, r1: 4.2, color: 0xffe0d8, life: 0.45, tex: 'shock' }); FX.zone(s0.x, s0.z, 3.6, AKI.cur, LIFE, { tex: 'crack', spin: 0, op: 0.9 });
            FX.debris(s0.x, 0.4, s0.z, { n: 16, color: 0x4a4038, speed: [3, 10], up: 12, size: [0.25, 0.6], rad: 1.5 });
            const fe = FX.add(F.root, LIFE + 0.05, null);   // through FX, so a match that ends mid-bite takes the head away too
            G.actors.push({ t: 0, update(dt) {
              const e = this.t += dt, P0 = s0, k1 = Math.min(1, e / 0.4);
              // fox fire licking round the rift while the head is out
              if (e < LIFE - 0.2 && Math.random() < dt * 14 && FX.near(P0.x, P0.z, 55)) { const a = rand(TAU), r = rand(1.8, 3.4); FX.flame(P0.x + Math.sin(a) * r, 0.3, P0.z + Math.cos(a) * r, { n: 1, color: 0xffd0c0, color2: AKI.cur, speed: [0.3, 1.2], life: [0.3, 0.55], size: [0.7, 1.5], up: 3, a: 0.45 }); }
              // rise out of the rift looking up with the jaws opening -> lunge forward and down -> the jaws shut on the target -> worry it -> sink back into the earth, fading
              let dist0 = 3.9, y = 3.7, pitch = -0.6, jawA = 0.2, roll = 0, sc = 1, op = 1;
              if (e < 0.4) { const q = easeOut(k1); y = lerp(-3.5 * S, 3.9, q) + Math.sin(Math.PI * q) * 0.9; pitch = lerp(-0.9, -0.45, q); jawA = lerp(0.1, 1.15, q); sc = lerp(0.6, 1, q); }
              else if (e < BITE) { const q = (e - 0.4) / (BITE - 0.4), qe = q * q; dist0 = lerp(3.9, 2.3, qe); y = lerp(3.9, 3.3, qe); pitch = lerp(-0.45, 0.25, qe); jawA = q < 0.65 ? 1.2 : lerp(1.2, 0, (q - 0.65) / 0.35); }
              else if (e < 1.0) { const q = (e - BITE) / (1.0 - BITE); dist0 = 2.3; y = 3.3 + Math.sin(e * 34) * 0.14 * (1 - q); pitch = 0.25 + Math.sin(e * 28) * 0.08 * (1 - q); jawA = 0; roll = Math.sin(e * 40) * 0.16 * (1 - q); }
              else { const q = Math.min(1, (e - 1.0) / (LIFE - 1.0)), qe = q * q; dist0 = lerp(2.3, 4.0, q); y = lerp(3.3, -3.5 * S, qe); pitch = lerp(0.25, -0.4, q); jawA = lerp(0, 0.6, q); sc = lerp(1, 0.8, q); op = q < 0.35 ? 1 : 1 - (q - 0.35) / 0.65; }
              const c = sp(dist0); F.root.position.set(c.x, y, c.z); F.root.rotation.y = yaw; F.head.rotation.x = pitch; F.head.rotation.z = roll; F.jaw.rotation.x = jawA; F.root.scale.setScalar(S * sc);
              F.mat.opacity = op; F.gmat.opacity = op; for (const s of F.eyes) s.material.opacity = 0.9 * op;
              // each phase has its own effects: dust and sparks as it breaks out, rushing streaks as it lunges, eyes flaring, blood as it worries the prey, motes of light peeling off as it sinks
              const bx0 = t.alive ? t.x : tgt.x, bz0 = t.alive ? t.z : tgt.z, near = FX.near(c.x, c.z, 55);
              if (near && !this.out) { this.out = true; FX.burst(c.x, 0.4, c.z, { smoke: true, n: 8, color: 0x5a544c, color2: 0x1a1816, speed: [1, 4], life: [0.5, 1.0], size: [1, 2.2], up: 1.2, rad: 2.4, a: 0.45 }); FX.sparks(c.x, 0.5, c.z, { n: 10, color: 0xffd0c8, color2: AKI.cur, speed: [3, 10], life: [0.3, 0.7], up: 12, grav: -8, w: 0.1, rad: 1.5 }); }
              if (near && e > 0.4 && !this.lunge) { this.lunge = true; FX.implode(bx0, 1.4, bz0, 5, { n: 18, color: 0xffffff, color2: AKI.cur, life: 0.18, streak: true }); FX.warp('lens', bx0, 1.4, bz0, { r: 4, str: 1, life: 0.3 }); SFX.at('whoosh', bx0, bz0, 1); }
              if (e > 0.25 && e < BITE) for (const s of F.eyes) s.scale.setScalar(0.75 + (e - 0.25) * 4); else if (e >= BITE) for (const s of F.eyes) s.scale.setScalar(Math.max(0.75, 2.2 - (e - BITE) * 4));
              if (bit && e < 1.0 && near && (this.dr = (this.dr || 0) + dt) > 0.07) { this.dr = 0; FX.burst(bx0, 1.3, bz0, { n: 3, color: AKI.cur, color2: AKI.cdk, speed: [1, 4], life: [0.3, 0.6], size: [0.35, 0.05], grav: -12, up: 2 }); }
              if (e > 1.0 && near && Math.random() < dt * 30) FX.sparks(c.x + rand(-1.5, 1.5) * S * sc, Math.max(0.3, y + rand(-1, 2)), c.z + rand(-0.5, 0.5) * S, { n: 1, color: 0xffffff, color2: 0xffb0a0, speed: [0.3, 1.2], life: [0.5, 0.9], up: 5, grav: -1, drag: 1, w: 0.09, stretch: 0.06 });
              if (!bit && e >= BITE) {   // the jaws shut
                bit = true; const bx = t.alive ? t.x : tgt.x, bz = t.alive ? t.z : tgt.z;
                if (t.alive && targetable(h, t)) { damage(h, t, dmg, 0); if (t.alive) stun(h, t, 0.8); }
                for (const o of enemiesIn(h, bx, bz, 2.6)) if (o !== t) { damage(h, o, dmg / 3, 0); FX.hit(o.x, 1.3, o.z, AKI.c, false); }
                SFX.at('bigboom', bx, bz, 1); SFX.at('crit', bx, bz, 1); SFX.at('heavy', bx, bz, 1); FX.shake(1.0); FX.punch(1); if (h === G.player || t === G.player) FX.hitstop(0.1);
                FX.light(bx, 3, bz, AKI.cur, 1.4, 20, 0.45); FX.shock(bx, bz, 6, 1.3, 0.45); FX.glow(bx, 1.4, bz, 4, AKI.cur, 0.16, 'star');
                FX.burst(bx, 1.4, bz, { n: 26, color: AKI.cur, color2: AKI.cdk, speed: [2, 9], life: [0.3, 0.8], size: [0.5, 0.06], grav: -12, up: 4 }); FX.sparks(bx, 1.4, bz, { n: 14, color: 0xffd0c8, color2: AKI.cur, speed: [6, 18], life: [0.15, 0.4], w: 0.1 });
                FX.scorch(bx, bz, 2.2, AKI.cur, 6);
                if (FX.near(bx, bz, 45)) FX.text(bx + 2.5, 6.5, bz, 'КОН!', '#ffb070', 24);
                // the jaws: two crescents closing on the target, a ring of fang marks driven inward, a heat ring, a pool of blood left on the ground
                FX.slash(bx, bz, 0, { r: 3.2, sweep: 2.6, color: 0xb05a5a, life: 0.22, y: 2.0 }); FX.slash(bx, bz, Math.PI, { r: 3.2, sweep: 2.6, color: AKI.cur, life: 0.26, y: 0.8, flip: true });
                for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; FX.beam(bx + Math.sin(a) * 2.8, bz + Math.cos(a) * 2.8, bx + Math.sin(a) * 0.5, bz + Math.cos(a) * 0.5, { color: i % 2 ? 0xc89a94 : 0x9a3a3a, w: 0.14, life: 0.22, y: 1.0 + (i % 3) * 0.3, op: 0.7 }); }
                FX.explosion(bx, bz, 1.8, 0x8a0a14, { color2: AKI.cdk, smoke: false, mark: false }); FX.warp('ring', bx, 0, bz, { r: 5, str: 1.2, life: 0.45 });
                const pool = new THREE.Mesh(FX.geo.flat, FX.mat('fill', 0x3a0408, 0.8, false)); pool.position.set(bx, 0.06, bz); pool.rotation.y = rand(TAU); pool.renderOrder = 3; FX.add(pool, 5, (k, me, dt, en) => { const g = easeOut(Math.min(1, en.t / 0.5)); me.scale.set(3.6 * g, 1, 3 * g); me.material.opacity = 0.8 * (1 - k * k); });
                for (let i = 0; i < 3; i++) after(0.05 + i * 0.07, () => FX.ring(bx, bz, { r0: 0.5, r1: 3 + i * 1.2, color: i % 2 ? 0xc89a94 : AKI.cur, life: 0.4, tex: i ? 'ringThin' : 'shock', op: 0.7 }));
              }
              if (e >= LIFE) { fe.dead = true; F.mat.dispose(); F.gmat.dispose(); for (const s of F.eyes) s.material.dispose(); return false; }
              return true;
            } });
          });
        }
      }
    ]
  }
);
