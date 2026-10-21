// =====================================================================
//  CUSTOM MOVE EFFECTS (legendary signature moves + remade Mega moves)
//  Loaded before mega-native.js. Each style draws its own visuals on the overlay canvas and
//  deals damage through the GAME'S OWN hit function (type matchups, crits, weather, passives,
//  damage numbers and kill credit all still apply).
//
//  A move uses a style with  psCast:'<style>'  plus optional  fx:{...}  settings
//  (see js/legend-moves.js). The move's own dmg / count / radius / cd come from the game's
//  level-up upgrades, so these moves level up like any other move.
// =====================================================================
(function(){
 const B=()=>window.PS_MEGA_BRIDGE_V5;
 const live=[];                 // running effect instances
 const rnd=(a,b)=>a+Math.random()*(b-a);
 const TAU=Math.PI*2;
 function enemies(){const E=B()?.enemies;return E&&typeof E.all==='function'?E.all().filter(e=>e&&!e.dead&&typeof e.hurt==='function'):[];}
 function nearest(x,y,maxD,list){let best=null,bd=maxD*maxD;for(const e of list||enemies()){const d=(e.x-x)**2+(e.y-y)**2;if(d<bd){bd=d;best=e;}}return best;}
 function densest(p,range,avoid){
   const all=enemies(),near=all.filter(e=>Math.hypot(e.x-p.x,e.y-p.y)<range);let best=null,bs=-1;
   for(const c of near){if(avoid&&avoid.some(a=>Math.hypot(a.x-c.x,a.y-c.y)<120))continue;
     let s=0;for(const o of all)if(Math.hypot(o.x-c.x,o.y-c.y)<130)s++;s-=Math.hypot(c.x-p.x,c.y-p.y)/1000;if(s>bs){bs=s;best=c;}}
   return best;
 }
 function kick(v){try{B()?.camera?.kick?.(v);}catch(e){}}
 // damage every foe inside a circle (once per call). opts: mult, knock, stun{chance,dur}, slow, burn, poison, from{x,y}
 function hitCircle(c,x,y,r,opts={}){
   if(c.ghost||typeof c.hit!=='function')return 0;let n=0;
   const atk=Number(c.player.atk)||1,dmg=(Number(c.move.dmg)||10)*atk*(opts.mult||1)*(c.fx.mult||1);
   for(const e of enemies()){
     const dx=e.x-x,dy=e.y-y;if(dx*dx+dy*dy>(r+(e.r||10))**2)continue;
     if(opts.skip&&opts.skip.has(e))continue;opts.skip&&opts.skip.add(e);
     applyHit(c,e,dmg,opts,dx,dy);n++;
   }
   return n;
 }
 function applyHit(c,e,dmg,opts,dx,dy){
   try{c.hit(c.player,e,dmg,c.fx.color||'#fff',dx||0.01,dy||0,opts.knock==null?(c.move.knock||60):opts.knock,c.move);}catch(err){console.warn('fx hit',err);}
   const st=opts.stun||c.fx.stun;if(st&&Math.random()<st.chance&&typeof e.applyStun==='function')e.applyStun(st.dur||0.8);
   const sl=opts.slow||c.fx.slow;if(sl&&typeof e.applySlow==='function')e.applySlow(sl,1.4);
   if((opts.burn||c.fx.burn)&&typeof e.applyBurn==='function')e.applyBurn(1);
   if((opts.poison||c.fx.poison)&&typeof e.applyPoison==='function')e.applyPoison(1);
 }
 // distance from point to segment
 function segDist(px,py,ax,ay,bx,by){const vx=bx-ax,vy=by-ay,l=vx*vx+vy*vy||1;let t=((px-ax)*vx+(py-ay)*vy)/l;t=Math.max(0,Math.min(1,t));return Math.hypot(px-(ax+vx*t),py-(ay+vy*t));}
 function hitLine(c,ax,ay,bx,by,w,opts={}){
   if(c.ghost||typeof c.hit!=='function')return;const atk=Number(c.player.atk)||1,dmg=(Number(c.move.dmg)||10)*atk*(opts.mult||1)*(c.fx.mult||1);
   for(const e of enemies()){if(opts.skip&&opts.skip.has(e))continue;if(segDist(e.x,e.y,ax,ay,bx,by)>w/2+(e.r||10))continue;opts.skip&&opts.skip.add(e);
     const nx=bx-ax,ny=by-ay,l=Math.hypot(nx,ny)||1;applyHit(c,e,dmg,opts,nx/l,ny/l);}
 }
 function glow(ctx,x,y,r,c0,c1){const g=ctx.createRadialGradient(x,y,0,x,y,Math.max(1,r));g.addColorStop(0,c0);g.addColorStop(1,c1||'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,Math.max(1,r),0,TAU);ctx.fill();}
 function rgba(hex,a){const n=parseInt((hex||'#ffffff').slice(1),16);return 'rgba('+(n>>16)+','+(n>>8&255)+','+(n&255)+','+a+')';}
 const spikeImg=new Image();spikeImg.src='assets/fx/precipice-spikes.png?v=1';

 // ---------------------------------------------------------------- styles
 const S={};

 // BEAM: charge-up, then a huge beam toward the foes; damages everything in it every tick.
 S.beam={cast(c){const t=densest(c.player,(c.move.radius||480)+40)||nearest(c.player.x,c.player.y,700);if(!t)return null;
     c.ang=Math.atan2(t.y-c.player.y,t.x-c.player.x);c.len=(c.move.radius||480);c.w=c.fx.width||64;c.dur=c.fx.dur||1.1;c.charge=c.fx.charge||0.3;c.tickT=0;c.parts=[];return c;},
   update(c,dt){c.t+=dt;const p=c.player;if(c.fx.follow!==false){c.x=p.x;c.y=p.y-(p.bodyH||40)*0.45;}
     if(c.t<c.charge){if(c.parts.length<40)for(let i=0;i<3;i++){const a=rnd(0,TAU),r=rnd(40,90);c.parts.push({a,r});}for(const q of c.parts)q.r-=160*dt;c.parts=c.parts.filter(q=>q.r>3);return true;}
     if(!c.started){c.started=1;kick(0.08);}
     c.tickT-=dt;if(c.tickT<=0&&c.t<c.charge+c.dur){c.tickT=c.fx.tick||0.2;const bx=c.x+Math.cos(c.ang)*c.len,by=c.y+Math.sin(c.ang)*c.len;hitLine(c,c.x,c.y,bx,by,c.w,{knock:30});}
     return c.t<c.charge+c.dur+0.25;},
   draw(c,ctx,v){const X=v.sx(c.x),Y=v.sy(c.y),k=v.k,col=c.fx.colors||['#ffffff','#8fd3ff','#2a6cff'];
     if(c.t<c.charge){for(const q of c.parts){ctx.fillStyle=col[1];ctx.fillRect(X+Math.cos(q.a)*q.r*k,Y+Math.sin(q.a)*q.r*k,3,3);}glow(ctx,X,Y,(10+30*c.t/c.charge)*k,rgba(col[0],0.95),rgba(col[1],0));return;}
     const u=c.t-c.charge,fade=u>c.dur?Math.max(0,1-(u-c.dur)/0.25):Math.min(1,u/0.08),L=c.len*k,W=c.w*k*(0.85+0.15*Math.sin(u*40));
     ctx.save();ctx.translate(X,Y);ctx.rotate(c.ang);ctx.globalAlpha=fade;ctx.globalCompositeOperation='lighter';
     let g=ctx.createLinearGradient(0,-W,0,W);g.addColorStop(0,rgba(col[2],0));g.addColorStop(0.5,rgba(col[2],0.55));g.addColorStop(1,rgba(col[2],0));ctx.fillStyle=g;ctx.fillRect(0,-W,L,W*2);
     g=ctx.createLinearGradient(0,-W*0.5,0,W*0.5);g.addColorStop(0,rgba(col[1],0));g.addColorStop(0.5,rgba(col[1],0.9));g.addColorStop(1,rgba(col[1],0));ctx.fillStyle=g;ctx.fillRect(0,-W*0.5,L,W);
     ctx.fillStyle=rgba(col[0],0.95);ctx.fillRect(0,-W*0.14,L,W*0.28);
     // decoration travelling along the beam
     const deco=c.fx.deco;
     for(let i=0;i<6;i++){const d=((u*c.len*1.6+i*c.len/6)%c.len)*k;
       if(deco==='clock'){ctx.strokeStyle=rgba(col[0],0.8);ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(d,0,W*0.25,W*0.95,0,0,TAU);ctx.stroke();
         for(let j=0;j<12;j++){const a=j/12*TAU;ctx.beginPath();ctx.moveTo(d+Math.cos(a)*W*0.18,Math.sin(a)*W*0.8);ctx.lineTo(d+Math.cos(a)*W*0.25,Math.sin(a)*W*0.95);ctx.stroke();}}
       else if(deco==='feather'){ctx.fillStyle=rgba(col[0],0.7);ctx.beginPath();ctx.ellipse(d,Math.sin(u*9+i)*W*0.6,W*0.5,W*0.12,0.4,0,TAU);ctx.fill();}
       else if(deco==='rainbow'){ctx.strokeStyle='hsla('+((u*300+i*60)%360)+',100%,70%,0.8)';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(d,0,W*0.2,W*0.9,0,0,TAU);ctx.stroke();}
       else {ctx.strokeStyle=rgba(col[0],0.55);ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(d,0,W*0.18,W*0.8,0,0,TAU);ctx.stroke();}}
     glow(ctx,0,0,W*1.3,rgba(col[0],0.9),rgba(col[1],0));glow(ctx,L,0,W*1.1,rgba(col[0],0.8),rgba(col[2],0));
     ctx.restore();}};

 // RIFT: giant slashes tear space across the foes (optional starry 'space' gap)
 S.rift={cast(c){const t=densest(c.player,(c.move.radius||300)+60)||nearest(c.player.x,c.player.y,500);if(!t)return null;
     c.cx=t.x;c.cy=t.y;c.n=Math.max(1,Math.round(c.move.count||3));c.slashes=[];const base=rnd(0,Math.PI);
     for(let i=0;i<c.n;i++)c.slashes.push({a:base+i*Math.PI/c.n+rnd(-0.2,0.2),ox:rnd(-40,40),oy:rnd(-30,30),at:i*(c.fx.delay||0.11),done:false});
     c.len=c.fx.len||360;c.w=c.fx.width||46;return c;},
   update(c,dt){c.t+=dt;for(const s of c.slashes)if(!s.done&&c.t>=s.at){s.done=true;const x=c.cx+s.ox,y=c.cy+s.oy,dx=Math.cos(s.a)*c.len/2,dy=Math.sin(s.a)*c.len/2;hitLine(c,x-dx,y-dy,x+dx,y+dy,c.w,{knock:90});kick(0.05);}
     return c.t<c.slashes[c.slashes.length-1].at+0.75;},
   draw(c,ctx,v){const col=c.fx.colors||['#ffffff','#ff8ad8','#7a2cff'];
     for(const s of c.slashes){const u=c.t-s.at;if(u<0)continue;const grow=Math.min(1,u/0.07),fade=Math.max(0,1-Math.max(0,u-0.25)/0.5);
       const x=v.sx(c.cx+s.ox),y=v.sy(c.cy+s.oy),L=c.len*v.k*grow/2,W=c.w*v.k;
       ctx.save();ctx.translate(x,y);ctx.rotate(s.a);ctx.globalAlpha=fade;
       if(c.fx.space){ctx.fillStyle='rgba(8,0,24,0.85)';ctx.beginPath();ctx.ellipse(0,0,L,W*0.35*(1-0.5*Math.max(0,u-0.25)),0,0,TAU);ctx.fill();
         for(let j=0;j<10;j++){ctx.fillStyle='rgba(255,255,255,'+(0.5+0.5*Math.sin(u*20+j))+')';ctx.fillRect(Math.cos(j*1.7)*L*0.8,Math.sin(j*2.3)*W*0.18,2,2);}}
       ctx.globalCompositeOperation='lighter';
       let g=ctx.createLinearGradient(0,-W,0,W);g.addColorStop(0,rgba(col[2],0));g.addColorStop(0.5,rgba(col[2],0.6));g.addColorStop(1,rgba(col[2],0));
       ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(0,0,L*1.05,W,0,0,TAU);ctx.fill();
       ctx.fillStyle=rgba(col[1],0.9);ctx.beginPath();ctx.ellipse(0,0,L,W*0.22,0,0,TAU);ctx.fill();
       ctx.fillStyle=rgba(col[0],1);ctx.beginPath();ctx.ellipse(0,0,L*0.95,W*0.07+1,0,0,TAU);ctx.fill();
       ctx.restore();}}};

 // LANCES: strikes from the sky on many foes (light pillars, lightning bolts or falling stars)
 S.lances={cast(c){const n=Math.max(1,Math.round(c.move.count||6)),R=c.move.radius||280,p=c.player;
     const list=enemies().filter(e=>Math.hypot(e.x-p.x,e.y-p.y)<R+120).sort(()=>Math.random()-0.5);if(!list.length)return null;
     c.hits=[];for(let i=0;i<n;i++){const e=list[i%list.length];c.hits.push({x:e.x+(i>=list.length?rnd(-50,50):0),y:e.y+(i>=list.length?rnd(-40,40):0),at:(c.fx.delay||0)+i*(c.fx.gap||0.07),fall:c.fx.fall||0.4,done:false});}
     c.r=c.fx.r||58;return c;},
   update(c,dt){c.t+=dt;for(const h of c.hits)if(!h.done&&c.t>=h.at+h.fall){h.done=true;hitCircle(c,h.x,h.y,c.r,{knock:80});kick(0.03);}
     return c.t<c.hits[c.hits.length-1].at+c.hits[0].fall+0.6;},
   draw(c,ctx,v){const col=c.fx.colors||['#ffffff','#ffe27a','#ffb000'],style=c.fx.style||'light';
     for(const h of c.hits){const u=c.t-h.at;if(u<0)continue;const X=v.sx(h.x),Y=v.sy(h.y),R=c.r*v.k;
       if(u<h.fall){const q=u/h.fall;ctx.strokeStyle=rgba(col[1],0.35+0.5*q);ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(X,Y,R*q,R*q*0.45,0,0,TAU);ctx.stroke();
         if(style==='star'){const sy=Y-(1-q)*600*v.k;glow(ctx,X+(1-q)*200*v.k,sy,10*v.k,rgba(col[0],1),rgba(col[1],0));}continue;}
       const w=u-h.fall,fade=Math.max(0,1-w/0.55);ctx.save();ctx.globalAlpha=fade;ctx.globalCompositeOperation='lighter';
       if(style==='bolt'){ctx.strokeStyle=rgba(col[0],1);ctx.lineWidth=4;ctx.beginPath();let x=X+rnd(-20,20),y=Y-700*v.k;ctx.moveTo(x,y);while(y<Y){y+=rnd(30,60)*v.k;x+=rnd(-25,25)*v.k;ctx.lineTo(y>Y?X:x,Math.min(y,Y));}ctx.stroke();ctx.strokeStyle=rgba(col[1],0.6);ctx.lineWidth=10;ctx.stroke();}
       else {const g=ctx.createLinearGradient(X,Y-800*v.k,X,Y);g.addColorStop(0,rgba(col[1],0));g.addColorStop(1,rgba(col[0],0.95));ctx.fillStyle=g;const bw=(style==='star'?14:22)*v.k*(1-w/0.55*0.6);ctx.fillRect(X-bw/2,Y-800*v.k,bw,800*v.k);}
       glow(ctx,X,Y,R*1.3*(0.6+w),rgba(col[0],0.9),rgba(col[2],0));
       ctx.strokeStyle=rgba(col[1],0.9);ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(X,Y,R*(0.5+w*2),R*(0.5+w*2)*0.45,0,0,TAU);ctx.stroke();ctx.restore();}}};

 // VOID: a dark/space hole that pulls foes in, ticks, then collapses (optional sleep/stun)
 S.void={cast(c){const t=densest(c.player,360)||nearest(c.player.x,c.player.y,420);if(!t)return null;
     c.x=t.x;c.y=t.y;c.R=c.move.radius||170;c.pullT=c.fx.pull||1.0;c.life=c.pullT+0.5;c.tick=0;c.parts=[];c.seed=rnd(0,TAU);return c;},
   update(c,dt){c.t+=dt;const all=enemies();
     if(c.t<c.pullT){for(const e of all){const dx=c.x-e.x,dy=c.y-e.y,d=Math.hypot(dx,dy);if(d>c.R||d<6)continue;const pl=(140+240*(1-d/c.R))*(e.boss?0.3:1)*dt;e.x+=dx/d*Math.min(pl,d-6);e.y+=dy/d*Math.min(pl,d-6);}
       c.tick-=dt;if(c.tick<=0){c.tick=0.25;hitCircle(c,c.x,c.y,c.R*0.6,{mult:0.12,knock:0});}
       if(c.parts.length<60)for(let i=0;i<3;i++)c.parts.push({a:rnd(0,TAU),r:c.R*rnd(0.6,1.1)});}
     else if(!c.boom){c.boom=1;hitCircle(c,c.x,c.y,c.R*0.8,{mult:c.fx.blast||2.5,knock:150});kick(0.12);}
     for(const q of c.parts){q.a+=dt*(2+40/(q.r+10));q.r-=(80+c.R*0.6)*dt;}c.parts=c.parts.filter(q=>q.r>4);
     return c.t<c.life;},
   draw(c,ctx,v){const X=v.sx(c.x),Y=v.sy(c.y),R=c.R*v.k,col=c.fx.colors||['#000000','#7a3cff','#d7b4ff'];
     if(c.t<c.pullT){const grow=Math.min(1,c.t/0.25),core=(22+8*Math.sin(c.t*9))*v.k*grow;
       glow(ctx,X,Y,R*grow,rgba(col[1],0.35),rgba(col[1],0));
       ctx.lineWidth=Math.max(2,3*v.k);for(let j=0;j<5;j++){const a0=c.seed+c.t*(3+j*0.5)+j*1.26,rr=core*(1.6+j*0.35);ctx.strokeStyle=rgba(j%2?col[2]:col[1],0.85);ctx.beginPath();ctx.ellipse(X,Y,rr,rr*0.62,0,a0,a0+1.7);ctx.stroke();}
       if(c.fx.rings){ctx.strokeStyle=rgba(c.fx.rings,0.9);ctx.lineWidth=4;for(let j=0;j<3;j++){ctx.beginPath();ctx.ellipse(X,Y,core*(2.6+j*0.6),core*(1.0+j*0.25),c.t*(j%2?1:-1),0,TAU);ctx.stroke();}}
       for(const q of c.parts){ctx.fillStyle=col[2];ctx.fillRect(X+Math.cos(q.a)*q.r*v.k,Y+Math.sin(q.a)*q.r*v.k*0.62,2,2);}
       ctx.fillStyle=col[0];ctx.beginPath();ctx.arc(X,Y,core,0,TAU);ctx.fill();ctx.strokeStyle=rgba(col[2],0.9);ctx.lineWidth=2;ctx.beginPath();ctx.arc(X,Y,core+2,0,TAU);ctx.stroke();}
     else{const u=Math.min(1,(c.t-c.pullT)/0.5),rr=R*(0.2+0.9*u);ctx.globalAlpha=1-u;glow(ctx,X,Y,rr,'rgba(255,255,255,0.9)',rgba(col[1],0));ctx.strokeStyle=rgba(col[2],0.95);ctx.lineWidth=5*(1-u)+1;ctx.beginPath();ctx.arc(X,Y,rr,0,TAU);ctx.stroke();ctx.globalAlpha=1;}}};

 // SPIKES: rings of stone/ice/crystal spikes erupt outward (recolored with fx.hue)
 S.spikes={cast(c){c.x=c.player.x;c.y=c.player.y;c.waves=(c.move.count||12)>=20?4:3;c.next=0;c.sp=[];c.R=[62,128,194,260];return c;},
   update(c,dt){c.t+=dt;while(c.next<c.waves&&c.t>=c.next*0.13){const k=c.next++,R=c.R[k],n=Math.max(7,Math.round(TAU*R/66)),off=rnd(0,TAU);
       for(let j=0;j<n;j++){const a=off+j*TAU/n,x=c.x+Math.cos(a)*R,y=c.y+Math.sin(a)*R*0.8;if(Math.abs(x-c.x)<50&&y-c.y>-100&&y-c.y<28)continue;c.sp.push({x,y,v:(Math.random()*4)|0,t:-rnd(0,0.05),s:rnd(0.75,1.1)});}
       const skip=new Set();for(const e of enemies()){const d=Math.hypot(e.x-c.x,(e.y-c.y)/0.8);if(d>(k?R-36:0)&&d<R+36){skip.add(e);}}
       if(!c.ghost)for(const e of skip){applyHit(c,e,(Number(c.move.dmg)||10)*(Number(c.player.atk)||1)*(c.fx.mult||1),{knock:120},e.x-c.x,e.y-c.y);}kick(0.04);}
     for(const s of c.sp)s.t+=dt;return c.t<c.waves*0.13+0.7;},
   draw(c,ctx,v){if(!spikeImg.complete)return;ctx.save();ctx.imageSmoothingEnabled=false;if(c.fx.filter)ctx.filter=c.fx.filter;const px=1.05*v.k;
     for(const s of c.sp.slice().sort((a,b)=>a.y-b.y)){if(s.t<0)continue;const f=Math.max(0,Math.min(1,s.t/0.09)-Math.max(0,(s.t-0.44)/0.18));const w=32*px*s.s,h=56*px*s.s,gx=v.sx(s.x),gy=v.sy(s.y)+3*px;
       ctx.globalAlpha=Math.max(0,1-s.t/0.62);ctx.drawImage(spikeImg,s.v*32,56,32,16,gx-w/2,gy-8*px,w,16*px*s.s);ctx.globalAlpha=1;
       ctx.save();ctx.beginPath();ctx.rect(gx-w,gy-h*1.1,w*2,h*1.1);ctx.clip();ctx.drawImage(spikeImg,s.v*32,0,32,56,gx-w/2,gy-h*f,w,h);ctx.restore();}
     ctx.restore();}};

 // SHOCK: expanding shockwave rings from the user (notes / moons / rainbow decoration)
 S.shock={cast(c){c.x=c.player.x;c.y=c.player.y;c.rings=Math.max(1,c.fx.rings||3);c.R=c.move.radius||260;c.speed=c.fx.speed||520;c.gap=c.fx.gap||0.16;c.skips=[];for(let i=0;i<c.rings;i++)c.skips.push(new Set());
     if(c.fx.heal){const p=c.player;p.hp=Math.min(p.maxHp,p.hp+p.maxHp*c.fx.heal);}kick(0.06);return c;},
   update(c,dt){c.t+=dt;if(c.fx.follow){c.x=c.player.x;c.y=c.player.y;}
     for(let i=0;i<c.rings;i++){const u=c.t-i*c.gap;if(u<0)continue;const r=Math.min(c.R,u*c.speed);if(u*c.speed>c.R+40)continue;
       if(!c.ghost)for(const e of enemies()){if(c.skips[i].has(e))continue;const d=Math.hypot(e.x-c.x,e.y-c.y);if(d<=r+(e.r||10)){c.skips[i].add(e);applyHit(c,e,(Number(c.move.dmg)||10)*(Number(c.player.atk)||1)*(c.fx.mult||1),{knock:70},e.x-c.x,e.y-c.y);}}}
     return c.t<(c.rings-1)*c.gap+c.R/c.speed+0.35;},
   draw(c,ctx,v){const col=c.fx.colors||['#ffffff','#c86bff','#6b2cff'],X=v.sx(c.x),Y=v.sy(c.y);
     for(let i=0;i<c.rings;i++){const u=c.t-i*c.gap;if(u<0)continue;const r=Math.min(c.R,u*c.speed)*v.k,fade=Math.max(0,1-u*c.speed/(c.R+60));
       ctx.save();ctx.globalAlpha=fade;ctx.globalCompositeOperation='lighter';
       ctx.strokeStyle=c.fx.deco==='rainbow'?'hsla('+((u*400+i*90)%360)+',100%,65%,0.9)':rgba(col[1],0.9);ctx.lineWidth=Math.max(3,10*v.k*fade);ctx.beginPath();ctx.ellipse(X,Y,r,r*0.62,0,0,TAU);ctx.stroke();
       ctx.strokeStyle=rgba(col[0],0.9);ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(X,Y,r*0.97,r*0.6,0,0,TAU);ctx.stroke();
       const sym=c.fx.deco==='notes'?'♪':c.fx.deco==='moon'?'☾':c.fx.deco==='stars'?'✦':null;
       if(sym){ctx.fillStyle=rgba(col[0],0.95);ctx.font='bold '+Math.round(14*v.k+6)+'px sans-serif';for(let j=0;j<8;j++){const a=j/8*TAU+u*1.5;ctx.fillText(sym,X+Math.cos(a)*r,Y+Math.sin(a)*r*0.62);}}
       ctx.restore();}
     glow(ctx,X,Y,40*v.k*Math.max(0,1-c.t*2),rgba(col[0],0.8),rgba(col[1],0));}};

 // COMET: a giant comet (or the user's own dive) crashes down on the biggest group of foes
 S.comet={cast(c){const n=Math.max(1,Math.min(4,Math.round(c.move.count||1)));c.list=[];const used=[];
     for(let i=0;i<n;i++){const t=densest(c.player,380,used)||nearest(c.player.x,c.player.y,460);if(!t)break;used.push(t);c.list.push({x:t.x+rnd(-15,15),y:t.y+rnd(-15,15),at:i*0.22,fall:c.fx.fall||0.6,done:false});}
     if(!c.list.length)return null;c.R=c.move.radius||150;return c;},
   update(c,dt){c.t+=dt;for(const m of c.list)if(!m.done&&c.t>=m.at+m.fall){m.done=true;hitCircle(c,m.x,m.y,c.R,{knock:170});kick(0.14);}
     return c.t<c.list[c.list.length-1].at+c.list[0].fall+0.8;},
   draw(c,ctx,v){const col=c.fx.colors||['#ffffff','#ff9ad8','#a040ff'];
     for(const m of c.list){const u=c.t-m.at;if(u<0)continue;const X=v.sx(m.x),Y=v.sy(m.y),R=c.R*v.k;
       if(u<m.fall){const q=u/m.fall,sx=X-(1-q)*420*v.k,sy=Y-(1-q)*620*v.k,size=(c.fx.size||26)*v.k;
         ctx.strokeStyle=rgba(col[1],0.3+0.5*q);ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(X,Y,R*q,R*q*0.5,0,0,TAU);ctx.stroke();
         ctx.save();ctx.globalCompositeOperation='lighter';for(let j=0;j<10;j++){const f=j/10;glow(ctx,sx-(X-sx)*0.12*j/(1-q+0.2)*0.1-(X-sx)*f*0.25,sy-(Y-sy)*f*0.25,size*(1-f*0.7),rgba(col[1],0.5*(1-f)),rgba(col[2],0));}
         glow(ctx,sx,sy,size*1.4,rgba(col[0],1),rgba(col[1],0));ctx.restore();continue;}
       const w=u-m.fall,fade=Math.max(0,1-w/0.8);ctx.save();ctx.globalAlpha=fade;
       ctx.fillStyle='rgba(20,10,10,'+(0.45*fade)+')';ctx.beginPath();ctx.ellipse(X,Y,R*0.8,R*0.4,0,0,TAU);ctx.fill();
       ctx.globalCompositeOperation='lighter';glow(ctx,X,Y,R*(0.6+w*1.4),rgba(col[0],0.95),rgba(col[2],0));
       ctx.strokeStyle=rgba(col[1],0.9);ctx.lineWidth=6*fade+1;ctx.beginPath();ctx.ellipse(X,Y,R*(0.4+w*2.2),R*(0.4+w*2.2)*0.5,0,0,TAU);ctx.stroke();ctx.restore();}}};

 // VORTEX: tornadoes that chase foes, pull them in and grind them down
 S.vortex={cast(c){const n=Math.max(1,Math.min(4,Math.round(c.move.count||2))),p=c.player;c.list=[];
     for(let i=0;i<n;i++){const a=i/n*TAU;c.list.push({x:p.x+Math.cos(a)*40,y:p.y+Math.sin(a)*30,tick:i*0.1,parts:[]});}
     c.life=c.fx.life||3;c.R=c.move.radius||90;return c;},
   update(c,dt){c.t+=dt;const all=enemies();
     for(const w of c.list){const t=nearest(w.x,w.y,600,all);if(t){const dx=t.x-w.x,dy=t.y-w.y,d=Math.hypot(dx,dy)||1;w.x+=dx/d*(c.fx.speed||130)*dt;w.y+=dy/d*(c.fx.speed||130)*dt;}
       for(const e of all){const dx=w.x-e.x,dy=w.y-e.y,d=Math.hypot(dx,dy);if(d>c.R*1.6||d<5)continue;const pl=120*(e.boss?0.3:1)*dt;e.x+=dx/d*Math.min(pl,d-5);e.y+=dy/d*Math.min(pl,d-5);}
       w.tick-=dt;if(w.tick<=0){w.tick=c.fx.tick||0.3;hitCircle(c,w.x,w.y,c.R,{knock:20});}
       if(w.parts.length<36)w.parts.push({a:rnd(0,TAU),h:0,r:rnd(0.3,1)});for(const q of w.parts){q.a+=dt*6;q.h+=dt*90;}w.parts=w.parts.filter(q=>q.h<120);}
     return c.t<c.life;},
   draw(c,ctx,v){const col=c.fx.colors||['#ffffff','#bff0d0','#5fcb6a'],fade=Math.min(1,(c.life-c.t)/0.3);
     for(const w of c.list){const X=v.sx(w.x),Y=v.sy(w.y),R=c.R*v.k;ctx.save();ctx.globalAlpha=fade*0.95;
       for(let j=0;j<7;j++){const h=j*16*v.k,rr=R*(0.35+j*0.1);ctx.strokeStyle=rgba(j%2?col[1]:col[2],0.75);ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(X+Math.sin(c.t*5+j)*6*v.k,Y-h,rr,rr*0.32,0,c.t*8+j,c.t*8+j+4.4);ctx.stroke();}
       for(const q of w.parts){ctx.fillStyle=col[0];ctx.fillRect(X+Math.cos(q.a)*R*q.r*(0.4+q.h/200),Y-q.h*v.k+Math.sin(q.a)*R*0.2,3,3);}
       if(c.fx.bolts&&Math.random()<0.3){ctx.strokeStyle=rgba(col[0],1);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(X,Y-100*v.k);ctx.lineTo(X+rnd(-30,30)*v.k,Y-50*v.k);ctx.lineTo(X+rnd(-30,30)*v.k,Y);ctx.stroke();}
       ctx.restore();}}};

 // GEYSER: pillars of fire / water / steam / light erupt under foes (or in a ring around the user)
 S.geyser={cast(c){const n=Math.max(1,Math.round(c.move.count||4)),p=c.player;c.list=[];
     if(c.fx.ring){for(let i=0;i<n;i++){const a=i/n*TAU,r=c.fx.ring;c.list.push({x:p.x+Math.cos(a)*r,y:p.y+Math.sin(a)*r*0.8,at:i*0.04});}}
     else{const L=enemies().filter(e=>Math.hypot(e.x-p.x,e.y-p.y)<420).sort(()=>Math.random()-0.5);if(!L.length)return null;for(let i=0;i<n;i++){const e=L[i%L.length];c.list.push({x:e.x+(i>=L.length?rnd(-50,50):0),y:e.y+(i>=L.length?rnd(-40,40):0),at:i*0.09});}}
     c.R=c.move.radius||60;c.warn=c.fx.warn||0.35;return c;},
   update(c,dt){c.t+=dt;for(const g of c.list)if(!g.done&&c.t>=g.at+c.warn){g.done=true;hitCircle(c,g.x,g.y,c.R,{knock:110});kick(0.03);}
     return c.t<c.list[c.list.length-1].at+c.warn+0.8;},
   draw(c,ctx,v){const col=c.fx.colors||['#fff6c8','#ff9a3d','#ff3d1a'];
     for(const g of c.list){const u=c.t-g.at;if(u<0)continue;const X=v.sx(g.x),Y=v.sy(g.y),R=c.R*v.k;
       if(u<c.warn){const q=u/c.warn;ctx.fillStyle=rgba(col[2],0.25+0.3*q);ctx.beginPath();ctx.ellipse(X,Y,R*q,R*q*0.45,0,0,TAU);ctx.fill();continue;}
       const w=u-c.warn,h=Math.min(1,w/0.12)*(c.fx.height||220)*v.k,fade=Math.max(0,1-Math.max(0,w-0.35)/0.45);
       ctx.save();ctx.globalAlpha=fade;ctx.globalCompositeOperation='lighter';
       const gr=ctx.createLinearGradient(X,Y-h,X,Y);gr.addColorStop(0,rgba(col[1],0));gr.addColorStop(0.3,rgba(col[1],0.8));gr.addColorStop(1,rgba(col[0],1));ctx.fillStyle=gr;
       ctx.beginPath();ctx.moveTo(X-R*0.55,Y);for(let s=0;s<=10;s++){const yy=Y-h*s/10;ctx.lineTo(X-R*(0.55-0.25*s/10)+Math.sin(w*30+s)*4*v.k,yy);}for(let s=10;s>=0;s--){const yy=Y-h*s/10;ctx.lineTo(X+R*(0.55-0.25*s/10)+Math.sin(w*30+s+2)*4*v.k,yy);}ctx.closePath();ctx.fill();
       glow(ctx,X,Y,R*1.1,rgba(col[0],0.8),rgba(col[2],0));for(let j=0;j<6;j++){ctx.fillStyle=col[1];ctx.fillRect(X+Math.cos(j+w*9)*R*(0.4+w),Y-h*0.8-w*60*v.k+j*8,3,3);}ctx.restore();}}};

 // ORBS: glowing orbs burst out around the user, then home in on foes and explode
 S.orbs={cast(c){const n=Math.max(1,Math.round(c.move.count||6)),p=c.player;c.list=[];
     for(let i=0;i<n;i++){const a=i/n*TAU;c.list.push({x:p.x,y:p.y-30,vx:Math.cos(a)*220,vy:Math.sin(a)*220,t:0,trail:[],dead:false});}
     c.life=c.fx.life||2.2;c.size=c.fx.size||12;return c;},
   update(c,dt){c.t+=dt;const all=enemies();
     for(const o of c.list){if(o.dead)continue;o.t+=dt;const tg=nearest(o.x,o.y,700,all);
       if(tg&&o.t>0.18){const dx=tg.x-o.x,dy=tg.y-o.y,d=Math.hypot(dx,dy)||1,sp=c.fx.speed||380;o.vx+=(dx/d*sp-o.vx)*Math.min(1,dt*(c.fx.homing||6));o.vy+=(dy/d*sp-o.vy)*Math.min(1,dt*(c.fx.homing||6));}
       o.x+=o.vx*dt;o.y+=o.vy*dt;o.trail.push({x:o.x,y:o.y});if(o.trail.length>10)o.trail.shift();
       if(tg&&Math.hypot(tg.x-o.x,tg.y-o.y)<(tg.r||12)+c.size){o.dead=true;o.boomT=0;o.bx=o.x;o.by=o.y;hitCircle(c,o.x,o.y,c.fx.splash||40,{knock:60});}
       if(o.t>c.life)o.dead=true;}
     for(const o of c.list)if(o.boomT!=null)o.boomT+=dt;
     return c.list.some(o=>!o.dead||(o.boomT!=null&&o.boomT<0.35));},
   draw(c,ctx,v){const col=c.fx.colors||['#ffffff','#c86bff','#6b2cff'];ctx.save();ctx.globalCompositeOperation='lighter';
     for(const o of c.list){if(!o.dead){o.trail.forEach((q,i)=>glow(ctx,v.sx(q.x),v.sy(q.y),c.size*v.k*(i/o.trail.length),rgba(col[1],0.35),rgba(col[2],0)));glow(ctx,v.sx(o.x),v.sy(o.y),c.size*1.5*v.k,rgba(col[0],1),rgba(col[1],0));}
       else if(o.boomT!=null&&o.boomT<0.35){const q=o.boomT/0.35;glow(ctx,v.sx(o.bx),v.sy(o.by),(c.fx.splash||40)*v.k*(0.5+q),rgba(col[0],0.9*(1-q)),rgba(col[2],0));}}
     ctx.restore();}};

 // PHANTOM DASH: a blazing afterimage of the user tears through foes to the target, then bursts
 S.dash={cast(c){const p=c.player,t=nearest(p.x,p.y,(c.move.radius||300)+80);if(!t)return null;const a=Math.atan2(t.y-p.y,t.x-p.x),L=c.move.radius||300;
     c.ax=p.x;c.ay=p.y;c.bx=p.x+Math.cos(a)*L;c.by=p.y+Math.sin(a)*L;c.ang=a;c.w=c.move.width||60;c.dur=0.18;c.skip=new Set();return c;},
   update(c,dt){c.t+=dt;const q=Math.min(1,c.t/c.dur),hx=c.ax+(c.bx-c.ax)*q,hy=c.ay+(c.by-c.ay)*q;hitLine(c,c.ax,c.ay,hx,hy,c.w,{skip:c.skip,knock:120});
     if(q>=1&&!c.burst){c.burst=1;hitCircle(c,c.bx,c.by,c.fx.burst||90,{mult:c.fx.burstMult||1,knock:160});kick(0.1);}return c.t<c.dur+0.6;},
   draw(c,ctx,v){const col=c.fx.colors||['#ffffff','#ff9a3d','#ff3d1a'],q=Math.min(1,c.t/c.dur),fade=c.t>c.dur?Math.max(0,1-(c.t-c.dur)/0.6):1;
     const AX=v.sx(c.ax),AY=v.sy(c.ay),HX=v.sx(c.ax+(c.bx-c.ax)*q),HY=v.sy(c.ay+(c.by-c.ay)*q),W=c.w*v.k;
     ctx.save();ctx.globalAlpha=fade;ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
     ctx.strokeStyle=rgba(col[2],0.5);ctx.lineWidth=W;ctx.beginPath();ctx.moveTo(AX,AY);ctx.lineTo(HX,HY);ctx.stroke();
     ctx.strokeStyle=rgba(col[1],0.85);ctx.lineWidth=W*0.45;ctx.stroke();ctx.strokeStyle=rgba(col[0],1);ctx.lineWidth=W*0.12;ctx.stroke();
     for(let i=1;i<=4;i++){const f=q-i*0.12;if(f<0)break;glow(ctx,v.sx(c.ax+(c.bx-c.ax)*f),v.sy(c.ay+(c.by-c.ay)*f),W*0.7,rgba(col[1],0.4),rgba(col[2],0));}
     if(c.burst){const u=(c.t-c.dur)/0.6,R=(c.fx.burst||90)*v.k;glow(ctx,v.sx(c.bx),v.sy(c.by),R*(0.6+u),rgba(col[0],0.95),rgba(col[2],0));
       if(c.fx.vshape){ctx.strokeStyle=rgba(col[1],0.95);ctx.lineWidth=8*(1-u)+2;const bx=v.sx(c.bx),by=v.sy(c.by);ctx.beginPath();ctx.moveTo(bx-R,by-R);ctx.lineTo(bx,by+R*0.3);ctx.lineTo(bx+R,by-R);ctx.stroke();}}
     ctx.restore();}};

 // ---------------------------------------------------------------- manager
 window.PS_FX={
   styles:S,
   has(name){return !!S[name];},
   cast(name,player,move,hit,ghost){const st=S[name];if(!st)return false;
     const c={style:st,player,move,hit,ghost:!!ghost,fx:Object.assign({},move.fx||{}),t:0};
     try{const r=st.cast(c);if(r)live.push(r);}catch(e){console.warn('fx cast',name,e);}return true;},
   active(){return live.length>0;},
   update(dt){for(let i=live.length-1;i>=0;i--){let keep=false;try{keep=live[i].style.update(live[i],dt);}catch(e){console.warn('fx update',e);}if(!keep)live.splice(i,1);}},
   draw(ctx,view){for(const c of live){try{ctx.save();c.style.draw(c,ctx,view);ctx.restore();}catch(e){console.warn('fx draw',e);}}},
   clear(){live.length=0;}
 };
})();
