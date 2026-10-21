// =====================================================================
//  CUSTOM MOVE EFFECTS v2 (legendary signature moves + remade Mega moves)
//  Loaded before mega-native.js. Uses the GAME'S OWN assets wherever possible:
//   - VFX sprites (fire, drop, bubble, leaf, bolt, shard, rock, star, crescent, note, heart, shadow ...)
//   - FX effects (lightning strikes/zaps, slashes, rings, bursts, sprite particles, game beam flash)
//   - Z-move pieces: the Z Asteroid falling field, Z tornadoes, Fire/Toxic Z ground fields
//  plus custom-drawn glows. All damage goes through the game's own hit function.
//
//  A move uses a style with psCast:'<style>' and fx:{...} (see js/legend-moves.js).
//  Styles: beam rift lances void spikes shock comet vortex geyser orbs dash
// =====================================================================
(function(){
 const B=()=>window.PS_MEGA_BRIDGE_V5;
 const live=[];
 const rnd=(a,b)=>a+Math.random()*(b-a);
 const TAU=Math.PI*2;
 const FX=()=>B()?.fx,VFX=()=>B()?.vfx;
 function enemies(){const E=B()?.enemies;return E&&typeof E.all==='function'?E.all().filter(e=>e&&!e.dead&&typeof e.hurt==='function'):[];}
 function nearest(x,y,maxD,list){let best=null,bd=maxD*maxD;for(const e of list||enemies()){const d=(e.x-x)**2+(e.y-y)**2;if(d<bd){bd=d;best=e;}}return best;}
 function densest(p,range,avoid){
   const all=enemies(),near=all.filter(e=>Math.hypot(e.x-p.x,e.y-p.y)<range);let best=null,bs=-1;
   for(const c of near){if(avoid&&avoid.some(a=>Math.hypot(a.x-c.x,a.y-c.y)<120))continue;
     let s=0;for(const o of all)if(Math.hypot(o.x-c.x,o.y-c.y)<130)s++;s-=Math.hypot(c.x-p.x,c.y-p.y)/1000;if(s>bs){bs=s;best=c;}}
   return best;
 }
 function kick(v){try{B()?.camera?.kick?.(v);}catch(e){}}
 function typeColor(c){return c.fx.color||(c.fx.colors&&c.fx.colors[1])||'#ffffff';}
 // Where the move comes out of: the Pokemon's mouth / front, at head height, in its aim direction.
 function mouth(p,aim){
   const r=Number(p.r)||16,lift=Number(B()?.lift)||18,h=Math.max(lift,(Number(p.bodyH)||40)*0.62);
   return {x:p.x+Math.cos(aim)*r*0.9,y:p.y-h+Math.sin(aim)*r*0.45};
 }
 function wallClip(x,y,ang,len){const W=B()?.world;if(!W||typeof W.isWall!=='function')return len;const c=Math.cos(ang),s=Math.sin(ang);for(let d=12;d<len;d+=12)if(W.isWall(x+c*d,y+s*d))return d;return len;}
 function baseDmg(c,mult){return (Number(c.move.dmg)||10)*(Number(c.player.atk)||1)*(mult||1)*(c.fx.mult||1);}
 function applyHit(c,e,dmg,opts,dx,dy){
   try{c.hit(c.player,e,dmg,c.fx.color||typeColor(c),dx||0.01,dy||0,opts.knock==null?(c.move.knock||60):opts.knock,c.move);}catch(err){console.warn('fx hit',err);}
   const st=opts.stun||c.fx.stun;if(st&&Math.random()<st.chance&&typeof e.applyStun==='function')e.applyStun(st.dur||0.8);
   const sl=opts.slow||c.fx.slow;if(sl&&typeof e.applySlow==='function')e.applySlow(sl,opts.slowDur||1.4);
   if((opts.burn||c.fx.burn)&&typeof e.applyBurn==='function')e.applyBurn(1);
   if((opts.poison||c.fx.poison)&&typeof e.applyPoison==='function')e.applyPoison(1);
 }
 function hitCircle(c,x,y,r,opts={}){
   if(c.ghost||typeof c.hit!=='function')return 0;let n=0;const dmg=baseDmg(c,opts.mult);
   for(const e of enemies()){const dx=e.x-x,dy=e.y-y;if(dx*dx+dy*dy>(r+(e.r||10))**2)continue;if(opts.skip&&opts.skip.has(e))continue;opts.skip&&opts.skip.add(e);applyHit(c,e,dmg,opts,dx,dy);n++;}
   return n;
 }
 function segDist(px,py,ax,ay,bx,by){const vx=bx-ax,vy=by-ay,l=vx*vx+vy*vy||1;let t=((px-ax)*vx+(py-ay)*vy)/l;t=Math.max(0,Math.min(1,t));return Math.hypot(px-(ax+vx*t),py-(ay+vy*t));}
 // returns the distance along the line of the farthest foe hit (or -1)
 function hitLine(c,ax,ay,bx,by,w,opts={}){
   if(c.ghost||typeof c.hit!=='function')return -1;const dmg=baseDmg(c,opts.mult);let far=-1;
   const nx=bx-ax,ny=by-ay,l=Math.hypot(nx,ny)||1;
   for(const e of enemies()){if(opts.skip&&opts.skip.has(e))continue;if(segDist(e.x,e.y,ax,ay,bx,by)>w/2+(e.r||10))continue;opts.skip&&opts.skip.add(e);
     applyHit(c,e,dmg,opts,nx/l,ny/l);const along=((e.x-ax)*nx+(e.y-ay)*ny)/l;if(along>far)far=along;}
   return far;
 }
 function glow(ctx,x,y,r,c0,c1){const g=ctx.createRadialGradient(x,y,0,x,y,Math.max(1,r));g.addColorStop(0,c0);g.addColorStop(1,c1||'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,Math.max(1,r),0,TAU);ctx.fill();}
 function rgba(hex,a){const n=parseInt((hex||'#ffffff').slice(1),16);return 'rgba('+(n>>16)+','+(n>>8&255)+','+(n&255)+','+a+')';}
 // draw a GAME sprite on the overlay (shape from the game's VFX library, tinted with a game palette)
 function sprite(ctx,shape,pal,X,Y,scale,angle,frame,alpha){const V=VFX();if(!V||typeof V.draw!=='function')return;try{V.draw(ctx,shape,pal||'normal',X,Y,{scale,angle:angle||0,frame:frame||0,alpha:alpha==null?1:alpha});}catch(e){}}
 function frames(shape){try{return VFX().frames(shape)||1;}catch(e){return 1;}}
 // engine particles (drawn by the game itself, in world space)
 function sp(shape,pal,x,y,o){try{FX().sp(shape,pal,x,y,o||{});}catch(e){}}
 function ring(x,y,r0,r1,col,life,w){try{FX().ring(x,y,r0,r1,col,life||0.4,w||4);}catch(e){}}
 function burst(x,y,col,n,spd){try{FX().burst(x,y,col,n||12,spd||140);}catch(e){}}
 // ---- custom drawn pieces (Ultra Beasts etc.)
 function drawJaw(ctx,X,Y,w,h,up,body){ // one jaw (up=true: upper jaw, teeth pointing down)
   const s=up?-1:1;ctx.fillStyle=body||'#2a0a24';ctx.beginPath();ctx.ellipse(X,Y,w,h,0,up?Math.PI:0,up?TAU:Math.PI);ctx.closePath();ctx.fill();
   ctx.strokeStyle='#c8325a';ctx.lineWidth=Math.max(2,h*0.12);ctx.beginPath();ctx.moveTo(X-w,Y);ctx.lineTo(X+w,Y);ctx.stroke();
   ctx.fillStyle='#fff8ec';const n=8,tw=w*2/n;for(let i=0;i<n;i++){const tx=X-w+tw*(i+0.5),edge=Math.sqrt(Math.max(0,1-((tx-X)/w)**2)),th=h*0.45*(0.6+0.4*edge);
     ctx.beginPath();ctx.moveTo(tx-tw*0.42,Y);ctx.lineTo(tx+tw*0.42,Y);ctx.lineTo(tx,Y-s*th);ctx.closePath();ctx.fill();}}
 function drawRocket(ctx,X,Y,ang,L,t){ctx.save();ctx.translate(X,Y);ctx.rotate(ang);const W=L*0.28;
   for(let i=0;i<3;i++){const fl=L*(0.55+0.25*Math.sin(t*50+i*2));const g=ctx.createLinearGradient(-L*0.5,0,-L*0.5-fl,0);g.addColorStop(0,'rgba(255,240,180,0.95)');g.addColorStop(0.4,'rgba(255,140,40,0.8)');g.addColorStop(1,'rgba(255,60,20,0)');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(-L*0.5,-W*0.4);ctx.lineTo(-L*0.5-fl,0);ctx.lineTo(-L*0.5,W*0.4);ctx.fill();}
   ctx.fillStyle='#6e8296';ctx.beginPath();ctx.moveTo(-L*0.42,-W*0.5);ctx.lineTo(-L*0.62,-W*1.05);ctx.lineTo(-L*0.2,-W*0.5);ctx.fill();ctx.beginPath();ctx.moveTo(-L*0.42,W*0.5);ctx.lineTo(-L*0.62,W*1.05);ctx.lineTo(-L*0.2,W*0.5);ctx.fill();
   const b=ctx.createLinearGradient(0,-W/2,0,W/2);b.addColorStop(0,'#f4f8fc');b.addColorStop(0.5,'#b8c6d4');b.addColorStop(1,'#6e8296');ctx.fillStyle=b;ctx.fillRect(-L*0.5,-W/2,L*0.72,W);
   ctx.beginPath();ctx.moveTo(L*0.22,-W/2);ctx.quadraticCurveTo(L*0.5,0,L*0.22,W/2);ctx.fill();ctx.fillStyle='#3cb84a';ctx.fillRect(-L*0.1,-W/2,L*0.08,W);ctx.restore();}
 function drawBlock(ctx,x,y,w,h,shade){ctx.fillStyle=shade||'#8e8a84';ctx.fillRect(x-w/2,y-h,w,h);ctx.fillStyle='rgba(255,255,255,0.28)';ctx.fillRect(x-w/2,y-h,w,h*0.22);ctx.fillStyle='rgba(0,0,0,0.25)';ctx.fillRect(x+w*0.3,y-h,w*0.2,h);
   ctx.strokeStyle='#3a3632';ctx.lineWidth=2;ctx.strokeRect(x-w/2,y-h,w,h);ctx.fillStyle='#ff3c3c';ctx.beginPath();ctx.arc(x-w*0.1,y-h*0.55,Math.max(1.5,w*0.08),0,TAU);ctx.fill();}
 const spikeImg=new Image();spikeImg.src='assets/fx/precipice-spikes.png?v=1';
 const S={};

 // ---------------------------------------------------------------- BEAM (fired from the mouth, follows your aim)
 S.beam={cast(c){const p=c.player;c.aim=Number(p.aim)||0;c.dur=c.fx.dur||1.1;c.charge=c.fx.charge||0.25;c.tickT=0;c.parts=[];c.w=c.fx.width||64;c.len=Number(c.move.radius)||480;c.far=-1;c.child=null;return c;},
   update(c,dt){c.t+=dt;const p=c.player;
     // turn toward the Pokemon's current aim (like the game's Z beam), max 3 rad/s
     const target=Number(p.aim)||c.aim,diff=Math.atan2(Math.sin(target-c.aim),Math.cos(target-c.aim));c.aim+=Math.max(-3*dt,Math.min(3*dt,diff));
     const m=mouth(p,c.aim);c.x=m.x;c.y=m.y;c.L=wallClip(p.x,p.y,c.aim,c.len);
     // the beam leaves the mouth and angles down to land on the ground line it actually hits
     const lift=Number(B()?.lift)||18,ex=p.x+Math.cos(c.aim)*c.L,ey=p.y-lift+Math.sin(c.aim)*c.L;c.va=Math.atan2(ey-c.y,ex-c.x);c.VL=Math.hypot(ex-c.x,ey-c.y);
     if(c.t<c.charge){if(c.parts.length<40)for(let i=0;i<3;i++)c.parts.push({a:rnd(0,TAU),r:rnd(40,90)});for(const q of c.parts)q.r-=170*dt;c.parts=c.parts.filter(q=>q.r>3);return true;}
     if(!c.started){c.started=1;kick(0.08);}
     const live=c.t<c.charge+c.dur;
     c.tickT-=dt;if(c.tickT<=0&&live){c.tickT=c.fx.tick||0.2;const bx=c.x+Math.cos(c.aim)*c.L,by=c.y+Math.sin(c.aim)*c.L;
       const f=hitLine(c,p.x,p.y,p.x+Math.cos(c.aim)*c.L,p.y+Math.sin(c.aim)*c.L,c.w,{knock:30});if(f>0)c.far=f;
       try{FX().beam(c.x,c.y,c.va,c.VL,c.w*0.55,typeColor(c),{beam:c.fx.beamShape||null,pal:c.fx.pal||c.move.type});}catch(e){}}
     // Roar of Time-style rebound: a big aura bursts from where the beam hit
     if(!live&&c.fx.rebound&&!c.reb){c.reb=1;const d=c.far>0?Math.min(c.far,c.L):c.L,rx=p.x+Math.cos(c.aim)*d,ry=p.y+Math.sin(c.aim)*d,R=c.fx.rebound.radius||170;
       c.rebX=rx;c.rebY=ry;c.rebT=c.t;hitCircle(c,rx,ry,R,{mult:c.fx.rebound.mult||1.5,knock:120,slow:c.fx.rebound.slow||0.55,slowDur:2.2,stun:c.fx.rebound.stun});ring(rx,ry,10,R,c.fx.colors?c.fx.colors[1]:'#8ff0ff',0.6,6);kick(0.12);}
     return c.t<c.charge+c.dur+(c.fx.rebound?1.1:0.25);},
   draw(c,ctx,v){const col=c.fx.colors||['#ffffff','#8fd3ff','#2a6cff'],k=v.k,X=v.sx(c.x),Y=v.sy(c.y);
     if(c.t<c.charge){for(const q of c.parts){ctx.fillStyle=col[1];ctx.fillRect(X+Math.cos(q.a)*q.r*k,Y+Math.sin(q.a)*q.r*k,3,3);}
       glow(ctx,X,Y,(8+26*c.t/c.charge)*k,rgba(col[0],0.95),rgba(col[1],0));sprite(ctx,'ball',c.fx.pal||c.move.type,X,Y,0.6+1.4*c.t/c.charge,0,0,0.9);return;}
     const u=c.t-c.charge;
     if(u<c.dur+0.25){const fade=u>c.dur?Math.max(0,1-(u-c.dur)/0.25):Math.min(1,u/0.08),L=(c.VL||c.L||c.len)*k,W=c.w*k*(0.85+0.15*Math.sin(u*40));
       ctx.save();ctx.translate(X,Y);ctx.rotate(c.va==null?c.aim:c.va);ctx.globalAlpha=fade;
       if(c.fx.dark){let g=ctx.createLinearGradient(0,-W*1.15,0,W*1.15);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(0.5,'rgba(10,0,0,0.85)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(0,-W*1.15,L,W*2.3);}
       ctx.globalCompositeOperation='lighter';
       let g=ctx.createLinearGradient(0,-W,0,W);g.addColorStop(0,rgba(col[2],0));g.addColorStop(0.5,rgba(col[2],0.55));g.addColorStop(1,rgba(col[2],0));ctx.fillStyle=g;ctx.fillRect(0,-W,L,W*2);
       g=ctx.createLinearGradient(0,-W*0.5,0,W*0.5);g.addColorStop(0,rgba(col[1],0));g.addColorStop(0.5,rgba(col[1],0.9));g.addColorStop(1,rgba(col[1],0));ctx.fillStyle=g;ctx.fillRect(0,-W*0.5,L,W);
       ctx.fillStyle=rgba(col[0],0.95);ctx.fillRect(0,-W*0.13,L,W*0.26);
       const deco=c.fx.deco;
       for(let i=0;i<6;i++){const d=((u*c.len*1.6+i*c.len/6)%c.len)*k;if(d>L)continue;
         if(deco==='clock'){ctx.strokeStyle=rgba(col[0],0.8);ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(d,0,W*0.25,W*0.95,0,0,TAU);ctx.stroke();
           for(let j=0;j<12;j++){const a=j/12*TAU;ctx.beginPath();ctx.moveTo(d+Math.cos(a)*W*0.18,Math.sin(a)*W*0.8);ctx.lineTo(d+Math.cos(a)*W*0.25,Math.sin(a)*W*0.95);ctx.stroke();}}
         else if(deco==='feather'){sprite(ctx,'wind',c.fx.pal||'flying',d,Math.sin(u*9+i)*W*0.6,1.6*k,0.3);}
         else if(deco==='rainbow'){ctx.strokeStyle='hsla('+((u*300+i*60)%360)+',100%,70%,0.8)';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(d,0,W*0.2,W*0.9,0,0,TAU);ctx.stroke();}
         else if(deco==='shards'||deco==='bubbles'){sprite(ctx,deco==='shards'?'shard':'bubble',c.fx.pal||c.move.type,d,Math.sin(u*7+i*2)*W*0.55,1.4*k,c.va||c.aim,i);}
         else {ctx.strokeStyle=rgba(col[0],0.55);ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(d,0,W*0.18,W*0.8,0,0,TAU);ctx.stroke();}}
       glow(ctx,0,0,W*1.1,rgba(col[0],0.95),rgba(col[1],0));glow(ctx,L,0,W*1.2,rgba(col[0],0.85),rgba(col[2],0));
       ctx.restore();}
     if(c.reb){const w=c.t-c.rebT,R=(c.fx.rebound.radius||170)*k,q=Math.min(1,w/0.3),fade=Math.max(0,1-Math.max(0,w-0.35)/0.75),RX=v.sx(c.rebX),RY=v.sy(c.rebY);
       ctx.save();ctx.globalAlpha=fade;
       const g=ctx.createRadialGradient(RX,RY,0,RX,RY,R*q);g.addColorStop(0,rgba(col[0],0.55));g.addColorStop(0.6,rgba(col[1],0.3));g.addColorStop(1,rgba(col[2],0.05));ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(RX,RY,R*q,R*q*0.62,0,0,TAU);ctx.fill();
       ctx.globalCompositeOperation='lighter';ctx.strokeStyle=rgba(col[1],0.95);ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(RX,RY,R*q,R*q*0.62,0,0,TAU);ctx.stroke();
       if(c.fx.deco==='clock'){ // a clock face spinning backwards = time distortion
         ctx.strokeStyle=rgba(col[0],0.9);ctx.lineWidth=2;const cr=R*q*0.55;ctx.beginPath();ctx.ellipse(RX,RY,cr,cr*0.62,0,0,TAU);ctx.stroke();
         for(let j=0;j<12;j++){const a=j/12*TAU;ctx.beginPath();ctx.moveTo(RX+Math.cos(a)*cr*0.85,RY+Math.sin(a)*cr*0.62*0.85);ctx.lineTo(RX+Math.cos(a)*cr,RY+Math.sin(a)*cr*0.62);ctx.stroke();}
         const h1=-w*9,h2=-w*2.2;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(RX,RY);ctx.lineTo(RX+Math.cos(h1)*cr*0.8,RY+Math.sin(h1)*cr*0.5);ctx.stroke();ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(RX,RY);ctx.lineTo(RX+Math.cos(h2)*cr*0.5,RY+Math.sin(h2)*cr*0.31);ctx.stroke();}
       for(let j=0;j<3;j++){const rr=R*Math.min(1,q+j*0.18)*(1+w*0.3);ctx.strokeStyle=rgba(col[2],0.5*fade);ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(RX,RY,rr,rr*0.62,0,0,TAU);ctx.stroke();}
       ctx.restore();}}};

 // ---------------------------------------------------------------- RIFT (space-tearing slashes + the game's slash arcs)
 S.rift={cast(c){const t=densest(c.player,(c.move.radius||300)+60)||nearest(c.player.x,c.player.y,500);if(!t)return null;
     c.cx=t.x;c.cy=t.y;c.n=Math.max(1,Math.round(c.move.count||3));c.slashes=[];const base=rnd(0,Math.PI);
     for(let i=0;i<c.n;i++)c.slashes.push({a:base+i*Math.PI/c.n+rnd(-0.2,0.2),ox:rnd(-40,40),oy:rnd(-30,30),at:i*(c.fx.delay||0.11),done:false});
     c.len=c.fx.len||360;c.w=c.fx.width||46;return c;},
   update(c,dt){c.t+=dt;for(const s of c.slashes)if(!s.done&&c.t>=s.at){s.done=true;const x=c.cx+s.ox,y=c.cy+s.oy,dx=Math.cos(s.a)*c.len/2,dy=Math.sin(s.a)*c.len/2;hitLine(c,x-dx,y-dy,x+dx,y+dy,c.w,{knock:90});if(c.fx.paper){c.paper=c.paper||[];for(let j=0;j<9;j++){const f=rnd(-0.5,0.5);c.paper.push({x:x+dx*f*2,y:y+dy*f*2,vx:rnd(-120,120),vy:rnd(-160,-40),r:rnd(0,TAU),vr:rnd(-12,12),s:rnd(5,10),t:0});}}
       try{FX().slash(x,y,s.a,c.len*0.45,0.9,typeColor(c),{pal:c.fx.pal||c.move.type});}catch(e){}kick(0.05);}
     if(c.paper)for(const q of c.paper){q.t+=dt;q.vy+=260*dt;q.vx*=0.98;q.x+=q.vx*dt;q.y+=q.vy*dt*0.6;q.r+=q.vr*dt;}
     return c.t<c.slashes[c.slashes.length-1].at+(c.paper?1.1:0.75);},
   draw(c,ctx,v){const col=c.fx.colors||['#ffffff','#ff8ad8','#7a2cff'];
     if(c.paper)for(const q of c.paper){const a=Math.max(0,1-q.t/1.0);if(!a)continue;ctx.save();ctx.globalAlpha=a;ctx.translate(v.sx(q.x),v.sy(q.y));ctx.rotate(q.r);const sz=q.s*v.k;ctx.fillStyle='#fbfbf4';ctx.beginPath();ctx.moveTo(-sz,-sz*0.7);ctx.lineTo(sz,-sz*0.2);ctx.lineTo(-sz*0.3,sz);ctx.closePath();ctx.fill();ctx.fillStyle='#d8dccc';ctx.beginPath();ctx.moveTo(-sz,-sz*0.7);ctx.lineTo(-sz*0.3,sz);ctx.lineTo(0,0);ctx.fill();ctx.restore();}
     for(const s of c.slashes){const u=c.t-s.at;if(u<0)continue;const grow=Math.min(1,u/0.07),fade=Math.max(0,1-Math.max(0,u-0.25)/0.5);
       const x=v.sx(c.cx+s.ox),y=v.sy(c.cy+s.oy),L=c.len*v.k*grow/2,W=c.w*v.k;
       ctx.save();ctx.translate(x,y);ctx.rotate(s.a);ctx.globalAlpha=fade;
       if(c.fx.space){ctx.fillStyle='rgba(8,0,24,0.85)';ctx.beginPath();ctx.ellipse(0,0,L,W*0.35*(1-0.5*Math.max(0,u-0.25)),0,0,TAU);ctx.fill();
         for(let j=0;j<8;j++)sprite(ctx,'star','violet',Math.cos(j*1.7)*L*0.8,Math.sin(j*2.3)*W*0.15,0.7*v.k,0,0,0.5+0.5*Math.sin(u*20+j));}
       ctx.globalCompositeOperation='lighter';
       let g=ctx.createLinearGradient(0,-W,0,W);g.addColorStop(0,rgba(col[2],0));g.addColorStop(0.5,rgba(col[2],0.6));g.addColorStop(1,rgba(col[2],0));
       ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(0,0,L*1.05,W,0,0,TAU);ctx.fill();
       ctx.fillStyle=rgba(col[1],0.9);ctx.beginPath();ctx.ellipse(0,0,L,W*0.22,0,0,TAU);ctx.fill();
       ctx.fillStyle=rgba(col[0],1);ctx.beginPath();ctx.ellipse(0,0,L*0.95,W*0.07+1,0,0,TAU);ctx.fill();
       ctx.restore();}}};

 // ---------------------------------------------------------------- LANCES (light pillars / REAL game lightning / falling star sprites)
 S.lances={cast(c){const n=Math.max(1,Math.round(c.move.count||6)),R=c.move.radius||280,p=c.player;
     const list=enemies().filter(e=>Math.hypot(e.x-p.x,e.y-p.y)<R+120).sort(()=>Math.random()-0.5);if(!list.length)return null;
     c.hits=[];for(let i=0;i<n;i++){const e=list[i%list.length];c.hits.push({x:e.x+(i>=list.length?rnd(-50,50):0),y:e.y+(i>=list.length?rnd(-40,40):0),at:(c.fx.delay||0)+i*(c.fx.gap||0.07),fall:c.fx.fall||0.4,done:false});}
     c.r=c.fx.r||58;return c;},
   update(c,dt){c.t+=dt;for(const h of c.hits)if(!h.done&&c.t>=h.at+h.fall){h.done=true;hitCircle(c,h.x,h.y,c.r,{knock:80});kick(0.03);
       const col=typeColor(c);if(c.fx.style==='bolt'){try{FX().strike(h.x,h.y,col);FX().zap(h.x+rnd(-30,30),h.y-420,h.x,h.y,0.12,col,40,2.2);}catch(e){}}
       ring(h.x,h.y,6,c.r*1.2,col,0.4,3);if(c.fx.style==='star')burst(h.x,h.y,col,10,160);}
     return c.t<c.hits[c.hits.length-1].at+c.hits[0].fall+0.6;},
   draw(c,ctx,v){const col=c.fx.colors||['#ffffff','#ffe27a','#ffb000'],style=c.fx.style||'light';
     for(const h of c.hits){const u=c.t-h.at;if(u<0)continue;const X=v.sx(h.x),Y=v.sy(h.y),R=c.r*v.k;
       if(u<h.fall){const q=u/h.fall;ctx.strokeStyle=rgba(col[1],0.35+0.5*q);ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(X,Y,R*q,R*q*0.45,0,0,TAU);ctx.stroke();
         if(style==='star'){const sx=X+(1-q)*220*v.k,sy=Y-(1-q)*620*v.k;glow(ctx,sx,sy,18*v.k,rgba(col[0],0.9),rgba(col[1],0));sprite(ctx,'star',c.fx.pal||'steel',sx,sy,2.2*v.k,0,Math.floor(c.t*12));}continue;}
       const w=u-h.fall,fade=Math.max(0,1-w/0.55);ctx.save();ctx.globalAlpha=fade;ctx.globalCompositeOperation='lighter';
       if(style!=='bolt'){const g=ctx.createLinearGradient(X,Y-800*v.k,X,Y);g.addColorStop(0,rgba(col[1],0));g.addColorStop(1,rgba(col[0],0.95));ctx.fillStyle=g;const bw=(style==='star'?14:22)*v.k*(1-w/0.55*0.6);ctx.fillRect(X-bw/2,Y-800*v.k,bw,800*v.k);}
       glow(ctx,X,Y,R*1.3*(0.6+w),rgba(col[0],0.9),rgba(col[2],0));
       ctx.strokeStyle=rgba(col[1],0.9);ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(X,Y,R*(0.5+w*2),R*(0.5+w*2)*0.45,0,0,TAU);ctx.stroke();ctx.restore();}}};

 // ---------------------------------------------------------------- VOID (pull, ticks, collapse; shadow sprites spiral in)
 S.void={cast(c){const t=densest(c.player,360)||nearest(c.player.x,c.player.y,420);if(!t)return null;
     c.x=t.x;c.y=t.y;c.R=c.move.radius||170;c.pullT=c.fx.pull||1.0;c.life=c.pullT+0.5;c.tick=0;c.parts=[];c.seed=rnd(0,TAU);return c;},
   update(c,dt){c.t+=dt;const all=enemies();
     if(c.t<c.pullT){for(const e of all){const dx=c.x-e.x,dy=c.y-e.y,d=Math.hypot(dx,dy);if(d>c.R||d<6)continue;const pl=(140+240*(1-d/c.R))*(e.boss?0.3:1)*dt;e.x+=dx/d*Math.min(pl,d-6);e.y+=dy/d*Math.min(pl,d-6);}
       c.tick-=dt;if(c.tick<=0){c.tick=0.25;hitCircle(c,c.x,c.y,c.R*0.6,{mult:0.12,knock:0});}
       if(c.parts.length<26)c.parts.push({a:rnd(0,TAU),r:c.R*rnd(0.6,1.1),f:(Math.random()*4)|0});}
     else if(!c.boom){c.boom=1;hitCircle(c,c.x,c.y,c.R*0.8,{mult:c.fx.blast||2.5,knock:150});kick(0.12);ring(c.x,c.y,10,c.R,typeColor(c),0.5,6);burst(c.x,c.y,typeColor(c),20,220);}
     for(const q of c.parts){q.a+=dt*(2+40/(q.r+10));q.r-=(80+c.R*0.6)*dt;}c.parts=c.parts.filter(q=>q.r>4);
     return c.t<c.life;},
   draw(c,ctx,v){const X=v.sx(c.x),Y=v.sy(c.y),R=c.R*v.k,col=c.fx.colors||['#000000','#7a3cff','#d7b4ff'];
     if(c.t<c.pullT){const grow=Math.min(1,c.t/0.25),core=(22+8*Math.sin(c.t*9))*v.k*grow;
       glow(ctx,X,Y,R*grow,rgba(col[1],0.35),rgba(col[1],0));
       ctx.lineWidth=Math.max(2,3*v.k);for(let j=0;j<5;j++){const a0=c.seed+c.t*(3+j*0.5)+j*1.26,rr=core*(1.6+j*0.35);ctx.strokeStyle=rgba(j%2?col[2]:col[1],0.85);ctx.beginPath();ctx.ellipse(X,Y,rr,rr*0.62,0,a0,a0+1.7);ctx.stroke();}
       if(c.fx.rings){ctx.strokeStyle=rgba(c.fx.rings,0.9);ctx.lineWidth=4;for(let j=0;j<3;j++){ctx.beginPath();ctx.ellipse(X,Y,core*(2.6+j*0.6),core*(1.0+j*0.25),c.t*(j%2?1:-1),0,TAU);ctx.stroke();}}
       if(c.fx.maw){const gw=core*3,gap=core*1.9*(0.85+0.15*Math.sin(c.t*6));drawJaw(ctx,X,Y-gap,gw,gw*0.55,true);drawJaw(ctx,X,Y+gap*0.6,gw,gw*0.5,false);}
       for(const q of c.parts)sprite(ctx,c.fx.shape||'shadow',c.fx.pal||c.move.type,X+Math.cos(q.a)*q.r*v.k,Y+Math.sin(q.a)*q.r*v.k*0.62,0.9*v.k*Math.min(1,q.r/60),q.a,q.f);
       ctx.fillStyle=col[0];ctx.beginPath();ctx.arc(X,Y,core,0,TAU);ctx.fill();ctx.strokeStyle=rgba(col[2],0.9);ctx.lineWidth=2;ctx.beginPath();ctx.arc(X,Y,core+2,0,TAU);ctx.stroke();}
     else{const u=Math.min(1,(c.t-c.pullT)/0.5),rr=R*(0.2+0.9*u);
       if(c.fx.maw){const sn=Math.min(1,u*5),gw=R*0.42*(1+0.15*u),gap=gw*1.0*(1-sn);ctx.save();ctx.globalAlpha=Math.max(0,1-Math.max(0,u-0.45)/0.55);drawJaw(ctx,X,Y-gap-2,gw,gw*0.55,true);drawJaw(ctx,X,Y+gap*0.6+2,gw,gw*0.5,false);ctx.restore();}
       ctx.globalAlpha=1-u;glow(ctx,X,Y,rr,'rgba(255,255,255,0.9)',rgba(col[1],0));ctx.strokeStyle=rgba(col[2],0.95);ctx.lineWidth=5*(1-u)+1;ctx.beginPath();ctx.arc(X,Y,rr,0,TAU);ctx.stroke();ctx.globalAlpha=1;}}};

 // ---------------------------------------------------------------- SPIKES (rings of spikes, recolorable; game rock debris)
 S.spikes={cast(c){c.x=c.player.x;c.y=c.player.y;c.waves=(c.move.count||12)>=20?4:3;c.next=0;c.sp=[];c.R=[62,128,194,260];return c;},
   update(c,dt){c.t+=dt;while(c.next<c.waves&&c.t>=c.next*0.13){const k=c.next++,R=c.R[k],n=Math.max(7,Math.round(TAU*R/66)),off=rnd(0,TAU);
       for(let j=0;j<n;j++){const a=off+j*TAU/n,x=c.x+Math.cos(a)*R,y=c.y+Math.sin(a)*R*0.8;if(Math.abs(x-c.x)<50&&y-c.y>-100&&y-c.y<28)continue;c.sp.push({x,y,v:(Math.random()*4)|0,t:-rnd(0,0.05),s:rnd(0.75,1.1)});
         if(j%3===0)sp('rock',c.fx.pal||'ground',x,y,{vx:rnd(-40,40),vy:-rnd(60,120),life:0.5,grav:320});}
       if(!c.ghost)for(const e of enemies()){const d=Math.hypot(e.x-c.x,(e.y-c.y)/0.8);if(d>(k?R-36:0)&&d<R+36)applyHit(c,e,baseDmg(c),{knock:120},e.x-c.x,e.y-c.y);}kick(0.04);}
     for(const s of c.sp)s.t+=dt;return c.t<c.waves*0.13+0.7;},
   draw(c,ctx,v){if(c.fx.bricks){ctx.save();const px=1.05*v.k;for(const s of c.sp.slice().sort((a,b)=>a.y-b.y)){if(s.t<0)continue;const f=Math.max(0,Math.min(1,s.t/0.09)-Math.max(0,(s.t-0.44)/0.18));if(f<=0)continue;const gx=v.sx(s.x),gy=v.sy(s.y),bw=26*px*s.s,bh=17*px*s.s;
       ctx.fillStyle='rgba(30,25,20,'+(0.35*Math.max(0,1-s.t/0.62))+')';ctx.beginPath();ctx.ellipse(gx,gy,bw*0.8,bw*0.3,0,0,TAU);ctx.fill();ctx.save();ctx.beginPath();ctx.rect(gx-bw,gy-bh*4,bw*2,bh*4);ctx.clip();const lift=bh*3*(1-f);
       for(let k=0;k<3;k++)drawBlock(ctx,gx+(k%2?bw*0.08:-bw*0.06),gy+lift-k*bh,bw,bh,['#8e8a84','#7b7771','#a29d96'][(s.v+k)%3]);ctx.restore();}ctx.restore();return;}
     if(!spikeImg.complete)return;ctx.save();ctx.imageSmoothingEnabled=false;if(c.fx.filter)ctx.filter=c.fx.filter;const px=1.05*v.k;
     for(const s of c.sp.slice().sort((a,b)=>a.y-b.y)){if(s.t<0)continue;const f=Math.max(0,Math.min(1,s.t/0.09)-Math.max(0,(s.t-0.44)/0.18));const w=32*px*s.s,h=56*px*s.s,gx=v.sx(s.x),gy=v.sy(s.y)+3*px;
       ctx.globalAlpha=Math.max(0,1-s.t/0.62);ctx.drawImage(spikeImg,s.v*32,56,32,16,gx-w/2,gy-8*px,w,16*px*s.s);ctx.globalAlpha=1;
       ctx.save();ctx.beginPath();ctx.rect(gx-w,gy-h*1.1,w*2,h*1.1);ctx.clip();ctx.drawImage(spikeImg,s.v*32,0,32,56,gx-w/2,gy-h*f,w,h);ctx.restore();}
     ctx.restore();}};

 // ---------------------------------------------------------------- SHOCK (expanding rings; GAME sprites ride the rings: notes, stars, moons, hearts)
 S.shock={cast(c){c.x=c.player.x;c.y=c.player.y;c.rings=Math.max(1,c.fx.rings||3);c.R=c.move.radius||260;c.speed=c.fx.speed||520;c.gap=c.fx.gap||0.16;c.skips=[];for(let i=0;i<c.rings;i++)c.skips.push(new Set());
     if(c.fx.heal){const p=c.player;p.hp=Math.min(p.maxHp,p.hp+p.maxHp*c.fx.heal);}
     if(c.fx.fireworks){c.fw=[];for(let i=0;i<9;i++){const a=rnd(0,TAU),r=rnd(0.25,0.95)*c.R;c.fw.push({x:c.x+Math.cos(a)*r,y:c.y+Math.sin(a)*r*0.7,at:0.05+i*0.07,h:rnd(0,360),n:14+((Math.random()*6)|0)});}}kick(0.06);ring(c.x,c.y,8,c.R,typeColor(c),0.5,5);return c;},
   update(c,dt){c.t+=dt;if(c.fx.follow){c.x=c.player.x;c.y=c.player.y;}
     for(let i=0;i<c.rings;i++){const u=c.t-i*c.gap;if(u<0)continue;const r=Math.min(c.R,u*c.speed);if(u*c.speed>c.R+40)continue;
       if(!c.ghost)for(const e of enemies()){if(c.skips[i].has(e))continue;const d=Math.hypot(e.x-c.x,e.y-c.y);if(d<=r+(e.r||10)){c.skips[i].add(e);applyHit(c,e,baseDmg(c),{knock:70},e.x-c.x,e.y-c.y);}}}
     if(c.fw)for(const f of c.fw)if(!f.done&&c.t>=f.at){f.done=1;try{FX().burst(f.x,f.y-30,'hsl('+f.h+',100%,65%)',10,150);}catch(e){}}
     return c.t<Math.max((c.rings-1)*c.gap+c.R/c.speed+0.35,c.fw?1.4:0);},
   draw(c,ctx,v){const col=c.fx.colors||['#ffffff','#c86bff','#6b2cff'],X=v.sx(c.x),Y=v.sy(c.y);
     const shape={notes:'note',stars:'star',moon:'crescent',hearts:'heart',bubbles:'bubble',leaves:'leaf',flakes:'flake'}[c.fx.deco]||null;
     for(let i=0;i<c.rings;i++){const u=c.t-i*c.gap;if(u<0)continue;const r=Math.min(c.R,u*c.speed)*v.k,fade=Math.max(0,1-u*c.speed/(c.R+60));
       ctx.save();ctx.globalAlpha=fade;ctx.globalCompositeOperation='lighter';
       ctx.strokeStyle=c.fx.deco==='rainbow'?'hsla('+((u*400+i*90)%360)+',100%,65%,0.9)':rgba(col[1],0.9);ctx.lineWidth=Math.max(3,10*v.k*fade);ctx.beginPath();ctx.ellipse(X,Y,r,r*0.62,0,0,TAU);ctx.stroke();
       ctx.strokeStyle=rgba(col[0],0.9);ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(X,Y,r*0.97,r*0.6,0,0,TAU);ctx.stroke();ctx.restore();
       if(shape)for(let j=0;j<8;j++){const a=j/8*TAU+u*1.5;sprite(ctx,shape,c.fx.pal||c.move.type,X+Math.cos(a)*r,Y+Math.sin(a)*r*0.62,1.5*v.k,0,Math.floor(c.t*10),fade);}}
     glow(ctx,X,Y,40*v.k*Math.max(0,1-c.t*2),rgba(col[0],0.8),rgba(col[1],0));
     if(c.fw){ctx.save();ctx.globalCompositeOperation='lighter';for(const f of c.fw){const u=c.t-f.at;if(u<0||u>0.9)continue;const FX0=v.sx(f.x),FY0=v.sy(f.y)-30*v.k,a=1-u/0.9;
       if(u<0.12){ctx.strokeStyle='hsla('+f.h+',100%,80%,0.9)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(FX0,FY0+70*v.k*(1-u/0.12));ctx.lineTo(FX0,FY0+70*v.k*(1-u/0.12)+14*v.k);ctx.stroke();continue;}
       const w=u-0.12,rr=(16+95*Math.sqrt(w))*v.k;glow(ctx,FX0,FY0,rr*0.35,'hsla('+f.h+',100%,90%,'+(0.9*a)+')','hsla('+f.h+',100%,60%,0)');
       for(let j=0;j<f.n;j++){const ang=j/f.n*TAU,px=FX0+Math.cos(ang)*rr,py=FY0+Math.sin(ang)*rr+60*w*w*v.k;ctx.fillStyle='hsla('+((f.h+j*8)%360)+',100%,'+(62+18*Math.sin(j+u*30))+'%,'+a+')';ctx.fillRect(px-3,py-3,6,6);
         ctx.strokeStyle='hsla('+f.h+',100%,62%,'+(a*0.85)+')';ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(FX0+Math.cos(ang)*rr*0.6,FY0+Math.sin(ang)*rr*0.6+40*w*w*v.k);ctx.lineTo(px,py);ctx.stroke();}}ctx.restore();}}};

 // ---------------------------------------------------------------- COMET (the game's Z ASTEROID field: a giant game sprite falls from the sky)
 S.comet={cast(c){const n=Math.max(1,Math.min(4,Math.round(c.move.count||1)));c.list=[];const used=[],p=c.player,Cb=B()?.combat,V=VFX();
     for(let i=0;i<n;i++){const t=densest(p,380,used)||nearest(p.x,p.y,460);if(!t)break;used.push(t);c.list.push({x:t.x+rnd(-15,15),y:t.y+rnd(-15,15),at:i*0.22,done:false});}
     if(!c.list.length)return null;c.R=c.move.radius||150;c.fall=c.fx.fall||0.75;
     c.engine=!c.fx.rocket&&!!(Cb&&typeof Cb.addField==='function'&&V);
     if(c.engine){const vis={proj:c.fx.shape||'rock',pal:c.fx.pal||c.move.type};
       for(const m of c.list)Cb.addField({kind:'meteor',big:!!c.fx.big,owner:p,ghost:c.ghost,m:c.move,col:typeColor(c),vis,x:m.x,y:m.y,t:-m.at,fall:c.fall,r:c.R,dmg:c.ghost?0:baseDmg(c),scale:c.fx.scale||(c.fx.big?6:5),drop:c.fx.drop||820});}
     return c;},
   update(c,dt){c.t+=dt;for(const m of c.list)if(!m.done&&c.t>=m.at+c.fall){m.done=true;if(!c.engine)hitCircle(c,m.x,m.y,c.R,{knock:170});else if(c.fx.stun||c.fx.burn||c.fx.slow){for(const e of enemies())if(Math.hypot(e.x-m.x,e.y-m.y)<c.R){const st=c.fx.stun;if(st&&Math.random()<st.chance&&e.applyStun)e.applyStun(st.dur);if(c.fx.burn&&e.applyBurn)e.applyBurn(1);if(c.fx.slow&&e.applySlow)e.applySlow(c.fx.slow,1.4);}}
       kick(0.16);ring(m.x,m.y,10,c.R*1.15,typeColor(c),0.55,7);burst(m.x,m.y,typeColor(c),26,260);for(let j=0;j<8;j++)sp(c.fx.debris||'rock',c.fx.pal||c.move.type,m.x,m.y,{vx:rnd(-160,160),vy:-rnd(100,240),life:0.7,grav:420});}
     return c.t<c.list[c.list.length-1].at+c.fall+0.8;},
   draw(c,ctx,v){const col=c.fx.colors||['#ffffff','#ff9ad8','#a040ff'];
     for(const m of c.list){const u=c.t-m.at;if(u<0)continue;const X=v.sx(m.x),Y=v.sy(m.y),R=c.R*v.k;
       if(u<c.fall){const q=u/c.fall;ctx.strokeStyle=rgba(col[1],0.3+0.6*q);ctx.lineWidth=2+2*q;ctx.beginPath();ctx.ellipse(X,Y,R*q,R*q*0.5,0,0,TAU);ctx.stroke();
         ctx.fillStyle=rgba(col[2],0.12+0.15*q);ctx.beginPath();ctx.ellipse(X,Y,R*q,R*q*0.5,0,0,TAU);ctx.fill();
         if(c.fx.rocket){const sx=X+(1-q)*260*v.k,sy=Y-(1-q)*620*v.k;drawRocket(ctx,sx,sy,Math.atan2(620,-260),46*v.k,c.t);}
         else if(!c.engine){const sx=X-(1-q)*420*v.k,sy=Y-(1-q)*620*v.k;glow(ctx,sx,sy,30*v.k,rgba(col[0],1),rgba(col[1],0));}
         else{const sc=c.fx.scale||(c.fx.big?6:5),drop=c.fx.drop||820,gx=v.sx(m.x+(1-q)*drop*0.24),gy=v.sy(m.y-(1-q)*drop-6*sc);ctx.save();ctx.globalCompositeOperation='lighter';
           const tl=ctx.createLinearGradient(gx,gy,gx+70*v.k,gy-290*v.k);tl.addColorStop(0,rgba(col[1],0.75));tl.addColorStop(1,rgba(col[2],0));ctx.strokeStyle=tl;ctx.lineCap='round';ctx.lineWidth=sc*9*v.k;ctx.beginPath();ctx.moveTo(gx,gy);ctx.lineTo(gx+70*v.k,gy-290*v.k);ctx.stroke();
           ctx.lineWidth=sc*3.5*v.k;ctx.strokeStyle=rgba(col[0],0.55);ctx.beginPath();ctx.moveTo(gx,gy);ctx.lineTo(gx+40*v.k,gy-170*v.k);ctx.stroke();glow(ctx,gx,gy,sc*13*v.k,rgba(col[1],0.55),rgba(col[2],0));ctx.restore();}continue;}
       const w=u-c.fall,fade=Math.max(0,1-w/0.8);ctx.save();ctx.globalAlpha=fade;
       ctx.fillStyle='rgba(20,10,10,'+(0.45*fade)+')';ctx.beginPath();ctx.ellipse(X,Y,R*0.8,R*0.4,0,0,TAU);ctx.fill();
       ctx.globalCompositeOperation='lighter';glow(ctx,X,Y,R*(0.6+w*1.4),rgba(col[0],0.95),rgba(col[2],0));
       ctx.strokeStyle=rgba(col[1],0.9);ctx.lineWidth=6*fade+1;ctx.beginPath();ctx.ellipse(X,Y,R*(0.4+w*2.2),R*(0.4+w*2.2)*0.5,0,0,TAU);ctx.stroke();ctx.restore();}}};

 // ---------------------------------------------------------------- VORTEX (the game's real Z TORNADOES, steered by us; we do the damage)
 S.vortex={cast(c){const n=Math.max(1,Math.min(4,Math.round(c.move.count||2))),p=c.player,P=B()?.projectiles;c.list=[];c.life=c.fx.life||3;c.R=c.move.radius||90;
     for(let i=0;i<n;i++){const a=i/n*TAU,w={x:p.x+Math.cos(a)*40,y:p.y+Math.sin(a)*30,tick:i*0.1,parts:[],proj:null};
       if(P&&typeof P.spawn==='function'&&c.fx.zTornado!==false){try{w.proj=P.spawn({owner:p,mid:'ultfx',ultFx:true,tornado:true,ghost:true,friendly:true,x:w.x,y:w.y,vx:0,vy:0,dmg:0,r:c.R*0.6,life:c.life,pierce:Infinity,color:typeColor(c),hits:new Set()});}catch(e){}}
       c.list.push(w);}
     return c;},
   update(c,dt){c.t+=dt;const all=enemies();
     for(const w of c.list){const t=nearest(w.x,w.y,600,all);if(t){const dx=t.x-w.x,dy=t.y-w.y,d=Math.hypot(dx,dy)||1;w.x+=dx/d*(c.fx.speed||130)*dt;w.y+=dy/d*(c.fx.speed||130)*dt;}
       if(w.proj){w.proj.x=w.x;w.proj.y=w.y;w.proj.vx=0;w.proj.vy=0;}
       for(const e of all){const dx=w.x-e.x,dy=w.y-e.y,d=Math.hypot(dx,dy);if(d>c.R*1.6||d<5)continue;const pl=120*(e.boss?0.3:1)*dt;e.x+=dx/d*Math.min(pl,d-5);e.y+=dy/d*Math.min(pl,d-5);}
       w.tick-=dt;if(w.tick<=0){w.tick=c.fx.tick||0.3;hitCircle(c,w.x,w.y,c.R,{knock:20});if(c.fx.bolts&&Math.random()<0.5){try{FX().zap(w.x+rnd(-20,20),w.y-160,w.x+rnd(-30,30),w.y,0.1,typeColor(c),30,1.8);}catch(e){}}}
       if(w.parts.length<12&&Math.random()<0.5)w.parts.push({a:rnd(0,TAU),h:0,r:rnd(0.6,1.1),f:(Math.random()*3)|0});for(const q of w.parts){q.a+=dt*5;q.h+=dt*75;}w.parts=w.parts.filter(q=>q.h<130);}
     if(c.t>=c.life)for(const w of c.list)if(w.proj)w.proj.life=0;
     return c.t<c.life;},
   draw(c,ctx,v){const col=c.fx.colors||['#ffffff','#bff0d0','#5fcb6a'],fade=Math.min(1,(c.life-c.t)/0.3);
     for(const w of c.list){const X=v.sx(w.x),Y=v.sy(w.y),R=c.R*v.k;
       if(!w.proj){ctx.save();ctx.globalAlpha=fade*0.95;for(let j=0;j<7;j++){const h=j*16*v.k,rr=R*(0.35+j*0.1);ctx.strokeStyle=rgba(j%2?col[1]:col[2],0.75);ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(X+Math.sin(c.t*5+j)*6*v.k,Y-h,rr,rr*0.32,0,c.t*8+j,c.t*8+j+4.4);ctx.stroke();}ctx.restore();}
       ctx.save();ctx.globalAlpha=fade*0.6;ctx.fillStyle=rgba(col[2],0.25);ctx.beginPath();ctx.ellipse(X,Y,R,R*0.4,0,0,TAU);ctx.fill();ctx.restore();
       for(const q of w.parts)sprite(ctx,c.fx.shape||'leaf',c.fx.pal||c.move.type,X+Math.cos(q.a)*R*q.r*(0.7+q.h/110),Y-q.h*v.k+Math.sin(q.a)*R*0.25,0.8*v.k,q.a,q.f,fade*Math.min(1,(130-q.h)/30));}}};

 // ---------------------------------------------------------------- GEYSER (pillars; game sprite spray; optional lingering Fire/Toxic Z ground field)
 S.geyser={cast(c){const n=Math.max(1,Math.round(c.move.count||4)),p=c.player;c.list=[];
     if(c.fx.ring){for(let i=0;i<n;i++){const a=i/n*TAU,r=c.fx.ring;c.list.push({x:p.x+Math.cos(a)*r,y:p.y+Math.sin(a)*r*0.8,at:i*0.04});}}
     else{const L=enemies().filter(e=>Math.hypot(e.x-p.x,e.y-p.y)<420).sort(()=>Math.random()-0.5);if(!L.length)return null;for(let i=0;i<n;i++){const e=L[i%L.length];c.list.push({x:e.x+(i>=L.length?rnd(-50,50):0),y:e.y+(i>=L.length?rnd(-40,40):0),at:i*0.09});}}
     c.R=c.move.radius||60;c.warn=c.fx.warn||0.35;return c;},
   update(c,dt){c.t+=dt;for(const g of c.list)if(!g.done&&c.t>=g.at+c.warn){g.done=true;hitCircle(c,g.x,g.y,c.R,{knock:110});kick(0.03);
       for(let j=0;j<6;j++)sp(c.fx.shape||'fire',c.fx.pal||c.move.type,g.x+rnd(-c.R*0.4,c.R*0.4),g.y,{vx:rnd(-50,50),vy:-rnd(160,300),life:0.7,grav:260});
       if(c.fx.patch&&!c.ghost){const Cb=B()?.combat,V=VFX();try{Cb.addField({kind:'patch',big:!!c.fx.patch.big,bog:!!c.fx.patch.bog,owner:c.player,ghost:c.ghost,m:{id:c.move.id,type:c.move.type,burn:c.fx.burn?1:0,poison:c.fx.poison?1:0,knock:0},col:typeColor(c),vis:V.forType(c.move.type),x:g.x,y:g.y,t:0,life:c.fx.patch.life||2.5,r:c.R*1.1,tick:0,dmg:baseDmg(c,c.fx.patch.mult||0.25),seed:Math.random()*9});}catch(e){}}}
     return c.t<c.list[c.list.length-1].at+c.warn+0.8;},
   draw(c,ctx,v){const col=c.fx.colors||['#fff6c8','#ff9a3d','#ff3d1a'];
     for(const g of c.list){const u=c.t-g.at;if(u<0)continue;const X=v.sx(g.x),Y=v.sy(g.y),R=c.R*v.k;
       if(u<c.warn){const q=u/c.warn;ctx.fillStyle=rgba(col[2],0.25+0.3*q);ctx.beginPath();ctx.ellipse(X,Y,R*q,R*q*0.45,0,0,TAU);ctx.fill();continue;}
       const w=u-c.warn,h=Math.min(1,w/0.12)*(c.fx.height||220)*v.k,fade=Math.max(0,1-Math.max(0,w-0.35)/0.45);
       ctx.save();ctx.globalAlpha=fade;ctx.globalCompositeOperation='lighter';
       const gr=ctx.createLinearGradient(X,Y-h,X,Y);gr.addColorStop(0,rgba(col[1],0));gr.addColorStop(0.3,rgba(col[1],0.8));gr.addColorStop(1,rgba(col[0],1));ctx.fillStyle=gr;
       ctx.beginPath();ctx.moveTo(X-R*0.55,Y);for(let s=0;s<=10;s++){const yy=Y-h*s/10;ctx.lineTo(X-R*(0.55-0.25*s/10)+Math.sin(w*30+s)*4*v.k,yy);}for(let s=10;s>=0;s--){const yy=Y-h*s/10;ctx.lineTo(X+R*(0.55-0.25*s/10)+Math.sin(w*30+s+2)*4*v.k,yy);}ctx.closePath();ctx.fill();
       glow(ctx,X,Y,R*1.1,rgba(col[0],0.8),rgba(col[2],0));ctx.restore();
       for(let j=0;j<3;j++)sprite(ctx,c.fx.shape||'fire',c.fx.pal||c.move.type,X+Math.sin(w*8+j*2)*R*0.3,Y-h*(0.35+j*0.25),1.6*v.k,0,Math.floor(c.t*12)+j,fade);}}};

 // ---------------------------------------------------------------- ORBS (GAME sprites burst out and home in; game burst on impact)
 S.orbs={cast(c){const n=Math.max(1,Math.round(c.move.count||6)),p=c.player;c.list=[];const m0=mouth(p,Number(p.aim)||0);
     for(let i=0;i<n;i++){const a=i/n*TAU;c.list.push({x:m0.x,y:m0.y,vx:Math.cos(a)*220,vy:Math.sin(a)*220,t:0,trail:[],dead:false,f:(Math.random()*4)|0});}
     c.life=c.fx.life||2.2;c.size=c.fx.size||12;return c;},
   update(c,dt){c.t+=dt;const all=enemies();
     for(const o of c.list){if(o.dead)continue;o.t+=dt;const tg=nearest(o.x,o.y,700,all);
       if(tg&&o.t>0.18){const dx=tg.x-o.x,dy=tg.y-o.y,d=Math.hypot(dx,dy)||1,spd=c.fx.speed||380;o.vx+=(dx/d*spd-o.vx)*Math.min(1,dt*(c.fx.homing||6));o.vy+=(dy/d*spd-o.vy)*Math.min(1,dt*(c.fx.homing||6));}
       o.x+=o.vx*dt;o.y+=o.vy*dt;o.trail.push({x:o.x,y:o.y});if(o.trail.length>10)o.trail.shift();
       if(tg&&Math.hypot(tg.x-o.x,tg.y-o.y)<(tg.r||12)+c.size){o.dead=true;o.boomT=0;o.bx=o.x;o.by=o.y;hitCircle(c,o.x,o.y,c.fx.splash||40,{knock:60});burst(o.x,o.y,typeColor(c),8,140);}
       if(o.t>c.life)o.dead=true;}
     for(const o of c.list)if(o.boomT!=null)o.boomT+=dt;
     return c.list.some(o=>!o.dead||(o.boomT!=null&&o.boomT<0.35));},
   draw(c,ctx,v){const col=c.fx.colors||['#ffffff','#c86bff','#6b2cff'],shape=c.fx.shape||'ball';
     for(const o of c.list){
       if(!o.dead){ctx.save();ctx.globalCompositeOperation='lighter';o.trail.forEach((q,i)=>glow(ctx,v.sx(q.x),v.sy(q.y),c.size*v.k*(i/o.trail.length),rgba(col[1],0.35),rgba(col[2],0)));glow(ctx,v.sx(o.x),v.sy(o.y),c.size*1.6*v.k,rgba(col[0],0.7),rgba(col[1],0));ctx.restore();
         sprite(ctx,shape,c.fx.pal||c.move.type,v.sx(o.x),v.sy(o.y),(c.fx.spriteScale||1.6)*v.k,Math.atan2(o.vy,o.vx),Math.floor(c.t*12)+o.f);}
       else if(o.boomT!=null&&o.boomT<0.35){const q=o.boomT/0.35;ctx.save();ctx.globalCompositeOperation='lighter';glow(ctx,v.sx(o.bx),v.sy(o.by),(c.fx.splash||40)*v.k*(0.5+q),rgba(col[0],0.9*(1-q)),rgba(col[2],0));ctx.restore();}}}};

 // ---------------------------------------------------------------- PHANTOM DASH (afterimage streak + game slash/burst at the end)
 S.dash={cast(c){const p=c.player,t=nearest(p.x,p.y,(c.move.radius||300)+80);if(!t)return null;const a=Math.atan2(t.y-p.y,t.x-p.x),L=wallClip(p.x,p.y,a,c.move.radius||300);
     c.ax=p.x;c.ay=p.y;c.bx=p.x+Math.cos(a)*L;c.by=p.y+Math.sin(a)*L;c.ang=a;c.w=c.move.width||60;c.dur=0.18;c.skip=new Set();return c;},
   update(c,dt){c.t+=dt;const q=Math.min(1,c.t/c.dur),hx=c.ax+(c.bx-c.ax)*q,hy=c.ay+(c.by-c.ay)*q;hitLine(c,c.ax,c.ay,hx,hy,c.w,{skip:c.skip,knock:120});
     if(q>=1&&!c.burst){c.burst=1;hitCircle(c,c.bx,c.by,c.fx.burst||90,{mult:c.fx.burstMult||1,knock:160});kick(0.1);burst(c.bx,c.by,typeColor(c),20,220);ring(c.bx,c.by,8,c.fx.burst||90,typeColor(c),0.4,5);
       try{FX().slash(c.bx,c.by,c.ang,(c.fx.burst||90)*0.8,1.4,typeColor(c),{pal:c.fx.pal||c.move.type});}catch(e){}}return c.t<c.dur+0.6;},
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
