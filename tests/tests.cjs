/* ALL TESTS IN ONE FILE (needs Node.js).
     node tests/tests.cjs                      run every test
     node tests/tests.cjs progression gacha    run only the tests whose name contains one of these words
   Each test gets its own fresh copy of the game engine, so tests cannot affect each other. */
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..');

// One module's source, read straight out of the single-file bundle js/game.js (see tools/bundle.cjs).
function moduleSource(name){const {parse,BUNDLE}=require('../tools/bundle.cjs');const m=parse(fs.readFileSync(BUNDLE,'utf8')).find(x=>x.name===name);if(!m)throw new Error('module not in js/game.js: '+name);return m.source;}

// A fresh browser-like sandbox with the real game engine loaded (stopped just before the game boots).
function runtime(){
  const noop=()=>{};
  const element=new Proxy({getAttribute:()=>String(),style:{},classList:{add:noop,remove:noop},getContext:()=>new Proxy({},{get:()=>noop}),addEventListener:noop},{get:(o,k)=>k in o?o[k]:noop});
  const context={console, setTimeout:()=>0,clearTimeout:noop,setInterval:()=>0,clearInterval:noop,URL,URLSearchParams,performance:{now:()=>0},location:{hostname:'localhost',search:'',href:'http://localhost/'},navigator:{language:'en',userAgent:'Node'},localStorage:{getItem:()=>null,setItem:noop},document:{createElement:()=>element,getElementById:()=>element,querySelector:()=>element,querySelectorAll:()=>[],addEventListener:noop,documentElement:element,head:element,body:element},Image:class{addEventListener(){}},Audio:class{},addEventListener:noop,requestAnimationFrame:noop};
  context.window=context;context.globalThis=context;
  context.CanvasRenderingContext2D=class{};
  context.matchMedia=()=>({matches:false,addEventListener:noop});
  vm.createContext(context);
  let source=fs.readFileSync(path.join(root,'js/app.min.js'),'utf8');
  // Stop before application startup while retaining the actual engine and data.
  source=source.replace("_0x369baa['Flow']={'boot'()", "globalThis.__engine=_0x369baa;return;_0x369baa['Flow']={'boot'()");
  vm.runInContext(source,context,{timeout:20000});
  return {context,engine:context.__engine,vm};
}

const tests={
'validate'(){
  const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
  const {parse,build}=require('../tools/bundle.cjs');
  let count=0;
  for(const dir of [root,path.join(root,'js')])for(const name of fs.readdirSync(dir))if(name.endsWith('.js')){new vm.Script(fs.readFileSync(path.join(dir,name),'utf8'),{filename:name});count++;}
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),scripts=[...html.matchAll(/<script[^>]+src="([^"?]+)[^"]*"/g)].map(m=>m[1]);
  assert.equal(new Set(scripts).size,scripts.length);
  for(const src of scripts){if(!/^https?:/.test(src))assert(fs.existsSync(path.join(root,src)),src);}
  assert.deepEqual(scripts,['config.js','js/app.min.js','js/game.js']);
  assert(fs.existsSync(path.join(root,'css/game.css'))&&html.includes('href="css/game.css'));
  const bundle=fs.readFileSync(path.join(root,'js/game.js'),'utf8'),mods=parse(bundle),names=mods.map(m=>m.name);
  assert.equal(build(mods),bundle,'js/game.js markers are intact');
  for(const m of mods)new vm.Script(m.source,{filename:m.name});
  assert.equal(new Set(names).size,names.length);
  for(const name of ['digger-bros','kamina-moves','wild-life','wild-spawns','bond','birth-island','creation-rift','giratina-void','lake-trio'])assert(names.includes(name+'.js'),name);
  assert(names.indexOf('digger-bros.js')<names.indexOf('kamina-moves.js'));
  for(const name of ['wild-spawns','run-plus','wild-evolve']){const s=mods.find(m=>m.name===name+'.js').source;assert(s.includes('window.PS_WILD_SPAWNS'));assert(!/window\.PS_WILD\b/.test(s));}
  console.log(`PASS: ${count} scripts parse; ${mods.length} modules in js/game.js parse individually, in order, with intact markers; entry point loads ${scripts.length} scripts; wildlife APIs isolated.`);
},

'lake-integration'(){
  const assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
  const {engine:E,context:C,vm}=runtime();
  const noop=()=>{};let enemies=[],shots=[],damage=0;
  E.Game={state:'playing',player:null,st:{time:0}};E.World.collide=noop;E.World.isFree=()=>true;
  E.EnemyMgr.all=()=>enemies;E.EnemyMgr.update=noop;E.Projectiles.all=()=>shots;E.Sprites.preload=noop;
  for(const k of ['ring','burst','dmgText'])E.FX[k]=noop;
  E.Stats.dmg=noop;E.Camera.shake=noop;E.Audio.sfx=noop;E.Audio.ultLoop=()=>0;E.Ult.drawUnits=noop;E.Combat.tick=noop;
  for(const name of ['hoopa.js','lake-trio.js'])vm.runInContext(moduleSource(name),C);
  const lake=C.PS_LAKE,ids=['lake-uxie','lake-mesprit','lake-azelf'];
  for(const dex of [480,481,482]){
   const p=new E.Player(E.DEX_BY[dex],{},false);E.Game.player=p;p.level=10;
   const pool=E.Moves.poolFor(p.mon).filter(id=>ids.includes(id));
   assert.equal(pool.length,2);assert(!pool.includes(lake.trio[dex].move));
   p.moves=pool.map(id=>E.Moves.instance(id,1));E.Combat.tick(.1,p);
   assert.equal(lake.allies.length,2);assert.equal(lake.summon(dex),null);
   const units=lake.allies.map(a=>lake._ally(a.dex));
   for(const s of units){assert.equal(s.caster.buffs,p.buffs);assert.equal(s.maxHp,Math.max(30,Math.round(p.maxHp*s.t.hp)));assert(s.caster.atk>0);}
   const atk=units[0].caster.atk;p.baseAtk*=2;assert.equal(units[0].caster.atk,atk*2);
   enemies=[{dex:19,x:p.x+100,y:p.y,r:12,hp:100000,maxHp:100000,types:['normal'],dmg:5,hurt:n=>{damage+=n;},applyStun:noop,applySlow:noop}];
   for(let i=0;i<80;i++){E.Game.st.time+=.5;E.EnemyMgr.update(.5);E.Combat.tick(.5,p);}
   assert.equal(lake.allies.length,2);assert(lake.allies.every(s=>Number.isFinite(s.x)&&Number.isFinite(s.y)));
   const s=units[0];s.spawnT=10;s.caster.lives=0;s.caster.sashT=-999;
   for(let hit=0;hit<8&&!s.dead;hit++){s.hurtCd=0;s.standT=0;s.caster.invuln=0;s.caster.reviveShield=0;s.caster.shadeInv=0;s.caster.hurt(1e9,'normal');}assert(s.dead);
   E.Game.st.time+=21;for(let i=0;i<30;i++){E.EnemyMgr.update(.5);E.Combat.tick(.5,p);}
   assert(!lake._ally(s.dex).dead,'summon revives after its cooldown');
   p.dead=true;E.EnemyMgr.update(.1);assert.equal(lake.allies.length,0);
  }
  assert.equal(E.Moves.poolFor(E.DEX_BY[150]).filter(id=>ids.includes(id)).length,0);
  assert(damage>0,'summons damage enemies');
  console.log('PASS: three leaders, exclusive moves, shared buffs, scaled damage/HP, permanent allies, combat, revival and cleanup.');
},

'gacha-integration'(){
  const assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
  const {engine:E,context:C,vm}=runtime();
  C.PS_GACHA_SINGLE=true;
  vm.runInContext(moduleSource('special-gacha.js'),C);
  for(const n of [1,10,100]){
   const saved={at:123,from:'catch'},s={owned:{19:saved},shiny:{19:saved},coins:100,tickets:{t1:1000,t10:100},pity:{},shinyPity:{},stats:{}};
   const before=JSON.stringify(s);
   const r=E.Gacha.pull(s,n,1,'t1');assert.equal(r.length,n);
   const allowed=new Set([...C.PS_SPECIAL_GACHA.STARTERS,...Object.keys(C.PS_SPECIAL_GACHA.LEGENDS).map(Number)]);
   assert(r.every(x=>allowed.has(x.dex)));
   const results=new Set(r.map(x=>String(x.dex)));results.add('19');
   assert.deepEqual(Object.keys(s.owned).sort(),[...results].sort());
   assert.equal(s.owned[19],saved);assert.equal(s.shiny[19],saved);
   assert.equal(s.coins,100+r.reduce((a,x)=>a+x.refund,0));
   assert.equal(s.tickets.t1,1000-n);assert.equal(s.stats.pulls,n);
   for(const x of r)if(x.shiny)assert(s.shiny[x.dex]);
  }
  const s={owned:{19:{at:1,from:'catch'}},shiny:{},coins:0,tickets:{t1:0,t10:0},pity:{},stats:{}};
  const before=JSON.stringify(s);assert.equal(E.Gacha.pull(s,10,1),null);assert.equal(JSON.stringify(s),before);
  console.log('PASS: x1/x10/x100 pools, collection preservation, refunds, ticket costs, pull stats, shinies and insufficient funds.');
},

'dialogue-boxes'(){
  const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
  let time=0;const noop=()=>{};function el(){return {style:{},classList:{add:noop,remove:noop,toggle:noop},querySelector:()=>el(),offsetWidth:80,offsetHeight:100,textContent:'',getContext:()=>({}),addEventListener:noop};}
  const c={console,Map,Set,WeakSet,Math,performance:{now:()=>time*1000},document:{readyState:'loading',createElement:()=>el(),addEventListener:noop},Image:class{},addEventListener:noop,requestAnimationFrame:noop,setTimeout:noop,matchMedia:()=>({matches:false})};c.window=c;
  c.PS_HOOPA_ENGINE={Game:{player:{dex:482},state:'playing'},DEX_BY:{480:{name:'Uxie'},481:{name:'Mesprit'},482:{name:'Azelf'}}};c.PS_LAKE={allies:[{dex:480},{dex:481}]};c.PS_SPEAKER_ALLOWED=()=>true;
  let source=moduleSource('lake-talk.js');source=source.replace('  window.PS_LAKE_TALK =','  window.__boxes={show,tickBox,say,clearAll,get active(){return order.map(sl=>sl.cur.it);},get pending(){return queue.slice();}};\n  window.PS_LAKE_TALK =');vm.createContext(c);vm.runInContext(source,c);
  const b=c.__boxes,T=c.PS_LAKE_TALK;function line(d,text){return T.line(d,'determined',text,'',{prio:true});}function tick(s){time+=s;b.tickBox(s);}
  line(482,'First resolve.');tick(.01);assert.equal(b.active.length,1);
  for(let i=0;i<30;i++)line(482,'Resolve '+i);assert.equal(b.pending.length,1);tick(1);assert.equal(b.active.length,1);assert.equal(b.active[0].dex,482);
  line(481,'I will help.');line(480,'I am watching.');tick(.1);tick(1);assert.equal(b.active.length,3);assert.equal(new Set(b.active.map(x=>x.dex)).size,3);
  line(482,'Keep moving.');tick(.1);assert.equal(b.active.length,3);assert.equal(new Set(b.active.map(x=>x.dex)).size,3);
  b.show({dex:482,face:'normal',text:'Cannot steal a box.'});assert.equal(b.active.length,3);
  tick(5);assert.equal(b.active.length,0);assert.equal(b.pending.length,1);tick(3.9);assert.equal(b.active.length,0);tick(.2);assert.equal(b.active.length,1);
  // Passive reactions still use the original speaker-specific line tables.
  b.clearAll();tick(5);assert(b.say(480,T.lines[480].confuse,{prio:true}));assert(b.say(481,T.lines[481].pulse.heal,{prio:true}));assert(b.say(482,T.lines[482].rise,{prio:true}));tick(1);tick(2);tick(2);assert.equal(new Set(b.active.map(x=>x.dex)).size,b.active.length);assert(b.active.length<=3);
  // Both object-backed player voice and scripted lines share the same speaker key.
  b.clearAll();tick(5);line(482,'Scripted.');tick(.1);T.line(482,'normal','Player voice.','',{prio:true,obj:c.PS_HOOPA_ENGINE.Game.player});tick(1);assert.equal(b.active.filter(x=>x.dex===482).length,1);
  console.log('PASS: three distinct speakers; one active box per Pokemon; one pending line per Pokemon; repeated Azelf lines cannot monopolize boxes; other speakers bypass the waiting Azelf line; four-second speaker pause; direct-show guard; Lake Trio passive lines retained.');
},

'progression'(){
  const fs=require('fs'),assert=require('assert/strict');const {context:c,engine:n,vm}=runtime();
  c.PS_HOOPA_ENGINE=n;c.PS_MEGA_BRIDGE_V5={game:n.Game,camera:n.Camera,world:{isFree:()=>true}};
  Object.defineProperty(n.Game,'player',{value:{dex:482,level:1,x:0,y:0},configurable:true,writable:true});Object.defineProperty(n.Game,'state',{value:'playing',configurable:true,writable:true});n.Camera.resize(960,640,1);n.Camera.x=n.Camera.y=0;
  vm.runInContext(moduleSource('encounters.js'),c);const P=c.PS_ENCOUNTERS;P.install();
  assert.equal(P.required(445),48);assert.equal(P.required(444),24);assert.equal(P.required(17),18);assert(!P.allowed(445));assert(P.allowed(16));assert.equal(P.cap(),16);
  let pool=P.pool();assert(pool.length);assert(pool.every(d=>P.allowed(d.dex)));assert(pool.some(d=>d.dex===16));assert(!pool.some(d=>d.dex===445));
  const def={dex:445,name:'Garchomp',behavior:'chase',hp:14,spd:50,dmg:5,xp:4};
  let e=new n.Enemy(def,20000,20000,{hp:1,dmg:1,spd:1},false);assert.notEqual(e.dex,445);n.EnemyMgr.add(e);assert(n.Camera.sees(e.x,e.y,0));
  for(let i=0;i<1000;i++)n.EnemyMgr.add({id:50000+i,dex:16,def:{...def,dex:16},x:0,y:0,dead:false});
  assert.equal(n.EnemyMgr.all().length,14);
  for(let i=0;i<2;i++)n.EnemyMgr.add({id:60000+i,dex:445,boss:true,x:0,y:0,dead:false});assert.equal(n.EnemyMgr.all().length,16);
  const far=n.EnemyMgr.all().find(x=>!x.boss);far.x=100000;const id=far.id;P.sweep();assert(!n.EnemyMgr.get(id));assert(far.__psCulled);assert(n.EnemyMgr.all().filter(x=>x.boss).length===2);
  n.Game.player.level=47;assert(!P.allowed(445));assert(P.allowed(444));n.Game.player.level=48;assert(P.allowed(445));assert.equal(P.cap(),31);
  pool=P.pool();assert(pool.some(d=>d.dex===445));assert(pool.some(d=>d.dex===16));assert(pool.filter(d=>d.dex===16).length<pool.filter(d=>d.dex===445).length);
  console.log('PASS actual engine: Garchomp 48, Gabite 24, Pidgeotto 18; rookie pool; 1,000 spawn cap stress; visible edge spawn; boss reserve; reward-free culling; retained lower-weight rookies.');
  // Load the real dialogue module with lightweight UI stubs; exercise the exported selection gates.
  c.document.readyState='loading';vm.runInContext(moduleSource('lake-talk.js'),c);const T=c.PS_LAKE_TALK;let allies=[];c.PS_LAKE={get allies(){return allies;}};
  const row=text=>[['happy',text,'']];const sel=text=>T.contextual(482,row(text));
  assert.equal(sel('Uxie, Mesprit, my sisters!').length,0);assert.equal(sel('My will is unbroken.').length,1);
  assert.equal(T.contextual(482,T.lines[482].chat).length,2);assert(T.contextual(482,T.lines[482].chat).every(x=>!x[1].includes('Uxie')));
  allies=[{dex:480,dead:false,spawning:false}];assert.equal(sel('Uxie, stay close.').length,1);assert.equal(sel('Mesprit, stay close.').length,0);assert.equal(sel('Keep up, you two!').length,0);assert(T.contextual(482,T.lines[482].chat).every(x=>x[1].includes('Uxie')&&!x[1].includes('Mesprit')));
  allies.push({dex:481,dead:false,spawning:true});assert.equal(sel('My sisters, together!').length,0);allies[1].spawning=false;assert.equal(sel('My sisters, together!').length,1);allies[0].dead=true;assert.equal(sel('My sisters, together!').length,0);assert(T.contextual(482,T.lines[482].chat).every(x=>x[1].includes('Mesprit')&&!x[1].includes('Uxie')));
  assert(!T.partyAllows(482,'Uxie, stay close.'));console.log('PASS actual dialogue module: solo, each individual sister, both sisters, spawning exclusion, faint/despawn invalidation and queued-line gate.');
},
};

const only=process.argv.slice(2);let failed=0,ran=0;
for(const [name,run] of Object.entries(tests)){
  if(only.length&&!only.some(w=>name.includes(w)))continue;ran++;
  process.stdout.write(`[${name}] `);
  try{run();}catch(e){failed++;console.log('FAIL\n',e.stack||e);}
}
console.log(`\n${ran-failed}/${ran} tests passed.`);
if(failed||!ran)process.exitCode=1;
