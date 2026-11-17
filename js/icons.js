'use strict';
/* ===== icons: every ability and item icon is drawn here. A glyph is painted as a white mask, tinted with a light-to-deep gradient of the owner's colour,
   then laid over a dark tinted plate with a drop shadow, a glow and white highlights ===== */
const $ = id => document.getElementById(id);
const css = h => '#' + h.toString(16).padStart(6, '0');
const _icons = {};
const _mix = (c, d, k) => { const r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255, R = (d >> 16) & 255, G2 = (d >> 8) & 255, B = d & 255; return 'rgb(' + Math.round(r + (R - r) * k) + ',' + Math.round(g + (G2 - g) * k) + ',' + Math.round(b + (B - b) * k) + ')'; };

/* drawing kit shared by all glyphs: coordinates run from about -28 to 28 around the centre of the plate */
const IK = {
  g: null, his: null,
  L(...p) { const g = this.g; g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); },
  S(w, ...p) { this.g.lineWidth = w; this.L(...p); this.g.stroke(); },                       // open stroked line
  P(...p) { this.L(...p); this.g.closePath(); this.g.fill(); },                              // filled polygon
  C(x, y, r) { const g = this.g; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); },         // disc
  O(x, y, r, w) { const g = this.g; g.lineWidth = w || 3; g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke(); },   // ring
  A(x, y, r, a0, a1, w) { const g = this.g; g.lineWidth = w || 4; g.beginPath(); g.arc(x, y, r, a0, a1); g.stroke(); },   // arc
  E(x, y, rx, ry, w, rot) { const g = this.g; g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, TAU); if (w) { g.lineWidth = w; g.stroke(); } else g.fill(); },
  Q(w, x1, y1, cx, cy, x2, y2) { const g = this.g; g.lineWidth = w; g.beginPath(); g.moveTo(x1, y1); g.quadraticCurveTo(cx, cy, x2, y2); g.stroke(); },   // curved stroke
  arrow(x1, y1, x2, y2, s, w) { const a = Math.atan2(y2 - y1, x2 - x1); this.S(w || 4, x1, y1, x2, y2); this.S(w || 4, x2 - Math.cos(a - 0.55) * s, y2 - Math.sin(a - 0.55) * s, x2, y2, x2 - Math.cos(a + 0.55) * s, y2 - Math.sin(a + 0.55) * s); },
  head(x, y, a, s) { this.P(x + Math.cos(a) * s, y + Math.sin(a) * s, x + Math.cos(a + 2.4) * s, y + Math.sin(a + 2.4) * s, x + Math.cos(a - 2.4) * s, y + Math.sin(a - 2.4) * s); },   // solid arrowhead
  star(x, y, r1, r2, n, rot, stroke) { const g = this.g; g.beginPath(); for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * TAU + (rot === undefined ? -Math.PI / 2 : rot), r = i % 2 ? r2 : r1; i ? g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r) : g.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); if (stroke) { g.lineWidth = stroke; g.stroke(); } else g.fill(); },
  drop(x, y, s) { const g = this.g; g.beginPath(); g.moveTo(x, y - 12 * s); g.quadraticCurveTo(x + 10 * s, y + 3 * s, x, y + 8 * s); g.quadraticCurveTo(x - 10 * s, y + 3 * s, x, y - 12 * s); g.fill(); },
  blade(x1, y1, x2, y2, w) { const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy), nx = -dy / l * w / 2, ny = dx / l * w / 2, sx = x1 + dx * 0.8, sy = y1 + dy * 0.8; this.P(x1 + nx, y1 + ny, sx + nx, sy + ny, x2, y2, sx - nx, sy - ny, x1 - nx, y1 - ny); },   // tapered blade from hilt to point
  sword(x1, y1, x2, y2, w) { const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l; this.blade(x1 + ux * 9, y1 + uy * 9, x2, y2, w); this.S(4, x1, y1, x1 + ux * 9, y1 + uy * 9); this.S(3.5, x1 + ux * 9 - uy * 7, y1 + uy * 9 + ux * 7, x1 + ux * 9 + uy * 7, y1 + uy * 9 - ux * 7); },
  shield(x, y, s, w) { const g = this.g; g.beginPath(); g.moveTo(x, y - 22 * s); g.lineTo(x + 18 * s, y - 15 * s); g.quadraticCurveTo(x + 19 * s, y + 8 * s, x, y + 23 * s); g.quadraticCurveTo(x - 19 * s, y + 8 * s, x - 18 * s, y - 15 * s); g.closePath(); if (w) { g.lineWidth = w; g.stroke(); } else g.fill(); },
  skull(x, y, s) { this.C(x, y - 3 * s, 13 * s); this.g.fillRect(x - 7 * s, y + 5 * s, 14 * s, 9 * s); this.cut(() => { this.C(x - 5.2 * s, y - 2 * s, 3.7 * s); this.C(x + 5.2 * s, y - 2 * s, 3.7 * s); this.P(x, y + 2 * s, x - 2 * s, y + 6 * s, x + 2 * s, y + 6 * s); for (const q of [-3.5, 0, 3.5]) this.g.fillRect(x + q * s - 0.7 * s, y + 9 * s, 1.4 * s, 6 * s); }); },
  fist(x, y, s, a) { const g = this.g; g.save(); g.translate(x, y); g.rotate(a || 0); g.scale(s, s); g.beginPath(); g.moveTo(-7, -9); g.lineTo(6, -9); g.quadraticCurveTo(11, -9, 11, -4); g.lineTo(11, 5); g.quadraticCurveTo(11, 9, 6, 9); g.lineTo(-7, 9); g.closePath(); g.fill(); g.fillRect(-15, -6, 9, 12);
    for (const q of [-6.6, -2.2, 2.2, 6.6]) { g.beginPath(); g.arc(10.5, q * 0.95, 2.7, 0, TAU); g.fill(); } g.globalCompositeOperation = 'destination-out'; g.lineWidth = 1.3; for (const q of [-4.4, 0, 4.4]) { g.beginPath(); g.moveTo(3, q * 0.95); g.lineTo(12, q * 0.95); g.stroke(); } g.lineWidth = 1.6; g.beginPath(); g.moveTo(-3, 3); g.lineTo(4, 3); g.lineTo(4, 9); g.stroke(); g.restore(); },
  flame(x, y, s) { const g = this.g; g.beginPath(); g.moveTo(x, y - 24 * s); g.bezierCurveTo(x + 16 * s, y - 6 * s, x + 20 * s, y + 6 * s, x + 10 * s, y + 18 * s); g.bezierCurveTo(x + 4 * s, y + 24 * s, x - 4 * s, y + 24 * s, x - 10 * s, y + 18 * s); g.bezierCurveTo(x - 20 * s, y + 6 * s, x - 10 * s, y - 2 * s, x - 8 * s, y - 10 * s); g.bezierCurveTo(x - 4 * s, y - 4 * s, x, y - 8 * s, x, y - 24 * s); g.fill(); },
  bolt(x, y, s) { this.P(x + 6 * s, y - 24 * s, x - 10 * s, y + 2 * s, x, y + 2 * s, x - 6 * s, y + 24 * s, x + 12 * s, y - 4 * s, x + 2 * s, y - 4 * s); },
  heart(x, y, s) { const g = this.g; g.beginPath(); g.moveTo(x, y + 16 * s); g.bezierCurveTo(x - 26 * s, y - 2 * s, x - 14 * s, y - 22 * s, x, y - 8 * s); g.bezierCurveTo(x + 14 * s, y - 22 * s, x + 26 * s, y - 2 * s, x, y + 16 * s); g.fill(); },
  moon(x, y, r) { const g = this.g; g.beginPath(); g.arc(x, y, r, 0.6, TAU - 0.6); g.arc(x + r * 0.45, y, r * 0.75, TAU - 0.95, 0.95, true); g.closePath(); g.fill(); },
  wolf(x, y, s) { this.P(x - 13 * s, y - 16 * s, x - 5 * s, y - 6 * s, x + 5 * s, y - 6 * s, x + 13 * s, y - 16 * s, x + 12 * s, y + 3 * s, x + 4 * s, y + 16 * s, x - 4 * s, y + 16 * s, x - 12 * s, y + 3 * s); this.cut(() => { this.P(x - 8 * s, y - 1 * s, x - 2.5 * s, y + 2 * s, x - 7 * s, y + 4 * s); this.P(x + 8 * s, y - 1 * s, x + 2.5 * s, y + 2 * s, x + 7 * s, y + 4 * s); }); },
  card(x, y, w, h, a) { const g = this.g; g.save(); g.translate(x, y); g.rotate(a || 0); g.lineWidth = 2.6; g.strokeRect(-w / 2, -h / 2, w, h); g.globalAlpha *= 0.28; g.fillRect(-w / 2, -h / 2, w, h); g.restore(); },
  cut(fn) { const g = this.g; g.save(); g.globalCompositeOperation = 'destination-out'; g.globalAlpha = 1; fn(); g.restore(); },   // punch a hole
  al(a, fn) { const g = this.g; g.save(); g.globalAlpha = a; fn(); g.restore(); },                                                    // translucent part
  rot(a, fn, x, y) { const g = this.g; g.save(); g.translate(x || 0, y || 0); g.rotate(a); fn(); g.restore(); },
  hi(fn) { this.his.push(fn); }                                                                                                      // white highlight, drawn over the tinted glyph
};

const GLYPH = {
  /* ---------- generic ---------- */
  dash(T) { for (let i = -1; i <= 1; i++) T.S(4.5, -10 + i * 12, -15, 3 + i * 12, 0, -10 + i * 12, 15); },
  shield(T) { T.al(0.4, () => T.shield(0, 0, 1)); T.shield(0, 0, 1, 4); T.S(3.5, 0, -12, 0, 12); T.S(3.5, -9, -3, 9, -3); },
  quake(T) { T.S(4, -26, 16, -13, 8, -6, 16, 4, 0, 10, 14, 26, 9); T.P(-15, 0, -8, -20, -1, -3); T.P(6, -5, 13, -25, 20, -7); T.S(2.5, -20, 23, -10, 21); T.S(2.5, 4, 23, 18, 20); },
  blade(T) { T.sword(-19, 19, 20, -20, 9); T.hi(() => T.S(1.6, -8, 6, 14, -16)); },
  vortex(T) { const g = T.g; g.lineWidth = 4; g.beginPath(); for (let i = 0; i < 60; i++) { const a = i / 60 * 5 * Math.PI, r = 3 + i * 0.37; i ? g.lineTo(Math.cos(a) * r, Math.sin(a) * r) : g.moveTo(Math.cos(a) * r, Math.sin(a) * r); } g.stroke(); T.C(0, 0, 3.5); },
  skull(T) { T.skull(0, -1, 1.35); },
  fire(T) { T.flame(0, 1, 1); T.cut(() => T.flame(1, 9, 0.48)); T.hi(() => T.al(0.8, () => T.E(1, 13, 3, 5))); },
  pillar(T) { T.S(13, 0, 13, 0, -24); T.E(0, 16, 21, 7, 3); T.hi(() => T.S(3, 0, 10, 0, -22)); },
  meteor(T) { T.C(-9, 11, 12); T.S(3.5, 1, 2, 23, -22); T.S(3, -3, -4, 12, -25); T.S(3, 7, 7, 25, -9); T.cut(() => { T.C(-13, 8, 2.6); T.C(-6, 15, 2); }); T.hi(() => T.A(-9, 11, 8, 3.4, 4.6, 2)); },
  arrow(T) { T.S(4, -21, 21, 12, -12); T.head(17, -17, -Math.PI / 4, 11); T.S(3, -21, 21, -24, 12); T.S(3, -21, 21, -12, 24); },
  arrows(T) { for (const [x, a] of [[-15, -0.16], [0, 0], [15, 0.16]]) T.rot(a, () => { T.S(3.5, 0, 22, 0, -14); T.head(0, -20, -Math.PI / 2, 8); }, x, 0); },
  leap(T) { T.A(0, 15, 23, Math.PI * 1.08, Math.PI * 1.9, 4.5); T.head(21, 7, 1.25, 10); T.S(3, -26, 21, -14, 21); },
  bolt(T) { T.bolt(0, 0, 1.05); T.hi(() => T.S(1.6, 4, -18, -5, 0)); },
  beam(T) { T.S(11, -22, 22, 22, -22); T.hi(() => T.S(3, -22, 22, 22, -22)); T.S(2.5, -24, 6, -12, -6); T.S(2.5, 6, 24, 18, 12); },
  heal(T) { T.S(10, 0, -19, 0, 19); T.S(10, -19, 0, 19, 0); T.hi(() => { T.S(2.2, -3, -17, -3, -6); T.S(2.2, -17, -3, -6, -3); }); },
  fist(T) { T.fist(-2, 0, 1.45, 0); T.S(3, 20, -14, 27, -19); T.S(3, 22, 0, 29, 0); T.S(3, 20, 14, 27, 19); },
  spin(T) { T.A(0, 0, 18, 0.5, Math.PI - 0.25, 4.5); T.A(0, 0, 18, Math.PI + 0.5, TAU - 0.25, 4.5); T.head(-17, -5, -1.5, 9); T.head(17, 5, 1.6, 9); T.C(0, 0, 4); },
  ring(T) { for (const r of [9, 16, 23]) T.O(0, 0, r, 3); T.C(0, 0, 3.5); },
  frosteye(T) { T.Q(3.5, -26, 0, 0, -23, 26, 0); T.Q(3.5, -26, 0, 0, 23, 26, 0); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU, c = Math.cos(a), s = Math.sin(a); T.S(2.6, 0, 0, c * 11, s * 11); T.S(2, c * 6, s * 6, c * 6 + Math.cos(a + 0.9) * 4.2, s * 6 + Math.sin(a + 0.9) * 4.2); T.S(2, c * 6, s * 6, c * 6 + Math.cos(a - 0.9) * 4.2, s * 6 + Math.sin(a - 0.9) * 4.2); } T.hi(() => T.C(0, 0, 2.2)); },
  /* ---------- Riku: the three signs and the vow ---------- */
  jchain(T) { T.C(0, -15, 8.5); T.blade(-17, 21, -22, 2, 6); T.blade(-13, 21, -8, 2, 6); T.C(-15, 20, 4.2); T.al(0.35, () => T.g.fillRect(7, 5, 15, 17)); T.g.lineWidth = 2.6; T.g.strokeRect(7, 5, 15, 17); T.A(0, 4, 25, -0.95, -0.2, 2.2); T.A(0, 4, 25, 1.15, 1.95, 2.2); T.A(0, 4, 25, 3.35, 4.1, 2.2); T.hi(() => T.C(-3, -18, 2.2)); },
  jrock(T) { T.fist(1, 3, 1.55, -0.35); T.A(0, 2, 25, 2.3, 3.6, 3); T.A(0, 2, 25, 5.2, 6.2, 3); T.S(2.6, -24, -14, -17, -20); T.S(2.6, 18, 22, 24, 15); T.hi(() => { T.S(1.8, -6, -9, 8, -13); T.C(16, -18, 2.2); }); },
  jscis(T) { T.blade(-5, 14, -16, -25, 9); T.blade(5, 14, 16, -25, 9); T.E(0, 16, 11, 9); T.cut(() => T.S(2, -7, 14, 7, 14)); T.al(0.5, () => { T.Q(3, -22, -4, 0, -14, 22, -4); }); T.hi(() => { T.S(1.6, -8, 4, -14, -18); T.S(1.6, 8, 4, 14, -18); }); },
  jpaper(T) { T.P(-11, 0, 11, 0, 12, 20, -9, 22); for (let i = 0; i < 4; i++) T.S(5.6, -8.4 + i * 5.6, 2, -10.5 + i * 7, -19 + Math.abs(i - 1.5) * 3.5); T.S(5.6, 11, 12, 21, 3); T.al(0.45, () => T.O(1, 9, 25, 2.4)); T.hi(() => T.C(1, 11, 4.5)); },
  jvow(T) { T.P(0, -27, 6, -6, 14, -17, 12, 6, 21, 0, 13, 23, -13, 23, -21, 0, -12, 6, -14, -17, -6, -6); T.cut(() => { T.P(-9, 11, -2, 14, -9, 16); T.P(9, 11, 2, 14, 9, 16); }); T.hi(() => T.S(1.8, 0, -20, 0, -4)); },
  /* ---------- the Ashen One, the Chess Master, Mei ---------- */
  ashinn(T) { T.S(5, -20, 12, 8, 12); T.S(5, 10, 12, 16, 12); T.hi(() => T.S(5, 17, 12, 21, 12)); T.Q(3, 12, 4, 20, -4, 10, -12); T.Q(3, 10, -12, 2, -18, 12, -25); T.al(0.5, () => T.Q(3, 2, 4, 8, -4, 0, -12)); },
  ashride(T) { T.C(0, -17, 6.5); T.P(-8, -9, 8, -9, 6, 3, -6, 3); T.al(0.55, () => { T.C(0, 7, 7.5); T.P(-11, 15, 11, 15, 13, 26, -13, 26); }); T.S(3, -8, -2, -14, 8); T.S(3, 8, -2, 14, 8); T.hi(() => T.C(8, -19, 2)); },
  ashzone(T) { T.al(0.35, () => T.E(0, 8, 25, 12)); T.E(0, 8, 25, 12, 3); for (const [x, y, r] of [[-10, 4, 3], [6, 10, 3.5], [14, 3, 2.5], [-2, 13, 2.5], [-16, 11, 2]]) T.C(x, y, r); T.Q(3, -8, -4, -16, -12, -6, -22); T.Q(3, 8, -6, 16, -14, 6, -24); T.hi(() => T.C(6, 10, 1.6)); },
  ashcloud(T) { T.C(-10, 2, 10); T.C(4, -4, 12); T.C(14, 4, 8); T.C(0, 8, 9); T.cut(() => { T.S(2.4, -14, 2, -4, 2); T.S(2.4, 2, -4, 12, -4); }); T.arrow(-24, 20, 12, 20, 7, 3.4); T.hi(() => T.C(8, -8, 2.4)); },
  ashtray(T) { T.E(0, 10, 22, 9, 4); T.al(0.4, () => T.E(0, 10, 18, 6)); for (let i = 0; i < 5; i++) { const a = -2.6 + i * 0.5; T.S(4, Math.cos(a) * 10, 8 + Math.sin(a) * 4, Math.cos(a) * 26, -2 + Math.sin(a) * 22); } T.hi(() => { for (let i = 0; i < 5; i++) { const a = -2.6 + i * 0.5; T.C(Math.cos(a) * 26, -2 + Math.sin(a) * 22, 2.2); } }); },
  chboard(T) { for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) if ((i + j) % 2) T.g.fillRect(-22 + i * 11, -22 + j * 11, 11, 11); T.g.lineWidth = 3; T.g.strokeRect(-23, -23, 46, 46); T.hi(() => T.C(-5.5, 5.5, 3)); },
  chpawn(T) { T.C(0, -13, 8.5); T.P(-5, -5, 5, -5, 9, 12, -9, 12); T.P(-14, 12, 14, 12, 16, 22, -16, 22); T.S(3, -9, -4, 9, -4); T.hi(() => T.C(-3, -16, 2.2)); },
  chbishop(T) { T.E(0, -10, 8, 13); T.cut(() => T.S(2.6, -2, -18, 6, -6)); T.C(0, -25, 2.6); T.P(-5, 2, 5, 2, 9, 13, -9, 13); T.P(-14, 13, 14, 13, 16, 22, -16, 22); T.S(3, -8, 3, 8, 3); T.hi(() => T.S(1.6, -3, -14, -3, -4)); },
  chrook(T) { T.P(-11, -8, 11, -8, 9, 12, -9, 12); T.P(-14, -22, -8, -22, -8, -16, -3, -16, -3, -22, 3, -22, 3, -16, 8, -16, 8, -22, 14, -22, 14, -8, -14, -8); T.P(-15, 12, 15, 12, 17, 22, -17, 22); T.hi(() => T.S(1.8, -6, -3, -6, 8)); },
  chqueen(T) { T.P(-12, -6, -18, -20, -8, -12, 0, -24, 8, -12, 18, -20, 12, -6); for (const [x, y] of [[-18, -22], [0, -26], [18, -22]]) T.C(x, y, 2.8); T.P(-10, -6, 10, -6, 8, 12, -8, 12); T.P(-15, 12, 15, 12, 17, 22, -17, 22); T.hi(() => T.S(1.8, -5, -2, -5, 8)); },
  meicut(T) { T.blade(-3, 6, -22, -20, 8); T.blade(3, 6, 22, -20, 8); T.O(-8, 16, 6, 3); T.O(8, 16, 6, 3); T.C(0, 4, 3); T.A(0, 0, 25, 0.4, 2.74, 2.4); T.hi(() => { T.S(1.5, -6, 0, -16, -14); T.S(1.5, 6, 0, 16, -14); }); },
  meidive(T) { T.Q(3.4, -24, 14, -6, -30, 12, 0); T.head(13, 3, 1.1, 8); T.A(12, 16, 12, 3.3, 6.1, 3); for (const x of [0, 8, 16, 24]) T.P(x - 3, 20, x, 8 + (x % 16 ? 3 : 0), x + 3, 20); T.hi(() => T.C(-14, -2, 2)); },
  meiedge(T) { T.blade(-18, 20, 18, -22, 10); T.S(4, -22, 14, -12, 24); for (const [x, y] of [[8, 14], [-12, -8], [18, 2]]) { T.S(2, x - 5, y, x + 5, y); T.S(2, x, y - 5, x, y + 5); T.S(1.6, x - 3.5, y - 3.5, x + 3.5, y + 3.5); T.S(1.6, x - 3.5, y + 3.5, x + 3.5, y - 3.5); } T.hi(() => T.S(1.6, -8, 8, 10, -13)); },
  kaginn(T) { T.O(0, 0, 12, 6); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; T.head(Math.cos(a) * 21, Math.sin(a) * 21, a + 0.7, 6.5); } T.hi(() => T.A(0, 0, 12, 3.6, 4.9, 2)); },
  kagneedle(T) { T.blade(-14, 14, 24, -24, 6.5); T.cut(() => T.E(-8, 8, 1.7, 4, 0, 0.785)); T.Q(2.6, -12, 12, -28, 2, -16, -12); T.Q(2.6, -16, -12, -6, -24, 4, -20); T.Q(2.6, -12, 12, -4, 26, 12, 20); T.hi(() => T.S(1.4, -4, 4, 16, -16)); },
  kagsnip(T) { T.blade(-4, 8, -20, -20, 7.5); T.blade(4, 8, 20, -20, 7.5); T.O(-9, 18, 6, 3); T.O(9, 18, 6, 3); T.C(0, 6, 3.2); T.S(4.2, 0, -24, 0, -10); T.S(4.2, -7, -17, 7, -17); T.hi(() => { T.S(1.5, -6, 0, -15, -14); T.S(1.5, 6, 0, 15, -14); }); },
  kagdash(T) { T.S(2.2, -27, 21, 27, -21); T.head(13, -10, -0.66, 14); T.S(3.4, -22, 5, -8, -6); T.S(3.4, -12, 24, 4, 12); T.al(0.5, () => T.S(3, -4, 26, 8, 18)); T.hi(() => { T.C(-27, 21, 2.2); T.C(27, -21, 2.2); }); },
  kagnihil(T) { T.E(0, 0, 21, 10.5, 3.5); T.C(0, 0, 6.5); T.cut(() => T.g.fillRect(-1.3, -6, 2.6, 12)); for (const a of [-2.5, -2.05, -1.57, -1.09, -0.64, 0.64, 1.09, 1.57, 2.05, 2.5]) T.S(2.2, Math.cos(a) * 16, Math.sin(a) * 16, Math.cos(a) * 27, Math.sin(a) * 27); T.hi(() => T.C(2.5, -2.5, 1.7)); },
  lininn(T) { T.drop(0, 3, 2.1); T.cut(() => { T.S(4.6, 0, -3, 0, 13); T.S(4.6, -8, 5, 8, 5); }); T.hi(() => T.Q(1.8, -9, 8, -9, 16, -2, 18)); },
  linwall(T) { [[-20, 12], [-10, 22], [0, 16], [10, 25], [20, 13]].forEach(([x, h], i) => { T.al(i % 2 ? 1 : 0.7, () => T.P(x - 4.2, 22, x - 4.2, -h + 6, x, -h, x + 4.2, -h + 6, x + 4.2, 22)); }); T.S(3, -27, 23.5, 27, 23.5); T.hi(() => { T.S(1.4, -10, -14, -10, 10); T.S(1.4, 10, -17, 10, 8); }); },
  linslow(T) { T.C(0, -10, 8.5); T.O(0, -10, 13.5, 2.4); T.E(0, 15, 24, 8, 3.2); T.al(0.35, () => T.E(0, 15, 24, 8)); T.S(2.2, -14, 15, -5, 12, -1, 18, 8, 13, 15, 17); T.hi(() => T.C(-3, -13, 2.2)); },
  linheal(T) { T.C(0, 0, 15); T.cut(() => { T.S(5.2, 0, -8.5, 0, 8.5); T.S(5.2, -8.5, 0, 8.5, 0); }); T.O(0, 0, 21.5, 2.4); T.star(19, -19, 5.5, 2, 4); T.star(-20, 18, 4, 1.6, 4); T.hi(() => T.A(0, 0, 15, 3.5, 4.6, 1.8)); },
  linrev(T) { T.al(0.3, () => T.P(-13, 25, -8, -25, 8, -25, 13, 25)); T.C(0, -7, 5.6); T.P(-7.5, 17, -4, 0.5, 4, 0.5, 7.5, 17); T.E(0, -18, 9, 3.4, 2.4); T.arrow(-21, 16, -21, -6, 6, 3.2); T.arrow(21, 16, 21, -6, 6, 3.2); T.hi(() => T.C(0, -7, 2)); },
  kwinn(T) { T.rot(-0.6, () => { T.S(5, -12, 0, 12, 0); T.g.fillRect(-21, -12, 9, 24); T.g.fillRect(12, -12, 9, 24); T.g.fillRect(-26, -7, 5, 14); T.g.fillRect(21, -7, 5, 14); }); T.star(17, -18, 6, 2.4, 4); T.hi(() => T.rot(-0.6, () => T.S(1.6, -18.5, -8, -18.5, 8))); },
  kwpump(T) { T.fist(-7, 9, 1.25, -1.57); T.S(4.6, 6, -6, 15, -17, 24, -6); T.S(4.6, 6, 8, 15, -3, 24, 8); T.al(0.5, () => T.S(4, 8, 21, 15, 12, 22, 21)); },
  kwroar(T) { T.P(-26, -5, -15, -5, -2, -17, -2, 17, -15, 5, -26, 5); T.A(-2, 0, 11, -0.95, 0.95, 3.6); T.A(-2, 0, 19, -0.9, 0.9, 3.6); T.al(0.6, () => T.A(-2, 0, 27, -0.8, 0.8, 3.2)); T.hi(() => T.S(1.6, -12, -4, -4, -11)); },
  kwspot(T) { T.al(0.35, () => T.shield(5, 3, 0.9)); T.shield(5, 3, 0.9, 3.6); T.Q(3.2, -27, 20, -24, -22, -6, -16); T.head(-4, -15, 0.25, 7); T.S(3.4, 5, -6, 5, 10); T.S(3.4, -3, 2, 13, 2); },
  kwchamp(T) { T.P(-14, -21, 14, -21, 10, -1, 4, 6, 4, 14, 11, 21, -11, 21, -4, 14, -4, 6, -10, -1); T.A(-14, -13, 7, 1.57, 4.71, 3); T.A(14, -13, 7, -1.57, 1.57, 3); T.hi(() => T.star(0, -10, 6.5, 2.8, 5)); },
  rkworm(T) { const g = T.g; g.lineCap = 'round'; T.Q(8, -22, 12, -14, -16, -3, 2); T.Q(8, -3, 2, 6, 18, 18, -2); T.C(19, -6, 6.5); g.lineCap = 'butt'; T.cut(() => { T.S(1.6, -16, 2, -11, -1); T.S(1.6, -8, -4, -3, -6); T.S(1.6, 3, 9, 8, 7); }); T.hi(() => { T.C(17, -8, 1.6); T.C(22, -7, 1.6); }); },
  rkpoo(T) { T.E(0, 16, 23, 8.5); T.E(0, 4, 17, 8); T.E(0, -7, 11, 7); T.P(-5, -11, 5, -25, 8, -9); T.cut(() => { T.C(-6, 3, 2.6); T.C(6, 3, 2.6); T.A(0, 12, 7, 0.35, 2.8, 2.2); }); T.hi(() => T.Q(1.8, -17, 15, -19, 21, -12, 22)); },
  rkplayer(T) { T.C(0, -11, 10); T.P(-21, 24, -17, 8, -6, 2, 6, 2, 17, 8, 21, 24); T.hi(() => T.A(0, -11, 10, 3.6, 4.7, 1.8)); },
  rktalent(T) { T.star(0, 1, 26, 11, 5); T.hi(() => T.al(0.6, () => T.star(0, 1, 11, 4.6, 5))); },
  rkboss(T) { T.P(-22, 15, -25, -13, -11, 1, 0, -19, 11, 1, 25, -13, 22, 15); T.g.fillRect(-22, 18, 44, 5.5); T.C(-25, -14, 3); T.C(25, -14, 3); T.C(0, -20, 3.2); T.hi(() => { T.C(0, 7, 3); T.C(-11, 9, 2); T.C(11, 9, 2); }); },
  rkkiller(T) { T.blade(-25, 25, 23, -23, 5.5); T.blade(25, 25, -23, -23, 5.5); T.skull(0, -3, 1.05); },
  rkusurp(T) { T.sword(0, 27, 0, -27, 7); T.P(-21, 10, -24, -12, -11, -1, -5, -9, 5, -9, 11, -1, 24, -12, 21, 10); T.g.fillRect(-21, 12, 42, 4.5); T.A(0, 6, 27, 0.55, 1.2, 2.4); T.A(0, 6, 27, 1.94, 2.59, 2.4); T.cut(() => T.g.fillRect(-1.6, -8, 3.2, 17)); T.hi(() => { T.C(-12, 4, 2); T.C(12, 4, 2); T.S(1.6, 0, -24, 0, -12); }); },
  akiinn(T) { T.E(0, 0, 25, 13, 3.5); T.C(0, 0, 9.5); T.cut(() => { T.C(0, 0, 4.5); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; T.S(1.4, Math.cos(a) * 6.2, Math.sin(a) * 6.2, Math.cos(a) * 8.6, Math.sin(a) * 8.6); } }); T.S(2.2, 0, 0, 0, -3.2); T.S(2.2, 0, 0, 2.6, 0); T.hi(() => T.C(-4.5, -4.5, 2)); },
  akikat(T) { T.blade(-21, 23, 23, -21, 6.5); T.S(5, -27, 29, -21, 23); T.S(4, -26, 17, -15, 28); for (const [x, y] of [[8, 0], [14, 9], [2, 12]]) T.drop(x, y, 0.42); T.hi(() => T.S(1.5, -10, 10, 14, -14)); },
  akismoke(T) { T.rot(-0.35, () => { T.g.fillRect(-20, 9, 34, 7); T.al(0.55, () => T.g.fillRect(-20, 9, 8, 7)); T.C(16, 12.5, 4); }); T.al(0.65, () => { T.Q(3, 13, 3, 4, -8, 13, -15); T.Q(3, 13, -15, 22, -22, 14, -27); }); T.hi(() => T.C(16, 6, 2.2)); },
  akistep(T) { for (let i = 0; i < 3; i++) T.al(0.3 + i * 0.3, () => { T.C(-16 + i * 12, -10, 5); T.P(-23 + i * 12, 20, -19 + i * 12, -2, -13 + i * 12, -2, -9 + i * 12, 20); }); T.arrow(-24, 25, 26, 25, 6, 3); T.E(22, -16, 7, 4, 2); T.hi(() => T.C(22, -16, 2)); },
  akifox(T) { T.P(0, 25, -16, 4, -22, -11, -17, -27, -8, -12, 8, -12, 17, -27, 22, -11, 16, 4); T.cut(() => { T.P(-14, -4, -5, -1, -7, -6); T.P(14, -4, 5, -1, 7, -6); T.C(0, 16, 2.6); T.P(-9, 9, 0, 14, 9, 9, 0, 11); }); T.hi(() => { T.S(1.6, -17, -21, -13, -12); T.S(1.6, 17, -21, 13, -12); }); },
  /* Frieren */
  frinn(T) { T.al(0.35, () => T.C(0, 0, 25)); T.O(0, 0, 18, 3); T.cut(() => T.C(0, 0, 12)); T.C(0, 0, 6); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; T.C(Math.cos(a) * 18, Math.sin(a) * 18, 2.6); } T.hi(() => T.C(-2, -2, 2)); },
  frzolt(T) { T.O(-14, 0, 12, 3); T.O(-14, 0, 7, 2); T.P(-6, -6, 28, -2.5, 28, 2.5, -6, 6); T.al(0.45, () => T.P(-6, -11, 28, -5, 28, 5, -6, 11)); T.hi(() => T.S(1.6, -2, 0, 26, 0)); },
  frbloom(T) { for (const [x, y, s] of [[-12, 4, 1], [10, -6, 1.15], [8, 16, 0.8]]) { for (let i = 0; i < 5; i++) { const a = i / 5 * TAU - Math.PI / 2; T.E(x + Math.cos(a) * 6.5 * s, y + Math.sin(a) * 6.5 * s, 4.6 * s, 2.8 * s, 0, a); } T.cut(() => T.C(x, y, 2.6 * s)); } T.al(0.5, () => T.S(2, -24, 24, 24, 24)); T.hi(() => T.C(10, -6, 1.8)); },
  frbarrier(T) { const hex = (x, y, r, w) => { const p = []; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; p.push(x + Math.cos(a) * r, y + Math.sin(a) * r); } p.push(p[0], p[1]); T.S(w, ...p); }; for (const [x, y] of [[0, 0], [-15, -9], [15, -9], [-15, 9], [15, 9], [0, -18], [0, 18]]) hex(x, y, 8.5, 2.6); T.al(0.35, () => T.C(0, 0, 8)); T.hi(() => T.C(0, 0, 2.2)); },
  frvolley(T) { for (const [x, y] of [[-17, -16], [0, -21], [17, -16]]) { T.O(x, y, 6, 2.4); T.S(3, x, y + 5, x * 0.4, 26); } T.al(0.4, () => T.E(0, 24, 18, 4)); T.hi(() => T.C(0, -21, 2)); },
  /* Lelouch */
  lelinn(T) { T.P(0, -24, 7, -6, 26, -14, 12, 4, 0, 26, -12, 4, -26, -14, -7, -6); T.cut(() => T.C(0, -2, 4)); T.hi(() => T.S(1.4, 0, -18, 0, -8)); },
  lelcheck(T) { T.g.fillRect(-12, 16, 24, 6); T.P(-8, 16, -5, -4, 5, -4, 8, 16); T.g.fillRect(-9, -9, 18, 5); T.C(0, -14, 6); T.g.fillRect(-1.8, -28, 3.6, 10); T.g.fillRect(-5, -25, 10, 3.4); T.al(0.4, () => { T.S(2.5, -24, 0, -14, 6); T.S(2.5, 24, 0, 14, 6); }); T.hi(() => T.S(1.4, -2, 0, -2, 12)); },
  lelknight(T) { T.P(-20, -20, 20, -20, 24, 26, 0, 14, -24, 26); T.cut(() => T.P(-12, -14, 12, -14, 14, 16, 0, 8, -14, 16)); T.al(0.6, () => T.shield(0, -2, 0.5)); T.hi(() => T.C(0, -10, 2)); },
  lelcastle(T) { const rook = x => { T.g.fillRect(x - 7, 8, 14, 5); T.P(x - 5, 8, x - 4, -6, x + 4, -6, x + 5, 8); for (const d of [-6, -1, 4]) T.g.fillRect(x + d, -12, 3.6, 6); }; rook(-14); rook(14); T.Q(3, -14, -16, 0, -30, 14, -16); T.head(14, -16, 1.2, 5); T.Q(3, 14, 22, 0, 30, -14, 22); T.head(-14, 22, -1.9, 5); T.hi(() => T.C(0, 0, 1.8)); },
  lelgeass(T) { T.P(0, 2, -9, -4, -27, -20, -15, -14, -10, -18, -6, -8, 0, -16, 6, -8, 10, -18, 15, -14, 27, -20, 9, -4); T.P(0, -6, 4, 4, 0, 27, -4, 4); T.O(0, 0, 26, 1.8); T.hi(() => T.C(0, -2, 2.4)); },
  /* Ichigo */
  ichblade(T) { T.P(-6, 24, -2, 24, 10, -22, 2, -26, -12, 10); T.al(0.5, () => T.S(3, -14, 22, -20, 28)); T.al(0.45, () => { T.A(4, -2, 20, -2.2, -0.9, 3); T.A(4, -2, 26, -2.1, -1.0, 2); }); T.hi(() => T.S(1.4, -4, 12, 4, -14)); },
  ichstep(T) { for (let i = 0; i < 3; i++) T.al(0.25 + i * 0.35, () => { T.C(-18 + i * 15, -12, 4.5); T.P(-24 + i * 15, 18, -21 + i * 15, -5, -15 + i * 15, -5, -12 + i * 15, 18); }); T.S(2.4, -26, 22, 26, 22); T.hi(() => T.C(12, -12, 1.8)); },
  ichgetsuga(T) { const g = T.g; g.beginPath(); g.arc(-10, 0, 26, -1.15, 1.15); g.arc(-18, 0, 22, 1.0, -1.0, true); g.closePath(); g.fill(); T.al(0.45, () => { g.beginPath(); g.arc(-22, 0, 22, -1.0, 1.0); g.arc(-28, 0, 19, 0.9, -0.9, true); g.closePath(); g.fill(); }); T.hi(() => T.A(-10, 0, 23, -0.7, 0.7, 1.6)); },
  ichhollow(T) { T.E(0, 2, 17, 21); T.cut(() => { T.E(-7, -2, 5, 3.6, 0, 0.3); T.E(7, -2, 5, 3.6, 0, -0.3); T.g.fillRect(-9, 11, 18, 3); }); T.P(-12, -14, -22, -28, -8, -18); T.P(12, -14, 22, -28, 8, -18); T.al(0.5, () => { T.g.fillRect(3, -18, 2.6, 34); T.g.fillRect(9, -16, 2.6, 30); }); T.hi(() => { T.C(-7, -2, 1.6); T.C(7, -2, 1.6); }); },
  /* Carlotta */
  carinn(T) { T.P(0, -26, 9, -6, 0, 26, -9, -6); T.al(0.55, () => { T.P(-17, -10, -11, 2, -17, 18, -23, 2); T.P(17, -10, 23, 2, 17, 18, 11, 2); }); T.hi(() => T.S(1.4, -2, -16, -4, 4)); },
  carfan(T) { for (const a of [-0.38, 0, 0.38]) T.rot(a, () => { T.P(0, -27, 3.5, -15, 0, -9, -3.5, -15); T.al(0.45, () => T.S(2.2, 0, -8, 0, 8)); }, 0, 14); T.C(0, 18, 5); T.hi(() => T.C(0, -12, 1.6)); },
  carshatter(T) { T.C(0, 0, 6); for (let i = 0; i < 7; i++) { const a = i / 7 * TAU, c = Math.cos(a), s = Math.sin(a); T.P(c * 8 - s * 3, s * 8 + c * 3, c * 26, s * 26, c * 8 + s * 3, s * 8 - c * 3); } T.hi(() => T.C(-1.5, -1.5, 1.8)); },
  carwaltz(T) { T.A(0, 0, 18, 0.4, 5.6, 4); T.head(18 * Math.cos(0.4), 18 * Math.sin(0.4), 2.1, 7); T.C(0, -6, 4.5); T.P(-6, 14, -3, -1, 3, -1, 6, 14); T.al(0.45, () => T.E(0, 18, 10, 3)); T.hi(() => T.C(0, -6, 1.5)); },
  carfinale(T) { T.g.fillRect(-20, -4, 30, 8); T.g.fillRect(-20, -4, 8, 16); T.P(10, -4, 27, 0, 10, 4); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.3; T.al(0.55, () => T.S(2, 18 + Math.cos(a) * 4, Math.sin(a) * 4, 18 + Math.cos(a) * 11, Math.sin(a) * 11)); } T.hi(() => T.S(1.4, -16, -1, 6, -1)); },
  agfinn(T) { for (const x of [-17, 0, 17]) { T.S(4.2, x - 7, -7, x + 7, 7); T.S(4.2, x - 7, 7, x + 7, -7); } T.al(0.45, () => { T.S(2, -27, 16, -20, 16); T.S(2, -12, 16, -5, 16); T.S(2, 3, 16, 10, 16); T.S(2, 18, 16, 25, 16); }); T.hi(() => T.C(17, 0, 2.2)); },
  agfball(T) { T.C(-2, 4, 17); T.cut(() => { T.A(-6, 8, 13, 3.6, 5.6, 2.2); T.A(4, 0, 11, 1.6, 3.4, 2.2); T.A(-2, 4, 9, 0.2, 1.9, 2); }); for (const [x, y] of [[13, -12], [-17, -9], [15, 15], [-4, -19]]) { T.S(2.2, -2 + x * 0.8, 4 + y * 0.8, -2 + x * 1.35, 4 + y * 1.35); T.C(-2 + x * 1.42, 4 + y * 1.42, 3); } T.Q(2.6, -14, 18, -24, 22, -18, 27); },
  agfbaste(T) { T.blade(0, -27, 0, 16, 5.5); T.cut(() => T.E(0, -21, 1.4, 3.6)); for (const [x, y] of [[-23, 4], [23, 4], [-16, 23], [16, 23]]) { T.S(1.8, 0, -19, x, y); T.head(x * 0.6, -19 + (y + 19) * 0.6, Math.atan2(-19 - y, -x), 5.5); } T.hi(() => T.S(1.4, -1.5, -12, -1.5, 8)); },
  agfpatch(T) { T.al(0.4, () => T.g.fillRect(-17, -17, 34, 34)); const g = T.g; g.save(); g.setLineDash([5, 4]); g.lineWidth = 3; g.strokeRect(-21, -21, 42, 42); g.restore(); T.heart(0, 2, 0.72); T.hi(() => T.S(1.6, -8, -6, -4, -9)); },
  agfthread(T) { T.blade(-27, 27, 27, -27, 4.5); T.cut(() => T.E(-22, 22, 1.2, 3.2, 0, 0.785)); T.Q(2.6, -16, 10, -9, -16, 2, -12); T.Q(2.6, 2, -12, 14, -12, 17, 10); T.Q(2.6, 17, 10, 0, 28, -16, 10); for (const [x, y] of [[-16, 10], [2, -12], [17, 10]]) T.C(x, y, 6); T.hi(() => T.C(2, -12, 2)); },
  meiscent(T) { T.drop(-14, -6, 1.2); T.drop(2, 4, 0.9); T.drop(14, 12, 0.65); T.al(0.6, () => T.Q(3, -22, 10, -2, 26, 24, 20)); T.P(-6, -24, 2, -12, 10, -24, 16, -12, 24, -22, 22, -8, -4, -8); T.hi(() => T.C(-16, -8, 2)); },
  /* ---------- support items ---------- */
  purse(T) { T.E(0, 7, 17, 15); T.P(-7, -9, 7, -9, 13, -22, 5, -17, 0, -23, -5, -17, -13, -22); T.cut(() => T.S(2.6, -10, -8, 10, -8)); T.hi(() => { T.O(0, 8, 6.5, 2.4); T.S(2, 0, 4, 0, 12); }); },
  flask(T) { T.P(-5, -22, 5, -22, 5, -9, -5, -9); T.S(3.5, -8, -23, 8, -23); T.C(0, 7, 16); T.cut(() => T.C(0, 7, 12)); T.al(0.6, () => { const g = T.g; g.beginPath(); g.arc(0, 7, 11, 0.15, Math.PI - 0.15); g.closePath(); g.fill(); }); T.hi(() => T.C(-5, 2, 2.4)); },
  horn(T) { T.Q(9, -21, 13, -4, 17, 9, -8); T.Q(5, -24, 12, -22, 16, -18, 13); T.E(12, -12, 9, 5, 0, -0.95); T.cut(() => T.E(13, -13, 5, 2.4, 0, -0.95)); T.A(13, -13, 13, -1.75, -0.2, 2.6); T.A(13, -13, 19, -1.65, -0.3, 2.2); },
  gust(T) { T.arrow(-23, 0, 21, 0, 10, 4.6); T.S(3.4, -16, -13, 6, -13); T.S(3.4, -8, 13, 12, 13); T.al(0.6, () => { T.S(2.6, -24, -7, -12, -7); T.S(2.6, -22, 7, -14, 7); }); T.hi(() => T.S(1.6, -8, -2, 8, -2)); },
  veil(T) { T.al(0.32, () => T.shield(0, 0, 1)); T.shield(0, 0, 1, 3.4); T.Q(3, -12, -8, 0, -15, 12, -8); T.Q(3, -12, 1, 0, -6, 12, 1); T.Q(3, -9, 10, 0, 3, 9, 10); T.hi(() => T.C(0, -17, 2)); },
  censer(T) { T.S(2.4, 0, -25, 0, -7); T.S(2.4, 0, -25, -12, -6); T.S(2.4, 0, -25, 12, -6); T.P(-14, -6, 14, -6, 9, 11, -9, 11); T.S(3.4, -6, 16, 6, 16); T.S(3, 0, 11, 0, 16); T.cut(() => { T.C(-6, 1, 2.2); T.C(6, 1, 2.2); T.C(0, 4, 2.2); }); T.hi(() => T.S(1.6, -11, -3, 11, -3)); },
  reliq(T) { T.heart(0, 4, 1.05); T.cut(() => { T.S(4.6, 0, -8, 0, 10); T.S(4.6, -8, 0, 8, 0); }); T.A(0, -4, 24, -2.5, -0.64, 2.6); T.hi(() => T.C(-9, -7, 2.2)); },
  banner(T) { T.S(4, -15, -25, -15, 25); T.P(-13, -23, 19, -23, 11, -11, 19, 1, -13, 1); T.cut(() => T.shield(0, -11, 0.36)); T.C(-15, -25, 3.4); T.hi(() => T.S(1.6, -10, -20, 8, -20)); },
  halo(T) { T.E(0, -15, 17, 6, 4); T.star(0, 8, 16, 6.5, 4); T.hi(() => T.al(0.75, () => T.star(0, 8, 6.5, 2.6, 4))); },
  storm(T) { T.A(-7, -8, 10, Math.PI * 0.85, Math.PI * 1.9, 4.5); T.A(8, -9, 11, Math.PI * 1.1, Math.PI * 2.15, 4.5); T.S(4.5, -15, -2, 18, -2); T.bolt(0, 13, 0.55); T.S(3, -14, 6, -18, 18); T.S(3, 14, 6, 11, 16); },
  trap(T) { const g = T.g; g.lineWidth = 3; g.beginPath(); for (let i = 0; i <= 20; i++) { const a = i / 20 * TAU, r = i % 2 ? 12 : 22; i ? g.lineTo(Math.cos(a) * r, Math.sin(a) * r) : g.moveTo(Math.cos(a) * r, Math.sin(a) * r); } g.stroke(); T.C(0, 0, 4.5); },
  rain(T) { for (let i = 0; i < 5; i++) { const x = -20 + i * 10.5, y = (i % 2) * 9; T.S(3, x + 3, -24 + y, x - 2, 8 + y); T.head(x - 3, 14 + y, 1.72, 6.5); } },
  orb(T) { T.C(0, 0, 14); T.O(0, 0, 22, 2.2); T.hi(() => T.al(0.75, () => T.C(-5, -5, 4))); },
  drain(T) { T.drop(0, 2, 1.75); T.C(-19, 14, 4); T.C(20, 7, 3); T.hi(() => T.al(0.7, () => T.E(-4, 6, 2.2, 5, 0, 0.4))); },
  shard(T) { T.P(14, -25, 7, 6, -14, 25, -7, -6); T.hi(() => T.S(1.8, 12, -20, -11, 20)); T.P(-20, -12, -14, -22, -12, -10); T.P(18, 10, 24, 20, 14, 18); },
  snow(T) { for (let i = 0; i < 6; i++) { const a = i / 6 * TAU, c = Math.cos(a), s = Math.sin(a); T.S(3, 0, 0, c * 24, s * 24); T.S(3, c * 14 + Math.cos(a + 1) * 7, s * 14 + Math.sin(a + 1) * 7, c * 14, s * 14, c * 14 + Math.cos(a - 1) * 7, s * 14 + Math.sin(a - 1) * 7); } T.C(0, 0, 3.5); },
  void(T) { T.O(0, 0, 17, 5); T.al(0.3, () => T.C(0, 0, 14)); T.A(0, 0, 25, 0.3, 1.6, 2.2); T.A(0, 0, 25, 3.4, 4.7, 2.2); T.C(0, 0, 4); },
  boot(T) { T.P(-9, -21, -9, 12, 19, 12, 19, 4, 5, -1, 5, -21); T.S(4, -13, 19, 21, 19); T.cut(() => T.S(2, -9, -12, 5, -12)); },
  star(T) { T.star(0, 1, 24, 10, 5); T.hi(() => T.al(0.6, () => T.star(0, 1, 10, 4, 5))); },
  nova(T) { T.star(0, 0, 25, 11, 8, 0, 3.2); T.C(0, 0, 6); },
  hook(T) { T.S(5, -16, -22, -16, 6); T.A(0, 6, 16, Math.PI * 0.25, Math.PI, 5); T.P(10, -6, 23, -9, 17, 5); T.O(-16, -24, 4, 3); },
  chain(T) { for (let i = 0; i < 3; i++) T.E(-14 + i * 14, 14 - i * 14, 10, 5.5, 4, -Math.PI / 4); },
  axe(T) { T.S(5, -19, 21, 12, -14); const g = T.g; g.beginPath(); g.moveTo(1, -23); g.quadraticCurveTo(27, -23, 23, 5); g.lineTo(10, -8); g.closePath(); g.fill(); T.hi(() => T.Q(1.8, 6, -20, 22, -19, 21, 0)); },
  fox(T) { T.P(-18, -21, -6, -7, 6, -7, 18, -21, 16, 6, 0, 23, -16, 6); T.cut(() => { T.P(-11, -1, -3, 2, -10, 6); T.P(11, -1, 3, 2, 10, 6); T.P(-2, 15, 2, 15, 0, 18); }); },
  moon(T) { T.moon(-2, 0, 22); T.star(15, -14, 5, 2, 4); },
  scope(T) { T.O(0, 0, 18, 3); T.S(3, 0, -26, 0, -9); T.S(3, 0, 9, 0, 26); T.S(3, -26, 0, -9, 0); T.S(3, 9, 0, 26, 0); T.C(0, 0, 3); },
  wind(T) { T.Q(4, -24, -10, 6, -22, 14, -8); T.A(11, -3, 6, -1.2, 2.2, 4); T.Q(4, -26, 4, 0, 0, 22, 6); T.Q(4, -20, 17, 2, 22, 12, 14); T.A(9, 10, 5, -1, 2.4, 4); },
  /* ---------- Brand ---------- */
  ramshield(T) { T.shield(7, 0, 0.9); T.cut(() => T.S(3, 7, -11, 7, 11)); for (const y of [-12, 0, 12]) T.S(3.5, -27, y, -14 - Math.abs(y) * 0.2, y); },
  bastion(T) { T.P(-20, 22, -20, -8, -14, -8, -14, -16, -6, -16, -6, -8, 6, -8, 6, -16, 14, -16, 14, -8, 20, -8, 20, 22); T.cut(() => { T.P(-5, 22, -5, 8, 0, 3, 5, 8, 5, 22); T.S(2, -20, 0, 20, 0); }); T.S(3, -25, -22, 25, -22); },
  ironwill(T) { T.heart(0, -1, 1.25); T.cut(() => T.shield(0, -3, 0.5)); T.shield(0, -3, 0.5, 2.5); },
  /* ---------- Keira ---------- */
  kunai(T) { T.blade(-2, 2, 22, -22, 11); T.S(4, -2, 2, -12, 12); T.O(-17, 17, 5, 3); T.S(2.5, -24, -6, -12, -18); T.S(2.5, -8, 24, 4, 12); },
  vanish(T) { T.al(0.35, () => { T.C(-12, -14, 6); T.P(-20, 20, -18, -4, -6, -4, -4, 20); }); T.C(12, -14, 6); T.P(4, 20, 6, -4, 18, -4, 20, 20); T.S(2.5, -3, -2, 3, -2); T.S(2.5, -3, 8, 3, 8); },
  bladefan(T) { for (let i = -2; i <= 2; i++) T.rot(i * 0.48, () => T.blade(0, -6, 0, -31, 7), 0, 21); T.C(0, 21, 4.5); },
  execute(T) { T.skull(0, 6, 0.95); T.rot(0.7, () => T.blade(0, 4, 0, -30, 6), -15, -2); T.rot(-0.7, () => T.blade(0, 4, 0, -30, 6), 15, -2); },
  /* ---------- Mora ---------- */
  firepillar(T) { T.flame(0, -4, 0.95); T.cut(() => T.flame(0, 2, 0.42)); T.E(0, 19, 22, 6, 3); T.S(3, -18, 8, -18, -4); T.S(3, 18, 8, 18, -4); },
  firering(T) { T.O(0, 2, 17, 4); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; T.rot(a, () => T.drop(0, -22, 0.6), 0, 2); } T.C(0, 2, 4); },
  /* ---------- Vale ---------- */
  roll(T) { T.A(0, 0, 17, 0.5, Math.PI * 1.75, 4.5); T.head(15, -11, -0.35, 10); T.C(0, 0, 5); T.S(3, -26, 22, -8, 22); T.S(3, 4, 22, 14, 22); },
  net(T) { T.O(0, 0, 22, 3); for (const q of [-11, 0, 11]) { T.S(2.2, q, -Math.sqrt(484 - q * q), q, Math.sqrt(484 - q * q)); T.S(2.2, -Math.sqrt(484 - q * q), q, Math.sqrt(484 - q * q), q); } T.bolt(14, -14, 0.4); },
  volley(T) { for (const [x, y] of [[-15, 4], [0, -4], [15, 4]]) { T.S(3.5, x, y + 20, x, y - 10); T.head(x, y - 16, -Math.PI / 2, 8); } T.S(2.5, -24, -18, -18, -24, -20, -14); T.S(2.5, 24, -18, 18, -24, 20, -14); },
  /* ---------- Oriel ---------- */
  sunbeam(T) { T.C(-12, -12, 9); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; if (a > 0.2 && a < 1.4) continue; T.S(3, -12 + Math.cos(a) * 13, -12 + Math.sin(a) * 13, -12 + Math.cos(a) * 19, -12 + Math.sin(a) * 19); } T.P(-6, -2, -2, -6, 26, 20, 20, 26); T.hi(() => T.S(1.8, -2, -2, 21, 21)); },
  ward(T) { T.shield(0, 0, 1, 4); T.al(0.3, () => T.shield(0, 0, 1)); T.C(0, -2, 6); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; T.S(2.4, Math.cos(a) * 9, -2 + Math.sin(a) * 9, Math.cos(a) * 13, -2 + Math.sin(a) * 13); } },
  flash(T) { T.star(0, 0, 26, 6, 4); T.star(0, 0, 17, 5, 4, -Math.PI / 4); T.cut(() => T.C(0, 0, 5)); T.hi(() => T.C(0, 0, 3)); },
  sanctuary(T) { T.A(0, 12, 23, Math.PI, TAU, 4); T.al(0.3, () => { const g = T.g; g.beginPath(); g.arc(0, 12, 23, Math.PI, TAU); g.fill(); }); T.S(4, -26, 13, 26, 13); T.S(6, 0, -9, 0, 7); T.S(6, -8, -1, 8, -1); T.S(2.5, -16, 21, 16, 21); },
  /* ---------- Groh ---------- */
  smash(T) { T.fist(0, -9, 1.35, Math.PI / 2); T.S(4, -26, 20, -11, 14, -4, 21, 5, 13, 12, 21, 26, 16); T.S(2.5, -20, 4, -25, -2); T.S(2.5, 20, 4, 25, -2); },
  roar(T) { T.P(-22, -10, -6, -10, 4, -20, 4, 20, -6, 10, -22, 10); T.A(4, 0, 12, -0.9, 0.9, 3.5); T.A(4, 0, 20, -0.9, 0.9, 3.5); T.A(4, 0, 28, -0.8, 0.8, 3); },
  stoneskin(T) { T.P(0, -25, 21, -12, 21, 12, 0, 25, -21, 12, -21, -12); T.cut(() => { T.S(2.2, 0, -25, 0, -6, -21, 12); T.S(2.2, 0, -6, 21, 12); T.S(2.2, -21, -12, -9, -1); T.S(2.2, 21, -12, 9, -1); }); },
  rockfall(T) { T.P(-20, -20, -8, -24, -2, -12, -12, -4, -22, -10); T.P(6, -8, 18, -12, 24, 0, 14, 8, 4, 2); T.P(-12, 6, -2, 4, 2, 14, -8, 18); T.S(2.5, -4, -26, -6, -18); T.S(2.5, 16, -24, 15, -16); T.S(4, -26, 24, 26, 24); },
  /* ---------- Nox ---------- */
  chainbolt(T) { T.C(-19, 15, 5.5); T.C(2, -3, 5.5); T.C(20, -19, 5.5); T.S(3.2, -19, 15, -12, 4, -7, 9, 2, -3); T.S(3.2, 2, -3, 8, -14, 13, -8, 20, -19); T.S(2.5, 12, 14, 20, 8, 17, 20, 25, 15); },
  field(T) { T.O(0, 0, 21, 3.5); T.al(0.25, () => T.C(0, 0, 21)); T.bolt(0, 0, 0.62); T.S(2.5, -27, -8, -22, -13); T.S(2.5, 27, 8, 22, 13); T.S(2.5, -10, 27, -14, 22); T.S(2.5, 10, -27, 14, -22); },
  thunderstep(T) { T.bolt(-8, 0, 0.95); T.S(4, 6, 18, 24, 18); T.head(26, 18, 0, 8); T.S(3, 8, 6, 20, 6); T.S(3, 10, -6, 18, -6); },
  /* ---------- Silva ---------- */
  beartrap(T) { T.A(0, 6, 21, Math.PI, TAU, 4); for (let i = 0; i < 5; i++) { const x = -16 + i * 8; T.P(x - 3.5, 6, x + 3.5, 6, x, -6 + Math.abs(i - 2) * 3); } T.S(4, -25, 6, 25, 6); for (let i = 0; i < 4; i++) { const x = -12 + i * 8; T.P(x - 3.5, 8, x + 3.5, 8, x, 18); } T.C(0, 22, 3.5); },
  eye(T) { const g = T.g; g.lineWidth = 3.5; g.beginPath(); g.moveTo(-26, 0); g.quadraticCurveTo(0, -24, 26, 0); g.quadraticCurveTo(0, 24, -26, 0); g.stroke(); T.C(0, 0, 9.5); T.cut(() => T.E(0, 0, 2.6, 7.5)); T.hi(() => T.C(-3.5, -3.5, 2)); },
  /* ---------- Morg ---------- */
  plagueorb(T) { T.C(0, -4, 14); T.drop(-9, 17, 0.6); T.drop(1, 21, 0.5); T.drop(11, 16, 0.55); T.cut(() => { T.C(-5, -7, 3); T.C(5, -2, 2.4); T.C(-2, 3, 1.8); }); },
  soul(T) { const g = T.g; g.beginPath(); g.moveTo(0, -24); g.bezierCurveTo(18, -24, 20, -2, 14, 8); g.quadraticCurveTo(10, 16, 16, 24); g.quadraticCurveTo(4, 22, 0, 14); g.quadraticCurveTo(-6, 22, -14, 20); g.quadraticCurveTo(-8, 12, -14, 4); g.bezierCurveTo(-20, -8, -16, -24, 0, -24); g.fill(); T.cut(() => { T.E(-5, -8, 3, 4.5); T.E(6, -8, 3, 4.5); }); },
  plague(T) { T.skull(0, 4, 0.95); for (const x of [-16, 0, 16]) T.Q(3, x, -14, x + 6, -19, x, -24); },
  miasma(T) { T.C(-11, -4, 11); T.C(6, -9, 13); T.C(15, 3, 9); T.C(-2, 5, 11); T.cut(() => { T.C(-4, -3, 3); T.C(7, -3, 3); }); for (const x of [-14, -2, 10]) T.S(3, x, 19, x - 2, 26); },
  /* ---------- Aisa ---------- */
  icelance(T) { T.blade(-20, 20, 22, -22, 12); T.hi(() => T.S(1.8, -14, 14, 17, -17)); T.P(-22, 8, -14, 4, -18, 14); T.P(-8, 22, -4, 14, -14, 18); T.star(14, 12, 6, 2, 4); },
  tomb(T) { T.P(0, -26, 14, -12, 12, 22, -12, 22, -14, -12); T.cut(() => { T.S(2, 0, -26, 0, 22); T.S(2, -14, -12, 0, -2, 14, -12); }); T.S(3, -22, 24, 22, 24); T.star(-19, -12, 5, 2, 4); T.star(20, 2, 4, 1.6, 4); },
  blizzard(T) { T.rot(0, () => { for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; T.S(2.8, 0, 0, Math.cos(a) * 12, Math.sin(a) * 12); } }, 6, -8); T.Q(3.5, -26, -2, -6, 8, 14, 4); T.Q(3.5, -22, 10, 0, 20, 24, 12); T.Q(3, -14, 21, 4, 27, 16, 22); T.C(-18, -16, 2.5); T.C(-8, -22, 2); T.C(22, -18, 2.2); },
  /* ---------- Cassius ---------- */
  lunge(T) { T.blade(-8, 6, 26, -16, 5); T.A(-10, 8, 7, 0.4, 3.9, 3.5); T.S(3.5, -14, 12, -22, 17); T.S(2.6, -26, -8, -10, -14); T.S(2.6, -24, 2, -14, -2); },
  riposte(T) { T.sword(-20, 20, 20, -20, 7); T.sword(20, 20, -20, -20, 7); T.star(0, -1, 9, 3.5, 4, 0); },
  windblade(T) { T.blade(-18, 20, 14, -22, 9); T.S(4, -18, 20, -22, 25); T.Q(3, 2, 14, 18, 12, 22, 0); T.Q(3, -2, 22, 16, 24, 26, 12); T.Q(3, -22, -6, -16, -20, -4, -22); },
  bladestorm(T) { for (let i = 0; i < 4; i++) T.rot(i * Math.PI / 2, () => { T.blade(4, -6, 22, -14, 7); }, 0, 0); T.A(0, 0, 24, 0.2, 1.1, 2.5); T.A(0, 0, 24, 3.34, 4.24, 2.5); T.C(0, 0, 5); },
  /* ---------- Zar ---------- */
  voidorb(T) { T.O(0, 0, 13, 5); T.al(0.3, () => T.C(0, 0, 11)); for (let i = 0; i < 3; i++) T.rot(i * TAU / 3, () => T.Q(3, 14, -8, 26, -6, 22, 8), 0, 0); T.C(0, 0, 3.5); },
  rift(T) { T.P(-3, -27, 5, -12, -2, -6, 8, 6, 0, 12, 4, 27, -8, 10, 0, 4, -10, -8, -2, -13); T.S(2.5, -22, -14, -14, -10); T.S(2.5, 14, 12, 23, 16); T.S(2.5, 14, -16, 22, -22); T.S(2.5, -24, 14, -15, 18); },
  voidmaw(T) { const g = T.g; g.lineWidth = 3.5; g.beginPath(); g.moveTo(-26, 0); g.quadraticCurveTo(0, -26, 26, 0); g.quadraticCurveTo(0, 26, -26, 0); g.fill(); T.cut(() => { g.beginPath(); g.moveTo(-18, 0); g.quadraticCurveTo(0, -14, 18, 0); g.quadraticCurveTo(0, 14, -18, 0); g.fill(); }); for (let i = 0; i < 5; i++) { const x = -12 + i * 6; T.P(x - 2.6, -8 + Math.abs(i - 2) * 2.5, x + 2.6, -8 + Math.abs(i - 2) * 2.5, x, 0); T.P(x - 2.6, 8 - Math.abs(i - 2) * 2.5, x + 2.6, 8 - Math.abs(i - 2) * 2.5, x, 1); } },
  singularity(T) { T.C(0, 0, 9); T.E(0, 0, 25, 8, 3.5, -0.45); T.E(0, 0, 17, 5, 2.5, -0.45); T.cut(() => T.C(0, 0, 6)); T.O(0, 0, 9, 2.5); T.star(-18, -18, 4, 1.5, 4); T.star(20, 16, 3.5, 1.4, 4); },
  /* ---------- Grimm ---------- */
  grip(T) { T.fist(0, 0, 1.5, -Math.PI / 2); T.E(0, 17, 11, 4.5, 3.5); T.E(0, 24, 11, 4.5, 3.5); },
  shackle(T) { T.O(-13, -4, 10, 4.5); T.O(13, -4, 10, 4.5); T.E(0, -4, 5, 3, 3); T.S(3.5, -13, 6, -13, 14); T.S(3.5, 13, 6, 13, 14); T.P(-22, 14, 22, 14, 18, 24, -18, 24); },
  /* ---------- Ragna ---------- */
  bloodthirst(T) { T.drop(0, 2, 1.8); T.cut(() => { T.P(-7, 4, -3, 4, -5, 13); T.P(3, 4, 7, 4, 5, 13); T.S(2, -9, 3, 9, 3); }); },
  fury(T) { T.flame(0, 0, 1.05); T.cut(() => T.heart(0, 9, 0.5)); T.hi(() => T.al(0.85, () => T.heart(0, 9, 0.32))); },
  /* ---------- Yuki ---------- */
  foxfire(T) { T.flame(-13, 6, 0.55); T.flame(13, 6, 0.55); T.flame(0, -10, 0.7); T.hi(() => T.al(0.8, () => { T.C(0, -2, 2.5); T.C(-13, 11, 2); T.C(13, 11, 2); })); },
  charmheart(T) { T.heart(0, 0, 1.2); T.cut(() => T.heart(0, 0, 0.62)); T.hi(() => T.al(0.8, () => T.heart(0, 1, 0.35))); T.star(20, -18, 5, 2, 4); T.star(-21, 14, 4, 1.6, 4); },
  spiritstep(T) { T.al(0.3, () => T.wolf(-14, 4, 0.75)); T.al(0.6, () => T.wolf(0, 0, 0.9)); T.wolf(14, -4, 1.0); },
  /* ---------- Virr ---------- */
  aimshot(T) { T.O(8, -8, 13, 3); T.S(3, 8, -26, 8, -15); T.S(3, 8, -1, 8, 8); T.S(3, -10, -8, 1, -8); T.S(3, 15, -8, 26, -8); T.C(8, -8, 2.6); T.P(-24, 24, -20, 12, -8, 8, -12, 20); T.S(3, -14, 14, -4, 4); },
  caltrops(T) { for (const [x, y, s] of [[-12, -8, 1], [12, -4, 0.85], [-2, 13, 0.95]]) { for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.4; T.blade(x, y, x + Math.cos(a) * 12 * s, y + Math.sin(a) * 12 * s, 5 * s); } T.C(x, y, 3 * s); } },
  /* ---------- Lira ---------- */
  song(T) { T.E(-11, 14, 7, 5, 0, -0.4); T.E(12, 9, 7, 5, 0, -0.4); T.S(3.5, -5, 13, -5, -17, 18, -22, 18, 8); T.S(5, -5, -11, 18, -16); T.S(4, 18, -4, 18, 4); },
  lull(T) { for (let k = 0; k < 3; k++) { const g = T.g, y = -14 + k * 14, amp = 9 - k * 4; g.lineWidth = 3.5; g.beginPath(); for (let i = 0; i <= 24; i++) { const x = -25 + i * 50 / 24, yy = y + Math.sin(i / 24 * TAU * 1.5) * amp; i ? g.lineTo(x, yy) : g.moveTo(x, yy); } g.stroke(); } },
  tailwind(T) { for (const s of [-1, 1]) { T.P(s * 3, 4, s * 12, -22, s * 27, -12, s * 22, -6, s * 26, 0, s * 18, 4, s * 20, 10, s * 8, 12); } T.S(4, 0, -6, 0, 22); T.head(0, -12, -Math.PI / 2, 8); },
  /* ---------- Hald ---------- */
  intercept(T) { T.shield(8, 0, 0.9, 4); T.al(0.3, () => T.shield(8, 0, 0.9)); T.S(4, -26, 0, -6, 0); T.head(-2, 0, 0, 9); T.S(2.5, -24, -10, -14, -10); T.S(2.5, -24, 10, -14, 10); },
  shieldbash(T) { T.shield(-7, 0, 0.9); T.cut(() => T.S(3, -7, -10, -7, 10)); T.star(17, 0, 12, 4.5, 6, 0); },
  oath(T) { T.sword(0, 24, 0, -26, 7); T.O(-9, 8, 8, 3.2); T.O(9, 8, 8, 3.2); },
  phalanx(T) { T.al(0.55, () => { T.shield(-15, -3, 0.6); T.shield(15, -3, 0.6); }); T.shield(0, 3, 0.85); T.cut(() => T.shield(0, 3, 0.85, 2)); T.shield(0, 3, 0.72); T.cut(() => T.S(2.5, 0, -6, 0, 12)); },
  /* ---------- Nisa ---------- */
  thread(T) { T.S(3.5, -22, 22, 18, -18); T.head(22, -22, -Math.PI / 4, 7); T.cut(() => T.E(13, -13, 1.6, 4, 0, Math.PI / 4)); T.Q(2.4, -22, 22, -26, 0, -8, -6); T.Q(2.4, -8, -6, 8, -12, 2, 8); T.Q(2.4, 2, 8, -2, 20, 14, 22); },
  lifeline(T) { T.heart(8, -6, 0.75); T.Q(2.8, -26, 22, -22, 0, -8, 2); T.Q(2.8, -8, 2, 4, 6, 8, -4); T.C(-26, 22, 3); },
  web(T) { for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; T.S(2, 0, 0, Math.cos(a) * 26, Math.sin(a) * 26); } for (const r of [9, 17, 24]) { const g = T.g; g.lineWidth = 2; g.beginPath(); for (let i = 0; i <= 8; i++) { const a = i / 8 * TAU, a2 = (i - 0.5) / 8 * TAU; if (i) g.quadraticCurveTo(Math.cos(a2) * r * 0.8, Math.sin(a2) * r * 0.8, Math.cos(a) * r, Math.sin(a) * r); else g.moveTo(r, 0); } g.stroke(); } T.C(0, 0, 3); },
  cocoon(T) { T.E(0, 2, 14, 22); T.cut(() => { for (let i = -3; i <= 3; i++) T.S(1.8, -16, i * 6 + 4, 16, i * 6 - 2); }); T.S(3, 0, -20, 0, -27); T.S(2.5, -20, -16, -12, -12); T.S(2.5, 20, -16, 12, -12); },
  /* ---------- Shaya ---------- */
  spit(T) { T.drop(8, -6, 1.2); T.rot(0, () => { T.C(-12, 12, 4.5); T.C(-21, 20, 3); T.C(-4, 20, 2.6); }, 0, 0); T.cut(() => T.C(11, -2, 3)); T.S(2.5, 20, -22, 24, -26); },
  viper(T) { const g = T.g; g.lineWidth = 6; g.beginPath(); g.moveTo(-22, 22); g.bezierCurveTo(-4, 26, -18, 0, 0, 0); g.bezierCurveTo(16, 0, 4, -20, 16, -20); g.stroke(); T.P(10, -27, 26, -22, 12, -12); T.cut(() => T.C(17, -21, 1.8)); T.S(2.2, 24, -20, 29, -24); T.S(2.2, 24, -20, 30, -17); },
  sandveil(T) { T.A(0, 0, 20, 0.3, 2.4, 4); T.A(0, 0, 20, 3.44, 5.54, 4); T.A(0, 0, 11, 1.8, 4.2, 3.5); T.A(0, 0, 11, 4.9, 7.3, 3.5); for (const [x, y] of [[-24, -14], [24, 14], [-16, 22], [16, -22], [0, 0]]) T.C(x, y, 2.4); },
  bites(T) { for (const [x, y, a] of [[-12, -12, 0.3], [12, -6, -0.4], [-4, 12, 0.1]]) T.rot(a, () => { T.P(-8, -6, -3, -6, -5.5, 5); T.P(3, -6, 8, -6, 5.5, 5); T.A(0, -8, 9, Math.PI * 1.1, Math.PI * 1.9, 2.5); }, x, y); },
  /* ---------- Fenris ---------- */
  pounce(T) { for (const x of [-12, 0, 12]) T.Q(5, x - 6, -22, x + 6, -2, x - 4, 22); T.S(3, 20, -18, 26, -24); },
  howl(T) { T.moon(10, -10, 15); T.P(-24, 24, -22, 4, -14, -8, -10, 2, -2, -4, -6, 8, 0, 12, -6, 24); T.cut(() => T.C(-13, 4, 1.8)); },
  paw(T) { T.E(0, 9, 12, 10); for (const [x, y, r] of [[-15, -5, 5.5], [-6, -15, 6], [6, -15, 6], [15, -5, 5.5]]) T.E(x, y, r, r * 1.25); },
  pack(T) { T.al(0.5, () => { T.wolf(-15, -8, 0.7); T.wolf(15, -8, 0.7); }); T.wolf(0, 6, 1.05); },
  /* ---------- Reiji ---------- */
  iai(T) { T.S(6, -24, 14, 4, 4); T.S(3, -24, 14, -28, 16); T.blade(4, 4, 27, -4, 5); T.star(8, -14, 9, 3, 4); T.S(2.5, -14, -8, 2, -22); },
  parry(T) { T.sword(-22, 18, 14, -18, 8); T.A(8, 6, 14, -1.9, 0.6, 3.5); T.A(8, 6, 22, -1.7, 0.4, 3); T.star(10, -2, 6, 2.2, 4); },
  crescent(T) { T.moon(0, 0, 23); T.cut(() => T.S(2.5, -24, 14, 10, -24)); T.S(2.5, 8, 20, 22, 6); },
  sevencuts(T) { for (let i = 0; i < 7; i++) { const x = -21 + i * 7, o = (i % 2) * 6; T.blade(x - 5, 18 - o, x + 7, -20 + o, 4.2); } },
  /* ---------- Vint ---------- */
  laser(T) { T.P(-26, 18, -18, 26, -10, 18, -18, 10); T.S(9, -14, 14, 24, -24); T.hi(() => T.S(2.6, -14, 14, 24, -24)); T.star(22, -22, 9, 3, 4, 0.4); },
  rocket(T) { T.rot(Math.PI / 4, () => { T.P(0, -26, 8, -12, 8, 8, -8, 8, -8, -12); T.P(-8, 0, -16, 12, -8, 10); T.P(8, 0, 16, 12, 8, 10); T.S(3, -4, 14, -4, 22); T.S(3, 4, 14, 4, 22); T.S(3, 0, 14, 0, 27); T.cut(() => T.C(0, -8, 3.5)); }); },
  drone(T) { T.C(0, 4, 11); T.S(3, -11, 0, -22, -8); T.S(3, 11, 0, 22, -8); T.S(4, -28, -10, -14, -10); T.S(4, 14, -10, 28, -10); T.S(3, -5, 16, -8, 24); T.S(3, 5, 16, 8, 24); T.cut(() => T.C(0, 4, 5)); T.hi(() => T.C(0, 4, 2.2)); },
  core(T) { T.O(0, 0, 15, 5); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; T.S(4, Math.cos(a) * 18, Math.sin(a) * 18, Math.cos(a) * 25, Math.sin(a) * 25); } T.hi(() => T.bolt(0, 0, 0.48)); },
  /* ---------- Toplak ---------- */
  anchor(T) { T.S(5, 0, -14, 0, 20); T.S(5, -11, -6, 11, -6); T.A(0, 2, 18, 0.15, Math.PI - 0.15, 5); T.O(0, -19, 5, 3); T.P(-18, 5, -25, 0, -14, -1); T.P(18, 5, 25, 0, 14, -1); },
  bubbles(T) { for (const [x, y, r] of [[-10, 8, 11], [10, 2, 8], [0, -14, 6], [16, 16, 4], [-18, -10, 4]]) { T.O(x, y, r, 3); T.al(0.3, () => T.C(x, y, r)); } T.hi(() => { T.A(-10, 8, 7, 3.4, 4.4, 1.8); T.A(10, 2, 5, 3.4, 4.4, 1.5); }); },
  gut(T) { T.E(0, 2, 20, 18); T.cut(() => { T.Q(3, -12, -2, 0, 10, 12, -2); T.C(0, 6, 2.5); }); T.S(4, -22, -12, 22, -12); T.P(-5, -16, 5, -16, 5, -8, -5, -8); T.S(3, -8, 22, -10, 27); T.S(3, 8, 22, 10, 27); },
  jaws(T) { T.P(-25, -8, -17, 5, -9, -8, 0, 5, 9, -8, 17, 5, 25, -8, 25, -21, -25, -21); T.P(-25, 11, -17, -1, -9, 11, 0, -1, 9, 11, 17, -1, 25, 11, 25, 23, -25, 23); },
  /* ---------- Kolombina ---------- */
  card(T) { T.rot(0.25, () => { T.card(0, 0, 28, 42); T.P(0, -11, 8, 0, 0, 11, -8, 0); T.C(-9, -15, 2); T.C(9, 15, 2); }); },
  fan(T) { for (let i = -2; i <= 2; i++) T.rot(i * 0.42, () => T.card(0, -27, 18, 30), 0, 20); T.C(0, 20, 4.5); },
  deck(T) { for (let i = 0; i < 8; i++) T.rot(i / 8 * TAU, () => T.card(0, -18, 10, 14)); T.P(0, -8, 6, 0, 0, 8, -6, 0); },
  trump(T) { T.rot(-0.12, () => T.card(0, 2, 30, 44)); T.P(-12, 10, -14, -6, -6, 2, 0, -10, 6, 2, 14, -6, 12, 10); T.S(3, -12, 15, 12, 15); },
  shuffle(T) { T.rot(-0.3, () => T.card(0, 0, 18, 28), -11, 2); T.rot(0.3, () => T.card(0, 0, 18, 28), 11, 2); T.A(0, -6, 20, Math.PI * 1.2, Math.PI * 1.8, 3); T.head(13, -22, 0.5, 7); T.A(0, 10, 20, Math.PI * 0.2, Math.PI * 0.8, 3); T.head(-13, 26, 3.6, 7); },
  /* ---------- Kostyan ---------- */
  skate(T) { T.rot(-0.3, () => { const g = T.g; g.lineWidth = 5; g.beginPath(); g.moveTo(-24, -6); g.quadraticCurveTo(-20, 0, -14, 0); g.lineTo(14, 0); g.quadraticCurveTo(20, 0, 24, -6); g.stroke(); T.C(-12, 9, 5); T.C(12, 9, 5); T.S(3, -26, 18, -14, 18); T.S(3, -30, 10, -22, 10); }); },
  ollie(T) { T.rot(-0.55, () => { const g = T.g; g.lineWidth = 5; g.beginPath(); g.moveTo(-20, -4); g.quadraticCurveTo(-17, 0, -12, 0); g.lineTo(12, 0); g.quadraticCurveTo(17, 0, 20, -4); g.stroke(); T.C(-10, 7, 4); T.C(10, 7, 4); }, 2, -6); T.A(-2, 24, 20, Math.PI * 1.15, Math.PI * 1.85, 3); T.S(3, -24, 24, 24, 24); T.S(2.5, -20, 10, -24, 16); T.S(2.5, 16, 14, 20, 20); },
  skullthrow(T) { T.skull(6, -5, 1.0); T.S(3.5, -26, 6, -12, 2); T.S(3.5, -24, 16, -10, 10); T.S(3, -18, 24, -6, 18); },
  hellride(T) { T.O(-2, 6, 13, 5); T.C(-2, 6, 3.5); for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.4; T.S(2.5, -2 + Math.cos(a) * 4, 6 + Math.sin(a) * 4, -2 + Math.cos(a) * 11, 6 + Math.sin(a) * 11); } T.flame(14, -12, 0.5); T.flame(2, -18, 0.4); T.S(3, -26, 22, 22, 22); },
  /* ---------- Shiro ---------- */
  hunger(T) { const g = T.g; g.lineWidth = 3.5; g.beginPath(); g.moveTo(-25, 0); g.quadraticCurveTo(0, -24, 25, 0); g.quadraticCurveTo(0, 24, -25, 0); g.stroke(); T.C(0, 0, 9); T.S(2, -25, 0, -30, -8); T.S(2, 25, 0, 30, -8); T.S(2, -14, 12, -20, 22); T.S(2, 14, 12, 20, 22); T.cut(() => T.C(0, 0, 3.5)); },
  kagune(T) { for (const s of [-1, 1]) { T.Q(5.5, s * 4, 24, s * 31, 14, s * 21, -13); T.Q(5, s * 2, 24, s * 14, -2, s * 6, -26); T.head(s * 20, -17, -Math.PI / 2 + s * 0.3, 6); } },
  spikes(T) { T.S(3, -26, 22, 26, 22); T.P(-21, 22, -14, -6, -7, 22); T.P(-6, 22, 1, -26, 8, 22); T.P(9, 22, 15, -1, 21, 22); T.hi(() => { T.S(1.5, 1, -18, -2, 16); }); },
  feast(T) { T.P(-25, -8, -17, 5, -9, -8, 0, 5, 9, -8, 17, 5, 25, -8, 25, -21, -25, -21); T.P(-25, 11, -17, -1, -9, 11, 0, -1, 9, 11, 17, -1, 25, 11, 25, 23, -25, 23); T.cut(() => { T.C(-12, -15, 2.6); T.C(12, -15, 2.6); }); T.hi(() => T.drop(0, 3, 0.35)); },
  /* ---------- Kaisei ---------- */
  attract(T) { T.C(0, 0, 8); T.O(0, 0, 14, 2.2); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.52; T.S(3, Math.cos(a) * 27, Math.sin(a) * 27, Math.cos(a) * 19, Math.sin(a) * 19); T.head(Math.cos(a) * 16, Math.sin(a) * 16, a + Math.PI, 6); } T.hi(() => T.C(-2.5, -2.5, 2.4)); },
  repel(T) { T.C(0, 0, 7.5); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.52; T.S(3, Math.cos(a) * 12, Math.sin(a) * 12, Math.cos(a) * 21, Math.sin(a) * 21); T.head(Math.cos(a) * 25, Math.sin(a) * 25, a, 6); } T.hi(() => T.C(-2.5, -2.5, 2.2)); },
  infinity(T) { const g = T.g; g.lineWidth = 5.5; g.beginPath(); for (let i = 0; i <= 64; i++) { const t = i / 64 * TAU, q = 1 + Math.sin(t) * Math.sin(t), x = 27 * Math.cos(t) / q, y = 27 * Math.sin(t) * Math.cos(t) / q; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); T.O(0, 0, 25, 1.6); },
  purple(T) { T.C(8, -7, 15); T.S(3.5, -27, 20, -7, 6); T.S(3, -28, 8, -12, -2); T.S(3, -15, 26, 0, 14); T.cut(() => T.C(8, -7, 6)); T.O(8, -7, 20, 1.6); T.hi(() => T.A(8, -7, 11, 3.5, 4.6, 2)); },
  /* ---------- Umbra ---------- */
  longblade(T) { T.blade(-14, 14, 26, -26, 6); T.S(4, -14, 14, -22, 22); T.S(3.5, -20, 8, -8, 20); T.Q(2.4, -4, 16, 10, 14, 16, 4); T.Q(2.4, -16, 4, -14, -10, -4, -16); },
  blink(T) { const g = T.g; g.lineWidth = 3; g.setLineDash([3, 7]); g.beginPath(); g.arc(0, 12, 20, Math.PI, TAU); g.stroke(); g.setLineDash([]); T.O(-20, 12, 5, 3); T.P(20, 0, 28, 12, 20, 24, 12, 12); },
  mana(T) { T.al(0.35, () => T.P(0, -24, 13, 2, 0, 22, -13, 2)); const g = T.g; g.lineWidth = 3; T.L(0, -24, 13, 2, 0, 22, -13, 2); g.closePath(); g.stroke(); T.C(-22, -12, 3); T.C(22, -8, 3); T.C(-20, 16, 2.5); T.C(21, 17, 2.5); T.hi(() => T.S(1.6, -5, -4, 1, -16)); },
  atom(T) { T.C(0, 0, 8); T.O(0, 0, 16, 3); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, r = i % 2 ? 26 : 30; T.S(3, Math.cos(a) * 21, Math.sin(a) * 21, Math.cos(a) * r, Math.sin(a) * r); } T.hi(() => T.C(0, 0, 3.5)); },
  /* ---------- Rampage ---------- */
  carnage(T) { T.skull(0, 3, 1.05); T.P(-22, -8, -6, -20, 0, -12, 6, -20, 22, -8, 14, -6, 0, -27, -14, -6); T.drop(-17, 18, 0.5); T.drop(18, 16, 0.45); },
  scythe(T) { T.S(4.5, -17, 25, 11, -19); const g = T.g; g.beginPath(); g.moveTo(11, -19); g.quadraticCurveTo(-14, -32, -28, -4); g.quadraticCurveTo(-10, -15, 8, -11); g.closePath(); g.fill(); T.hi(() => T.Q(1.6, 6, -20, -12, -27, -22, -10)); T.drop(-24, 10, 0.4); },
  reap(T) { T.A(0, 16, 28, Math.PI * 1.13, Math.PI * 1.87, 7); T.A(0, 16, 16, Math.PI * 1.2, Math.PI * 1.8, 3); T.C(0, 16, 4); T.drop(-20, 20, 0.4); T.drop(21, 18, 0.45); },
  drops(T) { for (const [x, y, s] of [[-16, 11, 0.9], [0, 0, 1.25], [17, -12, 0.85]]) T.drop(x, y, s); T.hi(() => T.al(0.7, () => T.E(-3, 2, 1.6, 4, 0, 0.4))); T.S(2.5, -26, 24, 26, 24); },
  bloodmoon(T) { T.C(0, -6, 17); T.cut(() => T.C(7, -11, 13)); T.drop(0, 19, 0.6); T.drop(-11, 16, 0.4); T.drop(11, 16, 0.4); },
  /* ---------- Jin ---------- */
  stand(T) { T.al(0.45, () => { T.C(9, -12, 8); T.P(-4, 24, -2, 0, 4, -4, 14, -4, 22, 2, 22, 24); }); T.C(-9, -6, 6.5); T.P(-19, 24, -18, 6, -13, 2, -5, 2, 0, 6, 1, 24); T.star(18, -22, 5, 2, 4); },
  barrage(T) { T.fist(8, -14, 0.85, -0.1); T.fist(2, 2, 1.0, 0); T.fist(10, 17, 0.8, 0.12); for (const y of [-14, 2, 17]) T.S(2.8, -27, y, -14 - (y === 2 ? 4 : 0), y); T.S(2.4, -24, -6, -16, -6); T.S(2.4, -24, 10, -16, 10); },
  starfist(T) { T.fist(-3, 4, 1.25, -0.5); T.star(15, -15, 11, 4.4, 5); T.S(2.6, -24, 22, -16, 16); T.S(2.6, -14, 26, -8, 20); },
  standleap(T) { T.A(-2, 18, 22, Math.PI * 1.1, Math.PI * 1.85, 4.5); T.head(18, 6, 1.2, 9); T.star(-18, 18, 9, 3.5, 6, 0); T.S(2.5, -27, 26, -9, 26); },
  timestop(T) { T.O(0, 0, 22, 3.5); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; T.S(i % 3 ? 1.8 : 3, Math.cos(a) * 16.5, Math.sin(a) * 16.5, Math.cos(a) * 19.5, Math.sin(a) * 19.5); } T.S(3.5, 0, 0, 0, -13); T.S(3.5, 0, 0, 9, 5); T.C(0, 0, 3); T.hi(() => { T.S(3, -4, 8, -4, 16); T.S(3, 4, 8, 4, 16); }); },
  /* ---------- Hikaru ---------- */
  godeye(T) { T.Q(3.6, -26, 1, 0, -24, 26, 1); T.Q(3.6, -26, 1, 0, 24, 26, 1); T.C(0, 1, 10); T.cut(() => T.E(0, 1, 2.8, 8.5)); T.S(2.6, -15, -17, -19, -24); T.S(2.6, 0, -19, 0, -27); T.S(2.6, 15, -17, 19, -24); T.hi(() => T.C(-4, -3, 2.2)); },
  penstroke(T) { T.S(5, 23, -25, -1, 3); T.P(4, -4, -6, 8, -15, 19, -3, 11); T.cut(() => T.S(1.4, -4, 5, -12, 15)); T.Q(3.2, -26, 6, -20, 30, 24, 14); T.C(-22, -8, 2.6); T.C(15, 24, 2.2); T.hi(() => T.S(1.6, 20, -24, 5, -6)); },
  apple(T) { T.C(-6, 5, 14); T.C(6, 5, 14); T.cut(() => { T.C(0, -13, 5.5); T.C(22, 1, 8); T.C(0, 24, 5); }); T.S(3, 0, -9, 3, -22); T.P(4, -18, 17, -26, 14, -14); T.hi(() => T.al(0.75, () => T.E(-10, -1, 2.6, 6, 0, 0.4))); },
  alibi(T) { T.card(-11, 3, 17, 25, -0.4); T.card(1, -3, 17, 25, 0.02); T.card(13, 4, 17, 25, 0.42); T.A(0, 4, 27, 2.25, 3.5, 2.4); T.A(0, 4, 27, -0.45, 0.6, 2.4); T.hi(() => { T.S(1.6, -3, -9, 5, -9); T.S(1.6, -3, -4, 5, -4); T.S(1.6, -3, 1, 3, 1); }); },
  deathnote(T) { T.rot(-0.14, () => { const g = T.g; g.fillRect(-16, -24, 33, 48); g.fillRect(-21, -24, 3, 48); T.cut(() => { g.fillRect(-2.5, -15, 6, 27); g.fillRect(-9, -8, 19, 6); }); }); T.S(2.6, 14, 21, 26, 27); T.drop(24, 12, 0.34); },
  /* ---------- Dash ---------- */
  chrome(T) { const g = T.g; g.lineWidth = 3.6; g.strokeRect(-13, -13, 26, 26); for (const q of [-8, 0, 8]) { T.S(2.8, q, -13, q, -23); T.S(2.8, q, 13, q, 23); T.S(2.8, -13, q, -23, q); T.S(2.8, 13, q, 23, q); } T.bolt(0, 0, 0.46); },
  phantom(T) { T.O(-21, -9, 5.5, 2.4); T.arrow(-13, -9, 22, -9, 9, 4.6); T.al(0.6, () => { T.Q(3.6, 22, 5, 2, 30, -19, 9); T.head(-21, 7, -2.2, 8); }); T.S(2.4, -6, -19, 8, -19); T.S(2.4, -2, 1, 10, 1); },
  gorilla(T) { T.fist(7, 3, 1.4, -0.3); T.P(-28, 11, -15, -3, -11, 6, -24, 20); T.cut(() => T.S(1.6, -22, 9, -15, 2)); T.star(-16, -17, 8, 5.4, 6); T.cut(() => T.C(-16, -17, 2.6)); T.S(2.6, 24, -16, 28, -22); T.S(2.6, 27, -5, 32, -8); },
  sandy(T) { const g = T.g; for (let i = 0; i < 5; i++) { const w = 17 - i * 2.2; g.fillRect(-w / 2, -26 + i * 10.6, w, 7.4); } T.S(2.6, 0, -26, 0, 24); T.S(2.6, -26, -14, -13, -14); T.S(2.6, -24, -3, -12, -3); T.S(2.6, 13, 6, 26, 6); T.S(2.6, 12, 17, 24, 17); T.hi(() => { for (let i = 0; i < 5; i++) T.C(0, -22.3 + i * 10.6, 1.7); }); },
  exo(T) { T.C(0, -15, 5.5); T.S(5, -19, -5, 19, -5); T.S(5, 0, -5, 0, 9); T.S(5, 0, 9, -9, 26); T.S(5, 0, 9, 9, 26); T.S(4.5, -19, -5, -21, 12); T.S(4.5, 19, -5, 21, 12); T.C(-21, 15, 5.5); T.C(21, 15, 5.5); T.O(-22, -19, 5.5, 2.6); T.O(22, -19, 5.5, 2.6); T.hi(() => { T.C(-22, -19, 2); T.C(22, -19, 2); }); },
  /* ---------- Tokiko ---------- */
  stolentime(T) { T.S(4.5, -17, -25, 17, -25); T.S(4.5, -17, 25, 17, 25); T.S(2.6, -14, -22, -14, -14, -2, 0, -14, 14, -14, 22); T.S(2.6, 14, -22, 14, -14, 2, 0, 14, 14, 14, 22); T.al(0.45, () => T.P(-10, -17, 10, -17, 0, -3)); T.P(-11, 21, 11, 21, 0, 8); T.C(0, 3, 1.8); T.hi(() => T.S(1.6, -6, 18, 5, 18)); },
  bulletfast(T) { T.rot(-0.5, () => { const g = T.g; g.fillRect(-12, -7, 17, 14); g.beginPath(); g.moveTo(5, -7); g.quadraticCurveTo(22, -5, 25, 0); g.quadraticCurveTo(22, 5, 5, 7); g.closePath(); g.fill(); g.fillRect(-17, -8.5, 4, 17); T.cut(() => g.fillRect(-4, -7, 2.4, 14)); T.S(3, -22, -9, -34, -9); T.S(3, -24, 0, -38, 0); T.S(3, -22, 9, -34, 9); }, 4, 4); T.S(3.4, 19, 14, 19, 26); T.hi(() => T.rot(-0.5, () => T.S(1.6, -8, -3.5, 12, -3.5), 4, 4)); },
  bulletstop(T) { T.O(0, 0, 23, 3.2); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; T.S(i % 3 ? 1.6 : 2.8, Math.cos(a) * 17, Math.sin(a) * 17, Math.cos(a) * 20.5, Math.sin(a) * 20.5); } T.rot(-0.5, () => { const g = T.g; g.fillRect(-10, -5.5, 12, 11); g.beginPath(); g.moveTo(2, -5.5); g.quadraticCurveTo(13, -4, 15, 0); g.quadraticCurveTo(13, 4, 2, 5.5); g.closePath(); g.fill(); g.fillRect(-13.5, -6.5, 3, 13); }); T.hi(() => { T.S(2.6, -5, 9, -5, 16); T.S(2.6, 3, 9, 3, 16); }); },
  bulletback(T) { T.A(0, 0, 21, -1.1, 3.9, 4.2); T.head(10.5, -19.5, -0.25, 9); T.S(3.6, 0, 0, 0, -12); T.S(3.6, 0, 0, -9, 5); T.C(0, 0, 3.2); T.al(0.5, () => { T.A(0, 0, 13, 2.2, 4.4, 2.2); }); },
  devourtime(T) { T.C(0, 2, 21); T.cut(() => { T.C(17, -16, 14); T.S(3, 0, 2, 0, -11); T.S(3, 0, 2, -9, 8); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; T.C(Math.cos(a) * 16.5, 2 + Math.sin(a) * 16.5, i % 3 ? 1.1 : 1.8); } }); T.P(5, -11, 9, -3, 12, -10); T.P(11, -4, 17, 0, 17, -7); T.P(-1, -14, 3, -8, 6, -15); T.O(0, 2, 25.5, 1.8); T.drop(-22, -18, 0.4); },
};

function iconURL(type, color) {
  const key = type + color; if (_icons[key]) return _icons[key];
  const S = 96, c = document.createElement('canvas'), m = document.createElement('canvas'); c.width = c.height = m.width = m.height = S;
  const x = c.getContext('2d'), g = m.getContext('2d'), col = css(color), K = S / 72;
  // 1. the glyph as a white mask
  g.translate(S / 2, S / 2); g.scale(K, K); g.strokeStyle = g.fillStyle = '#fff'; g.lineWidth = 4; g.lineCap = 'round'; g.lineJoin = 'round';
  IK.g = g; IK.his = []; (GLYPH[type] || GLYPH.orb)(IK); const his = IK.his;
  // 2. tint it: light at the top, the colour itself in the middle, deeper at the bottom
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-in'; g.globalAlpha = 1;
  const tg = g.createLinearGradient(0, S * 0.14, 0, S * 0.9); tg.addColorStop(0, _mix(color, 0xffffff, 0.72)); tg.addColorStop(0.5, _mix(color, 0xffffff, 0.12)); tg.addColorStop(1, _mix(color, 0x000000, 0.38)); g.fillStyle = tg; g.fillRect(0, 0, S, S);
  // 3. the plate: dark, warmed by the colour, with a soft pool of light behind the glyph and a thin frame
  x.fillStyle = '#07080c'; x.fillRect(0, 0, S, S);
  const bg = x.createRadialGradient(S / 2, S * 0.46, 2, S / 2, S / 2, S * 0.74); bg.addColorStop(0, _mix(0x232a3a, color, 0.42)); bg.addColorStop(0.55, _mix(0x141821, color, 0.16)); bg.addColorStop(1, '#06070a'); x.fillStyle = bg; x.fillRect(0, 0, S, S);
  const sh = x.createLinearGradient(0, 0, S, S); sh.addColorStop(0, 'rgba(255,255,255,.09)'); sh.addColorStop(0.45, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(0,0,0,.28)'); x.fillStyle = sh; x.fillRect(0, 0, S, S);
  x.strokeStyle = _mix(color, 0x000000, 0.25); x.globalAlpha = 0.55; x.lineWidth = 2; x.strokeRect(3, 3, S - 6, S - 6); x.globalAlpha = 1;
  // 4. glyph: drop shadow, coloured glow, then the clean shape
  x.save(); x.shadowColor = 'rgba(0,0,0,.85)'; x.shadowBlur = 6; x.shadowOffsetY = 3; x.drawImage(m, 0, 0); x.restore();
  x.save(); x.shadowColor = col; x.shadowBlur = 16; x.globalAlpha = 0.9; x.drawImage(m, 0, 0); x.restore(); x.drawImage(m, 0, 0);
  // 5. white highlights
  if (his.length) { x.save(); x.translate(S / 2, S / 2); x.scale(K, K); x.strokeStyle = x.fillStyle = '#fff'; x.lineCap = 'round'; x.lineJoin = 'round'; x.shadowColor = '#fff'; x.shadowBlur = 5; x.globalAlpha = 0.9; IK.g = x; for (const f of his) f(); x.restore(); }
  IK.g = null; return (_icons[key] = c.toDataURL());
}
