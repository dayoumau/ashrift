'use strict';
/* ===== map layout, nav grid, A*, terrain + decor ===== */
const MAPH = 100, GN = 200;
const BASES = [
  { core: { x: -72, z: 72 }, fountain: { x: -89, z: 89 } },
  { core: { x: 72, z: -72 }, fountain: { x: 89, z: -89 } }
];
function mkLane(pts) {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + dist(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]));
  return { pts, cum, len: cum[cum.length - 1] };
}
const LANES = {
  top: mkLane([[-72, 72], [-82, 50], [-82, -60], [-60, -82], [50, -82], [72, -72]]),
  mid: mkLane([[-72, 72], [72, -72]]),
  bot: mkLane([[-72, 72], [-50, 82], [60, 82], [82, 60], [82, -50], [72, -72]])
};
const LANE_NAMES = ['top', 'mid', 'bot'];
const LANE_RU = { top: 'ВЕРХ', mid: 'ЦЕНТР', bot: 'НИЗ' };
function lanePoint(L, s) {
  s = clamp(s, 0, L.len);
  for (let i = 1; i < L.pts.length; i++) {
    if (s <= L.cum[i] || i === L.pts.length - 1) {
      const a = L.pts[i - 1], b = L.pts[i], sl = L.cum[i] - L.cum[i - 1], t = (s - L.cum[i - 1]) / sl;
      return { x: lerp(a[0], b[0], t), z: lerp(a[1], b[1], t), dx: (b[0] - a[0]) / sl, dz: (b[1] - a[1]) / sl };
    }
  }
}
function laneProject(L, x, z) {
  let bd = 1e9, bs = 0;
  for (let i = 1; i < L.pts.length; i++) {
    const a = L.pts[i - 1], b = L.pts[i], dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz;
    const t = clamp(((x - a[0]) * dx + (z - a[1]) * dz) / l2, 0, 1);
    const d = Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t);
    if (d < bd) { bd = d; bs = L.cum[i - 1] + Math.sqrt(l2) * t; }
  }
  laneProject.d = bd;
  return bs;
}

/* walkable shapes: kind 0 lane, 1 base, 2 river, 3 jungle */
const SHAPES = [];
// jungle camps. 0-3 are the old central clearings, 4-7 the outer ones (two by the rune, two by the boss pit). Team 0 owns W and S (0, 1, 4, 5), team 1 owns E and N (2, 3, 6, 7).
const CAMPS = [
  { x: -46, z: 4, kind: 'beasts' }, { x: -4, z: 46, kind: 'wolves' }, { x: 46, z: -4, kind: 'beasts' }, { x: 4, z: -46, kind: 'wolves' },
  { x: -62, z: -34, kind: 'ogre' }, { x: 34, z: 62, kind: 'spitters' }, { x: 62, z: 34, kind: 'ogre' }, { x: -34, z: -62, kind: 'spitters' }
];
// the Guardian lives in a pit: a dead-end chamber at the head of the river with a single narrow mouth (PIT). The rune sits in the open at the other end.
const BOSS_POS = { x: 44, z: 44 }, RUNE_POS = { x: -38, z: -38 }, PIT = { r: 8.6, mouth: [30, 30] };
(function () {
  const add = (pts, r, kind) => SHAPES.push({ pts, r, kind });
  for (const n of LANE_NAMES) add(LANES[n].pts, n === 'mid' ? 8 : 7.5, 0);
  add([[-78, 78]], 25, 1); add([[-89, 89]], 12, 1); add([[78, -78]], 25, 1); add([[89, -89]], 12, 1);
  add([[-68, -68], PIT.mouth], 6.5, 2);   // the river now ends at the mouth of the pit
  add([PIT.mouth, [39, 39]], 3.7, 3); add([[BOSS_POS.x, BOSS_POS.z]], PIT.r, 3); add([[RUNE_POS.x, RUNE_POS.z]], 8.5, 3);
  const W = { c: [-46, 4], a: [-82, 8], b: [-26, 26], r: [-36, -36] };
  const tf = [p => p, p => [-p[1], -p[0]], p => [-p[0], -p[1]], p => [p[1], p[0]]];
  for (const f of tf) {
    const c = f(W.c), a = f(W.a), b = f(W.b); let r = f(W.r); if (r[0] > 0) r = [24, 24];   // on the pit side the jungle paths come out onto the river below the mouth, not into the pit
    add([c], 9.5, 3); add([a, c], 4.4, 3); add([c, b], 4.4, 3); add([c, r], 4.4, 3);
    // outer clearing: one path to the lane, one toward the rune / boss pit
    const o = f([-62, -34]); let q = f([-44, -37]); if (q[0] > 0 && q[1] > 0) q = q[0] > q[1] ? [37, 27] : [27, 37];
    add([o], 7.6, 3); add([o, f([-80, -36])], 4.2, 3); add([o, q], 4.2, 3);
  }
})();
function segDist(px, pz, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz;
  const t = l2 ? clamp(((px - ax) * dx + (pz - az) * dz) / l2, 0, 1) : 0;
  return Math.hypot(px - ax - dx * t, pz - az - dz * t);
}
const WD = { lane: 0, base: 0, river: 0, jung: 0 };
function walkDist(x, z) {
  let best = -1e9, k = [-1e9, -1e9, -1e9, -1e9];
  for (const s of SHAPES) {
    let d = 1e9; const P = s.pts;
    if (P.length === 1) d = Math.hypot(x - P[0][0], z - P[0][1]);
    else for (let i = 1; i < P.length; i++) { const q = segDist(x, z, P[i - 1][0], P[i - 1][1], P[i][0], P[i][1]); if (q < d) d = q; }
    const v = s.r - d; if (v > best) best = v; if (v > k[s.kind]) k[s.kind] = v;
  }
  WD.lane = k[0]; WD.base = k[1]; WD.river = k[2]; WD.jung = k[3];
  const edge = 97 - Math.max(Math.abs(x), Math.abs(z));
  return Math.min(best, edge);
}
function terrainH(x, z) {
  const d = walkDist(x, z); if (d > 0.2) return 0;
  const t = clamp((0.2 - d) / 4.2, 0, 1);
  return smooth(t) * (2.4 + fbm(x * 0.07 + 7, z * 0.07 + 3) * 3.2);
}

/* ===== nav grid + A* ===== */
const NAV = {
  g: new Uint8Array(GN * GN), gs: new Float32Array(GN * GN), par: new Int32Array(GN * GN),
  seen: new Uint32Array(GN * GN), done: new Uint32Array(GN * GN), gen: 0,
  hn: new Int32Array(70000), hf: new Float32Array(70000), hs: 0,
  build() {
    for (let j = 0; j < GN; j++) for (let i = 0; i < GN; i++)
      this.g[j * GN + i] = walkDist(i - MAPH + 0.5, j - MAPH + 0.5) > 0.75 ? 1 : 0;
    this.g0 = this.g.slice();
  },
  ok(x, z) { const i = Math.floor(x + MAPH), j = Math.floor(z + MAPH); return i >= 0 && j >= 0 && i < GN && j < GN && this.g[j * GN + i] === 1; },
  block(x, z, r, v) {
    for (let j = Math.floor(z - r + MAPH); j <= Math.floor(z + r + MAPH); j++) for (let i = Math.floor(x - r + MAPH); i <= Math.floor(x + r + MAPH); i++) {
      if (i < 0 || j < 0 || i >= GN || j >= GN) continue;
      // unblocking restores the terrain value, so a fallen tower never opens a pocket inside the lane wall
      if (Math.hypot(i - MAPH + 0.5 - x, j - MAPH + 0.5 - z) <= r) this.g[j * GN + i] = v ? 0 : this.g0[j * GN + i];
    }
  },
  los(x1, z1, x2, z2) {
    const n = Math.ceil(dist(x1, z1, x2, z2) / 0.5);
    for (let k = 1; k <= n; k++) { const t = k / n; if (!this.ok(lerp(x1, x2, t), lerp(z1, z2, t))) return false; }
    return true;
  },
  nearest(x, z) {
    if (this.ok(x, z)) return { x, z };
    for (let r = 1; r < 40; r += 0.75) for (let a = 0; a < 16; a++) {
      const px = x + Math.cos(a / 16 * TAU) * r, pz = z + Math.sin(a / 16 * TAU) * r;
      if (this.ok(px, pz)) return { x: px, z: pz };
    }
    return { x: clamp(x, -90, 90), z: clamp(z, -90, 90) };
  },
  hpush(n, f) { let i = this.hs++; const hn = this.hn, hf = this.hf; while (i > 0) { const p = (i - 1) >> 1; if (hf[p] <= f) break; hn[i] = hn[p]; hf[i] = hf[p]; i = p; } hn[i] = n; hf[i] = f; },
  hpop() {
    const hn = this.hn, hf = this.hf, top = hn[0], n = hn[--this.hs], f = hf[this.hs]; let i = 0;
    for (;;) { let c = i * 2 + 1; if (c >= this.hs) break; if (c + 1 < this.hs && hf[c + 1] < hf[c]) c++; if (hf[c] >= f) break; hn[i] = hn[c]; hf[i] = hf[c]; i = c; }
    hn[i] = n; hf[i] = f; return top;
  },
  path(x1, z1, x2, z2) {
    const s = this.nearest(x1, z1), e = this.nearest(x2, z2);
    if (this.los(s.x, s.z, e.x, e.z)) return [{ x: e.x, z: e.z }];
    const si = Math.floor(s.x + MAPH), sj = Math.floor(s.z + MAPH), ei = Math.floor(e.x + MAPH), ej = Math.floor(e.z + MAPH);
    const start = sj * GN + si, goal = ej * GN + ei, g = this.g, gs = this.gs, par = this.par, seen = this.seen, done = this.done;
    const gen = ++this.gen; this.hs = 0;
    gs[start] = 0; par[start] = -1; seen[start] = gen; this.hpush(start, 0);
    let found = false, guard = 0;
    while (this.hs > 0 && guard++ < 60000) {
      const c = this.hpop(); if (done[c] === gen) continue; done[c] = gen;
      if (c === goal) { found = true; break; }
      const ci = c % GN, cj = (c - ci) / GN, cg = gs[c];
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue;
        const ni = ci + di, nj = cj + dj; if (ni < 0 || nj < 0 || ni >= GN || nj >= GN) continue;
        const n = nj * GN + ni; if (!g[n] || done[n] === gen) continue;
        if (di && dj && (!g[cj * GN + ni] || !g[nj * GN + ci])) continue;
        const ng = cg + (di && dj ? 1.4142 : 1);
        if (seen[n] !== gen || ng < gs[n]) {
          gs[n] = ng; par[n] = c; seen[n] = gen;
          const hx = Math.abs(ni - ei), hz = Math.abs(nj - ej);
          if (this.hs < 69990) this.hpush(n, ng + (hx + hz - 0.5858 * Math.min(hx, hz)) * 1.02);
        }
      }
    }
    if (!found) return [{ x: e.x, z: e.z }];
    const pts = []; let c = goal;
    while (c !== -1) { const ci = c % GN; pts.push({ x: ci - MAPH + 0.5, z: (c - ci) / GN - MAPH + 0.5 }); c = par[c]; }
    pts.reverse(); pts[0] = { x: s.x, z: s.z }; pts[pts.length - 1] = { x: e.x, z: e.z };
    const out = []; let a = 0;
    while (a < pts.length - 1) {
      let b = Math.min(pts.length - 1, a + 48);
      while (b > a + 1 && !this.los(pts[a].x, pts[a].z, pts[b].x, pts[b].z)) b--;
      out.push(pts[b]); a = b;
    }
    return out;
  }
};

/* ===== world visuals ===== */
const WORLD = { water: null, crystals: null, t: 0, uDet: { value: 1 }, extra: [] };
// which side of the map a point is on: 0 by the blue base (the living forest), 1 by the red base (the burnt one). The river runs along the border
function sideK(x, z) { return smooth(clamp(((x - z) / 144 + 0.4) / 0.8, 0, 1)); }
function buildWorld(scene) {
  NAV.build();
  // --- terrain
  const SEG = 200, SIZE = 270;
  const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG); geo.rotateX(-Math.PI / 2);
  const P = geo.attributes.position, colors = new Float32Array(P.count * 3);
  const C = h => new THREE.Color(h), masks = new Float32Array(P.count * 3);
  // two palettes, blended by the side of the map: [0] the living forest around the blue base, [1] the burnt one around the red base
  const PAL = k => ({ lane: C(k ? 0x5e4f45 : 0x595348), laneE: C(k ? 0x44372f : 0x434238), jung: C(k ? 0x3b322e : 0x2f4636), moss: C(k ? 0x56504c : 0x3f5c40), base: C(k ? 0x58494a : 0x48525f), rock: C(k ? 0x473f40 : 0x464c58), rockD: C(k ? 0x2a2426 : 0x282d36), top: C(k ? 0x2d2424 : 0x20302a) });
  const PA = PAL(0), PB = PAL(1), cc = {}; for (const key in PA) cc[key] = new THREE.Color();
  const cRiver = C(0x22343a), cBank = C(0x3a403a), cPit = C(0x2a2136), tmp = new THREE.Color();
  const cLane = cc.lane, cLaneE = cc.laneE, cJung = cc.jung, cBase = cc.base, cRock = cc.rock, cRockD = cc.rockD, cTop = cc.top;
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i), z = P.getZ(i), d = walkDist(x, z), sk = sideK(x, z);
    for (const key in PA) cc[key].copy(PA[key]).lerp(PB[key], sk);
    let h = 0, mRock = 0, mLane = 0; const n = fbm(x * 0.21, z * 0.21), n2 = vnoise(x * 0.9, z * 0.9);
    if (d > 0.2) {
      if (WD.river >= d - 0.01 && WD.lane < 2) { tmp.copy(cRiver); h = -0.25 * clamp(WD.river / 3, 0, 1); if (WD.river < 1.3) tmp.lerp(cBank, 1 - WD.river / 1.3); }
      else if (WD.base >= d - 0.01 && WD.lane < WD.base) tmp.copy(cBase).lerp(cLane, clamp(n * 0.6, 0, 1));
      else if (WD.lane >= d - 0.01) { tmp.copy(cLaneE).lerp(cLane, clamp(WD.lane / 5, 0, 1)); mLane = clamp(WD.lane / 3, 0, 1); }
      else { tmp.copy(cJung).lerp(cc.moss, clamp((n - 0.42) * 2.4, 0, 1)); if (WD.river > -2.2) tmp.lerp(cBank, clamp((WD.river + 2.2) / 2.2, 0, 1) * 0.7); mRock = 0.16 * sk; }
      const pd = Math.hypot(x - BOSS_POS.x, z - BOSS_POS.z); if (pd < PIT.r + 1) tmp.lerp(cPit, clamp((PIT.r + 1 - pd) / 3, 0, 0.8));   // the pit floor: dark, scorched violet
      if (d < 1.4) tmp.lerp(cRockD, (1.4 - d) / 1.4 * 0.5);
      tmp.multiplyScalar(0.86 + n2 * 0.24);
    } else {
      const t = clamp((0.2 - d) / 4.2, 0, 1);
      h = smooth(t) * (2.4 + fbm(x * 0.07 + 7, z * 0.07 + 3) * 3.2);
      if (t < 0.75) tmp.copy(cRockD).lerp(cRock, clamp(t * 1.6, 0, 1)); else tmp.copy(cRock).lerp(cTop, (t - 0.75) * 4);
      tmp.multiplyScalar(0.8 + n2 * 0.35); mRock = clamp(t * 2.2, 0, 1);
    }
    P.setY(i, h);
    colors[i * 3] = tmp.r; colors[i * 3 + 1] = tmp.g; colors[i * 3 + 2] = tmp.b; masks[i * 3] = mRock; masks[i * 3 + 1] = mLane; masks[i * 3 + 2] = sk;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3)); geo.setAttribute('aM', new THREE.BufferAttribute(masks, 3));
  geo.computeVertexNormals();
  // ground material: the stock lit material plus world-space noise in the colour, cloud shadows drifting across the map, and veins that glow in the rock
  // (teal on the living side, ember on the burnt one). aM = (rock, lane, side)
  const gmatl = new THREE.MeshPhongMaterial({ vertexColors: true, flatShading: true, shininess: 4, specular: 0x050505 });
  gmatl.onBeforeCompile = sh => {
    sh.uniforms.uNz = FXU.uNz; sh.uniforms.uT = FXU.uT; sh.uniforms.uDet = WORLD.uDet;
    sh.vertexShader = 'attribute vec3 aM; varying vec3 vM; varying vec3 vWp;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vM = aM; vWp = position;');
    sh.fragmentShader = 'uniform sampler2D uNz; uniform float uT, uDet; varying vec3 vM; varying vec3 vWp;\n' + sh.fragmentShader
      .replace('#include <color_fragment>', `#include <color_fragment>
        { vec2 gp = vWp.xz; float gn1 = texture2D(uNz, gp * .037).r, gn2 = texture2D(uNz, gp * .15 + .37).g;
          diffuseColor.rgb *= mix(1., .78 + .28 * gn1 + .18 * gn2, uDet);
          float gcl = texture2D(uNz, gp * .0085 + vec2(uT * .0042, uT * .003)).r;
          diffuseColor.rgb *= mix(1., mix(.7, 1.1, smoothstep(.3, .7, gcl)), uDet); }`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        { vec2 gp = vWp.xz; float gr1 = 1. - abs(2. * texture2D(uNz, gp * .052 + .11).g - 1.), gr2 = texture2D(uNz, gp * .021 + .6).r;
          float vein = smoothstep(.95, .997, gr1) * smoothstep(.34, .66, gr2), pulse = .55 + .45 * sin(uT * .9 + gp.x * .21 + gp.y * .17);
          totalEmissiveRadiance += mix(vec3(.05, .42, .4), vec3(1.2, .34, .06), vM.z) * vein * vM.x * pulse * uDet * .85; }`);
  };
  const ground = new THREE.Mesh(geo, gmatl);
  ground.receiveShadow = true; scene.add(ground);

  // --- water ribbon along the river
  const wg = new THREE.PlaneGeometry(12.5, 196, 1, 1); wg.rotateX(-Math.PI / 2);
  const wm = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, uniforms: { t: { value: 0 }, uNz: FXU.uNz, uGain: FXU.uGain },
    vertexShader: 'varying vec2 vUv; varying vec2 vW; void main(){ vUv=uv; vec4 w=modelMatrix*vec4(position,1.); vW=w.xz; gl_Position=projectionMatrix*viewMatrix*w; }',
    // the current runs down the diagonal toward the pit; three layers of noise slide over each other, the crests glint, foam gathers along the banks.
    // The water is teal by the rune and darkens to violet where it reaches the Guardian's pit
    fragmentShader: `uniform float t, uGain; uniform sampler2D uNz; varying vec2 vUv; varying vec2 vW;
      void main(){ vec2 fl=vec2(.7071,.7071)*t; float s=(vW.x+vW.y)*.5;
        float n1=texture2D(uNz,vW*.024-fl*.02).r, n2=texture2D(uNz,vW*.055-fl*.045+.4).g, n3=texture2D(uNz,vW*.085-fl*.075+.7).b; float w=n1*.5+n2*.34+n3*.16;
        float e=smoothstep(0.,.16,vUv.x)*smoothstep(1.,.84,vUv.x)*smoothstep(0.,.03,vUv.y)*smoothstep(1.,.97,vUv.y);
        vec3 deep=mix(vec3(.03,.13,.16),vec3(.09,.06,.2),smoothstep(-6.,30.,s)); vec3 c=mix(deep,deep*2.6+vec3(.02,.09,.08),smoothstep(.36,.68,w));
        float sp=smoothstep(.62,.8,w)*smoothstep(.45,.75,n3); float bank=1.-smoothstep(.08,.3,min(vUv.x,1.-vUv.x)); float foam=bank*smoothstep(.42,.62,n2*.6+n3*.5);
        c+=vec3(.45,.8,.85)*sp*.4*uGain+vec3(.55,.72,.75)*foam*.4;
        gl_FragColor=vec4(c,min(1.,(.8+w*.14+foam*.1))*e); }`
  });
  const water = new THREE.Mesh(wg, wm); water.position.y = -0.04; water.rotation.y = Math.PI / 4; scene.add(water); WORLD.water = water;

  // --- trees / rocks / crystals (instanced)
  const treeGeo = mergeParts([
    { g: new THREE.CylinderGeometry(0.16, 0.3, 1.8, 5), m: TRS(0, 0.9, 0), c: 0x2a221c },
    { g: new THREE.ConeGeometry(1.45, 2.3, 6), m: TRS(0, 2.4, 0), c: 0x1d2a23 },
    { g: new THREE.ConeGeometry(1.1, 2.0, 6), m: TRS(0, 3.6, 0, 0, 0.5), c: 0x233229 },
    { g: new THREE.ConeGeometry(0.7, 1.7, 6), m: TRS(0, 4.7, 0), c: 0x2a3b30 }
  ]);
  const rockGeo = mergeParts([{ g: new THREE.IcosahedronGeometry(1, 0), c: 0x4b4d55 }, { g: new THREE.IcosahedronGeometry(0.6, 0), m: TRS(0.8, -0.2, 0.3, 1, 2, 0), c: 0x3d3f46 }]);
  // the burnt side: the same fir scorched to rust, and bare dead trees with a few leaves still clinging
  const ashFirGeo = mergeParts([
    { g: new THREE.CylinderGeometry(0.16, 0.3, 1.8, 5), m: TRS(0, 0.9, 0), c: 0x1c1513 },
    { g: new THREE.ConeGeometry(1.35, 2.2, 6), m: TRS(0, 2.4, 0), c: 0x4a2a1c },
    { g: new THREE.ConeGeometry(1.0, 1.9, 6), m: TRS(0, 3.5, 0, 0, 0.5), c: 0x6b3a1e },
    { g: new THREE.ConeGeometry(0.62, 1.6, 6), m: TRS(0, 4.55, 0), c: 0x8c4d22 }
  ]);
  const deadGeo = mergeParts([
    { g: new THREE.CylinderGeometry(0.12, 0.32, 3.6, 5), m: TRS(0, 1.8, 0), c: 0x1e1816 },
    { g: new THREE.CylinderGeometry(0.05, 0.11, 1.9, 4), m: TRS(0.55, 2.9, 0.1, 0, 0, -0.75), c: 0x241d1a },
    { g: new THREE.CylinderGeometry(0.05, 0.1, 1.6, 4), m: TRS(-0.45, 3.3, -0.2, 0.3, 0, 0.7), c: 0x241d1a },
    { g: new THREE.CylinderGeometry(0.04, 0.09, 1.3, 4), m: TRS(0.1, 4.0, 0.4, -0.7, 0, -0.15), c: 0x241d1a },
    { g: new THREE.CylinderGeometry(0.03, 0.07, 1.1, 4), m: TRS(-0.15, 4.2, -0.35, 0.6, 0, 0.25), c: 0x241d1a },
    { g: new THREE.IcosahedronGeometry(0.42, 0), m: TRS(1.15, 3.5, 0.15, 0, 0, 0, 1, 0.6, 1), c: 0x8a4a20 },
    { g: new THREE.IcosahedronGeometry(0.34, 0), m: TRS(-0.95, 3.85, -0.3, 0, 0, 0, 1, 0.6, 1), c: 0x6a3418 },
    { g: new THREE.IcosahedronGeometry(0.3, 0), m: TRS(0.15, 4.55, 0.75, 0, 0, 0, 1, 0.6, 1), c: 0xa85a22 }
  ]);
  // the living side: a broad-crowned tree among the firs
  const leafGeo = mergeParts([
    { g: new THREE.CylinderGeometry(0.2, 0.36, 2.2, 5), m: TRS(0, 1.1, 0), c: 0x2e241c },
    { g: new THREE.IcosahedronGeometry(1.5, 0), m: TRS(0, 3.1, 0, 0, 0, 0, 1, 0.82, 1), c: 0x2a4a33 },
    { g: new THREE.IcosahedronGeometry(1.05, 0), m: TRS(0.85, 3.8, 0.3, 0.4, 0.8, 0, 1, 0.8, 1), c: 0x35593b },
    { g: new THREE.IcosahedronGeometry(0.95, 0), m: TRS(-0.7, 3.9, -0.45, 0.2, 2.1, 0, 1, 0.8, 1), c: 0x3f6845 }
  ]);
  const kinds = [[], [], [], []], rocks = [], crys = [[], []];   // kinds: fir, broadleaf, scorched fir, dead tree
  for (let z = -118; z <= 118; z += 2.4) for (let x = -118; x <= 118; x += 2.4) {
    const jx = x + (hash2(x, z) - 0.5) * 2, jz = z + (hash2(z + 3, x - 7) - 0.5) * 2, d = walkDist(jx, jz), r = hash2(x * 1.7, z * 2.3);
    const sk = sideK(jx, jz) + (hash2(x * 0.7 + 3, z * 0.9) - 0.5) * 0.3, r2 = hash2(z * 1.3 + 5, x * 2.1);
    if (d < -2.2) { if (r < (d > -12 ? 0.52 : 0.24)) kinds[sk < 0.5 ? (r2 < 0.3 ? 1 : 0) : (r2 < 0.5 ? 3 : 2)].push([jx, jz, r]); else if (r > 0.982 && d > -9) crys[sk < 0.5 ? 0 : 1].push([jx, jz, r]); }
    else if (d < -0.5 && r < 0.3) rocks.push([jx, jz, r]);
  }
  const matI = new THREE.MeshPhongMaterial({ vertexColors: true, flatShading: true, shininess: 3, specular: 0x040404 });
  // foliage sways: every instance leans by a sine of time and of where it stands; the higher the vertex, the further it moves
  const windMat = (amp, base) => { const m = matI.clone(); m.onBeforeCompile = sh => { sh.uniforms.uT = FXU.uT; sh.uniforms.uWind = { value: new THREE.Vector2(amp, base) }; sh.vertexShader = 'uniform float uT; uniform vec2 uWind;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      #ifdef USE_INSTANCING
      { float wph = instanceMatrix[3].x * .37 + instanceMatrix[3].z * .29 + uT * 1.3; float wamp = max(0., position.y - uWind.y) * uWind.x; transformed.x += sin(wph) * wamp; transformed.z += cos(wph * .8 + 1.) * wamp * .7; }
      #endif`); }; return m; };
  const matT = windMat(0.034, 0.7), dummy = new THREE.Object3D(), col = new THREE.Color();
  [treeGeo, leafGeo, ashFirGeo, deadGeo].forEach((tg, ki) => {
    const trees = kinds[ki], tm = new THREE.InstancedMesh(tg, matT, trees.length); tm.castShadow = true;
    trees.forEach((t, i) => {
      const s = (ki === 1 ? 0.8 : 0.75) + t[2] * (ki === 1 ? 0.8 : 1.1); dummy.position.set(t[0], terrainH(t[0], t[1]) - 0.2, t[1]); dummy.rotation.set((hash2(t[0], 1) - 0.5) * 0.12, t[2] * 40, (hash2(t[1], 2) - 0.5) * 0.12);
      dummy.scale.set(s, s * (0.9 + hash2(t[0], t[1]) * 0.5), s); dummy.updateMatrix(); tm.setMatrixAt(i, dummy.matrix);
      const k = 0.72 + hash2(t[1], t[0]) * 0.56; col.setRGB(k, k * (0.95 + t[2] * 0.15), k); tm.setColorAt(i, col);
    });
    tm.frustumCulled = false; scene.add(tm);
  });
  const rm = new THREE.InstancedMesh(rockGeo, matI, rocks.length); rm.castShadow = true; rm.receiveShadow = true;
  rocks.forEach((t, i) => {
    const s = 0.6 + t[2] * 3.2, sk = sideK(t[0], t[1]); dummy.position.set(t[0], terrainH(t[0], t[1]) + 0.1, t[1]); dummy.rotation.set(t[2] * 9, t[2] * 31, t[2] * 17);
    dummy.scale.set(s, s * 0.8, s * 1.1); dummy.updateMatrix(); rm.setMatrixAt(i, dummy.matrix);
    const k = 0.75 + hash2(t[1], t[0]) * 0.5; col.setRGB(k * lerp(0.96, 1.06, sk), k * lerp(1.02, 0.95, sk), k * lerp(1.12, 0.92, sk)); rm.setColorAt(i, col);   // cool stone on one side, warm on the other
  });
  rm.frustumCulled = false; scene.add(rm);
  // crystals: teal in the living forest, ember-red in the burnt one
  const cg = new THREE.OctahedronGeometry(0.5, 0); cg.scale(0.6, 1.7, 0.6); WORLD.crystals = [];
  crys.forEach((list, ci) => {
    const cm = new THREE.InstancedMesh(cg, new THREE.MeshBasicMaterial({ color: ci ? 0xc8502a : 0x2f8f86 }), list.length);
    list.forEach((t, i) => { const s = 0.7 + hash2(t[0], t[1]) * 0.9; dummy.position.set(t[0], terrainH(t[0], t[1]) + 0.5, t[1]); dummy.rotation.set((t[2] - 0.99) * 30, t[2] * 50, 0.25); dummy.scale.setScalar(s); dummy.updateMatrix(); cm.setMatrixAt(i, dummy.matrix); });
    cm.frustumCulled = false; scene.add(cm); WORLD.crystals.push(cm);
  });

  // --- lane lantern posts
  const posts = [];
  for (const n of LANE_NAMES) { const L = LANES[n]; for (let s = 26; s < L.len - 20; s += 17) { const p = lanePoint(L, s), sd = (Math.round(s / 17) % 2 ? 1 : -1) * 8.2; posts.push([p.x + p.dz * sd, p.z - p.dx * sd]); } }
  const pg = mergeParts([
    { g: new THREE.CylinderGeometry(0.22, 0.34, 2.2, 5), m: TRS(0, 1.1, 0), c: 0x3c3e44 },
    { g: new THREE.BoxGeometry(0.7, 0.18, 0.7), m: TRS(0, 2.25, 0), c: 0x2e3035 },
    { g: new THREE.BoxGeometry(0.9, 0.3, 0.9), m: TRS(0, 0.15, 0), c: 0x2e3035 }
  ]);
  const pm = new THREE.InstancedMesh(pg, matI.clone(), posts.length); pm.castShadow = true;
  const lg = new THREE.OctahedronGeometry(0.24, 0);
  const lm = new THREE.InstancedMesh(lg, new THREE.MeshBasicMaterial({ color: 0xd49a4a }), posts.length); WORLD.lamps = lm;
  posts.forEach((t, i) => {
    dummy.position.set(t[0], 0, t[1]); dummy.rotation.set(0, i, 0); dummy.scale.setScalar(1); dummy.updateMatrix(); pm.setMatrixAt(i, dummy.matrix);
    dummy.position.set(t[0], 2.75, t[1]); dummy.updateMatrix(); lm.setMatrixAt(i, dummy.matrix);
  });
  pm.frustumCulled = lm.frustumCulled = false; scene.add(pm, lm);

  // --- the Guardian's pit: a ring of stone teeth with one gap at the mouth (tall at the back, low toward the camera so the fight stays visible),
  //     glowing shards between them, two obelisks at the entrance and a sigil burnt into the floor
  {
    const bx = BOSS_POS.x, bz = BOSS_POS.z, R = PIT.r + 2.1, ae = Math.atan2(PIT.mouth[1] - bz, PIT.mouth[0] - bx), teeth = [], shards = [];
    for (let i = 0; i < 34; i++) {
      const a = i / 34 * TAU + 0.05, da = Math.abs(Math.atan2(Math.sin(a - ae), Math.cos(a - ae))); if (da < 0.62) continue;
      const back = clamp((1 - Math.sin(a)) / 2, 0, 1), h = lerp(1.3, 5.2, back) * (0.75 + hash2(i, 3) * 0.5), rr = R + (hash2(i, 9) - 0.5) * 1.4;
      teeth.push([bx + Math.cos(a) * rr, bz + Math.sin(a) * rr, a, h, hash2(i, 5)]);
      if (i % 4 === 1) shards.push([bx + Math.cos(a) * (rr - 1.1), bz + Math.sin(a) * (rr - 1.1), h * 0.55, hash2(i, 7)]);
    }
    const tg = mergeParts([{ g: new THREE.ConeGeometry(1.25, 1, 5), m: TRS(0, 0.5, 0), c: 0x3a3b44 }, { g: new THREE.ConeGeometry(0.75, 0.7, 4), m: TRS(0.7, 0.3, 0.4, 0, 1, 0.25), c: 0x2e2f37 }]);
    const tm2 = new THREE.InstancedMesh(tg, matI, teeth.length); tm2.castShadow = true; tm2.receiveShadow = true;
    teeth.forEach((t, i) => {
      dummy.position.set(t[0], terrainH(t[0], t[1]) - 0.3, t[1]); dummy.rotation.set(0, -t[2] + t[4] * 2, 0); dummy.rotateOnWorldAxis(new THREE.Vector3(Math.sin(t[2]), 0, -Math.cos(t[2])), -0.22);   // lean in over the pit
      dummy.scale.set(1.1 + t[4] * 0.7, t[3], 1.1 + t[4] * 0.7); dummy.updateMatrix(); tm2.setMatrixAt(i, dummy.matrix); const k = 0.7 + t[4] * 0.5; col.setRGB(k, k * 0.97, k * 1.08); tm2.setColorAt(i, col);
    });
    tm2.frustumCulled = false; scene.add(tm2);
    const sg = new THREE.OctahedronGeometry(0.5, 0); sg.scale(0.55, 1.9, 0.55);
    const sm = new THREE.InstancedMesh(sg, new THREE.MeshBasicMaterial({ color: 0x8a5cff }), shards.length + 2);
    const ex = Math.cos(ae), ez = Math.sin(ae), ob = [[bx + ex * (PIT.r + 1.6) - ez * 5.2, bz + ez * (PIT.r + 1.6) + ex * 5.2], [bx + ex * (PIT.r + 1.6) + ez * 5.2, bz + ez * (PIT.r + 1.6) - ex * 5.2]];
    shards.forEach((t, i) => { dummy.position.set(t[0], t[2] + 0.4, t[1]); dummy.rotation.set(t[3] - 0.5, t[3] * 9, 0.3); dummy.scale.setScalar(0.9 + t[3] * 0.8); dummy.updateMatrix(); sm.setMatrixAt(i, dummy.matrix); });
    const og = mergeParts([{ g: new THREE.CylinderGeometry(0.45, 0.75, 3.6, 4), m: TRS(0, 1.8, 0, 0, 0.785), c: 0x34353d }, { g: new THREE.BoxGeometry(1.5, 0.4, 1.5), m: TRS(0, 0.2, 0), c: 0x2a2b32 }, { g: new THREE.BoxGeometry(0.95, 0.22, 0.95), m: TRS(0, 3.65, 0), c: 0x2a2b32 }]);
    const om = new THREE.InstancedMesh(og, matI, 2); om.castShadow = true;
    ob.forEach((p, i) => { dummy.position.set(p[0], terrainH(p[0], p[1]), p[1]); dummy.rotation.set(0, i, 0); dummy.scale.setScalar(1); dummy.updateMatrix(); om.setMatrixAt(i, dummy.matrix); col.setRGB(1, 1, 1); om.setColorAt(i, col);
      dummy.position.set(p[0], terrainH(p[0], p[1]) + 4.5, p[1]); dummy.rotation.set(0, 0.6, 0); dummy.scale.setScalar(1.15); dummy.updateMatrix(); sm.setMatrixAt(shards.length + i, dummy.matrix); });
    sm.frustumCulled = om.frustumCulled = false; scene.add(sm, om); WORLD.pit = sm;
    for (const [r0, r1, op] of [[PIT.r - 1.5, PIT.r - 1.2, 0.5], [PIT.r - 4.2, PIT.r - 4.05, 0.35], [2.6, 2.8, 0.4]]) { const m = new THREE.Mesh(new THREE.RingGeometry(r0, r1, 48), new THREE.MeshBasicMaterial({ color: 0x6a44c8, transparent: true, opacity: op, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(bx, 0.07, bz); m.renderOrder = 2; scene.add(m); }
    const sl = PIT.r - 4.3, spoke = new THREE.PlaneGeometry(0.16, sl); spoke.rotateX(-Math.PI / 2);
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.26, rc = 2.8 + sl / 2, m = new THREE.Mesh(spoke, new THREE.MeshBasicMaterial({ color: 0x6a44c8, transparent: true, opacity: 0.32, depthWrite: false })); m.rotation.y = Math.PI / 2 - a; m.position.set(bx + Math.cos(a) * rc, 0.07, bz + Math.sin(a) * rc); m.renderOrder = 2; scene.add(m); }
  }

  // --- base plates, team-coloured inlays and banners behind the fountain
  for (let t = 0; t < 2; t++) {
    const b = BASES[t], tc = TEAM_COL[t], sg = t ? 1 : -1;
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(9, 9.6, 0.3, 28), new THREE.MeshPhongMaterial({ color: t ? 0x4a4042 : 0x3f444f, flatShading: true, shininess: 6 }));
    plate.position.set(b.fountain.x, 0.05, b.fountain.z); plate.receiveShadow = true; scene.add(plate);
    const cp = new THREE.Mesh(new THREE.CylinderGeometry(7, 7.6, 0.25, 10), new THREE.MeshPhongMaterial({ color: t ? 0x443a3c : 0x393e47, flatShading: true, shininess: 6 }));
    cp.position.set(b.core.x, 0.04, b.core.z); cp.receiveShadow = true; scene.add(cp);
    for (const [cx, cz, r0, r1, op, y] of [[b.fountain.x, b.fountain.z, 8.35, 8.6, 0.55, 0.22], [b.fountain.x, b.fountain.z, 5.0, 5.12, 0.4, 0.22], [b.core.x, b.core.z, 6.45, 6.7, 0.5, 0.19], [b.core.x, b.core.z, 9.6, 9.72, 0.3, 0.07]]) {
      const m = new THREE.Mesh(new THREE.RingGeometry(r0, r1, 56), new THREE.MeshBasicMaterial({ color: tc, transparent: true, opacity: op, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(cx, y, cz); m.renderOrder = 2; scene.add(m);
    }
    // five banners on the far arc of the fountain plate
    const parts = [], ca = Math.atan2(sg * -1, sg * 1);   // direction from the map centre out through the fountain: (sg, -sg)
    for (let i = -2; i <= 2; i++) {
      const a = ca + i * 0.42, x = b.fountain.x + Math.cos(a) * 7.6, z = b.fountain.z + Math.sin(a) * 7.6, ry = -a + Math.PI / 2;
      parts.push({ g: new THREE.CylinderGeometry(0.07, 0.1, 5.2, 5), m: TRS(x, 2.8, z), c: 0x2e3036 }, { g: new THREE.BoxGeometry(1.0, 0.1, 0.1), m: TRS(x, 5.2, z, 0, ry), c: 0x2e3036 }, { g: new THREE.OctahedronGeometry(0.16, 0), m: TRS(x, 5.55, z), c: 0xc9a24a },
        { g: new THREE.BoxGeometry(0.86, 1.9, 0.04), m: TRS(x, 4.2, z, 0, ry), c: tc }, { g: new THREE.ConeGeometry(0.43, 0.5, 3), m: TRS(x, 3.0, z, Math.PI, ry + Math.PI / 6, 0, 1, 1, 0.1), c: tc }, { g: new THREE.BoxGeometry(0.3, 0.3, 0.06), m: TRS(x, 4.5, z, 0, ry, Math.PI / 4), c: 0xe8e2d0 });
    }
    const bn = new THREE.Mesh(mergeParts(parts), matI.clone()); bn.castShadow = true; scene.add(bn);
  }

  // --- paving: worn flagstones down every lane (denser in the middle, missing in patches) and rings of slabs around each base
  {
    const slabs = [], bc = [[-78, 78], [78, -78]];
    for (const n of LANE_NAMES) {
      const L = LANES[n];
      for (let s = 12; s < L.len - 12; s += 1.72) {
        const p = lanePoint(L, s), ang = Math.atan2(p.dx, p.dz);
        for (let o = -5.4; o <= 5.4; o += 1.8) {
          const r = hash2(s * 3.1 + o, o * 7.7 + s * 0.3 + n.length); if (r > 0.86 - Math.abs(o) / 5.4 * 0.5) continue;
          const x = p.x + p.dz * o + (r - 0.4) * 0.5, z = p.z - p.dx * o + (hash2(o, s) - 0.5) * 0.5;
          if (Math.hypot(x - bc[0][0], z - bc[0][1]) < 23.5 || Math.hypot(x - bc[1][0], z - bc[1][1]) < 23.5 || walkDist(x, z) < 1) continue;
          slabs.push([x, z, ang + (hash2(x, z) - 0.5) * 0.22, 1.15 + r * 0.5, 1.0 + hash2(z, x) * 0.5, sideK(x, z), hash2(x * 1.3, z * 0.7), 0]);
        }
      }
    }
    for (let t = 0; t < 2; t++) for (let rr = 2.6; rr < 23; rr += 1.9) {
      const nn = Math.max(6, Math.round(TAU * rr / 1.95));
      for (let i = 0; i < nn; i++) {
        const a = (i + (Math.round(rr / 1.9) % 2) * 0.5) / nn * TAU, x = bc[t][0] + Math.cos(a) * rr, z = bc[t][1] + Math.sin(a) * rr, f = BASES[t].fountain, c = BASES[t].core;
        if (hash2(x, z) > 0.9 || walkDist(x, z) < 0.8 || Math.hypot(x - f.x, z - f.z) < 9.9 || Math.hypot(x - c.x, z - c.z) < 7.9) continue;
        slabs.push([x, z, Math.PI / 2 - a, 1.72, 1.6, t, hash2(x * 1.3, z * 0.7), 1]);
      }
    }
    const sg2 = mergeParts([{ g: new THREE.BoxGeometry(1, 0.1, 1), c: 0xffffff }]), smesh = new THREE.InstancedMesh(sg2, new THREE.MeshPhongMaterial({ vertexColors: true, flatShading: true, shininess: 8, specular: 0x0a0a0a }), slabs.length); smesh.receiveShadow = true;
    slabs.forEach((s, i) => {
      dummy.position.set(s[0], -0.022 + s[6] * 0.006, s[1]); dummy.rotation.set(0, s[2], 0); dummy.scale.set(s[3], 1, s[4]); dummy.updateMatrix(); smesh.setMatrixAt(i, dummy.matrix);
      // slab colour is kept near the ground's own brightness: lighter slabs cross the bloom threshold in sunlight and start to glow
      const k = 0.27 + s[6] * 0.08, w = s[5]; if (s[7]) col.setRGB(k * lerp(0.96, 1.16, w), k * lerp(1.04, 0.94, w), k * lerp(1.22, 0.94, w)); else col.setRGB(k * lerp(1.0, 1.12, w), k * lerp(1.02, 0.95, w) * (s[6] > 0.8 && w < 0.5 ? 1.1 : 1), k * lerp(0.98, 0.86, w));
      smesh.setColorAt(i, col);
    });
    smesh.frustumCulled = false; scene.add(smesh);
  }

  // --- undergrowth: tufts of grass over the forest floor and along the lane edges (green on one side, dry on the other), reeds on the river banks,
  //     and small lights among it all: glowing flowers in the living forest, embers in the burnt one
  {
    const tuft = [], dots = [], bl = [];
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + 0.3, hh = 0.42 + (i % 2) * 0.16; bl.push({ g: new THREE.ConeGeometry(0.07, hh, 3), m: TRS(Math.sin(a) * 0.12, hh * 0.42, Math.cos(a) * 0.12, Math.cos(a) * 0.55, 0, -Math.sin(a) * 0.55), c: i % 2 ? 0x4e5846 : 0x3f4839 }); }
    for (let z = -96; z <= 96; z += 1.45) for (let x = -96; x <= 96; x += 1.45) {
      const jx = x + (hash2(x * 1.1, z) - 0.5) * 1.3, jz = z + (hash2(z * 1.3, x) - 0.5) * 1.3, d = walkDist(jx, jz); if (d < 0.5) continue;
      const jungle = WD.jung >= d - 0.01, edge = WD.lane >= d - 0.01 && WD.lane < 2.4, bank = WD.river >= d - 0.01 && WD.river < 1.1; if (!jungle && !edge && !bank) continue;
      if (Math.hypot(jx - BOSS_POS.x, jz - BOSS_POS.z) < PIT.r + 0.5) continue;
      const sk = sideK(jx, jz), r = hash2(x * 2.3, z * 1.7);
      if (r < (bank ? 0.5 : lerp(0.5, 0.26, sk) * (edge ? 0.8 : 1))) tuft.push([jx, jz, r, sk, bank ? 1 : 0]);
      else if (r > 0.972 && jungle) dots.push([jx, jz, r, sk]);
    }
    const matG = windMat(0.3, 0.05), gm = new THREE.InstancedMesh(mergeParts(bl), matG, tuft.length);
    tuft.forEach((t, i) => {
      const s = 0.7 + t[2] * 1.5; dummy.position.set(t[0], 0, t[1]); dummy.rotation.set(0, t[2] * 50, 0); dummy.scale.set(s, s * (t[4] ? 2.3 : 1), s); dummy.updateMatrix(); gm.setMatrixAt(i, dummy.matrix);
      const k = 0.72 + hash2(t[1], t[0]) * 0.36, w = t[3]; if (t[4]) col.setRGB(k * 0.62, k * 1.02, k * 0.9); else col.setRGB(k * lerp(0.74, 1.3, w), k * lerp(1.2, 0.98, w), k * lerp(0.72, 0.6, w)); gm.setColorAt(i, col);
    });
    gm.frustumCulled = false; gm.receiveShadow = true; scene.add(gm); WORLD.extra.push(gm);
    const dm = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.11, 0), new THREE.MeshBasicMaterial({ color: 0xffffff }), dots.length);
    dots.forEach((t, i) => { const ash = t[3] > 0.5; dummy.position.set(t[0], ash ? 0.07 : 0.34, t[1]); dummy.rotation.set(0, t[2] * 40, 0); dummy.scale.set(ash ? 1.5 : 1, ash ? 0.5 : 1.2, ash ? 1.5 : 1); dummy.updateMatrix(); dm.setMatrixAt(i, dummy.matrix); if (ash) col.setRGB(1.8, 0.62, 0.16); else if (t[2] > 0.986) col.setRGB(1.5, 1.25, 0.5); else col.setRGB(0.45, 1.3, 1.4); dm.setColorAt(i, col); });
    dm.frustumCulled = false; scene.add(dm); WORLD.extra.push(dm); WORLD.dots = dm;
  }

  // --- a pool of warm light on the ground under every lantern (one merged mesh), and brighter lantern stones
  {
    const pos = [], uv = [], idx = [], R = 5.2;
    posts.forEach((t, i) => { const b = i * 4; pos.push(t[0] - R, 0.06, t[1] - R, t[0] + R, 0.06, t[1] - R, t[0] + R, 0.06, t[1] + R, t[0] - R, 0.06, t[1] + R); uv.push(0, 0, 1, 0, 1, 1, 0, 1); idx.push(b, b + 2, b + 1, b, b + 3, b + 2); });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
    const m = new THREE.Mesh(g, FX.mat('glow', 0xe0a050, 0.34, true, true)); m.renderOrder = 2; m.frustumCulled = false; scene.add(m); WORLD.pools = m; WORLD.extra.push(m);
  }

  // --- standing stones around every jungle camp, each with a rune lit in the colour of what lives there; a sigil on the ground at the rune spot
  {
    const KC = { beasts: [1.5, 0.95, 0.35], wolves: [0.6, 1.0, 1.6], spitters: [0.5, 1.5, 0.45], ogre: [1.7, 0.4, 0.3] }, st = [];
    for (const c of CAMPS) { const R = (CAMPS.indexOf(c) < 4 ? 9.5 : 7.6) + 1.1; for (let i = 0; i < 11; i++) { const a = i / 11 * TAU + c.x * 0.13, x = c.x + Math.cos(a) * R, z = c.z + Math.sin(a) * R; if (walkDist(x, z) < -0.25) st.push([x, z, a, hash2(x, z), KC[c.kind] || KC.beasts]); } }
    const sgeo = mergeParts([{ g: new THREE.CylinderGeometry(0.34, 0.52, 2.3, 5), m: TRS(0, 1.15, 0), c: 0x44464e }, { g: new THREE.ConeGeometry(0.36, 0.5, 5), m: TRS(0, 2.52, 0), c: 0x3a3c44 }, { g: new THREE.BoxGeometry(0.9, 0.22, 0.9), m: TRS(0, 0.1, 0, 0, 0.6), c: 0x33353c }]);
    const sm2 = new THREE.InstancedMesh(sgeo, matI, st.length), rg = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 0.62, 0.06), new THREE.MeshBasicMaterial({ color: 0xffffff }), st.length); sm2.castShadow = true;
    st.forEach((s, i) => {
      const y = terrainH(s[0], s[1]) - 0.15, k = 0.8 + s[3] * 0.4, hs = 0.8 + s[3] * 0.6; dummy.position.set(s[0], y, s[1]); dummy.rotation.set((s[3] - 0.5) * 0.2, -s[2], (hash2(s[1], s[0]) - 0.5) * 0.2); dummy.scale.set(1, hs, 1); dummy.updateMatrix(); sm2.setMatrixAt(i, dummy.matrix); col.setRGB(k, k, k * 1.05); sm2.setColorAt(i, col);
      dummy.position.set(s[0] - Math.cos(s[2]) * 0.42, y + 1.4 * hs, s[1] - Math.sin(s[2]) * 0.42); dummy.rotation.set(0, -s[2] + Math.PI / 2, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); rg.setMatrixAt(i, dummy.matrix); col.setRGB(s[4][0], s[4][1], s[4][2]); rg.setColorAt(i, col);
    });
    sm2.frustumCulled = rg.frustumCulled = false; scene.add(sm2, rg);
    const rr = new THREE.Mesh(FX.geo.flat, FX.mat('rune2', 0x3fd6c8, 0.34, true, true)); rr.position.set(RUNE_POS.x, 0.07, RUNE_POS.z); rr.scale.set(13, 1, 13); rr.renderOrder = 2; scene.add(rr); WORLD.runeRing = rr;
  }
}
// detail level from the graphics settings: undergrowth and lantern pools are hidden, the ground shader falls back to plain colour
function setWorldDetail(on) { WORLD.uDet.value = on ? 1 : 0; for (const m of WORLD.extra) m.visible = !!on; }
const _hemA = new THREE.Color(0x93a8c8), _hemB = new THREE.Color(0xb7a294), _sunA = new THREE.Color(0xffe9cf), _sunB = new THREE.Color(0xffcfa0);
function updateWorld(dt) {
  WORLD.t += dt; const t = WORLD.t;
  if (WORLD.water) WORLD.water.material.uniforms.t.value = t;
  if (WORLD.crystals) { const k = 0.55 + Math.sin(t * 1.3) * 0.12; WORLD.crystals[0].material.color.setRGB(0.16 * k * 2, 0.5 * k * 2, 0.47 * k * 2); WORLD.crystals[1].material.color.setRGB(1.25 * k * 1.6, 0.36 * k * 1.6, 0.14 * k * 1.6); }
  if (WORLD.pit) { const k = 0.8 + Math.sin(t * 1.9) * 0.2; WORLD.pit.material.color.setRGB(0.54 * k, 0.36 * k, 1.0 * k); }
  if (WORLD.lamps) { const k = 1.35 + Math.sin(t * 7.3) * 0.08 + Math.sin(t * 13.1) * 0.05; WORLD.lamps.material.color.setRGB(1.25 * k, 0.86 * k, 0.36 * k); if (WORLD.pools) WORLD.pools.material.opacity = 0.3 + (k - 1.35) * 0.5; }
  if (WORLD.dots) { const k = 0.8 + Math.sin(t * 2.1) * 0.2; WORLD.dots.material.color.setRGB(k, k, k); }
  if (WORLD.runeRing) { WORLD.runeRing.rotation.y += dt * 0.25; WORLD.runeRing.material.opacity = 0.28 + Math.sin(t * 1.7) * 0.08; }
  // the light itself shifts with the side of the map the camera is over: cool over the living forest, warm and dusty over the burnt one
  if (typeof hemi !== 'undefined' && hemi) { const k = sideK(G.camX, G.camZ); hemi.color.copy(_hemA).lerp(_hemB, k); sun.color.copy(_sunA).lerp(_sunB, k); }
}
// drifting motes around the camera: fireflies and pollen over the living side, ash and rising embers over the burnt one
let _amb = null;
function ambientFx(dt) {
  if (Math.random() > dt * 30 * (GFX.dens || 1)) return;
  const A = _amb || (_amb = [0x8a8f9a, 0xe0a060, 0xb8f07a, 0xfff0a8, 0xff7a2a, 0x6a6460].map(c => hexRGB(c)));
  const x = G.camX + rand(-34, 34), z = G.camZ + rand(-26, 22), k = sideK(x, z), r = Math.random();
  if (r > k) {   // living side
    if (Math.random() < 0.45) FX.ps.emit(x, rand(0.4, 2.6), z, rand(-0.5, 0.5), rand(-0.1, 0.3), rand(-0.5, 0.5), rand(2.5, 5), 0.2, 0.04, A[2], A[3], 0, 0, 0.85);
    else FX.ps.emit(x, rand(0.5, 9), z, rand(-0.6, 0.6), rand(0.1, 0.5), rand(-0.4, 0.4), rand(3, 6), 0.11, 0.05, A[0], A[0], 0, 0, 0.4);
  } else {       // burnt side
    if (Math.random() < 0.5) FX.ps.emit(x, rand(0.1, 1.5), z, rand(-0.4, 0.4), rand(0.6, 1.7), rand(-0.4, 0.4), rand(2, 4.5), 0.15, 0.03, A[4], A[1], 0, 0, 0.9);
    else FX.ps.emit(x, rand(1, 9), z, rand(-0.8, 0.8), rand(-0.5, -0.1), rand(-0.5, 0.5), rand(3, 6), 0.13, 0.06, A[5], A[0], 0, 0, 0.5);
  }
}
