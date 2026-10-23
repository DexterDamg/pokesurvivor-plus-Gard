/* WILD LIFE — the dungeon feels alive, Pokemon Mystery Dungeon style.
   - PEACEFUL POKEMON: some wild Pokemon aren't enemies at all. They roam and wander, nap, hum, greet you when you
     walk by ("Oh! A traveler!") and run away squeaking when the fighting gets close. They can't be hurt and don't
     get in your way. Some of the enemies that show up turn out to be peaceful too.
   - HABITAT SCENES: now and then, a little moment of nature plays out near you while you fight: a male Ralts
     proposing to a female Ralts, Jigglypuff's concert putting everyone to sleep (and her getting mad about it),
     Munchlax sneaking a berry from a sleeping Snorlax, Meowth stealing Rattata's Gold Ball, Sudowoodo pretending
     to be a tree... with their own lines in the talk box.
   - GRUDGES: some enemies hate each other more than they hate you. A Rattata attacks another Rattata because it
     stole its Gold Ball! They shout it out, then brawl (both get hurt) until one drops or they call a truce.
   - CHANGE OF HEART: some enemies realize they'd rather be on your side ("Why am I even fighting you...?"). They
     stop, think it over and JOIN you as an ally (up to 2): they follow you, fight your enemies with their own type,
     take hits, chat, and leave when they faint. A badly hurt enemy may also beg to come with you.
   - ENEMIES TALK AND EMOTE: taunts when they spot you, panic at low HP, bosses introduce themselves, and their
     emotes (! ? anger, sweat) pop over their heads.
   Lines go to the talk box from js/lake-talk.js (up to three speakers at once, stacked), with each Pokemon's
   portrait. Grudges, changes of heart and enemies turning peaceful only happen in solo (co-op keeps every
   player's enemies in sync); everything else is drawn on your own screen only. */
(() => {
  'use strict';
  if (window.PS_WILD_INSTALLED) return; window.PS_WILD_INSTALLED = true;
  const E = () => window.PS_HOOPA_ENGINE, TAU = Math.PI * 2;
  const CFG = { toWild: 0.05, grudge: 0.035, turn: 0.02, lowTurn: 0.03, maxAllies: 2, maxCritters: 12, sceneFirst: [25, 40], sceneEvery: [50, 80], roamEvery: [30, 50],
    despawn: 1500, taunt: 0.06, spotEmote: 0.14, feudTime: 20, allyCd: 1.1, allyRange: 280 };
  const T = () => window.PS_LAKE_TALK, K = () => window.PS_LAKE?.kit;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = L => L[Math.floor(Math.random() * L.length)];
  const sfx = n => { try { E().Audio.sfx(n); } catch (_) {} };
  const txt = (x, y, t, c) => { try { E().FX.dmgText(x, y, t, c || '#fff'); } catch (_) {} };
  const free = (x, y, r) => { const k = K(); if (k) return k.freeAt(x, y, r); try { return E().World.isFree(x, y, Math.max(6, r * 0.6)); } catch (_) { return true; } };
  const solo = () => !(E().Coop && E().Coop.active);
  const nameOf = dex => (E().DEX_BY[dex] && E().DEX_BY[dex].name) || ('#' + dex);
  const label = w => w.name + (w.g === 'm' ? ' ♂' : w.g === 'f' ? ' ♀' : '');
  const COL = { wild: '#c8ffaa', foe: '#ffb0a0', ally: '#9ad8ff' };
  function say(w, kind, face, text, em, o) { o = o || {}; try { return T().line(w.dex, face, text.replace(/\{(\w+)\}/g, (_, k) => o[k] || ''), em, Object.assign({ name: label(w), color: COL[kind], kind, obj: w, shiny: w.shiny }, o)); } catch (_) { return false; } }
  const emo = (w, k) => { try { T().emoteAt(w, k); } catch (_) {} };
  const sizes = {};   // dex -> { r, bodyH } (from a throwaway Player, cached)
  function sizeOf(dex) { if (sizes[dex]) return sizes[dex]; let r = 12, h = 40; try { const pl = new (E().Player)(E().DEX_BY[dex], {}, false); r = pl.r || r; h = pl.bodyH || h; } catch (_) {} return (sizes[dex] = { r, bodyH: h }); }

  // ================= lines =================
  const LN = {
    meet: [['happy', 'Oh! A traveler! Be careful out there, okay?', 'note'], ['normal', 'Nice day for a walk, isn\'t it?', 'note'], ['worried', 'P-please don\'t hurt me... I\'m just passing through!', 'sweat'],
      ['worried', 'The mean ones have been extra grumpy lately...', 'sweat'], ['happy', 'Mmm... this spot is so sunny and warm.', 'note'], ['sad', 'Have you seen my friend? ...No? Okay...', 'dots'],
      ['joyous', 'Are you an explorer? That\'s so cool!', 'spark'], ['normal', 'Shh... I\'m looking for berries.', 'dots'], ['happy', 'You look strong! Could you keep the bullies away from here?', 'note']],
    scared: [['worried', 'Eek! Not again!', 'sweat'], ['worried', 'Run away, run away!', 'sweat'], ['crying', 'Somebody help!', 'tear']],
    taunt: [['angry', 'This is OUR turf! Get lost!', 'anger'], ['shouting', 'An intruder! Get \'em!', 'exclaim'], ['angry', 'You don\'t belong here!', 'anger'], ['happy', 'Hah! You look weak!', 'note'],
      ['determined', 'Finally, something to beat up!', 'anger'], ['angry', 'Grrr... outsider!', 'anger'], ['shouting', 'You picked the wrong dungeon!', 'exclaim']],
    low: [['pain', 'I-I\'ll remember this!', 'sweat'], ['worried', 'Ow ow ow! Retreat!', 'sweat'], ['angry', 'N-no fair!', 'anger'], ['pain', 'You haven\'t seen the last of me!', 'sweat']],
    avenge: [['angry', 'N-no! You\'ll pay for that!', 'anger'], ['shouting', 'Buddy!! ...You MONSTER!', 'anger']],
    boss: [['determined', 'So YOU\'RE the one making all this noise...', 'anger'], ['angry', 'This is MY domain. Leave... or be buried here.', 'anger'], ['inspired', 'Finally. A challenger worth my time.', 'spark']],
    thief: [['joyous', 'Shiny things are MINE!', 'spark'], ['happy', 'Ooh, what\'s in your bag? Gimme!', 'note']],
    turn1: [['worried', '...Wait. Why am I even fighting you?', 'question'], ['sad', 'These guys never even share their berries with me...', 'dots'], ['surprised', 'I\'ve been watching you fight... you\'re kind of amazing.', 'question']],
    turn2: [['joyous', 'You know what? I\'d rather team up with YOU!', 'heart'], ['happy', 'Forget them! Can I join your team?!', 'heart'], ['determined', 'I\'m switching sides! Let\'s go, partner!', 'heart']],
    beg: [['teary', 'P-please... I don\'t want to fight anymore... can I come with you instead?', 'tear']],
    allyKill: [['joyous', 'Got one!', 'spark'], ['determined', 'Take that!', 'anger'], ['happy', 'Did you see that? Did you SEE that?!', 'note']],
    allyLow: [['pain', 'Ow... I\'m hanging in there!', 'sweat'], ['worried', 'Th-they hit hard...', 'sweat']],
    allyIdle: [['happy', 'Thanks for letting me tag along!', 'heart'], ['determined', 'I\'ll protect you, partner!', 'exclaim'], ['normal', 'Those guys were mean to me anyway...', 'dots'], ['joyous', 'Team life is SO much better!', 'note']],
    allyFaint: [['crying', 'S-sorry... I can\'t fight anymore... Thank you for taking me in...', 'tear']],
    win: [['angry', 'Hmph! And STAY down!', 'anger'], ['joyous', 'HA! That\'ll teach you!', 'spark']],
    truce: [['sigh', '...Fine. Truce. For now.', 'dots']],
    home: [['happy', 'Now that THAT\'s settled... I\'m going home.', 'note']] };
  const GRUDGE = [   // [the angry one, the reply]
    [['angry', 'HEY! {b}! You stole my Gold Ball!', 'anger'], ['happy', 'Finders keepers! Get lost!', 'note']],
    [['angry', 'That Oran Berry was MINE, {b}!', 'anger'], ['happy', 'Should\'ve eaten it faster, then!', 'note']],
    [['angry', 'You stepped on my tail AGAIN!', 'anger'], ['angry', 'Then keep your tail out of my way!', 'anger']],
    [['shouting', 'You told everyone I can\'t evolve!', 'anger'], ['happy', 'Because you CAN\'T!', 'note']],
    [['angry', 'This is MY napping spot, {b}!', 'anger'], ['angry', 'Your name isn\'t on it!', 'anger']],
    [['angry', 'You laughed at my cry!', 'anger'], ['joyous', 'Because it\'s a FUNNY cry!', 'note']]];
  const GRUDGE_SAME = [[['shouting', 'Give back my Gold Ball, you copycat!', 'anger'], ['angry', 'It\'s MY Gold Ball! We look the same, prove it\'s yours!', 'anger']],
    [['angry', 'Mom always liked you better!', 'anger'], ['happy', 'That\'s because I\'m the cute one!', 'note']]];

  // ================= peaceful Pokemon ("critters") =================
  const critters = [], fx = [];
  function critter(dex, x, y, o) {
    const N = E(); o = o || {}; let anim = null; try { N.Sprites.preload([dex], 4000, !!o.shiny); anim = new N.Sprites.Animator(dex, 1, !!o.shiny); } catch (_) {}
    const z = sizeOf(dex), c = { dex, name: o.name || nameOf(dex), g: o.g || null, shiny: !!o.shiny, x, y, r: z.r, bodyH: z.bodyH + (o.fly ? 18 : 0), anim, mode: o.mode || 'wander', home: { x, y }, goal: null, wait: rnd(0.5, 2),
      spd: o.spd || rnd(38, 55), lift: 0, hopN: 0, hopT: 0, sleep: false, fly: !!o.fly, follow: null, t: 0, met: false, scareCd: 0, kind: 'wild' };
    critters.push(c); while (critters.length > CFG.maxCritters) { const old = critters.find(q => q.mode !== 'scene'); if (!old) break; old.gone = true; critters.splice(critters.indexOf(old), 1); }
    return c;
  }
  function stepTo(w, gx, gy, sp, dt) {   // move toward a point; returns true when there
    const dx = gx - w.x, dy = gy - w.y, d = Math.hypot(dx, dy); if (d < 4) return true; const st = Math.min(d, sp * dt), nx = w.x + dx / d * st, ny = w.y + dy / d * st;
    if (free(nx, ny, w.r)) { w.x = nx; w.y = ny; } else if (free(nx, w.y, w.r)) w.x = nx; else if (free(w.x, ny, w.r)) w.y = ny; else return true;
    w.moved = true; w.dir = Math.atan2(dy, dx); return false;
  }
  function updateCritter(c, dt, p, foes) {
    c.t += dt; c.moved = false; c.scareCd -= dt;
    if (c.hopN > 0) { c.hopT += dt * 9; if (c.hopT >= Math.PI) { c.hopT = 0; c.hopN--; } } const hop = c.hopN > 0 ? Math.abs(Math.sin(c.hopT)) * 12 : 0;
    c.lift = hop + (c.fly ? 16 + Math.sin(c.t * 3) * 4 : 0);
    if (c.mode === 'scene') { if (c.goal && stepTo(c, c.goal.x, c.goal.y, c.goal.sp || c.spd * 1.3, dt)) c.goal = null; }
    else if (c.mode === 'leave') { const a = c.leaveA ?? (c.leaveA = Math.atan2(c.y - p.y, c.x - p.x)); stepTo(c, c.x + Math.cos(a) * 60, c.y + Math.sin(a) * 60, c.spd * 1.4, dt); if (dist(c, p) > 900 || c.t > 30) c.gone = true; }
    else {
      const scary = foes.find(e => dist(e, c) < 120);
      if (scary && !c.sleep) { const a = Math.atan2(c.y - scary.y, c.x - scary.x); stepTo(c, c.x + Math.cos(a) * 50, c.y + Math.sin(a) * 50, c.spd * 2, dt); c.home = { x: c.x, y: c.y }; c.goal = null;
        if (c.scareCd <= 0) { c.scareCd = 5; if (Math.random() < 0.25 && dist(c, p) < 420) { const l = pick(LN.scared); say(c, 'wild', l[0], l[1], l[2]); } else emo(c, 'sweat'); } }
      else if (c.follow && !c.follow.gone) { const f = c.follow; if (dist(c, f) > 34) stepTo(c, f.x - 24, f.y + 6, c.spd * 1.2, dt); }
      else if (!c.sleep) {
        if (!c.goal) { c.wait -= dt; if (c.wait <= 0) { for (let i = 0; i < 6; i++) { const a = Math.random() * TAU, r = rnd(30, 110), gx = c.home.x + Math.cos(a) * r, gy = c.home.y + Math.sin(a) * r; if (free(gx, gy, c.r)) { c.goal = { x: gx, y: gy }; break; } } c.wait = rnd(1, 3.5); if (Math.random() < 0.12) emo(c, pick(['note', 'dots', 'note'])); } }
        else if (stepTo(c, c.goal.x, c.goal.y, c.spd, dt)) c.goal = null; }
      if (!c.met && !scary && dist(c, p) < 130) { c.met = true; if (Math.random() < 0.4) { const l = pick(LN.meet); say(c, 'wild', l[0], l[1], l[2]); } else emo(c, 'question'); }
    }
    if (c.anim) { try { c.anim.loop(c.moved ? 'Walk' : 'Idle'); if (Number.isFinite(c.dir)) c.anim.dir = E().Sprites.dirFromAngle(c.dir); c.anim.update(c.sleep ? dt * 0.25 : dt); } catch (_) {} }
    if (c.sleep && Math.random() < dt * 1.6) fx.push({ kind: 'z', x: c.x + 8, y: c.y - c.bodyH - 4, vx: rnd(6, 14), vy: -18, t: 0, life: 1.6 });
    if (c.mode !== 'scene' && dist(c, p) > CFG.despawn) c.gone = true;
  }

  // ================= habitat scenes =================
  // actors: [id, dex, dx, dy, opts]; steps: ['say', id, face, text, emote] ['emote', id, kind] ['move', id, idOr[dx,dy], speed] ['wait', s] ['hop', id, n]
  //   ['sleep', id, on] ['look', id, otherId] ['fx', kind, id] ['mode', id, mode, otherId] ['end']
  const SCENES = {
    proposal: { actors: [['a', 280, -80, 0, { g: 'm' }], ['b', 280, 40, -6, { g: 'f' }]], steps: [
      ['emote', 'b', 'note'], ['wait', 1], ['move', 'a', [10, -2], 45], ['look', 'b', 'a'], ['say', 'a', 'worried', 'R-Ralts... can I tell you something?', 'sweat'], ['say', 'b', 'surprised', 'Hm? What is it?', 'question'],
      ['fx', 'ring', 'a'], ['say', 'a', 'determined', 'Will you... be my partner? Forever and ever?', 'heart'], ['wait', 1.2], ['say', 'b', 'teary', '...Yes! YES! A thousand times yes!', 'heart'],
      ['fx', 'hearts', 'a'], ['fx', 'hearts', 'b'], ['hop', 'a', 3], ['hop', 'b', 3], ['say', 'a', 'joyous', 'She said YES!!', 'heart'], ['wait', 1], ['mode', 'b', 'follow', 'a'], ['end']] },
    concert: { actors: [['j', 39, 0, -10], ['l1', 172, -60, 30], ['l2', 35, 60, 30]], steps: [
      ['say', 'j', 'happy', 'Jiggly~ Puff~ Jigglyyy~ ♪', 'note'], ['fx', 'notes', 'j'], ['wait', 1.4], ['sleep', 'l1', true], ['wait', 0.6], ['sleep', 'l2', true], ['fx', 'notes', 'j'], ['wait', 1.5],
      ['say', 'j', 'angry', '...They fell ASLEEP?! AGAIN?!', 'anger'], ['move', 'j', 'l1', 70], ['fx', 'scribble', 'l1'], ['move', 'j', 'l2', 70], ['fx', 'scribble', 'l2'],
      ['say', 'j', 'sigh', 'Hmph. Let\'s see them laugh at THAT when they wake up.', 'dots'], ['wait', 1], ['end']] },
    snack: { actors: [['s', 143, 30, 0, { spd: 20 }], ['m', 446, -110, 10]], steps: [
      ['sleep', 's', true], ['fx', 'berry', 's'], ['wait', 1], ['say', 'm', 'happy', 'Shhh... just one little berry...', 'note'], ['move', 'm', [0, 12], 30], ['wait', 0.6], ['sleep', 's', false],
      ['say', 's', 'stunned', '...hm? ...Who\'s eating my snack?', 'exclaim'], ['emote', 'm', 'sweat'], ['say', 'm', 'worried', 'N-nobody! It was the wind!', 'sweat'], ['mode', 'm', 'leave'], ['wait', 1.2],
      ['say', 's', 'sigh', '...zzz...', 'dots'], ['sleep', 's', true], ['end']] },
    dream: { actors: [['c', 10, -30, 10], ['b', 12, 40, -10, { fly: true }]], steps: [
      ['say', 'c', 'inspired', 'Butterfree... will I really fly like you one day?', 'spark'], ['say', 'b', 'happy', 'Of course, little one. Every wing starts as a dream.', 'heart'],
      ['hop', 'c', 2], ['say', 'c', 'joyous', 'Then I\'ll eat ALL the leaves and grow super fast!', 'note'], ['fx', 'hearts', 'b'], ['end']] },
    training: { actors: [['m', 66, 0, 0], ['m2', 66, 50, 10]], steps: [
      ['hop', 'm', 2], ['say', 'm', 'determined', '98... 99... ONE HUNDRED!', 'spark'], ['hop', 'm2', 2], ['say', 'm2', 'shouting', 'Pfft. I did TWO hundred!', 'anger'], ['look', 'm', 'm2'],
      ['say', 'm', 'angry', 'Then I\'ll do THREE hundred!', 'anger'], ['hop', 'm', 4], ['hop', 'm2', 4], ['say', 'm2', 'joyous', 'Muscles never sleep!!', 'spark'], ['end']] },
    headache: { actors: [['p', 54, -30, 0], ['s', 79, 40, 4, { spd: 15 }]], steps: [
      ['emote', 'p', 'question'], ['say', 'p', 'worried', 'Psy...? My head hurts... again...', 'sweat'], ['wait', 0.8], ['say', 's', 'normal', '...................', 'dots'], ['wait', 2.2],
      ['say', 's', 'surprised', '...oh. Hi.', 'question'], ['say', 'p', 'dizzy', 'That took you a whole minute...', 'sweat'], ['end']] },
    tree: { actors: [['w', 185, 0, 0], ['b', 438, -50, 12]], steps: [
      ['say', 'w', 'determined', 'Shh! I\'m a tree. Totally a tree. Nothing to see here.', 'dots'], ['hop', 'b', 2], ['say', 'b', 'happy', 'Me too! Me too! I\'m a tree!', 'note'], ['emote', 'w', 'anger'],
      ['say', 'w', 'angry', 'Trees don\'t TALK!', 'anger'], ['say', 'b', 'sad', '...You\'re talking.', 'dots'], ['wait', 0.8], ['say', 'w', 'stunned', '..........', 'sweat'], ['end']] },
    berry: { actors: [['a', 25, -40, 0, { g: 'm' }], ['b', 25, 40, 0, { g: 'f' }]], steps: [
      ['move', 'a', [-12, 0], 40], ['say', 'a', 'happy', 'I found an Oran Berry! ...Want half?', 'heart'], ['say', 'b', 'joyous', 'You\'re the BEST!', 'heart'], ['fx', 'hearts', 'a'], ['fx', 'hearts', 'b'], ['hop', 'b', 2], ['mode', 'a', 'follow', 'b'], ['end']] },
    tag: { actors: [['e', 133, -30, 0], ['t', 175, 30, 0]], steps: [
      ['say', 'e', 'joyous', 'Tag! You\'re it!', 'note'], ['move', 'e', [-90, -20], 90], ['say', 't', 'happy', 'Toge-toge-priiii!', 'note'], ['move', 't', 'e', 80], ['hop', 'e', 2], ['move', 'e', [60, 40], 95],
      ['move', 't', 'e', 85], ['say', 'e', 'joyous', 'Hehe! Can\'t catch me!', 'note'], ['move', 'e', [-20, 70], 95], ['move', 't', 'e', 85], ['say', 't', 'happy', 'Got youuu!', 'heart'], ['hop', 't', 3], ['end']] },
    thief: { actors: [['r', 19, -40, 0], ['m', 52, 30, 0]], steps: [
      ['fx', 'coin', 'r'], ['wait', 0.8], ['move', 'm', 'r', 70], ['fx', 'grab', 'm'], ['say', 'r', 'angry', 'HEY! That\'s my Gold Ball!', 'anger'], ['say', 'm', 'joyous', 'Finders keepers, nya~!', 'note'],
      ['mode', 'm', 'leave'], ['wait', 0.5], ['say', 'r', 'shouting', 'Get back here, you thief!!', 'anger'], ['mode', 'r', 'leave'], ['end']] },
    dance: { actors: [['s', 327, 0, 0]], steps: [
      ['say', 's', 'happy', 'Left, right... spin, spin...', 'note'], ['hop', 's', 2], ['move', 's', [30, 10], 60], ['move', 's', [-20, 20], 60], ['move', 's', [0, 0], 60], ['say', 's', 'dizzy', 'Whoaaa... the world is spinning... wait, it\'s always spinning...', 'question'], ['end']] },
    family: { actors: [['k', 194, -20, 10], ['q', 195, 30, 0]], steps: [
      ['say', 'k', 'happy', 'Papa! Papa! Look, I can swim backwards!', 'note'], ['hop', 'k', 2], ['say', 'q', 'happy', '...That\'s amazing, kiddo.', 'heart'], ['wait', 0.8], ['say', 'q', 'normal', '...', 'dots'], ['say', 'k', 'joyous', 'Papa, you\'re making the face again!', 'note'], ['fx', 'hearts', 'q'], ['end']] } };
  let scene = null, sceneT = rnd(...CFG.sceneFirst), roamT = rnd(...CFG.roamEvery);
  function startScene(name, p) {
    const def = SCENES[name]; if (!def || !p) return false;
    for (let tries = 0; tries < 24; tries++) {
      const a = Math.random() * TAU, d = rnd(240, 340), cx = p.x + Math.cos(a) * d, cy = p.y + Math.sin(a) * d * 0.6;
      if (!def.actors.every(([, , dx, dy]) => free(cx + dx, cy + dy, 14))) continue;
      if (E().EnemyMgr.all().some(e => e && !e.dead && Math.hypot(e.x - cx, e.y - cy) < 150)) continue;
      const actors = {}; for (const [id, dex, dx, dy, o] of def.actors) actors[id] = critter(dex, cx + dx, cy + dy, Object.assign({ mode: 'scene' }, o || {}));
      scene = { name, def, actors, i: 0, wait: 0.6, cx, cy, until: null, t: 0 }; return true; }
    return false;
  }
  function runStep(sc, st) {
    const A = sc.actors, w = A[st[1]], at = v => typeof v === 'string' ? { x: A[v].x + (A[v].x > w.x ? -26 : 26), y: A[v].y + 2 } : { x: sc.cx + v[0], y: sc.cy + v[1] };
    switch (st[0]) {
      case 'say': { say(w, 'wild', st[2], st[3], st[4], { prio: true }); sc.wait = st[3].length / 45 + 1.3; break; }
      case 'emote': emo(w, st[2]); sc.wait = 0.5; break;
      case 'move': { const g = at(st[2]); w.goal = { x: g.x, y: g.y, sp: st[3] || 60 }; sc.until = () => !w.goal; sc.wait = 5; break; }
      case 'wait': sc.wait = st[1]; break;
      case 'hop': w.hopN = st[2]; w.hopT = 0; sc.wait = 0.2; break;
      case 'sleep': w.sleep = !!st[2]; if (!st[2]) emo(w, 'exclaim'); sc.wait = 0.3; break;
      case 'look': w.dir = Math.atan2(A[st[2]].y - w.y, A[st[2]].x - w.x); sc.wait = 0.1; break;
      case 'fx': { const v = A[st[2]], k = st[1];
        if (k === 'hearts') for (let i = 0; i < 6; i++) fx.push({ kind: 'heart', x: v.x + rnd(-10, 10), y: v.y - v.bodyH, vx: rnd(-20, 20), vy: rnd(-50, -30), t: -i * 0.12, life: 1.4 });
        else if (k === 'notes') for (let i = 0; i < 8; i++) fx.push({ kind: 'note', x: v.x + rnd(-8, 8), y: v.y - v.bodyH, vx: rnd(-30, 30), vy: rnd(-40, -25), t: -i * 0.2, life: 1.8 });
        else if (k === 'ring') fx.push({ kind: 'ring', x: v.x + 14, y: v.y - v.bodyH * 0.6, t: 0, life: 2.6 });
        else if (k === 'scribble') { fx.push({ kind: 'scribble', obj: v, t: 0, life: 99 }); emo(sc.actors.j || v, 'anger'); }
        else if (k === 'berry') fx.push({ kind: 'berry', obj: v, t: 0, life: 6 });
        else if (k === 'coin') fx.push({ kind: 'coin', obj: v, t: 0, life: 99, id: 'gold' });
        else if (k === 'grab') { for (const f of fx) if (f.kind === 'coin') f.obj = v; }
        sc.wait = 0.4; break; }
      case 'mode': w.mode = st[2] === 'follow' ? 'wander' : st[2]; if (st[2] === 'follow') w.follow = A[st[3]]; if (st[2] === 'leave') { w.leaveA = Math.atan2(w.y - E().Game.player.y, w.x - E().Game.player.x); w.t = 0; } sc.wait = 0.2; break;
      case 'end': endScene(); break;
    }
  }
  function endScene() { if (!scene) return; for (const id in scene.actors) { const c = scene.actors[id]; if (c.mode === 'scene') { c.mode = 'wander'; c.home = { x: c.x, y: c.y }; c.met = true; } } scene = null; sceneT = rnd(...CFG.sceneEvery); }
  function updateScene(dt, p) {
    if (!scene) { sceneT -= dt; if (sceneT <= 0) { sceneT = 8; startScene(pick(Object.keys(SCENES)), p); } return; }
    const sc = scene; sc.t += dt;
    if (Math.hypot(sc.cx - p.x, sc.cy - p.y) > 900 || sc.t > 70) { endScene(); return; }
    if (sc.until) { if (sc.until() || (sc.wait -= dt) <= 0) { sc.until = null; sc.wait = 0.15; } return; }
    if ((sc.wait -= dt) > 0) return;
    const st = sc.def.steps[sc.i++]; if (!st) { endScene(); return; } runStep(sc, st);
  }
  // lone wanderers: Pokemon from around here, just roaming
  function roam(dt, p, foes) {
    if ((roamT -= dt) > 0) return; roamT = rnd(...CFG.roamEvery);
    const src = foes.filter(e => !e.boss && !e.legend)[0]; if (!src || critters.length >= CFG.maxCritters - 3) return;
    for (let i = 0; i < 12; i++) { const a = Math.random() * TAU, d = rnd(380, 520), x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d * 0.7; if (!free(x, y, 14)) continue;
      const c = critter(Number(src.dex), x, y, { g: Math.random() < 0.5 ? 'm' : 'f' }); if (Math.random() < 0.4) { const c2 = critter(Number(src.dex), x + 30, y + 8, { g: c.g === 'm' ? 'f' : 'm' }); c2.follow = c; } return; }
  }

  // ================= enemies: personalities, grudges, changes of heart, chatter =================
  const seen = new WeakSet(), feuds = [], live = new Set();
  const special = e => e.boss || e.legend || e.__roamer || e.__maxRaid || e.__wave || e.__legendDen || e.remote || e.golden;
  function removeEnemy(e) { const arr = E().EnemyMgr.all(), i = arr.indexOf(e); if (i >= 0) arr.splice(i, 1); e.dead = true; e.gone = true; live.delete(e); }
  function toWild(e, o) {   // an enemy that turns out to be (or becomes) peaceful
    const c = critter(Number(e.dex), e.x, e.y, { shiny: !!e.shiny, name: e.name, g: e.__g });
    if (o && o.leave) { c.mode = 'leave'; c.leaveA = Math.random() * TAU; c.t = 0; }
    removeEnemy(e); return c;
  }
  function meet(e, p) {
    seen.add(e); live.add(e); e.__g = Math.random() < 0.5 ? 'm' : 'f';
    if (special(e) || !solo()) return;
    const r = Math.random(), calm = !e.psAi || e.psAi === 'aggressive';
    if (r < CFG.toWild && dist(e, p) > 300) toWild(e);
    else if (r < CFG.toWild + CFG.grudge && calm) e.__wantFeud = performance.now() / 1000 + 12;
    else if (r < CFG.toWild + CFG.grudge + CFG.turn && calm) e.__turnAt = performance.now() / 1000 + rnd(4, 12);
  }
  function startFeud(a, b) {
    const same = Number(a.dex) === Number(b.dex), pair = pick(same && Math.random() < 0.7 ? GRUDGE_SAME : GRUDGE);
    feuds.push({ a, b, t: CFG.feudTime, bFights: Math.random() < 0.75 }); a.__feud = b; b.__feud = a; a.__wantFeud = 0;
    say(a, 'foe', pair[0][0], pair[0][1], pair[0][2], { prio: true, b: b.name }); say(b, 'foe', pair[1][0], pair[1][1], pair[1][2], { prio: true, delay: 0.3, a: a.name });
    emo(a, 'anger'); setTimeout(() => emo(b, 'anger'), 500);
  }
  function endFeud(f, why) {
    feuds.splice(feuds.indexOf(f), 1); const { a, b } = f; a.__feud = null; b.__feud = null;
    const w = !a.dead ? (!b.dead ? null : a) : (!b.dead ? b : null);
    if (why === 'time' && w == null && !a.dead && !b.dead) { const l = pick(LN.truce); say(a, 'foe', l[0], l[1], l[2]); return; }
    if (w && !w.gone) { if (Math.random() < 0.3 && solo()) { const l = pick(LN.home); say(w, 'wild', l[0], l[1], l[2], { prio: true }); toWild(w, { leave: true }); } else { const l = pick(LN.win); say(w, 'foe', l[0], l[1], l[2], { prio: true }); } }
  }
  function updateFeuds(dt) {
    for (const f of feuds.slice()) { f.t -= dt; const { a, b } = f;
      if (a.dead || b.dead || a.gone || b.gone) { endFeud(f, 'ko'); continue; } if (f.t <= 0) { endFeud(f, 'time'); continue; }
      for (const [x, y, fights] of [[a, b, true], [b, a, f.bFights]]) { if (!fights) continue; x.__fhit = (x.__fhit || 0) - dt;
        if (dist(x, y) < (x.r || 12) + (y.r || 12) + 10 && x.__fhit <= 0) { x.__fhit = 0.75; let d = 8; try { d = typeof x.dmg === 'function' ? x.dmg() : (x._dmg || 8); } catch (_) {}
          try { y.hurt(Math.max(4, d * 2), '#ff7a3a', y.x - x.x, y.y - x.y, 60); } catch (_) {} if (Math.random() < 0.3) emo(x, 'anger'); } } }
  }
  // a change of heart: it stops, thinks it over... and joins you
  function startTurn(e, beg) { if (!e || e.__feud || e.__turning || e.dead) return; e.__turning = { t: 0, said: 0, beg }; e.__turnAt = 0; const l = pick(beg ? LN.beg : LN.turn1); say(e, 'foe', l[0], l[1], l[2], { prio: true }); emo(e, beg ? 'tear' : 'question'); }
  function updateTurns(dt) {
    for (const e of live) { const tn = e.__turning; if (!tn) continue; if (e.dead) { e.__turning = null; continue; } tn.t += dt;
      if (tn.said === 0 && tn.t > 2.4) { tn.said = 1; if (!tn.beg) { const l = pick(LN.turn2); say(e, 'ally', l[0], l[1], l[2], { prio: true }); } emo(e, 'exclaim'); }
      if (tn.t > 4.2) { e.__turning = null; toAlly(e); } }
  }
  // what enemies say and show
  let chatCd = 0;
  function chatter(dt, p, foes) {
    chatCd -= dt;
    for (const e of foes) {
      const st = e.__wl || (e.__wl = { spot: false, low: false, boss: false });
      if (!st.spot && dist(e, p) < 230) { st.spot = true;
        if ((e.boss || e.legend) && Math.random() < 0.6) { const l = pick(LN.boss); say(e, 'foe', l[0], l[1], l[2], { prio: true }); }
        else if ((e.behavior === 'thief' || e.golden) && Math.random() < 0.4) { const l = pick(LN.thief); say(e, 'foe', l[0], l[1], l[2]); }
        else if (Math.random() < CFG.taunt && chatCd <= 0) { chatCd = 6; const l = pick(LN.taunt); say(e, 'foe', l[0], l[1], l[2]); }
        else if (Math.random() < CFG.spotEmote) emo(e, pick(['exclaim', 'exclaim', 'anger'])); }
      if (!st.low && e.hp < e.maxHp * 0.3 && !e.boss) { st.low = true;
        if (solo() && !e.__turning && !special(e) && allies.length < CFG.maxAllies && Math.random() < CFG.lowTurn && dist(e, p) < 320) startTurn(e, true);
        else if (Math.random() < 0.08 && chatCd <= 0) { chatCd = 6; const l = pick(LN.low); say(e, 'foe', l[0], l[1], l[2]); } else if (Math.random() < 0.35) emo(e, 'sweat'); }
    }
  }
  function onDeaths(p) {   // a fallen buddy makes a nearby one of the same kind furious
    for (const e of [...live]) { if (!e.dead) continue; live.delete(e); if (e.gone || dist(e, p) > 500 || Math.random() > 0.05 || chatCd > 0) continue;
      const pal = E().EnemyMgr.all().find(o => o && !o.dead && o !== e && Number(o.dex) === Number(e.dex) && dist(o, e) < 220); if (pal) { chatCd = 6; const l = pick(LN.avenge); say(pal, 'foe', l[0], l[1], l[2]); } }
  }

  // ================= allies =================
  const allies = [], shots = [];
  const TYPE_COL = { normal: '#e8e0c8', fire: '#ff7a2a', water: '#4aa8ff', grass: '#6ad05a', electric: '#ffe04a', ice: '#9ae8ff', fighting: '#d0503a', poison: '#b05ad0', ground: '#d0a860', flying: '#a8c0ff', psychic: '#ff6ab0', bug: '#a8c83a', rock: '#b8a058', ghost: '#7a6ab0', dragon: '#7a5aff', dark: '#6a5848', steel: '#b8b8d0', fairy: '#ffa8d8' };
  const RANGED = new Set(['ranged', 'fan', 'beamer', 'zoner', 'sniper']);
  function toAlly(e) {
    const N = E(), p = N.Game.player; if (!p || allies.length >= CFG.maxAllies) { toWild(e, { leave: true }); return; }
    let anim = null; try { anim = new N.Sprites.Animator(Number(e.dex), 1, !!e.shiny); } catch (_) {}
    const a = { kind: 'ally', dex: Number(e.dex), name: e.name, g: e.__g, shiny: !!e.shiny, x: e.x, y: e.y, r: e.r || 12, bodyH: e.bodyH || 40, anim, maxHp: Math.max(60, Math.round((Number(p.maxHp) || 100) * 0.6)), cd: rnd(0.4, 1), hurtCd: 0,
      type: e.atkType || 'normal', ranged: RANGED.has(e.behavior) || e.psAi === 'sniper', slot: allies.length, idleT: rnd(40, 70), lowSaid: false, dead: false, t: 0, lift: 0 };
    a.hp = a.maxHp; a.proxy = { get x() { return a.x; }, get y() { return a.y; }, get r() { return a.r; }, get dead() { return a.dead; }, get hp() { return a.hp; }, get maxHp() { return a.maxHp; }, bodyH: a.bodyH, hurt(n) { allyHurt(a, n); } };
    removeEnemy(e); allies.push(a);
    txt(a.x, a.y - 50, label(a) + ' joined your team!', '#9ad8ff'); sfx('shiny'); emo(a, 'heart');
    for (let i = 0; i < 6; i++) fx.push({ kind: 'heart', x: a.x + rnd(-10, 10), y: a.y - a.bodyH, vx: rnd(-20, 20), vy: rnd(-50, -30), t: -i * 0.1, life: 1.3 });
    if (Number(p.dex) === 530) { try { T().line(530, 'joyous', 'Ha! Welcome to the Gurren Brigade, ' + a.name + '!', 'heart', { prio: true, delay: 0.6 }); } catch (_) {} }
  }
  function allyHurt(a, n) { if (a.dead || a.hurtCd > 0 || !(n > 0)) return; a.hurtCd = 0.45; a.hp -= n; a.flash = 0.15;
    if (!a.lowSaid && a.hp < a.maxHp * 0.35 && a.hp > 0) { a.lowSaid = true; const l = pick(LN.allyLow); say(a, 'ally', l[0], l[1], l[2]); }
    if (a.hp <= 0) { a.hp = 0; a.dead = true; a.leaveT = 0; const l = pick(LN.allyFaint); say(a, 'ally', l[0], l[1], l[2], { prio: true }); txt(a.x, a.y - 44, a.name + ' fainted...', '#9ad8ff'); } }
  function hitEnemy(a, e, mult) { const N = E(), p = N.Game.player; let m = 1; try { m = N.Types.mult(a.type, e.types || ['normal']); } catch (_) {}
    const dmg = 10 * (Number(p && p.atk) || 1) * m * (mult || 1), was = e.dead;
    try { e.hurt(dmg, TYPE_COL[a.type] || '#fff', e.x - a.x, e.y - a.y, 60); N.Stats.dmg(p, 'ally', dmg); } catch (_) {}
    try { N.FX.burst(e.x, e.y - 10, TYPE_COL[a.type] || '#fff', 8, 140); } catch (_) {}
    if (!was && e.dead && Math.random() < 0.25) { const l = pick(LN.allyKill); say(a, 'ally', l[0], l[1], l[2]); } }
  function updateAllies(dt, p, foes) {
    const k = K();
    for (let i = allies.length - 1; i >= 0; i--) { const a = allies[i]; a.t += dt; a.moved = false; a.hurtCd -= dt; a.cd -= dt; a.flash = Math.max(0, (a.flash || 0) - dt);
      if (a.dead) { a.leaveT += dt; const ang = Math.atan2(a.y - p.y, a.x - p.x); stepTo(a, a.x + Math.cos(ang) * 40, a.y + Math.sin(ang) * 40, 50, dt); if (a.leaveT > 2.5) { a.gone = true; allies.splice(i, 1); } continue; }
      a.hp = Math.min(a.maxHp, a.hp + a.maxHp * 0.004 * dt);
      if (dist(a, p) > 750 && k) { const f = k.nearFree(p.x - 40, p.y + 30, a.r); a.x = f.x; a.y = f.y; }
      const tg = foes.filter(e => !e.__turning && dist(e, p) < CFG.allyRange + 80 && dist(e, a) < CFG.allyRange).sort((x, y) => dist(x, a) - dist(y, a))[0];
      if (tg) { const want = a.ranged ? 150 : (a.r + (tg.r || 12) + 4), d = dist(a, tg), ang = Math.atan2(tg.y - a.y, tg.x - a.x); a.dir = ang;
        if (d > want + 6) stepTo(a, tg.x - Math.cos(ang) * want, tg.y - Math.sin(ang) * want, 105, dt); else if (a.ranged && d < want - 40) stepTo(a, a.x - Math.cos(ang) * 30, a.y - Math.sin(ang) * 30, 90, dt);
        if (a.cd <= 0 && d < (a.ranged ? 240 : want + 14)) { a.cd = CFG.allyCd; try { a.anim && a.anim.play(a.ranged ? 'Shoot' : 'Attack'); } catch (_) {}
          if (a.ranged) shots.push({ a, x: a.x, y: a.y - 16, tg, sp: 380, t: 0 }); else hitEnemy(a, tg, 1.3); } }
      else { const off = a.slot % 2 ? 1 : -1, fx2 = p.x + off * 52, fy = p.y + 34; if (dist(a, { x: fx2, y: fy }) > 26) stepTo(a, fx2, fy, dist(a, p) > 220 ? 150 : 95, dt); else a.dir = Math.atan2(p.y - a.y, p.x - a.x); }
      for (const e of foes) if (dist(e, a) < a.r + (e.r || 12)) { let d = 8; try { d = typeof e.dmg === 'function' ? e.dmg() : (e._dmg || 8); } catch (_) {} allyHurt(a, Number(d) || 8); }
      try { const P = E().Projectiles.all(); for (let j = P.length - 1; j >= 0; j--) { const q = P[j]; if (!q || q.friendly || q.ghost || Math.hypot(q.x - a.x, q.y - (a.y - 10)) > a.r + (q.r || 4)) continue; allyHurt(a, q.dmg || 6); P.splice(j, 1); } } catch (_) {}
      if ((a.idleT -= dt) <= 0) { a.idleT = rnd(55, 90); if (!tg) { const l = pick(LN.allyIdle); say(a, 'ally', l[0], l[1], l[2]); } }
      if (a.anim) { try { if (!a.anim.once || a.anim.done) a.anim.loop(a.moved ? 'Walk' : 'Idle'); if (Number.isFinite(a.dir)) a.anim.dir = E().Sprites.dirFromAngle(a.dir); a.anim.update(dt); } catch (_) {} } }
    for (let i = shots.length - 1; i >= 0; i--) { const s = shots[i]; s.t += dt; const tg = s.tg; if (!tg || tg.dead || s.t > 1.5) { shots.splice(i, 1); continue; }
      const d = Math.hypot(tg.x - s.x, tg.y - 12 - s.y), st = s.sp * dt; if (d <= st) { hitEnemy(s.a, tg, 1); shots.splice(i, 1); continue; } s.x += (tg.x - s.x) / d * st; s.y += (tg.y - 12 - s.y) / d * st; }
  }

  // ================= update & engine hooks =================
  let runP = null;
  function reset() { critters.length = 0; allies.length = 0; shots.length = 0; feuds.length = 0; fx.length = 0; live.clear(); scene = null; sceneT = rnd(...CFG.sceneFirst); roamT = rnd(...CFG.roamEvery); }
  function update(dt) {
    const N = E(), p = N?.Game?.player; if (!p) return;
    if (p !== runP) { runP = p; reset(); }
    if (N.Game.state !== 'playing' || p.dead) return;
    if (window.PS_DIGGER?.active || window.PS_KAMINA?.active || window.PS_CREATION_RIFT?.active || window.PS_GIRATINA?.active) return;
    const foes = N.EnemyMgr.all().filter(e => e && !e.dead), now = performance.now() / 1000;
    for (const e of foes) if (!seen.has(e)) meet(e, p);
    for (const e of foes) {
      if (e.__wantFeud && !e.__feud && !e.dead) { if (now > e.__wantFeud) e.__wantFeud = 0; else if (dist(e, p) < 520) { const b = foes.find(o => o !== e && !o.dead && !o.__feud && !special(o) && !o.__turning && dist(o, e) < 260); if (b) startFeud(e, b); } }
      if (e.__turnAt && now > e.__turnAt && !e.__turning && dist(e, p) < 320 && allies.length < CFG.maxAllies) startTurn(e, false);
    }
    updateFeuds(dt); updateTurns(dt); chatter(dt, p, foes); onDeaths(p);
    for (let i = critters.length - 1; i >= 0; i--) { const c = critters[i]; updateCritter(c, dt, p, foes); if (c.gone) critters.splice(i, 1); }
    updateScene(dt, p); roam(dt, p, foes); updateAllies(dt, p, foes.filter(e => !e.gone));
    for (const f of fx) { f.t += dt; if (f.t > 0 && f.vx != null) { f.x += f.vx * dt; f.y += f.vy * dt; } } for (let i = fx.length - 1; i >= 0; i--) if (fx[i].t > fx[i].life || (fx[i].obj && fx[i].obj.gone)) fx.splice(i, 1);
  }
  let hooked = false;
  function hook() {
    const N = E(); if (hooked || !N || !N.EnemyMgr || !N.Enemy || !N.Training || !N.Ult) return; hooked = true;
    const emu = N.EnemyMgr.update;
    N.EnemyMgr.update = function () { try { update(Math.min(0.1, Number(arguments[0]) || 0.016)); } catch (err) { console.warn('[wild]', err); } return emu.apply(this, arguments); };
    const eup = N.Enemy.prototype.update;
    N.Enemy.prototype.update = function (dt) {
      if (!this.dead) {
        if (this.__turning) { this.touchCd = Math.max(Number(this.touchCd) || 0, 0.3); arguments[1] = { x: this.x, y: this.y, r: 1, dead: false, hp: 1, maxHp: 1, hurt() {} }; return eup.apply(this, arguments); }   // standing still, thinking
        const f = this.__feud; if (f && !f.dead) { this.touchCd = Math.max(Number(this.touchCd) || 0, 0.3);
          const fd = feuds.find(q => q.a === this || q.b === this); if (fd && fd.b === this && !fd.bFights) { const a = Math.atan2(this.y - f.y, this.x - f.x); arguments[1] = { x: this.x + Math.cos(a) * 200, y: this.y + Math.sin(a) * 200, r: 1, dead: false, hp: 1, maxHp: 1, hurt() {} }; }
          else arguments[1] = f; return eup.apply(this, arguments); }
        const p = N.Game.player; if (allies.length && p && !this.boss) { let best = null, bd = p.dead ? Infinity : dist(this, p) - 40; for (const a of allies) if (!a.dead && dist(this, a) < bd) { bd = dist(this, a); best = a; } if (best) arguments[1] = best.proxy; }
      }
      return eup.apply(this, arguments); };
    const td = N.Training.drawables;
    N.Training.drawables = function () { let r = td.apply(this, arguments); if (!Array.isArray(r)) r = []; try { for (const c of critters) r.push({ y: c.y, draw: g => drawBody(g, c) }); for (const a of allies) r.push({ y: a.y, draw: g => drawBody(g, a) }); } catch (_) {} return r; };
    const du = N.Ult.drawUnits;
    N.Ult.drawUnits = function (ctx) { du.apply(this, arguments); try { drawTop(ctx); } catch (err) { console.warn('[wild]', err); } };
  }
  // ================= drawing =================
  function heart(ctx, x, y, s, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y + s * 0.35); ctx.bezierCurveTo(x - s * 1.1, y - s * 0.35, x - s * 0.45, y - s * 1.05, x, y - s * 0.4); ctx.bezierCurveTo(x + s * 0.45, y - s * 1.05, x + s * 1.1, y - s * 0.35, x, y + s * 0.35); ctx.fill(); }
  function drawBody(ctx, w) {
    const al = w.kind === 'ally' && w.dead ? Math.max(0, 1 - (w.leaveT || 0) / 2.5) : 1; ctx.save(); ctx.globalAlpha = al;
    ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(w.x, w.y + 1, w.r * 1.1, w.r * 0.42, 0, 0, TAU); ctx.fill();
    if (w.kind === 'ally') { ctx.strokeStyle = '#5ab0ff'; ctx.lineWidth = 2; ctx.globalAlpha = al * 0.85; ctx.beginPath(); ctx.ellipse(w.x, w.y, w.r + 5, (w.r + 5) * 0.4, 0, 0, TAU); ctx.stroke(); ctx.globalAlpha = al; }
    if (w.anim) { if (w.flash > 0) ctx.filter = 'brightness(2.2)'; try { w.anim.draw(ctx, w.x, w.y - (w.lift || 0)); } catch (_) {} ctx.filter = 'none'; }
    for (const f of fx) if (f.obj === w) { const hx = w.x, hy = w.y - (w.lift || 0) - w.bodyH * 0.55;
      if (f.kind === 'scribble') { ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(hx - 8, hy - 2); ctx.lineTo(hx - 3, hy + 2); ctx.lineTo(hx + 2, hy - 3); ctx.lineTo(hx + 8, hy + 1); ctx.moveTo(hx - 5, hy + 6); ctx.quadraticCurveTo(hx, hy + 2, hx + 5, hy + 6); ctx.stroke(); }
      else if (f.kind === 'berry') { ctx.fillStyle = '#3a8aff'; ctx.beginPath(); ctx.arc(w.x + w.r + 6, w.y - 4, 5, 0, TAU); ctx.fill(); ctx.fillStyle = '#2a6a2a'; ctx.fillRect(w.x + w.r + 5, w.y - 11, 2, 4); }
      else if (f.kind === 'coin') { ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = '#a07800'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(w.x + 10, w.y - w.bodyH * 0.4 - (w.lift || 0), 5, 0, TAU); ctx.fill(); ctx.stroke(); } }
    ctx.restore();
  }
  function drawTop(ctx) {
    const p = E().Game.player, now = performance.now() / 1000;
    for (const a of allies) { if (a.dead) continue; const y = a.y - (a.bodyH || 40) - 10; ctx.save(); ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = '#1a1030'; ctx.fillStyle = '#9ad8ff';
      const t = 'Ally · ' + label(a); ctx.strokeText(t, a.x, y); ctx.fillText(t, a.x, y); ctx.fillStyle = '#25152f'; ctx.fillRect(a.x - 18, y + 3, 36, 4); ctx.fillStyle = '#5ab0ff'; ctx.fillRect(a.x - 18, y + 3, 36 * Math.max(0, a.hp / a.maxHp), 4); ctx.restore(); }
    if (p) for (const c of critters) { if (dist(c, p) > 260 || c.gone) continue; const y = c.y - (c.lift || 0) - (c.bodyH || 40) - 8; ctx.save(); ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = '#102010'; ctx.fillStyle = '#c8ffaa';
      const t = label(c); ctx.strokeText(t, c.x, y); ctx.fillText(t, c.x, y); ctx.restore(); }
    for (const e of feuds) for (const w of [e.a, e.b]) { if (w.dead) continue; const y = w.y - (w.bodyH || 40) - 8; ctx.save(); ctx.globalAlpha = 0.6 + 0.4 * Math.sin(now * 10); ctx.fillStyle = '#ff4a3a'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('💢', w.x + 10, y); ctx.restore(); }
    for (const e of live) if (e.__turning && !e.dead) { const y = e.y - (e.bodyH || 40) - 14; ctx.save(); ctx.globalCompositeOperation = 'lighter'; const gr = ctx.createRadialGradient(e.x, e.y - 14, 2, e.x, e.y - 14, 34); gr.addColorStop(0, 'rgba(255,180,220,.5)'); gr.addColorStop(1, 'rgba(255,120,200,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(e.x, e.y - 14, 34, 0, TAU); ctx.fill(); ctx.restore(); }
    for (const s of shots) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = TYPE_COL[s.a.type] || '#fff'; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(s.x, s.y, 4.5, 0, TAU); ctx.fill(); ctx.restore(); }
    for (const f of fx) { if (f.t < 0 || f.obj) continue; const u = f.t / f.life, a = Math.max(0, 1 - u); ctx.save(); ctx.globalAlpha = a;
      if (f.kind === 'heart') heart(ctx, f.x, f.y, 5, '#ff5a8a');
      else if (f.kind === 'note') { ctx.fillStyle = '#7a4cff'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(Math.floor(f.x) % 2 ? '♪' : '♫', f.x, f.y); }
      else if (f.kind === 'z') { ctx.fillStyle = '#d8e8ff'; ctx.strokeStyle = '#1a2040'; ctx.lineWidth = 2; ctx.font = 'bold ' + Math.round(8 + u * 6) + 'px sans-serif'; ctx.strokeText('z', f.x, f.y); ctx.fillText('z', f.x, f.y); }
      else if (f.kind === 'ring') { ctx.globalAlpha = Math.min(1, f.t * 3) * a; const y = f.y - Math.min(1, f.t * 2) * 10; ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(f.x, y, 4.5, 0, TAU); ctx.stroke(); ctx.fillStyle = '#9af0ff'; ctx.beginPath(); ctx.moveTo(f.x, y - 9); ctx.lineTo(f.x + 3, y - 5); ctx.lineTo(f.x, y - 3); ctx.lineTo(f.x - 3, y - 5); ctx.closePath(); ctx.fill();
        ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 4; i++) { const ang = now * 3 + i * TAU / 4; ctx.fillStyle = '#fff6b0'; ctx.fillRect(f.x + Math.cos(ang) * 10 - 1, y - 5 + Math.sin(ang) * 10 - 1, 2, 2); } }
      ctx.restore(); }
  }
  let last = performance.now();
  (function loop(now) { requestAnimationFrame(loop); try { hook(); } catch (e) { console.warn('[wild]', e); } last = now; })(performance.now());
  window.PS_WILD = { cfg: CFG, scenes: Object.keys(SCENES), scene: n => startScene(n || pick(Object.keys(SCENES)), E().Game.player), get critters() { return critters.length; }, get allies() { return allies.map(a => ({ name: a.name, hp: Math.round(a.hp), dead: a.dead })); },
    get feuds() { return feuds.length; }, get running() { return scene && { name: scene.name, step: scene.i }; },
    turn: e => startTurn(e || E().EnemyMgr.all().find(x => x && !x.dead && !special(x)), false), feud: (a, b) => { const L = E().EnemyMgr.all().filter(x => x && !x.dead && !special(x)); startFeud(a || L[0], b || L[1]); }, wild: e => toWild(e || E().EnemyMgr.all().find(x => x && !x.dead && !special(x))) };
})();
