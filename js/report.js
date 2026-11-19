'use strict';
/* ===== the match report: everything that happened in a match, recorded while it runs and laid out on the end screen
   (and again from the profile, for the last REP_MAX matches) in tabs: overview, table, graphs, damage, timeline, «my match».
   Recording: game.js calls REP.start / REP.dmg / REP.kill / REP.ev / REP.cast / REP.tick; DMG_CTX tells which ability a hit came from.
   Storage: the reports are kept apart from the profile (they are big and do not belong in the progress code): localStorage 'ashrift.rep' + an IndexedDB copy ===== */
const REP_MAX = 20, REP_STEP = 15;
const REP_SLOTS = ['Q', 'W', 'E', 'R'];
const REP_SRC = { atk: 'Атаки', item: 'Предметы', pet: 'Призванные', oth: 'Пассивки и прочее' };
const REP_COL = ['#5aa7ff', '#b48cff', '#58c56a', '#ecc56f', '#dfe3ea', '#e8a04c', '#5fe8c8', '#8b94a4'];   // Q W E R, attacks, items, summons, other
const REP_PART = [['dmg', 2.8, 'Урон по героям'], ['kda', 2.4, 'Убийства и смерти'], ['heal', 1.7, 'Поддержка'], ['part', 1.4, 'Участие в убийствах'], ['tower', 1.1, 'Урон по башням'], ['tank', 0.6, 'Принятый урон'], ['gold', 0.6, 'Золото'], ['win', 0.6, 'Победа'], ['death', -1.6, 'Штраф за смерти']];
const REP = {
  cur: null, list: null,
  /* ---------- recording ---------- */
  start(pre) {
    const H = G.heroes; H.forEach((h, i) => { h.repI = i; h.repLog = []; });
    const z = () => H.map(() => 0);
    G.report = null; this.cur = { t0: Date.now(), next: 0, s: [], ev: [], fb: false,
      hs: H.map(() => ({ ab: [0, 0, 0, 0], abH: [0, 0, 0, 0], abC: [0, 0, 0, 0], atk: 0, atkH: 0, item: 0, itemH: 0, pet: 0, petH: 0, oth: 0, othH: 0, to: z(), from: z(), tw: 0, cr: 0, mo: 0, ft: 0 })) };
  },
  slot(h, o, pet) { const c = DMG_CTX; if (c && c.h === h) return c.item ? 'item' : c.i; if (pet) return 'pet'; return o && o.basic ? 'atk' : 'oth'; },
  dmg(src, tgt, d, o) {
    const C = this.cur; if (!C || !(d > 0) || G.over) return;
    let h = src, pet = false; if (src.kind !== 'hero') { if (src.owner && src.owner.kind === 'hero') { h = src.owner; pet = true; } else h = null; }
    // what hurt a hero: kept for the last seconds before each death, and summed by kind
    if (tgt.kind === 'hero' && tgt.repI !== undefined) {
      const T = C.hs[tgt.repI]; let lab;
      if (h && h.repI !== undefined) { if (h.team !== tgt.team) T.from[h.repI] += d; const sl = this.slot(h, o, pet); lab = h.repI + ':' + sl; }
      else if (src.struct) { T.tw += d; lab = 'tower'; } else if (src.kind === 'minion') { T.cr += d; lab = 'creep'; } else if (src.kind === 'monster') { T.mo += d; lab = src.boss ? 'boss' : 'mon'; } else { T.ft += d; lab = 'other'; }
      const L = tgt.repLog; L.push([G.time, lab, d]); if (L.length > 60) L.splice(0, 20);
    }
    if (!h || h.repI === undefined || tgt.struct || tgt.team === h.team) return;
    const S = C.hs[h.repI], sl = this.slot(h, o, pet), hero = tgt.kind === 'hero';
    if (typeof sl === 'number') { S.ab[sl] += d; if (hero) S.abH[sl] += d; } else { S[sl] += d; if (hero) S[sl + 'H'] += d; }
    if (hero) S.to[tgt.repI] += d;
  },
  cast(h, i) { const C = this.cur; if (C && h.repI !== undefined) C.hs[h.repI].abC[i]++; },
  ev(e) { const C = this.cur; if (!C || G.over) return; e.t = Math.round(G.time); C.ev.push(e); },
  kill(u, killer) {
    const C = this.cur; if (!C || G.over || u.repI === undefined) return;
    const by = killer && killer.repI !== undefined ? killer.repI : -1, a = [];
    for (const id in u.dmgBy) if (G.time - u.dmgBy[id] < 10) { const o = G.heroes.find(x => x.id === +id); if (o && o.repI !== by && o.team !== u.team) a.push(o.repI); }
    // what killed him: the damage he took in the last 8 seconds, by source, the biggest first
    const acc = {}; for (const [t, lab, d] of u.repLog) if (G.time - t <= 8) acc[lab] = (acc[lab] || 0) + d;
    const dd = Object.entries(acc).sort((x, y) => y[1] - x[1]).slice(0, 4).map(([l, d]) => [l, Math.round(d)]);
    const lh = u.lastHitBy, src = by >= 0 ? null : (lh ? (lh.struct ? 'tower' : lh.kind === 'minion' ? 'creep' : lh.kind === 'monster' ? 'mon' : 'other') : 'other');
    const e = { k: 'kill', v: u.repI, by, a, dd, src, multi: killer && killer.multi > 1 ? killer.multi : 0, fb: !C.fb && by >= 0 };
    if (by >= 0) C.fb = true; u.repLog = []; this.ev(e);
  },
  totXp(h) { let s = h.xp; for (let l = 1; l < h.level; l++) s += xpNeed(l); return s; },
  tick() { const C = this.cur; if (!C || G.time < C.next) return; C.next = Math.floor(G.time / REP_STEP) * REP_STEP + REP_STEP; C.s.push([Math.round(G.time)].concat(G.heroes.map(h => Math.round(h.goldTotal)), G.heroes.map(h => Math.round(this.totXp(h))))); },
  // the crystal fell: the whole match in one object (also what the profile keeps)
  finish() {
    const C = this.cur; if (!C) return null; this.cur = null; const H = G.heroes, P = G.player, R = matchRatings();
    C.s.push([Math.round(G.time)].concat(H.map(h => Math.round(h.goldTotal)), H.map(h => Math.round(this.totXp(h)))));
    const sc = h => R.find(r => r.h === h), r1 = v => Math.round(v);
    const hs = H.map((h, i) => {
      const S = C.hs[i], r = sc(h), def = h.def;
      return { id: def.id, n: h.name, t: h.team, p: h.isPlayer ? 1 : 0, lane: h.ai ? h.ai.lane : G.pLane, role: h.lrole || '', lv: h.level, k: h.kills, d: h.deaths, a: h.assists, cs: h.cs, g: r1(h.goldTotal),
        it: h.items.slice(), itT: (h.itemAt || []).map(r1), dh: r1(h.dmgHero), dt: r1(h.dmgTower), tk: r1(h.dmgTaken), hl: r1(h.healDone), sc: +r.score.toFixed(2), rp: Object.fromEntries(Object.entries(r.p).map(([k, v]) => [k, +v.toFixed(2)])),
        an: def.repNames || def.abilities.map(a => a ? a.name : ''), ab: S.ab.map(r1), abH: S.abH.map(r1), abC: S.abC, atk: r1(S.atk), atkH: r1(S.atkH), item: r1(S.item), itemH: r1(S.itemH), pet: r1(S.pet), petH: r1(S.petH), oth: r1(S.oth), othH: r1(S.othH),
        to: S.to.map(r1), from: S.from.map(r1), tw: r1(S.tw), cr: r1(S.cr), mo: r1(S.mo), ft: r1(S.ft) };
    });
    return { v: 1, id: C.t0, at: Date.now(), dur: Math.round(G.time), win: G.winner, me: H.indexOf(P), diff: G.diff, rk: G.ranked ? 1 : 0, sur: G.surrender ? 1 : 0, kills: [G.teams[0].kills, G.teams[1].kills], towers: [G.teams[0].towers, G.teams[1].towers], hs, s: C.s, ev: C.ev, mvp: H.indexOf(R[0].h), worst: H.indexOf(R[R.length - 1].h) };
  },
  /* ---------- storage ---------- */
  load() {
    if (this.list) return this.list; let a = null;
    try { a = JSON.parse(localStorage.getItem('ashrift.rep') || 'null'); } catch (e) { }
    this.list = Array.isArray(a) ? a : [];
    if (!this.list.length) IDB.get('rep').then(d => { if (Array.isArray(d) && d.length && !this.list.length) { this.list = d; if ($('prof') && UI.scr === 'profile') PROF.render(); } }).catch(() => { });
    return this.list;
  },
  save(r) {
    const L = this.load(); L.unshift(r); while (L.length > REP_MAX) L.pop();
    let ok = false; for (let n = L.length; n > 0 && !ok; n--) { try { localStorage.setItem('ashrift.rep', JSON.stringify(L.slice(0, n))); ok = true; } catch (e) { } }   // storage full: keep fewer
    IDB.set('rep', L).catch(() => { });
  },
  get(id) { return this.load().find(r => r.id === id) || null; },
  /* ---------- reading a report ---------- */
  k1(v) { v = Math.round(v || 0); return v >= 10000 ? Math.round(v / 1000) + 'к' : v >= 1000 ? (Math.round(v / 100) / 10) + 'к' : String(v); },
  mmss(t) { t = Math.max(0, Math.round(t)); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); },
  def(id) { return HEROES.find(h => h.id === id) || null; },
  abIcon(h, i) { const d = this.def(h.id), a = d && d.abilities[i]; return a ? iconURL(a.icon, a.iconCol || d.look.glow) : ''; },
  // a line colour per hero: cool shades for the blue side, warm for the red, in the order they stand in the team
  heroCol(h, R) { R = R || G.report; const P = [['#5aa7ff', '#5fe8c8', '#b48cff', '#9fd0ff', '#7dffa8'], ['#ff5c52', '#ffb04a', '#ff7ad9', '#ffe27a', '#d8a878']]; const k = R ? R.hs.filter(o => o.t === h.t).indexOf(h) : 0; return P[h.t][Math.max(0, k) % 5]; },
  pname(R, h) { return esc(h.n) + (h.p ? ' <i class="rp-you">(' + esc(PROF.name()) + ')</i>' : ''); },
  tname(t) { return t === 0 ? 'Синие' : 'Красные'; },
  // a source label from the death log ("3:1" — hero 3, ability W) as text
  srcName(R, lab) {
    const M = { tower: 'Башня', creep: 'Миньоны', mon: 'Лесные монстры', boss: 'Страж Разлома', other: 'Фонтан и прочее' }; if (M[lab]) return M[lab];
    const [i, s] = lab.split(':'), h = R.hs[+i]; if (!h) return '?'; const k = +s;
    return `<b class="t${h.t}">${esc(h.n)}</b> · ` + (isNaN(k) ? (REP_SRC[s] || s) : esc(h.an[k] || REP_SLOTS[k]));
  },
  items(h) { return h.it.map((id, k) => { const it = ITEM[id]; return it ? `<img class="rp-it" src="${iconURL(it.icon, CAT_COL[it.cat])}" alt="" title="${esc(it.name)}${h.itT[k] !== undefined && h.itT[k] >= 0 ? ' · куплен на ' + this.mmss(h.itT[k]) : ''}">` : ''; }).join('') + '<i class="rp-itx"></i>'.repeat(Math.max(0, 6 - h.it.length)); },
  // awards and the reason behind the MVP and the worst player, from the stored figures
  why(R, h) { const c = [['dmg', 2.8, 'больше всех урона по героям'], ['heal', 1.7, 'лучшая поддержка: лечение, щиты, усиления'], ['tower', 1.1, 'главный разрушитель башен'], ['kda', 2.4, 'почти не умирал и много убивал'], ['part', 1.4, 'участвовал почти во всех убийствах команды'], ['tank', 0.6, 'принял на себя больше всех урона']].map(q => [(h.rp[q[0]] || 0) / q[1], q[2]]).sort((a, b) => b[0] - a[0]); return c[0][1] + (c[1][0] > 0.75 ? ' · ' + c[1][1] : ''); },
  whyBad(R, h) { const md = Math.max(...R.hs.map(o => o.d)), lowD = R.hs.every(o => o.dh >= h.dh); return h.d >= md && md >= 4 ? h.d + ' смертей — больше всех в матче' : (lowD ? 'меньше всех урона по героям' : (h.k + h.a <= 2 ? 'почти не участвовал в убийствах' : 'самый скромный вклад в бой')); },
  // hero damage by source, in a fixed order: Q W E R, attacks, items, summons, other
  parts(h, heroOnly) { const s = heroOnly ? 'H' : ''; return [h['ab' + s][0], h['ab' + s][1], h['ab' + s][2], h['ab' + s][3], h['atk' + s], h['item' + s], h['pet' + s], h['oth' + s]]; },
  partName(h, k) { return k < 4 ? (h.an[k] || REP_SLOTS[k]) : [REP_SRC.atk, REP_SRC.item, REP_SRC.pet, REP_SRC.oth][k - 4]; },
  // team totals at sample k: gold and experience
  teamAt(R, k, what) { const s = R.s[k], n = R.hs.length, off = what === 'xp' ? 1 + n : 1, out = [0, 0]; R.hs.forEach((h, i) => { out[h.t] += s[off + i]; }); return out; },

  /* ---------- the view ---------- */
  render(box, R, o) {
    o = o || {}; box.classList.add('rp'); box.dataset.tab = box.dataset.tab || 'ov';
    const tabs = [['ov', 'Обзор'], ['tb', 'Таблица'], ['gr', 'Графики'], ['dm', 'Урон'], ['tl', 'Хронология'], ['me', 'Мой матч']];
    const me = R.hs[R.me] || R.hs[0], won = R.win === me.t, dl = ['лёгкие', 'средние', 'сложные'][R.diff] || '';
    const head = o.head ? `<div class="rp-head"><h2 class="${won ? 'win' : 'lose'}">${won ? 'ПОБЕДА' : 'ПОРАЖЕНИЕ'}</h2><div class="rp-sub">${new Date(R.at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} · ${esc(me.n)} · ${this.mmss(R.dur)} · счёт ${R.kills[0]} : ${R.kills[1]}${R.rk ? ' · рейтинговый' : ' · боты: ' + dl}${R.sur ? ' · сдача' : ''}</div></div>` : '';
    box.innerHTML = head + `<nav class="rp-tabs">${tabs.map(([k, n]) => `<button type="button" data-rt="${k}" class="${box.dataset.tab === k ? 'on' : ''}">${n}</button>`).join('')}</nav>` +
      `<div class="rp-pane" data-p="ov">${this.paneOverview(R)}</div><div class="rp-pane" data-p="tb">${this.paneTable(R)}</div><div class="rp-pane" data-p="gr">${this.paneGraphs(R)}</div>` +
      `<div class="rp-pane" data-p="dm">${this.paneDamage(R, box.dataset.dh !== undefined ? +box.dataset.dh : R.me)}</div><div class="rp-pane" data-p="tl">${this.paneTimeline(R, box.dataset.tf || 'all')}</div><div class="rp-pane" data-p="me">${this.paneMe(R)}</div>`;
    box._rep = R; this.show(box);
    if (!box._wired) {
      box._wired = true;
      box.addEventListener('click', e => {
        const t = e.target.closest('[data-rt],[data-dh],[data-tf],[data-gm]'); if (!t || !box._rep) return; SFX.play('ui', 0.6); const R2 = box._rep;
        if (t.dataset.rt) { box.dataset.tab = t.dataset.rt; this.show(box); }
        else if (t.dataset.dh !== undefined) { box.dataset.dh = t.dataset.dh; box.querySelector('[data-p="dm"]').innerHTML = this.paneDamage(R2, +t.dataset.dh); }
        else if (t.dataset.tf) { box.dataset.tf = t.dataset.tf; box.querySelector('[data-p="tl"]').innerHTML = this.paneTimeline(R2, t.dataset.tf); }
        else if (t.dataset.gm) { box.dataset.gm = t.dataset.gm; for (const b of box.querySelectorAll('[data-gm]')) b.classList.toggle('on', b === t); this.drawGraphs(box); }
      });
    }
  },
  show(box) {
    const tab = box.dataset.tab; for (const b of box.querySelectorAll('.rp-tabs button')) b.classList.toggle('on', b.dataset.rt === tab);
    for (const p of box.querySelectorAll('.rp-pane')) p.hidden = p.dataset.p !== tab;
    if (tab === 'gr') requestAnimationFrame(() => this.drawGraphs(box));
  },
  /* --- overview: the MVP and the worst, the awards, the two teams side by side, the key moments --- */
  paneOverview(R) {
    const best = R.hs[R.mvp], worst = R.hs[R.worst], k1 = v => this.k1(v);
    const card = (h, cls, tag, text) => `<div class="ecard ${cls}"><img src="${UI.portraits[h.id] || ''}" alt=""><div class="ebody"><span class="etag">${tag}</span><b class="t${h.t}">${this.pname(R, h)}</b><small>${esc((this.def(h.id) || {}).roleName || '')} · ${h.t === R.win ? 'победители' : 'проигравшие'}</small><p>${text}</p>
      <div class="estats num"><span><b>${h.k} / ${h.d} / ${h.a}</b>У / С / П</span><span><b>${k1(h.dh)}</b>урон по героям</span><span><b>${k1(h.hl)}</b>поддержка</span><span><b>${k1(h.g)}</b>золото</span></div></div><div class="escore num">${h.sc.toFixed(1)}<small>рейтинг</small></div></div>`;
    const top = k => R.hs.slice().sort((a, b) => b[k] - a[k])[0];
    const aw = [['dh', 'Больше всех урона'], ['hl', 'Лучшая поддержка'], ['dt', 'Гроза башен'], ['tk', 'Живой щит'], ['k', 'Больше всех убийств'], ['cs', 'Лучший фарм']].map(([k, t]) => { const h = top(k); return h[k] > 0 ? `<span class="eaw"><small>${t}</small><b class="t${h.t}">${esc(h.n)}</b><i class="num">${k === 'k' || k === 'cs' ? h[k] : k1(h[k])}</i></span>` : ''; }).join('');
    // the teams side by side
    const T = [0, 1].map(t => { const L = R.hs.filter(h => h.t === t), sum = k => L.reduce((s, h) => s + h[k], 0); return { k: R.kills[t], g: sum('g'), dh: sum('dh'), tw: R.towers[t], boss: R.ev.filter(e => e.k === 'boss' && e.team === t).length, lv: (L.reduce((s, h) => s + h.lv, 0) / Math.max(1, L.length)).toFixed(1), hl: sum('hl') }; });
    const row = (name, a, b, fmt) => { const s = (+a) + (+b) || 1; return `<div class="rp-vs"><b class="t0 num">${fmt ? fmt(a) : a}</b><span><i class="b0" style="width:${(+a) / s * 100}%"></i><i class="b1" style="width:${(+b) / s * 100}%"></i><em>${name}</em></span><b class="t1 num">${fmt ? fmt(b) : b}</b></div>`; };
    const teams = `<div class="rp-box"><h4 class="sech">Команды <small>${this.tname(R.win)} победили за ${this.mmss(R.dur)}</small></h4><div class="rp-vsh"><b class="t0">СИНИЕ${R.win === 0 ? ' · победа' : ''}</b><b class="t1">${R.win === 1 ? 'победа · ' : ''}КРАСНЫЕ</b></div>`
      + row('Убийства', T[0].k, T[1].k) + row('Золото', T[0].g, T[1].g, k1) + row('Урон по героям', T[0].dh, T[1].dh, k1) + row('Поддержка', T[0].hl, T[1].hl, k1) + row('Разрушено башен', T[0].tw, T[1].tw) + row('Стражей Разлома', T[0].boss, T[1].boss) + row('Средний уровень', T[0].lv, T[1].lv) + '</div>';
    return `<div class="rp-cards">${card(best, 'mvp', '★ MVP МАТЧА · лучший игрок', this.why(R, best))}${card(worst, 'worst', '▼ ХУДШИЙ ИГРОК МАТЧА', this.whyBad(R, worst))}</div><div class="rp-aw">${aw}</div><div class="rp-cols">${teams}<div class="rp-box"><h4 class="sech">Ключевые моменты</h4>${this.moments(R)}</div></div>`;
  },
  moments(R) {
    const out = [], hn = i => i >= 0 && R.hs[i] ? `<b class="t${R.hs[i].t}">${esc(R.hs[i].n)}</b>` : 'кто-то', TIER = { 2: 'внешнюю', 1: 'внутреннюю' };
    const fb = R.ev.find(e => e.k === 'kill' && e.fb); if (fb) out.push([fb.t, 'blood', `Первая кровь: ${hn(fb.by)} → ${hn(fb.v)}`]);
    const ft = R.ev.find(e => e.k === 'tower'); if (ft) out.push([ft.t, 'tower', `Первая башня: ${this.tname(1 - ft.team)} разрушили ${TIER[ft.tier] || ''} башню (${(LANE_RU[ft.lane] || '').toLowerCase()})`]);
    for (const e of R.ev.filter(e => e.k === 'boss')) out.push([e.t, 'boss', `${this.tname(e.team)} сразили Стража Разлома${e.by >= 0 ? ' — добил ' + hn(e.by) : ''}`]);
    const mk = R.ev.filter(e => e.k === 'kill' && e.multi >= 2).sort((a, b) => b.multi - a.multi)[0]; if (mk) out.push([mk.t, 'multi', `${hn(mk.by)}: ${mk.multi >= 4 ? 'бойня' : mk.multi === 3 ? 'тройное убийство' : 'двойное убийство'}`]);
    // the biggest gold lead each side had
    let mx = [0, 0], mt = [0, 0]; R.s.forEach((s, k) => { const g = this.teamAt(R, k, 'gold'), d = g[0] - g[1]; if (d > mx[0]) { mx[0] = d; mt[0] = s[0]; } if (-d > mx[1]) { mx[1] = -d; mt[1] = s[0]; } });
    for (const t of [0, 1]) if (mx[t] > 400) out.push([mt[t], 'gold', `Наибольший перевес ${t === 0 ? 'синих' : 'красных'}: ${this.k1(mx[t])} золота`]);
    const bb = R.ev.filter(e => e.k === 'buy'); for (const e of bb) out.push([e.t, 'buy', `${hn(e.who)} выкупил жизнь за 1000 золота`]);
    out.sort((a, b) => a[0] - b[0]);
    return out.length ? `<ul class="rp-mom">${out.map(([t, ic, s]) => `<li><span class="num">${this.mmss(t)}</span><i class="rp-dot ${ic}"></i>${s}</li>`).join('')}</ul>` : '<p class="pf-empty">Ничего примечательного — тихий матч.</p>';
  },
  /* --- the full table: both teams, every figure, the items --- */
  paneTable(R) {
    const k1 = v => this.k1(v), mx = k => Math.max(1, ...R.hs.map(h => h[k]));
    const cell = (h, k) => `<td><span class="rp-cb" style="--w:${h[k] / mx(k) * 100}%">${k1(h[k])}</span></td>`;
    const rows = t => R.hs.map((h, i) => [h, i]).filter(([h]) => h.t === t).sort((a, b) => b[0].sc - a[0].sc).map(([h, i]) => `<tr class="${h.p ? 'me' : ''}"><td class="rp-hn"><img src="${UI.portraits[h.id] || ''}" alt=""><span><b class="t${h.t}">${i === R.mvp ? '★ ' : i === R.worst ? '▼ ' : ''}${this.pname(R, h)}</b><small>${esc((this.def(h.id) || {}).roleName || '')}${h.lane ? ' · ' + (LANE_RU[h.lane] || '').toLowerCase() : ''}</small></span></td><td><b>${h.sc.toFixed(1)}</b></td><td>${h.lv}</td><td>${h.k} / ${h.d} / ${h.a}</td>${cell(h, 'dh')}${cell(h, 'hl')}${cell(h, 'dt')}${cell(h, 'tk')}<td>${h.cs}</td>${cell(h, 'g')}<td class="rp-its">${this.items(h)}</td></tr>`).join('');
    const hd = '<tr><th>Герой</th><th>Рейтинг</th><th>Ур.</th><th>У / С / П</th><th>Урон по героям</th><th>Поддержка</th><th>По башням</th><th>Получено</th><th>Миньоны</th><th>Золото</th><th>Предметы</th></tr>';
    return [0, 1].map(t => `<h4 class="sech rp-th t${t}">${t === 0 ? 'СИНИЕ' : 'КРАСНЫЕ'} <small>${R.win === t ? 'победа' : 'поражение'} · ${R.kills[t]} убийств · ${R.towers[t]} башен</small></h4><div class="sbwrap"><table class="sb num rp-tbl">${hd}${rows(t)}</table></div>`).join('');
  },
  /* --- graphs: the team lead in gold or experience over time, and every hero's gold --- */
  paneGraphs(R) {
    return `<div class="rp-box"><h4 class="sech">Преимущество команды <small>выше нуля — синие впереди, ниже — красные</small></h4><div class="rp-gm"><button type="button" data-gm="gold" class="on">Золото</button><button type="button" data-gm="xp">Опыт</button></div>
      <div class="rp-cv"><canvas data-g="lead"></canvas></div><div class="rp-leg"><span><i class="rp-dot tower"></i>башня</span><span><i class="rp-dot boss"></i>Страж Разлома</span><span><i class="rp-tick t0"></i>убийство синих</span><span><i class="rp-tick t1"></i>убийство красных</span></div></div>
      <div class="rp-box"><h4 class="sech">Золото каждого героя <small>наведите на график — подробности по минуте</small></h4><div class="rp-cv tall"><canvas data-g="heroes"></canvas></div><div class="rp-leg">${R.hs.map(h => `<span class="t${h.t}${h.p ? ' rp-me' : ''}"><i style="background:${this.heroCol(h, R)}"></i>${esc(h.n)}</span>`).join('')}</div></div>`;
  },
  drawGraphs(box) {
    const R = box._rep; if (!R || !R.s.length) return; const mode = box.dataset.gm || 'gold', n = R.hs.length;
    for (const cv of box.querySelectorAll('canvas[data-g]')) {
      const W = cv.parentElement.clientWidth, H = cv.parentElement.clientHeight; if (!W) continue;
      const dpr = Math.min(2, devicePixelRatio || 1); cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
      const kind = cv.dataset.g, S = R.s, T = R.dur || S[S.length - 1][0] || 1;
      let series, lo, hi;
      if (kind === 'lead') { const v = S.map((s, k) => { const a = this.teamAt(R, k, mode); return a[0] - a[1]; }); const m = Math.max(500, ...v.map(Math.abs)) * 1.12; lo = -m; hi = m; series = v; }
      else { series = R.hs.map((h, i) => S.map(s => s[1 + i])); lo = 0; hi = Math.max(1000, ...S.map(s => Math.max(...s.slice(1, 1 + n)))) * 1.05; }
      const draw = hov => {
        const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
        const pl = 46, pr = 12, pt = 10, pb = 24, x = t => pl + t / T * (W - pl - pr), y = v => pt + (1 - (v - lo) / (hi - lo)) * (H - pt - pb);
        g.font = '11px ' + getComputedStyle(document.body).fontFamily; g.fillStyle = '#5d6676'; g.strokeStyle = '#232833'; g.lineWidth = 1;
        for (let m = 0; m <= T / 60; m += T > 1500 ? 5 : 2) { const X = x(m * 60); g.beginPath(); g.moveTo(X, pt); g.lineTo(X, H - pb); g.stroke(); g.fillText(m + ' мин', X - 12, H - 7); }
        for (let k = 0; k <= 4; k++) { const v = lo + (hi - lo) * k / 4, Y = y(v); g.beginPath(); g.moveTo(pl, Y); g.lineTo(W - pr, Y); g.stroke(); g.fillText(this.k1(Math.abs(v)), 4, Y + 4); }
        if (kind === 'lead') {
          const z = y(0); g.strokeStyle = '#4a5160'; g.beginPath(); g.moveTo(pl, z); g.lineTo(W - pr, z); g.stroke();
          for (const [sgn, col] of [[1, 'rgba(90,167,255,'], [-1, 'rgba(255,92,82,']]) {
            g.save(); g.beginPath(); if (sgn > 0) g.rect(pl, 0, W, z); else g.rect(pl, z, W, H); g.clip();
            g.beginPath(); g.moveTo(x(S[0][0]), z); S.forEach((s, k) => g.lineTo(x(s[0]), y(series[k]))); g.lineTo(x(S[S.length - 1][0]), z); g.closePath();
            const gr = g.createLinearGradient(0, sgn > 0 ? pt : H - pb, 0, z); gr.addColorStop(0, col + '0.55)'); gr.addColorStop(1, col + '0.05)'); g.fillStyle = gr; g.fill();
            g.strokeStyle = col + '1)'; g.lineWidth = 2; g.beginPath(); S.forEach((s, k) => k ? g.lineTo(x(s[0]), y(series[k])) : g.moveTo(x(s[0]), y(series[k]))); g.stroke(); g.restore();
          }
          // events along the bottom: kills as ticks in the killers' colour, towers and the Warden as dots
          for (const e of R.ev) {
            const X = x(e.t);
            if (e.k === 'kill' && R.hs[e.v]) { g.fillStyle = R.hs[e.v].t === 1 ? '#5aa7ff' : '#ff5c52'; g.fillRect(X - 1, H - pb - 7, 2, 7); }
            else if (e.k === 'tower') { g.fillStyle = e.team === 1 ? '#5aa7ff' : '#ff5c52'; g.beginPath(); g.arc(X, pt + 6, 4, 0, TAU); g.fill(); }
            else if (e.k === 'boss') { g.fillStyle = '#b48cff'; g.beginPath(); g.arc(X, pt + 6, 5, 0, TAU); g.fill(); }
          }
        } else {
          const order = R.hs.map((h, i) => i).sort((a, b) => R.hs[a].p - R.hs[b].p);   // the player's line on top
          for (const i of order) { const h = R.hs[i]; g.strokeStyle = this.heroCol(h, R); g.globalAlpha = hov && hov.hero >= 0 && hov.hero !== i ? 0.25 : (h.p ? 1 : 0.8); g.lineWidth = h.p ? 3 : 1.6; g.setLineDash(h.t === 1 ? [5, 3] : []); g.beginPath(); S.forEach((s, k) => k ? g.lineTo(x(s[0]), y(series[i][k])) : g.moveTo(x(s[0]), y(series[i][k]))); g.stroke(); }
          g.setLineDash([]); g.globalAlpha = 1;
        }
        if (hov) { g.strokeStyle = 'rgba(236,197,111,.7)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x(S[hov.k][0]), pt); g.lineTo(x(S[hov.k][0]), H - pb); g.stroke(); }
        cv._x = x; cv._y = y;
      };
      draw(null);
      cv.onmousemove = e => {
        const r = cv.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top; let k = 0, bd = 1e9; S.forEach((s, j) => { const d = Math.abs(cv._x(s[0]) - mx); if (d < bd) { bd = d; k = j; } });
        let hero = -1; if (kind === 'heroes') { let bd2 = 18; R.hs.forEach((h, i) => { const d = Math.abs(cv._y(series[i][k]) - my); if (d < bd2) { bd2 = d; hero = i; } }); }
        draw({ k, hero });
        const tt = $('tip'); let html = `<b>${this.mmss(S[k][0])}</b>`;
        if (kind === 'lead') { const a = this.teamAt(R, k, mode), d = a[0] - a[1]; html += `<br>${mode === 'xp' ? 'Опыт' : 'Золото'}: синие ${this.k1(a[0])} · красные ${this.k1(a[1])}<br>${d >= 0 ? '<span style="color:#5aa7ff">синие впереди на ' : '<span style="color:#ff5c52">красные впереди на '}${this.k1(Math.abs(d))}</span>`; const near = R.ev.filter(ev => Math.abs(ev.t - S[k][0]) <= REP_STEP / 2 + 1 && ev.k !== 'kill'); for (const ev of near) html += '<br>' + this.evText(R, ev); }
        else html += '<br>' + R.hs.map((h, i) => [h, i]).sort((a, b) => series[b[1]][k] - series[a[1]][k]).map(([h, i]) => `<span style="color:${i === hero ? '#ecc56f' : (h.t ? '#ff8a82' : '#8cc4ff')}">${esc(h.n)}${h.p ? ' (вы)' : ''}: ${this.k1(series[i][k])}</span>`).join('<br>');
        tt.innerHTML = html; tt.hidden = false; tt.style.left = clamp(e.clientX + 14, 8, innerWidth - 300) + 'px'; tt.style.bottom = 'auto'; tt.style.top = clamp(e.clientY - 20, 8, innerHeight - 200) + 'px';
      };
      cv.onmouseleave = () => { draw(null); $('tip').hidden = true; };
    }
  },
  /* --- damage: every hero's damage split by source, and a closer look at one --- */
  paneDamage(R, sel) {
    const mx = Math.max(1, ...R.hs.map(h => h.dh)), H = R.hs[sel] || R.hs[R.me];
    const bar = h => { const p = this.parts(h, true), tot = p.reduce((a, b) => a + b, 0) || 1; return `<span class="rp-stack" style="width:${Math.max(2, h.dh / mx * 100)}%">${p.map((v, k) => v > 0 ? `<i style="width:${v / tot * 100}%;background:${REP_COL[k]}" title="${esc(this.partName(h, k))}: ${this.k1(v)}"></i>` : '').join('')}</span>`; };
    const list = [0, 1].map(t => R.hs.map((h, i) => [h, i]).filter(([h]) => h.t === t).sort((a, b) => b[0].dh - a[0].dh).map(([h, i]) => `<button type="button" data-dh="${i}" class="rp-dr${i === sel ? ' on' : ''}${h.p ? ' me' : ''}"><img src="${UI.portraits[h.id] || ''}" alt=""><b class="t${h.t}">${esc(h.n)}</b><span class="rp-bar">${bar(h)}</span><em class="num">${this.k1(h.dh)}</em></button>`).join('')).join('<hr>');
    const legend = `<div class="rp-leg">${['Q', 'W', 'E', 'R', 'атаки', 'предметы', 'призванные', 'прочее'].map((n, k) => `<span><i style="background:${REP_COL[k]}"></i>${n}</span>`).join('')}</div>`;
    // the chosen hero: each source with hero damage, all damage, casts and share
    const pH = this.parts(H, true), pA = this.parts(H, false), totH = pH.reduce((a, b) => a + b, 0) || 1;
    const src = pH.map((v, k) => [v, k]).filter(([v, k]) => v > 0 || pA[k] > 0 || (k < 4 && H.abC[k] > 0)).sort((a, b) => b[0] - a[0]).map(([v, k]) => `<tr><td class="rp-src">${k < 4 ? `<img src="${this.abIcon(H, k)}" alt=""><kbd>${REP_SLOTS[k]}</kbd>` : `<i class="rp-sw" style="background:${REP_COL[k]}"></i>`}${esc(this.partName(H, k))}</td><td><span class="rp-cb" style="--w:${v / totH * 100}%;--c:${REP_COL[k]}">${this.k1(v)}</span></td><td>${Math.round(v / totH * 100)}%</td><td>${this.k1(pA[k])}</td><td>${k < 4 ? H.abC[k] : '—'}</td></tr>`).join('');
    const enemies = R.hs.map((h, i) => [h, i]).filter(([h]) => h.t !== H.t), tmax = Math.max(1, ...enemies.map(([h, i]) => H.to[i])), fmax = Math.max(1, ...enemies.map(([h, i]) => H.from[i]), H.tw, H.cr, H.mo);
    const toL = enemies.sort((a, b) => H.to[b[1]] - H.to[a[1]]).map(([h, i]) => `<div class="rp-hb"><span><img src="${UI.portraits[h.id] || ''}" alt="">${esc(h.n)}</span><i style="--w:${H.to[i] / tmax * 100}%" class="t${h.t}"></i><b class="num">${this.k1(H.to[i])}</b></div>`).join('');
    const fromL = enemies.map(([h, i]) => [esc(h.n), H.from[i], UI.portraits[h.id], h.t]).concat([['Башни', H.tw, null, 2], ['Миньоны', H.cr, null, 2], ['Монстры', H.mo, null, 2]]).filter(q => q[1] > 0).sort((a, b) => b[1] - a[1])
      .map(([n, v, img, t]) => `<div class="rp-hb"><span>${img ? `<img src="${img}" alt="">` : '<i class="rp-ph"></i>'}${n}</span><i style="--w:${v / fmax * 100}%" class="t${t}"></i><b class="num">${this.k1(v)}</b></div>`).join('');
    return `<div class="rp-dmg"><div class="rp-box"><h4 class="sech">Урон по героям <small>нажмите на героя — подробности справа</small></h4>${legend}<div class="rp-dl">${list}</div></div>
      <div class="rp-box"><h4 class="sech"><span class="t${H.t}">${esc(H.n)}</span> <small>${this.k1(H.dh)} по героям · ${this.k1(pA.reduce((a, b) => a + b, 0))} всего (без башен)</small></h4>
        <table class="sb num rp-st"><tr><th>Источник</th><th>По героям</th><th>Доля</th><th>Всего</th><th>Применений</th></tr>${src || '<tr><td colspan="5">урона нет</td></tr>'}</table>
        <div class="rp-cols2"><div><h5>Кому нанёс</h5>${toL || '<p class="pf-empty">никому</p>'}</div><div><h5>От кого получил</h5>${fromL || '<p class="pf-empty">ни от кого</p>'}</div></div></div></div>`;
  },
  /* --- the timeline: every kill, tower, Warden and buy-back, with a filter --- */
  evText(R, e) {
    const hn = i => i >= 0 && R.hs[i] ? `<b class="t${R.hs[i].t}">${esc(R.hs[i].n)}</b>` : '', TIER = { 2: 'внешнюю', 1: 'внутреннюю' };
    if (e.k === 'kill') { const pre = `${e.fb ? '<em class="rp-fb">Первая кровь</em> ' : ''}${e.multi >= 2 ? `<em class="rp-mk">${e.multi >= 4 ? 'Бойня' : e.multi === 3 ? 'Тройное' : 'Двойное'}</em> ` : ''}`; if (e.by < 0) return pre + `${hn(e.v)} — смерть ${({ tower: 'от башни', creep: 'от миньонов', mon: 'от монстров' }[e.src] || 'от окружения')}`; return pre + `${hn(e.by)} <span class="rp-kx">→</span> ${hn(e.v)}${e.a && e.a.length ? ` <small>помощь: ${e.a.map(hn).join(', ')}</small>` : ''}`; }
    if (e.k === 'tower') return `${e.team === 0 ? '<b class="t1">Красные</b>' : '<b class="t0">Синие</b>'} разрушили ${TIER[e.tier] || ''} башню · ${(LANE_RU[e.lane] || '').toLowerCase()}${e.by >= 0 ? ` <small>добил ${hn(e.by)}</small>` : ''}`;
    if (e.k === 'boss') return `<b class="t${e.team}">${this.tname(e.team)}</b> сразили Стража Разлома${e.by >= 0 ? ` <small>добил ${hn(e.by)}</small>` : ''}`;
    if (e.k === 'buy') return `${hn(e.who)} выкупил жизнь за 1000 золота`;
    return '';
  },
  paneTimeline(R, f) {
    const me = R.me, F = [['all', 'Всё'], ['kill', 'Убийства'], ['obj', 'Башни и Страж'], ['me', 'С моим участием']];
    const ok = e => f === 'all' || (f === 'kill' && e.k === 'kill') || (f === 'obj' && (e.k === 'tower' || e.k === 'boss')) || (f === 'me' && ((e.k === 'kill' && (e.by === me || e.v === me || (e.a || []).includes(me))) || e.by === me || e.who === me));
    const L = R.ev.filter(ok); let k0 = 0, k1 = 0;
    const rows = R.ev.map(e => { if (e.k === 'kill' && R.hs[e.v]) { if (R.hs[e.v].t === 1) k0++; else k1++; } return { e, s: k0 + ' : ' + k1 }; }).filter(q => ok(q.e));
    const cls = e => e.k === 'kill' ? (R.hs[e.v] && R.hs[e.v].t === 1 ? 'k0' : 'k1') + (e.v === me ? ' mine-d' : e.by === me ? ' mine-k' : '') : e.k;
    return `<div class="rp-gm">${F.map(([k, n]) => `<button type="button" data-tf="${k}" class="${f === k ? 'on' : ''}">${n}</button>`).join('')}</div>` +
      (L.length ? `<ol class="rp-tl">${rows.map(({ e, s }) => `<li class="${cls(e)}"><span class="num">${this.mmss(e.t)}</span><i class="rp-dot ${e.k === 'kill' ? (R.hs[e.v] && R.hs[e.v].t === 1 ? 'k0' : 'k1') : e.k}"></i><div>${this.evText(R, e)}${e.k === 'kill' && e.v === me && e.dd && e.dd.length ? `<small class="rp-why">что убило: ${e.dd.map(([l, d]) => this.srcName(R, l) + ' ' + this.k1(d)).join(' · ')}</small>` : ''}</div><em class="num">${e.k === 'kill' ? s : ''}</em></li>`).join('')}</ol>` : '<p class="pf-empty">Таких событий в матче не было.</p>');
  },
  /* --- my match: where the rating came from, the deaths and what caused them, the build, the lane opponent --- */
  paneMe(R) {
    const h = R.hs[R.me]; if (!h) return '';
    const parts = REP_PART.map(([k, m, n]) => { const v = h.rp[k] || 0; return `<div class="rp-rb${v < 0 ? ' neg' : ''}"><span>${n}</span><i style="--w:${Math.min(100, Math.abs(v) / Math.abs(m) * 100)}%"></i><b class="num">${v > 0 ? '+' : ''}${v.toFixed(1)}</b><small>из ${m > 0 ? m : '−' + -m}</small></div>`; }).join('');
    const place = R.hs.slice().sort((a, b) => b.sc - a.sc).indexOf(h) + 1;
    const deaths = R.ev.filter(e => e.k === 'kill' && e.v === R.me).map(e => `<li><span class="num">${this.mmss(e.t)}</span><div>${e.by >= 0 ? `убийца: <b class="t${R.hs[e.by].t}">${esc(R.hs[e.by].n)}</b>` : ({ tower: 'башня', creep: 'миньоны', mon: 'лесные монстры' }[e.src] || 'окружение')}${e.a && e.a.length ? ` <small>вместе с ${e.a.map(i => esc(R.hs[i].n)).join(', ')}</small>` : ''}${e.dd && e.dd.length ? `<small class="rp-why">${e.dd.map(([l, d]) => this.srcName(R, l) + ' — ' + this.k1(d)).join('<br>')}</small>` : ''}</div></li>`).join('');
    const build = h.it.length ? h.it.map((id, k) => { const it = ITEM[id]; return it ? `<div class="rp-bi"><img src="${iconURL(it.icon, CAT_COL[it.cat])}" alt=""><b>${esc(it.name)}</b><small class="num">${h.itT[k] >= 0 ? this.mmss(h.itT[k]) : ''}</small></div>` : ''; }).join('') : '<p class="pf-empty">Предметов не было.</p>';
    // the enemy on the same lane in the same role (or the nearest thing to it)
    const opp = R.hs.find(o => o.t !== h.t && o.lane === h.lane && o.role === h.role) || R.hs.find(o => o.t !== h.t && o.lane === h.lane);
    const at = (i, t) => { let k = 0; while (k < R.s.length - 1 && R.s[k + 1][0] <= t) k++; return R.s[k][1 + i]; }, oi = opp ? R.hs.indexOf(opp) : -1;
    const cmp = opp ? [['Золото к 10-й минуте', at(R.me, 600), at(oi, 600)], ['Золото за матч', h.g, opp.g], ['Уровень', h.lv, opp.lv], ['Миньоны', h.cs, opp.cs], ['Урон по героям', h.dh, opp.dh], ['Убийства / смерти', h.k + ' / ' + h.d, opp.k + ' / ' + opp.d]]
      .map(([n, a, b]) => `<tr><td>${n}</td><td class="${typeof a === 'number' && a > b ? 'pw' : ''}">${typeof a === 'number' ? this.k1(a) : a}</td><td class="${typeof b === 'number' && b > a ? 'pl' : ''}">${typeof b === 'number' ? this.k1(b) : b}</td></tr>`).join('') : '';
    const tips = this.tips(R, h, place);
    return `<div class="rp-cols"><div class="rp-box"><h4 class="sech">Откуда рейтинг <small>${h.sc.toFixed(1)} из 10 · ${place}-е место из ${R.hs.length}</small></h4>${parts}</div>
      <div class="rp-box"><h4 class="sech">Подсказки на следующий матч</h4><ul class="rp-tips">${tips}</ul>${opp ? `<h4 class="sech" style="margin-top:12px">Против соперника по линии <small>${esc(opp.n)} · ${(LANE_RU[opp.lane] || '').toLowerCase()}</small></h4><table class="sb num rp-st"><tr><th></th><th>Вы</th><th>${esc(opp.n)}</th></tr>${cmp}</table>` : ''}</div></div>
      <div class="rp-cols"><div class="rp-box"><h4 class="sech">Смерти <small>${h.d} · что вас убило за последние 8 сек</small></h4>${deaths ? `<ol class="rp-deaths">${deaths}</ol>` : '<p class="pf-empty">Ни одной смерти — отлично!</p>'}</div>
      <div class="rp-box"><h4 class="sech">Сборка <small>по порядку покупки</small></h4><div class="rp-build">${build}</div></div></div>`;
  },
  // a few plain-language observations about the player's own match
  tips(R, h, place) {
    const out = [], mates = R.hs.filter(o => o.t === h.t && o !== h), min = Math.max(1, R.dur / 60), avg = k => mates.reduce((s, o) => s + o[k], 0) / Math.max(1, mates.length);
    const dd = R.ev.filter(e => e.k === 'kill' && e.v === R.me), byTower = dd.filter(e => (e.dd || []).some(([l]) => l === 'tower')).length;
    if (h.d >= 6 && h.d > h.k + h.a / 2) out.push('Много смертей: держитесь ближе к союзникам и отходите, когда здоровья меньше трети.');
    if (byTower >= 2) out.push(`Башня участвовала в ${byTower} ваших смертях — не заходите под вражескую башню без миньонов перед собой.`);
    if (h.cs / min < 2.5 && (this.def(h.id) || {}).role !== 'support') out.push(`Мало миньонов (${(h.cs / min).toFixed(1)} в минуту): добивайте их последним ударом — это главный источник золота.`);
    const used = h.abC.reduce((a, b) => a + b, 0) / min; if (used < 1.5) out.push(`Умения применялись редко (${used.toFixed(1)} в минуту) — они перезаряжаются, их стоит тратить.`);
    if (h.dh < avg('dh') * 0.6 && (this.def(h.id) || {}).role !== 'support') out.push('Урона по героям заметно меньше, чем у союзников: чаще участвуйте в драках.');
    if (h.abC[3] === 0 && h.lv >= 6) out.push('Ультимейт ни разу не применён — изучите его на 6-м уровне и используйте в драках.');
    const unspent = R.ev.length && h.it.length < 6 && R.dur > 900; if (unspent) out.push('Инвентарь не заполнен к концу долгого матча — заходите в магазин чаще.');
    if (place <= 2) out.push('Один из лучших в матче — так держать!');
    if (!out.length) out.push('Ровный матч без явных ошибок.');
    return out.slice(0, 5).map(t => `<li>${t}</li>`).join('');
  }
};
// actors (per-frame scripts of abilities) carry the ability that started them, like timers and projectiles do
{ const push = Array.prototype.push; G.actors.push = function (...a) { for (const x of a) if (x && x._ctx === undefined) x._ctx = DMG_CTX; return push.apply(this, a); }; }
