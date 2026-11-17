'use strict';
/* ===== core: math, shared state, geometry utils, procedural audio ===== */
const TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : (v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => b === undefined ? Math.random() * (a === undefined ? 1 : a) : a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const dist = (ax, az, bx, bz) => Math.hypot(bx - ax, bz - az);
const udist = (a, b) => Math.hypot(b.x - a.x, b.z - a.z);
const angTo = (ax, az, bx, bz) => Math.atan2(bx - ax, bz - az);
const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
const easeOut = t => 1 - (1 - t) * (1 - t);
const easeOut3 = t => 1 - Math.pow(1 - t, 3);
const smooth = t => t * t * (3 - 2 * t);
function hash2(x, y) { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); }
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), u = smooth(x - xi), v = smooth(y - yi);
  return lerp(lerp(hash2(xi, yi), hash2(xi + 1, yi), u), lerp(hash2(xi, yi + 1), hash2(xi + 1, yi + 1), u), v);
}
function fbm(x, y) { return vnoise(x, y) * 0.6 + vnoise(x * 2.1 + 5, y * 2.1 + 9) * 0.3 + vnoise(x * 4.3 + 1, y * 4.3 + 4) * 0.1; }
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

/* key bindings: action -> KeyboardEvent.code, or 'Mouse1' (wheel button) / 'Mouse3' / 'Mouse4' (side buttons).
   Saved per browser; the game works the same if storage is unavailable */
const BIND_DEF = { q: 'KeyQ', w: 'KeyW', e: 'KeyE', r: 'KeyR', recall: 'KeyB', shop: 'KeyP', stop: 'KeyS', grab: 'Mouse1', pan: 'KeyC', center: 'Space', lock: 'KeyY', score: 'Tab', help: 'F1' };
const BIND_LIST = [['q', 'Первая способность'], ['w', 'Вторая способность'], ['e', 'Третья способность'], ['r', 'Ультимейт'], ['recall', 'Возврат на базу'], ['shop', 'Магазин'], ['stop', 'Остановиться'],
  ['grab', 'Тащить камеру (зажать)'], ['pan', 'Камера идёт за курсором (зажать)'], ['center', 'Камера к герою'], ['lock', 'Свободная / привязанная камера'], ['score', 'Таблица счёта (зажать)'], ['help', 'Показать / скрыть подсказку']];
const BINDS = Object.assign({}, BIND_DEF), KEYMAP = {};
function mapBinds() { for (const k in KEYMAP) delete KEYMAP[k]; for (const a in BINDS) KEYMAP[BINDS[a]] = a; }
function loadBinds() { try { const s = JSON.parse(localStorage.getItem('ashrift.binds') || 'null'); if (s) for (const a in BIND_DEF) if (typeof s[a] === 'string' && s[a]) BINDS[a] = s[a]; } catch (e) { } mapBinds(); }
function saveBinds() { try { localStorage.setItem('ashrift.binds', JSON.stringify(BINDS)); } catch (e) { } if (typeof SAVE !== 'undefined') SAVE.touch(); }
function setBind(action, code) { for (const a in BINDS) if (a !== action && BINDS[a] === code) BINDS[a] = BINDS[action]; BINDS[action] = code; mapBinds(); saveBinds(); }
function resetBinds() { Object.assign(BINDS, BIND_DEF); mapBinds(); saveBinds(); }
function keyLabel(c) {
  if (!c) return '—';
  if (c.startsWith('Key')) return c.slice(3); if (c.startsWith('Digit')) return c.slice(5); if (c.startsWith('Numpad')) return 'Num ' + c.slice(6);
  if (c.startsWith('Arrow')) return { Up: '↑', Down: '↓', Left: '←', Right: '→' }[c.slice(5)];
  const M = { Mouse1: 'Колёсико', Mouse3: 'Мышь 4', Mouse4: 'Мышь 5', Space: 'Пробел', ShiftLeft: 'L Shift', ShiftRight: 'R Shift', ControlLeft: 'L Ctrl', ControlRight: 'R Ctrl', AltLeft: 'L Alt', AltRight: 'R Alt', Backquote: '`', Minus: '-', Equal: '=', BracketLeft: '[', BracketRight: ']',
    Semicolon: ';', Quote: "'", Comma: ',', Period: '.', Slash: '/', Backslash: '\\', CapsLock: 'Caps', Backspace: 'Bksp' };
  return M[c] || c;
}
const kl = a => keyLabel(BINDS[a]);
loadBinds();

/* shared game state */
const G = {
  state: 'menu', time: 0, units: [], heroes: [], actors: [], timers: [], proj: [], dangers: [],
  player: null, diff: 1, camX: -60, camZ: 60, shake: 0, over: false, paused: false,
  teams: [{ kills: 0, towers: 0 }, { kills: 0, towers: 0 }], wave: 0, nextWave: 6,
  mx: 0, mz: 0, dim: 0
};

/* geometry helpers */
function TRS(x, y, z, rx, ry, rz, sx, sy, sz) {
  if (sx === undefined) sx = 1; if (sy === undefined) sy = sx; if (sz === undefined) sz = sx;
  return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rx || 0, ry || 0, rz || 0)), new THREE.Vector3(sx, sy, sz));
}
// parts: [{g:BufferGeometry, m:Matrix4, c:hex}] -> one flat-shaded vertex-colored geometry
function mergeParts(parts) {
  const pos = [], nor = [], col = [], c = new THREE.Color();
  for (const p of parts) {
    let g = p.g.index ? p.g.toNonIndexed() : p.g;
    if (p.m) g.applyMatrix4(p.m);
    g.computeVertexNormals();
    const P = g.attributes.position.array, N = g.attributes.normal.array;
    c.set(p.c);
    for (let i = 0; i < P.length; i += 3) { pos.push(P[i], P[i + 1], P[i + 2]); nor.push(N[i], N[i + 1], N[i + 2]); col.push(c.r, c.g, c.b); }
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  out.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return out;
}

/* ===== graphics settings: saved per browser. A preset fills the quality fields; the comfort fields (shake, stop, flash, fps) are never touched by presets ===== */
const GFX_DEF = { preset: 'high', scale: 0, shadow: 1, hdr: 1, bloom: 2, warp: 1, detail: 1, dens: 1, decals: 1, shake: 1, stop: 1, flash: 1, fps: 0, fcap: 120, autoatk: 1 };
const GFX_PRESETS = {
  low: { scale: 0.75, shadow: 0, hdr: 0, bloom: 0, warp: 0, detail: 0, dens: 0.5, decals: 0 },
  med: { scale: 1, shadow: 1, hdr: 1, bloom: 1, warp: 0, detail: 1, dens: 1, decals: 1 },
  high: { scale: 0, shadow: 1, hdr: 1, bloom: 2, warp: 1, detail: 1, dens: 1, decals: 1 },
  ultra: { scale: 2, shadow: 1, hdr: 1, bloom: 2, warp: 1, detail: 1, dens: 1.5, decals: 1 }
};
// [field, label, options [value, text], hint]
const GFX_LIST = [
  ['preset', 'Качество', [['low', 'Низкое'], ['med', 'Среднее'], ['high', 'Высокое'], ['ultra', 'Ультра']], 'Готовый набор настроек ниже. Если игра идёт рывками — начните с этого'],
  ['scale', 'Разрешение', [[0.75, '75%'], [1, '100%'], [0, 'Авто'], [2, 'Макс.']], 'Сильнее всего влияет на частоту кадров'],
  ['shadow', 'Тени', [[0, 'Выкл'], [1, 'Вкл']], ''],
  ['hdr', 'HDR-рендер', [[0, 'Выкл'], [1, 'Вкл']], 'Яркие эффекты не выгорают в белое, а плавно сжимаются; горячая сердцевина, сочные края'],
  ['bloom', 'Свечение', [[0, 'Выкл'], [1, 'Мягкое'], [2, 'Полное']], 'Ореол вокруг ярких эффектов'],
  ['warp', 'Искажение воздуха', [[0, 'Выкл'], [1, 'Вкл']], 'Ударные волны и марево над огнём преломляют картинку'],
  ['detail', 'Детальные эффекты', [[0, 'Выкл'], [1, 'Вкл']], 'Шум и потоки в материалах, анимированные огонь и дым, мягкие частицы, шлейфы оружия'],
  ['dens', 'Частицы', [[0.5, 'Мало'], [1, 'Обычно'], [1.5, 'Много']], ''],
  ['decals', 'Следы и обломки', [[0, 'Выкл'], [1, 'Вкл']], 'Остывающие следы на земле, камни и осколки'],
  ['shake', 'Тряска камеры', [[0, 'Выкл'], [0.5, 'Слабая'], [1, 'Полная']], ''],
  ['stop', 'Стоп-кадры ударов', [[0, 'Выкл'], [1, 'Вкл']], 'Доля секунды замирания на сильном попадании'],
  ['flash', 'Вспышки экрана', [[0, 'Выкл'], [1, 'Вкл']], 'Цветовой сдвиг на взрывах и затемнение перед ультимейтом'],
  ['fcap', 'Предел кадров', [[30, '30'], [60, '60'], [120, '120'], [0, 'Нет']], 'Видеокарта не рисует больше кадров, чем нужно: на мониторе 144–240 Гц предел 120 заметно снижает нагрузку, 60 — ещё вдвое'],
  ['fps', 'Счётчик кадров', [[0, 'Выкл'], [1, 'Вкл']], '']
];
// game options shown in their own block of the settings (stored with the graphics settings)
const OPT_LIST = [['autoatk', 'Автоатака', [[1, 'Вкл'], [0, 'Выкл']], 'Герой сам бьёт ближайшего врага в пределах досягаемости, пока стоит без приказа. Выключите — и он атакует только по вашей команде (ПКМ по врагу)']];
const GFX = Object.assign({}, GFX_DEF);
function loadGfx() { try { const s = JSON.parse(localStorage.getItem('ashrift.gfx') || 'null'); if (s) for (const k in GFX_DEF) if (typeof s[k] === typeof GFX_DEF[k]) GFX[k] = s[k]; const v = +localStorage.getItem('ashrift.vol'); if (v >= 0 && localStorage.getItem('ashrift.vol') !== null) SFX.vol = clamp(v, 0, 1); } catch (e) { } }
function saveGfx() { try { localStorage.setItem('ashrift.gfx', JSON.stringify(GFX)); localStorage.setItem('ashrift.vol', String(SFX.vol)); } catch (e) { } if (typeof SAVE !== 'undefined') SAVE.touch(); }
// change one field; picking a preset copies its fields, touching a quality field afterwards marks the set as custom
function setGfx(k, v) {
  if (k === 'preset') { GFX.preset = v; Object.assign(GFX, GFX_PRESETS[v]); }
  else { GFX[k] = v; if (k in GFX_PRESETS.high) { GFX.preset = 'custom'; for (const p in GFX_PRESETS) if (Object.keys(GFX_PRESETS[p]).every(q => GFX_PRESETS[p][q] === GFX[q])) GFX.preset = p; } }
  saveGfx();
}

/* ===== procedural audio: every sound is synthesised. One dry bus and one reverb send feed a compressor; world sounds are panned by where they are on screen ===== */
const SFX = {
  ctx: null, out: null, vol: 0.55, last: {}, nb: null, dst: null, pk: 1,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const C = window.AudioContext || window.webkitAudioContext, c = this.ctx = new C();
      this.out = c.createGain(); this.out.gain.value = this.vol;
      const comp = c.createDynamicsCompressor(); this.out.connect(comp); comp.connect(c.destination);
      const n = c.sampleRate, b = c.createBuffer(1, n, n), d = b.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      this.nb = b; this.dst = this.out;
      // a short synthetic hall: decaying noise as the impulse response, quieter than the dry signal
      try {
        const len = Math.floor(n * 1.5), ir = c.createBuffer(2, len, n);
        for (let ch = 0; ch < 2; ch++) { const q = ir.getChannelData(ch); let lp = 0; for (let i = 0; i < len; i++) { const k = i / len; lp += ((Math.random() * 2 - 1) - lp) * (0.55 - 0.4 * k); q[i] = lp * Math.pow(1 - k, 2.6) * (i < 400 ? i / 400 : 1); } }
        const cv = c.createConvolver(); cv.buffer = ir; const send = c.createGain(); send.gain.value = 0.2; this.out.connect(send); send.connect(cv); cv.connect(comp);
      } catch (e) { }
    } catch (e) { this.ctx = null; }
  },
  setVol(v) { this.vol = v; if (this.out) this.out.gain.value = v; },
  tone(type, f0, f1, dur, vol, delay) {
    const c = this.ctx, t = c.currentTime + (delay || 0), o = c.createOscillator(), g = c.createGain(), p = this.pk;
    o.type = type; o.frequency.setValueAtTime(f0 * p, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1 * p), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.dst); o.start(t); o.stop(t + dur + 0.02);
  },
  noise(ft, f0, f1, dur, vol, delay, q) {
    const c = this.ctx, t = c.currentTime + (delay || 0), s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), p = this.pk;
    s.buffer = this.nb; s.loop = true; f.type = ft; f.Q.value = q || 1;
    f.frequency.setValueAtTime(f0 * p, t); f.frequency.exponentialRampToValueAtTime(Math.max(30, f1 * p), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.dst); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  },
  // pan: -1 (left) .. 1 (right), omitted for interface sounds
  play(name, v, pan) {
    if (!this.ctx || this.vol <= 0) return;
    v = v === undefined ? 1 : v; if (v < 0.02) return;
    const now = performance.now(); if (this.last[name] && now - this.last[name] < 45) return; this.last[name] = now;
    const world = !SFX_FLAT[name]; this.pk = world ? 0.94 + Math.random() * 0.12 : 1; this.dst = this.out;
    if (pan && this.ctx.createStereoPanner) { try { const pn = this.ctx.createStereoPanner(); pn.pan.value = clamp(pan, -1, 1); pn.connect(this.out); this.dst = pn; } catch (e) { this.dst = this.out; } }
    const T = (a, b, c, d, e, f) => this.tone(a, b, c, d, e * v, f), N = (a, b, c, d, e, f, q) => this.noise(a, b, c, d, e * v, f, q);
    switch (name) {
      case 'hit': N('bandpass', 1900, 500, 0.09, 0.3); T('square', 170, 80, 0.07, 0.12); break;
      // staged hits: a dull body thump under a short bright crack
      case 'impact': T('sine', 150, 48, 0.14, 0.42); N('bandpass', 2400, 700, 0.07, 0.3, 0, 1.4); N('lowpass', 600, 120, 0.12, 0.2); break;
      case 'heavy': T('sine', 110, 34, 0.3, 0.6); N('lowpass', 900, 70, 0.32, 0.5); N('bandpass', 3200, 900, 0.08, 0.32, 0, 1.6); T('square', 70, 44, 0.12, 0.12); break;
      case 'crit': T('triangle', 1760, 880, 0.16, 0.14); T('sine', 2640, 1320, 0.2, 0.08, 0.01); T('sine', 130, 44, 0.18, 0.45); N('highpass', 5200, 2400, 0.08, 0.2); break;
      case 'whoosh': N('bandpass', 500, 2600, 0.11, 0.2, 0, 1.3); N('bandpass', 2400, 600, 0.14, 0.18, 0.09, 1.3); break;
      case 'cue': T('sine', 300, 720, 0.16, 0.1); N('bandpass', 1400, 4200, 0.16, 0.08, 0, 2.4); break;
      case 'ultcue': T('sawtooth', 55, 220, 0.5, 0.2); T('sine', 220, 880, 0.5, 0.12); N('bandpass', 300, 5200, 0.5, 0.16, 0, 2.2); T('sine', 90, 30, 0.6, 0.55, 0.48); N('lowpass', 1600, 60, 0.5, 0.35, 0.48); break;
      case 'shatter': N('highpass', 6400, 2600, 0.22, 0.24); T('triangle', 3100, 1300, 0.12, 0.08); T('triangle', 4300, 1900, 0.16, 0.06, 0.04); N('bandpass', 2600, 900, 0.3, 0.14, 0.05, 3); break;
      case 'rubble': N('lowpass', 700, 140, 0.5, 0.3, 0.05); N('bandpass', 1500, 500, 0.12, 0.14, 0.14, 2); N('bandpass', 1100, 400, 0.12, 0.12, 0.3, 2); break;
      case 'sizzle': N('highpass', 5200, 3000, 0.9, 0.07, 0.1); N('bandpass', 2600, 1500, 0.7, 0.05, 0.15, 3); break;
      case 'warp': T('sine', 190, 42, 0.42, 0.34); N('lowpass', 420, 60, 0.42, 0.26); break;
      case 'slash': N('highpass', 2600, 700, 0.13, 0.22); T('triangle', 620, 180, 0.1, 0.1); N('bandpass', 700, 2800, 0.07, 0.1, 0, 1.2); break;
      case 'shoot': T('triangle', 880, 260, 0.09, 0.16); N('highpass', 3000, 1500, 0.05, 0.1); T('sine', 160, 70, 0.07, 0.12); break;
      case 'arrow': N('bandpass', 2600, 900, 0.12, 0.22, 0, 2); break;
      case 'cast': T('sine', 380, 880, 0.2, 0.16); N('bandpass', 900, 2400, 0.18, 0.1); break;
      case 'fire': N('lowpass', 1800, 180, 0.5, 0.45); T('sawtooth', 130, 45, 0.35, 0.16); N('bandpass', 2800, 1200, 0.6, 0.07, 0.12, 3); break;
      case 'boom': N('lowpass', 1100, 60, 0.7, 0.75); T('sine', 95, 30, 0.55, 0.6); N('bandpass', 2600, 500, 0.1, 0.3, 0, 1.2); N('lowpass', 500, 90, 0.6, 0.2, 0.25); break;
      case 'bigboom': N('lowpass', 1500, 40, 1.2, 0.95); T('sine', 80, 24, 0.9, 0.8); N('bandpass', 3000, 300, 0.4, 0.3); T('sine', 46, 24, 1.1, 0.45, 0.06); N('lowpass', 420, 70, 0.9, 0.22, 0.5); break;
      case 'zap': T('sawtooth', 1500, 180, 0.13, 0.2); N('highpass', 4000, 1200, 0.16, 0.22); T('square', 70, 50, 0.1, 0.14); break;
      case 'laser': T('sawtooth', 2400, 620, 0.32, 0.15); T('sine', 1250, 2900, 0.22, 0.12); N('highpass', 6000, 2600, 0.3, 0.14); T('square', 110, 70, 0.2, 0.1); break;
      case 'rocket': N('bandpass', 500, 2800, 0.55, 0.42, 0, 1.2); N('lowpass', 900, 160, 0.5, 0.35); T('sawtooth', 160, 70, 0.3, 0.12); break;
      case 'drone': T('square', 1500, 1900, 0.07, 0.07); T('square', 1900, 1500, 0.07, 0.07, 0.08); T('sine', 240, 480, 0.3, 0.1); break;
      case 'overload': T('sawtooth', 90, 900, 0.75, 0.2); T('sine', 180, 1800, 0.75, 0.14); N('bandpass', 400, 5000, 0.75, 0.2, 0, 2); T('square', 60, 40, 0.5, 0.2, 0.7); N('lowpass', 2400, 80, 0.7, 0.6, 0.7); break;
      case 'ice': T('sine', 1900, 2700, 0.16, 0.14); T('triangle', 3300, 1100, 0.26, 0.1); N('highpass', 5000, 2500, 0.12, 0.14); break;
      case 'heal': T('sine', 523, 784, 0.32, 0.16); T('sine', 784, 1047, 0.34, 0.12, 0.09); T('sine', 1568, 2093, 0.4, 0.04, 0.12); break;
      case 'shield': T('sine', 300, 620, 0.25, 0.18); N('bandpass', 1500, 3000, 0.2, 0.08); break;
      case 'dash': N('bandpass', 420, 2600, 0.2, 0.3, 0, 1.5); break;
      case 'dark': T('sawtooth', 210, 55, 0.5, 0.18); N('lowpass', 700, 90, 0.5, 0.3); break;
      case 'void': T('sine', 70, 320, 0.7, 0.3); N('bandpass', 260, 1700, 0.6, 0.2, 0, 3); break;
      case 'quake': N('lowpass', 500, 40, 0.8, 0.9); T('sine', 60, 28, 0.7, 0.7); T('square', 45, 30, 0.3, 0.2); N('bandpass', 1300, 400, 0.14, 0.16, 0.2, 2); break;
      case 'poison': N('bandpass', 700, 250, 0.35, 0.3, 0, 4); T('sine', 240, 120, 0.3, 0.1); break;
      case 'horn': T('sawtooth', 196, 196, 0.5, 0.14); T('sawtooth', 294, 294, 0.5, 0.1, 0.03); T('sine', 98, 98, 0.55, 0.18); N('bandpass', 900, 700, 0.5, 0.05, 0, 3); break;
      case 'cleanse': T('sine', 880, 1760, 0.3, 0.12); T('sine', 1320, 2640, 0.34, 0.08, 0.06); N('highpass', 5000, 7000, 0.3, 0.06); break;
      case 'coin': T('sine', 1250, 1250, 0.06, 0.12); T('sine', 1870, 1870, 0.12, 0.12, 0.06); break;
      case 'level': [523, 659, 784, 1047].forEach((f, i) => T('triangle', f, f, 0.22, 0.16, i * 0.08)); break;
      case 'death': T('sawtooth', 320, 45, 0.8, 0.25); N('lowpass', 900, 80, 0.8, 0.3); T('sine', 70, 28, 0.6, 0.4); break;
      case 'tower': N('lowpass', 1300, 40, 1.4, 0.9); T('sine', 70, 22, 1.1, 0.8); T('sawtooth', 220, 40, 0.9, 0.2); N('bandpass', 1400, 400, 0.14, 0.16, 0.5, 2); N('bandpass', 1000, 300, 0.14, 0.14, 0.8, 2); break;
      case 'towershot': T('square', 520, 140, 0.16, 0.14); N('bandpass', 1400, 500, 0.14, 0.18); break;
      case 'ui': T('sine', 720, 720, 0.045, 0.1); break;
      case 'buy': T('sine', 900, 900, 0.05, 0.12); T('sine', 1350, 1350, 0.1, 0.12, 0.05); T('sine', 1800, 1800, 0.14, 0.1, 0.11); break;
      case 'deny': T('square', 180, 140, 0.12, 0.1); break;
      case 'warn': T('square', 440, 440, 0.09, 0.1); T('square', 440, 440, 0.09, 0.1, 0.14); break;
      case 'recall': T('sine', 260, 1300, 0.9, 0.16); N('bandpass', 600, 3200, 0.9, 0.08); break;
      case 'kill': T('triangle', 392, 392, 0.14, 0.2); T('triangle', 587, 587, 0.2, 0.2, 0.12); T('triangle', 784, 784, 0.3, 0.2, 0.26); break;
      case 'victory': [392, 523, 659, 784, 1047].forEach((f, i) => T('triangle', f, f, 0.5, 0.2, i * 0.16)); break;
      case 'defeat': [392, 330, 262, 196].forEach((f, i) => T('sawtooth', f, f * 0.97, 0.6, 0.14, i * 0.26)); break;
      case 'mvp': [523, 659, 784, 1047, 1319].forEach((f, i) => { T('triangle', f, f, 0.6, 0.14, 0.2 + i * 0.11); T('sine', f * 2, f * 2, 0.5, 0.05, 0.2 + i * 0.11); }); break;
    }
    this.dst = this.out; this.pk = 1;
  },
  // a sound somewhere in the world: quieter with distance from the camera, panned by its side of the screen
  at(name, x, z, v) { const k = clamp(1 - dist(x, z, G.camX, G.camZ) / 52, 0, 1); if (k > 0.03) this.play(name, k * k * (v === undefined ? 1 : v), clamp((x - G.camX) / 34, -0.85, 0.85)); }
};
// interface sounds keep their exact pitch
const SFX_FLAT = { ui: 1, buy: 1, deny: 1, warn: 1, coin: 1, level: 1, kill: 1, victory: 1, defeat: 1, mvp: 1, recall: 1 };
loadGfx();

/* ===== the player's profile: last choices in the menu and career figures. Everything that must survive a restart (profile, key bindings, graphics, volume)
   is kept twice: in this browser's storage, and, when the page is opened by a signed-in person who may write, in that person's private document
   of the artifact's database (data/users/<id>/profile) — so it follows the account to another browser or computer. The newer copy wins on load ===== */
const PROFILE = { hero: '', lane: 'top', role: 'dmg', diff: 1, games: 0, wins: 0, mvp: 0, kills: 0, deaths: 0, assists: 0, heroes: {}, ts: 0, rk: { orp: 0, peak: 0, g: 0, w: 0, hist: [] }, nick: '', ava: '', frame: 'ember', title: '', fav: [], hist: [], ach: {} };   // rk: the ranked ladder (rating points, best ever, games, wins, the last changes)
// a second copy of the save in IndexedDB: some browsers clear one kind of site storage and keep the other
const IDB = {
  p: null,
  open() { return this.p || (this.p = new Promise(res => { try { const r = indexedDB.open('ashrift', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => res(r.result); r.onerror = r.onblocked = () => res(null); } catch (e) { res(null); } })); },
  async get(k) { const d = await this.open(); if (!d) return null; return new Promise(res => { try { const q = d.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => res(q.result === undefined ? null : q.result); q.onerror = () => res(null); } catch (e) { res(null); } }); },
  async set(k, v) { const d = await this.open(); if (!d) return false; return new Promise(res => { try { const t = d.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, k); t.oncomplete = () => res(true); t.onerror = t.onabort = () => res(false); } catch (e) { res(false); } }); }
};
const SAVE = {
  ref: null, timer: 0, busy: false, dirty: false, applying: false, fails: 0, state: 'local', onApply: null, onState: null, localOk: false, idbOk: false,
  // can this browser keep anything at all? (a blocked or sandboxed storage throws or reads back nothing)
  probe() { try { localStorage.setItem('ashrift.probe', '1'); this.localOk = localStorage.getItem('ashrift.probe') === '1'; localStorage.removeItem('ashrift.probe'); } catch (e) { this.localOk = false; } },
  loadLocal() { try { const s = JSON.parse(localStorage.getItem('ashrift.profile') || 'null'); if (s && typeof s === 'object') Object.assign(PROFILE, s); } catch (e) { } },
  pack() { return { v: 1, ts: PROFILE.ts, binds: Object.assign({}, BINDS), gfx: Object.assign({}, GFX), vol: SFX.vol, profile: JSON.parse(JSON.stringify(PROFILE)) }; },
  // something changed: stamp it, keep the local copy, and send it to the account after a pause (one write for a burst of changes)
  touch() {
    if (this.applying) return; PROFILE.ts = Date.now(); try { localStorage.setItem('ashrift.profile', JSON.stringify(PROFILE)); } catch (e) { }
    IDB.set('save', this.pack()).then(ok => { if (ok !== this.idbOk) { this.idbOk = ok; if (this.onState) this.onState(); } });
    this.dirty = true; clearTimeout(this.timer); this.timer = setTimeout(() => this.push(), 1500);
  },
  async push() {
    if (!this.ref || this.busy || !this.dirty) return; this.busy = true; this.dirty = false;
    try { await this.ref.set(this.pack()); this.fails = 0; this.state = 'cloud'; }
    catch (e) { if (e && (e.code === 'unavailable' || e.code === 'resource_exhausted') && ++this.fails < 4) this.dirty = true; else { this.ref = null; this.state = 'local'; } }   // refused for good (a view-only visitor): stay local
    this.busy = false; if (this.dirty && this.ref) { clearTimeout(this.timer); this.timer = setTimeout(() => this.push(), 4000); } if (this.onState) this.onState();
  },
  apply(d) {
    this.applying = true;
    try {
      if (d.binds) { for (const a in BIND_DEF) if (typeof d.binds[a] === 'string' && d.binds[a]) BINDS[a] = d.binds[a]; mapBinds(); saveBinds(); }
      if (d.gfx) for (const k in GFX_DEF) if (typeof d.gfx[k] === typeof GFX_DEF[k]) GFX[k] = d.gfx[k];
      if (typeof d.vol === 'number') SFX.setVol(clamp(d.vol, 0, 1)); saveGfx();
      if (d.profile && typeof d.profile === 'object') { Object.assign(PROFILE, d.profile); try { localStorage.setItem('ashrift.profile', JSON.stringify(PROFILE)); } catch (e) { } }
    } finally { this.applying = false; }
    if (this.onApply) this.onApply();
  },
  async init() {
    // the browser copies first: whichever of localStorage and IndexedDB is newer wins; then ask the browser not to evict them
    this.probe();
    try { const d = await IDB.get('save'); this.idbOk = !!(await IDB.open()); if (d && d.profile && (d.ts || 0) > PROFILE.ts) this.apply(d); else if (this.idbOk && PROFILE.ts) IDB.set('save', this.pack()); } catch (e) { }
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => { }); } catch (e) { }
    try {
      if (!window.claude || !claude.use) return; const db = await claude.use('db'), user = await claude.use('user'); if (!db || !user) return;
      const id = await user.id(); if (!id) return; this.ref = db.doc('data/users/' + id + '/profile');
      const snap = await this.ref.get(), d = snap.exists ? snap.data() : null;
      if (d && (d.ts || 0) > PROFILE.ts) this.apply(d); else if (!d || PROFILE.ts > (d.ts || 0)) { this.dirty = true; await this.push(); }
      if (this.ref) this.state = 'cloud';
    } catch (e) { this.ref = null; }
    if (this.onState) this.onState();
  }
};
SAVE.loadLocal();
// the progress code: "ASH1." + base64 of the saved JSON (UTF-8 safe). Reading it back checks the shape before anything is applied
const SAVECODE = {
  make() { try { return 'ASH1.' + btoa(unescape(encodeURIComponent(JSON.stringify(SAVE.pack())))); } catch (e) { return ''; } },
  read(s) {
    try {
      s = String(s || '').replace(/\s+/g, ''); if (!/^ASH1\./.test(s)) return null;
      const d = JSON.parse(decodeURIComponent(escape(atob(s.slice(5))))); if (!d || typeof d !== 'object' || !d.profile || typeof d.profile !== 'object') return null;
      const p = d.profile; if (typeof p.games !== 'number' || (p.rk && typeof p.rk !== 'object')) return null;
      return d;
    } catch (e) { return null; }
  }
};
