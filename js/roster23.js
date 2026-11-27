'use strict';
/* ===== roster, part 49 (heroes 77 and 78). Loaded after roster22.js; uses stripHits (roster2), dshGhost (roster2), twGhost (roster11), akMat / akCut (roster13), rmpArc (roster2).
   77. Soren — a young reaper who carries a living scythe. Every wound he deals to a hero feeds one of the two that share his body: melee blood feeds Harrak,
       the thing in the scythe; ranged blood feeds his own shadow. When the measure is full he becomes one of them for the rest of the match, and his whole kit changes with it.
       A dash that ends in a spin of the scythe, a delayed strike along a long line, a walk through walls, and «Possession»: he enters a wounded enemy and bursts out of him.
       (the reference for the mechanics: Kayn, League of Legends)
   78. Sigure — a swordsman back from the other side with two blades, steel and spirit. Every second attack cuts with magic; a thrust that on its third use becomes a rush
       in a whirlwind; a cleave that gives a shield; «Soul unbound»: he leaves his body, fights as a spirit and snaps back, repeating a share of the damage he dealt;
       «Fate sealed»: a strike along a long line that carries him behind the last hero hit and drags everyone to him. No mana at all.
       (the reference for the mechanics: Yone, League of Legends) ===== */

/* ---------- shared pieces ---------- */
// a crescent of one colour rushing outward over the ground (akWave is fixed to Akuro's red)
const _rfWG = {};
function rfWave(x, z, dir, R, half, life, y, col, core) {
  if (!FX.near(x, z, 60)) return; const key = half.toFixed(2);
  if (!_rfWG[key]) { const a = new THREE.RingGeometry(0.84, 1, 36, 1, -half, half * 2), b = new THREE.RingGeometry(0.95, 1, 36, 1, -half * 0.94, half * 1.88); a.rotateX(-HPI); b.rotateX(-HPI); _rfWG[key] = [a, b]; }
  const g = _rfWG[key], m = new THREE.Mesh(g[0], akMat(null, col)), c = new THREE.Mesh(g[1], akMat(null, core === undefined ? 0xffffff : core)); c.userData.own = true; m.add(c);
  m.position.set(x, y || 1.0, z); m.rotation.y = dir - HPI; const L = life || 0.18;
  FX.add(m, L, (k, me) => { const s = 0.8 + (R - 0.8) * easeOut(k); me.scale.set(s, 1, s); me.material.opacity = 0.8 * (1 - k * k); c.material.opacity = 1 - k; });
}
// a cut left in the ground: a dark line with a glow of the given colour cooling inside it. (x, z) is its middle
function rfScar(x, z, len, ang, life, col) {
  if (!FX.near(x, z, 60) || !GFX.decals) return;
  const m = new THREE.Mesh(FX.geo.line, new THREE.MeshBasicMaterial({ color: 0x0c0608, transparent: true, opacity: 0.85, depthWrite: false })), m2 = new THREE.Mesh(FX.geo.line, new THREE.MeshBasicMaterial({ color: col, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  m2.userData.own = true; m.add(m2); m2.scale.set(0.4, 1, 1); m2.position.y = 0.005; m.position.set(x - Math.sin(ang) * len / 2, 0.06, z - Math.cos(ang) * len / 2); m.rotation.y = ang; m.scale.set(0.14, 1, len); m.renderOrder = 4;
  const L = life || 2.5; FX.add(m, L, (k, me) => { me.material.opacity = 0.85 * (1 - k * k); m2.material.opacity = 0.9 * Math.max(0, 1 - k * 2.2); });
}
// a stand-in "unit" that lets animHero pose a rig which belongs to no unit (a shadow, a body left behind)
function rfPuppet(rig, face, pose, dur) { return { id: 7.5, rig, facing: face, moving: false, ms: 8, flash: 0, dead: false, yOff: 0, anim: { walk: 0, atkT: 0, atkDur: 1, castT: dur, castDur: dur, castType: pose, deathT: 0, spinA: 0, alt: false } }; }

/* ==================================================================== 77. SOREN ==================================================================== */
const SOR = { c: 0xb86bff, deep: 0x4a1a8a, d: 0xff3a2a, dd: 0x7a0e08, s: 0x4ab8ff, sd: 0x123a7a };
const SOR_COL = [SOR.c, SOR.d, SOR.s], SOR_DEEP = [SOR.deep, SOR.dd, SOR.sd], SOR_NAME = ['', 'Харрак', 'Тень'], SOR_CSS = ['#d9b0ff', '#ff8a78', '#9fd8ff'];
const SOR_LOOK = [
  { bulk: 0.98, h: 1.04, scale: 1.08, c1: 0x231f2c, c2: 0x2c2836, c3: 0x15131a, skin: 0xdcbfa6, hands: 0xdcbfa6, cuff: 0xcfc6b4, metal: 0x8a8490, glow: SOR.c, head: 'soren', hair: 0x16121c, lin: 0x6a2440, chest: 'acolyte', legs: 'boots', sh: 'soren', weapon: 'soulscythe', wc: 'reap', form: 0 },
  { bulk: 1.16, h: 1.06, scale: 1.24, c1: 0x3a1418, c2: 0x2a1016, c3: 0x180a0c, skin: 0x4a1a20, hands: 0x2a1016, cuff: 0x2a1016, metal: 0x5c2026, glow: SOR.d, head: 'soren', chest: 'acolyte', legs: 'greaves', sh: 'soren', weapon: 'soulscythe', wc: 'reap', form: 1 },
  { bulk: 0.92, h: 1.05, scale: 1.08, c1: 0x151824, c2: 0x10121c, c3: 0x0a0c14, skin: 0xb9c2d4, hands: 0x10121c, cuff: 0x1a1e2e, metal: 0x4a5a78, glow: SOR.s, head: 'soren', chest: 'acolyte', legs: 'boots', sh: 'soren', weapon: 'soulscythe', wc: 'reap', cape: 0x121522, form: 2 }
];
const SOR_GAIN = 26, SOR_DRIP = 0.11, SOR_WAIT = 90;   // essence for dealing a hero's whole health; essence per second to each side; how long the other form stays closed
const sorF = h => h.sorForm || 0;
function sorTint(h, on) { h.rig.mats[0].color.setHex(on ? 0x3c3856 : 0xffffff); }   // walking as a shadow: the body goes dark, only the glowing parts stay lit

/* ----- the two hungers ----- */
function sorGain(h, kind, amt) {
  if (h.sorForm || h.sorChanging) return; const E = h.sorE; E[kind] += amt;
  if (!h.sorReady && E[0] + E[1] >= 100) {
    h.sorReady = E[0] >= E[1] ? 1 : 2; h.sorReadyT = G.time; const col = SOR_COL[h.sorReady];
    if (FX.near(h.x, h.z, 55)) { FX.ring(h.x, h.z, { r0: 0.4, r1: 3.4, color: col, life: 0.6, tex: 'ringThin' }); FX.pillar(h.x, h.z, { r: 0.7, h: 8, color: col, life: 0.6, op: 0.5 }); FX.text(h.x, h.height + 1.2, h.z, SOR_NAME[h.sorReady] + ' рвётся наружу', SOR_CSS[h.sorReady], 15); }
    if (h.isPlayer && !h.ai) SFX.play('level');
  }
}
function sorCan(h, f) { return !!h.sorReady && !h.sorForm && (f === h.sorReady || G.time >= h.sorReadyT + SOR_WAIT); }
// the change: a second of standing still while one of the two takes the body, then a new rig, a new kit and a new innate for the rest of the match
function sorTransform(h, f) {
  if (!h.alive || h.sorChanging || h.sorIn || h.sorStep || h.dash || h.stunned || !sorCan(h, f)) return false;
  h.sorChanging = true; const col = SOR_COL[f], deep = SOR_DEEP[f], T = 1.0, x = h.x, z = h.z;
  h.castLock = T; h.order = null; h.path = null; h.windup = 0; if (h.recall > 0) cancelRecall(h);
  h.anim.castT = h.anim.castDur = T + 0.4; h.anim.castType = 'sorform'; h.anim.atkT = 0;
  addBuff(h, { id: 'sorform', dur: T + 0.3, dmgIn: 0.5, src: h });
  SFX.at('sorform', x, z, 1);
  if (FX.near(x, z, 60)) {
    FX.zone(x, z, 3.4, deep, T, { tex: 'swirl', spin: f === 1 ? 8 : -8, op: 0.8 }); FX.ring(x, z, { r0: 4.5, r1: 0.6, color: col, life: T * 0.8, tex: 'ringThin' }); FX.light(x, 2.5, z, col, 2.2, 14, T + 0.3);
    let acc = 0; FX.add(new THREE.Group(), T * 0.8, (k, me, dt) => { acc += dt; if (acc < 0.05) return; acc = 0; FX.implode(x, 1.6, z, 4.5, { n: 5, color: col, color2: deep, life: 0.35, streak: true }); FX.flame(x, 0.3, z, { n: 2, color: col, color2: deep, size: [0.6, 1.3], life: [0.3, 0.6], up: 4, rad: 1.2, a: 0.5 }); });
  }
  after(T * 0.78, () => { if (!h.alive || h.sorForm) { h.sorChanging = false; return; } sorBecome(h, f); });
  return true;
}
function sorBecome(h, f) {
  const col = SOR_COL[f], deep = SOR_DEEP[f], old = h.rig, nr = buildHero(SOR_LOOK[f], h.isPlayer ? 0xeaffea : TEAM_COL[h.team]);
  G.scene.remove(old.root); h.rig = nr; nr.root.position.set(h.x, 0, h.z); nr.root.rotation.y = h.facing; G.scene.add(nr.root);
  h.height = nr.height; h.pcol = col; h.sorForm = f; h.sorChanging = false; h.sorEdgeT = 0; h.sorEdgeCd = 0; if (f === 1) h.name = 'Харрак'; h.sorFormT = G.time;
  const cds = h.cd.slice(); h.def.abilities = SOR_KITS[f].slice(); h.def.innate = SOR_INN[f]; for (let i = 0; i < 4; i++) h.cd[i] = cds[i];
  h.anim.castT = Math.min(h.anim.castT, 0.3);
  sorHudIcons(h); sorHudUpd(h, true);
  SFX.at('bigboom', h.x, h.z, 0.6); SFX.at(f === 1 ? 'roar' : 'ghost', h.x, h.z, 0.8);
  if (typeof UI !== 'undefined' && G.player) UI.announce(f === 1 ? 'Коса победила: Сорена больше нет, есть Харрак' : 'Сорен победил косу: он стал Тенью', SOR_CSS[f]);
  if (!FX.near(h.x, h.z, 65)) return;
  FX.explosion(h.x, h.z, 2.5, col, { color2: deep }); FX.ring(h.x, h.z, { r0: 0.5, r1: 7, color: col, life: 0.6, tex: 'ringThin' }); FX.ring(h.x, h.z, { r0: 0.4, r1: 5, color: deep, life: 0.5, tex: 'shock', op: 0.25 });
  FX.pillar(h.x, h.z, { r: 1.5, h: 13, color: col, life: 0.7, op: 0.55 }); FX.ripple(h.x, 1.4, h.z, 1.5); FX.shake(0.5); FX.hitstop(0.06); FX.punch(0.6); FX.light(h.x, 3, h.z, col, 3, 20, 0.6);
  FX.sparks(h.x, 1.4, h.z, { n: 36, color: 0xffffff, color2: col, speed: [6, 18], life: [0.25, 0.6], w: 0.1, ring: true }); FX.scorch(h.x, h.z, 3, col, 6);
  if (f === 1) { FX.debris(h.x, 0.4, h.z, { n: 14, color: 0x3a1418, speed: [4, 11], up: 10, size: [0.2, 0.5] }); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; sorSpike(h.x + Math.sin(a) * 2.2, h.z + Math.cos(a) * 2.2, 2.6, 0.6, 0.9, 0.5, a, col, 0x2a0a0c); } }
  else { for (let i = 0; i < 5; i++) after(i * 0.05, () => dshGhost(h, deep, 0.5, 0.45)); FX.burst(h.x, 1, h.z, { smoke: true, n: 12, color: 0x1a2a4a, color2: 0x05070c, speed: [1, 4], life: [0.6, 1.2], size: [1, 2.2], ring: true, a: 0.5 }); }
  FX.text(h.x, h.height + 1.4, h.z, SOR_NAME[f].toUpperCase(), SOR_CSS[f], 22);
}

/* ----- the player's side of it: the two measures over the ability bar, a button under each ----- */
function sorHudHook() {
  if (typeof UI === 'undefined' || UI._sorHook) return; UI._sorHook = true; const sh = UI.showHUD;
  UI.showHUD = function () { sh.apply(this, arguments); const P = G.player, el = $('sorpick'); if (P && P.def.id === 'soren' && !P.ai) { sorPanel().hidden = false; sorHudUpd(P, true); } else if (el) el.hidden = true; };
}
function sorPanel() {
  let el = $('sorpick'); if (el) return el; el = document.createElement('div'); el.id = 'sorpick';
  el.style.cssText = 'position:absolute;left:50%;bottom:158px;transform:translateX(-50%);z-index:6;display:flex;flex-direction:column;align-items:center;gap:4px;font:600 11px "Exo 2",sans-serif;color:#aab3c4;text-shadow:0 1px 2px #000;pointer-events:auto';
  const btn = 'display:flex;align-items:center;gap:5px;height:30px;padding:0 9px 0 3px;border-radius:6px;border:1px solid #2a2e3c;background:rgba(10,12,18,.85);color:#7a8294;font:700 12px "Exo 2",sans-serif;cursor:pointer;transition:box-shadow .2s,color .2s,border-color .2s';
  el.innerHTML = `<div style="display:flex;align-items:center;gap:7px"><button type="button" id="sor-b1" style="${btn}"><img alt="" width="24" height="24" style="border-radius:4px">Харрак</button>
    <div style="width:210px;height:11px;border-radius:6px;border:1px solid #2a2e3c;background:rgba(8,10,14,.9);position:relative;overflow:hidden"><i id="sor-r" style="position:absolute;left:0;top:0;bottom:0;width:0;background:linear-gradient(90deg,#7a0e08,#ff3a2a)"></i><i id="sor-s" style="position:absolute;right:0;top:0;bottom:0;width:0;background:linear-gradient(270deg,#123a7a,#4ab8ff)"></i></div>
    <button type="button" id="sor-b2" style="${btn}"><img alt="" width="24" height="24" style="border-radius:4px">Тень</button></div><div id="sor-t"></div>`;
  $('hud').appendChild(el);
  el.querySelector('#sor-b1 img').src = iconURL('sorf1', SOR.d); el.querySelector('#sor-b2 img').src = iconURL('sorf2', SOR.s);
  for (const f of [1, 2]) $('sor-b' + f).onclick = e => { e.stopPropagation(); const P = G.player; if (!P || P.def.id !== 'soren' || G.paused) return; if (!sorTransform(P, f)) { SFX.play('deny'); UI.msg(sorCan(P, f) ? 'Сейчас нельзя: остановитесь и закончите умение' : (P.sorReady ? 'Эта форма откроется позже' : 'Мера ещё не полна')); } };
  return el;
}
function sorHudUpd(h, force) {
  if (typeof UI === 'undefined' || G.player !== h || h.ai) return; if (!force && G.time < (h.sorHudT || 0)) return; h.sorHudT = G.time + 0.2;
  const el = sorPanel(), E = h.sorE, tot = Math.max(100, E[0] + E[1]);
  if (h.sorForm) { el.hidden = true; return; } el.hidden = false;
  $('sor-r').style.width = (E[0] / tot * 100).toFixed(1) + '%'; $('sor-s').style.width = (E[1] / tot * 100).toFixed(1) + '%';
  for (const f of [1, 2]) { const b = $('sor-b' + f), ok = sorCan(h, f), c = SOR_CSS[f]; b.style.color = ok ? c : '#7a8294'; b.style.borderColor = ok ? c : '#2a2e3c'; b.style.boxShadow = ok ? '0 0 ' + (9 + Math.sin(G.time * 6) * 4).toFixed(0) + 'px ' + c : 'none'; b.style.opacity = ok || !h.sorReady ? 1 : 0.6; }
  const left = h.sorReady ? Math.ceil(h.sorReadyT + SOR_WAIT - G.time) : 0;
  $('sor-t').textContent = h.sorChanging ? '' : (!h.sorReady ? 'Раны бойцам ближнего боя кормят Харрака, раны стрелкам и магам — Тень' : (left > 0 ? 'Выберите форму. ' + SOR_NAME[3 - h.sorReady] + ' откроется через ' + left + ' сек' : 'Выберите форму: открыты обе'));
}
function sorHudIcons(h) {
  if (typeof UI === 'undefined' || !$('abs') || G.player !== h) return; const D = h.def, col = SOR_COL[sorF(h)];
  for (let i = 0; i < 4; i++) { const a = D.abilities[i], el = $('ab' + i); if (!a || !el) continue; el.children[0].src = iconURL(a.icon, col); const c = el.querySelector('.cost'); if (c) c.textContent = a.cost || ''; }
  const I = $('abI'); if (I) { const n = D.innate; I.children[0].src = iconURL(n.icon, col); I.onmouseenter = e => UI.tip(e, `<b>${n.name}</b><small>врождённая · действует всегда</small>${n.desc}`); }
  UI.lastCd = h.cd.slice(); G.aim = -1; UI.tip();
}

/* ----- effects ----- */
// a blade bursting out of the ground: a dark flat spike with a rim of light, up in an instant and sinking back
let _sorSG = null;
function sorSpike(x, z, hgt, w, life, lean, a, col, dark) {
  if (!FX.near(x, z, 60)) return; if (!_sorSG) _sorSG = new THREE.ConeGeometry(0.5, 1, 4).translate(0, 0.5, 0);
  const g = new THREE.Group(), o = new THREE.Mesh(_sorSG, new THREE.MeshBasicMaterial({ color: dark, transparent: true })), c = new THREE.Mesh(_sorSG, akMat(null, col)); o.userData.own = c.userData.own = true; c.scale.set(1.3, 1.04, 0.4); c.position.y = -0.01; g.add(c, o);
  g.position.set(x, 0, z); g.rotation.order = 'YXZ'; g.rotation.set(lean, a, 0);
  FX.add(g, life, (k, me) => { const up = k < 0.16 ? easeOut(k / 0.16) : 1, dn = k > 0.55 ? (k - 0.55) / 0.45 : 0; me.scale.set(w, Math.max(0.01, hgt * up * (1 - dn * 0.9)), w * 0.4); o.material.opacity = 1 - dn; c.material.opacity = 0.85 * (1 - dn); });
}
function sorSmoke(x, y, z, f, n) { if (FX.near(x, z, 50)) FX.burst(x, y, z, { smoke: true, n: n || 3, color: f === 1 ? 0x3a0e0c : (f === 2 ? 0x16264a : 0x2a1640), color2: 0x06050a, speed: [0.3, 1.4], life: [0.4, 0.9], size: [0.7, 1.5], up: 0.9, rad: 0.5, a: 0.45 }); }

/* ----- Q: the rush and the spin ----- */
function sorReap(h, dir, dmg) {
  const f = sorF(h), col = SOR_COL[f], deep = SOR_DEEP[f], L = 4.5, x0 = h.x, z0 = h.z; let n = 0;
  const hit = (e, spin) => {
    if (e.struct) return; let d = dmg; if (f === 1) d += Math.min(e.maxHp * 0.03, e.kind === 'hero' ? 1e9 : 50);
    damage(h, e, d, 0);
    if (FX.near(e.x, e.z, 45)) { FX.hit(e.x, e.height * 0.55, e.z, col, spin); akCut(e.x, e.height * 0.55, e.z, 2.6, rand(TAU), rand(-0.5, 0.5), 0.16, col); if (f === 1) FX.burst(e.x, 1.2, e.z, { n: 5, color: 0xff5040, color2: 0x5a0806, speed: [2, 6], life: [0.25, 0.5], size: [0.3, 0.05], grav: -12 }); }
  };
  SFX.at('sorreap', x0, z0, 0.8); SFX.at('dash', x0, z0, 0.35);
  if (FX.near(x0, z0, 55)) { FX.ring(x0, z0, { r0: 0.3, r1: 2, color: deep, life: 0.3, tex: 'shock', op: 0.5 }); sorSmoke(x0, 0.5, z0, f, 4); }
  dashTo(h, h.x + Math.sin(dir) * L, h.z + Math.cos(dir) * L, 27, {
    w: 1.5, fly: h.ghostT > G.time, ribbon: col,
    trail: u => { if (++n % 2 || !FX.near(u.x, u.z, 50)) return; dshGhost(u, deep, 0.26, 0.42); FX.sparks(u.x, 0.3, u.z, { n: 2, color: 0xffffff, color2: col, speed: [2, 6], life: [0.15, 0.3], w: 0.06, dir: u.facing + Math.PI, spread: 0.7, up: 2 }); },
    onHit: e => hit(e, false),
    onEnd: u => {
      if (!u.alive) return; const R = 3.3;
      u.spinning = true; u.sorSpinT = G.time + 0.27; u.castLock = Math.max(u.castLock, 0.2); u.anim.castT = u.anim.castDur = 0.34; u.anim.castType = 'mow';
      for (const e of enemiesIn(u, u.x, u.z, R)) hit(e, true);
      SFX.at('scythe', u.x, u.z, 0.85); if (f === 1) SFX.at('heavy', u.x, u.z, 0.5);
      rfScar((x0 + u.x) / 2, (z0 + u.z) / 2, dist(x0, z0, u.x, u.z), dir, 2.2, col);
      if (!FX.near(u.x, u.z, 55)) return;
      rmpArc(u.x, u.z, dir, R + 0.2, 5.8, 0.26, col, 1.25, false, 0.95); rmpArc(u.x, u.z, dir + Math.PI, R * 0.78, 5.8, 0.32, deep, 0.9, false, 0.8); rmpArc(u.x, u.z, dir + 1, R * 0.5, 5.8, 0.2, 0xffffff, 1.3, false, 0.5);
      FX.ring(u.x, u.z, { r0: 0.6, r1: R + 0.3, color: col, life: 0.3, tex: 'ringThin' }); FX.shock(u.x, u.z, R, 0.7, 0.3); FX.light(u.x, 1.6, u.z, col, 1.8, 10, 0.25);
      FX.sparks(u.x, 1.1, u.z, { n: 18, color: 0xffffff, color2: col, speed: [6, 14], life: [0.15, 0.35], w: 0.08, ring: true });
      FX.burst(u.x, 0.3, u.z, { smoke: true, n: 6, color: 0x8a8088, color2: 0x2a2630, speed: [1, 3], life: [0.4, 0.8], size: [0.7, 1.4], ring: true, a: 0.35 });
      if (f === 1) { FX.debris(u.x, 0.3, u.z, { n: 7, color: 0x3a1418, speed: [3, 8], up: 8, size: [0.15, 0.4] }); FX.shake(0.25); rmpArc(u.x, u.z, dir + 2, R + 0.6, 5.8, 0.36, 0x7a0e08, 0.6, true, 0.7); }
      if (f === 2) { dshGhost(u, deep, 0.35, 0.5); sorSmoke(u.x, 0.8, u.z, 2, 6); }
    }
  });
}
/* ----- W: the long reach ----- */
// in the shadow form the strike is made by a shadow left where he stood: a dark copy of him that heaves the scythe up and brings it down
function sorShade(h, x, z, dir, dur) {
  if (!FX.near(x, z, 60) || G.time < (h.sorShadeBusy || 0)) return;
  if (!h.sorShadeRig) {
    const rig = buildHero(SOR_LOOK[2], 0xffffff), mb = new THREE.MeshBasicMaterial({ color: 0x0a1428, transparent: true, opacity: 0.78, depthWrite: false }), mg = new THREE.MeshBasicMaterial({ color: SOR.s, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
    rig.ring.visible = false; rig.root.traverse(o => { if (!o.isMesh) return; const m = o.material; if (!m || m.map) { o.visible = false; return; } o.material = m.isMeshBasicMaterial ? mg : mb; o.castShadow = false; o.renderOrder = 12; });
    rig.mats = [new THREE.MeshPhongMaterial()]; h.sorShadeRig = rig; h.sorShadeM = [mb, mg];
  }
  const rig = h.sorShadeRig, pu = rfPuppet(rig, dir, 'sorreach', 0.9), M = h.sorShadeM; rig.root.rotation.y = dir; h.sorShadeBusy = G.time + dur + 0.1;
  FX.add(rig.root, dur, (k, me, dt) => { me.position.set(x, 0, z); animHero(pu, dt || 0.001); me.position.y = 0; const a = Math.min(1, k * 8, (1 - k) * 5); M[0].opacity = 0.78 * a; M[1].opacity = 0.9 * a; });
  FX.ring(x, z, { r0: 0.3, r1: 1.8, color: SOR.sd, life: 0.35, tex: 'shock', op: 0.6 }); sorSmoke(x, 0.6, z, 2, 6);
}
function sorReach(h, dir, dmg) {
  const f = sorF(h), col = SOR_COL[f], deep = SOR_DEEP[f], L = f === 2 ? 12 : 9.5, hw = 1.0, T = 0.55, x0 = h.x, z0 = h.z, sx = Math.sin(dir), cz = Math.cos(dir);
  SFX.at('charge', x0, z0, 0.45); SFX.at('whoosh', x0, z0, 0.4);
  if (FX.near(x0, z0, 60)) { FX.lineDecal(x0, z0, dir, L, hw * 2, col, T); FX.glow(x0 + sx, 3.2, z0 + cz, 2.4, col, T, 'star'); }
  for (let d = 1.2; d < L; d += 2.2) G.dangers.push({ x: x0 + sx * d, z: z0 + cz * d, r: 1.6, team: h.team, until: G.time + T });
  if (f === 2) sorShade(h, x0, z0, dir, T + 0.45);
  after(T, () => {
    if (f !== 2 && !h.alive) return;
    SFX.at('sorreach', x0 + sx * 3, z0 + cz * 3, 1); if (f === 1) SFX.at('quake', x0 + sx * 3, z0 + cz * 3, 0.6);
    for (const e of stripHits(h, x0, z0, dir, L, hw)) {
      damage(h, e, dmg, 0); if (!e.alive) continue;
      if (f === 1) stun(h, e, 1.0, 1.8);
      addBuff(e, { id: 'sorslow', dur: 1.5, slow: 0.7, src: h, every: 0.1, onTick(u, b) { b.slow = 0.7 * Math.max(0.15, b.dur / b.max); } });
      if (FX.near(e.x, e.z, 45)) { FX.hit(e.x, e.height * 0.5, e.z, col, true); akCut(e.x, e.height * 0.6, e.z, 3, dir - HPI + rand(-0.3, 0.3), 1.2 + rand(-0.3, 0.3), 0.2, col, { slit: f !== 2 }); }
    }
    if (!FX.near(x0 + sx * L / 2, z0 + cz * L / 2, 65)) return;
    // the strike itself: blades tear out of the ground one after another all the way down the line
    const N = Math.round(L / 0.95);
    for (let i = 0; i < N; i++) after(i * 0.012, () => { const d = 1 + i * 0.95, side = (i % 2 ? 1 : -1) * 0.22, px = x0 + sx * d + cz * side, pz = z0 + cz * d - sx * side;
      sorSpike(px, pz, (f === 1 ? 3.3 : 2.5) * (0.75 + 0.5 * Math.sin(i * 1.7) * Math.sin(i * 1.7)), f === 1 ? 0.95 : (f === 2 ? 0.5 : 0.7), 0.7, 0.32, dir + (i % 2 ? 0.25 : -0.25), col, f === 2 ? 0x0a1428 : 0x1c0a10);
      if (i % 2 === 0) { FX.sparks(px, 0.4, pz, { n: 5, color: 0xffffff, color2: col, speed: [4, 11], life: [0.15, 0.4], up: 7, w: 0.07 }); if (f !== 2) FX.debris(px, 0.2, pz, { n: 2, color: 0x4a4048, speed: [2, 6], up: 8, size: [0.15, 0.35] }); else sorSmoke(px, 0.5, pz, 2, 2); } });
    FX.beam(x0 + sx * 0.6, z0 + cz * 0.6, x0 + sx * L, z0 + cz * L, { color: col, w: 0.7, life: 0.3, y: 0.25 }); FX.beam(x0 + sx * 0.6, z0 + cz * 0.6, x0 + sx * L, z0 + cz * L, { color: 0xffffff, w: 0.22, life: 0.18, y: 0.3 });
    rfScar(x0 + sx * (L / 2 + 0.3), z0 + cz * (L / 2 + 0.3), L - 0.6, dir, 3.5, col); FX.shock(x0 + sx * 2, z0 + cz * 2, 3.5, 0.9, 0.35); FX.shake(f === 1 ? 0.4 : 0.22); FX.light(x0 + sx * 3, 2, z0 + cz * 3, col, 2.2, 14, 0.3);
    if (f === 1) { FX.ripple(x0 + sx * 2, 1, z0 + cz * 2, 0.7); for (let d = 2; d < L; d += 2.5) FX.flame(x0 + sx * d, 0.4, z0 + cz * d, { n: 3, color: 0xff5a3a, color2: 0x5a0806, size: [0.8, 1.6], life: [0.3, 0.6], up: 4 }); }
  });
}
/* ----- E: the walk through walls ----- */
function sorStepOn(h) {
  const f = sorF(h), col = SOR_COL[f], deep = SOR_DEEP[f];
  h.sorStep = { base: G.time + 1.5, max: G.time + 5, healed: false, heal: D(h, 60, 16, 0.35, 0), tr: 0, f };
  h.ghostT = G.time + 0.3; h.phase = true; sorTint(h, true);
  addBuff(h, { id: 'sorstep', dur: 5.2, ms: f === 2 ? 0.75 : 0.4, src: h });
  const p = h.path && h.path.length ? h.path[h.path.length - 1] : null; if (p && h.order && h.order.type === 'move') setMove(h, p.x, p.z);
  SFX.at('sorstep', h.x, h.z, 0.8);
  if (FX.near(h.x, h.z, 55)) { FX.ring(h.x, h.z, { r0: 2.4, r1: 0.5, color: col, life: 0.3, tex: 'ringThin' }); FX.ring(h.x, h.z, { r0: 0.3, r1: 2.2, color: deep, life: 0.35, tex: 'shock', op: 0.6 }); sorSmoke(h.x, 0.8, h.z, f, 8); dshGhost(h, deep, 0.4, 0.5); }
}
function sorStepOff(h) {
  const S = h.sorStep; if (!S) return; h.sorStep = null; h.ghostT = 0; h.phase = false; sorTint(h, false); const col = SOR_COL[S.f];
  for (const b of h.buffs) if (b.id === 'sorstep') b.dead = true;
  if (!NAV.ok(h.x, h.z)) { const q = NAV.nearest(h.x, h.z); if (FX.near(h.x, h.z, 55)) FX.beam(h.x, h.z, q.x, q.z, { color: col, w: 0.4, life: 0.25, y: 1 }); h.x = q.x; h.z = q.z; }
  const p = h.alive && h.path && h.path.length ? h.path[h.path.length - 1] : null; if (p) { const q = NAV.nearest(p.x, p.z); setMove(h, q.x, q.z); }
  if (FX.near(h.x, h.z, 55)) { FX.ring(h.x, h.z, { r0: 0.4, r1: 2, color: col, life: 0.3, tex: 'ringThin' }); sorSmoke(h.x, 0.8, h.z, S.f, 5); }
}
/* ----- R: possession ----- */
function sorAutoDir(h, t) {
  if (h === G.player && !h.ai && dist(G.mx, G.mz, t.x, t.z) > 0.4) return angTo(t.x, t.z, G.mx, G.mz);
  if (h.hp / h.maxHp < 0.4) { const fb = BASES[h.team].fountain; return angTo(t.x, t.z, fb.x, fb.z); }
  return t.facing;
}
function sorInfest(h, t, dmg) {
  const f = sorF(h), col = SOR_COL[f], deep = SOR_DEEP[f]; let n = 0;
  h.sorIn = { t, in: false, dmg, f, fx: [] }; h.gone = true;   // from the first step of the lunge nothing can be aimed at him
  addBuff(h, { id: 'sorin', dur: 4.5, invuln: true, src: h });
  SFX.at('sorin', h.x, h.z, 0.9); SFX.at('ultcue', h.x, h.z, 0.6);
  if (FX.near(h.x, h.z, 60)) { FX.ring(h.x, h.z, { r0: 0.3, r1: 2.6, color: deep, life: 0.35, tex: 'shock', op: 0.6 }); sorSmoke(h.x, 1, h.z, f, 8); FX.beam(h.x, h.z, t.x, t.z, { color: col, w: 0.5, life: 0.3, y: 1.3 }); }
  dashTo(h, t.x, t.z, 38, { follow: t, stop: 0.2, fly: true, ribbon: col, trail: u => { if (++n % 2 === 0) dshGhost(u, deep, 0.25, 0.45); }, onEnd: u => sorEnter(u) });
}
function sorEnter(h) {
  const I = h.sorIn; if (!I) return; const t = I.t, col = SOR_COL[I.f], deep = SOR_DEEP[I.f];
  if (!h.alive) { h.sorIn = null; return; }
  if (!t.alive) { sorLeave(h, h.x, h.z, false); return; }
  I.in = true; I.until = G.time + 2.5; h.gone = true; h.phase = true; h.dash = null; h.rig.root.visible = false; h.x = t.x; h.z = t.z; h.order = null; h.path = null;
  h.def.abilities[3] = SOR_EXIT; h.cd[3] = 0.4; sorHudIcons(h);
  SFX.at('flesh', t.x, t.z, 0.8); SFX.at('necro', t.x, t.z, 0.5);
  if (t === G.player) { UI.msg('В вас вселился ' + (I.f === 1 ? 'Харрак' : 'Сорен') + ': через 2.5 сек он вырвется'); SFX.play('warn'); }
  if (FX.near(t.x, t.z, 60)) {
    FX.hit(t.x, t.height * 0.55, t.z, col, true); FX.sparks(t.x, 1.3, t.z, { n: 16, color: 0xffffff, color2: col, speed: [4, 12], life: [0.2, 0.4], w: 0.08, ring: true }); FX.text(t.x, t.height + 1.2, t.z, 'ВСЕЛЕНИЕ', SOR_CSS[I.f], 17);
    I.fx.push(FX.aura(t, deep, 2.6, t.radius + 1.0, 'swirl', -7), FX.aura(t, col, 2.6, t.radius + 0.7, 'ringThin', 5), FX.bubble(t, col, 2.6, t.radius + 0.75));
    const tm = new THREE.Mesh(FX.geo.flat, FX.mat('ringThin', col, 0.9, true, true)); I.fx.push(FX.add(tm, 2.5, (k, me) => { const s = (t.radius + 0.5 + 2.8 * (1 - k)) * 2 * RK; me.position.set(t.x, 0.16, t.z); me.scale.set(s, 1, s); me.material.opacity = 0.9; }));   // the ring closes as his time inside runs out
  }
  let acc = 0;
  G.actors.push({ update(dt) {
    if (h.sorIn !== I) return false;
    if (!h.alive) { sorLeave(h, h.x, h.z, false); return false; }
    if (!t.alive) { sorLeave(h, t.x, t.z, false); return false; }
    h.x = t.x; h.z = t.z; h.facing = t.facing;
    if (G.time >= I.until) { const a = sorAutoDir(h, t); sorLeave(h, t.x + Math.sin(a) * 2.6, t.z + Math.cos(a) * 2.6, true); return false; }
    acc += dt; if (acc > 0.16 && FX.near(t.x, t.z, 50)) { acc = 0; akCut(t.x + rand(-0.4, 0.4), rand(0.6, 1.9), t.z + rand(-0.4, 0.4), rand(0.5, 1.1), rand(TAU), rand(-1.4, 1.4), 0.22, col); FX.burst(t.x, 0.3, t.z, { n: 1, color: col, color2: deep, speed: [0.2, 0.6], life: [0.5, 0.8], size: [0.3, 0.03], up: 4, rad: 0.9, ring: true }); }
    return true;
  } });
}
function sorLeave(h, ex, ez, strike) {
  const I = h.sorIn; if (!I) return; h.sorIn = null; const t = I.t, f = I.f, col = SOR_COL[f], deep = SOR_DEEP[f];
  h.gone = false; h.phase = false; h.rig.root.visible = h.alive; for (const b of h.buffs) if (b.id === 'sorin') b.dead = true; for (const e of I.fx) if (e) e.dead = true;
  const R = SOR_KITS[sorF(h)][3]; h.def.abilities[3] = R; h.cd[3] = R.cd * 100 / (100 + h.haste); sorHudIcons(h);
  if (!h.alive) return;
  const q = NAV.nearest(ex, ez), tx = t.x, tz = t.z; h.x = q.x; h.z = q.z; h.path = null; h.order = null; h.facing = angTo(h.x, h.z, tx, tz); h.atkCd = 0; h.rig.root.position.set(h.x, 0, h.z); h.rig.root.rotation.y = h.facing;
  h.anim.castT = h.anim.castDur = 0.36; h.anim.castType = 'mow';
  if (!strike || !t.alive) { if (FX.near(h.x, h.z, 55)) { sorSmoke(h.x, 1, h.z, f, 8); FX.ring(h.x, h.z, { r0: 0.3, r1: 2, color: col, life: 0.3, tex: 'ringThin' }); } return; }
  if (f === 2) { h.sorEdgeT = 0; h.sorEdgeCd = 0; }
  let d = I.dmg; if (f === 1) d = I.dmg * 0.6 + t.maxHp * 0.13;
  damage(h, t, d, 0); if (f === 1) heal(h, h, h.maxHp * 0.1);
  SFX.at('sorout', tx, tz, 1); SFX.at('bigcut', tx, tz, 0.7);
  if (!FX.near(tx, tz, 65)) return;
  const a = angTo(tx, tz, h.x, h.z), ty = t.height * 0.55;
  for (let i = 0; i < 3; i++) akCut(tx, ty, tz, 4.4, a - HPI + (i - 1) * 0.9, 0.5 * (i - 1) + rand(-0.2, 0.2), 0.24, col, { slit: true });
  FX.beam(tx, tz, h.x, h.z, { color: col, w: 0.9, life: 0.25, y: 1.3 }); for (let i = 1; i <= 2; i++) twGhost(h.rig, deep, 0.35, 0.4, lerp(tx, h.x, i / 3), lerp(tz, h.z, i / 3));
  FX.ring(tx, tz, { r0: 0.4, r1: 4.2, color: col, life: 0.4, tex: 'ringThin' }); FX.ring(tx, tz, { r0: 0.3, r1: 3, color: deep, life: 0.4, tex: 'shock', op: 0.5 }); FX.shock(tx, tz, 4.5, 1.1, 0.35);
  FX.ripple(tx, ty, tz, 1.3); FX.hitstop(0.08); FX.shake(0.45); FX.punch(0.6); FX.light(tx, 2, tz, col, 2.8, 16, 0.35); FX.glow(tx, ty, tz, 5, col, 0.22, 'flare');
  FX.sparks(tx, ty, tz, { n: 30, color: 0xffffff, color2: col, speed: [7, 18], life: [0.2, 0.5], w: 0.1, dir: a, spread: 1.6 }); sorSmoke(tx, 1, tz, f, 10);
  if (f === 1) { FX.burst(tx, ty, tz, { n: 16, color: 0xff5040, color2: 0x5a0806, speed: [3, 10], life: [0.3, 0.7], size: [0.45, 0.06], grav: -14 }); FX.beam(tx, tz, h.x, h.z, { color: 0xff8a70, w: 0.35, life: 0.5, y: 1.6 }); FX.heal(h, SOR.d); }
  FX.text(tx, t.height + 1.2, tz, f === 1 ? 'ПОЖРАН' : 'ВЫРВАЛСЯ', SOR_CSS[f], 18);
}
/* ----- how a bot plays him ----- */
function sorQAI(h, mode, tgt) {
  if (h.sorIn || h.sorChanging) return null;
  if (mode !== 'retreat' && tgt && udist(h, tgt) < 7) return { x: tgt.x, z: tgt.z };
  if (mode === 'lane' && h.mana / h.maxMana > 0.55) { const m = farmPoint(h, 6, 3); if (m) return { x: m.x, z: m.z }; }
  return null;
}
function sorStepAI(h, mode, tgt, nf) {
  if (h.sorIn || h.sorStep || h.sorChanging) return null; const hp = h.hp / h.maxHp;
  if (mode === 'retreat' && nf && udist(h, nf) < 10 && hp < 0.55) return { x: h.x, z: h.z };
  if (mode === 'fight' && tgt && tgt.kind === 'hero') { const d = udist(h, tgt); if (d > h.range + 2.5 && d < 16 && tgt.hp / tgt.maxHp < 0.65) return { x: h.x, z: h.z }; }
  return null;
}
function sorUltAI(h, mode, tgt, nf, ab) {
  if (h.sorIn || h.sorChanging || !tgt || tgt.kind !== 'hero' || mode === 'jungle') return null;
  if (udist(h, tgt) > ab.range + tgt.radius || G.time - (tgt.dmgBy[h.id] || -99) > 3.2) return null;
  return tgt.hp / tgt.maxHp < 0.6 || h.hp / h.maxHp < 0.3 ? { x: tgt.x, z: tgt.z, unit: tgt } : null;
}
function sorExitAI(h) {
  const I = h.sorIn; if (!I || !I.in) return null; const t = I.t, est = (I.f === 1 ? I.dmg * 0.6 + t.maxHp * 0.13 : I.dmg) * 100 / (100 + Math.max(0, t.arm)) * (DMG_K.soren || 1);
  if (est < t.hp + t.shield && G.time < I.until - 0.2) return null; const a = sorAutoDir(h, t); return { x: t.x + Math.sin(a) * 2.6, z: t.z + Math.cos(a) * 2.6 };
}
/* ----- the kits: one per state ----- */
const SOR_EXIT = {
  key: 'R', name: 'Вырваться', icon: 'sorexit', cd: 1, cost: 0, range: 3.4, noReach: true, ind: { type: 'circle', r: 1.2 }, anim: 'cast', animDur: 0.01, lock: 0, noCue: true, free: () => true, active: () => true, ai: { t: 'fn', fn: sorExitAI },
  desc: 'Сорен внутри врага. Нажмите ещё раз — он вырвется наружу в сторону курсора и нанесёт урон. Если не нажать, вырвется сам, когда выйдет время.',
  cast(h, p) { const I = h.sorIn; if (!I || !I.in) return false; const t = I.t, a = p.dist > 0.3 ? p.dir : sorAutoDir(h, t), R = SOR_KITS[sorF(h)][3]; sorLeave(h, t.x + Math.sin(a) * 2.6, t.z + Math.cos(a) * 2.6, true); return { cd: R.cd * 100 / (100 + h.haste) }; }
};
function sorKit(f) {
  const base = f === 0, D1 = f === 1, S2 = f === 2;
  return [
    {
      key: 'Q', name: 'Жатва', icon: 'sorq', cd: 7, cost: 45, range: 4.5, noReach: true, ind: { type: 'line', w: 1.8, fixed: true }, anim: 'sordash', animDur: 0.28, lock: 0, ai: { t: 'fn', fn: sorQAI },
      desc: 'Сорен рывком проносится вперёд (на 4.5), задевая врагов на пути, и в конце описывает косой круг радиусом 3.3. И рывок, и круг наносят физический урон — враг, попавший под оба, получает его дважды.'
        + (base ? ' <b>Харрак:</b> каждый удар добавляет 3% максимального здоровья цели. <b>Тень:</b> без изменений.' : (D1 ? ' Харрак: каждый удар добавляет 3% максимального здоровья цели (по миньонам и чудовищам — не больше 50).' : '')),
      cast(h, p) { if (h.sorIn || h.sorChanging) return false; sorReap(h, p.dir, D(h, 35, 10, 0.5, 0)); }
    },
    {
      key: 'W', name: 'Длинная рука', icon: 'sorw', cd: 12, cost: 60, range: S2 ? 12 : 9.5, noReach: true, ind: { type: 'line', w: 2, fixed: true }, anim: S2 ? 'cast' : 'sorreach', animDur: S2 ? 0.01 : 0.92, lock: S2 ? 0 : 0.72, ai: { t: 'shot', sp: 18, farm: true },
      desc: (S2 ? 'На месте Сорена остаётся его тень: через 0.55 сек она обрушивает косу, и из земли вдоль линии длиной 12 вырываются лезвия. Сам он при этом свободен — может идти и бить.' : 'Сорен заносит косу и через 0.55 сек обрушивает её: из земли вдоль линии длиной 9.5 вырываются лезвия.')
        + ' Все враги на линии получают физический урон и замедляются на 70% (замедление сходит на нет за 1.5 сек).'
        + (base ? ' <b>Харрак:</b> ещё и подбрасывает врагов на 1 сек. <b>Тень:</b> удар наносит тень, оставленная на месте, линия длиннее (12), а Сорен не останавливается.' : (D1 ? ' Харрак: удар ещё и подбрасывает врагов на 1 сек.' : '')),
      cast(h, p) { if (h.sorIn || h.sorChanging) return false; sorReach(h, p.dir, D(h, 70, 22, 0.95, 0)); }
    },
    {
      key: 'E', name: 'Шаг сквозь тень', icon: 'sore', cd: S2 ? 11 : 16, cost: 60, range: 0, ind: { type: 'self', r: 2 }, anim: 'cast', animDur: 0.01, lock: 0, noCue: true, ai: { t: 'fn', fn: sorStepAI }, active: h => !!h.sorStep,
      desc: 'На 1.5 сек Сорен становится тенью: бегает на ' + (S2 ? '75' : '40') + '% быстрее, проходит сквозь других и <b>сквозь стены, скалы и обрывы</b>. Пока он внутри преграды, действие не кончается (но не дольше 5 сек всего). Первый раз войдя в преграду, он восстанавливает здоровье. Оглушение и обездвиживание обрывают шаг; если он кончился внутри стены, Сорена вытолкнет на ближайшее свободное место.'
        + (base ? ' <b>Харрак:</b> без изменений. <b>Тень:</b> скорость +75%, замедления не действуют, перезарядка 11 сек.' : (S2 ? ' Тень: замедления на него в это время не действуют.' : '')),
      cast(h) { if (h.sorIn || h.sorChanging || h.sorStep) return false; sorStepOn(h); }
    },
    {
      key: 'R', name: 'Вселение', icon: 'sorr', cd: 100, cost: 100, range: S2 ? 9.5 : 7, ind: { type: 'target', hero: true }, anim: 'sordash', animDur: 0.3, lock: 0, ai: { t: 'fn', fn: sorUltAI, ult: true, hp: 0.6 },
      desc: 'Только по вражескому герою, которого Сорен ранил за последние 3.5 сек (дальность ' + (S2 ? '9.5' : '7') + '). Он бросается к цели и исчезает в её теле на 2.5 сек: его нельзя ни ранить, ни выбрать целью, он движется вместе с жертвой. Повторное нажатие — вырваться раньше, в сторону курсора. Вырываясь, он наносит жертве большой физический урон.'
        + (base ? ' <b>Харрак:</b> урон считается от максимального здоровья жертвы (13%), а сам он восстанавливает 10% своего здоровья. <b>Тень:</b> дальность 9.5, а «Удар из тени» сразу готов снова.' : (D1 ? ' Харрак: к урону добавляется 13% максимального здоровья жертвы, а сам он восстанавливает 10% своего здоровья.' : ' Тень: «Удар из тени» после этого сразу готов снова.')),
      cast(h, p) {
        const t = p.unit; if (h.sorIn || h.sorChanging || !t || t.kind !== 'hero') return false;
        if (G.time - (t.dmgBy[h.id] || -99) > 3.5) { if (h === G.player && !h.ai) { UI.msg('Сначала раньте эту цель: коса должна попробовать её кровь'); SFX.play('deny'); } return false; }
        if (h.sorStep) sorStepOff(h);
        sorInfest(h, t, D(h, 120, 45, 1.0, 0)); return { cd: 1 };
      }
    }
  ];
}
const SOR_KITS = [sorKit(0), sorKit(1), sorKit(2)];
const SOR_INN = [
  { name: 'Два голода', icon: 'sorinn', desc: 'В Сорене двое: Харрак — тварь из косы — и его собственная тень. Раны, которые он наносит героям ближнего боя, кормят Харрака; раны стрелкам и магам кормят Тень (понемногу растут обе меры и сами). Когда меры вместе заполнят шкалу, та сторона, что набрала больше, готова забрать тело: над панелью умений появятся кнопки. Вторая форма откроется через 1.5 мин. Выбор — на весь матч.<br><b>Харрак:</b> умения лечат его на 27% урона, нанесённого героям.<br><b>Тень:</b> первые 3 сек боя с героями весь его урон по ним усилен магическим (от 14% до 45% с уровнем); 8 сек вне боя — и удар готов снова.', count: h => h.sorReady ? '!' : Math.floor(Math.min(99, h.sorE[0] + h.sorE[1])) + '%' },
  { name: 'Харрак', icon: 'sorf1', desc: 'Коса победила. Умения Харрака лечат его на 27% урона, который они наносят вражеским героям. «Жатва» бьёт от здоровья цели, «Длинная рука» подбрасывает, «Вселение» пожирает жертву и лечит.', count: () => '' },
  { name: 'Удар из тени', icon: 'sorf2', desc: 'Сорен победил. Первые 3 сек боя с вражескими героями весь его урон по ним усилен магическим: от 14% на первом уровне до 45% на пятнадцатом. Удар готов снова после 8 сек без боя с героями — или сразу после «Вселения».', count: h => G.time < h.sorEdgeT ? (h.sorEdgeT - G.time).toFixed(1) : (h.sorEdgeCd ? '' : '★') }
];

/* ==================================================================== 78. SIGURE ==================================================================== */
const SGR = { c: 0xff2a3a, deep: 0x8a0a16, steel: 0xcfd6e2, pale: 0xffd0d4, sdk: 0x6a7488 };
const SGR_LOOK = { bulk: 0.97, h: 1.05, scale: 1.08, c1: 0x4a556e, c2: 0x1c1e2c, c3: 0x14141c, skin: 0xe2c6ae, hands: 0xe2c6ae, cuff: 0xd8d2c4, metal: 0x8a8c96, glow: SGR.c, head: 'sigure', hair: 0x1a1c34, shirt: 0xe8e4dc, chest: 'ronin', legs: 'hakama', sh: 'ronin', weapon: 'twinsoul', wc: 'dual' };
const sgrAs = h => h.def.stats.as / Math.max(0.2, h.as);   // his cooldowns shrink with attack speed, not with ability haste
const sgrStacks = h => (h.sgSt && G.time < h.sgSt.until ? h.sgSt.n : 0);
function sgrSpirit(h, on) { const m = h.rig.mats[0]; m.transparent = on; m.opacity = on ? 0.62 : 1; m.color.setHex(on ? 0xff9aa2 : 0xffffff); m.depthWrite = !on; m.needsUpdate = true; }
// a strike of his own: one roll of the dice for a crit, the item effects of an attack on top
function sgrHit(h, e, d, type) { const crit = type === 0 && h.crit > 0 && Math.random() < h.crit; return damage(h, e, d * (crit ? (h.critK || 1.75) : 1), type, { crit }); }
/* ----- Q ----- */
function sgrThrust(h, dir, dmg) {
  const L = 5.5, sx = Math.sin(dir), cz = Math.cos(dir), x0 = h.x, z0 = h.z; let any = false;
  for (const e of stripHits(h, x0, z0, dir, L, 0.8)) {
    any = true; sgrHit(h, e, dmg, 0); if (e.alive && h.onhit) damage(h, e, h.onhit, 1, { dot: true });
    if (FX.near(e.x, e.z, 45)) { FX.hit(e.x, e.height * 0.55, e.z, SGR.steel, false); akCut(e.x, e.height * 0.55, e.z, 2.2, dir - HPI, rand(-0.25, 0.25), 0.14, SGR.steel); FX.sparks(e.x, 1.3, e.z, { n: 6, color: 0xffffff, color2: SGR.steel, speed: [5, 12], life: [0.12, 0.28], w: 0.06, dir, spread: 0.5 }); }
  }
  SFX.at('sgthrust', x0, z0, 0.75);
  if (any) {
    const n = Math.min(2, sgrStacks(h) + 1); h.sgSt = { n, until: G.time + 6 };
    if (n === 2) { SFX.at('gust', h.x, h.z, 0.45); if (FX.near(h.x, h.z, 50)) { FX.ring(h.x, h.z, { r0: 2.2, r1: 0.5, color: SGR.steel, life: 0.3, tex: 'swirl', spin: 9, op: 0.7 }); FX.text(h.x, h.height + 0.9, h.z, 'вихрь готов', '#e8eef6', 13); } }
  }
  if (!FX.near(x0, z0, 55)) return;
  FX.beam(x0 + sx * 0.8, z0 + cz * 0.8, x0 + sx * L, z0 + cz * L, { color: SGR.steel, w: 0.5, life: 0.16, y: 1.3 }); FX.beam(x0 + sx * 0.8, z0 + cz * 0.8, x0 + sx * (L + 0.4), z0 + cz * (L + 0.4), { color: 0xffffff, w: 0.16, life: 0.1, y: 1.32 });
  FX.glow(x0 + sx * L, 1.3, z0 + cz * L, 1.6, SGR.steel, 0.14, 'star'); FX.sparks(x0 + sx * 1.2, 1.3, z0 + cz * 1.2, { n: 5, color: 0xffffff, color2: SGR.sdk, speed: [8, 16], life: [0.08, 0.2], w: 0.05, dir, spread: 0.2 });
}
// the third thrust: a rush forward inside a whirlwind that throws everyone it touches into the air
function sgrGale(h, dir, dmg) {
  const L = 5.5, x0 = h.x, z0 = h.z; h.sgSt = null; let n = 0;
  SFX.at('sggale', x0, z0, 0.9); SFX.at('sgthrust', x0, z0, 0.6);
  after(0, () => { if (h.alive && h.dash) { h.anim.castT = h.anim.castDur = 0.3; h.anim.castType = 'sgdash'; } });
  if (FX.near(x0, z0, 60)) {
    const g = new THREE.Group(), rings = [];
    for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(FX.geo.flat, FX.mat('swirl', i % 2 ? SGR.deep : 0x6f80a2, 0.5)); m.userData.own = true; m.position.y = 0.3 + i * 0.6; m.userData.r = 0.8 + i * 0.32; m.rotation.y = i * 1.3; g.add(m); rings.push(m); }
    FX.add(g, 0.75, (k, me, dt) => { if (h.dash && h.alive) me.position.set(h.x + Math.sin(dir) * 0.9, 0, h.z + Math.cos(dir) * 0.9); const a = Math.min(1, k * 10) * (1 - k * k); for (const m of rings) { const s = m.userData.r * 2 * RK * (0.7 + 0.5 * k); m.scale.set(s, 1, s); m.rotation.y -= (dt || 0) * 22; m.material.opacity = 0.5 * a; } });
  }
  dashTo(h, h.x + Math.sin(dir) * L, h.z + Math.cos(dir) * L, 30, {
    w: 1.7, ribbon: SGR.steel,
    trail: u => { if (!FX.near(u.x, u.z, 50)) return; if (++n % 2 === 0) dshGhost(u, SGR.sdk, 0.22, 0.35); FX.sparks(u.x, rand(0.4, 2.2), u.z, { n: 2, color: 0xffffff, color2: SGR.steel, speed: [3, 8], life: [0.15, 0.35], w: 0.05, ring: true }); FX.burst(u.x, 0.3, u.z, { smoke: true, n: 1, color: 0xb8b4ac, color2: 0x4a4640, speed: [0.5, 2], life: [0.3, 0.6], size: [0.6, 1.3], a: 0.3 }); },
    onHit: e => {
      if (e.struct) return; sgrHit(h, e, dmg, 0); if (e.alive && h.onhit) damage(h, e, h.onhit, 1, { dot: true }); if (e.alive) stun(h, e, 0.75, 1.5);
      SFX.at('katana', e.x, e.z, 0.5); if (FX.near(e.x, e.z, 45)) { FX.hit(e.x, e.height * 0.55, e.z, SGR.steel, true); akCut(e.x, e.height * 0.6, e.z, 2.8, dir - HPI, 0.6, 0.18, SGR.steel); FX.pillar(e.x, e.z, { r: 0.8, h: 5, color: SGR.sdk, life: 0.45, op: 0.4 }); }
    },
    onEnd: u => { if (!FX.near(u.x, u.z, 55)) return; rfWave(u.x, u.z, dir, 3.4, 1.0, 0.24, 1.2, SGR.steel); FX.ring(u.x, u.z, { r0: 0.4, r1: 2.6, color: SGR.steel, life: 0.3, tex: 'ringThin' }); rfScar((x0 + u.x) / 2, (z0 + u.z) / 2, dist(x0, z0, u.x, u.z), dir, 1.8, SGR.steel); }
  });
}
/* ----- W ----- */
function sgrCleave(h, dir, base, pct, sh) {
  const R = 6.5, half = 0.7;
  SFX.at('whoosh', h.x, h.z, 0.5);
  after(0.13, () => {
    if (!h.alive) return; let n = 0, heroes = 0;
    for (const e of enemiesIn(h, h.x, h.z, R + 0.4)) {
      if (e.struct || !inCone(h, e, dir, half, R)) continue; n++; if (e.kind === 'hero') heroes++;
      const tot = base + Math.min(e.maxHp * pct, e.kind === 'hero' ? 1e9 : 40 + 12 * h.level);
      damage(h, e, tot / 2, 0); if (e.alive) damage(h, e, tot / 2, 1, { dot: true });
      if (FX.near(e.x, e.z, 45)) { FX.hit(e.x, e.height * 0.55, e.z, SGR.c, false); akCut(e.x, e.height * 0.62, e.z, 2.4, dir + rand(-0.4, 0.4), 0.25, 0.16, SGR.steel); akCut(e.x, e.height * 0.48, e.z, 2.4, dir + rand(-0.4, 0.4), -0.25, 0.2, SGR.c); }
    }
    SFX.at('sgcleave', h.x, h.z, 0.85);
    if (n) { const b = shield(h, h, sh * (heroes ? 2 + 0.25 * (heroes - 1) : 1), 1.5, SGR.c); if (b && FX.near(h.x, h.z, 50)) FX.ring(h.x, h.z, { r0: 2.2, r1: 1.0, color: SGR.pale, life: 0.25, tex: 'ringThin' }); }
    if (!FX.near(h.x, h.z, 55)) return;
    rfWave(h.x, h.z, dir, R, half, 0.2, 1.35, SGR.steel); after(0.05, () => rfWave(h.x, h.z, dir, R + 0.3, half * 0.92, 0.26, 0.95, SGR.c, SGR.pale));
    FX.slash(h.x, h.z, dir, { r: 3.4, color: SGR.c, sweep: 1.7, life: 0.22, y: 1.1 });
    FX.sparks(h.x + Math.sin(dir) * 2, 1.2, h.z + Math.cos(dir) * 2, { n: 16, color: 0xffffff, color2: SGR.c, speed: [7, 15], life: [0.12, 0.3], w: 0.07, dir, spread: half });
    for (const s of [-1, 1]) rfScar(h.x + Math.sin(dir + s * half * 0.6) * 3.4, h.z + Math.cos(dir + s * half * 0.6) * 3.4, 4.4, dir + s * half * 0.6, 1.6, s < 0 ? SGR.steel : SGR.c);
    FX.light(h.x + Math.sin(dir) * 2, 1.6, h.z + Math.cos(dir) * 2, SGR.c, 1.6, 10, 0.2);
  });
}
/* ----- E: the soul leaves the body ----- */
function sgrSoul(h, dir) {
  const x0 = h.x, z0 = h.z, lv = Math.max(1, h.al[2]), T = 5;
  if (!h.sgBodyRig) { h.sgBodyRig = buildHero(SGR_LOOK, h.isPlayer ? 0xeaffea : TEAM_COL[h.team]); h.sgBodyRig.ring.visible = false; if (h.sgBodyRig.sblade) h.sgBodyRig.sblade.visible = false; }
  const br = h.sgBodyRig, pu = rfPuppet(br, dir, 'sgkneel', 1e9), S = { t0: G.time, until: G.time + T, bx: x0, bz: z0, dmg: {}, mk: {}, pct: 0.25 + 0.033 * (lv - 1), gt: 0 };
  br.root.rotation.y = dir; br.root.position.set(x0, 0, z0);
  S.body = FX.add(br.root, 1e6, (k, me, dt) => { me.position.set(x0, 0, z0); pu.anim.castT = pu.anim.castDur = 1e9; animHero(pu, dt || 0.001); me.position.y = 0; });
  // the thread between the body and the spirit
  const th = new THREE.Mesh(FX.geo.line, FX.mat('beam', SGR.c, 0.7)); S.thread = FX.add(th, 1e6, (k, me) => { me.position.set(x0, 1.0, z0); me.rotation.y = angTo(x0, z0, h.x, h.z); me.scale.set(0.16 + Math.sin(G.time * 14) * 0.04, 1, Math.max(0.01, dist(x0, z0, h.x, h.z))); me.material.opacity = 0.55 + Math.sin(G.time * 9) * 0.15; });
  S.ring = FX.zone(x0, z0, 1.5, SGR.deep, T + 1, { tex: 'ringThin', spin: 2, op: 0.8 });
  h.soul = S; h.soulT = S.until; sgrSpirit(h, true);
  addBuff(h, { id: 'sgsoul', dur: T + 0.3, ms: 0.1, src: h, every: 0.2, onTick(u, b) { b.ms = 0.1 + 0.2 * Math.min(1, (G.time - S.t0) / 3.5); } });
  SFX.at('sgsoul', x0, z0, 0.9);
  if (FX.near(x0, z0, 60)) { FX.ring(x0, z0, { r0: 0.4, r1: 3, color: SGR.c, life: 0.4, tex: 'ringThin' }); FX.ring(x0, z0, { r0: 0.3, r1: 2.4, color: SGR.deep, life: 0.4, tex: 'shock', op: 0.5 }); FX.sparks(x0, 1.3, z0, { n: 14, color: SGR.pale, color2: SGR.c, speed: [2, 7], life: [0.3, 0.6], up: 4, w: 0.07, ring: true }); FX.glow(x0, 1.4, z0, 3.5, SGR.c, 0.3, 'star'); }
  dashTo(h, x0 + Math.sin(dir) * 3.5, z0 + Math.cos(dir) * 3.5, 26, { ribbon: SGR.c });
  G.actors.push({ update(dt) {
    if (h.soul !== S) return false;
    if (!h.alive) { sgrSoulEnd(h, S); h.cd[2] = h.def.abilities[2].cd * 100 / (100 + h.haste); return false; }
    if (G.time >= S.until || (h.ai && G.time > S.t0 + 0.6 && h.hp / h.maxHp < 0.36)) { sgrReturn(h); return false; }
    S.gt += dt; if (S.gt > 0.13 && FX.near(h.x, h.z, 50)) { S.gt = 0; if (h.moving || h.dash) dshGhost(h, SGR.deep, 0.3, 0.3); FX.burst(h.x, rand(0.4, 2), h.z, { n: 1, color: SGR.pale, color2: SGR.c, speed: [0.2, 0.8], life: [0.4, 0.7], size: [0.22, 0.02], up: 1.5, rad: 0.5 }); }
    return true;
  } });
}
function sgrSoulEnd(h, S) {
  if (h.soul === S) h.soul = null; h.soulT = 0; sgrSpirit(h, false); S.body.dead = true; S.thread.dead = true; if (S.ring) S.ring.dead = true;
  for (const id in S.mk) if (S.mk[id]) S.mk[id].dead = true; for (const b of h.buffs) if (b.id === 'sgsoul') b.dead = true;
}
// a wound that will open again: a red star over the head of everyone the spirit has cut, growing with what he has dealt
function sgrMark(h, t) {
  const S = h.soul; if (!S || S.mk[t.id] || !FX.near(t.x, t.z, 60)) return;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.star, color: SGR.c, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  S.mk[t.id] = FX.add(sp, 1e6, (k, me, dt, en) => { if (!t.alive) { en.dead = true; return; } const s = 0.7 + Math.min(1.4, (S.dmg[t.id] || 0) / (t.maxHp * 0.3)) + Math.sin(G.time * 10) * 0.08; me.position.set(t.x, t.height + 1.0 + (t.yOff || 0), t.z); me.scale.set(s, s, 1); me.material.rotation = G.time * 2; });
}
function sgrReturn(h) {
  const S = h.soul; if (!S) return; const x1 = h.x, z1 = h.z, pct = S.pct, list = [];
  for (const id in S.dmg) { const t = G.units.find(u => u.id === +id); if (t && t.alive && S.dmg[id] > 0) list.push([t, S.dmg[id] * pct]); }
  sgrSoulEnd(h, S); h.cd[2] = h.def.abilities[2].cd * 100 / (100 + h.haste);
  // he cannot be stopped on the way back
  for (const b of h.buffs) if (b.stun || b.root) b.dead = true; h.stunned = false; h.rooted = false; h.forced = null; h.castLock = 0; h.windup = 0; h.order = null; h.path = null;
  const d = dist(x1, z1, S.bx, S.bz); addBuff(h, { id: 'sgback', dur: d / 62 + 0.12, invuln: true, src: h });
  SFX.at('sgback', x1, z1, 0.9);
  if (FX.near(x1, z1, 60)) { FX.beam(x1, z1, S.bx, S.bz, { color: SGR.c, w: 0.7, life: 0.3, y: 1.2 }); FX.ring(x1, z1, { r0: 0.3, r1: 2, color: SGR.c, life: 0.3, tex: 'ringThin' }); for (let i = 1; i <= 3; i++) twGhost(h.rig, SGR.deep, 0.3, 0.35, lerp(x1, S.bx, i / 4), lerp(z1, S.bz, i / 4)); }
  const land = () => {
    h.gone = false;
    if (FX.near(S.bx, S.bz, 60)) { FX.ring(S.bx, S.bz, { r0: 2.6, r1: 0.5, color: SGR.c, life: 0.28, tex: 'ringThin' }); FX.glow(S.bx, 1.4, S.bz, 3, SGR.pale, 0.2, 'star'); FX.sparks(S.bx, 1.3, S.bz, { n: 12, color: 0xffffff, color2: SGR.c, speed: [3, 9], life: [0.2, 0.4], w: 0.07, ring: true }); }
    if (!h.alive) return;
    list.forEach(([t, amt], i) => after(0.04 + i * 0.05, () => {
      if (!t.alive) return; damage(h, t, amt, 2, { raw: true, sgEcho: true }); SFX.at('bigcut', t.x, t.z, 0.6);
      if (!FX.near(t.x, t.z, 55)) return;
      for (let j = 0; j < 3; j++) akCut(t.x, t.height * 0.55, t.z, 3.2, rand(TAU), rand(-0.9, 0.9), 0.22, SGR.c, { slit: j === 0 });
      FX.beam(t.x, t.z, S.bx, S.bz, { color: SGR.c, w: 0.25, life: 0.3, y: 1.2 }); FX.hit(t.x, t.height * 0.55, t.z, SGR.c, true); FX.text(t.x, t.height + 1.1, t.z, 'эхо', '#ff8a94', 15);
      FX.sparks(t.x, 1.3, t.z, { n: 14, color: 0xffffff, color2: SGR.c, speed: [5, 13], life: [0.15, 0.4], w: 0.08, ring: true }); if (i === 0) { FX.hitstop(0.05); FX.shake(0.25); }
    }));
  };
  if (d < 0.6) { h.x = S.bx; h.z = S.bz; land(); } else { h.gone = true; h.sgBack = land; dashTo(h, S.bx, S.bz, 62, { fly: true, ribbon: SGR.c }); }   // the landing is called from tick, so it happens even if the dash is cut short
}
// a bot leaves his body before he commits to a fight, and goes back to it the moment the fight turns: the body is his way out
function sgrSoulAI(h, mode, tgt) {
  if (h.soul) return mode === 'retreat' && G.time > h.soul.t0 + 0.5 ? { x: h.x, z: h.z } : null;
  if (mode !== 'fight' || !tgt || tgt.kind !== 'hero') return null;
  return udist(h, tgt) < 7.5 && h.hp / h.maxHp > 0.35 ? { x: tgt.x, z: tgt.z } : null;
}
// the seal carries him deep behind the enemy: he uses it as a spirit (the body pulls him back), or to finish someone, or when the soul is not to be had
function sgrSealAI(h, mode, tgt) {
  if (mode !== 'fight' || !tgt || tgt.kind !== 'hero' || udist(h, tgt) > 10.5) return null;
  if (!(h.soul || tgt.hp / tgt.maxHp < 0.35 || !h.al[2] || h.cd[2] > 3)) return null;
  return aimAt(h, tgt, 0.6, h.ai.d);
}
/* ----- R: fate sealed ----- */
function sgrSeal(h, dir, dmg) {
  const L = 12, hw = 1.25, T = 0.75, x0 = h.x, z0 = h.z, sx = Math.sin(dir), cz = Math.cos(dir);
  SFX.at('ultcue', x0, z0, 0.7); SFX.at('sgcharge', x0, z0, 0.8);
  for (let d = 1.2; d < L; d += 2.2) G.dangers.push({ x: x0 + sx * d, z: z0 + cz * d, r: 1.8, team: h.team, until: G.time + T });
  if (FX.near(x0, z0, 65)) {
    FX.lineDecal(x0, z0, dir, L, hw * 2, SGR.c, T); FX.text(x0, h.height + 1.3, z0, 'Печать судьбы', '#ff8a94', 18); FX.zone(x0, z0, 2.4, SGR.deep, T, { tex: 'swirl', spin: -9, op: 0.8 });
    let acc = 0; FX.add(new THREE.Group(), T, (k, me, dt) => { acc += dt; if (acc < 0.05) return; acc = 0; FX.implode(x0, 1.3, z0, 3.5, { n: 4, color: SGR.c, color2: SGR.deep, life: 0.3, streak: true }); });
    FX.light(x0, 2, z0, SGR.c, 1.8, 12, T);
  }
  after(T, () => {
    if (!h.alive) return;
    const hits = stripHits(h, x0, z0, dir, L, hw), al = e => (e.x - x0) * sx + (e.z - z0) * cz; let last = null;
    for (const e of hits) if (e.kind === 'hero' && (!last || al(e) > al(last))) last = e;
    const far = last ? Math.min(L + 1.5, al(last) + 2.2) : L, q = NAV.nearest(x0 + sx * far, z0 + cz * far), px = q.x - sx * 1.9, pz = q.z - cz * 1.9;
    for (const e of hits) {
      damage(h, e, dmg, 0); if (e.alive) damage(h, e, dmg, 1, { dot: true }); if (!e.alive) continue;
      stun(h, e, 0.75, 1.7); pullTo(e, px, pz, 26, 0.5);
      if (FX.near(e.x, e.z, 50)) { FX.hit(e.x, e.height * 0.55, e.z, SGR.c, true); akCut(e.x, e.height * 0.6, e.z, 3.6, dir - HPI, 0.9, 0.24, SGR.c, { slit: true }); akCut(e.x, e.height * 0.5, e.z, 3.2, dir - HPI, -0.8, 0.2, SGR.steel); FX.pillar(e.x, e.z, { r: 0.9, h: 6, color: SGR.deep, life: 0.5, op: 0.45 }); }
    }
    if (FX.near(x0, z0, 65)) for (let i = 0; i <= 4; i++) twGhost(h.rig, i % 2 ? SGR.deep : SGR.sdk, 0.5, 0.42, lerp(x0, q.x, i / 5), lerp(z0, q.z, i / 5));
    h.x = q.x; h.z = q.z; h.path = null; h.order = null; h.facing = dir + Math.PI; h.rig.root.rotation.y = h.facing; h.castLock = 0.12; h.atkCd = 0;
    SFX.at('sgseal', x0 + sx * far / 2, z0 + cz * far / 2, 1); SFX.at('bigcut', q.x, q.z, 0.7);
    const mx = x0 + sx * far / 2, mz = z0 + cz * far / 2; if (!FX.near(mx, mz, 70)) return;
    FX.beam(x0, z0, q.x, q.z, { color: SGR.c, w: 1.5, life: 0.34, y: 1.2 }); FX.beam(x0, z0, q.x, q.z, { color: 0xffffff, w: 0.4, life: 0.2, y: 1.25 }); FX.beam(x0, z0, q.x, q.z, { color: SGR.deep, w: 2.6, life: 0.5, y: 0.2, op: 0.5 });
    rfScar(mx, mz, far, dir, 4, SGR.c); for (let d = 1.5; d < far; d += 1.6) { FX.sparks(x0 + sx * d, 1.2, z0 + cz * d, { n: 5, color: 0xffffff, color2: SGR.c, speed: [4, 11], life: [0.2, 0.5], w: 0.08, up: 4 }); if (d % 3.2 < 1.6) akCut(x0 + sx * d, 1.4, z0 + cz * d, 2.6, dir + rand(-0.5, 0.5), rand(-1, 1), 0.2, d % 6.4 < 3.2 ? SGR.c : SGR.steel); }
    FX.ripple(mx, 1.2, mz, 1.6); FX.hitstop(0.09); FX.shake(0.55); FX.punch(0.7); FX.light(mx, 3, mz, SGR.c, 3, 22, 0.4);
    FX.ring(q.x, q.z, { r0: 0.4, r1: 4, color: SGR.c, life: 0.4, tex: 'ringThin' }); FX.shock(q.x, q.z, 4, 1, 0.35); rfWave(q.x, q.z, dir + Math.PI, 4.5, 1.1, 0.3, 1.1, SGR.c, SGR.pale);
  });
}

HEROES.push(
  /* ================= 77. Soren ================= */
  {
    id: 'soren', name: 'Сорен', title: 'Носитель косы', role: 'assassin', roleName: 'Жнец', build: 'assassin', bars: [4, 3, 3, 5], diffc: 3, atkSfx: 'scythe',
    lore: 'Сорена растили в ордене Ночной Жатвы и послали в руины Разлома за древней косой. Коса оказалась живой: в ней спал Харрак — тварь, пережившая всех своих хозяев. С тех пор они делят одно тело и спорят, чьё оно. Каждая рана врагу — голос в этом споре: кровь тех, кто дерётся вплотную, кормит Харрака, кровь стрелков и магов — тень самого Сорена. Кто наберёт больше, тот и останется.',
    look: SOR_LOOK[0], stats: ST(620, 90, 300, 32, 62, 3.6, 26, 2.9, 0.78, 9.1, 3.0),
    innate: SOR_INN[0], kits: SOR_KITS,
    init(h) { const B = h.def; h.def = Object.create(B); h.def.abilities = SOR_KITS[0].slice(); h.sorForm = 0; h.sorE = [0, 0]; h.sorReady = 0; h.sorReadyT = 0; h.sorHeroT = -99; h.sorEdgeT = 0; h.sorEdgeCd = 0; sorHudHook(); },
    onDeath(h) { h.sorChanging = false; if (h.sorStep) sorStepOff(h); if (h.sorIn) sorLeave(h, h.x, h.z, false); if (h.sorSpinT) { h.spinning = false; h.sorSpinT = 0; } },
    onHurt(h, src) { if (src && src.kind === 'hero') h.sorHeroT = G.time; },
    onDeal(h, t, d, o) {
      if (t.kind !== 'hero' || o.sorB) return; h.sorHeroT = G.time; const f = h.sorForm;
      if (!f) { sorGain(h, t.range < 5 ? 0 : 1, d / t.maxHp * SOR_GAIN); return; }
      if (f === 1) {   // Harrak drinks what his abilities spill
        if (o.basic || o.dot) return; heal(h, h, d * 0.27, true);
        if (G.time > (h.sorFxT || 0) && FX.near(h.x, h.z, 50)) { h.sorFxT = G.time + 0.2; FX.beam(t.x, t.z, h.x, h.z, { color: SOR.d, w: 0.3, life: 0.3, y: 1.3 }); FX.burst(h.x, 1.2, h.z, { n: 4, color: 0xff7a60, color2: SOR.dd, speed: [0.3, 1], life: [0.4, 0.7], size: [0.3, 0.03], up: 2.5, rad: 0.6 }); }
        return;
      }
      // the shadow's opening: for three seconds everything he does to heroes cuts deeper
      if (G.time >= h.sorEdgeT && !h.sorEdgeCd) { h.sorEdgeT = G.time + 3; h.sorEdgeCd = 1; if (FX.near(h.x, h.z, 50)) { FX.aura(h, SOR.s, 3, 1.3, 'ringThin', -6); FX.ring(h.x, h.z, { r0: 0.4, r1: 2.4, color: SOR.s, life: 0.3, tex: 'ringThin' }); } SFX.at('shadowblade', h.x, h.z, 0.5); }
      if (G.time < h.sorEdgeT) {
        damage(h, t, d * (0.14 + 0.022 * (h.level - 1)), 2, { raw: true, dot: true, sorB: true });
        if (G.time > (h.sorFxT || 0) && FX.near(t.x, t.z, 50)) { h.sorFxT = G.time + 0.12; akCut(t.x, t.height * 0.55, t.z, 2.2, rand(TAU), rand(-0.7, 0.7), 0.16, SOR.s); }
      }
    },
    tick(h, dt) {
      if (h.sorSpinT && G.time > h.sorSpinT) { h.spinning = false; h.sorSpinT = 0; }
      if (!h.sorForm) {
        if (!h.sorReady) { sorGain(h, 0, SOR_DRIP * dt); sorGain(h, 1, SOR_DRIP * dt); }
        else if (h.ai && !h.sorChanging && (G.time > h.sorReadyT + 8 || !G.heroes.some(o => o.alive && o.team !== h.team && udist(h, o) < 11))) sorTransform(h, h.sorReady);
        sorHudUpd(h);
      } else if (h.sorForm === 2 && h.sorEdgeCd && G.time > h.sorEdgeT && G.time - h.sorHeroT > 8) h.sorEdgeCd = 0;
      const S = h.sorStep;
      if (S) {
        const inside = !NAV.ok(h.x, h.z);
        if (inside && !S.healed) { S.healed = true; heal(h, h, S.heal); if (FX.near(h.x, h.z, 50)) { FX.heal(h, SOR_COL[S.f]); FX.ring(h.x, h.z, { r0: 0.3, r1: 2, color: SOR_COL[S.f], life: 0.3, tex: 'ringThin' }); } SFX.at('ghost', h.x, h.z, 0.4); }
        if (S.f === 2) for (const b of h.buffs) if (b.slow) b.dead = true;
        if (h.stunned || h.rooted || G.time > S.max || (!inside && G.time > S.base)) sorStepOff(h);
        else { h.ghostT = G.time + 0.3; S.tr -= dt; if (S.tr <= 0 && FX.near(h.x, h.z, 50)) { S.tr = 0.08; if (h.moving) dshGhost(h, SOR_DEEP[S.f], 0.3, inside ? 0.6 : 0.35); sorSmoke(h.x, 0.6, h.z, S.f, 1); } }
      }
      const I = h.sorIn;
      if (I) {
        h.order = null; h.path = null; h.windup = 0; h.atkCd = Math.max(h.atkCd, 0.2);
        if (!I.in && !h.dash) { if (I.t.alive && udist(h, I.t) < 2.5) sorEnter(h); else sorLeave(h, h.x, h.z, false); }   // the lunge was cut short by something: finish it one way or the other, never hang
      }
    },
    abilities: SOR_KITS[0]
  },
  /* ================= 78. Sigure ================= */
  {
    id: 'sigure', name: 'Сигурэ', title: 'Не дошедший до той стороны', role: 'assassin', roleName: 'Мечник', build: 'duel', bars: [5, 2, 4, 4], diffc: 3, noSlash: true, hitSfx: false,
    lore: 'Сигурэ служил мечником при переправе через Разлом и погиб, удерживая мост в осенний ливень. До той стороны он не дошёл: на полдороге его перехватил голодный дух и надел на него своё лицо. Сигурэ зарубил духа его же клинком — и очнулся под дождём, живой, с треснувшей маской на пол-лица и чужим алым мечом в левой руке. Маску не снять, клинок не выбросить. Зато теперь он видит тех, кто пришёл оттуда следом за ним.',
    look: SGR_LOOK, stats: ST(600, 86, 100, 0, 60, 3.6, 24, 2.7, 0.86, 9.2, 2.7, 0.026),
    innate: { name: 'Путь двух клинков', icon: 'sgrinn', desc: 'У Сигурэ нет маны — его умения ничего не стоят, а «Сталь смерти» и «Рассечение духа» перезаряжаются тем быстрее, чем выше его скорость атаки. Каждая вторая атака наносится клинком духа: половина её урона — магическая. Шанс критического удара от предметов у него удвоен, но сами криты на 10% слабее.', count: h => { const n = sgrStacks(h); return n ? '●'.repeat(n) : ''; } },
    onRecalc(h) { h.crit = Math.min(1, h.crit * 2); h.critK = 1.575; },
    // the left hand holds the spirit blade: its half of the damage is magic
    onBasic(h, t, d) { if (!h.anim.alt || t.struct) return d; damage(h, t, d * 0.5, 1, { dot: true, sgw: true }); return d * 0.5; },
    onDeal(h, t, d, o) {
      if (o.sgEcho) return;
      if (h.soul && t.kind === 'hero' && d > 0) { h.soul.dmg[t.id] = (h.soul.dmg[t.id] || 0) + d; sgrMark(h, t); }
      if (!o.basic) return; const sp = h.anim.alt, col = sp ? SGR.c : SGR.steel, f = angTo(h.x, h.z, t.x, t.z);
      SFX.at(sp ? 'shadowblade' : 'katana', t.x, t.z, 0.5);
      if (FX.near(t.x, t.z, 45)) { akCut(t.x, t.height * 0.58, t.z, 2.3, f + (sp ? 0.5 : -0.5) + rand(-0.2, 0.2), (sp ? -0.45 : 0.45) + rand(-0.15, 0.15), 0.15, col); rmpArc(h.x + Math.sin(f) * 1.2, h.z + Math.cos(f) * 1.2, f, 2.3, 1.5, 0.18, col, 1.25, sp, 0.9); }
    },
    onDeath(h) { if (h.soul) sgrSoulEnd(h, h.soul); h.sgSt = null; h.sgBack = null; h.gone = false; },
    tick(h) { if (h.sgBack && !h.dash) { const f = h.sgBack; h.sgBack = null; f(); } },
    abilities: [
      {
        key: 'Q', name: 'Сталь смерти', icon: 'sgrq', cd: 4, cost: 0, costText: 'без маны', range: 5.5, noReach: true, ind: { type: 'line', w: 1.6, fixed: true }, anim: 'thrust', animDur: 0.3, lock: 0.14, ai: { t: 'shot', sp: 90, farm: true }, active: h => sgrStacks(h) >= 2,
        desc: 'Выпад стальным клинком по линии длиной 5.5: физический урон всем на ней. Может нанести критический удар и несёт эффекты атаки. Если выпад кого-то задел, Сигурэ копит заряд (6 сек). С двумя зарядами следующая «Сталь смерти» — рывок вперёд на 5.5 в вихре: урон и <b>подбрасывание на 0.75 сек</b> всем на пути. Перезарядка сокращается скоростью атаки (от 4 сек до 1.33 сек).',
        cast(h, p) { const d = D(h, 20, 12, 1.0, 0); if (sgrStacks(h) >= 2) sgrGale(h, p.dir, d); else sgrThrust(h, p.dir, d); return { cd: Math.max(1.33, 4 * sgrAs(h)) }; }
      },
      {
        key: 'W', name: 'Рассечение духа', icon: 'sgrw', cd: 12, cost: 0, costText: 'без маны', range: 6.5, noReach: true, ind: { type: 'cone', r: 6.5 }, anim: 'sgcleave', animDur: 0.45, lock: 0.3, ai: { t: 'cone', farm: true },
        desc: 'Оба клинка проходят перед Сигурэ широкой дугой (до 6.5). Каждый враг в ней получает урон от своего максимального здоровья — половину физическим, половину магическим (по миньонам и чудовищам урон ограничен). Если удар кого-то задел, Сигурэ получает щит на 1.5 сек: вдвое больше за задетого героя и ещё на четверть — за каждого следующего. Перезарядка сокращается скоростью атаки (до 6 сек).',
        cast(h, p) { const lv = Math.max(1, h.al[1]); sgrCleave(h, p.dir, D(h, 10, 9, 0, 0), 0.1 + 0.0125 * lv, D(h, 40, 12, 0.45, 0)); return { cd: Math.max(6, 12 * sgrAs(h)) }; }
      },
      {
        key: 'E', name: 'Освобождённая душа', icon: 'sgre', cd: 18, cost: 0, costText: 'без маны', range: 3.5, noReach: true, ind: { type: 'line', w: 1.4, fixed: true }, anim: 'sgsoul', animDur: 0.3, lock: 0, noCue: true, ai: { t: 'fn', fn: sgrSoulAI }, free: h => !!h.soul, active: h => !!h.soul,
        desc: 'Душа Сигурэ вырывается из тела рывком на 3.5, а тело остаётся на месте на коленях. 5 сек он дерётся духом: скорость бега растёт с 10% до 30%. Когда время выйдет — или по повторному нажатию — душа мгновенно возвращается в тело (в пути его нельзя ни ранить, ни остановить), и каждый герой, которого он ранил духом, получает ещё раз 25–35% этого урона — чистым уроном. Перезарядка начинается после возвращения.',
        cast(h, p) {
          if (h.soul) { if (G.time < h.soul.t0 + 0.45) return false; sgrReturn(h); return { cd: h.cd[2] }; }
          sgrSoul(h, p.dir); return { cd: 0.5 };
        }
      },
      {
        key: 'R', name: 'Печать судьбы', icon: 'sgrr', cd: 105, cost: 0, costText: 'без маны', range: 12, noReach: true, ind: { type: 'line', w: 2.5, fixed: true }, anim: 'sgseal', animDur: 1.0, lock: 0.78, ai: { t: 'fn', fn: sgrSealAI, ult: true, hp: 0.6, rad: 5 },
        desc: 'Сигурэ замирает на 0.75 сек, а затем одним ударом проходит линию длиной 12. Все враги на ней получают физический и магический урон, подбрасываются на 0.75 сек и <b>стягиваются к нему</b>, а сам он оказывается за спиной самого дальнего задетого героя. Если героев на линии не было, он проносится её до конца.',
        cast(h, p) { if (h.soul) { /* the body stays where it knelt: the strike is made by the spirit */ } sgrSeal(h, p.dir, D(h, 60, 25, 0.4, 0)); }
      }
    ]
  }
);

/* ---------- icons ---------- */
Object.assign(GLYPH, {
  // a crescent blade with an eye open in it
  sorinn(T) { T.moon(-4, 0, 24); T.E(9, 0, 10, 6); T.cut(() => T.C(9, 0, 3)); T.hi(() => T.C(9, 0, 1.4)); },
  // a horned skull
  sorf1(T) { T.P(-12, -6, 12, -6, 14, 10, 0, 22, -14, 10); T.P(-11, -6, -24, -24, -4, -8); T.P(11, -6, 24, -24, 4, -8); T.cut(() => { T.P(-10, 0, -3, 4, -9, 6); T.P(10, 0, 3, 4, 9, 6); T.g.fillRect(-6, 13, 12, 2.5); }); },
  // a hooded face: two eyes of light over a mask
  sorf2(T) { T.P(0, -26, 20, -6, 16, 22, -16, 22, -20, -6); T.cut(() => { T.P(-12, -4, -3, -1, -11, 3); T.P(12, -4, 3, -1, 11, 3); }); T.al(0.5, () => T.cut(() => T.g.fillRect(-12, 8, 24, 2.5))); },
  // the scythe going round in a full circle
  sorq(T) { T.rot(-0.5, () => T.moon(0, -3, 19)); T.S(3.5, -4, 2, -18, 22); T.al(0.5, () => T.A(0, 0, 25, 0.5, 2.9, 3)); },
  // blades rising out of the ground along a line, each taller than the last
  sorw(T) { T.P(-25, 19, -18, 0, -12, 19); T.P(-9, 19, 0, -12, 7, 19); T.P(9, 19, 20, -26, 26, 19); T.al(0.5, () => T.g.fillRect(-27, 20, 55, 3.5)); },
  // a figure stepping through a wall: half of him still on this side
  sore(T) { T.g.fillRect(-4, -26, 8, 52); T.cut(() => { T.g.fillRect(-4, -12, 8, 2); T.g.fillRect(-4, 2, 8, 2); T.g.fillRect(-4, 14, 8, 2); }); T.al(0.5, () => { T.C(-14, -8, 6); T.P(-22, 22, -14, -1, -6, 22); }); T.C(15, -8, 6); T.P(7, 22, 15, -1, 23, 22); },
  // a body with an eye opening in its chest
  sorr(T) { T.al(0.45, () => { T.C(0, -17, 8); T.P(-18, 24, -13, -6, 13, -6, 18, 24); }); T.E(0, 8, 14, 8); T.cut(() => T.C(0, 8, 4)); T.hi(() => T.C(0, 8, 1.6)); },
  // bursting out
  sorexit(T) { T.star(0, 0, 25, 9, 8); T.cut(() => T.C(0, 0, 5)); T.hi(() => T.C(0, 0, 2)); },
  // two crossed swords: one solid, one of light
  sgrinn(T) { T.sword(-18, 18, 18, -18, 7); T.al(0.55, () => T.sword(18, 18, -18, -18, 7)); T.hi(() => T.S(1.4, 10, 10, -12, -12)); },
  // a thrust, and the whirl that follows it
  sgrq(T) { T.blade(-24, 4, 22, 4, 9); T.al(0.6, () => { T.S(2.5, -24, -8, -6, -8); T.S(2.5, -18, 15, 0, 15); }); T.A(14, 4, 13, -1.25, 1.25, 2.5); },
  // two blades leaving one point, the fan of the cut between them
  sgrw(T) { T.al(0.32, () => T.P(-22, 22, 25, 3, 17, -13, -3, -25)); T.blade(-22, 22, 25, 3, 7); T.blade(-22, 22, -3, -25, 7); T.A(-22, 22, 47, -1.4, -0.44, 3); T.hi(() => T.C(-22, 22, 2.5)); },
  // a kneeling body and the spirit that has stepped out of it, a thread between them
  sgre(T) { T.al(0.45, () => { T.C(-13, -4, 6); T.P(-22, 22, -13, 3, -4, 22); }); T.C(12, -12, 6); T.P(3, 20, 12, -5, 21, 20); T.Q(2, -8, 12, 0, 20, 6, 8); },
  // a circle struck through by one long cut
  sgrr(T) { T.O(0, 0, 17, 3); T.blade(-27, 15, 27, -15, 8); T.al(0.5, () => { T.S(2, -6, -24, 2, -16); T.S(2, 6, 24, -2, 16); }); T.hi(() => T.S(1.4, -12, 7, 14, -8)); }
});
