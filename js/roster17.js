'use strict';
/* ===== roster, part 43 (hero 71). Loaded after roster16.js (uses akWave from roster13.js); glyphs go to GLYPH at the end.
   71. Roxa — the queen of the road, leader of a biker gang, with a wheel for a shield. Her shield covers the whole gang: a parry that blocks
       the first blow and answers it with a stun, a burning wheel rolled down the lane and back, a shield bash that leaves the enemy weakened,
       and «Dead end» — a ride on a phantom fire bike that carries enemies along and ends in a slam. ===== */
const RX = { c: 0xff7a1a, hot: 0xffc040, deep: 0x8a2a08, steel: 0xc8ccd4, tire: 0x1a1a1e };
let _rxG = null;
// the wheel: a black tyre, a glowing inner rim, five steel spokes and a burning hub. ghost = the phantom wheels of the fire bike (all glow)
function rxWheelMesh(ghost) {
  if (!_rxG) {
    const add = (col, op) => new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false });
    _rxG = { tire: new THREE.TorusGeometry(0.62, 0.17, 6, 18), rim: new THREE.TorusGeometry(0.46, 0.05, 4, 18), spoke: new THREE.BoxGeometry(0.06, 0.9, 0.06), hub: new THREE.CylinderGeometry(0.15, 0.15, 0.22, 8),
      mTire: new THREE.MeshBasicMaterial({ color: RX.tire }), mSteel: new THREE.MeshBasicMaterial({ color: RX.steel }), mRim: add(RX.c, 0.95), mHub: add(RX.hot, 1),
      gTire: add(RX.c, 0.75), gRim: add(RX.hot, 0.9), gSpoke: add(RX.c, 0.5) };
  }
  const Q = _rxG, g = new THREE.Group(), s = new THREE.Group(); g.add(s);
  s.add(new THREE.Mesh(Q.tire, ghost ? Q.gTire : Q.mTire)); s.add(new THREE.Mesh(Q.rim, ghost ? Q.gRim : Q.mRim));
  for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(Q.spoke, ghost ? Q.gSpoke : Q.mSteel); m.rotation.z = i / 5 * Math.PI; s.add(m); }
  const hub = new THREE.Mesh(Q.hub, Q.mHub); hub.rotation.x = HPI; s.add(hub);
  g.userData.spin = s; return g;
}
// stand the wheel up on the ground, rolling along `dir`
function rxPlaceWheel(m, x, y, z, dir, spin) { m.position.set(x, y, z); m.rotation.set(0, dir + HPI, 0); m.userData.spin.rotation.z = spin; }
// «Gang armour»: a shield for her and every allied hero within R; while it holds they deal 10% more damage
function rxGang(h, amt, R) {
  for (const o of G.heroes) {
    if (!o.alive || o.team !== h.team || udist(h, o) > R) continue;
    const sb = shield(h, o, amt, 4, RX.c); if (!sb) continue;
    addBuff(o, { id: 'rxgang', dur: 4, dmgOut: 1.1, amp: h, src: h, every: 0.1, onTick(u, b) { if (sb.shield <= 0 || !u.buffs.includes(sb)) b.dead = true; } });
    if (FX.near(o.x, o.z, 50)) {
      FX.pillar(o.x, o.z, { r: 1.1, h: 7, color: RX.c, life: 0.5 }); FX.ring(o.x, o.z, { r0: 0.4, r1: 2, color: RX.hot, life: 0.4, tex: 'ringThin' });
      FX.flame(o.x, 0.4, o.z, { n: 5, color: RX.hot, color2: RX.deep, size: [0.6, 1.2], life: [0.3, 0.6], rad: 0.8 });
      if (o !== h) FX.beam(h.x, h.z, o.x, o.z, { color: RX.c, w: 0.5, life: 0.35 });
    }
  }
  SFX.at('shield', h.x, h.z, 0.6);
}
// the wheel rolls out along `dir` (up to 10), burning a track, then rolls back to her; the way back hurts half as much. Caught, it gives her a shield
function rxRoll(h, dir, dmg, cs) {
  const R = 10, SP = 24, BK = 30; let x = h.x + Math.sin(dir) * 0.9, z = h.z + Math.cos(dir) * 0.9, trav = 0, back = false, t = 0, spin = 0, ft = 0, md = dir;
  const hit1 = new Set(), hit2 = new Set(), fx = FX.near(x, z, 70) ? FX.add(rxWheelMesh(false), 6, null) : null;
  const end = () => { if (fx) fx.dead = true; return false; };
  G.actors.push({ update(dt) {
    t += dt; if (!h.alive || t > 3) return end();
    if (!back) {
      const st = SP * dt, nx = x + Math.sin(dir) * st, nz = z + Math.cos(dir) * st; md = dir;
      if (!NAV.ok(nx, nz)) trav = R; else { x = nx; z = nz; trav += st; }
      if (trav >= R) {
        back = true; SFX.at('clang', x, z, 0.5);
        if (FX.near(x, z, 50)) { FX.sparks(x, 0.6, z, { n: 14, color: 0xffffff, color2: RX.c, speed: [4, 10], life: [0.15, 0.35], w: 0.07 }); FX.ring(x, z, { r0: 0.3, r1: 2.2, color: RX.c, life: 0.3, tex: 'shock' }); }
      }
    } else {
      const d = dist(x, z, h.x, h.z), st = BK * dt; md = angTo(x, z, h.x, h.z);
      if (d <= st + 0.9) {
        const b = addBuff(h, { id: 'rxcatch', dur: 2.5, shield: cs, src: h }); if (b && FX.near(h.x, h.z, 50)) b.fx = FX.bubble(h, RX.c, 2.5, h.radius + 0.9);
        SFX.at('clang', h.x, h.z, 0.7); SFX.at('shield', h.x, h.z, 0.4);
        if (FX.near(h.x, h.z, 50)) { FX.glow(h.x, 1.4, h.z, 3, RX.hot, 0.25, 'star'); FX.sparks(h.x, 1.2, h.z, { n: 10, color: 0xffffff, color2: RX.c, speed: [3, 8], life: [0.15, 0.3], w: 0.06 }); }
        return end();
      }
      x += Math.sin(md) * st; z += Math.cos(md) * st;
    }
    const S = back ? hit2 : hit1;
    for (const e of enemiesIn(h, x, z, 1.5)) {
      if (e.struct || S.has(e.id)) continue; S.add(e.id);
      damage(h, e, back ? dmg * 0.5 : dmg, 0); if (e.alive) slow(h, e, 0.3, 1.2, 'rxroll');
      SFX.at('mace', e.x, e.z, 0.5);
      if (FX.near(e.x, e.z, 45)) { FX.hit(e.x, e.height * 0.5, e.z, RX.c, !back); FX.sparks(e.x, 0.9, e.z, { n: 8, color: 0xffffff, color2: RX.c, speed: [4, 10], life: [0.12, 0.3], w: 0.06, dir: md, spread: 0.8 }); }
    }
    spin -= dt * 22;
    if (fx) { rxPlaceWheel(fx.mesh, x, 1.1, z, md, spin); fx.mesh.scale.setScalar(1.4); }
    ft += dt;
    if (ft > 0.035 && FX.near(x, z, 55)) {
      ft = 0; FX.flame(x - Math.sin(md) * 0.5, 0.3, z - Math.cos(md) * 0.5, { n: 3, color: RX.hot, color2: RX.deep, size: [0.7, 1.4], life: [0.3, 0.6], up: 1.8 });
      if (Math.random() < 0.5) FX.sparks(x, 0.15, z, { n: 2, color: 0xffe0a0, color2: RX.c, speed: [2, 5], life: [0.15, 0.3], w: 0.05, dir: md + Math.PI, spread: 0.6, up: 2 });
      if (Math.random() < 0.4) FX.scorch(x, z, 0.7, RX.c, 2.5); FX.light(x, 1.2, z, RX.c, 1.2, 8, 0.1);
    }
    return true;
  } });
}
// the counter after a parried blow: the attacker (if close enough) is struck and stunned, the gang gets its armour
function rxCounter(h, src, P) {
  if (!h.alive) return;
  const b = h.buffs.find(q => q.id === 'rxparry'); if (b) b.dead = true;
  SFX.at('clang', h.x, h.z, 1); SFX.at('impact', h.x, h.z, 0.7); SFX.at('engine', h.x, h.z, 0.4);
  if (src && src.alive && !src.struct && udist(h, src) < 8) {
    damage(h, src, P.ctr, 0); if (src.alive) stun(h, src, 1.0);
    if (FX.near(src.x, src.z, 50)) { FX.hit(src.x, src.height * 0.55, src.z, RX.c, true); FX.beam(h.x, h.z, src.x, src.z, { color: RX.hot, w: 0.4, life: 0.25, y: 1.3 }); }
  }
  rxGang(h, P.cs, 7);
  if (FX.near(h.x, h.z, 55)) {
    const a = src ? angTo(h.x, h.z, src.x, src.z) : h.facing; h.facing = a; h.anim.atkT = h.anim.atkDur = 0.3;
    FX.text(h.x, h.height + 1.1, h.z, 'Блок!', '#ffb070', 17); FX.punch(0.5); FX.hitstop(0.06); FX.shake(0.2);
    FX.glow(h.x + Math.sin(a) * 0.8, 1.4, h.z + Math.cos(a) * 0.8, 5, RX.hot, 0.2, 'flare'); FX.glow(h.x, 1.4, h.z, 3, 0xffffff, 0.12, 'star');
    FX.slash(h.x, h.z, a, { r: 3.6, color: RX.c, sweep: 2.4, life: 0.28 }); FX.ring(h.x, h.z, { r0: 0.5, r1: 7, color: RX.c, life: 0.45, tex: 'shock' }); FX.shock(h.x, h.z, 4, 0.8, 0.3);
    FX.sparks(h.x + Math.sin(a) * 0.8, 1.3, h.z + Math.cos(a) * 0.8, { n: 26, color: 0xffffff, color2: RX.c, speed: [8, 18], life: [0.15, 0.4], w: 0.1, dir: a, spread: 1.4, stretch: 0.08 });
  }
}
// the shield bash: everyone in front of her (4.2) is struck, thrown back and weakened (deals 20% less) for 3 sec
function rxBash(h, dir, dmg) {
  const R = 4.2, half = 0.8;
  SFX.at('clang', h.x, h.z, 0.9); SFX.at('heavy', h.x, h.z, 0.6); SFX.at('whoosh', h.x, h.z, 0.5);
  for (const e of enemiesIn(h, h.x, h.z, R + 0.6)) {
    if (e.struct || Math.abs(angDiff(dir, angTo(h.x, h.z, e.x, e.z))) > half + 0.15) continue;
    damage(h, e, dmg, 0); if (!e.alive) continue;
    knock(e, h.x, h.z, 2.6, 0.22); addBuff(e, { id: 'rxweak', dur: 3, dmgOut: 0.8, src: h });
    if (FX.near(e.x, e.z, 45)) { FX.hit(e.x, e.height * 0.55, e.z, RX.c, true); if (e.kind === 'hero') { FX.aura(e, RX.deep, 3, 1.2, 'ringThin', 2); FX.text(e.x, e.height + 0.9, e.z, 'ослаблен', '#ff9a5a', 13); } }
  }
  if (FX.near(h.x, h.z, 55)) {
    const fx = h.x + Math.sin(dir) * 1.2, fz = h.z + Math.cos(dir) * 1.2;
    akWave(h.x, h.z, dir, R, half, 0.2, 1.1); FX.slash(h.x, h.z, dir, { r: R + 0.3, color: RX.c, sweep: 1.6, life: 0.26 });
    FX.glow(fx, 1.3, fz, 5, RX.hot, 0.18, 'flare'); FX.light(fx, 2, fz, RX.c, 2.4, 12, 0.25); FX.shock(fx, fz, 3.5, 1, 0.3);
    FX.sparks(fx, 1.2, fz, { n: 22, color: 0xffffff, color2: RX.c, speed: [8, 16], life: [0.15, 0.35], w: 0.08, dir, spread: half }); FX.shake(0.18);
    FX.burst(fx, 0.5, fz, { smoke: true, n: 4, color: 0x8a7a70, color2: 0x2a2420, speed: [1, 3], life: [0.4, 0.8], size: [0.6, 1.4], dir, spread: 0.5, a: 0.35 });
    // what the blow leaves behind: a burnt fan on the ground, fire licking along its edges, a second arc rolling out after the first
    FX.scorch(fx + Math.sin(dir) * 1.2, fz + Math.cos(dir) * 1.2, 1.8, RX.c, 4); after(0.07, () => akWave(h.x, h.z, dir, R + 0.6, half * 0.85, 0.24, 0.6));
    for (const s of [-1, 1]) for (let i = 1; i <= 3; i++) { const a = dir + s * half, d = i * 1.3; FX.flame(h.x + Math.sin(a) * d, 0.3, h.z + Math.cos(a) * d, { n: 2, color: RX.hot, color2: RX.deep, size: [0.5, 1.1], life: [0.3, 0.6], up: 2, a: 0.5 }); }
    FX.ring(fx, fz, { r0: 0.4, r1: 2.6, color: RX.deep, life: 0.35, tex: 'shock', op: 0.7 });
  }
}
// «Dead end», the last stop: a slam of the wheel at the end of the ride
function rxSlam(h, slam, gs) {
  const R = 4.5;
  SFX.at('quake', h.x, h.z, 0.8); SFX.at('clang', h.x, h.z, 1); SFX.at('bigboom', h.x, h.z, 0.5);
  for (const e of enemiesIn(h, h.x, h.z, R)) { if (e.struct) continue; damage(h, e, slam, 0); if (e.alive) stun(h, e, 1.2, 1.2); }
  rxGang(h, gs, 9);
  h.anim.castT = h.anim.castDur = 0.45; h.anim.castType = 'slam';
  if (FX.near(h.x, h.z, 60)) {
    FX.explosion(h.x, h.z, R, RX.c, { color2: RX.hot }); FX.ring(h.x, h.z, { r0: 0.5, r1: R + 1, color: RX.hot, life: 0.5, tex: 'shock' }); FX.ring(h.x, h.z, { r0: 1, r1: 9, color: RX.c, life: 0.7, tex: 'rune2', spin: 2, op: 0.6 });
    FX.shock(h.x, h.z, 7, 1.4, 0.5); FX.shake(0.6); FX.hitstop(0.07); FX.punch(0.7); FX.light(h.x, 3, h.z, RX.c, 3, 18, 0.5);
    FX.debris(h.x, 0.3, h.z, { n: 12, color: 0x4a3a30, speed: [4, 10], size: [0.2, 0.5] }); FX.scorch(h.x, h.z, 4, RX.c, 6);
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; FX.flame(h.x + Math.sin(a) * 3, 0.4, h.z + Math.cos(a) * 3, { n: 3, color: RX.hot, color2: RX.deep, size: [0.8, 1.6], life: [0.4, 0.8], up: 4 }); }
    FX.sparks(h.x, 0.6, h.z, { n: 30, color: 0xffffff, color2: RX.c, speed: [8, 18], life: [0.2, 0.5], ring: true, w: 0.1 });
  }
}

HEROES.push(
  /* ================= 71. Roxa ================= */
  {
    id: 'roxa', name: 'Рокса', title: 'Королева трассы', role: 'front', roleName: 'Танк', build: 'tank', bars: [3, 5, 4, 2], diffc: 2, atkSfx: 'mace',
    lore: 'Рокса держит самую большую байкерскую банду на трассах вдоль Разлома. Своих она не бросает никогда: когда твари перевернули их колонну, она сорвала колесо с разбитого байка, обмотала руку цепью и прикрывала ребят, пока те не ушли. Колесо так и осталось у неё вместо щита, а банда с тех пор ездит туда, куда скажет Рокса, — даже в сам Разлом.',
    look: { bulk: 1.12, h: 1.04, scale: 1.02, c1: 0x1c1a1e, c2: 0x2a2628, c3: 0x3a2a22, skin: 0xe8c4a8, hands: 0x1c1a1e, cuff: RX.c, metal: 0x9a9ea6, glow: RX.c, head: 'roxa', hair: 0xb02a1a, shirt: 0xff7a1a, chest: 'biker', legs: 'boots', sh: 'spike', weapon: 'wheel', wc: 'melee' },
    stats: ST(700, 98, 300, 36, 56, 3.2, 34, 3.6, 0.7, 8.6, 2.8),
    innate: { name: 'Броня банды', icon: 'rxinn', desc: 'Удачное «Парирование» и «Тупик» дают «Броню банды» Роксе и союзным героям рядом: щит на 4 сек. Пока он держится, союзник наносит на 10% больше урона.' },
    // the parry: the first blow from an enemy during the stance is blocked completely, and she answers it
    preHurt(h, src, d, type, o) {
      const P = h.rxParry;
      if (P && !P.done && G.time < P.until && src && hostile(h, src) && !o.dot) { P.done = true; after(0, () => rxCounter(h, src, P)); return 0; }
      return d;
    },
    abilities: [
      {
        key: 'Q', name: 'Огненное колесо', icon: 'rxwheel', cd: 8, cost: 50, range: 10, ind: { type: 'line', w: 2, fixed: true }, anim: 'toss', animDur: 0.4, lock: 0.2, ai: { t: 'shot', sp: 24, farm: true },
        desc: 'Рокса пускает колесо-щит катиться вперёд (до 10). Оно оставляет огненный след, на обратном пути возвращается к ней и задевает врагов ещё раз. Каждый задетый враг получает физический урон (на обратном пути половину) и замедляется на 30% на 1.2 сек. Поймав колесо, Рокса получает щит на 2.5 сек.',
        cast(h, p) {
          rxRoll(h, p.dir, D(h, 70, 20, 0.6, 0), D(h, 30, 10, 0, 0) + h.maxHp * 0.04);
          SFX.at('whoosh', h.x, h.z, 0.7); SFX.at('engine', h.x, h.z, 0.35);
          if (FX.near(h.x, h.z, 55)) FX.glow(h.x + Math.sin(p.dir) * 1, 1.2, h.z + Math.cos(p.dir) * 1, 2.5, RX.hot, 0.18, 'star');
        }
      },
      {
        key: 'W', name: 'Парирование', icon: 'rxparry', cd: 12, cost: 50, range: 0, ind: { type: 'self', r: 7 }, anim: 'flex', animDur: 0.5, lock: 0.1, ai: { t: 'parry' }, noCue: true,
        desc: 'Рокса на 1.2 сек поднимает щит и получает на 60% меньше урона. Первый удар врага за это время она блокирует полностью и отвечает: атакующий (до 8) получает физический урон и оглушается на 1 сек, а «Броня банды» — щит Роксе и союзным героям в радиусе 7. Если удара не было, перезарядка — 4 сек.',
        cast(h) {
          h.rxParry = { until: G.time + 1.2, done: false, cs: D(h, 60, 18, 0, 0) + h.maxHp * 0.06, ctr: D(h, 60, 15, 0.5, 0) };
          const b = addBuff(h, { id: 'rxparry', dur: 1.2, dmgIn: 0.4, src: h, onEnd(u) { if (u.rxParry && !u.rxParry.done) u.cd[1] = Math.min(u.cd[1], 4); u.rxParry = null; } });
          SFX.at('clang', h.x, h.z, 0.45); SFX.at('shield', h.x, h.z, 0.4);
          if (b && FX.near(h.x, h.z, 55)) {
            b.fx = FX.aura(h, RX.c, 1.2, 1.8, 'ringThin', 6);
            FX.ring(h.x, h.z, { r0: 2.6, r1: 1.2, color: RX.hot, life: 0.3 }); FX.glow(h.x + Math.sin(h.facing) * 0.6, 1.4, h.z + Math.cos(h.facing) * 0.6, 3, RX.c, 0.4, 'star');
            // the guard is something you can see: a burning phantom wheel held up in front of her, turning, with embers falling off it, for as long as the parry lasts
            const gw = rxWheelMesh(true); let et = 0;
            FX.add(gw, 1.2, (k, me, dt, en) => {
              if (!h.alive || !h.rxParry || h.rxParry.done) { en.dead = true; return; } const f = h.facing, t = en.t, s = 1.7 * Math.min(1, t / 0.12) * (1 + Math.sin(t * 14) * 0.04);
              me.position.set(h.x + Math.sin(f) * 1.15, 1.45, h.z + Math.cos(f) * 1.15); me.rotation.order = 'YXZ'; me.rotation.set(-0.5, f, 0); me.userData.spin.rotation.z = t * 9; me.scale.setScalar(s);
              et += dt; if (et > 0.1) { et = 0; FX.sparks(me.position.x, 1.35, me.position.z, { n: 2, color: RX.hot, color2: RX.c, speed: [1, 3], life: [0.25, 0.45], grav: -6, w: 0.06, rad: 0.8 }); }
            });
            FX.zone(h.x, h.z, 2, RX.deep, 1.2, { tex: 'ringThin', spin: -5, op: 0.6, follow: h }); FX.light(h.x, 2, h.z, RX.c, 1.4, 9, 1.2);
          }
        }
      },
      {
        key: 'E', name: 'Сбить с ног', icon: 'rxbash', cd: 11, cost: 55, range: 4.2, ind: { type: 'cone', r: 4.2 }, anim: 'thrust', animDur: 0.4, lock: 0.3, ai: { t: 'cone' },
        desc: 'Рокса делает шаг вперёд и бьёт колесом-щитом. Враги перед ней (до 4.2) получают физический урон, отлетают назад и 3 сек наносят на 20% меньше урона.',
        cast(h, p) {
          const dir = p.dir, dmg = D(h, 55, 16, 0.7, 0) + h.maxHp * 0.03;
          dashTo(h, h.x + Math.sin(dir) * 1.6, h.z + Math.cos(dir) * 1.6, 22, { ribbon: false, onEnd: u => rxBash(u, dir, dmg) });
        }
      },
      {
        key: 'R', name: 'Тупик', icon: 'rxult', cd: 80, cost: 100, range: 12, ind: { type: 'line', w: 3 }, anim: 'charge', animDur: 0.5, lock: 0, ai: { t: 'gap', ult: true, rad: 4.5, hp: 0.7 },
        desc: 'Рокса срывается вперёд (до 12) на призрачном огненном байке. Враги на пути получают физический урон, и байк тащит их за собой. В конце она бьёт колесом оземь: враги в радиусе 4.5 получают большой физический урон и оглушаются на 1.2 сек, а «Броня банды» накрывает союзных героев в радиусе 9. Во время рывка Рокса получает на 30% меньше урона.',
        cast(h, p) {
          const dir = p.dir, path = D(h, 100, 30, 0.6, 0), slam = D(h, 150, 50, 0.8, 0) + h.maxHp * 0.05, gs = D(h, 80, 25, 0, 0) + h.maxHp * 0.08;
          const dur = dist(h.x, h.z, p.x, p.z) / 28 + 0.15;
          SFX.at('ultcue', h.x, h.z, 0.7); SFX.at('engine', h.x, h.z, 1); SFX.at('screech', h.x, h.z, 0.6);
          addBuff(h, { id: 'rxride', dur, dmgIn: 0.7, src: h });
          if (FX.near(h.x, h.z, 60)) {
            FX.text(h.x, h.height + 1.3, h.z, 'Тупик!', '#ffb070', 18);
            for (const sd of [1, -1]) { let sp = 0; FX.add(rxWheelMesh(true), dur + 0.1, (k, me, dt, en) => { if (!h.alive || (!h.dash && en.t > 0.1)) { en.dead = true; return; } sp -= dt * 30; rxPlaceWheel(me, h.x + Math.sin(h.facing) * 1.0 * sd, 0.8, h.z + Math.cos(h.facing) * 1.0 * sd, h.facing, sp); }); }
          }
          dashTo(h, p.x, p.z, 28, {
            w: 1.7, ribbon: RX.c,
            trail: u => {
              if (!FX.near(u.x, u.z, 55)) return;
              for (const sd of [1, -1]) FX.flame(u.x + Math.sin(u.facing) * sd, 0.3, u.z + Math.cos(u.facing) * sd, { n: 2, color: RX.hot, color2: RX.deep, size: [0.6, 1.2], life: [0.25, 0.5], up: 1.5 });
              if (Math.random() < 0.6) FX.sparks(u.x, 0.2, u.z, { n: 3, color: 0xffe0a0, color2: RX.c, speed: [3, 7], life: [0.15, 0.3], w: 0.06, dir: u.facing + Math.PI, spread: 0.7, up: 2 });
              if (Math.random() < 0.35) FX.scorch(u.x, u.z, 0.8, RX.c, 3); FX.light(u.x, 1.5, u.z, RX.c, 1.6, 10, 0.12);
            },
            onHit: (e, u) => {
              if (e.struct) return; damage(u, e, path, 0); if (e.alive) knock(e, e.x - Math.sin(dir), e.z - Math.cos(dir), 3.5, 0.3);
              SFX.at('heavy', e.x, e.z, 0.5); if (FX.near(e.x, e.z, 45)) { FX.hit(e.x, e.height * 0.5, e.z, RX.c, true); FX.sparks(e.x, 1, e.z, { n: 10, color: 0xffffff, color2: RX.c, speed: [5, 12], life: [0.15, 0.3], w: 0.07, dir, spread: 0.7 }); }
            },
            onEnd: u => rxSlam(u, slam, gs)
          });
        }
      }
    ]
  }
);

/* ---------- icons ---------- */
Object.assign(GLYPH, {
  // a shield over three small figures
  rxinn(T) { T.P(0, -24, 18, -16, 16, 6, 0, 22, -16, 6, -18, -16); T.cut(() => { T.C(0, -4, 4); T.C(-8, 8, 3); T.C(8, 8, 3); }); },
  // a wheel rolling to the right, flames behind it
  rxwheel(T) { T.O(4, 0, 15, 5); T.C(4, 0, 4); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; T.S(2.5, 4, 0, 4 + Math.cos(a) * 12, Math.sin(a) * 12); } T.al(0.6, () => { T.S(3, -14, -8, -27, -12); T.S(3, -14, 0, -28, 0); T.S(3, -14, 8, -27, 12); }); },
  // a raised round shield and a blow breaking on it
  rxparry(T) { T.C(-4, 0, 17); T.cut(() => T.O(-4, 0, 11, 3)); T.hi(() => T.C(-4, 0, 4)); T.al(0.8, () => { T.S(3, 16, -16, 26, -24); T.S(3, 17, 0, 28, 0); T.S(3, 16, 16, 26, 24); }); },
  // a shield bash: a wheel thrust forward, a burst in front of it
  rxbash(T) { T.g.fillRect(-26, -3, 14, 6); T.O(-4, 0, 11, 4); T.C(-4, 0, 3); T.star(16, 0, 11, 4, 7); },
  // two wheels of a bike and a slam under them
  rxult(T) { T.O(-14, -2, 9, 3.5); T.O(14, -2, 9, 3.5); T.S(3.5, -14, -2, 0, -14); T.S(3.5, 0, -14, 14, -2); T.al(0.6, () => { T.g.fillRect(-26, 16, 52, 4); T.S(3, -20, 12, -26, 6); T.S(3, 20, 12, 26, 6); }); }
});
