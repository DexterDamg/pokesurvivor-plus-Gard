/* Optional Dexter BW2 theme; summon rules remain owned by special-gacha.js. */
(()=>{'use strict';
 const init=()=>{const scr=document.getElementById('scr-gacha');if(!scr)return;
 const link=document.createElement('link');link.rel='stylesheet';link.href='css/gacha-bw2.css';document.head.append(link);
 const button=document.createElement('button');button.className='btn small';button.type='button';
 let enabled=false;try{enabled=localStorage.getItem('ps_merged_bw2')==='1';}catch(_){}
 const apply=()=>{scr.classList.toggle('ps-bw2',enabled);button.textContent=enabled?'Style: BW2':'Style: Special';};
 button.onclick=()=>{enabled=!enabled;try{localStorage.setItem('ps_merged_bw2',enabled?'1':'0');}catch(_){}apply();};
 scr.querySelector('.row.between').append(button);apply();};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();})();
