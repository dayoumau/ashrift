'use strict';
/* ===== roster, part 33 (hero 60): Gubert, the cheerful sea-sponge cook — a spatula, soap bubbles, a sponge that soaks up the blows and wrings
   them out as healing, and a storm of sea burgers. Uses NER_VS from roster9.js. Loaded after roster9.js: the glyphs are added to GLYPH at the end ===== */
const GUB = { c: 0xffd84a, sponge: 0xf2d84a, water: 0x8fe8ff, ketchup: 0xd8302a, mustard: 0xf2c030, bun: 0xd89a48, foam: 0xf6fbff };
// a soap bubble: almost clear in the middle, a thin film of shifting rainbow colours toward the rim, a bright highlight at the very edge
const GUB_FS_SOAP = 'uniform float uT; varying vec2 vU; varying vec3 vN; varying vec3 vV;' +
  'void main(){ float f=1.-abs(dot(normalize(vN),normalize(vV))); vec3 c=.55+.45*cos(6.2832*(f*1.3+vU.y*.6+uT*.15+vec3(0.,.33,.67)));' +
  ' gl_FragColor=vec4(c*(.7+.6*f)+vec3(1.)*pow(f,6.)*.6,.07+.75*pow(f,2.5)); }';
let _gubSoap = null, _gubBurger = null;
const gubSoapMat = () => _gubSoap || (_gubSoap = new THREE.ShaderMaterial({ uniforms: { uT: FXU.uT }, vertexShader: NER_VS, fragmentShader: GUB_FS_SOAP, transparent: true, depthWrite: false }));
const _gv = new THREE.Vector3();
// a sea burger: a bottom bun, a thick patty, a slice of cheese turned corner-on, lettuce, tomato, a domed top bun with sesame seeds
function gubBurger(scale) {
  if (!_gubBurger) {
    const g = new THREE.Group(), k = kit(), bun = GUB.bun, dark = 0xb87a34;
    k.y(0.36, 0.33, 0.12, 14, bun, 0, 0.06, 0).y(0.38, 0.38, 0.1, 14, 0x5a3220, 0, 0.17, 0).b(0.54, 0.025, 0.54, 0xf6c83a, 0, 0.23, 0, 0, 0.785, 0)
      .y(0.42, 0.4, 0.035, 12, 0x6ac040, 0, 0.255, 0).y(0.32, 0.32, 0.035, 12, 0xd83a30, 0, 0.285, 0).y(0.37, 0.37, 0.09, 14, bun, 0, 0.35, 0).c(0.38, 0.2, 14, dark, 0, 0.49, 0);
    for (let i = 0; i < 9; i++) { const a = i * 2.4, r = 0.08 + (i % 3) * 0.07; k.b(0.04, 0.02, 0.025, 0xfff4d8, Math.sin(a) * r, 0.52 - r * 0.45, Math.cos(a) * r, 0, a, 0.5); }
    k.into(g, new THREE.MeshPhongMaterial({ vertexColors: true, flatShading: true, shininess: 30 }), new THREE.MeshBasicMaterial({ vertexColors: true })); _gubBurger = g;
  }
  const c = _gubBurger.clone(true); c.scale.setScalar(scale || 1); return c;
}
// his mouth (where the bubbles come from) and his right hand (where the burgers leave)
function gubMouth(h) { if (h.rig && h.rig.head && h.rig.root.visible) { _gv.set(0, -0.3, 0.45); h.rig.head.localToWorld(_gv); return { x: _gv.x, y: _gv.y, z: _gv.z }; } return { x: h.x + Math.sin(h.facing) * 0.7, y: 1.5, z: h.z + Math.cos(h.facing) * 0.7 }; }
function gubHand(h, left) { const n = left ? 'handL' : 'handR'; if (h.rig && h.rig[n] && h.rig.root.visible) { h.rig[n].getWorldPosition(_gv); return { x: _gv.x, y: _gv.y, z: _gv.z }; } return { x: h.x, y: 1.6, z: h.z }; }
// a splat where something lands: ketchup and mustard on the ground, crumbs, a puff
function gubSplat(x, z, k) {
  if (!FX.near(x, z, 55)) return; k = k || 1;
  FX.ring(x, z, { r0: 0.2, r1: 1.3 * k, color: GUB.ketchup, life: 1.4, tex: 'fill', op: 0.55 }); FX.ring(x + rand(-0.3, 0.3), z + rand(-0.3, 0.3), { r0: 0.1, r1: 0.8 * k, color: GUB.mustard, life: 1.2, tex: 'fill', op: 0.5 });
  FX.debris(x, 0.3, z, { n: Math.round(4 * k), color: GUB.bun, speed: [1, 3 * k], up: 4, size: [0.06, 0.14] }); FX.sparks(x, 0.4, z, { n: Math.round(5 * k), color: 0xffffff, color2: GUB.ketchup, speed: [2, 5 * k], life: [0.2, 0.45], w: 0.07, up: 3 });
  FX.burst(x, 0.4, z, { puff: true, n: 2, color: 0xffe0a0, color2: 0x8a5a2a, speed: [0.5, 1.5], life: [0.3, 0.5], size: [0.6 * k, 1.2 * k], a: 0.3 });
}
// the innate: 30% of the damage he takes soaks into his pores as water, up to a quarter of his health
function gubCap(h) { return h.maxHp * 0.25; }

/* ---------- the burger storm ---------- */
function gubToss(h, x0, z0, R, dmg, hl, fromLeft) {
  const a = rand(TAU), r = Math.sqrt(Math.random()) * R, tx = x0 + Math.sin(a) * r, tz = z0 + Math.cos(a) * r, A = gubHand(h, fromLeft), T = 0.45 + dist(A.x, A.z, tx, tz) / 30, peak = rand(2.5, 4.5);
  const m = gubBurger(1.25), sx = rand(6, 12), sz = rand(-4, 4);
  if (FX.near(tx, tz, 60)) FX.add(m, T, (k, me, dt) => { me.position.set(lerp(A.x, tx, k), lerp(A.y, 0.2, k) + Math.sin(Math.PI * k) * peak, lerp(A.z, tz, k)); me.rotation.x += sx * dt; me.rotation.z += sz * dt; });
  after(T, () => {
    for (const e of enemiesIn(h, tx, tz, 1.6)) { damage(h, e, dmg, 0); if (e.alive) slow(h, e, 0.25, 1, 'gubsauce'); }
    for (const o of G.heroes) if (o.alive && o.team === h.team && dist(o.x, o.z, tx, tz) < 1.6) { heal(h, o, hl); if (FX.near(o.x, o.z, 40) && Math.random() < 0.5) FX.text(o.x, o.height + 0.9, o.z, 'ням!', '#ffd86a', 12); }
    gubSplat(tx, tz, 1); if (Math.random() < 0.35) SFX.at('hit', tx, tz, 0.35);
    // a burger that lands sits there half-squashed for a moment
    if (FX.near(tx, tz, 50)) { const s = gubBurger(1.1), ry = rand(TAU); FX.add(s, 1.6, (k, me) => { me.position.set(tx, 0.02, tz); me.rotation.set(0, ry, 0); const q = k < 0.1 ? 1 - k / 0.1 * 0.4 : 0.6; me.scale.set(1.1 * (1 + (1 - q) * 0.4), 1.1 * q * (k > 0.8 ? (1 - k) / 0.2 : 1), 1.1 * (1 + (1 - q) * 0.4)); }); }
  });
}
// the last one: a giant burger dropped from the sky onto the middle of the storm
function gubGiant(h, x, z, dmg) {
  const T = 0.7, m = gubBurger(5), near = FX.near(x, z, 70);
  G.dangers.push({ x, z, r: 3, team: h.team, until: G.time + T });
  if (near) { FX.decal(x, z, 3, GUB.c, T); FX.add(m, T + 1.4, (k, me, dt, en) => { const t = en.t; if (t < T) { const f = t / T; me.position.set(x, 26 * (1 - f * f), z); me.rotation.set(Math.sin(t * 5) * 0.2, t * 3, Math.cos(t * 4) * 0.15); me.scale.setScalar(5); } else { const s = t - T, q = s < 0.4 ? Math.sin(s * 25) * 0.15 * (1 - s / 0.4) : 0; me.position.set(x, 0, z); me.rotation.set(0, me.rotation.y, 0); me.scale.set(5 * (1 + q), 5 * (1 - q) * (s > 1 ? 1 - (s - 1) / 0.4 : 1), 5 * (1 + q)); } }); }
  after(T, () => {
    for (const e of enemiesIn(h, x, z, 3)) { damage(h, e, dmg, 0); if (e.alive) stun(h, e, 1, 0.8); }
    SFX.at('heavy', x, z, 1); SFX.at('boom', x, z, 0.6); FX.shake(0.6); if (FX.near(x, z, 36)) FX.hitstop(0.06);
    if (near) { FX.ring(x, z, { r0: 0.8, r1: 4.2, color: GUB.mustard, life: 0.5, tex: 'shock' }); FX.shock(x, z, 5, 1, 0.45); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; gubSplat(x + Math.sin(a) * 2.6, z + Math.cos(a) * 2.6, 1.3); } gubSplat(x, z, 2.2);
      FX.burst(x, 0.5, z, { smoke: true, n: 12, color: 0xe8d8b0, color2: 0x6a4a2a, speed: [2, 6], life: [0.6, 1.2], size: [1.2, 2.6], ring: true, a: 0.4 }); }
  });
}

/* ---------- soap bubbles ---------- */
function gubBubbles(h, dir, dmg, n) {
  const M = gubMouth(h), mat = gubSoapMat(), ctx = DMG_CTX;   // ctx: the bubbles hurt from an effect callback, so they carry the ability themselves for the match report
  for (let i = 0; i < n; i++) after(i * 0.04, () => {
    if (!h.alive) return; const a = dir + rand(-0.5, 0.5), sp = rand(6, 11), r = rand(0.25, 0.5), g = new THREE.Group(), m = new THREE.Mesh(FX.geo.sphere, mat); g.add(m);
    let x = M.x, y = M.y + rand(-0.2, 0.2), z = M.z, vx = Math.sin(a) * sp, vz = Math.cos(a) * sp, vy = rand(-0.3, 0.6), done = false; const ph = rand(TAU), L = rand(1.3, 1.8);
    const pop = () => { if (done) return; done = true; if (FX.near(x, z, 45)) { FX.ring(x, z, { r0: r, r1: r * 2.5, color: 0xdff4ff, life: 0.2, tex: 'ringThin', y }); FX.sparks(x, y, z, { n: 5, color: 0xffffff, color2: GUB.water, speed: [2, 5], life: [0.15, 0.35], w: 0.05, grav: -10 }); } };
    FX.add(g, L, (k, me, dt, en) => {
      if (done) { en.dead = true; return; }
      const dr = Math.exp(-dt * 1.6); vx *= dr; vz *= dr; vy = vy * dr + 0.25 * dt; x += vx * dt + Math.sin(en.t * 4 + ph) * 0.4 * dt; y += vy * dt; z += vz * dt + Math.cos(en.t * 4 + ph) * 0.4 * dt;
      me.position.set(x, y, z); m.scale.set(r * (1 + Math.sin(en.t * 9 + ph) * 0.06), r * (1 + Math.cos(en.t * 8 + ph) * 0.06), r);
      for (const e of enemiesIn(h, x, z, r + 0.5)) { if (e.struct) continue; const pc = DMG_CTX; DMG_CTX = ctx; damage(h, e, dmg, 1); DMG_CTX = pc; if (e.alive) slow(h, e, 0.25, 1.5, 'gubsoap'); SFX.at('hit', x, z, 0.15); pop(); break; }
      if (k > 0.97) pop();
    });
  });
}

HEROES.push(
  /* ================= 60. Gubert ================= */
  {
    id: 'gubert', name: 'Губерт', title: 'Весёлый повар со дна моря', role: 'front', roleName: 'Боец', build: 'bruiser', bars: [3, 4, 3, 3], diffc: 1, atkSfx: 'slash',
    lore: 'Губерт — морская губка, квадратная, жёлтая и самая весёлая на всём дне. Днём он жарит бургеры в забегаловке у затонувшего корабля, а когда начинается драка, берёт лопатку и идёт помогать. Удары он просто впитывает — губка же, — а потом выжимает их из себя целебной водой. И если уж Губерт разошёлся, на врагов посыплются бургеры. Много бургеров.',
    look: { bulk: 1.15, h: 0.72, scale: 1.0, arm: 0.5, c1: 0x7a4a24, c2: 0x7a4a24, c3: 0x6a3e1c, cuffBare: 0xeec43a, skin: 0xeec43a, hands: 0xeec43a, metal: 0xc8ccd4, glow: 0xffd84a, head: 'gubert', shirt: 0xf6f4ee, tie: 0xd8302a, chest: 'sponge', legs: 'socks', sh: 'sleeve', weapon: 'spatula', wc: 'melee' },
    stats: ST(640, 92, 300, 32, 64, 4.2, 28, 3.2, 0.8, 9.0, 2.3),
    innate: { name: 'Пористый', icon: 'gubinn', desc: 'Губерт — губка: он получает на 12% меньше урона, а 30% полученного урона впитывает порами как воду (не больше четверти здоровья). «Отжим» выжимает эту воду целебными струями. Чем больше воды внутри, тем сильнее с него капает.', count: h => h.sponge > 1 ? Math.round(h.sponge / gubCap(h) * 100) + '%' : '' },
    onHurt(h, src, d) { h.sponge = Math.min(gubCap(h), (h.sponge || 0) + d * 0.3); },
    onDeath(h) { h.sponge = 0; h.flingUntil = 0; },
    tick(h, dt) {
      if (!h.buffs.some(b => b.id === 'spongy')) addBuff(h, { id: 'spongy', dur: 1e9, dmgIn: 0.88 });
      const full = (h.sponge || 0) / gubCap(h);
      if (full > 0.1 && FX.near(h.x, h.z, 40) && Math.random() < dt * 10 * full) FX.burst(h.x + rand(-0.5, 0.5), rand(0.8, 1.8), h.z + rand(-0.5, 0.5), { n: 1, color: GUB.water, color2: 0x3a8ab8, speed: [0, 0.3], life: [0.35, 0.6], size: [0.14, 0.05], grav: -14 });
      // the burger storm goes on while he walks: both hands keep throwing
      const F = h.fling; if (F && h.alive) { const pc = DMG_CTX; DMG_CTX = { h, i: 3 };   // the storm runs from tick: it still counts as the ultimate in the match report
        if (h.stunned || G.time > F.until) { h.fling = null; h.flingUntil = 0; if (!h.stunned) gubGiant(h, F.x, F.z, F.big); }
        else { F.acc += dt; while (F.acc >= F.every) { F.acc -= F.every; F.left = !F.left; gubToss(h, F.x, F.z, F.R, F.dmg, F.heal, F.left); if (Math.random() < 0.4) SFX.at('whoosh', h.x, h.z, 0.3); } }
        DMG_CTX = pc;
      }
    },
    abilities: [
      {
        key: 'Q', name: 'Шлепок лопаткой', icon: 'gubflip', cd: 9, cost: 50, range: 6, ind: { type: 'circle', r: 2.6 }, anim: 'slam', animDur: 0.6, lock: 0, ai: { t: 'gap', rad: 2.6 },
        desc: 'Губерт подпрыгивает (до 6) и с размаху шлёпает лопаткой по земле: физический урон всем врагам в радиусе 2.6, и они подлетают, как котлеты на сковородке, — оглушение на 0.7 сек.',
        cast(h, p) {
          const x = p.x, z = p.z, dmg = D(h, 80, 18, 1.0), T = Math.max(0.25, p.dist / 18);
          SFX.at('whoosh', h.x, h.z, 0.7); dashTo(h, x, z, 18, { arc: 1.8, ribbon: false });
          after(T, () => {
            if (!h.alive) return; for (const e of enemiesIn(h, h.x, h.z, 2.6)) { damage(h, e, dmg, 0); if (e.alive) stun(h, e, 0.7, 1.6); FX.hit(e.x, 1.2, e.z, GUB.c, true); }
            SFX.at('heavy', h.x, h.z, 0.9); SFX.at('fire', h.x, h.z, 0.3); FX.shake(0.35);
            if (FX.near(h.x, h.z, 55)) { FX.slash(h.x + Math.sin(h.facing) * 1.3, h.z + Math.cos(h.facing) * 1.3, h.facing, { r: 2.6, color: GUB.c, life: 0.25 }); FX.ring(h.x, h.z, { r0: 0.4, r1: 3, color: 0xffe0a0, life: 0.4, tex: 'shock' });
              FX.burst(h.x, 0.3, h.z, { smoke: true, n: 8, color: 0xc8b890, color2: 0x5a4a38, speed: [1.5, 4], life: [0.5, 1], size: [0.8, 1.6], ring: true, a: 0.4 }); FX.sparks(h.x, 0.4, h.z, { n: 12, color: 0xffffff, color2: 0xffa040, speed: [3, 8], life: [0.2, 0.45], w: 0.07, up: 4 }); }
          });
        }
      },
      {
        key: 'W', name: 'Мыльные пузыри', icon: 'gubsoap', cd: 8, cost: 55, range: 7, ind: { type: 'cone', r: 7 }, anim: 'blow', animDur: 0.7, lock: 0.45, ai: { t: 'cone', farm: true },
        desc: 'Губерт выдувает перед собой веер из 14 переливающихся мыльных пузырей (до 7). Пузырь лопается о первого же врага: магический урон и замедление на 25% на 1.5 сек. Чем ближе враг к Губерту, тем больше пузырей в него попадёт.',
        cast(h, p) { SFX.at('cast', h.x, h.z, 0.5); after(0.12, () => { if (h.alive) gubBubbles(h, p.dir, D(h, 26, 6, 0.15, 0.15), 14); }); }
      },
      {
        key: 'E', name: 'Отжим', icon: 'gubsqueeze', cd: 14, cost: 60, range: 0, ind: { type: 'self', r: 5 }, anim: 'squeeze', animDur: 0.7, lock: 0.35, ai: { t: 'sanct' },
        desc: 'Губерт сжимается в лепёшку и выжимает из себя всю впитанную воду: струи бьют из каждой поры. Он восстанавливает здоровье — немного всегда и плюс всё, что впитал, — а союзные герои в радиусе 5 получают половину. С Губерта и союзников смываются замедления и обездвиживание.',
        cast(h) {
          const st = h.sponge || 0, base = D(h, 60, 15, 0, 0.3); h.sponge = 0; h.squeezeT = G.time + 0.7; SFX.at('heal', h.x, h.z, 0.8); SFX.at('ice', h.x, h.z, 0.4);
          after(0.25, () => {
            if (!h.alive) return; heal(h, h, base + st); for (const b of h.buffs) if (b.slow || b.root) b.dead = true;
            for (const o of G.heroes) if (o.alive && o !== h && o.team === h.team && udist(h, o) < 5) { heal(h, o, (base + st) * 0.5); for (const b of o.buffs) if (b.slow || b.root) b.dead = true; if (FX.near(o.x, o.z, 45)) FX.heal(o, GUB.water); }
            if (!FX.near(h.x, h.z, 55)) return; const k = 0.7 + Math.min(1, st / gubCap(h)) * 0.8;
            for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; FX.sparks(h.x + Math.sin(a) * 0.5, rand(0.8, 1.9), h.z + Math.cos(a) * 0.5, { n: Math.round(4 * k), color: 0xffffff, color2: GUB.water, speed: [4, 9 * k], life: [0.3, 0.6], w: 0.09, dir: a, spread: 0.25, up: 1.5 }); }
            FX.ring(h.x, h.z, { r0: 0.6, r1: 5, color: GUB.water, life: 0.5, tex: 'shock' }); FX.burst(h.x, 0.4, h.z, { smoke: true, n: 8, color: 0xe0f6ff, color2: 0x6aa8c8, speed: [1, 3], life: [0.6, 1.1], size: [0.8, 1.8], ring: true, a: 0.3 });
            FX.burst(h.x, 1.2, h.z, { n: Math.round(14 * k), color: GUB.foam, color2: GUB.water, speed: [2, 5], life: [0.3, 0.7], size: [0.3, 0.05], up: 3, grav: -14, ring: true });
          });
        }
      },
      {
        key: 'R', name: 'Бургерный шторм', icon: 'gubburger', cd: 85, cost: 110, range: 10, ind: { type: 'circle', r: 5.5 }, anim: 'cast', animDur: 0.3, lock: 0.1, ai: { t: 'point', rad: 5.5, delay: 0.6, ult: true, hp: 0.75 }, noCue: true,
        desc: 'Губерт три секунды без остановки швыряет обеими руками морские бургеры в область (до 10, радиус 5.5) — по дюжине в секунду, двигаться при этом можно. Бургер, упавший рядом с врагом, бьёт его (физический урон) и пачкает соусом — замедление на 25%, а союзного героя кормит — немного здоровья. Под конец с неба падает гигантский бургер: огромный урон и оглушение на 1 сек всем врагам в радиусе 3 от центра.',
        cast(h, p) {
          const lv = Math.max(1, h.al[3]);
          h.fling = { x: p.x, z: p.z, R: 5.5, until: G.time + 3, every: 1 / 12, acc: 0, left: false, dmg: D(h, 18, 4.5, 0.1, 0.08), heal: 14 + 8 * lv + h.ap * 0.05, big: D(h, 90, 22, 0.4, 0.25) };
          h.flingUntil = G.time + 3; SFX.at('ultcue', h.x, h.z, 0.5);
          if (G.player && (h.team === G.player.team || udist(h, G.player) < 30)) mmMark({ x: p.x, z: p.z, r: 5.5, color: '#ffd84a', until: G.time + 3.7 });
        }
      }
    ]
  }
);

/* ---------- icons ---------- */
Object.assign(GLYPH, {
  // a square sponge with holes
  gubinn(T) { T.g.fillRect(-18, -20, 36, 40); T.cut(() => { for (const [x, y, r] of [[-9, -11, 3.5], [8, -6, 2.5], [-4, 6, 2.8], [10, 11, 3.5], [-12, 14, 2]]) T.C(x, y, r); }); T.hi(() => T.C(-12, -15, 1.6)); },
  // a spatula with a burger patty flying off it
  gubflip(T) { T.rot(-0.6, () => { T.g.fillRect(-3, -2, 6, 26); T.g.fillRect(-11, -24, 22, 20); T.cut(() => { T.g.fillRect(-6, -21, 2.5, 14); T.g.fillRect(-1, -21, 2.5, 14); T.g.fillRect(4, -21, 2.5, 14); }); }, -6, 6); T.E(14, -16, 9, 4); T.al(0.5, () => T.A(4, -6, 14, -1.9, -0.6, 2.5)); },
  // three bubbles
  gubsoap(T) { for (const [x, y, r] of [[-8, 6, 12], [11, -6, 9], [8, 16, 6]]) { T.O(x, y, r, 3); T.al(0.25, () => T.C(x, y, r)); T.hi(() => T.A(x, y, r * 0.65, 3.6, 4.6, 2)); } },
  // a sponge being wrung, drops flying out
  gubsqueeze(T) { T.P(-16, -14, 16, -14, 10, 0, 16, 14, -16, 14, -10, 0); for (const [x, y] of [[-22, -4], [22, -6], [-20, 8], [21, 6], [0, -22]]) T.C(x, y, 2.4); T.hi(() => T.C(-6, -8, 1.6)); },
  // a burger
  gubburger(T) { T.E(0, -6, 20, 11); T.g.fillRect(-20, -4, 40, 4); T.al(0.6, () => T.g.fillRect(-22, 1, 44, 3)); T.g.fillRect(-19, 5, 38, 5); T.E(0, 13, 19, 4); T.hi(() => { T.C(-7, -10, 1.2); T.C(4, -12, 1.2); T.C(11, -8, 1.2); }); }
});
