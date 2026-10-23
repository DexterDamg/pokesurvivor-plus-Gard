/* DIGGER BROTHERS — KAMINA (Excadrill) and his little bro SIMON (Drilbur), a Gurren Lagann nod: Simon the Digger is
   a shy 14-year-old kid. In this mode Excadrill goes by Kamina and Drilbur by Simon (the HUD, the talk box and the
   labels). Portraits: assets/portraits/530.png (Kamina), 529.png (Simon: that sheet only has Normal and Worried, the
   talk box picks the closer one).
   - Playing as Excadrill (Kamina), he passively calls Simon, who digs his way up out of the ground beside you. If
     Simon goes down, he burrows away and digs back up 25 s later.
   - Simon barely fights: he sidesteps shots, runs from anything that gets close and stays tucked behind Kamina.
     But he is a great scavenger: he picks up drops (a held item becomes his; XP, coins and the rest go to you),
     opens chests, waits at a big chest until it opens and activates the power-up crystals. Only when he is truly
     cornered (an enemy right on him and nowhere left to run) does he scratch back.
   - The two of them talk a lot (shy little bro, loud big bro): arriving, loot, bosses, level-ups, low HP...
   - ONCE PER RUN, the hit that would knock Kamina out (with Simon around) starts a scene instead. Simon breaks
     down... and Kamina tells him not to believe in him — believe in the you who believes in yourself! Then Kamina
     dies. Simon cries... then gets up, angry and determined, with Kamina's cape on his back: "My bro is dead...
     I'm ME! Simon the Digger!" From then on YOU play as Simon for the rest of the run: same level, moves and items,
     full HP, +50% Attack, a Spiral aura and Kamina's red cape. Kamina's grave (a mound with his shades) stays.
   Solo: the battle freezes during the scene (click / Enter / Space skips to Simon's last words). Co-op: nothing
   freezes. Needs js/lake-trio.js (movement helpers) and js/lake-talk.js (talk box). */
(() => {
  'use strict';
  if (window.PS_DIGGER_INSTALLED) return; window.PS_DIGGER_INSTALLED = true;
  const E = () => window.PS_HOOPA_ENGINE, B = () => window.PS_MEGA_BRIDGE_V5, TAU = Math.PI * 2;
  const DRIL = 529, EXCA = 530;
  const CFG = { first: 2, resummon: 25, emerge: 1.3, hp: 0.9, atk: 0.7, spd: 1.15, panic: 170, leash: 300, jobRange: 320, jobSafe: 150,
    corner: 55, scratchCd: 1.1, simonAtk: 1.5, gap: 9, lowHp: 0.3 };
  const K = () => window.PS_LAKE?.kit, T = () => window.PS_LAKE_TALK;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const sfx = n => { try { E().Audio.sfx(n); } catch (_) {} };
  const txt = (x, y, t, c) => { try { E().FX.dmgText(x, y, t, c || '#fff'); } catch (_) {} };
  const pick = L => L[Math.floor(Math.random() * L.length)];

  // ================= lines: [face, text, emote] =================
  const D = {   // Simon (Drilbur): shy, meek, a digger who believes in Kamina
    arrive: [['worried', 'K-Kamina? I\'m here... I\'ll stay behind you, okay?', 'sweat'], ['normal', 'I dug my way over, Kamina! ...Was that okay?', 'note'], ['worried', 'Kamina! W-wait for me!', 'sweat']],
    back: [['normal', 'I\'m back, Kamina! I dug the long way around...', 'note'], ['worried', 'S-sorry I left. I\'m okay now, Kamina.', 'sweat'], ['normal', 'Did you miss me? ...You didn\'t, did you.', 'dots']],
    scared: [['worried', 'Eek! T-too many of them...!', 'sweat'], ['worried', 'I-I\'ll just... stay over here...', 'sweat'], ['worried', 'Kamina, they\'re looking at me!', 'sweat'], ['worried', 'Kamina! Kamina! KAMINA!', 'exclaim']],
    item: [['normal', 'I found something! ...Can I keep it, Kamina?', 'note'], ['normal', 'Ooh... I\'ll hold onto this one.', 'note'], ['normal', 'Look, Kamina! It was buried right here!', 'spark']],
    chest: [['normal', 'I-I opened it! There was stuff inside!', 'note'], ['normal', 'Kamina, look! Treasure!', 'spark']],
    bigchest: [['worried', 'It\'s so heavy... j-just a little longer...', 'sweat'], ['worried', 'Kamina, c-cover me... this lid is stuck...', 'sweat']],
    crystal: [['normal', 'This crystal\'s humming... it\'s for you, Kamina!', 'spark'], ['normal', 'I touched the shiny rock! Do you feel stronger, Kamina?', 'spark']],
    cornered: [['worried', 'S-stay back! I\'ll... I\'ll fight if I have to!', 'anger'], ['worried', 'Nowhere left to dig... okay... okay, here goes!', 'anger'], ['worried', 'Kamina would never run... so I won\'t either!', 'anger']],
    faint: [['worried', 'Sorry, Kamina... I\'ll dig back up soon...', 'tear'], ['worried', 'Kamina... I messed up...', 'tear']],
    idle: [['normal', 'Kamina... do you really think we can dig all the way to the sky?', 'dots'], ['worried', 'I\'m just a digger... but I\'ll dig for you, Kamina.', 'dots'], ['normal', 'Everyone back in the village laughed at me... not you, though.', 'heart'],
      ['normal', 'Kamina, your shades are crooked again...', 'dots'], ['normal', 'Is the surface always this big, Kamina?', 'question'], ['normal', 'Kamina... thanks for taking me with you.', 'heart'],
      ['worried', 'Kamina, do you ever get scared? ...Of course you don\'t.', 'dots'], ['normal', 'I found a perfect little drill bit today. I\'m keeping it forever.', 'note']],
    kamHurt: [['worried', 'Kamina! You\'re hurt!', 'sweat'], ['worried', 'K-Kamina, please be careful!', 'sweat'], ['worried', 'Kamina, you\'re bleeding! Slow down!', 'tear']],
    boss: [['worried', 'Kamina... th-that one\'s HUGE!', 'sweat'], ['worried', 'W-we\'re fighting THAT?!', 'exclaim']],
    levelup: [['normal', 'Kamina, you\'re getting even stronger!', 'spark'], ['normal', 'Wow... Kamina\'s shining!', 'heart']],
    alone: [['normal', 'Kamina... are you watching? I\'m still digging.', 'dots'], ['worried', 'I\'m scared... but I\'m not running. Not anymore.', 'sweat'], ['normal', 'Who the hell do you think I am?! ...I\'m Simon the Digger!', 'spark'],
      ['normal', 'My drill is the drill that\'ll pierce the heavens!', 'spark'], ['worried', '...I miss you, Kamina.', 'tear'], ['normal', 'Kick reason to the curb... and do the impossible!', 'exclaim'],
      ['normal', 'I can feel his cape on my back. I\'m not alone.', 'heart'], ['normal', 'I\'m not my bro. I\'m ME!', 'exclaim'], ['normal', 'Once I\'ve dug through, it means I\'ve won!', 'spark']],
    aloneBoss: [['normal', 'That one\'s huge... doesn\'t matter. I\'ll drill right through it!', 'anger'], ['normal', 'Kamina... watch this one!', 'spark']],
    aloneHurt: [['worried', 'I won\'t stop... not here... not ever!', 'anger'], ['normal', 'If you\'re gonna dig, dig to the heavens!', 'spark']],
    aloneLevel: [['normal', 'I\'m getting stronger, Kamina. Can you see it?', 'heart']] };
  const X = {   // Kamina (Excadrill): loud, fearless, the best big bro
    arrive: [['joyous', 'That\'s my bro! Stick close, Simon, and watch your big bro work!', 'heart'], ['determined', 'Simon! Grab anything shiny — I\'ll handle the punching!', 'exclaim'], ['happy', 'The Gurren Brigade rides again! Right, Simon?!', 'spark']],
    back: [['happy', 'There he is! Knew you\'d dig your way back, Simon!', 'heart'], ['joyous', 'Simon! That\'s my unbreakable little bro!', 'heart']],
    scared: [['shouting', 'Don\'t flinch, Simon! Your big bro\'s right here!', 'exclaim'], ['angry', 'Oi! Nobody scares my little bro!', 'anger'], ['shouting', 'Simon, get behind me! NOW!', 'exclaim']],
    loot: [['happy', 'Ha! Great find, Simon! That\'s my digger!', 'note'], ['joyous', 'Look at him go! Best digger in the whole world!', 'heart'], ['happy', 'Simon\'s got the nose for treasure! I\'ve got the fists!', 'note']],
    cornered: [['shouting', 'That\'s it, Simon! Show \'em what you\'ve got!', 'exclaim'], ['joyous', 'THAT\'S my bro! Drill \'em, Simon!', 'heart']],
    hurt: [['angry', 'You DARE lay a claw on my brother?!', 'anger'], ['shouting', 'Hands off Simon, you punks!', 'anger']],
    faint: [['shouting', 'SIMON!! ...Tch. He\'ll dig his way back. He always does.', 'exclaim']],
    idle: [['determined', 'Kick reason to the curb, Simon! We do the impossible!', 'spark'], ['happy', 'Who the hell do you think I am?!', 'exclaim'], ['inspired', 'One day we\'ll dig straight through to the sky, Simon!', 'spark'],
      ['shouting', 'Simon! Who the hell do you think WE are?!', 'exclaim'], ['determined', 'Don\'t look down, Simon! Look UP!', 'spark'], ['happy', 'If your drill ever stops spinning, Simon, I\'ll spin it for ya!', 'heart'],
      ['inspired', 'Listen up, Simon! Our drill is the drill that\'ll pierce the heavens!', 'spark'], ['joyous', 'These shades? Pure style, Simon. You\'ll get it when you\'re older.', 'note']],
    lowHp: [['happy', 'This? Just a scratch, Simon! Ha!', 'note'], ['determined', 'Don\'t worry about me, Simon! I\'ve had worse!', 'exclaim'], ['shouting', 'A man doesn\'t go down to THIS!', 'anger']],
    boss: [['joyous', 'Ha! The bigger they are, the harder they fall! Right, Simon?!', 'exclaim'], ['determined', 'Simon! Watch your big bro bring THAT one down!', 'spark'], ['shouting', 'Bring it on, big guy! The Gurren Brigade fears NOTHING!', 'anger']],
    levelup: [['joyous', 'Feel that, Simon?! I\'m getting stronger by the second!', 'spark'], ['happy', 'Level up! The Gurren Brigade\'s legend grows!', 'note']] };

  // ================= the bro =================
  let owner = null, bro = null, nextAt = 0, usedRun = null, spiral = false, lastLine = -1e9, idleT = 60, cs = null, simon = null, grave = null, watch = { lvl: 0, low: false, bosses: new WeakSet(), lowAt: -1e9 };
  const named = (dex, name) => Object.assign({}, E().DEX_BY[dex], { name });   // this Excadrill is Kamina, this Drilbur is Simon
  const clock = () => performance.now() / 1000;
  function talk(dex, list, o) { if (!list) return false; const l = pick(list); try { return T().line(dex, l[0], l[1], l[2], o); } catch (_) { return false; } }
  function both(first, a, b, chance) {   // a line, then (sometimes) the other brother answers
    const now = clock(); if (now - lastLine < CFG.gap) return; if (talk(first === DRIL ? DRIL : EXCA, a, { prio: true })) { lastLine = now; if (b && Math.random() < (chance ?? 0.6)) talk(first === DRIL ? EXCA : DRIL, b, { follow: true, delay: 0.3 }); } }
  const SHARE = ['atkMul', 'atkPerm', 'spdMul', 'spdPerm', 'cdMul', 'cdPerm', 'critChance', 'critPerm', 'regenFlat', 'regenPct', 'reductionBase', 'defBonus', 'buffs', 'powers', 'level', 'magnet', 'xpMul', 'coinMul', 'atkItemK'];
  function makeActor(s) {
    const N = E(), a = new N.Player(N.DEX_BY[DRIL], {}, s.shiny); s.caster = a; a.psDigger = s;
    for (const k of ['x', 'y', 'r', 'bodyH', 'anim', 'dead', 'hp', 'maxHp', 'aim', 'target']) Object.defineProperty(a, k, { configurable: true, get: () => s[k], set: v => { s[k] = v; } });
    for (const k of SHARE) Object.defineProperty(a, k, { configurable: true, get: () => s.owner[k], set: () => {} });
    Object.defineProperty(a, 'item', { configurable: true, get: () => s.ownItem || s.owner.item, set: v => { s.ownItem = v; } });
    Object.defineProperty(a, 'baseAtk', { configurable: true, get: () => (Number(s.owner.baseAtk) || 1) * CFG.atk });
    Object.defineProperty(a, 'baseSpd', { configurable: true, get: () => Number(s.owner.baseSpd) || 100 });
    Object.defineProperty(a, 'floating', { configurable: true, get: () => false });
    a.hurt = (amt, type) => hurt(amt, type); a.ultCd = Infinity; a.ultT = 0;
  }
  function summon(again) {
    const N = E(), o = owner, k = K(); if (!N || !o || !k) return;
    let shiny = false; try { shiny = !!(N.DB.save && N.DB.save.shiny && N.DB.save.shiny[DRIL]) && N.Sprites.hasShiny(DRIL); } catch (_) {}
    const f = k.nearFree(o.x - 55, o.y + 25, 14);
    const s = { dex: DRIL, owner: o, x: f.x, y: f.y, r: 14, bodyH: 30, dead: false, emergeT: 0, again: !!again, shiny, path: [], mode: 'idle', hurtCd: 0, stunT: 0, slowT: 0, scratchT: 0, okX: f.x, okY: f.y, magnet: 60, anim: null };
    try { N.Sprites.preload([DRIL], 4000, shiny); s.anim = new N.Sprites.Animator(DRIL, 1, shiny); } catch (_) {}
    makeActor(s); s.maxHp = Math.max(30, Math.round((Number(o.maxHp) || 100) * CFG.hp)); s.hp = s.maxHp; bro = s; sfx('quake');
  }
  function hurt(amt, type, by) {
    const s = bro; if (!s || s.dead || s.thrown || s.emergeT < CFG.emerge || s.hurtCd > 0 || !Number.isFinite(amt) || amt <= 0) return;
    s.hurtCd = 0.35; const h = s.hp; try { E().Player.prototype.hurt.call(s.caster, amt, type); } catch (_) { s.hp -= amt; }
    if (s.hp <= 0 || s.dead) { s.hp = 0; s.dead = true; s.sink = 0; nextAt = (E().Game.st?.time ?? 0) + CFG.resummon; txt(s.x, s.y - 40, 'Simon burrowed away!', '#9ad8ff'); both(DRIL, D.faint, X.faint, 1); return; }
    if (h >= s.maxHp * 0.5 && s.hp < s.maxHp * 0.5) both(EXCA, X.hurt, null);
  }
  function clear() { bro = null; owner = null; spiral = false; }

  // ---- AI: stay safe, scavenge, fight only when cornered (or with Spiral power) ----
  function update(dt) {
    const N = E(), p = N?.Game?.player, k = K();
    if (simon && p !== simon) { simon = null; grave = null; }
    if (simon) { if (N.Game.state === 'playing' && !cs) simonUpdate(p, dt); return; }
    if (!p || Number(p.dex) !== EXCA || !k) { if (owner) clear(); return; }
    if (p !== owner) { clear(); owner = p; nextAt = (N.Game.st?.time ?? 0) + CFG.first; idleT = 50 + Math.random() * 30; watch = { lvl: Number(p.level) || 1, low: false, bosses: new WeakSet(), lowAt: -1e9 }; }
    if (!p.mon || p.mon.name !== 'Kamina') p.mon = named(EXCA, 'Kamina');
    if (N.Game.state !== 'playing' || cs) return;
    const now = N.Game.st?.time ?? 0;
    if (!bro || (bro.dead && bro.sink > 1.2)) { if (now >= nextAt && !p.dead) summon(!!bro); if (!bro) return; }
    const s = bro; s.owner = p;
    if (s.dead) { s.sink += dt; return; }
    if (s.thrown) return;   // Excadrill is bowling with him (js/kamina-moves.js)
    if (s.emergeT < CFG.emerge) { s.emergeT += dt; if (s.anim) { s.anim.loop('Idle'); s.anim.update(dt); } if (s.emergeT >= CFG.emerge) { both(DRIL, s.again ? D.back : D.arrive, s.again ? X.back : X.arrive, 0.9); } return; }
    for (const key of ['invuln', 'reviveShield', 'shadeInv', 'balloonCd']) s.caster[key] = Math.max(0, (Number(s.caster[key]) || 0) - dt);
    s.hurtCd = Math.max(0, s.hurtCd - dt); s.stunT = Math.max(0, s.stunT - dt); s.slowT = Math.max(0, s.slowT - dt); s.scratchT -= dt;
    let regen = 0; try { regen = Number(s.caster.regen) || 0; } catch (_) {} s.hp = Math.min(s.maxHp, s.hp + regen * dt);
    try { s.caster.berryTick(dt); } catch (_) {}
    if (p.dead) return;
    const enemies = N.EnemyMgr.all().filter(e => e && !e.dead), calm = e => !e.__role && !(e.__lakeConfT > 0) && !(e.__lakeFearT > 0);
    const near = enemies.filter(e => calm(e) && dist(e, s) < CFG.panic).sort((a, b) => dist(a, s) - dist(b, s));
    let goal = null, stop = 0, mode = 'follow';
    s.dodgeT = Math.max(0, (s.dodgeT || 0) - dt); if (s.dodgeT <= 0) { const q = k.incoming(s); if (q) { s.dodge = q; s.dodgeT = 0.3; } }
    if (near.length) {
      const esc = k.escapePoint(s, enemies, p), stuck = dist(esc, s) < 40 || (s.lastEsc && dist(s, s.lastEsc) < 6 && near[0] && dist(near[0], s) < CFG.corner);
      s.lastEsc = { x: s.x, y: s.y };
      if (near[0] && dist(near[0], s) < CFG.corner && stuck) { mode = 'cornered'; if (s.scratchT <= 0) { drillHit(s, near[0], 1); if (!s.saidCorner) { s.saidCorner = true; both(DRIL, D.cornered, X.cornered, 0.7); } } }
      else { goal = esc; mode = 'escape'; if (!s.scared) { s.scared = true; if (Math.random() < 0.35) both(DRIL, D.scared, X.scared, 0.6); } } }
    if (!near.length) { s.scared = false; s.saidCorner = false; }
    if (!goal && mode !== 'cornered') {
      if (dist(s, p) > CFG.leash * 1.3) { goal = { x: p.x - 50, y: p.y + 25 }; stop = 30; mode = 'regroup'; }
      else { const j = job(s, p, enemies); if (j) { goal = j.pos; stop = j.stop; mode = j.kind; }
        else if (dist(s, { x: p.x - 50, y: p.y + 25 }) > 60) { goal = { x: p.x - 50, y: p.y + 25 }; stop = 20; mode = 'follow'; } else mode = 'idle'; } }
    s.mode = mode; if (mode !== 'chest' && mode !== 'bigchest') s.chestTime = 0;
    const spd = Math.max(60, Number(s.caster.spd) || 110) * CFG.spd * (s.slowT > 0 ? 0.5 : 1) * (mode === 'escape' ? 1.4 : 1);
    let moved = false;
    if (s.dodgeT > 0 && s.dodge && s.stunT <= 0) { const st = spd * 1.8 * dt, nx = s.x + s.dodge.x * st, ny = s.y + s.dodge.y * st; if (k.freeAt(nx, ny, s.r)) { s.x = nx; s.y = ny; moved = true; goal = null; } }
    if (goal && s.stunT <= 0) { const dd = dist(s, goal), step = Math.min(Math.max(0, dd - stop), spd * dt);
      if (step > 0.5) { moved = true; try { if (window.PS_HOOPA?.navigate) window.PS_HOOPA.navigate(s, goal, step, dt, enemies); else { const a = Math.atan2(goal.y - s.y, goal.x - s.x); s.x += Math.cos(a) * step; s.y += Math.sin(a) * step; } } catch (_) {} } }
    { let dx = s.x - p.x, dy = s.y - p.y, dd = Math.hypot(dx, dy); if (dd < 34) { if (dd < 0.01) { dx = -1; dy = 0; dd = 1; } const push = Math.min(34 - dd, 80 * dt); s.x += dx / dd * push; s.y += dy / dd * push; } }
    try { N.World.collide(s); } catch (_) {}
    if (!k.freeAt(s.x, s.y, s.r)) { if (k.freeAt(s.okX, s.okY, s.r)) { s.x = s.okX; s.y = s.okY; } else { const f = k.nearFree(s.x, s.y, s.r); s.x = f.x; s.y = f.y; } s.path = []; }
    s.okX = s.x; s.okY = s.y;
    try { doJob(s, dt); } catch (err) { console.warn('[digger]', err); }
    if (s.anim) { s.anim.loop(moved ? 'Walk' : mode === 'cornered' || mode === 'fight' ? 'Attack' : 'Idle'); const look = goal || p; if (dist(look, s) > 2) s.anim.dir = N.Sprites.dirFromAngle(Math.atan2(look.y - s.y, look.x - s.x)); s.anim.update(dt); }
    events(p, enemies);
    if ((idleT -= dt) <= 0) { idleT = 40 + Math.random() * 30; if (!near.length) { if (Math.random() < 0.5) both(DRIL, D.idle, X.idle, 0.7); else both(EXCA, X.idle, D.idle, 0.6); } }
    try { T().place(DRIL, s); T().place(EXCA, p); } catch (_) {}
  }
  // things worth a word: a level-up, Kamina low on HP, a boss showing up
  function events(p, enemies) {
    const lv = Number(p.level) || 1; if (lv > watch.lvl) { const up = watch.lvl > 0; watch.lvl = lv; if (up && Math.random() < 0.5) both(EXCA, X.levelup, D.levelup, 0.6); }
    const low = p.hp < p.maxHp * CFG.lowHp, now = clock(); if (low && !watch.low && now - watch.lowAt > 40) { watch.lowAt = now; lastLine = -1e9; both(DRIL, D.kamHurt, X.lowHp, 0.9); } watch.low = low;
    const bs = enemies.find(e => (e.boss || e.legend) && !watch.bosses.has(e) && dist(e, p) < 460); if (bs) { watch.bosses.add(bs); lastLine = -1e9; both(EXCA, X.boss, D.boss, 0.8); }
  }
  function drillHit(s, e, mult) {
    const N = E(), dmg = 12 * mult * (Number(s.caster.atk) || 1) * N.Types.mult('ground', e.types || ['normal']);
    try { e.hurt(dmg, spiral ? '#7dff6a' : '#c8a070', e.x - s.x, e.y - s.y, spiral ? 140 : 90); N.Stats.dmg(s.owner, 'drill-run', dmg); if (!spiral) e.applyStun && e.applyStun(0.6); } catch (_) {}
    s.scratchT = spiral ? 0.55 : CFG.scratchCd; try { N.FX.burst(e.x, e.y - 10, spiral ? '#7dff6a' : '#c8a070', 10, 160); } catch (_) {}
  }
  // ---- scavenging: loot, crystals, chests (and waiting at the big chest) ----
  function job(s, p, enemies) {
    const N = E(), k = K(), clear = (pt, r) => !enemies.some(e => !(e.__lakeConfT > 0) && dist(e, pt) < r);
    if (!clear(s, 110)) return null;
    const ok = pt => dist(pt, p) < CFG.leash * 1.1 && clear(pt, CFG.jobSafe); let j = s.job;
    if (j) { const still = j.kind === 'crystal' ? !j.ref.used : j.kind === 'loot' ? N.Pickups.all().includes(j.ref) : !j.ref.hoopaOpened && !j.ref.broken && k.chestsNear(j.ref.x, j.ref.y, 8).some(c => k.keyOf(c) === k.keyOf(j.ref));
      if (!still || dist(j.ref, p) > CFG.leash * 1.3 || !clear(j.ref, 90)) j = s.job = null; }
    if (!j) {
      const alt = (N.World.specialsNear(s.x, s.y, CFG.jobRange + 180) || []).filter(c => c && c.type === 'altar' && !c.used && c.kind !== 4 && ok(c)).sort((a, b) => dist(a, s) - dist(b, s))[0];
      const ch = !alt && k.chestsNear(s.x, s.y, CFG.jobRange).filter(ok).sort((a, b) => dist(a, s) - dist(b, s))[0];
      const loot = !alt && !ch && N.Pickups.all().filter(d => d && dist(d, s) < CFG.jobRange && ok(d)).sort((a, b) => (dist(a, s) - (a.kind === 'item' ? 200 : 0)) - (dist(b, s) - (b.kind === 'item' ? 200 : 0)))[0];
      if (alt) j = { kind: 'crystal', ref: alt }; else if (ch) j = { kind: ch.type === 'bigchest' ? 'bigchest' : 'chest', ref: ch }; else if (loot) j = { kind: 'loot', ref: loot };
      s.job = j; }
    if (!j) return null;
    return { kind: j.kind, pos: { x: j.ref.x, y: j.ref.y }, stop: j.kind === 'loot' ? 0 : k.chestRange(s, j.ref) - 12 };
  }
  function doJob(s, dt) {
    const N = E(), k = K(), j = s.job; if (!j || s.mode !== j.kind) return;
    if (j.kind === 'crystal') { if (!j.ref.used && dist(s, j.ref) < k.chestRange(s, j.ref)) { N.Interact.hoopaActivateAltar(s.owner, j.ref); txt(s.x, s.y - 40, 'Power up!', '#9ad8ff'); s.job = null; both(DRIL, D.crystal, X.loot, 0.5); } return; }
    if (j.kind === 'chest' || j.kind === 'bigchest') { const c = j.ref; if (dist(s, c) > k.chestRange(s, c)) { s.chestTime = 0; return; } s.chestTime = (s.chestTime || 0) + dt;
      if (j.kind === 'bigchest') { if (!s.saidBig) { s.saidBig = true; both(DRIL, D.bigchest, null); } c.open = Math.max(c.open || 0, s.chestTime); if (s.chestTime >= (N.Interact.CHEST_TIME || 3.5)) { c.hoopaOpened = true; N.World.breakProp(c); s.job = null; s.chestTime = 0; s.saidBig = false; both(DRIL, D.chest, X.loot, 0.7); } }
      else if (s.chestTime >= 0.6) { c.hoopaOpened = true; N.World.breakProp(c); s.job = null; s.chestTime = 0; if (Math.random() < 0.4) both(DRIL, D.chest, X.loot, 0.5); } }
  }

  // ================= KAMINA'S WORDS (once per run) =================
  const SCRIPT = [
    [EXCA, 'stunned', 'Heh... looks like I... dug a little too deep this time, Simon...', 'dots', 'fall'],
    [DRIL, 'worried', 'K-Kamina?! No... no, no, no! Get up! You never stay down!', 'tear', 'run'],
    [DRIL, 'worried', 'I can\'t do this without you... I\'m just a digger... I only got this far because I believed in YOU, Kamina!', 'tear'],
    [EXCA, 'angry', 'Simon! Don\'t believe in me — that\'s STUPID!', 'anger'],
    [EXCA, 'shouting', 'Don\'t believe in the me who believes in you... Have faith in the YOU who believes in YOURSELF!', 'exclaim'],
    [EXCA, 'happy', 'Your drill... is the drill that\'ll pierce the heavens...', 'heart'],
    [EXCA, 'sigh', 'Go on, Simon... who the hell... do you think... you are...', 'dots', 'gone'],
    [DRIL, 'worried', '...Kamina? ...Kamina...? ...KAMINAAAAAAA!!!', 'tear', 'cry'],
    [DRIL, 'crying', '..........', 'tear'],
    [DRIL, 'worried', 'I can\'t... I\'m just a digger... Without you I\'m nothing...', 'tear'],
    [DRIL, 'worried', '...', 'dots', 'rise'],
    [DRIL, 'angry', 'My bro is dead. He\'s gone.', 'anger', 'stand'],
    [DRIL, 'determined', 'But he\'s right there on my back... and here in my heart.', 'heart', 'cape'],
    [DRIL, 'determined', 'He lives on as a part of me!', 'spark', 'aura'],
    [DRIL, 'determined', 'If you\'re gonna dig, dig to the heavens.', 'spark'],
    [DRIL, 'angry', 'No matter what\'s in my way, I won\'t stop.', 'anger'],
    [DRIL, 'shouting', 'Once I\'ve dug through, it means that I\'ve won!', 'exclaim'],
    [DRIL, 'shouting', 'Just who the hell do you think I am?', 'exclaim'],
    [DRIL, 'determined', 'I\'m Simon. I\'m not my bro.', 'spark'],
    [DRIL, 'shouting', 'I\'m ME! Simon the Digger!', 'exclaim', 'swap']];
  function start(p) {
    const N = E(), solo = !(N.Coop && N.Coop.active); usedRun = p;
    cs = { p, i: -1, next: 0, solo, aura: 0, dim: 0 };
    if (solo) { try { B().game.soloHold(true); } catch (_) {} }
    window.PS_DIGGER.active = true;
  }
  const dur = t => Math.max(2.2, Math.min(4.8, 1.1 + t.length * 0.038));
  function advance() {
    const c = cs; c.i++; const st = SCRIPT[c.i]; if (st === undefined) return finish();
    const [who, face, text, em, act] = st;
    if (act === 'fall' || act === 'gone') { c.fallen = true; try { c.p.anim.play('Faint'); } catch (_) {} if (act === 'gone') { c.gone = true; sfx('faint'); } }
    if (act === 'run') c.run = true;
    if (act === 'cry') c.cry = true;
    if (act === 'rise') { c.cry = false; c.rise = true; sfx('charge'); }
    if (act === 'stand') { c.stand = true; sfx('quake'); try { B().camera?.kick?.(0.4); } catch (_) {} }
    if (act === 'cape') { c.cape = true; sfx('shield'); }
    if (act === 'aura') { c.aura = 0.01; sfx('legend'); }
    if (act === 'swap') { becomeSimon(c); c.title = 1; c.flash = 1; sfx('boss'); try { B().camera?.kick?.(1); } catch (_) {} }
    const d = act === 'swap' ? 3.2 : dur(text); try { T().cut(who, face, text, em, d); } catch (_) {} c.next = d;
  }
  // Excadrill is gone: the player now IS Drilbur (level, moves, items and run progress all carry over)
  function becomeSimon(c) {
    if (c.swapped) return; c.swapped = true; c.gone = true;
    const N = E(), p = c.p, s = bro, old = { x: p.x, y: p.y, anim: null };
    try { old.anim = new N.Sprites.Animator(EXCA, 1, !!p.shiny); old.anim.dir = p.anim && p.anim.dir; old.anim.play('Faint'); } catch (_) {}
    grave = { x: p.x, y: p.y, t: 0, anim: old.anim };
    let fresh = null, was = null; try { fresh = new N.Player(N.DEX_BY[DRIL], {}, !!(s && s.shiny)); was = new N.Player(N.DEX_BY[EXCA], {}, false); } catch (_) {}
    const ratio = fresh && was ? fresh.maxHp / was.maxHp : 0.8;
    p.mon = named(DRIL, 'Simon'); p.dex = DRIL; p.shiny = !!(s && s.shiny); p.__skin = undefined;
    if (fresh) { p.r = fresh.r; p.bodyH = fresh.bodyH; p.baseSpd = fresh.baseSpd; p.baseAtk = fresh.baseAtk; }
    try { N.Sprites.preload([DRIL], 4000, p.shiny); p.anim = new N.Sprites.Animator(DRIL, 1, p.shiny); } catch (_) {}
    p.maxHp = Math.max(1, Math.round(p.maxHp * ratio)); p.hp = p.maxHp; p.dead = false; c.up = true;
    p.atkPerm = (Number(p.atkPerm) || 1) * CFG.simonAtk;
    if (s) { p.x = s.x; p.y = s.y; if (s.ownItem && !p.item) { try { p.equip(s.ownItem); } catch (_) {} } }
    bro = null; owner = null; spiral = true; simon = p; idleT = 40; watch = { lvl: Number(p.level) || 1, low: false, bosses: new WeakSet(), lowAt: -1e9 };
    // his determination knocks back everything around him (no damage — he just won't be stopped)
    try { for (const e of N.EnemyMgr.all()) { if (!e || e.dead) continue; const d = Math.hypot(e.x - p.x, e.y - p.y); if (d < 260) { const k = K(), a = Math.atan2(e.y - p.y, e.x - p.x), nx = e.x + Math.cos(a) * (260 - d) * 0.6, ny = e.y + Math.sin(a) * (260 - d) * 0.6; if (!k || k.freeAt(nx, ny, e.r || 12)) { e.x = nx; e.y = ny; } } } } catch (_) {}
    try { T().place(DRIL, p); T().place(EXCA, grave); } catch (_) {}
    window.dispatchEvent(new CustomEvent('ps-digger', { detail: { type: 'simon' } }));
  }
  // playing as Simon: now and then he talks to Kamina
  function simonUpdate(p, dt) {
    if (grave) grave.t += dt;
    if (!p.mon || p.mon.name !== 'Simon') p.mon = named(DRIL, 'Simon');
    try { T().place(DRIL, p); } catch (_) {}
    const enemies = E().EnemyMgr.all().filter(e => e && !e.dead);
    const bs = enemies.find(e => (e.boss || e.legend) && !watch.bosses.has(e) && dist(e, p) < 460); if (bs) { watch.bosses.add(bs); talk(DRIL, D.aloneBoss, { prio: true }); }
    const low = p.hp < p.maxHp * CFG.lowHp, now = clock(); if (low && !watch.low && now - watch.lowAt > 40) { watch.lowAt = now; talk(DRIL, D.aloneHurt, { prio: true }); } watch.low = low;
    const lv = Number(p.level) || 1; if (lv > watch.lvl) { watch.lvl = lv; if (Math.random() < 0.4) talk(DRIL, D.aloneLevel, { prio: true }); }
    if ((idleT -= dt) <= 0) { idleT = 45 + Math.random() * 35; talk(DRIL, D.alone, { prio: true }); }
  }
  function finish() { const c = cs; if (!c) return; if (!c.swapped && c.p === E()?.Game?.player && !c.p.dead) becomeSimon(c); cs = null; window.PS_DIGGER.active = false; if (c.solo) { try { B().game.soloHold(false); } catch (_) {} } if (c.swapped) { c.p.dead = false; c.p.hp = Math.max(c.p.hp, 1); c.p.invuln = Math.max(Number(c.p.invuln) || 0, 2.5); } }

  // ================= engine hooks =================
  let hooked = false;
  function hook() {
    const N = E(); if (hooked || !N || !N.EnemyMgr || !N.Enemy || !N.Player || !N.Pickups || !N.Interact) return; hooked = true;
    const emu = N.EnemyMgr.update;
    N.EnemyMgr.update = function () {
      try { update(arguments[0]); } catch (err) { console.warn('[digger]', err); }
      const r = emu.apply(this, arguments); const s = bro;
      if (s && !s.dead && !s.thrown && s.emergeT >= CFG.emerge && N.Game.state === 'playing') {
        for (const e of N.EnemyMgr.all()) if (e && !e.dead && !e.__role && dist(s, e) < s.r + (e.r || 12)) { let d = 0; try { d = typeof e.dmg === 'function' ? e.dmg() : e.dmg; } catch (_) {} hurt(Number(d) || 8, e.atkType, e); }
        const shots = N.Projectiles.all(); for (let i = shots.length - 1; i >= 0; i--) { const q = shots[i]; if (!q || q.friendly || q.ghost || dist(s, q) > s.r + (q.r || 4)) continue; hurt(q.pct ? Math.max(q.dmg, s.maxHp * q.pct) : q.dmg, q.mtype); shots.splice(i, 1); } }
      return r; };
    // enemies mostly go for the loud one; Drilbur only draws them when he's much closer (or has his Spiral power)
    const eup = N.Enemy.prototype.update;
    N.Enemy.prototype.update = function (dt) { const s = bro;
      if (s && !s.dead && !s.thrown && !this.__role && s.emergeT >= CFG.emerge && owner && owner === N.Game.player && !(this.__lakeConfT > 0) && !(this.__lakeFearT > 0)) {
        if (dist(this, s) + (spiral ? 0 : 80) < (owner.dead ? Infinity : dist(this, owner))) arguments[1] = s.caster; }
      return eup.apply(this, arguments); };
    // pseudo-player: he collects drops — a held item is his, the rest goes to you
    const pu = N.Pickups.update;
    N.Pickups.update = function (dt, players, onCollect) { const s = bro;
      if (!s || s.dead || s.emergeT < CFG.emerge || !owner || owner !== N.Game.player || typeof onCollect !== 'function') return pu.apply(this, arguments);
      const col = Array.isArray(players) ? players.slice() : [players]; col.push(s);
      return pu.call(this, dt, col, (drop, c) => { if (c === s) { if (drop && drop.kind === 'item' && N.Items.BY && N.Items.BY[drop.value]) { try { s.caster.equip(drop.value); } catch (_) { s.ownItem = drop.value; } if (!s.ownItem) s.ownItem = drop.value;
          txt(s.x, s.y - 44, 'Simon kept ' + (K()?.itemName ? K().itemName(drop.value) : drop.value), '#9ad8ff'); both(DRIL, D.item, X.loot, 0.6); return; } return onCollect(drop, owner); } return onCollect(drop, c); }); };
    const iu = N.Interact.update;
    N.Interact.update = function () { const s = bro, held = s && s.mode === 'bigchest' && s.job && s.chestTime > 0 ? { c: s.job.ref, open: s.chestTime } : null; const r = iu.apply(this, arguments); if (held && !held.c.hoopaOpened) held.c.open = Math.max(held.c.open || 0, held.open); return r; };
    // Kamina's words: the hit that would end Excadrill (with Drilbur around), once per run
    const ph = N.Player.prototype.hurt;
    N.Player.prototype.hurt = function () { const me = this === N.Game.player && !this.psDigger && !this.psLake && Number(this.dex) === EXCA, up = !this.dead && this.hp > 0;
      const r = ph.apply(this, arguments);
      if (me && up && (this.dead || this.hp <= 0) && !cs && usedRun !== this && bro && !bro.dead && bro.emergeT >= CFG.emerge) { this.dead = false; this.hp = 1; this.invuln = Math.max(Number(this.invuln) || 0, 3); start(this); }
      return r; };
    // depth-sorted drawing (with trees, rocks, enemies, players)
    const td = N.Training && N.Training.drawables;
    if (typeof td === 'function') N.Training.drawables = function () { let r = td.apply(this, arguments); if (!Array.isArray(r)) r = []; const s = bro; if (s && owner && owner === N.Game.player) r.push({ y: s.y, draw: g => drawBody(g, s) }); const gv = grave; if (gv && simon && simon === N.Game.player) { r.push({ y: gv.y - 1, draw: g => drawGrave(g, gv) }); if (!simon.dead) r.push({ y: simon.y - 0.01, draw: g => cape(g, simon, simon.anim) }); } return r; };
    const du = N.Ult.drawUnits;
    N.Ult.drawUnits = function (ctx) { du.apply(this, arguments); try { drawTop(ctx); } catch (err) { console.warn('[digger]', err); } };
  }
  // ================= drawing =================
  function mound(ctx, x, y, u) { const r = 22 * Math.min(1, u * 1.6); ctx.save(); ctx.fillStyle = '#6a4a2a'; ctx.beginPath(); ctx.ellipse(x, y + 2, r, r * 0.42, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#8a6438'; ctx.beginPath(); ctx.ellipse(x, y, r * 0.8, r * 0.3, 0, 0, TAU); ctx.fill();
    for (let i = 0; i < 6; i++) { const a = -Math.PI * (0.1 + 0.8 * i / 5), k = (u * 3 + i * 0.17) % 1; ctx.fillStyle = i % 2 ? '#8a6438' : '#5a3a1c'; ctx.fillRect(x + Math.cos(a) * 18 * k - 2, y - 6 + Math.sin(a) * 26 * k + 30 * k * k, 4, 4); } ctx.restore(); }
  function drawBody(ctx, s) {
    if (s.thrown) return;
    const now = clock();
    if (s.dead) { const u = Math.min(1, (s.sink || 0) / 1.2); mound(ctx, s.x, s.y, 1 - u); if (s.anim && u < 1) { ctx.save(); ctx.beginPath(); ctx.rect(s.x - 40, s.y - 80, 80, 82); ctx.clip(); ctx.globalAlpha = 1 - u; s.anim.draw(ctx, s.x, s.y + u * 34); ctx.restore(); } return; }
    if (s.emergeT < CFG.emerge) { const u = s.emergeT / CFG.emerge; mound(ctx, s.x, s.y, u); if (s.anim && u > 0.35) { const up = (u - 0.35) / 0.65; ctx.save(); ctx.beginPath(); ctx.rect(s.x - 40, s.y - 80, 80, 82); ctx.clip(); s.anim.draw(ctx, s.x, s.y + (1 - up) * 34); ctx.restore(); } return; }
    if (spiral) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(125,255,106,.6)'; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i < 40; i++) { const a = i * 0.5 + now * 6, r = 4 + i * 0.6; ctx.lineTo(s.x + Math.cos(a) * r, s.y - 14 + Math.sin(a) * r * 0.5); } ctx.stroke(); ctx.restore(); }
    ctx.save(); ctx.strokeStyle = spiral ? '#7dff6a' : '#9ad8ff'; ctx.lineWidth = 2.2; ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.ellipse(s.x, s.y, 17, 6.5, 0, 0, TAU); ctx.stroke(); ctx.restore();
    if (cs && cs.cape) cape(ctx, s, s.anim);
    if (s.anim) s.anim.draw(ctx, s.x, s.y);
  }
  // where Excadrill fell: his body sinks into a mound of earth, and his pointed shades stay on top of it
  function drawGrave(ctx, g) {
    const u = Math.min(1, g.t / 5);
    ctx.save(); ctx.fillStyle = '#5a3a1c'; ctx.beginPath(); ctx.ellipse(g.x, g.y + 2, 26 * u + 4, 10 * u + 2, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#7a5530'; ctx.beginPath(); ctx.ellipse(g.x, g.y - 2 * u, 20 * u + 2, 7 * u + 1, 0, 0, TAU); ctx.fill(); ctx.restore();
    if (g.anim && u < 1) { ctx.save(); ctx.globalAlpha = 1 - u; ctx.beginPath(); ctx.rect(g.x - 60, g.y - 100, 120, 103); ctx.clip(); try { g.anim.update(0.016); g.anim.draw(ctx, g.x, g.y + u * 20); } catch (_) {} ctx.restore(); }
    if (u > 0.4) { ctx.save(); ctx.globalAlpha = Math.min(1, (u - 0.4) / 0.4); ctx.translate(g.x, g.y - 8 * u - 3); ctx.fillStyle = '#e8402a'; ctx.strokeStyle = '#2a0a0a'; ctx.lineWidth = 1.2;
      for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sd * 2, -2); ctx.lineTo(sd * 15, -7); ctx.lineTo(sd * 11, 2); ctx.lineTo(sd * 3, 1); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      ctx.fillStyle = '#2a0a0a'; ctx.fillRect(-3, -2, 6, 2); ctx.restore(); }
  }
  // Kamina's red cape, now on Simon's back (drawn just behind him)
  function cape(ctx, s, anim) {
    const now = clock(), dir = anim && Number.isFinite(anim.dir) ? anim.dir : 0, side = [0, -1, -1, -1, 0, 1, 1, 1][dir & 7] || 0, up = dir === 4 || dir === 3 || dir === 5;
    const x = s.x - side * 3, top = s.y - 24, bot = s.y + 1, w1 = 8, w2 = 15 + Math.sin(now * 5) * 1.5, sway = Math.sin(now * 3.2) * 3 - side * 4;
    ctx.save(); if (up) ctx.globalAlpha = 1; ctx.fillStyle = '#c81e1e'; ctx.strokeStyle = '#5a0606'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(x - w1, top); ctx.lineTo(x + w1, top);
    ctx.quadraticCurveTo(x + w2 + sway * 0.5, (top + bot) / 2, x + w2 + sway, bot);
    for (let i = 3; i >= 0; i--) { const fx = x - w2 + sway + (2 * w2) * (i / 3), fy = bot + Math.sin(now * 8 + i) * 2; ctx.lineTo(fx, fy); }
    ctx.quadraticCurveTo(x - w2 + sway * 0.5, (top + bot) / 2, x - w1, top); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,120,120,.35)'; ctx.fillRect(x - w1 + 2, top + 1, 2 * w1 - 4, 2); ctx.restore();
  }
  function drawSimonAura(ctx, p) { const now = clock(); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(125,255,106,.55)'; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i < 44; i++) { const a = i * 0.5 + now * 6, r = 5 + i * 0.65; ctx.lineTo(p.x + Math.cos(a) * r, p.y - 14 + Math.sin(a) * r * 0.5); } ctx.stroke(); ctx.restore(); }
  function drawTop(ctx) {
    if (simon && simon === E().Game.player && !simon.dead) { drawSimonAura(ctx, simon); return; }
    const s = bro; if (!s || !owner || owner !== E().Game.player || s.dead || s.thrown || s.emergeT < CFG.emerge) return;
    ctx.save(); ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = '#1a1030'; ctx.fillStyle = spiral ? '#7dff6a' : '#fff';
    const label = (s.shiny ? '★ ' : '') + 'Simon · ' + (s.mode === 'escape' ? 'Hiding' : s.mode === 'cornered' ? 'Cornered!' : 'Digger') + (s.ownItem ? ' · ' + (K()?.itemName ? K().itemName(s.ownItem) : s.ownItem) : '');
    ctx.strokeText(label, s.x, s.y - 44); ctx.fillText(label, s.x, s.y - 44);
    ctx.fillStyle = '#25152f'; ctx.fillRect(s.x - 20, s.y - 38, 40, 4); ctx.fillStyle = spiral ? '#7dff6a' : '#9ad8ff'; ctx.fillRect(s.x - 20, s.y - 38, 40 * Math.max(0, s.hp / s.maxHp), 4); ctx.restore();
  }
  // the scene overlay: the world dims while Kamina is down; Simon's resolve blooms as a green spiral
  const ov = document.createElement('canvas'); ov.id = 'ps-digger'; ov.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;z-index:56;display:none';
  function gameCanvas() { let b = null, ar = 0; for (const c of document.querySelectorAll('canvas')) { if (c.id && c.id.startsWith('ps-')) continue; const r = c.getBoundingClientRect(), a = r.width * r.height; if (a > ar) { ar = a; b = { c, r }; } } return b; }
  function drawScene(dt) {
    const c = cs; if (!c) { if (ov.style.display !== 'none') ov.style.display = 'none'; return; }
    ov.style.display = 'block'; const ctx = ov.getContext('2d'), dpr = Math.min(2, devicePixelRatio || 1), W = innerWidth, H = innerHeight, now = clock();
    if (ov.width !== Math.round(W * dpr) || ov.height !== Math.round(H * dpr)) { ov.width = Math.round(W * dpr); ov.height = Math.round(H * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    const cam = B()?.camera, g = gameCanvas(); if (!cam || !g || typeof cam.left !== 'function') return;
    const k = cam.scale * (Number(cam._cw) > 0 ? g.r.width / cam._cw : 1), sx = x => g.r.left + (x - cam.left()) * k, sy = y => g.r.top + (y - cam.top()) * k;
    const want = c.aura ? 0.25 : c.rise ? 0.45 : c.gone ? 0.65 : Math.min(0.45, (c.i + 1) * 0.08); c.dim += (want - c.dim) * Math.min(1, dt * 2);
    ctx.fillStyle = 'rgba(0,0,8,' + c.dim + ')'; ctx.fillRect(0, 0, W, H);
    const s = simon || bro, who = simon ? simon : s;
    if (c.cry && who) { const X = sx(who.x), Y = sy(who.y - 20);   // tears
      if (!c.tears) c.tears = []; if (Math.random() < dt * 18) c.tears.push({ x: X + (Math.random() < 0.5 ? -6 : 6) * k, y: Y, vx: (Math.random() - 0.5) * 40, vy: -20, t: 0 });
      ctx.fillStyle = '#8fd0ff'; for (const t of c.tears) { t.t += dt; t.vy += 260 * dt; t.x += t.vx * dt; t.y += t.vy * dt; ctx.globalAlpha = Math.max(0, 1 - t.t / 0.9); ctx.beginPath(); ctx.arc(t.x, t.y, 2.5 * k, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1; c.tears = c.tears.filter(t => t.t < 0.9); }
    if (c.rise && who) { const X = sx(who.x), Y = sy(who.y - 14), u = Math.min(1, (c.riseT = (c.riseT || 0) + dt) / 2);   // light gathers into him
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 24; i++) { const a = i / 24 * TAU + now * 0.6, r = (1 - ((now * 0.8 + i * 0.37) % 1)) * 220 * k; ctx.fillStyle = `rgba(150,255,140,${0.5 * u})`; ctx.beginPath(); ctx.arc(X + Math.cos(a) * r, Y + Math.sin(a) * r * 0.7, 2.4 * k, 0, TAU); ctx.fill(); } ctx.restore(); }
    if (c.aura && who) { c.aura = Math.min(1, c.aura + dt * 0.8); const X = sx(who.x), Y = sy(who.y - 14);   // the Spiral: a green spiral blooming around Simon
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let arm = 0; arm < 3; arm++) { ctx.strokeStyle = 'rgba(125,255,106,' + (0.8 * c.aura) + ')'; ctx.lineWidth = 4; ctx.beginPath();
        for (let i = 0; i < 70; i++) { const a = i * 0.22 + now * 5 + arm * TAU / 3, r = i * 2.4 * c.aura * k; ctx.lineTo(X + Math.cos(a) * r, Y + Math.sin(a) * r); } ctx.stroke(); }
      const gr = ctx.createRadialGradient(X, Y, 2, X, Y, 120 * k * c.aura); gr.addColorStop(0, 'rgba(180,255,160,.6)'); gr.addColorStop(1, 'rgba(60,200,60,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(X, Y, 120 * k * c.aura, 0, TAU); ctx.fill(); ctx.restore(); }
    if (c.flash > 0) { ctx.fillStyle = 'rgba(220,255,210,' + c.flash * 0.8 + ')'; ctx.fillRect(0, 0, W, H); c.flash = Math.max(0, c.flash - dt * 1.5); }
    if (c.title) { c.titleT = (c.titleT || 0) + dt; const u = Math.min(1, c.titleT / 0.3), size = Math.round(Math.min(W / 11, 72) * (1.4 - 0.4 * u));
      ctx.save(); ctx.globalAlpha = c.titleT > 2.6 ? Math.max(0, 1 - (c.titleT - 2.6) / 0.5) : 1; ctx.font = '900 ' + size + 'px Pixelify, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 9; ctx.strokeStyle = '#062a06';
      const t = 'SIMON THE DIGGER!', y = H * 0.28; ctx.strokeText(t, W / 2, y); const gr = ctx.createLinearGradient(0, y - size, 0, y); gr.addColorStop(0, '#e8ffd8'); gr.addColorStop(1, '#3ad83a'); ctx.fillStyle = gr; ctx.fillText(t, W / 2, y); ctx.restore(); }
    if (c.solo && !c.swapped) { ctx.font = '13px Pixelify, system-ui, sans-serif'; ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillText('Click / Enter: skip', W - 14, H - 14); }
  }
  function skip() { const c = cs; if (!c || c.swapped) return; c.fallen = c.gone = c.rise = c.stand = c.cape = true; c.cry = false; c.aura = c.aura || 0.5; try { c.p.anim.play('Faint'); } catch (_) {} c.i = SCRIPT.length - 2; c.next = 0; }
  addEventListener('keydown', e => { if (!cs || !cs.solo) return; const k = (e.key || '').toLowerCase(); if (k === 'enter' || k === ' ' || k === 'escape') { e.preventDefault(); e.stopImmediatePropagation(); skip(); } }, true);
  addEventListener('pointerdown', () => { if (cs && cs.solo) skip(); }, true);

  let last = performance.now();
  function loop(now) { requestAnimationFrame(loop); const dt = Math.min(0.1, (now - last) / 1000); last = now;
    try { hook(); const c = cs;
      if (c) { const g = B()?.game; if (!g || g.player !== c.p || g.state === 'over' || g.state === 'ui') finish();
        else { c.p.invuln = Math.max(Number(c.p.invuln) || 0, 0.5); if (c.p.dead) c.p.dead = false; if (!c.up) c.p.hp = 1; else c.p.hp = Math.max(c.p.hp, 1);
          if (c.fallen && !c.swapped && c.p.anim) { try { if (c.p.anim.cur !== 'Faint') c.p.anim.play('Faint'); c.p.anim.update(dt); } catch (_) {} }
          const s = bro; if (c.run && s && !c.swapped) { const tx = c.p.x - 30, ty = c.p.y + 6, d = Math.hypot(tx - s.x, ty - s.y); if (d > 3) { const st = Math.min(d, 170 * dt); s.x += (tx - s.x) / d * st; s.y += (ty - s.y) / d * st; } if (s.anim) { s.anim.loop(d > 3 ? 'Walk' : 'Idle'); s.anim.dir = E().Sprites.dirFromAngle(Math.atan2(c.p.y - s.y, c.p.x - s.x)); s.anim.update(dt); } }
          c.next -= dt; if (c.next <= 0) advance(); } }
      drawScene(dt); } catch (e) { console.warn('[digger]', e); } }
  function init() { document.body.append(ov); requestAnimationFrame(loop); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
  window.PS_DIGGER = { active: false, cfg: CFG, get bro() { return bro && { hp: Math.round(bro.hp), maxHp: bro.maxHp, dead: bro.dead, emerging: bro.emergeT < CFG.emerge, mode: bro.mode, item: bro.ownItem || null, spiral, x: bro.x, y: bro.y }; },
    _bro: () => bro, get simon() { return !!simon && simon === E()?.Game?.player; }, get grave() { return grave && { x: grave.x, y: grave.y }; }, get used() { return usedRun === E()?.Game?.player; }, get scene() { return cs && { step: cs.i, swapped: !!cs.swapped }; } };
})();
