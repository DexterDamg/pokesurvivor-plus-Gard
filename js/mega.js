/* PokéSurvivor+ Mega V7 visual transformation test battle bridge. No Firebase writes. */
(()=>{
'use strict';
const KEY='ps.mega.v5.unlocks';
let unlock={bracelet:false,stone:false};
try {unlock={...unlock,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
let playerSeen=null,used=false,boost=null;
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(unlock));}catch(_){}};
const el=(tag,label)=>{const e=document.createElement(tag);if(label)e.textContent=label;return e;};
function boot(){
 if(document.getElementById('ps-mega-v7'))return;
 const root=el('aside');root.id='ps-mega-v7';root.style.cssText='pointer-events:auto;position:fixed;right:12px;bottom:12px;z-index:2147483000;background:#201632;color:white;border:2px solid #b991ff;padding:12px;width:290px;max-width:calc(100vw - 24px);border-radius:12px;font:13px/1.5 system-ui,sans-serif;box-shadow:0 5px 20px #000a';
 const title=el('strong','✦ MEGA LUCARIO V7');title.style.cssText='display:block;color:#e6d4ff;font-size:16px';
 const info=el('div');info.style.cssText='white-space:pre-line;margin:9px 0';
 const feedback=el('div');feedback.style.cssText='font-size:12px;color:#e1ccff';
 const btn=(txt,fn)=>{const b=el('button',txt);b.type='button';b.style.cssText='background:#8654d3;color:white;border:0;border-radius:6px;padding:7px;margin:3px;cursor:pointer';b.addEventListener('click',e=>{e.stopPropagation();fn();});return b;};
 const bracelet=btn('Unlock Bracelet',()=>{unlock.bracelet=true;save();update();});
 const stone=btn('Get Lucarionite',()=>{unlock.stone=true;save();update();});
 const mega=btn('✦ Mega Evolve',activate);
 const reason=el('div');reason.style.cssText='color:#ffcfa8;font-size:12px;padding:4px 0';
 const hide=btn('Hide panel',()=>root.style.display='none');
 const reopen=el('button','✦ Mega');reopen.type='button';reopen.setAttribute('aria-label','Show Mega panel');reopen.style.cssText='position:fixed;right:10px;bottom:10px;z-index:2147482999;border:2px solid #c8a8ff;border-radius:999px;background:#201632;color:white;padding:9px 14px;cursor:pointer;font:bold 13px system-ui,sans-serif';reopen.addEventListener('click',e=>{e.stopPropagation();root.style.display='block';});document.body.append(reopen);
 const megaStatus=el('div');megaStatus.setAttribute('role','status');megaStatus.style.cssText='display:none;position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:2147482999;background:linear-gradient(100deg,#3b2364,#8055b8);border:2px solid #dec9ff;border-radius:999px;color:white;padding:7px 16px;font:bold 14px system-ui,sans-serif;box-shadow:0 3px 14px #0009;pointer-events:none';megaStatus.textContent='✦ MEGA LUCARIO ACTIVE';document.body.append(megaStatus);
 function flash(){if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;const overlay=el('div');overlay.style.cssText='position:fixed;inset:0;z-index:2147482900;background:radial-gradient(circle,#ffffffaa 0%,#a86eff77 28%,#36134800 70%);pointer-events:none;opacity:1;transition:opacity 0.9s ease-out';document.body.append(overlay);requestAnimationFrame(()=>{overlay.style.opacity='0';});setTimeout(()=>overlay.remove(),1050);} 
 const bridge=()=>window.PS_MEGA_BRIDGE_V5;
 function current(){const game=bridge()?.game;return game?.state==='playing'?game.player:null;}
 function restore(){if(playerSeen&&boost){if(Number.isFinite(boost.atk))playerSeen.baseAtk=boost.atk;if(Number.isFinite(boost.spd))playerSeen.baseSpd=boost.spd;if(Number.isFinite(boost.hp))playerSeen.maxHp=boost.hp;playerSeen.hp=Math.min(playerSeen.hp,playerSeen.maxHp);}boost=null;}
 function update(){
  const b=bridge(),p=current();
  if(playerSeen!==p){restore();playerSeen=p;used=false;}
  megaStatus.style.display=boost&&p&&p===playerSeen?'block':'none';
  const isLucario=p&&Number(p.dex)===448;
  const available=!!(b&&isLucario&&unlock.bracelet&&unlock.stone&&!used);
  reason.textContent=!b?'Game bridge not connected. Restore the V5 bridge app.min.js.':!p?'Start a run as Lucario to use Mega Evolution.':!isLucario?'Current Pokémon is not Lucario (#448).':!unlock.bracelet?'Unlock the Mega Bracelet first.':!unlock.stone?'Get Lucarionite first.':used?'Mega Evolution already used this run. Start a new run to use it again.':'Ready to Mega Evolve!';
  info.textContent=`Bridge: ${b?'connected':'not connected'}\nRun: ${p?'active':'not active'}\nPokémon: ${p?`${p.dex} ${isLucario?'(Lucario)':''}`:'none'}\nBracelet: ${unlock.bracelet?'yes':'no'} · Lucarionite: ${unlock.stone?'yes':'no'}\nMega: ${boost?'ACTIVE':used?'used':'inactive'}`;
  mega.disabled=false;mega.style.opacity=available?'1':'.7';
 }
 function activate(){
  update();const p=current();
  if(!p||Number(p.dex)!==448||used||!unlock.bracelet||!unlock.stone){feedback.textContent=reason.textContent;return;}
  if(![p.baseAtk,p.baseSpd,p.maxHp,p.hp].every(Number.isFinite)){feedback.textContent='Unrecognized game stats — refused to modify.';return;}
  boost={atk:p.baseAtk,spd:p.baseSpd,hp:p.maxHp};
  p.baseAtk*=1.5;p.baseSpd*=1.2;
  const extra=Math.round(p.maxHp*.2);p.maxHp+=extra;p.hp=Math.min(p.maxHp,p.hp+extra);
  used=true;feedback.textContent='Mega Lucario ACTIVE: temporary stat boosts and visual effect. Actual Pokémon sprite unchanged.';flash();update();
 }
 root.addEventListener('pointerdown',e=>e.stopPropagation());root.append(title,info,bracelet,stone,mega,reason,hide,feedback);document.body.append(root);update();setInterval(()=>{if(root.isConnected)update();},500);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
