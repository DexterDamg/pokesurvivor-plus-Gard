const fs=require('fs'),assert=require('assert/strict');const {context:c,engine:n,vm}=require('./lake-runtime.cjs');
c.PS_HOOPA_ENGINE=n;c.PS_MEGA_BRIDGE_V5={game:n.Game,camera:n.Camera,world:{isFree:()=>true}};
Object.defineProperty(n.Game,'player',{value:{dex:482,level:1,x:0,y:0},configurable:true,writable:true});Object.defineProperty(n.Game,'state',{value:'playing',configurable:true,writable:true});n.Camera.resize(960,640,1);n.Camera.x=n.Camera.y=0;
vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../js/encounters.js'),'utf8'),c);const P=c.PS_ENCOUNTERS;P.install();
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
c.document.readyState='loading';vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../js/lake-talk.js'),'utf8'),c);const T=c.PS_LAKE_TALK;let allies=[];c.PS_LAKE={get allies(){return allies;}};
const row=text=>[['happy',text,'']];const sel=text=>T.contextual(482,row(text));
assert.equal(sel('Uxie, Mesprit, my sisters!').length,0);assert.equal(sel('My will is unbroken.').length,1);
assert.equal(T.contextual(482,T.lines[482].chat).length,2);assert(T.contextual(482,T.lines[482].chat).every(x=>!x[1].includes('Uxie')));
allies=[{dex:480,dead:false,spawning:false}];assert.equal(sel('Uxie, stay close.').length,1);assert.equal(sel('Mesprit, stay close.').length,0);assert.equal(sel('Keep up, you two!').length,0);assert(T.contextual(482,T.lines[482].chat).every(x=>x[1].includes('Uxie')&&!x[1].includes('Mesprit')));
allies.push({dex:481,dead:false,spawning:true});assert.equal(sel('My sisters, together!').length,0);allies[1].spawning=false;assert.equal(sel('My sisters, together!').length,1);allies[0].dead=true;assert.equal(sel('My sisters, together!').length,0);assert(T.contextual(482,T.lines[482].chat).every(x=>x[1].includes('Mesprit')&&!x[1].includes('Uxie')));
assert(!T.partyAllows(482,'Uxie, stay close.'));console.log('PASS actual dialogue module: solo, each individual sister, both sisters, spawning exclusion, faint/despawn invalidation and queued-line gate.');

