/* LAKE GUARDIANS — Uxie, Mesprit and Azelf fight together.
   - Playing as one of them, you learn the other two as Psychic summon moves (never your own: Azelf can't summon Azelf).
     They show up in your level-up rewards from Lv.3 until you have learned both.
   - Each move calls a PERMANENT ally. It rises from a water drop on the floor (Uxie yellow, Mesprit pink, Azelf blue).
     Azelf spawns on your left, Uxie on your right, Mesprit takes the side that is left.
     If an ally faints it melts back into the ground and the move calls it again after 20 seconds.
     Every time the move's cooldown comes round, the ally uses its signature command.
   - Allies share everything with you at 100%: Attack, cooldowns, crit, regeneration, defense, held item, level and
     your buffs (and the buffs they give are shared with the whole trio).
       Uxie     the tank. Lots of HP, takes less damage, draws enemies to it, follows you loosely.
                Lv1 Psychic + stunning pulse · Lv2 Cosmic Power (team defense that keeps rising) ·
                Lv3 Recover + shared regeneration · Lv4 Psychic Shove (pushes enemies back and stuns) · Lv5 all stronger.
       Mesprit  jack of all trades, picks what the moment needs: attack, heal, stall or protect.
                Lv1 Psybeam / Confusion + healing pulse · Lv2 Lullaby (slows and stuns around you) ·
                Lv3 Protect (short team shield) · Lv4 Healing Wish (big heal) · Lv5 all stronger.
       Azelf    the attacker: very high damage, hunts enemies around you.
                Lv1 Psystrike / Psycho Cut · Lv2 Nasty Plot (shared Attack buff) · Lv3 Future Sight (delayed blast) ·
                Lv4 Psycho Boost (huge single hit) · Lv5 all stronger.
   - Their Z-Move deals 3x the damage of a normal Z-Move, with twice the cooldown.
   Solo (your own allies only). Their portraits and emotes (js/lake-talk.js) react to what happens here. */
(() => {
  'use strict';
  if (window.PS_LAKE_INSTALLED) return; window.PS_LAKE_INSTALLED = true;
  const E = () => window.PS_HOOPA_ENGINE, TAU = Math.PI * 2;
  const CFG = { respawn: 20, spawnTime: 1.4, meltTime: 1.0, moveCd: 12, zDmg: 3, zCd: 2, unlockLevel: 3 };
  const TRIO = {
    480: { key: 'uxie', name: 'Uxie', move: 'lake-uxie', role: 'Tank', hp: 2.2, atk: 0.7, spd: 0.85, take: 0.8, leash: 230, dead: 110, ideal: 60,
      kit: ['psychic', 'confusion'], drop: ['#fff7c0', '#ffd84a', '#c8960c'], ring: '#ffd84a',
      desc: 'Calls Uxie, a permanent tank ally (on your right). Very tanky, draws enemies, raises the team\'s defense, heals and stuns or pushes enemies back.',
      ups: ['Cosmic Power: team defense that keeps rising', 'Recover: heals and shares regeneration', 'Psychic Shove: pushes enemies back and stuns them', 'Max: stronger in every way (defense up to 50%)'] },
    481: { key: 'mesprit', name: 'Mesprit', move: 'lake-mesprit', role: 'All-rounder', hp: 1.25, atk: 1.0, spd: 1.0, take: 1, leash: 260, dead: 45, ideal: 170,
      kit: ['psybeam', 'confusion', 'psychic'], drop: ['#ffe0f4', '#ff8ad0', '#c0408a'], ring: '#ff8ad0',
      desc: 'Calls Mesprit, a permanent all-round ally that attacks, heals, stalls or protects, whatever the moment needs.',
      ups: ['Lullaby: slows and stuns the enemies around you', 'Protect: a short shield for the whole team', 'Healing Wish: a big heal for the team', 'Max: stronger in every way'] },
    482: { key: 'azelf', name: 'Azelf', move: 'lake-azelf', role: 'Attacker', hp: 0.8, atk: 1.8, spd: 1.15, take: 1, leash: 420, dead: 50, ideal: 150,
      kit: ['psystrike', 'psycho-cut', 'psybeam'], drop: ['#e0f2ff', '#5ab0ff', '#2060c0'], ring: '#5ab0ff',
      desc: 'Calls Azelf, a permanent attacker ally (on your left) that deals very high damage and hunts enemies around you.',
      ups: ['Nasty Plot: an Attack buff shared by the team', 'Future Sight: a delayed psychic blast', 'Psycho Boost: a huge single hit', 'Max: stronger in every way'] } };
  const IDS = Object.keys(TRIO).map(Number), MOVE_DEX = {}; for (const d of IDS) MOVE_DEX[TRIO[d].move] = d;
  const isTrio = dex => !!TRIO[Number(dex)];
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const player = () => E()?.Game?.player;
  const say = (x, y, t, c) => { try { E().FX.dmgText(x, y, t, c || '#fff'); } catch (_) {} };
  const sfx = n => { try { E().Audio.sfx(n); } catch (_) {} };
  // what the team is doing, for js/lake-talk.js (portraits + emotes): summon, arrive, hurt, faint, skill, z
  const emit = (type, d) => { try { window.dispatchEvent(new CustomEvent('ps-lake', { detail: Object.assign({ type }, d) })); } catch (_) {} };

  // ================= moves =================
  function moveDef(dex) {
    const t = TRIO[dex];
    return { id: t.move, name: t.name, type: 'psychic', kind: 'summon', psCast: t.move, desc: t.desc, cd: CFG.moveCd, dmg: 0, radius: 0, count: 1, maxLvl: 5,
      ups: t.ups.map(x => ({ t: x, m: {} })) };
  }
  let registered = false;
  function register() {
    const N = E(), M = N && N.Moves; if (registered || !M || !M.BY_ID || !Array.isArray(M.ALL)) return; registered = true;
    for (const d of IDS) { const def = moveDef(d); if (!M.BY_ID[def.id]) { M.ALL.push(def); M.BY_ID[def.id] = def; } }
  }
  // level-up rewards: the other two summons (never your own), pushed to the front until learned
  function hookPool() {
    const M = E()?.Moves; if (!M || typeof M.poolFor !== 'function' || M.poolFor.__lake) return;
    const orig = M.poolFor;
    M.poolFor = function (mon) {
      let r = orig.apply(this, arguments); const d = Number(mon && mon.dex); const mine = IDS.map(x => TRIO[x].move);
      r = (r || []).filter(id => !mine.includes(id)); if (!isTrio(d)) return r;
      const ids = IDS.filter(x => x !== d).map(x => TRIO[x].move), p = player();
      const un = ids.filter(id => !(p && typeof p.hasMove === 'function' && p.hasMove(id)));
      if (p && Number(p.dex) === d && Number(p.level) >= CFG.unlockLevel && un.length) return [...un, ...r.slice(0, 1)];   // a short pool, so the new-move cards reliably show them
      return [...r, ...ids];
    };
    M.poolFor.__lake = true;
  }

  // ================= the team =================
  let owner = null, ownerPos = null;
  const allies = {};   // dex -> ally
  const team = { guard: 0, guardT: 0, protect: 0, protectT: 0 };
  const sights = [], fx = [];   // Future Sight markers, splash/melt effects
  const moveOf = (p, dex) => p && Array.isArray(p.moves) ? p.moves.find(m => m && m.id === TRIO[dex].move) : null;
  const lvlMul = s => 1 + 0.12 * ((s.lvl || 1) - 1);
  const guardCap = s => Math.min(0.5, 0.25 + 0.05 * (s.lvl || 1));
  function sideFor(dex) {   // +1 right, -1 left
    if (dex === 482) return -1; if (dex === 480) return 1;
    return Number(owner && owner.dex) === 482 ? -1 : 1;   // Mesprit: whichever side is free
  }
  const SHARE = ['atkMul', 'atkPerm', 'spdMul', 'spdPerm', 'cdMul', 'cdPerm', 'critChance', 'critPerm', 'regenFlat', 'regenPct', 'reductionBase', 'defBonus', 'buffs', 'item', 'powers', 'level', 'magnet', 'xpMul', 'coinMul', 'atkItemK'];
  function makeActor(s) {
    const N = E(), a = new N.Player(N.DEX_BY[s.dex], {}, s.shiny); s.caster = a; a.psLake = s;
    for (const k of ['x', 'y', 'r', 'bodyH', 'anim', 'dead', 'hp', 'maxHp', 'aim', 'target']) Object.defineProperty(a, k, { configurable: true, get: () => s[k], set: v => { s[k] = v; } });
    for (const k of SHARE) Object.defineProperty(a, k, { configurable: true, get: () => s.owner[k], set: () => {} });   // shared with you at 100%
    Object.defineProperty(a, 'baseAtk', { configurable: true, get: () => (Number(s.owner.baseAtk) || 1) * s.t.atk * lvlMul(s) });
    Object.defineProperty(a, 'baseSpd', { configurable: true, get: () => Number(s.owner.baseSpd) || 100 });
    Object.defineProperty(a, 'floating', { configurable: true, get: () => true });
    a.hurt = (amt, type) => hurt(s, amt, type); a.ultCd = Infinity; a.ultT = 0;
  }
  function hpFor(s) { return Math.max(30, Math.round((Number(s.owner.maxHp) || 100) * s.t.hp * lvlMul(s))); }
  function summon(dex, again) {
    const N = E(), o = owner; if (!N || !o) return null; const t = TRIO[dex], side = sideFor(dex);
    let shiny = false; try { shiny = !!(N.DB.save && N.DB.save.shiny && N.DB.save.shiny[dex]) && N.Sprites.hasShiny(dex); } catch (_) {}
    const s = { dex, t, name: t.name, owner: o, side, shiny, x: o.x + side * 70, y: o.y + 8, r: 16, bodyH: 36, dead: false, spawnT: 0, age: 0, lvl: moveOf(o, dex)?.lvl || 1,
      next: 0.5, kitI: 0, cd: {}, hurtCd: 0, stunT: 0, slowT: 0, path: [], aim: 0, target: null, anim: null };
    try { N.Sprites.preload([dex], 4000, shiny); s.anim = new N.Sprites.Animator(dex, 1, shiny); } catch (_) {}
    try { const H = window.PS_HOOPA; if (H && H.summonFree && !H.summonFree(s.x, s.y, s.r)) { s.x = o.x; s.y = o.y + 30; } } catch (_) {}
    makeActor(s); s.maxHp = hpFor(s); s.hp = s.maxHp; s.again = !!again; allies[dex] = s;
    sfx('surge'); emit('summon', { dex, again: !!again }); return s;
  }
  function faint(s) {
    if (s.dead && s.melt != null) return; s.dead = true; s.melt = 0; s.respawnAt = (E().Game.st?.time ?? 0) + CFG.respawn; s.deadAt = performance.now() / 1000;
    say(s.x, s.y - 50, s.name + ' fainted!', s.t.ring); sfx('faint'); emit('faint', { dex: s.dex });
  }
  function hurt(s, amt, type) {
    if (!s || s.dead || s.spawnT < CFG.spawnTime || s.hurtCd > 0 || !Number.isFinite(amt) || amt <= 0) return;
    s.hurtCd = 0.35;
    try { E().Player.prototype.hurt.call(s.caster, amt, type); } catch (_) { s.hp -= amt; }
    if (s.hp <= 0 || s.dead) { s.hp = 0; s.dead = false; faint(s); return; }
    if (!s.low && s.hp < s.maxHp * 0.5) { s.low = true; emit('hurt', { dex: s.dex, frac: s.hp / s.maxHp }); }
  }
  function clearAll() { for (const d of IDS) delete allies[d]; sights.length = 0; fx.length = 0; team.guard = team.guardT = team.protect = team.protectT = 0; owner = null; ownerPos = null; }

  // ---- skills ----
  function foes() { const N = E(); return N.EnemyMgr.all().filter(e => e && !e.dead && !e.remote); }
  function blast(s, x, y, radius, dmgK, o) {
    const N = E(); o = o || {}; let n = 0;
    for (const e of foes()) { if (Math.hypot(e.x - x, e.y - y) > radius + (e.r || 12)) continue;
      const dmg = dmgK > 0 ? 10 * dmgK * s.caster.atk * N.Types.mult('psychic', e.types || ['normal']) : 0;
      try { if (dmg > 0) { e.hurt(dmg, o.color || s.t.ring, e.x - x, e.y - y, o.knock || 0); N.Stats.dmg(s.owner, s.t.move, dmg); } else if (o.knock) e.hurt(1, o.color || s.t.ring, e.x - x, e.y - y, o.knock); } catch (_) {}
      if (o.stun && (!o.stunChance || Math.random() < o.stunChance)) try { e.applyStun(o.stun); } catch (_) {}
      if (o.slow) try { e.applySlow(o.slow, o.slowT || 2); } catch (_) {}
      n++; }
    try { N.FX.ring(x, y, 10, radius, o.color || s.t.ring, 0.6, 6); } catch (_) {}
    return n;
  }
  function teamMembers() { const L = [owner]; for (const d of IDS) { const s = allies[d]; if (s && !s.dead && s.spawnT >= CFG.spawnTime) L.push(s); } return L; }
  function healTeam(frac, s) { for (const m of teamMembers()) { const amt = (Number(m.maxHp) || 100) * frac; if (m === owner) { try { owner.heal(amt); } catch (_) { owner.hp = Math.min(owner.maxHp, owner.hp + amt); } } else { m.hp = Math.min(m.maxHp, m.hp + amt); say(m.x, m.y - 44, '+' + Math.round(amt), '#5fe08a'); } }
    try { E().FX.ring(owner.x, owner.y, 8, 120, s.t.ring, 0.5, 5); } catch (_) {} }
  const near = (c, r) => foes().filter(e => dist(e, c) < r);
  function densest(c, r) { let best = null, bn = 0; for (const e of near(c, r)) { const n = near(e, 110).length; if (n > bn) { bn = n; best = e; } } return best; }
  const SKILLS = {
    480: [   // Uxie
      { lv: 1, cd: 3.5, use: s => near(s, 120).length > 0 && blast(s, s.x, s.y, 120, 0.8 * lvlMul(s), { stun: 0.7, stunChance: 0.5 }) },
      { lv: 2, cd: 10, use: s => cosmic(s) },
      { lv: 3, cd: 12, use: s => (s.hp < s.maxHp * 0.6 || owner.hp < owner.maxHp * 0.5) && recover(s) },
      { lv: 4, cd: 7, use: s => near(s, 160).length >= 2 && shove(s) }],
    481: [   // Mesprit
      { lv: 1, cd: 9, use: s => teamMembers().some(m => m.hp < m.maxHp * 0.7) && (healTeam(0.08 * lvlMul(s), s), say(s.x, s.y - 50, 'Heal Pulse', s.t.ring), true) },
      { lv: 2, cd: 8, use: s => near(owner, 170).length >= 3 && (blast(s, owner.x, owner.y, 170, 0.3, { slow: 0.5, slowT: 3, stun: 0.9, stunChance: 0.6, color: '#ffb0e0' }), say(s.x, s.y - 50, 'Lullaby', s.t.ring), emit('skill', { dex: 481, skill: 'lullaby' }), true) },
      { lv: 3, cd: 14, use: s => owner.hp < owner.maxHp * 0.45 && (team.protect = 0.35, team.protectT = 4, say(owner.x, owner.y - 60, 'Protect!', s.t.ring), sfx('shield'), emit('skill', { dex: 481, skill: 'protect' }), true) },
      { lv: 4, cd: 22, use: s => teamMembers().some(m => m.hp < m.maxHp * 0.4) && (healTeam(0.3, s), say(s.x, s.y - 50, 'Healing Wish', s.t.ring), sfx('levelup'), emit('skill', { dex: 481, skill: 'wish' }), true) }],
    482: [   // Azelf
      { lv: 2, cd: 12, use: s => near(s, 300).length > 0 && (owner.addBuff('atk', 0.12, 6, 3), say(s.x, s.y - 50, 'Nasty Plot! ATK ↑', s.t.ring), emit('skill', { dex: 482, skill: 'plot' }), true) },
      { lv: 3, cd: 9, use: s => futureSight(s) },
      { lv: 4, cd: 12, use: s => { const tg = foes().filter(e => dist(e, s) < 320).sort((a, b) => (b.maxHp || 0) - (a.maxHp || 0))[0]; if (!tg) return false;
        blast(s, tg.x, tg.y, 40, 6 * lvlMul(s), { knock: 120, color: '#9ad0ff' }); say(tg.x, tg.y - 50, 'Psycho Boost!', s.t.ring); sfx('boss'); emit('skill', { dex: 482, skill: 'boost' }); return true; } }] };
  function cosmic(s) { emit('skill', { dex: 480, skill: 'cosmic' }); team.guard = Math.min(guardCap(s), team.guard + 0.1); team.guardT = 8; say(s.x, s.y - 50, 'Cosmic Power! DEF ↑ ' + Math.round(team.guard * 100) + '%', s.t.ring); sfx('shield'); for (const m of teamMembers()) try { E().FX.ring(m.x, m.y, 6, 50, '#ffe27a', 0.5, 4); } catch (_) {} return true; }
  function recover(s) { emit('skill', { dex: 480, skill: 'recover' }); s.hp = Math.min(s.maxHp, s.hp + s.maxHp * 0.3); try { owner.heal(owner.maxHp * 0.08); } catch (_) {} owner.addBuff('regen', Math.max(1, owner.maxHp * 0.01), 6, 3); say(s.x, s.y - 50, 'Recover', '#5fe08a'); return true; }
  function shove(s) { emit('skill', { dex: 480, skill: 'shove' }); blast(s, s.x, s.y, 160, 1.2 * lvlMul(s), { knock: 260, stun: 1.2 }); say(s.x, s.y - 50, 'Psychic Shove!', s.t.ring); sfx('quake'); return true; }
  function futureSight(s) { const tg = densest(s, 360); if (!tg) return false; emit('skill', { dex: 482, skill: 'future' }); sights.push({ s, x: tg.x, y: tg.y, t: 0, dur: 1.2, r: 120 }); say(s.x, s.y - 50, 'Future Sight', s.t.ring); return true; }
  // the move's cooldown: call the ally, or use its signature command
  function command(dex) {
    const s = allies[dex];
    if (!s) { summon(dex); return; }
    if (s.dead) { if ((E().Game.st?.time ?? 0) >= s.respawnAt) { delete allies[dex]; summon(dex, true); } return; }
    if (s.spawnT < CFG.spawnTime) return;
    if (dex === 480) { cosmic(s); if (s.lvl >= 4) shove(s); }
    else if (dex === 481) { healTeam(0.1 * lvlMul(s), s); say(s.x, s.y - 50, 'Heal Pulse', s.t.ring); }
    else { if (!futureSight(s)) owner.addBuff('atk', 0.12, 6, 3); }
  }

  // ---- AI ----
  function update(dt) {
    const N = E(), p = N?.Game?.player;
    if (!p || !isTrio(p.dex) || p.dead) { if (owner) clearAll(); return; }
    if (p !== owner) { clearAll(); owner = p; }
    if (N.Game.state !== 'playing') return;
    // came through a Rift or any teleport: bring the team along
    if (ownerPos && Math.hypot(p.x - ownerPos.x, p.y - ownerPos.y) > 420) for (const d of IDS) { const s = allies[d]; if (s) { s.x = p.x + s.side * 70; s.y = p.y + 8; s.path = []; } }
    ownerPos = { x: p.x, y: p.y };
    if ((team.guardT -= dt) <= 0) team.guard = 0; if ((team.protectT -= dt) <= 0) team.protect = 0;
    for (let i = sights.length - 1; i >= 0; i--) { const f = sights[i]; f.t += dt; if (f.t >= f.dur) { blast(f.s, f.x, f.y, f.r, 4 * lvlMul(f.s), { knock: 140, color: '#9ad0ff' }); sfx('boss'); sights.splice(i, 1); } }
    for (let i = fx.length - 1; i >= 0; i--) { fx[i].t += dt; if (fx[i].t > fx[i].life) fx.splice(i, 1); }
    const enemies = N.EnemyMgr.all().filter(e => e && !e.dead);
    for (const d of IDS) {
      const s = allies[d]; if (!s) continue; s.age += dt;
      if (s.dead) { s.melt += dt; continue; }
      if (s.spawnT < CFG.spawnTime) { s.spawnT += dt; if (s.anim) { s.anim.loop('Idle'); s.anim.update(dt); } if (s.spawnT >= CFG.spawnTime) { say(s.x, s.y - 50, s.name + '!', s.t.ring); try { N.FX.burst(s.x, s.y - 20, s.t.drop[1], 24, 200); } catch (_) {} emit('arrive', { dex: d, again: s.again }); } continue; }
      const m = moveOf(p, d); s.lvl = m?.lvl || s.lvl || 1;
      const mh = hpFor(s); if (mh !== s.maxHp) { s.hp = s.hp / s.maxHp * mh; s.maxHp = mh; }
      if (s.low && s.hp > s.maxHp * 0.8) s.low = false;
      let regen = 0; try { regen = Number(s.caster.regen) || 0; } catch (_) {} s.hp = Math.min(s.maxHp, s.hp + regen * dt);
      for (const k of ['invuln', 'reviveShield', 'shadeInv', 'balloonCd']) s.caster[k] = Math.max(0, (Number(s.caster[k]) || 0) - dt);   // the engine's hit i-frames wear off
      s.hurtCd = Math.max(0, s.hurtCd - dt); s.stunT = Math.max(0, s.stunT - dt); s.slowT = Math.max(0, s.slowT - dt);
      // target: enemies close to you (Azelf hunts further out)
      let target = null, best = Infinity;
      for (const e of enemies) { if (dist(e, p) > s.t.leash) continue; const sc = dist(s, e) - ((e.behavior === 'thief' || e.golden) ? 400 : 0); if (sc < best) { best = sc; target = e; } }
      s.target = target;
      const post = { x: p.x + s.side * 70, y: p.y + 10 };
      let goal = null, stop = 0;
      const kitId = s.t.kit[s.kitI % s.t.kit.length], def = N.Moves.BY_ID[kitId] ? N.Moves.instance(kitId, Math.min(N.Moves.BY_ID[kitId].maxLvl || 1, s.lvl)) : null;
      const range = def && window.PS_HOOPA?.attackRange ? window.PS_HOOPA.attackRange(def) : { min: 0, ideal: s.t.ideal, max: 260 };
      if (target) { const a = Math.atan2(s.y - target.y, s.x - target.x), want = Math.min(range.ideal, s.t.ideal * 1.6); goal = { x: target.x + Math.cos(a) * want, y: target.y + Math.sin(a) * want }; stop = 6; }
      else if (dist(s, post) > s.t.dead) { goal = post; stop = s.t.dead * 0.5; }   // Uxie only catches up when it drifts far
      const spd = Math.max(60, Number(s.caster.spd) || 110) * s.t.spd * (s.slowT > 0 ? 0.5 : 1);
      let moved = false;
      if (goal && s.stunT <= 0) { const dd = dist(s, goal); const step = Math.min(Math.max(0, dd - stop), spd * dt);
        if (step > 0.5) { moved = true; try { if (window.PS_HOOPA?.navigate) window.PS_HOOPA.navigate(s, goal, step, dt, enemies); else { const a = Math.atan2(goal.y - s.y, goal.x - s.x); s.x += Math.cos(a) * step; s.y += Math.sin(a) * step; } } catch (_) {} } }
      // keep the trio from stacking on each other and on you
      for (const o of [p, ...IDS.map(x => allies[x]).filter(o => o && o !== s && !o.dead)]) { let dx = s.x - o.x, dy = s.y - o.y, dd = Math.hypot(dx, dy); if (dd < 40) { if (dd < 0.01) { dx = s.side; dy = 0; dd = 1; } const push = Math.min(40 - dd, 80 * dt); s.x += dx / dd * push; s.y += dy / dd * push; } }
      try { N.World.collide(s); } catch (_) {}
      if (s.anim) { s.anim.loop(moved ? 'Walk' : 'Idle'); if (target) s.anim.dir = N.Sprites.dirFromAngle(Math.atan2(target.y - s.y, target.x - s.x)); else if (!moved) s.anim.dir = N.Sprites.dirFromAngle(Math.atan2(p.y - s.y, p.x - s.x)); s.anim.update(dt); }
      if (s.stunT > 0) continue;
      // attack with its own moves (they level up with the summon move)
      s.next -= dt;
      if (def && target && s.next <= 0) { const d2 = dist(s, target); if (d2 >= range.min && d2 <= range.max) {
        s.aim = Math.atan2(target.y - s.y, target.x - s.x);
        try { N.Player.prototype.cast.call(s.caster, def); N.Combat.hoopaCast(s.caster, def); } catch (err) { console.warn('[lake]', err); }
        s.kitI++; s.next = Math.max(0.3, (def.cd || 1) * (Number(s.caster.cdK) || 1) * (d === 482 ? 0.8 : 1)); } }
      for (const sk of SKILLS[d]) { const k = sk.lv + ''; s.cd[k] = (s.cd[k] || 0) - dt; if (s.lvl >= sk.lv && s.cd[k] <= 0) { let used = false; try { used = !!sk.use(s); } catch (err) { console.warn('[lake]', err); } s.cd[k] = used ? sk.cd * (Number(s.caster.cdK) || 1) / (s.lvl >= 5 ? 1.25 : 1) : 0.5; } }
    }
  }

  // ================= engine hooks =================
  let hooked = false;
  function hook() {
    const N = E(); if (hooked || !N || !N.Combat || !N.EnemyMgr || !N.Ult || !N.Enemy || !N.Player) return; hooked = true;
    // the move: its cooldown calls the ally or its command (works from any move slot, like Hyperspace Hole)
    const prevCast = window.PS_CAST;
    window.PS_CAST = function (pl, def, hit, ghost) { if (def && MOVE_DEX[def.psCast]) return; return prevCast ? prevCast.apply(this, arguments) : undefined; };
    const tick = N.Combat.tick;
    N.Combat.tick = function (dt, pl) {
      const mine = pl && isTrio(pl.dex) && Array.isArray(pl.moves) ? pl.moves.filter(m => m && MOVE_DEX[m.id]) : [];
      if (!mine.length) return tick.apply(this, arguments);
      const saved = mine.map(m => m.t); for (const m of mine) m.t = Infinity;
      try { return tick.apply(this, arguments); }
      finally { mine.forEach((m, i) => { m.t = saved[i];
        if (pl === N.Game.player && !pl.dead && N.Game.state === 'playing') { if (owner !== pl) { clearAll(); owner = pl; }
          m.t = Math.max(0, (Number.isFinite(m.t) ? m.t : 0) - dt); if (m.t <= 0) { command(MOVE_DEX[m.id]); m.t = (m.cd || CFG.moveCd) * (Number(pl.cdK) || 1); } } }); }
    };
    // AI before the enemies move; contact and enemy shots hit the allies after
    const emu = N.EnemyMgr.update;
    N.EnemyMgr.update = function (dt) {
      try { update(dt); } catch (err) { console.warn('[lake]', err); }
      const r = emu.apply(this, arguments);
      if (owner && N.Game.state === 'playing') for (const d of IDS) { const s = allies[d]; if (!s || s.dead || s.spawnT < CFG.spawnTime) continue;
        for (const e of N.EnemyMgr.all()) if (e && !e.dead && dist(s, e) < s.r + (e.r || 12)) { let dmg = 0; try { dmg = typeof e.dmg === 'function' ? e.dmg() : e.dmg; } catch (_) {} hurt(s, Number(dmg) || 8, e.atkType); }
        const shots = N.Projectiles.all(); for (let i = shots.length - 1; i >= 0; i--) { const q = shots[i]; if (!q || q.friendly || q.ghost || dist(s, q) > s.r + (q.r || 4)) continue; hurt(s, q.pct ? Math.max(q.dmg, s.maxHp * q.pct) : q.dmg, q.mtype); shots.splice(i, 1); } }
      return r;
    };
    // enemies go for the trio too (Uxie draws them in)
    const eup = N.Enemy.prototype.update, aggro = new WeakMap();
    N.Enemy.prototype.update = function (dt, target) {
      if (owner && owner === N.Game.player && !owner.dead) { const live = IDS.map(d => allies[d]).filter(s => s && !s.dead && s.spawnT >= CFG.spawnTime);
        if (live.length) { let a = aggro.get(this); if (!a || (a.t -= dt) <= 0 || a.c.dead) { let best = owner, bs = dist(this, owner);
            for (const s of live) { const sc = dist(this, s) - (s.dex === 480 ? 140 : 0); if (sc < bs) { bs = sc; best = s; } } a = { c: best, t: 0.75 }; aggro.set(this, a); this.__lakeAggro = best === owner ? null : best.name; }
          if (a.c !== owner) { arguments[1] = a.c.caster || a.c; target = arguments[1]; } } }
      return eup.apply(this, arguments);
    };
    // shared defense: Cosmic Power, Protect, and Uxie's own toughness
    const H = window.PS_HOOKS || (window.PS_HOOKS = {}), take = H.take;
    H.take = function (type, who, amt) { let m = take ? take.apply(this, arguments) : 1;
      try { if (owner && (who === owner || (who && who.psLake))) { m *= (1 - team.guard) * (1 - team.protect); if (who.psLake && who.psLake.dex === 480) m *= TRIO[480].take; } } catch (_) {} return m; };
    // Z-Move: 3x damage, twice the cooldown (only the Lake Guardians)
    const P = N.Projectiles, C = N.Combat; let zScope = false;
    const addField = C.addField;
    if (typeof addField === 'function') C.addField = function (f) { if (zScope && f) { if (Number.isFinite(f.dmg)) f.dmg *= CFG.zDmg; if (Number.isFinite(f.dps)) f.dps *= CFG.zDmg; } return addField.apply(this, arguments); };
    const zWrap = fn => function (actor) {
      if (!(actor && actor === N.Game.player && isTrio(actor.dex))) return fn.apply(this, arguments);
      const before = new Set(P.all()); zScope = true; let r;
      try { r = fn.apply(this, arguments); } finally { zScope = false; for (const q of P.all()) if (!before.has(q) && q.friendly && !q.__lakeZ) { q.__lakeZ = true; if (Number.isFinite(q.dmg)) q.dmg *= CFG.zDmg; } }
      return r; };
    const ucast = N.Ult.cast, uupd = N.Ult.update;
    const zc = zWrap(ucast); N.Ult.cast = function (actor) { const r = zc.apply(this, arguments); if (r && actor && actor === N.Game.player && isTrio(actor.dex)) { actor.ultCd = (Number(N.Ult.CD) || 90) * CFG.zCd; emit('z', { dex: Number(actor.dex) }); } return r; };
    N.Ult.update = zWrap(uupd);
    // drawing (world space, under the HUD)
    const du = N.Ult.drawUnits;
    N.Ult.drawUnits = function (ctx) { du.apply(this, arguments); try { draw(ctx); } catch (err) { console.warn('[lake]', err); } };
  }

  // ================= drawing =================
  function drop(ctx, x, y, s, u) {   // the water drop: falls, splashes, rises into the Pokemon's shape
    const [hi, mid, lo] = s.t.drop, H = 46;
    ctx.save();
    if (u < 0.35) { const k = u / 0.35, yy = y - 130 * (1 - k * k);   // falling drop with a little trail
      ctx.globalAlpha = 0.35; ctx.fillStyle = mid; ctx.fillRect(x - 1.5, yy - 26, 3, 22); ctx.globalAlpha = 1;
      tear(ctx, x, yy, 7, 13, hi, mid, lo); }
    const pk = Math.min(1, Math.max(0, (u - 0.32) / 0.2)), pf = u > 1.15 ? Math.max(0, 1 - (u - 1.15) / 0.25) : 1;
    if (u > 0.32) { // puddle + ripple
      ctx.globalAlpha = 0.75 * pf; const g = ctx.createRadialGradient(x, y, 1, x, y, 30 * pk); g.addColorStop(0, hi); g.addColorStop(0.6, mid); g.addColorStop(1, lo); ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(x, y, 28 * pk, 10 * pk, 0, 0, TAU); ctx.fill();
      const rk = Math.min(1, (u - 0.32) / 0.5); ctx.globalAlpha = (1 - rk) * 0.8; ctx.strokeStyle = hi; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y, 20 + 30 * rk, 7 + 11 * rk, 0, 0, TAU); ctx.stroke();
      if (u < 0.7) for (let i = 0; i < 6; i++) { const a = -Math.PI * (0.15 + 0.7 * i / 5), k = (u - 0.32) / 0.38, r = 26 * k; ctx.globalAlpha = 1 - k; ctx.fillStyle = mid; ctx.beginPath(); ctx.arc(x + Math.cos(a) * r, y - 6 + Math.sin(a) * r * 0.9 + 22 * k * k, 2.4, 0, TAU); ctx.fill(); } }
    if (u > 0.55 && u < 1.35) { // the column of water rising and taking shape
      const k = Math.min(1, (u - 0.55) / 0.55), h = H * (1 - Math.pow(1 - k, 3)), w = 15 - 4 * k, wob = Math.sin(u * 22) * 2 * (1 - k), fade = u > 1.0 ? Math.max(0, 1 - (u - 1.0) / 0.35) : 1;
      ctx.globalAlpha = 0.85 * fade; const g = ctx.createLinearGradient(x, y, x, y - h); g.addColorStop(0, lo); g.addColorStop(0.5, mid); g.addColorStop(1, hi); ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(x - w, y); ctx.bezierCurveTo(x - w - 4 + wob, y - h * 0.45, x - w * 0.9, y - h * 0.9, x + wob, y - h); ctx.bezierCurveTo(x + w * 0.9, y - h * 0.9, x + w + 4 + wob, y - h * 0.45, x + w, y); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 0.5 * fade; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(x - w * 0.35 + wob, y - h * 0.6, 2.5, h * 0.18, 0, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  function tear(ctx, x, y, w, h, hi, mid, lo) { const g = ctx.createLinearGradient(x, y - h, x, y + w); g.addColorStop(0, hi); g.addColorStop(0.6, mid); g.addColorStop(1, lo); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, y - h); ctx.bezierCurveTo(x + w * 0.4, y - h * 0.4, x + w, y - w * 0.2, x + w, y + w * 0.2); ctx.arc(x, y + w * 0.2, w, 0, Math.PI); ctx.bezierCurveTo(x - w, y - w * 0.2, x - w * 0.4, y - h * 0.4, x, y - h); ctx.fill(); }
  function draw(ctx) {
    if (!owner || owner !== E().Game.player) return; const now = performance.now() / 1000;
    // Future Sight markers
    for (const f of sights) { const k = f.t / f.dur; ctx.save(); ctx.globalAlpha = 0.25 + 0.4 * k; ctx.strokeStyle = '#9ad0ff'; ctx.lineWidth = 3; ctx.setLineDash([8, 6]); ctx.lineDashOffset = -now * 40;
      ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r * k, f.r * 0.45 * k, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 0.15 * k; ctx.fillStyle = '#5ab0ff'; ctx.fill(); ctx.restore(); }
    // shared shield glow (Cosmic Power / Protect)
    const sh = Math.max(team.guard, team.protect);
    if (sh > 0) for (const m of teamMembers()) { ctx.save(); ctx.globalAlpha = 0.25 + sh; ctx.strokeStyle = team.protect > 0 ? '#ff9ad8' : '#ffe27a'; ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) { const a = now * 0.8 + i * TAU / 6, R = 26; ctx.beginPath(); ctx.moveTo(m.x + Math.cos(a) * R, m.y - 18 + Math.sin(a) * R * 0.9); const b = a + TAU / 6; ctx.lineTo(m.x + Math.cos(b) * R, m.y - 18 + Math.sin(b) * R * 0.9); ctx.stroke(); } ctx.restore(); }
    for (const d of IDS) { const s = allies[d]; if (!s) continue;
      if (s.dead) { const k = Math.min(1, s.melt / CFG.meltTime); if (k < 1) { if (s.anim) { ctx.save(); ctx.globalAlpha = 1 - k; s.anim.draw(ctx, s.x, s.y); ctx.restore(); } drop(ctx, s.x, s.y, s, 1.35 - k * 0.8); } continue; }
      if (s.spawnT < CFG.spawnTime) { drop(ctx, s.x, s.y, s, s.spawnT); if (s.anim && s.spawnT > 0.95) { ctx.save(); ctx.globalAlpha = Math.min(1, (s.spawnT - 0.95) / 0.4); s.anim.draw(ctx, s.x, s.y); ctx.restore(); } continue; }
      ctx.save(); ctx.strokeStyle = s.t.ring; ctx.lineWidth = 2.5; ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.ellipse(s.x, s.y, 20, 7.5, 0, 0, TAU); ctx.stroke(); ctx.restore();
      if (s.anim) s.anim.draw(ctx, s.x, s.y);
      ctx.save(); ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = '#1a1030'; ctx.fillStyle = '#fff';
      const label = (s.shiny ? '★ ' : '') + s.name + ' · ' + s.t.role + ' · Lv' + s.lvl; ctx.strokeText(label, s.x, s.y - 50); ctx.fillText(label, s.x, s.y - 50);
      ctx.fillStyle = '#25152f'; ctx.fillRect(s.x - 22, s.y - 44, 44, 4); ctx.fillStyle = s.t.ring; ctx.fillRect(s.x - 22, s.y - 44, 44 * Math.max(0, s.hp / s.maxHp), 4); ctx.restore(); }
  }

  // ================= boot =================
  (function boot() { try { register(); hookPool(); hook(); } catch (err) { console.warn('[lake]', err); } if (!(registered && hooked)) setTimeout(boot, 200); else setInterval(() => { try { hookPool(); } catch (_) {} }, 1000); })();
  window.PS_LAKE = { cfg: CFG, trio: TRIO, team, get allies() { return IDS.map(d => allies[d]).filter(Boolean).map(s => ({ dex: s.dex, name: s.name, hp: Math.round(s.hp), maxHp: s.maxHp, lvl: s.lvl, dead: s.dead, spawning: s.spawnT < CFG.spawnTime, x: s.x, y: s.y })); },
    _ally: dex => allies[Number(dex)] || null,
    summon: dex => { const p = player(); if (!p || !isTrio(p.dex) || Number(dex) === Number(p.dex)) return null; if (owner !== p) { clearAll(); owner = p; } delete allies[dex]; return !!summon(Number(dex)); } };
})();
