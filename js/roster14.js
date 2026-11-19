'use strict';
/* ===== roster, parts 40–41 (heroes 67–68). Loaded after roster13.js; glyphs go to GLYPH at the end.
   67. Marfa — the field cook: pies thrown at friends (dinner) and at enemies (in the face), a cauldron of soup, a frying pan, and a banquet.
   68. Anselm — the priest of the goddess, a healer with a weakness for wine: healing, holy chains, a toast to the team,
       and the light of the goddess that cleanses and shields everyone under it. ===== */
const MRF = { c: 0xffb04a, soup: 0x9ad84a, crust: 0xd89a48, steam: 0xf4f0e8 };
const ANS = { c: 0xffd86a, pale: 0xfff4c8, deep: 0x8a6a10, wine: 0x8a1a3a };

/* ==================================================================== 67. MARFA ==================================================================== */
// food: a pie with a crimped crust, a roast leg, a bowl of soup — shared templates, cloned per throw
let _mrfFood = null;
function mrfFood(kind, s) {
  if (!_mrfFood) {
    _mrfFood = {}; const mk = (fn) => { const g = new THREE.Group(), k = kit(); fn(k); k.into(g, new THREE.MeshPhongMaterial({ vertexColors: true, flatShading: true, shininess: 30 }), new THREE.MeshBasicMaterial({ vertexColors: true })); return g; };
    _mrfFood.pie = mk(k => { k.y(0.32, 0.28, 0.16, 12, MRF.crust, 0, 0.08, 0).y(0.3, 0.32, 0.06, 12, 0xe8b868, 0, 0.18, 0); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; k.i(0.05, 0xc88a3a, Math.sin(a) * 0.3, 0.19, Math.cos(a) * 0.3); } k.b(0.2, 0.02, 0.04, 0x8a5a2a, 0, 0.22, 0, 0, 0.5, 0).b(0.2, 0.02, 0.04, 0x8a5a2a, 0, 0.22, 0, 0, -0.5, 0); });
    _mrfFood.leg = mk(k => { k.i(0.2, 0xb8682a, 0, 0.18, 0, 1).y(0.05, 0.05, 0.3, 6, 0xf0e8d8, 0, 0.18, 0.28, HPI).i(0.06, 0xf0e8d8, 0.03, 0.18, 0.44).i(0.06, 0xf0e8d8, -0.03, 0.18, 0.44); });
    _mrfFood.soup = mk(k => { k.y(0.28, 0.18, 0.18, 12, 0xe8e4dc, 0, 0.09, 0).y(0.25, 0.25, 0.02, 12, MRF.soup, 0, 0.17, 0).i(0.04, 0xff8a3a, 0.08, 0.18, 0.05).i(0.04, 0xf0e070, -0.07, 0.18, -0.06); });
  }
  const c = _mrfFood[kind].clone(true); c.scale.setScalar(s || 1); return c;
}
// fed (innate): whoever eats her cooking is full for 6 s — 1% of max health back every second and 10% faster
function mrfFeed(h, o) { addBuff(o, { id: 'fed', dur: 6, ms: 0.1, src: h, every: 1, onTick: (u, b) => heal(h, u, u.maxHp * 0.01, true) }); }
// a pie thrown along a line: the first one it reaches is fed (an allied hero) or gets it in the face (an enemy: damage and a moment's blindness)
function mrfPie(h, dir, heal1, dmg) {
  const A = h.rig && h.rig.handR ? (h.rig.handR.getWorldPosition(new THREE.Vector3()), { x: h.x + Math.sin(dir) * 0.8, z: h.z + Math.cos(dir) * 0.8 }) : { x: h.x, z: h.z };
  let done = false; SFX.at('whoosh', h.x, h.z, 0.6);
  const p = shot(h, { x: A.x, z: A.z, y: 1.5, dir, speed: 24, range: 9, w: 0.8, mesh: false, ribbon: 0.3, color: MRF.crust,
    onHit(e) { done = true; damage(h, e, dmg, 1); addBuff(e, { id: 'blind', dur: 1.2, blind: true, src: h }); if (FX.near(e.x, e.z, 50)) { FX.burst(e.x, e.height * 0.8, e.z, { n: 12, color: 0xf0d090, color2: 0xc88a3a, speed: [2, 5], life: [0.3, 0.6], size: [0.25, 0.05], grav: -10 }); FX.text(e.x, e.height + 0.8, e.z, 'в лицо!', '#ffcf7a', 13); } SFX.at('splat', e.x, e.z, 0.55); SFX.at('pop', e.x, e.z, 0.4); },
    onAlly(o) { if (done) return; done = true; heal(h, o, heal1); mrfFeed(h, o); SFX.at('munch', o.x, o.z, 0.55); if (FX.near(o.x, o.z, 50)) { FX.heal(o, MRF.c); FX.text(o.x, o.height + 0.8, o.z, 'ням!', '#ffd86a', 13); } p.left = 0; } });
  if (FX.near(h.x, h.z, 55)) { const m = mrfFood('pie', 1.3); FX.add(m, 1, (k, me, dt, en) => { if (!G.proj.includes(p) || done) { en.dead = true; return; } me.position.set(p.x, p.y + Math.sin(en.t * 6) * 0.15, p.z); me.rotation.x += dt * 10; me.rotation.y += dt * 4; }); }
}
// a cauldron set down and bubbling for 6 s: friends near it eat and heal, enemies choke in the steam (slow)
function mrfCauldron(h, x, z, tick) {
  const R = 4.5, DUR = 6, near = FX.near(x, z, 60); SFX.at('mace', x, z, 0.7); SFX.at('water', x, z, 0.5);
  if (near) {
    const g = new THREE.Group(), k = kit(); k.y(0.7, 0.55, 0.9, 14, 0x2e2e36, 0, 0.5, 0).y(0.74, 0.74, 0.08, 14, 0x4a4a54, 0, 0.95, 0).y(0.66, 0.66, 0.04, 14, MRF.soup, 0, 0.92, 0);
    for (let i = 0; i < 3; i++) { const a = i / 3 * TAU; k.b(0.08, 0.4, 0.08, 0x2e2e36, Math.sin(a) * 0.45, 0.1, Math.cos(a) * 0.45); }
    k.y(0.03, 0.03, 1.2, 6, 0x6a4a2a, 0.3, 1.3, 0, 0, 0, 0.4).y(0.3, 0.4, 0.15, 8, 0xff6a2a, 0, 0.05, 0);
    k.into(g, new THREE.MeshPhongMaterial({ vertexColors: true, flatShading: true, shininess: 40 }), new THREE.MeshBasicMaterial({ vertexColors: true }));
    FX.add(g, DUR + 0.3, (kk, me, dt, en) => { const t = en.t, drop = Math.min(1, t / 0.3); me.position.set(x, 4 * (1 - drop * drop), z); me.scale.setScalar(t > DUR ? Math.max(0.01, 1 - (t - DUR) / 0.3) : 1);
      if (Math.random() < dt * 8) FX.burst(x + rand(-0.4, 0.4), 1.0, z + rand(-0.4, 0.4), { n: 1, color: 0xe8ffc0, color2: MRF.soup, speed: [0.3, 1], life: [0.3, 0.6], size: [0.18, 0.04], up: 2 });
      if (Math.random() < dt * 5) FX.burst(x, 1.4, z, { smoke: true, n: 1, color: MRF.steam, color2: 0x9a9a9a, speed: [0.3, 1], life: [1, 1.8], size: [0.8, 1.8], up: 1.5, a: 0.3 }); if (Math.random() < dt * 6) FX.flame(x, 0.15, z, { n: 1, color: 0xff8a2a, color2: 0x8a2a05, size: [0.3, 0.6], life: [0.3, 0.5], up: 1 }); });
    FX.zone(x, z, R, MRF.c, DUR, { tex: 'rune', spin: 0.3, op: 0.35 });
  }
  zone(h, { x, z, r: R, every: 0.5, dur: DUR, tick: () => {
    for (const o of G.heroes) if (o.alive && o.team === h.team && dist(o.x, o.z, x, z) < R) { heal(h, o, tick, true); if (!o.buffs.some(b => b.id === 'fed')) mrfFeed(h, o); }
    for (const e of enemiesIn(h, x, z, R)) if (!e.struct) slow(h, e, 0.2, 0.6, 'mrfsteam');
  } });
}
// a frying pan to the head: a dull clang, stars and a stun
function mrfBonk(h, t, dmg) {
  after(0.22, () => {
    if (!t.alive) return; damage(h, t, dmg, 0); if (t.alive) stun(h, t, 1.0); SFX.at('pan', t.x, t.z, 1); SFX.at('heavy', t.x, t.z, 0.5);
    if (FX.near(t.x, t.z, 50)) { FX.text(t.x, (t.height || 2) + 1, t.z, 'БОНЬК!', '#ffd86a', 20); FX.ring(t.x, t.z, { r0: 0.3, r1: 2, color: 0xfff3a0, life: 0.3, tex: 'ringThin', y: t.height || 2 }); FX.sparks(t.x, t.height || 2, t.z, { n: 10, color: 0xffffff, color2: 0xfff3a0, speed: [3, 7], life: [0.2, 0.4], w: 0.07 }); FX.hitstop(0.06); FX.shake(0.2); }
  });
}
// the banquet: dishes fly from her to every friend nearby — a pie, a roast leg, a bowl of soup — and everyone eats
function mrfBanquet(h, amt) {
  const R = 14; SFX.at('ultcue', h.x, h.z, 0.55); SFX.at('bell', h.x, h.z, 0.75); SFX.at('heal', h.x, h.z, 0.5); if (FX.near(h.x, h.z, 55)) { FX.text(h.x, h.height + 1.3, h.z, 'К столу!', '#ffd86a', 20); FX.ring(h.x, h.z, { r0: 0.5, r1: R, color: MRF.c, life: 0.6, tex: 'rune', op: 0.5 }); }
  const kinds = ['pie', 'leg', 'soup']; let n = 0;
  for (const o of G.heroes) {
    if (!o.alive || o.team !== h.team || udist(h, o) > R) continue; const kind = kinds[n++ % 3], T = 0.35 + udist(h, o) / 30, sx = h.x, sz = h.z;
    if (FX.near(h.x, h.z, 60)) { const m = mrfFood(kind, 1.6); FX.add(m, T, (k, me) => { me.position.set(lerp(sx, o.x, k), 1.6 + Math.sin(Math.PI * k) * 3, lerp(sz, o.z, k)); me.rotation.y += 0.2; }); }
    after(T, () => { if (!o.alive) return; addBuff(o, { id: 'banquet', dur: 4, ms: 0.15, dmgOut: 1.15, amp: h, src: h, every: 0.5, onTick: u => heal(h, u, amt / 8, true) }); mrfFeed(h, o); SFX.at('munch', o.x, o.z, 0.5);
      if (FX.near(o.x, o.z, 50)) { FX.heal(o, MRF.c); FX.burst(o.x, o.height * 0.8, o.z, { n: 10, color: 0xfff0b0, color2: MRF.c, speed: [1, 3], life: [0.4, 0.8], size: [0.25, 0.04], up: 2 }); FX.text(o.x, o.height + 0.9, o.z, ['ням!', 'вкуснотища!', 'добавки!'][Math.floor(Math.random() * 3)], '#ffd86a', 13); } });
  }
}

/* ==================================================================== 68. ANSELM ==================================================================== */
// the goddess's mercy (innate): his healing is 40% stronger on an ally below 40% health
function ansHeal(h, o, amt) { heal(h, o, amt * (o.hp / o.maxHp < 0.4 ? 1.4 : 1)); }
function ansSigil(x, z, r, life) { if (FX.near(x, z, 60)) { FX.zone(x, z, r, ANS.c, life, { tex: 'rune', spin: 0.8, op: 0.7 }); } }
// holy chains: a bolt of golden light; the first enemy hero it reaches is bound by chains of light that rise out of the ground
function ansChains(h, dir, dmg, dur) {
  SFX.at('holy', h.x, h.z, 0.55); SFX.at('chain', h.x, h.z, 0.35);
  shot(h, { dir, speed: 30, range: 10, w: 0.8, heroOnly: true, mesh: 'bolt', size: 1.2, color: ANS.c, ribbon: 0.8,
    onHit(e) {
      damage(h, e, dmg, 1); root(h, e, dur, ANS.c); SFX.at('chain', e.x, e.z, 0.8); SFX.at('bell', e.x, e.z, 0.4); if (!FX.near(e.x, e.z, 55)) return;
      for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.4; FX.add(new THREE.Group(), dur, (k, me, dt, en) => { if (!e.alive) { en.dead = true; return; } if (Math.random() < dt * 12) { const ox = e.x + Math.sin(a) * 1.6, oz = e.z + Math.cos(a) * 1.6; FX.beam(ox, oz, e.x, e.z, { color: ANS.c, w: 0.15, life: 0.12, y: 0.4 + Math.sin(en.t * 6 + i) * 0.5 + 0.6 }); } }); }
      FX.ring(e.x, e.z, { r0: 0.4, r1: 1.8, color: ANS.c, life: 0.4, tex: 'rune' }); FX.glow(e.x, 1.2, e.z, 2.4, ANS.c, 0.25, 'star');
    } });
}
// the light of the goddess: a column of gold falls from the sky — friends inside are freed from every hold, healed and shielded, enemies burn
function ansLight(h, x, z, healAmt, dmg) {
  const R = 7, T = 0.6; SFX.at('ultcue', x, z, 0.6); SFX.at('spirit', x, z, 0.55); ansSigil(x, z, R, T + 0.5); if (FX.near(x, z, 60)) FX.decal(x, z, R, ANS.c, T);
  after(T, () => {
    for (const o of G.heroes) if (o.alive && o.team === h.team && dist(o.x, o.z, x, z) < R) {
      for (const b of o.buffs) if (b.stun || b.root || b.slow || b.silence || b.blind) b.dead = true;
      ansHeal(h, o, healAmt); addBuff(o, { id: 'goddess', dur: 4, dmgIn: 0.7, src: h }); if (FX.near(o.x, o.z, 50)) { FX.heal(o, ANS.c); FX.aura(o, ANS.c, 4, 1.4, 'ringThin', 2); }
    }
    for (const e of enemiesIn(h, x, z, R)) { if (e.struct) continue; damage(h, e, dmg, 1); if (e.alive) slow(h, e, 0.4, 2, 'goddess'); }
    SFX.at('holy', x, z, 1); SFX.at('bell', x, z, 0.7); SFX.at('heal', x, z, 0.6); if (!FX.near(x, z, 70)) return;
    FX.pillar(x, z, { r: R * 0.55, h: 30, color: ANS.c, life: 0.9, op: 0.4, grow: true }); FX.pillar(x, z, { r: 1.6, h: 34, color: ANS.pale, life: 0.6, op: 0.5 });
    FX.ring(x, z, { r0: 0.5, r1: R + 1, color: ANS.c, life: 0.6, tex: 'shock', op: 0.7 }); FX.light(x, 6, z, ANS.c, 3, 26, 0.8); FX.shock(x, z, R, 0.8, 0.5);
    for (let i = 0; i < 18; i++) { const a = rand(TAU), r = rand(0.5, R); FX.burst(x + Math.sin(a) * r, rand(4, 12), z + Math.cos(a) * r, { n: 1, color: 0xffffff, color2: ANS.c, speed: [0.2, 0.6], life: [0.8, 1.4], size: [0.3, 0.05], grav: 2 }); }
  });
}

HEROES.push(
  /* ================= 67. Marfa ================= */
  {
    id: 'marfa', name: 'Марфа', title: 'Полевая повариха', role: 'support', roleName: 'Кормилица', build: 'support', bars: [2, 4, 3, 2], diffc: 1, atkSfx: 'hit',
    lore: 'Марфа кормит армию двадцать лет и ни разу не дала никому уйти в бой голодным. Котёл у неё за спиной, половник в руке, сковорода — на всякий случай. Своих она угощает пирожками, чужим отправляет те же пирожки в лицо. А если позвать её к общему столу — накормит всю команду так, что встанут и пойдут в атаку.',
    look: { bulk: 1.15, h: 0.98, scale: 1.0, c1: 0xb8402e, c2: 0x5a1a14, c3: 0x3a2418, skin: 0xf0d0b8, hands: 0xf0d0b8, metal: 0xb8bcc4, glow: MRF.c, head: 'cook', hair: 0x6a3a22, tie: 0xd8402a, chest: 'cookapron', legs: 'socks', sh: 'sleeve', shirt: 0xf2eee6, weapon: 'ladle', wc: 'melee', back: 'pot' },
    stats: ST(600, 86, 420, 44, 44, 2.6, 26, 3.0, 0.7, 8.8, 2.6),
    innate: { name: 'Сытость', icon: 'mrfinn', desc: 'Кто поел у Марфы, тот сыт 6 сек: восстанавливает 1% здоровья в секунду и бегает на 10% быстрее. Сытость дают все её угощения.' },
    abilities: [
      {
        key: 'Q', name: 'Пирожок!', icon: 'mrfpie', cd: 7, cost: 55, range: 9, ind: { type: 'line', w: 1.6, fixed: true }, anim: 'deal', animDur: 0.4, lock: 0.2, ai: { t: 'shot', sp: 24, healLine: true },
        desc: 'Марфа бросает пирожок (до 9). Союзный герой ловит его и лечится (и сыт), вражеский получает пирожком в лицо: магический урон и ослепление на 1.2 сек — его атаки мажут.',
        cast(h, p) { mrfPie(h, p.dir, D(h, 80, 24, 0, 0.6), D(h, 60, 16, 0, 0.45)); }
      },
      {
        key: 'W', name: 'Котёл', icon: 'mrfpot', cd: 15, cost: 80, range: 7, ind: { type: 'circle', r: 4.5 }, anim: 'stir', animDur: 0.6, lock: 0.3, ai: { t: 'sanct' },
        desc: 'Марфа ставит котёл с похлёбкой (до 7) на 6 сек. Союзные герои рядом (4.5) каждые полсекунды лечатся и становятся сытыми, а враги давятся паром и замедляются на 20%.',
        cast(h, p) { mrfCauldron(h, p.x, p.z, D(h, 12, 3.5, 0, 0.09)); }
      },
      {
        key: 'E', name: 'Сковородой!', icon: 'mrfpan', cd: 12, cost: 50, range: 2.8, ind: { type: 'target' }, anim: 'bonk', animDur: 0.5, lock: 0.3, ai: { t: 'target' },
        desc: 'Марфа от души бьёт врага (до 2.8) сковородой по голове: физический урон и оглушение на 1 сек.',
        cast(h, p) { const t = p.unit; if (!t || !t.alive) return false; mrfBonk(h, t, D(h, 55, 15, 0.5, 0.2)); }
      },
      {
        key: 'R', name: 'Банкет', icon: 'mrfbanq', cd: 85, cost: 120, range: 0, ind: { type: 'self', r: 14 }, anim: 'heroic', animDur: 0.6, lock: 0.3, ai: { t: 'save', r: 12, hp: 0.5, ult: true },
        desc: '«К столу!» Каждому союзному герою в радиусе 14 летит своё блюдо — пирожок, жареная ножка или миска супа. Поевшие 4 сек лечатся (всего — много), наносят на 15% больше урона и бегают на 15% быстрее, и они сыты.',
        cast(h) { mrfBanquet(h, D(h, 200, 60, 0, 1.0)); }
      }
    ]
  },
  /* ================= 68. Anselm ================= */
  {
    id: 'anselm', name: 'Ансельм', title: 'Жрец Богини', role: 'support', roleName: 'Лекарь', build: 'support', bars: [2, 3, 3, 2], diffc: 1, atkSfx: 'cast', projMesh: 'orb',
    lore: 'Ансельм — жрец Богини и, пожалуй, лучший лекарь, какого видел этот край. Ещё он любит вино, и не особенно это скрывает: «Богиня простит — она добрая». Он лечит раны, сковывает врагов святыми цепями и поднимает тосты за друзей прямо посреди боя. А когда дела совсем плохи, он просит Богиню о свете — и свет приходит.',
    look: { bulk: 0.95, h: 1.1, scale: 1.0, c1: 0xdedad2, c2: 0xccc4b4, c3: 0x5a4a3a, skin: 0xead2c0, hands: 0xead2c0, cuff: 0xdedad2, metal: 0xd8b04a, glow: ANS.c, head: 'anselm', hair: 0xb89a6a, lin: 0x3a6ab8, chest: 'priest', robe: true, sh: 'cloth', weapon: 'priestaff', wc: 'staff' },
    stats: ST(560, 80, 480, 50, 42, 2.3, 22, 2.6, 0.66, 8.8, 6.5),
    innate: { name: 'Божья милость', icon: 'ansinn', desc: 'Лечение Ансельма на 40% сильнее, если у союзника меньше 40% здоровья.' },
    abilities: [
      {
        key: 'Q', name: 'Исцеление', icon: 'ansheal', cd: 6, cost: 60, range: 8, ind: { type: 'ally' }, anim: 'cast', animDur: 0.4, lock: 0.2, ai: { t: 'healAlly' },
        desc: 'Ансельм лечит союзного героя (до 8) или себя: сразу и ещё 30% от этого за 3 сек.',
        cast(h, p) { const o = p.unit && p.unit.alive ? p.unit : h, amt = D(h, 95, 28, 0, 0.6); ansHeal(h, o, amt); addBuff(o, { id: 'anshot', dur: 3, every: 1, src: h, onTick: u => ansHeal(h, u, amt * 0.1) }); SFX.at('heal', o.x, o.z, 0.6); SFX.at('holy', o.x, o.z, 0.45); if (FX.near(o.x, o.z, 50)) { FX.heal(o, ANS.c); FX.pillar(o.x, o.z, { r: 0.8, h: 6, color: ANS.c, life: 0.4, op: 0.4 }); FX.ring(o.x, o.z, { r0: 0.4, r1: 1.8, color: ANS.c, life: 0.4, tex: 'rune' }); } }
      },
      {
        key: 'W', name: 'Святые оковы', icon: 'anschain', cd: 12, cost: 70, range: 10, ind: { type: 'line', w: 1.6, fixed: true }, anim: 'cast', animDur: 0.4, lock: 0.25, ai: { t: 'shot', sp: 30 },
        desc: 'Луч золотого света (до 10): первый вражеский герой на пути получает магический урон и сковывается цепями света из-под земли на 1.6 сек.',
        cast(h, p) { ansChains(h, p.dir, D(h, 60, 16, 0, 0.5), 1.6); }
      },
      {
        key: 'E', name: 'За здоровье!', icon: 'anstoast', cd: 14, cost: 60, range: 0, ind: { type: 'self', r: 7 }, anim: 'cast', animDur: 0.5, lock: 0.2, ai: { t: 'buff' },
        desc: 'Ансельм прикладывается к фляжке и поднимает тост: союзные герои в радиусе 7 (и он сам) лечатся и 4 сек атакуют на 20% быстрее.',
        cast(h) { const amt = D(h, 50, 14, 0, 0.35); SFX.at('clink', h.x, h.z, 0.6); SFX.at('water', h.x, h.z, 0.35); SFX.at('heal', h.x, h.z, 0.4); if (FX.near(h.x, h.z, 50)) { FX.text(h.x, h.height + 1, h.z, 'За здоровье!', '#ffd86a', 16); FX.ring(h.x, h.z, { r0: 0.5, r1: 7, color: ANS.c, life: 0.5, tex: 'ringThin' }); FX.burst(h.x, 1.8, h.z, { n: 10, color: 0xff6a8a, color2: ANS.wine, speed: [1, 3], life: [0.3, 0.6], size: [0.2, 0.04], up: 2, grav: -6 }); }
          for (const o of G.heroes) if (o.alive && o.team === h.team && udist(h, o) < 7) { ansHeal(h, o, amt); addBuff(o, { id: 'anstoast', dur: 4, as: 0.2, amp: h, src: h }); if (FX.near(o.x, o.z, 50) && o !== h) FX.heal(o, ANS.c); } }
      },
      {
        key: 'R', name: 'Свет Богини', icon: 'anslight', cd: 90, cost: 130, range: 9, ind: { type: 'circle', r: 7 }, anim: 'heroic', animDur: 0.7, lock: 0.4, ai: { t: 'save', r: 9, hp: 0.4, ult: true },
        desc: 'Ансельм молит Богиню, и через 0.6 сек в точку (до 9) падает столп золотого света радиусом 7. Союзные герои в нём освобождаются от оглушения, обездвиживания, замедления, безмолвия и слепоты, сильно лечатся и 4 сек получают на 30% меньше урона. Враги внутри получают магический урон и замедляются на 40% на 2 сек.',
        cast(h, p) { ansLight(h, p.x, p.z, D(h, 200, 60, 0, 1.0), D(h, 110, 35, 0, 0.6)); }
      }
    ]
  }
);

/* ---------- icons ---------- */
Object.assign(GLYPH, {
  mrfinn(T) { T.E(0, 6, 20, 9); T.g.fillRect(-20, 2, 40, 4); for (const x of [-8, 0, 8]) T.al(0.6, () => T.S(2.5, x, -6, x + 3, -14, x, -22)); },
  mrfpie(T) { T.E(0, 4, 20, 10); T.al(0.5, () => T.E(0, 0, 18, 7)); T.cut(() => { T.S(2.5, -6, -2, 0, 2); T.S(2.5, 0, 2, 6, -2); }); T.al(0.5, () => { T.S(3, 20, -8, 26, -14); T.S(3, 18, -14, 22, -22); }); },
  mrfpot(T) { T.P(-18, -8, 18, -8, 14, 16, -14, 16); T.g.fillRect(-21, -12, 42, 5); for (const x of [-8, 0, 8]) T.al(0.6, () => T.S(2.5, x, -14, x + 3, -20, x, -26)); },
  mrfpan(T) { T.C(-4, 4, 14); T.cut(() => T.C(-4, 4, 10)); T.al(0.6, () => T.C(-4, 4, 10)); T.rot(-0.6, () => T.g.fillRect(8, -2, 18, 5), 6, 4); T.star(16, -16, 6, 3, 5); },
  mrfbanq(T) { T.E(0, 12, 24, 5); T.E(-10, 4, 7, 5); T.E(10, 4, 7, 5); T.C(0, -4, 7); T.al(0.6, () => { T.S(2, -10, -6, -10, -16); T.S(2, 10, -6, 10, -16); }); },
  ansinn(T) { T.C(0, 0, 9); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; T.S(3, Math.cos(a) * 13, Math.sin(a) * 13, Math.cos(a) * 21, Math.sin(a) * 21); } T.hi(() => T.C(-2, -2, 2)); },
  ansheal(T) { T.g.fillRect(-5, -20, 10, 40); T.g.fillRect(-20, -5, 40, 10); T.al(0.4, () => T.O(0, 0, 24, 2)); },
  anschain(T) { for (let i = 0; i < 4; i++) T.E(-16 + i * 11, -10 + i * 7, 6, 3.5, 2.5, 0.6); T.al(0.5, () => T.O(10, 12, 9, 2.5)); },
  anstoast(T) { T.P(-14, -14, -4, -14, -6, 2, -12, 2); T.g.fillRect(-10, 2, 2, 12); T.g.fillRect(-14, 14, 10, 3); T.P(4, -14, 14, -14, 12, 2, 6, 2); T.g.fillRect(8, 2, 2, 12); T.g.fillRect(4, 14, 10, 3); T.al(0.6, () => T.star(0, -20, 6, 3, 4)); },
  anslight(T) { T.P(-8, -26, 8, -26, 16, 22, -16, 22); T.al(0.4, () => T.P(-16, -26, 16, -26, 26, 22, -26, 22)); T.E(0, 22, 20, 4); }
});
