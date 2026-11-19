'use strict';
/* ===== bootstrap: renderer, post-processing, camera, input, main loop ===== */
let renderer, scene, camera, composer, bloom, finalPass, hemi, sun, warpRT = null, hdrOK = false, postOK = false;
const FPS = { t: 0, n: 0, v: 60, low: 0, told: false };
const IND = {};
const mouse = { x: 0, y: 0, rmb: false, rmbT: 0 };
const keys = {};
let W = 1, H = 1, lastT = 0, menuT = 0, endShown = false;

function boot() {
  const cv = $('gl');
  renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' });
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.shadowMap.autoUpdate = false;   // redrawn by frame(): every frame, or every other one when there are frames to spare
  scene = new THREE.Scene(); scene.background = new THREE.Color(0x0a0c11); scene.fog = new THREE.Fog(0x0a0c11, 62, 150);
  camera = new THREE.PerspectiveCamera(38, 1, 1, 400);
  G.scene = scene; G.camera = camera; G.zoom = 1; G.camLock = true; G.aim = -1; G.freeX = 0; G.freeZ = 0;
  hemi = new THREE.HemisphereLight(0x93a4c6, 0x2c2822, 0.9); scene.add(hemi);
  sun = new THREE.DirectionalLight(0xffe6c8, 0.95); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera; sc.left = -52; sc.right = 52; sc.top = 52; sc.bottom = -52; sc.near = 10; sc.far = 170; sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.04;
  scene.add(sun, sun.target);
  FX.init(scene); buildWorld(scene); buildFountainFx(scene, 0); buildFountainFx(scene, 1);
  // targeting indicators
  const mk = (geo, tex, op) => { const m = new THREE.Mesh(geo, FX.mat(tex, 0xffffff, op, true, true)); m.visible = false; m.renderOrder = 8; scene.add(m); return m; };
  IND.range = mk(FX.geo.flat, 'ringThin', 0.38); IND.line = mk(FX.geo.line, 'line', 0.55); IND.circle = mk(FX.geo.flat, 'disc', 0.55); IND.cone = mk(FX.geo.flat, 'cone', 0.55); IND.tgt = mk(FX.geo.flat, 'ring', 0.8);
  for (const k in IND) IND[k].position.y = 0.16;
  postOK = !!(THREE.EffectComposer && THREE.UnrealBloomPass && THREE.ShaderPass);
  // a floating-point frame needs the colour-buffer extension; without it the game falls back to the plain 8-bit frame
  try { const ex = renderer.extensions; hdrOK = renderer.capabilities.isWebGL2 ? !!(ex.get('EXT_color_buffer_float') || ex.get('EXT_color_buffer_half_float')) : !!(ex.get('OES_texture_half_float') && ex.get('EXT_color_buffer_half_float') && ex.get('OES_texture_half_float_linear')); } catch (e) { hdrOK = false; }
  applyGfx(); addEventListener('resize', onResize);
  bindInput(cv); UI.init();
  $('load').hidden = true; $('menu').hidden = false;
  requestAnimationFrame(t => { lastT = t; requestAnimationFrame(frame); });
}
/* post chain: scene -> [bloom] -> final pass (air distortion, tone compression, colour grade, screen states).
   With HDR on, the scene is drawn into a half-float buffer, so stacked additive effects keep their brightness above white instead of clipping;
   the final pass then compresses the highlights by the brightest channel (the hue survives) and lets only the very hottest pixels wash out to white */
function buildPost() {
  if (composer) { try { composer.renderTarget1.dispose(); composer.renderTarget2.dispose(); if (bloom && bloom.dispose) bloom.dispose(); } catch (e) { } }
  composer = bloom = finalPass = null; if (warpRT) { warpRT.dispose(); warpRT = null; }
  const hdr = !!GFX.hdr && hdrOK, warp = !!GFX.warp && hdrOK; FX.hdr = hdr; FX.warpOn = false;
  if (!postOK || !(GFX.hdr || GFX.bloom || GFX.warp)) { FX.hdr = false; FX.cfg(); return; }
  try {
    const type = hdr ? THREE.HalfFloatType : THREE.UnsignedByteType, opt = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, type };
    composer = new THREE.EffectComposer(renderer, new THREE.WebGLRenderTarget(4, 4, opt)); composer.addPass(new THREE.RenderPass(scene, camera));
    if (GFX.bloom) {
      bloom = new THREE.UnrealBloomPass(new THREE.Vector2(256, 256), hdr ? (GFX.bloom > 1 ? 0.46 : 0.26) : (GFX.bloom > 1 ? 0.78 : 0.42), 0.55, 0.66);
      if (hdr) {
        // the glow is gathered and blurred in half-float too; the bright pass caps how far above white a pixel may feed it, keeping its hue
        for (const rt of [bloom.renderTargetBright].concat(bloom.renderTargetsHorizontal, bloom.renderTargetsVertical)) rt.texture.type = type;
        bloom.materialHighPassFilter.fragmentShader = 'uniform sampler2D tDiffuse; uniform vec3 defaultColor; uniform float defaultOpacity, luminosityThreshold, smoothWidth; varying vec2 vUv; void main(){ vec4 t=texture2D(tDiffuse,vUv); float m=max(t.r,max(t.g,t.b)); t.rgb*=min(1.,1.9/max(m,1e-4)); float v=dot(t.rgb,vec3(.299,.587,.114)); gl_FragColor=mix(vec4(defaultColor,defaultOpacity),t,smoothstep(luminosityThreshold,luminosityThreshold+smoothWidth,max(v,m*.42))); }';
      }
      composer.addPass(bloom);
    }
    if (warp) { warpRT = new THREE.WebGLRenderTarget(4, 4, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, type: THREE.HalfFloatType, depthBuffer: false, stencilBuffer: false }); FX.warpOn = true; }
    finalPass = new THREE.ShaderPass({
        uniforms: { tDiffuse: { value: null }, tWarp: { value: warpRT ? warpRT.texture : null }, uWarp: { value: 0 }, uTone: { value: hdr ? 1 : 0 }, uDim: { value: 0 }, uDmg: { value: 0 }, uDead: { value: 0 }, uAsp: { value: 1.6 }, uCA: { value: 0 }, uStop: { value: 0 }, uInv: { value: 0 }, uSand: { value: 0 }, uCut: { value: [new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4()] } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
        fragmentShader: `uniform sampler2D tDiffuse, tWarp; uniform float uDmg, uDead, uAsp, uCA, uStop, uInv, uSand, uWarp, uTone, uDim; uniform vec4 uCut[3]; varying vec2 vUv;
          vec3 tone(vec3 c){ float m=max(c.r,max(c.g,c.b)); if(m>.8){ float f=.8+.2*(1.-exp(-(m-.8)*5.)); c*=f/m; c=mix(c,vec3(f),smoothstep(2.5,14.,m)*.7); } return c; }
          void main(){ vec2 uv=vUv, wv=vec2(0.);
            if(uWarp>.5){ wv=texture2D(tWarp,vUv).rg*.02; wv.x/=uAsp; uv-=wv; }
            float cv=0., ce=0.;
            for(int i=0;i<3;i++){ vec4 q=uCut[i]; if(q.w>0.){ vec2 n=vec2(cos(q.z),sin(q.z)), d=vUv-q.xy; d.x*=uAsp; float s=dot(d,n), a=abs(s), sg=s<0.?-1.:1.; vec2 off=(vec2(-n.y,n.x)*.7+n*.5)*sg*q.w; off.x/=uAsp; uv-=off; cv=max(cv,1.-step(q.w*.5,a)); ce=max(ce,exp(-pow((a-q.w*.5)/(.0012+q.w*.07),2.))); } }
            vec2 p=vUv-.5; float r=length(p); vec2 ca=(uv-.5)*(uCA+uSand*1.3)*.007+wv*.3;
            vec4 c=vec4(texture2D(tDiffuse,uv+ca).r,texture2D(tDiffuse,uv).g,texture2D(tDiffuse,uv-ca).b,1.);
            if(uTone>.5) c.rgb=tone(max(c.rgb,0.));
            c.rgb=mix(c.rgb,vec3(.025,.008,.06),cv); c.rgb+=vec3(.82,.72,1.)*ce*1.5;
            c.rgb*=1.-uDim*.34;
            c.rgb*=mix(.5,1.,smoothstep(.85,.3,r));
            float l=dot(c.rgb,vec3(.3,.59,.11)); c.rgb=mix(vec3(l),c.rgb,1.12-uDead*.85);
            c.rgb=c.rgb*(1.+.06*vec3(.9,.2,-.6)*(l-.35));
            float l2=dot(c.rgb,vec3(.3,.59,.11)); c.rgb=mix(c.rgb,vec3(l2)*vec3(.8,.9,1.14)+vec3(0.,.005,.03),uStop*.82); c.rgb=mix(c.rgb,1.-c.rgb,uInv); c.rgb=mix(c.rgb,c.rgb*vec3(.78,1.06,1.02)+vec3(0.,.02,.025)*smoothstep(.2,.7,r),uSand*.7);
            c.rgb=mix(c.rgb,vec3(.55,.02,.0),uDmg*smoothstep(.25,.75,r));
            gl_FragColor=vec4(c.rgb,1.); }`
    }); composer.addPass(finalPass);
  } catch (e) { composer = bloom = finalPass = null; if (warpRT) { warpRT.dispose(); warpRT = null; } FX.hdr = false; FX.warpOn = false; }
  FX.cfg();
}
// apply every graphics setting: resolution, shadows, the post chain, effect shaders
function applyGfx() {
  const dpr = window.devicePixelRatio || 1, s = GFX.scale;
  // auto: a little above the screen on an ordinary display (smooth edges), but no more than 1.5 on a scaled one (150-200%), where 2 would mean four times the pixels for no visible gain
  sun.castShadow = !!GFX.shadow; buildPost();
  renderer.setPixelRatio(s === 0 ? clamp(dpr, 1.25, 1.5) : (s === 2 ? Math.min(Math.max(dpr, 1.5), 2) : Math.min(s, 2)));
  onResize(); setWorldDetail(GFX.detail);
  const f = $('fps'); if (f) f.hidden = !GFX.fps;
}
function onResize() {
  W = window.innerWidth; H = window.innerHeight; if (!renderer) return;
  renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix();
  if (composer) { composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(W, H); }
  if (warpRT) { const pr = renderer.getPixelRatio(); warpRT.setSize(Math.max(2, Math.round(W * pr / 2)), Math.max(2, Math.round(H * pr / 2))); }
  FX.setScale(H * renderer.getPixelRatio() * 0.5 / Math.tan(camera.fov * Math.PI / 360));
  UI.resize(W, H, Math.min(window.devicePixelRatio || 1, 2));
}
function groundAt(mx, my) {
  const v = new THREE.Vector3(mx / W * 2 - 1, -(my / H) * 2 + 1, 0.5).unproject(camera).sub(camera.position).normalize();
  const t = -camera.position.y / v.y; return { x: camera.position.x + v.x * t, z: camera.position.z + v.z * t };
}
// screen-space unit picking under the cursor
function pickUnit(filter, slack) {
  let best = null, bd = 1e9; const ppu = H / (2 * Math.tan(camera.fov * Math.PI / 360) * camera.position.distanceTo(new THREE.Vector3(G.camX, 0, G.camZ)));
  for (const u of G.units) {
    if (!u.alive || !filter(u)) continue; if (Math.abs(u.x - G.camX) > 55 || Math.abs(u.z - G.camZ) > 50) continue;
    const p = UI.proj(u.x, Math.min(u.height * 0.5, 2.2), u.z); if (!p) continue;
    const d = Math.hypot(p.x - mouse.x, p.y - mouse.y), lim = u.radius * ppu * 1.25 + 16 + (slack || 0);
    if (d < lim && d - (u.kind === 'hero' ? 20 : 0) < bd) { bd = d - (u.kind === 'hero' ? 20 : 0); best = u; }
  }
  return best;
}
function playerMove(x, z) {
  const P = G.player; if (!P || P.dead || G.over) return;
  const q = NAV.nearest(x, z); setMove(P, q.x, q.z); P.order = { type: 'move' };
}
function command(marker) {
  const P = G.player; if (!P || P.dead || G.over || G.paused) return;
  if (P.geass && G.time < P.geass.until) { UI.msg('Вами управляет Гиас'); return; }
  if (P.tauntT > G.time) { UI.msg(P.bribeT > G.time ? 'Вас подкупили' : 'Вас спровоцировали'); return; }
  const t = pickUnit(u => hostile(P, u));
  if (t) {
    if (!targetable(P, t)) { UI.msg('Цель защищена: сначала разрушьте внешние башни'); SFX.play('deny'); return; }
    P.order = { type: 'attack', tgt: t, rp: 0 }; if (marker) FX.ring(t.x, t.z, { r0: t.radius + 1.6, r1: t.radius + 0.4, color: 0xff5148, life: 0.35 });
  } else {
    playerMove(G.mx, G.mz);
    if (marker) { const q = NAV.nearest(G.mx, G.mz); FX.ring(q.x, q.z, { r0: 1.5, r1: 0.3, color: 0x7dffa8, life: 0.35 }); FX.ring(q.x, q.z, { r0: 0.2, r1: 1.1, color: 0x7dffa8, life: 0.3, tex: 'fill', op: 0.5 }); }
  }
}
function canCast(i, quiet) {
  const P = G.player, ab = P.def.abilities[i]; if (!ab) return false; let why = null;
  if (ab.passive) why = 'Пассивная способность: действует сама'; else if (P.dead) why = 'Вы мертвы'; else if (!P.al[i]) why = i === 3 && P.level < 6 ? 'Ультимейт изучается с 6 уровня' : (P.sp > 0 ? 'Способность не изучена: Shift+' + kl('qwer'[i]) + ' или кнопка «+»' : 'Способность не изучена'); else if (P.cd[i] > 0) why = 'Способность перезаряжается';
  else if (!(ab.free && ab.free(P)) && P.mana < ab.cost) why = 'Недостаточно маны'; else if (P.silenced) why = 'Безмолвие'; else if (P.stunned) why = 'Вы оглушены'; else if (P.geass && G.time < P.geass.until) why = 'Вами управляет Гиас'; else if (P.tauntT > G.time) why = P.bribeT > G.time ? 'Вас подкупили' : 'Вас спровоцировали';
  if (why && !quiet) { UI.msg(why); SFX.play('deny'); }
  return !why;
}
function beginAim(i) {
  if (!G.player || G.over || G.paused || !canCast(i)) return;
  const ab = G.player.def.abilities[i];
  if (ab.ind.type === 'self') { castAbility(G.player, i, { x: G.player.x, z: G.player.z }); return; }
  if (ab.ind.type === 'note') { UI.toggleNote(); return; }   // a name is picked from a list, not aimed
  if (ab.global && G.aim !== i) UI.msg((ab.range ? 'Дальнее умение' : 'Глобальное умение') + ': укажите ' + (ab.ind.type === 'line' ? 'направление' : 'точку') + ' на поле или на мини-карте');
  G.aim = i;
}
// where an ability is being aimed: the ground under the cursor, or, for a global ability with the cursor over the minimap, that spot on the map
function aimPoint(ab) { return (ab.global && UI.mmAt(mouse.x, mouse.y)) || { x: G.mx, z: G.mz }; }
function releaseAim(i) {
  if (G.aim !== i) return; G.aim = -1;
  const P = G.player, ab = P.def.abilities[i]; if (!canCast(i)) return;
  const ap = aimPoint(ab), pt = { x: ap.x, z: ap.z, unit: null };
  if (ab.ind.type === 'target') {
    const f = u => hostile(P, u) && !u.struct && (!ab.ind.hero || u.kind === 'hero');
    pt.unit = pickUnit(f, 30);
    if (!pt.unit) { let bd = 9; for (const u of G.units) if (u.alive && f(u) && udist(P, u) < abRange(P, ab) + u.radius + 0.5) { const d = dist(u.x, u.z, G.mx, G.mz) - (u.kind === 'hero' ? 3 : 0); if (d < bd) { bd = d; pt.unit = u; } } }
    if (!pt.unit) { UI.msg(ab.ind.hero ? 'Наведите на вражеского героя' : 'Нет цели под курсором'); SFX.play('deny'); return; }
    if (udist(P, pt.unit) > abRange(P, ab) + pt.unit.radius + 0.6) { UI.msg('Цель слишком далеко'); SFX.play('deny'); return; }
  } else if (ab.ind.type === 'any') {
    // either an allied hero or an enemy unit: whatever is under the cursor, else the nearest one to it, else yourself
    const f = u => !u.struct && (u.team !== P.team || u.kind === 'hero'), rng = abRange(P, ab);
    pt.unit = pickUnit(f, 30);
    if (!pt.unit) { let bd = 6; for (const u of G.units) if (u.alive && f(u) && udist(P, u) < rng + u.radius + 0.5) { const d = dist(u.x, u.z, G.mx, G.mz) - (u.kind === 'hero' ? 2 : 0); if (d < bd) { bd = d; pt.unit = u; } } }
    if (!pt.unit) pt.unit = P;
    if (udist(P, pt.unit) > rng + pt.unit.radius + 0.6) { UI.msg('Цель слишком далеко'); SFX.play('deny'); return; }
  } else if (ab.ind.type === 'ally') {
    let b = P, bd = 4.5; for (const u of G.heroes) if (u.alive && u.team === P.team && udist(P, u) < abRange(P, ab) + 1) { const d = dist(u.x, u.z, G.mx, G.mz); if (d < bd) { bd = d; b = u; } } pt.unit = b;
  }
  castAbility(P, i, pt);
}
// spend a skill point on ability i (Shift + its key, or the "+" button over the slot)
function learnAbility(i) {
  const P = G.player; if (!P || G.over || G.paused) return; const ab = P.def.abilities[i]; if (!ab) return;
  if (learn(P, i)) { SFX.play('buy'); UI.onLearn(i); return; }
  const nx = P.al[i] + 1;
  UI.msg(P.al[i] >= abMax(i) ? 'Способность уже на максимальном уровне' : (P.level < abReq(i, nx) ? (i === 3 ? 'Ультимейт' : 'Этот уровень способности') + ' открывается на ' + abReq(i, nx) + ' уровне героя' : 'Нет свободных очков умений')); SFX.play('deny');
}
function togglePause(on) {
  if (G.state !== 'play' || G.over) return; G.paused = on === undefined ? !G.paused : on; $('pause').hidden = !G.paused; G.aim = -1; if (typeof RANKED !== 'undefined') RANKED.syncPause();
}
function startMatch(heroId, diff, lane, role, sandbox, pre) {
  G.sandbox = null; G.surrender = false; G.recorded = false; G.ranked = pre ? { on: true } : null; setupMatch(heroId, diff, lane, role, pre); if (sandbox) setupSandbox(); $('sbx').hidden = !sandbox; endShown = false; G.helpHid = false; G.aim = -1; G.camLock = true; G.zoom = 1;
  UI.showHUD(); if (finalPass) { finalPass.uniforms.uDead.value = 0; finalPass.uniforms.uDmg.value = 0; }
}
function toMenu() {
  clearMatch(); G.sandbox = null; $('sbx').hidden = true; G.state = 'menu'; $('hud').hidden = true; $('end').hidden = true; $('shop').hidden = true; $('pause').hidden = true; $('score').hidden = true; $('menu').hidden = false;
  for (const k in IND) IND[k].visible = false; if (finalPass) finalPass.uniforms.uDead.value = 0;
}
// camera drag: grab the ground under the cursor and pull the view, as in Dota 2 (bound to the wheel button by default)
function grabStart() {
  if (G.grabOn) return; const g = groundAt(mouse.x, mouse.y); G.grabOn = true; G.grabX = g.x; G.grabZ = g.z; document.body.classList.add('grab');
  if (G.camLock) { G.camLock = false; UI.msg('Свободная камера · ' + kl('center') + ' — вернуть к герою'); }
}
function grabEnd() { G.grabOn = false; document.body.classList.remove('grab'); }
// a bound key or mouse button went down / up
const AB = { q: 0, w: 1, e: 2, r: 3 };
function actDown(act) {
  if (G.state !== 'play') return;
  if (act === 'score') { UI.showScore(true); return; }
  if (act === 'help') { $('help').hidden = !$('help').hidden; return; }
  if (G.paused || G.over) return;
  const P = G.player;
  if (AB[act] !== undefined) beginAim(AB[act]);
  else if (act === 'grab') grabStart();
  else if (act === 'ping') PING.start();
  else if (act === 'recall') UI.recall();
  else if (act === 'stop') { P.order = null; P.path = null; P.moving = false; }
  else if (act === 'shop') UI.toggleShop();
  else if (act === 'lock') { G.camLock = !G.camLock; G.freeX = G.camX; G.freeZ = G.camZ; UI.msg(G.camLock ? 'Камера следует за героем' : 'Свободная камера: тащите её, зажав «' + kl('grab') + '», или ведите мышь к краям экрана'); }
  else if (act === 'center') { G.camLock = true; G.camSnap = true; }
}
function actUp(act) {
  if (act === 'score') UI.showScore(false); else if (act === 'grab') grabEnd(); else if (act === 'ping') PING.end();
  else if (AB[act] !== undefined && G.state === 'play' && !G.paused) releaseAim(AB[act]);
}
// full screen: a button in the menu and in the pause box; hidden where the browser does not allow it
// In the launcher (window.__TAURI__) it is the window's own full screen: Esc stays a game key and the choice is remembered.
// In a browser it is page full screen with the Escape key locked to the game, so Esc opens the pause; holding Esc leaves full screen.
const tauriWin = () => { try { return window.__TAURI__ && window.__TAURI__.window.getCurrentWindow(); } catch (e) { return null; } };
let nativeFs = false;
const isFull = () => tauriWin() ? nativeFs : !!document.fullscreenElement;
function syncFs() { const fs = isFull(); for (const id of ['fs-m', 'fs-p']) { const b = $(id); if (!b) continue; b.hidden = !tauriWin() && !document.fullscreenEnabled; b.textContent = fs ? 'Выйти из полного экрана' : 'Во весь экран'; } }
async function setFull(on) {
  const w = tauriWin();
  if (w) {
    try { await w.setFullscreen(on); nativeFs = on; try { localStorage.setItem('ashrift.fs', on ? '1' : '0'); } catch (e) { } } catch (e) { UI.msg('Не получилось переключить полный экран'); }
    syncFs(); return;
  }
  try {
    if (on) { await document.documentElement.requestFullscreen(); try { if (navigator.keyboard && navigator.keyboard.lock) await navigator.keyboard.lock(['Escape']); } catch (e) { } }
    else { if (navigator.keyboard && navigator.keyboard.unlock) navigator.keyboard.unlock(); await document.exitFullscreen(); }
  } catch (e) { UI.msg('Браузер не разрешил полноэкранный режим'); }
}
function toggleFull() { SFX.init(); setFull(!isFull()); }
function bindInput(cv) {
  for (const id of ['fs-m', 'fs-p']) if ($(id)) $(id).onclick = toggleFull;
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && navigator.keyboard && navigator.keyboard.unlock) navigator.keyboard.unlock(); syncFs(); }); syncFs();
  // the launcher starts in full screen if it was left that way
  if (tauriWin()) { let fs = '1'; try { fs = localStorage.getItem('ashrift.fs') || '1'; } catch (e) { } if (fs === '1') setFull(true); }
  addEventListener('keydown', e => { if (e.code === 'F11' && tauriWin()) { e.preventDefault(); toggleFull(); } });
  addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; if (PING.open) PING.hover(); });
  cv.addEventListener('mousedown', e => {
    SFX.init(); if (G.state !== 'play' || UI.capture) return; mouse.x = e.clientX; mouse.y = e.clientY; const g = groundAt(mouse.x, mouse.y); G.mx = g.x; G.mz = g.z;
    // wheel and side buttons act like keys: whatever action is bound to them (by default the wheel button drags the camera)
    if (e.button === 1 || e.button > 2) { e.preventDefault(); const code = 'Mouse' + e.button; keys[code] = true; if (KEYMAP[code]) actDown(KEYMAP[code]); return; }
    if (e.button === 2) { if (G.aim >= 0) { G.aim = -1; return; } mouse.rmb = true; mouse.rmbT = 0.18; command(true); }
    else if (e.button === 0 && G.aim >= 0) releaseAim(G.aim);
  });
  addEventListener('mouseup', e => { if (e.button === 2) mouse.rmb = false; if (e.button === 1 || e.button > 2) { const code = 'Mouse' + e.button; keys[code] = false; if (KEYMAP[code]) actUp(KEYMAP[code]); } });
  addEventListener('mousedown', e => {
    const aux = e.button === 1 || e.button > 2; if (aux) e.preventDefault();
    // while rebinding, the wheel button or a side button becomes the new binding; any other click cancels
    if (UI.capture && aux) { setBind(UI.capture, 'Mouse' + e.button); SFX.play('ui'); UI.endCapture(); }
    else if (UI.capture && !(e.target.classList && e.target.classList.contains('kbtn'))) UI.endCapture();
  });
  addEventListener('auxclick', e => e.preventDefault());
  addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('mouseleave', () => { mouse.rmb = false; });
  addEventListener('blur', () => { mouse.rmb = false; grabEnd(); PING.cancel(); for (const k in keys) keys[k] = false; G.aim = -1; UI.showScore(false); });
  cv.addEventListener('wheel', e => e.preventDefault(), { passive: false });   // the wheel does not zoom: the camera height is fixed
  addEventListener('keydown', e => {
    const c = e.code;
    // rebinding: the next key pressed becomes the new binding (Esc cancels)
    if (UI.capture) { e.preventDefault(); e.stopPropagation(); if (c !== 'Escape') { setBind(UI.capture, c); SFX.play('ui'); } UI.endCapture(); return; }
    keys[c] = true;
    // in the menu Esc steps back toward the home screen
    if (G.state === 'menu' && c === 'Escape' && PROF.closeReport()) return;
    if (G.state === 'menu' && c === 'Escape' && !$('menu').hidden && $('savecode').hidden && UI.scr && UI.scr !== 'home') { SFX.init(); SFX.play('ui'); UI.back(); return; }
    if (G.state !== 'play') return;
    const act = KEYMAP[c]; if (act && !(e.target && e.target.tagName === 'INPUT')) e.preventDefault();
    if (UI.noteOpen) { if (c === 'Escape') { UI.closeNote(); return; } const n = /^(Digit|Numpad)([1-5])$/.exec(c); if (n) { if (!e.repeat) UI.pickNote(+n[2] - 1); return; } }
    if (c === 'Escape') { if (UI.shopOpen) UI.toggleShop(false); else if (G.aim >= 0) G.aim = -1; else togglePause(); return; }
    // number keys 1-6 use the item in that inventory slot (unless the player has bound the key to something else)
    const dn = /^Digit([1-6])$/.exec(c); if (dn && !act && !e.shiftKey) { if (!e.repeat) UI.useItem(+dn[1] - 1); return; }
    if (e.shiftKey && AB[act] !== undefined) { if (!e.repeat) learnAbility(AB[act]); return; }   // Shift + ability key spends a skill point
    if (act && !e.repeat) actDown(act);
  });
  addEventListener('keyup', e => { const c = e.code; keys[c] = false; if (KEYMAP[c]) { if (G.state === 'play') e.preventDefault(); actUp(KEYMAP[c]); } });
}
function updateIndicators() {
  const P = G.player, on = G.state === 'play' && G.aim >= 0 && P && !P.dead;
  for (const k in IND) IND[k].visible = false;
  if (!on) return;
  const ab = P.def.abilities[G.aim], ty = ab.ind.type, col = P.def.look.glow, ap = aimPoint(ab), a = angTo(P.x, P.z, ap.x, ap.z), rng = abRange(P, ab); let d = dist(P.x, P.z, ap.x, ap.z);
  const set = (m, x, z, sx, sz, ry) => { m.visible = true; m.position.x = x; m.position.z = z; m.scale.set(sx, 1, sz); m.rotation.y = ry || 0; m.material.color.setHex(col); };
  if (rng) set(IND.range, P.x, P.z, rng * 2 * RK, rng * 2 * RK); IND.range.material.color.setHex(0xcfd8e8);
  d = Math.min(d, rng || d);
  if (ty === 'line') set(IND.line, P.x, P.z, ab.ind.w, ab.ind.fixed ? (rng || ab.ind.len || 60) : Math.max(2, d), a);
  else if (ty === 'circle') { const r = ab.ind.r; set(IND.circle, P.x + Math.sin(a) * d, P.z + Math.cos(a) * d, r * 2 * RK, r * 2 * RK); }
  else if (ty === 'wall') { const L = ab.ind.len, cx = P.x + Math.sin(a) * d, cz = P.z + Math.cos(a) * d; set(IND.line, cx - Math.cos(a) * L / 2, cz + Math.sin(a) * L / 2, 2, L, a + Math.PI / 2); }   // a wall across the line of the cast
  else if (ty === 'cone') { const r = ab.ind.r; set(IND.cone, P.x, P.z, r * 2 * RK * (ab.ind.narrow ? 0.42 : 1), r * 2 * RK, a); }
  else if (ty === 'target' || ty === 'ally' || ty === 'any') {
    const f = ty === 'ally' ? (u => u.team === P.team && u.kind === 'hero') : ty === 'any' ? (u => !u.struct && (u.team !== P.team || u.kind === 'hero')) : (u => hostile(P, u) && !u.struct && (!ab.ind.hero || u.kind === 'hero'));
    const t = pickUnit(f, 30) || (ty === 'ally' || ty === 'any' ? P : null); if (t) { set(IND.tgt, t.x, t.z, (t.radius + 0.9) * 2 * RK, (t.radius + 0.9) * 2 * RK, G.time * 3); }
  }
}
function updateCamera(dt) {
  let tx, tz; const P = G.player;
  if (G.state === 'menu') { menuT += dt * 0.05; tx = Math.sin(menuT) * 46; tz = Math.sin(menuT * 1.7 + 1) * 46; G.zoom = 1.15; }
  else if (G.over && G.overCore) { tx = G.overCore.x; tz = G.overCore.z; }
  else if (G.grabOn) {
    // grab-drag: shift the view so the ground point picked at press stays exactly under the cursor
    G.panning = false; G.camX = clamp(G.camX + G.grabX - G.mx, -100, 100); G.camZ = clamp(G.camZ + G.grabZ - G.mz, -100, 100); tx = G.freeX = G.camX; tz = G.freeZ = G.camZ;
  }
  else if (keys[BINDS.pan]) {
    // hold the pan key: the camera glides toward the cursor, so moving the mouse pans the view
    if (!G.panning) { G.panning = true; G.freeX = G.camX; G.freeZ = G.camZ; }
    const q = Math.min(1, dt * 1.9); G.freeX = clamp(G.freeX + (G.mx - G.camX) * q, -100, 100); G.freeZ = clamp(G.freeZ + (G.mz - G.camZ) * q, -100, 100); tx = G.freeX; tz = G.freeZ;
  }
  else if (G.camLock) { G.panning = false; tx = P.x; tz = P.z; if (!P.dead) { tx += clamp((G.mx - P.x) * 0.1, -3.5, 3.5); tz += clamp((G.mz - P.z) * 0.1, -3, 3); } }
  else {
    G.panning = false; const sp = 55 * dt * G.zoom, m = 14, edge = !UI.shopOpen && !G.paused;
    if ((edge && mouse.x < m) || keys.ArrowLeft) G.freeX -= sp; if ((edge && mouse.x > W - m) || keys.ArrowRight) G.freeX += sp; if ((edge && mouse.y < m) || keys.ArrowUp) G.freeZ -= sp; if ((edge && mouse.y > H - m) || keys.ArrowDown) G.freeZ += sp;
    G.freeX = clamp(G.freeX, -100, 100); G.freeZ = clamp(G.freeZ, -100, 100); tx = G.freeX; tz = G.freeZ;
  }
  const k = G.camSnap ? 1 : Math.min(1, dt * (G.state === 'menu' ? 1.2 : 7)); G.camSnap = false;
  G.camX += (tx - G.camX) * k; G.camZ += (tz - G.camZ) * k;
  const z = G.zoom, sh = G.shake * G.shake * 1.1 * GFX.shake;
  camera.position.set(G.camX + rand(-sh, sh), 38 * z + rand(-sh, sh) * 0.5, G.camZ + 25 * z + rand(-sh, sh));
  camera.lookAt(G.camX, 0, G.camZ - 1.5);
  sun.position.set(G.camX - 30, 62, G.camZ + 16); sun.target.position.set(G.camX, 0, G.camZ - 4); sun.target.updateMatrixWorld();
}
let nextDraw = 0, shadowN = 0;
function frame(now) {
  requestAnimationFrame(frame);
  // frame limit: no more frames than the setting allows (the menu and the pause box need no more than 30). Half an interval of slack keeps a 60 Hz screen at a full 60
  const cap = G.state !== 'play' || G.paused ? Math.min(GFX.fcap || 30, 30) : GFX.fcap;
  if (cap) { const iv = 1000 / cap; if (now < nextDraw - iv * 0.5) return; nextDraw = now - nextDraw > iv ? now + iv : nextDraw + iv; }
  const dt = Math.min(0.05, Math.max(0.001, (now - lastT) / 1000)); lastT = now;
  const play = G.state === 'play', run = play && !G.paused;
  let gdt = dt; if (G.hitstop > 0) { G.hitstop -= dt; gdt = dt * 0.06; }
  if (G.state === 'menu') { G.time += dt; UI.updatePreview(dt); }
  if (play) { const g = groundAt(mouse.x, mouse.y); G.mx = g.x; G.mz = g.z; }
  if (run) {
    if (mouse.rmb && G.aim < 0) { mouse.rmbT -= dt; if (mouse.rmbT <= 0) { mouse.rmbT = 0.12; const P = G.player; if (!(P.order && P.order.type === 'attack')) command(false); } }
    updateGame(gdt);
    if (G.over && !endShown && G.overT > 3.4) { endShown = true; UI.showEnd(); }
    if (G.time > 40 && !G.helpHid) { G.helpHid = true; $('help').hidden = true; }
  }
  const adt = play && G.paused ? 0 : gdt;
  if (play) animateUnits(adt);
  if (adt > 0) ambientFx(dt);   // drifting motes: fireflies on one side of the map, ash and embers on the other
  FX.update(adt); updateWorld(dt); updateCamera(dt); updateIndicators();
  if (finalPass && play) {
    const P = G.player, low = P.dead ? 0 : clamp(1 - P.hp / P.maxHp / 0.35, 0, 1) * (0.5 + 0.2 * Math.sin(now / 160)), hit = clamp(1 - (G.time - P.lastDamageT) / 0.35, 0, 1) * 0.35;
    finalPass.uniforms.uDmg.value = Math.max(low * 0.6, hit); finalPass.uniforms.uDead.value += ((P.dead && !G.over ? 1 : 0) - finalPass.uniforms.uDead.value) * Math.min(1, dt * 3);
  }
  if (finalPass) {
    const U = finalPass.uniforms, asp = W / H; U.uAsp.value = asp; U.uCA.value = G.ca || 0; U.uDim.value = play ? (G.dim || 0) : 0;
    // stopped time: the picture drains to a cold grey while it lasts, with one negative flash at the start
    const ts = G.tstop, on = play && ts && G.time < ts.until && dist(G.camX, G.camZ, ts.x, ts.z) < ts.r + 24 ? 1 : 0; U.uStop.value += (on - U.uStop.value) * Math.min(1, dt * 9); U.uInv.value = play ? (G.tinv || 0) : 0; U.uSand.value += ((play && G.player && G.player.sandyT > G.time ? 1 : 0) - U.uSand.value) * Math.min(1, dt * 8);   // sandevistan: the edges split into colours and the picture cools
    // air distortion: draw this frame's ripples and haze into their own buffer; the final pass bends the picture by it
    const wn = warpRT && FX.warps.length > 0; U.uWarp.value = wn ? 1 : 0;
    if (wn) { renderer.setRenderTarget(warpRT); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(FX.wscene, camera); renderer.setRenderTarget(null); }
  }
  if (typeof SCUT !== 'undefined') SCUT.apply(finalPass && finalPass.uniforms.uCut ? finalPass.uniforms.uCut.value : null, play);   // the world cut along lines (Setsuna's ultimate)
  if (G.tinv > 0) G.tinv = Math.max(0, G.tinv - dt * 4);
  // the camera's up vector decides how a sprite's lower half meets the ground (soft particles)
  FXU.uUp.value = camera.matrixWorld.elements[5];
  // shadows: the sun's shadow map is redrawn every other frame when the game runs above 50 frames a second (the eye does not see the difference), every frame otherwise
  if (sun.castShadow) renderer.shadowMap.needsUpdate = FPS.v < 50 || (++shadowN & 1) === 0;
  if (composer) composer.render(); else renderer.render(scene, camera);
  UI.update(dt);
  // frame counter, and one hint if the picture stutters for a while
  FPS.t += dt; FPS.n++;
  if (FPS.t >= 0.5) {
    FPS.v = FPS.n / FPS.t; FPS.t = 0; FPS.n = 0; if (GFX.fps) $('fps').textContent = Math.round(FPS.v) + ' к/с';
    if (play && !G.paused && FPS.v < 27) { if (++FPS.low >= 10 && !FPS.told && GFX.preset !== 'low') { FPS.told = true; UI.msg('Мало кадров в секунду: Esc → «Графика» → качество пониже'); UI.msgT = 5; } } else FPS.low = 0;
  }
}
if (window.THREE) boot(); else $('load').textContent = 'Не удалось загрузить 3D-движок';
