// =====================================================================
//  ABILITIES + LEGENDARY PASSIVES   (loaded before mega-native.js)
//
//  Every legendary (base form) and every Mega/Primal gets:
//    1) a damage passive  (legendaries: own types x1.3 if dual-type; Megas: their kit's 'deal')
//    2) the MONOTYPE bonus if it has a single type (see PS_MONOTYPE)
//    3) ONE ability from PS_ABILITIES (one each, for balance)
//
//  All of these multiply the FINAL hit (after the game's own damage formula), so they stack
//  on top of Power / Vigor upgrades and never touch the game's x50 damage soft cap.
// =====================================================================

// Monotype bonus (no second type = less versatile, so more raw power).
//   own:   total multiplier on moves of its own type   (replaces, not stacks with, the type passive)
//   other: multiplier on every other move type
//   scope: 'legend+mega' = legendaries and Mega/Primal forms only;  'all' = every monotype Pokemon
window.PS_MONOTYPE = { own: 2.0, other: 1.5, scope: 'legend+mega' };

// Dual-type legendaries: damage passive on their own two types.
window.PS_LEGEND_DUAL_DEAL = 1.3;

// ---------------------------------------------------------------------
//  Ability effects available (combine freely inside an ability):
//   deal:{type:m, all:m, stab:m}        damage you deal (stab = your own types)
//   dealKinds:{melee:m, dash:m, beam:m, nova:m, chain:m, turret:m, mine:m, ...}  by move kind
//   dealMatch:{re:'punch|fist', m:1.3}  moves whose id matches
//   dealLowBase:{max:16, m:1.5}         weak moves (base damage <= max)
//   dealStatus:m                        moves that burn / poison / slow
//   dealMulti:m                         multi-hit moves (count > 1)
//   take:{type:m, all:m}                damage you take
//   superTake:m                         super-effective damage you take
//   absorb:['electric'], absorbHeal:0.03   immune to that type and heal when hit by it
//   ignoreResist:true                   your moves ignore 'not very effective'
//   regen:0.01                          % max HP healed per second
//   spd:1.2                             speed multiplier (Mega/Primal forms only)
//   lowHp:{below:0.5, deal:1.4, take:0.6}   while HP is below that fraction
//   highHp:{above:0.9, take:0.5}            while HP is above that fraction
//   weatherSet:'sun'                    summons that weather (sun rain sand snow hail electric grassy misty psychic fog)
//   weatherBoost:{kinds:['sun'], deal:1.3}  more damage while that weather is active
//   weatherImmune:true                  weather still happens but its DOWNSIDES don't apply to you
//   aura:{radius:170, slow:0.25}        nearby foes are slowed
//   burnChance / poisonChance / slowChance: 0..1   chance your hits inflict it
//   slowStart:{secs:20, early:0.6, late:1.5}       damage x early for the first secs of a run, then x late
//   onHit:{stun:{chance,dur}, stunName:'freeze', slow:{chance,amount}, burn:p, poison:p, reflect:f,
//          types:['dark'] (only hits of these types), contact:true (only body contact)}
//          -> effects on the ENEMY THAT HIT YOU (contact or its projectile; never lava/weather)
//   onHitBuff:{deal:1.4, take:0.85, dur:6, chance:1, types:[...]}   temporary boost after being hit
//   absorbBuff:{type:'fire'|'all', deal:1.5, dur:6}                  boost after absorbing a hit
//   takeRanged:0.6                       damage from enemy projectiles
//   endure:{cd:30}                       survive a lethal hit with 1 HP (cooldown in seconds)
//   beastBoost:{stat:'deal'|'take'|'spd'|'heal', per:0.03, max:15, dur:8}   each KO: +3% damage / -3% damage taken /
//                                        +3% speed (stacks up to max, lasts dur s, refreshed by KOs) or heals per% HP
// ---------------------------------------------------------------------
window.PS_ABILITIES = {
 'intimidate':      {name:'Intimidate',      take:{all:0.8}, onHit:{slow:{chance:0.35,amount:0.35}}},
 'levitate':        {name:'Levitate',        take:{ground:0}, takeRanged:0.9},
 'thick-fat':       {name:'Thick Fat',       take:{fire:0.5,ice:0.5}, onHit:{slow:{chance:0.25,amount:0.3}}},
 'multiscale':      {name:'Multiscale',      highHp:{above:0.9,take:0.5}},
 'shadow-shield':   {name:'Shadow Shield',   highHp:{above:0.9,take:0.5}, onHit:{slow:{chance:0.3,amount:0.4}}},
 'tera-shell':      {name:'Tera Shell',      highHp:{above:0.95,take:0.5}},
 'regenerator':     {name:'Regenerator',     regen:0.015},
 'natural-cure':    {name:'Natural Cure',    regen:0.01},
 'hydration':       {name:'Hydration',       regen:0.008, weatherBoost:{kinds:['rain','storm'],deal:1.2}},
 'ice-body':        {name:'Ice Body',        regen:0.01, onHit:{stun:{chance:0.25,dur:1.2},stunName:'freeze',slow:{chance:0.5,amount:0.45}}},
 'healer':          {name:'Healer',          regen:0.02},
 'speed-boost':     {name:'Speed Boost',     spd:1.25},
 'steadfast':       {name:'Steadfast',       spd:1.15, onHitBuff:{chance:0.3,deal:1.25,dur:4}},
 'tough-claws':     {name:'Tough Claws',     dealKinds:{melee:1.3,dash:1.3}},
 'unseen-fist':     {name:'Unseen Fist',     dealKinds:{melee:1.35,dash:1.35}},
 'piercing-drill':  {name:'Piercing Drill',  dealKinds:{dash:1.4,melee:1.2}},
 'mega-launcher':   {name:'Mega Launcher',   dealKinds:{beam:1.5,nova:1.5,chain:1.3}},
 'technician':      {name:'Technician',      dealLowBase:{max:16,m:1.5}},
 'strong-jaw':      {name:'Strong Jaw',      dealMatch:{re:'bite|fang|crunch|jaw',m:1.5}},
 'iron-fist':       {name:'Iron Fist',       dealMatch:{re:'punch|fist|hammer|chop',m:1.35}},
 'sharpness':       {name:'Sharpness',       dealMatch:{re:'cut|slash|blade|cleave|sword|leaf|guillotine|claw|axe|scythe|edge|shuriken',m:1.5}},
 'skill-link':      {name:'Skill Link',      dealMulti:1.35},
 'sheer-force':     {name:'Sheer Force',     dealStatus:1.3},
 'adaptability':    {name:'Adaptability',    deal:{stab:1.33}},
 'pixilate':        {name:'Pixilate',        deal:{fairy:1.2,normal:1.3}},
 'aerilate':        {name:'Aerilate',        deal:{flying:1.2,normal:1.3}},
 'refrigerate':     {name:'Refrigerate',     deal:{ice:1.2,normal:1.3}},
 'dragonize':       {name:'Dragonize',       deal:{dragon:1.2,normal:1.3}},
 'no-guard':        {name:'No Guard',        deal:{all:1.15}},
 'trace':           {name:'Trace',           deal:{all:1.15}},
 'download':        {name:'Download',        deal:{all:1.15}},
 'magician':        {name:'Magician',        deal:{all:1.15}},
 'synchronize':     {name:'Synchronize',     deal:{all:1.15}},
 'contrary':        {name:'Contrary',        deal:{all:1.2}},
 'victory-star':    {name:'Victory Star',    deal:{all:1.2}},
 'soul-heart':      {name:'Soul-Heart',      deal:{all:1.2}},
 'rks-system':      {name:'RKS System',      deal:{all:1.2}},
 'embody-aspect':   {name:'Embody Aspect',   deal:{all:1.2}},
 'chilling-neigh':  {name:'Chilling Neigh',  deal:{all:1.2}},
 'grim-neigh':      {name:'Grim Neigh',      deal:{all:1.2}},
 'as-one':          {name:'As One',          deal:{all:1.15}, aura:{radius:150,slow:0.2}},
 'intrepid-sword':  {name:'Intrepid Sword',  deal:{all:1.25}},
 'beads-of-ruin':   {name:'Beads of Ruin',   deal:{all:1.25}},
 'multitype':       {name:'Multitype',       deal:{all:1.25}},
 'parental-bond':   {name:'Parental Bond',   deal:{all:1.3}},
 'protean':         {name:'Protean',         deal:{all:1.3}},
 'huge-power':      {name:'Huge Power',      deal:{all:1.5}},
 'pure-power':      {name:'Pure Power',      deal:{all:1.5}},
 'colossal':        {name:'Slow Start',      slowStart:{secs:20,early:0.6,late:1.5}},
 'scrappy':         {name:'Scrappy',         deal:{normal:1.3,fighting:1.3}},
 'transistor':      {name:'Transistor',      deal:{electric:1.5}},
 'dragons-maw':     {name:'Dragon\'s Maw',   deal:{dragon:1.5}},
 'fairy-aura':      {name:'Fairy Aura',      deal:{fairy:1.33}},
 'dark-aura':       {name:'Dark Aura',       deal:{dark:1.33}},
 'berserk':         {name:'Berserk',         lowHp:{below:0.5,deal:1.4}, onHitBuff:{chance:0.2,deal:1.2,dur:4}},
 'innards-out':     {name:'Innards Out',     onHit:{reflect:0.3}},
 'power-construct': {name:'Power Construct', lowHp:{below:0.5,take:0.6}, endure:{cd:45}},
 'stalwart':        {name:'Stalwart',        superTake:0.7},
 'filter':          {name:'Filter',          superTake:0.75},
 'prism-armor':     {name:'Prism Armor',     superTake:0.75},
 'magic-bounce':    {name:'Magic Bounce',    take:{all:0.9}, onHit:{reflect:0.25}},
 'shell-armor':     {name:'Shell Armor',     take:{all:0.85}},
 'battle-armor':    {name:'Battle Armor',    take:{all:0.85}},
 'clear-body':      {name:'Clear Body',      take:{all:0.85}, onHit:{slow:{chance:0.2,amount:0.3}}},
 'full-metal-body': {name:'Full Metal Body', take:{all:0.85}, onHit:{reflect:0.15}},
 'aura-break':      {name:'Aura Break',      take:{all:0.85}, onHit:{stun:{chance:0.15,dur:0.7}}},
 'commander':       {name:'Commander',       take:{all:0.85}},
 'sturdy':          {name:'Sturdy',          highHp:{above:0.9,take:0.6}, endure:{cd:30}},
 'unaware':         {name:'Unaware',         take:{all:0.9}},
 'insomnia':        {name:'Insomnia',        take:{all:0.9}},
 'inner-focus':     {name:'Inner Focus',     take:{all:0.9}},
 'aura-guard':      {name:'Aura Guard',      take:{all:0.85}, onHit:{reflect:0.2}},
 'bulletproof':     {name:'Bulletproof',     takeRanged:0.6},
 'dauntless-shield':{name:'Dauntless Shield',take:{all:0.8}},
 'justified':       {name:'Justified',       take:{dark:0.5}, onHitBuff:{types:['dark'],deal:1.4,dur:6}},
 'thermal-exchange':{name:'Thermal Exchange',take:{fire:0.5}, onHitBuff:{types:['fire'],deal:1.3,dur:5}},
 'volt-absorb':     {name:'Volt Absorb',     absorb:['electric'],absorbHeal:0.03},
 'lightning-rod':   {name:'Lightning Rod',   absorb:['electric'],absorbHeal:0.02, absorbBuff:{type:'all',deal:1.3,dur:6}},
 'flash-fire':      {name:'Flash Fire',      absorb:['fire'],absorbHeal:0.02, absorbBuff:{type:'fire',deal:1.5,dur:6}},
 'water-absorb':    {name:'Water Absorb',    absorb:['water'],absorbHeal:0.04},
 'mold-breaker':    {name:'Mold Breaker',    ignoreResist:true},
 'teravolt':        {name:'Teravolt',        ignoreResist:true},
 'turboblaze':      {name:'Turboblaze',      ignoreResist:true},
 'infiltrator':     {name:'Infiltrator',     ignoreResist:true},
 'prankster':       {name:'Prankster',       dealKinds:{turret:1.4,mine:1.4,buff:1.4,orbit:1.25}},
 'drought':         {name:'Drought',         weatherSet:'sun'},
 'mega-sol':        {name:'Mega Sol',        weatherSet:'sun'},
 'drizzle':         {name:'Drizzle',         weatherSet:'rain'},
 'sand-stream':     {name:'Sand Stream',     weatherSet:'sand'},
 'snow-warning':    {name:'Snow Warning',    weatherSet:'snow'},
 'electric-surge':  {name:'Electric Surge',  weatherSet:'electric'},
 'psychic-surge':   {name:'Psychic Surge',   weatherSet:'psychic'},
 'grassy-surge':    {name:'Grassy Surge',    weatherSet:'grassy'},
 'misty-surge':     {name:'Misty Surge',     weatherSet:'misty'},
 'orichalcum-pulse':{name:'Orichalcum Pulse',weatherSet:'sun', weatherBoost:{kinds:['sun','harsh'],deal:1.33}},
 'sand-force':      {name:'Sand Force',      weatherBoost:{kinds:['sand'],deal:1.3}},
 'swift-swim':      {name:'Swift Swim',      weatherBoost:{kinds:['rain','storm'],deal:1.3}},
 'solar-power':     {name:'Solar Power',     weatherBoost:{kinds:['sun','harsh'],deal:1.5}},
 'air-lock':        {name:'Air Lock',        weatherImmune:true},
 'delta-stream':    {name:'Delta Stream',    weatherImmune:true, take:{electric:0.5,ice:0.5,rock:0.5}},
 'pressure':        {name:'Pressure',        aura:{radius:170,slow:0.25}, onHit:{slow:{chance:0.5,amount:0.4}}},
 'unnerve':         {name:'Unnerve',         aura:{radius:150,slow:0.2}, onHit:{stun:{chance:0.15,dur:0.6},stunName:'unnerve'}},
 'shadow-tag':      {name:'Shadow Tag',      aura:{radius:170,slow:0.3}, onHit:{stun:{chance:0.2,dur:0.8},stunName:'trap'}},
 'bad-dreams':      {name:'Bad Dreams',      aura:{radius:180,slow:0.3}, onHit:{stun:{chance:0.3,dur:1.5},stunName:'put to sleep'}},
 'static':          {name:'Static',          onHit:{stun:{chance:0.3,dur:0.9},stunName:'paralyze'}, slowChance:0.1},
 'flame-body':      {name:'Flame Body',      onHit:{burn:0.3}, burnChance:0.1},
 'spicy-spray':     {name:'Spicy Spray',     onHit:{burn:0.6}},
 'poison-touch':    {name:'Poison Touch',    poisonChance:0.3},
 'toxic-chain':     {name:'Toxic Chain',     poisonChance:0.3},
 'serene-grace':    {name:'Serene Grace',    burnChance:0.15, poisonChance:0.15, slowChance:0.15},
 'magnet-pull':     {name:'Magnet Pull',     aura:{radius:150,slow:0.2}, deal:{steel:1.2}},
 // ---- Ultra Beasts: every one has BEAST BOOST (each KO stacks a boost to its best stat, for a few seconds)
 //      plus one lore twist of its own.
 'beast-boost-nihilego':   {name:'Beast Boost (Sp. Def)', beastBoost:{stat:'take',per:0.025,max:12,dur:8}, poisonChance:0.25},
 'beast-boost-buzzwole':   {name:'Beast Boost (Attack)',  beastBoost:{stat:'deal',per:0.03,max:15,dur:8}, dealKinds:{melee:1.2,dash:1.2}},
 'beast-boost-pheromosa':  {name:'Beast Boost (Speed)',   beastBoost:{stat:'spd',per:0.03,max:15,dur:8}, deal:{all:1.15}},
 'beast-boost-xurkitree':  {name:'Beast Boost (Sp. Atk)', beastBoost:{stat:'deal',per:0.03,max:15,dur:8}, onHit:{stun:{chance:0.25,dur:0.8},stunName:'paralyze'}},
 'beast-boost-celesteela': {name:'Beast Boost (Attack)',  beastBoost:{stat:'deal',per:0.025,max:15,dur:8}, takeRanged:0.8},
 'beast-boost-kartana':    {name:'Beast Boost (Attack)',  beastBoost:{stat:'deal',per:0.035,max:12,dur:8}, dealMatch:{re:'cut|slash|blade|sword|leaf|claw|edge|origami',m:1.3}},
 'beast-boost-guzzlord':   {name:'Beast Boost (HP)',      beastBoost:{stat:'heal',per:0.03}, regen:0.005},
 'beast-boost-poipole':    {name:'Beast Boost (Sp. Atk)', beastBoost:{stat:'deal',per:0.02,max:20,dur:8}, poisonChance:0.2},
 'beast-boost-naganadel':  {name:'Beast Boost (Sp. Atk)', beastBoost:{stat:'deal',per:0.03,max:15,dur:8}, poisonChance:0.25, dealKinds:{beam:1.2}},
 'beast-boost-stakataka':  {name:'Beast Boost (Defense)', beastBoost:{stat:'take',per:0.03,max:12,dur:8}, highHp:{above:0.8,take:0.75}},
 'beast-boost-blacephalon':{name:'Beast Boost (Sp. Atk)', beastBoost:{stat:'deal',per:0.035,max:15,dur:8}, burnChance:0.2},
 // Mega Gardevoir (your spec): 25% less damage from Ghost, Dark and Steel.
 'pixie-ward':      {name:'Pixilate',        take:{ghost:0.75,dark:0.75,steel:0.75}}
};

// Legendaries & mythicals (base forms): dex -> ability id (their real in-game ability).
// They also get the damage passive (own types x1.3 if dual-type) or the monotype bonus.
window.PS_LEGEND_KITS = {
 144:'pressure',145:'static',146:'flame-body',150:'pressure',151:'synchronize',
 243:'pressure',244:'inner-focus',245:'inner-focus',249:'multiscale',250:'regenerator',251:'natural-cure',
 377:'clear-body',378:'ice-body',379:'clear-body',380:'levitate',381:'levitate',
 382:'drizzle',383:'drought',384:'air-lock',385:'serene-grace',386:'pressure',
 480:'levitate',481:'levitate',482:'levitate',483:'pressure',484:'pressure',485:'flash-fire',
 486:'colossal',487:'pressure',488:'levitate',489:'hydration',490:'hydration',491:'bad-dreams',
 492:'natural-cure',493:'multitype',494:'victory-star',
 638:'justified',639:'justified',640:'justified',641:'prankster',642:'prankster',
 643:'turboblaze',644:'teravolt',645:'sand-force',646:'pressure',647:'justified',648:'serene-grace',649:'download',
 716:'fairy-aura',717:'dark-aura',718:'aura-break',719:'clear-body',720:'magician',721:'water-absorb',
 772:'battle-armor',773:'rks-system',785:'electric-surge',786:'psychic-surge',787:'grassy-surge',788:'misty-surge',
 789:'unaware',790:'sturdy',791:'full-metal-body',792:'shadow-shield',800:'prism-armor',801:'soul-heart',
 802:'technician',807:'volt-absorb',808:'magnet-pull',809:'iron-fist',
 888:'intrepid-sword',889:'dauntless-shield',890:'pressure',891:'inner-focus',892:'unseen-fist',
 894:'transistor',895:'dragons-maw',896:'chilling-neigh',897:'grim-neigh',898:'as-one',905:'contrary',
 793:'beast-boost-nihilego',794:'beast-boost-buzzwole',795:'beast-boost-pheromosa',796:'beast-boost-xurkitree',797:'beast-boost-celesteela',
 798:'beast-boost-kartana',799:'beast-boost-guzzlord',803:'beast-boost-poipole',804:'beast-boost-naganadel',805:'beast-boost-stakataka',806:'beast-boost-blacephalon',
 1004:'beads-of-ruin',1007:'orichalcum-pulse',1015:'toxic-chain',1016:'toxic-chain',1017:'embody-aspect',1024:'tera-shell'
};

// Ultra Beasts: treated like legendaries (ability + traits + signature move), labelled 'Ultra Beast'.
window.PS_ULTRA_BEASTS = [793,794,795,796,797,798,799,803,804,805,806];
