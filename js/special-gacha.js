/* =====================================================================================================
   SPECIAL GACHA: catching is now the main way to get Pokemon. The Gacha only gives a few special Pokemon
   (and PokeCoins for duplicates):
     - Magearna: very rare (0.1% per pull)
     - Dratini, Beldum, Chansey, Audino, Meowth
     - every starter Pokemon (starters are never found in the wild, only here)
   Their whole evolution families never appear as wild Pokemon either.
   The game's own pull still runs (ticket costs, pity, stats); each result is then swapped for one from this pool.
   ===================================================================================================== */
(()=>{'use strict';
 const E=()=>window.PS_HOOPA_ENGINE,STORY=()=>!!(window.PS_STORY&&window.PS_STORY.on());   // [Gard] Story Mode only
 // Tuning knobs.
 const MAGEARNA={dex:801,chance:.001,rarity:5};
 const POOL=[   // [dex, rarity shown on the pull card]
   [147,3],[374,3],[113,3],[531,2],[52,2],
   [1,3],[4,3],[7,3],[152,3],[155,3],[158,3],[252,3],[255,3],[258,3],[387,3],[390,3],[393,3],[495,3],[498,3],[501,3],
   [650,3],[653,3],[656,3],[722,3],[725,3],[728,3],[810,3],[813,3],[816,3],[906,3],[909,3],[912,3],[54,2],[79,2]];
 // Evolution families of everything above: never spawned as wild Pokemon.
 const NOT_WILD=new Set([1,2,3,4,5,6,7,8,9,52,53,54,55,79,80,113,147,148,149,152,153,154,155,156,157,158,159,160,199,242,252,253,254,255,256,257,258,259,260,374,375,376,387,388,389,390,391,392,393,394,395,440,495,496,497,498,499,500,501,502,503,531,650,651,652,653,654,655,656,657,658,722,723,724,725,726,727,728,729,730,801,810,811,812,813,814,815,816,817,818,863,906,907,908,909,910,911,912,913,914]);
 window.PS_SPECIAL_GACHA={POOL,MAGEARNA,NOT_WILD};
 function roll(){if(Math.random()<MAGEARNA.chance)return [MAGEARNA.dex,MAGEARNA.rarity];return POOL[Math.floor(Math.random()*POOL.length)];}
 let hooked=false;
 function hook(){
   const X=E();if(hooked||!X?.Gacha?.pull||!X.Enemies?.bagAt)return;hooked=true;const G=X.Gacha;
   const pull=G.pull;
   G.pull=function(save){
     const res=pull.apply(this,arguments);if(!Array.isArray(res)||!save||!STORY())return res;   // [Gard] Original mode keeps the normal Gacha
     const refund=G.REFUND||{1:15,2:30,3:60,4:120,5:300};
     for(const r of res){
       // undo what the original pick gave...
       if(r.shiny){if(r.isNew&&save.shiny)delete save.shiny[r.dex];}
       if(r.isNew&&save.owned&&save.owned[r.dex]?.from!=='catch'&&save.owned[r.dex]?.from!=='starter')delete save.owned[r.dex];
       save.coins=(Number(save.coins)||0)-(Number(r.refund)||0);
       // ...and give one from the special pool instead (same shiny luck)
       const [dex,rarity]=roll();let isNew=false,coins=0;
       if(r.shiny){save.shiny=save.shiny||{};isNew=!save.shiny[dex];if(isNew)save.shiny[dex]={at:Date.now(),from:'gacha'};else coins=3*(refund[rarity]||30);if(!save.owned[dex])save.owned[dex]={at:Date.now(),from:'gacha'};}
       else{isNew=!save.owned[dex];if(isNew)save.owned[dex]={at:Date.now(),from:'gacha'};else coins=refund[rarity]||30;}
       save.coins+=coins;r.dex=dex;r.rarity=rarity;r.isNew=isNew;r.refund=coins;
     }
     return res;
   };
   // the banner preview shows the special Pokemon
   if(typeof G.featured==='function'){const feat=G.featured;G.featured=function(){return STORY()?[MAGEARNA.dex,147,374]:feat.apply(this,arguments);};}
   // wild Pokemon: never a starter or another Gacha-only Pokemon (all maps)
   const EN=X.Enemies,bag=EN.bagAt;
   EN.bagAt=function(){const r=bag.apply(this,arguments);if(!Array.isArray(r)||!STORY())return r;const f=r.filter(d=>!NOT_WILD.has(Number(d.dex)));return f.length?f:r;};
 }
 (function tick(){hook();if(!hooked)setTimeout(tick,200);})();
})();
