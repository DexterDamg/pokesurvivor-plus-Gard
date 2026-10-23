/* Central spawn budget, viewport bounds and level-based ecology. */
(() => {
 'use strict';
 const E=()=>window.PS_HOOPA_ENGINE,B=()=>window.PS_MEGA_BRIDGE_V5;
 const cfg={startCap:16,maxCap:40,levelsPerSlot:3,bossReserve:2,edgeInset:24,despawnMargin:96};
 let installed=false,requirements=null,poolCache=null;
 const level=()=>Math.max(1,Number(E()?.Game?.player?.level)||1);
 const cap=()=>Math.min(cfg.maxCap,cfg.startCap+Math.floor((level()-1)/cfg.levelsPerSlot));
 const authority=()=>!E()?.Coop?.active||!!E().Coop.isHost;
 function required(dex){
  const n=E(); if(!requirements){
   requirements=new Map(); const incoming=new Map();
   for(const [from,list] of Object.entries(n.EVOS||{}))for(const [to,at] of list||[]){
    const v=Number(at); if(!Number.isFinite(v))continue;
    const old=incoming.get(Number(to));const edge={from:Number(from),at:Math.max(1,v)};
    if(!old||edge.at<old.at)incoming.set(Number(to),edge);
   }
   function walk(d,seen=new Set()){
    if(requirements.has(d))return requirements.get(d);if(seen.has(d))return 1;seen.add(d);
    const m=n.DEX_BY[d]||{},edge=incoming.get(d);
    let r=edge?Math.max(edge.at,walk(edge.from,seen)+1):Math.max(1,Math.ceil(((Number(m.bst)||300)-340)/7));
    if(m.leg||Number(m.rarity)>=6)r=Math.max(r,60);
    requirements.set(d,r);return r;
   }
   for(const m of n.DEX||[])walk(Number(m.dex));
  }
  return requirements.get(Number(dex))??60;
 }
 const allowed=d=>required(d)<=level();
 const scriptedBoss=e=>!!(e.boss&&(e.legend||E().DEX_BY[e.dex]?.leg||Number(E().DEX_BY[e.dex]?.rarity)>=6));
 function pool(){
  const n=E(),lv=level();if(poolCache?.level===lv)return poolCache.list;
  const list=[];
  for(const d of n.DEX||[]){
   if(!n.SPRITE_META[d.dex]||d.leg||d.rarity>=6||!allowed(d.dex))continue;
   const req=required(d.dex),age=lv-req;
   const weight=Math.max(1,8-Math.floor(age/5));
   // Rookies stay available, but new evolutions gain a greater share of encounters.
   const power=Math.min(1.8,Math.max(.75,(Number(d.bst)||300)/320));
   const def={dex:d.dex,name:d.name,behavior:lv<12?'chase':(d.types||[]).includes('psychic')&&lv>=20?'ranged':'chase',hp:Math.round(14*power),spd:Math.min(90,48+(Number(d.spd)||50)*.15),dmg:Math.round(5*power),xp:Math.max(3,Math.round(4*power))};
   if(def.behavior==='ranged')Object.assign(def,{shotCd:2.8,shotDmg:def.dmg,range:220});
   for(let i=0;i<weight;i++)list.push(def);
  }
  poolCache={level:lv,list};return list;
 }
 function replacement(def){
  if(allowed(def.dex))return def;
  // Step an evolved encounter down its own line before falling back to the current ecology.
  let dex=Number(def.dex);const seen=new Set();
  while(!allowed(dex)&&!seen.has(dex)){
   seen.add(dex);let parent=0;
   for(const [from,list]of Object.entries(E().EVOS||{}))if(list.some(x=>Number(x[0])===dex)){parent=Number(from);break;}
   if(!parent)break;dex=parent;
  }
  const choices=pool();const selected=allowed(dex)?choices.find(d=>d.dex===dex):null;
  return selected||choices[Math.floor(Math.random()*choices.length)]||def;
 }
 function bounds(){
  const c=B()?.camera||E()?.Camera,p=E()?.Game?.player;
  if(!c||!p)return null;
  const w=Number(c.w)||Number(c._cw)/Number(c.scale),h=Number(c.h)||Number(c._ch)/Number(c.scale);
  if(!(w>0&&h>0))return null;
  return {left:c.left(),top:c.top(),w,h};
 }
 function within(e,b,margin=0){return e.x>=b.left-margin&&e.x<=b.left+b.w+margin&&e.y>=b.top-margin&&e.y<=b.top+b.h+margin;}
 function edgeSpot(b){
  const p=E().Game.player,W=B()?.world||E().World,inset=cfg.edgeInset;
  for(let i=0;i<24;i++){
   const side=Math.floor(Math.random()*4),u=.1+Math.random()*.8;
   const x=side<2?b.left+(side===0?inset:b.w-inset):b.left+b.w*u;
   const y=side>=2?b.top+(side===2?inset:b.h-inset):b.top+b.h*u;
   if((x-p.x)**2+(y-p.y)**2<140**2)continue;
   if(W?.isFree&&!W.isFree(x,y,18))continue;
   return {x,y};
  }return null;
 }
 function retire(e){
  // Remove without damage, KO, XP, loot, recruitment, or evolution callbacks.
  E().EnemyMgr.removeRemote(e.id,false);e.__psCulled=true;e.dead=true;e.hp=0;
  if(E().Coop?.active&&E().Coop.isHost)E().Coop.enemyGone?.(e,false);
 }
 function sweep(){
  if(!authority())return;
  const n=E(),b=bounds(),alive=n.EnemyMgr.all().filter(e=>e&&!e.dead);
  let count=alive.length;
  for(const e of alive){
   if(e.boss||e.remote||e.dummy)continue;
   if(count>Math.max(0,cap()-cfg.bossReserve)||(b&&!within(e,b,cfg.despawnMargin))){retire(e);count--;}
  }
 }
 function install(){
  const n=E();if(installed||!n?.EnemyMgr||!n?.Enemy)return;installed=true;
  const nativeEnemy=n.Enemy;
  n.Enemy=new Proxy(nativeEnemy,{construct(target,args){
   if(authority()&&args[0]&&(!args[4]||!scriptedBoss({boss:true,dex:args[0].dex}))){const d=replacement(args[0]);args[0]=args[4]?Object.assign({},args[0],{dex:d.dex,name:d.name}):d;}
   return Reflect.construct(target,args,target);
  }});
  const add=n.EnemyMgr.add;
  n.EnemyMgr.add=function(e){
   if(!authority()||e.remote||e.dummy)return add.call(this,e);
   const count=n.EnemyMgr.all().reduce((v,x)=>v+!!(x&&!x.dead),0);
   if(!e.boss&&count>=cap()-cfg.bossReserve){e.dead=true;e.hp=0;e.__psCulled=true;return e;}
   if(e.boss&&count>=cap()){const other=n.EnemyMgr.all().find(x=>x&&!x.dead&&!x.boss&&!x.remote);if(other)retire(other);else{e.dead=true;e.hp=0;e.__psCulled=true;return e;}}
   if(!scriptedBoss(e)&&!allowed(e.dex)){
    const def=replacement(e.def||{dex:e.dex});
    const adjusted=e.boss?Object.assign({},e.def,{dex:def.dex,name:def.name}):def;
    e=new nativeEnemy(adjusted,e.x,e.y,{hp:1+(level()-1)*.10,dmg:1+(level()-1)*.035,spd:1+Math.min(.25,(level()-1)*.004)},!!e.boss);
   }
   const b=bounds();if(b&&!within(e,b,-cfg.edgeInset)&&(!e.boss||!n.Rift?.inArena)){
    const spot=edgeSpot(b);if(spot)Object.assign(e,spot);else if(!e.boss){e.dead=true;e.hp=0;e.__psCulled=true;return e;}
   }
   return add.call(this,e);
  };
  const bag=n.Enemies.bagAt;n.Enemies.bagAt=function(...args){if(!authority())return bag.apply(this,args);const p=pool();return p.length?p:bag.apply(this,args);};
  n.Enemies.scale=()=>({hp:1+(level()-1)*.10,dmg:1+(level()-1)*.035,spd:1+Math.min(.25,(level()-1)*.004)});
  // The native spawner also tries to recycle distant stragglers. Use the same visible edge bounds.
  const ahead=n.Spawner.ahead;n.Spawner.ahead=function(e,...args){if(!authority())return ahead.call(this,e,...args);const b=bounds(),spot=b&&edgeSpot(b);if(!spot)return false;Object.assign(e,spot);return true;};
  const update=n.EnemyMgr.update;n.EnemyMgr.update=function(...args){sweep();return update.apply(this,args);};
 }
 window.PS_ENCOUNTERS={cfg,required,allowed,pool,cap,bounds,sweep,install};
 if(document.readyState==='loading')addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
