'use strict';
/* ===== the player's profile: nickname, avatar, frame, title, favourite heroes, match history, per-hero figures, achievements.
   Everything lives in PROFILE (core.js), so it is saved, mirrored and carried by the progress code like the rest ===== */
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// avatar frames: [id, name, colour, the achievement that unlocks it]
const FRAMES = [
  ['ember', 'Пепел', '#e8a04c'], ['ice', 'Лёд', '#8fe0ff'], ['blood', 'Кровь', '#ff4a5a'], ['jade', 'Нефрит', '#5fe8c8'], ['violet', 'Сумрак', '#b48cff'], ['steel', 'Сталь', '#aab3c4'],
  ['gold', 'Золото ветерана', '#ffd36a', 'win10'], ['star', 'Звезда арены', '#fff2b0', 'mvp10'], ['geass', 'Алый знак', '#ff2a48', 'rankT'], ['void', 'Бездна', '#8a4aff', 'games50']
];
// achievements: career ones are checked any time (c: the profile), match ones only when a match is recorded (m: what the player did in it)
const ACH = [
  { id: 'win1', name: 'Первая победа', title: 'Победитель', icon: 'rkplayer', desc: 'Выиграть матч', prog: p => [p.wins, 1] },
  { id: 'games10', name: 'Втянулся', title: 'Завсегдатай', icon: 'dash', desc: 'Сыграть 10 матчей', prog: p => [p.games, 10] },
  { id: 'win10', name: 'Десять побед', title: 'Ветеран', icon: 'rkboss', desc: 'Выиграть 10 матчей · рамка «Золото ветерана»', prog: p => [p.wins, 10] },
  { id: 'mvp1', name: 'Лучший в матче', title: 'MVP', icon: 'rktalent', desc: 'Стать MVP матча', prog: p => [p.mvp, 1] },
  { id: 'mvp10', name: 'Звезда арены', title: 'Звезда арены', icon: 'rkusurp', desc: 'Стать MVP 10 раз · рамка «Звезда арены»', prog: p => [p.mvp, 10] },
  { id: 'heroes10', name: 'Разносторонний', title: 'Универсал', icon: 'lelcastle', desc: 'Сыграть 10 разными героями', prog: p => [Object.values(p.heroes).filter(h => h.g > 0).length, 10] },
  { id: 'heroes30', name: 'Знаток героев', title: 'Знаток героев', icon: 'lelinn', desc: 'Сыграть 30 разными героями', prog: p => [Object.values(p.heroes).filter(h => h.g > 0).length, 30] },
  { id: 'fav5', name: 'Ценитель', title: 'Ценитель', icon: 'frbloom', desc: 'Добавить в избранное 5 героев', prog: p => [p.fav.length, 5] },
  { id: 'games50', name: 'Житель Разлома', title: 'Житель Разлома', icon: 'frinn', desc: 'Сыграть 50 матчей · рамка «Бездна»', prog: p => [p.games, 50] },
  { id: 'win50', name: 'Легенда', title: 'Легенда Разлома', icon: 'akifox', desc: 'Выиграть 50 матчей', prog: p => [p.wins, 50] },
  { id: 'rankT', name: 'Талант', title: 'Талант', icon: 'lelgeass', desc: 'Дойти в рейтинге до звания «Талант» · рамка «Алый знак»', prog: p => [p.rk.peak, 1001] },
  { id: 'rankB', name: 'Босс', title: 'Босс', icon: 'rkkiller', desc: 'Дойти в рейтинге до звания «Босс»', prog: p => [p.rk.peak, 1401] },
  { id: 'kills10', name: 'Резня', title: 'Мясник', icon: 'akikat', desc: '10 убийств за один матч', match: m => m.k >= 10 },
  { id: 'nodeath', name: 'Неуязвимый', title: 'Бессмертный', icon: 'frbarrier', desc: 'Победить, ни разу не умерев', match: m => m.w && m.d === 0 },
  { id: 'assist15', name: 'Командный игрок', title: 'Командный игрок', icon: 'lelknight', desc: '15 помощи в одном матче', match: m => m.a >= 15 },
  { id: 'heal', name: 'Ангел-хранитель', title: 'Ангел-хранитель', icon: 'agfpatch', desc: '6000 лечения, щитов и усилений за матч', match: m => m.heal >= 6000 },
  { id: 'blitz', name: 'Блицкриг', title: 'Блицкриг', icon: 'ichstep', desc: 'Победить быстрее чем за 12 минут', match: m => m.w && m.min < 12 },
  { id: 'tower', name: 'Гроза башен', title: 'Разрушитель', icon: 'carshatter', desc: '6000 урона по башням за матч', match: m => m.tower >= 6000 }
];
const PROF = {
  fresh: [],
  // older saves lack the new fields; bad values are dropped
  ensure() {
    const p = PROFILE;
    if (typeof p.nick !== 'string') p.nick = ''; if (!Array.isArray(p.fav)) p.fav = []; if (!Array.isArray(p.hist)) p.hist = []; if (!p.ach || typeof p.ach !== 'object') p.ach = {};
    if (!FRAMES.some(f => f[0] === p.frame)) p.frame = 'ember'; if (typeof p.title !== 'string') p.title = ''; if (typeof p.ava !== 'string') p.ava = '';
    p.fav = p.fav.filter(id => HEROES.some(h => h.id === id)); if (p.ava && !HEROES.some(h => h.id === p.ava)) p.ava = '';
  },
  name() { return PROFILE.nick || 'Игрок'; },
  frame(id) { return FRAMES.find(f => f[0] === (id || PROFILE.frame)) || FRAMES[0]; },
  frameOk(f) { return !f[3] || !!PROFILE.ach[f[3]]; },
  ava() { const p = PROFILE; if (p.ava) return p.ava; const most = Object.keys(p.heroes).sort((a, b) => p.heroes[b].g - p.heroes[a].g)[0]; return most && HEROES.some(h => h.id === most) ? most : (p.hero || 'brand'); },
  title() { const a = ACH.find(q => q.id === PROFILE.title && PROFILE.ach[q.id]); return a ? a.title : 'Новичок Разлома'; },
  // newly reached achievements, given what happened in a match (m) or only the career figures (no m)
  check(m) {
    const p = PROFILE, out = [];
    for (const a of ACH) { if (p.ach[a.id]) continue; const ok = a.prog ? (() => { const [c, n] = a.prog(p); return c >= n; })() : (m && a.match(m)); if (ok) { p.ach[a.id] = Date.now(); out.push(a); } }
    return out;
  },
  // the match is over (called from UI.record): a line in the history, then achievements
  onMatch(P, win, me, R) {
    this.ensure(); const p = PROFILE, m = { h: P.def.id, w: win, k: P.kills, d: P.deaths, a: P.assists, mvp: R[0].h === P, sc: me ? +me.score.toFixed(1) : 0, min: +(G.time / 60).toFixed(1), t: Date.now(), rk: !!G.ranked, heal: P.healDone, tower: P.dmgTower };
    p.hist.unshift({ h: m.h, w: m.w, k: m.k, d: m.d, a: m.a, mvp: m.mvp, sc: m.sc, min: m.min, t: m.t, rk: m.rk }); p.hist.length = Math.min(p.hist.length, 30);
    this.fresh = this.check(m);
  },
  toggleFav(id) {
    this.ensure(); const p = PROFILE, i = p.fav.indexOf(id); if (i >= 0) p.fav.splice(i, 1); else p.fav.push(id);
    const n = this.check(null); SAVE.touch(); this.syncFav(); if (n.length) this.toast(n);
    return i < 0;
  },
  syncFav() { for (const h of HEROES) { const c = $('card-' + h.id); if (c) c.classList.toggle('fav', PROFILE.fav.includes(h.id)); } const b = document.querySelector('#dinfo .favb'); if (b) { const on = PROFILE.fav.includes(b.dataset.fav); b.classList.toggle('on', on); b.textContent = on ? '★ В избранном' : '☆ В избранное'; } },
  // a banner at the top of the screen for achievements reached outside a match
  toast(list) { const t = $('achtoast'); if (!t || !list.length) return; t.innerHTML = list.map(a => `<b>Достижение получено:</b> ${esc(a.name)} · титул «${esc(a.title)}»`).join('<br>'); t.classList.remove('show'); void t.offsetWidth; t.classList.add('show'); SFX.play('mvp', 0.6); },
  avaHTML(id, size) { const f = this.frame(); return `<span class="ava" style="--fc:${f[2]};width:${size}px;height:${size}px"><img src="${UI.portraits[id || this.ava()] || ''}" alt=""></span>`; },
  // the small card at the top of the home screen
  homeCard() {
    this.ensure(); const el = $('hm-prof'); if (!el) return; const nAch = Object.keys(PROFILE.ach).length;
    el.innerHTML = `${this.avaHTML(null, 58)}<span class="hp-id"><b>${esc(this.name())}</b><i>${esc(this.title())}</i><small>Достижения: ${nAch} из ${ACH.length} · открыть профиль →</small></span>`;
  },
  // the profile screen
  render() {
    this.ensure(); const p = PROFILE, box = $('prof'); if (!box) return;
    const g = p.games, wr = g ? Math.round(p.wins / g * 100) : 0, avg = v => g ? (v / g).toFixed(1) : '0', nAch = Object.keys(p.ach).length, f = this.frame();
    const hstat = Object.keys(p.heroes).filter(id => p.heroes[id].g > 0 && HEROES.some(h => h.id === id)).sort((a, b) => p.heroes[b].g - p.heroes[a].g);
    const hn = id => (HEROES.find(h => h.id === id) || {}).name || id, hc = id => css(((HEROES.find(h => h.id === id) || {}).look || { glow: 0xffffff }).glow);
    const date = t => { const d = new Date(t); return String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0') + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
    const titles = [['', 'Новичок Разлома']].concat(ACH.filter(a => p.ach[a.id]).map(a => [a.id, a.title]));
    box.innerHTML = `
      <div class="pf-top" style="--fc:${f[2]}">
        ${this.avaHTML(null, 132)}
        <div class="pf-id">
          <label class="pf-nick"><input id="pf-nick" maxlength="16" spellcheck="false" autocomplete="off" placeholder="Игрок" value="${esc(p.nick)}"><span>✎</span></label>
          <div class="pf-title">${esc(this.title())}</div>
          <div class="pf-rank">${typeof rankChip === 'function' ? rankChip(p.rk.orp) : ''}<small>лучшее: ${p.rk.peak} ОРП</small></div>
        </div>
        <div class="pf-tiles num">
          <span><b>${g}</b>матчей</span><span><b>${wr}%</b>побед</span><span><b>${p.mvp}</b>раз MVP</span><span><b>${avg(p.kills)} / ${avg(p.deaths)} / ${avg(p.assists)}</b>У / С / П за матч</span><span><b>${nAch} / ${ACH.length}</b>достижений</span>
        </div>
      </div>
      <div class="pf-cols">
        <section class="pf-box"><h4 class="sech">Аватар <small>любой герой</small></h4><div class="pf-avas">${HEROES.map(h => `<button type="button" data-ava="${h.id}" class="${this.ava() === h.id ? 'on' : ''}" title="${esc(h.name)}"><img src="${UI.portraits[h.id] || ''}" alt=""></button>`).join('')}</div></section>
        <section class="pf-box">
          <h4 class="sech">Рамка</h4><div class="pf-frames">${FRAMES.map(fr => { const ok = this.frameOk(fr), a = fr[3] && ACH.find(q => q.id === fr[3]); return `<button type="button" data-frame="${fr[0]}" class="${p.frame === fr[0] ? 'on' : ''}${ok ? '' : ' lock'}" style="--fc:${fr[2]}" title="${esc(fr[1])}${ok ? '' : ' — откроется за достижение «' + esc(a.name) + '»'}"><i></i><span>${esc(fr[1])}</span>${ok ? '' : '<em>🔒</em>'}</button>`; }).join('')}</div>
          <h4 class="sech">Титул <small>открывается за достижения</small></h4><div class="pf-titles">${titles.map(([id, t]) => `<button type="button" data-title="${id}" class="${(p.title || '') === id && (id === '' || p.ach[id]) ? 'on' : ''}">${esc(t)}</button>`).join('')}</div>
        </section>
      </div>
      <section class="pf-box"><h4 class="sech">Любимые герои <small>отмечайте звёздочкой в разделе «Герои»</small></h4>
        <div class="pf-favs">${p.fav.length ? p.fav.map(id => { const s = p.heroes[id] || { g: 0, w: 0 }; return `<button type="button" class="pf-fav" data-hero="${id}" style="--hc:${hc(id)}"><img src="${UI.portraits[id] || ''}" alt=""><b>${esc(hn(id))}</b><small>${s.g ? s.g + ' матч. · ' + Math.round(s.w / s.g * 100) + '% побед' : 'ещё не играли'}</small></button>`; }).join('') : '<p class="pf-empty">Пока пусто. Откройте «Герои» и нажмите «☆ В избранное» у тех, кто нравится.</p>'}</div></section>
      <section class="pf-box"><h4 class="sech">Достижения <small>${nAch} из ${ACH.length}</small></h4>
        <div class="pf-ach">${ACH.map(a => { const got = p.ach[a.id], pr = a.prog ? a.prog(p) : null; return `<div class="pf-a${got ? ' got' : ''}"><img src="${iconURL(a.icon, got ? 0xecc56f : 0x5d6676)}" alt=""><div><b>${esc(a.name)}</b><span>${esc(a.desc)}</span><small>${got ? 'получено ' + date(got) + ' · титул «' + esc(a.title) + '»' : (pr ? Math.min(pr[0], pr[1]) + ' / ' + pr[1] : 'за один матч')}</small>${!got && pr ? `<i style="--w:${Math.min(100, pr[0] / pr[1] * 100)}%"></i>` : ''}</div></div>`; }).join('')}</div></section>
      <div class="pf-cols">
        <section class="pf-box"><h4 class="sech">Последние матчи</h4>${p.hist.length ? `<table class="sb num pf-t"><tr><th>Герой</th><th>Итог</th><th>У / С / П</th><th>Рейтинг</th><th>Длит.</th><th>Когда</th></tr>${p.hist.slice(0, 15).map(m => `<tr><td style="color:${hc(m.h)}">${esc(hn(m.h))}${m.rk ? ' <small class="rkm">рейтинг</small>' : ''}</td><td class="${m.w ? 'pw' : 'pl'}">${m.w ? 'Победа' : 'Поражение'}${m.mvp ? ' ★' : ''}</td><td>${m.k} / ${m.d} / ${m.a}</td><td>${m.sc}</td><td>${m.min} мин</td><td>${date(m.t)}</td></tr>`).join('')}</table>` : '<p class="pf-empty">Сыграйте матч — он появится здесь.</p>'}</section>
        <section class="pf-box"><h4 class="sech">По героям</h4>${hstat.length ? `<table class="sb num pf-t"><tr><th>Герой</th><th>Матчей</th><th>Побед</th><th>% побед</th></tr>${hstat.map(id => { const s = p.heroes[id]; return `<tr><td style="color:${hc(id)}">${esc(hn(id))}</td><td>${s.g}</td><td>${s.w}</td><td>${Math.round(s.w / s.g * 100)}%</td></tr>`; }).join('')}</table>` : '<p class="pf-empty">Статистика появится после первого матча.</p>'}</section>
      </div>`;
  },
  init() {
    this.ensure(); this.check(null);
    const box = $('prof');
    box.addEventListener('click', e => {
      const t = e.target.closest('button'); if (!t) return; const p = PROFILE; SFX.init();
      if (t.dataset.ava) { p.ava = t.dataset.ava; }
      else if (t.dataset.frame) { const f = this.frame(t.dataset.frame); if (!this.frameOk(f)) { SFX.play('deny'); return; } p.frame = f[0]; }
      else if (t.dataset.title !== undefined) p.title = t.dataset.title;
      else if (t.dataset.hero) { UI.pick(t.dataset.hero); UI.go('heroes'); SFX.play('ui'); return; }
      else return;
      SFX.play('ui'); SAVE.touch(); this.render(); this.homeCard();
    });
    // the nickname: letters, digits, spaces and a few signs, up to 16 characters; saved when the field is left or Enter is pressed
    box.addEventListener('change', e => { if (e.target.id !== 'pf-nick') return; const v = e.target.value.replace(/[<>"'`\\]/g, '').replace(/\s+/g, ' ').trim().slice(0, 16); PROFILE.nick = v; e.target.value = v; SAVE.touch(); this.homeCard(); SFX.play('ui'); });
    box.addEventListener('keydown', e => { if (e.target.id === 'pf-nick') { e.stopPropagation(); if (e.key === 'Enter') e.target.blur(); } });
    $('hm-prof').onclick = () => { SFX.init(); SFX.play('ui'); UI.go('profile'); };
    // the star on the hero dossier
    $('dinfo').addEventListener('click', e => { const b = e.target.closest('.favb'); if (!b) return; SFX.init(); SFX.play('ui'); this.toggleFav(b.dataset.fav); });
    this.syncFav(); this.homeCard();
  }
};
