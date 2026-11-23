'use strict';
/* ===== roster, part 49 (hero 76). Loaded after roster21.js; glyphs go to GLYPH at the end.
   76. Kai — an operative of the Hakumei bureau (a guest from the user's own game «Бюро Хакумэй»): a tired young man with his hands in his
       pockets and a power he barely holds. His Flow is a beam of raw energy that he keeps up for as long as he can: it starts thin and
       swells as it runs, turns after the cursor at a limited rate, and he can walk, slide and pulse without dropping it.
   The look of the Flow is carried over from that game: a cylinder with a flowing-noise shader (orange running into violet), a white-hot
   core inside it, a glow on the ground under the beam, a pulsing flare at the hand and another where the beam ends, sparks thrown back
   from the impact, a light that travels with it. ===== */
const KAH = { c: 0xff6420, vio: 0x8436ff, hot: 0xffd9a0, pale: 0xffe0b0, glow: 0xff8a4c, dash: 0x8f7bff };
const KAH_RES = 5;
const KAH_T = { value: 0 };
const KAH_VS = 'varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv=uv; vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }';
const KAH_FS = 'precision highp float; uniform float uTime,uLen,uPow,uCore; uniform vec3 uA,uB; varying vec2 vUv; varying vec3 vN; varying vec3 vV;' +
  'float h(vec2 p){ return fract(sin(dot(p,vec2(41.3,289.1)))*43758.5453); }' +
  'float n(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y); }' +
  'void main(){ float f=abs(dot(normalize(vN),normalize(vV)));' +
  ' float y=vUv.y*uLen; float fl=n(vec2(vUv.x*10.,y*.9-uTime*14.))*.6+n(vec2(vUv.x*22.,y*2.4-uTime*26.))*.4;' +
  ' float a=pow(f,2.2-uCore*.8)*(.07+1.5*fl*fl*fl+uCore*.5); a*=smoothstep(0.,.5,y)*smoothstep(uLen,uLen-.6,y);' +
  ' vec3 c=mix(uA,uB,smoothstep(.2,.8,fl))+vec3(1.,.95,.85)*pow(f,6.)*uCore*1.4; gl_FragColor=vec4(c*a*uPow,1.); }';
let _kahG = null;
const _kahUp = new THREE.Vector3(0, 1, 0), _kahDir = new THREE.Vector3(), _kahV = new THREE.Vector3();
function kahGeo() { return _kahG || (_kahG = { cyl: new THREE.CylinderGeometry(1, 1, 1, 14, 1, true), pl: new THREE.PlaneGeometry(1, 1) }); }
// one layer of the beam: an open cylinder whose shader runs streaks of noise along its length; core = the white-hot inner layer
function kahBeamMesh(colA, colB, core) {
  const mat = new THREE.ShaderMaterial({ vertexShader: KAH_VS, fragmentShader: KAH_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: KAH_T, uLen: { value: 1 }, uPow: { value: 1 }, uCore: { value: core || 0 }, uA: { value: new THREE.Color(colA) }, uB: { value: new THREE.Color(colB) } } });
  const m = new THREE.Mesh(kahGeo().cyl, mat); m.frustumCulled = false; m.renderOrder = 15; return m;
}
// a soft round additive disc lying on the ground
function kahDisc(color) {
  const m = new THREE.Mesh(kahGeo().pl, new THREE.MeshBasicMaterial({ map: TEX.glow, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  m.rotation.x = -HPI; m.renderOrder = 5; return m;
}
// a live beam: the outer flow, the core, the glow under it, the flare at the hand, the flare at the far end. set() lays it out every frame
function kahRig(ult) {
  // three layers: a wide violet-edged flow, a body of orange inside it, a white-hot core; the Breach runs deeper into violet
  const out = kahBeamMesh(ult ? 0xc04aff : KAH.c, ult ? 0x5a20e0 : KAH.vio, 0), mid = kahBeamMesh(0xff7a24, ult ? 0xd050ff : 0xff3a6a, 0), inn = kahBeamMesh(0xffc070, 0xfff0d0, 1), glow = kahDisc(ult ? 0x6a2ad8 : 0xc8501a), muz = kahDisc(0xff9a50), imp = kahDisc(0xffb070);
  const es = [out, mid, inn, glow, muz, imp].map(m => FX.add(m, 1e6, null));
  return {
    set(ox, oy, oz, dir, len, r, pw) {
      const dx = Math.sin(dir), dz = Math.cos(dir), t = G.time; KAH_T.value = t; _kahDir.set(dx, 0, dz);
      // this renderer blooms hard: the same numbers as in the bureau game burn out to a pale haze, so the layers run much dimmer here
      for (const [m, k, q] of [[out, 1.9, 0.62], [mid, 1.0, 0.5], [inn, 0.34, 0.45]]) { m.quaternion.setFromUnitVectors(_kahUp, _kahDir); m.position.set(ox + dx * len / 2, oy, oz + dz * len / 2); m.scale.set(r * k, len, r * k); m.material.uniforms.uLen.value = len; m.material.uniforms.uPow.value = q * pw * (0.92 + Math.sin(t * 47) * 0.08); }
      glow.position.set(ox + dx * len / 2, 0.07, oz + dz * len / 2); glow.scale.set(len * 1.1, r * 3.4 + 1.3, 1); glow.rotation.set(-HPI, 0, dir - HPI); glow.material.opacity = 0.16 * pw;
      const ms = (1.5 + r * 3) * (1 + Math.sin(t * 60) * 0.12); muz.position.set(ox, 0.09, oz); muz.scale.set(ms, ms, 1); muz.material.opacity = 0.35;
      const is = (1.4 + r * 3.6) * (1 + Math.sin(t * 71) * 0.2); imp.position.set(ox + dx * len, 0.1, oz + dz * len); imp.scale.set(is, is, 1); imp.material.opacity = 0.45;
    },
    fade(k) { out.material.uniforms.uPow.value *= k; mid.material.uniforms.uPow.value *= k; inn.material.uniforms.uPow.value *= k; glow.material.opacity *= k; muz.material.opacity *= k; imp.material.opacity *= k; },
    kill() { for (const e of es) e.dead = true; }
  };
}
function kahHand(h) { if (h.rig && h.rig.handR && h.rig.root.visible) { h.rig.handR.getWorldPosition(_kahV); return { x: _kahV.x, y: _kahV.y, z: _kahV.z }; } return { x: h.x, y: 1.3, z: h.z }; }
// resonance (innate): stacks from attacks and from abilities that reach heroes; the next Flow starts that much wider
function kahGain(h, n) {
  const was = h.kaiRes || 0; h.kaiRes = Math.min(KAH_RES, was + n); h.kaiResT = G.time + 8;
  if (h.kaiRes > was && h.kaiRes === KAH_RES && FX.near(h.x, h.z, 45)) { FX.ring(h.x, h.z, { r0: 0.3, r1: 2.2, color: 0xc85a1a, life: 0.35, tex: 'ringThin', op: 0.8 }); FX.text(h.x, h.height + 0.8, h.z, 'резонанс', '#ffc890', 13); SFX.at('chime', h.x, h.z, 0.25); }
}
// a basic attack: a flick of the same beam, thin and gone in a moment
function kahFlick(h, t) {
  const p = kahHand(h), tx = t.x, ty = (t.height || 2) * 0.55 + (t.yOff || 0), tz = t.z; if (!FX.near(p.x, p.z, 60)) return;
  const len = Math.max(0.5, Math.hypot(tx - p.x, ty - p.y, tz - p.z)); _kahDir.set(tx - p.x, ty - p.y, tz - p.z).normalize(); KAH_T.value = G.time;
  for (const [a, b, core, k, q] of [[KAH.c, KAH.vio, 0, 0.34, 0.75], [KAH.hot, 0xffffff, 1, 0.1, 0.55]]) {
    const m = kahBeamMesh(a, b, core); m.quaternion.setFromUnitVectors(_kahUp, _kahDir); m.position.set((p.x + tx) / 2, (p.y + ty) / 2, (p.z + tz) / 2); m.material.uniforms.uLen.value = len;
    FX.add(m, 0.16, (kk, me) => { KAH_T.value = G.time; me.scale.set(k * (1 - kk * 0.6), len, k * (1 - kk * 0.6)); me.material.uniforms.uPow.value = q * (1 - kk * kk); });
  }
  FX.glow(p.x, p.y, p.z, 1.3, KAH.hot, 0.1, 'star'); FX.glow(tx, ty, tz, 1.8, KAH.c, 0.14, 'star'); FX.light(tx, ty + 0.5, tz, KAH.c, 1.2, 7, 0.12);
  FX.sparks(tx, ty, tz, { n: 5, color: KAH.pale, color2: KAH.c, speed: [3, 8], life: [0.12, 0.3], up: 3, w: 0.06 });
}
/* the Flow itself (the Q and, with `ult`, the Breach): a beam held from his hand along `dir` for up to O.dur seconds.
   O: { dur, len, r0, r1, dps, turn, charge0, ult, slow, onEnd(dir, charge, why) }. It swells from r0 to r1 as it charges (1.1 s), hits every
   0.1 s, turns after the cursor (a bot: after the nearest enemy hero) at O.turn radians a second. Stuns and silences cut it. */
function kahStream(h, dir, O) {
  const F = h.kaiFlow = { ult: !!O.ult, stop: null }, rig = FX.near(h.x, h.z, 80) ? kahRig(O.ult) : null;
  let t = 0, acc = 0, d = dir, charge = O.ult ? 1 : (O.charge0 || 0), fx = 0, snd = 0, done = false, lastLen = O.len, lastHit = 0;
  const end = why => { if (done) return; done = true; if (h.kaiFlow === F) h.kaiFlow = null; if (rig) rig.kill(); h.anim.castT = 0; if (O.onEnd) O.onEnd(d, charge, why, lastLen); };
  F.stop = () => end('stop');
  // the pose is held for as long as the beam runs: a very long cast whose progress barely moves (the pose itself rises in its first 0.2 s)
  const pose = O.ult ? 'kburst' : 'kflow'; h.anim.castT = h.anim.castDur = 100; h.anim.castType = pose;
  G.actors.push({ update(dt) {
    if (done) return false; t += dt;
    if (!h.alive || h.stunned || h.silenced || h.kaiFlow !== F) { end('cut'); return false; }
    if (t >= O.dur) { end('time'); return false; }
    if (h.ai && !O.ult && t - lastHit > 0.9) { end('stop'); return false; }   // a bot does not stand there pouring the beam into nothing
    charge = Math.min(1, charge + dt / 1.1);
    let want = d;
    if (h.isPlayer && !h.ai) want = angTo(h.x, h.z, G.mx, G.mz);
    else {
      let tg = null, bd = 1e9; for (const e of G.heroes) if (e.alive && hostile(h, e)) { const dd = udist(h, e); if (dd < O.len + 5 && dd < bd) { bd = dd; tg = e; } }
      if (!tg) for (const e of G.units) if (e.alive && !e.struct && hostile(h, e)) { const dd = udist(h, e); if (dd < O.len + 2 && dd < bd && Math.abs(angDiff(d, angTo(h.x, h.z, e.x, e.z))) < 1.6) { bd = dd; tg = e; } }
      if (tg) want = angTo(h.x, h.z, tg.x, tg.z);
    }
    d += clamp(angDiff(d, want), -O.turn * dt, O.turn * dt);
    if (!h.dash) h.facing = d; h.atkCd = Math.max(h.atkCd, 0.3); h.windup = 0;
    if (h.anim.castType !== pose || !(h.anim.castT > 1)) { h.anim.castDur = 100; h.anim.castT = 99; h.anim.castType = pose; }   // a slide or a pulse borrowed the arms for a moment: back to the stance, already raised
    const sx = Math.sin(d), cz = Math.cos(d), ox = h.x + sx * 0.8, oz = h.z + cz * 0.8, oy = 1.3 + (h.yOff || 0), L = O.len + (h.castRange || 0);
    const r = O.r0 + (O.r1 - O.r0) * charge, pw = O.ult ? 1.5 : 0.65 + 0.5 * charge, grow = Math.min(1, t / 0.12); lastLen = L;
    if (rig) {
      rig.set(ox, oy, oz, d, L * grow, r, pw); if (O.dur - t < 0.15) rig.fade(Math.max(0, (O.dur - t) / 0.15));
      fx += dt;
      if (fx > 0.03) {
        fx = 0; const tt = Math.random() * L, ex = ox + sx * L, ez = oz + cz * L;
        // embers streaming down the beam, sparks kicked back from where it ends, the light that travels with it
        FX.sparks(ox + sx * tt, oy, oz + cz * tt, { n: O.ult ? 3 : 1, color: KAH.c, color2: KAH.vio, speed: [9, 15], life: [0.2, 0.4], dir: d, spread: 0.12 + r * 0.2, w: 0.07 + r * 0.05, rad: r * 0.6 });
        if (Math.random() < 0.7) FX.sparks(ex, oy, ez, { n: 2, color: KAH.hot, color2: KAH.c, speed: [4, 9], life: [0.25, 0.45], dir: d + Math.PI, spread: 1.1, up: 5, grav: -14, w: 0.07 });
        FX.light(ox + sx * 2, 1.8, oz + cz * 2, O.ult ? 0xa070ff : 0xff8a40, 0.5 + charge * 0.5 + (O.ult ? 0.6 : 0), 10, 0.1);
        FX.shake(O.ult ? 0.3 : 0.05 + charge * 0.08);
        if (Math.random() < (O.ult ? 0.3 : 0.1)) FX.warp('line', ox, oy, oz, { ang: d, w: r * 3 + 0.8, len: L, str: O.ult ? 0.4 : 0.25, life: 0.16 });
        if (O.ult && Math.random() < 0.15) FX.scorch(ox + sx * tt, oz + cz * tt, 0.6 + Math.random() * 0.5, KAH.vio, 3);
      }
    }
    snd += dt; if (snd > 0.2) { snd = 0; SFX.at('kflow', h.x, h.z, (O.ult ? 0.55 : 0.3) + charge * 0.2); }
    acc += dt;
    while (acc >= 0.1) {
      acc -= 0.1; addBuff(h, { id: 'kaiself', dur: 0.25, slow: O.slow });
      const k = O.ult ? 1 : 0.55 + 0.85 * charge;
      for (const e of stripHits(h, ox, oz, d, L, r)) {
        damage(h, e, O.dps * 0.1 * k, 1, { dot: true }); lastHit = t; if (!e.alive) continue;
        if (O.ult) slow(h, e, 0.35, 0.3, 'kaibreach');
        if (FX.near(e.x, e.z, 50) && Math.random() < 0.5) FX.sparks(e.x, e.height * 0.55, e.z, { n: 2, color: KAH.pale, color2: KAH.c, speed: [3, 7], life: [0.15, 0.3], up: 3, w: 0.06 });
      }
    }
    return true;
  } });
  return F;
}
// «Pulse»: a ring of force — damage, a shove, a slow; enemy projectiles caught in it are snuffed out
function kahPulse(h, dmg) {
  const R = 5.2; let hit = 0;
  for (const e of enemiesIn(h, h.x, h.z, R)) { if (e.struct) continue; damage(h, e, dmg, 1); if (!e.alive) continue; knock(e, h.x, h.z, 3.2, 0.25); slow(h, e, 0.35, 1.5, 'kaipulse'); if (e.kind === 'hero') hit++; if (FX.near(e.x, e.z, 45)) FX.hit(e.x, e.height * 0.55, e.z, KAH.c, true); }
  let killed = 0;
  for (let i = G.proj.length - 1; i >= 0; i--) {
    const p = G.proj[i]; if (!p.src || !hostile(h, p.src) || dist(p.x, p.z, h.x, h.z) > R + 0.4) continue;
    if (p.mesh) FX.killMesh(p.mesh); if (p.rib) p.rib.end(); G.proj.splice(i, 1); killed++;
    if (FX.near(p.x, p.z, 45)) { FX.sparks(p.x, p.y, p.z, { n: 5, color: 0xffffff, color2: KAH.c, speed: [2, 5], life: [0.15, 0.3], w: 0.05 }); FX.glow(p.x, p.y, p.z, 1.2, 0xffffff, 0.12, 'star'); }
  }
  if (hit) kahGain(h, hit);
  SFX.at('kpulse', h.x, h.z, 0.9); SFX.at('boom', h.x, h.z, 0.35);
  if (FX.near(h.x, h.z, 60)) {
    FX.shake(0.4); FX.shock(h.x, h.z, R + 1, 1.1, 0.4);
    FX.ring(h.x, h.z, { r0: 0.4, r1: R, color: 0xc8601a, life: 0.4, tex: 'ringThin', op: 0.9 }); FX.ring(h.x, h.z, { r0: 0.3, r1: R * 0.7, color: KAH.vio, life: 0.32, tex: 'ringThin', op: 0.7 }); FX.ring(h.x, h.z, { r0: 0.3, r1: R, color: 0xc8601a, life: 0.45, tex: 'shock', op: 0.22 });
    FX.sparks(h.x, 1, h.z, { n: 36, color: KAH.glow, color2: KAH.vio, speed: [9, 15], life: [0.3, 0.5], ring: true, w: 0.09 });
    FX.glow(h.x, 1.2, h.z, 4.5, KAH.hot, 0.2, 'flare'); FX.light(h.x, 2, h.z, 0xffa060, 2.4, 14, 0.3);
    if (killed) FX.text(h.x, h.height + 0.9, h.z, 'погашено: ' + killed, '#ffd9a0', 13);
  }
}
// the end of the Breach: the whole line goes up, everyone still in it is thrown back
function kahBreachEnd(h, d, L, dmg) {
  const sx = Math.sin(d), cz = Math.cos(d), x0 = h.x + sx * 0.8, z0 = h.z + cz * 0.8;
  for (const e of stripHits(h, x0, z0, d, L, 1.9)) { damage(h, e, dmg, 1); if (e.alive) knock(e, h.x, h.z, 3, 0.25); }
  SFX.at('bigboom', h.x + sx * 6, h.z + cz * 6, 0.9); SFX.at('kpulse', h.x, h.z, 0.7);
  if (!FX.near(x0, z0, 80)) return;
  for (let i = 0; i <= 9; i++) after(i * 0.03, () => { const x = x0 + sx * L * i / 9, z = z0 + cz * L * i / 9; FX.pillar(x, z, { r: 1.1, h: 7, color: i % 2 ? KAH.vio : 0xc8601a, life: 0.4, op: 0.4 }); FX.sparks(x, 0.6, z, { n: 6, color: KAH.hot, color2: KAH.vio, speed: [4, 11], life: [0.25, 0.5], up: 7, w: 0.09 }); FX.scorch(x, z, 1.5, KAH.vio, 5); });
  FX.shake(0.6); FX.shock(x0 + sx * L / 2, z0 + cz * L / 2, 7, 1.2, 0.45); FX.punch(0.5);
}

HEROES.push(
  /* ================= 76. Kai ================= */
  {
    id: 'kai', name: 'Кай', title: 'Оперативник бюро Хакумэй', role: 'mage', roleName: 'Маг', build: 'mage', bars: [5, 2, 3, 3], diffc: 3, atkSfx: 'kzap',
    lore: 'В бюро «Хакумэй» Кая держат за то, чего другие боятся: за Поток. Он не колдует и не целится — он просто перестаёт сдерживать то, что в нём течёт, и старается, чтобы на пути не оказалось несущих стен. Корпорации платят бюро за чистую работу, а Кай после каждого заказа пишет объяснительную про очередной прожжённый склад. В Разлом его прислали «на стажировку». Он подозревает, что это ссылка.',
    look: { bulk: 0.9, h: 1.04, scale: 1.0, c1: 0x2b2d3c, c2: 0x1c1d26, c3: 0x15161c, shoe: 0xe8e4da, flick: true, cuff: 0x2b2d3c, skin: 0xf0c8a8, hands: 0xf0c8a8, metal: 0x8f7bff, glow: KAH.glow, head: 'kai', hair: 0x15151d, shirt: 0xe8e4da, tie: 0x8f7bff, coat: 0x2b2d3c, chest: 'bureau', legs: 'jeans', sole: 0xf4f2ec, sh: 'none', weapon: 'none', wc: 'pocket' },
    stats: ST(550, 78, 430, 46, 48, 2.5, 20, 2.3, 0.72, 8.9, 7.5),
    init(h) { h.kaiRes = 0; h.kaiResT = 0; h.kaiFlow = null; },
    innate: { name: 'Резонанс', icon: 'kaiinn', desc: 'Каждая атака Кая и каждый вражеский герой, задетый «Скольжением» или «Импульсом», даёт заряд резонанса (до 5, держатся 8 сек). Следующий «Поток» тратит их все и начинается уже разогнанным: +20% разгона за заряд. С пятью зарядами Поток сразу бьёт во всю ширину.', count: h => h.kaiRes || 0 },
    tick(h, dt) {
      if (h.kaiRes > 0 && G.time > h.kaiResT) h.kaiRes = 0;
      if (h.alive && h.kaiRes > 0 && !h.kaiFlow && Math.random() < dt * (1.5 + h.kaiRes * 1.5) && FX.near(h.x, h.z, 40)) { const p = kahHand(h); FX.sparks(p.x, p.y, p.z, { n: 1, color: KAH.hot, color2: h.kaiRes >= KAH_RES ? KAH.vio : KAH.c, speed: [0.3, 1], life: [0.3, 0.6], up: 2.5, grav: 0, drag: 1, w: 0.06 }); }
    },
    shootAtk(u, t) {
      SFX.at('kzap', u.x, u.z, 0.4); kahFlick(u, t);
      after(0.04, () => { if (!u.alive || !t.alive) return; basicHit(u, t); kahGain(u, 1); });
    },
    abilities: [
      {
        key: 'Q', name: 'Поток', icon: 'kaiflow', cd: 8, cost: 55, range: 10.5, ind: { type: 'line', w: 1.8, len: 10.5, fixed: true }, toggle: true, lock: 0, free: h => !!h.kaiFlow, ai: { t: 'shot', sp: 90, r: 9, farm: true },
        desc: 'Кай перестаёт сдерживаться: из ладони бьёт луч чистой энергии длиной 10.5 и держится до 3 сек. Каждые 0.1 сек он наносит магический урон всем врагам на линии. Луч разгоняется: за 1.1 сек он становится втрое шире, а урон растёт с 55% до 140%. Луч поворачивается за курсором (не быстрее, чем на 200° в секунду), а сам Кай идёт на 35% медленнее и не атакует. Двигаться, «Скользить» и бить «Импульсом» можно, не прерывая Поток. Повторное нажатие гасит луч. Оглушение и безмолвие обрывают его.',
        cast(h, p) {
          const full = 8 * 100 / (100 + h.haste);
          if (h.kaiFlow) { if (h.kaiFlow.ult) return false; h.kaiFlow.stop(); return { cd: full }; }
          const st = h.kaiRes || 0; h.kaiRes = 0;
          kahStream(h, p.dir, { dur: 3, len: 10.5, r0: 0.3, r1: 0.9, dps: D(h, 68, 19, 0, 0.55), turn: 3.5, charge0: st * 0.2, slow: 0.35, onEnd: () => { h.cd[0] = full; SFX.at('sizzle', h.x, h.z, 0.3); } });
          SFX.at('kstart', h.x, h.z, 0.7);
          if (FX.near(h.x, h.z, 55)) { FX.shock(h.x, h.z, 2.5, 0.5, 0.3); FX.ring(h.x, h.z, { r0: 0.3, r1: 2, color: 0xc8601a, life: 0.3, tex: 'ringThin', op: 0.8 }); if (st >= KAH_RES) FX.text(h.x, h.height + 0.9, h.z, 'во всю ширину', '#ffc890', 14); }
          return { cd: h.isPlayer && !h.ai ? 0.4 : 3.4 };
        }
      },
      {
        key: 'W', name: 'Скольжение', icon: 'kaidash', cd: 10, cost: 40, range: 6, ind: { type: 'line', w: 1.4 }, lock: 0, noCue: true, ai: { t: 'escape', kite: true },
        desc: 'Кай срывается в сторону (рывок до 6) и на 0.3 сек становится неуязвим. Враги, сквозь которых он проскользнул, получают магический урон и замедляются на 30% на 1 сек; каждый задетый герой — заряд резонанса. Поток при этом не гаснет.',
        cast(h, p) {
          const dmg = D(h, 45, 13, 0, 0.3); let n = 0, got = 0; addBuff(h, { id: 'kaidash', dur: 0.3, invuln: true });
          SFX.at('dash', h.x, h.z, 0.7); SFX.at('blink', h.x, h.z, 0.35);
          if (FX.near(h.x, h.z, 50)) { dshGhost(h, KAH.dash, 0.4, 0.4); FX.burst(h.x, 0.4, h.z, { smoke: true, n: 6, color: 0xd8d8e0, color2: 0x6a6a78, speed: [1, 2.5], life: [0.3, 0.5], size: [0.5, 1], up: 0.5, a: 0.4 }); FX.ring(h.x, h.z, { r0: 1.6, r1: 0.3, color: KAH.dash, life: 0.22, tex: 'ringThin' }); }
          dashTo(h, p.x, p.z, 26, { ribbon: KAH.dash, w: 1.2,
            trail: u => { if (++n % 2 === 0) dshGhost(u, KAH.dash, 0.26, 0.3); if (FX.near(u.x, u.z, 45)) FX.sparks(u.x, 1 + Math.random() * 0.8, u.z, { n: 1, color: 0xd8ccff, color2: KAH.dash, speed: [0.3, 1], life: [0.2, 0.35], w: 0.07 }); },
            onHit: (e, u) => { damage(u, e, dmg, 1); if (e.alive) slow(u, e, 0.3, 1, 'kaidash'); if (e.kind === 'hero') got++; if (FX.near(e.x, e.z, 45)) { FX.hit(e.x, e.height * 0.55, e.z, KAH.dash, false); FX.slash(e.x, e.z, p.dir + HPI, { r: 1.6, sweep: 1.2, color: KAH.dash, life: 0.18, y: 1.2 }); } },
            onEnd: u => { if (got) kahGain(u, got); if (FX.near(u.x, u.z, 50)) FX.ring(u.x, u.z, { r0: 0.3, r1: 1.8, color: KAH.dash, life: 0.25, tex: 'ringThin', op: 0.7 }); } });
        }
      },
      {
        key: 'E', name: 'Импульс', icon: 'kaipulse', cd: 11, cost: 60, range: 0, ind: { type: 'self', r: 5.2 }, anim: 'flex', animDur: 0.4, lock: 0, ai: { t: 'nova', r: 4.4 },
        desc: 'Кай выбрасывает энергию во все стороны: враги в радиусе 5.2 получают магический урон, отлетают и замедляются на 35% на 1.5 сек. Вражеские снаряды в этом радиусе гаснут в воздухе. Каждый задетый герой — заряд резонанса. Поток при этом не гаснет.',
        cast(h) { kahPulse(h, D(h, 70, 20, 0, 0.5)); }
      },
      {
        key: 'R', name: 'Прорыв', icon: 'kaibreach', cd: 90, cost: 120, range: 20, ind: { type: 'line', w: 3.4, len: 20, fixed: true }, toggle: true, lock: 0.3, ai: { t: 'shot', sp: 90, r: 14, ult: true, hp: 0.8 },
        desc: 'Кай отпускает Поток целиком. 2.8 сек из обеих ладоней бьёт луч длиной 20 и шириной с дорогу: каждые 0.1 сек — магический урон и замедление на 35% всем на линии. Луч поворачивается за курсором медленно (85° в секунду), Кай едва идёт, зато получает на 40% меньше урона. В конце вся линия взрывается: ещё урон, и врагов отбрасывает. Оглушение и безмолвие обрывают Прорыв.',
        cast(h, p) {
          if (h.kaiFlow) { if (h.kaiFlow.ult) return false; h.kaiFlow.stop(); h.cd[0] = 8 * 100 / (100 + h.haste); }
          const last = D(h, 80, 28, 0, 0.5);
          addBuff(h, { id: 'kaibreach', dur: 2.9, dmgIn: 0.6, src: h });
          kahStream(h, p.dir, { dur: 2.8, len: 20, r0: 1.5, r1: 1.5, dps: D(h, 90, 36, 0, 0.5), turn: 1.5, ult: true, slow: 0.72, onEnd: (d, c, why, L) => { if (why === 'time') kahBreachEnd(h, d, L, last); for (const b of h.buffs) if (b.id === 'kaibreach') b.dead = true; } });
          SFX.at('ultcue', h.x, h.z, 0.8); SFX.at('kbreach', h.x, h.z, 1);
          FX.hitstop(0.1); FX.shake(0.8);
          if (FX.near(h.x, h.z, 60)) {
            FX.shock(h.x, h.z, 6, 1.8, 0.5); FX.text(h.x, h.height + 1.4, h.z, 'ПРОРЫВ', '#d8b8ff', 22); FX.punch(0.8);
            FX.ring(h.x, h.z, { r0: 0.4, r1: 5, color: KAH.vio, life: 0.45, tex: 'ringThin', op: 0.9 }); FX.ring(h.x, h.z, { r0: 0.3, r1: 3.4, color: 0xc8601a, life: 0.35, tex: 'ringThin', op: 0.8 });
            FX.sparks(h.x, 1.2, h.z, { n: 30, color: KAH.hot, color2: KAH.vio, speed: [6, 14], life: [0.3, 0.6], ring: true, w: 0.1 }); FX.zone(h.x, h.z, 2.4, 0x6a3ac8, 2.8, { tex: 'swirl', spin: 5, op: 0.45, follow: h });
          }
        }
      }
    ]
  }
);

/* ---------- icons ---------- */
Object.assign(GLYPH, {
  // a hand's spark with rings spreading from it
  kaiinn(T) { T.C(0, 0, 5); for (let i = 0; i < 3; i++) T.al(1 - i * 0.28, () => T.O(0, 0, 11 + i * 7, 3)); },
  // a beam that widens as it goes
  kaiflow(T) { T.C(-22, 0, 5); T.al(0.55, () => T.P(-18, -3, 26, -13, 26, 13, -18, 3)); T.P(-18, -1.5, 26, -5, 26, 5, -18, 1.5); },
  // a figure and its afterimage, lines of speed
  kaidash(T) { T.al(0.35, () => { T.C(-12, -12, 6); T.P(-20, 20, -4, 20, -7, -4, -17, -4); }); T.C(12, -12, 6); T.P(4, 20, 20, 20, 17, -4, 7, -4); T.al(0.6, () => { T.S(3, -4, 2, 2, 2); T.S(3, -6, 10, 0, 10); }); },
  // a burst: a ring with rays thrown out of it
  kaipulse(T) { T.O(0, 0, 13, 4); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; T.al(0.7, () => T.S(3.5, Math.cos(a) * 18, Math.sin(a) * 18, Math.cos(a) * 26, Math.sin(a) * 26)); } T.C(0, 0, 4); },
  // one huge beam filling the frame
  kaibreach(T) { T.al(0.45, () => T.g.fillRect(-28, -16, 56, 32)); T.g.fillRect(-28, -8, 56, 16); T.cut(() => T.g.fillRect(-28, -1.5, 56, 3)); T.al(0.9, () => T.C(-24, 0, 7)); }
});
