/* Shared permissions and removal of the legacy ultimate combat path. */
(() => {
 const E=()=>window.PS_HOOPA_ENGINE;
 window.PS_SPEAKER_ALLOWED=(dex,obj)=>{
  const n=E(),p=n?.Game?.player;if(!p)return false;
  if(obj)return obj===p||!!obj.boss||!!obj.psLake||!!obj.psHoopa||!!obj.__dialogueSummon;
  if(Number(p.dex)===Number(dex))return true;
  if(window.PS_LAKE?._ally?.(Number(dex)))return true;
  return (n.EnemyMgr?.all?.()||[]).some(e=>e&&!e.dead&&e.boss&&Number(e.dex)===Number(dex));
 };
 function install(){const n=E();if(!n?.Ult)return false;
  // Preserve world drawing hooks: companion rendering is also attached to Ult.
  for(const key of ['cast','update','ghostTick'])n.Ult[key]=()=>false;
  window.PS_ZCAST=()=>false;
  return true;
 }
 addEventListener("DOMContentLoaded",install,{once:true});
 addEventListener("DOMContentLoaded",install,{once:true});
 if(!install()){const retry=setInterval(()=>{if(install())clearInterval(retry);},100);}
 let p0=null,waterAt=0; const greeted=new WeakSet();
 setInterval(()=>{
  const n=E(),p=n?.Game?.player;if(!p||n.Game.state!=='playing')return;
  if(p!==p0){p0=p;waterAt=0;}
  for(const summon of window.PS_HOOPA?.summons||[]){
   if(greeted.has(summon)||summon.dead)continue; greeted.add(summon);summon.__dialogueSummon=true;
   const l=window.PS_VOICE?.line(summon,'p_start');if(l?.[1])window.PS_LAKE_TALK?.line(Number(summon.dex),...l,{obj:summon,kind:'ally',name:summon.name});
  }
  if(Number(p.dex)!==383||performance.now()-waterAt<25000)return;
  const region=window.PS_TERRAIN_REGION?.(p.x,p.y)||'';
  const water=/beach|ocean|lake|sea|coast/i.test(region)||(n.EnemyMgr?.all?.()||[]).some(e=>!e.dead&&(e.types||[]).includes('water')&&(e.x-p.x)**2+(e.y-p.y)**2<220**2);
  if(water){const l=window.PS_VOICE.line(p,'water');if(window.PS_LAKE_TALK?.line(383,...l,{obj:p,kind:'player',name:'Groudon',prio:true}))waterAt=performance.now();}
 },1000);
})();
