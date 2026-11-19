'use strict';
/* ===== ranked mode: rating points (ОРП), ranks, the ban/pick draft before a match, giving a match up =====
   A ranked match is an ordinary match against bots on the same map. What differs: both line-ups are drafted first (the player bans and picks
   for his whole team, bots do it for the other side), the bots' level follows the player's rank, and the result moves his rating:
   +10 for a win, -5…-10 for a loss depending on his match rating, -10 for giving up or leaving. */
const RK_TIERS = { 'Глист': [0xd98aa2, 'rkworm'], 'Кал': [0xa5713f, 'rkpoo'], 'Игрок': [0x8fb0d8, 'rkplayer'], 'Талант': [0x58d08a, 'rktalent'], 'Босс': [0xecc56f, 'rkboss'], 'Убийца': [0xff5c52, 'rkkiller'], 'Узурпатор': [0xb48cff, 'rkusurp'] };
// [tier, division, the first rating point of the rank]
const RANKS = [['Глист', 1, 0], ['Глист', 2, 134], ['Глист', 3, 267], ['Кал', 1, 401], ['Кал', 2, 534], ['Кал', 3, 667], ['Игрок', 1, 801], ['Игрок', 2, 867], ['Игрок', 3, 934],
  ['Талант', 1, 1001], ['Талант', 2, 1134], ['Талант', 3, 1267], ['Босс', 1, 1401], ['Босс', 2, 1534], ['Босс', 3, 1667], ['Убийца', 1, 1801], ['Убийца', 2, 1867], ['Убийца', 3, 1934], ['Узурпатор', 0, 2000]];
const rkName = q => q[0] + (q[1] ? ' ' + q[1] : '');
function rankOf(orp) {
  let i = 0; for (let k = 0; k < RANKS.length; k++) if (orp >= RANKS[k][2]) i = k;
  const r = RANKS[i], nx = RANKS[i + 1], t = RK_TIERS[r[0]];
  return { i, tier: r[0], div: r[1], name: rkName(r), min: r[2], next: nx ? nx[2] : null, nextName: nx ? rkName(nx) : null, col: t[0], icon: t[1] };
}
function rankChip(orp) { const r = rankOf(orp); return `<span class="rkb" style="--rc:${css(r.col)}"><img src="${iconURL(r.icon, r.col)}" alt=""><b>${r.name}</b><i class="num">${orp} ОРП</i></span>`; }
const RK_LANE = { top: 'верх', mid: 'центр', bot: 'низ' }, RK_ROLE = { dmg: 'урон', sup: 'поддержка' }, RK_ORD = { top: 0, mid: 1, bot: 2 };
const DR_SLOTS = [['mid', 'dmg'], ['top', 'dmg'], ['bot', 'dmg'], ['top', 'sup'], ['bot', 'sup']];
// what a full line-up is made of, and which hero classes fill each part
const DR_NEED = { mid: ['mage', 'assassin'], marks: ['marks'], front: ['front'], sup: ['support'] }, DR_NEED_RU = { mid: 'маг или убийца в центр', marks: 'стрелок', front: 'танк или боец', sup: 'поддержка' };
const DR_TIME = 30;

const RANKED = {
  d: null, iv: 0, note: '', armed: null,
  // the ranked record inside the saved profile, made sound whatever an old save holds
  rk() { const p = PROFILE; if (!p.rk || typeof p.rk !== 'object') p.rk = {}; const r = p.rk; r.orp = Math.max(0, Math.round(+r.orp || 0)); r.peak = Math.max(+r.peak || 0, r.orp); r.g = +r.g || 0; r.w = +r.w || 0; r.st = Math.max(0, Math.round(+r.st || 0)); if (!Array.isArray(r.hist)) r.hist = []; return r; },
  // win streak: from the fifth win in a row a win is worth 15 ОРП, then one more for each further win, up to 20
  winGain(st) { return st >= 5 ? Math.min(20, 15 + (st - 5)) : 10; },
  botDiff(orp) { return orp < 801 ? 0 : (orp < 1401 ? 1 : 2); },
  // "a ranked match is being played in this browser": survives a closed tab, so leaving that way costs the same as giving up
  live(v) { try { if (v === undefined) return localStorage.getItem('ashrift.rklive') === '1'; if (v) localStorage.setItem('ashrift.rklive', '1'); else localStorage.removeItem('ashrift.rklive'); } catch (e) { } return false; },
  init() {
    $('ranked').onclick = () => { SFX.init(); SFX.play('ui'); this.open(); };
    $('giveup').onclick = () => this.pauseAct('giveup'); $('quit').onclick = () => this.pauseAct('quit');
    this.show();
  },
  show() { const r = this.rk(), c = $('rkchip'), c2 = $('rkchip2'); if (c) c.innerHTML = rankChip(r.orp); if (c2) c2.innerHTML = 'Ваше звание: ' + rankChip(r.orp); const n = $('rknote'); if (n) n.textContent = this.note; },
  checkAbandon() {
    if (!this.live() || G.state === 'play') return; this.live(false);
    const r = this.rk(), before = r.orp; r.orp = Math.max(0, before - 10); r.g++; r.st = 0; r.hist.push(r.orp - before); if (r.hist.length > 10) r.hist.shift(); SAVE.touch();
    this.note = 'Прошлый рейтинговый матч не был доигран — он засчитан как сдача: −' + (before - r.orp) + ' ОРП'; this.show();
  },
  /* ----- the pause menu: give up (every mode), leave (in a ranked match it costs the same); each asks once more before it acts ----- */
  pauseAct(kind) {
    const rk = !!G.ranked && !G.over;
    if (kind === 'quit' && !rk) { togglePause(false); toMenu(); return; }
    if (this.armed !== kind) { this.armed = kind; this.syncPause(true); SFX.play('deny'); return; }
    this.armed = null;
    if (kind === 'giveup') { $('pause').hidden = true; if (surrender()) UI.announce('Вы сдались', '#ff8a80'); }
    else { this.settle(false, 0, true); togglePause(false); toMenu(); this.note = 'Вы покинули рейтинговый матч: −10 ОРП'; this.show(); }
  },
  syncPause(keep) {
    if (!keep) this.armed = null; const g = $('giveup'), q = $('quit'); if (!g || !q) return; const rk = !!G.ranked && !G.over;
    g.hidden = !!G.sandbox; g.textContent = this.armed === 'giveup' ? 'Точно сдаться?' + (rk ? ' −10 ОРП' : '') : 'Сдаться' + (rk ? ' (−10 ОРП)' : '');
    q.textContent = this.armed === 'quit' ? 'Точно выйти? −10 ОРП' : (rk ? 'Выйти в меню (−10 ОРП)' : 'Выйти в меню');
    g.classList.toggle('warn', this.armed === 'giveup'); q.classList.toggle('warn', this.armed === 'quit');
  },
  /* ----- the result of a ranked match ----- */
  settle(win, score, gaveUp) {
    const R = G.ranked; if (!R || R.done) return null; R.done = true; this.live(false);
    const r = this.rk(), before = r.orp; r.st = win ? r.st + 1 : 0; const nominal = win ? this.winGain(r.st) : -(gaveUp ? 10 : clamp(Math.round(10 - (score - 3) * 1.25), 5, 10));
    r.orp = Math.max(0, before + nominal); r.peak = Math.max(r.peak, r.orp); r.g++; if (win) r.w++; r.hist.push(r.orp - before); if (r.hist.length > 10) r.hist.shift(); SAVE.touch();
    return (R.res = { before, after: r.orp, delta: r.orp - before, nominal, win, gaveUp, score, st: r.st });
  },
  endHTML(res) {
    const a = rankOf(res.after), b = rankOf(res.before), span = a.next === null ? 1 : (res.after - a.min) / (a.next - a.min), sg = v => (v >= 0 ? '+' : '−') + Math.abs(v);
    const why = res.win ? (res.nominal > 10 ? `Победа, серия из ${res.st} подряд: +${res.nominal} ОРП` : 'Победа: +10 ОРП' + (res.st > 1 ? ` · побед подряд: ${res.st}` + (res.st === 4 ? ' — следующая принесёт +15' : '') : '')) : (res.gaveUp ? 'Сдача: −10 ОРП' : `Поражение: оценка вашей игры ${res.score.toFixed(1)} из 10 — это ${sg(res.nominal)} ОРП (от −5 за сильную игру до −10 за слабую)`) + (res.delta !== res.nominal ? '. Ниже нуля рейтинг не опускается' : '');
    const move = a.i > b.i ? `<b class="up">Новое звание: ${a.name}!</b><br>` : (a.i < b.i ? `<b class="dn">Звание понижено: ${a.name}</b><br>` : '');
    return `<div class="erk" style="--rc:${css(a.col)}"><img src="${iconURL(a.icon, a.col)}" alt=""><div class="erkb"><small>РЕЙТИНГОВЫЙ МАТЧ</small><b>${a.name}</b><span class="num">${res.before} → <b>${res.after}</b> ОРП <em class="${res.delta >= 0 ? 'up' : 'dn'}">${sg(res.delta)}</em></span><div class="rkbar"><i style="width:${Math.round(span * 100)}%"></i></div><small>${a.next === null ? 'ВЫСШЕЕ ЗВАНИЕ' : `до звания «${a.nextName}» — ${a.next - res.after} ОРП`}</small></div><p>${move}${why}</p></div>`;
  },
  /* ----- the lobby: the player's rank, the rules, the whole ladder ----- */
  open() { $('menu').hidden = true; $('draft').hidden = false; $('draft').scrollTop = 0; this.note = ''; this.d = null; this.lobby(); },
  close() { clearInterval(this.iv); this.iv = 0; this.d = null; $('draft').hidden = true; $('menu').hidden = false; this.show(); },
  lobby() {
    const r = this.rk(), k = rankOf(r.orp), diff = ['лёгкие', 'средние', 'сложные'][this.botDiff(r.orp)], span = k.next === null ? 1 : (r.orp - k.min) / (k.next - k.min);
    const ladder = RANKS.map((q, i) => { const c = RK_TIERS[q[0]], nx = RANKS[i + 1]; return `<div class="rkrow${i === k.i ? ' me' : ''}" style="--rc:${css(c[0])}"><img src="${iconURL(c[1], c[0])}" alt=""><b>${rkName(q)}</b><span class="num">${nx ? q[2] + '–' + (nx[2] - 1) : q[2] + '+'}</span></div>`; }).join('');
    const hist = r.hist.length ? r.hist.map(v => `<em class="${v >= 0 ? 'up' : 'dn'}">${v >= 0 ? '+' : '−'}${Math.abs(v)}</em>`).join(' ') : 'пока нет';
    $('dwrap').innerHTML = `<div class="dtop2"><h2>РЕЙТИНГОВЫЙ РЕЖИМ<small>очки рейтингового пепла · ОРП</small></h2><button class="btn" id="dback" type="button">Назад в меню</button></div>
      <div class="rklobby"><div class="rkcard" style="--rc:${css(k.col)}">
        <div class="rkhero"><img src="${iconURL(k.icon, k.col)}" alt=""><div><b>${k.name}</b><span class="num">${r.orp} ОРП</span><small>${k.next === null ? 'Высшее звание' : `до звания «${k.nextName}» — ${k.next - r.orp} ОРП`}</small></div></div>
        <div class="rkbar"><i style="width:${Math.round(span * 100)}%"></i></div>
        <div class="rkstat"><span>Матчей: <b class="num">${r.g}</b></span><span>Побед: <b class="num">${r.w}</b>${r.g ? ' (' + Math.round(r.w / r.g * 100) + '%)' : ''}</span><span>Лучший рейтинг: <b class="num">${r.peak}</b></span><span>Последние матчи: ${hist}</span></div>
        <ul class="rkrules"><li>Перед матчем — <b>драфт</b>: команды по очереди запрещают по одному герою, затем по очереди берут по одному. Так пять кругов: у каждой команды 5 банов и 5 героев. Вы баните и выбираете за всю свою команду, за соперников это делают боты.</li>
          <li>Когда команды собраны, вы решаете, <b>за кого из своих пяти</b> играете, и выбираете линию и роль. Остальных расставит по линиям игра.</li>
          <li>Победа: <b class="up">+10 ОРП</b>. Поражение: <b class="dn">от −5 до −10 ОРП</b> — чем лучше вы сыграли, тем меньше потеря. Сдача или выход из матча: <b class="dn">−10 ОРП</b>.</li>
          <li>Серия побед: после четырёх побед подряд каждая следующая приносит <b class="up">+15 ОРП</b>, дальше на 1 больше за каждую, до <b class="up">+20</b>. Поражение обрывает серию.${r.st ? ` Сейчас побед подряд: <b>${r.st}</b>.` : ''}</li>
          <li>Соперники на вашем звании: <b>${diff} боты</b> (до «Игрока» — лёгкие, до «Босса» — средние, дальше — сложные).</li></ul>
        <button class="btn pri" id="dgo" type="button">НАЧАТЬ ДРАФТ</button></div>
        <div class="rkladder"><h4>ЗВАНИЯ</h4>${ladder}</div></div>`;
    $('dback').onclick = () => { SFX.play('ui'); this.close(); }; $('dgo').onclick = () => { SFX.play('buy'); this.begin(); };
  },
  /* ----- the draft: twenty steps in rounds of four — ban, ban, pick, pick; the side that goes first is drawn by lot ----- */
  turn(step) { const r = step % 4, first = this.d.first; return { team: r % 2 === 0 ? first : 1 - first, act: r < 2 ? 'ban' : 'pick' }; },
  state(id) { const d = this.d; if (d.bans[0].includes(id) || d.bans[1].includes(id)) return 'ban'; if (d.picks[0].includes(id)) return 'p0'; if (d.picks[1].includes(id)) return 'p1'; return ''; },
  begin() {
    this.d = { stage: 'draft', first: Math.random() < 0.5 ? 0 : 1, step: 0, bans: [[], []], picks: [[], []], sel: null, timer: DR_TIME, botT: 1.8, filter: 'all', tb: 0, me: null, lane: 'top', role: 'dmg', ally: null, enemy: null };
    const roles = [['all', 'Все'], ['front', 'Танки и бойцы'], ['assassin', 'Убийцы'], ['mage', 'Маги'], ['marks', 'Стрелки'], ['support', 'Поддержка']];
    const team = (t, name) => `<div class="dteam t${t}" id="dt${t}"><h4>${name}</h4><div class="dslots" id="dp${t}"></div><h5>БАНЫ</h5><div class="dslots dbans" id="db${t}"></div></div>`;
    $('dwrap').innerHTML = `<div class="dtop2"><h2>ДРАФТ<small>${this.d.first === 0 ? 'по жребию первыми ходите вы' : 'по жребию первыми ходят соперники'}</small></h2><button class="btn" id="dleave" type="button">Выйти из драфта</button></div>
      <div class="dhead2">${team(0, 'ВАША КОМАНДА')}<div class="dmid"><div id="dphase"></div><div id="dtimer" class="num"></div><div id="dhint"></div></div>${team(1, 'СОПЕРНИКИ')}</div>
      <div id="dstage"><div class="chips" id="drolef" style="margin-bottom:10px">${roles.map(([id, nm], i) => `<button type="button" id="df-${id}"${i ? '' : ' class="on"'}>${nm}</button>`).join('')}</div>
        <div class="dgrid" id="dgrid">${HEROES.map(h => `<button type="button" class="dtile" id="dt-${h.id}"><img src="${UI.portraits[h.id] || ''}" alt=""><i>${h.roleName}</i><b>${h.name}</b></button>`).join('')}</div></div>
      <div class="dfoot"><div id="dsel"></div><button class="btn pri" id="dconfirm" type="button"></button></div>`;
    $('dleave').onclick = () => { SFX.play('ui'); this.close(); };
    for (const [id] of roles) $('df-' + id).onclick = () => { this.d.filter = id; for (const q of roles) $('df-' + q[0]).classList.toggle('on', q[0] === id); SFX.play('ui'); this.render(); };
    for (const h of HEROES) { const b = $('dt-' + h.id); b.onclick = () => { if (this.d.stage !== 'draft' || this.state(h.id)) return; this.d.sel = h.id; SFX.play('ui'); this.render(); }; b.ondblclick = () => { if (this.d.stage === 'draft' && this.turn(this.d.step).team === 0) this.act(h.id); }; }
    $('dconfirm').onclick = () => this.confirm();
    clearInterval(this.iv); this.iv = setInterval(() => this.tick(0.2), 200); $('draft').scrollTop = 0; this.render();
  },
  confirm() { const d = this.d; if (!d) return; if (d.stage === 'assign') { this.start(); return; } if (d.sel && this.turn(d.step).team === 0) this.act(d.sel); },
  tick(dt) {
    const d = this.d; if (!d || d.stage !== 'draft' || $('draft').hidden) return; const cur = this.turn(d.step);
    if (cur.team === 1) { d.botT -= dt; if (d.botT <= 0) this.act(cur.act === 'ban' ? this.botBan(1) : this.botPick(1)); return; }
    const t0 = Math.ceil(d.timer); d.timer -= dt;
    if (d.timer <= 0) { this.act(cur.act === 'ban' ? this.botBan(0) : this.botPick(0)); return; }   // out of time: the game decides for the player
    if (Math.ceil(d.timer) !== t0) { const el = $('dtimer'); el.textContent = Math.ceil(d.timer); el.classList.toggle('low', d.timer <= 5); if (d.timer <= 5) SFX.play('ui'); }
  },
  // one step of the draft: the side whose turn it is bans or takes `id`
  act(id) {
    const d = this.d; if (!d || d.stage !== 'draft' || !id || this.state(id)) return false; const cur = this.turn(d.step);
    (cur.act === 'ban' ? d.bans : d.picks)[cur.team].push(id); d.step++; if (d.sel && this.state(d.sel)) d.sel = null; d.timer = DR_TIME; d.botT = 1.1 + Math.random() * 1.3; SFX.play(cur.act === 'ban' ? 'deny' : 'buy');
    if (d.step >= 20) { this.toAssign(); return true; }
    if (this.turn(d.step).team === 0) SFX.play('cue'); this.render(); return true;
  },
  // what team t still lacks for a full line-up (a centre hero, a marksman, a frontliner, two supports)
  needs(t) {
    const need = ['mid', 'marks', 'front', 'sup', 'sup'], take = k => { const i = need.indexOf(k); if (i < 0) return false; need.splice(i, 1); return true; };
    for (const id of this.d.picks[t]) {
      const r = HEROES.find(q => q.id === id).role;
      if (r === 'support') take('sup') || take('front'); else if (r === 'mage') take('mid') || take('marks') || take('front'); else if (r === 'assassin') take('mid') || take('front') || take('marks');
      else if (r === 'marks') take('marks') || take('mid') || take('front'); else take('front') || take('mid') || take('marks');
    }
    return need.slice(0, 5 - this.d.picks[t].length);
  },
  power(h) { return h.bars[0] + h.bars[1] * 0.7 + h.bars[2] * 0.7 + h.bars[3] * 0.5; },
  best(list, noise) { return list.map(h => [this.power(h) + Math.random() * noise, h]).sort((a, b) => b[0] - a[0])[0][1].id; },
  botPick(t) {
    const A = HEROES.filter(h => !this.state(h.id)); if (!A.length) return null;
    for (const k of shuffle(this.needs(t).slice())) { const c = A.filter(h => DR_NEED[k].includes(h.role)); if (c.length) return this.best(c, 3.5); }
    return this.best(A, 3.5);
  },
  // a ban by team t: the bots sometimes take away the player's most played heroes, otherwise a strong hero of a kind the other side still needs
  botBan(t) {
    const A = HEROES.filter(h => !this.state(h.id)); if (!A.length) return null; const d = this.d, o = 1 - t;
    if (o === 0 && d.tb < 2 && Math.random() < 0.55) { const P = PROFILE.heroes || {}, fav = A.filter(h => P[h.id] && P[h.id].g >= 2).sort((a, b) => P[b.id].g - P[a.id].g); if (fav.length) { d.tb++; return fav[0].id; } }
    const need = this.needs(o), k = need.length ? pick(need) : null, c = k ? A.filter(h => DR_NEED[k].includes(h.role)) : [];
    return this.best(c.length ? c : A, 4);
  },
  // put heroes on the five lane slots so that each stands where its class fits best; `fixed` pins one hero (the player) to a slot
  assign(ids, fixed) {
    const fit = (def, s) => { const r = def.role; if (s[1] === 'sup') return r === 'support' ? 3 : (r === 'front' ? 0.8 : (r === 'mage' ? 0.6 : 0.2)); if (s[0] === 'mid') return r === 'mage' || r === 'assassin' ? 3 : (r === 'marks' ? 1.6 : (r === 'front' ? 1.2 : 0.1)); return r === 'marks' || r === 'front' ? 3 : (r === 'assassin' ? 2.2 : (r === 'mage' ? 2 : 0.1)); };
    const slots = DR_SLOTS.filter(s => !fixed || !(s[0] === fixed.lane && s[1] === fixed.role)), free = ids.filter(id => !fixed || id !== fixed.id).map(id => HEROES.find(h => h.id === id));
    let best = free.slice(), bs = -1;
    const perm = (arr, n) => { if (n === arr.length) { let s = Math.random() * 0.01; for (let i = 0; i < n; i++) s += fit(arr[i], slots[i]); if (s > bs) { bs = s; best = arr.slice(); } return; } for (let i = n; i < arr.length; i++) { [arr[n], arr[i]] = [arr[i], arr[n]]; perm(arr, n + 1); [arr[n], arr[i]] = [arr[i], arr[n]]; } };
    perm(free, 0);
    const out = best.map((def, i) => ({ id: def.id, lane: slots[i][0], role: slots[i][1] })); if (fixed) out.unshift({ id: fixed.id, lane: fixed.lane, role: fixed.role });
    return out;
  },
  render() {
    const d = this.d; if (!d) return; const draft = d.stage === 'draft', cur = draft ? this.turn(d.step) : null;
    for (const t of [0, 1]) {
      $('dt' + t).classList.toggle('act', !!cur && cur.team === t);
      for (const [box, list, act] of [['dp', d.picks[t], 'pick'], ['db', d.bans[t], 'ban']]) {
        let h = ''; for (let i = 0; i < 5; i++) { const id = list[i], def = id && HEROES.find(q => q.id === id), now = !!cur && cur.team === t && cur.act === act && i === list.length; h += `<div class="dslot${def ? ' f' : ''}${now ? ' cur' : ''}"${def ? ` title="${def.name}"` : ''}>${def ? `<img src="${UI.portraits[id] || ''}" alt=""><span>${def.name}</span>` : ''}</div>`; }
        $(box + t).innerHTML = h;
      }
    }
    if (!draft) return;
    const mine = cur.team === 0, ban = cur.act === 'ban', need = this.needs(0);
    $('dphase').innerHTML = `<small>круг ${Math.floor(d.step / 4) + 1} из 5</small>${ban ? 'БАН' : 'ВЫБОР'} · <span class="t${cur.team}">${mine ? 'ваш ход' : 'соперник'}</span>`;
    const tm = $('dtimer'); tm.textContent = mine ? Math.ceil(d.timer) : '…'; tm.classList.toggle('low', mine && d.timer <= 5);
    $('dhint').textContent = need.length ? 'Вашей команде ещё нужны: ' + need.map(k => DR_NEED_RU[k]).join(', ') : 'Ваша команда собрана';
    for (const def of HEROES) { const b = $('dt-' + def.id), st = this.state(def.id); b.className = 'dtile' + (st ? ' off ' + st : '') + (d.sel === def.id ? ' sel' : ''); b.hidden = d.filter !== 'all' && def.role !== d.filter; }
    const sd = d.sel && HEROES.find(q => q.id === d.sel), c = $('dconfirm');
    $('dsel').innerHTML = sd ? `<b style="color:${css(sd.look.glow)}">${sd.name}</b> · ${sd.roleName} · ${sd.title}` : (mine ? (ban ? 'Щёлкните по герою, которого запрещаете обеим командам' : 'Щёлкните по герою, которого берёте в свою команду') + ' (двойной щелчок — сразу)' : 'Соперник думает…');
    c.textContent = ban ? 'ЗАБАНИТЬ' : 'ВЫБРАТЬ'; c.disabled = !mine || !sd; c.classList.toggle('ban', ban);
  },
  /* ----- after the draft: which of the five the player takes, his lane and role; the rest are placed by class ----- */
  toAssign() {
    const d = this.d; d.stage = 'assign'; clearInterval(this.iv); this.iv = 0; d.sel = null; d.enemy = this.assign(d.picks[1]);
    d.me = d.picks[0].includes(PROFILE.hero) ? PROFILE.hero : d.picks[0][0]; this.autoSlot();
    $('dphase').innerHTML = '<small>драфт окончен</small>КОМАНДЫ СОБРАНЫ'; $('dtimer').textContent = ''; $('dhint').textContent = 'Выберите героя, линию и роль';
    $('dstage').innerHTML = `<h3 class="dh3">За кого вы играете?<small>остальными четырьмя управляют боты</small></h3>
      <div class="dmine" id="dmine" style="margin:10px 0 12px">${d.picks[0].map(id => { const h = HEROES.find(q => q.id === id); return `<button type="button" class="card" id="dm-${id}" style="--hc:${css(h.look.glow)}"><img src="${UI.portraits[id] || ''}" alt=""><span class="nm"><b>${h.name}</b><i>${h.roleName}</i></span></button>`; }).join('')}</div>
      <div class="go" style="margin-bottom:12px"><div class="grp"><label>Линия</label><div class="seg">${LANE_NAMES.map(l => `<button type="button" id="dl-${l}">${{ top: 'Верх', mid: 'Центр', bot: 'Низ' }[l]}</button>`).join('')}</div></div>
        <div class="grp"><label>Роль</label><div class="seg"><button type="button" id="dr-dmg">Урон</button><button type="button" id="dr-sup">Поддержка</button></div></div><p class="rolenote" id="dnote"></p></div>
      <div class="dline"><div class="dlist t0" id="dl0"></div><div class="dlist t1" id="dl1"></div></div>`;
    for (const id of d.picks[0]) $('dm-' + id).onclick = () => { d.me = id; this.autoSlot(); SFX.play('ui'); this.renderAssign(); };
    for (const l of LANE_NAMES) $('dl-' + l).onclick = () => { d.lane = l; if (l === 'mid') d.role = 'dmg'; SFX.play('ui'); this.renderAssign(); };
    for (const r of ['dmg', 'sup']) $('dr-' + r).onclick = () => { if (d.lane === 'mid') return; d.role = r; SFX.play('ui'); this.renderAssign(); };
    SFX.play('level'); this.render(); this.renderAssign();
  },
  // the lane and role the chosen hero would get if the game placed all five
  autoSlot() { const d = this.d, a = this.assign(d.picks[0]).find(s => s.id === d.me); d.lane = a.lane; d.role = a.role; },
  renderAssign() {
    const d = this.d, r = this.rk(), diff = ['лёгкие', 'средние', 'сложные'][this.botDiff(r.orp)]; if (d.lane === 'mid') d.role = 'dmg';
    d.ally = this.assign(d.picks[0], { id: d.me, lane: d.lane, role: d.role });
    for (const id of d.picks[0]) $('dm-' + id).classList.toggle('sel', id === d.me);
    for (const l of LANE_NAMES) $('dl-' + l).classList.toggle('on', l === d.lane);
    for (const k of ['dmg', 'sup']) { const b = $('dr-' + k); b.classList.toggle('on', d.lane !== 'mid' && k === d.role); b.disabled = d.lane === 'mid'; }
    $('dnote').textContent = d.lane === 'mid' ? 'В центре вы один — роль не выбирается' : (d.role === 'dmg' ? 'На вашей линии будет союзник в роли поддержки' : 'На вашей линии будет союзник с уроном, а вы его прикрываете');
    const list = (rows, me) => rows.slice().sort((a, b) => RK_ORD[a.lane] - RK_ORD[b.lane] || (a.role === 'dmg' ? -1 : 1)).map(s => { const h = HEROES.find(q => q.id === s.id); return `<div class="drow${s.id === me ? ' me' : ''}"><img src="${UI.portraits[s.id] || ''}" alt=""><b>${h.name}${s.id === me ? ' (вы)' : ''}</b><span>${RK_LANE[s.lane]} · ${RK_ROLE[s.role]}</span></div>`; }).join('');
    $('dl0').innerHTML = '<h4>ВАША КОМАНДА</h4>' + list(d.ally, d.me); $('dl1').innerHTML = '<h4>СОПЕРНИКИ</h4>' + list(d.enemy, null);
    const me = HEROES.find(q => q.id === d.me), c = $('dconfirm');
    $('dsel').innerHTML = `<b style="color:${css(me.look.glow)}">${me.name}</b> · ${RK_LANE[d.lane]} · ${RK_ROLE[d.role]} · соперники: ${diff} боты · победа <b class="up">+10</b>, поражение <b class="dn">−5…−10</b> ОРП`;
    c.textContent = 'В БОЙ'; c.disabled = false; c.classList.remove('ban');
  },
  start() {
    const d = this.d; if (!d || d.stage !== 'assign') return; const r = this.rk(), pre = { ally: d.ally.filter(s => s.id !== d.me), enemy: d.enemy };
    clearInterval(this.iv); this.iv = 0; this.d = null; $('draft').hidden = true; SFX.init(); SFX.play('buy');
    PROFILE.hero = d.me; this.live(true); SAVE.touch();
    startMatch(d.me, this.botDiff(r.orp), d.lane, d.role, false, pre); G.ranked.orp = r.orp;
    UI.announce('Рейтинговый матч · ' + rankOf(r.orp).name, '#b9a2ff');
  }
};
