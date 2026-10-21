/* SAFE ZONES — pink rifts that lead to peaceful, walkable maps (from the Gard map design pack).
   - A pink rift sometimes opens near you during a run (or spawn one from the test panel).
   - Walk into it: the battle freezes and you arrive in a Safe Zone: no enemies, the title music plays,
     a healing spot, and a SHOP where you spend the run's PokéCoins.
   - Walk back into the exit portal to return to the battle exactly where you left it.
   Collision comes from a walkability mask made from the map art (trees, water, cliffs, buildings block you).
   Solo only (co-op keeps playing). */
(() => {
  'use strict';
  if (window.PS_SAFEZONE_INSTALLED) return; window.PS_SAFEZONE_INSTALLED = true;
  const B = () => window.PS_MEGA_BRIDGE_V5, E = () => window.PS_HOOPA_ENGINE;
  const TAU = Math.PI * 2;
  const S = 3.5;          // map art pixel -> world pixel (makes paths wide enough to walk)
  const CELL = 6;         // mask cell size in art pixels
  const ZONES = {
    'forest-shrine': { name: 'Forest Shrine', img: 'assets/safezones/forest-shrine.png', mask: 'assets/safezones/forest-shrine-mask.png',
      spawn: [630, 1120], exit: [630, 1185, 26], shop: [240, 372, 42], heal: [628, 690, 42] },
    'portal-shrine': { name: 'Portal Shrine', img: 'assets/safezones/portal-shrine.png', mask: 'assets/safezones/portal-shrine-mask.png',
      spawn: [627, 880], exit: [627, 627, 125], shop: [255, 610, 45], heal: null, exitIsCenter: true },
  };
  const SHOP_ITEMS = [
    { id: 'potion', name: 'Super Potion', desc: 'Heals 50% of your HP.', price: 30, icon: '🧪', buy: p => { p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.5); } },
    { id: 'revive', name: 'Max Revive', desc: '+1 heart (second chance) for this run.', price: 150, icon: '💖', buy: p => { p.lives = (Number(p.lives) || 0) + 1; } },
    { id: 'candy', name: 'Rare Candy', desc: 'Instantly gain a level.', price: 80, icon: '🍬', buy: p => { p.xp = Math.max(Number(p.xp) || 0, Number(p.xpNext) || 0); } },
    { id: 'reroll', name: 'Reroll Ticket', desc: '+2 rerolls on level-up rewards.', price: 40, icon: '🎟️', buy: p => { p.rerollBonus = (Number(p.rerollBonus) || 0) + 2; } },
  ];
  const ITEM_EN = { leftovers: 'Leftovers', choiceband: 'Choice Band', quickclaw: 'Quick Claw', focussash: 'Focus Sash', shellbell: 'Shell Bell', amuletcoin: 'Amulet Coin',
    shinycharm: 'Shiny Charm', luckyegg: 'Lucky Egg', lifeorb: 'Life Orb', choicescarf: 'Choice Scarf', rockyhelmet: 'Rocky Helmet', nevermeltice: 'Never-Melt Ice',
    flameorb: 'Flame Orb', toxicorb: 'Toxic Orb', scopelens: 'Scope Lens', sitrusberry: 'Sitrus Berry', kingsrock: "King's Rock", airballoon: 'Air Balloon',
    ejectbutton: 'Eject Button', assaultvest: 'Assault Vest', liechiberry: 'Liechi Berry', apicotberry: 'Apicot Berry', lansatberry: 'Lansat Berry' };
  const ITEM_DESC = { leftovers: 'Heal 3% HP per second.', choiceband: '+40% damage, but you can\'t switch moves.', quickclaw: '-20% cooldown on all moves.', focussash: 'Survive a KO hit once with 1 HP.',
    shellbell: 'Heal 1% of the damage you deal.', amuletcoin: '+50% PokéCoins.', shinycharm: 'Shiny Pokémon appear 3x more.', luckyegg: '+30% EXP.', lifeorb: '+30% damage, costs 1% HP per attack.',
    choicescarf: '+30% speed, -10% cooldown.', rockyhelmet: 'Melee attackers lose 20% HP.', nevermeltice: '30% chance to slow foes.', flameorb: '30% chance to burn foes.', toxicorb: '30% chance to poison foes.',
    scopelens: '+20% critical chance.', sitrusberry: 'Heal 25% when below 50% HP.', kingsrock: '20% chance to stun foes.', airballoon: 'Float over traps and enemy zones.',
    ejectbutton: 'Speed burst below 30% HP.', assaultvest: '+20% defense.', liechiberry: '+30% damage below 33% HP.', apicotberry: '+30% defense below 33% HP.', lansatberry: 'Each KO: tiny crit and damage boost.' };

  // ---------------- assets ----------------
  const cache = {};
  function loadZone(id) {
    const z = ZONES[id]; if (cache[id]) return cache[id];
    const c = { img: new Image(), maskImg: new Image(), mask: null, mw: 0, mh: 0, ready: false };
    c.img.src = z.img + '?v=1'; c.maskImg.src = z.mask + '?v=1';
    c.maskImg.onload = () => { const cv = document.createElement('canvas'); cv.width = c.mw = c.maskImg.width; cv.height = c.mh = c.maskImg.height;
      const x = cv.getContext('2d'); x.drawImage(c.maskImg, 0, 0); const d = x.getImageData(0, 0, cv.width, cv.height).data; c.mask = new Uint8Array(cv.width * cv.height);
      for (let i = 0; i < c.mask.length; i++) c.mask[i] = d[i * 4] > 127 ? 1 : 0; };
    cache[id] = c; return c;
  }
  const walk = (c, wx, wy) => { if (!c.mask) return true; const gx = Math.floor(wx / S / CELL), gy = Math.floor(wy / S / CELL); if (gx < 0 || gy < 0 || gx >= c.mw || gy >= c.mh) return false; return c.mask[gy * c.mw + gx] === 1; };
  function free(c, x, y, r) { for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; if (!walk(c, x + Math.cos(a) * r, y + Math.sin(a) * r)) return false; } return walk(c, x, y); }
  function nearestFree(c, x, y, r) { if (free(c, x, y, r)) return [x, y]; for (let d = 8; d < 600; d += 8) for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, nx = x + Math.cos(a) * d, ny = y + Math.sin(a) * d; if (free(c, nx, ny, r)) return [nx, ny]; } return [x, y]; }

  // ---------------- pink rifts in the battle world ----------------
  const rifts = [];   // {x,y,zone,t,life}
  let spawnT = 0;
  function spawnRift(zoneId, near) {
    const p = B()?.game?.player; if (!p) return null; zoneId = zoneId || (Math.random() < 0.5 ? 'forest-shrine' : 'portal-shrine'); loadZone(zoneId);
    let x = p.x, y = p.y;
    for (let i = 0; i < 30; i++) { const a = Math.random() * TAU, d = near ? 150 : 260 + Math.random() * 140; const nx = p.x + Math.cos(a) * d, ny = p.y + Math.sin(a) * d * 0.8;
      try { const W = B().world; if (W && (W.isWall(nx, ny) || (W.isLiquid && W.isLiquid(nx, ny)))) continue; } catch (_) {} x = nx; y = ny; break; }
    const r = { x, y, zone: zoneId, t: 0, life: 75 }; rifts.push(r);
    try { B().fx.ring(x, y, 10, 90, '#ff7ad0', 0.6, 6); B().fx.dmgText(p.x, p.y - (p.bodyH || 40) - 30, 'A pink rift opened!', '#ff8ad8'); } catch (_) {}
    return r;
  }
  function tickRifts(dt) {
    const g = B()?.game, p = g?.player; if (!p || g.state !== 'playing' || active) return;
    if (B()?.game && E()?.Coop?.active) return;
    // natural spawn: every ~4 minutes of play there's a 45% chance
    spawnT += dt; if (spawnT >= 240) { spawnT = 0; if (Math.random() < 0.45 && !rifts.length) spawnRift(); }
    for (let i = rifts.length - 1; i >= 0; i--) { const r = rifts[i]; r.t += dt; if (r.t >= r.life) { rifts.splice(i, 1); continue; }
      if (r.t > 0.8 && Math.hypot(p.x - r.x, p.y - r.y) < 30) { rifts.splice(i, 1); enter(r.zone, r); return; } }
  }
  // draw the rifts on their own small overlay (world -> screen with the game camera)
  const ov = document.createElement('canvas'); ov.id = 'ps-pinkrift'; ov.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;z-index:19';
  function gameCanvas() { let best = null, area = 0; for (const c of document.querySelectorAll('canvas')) { if (c === ov || c.id === 'ps-sz' || c.id === 'ps-minimap') continue; const r = c.getBoundingClientRect(), a = r.width * r.height; if (a > area) { area = a; best = { c, r }; } } return best; }
  function drawRifts() {
    const ctx = ov.getContext('2d'), dpr = Math.min(2, devicePixelRatio || 1), W = innerWidth, H = innerHeight;
    if (ov.width !== Math.round(W * dpr)) { ov.width = Math.round(W * dpr); ov.height = Math.round(H * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    if (!rifts.length || active || B()?.game?.state === 'ui') return;
    const cam = B()?.camera, g = gameCanvas(); if (!cam || !g || typeof cam.left !== 'function') return;
    const css = Number(cam._cw) > 0 ? g.r.width / cam._cw : 1, k = cam.scale * css, now = performance.now() / 1000;
    for (const r of rifts) {
      const X = g.r.left + (r.x - cam.left()) * k, Y = g.r.top + (r.y - cam.top()) * k - 30 * k, open = Math.min(1, r.t / 0.6), fade = Math.min(1, (r.life - r.t) / 1.5), R = 30 * k * open;
      ctx.save(); ctx.globalAlpha = fade;
      // ground glow
      let gr = ctx.createRadialGradient(X, Y + 30 * k, 0, X, Y + 30 * k, 60 * k); gr.addColorStop(0, 'rgba(255,120,210,.45)'); gr.addColorStop(1, 'rgba(255,120,210,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(X, Y + 30 * k, 60 * k, 22 * k, 0, 0, TAU); ctx.fill();
      // portal body
      ctx.translate(X, Y); ctx.scale(1, 1.25);
      gr = ctx.createRadialGradient(0, 0, 2, 0, 0, R); gr.addColorStop(0, '#fff0fb'); gr.addColorStop(0.35, '#ff9ee0'); gr.addColorStop(0.8, '#e0409e'); gr.addColorStop(1, '#8a1a6a'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = 'lighter'; ctx.lineWidth = Math.max(2, 3 * k);
      for (let i = 0; i < 4; i++) { const a0 = now * (2 + i * 0.5) + i * 1.6; ctx.strokeStyle = i % 2 ? 'rgba(255,255,255,.8)' : 'rgba(255,170,230,.9)'; ctx.beginPath(); ctx.arc(0, 0, R * (0.45 + i * 0.15), a0, a0 + 2.2); ctx.stroke(); }
      ctx.strokeStyle = '#ffd6f2'; ctx.lineWidth = Math.max(2, 4 * k); ctx.beginPath(); ctx.arc(0, 0, R * 1.02, 0, TAU); ctx.stroke();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#7a1458'; ctx.lineWidth = 3; ctx.font = '800 ' + Math.round(11 * Math.max(1, k * 0.8)) + 'px system-ui,sans-serif'; ctx.textAlign = 'center';
      const label = 'SAFE ZONE · ' + Math.ceil(r.life - r.t) + 's'; ctx.strokeText(label, X, Y - R * 1.4 - 6); ctx.fillText(label, X, Y - R * 1.4 - 6);
      ctx.restore();
    }
  }

  // ---------------- the Safe Zone scene ----------------
  let active = null;   // {id,z,c,x,y,face,walk,t,shopOpen,items,leaving}
  const cv = document.createElement('canvas'); cv.id = 'ps-sz'; cv.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:55;display:none;background:#0b1410;touch-action:none';
  const fade = document.createElement('div'); fade.style.cssText = 'position:fixed;inset:0;z-index:66;pointer-events:none;background:radial-gradient(circle,#ffd6f2,#ff5ab4);opacity:0;transition:opacity .35s';
  const keys = {};
  function flash(cb) { fade.style.opacity = '1'; setTimeout(() => { try { cb(); } catch (e) { console.warn('[safezone]', e); } setTimeout(() => { fade.style.opacity = '0'; }, 120); }, 360); }
  function enter(id, rift) {
    const g = B()?.game, p = g?.player; if (!p || active || (E()?.Coop?.active)) return false;
    const z = ZONES[id], c = loadZone(id);
    flash(() => {
      try { g.soloHold(true); } catch (_) {}
      active = { id, z, c, x: z.spawn[0] * S, y: z.spawn[1] * S, face: -Math.PI / 2, walk: false, t: 0, shopOpen: false, items: rollItems(), rift };
      if (c.mask) { const f = nearestFree(c, active.x, active.y, 14); active.x = f[0]; active.y = f[1]; }
      cv.style.display = 'block'; window.PS_SAFEZONE.active = true; renderHud();
    });
    return true;
  }
  function leave() {
    if (!active || active.leaving) return; active.leaving = true;
    flash(() => {
      const g = B()?.game, p = g?.player; cv.style.display = 'none'; closeShop(); active = null; window.PS_SAFEZONE.active = false; hud.style.display = 'none';
      try { g.soloHold(false); } catch (_) {}
      if (p) p.invuln = Math.max(Number(p.invuln) || 0, 2);
    });
  }
  function rollItems() { const L = (E()?.Items?.LIST || []).filter(i => ITEM_EN[i.id] && i.id !== 'shinycharm'); const out = []; while (out.length < 3 && L.length) out.push(L.splice(Math.floor(Math.random() * L.length), 1)[0].id); return out; }
  function updateScene(dt) {
    const a = active; if (!a) return; a.t += dt; const c = a.c, p = B()?.game?.player;
    if (!a.shopOpen) {
      let dx = (keys.ArrowRight || keys.d || keys.D ? 1 : 0) - (keys.ArrowLeft || keys.a || keys.A ? 1 : 0), dy = (keys.ArrowDown || keys.s || keys.S ? 1 : 0) - (keys.ArrowUp || keys.w || keys.W ? 1 : 0);
      if (touch.on) { dx = touch.dx; dy = touch.dy; }
      const L = Math.hypot(dx, dy); a.walk = L > 0.1;
      if (a.walk) { dx /= Math.max(1, L); dy /= Math.max(1, L); a.face = Math.atan2(dy, dx); const sp = 240 * dt, r = 14;
        const nx = a.x + dx * sp, ny = a.y + dy * sp;
        if (free(c, nx, ny, r)) { a.x = nx; a.y = ny; } else if (free(c, nx, a.y, r)) a.x = nx; else if (free(c, a.x, ny, r)) a.y = ny; }
    } else a.walk = false;
    const z = a.z, near = (pt) => pt && Math.hypot(a.x / S - pt[0], a.y / S - pt[1]) < pt[2];   // radii are in map-art pixels
    a.nearShop = near(z.shop); a.nearExit = near(z.exit);
    if (a.nearExit && !z.exitIsCenter && a.t > 1) leave();
    if (z.heal && near(z.heal) && p && p.hp < p.maxHp) { p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.12 * dt); a.healing = true; } else a.healing = false;
  }
  function drawScene() {
    const a = active; if (!a) return; const ctx = cv.getContext('2d'), dpr = Math.min(2, devicePixelRatio || 1), W = innerWidth, H = innerHeight;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = '#0b1410'; ctx.fillRect(0, 0, W, H);
    const c = a.c, mapW = (c.img.naturalWidth || 1254) * S, mapH = (c.img.naturalHeight || 1254) * S;
    const camX = Math.max(W / 2, Math.min(mapW - W / 2, a.x)), camY = Math.max(H / 2, Math.min(mapH - H / 2, a.y)), ox = W / 2 - camX, oy = H / 2 - camY;
    ctx.imageSmoothingEnabled = false; if (c.img.complete && c.img.naturalWidth) ctx.drawImage(c.img, ox, oy, mapW, mapH);
    const z = a.z, now = performance.now() / 1000, sx = x => ox + x * S, sy = y => oy + y * S;
    // healing circle
    if (z.heal) { const X = sx(z.heal[0]), Y = sy(z.heal[1]), R = z.heal[2] * S; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(140,255,200,' + (0.35 + 0.25 * Math.sin(now * 3)) + ')'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(X, Y, R, R * 0.6, 0, 0, TAU); ctx.stroke(); if (a.healing) { for (let i = 0; i < 6; i++) { const ph = (now * 0.8 + i / 6) % 1; ctx.fillStyle = 'rgba(160,255,200,' + (1 - ph) + ')'; ctx.fillText('+', X + Math.cos(i * 1.7) * R * 0.6, Y - ph * 60); } } ctx.restore(); }
    // exit portal
    { const X = sx(z.exit[0]), Y = sy(z.exit[1]) - (z.exitIsCenter ? 0 : 30), R = (z.exitIsCenter ? 70 : 40) * Math.min(1.2, S / 3); ctx.save(); ctx.translate(X, Y); ctx.scale(1, z.exitIsCenter ? 0.75 : 1.25);
      const gr = ctx.createRadialGradient(0, 0, 2, 0, 0, R); gr.addColorStop(0, '#fff0fb'); gr.addColorStop(0.4, '#ff9ee0'); gr.addColorStop(0.85, '#e0409e'); gr.addColorStop(1, 'rgba(138,26,106,.0)'); ctx.globalAlpha = 0.9; ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = 'lighter'; ctx.lineWidth = 3; for (let i = 0; i < 4; i++) { const a0 = now * (2 + i * 0.5) + i; ctx.strokeStyle = i % 2 ? 'rgba(255,255,255,.8)' : 'rgba(255,170,230,.9)'; ctx.beginPath(); ctx.arc(0, 0, R * (0.4 + i * 0.15), a0, a0 + 2.2); ctx.stroke(); } ctx.restore();
      label(ctx, X, Y - R - 14, z.exitIsCenter && a.nearExit ? 'Press E to return to battle' : 'EXIT', a.nearExit); }
    // shop
    if (z.shop) { const X = sx(z.shop[0]), Y = sy(z.shop[1]); if (z.exitIsCenter) drawStall(ctx, X, Y, now); label(ctx, X, Y - (z.exitIsCenter ? 70 : 40), a.nearShop ? 'Press E to shop' : '🛒 SHOP', a.nearShop); }
    // the player's Pokemon
    const p = B()?.game?.player, key = (p && p.anim && p.anim.dex) || (p && String(p.dex)) || '25', sc = 2 * (Number(p?.anim?.scale) || 1) * 1.45;
    const PX = sx(0) + a.x, PY = sy(0) + a.y;
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(PX, PY, 16, 6, 0, 0, TAU); ctx.fill();
    if (!(window.PS_FX && window.PS_FX.sprite && window.PS_FX.sprite(ctx, key, a.walk ? 'Walk' : 'Idle', a.face, a.t, PX, PY, sc, 1))) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(PX, PY - 16, 12, 0, TAU); ctx.fill(); }
  }
  function label(ctx, x, y, text, hi) { ctx.save(); ctx.font = '800 13px system-ui,sans-serif'; ctx.textAlign = 'center'; const w = ctx.measureText(text).width + 16; ctx.fillStyle = hi ? 'rgba(255,90,180,.92)' : 'rgba(20,16,44,.78)'; roundRect(ctx, x - w / 2, y - 12, w, 22, 8); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillText(text, x, y + 4); ctx.restore(); }
  function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function drawStall(ctx, X, Y, now) {   // a little market stall with a striped awning
    ctx.save(); ctx.translate(X, Y); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(0, 18, 62, 14, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#8a5a2b'; ctx.fillRect(-56, -10, 112, 30); ctx.fillStyle = '#b07a3e'; ctx.fillRect(-56, -10, 112, 8);
    ctx.fillStyle = '#6b4220'; ctx.fillRect(-52, -58, 6, 50); ctx.fillRect(46, -58, 6, 50);
    for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? '#ffffff' : '#ff5aa8'; ctx.beginPath(); ctx.moveTo(-60 + i * 15, -62); ctx.lineTo(-45 + i * 15, -62); ctx.lineTo(-45 + i * 15, -44); ctx.quadraticCurveTo(-52.5 + i * 15, -38, -60 + i * 15, -44); ctx.fill(); }
    ctx.fillStyle = '#3b82f6'; ctx.beginPath(); ctx.arc(-26, -18, 7, 0, TAU); ctx.fill(); ctx.fillStyle = '#ff7aa8'; ctx.fillRect(-6, -26, 12, 14); ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(24, -18, 7, 0, TAU); ctx.fill();
    ctx.restore();
  }

  // ---------------- input ----------------
  addEventListener('keydown', e => {
    if (!active) return; keys[e.key] = true;
    if ((e.key === 'e' || e.key === 'E' || e.key === 'Enter' || e.key === ' ') && !e.repeat) { if (active.shopOpen) {} else if (active.nearShop) openShop(); else if (active.nearExit) leave(); }
    if (e.key === 'Escape') { if (active.shopOpen) closeShop(); }
    e.stopImmediatePropagation(); e.preventDefault();
  }, true);
  addEventListener('keyup', e => { if (!active) return; keys[e.key] = false; e.stopImmediatePropagation(); }, true);
  const touch = { on: false, x0: 0, y0: 0, dx: 0, dy: 0 };
  cv.addEventListener('pointerdown', e => { if (!active) return; const near = active.nearShop || active.nearExit; if (near && e.pointerType !== 'mouse') { if (active.nearShop) openShop(); else leave(); return; } touch.on = true; touch.x0 = e.clientX; touch.y0 = e.clientY; touch.dx = touch.dy = 0; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e => { if (!touch.on) return; const dx = e.clientX - touch.x0, dy = e.clientY - touch.y0, L = Math.hypot(dx, dy); touch.dx = L > 8 ? dx / Math.max(40, L) : 0; touch.dy = L > 8 ? dy / Math.max(40, L) : 0; });
  cv.addEventListener('pointerup', () => { touch.on = false; touch.dx = touch.dy = 0; });

  // ---------------- HUD + shop ----------------
  const css = document.createElement('style');
  css.textContent = `
  #ps-sz-hud{position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:58;display:none;align-items:center;gap:12px;padding:8px 16px;border-radius:12px;border:3px solid #3b3f5c;background:linear-gradient(#fff,#f6eefb);color:#33354a;font:800 15px Pixelify,Fredoka,system-ui,sans-serif;box-shadow:0 6px 0 rgba(0,0,0,.2)}
  #ps-sz-hud .t{color:#e0409e}#ps-sz-hud .hint{font-size:12px;color:#7a7c90;font-weight:700}
  #ps-shop{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:62;display:none;width:min(560px,calc(100vw - 24px));max-height:calc(100vh - 40px);overflow:auto;padding:16px;border-radius:16px;border:4px solid #3b3f5c;background:linear-gradient(#ffffff,#f3f1fb);color:#33354a;font:700 14px system-ui,sans-serif;box-shadow:inset 0 0 0 3px #c9d3ff,0 10px 40px rgba(0,0,0,.5)}
  #ps-shop h3{margin:0 0 4px;font:800 22px Pixelify,Fredoka,system-ui,sans-serif;color:#e0409e}#ps-shop .coins{float:right;color:#b8860b}
  #ps-shop .row{display:flex;align-items:center;gap:10px;padding:8px;border-radius:10px;margin:6px 0;background:rgba(201,211,255,.25)}
  #ps-shop .ic{font-size:24px;width:32px;text-align:center}#ps-shop .nm{flex:1}#ps-shop .nm small{display:block;color:#6b6d80;font-weight:600}
  #ps-shop button{font:800 13px system-ui,sans-serif;padding:6px 12px;border-radius:8px;border:2px solid #3b3f5c;background:#ff6fb5;color:#fff;cursor:pointer}
  #ps-shop button:disabled{background:#c7c7d3;cursor:default}#ps-shop .close{background:#3b3f5c;margin-top:8px;width:100%}
  #ps-sz-test{position:fixed;left:50%;top:8px;transform:translateX(-50%);z-index:57;display:none;gap:6px;padding:6px 8px;border-radius:10px;border:2px dashed #ff7ad0;background:rgba(30,10,30,.85);color:#fff;font:700 11px system-ui,sans-serif}
  #ps-sz-test button{font:700 11px system-ui,sans-serif;padding:4px 8px;border-radius:6px;border:1px solid #ff9ad8;background:#5a1a48;color:#fff;cursor:pointer}`;
  const hud = document.createElement('div'); hud.id = 'ps-sz-hud';
  const shop = document.createElement('div'); shop.id = 'ps-shop';
  const test = document.createElement('div'); test.id = 'ps-sz-test';
  test.innerHTML = '<span>🧪 TEST</span><button data-z="forest-shrine">Pink rift: Forest Shrine</button><button data-z="portal-shrine">Pink rift: Portal Shrine</button><button data-c="1">+500 coins</button>';
  [hud, shop, test].forEach(el => ['pointerdown', 'mousedown', 'touchstart', 'click', 'keydown'].forEach(ev => el.addEventListener(ev, e => e.stopPropagation())));
  test.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.z) spawnRift(b.dataset.z, true); if (b.dataset.c) { const p = B()?.game?.player; if (p) p.coins = (Number(p.coins) || 0) + 500; } });
  function renderHud() { if (!active) { hud.style.display = 'none'; return; } const p = B()?.game?.player; hud.style.display = 'flex';
    hud.innerHTML = '<span class="t">🌸 ' + active.z.name + '</span><span>Safe Zone</span><span>🪙 ' + Math.floor(Number(p?.coins) || 0) + '</span><span>❤ ' + Math.ceil(p?.hp || 0) + '/' + Math.round(p?.maxHp || 0) + '</span><span class="hint">WASD to walk · E to interact</span>'; }
  function openShop() { if (!active) return; active.shopOpen = true; renderShop(); shop.style.display = 'block'; }
  function closeShop() { if (active) active.shopOpen = false; shop.style.display = 'none'; }
  function renderShop() {
    const p = B()?.game?.player, coins = Math.floor(Number(p?.coins) || 0), I = E()?.Items;
    let h = '<h3>Poké Shop <span class="coins">🪙 ' + coins + '</span></h3><div style="color:#6b6d80;font-weight:600;margin-bottom:6px">Spend the PokéCoins you collected this run.</div>';
    for (const it of SHOP_ITEMS) h += '<div class="row"><span class="ic">' + it.icon + '</span><span class="nm">' + it.name + '<small>' + it.desc + '</small></span><button data-buy="' + it.id + '" ' + (coins < it.price ? 'disabled' : '') + '>' + it.price + ' 🪙</button></div>';
    h += '<div style="margin:10px 0 2px;font-weight:800">Held items <small style="color:#6b6d80;font-weight:600">(replaces the one you hold' + (p?.item ? ': ' + (ITEM_EN[p.item] || p.item) : '') + ')</small></div>';
    for (const id of active.items) { const owned = p && p.item === id; h += '<div class="row"><span class="ic">🎒</span><span class="nm">' + (ITEM_EN[id] || id) + '<small>' + (ITEM_DESC[id] || '') + '</small></span><button data-item="' + id + '" ' + (coins < 90 || owned ? 'disabled' : '') + '>' + (owned ? 'Held' : '90 🪙') + '</button></div>'; }
    h += '<button class="close">Close (Esc)</button>'; shop.innerHTML = h;
  }
  shop.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return; const p = B()?.game?.player; if (!p) return;
    if (b.classList.contains('close')) return closeShop();
    const it = SHOP_ITEMS.find(x => x.id === b.dataset.buy);
    if (it && (Number(p.coins) || 0) >= it.price) { p.coins -= it.price; it.buy(p); try { B().audio?.sfx?.('buy'); } catch (_) {} }
    if (b.dataset.item && (Number(p.coins) || 0) >= 90 && typeof p.equip === 'function') { p.coins -= 90; p.equip(b.dataset.item); try { B().audio?.sfx?.('buy'); } catch (_) {} }
    renderShop(); renderHud();
  });

  // ---------------- loop ----------------
  let last = performance.now(), hudT = 0;
  function loop(now) {
    requestAnimationFrame(loop); const dt = Math.min(0.1, (now - last) / 1000); last = now;
    try { if (active) { updateScene(dt); drawScene(); hudT += dt; if (hudT > 0.25) { hudT = 0; renderHud(); } } else { tickRifts(dt); } drawRifts(); } catch (e) { console.warn('[safezone]', e); }
    const isMe = String(B()?.user || '').trim().toLowerCase() === 'lovergare';
    test.style.display = isMe && B()?.game?.state === 'playing' && !active ? 'flex' : 'none';
    if (!active && B()?.game?.state !== 'playing' && B()?.game?.state !== 'choice' && rifts.length && B()?.game?.state === 'ui') rifts.length = 0;
  }
  function init() { document.head.append(css); document.body.append(ov, cv, hud, shop, test, fade); requestAnimationFrame(loop); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
  window.PS_SAFEZONE = { active: false, spawnRift, enter, leave, zones: ZONES, tp(ax, ay) { if (active) { const f = nearestFree(active.c, ax * S, ay * S, 14); active.x = f[0]; active.y = f[1]; } }, get rifts() { return rifts.slice(); }, get state() { return active && { id: active.id, x: active.x, y: active.y, nearShop: active.nearShop, nearExit: active.nearExit }; } };
})();
