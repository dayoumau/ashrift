'use strict';
/* ===== roster, part 49 (hero 76). Loaded after roster21.js; glyphs go to GLYPH at the end.
   76. Kai — an operative of the Hakumei bureau (a guest from the user's own game «Бюро Хакумэй»): a tired young man with his hands in his
       pockets and a power he barely holds. His Flow is a beam of raw energy that he keeps up for as long as he can: it starts thin and
       swells as it runs, turns after the cursor at a limited rate, and he can walk, slide and pulse without dropping it.
   Everything that makes the Flow look and sound the way it does is carried over from that game one to one (its combat.js, models.js and
   engine.js): the beam shader and its two layers with their original brightness, the glow on the ground, the pulsing flares at the hand
   and at the far end, the round embers streaming down the beam, the screen-wide shockwave (FX.ripple) on the start of the Flow, on the
   Pulse and on the Breach, the continuous voice of the beam (two oscillators and filtered noise that rise with the charge) and the
   one-shot sounds. One thing is added: that game is fought at night, this one in daylight, so a soft shadow lies on the ground round the
   beam — without it the white-hot beam has nothing dark to burn against. ===== */
const KAH = { c: 0xff7a3c, vio: 0x9a5cff, hot: 0xffd9a0, pale: 0xffe0b0, glow: 0xff8a4c, dash: 0x8f7bff, emb: 0xff8a4c, ring: 0xffb070 };
const KAH_RES = 5;
const KAH_T = { value: 0 };
const KAH_VS = 'varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv=uv; vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }';
/* The shader of the bureau game, with one change in how the layers meet. There the beam is two cylinders, one inside the other, drawn additively
   into an 8-bit frame: where they stack, every channel clips at white, and that clip is what makes the heart of the beam white-hot while its edge
   stays orange and violet. This game draws into a half-float frame and its tone curve keeps the hue, so the same two layers summed up to pink.
   So both layers are computed here in one pass (the inner cylinder is found from the angle to the eye: it covers the middle uIn of the outer one),
   their sum is clipped per channel exactly as the 8-bit frame did, and only then lifted (uGain) for the bloom. */
const KAH_FS = 'precision highp float; uniform float uTime,uLen,uPow,uIn,uGain; uniform vec3 uA,uB,uC,uD; varying vec2 vUv; varying vec3 vN; varying vec3 vV;' +
  'float h(vec2 p){ return fract(sin(dot(p,vec2(41.3,289.1)))*43758.5453); }' +
  'float n(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y); }' +
  'void main(){ float f=abs(dot(normalize(vN),normalize(vV)));' +
  ' float y=vUv.y*uLen; float fl=n(vec2(vUv.x*10.,y*.9-uTime*14.))*.6+n(vec2(vUv.x*22.,y*2.4-uTime*26.))*.4;' +
  ' float e=smoothstep(0.,.5,y)*smoothstep(uLen,uLen-.6,y), g=.3+1.0*fl*fl, k=smoothstep(.2,.8,fl);' +
  ' vec3 c=mix(uA,uB,k)*pow(f,1.8)*g*e*1.25*uPow;' +
  ' float s2=(1.-f*f)/(uIn*uIn); if(s2<1.){ float fi=sqrt(1.-s2); c+=(mix(uC,uD,k)+vec3(1.,.95,.85)*pow(fi,3.)*1.4)*pow(fi,.9)*(g+.25)*e*.75*uPow; }' +
  ' vec3 c1=min(c,vec3(1.)); float w=clamp(dot(c-c1,vec3(.45)),0.,1.); c1=mix(c1,vec3(1.),w);' +   // what the clip threw away (and the bloom of that game then spread as white light) whitens the pixel
  ' gl_FragColor=vec4(c1*(uGain+w*1.6),1.); }';
let _kahG = null, _kahVoice = null;
const _kahUp = new THREE.Vector3(0, 1, 0), _kahDir = new THREE.Vector3(), _kahV = new THREE.Vector3();
function kahGeo() { return _kahG || (_kahG = { cyl: new THREE.CylinderGeometry(1, 1, 1, 14, 1, true), pl: new THREE.PlaneGeometry(1, 1) }); }
// the beam: an open cylinder whose shader runs streaks of noise along its length and holds the white-hot core inside
function kahBeamMesh() {
  const mat = new THREE.ShaderMaterial({ vertexShader: KAH_VS, fragmentShader: KAH_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: KAH_T, uLen: { value: 1 }, uPow: { value: 1 }, uIn: { value: 0.62 }, uGain: { value: 1.5 }, uA: { value: new THREE.Color(0xff7a3c) }, uB: { value: new THREE.Color(0x9a5cff) }, uC: { value: new THREE.Color(0xffd9a0) }, uD: { value: new THREE.Color(0xffffff) } } });
  const m = new THREE.Mesh(kahGeo().cyl, mat); m.frustumCulled = false; m.renderOrder = 15; return m;
}
// a soft round disc lying on the ground: additive light, or (dark) a shadow
function kahDisc(color, dark) {
  const m = new THREE.Mesh(kahGeo().pl, new THREE.MeshBasicMaterial({ map: TEX.glow, color, transparent: true, depthWrite: false, blending: dark ? THREE.NormalBlending : THREE.AdditiveBlending }));
  m.rotation.x = -HPI; m.renderOrder = dark ? 4 : 5; return m;
}
// a live beam, laid out every frame by set(): the outer flow and the core (the two layers of the bureau game, with its numbers), the glow
// on the ground under it, the flare at the hand, the flare where it ends, and the shadow that gives it something to burn against
function kahRig() {
  const shade = kahDisc(0x05040a, true), out = kahBeamMesh(), glow = kahDisc(0xff8a4c), muz = kahDisc(0xffc890), imp = kahDisc(0xffe0b0);
  const es = [shade, out, glow, muz, imp].map(m => FX.add(m, 1e6, null)); let fd = 1;
  return {
    set(ox, oy, oz, dir, len, r, pw, k) {
      const dx = Math.sin(dir), dz = Math.cos(dir), t = G.time; KAH_T.value = t; _kahDir.set(dx, 0, dz); fd = k === undefined ? 1 : k;
      out.quaternion.setFromUnitVectors(_kahUp, _kahDir); out.position.set(ox + dx * len / 2, oy, oz + dz * len / 2); out.scale.set(r * 1.9, len, r * 1.9); out.material.uniforms.uLen.value = len; out.material.uniforms.uPow.value = pw * (0.92 + Math.sin(t * 47) * 0.08) * fd;
      const mx = ox + dx * len / 2, mz = oz + dz * len / 2;
      shade.position.set(mx, 0.05, mz); shade.scale.set(len * 1.5 + 5, r * 10 + 8, 1); shade.rotation.set(-HPI, 0, dir - HPI); shade.material.opacity = Math.min(0.62, 0.42 + pw * 0.14) * fd;
      glow.position.set(mx, 0.07, mz); glow.scale.set(len * 1.15, r * 9 + 1.5, 1); glow.rotation.set(-HPI, 0, dir - HPI); glow.material.opacity = 0.2 * pw * fd;
      const ms = (2.4 + r * 5) * (1 + Math.sin(t * 60) * 0.12); muz.position.set(ox, 0.09, oz); muz.scale.set(ms, ms, 1); muz.material.opacity = 0.45 * fd;
      const is = (2 + r * 6) * (1 + Math.sin(t * 71) * 0.2); imp.position.set(ox + dx * len, 0.1, oz + dz * len); imp.scale.set(is, is, 1); imp.material.opacity = 0.6 * fd;
    },
    kill() { for (const e of es) e.dead = true; }
  };
}
function kahHand(h) { if (h.rig && h.rig.handR && h.rig.root.visible) { h.rig.handR.getWorldPosition(_kahV); return { x: _kahV.x, y: _kahV.y, z: _kahV.z }; } return { x: h.x, y: 1.3, z: h.z }; }
// the round soft embers of the bureau game (its additive particles), as bursts of this engine
function kahEmbers(x, y, z, o) { if (FX.near(x, z, 55)) FX.burst(x, y, z, o); }
/* the voice of the beam, as in the bureau game: a sawtooth and a square an octave apart through a resonant low-pass, plus band-passed noise;
   pitch, brightness and loudness rise with the charge. One voice for the whole match, driven by whichever Flow is nearest the camera; it
   falls silent by itself a fifth of a second after the last call */
function kahVoice(p, ult, vol) {
  const c = SFX.ctx; if (!c || !SFX.out) return;
  if (!_kahVoice || _kahVoice.ctx !== c) {
    const bg = c.createGain(); bg.gain.value = 0; bg.connect(SFX.out);
    const o1 = c.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = 58; const o2 = c.createOscillator(); o2.type = 'square'; o2.frequency.value = 117;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 500; lp.Q.value = 6; o1.connect(lp); o2.connect(lp); lp.connect(bg);
    const ns = c.createBufferSource(); ns.buffer = SFX.nb; ns.loop = true; const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 1.2;
    const ng = c.createGain(); ng.gain.value = 0.7; ns.connect(bp); bp.connect(ng); ng.connect(bg); o1.start(); o2.start(); ns.start();
    _kahVoice = { ctx: c, bg, o1, o2, lp, t: -1, v: 0 };
  }
  const V = _kahVoice, t = c.currentTime, v = (0.05 + p * 0.1) * vol * 1.6;
  if (V.t === G.time && v < V.v) return; V.t = G.time; V.v = v;   // two Kais in one frame: the louder one is heard
  V.bg.gain.cancelScheduledValues(t); V.bg.gain.setTargetAtTime(v, t, 0.05); V.bg.gain.setTargetAtTime(0, t + 0.2, 0.06);
  V.o1.frequency.setTargetAtTime((ult ? 44 : 56) + p * 22, t, 0.08); V.o2.frequency.setTargetAtTime((ult ? 88 : 113) + p * 44, t, 0.08); V.lp.frequency.setTargetAtTime(350 + p * (ult ? 2600 : 1300), t, 0.08);
}
function kahVol(x, z) { const k = clamp(1 - dist(x, z, G.camX, G.camZ) / 52, 0, 1); return k * k; }
// resonance (innate): stacks from attacks and from abilities that reach heroes; the next Flow starts that much wider
function kahGain(h, n) {
  const was = h.kaiRes || 0; h.kaiRes = Math.min(KAH_RES, was + n); h.kaiResT = G.time + 8;
  if (h.kaiRes > was && h.kaiRes === KAH_RES && FX.near(h.x, h.z, 45)) { FX.ring(h.x, h.z, { r0: 0.3, r1: 2.2, color: KAH.ring, life: 0.35, tex: 'disc', op: 0.8 }); FX.text(h.x, h.height + 0.8, h.z, 'резонанс', '#ffc890', 13); SFX.at('chime', h.x, h.z, 0.25); }
}
// a basic attack: a flick of the same beam, thin and gone in a moment
function kahFlick(h, t) {
  const p = kahHand(h), tx = t.x, ty = (t.height || 2) * 0.55 + (t.yOff || 0), tz = t.z; if (!FX.near(p.x, p.z, 60)) return;
  const len = Math.max(0.5, Math.hypot(tx - p.x, ty - p.y, tz - p.z)); _kahDir.set(tx - p.x, ty - p.y, tz - p.z).normalize(); KAH_T.value = G.time;
  const m = kahBeamMesh(); m.quaternion.setFromUnitVectors(_kahUp, _kahDir); m.position.set((p.x + tx) / 2, (p.y + ty) / 2, (p.z + tz) / 2); m.material.uniforms.uLen.value = len;
  FX.add(m, 0.16, (kk, me) => { KAH_T.value = G.time; me.scale.set(0.36 * (1 - kk * 0.6), len, 0.36 * (1 - kk * 0.6)); me.material.uniforms.uPow.value = 1 - kk * kk; });
  FX.glow(p.x, p.y, p.z, 1.4, 0xffc890, 0.1, 'glow'); FX.glow(tx, ty, tz, 2, 0xffe0b0, 0.14, 'glow'); FX.light(tx, ty + 0.5, tz, 0xffa060, 1.4, 8, 0.12);
  kahEmbers(tx, ty, tz, { n: 3, color: 0xffd9a0, color2: 0xff7a3c, size: [0.4, 0.05], life: [0.25, 0.4], speed: [4, 7], up: 3, grav: -14 });
}
/* the Flow itself (the Q and, with `ult`, the Breach): a beam held from his hand along `dir` for up to O.dur seconds.
   O: { dur, len, r0, r1, dps, turn, charge0, ult, slow, onEnd(dir, charge, why, len) }. It swells from r0 to r1 as it charges (1.1 s), hits
   every 0.1 s, turns after the cursor (a bot: after the nearest enemy hero) at O.turn radians a second. Stuns and silences cut it. */
function kahStream(h, dir, O) {
  const F = h.kaiFlow = { ult: !!O.ult, stop: null }, rig = FX.near(h.x, h.z, 80) ? kahRig() : null;
  let t = 0, acc = 0, d = dir, charge = O.ult ? 1 : (O.charge0 || 0), fx = 0, done = false, lastLen = O.len, lastHit = 0, hitS = 0;
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
    const sx = Math.sin(d), cz = Math.cos(d), ox = h.x + sx * 0.75, oz = h.z + cz * 0.75, oy = 1.25 + (h.yOff || 0), L = O.len + (h.castRange || 0);
    const r = O.r0 + (O.r1 - O.r0) * charge, pw = O.ult ? 1.5 : 0.65 + 0.5 * charge, grow = Math.min(1, t / 0.1); lastLen = L;
    kahVoice(O.ult ? 1 : charge, O.ult, kahVol(h.x, h.z));
    if (rig) {
      rig.set(ox, oy, oz, d, L * grow, r, pw, Math.min(1, (O.dur - t) / 0.12));
      fx += dt;
      if (fx > 0.016) {
        fx = 0; const tt = Math.random() * L, ex = ox + sx * L, ez = oz + cz * L;
        // embers streaming down the beam, embers kicked back from where it ends, the light that rides with it — all as in the bureau game
        kahEmbers(ox + sx * tt, oy, oz + cz * tt, { n: O.ult ? 4 : 2, color: 0xff8a4c, color2: 0x9a5cff, size: [0.35 + r * 0.6, 0.06], life: [0.3, 0.4], speed: [10 - r * 2, 14 + r * 4], dir: d, spread: 0.1 + r * 0.35, rad: r, drag: 2 });
        if (Math.random() < 0.7) kahEmbers(ex, oy, ez, { n: 2, color: 0xffd9a0, color2: 0xff7a3c, size: [0.4, 0.05], life: [0.35, 0.45], speed: [5, 8], dir: d + Math.PI, spread: 1.2, up: 5, grav: -14 });
        FX.light(ox + sx * 2, 1.6, oz + cz * 2, O.ult ? 0xc8a0ff : 0xffa060, 1 + charge * 1.4 + (O.ult ? 2.4 : 0), 16, 0.09);
        FX.shake(O.ult ? 0.42 : 0.1 + charge * 0.12);
      }
    }
    acc += dt;
    while (acc >= 0.1) {
      acc -= 0.1; addBuff(h, { id: 'kaiself', dur: 0.25, slow: O.slow });
      const k = O.ult ? 1 : 0.55 + 0.85 * charge; let any = false;
      for (const e of stripHits(h, ox, oz, d, L, r)) {
        damage(h, e, O.dps * 0.1 * k, 1, { dot: true }); lastHit = t; any = true; if (!e.alive) continue; e.flash = Math.max(e.flash || 0, 0.75);
        if (O.ult) slow(h, e, 0.35, 0.3, 'kaibreach');
        if (Math.random() < 0.35) kahEmbers(e.x, e.height * 0.5, e.z, { n: 1, color: 0xffe0b0, color2: 0xffe0b0, size: [0.5, 0.06], life: [0.2, 0.3], speed: [4, 6], up: 3 });
      }
      if (any && t - hitS > 0.3) { hitS = t; SFX.at('khit', ox + sx * L * 0.5, oz + cz * L * 0.5, 0.5); }
    }
    return true;
  } });
  return F;
}
// «Pulse»: a ring of force — damage, a shove, a slow; enemy projectiles caught in it are snuffed out
function kahPulse(h, dmg) {
  const R = 5.2; let hit = 0;
  for (const e of enemiesIn(h, h.x, h.z, R)) { if (e.struct) continue; damage(h, e, dmg, 1); if (!e.alive) continue; knock(e, h.x, h.z, 3.2, 0.25); slow(h, e, 0.35, 1.5, 'kaipulse'); if (e.kind === 'hero') hit++; }
  let killed = 0;
  for (let i = G.proj.length - 1; i >= 0; i--) {
    const p = G.proj[i]; if (!p.src || !hostile(h, p.src) || dist(p.x, p.z, h.x, h.z) > R + 0.4) continue;
    if (p.mesh) FX.killMesh(p.mesh); if (p.rib) p.rib.end(); G.proj.splice(i, 1); killed++;
    kahEmbers(p.x, p.y, p.z, { n: 4, color: 0xffffff, color2: 0xffffff, size: [0.4, 0.05], life: [0.2, 0.3], speed: [2, 4] });
  }
  if (hit) kahGain(h, hit);
  SFX.at('kpulse', h.x, h.z, 1);
  if (FX.near(h.x, h.z, 70)) {
    // exactly what the bureau game does: the screen kicked by a shockwave, one ring running out to the edge of the blast, a burst of embers that slow as they fly
    FX.shake(0.4); FX.ripple(h.x, 1, h.z, 1.1); FX.ring(h.x, h.z, { r0: 0.1, r1: R + 0.3, color: KAH.ring, life: 0.4, tex: 'disc', op: 0.55 }); FX.ring(h.x, h.z, { r0: 0.1, r1: R + 0.3, color: KAH.ring, life: 0.4, tex: 'ringThin', op: 0.9 });
    kahEmbers(h.x, 1, h.z, { n: 36, color: 0xffb070, color2: 0x9a5cff, size: [0.6, 0.08], life: [0.4, 0.5], speed: [10, 14], ring: true, drag: 4 });
    FX.light(h.x, 2, h.z, 0xffa060, 2.6, 16, 0.3);
    if (killed) FX.text(h.x, h.height + 0.9, h.z, 'погашено: ' + killed, '#ffd9a0', 13);
  }
}
// the end of the Breach: the whole line goes up, everyone still in it is thrown back
function kahBreachEnd(h, d, L, dmg) {
  const sx = Math.sin(d), cz = Math.cos(d), x0 = h.x + sx * 0.8, z0 = h.z + cz * 0.8;
  for (const e of stripHits(h, x0, z0, d, L, 1.9)) { damage(h, e, dmg, 1); if (e.alive) knock(e, h.x, h.z, 3, 0.25); }
  SFX.at('kboom', h.x + sx * 6, h.z + cz * 6, 1);
  if (!FX.near(x0, z0, 80)) return;
  FX.ripple(x0 + sx * L * 0.4, 1, z0 + cz * L * 0.4, 1.4); FX.shake(0.6);
  for (let i = 0; i <= 9; i++) after(i * 0.025, () => { const x = x0 + sx * L * i / 9, z = z0 + cz * L * i / 9; kahEmbers(x, 0.8, z, { n: 7, color: 0xffb070, color2: 0x9a5cff, size: [0.7, 0.08], life: [0.4, 0.6], speed: [4, 10], up: 5, drag: 3 }); FX.ring(x, z, { r0: 0.2, r1: 2.6, color: KAH.ring, life: 0.35, tex: 'disc', op: 0.8 }); FX.scorch(x, z, 1.2, 0xff8a4c, 5); });
  FX.light(x0 + sx * L * 0.4, 2.5, z0 + cz * L * 0.4, 0xc8a0ff, 3, 24, 0.4);
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
      if (h.alive && h.kaiRes > 0 && !h.kaiFlow && Math.random() < dt * (1.5 + h.kaiRes * 1.5) && FX.near(h.x, h.z, 40)) { const p = kahHand(h); kahEmbers(p.x, p.y, p.z, { n: 1, color: 0xffd9a0, color2: h.kaiRes >= KAH_RES ? 0x9a5cff : 0xff7a3c, size: [0.3, 0.04], life: [0.4, 0.6], speed: [0.2, 0.6], up: 2 }); }
    },
    shootAtk(u, t) {
      SFX.at('kzap', u.x, u.z, 0.6); kahFlick(u, t);
      after(0.04, () => { if (!u.alive || !t.alive) return; basicHit(u, t); kahGain(u, 1); });
    },
    abilities: [
      {
        key: 'Q', name: 'Поток', icon: 'kaiflow', cd: 8, cost: 55, range: 10.5, ind: { type: 'line', w: 1.6, len: 10.5, fixed: true }, toggle: true, lock: 0, free: h => !!h.kaiFlow, ai: { t: 'shot', sp: 90, r: 9, farm: true },
        desc: 'Кай перестаёт сдерживаться: из ладони бьёт луч чистой энергии длиной 10.5 и держится до 3 сек. Каждые 0.1 сек он наносит магический урон всем врагам на линии. Луч разгоняется: за 1.1 сек он становится втрое шире, а урон растёт с 55% до 140%. Луч поворачивается за курсором (не быстрее, чем на 200° в секунду), а сам Кай идёт на 35% медленнее и не атакует. Двигаться, «Скользить» и бить «Импульсом» можно, не прерывая Поток. Повторное нажатие гасит луч. Оглушение и безмолвие обрывают его.',
        cast(h, p) {
          const full = 8 * 100 / (100 + h.haste);
          if (h.kaiFlow) { if (h.kaiFlow.ult) return false; h.kaiFlow.stop(); return { cd: full }; }
          const st = h.kaiRes || 0; h.kaiRes = 0;
          kahStream(h, p.dir, { dur: 3, len: 10.5, r0: 0.3, r1: 0.85, dps: D(h, 78, 22, 0, 0.62), turn: 3.6, charge0: st * 0.2, slow: 0.35, onEnd: () => { h.cd[0] = full; } });
          SFX.at('kdash', h.x, h.z, 0.9); FX.ripple(h.x, 1.1, h.z, 0.5);
          if (st >= KAH_RES && FX.near(h.x, h.z, 55)) FX.text(h.x, h.height + 0.9, h.z, 'во всю ширину', '#ffc890', 14);
          return { cd: h.isPlayer && !h.ai ? 0.4 : 3.4 };
        }
      },
      {
        key: 'W', name: 'Скольжение', icon: 'kaidash', cd: 10, cost: 40, range: 6, ind: { type: 'line', w: 1.4 }, lock: 0, noCue: true, ai: { t: 'escape', kite: true },
        desc: 'Кай срывается в сторону (рывок до 6) и на 0.3 сек становится неуязвим. Враги, сквозь которых он проскользнул, получают магический урон и замедляются на 30% на 1 сек; каждый задетый герой — заряд резонанса. Поток при этом не гаснет.',
        cast(h, p) {
          const dmg = D(h, 45, 13, 0, 0.3); let got = 0; addBuff(h, { id: 'kaidash', dur: 0.32, invuln: true });
          SFX.at('kdash', h.x, h.z, 1);
          kahEmbers(h.x, 0.4, h.z, { smoke: true, n: 8, color: 0xd8d8e0, color2: 0xd8d8e0, size: [0.7, 1.1], life: [0.3, 0.45], speed: [1, 2.5], a: 0.5 });
          dashTo(h, p.x, p.z, 24, { ribbon: false, w: 1.2,
            // the violet afterglow of the bureau game: one soft ember a frame, hanging where he passed
            trail: u => { kahEmbers(u.x, 1 + rand(-0.6, 0.6), u.z, { n: 1, color: 0x8f7bff, color2: 0x8f7bff, size: [0.8, 0.1], life: [0.22, 0.28], speed: [0, 0.3], rad: 0.3 }); if (Math.random() < 0.35) dshGhost(u, KAH.dash, 0.22, 0.25); },
            onHit: (e, u) => { damage(u, e, dmg, 1); if (e.alive) slow(u, e, 0.3, 1, 'kaidash'); if (e.kind === 'hero') got++; SFX.at('khit', e.x, e.z, 0.7); kahEmbers(e.x, e.height * 0.5, e.z, { n: 4, color: 0x9ff0b0, color2: 0x8f7bff, size: [0.5, 0.06], life: [0.2, 0.3], speed: [3, 6] }); },
            onEnd: u => { if (got) kahGain(u, got); } });
        }
      },
      {
        key: 'E', name: 'Импульс', icon: 'kaipulse', cd: 11, cost: 60, range: 0, ind: { type: 'self', r: 5.2 }, anim: 'flex', animDur: 0.4, lock: 0, noCue: true, ai: { t: 'nova', r: 4.4 },
        desc: 'Кай выбрасывает энергию во все стороны: враги в радиусе 5.2 получают магический урон, отлетают и замедляются на 35% на 1.5 сек. Вражеские снаряды в этом радиусе гаснут в воздухе. Каждый задетый герой — заряд резонанса. Поток при этом не гаснет.',
        cast(h) { kahPulse(h, D(h, 70, 20, 0, 0.5)); }
      },
      {
        key: 'R', name: 'Прорыв', icon: 'kaibreach', cd: 90, cost: 120, range: 20, ind: { type: 'line', w: 3, len: 20, fixed: true }, toggle: true, lock: 0.3, ai: { t: 'shot', sp: 90, r: 14, ult: true, hp: 0.8 },
        desc: 'Кай отпускает Поток целиком. 2.8 сек из обеих ладоней бьёт луч длиной 20 и шириной с дорогу: каждые 0.1 сек — магический урон и замедление на 35% всем на линии. Луч поворачивается за курсором медленно (85° в секунду), Кай едва идёт, зато получает на 40% меньше урона. В конце вся линия взрывается: ещё урон, и врагов отбрасывает. Оглушение и безмолвие обрывают Прорыв.',
        cast(h, p) {
          if (h.kaiFlow) { if (h.kaiFlow.ult) return false; h.kaiFlow.stop(); h.cd[0] = 8 * 100 / (100 + h.haste); }
          const last = D(h, 80, 28, 0, 0.5);
          addBuff(h, { id: 'kaibreach', dur: 2.9, dmgIn: 0.6, src: h });
          kahStream(h, p.dir, { dur: 2.8, len: 20, r0: 1.25, r1: 1.25, dps: D(h, 90, 36, 0, 0.5), turn: 1.5, ult: true, slow: 0.72, onEnd: (d, c, why, L) => { if (why === 'time') kahBreachEnd(h, d, L, last); for (const b of h.buffs) if (b.id === 'kaibreach') b.dead = true; } });
          SFX.at('kult', h.x, h.z, 1); FX.shake(0.8); FX.ripple(h.x, 1, h.z, 1.8); FX.hitstop(0.12);
          if (FX.near(h.x, h.z, 60)) FX.text(h.x, h.height + 1.4, h.z, 'ПРОРЫВ', '#e8d0ff', 22);
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
