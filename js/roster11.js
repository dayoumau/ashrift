'use strict';
/* ===== roster, parts 34–35 (heroes 61–62). Loaded after roster10.js; the glyphs are added to GLYPH at the end.
   61. Ten & Haku — a brother and a sister who play as one: two figures always side by side, a swap key (D) trades places and the whole kit.
       He reads people — cards, bluffs, deals; she calculates — chess pieces, ricochets, a board where every square is under fire.
   62. Reisei — the calm strategist from the white room: hides his strength, sacrifices pawns, kicks with his hands in his pockets, and has a plan. ===== */
const TWN = { t: 0xff3a5c, tp: 0xffc8d4, td: 0x5a0a1c, h: 0xb89cff, hp: 0xf0e8ff, hd: 0x2c1a66, w: 0xf6f4ff, k: 0x15121e, gold: 0xffd86a, red: 0xe02840 };
const RSE = { c: 0xcfeeff, pale: 0xffffff, ice: 0x8fd4ff, deep: 0x2a4a6a, red: 0xd02838, ink: 0x0e1218 };
const TWN_SWAP_CD = 2.5;
const _tv = new THREE.Vector3();
function twHand(h, left) { const n = left ? 'handL' : 'handR'; if (h.rig && h.rig[n] && h.rig.root.visible) { h.rig[n].getWorldPosition(_tv); return { x: _tv.x, y: _tv.y, z: _tv.z }; } return { x: h.x, y: 1.5, z: h.z }; }

/* ---------- playing cards: a canvas per face (0 — the back), two-sided meshes in a group so FX.drop never disposes the shared materials ---------- */
const _twCT = {}, _twCM = {}; let _twCG = null;
function twCardTex(r, su) {
  const key = r + '_' + (su || 0); if (_twCT[key]) return _twCT[key];
  const c = document.createElement('canvas'); c.width = 96; c.height = 136; const g = c.getContext('2d');
  const rr = (x, y, w, h, q) => { g.beginPath(); g.moveTo(x + q, y); g.arcTo(x + w, y, x + w, y + h, q); g.arcTo(x + w, y + h, x, y + h, q); g.arcTo(x, y + h, x, y, q); g.arcTo(x, y, x + w, y, q); g.closePath(); };
  if (!r) {   // the back: a dark board of squares in a white frame, two red brackets of an empty name in the middle
    g.fillStyle = '#f2f0f6'; rr(1, 1, 94, 134, 9); g.fill(); g.fillStyle = '#16121e'; rr(6, 6, 84, 124, 6); g.fill();
    for (let j = 0; j < 6; j++) for (let i = 0; i < 4; i++) if ((i + j) % 2) { g.fillStyle = '#2c2440'; g.fillRect(10 + i * 19, 10 + j * 19.4, 19, 19.4); }
    g.strokeStyle = '#ff3a5c'; g.lineWidth = 6; g.beginPath(); g.moveTo(40, 46); g.lineTo(30, 46); g.lineTo(30, 90); g.lineTo(40, 90); g.moveTo(56, 46); g.lineTo(66, 46); g.lineTo(66, 90); g.lineTo(56, 90); g.stroke();
  } else {
    const suit = '♠♥♦♣'[su || 0], red = suit === '♥' || suit === '♦', rank = ({ 11: 'J', 12: 'Q', 13: 'K', 14: 'A' })[r] || String(r);
    g.fillStyle = '#f4f0e6'; rr(1, 1, 94, 134, 9); g.fill(); g.strokeStyle = '#c8c0b0'; g.lineWidth = 2; rr(5, 5, 86, 126, 6); g.stroke();
    g.fillStyle = red ? '#c8202e' : '#16121e'; g.font = 'bold 26px Georgia, serif'; g.textAlign = 'center'; g.fillText(rank, 17, 30); g.font = '20px Georgia, serif'; g.fillText(suit, 17, 50);
    g.save(); g.translate(79, 106); g.rotate(Math.PI); g.font = 'bold 26px Georgia, serif'; g.fillText(rank, 0, 0); g.font = '20px Georgia, serif'; g.fillText(suit, 0, 20); g.restore();
    g.font = (r === 14 ? 'bold 64px' : '54px') + ' Georgia, serif'; g.fillText(suit, 48, 88);
  }
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return (_twCT[key] = t);
}
function twCardMat(r, su) { const key = r + '_' + (su || 0); return _twCM[key] || (_twCM[key] = new THREE.MeshBasicMaterial({ map: twCardTex(r, su), color: 0xd8d8d8, transparent: true, depthWrite: true })); }
function twCard(r, s, su) {
  if (!_twCG) _twCG = new THREE.PlaneGeometry(0.62, 0.88);
  if (su === undefined) su = Math.floor(Math.random() * 4); const g = new THREE.Group(), f = new THREE.Mesh(_twCG, twCardMat(r, r ? su : 0)), b = new THREE.Mesh(_twCG, twCardMat(0, 0)); b.rotation.y = Math.PI; g.add(f, b); g.scale.setScalar(s || 1); g.userData.face = f; return g;
}
// a card fluttering in the air for a moment (shards of a burst deck)
function twCardsBurst(x, y, z, n, sp, life) {
  if (!FX.near(x, z, 50)) return;
  for (let i = 0; i < n; i++) {
    const m = twCard(2 + Math.floor(Math.random() * 13), rand(0.35, 0.55)), a = rand(TAU), v = rand(sp * 0.5, sp), vy = rand(2, 6), rx = rand(-9, 9), ry = rand(-9, 9), L = life * rand(0.7, 1.1);
    let px = x, py = y, pz = z, vx = Math.sin(a) * v, vz = Math.cos(a) * v, yy = vy;
    FX.add(m, L, (k, me, dt) => { yy -= 7 * dt; const dr = Math.exp(-dt * 2.2); vx *= dr; vz *= dr; px += vx * dt; py = Math.max(0.05, py + yy * dt); pz += vz * dt; me.position.set(px, py, pz); me.rotation.x += rx * dt; me.rotation.y += ry * dt; me.scale.setScalar(0.45 * (k > 0.8 ? (1 - k) / 0.2 : 1)); });
  }
}

/* ---------- chess pieces: solid lit pieces in a dark outline shell (as on the master's board), and a glowing board texture ---------- */
const _twBT = {};
function twBoardTex(n) {
  if (_twBT[n]) return _twBT[n]; const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), q = 240 / n;
  g.strokeStyle = 'rgba(255,255,255,0.95)'; g.lineWidth = 5; g.strokeRect(5, 5, 246, 246);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { g.fillStyle = (i + j) % 2 ? 'rgba(255,255,255,0.62)' : 'rgba(255,255,255,0.1)'; g.fillRect(8 + i * q + 1, 8 + j * q + 1, q - 2, q - 2); }
  return (_twBT[n] = new THREE.CanvasTexture(c));
}
function twPiece(kind, s, col, emis, outl) {
  const g = new THREE.Group(), pc = new THREE.Mesh(chessGeo(kind), new THREE.MeshPhongMaterial({ color: col, emissive: emis, flatShading: true, shininess: 50, specular: 0x8888aa, transparent: true }));
  const sh = new THREE.Mesh(chessGeo(kind), new THREE.MeshBasicMaterial({ color: outl === undefined ? 0x0a0812 : outl, side: THREE.BackSide, transparent: true }));
  pc.scale.setScalar(s); sh.scale.set(s * 1.16, s * 1.06, s * 1.16); sh.position.y = -s * 0.03; pc.userData.own = sh.userData.own = true; g.add(sh, pc); g.userData.pc = pc; g.userData.sh = sh;
  g.userData.fade = o => { pc.material.opacity = o; sh.material.opacity = o; };
  return g;
}
// a flat glowing board lying on the ground: n×n squares, side `size`, turned by `ang`
const twSqMat = c => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });   // a plain square (a lit board cell)
function twBoardMesh(n, size, color, ang) { const m = new THREE.Mesh(FX.geo.flat, new THREE.MeshBasicMaterial({ map: twBoardTex(n), color, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); m.scale.set(size, 1, size); m.rotation.y = ang || 0; m.renderOrder = 4; return m; }
// a ghost of a whole figure (the decoy, the after-image): the rig cloned with one flat material
function twGhost(rig, col, life, op, x, z) {
  if (!FX.near(x, z, 55)) return null; const g = rig.root.clone(true), o0 = op || 0.5, m = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: o0, depthWrite: false });
  g.traverse(c => { if (c.isMesh) { c.material = m; c.castShadow = false; } else if (c.isSprite) c.visible = false; }); const ri = rig.root.children.indexOf(rig.ring); if (ri >= 0) g.children[ri].visible = false; g.material = m;
  g.position.set(x, 0, z); return FX.add(g, life, (k, me) => { m.opacity = o0 * (1 - k * k); });
}

/* ==================================================================== 61. TEN & HAKU ==================================================================== */
// the second figure: built once, kept in the scene beside the hero; the swap exchanges the two rigs and the two kits
function twInit(h) {
  const B = h.def; h.def = Object.create(B);   // his own copy of the definition: the kit, the look, the stats and the shot change with the swap
  const r2 = buildHero(B.pal, h.isPlayer ? 0xeaffea : TEAM_COL[h.team]); r2.ring.visible = false; G.scene.add(r2.root); r2.root.position.set(h.x, 0, h.z); h.rig2 = r2;
  h.tw = { f: 0, other: [0, 0, 0, 0], swapAt: 0, x: h.x - 1, z: h.z - 1, aiAt: 0, cst: 0,
    S: { rig: r2, id: h.id + 0.5, facing: h.facing, moving: false, ms: 9, flash: 0, dead: false, yOff: 0, anim: { walk: 0, atkT: 0, atkDur: 1, castT: 0, castDur: 1, castType: 'cast', deathT: 0, spinA: 0, alt: false } } };
  twApply(h, 0);
}
function twApply(h, f) {
  const B = Object.getPrototypeOf(h.def), D = h.def;
  D.abilities = f ? B.alt : B.abilities; D.look = f ? B.pal : B.look; D.stats = f ? B.stats2 : B.stats; D.shootAtk = f ? null : B.shootAtk; D.projMesh = f ? 'bolt' : 'blade'; D.atkSfx = f ? 'arrow' : 'cast';
  h.pcol = D.look.glow;
}
function twSwap(h, manual) {
  const T = h.tw; if (!T || !h.alive) return false;
  const deny = m => { if (manual && h.isPlayer) { UI.msg(m); SFX.play('deny'); } return false; };
  if (G.time < T.swapAt) return deny('Смена ещё не готова');
  if (h.stunned) return deny('Вы оглушены');
  if (h.dash || h.forced || h.ride) return deny('Сейчас нельзя');
  if (!isFinite(T.x) || !isFinite(T.z)) twFollow(h, 0);
  const ox = h.x, oz = h.z; let nx = T.x, nz = T.z; if (!NAV.ok(nx, nz)) { const q = NAV.nearest(nx, nz); nx = q.x; nz = q.z; }
  const r1 = h.rig, r2 = h.rig2; h.rig = r2; h.rig2 = r1; r2.ring.visible = true; r1.ring.visible = false; T.S.rig = r1;
  const dst = h.path && h.path.length ? h.path[h.path.length - 1] : null;   // a walk in progress goes on from the new spot
  h.x = nx; h.z = nz; T.x = ox; T.z = oz; h.path = null; if (dst && h.order && h.order.type === 'move') setMove(h, dst.x, dst.z);
  const an = h.anim; h.anim = T.S.anim; T.S.anim = an; h.anim.atkT = 0; T.S.anim.atkT = 0; T.S.anim.castT = 0; h.windup = 0;
  T.f ^= 1; twApply(h, T.f);
  for (let i = 0; i < 4; i++) { const c = h.cd[i]; h.cd[i] = T.other[i]; T.other[i] = c; }
  recalcHero(h); h.range = h.def.stats.range; h.height = h.rig.height || h.height;
  T.swapAt = G.time + TWN_SWAP_CD; addBuff(h, { id: 'twrelay', dur: 2.5, dmgOut: 1.2 });
  h.anim.castT = h.anim.castDur = 0.35; h.anim.castType = T.f ? 'move' : 'deal';
  twSwapFx(h, ox, oz);
  if (h.isPlayer) twHud(h);
  return true;
}
// the swap: a flash of a black-and-white board under both, a red and a violet streak crossing between them, two brackets snapping shut
function twSwapFx(h, ox, oz) {
  SFX.at('blink', h.x, h.z, 0.5); SFX.at('blip', h.x, h.z, 0.35); if (!FX.near(h.x, h.z, 55)) return;
  const mx = (h.x + ox) / 2, mz = (h.z + oz) / 2, a = angTo(ox, oz, h.x, h.z), cA = h.tw.f ? TWN.h : TWN.t, cB = h.tw.f ? TWN.t : TWN.h;
  const bd = twBoardMesh(4, 4.2, 0xffffff, a); bd.position.set(mx, 0.09, mz); FX.add(bd, 0.45, (k, me) => { me.material.opacity = 0.55 * (1 - k); const s = 4.2 * (0.8 + 0.25 * easeOut(k)); me.scale.set(s, 1, s); });
  FX.beam(ox, oz, h.x, h.z, { color: cA, w: 0.5, life: 0.25, y: 1.2 }); FX.beam(h.x, h.z, ox, oz, { color: cB, w: 0.35, life: 0.3, y: 1.0 });
  FX.ring(h.x, h.z, { r0: 0.3, r1: 2, color: cA, life: 0.3, tex: 'ringThin' }); FX.ring(ox, oz, { r0: 2, r1: 0.3, color: cB, life: 0.3, tex: 'ringThin' });
  FX.sparks(h.x, 1.2, h.z, { n: 8, color: 0xffffff, color2: cA, speed: [3, 7], life: [0.15, 0.35], w: 0.07 }); FX.glow(h.x, 1.3, h.z, 2.4, cA, 0.2, 'star');
}
// the HUD follows the swap: icons, costs, portrait, accent colour
function twHud(h) {
  if (typeof UI === 'undefined' || !$('abs')) return; const D = h.def, col = D.look.glow;
  for (let i = 0; i < 4; i++) { const a = D.abilities[i], el = $('ab' + i); if (!a || !el) continue; el.children[0].src = iconURL(a.icon, a.iconCol || col); const c = el.querySelector('.cost'); if (c) c.textContent = a.cost || ''; }
  const inn = $('abI'); if (inn) inn.children[0].src = iconURL(D.innate.icon, col);
  $('porimg').src = (UI.portraits && (UI.portraits[D.id + (h.tw.f ? '2' : '')] || UI.portraits[D.id])) || ''; $('bar').style.setProperty('--hc', css(col));
  UI.lastCd = h.cd.slice(); G.aim = -1; UI.tip();
}
// one ultimate of the pair puts the other one on a cooldown of at least 20 s
function twLockR(h) { if (h.tw) h.tw.other[3] = Math.max(h.tw.other[3], 20); }
// the one who walks behind keeps a step behind and to the right (game logic: runs from tick, so it works without drawing too)
function twFollow(h, dt) {
  const T = h.tw, S = T.S, f = h.facing, tx = h.x - Math.sin(f) * 1.05 + Math.cos(f) * 0.95, tz = h.z - Math.cos(f) * 1.05 - Math.sin(f) * 0.95;
  if (!isFinite(T.x) || !isFinite(T.z)) { T.x = tx; T.z = tz; }
  const d = dist(T.x, T.z, tx, tz);
  if (d > 8) { T.x = tx; T.z = tz; }
  else if (d > 0.3 && dt > 0) { const st = Math.min(d, Math.max(h.ms || 9, d * 3.2) * dt); T.x += (tx - T.x) / d * st; T.z += (tz - T.z) / d * st; }
  S.moving = d > 0.5; S.ms = h.ms; S.facing = S.moving ? angTo(T.x, T.z, tx, tz) : h.facing; S.yOff = h.yOff || 0;
}
// ...and is drawn: mirrors death and rebirth; casts with a little gesture of her (his) own
function twAnim2(h, dt) {
  const T = h.tw; if (!T) return; const S = T.S, r = S.rig, t = G.time;
  if (h.dead) { if (!S.dead) { S.dead = true; S.anim.deathT = 0; } }
  else {
    if (S.dead || !r.root.visible) { S.dead = false; S.anim.deathT = 0; r.root.visible = true; r.root.position.y = 0; T.x = h.x - Math.sin(h.facing) * 1.1; T.z = h.z - Math.cos(h.facing) * 1.1; }
    if (h.anim.castT > T.cst + 0.01 && h.anim.castT > 0.2) { S.anim.castT = S.anim.castDur = 0.55; S.anim.castType = T.f ? 'pact' : 'calc'; S.eyeT = t + 0.5; }   // a cast: the other one helps
    T.cst = h.anim.castT;
  }
  if (!isFinite(T.x)) return; r.root.position.x = T.x; r.root.position.z = T.z; if (dt > 0) animHero(S, dt);
}
// his basic attack: a card flicked at the target, spinning
function twCardAtk(u, t) {
  const A = twHand(u); let done = false;
  const p = homing(u, t, { x: A.x, z: A.z, y: A.y, speed: 34, color: TWN.t, size: 0.16, onHit: tt => { done = true; basicHit(u, tt); FX.sparks(tt.x, tt.height * 0.55, tt.z, { n: 5, color: 0xffffff, color2: TWN.t, speed: [3, 8], life: [0.12, 0.3], w: 0.08 }); SFX.at('needle', tt.x, tt.z, 0.25); } });
  if (!FX.near(u.x, u.z, 55)) return; const g = twCard(2 + Math.floor(Math.random() * 13), 0.55);
  FX.add(g, 2, (k, me, dt, en) => { if (done || !G.proj.includes(p)) { en.dead = true; return; } me.position.set(p.x, p.y, p.z); me.rotation.set(-HPI, 0, en.t * 22); });
}

/* ---------- Ten: cards, reading people, deals ---------- */
let TWN_N = 0;
// "read": the enemy's hand is open — he takes 10% more damage, and his card hangs over his head
function twRead(h, e) {
  const b = addBuff(e, { id: 'twread', dur: 5, dmgIn: 1.1, src: h }); if (!b) return;
  FX.text(e.x, e.height + 1.1, e.z, 'прочитан', '#ff8aa0', 13); SFX.at('blip', e.x, e.z, 0.4);
  const c = twCard(14, 0.7); b.fx = FX.add(c, 5, (k, me, dt, en) => { if (!e.alive) { en.dead = true; return; } me.position.set(e.x, e.height + 1.25 + Math.sin(en.t * 3) * 0.08 + (e.yOff || 0), e.z); me.rotation.set(-0.35, en.t * 2.2, 0); me.scale.setScalar(0.7 * Math.min(1, en.t / 0.15) * Math.min(1, (5 - en.t) / 0.3)); });
}
const twIsRead = e => e.buffs.some(b => b.id === 'twread');
function twThrow(h, A, dir, range, dmg, id) {
  const p = shot(h, { x: A.x, z: A.z, y: A.y, dir, speed: 30, range, w: 0.5, mesh: false, ribbon: 0.3, color: TWN.t,
    onHit(u) { damage(h, u, dmg, 1); FX.sparks(u.x, 1.2, u.z, { n: 6, color: 0xffffff, color2: TWN.t, speed: [3, 8], life: [0.15, 0.35], w: 0.08 }); SFX.at('needle', u.x, u.z, 0.35);
      if (u.kind === 'hero' && u.alive) { u._twc = u._twc && u._twc.id === id ? u._twc : { id, n: 0 }; if (++u._twc.n === 2) twRead(h, u); } } });
  if (!FX.near(h.x, h.z, 55)) return; const g = twCard(2 + Math.floor(Math.random() * 13), 0.75);
  FX.add(g, range / 30 + 0.3, (k, me, dt, en) => { if (!G.proj.includes(p)) { en.dead = true; return; } me.position.set(p.x, p.y, p.z); me.rotation.set(-HPI, 0, en.t * 26); });
}
// the decoy: both of them in cards and light; it bursts when its time is up or an enemy hero walks into it
function twDecoy(h, x, z, dmg) {
  const L = 2.5, gs = [twGhost(h.rig, TWN.t, L, 0.42, x, z), twGhost(h.rig2, TWN.h, L, 0.42, h.tw.x, h.tw.z)].filter(Boolean); let done = false;
  for (const g of gs) g.mesh.rotation.y = h.facing;
  const spin = FX.near(x, z, 55) ? FX.add(new THREE.Group(), L, (k, me, dt, en) => { if (done) { en.dead = true; return; } if (Math.random() < dt * 6) FX.sparks(x + rand(-0.6, 0.6), rand(0.5, 2), z + rand(-0.6, 0.6), { n: 1, color: TWN.tp, color2: TWN.t, speed: [0.5, 1.5], life: [0.3, 0.5], w: 0.06, grav: 0 }); }) : null;
  const burst = () => {
    if (done) return; done = true; for (const g of gs) g.dead = true; if (spin) spin.dead = true;
    for (const e of enemiesIn(h, x, z, 3)) { damage(h, e, dmg, 1); if (e.alive) slow(h, e, 0.35, 1.5, 'twdecoy'); }
    SFX.at('card', x, z, 0.75); SFX.at('gust', x, z, 0.5); SFX.at('pop', x, z, 0.45); if (!FX.near(x, z, 55)) return;
    twCardsBurst(x, 1.2, z, 18, 9, 1.1); FX.ring(x, z, { r0: 0.4, r1: 3.3, color: TWN.t, life: 0.4, tex: 'shock' }); FX.shock(x, z, 3.5, 0.8, 0.4);
    FX.burst(x, 1, z, { n: 14, color: TWN.tp, color2: TWN.t, speed: [3, 8], life: [0.3, 0.6], size: [0.4, 0.05], ring: true }); FX.glow(x, 1.2, z, 4, TWN.t, 0.25, 'star');
  };
  G.actors.push({ t: 0, update(dt) { if (done) return false; this.t += dt; if (this.t >= L || G.heroes.some(e => e.alive && hostile(h, e) && dist(e.x, e.z, x, z) < 1.6)) { burst(); return false; } return true; } });
}
// the deal: a golden contract between the two, a shield for both
function twPactFx(h, a) {
  SFX.at('shield', h.x, h.z, 0.5); SFX.at('cash', h.x, h.z, 0.55);
  for (const o of a === h ? [h] : [h, a]) { FX.text(o.x, o.height + 1, o.z, 'Сделка!', '#ffd86a', 15); if (FX.near(o.x, o.z, 50)) { FX.ring(o.x, o.z, { r0: 0.4, r1: 2.2, color: TWN.gold, life: 0.45, tex: 'rune' }); FX.sparks(o.x, 1.3, o.z, { n: 10, color: 0xffffff, color2: TWN.gold, speed: [2, 6], life: [0.25, 0.5], w: 0.07, up: 2 }); } }
  if (a !== h && FX.near(h.x, h.z, 55)) { FX.beam(h.x, h.z, a.x, a.z, { color: TWN.gold, w: 0.35, life: 0.5, y: 1.3 }); const c1 = twCard(13, 0.8), c2 = twCard(12, 0.8);
    for (const [c, s] of [[c1, 1], [c2, -1]]) FX.add(c, 0.6, (k, me) => { const q = s > 0 ? k : 1 - k; me.position.set(lerp(h.x, a.x, q), 1.6 + Math.sin(Math.PI * k) * 1.2, lerp(h.z, a.z, q)); me.rotation.set(-0.3, k * 12, 0); }); }
}
// the last hand: one big card stands up before every enemy hero in reach, face down — and turns over. A read hero always gets the ace
function twDealCard(h, e, rank, dmg) {
  const T0 = 0.5, near = FX.near(e.x, e.z, 60), A = twHand(h); let x = e.x, z = e.z;
  if (near) {
    const c = twCard(rank, 2.3), back = new THREE.Mesh(FX.geo.flat, FX.mat('glow', rank === 14 ? TWN.gold : TWN.t, 0.0)); back.scale.set(4, 1, 4);
    FX.add(back, T0 + 0.9, (k, me, dt, en) => { const t = en.t; me.position.set(x, 0.1, z + 0.6); me.material.opacity = t < T0 ? 0.3 * t / T0 : 0.6 * Math.max(0, 1 - (t - T0) / 0.9); });
    FX.add(c, T0 + 0.9, (k, me, dt, en) => {
      const t = en.t; if (e.alive && t < T0) { x = e.x; z = e.z; }
      const px = x, pz = z + 1.1, f = Math.min(1, t / 0.28);
      if (t < 0.28) { me.position.set(lerp(A.x, px, easeOut(f)), lerp(A.y, 1.6, f) + Math.sin(Math.PI * f) * 1.5, lerp(A.z, pz, easeOut(f))); me.rotation.set(-0.5, Math.PI + t * 30, 0); }
      else if (t < T0) { me.position.set(px, 1.6 + Math.sin(t * 9) * 0.05, pz); me.rotation.set(-0.5, Math.PI, 0); }
      else { const q = Math.min(1, (t - T0) / 0.16); me.position.set(px, 1.6 + q * 0.25, pz); me.rotation.set(-0.5, Math.PI * (1 - easeOut(q)), 0); me.scale.setScalar(2.3 * (1 + 0.15 * Math.sin(Math.PI * q)) * (t > T0 + 0.6 ? Math.max(0.01, 1 - (t - T0 - 0.6) / 0.3) : 1)); }
    });
  }
  after(T0 + 0.08, () => {
    if (!e.alive) return; const k = 0.5 + (rank - 6) / 8 * 0.8, ace = rank === 14;
    damage(h, e, dmg * k, 1); if (e.alive && ace) stun(h, e, 1.3, 0.6);
    const nm = ({ 11: 'Валет', 12: 'Дама', 13: 'Король', 14: 'ТУЗ!' })[rank] || String(rank);
    FX.text(e.x, e.height + 1.7, e.z, nm, ace ? '#ffd86a' : '#ff8aa0', ace ? 24 : 16); SFX.at(ace ? 'crit' : 'card', e.x, e.z, ace ? 0.9 : 0.55); SFX.at(ace ? 'chime' : 'hit', e.x, e.z, ace ? 0.7 : 0.35);
    if (!FX.near(e.x, e.z, 55)) return; twCardsBurst(e.x, 1.6, e.z + 0.8, ace ? 14 : 7, ace ? 9 : 6, 0.9);
    FX.sparks(e.x, 1.4, e.z, { n: ace ? 22 : 10, color: 0xffffff, color2: ace ? TWN.gold : TWN.t, speed: [4, 11], life: [0.2, 0.5], w: 0.1 }); FX.hit(e.x, 1.2, e.z, ace ? TWN.gold : TWN.t, true);
    if (ace) { FX.ring(e.x, e.z, { r0: 0.5, r1: 3.2, color: TWN.gold, life: 0.45, tex: 'shock' }); FX.pillar(e.x, e.z, { r: 1.1, h: 10, color: TWN.gold, life: 0.45, op: 0.5 }); FX.shock(e.x, e.z, 3.5, 1, 0.4); FX.shake(0.3); }
  });
}

/* ---------- Haku: pieces, calculation, the board ---------- */
// "check": every hit of hers leaves a small violet king over the enemy, up to three — the mate is heavier for each
function twCheck(h, e) {
  if (e.kind !== 'hero' || !e.alive) return; const o = e.buffs.find(b => b.id === 'twchk'), n = Math.min(3, (o ? o.stacks || 1 : 0) + 1);
  const b = addBuff(e, { id: 'twchk', dur: 7, stacks: n, src: h }); if (!b || !FX.near(e.x, e.z, 55)) return;
  const g = new THREE.Group(); for (let i = 0; i < n; i++) { const m = chessMesh('king', TWN.h, 0.85); m.scale.setScalar(0.24); m.position.x = (i - (n - 1) / 2) * 0.3; g.add(m); m.material.depthWrite = false; }
  g.material = new THREE.MeshBasicMaterial();   // FX.drop disposes this harmless stand-in
  b.fx = FX.add(g, 7, (k, me, dt, en) => { if (!e.alive) { en.dead = true; return; } me.position.set(e.x, e.height + 0.95 + (e.yOff || 0), e.z); me.rotation.y = en.t * 1.5; });
}
const twChecks = e => { const b = e.buffs.find(o => o.id === 'twchk'); return b ? b.stacks || 1 : 0; };
// the knight's move: a white knight leaps in an L — two squares straight, one aside — and lands on whoever stands there; it hops over walls
function twKnight(h, x0, z0, x1, z1, d1, d2) {
  const d = Math.max(0.5, dist(x0, z0, x1, z1)), dir = angTo(x0, z0, x1, z1), side = Math.random() < 0.5 ? 1 : -1, th = Math.atan(0.5), a1 = dir + side * th, L1 = d * Math.cos(th);
  const cx = x0 + Math.sin(a1) * L1, cz = z0 + Math.cos(a1) * L1, H1 = 0.32, H2 = 0.3, near = FX.near(x1, z1, 60);
  if (near) { FX.lineDecal(x0, z0, a1, L1, 0.5, TWN.h, H1); FX.lineDecal(cx, cz, angTo(cx, cz, x1, z1), dist(cx, cz, x1, z1), 0.5, TWN.h, H1 + H2); FX.decal(x1, z1, 2.2, TWN.h, H1 + H2); }
  SFX.at('clack', x0, z0, 0.55); SFX.at('whoosh', x0, z0, 0.4);
  if (near) {
    const pc = twPiece('knight', 1.25, 0xf2eefa, 0x3a2470), D = 0.45;
    FX.add(pc, H1 + H2 + D, (k, me, dt, en) => {
      const t = en.t; let px, pz, py, face;
      if (t < H1) { const q = t / H1; px = lerp(x0, cx, q); pz = lerp(z0, cz, q); py = Math.sin(Math.PI * q) * 2.4; face = a1; }
      else if (t < H1 + H2) { const q = (t - H1) / H2; px = lerp(cx, x1, q); pz = lerp(cz, z1, q); py = Math.sin(Math.PI * q) * 2.8; face = angTo(cx, cz, x1, z1); }
      else { px = x1; pz = z1; py = 0; face = angTo(cx, cz, x1, z1); me.userData.fade(Math.max(0, 1 - (t - H1 - H2) / D)); }
      me.position.set(px, py, pz); me.rotation.set(0, face, 0);
      if (dt > 0 && py > 0.2) FX.trail(px, py + 1, pz, TWN.h, 0.5, 1);
    });
  }
  const land = (x, z, R, dmg, big) => {
    for (const e of enemiesIn(h, x, z, R)) { damage(h, e, dmg, 1); if (big && e.alive) { stun(h, e, 0.8, 0.8); twCheck(h, e); } }
    SFX.at('clack', x, z, big ? 0.9 : 0.6); SFX.at(big ? 'impact' : 'hit', x, z, big ? 0.7 : 0.3); if (!FX.near(x, z, 55)) return;
    const bd = twBoardMesh(3, R * 2.2, TWN.h, a1); bd.position.set(x, 0.09, z); FX.add(bd, 0.6, (k, me) => { me.material.opacity = 0.6 * (1 - k); });
    FX.ring(x, z, { r0: 0.3, r1: R + 0.6, color: TWN.h, life: 0.35, tex: 'shock' }); FX.sparks(x, 0.4, z, { n: big ? 16 : 8, color: 0xffffff, color2: TWN.h, speed: [3, 9], life: [0.2, 0.45], w: 0.08, up: 4 });
    FX.burst(x, 0.3, z, { smoke: true, n: big ? 7 : 4, color: 0xd8d0f0, color2: 0x4a4060, speed: [1, 3], life: [0.4, 0.8], size: [0.7, 1.4], ring: true, a: 0.35 }); if (big) { FX.shock(x, z, 3, 0.8, 0.35); FX.shake(0.25); }
  };
  after(H1, () => land(cx, cz, 1.6, d1, false));
  after(H1 + H2, () => land(x1, z1, 2.2, d2, true));
}
// the ricochet: the whole path is worked out first (thin lines and numbered points), then one bolt runs it; every bounce hits harder
function twRicochet(h, t0, dmg) {
  const chain = [t0], used = new Set([t0.id]); let cur = t0;
  for (let i = 0; i < 4; i++) { let best = null, bs = 1e9; for (const u of G.units) { if (!u.alive || u.struct || used.has(u.id) || !hostile(h, u)) continue; const dd = udist(cur, u); if (dd > 6.5) continue; const sc = dd - (u.kind === 'hero' ? 3 : 0); if (sc < bs) { bs = sc; best = u; } } if (!best) break; chain.push(best); used.add(best.id); cur = best; }
  const A = twHand(h), pts = [{ x: A.x, z: A.z }].concat(chain.map(u => ({ x: u.x, z: u.z }))), near = FX.near(h.x, h.z, 60);
  if (near) for (let i = 0; i < pts.length - 1; i++) { FX.beam(pts[i].x, pts[i].z, pts[i + 1].x, pts[i + 1].z, { color: TWN.h, w: 0.12, life: 0.35, y: 1.3, op: 0.6 }); if (i) FX.text(pts[i].x, 2.2, pts[i].z, String(i), '#d8c8ff', 12); }
  h.eyeT = G.time + 0.5; SFX.at('tick', h.x, h.z, 0.4); SFX.at('arcane', h.x, h.z, 0.35);
  chain.forEach((u, i) => after(0.18 + i * 0.07, () => {
    const a = i ? chain[i - 1] : h, ax = i ? a.x : twHand(h).x, az = i ? a.z : twHand(h).z;
    if (FX.near(u.x, u.z, 60)) { FX.beam(ax, az, u.x, u.z, { color: TWN.h, w: 0.55, life: 0.18, y: 1.3 }); FX.beam(ax, az, u.x, u.z, { color: 0xffffff, w: 0.2, life: 0.12, y: 1.3 }); }
    if (!u.alive) return; damage(h, u, dmg * (1 + 0.2 * i), 1); twCheck(h, u);
    SFX.at('arcane', u.x, u.z, 0.4); SFX.at('hit', u.x, u.z, 0.25); if (FX.near(u.x, u.z, 50)) { FX.sparks(u.x, 1.3, u.z, { n: 8, color: 0xffffff, color2: TWN.h, speed: [4, 10], life: [0.12, 0.3], w: 0.07 }); FX.glow(u.x, 1.3, u.z, 1.6 + i * 0.3, TWN.h, 0.15, 'star'); }
  }));
}
// under fire: a 6×6 board; three times her invisible pieces attack — the rook's lines through every enemy, then the bishop's, then the queen's.
// The attacked squares glow red first, so a quick enemy can step off them
function twBoard(h, x, z, dmg) {
  const N = 6, Q = 1.5, half = N * Q / 2, ang = h.facing, sa = Math.sin(ang), ca = Math.cos(ang), DUR = 3.6, near = FX.near(x, z, 60);
  const toL = (px, pz) => { const dx = px - x, dz = pz - z; return { u: dx * ca - dz * sa, v: dx * sa + dz * ca }; };          // world → board (u across, v along)
  const toW = (u, v) => ({ x: x + u * ca + v * sa, z: z - u * sa + v * ca });
  const sq = (px, pz) => { const l = toL(px, pz), i = Math.floor((l.u + half) / Q), j = Math.floor((l.v + half) / Q); return i >= 0 && j >= 0 && i < N && j < N ? { i, j } : null; };
  let bd = null; if (near) { bd = twBoardMesh(N, N * Q * 1.04, TWN.h, ang); bd.position.set(x, 0.09, z); FX.add(bd, DUR, (k, me, dt, en) => { const t = en.t; me.material.opacity = 0.42 * Math.min(1, t / 0.25, (DUR - t) / 0.35) * (0.85 + 0.15 * Math.sin(t * 5)); }); FX.wall(x, z, half * 1.38, TWN.h, DUR, { h: 1.2, op: 0.18, spin: 0 }); }
  SFX.at('clack', x, z, 0.65); SFX.at('arcane', x, z, 0.4);
  const pat =['rook', 'bishop', 'queen'];
  pat.forEach((kind, w) => after(0.5 + w * 1.05, () => {
    const foes = enemiesIn(h, x, z, half * 1.45).filter(e => sq(e.x, e.z)), set = new Set();
    const mark = (i, j) => { if (i >= 0 && j >= 0 && i < N && j < N) set.add(i + j * N); };
    const src = foes.length ? foes.map(e => sq(e.x, e.z)) : [{ i: 2 + (w % 2), j: 2 + ((w + 1) % 2) }];
    for (const s of src) for (let k = 0; k < N; k++) {
      if (kind !== 'bishop') { mark(k, s.j); mark(s.i, k); }
      if (kind !== 'rook') { const d = k - s.i; mark(k, s.j + d); mark(k, s.j - d); }
    }
    h.eyeT = G.time + 0.6;
    if (near) for (const id of set) { const i = id % N, j = Math.floor(id / N), c = toW((i + 0.5) * Q - half, (j + 0.5) * Q - half), m = new THREE.Mesh(FX.geo.flat, twSqMat(0xff3a6a)); m.position.set(c.x, 0.11, c.z); m.rotation.y = ang; m.scale.set(Q * 0.9, 1, Q * 0.9); FX.add(m, 0.55, (k, me) => { me.material.opacity = (0.16 + 0.24 * k) * (0.75 + 0.25 * Math.sin(k * 40)); }); }
    SFX.at('tick', x, z, 0.35);
    after(0.55, () => {
      for (const e of enemiesIn(h, x, z, half * 1.45)) { const s = sq(e.x, e.z); if (!s || !set.has(s.i + s.j * N)) continue; damage(h, e, dmg, 1); if (e.alive) { slow(h, e, 0.3, 1, 'twboard'); twCheck(h, e); } FX.hit(e.x, 1.2, e.z, TWN.h, true); }
      SFX.at('clack', x, z, 0.7); SFX.at('impact', x, z, 0.5); if (!near) return; let n = 0;
      for (const id of set) { const i = id % N, j = Math.floor(id / N), c = toW((i + 0.5) * Q - half, (j + 0.5) * Q - half); n++;
        if (n % 3 === 0 || set.size < 8) FX.pillar(c.x, c.z, { r: 0.45, h: 2.6, color: 0x7a5ad8, life: 0.28, op: 0.32 });
        const m = new THREE.Mesh(FX.geo.flat, twSqMat(0xb89cff)); m.position.set(c.x, 0.12, c.z); m.rotation.y = ang; m.scale.set(Q * 0.92, 1, Q * 0.92); FX.add(m, 0.3, (k, me) => { me.material.opacity = 0.32 * (1 - k); });
        if (n % 3 === 0) FX.sparks(c.x, 0.3, c.z, { n: 3, color: 0xffffff, color2: TWN.h, speed: [2, 5], life: [0.15, 0.3], w: 0.06, up: 4 }); }
      FX.text(x, 2.6, z, ({ rook: 'Ладья', bishop: 'Слон', queen: 'Ферзь' })[kind], '#d8c8ff', 14);
    });
  }));
}
// checkmate: the board under the enemy, six white pieces rise around him and strike one after another, a black king over his head cracks — and falls
function twMate(h, t, small, big) {
  const near = FX.near(t.x, t.z, 60), x = t.x, z = t.z, kinds = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'], R = 3.3, a0 = rand(TAU);
  root(h, t, 1.5, TWN.h); SFX.at('ultcue', x, z, 0.7); SFX.at('clack', x, z, 0.6);
  const pos = kinds.map((k, i) => { const a = a0 + i / 6 * TAU; return { x: x + Math.sin(a) * R, z: z + Math.cos(a) * R, a }; });
  if (near) {
    const bd = twBoardMesh(8, 8.4, TWN.h, a0); bd.position.set(x, 0.09, z); FX.add(bd, 2.1, (k, me, dt, en) => { const q = en.t; me.material.opacity = 0.5 * Math.min(1, q / 0.2, (2.1 - q) / 0.4); });
    FX.wall(x, z, 4.4, TWN.h, 2.0, { h: 2.2, op: 0.22, spin: 0.3 });
    kinds.forEach((kd, i) => { const P = pos[i], pc = twPiece(kd, 1.45, 0xf4f0fc, 0x3a2470);
      FX.add(pc, 2.0, (k, me, dt, en) => { const q = en.t, up = Math.min(1, q / 0.3), dn = q > 1.65 ? (q - 1.65) / 0.35 : 0, fire = q > 0.45 + i * 0.15 && q < 0.6 + i * 0.15;
        me.position.set(P.x, -2 * (1 - easeOut(up)) - 2 * dn * dn, P.z); me.rotation.y = angTo(P.x, P.z, t.x, t.z) + (1 - up) * 3; me.scale.setScalar(fire ? 1.12 : 1); me.userData.fade(1 - dn); }); });
    const king = twPiece('king', 1.1, 0x18141e, 0x5a0a18, 0xd8c8ff), kx = { fall: 0 };
    FX.add(king, 1.75, (k, me, dt, en) => { const q = en.t, sh = Math.min(1, q / 1.4); me.position.set(t.x + (Math.random() - 0.5) * 0.12 * sh, (t.height || 2.2) + 1.0 + Math.min(1, q / 0.25) * 0.4, t.z);
      if (q > 1.42) { kx.fall = Math.min(1, (q - 1.42) / 0.18); me.rotation.set(0, 0, kx.fall * 1.5); } else me.rotation.set(0, q * 0.8, 0); me.userData.fade(q > 1.6 ? 1 - (q - 1.6) / 0.15 : Math.min(1, q / 0.2)); });
  }
  kinds.forEach((kd, i) => after(0.45 + i * 0.15, () => {
    if (!t.alive) return; const P = pos[i]; damage(h, t, small, 1);
    if (FX.near(t.x, t.z, 55)) { FX.beam(P.x, P.z, t.x, t.z, { color: TWN.h, w: 0.7, life: 0.2, y: 1.3 }); FX.beam(P.x, P.z, t.x, t.z, { color: 0xffffff, w: 0.25, life: 0.14, y: 1.3 }); FX.sparks(t.x, 1.4, t.z, { n: 6, color: 0xffffff, color2: TWN.h, speed: [3, 8], life: [0.12, 0.3], w: 0.07 }); }
    SFX.at('clack', t.x, t.z, 0.5);
  }));
  after(1.5, () => {
    if (!t.alive) { h.cd[3] *= 0.7; return; } const ch = twChecks(t), miss = 1 - t.hp / t.maxHp, k = (1 + 0.15 * ch) * (1 + 0.6 * miss);
    t.buffs = t.buffs.filter(b => { if (b.id === 'twchk') { if (b.fx) b.fx.dead = true; return false; } return true; });
    damage(h, t, big * k, 1); FX.text(t.x, t.height + 1.8, t.z, 'МАТ', '#d8c8ff', 28); SFX.at('heavy', t.x, t.z, 1); SFX.at('bell', t.x, t.z, 0.75); SFX.at('shatter', t.x, t.z, 0.6);
    if (!FX.near(t.x, t.z, 60)) return; FX.shake(0.5); FX.hitstop(0.07); FX.punch(0.6); FX.shock(t.x, t.z, 5, 1.1, 0.45);
    FX.debris(t.x, t.height + 1, t.z, { n: 12, color: 0x2a2236, speed: [3, 8], up: 6, size: [0.12, 0.3], glow: true });
    FX.ring(t.x, t.z, { r0: 0.5, r1: 4.6, color: TWN.h, life: 0.5, tex: 'shock' }); FX.pillar(t.x, t.z, { r: 1.1, h: 14, color: 0x7a5ad8, life: 0.45, op: 0.38 }); FX.glow(t.x, 1.6, t.z, 4.5, TWN.h, 0.25, 'star'); FX.light(t.x, 3, t.z, TWN.h, 3, 22, 0.5);
    FX.sparks(t.x, 2, t.z, { n: 26, color: 0xffffff, color2: TWN.h, speed: [5, 14], life: [0.2, 0.55], w: 0.1 });
  });
}

/* ==================================================================== 62. REISEI ==================================================================== */
// restraint (innate): two seconds without hurting a hero and he starts holding back — a stack every 1.5 s, up to five; the next ability that hits a hero spends them all
function rsMul(h, e) {
  if (!e || e.kind !== 'hero') return 1;
  if (h.rsSpendT !== undefined && G.time - h.rsSpendT < 0.06) return h.rsSpend;   // one ability hitting several heroes at once spends them once
  const n = h.rs || 0; if (!n) return 1; h.rs = 0; h.rsSpend = 1 + 0.14 * n; h.rsSpendT = G.time;
  if (FX.near(h.x, h.z, 50)) { FX.glow(h.x, 2.2, h.z, 1.5 + n * 0.5, RSE.c, 0.25, 'star'); if (n >= 5) { FX.text(h.x, h.height + 1, h.z, 'всерьёз', '#cfeeff', 15); FX.ring(h.x, h.z, { r0: 0.4, r1: 2.6, color: RSE.c, life: 0.35, tex: 'ringThin' }); } }
  h.eyeT = G.time + 0.6; return h.rsSpend;
}
function rsPawnMesh(kind) { return twPiece(kind, kind === 'queen' ? 1.25 : 1.05, 0xf4f6fa, 0x2a4a6a, 0x0a1018); }
// a pawn sacrificed: the minion (either side's, or a forest beast) turns into a white pawn that marches on the nearest enemy hero and bursts;
// a pawn that walks six or more promotes to a queen on the way — the burst is half again as strong and stuns
function rsPick(h, x, z, r) { let best = null, bd = r; for (const u of G.units) { if (!u.alive || (u.kind !== 'minion' && u.kind !== 'monster') || u.boss) continue; const d = dist(u.x, u.z, x, z); if (d < bd) { bd = d; best = u; } } return best; }
function rsPawn(h, m, dmg) {
  const x0 = m.x, z0 = m.z, extra = m.maxHp * 0.05; kill(m, m.team === h.team ? null : h);
  SFX.at('clack', x0, z0, 0.6); SFX.at('pop', x0, z0, 0.35);
  if (FX.near(x0, z0, 55)) { FX.pillar(x0, z0, { r: 0.8, h: 6, color: RSE.c, life: 0.35, op: 0.5 }); FX.sparks(x0, 0.8, z0, { n: 10, color: 0xffffff, color2: RSE.ice, speed: [2, 7], life: [0.2, 0.45], w: 0.07, up: 3 }); }
  const P = { x: x0, z: z0, walked: 0, queen: false, t: 0, done: false }; h.pawnDbg = P; let mesh = null;   // pawnDbg: the last pawn, for tests
  if (FX.near(x0, z0, 60)) { mesh = rsPawnMesh('pawn'); FX.add(mesh, 6, (k, me, dt, en) => { if (P.done) { en.dead = true; return; } const up = Math.min(1, P.t / 0.2); me.position.set(P.x, -1.2 * (1 - up) + Math.abs(Math.sin(P.walked * Math.PI)) * 0.4, P.z); me.rotation.y = P.face || 0; }); }
  const rib = FX.ribbon(RSE.c, 0.9, 10);
  const boom = () => {
    if (P.done) return; P.done = true; rib.end(); const R = P.queen ? 3 : 2.5;
    for (const e of enemiesIn(h, P.x, P.z, R)) { damage(h, e, (dmg + extra) * (P.queen ? 1.5 : 1) * rsMul(h, e), 0); if (e.alive) { slow(h, e, 0.4, 1.5, 'rspawn'); if (P.queen) stun(h, e, 0.8); } }
    SFX.at('boom', P.x, P.z, 0.6); SFX.at('clack', P.x, P.z, 0.5); SFX.at('shatter', P.x, P.z, 0.3); if (!FX.near(P.x, P.z, 55)) return;
    FX.ring(P.x, P.z, { r0: 0.4, r1: R + 0.8, color: RSE.c, life: 0.4, tex: 'shock' }); FX.shock(P.x, P.z, R + 1, 0.9, 0.4);
    FX.debris(P.x, 1, P.z, { n: 10, color: 0xe8f0fa, speed: [3, 8], up: 7, size: [0.1, 0.28], glow: true }); FX.sparks(P.x, 1, P.z, { n: 16, color: 0xffffff, color2: RSE.ice, speed: [4, 11], life: [0.2, 0.5], w: 0.09 });
    const bd = twBoardMesh(3, R * 2.2, RSE.c, P.face || 0); bd.position.set(P.x, 0.09, P.z); FX.add(bd, 0.6, (k, me) => { me.material.opacity = 0.55 * (1 - k); });
    if (P.queen) { FX.pillar(P.x, P.z, { r: 1.2, h: 10, color: RSE.c, life: 0.4, op: 0.45 }); FX.shake(0.3); }
  };
  G.actors.push({ update(dt) {
    if (P.done) return false; P.t += dt; if (P.t < 0.25) return true;
    // it marches only on enemy heroes (creeps do not stop it — it walks through them); the chosen one is kept until he dies or vanishes
    if (!P.tg || !P.tg.alive || P.tg.invuln || dist(P.x, P.z, P.tg.x, P.tg.z) > 34) { P.tg = null; let bd = 30; for (const e of G.heroes) if (e.alive && hostile(h, e) && !e.invuln) { const d = dist(P.x, P.z, e.x, e.z); if (d < bd) { bd = d; P.tg = e; } } }
    const tg = P.tg;
    if (P.walked > 40 || P.t > 7) { boom(); return false; }
    if (!tg) {   // no hero in sight: straight on at a walk, away from Reisei through the spot where the victim stood, up to twenty steps, looking out all the time — then it bursts
      if (P.free === undefined) P.free = dist(h.x, h.z, x0, z0) > 0.5 ? angTo(h.x, h.z, x0, z0) : h.facing;
      if (P.walked >= 20) { boom(); return false; }
      const s2 = 8 * dt, nx = clamp(P.x + Math.sin(P.free) * s2, -95, 95), nz = clamp(P.z + Math.cos(P.free) * s2, -95, 95);   // a piece on the board: walls and rocks do not stop it
      P.face = P.free; P.x = nx; P.z = nz; P.walked += s2; rib.add(P.x, 0.6, P.z);
    } else {
      const d = dist(P.x, P.z, tg.x, tg.z); if (d < 1.2 + (tg.radius || 0.6) * 0.5) { boom(); return false; }
      const st = Math.min(d, 18 * dt); P.face = angTo(P.x, P.z, tg.x, tg.z); P.x += Math.sin(P.face) * st; P.z += Math.cos(P.face) * st; P.walked += st; rib.add(P.x, 0.6, P.z);
    }
    if (!P.queen && P.walked >= 6) { P.queen = true; if (mesh) { const q = rsPawnMesh('queen'); mesh.remove(...mesh.children); mesh.add(...q.children); mesh.userData = q.userData; } FX.text(P.x, 2.6, P.z, 'превращение', '#cfeeff', 14); SFX.at('chime', P.x, P.z, 0.5); if (FX.near(P.x, P.z, 50)) { FX.pillar(P.x, P.z, { r: 0.9, h: 7, color: RSE.c, life: 0.35, op: 0.5 }); FX.glow(P.x, 1.5, P.z, 3, RSE.c, 0.25, 'star'); } }
    return true;
  } });
}
// an enemy hero made a pawn: a burst of white light and board squares, the figure is gone and a big white pawn hops in its place —
// no attacks (blind), no abilities (silence), slowed; when it ends the pawn cracks and he is back
function rsPawnHero(h, t, dmg, dur) {
  damage(h, t, dmg * rsMul(h, t), 0); if (!t.alive) return;
  const b = addBuff(t, { id: 'rspawned', dur, silence: true, blind: true, slow: 0.35, src: h }); if (!b) return;
  const rig = t.rig; rig.root.visible = false; t.pawnT = G.time + dur;
  b.onEnd = u => { if (u.rig === rig) rig.root.visible = true; u.pawnT = 0; rsPawnPop(u, false); };
  SFX.at('clack', t.x, t.z, 0.7); SFX.at('blink', t.x, t.z, 0.5); FX.text(t.x, (t.height || 2) + 1.2, t.z, 'пешка', '#eaf6ff', 16);
  rsPawnPop(t, true);
  if (!FX.near(t.x, t.z, 60)) return;
  const pc = rsPawnMesh('pawn'); pc.scale.setScalar(1.15); const bd = twBoardMesh(3, 3.2, RSE.c, 0);
  FX.add(bd, dur, (k, me, dt, en) => { me.position.set(t.x, 0.09, t.z); me.material.opacity = 0.4 * Math.min(1, en.t / 0.2, (dur - en.t) / 0.25); });
  b.fx = FX.add(pc, dur, (k, me, dt, en) => {
    if (!t.alive) { en.dead = true; if (t.rig === rig) rig.root.visible = true; return; }
    const hop = Math.abs(Math.sin(en.t * (t.moving ? 9 : 3))) * (t.moving ? 0.35 : 0.08), q = Math.min(1, en.t / 0.15);
    me.position.set(t.x, hop + (t.yOff || 0), t.z); me.rotation.y = t.facing; me.scale.set(1.15 * (0.6 + 0.4 * q), 1.15 * (1.5 - 0.5 * q), 1.15 * (0.6 + 0.4 * q));
    if (t.moving && Math.random() < dt * 4) FX.sparks(t.x, 0.15, t.z, { n: 1, color: 0xffffff, color2: RSE.ice, speed: [0.5, 1.5], life: [0.2, 0.4], w: 0.05, up: 2 });
  });
}
// the change into a pawn and back: white light, flying chips of ivory, a ring
function rsPawnPop(t, into) {
  if (!FX.near(t.x, t.z, 55)) return; const H = t.height || 2;
  FX.burst(t.x, H * 0.55, t.z, { n: into ? 16 : 10, color: 0xffffff, color2: RSE.ice, speed: [2, 6], life: [0.25, 0.5], size: [0.35, 0.05], rad: 0.5 });
  FX.debris(t.x, H * 0.6, t.z, { n: into ? 8 : 10, color: 0xe8eef6, speed: [2, 6], up: 5, size: [0.08, 0.2], glow: true });
  FX.ring(t.x, t.z, { r0: into ? 2 : 0.4, r1: into ? 0.4 : 2.2, color: RSE.c, life: 0.3, tex: 'ringThin' }); FX.glow(t.x, H * 0.5, t.z, 2.6, RSE.c, 0.2, 'star');
  if (into) FX.pillar(t.x, t.z, { r: 0.8, h: 6, color: RSE.ice, life: 0.3, op: 0.35 }); else SFX.at('shatter', t.x, t.z, 0.4);
}
// shove: knocked back along a line; a wall in the way stops him short — and that hurts
function rsShove(h, e, dir, len, wallDmg) {
  if (e.boss || e.struct || !e.alive) return; let free = 0; for (let s = 0.25; s <= len + 0.001; s += 0.25) { if (!NAV.ok(e.x + Math.sin(dir) * s, e.z + Math.cos(dir) * s)) break; free = s; }
  const T = 0.22; if (free > 0.05) { e.forced = { vx: Math.sin(dir) * free / T, vz: Math.cos(dir) * free / T, t: T }; e.dash = null; }
  if (free < len - 0.01) after(T, () => {
    if (!e.alive) return; damage(h, e, wallDmg * rsMul(h, e), 0); stun(h, e, 0.9); FX.text(e.x, e.height + 1, e.z, 'в стену', '#cfeeff', 14); SFX.at('impact', e.x, e.z, 0.8); SFX.at('stone', e.x, e.z, 0.7);
    if (FX.near(e.x, e.z, 55)) { const wx = e.x + Math.sin(dir) * 0.8, wz = e.z + Math.cos(dir) * 0.8; FX.debris(wx, 1, wz, { n: 9, color: 0x5a5650, speed: [2, 6], up: 6, size: [0.15, 0.4] }); FX.ring(wx, wz, { r0: 0.3, r1: 2, color: RSE.c, life: 0.3, tex: 'crack' }); FX.shake(0.3); FX.hitstop(0.05); }
  });
}
// the white room: a cube of white panels and grid lines closes round him for a second; the world beyond goes quiet
let _rsRoomG = null;
function rsRoomGeo(S) {
  if (_rsRoomG) return _rsRoomG; const P = [], hh = S / 2, n = 4, st = S / n;
  for (let i = 0; i <= n; i++) { const c = -hh + i * st, y = i * st;
    for (const s of [-1, 1]) P.push(s * hh, 0, c, s * hh, S, c, s * hh, y, -hh, s * hh, y, hh, c, 0, s * hh, c, S, s * hh, -hh, y, s * hh, hh, y, s * hh);
    P.push(c, S, -hh, c, S, hh, -hh, S, c, hh, S, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  return (_rsRoomG = [g, new THREE.BoxGeometry(S, S, S).translate(0, S / 2, 0)]);
}
function rsRoomFx(h, dur) {
  if (!FX.near(h.x, h.z, 55)) return; const g = new THREE.Group(), RG = rsRoomGeo(2.6);
  const box = new THREE.Mesh(RG[1], new THREE.MeshBasicMaterial({ color: 0xeaf6ff, transparent: true, opacity: 0, depthWrite: false, side: THREE.BackSide, blending: THREE.AdditiveBlending }));
  const ed = new THREE.LineSegments(RG[0], new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false })); ed.userData.own = true;
  g.add(box, ed); g.material = box.material;
  FX.add(g, dur, (k, me, dt, en) => { const t = en.t, o = Math.min(1, t / 0.12, (dur - t) / 0.2); if (!h.alive) { en.dead = true; return; } me.position.set(h.x, 0.02, h.z); box.material.opacity = 0.16 * o * (0.85 + 0.15 * Math.sin(t * 30)); ed.material.opacity = 0.75 * o; me.rotation.y = h.facing; });
  FX.ring(h.x, h.z, { r0: 2, r1: 0.4, color: 0xffffff, life: 0.25, tex: 'ringThin' });
}
// the counter: he is behind the one who struck him before the blow has landed
function rsCounter(h, src, dmg) {
  const ox = h.x, oz = h.z, a = angTo(h.x, h.z, src.x, src.z), bx = src.x + Math.sin(a) * 1.5, bz = src.z + Math.cos(a) * 1.5;
  if (FX.near(ox, oz, 55)) twGhost(h.rig, 0xeaf6ff, 0.45, 0.55, ox, oz);
  blink(h, bx, bz); h.facing = angTo(h.x, h.z, src.x, src.z); h.anim.castT = h.anim.castDur = 0.4; h.anim.castType = 'palm'; h.eyeT = G.time + 0.8;
  damage(h, src, dmg * rsMul(h, src), 0); if (src.alive) stun(h, src, 0.8);
  SFX.at('blink', h.x, h.z, 0.55); SFX.at('punch', src.x, src.z, 0.85); FX.text(src.x, src.height + 1, src.z, 'предсказуемо', '#cfeeff', 14);
  if (FX.near(h.x, h.z, 55)) { FX.beam(ox, oz, h.x, h.z, { color: 0xffffff, w: 0.35, life: 0.25, y: 1.2 }); FX.hit(src.x, 1.3, src.z, RSE.c, true); FX.glow(src.x, 1.4, src.z, 3, RSE.c, 0.2, 'star'); FX.ring(src.x, src.z, { r0: 0.3, r1: 2.4, color: RSE.c, life: 0.3, tex: 'shock' }); FX.hitstop(0.06); }
}
// everything according to plan: a board under the target, a black king over his head that cracks with every hit his team takes,
// lines from him to each of Reisei's allies like moves on a board; then Reisei is behind him and the plan is finished
function rsPlan(h, t) {
  const P = { t, rec: 0, last: t.hp, t0: G.time, end: G.time + 4, done: false, cr: 0 }; h.plan = P;
  SFX.at('ultcue', t.x, t.z, 0.6); SFX.at('tick', t.x, t.z, 0.5); if (h.isPlayer || t.isPlayer) UI.announce(t.isPlayer ? 'Вас взяли в план' : 'План в действии', '#cfeeff');
  if (G.player && (h.team === G.player.team)) mmMark({ x: t.x, z: t.z, r: 4, color: '#cfeeff', until: G.time + 4 });
  for (const o of G.heroes) if (o.alive && o.team === h.team && udist(o, t) < 14) addBuff(o, { id: 'rsplan', dur: 4, ms: 0.12, src: h });
  let king = null;
  if (FX.near(t.x, t.z, 70)) {
    const bd = twBoardMesh(8, 9, RSE.c, 0); FX.add(bd, 4.6, (k, me, dt, en) => { if (P.done && en.t < 4.2) en.t = 4.2; me.position.set(t.x, 0.09, t.z); me.rotation.y += dt * 0.3; me.material.opacity = 0.38 * Math.min(1, en.t / 0.3, (4.6 - en.t) / 0.4); });
    king = twPiece('king', 1.0, 0x16141c, 0x0a1a2a, 0xcfeeff);
    FX.add(king, 4.8, (k, me, dt, en) => { if (P.done && !P.fall) { en.dead = true; return; } const c = Math.min(1, P.cr); me.position.set(t.x + (Math.random() - 0.5) * 0.14 * c, (t.height || 2.2) + 1.1 + Math.sin(en.t * 2) * 0.08 + (t.yOff || 0), t.z); me.rotation.set(0, en.t * 0.6, 0); me.userData.fade(Math.min(1, en.t / 0.3)); me.userData.pc.material.emissive.setRGB(0.1 + c * 0.5, 0.2 + c * 0.6, 0.3 + c * 0.7); });
  }
  let acc = 0, sec = 3;
  G.actors.push({ update(dt) {
    if (P.done) return false; const dh = P.last - t.hp; if (dh > 0) P.rec += dh; P.last = t.hp; P.cr = P.rec / (t.maxHp * 0.45);
    if (!t.alive) { P.done = true; h.cd[3] *= 0.6; if (FX.near(t.x, t.z, 55)) FX.debris(t.x, (t.height || 2) + 1, t.z, { n: 10, color: 0x16141c, speed: [2, 6], up: 5, size: [0.1, 0.25], glow: true }); return false; }
    acc += dt; if (acc >= 0.5) { acc = 0; if (FX.near(t.x, t.z, 55)) for (const o of G.heroes) if (o.alive && o.team === h.team && udist(o, t) < 14) FX.beam(o.x, o.z, t.x, t.z, { color: RSE.c, w: 0.12, life: 0.5, y: 0.25, op: 0.55 });
      if (Math.random() < P.cr && FX.near(t.x, t.z, 50)) FX.sparks(t.x, (t.height || 2) + 1.2, t.z, { n: 3, color: 0xffffff, color2: RSE.ice, speed: [1, 3], life: [0.2, 0.4], w: 0.05 }); }
    const left = P.end - G.time; if (left < sec && sec > 0) { FX.text(t.x, (t.height || 2) + 2.2, t.z, String(sec), '#cfeeff', 18); sec--; }
    if (left <= 0 || t.hp / t.maxHp < 0.25) { P.done = true; rsFinish(h, t, P); return false; }
    return true;
  } });
}
function rsFinish(h, t, P) {
  const reach = h.alive && !h.stunned && udist(h, t) < 28, base = D(h, 120, 38, 1.0, 0) + P.rec * 0.3, x = t.x, z = t.z;
  if (reach) {
    const ox = h.x, oz = h.z, a = angTo(h.x, h.z, t.x, t.z); if (FX.near(ox, oz, 55)) twGhost(h.rig, 0xeaf6ff, 0.5, 0.5, ox, oz);
    blink(h, t.x - Math.sin(a) * 1.3, t.z - Math.cos(a) * 1.3); h.facing = angTo(h.x, h.z, t.x, t.z); addBuff(h, { id: 'rsfin', dur: 0.45, invuln: true });
    h.anim.castT = h.anim.castDur = 0.7; h.anim.castType = 'axe'; h.anim.atkT = 0; h.eyeT = G.time + 1; h.castLock = Math.max(h.castLock, 0.45); SFX.at('blink', h.x, h.z, 0.6);
    if (FX.near(h.x, h.z, 55)) { FX.beam(ox, oz, h.x, h.z, { color: 0xffffff, w: 0.4, life: 0.3, y: 1.2 }); G.dim = Math.max(G.dim || 0, 0.5); }
  }
  after(reach ? 0.32 : 0.05, () => {
    P.fall = true; if (!t.alive) return; const k = reach ? rsMul(h, t) : 0.5;
    damage(h, t, base * k, 0); if (t.alive && t.hp / t.maxHp < 0.15) damage(h, t, t.hp + 5, 2, { raw: true }); if (t.alive) stun(h, t, 0.8);
    FX.text(t.x, (t.height || 2) + 1.8, t.z, 'Всё по плану.', '#eaf6ff', 22); SFX.at('kick', t.x, t.z, 1); SFX.at('heavy', t.x, t.z, 0.8); SFX.at('shatter', t.x, t.z, 0.65);
    if (!FX.near(t.x, t.z, 60)) return; FX.shake(0.55); FX.hitstop(0.08); FX.punch(0.7); FX.shock(t.x, t.z, 5, 1.1, 0.5);
    FX.debris(t.x, (t.height || 2) + 1.1, t.z, { n: 14, color: 0x16141c, speed: [3, 9], up: 6, size: [0.12, 0.3], glow: true });
    FX.slash(t.x, t.z, h.facing + HPI, { r: 3.4, color: RSE.c, life: 0.3, sweep: 0.5 }); FX.ring(t.x, t.z, { r0: 0.5, r1: 5, color: RSE.c, life: 0.5, tex: 'shock' });
    FX.pillar(t.x, t.z, { r: 1.0, h: 14, color: RSE.ice, life: 0.4, op: 0.3 }); FX.glow(t.x, 1.6, t.z, 4.5, RSE.c, 0.25, 'star'); FX.light(t.x, 3, t.z, RSE.c, 3, 22, 0.5);
    FX.sparks(t.x, 1.8, t.z, { n: 24, color: 0xffffff, color2: RSE.ice, speed: [5, 14], life: [0.2, 0.5], w: 0.1 });
  });
}

HEROES.push(
  /* ================= 61. Ten & Haku ================= */
  {
    id: 'blank', name: 'Тэн и Хаку', title: 'Двое как один', role: 'mage', roleName: 'Пара игроков', build: 'mage', bars: [4, 2, 4, 3], diffc: 3, atkSfx: 'cast', projMesh: 'blade',
    lore: 'Тэн и Хаку — брат и сестра, и по отдельности их не бывает. Тэн читает людей: блефует, торгуется, заключает сделки и знает, когда соперник врёт. Хаку молчит и считает: шахматы, траектории, вероятности — на десять ходов вперёд. Вместе они не проиграли ни одной игры. Говорят, их имена даже не пишут в списках — только два пустых квадратика.',
    look: { bulk: 0.9, h: 1.0, scale: 1.0, c1: 0x22222c, c2: 0x34486a, c3: 0x1a1a22, sole: 0xeeeeea, skin: 0xead6c6, hands: 0xead6c6, metal: 0xc8c8d0, glow: TWN.t, head: 'ten', hair: 0x15131a, shirt: 0xf2f0ec, lin: 0xc8283a, chest: 'gamer', legs: 'jeans', weapon: 'phone', wc: 'toss' },
    pal: { bulk: 0.72, h: 0.86, scale: 0.86, c1: 0xd6d6e2, c2: 0x26305a, c3: 0x1c1c28, cuff: 0xd6d6e2, skin: 0xe6d2c8, hands: 0xe6d2c8, metal: 0xd8d8e8, glow: TWN.h, head: 'haku', hair: 0xcdd0de, tie: 0xd0283a, chest: 'blank', legs: 'thigh', sh: 'none', weapon: 'kingpc', wc: 'wand' },
    palSolid: true, palY: 0, palBack: 0.1, palSide: 1.0, altNames: ['Тэн — карты и сделки', 'Хаку — шахматы и расчёт'],
    repNames: ['Козырь / Ход конём', 'Ложный ход / Рикошет', 'Сделка / Под боем', 'Раздача / Шах и мат'],
    stats: ST(590, 86, 470, 48, 48, 2.6, 22, 2.6, 0.68, 9.0, 6.5),
    stats2: ST(590, 86, 470, 48, 50, 2.8, 20, 2.4, 0.72, 9.0, 7.5),
    init(h) { twInit(h); },
    swap(h, manual) { return twSwap(h, manual); },
    anim2(h, dt) { twAnim2(h, dt); },
    shootAtk(u, t) { twCardAtk(u, t); },
    innate: { name: 'Двое как один', icon: 'twinn', desc: 'Тэн и Хаку всегда рядом: управляете одним, второй идёт следом. Клавиша D (или щелчок по этой иконке) меняет их местами — и у героя другие четыре умения: у Тэна карты и сделки, у Хаку шахматы и расчёт. Смена перезаряжается 2.5 сек; после неё 2.5 сек «передачи хода» — урон +20%. Перезарядки у каждого свои, уровни умений общие. После ульты одного ульта другого перезаряжается не меньше 20 сек.', count: h => h.tw && h.tw.swapAt > G.time ? Math.ceil(h.tw.swapAt - G.time) : '' },
    onDeath(h) { if (h.plan) h.plan = null; },
    whileDead(h, dt) { const T = h.tw; if (T) for (let i = 0; i < 4; i++) if (T.other[i] > 0) T.other[i] -= dt; },
    tick(h, dt) {
      const T = h.tw; if (!T) return;
      for (let i = 0; i < 4; i++) if (T.other[i] > 0) T.other[i] -= dt;
      twFollow(h, dt);
      if (h.isPlayer) { const el = $('abI'); if (el && el.children[2]) el.children[2].style.height = (T.swapAt > G.time ? (T.swapAt - G.time) / TWN_SWAP_CD * 100 : 0) + '%'; }
      // a bot swaps when the other one has more ready (or needs her/his escape)
      if (h.ai && G.time > T.swapAt && G.time > T.aiAt) {
        T.aiAt = G.time + 0.4; let nf = null, nd = 12; for (const e of G.heroes) if (e.alive && hostile(h, e)) { const d = udist(h, e); if (d < nd) { nd = d; nf = e; } }
        const B = Object.getPrototypeOf(h.def), mine = T.f ? B.alt : B.abilities, theirs = T.f ? B.abilities : B.alt;
        const ready = (cd, kit) => { let n = 0; for (let i = 0; i < 4; i++) if (h.al[i] && cd[i] <= 0 && h.mana >= kit[i].cost) n += i === 3 ? 2 : 1; return n; };
        const rm = ready(h.cd, mine), rt = ready(T.other, theirs);
        if (nf && h.hp / h.maxHp < 0.35 && T.f === 1 && h.al[1] && T.other[1] <= 0) twSwap(h);
        else if (nf && rt > rm) twSwap(h);
        else if (!nf && T.f === 0 && Math.random() < 0.05) twSwap(h);   // in lane she out-ranges him
      }
    },
    abilities: [
      {
        key: 'Q', name: 'Козырь', icon: 'twcard', cd: 6, cost: 55, range: 9, ind: { type: 'line', w: 1.6, fixed: true }, anim: 'deal', animDur: 0.5, lock: 0.25, ai: { t: 'shot', sp: 30, farm: true },
        desc: 'Тэн веером бросает три карты (на 9). Каждая — магический урон первому врагу на пути. Герой, в которого попали две карты или больше, «прочитан» на 5 сек: он получает на 10% больше урона, а над ним висит его туз. В «Последней раздаче» прочитанному всегда выпадает туз.',
        cast(h, p) { const dmg = D(h, 55, 14, 0, 0.45), id = ++TWN_N; after(0.14, () => { if (!h.alive) return; const A = twHand(h); for (let k = -1; k <= 1; k++) twThrow(h, A, p.dir + k * 0.11, 9, dmg, id); SFX.at('card', h.x, h.z, 0.7); SFX.at('whoosh', h.x, h.z, 0.3); }); }
      },
      {
        key: 'W', name: 'Ложный ход', icon: 'twfeint', cd: 13, cost: 70, range: 6.5, ind: { type: 'line', w: 1.4, fixed: true }, anim: 'feint', animDur: 0.35, lock: 0, ai: { t: 'escape', kite: true },
        desc: 'Тэн и Хаку отскакивают на 6.5, а на прежнем месте остаётся приманка — их двойники из света и карт. Через 2.5 сек, или как только к приманке подойдёт вражеский герой, она рассыпается вихрем карт: магический урон и замедление на 35% на 1.5 сек всем врагам в радиусе 3.',
        cast(h, p) { const x0 = h.x, z0 = h.z; twDecoy(h, x0, z0, D(h, 70, 18, 0, 0.5)); dashTo(h, h.x + Math.sin(p.dir) * 6.5, h.z + Math.cos(p.dir) * 6.5, 28, { ribbon: TWN.t }); SFX.at('dash', h.x, h.z, 0.5); SFX.at('card', h.x, h.z, 0.4); }
      },
      {
        key: 'E', name: 'Сделка', icon: 'twpact', cd: 14, cost: 65, range: 8, ind: { type: 'ally' }, anim: 'pact', animDur: 0.5, lock: 0.2, ai: { t: 'shieldAlly' },
        desc: 'Тэн заключает сделку с союзным героем (до 8) или с собой: оба получают щит на 4 сек и +18% к скорости на 2 сек. Если союзнику осталось меньше 30% здоровья, ставки выше — щит в полтора раза больше.',
        cast(h, p) { const a = p.unit && p.unit.alive ? p.unit : h, amt = D(h, 75, 22, 0, 0.5) * (a.hp / a.maxHp < 0.3 ? 1.5 : 1); for (const o of a === h ? [h] : [h, a]) { shield(h, o, amt, 4, TWN.gold); addBuff(o, { id: 'twpact', dur: 2, ms: 0.18, src: h }); } twPactFx(h, a); }
      },
      {
        key: 'R', name: 'Последняя раздача', icon: 'twdeal', cd: 90, cost: 110, range: 0, ind: { type: 'self', r: 7.5 }, anim: 'deal', animDur: 0.8, lock: 0.4, ai: { t: 'nova', r: 7, ult: true, hp: 0.7, rad: 7 },
        desc: 'Тэн сдаёт по карте каждому вражескому герою в радиусе 7.5: перед ним встаёт огромная карта рубашкой вверх — и переворачивается. Чем старше карта (от шестёрки до туза), тем больше магического урона; туз ещё и оглушает на 1.3 сек. «Прочитанным» всегда выпадает туз: Тэн не гадает, он знает.',
        cast(h) {
          const foes = G.heroes.filter(e => e.alive && hostile(h, e) && udist(h, e) < 7.5); if (!foes.length) { if (h.isPlayer) UI.msg('Рядом нет вражеских героев'); return false; }
          twLockR(h); const dmg = D(h, 150, 45, 0, 0.8); SFX.at('ultcue', h.x, h.z, 0.65); SFX.at('card', h.x, h.z, 0.7);
          foes.forEach((e, i) => after(0.06 * i, () => twDealCard(h, e, twIsRead(e) ? 14 : 6 + Math.floor(Math.random() * 9), dmg)));
          if (FX.near(h.x, h.z, 55)) { FX.ring(h.x, h.z, { r0: 0.5, r1: 7.5, color: TWN.t, life: 0.5, tex: 'rune' }); twCardsBurst(h.x, 1.8, h.z, 10, 5, 0.8); }
        }
      }
    ],
    alt: [
      {
        key: 'Q', name: 'Ход конём', icon: 'twknight', cd: 8, cost: 60, range: 8, ind: { type: 'circle', r: 2.2 }, anim: 'move', animDur: 0.5, lock: 0.2, ai: { t: 'point', rad: 2.2, delay: 0.65 },
        desc: 'Хаку пускает белого коня буквой «Г» к точке (до 8): два прыжка, сквозь стены. На первом приземлении — слабый удар рядом, на втором — магический урон и оглушение на 0.8 сек всем врагам в радиусе 2.2. Каждый удар Хаку ставит герою «шах» (до трёх).',
        cast(h, p) { twKnight(h, h.x, h.z, p.x, p.z, D(h, 40, 10, 0, 0.3), D(h, 75, 20, 0, 0.55)); h.eyeT = G.time + 0.5; }
      },
      {
        key: 'W', name: 'Рикошет', icon: 'twricochet', cd: 7, cost: 55, range: 8.5, ind: { type: 'target' }, anim: 'calc', animDur: 0.55, lock: 0.25, ai: { t: 'target', farm: true },
        desc: 'Хаку просчитывает траекторию и стреляет: луч бьёт цель (до 8.5) и отскакивает ещё до четырёх раз к ближайшим врагам (героям — в первую очередь). Каждый отскок наносит на 20% больше магического урона, чем предыдущий.',
        cast(h, p) { twRicochet(h, p.unit, D(h, 50, 13, 0, 0.4)); }
      },
      {
        key: 'E', name: 'Под боем', icon: 'twboard', cd: 13, cost: 80, range: 9, ind: { type: 'circle', r: 4.5 }, anim: 'calc', animDur: 0.6, lock: 0.3, ai: { t: 'point', rad: 4.5, delay: 1.0 },
        desc: 'Хаку раскладывает доску 6×6 (до 9) на 3.6 сек и трижды бьёт невидимыми фигурами: сначала ладья (ряды и столбцы через каждого врага), потом слон (диагонали), потом ферзь (всё сразу). Атакованные клетки сперва загораются красным — с них можно успеть уйти; кто не ушёл, получает магический урон и замедление на 30%.',
        cast(h, p) { twBoard(h, p.x, p.z, D(h, 45, 12, 0, 0.35)); }
      },
      {
        key: 'R', name: 'Шах и мат', icon: 'twmate', cd: 95, cost: 120, range: 9, ind: { type: 'target', hero: true }, anim: 'mate', animDur: 1.0, lock: 0.5, ai: { t: 'target', ult: true, hp: 0.65 },
        desc: 'У вражеского героя (до 9) нет ходов: он обездвижен на 1.5 сек, вокруг поднимаются шесть белых фигур и бьют по очереди, а над головой трескается чёрный король. Затем — мат: огромный магический урон, тем больше, чем меньше у него здоровья (до +60%) и чем больше на нём «шахов» (+15% за каждый, шахи снимаются).',
        cast(h, p) { const t = p.unit; if (!t || t.kind !== 'hero') return false; twLockR(h); h.eyeT = G.time + 1.6; twMate(h, t, D(h, 24, 7, 0, 0.18), D(h, 130, 40, 0, 0.75)); }
      }
    ]
  },
  /* ================= 62. Reisei ================= */
  {
    id: 'reisei', name: 'Рэйсэй', title: 'Выпускник белой комнаты', role: 'assassin', roleName: 'Стратег', build: 'assassin', bars: [4, 3, 3, 3], diffc: 3, atkSfx: 'slash', noSlash: true,
    lore: 'Рэйсэй учится средне, говорит мало и никогда не выигрывает напоказ. Так и задумано. Его вырастили в белой комнате, где из детей делали идеальные инструменты, — и он стал лучшим её выпускником. Для него поле боя — доска, союзники и враги — фигуры, а пешкой не жалко пожертвовать. Руки он из карманов почти не вынимает: обычно хватает ног. И если он на тебя посмотрел — значит, всё уже по плану.',
    look: { bulk: 0.95, h: 1.04, scale: 1.0, c1: 0x6a1c26, c2: 0x2a2a32, c3: 0x16161c, sole: 0x2a2a30, cuff: 0xeae6de, skin: 0xead2c0, hands: 0xead2c0, metal: 0xd8b04a, glow: RSE.c, head: 'reisei', hair: 0x6a4a32, shirt: 0xf2f0ec, lin: 0xeae6de, chest: 'academy', legs: 'jeans', sh: 'none', weapon: 'none', wc: 'pocket' },
    stats: ST(600, 88, 290, 30, 63, 3.7, 25, 2.8, 0.85, 9.3, 2.4),
    innate: { name: 'Сдержанность', icon: 'rsinn', desc: 'Рэйсэй не показывает силу, пока это не нужно. Если он 2 сек не наносил урона вражеским героям, то каждые 1.5 сек копит заряд сдержанности (до 5). Первое умение, задевшее вражеского героя, тратит все заряды: +14% урона за каждый (при пяти — +70%).', count: h => h.rs ? h.rs : '' },
    onDeal(h, t) { if (t.kind === 'hero') h.rsHitT = G.time; },
    onHurt(h, src, d) { if (h.wroomT > G.time && src && src.kind === 'hero' && src.alive && hostile(h, src)) { h.wroomT = 0; h.buffs = h.buffs.filter(b => b.id !== 'wroom'); rsCounter(h, src, h.wroomDmg); } },
    onDeath(h) { h.rs = 0; h.wroomT = 0; },
    tick(h, dt) {
      if (G.time - (h.rsHitT === undefined ? -99 : h.rsHitT) > 2) { h.rsAcc = (h.rsAcc || 0) + dt; if (h.rsAcc >= 1.5) { h.rsAcc = 0; if ((h.rs || 0) < 5) { h.rs = (h.rs || 0) + 1; if (h.rs === 5 && FX.near(h.x, h.z, 40)) FX.ring(h.x, h.z, { r0: 1.6, r1: 0.4, color: RSE.c, life: 0.4, tex: 'ringThin' }); } } } else h.rsAcc = 0;
      h.eyeLow = (h.rs || 0) >= 5; if (h.eyeLow && FX.near(h.x, h.z, 40) && Math.random() < dt * 3) FX.burst(h.x + rand(-0.4, 0.4), rand(0.3, 2), h.z + rand(-0.4, 0.4), { n: 1, color: 0xffffff, color2: RSE.ice, speed: [0.2, 0.6], life: [0.4, 0.7], size: [0.12, 0.02], up: 0.8 });
      if (h.wroomT && G.time > h.wroomT) { h.wroomT = 0; h.cd[2] *= 0.5; }   // no one struck: the room was not needed, half the cooldown back
    },
    abilities: [
      {
        key: 'Q', name: 'В пешки', icon: 'rspawn', cd: 8, cost: 50, range: 7, ind: { type: 'target', minions: true }, anim: 'pawn', animDur: 0.45, lock: 0.15, ai: { t: 'target', farm: true },
        desc: 'Рэйсэй указывает на врага (до 7) — и тот становится пешкой. Вражеский герой получает физический урон и на 1.4 сек превращается в белую пешку: не может атаковать и применять умения и ползёт на 35% медленнее. Миньон или лесной зверь — свой или чужой (за чужого — золото) — становится пешкой Рэйсэя: она видит вражеских героев в радиусе 30, идёт к ближайшему сквозь крипов и взрывается — физический урон (плюс 5% здоровья жертвы) и замедление на 40% в радиусе 2.5. Если героев не видно, пешка шагает прямо (до 20 шагов), высматривая их, и сворачивает к первому, кто покажется; не встретив никого — взрывается в конце пути. Пройдя 6 шагов, пешка становится ферзём — урон в полтора раза больше и оглушение на 0.8 сек.',
        cast(h, p) { const t = p.unit; if (!t || !t.alive || t.struct || t.boss) return false; h.eyeT = G.time + 0.4; if (t.kind === 'hero') rsPawnHero(h, t, D(h, 70, 18, 0.8, 0), 1.4); else rsPawn(h, t, D(h, 70, 18, 0.75, 0)); }
      },
      {
        key: 'W', name: 'Без замаха', icon: 'rspalm', cd: 9, cost: 50, range: 5, ind: { type: 'line', w: 1.6, fixed: true }, anim: 'palm', animDur: 0.5, lock: 0, ai: { t: 'gap' },
        desc: 'Рэйсэй скользит вперёд (до 5) и бьёт ладонью первого врага на пути: физический урон, врага отбрасывает на 3.5. Если на пути отлёта стена, враг врезается в неё: ещё половина урона и оглушение на 0.9 сек.',
        cast(h, p) {
          const dmg = D(h, 65, 17, 1.0, 0), dir = p.dir; SFX.at('dash', h.x, h.z, 0.6);
          dashTo(h, h.x + Math.sin(dir) * 5, h.z + Math.cos(dir) * 5, 32, { ribbon: RSE.c, w: 1.2, onHit(e) {
            if (e.struct) return false; damage(h, e, dmg * rsMul(h, e), 0); rsShove(h, e, dir, 3.5, dmg * 0.5); h.anim.castT = h.anim.castDur = 0.4; h.anim.castType = 'palm';
            SFX.at('punch', e.x, e.z, 0.8); SFX.at('impact', e.x, e.z, 0.4); if (FX.near(e.x, e.z, 55)) { FX.hit(e.x, 1.3, e.z, RSE.c, true); FX.ring(e.x, e.z, { r0: 0.3, r1: 2.2, color: RSE.c, life: 0.25, tex: 'shock' }); FX.sparks(e.x, 1.3, e.z, { n: 10, color: 0xffffff, color2: RSE.ice, speed: [4, 10], life: [0.15, 0.35], w: 0.08, dir, spread: 0.6 }); FX.shock(e.x, e.z, 2.4, 0.7, 0.3); }
            return true; } });
        }
      },
      {
        key: 'E', name: 'Белая комната', icon: 'rsroom', cd: 14, cost: 60, range: 0, ind: { type: 'self', r: 1.5 }, anim: 'wroom', animDur: 1.0, lock: 0, ai: { t: 'parry' },
        desc: 'На 1 сек Рэйсэй уходит в себя — вокруг него смыкается белая комната: он получает на 60% меньше урона. Первый вражеский герой, который его ударит, проиграл: Рэйсэй мгновенно оказывается у него за спиной, бьёт (физический урон) и оглушает на 0.8 сек. Если никто не ударил — половина перезарядки возвращается.',
        cast(h) { h.wroomT = G.time + 1.0; h.wroomDmg = D(h, 60, 16, 0.9, 0); addBuff(h, { id: 'wroom', dur: 1.0, dmgIn: 0.4 }); h.eyeT = G.time + 1; rsRoomFx(h, 1.0); SFX.at('heartbeat', h.x, h.z, 0.5); SFX.at('tick', h.x, h.z, 0.4); }
      },
      {
        key: 'R', name: 'Всё по плану', icon: 'rsplan', cd: 75, cost: 100, range: 10, ind: { type: 'target', hero: true }, anim: 'pawn', animDur: 0.6, lock: 0.2, ai: { t: 'target', ult: true, hp: 0.75 },
        desc: 'Рэйсэй берёт вражеского героя (до 10) в план на 4 сек: под ним — доска, над ним — чёрный король, а союзники Рэйсэя рядом бегут на 12% быстрее. Весь урон, который цель получает за это время, запоминается. В конце (или раньше, если у цели меньше 25% здоровья) Рэйсэй оказывается у неё за спиной (до 28) и бьёт ногой сверху: физический урон плюс 30% запомненного, оглушение на 0.8 сек; цель ниже 15% здоровья погибает. Если Рэйсэй слишком далеко, план срабатывает сам, но вполсилы.',
        cast(h, p) { const t = p.unit; if (!t || t.kind !== 'hero') return false; h.eyeT = G.time + 0.8; rsPlan(h, t); }
      }
    ]
  }
);

/* ---------- icons ---------- */
Object.assign(GLYPH, {
  // two empty brackets side by side — the name nobody writes
  twinn(T) { T.S(5, -6, -18, -18, -18, -18, 18, -6, 18); T.S(5, 6, -18, 18, -18, 18, 18, 6, 18); T.hi(() => { T.C(-11, 0, 2.2); T.C(11, 0, 2.2); }); },
  // a fan of three cards, the front one an ace
  twcard(T) { T.card(-9, 2, 18, 26, -0.4); T.card(9, 2, 18, 26, 0.4); T.rot(0, () => { T.g.fillRect(-9, -15, 18, 26); T.cut(() => T.P(0, -8, 5, -1, 0, 6, -5, -1)); }, 0, 0); T.hi(() => T.C(-5, -11, 1.4)); },
  // two figures, one of them only an outline
  twfeint(T) { T.C(8, -12, 6); T.P(1, -4, 15, -4, 17, 20, -1, 20); T.al(0.4, () => { T.O(-10, -10, 6, 2.5); T.S(2.5, -17, 20, -16, -2, -4, -2, -3, 20); }); T.arrow(-2, 12, 20, 12, 6, 3); },
  // a handshake under a star
  twpact(T) { T.P(-24, 4, -8, -6, 2, -2, 8, 6, 2, 12, -10, 8); T.P(24, 4, 8, -6, -2, -2, -8, 6, -2, 12, 10, 8); T.star(0, -16, 7, 3, 5); T.hi(() => T.C(0, -16, 1.6)); },
  // one great card turning over
  twdeal(T) { T.rot(0.15, () => { T.g.fillRect(-13, -20, 26, 38); T.cut(() => { T.P(0, -10, 7, 0, 0, 10, -7, 0); }); }); T.al(0.4, () => T.card(-15, 4, 14, 22, -0.5)); T.al(0.4, () => T.card(15, 4, 14, 22, 0.5)); },
  // a knight and the L of its move
  twknight(T) { T.P(-10, 20, 10, 20, 8, 6, 12, -4, 4, -16, -6, -14, -12, -2, -6, 0, -8, 8); T.cut(() => T.C(1, -9, 2)); T.al(0.5, () => { T.S(3, 18, 22, 18, -6); T.S(3, 18, -6, 24, -6); }); },
  // a bolt bouncing between three points
  twricochet(T) { T.S(3.5, -20, 16, -6, -14, 8, 12, 20, -16); for (const [x, y] of [[-6, -14], [8, 12], [20, -16]]) T.C(x, y, 4); T.hi(() => T.C(20, -16, 1.6)); },
  // a board with a lit cross through it
  twboard(T) { for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) if ((i + j) % 2) T.al(0.45, () => T.g.fillRect(-20 + i * 10, -20 + j * 10, 10, 10)); T.g.fillRect(-20, -2, 40, 6); T.g.fillRect(-3, -20, 6, 40); T.O(0, 1, 23, 2.5); },
  // a king toppling
  twmate(T) { T.rot(0.7, () => { T.g.fillRect(-7, -6, 14, 22); T.P(-10, -6, 10, -6, 6, -14, -6, -14); T.g.fillRect(-2, -24, 4, 10); T.g.fillRect(-6, -21, 12, 4); T.g.fillRect(-11, 16, 22, 5); }, 2, 2); T.al(0.5, () => T.S(3, -22, 22, 22, 22)); },
  // a closed eye with a faint glint
  rsinn(T) { T.Q(4, -20, 0, 0, 12, 20, 0); for (const x of [-12, -4, 4, 12]) T.S(3, x, 6, x * 1.2, 13); T.al(0.35, () => T.O(0, -4, 20, 2)); T.hi(() => T.C(12, -10, 1.8)); },
  // a pawn rising out of a burst
  rspawn(T) { T.C(0, -12, 6); T.P(-5, -6, 5, -6, 8, 10, -8, 10); T.g.fillRect(-12, 10, 24, 6); T.al(0.4, () => { T.S(3, -20, 4, -13, 2); T.S(3, 20, 4, 13, 2); T.S(3, -16, -14, -10, -8); T.S(3, 16, -14, 10, -8); }); },
  // an open palm thrust forward with speed lines
  rspalm(T) { T.P(-4, -14, 14, -10, 18, 0, 14, 12, -4, 14, -10, 0); for (const y of [-10, -4, 2, 8]) T.g.fillRect(14, y - 1.5, 8, 3); T.al(0.45, () => { T.S(3, -24, -6, -14, -6); T.S(3, -24, 4, -14, 4); }); },
  // a room drawn in perspective: a white cube with a figure inside
  rsroom(T) { T.S(3, -18, -12, 0, -22, 18, -12, 18, 12, 0, 22, -18, 12, -18, -12); T.S(3, -18, -12, 0, -2, 18, -12); T.S(3, 0, -2, 0, 22); T.al(0.5, () => T.C(0, 6, 4)); },
  // a black king with lines converging on it
  rsplan(T) { T.g.fillRect(-6, -4, 12, 18); T.P(-9, -4, 9, -4, 6, -11, -6, -11); T.g.fillRect(-2, -20, 4, 9); T.g.fillRect(-5, -17, 10, 3); T.g.fillRect(-10, 14, 20, 5); T.al(0.45, () => { T.S(2.5, -24, -20, -10, -6); T.S(2.5, 24, -20, 10, -6); T.S(2.5, -24, 22, -11, 15); T.S(2.5, 24, 22, 11, 15); }); }
});

/* ---------- icon colours: an ability whose effect is not in its hero's colour gets an icon in the colour of the effect itself
   (null — keep the hero's colour). The twins: the first four are Ten's, the next four Haku's ---------- */
const ICON_COLS = {
  aisa: [0x6ac0f0, 0x8fd8ff, 0xa8e4ff, 0x5ab8e8],            // ice: from pale white to clear blue
  lira: [0x8fbfee, 0x8fbfee, 0x8fbfee, 0x5a9ae0],            // the wind
  shaya: [null, null, 0xd6c070, null],                       // a curtain of sand
  vint: [null, null, 0xff8a3a, null],                        // rockets: fire
  toplak: [null, 0x9fb832, null, null],                      // rotten water
  dash: [null, 0xf2c81e, null, 0xf2c81e],                    // the gorilla arms and the cyberskeleton are gold
  riku: [null, 0x58e08a, null, 0x8a56f0],                    // scissors green, the vow violet
  ashen: [null, null, 0x9fe08a, null],                       // the drag heals: green smoke
  mei: [null, null, null, 0xd0182a],                         // the scent of blood
  akito: [0xd0182a, 0x9fe08a, 0x9ad8ff, null],               // the cursed blade red, the smoke break green, the future blue
  frieren: [null, 0x7ad88a, null, null],                     // a field of flowers
  lelouch: [null, 0x8a3aff, null, null],                     // Zero's shield
  ichigo: [null, null, null, 0xff1a2a],                      // the hollow
  misaka: [0xffa040, null, null, null],                      // the railgun coin burns orange
  silas: [null, 0xd0a868, 0xff7a2a, 0xd0a868],               // rope, dynamite, rope
  wlad: [0x5ab86a, null, null, null],                        // banknotes
  gubert: [null, 0x8fe8ff, 0x8fe8ff, 0xe8963a],              // soap, water, burgers
  blank: [null, null, 0xffd86a, null, null, null, null, null] // the golden deal
};
for (const h of HEROES) { const c = ICON_COLS[h.id]; if (!c) continue; h.abilities.concat(h.alt || []).forEach((a, i) => { if (a && c[i] !== null && c[i] !== undefined) a.iconCol = c[i]; }); }
