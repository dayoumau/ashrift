'use strict';
/* ===== VFX: textures, soft/flame/smoke particles, velocity streaks, debris, ribbons, mesh effects, screen shockwaves ===== */
const TEX = {};
const RK = 1 / 0.9; // ring-like textures are drawn at 0.45*size radius
/* uniforms shared by every effect shader: time, the tiling noise texture, HDR gain, the camera's up-vector height (for the ground fade of sprites), soft-particle switch */
const FXU = { uT: { value: 0 }, uNz: { value: null }, uGain: { value: 1 }, uUp: { value: 0.55 }, uSoft: { value: 1 } };
/* a wrapping random lattice read with trilinear smoothing: the source of the baked noise texture and of the flipbook sheet */
const LAT_N = 32, LAT = new Float32Array(LAT_N * LAT_N * LAT_N);
for (let i = 0; i < LAT.length; i++) LAT[i] = Math.random();
function lat3(x, y, z, p) {   // p: period in lattice cells (the noise repeats every p units on x and y)
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), fx = smooth(x - xi), fy = smooth(y - yi), fz = smooth(z - zi), n = LAT_N, w = v => ((v % p) + p) % p;
  const x0 = w(xi), x1 = w(xi + 1), y0 = w(yi) * n, y1 = w(yi + 1) * n, z0 = (zi & 31) * n * n, z1 = ((zi + 1) & 31) * n * n, L = LAT;
  const ab = L[z0 + y0 + x0] + (L[z0 + y0 + x1] - L[z0 + y0 + x0]) * fx, cd = L[z0 + y1 + x0] + (L[z0 + y1 + x1] - L[z0 + y1 + x0]) * fx;
  const ef = L[z1 + y0 + x0] + (L[z1 + y0 + x1] - L[z1 + y0 + x0]) * fx, gh = L[z1 + y1 + x0] + (L[z1 + y1 + x1] - L[z1 + y1 + x0]) * fx;
  const a = ab + (cd - ab) * fy, b = ef + (gh - ef) * fy; return a + (b - a) * fz;
}
// 256 px tiling noise: three independent fractal channels (r, g: flow and erosion; b: fine grain)
function bakeNoise() {
  const S = 256, d = new Uint8Array(S * S * 4);
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
    const u = i / S, v = j / S, o = (j * S + i) * 4;
    for (let c = 0; c < 3; c++) {
      const z = c * 7.3 + 1.5, f = c === 2 ? 2 : 1;
      let n = lat3(u * 4 * f, v * 4 * f, z, 4 * f) * 0.5 + lat3(u * 8 * f, v * 8 * f, z + 3.1, 8 * f) * 0.28 + lat3(u * 16 * f, v * 16 * f, z + 5.7, 16 * f) * 0.22;
      d[o + c] = clamp((n - 0.5) * 1.7 + 0.5, 0, 1) * 255;
    }
    d[o + 3] = 255;
  }
  const t = new THREE.DataTexture(d, S, S, THREE.RGBAFormat); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = t.minFilter = THREE.LinearFilter; t.needsUpdate = true; return t;
}
// 6x6 sheet, 128 px cells: one puff that swells, churns upward and burns away. r = heat, g = thickness, a = coverage
function bakeFlipbook() {
  const GN = 6, C = 128, S = GN * C, d = new Uint8Array(S * S * 4), ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  for (let f = 0; f < GN * GN; f++) {
    const t = f / (GN * GN - 1), cx = (f % GN) * C, cy = Math.floor(f / GN) * C, grow = 0.6 + 0.38 * easeOut(t), thr = 0.04 + t * t * 0.8;
    for (let j = 0; j < C; j++) for (let i = 0; i < C; i++) {
      const x = (i + 0.5) / C * 2 - 1, y = (j + 0.5) / C * 2 - 1, r = Math.hypot(x, y); const o = ((cy + j) * S + cx + i) * 4;
      if (r > 0.99) continue;
      const n1 = lat3(x * 1.7 + 9, y * 1.7 + t * 1.5 + 4, t * 2.2, 32) * 0.62 + lat3(x * 3.6 + 2, y * 3.6 + t * 2.4, t * 3 + 7, 32) * 0.38, n2 = lat3(x * 7.5, y * 7.5 + t * 3.5, t * 4 + 13, 32);
      const dens = 1 - r / grow + (n1 - 0.5) * 1.15 + (n2 - 0.5) * 0.3, a = ss(thr, thr + 0.28, dens) * ss(0.98, 0.78, r);
      d[o] = clamp((dens - thr) * 1.5, 0, 1) * (1 - t * 0.55) * 255; d[o + 1] = clamp(0.25 + (dens - thr) * 0.9 + (n2 - 0.5) * 0.5, 0, 1) * 255; d[o + 2] = n2 * 255; d[o + 3] = a * 255;
    }
  }
  const tx = new THREE.DataTexture(d, S, S, THREE.RGBAFormat); tx.magFilter = tx.minFilter = THREE.LinearFilter; tx.needsUpdate = true; return tx;
}
function initTextures() {
  const T = (s, f) => { const c = document.createElement('canvas'); c.width = c.height = s; f(c.getContext('2d'), s); return new THREE.CanvasTexture(c); };
  const radial = (g, s, stops) => { const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); stops.forEach(k => r.addColorStop(k[0], 'rgba(255,255,255,' + k[1] + ')')); g.fillStyle = r; g.fillRect(0, 0, s, s); };
  TEX.glow = T(128, (g, s) => radial(g, s, [[0, 1], [0.18, 0.75], [0.45, 0.2], [1, 0]]));
  TEX.ring = T(256, (g, s) => { g.strokeStyle = '#fff'; g.shadowColor = '#fff'; g.shadowBlur = s * 0.035; g.lineWidth = s * 0.028; g.beginPath(); g.arc(s / 2, s / 2, s * 0.45, 0, TAU); g.stroke(); g.stroke(); });
  TEX.ringThin = T(256, (g, s) => { g.strokeStyle = '#fff'; g.lineWidth = s * 0.012; g.beginPath(); g.arc(s / 2, s / 2, s * 0.45, 0, TAU); g.stroke(); });
  TEX.shock = T(256, (g, s) => radial(g, s, [[0, 0], [0.5, 0], [0.8, 0.5], [0.88, 1], [0.92, 0.6], [0.96, 0]]));
  TEX.disc = T(256, (g, s) => radial(g, s, [[0, 0.22], [0.75, 0.3], [0.86, 0.85], [0.9, 1], [0.93, 0]]));
  TEX.fill = T(128, (g, s) => radial(g, s, [[0, 0.9], [0.8, 0.8], [0.9, 0.5], [0.93, 0]]));
  TEX.beam = T(64, (g, s) => { const l = g.createLinearGradient(0, 0, s, 0); l.addColorStop(0, 'rgba(255,255,255,0)'); l.addColorStop(0.35, 'rgba(255,255,255,.55)'); l.addColorStop(0.5, 'rgba(255,255,255,1)'); l.addColorStop(0.65, 'rgba(255,255,255,.55)'); l.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = l; g.fillRect(0, 0, s, s); });
  TEX.pillar = T(128, (g, s) => {
    const l = g.createLinearGradient(0, s, 0, 0); l.addColorStop(0, 'rgba(255,255,255,1)'); l.addColorStop(0.35, 'rgba(255,255,255,.45)'); l.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = l; g.fillRect(0, 0, s, s);
    g.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 26; i++) { g.fillStyle = 'rgba(0,0,0,' + rand(0.15, 0.5) + ')'; g.fillRect(rand(s), 0, rand(1, 5), s); }
  });
  TEX.line = T(128, (g, s) => {
    const l = g.createLinearGradient(0, s, 0, 0); l.addColorStop(0, 'rgba(255,255,255,.5)'); l.addColorStop(1, 'rgba(255,255,255,.12)'); g.fillStyle = l; g.fillRect(0, 0, s, s);
    g.fillStyle = 'rgba(255,255,255,.95)'; g.fillRect(0, 0, s * 0.05, s); g.fillRect(s * 0.95, 0, s * 0.05, s); g.fillRect(0, 0, s, s * 0.03);
  });
  TEX.slash = T(256, (g, s) => {
    g.translate(s / 2, s / 2);
    for (let i = 0; i < 30; i++) {
      const k = i / 29, a0 = -Math.PI / 2 - 1.2 + k * 0.6, a1 = -Math.PI / 2 + 1.2 - k * 0.12;
      g.strokeStyle = 'rgba(255,255,255,' + (0.04 + k * k * k * 0.6) + ')'; g.lineWidth = s * (0.12 - k * 0.105); g.lineCap = 'round';
      g.beginPath(); g.arc(0, s * 0.05 * (1 - k), s * (0.35 + k * 0.075), a0, a1); g.stroke();
    }
  });
  const sigil = (g, s, poly, dots) => {
    g.translate(s / 2, s / 2); g.strokeStyle = '#fff'; g.shadowColor = '#fff'; g.shadowBlur = 6;
    const R = s * 0.45; g.lineWidth = 5; g.beginPath(); g.arc(0, 0, R, 0, TAU); g.stroke();
    g.lineWidth = 2; g.beginPath(); g.arc(0, 0, R * 0.9, 0, TAU); g.stroke(); g.beginPath(); g.arc(0, 0, R * 0.55, 0, TAU); g.stroke();
    g.lineWidth = 3; for (let k = 0; k < 2; k++) { g.beginPath(); for (let i = 0; i <= poly; i++) { const a = i / poly * TAU + k * Math.PI / poly; const x = Math.cos(a) * R * 0.88, y = Math.sin(a) * R * 0.88; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
    g.lineWidth = 2; for (let i = 0; i < 36; i++) { const a = i / 36 * TAU, r0 = R * (i % 3 ? 0.93 : 0.9); g.beginPath(); g.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); g.lineTo(Math.cos(a) * R, Math.sin(a) * R); g.stroke(); }
    for (let i = 0; i < dots; i++) { const a = i / dots * TAU + 0.26; g.beginPath(); g.arc(Math.cos(a) * R * 0.72, Math.sin(a) * R * 0.72, R * 0.06, 0, TAU); g.stroke(); }
    const r = g.createRadialGradient(0, 0, 0, 0, 0, R); r.addColorStop(0, 'rgba(255,255,255,.16)'); r.addColorStop(1, 'rgba(255,255,255,.04)'); g.fillStyle = r; g.beginPath(); g.arc(0, 0, R, 0, TAU); g.fill();
  };
  TEX.rune = T(512, (g, s) => sigil(g, s, 3, 6));
  TEX.rune2 = T(512, (g, s) => sigil(g, s, 4, 8));
  TEX.crack = T(256, (g, s) => {
    g.translate(s / 2, s / 2); g.strokeStyle = '#fff'; g.shadowColor = '#fff'; g.shadowBlur = 5; g.lineCap = 'round';
    for (let i = 0; i < 9; i++) {
      let a = i / 9 * TAU + rand(-0.2, 0.2), x = 0, y = 0, w = 5; g.beginPath(); g.moveTo(0, 0);
      for (let k = 0; k < 6; k++) { a += rand(-0.5, 0.5); const l = s * 0.075 * rand(0.7, 1.3); x += Math.cos(a) * l; y += Math.sin(a) * l; if (Math.hypot(x, y) > s * 0.45) break; g.lineWidth = w; w *= 0.75; g.lineTo(x, y); g.stroke(); g.beginPath(); g.moveTo(x, y); }
    }
  });
  TEX.swirl = T(256, (g, s) => {
    g.translate(s / 2, s / 2);
    for (let arm = 0; arm < 5; arm++) for (let i = 0; i < 40; i++) {
      const k = i / 40, a = arm / 5 * TAU + k * 4.2, r = s * 0.45 * k;
      g.fillStyle = 'rgba(255,255,255,' + (0.5 * (1 - k) + 0.08) + ')'; g.beginPath(); g.arc(Math.cos(a) * r, Math.sin(a) * r, s * (0.012 + k * 0.035), 0, TAU); g.fill();
    }
  });
  TEX.cone = T(256, (g, s) => {
    g.translate(s / 2, s / 2); const R = s * 0.45, h = 0.87;
    const r = g.createRadialGradient(0, 0, 0, 0, 0, R); r.addColorStop(0, 'rgba(255,255,255,.1)'); r.addColorStop(1, 'rgba(255,255,255,.45)'); g.fillStyle = r;
    g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, R, -Math.PI / 2 - h, -Math.PI / 2 + h); g.closePath(); g.fill(); g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineWidth = 4; g.stroke();
  });
  TEX.star = T(128, (g, s) => {
    g.translate(s / 2, s / 2);
    for (let k = 0; k < 2; k++) { g.rotate(Math.PI / 2 * k); const l = g.createLinearGradient(-s / 2, 0, s / 2, 0); l.addColorStop(0, 'rgba(255,255,255,0)'); l.addColorStop(0.5, 'rgba(255,255,255,1)'); l.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = l; g.beginPath(); g.moveTo(-s / 2, 0); g.lineTo(0, -s * 0.035); g.lineTo(s / 2, 0); g.lineTo(0, s * 0.035); g.fill(); }
    const r = g.createRadialGradient(0, 0, 0, 0, 0, s * 0.2); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(-s / 2, -s / 2, s, s);
  });
  TEX.flare = T(256, (g, s) => {
    g.translate(s / 2, s / 2); const l = g.createLinearGradient(-s / 2, 0, s / 2, 0); l.addColorStop(0, 'rgba(255,255,255,0)'); l.addColorStop(0.5, 'rgba(255,255,255,1)'); l.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = l; g.beginPath(); g.moveTo(-s / 2, 0); g.quadraticCurveTo(0, -s * 0.03, s / 2, 0); g.quadraticCurveTo(0, s * 0.03, -s / 2, 0); g.fill();
    const r = g.createRadialGradient(0, 0, 0, 0, 0, s * 0.16); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(-s / 2, -s / 2, s, s);
  });
  // billowy puff used by flame / smoke / mist particles
  TEX.puff = T(128, (g, s) => {
    for (let i = 0; i < 22; i++) {
      const a = rand(TAU), d = Math.sqrt(Math.random()) * s * 0.24, x = s / 2 + Math.cos(a) * d, y = s / 2 + Math.sin(a) * d, r = rand(s * 0.1, s * 0.24);
      const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,' + rand(0.25, 0.55) + ')'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, s, s);
    }
  });
  TEX.scorch = T(256, (g, s) => {
    for (let i = 0; i < 46; i++) {
      const a = rand(TAU), d = Math.pow(Math.random(), 0.7) * s * 0.3, x = s / 2 + Math.cos(a) * d, y = s / 2 + Math.sin(a) * d, r = rand(s * 0.06, s * 0.17);
      const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,' + rand(0.25, 0.5) + ')'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, s, s);
    }
  });
}

const _rgb = {};
function hexRGB(h) { let c = _rgb[h]; if (!c) { c = _rgb[h] = [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255]; } return c; }

/* point-sprite particles; optional rotating texture */
class PSys {
  constructor(max, additive, tex, flip) {
    this.max = max; this.n = 0;
    const F = k => new Float32Array(max * k);
    this.pos = F(3); this.vel = F(3); this.col = F(4); this.c0 = F(3); this.c1 = F(3); this.size = F(1); this.s0 = F(1); this.s1 = F(1);
    this.life = F(1); this.ml = F(1); this.grav = F(1); this.drag = F(1); this.al = F(1); this.rot = F(1); this.rv = F(1); this.kk = F(1);
    const g = new THREE.BufferGeometry(), A = (a, k) => new THREE.BufferAttribute(a, k).setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('position', A(this.pos, 3)); g.setAttribute('aColor', A(this.col, 4)); g.setAttribute('aSize', A(this.size, 1)); g.setAttribute('aRot', A(this.rot, 1)); g.setAttribute('aK', A(this.kk, 1));
    // every particle fades out where its sprite would cut into the ground (uSoft), and is drawn brighter than white can show when the frame is HDR (uGain)
    const U = FXU, uScale = { value: 800 }, VS = 'attribute vec4 aColor; attribute float aSize, aRot, aK; uniform float uScale; varying vec4 vC; varying float vR, vK, vH, vS; void main(){ vC=aColor; vR=aRot; vK=aK; vH=position.y; vec4 mv=modelViewMatrix*vec4(position,1.); float ps=min(aSize*uScale/-mv.z,520.); vS=aSize; gl_PointSize=ps; gl_Position=projectionMatrix*mv; }';
    const SOFT = 'float h=vH-pc.y*vS*uUp; float soft=mix(1.,smoothstep(0.,.06+vS*.14,h),uSoft);', HD = 'uniform float uGain, uUp, uSoft; varying vec4 vC; varying float vR, vK, vH, vS;';
    const mk = (uni, fs) => new THREE.ShaderMaterial({ uniforms: Object.assign({ uScale, uGain: U.uGain, uUp: U.uUp, uSoft: U.uSoft }, uni), transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, vertexShader: VS, fragmentShader: fs });
    this.mat = this.matA = mk({ map: { value: tex || null } }, tex
      ? HD + 'uniform sampler2D map; void main(){ vec2 pc=gl_PointCoord-.5; float c=cos(vR), s=sin(vR); vec2 p=vec2(c*pc.x-s*pc.y,s*pc.x+c*pc.y); float m=step(length(p),.5); vec4 t=texture2D(map,p+.5);' + SOFT + ' gl_FragColor=vec4(vC.rgb' + (additive ? '*uGain' : '') + ',vC.a*t.a*m*soft); }'
      : HD + 'void main(){ vec2 pc=gl_PointCoord-.5; float d=length(pc)*2.; float a=smoothstep(1.,0.,d); a*=a;' + SOFT + ' gl_FragColor=vec4(vC.rgb*uGain*(1.+a*.7),vC.a*a*soft); }');
    // flipbook variant: the sprite plays a 6x6 sheet of a billowing, dissolving puff over its life (two frames blended); red = heat, green = thickness
    if (flip) this.matB = mk({ map: { value: flip } }, HD + `uniform sampler2D map;
      void main(){ vec2 pc=gl_PointCoord-.5; float c=cos(vR), s=sin(vR); vec2 p=vec2(c*pc.x-s*pc.y,s*pc.x+c*pc.y); float m=step(length(p),.5); p=clamp(p+.5,.004,.996);
        float f=clamp(vK,0.,1.)*35.; float f0=floor(f), f1=min(f0+1.,35.);
        vec4 t=mix(texture2D(map,(vec2(mod(f0,6.),floor(f0/6.))+p)/6.), texture2D(map,(vec2(mod(f1,6.),floor(f1/6.))+p)/6.), f-f0); ${SOFT}
        float hh=t.r*t.r; vec3 col=${additive ? 'mix(vC.rgb*.3,(vC.rgb+vec3(.45))*1.5,hh)*uGain' : 'vC.rgb*(.55+.8*t.g)'};
        gl_FragColor=vec4(col,min(1.,vC.a*t.a*m*soft*${additive ? '1.1' : '1.7'})); }`);
    this.points = new THREE.Points(g, this.mat); this.points.frustumCulled = false; this.points.renderOrder = additive ? 20 : 15; this.geo = g;
  }
  detail(on) { this.mat = on && this.matB ? this.matB : this.matA; this.points.material = this.mat; }
  emit(x, y, z, vx, vy, vz, life, s0, s1, c0, c1, grav, drag, al, rv) {
    if (this.n >= this.max) return;
    const i = this.n++, i3 = i * 3;
    this.pos[i3] = x; this.pos[i3 + 1] = y; this.pos[i3 + 2] = z; this.vel[i3] = vx; this.vel[i3 + 1] = vy; this.vel[i3 + 2] = vz;
    this.c0[i3] = c0[0]; this.c0[i3 + 1] = c0[1]; this.c0[i3 + 2] = c0[2]; this.c1[i3] = c1[0]; this.c1[i3 + 1] = c1[1]; this.c1[i3 + 2] = c1[2];
    this.life[i] = this.ml[i] = life; this.s0[i] = s0; this.s1[i] = s1; this.grav[i] = grav; this.drag[i] = drag; this.al[i] = al; this.size[i] = s0;
    this.rot[i] = Math.random() * 6.28; this.rv[i] = rv === undefined ? (Math.random() - 0.5) * 2 : rv;
  }
  update(dt) {
    const { pos, vel, col, c0, c1, size, s0, s1, life, ml, grav, drag, al, rot, rv } = this;
    let i = 0;
    while (i < this.n) {
      life[i] -= dt;
      if (life[i] <= 0) {
        const j = --this.n;
        if (j !== i) {
          const i3 = i * 3, j3 = j * 3;
          for (let k = 0; k < 3; k++) { pos[i3 + k] = pos[j3 + k]; vel[i3 + k] = vel[j3 + k]; c0[i3 + k] = c0[j3 + k]; c1[i3 + k] = c1[j3 + k]; }
          life[i] = life[j]; ml[i] = ml[j]; s0[i] = s0[j]; s1[i] = s1[j]; grav[i] = grav[j]; drag[i] = drag[j]; al[i] = al[j]; rot[i] = rot[j]; rv[i] = rv[j]; size[i] = size[j];
        }
        continue;
      }
      const i3 = i * 3, i4 = i * 4, k = 1 - life[i] / ml[i], dr = Math.max(0, 1 - drag[i] * dt);
      vel[i3] *= dr; vel[i3 + 1] = vel[i3 + 1] * dr + grav[i] * dt; vel[i3 + 2] *= dr;
      pos[i3] += vel[i3] * dt; pos[i3 + 1] += vel[i3 + 1] * dt; pos[i3 + 2] += vel[i3 + 2] * dt;
      if (pos[i3 + 1] < 0.05 && grav[i] < 0) { pos[i3 + 1] = 0.05; vel[i3 + 1] *= -0.35; vel[i3] *= 0.6; vel[i3 + 2] *= 0.6; }
      col[i4] = c0[i3] + (c1[i3] - c0[i3]) * k; col[i4 + 1] = c0[i3 + 1] + (c1[i3 + 1] - c0[i3 + 1]) * k; col[i4 + 2] = c0[i3 + 2] + (c1[i3 + 2] - c0[i3 + 2]) * k;
      col[i4 + 3] = al[i] * (k < 0.12 ? k / 0.12 : 1 - (k - 0.12) / 0.88);
      size[i] = s0[i] + (s1[i] - s0[i]) * k; rot[i] += rv[i] * dt; this.kk[i] = k;
      i++;
    }
    this.geo.setDrawRange(0, this.n);
    const a = this.geo.attributes; a.position.needsUpdate = a.aColor.needsUpdate = a.aSize.needsUpdate = a.aRot.needsUpdate = a.aK.needsUpdate = true;
  }
}

/* camera-facing quads stretched along their velocity: sparks, embers, rain, shards of light */
class Streaks {
  constructor(max) {
    this.max = max; this.n = 0; const F = k => new Float32Array(max * k);
    this.pos = F(3); this.vel = F(3); this.col = F(4); this.sz = F(2); this.c0 = F(3); this.c1 = F(3); this.life = F(1); this.ml = F(1); this.grav = F(1); this.drag = F(1);
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, -1, 0, -0.5, -1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
    const A = (a, k) => new THREE.InstancedBufferAttribute(a, k).setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('iPos', A(this.pos, 3)); g.setAttribute('iVel', A(this.vel, 3)); g.setAttribute('iCol', A(this.col, 4)); g.setAttribute('iSize', A(this.sz, 2));
    g.instanceCount = 0; this.geo = g;
    this.mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({
      uniforms: { uGain: FXU.uGain }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: `attribute vec3 iPos, iVel; attribute vec4 iCol; attribute vec2 iSize; varying vec4 vC; varying vec2 vQ;
        void main(){ vC=iCol; vQ=position.xy; vec4 mv=modelViewMatrix*vec4(iPos,1.); vec3 vv=(modelViewMatrix*vec4(iVel,0.)).xyz; float sp=length(vv.xy);
          vec2 d=sp>1e-4?vv.xy/sp:vec2(0.,1.); vec2 n=vec2(-d.y,d.x); float len=iSize.x+sp*iSize.y; mv.xy+=n*position.x*iSize.x+d*(position.y+.15)*len; gl_Position=projectionMatrix*mv; }`,
      fragmentShader: 'uniform float uGain; varying vec4 vC; varying vec2 vQ; void main(){ float a=1.-abs(vQ.x)*2.; a*=a; float t=1.+vQ.y; gl_FragColor=vec4(vC.rgb*uGain*(1.+a*t*.8),vC.a*a*t*(.35+.65*t)); }'
    }));
    this.mesh.frustumCulled = false; this.mesh.renderOrder = 21;
  }
  emit(x, y, z, vx, vy, vz, life, w, stretch, c0, c1, grav, drag) {
    if (this.n >= this.max) return; const i = this.n++, i3 = i * 3;
    this.pos[i3] = x; this.pos[i3 + 1] = y; this.pos[i3 + 2] = z; this.vel[i3] = vx; this.vel[i3 + 1] = vy; this.vel[i3 + 2] = vz;
    this.c0[i3] = c0[0]; this.c0[i3 + 1] = c0[1]; this.c0[i3 + 2] = c0[2]; this.c1[i3] = c1[0]; this.c1[i3 + 1] = c1[1]; this.c1[i3 + 2] = c1[2];
    this.sz[i * 2] = w; this.sz[i * 2 + 1] = stretch; this.life[i] = this.ml[i] = life; this.grav[i] = grav; this.drag[i] = drag;
  }
  update(dt) {
    const { pos, vel, col, sz, c0, c1, life, ml, grav, drag } = this; let i = 0;
    while (i < this.n) {
      life[i] -= dt;
      if (life[i] <= 0) {
        const j = --this.n;
        if (j !== i) { const i3 = i * 3, j3 = j * 3; for (let k = 0; k < 3; k++) { pos[i3 + k] = pos[j3 + k]; vel[i3 + k] = vel[j3 + k]; c0[i3 + k] = c0[j3 + k]; c1[i3 + k] = c1[j3 + k]; } sz[i * 2] = sz[j * 2]; sz[i * 2 + 1] = sz[j * 2 + 1]; life[i] = life[j]; ml[i] = ml[j]; grav[i] = grav[j]; drag[i] = drag[j]; }
        continue;
      }
      const i3 = i * 3, i4 = i * 4, k = 1 - life[i] / ml[i], dr = Math.max(0, 1 - drag[i] * dt);
      vel[i3] *= dr; vel[i3 + 1] = vel[i3 + 1] * dr + grav[i] * dt; vel[i3 + 2] *= dr;
      pos[i3] += vel[i3] * dt; pos[i3 + 1] += vel[i3 + 1] * dt; pos[i3 + 2] += vel[i3 + 2] * dt;
      if (pos[i3 + 1] < 0.06 && grav[i] < 0) { pos[i3 + 1] = 0.06; vel[i3 + 1] *= -0.4; vel[i3] *= 0.55; vel[i3 + 2] *= 0.55; }
      col[i4] = c0[i3] + (c1[i3] - c0[i3]) * k; col[i4 + 1] = c0[i3 + 1] + (c1[i3 + 1] - c0[i3 + 1]) * k; col[i4 + 2] = c0[i3 + 2] + (c1[i3 + 2] - c0[i3 + 2]) * k; col[i4 + 3] = 1 - k * k;
      i++;
    }
    this.geo.instanceCount = this.n; const a = this.geo.attributes; a.iPos.needsUpdate = a.iVel.needsUpdate = a.iCol.needsUpdate = a.iSize.needsUpdate = true;
  }
}

/* tumbling chunks: lit rock / glowing crystal */
class Debris {
  constructor(max, glow) {
    this.max = max; this.n = 0; this.P = []; this.glow = glow; const geo = glow ? new THREE.OctahedronGeometry(0.5, 0) : new THREE.DodecahedronGeometry(0.5, 0);
    if (glow) geo.scale(0.55, 1.5, 0.55);
    const mat = glow ? new THREE.MeshBasicMaterial() : new THREE.MeshPhongMaterial({ flatShading: true, shininess: 6, specular: 0x080808 });
    this.im = new THREE.InstancedMesh(geo, mat, max); this.im.frustumCulled = false; this.im.castShadow = !glow; this.d = new THREE.Object3D(); this.c = new THREE.Color();
    for (let i = 0; i < max; i++) this.im.setColorAt(i, this.c); this.im.count = 0;
  }
  emit(x, y, z, vx, vy, vz, life, size, color) { if (this.P.length < this.max) this.P.push({ x, y, z, vx, vy, vz, life, ml: life, s: size, c: color, rx: rand(6), ry: rand(6), wx: rand(-9, 9), wy: rand(-9, 9) }); }
  update(dt) {
    const P = this.P, d = this.d, im = this.im;
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i]; p.life -= dt; if (p.life <= 0) { P[i] = P[P.length - 1]; P.pop(); continue; }
      p.vy -= 24 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.rx += p.wx * dt; p.ry += p.wy * dt;
      if (p.y < p.s * 0.3) { p.y = p.s * 0.3; if (p.vy < -5 && GFX.detail) FX.sm.emit(p.x, 0.25, p.z, rand(-0.5, 0.5), 0.6, rand(-0.5, 0.5), rand(0.4, 0.8), p.s * 1.2, p.s * 3.4, hexRGB(0x4a443c), hexRGB(0x1a1814), 0, 1.5, 0.3); p.vy *= -0.38; p.vx *= 0.6; p.vz *= 0.6; p.wx *= 0.5; p.wy *= 0.5; }
      else if (GFX.detail && p.y > 0.6 && Math.random() < dt * 9) { if (this.glow) { const c = hexRGB(p.c); FX.ps.emit(p.x, p.y, p.z, 0, 0.3, 0, 0.3, p.s * 1.1, 0.02, c, c, 0, 0, 0.7); } else FX.sm.emit(p.x, p.y, p.z, 0, 0.2, 0, 0.5, p.s * 0.9, p.s * 2.2, hexRGB(0x3a3630), hexRGB(0x141210), 0, 1, 0.22); }
    }
    for (let i = 0; i < P.length; i++) { const p = P[i], k = Math.min(1, p.life / (p.ml * 0.3)), q = this.glow ? 0.25 + 0.75 * p.life / p.ml : 1; d.position.set(p.x, p.y, p.z); d.rotation.set(p.rx, p.ry, 0); d.scale.setScalar(p.s * k); d.updateMatrix(); im.setMatrixAt(i, d.matrix); im.setColorAt(i, this.c.setHex(p.c).multiplyScalar(q * (this.glow ? FXU.uGain.value : 1))); }
    im.count = P.length; im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true;
  }
}

/* glowing ribbon that follows a moving point (projectiles, dashes) */
class Ribbon {
  constructor(scene, color, width, n) {
    this.n = n || 14; this.w = width; this.pts = []; this.c = hexRGB(color); this.ended = false; this.scene = scene; this.last = G.time;
    const N = this.n, g = new THREE.BufferGeometry(), uv = new Float32Array(N * 4), idx = [];
    this.pos = new Float32Array(N * 6); this.col = new Float32Array(N * 6);
    for (let i = 0; i < N; i++) { uv[i * 4] = 0; uv[i * 4 + 1] = i / (N - 1); uv[i * 4 + 2] = 1; uv[i * 4 + 3] = i / (N - 1); if (i < N - 1) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage)); g.setAttribute('color', new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx);
    this.mesh = new THREE.Mesh(g, GFX.detail ? new THREE.ShaderMaterial({
      uniforms: { uNz: FXU.uNz, uT: FXU.uT, uGain: FXU.uGain }, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
      vertexShader: 'attribute vec3 color; varying vec3 vC; varying vec2 vUv; void main(){ vC=color; vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: `uniform sampler2D uNz; uniform float uT, uGain; varying vec3 vC; varying vec2 vUv;
        void main(){ float x=abs(vUv.x-.5)*2.; float body=pow(max(0.,1.-x),1.4); float n=texture2D(uNz,vec2(vUv.x*.7,vUv.y*2.2-uT*1.7)).r*.6+texture2D(uNz,vec2(vUv.x*1.5+.3,vUv.y*4.6-uT*2.9)).g*.4;
          float a=body*(.3+1.25*n)*smoothstep(1.,.82,vUv.y); float core=pow(max(0.,1.-x),6.); gl_FragColor=vec4(vC*uGain*(1.+2.2*core),a+core*.5); }`
    }) : new THREE.MeshBasicMaterial({ map: TEX.beam, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    this.mesh.frustumCulled = false; this.mesh.renderOrder = 11; scene.add(this.mesh);
  }
  add(x, y, z) {
    this.last = G.time;
    const p = this.pts; if (p.length && Math.hypot(x - p[0].x, z - p[0].z, y - p[0].y) < 0.25) { p[0].x = x; p[0].y = y; p[0].z = z; } else { p.unshift({ x, y, z }); if (p.length > this.n) p.pop(); }
    this.build();
  }
  build() {
    const p = this.pts, N = this.n, P = this.pos, C = this.col, c = this.c, m = p.length;
    for (let i = 0; i < N; i++) {
      const o = i * 6; if (!m) { for (let k = 0; k < 6; k++) { P[o + k] = 0; C[o + k] = 0; } continue; }
      const j = Math.min(i, m - 1), a = p[Math.max(0, j - 1)], b = p[Math.min(m - 1, j + 1)], dx = a.x - b.x, dz = a.z - b.z, l = Math.hypot(dx, dz) || 1, px = dz / l, pz = -dx / l;
      const k = i < m ? 1 - i / Math.max(1, m - 1) : 0, w = this.w * 0.5 * (0.3 + 0.7 * k), q = p[j], f = k * k;
      P[o] = q.x - px * w; P[o + 1] = q.y; P[o + 2] = q.z - pz * w; P[o + 3] = q.x + px * w; P[o + 4] = q.y; P[o + 5] = q.z + pz * w;
      C[o] = C[o + 3] = c[0] * f; C[o + 1] = C[o + 4] = c[1] * f; C[o + 2] = C[o + 5] = c[2] * f;
    }
    this.mesh.geometry.attributes.position.needsUpdate = true; this.mesh.geometry.attributes.color.needsUpdate = true;
  }
  end() { this.ended = true; }
  kill() { this.scene.remove(this.mesh); this.mesh.geometry.dispose(); this.mesh.material.dispose(); }
}

const FX = {
  list: [], texts: [], lights: [], ribbons: [], shocks: [], scorches: [], scene: null, ps: null, pf: null, sm: null, st: null, rocks: null, shards: null, geo: {},
  init(scene) {
    this.scene = scene; initTextures(); FXU.uNz.value = TEX.noise = bakeNoise(); TEX.book = bakeFlipbook();
    this.ps = new PSys(6000, true); this.pf = new PSys(2600, true, TEX.puff, TEX.book); this.sm = new PSys(1600, false, TEX.puff, TEX.book); this.st = new Streaks(2600);
    this.initWarp(); this.cfg();
    this.rocks = new Debris(220, false); this.shards = new Debris(220, true);
    scene.add(this.sm.points, this.pf.points, this.ps.points, this.st.mesh, this.rocks.im, this.shards.im);
    const flat = new THREE.PlaneGeometry(1, 1); flat.rotateX(-Math.PI / 2); flat.rotateY(Math.PI);
    const line = flat.clone(); line.translate(0, 0, 0.5);
    this.geo = {
      flat, line, sphere: new THREE.IcosahedronGeometry(1, 2), cyl: new THREE.CylinderGeometry(1, 1, 1, 24, 1, true).translate(0, 0.5, 0),
      bolt: new THREE.OctahedronGeometry(0.5, 0).scale(0.55, 0.55, 2.4), orb: new THREE.IcosahedronGeometry(0.5, 1),
      arrow: new THREE.ConeGeometry(0.16, 2.2, 4).rotateX(Math.PI / 2), shard: new THREE.ConeGeometry(0.3, 2.4, 5).rotateX(Math.PI / 2),
      blade: new THREE.OctahedronGeometry(0.5, 0).scale(1.3, 0.12, 2.2), rock: new THREE.IcosahedronGeometry(1, 0),
      axe: new THREE.CylinderGeometry(0.9, 0.9, 0.12, 3).rotateY(0.5), hook: new THREE.TorusGeometry(0.45, 0.11, 5, 10, 4.2).rotateX(Math.PI / 2)
    };
    for (let i = 0; i < 5; i++) { const l = new THREE.PointLight(0xffffff, 0, 20, 1.6); l.userData = { t: 0, life: 1, i0: 0 }; scene.add(l); this.lights.push(l); }
  },
  setScale(v) { for (const p of [this.ps, this.pf, this.sm]) p.mat.uniforms.uScale.value = v; },
  // apply the graphics settings: HDR gain, soft particles, flipbook sprites
  cfg() { FXU.uGain.value = this.hdr ? 1.35 : 1; FXU.uSoft.value = GFX.detail ? 1 : 0; this.pf.detail(GFX.detail); this.sm.detail(GFX.detail); },
  /* flat effect material. With detail on, a textured additive material gets noise flowing through it, breaks up as it fades and burns brighter in its core
     (FX_STYLE picks the flow per texture); `clean` keeps it plain: telegraphs and aiming marks must stay readable */
  mat(tex, color, op, additive, clean) {
    const m = new THREE.MeshBasicMaterial({ map: tex ? TEX[tex] : null, color, transparent: true, opacity: op === undefined ? 1 : op, depthWrite: false, side: THREE.DoubleSide, blending: additive === false ? THREE.NormalBlending : THREE.AdditiveBlending });
    const st = FX_STYLE[tex]; if (st && !clean && additive !== false && GFX.detail) { m.userData.fx = st; m.onBeforeCompile = fxInject; }
    return m;
  },
  add(mesh, life, fn, ownGeo) { const e = { mesh, t: 0, life, fn, ownGeo, dead: false }; mesh.renderOrder = mesh.renderOrder || 10; this.scene.add(mesh); this.list.push(e); if (fn) fn(0, mesh, 0, e); return e; },
  drop(e) {
    this.scene.remove(e.mesh); if (e.mesh.material && e.mesh.material.dispose) e.mesh.material.dispose(); if (e.ownGeo) e.mesh.geometry.dispose();
    if (e.mesh.children) for (const c of e.mesh.children) if (c.material && c.userData.own) c.material.dispose();
  },
  update(dt) {
    FXU.uT.value += dt; this.updateWarp(dt); this.updateTrails(dt); if (G.dim > 0) G.dim = Math.max(0, G.dim - dt * 2.4);
    this.ps.update(dt); this.pf.update(dt); this.sm.update(dt); this.st.update(dt); this.rocks.update(dt); this.shards.update(dt);
    for (let i = this.list.length - 1; i >= 0; i--) {
      const e = this.list[i]; e.t += dt; const k = e.t / e.life;
      if (k >= 1 || e.dead) { this.drop(e); this.list.splice(i, 1); } else if (e.fn) e.fn(k, e.mesh, dt, e);
    }
    for (let i = this.ribbons.length - 1; i >= 0; i--) { const r = this.ribbons[i]; if (!r.ended && G.time - r.last > 0.3) r.ended = true; if (r.ended && dt > 0) { r.pts.pop(); r.pts.pop(); r.build(); if (!r.pts.length) { r.kill(); this.ribbons.splice(i, 1); } } }
    for (let i = this.shocks.length - 1; i >= 0; i--) { const s = this.shocks[i]; s.t += dt; if (s.t >= s.life) this.shocks.splice(i, 1); }
    for (const l of this.lights) if (l.intensity > 0) { l.userData.t += dt; const k = l.userData.t / l.userData.life; l.intensity = k >= 1 ? 0 : l.userData.i0 * (1 - k) * (1 - k); }
    for (let i = this.texts.length - 1; i >= 0; i--) { const t = this.texts[i]; t.t += dt; t.y += dt * 1.6; t.x += t.vx * dt; if (t.t >= t.life) this.texts.splice(i, 1); }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 2.2);
    if (G.ca > 0) G.ca = Math.max(0, G.ca - dt * 3.2);
  },
  clear() {
    for (const e of this.list) this.drop(e); for (const r of this.ribbons) r.kill();
    this.list.length = 0; this.ribbons.length = 0; this.shocks.length = 0; this.scorches.length = 0; this.texts.length = 0; this.clearWarp(); G.dim = 0;
    this.ps.n = this.pf.n = this.sm.n = this.st.n = 0; this.rocks.P.length = 0; this.shards.P.length = 0; for (const l of this.lights) l.intensity = 0;
  },
  near(x, z, r) { return Math.abs(x - G.camX) < (r || 60) && Math.abs(z - G.camZ) < (r || 60); },
  /* ---------- particles ---------- */
  // particle count under the density setting (a single particle stays single)
  cnt(n) { const d = GFX.dens; if (d === 1 || n <= 1) return n; const v = n * d, f = Math.floor(v); return Math.max(1, f + (Math.random() < v - f ? 1 : 0)); },
  _dir(o) {
    let dx, dy, dz;
    if (o.dir !== undefined) { const a = o.dir + rand(-1, 1) * (o.spread === undefined ? 0.4 : o.spread); dx = Math.sin(a); dz = Math.cos(a); dy = rand(-0.2, 0.5); }
    else if (o.ring) { const a = rand(TAU); dx = Math.sin(a); dz = Math.cos(a); dy = rand(0, 0.25); }
    else { const a = rand(TAU), e = rand(-0.3, 1); dy = e; const q = Math.sqrt(Math.max(0, 1 - e * e)); dx = Math.sin(a) * q; dz = Math.cos(a) * q; }
    return [dx, dy, dz];
  },
  burst(x, y, z, o) {
    if (!this.near(x, z)) return;
    const ps = o.smoke ? this.sm : (o.puff ? this.pf : this.ps), n = this.cnt(o.n || 8), c0 = hexRGB(o.color === undefined ? 0xffffff : o.color), c1 = hexRGB(o.color2 === undefined ? (o.color === undefined ? 0xffffff : o.color) : o.color2);
    const sp = o.speed || [1, 3], lf = o.life || [0.3, 0.6], sz = o.size || [0.4, 0.05], rad = o.rad || 0;
    for (let i = 0; i < n; i++) {
      const d = this._dir(o), v = rand(sp[0], sp[1]), ra = rand(TAU), rr = Math.sqrt(Math.random()) * rad, k = rand(0.7, 1.3);
      ps.emit(x + Math.cos(ra) * rr, y + (o.ry ? rand(o.ry) : 0), z + Math.sin(ra) * rr, d[0] * v, d[1] * v + (o.up || 0), d[2] * v, rand(lf[0], lf[1]), sz[0] * k, sz[1] * k, c0, c1, o.grav || 0, o.drag || 0, o.a === undefined ? 1 : o.a);
    }
  },
  // velocity-stretched sparks
  sparks(x, y, z, o) {
    if (!this.near(x, z)) return;
    const n = this.cnt(o.n || 10), c0 = hexRGB(o.color === undefined ? 0xffffff : o.color), c1 = hexRGB(o.color2 === undefined ? (o.color === undefined ? 0xffffff : o.color) : o.color2), sp = o.speed || [5, 12], lf = o.life || [0.25, 0.55], rad = o.rad || 0;
    for (let i = 0; i < n; i++) {
      const d = this._dir(o), v = rand(sp[0], sp[1]), ra = rand(TAU), rr = Math.sqrt(Math.random()) * rad;
      this.st.emit(x + Math.cos(ra) * rr, y, z + Math.sin(ra) * rr, d[0] * v, d[1] * v + (o.up || 0), d[2] * v, rand(lf[0], lf[1]), (o.w || 0.14) * rand(0.7, 1.3), o.stretch === undefined ? 0.07 : o.stretch, c0, c1, o.grav === undefined ? -16 : o.grav, o.drag === undefined ? 1.5 : o.drag);
    }
  },
  // particles converging to a point (charge-up / drain)
  implode(x, y, z, r, o) {
    if (!this.near(x, z)) return;
    const c0 = hexRGB(o.color), c1 = hexRGB(o.color2 === undefined ? o.color : o.color2), n = this.cnt(o.n || 10), lf = o.life || 0.4, sz = o.size || [0.1, 0.4];
    for (let i = 0; i < n; i++) {
      const a = rand(TAU), rr = r * rand(0.6, 1), px = x + Math.sin(a) * rr, pz = z + Math.cos(a) * rr, py = y + rand(-0.5, 1.5), l = lf * rand(0.7, 1.1);
      if (o.streak) this.st.emit(px, py, pz, (x - px) / l, (y - py) / l, (z - pz) / l, l, 0.12, 0.09, c0, c1, 0, 0);
      else this.ps.emit(px, py, pz, (x - px) / l, (y - py) / l, (z - pz) / l, l, sz[0], sz[1], c0, c1, 0, 0, o.a === undefined ? 1 : o.a);
    }
  },
  trail(x, y, z, color, size, n) {
    if (!this.near(x, z)) return; const c = hexRGB(color);
    for (let i = 0; i < (n || 1); i++) this.ps.emit(x + rand(-0.15, 0.15), y + rand(-0.15, 0.15), z + rand(-0.15, 0.15), rand(-0.6, 0.6), rand(-0.2, 0.8), rand(-0.6, 0.6), rand(0.2, 0.45), size, 0.02, c, c, 0, 1, 0.9);
  },
  smoke(x, z, r, n, color) {
    this.burst(x, 0.6, z, { smoke: true, n: n || 8, color: color === undefined ? 0x2a2a30 : color, color2: 0x0c0c10, speed: [0.4, 1.8 + r * 0.35], life: [0.9, 1.9], size: [r * 0.7, r * 1.9], up: 1.3, drag: 1.5, rad: r * 0.5, a: 0.5 });
  },
  // billowing additive flame / energy cloud
  flame(x, y, z, o) {
    this.burst(x, y, z, { puff: true, n: o.n || 10, color: o.color, color2: o.color2, speed: o.speed || [0.4, 2], life: o.life || [0.35, 0.8], size: o.size || [1.2, 2.6], up: o.up === undefined ? 2.5 : o.up, drag: o.drag === undefined ? 1.8 : o.drag, rad: o.rad || 0, a: (o.a === undefined ? 0.55 : o.a) * 0.75, ring: o.ring, dir: o.dir, spread: o.spread });
  },
  debris(x, y, z, o) {
    if (!this.near(x, z) || !GFX.decals) return; const sys = o.glow ? this.shards : this.rocks, n = o.n || 6, sp = o.speed || [3, 9], sz = o.size || [0.2, 0.5];
    for (let i = 0; i < n; i++) { const a = rand(TAU), v = rand(sp[0], sp[1]), rr = rand(o.rad || 0); sys.emit(x + Math.sin(a) * rr, y, z + Math.cos(a) * rr, Math.sin(a) * v, rand(0.5, 1) * (o.up || 9), Math.cos(a) * v, rand(0.8, 1.6) * (o.life || 1), rand(sz[0], sz[1]), o.color); }
  },
  /* ---------- mesh effects ---------- */
  ring(x, z, o) {
    if (!this.near(x, z, 75)) return null;
    const m = new THREE.Mesh(this.geo.flat, this.mat(o.tex || 'ring', o.color, o.op, o.add)); m.position.set(x, o.y || 0.12, z); m.rotation.y = rand(TAU);
    const r0 = o.r0 === undefined ? 0.3 : o.r0, r1 = o.r1, op = o.op === undefined ? 1 : o.op, sp = o.spin || 0;
    return this.add(m, o.life || 0.4, (k, me, dt) => { const s = lerp(r0, r1, easeOut3(k)) * 2 * RK; me.scale.set(s, 1, s); me.material.opacity = op * (1 - k * k); me.rotation.y += sp * dt; });
  },
  glow(x, y, z, size, color, life, tex) {
    if (!this.near(x, z)) return null;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX[tex || 'glow'], color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); s.position.set(x, y, z);
    if (this.hdr) s.material.color.multiplyScalar(1.25);
    const wide = tex === 'flare';
    return this.add(s, life || 0.3, (k, me) => { const q = size * (0.6 + 0.4 * easeOut(k)); me.scale.set(q, wide ? q * 0.5 : q, 1); me.material.opacity = 1 - k; });
  },
  light(x, y, z, color, intensity, dist2, life) {
    if (!this.near(x, z, 50)) return;
    let best = this.lights[0]; for (const l of this.lights) { if (l.intensity <= 0) { best = l; break; } if (l.intensity < best.intensity) best = l; }
    if (this.hdr) intensity *= 0.6;   // an HDR frame does not clip the lit ground, so the same light reads much stronger
    best.color.setHex(color); best.position.set(x, y, z); best.distance = dist2; best.intensity = intensity; best.userData.i0 = intensity; best.userData.t = 0; best.userData.life = life;
  },
  pillar(x, z, o) {
    if (!this.near(x, z)) return null;
    const m = new THREE.Mesh(this.geo.cyl, this.mat('pillar', o.color, o.op)); m.position.set(x, 0, z); const r = o.r || 1, h = o.h || 8, sp = o.spin === undefined ? 2 : o.spin;
    if (r >= 0.8) this.warp('haze', x, h * 0.3, z, { r: r * 1.5, h: h * 0.42, str: 0.4, life: (o.life || 0.5) * 1.2 });
    return this.add(m, o.life || 0.5, (k, me, dt) => { const q = r * (o.grow ? 0.3 + 0.7 * easeOut(k) : 1 - k * 0.6); me.scale.set(q, h * (0.7 + 0.3 * easeOut(k)), q); me.rotation.y += sp * dt; me.material.opacity = (o.op || 0.72) * (1 - k); });
  },
  beam(x1, z1, x2, z2, o) {
    const m = new THREE.Mesh(this.geo.line, this.mat('beam', o.color, o.op)); m.position.set(x1, o.y || 1.3, z1); m.rotation.y = angTo(x1, z1, x2, z2);
    const len = dist(x1, z1, x2, z2), w = o.w || 1;
    if (w >= 0.8 && this.near(x1, z1, 70)) this.warp('line', x1, o.y || 1.3, z1, { ang: m.rotation.y, w: w * 2.4, len, str: 0.45, life: (o.life || 0.3) * 1.6 });
    return this.add(m, o.life || 0.3, (k, me) => { me.scale.set(w * (o.grow ? 0.4 + easeOut(k) : 1 - k * 0.7), 1, len); me.material.opacity = (o.op || 1) * (1 - k); });
  },
  bolt(x1, y1, z1, x2, y2, z2, o) {
    o = o || {}; if (!this.near(x1, z1, 70)) return;
    const len = Math.hypot(x2 - x1, z2 - z1, y2 - y1), n = Math.max(3, Math.round(len / 1.3)), w = o.w || 0.9, jag = o.jag === undefined ? 0.9 : o.jag;
    const lxz = Math.hypot(x2 - x1, z2 - z1), P = [], UV = [], I = [];
    let px = 1, pz = 0; if (lxz > 0.3) { px = (z2 - z1) / lxz; pz = -(x2 - x1) / lxz; }
    for (let i = 0; i <= n; i++) {
      const t = i / n, j = (i === 0 || i === n) ? 0 : rand(-jag, jag), cx = lerp(x1, x2, t) + px * j, cy = lerp(y1, y2, t) + rand(-0.2, 0.2) * (j ? 1 : 0), cz = lerp(z1, z2, t) + pz * j;
      P.push(cx - px * w / 2, cy, cz - pz * w / 2, cx + px * w / 2, cy, cz + pz * w / 2); UV.push(0, t, 1, t);
      if (i < n) { const a = i * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      if (o.fork !== false && i > 0 && i < n && Math.random() < 0.22 && len > 4) { const fa = rand(TAU), fl = rand(1, 2.6); this.st.emit(cx, cy, cz, Math.sin(fa) * fl * 14, rand(-2, 4), Math.cos(fa) * fl * 14, 0.12, 0.16, 0.08, hexRGB(0xffffff), hexRGB(o.color || 0x9fc4ff), 0, 6); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(I);
    const m = new THREE.Mesh(g, this.mat('beam', o.color || 0x9fc4ff)); m.frustumCulled = false; m.scale.set(1, 1, 1);
    this.add(m, o.life || 0.22, (k, me) => { me.material.opacity = k < 0.5 ? 1 : (1 - k) * 2 * (0.6 + Math.random() * 0.4); }, true);
    const m2 = new THREE.Mesh(g, this.mat('beam', 0xffffff)); m2.frustumCulled = false;
    this.add(m2, (o.life || 0.22) * 0.6, (k, me) => { me.material.opacity = 1 - k; });
  },
  // n short arcs crackling around a point
  arcs(x, y, z, r, n, color) { for (let i = 0; i < n; i++) { const a = rand(TAU), b = a + rand(0.6, 1.8), r1 = rand(0.2, 0.5) * r, r2 = rand(0.7, 1) * r; this.bolt(x + Math.sin(a) * r1, y + rand(-0.4, 0.8), z + Math.cos(a) * r1, x + Math.sin(b) * r2, rand(0.2, y + 0.6), z + Math.cos(b) * r2, { color, w: 0.45, jag: 0.5, life: 0.16, fork: false }); } },
  slash(x, z, ang, o) {
    if (!this.near(x, z)) return;
    const r = o.r || 3, sw = o.sweep === undefined ? 1.4 : o.sweep, dir = o.flip ? -1 : 1;
    const mk = (col, sc, lf) => { const m = new THREE.Mesh(this.geo.flat, this.mat('slash', col)); m.position.set(x, o.y || 1.2, z); this.add(m, lf, (k, me) => { const s = r * 2 * RK * sc * (0.85 + 0.15 * k); me.scale.set(s * dir, 1, s); me.rotation.y = ang + (easeOut(k) - 0.5) * sw * dir; me.material.opacity = 1 - k * k; }); };
    mk(o.color, 1, o.life || 0.24); mk(0xffffff, 0.93, (o.life || 0.24) * 0.6);
  },
  // rim-lit shell: bright at the silhouette, clear in the middle, so it never hides what is inside
  rimMat(color, op) {
    return new THREE.ShaderMaterial({
      uniforms: { c: { value: new THREE.Color(color) }, o: { value: op }, uGain: FXU.uGain, uNz: FXU.uNz, uT: FXU.uT, uSoft: FXU.uSoft }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: 'varying vec3 vN; varying vec3 vV; varying vec3 vW; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); vW=(modelMatrix*vec4(position,1.)).xyz; vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }',
      fragmentShader: 'uniform vec3 c; uniform float o, uGain, uT, uSoft; uniform sampler2D uNz; varying vec3 vN; varying vec3 vV; varying vec3 vW; void main(){ float f=1.-abs(dot(normalize(vN),normalize(vV))); float n=texture2D(uNz,vec2(vW.x+vW.z,vW.y)*.21+vec2(0.,-uT*.22)).r; float e=pow(f,2.4); gl_FragColor=vec4(c*uGain*(1.+e*1.2),o*(.05+e*mix(1.,.55+.9*n,uSoft))*smoothstep(0.,.45,vW.y)); }'
    });
  },
  sphere(x, y, z, o) {
    if (!this.near(x, z)) return null;
    const op = (o.op === undefined ? 0.5 : o.op) * 2.2, m = new THREE.Mesh(this.geo.sphere, this.rimMat(o.color, op)); m.position.set(x, y, z);
    const r0 = o.r0 === undefined ? 0.2 : o.r0;
    return this.add(m, o.life || 0.4, (k, me) => { me.scale.setScalar(lerp(r0, o.r1, easeOut3(k))); me.material.uniforms.o.value = op * (1 - k); });
  },
  // telegraph: pulsing outer ring + filling disc, lasts `dur`
  decal(x, z, r, color, dur) {
    const m = new THREE.Mesh(this.geo.flat, this.mat('ring', color, 0.9, true, true)); m.position.set(x, 0.1, z); m.scale.set(r * 2 * RK, 1, r * 2 * RK);
    this.add(m, dur, (k, me) => { me.material.opacity = 0.55 + 0.45 * Math.sin(k * 30); });
    const f = new THREE.Mesh(this.geo.flat, this.mat('fill', color, 0.3, true, true)); f.position.set(x, 0.08, z);
    this.add(f, dur, (k, me) => { const s = r * 2 * RK * Math.max(0.02, k); me.scale.set(s, 1, s); me.material.opacity = 0.16 + k * 0.28; });
  },
  lineDecal(x, z, ang, len, w, color, dur) {
    const m = new THREE.Mesh(this.geo.line, this.mat('line', color, 0.7)); m.position.set(x, 0.1, z); m.rotation.y = ang; m.scale.set(w, 1, len);
    this.add(m, dur, (k, me) => { me.material.opacity = 0.35 + k * 0.5; });
  },
  // persistent rotating ground sigil; returns entry (set .dead=true to remove)
  zone(x, z, r, color, dur, o) {
    o = o || {};
    const m = new THREE.Mesh(this.geo.flat, this.mat(o.tex || 'rune', color, 0)); m.position.set(x, o.y || 0.1, z); const s = r * 2 * RK; m.scale.set(s, 1, s);
    const sp = o.spin === undefined ? 0.5 : o.spin, op = o.op === undefined ? 0.6 : o.op * 0.75;
    return this.add(m, dur, (k, me, dt, e) => { me.rotation.y += sp * dt; const t = e.t; me.material.opacity = op * Math.min(1, t / 0.25, (dur - t) / 0.35); if (o.follow) { me.position.x = o.follow.x; me.position.z = o.follow.z; } });
  },
  // soft vertical wall of light around an area
  wall(x, z, r, color, dur, o) {
    o = o || {}; const m = new THREE.Mesh(this.geo.cyl, this.mat('pillar', color, 0)); m.position.set(x, 0, z); const h = o.h || 3, op = o.op === undefined ? 0.4 : o.op;
    return this.add(m, dur, (k, me, dt, e) => { me.scale.set(r, h, r); me.rotation.y += (o.spin || 0.4) * dt; me.material.opacity = op * Math.min(1, e.t / 0.25, (dur - e.t) / 0.4); if (o.follow) { me.position.x = o.follow.x; me.position.z = o.follow.z; } });
  },
  bubble(u, color, dur, r) {
    const m = new THREE.Mesh(this.geo.sphere, this.rimMat(color, 0.9)); r = r || 1.7;
    return this.add(m, dur, (k, me, dt, en) => { me.position.set(u.x, 1.3 + (u.yOff || 0), u.z); const q = r * (1 + Math.sin(en.t * 6) * 0.04) * Math.min(1, en.t / 0.15); me.scale.setScalar(q); me.material.uniforms.o.value = 0.9 * Math.min(1, (dur - en.t) / 0.3); if (!u.alive) en.dead = true; });
  },
  aura(u, color, dur, r, tex, spin) {
    const m = new THREE.Mesh(this.geo.flat, this.mat(tex || 'ring', color, 0.8)); const s = r * 2 * RK; m.scale.set(s, 1, s);
    return this.add(m, dur, (k, me, dt, en) => { me.position.set(u.x, 0.14, u.z); me.rotation.y += (spin || 1.5) * dt; me.material.opacity = 0.8 * Math.min(1, en.t / 0.2, (dur - en.t) / 0.3); if (!u.alive) en.dead = true; });
  },
  // dark stain left on the ground, optional glowing cracks
  scorch(x, z, r, color, life) {
    if (!this.near(x, z, 70) || !GFX.decals) return;
    if (this.scorches.length > 22) { const o = this.scorches.shift(); o.dead = true; }
    const L = life || 9;
    if (!GFX.detail) {
      const m = new THREE.Mesh(this.geo.flat, this.mat('scorch', 0x050505, 0.75, false)); m.position.set(x, 0.05 + Math.random() * 0.02, z); m.rotation.y = rand(TAU); m.scale.set(r * 2.5, 1, r * 2.5); m.renderOrder = 3;
      this.scorches.push(this.add(m, L, (k, me) => { me.material.opacity = 0.75 * Math.min(1, (1 - k) * 3); }));
      if (color !== undefined) this.ring(x, z, { r0: r * 0.95, r1: r, color, tex: 'crack', life: Math.min(L, 2.6), y: 0.09 });
      return;
    }
    // premultiplied blend: alpha darkens the ground, rgb adds the glow of the cracks; uHeat runs 1 -> 0, the rim cools first
    const hot = color !== undefined, m = new THREE.Mesh(this.geo.flat, new THREE.ShaderMaterial({
      uniforms: { uNz: FXU.uNz, uGain: FXU.uGain, uC: { value: new THREE.Color(hot ? color : 0) }, uHeat: { value: hot ? 1 : 0 }, uFade: { value: 1 }, uSeed: { value: new THREE.Vector2(Math.random(), Math.random()) } },
      transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: `uniform sampler2D uNz; uniform vec3 uC; uniform float uHeat, uFade, uGain; uniform vec2 uSeed; varying vec2 vUv;
        void main(){ vec2 q=vUv*2.-1.; float l=length(q); vec2 nu=q*.45+uSeed; float n=texture2D(uNz,nu).r, n2=texture2D(uNz,nu*2.3+.31).g, n3=texture2D(uNz,nu*5.+.7).b;
          float edge=l+(n-.5)*.55+(n2-.5)*.2; float mask=1.-smoothstep(.5,.92,edge); float dark=mask*(.62+.3*n2)*uFade;
          float rid=1.-abs(2.*n2-1.), rid2=1.-abs(2.*n-1.); float cr=max(smoothstep(.86,.985,rid),smoothstep(.9,.99,rid2)*.7)*mask;
          float h=clamp(uHeat*1.9-l*.75-n3*.45,0.,1.); float molten=h*h*h*mask*smoothstep(.45,.95,n3)*smoothstep(.75,.1,l);
          vec3 glow=uC*uGain*(cr*2.2*h+molten*.55)+vec3(1.,.9,.7)*cr*h*h*h*.8;
          gl_FragColor=vec4(glow*uFade,dark); }`
    }));
    m.position.set(x, 0.05 + Math.random() * 0.02, z); m.rotation.y = rand(TAU); m.scale.set(r * 2.9, 1, r * 2.9); m.renderOrder = 3;
    const cool = Math.min(L * 0.6, 3.6 + r * 0.4);
    this.scorches.push(this.add(m, L, (k, me, dt, e) => { const u = me.material.uniforms; u.uFade.value = Math.min(1, (1 - k) * 3); if (hot) u.uHeat.value = Math.max(0, 1 - e.t / cool); }));
    if (hot && r >= 2 && Math.random() < 0.5) SFX.at('sizzle', x, z, 0.5);
  },
  // screen-space refraction ripple (applied by the final post pass)
  shock(x, z, r, str, life) { if (!this.near(x, z, 55)) return; str = str || 1; this.warp('ring', x, 0.3, z, str < 0 ? { r0: r, r1: 0.2, str: -str, life: life || 0.5 } : { r0: r * 0.15, r1: r, str, life: life || 0.5 }); },
  // a screen-wide shockwave: a thin ring of refraction that starts at a point of the world and runs out over the whole picture, bending it as it passes
  // (the final post pass draws it; strength 0.5 is a light kick, 1.8 a heavy one)
  rips: [{ s: 0 }, { s: 0 }, { s: 0 }, { s: 0 }], ripI: 0,
  ripple(x, y, z, str) {
    if (!GFX.warp || !G.camera || !this.near(x, z, 80)) return; _fv1.set(x, y, z).project(G.camera); if (_fv1.z > 1) return;
    const s = this.rips[this.ripI]; this.ripI = (this.ripI + 1) % 4; s.x = _fv1.x * 0.5 + 0.5; s.y = _fv1.y * 0.5 + 0.5; s.r = 0; s.s = str;
  },
  punch(v) { if (GFX.flash) G.ca = Math.min(1.5, Math.max(G.ca || 0, v)); },
  hitstop(t) { if (GFX.stop) G.hitstop = Math.max(G.hitstop || 0, t); },
  ribbon(color, width, n) { const r = new Ribbon(this.scene, color, width, n); this.ribbons.push(r); return r; },
  projMesh(kind, color, size) {
    const m = new THREE.Mesh(this.geo[kind] || this.geo.bolt, new THREE.MeshBasicMaterial({ color })); m.scale.setScalar(size || 1);
    const core = new THREE.Mesh(this.geo[kind] || this.geo.bolt, new THREE.MeshBasicMaterial({ color: 0xffffff })); core.scale.setScalar(0.55); m.add(core);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); s.scale.set(3.6, 3.6, 1); m.add(s);
    m.renderOrder = 12; this.scene.add(m); return m;
  },
  killMesh(m) { this.scene.remove(m); m.material.dispose(); for (const c of m.children) if (c.material) c.material.dispose(); },
  shake(a) { if (GFX.shake) G.shake = Math.min(1.2, Math.max(G.shake, a)); },
  text(x, y, z, str, color, size) { if (this.texts.length < 90 && this.near(x, z, 45)) this.texts.push({ x: x + rand(-0.4, 0.4), y, z, str, color, size: size || 15, t: 0, life: 0.9, vx: rand(-0.5, 0.5) }); },
  /* ---------- presets ---------- */
  hit(x, y, z, color, big) {
    this.sparks(x, y, z, { n: big ? 12 : 6, color: 0xffffff, color2: color, speed: [4, big ? 15 : 9], life: [0.15, 0.38], w: big ? 0.16 : 0.11 });
    this.glow(x, y, z, big ? 3.6 : 2.3, color, 0.16, 'star'); if (big) this.glow(x, y, z, 5.5, 0xffffff, 0.12, 'flare');
  },
  /* layered explosion. o.el picks an elemental dressing: fire | ice | elec | earth | toxic | holy | shadow | void */
  explosion(x, z, r, color, o) {
    o = o || {}; const el = o.el, c2 = o.color2 === undefined ? color : o.color2;
    this.ring(x, z, { r0: r * 0.2, r1: r * 1.12, color, life: 0.5, tex: 'shock' });
    this.ring(x, z, { r0: r * 0.1, r1: r * 0.95, color: 0xffffff, life: 0.16, tex: 'fill', op: 0.18 });
    this.glow(x, 1.2, z, Math.min(r * 2.1, 9), color, 0.3); this.glow(x, 1.2, z, Math.min(r * 3.6, 13), 0xffffff, 0.11, 'flare');
    this.sparks(x, 0.8, z, { n: Math.round(10 + r * 5), color: 0xffffff, color2: color, speed: [r * 2, r * 6], life: [0.25, 0.7], up: r * 1.2, w: 0.15 });
    this.flame(x, 0.8, z, { n: Math.round(4 + r * 2), color, color2: c2, speed: [0.5, r * 1.1], life: [0.35, 0.85], size: [Math.min(r * 0.7, 2.4), Math.min(r * 1.6, 4.6)], rad: r * 0.6, up: 1.6, a: 0.3 });
    this.light(x, 2.2, z, color, 2.4, r * 5 + 6, 0.45); this.shake(Math.min(0.7, r * 0.08));
    if (r >= 1.3) this.shock(x, z, r * 1.6, Math.min(1.5, 0.3 + r * 0.2), 0.42 + r * 0.015);
    if (r >= 2.4) { this.punch(Math.min(1, r * 0.12)); after(0.08, () => this.ring(x, z, { r0: r * 0.5, r1: r * 1.5, color, life: 0.5, tex: 'ring', op: 0.5 })); }   // a second, wider and thinner wave a beat later
    if (!el && o.mark !== false && r >= 1.8) { this.scorch(x, z, r * 0.7, color, 6.5); this.debris(x, 0.3, z, { n: Math.round(2 + r), color: 0x3c3934, speed: [2, 4 + r * 1.5], up: 8, size: [0.14, 0.4], rad: r * 0.3, life: 0.8 }); }
    if (el === 'fire') this.heat(x, 1.6, z, r * 1.4, 1.5, 0.55, { rise: 0.8 });
    if (el === 'fire') { this.flame(x, 0.5, z, { n: Math.round(6 + r * 3), color: 0xffb060, color2: 0x6a1000, speed: [0.3, 1.5], life: [0.5, 1.2], size: [Math.min(r * 0.5, 2.2), Math.min(r * 1.3, 4.4)], up: 5, rad: r * 0.75, a: 0.34 }); this.sparks(x, 0.5, z, { n: Math.round(8 + r * 4), color: 0xffe0a0, color2: 0xff4a00, speed: [1, 5], life: [0.6, 1.4], up: 7, grav: -4, drag: 1, rad: r * 0.6, w: 0.09, stretch: 0.04 }); this.smoke(x, z, r * 0.9, Math.round(4 + r)); this.scorch(x, z, r, 0xff6a1f); }
    else if (el === 'ice') { this.debris(x, 0.5, z, { glow: true, n: Math.round(6 + r * 3), color: 0xcfefff, speed: [3, 5 + r * 2], up: 8, size: [0.25, 0.6] }); this.flame(x, 0.6, z, { n: Math.round(4 + r * 2), color: 0xdff4ff, color2: 0x4a90c0, speed: [1, 3 + r], life: [0.5, 1.1], size: [Math.min(r * 0.7, 2.4), Math.min(r * 1.7, 4.8)], up: 0.6, ring: true, a: 0.28 }); this.ring(x, z, { r0: r * 0.8, r1: r, color: 0xbfefff, tex: 'crack', life: 1.6 }); }
    else if (el === 'elec') { this.arcs(x, 1.2, z, r * 1.1, Math.round(3 + r), color); this.sparks(x, 1, z, { n: Math.round(8 + r * 3), color: 0xffffff, color2: color, speed: [10, 22], life: [0.08, 0.22], grav: 0, drag: 4, w: 0.1, stretch: 0.1 }); this.scorch(x, z, r * 0.7); }
    else if (el === 'earth') { this.debris(x, 0.4, z, { n: Math.round(6 + r * 3), color: o.rock || 0x4a4640, speed: [3, 5 + r * 2], up: 10, size: [0.25, 0.7], rad: r * 0.4 }); this.smoke(x, z, r, Math.round(5 + r * 1.5), 0x4a4238); this.scorch(x, z, r, color); }
    else if (el === 'toxic') { this.flame(x, 0.6, z, { n: Math.round(6 + r * 3), color: 0xc8ff6a, color2: 0x143800, speed: [0.3, 1.6], life: [0.7, 1.6], size: [Math.min(r * 0.6, 2.4), Math.min(r * 1.6, 4.6)], up: 1.2, rad: r * 0.7, a: 0.42 }); this.burst(x, 0.3, z, { n: Math.round(6 + r * 2), color: 0xd8ff8a, color2: 0x4a8a00, speed: [0.2, 1], life: [0.6, 1.3], size: [0.3, 0.05], up: 3, rad: r * 0.7, ring: true }); this.smoke(x, z, r * 0.8, 4, 0x1c2c0c); this.scorch(x, z, r * 0.8); }
    else if (el === 'holy') { for (let i = 0; i < 5; i++) { const a = rand(TAU), d = rand(r * 0.7); this.pillar(x + Math.sin(a) * d, z + Math.cos(a) * d, { r: 0.35, h: 9 + rand(5), color, life: 0.5 + rand(0.3), op: 0.6 }); } this.burst(x, 0.4, z, { n: Math.round(10 + r * 3), color: 0xffffff, color2: color, speed: [0.2, 1], life: [0.7, 1.4], size: [0.3, 0.02], up: 5, rad: r * 0.8, ring: true, drag: 1 }); }
    else if (el === 'shadow') { this.smoke(x, z, r, Math.round(6 + r * 2), 0x24163a); this.sparks(x, 1, z, { n: Math.round(8 + r * 3), color, color2: 0x1a0a30, speed: [3, 9], life: [0.3, 0.7], grav: -3, w: 0.2, stretch: 0.09 }); }
    else if (el === 'void') { this.implode(x, 1.2, z, r * 1.4, { n: Math.round(10 + r * 4), color, color2: 0xffffff, life: 0.3, streak: true }); this.sphere(x, 1.2, z, { r0: r * 0.2, r1: r, color, life: 0.4, op: 0.45 }); this.flame(x, 1, z, { n: Math.round(5 + r * 2), color: 0x9a3aff, color2: 0x1a0030, speed: [0.3, 1.5], life: [0.5, 1.1], size: [Math.min(r * 0.6, 2.4), Math.min(r * 1.4, 4.4)], up: 0.5, a: 0.4, rad: r * 0.5 }); this.scorch(x, z, r * 0.8, color); }
    else if (o.smoke !== false) this.smoke(x, z, r * 0.8, Math.round(3 + r));
  },
  levelUp(u) {
    this.pillar(u.x, u.z, { r: 1.6, h: 11, color: 0xffd98a, life: 0.9 }); this.ring(u.x, u.z, { r1: 4, color: 0xffd98a, life: 0.6, tex: 'shock' });
    this.sparks(u.x, 0.3, u.z, { n: 22, color: 0xfff1c9, color2: 0xffa530, speed: [0.5, 2], life: [0.6, 1.2], up: 9, rad: 1.3, grav: -3, drag: 1.2, ring: true, w: 0.1, stretch: 0.05 });
  },
  heal(u, color) {
    color = color || 0x7dffa8; this.ring(u.x, u.z, { r1: 2.2, color, life: 0.5 });
    this.sparks(u.x, 0.3, u.z, { n: 10, color: 0xffffff, color2: color, speed: [0.2, 1], life: [0.5, 1], up: 6, rad: 1, ring: true, grav: -1, drag: 1.2, w: 0.09, stretch: 0.05 });
    this.burst(u.x, 0.6, u.z, { n: 6, color, color2: color, speed: [0.1, 0.6], life: [0.5, 0.9], size: [0.5, 0.05], up: 2.5, rad: 0.9, a: 0.6 });
  }
};

/* ===== noise styles for FX.mat, per texture: [polar, scaleU, scaleV, flowU, flowV, erosion, hot core]. Polar scaleU must be an integer (the noise wraps around the circle) ===== */
const FX_STYLE = {
  ring: [1, 6, 1.4, 0.05, -0.5, 0.55, 0.8], shock: [1, 8, 2.2, 0, -0.9, 0.7, 1], fill: [1, 5, 1.6, 0.03, -0.4, 0.5, 0.3], slash: [1, 4, 1.2, 0.9, -0.2, 0.6, 1.2],
  pillar: [0, 2, 0.7, 0, -1.3, 0.6, 0.6], beam: [0, 0.6, 1.5, 0, -2.2, 0.5, 1.5], swirl: [1, 3, 1, 0.3, -0.25, 0.4, 0.5], glow: [1, 4, 1, 0, -0.3, 0.3, 0.6],
  rune: [0, 1, 1, 0, 0, 0, 0.5], rune2: [0, 1, 1, 0, 0, 0, 0.5], crack: [0, 1, 1, 0, 0, 0, 1.2], star: [0, 1, 1, 0, 0, 0, 0.6], flare: [0, 1, 1, 0, 0, 0, 0.6]
};
// patches the stock basic material: called once per material, all of them share one compiled program
function fxInject(sh) {
  const s = this.userData.fx;
  sh.uniforms.uNz = FXU.uNz; sh.uniforms.uT = FXU.uT; sh.uniforms.uGain = FXU.uGain;
  sh.uniforms.uFx = { value: new THREE.Vector4(s[1], s[2], s[3], s[4]) }; sh.uniforms.uFxP = { value: new THREE.Vector3(s[0], s[5], s[6]) };
  sh.fragmentShader = 'uniform sampler2D uNz; uniform float uT, uGain; uniform vec4 uFx; uniform vec3 uFxP;\n' + sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
    #ifdef USE_MAP
    { vec2 fq=vUv-.5; vec2 nu=uFxP.x>.5 ? vec2(atan(fq.y,fq.x)*.159155*uFx.x, length(fq)*uFx.y) : vUv*uFx.xy; nu+=uT*uFx.zw;
      float fn=texture2D(uNz,nu).r*.62+texture2D(uNz,nu*2.+vec2(.37,uT*.11)).g*.38;
      float fa=diffuseColor.a, ff=clamp(opacity*1.7,0.,1.);
      float fe=smoothstep(0.,.6,fn*1.25+.3-(1.-ff)*.95);
      diffuseColor.a*=mix(1.,(.55+.95*fn)*fe,uFxP.y);
      diffuseColor.rgb*=uGain*(1.+uFxP.z*fa*fa); }
    #endif`);
}

/* a ribbon swept by a weapon: each sample is the blade (grip side, tip) at one moment; samples age out in a fifth of a second */
class SwingTrail {
  constructor(scene, color) {
    const N = this.n = 12; this.s = []; this.dead = false; this.scene = scene; this.idle = 0;
    this.pos = new Float32Array(N * 6); this.age = new Float32Array(N * 2); const uv = new Float32Array(N * 4), idx = [];
    for (let i = 0; i < N; i++) { uv[i * 4] = 0; uv[i * 4 + 1] = i / (N - 1); uv[i * 4 + 2] = 1; uv[i * 4 + 3] = i / (N - 1); if (i < N - 1) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage)); g.setAttribute('aAge', new THREE.BufferAttribute(this.age, 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx);
    this.mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({
      uniforms: { uC: { value: new THREE.Color(color) }, uNz: FXU.uNz, uT: FXU.uT, uGain: FXU.uGain }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: 'attribute float aAge; varying float vA; varying vec2 vUv; void main(){ vA=aAge; vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: `uniform vec3 uC; uniform sampler2D uNz; uniform float uT, uGain; varying float vA; varying vec2 vUv;
        void main(){ float v=vUv.x; float n=texture2D(uNz,vec2(vUv.y*1.3-uT*.9,v*.8)).r; float a=pow(max(0.,1.-vA),1.6)*smoothstep(0.,.3,v)*(.25+.75*v)*(.4+1.1*n);
          float tip=smoothstep(.7,1.,v); gl_FragColor=vec4(uC*uGain*(1.+2.2*tip),a); }`
    }));
    this.mesh.frustumCulled = false; this.mesh.renderOrder = 12; scene.add(this.mesh);
  }
  add(bx, by, bz, tx, ty, tz) { this.s.unshift({ bx, by, bz, tx, ty, tz, t: 0 }); if (this.s.length > this.n) this.s.pop(); this.idle = 0; }
  update(dt) {
    const S = this.s, P = this.pos, A = this.age, N = this.n, LIFE = 0.2; this.idle += dt;
    for (const q of S) q.t += dt; while (S.length && S[S.length - 1].t > LIFE) S.pop();
    const m = S.length;
    for (let i = 0; i < N; i++) {
      const o = i * 6; if (!m) { for (let k = 0; k < 6; k++) P[o + k] = 0; A[i * 2] = A[i * 2 + 1] = 1; continue; }
      const q = S[Math.min(i, m - 1)]; P[o] = q.bx; P[o + 1] = q.by; P[o + 2] = q.bz; P[o + 3] = q.tx; P[o + 4] = q.ty; P[o + 5] = q.tz; A[i * 2] = A[i * 2 + 1] = i < m ? Math.min(1, q.t / LIFE) : 1;
    }
    const at = this.mesh.geometry.attributes; at.position.needsUpdate = at.aAge.needsUpdate = true;
    if (!m && this.idle > 0.4) this.kill();
  }
  kill() { if (this.dead) return; this.dead = true; this.scene.remove(this.mesh); this.mesh.geometry.dispose(); this.mesh.material.dispose(); }
}

const _fv0 = new THREE.Vector3(), _fv1 = new THREE.Vector3();
Object.assign(FX, {
  warps: [], trails: [], wscene: null, warpOn: false, hdr: false,
  /* ---------- air distortion: meshes drawn into a separate offscreen buffer as signed screen offsets (red: x, green: y); the final pass bends the picture by it ---------- */
  initWarp() {
    this.wscene = new THREE.Scene(); this.wquad = new THREE.PlaneGeometry(1, 1);
    this.wblend = { transparent: true, depthTest: false, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, side: THREE.DoubleSide };
    const VB = 'uniform vec2 uSize; varying vec2 vP; void main(){ vP=position.xy*2.; vec4 mv=modelViewMatrix*vec4(0.,0.,0.,1.); mv.xy+=position.xy*uSize; gl_Position=projectionMatrix*mv; }';   // faces the camera
    const VF = 'varying vec2 vP; void main(){ vP=position.xz*2.; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }';   // lies on the ground
    const NZ = 'uniform sampler2D uNz; uniform float uT, uStr; varying vec2 vP; vec2 nz(vec2 p){ return (texture2D(uNz,p+vec2(0.,-uT*.45)).rg-.5)+(texture2D(uNz,p*2.3+vec2(uT*.3,-uT*.8)).gb-.5)*.5; }';
    this.wsh = {
      // ripple running over the ground: pushes the picture along the radius
      ring: { vs: VF, flat: 'flat', fs: 'uniform float uStr; varying vec2 vP; void main(){ float l=length(vP); float k=smoothstep(.45,.8,l)*(1.-smoothstep(.8,1.,l)); vec2 d=vP/max(l,1e-4); gl_FragColor=vec4(d.x*k*uStr,-d.y*k*uStr,0.,1.); }' },
      // shimmering hot air
      haze: { vs: VB, fs: NZ + ' void main(){ float l=length(vP); float m=1.-smoothstep(.15,1.,l); gl_FragColor=vec4(nz(vP*.55)*m*uStr*2.,0.,1.); }' },
      // a lens: pulls the picture toward its centre (negative strength pushes it away)
      lens: { vs: VB, fs: 'uniform float uStr; varying vec2 vP; void main(){ float l=length(vP); float k=pow(max(0.,1.-l),1.5)*smoothstep(0.,.18,l); gl_FragColor=vec4(vP/max(l,1e-4)*k*uStr,0.,1.); }' },
      // shimmering strip along a beam or a dash
      line: { vs: VF, flat: 'line', fs: NZ + ' void main(){ float m=(1.-abs(vP.x))*smoothstep(0.,.2,vP.y)*smoothstep(2.,1.7,vP.y); gl_FragColor=vec4(nz(vP*vec2(.5,1.1))*m*uStr*2.,0.,1.); }' }
    };
  },
  // kind: ring {r0, r1} | haze {r, h?, rise?} | lens {r} | line {ang, w, len}; common: str, life, follow (a unit to stay on)
  warp(kind, x, y, z, o) {
    if (!GFX.warp || !this.warpOn || !this.near(x, z, 60)) return null;
    if (this.warps.length >= 32) this.warps[0].dead = true;
    const sh = this.wsh[kind], u = { uStr: { value: 0 }, uSize: { value: new THREE.Vector2(1, 1) }, uNz: FXU.uNz, uT: FXU.uT };
    const m = new THREE.Mesh(sh.flat ? this.geo[sh.flat] : this.wquad, new THREE.ShaderMaterial(Object.assign({ uniforms: u, vertexShader: sh.vs, fragmentShader: sh.fs }, this.wblend)));
    m.frustumCulled = false; m.position.set(x, y, z); if (kind === 'line') { m.rotation.y = o.ang; m.scale.set(o.w, 1, o.len); }
    const e = { m, kind, t: 0, life: o.life || 0.5, o, dead: false }; this.wscene.add(m); this.warps.push(e); this.stepWarp(e, 0); return e;
  },
  stepWarp(e, dt) {
    e.t += dt; const o = e.o, k = e.t / e.life; if (k >= 1 || e.dead) return false;
    const u = e.m.material.uniforms, m = e.m;
    if (o.follow) { if (!o.follow.alive) return false; m.position.x = o.follow.x; m.position.z = o.follow.z; }
    if (e.kind === 'ring') { const R = Math.max(0.05, lerp(o.r0, o.r1, easeOut3(k))) * 2.5; m.scale.set(R, 1, R); u.uStr.value = o.str * (1 - k) * (1 - k); }
    else if (e.kind === 'lens') { u.uSize.value.set(o.r * 2, o.r * 2); u.uStr.value = o.str * Math.sin(Math.PI * Math.min(1, k)); }
    else { const f = Math.min(1, k * 6) * (1 - k); u.uStr.value = o.str * f * 1.5; if (e.kind === 'haze') { u.uSize.value.set(o.r * 2, (o.h || o.r) * 2); if (o.rise) m.position.y += o.rise * dt; } }
    return true;
  },
  updateWarp(dt) { for (let i = this.warps.length - 1; i >= 0; i--) { const e = this.warps[i]; if (!this.stepWarp(e, dt)) { this.wscene.remove(e.m); e.m.material.dispose(); this.warps.splice(i, 1); } } },
  clearWarp() { for (const e of this.warps) { this.wscene.remove(e.m); e.m.material.dispose(); } this.warps.length = 0; for (const t of this.trails) t.kill(); this.trails.length = 0; },
  heat(x, y, z, r, life, str, o) { return this.warp('haze', x, y, z, Object.assign({ r, life: life || 1, str: str === undefined ? 0.5 : str }, o || {})); },
  updateTrails(dt) { for (let i = this.trails.length - 1; i >= 0; i--) { const t = this.trails[i]; t.update(dt); if (t.dead) this.trails.splice(i, 1); } },
  /* ---------- weapon trails: while a melee hero swings or casts, the blade in his right hand leaves a ribbon wherever it moves fast ---------- */
  swing(u, r, dt) {
    if (!GFX.detail || !(dt > 0)) return; const a = u.anim, s = u.sw || (u.sw = { x: 0, y: 0, z: 0, tr: null, on: false });
    if (!(a.atkT > 0 || a.castT > 0) || u.dead || !r.root.visible || !r.handR.visible) { s.on = false; return; }
    const h = r.handR; h.updateWorldMatrix(true, false); _fv1.copy(r.tipR).applyMatrix4(h.matrixWorld); _fv0.copy(r.tipR).multiplyScalar(0.28).applyMatrix4(h.matrixWorld);
    const rx = _fv1.x - u.x, ry = _fv1.y, rz = _fv1.z - u.z, sp = s.on ? Math.hypot(rx - s.x, ry - s.y, rz - s.z) / dt : 0; s.x = rx; s.y = ry; s.z = rz; s.on = true;
    if (sp < 7) return;
    if (!s.tr || s.tr.dead) { s.tr = new SwingTrail(this.scene, u.pcol || 0xffffff); this.trails.push(s.tr); }
    s.tr.add(_fv0.x, _fv0.y, _fv0.z, _fv1.x, _fv1.y, _fv1.z);
  },
  /* ---------- staging ---------- */
  // every hit: the target recoils and sparks fly on along the blow; a heavy one also rings the air, lights the ground, throws pebbles
  impact(src, tgt, d, o) {
    if (!this.near(tgt.x, tgt.z, 46)) return;
    const mag = d / tgt.maxHp, hero = tgt.kind === 'hero', now = G.time, big = hero && (mag > 0.12 || !!o.crit);
    if (!big && now - (tgt.impT || -9) < 0.12) return; tgt.impT = now;
    const a = src ? angTo(src.x, src.z, tgt.x, tgt.z) : rand(TAU), col = (src && src.pcol) || 0xffe0b0, y = tgt.height * 0.55 + (tgt.yOff || 0);
    tgt.jolt = { a, t: 0.16, p: Math.min(0.5, 0.12 + mag * 1.6) * (hero ? 1 : 0.7) };
    if (o.basic && !hero) return;
    this.sparks(tgt.x, y, tgt.z, { n: big ? 12 : 5, color: 0xffffff, color2: col, dir: a, spread: 0.5, speed: [6, big ? 20 : 12], life: [0.12, 0.34], w: big ? 0.15 : 0.1, up: 1.5 });
    if (!big) return;
    this.glow(tgt.x, y, tgt.z, 4.2, col, 0.14, 'star'); this.light(tgt.x, 2, tgt.z, col, 1.6, 12, 0.25);
    this.warp('ring', tgt.x, 0.3, tgt.z, { r0: 0.4, r1: 2.6, str: 0.5, life: 0.28 });
    this.ring(tgt.x, tgt.z, { r0: 0.5, r1: 2.4, color: col, life: 0.26, tex: 'shock', op: 0.7 });
    this.debris(tgt.x + Math.sin(a) * 0.6, 0.2, tgt.z + Math.cos(a) * 0.6, { n: 3, color: 0x3c3934, speed: [2, 6], up: 6, size: [0.12, 0.28], life: 0.7 });
    SFX.at(o.crit ? 'crit' : 'heavy', tgt.x, tgt.z, 0.5);
  },
  // the moment before an ability goes off: energy rushes into the caster. An ultimate bends the air, dims the scene for a blink and rings a sigil
  castCue(h, i, ab) {
    if (ab.toggle || ab.noCue || !this.near(h.x, h.z, 46)) return;
    const c = h.pcol, y = h.height * 0.6 + (h.yOff || 0);
    if (i === 3) {
      this.implode(h.x, y, h.z, 5.5, { n: 26, color: c, color2: 0xffffff, life: 0.34, streak: true });
      this.ring(h.x, h.z, { r0: 5, r1: 0.6, color: c, life: 0.34, tex: 'shock', op: 0.8 });
      this.ring(h.x, h.z, { r0: 1.2, r1: 3.4, color: c, life: 0.7, tex: 'rune2', op: 0.55, spin: 2.5 });
      this.warp('lens', h.x, y, h.z, { r: 4.5, str: 0.9, life: 0.4 });
      this.light(h.x, 2.4, h.z, c, 2.2, 18, 0.5); this.glow(h.x, y, h.z, 3.2, c, 0.3, 'star');
      if (GFX.flash && (h === G.player || this.near(h.x, h.z, 26))) G.dim = Math.max(G.dim || 0, h === G.player ? 1 : 0.6);
      SFX.at('ultcue', h.x, h.z, 0.55);
    } else {
      this.implode(h.x, y, h.z, 2.6, { n: 8, color: c, color2: 0xffffff, life: 0.2, streak: true });
      this.ring(h.x, h.z, { r0: 2.2, r1: 0.7, color: c, life: 0.2, op: 0.5 });
    }
  }
});
