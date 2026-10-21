/* =====================================================================================================
   SMARTER WILD POKEMON: each wild Pokemon gets a personality when it appears.
     aggressive  chases you and attacks (the game's normal behaviour)
     sniper      ranged attackers that keep their distance and NEVER come close; they back away as you approach
     skittish    run away whenever you come near, then creep back
     passive     wander around and leave you alone until you hit them (then they turn aggressive)
     coward      (extra trait) at low HP stops attacking and flees
   Bosses are always aggressive. The game moves every enemy first; for the non-aggressive ones this file then
   replaces that step with its own movement, so they still collide with walls and keep their speed.
   ===================================================================================================== */
(()=>{'use strict';
 const E=()=>window.PS_HOOPA_ENGINE,B=()=>window.PS_MEGA_BRIDGE_V5;
 // Tuning knobs.
 const AI={
   mix:{skittish:.15,passive:.15},  // the rest are aggressive (ranged attackers become snipers instead)
   cowardChance:.30,cowardHp:.25,   // share of wild Pokemon that flee once below 25% HP
   sniperRange:260,skittishRange:170,passiveWander:.55
 };
 const RANGED=new Set(['ranged','fan','beamer','zoner']);
 const st=new WeakMap();
 function assign(e){
   let kind='aggressive';
   if(!e.boss&&!e.legend&&!e.__roamer&&!e.__maxRaid&&!e.__wave&&!e.__legendDen){if(RANGED.has(e.behavior))kind='sniper';else{const r=Math.random();kind=r<AI.mix.skittish?'skittish':r<AI.mix.skittish+AI.mix.passive?'passive':'aggressive';}}
   const s={kind,coward:!e.boss&&Math.random()<AI.cowardChance,x:e.x,y:e.y,hp:Number(e.hp)||0,wa:Math.random()*Math.PI*2,wt:0,flee:false};
   e.psAi=kind;st.set(e,s);return s;
 }
 function moveTo(e,s,vx,vy,dt){   // our own step at the Pokemon's speed (its slows from sizes / domains already applied by the game)
   const l=Math.hypot(vx,vy);let nx=s.x,ny=s.y;
   if(l>.01){const sp=(Number(e.spd)||60)*(Number(e.slowT)>0?.5:1)*(Number(e.stunT)>0?0:1);nx=s.x+vx/l*sp*dt;ny=s.y+vy/l*sp*dt;}
   e.x=nx;e.y=ny;try{E()?.World?.collide?.(e);}catch(_){}
   if(l>.01)try{if(e.anim)e.anim.dir=B().sprites.dirFromAngle(Math.atan2(vy,vx));}catch(_){}
 }
 let last=0;
 function frame(ts){
   requestAnimationFrame(frame);const dt=Math.min(.05,last?(ts-last)/1000:0);last=ts;
   const g=B()?.game,p=g?.player;if(!p||g.state!=='playing')return;
   for(const e of B().enemies.all()){
     if(!e||e.dead||e.remote||e.__psCatch)continue;let s=st.get(e)||assign(e);
     const hp=Number(e.hp)||0,wasHit=hp<s.hp-.01;s.hp=hp;
     if(wasHit&&s.kind==='passive')s.kind=e.psAi='aggressive';          // provoked
     if(s.coward&&!s.flee&&Number(e.maxHp)>0&&hp<Number(e.maxHp)*AI.cowardHp)s.flee=true;
     const dx=e.x-p.x,dy=e.y-p.y,d=Math.hypot(dx,dy)||1,jump=Math.hypot(e.x-s.x,e.y-s.y)>60;
     if(jump||s.kind==='aggressive'&&!s.flee){s.x=e.x;s.y=e.y;continue;}   // the game's own chase (or a teleport / knockback)
     if(s.flee){   // coward: no more attacks, run straight away
       e.shotCd=Math.max(Number(e.shotCd)||0,1);e.touchCd=Math.max(Number(e.touchCd)||0,.5);
       moveTo(e,s,dx/d+Math.sin(ts/400+s.wa)*.25,dy/d+Math.cos(ts/400+s.wa)*.25,dt*1.15);}
     else if(s.kind==='sniper'){   // keep at range: back off when you come closer, never walk in
       const want=AI.sniperRange;if(d<want-20)moveTo(e,s,dx/d,dy/d,dt);else if(d>want+140)moveTo(e,s,-dx/d,-dy/d,dt*.8);else moveTo(e,s,-dy/d,dx/d,dt*.35);   // strafe sideways
       e.touchCd=Math.max(Number(e.touchCd)||0,.2);}
     else if(s.kind==='skittish'){if(d<AI.skittishRange)moveTo(e,s,dx/d,dy/d,dt*1.1);else if(d>AI.skittishRange+180)moveTo(e,s,-dx/d,-dy/d,dt*.6);else moveTo(e,s,0,0,dt);}
     else if(s.kind==='passive'){s.wt-=dt;if(s.wt<=0){s.wt=1.2+Math.random()*2;s.wa+=(Math.random()-.5)*2.4;}
       if(d>700)moveTo(e,s,-dx/d,-dy/d,dt*.6);else moveTo(e,s,Math.cos(s.wa),Math.sin(s.wa),dt*AI.passiveWander);
       e.shotCd=Math.max(Number(e.shotCd)||0,.5);e.touchCd=Math.max(Number(e.touchCd)||0,.3);}
     s.x=e.x;s.y=e.y;
   }
 }
 requestAnimationFrame(frame);
 // a little sweat drop over fleeing cowards
 let hooked=false;
 (function hook(){const T=E()?.Training;if(!T||typeof T.drawables!=='function'){setTimeout(hook,300);return;}if(hooked)return;hooked=true;const orig=T.drawables;
   T.drawables=function(){const r=orig.apply(this,arguments),extra=[];for(const e of B()?.enemies?.all?.()||[]){const s=st.get(e);if(!s||!s.flee||e.dead)continue;
     extra.push({y:e.y+.1,draw(g){const h=Number(e.bodyH)||24;g.save();g.fillStyle='#8fd3ff';g.strokeStyle='#1d4a7a';g.lineWidth=1;g.beginPath();const x=e.x+10,y=e.y-h-4;g.moveTo(x,y-6);g.quadraticCurveTo(x+4,y,x,y+3);g.quadraticCurveTo(x-4,y,x,y-6);g.fill();g.stroke();g.restore();}});}
     return extra.length?[...(r||[]),...extra]:r;};})();
 window.PS_ENEMY_AI={AI,stateOf:e=>st.get(e)};
})();
