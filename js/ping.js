'use strict';
/* ===== pings: commands to the allied bots. Hold the ping key (Left Alt by default) — a wheel of eight calls opens at the cursor;
   point the mouse at one and let go. Let go without choosing and the call depends on what is under the cursor (an enemy — attack, your
   own tower — defend, anything else — «look here»). The call is marked on the ground and on the minimap, and every bot decides for itself
   whether to follow it: health, distance, the odds of the fight, its own temper. Whoever answers says so in the feed, with the reason
   when it refuses. Following bots carry the call out in botThink (ai.js) through botCmd ===== */
const PING_T = {
  attack: { n: 'Атаковать', c: '#ff6a5e', say: ['Иду!', 'Атакую!', 'Вперёд!', 'Беру на себя'] },
  gather: { n: 'Собраться здесь', c: '#9fd0ff', say: ['Иду к вам', 'Уже бегу', 'Буду там'] },
  help: { n: 'Ко мне!', c: '#ffd36a', say: ['Держись, иду!', 'Бегу на помощь', 'Прикрою!'] },
  push: { n: 'Давим линию', c: '#7dffa8', say: ['Давим!', 'Иду пушить', 'Ломаем башню'] },
  retreat: { n: 'Отступаем', c: '#c9b8ff', say: ['Отхожу', 'Понял, назад', 'Отступаю'] },
  danger: { n: 'Осторожно', c: '#ffb04a', say: ['Понял, обхожу', 'Вижу, не лезу'] },
  defend: { n: 'Защищать', c: '#5aa7ff', say: ['Защищаю', 'Встану здесь', 'Иду в оборону'] },
  boss: { n: 'Страж Разлома', c: '#b48cff', say: ['Идём на Стража!', 'Беру Стража', 'Собираемся у Стража'] },
  look: { n: 'Внимание', c: '#ecc56f', say: [] }
};
const PING_WHEEL = ['attack', 'gather', 'help', 'push', 'retreat', 'danger', 'defend', 'boss'];   // clockwise from the top
// little line icons for the wheel and the ground marker (24×24 paths)
const PING_SVG = {
  attack: 'M5 19 19 5M14 5h5v5M5 5l14 14M5 14v5h5', gather: 'M12 3v4M12 17v4M3 12h4M17 12h4M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6', help: 'M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z',
  push: 'M4 12h13M12 6l6 6-6 6', retreat: 'M20 12H7M11 6l-6 6 6 6', danger: 'M12 3 2 20h20zM12 9v5M12 17v.5', defend: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z', boss: 'M4 18l2-10 4 4 2-7 2 7 4-4 2 10z', look: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6'
};
const PING = {
  open: false, sx: 0, sy: 0, sel: -1, at: null, unit: null, last: [], zones: [],
  svg(k, col) { return `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="${col || 'currentColor'}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="${PING_SVG[k]}"/></svg>`; },
  // the wheel: built once, shown at the cursor
  build() {
    if ($('pingw')) return; const w = document.createElement('div'); w.id = 'pingw'; w.hidden = true;
    w.innerHTML = PING_WHEEL.map((k, i) => { const a = i / 8 * TAU - HPI, R = 92; return `<div class="pw-s" data-i="${i}" style="left:${Math.cos(a) * R}px;top:${Math.sin(a) * R}px;--pc:${PING_T[k].c}">${this.svg(k)}<span>${PING_T[k].n}</span></div>`; }).join('') + '<div class="pw-c"><b></b><small></small></div><div class="pw-h">отпустите или ЛКМ — отправить · ПКМ — сделать стандартной</div>';
    document.body.appendChild(w);
  },
  // A short tap of the key sends the default call at once (GFX.pingDef: 'auto' — by what is under the cursor — or one fixed call);
  // the wheel only opens when the key is held (or the mouse moves off at once). In the wheel: point and let go, or left-click;
  // right-click a call to make it the default; the centre (no direction) is the default too
  start() {
    const P = G.player; if (!P || G.over || G.paused || G.state !== 'play') return; this.build();
    this.open = true; this.shown = false; this.sx = mouse.x; this.sy = mouse.y; this.sel = -1;
    const mm = UI.mmAt(mouse.x, mouse.y); this.unit = mm ? null : pickUnit(u => u.alive && (u.kind === 'hero' || u.struct || u.boss) && u !== P);
    this.at = mm || { x: G.mx, z: G.mz }; if (this.unit) this.at = { x: this.unit.x, z: this.unit.z };
    clearTimeout(this.tm); this.tm = setTimeout(() => this.show(), 180);
  },
  show() {
    if (!this.open || this.shown) return; this.shown = true;
    // the wheel stays whole on screen: near an edge it opens a little inward (the direction is read from its centre)
    this.sx = clamp(this.sx, 140, innerWidth - 140); this.sy = clamp(this.sy, 140, innerHeight - 140);
    const w = $('pingw'); w.style.left = this.sx + 'px'; w.style.top = this.sy + 'px'; w.hidden = false;
    for (const s of w.querySelectorAll('.pw-s')) s.classList.toggle('def', PING_WHEEL[+s.dataset.i] === GFX.pingDef);
    this.hover();
  },
  def() { const d = GFX.pingDef; return d && PING_T[d] && d !== 'auto' ? d : this.auto(); },
  // which call the mouse points at (nothing near the centre)
  hover() {
    if (!this.open) return; const dx = mouse.x - this.sx, dy = mouse.y - this.sy, d = Math.hypot(dx, dy);
    if (!this.shown) { if (d > 16) this.show(); return; }
    this.sel = d < 24 ? -1 : (Math.round(((Math.atan2(dy, dx) + HPI) / TAU) * 8) % 8 + 8) % 8;
    const w = $('pingw'); for (const s of w.querySelectorAll('.pw-s')) s.classList.toggle('on', +s.dataset.i === this.sel);
    const k = this.sel < 0 ? this.def() : PING_WHEEL[this.sel], c = w.querySelector('.pw-c'); c.querySelector('b').textContent = PING_T[k].n;
    c.querySelector('small').textContent = this.sel < 0 ? (this.unit ? this.unit.name : 'стандартная') : (this.unit && k === 'attack' ? this.unit.name : (PING_WHEEL[this.sel] === GFX.pingDef ? '★ стандартная' : 'ПКМ — стандартная')); c.style.setProperty('--pc', PING_T[k].c);
  },
  // a mouse button while the wheel is open: left sends what is pointed at, right makes it the default call (the wheel stays open)
  click(b) {
    if (!this.shown) { if (b === 0) { this.end(); return true; } return false; }
    if (b === 0) { this.end(); return true; }
    if (b === 2) { if (this.sel >= 0) { const k = PING_WHEEL[this.sel]; setGfx('pingDef', GFX.pingDef === k ? 'auto' : k); if (UI.syncGfx) UI.syncGfx(); SFX.play('ui'); UI.msg(GFX.pingDef === 'auto' ? 'Короткое нажатие: метка по ситуации' : 'Короткое нажатие теперь: «' + PING_T[k].n + '»'); for (const s of $('pingw').querySelectorAll('.pw-s')) s.classList.toggle('def', PING_WHEEL[+s.dataset.i] === GFX.pingDef); this.hover(); } return true; }
    return false;
  },
  auto() { const u = this.unit, P = G.player; if (u && u.team !== P.team && u.team !== 2) return 'attack'; if (u && u.boss) return 'boss'; if (u && u.struct && u.team === P.team) return 'defend'; return 'look'; },
  cancel() { this.open = false; this.shown = false; clearTimeout(this.tm); if ($('pingw')) $('pingw').hidden = true; },
  end() {
    if (!this.open) return; const k = this.sel < 0 ? this.def() : PING_WHEEL[this.sel]; this.cancel();
    const now = performance.now(); this.last = this.last.filter(t => now - t < 5000); if (this.last.length >= 4) { UI.msg('Не так часто: подождите пару секунд'); SFX.play('deny'); return; }
    this.last.push(now); this.send(G.player, k, this.at.x, this.at.z, k === 'attack' || k === 'defend' || k === 'boss' || k === 'look' ? this.unit : null);
  },
  /* a call is made (by the player, or by a bot asking for help) */
  send(from, k, x, z, unit) {
    const T = PING_T[k], P = G.player, mine = from.team === P.team; if (!mine) return;
    if (k === 'attack' && !(unit && unit.alive && unit.team !== from.team)) { unit = null; }   // attack the ground: a fight wherever that is
    this.mark(k, x, z, unit, T.c); SFX.play(k === 'danger' || k === 'retreat' ? 'warn' : 'cue', 0.5);
    UI.feed(`<b style="color:${from === P ? '#eafff0' : TEAM_CSS[from.team]}">${from === P ? 'Вы' : esc(from.name)}</b>: <span style="color:${T.c}">${T.n}</span>${unit && k !== 'look' && k !== 'boss' ? ' · ' + esc(unit.name) : ''}`, 'chat');
    if (k === 'danger') this.zones.push({ team: from.team, x, z, r: 11, until: G.time + 12 });
    if (k === 'look') return;
    // every allied bot hears it and decides for itself; the answers come in after a moment
    const ans = []; for (const h of G.heroes) if (h.ai && h.team === from.team && h !== from) { const r = this.judge(h, k, x, z, unit, from); if (r) ans.push(Object.assign(r, { h })); }
    const yes = ans.filter(a => a.ok), no = ans.filter(a => !a.ok && a.say);
    if (k === 'boss' && yes.length >= 2) G.obj[from.team] = { type: 'boss', until: G.time + 45, call: true };
    if (k === 'push' && yes.length) { const ln = this.laneAt(x, z); for (const a of yes) a.cmd.lane = ln; }
    let n = 0; for (const a of yes) { after(a.delay, () => { if (!a.h.ai) return; a.h.ai.cmd = a.cmd; if (n++ < 4 || a.say) this.say(a.h, a.say); }); }
    no.sort(() => Math.random() - 0.5).slice(0, yes.length ? 1 : 2).forEach(a => after(a.delay, () => this.say(a.h, a.say, true)));
    if (!yes.length && !no.length && from === P) after(1, () => UI.feed('<span style="color:#8b94a4">Никто из союзников не откликнулся</span>', 'chat'));
  },
  say(h, s, refuse) { if (!s || !G.player) return; UI.feed(`<b style="color:${TEAM_CSS[h.team]}">${esc(h.name)}</b>: <span style="color:${refuse ? '#a7afbd' : '#dfe3ea'}">«${s}»</span>`, 'chat'); },
  laneAt(x, z) { let best = 'mid', bd = 1e9; for (const n of LANE_NAMES) { laneProject(LANES[n], x, z); if (laneProject.d < bd) { bd = laneProject.d; best = n; } } return best; },
  // the power of a side near a spot (the same yardstick the bots use for their own fights)
  power(team, x, z, r) { let s = 0; for (const o of G.heroes) if (o.alive && o.team === team && dist(o.x, o.z, x, z) < r) s += (0.3 + 0.7 * o.hp / o.maxHp) * Math.sqrt(o.maxHp * (o.ad + o.ap * 0.7 + 30)) / 180; return s; },
  /* one bot weighs one call: { ok, say, delay, cmd } or null (stays silent) */
  judge(h, k, x, z, unit, from) {
    const A = h.ai, d = A.d, obey = A.obey === undefined ? (A.obey = rand(0.5, 0.95)) : A.obey, hpP = h.hp / h.maxHp, far = dist(h.x, h.z, x, z), pick = a => a[Math.floor(Math.random() * a.length)];
    const delay = rand(0.35, 1.1) + far / 120, T = PING_T[k], cmd = { type: k, x, z, tgt: unit, by: from, until: G.time + ({ attack: 14, gather: 16, help: 14, push: 35, retreat: 7, danger: 0, defend: 26, boss: 40 }[k] || 10) };
    if (h.dead) return k === 'retreat' || k === 'danger' || Math.random() > 0.55 ? null : { ok: false, say: `Я мёртв, вернусь через ${Math.ceil(h.respawnT)} сек`, delay };
    const roll = Math.random();
    switch (k) {
      case 'retreat': return far < 45 || udist(h, from) < 45 ? { ok: roll < obey + 0.35, say: roll < obey + 0.35 ? pick(T.say) : 'Ещё секунду, добью', delay: delay * 0.6, cmd } : null;
      case 'danger': return far < 40 && roll < 0.5 ? { ok: true, say: pick(T.say), delay, cmd: null } : null;
      case 'attack': {
        if (unit && !unit.alive) return null;
        if (far > 60) return roll < 0.35 ? { ok: false, say: 'Далеко, не успею', delay } : null;
        if (hpP < 0.35) return { ok: false, say: 'Мало здоровья, сначала на базу', delay };
        if (unit && unit.struct && !targetable(h, unit)) return { ok: false, say: 'Её не пробить: сначала внешние башни', delay };
        // the odds there: our side (with whoever is already near) against theirs, towers count too
        const mine = this.power(h.team, x, z, 24) + (far >= 24 ? (0.3 + 0.7 * hpP) * Math.sqrt(h.maxHp * (h.ad + h.ap * 0.7 + 30)) / 180 : 0);   // he counts himself in if he is not there yet
        let theirs = this.power(1 - h.team, x, z, 14); for (const u of G.units) if (u.struct && u.alive && u.team !== h.team && dist(u.x, u.z, x, z) < u.range + 3) theirs += 2.2;
        const odds = mine / Math.max(0.3, theirs), strict = 0.55 + 0.35 * (d.threat || 0);
        if (odds < strict) return roll < 0.8 ? { ok: false, say: theirs > 2.5 ? 'Их там слишком много' : 'Плохая затея — проиграем', delay } : null;
        if (roll < obey + (odds - 1) * 0.25) return { ok: true, say: pick(T.say), delay, cmd };
        return roll < 0.5 ? { ok: false, say: 'Не сейчас, я на линии', delay } : null;
      }
      case 'help': case 'gather': {
        if (far > (k === 'help' ? 55 : 75)) return roll < 0.3 ? { ok: false, say: 'Я далеко', delay } : null;
        if (k === 'help') { const near = G.heroes.filter(o => o.ai && o.alive && o.team === h.team && o !== from).sort((a, b) => udist(a, from) - udist(b, from)); if (near.indexOf(h) > 1) return null; }
        if (hpP < 0.35) return { ok: false, say: 'Сам еле живой', delay };
        if (roll < obey + 0.2) { if (k === 'help') { cmd.follow = from; } return { ok: true, say: pick(T.say), delay, cmd }; }
        return roll < 0.45 ? { ok: false, say: 'Позже, я занят', delay } : null;
      }
      case 'defend': {
        if (far > 85) return null; if (hpP < 0.3) return { ok: false, say: 'Нужно подлечиться', delay };
        return roll < obey + 0.15 ? { ok: true, say: pick(T.say), delay, cmd } : (roll < 0.5 ? { ok: false, say: 'Там и без меня справятся', delay } : null);
      }
      case 'push': {
        if (hpP < 0.45) return { ok: false, say: 'Сначала подлечусь', delay };
        return roll < obey ? { ok: true, say: pick(T.say), delay, cmd } : (roll < 0.4 ? { ok: false, say: 'Я лучше на своей линии', delay } : null);
      }
      case 'boss': {
        if (!(G.boss && G.boss.alive)) return Math.random() < 0.5 ? { ok: false, say: G.time < 120 ? 'Страж ещё не проснулся' : 'Стража сейчас нет', delay } : null;
        const al = G.heroes.filter(o => o.alive && o.team === h.team).length, lv = G.heroes.filter(o => o.team === h.team).reduce((s, o) => s + o.level, 0) / 5;
        if (al < 3) return { ok: false, say: 'Нас слишком мало для Стража', delay };
        if (lv < 6) return { ok: false, say: 'Рано, он нас разорвёт', delay };
        if (hpP < 0.5) return { ok: false, say: 'Подлечусь и приду', delay };
        return roll < obey + 0.25 ? { ok: true, say: pick(T.say), delay, cmd } : { ok: false, say: 'Не уверен, давайте позже', delay };
      }
    }
    return null;
  },
  // the mark: a ring and a short beam on the ground, an icon above it, a blinking circle on the minimap
  icons: {},
  iconTex(k, col) {
    const key = k + col; if (this.icons[key]) return this.icons[key];
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
    g.fillStyle = 'rgba(10,12,17,.85)'; g.beginPath(); g.arc(32, 32, 28, 0, TAU); g.fill(); g.strokeStyle = col; g.lineWidth = 3; g.stroke();
    g.save(); g.translate(14, 14); g.scale(1.5, 1.5); g.strokeStyle = col; g.lineWidth = 2.2; g.lineCap = g.lineJoin = 'round'; g.stroke(new Path2D(PING_SVG[k])); g.restore();
    return (this.icons[key] = new THREE.CanvasTexture(c));
  },
  mark(k, x, z, unit, col) {
    const c = new THREE.Color(col).getHex(), dur = k === 'danger' ? 4 : 3;
    mmMark({ x, z, r: 7, color: col, until: G.time + dur });
    if (!FX.near(x, z, 80)) return;
    FX.ring(x, z, { r0: 0.4, r1: 3.2, color: c, life: 0.6, tex: 'shock' }); FX.ring(x, z, { r0: 2.4, r1: 1.2, color: c, life: 0.5, tex: 'ringThin' });
    FX.pillar(x, z, { r: 0.35, h: 7, color: c, life: 0.9, op: 0.5 });
    if (unit && unit.alive) FX.aura(unit, c, dur, unit.radius + 0.8, 'ringThin', 3);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.iconTex(k, col), depthWrite: false, depthTest: false, transparent: true })); s.renderOrder = 30;
    FX.add(s, dur, (q, me, dt, en) => { const ux = unit && unit.alive ? unit.x : x, uz = unit && unit.alive ? unit.z : z, y = (unit && unit.alive ? (unit.height || 2) + 1.8 : 3) + Math.sin(en.t * 5) * 0.15; me.position.set(ux, y, uz); const sc = Math.min(1, en.t * 7) * 1.6 * (q > 0.85 ? (1 - q) / 0.15 : 1); me.scale.set(sc, sc, 1); });
  },
  // the bots' own calls: an ally in trouble asks for help now and then
  botAsk(h) {
    if (!G.player || h.team !== G.player.team || G.time < (h.askT || 0)) return;
    const hpP = h.hp / h.maxHp, foes = G.heroes.filter(o => o.alive && o.team !== h.team && udist(o, h) < 10).length;
    if (hpP < 0.45 && foes >= 2 && G.time - h.lastDamageT < 1) { h.askT = G.time + 35; this.send(h, 'help', h.x, h.z, null); }
  },
  inDanger(h, x, z) { for (let i = this.zones.length - 1; i >= 0; i--) { const Z = this.zones[i]; if (G.time > Z.until) { this.zones.splice(i, 1); continue; } if (Z.team === h.team && dist(x, z, Z.x, Z.z) < Z.r) return Z; } return null; },
  reset() { this.cancel(); this.zones.length = 0; this.last.length = 0; }
};

/* ---------- a bot carries out a call it accepted. Returns true when the call decided what the bot does this think ---------- */
function botCmd(h, nf, nfd) {
  const A = h.ai, C = A.cmd; if (!C) return false;
  const hpP = h.hp / h.maxHp, done = (say) => { A.cmd = null; if (say) PING.say(h, say); return false; };
  if (G.time > C.until) return done();
  if (C.type !== 'retreat' && hpP < A.d.retreat) return done(Math.random() < 0.5 ? 'Мне надо отойти' : null);
  const fb = BASES[h.team].fountain;
  switch (C.type) {
    case 'retreat': {   // back to the nearest own tower that is closer to home than we are, or home
      if (!C.to) { let best = null, bd = 1e9; const dh = dist(h.x, h.z, fb.x, fb.z); for (const u of G.units) if (u.struct && u.alive && u.team === h.team && dist(u.x, u.z, fb.x, fb.z) < dh - 4) { const q = udist(h, u); if (q < bd) { bd = q; best = u; } } C.to = best ? NAV.nearest(best.x + (fb.x - best.x) * 0.12, best.z + (fb.z - best.z) * 0.12) : { x: fb.x, z: fb.z }; }
      if (dist(h.x, h.z, C.to.x, C.to.z) < 4) return done();
      botCast(h, 'retreat', nf, nf); botMove(h, C.to.x, C.to.z); return true;
    }
    case 'attack': {
      const t = C.tgt;
      if (t) {
        if (!t.alive) return done(t.kind === 'hero' && Math.random() < 0.5 ? 'Готово!' : null);
        if (udist(h, t) > 70) return done();
        A.state = 'fight'; A.tgt = t; if (udist(h, t) < 16 && botCast(h, 'fight', t, nf)) return true;
        if (t.struct && !targetable(h, t)) return done(); botAttack(h, t); A.diveT = G.time + 1.5; return true;
      }
      // a fight on the ground: go there; once there the usual fight logic takes over
      if (dist(h.x, h.z, C.x, C.z) > 9) { botMove(h, C.x, C.z); return true; } return done();
    }
    case 'help': case 'gather': case 'defend': {
      const px = C.follow && C.follow.alive ? C.follow.x : C.x, pz = C.follow && C.follow.alive ? C.follow.z : C.z;
      if (C.follow && !C.follow.alive) return done();
      const dd = dist(h.x, h.z, px, pz), foesThere = G.heroes.some(o => o.alive && o.team !== h.team && dist(o.x, o.z, px, pz) < 15);
      if (dd > 10) { if (nf && nfd < 7 && foesThere) return false; botMove(h, px, pz); return true; }
      if (foesThere || (nf && nfd < 12)) return false;   // there and enemies near: the normal fight logic
      if (C.type === 'help' && C.follow && G.time - C.follow.lastDamageT > 6 && G.time > C.until - 6) return done();
      // hold the spot: drift around it, attack minions that come close
      if (G.time > A.jitT) { A.jitT = G.time + rand(1, 2); A.jo = rand(-3, 3); A.js = rand(-3, 3); }
      const m = G.units.find(u => u.alive && u.kind === 'minion' && u.team !== h.team && dist(u.x, u.z, px, pz) < 11);
      if (m) botAttack(h, m); else { const q = NAV.nearest(px + A.jo, pz + A.js); if (dist(h.x, h.z, q.x, q.z) > 1.5) botMove(h, q.x, q.z); else if (h.order && h.order.type === 'move') h.order = null; }
      return true;
    }
    case 'boss': {
      const B = G.boss; if (!B || !B.alive) return done(Math.random() < 0.6 ? 'Стража больше нет' : null);
      const near = G.heroes.filter(a => a.alive && a.team === h.team && udist(a, B) < 14).length;
      if (udist(h, B) < 13 && near >= 3) { botCast(h, 'jungle', B, nf); if (!h.dash) botAttack(h, B); } else botMove(h, BOSS_POS.x - 6.5, BOSS_POS.z - 6.5);
      return true;
    }
  }
  return false;   // 'push' only changes the lane (see botThink)
}
