'use strict';
/* ===== roster, part 41 (hero 69). Loaded after roster14.js (uses akWave from roster13.js); glyphs go to GLYPH at the end.
   69. Xue Ying — a special-unit police captain with a combat shotgun: enhanced shells turn her shots into buckshot, a point-blank volley,
       a tactical roll that leaves a flashbang behind, a taser that marks a suspect, and «Fire to kill» — seven blasts and a slug under police lights. ===== */
const XY = { c: 0xff3a4a, deep: 0x7a0a14, blue: 0x3a7aff, pale: 0xffd6da, shell: 0xc82a36, tase: 0x7ae0ff };
const XY_MAX = 8;
function xyMuzzle(h, dir) { return { x: h.x + Math.sin(dir) * 1.7, y: 1.65, z: h.z + Math.cos(dir) * 1.7 }; }
// a blast of buckshot: a flash at the muzzle, pellet tracers fanned over the cone, sparks, a puff of smoke, a spent red shell kicked out to the side
function xyBlast(h, dir, R, half, o) {
  o = o || {}; const m = xyMuzzle(h, dir); if (!FX.near(m.x, m.z, 60)) return m;
  const big = o.big, n = o.n || 7;
  FX.glow(m.x, m.y, m.z, big ? 5.5 : 3.2, 0xffc890, 0.09, 'flare'); FX.glow(m.x, m.y, m.z, big ? 3 : 1.8, XY.c, 0.14, 'star');
  for (let i = 0; i < n; i++) { const a = dir + rand(-half, half), r = R * rand(0.55, 1); FX.beam(m.x, m.z, h.x + Math.sin(a) * r, h.z + Math.cos(a) * r, { color: i % 3 ? 0xffc890 : XY.c, w: big ? 0.2 : 0.12, life: 0.1, y: m.y - 0.25 }); }
  FX.sparks(m.x, m.y, m.z, { n: big ? 18 : 9, color: 0xffffff, color2: 0xffa040, speed: [8, 18], life: [0.08, 0.2], w: 0.06, dir, spread: half });
  FX.burst(m.x, m.y, m.z, { smoke: true, n: big ? 5 : 2, color: 0x8a8a90, color2: 0x2a2a30, speed: [1, 3], life: [0.4, 0.8], size: [0.5, 1.2], dir, spread: 0.4, a: 0.35 });
  const sa = dir + HPI; FX.burst(h.x + Math.sin(sa) * 0.4, 1.5, h.z + Math.cos(sa) * 0.4, { n: 1, color: XY.shell, color2: 0xd8a040, speed: [2, 3], life: [0.5, 0.7], size: [0.12, 0.1], dir: sa, spread: 0.3, up: 3, grav: -14 });
  if (big) { FX.light(m.x, 2, m.z, 0xffa060, 2.5, 12, 0.15); FX.shake(0.15); }
  return m;
}
// everyone in a cone takes the pellets; up close (inside `near`) the spread has not opened yet and they hit 40% harder
function xyCone(h, dir, R, half, dmg, near, fn) {
  const hit = [];
  for (const e of enemiesIn(h, h.x, h.z, R + 0.6)) { if (e.struct) continue; if (Math.abs(angDiff(dir, angTo(h.x, h.z, e.x, e.z))) > half + 0.12) continue; const d = udist(h, e); damage(h, e, dmg * (d < near ? 1.4 : 1), 0); hit.push(e); if (fn) fn(e, d); }
  return hit;
}
function xyShells(h, n) {
  const was = h.shells === undefined ? XY_MAX : h.shells; h.shells = Math.min(XY_MAX, was + n);
  if (h.shells > was && FX.near(h.x, h.z, 40)) { FX.text(h.x, h.height + 0.8, h.z, '+' + (h.shells - was) + ' патр.', '#ff8a96', 13); SFX.at('bolt', h.x, h.z, 0.6); }
}
// «Fire to kill»: seven blasts down a cone, the last one a slug that throws them back; red and blue lights flash round her the whole time
function xyFullAuto(h, dir, per, slug) {
  const N = 7, gap = 0.17; h.shells = XY_MAX; SFX.at('ultcue', h.x, h.z, 0.7); SFX.at('siren', h.x, h.z, 0.9); SFX.at('bolt', h.x, h.z, 0.7);
  if (FX.near(h.x, h.z, 50)) FX.text(h.x, h.height + 1.3, h.z, 'Огонь на поражение!', '#ff8a96', 17);
  let t = 0, n = 0, sw = 0;
  G.actors.push({ update(dt) {
    t += dt; sw += dt; if (!h.alive || h.stunned) return false;
    h.facing = dir;
    if (sw > 0.12 && FX.near(h.x, h.z, 55)) { sw = 0; const red = Math.floor(t / 0.12) % 2 === 0, col = red ? 0xff2a3a : 0x2a6aff; FX.light(h.x, 3, h.z, col, 2.2, 12, 0.14); FX.glow(h.x + (red ? -0.35 : 0.35), h.height + 0.45, h.z, 1.6, col, 0.12, 'star'); }
    while (n < N && t >= n * gap + 0.1) {
      const last = n === N - 1; n++; h.anim.castT = h.anim.castDur = 0.18; h.anim.castType = 'shoot';
      if (last) {
        xyCone(h, dir, 10, 0.3, slug, 4, e => { knock(e, h.x, h.z, 3, 0.25); if (FX.near(e.x, e.z, 45)) FX.hit(e.x, e.height * 0.55, e.z, XY.c, true); });
        xyBlast(h, dir, 10, 0.3, { n: 14, big: true }); SFX.at('rifle', h.x, h.z, 1); SFX.at('bigboom', h.x, h.z, 0.5);
        if (FX.near(h.x, h.z, 55)) { akWave(h.x, h.z, dir, 10, 0.34, 0.2, 1.4); FX.shock(h.x + Math.sin(dir) * 3, h.z + Math.cos(dir) * 3, 4, 1, 0.35); FX.shake(0.35); FX.hitstop(0.05); FX.punch(0.4); }
      } else {
        const a = dir + rand(-0.06, 0.06);
        xyCone(h, a, 8.5, 0.42, per, 3.5, e => { if (FX.near(e.x, e.z, 45)) FX.hit(e.x, e.height * 0.55, e.z, XY.c, false); });
        xyBlast(h, a, 8.5, 0.42, { n: 9 }); if (FX.near(h.x, h.z, 55)) akWave(h.x, h.z, a, 8.5, 0.42, 0.13, 1.35); SFX.at('gunshot', h.x, h.z, 0.75); if (n % 2) SFX.at('bolt', h.x, h.z, 0.3);
      }
    }
    return n < N;
  } });
}

HEROES.push(
  /* ================= 69. Xue Ying ================= */
  {
    id: 'xueying', name: 'Сюэ Ин', title: 'Капитан спецотряда', role: 'marks', roleName: 'Стрелок', build: 'marks', bars: [4, 3, 3, 3], diffc: 2,
    lore: 'Сюэ Ин командует ударным отрядом, который зовут туда, куда обычная полиция не суётся: в Разлом. Она не любит долгих погонь и длинных речей — одно предупреждение, один выстрел из боевого дробовика, и протокол можно закрывать. Усиленные патроны с красной полосой она набивает сама, и на поясе их всегда ровно восемь.',
    look: { bulk: 0.93, h: 1.03, scale: 1.0, c1: 0x1e2a44, c2: 0x1a2032, c3: 0x15161c, skin: 0xecd2c0, hands: 0x1a1c22, cuff: 0x1e2a44, metal: 0xd8b04a, glow: XY.c, head: 'xueying', hair: 0xd8dce6, shirt: 0xf2f0ec, chest: 'police', legs: 'boots', sh: 'none', weapon: 'shotgun', wc: 'gun' },
    stats: ST(580, 84, 300, 34, 60, 3.3, 22, 2.5, 0.8, 9.0, 8.0),
    init(h) { h.shells = XY_MAX; h.shellIdle = 0; h.shellAcc = 0; },
    innate: { name: 'Усиленные патроны', icon: 'xyinn', desc: 'На поясе у Сюэ Ин 8 усиленных патронов. Пока они есть, каждая атака — выстрел картечью: цель получает на 25% больше урона, а до трёх врагов рядом с ней (2.5) — половину урона атаки. Патроны тратятся по одному; если 2 сек не стрелять, она досылает по патрону каждые 1.5 сек. «Тактический перекат» даёт 4 патрона, «Не двигаться!» — 2.', count: h => h.shells === undefined ? XY_MAX : h.shells },
    shootAtk(u, t) {
      if (u.shells === undefined) u.shells = XY_MAX;
      const dir = angTo(u.x, u.z, t.x, t.z), sh = u.shells > 0; if (sh) u.shells--; u.shellIdle = G.time;
      xyBlast(u, dir, Math.min(9, udist(u, t) + 1), sh ? 0.2 : 0.06, { n: sh ? 6 : 2 });
      SFX.at(sh ? 'gunshot' : 'shoot', u.x, u.z, sh ? 0.55 : 0.45); if (sh) after(0.28, () => SFX.at('bolt', u.x, u.z, 0.3));
      after(0.06, () => {
        if (!t.alive || !u.alive) return; const blind = u.blinded; basicHit(u, t); if (!sh || blind) return;
        if (t.alive) damage(u, t, u.ad * 0.25, 0, { dot: true });
        let k = 0; for (const e of enemiesIn(u, t.x, t.z, 2.5)) { if (e === t || e.struct || k >= 3) continue; k++; damage(u, e, u.ad * 0.5, 0, { dot: true }); if (FX.near(e.x, e.z, 45)) FX.hit(e.x, e.height * 0.55, e.z, XY.c, false); }
        if (FX.near(t.x, t.z, 45)) FX.sparks(t.x, t.height * 0.55, t.z, { n: 6, color: 0xffffff, color2: XY.c, speed: [4, 10], life: [0.1, 0.25], w: 0.06, dir, spread: 0.6 });
      });
    },
    // a suspect (marked by the taser) takes 15% more from all of her damage
    onDeal(h, t, d, o) { if (o.dot || o.xy || t.suspectBy !== h.id || !(t.suspectT > G.time)) return; damage(h, t, d * 0.15 / (DMG_K.xueying || 1), 2, { dot: true, xy: true }); },
    tick(h, dt) {
      if (h.shells === undefined) h.shells = XY_MAX;
      if (h.shells < XY_MAX && G.time - (h.shellIdle || 0) > 2) { h.shellAcc = (h.shellAcc || 0) + dt; if (h.shellAcc >= 1.5) { h.shellAcc = 0; h.shells++; } } else h.shellAcc = 0;
    },
    abilities: [
      {
        key: 'Q', name: 'Залп картечью', icon: 'xyblast', cd: 7, cost: 50, range: 7, ind: { type: 'cone', r: 7 }, anim: 'shoot', animDur: 0.4, lock: 0.25, ai: { t: 'cone', farm: true },
        desc: 'Выстрел в упор широким веером (до 7): физический урон всем врагам в конусе, а тем, кто ближе 3.5, — на 40% больше, и их отбрасывает. Тратит до 2 усиленных патронов: каждый добавляет 20% урона.',
        cast(h, p) {
          const dir = p.dir, use = Math.min(2, h.shells || 0); h.shells -= use; h.shellIdle = G.time; const dmg = D(h, 70, 18, 0.9, 0) * (1 + use * 0.2);
          SFX.at('rifle', h.x, h.z, 0.8); SFX.at('gunshot', h.x, h.z, 0.6); after(0.3, () => SFX.at('bolt', h.x, h.z, 0.6));
          xyBlast(h, dir, 7, 0.55, { n: 12, big: true }); if (FX.near(h.x, h.z, 55)) akWave(h.x, h.z, dir, 7, 0.55, 0.17, 1.3);
          xyCone(h, dir, 7, 0.55, dmg, 3.5, (e, d) => { if (d < 3.5) knock(e, h.x, h.z, 1.6, 0.18); if (FX.near(e.x, e.z, 45)) FX.hit(e.x, e.height * 0.55, e.z, XY.c, d < 3.5); });
          if (use && FX.near(h.x, h.z, 40)) FX.text(h.x, h.height + 0.8, h.z, use === 2 ? 'двойной заряд' : 'усиленный', '#ff8a96', 13);
        }
      },
      {
        key: 'W', name: 'Тактический перекат', icon: 'xyroll', cd: 10, cost: 40, range: 5.5, ind: { type: 'circle', r: 0.8 }, anim: 'roll', animDur: 0.35, lock: 0, ai: { t: 'escape' },
        desc: 'Сюэ Ин перекатом уходит к точке (до 5.5), на ходу досылая 4 усиленных патрона, и следующая атака готова сразу. На месте, откуда она ушла, остаётся светошумовая граната: через 0.4 сек вспышка в радиусе 3.2 — магический урон, ослепление на 1.2 сек (атаки промахиваются) и замедление на 30%.',
        cast(h, p) {
          const x0 = h.x, z0 = h.z, fl = D(h, 40, 10, 0, 0.3); dashTo(h, p.x, p.z, 24, { ribbon: XY.blue }); xyShells(h, 4); h.atkCd = 0; SFX.at('dash', h.x, h.z, 0.7); SFX.at('whoosh', h.x, h.z, 0.5);
          if (FX.near(x0, z0, 55)) { const g = new THREE.Mesh(FX.geo.orb, new THREE.MeshBasicMaterial({ color: 0xdfe3ea })); FX.add(g, 0.4, (k, me) => { me.position.set(x0, 0.25 + Math.abs(Math.sin(k * 7)) * 0.3, z0); me.scale.setScalar(0.35); me.material.color.setHex(Math.floor(k * 12) % 2 ? 0xff3040 : 0xdfe3ea); }); }
          after(0.4, () => {
            for (const e of enemiesIn(h, x0, z0, 3.2)) { if (e.struct) continue; damage(h, e, fl, 1); if (e.alive) { addBuff(e, { id: 'blind', dur: 1.2, blind: true, src: h }); slow(h, e, 0.3, 1.2, 'xyflash'); } }
            SFX.at('pop', x0, z0, 0.9); SFX.at('boom', x0, z0, 0.5); SFX.at('blink', x0, z0, 0.6);
            if (FX.near(x0, z0, 55)) { FX.glow(x0, 1, z0, 9, 0xffffff, 0.16, 'flare'); FX.glow(x0, 1, z0, 5, 0xdfe8ff, 0.3, 'star'); FX.ring(x0, z0, { r0: 0.3, r1: 3.6, color: 0x9fb8ff, life: 0.35, tex: 'shock' }); FX.shock(x0, z0, 3.2, 0.8, 0.35); FX.sparks(x0, 0.8, z0, { n: 16, color: 0xffffff, color2: 0x9fc4ff, speed: [5, 12], life: [0.15, 0.35], w: 0.07 }); FX.smoke(x0, z0, 1.5, 6, 0xb8bcc4); if (G.player && dist(G.player.x, G.player.z, x0, z0) < 4 && G.player.team !== h.team) FX.punch(0.5); }
          });
        }
      },
      {
        key: 'E', name: 'Не двигаться!', icon: 'xytaser', cd: 12, cost: 60, range: 11, ind: { type: 'line', w: 1.4, fixed: true }, anim: 'shoot', animDur: 0.35, lock: 0.2, ai: { t: 'shot', sp: 40 },
        desc: 'Выстрел электрошоковым зарядом (до 11). Первый задетый враг получает магический урон и оглушение на 1 сек и 4 сек считается подозреваемым: весь урон Сюэ Ин по нему на 15% больше. Досылает 2 усиленных патрона.',
        cast(h, p) {
          const dir = p.dir, dmg = D(h, 60, 16, 0, 0.55), m = xyMuzzle(h, dir); xyShells(h, 2); SFX.at('crossbow', h.x, h.z, 0.6); SFX.at('zap', h.x, h.z, 0.5);
          if (FX.near(m.x, m.z, 55)) FX.glow(m.x, m.y, m.z, 2.4, XY.tase, 0.15, 'star');
          shot(h, { dir, speed: 40, range: 11, w: 0.7, mesh: 'bolt', size: 0.9, color: XY.tase, ribbon: 0.35, x: m.x, z: m.z, y: 1.5,
            trail: q => { if (FX.near(q.x, q.z, 50) && Math.random() < 0.6) FX.sparks(q.x, q.y, q.z, { n: 1, color: 0xffffff, color2: XY.tase, speed: [1, 3], life: [0.08, 0.16], w: 0.04 }); },
            onHit: e => {
              damage(h, e, dmg, 1); if (e.alive) { stun(h, e, 1.0); e.suspectT = G.time + 4; e.suspectBy = h.id; if (FX.near(e.x, e.z, 55)) FX.aura(e, XY.c, 4, 1.2, 'ringThin', 2); }
              SFX.at('zap', e.x, e.z, 0.8); SFX.at('impact', e.x, e.z, 0.4);
              if (FX.near(e.x, e.z, 50)) { FX.arcs(e.x, 1.3, e.z, 1.2, 4, XY.tase); FX.hit(e.x, 1.3, e.z, XY.tase, true); FX.beam(h.x, h.z, e.x, e.z, { color: XY.tase, w: 0.06, life: 0.4, y: 1.4 }); if (e.kind === 'hero') FX.text(e.x, e.height + 1, e.z, 'НЕ ДВИГАТЬСЯ!', '#9fe8ff', 15); }
            } });
        }
      },
      {
        key: 'R', name: 'Огонь на поражение', icon: 'xyult', cd: 80, cost: 100, range: 9, ind: { type: 'cone', r: 9 }, anim: 'shoot', animDur: 0.3, lock: 1.45, ai: { t: 'shot', sp: 80, r: 8, ult: true, hp: 0.75 },
        desc: 'Под красно-синие вспышки мигалок Сюэ Ин заряжает полный пояс (8 патронов) и 1.2 сек стоит на месте, ведя огонь: шесть залпов картечи по конусу (до 8.5) — каждый наносит физический урон, вблизи на 40% больше, — и седьмой выстрел пулей (до 10): огромный физический урон и отбрасывание. Оглушение обрывает стрельбу.',
        cast(h, p) { xyFullAuto(h, p.dir, D(h, 34, 12, 0.4, 0), D(h, 140, 50, 0.9, 0)); }
      }
    ]
  }
);

/* ---------- icons ---------- */
Object.assign(GLYPH, {
  // a shotgun shell with a red body and a brass head
  xyinn(T) { T.rot(0.35, () => { T.g.fillRect(-8, -22, 16, 30); T.al(0.6, () => T.g.fillRect(-9.5, 8, 19, 10)); T.cut(() => { T.g.fillRect(-9, -12, 18, 2.5); T.g.fillRect(-9, -4, 18, 2.5); }); T.hi(() => T.S(2, -4, -19, -4, 4)); }); },
  // a muzzle and a fan of pellets
  xyblast(T) { T.g.fillRect(-27, -5, 18, 10); for (let i = 0; i < 9; i++) { const a = -0.55 + i * 0.1375, r = 14 + (i % 3) * 7; T.C(-6 + Math.cos(a) * r, Math.sin(a) * r, 2.6); } T.al(0.4, () => { T.S(2, -8, 0, 24, -15); T.S(2, -8, 0, 24, 15); }); },
  // a roll and a flash left behind
  xyroll(T) { T.A(4, 4, 15, 0.6, 5.4, 5); T.head(14, -7, 0.9, 8); T.star(-15, -14, 10, 4, 8); T.hi(() => T.C(-15, -14, 2.5)); },
  // a taser bolt between two prongs
  xytaser(T) { T.S(3.5, -24, -8, -10, -2); T.S(3.5, -24, 8, -10, 2); T.g.fillRect(-12, -5, 6, 10); T.bolt(10, 0, 0.8); },
  // a police light on its base, rays to both sides
  xyult(T) { T.g.fillRect(-18, 8, 36, 8); T.L(-12, 8, -12, -4); T.g.beginPath(); T.g.arc(0, 0, 13, Math.PI, 0); T.g.lineTo(13, 8); T.g.lineTo(-13, 8); T.g.closePath(); T.g.fill(); T.al(0.6, () => { T.S(3, -18, -12, -26, -18); T.S(3, 18, -12, 26, -18); T.S(3, -20, -2, -28, -2); T.S(3, 20, -2, 28, -2); }); T.hi(() => T.C(-4, -4, 3)); }
});
