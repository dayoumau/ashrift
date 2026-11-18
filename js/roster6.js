'use strict';
/* ===== roster, parts 27–29 (heroes 54–56): Megumin the explosion archwizard, Levi the strongest soldier, Zenitsu the sleeping thunder.
   Also Kaisei's new pieces (his hero entry is in roster2.js): the innate Infinity and the domain expansion.
   Loaded after roster5.js (and so after icons.js): the glyphs are added to GLYPH at the end ===== */
const MEG = { c: 0xff3a2a, fire: 0xff7a1a, deep: 0x5a0a08, pale: 0xffd8a0, gold: 0xffc04a };
const LEV = { c: 0xcfe8ff, steel: 0xdfe6ee, green: 0x3f7a4c, blood: 0xa8101a };
const ZEN = { c: 0xffd83a, hot: 0xfff2a0, fire: 0xff8a1a, deep: 0x8a4a00 };
const _v6 = new THREE.Vector3(), _up6 = new THREE.Vector3(0, 1, 0), _d6 = new THREE.Vector3();

/* ================= Kaisei: Infinity ================= */
// always 12% less damage; every 8 seconds the infinity thickens and the next blow loses 70% of its force
function kaiInf(h) {
  let b = null; for (const o of h.buffs) if (o.id === 'kinf') { b = o; break; }
  if (!b) { b = addBuff(h, { id: 'kinf', dur: 1e9, dmgIn: 0.88 }); if (!b) return; }
  const full = !(h.infCd > G.time); b.dmgIn = full ? 0.264 : 0.88;
  if (full && !b.fx && FX.near(h.x, h.z, 60)) b.fx = kaiInfFx(h);
  else if (!full && b.fx) { b.fx.dead = true; b.fx = null; }
}
// the thickened infinity: a thin ring turning slowly round his feet
function kaiInfFx(h) {
  const m = new THREE.Mesh(FX.geo.flat, FX.mat('ringThin', 0x9fd4ff, 0)), m2 = new THREE.Mesh(FX.geo.flat, FX.mat('rune2', 0x3fa9ff, 0)); m2.userData.own = true; m.add(m2);
  return FX.add(m, 1e9, (k, me, dt, en) => {
    if (!h.alive || h.dead) { en.dead = true; return; } me.position.set(h.x, 0.15, h.z); const s = 2.3 * 2 * RK; me.scale.set(s, 1, s); me.rotation.y += dt * 0.8; m2.rotation.y -= dt * 1.9;
    const o = Math.min(1, en.t / 0.4); me.material.opacity = o * (0.35 + 0.1 * Math.sin(en.t * 3)); m2.material.opacity = o * 0.14;
  });
}
function kaiInfHit(h, src, d) {
  if (h.infCd > G.time || !(d > 0)) return;
  h.infCd = G.time + 8; h.dmgIn /= 0.3;   // the rest of this frame's blows meet the thin infinity again
  for (const o of h.buffs) if (o.id === 'kinf') { o.dmgIn = 0.88; if (o.fx) { o.fx.dead = true; o.fx = null; } }
  if (src && src.kind === 'hero' && hostile(h, src) && udist(h, src) < 6) slow(h, src, 0.3, 1, 'kinfslow');
  SFX.at('shield', h.x, h.z, 0.6);
  if (!FX.near(h.x, h.z, 50)) return;
  FX.sphere(h.x, 1.3, h.z, { r0: 1.5, r1: 2.4, color: 0x3fa9ff, life: 0.32, op: 0.6 }); FX.ring(h.x, h.z, { r0: 1.4, r1: 3.2, color: 0xffffff, life: 0.3, tex: 'ringThin', y: 1.2 });
  FX.warp('ring', h.x, 1.2, h.z, { r0: 0.5, r1: 3, str: 0.8, life: 0.3 });
  if (src) { const a = angTo(h.x, h.z, src.x, src.z); FX.glow(h.x + Math.sin(a) * 1.8, 1.5, h.z + Math.cos(a) * 1.8, 2.6, 0x9fd4ff, 0.25, 'star'); }
  if (h === G.player) FX.text(h.x, h.height + 0.8, h.z, 'бесконечность', '#9fd4ff', 13);
}

/* ================= Kaisei: the domain ================= */
// the void's own surfaces: a dark starry dome with a bright rim and a band of light at the horizon, and a floor of open space with a turning galaxy
const KAI_VS_SHELL = 'varying vec3 vN; varying vec3 vV; varying vec3 vP; void main(){ vP=position; vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }';
const KAI_FS_SHELL = 'uniform float uT, uA; uniform sampler2D uNz; varying vec3 vN; varying vec3 vV; varying vec3 vP;' +
  'float hh(vec3 p){ return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453); }' +
  'void main(){ float f=1.-abs(dot(normalize(vN),normalize(vV))); vec3 d=normalize(vP); vec2 uv=vec2(atan(d.z,d.x)*.159,d.y);' +
  ' float n=texture2D(uNz,uv*vec2(2.,1.2)+vec2(uT*.015,0.)).r, n2=texture2D(uNz,uv*vec2(5.,3.)-vec2(uT*.025,uT*.01)).r;' +
  ' vec3 g=floor(d*70.); float s=step(.972,hh(g))*(.45+.55*sin(uT*2.5+hh(g+3.)*30.));' +
  ' vec3 c=vec3(.01,.012,.035)+vec3(.1,.16,.42)*pow(n*n2*1.8,2.)+vec3(.45,.15,.7)*pow(n2,5.)*.8+vec3(.85,.92,1.)*s;' +
  ' float rim=pow(f,3.); float band=smoothstep(.1,0.,abs(d.y-.03)); c+=vec3(.5,.75,1.)*rim*1.2+vec3(.6,.85,1.)*band*.8;' +
  ' gl_FragColor=vec4(c,uA*(.3+.55*rim+band*.35)); }';
const KAI_VS_FLOOR = 'varying vec2 vU; void main(){ vU=uv*2.-1.; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }';
const KAI_FS_FLOOR = 'uniform float uT, uA; uniform sampler2D uNz; varying vec2 vU;' +
  'float hh(vec3 p){ return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453); }' +
  'void main(){ float r=length(vU); if(r>1.) discard; float a=atan(vU.y,vU.x);' +
  ' float arm=pow(.5+.5*cos((a+r*5.-uT*.35)*2.),6.)*smoothstep(1.,.12,r);' +
  ' float n=texture2D(uNz,vU*.6+vec2(uT*.01,-uT*.02)).r; vec2 g=floor(vU*80.); float s=step(.982,hh(vec3(g,1.)))*(.5+.5*sin(uT*3.+hh(vec3(g,2.))*40.));' +
  ' float edge=smoothstep(.035,0.,abs(r-.965));' +
  ' vec3 c=vec3(.006,.008,.02)+vec3(.12,.2,.5)*arm*(.5+n)+vec3(.55,.25,.85)*arm*arm*.5+vec3(.9,.95,1.)*s+vec3(.85,.93,1.)*pow(max(0.,1.-r*8.),2.)*1.4+vec3(.5,.8,1.)*edge*1.5;' +
  ' gl_FragColor=vec4(c,uA*(mix(.93,0.,smoothstep(.9,1.,r))+edge*.8)); }';
let _kaiHemi = null;
function kaiDomainMat(vs, fs) { return new THREE.ShaderMaterial({ uniforms: { uT: FXU.uT, uNz: FXU.uNz, uA: { value: 0 } }, vertexShader: vs, fragmentShader: fs, transparent: true, depthWrite: false }); }
// Unlimited Void: everyone hostile inside stands frozen while it lasts; when it closes, they all take the blow
function kaiDomain(h) {
  const lv = Math.max(1, h.al[3]), R = 9, T0 = 0.4, dur = 2 + 0.5 * lv, end = T0 + dur, dmg = D(h, 150, 35, 0, 0.7), x = h.x, z = h.z;
  h.domainT = G.time + end; h.order = null; h.path = null;
  const caught = new Map(), near = FX.near(x, z, 70); let el = 0, formed = false, acc = 0, ring = 0, fe = null, se = null;
  SFX.at('ultcue', x, z, 0.6); SFX.at('void', x, z, 0.7); G.dim = Math.max(G.dim || 0, FX.near(x, z, 40) ? 0.9 : 0);
  const mk = mmMark({ x, z, r: R, color: '#7ad0ff', until: G.time + end });
  globalWarn(h, null, null);
  if (near) {
    FX.text(x, h.height + 1.6, z, 'Расширение территории', '#bfe6ff', 18);
    FX.implode(x, 1.8, z, 6, { n: 30, color: 0xffffff, color2: 0x3fa9ff, life: 0.4, streak: true }); FX.light(x, 3, z, 0x5a8aff, 1.6, 20, 0.5);
    // the seed of the void: a black point before his fingers, swelling
    const seed = new THREE.Mesh(FX.geo.sphere, new THREE.MeshBasicMaterial({ color: 0x020206 })), rimS = new THREE.Mesh(FX.geo.sphere, FX.rimMat(0x7ad0ff, 1.6)); rimS.userData.own = true; seed.add(rimS); rimS.scale.setScalar(1.15);
    FX.add(seed, T0 + 0.05, (k, me) => { me.position.set(h.x + Math.sin(h.facing) * 0.55, 2.5, h.z + Math.cos(h.facing) * 0.55); me.scale.setScalar(0.05 + 0.5 * k * k); });
    // the dome and the floor of space; both are driven by the timeline of the actor below (formed / closing)
    if (!_kaiHemi) _kaiHemi = new THREE.SphereGeometry(1, 40, 20, 0, TAU, 0, Math.PI / 2);
    const shell = new THREE.Mesh(_kaiHemi, kaiDomainMat(KAI_VS_SHELL, KAI_FS_SHELL)), floor = new THREE.Mesh(FX.geo.flat, kaiDomainMat(KAI_VS_FLOOR, KAI_FS_FLOOR));
    shell.position.set(x, 0, z); floor.position.set(x, 0.07, z); shell.renderOrder = 12; floor.renderOrder = 3;
    fe = FX.add(floor, end + 0.6, (k, me, dt, en) => { const t = en.t, g = t < T0 ? 0 : easeOut(Math.min(1, (t - T0) / 0.35)), o = t > end ? Math.max(0, 1 - (t - end) / 0.5) : 1, s = 2 * R * Math.max(0.01, g); me.scale.set(s, 1, s); me.material.uniforms.uA.value = g * o; });
    se = FX.add(shell, end + 0.32, (k, me, dt, en) => { const t = en.t, g = t < T0 ? 0 : easeOut(Math.min(1, (t - T0) / 0.3)), c = t > end ? Math.min(1, (t - end) / 0.3) : 0, s = R * Math.max(0.01, g) * (1 - c * c * 0.97); me.scale.set(s, s * 0.8, s); me.rotation.y += dt * 0.05; me.material.uniforms.uA.value = g * (1 - c * 0.6); });
  }
  const freeze = (e, left) => {
    const b = addBuff(e, { id: 'kvoid', dur: left + 0.05, stun: true, src: h }); if (!b) return; if (e.kind === 'hero') e.tstopT = G.time + left; caught.set(e, b);
    if (FX.near(e.x, e.z, 55)) { FX.ring(e.x, e.z, { r0: 2.4, r1: 0.4, color: 0x9fd4ff, life: 0.3, tex: 'ringThin' }); FX.implode(e.x, e.height * 0.9, e.z, 2.4, { n: 10, color: 0xffffff, color2: 0x3fa9ff, life: 0.3, streak: true }); }
    if (e === G.player) UI.announce('Вы в Необъятной бездне', '#9fd4ff');
  };
  const release = () => { for (const [e, b] of caught) { b.dead = true; e.tstopT = 0; } };
  G.actors.push({
    update(dt) {
      el += dt; acc += dt;
      if (!h.alive) {   // he fell: the void tears apart and lets everyone go, with no blow
        release(); h.domainT = 0; mk.until = 0; if (fe) fe.dead = true; if (se) se.dead = true;
        if (formed && FX.near(x, z, 60)) { FX.ring(x, z, { r0: R, r1: R * 1.2, color: 0x9fd4ff, life: 0.4, tex: 'ringThin' }); FX.debris(x, 3, z, { glow: true, n: 20, color: 0x7ad0ff, speed: [3, 9], up: 4, size: [0.2, 0.5], rad: R * 0.7 }); SFX.at('shatter', x, z, 0.8); }
        return false;
      }
      if (el < T0) return true;
      if (!formed) {
        formed = true; SFX.at('warp', x, z, 1); SFX.at('void', x, z, 1); SFX.at('bigboom', x, z, 0.4); FX.shake(0.5);
        if (near) {
          FX.ring(x, z, { r0: 0.5, r1: R, color: 0x7ad0ff, life: 0.45, tex: 'shock' }); FX.ring(x, z, { r0: 0.5, r1: R + 1, color: 0xffffff, life: 0.35, tex: 'ringThin' });
          FX.warp('ring', x, 0.5, z, { r0: 1, r1: R * 1.3, str: 1.5, life: 0.5 }); FX.shock(x, z, R * 1.2, 1, 0.4); FX.light(x, 6, z, 0x4a7aff, 2.2, R * 3, dur);
          FX.text(x, 7.5, z, 'НЕОБЪЯТНАЯ БЕЗДНА', '#d8f0ff', 26);
        }
      }
      if (el < end) {
        const left = end - el;
        for (const e of G.units) { if (!e.alive || e.struct || e.boss || caught.has(e) || !hostile(h, e)) continue; if (dist(e.x, e.z, x, z) > R + e.radius * 0.3) continue; freeze(e, left); }
        if (acc >= 0.08 && near) {
          acc = 0; let n = 0;
          // endless information pouring into every caught head
          for (const [e] of caught) { if (!e.alive || n > 7) continue; n++; FX.implode(e.x, (e.height || 2) * 0.92, e.z, 3, { n: e.kind === 'hero' ? 3 : 1, color: 0xffffff, color2: 0x7ad0ff, life: 0.35, streak: true }); }
          for (let i = 0; i < 2; i++) { const a = rand(TAU), r = Math.sqrt(Math.random()) * R * 0.95; FX.burst(x + Math.sin(a) * r, rand(0.4, 5.5), z + Math.cos(a) * r, { n: 1, color: 0xe8f4ff, color2: 0x3a6aff, speed: [0, 0.3], life: [0.7, 1.3], size: [0.22, 0.02], up: 0.4 }); }
          if (++ring % 8 === 0) FX.ring(x, z, { r0: R * 0.94, r1: R * 1.02, color: 0x9fd4ff, life: 0.6, tex: 'ringThin', y: 0.2 });
        }
        return true;
      }
      // the void closes: everyone it held takes the blow at once
      release(); mk.until = 0;
      SFX.at('bigboom', x, z, 0.9); SFX.at('void', x, z, 1); SFX.at('shatter', x, z, 0.4); FX.shake(0.9);
      if (FX.near(x, z, 60)) {
        if (FX.near(x, z, 36)) { FX.hitstop(0.08); FX.punch(1.2); }
        FX.implode(x, 2, z, R, { n: 40, color: 0xffffff, color2: 0x3fa9ff, life: 0.25, streak: true });
        after(0.2, () => { FX.glow(x, 3, z, 12, 0x3f8aff, 0.35); FX.ring(x, z, { r0: 0.5, r1: R + 3, color: 0x5a9aff, life: 0.55, tex: 'shock' }); for (let i = 0; i < 3; i++) after(i * 0.07, () => FX.ring(x, z, { r0: 1, r1: R + i * 2, color: i === 1 ? 0xffffff : 0x9fd4ff, life: 0.5, tex: 'ringThin' })); FX.warp('ring', x, 0.5, z, { r0: 1, r1: R * 1.6, str: 1.6, life: 0.55 }); FX.light(x, 5, z, 0x7ad0ff, 3, 40, 0.6); });
      }
      after(0.22, () => {
        for (const [e] of caught) {
          if (!e.alive) continue; damage(h, e, dmg, 1);
          if (FX.near(e.x, e.z, 55)) { FX.pillar(e.x, e.z, { r: e.kind === 'hero' ? 1 : 0.6, h: e.kind === 'hero' ? 15 : 9, color: 0x4a8aff, life: 0.55, op: 0.55 }); FX.hit(e.x, 1.3, e.z, 0x7ad0ff, e.kind === 'hero'); FX.sparks(e.x, 1.2, e.z, { n: 8, color: 0xffffff, color2: 0x7ad0ff, speed: [2, 6], life: [0.4, 0.8], up: 8, grav: -2, w: 0.09 }); }
        }
      });
      return false;
    }
  });
}

/* ================= Megumin ================= */
function megCharge(h, n) {
  h.meg = Math.min(5, (h.meg || 0) + n); h.megT = G.time + 15;
  if (h === G.player) FX.text(h.x, h.height + 0.9, h.z, 'алый взор ' + h.meg, '#ff6a5a', 13);
}
// a horizontal magic circle hanging at height y: it opens, turns (the inner ring the other way), and closes at the end of its life
function megSigil(x, y, z, r, col, life, spin, op) {
  if (!FX.near(x, z, 75)) return null;
  const g = new THREE.Group(), a = new THREE.Mesh(FX.geo.flat, FX.mat('rune2', col, 0)), b = new THREE.Mesh(FX.geo.flat, FX.mat('rune', MEG.gold, 0)), c = new THREE.Mesh(FX.geo.flat, FX.mat('ringThin', col, 0));
  for (const m of [a, b, c]) { m.userData.own = true; g.add(m); } g.position.set(x, y, z); op = op === undefined ? 0.85 : op;
  return FX.add(g, life, (k, me, dt, en) => {
    const t = en.t, open = easeOut(Math.min(1, t / 0.22)), cl = Math.max(0, Math.min(1, (life - t) / 0.18)), s = r * 2 * RK * open;
    a.scale.set(s, 1, s); b.scale.set(s * 0.62, 1, s * 0.62); c.scale.set(s * 1.12, 1, s * 1.12); a.rotation.y = t * spin; b.rotation.y = -t * spin * 1.7;
    a.material.opacity = op * cl; b.material.opacity = op * 0.7 * cl; c.material.opacity = op * 0.8 * cl;
  });
}
// Chomusuke: a small black cat with bat wings and a red mark on the brow (template built once, every flight gets a clone)
let _megCat = null;
function megCat() {
  if (!_megCat) {
    const g = new THREE.Group(), lit = new THREE.MeshPhongMaterial({ vertexColors: true, flatShading: true, shininess: 10 }), gl = new THREE.MeshBasicMaterial({ vertexColors: true }), bk = 0x1a1620, k = kit();
    k.b(0.3, 0.26, 0.5, bk, 0, 0, 0).b(0.3, 0.27, 0.27, bk, 0, 0.12, 0.33).c(0.07, 0.16, 4, bk, -0.09, 0.32, 0.33).c(0.07, 0.16, 4, bk, 0.09, 0.32, 0.33)
      .b(0.06, 0.05, 0.02, { g: 0xff3040 }, -0.07, 0.15, 0.47).b(0.06, 0.05, 0.02, { g: 0xff3040 }, 0.07, 0.15, 0.47).b(0.08, 0.025, 0.02, { g: 0xff6a40 }, 0, 0.23, 0.47).b(0.025, 0.07, 0.02, { g: 0xff6a40 }, 0, 0.23, 0.47)
      .b(0.05, 0.05, 0.42, bk, 0, 0.1, -0.42, -0.6).b(0.08, 0.14, 0.08, bk, -0.1, -0.17, 0.15).b(0.08, 0.14, 0.08, bk, 0.1, -0.17, 0.15).b(0.08, 0.14, 0.08, bk, -0.1, -0.17, -0.15).b(0.08, 0.14, 0.08, bk, 0.1, -0.17, -0.15);
    k.into(g, lit, gl);
    for (const s of [-1, 1]) { const w = new THREE.Group(), kw = kit(); kw.b(0.5, 0.02, 0.06, 0x2a1420, s * 0.25, 0.02, 0.12).t(0.06, 0.3, 0.02, 0.05, 0.48, 0x3a1a28, s * 0.25, 0, -0.02, 0, 0, s * HPI); kw.into(w, lit, gl); w.position.set(s * 0.12, 0.1, 0.04); w.name = s < 0 ? 'wL' : 'wR'; g.add(w); }
    _megCat = g;
  }
  const c = _megCat.clone(true); c.scale.setScalar(1.7); return c;
}
// EXPLOSION: a column of white fire out of the sky, a fireball swelling to the edge of the blast, rings, a mushroom cloud, a burning crater
function megBoom(h, x, z, R, dmg) {
  for (const e of enemiesIn(h, x, z, R)) { const mk = e.buffs.some(b => b.id === 'megmark' + h.id); damage(h, e, dmg * (mk ? 1.2 : 1), 1); if (e.alive) knock(e, x, z, 3.5, 0.3); FX.hit(e.x, 1.3, e.z, MEG.fire, true); }
  SFX.at('bigboom', x, z, 1.2); SFX.at('boom', x, z, 1); SFX.at('fire', x, z, 1); after(0.12, () => SFX.at('bigboom', x, z, 0.8)); after(0.25, () => SFX.at('rubble', x, z, 1)); after(0.45, () => SFX.at('quake', x, z, 0.8));
  FX.shake(1.2); if (!FX.near(x, z, 80)) return;
  if (FX.near(x, z, 40)) { FX.hitstop(0.12); FX.punch(1.5); }
  FX.light(x, 6, z, 0xff6a1a, 4, 70, 1.4); FX.glow(x, 3, z, 15, 0xff6a1a, 0.5); FX.glow(x, 3, z, 11, 0xffffff, 0.1, 'flare');
  const core = new THREE.Mesh(FX.geo.sphere, FX.mat(null, 0xff8a2a, 0.5));
  FX.add(core, 1.0, (k, me) => { const s = R * (0.2 + 0.45 * easeOut(Math.min(1, k * 3))); me.position.set(x, s * 0.5 + k * 4, z); me.scale.set(s, s * 1.1, s); me.material.opacity = 0.4 * (1 - k) * (1 - k); me.material.color.setHex(k < 0.2 ? 0xffb050 : 0xff5a10); });
  FX.sphere(x, 0.5, z, { r0: 1, r1: R, color: 0xff5a10, life: 0.6, op: 0.32 });
  FX.burst(x, 0.8, z, { smoke: true, n: 26, color: 0x2a1e18, color2: 0x0a0806, speed: [R * 0.9, R * 1.5], life: [0.9, 1.6], size: [2, 4.2], ring: true, drag: 1.6, up: 0.6, a: 0.65 });
  FX.glow(x, 2, z, 9, 0xffe0b0, 0.14, 'flare');
  for (let i = 0; i < 12; i++) after(0.04 + i * 0.06, () => { const a = rand(TAU), r = rand(R * 0.15, R * 0.85), px = x + Math.sin(a) * r, pz = z + Math.cos(a) * r; FX.pillar(px, pz, { r: rand(0.5, 0.9), h: rand(7, 14), color: i % 3 ? 0xff6a1a : 0xffb060, life: 0.5, op: 0.55 }); FX.flame(px, 0.8, pz, { n: 4, color: 0xffa040, color2: 0x5a0a00, size: [1.4, 2.8], life: [0.5, 1], up: 5, a: 0.45 }); FX.debris(px, 0.3, pz, { n: 3, color: 0x3a3028, speed: [2, 6], up: 10, size: [0.2, 0.5] }); });
  FX.pillar(x, z, { r: R * 0.42, h: 26, color: 0xff4a0a, life: 1.2, op: 0.4 }); FX.pillar(x, z, { r: 1.4, h: 36, color: 0xffb060, life: 0.55, op: 0.5 });
  for (let i = 0; i < 4; i++) after(i * 0.09, () => FX.ring(x, z, { r0: 1 + i, r1: R * (1.05 + i * 0.25), color: i % 2 ? 0xffc890 : 0xff5a1a, life: 0.6 + i * 0.1, tex: i ? 'ringThin' : 'shock' }));
  FX.warp('ring', x, 0.4, z, { r0: 1, r1: R * 2.2, str: 1.8, life: 0.7 }); FX.shock(x, z, R * 1.8, 1.5, 0.6); after(0.2, () => FX.shock(x, z, R * 2.6, 0.9, 0.7));
  FX.explosion(x, z, 2.5, 0xff6a1a, { el: 'fire', color2: MEG.deep });
  FX.flame(x, 0.8, z, { n: 34, color: 0xffb060, color2: 0x7a1400, speed: [2, 9], life: [0.5, 1.3], size: [2.2, 5], rad: R * 0.7, up: 3, a: 0.42 });
  FX.sparks(x, 1, z, { n: 80, color: 0xffffff, color2: 0xff7a1a, speed: [10, 32], life: [0.3, 0.9], ring: true, up: 6, w: 0.17, stretch: 0.1 });
  FX.sparks(x, 1.5, z, { n: 50, color: 0xffd090, color2: 0xff3a00, speed: [2, 8], life: [1.2, 2.4], up: 14, grav: -6, drag: 0.6, w: 0.1, rad: R * 0.6 });
  FX.debris(x, 0.4, z, { n: 28, color: 0x3a3028, speed: [5, 15], up: 15, size: [0.25, 0.8], rad: R * 0.5 }); FX.debris(x, 0.6, z, { glow: true, n: 16, color: 0xff8a2a, speed: [6, 14], up: 12, size: [0.2, 0.5], rad: R * 0.4 });
  FX.scorch(x, z, R * 0.95, 0xff5a10, 14); FX.ring(x, z, { r0: R * 0.85, r1: R * 0.95, color: 0xff6a1a, life: 3, tex: 'crack', op: 0.9 });
  // the mushroom: a stem of fire and smoke climbing, the cap rolling out at the top
  for (let i = 0; i < 12; i++) after(0.05 + i * 0.07, () => { const y = 1 + i * 1.1; FX.flame(x, y, z, { n: 3, color: i < 6 ? 0xff9a3a : 0xff5a1a, color2: 0x3a0a04, size: [2.4, 4], life: [0.6, 1.1], up: 6, rad: 1.2, a: 0.4 }); FX.burst(x, y, z, { smoke: true, n: 2, color: 0x3a2a24, color2: 0x0c0806, speed: [0.3, 1], life: [1.5, 2.6], size: [2.5, 5], up: 4, rad: 1.4, a: 0.5 }); });
  after(0.55, () => { FX.flame(x, 13, z, { n: 18, color: 0xff7a2a, color2: 0x2a0804, speed: [3, 6], life: [0.8, 1.5], size: [3, 6], up: 1, ring: true, a: 0.4 }); FX.burst(x, 13.5, z, { smoke: true, n: 16, color: 0x4a3028, color2: 0x0c0806, speed: [2.5, 5], life: [2, 3.2], size: [4, 8], up: 1.5, ring: true, drag: 0.8, a: 0.55 }); });
  after(0.9, () => FX.burst(x, 15, z, { smoke: true, n: 10, color: 0x3a2a24, color2: 0x0a0806, speed: [1.5, 3.5], life: [2, 3.5], size: [5, 9], up: 1, ring: true, drag: 0.7, a: 0.5 }));
  FX.smoke(x, z, R * 0.8, 16, 0x2a2220);
  zone(h, { x, z, r: R, dur: 1.8, every: 0.1, tick: () => { if (!FX.near(x, z, 55)) return; const a = rand(TAU), r = rand(R * 0.85); FX.flame(x + Math.sin(a) * r, 0.4, z + Math.cos(a) * r, { n: 2, color: 0xff8a2a, color2: 0x5a0a00, size: [0.8, 1.8], life: [0.4, 0.8], up: 2.5, a: 0.4 }); } });
}

/* ================= Levi ================= */
// one cable of the manoeuvre gear, from a point that moves with its owner (fromFn) to a fixed anchor; it shoots out in the first instant
function levCable(fromFn, ax, ay, az, life) {
  const m = new THREE.Mesh(FX.geo.cyl, FX.mat(null, 0xc8ced6, 0.95, false));
  return FX.add(m, life, (k, me, dt, en) => {
    const f = fromFn(); if (!f) { en.dead = true; return; } _d6.set(ax - f.x, ay - f.y, az - f.z); const L = _d6.length() || 0.01, g = Math.min(1, en.t / 0.07);
    me.position.set(f.x, f.y, f.z); me.quaternion.setFromUnitVectors(_up6, _d6.multiplyScalar(1 / L)); me.scale.set(0.035, L * g, 0.035); me.material.opacity = 0.95 * Math.min(1, (en.life - en.t) / 0.08);
  });
}
const levHip = (h, s) => () => h.alive ? { x: h.x + Math.cos(h.facing) * 0.5 * s, y: 1.0 + (h.yOff || 0), z: h.z - Math.sin(h.facing) * 0.5 * s } : null;
function levCables(h, ax, ay, az, life) {
  if (!FX.near(h.x, h.z, 60) && !FX.near(ax, az, 60)) return;
  for (const s of [-1, 1]) levCable(levHip(h, s), ax + Math.cos(h.facing) * 0.4 * s, ay, az - Math.sin(h.facing) * 0.4 * s, life);
  FX.sparks(ax, ay, az, { n: 8, color: 0xffffff, color2: 0xc8ced6, speed: [3, 8], life: [0.15, 0.35], w: 0.07 }); FX.glow(ax, ay, az, 1.4, 0xffffff, 0.15, 'star');
}
function levGas(h, n) { if (FX.near(h.x, h.z, 45)) FX.burst(h.x - Math.sin(h.facing) * 0.5, 1.0 + (h.yOff || 0), h.z - Math.cos(h.facing) * 0.5, { smoke: true, n, color: 0xeef2f6, color2: 0x8a9098, speed: [1, 3.5], life: [0.4, 0.8], size: [0.6, 1.5], a: 0.5, drag: 2 }); }
function levBlood(e, n) { if (FX.near(e.x, e.z, 45)) { FX.sparks(e.x, (e.height || 2) * 0.6, e.z, { n, color: 0xff4a50, color2: LEV.blood, speed: [3, 9], life: [0.25, 0.6], w: 0.11, grav: -14 }); FX.burst(e.x, (e.height || 2) * 0.6, e.z, { n: Math.ceil(n / 2), color: 0xc01a24, color2: 0x4a0408, speed: [1, 4], life: [0.3, 0.6], size: [0.3, 0.05], grav: -10 }); } }
// a cut across the target in the air: a thin white line with a crimson core, at any angle
function levCut(t, ang, tilt, len) {
  if (!FX.near(t.x, t.z, 55)) return; const y = (t.height || 2) * 0.6, c = Math.cos(ang), s = Math.sin(ang), dy = Math.sin(tilt) * len, dl = Math.cos(tilt) * len;
  r3Ray(t.x - s * dl, y - dy, t.z - c * dl, t.x + s * dl, y + dy, t.z + c * dl, { color: 0xffffff, w: 0.22, life: 0.22, grow: true, core: 0.5 });
  r3Ray(t.x - s * dl * 0.8, y - dy * 0.8, t.z - c * dl * 0.8, t.x + s * dl * 0.8, y + dy * 0.8, t.z + c * dl * 0.8, { color: 0xff3040, w: 0.5, life: 0.18, op: 0.6 });
}

/* ================= Zenitsu ================= */
// how far a straight dash can go before a wall stops it
function zenReach(x, z, dir, L) {
  const sx = Math.sin(dir), sz = Math.cos(dir); let d = 0, ex = x, ez = z;
  while (d < L) { const nd = Math.min(L, d + 0.4), nx = x + sx * nd, nz = z + sz * nd; if (!NAV.ok(nx, nz)) break; d = nd; ex = nx; ez = nz; }
  return { x: ex, z: ez, d };
}
// the flash: forked lightning from where he stood to where he is, a burnt yellow line on the ground, sparks all along
function zenBolt(x0, z0, x1, z1, big) {
  if (!FX.near(x0, z0, 70) && !FX.near(x1, z1, 70)) return;
  for (let i = 0; i < (big ? 3 : 2); i++) FX.bolt(x0, 1.0 + i * 0.25, z0, x1, 1.0 + i * 0.2, z1, { color: i ? ZEN.c : ZEN.hot, w: big ? 1.0 - i * 0.25 : 0.6 - i * 0.15, life: 0.3 + i * 0.05, jag: 0.6 });
  r3Ray(x0, 1.15, z0, x1, 1.15, z1, { color: ZEN.c, w: big ? 0.9 : 0.45, life: 0.25, core: 0.4 });
  const L = dist(x0, z0, x1, z1); if (L > 0.5) FX.lineDecal(x0, z0, angTo(x0, z0, x1, z1), L, big ? 1.2 : 0.7, ZEN.c, 0.6);
  const m = Math.max(1, Math.round(L / 1.6)); for (let i = 0; i <= m; i++) { const f = i / m; FX.sparks(lerp(x0, x1, f), 1, lerp(z0, z1, f), { n: 2, color: 0xffffff, color2: ZEN.c, speed: [2, 7], life: [0.15, 0.4], w: 0.08, grav: -3 }); }
  FX.glow(x0, 1.2, z0, 3, ZEN.c, 0.2, 'star'); FX.glow(x1, 1.2, z1, 3.5, ZEN.c, 0.25, 'star'); FX.light(x1, 2, z1, ZEN.c, 1.6, 18, 0.25);
}
function zenSleep(h, dur, auto) {
  h.sleepT = G.time + dur; h.sleeping = true; if (auto) h.sleepCd = G.time + 30; h.range = h.def.stats.range + 2.4;
  addBuff(h, { id: 'zsleep', dur, as: 0.3, ms: 0.2, onHit: zenSleepHit });
  SFX.at('zap', h.x, h.z, 0.8); if (!FX.near(h.x, h.z, 50)) return;
  FX.text(h.x, h.height + 1, h.z, 'Zzz…', '#fff0a0', 18); FX.arcs(h.x, 1.2, h.z, 1.8, 5, ZEN.c); FX.ring(h.x, h.z, { r0: 0.5, r1: 3, color: ZEN.c, life: 0.35, tex: 'shock' }); FX.glow(h.x, 1.4, h.z, 4, ZEN.c, 0.3, 'star');
}
function zenWake(h) { h.sleeping = false; h.range = h.def.stats.range; if (h === G.player) FX.text(h.x, h.height + 0.9, h.z, '…а? что случилось?', '#fff0a0', 14); }
// asleep, every attack is a flash: he is at the target at once, and the blade carries a little thunder
function zenSleepHit(u, t) {
  if (t.struct) return 0;
  if (udist(u, t) > 2.2) { const a = angTo(t.x, t.z, u.x, u.z), q = NAV.nearest(t.x + Math.sin(a) * 1.2, t.z + Math.cos(a) * 1.2), x0 = u.x, z0 = u.z; u.x = q.x; u.z = q.z; u.facing = angTo(u.x, u.z, t.x, t.z); zenBolt(x0, z0, u.x, u.z, false); }
  u.drawT = G.time + 0.25; damage(u, t, u.ad * 0.3, 1, { dot: true }); if (FX.near(t.x, t.z, 45)) FX.arcs(t.x, 1.2, t.z, 1.2, 2, ZEN.c); SFX.at('zap', t.x, t.z, 0.35);
  return 0;
}
// the god of flaming thunder: a dragon of fire and lightning racing along the line, its body following its head, coiling at the end and burning out
function zenDragon(x0, z0, dir, L) {
  const sx = Math.sin(dir), sz = Math.cos(dir); if (!FX.near(x0, z0, 80) && !FX.near(x0 + sx * L, z0 + sz * L, 80)) return;
  const px = sz, pz = -sx, N = 46, SP = 0.021, TR = 0.36, LIFE = 1.35, segs = [];
  const P = (s, ph) => { s = clamp(s, 0, 1.15); const w = Math.sin(s * Math.PI * 2.5 + ph) * 1.4 * Math.min(1, s * 4), y = 1.6 + Math.sin(s * Math.PI * 1.5 + ph * 0.5) * 1.5 + s * 0.8; return { x: x0 + sx * L * s + px * w, y, z: z0 + sz * L * s + pz * w }; };
  const g = new THREE.Group(), head = new THREE.Group();
  for (let i = 0; i < N; i++) { const m = new THREE.Mesh(FX.geo.sphere, FX.mat(null, i < 6 ? 0xffc040 : (i % 4 === 0 ? 0xffe070 : 0xff7a1a), 0.5)); m.userData.own = true; g.add(m); segs.push(m); }
  const hm = (geo, col, op, s1, s2, s3, x, y, z, rx, ry) => { const m = new THREE.Mesh(geo, FX.mat(null, col, op)); m.scale.set(s1, s2, s3); m.position.set(x, y, z); m.rotation.set(rx || 0, ry || 0, 0); m.userData.own = true; m.userData.op = op; head.add(m); return m; };
  hm(FX.geo.sphere, 0xffc040, 0.85, 0.75, 0.6, 0.9, 0, 0, 0); hm(FX.geo.sphere, 0xff9a2a, 0.8, 0.45, 0.3, 0.95, 0, 0.06, 0.85); hm(FX.geo.sphere, 0xff6a10, 0.7, 0.42, 0.16, 0.8, 0, -0.32, 0.72, 0.35);
  for (const s of [-1, 1]) { hm(FX.geo.shard, 0xffe080, 0.85, 0.45, 0.45, 0.65, s * 0.32, 0.45, -0.45, -0.5, Math.PI + s * 0.35); hm(FX.geo.sphere, 0xffffff, 1, 0.1, 0.08, 0.1, s * 0.3, 0.22, 0.55); hm(FX.geo.shard, 0xffd060, 0.6, 0.12, 0.12, 0.9, s * 0.25, -0.1, 1.2, 0.2, s * 0.6); }
  g.add(head); const el = { ph: 0 };
  FX.add(g, LIFE, (k, me, dt, en) => {
    const t = en.t, hs = Math.min(1.12, t / TR), fade = t > TR + 0.35 ? Math.max(0, 1 - (t - TR - 0.35) / (LIFE - TR - 0.35)) : 1; if (t > TR) el.ph += dt * 7;
    const hp = P(hs, el.ph), ap = P(hs + 0.03, el.ph); head.position.set(hp.x, hp.y, hp.z); head.lookAt(ap.x, ap.y, ap.z); head.scale.setScalar(1.5 + 0.1 * Math.sin(t * 30));
    for (const c of head.children) c.material.opacity = c.userData.op * fade;
    for (let i = 0; i < N; i++) { const s = hs - (i + 1) * SP, m = segs[i]; if (s < 0) { m.visible = false; continue; } m.visible = true; const q = P(s, el.ph), sc = (1 - i / N * 0.8) * 0.85 * (1 + 0.1 * Math.sin(t * 30 - i * 0.8)); m.position.set(q.x, q.y, q.z); m.scale.set(sc, sc, sc * 1.3); m.material.opacity = 0.5 * fade; if (i % 2 === 0) m.lookAt(hp.x, hp.y, hp.z); }
    if (fade > 0.3 && FX.near(hp.x, hp.z, 55)) { const i = Math.floor(Math.random() * N), m = segs[i]; if (m.visible) { FX.flame(m.position.x, m.position.y, m.position.z, { n: 1, color: 0xffb040, color2: 0x7a1a00, size: [0.8, 1.6], life: [0.2, 0.45], up: 1.5, a: 0.4 }); if (Math.random() < 0.25) FX.arcs(m.position.x, m.position.y, m.position.z, 1.2, 1, ZEN.c); } }
  });
  for (let i = 0; i <= 12; i++) after(i * TR / 12, () => { const q = P(i / 12, 0); FX.flame(q.x, q.y, q.z, { n: 3, color: 0xffb040, color2: 0x8a2a00, size: [1, 2.2], life: [0.3, 0.7], up: 1, a: 0.45 }); FX.sparks(q.x, q.y, q.z, { n: 4, color: 0xffffff, color2: ZEN.c, speed: [3, 9], life: [0.2, 0.5], w: 0.1 }); if (i % 2) FX.bolt(q.x, q.y, q.z, q.x + rand(-2, 2), 0.2, q.z + rand(-2, 2), { color: ZEN.c, w: 0.45, life: 0.16, jag: 0.5 }); });
  after(TR + 0.5, () => { const q = P(1.05, el.ph); FX.flame(q.x, q.y, q.z, { n: 10, color: 0xffb040, color2: 0x6a1a00, size: [1.4, 3], life: [0.4, 0.9], up: 2, a: 0.4, rad: 1.5 }); FX.arcs(q.x, q.y, q.z, 2.4, 4, ZEN.c); });
}

HEROES.push(
  /* ================= 54. Megumin ================= */
  {
    id: 'megumin', name: 'Мегумин', title: 'Архимаг алого клана', role: 'mage', roleName: 'Подрывник', build: 'mage', bars: [5, 1, 3, 2], diffc: 2, atkSfx: 'fire', projMesh: 'orb',
    lore: 'Сильнейшая волшебница алого клана — по крайней мере, в одном-единственном заклинании. Мелкие чары она презирает, а всю ману, весь день и всю душу вкладывает во Взрыв: с неба спускаются круги, земля встаёт грибом огня, а сама Мегумин после этого падает лицом в траву и лежит, пока её не унесут.',
    look: { bulk: 0.8, h: 0.88, scale: 0.92, c1: 0xa8202a, c2: 0x7a141c, c3: 0x15121a, cuff: 0x15121a, skin: 0xf6e2d6, hands: 0xf6e2d6, metal: 0xd8b04a, glow: 0xff3a2a, head: 'megumin', hair: 0x16121c, chest: 'crimson', legs: 'thigh', tie: 0x8a1820, sh: 'none', weapon: 'mstaff', wc: 'staff', cape: 0x15121a },
    stats: ST(540, 76, 520, 50, 44, 2.2, 21, 2.3, 0.68, 8.8, 9.0),
    innate: { name: 'Алый взор', icon: 'meginn', desc: 'Каждый вражеский герой, задетый «Искрой», и укус Хомусукэ по герою (два заряда) зажигают её алый глаз: до 5 зарядов на 15 сек. «Взрыв!» сжигает их все: +6% урона и +0.4 к радиусу за каждый.', count: h => h.meg || 0 },
    tick(h) { if (h.meg && G.time > h.megT) h.meg = 0; },
    abilities: [
      {
        key: 'Q', name: 'Искра', icon: 'megspark', cd: 6, cost: 45, range: 11, ind: { type: 'circle', r: 3 }, anim: 'flourish', animDur: 0.45, lock: 0.2, ai: { t: 'point', rad: 3, delay: 0.38 },
        desc: 'Мегумин чертит в точке (до 11) малый круг, и через 0.4 сек в нём вспыхивает взрыв-малыш: магический урон в радиусе 3. Каждый задетый вражеский герой даёт заряд «Алого взора». Мегумин считает это заклинание недостойным, но иногда приходится.',
        cast(h, p) {
          const x = p.x, z = p.z, R = 3, dmg = D(h, 78, 15, 0, 0.55); telegraph(h, x, z, R, 0.38, MEG.c); megSigil(x, 0.14, z, R, MEG.c, 0.5, 2.4, 0.8); SFX.at('cast', h.x, h.z, 0.6);
          if (FX.near(x, z, 55)) FX.implode(x, 1, z, R, { n: 10, color: MEG.pale, color2: MEG.c, life: 0.45, streak: true });
          after(0.38, () => {
            let n = 0; for (const e of enemiesIn(h, x, z, R)) { damage(h, e, dmg, 1); FX.hit(e.x, 1.2, e.z, MEG.fire, false); if (e.kind === 'hero') n++; }
            if (n) megCharge(h, n);
            SFX.at('boom', x, z, 0.8); SFX.at('fire', x, z, 0.5); FX.shake(0.25);
            if (FX.near(x, z, 55)) { FX.explosion(x, z, 2, MEG.fire, { el: 'fire', color2: MEG.deep }); FX.pillar(x, z, { r: 0.9, h: 8, color: 0xff5a10, life: 0.4, op: 0.5 }); FX.flame(x, 2.5, z, { n: 6, color: 0xff8a3a, color2: 0x2a0804, size: [1, 2], life: [0.4, 0.8], up: 4, a: 0.4 }); FX.burst(x, 4, z, { smoke: true, n: 5, color: 0x3a2a24, color2: 0x0c0806, speed: [0.6, 1.6], life: [0.8, 1.4], size: [1.2, 2.4], ring: true, up: 1, a: 0.45 }); }
          });
        }
      },
      {
        key: 'W', name: 'Посох алого клана', icon: 'megstaff', cd: 12, cost: 55, range: 0, ind: { type: 'self', r: 3.6 }, anim: 'staffslam', animDur: 0.5, lock: 0.2, ai: { t: 'nova', r: 3.2 },
        desc: 'Мегумин с размаху бьёт посохом оземь: под ней вспыхивает алый круг и отбрасывает всех врагов в радиусе 3.6 — магический урон и замедление на 35% на 1.5 сек. Сама она 2 сек бегает на 30% быстрее.',
        cast(h) {
          after(0.22, () => {
            if (!h.alive) return; const x = h.x, z = h.z, R = 3.6, dmg = D(h, 55, 10, 0, 0.35);
            for (const e of enemiesIn(h, x, z, R)) { damage(h, e, dmg, 1); if (e.alive) { knock(e, x, z, 3.5, 0.25); slow(h, e, 0.35, 1.5, 'megslow'); } FX.hit(e.x, 1.2, e.z, MEG.c, false); }
            addBuff(h, { id: 'megrun', dur: 2, ms: 0.3 });
            SFX.at('heavy', x, z, 0.6); SFX.at('fire', x, z, 0.6); FX.shake(0.3);
            if (FX.near(x, z, 55)) { megSigil(x, 0.13, z, R, MEG.c, 0.7, 4, 0.9); FX.ring(x, z, { r0: 0.5, r1: R + 0.5, color: MEG.fire, life: 0.4, tex: 'shock' }); FX.shock(x, z, R * 1.3, 0.9, 0.35); FX.flame(x, 0.5, z, { n: 14, color: 0xff7a2a, color2: MEG.deep, ring: true, speed: [4, 9], size: [0.8, 1.8], life: [0.3, 0.6], up: 0.8, a: 0.45 }); FX.sparks(x, 0.4, z, { n: 18, color: 0xffd0a0, color2: MEG.c, speed: [6, 14], life: [0.2, 0.45], ring: true, w: 0.11 }); FX.debris(x, 0.3, z, { n: 6, color: 0x3a3028, speed: [2, 6], up: 6, size: [0.12, 0.3] }); }
          });
        }
      },
      {
        key: 'E', name: 'Хомусукэ', icon: 'megcat', cd: 10, cost: 50, range: 10, ind: { type: 'target' }, anim: 'flourish', animDur: 0.4, lock: 0.15, ai: { t: 'target' },
        desc: 'Мегумин посылает свою чёрную кошку с крылышками летучей мыши (до 10). Хомусукэ кусает цель: магический урон, замедление на 40% на 1.5 сек и метка на 6 сек — по помеченному врагу «Взрыв!» бьёт на 20% сильнее. Укус по герою даёт два заряда «Алого взора». Потом кошка возвращается к хозяйке.',
        cast(h, p) {
          const t = p.unit; if (!t || !hostile(h, t)) return false;
          const dmg = D(h, 60, 12, 0, 0.45), cat = megCat(), wl = cat.getObjectByName('wL'), wr = cat.getObjectByName('wR'); let x = h.x + Math.sin(h.facing) * 0.8, z = h.z + Math.cos(h.facing) * 0.8, el = 0, back = false;
          const ce = FX.add(cat, 8); cat.position.set(x, 2.2, z); SFX.at('dark', h.x, h.z, 0.4); SFX.at('whoosh', h.x, h.z, 0.5);
          G.actors.push({
            update(dt) {
              el += dt; if (!back && !t.alive) back = true; const tg = back ? h : t;
              if (back && (!h.alive || el > 6)) { ce.dead = true; return false; }
              const d = dist(x, z, tg.x, tg.z), st = Math.min(d, (back ? 26 : 22) * dt);
              if (d < (back ? 0.9 : 0.8)) {
                if (!back) {
                  back = true; damage(h, t, dmg, 1); if (t.alive) { slow(h, t, 0.4, 1.5, 'megbite'); const b = addBuff(t, { id: 'megmark' + h.id, dur: 6, src: h }); if (b) b.fx = FX.aura(t, MEG.c, 6, t.radius + 0.7, 'rune2', 2); }
                  if (t.kind === 'hero') megCharge(h, 2); SFX.at('hit', t.x, t.z, 0.6); SFX.at('fire', t.x, t.z, 0.3);
                  if (FX.near(t.x, t.z, 50)) { FX.hit(t.x, 1.4, t.z, MEG.c, true); FX.slash(t.x, t.z, rand(TAU), { r: 1.4, sweep: 1.2, color: MEG.c, life: 0.18, y: 1.6 }); FX.sparks(t.x, 1.5, t.z, { n: 10, color: 0xffd0a0, color2: MEG.c, speed: [3, 8], life: [0.2, 0.4], w: 0.09 }); }
                } else { if (FX.near(x, z, 45)) FX.burst(x, 2.2, z, { smoke: true, n: 5, color: 0x1a1620, color2: 0x050408, speed: [0.5, 1.5], life: [0.3, 0.6], size: [0.6, 1.2], a: 0.6 }); ce.dead = true; return false; }
              } else { x += (tg.x - x) / d * st; z += (tg.z - z) / d * st; }
              const f = Math.sin(el * 32) * 0.8; cat.position.set(x, 2.2 + Math.sin(el * 9) * 0.15, z); cat.rotation.y = angTo(x, z, tg.x, tg.z); if (wl) wl.rotation.z = f; if (wr) wr.rotation.z = -f;
              if (Math.random() < dt * 14 && FX.near(x, z, 40)) FX.sparks(x, 2.2, z, { n: 1, color: 0xff8a6a, color2: MEG.c, speed: [0.5, 2], life: [0.2, 0.4], w: 0.06, grav: 0 });
              return true;
            }
          });
        }
      },
      {
        key: 'R', name: 'Взрыв!', icon: 'megboom', cd: 85, cost: 150, range: 24, ind: { type: 'circle', r: 7.5 }, anim: 'chant', animDur: 2.0, lock: 1.85, noCue: true, ai: { t: 'point', rad: 7, delay: 1.8, ult: true, hp: 0.7 },
        desc: 'Единственное заклинание, достойное архимага. Мегумин 1.8 сек читает заклинание, вскинув посох к небу, а над точкой (до 24) один за другим раскрываются шесть магических кругов. Затем с неба бьёт столб белого огня — и всё в радиусе 7.5 (плюс «Алый взор») накрывает Взрыв: огромный магический урон и отбрасывание. Тратит всю ману. После Взрыва Мегумин без сил падает лицом вниз и 2.5 сек не может ничего — 1.3 сек, если рядом союзный герой. Если её оглушат во время чтения, заклинание сорвётся.',
        cast(h, p) {
          const ch = h.meg || 0, R = 7.5 + ch * 0.4, x = p.x, z = p.z, dmg = D(h, 230, 42, 0, 0.9) * (1 + 0.06 * ch), T = 1.8; h.meg = 0; h.mana = this.cost; h.order = null; h.path = null;
          G.dangers.push({ x, z, r: R, team: h.team, until: G.time + T }); const mk = mmMark({ x, z, r: R, color: '#ff5a3a', until: G.time + T + 0.3 });
          SFX.at('ultcue', h.x, h.z, 0.6); SFX.at('cast', h.x, h.z, 0.8); SFX.at('fire', x, z, 0.4); G.dim = Math.max(G.dim || 0, FX.near(h.x, h.z, 40) ? 0.8 : 0);
          const near = FX.near(x, z, 75) || FX.near(h.x, h.z, 60);
          if (near) {
            FX.text(h.x, h.height + 1.4, h.z, 'Алое пламя, внемли мне…', '#ff9a7a', 15);
            megSigil(h.x, 0.12, h.z, 2.4, MEG.c, T + 0.2, 1.5, 0.9); megSigil(x, 0.15, z, R, MEG.c, T + 0.4, 0.6, 0.9);
            [3, 6, 9, 12, 15, 18].forEach((y, i) => after(0.15 + i * 0.17, () => { if (!h.alive || h.faintT > G.time) return; megSigil(x, y, z, R * (0.9 - i * 0.12), i % 2 ? MEG.fire : MEG.c, T + 0.06 - (0.15 + i * 0.17), (i % 2 ? -1 : 1) * (0.8 + i * 0.25), 0.62 - i * 0.06); SFX.at('zap', x, z, 0.25); }));
            FX.light(x, 8, z, MEG.c, 1.6, 40, T);
          }
          let el = 0, acc = 0;
          G.actors.push({
            update(dt) {
              el += dt; acc += dt;
              if (!h.alive || h.stunned) { h.castLock = 0; h.anim.castT = 0; mk.until = 0; if (h.alive && FX.near(h.x, h.z, 45)) FX.text(h.x, h.height + 0.8, h.z, 'сорвалось!', '#ffb0a0', 15); return false; }
              if (el < T) {
                if (acc > 0.06 && near) {
                  acc = 0; let gx = h.x, gy = 3.2, gz = h.z; if (h.rig && h.rig.gem) { h.rig.gem.getWorldPosition(_v6); gx = _v6.x; gy = _v6.y; gz = _v6.z; }
                  FX.implode(gx, gy, gz, 2.6, { n: 3, color: 0xffd0a0, color2: MEG.c, life: 0.3, streak: true });
                  const a = rand(TAU), r = rand(R * 0.9), y = rand(2, 20); FX.sparks(x + Math.sin(a) * r, y, z + Math.cos(a) * r, { n: 2, color: 0xffd0a0, color2: MEG.fire, speed: [1, 4], life: [0.3, 0.7], w: 0.08, grav: -4 });
                  if (el > T - 0.35) FX.implode(x, 21, z, 4, { n: 4, color: 0xffffff, color2: MEG.fire, life: 0.25, streak: true });
                }
                return true;
              }
              // the column of white fire, then the blast; she falls where she stands
              if (near) { r3Ray(x, 23, z, x, 0, z, { color: 0xff7a2a, w: 2.6, life: 0.3, grow: true, core: 0.35 }); FX.glow(x, 21, z, 6, 0xffd0a0, 0.25, 'flare'); }
              SFX.at('laser', x, z, 0.6);
              after(0.08, () => { megBoom(h, x, z, R, dmg); if (FX.near(x, z, 45)) FX.text(x, 9, z, 'ВЗРЫВ!', '#ffb070', 30); });
              const ally = G.heroes.some(o => o !== h && o.alive && o.team === h.team && udist(o, h) < 7), fd = ally ? 1.3 : 2.5;
              h.faintT = G.time + fd; h.faint0 = G.time; h.anim.castT = 0; addBuff(h, { id: 'faint', dur: fd, stun: true, src: h });
              if (FX.near(h.x, h.z, 45)) { FX.text(h.x, h.height + 0.6, h.z, ally ? 'донесите меня…' : 'сил больше нет…', '#ffb0a0', 14); FX.burst(h.x, 0.4, h.z, { smoke: true, n: 5, color: 0x8a7a68, color2: 0x3a3028, speed: [0.5, 1.5], life: [0.5, 0.9], size: [0.6, 1.2], ring: true, a: 0.4 }); }
              return false;
            }
          });
        }
      }
    ]
  },
  /* ================= 55. Levi ================= */
  {
    id: 'levi', name: 'Леви', title: 'Сильнейший солдат', role: 'assassin', roleName: 'Убийца', build: 'assassin', bars: [5, 2, 4, 4], diffc: 3, atkSfx: 'slash',
    lore: 'Капитан разведки, о котором говорят, что он один стоит целой бригады. Невысокий, вечно недовольный и помешанный на чистоте, в бою он превращается в стальной вихрь: тросы манёвренного снаряжения бросают его через стены и деревья, а его клинки находят затылок раньше, чем враг успевает обернуться.',
    look: { bulk: 0.86, h: 0.95, scale: 0.98, c1: 0x8a6a46, c2: 0xe8e4da, c3: 0x2a1c14, cuff: 0x8a6a46, skin: 0xead8c8, hands: 0xead8c8, metal: 0x8a9098, glow: 0xcfe8ff, head: 'levi', hair: 0x111014, shirt: 0xefede8, chest: 'survey', sh: 'none', weapon: 'odm', wc: 'dual', cape: 0x2f5a3a, emblem: true },
    stats: ST(590, 86, 280, 30, 64, 3.7, 23, 2.6, 0.9, 9.6, 2.4),
    innate: { name: 'Аккерман', icon: 'levinn', desc: 'Леви не делает лишних движений: по героям, у которых меньше половины здоровья, его атаки и умения бьют на 20% сильнее. Когда рядом с ним погибает вражеский герой, газ в баллонах восполняется — «Трос» сразу готов снова.' },
    onDeal(h, t, d, o) { if (o.levx || t.kind !== 'hero' || !t.alive || t.hp > t.maxHp * 0.5) return; damage(h, t, d * 0.2, 0, { dot: true, levx: true }); },
    onHeroDeath(o) { o.cd[1] = 0; o.hook2 = 0; if (o === G.player) FX.text(o.x, o.height + 0.8, o.z, 'газ восполнен', '#cfe8ff', 13); },
    tick(h) {
      if (h.spinning && !h.dash && G.time > (h.spinEnd || 0)) h.spinning = false;
      if (h.hook2 && G.time > h.hook2) { h.hook2 = 0; h.cd[1] = Math.max(h.cd[1], 9 * 100 / (100 + h.haste) - 3.5); }
    },
    abilities: [
      {
        key: 'Q', name: 'Вихрь клинков', icon: 'levspin', cd: 8, cost: 40, range: 8, ind: { type: 'line', w: 2.4 }, lock: 0, ai: { t: 'shot', sp: 32, farm: true },
        desc: 'Леви срывается вперёд на 8, вращаясь стальным вихрем: каждый враг на пути получает физический урон, а в конце рывка клинки ещё раз проходят по кругу радиусом 3 (60% урона).',
        cast(h, p) {
          const dmg = D(h, 60, 13, 0.75); h.spinning = true; h.spinEnd = G.time + 0.6; SFX.at('whoosh', h.x, h.z, 1); SFX.at('dash', h.x, h.z, 0.7); levGas(h, 6); let tk = 0;
          dashTo(h, p.x, p.z, 30, { ribbon: LEV.c, w: 1.5,
            trail: u => { if (FX.near(u.x, u.z, 45) && tk++ % 2 === 0) FX.slash(u.x, u.z, rand(TAU), { r: 2.2, sweep: 5, color: LEV.steel, life: 0.15, y: 1.0 + rand(0.6) }); },
            onHit: (e, u) => { damage(u, e, dmg, 0); FX.hit(e.x, 1.3, e.z, LEV.c, e.kind === 'hero'); levBlood(e, 4); SFX.at('slash', e.x, e.z, 0.6); },
            onEnd: u => {
              u.spinning = false; for (const e of enemiesIn(u, u.x, u.z, 3)) { damage(u, e, dmg * 0.6, 0); FX.hit(e.x, 1.2, e.z, LEV.c, false); levBlood(e, 3); }
              SFX.at('slash', u.x, u.z, 0.8); if (FX.near(u.x, u.z, 45)) { FX.slash(u.x, u.z, u.facing, { r: 3.2, sweep: 5.5, color: LEV.steel, life: 0.24, y: 1.1 }); FX.slash(u.x, u.z, u.facing + 2, { r: 2.9, sweep: 5.5, color: LEV.c, life: 0.22, y: 1.6, flip: true }); FX.ring(u.x, u.z, { r0: 0.5, r1: 3.4, color: LEV.c, life: 0.3, tex: 'ringThin' }); }
            } });
        }
      },
      {
        key: 'W', name: 'Трос', icon: 'levhook', cd: 9, cost: 30, range: 15, ind: { type: 'circle', r: 1 }, anim: 'hook', animDur: 0.45, lock: 0, ai: { t: 'gap', escape: true, re: true },
        free: h => h.hook2 > G.time,
        desc: 'Пистолеты манёвренного снаряжения выстреливают два троса в точку (до 15), и газ тащит Леви к ней по воздуху — над стенами, лесом и врагами. В течение 3.5 сек «Трос» можно выпустить ещё раз бесплатно. После приземления следующая атака в течение 3 сек наносит на 60% больше урона.',
        cast(h, p) {
          const sec = h.hook2 > G.time; h.hook2 = sec ? 0 : G.time + 3.5;
          const ax = p.x, az = p.z, d = dist(h.x, h.z, ax, az); SFX.at('whoosh', h.x, h.z, 0.8); SFX.at('dash', h.x, h.z, 0.6); levGas(h, 8); levCables(h, ax, 3.2, az, d / 40 + 0.12);
          dashTo(h, ax, az, 40, { fly: true, arc: 2.6, ribbon: LEV.green,
            trail: u => { if (FX.near(u.x, u.z, 45) && Math.random() < 0.7) FX.burst(u.x - Math.sin(u.facing) * 0.6, 1.1 + (u.yOff || 0), u.z - Math.cos(u.facing) * 0.6, { smoke: true, n: 1, color: 0xeef2f6, color2: 0x8a9098, speed: [0.3, 1], life: [0.4, 0.8], size: [0.5, 1.2], a: 0.5 }); },
            onEnd: u => {
              addBuff(u, { id: 'levair', dur: 3, onHit: (s, t, bf) => { if (bf.used) return 0; bf.used = true; bf.dead = true; levBlood(t, 6); if (FX.near(t.x, t.z, 45)) FX.slash(t.x, t.z, s.facing + 1, { r: 2.4, sweep: 1.6, color: 0xffffff, life: 0.18, y: 1.4 }); return s.ad * 0.6; } });
              if (FX.near(u.x, u.z, 45)) { FX.ring(u.x, u.z, { r0: 0.3, r1: 2.2, color: LEV.c, life: 0.3, tex: 'ringThin' }); FX.burst(u.x, 0.3, u.z, { smoke: true, n: 4, color: 0x8a8070, color2: 0x3a3630, speed: [1, 2.5], life: [0.3, 0.6], size: [0.6, 1.2], ring: true, a: 0.4 }); }
            } });
          return sec ? undefined : { cd: 0.35 };
        }
      },
      {
        key: 'E', name: 'Удар в затылок', icon: 'levnape', cd: 11, cost: 55, range: 6.5, ind: { type: 'target' }, anim: 'nape', animDur: 0.55, lock: 0, ai: { t: 'target' },
        desc: 'Леви взлетает над врагом (до 6.5), заходит ему за спину и режет по затылку: физический урон плюс 8% недостающего здоровья цели и кровотечение на 3 сек. Если цель оглушена или обездвижена, или удар нанесён после «Троса» (пока действует его усиление), — урон в 1.5 раза больше.',
        cast(h, p) {
          const t = p.unit; if (!t || !hostile(h, t)) return false;
          const a = angTo(h.x, h.z, t.x, t.z), bx = t.x + Math.sin(a) * 1.3, bz = t.z + Math.cos(a) * 1.3, base = D(h, 85, 18, 1.0);
          SFX.at('whoosh', h.x, h.z, 0.8); levGas(h, 6); levCables(h, t.x, 3.6, t.z, 0.3);
          dashTo(h, bx, bz, 34, { fly: true, arc: 3.4, ribbon: LEV.green,
            onEnd: u => {
              if (!t.alive) return; u.facing = angTo(u.x, u.z, t.x, t.z); if (udist(u, t) > 4) return;
              const air = hasBuff(u, 'levair'), crit = t.stunned || t.rooted || air; let dmg = base + (t.maxHp - t.hp) * 0.08; if (crit) dmg *= 1.5;
              if (air) for (const b of u.buffs) if (b.id === 'levair') b.dead = true;
              damage(u, t, dmg, 0, { crit }); if (t.alive) addBuff(t, { id: 'levbleed', dur: 3, every: 0.5, src: u, onTick: q => { damage(u, q, dmg * 0.05, 0, { dot: true }); levBlood(q, 2); } });
              SFX.at('slash', t.x, t.z, 1); SFX.at('heavy', t.x, t.z, 0.5); FX.shake(0.3); if (u === G.player) FX.hitstop(0.06);
              if (FX.near(t.x, t.z, 50)) { levCut(t, u.facing + 0.8, 0.5, 1.6); levCut(t, u.facing - 0.8, -0.5, 1.6); levBlood(t, 12); FX.hit(t.x, (t.height || 2) * 0.8, t.z, 0xff3040, true); if (crit && u === G.player) FX.text(t.x, t.height + 1, t.z, 'в затылок!', '#ffd0d0', 15); }
            } });
        }
      },
      {
        key: 'R', name: 'Сильнейший солдат', icon: 'levult', cd: 70, cost: 100, range: 8, ind: { type: 'target', hero: true }, anim: 'orbit', animDur: 2.0, lock: 2.0, ai: { t: 'target', ult: true, hp: 0.65 },
        desc: 'Леви цепляется тросами за всё вокруг вражеского героя (до 8) и 1.9 сек носится вокруг него стальным вихрем, недосягаемый для атак и умений: цель обездвижена, восемь разрезов с разных сторон, а последний удар — сверху, с оглушением на 0.6 сек. Весь урон физический.',
        cast(h, p) {
          const t = p.unit; if (!t || t.kind !== 'hero' || !hostile(h, t)) return false;
          const cut = D(h, 16, 4.5, 0.17), fin = D(h, 60, 15, 0.6), N = 8, T = 1.9; let el = 0, n = 0, acc = 0, cab = 0; const a0 = angTo(t.x, t.z, h.x, h.z);
          addBuff(h, { id: 'levult', dur: T + 0.1, invuln: true }); root(h, t, T + 0.1, LEV.c); h.phase = true; h.order = null; h.path = null;
          SFX.at('ultcue', h.x, h.z, 0.5); SFX.at('whoosh', h.x, h.z, 1); G.dim = Math.max(G.dim || 0, FX.near(h.x, h.z, 40) ? 0.6 : 0); if (FX.near(h.x, h.z, 45)) FX.text(h.x, h.height + 1, h.z, 'тц.', '#cfe8ff', 18);
          const finish = () => {
            for (const b of h.buffs) if (b.id === 'levult') b.dead = true; h.invuln = false; h.phase = false; h.castLock = 0.15; h.anim.castT = 0;
            if (t.alive && h.alive) {
              damage(h, t, fin, 0); if (t.alive) stun(h, t, 0.6); SFX.at('slash', t.x, t.z, 1); SFX.at('heavy', t.x, t.z, 0.8); FX.shake(0.5); if (FX.near(t.x, t.z, 36)) { FX.hitstop(0.09); FX.punch(0.8); }
              if (FX.near(t.x, t.z, 55)) { levCut(t, h.facing, 1.25, 2.2); levCut(t, h.facing + HPI, 1.1, 2); levBlood(t, 18); FX.ring(t.x, t.z, { r0: 0.5, r1: 3.5, color: LEV.c, life: 0.35, tex: 'shock' }); FX.debris(t.x, 0.3, t.z, { n: 6, color: 0x4a4038, speed: [2, 6], up: 6, size: [0.15, 0.35] }); }
            }
            const b = t.alive ? angTo(t.x, t.z, h.x, h.z) : 0, q = NAV.nearest(t.x + Math.sin(b) * 1.6, t.z + Math.cos(b) * 1.6); h.x = q.x; h.z = q.z; h.yOff = 0; if (t.alive) h.facing = angTo(h.x, h.z, t.x, t.z); levGas(h, 6);
          };
          G.actors.push({
            update(dt) {
              el += dt; acc += dt;
              if (el >= T || !t.alive || !h.alive) { finish(); return false; }
              const a = a0 + el * 6.2, r = 3 + Math.sin(el * 7) * 0.6; h.x = t.x + Math.sin(a) * r; h.z = t.z + Math.cos(a) * r; h.yOff = 1 + Math.abs(Math.sin(el * 4.5)) * 2.6; h.facing = angTo(h.x, h.z, t.x, t.z); h.castLock = Math.max(h.castLock, 0.1);
              if (acc > 0.18) { acc = 0; cab++; const aa = rand(TAU); levCables(h, t.x + Math.sin(aa) * 7, 3 + rand(2), t.z + Math.cos(aa) * 7, 0.22); levGas(h, 3); dshGhost(h, 0x9ad0b0, 0.3, 0.35); SFX.at('whoosh', h.x, h.z, 0.4); }
              if (n < N && el >= 0.15 + n * 0.2) { n++; damage(h, t, cut, 0); levCut(t, rand(TAU), rand(-0.9, 0.9), 1.5); levBlood(t, 6); FX.hit(t.x, 1.4, t.z, LEV.c, false); SFX.at('slash', t.x, t.z, 0.7); }
              return true;
            }
          });
        }
      }
    ]
  },
  /* ================= 56. Zenitsu ================= */
  {
    id: 'zenitsu', name: 'Зеницу', title: 'Спящий гром', role: 'assassin', roleName: 'Убийца', build: 'assassin', bars: [5, 2, 3, 3], diffc: 2, atkSfx: 'slash',
    lore: 'Самый трусливый мечник отряда истребителей демонов: плачет, кричит и бегает от каждой тени. Но стоит ему от страха потерять сознание, как во сне он становится громом — один шаг, одна вспышка, и клинок уже в ножнах. Из всех форм дыхания грома он знает только первую. Зато доводит её до совершенства.',
    look: { bulk: 0.86, h: 0.98, scale: 0.98, c1: 0xf2c23a, c2: 0x15141a, c3: 0x2a2620, cuff: 0xf2c23a, skin: 0xf2dcc8, hands: 0xf2dcc8, metal: 0xc8ccd4, glow: 0xffd83a, head: 'zenitsu', hair: 0xf6d23a, shirt: 0x15141a, chest: 'thunder', legs: 'hakama', sh: 'none', coat: 0xf2c23a, tri: true, weapon: 'raikatana', wc: 'melee' },
    stats: ST(570, 84, 270, 30, 60, 3.6, 22, 2.5, 0.84, 9.5, 2.4),
    innate: { name: 'Спящий гром', icon: 'zeninn', desc: 'Когда здоровье Зеницу падает ниже 40%, он от страха теряет сознание — и засыпает на 6 сек (не чаще раза в 30 сек; после «Бога пламенного грома» — тоже, на 4 сек). Во сне: +30% скорости атаки, +20% скорости, дальность атаки больше на 2.4 — каждая атака это вспышка, он мгновенно оказывается у цели и бьёт с разрядом (+30% урона, магический). «Удар грома» во сне можно повторить ещё дважды, а «Раскатов» становится восемь.', count: h => h.sleepT > G.time ? Math.ceil(h.sleepT - G.time) : 0 },
    tick(h, dt) {
      const t = G.time;
      if (h.zqT && t > h.zqT) { h.zqT = 0; h.zq = 0; h.cd[0] = Math.max(h.cd[0], 7 * 100 / (100 + h.haste) - 2.5); }
      if (h.sleepT > t) {
        h.range = h.def.stats.range + 2.4;
        if (FX.near(h.x, h.z, 45)) { if (Math.random() < dt * 0.8) FX.text(h.x + 0.4, h.height + 0.6, h.z, 'Zz', '#d8d0a0', 12); if (Math.random() < dt * 5) FX.arcs(h.x, 1.1, h.z, 1.2, 1, ZEN.c); }
      } else {
        if (h.sleeping) zenWake(h);
        if (h.hp < h.maxHp * 0.4 && !(h.sleepCd > t) && t - h.lastDamageT < 2) zenSleep(h, 6, true);
      }
    },
    abilities: [
      {
        key: 'Q', name: 'Удар грома и вспышки', icon: 'zenflash', cd: 7, cost: 40, range: 9, ind: { type: 'line', w: 2.2 }, anim: 'iai', animDur: 0.4, lock: 0.12, ai: { t: 'shot', sp: 999, farm: true },
        free: h => h.zq > 0 && G.time < h.zqT && h.sleepT > G.time,
        desc: 'Первая форма дыхания грома. Зеницу на миг приседает с рукой на рукояти — и исчезает во вспышке молнии, оказываясь в конце линии (до 9, стена останавливает). Каждый враг на пути получает физический урон. Во сне удар можно повторить ещё дважды в течение 2.5 сек (80% урона).',
        cast(h, p) {
          const asleep = h.sleepT > G.time, rec = asleep && h.zq > 0 && G.time < h.zqT, dmg = D(h, 70, 15, 0.9) * (rec ? 0.8 : 1), dir = p.dir; let ret;
          if (asleep) { if (rec) { h.zq--; if (h.zq > 0) ret = { cd: 0.25 }; else h.zqT = 0; } else { h.zq = 2; h.zqT = G.time + 2.5; ret = { cd: 0.25 }; } }
          after(0.1, () => {
            if (!h.alive || h.stunned) return; const x0 = h.x, z0 = h.z, e = zenReach(x0, z0, dir, 9);
            dshGhost(h, ZEN.c, 0.35, 0.5); blink(h, e.x, e.z); h.facing = dir; h.drawT = G.time + 0.3; h.order = null; zenBolt(x0, z0, h.x, h.z, false);
            SFX.at('zap', h.x, h.z, 0.9); SFX.at('slash', h.x, h.z, 0.8); SFX.at('dash', x0, z0, 0.5); FX.shake(0.2);
            for (const u of stripHits(h, x0, z0, dir, Math.max(0.5, e.d), 1.1)) { damage(h, u, dmg, 0); FX.hit(u.x, 1.3, u.z, ZEN.c, u.kind === 'hero'); after(0.1, () => { if (FX.near(u.x, u.z, 45)) { FX.slash(u.x, u.z, dir + HPI, { r: 1.8, sweep: 1.2, color: ZEN.c, life: 0.18, y: 1.2 }); FX.arcs(u.x, 1.2, u.z, 1, 2, ZEN.c); } }); }
            if (FX.near(h.x, h.z, 45)) FX.ring(h.x, h.z, { r0: 0.3, r1: 2.2, color: ZEN.c, life: 0.25, tex: 'ringThin' });
          });
          return ret;
        }
      },
      {
        key: 'W', name: 'Испуг', icon: 'zenfear', cd: 14, cost: 30, range: 0, ind: { type: 'self', r: 4.5 }, anim: 'shriek', animDur: 0.6, lock: 0, ai: { t: 'panic', hp: 0.5 },
        desc: 'Зеницу визжит так, что закладывает уши, и бросается наутёк: снимает с себя замедления и обездвиживание, 2 сек бежит на 60% быстрее, а враги в радиусе 4.5 от визга замедляются на 25% на 1 сек.',
        cast(h) {
          for (const b of h.buffs) if (b.slow || b.root) b.dead = true;
          addBuff(h, { id: 'zfear', dur: 2, ms: 0.6, every: 0.1, onTick: u => { if (FX.near(u.x, u.z, 40)) { FX.burst(u.x, 0.2, u.z, { smoke: true, n: 1, color: 0x8a8070, color2: 0x3a3630, speed: [0.3, 1], life: [0.3, 0.5], size: [0.4, 0.9], a: 0.4 }); if (Math.random() < 0.4) FX.burst(u.x, u.height, u.z, { n: 1, color: 0xbfe6ff, speed: [1, 3], life: [0.3, 0.5], size: [0.18, 0.04], up: 2, grav: -12 }); } } });
          for (const e of enemiesIn(h, h.x, h.z, 4.5)) slow(h, e, 0.25, 1, 'zshriek');
          SFX.at('whoosh', h.x, h.z, 0.8); SFX.at('horn', h.x, h.z, 0.25);
          if (FX.near(h.x, h.z, 50)) { FX.text(h.x, h.height + 1, h.z, 'А-А-А-А-А!', '#ffe27a', 20); for (let i = 0; i < 3; i++) after(i * 0.1, () => FX.ring(h.x, h.z, { r0: 0.5, r1: 4.5, color: ZEN.c, life: 0.4, tex: 'ringThin', y: 1.6 })); FX.warp('ring', h.x, 1.4, h.z, { r0: 0.5, r1: 5, str: 0.7, life: 0.35 }); FX.burst(h.x, h.height, h.z, { n: 6, color: 0xbfe6ff, speed: [2, 4], life: [0.3, 0.5], size: [0.2, 0.05], up: 3, grav: -12 }); }
        }
      },
      {
        key: 'E', name: 'Шесть раскатов', icon: 'zensix', cd: 13, cost: 60, range: 7, ind: { type: 'target' }, anim: 'iai', animDur: 0.5, lock: 0, ai: { t: 'target' },
        desc: 'Зеницу шесть раз подряд проносится сквозь врага (до 7) молнией, зигзагом с разных сторон — каждый раз физический урон всем на пути, — и на последнем раскате оглушает цель на 0.6 сек. На время раскатов он недосягаем. Во сне раскатов восемь.',
        cast(h, p) {
          const t = p.unit; if (!t || !hostile(h, t)) return false;
          const N = h.sleepT > G.time ? 8 : 6, dmg = D(h, 22, 5, 0.3), step = 0.065; let n = 0, el = 0, a = angTo(t.x, t.z, h.x, h.z);
          addBuff(h, { id: 'zsix', dur: N * step + 0.15, invuln: true }); h.phase = true; h.castLock = N * step + 0.15; h.order = null; h.path = null; SFX.at('zap', h.x, h.z, 0.8);
          G.actors.push({
            update(dt) {
              el += dt;
              while (n < N && el >= n * step) {
                n++; if (!h.alive) { h.phase = false; return false; }
                const cx = t.alive ? t.x : h.x, cz = t.alive ? t.z : h.z; a += Math.PI + rand(-0.7, 0.7);
                const q = NAV.nearest(cx + Math.sin(a) * 3.4, cz + Math.cos(a) * 3.4), x0 = h.x, z0 = h.z, dir = angTo(x0, z0, q.x, q.z), L = dist(x0, z0, q.x, q.z);
                h.x = q.x; h.z = q.z; h.facing = dir; h.drawT = G.time + 0.2; zenBolt(x0, z0, h.x, h.z, false); SFX.at('zap', h.x, h.z, 0.4); SFX.at('slash', h.x, h.z, 0.4);
                for (const u of stripHits(h, x0, z0, dir, Math.max(0.5, L), 1.2)) { damage(h, u, dmg, 0); FX.hit(u.x, 1.3, u.z, ZEN.c, false); }
                if (n === N && t.alive) { stun(h, t, 0.6); h.facing = angTo(h.x, h.z, t.x, t.z); if (FX.near(t.x, t.z, 50)) { FX.ring(t.x, t.z, { r0: 0.4, r1: 3, color: ZEN.c, life: 0.35, tex: 'shock' }); FX.bolt(t.x, 22, t.z, t.x, 0.2, t.z, { color: ZEN.c, w: 1.2, life: 0.25, jag: 1 }); FX.hit(t.x, 1.4, t.z, ZEN.c, true); } SFX.at('boom', t.x, t.z, 0.5); FX.shake(0.3); }
              }
              if (n >= N && el >= N * step + 0.05) { h.phase = false; return false; }
              return true;
            }
          });
        }
      },
      {
        key: 'R', name: 'Бог пламенного грома', icon: 'zendragon', cd: 80, cost: 100, range: 22, noReach: true, ind: { type: 'line', w: 3.2, len: 22, fixed: true }, anim: 'raijin', animDur: 1.15, lock: 0.95, noCue: true, ai: { t: 'shot', ult: true, hp: 0.55, sp: 999 },
        desc: 'Седьмая форма — его собственная. Зеницу 0.9 сек сидит в низкой стойке, собирая гром, — и исчезает: по линии на 22 (сквозь стены) проносится пылающий дракон молнии, а сам Зеницу оказывается в конце пути с клинком, уже входящим в ножны. Все на линии получают огромный физический урон и горят 3 сек. После удара он засыпает на 4 сек («Спящий гром»).',
        cast(h, p) {
          const dir = p.dir, L = 22, dmg = D(h, 210, 45, 1.25), T = 0.9; let el = 0, acc = 0; h.order = null; h.path = null;
          SFX.at('ultcue', h.x, h.z, 0.6); SFX.at('zap', h.x, h.z, 0.8); G.dim = Math.max(G.dim || 0, FX.near(h.x, h.z, 40) ? 0.85 : 0);
          if (FX.near(h.x, h.z, 50)) { FX.text(h.x, h.height + 1.2, h.z, 'Седьмая форма…', '#ffe27a', 16); FX.lineDecal(h.x, h.z, dir, L, 2.6, ZEN.fire, T); }
          G.actors.push({
            update(dt) {
              el += dt; acc += dt;
              if (!h.alive || h.stunned) { h.castLock = 0; h.anim.castT = 0; return false; }
              if (el < T) {
                if (acc > 0.05 && FX.near(h.x, h.z, 50)) { acc = 0; FX.implode(h.x, 1.1, h.z, 3.2, { n: 3, color: 0xffffff, color2: ZEN.c, life: 0.28, streak: true }); if (Math.random() < 0.5) FX.arcs(h.x, 0.8, h.z, 2.2, 1, ZEN.c); if (Math.random() < 0.3) FX.ring(h.x, h.z, { r0: 2.6, r1: 0.6, color: ZEN.fire, life: 0.3, tex: 'ringThin' }); if (Math.random() < 0.25) FX.debris(h.x, 0.2, h.z, { n: 1, color: 0x4a4038, speed: [0, 1], up: 5, size: [0.12, 0.25], rad: 1.6 }); }
                return true;
              }
              const x0 = h.x, z0 = h.z, ex = x0 + Math.sin(dir) * L, ez = z0 + Math.cos(dir) * L, q = NAV.nearest(ex, ez), hits = stripHits(h, x0, z0, dir, L, 1.6);
              zenDragon(x0, z0, dir, L); dshGhost(h, ZEN.c, 0.5, 0.55); blink(h, q.x, q.z); h.facing = dir; h.drawT = G.time + 0.6; zenBolt(x0, z0, ex, ez, true);
              SFX.at('bigboom', x0, z0, 0.8); SFX.at('laser', x0, z0, 0.6); SFX.at('zap', h.x, h.z, 1); SFX.at('fire', h.x, h.z, 0.7); FX.shake(0.8); if (FX.near(x0, z0, 40) || FX.near(h.x, h.z, 40)) { FX.punch(1.2); FX.hitstop(0.08); }
              if (FX.near(x0, z0, 60)) { FX.ring(x0, z0, { r0: 0.4, r1: 4, color: ZEN.c, life: 0.35, tex: 'shock' }); FX.warp('line', x0, 1.4, z0, { ang: dir, w: 4, len: L, str: 0.9, life: 0.45 }); FX.scorch(x0, z0, 1.6, ZEN.fire, 6); }
              after(0.2, () => {
                for (const u of hits) {
                  if (!u.alive) continue; damage(h, u, dmg, 0);
                  if (u.alive) addBuff(u, { id: 'zburn', dur: 3, every: 0.5, src: h, onTick: o => { damage(h, o, dmg * 0.03, 1, { dot: true }); if (FX.near(o.x, o.z, 40)) FX.flame(o.x, 1, o.z, { n: 2, color: 0xffa040, color2: 0x601000, size: [0.5, 1], life: [0.3, 0.6] }); } });
                  if (FX.near(u.x, u.z, 50)) { FX.slash(u.x, u.z, dir + HPI, { r: 2.6, sweep: 1.4, color: ZEN.fire, life: 0.22, y: 1.3 }); FX.bolt(u.x, 20, u.z, u.x, 0.2, u.z, { color: ZEN.c, w: 0.9, life: 0.22, jag: 0.9 }); FX.hit(u.x, 1.3, u.z, ZEN.fire, true); FX.flame(u.x, 1, u.z, { n: 5, color: 0xffb040, color2: 0x6a1a00, size: [0.8, 1.8], life: [0.3, 0.6], up: 2, a: 0.4 }); }
                }
                SFX.at('slash', h.x, h.z, 0.9);
              });
              after(0.55, () => { if (h.alive) zenSleep(h, 4, false); });
              return false;
            }
          });
        }
      }
    ]
  }
);

/* ---------- icons ---------- */
Object.assign(GLYPH, {
  kaidomain(T) { T.al(0.35, () => T.E(0, 14, 26, 6)); T.A(0, 14, 23, Math.PI, TAU, 4); T.S(3, -27, 14, 27, 14); T.star(-9, 0, 5, 2, 4); T.star(8, -6, 6, 2.2, 4); T.C(1, 7, 2); T.C(-14, 8, 1.6); T.C(13, 6, 1.6); T.hi(() => T.C(8, -6, 1.6)); },
  meginn(T) { T.E(0, 0, 24, 13); T.cut(() => T.E(0, 0, 18, 9)); T.star(0, 0, 9, 4, 5); T.hi(() => T.C(-3, -3, 1.8)); },
  megspark(T) { T.star(0, 4, 18, 7, 8); T.cut(() => T.C(0, 4, 5)); T.al(0.5, () => T.O(0, 4, 23, 2.5)); T.hi(() => T.C(-4, 0, 2)); },
  megstaff(T) { T.S(4.5, -16, 25, 8, -8); T.O(11, -14, 9, 4); T.C(11, -14, 4.5); T.al(0.5, () => T.E(-4, 22, 22, 5, 3)); T.hi(() => T.C(9, -16, 1.6)); },
  megcat(T) { T.P(-11, -4, -10, -17, -4, -9, 4, -9, 10, -17, 11, -4, 11, 9, 0, 15, -11, 9); T.P(-11, 0, -28, -12, -23, 4); T.P(11, 0, 28, -12, 23, 4); T.cut(() => { T.C(-5, 1, 2.6); T.C(5, 1, 2.6); }); T.hi(() => T.S(1.6, 0, -6, 0, -2)); },
  megboom(T) { T.C(-9, -9, 10); T.C(9, -9, 10); T.C(0, -15, 11); T.g.fillRect(-5, -4, 10, 21); T.E(0, 21, 24, 5); T.al(0.45, () => T.O(0, -8, 27, 2)); T.hi(() => T.C(-4, -16, 2.4)); },
  levinn(T) { T.blade(-22, 21, 18, -20, 6); T.blade(22, 21, -18, -20, 6); T.S(3.5, -24, 16, -15, 25); T.S(3.5, 24, 16, 15, 25); T.hi(() => T.C(0, 0, 2.2)); },
  levspin(T) { T.A(0, 0, 18, -0.6, 4.6, 5); T.head(18 * Math.cos(4.6), 18 * Math.sin(4.6), 4.6 + HPI, 8); T.blade(-6, 6, 14, -14, 5); T.al(0.5, () => T.O(0, 0, 25, 2)); T.hi(() => T.C(3, -3, 1.6)); },
  levhook(T) { T.S(2.5, -20, 22, 20, -18); T.S(2.5, -13, 24, 22, -11); T.C(21, -15, 4.5); T.C(-18, 22, 5); T.al(0.5, () => T.E(-18, 26, 9, 3)); T.hi(() => T.C(20, -16, 1.4)); },
  levnape(T) { T.S(5, -20, -20, 20, 20); T.S(5, 20, -20, -20, 20); T.al(0.35, () => T.C(0, 0, 13)); T.hi(() => T.S(1.6, -12, -12, -4, -4)); },
  levult(T) { T.P(-2, 16, -26, -14, -18, -12, -24, -4, -14, -3, -20, 6, -6, 6); T.al(0.6, () => T.P(2, 16, 26, -14, 18, -12, 24, -4, 14, -3, 20, 6, 6, 6)); T.S(3, 0, -24, 0, 22); T.hi(() => T.C(-14, -8, 1.6)); },
  zeninn(T) { T.S(4, -22, -16, -6, -16, -22, -2, -6, -2); T.S(3, 0, -4, 10, -4, 0, 6, 10, 6); T.bolt(17, 10, 0.55); T.hi(() => T.C(-14, -16, 1.5)); },
  zenflash(T) { T.S(5, -26, 10, -8, -4, 4, 8, 26, -8); T.al(0.4, () => T.S(11, -26, 10, -8, -4, 4, 8, 26, -8)); T.C(26, -8, 3); T.hi(() => T.S(1.6, -20, 6, -9, -2)); },
  zenfear(T) { T.O(0, 0, 19, 4); T.E(0, 8, 6, 8); T.C(-7, -5, 3); T.C(7, -5, 3); T.drop(22, -14, 0.5); T.drop(-23, -10, 0.4); T.hi(() => T.C(-8, -6, 1)); },
  zensix(T) { T.S(3.5, -24, -18, 24, -10, -24, -2, 24, 6, -24, 14, 24, 22); T.al(0.4, () => T.O(0, 2, 26, 2)); T.hi(() => T.C(0, -14, 1.6)); },
  zendragon(T) { T.Q(6, -24, 20, -6, -22, 14, 6); T.Q(4, 14, 6, 24, 18, 20, -6); T.C(-23, 20, 6); T.P(-28, 16, -34, 8, -24, 14); T.P(-20, 15, -18, 5, -24, 13); T.bolt(4, -6, 0.45); T.cut(() => T.C(-24, 18, 1.6)); T.hi(() => T.C(-21, 21, 1.4)); }
});
