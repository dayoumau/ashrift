'use strict';
/* ===== bot AI: laning, last-hits, trades, tower rules, dodging, jungle, ganks, team objectives, ability usage, shopping ===== */
/* difficulty: aim spread, aggression, how often abilities are used, dodging, last hits, think interval —
   and (v0.44) retreat: the health at which a bot goes home; focus: how much it joins the target its allies are hitting;
   threat: how much it fears enemy ultimates that are ready; secure: going for a kill it can finish; peel: saving an ally under attack */
const DIFFS = [
  { name: 'Лёгкая', aim: 3.4, aggro: 0.72, cast: 0.35, dodge: 0.08, lasthit: 0.3, think: 0.42, retreat: 0.2, focus: 0.15, threat: 0, secure: 0, peel: 0 },
  { name: 'Средняя', aim: 1.7, aggro: 1.0, cast: 0.65, dodge: 0.35, lasthit: 0.6, think: 0.28, retreat: 0.3, focus: 0.55, threat: 0.5, secure: 0.5, peel: 0.4 },
  { name: 'Сложная', aim: 0.6, aggro: 1.16, cast: 0.95, dodge: 0.8, lasthit: 0.9, think: 0.2, retreat: 0.34, focus: 1, threat: 1, secure: 1, peel: 1 }
];
function botInit(h, lane) {
  const ally = G.player && h.team === G.player.team;
  h.ai = { lane, d: DIFFS[ally ? 1 : G.diff], think: rand(0.5), state: 'lane', castAt: rand(2, 4), dest: null, jitT: 0, jo: 0, js: 0, tgt: null, lastShop: 0, shopTrip: false, task: null, taskCd: rand(25, 45) };
}
function botMove(h, x, z, force) {
  const A = h.ai;
  if (!force && A.dest && h.order && h.order.type === 'move' && h.path && dist(A.dest.x, A.dest.z, x, z) < 1.6) return;
  A.dest = { x, z }; setMove(h, x, z); h.order = { type: 'move' };
}
function botAttack(h, t) { if (h.order && h.order.type === 'attack' && h.order.tgt === t) return; h.order = { type: 'attack', tgt: t, rp: 0 }; h.ai.dest = null; }
function botShop(h) {
  const b = BUILDS[h.def.build]; let g = 0;
  while (h.items.length < 6 && g++ < 6) { const id = b[h.items.length]; if (!id || h.gold < ITEM[id].cost) break; buyItem(h, id); }
  h.ai.lastShop = G.time;
}
function nextCost(h) { const id = BUILDS[h.def.build][h.items.length]; return id ? ITEM[id].cost : 1e9; }
function minionCover(team, s) { let n = 0; for (const m of G.units) if (m.alive && m.kind === 'minion' && m.team === team && udist(m, s) < s.range + 0.5) n++; return n; }
// keep the 2-1-2 lane split around wherever the player actually plays
function rebalanceLanes() {
  const P = G.player; if (!P || !P.alive || P.ai) return;
  if (dist(P.x, P.z, BASES[0].core.x, BASES[0].core.z) < 36) return;
  let pl = null, bd = 13; for (const n of LANE_NAMES) { laneProject(LANES[n], P.x, P.z); if (laneProject.d < bd) { bd = laneProject.d; pl = n; } }
  if (!pl) return;
  if (G.pLane === pl) G.pLaneN++; else { G.pLane = pl; G.pLaneN = 1; }
  if (G.pLaneN < 3) return;
  const need = { top: 2, mid: 1, bot: 2 }; need[pl]--;
  const bots = G.heroes.filter(h => h.ai && h.team === P.team), cnt = { top: 0, mid: 0, bot: 0 }; for (const b of bots) cnt[b.ai.lane]++;
  for (let k = 0; k < 2; k++) {
    const over = LANE_NAMES.find(n => cnt[n] > need[n]), under = LANE_NAMES.find(n => cnt[n] < need[n]); if (!over || !under) break;
    const b = bots.find(q => q.ai.lane === over); b.ai.lane = under; cnt[over]--; cnt[under]++;
  }
}
function weakestLane(team) {
  let best = 'mid', bn = 9;
  for (const ln of ['mid', 'top', 'bot']) { const n = G.units.filter(u => u.kind === 'tower' && u.alive && u.team !== team && u.lane === ln).length; if (n < bn) { bn = n; best = ln; } }
  return best;
}
// shared team calls: take the boss or group up and push when the numbers are on our side
function teamThink(team) {
  const mine = G.heroes.filter(h => h.team === team), al = mine.filter(h => h.alive).length, eAl = G.heroes.filter(h => h.team !== team && h.alive).length;
  let O = G.obj[team];
  if (O && (G.time > O.until || al < 3 || (O.type === 'boss' && !(G.boss && G.boss.alive)))) O = G.obj[team] = null;
  if (O) return;
  const avgL = mine.reduce((s, h) => s + h.level, 0) / mine.length, adv = al - eAl;
  if (G.boss && G.boss.alive && al >= 4 && adv >= 2 && avgL >= 7) O = { type: 'boss', until: G.time + 45 };
  else if (G.time > 540 && al >= 4 && adv >= 2) O = { type: 'push', lane: weakestLane(team), until: G.time + 30 };
  else if (G.time > 780 && al >= 4 && Math.random() < 0.25) O = { type: 'push', lane: weakestLane(team), until: G.time + 38 };
  if (O) { G.obj[team] = O; if (G.player && !G.player.ai && team === G.player.team) UI.announce(O.type === 'boss' ? 'Команда идёт на Стража Разлома' : 'Команда собирается: ' + LANE_RU[O.lane], '#9fd0ff'); }
}
function updateBots(dt) {
  G.laneT -= dt; if (G.laneT <= 0) { G.laneT = 7; rebalanceLanes(); }
  G.objT -= dt; if (G.objT <= 0) { G.objT = 5; teamThink(0); teamThink(1); }
  const n = G.heroes.length; for (let k = 0; k < n; k++) { const h = G.heroes[G.flip ? n - 1 - k : k]; if (h.ai) { if (h.sp > 0) autoLearn(h); botThink(h, dt); botItems(h, dt); } }
}
// twice a second a bot looks at the usable items it carries and uses the first one whose own test says the moment is right
function botItems(h, dt) {
  h.itemT = (h.itemT === undefined ? rand(0.5) : h.itemT) - dt; if (h.itemT > 0 || h.dead || h.stunned) return; h.itemT = 0.5;
  for (let i = 0; i < h.items.length; i++) { const it = ITEM[h.items[i]]; if (it.active && !((h.icd[it.id] || 0) > G.time) && it.active.ai(h)) { useItem(h, i); break; } }
}
function aimAt(h, t, lead, d) {
  let x = t.x, z = t.z;
  if (t.moving && lead > 0) { x += Math.sin(t.facing) * t.ms * lead * 0.8; z += Math.cos(t.facing) * t.ms * lead * 0.8; }
  const e = d.aim * (0.4 + udist(h, t) / 22); return { x: x + rand(-e, e), z: z + rand(-e, e) };
}
function farmPoint(h, range, minN) {
  let best = null, bn = 0;
  for (const m of G.units) {
    if (!m.alive || m.kind !== 'minion' || m.team === h.team || udist(h, m) > range) continue;
    let n = 0; for (const o of G.units) if (o.alive && o.kind === 'minion' && o.team === m.team && udist(o, m) < 3.2) n++;
    if (n > bn) { bn = n; best = m; }
  }
  return bn >= minN ? best : null;
}
// a rough idea of how much damage a bot can put out in the next couple of seconds: a few attacks and whatever abilities are ready
function botBurst(h) {
  let n = 0; for (let i = 0; i < 4; i++) { const ab = h.def.abilities[i]; if (ab && !ab.passive && h.al[i] && h.cd[i] <= 0 && h.mana >= ab.cost) n += i === 3 ? 2 : 1; }
  return (h.ad * 2.2 + (60 + 18 * h.level + h.ap * 0.6) * n) * (DMG_K[h.def.id] || 1) * 0.8;
}
function foesNear(h, x, z, r) { let n = 0; for (const o of G.heroes) if (o.alive && o.team !== h.team && dist(o.x, o.z, x, z) < r) n++; return n; }

// mode: fight | lane | retreat | jungle
function botCast(h, mode, tgt, nf) {
  const A = h.ai, d = A.d;
  if (G.time < A.castAt || h.silenced || h.castLock > 0 || h.dash || h.stunned) return false;
  if (Math.random() > d.cast) return false;
  const mpP = h.mana / h.maxMana, hpP = h.hp / h.maxHp, nfd = nf ? udist(h, nf) : 99, fb = BASES[h.team].fountain, jung = mode === 'jungle';
  for (let i = 3; i >= 0; i--) {
    const ab = h.def.abilities[i]; if (!ab || ab.passive || !h.al[i]) continue; const ai = ab.ai, freeC = ab.free ? ab.free(h) : false;
    if (h.cd[i] > 0 || (!freeC && h.mana < ab.cost)) continue;
    if (jung && (ai.ult || mpP < 0.45 || (ab.ind.type === 'target' && ab.ind.hero))) continue;
    const rng = ai.r || ab.range, dT = tgt ? udist(h, tgt) : 99, tHp = tgt ? tgt.hp / tgt.maxHp : 1;
    const ultOk = !ai.ult || freeC || (tgt && (tHp < ai.hp || foesNear(h, tgt.x, tgt.z, ai.rad || 6) >= 2));
    const manaOk = mode === 'fight' || jung || mpP > 0.38 || i === 3;
    let pt = null;
    switch (ai.t) {
      case 'shot':
        if (mode !== 'retreat' && tgt && dT < rng * 0.93 && ultOk && manaOk) pt = aimAt(h, tgt, ai.sp ? dT / ai.sp : 0.25, d);
        else if (ai.healLine) { const a = G.heroes.find(o => o.alive && o.team === h.team && o !== h && o.hp / o.maxHp < 0.6 && udist(h, o) < ab.range * 0.9); if (a) pt = { x: a.x, z: a.z }; }
        if (!pt && ai.farm && mode === 'lane' && mpP > 0.62) { const m = farmPoint(h, ab.range * 0.85, 3); if (m) pt = { x: m.x, z: m.z }; }
        break;
      case 'point':
        if (mode !== 'retreat' && tgt && dT < ab.range + (ai.rad || 2) * 0.5 && ultOk && manaOk) pt = aimAt(h, tgt, ai.delay || 0.3, d);
        else if (ai.trap && mode === 'retreat' && nfd < 8) pt = { x: h.x, z: h.z };
        break;
      case 'target':
        if (mode !== 'retreat' && tgt && dT < ab.range + tgt.radius && ultOk && manaOk) pt = { x: tgt.x, z: tgt.z, unit: tgt };
        else if (ai.farm && mode === 'lane' && mpP > 0.65) { const m = farmPoint(h, ab.range, 3); if (m) pt = { x: m.x, z: m.z, unit: m }; }
        break;
      case 'cone':
        if (mode !== 'retreat' && tgt && dT < ab.range * 0.85) pt = { x: tgt.x, z: tgt.z };
        else if (ai.farm && mode === 'lane' && mpP > 0.55) { const m = farmPoint(h, ab.range * 0.8, 2); if (m) pt = { x: m.x, z: m.z }; }
        break;
      case 'nova':
        if (tgt && dT < rng && ultOk && (mode !== 'retreat' || !ai.ult)) pt = { x: h.x, z: h.z };
        else if (ai.farm && mode === 'lane' && mpP > 0.6 && farmPoint(h, rng * 0.9, 3)) pt = { x: h.x, z: h.z };
        break;
      case 'buff': if ((mode === 'fight' || jung) && tgt && dT < h.range + 4) pt = { x: h.x, z: h.z }; break;
      case 'shield': if (G.time - h.lastDamageT < 1.2 && hpP < 0.8 && (nfd < 14 || jung)) pt = { x: h.x, z: h.z }; break;
      case 'parry': if (G.time - h.lastDamageT < 0.6 && nfd < 5.5) pt = { x: h.x, z: h.z }; break;
      case 'panic': if (hpP < ai.hp && nfd < 9 && G.time - h.lastDamageT < 2) pt = { x: h.x, z: h.z }; break;
      case 'gap':
        if (mode === 'fight' && tgt && ultOk) { if ((dT > h.range + 1.5 || ai.ult) && dT < ab.range + (ai.rad ? 1.5 : 0.5) + (ai.re ? 5 : 0)) pt = { x: tgt.x, z: tgt.z }; }
        else if (mode === 'retreat' && ai.escape && nfd < 10) { const a = angTo(h.x, h.z, fb.x, fb.z); pt = { x: h.x + Math.sin(a) * ab.range, z: h.z + Math.cos(a) * ab.range }; }
        break;
      case 'escape':
        if (mode === 'retreat' && nfd < 10) { const a = angTo(h.x, h.z, fb.x, fb.z); pt = { x: h.x + Math.sin(a) * ab.range, z: h.z + Math.cos(a) * ab.range }; }
        else if (ai.kite && mode === 'fight' && tgt && tgt.range < 5 && dT < 4.2) { const a = angTo(tgt.x, tgt.z, h.x, h.z) + rand(-0.6, 0.6); pt = { x: h.x + Math.sin(a) * ab.range, z: h.z + Math.cos(a) * ab.range }; }
        break;
      case 'shieldAlly': {
        let a = null; for (const o of G.heroes) if (o.alive && o.team === h.team && udist(h, o) < ab.range && o.hp / o.maxHp < 0.65 && G.time - o.lastDamageT < 2 && (!a || o.hp / o.maxHp < a.hp / a.maxHp)) a = o;
        if (a) pt = { x: a.x, z: a.z, unit: a }; break;
      }
      case 'save': {   // team-wide rescue: someone nearby is about to die
        if (G.heroes.some(o => o.alive && o.team === h.team && udist(h, o) < ai.r && o.hp / o.maxHp < ai.hp && G.time - o.lastDamageT < 1.5) && nfd < 18) pt = { x: h.x, z: h.z }; break;
      }
      case 'missile': {   // long-range homing volley: any enemy hero in range
        let n = 0, low = false; for (const o of G.heroes) if (o.alive && o.team !== h.team && udist(h, o) < ab.range) { n++; if (o.hp / o.maxHp < 0.35) low = true; }
        if (n && (mode === 'fight' || low || (mode === 'lane' && mpP > 0.7))) pt = { x: h.x, z: h.z }; break;
      }
      case 'rearm': {     // refresh the basic abilities once most of them are spent in a fight
        let n = 0; for (let k = 0; k < 3; k++) if (h.def.abilities[k] && h.cd[k] > 1.5) n++;
        if (mode === 'fight' && tgt && dT < 14 && n >= 2 && h.mana > ab.cost + 110) pt = { x: h.x, z: h.z }; break;
      }
      case 'trump': {     // works on both sides: an ally in trouble comes first, otherwise the enemy we are fighting
        let a = null; for (const o of G.heroes) if (o.alive && o.team === h.team && udist(h, o) < ab.range && o.hp / o.maxHp < 0.7 && G.time - o.lastDamageT < 1.5 && (!a || o.hp / o.maxHp < a.hp / a.maxHp)) a = o;
        if (a) pt = { x: a.x, z: a.z, unit: a }; else if (mode !== 'retreat' && tgt && dT < ab.range + tgt.radius && manaOk) pt = { x: tgt.x, z: tgt.z, unit: tgt };
        break;
      }
      case 'toggle': {    // aura that also hurts its owner: on while there is something to burn, off otherwise
        const on = ab.active(h), want = hpP > 0.25 && ((nf && nfd < ai.r + 1.5) || (jung && tgt && dT < ai.r + 1) || (mode === 'lane' && hpP > 0.6 && !!farmPoint(h, ai.r, 3)));
        if (on !== !!want) pt = { x: h.x, z: h.z }; break;
      }
      case 'gline': {     // map-wide line nuke: a hurt enemy hero anywhere in reach (or a clump in the fight at hand), led by the charge-up plus the flight time
        if (mode === 'retreat') break; let best = null;
        for (const o of G.heroes) { if (!o.alive || o.team === h.team || o.inBase) continue; const dd = udist(h, o); if (dd > 95) continue; const ohp = o.hp / o.maxHp; if ((ohp < ai.hp || (mode === 'fight' && dd < 14 && foesNear(h, o.x, o.z, 6) >= 2)) && (!best || ohp < best.hp / best.maxHp)) best = o; }
        if (best) pt = aimAt(h, best, ai.delay + udist(h, best) / ai.sp, d); break;
      }
      case 'gtele': {     // global blink and blast: drop onto enemies far away when they are bunched up, already hurt, or busy with an ally; never under their tower
        if (mode === 'retreat' || hpP < 0.5) break; let best = null, bs = 0;
        for (const o of G.heroes) {
          if (!o.alive || o.team === h.team || o.inBase) continue; const dd = udist(h, o); if (dd < 12 || dd > 95) continue;
          if (G.units.some(u => u.struct && u.alive && u.team !== h.team && udist(u, o) < (u.range || 0) + 2)) continue;
          const sc = foesNear(h, o.x, o.z, 6.5) + (o.hp / o.maxHp < ai.hp ? 1.2 : 0) + (G.heroes.some(a => a.alive && a.team === h.team && a !== h && udist(a, o) < 14) ? 0.8 : 0);
          if (sc >= 2 && sc > bs) { bs = sc; best = o; }
        }
        if (best) pt = aimAt(h, best, 1.0, d); break;
      }
      case 'note': {      // the notebook: only from safety (nobody near, not hit lately), on whoever it would kill, else on the most hurt enemy
        if (h.note || nfd < 17 || G.time - h.lastDamageT < 3 || hpP < 0.35) break; let best = null, bs = 0; const est = ai.est(h);
        for (const o of G.heroes) { if (!o.alive || o.team === h.team || o.inBase) continue; const ohp = o.hp / o.maxHp, kill = o.hp < est * 0.9, sc = (kill ? 3 : 0) + (1 - ohp) * 2 + (G.time - o.lastDamageT < 3 ? 0.5 : 0); if ((kill || ohp < 0.5) && sc > bs) { bs = sc; best = o; } }
        if (best) pt = { x: best.x, z: best.z, unit: best }; break;
      }
      case 'alibi':       // shield and speed: when hurt, or when someone closes in while a name is waiting in the notebook
        if ((G.time - h.lastDamageT < 1 && hpP < 0.85 && nfd < 14) || (h.noteT > G.time && nfd < 11)) pt = { x: h.x, z: h.z }; break;
      case 'phantom': {   // a dash with a way back: through the target, and back to the afterimage when the fight turns or the retreat is shorter that way
        if (freeC) { const ph = h.phan; if (ph && ((mode === 'retreat' && dist(ph.x, ph.z, fb.x, fb.z) < dist(h.x, h.z, fb.x, fb.z) - 2) || (mode === 'fight' && hpP < 0.4 && nfd < 6 && foesNear(h, ph.x, ph.z, 6) === 0))) pt = { x: ph.x, z: ph.z }; }
        else if (mode === 'fight' && tgt && dT < ab.range - 0.5 && manaOk) { const a = angTo(h.x, h.z, tgt.x, tgt.z); pt = { x: tgt.x + Math.sin(a) * 2.5, z: tgt.z + Math.cos(a) * 2.5 }; }
        else if (mode === 'retreat' && nfd < 10) { const a = angTo(h.x, h.z, fb.x, fb.z); pt = { x: h.x + Math.sin(a) * ab.range, z: h.z + Math.cos(a) * ab.range }; }
        break;
      }
      case 'rewind': {    // back to where she stood three seconds ago: when that undoes a heavy hit, or when it is the shorter way out of a chase
        const q = tokPast(h); if (!q) break;
        if ((q.hp - h.hp > h.maxHp * 0.22 && hpP < 0.6) || (mode === 'retreat' && nf && nfd < 8 && dist(q.x, q.z, nf.x, nf.z) > nfd + 4)) pt = { x: h.x, z: h.z }; break;
      }
      case 'saw': {       // Kagari's first ability: the needle while the teeth build, the loop once they are full, the finisher only as the saw mode runs out
        if (h.sawT > G.time) { if (h.sawT - G.time < 1.6 && tgt && dT < 5.5) pt = { x: tgt.x, z: tgt.z }; break; }
        if (mode !== 'retreat' && tgt && dT < ((h.saw || 0) >= 100 ? 5.5 : rng * 0.93) && manaOk) pt = aimAt(h, tgt, 0.2, d);
        else if (ai.farm && mode === 'lane' && mpP > 0.62 && (h.saw || 0) < 100) { const m = farmPoint(h, ab.range * 0.85, 3); if (m) pt = { x: m.x, z: m.z }; }
        break;
      }
      case 'wall': {      // a wall between her and whoever is chasing her, or across the path of a wounded enemy who is running away
        if (mode === 'retreat' && nf && nfd < 8 && nfd > 2.5) { const a = angTo(h.x, h.z, nf.x, nf.z), dd = Math.min(nfd * 0.5, 4); pt = { x: h.x + Math.sin(a) * dd, z: h.z + Math.cos(a) * dd }; }
        else if (mode === 'fight' && tgt && tgt.kind === 'hero' && tHp < 0.4 && tgt.moving && dT < ab.range - 2.5 && Math.abs(angDiff(tgt.facing, angTo(h.x, h.z, tgt.x, tgt.z))) < 1) pt = { x: tgt.x + Math.sin(tgt.facing) * 3, z: tgt.z + Math.cos(tgt.facing) * 3 };
        break;
      }
      case 'healAlly': {  // a heal over time on the most hurt ally in reach, herself included
        let a = null; for (const o of G.heroes) if (o.alive && o.team === h.team && udist(h, o) < ab.range && o.hp / o.maxHp < (o === h ? 0.55 : 0.75) && !hasBuff(o, 'linheal') && (!a || o.hp / o.maxHp < a.hp / a.maxHp)) a = o;
        if (a) pt = { x: a.x, z: a.z, unit: a }; break;
      }
      case 'revive': {    // call back a fallen ally lying in reach, unless she is about to fall herself
        if (nfd < 7.5 && (hpP < 0.7 || foesNear(h, h.x, h.z, 9) > 1)) break; let b = null; for (const o of G.heroes) if (o.dead && o.team === h.team && o.respawnT > 4 && !(o.reviving > G.time) && udist(h, o) < ab.range + 2 && (!b || o.level > b.level)) b = o;
        if (b) pt = { x: b.x, z: b.z }; break;
      }
      case 'pump': {      // a steroid for whoever is fighting: the ally in a fight nearby with the most attack, else himself
        if (mode !== 'fight' && !jung) break; let a = null; for (const o of G.heroes) if (o.alive && o.team === h.team && o !== h && udist(h, o) < ab.range && G.time - (o.heroAggroT || -99) < 3 && (!a || o.ad > a.ad)) a = o;
        if (!a && tgt && dT < h.range + 3) a = h; if (a) pt = { x: a.x, z: a.z, unit: a }; break;
      }
      case 'rally': {     // the team steroid: when at least two of his side stand together and a real fight is on
        if (mode !== 'fight' || !tgt || tgt.kind !== 'hero' || dT > 12) break; let n = 0; for (const o of G.heroes) if (o.alive && o.team === h.team && udist(h, o) < ai.r) n++;
        if (n >= 2 && (n >= 3 || foesNear(h, h.x, h.z, 12) >= 2 || tHp < 0.6)) pt = { x: h.x, z: h.z }; break;
      }
      case 'swap': {      // castling: trade places with an ally in trouble who stands near enemies, if he himself is not the one in danger
        if (hpP < 0.45 || nfd < 4) break; let a = null; for (const o of G.heroes) if (o.alive && o.team === h.team && o !== h && udist(h, o) < ab.range && o.hp / o.maxHp < 0.35 && G.time - o.lastDamageT < 1.5 && foesNear(h, o.x, o.z, 6) > 0 && (!a || o.hp < a.hp)) a = o;
        if (a) pt = { x: a.x, z: a.z, unit: a }; break;
      }
      case 'shatter': {   // set off the crystals once enough of them sit on enemy heroes in reach
        let n = 0; for (const o of G.heroes) if (o.alive && o.team !== h.team && udist(h, o) < ai.r) { const b = o.buffs.find(q => q.id === 'cry' + h.id); if (b) n += b.stacks || 1; }
        if (n >= 3 || (n >= 1 && tgt && tHp < 0.25)) pt = { x: h.x, z: h.z }; break;
      }
      case 'arise': {     // raise the shadows: when enough fallen lie near, or a real fight is on
        const n = (h.corpses || []).filter(c => c.until > G.time && dist(c.x, c.z, h.x, h.z) < 15).length;
        if (n >= 3 || (n >= 1 && mode === 'fight' && tgt && dT < 10) || (mode === 'fight' && tgt && tgt.kind === 'hero' && dT < 8 && tHp < 0.6)) pt = { x: h.x, z: h.z }; break;
      }
      case 'sunder': {    // trade health with an enemy hero: only when he himself is low and someone in reach is much healthier
        if (hpP > 0.38) break; let best = null, bp = hpP + 0.28;
        for (const o of G.heroes) if (o.alive && o.team !== h.team && !o.invuln && udist(h, o) < ab.range + o.radius) { const op = o.hp / o.maxHp; if (op > bp) { bp = op; best = o; } }
        if (best) pt = { x: best.x, z: best.z, unit: best }; break;
      }
      case 'fly': {       // take wing: to run over the walls, or to catch an enemy hero who is getting away
        if (mode === 'retreat' && nfd < 11) pt = { x: h.x, z: h.z };
        else if (mode === 'fight' && tgt && tgt.kind === 'hero' && dT > h.range + 2.5 && dT < 13 && tHp < 0.55) pt = { x: h.x, z: h.z };
        break;
      }
      case 'sanct': {
        let n = 0, sx = 0, sz = 0; for (const o of G.heroes) if (o.alive && o.team === h.team && udist(h, o) < 10 && o.hp / o.maxHp < 0.6) { n++; sx += o.x; sz += o.z; }
        if ((n >= 2 && nfd < 16) || (hpP < 0.4 && nfd < 10)) pt = n ? { x: sx / n, z: sz / n } : { x: h.x, z: h.z }; break;
      }
    }
    if (pt) {
      if (pt.x !== h.x && !NAV.ok(pt.x, pt.z) && (ai.t === 'gap' || ai.t === 'escape' || ai.t === 'phantom')) { const q = NAV.nearest(pt.x, pt.z); pt.x = q.x; pt.z = q.z; }
      if (castAbility(h, i, pt)) { A.castAt = G.time + 0.45 + rand(0.5) * (2 - d.cast); return true; }
    }
  }
  return false;
}

// side activity for a quiet lane: rune, gank an over-extended enemy, or clear an own-side jungle camp
function pickTask(h) {
  const A = h.ai, myT = h.team, taken = (ty, f) => G.heroes.some(o => o !== h && o.team === myT && o.ai && o.ai.task && o.ai.task.type === ty && (!f || f(o.ai.task)));
  if (G.rune && G.rune.active && dist(h.x, h.z, RUNE_POS.x, RUNE_POS.z) < 55 && !taken('rune')) return { type: 'rune', until: G.time + 25 };
  if (A.d.aggro >= 1) {
    let best = null, bd = 60; const oc = BASES[myT].core, ec = BASES[1 - myT].core;
    for (const e of G.heroes) {
      if (!e.alive || e.team === myT) continue; const d = udist(h, e); if (d > bd || d < 18) continue;
      if (dist(e.x, e.z, oc.x, oc.z) > dist(e.x, e.z, ec.x, ec.z) - 14) continue;
      if (!G.heroes.some(a => a.alive && a.team === myT && a !== h && udist(a, e) < 16)) continue;
      bd = d; best = e;
    }
    if (best && !taken('gank', t => t.tgt === best)) return { type: 'gank', tgt: best, until: G.time + 16 };
  }
  if (h.level >= 3) {
    const camps = myT === 0 ? (A.lane === 'top' ? [0, 4] : A.lane === 'bot' ? [1, 5] : [0, 1, 4, 5]) : (A.lane === 'top' ? [3, 7] : A.lane === 'bot' ? [2, 6] : [3, 2, 7, 6]);
    for (const i of camps) if (G.camps[i].alive > 0 && (CAMPS[i].kind !== 'ogre' || h.level >= 8) && dist(h.x, h.z, CAMPS[i].x, CAMPS[i].z) < 62 && !taken('camp', t => t.i === i)) return { type: 'camp', i, until: G.time + 40 };
  }
  return null;
}
function runTask(h, hpP, nf) {
  const A = h.ai, T = A.task; let done = G.time > T.until;
  const dz = T.type === 'camp' ? CAMPS[T.i] : T.type === 'gank' ? T.tgt : T.type === 'rune' ? RUNE_POS : null; if (dz && PING.inDanger(h, dz.x, dz.z)) done = true;   // an ally marked that way as dangerous
  if (T.type === 'rune') { if (!G.rune.active) done = true; else botMove(h, RUNE_POS.x, RUNE_POS.z); }
  else if (T.type === 'camp') {
    let m = null, bd = 1e9; for (const u of G.units) if (u.alive && u.kind === 'monster' && u.camp === T.i) { const d = udist(h, u) - (u.mtype === 'big' ? 0 : 3); if (d < bd) { bd = d; m = u; } }
    if (!m || hpP < 0.42) done = true; else if (udist(h, m) < h.range + 10) { botCast(h, 'jungle', m, nf); if (!h.dash) botAttack(h, m); } else botMove(h, CAMPS[T.i].x, CAMPS[T.i].z);
  } else if (T.type === 'gank') { const e = T.tgt; if (!e.alive || udist(h, e) > 70 || udist(h, e) < 15) done = true; else botMove(h, e.x, e.z); }
  if (done) { A.task = null; A.taskCd = G.time + rand(14, 26); }
  return !done;
}

function botThink(h, dt) {
  const A = h.ai;
  if (h.dead) { if (!A.shopped) { botShop(h); A.shopped = true; } A.state = 'lane'; A.shopTrip = false; A.task = null; A.cmd = null; return; }
  A.shopped = false;
  if (h.geass && G.time < h.geass.until) { A.task = null; return; }   // under the geass the bot does not think for itself
  if (h.tauntT > G.time) { A.task = null; return; }   // taunted: he can only go for the one who called him
  A.think -= dt; if (A.think > 0) return; A.think = A.d.think * (0.8 + rand(0.4));
  if (h.inBase) botShop(h);
  if (h.dash || h.stunned) return;
  const d = A.d, myT = h.team, sgn = myT === 0 ? 1 : -1, hpP = h.hp / h.maxHp, mpP = h.mana / h.maxMana, base = BASES[myT], O = G.obj[myT];
  const foes = [], friends = [];
  // a hero in a cyberpsychosis sees everyone as a foe; his own side fights back only when he has just hit them
  for (const o of G.heroes) { if (!o.alive || o === h) continue; const dd = udist(h, o), foe = o.team !== myT || h.madT > G.time || (o.madT > G.time && G.time - (h.dmgBy[o.id] || -99) < 3); if (foe) { if (dd < 26) foes.push(o); } else if (dd < 16) friends.push(o); }
  foes.sort((a, b) => udist(h, a) - udist(h, b));
  const nf = foes[0] || null, nfd = nf ? udist(h, nf) : 99;
  let tower = null, td = 99; for (const u of G.units) if (u.struct && u.alive && u.team !== myT) { const q = udist(h, u); if (q < td) { td = q; tower = u; } }
  const underTower = tower && td < tower.range + 2.4, tCover = tower ? minionCover(myT, tower) : 0;
  const towerDanger = underTower && (tower.target === h || tCover < 2);

  // --- dodge telegraphed areas and incoming skillshots
  if (d.dodge > 0 && !h.rooted) {
    let need = false, mx = 0, mz = 0;
    for (const g of G.dangers) { if (g.team === myT) continue; const q = dist(h.x, h.z, g.x, g.z); if (q < g.r + 0.8) { need = true; const a = q > 0.15 ? angTo(g.x, g.z, h.x, h.z) : rand(TAU); mx = h.x + Math.sin(a) * (g.r + 2.5 - q); mz = h.z + Math.cos(a) * (g.r + 2.5 - q); } }
    if (!need) for (const p of G.proj) {
      if (!p.lin || p.team === myT) continue; const sp = Math.hypot(p.vx, p.vz), ux = p.vx / sp, uz = p.vz / sp, rx = h.x - p.x, rz = h.z - p.z, along = rx * ux + rz * uz;
      if (along < 0 || along > Math.min(p.left, sp * 0.7)) continue; const perp = rx * uz - rz * ux;
      if (Math.abs(perp) < p.w + h.radius + 0.5) { need = true; const s = perp >= 0 ? 1 : -1; mx = h.x + uz * s * 3.2; mz = h.z - ux * s * 3.2; }
    }
    if (need && Math.random() < d.dodge && NAV.ok(mx, mz)) { botMove(h, mx, mz, true); A.think = 0.3; return; }
  }
  // --- the player called a retreat and this bot agreed
  if (A.cmd && A.cmd.type === 'retreat' && botCmd(h, nf, nfd)) return;

  // --- retreat / recall / shop trips. A careful bot also backs off early when it is hurt and outnumbered around it
  const outnum = d.threat > 0 && hpP < 0.25 + 0.3 * d.threat && foes.filter(f => udist(h, f) < 12).length >= friends.length + 2;
  if (A.state === 'retreat') { if (h.inBase && hpP > 0.85 && mpP > 0.6) { A.state = 'lane'; A.shopTrip = false; } }
  else if (hpP < d.retreat || (hpP < 0.42 && mpP < 0.12) || outnum) { A.state = 'retreat'; if (outnum && Math.random() < 0.3) A.cmd = null; }
  else if (h.items.length < 6 && h.gold >= nextCost(h) + 120 && nfd > 22 && G.time - A.lastShop > 50 && !underTower && !O) { A.state = 'retreat'; A.shopTrip = true; }
  if (A.state === 'retreat') {
    A.task = null; botCast(h, 'retreat', nf, nf);
    if (h.inBase) { h.order = null; return; }
    const db = dist(h.x, h.z, base.fountain.x, base.fountain.z);
    if (h.recall > 0) { if (nfd > 9) return; }
    else if (nfd > 16 && !towerDanger && db > 36 && G.time - h.lastDamageT > 2.2 && !(h.recallCd > G.time)) { h.order = null; h.path = null; startRecall(h); return; }
    botMove(h, base.fountain.x, base.fountain.z); return;
  }

  // --- a name is waiting in the notebook: one scratch ruins it, so keep away from everything until it is done
  if (h.noteT > G.time) { A.task = null; botCast(h, 'retreat', nf, nf); if (!h.inBase) botMove(h, base.fountain.x, base.fountain.z); return; }

  // --- leave enemy tower range when it is unsafe
  if (towerDanger && !(A.diveT > G.time)) {
    const L = LANES[tower.lane || A.lane], ts = laneProject(L, tower.x, tower.z), p = lanePoint(L, ts - sgn * (tower.range + 5.5));
    botMove(h, p.x, p.z); botCast(h, 'retreat', nf, nf); return;
  }

  // --- base defence
  const core = G.cores[myT]; let threat = 0;
  for (const u of G.units) if (u.alive && !u.struct && u.team === 1 - myT && udist(u, core) < 24) threat += u.kind === 'hero' ? 3 : 1;
  const defend = threat >= 3 && udist(h, core) < 110 && hpP > 0.4;
  if (defend && udist(h, core) > 22) {
    A.task = null;
    if (udist(h, core) > 70 && nfd > 16 && h.recall <= 0 && !underTower && !(h.recallCd > G.time)) { h.order = null; h.path = null; startRecall(h); return; }
    if (h.recall > 0) return;
    botMove(h, core.x + sgn * 7, core.z - sgn * 7); return;
  }

  // --- calls: an ally bot in trouble asks for help; a call this bot accepted comes before its own plans
  PING.botAsk(h);
  if (A.cmd && botCmd(h, nf, nfd)) return;

  // --- fight evaluation (joins skirmishes an ally has already started nearby)
  const pw = u => (0.3 + 0.7 * u.hp / u.maxHp) * Math.sqrt(u.maxHp * (u.ad + u.ap * 0.7 + 30)) / 180;
  let tgt = null, best = -1e9;
  for (const f of foes) {
    const dd = udist(h, f), wr = f.noteT > G.time, hot = wr || G.time - f.lastDamageT < 2.5 || G.time - f.heroAggroT < 2.5;   // wr: he is waiting out a notebook entry, any hit breaks it
    if (dd > (hot ? 22 : (h.range > 5 ? 17 : 15))) continue;
    let sc = (1 - f.hp / f.maxHp) * 8 - dd * 0.35 + (f === A.tgt ? 1.5 : 0) + (wr ? 7 : 0);
    // focus: join the target the allies are already hitting; secure: a kill within reach; peel: whoever is beating up a hurt ally
    if (d.focus) { let n = 0; for (const a of friends) if ((a.order && a.order.tgt === f) || (a.ai && a.ai.tgt === f) || (a.isPlayer && G.time - (f.dmgBy[a.id] || -99) < 1.5)) n++; sc += n * 2.2 * d.focus; }
    if (d.secure && dd < h.range + 8 && f.hp < botBurst(h)) sc += 6 * d.secure;
    if (d.peel) for (const a of friends) if (a.hp / a.maxHp < 0.4 && udist(a, f) < 6 && G.time - a.lastDamageT < 1) { sc += 3.5 * d.peel; break; }
    if (sc > best) { best = sc; tgt = f; }
  }
  if (tgt) {
    let mine = pw(h), theirs = 0, dive = false;
    for (const a of friends) if (udist(a, tgt) < 15) mine += pw(a);
    for (const f of foes) if (udist(f, tgt) < 12) { theirs += pw(f); if (d.threat && f.al && f.al[3] > 0 && f.cd[3] <= 0 && f.mana >= ((f.def.abilities[3] || {}).cost || 0)) theirs += 0.35 * d.threat; }   // a ready enemy ultimate weighs on a careful bot
    for (const u of G.units) {
      if (!u.struct || !u.alive || udist(u, tgt) > u.range + 2) continue;
      if (u.team === myT) mine += 1.6;
      else { const kill = tgt.hp / tgt.maxHp < 0.25 && hpP > 0.55 && d.aggro >= 1; theirs += kill ? 0.5 : (minionCover(myT, u) >= 2 ? 1.2 : 2.6); dive = kill; }
    }
    mine *= d.aggro * (0.6 + hpP * 0.5);
    let fight = mine > theirs || (tgt.hp / tgt.maxHp < 0.3 && mine > theirs * 0.7);
    if (A.state === 'fight' && mine > theirs * 0.8) fight = true;
    if (fight) {
      A.state = 'fight'; A.tgt = tgt; if (dive) A.diveT = G.time + 2.5;
      if (botCast(h, 'fight', tgt, nf)) return;
      if (h.range > 5 && nf && nf.range < 5 && nfd < 4.2 && h.atkCd > 0.3 && d.dodge > 0.2 && !h.rooted) {
        const a = angTo(nf.x, nf.z, h.x, h.z), mx = h.x + Math.sin(a) * 3.5, mz = h.z + Math.cos(a) * 3.5; if (NAV.ok(mx, mz)) { botMove(h, mx, mz, true); A.think = 0.3; return; }
      }
      botAttack(h, tgt); return;
    }
    if (theirs > mine * 1.3 && nfd < 11) {
      const L = LANES[A.lane], s = laneProject(L, h.x, h.z), p = lanePoint(L, s - sgn * 10);
      A.task = null; botCast(h, 'retreat', nf, nf); botMove(h, p.x, p.z); A.state = 'lane'; return;
    }
  }
  A.state = 'lane'; A.tgt = null;

  // --- team objective: Rift Warden
  if (O && O.type === 'boss' && hpP > 0.5 && G.boss) {
    const B = G.boss, near = G.heroes.filter(a => a.alive && a.team === myT && udist(a, B) < 14).length; A.task = null;
    if (udist(h, B) < 13 && near >= 3) { botCast(h, 'jungle', B, nf); if (!h.dash) botAttack(h, B); } else botMove(h, BOSS_POS.x - 6.5, BOSS_POS.z - 6.5);
    return;
  }

  // --- laning (a team push overrides the assigned lane)
  // a spot an ally marked as dangerous: step out of it rather than walk around inside
  const Z = PING.inDanger(h, h.x, h.z);
  if (Z && !(A.cmd && A.cmd.type === 'attack')) { const a = angTo(Z.x, Z.z, base.fountain.x, base.fountain.z), q = NAV.nearest(Z.x + Math.sin(a) * (Z.r + 3), Z.z + Math.cos(a) * (Z.r + 3)); A.task = null; botMove(h, q.x, q.z); return; }
  const laneName = A.cmd && A.cmd.type === 'push' && A.cmd.lane ? A.cmd.lane : (O && O.type === 'push' ? O.lane : A.lane), L = LANES[laneName]; let frontS = null, noWave = false;
  for (const m of G.units) if (m.alive && m.kind === 'minion' && m.team === myT && m.lane === laneName) { const s = laneProject(L, m.x, m.z); if (frontS === null || (s - frontS) * sgn > 0) frontS = s; }
  let ownT = null; for (const u of G.units) if (u.kind === 'tower' && u.alive && u.team === myT && u.lane === laneName && (!ownT || (u.laneS - ownT.laneS) * sgn > 0)) ownT = u;
  let et = null; for (const u of G.units) if (u.kind === 'tower' && u.alive && u.team !== myT && u.lane === laneName && (!et || (u.laneS - et.laneS) * sgn < 0)) et = u;
  let etS; if (et) etS = et.laneS; else { et = G.cores[1 - myT]; etS = myT === 0 ? L.len : 0; }
  const cover = minionCover(myT, et), unsafe = m => cover < 2 && udist(m, et) < et.range + 1.5;
  const reach = h.range + (h.range > 5 ? 2.5 : 6);
  let lastHit = null, nearM = null, nd = 1e9, eMin = 0, siege = 0; const hitDmg = h.ad * 1.12;
  // playing support in a duo lane: while the damage dealer is next to us, we do not take last hits and we harass more
  const supp = h.lrole === 'sup' && G.heroes.some(o => o !== h && o.alive && o.team === myT && o.lrole === 'dmg' && udist(o, h) < 20);
  for (const m of G.units) {
    if (!m.alive || m.team === myT || m.kind !== 'minion') continue; const dd = udist(h, m);
    if (dd < 22) eMin++; if (ownT && udist(m, ownT) < 15) siege++;
    if (dd > reach + m.radius || unsafe(m)) continue;
    if (!supp && m.hp <= hitDmg * 100 / (100 + m.arm) && Math.random() < d.lasthit && (!lastHit || m.hp < lastHit.hp)) lastHit = m;
    if (supp && m.hp < m.maxHp * 0.5) continue;   // a lane support leaves the low creeps to the partner
    if (dd < nd) { nd = dd; nearM = m; }
  }
  // --- quiet lane: pick up a side task instead of idling under the tower
  if (A.task && (siege >= 3 || defend)) { A.task = null; A.taskCd = G.time + 10; }
  if (!A.task && !O && !A.cmd && !defend && G.time > A.taskCd && eMin === 0 && siege === 0 && nfd > 20 && hpP > 0.6) { A.task = pickTask(h); if (!A.task) A.taskCd = G.time + 6; }
  if (A.task && runTask(h, hpP, nf)) return;

  if (frontS === null) {
    noWave = true; frontS = ownT ? ownT.laneS + sgn * 2 : (myT === 0 ? 20 : L.len - 20);
    // no wave to follow and nothing threatening: step up toward the middle of the lane instead of waiting at the tower
    if (eMin === 0 && nfd > 16 && hpP > 0.5) { const mid = L.len / 2 - sgn * 7; if ((mid - frontS) * sgn > 0) frontS = mid; }
  }
  if (defend) frontS = myT === 0 ? 16 : L.len - 16;
  let wantS = frontS - sgn * (noWave ? 0 : (h.range > 5 ? 5.5 : 1.5));
  if (cover < 2) { const lim = etS - sgn * (et.range + 3.5); if ((wantS - lim) * sgn > 0) wantS = lim; }
  let pushT = null;
  if (targetable(h, et) && udist(h, et) < h.range + et.radius + 9 && cover >= 2 && (nfd > 9 || hpP > 0.55)) pushT = et;
  let harass = null; if (nf && nfd < h.range + nf.radius + 2.5 && hpP > 0.45 && !unsafe(nf)) harass = nf;
  if (botCast(h, 'lane', harass || (nf && !unsafe(nf) ? nf : null), nf)) return;
  if (lastHit) botAttack(h, lastHit);
  else if (pushT && (!nearM || h.range < 5 || Math.random() < 0.6)) botAttack(h, pushT);
  else if (harass && Math.random() < (h.range > 5 ? 0.6 : 0.3) * d.aggro * (supp ? 1.5 : 1)) botAttack(h, harass);
  else if (nearM && hpP > 0.35) botAttack(h, nearM);
  else {
    if (G.time > A.jitT) { A.jitT = G.time + rand(0.8, 1.9); A.jo = rand(-4.6, 4.6); A.js = rand(-1.5, 1.5); }
    const p = lanePoint(L, wantS + A.js); let tx = p.x + p.dz * A.jo, tz = p.z - p.dx * A.jo;
    if (!NAV.ok(tx, tz)) { tx = p.x; tz = p.z; }
    if (dist(h.x, h.z, tx, tz) > 1.2) botMove(h, tx, tz); else if (h.order && h.order.type === 'move') h.order = null;
  }
}
