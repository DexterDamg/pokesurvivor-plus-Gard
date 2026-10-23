/* WILD LIFE — the dungeon feels alive, Pokemon Mystery Dungeon style. Every wild Pokemon is a real Pokemon on the
   field: harmless or harmful, you CAN hit and knock it out — and the others notice.
   - NOT EVERYONE WANTS TO FIGHT: about a quarter of the wild Pokemon that show up just live their lives. They
     wander, nap (Zzz), munch berries, sniff flowers, dig for treasure (and sometimes find a coin), chase their own
     tail until they're dizzy, stare at the clouds, play tag with each other, TRY to swim (and sink, unless they're
     Water-types) or TRY to climb a tree (and fall on their face). They never hurt you, and greet you as you pass.
   - HURTING THE HARMLESS: hit one and it cries out ("Ow! Why?! I wasn't doing anything!"), then runs away crying,
     breaks down in tears, or gets angry and fights back. Knock one out and it may say its last words; the harmless
     ones around it cry ("NO! Leave them alone!"), mourn their friend, flee from you, or turn on you.
   - EVERYONE REACTS: emote bubbles and little speech bubbles everywhere. Harmless Pokemon flee from bosses, gasp at
     shinies, cheer at brawls ("Fight! Fight!"), get startled by your level-ups, and run when fighters drop near
     them. During the big moments — Giratina's Void, the Creation Rift, Kamina's Giga Drill Break — the Pokemon on
     screen panic: some TRY to run (and can't get far), others cower and shake, shouting "RUN!!".
   - HABITAT SCENES: now and then a little moment plays out near you (a male Ralts proposing to a female Ralts,
     Jigglypuff's concert putting everyone to sleep, Meowth stealing Rattata's Gold Ball...). Its actors are real
     Pokemon too: you can interrupt the scene... at a price.
   - GRUDGES: some hostile Pokemon hate each other more than they hate you (a Rattata attacking another Rattata
     because it stole its Gold Ball!). They brawl until one drops or they call a truce.
   - CHANGE OF HEART: some hostile Pokemon realize they'd rather be on your side and JOIN you as an ally (up to 2).
   - Hostile Pokemon taunt you, panic at low HP, bosses introduce themselves.
   Talk-box lines go through js/lake-talk.js (up to three speakers at once), with each Pokemon's portrait.
   The roles (harmless, grudges, allies) only happen in solo, where your game owns the enemies; in co-op you still
   get the chatter, emotes and reactions. Everything is drawn on your own screen only. */
(() => {
  'use strict';
  if (window.PS_WILD_INSTALLED) return; window.PS_WILD_INSTALLED = true;
  const E = () => window.PS_HOOPA_ENGINE, TAU = Math.PI * 2;
  const CFG = { idle: 0.25, grudge: 0.035, turn: 0.02, lowTurn: 0.03, maxAllies: 2, sceneFirst: [25, 40], sceneEvery: [50, 80], despawn: 1300,
    taunt: 0.06, spotEmote: 0.14, feudTime: 20, allyCd: 1.1, allyRange: 280, idleSpd: 0.5 };
  const T = () => window.PS_LAKE_TALK, K = () => window.PS_LAKE?.kit;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = L => L[Math.floor(Math.random() * L.length)];
  const sfx = n => { try { E().Audio.sfx(n); } catch (_) {} };
  const txt = (x, y, t, c) => { try { E().FX.dmgText(x, y, t, c || '#fff'); } catch (_) {} };
  const free = (x, y, r) => { const k = K(); if (k) return k.freeAt(x, y, r); try { return E().World.isFree(x, y, Math.max(6, r * 0.6)); } catch (_) { return true; } };
  const kindAt = (x, y) => { try { return E().World.kindAt(x, y); } catch (_) { return 'floor'; } };
  const solo = () => !(E().Coop && E().Coop.active);
  const clock = () => performance.now() / 1000;
  const nameOf = dex => (E().DEX_BY[dex] && E().DEX_BY[dex].name) || ('#' + dex);
  const typesOf = e => (E().DEX_BY[e.dex] && E().DEX_BY[e.dex].types) || [];
  const label = w => w.name + (w.__g === 'm' || w.g === 'm' ? ' ♂' : w.__g === 'f' || w.g === 'f' ? ' ♀' : '');
  const harmless = e => !!(e && e.__role);
  const COL = { wild: '#c8ffaa', foe: '#ffb0a0', ally: '#9ad8ff' };
  function say(w, kind, face, text, em, o) { o = o || {}; try { return T().line(w.dex, face, text.replace(/\{(\w+)\}/g, (_, k) => o[k] || ''), em, Object.assign({ name: label(w), color: COL[kind], kind, obj: w, shiny: w.shiny }, o)); } catch (_) { return false; } }
  const sayL = (w, kind, list, o) => { const l = pick(list); return say(w, kind, l[0], l[1], l[2], o); };
  const emo = (w, k) => { try { T().emoteAt(w, k); } catch (_) {} };
  const bubbles = [];   // little speech bubbles over heads (for small talk that shouldn't fill the talk box)
  function bubble(w, text, life) { if (!w || w.dead) return; for (let i = bubbles.length - 1; i >= 0; i--) if (bubbles[i].obj === w) bubbles.splice(i, 1); if (bubbles.length > 7) bubbles.shift(); bubbles.push({ obj: w, text, t: 0, life: life || 2.2 }); }

  // ================= lines =================
  const LN = {
    meet: [['happy', 'Oh! A traveler! Be careful out there, okay?', 'note'], ['normal', 'Nice day for a walk, isn\'t it?', 'note'], ['worried', 'P-please don\'t hurt me... I\'m just passing through!', 'sweat'],
      ['worried', 'The mean ones have been extra grumpy lately...', 'sweat'], ['happy', 'Mmm... this spot is so sunny and warm.', 'note'], ['sad', 'Have you seen my friend? ...No? Okay...', 'dots'],
      ['joyous', 'Are you an explorer? That\'s so cool!', 'spark'], ['normal', 'Shh... I\'m looking for berries.', 'dots'], ['happy', 'You look strong! Could you keep the bullies away from here?', 'note']],
    hurt: [['pain', 'Ow! Why?! I wasn\'t doing anything!', 'tear'], ['crying', 'H-hey! What did I do to you?!', 'tear'], ['pain', 'Ouch! Stop it, please!', 'tear'], ['crying', 'I-I\'m not one of them! I\'m just living here!', 'tear']],
    provoked: [['angry', 'That\'s IT! You asked for it!', 'anger'], ['shouting', 'Fine! You want a fight?! You GOT one!', 'anger'], ['angry', 'I was minding my own business... NOT ANYMORE!', 'anger']],
    die: [['crying', 'W-why...?', 'tear'], ['sad', 'I just wanted to... play...', 'tear'], ['crying', 'Mom...?', 'tear'], ['sad', 'It was such... a nice day...', 'tear']],
    witness: [['shouting', 'NO! Leave them alone!', 'anger'], ['angry', 'You MONSTER!', 'anger'], ['crying', 'Why would you DO that?!', 'tear'], ['crying', 'They never hurt anybody!', 'tear']],
    witnessSame: [['crying', 'My friend...! NOOO!', 'tear'], ['crying', 'Wake up! Please, WAKE UP!', 'tear'], ['shouting', 'You\'ll pay for that! They were my FAMILY!', 'anger']],
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
  const BUB = {   // speech-bubble small talk
    swimTry: ['I can do it! I can sw— *blub blub*', 'Just one stroke... *glub*', 'Paddle, paddle... AAAH!'], swimFail: ['...Water is too wet.', '*cough* Maybe tomorrow.', 'Why can\'t I float?!'], swimOk: ['Ahh~ refreshing!', 'Splish splash~'],
    climbTry: ['Hup! Hup!', 'Just... a little... higher...!', 'I can see the top!'], climbFall: ['Oof!', 'Owie...', '...One day I\'ll reach the top.'],
    nap: ['Zzz...', '*snore*', '...five more minutes...'], wake: ['Wha—?!', 'H-huh?! I wasn\'t sleeping!'], eat: ['*munch munch*', 'Nom nom~', 'So juicy!'], sniff: ['Mmm, flowers~', 'So pretty...'],
    dig: ['There\'s gotta be treasure here...', '*dig dig dig*'], digFound: ['Ooh! Treasure!', 'I found a coin!'], digNone: ['...Nothing. Again.', 'Just dirt...'],
    tail: ['I\'ll get you this time!', 'Come back here, tail!'], dizzy: ['@_@', 'The ground is spinning...'], gaze: ['That cloud looks like a berry...', 'So peaceful...', 'I wonder what\'s past the trees...'],
    play: ['Tag! You\'re it!', 'Hehe! Can\'t catch me!'], cry: ['*sniff*...', 'Waaah...'], shiny: ['Ooh, shiny!', 'So sparkly...'], cheer: ['Fight! Fight! Fight!', 'Get \'em!', 'Ooh, that\'s gotta hurt!'],
    scared: ['Eek!', 'Run away!', 'Not again!'], lvl: ['Whoa! It\'s glowing!', 'What was THAT?!'], traitor: ['TRAITOR!', 'Hey! Get back here!'], bossFlee: ['That one\'s HUGE! Run!', 'Nope nope nope!'],
    panic: { giratina: ['W-what IS that thing?!', 'The shadows are MOVING!', 'RUN!! Everyone RUN!', 'I don\'t wanna get eaten!', 'It\'s looking at us!'],
      rift: ['The sky is TEARING!', 'Legendaries?! HERE?!', 'Time is... bending?!', 'Hide! HIDE!'],
      kamina: ['What is he DOING?!', 'That drill is HUGE!', 'Duck!!', 'He\'s CRAZY!'], kaminaSad: ['...Poor little guy.', '...', 'He was so brave...'], stuck: ['I can\'t move!!', 'My legs won\'t work!', 'Mommyyy!'] } };
  const GRUDGE = [
    [['angry', 'HEY! {b}! You stole my Gold Ball!', 'anger'], ['happy', 'Finders keepers! Get lost!', 'note']],
    [['angry', 'That Oran Berry was MINE, {b}!', 'anger'], ['happy', 'Should\'ve eaten it faster, then!', 'note']],
    [['angry', 'You stepped on my tail AGAIN!', 'anger'], ['angry', 'Then keep your tail out of my way!', 'anger']],
    [['shouting', 'You told everyone I can\'t evolve!', 'anger'], ['happy', 'Because you CAN\'T!', 'note']],
    [['angry', 'This is MY napping spot, {b}!', 'anger'], ['angry', 'Your name isn\'t on it!', 'anger']],
    [['angry', 'You laughed at my cry!', 'anger'], ['joyous', 'Because it\'s a FUNNY cry!', 'note']]];
  const GRUDGE_SAME = [[['shouting', 'Give back my Gold Ball, you copycat!', 'anger'], ['angry', 'It\'s MY Gold Ball! We look the same, prove it\'s yours!', 'anger']],
    [['angry', 'Mom always liked you better!', 'anger'], ['happy', 'That\'s because I\'m the cute one!', 'note']]];

  // ================= harmless Pokemon: roles and activities =================
  const seen = new WeakSet(), live = new Set(), fx = [];
  const UNSAFE = /fuse|bomb|boom|explo|summon|jump|kamikaze/i;   // behaviours that could still hurt you on their own
  const special = e => e.boss || e.legend || e.__roamer || e.__maxRaid || e.__wave || e.__legendDen || e.remote || e.golden || e.judge || e.dummy || e.__psCatch;
  function setRole(e, role, act) { e.__role = role; if (!e.__spd0) e.__spd0 = Number(e.spd) || 50; e.__home = { x: e.x, y: e.y }; e.__act = act || null; e.__goal = null; e.__hp0 = Number(e.hp) || 0; }
  function clearRole(e) { e.__role = null; e.__act = null; e.__goal = null; e.__fleeT = 0; e.__sleep = false; }
  function provoke(e) { if (!e.__role) return; clearRole(e); emo(e, 'anger'); sayL(e, 'foe', LN.provoked, { prio: true }); }
  function template() { const N = E(); const src = N.EnemyMgr.all().find(e => e && !e.dead && !special(e) && e.def && !e.__role); if (src) return src.def; const t = (N.Enemies && N.Enemies.TIERS && N.Enemies.TIERS[0]) || { hp: 17, spd: 56, dmg: 6, xp: 3.5 }; return t; }
  function spawnWild(dex, x, y, o) {   // a real Pokemon (it can be hit and knocked out), harmless by role
    const N = E(), b = template(); o = o || {};
    const def = { dex, name: nameOf(dex), behavior: 'chase', hp: b.hp || 17, spd: b.spd || 56, dmg: b.dmg || 6, xp: b.xp || 3 };
    let e = null; try { N.Sprites.preload([dex], 4000); e = new N.Enemy(def, x, y, N.Maps.sc({ hp: 1, spd: 1, dmg: 1 })); N.EnemyMgr.add(e); } catch (err) { console.warn('[wild]', err); return null; }
    seen.add(e); live.add(e); e.__g = o.g || (Math.random() < 0.5 ? 'm' : 'f'); setRole(e, o.role || 'idle'); return e;
  }
  function removeEnemy(e) { const arr = E().EnemyMgr.all(), i = arr.indexOf(e); if (i >= 0) arr.splice(i, 1); e.dead = true; e.gone = true; live.delete(e); }
  // --- finding things to do
  function findKind(e, kind, R) { for (let r = 40; r <= R; r += 28) for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + r * 0.01, x = e.x + Math.cos(a) * r, y = e.y + Math.sin(a) * r; if (kindAt(x, y) === kind) return { x, y }; } return null; }
  function shoreOf(e, w) { const d = dist(e, w), n = Math.ceil(d / 8); let last = { x: e.x, y: e.y }; for (let i = 1; i <= n; i++) { const x = e.x + (w.x - e.x) * i / n, y = e.y + (w.y - e.y) * i / n; if (!free(x, y, e.r || 12)) break; last = { x, y }; } return last; }
  function newAct(e, foes) {
    const kinds = ['wander', 'wander', 'nap', 'eat', 'sniff', 'dig', 'tail', 'gaze', 'swim', 'climb', 'play'];
    for (let tries = 0; tries < 6; tries++) { const k = pick(kinds), a = { kind: k, t: 0, dur: rnd(7, 14), ph: 0, said: false };
      if (k === 'swim') { const w = findKind(e, 'liquid', 280); if (!w) continue; a.water = w; a.shore = shoreOf(e, w); a.dur = 14; }
      if (k === 'climb') { const w = findKind(e, 'wall', 220); if (!w) continue; a.tree = w; a.foot = shoreOf(e, w); a.dur = 12; }
      if (k === 'play') { const m = foes.find(o => o !== e && o.__role === 'idle' && !(o.__act && o.__act.kind === 'play') && dist(o, e) < 220); if (!m) continue; a.mate = m; m.__act = { kind: 'play', t: 0, dur: a.dur, mate: e, ph: 0, said: true }; }
      return a; }
    return { kind: 'wander', t: 0, dur: rnd(6, 10), ph: 0 };
  }
  function goal(e, x, y) { e.__goal = { x, y }; }
  const near = (e, g, r) => Math.hypot(e.x - g.x, e.y - g.y) < (r || 12);
  function runAct(e, dt, p, foes) {
    if (e.__fleeT > 0) { e.__fleeT -= dt; const f = e.__fleeFrom && !e.__fleeFrom.dead ? e.__fleeFrom : p, a = Math.atan2(e.y - f.y, e.x - f.x); goal(e, e.x + Math.cos(a) * 90, e.y + Math.sin(a) * 90); e.__spdMul = 1.15;
      if (e.__crying && Math.random() < dt * 6) fx.push({ kind: 'tear', x: e.x + rnd(-6, 6), y: e.y - (e.bodyH || 40) * 0.7, vx: rnd(-40, 40), vy: -40, t: 0, life: 0.6, g: 300 }); return; }
    e.__crying = false; e.__spdMul = CFG.idleSpd; e.__sleep = false;
    if (e.__role !== 'idle') return;
    let a = e.__act; if (!a || a.t > a.dur || (a.mate && a.mate.dead)) a = e.__act = newAct(e, foes); a.t += dt;
    const home = e.__home || (e.__home = { x: e.x, y: e.y }), H = e.bodyH || 40;
    switch (a.kind) {
      case 'wander': if (!e.__goal || near(e, e.__goal)) { if ((a.w = (a.w || 0) - dt) <= 0) { const ang = Math.random() * TAU, r = rnd(30, 120); goal(e, home.x + Math.cos(ang) * r, home.y + Math.sin(ang) * r); a.w = rnd(1, 3); } else e.__goal = null; } break;
      case 'nap': e.__goal = null; e.__sleep = true; if (Math.random() < dt * 1.6) fx.push({ kind: 'z', x: e.x + 8, y: e.y - H - 4, vx: rnd(6, 14), vy: -18, t: 0, life: 1.6 }); if (!a.said) { a.said = true; bubble(e, pick(BUB.nap)); }
        if (dist(e, p) < 90 && !a.woke) { a.woke = true; emo(e, 'exclaim'); bubble(e, pick(BUB.wake)); a.dur = a.t + 1.5; } if (a.woke) e.__sleep = false; break;
      case 'eat': e.__goal = null; if (!a.said) { a.said = true; fx.push({ kind: 'berry', obj: e, t: 0, life: a.dur }); } if ((a.n = (a.n || 0) - dt) <= 0) { a.n = rnd(1.5, 3); bubble(e, pick(BUB.eat), 1.2); if (Math.random() < 0.3) emo(e, 'note'); } break;
      case 'sniff': e.__goal = null; if (!a.said) { a.said = true; fx.push({ kind: 'flower', obj: e, t: 0, life: a.dur }); emo(e, 'heart'); bubble(e, pick(BUB.sniff)); } break;
      case 'dig': e.__goal = null; if (Math.random() < dt * 8) fx.push({ kind: 'dust', x: e.x + rnd(-8, 8), y: e.y + 2, vx: rnd(-50, 50), vy: rnd(-70, -30), t: 0, life: 0.5, g: 200 });
        if (!a.said) { a.said = true; bubble(e, pick(BUB.dig)); } if (a.t > a.dur - 0.1 && !a.done) { a.done = true; if (Math.random() < 0.25) { try { E().Pickups.drop('coin', e.x, e.y + 10, 1); } catch (_) {} emo(e, 'spark'); bubble(e, pick(BUB.digFound)); } else { emo(e, 'dots'); bubble(e, pick(BUB.digNone)); } } break;
      case 'tail': { const s = a.t * 5; goal(e, home.x + Math.cos(s) * 26, home.y + Math.sin(s) * 18); e.__spdMul = 1; if (!a.said) { a.said = true; bubble(e, pick(BUB.tail)); }
        if (a.t > a.dur - 2 && !a.dz) { a.dz = true; e.__goal = null; emo(e, 'question'); bubble(e, pick(BUB.dizzy)); fx.push({ kind: 'stars', obj: e, t: 0, life: 2 }); } if (a.dz) e.__goal = null; break; }
      case 'gaze': e.__goal = null; if (!a.said) { a.said = true; emo(e, 'dots'); if (Math.random() < 0.6) bubble(e, pick(BUB.gaze), 3); } break;
      case 'swim': {
        const types = typesOf(e), wet = types.includes('water');
        if (a.ph === 0) { goal(e, a.shore.x, a.shore.y); if (near(e, a.shore, 14) || a.t > 6) { a.ph = 1; a.t0 = a.t; bubble(e, pick(wet ? BUB.swimOk : BUB.swimTry)); if (!wet) emo(e, 'sweat'); } }
        else if (a.ph === 1) { e.__goal = { x: a.water.x, y: a.water.y }; if (Math.random() < dt * 10) fx.push({ kind: 'drop', x: (e.x + a.water.x) / 2 + rnd(-10, 10), y: (e.y + a.water.y) / 2, vx: rnd(-60, 60), vy: rnd(-110, -60), t: 0, life: 0.6, g: 320 });
          if (a.t - a.t0 > 3) { a.ph = 2; e.__goal = null; if (!wet) { emo(e, 'tear'); bubble(e, pick(BUB.swimFail)); for (let i = 0; i < 8; i++) fx.push({ kind: 'drop', x: e.x, y: e.y - H * 0.6, vx: rnd(-70, 70), vy: rnd(-90, -20), t: -i * 0.05, life: 0.7, g: 300 }); } else emo(e, 'note'); a.dur = a.t + 2.5; } }
        break; }
      case 'climb':
        if (a.ph === 0) { goal(e, a.foot.x, a.foot.y); if (near(e, a.foot, 14) || a.t > 6) { a.ph = 1; a.t0 = a.t; bubble(e, pick(BUB.climbTry)); } }
        else if (a.ph === 1) { const k = Math.sin((a.t - a.t0) * 9); e.__goal = { x: a.tree.x, y: a.tree.y }; e.__lift = Math.max(0, k) * 10 + (a.t - a.t0) * 4;
          if (Math.random() < dt * 5) fx.push({ kind: 'dust', x: a.foot.x + (a.tree.x - a.foot.x) * 0.4 + rnd(-6, 6), y: a.foot.y - H * 0.5, vx: rnd(-30, 30), vy: rnd(10, 40), t: 0, life: 0.5, g: 200, c: '120,170,80' });
          if (a.t - a.t0 > 3.2) { a.ph = 2; e.__lift = 0; e.__goal = null; emo(e, 'sweat'); bubble(e, pick(BUB.climbFall)); fx.push({ kind: 'stars', obj: e, t: 0, life: 2.2 }); txt(e.x, e.y - H - 6, 'Oof!', '#ffe27a'); a.dur = a.t + 2.5; } }
        break;
      case 'play': { const m = a.mate; if (!m || m.dead) { a.dur = 0; break; } const s = a.t * 2 + (m.__act === a ? 0 : Math.PI); goal(e, m.x + Math.cos(s) * 60, m.y + Math.sin(s) * 40); e.__spdMul = 0.9;
        if (!a.said) { a.said = true; bubble(e, pick(BUB.play)); } if (Math.random() < dt * 0.6) emo(e, pick(['note', 'heart'])); break; }
      case 'leave': { const ang = a.ang ?? (a.ang = Math.atan2(e.y - p.y, e.x - p.x)); goal(e, e.x + Math.cos(ang) * 80, e.y + Math.sin(ang) * 80); e.__spdMul = 0.8; if (dist(e, p) > 900) removeEnemy(e); a.dur = 999; break; }
      case 'follow': { const m = a.mate; if (!m || m.dead) { a.dur = 0; break; } if (dist(e, m) > 36) goal(e, m.x - 22, m.y + 6); else e.__goal = null; a.dur = 999; break; }
      case 'cry': e.__goal = null; if (Math.random() < dt * 6) fx.push({ kind: 'tear', x: e.x + rnd(-6, 6), y: e.y - H * 0.7, vx: rnd(-40, 40), vy: -40, t: 0, life: 0.6, g: 300 }); if (!a.said) { a.said = true; bubble(e, pick(BUB.cry)); } break;
    }
    if (a.kind !== 'climb') e.__lift = 0;
  }
  function hops(e, dt) { if (e.__hopN > 0) { e.__hopT += dt * 9; if (e.__hopT >= Math.PI) { e.__hopT = 0; e.__hopN--; } e.__lift = Math.abs(Math.sin(e.__hopT)) * 12; } else if (e.__hopN === 0) { e.__hopN = null; e.__lift = 0; } }
  // a hit on someone harmless
  function onHarmlessHit(e, p, foes) {
    if ((e.__hitCd || 0) > clock()) return; e.__hitCd = clock() + 4;
    if (e.__role === 'scene' && scene) abortScene();
    if (!e.__hurtSaid) { e.__hurtSaid = true; sayL(e, 'wild', LN.hurt, { prio: true }); } else emo(e, 'tear');
    const r = Math.random();
    if (r < 0.5) { e.__fleeT = 6; e.__fleeFrom = p; e.__crying = true; }
    else if (r < 0.8) provoke(e);
    else { e.__act = { kind: 'cry', t: 0, dur: 5 }; }
    for (const o of foes) if (o !== e && harmless(o) && dist(o, e) < 200) { emo(o, pick(['exclaim', 'sweat'])); if (Math.random() < 0.3) { o.__fleeT = 4; o.__fleeFrom = p; } }
  }
  // a harmless Pokemon knocked out: last words, and the others react
  let deathCd = 0;
  function onHarmlessDeath(e, p) {
    const now = clock(); if (now > deathCd && Math.random() < 0.55) { deathCd = now + 2.5; sayL(e, 'wild', LN.die, { prio: true }); }
    const W = E().EnemyMgr.all().filter(o => o && !o.dead && harmless(o) && dist(o, e) < 280); let spoke = false;
    for (const o of W) { emo(o, 'tear'); const same = Number(o.dex) === Number(e.dex);
      if (!spoke && now > (onHarmlessDeath.cd || 0)) { spoke = true; onHarmlessDeath.cd = now + 3; sayL(o, 'wild', same ? LN.witnessSame : LN.witness, { prio: true, delay: 0.5 }); }
      const r = Math.random(); if (r < 0.5) { o.__fleeT = 6; o.__fleeFrom = p; o.__crying = true; } else if (r < 0.75 || same && r < 0.9) provoke(o); else o.__act = { kind: 'cry', t: 0, dur: 6 }; }
    if (scene && Object.values(scene.actors).includes(e)) abortScene();
  }

  // ================= habitat scenes (real Pokemon) =================
  // actors: [id, dex, dx, dy, opts]; steps: ['say', id, face, text, emote] ['emote', id, kind] ['move', id, idOr[dx,dy], speedMul] ['wait', s] ['hop', id, n]
  //   ['sleep', id, on] ['fx', kind, id] ['mode', id, mode, otherId] ['end']
  const SCENES = {
    proposal: { actors: [['a', 280, -80, 0, { g: 'm' }], ['b', 280, 40, -6, { g: 'f' }]], steps: [
      ['emote', 'b', 'note'], ['wait', 1], ['move', 'a', [10, -2]], ['say', 'a', 'worried', 'R-Ralts... can I tell you something?', 'sweat'], ['say', 'b', 'surprised', 'Hm? What is it?', 'question'],
      ['fx', 'ring', 'a'], ['say', 'a', 'determined', 'Will you... be my partner? Forever and ever?', 'heart'], ['wait', 1.2], ['say', 'b', 'teary', '...Yes! YES! A thousand times yes!', 'heart'],
      ['fx', 'hearts', 'a'], ['fx', 'hearts', 'b'], ['hop', 'a'], ['hop', 'b'], ['say', 'a', 'joyous', 'She said YES!!', 'heart'], ['wait', 1], ['mode', 'b', 'follow', 'a'], ['end']] },
    concert: { actors: [['j', 39, 0, -10], ['l1', 172, -60, 30], ['l2', 35, 60, 30]], steps: [
      ['say', 'j', 'happy', 'Jiggly~ Puff~ Jigglyyy~ ♪', 'note'], ['fx', 'notes', 'j'], ['wait', 1.4], ['sleep', 'l1', true], ['wait', 0.6], ['sleep', 'l2', true], ['fx', 'notes', 'j'], ['wait', 1.5],
      ['say', 'j', 'angry', '...They fell ASLEEP?! AGAIN?!', 'anger'], ['move', 'j', 'l1'], ['fx', 'scribble', 'l1'], ['move', 'j', 'l2'], ['fx', 'scribble', 'l2'],
      ['say', 'j', 'sigh', 'Hmph. Let\'s see them laugh at THAT when they wake up.', 'dots'], ['wait', 1], ['end']] },
    snack: { actors: [['s', 143, 30, 0], ['m', 446, -110, 10]], steps: [
      ['sleep', 's', true], ['fx', 'berry', 's'], ['wait', 1], ['say', 'm', 'happy', 'Shhh... just one little berry...', 'note'], ['move', 'm', [0, 12], 0.6], ['wait', 0.6], ['sleep', 's', false],
      ['say', 's', 'stunned', '...hm? ...Who\'s eating my snack?', 'exclaim'], ['emote', 'm', 'sweat'], ['say', 'm', 'worried', 'N-nobody! It was the wind!', 'sweat'], ['mode', 'm', 'leave'], ['wait', 1.2],
      ['say', 's', 'sigh', '...zzz...', 'dots'], ['sleep', 's', true], ['end']] },
    dream: { actors: [['c', 10, -30, 10], ['b', 12, 40, -10]], steps: [
      ['say', 'c', 'inspired', 'Butterfree... will I really fly like you one day?', 'spark'], ['say', 'b', 'happy', 'Of course, little one. Every wing starts as a dream.', 'heart'],
      ['hop', 'c'], ['say', 'c', 'joyous', 'Then I\'ll eat ALL the leaves and grow super fast!', 'note'], ['fx', 'hearts', 'b'], ['end']] },
    training: { actors: [['m', 66, 0, 0], ['m2', 66, 50, 10]], steps: [
      ['hop', 'm'], ['say', 'm', 'determined', '98... 99... ONE HUNDRED!', 'spark'], ['hop', 'm2'], ['say', 'm2', 'shouting', 'Pfft. I did TWO hundred!', 'anger'],
      ['say', 'm', 'angry', 'Then I\'ll do THREE hundred!', 'anger'], ['hop', 'm'], ['hop', 'm2'], ['say', 'm2', 'joyous', 'Muscles never sleep!!', 'spark'], ['end']] },
    headache: { actors: [['p', 54, -30, 0], ['s', 79, 40, 4]], steps: [
      ['emote', 'p', 'question'], ['say', 'p', 'worried', 'Psy...? My head hurts... again...', 'sweat'], ['wait', 0.8], ['say', 's', 'normal', '...................', 'dots'], ['wait', 2.2],
      ['say', 's', 'surprised', '...oh. Hi.', 'question'], ['say', 'p', 'dizzy', 'That took you a whole minute...', 'sweat'], ['end']] },
    tree: { actors: [['w', 185, 0, 0], ['b', 438, -50, 12]], steps: [
      ['say', 'w', 'determined', 'Shh! I\'m a tree. Totally a tree. Nothing to see here.', 'dots'], ['hop', 'b'], ['say', 'b', 'happy', 'Me too! Me too! I\'m a tree!', 'note'], ['emote', 'w', 'anger'],
      ['say', 'w', 'angry', 'Trees don\'t TALK!', 'anger'], ['say', 'b', 'sad', '...You\'re talking.', 'dots'], ['wait', 0.8], ['say', 'w', 'stunned', '..........', 'sweat'], ['end']] },
    berry: { actors: [['a', 25, -40, 0, { g: 'm' }], ['b', 25, 40, 0, { g: 'f' }]], steps: [
      ['move', 'a', [-12, 0]], ['say', 'a', 'happy', 'I found an Oran Berry! ...Want half?', 'heart'], ['say', 'b', 'joyous', 'You\'re the BEST!', 'heart'], ['fx', 'hearts', 'a'], ['fx', 'hearts', 'b'], ['hop', 'b'], ['mode', 'a', 'follow', 'b'], ['end']] },
    tag: { actors: [['e', 133, -30, 0], ['t', 175, 30, 0]], steps: [
      ['say', 'e', 'joyous', 'Tag! You\'re it!', 'note'], ['move', 'e', [-90, -20], 1], ['say', 't', 'happy', 'Toge-toge-priiii!', 'note'], ['move', 't', 'e', 1], ['hop', 'e'], ['move', 'e', [60, 40], 1],
      ['move', 't', 'e', 1], ['say', 'e', 'joyous', 'Hehe! Can\'t catch me!', 'note'], ['move', 'e', [-20, 70], 1], ['move', 't', 'e', 1], ['say', 't', 'happy', 'Got youuu!', 'heart'], ['hop', 't'], ['end']] },
    thief: { actors: [['r', 19, -40, 0], ['m', 52, 30, 0]], steps: [
      ['fx', 'coin', 'r'], ['wait', 0.8], ['move', 'm', 'r'], ['fx', 'grab', 'm'], ['say', 'r', 'angry', 'HEY! That\'s my Gold Ball!', 'anger'], ['say', 'm', 'joyous', 'Finders keepers, nya~!', 'note'],
      ['mode', 'm', 'leave'], ['wait', 0.5], ['say', 'r', 'shouting', 'Get back here, you thief!!', 'anger'], ['mode', 'r', 'leave'], ['end']] },
    dance: { actors: [['s', 327, 0, 0]], steps: [
      ['say', 's', 'happy', 'Left, right... spin, spin...', 'note'], ['hop', 's'], ['move', 's', [30, 10]], ['move', 's', [-20, 20]], ['move', 's', [0, 0]], ['say', 's', 'dizzy', 'Whoaaa... the world is spinning... wait, it\'s always spinning...', 'question'], ['end']] },
    family: { actors: [['k', 194, -20, 10], ['q', 195, 30, 0]], steps: [
      ['say', 'k', 'happy', 'Papa! Papa! Look, I can swim backwards!', 'note'], ['hop', 'k'], ['say', 'q', 'happy', '...That\'s amazing, kiddo.', 'heart'], ['wait', 0.8], ['say', 'q', 'normal', '...', 'dots'], ['say', 'k', 'joyous', 'Papa, you\'re making the face again!', 'note'], ['fx', 'hearts', 'q'], ['end']] } };
  let scene = null, sceneT = rnd(...CFG.sceneFirst);
  function startScene(name, p) {
    const def = SCENES[name]; if (!def || !p || !solo()) return false;
    for (let tries = 0; tries < 24; tries++) {
      const a = Math.random() * TAU, d = rnd(240, 340), cx = p.x + Math.cos(a) * d, cy = p.y + Math.sin(a) * d * 0.6;
      if (!def.actors.every(([, , dx, dy]) => free(cx + dx, cy + dy, 14))) continue;
      if (E().EnemyMgr.all().some(e => e && !e.dead && !harmless(e) && Math.hypot(e.x - cx, e.y - cy) < 150)) continue;
      const actors = {}; for (const [id, dex, dx, dy, o] of def.actors) { const e = spawnWild(dex, cx + dx, cy + dy, Object.assign({ role: 'scene' }, o || {})); if (!e) return false; actors[id] = e; }
      scene = { name, def, actors, i: 0, wait: 0.6, cx, cy, until: null, t: 0 }; return true; }
    return false;
  }
  function runStep(sc, st) {
    const A = sc.actors, w = A[st[1]], at = v => typeof v === 'string' ? { x: A[v].x + (A[v].x > w.x ? -26 : 26), y: A[v].y + 2 } : { x: sc.cx + v[0], y: sc.cy + v[1] };
    switch (st[0]) {
      case 'say': say(w, 'wild', st[2], st[3], st[4], { prio: true }); sc.wait = st[3].length / 45 + 1.3; break;
      case 'emote': emo(w, st[2]); sc.wait = 0.5; break;
      case 'move': { const g = at(st[2]); w.__goal = g; w.__spdMul = st[3] || 0.6; sc.until = () => near(w, g, 14); sc.wait = 5; break; }
      case 'wait': sc.wait = st[1]; break;
      case 'hop': w.__hopN = 2; w.__hopT = 0; fx.push({ kind: 'ring', x: w.x, y: w.y, t: 0, life: 0.5, r: 1 }); sc.wait = 0.3; break;
      case 'sleep': w.__sleep = !!st[2]; if (!st[2]) emo(w, 'exclaim'); sc.wait = 0.3; break;
      case 'fx': { const v = A[st[2]], k = st[1], H = v.bodyH || 40;
        if (k === 'hearts') for (let i = 0; i < 6; i++) fx.push({ kind: 'heart', x: v.x + rnd(-10, 10), y: v.y - H, vx: rnd(-20, 20), vy: rnd(-50, -30), t: -i * 0.12, life: 1.4 });
        else if (k === 'notes') for (let i = 0; i < 8; i++) fx.push({ kind: 'note', x: v.x + rnd(-8, 8), y: v.y - H, vx: rnd(-30, 30), vy: rnd(-40, -25), t: -i * 0.2, life: 1.8 });
        else if (k === 'ring') fx.push({ kind: 'gem', x: v.x + 14, y: v.y - H * 0.6, t: 0, life: 2.6 });
        else if (k === 'scribble') { fx.push({ kind: 'scribble', obj: v, t: 0, life: 99 }); emo(sc.actors.j || v, 'anger'); }
        else if (k === 'berry') fx.push({ kind: 'berry', obj: v, t: 0, life: 6 });
        else if (k === 'coin') fx.push({ kind: 'coin', obj: v, t: 0, life: 99 });
        else if (k === 'grab') { for (const f of fx) if (f.kind === 'coin') f.obj = v; }
        sc.wait = 0.4; break; }
      case 'mode': if (st[2] === 'follow') { w.__role = 'idle'; w.__act = { kind: 'follow', mate: A[st[3]], t: 0, dur: 999 }; } else if (st[2] === 'leave') { w.__role = 'idle'; w.__act = { kind: 'leave', t: 0, dur: 999 }; } sc.wait = 0.2; break;
      case 'end': endScene(); break;
    }
  }
  function endScene() { if (!scene) return; for (const id in scene.actors) { const c = scene.actors[id]; if (!c.dead && c.__role === 'scene') { c.__role = 'idle'; c.__home = { x: c.x, y: c.y }; c.__met = true; c.__sleep = false; } } scene = null; sceneT = rnd(...CFG.sceneEvery); }
  function abortScene() { endScene(); }
  function updateScene(dt, p) {
    if (!scene) { sceneT -= dt; if (sceneT <= 0) { sceneT = 8; startScene(pick(Object.keys(SCENES)), p); } return; }
    const sc = scene; sc.t += dt;
    if (Object.values(sc.actors).some(a => a.dead) || Math.hypot(sc.cx - p.x, sc.cy - p.y) > 900 || sc.t > 70) { endScene(); return; }
    for (const a of Object.values(sc.actors)) if (a.__sleep && Math.random() < dt * 1.6) fx.push({ kind: 'z', x: a.x + 8, y: a.y - (a.bodyH || 40) - 4, vx: rnd(6, 14), vy: -18, t: 0, life: 1.6 });
    if (sc.until) { if (sc.until() || (sc.wait -= dt) <= 0) { sc.until = null; sc.wait = 0.15; for (const a of Object.values(sc.actors)) if (near(a, a.__goal || a, 14)) a.__goal = null; } return; }
    if ((sc.wait -= dt) > 0) return;
    const st = sc.def.steps[sc.i++]; if (!st) { endScene(); return; } runStep(sc, st);
  }

  // ================= hostile Pokemon: grudges, changes of heart, chatter =================
  const feuds = [];
  function meet(e, p) {
    seen.add(e); live.add(e); if (!e.__g) e.__g = Math.random() < 0.5 ? 'm' : 'f';
    if (special(e) || !solo()) return;
    const r = Math.random(), calm = !e.psAi || e.psAi === 'aggressive' || e.psAi === 'passive' || e.psAi === 'skittish';
    if (r < CFG.idle && !UNSAFE.test(e.behavior || '')) setRole(e, 'idle');
    else if (r < CFG.idle + CFG.grudge && calm) e.__wantFeud = clock() + 12;
    else if (r < CFG.idle + CFG.grudge + CFG.turn && calm) e.__turnAt = clock() + rnd(4, 12);
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
    if (why === 'time' && w == null && !a.dead && !b.dead) { sayL(a, 'foe', LN.truce); return; }
    if (w && !w.gone) { if (Math.random() < 0.3 && solo()) { sayL(w, 'wild', LN.home, { prio: true }); setRole(w, 'idle', { kind: 'leave', t: 0, dur: 999 }); } else sayL(w, 'foe', LN.win, { prio: true }); }
  }
  function updateFeuds(dt, foes) {
    for (const f of feuds.slice()) { f.t -= dt; const { a, b } = f;
      if (a.dead || b.dead || a.gone || b.gone) { endFeud(f, 'ko'); continue; } if (f.t <= 0) { endFeud(f, 'time'); continue; }
      for (const [x, y, fights] of [[a, b, true], [b, a, f.bFights]]) { if (!fights) continue; x.__fhit = (x.__fhit || 0) - dt;
        if (dist(x, y) < (x.r || 12) + (y.r || 12) + 10 && x.__fhit <= 0) { x.__fhit = 0.75; let d = 8; try { d = typeof x.dmg === 'function' ? x.dmg() : (x._dmg || 8); } catch (_) {}
          try { y.hurt(Math.max(4, d * 2), '#ff7a3a', y.x - x.x, y.y - x.y, 60); } catch (_) {} if (Math.random() < 0.3) emo(x, 'anger'); } }
      for (const o of foes) if (harmless(o) && !o.__cheered && dist(o, a) < 220) { o.__cheered = true; if (Math.random() < 0.4) { bubble(o, pick(BUB.cheer)); emo(o, 'note'); } else { emo(o, 'sweat'); o.__fleeT = 2; o.__fleeFrom = a; } } }
  }
  function startTurn(e, beg) { if (!e || e.__feud || e.__turning || e.dead || harmless(e)) return; e.__turning = { t: 0, said: 0, beg }; e.__turnAt = 0; sayL(e, 'foe', beg ? LN.beg : LN.turn1, { prio: true }); emo(e, beg ? 'tear' : 'question'); }
  function updateTurns(dt) {
    for (const e of live) { const tn = e.__turning; if (!tn) continue; if (e.dead) { e.__turning = null; continue; } tn.t += dt;
      if (tn.said === 0 && tn.t > 2.4) { tn.said = 1; if (!tn.beg) sayL(e, 'ally', LN.turn2, { prio: true }); emo(e, 'exclaim'); }
      if (tn.t > 4.2) { e.__turning = null; toAlly(e); } }
  }
  let chatCd = 0;
  function chatter(dt, p, foes) {
    chatCd -= dt;
    for (const e of foes) {
      const st = e.__wl || (e.__wl = { spot: false, low: false });
      if (harmless(e)) { if (!e.__met && dist(e, p) < 150) { e.__met = true; if (Math.random() < 0.35 && chatCd <= 0) { chatCd = 5; sayL(e, 'wild', LN.meet); } else emo(e, 'question'); } continue; }
      if (!st.spot && dist(e, p) < 230) { st.spot = true;
        if ((e.boss || e.legend) && Math.random() < 0.6) sayL(e, 'foe', LN.boss, { prio: true });
        else if ((e.behavior === 'thief' || e.golden) && Math.random() < 0.4) sayL(e, 'foe', LN.thief);
        else if (Math.random() < CFG.taunt && chatCd <= 0) { chatCd = 6; sayL(e, 'foe', LN.taunt); }
        else if (Math.random() < CFG.spotEmote) emo(e, pick(['exclaim', 'exclaim', 'anger'])); }
      if (!st.low && e.hp < e.maxHp * 0.3 && !e.boss) { st.low = true;
        if (solo() && !e.__turning && !special(e) && allies.length < CFG.maxAllies && Math.random() < CFG.lowTurn && dist(e, p) < 320) startTurn(e, true);
        else if (Math.random() < 0.08 && chatCd <= 0) { chatCd = 6; sayL(e, 'foe', LN.low); } else if (Math.random() < 0.35) emo(e, 'sweat'); }
    }
  }
  // everyone reacts: deaths, bosses, shinies, your level-ups
  let lvl0 = 0;
  function reactions(p, foes) {
    for (const e of [...live]) { if (!e.dead) continue; live.delete(e); if (e.gone) continue;
      if (e.__role) { onHarmlessDeath(e, p); continue; }
      for (const o of foes) if (harmless(o) && dist(o, e) < 180) { emo(o, 'sweat'); if (Math.random() < 0.4) { o.__fleeT = 3; o.__fleeFrom = e; if (Math.random() < 0.3) bubble(o, pick(BUB.scared), 1.4); } }
      if (dist(e, p) < 500 && Math.random() < 0.05 && chatCd <= 0) { const pal = foes.find(o => o !== e && !harmless(o) && Number(o.dex) === Number(e.dex) && dist(o, e) < 220); if (pal) { chatCd = 6; sayL(pal, 'foe', LN.avenge); } } }
    for (const o of foes) { if (!harmless(o)) continue;
      if (o.__hp0 != null && o.hp < o.__hp0 - 0.01) onHarmlessHit(o, p, foes); o.__hp0 = o.hp;
      const big = foes.find(b => (b.boss || b.legend) && dist(b, o) < 350); if (big && o.__bossFled !== big) { o.__bossFled = big; o.__fleeT = 5; o.__fleeFrom = big; emo(o, 'sweat'); if (Math.random() < 0.4) bubble(o, pick(BUB.bossFlee)); }
      if (!o.__shinySeen) { const sh = foes.find(b => b !== o && b.shiny && dist(b, o) < 220); if (sh) { o.__shinySeen = true; if (Math.random() < 0.3) { emo(o, 'heart'); bubble(o, pick(BUB.shiny)); } } } }
    const lv = Number(p.level) || 1; if (lv > lvl0) { if (lvl0) for (const o of foes) if (harmless(o) && dist(o, p) < 250) { emo(o, pick(['exclaim', 'spark'])); if (Math.random() < 0.2) bubble(o, pick(BUB.lvl), 1.6); } lvl0 = lv; }
  }

  // ================= the big moments: Giratina's Void, the Creation Rift, Giga Drill Break =================
  // the battle is frozen during these, so this runs on its own clock: some Pokemon TRY to run, the rest cower
  let panicKind = null, panicT = 0;
  function eventKind() { if (window.PS_GIRATINA?.active) return 'giratina'; if (window.PS_CREATION_RIFT?.active) return 'rift'; if (window.PS_KAMINA?.active) return 'kamina'; if (window.PS_DIGGER?.active) return 'kaminaSad'; return null; }
  function panicTick(dt) {
    const N = E(), p = N?.Game?.player; if (!p) return; const k = eventKind();
    if (k !== panicKind) { if (panicKind && !k) for (const e of N.EnemyMgr.all()) if (e && !e.dead && e.__panic) { if (harmless(e)) { e.__fleeT = 5; e.__fleeFrom = p; } e.__panic = null; }
      panicKind = k; panicT = 0;
      if (k) { const L = N.EnemyMgr.all().filter(e => e && !e.dead && !e.boss && !e.legend && !e.arceus && dist(e, p) < 750); let shouts = 0;
        for (const e of L) { if (k === 'kaminaSad') { if (harmless(e)) { emo(e, 'tear'); if (shouts++ < 2) bubble(e, pick(BUB.panic.kaminaSad), 3); } continue; }
          const run = Math.random() < 0.55; e.__panic = { run, ang: Math.atan2(e.y - p.y, e.x - p.x) + rnd(-0.5, 0.5), v: rnd(40, 75), t: 0, stuck: false };
          setTimeout(() => emo(e, run ? 'exclaim' : 'sweat'), rnd(0, 600)); if (shouts < 3 && Math.random() < 0.35) { shouts++; bubble(e, pick(BUB.panic[k]), 2.6); } } } }
    if (!k || k === 'kaminaSad') return; panicT += dt;
    for (const e of N.EnemyMgr.all()) { const pn = e && !e.dead && e.__panic; if (!pn) continue; pn.t += dt;
      if (pn.run && !pn.stuck) { const sp = pn.v * Math.max(0.15, 1 - pn.t / 6), nx = e.x + Math.cos(pn.ang) * sp * dt, ny = e.y + Math.sin(pn.ang) * sp * dt;   // they run... but never far enough
        if (free(nx, ny, e.r || 12)) { e.x = nx; e.y = ny; } else pn.ang += rnd(-1.5, 1.5);
        try { e.anim.loop('Walk'); e.anim.dir = N.Sprites.dirFromAngle(pn.ang); e.anim.update(dt); } catch (_) {}
        if (pn.t > 4 && !pn.stuck && Math.random() < dt * 0.3) { pn.stuck = true; emo(e, 'tear'); if (Math.random() < 0.4) bubble(e, pick(BUB.panic.stuck), 2); } }
      else { const j = Math.sin(pn.t * 40) * 0.8; e.x += j - (pn.j || 0); pn.j = j; if (Math.random() < dt * 0.25) emo(e, pick(['sweat', 'tear'])); } }
  }

  // ================= allies =================
  const allies = [], shots = [];
  const TYPE_COL = { normal: '#e8e0c8', fire: '#ff7a2a', water: '#4aa8ff', grass: '#6ad05a', electric: '#ffe04a', ice: '#9ae8ff', fighting: '#d0503a', poison: '#b05ad0', ground: '#d0a860', flying: '#a8c0ff', psychic: '#ff6ab0', bug: '#a8c83a', rock: '#b8a058', ghost: '#7a6ab0', dragon: '#7a5aff', dark: '#6a5848', steel: '#b8b8d0', fairy: '#ffa8d8' };
  const RANGED = new Set(['ranged', 'fan', 'beamer', 'zoner', 'sniper']);
  function toAlly(e) {
    const N = E(), p = N.Game.player; if (!p || allies.length >= CFG.maxAllies) { setRole(e, 'idle', { kind: 'leave', t: 0, dur: 999 }); return; }
    let anim = null; try { anim = new N.Sprites.Animator(Number(e.dex), 1, !!e.shiny); } catch (_) {}
    const a = { kind: 'ally', dex: Number(e.dex), name: e.name, g: e.__g, shiny: !!e.shiny, x: e.x, y: e.y, r: e.r || 12, bodyH: e.bodyH || 40, anim, maxHp: Math.max(60, Math.round((Number(p.maxHp) || 100) * 0.6)), cd: rnd(0.4, 1), hurtCd: 0,
      type: e.atkType || 'normal', ranged: RANGED.has(e.behavior) || e.psAi === 'sniper', slot: allies.length, idleT: rnd(40, 70), lowSaid: false, dead: false, t: 0, lift: 0 };
    a.hp = a.maxHp; a.proxy = { get x() { return a.x; }, get y() { return a.y; }, get r() { return a.r; }, get dead() { return a.dead; }, get hp() { return a.hp; }, get maxHp() { return a.maxHp; }, bodyH: a.bodyH, hurt(n) { allyHurt(a, n); } };
    removeEnemy(e); allies.push(a);
    txt(a.x, a.y - 50, label(a) + ' joined your team!', '#9ad8ff'); sfx('shiny'); emo(a, 'heart');
    for (let i = 0; i < 6; i++) fx.push({ kind: 'heart', x: a.x + rnd(-10, 10), y: a.y - a.bodyH, vx: rnd(-20, 20), vy: rnd(-50, -30), t: -i * 0.1, life: 1.3 });
    for (const o of N.EnemyMgr.all()) if (o && !o.dead && dist(o, a) < 260) { if (harmless(o)) emo(o, 'question'); else if (Math.random() < 0.35) { emo(o, 'anger'); bubble(o, pick(BUB.traitor), 1.6); } }
    if (Number(p.dex) === 530) { try { T().line(530, 'joyous', 'Ha! Welcome to the Gurren Brigade, ' + a.name + '!', 'heart', { prio: true, delay: 0.6 }); } catch (_) {} }
  }
  function allyHurt(a, n) { if (a.dead || a.hurtCd > 0 || !(n > 0)) return; a.hurtCd = 0.45; a.hp -= n; a.flash = 0.15;
    if (!a.lowSaid && a.hp < a.maxHp * 0.35 && a.hp > 0) { a.lowSaid = true; sayL(a, 'ally', LN.allyLow); }
    if (a.hp <= 0) { a.hp = 0; a.dead = true; a.leaveT = 0; sayL(a, 'ally', LN.allyFaint, { prio: true }); txt(a.x, a.y - 44, a.name + ' fainted...', '#9ad8ff'); } }
  function hitEnemy(a, e, mult) { const N = E(), p = N.Game.player; let m = 1; try { m = N.Types.mult(a.type, e.types || ['normal']); } catch (_) {}
    const dmg = 10 * (Number(p && p.atk) || 1) * m * (mult || 1), was = e.dead;
    try { e.hurt(dmg, TYPE_COL[a.type] || '#fff', e.x - a.x, e.y - a.y, 60); N.Stats.dmg(p, 'ally', dmg); } catch (_) {}
    try { N.FX.burst(e.x, e.y - 10, TYPE_COL[a.type] || '#fff', 8, 140); } catch (_) {}
    if (!was && e.dead && Math.random() < 0.25) sayL(a, 'ally', LN.allyKill); }
  function stepTo(w, gx, gy, sp, dt) {
    const dx = gx - w.x, dy = gy - w.y, d = Math.hypot(dx, dy); if (d < 4) return true; const st = Math.min(d, sp * dt), nx = w.x + dx / d * st, ny = w.y + dy / d * st;
    if (free(nx, ny, w.r)) { w.x = nx; w.y = ny; } else if (free(nx, w.y, w.r)) w.x = nx; else if (free(w.x, ny, w.r)) w.y = ny; else return true;
    w.moved = true; w.dir = Math.atan2(dy, dx); return false;
  }
  function updateAllies(dt, p, foes) {
    const k = K();
    for (let i = allies.length - 1; i >= 0; i--) { const a = allies[i]; a.t += dt; a.moved = false; a.hurtCd -= dt; a.cd -= dt; a.flash = Math.max(0, (a.flash || 0) - dt);
      if (a.dead) { a.leaveT += dt; const ang = Math.atan2(a.y - p.y, a.x - p.x); stepTo(a, a.x + Math.cos(ang) * 40, a.y + Math.sin(ang) * 40, 50, dt); if (a.leaveT > 2.5) { a.gone = true; allies.splice(i, 1); } continue; }
      a.hp = Math.min(a.maxHp, a.hp + a.maxHp * 0.004 * dt);
      if (dist(a, p) > 750 && k) { const f = k.nearFree(p.x - 40, p.y + 30, a.r); a.x = f.x; a.y = f.y; }
      const tg = foes.filter(e => !e.__turning && !harmless(e) && dist(e, p) < CFG.allyRange + 80 && dist(e, a) < CFG.allyRange).sort((x, y) => dist(x, a) - dist(y, a))[0];
      if (tg) { const want = a.ranged ? 150 : (a.r + (tg.r || 12) + 4), d = dist(a, tg), ang = Math.atan2(tg.y - a.y, tg.x - a.x); a.dir = ang;
        if (d > want + 6) stepTo(a, tg.x - Math.cos(ang) * want, tg.y - Math.sin(ang) * want, 105, dt); else if (a.ranged && d < want - 40) stepTo(a, a.x - Math.cos(ang) * 30, a.y - Math.sin(ang) * 30, 90, dt);
        if (a.cd <= 0 && d < (a.ranged ? 240 : want + 14)) { a.cd = CFG.allyCd; try { a.anim && a.anim.play(a.ranged ? 'Shoot' : 'Attack'); } catch (_) {}
          if (a.ranged) shots.push({ a, x: a.x, y: a.y - 16, tg, sp: 380, t: 0 }); else hitEnemy(a, tg, 1.3); } }
      else { const off = a.slot % 2 ? 1 : -1, fx2 = p.x + off * 52, fy = p.y + 34; if (dist(a, { x: fx2, y: fy }) > 26) stepTo(a, fx2, fy, dist(a, p) > 220 ? 150 : 95, dt); else a.dir = Math.atan2(p.y - a.y, p.x - a.x); }
      for (const e of foes) if (!harmless(e) && dist(e, a) < a.r + (e.r || 12)) { let d = 8; try { d = typeof e.dmg === 'function' ? e.dmg() : (e._dmg || 8); } catch (_) {} allyHurt(a, Number(d) || 8); }
      try { const P = E().Projectiles.all(); for (let j = P.length - 1; j >= 0; j--) { const q = P[j]; if (!q || q.friendly || q.ghost || Math.hypot(q.x - a.x, q.y - (a.y - 10)) > a.r + (q.r || 4)) continue; allyHurt(a, q.dmg || 6); P.splice(j, 1); } } catch (_) {}
      if ((a.idleT -= dt) <= 0) { a.idleT = rnd(55, 90); if (!tg) sayL(a, 'ally', LN.allyIdle); }
      if (a.anim) { try { if (!a.anim.once || a.anim.done) a.anim.loop(a.moved ? 'Walk' : 'Idle'); if (Number.isFinite(a.dir)) a.anim.dir = E().Sprites.dirFromAngle(a.dir); a.anim.update(dt); } catch (_) {} } }
    for (let i = shots.length - 1; i >= 0; i--) { const s = shots[i]; s.t += dt; const tg = s.tg; if (!tg || tg.dead || s.t > 1.5) { shots.splice(i, 1); continue; }
      const d = Math.hypot(tg.x - s.x, tg.y - 12 - s.y), st = s.sp * dt; if (d <= st) { hitEnemy(s.a, tg, 1); shots.splice(i, 1); continue; } s.x += (tg.x - s.x) / d * st; s.y += (tg.y - 12 - s.y) / d * st; }
  }

  // ================= update & engine hooks =================
  let runP = null;
  function reset() { allies.length = 0; shots.length = 0; feuds.length = 0; fx.length = 0; bubbles.length = 0; live.clear(); scene = null; sceneT = rnd(...CFG.sceneFirst); lvl0 = 0; }
  function update(dt) {
    const N = E(), p = N?.Game?.player; if (!p) return;
    if (p !== runP) { runP = p; reset(); }
    if (N.Game.state !== 'playing' || p.dead || eventKind()) return;
    const foes = N.EnemyMgr.all().filter(e => e && !e.dead), now = clock();
    for (const e of foes) if (!seen.has(e)) meet(e, p);
    for (const e of foes) {
      if (harmless(e)) { runAct(e, dt, p, foes); hops(e, dt); if (e.__role === 'idle' && dist(e, p) > CFG.despawn && !(e.__act && e.__act.kind === 'follow')) removeEnemy(e); continue; }
      if (e.__wantFeud && !e.__feud && !e.dead) { if (now > e.__wantFeud) e.__wantFeud = 0; else if (dist(e, p) < 520) { const b = foes.find(o => o !== e && !o.dead && !o.__feud && !special(o) && !harmless(o) && !o.__turning && dist(o, e) < 260); if (b) startFeud(e, b); } }
      if (e.__turnAt && now > e.__turnAt && !e.__turning && dist(e, p) < 320 && allies.length < CFG.maxAllies) startTurn(e, false);
    }
    updateFeuds(dt, foes); updateTurns(dt); chatter(dt, p, foes); reactions(p, foes);
    updateScene(dt, p); updateAllies(dt, p, foes.filter(e => !e.gone));
  }
  let hooked = false;
  function hook() {
    const N = E(); if (hooked || !N || !N.EnemyMgr || !N.Enemy || !N.Training || !N.Ult) return; hooked = true;
    const emu = N.EnemyMgr.update;
    N.EnemyMgr.update = function () { try { update(Math.min(0.1, Number(arguments[0]) || 0.016)); } catch (err) { console.warn('[wild]', err); } return emu.apply(this, arguments); };
    const eup = N.Enemy.prototype.update;
    const still = e => ({ x: e.x, y: e.y, r: 1, dead: false, hp: 1, maxHp: 1, hurt() {} });
    N.Enemy.prototype.update = function (dt) {
      if (!this.dead) {
        if (this.__role) {   // harmless: it goes where its activity takes it, at an easy pace, and never attacks
          this.touchCd = Math.max(Number(this.touchCd) || 0, 0.3); this.shotCd = Math.max(Number(this.shotCd) || 0, 1); this.skillCd = Math.max(Number(this.skillCd) || 0, 1);
          const g = this.__goal; arguments[1] = g ? { x: g.x, y: g.y, r: 1, dead: false, hp: 1, maxHp: 1, hurt() {} } : still(this);
          const sp = this.spd; this.spd = (this.__spd0 || sp) * (g ? (this.__spdMul || CFG.idleSpd) : 0.0001);
          try { return eup.apply(this, arguments); } finally { if (this.__role || this.spd < sp) this.spd = sp; } }
        if (this.__turning) { this.touchCd = Math.max(Number(this.touchCd) || 0, 0.3); arguments[1] = still(this); return eup.apply(this, arguments); }   // standing still, thinking
        const f = this.__feud; if (f && !f.dead) { this.touchCd = Math.max(Number(this.touchCd) || 0, 0.3);
          const fd = feuds.find(q => q.a === this || q.b === this); if (fd && fd.b === this && !fd.bFights) { const a = Math.atan2(this.y - f.y, this.x - f.x); arguments[1] = { x: this.x + Math.cos(a) * 200, y: this.y + Math.sin(a) * 200, r: 1, dead: false, hp: 1, maxHp: 1, hurt() {} }; }
          else arguments[1] = f; return eup.apply(this, arguments); }
        const p = N.Game.player; if (allies.length && p && !this.boss) { let best = null, bd = p.dead ? Infinity : dist(this, p) - 40; for (const a of allies) if (!a.dead && dist(this, a) < bd) { bd = dist(this, a); best = a; } if (best) arguments[1] = best.proxy; }
      }
      return eup.apply(this, arguments); };
    const ed = N.Enemy.prototype.draw;   // climbing / hopping Pokemon leave the ground
    if (typeof ed === 'function') N.Enemy.prototype.draw = function (ctx) { const l = this.__lift; if (!(l > 0) || !ctx || typeof ctx.translate !== 'function') return ed.apply(this, arguments); ctx.save(); ctx.translate(0, -l); try { return ed.apply(this, arguments); } finally { ctx.restore(); } };
    const td = N.Training.drawables;
    N.Training.drawables = function () { let r = td.apply(this, arguments); if (!Array.isArray(r)) r = []; try { for (const a of allies) r.push({ y: a.y, draw: g => drawAlly(g, a) }); } catch (_) {} return r; };
    const du = N.Ult.drawUnits;
    N.Ult.drawUnits = function (ctx) { du.apply(this, arguments); try { drawTop(ctx); } catch (err) { console.warn('[wild]', err); } };
  }
  // ================= drawing =================
  function heart(ctx, x, y, s, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y + s * 0.35); ctx.bezierCurveTo(x - s * 1.1, y - s * 0.35, x - s * 0.45, y - s * 1.05, x, y - s * 0.4); ctx.bezierCurveTo(x + s * 0.45, y - s * 1.05, x + s * 1.1, y - s * 0.35, x, y + s * 0.35); ctx.fill(); }
  function drawAlly(ctx, w) {
    const al = w.dead ? Math.max(0, 1 - (w.leaveT || 0) / 2.5) : 1; ctx.save(); ctx.globalAlpha = al;
    ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(w.x, w.y + 1, w.r * 1.1, w.r * 0.42, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#5ab0ff'; ctx.lineWidth = 2; ctx.globalAlpha = al * 0.85; ctx.beginPath(); ctx.ellipse(w.x, w.y, w.r + 5, (w.r + 5) * 0.4, 0, 0, TAU); ctx.stroke(); ctx.globalAlpha = al;
    if (w.anim) { if (w.flash > 0) ctx.filter = 'brightness(2.2)'; try { w.anim.draw(ctx, w.x, w.y); } catch (_) {} ctx.filter = 'none'; }
    ctx.restore();
  }
  function overlay(ctx, f, w, now) {   // things attached to a Pokemon: a berry, a flower, a coin, dizzy stars, face scribbles
    const H = w.bodyH || 40, hx = w.x, hy = w.y - H * 0.55;
    if (f.kind === 'scribble') { ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(hx - 8, hy - 2); ctx.lineTo(hx - 3, hy + 2); ctx.lineTo(hx + 2, hy - 3); ctx.lineTo(hx + 8, hy + 1); ctx.moveTo(hx - 5, hy + 6); ctx.quadraticCurveTo(hx, hy + 2, hx + 5, hy + 6); ctx.stroke(); }
    else if (f.kind === 'berry') { ctx.fillStyle = '#3a8aff'; ctx.beginPath(); ctx.arc(w.x + (w.r || 12) + 6, w.y - 4, 5, 0, TAU); ctx.fill(); ctx.fillStyle = '#2a6a2a'; ctx.fillRect(w.x + (w.r || 12) + 5, w.y - 11, 2, 4); }
    else if (f.kind === 'flower') { const x = w.x + (w.r || 12) + 8, y = w.y - 2; ctx.fillStyle = '#3a8a3a'; ctx.fillRect(x - 0.5, y - 2, 1.5, 8); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + now; ctx.fillStyle = '#ff8ad0'; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 3, y - 4 + Math.sin(a) * 3, 2.2, 0, TAU); ctx.fill(); } ctx.fillStyle = '#ffe04a'; ctx.beginPath(); ctx.arc(x, y - 4, 1.8, 0, TAU); ctx.fill(); }
    else if (f.kind === 'coin') { ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = '#a07800'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(w.x + 10, w.y - H * 0.4, 5, 0, TAU); ctx.fill(); ctx.stroke(); }
    else if (f.kind === 'stars') { for (let i = 0; i < 3; i++) { const a = now * 5 + i * TAU / 3, x = w.x + Math.cos(a) * 12, y = w.y - H - 2 + Math.sin(a) * 4; ctx.fillStyle = '#ffe04a'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('★', x, y); } }
  }
  function drawBubble(ctx, b) {
    const w = b.obj, u = b.t / b.life, a = u > 0.85 ? (1 - u) / 0.15 : Math.min(1, b.t * 8); if (a <= 0) return;
    const y = w.y - (w.bodyH || 40) - 30 - (w.__lift || 0); ctx.save(); ctx.globalAlpha = a; ctx.font = 'bold 9px sans-serif'; const tw = ctx.measureText(b.text).width + 10, x = w.x - tw / 2;
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#1a1030'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 4, y - 9); ctx.arcTo(x + tw, y - 9, x + tw, y + 5, 4); ctx.arcTo(x + tw, y + 5, x, y + 5, 4); ctx.lineTo(w.x + 3, y + 5); ctx.lineTo(w.x, y + 10); ctx.lineTo(w.x - 2, y + 5); ctx.arcTo(x, y + 5, x, y - 9, 4); ctx.arcTo(x, y - 9, x + tw, y - 9, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1a1030'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(b.text, w.x, y - 2); ctx.restore();
  }
  let lastDraw = performance.now();
  function drawTop(ctx) {
    const N = E(), p = N.Game.player, nowMs = performance.now(), now = nowMs / 1000, dt = Math.min(0.1, (nowMs - lastDraw) / 1000); lastDraw = nowMs;
    for (const f of fx) { f.t += dt; if (f.t > 0 && f.vx != null) { f.x += f.vx * dt; f.y += f.vy * dt; if (f.g) f.vy += f.g * dt; } } for (let i = fx.length - 1; i >= 0; i--) if (fx[i].t > fx[i].life || (fx[i].obj && (fx[i].obj.dead || fx[i].obj.gone))) fx.splice(i, 1);
    for (const b of bubbles) b.t += dt; for (let i = bubbles.length - 1; i >= 0; i--) if (bubbles[i].t > bubbles[i].life || bubbles[i].obj.dead || bubbles[i].obj.gone) bubbles.splice(i, 1);
    for (const a of allies) { if (a.dead) continue; const y = a.y - (a.bodyH || 40) - 10; ctx.save(); ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = '#1a1030'; ctx.fillStyle = '#9ad8ff';
      const t = 'Ally · ' + label(a); ctx.strokeText(t, a.x, y); ctx.fillText(t, a.x, y); ctx.fillStyle = '#25152f'; ctx.fillRect(a.x - 18, y + 3, 36, 4); ctx.fillStyle = '#5ab0ff'; ctx.fillRect(a.x - 18, y + 3, 36 * Math.max(0, a.hp / a.maxHp), 4); ctx.restore(); }
    if (p) for (const e of N.EnemyMgr.all()) { if (!e || e.dead || !harmless(e) || dist(e, p) > 280) continue; const y = e.y - (e.bodyH || 40) - 12 - (e.__lift || 0); ctx.save(); ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = '#102010'; ctx.fillStyle = '#c8ffaa';
      const t = '♪ ' + label(e); ctx.strokeText(t, e.x, y); ctx.fillText(t, e.x, y); ctx.restore(); }
    for (const e of feuds) for (const w of [e.a, e.b]) { if (w.dead) continue; const y = w.y - (w.bodyH || 40) - 8; ctx.save(); ctx.globalAlpha = 0.6 + 0.4 * Math.sin(now * 10); ctx.fillStyle = '#ff4a3a'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('💢', w.x + 10, y); ctx.restore(); }
    for (const e of live) if (e.__turning && !e.dead) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const gr = ctx.createRadialGradient(e.x, e.y - 14, 2, e.x, e.y - 14, 34); gr.addColorStop(0, 'rgba(255,180,220,.5)'); gr.addColorStop(1, 'rgba(255,120,200,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(e.x, e.y - 14, 34, 0, TAU); ctx.fill(); ctx.restore(); }
    for (const s of shots) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = TYPE_COL[s.a.type] || '#fff'; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(s.x, s.y, 4.5, 0, TAU); ctx.fill(); ctx.restore(); }
    for (const f of fx) { if (f.t < 0) continue; if (f.obj) { ctx.save(); overlay(ctx, f, f.obj, now); ctx.restore(); continue; } const u = f.t / f.life, a = Math.max(0, 1 - u); ctx.save(); ctx.globalAlpha = a;
      if (f.kind === 'heart') heart(ctx, f.x, f.y, 5, '#ff5a8a');
      else if (f.kind === 'note') { ctx.fillStyle = '#7a4cff'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(Math.floor(f.x) % 2 ? '♪' : '♫', f.x, f.y); }
      else if (f.kind === 'z') { ctx.fillStyle = '#d8e8ff'; ctx.strokeStyle = '#1a2040'; ctx.lineWidth = 2; ctx.font = 'bold ' + Math.round(8 + u * 6) + 'px sans-serif'; ctx.strokeText('z', f.x, f.y); ctx.fillText('z', f.x, f.y); }
      else if (f.kind === 'tear' || f.kind === 'drop') { ctx.fillStyle = f.kind === 'tear' ? '#8fd0ff' : '#5aaaff'; ctx.beginPath(); ctx.arc(f.x, f.y, f.kind === 'tear' ? 2.2 : 2.8, 0, TAU); ctx.fill(); }
      else if (f.kind === 'dust') { ctx.fillStyle = 'rgba(' + (f.c || '160,120,80') + ',.8)'; ctx.beginPath(); ctx.arc(f.x, f.y, 2.5 + u * 2, 0, TAU); ctx.fill(); }
      else if (f.kind === 'ring') { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(f.x, f.y, 8 + u * 20, (8 + u * 20) * 0.4, 0, 0, TAU); ctx.stroke(); }
      else if (f.kind === 'gem') { ctx.globalAlpha = Math.min(1, f.t * 3) * a; const y = f.y - Math.min(1, f.t * 2) * 10; ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(f.x, y, 4.5, 0, TAU); ctx.stroke(); ctx.fillStyle = '#9af0ff'; ctx.beginPath(); ctx.moveTo(f.x, y - 9); ctx.lineTo(f.x + 3, y - 5); ctx.lineTo(f.x, y - 3); ctx.lineTo(f.x - 3, y - 5); ctx.closePath(); ctx.fill();
        ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 4; i++) { const ang = now * 3 + i * TAU / 4; ctx.fillStyle = '#fff6b0'; ctx.fillRect(f.x + Math.cos(ang) * 10 - 1, y - 5 + Math.sin(ang) * 10 - 1, 2, 2); } }
      ctx.restore(); }
    for (const b of bubbles) drawBubble(ctx, b);
  }
  let last = performance.now();
  (function loop(now) { requestAnimationFrame(loop); const dt = Math.min(0.1, (now - last) / 1000); last = now; try { hook(); panicTick(dt); } catch (e) { console.warn('[wild]', e); } })(performance.now());
  window.PS_WILD = { cfg: CFG, scenes: Object.keys(SCENES), scene: n => startScene(n || pick(Object.keys(SCENES)), E().Game.player), get allies() { return allies.map(a => ({ name: a.name, hp: Math.round(a.hp), dead: a.dead })); },
    get feuds() { return feuds.length; }, get running() { return scene && { name: scene.name, step: scene.i }; }, get harmless() { return E().EnemyMgr.all().filter(e => e && !e.dead && e.__role).map(e => e.name + ':' + (e.__fleeT > 0 ? 'flee' : e.__act ? e.__act.kind : e.__role)); },
    get panic() { return panicKind; },
    turn: e => startTurn(e || E().EnemyMgr.all().find(x => x && !x.dead && !special(x) && !harmless(x)), false), feud: (a, b) => { const L = E().EnemyMgr.all().filter(x => x && !x.dead && !special(x) && !harmless(x)); startFeud(a || L[0], b || L[1]); },
    idle: (e, kind) => { const x = e || E().EnemyMgr.all().find(q => q && !q.dead && !special(q) && !harmless(q)); if (x) setRole(x, 'idle', kind ? Object.assign({ kind, t: 0, dur: 14, ph: 0 }, kind === 'swim' ? (() => { const w = findKind(x, 'liquid', 600); return w ? { water: w, shore: shoreOf(x, w) } : {}; })() : kind === 'climb' ? (() => { const w = findKind(x, 'wall', 600); return w ? { tree: w, foot: shoreOf(x, w) } : {}; })() : {}) : null); return x; } };
})();
