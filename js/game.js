'use strict';
/* ===== game logic: units, combat, buffs, projectiles, minions, towers, jungle ===== */
let UID = 1;
const MAX_LVL = 15;
const xpNeed = l => 80 + 36 * (l - 1);
/* ability levels: one skill point per hero level. Basic abilities (Q W E) have 4 levels, the ultimate has 3 and opens at hero level 6 / 10 / 14.
   A basic ability can be raised to level k once the hero is level 2k-1. h.al = levels, h.sp = unspent points. */
const ULT_LV = [6, 10, 14];
const abMax = i => i === 3 ? 3 : 4;
const abReq = (i, next) => i === 3 ? ULT_LV[next - 1] : next * 2 - 1;
function canLearn(h, i) { const ab = h.def.abilities[i]; return !!ab && h.sp > 0 && h.al[i] < abMax(i) && h.level >= abReq(i, h.al[i] + 1); }
function learn(h, i) { if (!canLearn(h, i)) return false; h.al[i]++; h.sp--; if (h.def.abilities[i].passive) recalcHero(h); return true; }
// bots: ultimate whenever possible, then one point in everything, then max in the hero's priority order (def.skill, default Q W E)
function autoLearn(h) {
  const pr = h.def.skill || [0, 1, 2]; let g = 0;
  while (h.sp > 0 && g++ < 20) {
    if (canLearn(h, 3)) { learn(h, 3); continue; }
    let k = pr.find(i => h.al[i] === 0 && canLearn(h, i)); if (k === undefined) k = pr.find(i => canLearn(h, i));
    if (k === undefined) break; learn(h, k);
  }
}
// ability power grows with the level of the ability being cast (h.castI): a maxed ability equals what a level-15 hero used to have
function abEff(h) { if (!h.al) return h.level || 1; const i = h.castI || 0, a = Math.max(1, h.al[i]); return i === 3 ? 6 + (a - 1) * 4.5 : 1 + (a - 1) * 14 / 3; }
// extra cast range from items applies to targeted, ground-aimed and projectile abilities
function abRange(h, ab) { const t = ab.ind && ab.ind.type; return ab.range && h.castRange && !ab.noReach && (t === 'target' || t === 'ally' || t === 'any' || t === 'circle' || t === 'line') ? ab.range + h.castRange : ab.range; }

function makeUnit(o) {
  const u = Object.assign({
    id: UID++, kind: 'minion', team: 0, x: 0, z: 0, radius: 0.8, hp: 100, maxHp: 100, bAd: 10, bAp: 0, bDef: 0, bAs: 1, bMs: 7, bLs: 0, range: 2,
    ad: 10, ap: 0, arm: 0, as: 1, ms: 7, facing: 0, alive: true, dead: false, buffs: [], target: null, atkCd: 0, windup: 0, windupTgt: null, moving: false,
    stunned: false, rooted: false, silenced: false, invuln: false, shield: 0, dmgOut: 1, dmgIn: 1, ls: 0, lastDamageT: -99, heroAggroT: -99, flash: 0, yOff: 0,
    anim: { walk: rand(6), atkT: 0, atkDur: 1, castT: 0, castDur: 1, castType: 'cast', deathT: 0, spinA: 0, alt: false }, think: rand(0.3), deathT: 0, struct: false, height: 2, dmgDealt: 0
  }, o);
  u.hp = u.maxHp; u.ad = u.bAd; u.arm = u.bDef; u.as = u.bAs; u.ms = u.bMs;
  G.units.push(u); return u;
}
function placeRig(u) { u.rig.root.position.set(u.x, 0, u.z); u.rig.root.rotation.y = u.facing; G.scene.add(u.rig.root); u.height = u.rig.height || u.height; }

/* ---------- queries ---------- */
// hostility: the teams differ, or one of the two is out of his mind (u.madT, cyberpsychosis) — then he and every hero, minion and monster are enemies to each other
function hostile(a, b) { return a !== b && (a.team !== b.team || (!a.struct && !b.struct && (a.madT > G.time || b.madT > G.time))); }
function enemiesIn(src, x, z, r, heroOnly) {
  const out = [], tm = src.team, sm = src.madT > G.time;
  for (const u of G.units) {
    if (!u.alive || u.struct || u === src || (u.team === tm && !(sm || u.madT > G.time))) continue; if (heroOnly && u.kind !== 'hero') continue;
    const rr = r + u.radius, dx = u.x - x, dz = u.z - z; if (dx * dx + dz * dz <= rr * rr) out.push(u);
  }
  return out;
}
function alliesIn(src, x, z, r, heroOnly) {
  const out = [];
  for (const u of G.units) {
    if (!u.alive || u.team !== src.team || u.struct || (u !== src && (u.madT > G.time || src.madT > G.time))) continue; if (heroOnly && u.kind !== 'hero') continue;
    const dx = u.x - x, dz = u.z - z; if (dx * dx + dz * dz <= (r + u.radius) * (r + u.radius)) out.push(u);
  }
  return out;
}
function inCone(src, u, dir, half, r) { const d = udist(src, u); if (d > r + u.radius) return false; return d < 1.2 || Math.abs(angDiff(dir, angTo(src.x, src.z, u.x, u.z))) <= half; }
function targetable(src, t) { return t.alive && !(t.struct && t.protected); }
function after(t, fn) { G.timers.push({ t: G.time + t, fn }); }
function telegraph(src, x, z, r, delay, color) { FX.decal(x, z, r, color, delay); G.dangers.push({ x, z, r, team: src.team, until: G.time + delay }); }

/* ---------- buffs ---------- */
function addBuff(u, b) {
  if (!u.alive) return null;
  if (u.struct && (b.stun || b.root || b.slow || b.silence || b.blind)) return null;
  if (u.boss) { if (b.stun || b.root || b.blind) b.dur *= 0.35; if (b.slow) b.slow *= 0.5; }
  if (u.ten && (b.stun || b.root || b.silence)) b.dur *= 1 - u.ten;
  b.max = b.dur; b.acc = 0; if (b.shield) b.shieldMax = b.shield;
  if (b.id) { const i = u.buffs.findIndex(o => o.id === b.id); if (i >= 0) { const o = u.buffs[i]; if (o.fx) o.fx.dead = true; if (b.stackTo) b.stacks = Math.min(b.stackTo, (o.stacks || 1) + 1); u.buffs.splice(i, 1); } }
  u.buffs.push(b);
  if (b.stun) { u.windup = 0; u.dash = null; u.stunned = true; if (u.recall > 0) breakRecall(u); }
  if (b.root && u.dash) u.dash = null;
  if (b.shield) u.shield += b.shield;
  return b;
}
function hasBuff(u, id) { return u.buffs.some(b => b.id === id); }
// u.ampBy: the ally whose buff is adding to this unit's damage (he is credited with the extra in the "support" column), u.ampK: by how much
function updateBuffs(u, dt) {
  let ms = 0, slow = 0, as = 0, ad = 0, ap = 0, def = 0, dout = 1, din = 1, ls = 0, sh = 0, hc = 0, stun = false, root = false, sil = false, inv = false, air = 0, blind = false, ampS = null, ampK = 1;
  const B = u.buffs;
  for (let i = B.length - 1; i >= 0; i--) {
    const b = B[i]; b.dur -= dt;
    if (b.every) { b.acc += dt; while (b.acc >= b.every && u.alive) { b.acc -= b.every; b.onTick(u, b); } if (!u.alive) return; }
    if (b.dur <= 0 || b.dead || (b.shieldMax && b.shield <= 0)) { B.splice(i, 1); if (b.fx) b.fx.dead = true; if (b.onEnd) b.onEnd(u, b); if (!u.alive) return; continue; }
    if (b.ms) ms += b.ms; if (b.slow && b.slow > slow) slow = b.slow; if (b.as) as += b.as; if (b.ad) ad += b.ad; if (b.ap) ap += b.ap; if (b.def) def += b.def;
    if (b.dmgOut) { dout *= b.dmgOut; if (b.amp) { ampS = b.amp; ampK *= b.dmgOut; } } if (b.dmgIn) din *= b.dmgIn; if (b.ls) ls += b.ls; if (b.shield > 0) sh += b.shield; if (b.healCut > hc) hc = b.healCut;
    if (b.stun) stun = true; if (b.root) root = true; if (b.silence) sil = true; if (b.invuln) inv = true; if (b.blind) blind = true; if (b.air) air = Math.max(air, Math.sin(Math.PI * clamp(1 - b.dur / b.max, 0, 1)) * b.air);
  }
  u.shield = sh; u.ad = u.bAd + ad; u.ap = u.bAp + ap; u.arm = u.bDef + def; u.as = u.bAs * (1 + as); u.ms = u.bMs * (1 + ms) * (1 - slow);
  u.dmgOut = dout; u.dmgIn = din; u.healCut = hc; u.ampBy = ampS; u.ampK = ampK; u.ls = u.bLs + ls; u.stunned = stun; u.rooted = root; u.silenced = sil; u.invuln = inv; u.blinded = blind;
  if (!u.dash) u.yOff = air;
  if (stun && FX.near(u.x, u.z, 45) && Math.random() < dt * 14) FX.burst(u.x, u.height + 0.5, u.z, { n: 1, color: 0xfff3a0, speed: [0.5, 1.5], life: [0.3, 0.5], size: [0.3, 0.03], ring: true });
}
// common crowd-control shortcuts
function stun(src, u, dur, air) { addBuff(u, { id: 'stun', dur, stun: true, air: air || 0, src }); }
function slow(src, u, pct, dur, id) { addBuff(u, { id: id || 'slow', dur, slow: pct, src }); }
function root(src, u, dur, color) { const b = addBuff(u, { id: 'root', dur, root: true, src }); if (b) b.fx = FX.aura(u, color || 0xffffff, b.dur, u.radius + 0.6, 'ring', 4); }
function shield(src, u, amt, dur, color) { if (src.kind === 'hero') { amt *= (HEAL_K[src.def.id] || 1) * (1 + (src.healPow || 0)); if (u.kind === 'hero' && u !== src) { src.healDone += amt * 0.6; if (src.grace) addBuff(u, { id: 'grace', dur: 2.5, ms: 0.15, src }); } } const b = addBuff(u, { id: 'sh' + src.id, dur, shield: amt, src }); if (b) b.fx = FX.bubble(u, color || 0xffffff, dur, u.radius + 0.9); return b; }

/* ---------- damage / heal / death ---------- */
/* Per-hero output tuning, measured on bot matches so that every damage dealer lands near the same damage to heroes per minute (Vint is the yardstick, 1.0).
   DMG_K scales everything a hero deals to units (not to towers or the crystal); HEAL_K scales the heals and shields a support gives. */
const DMG_K = {
  vint: 1.05, virr: 1.05, silva: 1.08, vale: 1.15, keira: 1.4, shaya: 1.25,
  mora: 1.4, nox: 1.65, morg: 1.4, aisa: 1.65, zar: 1.85, fenris: 1.2, reiji: 1.4, yuki: 1.85, cassius: 1.45, ragna: 1.5,
  toplak: 1.45, groh: 1.55, grimm: 1.45, brand: 1.6, oriel: 1.1, nisa: 1.2, lira: 1.25, hald: 1.25, kolomba: 1.35, kostyan: 1.38,
  shiro: 1.15, kaisei: 1.65, umbra: 1.6, rampage: 1.0, jin: 1.6, hikaru: 1.6, dash: 1.2, tokiko: 1.1, riku: 1.2, ashen: 1.3, chess: 1.7, mei: 1.25,
  kagari: 1.0, lin: 1.3, kwame: 1.3, agafya: 1.2, akito: 1.1
};
const HEAL_K = { oriel: 1.9, hald: 1.5, nisa: 2.3, lira: 2.8, kolomba: 2.0, ashen: 2.6, chess: 1.8, kagari: 1.5, lin: 3.0, kwame: 1.6, agafya: 2.2 };
function damage(src, tgt, amt, type, o) {
  if (!tgt.alive || tgt.invuln || !(amt > 0)) return 0;
  o = o || {};
  // o.raw: an amount already worked out elsewhere (a share of damage passed along a seam) — no attacker multipliers, no armour, only the target's own reduction
  let d = amt * (src && !o.raw ? src.dmgOut : 1);
  if (src && src.kind === 'hero' && !tgt.struct && !o.raw) d *= DMG_K[src.def.id] || 1;
  if (src && src.scrit && !o.basic && !o.dot && !o.raw && !tgt.struct && Math.random() < src.scrit) { d *= 1.6; o.crit = true; }   // spell crit from items
  if (type !== 2 && !o.raw) { let ar = Math.max(0, tgt.arm); if (src) { if (type === 0 && src.apen) ar *= 1 - src.apen; else if (type === 1 && src.mpen) ar *= 1 - src.mpen; } d *= 100 / (100 + ar); }
  d *= tgt.dmgIn;
  if (tgt.struct) {
    if (tgt.protected) return 0;
    if (src && src.kind === 'hero' && !G.units.some(m => m.alive && m.kind === 'minion' && m.team === src.team && udist(m, tgt) < 16)) d *= 0.4;
  }
  if (tgt.kind === 'monster' && src) monsterAggro(tgt, src);
  if (tgt.shield > 0) {
    for (const b of tgt.buffs) if (b.shield > 0) { const a = Math.min(b.shield, d); b.shield -= a; d -= a; tgt.shield -= a; if (d <= 0) break; }
    if (d <= 0) { tgt.flash = 0.5; return 0; }
  }
  if (d >= tgt.hp && tgt.aegisT > G.time && tgt.kind === 'hero') { aegisUse(tgt); return 0; }
  if (tgt.dummy) { d = Math.min(d, tgt.hp - 1); const S = G.sandbox; if (S && src === G.player) { if (G.time - S.last > 3) { S.dmg = 0; S.t0 = G.time; S.hit = 0; } S.dmg += d; S.hit++; S.last = G.time; } }
  if (d >= tgt.hp && tgt.buffs.some(b => b.undying)) d = Math.max(0, tgt.hp - 1);
  tgt.lastDamageT = G.time; tgt.flash = 1;
  if (src) {
    tgt.lastHitBy = src;
    if (src.kind === 'hero') { const dd = Math.min(d, tgt.hp); src.dmgDealt += d; if (tgt.kind === 'hero') { src.heroAggroT = G.time; tgt.dmgBy[src.id] = G.time; if (src.team !== tgt.team) { src.dmgHero += dd; if (src.ampBy && src.ampBy !== src && src.ampK > 1) src.ampBy.healDone += dd * (1 - 1 / src.ampK); } } else if (tgt.struct) src.dmgTower += dd; }
  }
  if (tgt.kind === 'hero') tgt.dmgTaken += Math.min(d, tgt.hp);
  if (tgt.recall > 0) breakRecall(tgt);
  tgt.hp -= d;
  if (!o.dot && !tgt.struct && d >= 1) FX.impact(src, tgt, d, o);
  if (tgt.kind === 'hero' && tgt.def.onHurt) tgt.def.onHurt(tgt, src, d, o);   // per-hero hook: health actually lost
  if (src && src.alive && !tgt.struct && src.kind === 'hero') {
    if (src.def.onDeal) src.def.onDeal(src, tgt, d, o);   // per-hero hook: damage dealt to a unit
    if (src.chill && !o.dot && tgt.hp > 0) chillHit(src, tgt, !!o.basic);
    if (o.basic) { if (src.ls > 0) heal(src, src, d * src.ls, true); }
    else {
      if (src.omni) heal(src, src, d * src.omni * (tgt.kind === 'hero' ? 1 : 0.35), true);
      if (src.burn && !o.dot && tgt.hp > 0) addBuff(tgt, { id: 'cinder' + src.id, dur: 3.05, every: 1, onTick: q => { damage(src, q, Math.min(q.maxHp * src.burn, q.kind === 'hero' ? 1e9 : 40), 1, { dot: true }); FX.flame(q.x, 1.2, q.z, { n: 2, color: 0xffa040, color2: 0x601000, size: [0.5, 1], life: [0.3, 0.6] }); } });
    }
  }
  if (o.basic && tgt.thorns && src && src.kind === 'hero' && tgt.kind === 'hero') damage(tgt, src, tgt.thorns + tgt.arm * 0.12, 1, { dot: true });
  const P = G.player;
  if (P && d >= 1 && (src === P || tgt === P)) {
    FX.text(tgt.x, tgt.height + 0.6, tgt.z, Math.round(d) + (o.crit ? '!' : ''), tgt === P ? '#ff6a5e' : (o.crit ? '#ffe27a' : (type === 1 ? '#cfa8ff' : (type === 2 ? '#ffffff' : '#ffd27a'))), o.crit ? 22 : (d > 160 ? 21 : (d > 70 ? 17 : 13)));
    if (src && src.kind === 'hero' && tgt.kind === 'hero' && d > tgt.maxHp * 0.1) FX.hitstop(0.05);
  }
  if (tgt.lowShield && tgt.hp > 0 && tgt.hp < tgt.maxHp * 0.3 && G.time > (tgt.lsT || 0)) { tgt.lsT = G.time + 60; shield(tgt, tgt, 250 + tgt.maxHp * 0.12, 4, 0xffe9a0); FX.ring(tgt.x, tgt.z, { r1: 4, color: 0xffe9a0, life: 0.5, tex: 'shock' }); }
  // sewn together (Agafya's ultimate): a share of what one of them takes reaches every other one on the same thread
  const sg = tgt.sewG; if (sg && !o.link && d > 0 && G.time < sg.until) for (const m of sg.list) if (m !== tgt && m.alive && m.sewG === sg) { damage(src || sg.src, m, d * sg.share, 2, { dot: true, link: true, raw: true }); if (FX.near(m.x, m.z, 45) && Math.random() < 0.5) FX.hit(m.x, 1.3, m.z, sg.col, false); }
  if (tgt.hp <= 0) kill(tgt, src);
  return d;
}
function heal(src, tgt, amt, quiet) {
  if (!tgt.alive || amt <= 0) return 0;
  if (tgt.healCut) amt *= 1 - tgt.healCut;   // «Стужа»: less healing of every kind
  if (src && src.kind === 'hero') amt *= (HEAL_K[src.def.id] || 1) * (1 + (src.healPow || 0));
  const a = Math.min(amt, tgt.maxHp - tgt.hp); tgt.hp += a;
  if (src && src.kind === 'hero' && tgt.kind === 'hero' && src !== tgt) { src.healDone += a; if (src.grace && a > 0) addBuff(tgt, { id: 'grace', dur: 2.5, ms: 0.15, src }); }
  if (a >= 4 && !quiet && (src === G.player || tgt === G.player)) FX.text(tgt.x, tgt.height + 0.6, tgt.z, '+' + Math.round(a), '#7dffa8', 14);
  return a;
}
function addGold(h, g, show) {
  h.gold += g; h.goldTotal = (h.goldTotal || 0) + g;
  if (show && h.isPlayer) { FX.text(h.x, h.height + 1.4, h.z, '+' + Math.round(g) + ' з', '#ffd84a', 13); SFX.play('coin', 0.45); }
}
function gainXp(h, x) {
  if (h.level >= MAX_LVL) return; h.xp += x;
  while (h.level < MAX_LVL && h.xp >= xpNeed(h.level)) {
    h.xp -= xpNeed(h.level); h.level++; h.sp++; recalcHero(h); if (!h.isPlayer || h.ai) autoLearn(h);
    if (h.alive) FX.levelUp(h); if (h.isPlayer) { SFX.play('level'); if (ULT_LV.includes(h.level) && !h.ai) UI.announce(h.level === 6 ? 'Можно изучить ультимейт' : 'Можно усилить ультимейт', '#ffd98a'); }
  }
}
function kill(u, src) {
  if (!u.alive) return;
  u.alive = false; u.dead = true; u.hp = 0; u.deathT = 0; u.anim.deathT = 0;
  for (const b of u.buffs) if (b.fx) b.fx.dead = true;
  u.buffs.length = 0; u.target = null; u.windup = 0; u.dash = null; u.forced = null; u.stunned = false; u.moving = false; u.spinning = false; u.shield = 0; u.yOff = 0; u.sewG = null;
  if (u.kind === 'minion' || u.kind === 'monster') {
    const killer = src && src.kind === 'hero' ? src : null;
    const near = G.heroes.filter(h => h.alive && h.team !== u.team && (u.team !== 2 || (killer && h.team === killer.team)) && udist(h, u) < 17);
    if (killer) { addGold(killer, u.gold, true); killer.cs++; if (!near.includes(killer)) near.push(killer); for (const h of near) if (h !== killer && h.tithe && h.team === killer.team) addGold(h, u.gold * h.tithe, true); }
    else for (const h of near) addGold(h, u.gold * 0.35);
    if (near.length) { const sh = u.xp / Math.pow(near.length, 0.7); for (const h of near) gainXp(h, sh); }
    FX.burst(u.x, 0.8, u.z, { n: 6, color: u.team === 2 ? 0xd8c070 : TEAM_COL[u.team], speed: [1, 4], life: [0.3, 0.6], size: [0.35, 0.04], grav: -6, up: 2 });
    if (u.kind === 'monster') monsterDeath(u, killer);
  } else if (u.kind === 'hero') heroDeath(u, src);
  else if (u.kind === 'tower') towerDeath(u, src);
  else if (u.kind === 'core') endGame(1 - u.team, u);
}
function heroDeath(u, src) {
  let killer = src && src.kind === 'hero' ? src : null;
  if (!killer) { let bt = 0; for (const id in u.dmgBy) if (G.time - u.dmgBy[id] < 10 && u.dmgBy[id] > bt) { const hh = G.heroes.find(h => h.id === +id); if (hh) { killer = hh; bt = u.dmgBy[id]; } } }
  const own = !!killer && killer.team === u.team;   // killed by his own side (someone was in a cyberpsychosis): nobody is paid for it
  u.deaths++; if (!own) G.teams[1 - u.team].kills++;
  if (own) { /* no gold, no experience, no streak */ }
  else if (killer) {
    const feed = Math.max(0.45, 1 - 0.14 * (u.feed || 0));
    killer.kills++; killer.streak++; killer.feed = 0; addGold(killer, (240 + Math.min(5, u.streak) * 60) * feed, true); gainXp(killer, (70 + u.level * 22) * (0.5 + feed * 0.5));
    killer.multiT = G.time - (killer.lastKillT || -99) < 10 ? (killer.multi || 1) + 1 : 1; killer.multi = killer.multiT; killer.lastKillT = G.time;
    for (const id in u.dmgBy) if (G.time - u.dmgBy[id] < 10 && +id !== killer.id) { const a = G.heroes.find(h => h.id === +id); if (a) { a.assists++; addGold(a, 100, true); gainXp(a, 40 + u.level * 12); } }
    // whoever has a buff or a shield of his on the killer at that moment helped too
    const sup = new Set();
    for (const b of killer.buffs) { const s = b.src; if (s && s !== killer && s.kind === 'hero' && s.team === killer.team && !sup.has(s) && !(G.time - (u.dmgBy[s.id] || -99) < 10)) { sup.add(s); s.assists++; addGold(s, 100, true); gainXp(s, 40 + u.level * 12); } }
  } else for (const h of G.heroes) if (h.alive && h.team !== u.team && udist(h, u) < 17) gainXp(h, 40 + u.level * 10);
  for (const o of G.heroes) if (o.team !== u.team && o.def.onHeroDeath && (o === killer || (o.alive && udist(o, u) < 14))) o.def.onHeroDeath(o, u);
  u.streak = 0; u.feed = (u.feed || 0) + 1; u.dmgBy = {}; u.respawnT = 6 + u.level * 1.9; u.order = null; u.path = null; u.recall = 0; u.castLock = 0;
  FX.explosion(u.x, u.z, 2.6, u.pcol); FX.pillar(u.x, u.z, { r: 1.3, h: 15, color: 0xffffff, life: 0.9 });
  if (G.player && (u === G.player || killer === G.player) && FX.near(u.x, u.z, 40)) { FX.hitstop(0.11); FX.punch(0.9); FX.warp('lens', u.x, 1.4, u.z, { r: 6, str: 1.2, life: 0.5 }); }
  FX.burst(u.x, 1, u.z, { n: 24, color: u.pcol, color2: 0xffffff, speed: [0.3, 1.5], life: [0.8, 1.6], size: [0.35, 0.02], up: 5, rad: 1.2, drag: 1 });
  SFX.at('death', u.x, u.z);
  UI.onKill(killer, u, src);
}
function towerDeath(u, src) {
  const et = 1 - u.team; G.teams[et].towers++;
  NAV.block(u.x, u.z, u.blockR, false);
  u.rig.crystal.visible = false; u.rig.spr.visible = false; u.rig.body.scale.y = 0.3; u.rig.body.rotation.z = 0.12; if (u.aim) u.aim.visible = false;
  for (const m of u.rig.mats) m.color.setScalar(0.45);
  if (u.tier === 2) G.super[et][u.lane] = true;
  refreshProtection();
  for (const h of G.heroes) if (h.team === et) { addGold(h, 150, h.isPlayer); gainXp(h, 90); }
  FX.explosion(u.x, u.z, 7, TEAM_COL[u.team]); FX.pillar(u.x, u.z, { r: 3, h: 22, color: TEAM_COL[u.team], life: 1.2 });
  for (let i = 0; i < 5; i++) after(i * 0.12, () => FX.explosion(u.x + rand(-3, 3), u.z + rand(-3, 3), rand(2, 4), 0xffc070));
  FX.smoke(u.x, u.z, 5, 16); FX.shake(0.8); SFX.at('tower', u.x, u.z);
  UI.onTower(u);
}
function refreshProtection() {
  const up = (team, lane, tier) => G.units.some(o => o.kind === 'tower' && o.alive && o.team === team && o.lane === lane && (!tier || o.tier === tier));
  for (const u of G.units) {
    if (u.kind === 'tower' && u.tier === 2) u.protected = up(u.team, u.lane, 1);
    if (u.kind === 'core') u.protected = LANE_NAMES.every(ln => up(u.team, ln));
  }
}
// the player gives the match up: his own crystal breaks and the other side wins
function surrender() {
  const P = G.player; if (!P || G.over || G.state !== 'play' || G.sandbox) return false;
  G.surrender = true; G.paused = false; endGame(1 - P.team, G.cores[P.team]); return true;
}
function endGame(winner, core) {
  if (G.over) return; G.over = true; G.winner = winner; G.overT = 0; G.overCore = core;
  if (typeof UI !== 'undefined' && UI.record) UI.record();   // the result is saved the moment the crystal falls, not when the results window opens 3 s later
  core.rig.crystal.visible = false; core.rig.spr.visible = false; if (core.rig.orbit) core.rig.orbit.visible = false; if (core.aim) core.aim.visible = false;
  FX.explosion(core.x, core.z, 10, TEAM_COL[core.team]); FX.pillar(core.x, core.z, { r: 5, h: 40, color: 0xffffff, life: 2.5 }); SFX.play('tower');
  for (let i = 0; i < 14; i++) after(0.15 + i * 0.16, () => { FX.explosion(core.x + rand(-6, 6), core.z + rand(-6, 6), rand(2.5, 6), i % 2 ? 0xffc070 : TEAM_COL[core.team]); if (i % 3 === 0) SFX.play('boom', 0.7); });
  FX.shake(1.2);
}

/* ---------- heroes ---------- */
function makeHero(def, team, isPlayer) {
  const h = makeUnit({
    kind: 'hero', def, team, isPlayer: !!isPlayer, name: def.name, radius: 0.9, range: def.stats.range, level: 1, xp: 0, gold: 550, goldTotal: 550, items: [], cd: [0, 0, 0, 0], al: [0, 0, 0, 0], sp: 1, castI: 0, heap: 0,
    kills: 0, deaths: 0, assists: 0, cs: 0, streak: 0, order: null, path: null, pathI: 0, recall: 0, castLock: 0, dash: null, respawnT: 0, dmgBy: {}, pcol: def.look.glow,
    mana: 0, maxMana: 0, haste: 0, inBase: true, thorns: 0, dmgHero: 0, dmgTower: 0, dmgTaken: 0, healDone: 0, icd: {}
  });
  h.rig = buildHero(def.look, isPlayer ? 0xeaffea : TEAM_COL[team]);
  recalcHero(h); h.hp = h.maxHp; h.mana = h.maxMana; placeRig(h); G.heroes.push(h); return h;
}
function recalcHero(h) {
  const S = h.def.stats, L = h.level - 1, it = {};
  for (const id of h.items) { const s = ITEM[id].stats; for (const k in s) it[k] = (it[k] || 0) + s[k]; }
  h.def.abilities.forEach((ab, i) => { if (ab && ab.passive && h.al[i] > 0) { const s = ab.stats(h.al[i], h); for (const k in s) it[k] = (it[k] || 0) + s[k]; } });
  const I = k => it[k] || 0, om = h.maxHp, omm = h.maxMana;
  h.maxHp = S.hp + S.hpL * L + I('hp'); h.maxMana = S.mana + S.manaL * L + I('mana'); h.bAd = S.ad + S.adL * L + I('ad'); h.bAp = I('ap'); h.bDef = S.def + S.defL * L + I('def');
  h.bAs = S.as * (1 + (S.asL || 0.02) * L + I('as')); h.bMs = S.ms + I('ms'); h.haste = I('haste'); h.bLs = I('ls'); h.thorns = I('thorns');
  h.crit = Math.min(1, I('crit')); h.apen = Math.min(0.6, I('apen')); h.mpen = Math.min(0.6, I('mpen')); h.onhit = I('onhit'); h.slowHit = I('slowHit'); h.structDmg = I('structDmg');
  h.burn = I('burn'); h.omni = I('omni'); h.hpRegen = I('hpRegen'); h.manaRegen = I('manaRegen'); h.ten = Math.min(0.5, I('ten')); h.goldRate = I('gold'); h.lowShield = I('lowShield') > 0; h.castRange = I('castRange'); h.scrit = Math.min(1, I('scrit')); h.healPow = I('healPow'); h.tithe = Math.min(0.4, I('tithe')); h.chill = Math.min(0.6, I('chill')); h.grace = I('grace') > 0; h.auras = h.items.map(id => ITEM[id]).filter(it => it.aura);
  h.hp += Math.max(0, h.maxHp - om); h.mana += Math.max(0, h.maxMana - omm);
}
function respawn(h) {
  const f = BASES[h.team].fountain, a = rand(TAU);
  h.x = f.x + Math.sin(a) * 3; h.z = f.z + Math.cos(a) * 3; h.hp = h.maxHp; h.mana = h.maxMana; h.alive = true; h.dead = false; h.facing = h.team === 0 ? 2.35 : -0.8;
  h.rig.root.visible = true; h.rig.root.position.set(h.x, 0, h.z); h.rig.tilt.rotation.x = 0; h.atkCd = 0; h.recallCd = 0;
  addBuff(h, { id: 'spawn', dur: 1.5, invuln: true });
  FX.pillar(h.x, h.z, { r: 1.6, h: 14, color: TEAM_COL[h.team], life: 0.8 }); FX.ring(h.x, h.z, { r1: 4, color: TEAM_COL[h.team], life: 0.6, tex: 'shock' });
  if (h.isPlayer) SFX.play('heal');
}
// raise a fallen hero where he lies (Lin's ultimate): `hpK` of his health, at least half his mana, a moment of invulnerability
function revive(h, hpK) {
  if (!h.dead) return false; const q = NAV.nearest(h.x, h.z);
  h.x = q.x; h.z = q.z; h.alive = true; h.dead = false; h.respawnT = 0; h.hp = h.maxHp * hpK; h.mana = Math.max(h.mana, h.maxMana * 0.5); h.atkCd = 0; h.order = null; h.path = null; h.recallCd = 0;
  h.rig.root.visible = true; h.rig.root.position.set(h.x, 0, h.z); h.rig.tilt.rotation.x = 0; h.anim.deathT = 0;
  addBuff(h, { id: 'spawn', dur: 1.5, invuln: true }); if (h.isPlayer) { SFX.play('heal'); G.camSnap = true; }
  return true;
}
function setMove(h, x, z) { const p = NAV.path(h.x, h.z, x, z); h.path = p; h.pathI = 0; }
function moveAlong(u, dt) {
  if (!u.path || u.pathI >= u.path.length) { u.moving = false; u.path = null; return false; }
  let rem = u.ms * dt;
  while (rem > 0 && u.pathI < u.path.length) {
    const p = u.path[u.pathI], dx = p.x - u.x, dz = p.z - u.z, d = Math.hypot(dx, dz);
    if (d <= rem) { u.x = p.x; u.z = p.z; rem -= d; u.pathI++; }
    else { u.x += dx / d * rem; u.z += dz / d * rem; u.facing = Math.atan2(dx, dz); rem = 0; }
  }
  u.moving = true; return true;
}
// walk toward a point; when the straight step is blocked, steer around the obstacle and keep to the chosen side for a moment
function stepToward(u, x, z, dt) {
  const dx = x - u.x, dz = z - u.z, d = Math.hypot(dx, dz); if (d < 0.05) { u.moving = false; return; }
  const st = Math.min(d, u.ms * dt), a0 = Math.atan2(dx, dz), look = Math.max(st, 1.1);
  const tryA = a => { const nx = u.x + Math.sin(a) * st, nz = u.z + Math.cos(a) * st; if (NAV.ok(nx, nz) && NAV.ok(u.x + Math.sin(a) * look, u.z + Math.cos(a) * look)) { u.x = nx; u.z = nz; u.facing = a; return true; } return false; };
  u.moving = true;
  if (tryA(a0)) return;
  if (!u.steerSide || G.time > (u.steerT || 0)) u.steerSide = Math.random() < 0.5 ? 1 : -1;
  u.steerT = G.time + 1.2;
  for (const s of [u.steerSide, -u.steerSide]) for (const m of [0.5, 1.0, 1.5, 2.0]) if (tryA(a0 + s * m)) { u.steerSide = s; return; }
  const nx = u.x + dx / d * st, nz = u.z + dz / d * st; if (NAV.ok(nx, nz)) { u.x = nx; u.z = nz; u.facing = a0; return; }
  u.moving = false;
}
function startAttack(u, t) {
  u.windup = Math.min(0.3, 0.22 / u.as); u.atkCd = 1 / u.as; u.windupTgt = t; u.facing = angTo(u.x, u.z, t.x, t.z);
  u.anim.atkT = u.anim.atkDur = u.windup / 0.5; u.moving = false;
}
function performHit(u, t) {
  u.windup = 0; const hero = u.kind === 'hero';
  if (u.range < 5) {
    basicHit(u, t);
    if ((hero && !u.def.noSlash) || u.boss) { FX.slash(u.x + Math.sin(u.facing) * 1.3, u.z + Math.cos(u.facing) * 1.3, u.facing, { r: u.boss ? 4 : 2.4, color: u.pcol, flip: u.anim.alt, life: 0.2 }); SFX.at('slash', u.x, u.z, 0.6); if (u.boss) { FX.shock(t.x, t.z, 4, 0.8, 0.4); FX.debris(t.x, 0.3, t.z, { n: 5, color: 0x45423c, speed: [3, 8], up: 9, size: [0.2, 0.5] }); } }
    FX.hit(t.x, t.height * 0.55, t.z, u.pcol || 0xffd9a0, hero); if (!hero) SFX.at('hit', t.x, t.z, 0.25);
  } else {
    const st = u.struct;
    homing(u, t, {
      speed: st ? 32 : (hero ? 36 : 24), color: u.pcol || 0xffe0a0, size: st ? 1 : (hero ? 0.5 : 0.32), mesh: hero ? (u.def.projMesh || 'bolt') : (st ? 'orb' : null),
      y: st ? (u.kind === 'core' ? 5.4 : 8.6) : u.height * 0.62,
      onHit: tt => { basicHit(u, tt); FX.hit(tt.x, tt.height * 0.55, tt.z, u.pcol || 0xffe0a0, hero || st); if (st) { FX.ring(tt.x, tt.z, { r1: 2.2, color: u.pcol, life: 0.3, tex: 'shock' }); SFX.at('hit', tt.x, tt.z, 0.6); } }
    });
    if (st) { u.shotFlash = 0.5; SFX.at('towershot', u.x, u.z, 0.8); } else SFX.at(hero ? (u.def.atkSfx || 'shoot') : 'shoot', u.x, u.z, hero ? 0.55 : 0.2);
  }
  u.anim.alt = !u.anim.alt;
}
function basicHit(u, t) {
  // a blinded unit swings and misses
  if (u.blinded) { const P = G.player; if (P && (u === P || t === P || u.buffs.some(b => b.blind && b.src === P))) FX.text(t.x, t.height + 0.6, t.z, 'промах', '#aab3c4', 13); return; }
  // the future seen a moment ahead (Akito): a share of attacks — any attack, never an ability — simply misses
  if (t.dodge > 0 && !t.stunned && !t.dead && Math.random() < t.dodge) { if (t.def && t.def.onDodge) t.def.onDodge(t, u); return; }
  let d = u.ad, crit = false;
  if (u.struct) { if (t.kind === 'hero') { d *= 1 + u.ramp * 0.35; u.ramp = Math.min(4, u.ramp + 1); } else if (t.mtype === 'siege') d *= 0.6; }
  else if (u.kind === 'minion') { if (t.struct) d *= u.mtype === 'siege' ? 1.5 : 0.6; else if (t.kind === 'hero') d *= 0.7; }
  for (const b of u.buffs) if (b.onHit) d += b.onHit(u, t, b) || 0;
  if (t.struct) { if (u.structDmg) d *= 1 + u.structDmg; }
  else if (u.crit && Math.random() < u.crit) { d *= 1.75; crit = true; }
  damage(u, t, d, 0, { basic: true, crit });
  if (!t.struct && t.alive) { if (u.onhit) damage(u, t, u.onhit, 1, { dot: true }); if (u.slowHit) slow(u, t, u.slowHit, 1, 'frostblade'); }
}
function cancelRecall(h) { h.recall = 0; if (h.recallFx) { h.recallFx.dead = true; h.recallFx = null; } }
// a teleport broken by damage or a stun (not by the hero's own orders) cannot be started again for 15 seconds
const RECALL_CD = 15;
function breakRecall(h) {
  if (!(h.recall > 0)) return; cancelRecall(h); h.recallCd = G.time + RECALL_CD;
  if (FX.near(h.x, h.z, 45)) { FX.ring(h.x, h.z, { r0: 1.9, r1: 3.2, color: 0xff6a5e, life: 0.35, tex: 'ringThin' }); FX.sparks(h.x, 1.4, h.z, { n: 14, color: 0xffffff, color2: TEAM_COL[h.team], speed: [4, 11], life: [0.2, 0.5], w: 0.1 }); FX.debris(h.x, 1.2, h.z, { glow: true, n: 6, color: TEAM_COL[h.team], speed: [2, 6], up: 5, size: [0.12, 0.3], life: 0.6 }); SFX.at('shatter', h.x, h.z, 0.6); }
  if (h.isPlayer && !h.ai) { UI.msg('Телепорт сорван: перезарядка ' + RECALL_CD + ' сек'); UI.msgT = 2.6; }
}
function startRecall(h) {
  if (h.dead || h.stunned || h.dash || h.recall > 0 || h.recallCd > G.time) return;
  h.recall = 4.5; h.order = null; h.path = null; h.moving = false; h.windup = 0;
  h.recallFx = FX.aura(h, TEAM_COL[h.team], 4.6, 1.9, 'rune', 3.5); if (h.isPlayer) SFX.play('recall');
}
function autoAcquire(h) {
  let best = null, bd = 1e9;
  for (const u of G.units) {
    if (!u.alive || !hostile(h, u) || !targetable(h, u)) continue; if (u.kind === 'monster' && !u.target) continue;
    const d = udist(h, u) - u.radius; if (d > h.range + 0.4) continue; const sc = d + (u.struct ? 6 : 0) - (u.kind === 'hero' ? 2 : 0);
    if (sc < bd) { bd = sc; best = u; }
  }
  return best;
}
function updateHero(h, dt) {
  if (h.dead) { h.respawnT -= dt; if (h.respawnT <= 0) respawn(h); return; }
  if (h.dummy) { h.maxHp = 200000; if (G.time - h.lastDamageT > 3) h.hp = h.maxHp; h.moving = false; return; }
  if (G.sandbox && h.isPlayer) { h.gold = 99999; if (G.sandbox.nocd) for (let i = 0; i < 4; i++) if (h.cd[i] > 0.4) h.cd[i] = 0.4; }
  if (h.def.tick) h.def.tick(h, dt);
  if (h.auras && h.auras.length) updateAuras(h, dt);
  const ooc = G.time - h.lastDamageT > 5 ? 2.6 : 1;
  h.hp = Math.min(h.maxHp, h.hp + (h.maxHp * 0.0035 * ooc + (h.hpRegen || 0)) * (1 - (h.healCut || 0)) * dt); h.mana = Math.min(h.maxMana, h.mana + (h.maxMana * 0.009 * ooc + 1.2 + (h.manaRegen || 0)) * dt);
  const f = BASES[h.team].fountain; h.inBase = dist(h.x, h.z, f.x, f.z) < 11;
  if (h.inBase) { h.hp = Math.min(h.maxHp, h.hp + h.maxHp * 0.22 * dt); h.mana = Math.min(h.maxMana, h.mana + h.maxMana * 0.22 * dt); }
  for (let i = 0; i < 4; i++) if (h.cd[i] > 0) h.cd[i] -= dt;
  if (h.atkCd > 0) h.atkCd -= dt;
  if (h.stunned) { h.moving = false; h.windup = 0; return; }
  if (h.dash) { updateDash(h, dt); h.moving = false; return; }
  if (h.forced) { h.moving = false; return; }
  if (h.castLock > 0) { h.castLock -= dt; h.moving = false; return; }
  if (h.recall > 0) {
    if (h.order) cancelRecall(h);
    else {
      h.recall -= dt; h.moving = false;
      if (Math.random() < dt * 30) FX.burst(h.x, 0.2, h.z, { n: 1, color: TEAM_COL[h.team], speed: [0.2, 0.6], life: [0.6, 1], size: [0.25, 0.02], up: 5, rad: 1.5, ring: true });
      if (h.recall <= 0) {
        FX.pillar(h.x, h.z, { r: 1.5, h: 16, color: TEAM_COL[h.team], life: 0.6 }); cancelRecall(h);
        h.x = f.x; h.z = f.z; FX.pillar(h.x, h.z, { r: 1.5, h: 16, color: TEAM_COL[h.team], life: 0.6 }); if (h.isPlayer) { SFX.play('heal'); G.camSnap = true; }
      }
      return;
    }
  }
  if (h.windup > 0) {
    h.windup -= dt; h.moving = false; const t = h.windupTgt;
    if (!t || !t.alive) { h.windup = 0; h.atkCd = 0.15; } else { h.facing = angTo(h.x, h.z, t.x, t.z); if (h.windup <= 0) performHit(h, t); }
    return;
  }
  const o = h.order;
  if (o && o.type === 'attack') {
    const t = o.tgt;
    if (!t.alive || !targetable(h, t)) { h.order = null; h.path = null; h.moving = false; }
    else {
      const d = udist(h, t) - t.radius, rng = h.spinning ? 1.2 : h.range;
      if (d <= rng) { h.path = null; h.moving = false; h.facing = angTo(h.x, h.z, t.x, t.z); if (h.atkCd <= 0 && !h.spinning) startAttack(h, t); }
      else if (!h.rooted) { o.rp -= dt; if (o.rp <= 0 || !h.path) { o.rp = 0.3; setMove(h, t.x, t.z); } moveAlong(h, dt); }
      else h.moving = false;
    }
  } else if (o && o.type === 'move') {
    if (h.rooted) h.moving = false; else if (!moveAlong(h, dt)) h.order = null;
  } else {
    h.moving = false;
    if (h.atkCd <= 0 && !h.spinning && (h.isPlayer || h.ai)) { const t = autoAcquire(h); if (t) startAttack(h, t); }
  }
}

/* ---------- abilities ---------- */
function castAbility(h, i, pt) {
  const ab = h.def.abilities[i]; if (!ab) return false;
  if (h.dead || h.stunned || h.silenced || h.cd[i] > 0 || h.dash || h.castLock > 0 || h.forced) return false;
  if (ab.passive || !h.al[i]) return false;
  const free = ab.free ? ab.free(h) : false;
  if (!free && h.mana < ab.cost) return false;
  const dx = pt.x - h.x, dz = pt.z - h.z; let d = Math.hypot(dx, dz) || 0.001, x = pt.x, z = pt.z, dir = Math.atan2(dx, dz), unit = null;
  const ty = ab.ind.type, rng = abRange(h, ab); h.castI = i;
  if (ty === 'target' || ty === 'ally' || ty === 'any' || ty === 'note') {
    unit = pt.unit; if (!unit || !unit.alive) return false;
    if (ty !== 'note' && udist(h, unit) > rng + unit.radius + 0.6) return false;   // 'note': a name picked from a list, at any distance
    x = unit.x; z = unit.z; if (ty === 'note') dir = h.facing; else if (unit !== h) dir = angTo(h.x, h.z, x, z);
  } else if (rng && d > rng) { x = h.x + dx / d * rng; z = h.z + dz / d * rng; d = rng; }
  if (ty !== 'self' && ty !== 'note') h.facing = dir;
  const r = ab.cast(h, { x, z, dir, dist: d, unit, range: rng }); if (r === false) return false;
  FX.castCue(h, i, ab);
  if (!free) h.mana -= ab.cost;
  h.cd[i] = (r && r.cd !== undefined) ? r.cd : ab.cd * 100 / (100 + h.haste);
  if (!h.dash) h.castLock = ab.lock === undefined ? 0.2 : ab.lock;
  h.windup = 0; if (h.recall > 0) cancelRecall(h);
  if (!ab.toggle) { h.anim.castT = h.anim.castDur = ab.animDur || 0.45; h.anim.castType = ab.anim || 'cast'; h.anim.atkT = 0; }
  return true;
}
function D(h, base, perLvl, adR, apR) { return base + perLvl * (abEff(h) - 1) + (adR || 0) * h.ad + (apR || 0) * h.ap; }

function homing(src, tgt, o) {
  const p = { hom: true, src, tgt, x: src.x + Math.sin(src.facing) * 0.8, y: o.y || 1.6, z: src.z + Math.cos(src.facing) * 0.8, o, mesh: null, rib: null };
  if (o.x !== undefined) { p.x = o.x; p.z = o.z; }
  if (o.mesh && FX.near(src.x, src.z, 70)) { p.mesh = FX.projMesh(o.mesh, o.color, o.size); p.rib = FX.ribbon(o.color, o.size * 1.2 + 0.3, 10); }
  G.proj.push(p); return p;
}
function shot(src, o) {
  const dir = o.dir, p = {
    lin: true, src, team: src.team, x: o.x === undefined ? src.x + Math.sin(dir) * 1.0 : o.x, z: o.z === undefined ? src.z + Math.cos(dir) * 1.0 : o.z, y: o.y || 1.5,
    vx: Math.sin(dir) * o.speed, vz: Math.cos(dir) * o.speed, left: o.range + (src.castRange || 0), w: o.w || 0.8, hit: new Set(), o, mesh: null, rib: null, dir, n: 0
  };
  if (o.mesh !== false) { p.mesh = FX.projMesh(o.mesh || 'bolt', o.color, o.size || 1); p.mesh.rotation.y = dir; p.mesh.position.set(p.x, p.y, p.z); }
  if (o.ribbon !== false) p.rib = FX.ribbon(o.color, o.ribbon || ((o.size || 1) * 0.8 + 0.35), 14);
  G.proj.push(p); return p;
}
function updateProjectiles(dt) {
  const P = G.proj, ts = G.tstop && G.time < G.tstop.until ? G.tstop : null;
  for (let i = P.length - 1; i >= 0; i--) {
    const p = P[i], o = p.o; let end = false;
    if (ts && p.src.team !== ts.team && dist(p.x, p.z, ts.x, ts.z) < ts.r) continue;   // stopped time: enemy projectiles hang in the air
    if (p.hom) {
      const t = p.tgt;
      if (!t.alive) end = true;
      else {
        const tx = t.x, ty = t.height * 0.55 + (t.yOff || 0), tz = t.z, dx = tx - p.x, dy = ty - p.y, dz = tz - p.z, d = Math.hypot(dx, dy, dz), st = o.speed * dt;
        if (d <= st + 0.5) { o.onHit(t); end = true; } else { p.x += dx / d * st; p.y += dy / d * st; p.z += dz / d * st; if (p.mesh) { p.mesh.position.set(p.x, p.y, p.z); p.mesh.lookAt(tx, ty, tz); } }
        FX.trail(p.x, p.y, p.z, o.color, o.size * 1.2, p.mesh ? 2 : 1);
        if (!p.mesh) FX.ps.emit(p.x, p.y, p.z, 0, 0, 0, 0.06, o.size * 2.4, o.size * 2, hexRGB(o.color), hexRGB(o.color), 0, 0, 1);
      }
    } else {
      const st = o.speed * dt, n = Math.max(1, Math.ceil(st / 0.6));
      for (let s = 0; s < n && !end; s++) {
        p.x += p.vx * dt / n; p.z += p.vz * dt / n; p.left -= st / n;
        for (const u of G.units) {
          if (!u.alive || u.struct || p.hit.has(u.id)) continue;
          const en = u.team !== p.team || (u !== p.src && (u.madT > G.time || p.src.madT > G.time)); if (!en && !(o.onAlly && u.kind === 'hero' && u !== p.src)) continue; if (en && o.heroOnly && u.kind !== 'hero') continue;
          const rr = p.w + u.radius, dx = u.x - p.x, dz = u.z - p.z; if (dx * dx + dz * dz > rr * rr) continue;
          p.hit.add(u.id);
          if (en) { o.onHit(u, p); p.n++; if (!o.pierce) { end = true; break; } } else o.onAlly(u, p);
        }
        if (p.left <= 0) end = true;
      }
      if (p.mesh) { p.mesh.position.set(p.x, p.y, p.z); if (o.spin) p.mesh.rotation.y += dt * o.spin; }
      if (o.trail) o.trail(p); else FX.trail(p.x, p.y, p.z, o.color, (o.size || 1) * 0.5, 2);
      if (end && o.onEnd) o.onEnd(p.x, p.z, p);
    }
    if (p.rib) { if (end) p.rib.end(); else p.rib.add(p.x, p.y, p.z); }
    if (end) { if (p.mesh) FX.killMesh(p.mesh); P.splice(i, 1); }
  }
}
function dashTo(u, x, z, speed, o) {
  o = o || {}; if (o.fly) { const q = NAV.nearest(x, z); x = q.x; z = q.z; }
  u.dash = { x, z, speed, o, hit: new Set(), total: Math.max(0.01, dist(u.x, u.z, x, z)), rib: o.ribbon === false ? null : FX.ribbon(o.ribbon || u.pcol || 0xffffff, 1.8, 12) };
  u.path = null; u.moving = false; u.windup = 0; u.castLock = 0;
}
function updateDash(u, dt) {
  const D2 = u.dash, o = D2.o; if (o.follow && o.follow.alive) { D2.x = o.follow.x; D2.z = o.follow.z; }
  const dx = D2.x - u.x, dz = D2.z - u.z, d = Math.hypot(dx, dz), stop = o.stop || 0; let st = D2.speed * dt, done = false;
  if (d > 0.01) u.facing = Math.atan2(dx, dz);
  if (d - stop <= st) { st = Math.max(0, d - stop); done = true; }
  if (d > 0.01 && st > 0) { const nx = u.x + dx / d * st, nz = u.z + dz / d * st; if (!o.fly && !NAV.ok(nx, nz)) done = true; else { u.x = nx; u.z = nz; } }
  if (o.arc) u.yOff = Math.sin(Math.PI * clamp(1 - d / D2.total, 0, 1)) * o.arc;
  if (o.trail) o.trail(u);
  if (D2.rib) D2.rib.add(u.x, 1.1 + (u.yOff || 0), u.z);
  if (o.onHit) for (const e of enemiesIn(u, u.x, u.z, o.w || 1.1)) if (!D2.hit.has(e.id)) { D2.hit.add(e.id); if (o.onHit(e, u) === true) { done = true; break; } }
  if (done) { u.dash = null; u.yOff = 0; if (D2.rib) D2.rib.end(); if (!NAV.ok(u.x, u.z)) { const q = NAV.nearest(u.x, u.z); u.x = q.x; u.z = q.z; } if (o.onEnd) o.onEnd(u); }
}
function blink(u, x, z) { const q = NAV.nearest(x, z); u.x = q.x; u.z = q.z; u.path = null; if (u.order && u.order.type === 'move') u.order = null; }
function knock(u, fx, fz, d, dur) { if (u.struct || u.boss || !u.alive) return; const a = angTo(fx, fz, u.x, u.z); u.forced = { vx: Math.sin(a) * d / dur, vz: Math.cos(a) * d / dur, t: dur }; u.dash = null; }
function pullTo(u, x, z, speed, stop) { if (u.struct || u.boss || !u.alive) return 0; const d = Math.max(0, dist(u.x, u.z, x, z) - (stop || 2)), t = d / speed, a = angTo(u.x, u.z, x, z); u.forced = { vx: Math.sin(a) * speed, vz: Math.cos(a) * speed, t }; u.dash = null; return t; }
function zone(src, o) {
  const z = { src, x: o.x, z: o.z, r: o.r, t: 0, n: 0 }; let acc = o.first ? o.every : 0;
  G.actors.push({ update(dt) { z.t += dt; acc += dt; while (acc >= o.every && z.t <= o.dur + 0.01) { acc -= o.every; z.n++; o.tick(z); } if (z.t >= o.dur) { if (o.end) o.end(z); return false; } return true; } });
  return z;
}

/* ---------- minions ---------- */
function spawnMinion(team, lane, type) {
  const L = LANES[lane], s0 = team === 0 ? 15 : L.len - 15, p = lanePoint(L, s0), lv = G.time / 60;
  const st = type === 'melee' ? { maxHp: 330 + lv * 26, bAd: 15 + lv * 1.6, range: 2.1, gold: 22, xp: 34, radius: 0.75 }
    : type === 'ranged' ? { maxHp: 220 + lv * 14, bAd: 24 + lv * 1.7, range: 8.5, gold: 17, xp: 26, radius: 0.65 }
      : { maxHp: 760 + lv * 45, bAd: 42 + lv * 3, range: 9.5, gold: 46, xp: 60, radius: 1.1 };
  const u = makeUnit(Object.assign({ kind: 'minion', mtype: type, team, lane, off: rand(-3.4, 3.4), x: p.x + rand(-1.5, 1.5), z: p.z + rand(-1.5, 1.5), bAs: type === 'siege' ? 0.55 : 0.8, bMs: 7.2, bDef: type === 'siege' ? 15 : 0, pcol: team === 0 ? 0x8fc0ff : 0xff9a8e, facing: team === 0 ? 2.35 : -0.8 }, st));
  u.wdT = G.time; u.wdX = u.x; u.wdZ = u.z; u.path = null;
  u.rig = buildMinion(type, team, 1); placeRig(u); return u;
}
function acquire(m) {
  let best = null, bs = 1e9; const R = Math.max(10, m.range + 2), L = LANES[m.lane];
  for (const u of G.units) {
    if (!u.alive || (u.team === m.team && !(u.madT > G.time)) || u.team === 2 || !targetable(m, u)) continue;
    const d = udist(m, u) - u.radius; if (d > R) continue;
    // leash: a wave never follows a hero off its lane into the jungle
    if (u.kind === 'hero' && d > m.range) { laneProject(L, u.x, u.z); if (laneProject.d > 10) continue; }
    let sc = d; if (u.kind === 'hero') { sc += 5; if (G.time - u.heroAggroT < 2) sc -= 12; } else if (u.struct) sc += 2.5; if (u === m.target) sc -= 2;
    if (sc < bs) { bs = sc; best = u; }
  }
  m.target = best;
}
// minion locomotion: local steering first; a watchdog switches to a real A* route whenever that stops making progress
function minionDetour(m, x, z, secs) { m.path = NAV.path(m.x, m.z, x, z); m.pathI = 0; m.detourT = G.time + secs; m.wdT = G.time; m.wdX = m.x; m.wdZ = m.z; }
function minionGo(m, x, z, dt, far) {
  if (m.path) {
    if (G.time < m.detourT && moveAlong(m, dt)) return;
    m.path = null; m.wdT = G.time; m.wdX = m.x; m.wdZ = m.z;
  }
  if (!NAV.ok(m.x, m.z)) { const q = NAV.nearest(m.x, m.z); m.x = q.x; m.z = q.z; }
  stepToward(m, x, z, dt);
  if (G.time - m.wdT >= 0.6) {
    const moved = dist(m.x, m.z, m.wdX, m.wdZ), want = m.ms * (G.time - m.wdT);
    if (moved < want * 0.3 && dist(m.x, m.z, x, z) > 1.5) { const g = far || { x, z }; minionDetour(m, g.x, g.z, 2 + rand(0.8)); return; }
    m.wdT = G.time; m.wdX = m.x; m.wdZ = m.z;
  }
}
function updateMinion(m, dt) {
  if (m.dead) { m.deathT += dt; if (m.deathT > 0.6) m.remove = true; return; }
  if (m.atkCd > 0) m.atkCd -= dt;
  if (m.stunned || m.forced) { m.moving = false; m.windup = 0; m.wdT = G.time; m.wdX = m.x; m.wdZ = m.z; return; }
  if (m.windup > 0) { m.windup -= dt; m.moving = false; const t = m.windupTgt; if (!t || !t.alive) m.windup = 0; else if (m.windup <= 0) performHit(m, t); m.wdT = G.time; m.wdX = m.x; m.wdZ = m.z; return; }
  m.think -= dt; if (m.think <= 0) { m.think = 0.3 + rand(0.12); acquire(m); }
  let t = m.target; if (t && (!t.alive || !targetable(m, t))) t = m.target = null;
  if (t) {
    const d = udist(m, t) - t.radius;
    if (d <= m.range) { m.moving = false; m.path = null; m.wdT = G.time; m.wdX = m.x; m.wdZ = m.z; m.facing = angTo(m.x, m.z, t.x, t.z); if (m.atkCd <= 0) startAttack(m, t); }
    else if (!m.rooted) minionGo(m, t.x, t.z, dt); else m.moving = false;
  } else if (!m.rooted) {
    const L = LANES[m.lane], dirS = m.team === 0 ? 1 : -1, s = laneProject(L, m.x, m.z), off0 = laneProject.d;
    if (off0 > 7.2 && !m.path) { const q = lanePoint(L, s + dirS * 4); minionDetour(m, q.x, q.z, 9); }   // pushed or lured off the lane: route back
    const p = lanePoint(L, s + dirS * 5); let off = off0 > 6 ? 0 : m.off;
    // squeeze the formation to the free side while passing a tower that stands on the lane edge
    for (const tw of G.laneTowers[m.lane]) {
      if (!tw.alive) continue; const ds = (tw.laneS - s) * dirS; if (ds < -6 || ds > 14) continue;
      const w = ds > 9 ? (14 - ds) / 5 : (ds < -2 ? (ds + 6) / 4 : 1), lim = Math.abs(tw.lat) - tw.blockR - 1.3;
      if (tw.lat > 0) { if (off > lim) off = lerp(off, lim, w); } else if (off < -lim) off = lerp(off, -lim, w);
    }
    const far = lanePoint(L, s + dirS * 11);
    minionGo(m, p.x + p.dz * off, p.z - p.dx * off, dt, far);
  } else m.moving = false;
}

/* ---------- structures ---------- */
function makeStructure(kind, team, lane, tier, x, z) {
  const core = kind === 'core';
  const u = makeUnit({ kind, struct: true, team, lane, tier, x, z, radius: core ? 4.4 : 2.3, maxHp: core ? 5400 : (tier === 1 ? 2800 : 3600), bAd: core ? 150 : (tier === 1 ? 112 : 138), bDef: 35, bAs: 0.95, range: 13.5, bMs: 0, ramp: 0, protected: core || tier === 2, pcol: TEAM_COL[team], name: core ? 'Кристалл' : 'Башня', gold: 0, xp: 0 });
  u.rig = core ? buildCore(team) : buildTower(team, tier); placeRig(u); u.rig.root.rotation.y = 0;
  u.blockR = core ? 5.4 : 3.3; NAV.block(x, z, u.blockR, true);
  u.aim = new THREE.Mesh(FX.geo.line, FX.mat('beam', 0xff2a2a, 0.55)); u.aim.visible = false; u.aim.position.set(x, 0.25, z); u.aim.renderOrder = 6; G.scene.add(u.aim);
  return u;
}
function updateStructure(t, dt) {
  if (!t.alive) return;
  if (t.atkCd > 0) t.atkCd -= dt;
  t.think -= dt;
  if (t.think <= 0) {
    t.think = 0.2; let cur = t.target; const R = t.range;
    if (cur && (!cur.alive || udist(t, cur) > R + cur.radius)) cur = null;
    let call = null; for (const h of G.heroes) if (h.alive && h.team !== t.team && G.time - h.heroAggroT < 1.5 && udist(t, h) <= R + h.radius) { call = h; break; }
    if (call && !(cur && cur.kind === 'hero')) cur = call;
    if (!cur) {
      let bd = 1e9; for (const u of G.units) { if (!u.alive || u.team === t.team || u.team === 2 || u.struct) continue; const d = udist(t, u) - u.radius; if (d > R) continue; const sc = d + (u.kind === 'hero' ? 100 : 0); if (sc < bd) { bd = sc; cur = u; } }
    }
    if (cur !== t.target) { t.target = cur; t.ramp = 0; if (cur && cur.isPlayer) { SFX.play('warn'); UI.flashWarn(); } }
  }
  const c = t.target;
  if (c && c.kind === 'hero') { t.aim.visible = true; t.aim.rotation.y = angTo(t.x, t.z, c.x, c.z); t.aim.scale.set(0.7, 1, udist(t, c)); t.aim.material.opacity = 0.35 + Math.sin(G.time * 18) * 0.2; }
  else t.aim.visible = false;
  if (c && t.atkCd <= 0) { t.atkCd = 1 / t.as; t.facing = angTo(t.x, t.z, c.x, c.z); performHit(t, c); }
}

/* ---------- jungle ---------- */
const BOSS_LOOK = { bulk: 1.55, h: 1.12, c1: 0x45423c, c2: 0x2f2d2a, c3: 0x252320, skin: 0x45423c, glow: 0xb07bff, head: 'golem', chest: 'bare', sh: 'crystal', legs: 'boots', weapon: 'fists', wc: 'fist', arm: 1.45, back: 'crystals', scale: 2.3 };
// monster kinds: [hp, per minute], [attack, per minute]. Camps are built from them (CAMP_KINDS); the kind of each camp is set in map.js
const MON = {
  big: { name: 'Древний зверь', rig: 'beast', r: 1.3, hp: [950, 120], ad: [40, 4], def: 18, as: 0.8, ms: 8.4, range: 2.9, gold: 85, xp: 130, scale: 1.55 },
  small: { name: 'Зверь', rig: 'beast', r: 0.85, hp: [380, 45], ad: [17, 2], def: 6, as: 0.8, ms: 8.4, range: 2.3, gold: 32, xp: 48, scale: 0.95 },
  wolf: { name: 'Лесной волк', rig: 'wolf', r: 0.75, hp: [310, 38], ad: [19, 2.2], def: 4, as: 1.3, ms: 9.8, range: 2.1, gold: 30, xp: 46, scale: 1.0 },
  spit: { name: 'Плевун', rig: 'spitter', r: 0.85, hp: [340, 42], ad: [26, 2.8], def: 5, as: 0.7, ms: 7.6, range: 8.5, gold: 46, xp: 68, scale: 1.15, pcol: 0xb6e23a },
  ogre: { name: 'Лесной великан', rig: 'ogre', r: 1.7, hp: [2100, 250], ad: [60, 6], def: 26, as: 0.6, ms: 7.8, range: 3.3, gold: 190, xp: 290, scale: 1.45, stomp: true }
};
const CAMP_KINDS = { beasts: ['big', 'small', 'small'], wolves: ['wolf', 'wolf', 'wolf', 'wolf'], spitters: ['spit', 'spit', 'small'], ogre: ['ogre'] };
const CAMP_SPOTS = [[0, 0], [2.8, 1.8], [-2.6, 2.2], [0.4, -2.9]];
function makeMonster(x, z, type, camp) {
  const lv = G.time / 60, M = MON[type];
  const u = makeUnit({ kind: 'monster', team: 2, x, z, home: { x, z }, camp, mtype: type, radius: M.r, maxHp: M.hp[0] + lv * M.hp[1], bAd: M.ad[0] + lv * M.ad[1], bDef: M.def, bAs: M.as, bMs: M.ms, range: M.range, gold: M.gold, xp: M.xp, scale: M.scale, pcol: M.pcol || 0xd8c070, name: M.name, facing: rand(TAU), stomp: !!M.stomp, slamCd: 3 });
  u.rig = buildMinion(M.rig, 2, u.scale); placeRig(u); return u;
}
function spawnCamp(i) { const c = CAMPS[i], list = CAMP_KINDS[c.kind || 'beasts']; G.camps[i].alive = list.length; list.forEach((t, k) => makeMonster(c.x + CAMP_SPOTS[k][0], c.z + CAMP_SPOTS[k][1], t, i)); }
function spawnBoss() {
  const lv = G.time / 60;
  const u = makeUnit({ kind: 'monster', boss: true, team: 2, x: BOSS_POS.x, z: BOSS_POS.z, home: { x: BOSS_POS.x, z: BOSS_POS.z }, camp: -1, radius: 2.3, maxHp: 5200 + lv * 380, bAd: 110 + lv * 9, bDef: 45, bAs: 0.6, bMs: 7.5, range: 3.8, gold: 0, xp: 0, pcol: 0xb07bff, name: 'Страж Разлома', facing: -2.35, slamCd: 5 });
  u.rig = buildHero(BOSS_LOOK, 0xb07bff); u.rig.ring.visible = false; placeRig(u); G.boss = u; return u;
}
function monsterAggro(m, src) {
  if (m.reset || src.team === 2) return;
  for (const o of G.units) if (o.alive && o.kind === 'monster' && o.camp === m.camp && !o.reset && (!o.target || !o.target.alive)) o.target = src;
}
function monsterDeath(u, killer) {
  if (u.boss) {
    G.boss = null; G.bossRespawn = G.time + 170;
    FX.explosion(u.x, u.z, 8, 0xb07bff); FX.pillar(u.x, u.z, { r: 4, h: 30, color: 0xb07bff, life: 1.5 }); SFX.at('tower', u.x, u.z);
    const team = killer ? killer.team : (u.lastHitBy ? u.lastHitBy.team : -1);
    if (team >= 0 && team < 2) {
      for (const h of G.heroes) if (h.team === team) { addGold(h, 220, h.isPlayer); gainXp(h, 220); if (h.alive) { const b = addBuff(h, { id: 'riftpower', dur: 100, dmgOut: 1.18, ms: 0.06, every: 1, onTick: (q) => { q.hp = Math.min(q.maxHp, q.hp + q.maxHp * 0.012); } }); if (b) b.fx = FX.aura(h, 0xb07bff, 100, 1.5, 'rune', 2); } }
      UI.announce((team === G.player.team ? 'Ваша команда' : 'Враг') + ' сразил Стража Разлома', team === G.player.team ? '#b99cff' : '#ff6a5e');
      // the Aegis goes to whoever struck the last blow (or, if that was not a hero, to the nearest hero of that side)
      let hold = killer && killer.alive ? killer : null; if (!hold) { let bd = 24; for (const h of G.heroes) if (h.alive && h.team === team && udist(h, u) < bd) { bd = udist(h, u); hold = h; } }
      if (hold) aegisGive(hold);
    }
  } else { const c = G.camps[u.camp]; c.alive--; if (c.alive <= 0) c.respawn = G.time + 75; }
}
function updateMonster(m, dt) {
  if (m.dead) { m.deathT += dt; if (m.deathT > (m.boss ? 4 : 0.6)) m.remove = true; return; }
  if (m.atkCd > 0) m.atkCd -= dt;
  if (m.stunned || m.forced) { m.moving = false; m.windup = 0; return; }
  const dh = dist(m.x, m.z, m.home.x, m.home.z);
  // the Guardian never leaves its pit: step out of reach and it turns back and heals
  if (m.target && (!m.target.alive || dh > (m.boss ? PIT.r + 0.6 : 13) || (m.boss ? dist(m.target.x, m.target.z, m.home.x, m.home.z) > PIT.r + 5.5 : udist(m, m.target) > 17))) { m.target = null; m.reset = true; m.windup = 0; }
  if (m.reset) {
    m.hp = Math.min(m.maxHp, m.hp + m.maxHp * 0.25 * dt);
    if (dh > 0.4) stepToward(m, m.home.x, m.home.z, dt); else { m.moving = false; m.reset = false; }
    return;
  }
  if (m.windup > 0) { m.windup -= dt; m.moving = false; const t = m.windupTgt; if (!t || !t.alive) m.windup = 0; else if (m.windup <= 0) performHit(m, t); return; }
  const t = m.target; if (!t) { m.moving = false; return; }
  if (m.boss || m.stomp) {   // the boss slams where its target stands; a forest giant stomps around itself once someone is close
    m.slamCd -= dt; const B = m.boss, R = B ? 5.5 : 4.2, del = B ? 1.1 : 0.9, col = B ? 0xb07bff : 0xd8a040;
    if (m.slamCd <= 0 && (B || udist(m, t) < R + 0.5)) {
      m.slamCd = B ? 7 : 6; const sx = B ? t.x : m.x, sz = B ? t.z : m.z; m.anim.castT = m.anim.castDur = del; m.anim.castType = 'slam'; if (!B) m.anim.atkT = m.anim.atkDur = del; m.facing = angTo(m.x, m.z, t.x, t.z); m.atkCd = del + 0.2;
      telegraph(m, sx, sz, R, del, col);
      after(del, () => { if (!m.alive) return; FX.explosion(sx, sz, R, col, B ? undefined : { el: 'earth' }); FX.ring(sx, sz, { r1: R, color: col, tex: 'crack', life: 1.2, r0: R - 0.5 }); SFX.at('quake', sx, sz); for (const e of enemiesIn(m, sx, sz, R)) { damage(m, e, m.ad * (B ? 1.6 : 1.3), 1); stun(m, e, B ? 0.8 : 0.6, B ? 1.6 : 1); } });
      return;
    }
  }
  const d = udist(m, t) - t.radius;
  if (d <= m.range) { m.moving = false; m.facing = angTo(m.x, m.z, t.x, t.z); if (m.atkCd <= 0) startAttack(m, t); }
  else if (!m.rooted) stepToward(m, t.x, t.z, dt); else m.moving = false;
}

// Aegis of the Rift: the hero who fells the Guardian carries it for four minutes. A killing blow is undone once: three seconds of stasis, then back up at full strength
function aegisGive(h) {
  h.aegisT = G.time + 240; if (h.aegisFx) h.aegisFx.dead = true; h.aegisFx = FX.aura(h, 0xb07bff, 240, 1.3, 'rune2', 1.2);
  FX.pillar(h.x, h.z, { r: 1.4, h: 16, color: 0xb07bff, life: 1 }); FX.ring(h.x, h.z, { r0: 5, r1: 1, color: 0xb07bff, life: 0.6, tex: 'shock' }); FX.heal(h, 0xb07bff);
  const P = G.player; if (P) { UI.feed('<b style="color:' + TEAM_CSS[h.team] + '">' + h.name + '</b> <span style="color:#8b94a4">забирает</span> <b style="color:#c9a8ff">Эгиду Разлома</b>'); if (h === P) { UI.msg('Эгида Разлома: 4 минуты вы один раз переживёте смертельный удар'); SFX.play('heal'); } }
}
function aegisUse(h) {
  h.aegisT = 0; if (h.aegisFx) { h.aegisFx.dead = true; h.aegisFx = null; }
  for (const b of h.buffs) b.dead = true;   // everything on him is swept away (the buff loop removes them; the array is not cleared here because this can run from inside that loop)
  h.shield = 0; h.dash = null; h.forced = null; h.windup = 0; h.order = null; h.path = null; h.hp = 1; h.dmgBy = {}; h.invuln = true; h.stunned = true; if (h.recall > 0) cancelRecall(h);
  const b = addBuff(h, { id: 'aegis', dur: 3, invuln: true, stun: true, onEnd: u => { if (!u.alive) return; u.hp = u.maxHp; u.mana = u.maxMana; FX.explosion(u.x, u.z, 2.4, 0xb07bff, { smoke: false }); FX.pillar(u.x, u.z, { r: 1.6, h: 18, color: 0xb07bff, life: 0.9 }); FX.ring(u.x, u.z, { r0: 0.5, r1: 6, color: 0xb07bff, life: 0.6, tex: 'shock' }); FX.heal(u, 0xb07bff); SFX.at('heal', u.x, u.z, 1); } });
  if (b) { b.dur = b.max = 3; b.fx = FX.bubble(h, 0xb07bff, 3, h.radius + 1.1); }
  FX.pillar(h.x, h.z, { r: 1.2, h: 20, color: 0xb07bff, life: 3, op: 0.5, grow: true }); FX.zone(h.x, h.z, 2.6, 0xb07bff, 3, { tex: 'rune2', spin: -2, op: 0.9 }); FX.ring(h.x, h.z, { r0: 6, r1: 1, color: 0xb07bff, life: 0.5, tex: 'shock' }); FX.shock(h.x, h.z, 7, -1, 0.5); SFX.at('dark', h.x, h.z, 1);
  if (FX.near(h.x, h.z, 45)) FX.text(h.x, h.height + 1.6, h.z, 'ЭГИДА', '#c9a8ff', 22);
  if (G.player) UI.feed('<b style="color:' + TEAM_CSS[h.team] + '">' + h.name + '</b> <span style="color:#8b94a4">спасён Эгидой Разлома</span>');
}

/* ---------- match flow ---------- */
function clearMatch() {
  for (const u of G.units) { if (u.rig) G.scene.remove(u.rig.root); if (u.aim) G.scene.remove(u.aim); }
  for (const p of G.proj) if (p.mesh) FX.killMesh(p.mesh);
  if (G.rune && G.rune.mesh) G.scene.remove(G.rune.mesh);
  G.units.length = 0; G.heroes.length = 0; G.proj.length = 0; G.actors.length = 0; G.timers.length = 0; G.dangers.length = 0; G.mmFx = []; G.walls = []; G.tstop = null; G.tinv = 0;
  FX.clear(); NAV.build();
  G.time = 0; G.over = false; G.paused = false; G.wave = 0; G.nextWave = 6; G.teams = [{ kills: 0, towers: 0 }, { kills: 0, towers: 0 }];
  G.super = [{ top: false, mid: false, bot: false }, { top: false, mid: false, bot: false }];
  G.camps = CAMPS.map(() => ({ alive: 0, respawn: 25 })); G.boss = null; G.bossRespawn = 120; G.firstBlood = false; G.player = null; G.shake = 0; G.fountT = 0; G.laneT = 12; G.cores = []; G.pLane = null; G.pLaneN = 0; G.obj = [null, null]; G.objT = 4; G.hitstop = 0; G.ca = 0;
}
function setupMatch(heroId, diff, lane, role, pre) {
  clearMatch(); G.diff = diff; lane = lane || 'top'; G.laneTowers = { top: [], mid: [], bot: [] };
  for (let team = 0; team < 2; team++) {
    for (const ln of LANE_NAMES) {
      const L = LANES[ln], ds = ln === 'mid' ? [40, 72] : [50, 100];
      // towers stand at the edge of the lane so waves pass beside them
      ds.forEach((d, i) => {
        const s = team === 0 ? d : L.len - d, p = lanePoint(L, s), c1 = [p.x + p.dz * 4.9, p.z - p.dx * 4.9], c2 = [p.x - p.dz * 4.9, p.z + p.dx * 4.9], d1 = Math.hypot(c1[0], c1[1]), d2 = Math.hypot(c2[0], c2[1]);
        // outer towers hug the outside edge, inner towers the inside (mirrored for both teams); mid lane alternates sides
        const c = Math.abs(d1 - d2) < 0.5 ? (((i === 0 ? -1 : 1) * (team === 0 ? 1 : -1) > 0) ? c1 : c2) : (((i === 1) === (d1 > d2)) ? c1 : c2);
        const tw = makeStructure('tower', team, ln, i === 0 ? 2 : 1, c[0], c[1]); tw.laneS = s; tw.lat = c === c1 ? 4.9 : -4.9; G.laneTowers[ln].push(tw);
      });
    }
    G.cores[team] = makeStructure('core', team, null, 3, BASES[team].core.x, BASES[team].core.z);
  }
  /* team drafting by lane roles. Lanes are split 2-1-2: each side lane gets one damage dealer ('dmg') and one support ('sup'), the middle a solo
     caster or assassin. The player takes the slot they chose (lane + role), so their lane partner always plays the other role.
     Among the side-lane damage dealers each team gets a marksman and a frontliner. */
  const pdef = HEROES.find(h => h.id === heroId), pool = shuffle(HEROES.filter(h => h !== pdef));
  const prole = lane === 'mid' ? 'dmg' : (role === 'sup' || role === 'dmg' ? role : (pdef.role === 'support' ? 'sup' : 'dmg'));
  const takeIf = f => { const i = pool.findIndex(f); return i >= 0 ? pool.splice(i, 1)[0] : null; };
  const pickFor = (slot, pref) => slot.role === 'sup' ? (takeIf(h => h.role === 'support') || pool.shift()) : (takeIf(h => pref.includes(h.role)) || takeIf(h => h.role !== 'support') || pool.shift());
  const draft = team => {
    const flip = Math.random() < 0.5, side = flip ? ['front', 'marks'] : ['marks', 'front'];
    return [{ lane: 'mid', role: 'dmg', pref: ['mage', 'assassin'] }, { lane: 'top', role: 'dmg', pref: [side[0]] }, { lane: 'bot', role: 'dmg', pref: [side[1]] }, { lane: 'top', role: 'sup' }, { lane: 'bot', role: 'sup' }]
      .map(s => { if (team === 0 && s.lane === lane && s.role === prole) return Object.assign(s, { def: pdef, player: true }); return s; });
  };
  const slots = [draft(0), draft(1)];
  // a ranked match comes with both line-ups already drafted: pre = { ally: [{ id, lane, role }] (the four team-mates), enemy: [...] (all five) }
  if (pre) { const mk = s => ({ lane: s.lane, role: s.role, def: HEROES.find(h => h.id === s.id) }); slots[0] = [{ lane, role: prole, def: pdef, player: true }].concat(pre.ally.map(mk)); slots[1] = pre.enemy.map(mk); }
  for (let k = 0; k < 5; k++) for (const t of [0, 1]) { const s = slots[t][k]; if (!s.def) s.def = pickFor(s, s.pref || []); }   // the teams pick in turn
  const spawn = (def, team, i, player) => { const h = makeHero(def, team, player); const f = BASES[team].fountain, a = i / 5 * TAU; h.x = f.x + Math.sin(a) * 4; h.z = f.z + Math.cos(a) * 4; h.facing = team === 0 ? 2.35 : -0.8; h.rig.root.position.set(h.x, 0, h.z); h.rig.root.rotation.y = h.facing; return h; };
  G.pLane = lane; G.pLaneN = 2; G.pRole = prole; G.pMate = null;
  G.player = spawn(pdef, 0, 0, true); G.player.lrole = prole;   // the player first: bots look at G.player when they are set up
  for (const t of [0, 1]) { let n = t === 0 ? 1 : 0; for (const s of slots[t]) { if (s.player) continue; const h = spawn(s.def, t, n++); h.lrole = s.role; botInit(h, s.lane); if (t === 0 && s.lane === lane) G.pMate = h; } }
  const rm = new THREE.Mesh(new THREE.OctahedronGeometry(0.7, 0), new THREE.MeshBasicMaterial({ color: 0x7dffc8 })); rm.scale.set(0.7, 1.4, 0.7); rm.position.set(RUNE_POS.x, 1.6, RUNE_POS.z); rm.add(glowSprite(0x7dffc8, 5)); rm.visible = false; G.scene.add(rm);
  G.rune = { mesh: rm, active: false, next: 45 };
  refreshProtection();
  G.state = 'play'; G.camX = G.player.x; G.camZ = G.player.z; G.camSnap = true;
}
function updateRune(dt) {
  const R = G.rune; if (!R) return;
  if (!R.active) { if (G.time >= R.next) { R.active = true; R.mesh.visible = true; FX.ring(RUNE_POS.x, RUNE_POS.z, { r1: 5, color: 0x7dffc8, life: 0.8, tex: 'shock' }); } return; }
  R.mesh.rotation.y += dt * 2; R.mesh.position.y = 1.6 + Math.sin(G.time * 2.5) * 0.25;
  if (Math.random() < dt * 8) FX.burst(RUNE_POS.x, 0.3, RUNE_POS.z, { n: 1, color: 0x7dffc8, speed: [0.2, 0.5], life: [0.8, 1.3], size: [0.22, 0.02], up: 3, rad: 1.6, ring: true });
  for (const h of G.heroes) if (h.alive && dist(h.x, h.z, RUNE_POS.x, RUNE_POS.z) < 2.4) {
    R.active = false; R.mesh.visible = false; R.next = G.time + 80;
    const b = addBuff(h, { id: 'rune', dur: 30, ms: 0.22, every: 1, onTick: q => { q.hp = Math.min(q.maxHp, q.hp + q.maxHp * 0.025); q.mana = Math.min(q.maxMana, q.mana + q.maxMana * 0.03); } });
    if (b) b.fx = FX.aura(h, 0x7dffc8, 30, 1.35, 'ring', 5);
    FX.explosion(RUNE_POS.x, RUNE_POS.z, 3, 0x7dffc8, { smoke: false }); FX.heal(h, 0x7dffc8); if (h.isPlayer) { SFX.play('heal'); UI.announce('Руна ветра: скорость и восстановление', '#7dffc8'); }
    break;
  }
}
function separate() {
  const U = G.units, n = U.length;
  for (let i = 0; i < n; i++) {
    const a = U[i]; if (!a.alive) continue;
    for (let j = i + 1; j < n; j++) {
      const b = U[j]; if (!b.alive) continue; if (a.struct && b.struct) continue; if ((a.phase || b.phase) && !a.struct && !b.struct) continue;   // a phasing unit passes through others
      const rr = a.radius + b.radius, dx = b.x - a.x, dz = b.z - a.z; if (dx > rr || dx < -rr || dz > rr || dz < -rr) continue;
      const d2 = dx * dx + dz * dz; if (d2 >= rr * rr) continue;
      const d = Math.sqrt(d2) || 0.01, ov = rr - d; let nx = dx / d, nz = dz / d;
      if (d < 0.02) { nx = 1; nz = 0; }
      let wa = 0.5, wb = 0.5, soft = 0.45;
      if (a.struct) { wa = 0; wb = 1; soft = 1; } else if (b.struct) { wa = 1; wb = 0; soft = 1; }
      else if (a.kind === 'hero' && b.kind !== 'hero') { wa = 0.2; wb = 0.8; } else if (b.kind === 'hero' && a.kind !== 'hero') { wa = 0.8; wb = 0.2; }
      if (a.dash || a.forced) wa = 0; if (b.dash || b.forced) wb = 0;
      // sideways slide: units slip around structures, and a walking minion flows around anything standing in its way
      // (a hero holding position, a melee line) on the side it is already heading for, instead of butting heads with it
      const tx = -nz, tz = nx; let sa = 0, sb = 0;
      if (a.struct || b.struct) { sa = ov * 0.6 * wa; sb = ov * 0.6 * wb; }
      else {
        if (wa && a.kind === 'minion' && a.moving && (!b.moving || b.kind === 'hero')) { const d = tx * Math.sin(a.facing) + tz * Math.cos(a.facing); sa = (Math.abs(d) > 0.12 ? Math.sign(d) : ((a.id & 1) ? 1 : -1)) * ov * 0.7; }
        if (wb && b.kind === 'minion' && b.moving && (!a.moving || a.kind === 'hero')) { const d = tx * Math.sin(b.facing) + tz * Math.cos(b.facing); sb = (Math.abs(d) > 0.12 ? Math.sign(d) : ((b.id & 1) ? 1 : -1)) * ov * 0.7; }
      }
      if (wa) { const px = a.x - nx * ov * soft * wa + tx * sa, pz = a.z - nz * ov * soft * wa + tz * sa; if (NAV.ok(px, pz) || a.struct || b.struct) { a.x = px; a.z = pz; } }
      if (wb) { const px = b.x + nx * ov * soft * wb + tx * sb, pz = b.z + nz * ov * soft * wb + tz * sb; if (NAV.ok(px, pz) || a.struct || b.struct) { b.x = px; b.z = pz; } }
    }
  }
}
function updateGame(dt) {
  G.time += dt;
  for (let i = G.timers.length - 1; i >= 0; i--) if (G.timers[i].t <= G.time) { const t = G.timers[i]; G.timers.splice(i, 1); t.fn(); }
  if (G.over) { G.overT += dt; return; }
  // waves
  if (G.time >= G.nextWave) {
    G.nextWave += 24; G.wave++;
    for (let team = 0; team < 2; team++) for (const ln of LANE_NAMES) {
      const list = ['melee', 'melee', 'ranged']; if (G.wave % 3 === 0) list.push('siege'); if (G.super[team][ln]) list.push('siege', 'melee');
      list.forEach((ty, k) => after(k * 0.75, () => spawnMinion(team, ln, ty)));
    }
  }
  for (let i = 0; i < CAMPS.length; i++) { const c = G.camps[i]; if (c.alive <= 0 && G.time >= c.respawn) { c.respawn = 1e9; spawnCamp(i); } }
  if (!G.boss && G.time >= G.bossRespawn) { G.bossRespawn = 1e9; spawnBoss(); UI.announce('Страж Разлома пробудился', '#b99cff'); }
  updateRune(dt);
  // passive income
  for (const h of G.heroes) { const gr = (2.8 + (h.goldRate || 0)) * dt; h.gold += gr; h.goldTotal += gr; }
  // fountain defence
  G.fountT -= dt;
  if (G.fountT <= 0) {
    G.fountT = 0.4;
    for (const h of G.heroes) { if (!h.alive) continue; const f = BASES[1 - h.team].fountain; if (dist(h.x, h.z, f.x, f.z) < 13) { FX.bolt(f.x, 9, f.z, h.x, 1.5, h.z, { color: TEAM_COL[1 - h.team], w: 1.4 }); FX.hit(h.x, 1.4, h.z, TEAM_COL[1 - h.team], true); SFX.at('zap', h.x, h.z); damage(null, h, 260 + h.maxHp * 0.1, 2); } }
  }
  for (let i = G.dangers.length - 1; i >= 0; i--) if (G.dangers[i].until < G.time) G.dangers.splice(i, 1);
  updateBots(dt);
  // alternate iteration order every frame so neither team gets a systematic first-strike edge
  G.flip = !G.flip; const U = G.units, un = U.length;
  for (let k = 0; k < un; k++) {
    const u = U[G.flip ? un - 1 - k : k];
    if (u.alive) {
      updateBuffs(u, dt);
      if (u.forced && u.alive) { const f = u.forced, nx = u.x + f.vx * dt, nz = u.z + f.vz * dt; if (NAV.ok(nx, nz)) { u.x = nx; u.z = nz; } f.t -= dt; if (f.t <= 0) u.forced = null; }
    }
    switch (u.kind) { case 'hero': updateHero(u, dt); break; case 'minion': updateMinion(u, dt); break; case 'monster': updateMonster(u, dt); break; default: updateStructure(u, dt); }
  }
  updateProjectiles(dt);
  for (let i = G.actors.length - 1; i >= 0; i--) if (G.actors[i].update(dt) === false) G.actors.splice(i, 1);
  separate();
  for (let i = G.units.length - 1; i >= 0; i--) { const u = G.units[i]; if (u.remove) { G.scene.remove(u.rig.root); G.units.splice(i, 1); } }
}
// position + animate rigs (runs every frame, also when paused)
function animateUnits(dt) {
  for (const u of G.units) {
    const r = u.rig; if (!r) continue;
    if (u.struct) { animStruct(u, dt); continue; }
    r.root.position.x = u.x; r.root.position.z = u.z;
    const near = Math.abs(u.x - G.camX) < 46 && Math.abs(u.z - G.camZ) < 42;
    if (!near && !u.dead) { r.root.rotation.y = u.facing; r.root.position.y = 0; continue; }
    if (r.type === 'hero') { animHero(u, dt); if (r.tipR && u.range < 5) FX.swing(u, r, dt); } else animMinion(u, dt);
    // a hit knocks the model back along the blow for a moment (the unit itself does not move)
    if (u.jolt) { const j = u.jolt, q = Math.max(0, j.t / 0.16), p = j.p * q * (2 - q) * (u.dead ? 0 : 1); r.root.position.x += Math.sin(j.a) * p; r.root.position.z += Math.cos(j.a) * p; j.t -= dt; if (j.t <= 0) u.jolt = null; }
  }
}

/* ---------- items ---------- */
/* Prices follow one scale: every stat has a gold value and an item costs roughly what its stats are worth.
   Five tiers: basic (300-400), simple (600-1050), core (1250-1700), strong (1950-2100), legendary (2700-2900). Listed by category, cheapest first. */
const ITEMS = [
  { id: 'boots', name: 'Сапоги странника', cost: 300, cat: 'util', icon: 'boot', stats: { ms: 0.7 }, desc: '+0.7 к скорости передвижения', unique: 'boots' },
  { id: 'lucky', name: 'Талисман удачи', cost: 600, cat: 'util', icon: 'mana', stats: { gold: 1.4, hp: 120 }, desc: '+1.4 золота в секунду, +120 здоровья', unique: 'lucky' },
  { id: 'swift', name: 'Сапоги ветра', cost: 850, cat: 'util', icon: 'tailwind', stats: { ms: 1.1, ten: 0.15 }, desc: '+1.1 к скорости, оглушения и обездвиживания короче на 15%', unique: 'boots' },
  { id: 'whet', name: 'Точильный камень', cost: 350, cat: 'atk', icon: 'blade', stats: { ad: 12 }, desc: '+12 силы атаки' },
  { id: 'dagger', name: 'Лёгкий кинжал', cost: 400, cat: 'atk', icon: 'kunai', stats: { as: 0.18 }, desc: '+18% скорости атаки' },
  { id: 'ram', name: 'Осадный лом', cost: 900, cat: 'atk', icon: 'smash', stats: { ad: 22, structDmg: 0.4 }, desc: '+22 силы атаки, +40% урона по башням и кристаллу' },
  { id: 'bow', name: 'Лук бури', cost: 1050, cat: 'atk', icon: 'arrow', stats: { as: 0.3, ad: 15 }, desc: '+30% скорости атаки, +15 силы атаки' },
  { id: 'hammer', name: 'Громовой молот', cost: 1250, cat: 'atk', icon: 'bolt', stats: { as: 0.25, onhit: 26 }, desc: '+25% скорости атаки. Каждая атака наносит 26 магического урона' },
  { id: 'claw', name: 'Коготь тени', cost: 1450, cat: 'atk', icon: 'pounce', stats: { ad: 32, haste: 15, ms: 0.25 }, desc: '+32 силы атаки, +15 ускорения умений, +0.25 скорости' },
  { id: 'frostblade', name: 'Морозный клинок', cost: 1500, cat: 'atk', icon: 'icelance', stats: { ad: 26, hp: 220, slowHit: 0.2 }, desc: '+26 силы атаки, +220 здоровья. Атаки замедляют цель на 20%' },
  { id: 'piercer', name: 'Пронзатель', cost: 1700, cat: 'atk', icon: 'arrows', stats: { ad: 36, apen: 0.3 }, desc: '+36 силы атаки, атаки и физические умения игнорируют 30% защиты' },
  { id: 'exec', name: 'Клинок палача', cost: 1950, cat: 'atk', icon: 'execute', stats: { ad: 45, ls: 0.14 }, desc: '+45 силы атаки, 14% вампиризма от атак' },
  { id: 'fang', name: 'Клык рыси', cost: 2000, cat: 'atk', icon: 'bites', stats: { ad: 36, crit: 0.3 }, desc: '+36 силы атаки, 30% шанс критического удара (×1.75)' },
  { id: 'skadi', name: 'Око стужи', cost: 2800, cat: 'atk', icon: 'frosteye', stats: { ad: 35, ap: 35, hp: 400, mana: 250, chill: 0.45 }, unique: 'skadi', desc: '+35 силы атаки, +35 силы умений, +400 здоровья, +250 маны. Ваши атаки и умения вешают на цель «Стужу» на 4 сек: она получает на 45% меньше лечения, восстановления и вампиризма, а атаки ещё и замедляют её на 20%' },
  { id: 'titan', name: 'Убийца титанов', cost: 2900, cat: 'atk', icon: 'skull', stats: { ad: 80, hp: 200 }, desc: '+80 силы атаки, +200 здоровья' },
  { id: 'charm', name: 'Амулет прилива', cost: 300, cat: 'mag', icon: 'drain', stats: { mana: 200, manaRegen: 2 }, desc: '+200 маны, +2 маны в секунду' },
  { id: 'ember', name: 'Тлеющий осколок', cost: 350, cat: 'mag', icon: 'orb', stats: { ap: 22 }, desc: '+22 силы умений' },
  { id: 'prism', name: 'Призма дальних троп', cost: 1000, cat: 'mag', icon: 'scope', stats: { ap: 30, mana: 200, castRange: 2.5 }, desc: '+30 силы умений, +200 маны, +2.5 к дальности умений (по цели, в точку и снаряды)' },
  { id: 'spring', name: 'Родник маны', cost: 1250, cat: 'mag', icon: 'heal', stats: { ap: 30, mana: 300, manaRegen: 4, haste: 10, healPow: 0.15 }, desc: '+30 силы умений, +300 маны, +4 маны в секунду, +10 ускорения, +15% к лечению и щитам' },
  { id: 'grimoire', name: 'Кровавый гримуар', cost: 1350, cat: 'mag', icon: 'bloodthirst', stats: { ap: 50, omni: 0.12 }, desc: '+50 силы умений, умения лечат на 12% нанесённого урона' },
  { id: 'staff', name: 'Посох пепла', cost: 1400, cat: 'mag', icon: 'fire', stats: { ap: 65, mana: 250 }, desc: '+65 силы умений, +250 маны' },
  { id: 'fate', name: 'Жезл рока', cost: 1400, cat: 'mag', icon: 'flash', stats: { ap: 45, scrit: 0.2 }, desc: '+45 силы умений. Умения с шансом 20% наносят критический урон (×1.6). Периодический урон не критует' },
  { id: 'clock', name: 'Часы затмения', cost: 1550, cat: 'mag', icon: 'timestop', stats: { ap: 45, haste: 20, hp: 120 }, desc: '+45 силы умений, +20 ускорения умений, +120 здоровья' },
  { id: 'lens', name: 'Линза пустоты', cost: 2050, cat: 'mag', icon: 'eye', stats: { ap: 65, mpen: 0.35 }, desc: '+65 силы умений, магический урон игнорирует 35% защиты' },
  { id: 'cinder', name: 'Маска тления', cost: 2100, cat: 'mag', icon: 'fury', stats: { ap: 55, hp: 300, burn: 0.012 }, desc: '+55 силы умений, +300 здоровья. Умения поджигают: 1.2% здоровья цели в секунду 3 сек' },
  { id: 'crown', name: 'Корона Разлома', cost: 2900, cat: 'mag', icon: 'star', stats: { ap: 140 }, desc: '+140 силы умений' },
  /* support: income that does not need last hits, auras for whoever stands near, and actives used with the number key of the slot (1-6) */
  { id: 'tithe', name: 'Кошель наводчика', cost: 350, cat: 'sup', icon: 'purse', stats: { tithe: 0.4, manaRegen: 1.5, hp: 60 }, unique: 'tithe', desc: 'Когда союзный герой рядом добивает миньона или чудовище, вы получаете 40% его золота. +1.5 маны в секунду, +60 здоровья' },
  { id: 'flask', name: 'Фляга травника', cost: 400, cat: 'sup', icon: 'flask', stats: { hpRegen: 4, manaRegen: 1 }, unique: 'flask', desc: '+4 здоровья и +1 маны в секунду. <u>Применение (40 сек):</u> лечит самого раненого союзного героя в радиусе 9 (или вас) на 80 + 7% его здоровья',
    active: { cd: 40, use(h) { const t = hurtAlly(h, 9, 0.92); if (!t) return false; itemHeal(h, t, 80 + t.maxHp * 0.07); FX.heal(t); if (t !== h) FX.beam(h.x, h.z, t.x, t.z, { color: 0x7dffa8, w: 0.5, life: 0.3 }); SFX.at('heal', t.x, t.z, 0.7); }, ai(h) { return !!hurtAlly(h, 9, 0.5); } } },
  { id: 'horn', name: 'Боевой горн', cost: 950, cat: 'sup', icon: 'horn', stats: { hp: 150, haste: 10 }, unique: 'horn', desc: '+150 здоровья, +10 ускорения умений. <u>Аура (10):</u> союзные герои атакуют на 10% быстрее. <u>Применение (45 сек):</u> союзники в радиусе 10 бегут на 25% быстрее 4 сек',
    aura: { r: 10, buff: { as: 0.1 } },
    active: { cd: 45, use(h) { for (const a of alliesIn(h, h.x, h.z, 10, true)) { addBuff(a, { id: 'hornrun', dur: 4, ms: 0.25, src: h }); FX.aura(a, 0xe8c34a, 4, a.radius + 0.5, 'ring', 5); } FX.ring(h.x, h.z, { r0: 1, r1: 10, color: 0xe8c34a, life: 0.6, tex: 'shock' }); FX.shock(h.x, h.z, 9, 0.6, 0.5); SFX.at('horn', h.x, h.z); }, ai(h) { return foesNear(h, h.x, h.z, 10) > 0 && alliesIn(h, h.x, h.z, 10, true).length > 1; } } },
  { id: 'push', name: 'Посох порыва', cost: 1000, cat: 'sup', icon: 'gust', stats: { hp: 150, manaRegen: 2, ms: 0.2 }, unique: 'push', desc: '+150 здоровья, +2 маны в секунду, +0.2 скорости. <u>Применение (22 сек):</u> порыв ветра бросает вас на 7.5 в сторону курсора',
    active: { cd: 22, use(h, pt) { if (h.rooted || h.dash) return false; const a = pt ? angTo(h.x, h.z, pt.x, pt.z) : h.facing; h.facing = a; FX.ring(h.x, h.z, { r1: 3, color: 0xbfefff, life: 0.35, tex: 'shock' }); FX.sparks(h.x, 1, h.z, { n: 12, color: 0xffffff, color2: 0xbfefff, dir: a + Math.PI, spread: 0.6, speed: [4, 12], life: [0.2, 0.45], grav: 0 }); dashTo(h, h.x + Math.sin(a) * 7.5, h.z + Math.cos(a) * 7.5, 34, { ribbon: 0xbfefff }); SFX.at('dash', h.x, h.z); },
      ai(h) { if (h.hp > h.maxHp * 0.35 || h.rooted) return false; let e = null, bd = 7.5; for (const o of G.heroes) if (o.alive && hostile(h, o) && udist(h, o) < bd) { bd = udist(h, o); e = o; } if (!e) return false; h.facing = angTo(e.x, e.z, h.x, h.z); return true; } } },
  { id: 'veil', name: 'Покров тумана', cost: 1150, cat: 'sup', icon: 'veil', stats: { ap: 30, mana: 200 }, unique: 'veil', desc: '+30 силы умений, +200 маны. <u>Применение (30 сек):</u> самый раненый союзный герой в радиусе 10 (или вы) получает щит на 140 + 50% силы умений и на 4 сек получает на 18% меньше урона',
    active: { cd: 30, use(h) { const t = hurtAlly(h, 10, 0.9) || (G.time - h.lastDamageT < 2 ? h : null); if (!t) return false; const amt = (140 + h.ap * 0.5) * (1 + (h.healPow || 0)), b = addBuff(t, { id: 'veil', dur: 4, shield: amt, dmgIn: 0.82, src: h }); if (b) b.fx = FX.bubble(t, 0xb9c8ff, 4, t.radius + 1); if (t !== h) h.healDone += amt * 0.6; FX.flame(t.x, 1, t.z, { n: 8, color: 0xb9c8ff, color2: 0x30406a, size: [1.2, 2.6], up: 0.6, ring: true }); SFX.at('shield', t.x, t.z); }, ai(h) { const t = hurtAlly(h, 10, 0.6); return !!t && G.time - t.lastDamageT < 1.5; } } },
  { id: 'censer', name: 'Кадило очищения', cost: 1300, cat: 'sup', icon: 'censer', stats: { hp: 250, manaRegen: 3, healPow: 0.1 }, unique: 'censer', desc: '+250 здоровья, +3 маны в секунду, +10% к лечению и щитам. <u>Применение (45 сек):</u> снимает замедления, обездвиживание и безмолвие с союзных героев в радиусе 8, лечит их на 60 и ускоряет на 10% на 3 сек',
    active: { cd: 45, use(h) { for (const a of alliesIn(h, h.x, h.z, 8, true)) { for (const b of a.buffs) if (b.slow || b.root || b.silence) b.dead = true; itemHeal(h, a, 60); addBuff(a, { id: 'censer', dur: 3, ms: 0.1, src: h }); FX.pillar(a.x, a.z, { r: 0.7, h: 6, color: 0xfff1c9, life: 0.5, op: 0.5 }); } FX.ring(h.x, h.z, { r0: 1, r1: 8, color: 0xfff1c9, life: 0.55, tex: 'shock' }); FX.ring(h.x, h.z, { r0: 7, r1: 8, color: 0xfff1c9, life: 0.9, tex: 'rune2', op: 0.5, spin: 1.5 }); SFX.at('cleanse', h.x, h.z); },
      ai(h) { return foesNear(h, h.x, h.z, 12) > 0 && alliesIn(h, h.x, h.z, 8, true).some(a => a.rooted || a.silenced || a.buffs.some(b => b.slow >= 0.3)); } } },
  { id: 'reliquary', name: 'Реликварий милосердия', cost: 1700, cat: 'sup', icon: 'reliq', stats: { hp: 300, def: 20 }, unique: 'reliquary', desc: '+300 здоровья, +20 защиты. <u>Аура (10):</u> союзные герои восстанавливают 6 здоровья в секунду. <u>Применение (55 сек):</u> лечит всех союзных героев в радиусе 9 на 130 + 7% их здоровья',
    aura: { r: 10, regen: 6 },
    active: { cd: 55, use(h) { const L = alliesIn(h, h.x, h.z, 9, true); if (!L.some(a => a.hp < a.maxHp * 0.95)) return false; for (const a of L) { itemHeal(h, a, 130 + a.maxHp * 0.07); FX.heal(a, 0xffe9a0); } FX.ring(h.x, h.z, { r0: 1, r1: 9, color: 0xffe9a0, life: 0.6, tex: 'shock' }); FX.pillar(h.x, h.z, { r: 1.2, h: 10, color: 0xffe9a0, life: 0.6, op: 0.5 }); SFX.at('heal', h.x, h.z); },
      ai(h) { const L = alliesIn(h, h.x, h.z, 9, true); return L.some(a => a.hp < a.maxHp * 0.45) || L.filter(a => a.hp < a.maxHp * 0.7).length >= 2; } } },
  { id: 'banner', name: 'Штандарт стойкости', cost: 1950, cat: 'sup', icon: 'banner', stats: { hp: 350, def: 25, hpRegen: 6 }, unique: 'banner', desc: '+350 здоровья, +25 защиты, +6 здоровья в секунду. <u>Аура (10):</u> вы и союзные герои рядом получаете на 8% меньше урона', aura: { r: 10, buff: { dmgIn: 0.92 } } },
  { id: 'halo', name: 'Венец хранителя', cost: 2700, cat: 'sup', icon: 'halo', stats: { ap: 70, haste: 25, mana: 300, manaRegen: 5, healPow: 0.25, grace: 1 }, unique: 'halo', desc: '+70 силы умений, +25 ускорения, +300 маны, +5 маны в секунду, +25% к лечению и щитам. Ваши лечение и щиты ускоряют союзника на 15% на 2.5 сек' },
  { id: 'band', name: 'Кольцо живучести', cost: 350, cat: 'def', icon: 'ring', stats: { hp: 80, hpRegen: 6 }, desc: '+80 здоровья, +6 здоровья в секунду' },
  { id: 'hide', name: 'Дублёная кожа', cost: 400, cat: 'def', icon: 'shield', stats: { hp: 130, def: 8 }, desc: '+130 здоровья, +8 защиты' },
  { id: 'heart', name: 'Сердце голема', cost: 1000, cat: 'def', icon: 'ironwill', stats: { hp: 350, def: 16 }, desc: '+350 здоровья, +16 защиты' },
  { id: 'spike', name: 'Шипастый панцирь', cost: 1300, cat: 'def', icon: 'caltrops', stats: { def: 50, hp: 150, thorns: 14 }, desc: '+50 защиты, +150 здоровья. Атакующие герои получают ответный урон' },
  { id: 'warden', name: 'Плащ стража', cost: 1450, cat: 'def', icon: 'intercept', stats: { hp: 350, hpRegen: 12, ten: 0.25 }, desc: '+350 здоровья, +12 здоровья в секунду, контроль по вам короче на 25%' },
  { id: 'aegis', name: 'Эгида рассвета', cost: 1500, cat: 'def', icon: 'ward', stats: { hp: 300, def: 28, haste: 10, healPow: 0.1 }, desc: '+300 здоровья, +28 защиты, +10 ускорения умений, +10% к лечению и щитам' },
  { id: 'lastword', name: 'Последний рубеж', cost: 2000, cat: 'def', icon: 'bastion', stats: { def: 40, hp: 350, lowShield: 1 }, desc: '+40 защиты, +350 здоровья. При здоровье ниже 30% даёт щит на 4 сек (раз в 60 сек)' },
  { id: 'colossus', name: 'Доспех колосса', cost: 2700, cat: 'def', icon: 'stoneskin', stats: { hp: 750, def: 48 }, desc: '+750 здоровья, +48 защиты' }
];
// price tier of an item, shown as a badge in the shop
const ITEM_TIERS = [[450, 'I', 'базовый'], [1100, 'II', 'простой'], [1800, 'III', 'основной'], [2300, 'IV', 'сильный'], [1e9, 'V', 'легендарный']];
const itemTier = it => ITEM_TIERS.find(t => it.cost <= t[0]);
const ITEM = {}; for (const it of ITEMS) ITEM[it.id] = it;
const ITEM_CATS = [['all', 'Все'], ['atk', 'Атака'], ['mag', 'Магия'], ['def', 'Защита'], ['sup', 'Поддержка'], ['util', 'Разное']];
const BUILDS = {
  tank: ['boots', 'heart', 'spike', 'warden', 'aegis', 'colossus'], bruiser: ['boots', 'heart', 'frostblade', 'aegis', 'exec', 'titan'],
  assassin: ['boots', 'claw', 'piercer', 'exec', 'lastword', 'titan'], marks: ['boots', 'bow', 'piercer', 'exec', 'fang', 'titan'],
  mage: ['boots', 'staff', 'clock', 'lens', 'cinder', 'crown'], support: ['boots', 'flask', 'spring', 'reliquary', 'aegis', 'halo'],
  apsin: ['boots', 'grimoire', 'staff', 'lens', 'lastword', 'crown'], tech: ['boots', 'spring', 'staff', 'clock', 'lens', 'crown'], hooker: ['boots', 'prism', 'heart', 'warden', 'aegis', 'colossus'], trick: ['boots', 'prism', 'spring', 'veil', 'clock', 'halo'],
  guard: ['boots', 'heart', 'horn', 'warden', 'banner', 'colossus'], duel: ['boots', 'dagger', 'frostblade', 'exec', 'fang', 'skadi']
};
// one colour per item category, used everywhere an item is drawn
const CAT_COL = { atk: 0xec6a50, mag: 0x9d86ff, def: 0x62c480, sup: 0xe8c34a, util: 0x58b9d8 };
const BUILD_NAME = { tank: 'танк', bruiser: 'боец', assassin: 'убийца', marks: 'стрелок', mage: 'маг', support: 'поддержка', apsin: 'маг-убийца', guard: 'защитник', duel: 'охотник', tech: 'инженер', hooker: 'ловец', trick: 'поддержка' };
// situational swaps shown on the build tab: [item, when to take it]
const BUILD_ALT = {
  tank: [['lastword', 'Если вас убивают первым'], ['swift', 'Против оглушений и замедлений'], ['frostblade', 'Чтобы враги не убегали'], ['banner', 'Если вы стоите впереди команды'], ['horn', 'В роли поддержки']],
  bruiser: [['piercer', 'Против бронированных врагов'], ['spike', 'Против стрелков'], ['lastword', 'Если не хватает живучести'], ['skadi', 'Против лечения и вампиризма']],
  assassin: [['skadi', 'Против лечения и вампиризма'], ['fang', 'Больше взрывного урона'], ['swift', 'Против оглушений и замедлений'], ['frostblade', 'Чтобы цель не ушла']],
  marks: [['skadi', 'Против лечения и вампиризма: вместо Убийцы титанов'], ['hammer', 'Больше урона с каждой атаки'], ['lastword', 'Если до вас добираются убийцы'], ['ram', 'Чтобы быстрее ломать башни']],
  mage: [['skadi', 'Если у врага сильный лекарь'], ['spring', 'Если не хватает маны'], ['fate', 'Больше взрывного урона'], ['prism', 'Чтобы доставать умениями издалека'], ['lastword', 'Против убийц']],
  support: [['tithe', 'Доход на линии без добивания миньонов'], ['veil', 'Спасти союзника от взрывного урона'], ['censer', 'Против замедлений и обездвиживания'], ['horn', 'Если команда дерётся вместе'], ['push', 'Чтобы уходить от убийц'], ['clock', 'Чаще применять умения']],
  apsin: [['clock', 'Чаще применять умения'], ['fate', 'Больше взрывного урона'], ['cinder', 'Против танков'], ['swift', 'Против оглушений и замедлений']],
  tech: [['prism', 'Лазер достаёт дальше'], ['fate', 'Криты лазера и ракет'], ['charm', 'Ранняя мана для умений'], ['lastword', 'Против убийц']],
  trick: [['staff', 'Сборка в урон: вместо Покрова тумана'], ['crown', 'Сборка в урон: вместо Венца хранителя'], ['fate', 'Сборка в урон: криты карт'], ['tithe', 'Доход на линии без добивания миньонов'], ['push', 'Если вас убивают первой']],
  hooker: [['spike', 'Против стрелков'], ['lastword', 'Если вас убивают первым'], ['swift', 'Против оглушений и замедлений']],
  guard: [['spike', 'Против стрелков'], ['lastword', 'Если вас убивают первым'], ['tithe', 'Доход на линии без добивания миньонов'], ['reliquary', 'Если в команде нет лекаря'], ['aegis', 'Больше защиты и ускорения умений']],
  duel: [['titan', 'Чистый урон вместо Ока стужи'], ['hammer', 'Больше урона с каждой атаки'], ['lastword', 'Если не хватает живучести'], ['swift', 'Против оглушений и замедлений']]
};
function canShop(h) { return h.dead || h.inBase || (!!G.sandbox && h.isPlayer); }
/* ---------- the proving ground: no waves and no bots; the player is level 15 with every ability maxed and endless gold, the shop works anywhere,
   and three enemy heroes stand as targets with 200 000 health that never die and heal back when left alone. Damage dealt to them is counted ---------- */
function setupSandbox() {
  const P = G.player, S = G.sandbox = { dmg: 0, t0: 0, last: -9, peak: 0, nocd: false, hit: 0 }; G.nextWave = 1e9;
  P.level = MAX_LVL; P.al = [4, 4, 4, 3]; P.sp = 0; P.xp = 0; recalcHero(P); P.hp = P.maxHp; P.mana = P.maxMana; P.gold = 99999;
  const c = NAV.nearest(-7, 7); P.x = c.x; P.z = c.z; P.facing = 2.35; P.order = null; P.path = null;
  let n = 0; for (const h of G.heroes) {
    if (h === P) continue; h.ai = null; h.order = null; h.path = null;
    if (h.team !== P.team && n < 3) { const q = NAV.nearest([2, 6, -1][n], [-2, 2, -7][n]); h.x = q.x; h.z = q.z; h.facing = -0.8; h.dummy = true; h.maxHp = h.hp = 200000; h.name = 'Мишень ' + (++n); }
  }
  return S;
}
function itemBlocked(h, it) { return !!it.unique && h.items.some(id => ITEM[id].unique === it.unique); }
function buyItem(h, id) {
  const it = ITEM[id];
  if (!canShop(h) || h.items.length >= 6 || h.gold < it.cost || itemBlocked(h, it)) return false;
  h.gold -= it.cost; h.items.push(id); (h.itemAt || (h.itemAt = [])).push(G.time); recalcHero(h); return true;
}
// a purchase can be undone for its full price within 10 seconds; after that an item sells for 60%
function sellPrice(h, i) { const c = ITEM[h.items[i]].cost; return h.itemAt && G.time - h.itemAt[i] < 10 ? c : Math.round(c * 0.6); }
function sellItem(h, i) { if (!canShop(h) || !h.items[i]) return false; h.gold += sellPrice(h, i); h.items.splice(i, 1); if (h.itemAt) h.itemAt.splice(i, 1); recalcHero(h); h.hp = Math.min(h.hp, h.maxHp); h.mana = Math.min(h.mana, h.maxMana); return true; }

/* ---------- support items: heals, auras, actives ---------- */
// a heal from an item: the hero's own HEAL_K does not apply (it tunes his spells), healing power does
function itemHeal(h, t, amt) {
  const a = Math.min(amt * (1 + (h.healPow || 0)) * (1 - (t.healCut || 0)), t.maxHp - t.hp); if (!t.alive || a <= 0) return 0; t.hp += a; if (t !== h) h.healDone += a;
  if (a >= 4 && (h === G.player || t === G.player)) FX.text(t.x, t.height + 0.6, t.z, '+' + Math.round(a), '#7dffa8', 14);
  return a;
}
// the most wounded allied hero within r (the hero himself counts), if anyone is below `frac` of his health
function hurtAlly(h, r, frac) { let b = null, bv = frac; for (const a of alliesIn(h, h.x, h.z, r, true)) { const v = a.hp / a.maxHp; if (v < bv) { bv = v; b = a; } } return b; }
// twice a second an aura item refreshes a short buff on every allied hero around its owner (two owners do not stack)
function updateAuras(h, dt) {
  h.auraT = (h.auraT || 0) - dt; if (h.auraT > 0) return; h.auraT = 0.5;
  for (const it of h.auras) { const A = it.aura; for (const a of alliesIn(h, h.x, h.z, A.r, true)) { if (A.buff) addBuff(a, Object.assign({ id: 'aura_' + it.id, dur: 0.8, src: h }, A.buff)); if (A.regen && a.hp < a.maxHp) { const v = Math.min(A.regen * 0.5 * (1 - (a.healCut || 0)), a.maxHp - a.hp); a.hp += v; if (a !== h) h.healDone += v; } } }
}
// use the item in a slot; returns 'ok', or why not: 'none' (nothing to use), 'no' (dead or stunned), 'cd', 'tgt' (nobody needs it)
function useItem(h, slot, pt) {
  const id = h.items[slot], it = id && ITEM[id]; if (!it || !it.active) return 'none';
  if (h.dead || h.stunned || G.over) return 'no';
  if ((h.icd[id] || 0) > G.time) return 'cd';
  if (it.active.use(h, pt) === false) return 'tgt';
  h.icd[id] = G.time + it.active.cd; if (h.recall > 0) cancelRecall(h); return 'ok';
}
/* ---------- end-of-match rating: every hero gets 0-10 from what he did, relative to the best figure of the match in each column ---------- */
function matchRatings() {
  const H = G.heroes, mx = k => Math.max(1, ...H.map(h => h[k] || 0)), mD = mx('dmgHero'), mH = Math.max(1500, mx('healDone')), mT = mx('dmgTower'), mK = mx('dmgTaken'), mG = mx('goldTotal');
  return H.map(h => {
    const tk = Math.max(1, G.teams[h.team].kills), kda = (h.kills + 0.6 * h.assists) / Math.max(1, h.deaths);
    const p = { kda: 2.4 * Math.min(1, kda / 6), dmg: 2.8 * h.dmgHero / mD, heal: 1.7 * h.healDone / mH, tower: 1.1 * h.dmgTower / mT, tank: 0.6 * h.dmgTaken / mK, gold: 0.6 * h.goldTotal / mG, part: 1.4 * Math.min(1, (h.kills + h.assists) / tk), win: G.winner === h.team ? 0.6 : 0, death: -Math.min(1.6, h.deaths * 0.13) };
    let s = 0; for (const k in p) s += p[k];
    return { h, score: clamp(1 + s * 1.02, 0, 10), p };
  }).sort((a, b) => b.score - a.score);
}
// «Стужа» from Око стужи: healing cut on the target; a basic attack also slows. A new hit refreshes it and keeps the stronger slow
function chillHit(src, t, basic) {
  const old = t.buffs.find(b => b.id === 'chill'), b = addBuff(t, { id: 'chill', dur: 4, healCut: src.chill, slow: Math.max(basic ? 0.2 : 0, old ? old.slow || 0 : 0), src }); if (!b) return;
  if (FX.near(t.x, t.z, 45)) { b.fx = FX.aura(t, 0x9fdcff, 4, t.radius + 0.55, 'ringThin', -2); if (Math.random() < 0.5) FX.burst(t.x, t.height * 0.7, t.z, { n: 3, color: 0xdff4ff, color2: 0x4a90c0, speed: [0.3, 1.2], life: [0.4, 0.8], size: [0.22, 0.03], grav: -2, rad: 0.6 }); }
  if (!old && G.player && (src === G.player || t === G.player)) FX.text(t.x, t.height + 1.1, t.z, 'стужа: −' + Math.round(src.chill * 100) + '% лечения', '#9fdcff', 12);
}
// reorder the inventory: drop slot a onto slot b. Two items swap; dropped on an empty slot the item moves to the end
function moveItem(h, a, b) {
  const n = h.items.length; if (a === b || a < 0 || a >= n || b < 0) return false; const T = h.itemAt || (h.itemAt = h.items.map(() => -99));
  if (b >= n) { if (a === n - 1) return false; h.items.push(h.items.splice(a, 1)[0]); T.push(T.splice(a, 1)[0]); return true; }
  const x = h.items[a]; h.items[a] = h.items[b]; h.items[b] = x; const y = T[a]; T[a] = T[b]; T[b] = y; return true;
}
