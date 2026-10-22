/* KAMINA'S MOVES — Excadrill's own Gurren Lagann moves (see js/digger-bros.js for Excadrill & Drilbur).
   Level-up moves, offered only to Excadrill (one is guaranteed at levels 3, 6 and 9 until learned):
   - GURREN BOOMERANG (グレンブーメラン！！！): a giant pair of black Kamina shades flies out in a straight line,
     cutting everything, then boomerangs back.
   - SUPER BLAZING KICK (スーパー・ブレイジング・キック！！！): Excadrill dives forward like a fiery comet. On the
     kick the whole game pauses for a beat... then CRACK!!! The enemy goes flying backwards; anything it crashes
     into is hurt, and so is the flying enemy.
   - SUPER BOWLING BALL ATTACK (スーパー・ボウリングボール・アタック！！！): Excadrill grabs Drilbur, curls him up
     and bowls him through a chain of enemies while the poor kid cries. With no Drilbur around he bowls a boulder.
   And his Z-move, from the very first second of the run:
   - GIGA DRILL BREAK: "FINISHING MOVE!!!" — a full cinematic. The shades fly at the strongest enemy, split in two
     and slice it in a tornado of cuts, then pin it in place. "GIGA..." a small drill forms on his raised hand,
     "DRILL" it grows five times bigger, "BREEEAAAAKKKKAAAHHHHH!!!" he rockets through the enemy with a huge
     yellow-and-blue trail. Rainbow fireworks, a rainbow K.O. — the move kills ANYTHING. But it is a suicide move:
     Excadrill falls afterwards. (With Drilbur out, Kamina's last words play and you go on as Drilbur.)
     Press the Z-move button twice (the first press asks to confirm).
   Solo: the kick's pause and the Giga Drill Break cinematic freeze the battle. Co-op: nothing freezes. */
(() => {
  'use strict';
  if (window.PS_KAMINA_INSTALLED) return; window.PS_KAMINA_INSTALLED = true;
  const E = () => window.PS_HOOPA_ENGINE, B = () => window.PS_MEGA_BRIDGE_V5, TAU = Math.PI * 2;
  const EXCA = 530, DRIL = 529;
  const CFG = { forceAt: [3, 6, 9], kickFreeze: 0.32, flyTime: 0.65, flySpeed: 620, confirm: 2.5, gigaW: 400, gigaH: 210 };
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const sfx = n => { try { E().Audio.sfx(n); } catch (_) {} };
  const txt = (x, y, t, c) => { try { E().FX.dmgText(x, y, t, c || '#fff'); } catch (_) {} };
  const T = () => window.PS_LAKE_TALK, K = () => window.PS_LAKE?.kit;
  const line = (dex, face, text, em, o) => { try { return T().line(dex, face, text, em, Object.assign({ prio: true }, o)); } catch (_) { return false; } };
  const alive = () => E().EnemyMgr.all().filter(e => e && !e.dead);
  const solo = () => !(E().Coop && E().Coop.active);

  // ================= the moves =================
  const MOVES = [
    { id: 'gurren-boomerang', name: 'Gurren Boomerang', type: 'steel', kind: 'boomerang', psCast: 'gurren-boomerang', cd: 2.4, dmg: 30, speed: 540, radius: 320, size: 30, count: 1, knock: 70, maxLvl: 5,
      kanji: 'グレンブーメラン！！！', desc: 'Throws a giant pair of black Kamina shades in a straight line; they boomerang back, cutting both ways.',
      ups: [{ t: '+45% damage', m: { dmg: 1.45 } }, { t: '+30% range', m: { radius: 1.3 } }, { t: '+1 pair of shades', m: { count: 1 } }, { t: 'Max: +60% damage, bigger shades', m: { dmg: 1.6, size: 1.35 } }] },
    { id: 'super-blazing-kick', name: 'Super Blazing Kick', type: 'fire', kind: 'dash', psCast: 'super-blazing-kick', cd: 4.5, dmg: 70, radius: 240, width: 40, knock: 0, maxLvl: 5,
      kanji: 'スーパー・ブレイジング・キック！！！', desc: 'Dives forward like a fiery comet. The kick freezes time... CRACK!!! The enemy flies back and smashes into others (both get hurt).',
      ups: [{ t: '+40% damage', m: { dmg: 1.4 } }, { t: '+30% dive distance', m: { radius: 1.3 } }, { t: '-25% cooldown', m: { cd: 0.75 } }, { t: 'Max: +60% damage, enemies fly farther', m: { dmg: 1.6, fly: 1.5 } }] },
    { id: 'super-bowling-ball', name: 'Super Bowling Ball Attack', type: 'ground', kind: 'dash', psCast: 'super-bowling-ball', cd: 6, dmg: 44, radius: 280, count: 4, knock: 120, maxLvl: 5,
      kanji: 'スーパー・ボウリングボール・アタック！！！', desc: 'Grabs Drilbur and bowls him through a chain of enemies (he cries the whole way). No Drilbur? A boulder.',
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
  const kanji = [];   // fiery red shouts over Excadrill's head
  function shout(p, text) { kanji.push({ p, text, t: 0, life: 1.35 }); if (kanji.length > 3) kanji.shift(); }
  let lastHit = null;
  function strike(p, e, dmg, color, dx, dy, knock, move) {
    const h = lastHit || window.__psHit;
    try { if (typeof h === 'function') { h(p, e, dmg, color, dx, dy, knock, move); return; } } catch (_) {}
    try { e.hurt(dmg, color, dx, dy, knock); E().Stats.dmg(p, move && move.id || 'drill', dmg); } catch (_) {}
  }
  const atkOf = p => Number(p.atk) || 1;

  // ---- GURREN BOOMERANG ----
  const rangs = [];
  function castBoomerang(p, d) {
    const tg = p.target && !p.target.dead ? p.target : alive().sort((a, b) => dist(a, p) - dist(b, p))[0];
    const base = tg ? Math.atan2(tg.y - p.y, tg.x - p.x) : (Number(p.aim) || 0), n = Math.max(1, d.count | 0);
    for (let i = 0; i < n; i++) { const a = base + (n === 1 ? 0 : (i / (n - 1) - 0.5) * 0.55);
      rangs.push({ p, d, x: p.x, y: p.y - 18, a, vx: Math.cos(a), vy: Math.sin(a), out: true, went: 0, spin: 0, hits: new Map(), life: 6 }); }
    shout(p, d.kanji || BY['gurren-boomerang'].kanji); sfx('click');
  }
  function updateRangs(dt) {
    for (let i = rangs.length - 1; i >= 0; i--) { const r = rangs[i], d = r.d, sp = (d.speed || 540) * (r.out ? 1 : 1.15);
      r.spin += dt * 16; r.life -= dt;
      if (r.out) { r.x += r.vx * sp * dt; r.y += r.vy * sp * dt; r.went += sp * dt; if (r.went >= (d.radius || 320)) r.out = false; }
      else { const tx = r.p.x, ty = r.p.y - 18, dd = Math.hypot(tx - r.x, ty - r.y); if (dd < 22 || r.life <= 0 || r.p.dead) { rangs.splice(i, 1); continue; } r.x += (tx - r.x) / dd * sp * dt; r.y += (ty - r.y) / dd * sp * dt; }
      const R = (d.size || 30); for (const e of alive()) { if (Math.hypot(e.x - r.x, (e.y - 12) - r.y) > R + (e.r || 12)) continue; const last = r.hits.get(e) || -9; if (performance.now() / 1000 - last < 0.3) continue;
        r.hits.set(e, performance.now() / 1000); strike(r.p, e, d.dmg * atkOf(r.p), '#2a2a2a', e.x - r.x, e.y - r.y, d.knock || 60, d); }
    }
  }
  function shades(ctx, x, y, w, rot, fill, edge) {   // Kamina's pointed shades
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); ctx.scale(w, w);
    ctx.beginPath(); ctx.moveTo(-1, -0.46); ctx.lineTo(0, 0); ctx.lineTo(1, -0.46); ctx.lineTo(0.18, 0.24); ctx.lineTo(0, 0.1); ctx.lineTo(-0.18, 0.24); ctx.closePath();
    ctx.fillStyle = fill || '#0b0b0b'; ctx.fill(); ctx.lineWidth = 1.6 / w; ctx.strokeStyle = edge || 'rgba(255,90,60,.85)'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-0.82, -0.36); ctx.lineTo(-0.3, -0.08); ctx.lineWidth = 2.2 / w; ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.stroke(); ctx.restore();
  }

  // ---- SUPER BLAZING KICK ----
  const kicks = [], flyers = [];
  function castKick(p, d) {
    const tg = alive().filter(e => dist(e, p) < (d.radius || 240) + 40).sort((a, b) => dist(a, p) - dist(b, p))[0]; if (!tg) return;
    const a = Math.atan2(tg.y - p.y, tg.x - p.x);
    kicks.push({ p, d, a, tg, sx: p.x, sy: p.y, t: 0, dur: Math.max(0.12, Math.min(0.32, dist(tg, p) / 900)), hit: false, trail: [] });
    p.invuln = Math.max(Number(p.invuln) || 0, 0.6); shout(p, d.kanji || BY['super-blazing-kick'].kanji); sfx('fire');
  }
  let freezeT = 0;
  function updateKicks(dt) {
    const k = K();
    for (let i = kicks.length - 1; i >= 0; i--) { const q = kicks[i], p = q.p; q.t += dt;
      q.trail.push({ x: p.x, y: p.y, t: 0 }); for (const f of q.trail) f.t += dt; while (q.trail.length && q.trail[0].t > 0.35) q.trail.shift();
      if (!q.hit) { const tg = q.tg, u = Math.min(1, q.t / q.dur), ex = tg.dead ? q.sx + Math.cos(q.a) * 200 : tg.x - Math.cos(q.a) * ((tg.r || 12) + 10), ey = tg.dead ? q.sy + Math.sin(q.a) * 200 : tg.y - Math.sin(q.a) * ((tg.r || 12) + 10);
        const nx = q.sx + (ex - q.sx) * u, ny = q.sy + (ey - q.sy) * u; if (!k || k.freeAt(nx, ny, p.r || 14)) { p.x = nx; p.y = ny; }
        if (u >= 1) { q.hit = true; if (tg.dead) { kicks.splice(i, 1); continue; } q.hitAt = q.t; q.cracked = false;
          if (solo()) { try { B().game.soloHold(true); } catch (_) {} freezeT = CFG.kickFreeze; } else freezeT = 0.0001; } }
      else if (!q.cracked && freezeT <= 0) { q.cracked = true; crack(q); }
      else if (q.cracked && q.t - q.hitAt > 0.5) kicks.splice(i, 1);
    }
    for (let i = flyers.length - 1; i >= 0; i--) { const f = flyers[i], e = f.e; f.t += dt;
      if (e.dead || f.t > f.life) { flyers.splice(i, 1); e.__kamFly = null; continue; }
      const sp = f.speed * (1 - f.t / f.life * 0.6), nx = e.x + f.vx * sp * dt, ny = e.y + f.vy * sp * dt;
      let wall = false; try { wall = !E().World.isFree(nx, ny, Math.max(6, (e.r || 12) * 0.6)); } catch (_) {}
      if (wall) { strike(f.p, e, f.dmg * 0.5, '#ff7a2a', f.vx, f.vy, 0, f.d); txt(e.x, e.y - 30, 'SPLAT!', '#ffb36a'); flyers.splice(i, 1); e.__kamFly = null; continue; }
      e.x = nx; e.y = ny; e.__kamFly = { x: nx, y: ny };
      for (const o of alive()) { if (o === e || f.hit.has(o) || Math.hypot(o.x - e.x, o.y - e.y) > (o.r || 12) + (e.r || 12)) continue; f.hit.add(o);
        strike(f.p, o, f.dmg * 0.6, '#ff7a2a', f.vx, f.vy, 160, f.d); strike(f.p, e, f.dmg * 0.3, '#ff7a2a', -f.vx, -f.vy, 0, f.d);
        try { E().FX.burst(o.x, o.y - 10, '#ff9a3a', 8, 150); } catch (_) {} sfx('hit'); }
    }
  }
  function crack(q) {
    const N = E(), p = q.p, e = q.tg, d = q.d; if (q.frozen !== false && solo()) { try { B().game.soloHold(false); } catch (_) {} }
    txt(e.x, e.y - 50, 'CRACK!!!', '#ffdf4a'); sfx('boss'); try { B().camera?.kick?.(0.5); N.FX.burst(e.x, e.y - 10, '#ff6a1a', 18, 260); } catch (_) {}
    strike(p, e, d.dmg * atkOf(p), '#ff5a1a', Math.cos(q.a), Math.sin(q.a), 0, d);
    if (!e.dead) { const heavy = e.boss || e.legend; flyers.push({ e, p, d, vx: Math.cos(q.a), vy: Math.sin(q.a), speed: CFG.flySpeed * (d.fly || 1) * (heavy ? 0.45 : 1), t: 0, life: CFG.flyTime * (d.fly || 1), dmg: d.dmg * atkOf(p), hit: new Set() });
      try { e.applyStun && e.applyStun(CFG.flyTime + 0.2); } catch (_) {} }
  }

  // ---- SUPER BOWLING BALL ATTACK ----
  const balls = [];
  function castBowling(p, d) {
    const tg = alive().filter(e => dist(e, p) < (d.radius || 280) + 40).sort((a, b) => dist(a, p) - dist(b, p))[0]; if (!tg) return;
    const s = window.PS_DIGGER?._bro?.(), useBro = !!(s && !s.dead && !s.thrown && s.emergeT >= 1 && s.owner === p);
    if (useBro) { s.thrown = true; s.job = null; }
    balls.push({ p, d, s: useBro ? s : null, phase: 'grab', t: 0, x: useBro ? s.x : p.x, y: useBro ? s.y : p.y, tg, left: Math.max(1, d.count | 0), hit: new Set(), spin: 0, tears: [] });
    shout(p, d.kanji || BY['super-bowling-ball'].kanji);
    if (useBro) { line(EXCA, 'joyous', 'SUPER... BOWLING BALL... ATTAAACK!!', 'exclaim'); line(DRIL, 'crying', pick(['WAAAH! Aniki, not agaiiin!', 'I\'m not a bowling baaall!', 'Th-the world is spinniiing!']), 'tear', { follow: true, delay: 0.2 }); }
  }
  const pick = L => L[Math.floor(Math.random() * L.length)];
  function updateBalls(dt) {
    const k = K();
    for (let i = balls.length - 1; i >= 0; i--) { const b = balls[i], p = b.p, d = b.d; b.t += dt; b.spin += dt * 18;
      if (b.phase === 'grab') { const tx = p.x, ty = p.y - 46, u = Math.min(1, dt * 10); b.x += (tx - b.x) * u; b.y += (ty - b.y) * u; if (b.t > 0.35) { b.phase = 'roll'; b.t = 0; b.x = p.x; b.y = p.y; sfx('quake'); } continue; }
      if (b.phase === 'roll') {
        let tg = b.tg; if (!tg || tg.dead || b.hit.has(tg)) tg = b.tg = alive().filter(e => !b.hit.has(e) && dist(e, b) < 260).sort((a, c) => dist(a, b) - dist(c, b))[0];
        if (!tg || b.left <= 0 || b.t > 4) { b.phase = 'pop'; b.t = 0; continue; }
        const dd = dist(tg, b), st = 560 * dt; if (dd > st) { b.x += (tg.x - b.x) / dd * st; b.y += (tg.y - b.y) / dd * st; }
        else { b.hit.add(tg); b.left--; strike(p, tg, d.dmg * atkOf(p), '#c8a070', tg.x - b.x, tg.y - b.y, d.knock || 120, d); txt(tg.x, tg.y - 34, 'STRIKE!', '#ffe27a'); try { E().FX.burst(tg.x, tg.y - 8, '#c8a070', 10, 180); } catch (_) {} b.x = tg.x; b.y = tg.y; b.tg = null; sfx('hit'); }
        if (b.s && Math.random() < dt * 14) b.tears.push({ x: b.x, y: b.y - 14, vx: (Math.random() - 0.5) * 160, vy: -60 - Math.random() * 80, t: 0 });
      }
      if (b.phase === 'pop') { if (b.s) { const s = b.s; const f = k ? k.nearFree(b.x, b.y, s.r || 14) : b; s.x = f.x; s.y = f.y; s.okX = f.x; s.okY = f.y; s.thrown = false; s.hurtCd = 0.6; txt(s.x, s.y - 40, '@_@', '#9ad8ff');
          if (Math.random() < 0.6) line(DRIL, 'dizzy', pick(['@_@ ...Did I get them, Aniki?', 'Ugh... I think I\'m gonna be sick...', 'N-next time, YOU be the ball!']), 'dots'); }
        balls.splice(i, 1); continue; }
      for (const t of b.tears) { t.t += dt; t.x += t.vx * dt; t.y += t.vy * dt; t.vy += 380 * dt; } b.tears = b.tears.filter(t => t.t < 0.6);
    }
  }

  // ================= GIGA DRILL BREAK (Z-move) =================
  let gd = null, armedAt = -1e9;
  const GDB = { id: 'giga-drill-break', name: 'Giga Drill Break', type: 'ground', kind: 'dash', dmg: 0 };
  const ULT_DEF = { name: 'Giga Drill Break', type: 'ground', kind: 'pulse', dur: 1, dmg: 0, color: '#7dff6a', base: 0 };
  function strongest(p) { return alive().filter(e => Math.hypot((e.x - p.x) / CFG.gigaW, (e.y - p.y) / CFG.gigaH) <= 1).sort((a, b) => (b.boss || b.legend ? 1e9 : 0) + (Number(b.maxHp) || 0) - ((a.boss || a.legend ? 1e9 : 0) + (Number(a.maxHp) || 0)))[0]; }
  function tryGiga(p) {
    const N = E(); if (gd || N.Game.state !== 'playing' || p.dead || window.PS_DIGGER?.active) return false;
    const now = performance.now() / 1000, tg = strongest(p);
    if (!tg) { txt(p.x, p.y - 70, 'No enemy in sight worth the drill!', '#ffdf4a'); return false; }
    if (now - armedAt > CFG.confirm) { armedAt = now; txt(p.x, p.y - 74, 'GIGA DRILL BREAK? Excadrill will fall! Press again!', '#ff6a4a'); sfx('click'); return false; }
    armedAt = -1e9; startGiga(p, tg); return true;
  }
  // timeline (seconds): shout, throw, tornado, lock, GIGA, DRILL, BREAK rush, pierce, retract, fireworks, K.O., fall
  const TL = { shout: 0, throw: 1.3, split: 1.65, lock: 3.5, giga: 4.1, drill: 5.3, rush: 6.5, hitAt: 7.0, retract: 7.6, fire: 7.9, ko: 9.6, fall: 11.0, end: 12.6 };
  function startGiga(p, tg) {
    const N = E(), so = solo();
    gd = { p, tg, t: 0, so, sx: p.x, sy: p.y, tx: tg.x, ty: tg.y, said: {}, sparks: [], rockets: [], trail: [], killed: false, done: false };
    if (so) { try { B().game.soloHold(true); } catch (_) {} }
    p.invuln = Math.max(Number(p.invuln) || 0, 30); window.PS_KAMINA.active = true;
    try { T().cut(EXCA, 'shouting', 'FINISHING MOVE!!!', 'exclaim', 1.3); } catch (_) {} sfx('legend');
  }
  function sayOnce(key, fn) { if (gd.said[key]) return; gd.said[key] = true; fn(); }
  function updateGiga(dt) {
    const g = gd; if (!g) return; const N = E(), p = g.p, tg = g.tg; g.t += dt; const t = g.t;
    p.invuln = Math.max(Number(p.invuln) || 0, 1); if (p.dead) { p.dead = false; p.hp = Math.max(1, p.hp); }
    if (!tg.dead && t < TL.hitAt) { tg.x = g.tx; tg.y = g.ty; if (t > TL.throw) { try { tg.applyStun && tg.applyStun(0.5); } catch (_) {} } }   // pinned in place
    if (t >= TL.split && t < TL.lock && !tg.dead && Math.random() < dt * 12) { g.sparks.push({ x: g.tx + (Math.random() - 0.5) * 50, y: g.ty - 14 + (Math.random() - 0.5) * 40, a: Math.random() * TAU, t: 0 });
      strike(p, tg, 4 * atkOf(p), '#ffffff', 0, 0, 0, GDB); }
    if (t >= TL.giga) sayOnce('giga', () => { try { T().cut(EXCA, 'determined', 'GIGA....', 'spark', 1.2); } catch (_) {} sfx('charge'); });
    if (t >= TL.drill) sayOnce('drill', () => { try { T().cut(EXCA, 'shouting', 'DRILL!!', 'exclaim', 1.2); } catch (_) {} sfx('quake'); });
    if (t >= TL.rush) sayOnce('break', () => { try { T().cut(EXCA, 'shouting', 'BREEEAAAAKKKKAAAHHHHH!!!', 'exclaim', 2.2); } catch (_) {} sfx('boss'); });
    if (t >= TL.rush && t < TL.retract) {   // the charge: start -> through the enemy -> a little past it
      const a = Math.atan2(g.ty - g.sy, g.tx - g.sx), over = 90, ex = g.tx + Math.cos(a) * over, ey = g.ty + Math.sin(a) * over, u = Math.min(1, (t - TL.rush) / (TL.retract - TL.rush - 0.1)), e2 = u * u * (3 - 2 * u);
      p.x = g.sx + (ex - g.sx) * e2; p.y = g.sy + (ey - g.sy) * e2; g.trail.push({ x: p.x, y: p.y }); if (g.trail.length > 40) g.trail.shift(); g.dir = a; }
    if (t >= TL.hitAt && !g.killed) { g.killed = true; kill(p, tg); try { B().camera?.kick?.(2); } catch (_) {} g.flash = 1; }
    if (t >= TL.retract) sayOnce('land', () => { const k = K(); if (k) { const f = k.nearFree(p.x, p.y, p.r || 16); p.x = f.x; p.y = f.y; } });
    if (t >= TL.fire && t < TL.ko + 0.8 && Math.random() < dt * 9) { const a = Math.random() * TAU, r = 30 + Math.random() * 150; g.rockets.push({ x: g.tx + Math.cos(a) * r, y: g.ty - 40 + Math.sin(a) * r * 0.6, t: 0, hue: Math.random() * 360, n: 26 }); sfx('hit'); }
    for (const r of g.rockets) r.t += dt; g.rockets = g.rockets.filter(r => r.t < 1.3);
    for (const s of g.sparks) s.t += dt; g.sparks = g.sparks.filter(s => s.t < 0.25);
    if (t >= TL.ko) sayOnce('ko', () => sfx('legend'));
    if (t >= TL.fall) sayOnce('fall', () => { try { p.anim.play('Faint'); } catch (_) {} try { T().cut(EXCA, 'sigh', '...Heh. How\'s that... for a drill...', 'dots', 1.6); } catch (_) {} });
    if (t >= TL.fall && p.anim) { try { if (p.anim.cur !== 'Faint') p.anim.play('Faint'); p.anim.update(dt); } catch (_) {} }
    if (t >= TL.end) endGiga();
  }
  function kill(p, e) {   // instantly kills ANYTHING
    if (!e || e.dead) return; const big = (Number(e.hp) || 0) + (Number(e.maxHp) || 0) * 10 + 1e7;
    strike(p, e, big, '#ffffff', Math.cos(gd.dir || 0), Math.sin(gd.dir || 0), 300, GDB);
    if (!e.dead) { try { e.invuln = 0; e.shield = 0; e.hp = 1; e.hurt(big, '#ffffff', 0, 0, 0); } catch (_) {} }
    if (!e.dead) { try { e.hp = 0; e.dead = true; } catch (_) {} }
    txt(e.x, e.y - 60, 'PIERCED!!', '#ffffff');
  }
  function endGiga() {
    const g = gd; if (!g) return; gd = null; window.PS_KAMINA.active = false; const p = g.p;
    if (!g.killed) { g.killed = true; gd = g; kill(p, g.tg); gd = null; }
    if (g.so) { try { B().game.soloHold(false); } catch (_) {} }
    if (E().Game.player !== p || p.dead) return;
    // the price of the drill: Excadrill falls (js/digger-bros.js turns this into Kamina's last words when Drilbur is out)
    if (window.PS_DIGGER) window.PS_DIGGER.noGigaNext = true;
    for (const key of ['invuln', 'reviveShield', 'shadeInv']) p[key] = 0; p.sashT = -999;
    p.hp = Math.min(p.hp, 1);   // the drill took everything he had (single hits are capped, so he's left on his last HP first)
    for (let i = 0; i < 3 && !p.dead && !window.PS_DIGGER?.active; i++) { p.hp = Math.min(p.hp, 1); p.sashT = -999; p.invuln = 0; try { p.hurt(1e9, 'normal'); } catch (_) {} }
    if (window.PS_DIGGER) window.PS_DIGGER.noGigaNext = false;
  }
  function skipGiga() { const g = gd; if (!g || g.t >= TL.fall) return; if (!g.killed) { g.dir = Math.atan2(g.ty - g.sy, g.tx - g.sx); g.killed = true; kill(g.p, g.tg); }
    g.t = TL.fall; g.said = { giga: 1, drill: 1, break: 1, land: 1, ko: 1 }; try { T().hide(); } catch (_) {} }

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
  // Excadrill's Z-move button is Giga Drill Break, ready from the start
  function ultButton() { const p = E().Game.player; if (!p || Number(p.dex) !== EXCA || p.psDigger) return;
    if (p.ultDef !== ULT_DEF) p.ultDef = ULT_DEF; p.ult = E().Ult.MAX || 300; p.ultCd = 0; p.ultT = 0; }

  // ================= drawing =================
  function drawWorld(ctx) {
    const now = performance.now() / 1000;
    for (const q of kicks) { const p = q.p; ctx.save(); ctx.globalCompositeOperation = 'lighter';   // the fiery comet
      for (let i = 0; i < q.trail.length; i++) { const f = q.trail[i], u = 1 - f.t / 0.35; ctx.fillStyle = `rgba(255,${120 + 100 * u | 0},40,${0.5 * u})`; ctx.beginPath(); ctx.arc(f.x, f.y - 20, 22 * u + 4, 0, TAU); ctx.fill(); }
      if (!q.cracked) { const gr = ctx.createRadialGradient(p.x, p.y - 22, 4, p.x, p.y - 22, 40); gr.addColorStop(0, 'rgba(255,240,160,.9)'); gr.addColorStop(0.5, 'rgba(255,120,30,.55)'); gr.addColorStop(1, 'rgba(255,40,0,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(p.x, p.y - 22, 40, 0, TAU); ctx.fill(); }
      ctx.restore(); }
    for (const f of flyers) { const e = f.e; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,140,40,.6)'; ctx.lineWidth = 3; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(e.x - f.vx * (20 + i * 10), e.y - 12 + (i - 1.5) * 6); ctx.lineTo(e.x - f.vx * (60 + i * 14), e.y - 12 + (i - 1.5) * 6 - f.vy * 30); ctx.stroke(); } ctx.restore(); }
    for (const r of rangs) shades(ctx, r.x, r.y, (r.d.size || 30), r.spin);
    for (const b of balls) {
      if (b.s && b.s.anim) { ctx.save(); ctx.translate(b.x, b.y - 14); ctx.rotate(b.phase === 'grab' ? 0 : b.spin); try { b.s.anim.draw(ctx, 0, 14); } catch (_) {} ctx.restore(); }
      else { ctx.save(); ctx.translate(b.x, b.y - 14); ctx.rotate(b.spin); ctx.fillStyle = '#7a6a5a'; ctx.beginPath(); ctx.arc(0, 0, 15, 0, TAU); ctx.fill(); ctx.strokeStyle = '#4a3a2a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 9, 0, 4); ctx.stroke(); ctx.restore(); }
      ctx.fillStyle = '#7ac8ff'; for (const t of b.tears) { ctx.globalAlpha = 1 - t.t / 0.6; ctx.beginPath(); ctx.arc(t.x, t.y, 2.6, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1; }
    for (let i = kanji.length - 1; i >= 0; i--) { const k = kanji[i]; k.t += 1 / 60; if (k.t > k.life || k.p.dead) { kanji.splice(i, 1); continue; }
      const row = kanji.filter((o, j) => j > i && o.p === k.p).length, p = k.p, u = k.t / k.life, y = p.y - (p.bodyH || 50) - 30 - u * 14 - row * 24, sz = Math.round(15 + 6 * Math.min(1, k.t * 8));
      ctx.save(); ctx.globalAlpha = u > 0.8 ? (1 - u) / 0.2 : 1; ctx.font = `900 ${sz}px "Noto Sans JP","Yu Gothic","Hiragino Sans","Meiryo",sans-serif`; ctx.textAlign = 'center';
      const jit = (Math.random() - 0.5) * 1.5; ctx.lineWidth = 5; ctx.strokeStyle = '#1a0000'; ctx.strokeText(k.text, p.x + jit, y);
      const gr = ctx.createLinearGradient(0, y - sz, 0, y); gr.addColorStop(0, '#ffe04a'); gr.addColorStop(0.45, '#ff5a1a'); gr.addColorStop(1, '#c80000'); ctx.fillStyle = gr; ctx.fillText(k.text, p.x + jit, y);
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= 0.35 + 0.25 * Math.sin(now * 30); ctx.fillStyle = '#ff7a2a'; ctx.fillText(k.text, p.x, y - 1); ctx.restore(); }
  }
  // the Giga Drill Break cinematic is drawn above everything
  const ov = document.createElement('canvas'); ov.id = 'ps-kamina'; ov.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;z-index:57;display:none';
  function gameCanvas() { let b = null, ar = 0; for (const c of document.querySelectorAll('canvas')) { if (c.id && c.id.startsWith('ps-')) continue; const r = c.getBoundingClientRect(), a = r.width * r.height; if (a > ar) { ar = a; b = { c, r }; } } return b; }
  function drill(ctx, x, y, a, w, h, now) {   // a gray spiral drill pointing along angle a
    ctx.save(); ctx.translate(x, y); ctx.rotate(a + Math.PI / 2);
    const gr = ctx.createLinearGradient(-w / 2, 0, w / 2, 0); gr.addColorStop(0, '#5a5a66'); gr.addColorStop(0.45, '#e8e8f0'); gr.addColorStop(1, '#4a4a55');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(-w / 2, 0); ctx.lineTo(0, -h); ctx.lineTo(w / 2, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(30,30,40,.7)'; ctx.lineWidth = Math.max(1, w / 18); const n = 7, off = (now * 3) % 1;
    for (let i = 0; i < n; i++) { const v = (i + off) / n, yy = -h * v, ww = w / 2 * (1 - v); ctx.beginPath(); ctx.moveTo(-ww, yy); ctx.lineTo(ww * 0.9, yy - h / n * 0.8); ctx.stroke(); }
    ctx.restore(); }
  function drawGiga(dt) {
    const g = gd; if (!g) { if (ov.style.display !== 'none') ov.style.display = 'none'; return; }
    ov.style.display = 'block'; const ctx = ov.getContext('2d'), dpr = Math.min(2, devicePixelRatio || 1), W = innerWidth, H = innerHeight, now = performance.now() / 1000, t = g.t, p = g.p;
    if (ov.width !== Math.round(W * dpr) || ov.height !== Math.round(H * dpr)) { ov.width = Math.round(W * dpr); ov.height = Math.round(H * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    const cam = B()?.camera, gc = gameCanvas(); if (!cam || !gc || typeof cam.left !== 'function') return;
    const k = cam.scale * (Number(cam._cw) > 0 ? gc.r.width / cam._cw : 1), ox = gc.r.left - cam.left() * k, oy = gc.r.top - cam.top() * k;
    const world = () => ctx.setTransform(dpr * k, 0, 0, dpr * k, dpr * ox, dpr * oy), screen = () => ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const PX = ox + p.x * k, PY = oy + (p.y - 30) * k;
    // the world goes dark; from "DRILL" on, a blue speed tunnel roars behind Excadrill
    ctx.fillStyle = `rgba(0,0,12,${Math.min(0.55, t * 0.6)})`; ctx.fillRect(0, 0, W, H);
    if (t >= TL.drill && t < TL.retract) { const u = Math.min(1, (t - TL.drill) / 0.4); ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 90; i++) { const a = (i * 2.399) % TAU, sp = ((now * 2.2 + i * 0.137) % 1), r0 = 30 + sp * Math.hypot(W, H) * 0.7, len = 40 + sp * 160;
        ctx.strokeStyle = i % 3 ? `rgba(90,170,255,${0.55 * u})` : `rgba(230,245,255,${0.7 * u})`; ctx.lineWidth = 1 + sp * 4; ctx.beginPath(); ctx.moveTo(PX + Math.cos(a) * r0, PY + Math.sin(a) * r0); ctx.lineTo(PX + Math.cos(a) * (r0 + len), PY + Math.sin(a) * (r0 + len)); ctx.stroke(); }
      const gl = ctx.createRadialGradient(PX, PY, 4, PX, PY, 180); gl.addColorStop(0, `rgba(200,230,255,${0.5 * u})`); gl.addColorStop(1, 'rgba(40,90,255,0)'); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(PX, PY, 180, 0, TAU); ctx.fill(); ctx.restore(); }
    world();
    // the yellow-and-blue trail of the charge
    if (g.trail.length > 1 && t < TL.fire + 0.6) { const fade = t < TL.retract ? 1 : Math.max(0, 1 - (t - TL.retract) / 0.9); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
      for (const [wid, col] of [[150, `rgba(40,110,255,${0.35 * fade})`], [100, `rgba(90,180,255,${0.5 * fade})`], [70, `rgba(255,214,40,${0.85 * fade})`], [26, `rgba(255,255,230,${0.9 * fade})`]]) {
        ctx.strokeStyle = col; ctx.lineWidth = wid; ctx.beginPath(); ctx.moveTo(g.sx, g.sy - 30); for (const q of g.trail) ctx.lineTo(q.x, q.y - 30); ctx.stroke(); }
      ctx.restore(); }
    // the shades: thrown, split in two, a tornado of cuts, then pinning the enemy
    const T0 = { x: g.tx, y: g.ty - 16 };
    if (t >= TL.throw && t < TL.split) { const u = (t - TL.throw) / (TL.split - TL.throw); shades(ctx, g.sx + (T0.x - g.sx) * u, g.sy - 30 + (T0.y - g.sy + 30) * u, 34, now * 18); }
    else if (t >= TL.split && t < TL.lock) { for (let s = 0; s < 2; s++) { const a = now * 14 + s * Math.PI, rr = 44 + Math.sin(now * 9 + s) * 10; shades(ctx, T0.x + Math.cos(a) * rr, T0.y + Math.sin(a) * rr * 0.6, 26, a * 1.5); }
      ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2.5; for (const s of g.sparks) { const L = 34 * (1 - s.t / 0.25); ctx.beginPath(); ctx.moveTo(s.x - Math.cos(s.a) * L, s.y - Math.sin(s.a) * L); ctx.lineTo(s.x + Math.cos(s.a) * L, s.y + Math.sin(s.a) * L); ctx.stroke(); } }
    else if (t >= TL.lock && t < TL.hitAt + 0.1) { const sq = Math.min(1, (t - TL.lock) / 0.25); shades(ctx, T0.x - 48 + 18 * sq, T0.y, 26, 0.5); shades(ctx, T0.x + 48 - 18 * sq, T0.y, 26, -0.5 + Math.PI); }
    // Excadrill himself, redrawn above the dark, with the drill
    if (p.anim) { try { p.anim.draw(ctx, p.x, p.y); } catch (_) {} }
    if (t >= TL.giga && t < TL.retract + 0.35) { const grow = t < TL.drill ? Math.min(1, (t - TL.giga) / 0.5) : 1 + 4 * Math.min(1, (t - TL.drill) / 0.5), shrink = t > TL.retract ? Math.max(0, 1 - (t - TL.retract) / 0.35) : 1;
      const a = t >= TL.rush ? (g.dir ?? -Math.PI / 2) : -Math.PI / 2, hx = p.x + (t >= TL.rush ? Math.cos(a) * 14 : 12), hy = p.y - (p.bodyH || 50) + (t >= TL.rush ? Math.sin(a) * 14 + 20 : 0);
      drill(ctx, hx, hy, a, 12 * grow * shrink, 26 * grow * shrink, now); }
    // rainbow fireworks
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (const r of g.rockets) { const u = r.t / 1.3; for (let i = 0; i < r.n; i++) { const a = i / r.n * TAU, d = 10 + 90 * Math.sqrt(u);
      ctx.fillStyle = `hsla(${(r.hue + i * 14) % 360},100%,${65 - 20 * u}%,${1 - u})`; ctx.beginPath(); ctx.arc(r.x + Math.cos(a) * d, r.y + Math.sin(a) * d + 30 * u * u, 3.2 * (1 - u * 0.5), 0, TAU); ctx.fill(); } } ctx.restore();
    screen();
    if (g.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${g.flash})`; ctx.fillRect(0, 0, W, H); g.flash = Math.max(0, g.flash - dt * 2.2); }
    // big titles
    const title = (s, y, size, fill) => { ctx.save(); ctx.font = `900 ${size}px Pixelify, system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.lineWidth = Math.max(6, size / 7); ctx.strokeStyle = '#05050f'; ctx.strokeText(s, W / 2, y); ctx.fillStyle = fill; ctx.fillText(s, W / 2, y); ctx.restore(); };
    if (t >= TL.giga && t < TL.rush) title(t < TL.drill ? 'GIGA....' : 'GIGA DRILL....', H * 0.18, Math.round(Math.min(W / 12, 60)), '#cfe6ff');
    if (t >= TL.rush && t < TL.fire) title('BREEEAAAAKKKKAAAHHHHH!!!', H * 0.18, Math.round(Math.min(W / 16, 56)), '#ffe04a');
    if (t >= TL.ko && t < TL.end) { const u = Math.min(1, (t - TL.ko) / 0.35), size = Math.round(Math.min(W / 5, 200) * (0.6 + 0.4 * u)); ctx.save(); ctx.font = `900 ${size}px Pixelify, system-ui, sans-serif`; ctx.textAlign = 'center';
      const gr = ctx.createLinearGradient(W / 2 - size * 1.5, 0, W / 2 + size * 1.5, 0); for (let i = 0; i <= 6; i++) gr.addColorStop(i / 6, `hsl(${(i * 60 + now * 200) % 360},100%,60%)`);
      ctx.lineWidth = 12; ctx.strokeStyle = '#05050f'; ctx.strokeText('K.O.', W / 2, H * 0.45); ctx.fillStyle = gr; ctx.fillText('K.O.', W / 2, H * 0.45); ctx.restore(); }
    if (g.so && t < TL.fall) { ctx.font = '13px Pixelify, system-ui, sans-serif'; ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillText('Click / Enter: skip', W - 14, H - 14); }
  }
  addEventListener('keydown', e => { if (!gd || !gd.so) return; const k = (e.key || '').toLowerCase(); if (k === 'enter' || k === ' ' || k === 'escape') { e.preventDefault(); e.stopImmediatePropagation(); skipGiga(); } }, true);
  addEventListener('pointerdown', () => { if (gd && gd.so) skipGiga(); }, true);

  let last = performance.now();
  function loop(now) { requestAnimationFrame(loop); const dt = Math.min(0.1, (now - last) / 1000); last = now;
    try { register(); hook(); ultButton(); const N = E(), st = N?.Game?.state;
      if (gd) { if (N.Game.player !== gd.p || st === 'over' || st === 'ui') { const g = gd; gd = null; window.PS_KAMINA.active = false; if (g.so) { try { B().game.soloHold(false); } catch (_) {} } } else updateGiga(dt); }
      if (freezeT > 0) { freezeT -= dt; if (freezeT <= 0) { const q = kicks.find(k => k.hit && !k.cracked); if (q) { q.cracked = true; crack(q); } } }
      else if (st === 'playing' && !gd) { updateRangs(dt); updateKicks(dt); updateBalls(dt); }
      if (st !== 'playing' && st !== 'choice' && !gd) { rangs.length = 0; kicks.length = 0; for (const f of flyers) f.e.__kamFly = null; flyers.length = 0; for (const b of balls) if (b.s) b.s.thrown = false; balls.length = 0; }
      drawGiga(dt); } catch (e) { console.warn('[kamina]', e); } }
  function init() { document.body.append(ov); requestAnimationFrame(loop); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
  window.PS_KAMINA = { active: false, cfg: CFG, moves: IDS, giga: p => { const pl = p || E().Game.player; armedAt = performance.now() / 1000; return tryGiga(pl); }, get state() { return gd && { t: gd.t, killed: gd.killed }; }, _dbg: () => ({ rangs: rangs.length, kicks: kicks.length, flyers: flyers.length, balls: balls.length }) };
})();
