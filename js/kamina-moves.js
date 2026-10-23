/* KAMINA'S MOVES — Kamina's (Excadrill's) own Gurren Lagann moves (see js/digger-bros.js for Kamina & Simon).
   Level-up moves, offered only to Kamina (one is guaranteed at levels 3, 6 and 9 until learned). Each one roars its
   name above him in burning red kanji:
   - GURREN BOOMERANG (グレンブーメラン！！！): a giant pair of black, red-edged Kamina shades blazes out in a straight
     line with a trail of afterimages and embers, cutting everything, then boomerangs back.
   - SUPER BLAZING KICK (スーパー・ブレイジング・キック！！！): Kamina bursts into flames and dives like a comet. On the
     kick the whole game pauses on a manga impact frame... then CRACK!!! A fiery explosion sends the enemy flying
     backwards as a fireball; everything it crashes into blows up (both are hurt).
   - SUPER BOWLING BALL ATTACK (スーパー・ボウリングボール・アタック！！！): Kamina grabs Simon, spins him up overhead
     and bowls him through a chain of enemies in a green spiral, while the poor kid cries. STRIKE! With no Simon
     around he bowls a boulder.
   And his Z-move, from the very first second of the run:
   - GIGA DRILL BREAK: "FINISHING MOVE!!!" — a full cinematic. The shades fly at the strongest enemy on screen, split
     in two and slice it in a tornado of cuts, then clamp it in place. "GIGA..." a small drill forms on his raised
     hand as spiral energy pours in; "DRILL!!!" it erupts into a colossal drill that reaches the sky; "BREEEAAAAKKKK
     AAAHHHHH!!!" he rockets through the enemy with a gigantic yellow-and-blue trail. The target (and anything in
     the drill's path) dies instantly, a spiral blast hits everything on screen, the sky fills with rainbow
     fireworks, then a rainbow K.O. It is a suicide move: Kamina falls afterwards. (With Simon out, Kamina's last
     words play and you go on as Simon.) Press the Z-move button twice (the first press asks to confirm).
   Solo: the kick's impact frame and the Giga Drill Break cinematic freeze the battle. Co-op: nothing freezes. */
(() => {
  'use strict';
  if (window.PS_KAMINA_INSTALLED) return; window.PS_KAMINA_INSTALLED = true;
  const E = () => window.PS_HOOPA_ENGINE, B = () => window.PS_MEGA_BRIDGE_V5, TAU = Math.PI * 2;
  const EXCA = 530, DRIL = 529;
  const CFG = { forceAt: [3, 6, 9], kickFreeze: 0.34, flyTime: 0.7, flySpeed: 640, confirm: 2.5, gigaW: 400, gigaH: 210, blast: 60 };
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const sfx = n => { try { E().Audio.sfx(n); } catch (_) {} };
  const txt = (x, y, t, c) => { try { E().FX.dmgText(x, y, t, c || '#fff'); } catch (_) {} };
  const kick = n => { try { B().camera?.kick?.(n); } catch (_) {} };
  const T = () => window.PS_LAKE_TALK, K = () => window.PS_LAKE?.kit;
  const line = (dex, face, text, em, o) => { try { return T().line(dex, face, text, em, Object.assign({ prio: true }, o)); } catch (_) { return false; } };
  const alive = () => E().EnemyMgr.all().filter(e => e && !e.dead);
  const solo = () => !(E().Coop && E().Coop.active);
  const pick = L => L[Math.floor(Math.random() * L.length)];
  const rnd = (a, b) => a + Math.random() * (b - a);

  // ================= the moves =================
  const MOVES = [
    { id: 'gurren-boomerang', name: 'Gurren Boomerang', type: 'steel', kind: 'boomerang', psCast: 'gurren-boomerang', cd: 2.4, dmg: 30, speed: 560, radius: 330, size: 40, count: 1, knock: 80, maxLvl: 5,
      kanji: 'グレンブーメラン！！！', desc: 'Hurls a giant pair of black Kamina shades in a blazing straight line; they boomerang back, cutting both ways.',
      ups: [{ t: '+45% damage', m: { dmg: 1.45 } }, { t: '+30% range', m: { radius: 1.3 } }, { t: '+1 pair of shades', m: { count: 1 } }, { t: 'Max: +60% damage, bigger shades', m: { dmg: 1.6, size: 1.35 } }] },
    { id: 'super-blazing-kick', name: 'Super Blazing Kick', type: 'fire', kind: 'dash', psCast: 'super-blazing-kick', cd: 4.5, dmg: 70, radius: 240, width: 40, knock: 0, maxLvl: 5,
      kanji: 'スーパー・ブレイジング・キック！！！', desc: 'Man on fire! Dives forward like a fiery comet. Time stops on the kick... CRACK!!! The enemy flies back as a fireball and blows up whatever it hits.',
      ups: [{ t: '+40% damage', m: { dmg: 1.4 } }, { t: '+30% dive distance', m: { radius: 1.3 } }, { t: '-25% cooldown', m: { cd: 0.75 } }, { t: 'Max: +60% damage, enemies fly farther', m: { dmg: 1.6, fly: 1.5 } }] },
    { id: 'super-bowling-ball', name: 'Super Bowling Ball Attack', type: 'ground', kind: 'dash', psCast: 'super-bowling-ball', cd: 6, dmg: 44, radius: 280, count: 4, knock: 120, maxLvl: 5,
      kanji: 'スーパー・ボウリングボール・アタック！！！', desc: 'Grabs Simon and bowls him through a chain of enemies (he cries the whole way). STRIKE! No Simon? A boulder.',
      ups: [{ t: '+2 chained enemies', m: { count: 2 } }, { t: '+45% damage', m: { dmg: 1.45 } }, { t: '-25% cooldown', m: { cd: 0.75 } }, { t: 'Max: +3 chained, +50% damage', m: { count: 3, dmg: 1.5 } }] }];
  const IDS = MOVES.map(m => m.id), BY = Object.fromEntries(MOVES.map(m => [m.id, m]));
  let registered = false, poolHooked = false;
  function register() {
    const M = E()?.Moves; if (!M || !M.BY_ID || !Array.isArray(M.ALL)) return;
    if (!registered) { registered = true; for (const d of MOVES) if (!M.BY_ID[d.id]) { M.ALL.push(d); M.BY_ID[d.id] = d; } }
    if (!poolHooked && typeof M.poolFor === 'function') { poolHooked = true; const orig = M.poolFor;
      const f = function (mon) { let r = (orig.apply(this, arguments) || []).filter(id => !IDS.includes(id)); if (Number(mon && mon.dex) !== EXCA) return r;
        const p = E().Game.player, un = IDS.filter(id => !(p && typeof p.hasMove === 'function' && p.hasMove(id)));
        if (p && Number(p.dex) === EXCA && un.length && CFG.forceAt.includes(Number(p.level))) return [un[0], ...r.slice(0, 1)];   // a short pool: the card reliably shows up
        return [...r, ...un]; };
      f.__lake = orig.__lake; M.poolFor = f; }
  }
  let lastHit = null;
  function strike(p, e, dmg, color, dx, dy, knock, move) {
    const h = lastHit || window.__psHit;
    try { if (typeof h === 'function') { h(p, e, dmg, color, dx, dy, knock, move); return; } } catch (_) {}
    try { e.hurt(dmg, color, dx, dy, knock); E().Stats.dmg(p, move && move.id || 'drill', dmg); } catch (_) {}
  }
  const atkOf = p => Number(p.atk) || 1;

  // ================= world particles (embers, flames, sparks, shockwave rings, dust) =================
  const parts = [];
  function puff(o) { parts.push(Object.assign({ t: 0, life: 0.5, vx: 0, vy: 0, g: 0, size: 4, kind: 'dot', c: '255,180,60' }, o)); if (parts.length > 900) parts.splice(0, parts.length - 900); }
  function flames(x, y, n, spread, c) { for (let i = 0; i < n; i++) puff({ x: x + rnd(-spread, spread), y: y + rnd(-spread, spread) * 0.6, vx: rnd(-40, 40), vy: rnd(-120, -30), life: rnd(0.25, 0.55), size: rnd(6, 13), kind: 'flame', c }); }
  function sparks(x, y, n, sp, c) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = rnd(sp * 0.4, sp); puff({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rnd(0.2, 0.45), size: rnd(6, 14), kind: 'spark', c }); } }
  const ring = (x, y, r0, grow, c, life, w) => puff({ x, y, size: r0, grow, life: life || 0.4, kind: 'ring', c, w: w || 3 });
  function updateParts(dt) { for (const q of parts) { q.t += dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += q.g * dt; } for (let i = parts.length - 1; i >= 0; i--) if (parts[i].t >= parts[i].life) parts.splice(i, 1); }
  function drawParts(ctx, list) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const q of list) { const u = q.t / q.life, a = Math.max(0, 1 - u);
      if (q.kind === 'flame') { const r = q.size * (1 - u * 0.5), gr = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, r); gr.addColorStop(0, `rgba(255,250,200,${a})`); gr.addColorStop(0.4, `rgba(${q.c || '255,140,30'},${a * 0.8})`); gr.addColorStop(1, 'rgba(200,20,0,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(q.x, q.y, r, 0, TAU); ctx.fill(); }
      else if (q.kind === 'spark') { const L = q.size * a, m = Math.hypot(q.vx, q.vy) || 1; ctx.strokeStyle = `rgba(${q.c},${a})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q.x - q.vx / m * L, q.y - q.vy / m * L); ctx.stroke(); }
      else if (q.kind === 'ring') { ctx.strokeStyle = `rgba(${q.c},${a})`; ctx.lineWidth = (q.w || 3) * a + 0.5; ctx.beginPath(); ctx.ellipse(q.x, q.y, q.size + q.grow * u, (q.size + q.grow * u) * 0.55, 0, 0, TAU); ctx.stroke(); }
      else if (q.kind === 'dust') { ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = `rgba(${q.c},${a * 0.6})`; ctx.beginPath(); ctx.arc(q.x, q.y, q.size * (0.6 + u), 0, TAU); ctx.fill(); ctx.globalCompositeOperation = 'lighter'; }
      else { ctx.fillStyle = `rgba(${q.c},${a})`; ctx.beginPath(); ctx.arc(q.x, q.y, q.size * (1 - u * 0.6), 0, TAU); ctx.fill(); } }
    ctx.restore(); }

  // ================= burning kanji over Kamina's head =================
  const kanji = [];
  function shout(p, text) { kanji.push({ p, text, t: 0, life: 1.5 }); if (kanji.length > 3) kanji.shift(); }
  function drawKanji(ctx, dt) {
    const now = performance.now() / 1000;
    for (let i = kanji.length - 1; i >= 0; i--) { const k = kanji[i]; k.t += dt; if (k.t > k.life || k.p.dead) { kanji.splice(i, 1); continue; }
      const row = kanji.filter((o, j) => j > i && o.p === k.p).length, p = k.p, u = k.t / k.life, pop = k.t < 0.12 ? 1.8 - k.t / 0.12 * 0.8 : 1;
      const y = p.y - (p.bodyH || 50) - 34 - u * 12 - row * 28, sz = Math.round(22 * pop), jx = (Math.random() - 0.5) * 2.2, jy = (Math.random() - 0.5) * 2.2;
      ctx.save(); ctx.globalAlpha = u > 0.8 ? (1 - u) / 0.2 : 1; ctx.font = `900 ${sz}px "Noto Sans JP","Yu Gothic","Hiragino Sans","Meiryo",sans-serif`; ctx.textAlign = 'center';
      ctx.shadowColor = '#ff3a00'; ctx.shadowBlur = 14; ctx.lineWidth = 6; ctx.strokeStyle = '#1a0000'; ctx.strokeText(k.text, p.x + jx, y + jy); ctx.shadowBlur = 0;
      const gr = ctx.createLinearGradient(0, y - sz, 0, y); gr.addColorStop(0, '#fff3a0'); gr.addColorStop(0.35, '#ff8a1a'); gr.addColorStop(0.7, '#ff2a00'); gr.addColorStop(1, '#9a0000'); ctx.fillStyle = gr; ctx.fillText(k.text, p.x + jx, y + jy);
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= 0.3 + 0.25 * Math.sin(now * 32); ctx.fillStyle = '#ff6a1a'; ctx.fillText(k.text, p.x, y - 1); ctx.restore();
      if (Math.random() < 0.7) { const w = ctx.measureText ? sz * k.text.length * 0.42 : 120; puff({ x: p.x + rnd(-w, w), y: y - sz * 0.4, vx: rnd(-10, 10), vy: rnd(-70, -30), life: rnd(0.25, 0.5), size: rnd(3, 7), kind: 'flame' }); } }
  }

  // ---- GURREN BOOMERANG ----
  const rangs = [];
  function castBoomerang(p, d) {
    const tg = p.target && !p.target.dead ? p.target : alive().sort((a, b) => dist(a, p) - dist(b, p))[0];
    const base = tg ? Math.atan2(tg.y - p.y, tg.x - p.x) : (Number(p.aim) || 0), n = Math.max(1, d.count | 0);
    for (let i = 0; i < n; i++) { const a = base + (n === 1 ? 0 : (i / (n - 1) - 0.5) * 0.55);
      rangs.push({ p, d, x: p.x, y: p.y - 18, a, vx: Math.cos(a), vy: Math.sin(a), out: true, went: 0, spin: 0, hits: new Map(), life: 6, ghosts: [] }); }
    shout(p, d.kanji || BY['gurren-boomerang'].kanji); sfx('click'); ring(p.x, p.y - 18, 10, 70, '255,90,40', 0.35, 4); flames(p.x, p.y - 20, 8, 14);
  }
  function updateRangs(dt) {
    for (let i = rangs.length - 1; i >= 0; i--) { const r = rangs[i], d = r.d, sp = (d.speed || 560) * (r.out ? 1 : 1.15);
      r.spin += dt * 18; r.life -= dt; r.ghosts.unshift({ x: r.x, y: r.y, spin: r.spin }); if (r.ghosts.length > 6) r.ghosts.pop();
      if (r.out) { r.x += r.vx * sp * dt; r.y += r.vy * sp * dt; r.went += sp * dt; if (r.went >= (d.radius || 330)) { r.out = false; ring(r.x, r.y, 6, 50, '255,120,60', 0.3, 3); } }
      else { const tx = r.p.x, ty = r.p.y - 18, dd = Math.hypot(tx - r.x, ty - r.y); if (dd < 24 || r.life <= 0 || r.p.dead) { sparks(r.x, r.y, 6, 160, '255,160,80'); rangs.splice(i, 1); continue; } r.x += (tx - r.x) / dd * sp * dt; r.y += (ty - r.y) / dd * sp * dt; }
      if (Math.random() < dt * 30) puff({ x: r.x + rnd(-10, 10), y: r.y + rnd(-6, 6), vx: rnd(-30, 30), vy: rnd(-50, -10), life: rnd(0.2, 0.4), size: rnd(5, 10), kind: 'flame' });
      const R = (d.size || 40); for (const e of alive()) { if (Math.hypot(e.x - r.x, (e.y - 12) - r.y) > R + (e.r || 12)) continue; const last = r.hits.get(e) || -9; if (performance.now() / 1000 - last < 0.3) continue;
        r.hits.set(e, performance.now() / 1000); strike(r.p, e, d.dmg * atkOf(r.p), '#2a2a2a', e.x - r.x, e.y - r.y, d.knock || 70, d); sparks(e.x, e.y - 12, 10, 260, '255,230,180'); ring(e.x, e.y - 10, 6, 34, '255,80,40', 0.25, 3); }
    }
  }
  function shades(ctx, x, y, w, rot, glow) {   // Kamina's pointed shades
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); ctx.scale(w, w);
    if (glow) { ctx.shadowColor = '#ff3a1a'; ctx.shadowBlur = 16; }
    ctx.beginPath(); ctx.moveTo(-1, -0.46); ctx.lineTo(0, 0); ctx.lineTo(1, -0.46); ctx.lineTo(0.18, 0.24); ctx.lineTo(0, 0.1); ctx.lineTo(-0.18, 0.24); ctx.closePath();
    ctx.fillStyle = '#0b0b0b'; ctx.fill(); ctx.shadowBlur = 0; ctx.lineWidth = 2.2 / w; ctx.strokeStyle = '#ff4a2a'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-0.84, -0.37); ctx.lineTo(-0.28, -0.08); ctx.moveTo(0.28, -0.08); ctx.lineTo(0.84, -0.37); ctx.lineWidth = 2.6 / w; ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.stroke(); ctx.restore();
  }

  // ---- SUPER BLAZING KICK ----
  const kicks = [], flyers = [];
  function castKick(p, d) {
    const tg = alive().filter(e => dist(e, p) < (d.radius || 240) + 40).sort((a, b) => dist(a, p) - dist(b, p))[0]; if (!tg) return;
    const a = Math.atan2(tg.y - p.y, tg.x - p.x);
    kicks.push({ p, d, a, tg, sx: p.x, sy: p.y, t: 0, dur: Math.max(0.14, Math.min(0.34, dist(tg, p) / 900)), hit: false });
    p.invuln = Math.max(Number(p.invuln) || 0, 0.7); shout(p, d.kanji || BY['super-blazing-kick'].kanji); sfx('fire'); flames(p.x, p.y - 22, 18, 20); ring(p.x, p.y, 10, 60, '255,120,30', 0.35, 4);
    if (Math.random() < 0.3) line(EXCA, 'shouting', pick(['MAN ON FIRE!!', 'Feel the burn of the Gurren Brigade!', 'Stand back, Simon! This one\'s HOT!']), 'anger');
  }
  let freezeT = 0;
  function updateKicks(dt) {
    const k = K();
    for (let i = kicks.length - 1; i >= 0; i--) { const q = kicks[i], p = q.p; q.t += dt;
      if (!q.hit) { const tg = q.tg, u = Math.min(1, q.t / q.dur), ex = tg.dead ? q.sx + Math.cos(q.a) * 200 : tg.x - Math.cos(q.a) * ((tg.r || 12) + 10), ey = tg.dead ? q.sy + Math.sin(q.a) * 200 : tg.y - Math.sin(q.a) * ((tg.r || 12) + 10);
        const nx = q.sx + (ex - q.sx) * u, ny = q.sy + (ey - q.sy) * u; if (!k || k.freeAt(nx, ny, p.r || 14)) { p.x = nx; p.y = ny; }
        flames(p.x - Math.cos(q.a) * 14, p.y - 22 - Math.sin(q.a) * 14, 4, 10); if (Math.random() < 0.6) puff({ x: p.x, y: p.y - 22, vx: -Math.cos(q.a) * 300, vy: -Math.sin(q.a) * 300, life: 0.18, size: 26, kind: 'spark', c: '255,220,120' });
        if (u >= 1) { q.hit = true; if (tg.dead) { kicks.splice(i, 1); continue; } q.hitAt = q.t; q.cracked = false; q.ix = tg.x; q.iy = tg.y;
          if (solo()) { try { B().game.soloHold(true); } catch (_) {} freezeT = CFG.kickFreeze; } else freezeT = 0.0001; } }
      else if (!q.cracked && freezeT <= 0) { q.cracked = true; crack(q); }
      else if (q.cracked && q.t - q.hitAt > 0.6) kicks.splice(i, 1);
    }
    for (let i = flyers.length - 1; i >= 0; i--) { const f = flyers[i], e = f.e; f.t += dt;
      if (e.dead || f.t > f.life) { flyers.splice(i, 1); e.__kamFly = null; continue; }
      const sp = f.speed * (1 - f.t / f.life * 0.6), nx = e.x + f.vx * sp * dt, ny = e.y + f.vy * sp * dt;
      flames(e.x, e.y - 12, 3, 8);
      let wall = false; try { wall = !E().World.isFree(nx, ny, Math.max(6, (e.r || 12) * 0.6)); } catch (_) {}
      if (wall) { strike(f.p, e, f.dmg * 0.5, '#ff7a2a', f.vx, f.vy, 0, f.d); txt(e.x, e.y - 30, 'SPLAT!', '#ffb36a'); boom(e.x, e.y, 0.7); flyers.splice(i, 1); e.__kamFly = null; continue; }
      e.x = nx; e.y = ny; e.__kamFly = { x: nx, y: ny };
      for (const o of alive()) { if (o === e || f.hit.has(o) || Math.hypot(o.x - e.x, o.y - e.y) > (o.r || 12) + (e.r || 12)) continue; f.hit.add(o);
        strike(f.p, o, f.dmg * 0.6, '#ff7a2a', f.vx, f.vy, 160, f.d); strike(f.p, e, f.dmg * 0.3, '#ff7a2a', -f.vx, -f.vy, 0, f.d); boom((o.x + e.x) / 2, (o.y + e.y) / 2, 0.8); sfx('hit'); }
    }
  }
  function boom(x, y, s) { flames(x, y - 12, Math.round(14 * s), 16 * s); sparks(x, y - 12, Math.round(12 * s), 300 * s, '255,210,120'); ring(x, y, 8, 70 * s, '255,140,40', 0.4, 5); kick(0.15 * s); }
  function crack(q) {
    const N = E(), p = q.p, e = q.tg, d = q.d; if (solo()) { try { B().game.soloHold(false); } catch (_) {} }
    q.crackT = 0; txt(e.x, e.y - 54, 'CRACK!!!', '#ffdf4a'); sfx('boss'); kick(0.6); boom(e.x, e.y, 1.6); ring(e.x, e.y, 14, 140, '255,255,200', 0.5, 6);
    strike(p, e, d.dmg * atkOf(p), '#ff5a1a', Math.cos(q.a), Math.sin(q.a), 0, d);
    if (!e.dead) { const heavy = e.boss || e.legend; flyers.push({ e, p, d, vx: Math.cos(q.a), vy: Math.sin(q.a), speed: CFG.flySpeed * (d.fly || 1) * (heavy ? 0.45 : 1), t: 0, life: CFG.flyTime * (d.fly || 1), dmg: d.dmg * atkOf(p), hit: new Set() });
      try { e.applyStun && e.applyStun(CFG.flyTime + 0.2); } catch (_) {} }
  }
  function drawImpact(ctx, q) {   // the frozen manga frame: radial speed lines, a jagged star and CRACK!!!
    const x = q.ix, y = q.iy - 14, now = performance.now() / 1000;
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i < 40; i++) { const a = i / 40 * TAU + (i % 2) * 0.05, r0 = 34 + (i % 3) * 8, r1 = 150 + (i * 37 % 60); ctx.lineWidth = 1 + (i % 3); ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0); ctx.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1); ctx.stroke(); }
    ctx.beginPath(); for (let i = 0; i < 24; i++) { const a = i / 24 * TAU, r = i % 2 ? 22 : 46 + Math.sin(now * 50 + i) * 4; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } ctx.closePath();
    const gr = ctx.createRadialGradient(x, y, 2, x, y, 46); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.5, '#ffe060'); gr.addColorStop(1, '#ff5a00'); ctx.fillStyle = gr; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#1a0000'; ctx.stroke();
    ctx.font = '900 30px Pixelify, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 7; ctx.strokeStyle = '#1a0000'; ctx.strokeText('CRACK!!!', x, y - 54); ctx.fillStyle = '#ffe04a'; ctx.fillText('CRACK!!!', x, y - 54); ctx.restore();
  }

  // ---- SUPER BOWLING BALL ATTACK ----
  const balls = [];
  function castBowling(p, d) {
    const tg = alive().filter(e => dist(e, p) < (d.radius || 280) + 40).sort((a, b) => dist(a, p) - dist(b, p))[0]; if (!tg) return;
    const s = window.PS_DIGGER?._bro?.(), useBro = !!(s && !s.dead && !s.thrown && s.emergeT >= 1 && s.owner === p);
    if (useBro) { s.thrown = true; s.job = null; }
    balls.push({ p, d, s: useBro ? s : null, phase: 'grab', t: 0, x: useBro ? s.x : p.x, y: useBro ? s.y : p.y, tg, left: Math.max(1, d.count | 0), hits: 0, hit: new Set(), spin: 0, tears: [] });
    shout(p, d.kanji || BY['super-bowling-ball'].kanji);
    if (useBro) { line(EXCA, 'joyous', pick(['SUPER... BOWLING BALL... ATTAAACK!!', 'Simon! Curl up! We\'re going for a STRIKE!', 'Hold on tight, Simon! Here we GOOO!']), 'exclaim');
      line(DRIL, 'crying', pick(['WAAAH! Kamina, not agaiiin!', 'I\'m not a bowling baaall!', 'Th-the world is spinniiing!', 'KAMINAAA! PUT ME DOOOWN!']), 'tear', { follow: true, delay: 0.2 }); }
  }
  function updateBalls(dt) {
    const k = K();
    for (let i = balls.length - 1; i >= 0; i--) { const b = balls[i], p = b.p, d = b.d; b.t += dt; b.spin += dt * (b.phase === 'grab' ? 8 + b.t * 60 : 22);
      if (b.phase === 'grab') { const tx = p.x, ty = p.y - 58, u = Math.min(1, dt * 10); b.x += (tx - b.x) * u; b.y += (ty - b.y) * u; if (Math.random() < dt * 20) puff({ x: b.x + rnd(-16, 16), y: b.y + rnd(-16, 16), vx: rnd(-60, 60), vy: rnd(-60, 60), life: 0.25, size: 10, kind: 'spark', c: '150,255,140' });
        if (b.t > 0.45) { b.phase = 'roll'; b.t = 0; b.x = p.x; b.y = p.y; sfx('quake'); ring(p.x, p.y, 10, 80, '150,255,140', 0.4, 5); kick(0.3); } continue; }
      if (b.phase === 'roll') {
        let tg = b.tg; if (!tg || tg.dead || b.hit.has(tg)) tg = b.tg = alive().filter(e => !b.hit.has(e) && dist(e, b) < 260).sort((a, c) => dist(a, b) - dist(c, b))[0];
        if (!tg || b.left <= 0 || b.t > 4) { b.phase = 'pop'; b.t = 0; continue; }
        const dd = dist(tg, b), st = 600 * dt; if (dd > st) { b.x += (tg.x - b.x) / dd * st; b.y += (tg.y - b.y) / dd * st; }
        else { b.hit.add(tg); b.left--; b.hits++; strike(p, tg, d.dmg * atkOf(p), '#c8a070', tg.x - b.x, tg.y - b.y, d.knock || 120, d); txt(tg.x, tg.y - 34, b.hits >= 3 ? 'STRIKE x' + b.hits + '!' : 'STRIKE!', '#ffe27a');
          sparks(tg.x, tg.y - 10, 14, 320, '255,240,150'); ring(tg.x, tg.y, 8, 60, '150,255,140', 0.35, 5); b.x = tg.x; b.y = tg.y; b.tg = null; sfx('hit'); kick(0.12); }
        if (Math.random() < dt * 40) puff({ x: b.x + rnd(-8, 8), y: b.y + rnd(-2, 4), vx: rnd(-40, 40), vy: rnd(-40, -5), life: rnd(0.3, 0.6), size: rnd(4, 8), kind: 'dust', c: '170,140,100' });
        if (b.s && Math.random() < dt * 16) b.tears.push({ x: b.x, y: b.y - 14, vx: (Math.random() - 0.5) * 180, vy: -70 - Math.random() * 90, t: 0 });
      }
      if (b.phase === 'pop') { if (b.hits >= 3) { txt(b.x, b.y - 60, 'SUPER STRIKE!!!', '#7dff6a'); ring(b.x, b.y, 10, 120, '150,255,140', 0.5, 6); }
        if (b.s) { const s = b.s; const f = k ? k.nearFree(b.x, b.y, s.r || 14) : b; s.x = f.x; s.y = f.y; s.okX = f.x; s.okY = f.y; s.thrown = false; s.hurtCd = 0.6; txt(s.x, s.y - 40, '@_@', '#9ad8ff');
          if (Math.random() < 0.6) line(DRIL, 'dizzy', pick(['@_@ ...Did I get them, Kamina?', 'Ugh... I think I\'m gonna be sick...', 'N-next time, YOU be the ball, Kamina!', 'Th-that was... kind of awesome?']), 'dots'); }
        balls.splice(i, 1); continue; }
      for (const t of b.tears) { t.t += dt; t.x += t.vx * dt; t.y += t.vy * dt; t.vy += 380 * dt; } b.tears = b.tears.filter(t => t.t < 0.6);
    }
  }

  // ================= GIGA DRILL BREAK (Z-move) =================
  let gd = null, armedAt = -1e9;
  const GDB = { id: 'giga-drill-break', name: 'Giga Drill Break', type: 'ground', kind: 'dash', dmg: 0 };
  const ULT_DEF = { name: 'Giga Drill Break', type: 'ground', kind: 'pulse', dur: 1, dmg: 0, color: '#7dff6a', base: 0 };
  function view() {   // the part of the world on screen (minus a margin and the HUD at the bottom)
    try { const cam = B().camera, gc = gameCanvas(); const k = cam.scale * (Number(cam._cw) > 0 ? gc.r.width / cam._cw : 1), w = gc.r.width / k, h = gc.r.height / k, L = cam.left(), T = cam.top();
      return { x0: L + w * 0.12, x1: L + w * 0.88, y0: T + h * 0.18, y1: T + h * 0.72 }; } catch (_) { return null; } }
  function strongest(p) { const v = view(); return alive().filter(e => v ? e.x > v.x0 && e.x < v.x1 && e.y > v.y0 && e.y < v.y1 : Math.hypot((e.x - p.x) / CFG.gigaW, (e.y - p.y) / CFG.gigaH) <= 1).sort((a, b) => (b.boss || b.legend ? 1e9 : 0) + (Number(b.maxHp) || 0) - ((a.boss || a.legend ? 1e9 : 0) + (Number(a.maxHp) || 0)))[0]; }
  function tryGiga(p) {
    const N = E(); if (gd || dying || N.Game.state !== 'playing' || p.dead || window.PS_DIGGER?.active) return false;
    const now = performance.now() / 1000, tg = strongest(p);
    if (!tg) { txt(p.x, p.y - 70, 'No enemy in sight worth the drill!', '#ffdf4a'); return false; }
    if (now - armedAt > CFG.confirm) { armedAt = now; txt(p.x, p.y - 74, 'GIGA DRILL BREAK? Kamina will fall! Press again!', '#ff6a4a'); sfx('click'); return false; }
    armedAt = -1e9; startGiga(p, tg); return true;
  }
  // timeline (seconds)
  const TL = { throw: 1.6, split: 2.0, lock: 4.0, giga: 4.6, drill: 6.2, rush: 8.0, hitAt: 8.6, retract: 9.2, blast: 8.7, fire: 9.4, ko: 11.6, fall: 13.4, end: 15.2 };
  function startGiga(p, tg) {
    const so = solo();
    gd = { p, tg, t: 0, so, sx: p.x, sy: p.y, tx: tg.x, ty: tg.y, said: {}, sparks: [], rockets: [], trail: [], bolts: [], gp: [], killed: false, shake: 0 };
    if (so) { try { B().game.soloHold(true); } catch (_) {} }
    p.invuln = Math.max(Number(p.invuln) || 0, 30); window.PS_KAMINA.active = true;
    try { T().cut(EXCA, 'shouting', 'FINISHING MOVE!!!', 'exclaim', 1.5); } catch (_) {} sfx('legend'); kick(0.5);
    const s = window.PS_DIGGER?._bro?.(); if (s && !s.dead) line(DRIL, 'worried', 'K-Kamina...? What are you doing...?', 'question', { follow: true, delay: 1.6 });
  }
  function sayOnce(key, fn) { if (gd.said[key]) return; gd.said[key] = true; fn(); }
  function gpuff(o) { gd.gp.push(Object.assign({ t: 0, life: 0.5, vx: 0, vy: 0, g: 0, size: 4, kind: 'dot', c: '255,255,255' }, o)); }
  function updateGiga(dt) {
    const g = gd; if (!g) return; const p = g.p, tg = g.tg; g.t += dt; const t = g.t;
    p.invuln = Math.max(Number(p.invuln) || 0, 1); if (p.dead) { p.dead = false; p.hp = Math.max(1, p.hp); }
    g.shake = Math.max(0, g.shake - dt * 2);
    if (!tg.dead && t < TL.hitAt) { tg.x = g.tx; tg.y = g.ty; if (t > TL.throw) { try { tg.applyStun && tg.applyStun(0.5); } catch (_) {} } }   // pinned in place
    if (t >= TL.throw) sayOnce('throw', () => { sfx('click'); kick(0.2); });
    if (t >= TL.split && t < TL.lock && !tg.dead && Math.random() < dt * 16) { g.sparks.push({ x: g.tx + rnd(-40, 40), y: g.ty - 14 + rnd(-34, 34), a: Math.random() * TAU, t: 0 }); strike(p, tg, 4 * atkOf(p), '#ffffff', 0, 0, 0, GDB); if (Math.random() < 0.3) sfx('hit'); }
    if (t >= TL.lock) sayOnce('lock', () => { sfx('shield'); kick(0.4); try { T().cut(EXCA, 'determined', 'Gotcha! You\'re not going ANYWHERE!', 'anger', 1.2); } catch (_) {} });
    if (t >= TL.giga) sayOnce('giga', () => { try { T().cut(EXCA, 'determined', 'GIGA....', 'spark', 1.5); } catch (_) {} sfx('charge'); });
    if (t >= TL.giga && t < TL.drill && Math.random() < dt * 40) { const a = Math.random() * TAU, r = rnd(120, 260); gpuff({ x: p.x + Math.cos(a) * r, y: p.y - 60 + Math.sin(a) * r * 0.7, tx: p.x + 12, ty: p.y - (p.bodyH || 50), life: 0.6, size: 3.5, kind: 'pull', c: '150,255,140' }); }
    if (t >= TL.drill) sayOnce('drill', () => { try { T().cut(EXCA, 'shouting', 'DRILL!!!', 'exclaim', 1.6); } catch (_) {} sfx('quake'); g.shake = 1; kick(1.2); });
    if (t >= TL.drill && t < TL.rush && Math.random() < dt * 6) { g.bolts.push({ t: 0, seed: Math.random() * 1000 }); sfx('hit'); }
    for (const b of g.bolts) b.t += dt; g.bolts = g.bolts.filter(b => b.t < 0.18);
    if (t >= TL.rush) sayOnce('break', () => { try { T().cut(EXCA, 'shouting', 'BREEEAAAAKKKKAAAHHHHH!!!', 'exclaim', 2.4); } catch (_) {} sfx('boss'); g.shake = 1; kick(1.5); });
    if (t >= TL.rush && t < TL.retract) {   // the charge: start -> through the enemy -> past it
      const a = Math.atan2(g.ty - g.sy, g.tx - g.sx), over = 110, ex = g.tx + Math.cos(a) * over, ey = g.ty + Math.sin(a) * over, u = Math.min(1, (t - TL.rush) / (TL.retract - TL.rush - 0.1)), e2 = u * u * (3 - 2 * u);
      p.x = g.sx + (ex - g.sx) * e2; p.y = g.sy + (ey - g.sy) * e2; g.trail.push({ x: p.x, y: p.y }); if (g.trail.length > 60) g.trail.shift(); g.dir = a;
      if (Math.random() < dt * 30) gpuff({ x: p.x, y: p.y - 30, vx: -Math.cos(a) * rnd(200, 500) + rnd(-80, 80), vy: -Math.sin(a) * rnd(200, 500) + rnd(-80, 80), life: 0.4, size: rnd(16, 30), kind: 'streak', c: Math.random() < 0.5 ? '255,220,60' : '90,180,255' });
      // anything in the drill's path is pierced too
      for (const e of alive()) if (e !== tg && !e.__gdbHit && Math.hypot(e.x - p.x, e.y - p.y) < 70) { e.__gdbHit = true; kill(p, e, true); } }
    if (t >= TL.hitAt && !g.killed) { g.killed = true; kill(p, tg); kick(2.5); g.flash = 1; g.shake = 1.4; sfx('boss'); }
    if (t >= TL.blast) sayOnce('blast', () => { blast(p); });
    if (t >= TL.retract) sayOnce('land', () => { const k = K(); if (k) { const f = k.nearFree(p.x, p.y, p.r || 16); p.x = f.x; p.y = f.y; } });
    if (t >= TL.fire && t < TL.ko + 1.2 && Math.random() < dt * 11) { const a = Math.random() * TAU, r = rnd(20, 260); g.rockets.push({ x: g.tx + Math.cos(a) * r, y: g.ty - 60 + Math.sin(a) * r * 0.55, t: 0, hue: Math.random() * 360, n: 34, big: rnd(90, 170) }); if (Math.random() < 0.5) sfx('hit'); }
    for (const r of g.rockets) r.t += dt; g.rockets = g.rockets.filter(r => r.t < 1.5);
    for (const s of g.sparks) s.t += dt; g.sparks = g.sparks.filter(s => s.t < 0.25);
    for (const q of g.gp) { q.t += dt; if (q.kind === 'pull') { const u = q.t / q.life; q.x += (q.tx - q.x) * Math.min(1, dt * 6 * (1 + u * 3)); q.y += (q.ty - q.y) * Math.min(1, dt * 6 * (1 + u * 3)); } else { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += q.g * dt; } } g.gp = g.gp.filter(q => q.t < q.life);
    if (t >= TL.ko) sayOnce('ko', () => { sfx('legend'); kick(0.6); });
    if (t >= TL.fall) sayOnce('fall', () => { try { p.anim.play('Faint'); } catch (_) {} try { T().cut(EXCA, 'sigh', '...Heh. How\'s that... for a drill, Simon...', 'dots', 1.8); } catch (_) {} });
    if (t >= TL.fall && p.anim) { try { if (p.anim.cur !== 'Faint') p.anim.play('Faint'); p.anim.update(dt); } catch (_) {} }
    if (t >= TL.end) endGiga();
  }
  function kill(p, e, quiet) {   // instantly kills ANYTHING
    if (!e || e.dead) return; const big = (Number(e.hp) || 0) + (Number(e.maxHp) || 0) * 10 + 1e7;
    strike(p, e, big, '#ffffff', Math.cos(gd.dir || 0), Math.sin(gd.dir || 0), 300, GDB);
    if (!e.dead) { try { e.invuln = 0; e.shield = 0; e.hp = 1; e.hurt(big, '#ffffff', 0, 0, 0); } catch (_) {} }
    if (!e.dead) { try { e.hp = 0; e.dead = true; } catch (_) {} }
    if (!quiet) txt(e.x, e.y - 60, 'PIERCED!!', '#ffffff');
  }
  function blast(p) { gd.blastT = 0; }   // the spiral shockwave (its damage lands when the battle resumes, so the deaths play out)
  function blastDamage(g) { const p = g.p, dmg = CFG.blast * atkOf(p) * 20, v = view();
    for (const e of alive()) if (v ? e.x > v.x0 - 200 && e.x < v.x1 + 200 && e.y > v.y0 - 200 && e.y < v.y1 + 200 : dist(e, g) < 600) strike(p, e, dmg, '#7dff6a', e.x - g.tx, e.y - g.ty, 260, GDB); }
  function endGiga() {
    const g = gd; if (!g) return; gd = null; window.PS_KAMINA.active = false; const p = g.p;
    for (const e of E().EnemyMgr.all()) if (e) e.__gdbHit = false;
    if (!g.killed) { g.killed = true; gd = g; kill(p, g.tg); gd = null; }
    if (g.so) { try { B().game.soloHold(false); } catch (_) {} }
    if (E().Game.player !== p || p.dead) return;
    blastDamage({ p, x: g.tx, y: g.ty, tx: g.tx, ty: g.ty });
    dying = { p, t: 0.9 };   // he sways for a beat while the battlefield settles... then falls
  }
  let dying = null;
  function fallNow(p) {
    if (E().Game.player !== p || p.dead) return;
    // the price of the drill: Kamina falls (js/digger-bros.js turns this into his last words when Simon is out)
    for (const key of ['invuln', 'reviveShield', 'shadeInv']) p[key] = 0; p.sashT = -999;
    p.hp = Math.min(p.hp, 1);   // the drill took everything he had (single hits are capped, so he's left on his last HP first)
    for (let i = 0; i < 3 && !p.dead && !window.PS_DIGGER?.active; i++) { p.hp = Math.min(p.hp, 1); p.sashT = -999; p.invuln = 0; try { p.hurt(1e9, 'normal'); } catch (_) {} }
  }
  function skipGiga() { const g = gd; if (!g || g.t >= TL.fall) return; if (!g.killed) { g.dir = Math.atan2(g.ty - g.sy, g.tx - g.sx); g.killed = true; kill(g.p, g.tg); }
    g.said.blast = true; g.t = TL.fall; Object.assign(g.said, { throw: 1, lock: 1, giga: 1, drill: 1, break: 1, land: 1, ko: 1 }); try { T().hide(); } catch (_) {} }

  // ================= engine hooks =================
  let hooked = false;
  function hook() {
    const N = E(); if (hooked || !N || !N.Ult || !N.Enemy || !N.Combat) return; hooked = true;
    const prevCast = window.PS_CAST;
    window.PS_CAST = function (pl, def, hit, ghost) {
      const id = def && def.psCast; if (!BY[id]) return prevCast ? prevCast.apply(this, arguments) : undefined;
      if (ghost || !pl || pl.dead) return; if (typeof hit === 'function') lastHit = hit;
      try { if (id === 'gurren-boomerang') castBoomerang(pl, def); else if (id === 'super-blazing-kick') castKick(pl, def); else castBowling(pl, def); } catch (err) { console.warn('[kamina]', err); } };
    const uc = N.Ult.cast;
    N.Ult.cast = function (actor) { if (actor && actor === N.Game.player && Number(actor.dex) === EXCA && !actor.psDigger) return tryGiga(actor); return uc.apply(this, arguments); };
    const eup = N.Enemy.prototype.update;
    N.Enemy.prototype.update = function () { const r = eup.apply(this, arguments); const f = this.__kamFly; if (f && !this.dead) { this.x = f.x; this.y = f.y; } return r; };
    const du = N.Ult.drawUnits;
    N.Ult.drawUnits = function (ctx) { du.apply(this, arguments); try { drawWorld(ctx); } catch (err) { console.warn('[kamina]', err); } };
  }
  // Kamina's Z-move button is Giga Drill Break, ready from the start
  function ultButton() { const p = E().Game.player; if (!p || Number(p.dex) !== EXCA || p.psDigger) return;
    if (p.ultDef !== ULT_DEF) p.ultDef = ULT_DEF; p.ult = E().Ult.MAX || 300; p.ultCd = 0; p.ultT = 0; }

  // ================= drawing (world space, under the HUD) =================
  let lastDraw = performance.now();
  function drawWorld(ctx) {
    const nowMs = performance.now(), dt = Math.min(0.1, (nowMs - lastDraw) / 1000); lastDraw = nowMs;
    for (const q of kicks) { const p = q.p; if (!q.hit || !q.cracked) { ctx.save(); ctx.globalCompositeOperation = 'lighter';   // the burning comet around Kamina
        const gr = ctx.createRadialGradient(p.x, p.y - 22, 4, p.x, p.y - 22, 54); gr.addColorStop(0, 'rgba(255,250,200,.95)'); gr.addColorStop(0.45, 'rgba(255,120,30,.6)'); gr.addColorStop(1, 'rgba(255,40,0,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(p.x, p.y - 22, 54, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,150,40,.35)'; ctx.beginPath(); ctx.moveTo(p.x + Math.cos(q.a) * 30, p.y - 22 + Math.sin(q.a) * 30); ctx.lineTo(p.x - Math.cos(q.a) * 130 - Math.sin(q.a) * 30, p.y - 22 - Math.sin(q.a) * 130 + Math.cos(q.a) * 30); ctx.lineTo(p.x - Math.cos(q.a) * 130 + Math.sin(q.a) * 30, p.y - 22 - Math.sin(q.a) * 130 - Math.cos(q.a) * 30); ctx.closePath(); ctx.fill(); ctx.restore(); }
      if (q.hit && !q.cracked) drawImpact(ctx, q); }
    for (const f of flyers) { const e = f.e; ctx.save(); ctx.globalCompositeOperation = 'lighter'; const gr = ctx.createRadialGradient(e.x, e.y - 12, 2, e.x, e.y - 12, 30); gr.addColorStop(0, 'rgba(255,240,180,.8)'); gr.addColorStop(1, 'rgba(255,60,0,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(e.x, e.y - 12, 30, 0, TAU); ctx.fill(); ctx.restore(); }
    for (const r of rangs) { ctx.save(); for (let i = r.ghosts.length - 1; i >= 0; i--) { ctx.globalAlpha = 0.28 * (1 - i / r.ghosts.length); shades(ctx, r.ghosts[i].x, r.ghosts[i].y, (r.d.size || 40), r.ghosts[i].spin); } ctx.restore(); shades(ctx, r.x, r.y, (r.d.size || 40), r.spin, true); }
    for (const b of balls) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(125,255,106,.7)'; ctx.lineWidth = 2.5; ctx.beginPath(); for (let i = 0; i < 30; i++) { const a = i * 0.45 + b.spin, r = 6 + i * 0.75; ctx.lineTo(b.x + Math.cos(a) * r, b.y - 14 + Math.sin(a) * r); } ctx.stroke(); ctx.restore();
      if (b.s && b.s.anim) { ctx.save(); ctx.translate(b.x, b.y - 14); ctx.rotate(b.spin); try { b.s.anim.draw(ctx, 0, 14); } catch (_) {} ctx.restore(); }
      else { ctx.save(); ctx.translate(b.x, b.y - 14); ctx.rotate(b.spin); ctx.fillStyle = '#7a6a5a'; ctx.beginPath(); ctx.arc(0, 0, 15, 0, TAU); ctx.fill(); ctx.strokeStyle = '#4a3a2a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 9, 0, 4); ctx.stroke(); ctx.restore(); }
      ctx.fillStyle = '#7ac8ff'; for (const t of b.tears) { ctx.globalAlpha = 1 - t.t / 0.6; ctx.beginPath(); ctx.arc(t.x, t.y, 3, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1; }
    drawParts(ctx, parts);
    drawKanji(ctx, dt);
  }
  // ================= the Giga Drill Break cinematic (drawn above everything) =================
  const ov = document.createElement('canvas'); ov.id = 'ps-kamina'; ov.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;z-index:57;display:none';
  function gameCanvas() { let b = null, ar = 0; for (const c of document.querySelectorAll('canvas')) { if (c.id && c.id.startsWith('ps-')) continue; const r = c.getBoundingClientRect(), a = r.width * r.height; if (a > ar) { ar = a; b = { c, r }; } } return b; }
  function drill(ctx, x, y, a, w, h, now) {   // a steel spiral drill pointing along angle a, with a green glow
    ctx.save(); ctx.translate(x, y); ctx.rotate(a + Math.PI / 2);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.shadowColor = '#7dff6a'; ctx.shadowBlur = Math.min(60, w); ctx.fillStyle = 'rgba(125,255,106,.25)'; ctx.beginPath(); ctx.moveTo(-w * 0.62, 4); ctx.lineTo(0, -h * 1.06); ctx.lineTo(w * 0.62, 4); ctx.closePath(); ctx.fill(); ctx.restore();
    const gr = ctx.createLinearGradient(-w / 2, 0, w / 2, 0); gr.addColorStop(0, '#4a4a58'); gr.addColorStop(0.35, '#c8c8d8'); gr.addColorStop(0.5, '#ffffff'); gr.addColorStop(0.65, '#a8a8b8'); gr.addColorStop(1, '#3a3a48');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(-w / 2, 0); ctx.lineTo(0, -h); ctx.lineTo(w / 2, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(20,20,30,.75)'; ctx.lineWidth = Math.max(1, w / 16); const n = 9, off = (now * 4) % 1;
    for (let i = 0; i < n; i++) { const v = (i + off) / n, yy = -h * v, ww = w / 2 * (1 - v); ctx.beginPath(); ctx.moveTo(-ww, yy); ctx.lineTo(ww * 0.9, yy - h / n * 0.8); ctx.stroke(); }
    ctx.fillStyle = '#2a2a34'; ctx.fillRect(-w * 0.32, 0, w * 0.64, Math.max(3, w * 0.18)); ctx.restore(); }
  function drawGiga(dt) {
    const g = gd; if (!g) { if (ov.style.display !== 'none') ov.style.display = 'none'; return; }
    ov.style.display = 'block'; const ctx = ov.getContext('2d'), dpr = Math.min(2, devicePixelRatio || 1), W = innerWidth, H = innerHeight, now = performance.now() / 1000, t = g.t, p = g.p;
    if (ov.width !== Math.round(W * dpr) || ov.height !== Math.round(H * dpr)) { ov.width = Math.round(W * dpr); ov.height = Math.round(H * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    const cam = B()?.camera, gc = gameCanvas(); if (!cam || !gc || typeof cam.left !== 'function') return;
    const sh = g.shake * 10, shx = (Math.random() - 0.5) * sh, shy = (Math.random() - 0.5) * sh;
    const k = cam.scale * (Number(cam._cw) > 0 ? gc.r.width / cam._cw : 1), ox = gc.r.left - cam.left() * k + shx, oy = gc.r.top - cam.top() * k + shy;
    const world = () => ctx.setTransform(dpr * k, 0, 0, dpr * k, dpr * ox, dpr * oy), screen = () => ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const PX = ox + p.x * k, PY = oy + (p.y - 30) * k, TX = ox + g.tx * k, TY = oy + (g.ty - 20) * k;
    // the world goes dark
    ctx.fillStyle = `rgba(0,0,14,${Math.min(0.6, t * 0.6)})`; ctx.fillRect(0, 0, W, H);
    // "DRILL": a roaring blue-white light column to the heavens behind him (like the show's sky-piercing shot)
    if (t >= TL.drill && t < TL.rush) { const u = Math.min(1, (t - TL.drill) / 0.35); ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const col = ctx.createLinearGradient(PX - W * 0.3, 0, PX + W * 0.3, 0); col.addColorStop(0, 'rgba(20,60,200,0)'); col.addColorStop(0.35, `rgba(60,140,255,${0.35 * u})`); col.addColorStop(0.5, `rgba(220,240,255,${0.6 * u})`); col.addColorStop(0.65, `rgba(150,90,255,${0.35 * u})`); col.addColorStop(1, 'rgba(20,60,200,0)');
      ctx.fillStyle = col; ctx.fillRect(PX - W * 0.3, 0, W * 0.6, PY + 40);
      for (let i = 0; i < 120; i++) { const x = PX + (((i * 97.13) % 1) - 0.5) * W * 0.9 * (0.3 + ((i * 13.7) % 1)), sp = (now * (1.6 + (i % 5) * 0.3) + i * 0.173) % 1, y = H - sp * (H + 200), len = 60 + (i % 7) * 30;
        ctx.strokeStyle = i % 4 === 0 ? `rgba(255,255,255,${0.8 * u})` : i % 4 === 1 ? `rgba(170,120,255,${0.5 * u})` : `rgba(80,170,255,${0.6 * u})`; ctx.lineWidth = 1 + (i % 3) * 1.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + len); ctx.stroke(); }
      ctx.restore(); }
    // "BREAK": a blue speed tunnel streaming past him
    if (t >= TL.rush && t < TL.retract + 0.2) { ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 140; i++) { const a = (i * 2.399) % TAU, sp = ((now * 2.8 + i * 0.137) % 1), r0 = 40 + sp * Math.hypot(W, H) * 0.75, len = 60 + sp * 240;
        ctx.strokeStyle = i % 3 ? 'rgba(90,170,255,.55)' : 'rgba(255,240,140,.7)'; ctx.lineWidth = 1 + sp * 5; ctx.beginPath(); ctx.moveTo(PX + Math.cos(a) * r0, PY + Math.sin(a) * r0); ctx.lineTo(PX + Math.cos(a) * (r0 + len), PY + Math.sin(a) * (r0 + len)); ctx.stroke(); }
      ctx.restore(); }
    world();
    // the gigantic yellow-and-blue trail of the charge
    if (g.trail.length > 1 && t < TL.fire + 0.9) { const fade = t < TL.retract ? 1 : Math.max(0, 1 - (t - TL.retract) / 1.1); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (const [wid, col] of [[320, `rgba(20,70,255,${0.3 * fade})`], [240, `rgba(60,140,255,${0.42 * fade})`], [170, `rgba(120,200,255,${0.5 * fade})`], [110, `rgba(255,210,30,${0.8 * fade})`], [60, `rgba(255,245,150,${0.9 * fade})`], [24, `rgba(255,255,255,${fade})`]]) {
        ctx.strokeStyle = col; ctx.lineWidth = wid; ctx.beginPath(); ctx.moveTo(g.sx, g.sy - 30); for (const q of g.trail) ctx.lineTo(q.x, q.y - 30); ctx.stroke(); }
      ctx.restore(); }
    // the shades: thrown, split in two, a tornado of cuts, then clamping the enemy
    const T0 = { x: g.tx, y: g.ty - 16 };
    if (t >= TL.throw && t < TL.split) { const u = (t - TL.throw) / (TL.split - TL.throw); shades(ctx, g.sx + (T0.x - g.sx) * u, g.sy - 30 + (T0.y - g.sy + 30) * u, 48, now * 20, true); }
    else if (t >= TL.split && t < TL.lock) { const spin = 10 + (t - TL.split) * 8; ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 6; i++) { ctx.strokeStyle = `rgba(230,240,255,${0.25 + i * 0.05})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(T0.x, T0.y - i * 10, 36 + i * 10, (36 + i * 10) * 0.35, 0, now * spin + i, now * spin + i + 4.2); ctx.stroke(); } ctx.restore();
      for (let s = 0; s < 2; s++) { const a = now * spin + s * Math.PI, rr = 48 + Math.sin(now * 9 + s) * 12; shades(ctx, T0.x + Math.cos(a) * rr, T0.y + Math.sin(a) * rr * 0.55 - Math.sin(now * 3 + s) * 10, 34, a * 1.5, true); }
      ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 3; for (const s of g.sparks) { const L = 44 * (1 - s.t / 0.25); ctx.beginPath(); ctx.moveTo(s.x - Math.cos(s.a) * L, s.y - Math.sin(s.a) * L); ctx.lineTo(s.x + Math.cos(s.a) * L, s.y + Math.sin(s.a) * L); ctx.stroke(); } }
    else if (t >= TL.lock && t < TL.hitAt + 0.1) { const sq = Math.min(1, (t - TL.lock) / 0.25); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(255,60,40,${0.5 + 0.3 * Math.sin(now * 20)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(T0.x, T0.y, 40, 22, 0, 0, TAU); ctx.stroke(); ctx.restore();
      shades(ctx, T0.x - 60 + 24 * sq, T0.y, 34, 0.5, true); shades(ctx, T0.x + 60 - 24 * sq, T0.y, 34, -0.5 + Math.PI, true); }
    // Kamina himself, redrawn above the dark, with the drill
    if (p.anim) { try { p.anim.draw(ctx, p.x, p.y); } catch (_) {} }
    for (const q of g.gp) { const a = 1 - q.t / q.life; ctx.save(); ctx.globalCompositeOperation = 'lighter';
      if (q.kind === 'streak') { const m = Math.hypot(q.vx, q.vy) || 1; ctx.strokeStyle = `rgba(${q.c},${a})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q.x - q.vx / m * q.size * 3, q.y - q.vy / m * q.size * 3); ctx.stroke(); }
      else { ctx.fillStyle = `rgba(${q.c},${a})`; ctx.beginPath(); ctx.arc(q.x, q.y, q.size, 0, TAU); ctx.fill(); } ctx.restore(); }
    let dw = 0, dh = 0;
    if (t >= TL.giga && t < TL.retract + 0.4) { const skyH = (H / k) * 0.85;   // small at "GIGA", sky-high at "DRILL", huge and leading the charge at "BREAK"
      if (t < TL.drill) { const u = Math.min(1, (t - TL.giga) / 0.6); dw = 16 * u; dh = 36 * u; }
      else if (t < TL.rush) { const u = Math.min(1, (t - TL.drill) / 0.7), e = 1 - Math.pow(1 - u, 3); dw = 16 + (130 - 16) * e; dh = 36 + (skyH - 36) * e; }
      else { const u = Math.min(1, (t - TL.rush) / 0.25); dw = 130 + 30 * u; dh = skyH + (260 - skyH) * u; }
      if (t > TL.retract) { const s = Math.max(0, 1 - (t - TL.retract) / 0.4); dw *= s; dh *= s; }
      const turn = t >= TL.rush ? Math.min(1, (t - TL.rush) / 0.2) : 0, up = -Math.PI / 2, a = up + (((g.dir ?? up) - up + Math.PI * 3) % TAU - Math.PI) * turn;
      const hx = p.x + (turn ? Math.cos(a) * 16 : 12), hy = p.y - (p.bodyH || 50) * (1 - turn) + (turn ? Math.sin(a) * 16 - 30 : 0);
      drill(ctx, hx, hy, a, dw, dh, now);
      for (const b of g.bolts) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(200,255,190,.9)'; ctx.lineWidth = 2.5; ctx.beginPath(); let bx = hx, by = hy; ctx.moveTo(bx, by); for (let i = 1; i <= 8; i++) { bx = hx + Math.sin(b.seed + i * 3.1) * dw * 0.9; by = hy - dh * i / 8; ctx.lineTo(bx, by); } ctx.stroke(); ctx.restore(); } }
    // the spiral blast from the pierce
    if (g.blastT != null) { g.blastT += dt; const u = Math.min(1, g.blastT / 0.9), R = 40 + u * 520; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 - u;
      for (let arm = 0; arm < 4; arm++) { ctx.strokeStyle = arm % 2 ? 'rgba(125,255,106,.9)' : 'rgba(255,255,255,.9)'; ctx.lineWidth = 8 * (1 - u) + 2; ctx.beginPath(); for (let i = 0; i < 60; i++) { const a = i * 0.2 + arm * TAU / 4 + g.blastT * 6, r = i / 60 * R; ctx.lineTo(g.tx + Math.cos(a) * r, g.ty - 20 + Math.sin(a) * r * 0.6); } ctx.stroke(); }
      ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 10 * (1 - u); ctx.beginPath(); ctx.ellipse(g.tx, g.ty - 20, R, R * 0.6, 0, 0, TAU); ctx.stroke(); ctx.restore(); if (u >= 1) g.blastT = null; }
    // rainbow fireworks
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (const r of g.rockets) { const u = r.t / 1.5; for (let i = 0; i < r.n; i++) { const a = i / r.n * TAU, d = 10 + r.big * Math.sqrt(u), fx = r.x + Math.cos(a) * d, fy = r.y + Math.sin(a) * d + 40 * u * u;
      ctx.fillStyle = `hsla(${(r.hue + i * 11) % 360},100%,${68 - 20 * u}%,${1 - u})`; ctx.beginPath(); ctx.arc(fx, fy, 3.6 * (1 - u * 0.5), 0, TAU); ctx.fill();
      ctx.strokeStyle = `hsla(${(r.hue + i * 11) % 360},100%,70%,${0.4 * (1 - u)})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(r.x + Math.cos(a) * d * 0.6, r.y + Math.sin(a) * d * 0.6 + 40 * u * u * 0.6); ctx.stroke(); }
      if (u < 0.15) { ctx.fillStyle = `rgba(255,255,255,${1 - u / 0.15})`; ctx.beginPath(); ctx.arc(r.x, r.y, 16, 0, TAU); ctx.fill(); } } ctx.restore();
    screen();
    // rainbow light rays from where the enemy fell
    if (t >= TL.fire && t < TL.end) { const u = Math.min(1, (t - TL.fire) / 0.6), fade = t > TL.fall ? Math.max(0, 1 - (t - TL.fall) / 1.2) : 1; ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 16; i++) { const a = i / 16 * TAU + now * 0.4, L = Math.hypot(W, H); ctx.fillStyle = `hsla(${(i * 22.5 + now * 80) % 360},100%,60%,${0.12 * u * fade})`; ctx.beginPath(); ctx.moveTo(TX, TY); ctx.lineTo(TX + Math.cos(a - 0.08) * L, TY + Math.sin(a - 0.08) * L); ctx.lineTo(TX + Math.cos(a + 0.08) * L, TY + Math.sin(a + 0.08) * L); ctx.closePath(); ctx.fill(); }
      ctx.restore(); }
    if (g.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${g.flash})`; ctx.fillRect(0, 0, W, H); g.flash = Math.max(0, g.flash - dt * 1.8); }
    // big titles
    const title = (s, y, size, fill, jp) => { ctx.save(); ctx.font = `900 ${size}px ${jp ? '"Noto Sans JP","Yu Gothic","Hiragino Sans",sans-serif' : 'Pixelify, system-ui, sans-serif'}`; ctx.textAlign = 'center';
      const jx = (Math.random() - 0.5) * 3, jy = (Math.random() - 0.5) * 3; ctx.shadowColor = typeof fill === 'string' ? fill : '#fff'; ctx.shadowBlur = 24; ctx.lineWidth = Math.max(6, size / 7); ctx.strokeStyle = '#05050f'; ctx.strokeText(s, W / 2 + jx, y + jy); ctx.shadowBlur = 0; ctx.fillStyle = fill; ctx.fillText(s, W / 2 + jx, y + jy); ctx.restore(); };
    const fire = (y, size) => { const gr = ctx.createLinearGradient(0, y - size, 0, y); gr.addColorStop(0, '#fff3a0'); gr.addColorStop(0.4, '#ff8a1a'); gr.addColorStop(1, '#c80000'); return gr; };
    if (t < TL.throw) { const s = Math.round(Math.min(W / 9, 84) * (t < 0.2 ? 1.6 - t * 3 : 1)); title('FINISHING MOVE!!!', H * 0.3, s, fire(H * 0.3, s)); }
    if (t >= TL.giga && t < TL.drill) title('GIGA....', H * 0.18, Math.round(Math.min(W / 10, 72)), '#cfe6ff');
    if (t >= TL.drill && t < TL.rush) { const s = Math.round(Math.min(W / 8, 96) * (t - TL.drill < 0.15 ? 1.5 : 1)); title('DRILL!!!', H * 0.18, s, '#e8f4ff'); }
    if (t >= TL.rush && t < TL.fire) { const s = Math.round(Math.min(W / 15, 62)); title('BREEEAAAAKKKKAAAHHHHH!!!', H * 0.16, s, '#ffe04a'); title('ギガドリルブレイク！！！', H * 0.16 + s * 1.2, Math.round(s * 0.8), fire(H * 0.16 + s * 1.2, s * 0.8), true); }
    if (t >= TL.ko && t < TL.end) { const u = Math.min(1, (t - TL.ko) / 0.35), bounce = u < 1 ? 1.5 - 0.5 * u : 1 + Math.sin((t - TL.ko) * 6) * 0.03, size = Math.round(Math.min(W / 4, 240) * bounce);
      ctx.save(); ctx.font = `900 ${size}px Pixelify, system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.globalAlpha = t > TL.end - 0.5 ? (TL.end - t) / 0.5 : 1;
      const gr = ctx.createLinearGradient(W / 2 - size * 1.5, 0, W / 2 + size * 1.5, 0); for (let i = 0; i <= 6; i++) gr.addColorStop(i / 6, `hsl(${(i * 60 + now * 220) % 360},100%,60%)`);
      ctx.shadowColor = `hsl(${(now * 220) % 360},100%,60%)`; ctx.shadowBlur = 40; ctx.lineWidth = 14; ctx.strokeStyle = '#05050f'; ctx.strokeText('K.O.', W / 2, H * 0.46); ctx.shadowBlur = 0; ctx.fillStyle = gr; ctx.fillText('K.O.', W / 2, H * 0.46);
      ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 14; i++) { const a = now * 2 + i / 14 * TAU, rr = size * (0.9 + 0.15 * Math.sin(now * 5 + i)); ctx.fillStyle = `hsla(${(i * 26 + now * 200) % 360},100%,75%,.9)`; const sx = W / 2 + Math.cos(a) * rr * 1.2, sy = H * 0.46 - size * 0.35 + Math.sin(a) * rr * 0.5, ss = 4 + 3 * Math.sin(now * 9 + i);
        ctx.beginPath(); ctx.moveTo(sx, sy - ss * 2); ctx.lineTo(sx + ss * 0.5, sy); ctx.lineTo(sx, sy + ss * 2); ctx.lineTo(sx - ss * 0.5, sy); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(sx - ss * 2, sy); ctx.lineTo(sx, sy + ss * 0.5); ctx.lineTo(sx + ss * 2, sy); ctx.lineTo(sx, sy - ss * 0.5); ctx.closePath(); ctx.fill(); }
      ctx.restore(); }
    if (g.so && t < TL.fall) { ctx.font = '13px Pixelify, system-ui, sans-serif'; ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillText('Click / Enter: skip', W - 14, H - 14); }
  }
  addEventListener('keydown', e => { if (!gd || !gd.so) return; const k = (e.key || '').toLowerCase(); if (k === 'enter' || k === ' ' || k === 'escape') { e.preventDefault(); e.stopImmediatePropagation(); skipGiga(); } }, true);
  addEventListener('pointerdown', () => { if (gd && gd.so) skipGiga(); }, true);

  let last = performance.now();
  function loop(now) { requestAnimationFrame(loop); const dt = Math.min(0.1, (now - last) / 1000); last = now;
    try { register(); hook(); ultButton(); const N = E(), st = N?.Game?.state;
      if (gd) { if (N.Game.player !== gd.p || st === 'over' || st === 'ui') { const g = gd; gd = null; window.PS_KAMINA.active = false; if (g.so) { try { B().game.soloHold(false); } catch (_) {} } } else updateGiga(dt); }
      if (dying) { const d = dying; d.p.invuln = Math.max(Number(d.p.invuln) || 0, 0.3); try { if (d.p.anim.cur !== 'Faint') d.p.anim.play('Faint'); } catch (_) {} if ((d.t -= dt) <= 0 || st === 'over' || st === 'ui') { dying = null; if (st === 'playing') fallNow(d.p); } }
      if (freezeT > 0) { freezeT -= dt; if (freezeT <= 0) { const q = kicks.find(k => k.hit && !k.cracked); if (q) { q.cracked = true; crack(q); } } }
      else if (st === 'playing' && !gd) { updateRangs(dt); updateKicks(dt); updateBalls(dt); updateParts(dt); }
      if (st !== 'playing' && st !== 'choice' && !gd) { rangs.length = 0; kicks.length = 0; for (const f of flyers) f.e.__kamFly = null; flyers.length = 0; for (const b of balls) if (b.s) b.s.thrown = false; balls.length = 0; parts.length = 0; kanji.length = 0; }
      drawGiga(dt); } catch (e) { console.warn('[kamina]', e); } }
  function init() { document.body.append(ov); requestAnimationFrame(loop); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
  window.PS_KAMINA = { active: false, cfg: CFG, moves: IDS, giga: p => { const pl = p || E().Game.player; armedAt = performance.now() / 1000; return tryGiga(pl); }, get state() { return gd && { t: gd.t, killed: gd.killed }; }, _dbg: () => ({ rangs: rangs.length, kicks: kicks.length, flyers: flyers.length, balls: balls.length, parts: parts.length }) };
})();
