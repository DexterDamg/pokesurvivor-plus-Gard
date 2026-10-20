/* PokéSurvivor+ Mega prototype V4: isolated UI/state test.
   Does not access obfuscated game internals, change combat, or write Firebase.
   Remove its script tag to uninstall. */
(() => {
 'use strict';
 const KEY='ps.mega.v4.demo';
 const byId=id=>document.getElementById(id);
 function run(){
   if(byId('ps-mega-v4')) return;
   const pane=document.createElement('aside');pane.id='ps-mega-v4';
   pane.style.cssText='position:fixed;right:12px;bottom:12px;z-index:2147483600;width:min(310px,calc(100vw - 24px));padding:14px;box-sizing:border-box;background:#201632;color:#fff;border:2px solid #b991ff;border-radius:12px;font:14px/1.45 system-ui,sans-serif;box-shadow:0 6px 24px #0009;';
   const title=document.createElement('div');title.textContent='✦ MEGA PROTOTYPE V4';title.style.cssText='font-weight:800;color:#e5d5ff;margin-bottom:6px';
   const info=document.createElement('div');info.textContent='Isolated test: Mega Bracelet, Lucarionite, and transformation UI. No battle stat or sprite changes yet.';info.style.cssText='font-size:12px;margin-bottom:10px';
   const state=document.createElement('div');state.style.cssText='font-size:12px;white-space:pre-line;margin-bottom:8px';
   const label=document.createElement('label');label.textContent='Pokémon selected for this test: ';label.style.cssText='display:block;margin:8px 0';
   const pick=document.createElement('select');pick.style.cssText='background:#322247;color:white;border:1px solid #b991ff;border-radius:5px;padding:6px;width:100%;margin-top:4px';
   for (const [v,t] of [['none','Not selected'],['448','Lucario (#448)'],['other','Other Pokémon']]){const o=document.createElement('option');o.value=v;o.textContent=t;pick.appendChild(o);}label.appendChild(pick);
   const mkButton=(name)=>{const b=document.createElement('button');b.type='button';b.textContent=name;b.style.cssText='border:0;border-radius:7px;padding:8px;background:#8654d3;color:#fff;cursor:pointer;font-weight:700;margin:3px';return b;};
   const bracelet=mkButton('Unlock Bracelet');const stone=mkButton('Give Lucarionite');const mega=mkButton('✦ Mega Evolve');const reset=mkButton('Reset Test');
   const notice=document.createElement('div');notice.style.cssText='font-size:12px;color:#e5d5ff;margin-top:8px';
   const close=mkButton('×');close.setAttribute('aria-label','Close panel');close.style.cssText='position:absolute;right:6px;top:4px;border:0;background:none;color:white;font-size:24px;cursor:pointer;';
   let data={bracelet:false,stone:false,mega:false,selected:'none'};
   try{const d=JSON.parse(localStorage.getItem(KEY)||'null');if(d&&typeof d==='object')data={...data,...d,mega:false};}catch(_){}
   pick.value=['none','448','other'].includes(data.selected)?data.selected:'none';
   function save(){try{localStorage.setItem(KEY,JSON.stringify(data));}catch(_){}}
   function show(){
     state.textContent=`Mega Bracelet: ${data.bracelet?'UNLOCKED':'locked'}\nLucarionite: ${data.stone?'OWNED':'not owned'}\nTest Pokémon: ${data.selected==='448'?'Lucario':data.selected==='other'?'Other':'none'}\nMega status: ${data.mega?'MEGA LUCARIO ✦':'inactive'}`;
     mega.disabled=!data.bracelet||!data.stone||data.selected!=='448'||data.mega;mega.style.opacity=mega.disabled?'.45':'1';
     mega.textContent=data.mega?'✦ MEGA LUCARIO ACTIVE':'✦ Mega Evolve';
   }
   bracelet.onclick=()=>{data.bracelet=true;save();show();notice.textContent='Test Mega Bracelet unlocked (this browser only).';};
   stone.onclick=()=>{data.stone=true;save();show();notice.textContent='Test Lucarionite granted (this browser only).';};
   pick.onchange=()=>{data.selected=pick.value;data.mega=false;save();show();};
   mega.onclick=()=>{if(mega.disabled)return;data.mega=true;show();notice.textContent='Mega Lucario UI activated! This is a demonstration—not a gameplay transformation.';};
   reset.onclick=()=>{data={bracelet:false,stone:false,mega:false,selected:'none'};pick.value='none';save();show();notice.textContent='Test progress reset. Game save untouched.';};
   close.onclick=()=>pane.remove();
   pane.append(title,info,state,label,bracelet,stone,mega,reset,notice,close);document.body.appendChild(pane);show();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
})();
