'use strict';
/* ===== roster, part 30 (hero 57): Silas the bounty hunter — a revolver with six rounds, a lasso, dynamite and a cigar.
   Loaded after roster6.js (and so after icons.js): the glyphs are added to GLYPH at the end ===== */
const SIL = { c: 0xffb04a, rope: 0xd0a868, fire: 0xff7a2a, flash: 0xffe0a0 };
const _sv = new THREE.Vector3(), _sd = new THREE.Vector3(), _sup = new THREE.Vector3(0, 1, 0);
let _silMat = null, _silLoop = null, _silDyn = null;
const silRopeMat = () => _silMat || (_silMat = new THREE.MeshLambertMaterial({ color: SIL.rope }));
// where his left hand is (the rope hand) and where the muzzle is, in the world
function silHand(h) { if (h.rig && h.rig.handL && h.rig.root.visible) { h.rig.handL.getWorldPosition(_sv); return { x: _sv.x, y: _sv.y, z: _sv.z }; } return { x: h.x + Math.cos(h.facing) * 0.5, y: 1.6 + (h.yOff || 0), z: h.z - Math.sin(h.facing) * 0.5 }; }
function silMuzzle(h) { if (h.rig && h.rig.pmz && h.rig.root.visible) { h.rig.pmz.getWorldPosition(_sv); return { x: _sv.x, y: _sv.y, z: _sv.z }; } return { x: h.x + Math.sin(h.facing) * 0.9, y: 1.8, z: h.z + Math.cos(h.facing) * 0.9 }; }
const silWaist = u => () => u.alive || u.dead ? { x: u.x, y: (u.height || 2) * 0.48 + (u.yOff || 0), z: u.z } : null;

/* ---------- the revolver ---------- */
// one shot: a flash at the muzzle, a hot tracer to the target, a puff of powder smoke, sparks where it lands
function silShot(h, t, k) {
  const m = silMuzzle(h), ty = (t.height || 2) * 0.55 + (t.yOff || 0); SFX.at('shoot', h.x, h.z, 0.55 * k); if (k > 1) SFX.at('boom', h.x, h.z, 0.3);
  if (!FX.near(h.x, h.z, 55)) return;
  r3Ray(m.x, m.y, m.z, t.x, ty, t.z, { color: SIL.flash, w: 0.1 * k, life: 0.09, core: 0.6 });
  FX.glow(m.x, m.y, m.z, 1.5 * k, SIL.c, 0.08, 'flare'); FX.glow(m.x, m.y, m.z, 0.9 * k, 0xffffff, 0.06, 'star');
  FX.burst(m.x, m.y, m.z, { smoke: true, n: 2, color: 0xb8b0a4, color2: 0x4a4640, speed: [0.3, 1], life: [0.5, 0.9], size: [0.3, 0.8], up: 0.6, a: 0.35, drag: 2 });
  FX.sparks(t.x, ty, t.z, { n: k > 1 ? 10 : 4, color: 0xffffff, color2: SIL.c, speed: [3, 9], life: [0.1, 0.3], w: 0.08 });
  if (k > 1) { FX.glow(t.x, ty, t.z, 2.4, SIL.fire, 0.18, 'star'); FX.ring(t.x, t.z, { r0: 0.3, r1: 1.8, color: SIL.c, life: 0.25, tex: 'ringThin', y: ty }); }
}
// six rounds gone: he flips the cylinder out and the spent brass falls; attacks wait for the reload
function silReload(h, dur) {
  h.ammo = 0; h.reloadT = G.time + dur; h.atkCd = Math.max(h.atkCd, dur);
  if (FX.near(h.x, h.z, 45)) { const m = silMuzzle(h); FX.debris(m.x, m.y - 0.3, m.z, { glow: true, n: 6, color: 0xd8a84a, speed: [1, 2.5], up: 3, size: [0.06, 0.1], life: 0.6 }); if (h === G.player) FX.text(h.x, h.height + 0.7, h.z, 'перезарядка', '#ffd8a0', 12); }
  after(dur * 0.8, () => SFX.at('hit', h.x, h.z, 0.25));
}
function silFull(h) { h.ammo = 6; h.reloadT = 0; h.atkCd = Math.min(h.atkCd, 0.12); }

/* ---------- the rope ---------- */
// a sagging rope between two moving points: a chain of short lit cylinders laid along a curve that sags in the middle
function silRope(fromFn, toFn, life, sag) {
  const g = new THREE.Group(), N = 12, segs = [];
  for (let i = 0; i < N; i++) { const m = new THREE.Mesh(FX.geo.cyl, silRopeMat()); g.add(m); segs.push(m); }
  return FX.add(g, life, (k, me, dt, en) => {
    const A = fromFn(), B = toFn(); if (!A || !B) { en.dead = true; return; }
    const L = Math.hypot(B.x - A.x, B.y - A.y, B.z - A.z), s = (sag === undefined ? 0.7 : sag) * Math.min(1, L / 8); let px = A.x, py = A.y, pz = A.z;
    for (let i = 1; i <= N; i++) {
      const f = i / N, x = lerp(A.x, B.x, f), y = lerp(A.y, B.y, f) - Math.sin(Math.PI * f) * s, z = lerp(A.z, B.z, f), m = segs[i - 1];
      _sd.set(x - px, y - py, z - pz); const l = _sd.length() || 0.001; m.position.set(px, py, pz); m.quaternion.setFromUnitVectors(_sup, _sd.multiplyScalar(1 / l)); m.scale.set(0.06, l, 0.06); px = x; py = y; pz = z;
    }
  });
}
function silLoopGeo() { return _silLoop || (_silLoop = new THREE.TorusGeometry(1, 0.09, 5, 22)); }
// the open loop flying through the air, spinning flat; returns the entry and a holder whose x/y/z the caller moves
function silLoopFx(start) {
  const P = { x: start.x, y: start.y, z: start.z }, m = new THREE.Mesh(silLoopGeo(), silRopeMat());
  const e = FX.add(m, 3, (k, me, dt, en) => { me.position.set(P.x, P.y, P.z); me.rotation.set(HPI + Math.sin(en.t * 9) * 0.15, 0, en.t * 14); me.scale.setScalar(Math.min(1, 0.4 + en.t * 4) * 0.95); });
  return { e, P };
}
// tied up: three tight coils round the body, following it; the rope back to his hand is drawn separately
function silCoils(u, dur) {
  const g = new THREE.Group(), r = (u.radius || 0.8) * 0.75 + 0.25;
  for (const [y, tz] of [[0.55, 0.12], [0.95, -0.1], [1.35, 0.08]]) { const m = new THREE.Mesh(silLoopGeo(), silRopeMat()); m.position.y = y * (u.height || 2) / 2.2; m.rotation.set(HPI + tz, 0, 0); m.scale.set(r, r, 1.3); g.add(m); }
  return FX.add(g, dur, (k, me, dt, en) => { if (!u.alive) { en.dead = true; return; } const q = Math.min(1, en.t / 0.12); me.position.set(u.x, u.yOff || 0, u.z); me.scale.set(1 + (1 - q) * 1.5, 1, 1 + (1 - q) * 1.5); me.rotation.y = u.facing || 0; });
}
// free the one on the rope (yanked: the binding is replaced by the yank itself)
function silFree(h, yanked) {
  const S = h.lasso; if (!S) return; h.lasso = null;
  for (const f of S.fx) if (f) f.dead = true;
  if (!yanked) { if (S.b) S.b.dead = true; h.cd[1] = Math.max(h.cd[1], 12 * 100 / (100 + h.haste) * 0.8); }
}
// the yank: the rope snaps taut and drags whoever is tied straight to his boots, where they hit the dirt stunned
function silYank(h, S, dmg) {
  silFree(h, true); const e = S.t; if (!e.alive) return; if (S.b) S.b.dead = true;
  const t = pullTo(e, h.x, h.z, 26, 2.2), A = silHand(h);
  SFX.at('whoosh', h.x, h.z, 1); SFX.at('heavy', e.x, e.z, 0.4);
  if (FX.near(h.x, h.z, 55)) { r3Ray(A.x, A.y, A.z, e.x, 1, e.z, { color: 0xffe0b0, w: 0.25, life: 0.15 }); FX.burst(e.x, 0.3, e.z, { smoke: true, n: 5, color: 0x9a8a70, color2: 0x4a4030, speed: [1, 3], life: [0.4, 0.8], size: [0.6, 1.3], a: 0.45 }); silRope(() => silHand(h), silWaist(e), t + 0.15, 0.1); }
  after(t + 0.02, () => {
    if (!e.alive) return; damage(h, e, dmg, 0); stun(h, e, 0.8); SFX.at('heavy', e.x, e.z, 0.8); FX.shake(0.25);
    if (FX.near(e.x, e.z, 50)) { FX.ring(e.x, e.z, { r0: 0.4, r1: 2.4, color: 0xc8a878, life: 0.35, tex: 'shock' }); FX.burst(e.x, 0.3, e.z, { smoke: true, n: 8, color: 0x9a8a70, color2: 0x4a4030, speed: [1.5, 4], life: [0.5, 1], size: [0.8, 1.6], ring: true, a: 0.5 }); FX.debris(e.x, 0.3, e.z, { n: 5, color: 0x5a4a38, speed: [2, 5], up: 5, size: [0.12, 0.3] }); }
  });
}

/* ---------- dynamite ---------- */
function silDynMesh() {
  if (!_silDyn) {
    const g = new THREE.Group(), k = kit(), red = 0xb82a1c;
    for (const [x, y] of [[-0.07, 0], [0.07, 0], [0, 0.11]]) k.y(0.07, 0.07, 0.5, 8, red, x, y, 0, HPI).y(0.072, 0.072, 0.05, 8, 0xe8d8b0, x, y, 0.2, HPI).y(0.072, 0.072, 0.05, 8, 0xe8d8b0, x, y, -0.2, HPI);
    k.b(0.24, 0.24, 0.05, 0x3a2a1a, 0, 0.04, 0.08).b(0.24, 0.24, 0.05, 0x3a2a1a, 0, 0.04, -0.08).b(0.02, 0.02, 0.2, 0x2a2420, 0, 0.18, 0.32, -0.6);
    k.into(g, new THREE.MeshPhongMaterial({ vertexColors: true, flatShading: true }), new THREE.MeshBasicMaterial({ vertexColors: true }));
    const s = glowSprite(0xffc060, 0.5); s.position.set(0, 0.24, 0.4); s.name = 'spark'; g.add(s); _silDyn = g;
  }
  const c = _silDyn.clone(true); c.scale.setScalar(1.6); return c;
}
// tossed back where he stood: it lands, the fuse fizzes for the rest of the second, then it goes up
function silDynamite(h, x0, z0, dmg) {
  const R = 3.3, FUSE = 1.0, from = silHand(h); G.dangers.push({ x: x0, z: z0, r: R, team: h.team, until: G.time + FUSE });
  const m = silDynMesh(), sp = m.getObjectByName('spark'); SFX.at('fire', x0, z0, 0.3);
  FX.add(m, FUSE, (k, me, dt, en) => {
    const t = en.t, f = Math.min(1, t / 0.3); me.position.set(lerp(from.x, x0, f), lerp(from.y, 0.25, f) + Math.sin(Math.PI * f) * 1.4, lerp(from.z, z0, f)); me.rotation.set(f < 1 ? t * 12 : 0, 0.6, f < 1 ? t * 7 : HPI * 0.9);
    if (sp) sp.scale.setScalar(0.35 + Math.random() * 0.35 + (t > FUSE - 0.25 ? 0.4 : 0));
    if (FX.near(x0, z0, 45) && Math.random() < dt * 30) { _sv.set(0, 0.24, 0.4); sp.localToWorld(_sv.set(0, 0, 0)); FX.sparks(_sv.x, _sv.y, _sv.z, { n: 1, color: 0xffffff, color2: 0xffa040, speed: [1, 4], life: [0.15, 0.35], w: 0.05, grav: -6 }); }
  });
  if (FX.near(x0, z0, 50)) FX.decal(x0, z0, R, SIL.fire, FUSE);
  after(FUSE, () => {
    for (const e of enemiesIn(h, x0, z0, R)) { damage(h, e, dmg, 0); if (e.alive) knock(e, x0, z0, 3, 0.25); FX.hit(e.x, 1.2, e.z, SIL.fire, true); }
    SFX.at('boom', x0, z0, 1); SFX.at('rubble', x0, z0, 0.6); FX.shake(0.45);
    if (!FX.near(x0, z0, 60)) return;
    FX.explosion(x0, z0, 2.3, SIL.fire, { el: 'fire', color2: 0x5a1400 }); FX.pillar(x0, z0, { r: 1.1, h: 9, color: 0xff6a1a, life: 0.4, op: 0.5 });
    FX.debris(x0, 0.4, z0, { n: 12, color: 0x5a4a38, speed: [3, 9], up: 11, size: [0.15, 0.45], rad: 1 }); FX.debris(x0, 0.5, z0, { glow: true, n: 8, color: 0xffa040, speed: [4, 10], up: 9, size: [0.1, 0.25] });
    FX.burst(x0, 1, z0, { smoke: true, n: 12, color: 0x4a4038, color2: 0x15120e, speed: [1, 4], life: [1, 2], size: [1.2, 2.8], up: 2.5, a: 0.55, drag: 1.2 }); FX.scorch(x0, z0, R * 0.8, SIL.fire, 8);
  });
}

HEROES.push(
  /* ================= 57. Silas ================= */
  {
    id: 'silas', name: 'Сайлас', title: 'Охотник за головами', role: 'marks', roleName: 'Стрелок', build: 'marks', bars: [4, 3, 4, 3], diffc: 2, atkSfx: 'shoot',
    lore: 'Человек без улыбки, с сигарой, которая не гаснет даже под дождём. Его объявления о розыске всегда заканчиваются одинаково: шесть выстрелов, петля лассо и «живым или мёртвым — мне без разницы». Кого не догнала пуля, того догонит верёвка.',
    look: { bulk: 1.0, h: 1.02, scale: 1.05, c1: 0x6a4a30, c2: 0x3a3028, c3: 0x2a1c12, cuff: 0x6a4a30, skin: 0xd8b49a, hands: 0x4a3020, metal: 0xb0b4bc, glow: 0xffb04a, head: 'cowboy', hair: 0x4a3020, shirt: 0xd8ccb4, chest: 'duster', sh: 'none', coat: 0x6a4a30, spurs: true, weapon: 'revolver', wc: 'pistol' },
    stats: ST(560, 82, 300, 34, 58, 3.2, 21, 2.4, 0.78, 9.0, 8.5),
    innate: { name: 'Шесть патронов', icon: 'silinn', desc: 'В барабане шесть патронов. Шестой — последний — бьёт на 75% сильнее и замедляет цель на 30% на 1 сек. После него Сайлас 1 сек перезаряжается и не стреляет. «Веер курка» и «Прощальный подарок» перезаряжают барабан мгновенно.', count: h => h.ammo === undefined ? 6 : h.ammo },
    shootAtk(u, t) {
      if (u.ammo === undefined) u.ammo = 6;
      const last = u.ammo <= 1; u.ammo--; silShot(u, t, last ? 1.7 : 1); basicHit(u, t);
      if (last && t.alive) { damage(u, t, u.ad * 0.75, 0, { dot: true }); slow(u, t, 0.3, 1, 'sillast'); }
      if (u.ammo <= 0) silReload(u, 1.0);
    },
    onDeath(h) { silFree(h, false); },
    tick(h, dt) {
      const S = h.lasso;
      if (S && (!S.t.alive || !h.alive || G.time > S.until || udist(h, S.t) > 14)) silFree(h, false);
      else if (S && h.ai && G.time > S.t0 + 0.7 && h.cd[1] <= 0) castAbility(h, 1, { x: S.t.x, z: S.t.z });
      if (h.ammo !== undefined && h.ammo <= 0 && G.time >= h.reloadT) h.ammo = 6;
      if (h.rig && h.rig.cig && Math.random() < dt * (h.cigT > G.time ? 6 : 0.7) && FX.near(h.x, h.z, 40)) { h.rig.cig.getWorldPosition(_sv); FX.burst(_sv.x, _sv.y + 0.05, _sv.z, { smoke: true, n: 1, color: 0xb8b2a8, color2: 0x5a5650, speed: [0.1, 0.4], life: [1.1, 1.9], size: [0.25, 0.8], up: 1.1, a: 0.32, drag: 1.5 }); }
    },
    abilities: [
      {
        key: 'Q', name: 'Веер курка', icon: 'silfan', cd: 8, cost: 45, range: 8.5, ind: { type: 'cone', r: 8.5 }, anim: 'fan', animDur: 0.66, lock: 0.55, ai: { t: 'cone', farm: true },
        desc: 'Сайлас держит револьвер у бедра и ладонью другой руки шесть раз подряд бьёт по курку: шесть пуль за полсекунды по врагам в конусе перед собой (до 8.5), герои — в первую очередь. Каждая пуля — физический урон. После этого барабан сразу полон.',
        cast(h, p) {
          const dir = p.dir, per = D(h, 24, 5, 0.38), half = 0.65, R = 8.5;
          for (let i = 0; i < 6; i++) after(0.06 + i * 0.085, () => {
            if (!h.alive || h.stunned) return;
            const L = enemiesIn(h, h.x, h.z, R + 1).filter(e => inCone(h, e, dir, half, R)).sort((a, b) => (b.kind === 'hero') - (a.kind === 'hero') || udist(h, a) - udist(h, b));
            if (L.length) { const t = L[i % Math.min(L.length, 3)]; damage(h, t, per, 0); silShot(h, t, 1.1); }
            else { const a = dir + rand(-half, half), d = rand(4, R); silShot(h, { x: h.x + Math.sin(a) * d, z: h.z + Math.cos(a) * d, height: 0.4 }, 0.9); }
            FX.shake(0.08);
          });
          after(0.6, () => { if (h.alive) silFull(h); });
        }
      },
      {
        key: 'W', name: 'Лассо', icon: 'sillasso', cd: 12, cost: 60, range: 11, ind: { type: 'line', w: 1.2 }, anim: 'lasso', animDur: 0.55, lock: 0.25, ai: { t: 'shot', sp: 28 },
        free: h => !!h.lasso,
        desc: 'Сайлас раскручивает над головой петлю и бросает её по прямой (до 11). Первый враг, в которого она попадёт, связан на 1.6 / 1.8 / 2 / 2.2 сек: не может сдвинуться с места, а его атаки уходят мимо — руки-то прижаты верёвкой. Пока враг связан, повторное применение (бесплатно) рывком верёвки протаскивает его прямо к Сайласу: физический урон и оглушение на 0.8 сек. Если отойти дальше 14, верёвка лопнет.',
        cast(h, p) {
          const S = h.lasso, dmg = D(h, 70, 14, 0.6);
          if (S) { silYank(h, S, dmg); return; }
          const dir = p.dir, lv = Math.max(1, h.al[1]), dur = 1.4 + 0.2 * lv, full = this.cd * 100 / (100 + h.haste);
          SFX.at('whoosh', h.x, h.z, 0.6);
          after(0.24, () => {
            if (!h.alive) { h.cd[1] = Math.max(h.cd[1], full); return; }
            const A = silHand(h), L = silLoopFx(A), rope = silRope(() => silHand(h), () => L.P, 1.2, 0.4); let caught = false; SFX.at('whoosh', h.x, h.z, 0.9);
            shot(h, { dir, speed: 28, range: 11, w: 0.9, mesh: false, ribbon: false, color: SIL.rope,
              trail: q => { L.P.x = q.x; L.P.y = 1.6; L.P.z = q.z; },
              onHit: e => {
                if (caught) return; caught = true; const b = addBuff(e, { id: 'lasso', dur, root: true, blind: true, src: h }); if (!b) return;
                damage(h, e, dmg * 0.4, 0); h.lasso = { t: e, until: G.time + dur, t0: G.time, b, fx: [silCoils(e, dur + 0.1), silRope(() => silHand(h), silWaist(e), dur + 0.1, 0.6)] }; h.cd[1] = 0.2;
                SFX.at('hit', e.x, e.z, 0.6); if (FX.near(e.x, e.z, 50)) { FX.burst(e.x, 1.2, e.z, { n: 8, color: 0xe8d0a0, color2: SIL.rope, speed: [1, 3], life: [0.2, 0.4], size: [0.2, 0.04] }); if (h === G.player || e === G.player) FX.text(e.x, e.height + 0.8, e.z, 'связан!', '#ffd8a0', 15); }
              },
              onEnd: () => { L.e.dead = true; rope.dead = true; if (!caught || !h.lasso) h.cd[1] = Math.max(h.cd[1], full); } });
          });
          return { cd: 99 };
        }
      },
      {
        key: 'E', name: 'Прощальный подарок', icon: 'sildyn', cd: 11, cost: 50, range: 5.5, ind: { type: 'line', w: 1.2 }, anim: 'roll', animDur: 0.38, lock: 0, ai: { t: 'escape', kite: true },
        desc: 'Сайлас поджигает от сигары связку динамита, бросает её себе под ноги и кувырком уходит на 5.5 в сторону. Через секунду динамит взрывается: физический урон в радиусе 3.3 и отбрасывание. Барабан револьвера за время кувырка перезаряжается.',
        cast(h, p) {
          const dmg = D(h, 85, 17, 0.55); h.cigT = G.time + 0.6; silDynamite(h, h.x, h.z, dmg); silFull(h); SFX.at('dash', h.x, h.z, 0.7);
          dashTo(h, p.x, p.z, 22, { ribbon: false, trail: u => { if (FX.near(u.x, u.z, 40) && Math.random() < 0.6) FX.burst(u.x, 0.2, u.z, { smoke: true, n: 1, color: 0x9a8a70, color2: 0x4a4030, speed: [0.3, 1], life: [0.3, 0.6], size: [0.5, 1], a: 0.4 }); } });
        }
      },
      {
        key: 'R', name: 'Родео', icon: 'silrodeo', cd: 75, cost: 100, range: 10, ind: { type: 'target', hero: true }, anim: 'rodeo', animDur: 1.75, lock: 1.6, ai: { t: 'target', ult: true, hp: 0.7 },
        desc: 'Сайлас набрасывает лассо на вражеского героя (до 10), подтягивает его к себе, поднимает в воздух и полтора оборота крутит вокруг себя — каждого врага, в которого тот врежется, отбрасывает с уроном. Потом с размаху впечатывает пойманного в землю: огромный физический урон, оглушение на 1 сек и половина урона всем вокруг места удара. Пока его крутят, пойманный оглушён.',
        cast(h, p) {
          const t = p.unit; if (!t || t.kind !== 'hero' || !hostile(h, t)) return false;
          const dmg = D(h, 180, 40, 1.0), side = D(h, 60, 12, 0.3), T1 = 0.25, T2 = 0.6, T3 = 1.6, R = 3.6, hit = new Set(); let el = 0, ph = 0, a = 0, x0 = 0, z0 = 0, acc = 0, coils = null;
          h.cigT = G.time + 2; h.order = null; h.path = null; SFX.at('ultcue', h.x, h.z, 0.4); SFX.at('whoosh', h.x, h.z, 0.9);
          const A = silHand(h), L = silLoopFx(A), rope = silRope(() => silHand(h), () => ph ? silWaist(t)() : L.P, T3 + 0.15, 0.5);
          const release = () => { L.e.dead = true; rope.dead = true; if (coils) coils.dead = true; t.phase = false; if (t.alive) { t.yOff = 0; for (const b of t.buffs) if (b.id === 'rodeo') b.dead = true; const q = NAV.nearest(t.x, t.z); t.x = q.x; t.z = q.z; } h.castLock = 0; h.anim.castT = 0; };
          G.actors.push({
            update(dt) {
              el += dt; acc += dt;
              if (!h.alive || h.stunned) { release(); return false; }
              if (el < T1) { const f = el / T1; L.P.x = lerp(A.x, t.x, f); L.P.y = lerp(A.y, 2.2, f) + Math.sin(Math.PI * f) * 1.2; L.P.z = lerp(A.z, t.z, f); return true; }
              if (!ph) {
                ph = 1; L.e.dead = true; if (!t.alive) { release(); return false; }
                addBuff(t, { id: 'rodeo', dur: T3 - T1 + 0.2, stun: true, src: h }); t.forced = null; t.dash = null; t.phase = true; coils = silCoils(t, T3 - T1 + 0.2); x0 = t.x; z0 = t.z; a = angTo(h.x, h.z, t.x, t.z);
                SFX.at('hit', t.x, t.z, 0.7); if (FX.near(t.x, t.z, 50) && (h === G.player || t === G.player)) FX.text(t.x, t.height + 1, t.z, 'ЙИ-ХА!', '#ffd8a0', 20);
              }
              if (!t.alive) { release(); return false; }
              if (el < T2) { const k = easeOut((el - T1) / (T2 - T1)); t.x = lerp(x0, h.x + Math.sin(a) * R, k); t.z = lerp(z0, h.z + Math.cos(a) * R, k); t.yOff = 2.2 * k; return true; }
              if (el < T3) {
                a += dt * 9.4; t.x = h.x + Math.sin(a) * R; t.z = h.z + Math.cos(a) * R; t.yOff = 2.2 + Math.sin(el * 12) * 0.25; h.facing = a;
                for (const e of enemiesIn(h, t.x, t.z, 1.7)) { if (e === t || hit.has(e.id) || e.struct) continue; hit.add(e.id); damage(h, e, side, 0); if (e.alive) knock(e, h.x, h.z, 3.5, 0.25); FX.hit(e.x, 1.3, e.z, SIL.c, true); SFX.at('heavy', e.x, e.z, 0.5); }
                if (acc > 0.05 && FX.near(h.x, h.z, 50)) { acc = 0; FX.burst(t.x, 0.3, t.z, { smoke: true, n: 1, color: 0x9a8a70, color2: 0x4a4030, speed: [0.5, 1.5], life: [0.4, 0.8], size: [0.7, 1.4], a: 0.4 }); FX.burst(h.x, 0.2, h.z, { smoke: true, n: 1, color: 0x9a8a70, color2: 0x4a4030, speed: [1, 3], life: [0.4, 0.7], size: [0.6, 1.2], ring: true, a: 0.35 }); }
                return true;
              }
              // the slam
              const q = NAV.nearest(h.x + Math.sin(a) * 2.6, h.z + Math.cos(a) * 2.6); t.x = q.x; t.z = q.z; t.yOff = 0; t.phase = false; L.e.dead = true; rope.dead = true; if (coils) coils.dead = true;
              for (const b of t.buffs) if (b.id === 'rodeo') b.dead = true;
              damage(h, t, dmg, 0); if (t.alive) stun(h, t, 1.0);
              for (const e of enemiesIn(h, q.x, q.z, 3)) if (e !== t) { damage(h, e, dmg * 0.5, 0); if (e.alive) knock(e, q.x, q.z, 3, 0.25); }
              SFX.at('heavy', q.x, q.z, 1); SFX.at('rubble', q.x, q.z, 0.8); SFX.at('boom', q.x, q.z, 0.4); FX.shake(0.7); if (FX.near(q.x, q.z, 36)) { FX.hitstop(0.08); FX.punch(0.8); }
              if (FX.near(q.x, q.z, 55)) {
                FX.ring(q.x, q.z, { r0: 0.5, r1: 3.6, color: 0xd8b888, life: 0.45, tex: 'shock' }); FX.ring(q.x, q.z, { r0: 2.4, r1: 2.8, color: 0x8a7050, life: 1.8, tex: 'crack' }); FX.shock(q.x, q.z, 4.5, 1, 0.4);
                FX.burst(q.x, 0.4, q.z, { smoke: true, n: 16, color: 0xa8987a, color2: 0x4a4030, speed: [2, 6], life: [0.6, 1.3], size: [1, 2.4], ring: true, a: 0.55, drag: 1.4 }); FX.debris(q.x, 0.3, q.z, { n: 14, color: 0x5a4a38, speed: [3, 8], up: 9, size: [0.15, 0.45], rad: 1 }); FX.scorch(q.x, q.z, 1.8, 0x6a5038, 6); FX.hit(q.x, 1, q.z, SIL.c, true);
              }
              h.castLock = 0.15; return false;
            }
          });
        }
      }
    ]
  }
);

/* ---------- icons ---------- */
Object.assign(GLYPH, {
  silinn(T) { T.O(0, 0, 21, 4); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU - HPI; T.C(Math.cos(a) * 12, Math.sin(a) * 12, 5); } T.cut(() => T.C(0, 0, 3)); T.hi(() => T.C(0, -12, 1.6)); },
  silfan(T) { for (let i = -2; i <= 2; i++) T.rot(i * 0.22, () => { T.P(-1.8, 8, 1.8, 8, 1.8, -14, 0, -19, -1.8, -14); T.al(0.45, () => T.S(1.5, 0, 12, 0, 25)); }, 0, 6); T.hi(() => T.C(0, -12, 1.4)); },
  sillasso(T) { T.E(6, -8, 18, 9, 4); T.Q(4, -8, 0, -20, 12, -24, 25); T.al(0.5, () => T.E(6, -8, 12, 5, 2)); T.hi(() => T.C(18, -12, 1.6)); },
  sildyn(T) { for (const x of [-9, 0, 9]) T.g.fillRect(x - 4, -8, 8, 28); T.al(0.6, () => T.g.fillRect(-14, 2, 28, 4)); T.Q(2.5, 0, -8, 6, -18, 14, -18); T.star(15, -19, 7, 2.5, 6); T.hi(() => T.C(15, -19, 1.6)); },
  silrodeo(T) { T.E(0, 14, 26, 7, 4); T.P(-14, 2, 14, 2, 10, -8, 6, -14, -6, -14, -10, -8); T.E(0, 2, 22, 4); T.al(0.5, () => T.A(0, 14, 18, 0.3, 2.8, 3)); T.hi(() => T.C(-6, -10, 1.6)); }
});
