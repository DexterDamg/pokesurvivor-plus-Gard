const assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const {engine:E,context:C,vm}=require('./lake-runtime.cjs');
const noop=()=>{};let enemies=[],shots=[],damage=0;
E.Game={state:'playing',player:null,st:{time:0}};E.World.collide=noop;E.World.isFree=()=>true;
E.EnemyMgr.all=()=>enemies;E.EnemyMgr.update=noop;E.Projectiles.all=()=>shots;E.Sprites.preload=noop;
for(const k of ['ring','burst','dmgText'])E.FX[k]=noop;
E.Stats.dmg=noop;E.Camera.shake=noop;E.Audio.sfx=noop;E.Audio.ultLoop=()=>0;E.Ult.drawUnits=noop;E.Combat.tick=noop;
for(const name of ['hoopa.js','lake-trio.js'])vm.runInContext(require('./module.cjs')(name),C);
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
