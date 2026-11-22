'use strict';
/* ===== roster, part 42 (hero 70). Loaded after roster15.js; glyphs go to GLYPH at the end.
   70. Velvet — the diva of the Rift: a support who fights with her voice. Every song she sings leaves allies an encore (their next attacks
       ring out an extra note that hurts the target and heals the attacker), a piercing high note that hurts enemies and heals allies on its
       way, a spotlight that heals and shields one ally, a fortissimo that blows enemies away from her, and a gala concert — a stage that
       follows her for six seconds, healing and lifting her team while notes rain down on the enemy. ===== */
const VL = { c: 0xff6ad8, pale: 0xffd6f2, vio: 0x9a6aff, gold: 0xffd86a };
let _vlNoteT = null, _vlArcG = null;
// two glowing note sprites (a quaver and a pair of beamed quavers), drawn once
function vlNoteTex() {
  if (_vlNoteT) return _vlNoteT;
  _vlNoteT = ['♪', '♫'].map(ch => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.shadowColor = '#fff'; g.shadowBlur = 8; g.font = 'bold 50px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, 32, 34); const t = new THREE.CanvasTexture(c); return t; });
  return _vlNoteT;
}
// a note that floats up, swaying, and fades
function vlNote(x, y, z, col, size, life) {
  if (!FX.near(x, z, 50)) return;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: vlNoteTex()[Math.random() < 0.5 ? 0 : 1], color: col, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  const ph = rand(TAU), sz = size || 0.8, L = life || 0.9;
  FX.add(s, L, (k, me) => { me.position.set(x + Math.sin(ph + k * 7) * 0.25, y + k * 1.6, z); const q = sz * (0.5 + 0.5 * Math.min(1, k * 5)); me.scale.set(q, q, 1); me.material.opacity = k < 0.7 ? 1 : (1 - k) / 0.3; });
}
// a flat arc of sound bulging forward along `dir`; it widens and drifts ahead as it fades
function vlArc(x, z, dir, r, col, life, o) {
  o = o || {}; if (!FX.near(x, z, 55)) return;
  if (!_vlArcG) _vlArcG = new THREE.RingGeometry(0.7, 1, 28, 1, -0.95, 1.9);
  const m = new THREE.Mesh(_vlArcG, new THREE.MeshBasicMaterial({ color: col, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  m.rotation.order = 'YXZ'; m.rotation.set(-HPI, dir - HPI, 0);
  const sx = Math.sin(dir), sz = Math.cos(dir), tr = o.travel || 0, y = o.y || 1.3, op = o.op || 0.9;
  FX.add(m, life, (k, me) => { const e = easeOut(k); me.position.set(x + sx * tr * e, y, z + sz * tr * e); const q = r * (0.6 + 0.6 * e); me.scale.set(q, q, 1); me.material.opacity = op * (1 - k); });
}
function vlMouth(h, dir) { return { x: h.x + Math.sin(dir) * 0.6, y: h.height - 0.1, z: h.z + Math.cos(dir) * 0.6 }; }
// the encore: an ally's next `n` attacks each ring out a note from Velvet — magic damage to the target, a little healing for the attacker
function vlChord(h, o, n) {
  addBuff(o, { id: 'vlchord', dur: 5, n, src: h, onHit(u, t, b) { if (t.struct || b.n <= 0) return 0; b.n--; if (b.n <= 0) b.dead = true; vlChordHit(b.src, u, t); return 0; } });
  if (FX.near(o.x, o.z, 50)) { FX.aura(o, VL.c, 0.6, 1.3, 'ringThin', 3); vlNote(o.x, o.height + 0.3, o.z, VL.pale, 0.7, 0.8); }
}
function vlChordHit(h, u, t) {
  if (!h || !t.alive) return;
  damage(h, t, D(h, 16, 5, 0, 0.15), 1, { dot: true }); if (u.kind === 'hero' && u.alive) heal(h, u, D(h, 5, 1.5, 0, 0.04), true);
  SFX.at('chime', t.x, t.z, 0.2);
  if (FX.near(t.x, t.z, 45)) { vlNote(t.x + rand(-0.3, 0.3), t.height * 0.7, t.z + rand(-0.3, 0.3), VL.c, 0.75, 0.75); FX.glow(t.x, t.height * 0.6, t.z, 1.6, VL.c, 0.2, 'star'); }
}
// every song she sings: allied heroes within 8 (and she herself) get the encore
function vlEncore(h) { for (const o of G.heroes) if (o.alive && o.team === h.team && udist(h, o) < 8) vlChord(h, o, 2); }
// the spotlight: a cone of light from above onto the ally, a thin beam from the microphone, stars and notes
function vlSpot(h, o) {
  if (!FX.near(o.x, o.z, 55)) return;
  FX.pillar(o.x, o.z, { r: 1.2, h: 11, color: VL.pale, life: 0.75, op: 0.45, spin: 0.5 }); FX.pillar(o.x, o.z, { r: 0.6, h: 11, color: VL.c, life: 0.5, op: 0.6 });
  FX.ring(o.x, o.z, { r0: 0.4, r1: 2.0, color: VL.c, life: 0.5, tex: 'ringThin' }); FX.ring(o.x, o.z, { r0: 1.8, r1: 1.4, color: VL.gold, life: 0.7, tex: 'ring' });
  FX.glow(o.x, o.height + 0.6, o.z, 3, VL.gold, 0.35, 'star'); FX.light(o.x, 4, o.z, VL.pale, 2.2, 10, 0.5); FX.heal(o, VL.c);
  if (o !== h) FX.beam(h.x, h.z, o.x, o.z, { color: VL.c, w: 0.25, life: 0.35, y: h.height - 0.1 });
  for (let i = 0; i < 3; i++) after(i * 0.12, () => vlNote(o.x + rand(-0.7, 0.7), 1.2, o.z + rand(-0.7, 0.7), i % 2 ? VL.gold : VL.c, 0.8, 0.9));
}
// «Gala concert»: a stage that follows her for DUR seconds. Each second allies on it heal, deal 12% more and get two encore notes;
// every half second a note flies at an enemy on it; at the end a final chord hits everyone still there and slows them
function vlConcert(h, DUR, hl, note, fin) {
  const R = 9, cols = [VL.c, VL.vio, VL.gold];
  SFX.at('ultcue', h.x, h.z, 0.7); SFX.at('diva', h.x, h.z, 1); SFX.at('chord', h.x, h.z, 0.6);
  if (FX.near(h.x, h.z, 60)) {
    FX.text(h.x, h.height + 1.3, h.z, 'Гала-концерт!', '#ff9ae4', 18);
    // the stage: plain rings of light, no runes — an outer edge, a gold middle ring, a soft pink floor
    FX.zone(h.x, h.z, R, 0xc83aa0, DUR, { tex: 'ringThin', spin: 0.6, op: 0.7, follow: h }); FX.zone(h.x, h.z, R * 0.55, 0xc8901a, DUR, { tex: 'ringThin', spin: -1.2, op: 0.55, follow: h }); FX.zone(h.x, h.z, R * 0.8, 0x7a2a9a, DUR, { tex: 'swirl', spin: 0.9, op: 0.22, follow: h }); FX.zone(h.x, h.z, R * 0.3, 0xc83aa0, DUR, { tex: 'glow', spin: 0, op: 0.3, follow: h });
    FX.ring(h.x, h.z, { r0: 0.5, r1: R, color: VL.c, life: 0.6, tex: 'shock' }); FX.shock(h.x, h.z, R * 0.7, 1, 0.5); FX.glow(h.x, h.height, h.z, 7, VL.pale, 0.4, 'flare');
    for (let i = 0; i < 10; i++) vlArc(h.x, h.z, i / 10 * TAU, 1.2, cols[i % 3], 0.6, { travel: 5 });
  }
  let t = 0, sec = 0, beat = 0, lt = 0, li = 0, sw = 0;
  G.actors.push({ update(dt) {
    t += dt; sec += dt; beat += dt; lt += dt; sw += dt; if (!h.alive) return false;
    // three spotlights sweep the floor of the stage like a disco, and the outer ring pulses on every beat
    if (sw > 0.09 && FX.near(h.x, h.z, 55)) { sw = 0; for (let i = 0; i < 3; i++) { const a = t * 2.2 + i * 2.094; FX.beam(h.x, h.z, h.x + Math.sin(a) * R, h.z + Math.cos(a) * R, { color: cols[i], w: 0.75, life: 0.16, y: 0.14, op: 0.3 }); } }
    if (lt > 0.22 && FX.near(h.x, h.z, 55)) {
      lt = 0; li++; const col = cols[li % 3], a = rand(TAU), r = rand(1.5, R - 0.5);
      FX.pillar(h.x + Math.sin(a) * r, h.z + Math.cos(a) * r, { r: 0.7, h: 13, color: col, life: 0.55, op: 0.35, spin: 0 });
      FX.light(h.x, 4, h.z, col, 1.8, 16, 0.3); vlNote(h.x + rand(-R, R) * 0.6, 0.8, h.z + rand(-R, R) * 0.6, col, 0.9, 1.1);
      if (li % 2) vlArc(h.x, h.z, h.facing + rand(-1, 1), 1.4, col, 0.45, { travel: 3, y: h.height - 0.2 });
    }
    if (sec >= 1) {
      sec -= 1;
      for (const o of G.heroes) if (o.alive && o.team === h.team && udist(h, o) < R) { heal(h, o, hl); addBuff(o, { id: 'vlgala', dur: 1.2, dmgOut: 1.12, amp: h, src: h }); vlChord(h, o, 2); if (FX.near(o.x, o.z, 45)) FX.heal(o, VL.c); }
      SFX.at('chord', h.x, h.z, 0.35);
      if (FX.near(h.x, h.z, 55)) { FX.ring(h.x, h.z, { r0: R * 0.5, r1: R, color: 0xc83aa0, life: 0.45, tex: 'shock', op: 0.4 }); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + t; vlNote(h.x + Math.sin(a) * R * 0.92, 0.6, h.z + Math.cos(a) * R * 0.92, cols[i % 3], 0.9, 1.0); } }
    }
    if (beat >= 0.5) {
      beat -= 0.5; let best = null, bd = 99;
      for (const e of enemiesIn(h, h.x, h.z, R)) { if (e.struct) continue; const d = udist(h, e) - (e.kind === 'hero' ? 6 : 0); if (d < bd) { bd = d; best = e; } }
      if (best) { SFX.at('note', h.x, h.z, 0.35); homing(h, best, { speed: 26, mesh: 'orb', color: cols[Math.floor(t * 2) % 3], size: 0.55, y: h.height,
        onHit: e => { damage(h, e, note, 1); SFX.at('chime', e.x, e.z, 0.3); if (FX.near(e.x, e.z, 45)) { FX.hit(e.x, e.height * 0.6, e.z, VL.c, false); vlNote(e.x, e.height * 0.7, e.z, VL.pale, 0.8, 0.7); } } }); }
    }
    if (t >= DUR) {
      for (const e of enemiesIn(h, h.x, h.z, R)) { if (e.struct) continue; damage(h, e, fin, 1); if (e.alive) slow(h, e, 0.4, 1.5, 'vlfin'); }
      SFX.at('diva', h.x, h.z, 0.6); SFX.at('boom', h.x, h.z, 0.5); SFX.at('chord', h.x, h.z, 0.8);
      if (FX.near(h.x, h.z, 60)) { FX.ring(h.x, h.z, { r0: 1, r1: R, color: 0xc8901a, life: 0.5, tex: 'shock', op: 0.5 }); FX.ring(h.x, h.z, { r0: 0.5, r1: R * 0.8, color: 0xc83aa0, life: 0.6, tex: 'ringThin', op: 0.8 }); FX.shock(h.x, h.z, R, 1.2, 0.5); FX.shake(0.25); FX.glow(h.x, 2, h.z, 5, VL.c, 0.3, 'star'); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; FX.pillar(h.x + Math.sin(a) * R * 0.7, h.z + Math.cos(a) * R * 0.7, { r: 0.6, h: 12, color: cols[i % 3], life: 0.6, op: 0.35, spin: 0 }); } for (let i = 0; i < 12; i++) vlArc(h.x, h.z, i / 12 * TAU, 1.5, cols[i % 3], 0.5, { travel: 6 }); }
      return false;
    }
    return true;
  } });
}

HEROES.push(
  /* ================= 70. Velvet ================= */
  {
    id: 'velvet', name: 'Вельвет', title: 'Дива Разлома', role: 'support', roleName: 'Поддержка', build: 'support', bars: [3, 2, 4, 2], diffc: 2, projMesh: 'orb',
    lore: 'Вельвет — самая известная певица по эту сторону Разлома: её концерты собирают площади, а билеты перепродают втрое. Когда на гастролях её колонну зажали твари из Разлома, оказалось, что голос, от которого у фанатов дрожат колени, у тварей дробит панцири. С тех пор она гастролирует с отрядами наёмников — и уверяет, что лучшего зала, чем поле боя, у неё не было.',
    look: { bulk: 0.9, h: 1.02, scale: 1.0, c1: 0xf6f2f4, c2: 0xe8e0e8, c3: 0x2a1a2a, skin: 0xf2d8cc, hands: 0xf6f2f4, cuff: 0xff7ac8, metal: 0xe8c060, glow: VL.c, head: 'velvet', hair: 0xf2dca0, lin: 0xff7ac8, chest: 'idol', legs: 'boots', sh: 'none', weapon: 'mic', wc: 'staff' },
    stats: ST(540, 78, 460, 48, 40, 2.2, 20, 2.5, 0.68, 8.9, 6.8),
    innate: { name: 'На бис', icon: 'vlinn', desc: 'После каждого умения Вельвет союзные герои в радиусе 8 (и она сама) на 5 сек получают «На бис»: две их следующие атаки звучат ещё одной нотой — она наносит цели магический урон от Вельвет и немного лечит атакующего.' },
    abilities: [
      {
        key: 'Q', name: 'Высокая нота', icon: 'vlnote', cd: 7, cost: 55, range: 10, ind: { type: 'line', w: 1.8, fixed: true }, anim: 'cast', animDur: 0.4, lock: 0.2, ai: { t: 'shot', sp: 22, farm: true, healLine: true },
        desc: 'Вельвет берёт высокую ноту: звуковая волна летит вперёд (до 10) и проходит насквозь. Враги на пути получают магический урон и замедляются на 25% на 1.5 сек, союзные герои — лечатся.',
        cast(h, p) {
          const dir = p.dir, dmg = D(h, 70, 20, 0, 0.6), hl = D(h, 30, 9, 0, 0.25), m = vlMouth(h, dir); let last = -1, k = 0;
          SFX.at('sonic', h.x, h.z, 0.8); SFX.at('note', h.x, h.z, 0.6);
          if (FX.near(h.x, h.z, 55)) { FX.glow(m.x, m.y, m.z, 3, VL.c, 0.2, 'star'); vlArc(m.x, m.z, dir, 0.9, VL.pale, 0.25, { travel: 1, y: m.y }); FX.warp('line', m.x, 1.3, m.z, { ang: dir, w: 2.4, len: 10, str: 0.5, life: 0.45 }); FX.ring(h.x, h.z, { r0: 0.4, r1: 2, color: 0xc83aa0, life: 0.3, tex: 'ringThin', op: 0.7 }); for (const s of [-1, 1]) { const px = Math.cos(dir) * 0.9 * s, pz = -Math.sin(dir) * 0.9 * s; FX.beam(m.x + px, m.z + pz, m.x + px + Math.sin(dir) * 10, m.z + pz + Math.cos(dir) * 10, { color: 0x7a2a9a, w: 0.12, life: 0.5, y: 0.14, op: 0.6 }); } }
          shot(h, { dir, speed: 22, range: 10, w: 0.9, mesh: false, ribbon: false, pierce: true, color: VL.c, x: m.x, z: m.z, y: 1.3,
            trail: q => { if (G.time - last < 0.04) return; last = G.time; k++; vlArc(q.x, q.z, dir, 1.9, k % 3 === 2 ? VL.vio : VL.c, 0.42, { travel: 0.9 }); vlArc(q.x, q.z, dir, 1.3, VL.pale, 0.3, { travel: 0.7, y: 0.3, op: 0.5 }); if (k % 3 === 0) vlNote(q.x + rand(-0.7, 0.7), 1.1, q.z + rand(-0.7, 0.7), VL.pale, 0.6, 0.7); },
            onHit: e => { damage(h, e, dmg, 1); if (e.alive) slow(h, e, 0.25, 1.5, 'vlnote'); SFX.at('chime', e.x, e.z, 0.3); if (FX.near(e.x, e.z, 45)) { FX.hit(e.x, e.height * 0.6, e.z, VL.c, false); FX.glow(e.x, e.height * 0.6, e.z, 2, VL.c, 0.2, 'star'); } },
            onAlly: a => { heal(h, a, hl); if (FX.near(a.x, a.z, 45)) { FX.heal(a, VL.c); vlNote(a.x, a.height + 0.3, a.z, VL.c, 0.9, 0.9); } } });
          vlEncore(h);
        }
      },
      {
        key: 'W', name: 'Луч софита', icon: 'vlspot', cd: 11, cost: 60, range: 9, ind: { type: 'ally' }, anim: 'point', animDur: 0.4, lock: 0.15, ai: { t: 'healAlly' },
        desc: 'Вельвет направляет софит на союзного героя (до 9) или на себя: он лечится, получает щит на 3 сек и 2 сек бежит на 20% быстрее.',
        cast(h, p) {
          const o = p.unit && p.unit.alive && p.unit.team === h.team ? p.unit : h;
          heal(h, o, D(h, 55, 16, 0, 0.4)); shield(h, o, D(h, 45, 14, 0, 0.3), 3, VL.c); addBuff(o, { id: 'vlspot', dur: 2, ms: 0.2, src: h });
          SFX.at('chime', o.x, o.z, 0.6); SFX.at('heal', o.x, o.z, 0.5); SFX.at('note', h.x, h.z, 0.4); vlSpot(h, o); vlEncore(h);
        }
      },
      {
        key: 'E', name: 'Фортиссимо', icon: 'vlff', cd: 13, cost: 60, range: 0, ind: { type: 'self', r: 4 }, anim: 'cast', animDur: 0.4, lock: 0.15, ai: { t: 'nova', r: 3.6 },
        desc: 'Вельвет берёт ноту во всю мощь: враги в радиусе 4 получают магический урон и отлетают от неё, а сама она 2 сек бежит на 25% быстрее.',
        cast(h) {
          const dmg = D(h, 60, 18, 0, 0.45);
          for (const e of enemiesIn(h, h.x, h.z, 4)) { if (e.struct) continue; damage(h, e, dmg, 1); if (e.alive) knock(e, h.x, h.z, 2.8, 0.25); if (FX.near(e.x, e.z, 45)) FX.hit(e.x, e.height * 0.6, e.z, VL.c, true); }
          addBuff(h, { id: 'vlff', dur: 2, ms: 0.25, src: h });
          SFX.at('sonic', h.x, h.z, 1); SFX.at('chord', h.x, h.z, 0.6); SFX.at('boom', h.x, h.z, 0.35);
          if (FX.near(h.x, h.z, 55)) {
            for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; vlArc(h.x, h.z, a, 1, i % 2 ? VL.vio : VL.c, 0.4, { travel: 3 }); vlNote(h.x + Math.sin(a) * 2, 1, h.z + Math.cos(a) * 2, i % 2 ? VL.gold : VL.pale, 0.8, 0.8); }
            for (let i = 0; i < 3; i++) after(i * 0.08, () => FX.ring(h.x, h.z, { r0: 0.5, r1: 4.4, color: i === 1 ? VL.vio : VL.c, life: 0.35, tex: i ? 'ringThin' : 'shock' }));
            FX.shock(h.x, h.z, 4, 1.2, 0.4); FX.glow(h.x, h.height, h.z, 5, VL.pale, 0.2, 'flare'); FX.light(h.x, 2.5, h.z, VL.c, 2.5, 12, 0.3); FX.shake(0.15);
          }
          vlEncore(h);
        }
      },
      {
        key: 'R', name: 'Гала-концерт', icon: 'vlult', cd: 90, cost: 120, range: 0, ind: { type: 'self', r: 9 }, anim: 'heroic', animDur: 0.6, lock: 0.5, ai: { t: 'rally', r: 9, ult: true },
        desc: 'Вельвет даёт концерт: 6 сек вокруг неё — сцена радиусом 9, которая идёт за ней. Каждую секунду союзные герои на сцене лечатся, наносят на 12% больше урона и получают «На бис»; каждые полсекунды нота летит во врага на сцене (вражеские герои — первыми) и наносит магический урон. В конце финальный аккорд: все враги на сцене получают магический урон и замедляются на 40% на 1.5 сек.',
        cast(h) { vlConcert(h, 6, D(h, 18, 6, 0, 0.15), D(h, 28, 9, 0, 0.22), D(h, 90, 30, 0, 0.5)); vlEncore(h); }
      }
    ]
  }
);

/* ---------- icons ---------- */
Object.assign(GLYPH, {
  // a quaver with a small star by it
  vlinn(T) { T.E(-8, 12, 9, 7); T.g.fillRect(-1, -20, 4, 32); T.S(4, 1, -20, 14, -12, 12, -2); T.al(0.7, () => T.star(14, 14, 7, 3, 5)); },
  // arcs of sound flying off to the right
  vlnote(T) { T.C(-18, 0, 6); for (let i = 0; i < 3; i++) T.al(1 - i * 0.25, () => { T.g.lineWidth = 4; T.g.beginPath(); T.g.arc(-18, 0, 12 + i * 10, -0.8, 0.8); T.g.stroke(); }); },
  // a spotlight cone falling from above onto a small figure
  vlspot(T) { T.al(0.45, () => T.P(-6, -26, 6, -26, 20, 20, -20, 20)); T.g.fillRect(-9, -28, 18, 6); T.C(0, 4, 4.5); T.P(-6, 20, 6, 20, 4, 9, -4, 9); },
  // full rings of sound around a point
  vlff(T) { T.C(0, 0, 5); for (let i = 0; i < 3; i++) T.al(1 - i * 0.25, () => T.O(0, 0, 11 + i * 7, 3)); },
  // a microphone on a stand, notes either side
  vlult(T) { T.E(0, -14, 7, 9); T.g.fillRect(-1.5, -5, 3, 26); T.g.fillRect(-10, 20, 20, 3); T.al(0.7, () => { T.E(-18, 2, 4, 3); T.g.fillRect(-15.5, -12, 2, 14); T.E(17, -2, 4, 3); T.g.fillRect(19.5, -16, 2, 14); }); }
});
