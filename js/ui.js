'use strict';
/* ===== UI: menu, hero preview, HUD, overlay bars, minimap, shop, scoreboard ===== */
const UI = {
  sel: 'brand', diff: 1, lane: 'top', role: 'dmg', pv: null, portraits: {}, feedN: 0, mmBg: null, shopOpen: false, ctx: null, mctx: null, W: 0, H: 0, v: null, lastCd: [0, 0, 0], msgT: 0, tipFor: null,
  shops: {}, shopT: 0, capture: null, capEl: null,
  init() {
    this.v = new THREE.Vector3(); this.ctx = $('ov').getContext('2d'); this.mctx = $('mmc').getContext('2d');
    this.initPreview(); this.buildMinimapBg();
    this.buildShop($('shopgrid'), $('shopcats'), true); this.buildMenu();
    this.buildKeys($('keys-menu'), 'km-'); this.buildKeys($('keys-pause'), 'kp-'); this.applyBinds();
    $('shopx').onclick = () => this.toggleShop(false); $('shopb').onclick = () => this.toggleShop();
    $('resume').onclick = () => togglePause(false); $('quit').onclick = () => { togglePause(false); toMenu(); }; $('again').onclick = () => toMenu();
    // one volume, two sliders: in the pause box and in the menu settings
    for (const id of ['vol', 'vol-m']) { $(id).value = Math.round(SFX.vol * 100); $(id).oninput = e => { SFX.setVol(e.target.value / 100); for (const o of ['vol', 'vol-m']) if (o !== id) $(o).value = e.target.value; saveGfx(); }; }
    this.buildGfx($('gfx-menu'), 'gm-'); this.buildGfx($('gfx-pause'), 'gp-'); this.buildGfx($('opt-menu'), 'om-', OPT_LIST); this.buildGfx($('opt-pause'), 'op-', OPT_LIST); this.syncGfx();
    for (const d of [0, 1, 2]) $('d' + d).onclick = () => { this.diff = d; for (const k of [0, 1, 2]) $('d' + k).classList.toggle('on', k === d); SFX.init(); SFX.play('ui'); };
    for (const l of LANE_NAMES) $('l-' + l).onclick = () => { this.lane = l; for (const k of LANE_NAMES) $('l-' + k).classList.toggle('on', k === l); SFX.init(); SFX.play('ui'); };
    $('play').onclick = () => {
      SFX.init(); SFX.play('buy');
      if (this.mode === 'sbx') { Object.assign(PROFILE, { hero: this.sel }); SAVE.touch(); startMatch(this.sel, 1, 'mid', 'dmg', true); this.announce('Полигон: 15 уровень, золото не кончается, магазин открыт везде', '#ecc56f'); return; }
      Object.assign(PROFILE, { hero: this.sel, lane: this.lane, role: this.role, diff: this.diff }); SAVE.touch(); startMatch(this.sel, this.diff, this.lane, this.role);
    };
    // the training ground: first the hero, then in
    $('poly').onclick = () => { SFX.init(); SFX.play('ui'); this.mode = 'sbx'; this.go('play'); };
    $('sbx-cd').onclick = () => { const S = G.sandbox; if (!S) return; S.nocd = !S.nocd; $('sbx-cd').classList.toggle('on', S.nocd); if (S.nocd) for (let i = 0; i < 4; i++) G.player.cd[i] = 0; };
    $('sbx-full').onclick = () => { const P = G.player; if (!P || P.dead) return; P.hp = P.maxHp; P.mana = P.maxMana; for (let i = 0; i < 4; i++) P.cd[i] = 0; P.icd = {}; P.recallCd = 0; };
    $('sbx-out').onclick = () => toMenu();
    SAVE.onApply = () => { applyGfx(); this.syncGfx(); this.applyBinds(); $('vol').value = $('vol-m').value = Math.round(SFX.vol * 100); this.applyProfile(); };
    SAVE.onState = () => this.showProfile();
    if (typeof RANKED !== 'undefined') RANKED.init(); this.applyProfile(); SAVE.init().then(() => { if (typeof RANKED !== 'undefined') RANKED.checkAbandon(); this.showProfile(); });
    // the progress code: the whole save as one line of text, to carry it past a browser that forgets
    $('profline').addEventListener('click', e => { if (e.target && e.target.id === 'savebtn') { SFX.init(); SFX.play('ui'); this.openCode(); } });
    $('sc-x').onclick = () => { $('savecode').hidden = true; };
    $('sc-copy').onclick = () => this.copyCode(); $('sc-load').onclick = () => this.loadCode();
    PROF.init();
    for (const r of ['dmg', 'sup']) $('r-' + r).onclick = () => { this.setRole(r); SFX.init(); SFX.play('ui'); };
    for (const l of LANE_NAMES) $('l-' + l).addEventListener('click', () => this.setRole(this.role));
    $('rnd').onclick = () => { SFX.init(); SFX.play('ui'); this.pick(pick(HEROES).id); };
    const mm = $('mmc');
    const mmCmd = e => {
      // a global ability being aimed: a left click on the minimap casts it at that spot
      if (e.type === 'mousedown' && e.button === 0 && G.aim >= 0 && G.player && G.player.def.abilities[G.aim].global) { mouse.x = e.clientX; mouse.y = e.clientY; releaseAim(G.aim); return; }
      if (G.aim >= 0 && e.buttons === 1) return;
      const r = mm.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 200 - 100, z = (e.clientY - r.top) / r.height * 200 - 100; if (e.button === 2 || e.buttons === 2) playerMove(x, z); else if (e.buttons === 1 || e.button === 0) { G.camLock = false; G.freeX = x; G.freeZ = z; } };
    mm.addEventListener('mousedown', mmCmd); mm.addEventListener('mousemove', e => { if (e.buttons) mmCmd(e); }); mm.addEventListener('contextmenu', e => e.preventDefault());
  },
  // one small renderer draws the roster portraits once, then the live turntable preview in the menu
  initPreview() {
    const cv = $('pv'); let r; try { r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, preserveDrawingBuffer: true }); } catch (e) { return; }
    r.setClearColor(0x10131a, 1); r.setPixelRatio(1); r.setSize(250, 300, false);
    const sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(30, 250 / 300, 0.1, 60);
    sc.add(new THREE.HemisphereLight(0xaab8d8, 0x30281f, 0.95)); const dl = new THREE.DirectionalLight(0xfff0dd, 1.0); dl.position.set(3, 5, 6); sc.add(dl);
    const rim = new THREE.DirectionalLight(0xffffff, 0.9); rim.position.set(-4, 3, -5); sc.add(rim);
    const floor = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.5, 0.2, 28), new THREE.MeshPhongMaterial({ color: 0x23272f, flatShading: true, shininess: 8 })); floor.position.y = -0.1; floor.visible = false; sc.add(floor);
    const ring = groundRing(0xffffff, 2.15, 0.55); ring.visible = false; sc.add(ring);
    // a hero of two (the twins) gets a second portrait under id + '2' for the HUD after a swap
    for (const [id, look] of HEROES.flatMap(d => d.palSolid ? [[d.id, d.look], [d.id + '2', d.pal]] : [[d.id, d.look]])) {
      // portraits use the same resting pose as the game, so every weapon is held the way it is in a match
      const rig = buildHero(look, 0xffffff), pu = { rig, id: 2, facing: 0.42, moving: false, ms: 8.5, flash: 0, dead: false, yOff: 0, anim: { walk: 0, atkT: 0, atkDur: 1, castT: 0, castDur: 1, castType: 'cast', deathT: 0, spinA: 0, alt: false } };
      rig.ring.visible = false; rig.root.rotation.y = 0.42; for (let i = 0; i < 4; i++) animHero(pu, 0.05); rig.head.rotation.y = rig.gun ? -GUN_YAW : 0;
      if (rig.board) { rig.tilt.rotation.y = 0.2; rig.head.rotation.y = -0.2; }   // a rider is drawn facing the viewer, not side-on
      rim.color.setHex(look.glow); sc.add(rig.root); const hY = rig.headY - (rig.board ? 0.2 : 0);
      cam.position.set(0.5, hY + 0.25, 3.7); cam.lookAt(0.05, hY - 0.22, 0);
      r.render(sc, cam); this.portraits[id] = cv.toDataURL('image/jpeg', 0.9); sc.remove(rig.root);
    }
    floor.visible = ring.visible = true; r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); r.setSize(300, 380, false); cam.aspect = 300 / 380; cam.updateProjectionMatrix();
    cam.position.set(0, 2.1, 7.3); cam.lookAt(0, 1.62, 0);
    this.pv = { r, sc, cam, rim, ring, unit: null, t: 0, def: null };
  },
  setPreview(def) {
    const pv = this.pv; if (!pv) return; if (pv.unit) pv.sc.remove(pv.unit.rig.root); if (pv.pal) { pv.sc.remove(pv.pal.rig.root); pv.pal = null; }
    if (def.pal) {   // a companion that fights beside the hero (a guardian spirit) is shown with him
      const r2 = buildHero(def.pal, 0xffffff), m2 = r2.mats[0]; r2.ring.visible = false; if (!def.palSolid) { m2.transparent = true; m2.opacity = 0.88; m2.emissive = new THREE.Color(def.palTint === undefined ? 0x2a1f66 : def.palTint); } if (def.palScale) r2.root.scale.multiplyScalar(def.palScale); pv.sc.add(r2.root);
      pv.pal = { rig: r2, id: 3, facing: 0.5, moving: false, ms: 8, flash: 0, dead: false, yOff: 0.45, anim: { walk: 0, atkT: 0, atkDur: 1, castT: 0, castDur: 1, castType: 'cast', deathT: 0, spinA: 0, alt: false } };
    }
    const rig = buildHero(def.look, 0xffffff); rig.ring.visible = false; pv.sc.add(rig.root);
    pv.unit = { rig, id: 1, facing: 0.5, moving: false, ms: 8.5, flash: 0, dead: false, yOff: 0, anim: { walk: 0, atkT: 0, atkDur: 1, castT: 0, castDur: 1, castType: 'cast', deathT: 0, spinA: 0, alt: false } };
    pv.rim.color.setHex(def.look.glow); pv.ring.material.color.setHex(def.look.glow); pv.t = 0; pv.def = def; rig.root.rotation.y = 0.5;
  },
  updatePreview(dt) {
    const pv = this.pv; if (!pv || !pv.unit || $('pane-heroes').hidden) return;
    const u = pv.unit, a = u.anim, t0 = pv.t; pv.t = (pv.t + dt) % 10; const t = pv.t, hit = at => t0 < at && t >= at;
    u.facing += dt * 0.5; u.moving = t > 5.6 && t < 8.2;
    if (hit(1.4) || hit(2.3)) { a.atkT = a.atkDur = 0.75; a.alt = !a.alt; }
    if (hit(4.0)) { const abs = pv.def.abilities.filter(a => a && !a.passive && !a.toggle), ab = abs[Math.floor(Math.random() * abs.length)]; a.castT = a.castDur = 0.9; a.castType = ab.anim || 'cast'; }
    animHero(u, dt);
    if (pv.pal) { const q = pv.pal, f = u.facing; q.facing = f; q.moving = u.moving; q.yOff = (pv.def.palY === undefined ? 0.45 : pv.def.palY) + (pv.def.palSolid ? 0 : Math.sin(pv.t * 2.4) * 0.1); if (a.atkT > 0) { q.anim.atkT = a.atkT; q.anim.atkDur = a.atkDur; q.anim.alt = a.alt; } animHero(q, dt); const bk = pv.def.palBack === undefined ? 0.7 : pv.def.palBack, sd = pv.def.palSide === undefined ? 1.15 : pv.def.palSide; q.rig.root.position.x = -Math.sin(f) * bk + Math.cos(f) * sd; q.rig.root.position.z = -Math.cos(f) * bk - Math.sin(f) * sd; }
    pv.ring.rotation.y += dt * 0.4; pv.r.render(pv.sc, pv.cam);
  },
  /* ----- graphics settings: the same list in the menu ('gm-') and in the pause box ('gp-') ----- */
  buildGfx(box, pre, list) {
    (list || GFX_LIST).forEach(([k, label, opts, hint]) => {
      const row = document.createElement('div'); row.className = 'grow' + (k === 'preset' ? ' wide' : (opts.length > 4 ? ' wide2' : '')); if (hint) row.title = hint; row.innerHTML = `<span>${label}${hint ? `<small>${hint}</small>` : ''}</span><div class="seg"></div>`;
      opts.forEach(([v, text], i) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = text; b.id = pre + k + i; b.onclick = () => { setGfx(k, v); applyGfx(); this.syncGfx(); SFX.init(); SFX.play('ui'); }; row.lastChild.appendChild(b); });
      box.appendChild(row);
    });
  },
  syncGfx() {
    for (const pre of ['gm-', 'gp-']) for (const [k, , opts] of GFX_LIST) opts.forEach(([v], i) => { const b = $(pre + k + i); b.classList.toggle('on', GFX[k] === v); if ((k === 'hdr' || k === 'warp') && v === 1) b.disabled = !hdrOK || !postOK; });
    for (const pre of ['om-', 'op-']) for (const [k, , opts] of OPT_LIST) opts.forEach(([v], i) => { const b = $(pre + k + i); if (b) b.classList.toggle('on', GFX[k] === v); });
    const note = !postOK ? 'Постобработка недоступна: не загрузились её модули, игра рисуется напрямую.' : (!hdrOK ? 'Эта видеокарта или браузер не дают буфер с плавающей точкой: HDR и искажение воздуха отключены.' : (GFX.preset === 'custom' ? 'Свой набор настроек.' : ''));
    $('gfxnote-m').textContent = $('gfxnote-p').textContent = note;
  },
  /* ----- shop: 'buy-' is the live side panel in a match, 'cat-' the read-only catalogue in the menu ----- */
  itemEl(it, live, step) {
    const b = document.createElement(live ? 'button' : 'div'); if (live) b.type = 'button'; b.className = 'itm'; b.style.setProperty('--cc', css(CAT_COL[it.cat]));
    b.innerHTML = `${step ? `<s class="stp num">${step}</s>` : ''}<span class="it"><img src="${iconURL(it.icon, CAT_COL[it.cat])}" alt=""></span><span class="tx"><b>${it.name}<u class="tier t${itemTier(it)[1]}" title="${itemTier(it)[2]} предмет">${itemTier(it)[1]}</u></b><em>${it.desc}</em></span><span class="pr"><i class="num">${it.cost}</i><small></small></span>`;
    if (live) { b.onclick = () => this.buy(it.id); b.oncontextmenu = e => { e.preventDefault(); this.buy(it.id); }; }
    return b;
  },
  buy(id) {
    const P = G.player, it = ITEM[id];
    const r = P && buyItem(P, id);
    if (r) { SFX.play('buy'); this.refreshInv(); if (r === 'stash') this.msg(it.name + ' — на складе: заберите на базе'); }
    else { SFX.play('deny'); this.msg(!P ? '' : (itemBlocked(P, it) || stashBlocked(P, it) ? 'Такой предмет уже есть' : (P.gold < it.cost ? 'Не хватает ' + Math.ceil(it.cost - P.gold) + ' золота' : 'Склад заполнен — заберите предметы на базе'))); }
  },
  buildShop(grid, chips, live) {
    const pre = live ? 'buy-' : 'cat-', S = this.shops[pre] = { els: [], rec: [], grid, next: null };
    for (const [id, name] of [['rec', 'Сборка']].concat(ITEM_CATS)) {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = name; b.id = pre + 'chip-' + id; if (CAT_COL[id]) { b.className = 'cc'; b.style.setProperty('--cc', css(CAT_COL[id])); }
      b.onclick = () => { this.shopTab(pre, id); SFX.init(); SFX.play('ui'); }; chips.appendChild(b);
    }
    const rec = document.createElement('div'); rec.className = 'recp'; rec.id = pre + 'rec'; grid.appendChild(rec);
    const ord = { atk: 0, mag: 1, def: 2, sup: 3, util: 4 }; let last = '';
    for (const it of ITEMS.slice().sort((a, b) => ord[a.cat] - ord[b.cat] || a.cost - b.cost)) {
      if (it.cat !== last) { last = it.cat; const h = document.createElement('h5'); h.className = 'cathd'; h.id = pre + 'hd-' + it.cat; h.style.setProperty('--cc', css(CAT_COL[it.cat])); h.textContent = ITEM_CATS.find(c => c[0] === it.cat)[1]; grid.appendChild(h); }
      const el = this.itemEl(it, live); el.id = pre + it.id; grid.appendChild(el); S.els.push({ el, it });
    }
    this.shopTab(pre, live ? 'rec' : 'all');
  },
  shopTab(pre, id) {
    const S = this.shops[pre];
    for (const c of [['rec']].concat(ITEM_CATS)) $(pre + 'chip-' + c[0]).classList.toggle('on', c[0] === id);
    $(pre + 'rec').hidden = id !== 'rec';
    for (const e of S.els) e.el.hidden = id === 'rec' || (id !== 'all' && e.it.cat !== id);
    for (const c in CAT_COL) $(pre + 'hd-' + c).hidden = id !== 'all';
    S.grid.scrollTop = 0; this.shopT = 0;
  },
  // the build tab: the hero's six recommended items in buying order, then situational swaps
  renderRec(pre, def, P) {
    const S = this.shops[pre], box = $(pre + 'rec'), live = pre === 'buy-', build = BUILDS[def.build], have = P ? P.items.concat(P.stash || []) : [];
    const owned = build.map(id => { const i = have.indexOf(id); if (i < 0) return false; have.splice(i, 1); return true; }), next = owned.indexOf(false);
    const left = build.reduce((s, id, i) => s + (owned[i] ? 0 : ITEM[id].cost), 0);
    box.innerHTML = ''; S.rec = []; S.next = live && next >= 0 ? ITEM[build[next]] : null;
    const hd = document.createElement('div'); hd.className = 'rechd';
    hd.innerHTML = `<b>${def.name} · ${BUILD_NAME[def.build]}</b><span class="num">${live ? `куплено ${owned.filter(Boolean).length} из 6 · осталось ${left} з` : `вся сборка — ${left} з`}</span>`; box.appendChild(hd);
    if (live) {
      const nb = document.createElement('button'); nb.type = 'button'; nb.className = 'btn pri nextb'; nb.id = 'nextb';
      if (S.next) { nb.textContent = `Купить следующий: ${S.next.name} · ${S.next.cost} з`; nb.onclick = () => this.buy(S.next.id); } else { nb.textContent = 'Сборка собрана'; nb.disabled = true; }
      box.appendChild(nb);
    }
    build.forEach((id, i) => { const it = ITEM[id], el = this.itemEl(it, live, i + 1); el.classList.toggle('own', owned[i]); el.classList.toggle('nxt', live && i === next); box.appendChild(el); S.rec.push({ el, it, own: owned[i] }); });
    const h = document.createElement('h5'); h.className = 'cathd'; h.textContent = 'По ситуации'; box.appendChild(h);
    for (const [id, why] of buildAlt(def)) { const it = ITEM[id], el = this.itemEl(it, live); el.querySelector('em').innerHTML = `<u>${why}.</u> ${it.desc}`; box.appendChild(el); S.rec.push({ el, it }); }
  },
  refreshShop() {
    const P = G.player, S = this.shops['buy-'], can = canShop(P), sn = (P.stash || []).length, toInv = can && P.items.length < 6, full = !toInv && sn >= STASH_MAX, note = $('shopnote');
    note.textContent = full ? 'Склад заполнен: заберите предметы на базе' : (toInv ? 'Нажмите на предмет, чтобы купить' : (!can ? `Вы не на базе: покупка ляжет на склад (${sn}/${STASH_MAX}) и придёт в инвентарь у фонтана` : `Инвентарь заполнен: покупка ляжет на склад (${sn}/${STASH_MAX})`));
    note.classList.toggle('warn', !toInv); $('shopgold').textContent = Math.floor(P.gold) + ' з';
    const cnt = {}; for (const id of P.items.concat(P.stash || [])) cnt[id] = (cnt[id] || 0) + 1;
    const st = e => {
      const it = e.it, lack = Math.ceil(it.cost - P.gold), blocked = itemBlocked(P, it) || stashBlocked(P, it), sm = e.el.lastChild.lastChild;
      e.el.classList.toggle('no', full || lack > 0 || blocked); e.el.classList.toggle('poor', lack > 0 && !e.own);
      const s = e.own ? 'куплено' : (blocked ? 'уже есть' : (lack > 0 ? 'ещё ' + lack : (cnt[it.id] ? 'есть ×' + cnt[it.id] : ''))); if (sm.textContent !== s) sm.textContent = s;
    };
    S.els.forEach(st); S.rec.forEach(st);
    const nb = $('nextb'); if (nb && S.next) nb.disabled = full || P.gold < S.next.cost;
    const inv = $('shopinv').children; for (let i = 0; i < inv.length; i++) { const sm = inv[i].lastChild; if (P.items[i] && sm && sm.tagName === 'SMALL') { const s = '+' + sellPrice(P, i); if (sm.textContent !== s) sm.textContent = s; } }
  },
  /* ----- key bindings ----- */
  buildKeys(box, pre) {
    for (const [a, name] of BIND_LIST) {
      const r = document.createElement('div'); r.className = 'kbrow'; r.innerHTML = `<span>${name}</span>`;
      const b = document.createElement('button'); b.type = 'button'; b.className = 'kbtn'; b.id = pre + a; b.onclick = () => { SFX.init(); SFX.play('ui'); this.capture = a; this.capEl = b; this.applyBinds(); };
      r.appendChild(b); box.appendChild(r);
    }
    const rs = document.createElement('button'); rs.type = 'button'; rs.className = 'btn kbreset'; rs.textContent = 'Вернуть клавиши по умолчанию'; rs.onclick = () => { resetBinds(); this.endCapture(); SFX.init(); SFX.play('ui'); }; box.appendChild(rs);
  },
  endCapture() { if (this.capEl) this.capEl.blur(); this.capture = null; this.capEl = null; this.applyBinds(); },
  // every element marked data-k shows the key currently bound to that action
  applyBinds() {
    for (const el of document.querySelectorAll('[data-k]')) el.textContent = kl(el.dataset.k);
    for (const pre of ['km-', 'kp-']) for (const [a] of BIND_LIST) { const b = $(pre + a); if (!b) continue; const cap = this.capture === a && this.capEl === b; b.textContent = cap ? 'нажмите клавишу…' : kl(a); b.classList.toggle('cap', cap); }
  },
  buildMenu() {
    const ro = $('roster'), rf = $('rolef'), roles = [['all', 'Все'], ['fav', '★ Избранные'], ['front', 'Танки и бойцы'], ['assassin', 'Убийцы'], ['mage', 'Маги'], ['marks', 'Стрелки'], ['support', 'Поддержка']];
    roles.forEach(([id, name], i) => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = name; b.id = 'role-' + id; if (!i) b.className = 'on';
      b.onclick = () => { for (const r of roles) $('role-' + r[0]).classList.toggle('on', r[0] === id); for (const h of HEROES) $('card-' + h.id).hidden = id === 'fav' ? !PROFILE.fav.includes(h.id) : (id !== 'all' && h.role !== id); SFX.init(); SFX.play('ui'); };
      rf.appendChild(b);
    });
    for (const def of HEROES) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'card'; b.id = 'card-' + def.id; b.style.setProperty('--hc', css(def.look.glow));
      b.innerHTML = `<img src="${this.portraits[def.id] || ''}" alt="${def.name}"><i class="fstar">★</i><span class="nm"><b>${def.name}</b><i>${def.roleName}</i></span>`;
      b.onclick = () => { SFX.init(); SFX.play('ui'); this.pick(def.id); }; b.ondblclick = () => { SFX.init(); startMatch(def.id, this.diff, this.lane, this.role); };
      ro.appendChild(b);
    }
    // the home screen leads to every section; each section has a back button (and Esc)
    for (const b of document.querySelectorAll('.hm-nav [data-go]')) b.onclick = () => { SFX.init(); SFX.play('ui'); this.go(b.dataset.go); };
    $('back').onclick = () => { SFX.init(); SFX.play('ui'); this.back(); };
    $('m-bots-go').onclick = () => { SFX.init(); SFX.play('ui'); this.mode = 'bots'; this.go('play'); };
    $('pickplay').onclick = () => { SFX.init(); SFX.play('ui'); this.mode = 'bots'; this.go('play'); };
    for (const m of document.querySelectorAll('.mode')) m.addEventListener('click', e => { if (!e.target.closest('.mgo')) m.querySelector('.mgo').click(); });
    for (const i of document.querySelectorAll('.mode .mic')) i.style.backgroundImage = `url(${iconURL(i.dataset.ic, parseInt(i.dataset.c, 16))})`;
    // patch notes; the menu item gets a dot until this version's notes have been opened
    $('ver').textContent = 'v' + GAME_VER; $('ver').onclick = () => this.go('news');
    $('news').innerHTML = PATCH_NOTES.map((p, i) => `<article${i ? '' : ' class="cur"'}><h5>Версия ${p.v}${p.date ? `<small>${p.date}</small>` : ''}${i ? '' : '<small>текущая</small>'}</h5><ul>${p.items.map(t => `<li>${t}</li>`).join('')}</ul></article>`).join('');
    let seen = null; try { seen = localStorage.getItem('ashrift.seenver'); } catch (e) { }
    $('tab-news').classList.toggle('new', seen !== GAME_VER);
    this.buildShop($('mitems'), $('mcats'), false); this.drawBigMap(); this.pick(this.sel); this.mode = 'bots'; this.go('home');
  },
  // menu screens: home, modes, play (pick a hero for the chosen mode), heroes, items, map, settings, news
  go(scr) {
    const M = $('menu'), P = { modes: ['modes'], play: ['heroes'], heroes: ['heroes'], items: ['items'], map: ['map'], settings: ['gfx', 'keys'], news: ['news'], profile: ['profile'] }[scr] || [];
    const T = { modes: 'Выбор режима', play: this.mode === 'sbx' ? 'Полигон: выбор героя' : 'Бой с ботами: выбор героя', heroes: 'Герои', items: 'Предметы', map: 'Карта и цели', settings: 'Настройки', news: 'Что нового', profile: 'Профиль' };
    this.scr = scr; M.dataset.scr = scr; M.scrollTop = 0;
    $('home').hidden = scr !== 'home'; $('sub').hidden = scr === 'home';
    for (const p of ['modes', 'heroes', 'items', 'map', 'keys', 'gfx', 'news', 'profile']) $('pane-' + p).hidden = !P.includes(p);
    if (scr === 'profile') PROF.render();
    $('gobar').hidden = scr !== 'play'; $('gobar').classList.toggle('sbx', this.mode === 'sbx'); $('play').textContent = this.mode === 'sbx' ? 'В ПОЛИГОН' : 'В БОЙ';
    $('pickplay').hidden = scr !== 'heroes'; $('subttl').textContent = T[scr] || '';
    if (scr === 'news') { $('tab-news').classList.remove('new'); try { localStorage.setItem('ashrift.seenver', GAME_VER); } catch (e) { } }
  },
  back() { this.go(this.scr === 'play' ? 'modes' : 'home'); },
  drawBigMap() {
    const c = $('bigmap'), g = c.getContext('2d'), S = c.width, m = v => (v + 100) / 200 * S;
    g.imageSmoothingEnabled = true; g.drawImage(this.mmBg, 0, 0, S, S);
    const dot = (x, z, r, col, sq) => { g.fillStyle = col; g.strokeStyle = '#0a0c11'; g.lineWidth = 2; g.beginPath(); if (sq) { g.save(); g.translate(m(x), m(z)); g.rotate(Math.PI / 4); g.rect(-r, -r, r * 2, r * 2); g.restore(); } else g.arc(m(x), m(z), r, 0, TAU); g.fill(); g.stroke(); };
    const lab = (x, z, s, col) => { g.font = "600 13px 'Exo 2',sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 4; g.strokeStyle = 'rgba(8,10,14,.9)'; g.strokeText(s, m(x), m(z)); g.fillStyle = col || '#dfe3ea'; g.fillText(s, m(x), m(z)); };
    for (let team = 0; team < 2; team++) {
      for (const ln of LANE_NAMES) { const L = LANES[ln]; for (const d of (ln === 'mid' ? [40, 72] : [50, 100])) { const p = lanePoint(L, team === 0 ? d : L.len - d); dot(p.x, p.z, 6, TEAM_CSS[team], true); } }
      dot(BASES[team].core.x, BASES[team].core.z, 10, TEAM_CSS[team], true);
    }
    for (const cp of CAMPS) dot(cp.x, cp.z, 6, '#c9b36b'); dot(BOSS_POS.x, BOSS_POS.z, 9, '#b07bff'); dot(RUNE_POS.x, RUNE_POS.z, 6, '#7dffc8');
    lab(-70, 92, 'Ваша база', TEAM_CSS[0]); lab(68, -92, 'База врага', TEAM_CSS[1]); lab(-82, -8, 'ВЕРХ'); lab(-4, -4, 'ЦЕНТР'); lab(8, 90, 'НИЗ');
    lab(BOSS_POS.x, BOSS_POS.z + 15, 'Страж Разлома', '#d9c2ff'); lab(RUNE_POS.x, RUNE_POS.z - 13, 'Руна ветра', '#7dffc8'); lab(-46, 16, 'Лес', '#c9b36b'); lab(46, -16, 'Лес', '#c9b36b');
  },
  // put the remembered hero, lane, role and bot level back into the menu
  applyProfile() {
    const p = PROFILE; if (HEROES.some(h => h.id === p.hero)) this.pick(p.hero);
    if (LANE_NAMES.includes(p.lane)) { this.lane = p.lane; for (const k of LANE_NAMES) $('l-' + k).classList.toggle('on', k === p.lane); }
    if ([0, 1, 2].includes(p.diff)) { this.diff = p.diff; for (const k of [0, 1, 2]) $('d' + k).classList.toggle('on', k === p.diff); }
    this.setRole(p.role === 'sup' ? 'sup' : (p.hero ? 'dmg' : this.role)); this.showProfile();
  },
  showProfile() {
    if (typeof RANKED !== 'undefined') RANKED.show(); if (typeof PROF !== 'undefined') { PROF.ensure(); PROF.homeCard(); PROF.syncFav(); } const p = PROFILE, el = $('profline'); if (!el) return; const best = Object.keys(p.heroes).sort((a, b) => p.heroes[b].g - p.heroes[a].g)[0], bh = best && HEROES.find(h => h.id === best);
    el.innerHTML = (p.games ? `Матчей: <b>${p.games}</b> · побед: <b>${p.wins}</b> (${Math.round(p.wins / p.games * 100)}%) · MVP: <b>${p.mvp}</b> · У / С / П: <b>${p.kills} / ${p.deaths} / ${p.assists}</b>${bh ? ` · чаще всего: <b>${bh.name}</b> (${p.heroes[best].g})` : ''}` : 'Сыграйте первый матч — здесь появится ваша статистика') +
      ` <span class="savest${SAVE.state !== 'cloud' && !SAVE.localOk && !SAVE.idbOk ? ' bad' : ''}">${SAVE.state !== 'cloud' && !SAVE.localOk && !SAVE.idbOk ? '⚠ прогресс не сохраняется' : ''}<button id="savebtn" type="button">код прогресса</button></span>`;
  },
  openCode() { $('sc-txt').value = SAVECODE.make(); $('sc-msg').textContent = ''; $('savecode').hidden = false; },
  copyCode() {
    const t = $('sc-txt'), done = ok => { $('sc-msg').textContent = ok ? 'Код скопирован. Сохраните его где-нибудь у себя.' : 'Не получилось скопировать само — выделите текст в поле (Ctrl+A) и скопируйте (Ctrl+C).'; };
    t.value = SAVECODE.make(); t.focus(); t.select();
    try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(t.value).then(() => done(true), () => { let ok = false; try { ok = document.execCommand('copy'); } catch (e) { } done(ok); }); return; } } catch (e) { }
    let ok = false; try { ok = document.execCommand('copy'); } catch (e) { } done(ok);
  },
  loadCode() {
    const r = SAVECODE.read($('sc-txt').value), m = $('sc-msg');
    if (!r) { m.textContent = 'Это не похоже на код прогресса. Вставьте код целиком — он начинается с ASH1.'; SFX.play('deny'); return; }
    SAVE.apply(r); SAVE.touch(); this.showProfile(); m.textContent = 'Прогресс загружен' + (r.profile.rk ? ': ' + rankOf(r.profile.rk.orp || 0).name + ', ' + (r.profile.rk.orp || 0) + ' ОРП' : '') + '.'; SFX.play('level');
  },
  // lane role: damage or support. In the middle there is no partner, so the choice is switched off
  setRole(r) {
    this.role = r; const solo = this.lane === 'mid';
    for (const k of ['dmg', 'sup']) { const b = $('r-' + k); b.classList.toggle('on', !solo && k === r); b.disabled = solo; }
    $('rolenote').textContent = solo ? 'В центре вы один — роль не выбирается' : (r === 'dmg' ? 'Напарник-бот возьмёт героя поддержки и оставит вам добивания' : 'Напарник-бот возьмёт героя с уроном, а вы его прикрываете');
  },
  pick(id) {
    this.sel = id; const def = HEROES.find(h => h.id === id), col = def.look.glow, keys = 'qwer'; this.setRole(def.role === 'support' ? 'sup' : 'dmg');
    for (const h of HEROES) $('card-' + h.id).classList.toggle('sel', h.id === id);
    const bl = ['Урон', 'Живучесть', 'Контроль', 'Мобильность'], d = $('dossier'); d.style.setProperty('--hc', css(col));
    const build = BUILDS[def.build];
    $('dinfo').innerHTML = `<h2>${def.name}<button type="button" class="favb" data-fav="${def.id}">☆ В избранное</button></h2><div class="ttl">${def.title}</div>
      <div class="tags"><span class="tag">${def.roleName}</span><span class="tag">${def.stats.range > 5 ? 'Дальний бой' : 'Ближний бой'}</span><span class="dots">Сложность ${[1, 2, 3].map(i => `<s class="${i <= def.diffc ? 'on' : ''}"></s>`).join('')}</span></div>
      <p class="lore">${def.lore}</p>
      <div class="bars">${def.bars.map((v, i) => `<span>${bl[i]}</span><span class="t"><i style="width:${v * 20}%"></i></span>`).join('')}</div>
      <div class="recb"><span>Рекомендуемая сборка (подробно — во вкладке «Предметы»)</span><div>${build.map(b => `<img src="${iconURL(ITEM[b].icon, CAT_COL[ITEM[b].cat])}" alt="${ITEM[b].name}" title="${ITEM[b].name}" style="border-bottom-color:${css(CAT_COL[ITEM[b].cat])}">`).join('')}</div></div>`;
    const inn = def.innate ? `<div class="ab"><img src="${iconURL(def.innate.icon, col)}" alt=""><div><h4><kbd>★</kbd>${def.innate.name}<small>врождённая · действует всегда</small></h4><p>${def.innate.desc}</p></div></div>` : '';
    const abl = (list, c) => list.map((a, i) => a ? `<div class="ab"><img src="${iconURL(a.icon, a.iconCol || c)}" alt=""><div><h4><kbd data-k="${keys[i]}">${kl(keys[i])}</kbd>${a.name}<small>${i === 3 ? 'ультимейт · с 6 ур. · ' : ''}${a.passive ? 'пассивная' : (a.toggle ? 'включается и выключается' : a.cd + ' сек · ' + (a.costText || a.cost + ' маны'))}</small></h4><p>${a.desc}</p></div></div>` : '').join('');
    const sub = (t, c) => `<div class="abhd" style="color:${css(c)}">${t}</div>`;   // a hero of two (the twins): both kits, each under its own name
    $('dabl').innerHTML = inn + (def.alt ? sub(def.altNames[0], col) + abl(def.abilities, col) + sub(def.altNames[1], def.pal.glow) + abl(def.alt, def.pal.glow) : abl(def.abilities, col));
    $('gohero').innerHTML = `Герой: <b style="color:${css(col)}">${def.name}</b>`;
    for (const it of ITEMS) $('cat-' + it.id).classList.toggle('rec', build.includes(it.id));
    this.renderRec('cat-', def, null); this.setPreview(def); if (typeof PROF !== 'undefined') PROF.syncFav();
  },
  // world point under a screen position, if that position is over the minimap
  mmAt(cx, cy) { const r = $('mmc').getBoundingClientRect(); if (!r.width || cx < r.left || cx > r.right || cy < r.top || cy > r.bottom) return null; return { x: (cx - r.left) / r.width * 200 - 100, z: (cy - r.top) / r.height * 200 - 100 }; },
  buildMinimapBg() {
    const c = document.createElement('canvas'); c.width = c.height = 206; const g = c.getContext('2d'), im = g.createImageData(206, 206), D = im.data;
    for (let j = 0; j < 206; j++) for (let i = 0; i < 206; i++) {
      const x = i / 206 * 200 - 100, z = j / 206 * 200 - 100, d = walkDist(x, z), k = (j * 206 + i) * 4; let r = 17, gg = 20, b = 25;
      if (d > 0.3) { if (WD.river >= d - 0.01 && WD.lane < 1) { r = 30; gg = 56; b = 66; } else if (WD.lane >= d - 0.01 || WD.base >= d - 0.01) { r = 70; gg = 66; b = 62; } else { r = 44; gg = 54; b = 48; } }
      else if (d > -1.2) { r = 30; gg = 33; b = 39; }
      D[k] = r; D[k + 1] = gg; D[k + 2] = b; D[k + 3] = 255;
    }
    g.putImageData(im, 0, 0); this.mmBg = c;
  },
  resize(W, H, dpr) { this.W = W; this.H = H; const ov = $('ov'); if (!this.ctx) this.ctx = ov.getContext('2d'); ov.width = Math.round(W * dpr); ov.height = Math.round(H * dpr); this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); },
  /* ----- HUD lifecycle ----- */
  showHUD() {
    const P = G.player, col = css(P.def.look.glow), keys = 'qwer';
    $('menu').hidden = true; $('hud').hidden = false; $('end').hidden = true; $('dead').hidden = true; $('feed').innerHTML = ''; $('chat').innerHTML = ''; $('help').hidden = false;
    this.closeNote(); $('porimg').src = this.portraits[P.def.id] || ''; $('bar').style.setProperty('--hc', col);
    const abs = $('abs'); abs.innerHTML = '';
    if (P.def.innate) {   // innate passive: always on, no levels
      const n = P.def.innate, s = document.createElement('div'); s.className = 'slot pas inn'; s.id = 'abI'; s.innerHTML = `<img src="${iconURL(n.icon, P.def.look.glow)}" alt=""><div class="cdt num"></div>`;
      s.onmouseenter = e => this.tip(e, `<b>${n.name}</b><small>врождённая · действует всегда</small>${n.desc}`); s.onmouseleave = () => this.tip(); abs.appendChild(s);
      if (P.def.swap) {   // the twins: the innate slot is also the swap button (and shows its key)
        s.classList.add('swp'); s.insertAdjacentHTML('beforeend', `<div class="cdo"></div><kbd data-k="swap">${kl('swap')}</kbd>`); s.onclick = () => { if (!G.paused && G.player) G.player.def.swap(G.player, true); };
      }
    }
    for (let i = 0; i < 4; i++) {
      const a = P.def.abilities[i], s = document.createElement('div'); s.className = 'slot' + (a ? (a.passive ? ' pas' : '') : ' off'); s.id = 'ab' + i;
      if (a) {
        s.innerHTML = `<img src="${iconURL(a.icon, a.iconCol || P.def.look.glow)}" alt=""><div class="cdo"></div><div class="cdt num"></div><kbd data-k="${keys[i]}">${kl(keys[i])}</kbd><span class="cost num">${a.cost || ''}</span><span class="pips">${'<i></i>'.repeat(abMax(i))}</span><button type="button" class="lvlup" aria-label="Повысить уровень умения">+</button>`;
        s.querySelector('.lvlup').onclick = e => { e.stopPropagation(); learnAbility(i); };
        s.onmouseenter = e => this.tip(e, this.abTip(G.player, i)); s.onmouseleave = () => this.tip();
      } else s.innerHTML = `<div class="cdo"></div><div class="cdt num"></div><kbd data-k="${keys[i]}">${kl(keys[i])}</kbd>`;
      abs.appendChild(s);
    }
    const rc = document.createElement('div'); rc.className = 'slot'; rc.id = 'abB'; rc.innerHTML = `<img src="${iconURL('pillar', 0x9fb4d8)}" alt=""><div class="cdo"></div><div class="cdt num"></div><kbd data-k="recall">${kl('recall')}</kbd>`;
    rc.onmouseenter = e => this.tip(e, '<b>Возврат</b><small>4.5 сек подготовки</small>Телепорт на базу. Свой приказ просто отменяет его. Если же его сорвёт урон или оглушение от героя или башни, телепорт уходит на перезарядку: 15 сек. Миньоны и лесные звери телепорт не срывают.'); rc.onmouseleave = () => this.tip(); rc.onclick = () => this.recall();
    abs.appendChild(rc);
    const build = BUILDS[P.def.build]; for (const it of ITEMS) $('buy-' + it.id).classList.toggle('rec', build.includes(it.id));
    this.shopTab('buy-', 'rec'); this.refreshInv(); this.lastCd = [0, 0, 0, 0]; this.lastAl = [-1, -1, -1, -1]; this.shopOpen = false; $('shop').hidden = true;
    this.announce('Линия: ' + LANE_RU[G.pLane || 'top'] + (G.pMate ? ' · роль: ' + (G.pRole === 'sup' ? 'поддержка' : 'урон') + ' · напарник: ' + G.pMate.name : ' · вы один'), '#ecc56f');
    this.msg('Изучите первое умение: кнопка «+» над иконкой или Shift + клавиша умения'); this.msgT = 6;
  },
  // tooltip of an ability slot: current level and what the next one needs
  abTip(P, i) {
    const a = P.def.abilities[i], lv = P.al[i], mx = abMax(i), kind = a.passive ? 'пассивная' : (a.toggle ? 'включается и выключается' : a.cd + ' сек · ' + (a.costText || a.cost + ' маны'));
    const nx = lv >= mx ? 'Максимальный уровень' : (P.level >= abReq(i, lv + 1) ? (P.sp > 0 ? 'Можно повысить: Shift+' + kl('qwer'[i]) : 'Повышается за очко умений') : 'Следующий уровень — с ' + abReq(i, lv + 1) + ' уровня героя');
    return `<b>${a.name}</b><small>Уровень ${lv} из ${mx} · ${kind}</small>${a.desc}<small style="display:block;margin-top:5px">${nx}</small>`;
  },
  onLearn(i) { const el = $('ab' + i); if (el) { el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); } this.tip(); },
  // HUD inventory (right click sells) and the larger copy inside the shop (click sells)
  refreshInv() {
    const P = G.player;
    for (const [box, big] of [[$('inv'), false], [$('shopinv'), true]]) {
      box.innerHTML = '';
      for (let i = 0; i < 6; i++) {
        const d = document.createElement(big ? 'button' : 'div'); d.className = 'it'; if (big) d.type = 'button'; const id = P.items[i];
        if (id) {
          const it = ITEM[id]; d.style.setProperty('--cc', css(CAT_COL[it.cat]));
          d.innerHTML = `<img src="${iconURL(it.icon, CAT_COL[it.cat])}" alt="${it.name}">` + (big ? `<small class="num">+${sellPrice(P, i)}</small>` : (it.active ? `<div class="cdo"></div><div class="cdt num"></div><kbd>${i + 1}</kbd>` : ''));
          if (!big && it.active) { d.classList.add('act'); d.onclick = () => { if (!this.ateClick()) this.useItem(i); }; }
          d.onmouseenter = e => { if (!this.dragging) this.tip(e, `<b>${it.name}</b><small>${it.cost} з · продажа за ${sellPrice(P, i)} з${it.active && !big ? ' · применить: клавиша ' + (i + 1) + ' или щелчок' : ''}</small>${it.desc}`); }; d.onmouseleave = () => this.tip();
          const sell = e => { e.preventDefault(); if (this.ateClick()) return; if (sellItem(G.player, i)) { SFX.play('coin'); this.tip(); this.refreshInv(); } else this.msg('Продавать можно на базе или пока вы мертвы'); };
          d.oncontextmenu = sell; if (big) d.onclick = sell;
          d.classList.add('dg'); d.firstChild.draggable = false;
          d.onmousedown = e => { if (e.button === 0) this.dragStart(e, box, i); };
        } else if (big) d.disabled = true;
        box.appendChild(d);
      }
    }
    // the stash: bought away from the base, delivered at the fountain; a click returns an item for its full price
    const sn = (P.stash || []).length, sb = $('stashb'), sbox = $('shopstash');
    sb.hidden = !sn; sb.textContent = '+' + sn;
    sb.onmouseenter = e => this.tip(e, `<b>Склад: ${sn} из ${STASH_MAX}</b><small>придёт в инвентарь у фонтана · вернуть покупку можно в магазине</small>${(P.stash || []).map(id => ITEM[id].name).join(', ')}`); sb.onmouseleave = () => this.tip();
    sbox.hidden = !sn; sbox.lastElementChild.innerHTML = '';
    (P.stash || []).forEach((id, i) => {
      const it = ITEM[id], d = document.createElement('button'); d.type = 'button'; d.className = 'it'; d.style.setProperty('--cc', css(CAT_COL[it.cat]));
      d.innerHTML = `<img src="${iconURL(it.icon, CAT_COL[it.cat])}" alt="${it.name}"><small class="num">+${it.cost}</small>`;
      d.onmouseenter = e => this.tip(e, `<b>${it.name}</b><small>на складе · нажмите, чтобы вернуть за ${it.cost} з</small>${it.desc}`); d.onmouseleave = () => this.tip();
      d.onclick = () => { if (unstashItem(G.player, i)) { SFX.play('coin'); this.tip(); this.refreshInv(); } };
      sbox.lastElementChild.appendChild(d);
    });
    this.renderRec('buy-', P.def, P); this.shopT = 0;
  },
  onStash(n) { this.refreshInv(); SFX.play('buy'); this.msg(n === 1 ? 'Предмет со склада получен' : 'Предметы со склада получены: ' + n); },
  // Dragging an item to another slot, done with mouse events: the launcher's WebView2 swallows the browser's own drag and drop.
  // Onto another item the two swap, onto an empty slot it moves to the end.
  dragStart(e, box, i) {
    e.preventDefault();
    const sx = e.clientX, sy = e.clientY, src = box.children[i]; let ghost = null;
    const slotAt = (x, y) => { const el = document.elementFromPoint(x, y), s = el && el.closest && el.closest('.it'); return s && s.parentElement === box ? [...box.children].indexOf(s) : -1; };
    const move = ev => {
      if (!ghost) {
        if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 5) return;
        this.dragging = true; this.tip(); src.classList.add('drag');
        ghost = src.querySelector('img').cloneNode(); ghost.className = 'dragghost'; document.body.appendChild(ghost);
      }
      ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px';
      const j = slotAt(ev.clientX, ev.clientY); [...box.children].forEach((o, k) => o.classList.toggle('over', k === j && j !== i));
    };
    const up = ev => {
      removeEventListener('mousemove', move, true); removeEventListener('mouseup', up, true);
      if (!ghost) return;
      ghost.remove(); this.dragging = false; this.dragEnd = performance.now();
      for (const o of box.children) o.classList.remove('over', 'drag');
      const j = slotAt(ev.clientX, ev.clientY);
      if (j >= 0 && j !== i && moveItem(G.player, i, j)) { SFX.play('ui'); this.refreshInv(); }
    };
    addEventListener('mousemove', move, true); addEventListener('mouseup', up, true);
  },
  // the click that ends a drag must not also use or sell the item
  ateClick() { return performance.now() - (this.dragEnd || 0) < 250; },
  // the recall key or its HUD slot
  recall() {
    const P = G.player; if (P && P.dead && P.def.buyback && !G.paused && !G.over) { P.def.buyback(P); return; }   // Wлад: the same key buys his life back
    if (!P || P.dead || G.paused || G.over) return;
    if (P.inBase) this.msg('Вы уже на базе'); else if (P.recallCd > G.time) { this.msg('Телепорт перезаряжается: ' + Math.ceil(P.recallCd - G.time) + ' сек'); SFX.play('deny'); } else startRecall(P);
  },
  // use the item in HUD slot i (number key or a click on the slot)
  useItem(i) {
    const P = G.player; if (!P || G.paused || G.over) return; const r = useItem(P, i, { x: G.mx, z: G.mz });
    if (r === 'ok') return; if (r === 'none') return;
    this.msg(r === 'cd' ? 'Предмет перезаряжается' : (r === 'tgt' ? 'Сейчас это некому применить' : 'Сейчас нельзя применить предмет')); SFX.play('deny');
  },
  tip(e, html) { const t = $('tip'); if (!e) { t.hidden = true; return; } t.innerHTML = html; t.hidden = false; const r = e.currentTarget.getBoundingClientRect(); t.style.left = clamp(r.left, 8, innerWidth - 300) + 'px'; t.style.top = 'auto'; t.style.bottom = (innerHeight - r.top + 8) + 'px'; },
  /* ----- the notebook: a list of enemy heroes to pick a name from (an ability with ind.type 'note') ----- */
  toggleNote() { if (this.noteOpen) this.closeNote(); else { this.noteOpen = true; this.noteT = 0; $('note').hidden = false; this.renderNote(); SFX.play('ui'); } },
  closeNote() { this.noteOpen = false; $('note').hidden = true; },
  noteList() { const P = G.player; return G.heroes.filter(o => o.team !== P.team); },
  renderNote() {
    const P = G.player, box = $('noterows'); box.innerHTML = '';
    this.noteList().forEach((o, i) => {
      const b = document.createElement('button'), kn = typeof hikKnown === 'function' ? hikKnown(P, o) : 0, k = kn ? Math.max(1, Math.ceil(o.name.length * kn / 4)) : 0; b.type = 'button'; b.className = 'nrow'; b.disabled = !o.alive;
      b.innerHTML = `<kbd>${i + 1}</kbd><img src="${this.portraits[o.def.id] || ''}" alt=""><div><b><u>${o.name.slice(0, k)}</u>${o.name.slice(k)}</b><span><i style="width:${o.alive ? clamp(o.hp / o.maxHp * 100, 0, 100) : 0}%"></i></span></div><em>${o.alive ? (kn ? 'букв: ' + kn + ' · +' + kn * 10 + '%' : Math.round(o.hp) + ' зд.') : 'мёртв'}</em>`;
      b.onclick = () => this.pickNote(i); box.appendChild(b);
    });
  },
  pickNote(i) {
    const P = G.player, o = this.noteList()[i]; if (!o || !this.noteOpen) return;
    if (!o.alive) { this.msg('Этот герой сейчас мёртв'); SFX.play('deny'); return; }
    if (!canCast(3)) { this.closeNote(); return; }
    if (castAbility(P, 3, { x: o.x, z: o.z, unit: o })) this.closeNote();
  },
  msg(s) { const m = $('msg'); m.textContent = s; m.classList.add('show'); this.msgT = 1.6; },
  announce(text, color) { const a = $('ann'); a.textContent = text; a.style.color = color || '#fff'; a.classList.remove('show'); void a.offsetWidth; a.classList.add('show'); },
  feed(html, cls) { const chat = cls === 'chat', f = $(chat ? 'chat' : 'feed'), d = document.createElement('div'); d.innerHTML = html; if (cls) d.className = cls; f.appendChild(d); while (f.children.length > (chat ? 7 : 5)) f.removeChild(f.firstChild); setTimeout(() => { if (d.parentNode) d.parentNode.removeChild(d); }, chat ? 9000 : 6500); },   // calls, answers and hero talk go to the chat on the left, kills stay top right
  // a line said by a hero (the talk between rivals): name in his colour, the words in quotes
  say(h, text) { if (!G.player) return; this.feed(`<b style="color:${css(h.def.look.glow)}">${esc(h.name)}</b>: <span class="said">«${esc(text)}»</span>`, 'chat'); },
  flashWarn() { const w = $('warn'); w.classList.add('on'); setTimeout(() => w.classList.remove('on'), 60); },
  onKill(killer, v, src) {
    const P = G.player, nm = u => `<b style="color:${TEAM_CSS[u.team]}">${u.name}</b>`;
    if (killer && killer.team === v.team) { this.feed(`${nm(killer)} <span style="color:#8b94a4">${killer.madT > G.time ? 'в киберпсихозе убил своего:' : 'добил обезумевшего'}</span> ${nm(v)}`); if (v === P) SFX.play('death'); return; }
    const by = killer ? nm(killer) : (src && src.struct ? `<b style="color:${TEAM_CSS[src.team]}">Башня</b>` : '<b>Миньоны</b>');
    this.feed(`${by} <span style="color:#8b94a4">сразил</span> ${nm(v)}`);
    if (v === P) SFX.play('death');
    else if (killer === P) { const m = P.multi || 1; this.announce(m >= 4 ? 'БОЙНЯ!' : m === 3 ? 'ТРОЙНОЕ УБИЙСТВО' : m === 2 ? 'ДВОЙНОЕ УБИЙСТВО' : (!G.firstBlood ? 'ПЕРВАЯ КРОВЬ' : 'ВРАГ ПОВЕРЖЕН'), '#ecc56f'); SFX.play('kill'); }
    else if (!G.firstBlood) this.announce('ПЕРВАЯ КРОВЬ', v.team === P.team ? '#ff6a5e' : '#5aa7ff');
    G.firstBlood = true;
  },
  onTower(t) { const mine = t.team === G.player.team; this.announce(mine ? 'Ваша башня разрушена' : 'Вражеская башня разрушена', mine ? '#ff6a5e' : '#5aa7ff'); this.feed(`<span style="color:${TEAM_CSS[t.team]}">Башня (${LANE_RU[t.lane].toLowerCase()})</span> разрушена`); },
  toggleShop(on) {
    on = on === undefined ? !this.shopOpen : on; this.shopOpen = on; $('shop').hidden = !on; this.tip(); if (on) { SFX.play('ui'); this.shopT = 0; }
  },
  showScore(on) {
    if (on && G.state === 'play') $('scoreb').innerHTML = this.table();
    $('score').hidden = !on || G.state !== 'play';
  },
  table() {
    const row = h => `<tr class="${h.isPlayer ? 'me' : ''}"><td class="t${h.team}">${h.name}${h.isPlayer ? ' (' + esc(PROF.name()) + ')' : ''} <small style="color:#5d6676">${h.def.roleName}</small></td><td>${h.level}</td><td>${h.kills} / ${h.deaths} / ${h.assists}</td><td>${h.cs}</td><td>${Math.round(h.goldTotal)}</td><td>${Math.round(h.dmgDealt / 100) / 10}к</td><td>${h.items.length}</td></tr>`;
    const hs = G.heroes.slice().sort((a, b) => a.team - b.team || b.kills - a.kills);
    return `<table class="sb num"><tr><th>Герой</th><th>Ур.</th><th>У / С / П</th><th>Миньоны</th><th>Золото</th><th>Урон</th><th>Предм.</th></tr>${hs.map(row).join('')}</table>`;
  },
  showEnd() {
    const win = G.winner === G.player.team; $('end').hidden = false; $('shop').hidden = true; $('score').hidden = true; $('dead').hidden = true;
    const t = $('endt'); t.textContent = win ? 'ПОБЕДА' : 'ПОРАЖЕНИЕ'; t.className = win ? 'win' : 'lose';
    const m = Math.floor(G.time / 60), s = Math.floor(G.time % 60);
    $('endsub').textContent = `Длительность ${m}:${String(s).padStart(2, '0')} · счёт ${G.teams[0].kills} : ${G.teams[1].kills}${G.surrender ? ' · вы сдались' : ''}`;
    // the rest of the screen is the match report (overview, table, graphs, damage, timeline, «my match»): the same view the profile opens later
    const P = G.player; this.record(); const res = G.ranked && G.ranked.res; $('endrk').innerHTML = (PROF.fresh.length ? '<div class="achnew">' + PROF.fresh.map(a => '<span><b>Достижение:</b> ' + esc(a.name) + ' <small>титул «' + esc(a.title) + '»</small></span>').join('') + '</div>' : '') + (res ? RANKED.endHTML(res) + (SAVE.state !== 'cloud' && !SAVE.localOk && !SAVE.idbOk ? '<p class="rolenote" style="color:#ff9a8e">Этот браузер не даёт игре сохранять данные — рейтинг пропадёт при закрытии вкладки. Сохраните «код прогресса» (профиль на главном экране).</p>' : '') : '');
    const box = $('endrep'); box.dataset.tab = 'ov'; delete box.dataset.dh; delete box.dataset.tf; delete box.dataset.gm;
    if (G.report) REP.render(box, G.report); else box.innerHTML = '';
    SFX.play(win ? 'victory' : 'defeat'); if (G.report && G.report.mvp === G.report.me) setTimeout(() => SFX.play('mvp'), 1100);
  },
  // the match is over: career figures and the ranked result are written once, at the moment the crystal falls (a match driven by a test bot is not counted)
  record() {
    const P = G.player; if (!P || G.recorded) return; G.recorded = true; G.report = REP.finish(); if (P.ai || G.sandbox) return;
    const win = G.winner === P.team, R = matchRatings(), me = R.find(r => r.h === P), pr = PROFILE, hs = pr.heroes[P.def.id] || (pr.heroes[P.def.id] = { g: 0, w: 0 });
    pr.games++; hs.g++; if (win) { pr.wins++; hs.w++; } if (R[0].h === P) pr.mvp++; pr.kills += P.kills; pr.deaths += P.deaths; pr.assists += P.assists;
    if (G.ranked && typeof RANKED !== 'undefined') RANKED.settle(win, me ? me.score : 5, !!G.surrender);   // settle saves too
    if (G.report) REP.save(G.report);
    PROF.onMatch(P, win, me, R, G.report ? G.report.id : 0);
    SAVE.touch(); this.showProfile();
  },
  /* ----- per-frame ----- */
  update(dt) {
    if (G.state !== 'play') { this.ctx.clearRect(0, 0, this.W, this.H); return; }
    const P = G.player;
    if (this.msgT > 0) { this.msgT -= dt; if (this.msgT <= 0) $('msg').classList.remove('show'); }
    $('kb').textContent = G.teams[0].kills; $('kr').textContent = G.teams[1].kills; $('twb').textContent = G.teams[0].towers + ' башен'; $('twr').textContent = G.teams[1].towers + ' башен';
    const mm = Math.floor(G.time / 60), ss = Math.floor(G.time % 60); $('tm').textContent = String(mm).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
    $('hpb').style.width = clamp(P.hp / P.maxHp * 100, 0, 100) + '%'; $('hpt').textContent = Math.ceil(Math.max(0, P.hp)) + ' / ' + Math.round(P.maxHp) + (P.shield > 1 ? '  +' + Math.round(P.shield) : '');
    $('mpb').style.width = clamp(P.mana / P.maxMana * 100, 0, 100) + '%'; $('mpt').textContent = Math.floor(P.mana) + ' / ' + Math.round(P.maxMana);
    $('xpb').style.width = (P.level >= MAX_LVL ? 100 : P.xp / xpNeed(P.level) * 100) + '%'; $('lvl').textContent = P.level;
    $('goldt').textContent = Math.floor(P.gold) + ' з';
    const can = canShop(P), nx = this.shops['buy-'].next; $('shopb').classList.toggle('can', can && P.items.length < 6 && (nx ? nx.cost <= P.gold : P.gold >= 1250));
    for (let i = 0; i < 4; i++) {
      const a = P.def.abilities[i]; if (!a) continue;
      const el = $('ab' + i), lv = P.al[i]; el.classList.toggle('canlvl', canLearn(P, i));
      if (this.lastAl[i] !== lv) { this.lastAl[i] = lv; const pp = el.children[5].children; for (let k = 0; k < pp.length; k++) pp[k].classList.toggle('on', k < lv); }
      if (a.passive) { el.classList.toggle('lock', !lv); el.children[2].textContent = a.count ? (a.count(P) || '') : ''; continue; }
      const cd = P.cd[i], lock = !lv, full = a.cd * 100 / (100 + P.haste), free = a.free ? a.free(P) : false, poor = !free && P.mana < a.cost;
      el.children[1].style.height = (cd > 0 ? clamp(cd / full, 0, 1) * 100 : 0) + '%'; el.children[2].textContent = lock ? '' : (cd > 0 ? (cd < 1 ? cd.toFixed(1) : Math.ceil(cd)) : '');
      el.classList.toggle('lock', lock); el.classList.toggle('nomana', !lock && cd <= 0 && poor); el.classList.toggle('ready', !lock && cd <= 0 && !poor); el.classList.toggle('aim', G.aim === i); el.classList.toggle('again', !!free || !!(a.active && a.active(P)));
      if (this.lastCd[i] > 0 && cd <= 0) { el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }
      this.lastCd[i] = cd;
    }
    if (P.def.innate && P.def.innate.count) $('abI').children[1].textContent = P.def.innate.count(P);
    if (G.sandbox) { const S = G.sandbox, on = G.time - S.last < 3, tt = Math.max(0.5, S.last - S.t0), dps = S.dmg / tt; if (on && S.hit > 1) S.peak = Math.max(S.peak, dps); $('sbx-num').innerHTML = `Урон по мишеням: <b>${Math.round(S.dmg)}</b> · в секунду: <b>${S.hit > 1 ? Math.round(dps) : '—'}</b> · лучший: <b>${Math.round(S.peak)}</b>`; }
    // cooldowns of usable items in the HUD inventory
    const inv = $('inv').children; for (let i = 0; i < inv.length; i++) { const el = inv[i], it = P.items[i] && ITEM[P.items[i]]; if (!it || !it.active || el.children.length < 4) continue; const cd = Math.max(0, (P.icd[it.id] || 0) - G.time); el.children[1].style.height = clamp(cd / it.active.cd, 0, 1) * 100 + '%'; el.children[2].textContent = cd > 0 ? Math.ceil(cd) : ''; el.classList.toggle('rdy', cd <= 0 && !P.dead); }
    if (this.noteOpen) { this.noteT -= dt; if (P.dead || P.cd[3] > 0 || P.note) this.closeNote(); else if (this.noteT <= 0) { this.noteT = 0.25; this.renderNote(); } }
    const rb = $('abB'), rcd = Math.max(0, (P.recallCd || 0) - G.time); rb.children[1].style.height = (P.recall > 0 ? P.recall / 4.5 * 100 : rcd / RECALL_CD * 100) + '%'; rb.children[2].textContent = P.recall > 0 ? P.recall.toFixed(1) : (rcd > 0 ? Math.ceil(rcd) : ''); rb.classList.toggle('nomana', rcd > 0 && !(P.recall > 0));
    $('st').innerHTML = `<span>Атака <b>${Math.round(P.ad)}</b></span><span>Умения <b>${Math.round(P.ap)}</b></span><span>Защита <b>${Math.round(P.arm)}</b></span><span>Ск.атаки <b>${P.as.toFixed(2)}</b></span><span>Скорость <b>${P.ms.toFixed(1)}</b></span><span>Ускор. <b>${P.haste}</b></span>`;
    $('dead').hidden = !P.dead || G.over; if (P.dead) $('deadt').textContent = 'Возрождение через ' + Math.ceil(P.respawnT) + ' сек · можно открыть магазин (' + kl('shop') + ')';
    { const bb = $('buyb'), on = P.dead && !!P.def.buyInfo; if (bb.hidden !== !on) bb.hidden = !on;
      if (on) { const s = P.def.buyInfo(P); if (bb.textContent !== s.text) bb.textContent = s.text; bb.disabled = !s.ok; if (!bb.onclick) bb.onclick = () => { const Q = G.player; if (Q && Q.dead && Q.def.buyback) Q.def.buyback(Q); }; } }
    if (this.shopOpen) { this.shopT -= dt; if (this.shopT <= 0) { this.shopT = 0.2; this.refreshShop(); } }
    this.drawOverlay(); this.drawMinimap();
  },
  proj(x, y, z) { const v = this.v.set(x, y, z).project(G.camera); if (v.z > 1) return null; return { x: (v.x * 0.5 + 0.5) * this.W, y: (-v.y * 0.5 + 0.5) * this.H }; },
  drawOverlay() {
    const g = this.ctx, W = this.W, H = this.H, P = G.player; g.clearRect(0, 0, W, H);
    for (const u of G.units) {
      if (!u.alive || u.gone) continue; if (Math.abs(u.x - G.camX) > 50 || Math.abs(u.z - G.camZ) > 46) continue;
      if (u.kind === 'monster' && !u.boss && u.hp >= u.maxHp) continue;
      const p = this.proj(u.x, u.height + 0.5 + (u.yOff || 0), u.z); if (!p || p.x < -60 || p.x > W + 60 || p.y < -20 || p.y > H + 20) continue;
      const hero = u.kind === 'hero', w = hero ? 78 : (u.struct ? 96 : (u.boss ? 120 : (u.kind === 'monster' ? 44 : 32))), hh = hero ? 9 : (u.struct || u.boss ? 7 : 4), x = Math.round(p.x - w / 2), y = Math.round(p.y - hh - (hero ? 8 : 0));
      const foe = u.team !== P.team || (!u.struct && (u.madT > G.time || P.madT > G.time));   // in a cyberpsychosis everyone is drawn as an enemy
      const col = u === P ? '#7be08a' : (u.team === 2 ? '#d6b85a' : (!foe ? (hero ? '#4f9dff' : '#3f7fd0') : (hero ? '#ff5548' : '#d1463c')));
      g.fillStyle = 'rgba(6,8,12,.86)'; g.fillRect(x - 1, y - 1, w + 2, hh + 2 + (hero ? 4 : 0));
      const tot = u.maxHp + (u.shield || 0), f = clamp(u.hp / tot, 0, 1);
      g.fillStyle = u.struct && u.protected ? '#6b7280' : col; g.fillRect(x, y, w * f, hh);
      if (u.shield > 0) { g.fillStyle = '#e8edf5'; g.fillRect(x + w * f, y, w * clamp(u.shield / tot, 0, 1 - f), hh); }
      if (hero) {
        g.fillStyle = 'rgba(6,8,12,.55)'; for (let t = 250; t < tot; t += 250) g.fillRect(x + w * t / tot, y, 1, hh);
        g.fillStyle = '#4a8be0'; g.fillRect(x, y + hh + 1, w * clamp(u.mana / u.maxMana, 0, 1), 3);
        g.fillStyle = 'rgba(6,8,12,.9)'; g.fillRect(x - 17, y - 2, 15, hh + 6); g.fillStyle = '#ecc56f'; g.font = "11px 'Russo One',sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(u.level, x - 9.5, y + hh / 2 + 1.5);
        g.font = "600 11px 'Exo 2',sans-serif"; g.fillStyle = u === P ? '#bff5c8' : '#dfe3ea'; g.strokeStyle = 'rgba(0,0,0,.8)'; g.lineWidth = 3; g.strokeText(u.name, p.x, y - 9); g.fillText(u.name, p.x, y - 9);
        if (u.aegisT > G.time) { g.fillStyle = '#c9a8ff'; g.font = "13px 'Russo One',sans-serif"; g.strokeText('◆', x + w + 9, y + hh / 2 + 1); g.fillText('◆', x + w + 9, y + hh / 2 + 1); g.font = "600 11px 'Exo 2',sans-serif"; }   // carries the Aegis of the Rift
        // a notebook entry: the countdown over the victim, and over the writer who must not be touched until it runs out
        const nm = u.noteMark && u.noteMark.until > G.time ? u.noteMark : null, wr = !nm && u.noteT > G.time;
        if (nm || wr) { const s = nm ? '✎ ' + (nm.until - G.time).toFixed(1) : 'пишет · ' + (u.noteT - G.time).toFixed(1), yy = y - (u.stunned || u.rooted || u.silenced ? 35 : 22); g.font = "13px 'Russo One',sans-serif"; g.fillStyle = nm ? '#ff4a5a' : '#e8e2d0'; g.strokeText(s, p.x, yy); g.fillText(s, p.x, yy); g.font = "600 11px 'Exo 2',sans-serif"; }
        if (u.stunned || u.rooted || u.silenced) { g.fillStyle = '#ffe27a'; g.strokeText(u.stunned ? 'ОГЛУШЁН' : (u.rooted ? 'СКОВАН' : 'БЕЗМОЛВИЕ'), p.x, y - 22); g.fillText(u.stunned ? 'ОГЛУШЁН' : (u.rooted ? 'СКОВАН' : 'БЕЗМОЛВИЕ'), p.x, y - 22); }
      } else if (u.boss) { g.font = "600 12px 'Exo 2',sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#d9c2ff'; g.strokeStyle = 'rgba(0,0,0,.8)'; g.lineWidth = 3; g.strokeText(u.name, p.x, y - 10); g.fillText(u.name, p.x, y - 10); }
    }
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,.85)';
    for (const t of FX.texts) {
      const p = this.proj(t.x, t.y, t.z); if (!p) continue; const k = t.t / t.life;
      g.globalAlpha = k < 0.7 ? 1 : (1 - k) / 0.3; g.font = `${Math.round(t.size * (k < 0.12 ? 1.5 - k * 4 : 1))}px 'Russo One',sans-serif`; g.fillStyle = t.color; g.strokeText(t.str, p.x, p.y); g.fillText(t.str, p.x, p.y);
    }
    g.globalAlpha = 1;
  },
  drawMinimap() {
    this.feedN++; if (this.feedN % 2) return;
    const g = this.mctx, S = 206, P = G.player, mx = x => (x + 100) / 200 * S; g.drawImage(this.mmBg, 0, 0);
    for (const u of G.units) {
      if (!u.alive) continue; const x = mx(u.x), y = mx(u.z);
      if (u.kind === 'minion' || u.kind === 'summon') { g.fillStyle = u.kind === 'summon' ? '#a060ff' : TEAM_CSS[u.team]; g.fillRect(x - 1, y - 1, 2.5, 2.5); }
      else if (u.kind === 'monster') { g.fillStyle = u.boss ? '#b07bff' : '#c9b36b'; const s = u.boss ? 4 : (u.mtype === 'big' ? 2.5 : 0); if (s) { g.beginPath(); g.arc(x, y, s, 0, TAU); g.fill(); } }
      else if (u.struct) { g.fillStyle = TEAM_CSS[u.team]; g.strokeStyle = '#0a0c11'; g.lineWidth = 1; const s = u.kind === 'core' ? 6 : 4; g.save(); g.translate(x, y); g.rotate(Math.PI / 4); g.fillRect(-s, -s, s * 2, s * 2); g.strokeRect(-s, -s, s * 2, s * 2); g.restore(); }
    }
    if (G.rune && G.rune.active) { g.fillStyle = '#7dffc8'; g.beginPath(); g.arc(mx(RUNE_POS.x), mx(RUNE_POS.z), 3, 0, TAU); g.fill(); }
    for (const h of G.heroes) { if (!h.alive) continue; const x = mx(h.x), y = mx(h.z); g.fillStyle = h === P ? '#eafff0' : TEAM_CSS[h.team]; g.strokeStyle = h === P ? '#2f9e4a' : '#0a0c11'; g.lineWidth = h === P ? 2.5 : 1.5; g.beginPath(); g.arc(x, y, h === P ? 5 : 4.2, 0, TAU); g.fill(); g.stroke(); }
    // global abilities on their way: a path with the projectile on it, or the area about to be hit
    if (G.mmFx) for (let i = G.mmFx.length - 1; i >= 0; i--) {
      const m = G.mmFx[i]; if (G.time > m.until) { G.mmFx.splice(i, 1); continue; } const bl = 0.55 + 0.45 * Math.sin(G.time * 12); g.strokeStyle = m.color; g.fillStyle = m.color;
      if (m.line) { g.globalAlpha = 0.3 + 0.25 * bl; g.lineWidth = 3; g.beginPath(); g.moveTo(mx(m.x), mx(m.z)); g.lineTo(mx(m.x2), mx(m.z2)); g.stroke(); g.globalAlpha = 1; if (m.ox !== undefined) { g.beginPath(); g.arc(mx(m.ox), mx(m.oz), 4.5, 0, TAU); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 1; g.stroke(); } }
      else { g.globalAlpha = 0.22 + 0.2 * bl; g.beginPath(); g.arc(mx(m.x), mx(m.z), m.r / 200 * S, 0, TAU); g.fill(); g.globalAlpha = 1; g.lineWidth = 1.5; g.stroke(); }
    }
    // a global ability being aimed: preview it on the minimap
    const gab = G.aim >= 0 && P && !P.dead ? P.def.abilities[G.aim] : null, gl = !!(gab && gab.global); if (gl !== this.mmAim) { this.mmAim = gl; $('mm').classList.toggle('aimg', gl); }
    if (gl) {
      const ap = aimPoint(gab), col = css(P.def.look.glow); g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 2;
      if (gab.ind.type === 'line') { const a = angTo(P.x, P.z, ap.x, ap.z); g.globalAlpha = 0.85; g.beginPath(); g.moveTo(mx(P.x), mx(P.z)); g.lineTo(mx(P.x + Math.sin(a) * 300), mx(P.z + Math.cos(a) * 300)); g.stroke(); }
      else { g.globalAlpha = 0.35; g.beginPath(); g.arc(mx(ap.x), mx(ap.z), Math.max(3, gab.ind.r / 200 * S), 0, TAU); g.fill(); g.globalAlpha = 1; g.stroke(); }
      g.globalAlpha = 1;
    }
    g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 1; const vw = 56 * G.zoom, vh = 36 * G.zoom; g.strokeRect(mx(G.camX) - vw / 2 / 200 * S, mx(G.camZ - 2) - vh / 2 / 200 * S, vw / 200 * S, vh / 200 * S);
  }
};
