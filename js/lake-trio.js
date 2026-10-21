/* Lake guardians: permanent companions, full inheritance, one shared Z-Move. */
(() => {
  'use strict';
  const E = window.PS_HOOPA_ENGINE;
  if (!E) throw new Error('Lake guardians require the game engine bridge.');
  const roles = {
    480: {name:'Uxie', color:'#ffe46b', side:1, hp:3, damage:.7,
      desc:'A permanent tank. Builds shared Defense and regeneration, and stuns and pushes back nearby foes.'},
    481: {name:'Mesprit', color:'#ff9dce', side:-1, hp:1.5, damage:1.1,
      desc:'A permanent balanced companion. Attacks, heals, shields and slows foes.'},
    482: {name:'Azelf', color:'#73c9ff', side:-1, hp:1, damage:2.5,
      desc:'A permanent high-damage attacker. Builds shared Attack and fires powerful psychic blasts.'}
  };
  const isTrio = p => !!roles[Number(p?.dex)] && !p.psLake;
  const idFor = dex => 'lake-summon-' + dex;
  const dexFor = def => Number(def?.lakeDex);
  const dist = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
  for (const [dex,role] of Object.entries(roles)) {
    const move = {id:idFor(dex), name:role.name, type:'psychic', kind:'summon',
      psCast:'lake-summon', lakeDex:Number(dex), cd:10, dmg:24, radius:320, count:1,
      maxLvl:6, desc:role.desc+' Inherits 100% of your stats, upgrades, held item and buffs. Cannot summon yourself.',
      ups:[{t:'Stronger companion skills',m:{dmg:1.3}},
        {t:'+25% psychic range',m:{radius:1.25}},
        {t:'Faster companion attacks',m:{cd:.8}},
        {t:'+50% damage',m:{dmg:1.5}},
        {t:'Mastered role skills',m:{dmg:1.5}}]};
    E.Moves.ALL.push(move); E.Moves.BY_ID[move.id]=move;
  }
  const poolFor=E.Moves.poolFor;
  E.Moves.poolFor=function(mon,...args) {
    const ids=poolFor.call(this,mon,...args).filter(id=>!id.startsWith('lake-summon-'));
    return isTrio(mon) ? [...new Set([...ids,...Object.keys(roles).filter(d=>Number(d)!==Number(mon.dex)).map(idFor)])] : ids;
  };
  let owner=null, units=[];
  function clear(){units.forEach(s=>s.dead=true);units=[];owner=null;}
  function summon(p,def,ghost) {
    const dex=dexFor(def);
    if(ghost||p!==E.Game.player||!isTrio(p)||p.dead||!roles[dex]||dex===Number(p.dex))return;
    if(owner!==p){clear();owner=p;}
    if(units.some(s=>s.dex===dex))return;
    const role=roles[dex], side=dex===481&&Number(p.dex)===480?1:role.side;
    const actor=new E.Player(E.DEX_BY[dex],{},p.shiny);
    const s={dex,role,side,caster:actor,owner:p,x:p.x+side*65,y:p.y+10,r:16,
      age:0,next:1,skill:2,hurtCd:0,dead:false,move:def,level:def.lvl||1,
      hp:p.maxHp*role.hp,maxHp:p.maxHp*role.hp,floating:true};
    actor.psLake=true;actor.psHoopa=true;
    actor.psLakeUnit=s;
    s.anim=actor.anim;
    // Shared references/getters avoid stale snapshots or multiplying buff decay.
    for(const key of ['buffs','powers','item','level','critChance','atkMul','atkPerm','spdMul','spdPerm',
      'cdMul','cdPerm','dmgReduce','regenFlat','regenPct','magnet','xpMul','coinMul',
      'baseAtk','baseSpd','atk','spd','cdK','reduction','regen','dmgDealt','kills','bosses','statsTaken']) {
      Object.defineProperty(actor,key,{configurable:true,get:()=>p[key],set:v=>{p[key]=v;}});
    }
    for(const key of ['x','y','r','dead','hp','maxHp'])Object.defineProperty(actor,key,{configurable:true,get:()=>s[key],set:v=>{s[key]=v;}});
    actor.addBuff=(...args)=>p.addBuff(...args);
    actor.onDealt=(...args)=>p.onDealt(...args);
    actor.heal=amount=>p.heal(amount);
    actor.hurt=(amount,type)=>s.hurt(amount,type);
    s.hurt=(amount,type)=>{
      if(s.dead||s.hurtCd>0||s.age<1||!(amount>0))return;
      const resist=E.Types.mult(type||'normal',['psychic']);
      s.hp-=Math.max(1,amount*resist*(1-(p.reduction||0))*(dex===480?.45:dex===481?.8:1));
      s.hurtCd=.5;if(s.hp<=0){s.dead=true;s.revive=10;}
    };
    s.applySlow=()=>{s.slowT=2;};s.applyStun=()=>{s.stunT=.5;};
    s.applyBurn=()=>s.hurt(s.maxHp*.03,'fire');s.applyPoison=()=>s.hurt(s.maxHp*.03,'poison');
    E.World.collide(s);units.push(s);E.Sprites.preload([dex],4000,p.shiny);
    E.FX.ring(s.x,s.y,4,38,role.color,.8,4);
  }
  const previousCast=window.PS_CAST;
  window.PS_CAST=function(p,def,hit,ghost){
    if(def?.psCast==='lake-summon')return summon(p,def,ghost);
    if(def?.psCast==='lake-attack')return resolveAttack(p.psLakeUnit,p.target,hit,ghost);
    return previousCast?.(p,def,hit,ghost);
  };
  function skill(s){
    const p=s.owner,l=s.level;
    if(s.dex===480){p.addBuff('def',.035+.005*l,7,Math.min(6,l+1));p.addBuff('regen',.5+.25*l,7,Math.min(6,l+1));}
    if(s.dex===481){p.addBuff('def',.025,6,3);p.heal(p.maxHp*(.015+.005*l));}
    if(s.dex===482)p.addBuff('atk',.05+.01*l,7,Math.min(6,l+1));
    E.FX.ring(s.x,s.y,12,90,s.role.color,.5,3);
  }
  function attack(s,target){
    s.caster.target=target;
    E.Combat.hoopaCast(s.caster,{...s.move,psCast:'lake-attack'});
  }
  function resolveAttack(s,target,hit,ghost){
    if(!s||!target||ghost)return;
    const radius=s.dex===480?140:s.dex===481?90:70;
    const center=s.dex===480?s:target;
    E.FX.ring(center.x,center.y,5,radius,s.role.color,.4,4);
    s.caster.aim=Math.atan2(target.y-s.y,target.x-s.x);s.caster.anim.play('Attack');
    for(const enemy of E.EnemyMgr.all())if(!enemy.dead&&dist(center,enemy)<radius+(enemy.r||0)){
      const damage=s.move.dmg*s.owner.atk*s.role.damage;
      // Native hit resolution includes STAB, crits, held items, weather,
      // abilities and the owner's damage/stat tracking.
      hit(s.caster,enemy,damage,s.role.color,enemy.x-s.x,enemy.y-s.y,s.dex===480?240:60,s.move);
      if(s.dex===480)enemy.applyStun?.(.6+.15*s.level);
      if(s.dex===481)enemy.applySlow?.(.4,2);
    }
  }
  function update(dt){
    const p=E.Game.player;
    if(owner!==p||p?.dead||!isTrio(p)){clear();return;}
    if(E.Game.state!=='playing')return;
    const enemies=E.EnemyMgr.all().filter(e=>!e.dead);
    for(const s of units){
      const learned=p.moves.find(m=>m.id===idFor(s.dex));
      if(!learned){s.removed=true;continue;}
      s.move=learned;s.level=learned.lvl||1;
      if(s.dead){s.revive-=dt;if(s.revive>0)continue;s.dead=false;s.age=0;s.hp=s.maxHp;s.x=p.x+s.side*65;s.y=p.y;}
      s.age+=dt;s.hurtCd=Math.max(0,s.hurtCd-dt);s.slowT=Math.max(0,(s.slowT||0)-dt);s.stunT=Math.max(0,(s.stunT||0)-dt);
      const hp=p.maxHp*s.role.hp;
      if(hp!==s.maxHp){s.hp=s.hp/s.maxHp*hp;s.maxHp=hp;}
      s.hp=Math.min(s.maxHp,s.hp+((p.regen||0)+(s.dex===480?s.maxHp*(.01+.002*s.level):0))*dt);
      let target=enemies.filter(e=>dist(p,e)<360).sort((a,b)=>dist(s,a)-dist(s,b))[0];
      const guard={x:p.x+s.side*75,y:p.y+Math.sin(s.age*.7)*24};
      let goal=guard;
      if(target&&dist(p,s)<220){
        const angle=Math.atan2(s.y-target.y,s.x-target.x),range=s.dex===480?65:150;
        goal={x:target.x+Math.cos(angle)*range,y:target.y+Math.sin(angle)*range};
      }
      if(dist(p,s)>500){s.x=guard.x;s.y=guard.y;}
      const d=dist(s,goal),speed=Math.max(80,p.spd||110)*(s.slowT>0?.5:1),step=s.stunT>0?0:Math.min(Math.max(0,d-12),speed*dt);
      if(step>0){
        const angle=Math.atan2(goal.y-s.y,goal.x-s.x);
        // Reuse the existing obstacle-aware summon pathfinding.
        if(window.PS_HOOPA?.navigate)window.PS_HOOPA.navigate(s,goal,step,dt,[]);
        else{s.x+=Math.cos(angle)*step;s.y+=Math.sin(angle)*step;}
        s.caster.anim.dir=E.Sprites.dirFromAngle(angle);
      }
      E.World.collide(s);s.caster.anim.loop(step>0?'Walk':'Idle');s.caster.anim.update(dt);
      s.skill-=dt;if(s.age>=1&&s.skill<=0&&!s.stunT){skill(s);s.skill=4;}
      s.next-=dt;
      if(s.age>=1&&target&&!s.stunT&&dist(s,target)<(s.dex===480?140:learned.radius)&&s.next<=0){attack(s,target);s.next=(s.dex===482?.7:1.5)*p.cdK/(1+.12*(s.level-1));}
    }
    units=units.filter(s=>!s.removed);
  }
  // Learned summon moves activate even without a target or an active attack slot.
  const tick=E.Combat.tick;
  E.Combat.tick=function(dt,p,...args){
    const moves=isTrio(p)?p.moves.filter(m=>m.psCast==='lake-summon'):[];
    const timers=moves.map(m=>m.t);moves.forEach(m=>m.t=Infinity);
    try{return tick.call(this,dt,p,...args);}
    finally{moves.forEach((m,i)=>{m.t=timers[i];if(E.Game.state==='playing')summon(p,m,false);});}
  };
  const enemyUpdate=E.EnemyMgr.update;
  E.EnemyMgr.update=function(dt,...args){update(dt);const result=enemyUpdate.call(this,dt,...args);
    if(E.Game.state==='playing')for(const s of units.filter(s=>!s.dead)){
      for(const e of E.EnemyMgr.all())if(!e.dead&&dist(s,e)<s.r+(e.r||12))s.hurt(e.dmg,e.atkType);
      const shots=E.Projectiles.all();for(let i=shots.length-1;i>=0;i--){const shot=shots[i];
        if(!shot.friendly&&!shot.ghost&&dist(s,shot)<s.r+(shot.r||4)){s.hurt(shot.pct?Math.max(shot.dmg,s.maxHp*shot.pct):shot.dmg,shot.mtype);shots.splice(i,1);}
      }
    }return result;
  };
  const enemyTick=E.Enemy.prototype.update;
  E.Enemy.prototype.update=function(dt,target,...args){
    if(owner===E.Game.player&&!owner?.dead){
      const tank=units.find(s=>s.dex===480&&!s.dead&&dist(this,s)<180);
      const near=units.filter(s=>!s.dead&&dist(this,s)<dist(this,target||owner));
      target=tank||near.sort((a,b)=>dist(this,a)-dist(this,b))[0]||target;
    }return enemyTick.call(this,dt,target,...args);
  };
  const draw=E.Ult.drawUnits;
  E.Ult.drawUnits=function(ctx){draw.call(this,ctx);if(owner!==E.Game.player||owner?.dead)return;
    for(const s of units){if(s.dead)continue;ctx.save();
      const t=Math.min(1,s.age),color=s.role.color;
      if(t<1){
        // A colored puddle rises into a water drop as the guardian takes shape.
        ctx.fillStyle=color;ctx.globalAlpha=1-t*.5;ctx.beginPath();ctx.ellipse(s.x,s.y,30*(1-t)+8,10,0,0,Math.PI*2);ctx.fill();
        ctx.beginPath();ctx.moveTo(s.x,s.y-60*t);ctx.bezierCurveTo(s.x-28,s.y-20*t,s.x-20,s.y+3,s.x,s.y+3);ctx.bezierCurveTo(s.x+20,s.y+3,s.x+28,s.y-20*t,s.x,s.y-60*t);ctx.fill();
      }
      ctx.globalAlpha=t;s.caster.anim.draw(ctx,s.x,s.y);ctx.globalAlpha=1;
      ctx.fillStyle='#20243b';ctx.fillRect(s.x-22,s.y-40,44,4);ctx.fillStyle=color;ctx.fillRect(s.x-22,s.y-40,44*Math.max(0,s.hp/s.maxHp),4);
      ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.fillText(s.role.name,s.x,s.y-46);ctx.restore();
    }
  };
  // The engine resolves its Z definition internally. Scope numeric changes to
  // each synchronous cast/update so other Psychic Pokémon keep normal damage.
  function tripleZ(p,fn){
    if(!isTrio(p))return fn();
    const def=E.Ult.defFor(p);if(!def)return fn();
    const old={};for(const key of ['dmg','dps'])if(typeof def[key]==='number'){old[key]=def[key];def[key]*=3;}
    try{return fn();}finally{Object.assign(def,old);}
  }
  const zCast=E.Ult.cast,zUpdate=E.Ult.update;
  E.Ult.cast=function(p,...args){const fired=tripleZ(p,()=>zCast.call(this,p,...args));
    if(fired&&isTrio(p)){p.ultCd*=2;p.ultCdMax*=2;}return fired;
  };
  E.Ult.update=function(p,...args){return tripleZ(p,()=>zUpdate.call(this,p,...args));};
  window.PS_LAKE_TRIO={roles,get summons(){return units.slice();}};
})();
