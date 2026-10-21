const assert=require('node:assert/strict'),fs=require('fs');
const {engine:E,context:C,vm}=require('./lake-runtime.cjs');
const noop=()=>{};
let enemies=[],shots=[],damage=0,stuns=0,slows=0;
E.Game={state:'playing',player:null};E.World.collide=noop;
E.EnemyMgr.all=()=>enemies;E.EnemyMgr.update=noop;
E.Projectiles.all=()=>shots;E.Sprites.preload=noop;
for(const k of ['ring','burst','dmgText'])E.FX[k]=noop;
E.Stats.dmg=noop;E.Camera.shake=noop;E.Audio.sfx=noop;E.Audio.ultLoop=()=>0;
E.Ult.drawUnits=noop;
// Keep the actual Player, Moves, type chart and Z-Move implementation.
E.Combat.tick=noop;
vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../js/hoopa.js'),'utf8'),C);
vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../js/lake-trio.js'),'utf8'),C);
const summonIds=p=>E.Moves.poolFor(p.mon).filter(id=>id.startsWith('lake-summon-'));
for(const dex of [480,481,482]){
 const p=new E.Player(E.DEX_BY[dex],{},false);E.Game.player=p;
 const ids=summonIds(p);assert.equal(ids.length,2);assert(!ids.includes('lake-summon-'+dex));
 p.moves=ids.map(id=>E.Moves.instance(id,1));p.level=10;
 E.Combat.tick(.1,p);assert.equal(C.PS_LAKE_TRIO.summons.length,2);
 E.Combat.tick(.1,p);assert.equal(C.PS_LAKE_TRIO.summons.length,2);
 C.PS_CAST(p,{psCast:'lake-summon',lakeDex:dex});assert.equal(C.PS_LAKE_TRIO.summons.length,2);
 const units=C.PS_LAKE_TRIO.summons;
 for(const s of units){assert.equal(s.caster.buffs,p.buffs);assert.equal(s.caster.atk,p.atk);assert.equal(s.maxHp,p.maxHp*s.role.hp);}
 p.baseAtk*=2;p.addBuff('atk',.1,10,3);
 for(const s of units)assert.equal(s.caster.atk,p.atk);
 damage=0;stuns=0;slows=0;
 enemies=[{x:p.x+100,y:p.y,types:['normal'],r:12,dmg:5,hurt:n=>{damage+=n;},applyStun:()=>stuns++,applySlow:()=>slows++}];
 for(let i=0;i<80;i++)E.EnemyMgr.update(.5);
 assert.equal(C.PS_LAKE_TRIO.summons.length,2);assert(C.PS_LAKE_TRIO.summons.every(s=>s.age>30));
 assert(damage>0);if(dex!==480){assert(stuns>0);assert(p.buffs.def.n>0);assert(p.buffs.regen.n>0);}
 if(dex!==481)assert(slows>0);
 const def=E.Ult.defFor(p),base=def.dmg;let observed=0;
 C.PS_ZCAST=(actor,d)=>{observed=d.dmg;return true;};
 p.ultCd=0;p.ultT=0;assert.equal(E.Ult.cast(p),true);
 assert.equal(observed,base*3);assert.equal(def.dmg,base);
 assert.equal(p.ultCd,Math.max(10,90*p.cdK)*2);
 const s=units[0];s.age=2;s.hurtCd=0;s.hurt(s.maxHp*100,'normal');assert(s.dead);
 for(let i=0;i<22;i++)E.EnemyMgr.update(.5);assert(!s.dead);
 p.dead=true;E.EnemyMgr.update(.1);assert.equal(C.PS_LAKE_TRIO.summons.length,0);
}
const ordinary=new E.Player(E.DEX_BY[150],{},false);
assert.equal(summonIds(ordinary).length,0);
console.log('PASS: all 3 leaders, exclusive pools, self/duplicate guards, full inheritance, shared buffs, permanent lifetime, combat, revival, cleanup, and 3x/2x Z-Move.');

