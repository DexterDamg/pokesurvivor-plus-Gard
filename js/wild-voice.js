/* WILD VOICE — every Pokemon talks in its own voice, generated on the fly (used by js/wild-life.js).
   Each wild Pokemon gets a Nature (the 25 from the games), and the Nature picks its VOICE:
     Brave / Adamant → brave        Hasty / Rash → hothead         Timid / Careful → timid
     Lonely / Bashful → shy         Jolly / Naive → cheerful       Relaxed / Lax / Quiet → lazy
     Bold / Sassy → sassy           Modest / Calm → polite         Naughty / Impish → prankster
     Hardy / Serious → stoic        Docile / Gentle / Mild → gentle    Quirky → quirky
   A line is built from: what is happening (the situation) + who is talking (voice, type, species cry, gender) +
   who they're talking to (same species, a possible sweetheart, a type they beat or fear, the same type, the
   explorer you play as and your companions) + what happened this run (Giratina's Void, the Creation Rift,
   Kamina...). The voice then shapes the sentence: openers ("U-um...", "Oi!", "*yawn*..."), stutters, shouting,
   trailing off, sign-offs, the occasional cry ("Ratta!"). Same Pokemon, same voice for its whole life.
   PS_VOICE.line(pokemon, situation, context) → [face, text, emote]; PS_VOICE.chat(a, b) → a whole conversation. */
(() => {
  'use strict';
  if (window.PS_VOICE) return;
  const E = () => window.PS_HOOPA_ENGINE;
  const pick = L => L[Math.floor(Math.random() * L.length)];
  const chance = p => Math.random() < p;

  // ================= natures → voices =================
  const NATURES = { Hardy: 'stoic', Serious: 'stoic', Lonely: 'shy', Bashful: 'shy', Brave: 'brave', Adamant: 'brave', Naughty: 'prankster', Impish: 'prankster', Bold: 'sassy', Sassy: 'sassy',
    Docile: 'gentle', Gentle: 'gentle', Mild: 'gentle', Relaxed: 'lazy', Lax: 'lazy', Quiet: 'lazy', Timid: 'timid', Careful: 'timid', Hasty: 'hothead', Rash: 'hothead', Jolly: 'cheerful', Naive: 'cheerful',
    Modest: 'polite', Calm: 'polite', Quirky: 'quirky' };
  const VOICE = {
    brave:     { face: 'determined', em: 'exclaim', open: ['Hah!', 'Listen up!', 'Alright!', ''], close: ['!', '! Bring it on!', '!'], cry: 0.2 },
    hothead:   { face: 'angry', em: 'anger', open: ['HEY!', 'Argh!', 'Grr—', 'Oi!'], close: ['!!', '!! Got it?!', '!'], caps: true },
    timid:     { face: 'worried', em: 'sweat', open: ['Eep!', 'Oh no...', 'Um, um...', 'W-wait...'], close: ['...', '... r-right?', '...'], stutter: 0.55 },
    shy:       { face: 'worried', em: 'dots', open: ['U-um...', 'Er...', 'S-sorry, but...', ''], close: ['...', '...', '... sorry.'], stutter: 0.4 },
    cheerful:  { face: 'happy', em: 'note', open: ['Hey hey!', 'Ooh!', 'Yay!', 'Hiya!'], close: ['~!', '!', '! Hehe~'], cry: 0.35 },
    lazy:      { face: 'sigh', em: 'dots', open: ['*yawn*...', 'Mmh...', 'Eh...', ''], close: ['...', '... zzz...', '... whatever.'], slow: true },
    sassy:     { face: 'normal', em: 'dots', open: ['Hmph.', 'Ugh.', 'Oh please.', 'Well, well.'], close: ['.', ', obviously.', ', darling.', '. Try to keep up.'] },
    polite:    { face: 'normal', em: 'note', open: ['Pardon me,', 'Ah,', 'Greetings.', 'If I may,'], close: ['.', ', I believe.', '. Good day.'] },
    prankster: { face: 'joyous', em: 'note', open: ['Heh heh~', 'Psst!', 'Nyeh!', 'Ooh, ooh!'], close: ['! Hehehe!', '~', '! Gotcha!'], cry: 0.2 },
    stoic:     { face: 'normal', em: 'dots', open: ['...', 'Hm.', ''], close: ['.', '.', '. That is all.'] },
    gentle:    { face: 'happy', em: 'heart', open: ['Oh my,', 'Hello there,', 'Ah,'], close: ['.', ' ♪', '. Take care.'], cry: 0.15 },
    quirky:    { face: 'surprised', em: 'question', open: ['Did you know—', 'Bloop!', 'Hmm hmm!', 'Fun fact:'], close: ['! Bloop.', '?!', '... or was it?'], cry: 0.25 } };
  const GRAVE = new Set(['hurt', 'die', 'witness', 'witnessSame', 'witnessMate', 'beg', 'allyFaint', 'lowHp', 'avenge']);
  const BOLD = new Set(['brave', 'hothead', 'sassy', 'prankster']), SOFT = new Set(['timid', 'shy', 'gentle', 'lazy']);

  // ================= types: where they live, what they love, fear and brag about =================
  const TYPE = {
    normal: { home: 'the tall grass', like: 'a long nap in the sun', fear: 'Fighting-types', snack: 'a Leppa Berry', boast: 'my good looks' },
    fire: { home: 'the volcano', like: 'sunbathing on hot rocks', fear: 'the rain', snack: 'a spicy Tamato Berry', boast: 'my flames' },
    water: { home: 'the river', like: 'a long swim', fear: 'droughts', snack: 'an Oran Berry', boast: 'my tidal wave' },
    grass: { home: 'the sunny meadow', like: 'soaking up sunlight', fear: 'Bug-types nibbling on me', snack: 'fresh morning dew', boast: 'my leaves' },
    electric: { home: 'the old power plant', like: 'thunderstorms', fear: 'Ground-types', snack: 'a fizzy Wacan Berry', boast: 'my voltage' },
    ice: { home: 'the frozen cave', like: 'fresh snowfall', fear: 'summer', snack: 'shaved ice', boast: 'my frost' },
    fighting: { home: 'the mountain dojo', like: 'training till dawn', fear: 'Psychic-types', snack: 'a protein-packed Aspear Berry', boast: 'my fists' },
    poison: { home: 'the swamp', like: 'bubbling sludge', fear: 'Psychic-types', snack: 'a sour Pecha Berry', boast: 'my toxins' },
    ground: { home: 'the deep tunnels', like: 'digging holes', fear: 'water', snack: 'crunchy roots', boast: 'my digging' },
    flying: { home: 'the treetops', like: 'riding the wind', fear: 'Electric-types', snack: 'a juicy Pinap Berry', boast: 'my wings' },
    psychic: { home: 'the quiet ruins', like: 'meditating', fear: 'Dark-types', snack: 'a Mago Berry', boast: 'my mind' },
    bug: { home: 'under the big leaves', like: 'crawling around', fear: 'Flying-types', snack: 'tender leaves', boast: 'my shell' },
    rock: { home: 'the rocky cliffs', like: 'standing very, very still', fear: 'water', snack: 'tasty pebbles', boast: 'my sturdiness' },
    ghost: { home: 'the old tower', like: 'spooking travelers', fear: 'Dark-types', snack: 'souls— kidding! Berries', boast: 'my curses' },
    dragon: { home: 'the mountain peak', like: 'hoarding shiny things', fear: 'Fairy-types', snack: 'a whole Sitrus Berry', boast: 'my ancient blood' },
    dark: { home: 'the shadows', like: 'sneaking around', fear: 'Fairy-types', snack: 'stolen berries', boast: 'my cunning' },
    steel: { home: 'the old mine', like: 'polishing myself', fear: 'Fire-types', snack: 'iron filings', boast: 'my armor' },
    fairy: { home: 'the moonlit glade', like: 'sweets and sparkles', fear: 'Poison-types', snack: 'a sweet Poffin', boast: 'my sparkles' } };
  const SE = { fire: ['grass', 'ice', 'bug', 'steel'], water: ['fire', 'ground', 'rock'], grass: ['water', 'ground', 'rock'], electric: ['water', 'flying'], ice: ['grass', 'ground', 'flying', 'dragon'],
    fighting: ['normal', 'ice', 'rock', 'dark', 'steel'], poison: ['grass', 'fairy'], ground: ['fire', 'electric', 'poison', 'rock', 'steel'], flying: ['grass', 'fighting', 'bug'], psychic: ['fighting', 'poison'],
    bug: ['grass', 'psychic', 'dark'], rock: ['fire', 'ice', 'flying', 'bug'], ghost: ['psychic', 'ghost'], dragon: ['dragon'], dark: ['psychic', 'ghost'], steel: ['ice', 'rock', 'fairy'], fairy: ['fighting', 'dragon', 'dark'] };
  const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;

  // ================= who is this Pokemon =================
  const NAT = Object.keys(NATURES);
  function who(w) {
    if (!w) return null; if (w.__voice) return w.__voice;
    const dex = Number(w.dex), d = (E()?.DEX_BY || {})[dex] || {}, types = (d.types || ['normal']).map(t => String(t).toLowerCase()).filter(t => TYPE[t]);
    const nature = w.__nature || pick(NAT), name = w.name || d.name || ('#' + dex), clean = name.replace(/[^A-Za-z]/g, '');
    const cry = clean.length > 5 ? clean.slice(0, Math.min(5, Math.ceil(clean.length * 0.6))) : clean;   // "Rattata" → "Ratta"
    return (w.__voice = { nature, voice: NATURES[nature], type: types[0] || 'normal', types: types.length ? types : ['normal'], name, cry: cry || name, g: w.__g || w.g || null, bst: d.bst || 300 });
  }
  function relation(a, b) {
    const A = who(a), Bv = who(b); if (!A || !Bv) return 'none';
    if (Number(a.dex) === Number(b.dex)) return A.g && Bv.g && A.g !== Bv.g ? 'mate' : 'twin';
    if (A.types.some(t => (SE[t] || []).some(x => Bv.types.includes(x)))) return 'adv';
    if (Bv.types.some(t => (SE[t] || []).some(x => A.types.includes(x)))) return 'dis';
    if (A.types.some(t => Bv.types.includes(t))) return 'kin';
    return 'none';
  }
  // what happened this run (for gossip)
  const RUN = { giratina: false, rift: false, kamina: false, simon: false, kills: 0 };
  function rumor() { const P = E()?.Game?.player, L = [];
    if (RUN.giratina) L.push('a Giratina tore open the dark itself', 'the shadows swallowed everyone near that explorer');
    if (RUN.rift) L.push('Dialga and Palkia showed up and BICKERED', 'the sky cracked open like an egg');
    if (RUN.kamina) L.push('some Excadrill pierced a boss with a drill bigger than a tree');
    if (RUN.simon) L.push('a little Drilbur with a red cape is carrying on his brother\'s fight');
    if (P && [480, 481, 482].includes(Number(P.dex))) L.push('the Lake Guardians are wandering around together', 'one of the Lake Guardians left the lake');
    if (RUN.kills > 40) L.push('that explorer has knocked out ' + RUN.kills + ' of us already');
    L.push('there\'s a Golden Pokemon hiding nearby', 'a legendary was spotted past the trees', 'the bosses around here get grumpier every minute', 'someone found a whole chest of Rare Candy');
    return pick(L); }

  // ================= the explorer you play as =================
  function explorer() { const p = E()?.Game?.player; if (!p) return { name: 'that explorer', type: 'normal', dex: 0 }; const d = (E().DEX_BY || {})[Number(p.dex)] || {};
    const name = (p.mon && p.mon.name) || d.name || 'explorer'; return { name, type: String((d.types || ['normal'])[0]).toLowerCase(), dex: Number(p.dex), p }; }
  function aboutPlayer(me) {   // a remark about who the explorer is
    const X = explorer(), V = who(me), L = [];
    if (X.dex === 530) L.push('Is that an Excadrill wearing SHADES?', 'Cool shades, mister!', 'Someone said you\'re part of some "Gurren Brigade"?');
    if (X.dex === 529) L.push('A little Drilbur... with a red cape?', 'You look like you\'ve been through a lot, little digger.');
    if ([480, 481, 482].includes(X.dex)) L.push('A L-Lake Guardian?! Here?!', 'Wait... you\'re one of the legends from the lake!');
    if (V && (SE[X.type] || []).some(t => V.types.includes(t))) L.push('A ' + cap(X.type) + '-type... that\'s really bad news for me.', 'Please don\'t use ' + cap(X.type) + ' moves on me!');
    if (V && (SE[V.type] || []).includes(X.type)) L.push('Heh, a ' + cap(X.type) + '-type. My ' + cap(V.type) + ' moves would wreck you.');
    L.push('You\'re that ' + X.name + ' everyone\'s whispering about!', 'An explorer! A real one!', 'You\'re not from around here, are you?');
    return pick(L); }

  // ================= what they say: situation → cores (per voice where it matters most) =================
  // {me} {other} {player} {home} {like} {fear} {snack} {boast} {type} {otype} {ptype} {rumor} {about} {cry}
  const S = {
    greet: { brave: ['Yo, {other}! Ready for a sparring match?', '{other}! Stay sharp out here.'], hothead: ['What are YOU looking at, {other}?', '{other}! Outta my way!'], timid: ['H-hi, {other}... you\'re not going to bite, are you?', 'Oh! {other}... you scared me.'],
      shy: ['H-hello, {other}...', '...Hi.'], cheerful: ['{other}! Wanna be friends?!', 'Hiii {other}! What a great day!'], lazy: ['Oh... it\'s you, {other}.', 'Hey {other}... wake me up later.'], sassy: ['Oh. It\'s {other}.', '{other}, your fur is a mess.'],
      polite: ['Good day to you, {other}.', 'A pleasure, {other}.'], prankster: ['Boo! Hehe, gotcha, {other}!', '{other}! Wanna help me prank someone?'], stoic: ['{other}.', '...{other}. Hm.'], gentle: ['Hello, {other}. Are you well?', 'Oh, {other}! Lovely to see you.'], quirky: ['{other}! Did you know clouds are just sky-water?', 'Hello {other}, I\'ve been counting blades of grass.'] },
    greetBack: { brave: ['Always ready!', 'Heh, you know it!'], hothead: ['YOUR way, you mean!', 'Watch it, pal!'], timid: ['Eek! H-hi...', 'I-I won\'t bite... promise.'], shy: ['...H-hello.', '*waves quietly*'], cheerful: ['Friends! YES!', 'Best day ever!'], lazy: ['...mhm.', 'Sure... later.'],
      sassy: ['Excuse you.', 'At least I HAVE fur.'], polite: ['Likewise, I\'m sure.', 'The pleasure is mine.'], prankster: ['Not if I prank you first!', 'Count me in!'], stoic: ['Hm.', '...Yes.'], gentle: ['I\'m well, thank you.', 'Lovely to see you too.'], quirky: ['They are?! My whole life is a lie!', 'How many so far?'] },
    meetPlayer: { all: ['{about}'], brave: ['{about} Don\'t think I\'ll go easy if you start something.'], timid: ['{about} P-please don\'t hurt me!'], cheerful: ['{about} Can I get your autograph?!'], lazy: ['{about} ...anyway, I\'m napping.'], sassy: ['{about} Not impressed, though.'], polite: ['{about} Welcome to {home}.'], gentle: ['{about} Be careful out there, okay?'] },
    hurt: { brave: ['Hey! Fight fair, I wasn\'t even ready!', 'Ow! That\'s a cheap shot!'], hothead: ['YOU HIT ME?! For WHAT?!', 'OW! You\'re gonna regret that!'], timid: ['Ow ow ow! Why?! I wasn\'t doing anything!', 'P-please stop! I\'m not one of them!'], shy: ['Ow... w-why...?', 'I... I didn\'t do anything...'],
      cheerful: ['Ow! I thought we were friends!', 'Ouch! That\'s not how you play!'], lazy: ['Ow... I was SLEEPING...', 'Ugh... rude.'], sassy: ['Excuse me?! Do you know who I AM?', 'Ugh! You scuffed me!'], polite: ['That was entirely uncalled for!', 'I beg your pardon?!'],
      prankster: ['Hey, no fair! I\'M the one who does the surprises!', 'Ow! Okay, okay, I deserved one... but not THAT!'], stoic: ['...Why.', 'That was unnecessary.'], gentle: ['Ah! Why would you hurt me?', 'Please... I mean you no harm.'], quirky: ['Ow! Was that a hug?! It hurt like a hit!', 'Ouch! Fun fact: that hurt!'] },
    provoked: { all: ['That\'s IT! You asked for it!', 'Fine! You want a fight?! You GOT one!', 'I was minding my own business... NOT ANYMORE!'], timid: ['I-I\'m scared... but I\'m ANGRIER!'], lazy: ['...Okay. Now I\'m awake. And mad.'], polite: ['Very well. You leave me no choice.'], gentle: ['I didn\'t want this... but I\'ll protect myself.'] },
    die: { all: ['W-why...?', 'I just wanted to... live here...'], timid: ['Mom...? I\'m scared...'], cheerful: ['I thought... we could\'ve been... friends...'], lazy: ['Guess... I\'ll take... a really long nap...'], sassy: ['Ugh... not... my face...'], polite: ['Tell my family... I was brave...'], gentle: ['It was... such a nice day...'], brave: ['At least... I didn\'t run...'], prankster: ['Heh... last prank... I didn\'t see coming...'], stoic: ['...So this is it.'], shy: ['...nobody will even... notice...'], hothead: ['This... isn\'t... over...'], quirky: ['Fun fact... this... hurts...'] },
    witness: { all: ['NO! Leave them alone!', 'You MONSTER!', 'Why would you DO that?!', 'They never hurt anybody!'], timid: ['Y-you... you\'re a monster! Stay away!'], brave: ['You\'ll answer for that!'], lazy: ['...Hey. That wasn\'t cool. At all.'], polite: ['That... was cruel beyond words.'], gentle: ['No... no, no... they were so kind...'], sassy: ['Oh, real classy, hero.'] },
    witnessSame: { all: ['My friend...! NOOO!', 'Wake up! Please, WAKE UP!', 'You\'ll pay for that! They were my FAMILY!'], timid: ['B-big sibling...?! No...!'], hothead: ['MY BROTHER! YOU\'RE DONE!'], gentle: ['My little one... no...'] },
    witnessMate: { all: ['NO! We were going to be together FOREVER!', 'My love...! Please... open your eyes...'] },
    spotPlayer: { brave: ['An intruder! Face me!', 'You picked the wrong path, {player}!'], hothead: ['THERE you are! GET \'EM!', 'Outsider! I\'ll flatten you!'], timid: ['A-an explorer...! W-we have to attack, right?', 'I-I\'m supposed to fight you... sorry!'],
      shy: ['I... I have to fight you... sorry...'], cheerful: ['Ooh, a challenger! Let\'s battle!', 'Battle time! Yay!'], lazy: ['Ugh... do I HAVE to fight you?', 'Fine... let\'s get this over with.'], sassy: ['You? Here? How adorable.', 'Hah! You look weak.'],
      polite: ['I\'m afraid this is our territory. Please leave.', 'Forgive me, but I must defend my home.'], prankster: ['Fresh target! Hehehe!', 'Tag, you\'re IT! And by tag I mean ATTACK!'], stoic: ['Leave. Or fall.', '...Intruder.'], gentle: ['I\'m sorry, but you can\'t stay here.'], quirky: ['Battle! Like the ancient Unown foretold!', 'You smell like adventure. And victory. MY victory.'] },
    lowHp: { brave: ['I\'m... not done yet!', 'Is that all you\'ve got?!'], hothead: ['ARGH! Retreat! ...For now!', 'I\'ll remember your face!'], timid: ['I-I give up! Please!', 'Too strong! Too strong!'], shy: ['I... I can\'t...'], cheerful: ['Ow ow ow! Good battle, I quit!'], lazy: ['...I\'m too tired for this.'],
      sassy: ['Ugh! You\'ll pay for this!', 'This never happened!'], polite: ['I concede... this round.'], prankster: ['Okay okay, you win this one!', 'Running away is a valid strategy!'], stoic: ['...Retreating.'], gentle: ['Please... no more...'], quirky: ['Statistically I should flee now!', 'Plan B! Run!'] },
    avenge: { all: ['N-no! You\'ll pay for that!', 'Buddy!! ...You MONSTER!'], stoic: ['...You will regret that.'], timid: ['Th-they were my friend...!'] },
    playerLow: { brave: ['You\'re almost finished, {player}!'], hothead: ['You\'re DONE! Finish \'em!'], sassy: ['Look at you. Barely standing.'], prankster: ['Ooh, wobbly! Hehehe!'], stoic: ['Your end is near.'], all: ['They\'re almost down! Keep going!'] },
    boss: { all: ['So YOU\'RE the one making all this noise...', 'This is MY domain. Leave... or be buried here.', 'Finally. A challenger worth my time.'], lazy: ['You woke me up. Big mistake.'], polite: ['Welcome, explorer. It will be your last visit.'], prankster: ['Surprise! I\'m the boss! Hehehe!'] },
    thief: { all: ['Shiny things are MINE!', 'Ooh, what\'s in your bag? Gimme!'] },
    traitor: { all: ['TRAITOR!', 'Hey! Get back here!', 'How COULD you?!'] },
    turn1: { all: ['...Wait. Why am I even fighting you?', 'These guys never even share their berries with me...', 'I\'ve been watching you fight... you\'re kind of amazing.'], timid: ['I d-don\'t even like fighting...'], lazy: ['...This is so much work. Why am I doing this?'] },
    turn2: { all: ['You know what? I\'d rather team up with YOU!', 'Forget them! Can I join your team?!', 'I\'m switching sides! Let\'s go, partner!'], polite: ['Allow me to offer my services instead.'], stoic: ['...I will follow you.'] },
    beg: { all: ['P-please... I don\'t want to fight anymore... can I come with you instead?'] },
    allyKill: { all: ['Got one!', 'Take that!', 'Did you see that? Did you SEE that?!'], stoic: ['Target down.'], polite: ['One less, partner.'], lazy: ['...That one\'s done. Nap time?'] },
    allyLow: { all: ['Ow... I\'m hanging in there!', 'Th-they hit hard...'] },
    allyIdle: { all: ['Thanks for letting me tag along!', 'Team life is SO much better!', 'Those guys were mean to me anyway...'], brave: ['I\'ll protect you, partner!'], lazy: ['Can we stop for a snack? ...No? Okay.'], cheerful: ['Adventure! Adventure! Adventure!'], polite: ['It\'s an honor to travel with you.'] },
    allyFaint: { all: ['S-sorry... I can\'t fight anymore... Thank you for taking me in...'] },
    win: { all: ['Hmph! And STAY down!', 'HA! That\'ll teach you!'] }, truce: { all: ['...Fine. Truce. For now.'] }, home: { all: ['Now that THAT\'s settled... I\'m going home to {home}.'] },
    grudge: { all: ['HEY! {other}! You stole my Gold Ball!', 'I was saving {snack} and YOU ate it, {other}!', 'You stepped on my tail AGAIN, {other}!', 'You told everyone I can\'t evolve!', 'This is MY napping spot, {other}!'] },
    grudgeSame: { all: ['Give back my Gold Ball, you copycat!', 'Mom always liked you better!'] },
    grudgeReply: { all: ['Finders keepers! Get lost!', 'Should\'ve been faster, then!', 'Make me!', 'Prove it!'], timid: ['I-I didn\'t mean to!'], sassy: ['Oh, cry me a river.'] } };
  // speech-bubble small talk (short)
  const B = {
    nap: ['Zzz...', '*snore*', '...five more minutes...', 'Mmh... {snack}...'], wake: ['Wha—?!', 'H-huh?! I wasn\'t sleeping!', 'Who\'s there?!'], eat: ['*munch munch*', 'Nom nom~', 'Mmm, {snack}!', 'So juicy!'], sniff: ['Mmm, flowers~', 'So pretty...', 'Smells like {home}...'],
    dig: ['There\'s gotta be treasure here...', '*dig dig dig*'], digFound: ['Ooh! Treasure!', 'I found a coin!'], digNone: ['...Nothing. Again.', 'Just dirt...'],
    tail: ['I\'ll get you this time!', 'Come back here, tail!'], dizzy: ['@_@', 'The ground is spinning...'], gaze: ['That cloud looks like {snack}...', 'So peaceful...', 'I miss {home}...', 'I wonder what\'s past the trees...'],
    play: ['Tag! You\'re it!', 'Hehe! Can\'t catch me!'], cry: ['*sniff*...', 'Waaah...'], shiny: ['Ooh, shiny!', 'So sparkly...'], cheer: ['Fight! Fight! Fight!', 'Get \'em!', 'Ooh, that\'s gotta hurt!'],
    scared: ['Eek!', 'Run away!', 'Not again!'], lvl: ['Whoa! It\'s glowing!', 'What was THAT?!'], bossFlee: ['That one\'s HUGE! Run!', 'Nope nope nope!'],
    swimTry: ['I can do it! I can sw— *blub blub*', 'Just one stroke... *glub*', 'Paddle, paddle... AAAH!'], swimFail: ['...Water is too wet.', '*cough* Maybe tomorrow.', 'Why can\'t I float?!'], swimOk: ['Ahh~ refreshing!', 'Splish splash~'],
    climbTry: ['Hup! Hup!', 'Just... a little... higher...!', 'I can see the top!'], climbFall: ['Oof!', 'Owie...', '...One day I\'ll reach the top.'],
    giratina: ['W-what IS that thing?!', 'The shadows are MOVING!', 'RUN!! Everyone RUN!', 'I don\'t wanna get eaten!', 'It\'s looking at us!'], rift: ['The sky is TEARING!', 'Legendaries?! HERE?!', 'Time is... bending?!', 'Hide! HIDE!'],
    kamina: ['What is he DOING?!', 'That drill is HUGE!', 'Duck!!', 'He\'s CRAZY!'], kaminaSad: ['...Poor little guy.', '...', 'He was so brave...'], stuck: ['I can\'t move!!', 'My legs won\'t work!', 'Mommyyy!'] };
  // a reply in someone's own voice, by mood
  const REPLY = {
    agree: { brave: ['Heh, you got that right!'], hothead: ['Obviously!'], timid: ['Y-yeah... I think so too...'], shy: ['...Me too.'], cheerful: ['YES! Totally!'], lazy: ['...yeah, sure.'], sassy: ['For once, you\'re right.'], polite: ['I quite agree.'], prankster: ['Heh, same!'], stoic: ['Agreed.'], gentle: ['I feel the same way.'], quirky: ['Agreed! Bloop!'] },
    disagree: { brave: ['No way! I\'d never!'], hothead: ['WRONG!'], timid: ['U-um... I don\'t think so...'], shy: ['...I don\'t know about that.'], cheerful: ['Hmm, nope!'], lazy: ['...nah.'], sassy: ['Ew. No.'], polite: ['I must respectfully disagree.'], prankster: ['Nuh-uh!'], stoic: ['No.'], gentle: ['Oh, I don\'t think so, dear.'], quirky: ['Opposite day? Then YES! I mean no!'] },
    scared: { brave: ['I\'m not scared! ...Much.'], hothead: ['Scared?! ME?! ...Okay, a little.'], timid: ['S-so scary...!'], shy: ['...I\'m scared.'], cheerful: ['Eep! That\'s spooky!'], lazy: ['...I\'ll worry about it tomorrow.'], sassy: ['Not my problem.'], polite: ['How very alarming.'], prankster: ['Ooh, spooky! I love it!'], stoic: ['...Concerning.'], gentle: ['Oh dear... stay safe, okay?'], quirky: ['Fun fact: I\'m terrified!'] },
    excited: { brave: ['Now THAT\'s worth fighting for!'], hothead: ['YEAH! LET\'S GO!'], timid: ['O-oh! Really?!'], shy: ['...That\'s nice.'], cheerful: ['WOW! Amazing!'], lazy: ['Huh. Neat.'], sassy: ['Hm. Not bad, I suppose.'], polite: ['How marvelous!'], prankster: ['Hehehe, sounds fun!'], stoic: ['...Interesting.'], gentle: ['How wonderful!'], quirky: ['Bloop bloop! Exciting!'] } };

  // ================= the voice shapes the line =================
  function fill(s, me, ctx) {
    const V = who(me), T = TYPE[V.type] || TYPE.normal, X = explorer(), O = ctx && ctx.other ? who(ctx.other) : null;
    return s.replace(/\{(\w+)\}/g, (_, k) => ({ me: V.name, other: O ? O.name : (ctx && ctx.otherName) || 'you', player: X.name, home: T.home, like: T.like, fear: T.fear, snack: T.snack, boast: T.boast, type: cap(V.type), otype: O ? cap(O.type) : '', ptype: cap(X.type),
      rumor: (ctx && ctx.rumor) || rumor(), about: aboutPlayer(me), cry: V.cry })[k] ?? '');
  }
  function shape(text, V, short, grave) {
    const v = VOICE[V.voice] || VOICE.stoic; let t = text.trim();
    if (v.stutter && chance(v.stutter)) t = t.replace(/^([A-Za-z])(?!-)/, (m, c) => c + '-' + (c === 'I' ? c : c.toLowerCase()));
    if (grave) return t;   // pain, grief, last words: no cheery openers or sign-offs
    if (!short && chance(0.5) && v.open.length) { const o = pick(v.open); if (o) t = o + ' ' + (/,$/.test(o) && /^[A-Z][a-z]/.test(t) && !/^(I|I'm|I'll|I've)\b/.test(t) ? t[0].toLowerCase() + t.slice(1) : t); }
    if (!short && /[.!]$/.test(t) && !/\.\.\.$/.test(t) && !/\?[!.]*$/.test(t) && chance(0.45)) t = t.replace(/[.!]+$/, '') + pick(v.close);
    if (v.caps && chance(0.5)) { const w = t.split(' '); const i = w.findIndex(x => x.replace(/[^a-z]/gi, '').length > 3); if (i >= 0) w[i] = w[i].toUpperCase(); t = w.join(' '); }
    if (v.slow && chance(0.4)) t = t.replace(/, /, '... ');
    if (v.cry && chance(v.cry)) t = chance(0.5) ? V.cry + '! ' + t : t + ' ' + V.cry + '!';
    return t.replace(/(?<!\.)([.!?]\s+)([a-z])/g, (m, a, c) => a + c.toUpperCase());   // a capital after every full stop
  }
  function emoteFor(sit, V) { const v = VOICE[V.voice] || VOICE.stoic;
    return ({ hurt: 'tear', die: 'tear', witness: BOLD.has(V.voice) ? 'anger' : 'tear', witnessSame: 'tear', witnessMate: 'tear', provoked: 'anger', lowHp: 'sweat', spotPlayer: BOLD.has(V.voice) ? 'anger' : v.em, traitor: 'anger', turn2: 'heart', beg: 'tear', allyFaint: 'tear', grudge: 'anger', avenge: 'anger', boss: 'anger' })[sit] || v.em; }
  function faceFor(sit, V) { const v = VOICE[V.voice] || VOICE.stoic;
    return ({ hurt: SOFT.has(V.voice) ? 'crying' : 'pain', die: 'crying', witness: BOLD.has(V.voice) ? 'shouting' : 'crying', witnessSame: 'crying', witnessMate: 'crying', provoked: 'angry', lowHp: 'pain', traitor: 'angry', turn1: 'worried', turn2: 'joyous', beg: 'teary', allyFaint: 'crying', grudge: 'angry', avenge: 'angry' })[sit] || v.face; }
  function line(me, sit, ctx) {
    const V = who(me); if (!V) return ['normal', '...', 'dots']; const pool = S[sit] || {}; let list = pool[V.voice] || pool.all;
    if (pool[V.voice] && pool.all && chance(0.3)) list = pool.all; if (!list) list = ['...'];
    return [faceFor(sit, V), shape(fill(pick(list), me, ctx), V, false, GRAVE.has(sit)), emoteFor(sit, V)];
  }
  function bubble(me, kind, ctx) { const V = who(me); const L = B[kind]; if (!V || !L) return '...'; return shape(fill(pick(L), me, ctx), V, true); }
  function reply(me, mood) { const V = who(me); const L = (REPLY[mood] || REPLY.agree)[V.voice] || ['...']; return [V.voice === 'timid' || V.voice === 'shy' ? 'worried' : (VOICE[V.voice] || VOICE.stoic).face, shape(pick(L), V, true), (VOICE[V.voice] || VOICE.stoic).em]; }

  // ================= conversations between two Pokemon =================
  // returns [[speaker, face, text, emote], ...] and an outcome ('love' | 'reject' | 'fight' | null)
  function chat(a, b, o) {
    o = o || {}; const A = who(a), Bv = who(b), rel = relation(a, b), out = [], L = (w, l) => out.push([w, l[0], l[1], l[2]]);
    const mood = (w, pos) => { const V = who(w); return pos ? (V.voice === 'sassy' || V.voice === 'stoic' ? 'agree' : 'excited') : 'disagree'; };
    const X = explorer(); let outcome = null;
    if (o.hostile) {   // two hostile ones on the march
      L(a, [VOICE[A.voice].face, shape(fill(pick(['That {player} is around here somewhere...', 'Let\'s surround that explorer!', 'Boss says nobody passes through here.', 'I heard {rumor}.', 'After this, berries are on me.']), a), A), VOICE[A.voice].em]);
      L(b, SOFT.has(Bv.voice) ? reply(b, 'scared') : reply(b, 'agree'));
      if (chance(0.4)) L(a, SOFT.has(Bv.voice) ? [VOICE[A.voice].face, shape(pick(['Toughen up!', 'Stay behind me, then.', 'You\'ll be fine.']), A, true), VOICE[A.voice].em] : reply(a, 'agree'));
      return { lines: out, outcome };
    }
    if (rel === 'mate' && chance(0.75)) {   // a possible sweetheart
      const comp = pick(['Your {type}-type glow is... really pretty, {other}.', 'Hey {other}... wanna share {snack} with me?', '{other}, would you... walk with me for a while?', 'I-I made you a flower crown, {other}!']);
      L(a, [A.voice === 'shy' || A.voice === 'timid' ? 'worried' : 'happy', shape(fill(comp, a, { other: b }), A), 'heart']);
      const yes = !(Bv.voice === 'sassy' && chance(0.6)) && !(Bv.voice === 'stoic' && chance(0.5)) && !(Bv.voice === 'hothead' && chance(0.4)) && chance(0.8);
      if (yes) { L(b, ['joyous', shape(pick(['...I\'d love that.', 'Y-yes! I was hoping you\'d ask!', 'Only if you hold my paw.', 'Hehe... you\'re sweet.']), Bv, true), 'heart']); outcome = 'love'; }
      else { L(b, ['normal', shape(pick(['Hmph. In your dreams.', 'Not interested.', 'Maybe after you evolve.', 'Ew, no.']), Bv, true), Bv.voice === 'stoic' ? 'dots' : 'anger']); L(a, ['sad', shape('...Oh. Okay.', A, true), 'tear']); outcome = 'reject'; }
      return { lines: out, outcome };
    }
    if (rel === 'twin') { L(a, line(a, 'greet', { other: b })); L(b, [faceFor('greet', Bv), shape(fill(pick(['We look exactly alike! Are you me?', 'Family reunion!', 'Copycat!', 'Hey, sibling!']), b), Bv), 'note']); L(a, reply(a, 'excited')); return { lines: out, outcome }; }
    if (rel === 'adv' && BOLD.has(A.voice)) {   // a type matchup
      L(a, ['determined', shape(fill(pick(['One {type} move and you\'re done, {other}.', 'Careful, {other}. {type} beats {otype}, everyone knows that.', 'Hey {other}, ever been hit by a {type}-type? You\'d remember.']), a, { other: b }), A), 'anger']);
      if (SOFT.has(Bv.voice)) { L(b, reply(b, 'scared')); } else { L(b, ['angry', shape(fill(pick(['Type matchups aren\'t everything!', 'Try it, {other}!', 'Big words for someone so small.']), b, { other: a }), Bv), 'anger']); if (BOLD.has(Bv.voice) && chance(0.35)) outcome = 'fight'; }
      return { lines: out, outcome };
    }
    if (rel === 'kin') { L(a, [VOICE[A.voice].face, shape(fill(pick(['Another {type}-type! We should stick together, {other}.', 'Hey {other}, {home} misses you too?', 'Fellow {type}-type! Still into {like}?']), a, { other: b }), A), VOICE[A.voice].em]); L(b, reply(b, 'agree')); return { lines: out, outcome }; }
    if (BOLD.has(A.voice) && BOLD.has(Bv.voice) && chance(0.4)) {   // two hotheads
      L(a, ['angry', shape(fill(pick(['You\'re in MY spot, {other}.', 'Nice face, {other}. Did a Geodude sit on it?', 'Bet I could beat you in a race, {other}.']), a, { other: b }), A), 'anger']);
      L(b, ['angry', shape(fill(pick(['Says the one who smells like {snack}!', 'Wanna settle this?!', 'Your spot? I don\'t see your name on it!']), b, { other: a }), Bv), 'anger']);
      L(a, reply(a, 'disagree')); if (chance(0.3)) outcome = 'fight'; return { lines: out, outcome };
    }
    // small talk on a topic
    const topic = pick(['food', 'home', 'explorer', 'rumor', 'dream', 'weather']);
    if (topic === 'food') { L(a, [VOICE[A.voice].face, shape(fill('Have you ever tried {snack}? It\'s the best.', a), A), 'note']); const same = A.type === Bv.type;
      L(b, [VOICE[Bv.voice].face, shape(fill(same ? 'Of course! Nothing beats it.' : 'Eh, I\'d rather have {snack}.', b), Bv), 'note']); L(a, reply(a, same ? 'excited' : chance(0.5) ? 'disagree' : 'agree')); }
    else if (topic === 'home') { L(a, [VOICE[A.voice].face, shape(fill('I\'m from {home}. Where are you from, {other}?', a, { other: b }), A), 'question']); L(b, [VOICE[Bv.voice].face, shape(fill('Me? I\'m from {home}. I miss it, honestly.', b), Bv), 'dots']); L(a, reply(a, 'agree')); }
    else if (topic === 'explorer') { L(a, [VOICE[A.voice].face, shape(fill(pick(['Did you see {player}? Everyone\'s talking about them.', 'That {player} keeps knocking everyone out...', 'Do you think {player} is friendly?']), a), A), 'question']);
      L(b, SOFT.has(Bv.voice) ? reply(b, 'scared') : BOLD.has(Bv.voice) ? ['determined', shape(fill(pick(['I could take \'em.', 'Pfft, overrated.', 'If they come here, I\'ll show \'em!']), b), Bv), 'anger']
        : [VOICE[Bv.voice].face, shape(pick(['They seem nice enough!', 'Hard to say... they\'re always fighting.', 'They waved at me once! I think.', 'As long as they leave the berries alone.']), Bv), VOICE[Bv.voice].em]); }
    else if (topic === 'rumor') { const r = rumor(); L(a, [VOICE[A.voice].face, shape(fill('Psst... did you hear? They say {rumor}.', a, { rumor: r }), A), 'exclaim']); L(b, reply(b, /Giratina|shadows|cracked|tore|grump|knocked|legendary|Golden/.test(r) ? (/Golden|Candy/.test(r) ? 'excited' : 'scared') : 'excited')); }
    else if (topic === 'dream') { L(a, [VOICE[A.voice].face, shape(fill(pick(['Someday I\'ll evolve and be the strongest in {home}.', 'One day I want to see the ocean.', 'I dream about {like} every night.']), a), A), 'spark']); L(b, reply(b, Bv.voice === 'sassy' ? 'disagree' : 'excited')); }
    else { L(a, [VOICE[A.voice].face, shape(fill(pick(['Nice weather for {like}, huh?', 'Feels like rain soon...', 'Perfect day to do nothing.']), a), A), 'note']); L(b, reply(b, chance(0.7) ? 'agree' : 'disagree')); }
    if (chance(0.5)) L(b, [VOICE[Bv.voice].face, shape(pick(['Anyway, see you around!', 'Gotta go!', 'Later!', 'Bye-bye!']), Bv, true), 'note']);
    return { lines: out, outcome };
  }

  window.PS_VOICE = { who, line, bubble, reply, chat, relation, run: RUN, natures: NATURES, voices: Object.keys(VOICE), label: w => { const V = who(w); return V ? V.nature : ''; } };
})();
