/* PRIMAL OUTBREAK: when Primal Kyogre and Primal Groudon are on the field together (co-op, and no Mega Rayquaza's
   Delta Stream to calm things down), their domains collide. The screen splits between them: the Primordial Sea on
   Kyogre's side, Desolate Land on Groudon's side, and the border surges back and forth as each tries to dominate.
   Both Pokemon become Enraged and deal 2x damage while it lasts.
   js/primal-kyogre.js and js/primal-groudon.js clip their own domain to their half (window.PS_PRIMAL_OUTBREAK.clip);
   this file draws the OTHER player's half (your game only renders your own domain), the clash front and the auras. */
(()=>{'use strict';
 const TAU=Math.PI*2,bridge=()=>window.PS_MEGA_BRIDGE_V5,KYOGRE='382-primal',GROUDON='383-primal';
 const TUNE={dmg:2,banner:2.6};
 const canvas=document.createElement('canvas');canvas.id='ps-primal-outbreak';canvas.setAttribute('aria-hidden','true');
 canvas.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:4;display:none';document.body.append(canvas);
 const ctx=canvas.getContext('2d');
 let last=0,clock=0,wasOn=false,since=0;
 const drops=[],motes=[],sparks=[];
 function players(){const b=bridge(),list=[];try{list.push(...(b?.game?.everyone?.()||[]));}catch(e){}const p=b?.game?.player;if(p&&!list.includes(p))list.push(p);return list.filter(q=>q&&!q.dead&&Number.isFinite(q.x));}
 const formOf=q=>q.megaForm||q.mon?.mega||'';
 function pair(){
   if(window.PS_DELTA_STREAM?.active?.())return null;           // Mega Rayquaza's winds keep them apart
   const L=players(),k=L.find(q=>formOf(q)===KYOGRE),g=L.find(q=>formOf(q)===GROUDON);
   return k&&g&&bridge()?.game?.state==='playing'?{k,g}:null;
 }
 function view(){const b=bridge(),cam=b?.camera,game=document.getElementById('game');if(!cam||!game||typeof cam.left!=='function')return null;
   const rect=game.getBoundingClientRect(),k=cam.scale*(cam._cw>0?rect.width/cam._cw:1);if(!(k>0))return null;return {k,rect,left:cam.left(),top:cam.top()};}
 // The border: perpendicular to the line from Kyogre to Groudon, through their midpoint, pushed back and forth.
 function front(P,v){
   let nx=P.g.x-P.k.x,ny=P.g.y-P.k.y;const d=Math.hypot(nx,ny);if(d<1){nx=1;ny=0;}else{nx/=d;ny/=d;}
   const push=(Math.sin(clock*.55)*.6+Math.sin(clock*1.7+1)*.25+Math.sin(clock*3.1)*.08)*Math.min(260,Math.max(80,d*.35));
   const mx=(P.k.x+P.g.x)/2+nx*push,my=(P.k.y+P.g.y)/2+ny*push;
   const sx=x=>v.rect.left+(x-v.left)*v.k,sy=y=>v.rect.top+(y-v.top)*v.k;
   return {nx,ny,X:sx(mx),Y:sy(my),sx,sy};
 }
 // Clip a 2D context to one side of the border (screen space). who: 'kyogre' | 'groudon'.
 function clip(c2,who){
   const P=pair(),v=view();if(!P||!v)return;const F=front(P,v),s=who==='groudon'?1:-1,big=Math.hypot(innerWidth,innerHeight)*2,tx=-F.ny,ty=F.nx;
   c2.beginPath();c2.moveTo(F.X+tx*big,F.Y+ty*big);c2.lineTo(F.X-tx*big,F.Y-ty*big);c2.lineTo(F.X-tx*big+F.nx*big*s,F.Y-ty*big+F.ny*big*s);c2.lineTo(F.X+tx*big+F.nx*big*s,F.Y+ty*big+F.ny*big*s);c2.closePath();c2.clip();
 }
 window.PS_PRIMAL_OUTBREAK={active:()=>!!pair(),clip,pair};

 // ---- 2x damage while the outbreak lasts (local player only; stats are base stats so nothing can hide it) ----
 function buff(p,on){
   if(on&&!p.__outbreak&&(formOf(p)===KYOGRE||formOf(p)===GROUDON)){p.__outbreak=true;if(Number.isFinite(p.baseAtk))p.baseAtk*=TUNE.dmg;if(Number.isFinite(p.baseSpa))p.baseSpa*=TUNE.dmg;}
   else if(!on&&p.__outbreak){delete p.__outbreak;if(formOf(p)===KYOGRE||formOf(p)===GROUDON){if(Number.isFinite(p.baseAtk))p.baseAtk/=TUNE.dmg;if(Number.isFinite(p.baseSpa))p.baseSpa/=TUNE.dmg;}}
 }

 // ---- the half that belongs to the other player ----
 function seaHalf(R,k){ // Primordial Sea: dark water and slanting rain
   ctx.fillStyle='rgba(1,8,22,.42)';ctx.fillRect(R.left,R.top,R.width,R.height);ctx.fillStyle='rgba(2,22,61,.2)';ctx.fillRect(R.left,R.top,R.width,R.height);
   while(drops.length<260)drops.push({x:Math.random(),y:Math.random(),sp:.7+Math.random(),len:18+Math.random()*25});
   ctx.strokeStyle='rgba(178,222,239,.5)';ctx.lineWidth=1.3;ctx.beginPath();
   for(const q of drops){const x=R.left+((q.x-clock*.11)%1+1)%1*R.width,y=R.top+((q.y+clock*q.sp*2)%1)*R.height;ctx.moveTo(x,y);ctx.lineTo(x-10,y+q.len);}ctx.stroke();
 }
 function landHalf(R,k){ // Desolate Land: heat haze, harsh light and rising motes
   ctx.fillStyle='rgba(255,150,60,.10)';ctx.fillRect(R.left,R.top,R.width,R.height);
   ctx.save();ctx.globalCompositeOperation='lighter';
   for(let i=0;i<6;i++){const base=R.left+R.width*(.04+i*.18)+Math.sin(clock*.35+i*1.7)*R.width*.03,w=R.width*.04,a=.12+.05*Math.sin(clock*1.1+i*2.1);
     const g=ctx.createLinearGradient(base,R.top,base+R.height*.35,R.top+R.height);g.addColorStop(0,'rgba(255,250,215,'+a+')');g.addColorStop(1,'rgba(255,160,60,0)');
     ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(base-w*.35,R.top);ctx.lineTo(base+w*.35,R.top);ctx.lineTo(base+w+R.height*.4,R.top+R.height);ctx.lineTo(base-w+R.height*.4,R.top+R.height);ctx.closePath();ctx.fill();}
   ctx.restore();
   while(motes.length<60)motes.push({x:Math.random(),y:Math.random(),vy:.05+Math.random()*.08,c:Math.random()<.5?'#ffd27a':'#fff2c4'});
   for(const m of motes){m.y-=m.vy/60;if(m.y<0)m.y+=1;ctx.fillStyle=m.c;ctx.globalAlpha=.6;ctx.fillRect(R.left+m.x*R.width,R.top+m.y*R.height,2,2);}ctx.globalAlpha=1;
 }
 function frame(ts){
   requestAnimationFrame(frame);const dt=Math.min(.04,last?(ts-last)/1000:0);last=ts;
   const b=bridge(),me=b?.game?.player,P=pair();
   if(me)buff(me,!!P);
   if(!P){if(wasOn){wasOn=false;canvas.style.display='none';}return;}
   const v=view();if(!v)return;
   if(!wasOn){wasOn=true;since=0;try{b.camera?.kick?.(.6);}catch(e){}}
   clock+=dt;since+=dt;
   const dpr=Math.min(2,devicePixelRatio||1),W=Math.round(innerWidth*dpr),H=Math.round(innerHeight*dpr);
   if(canvas.width!==W||canvas.height!==H){canvas.width=W;canvas.height=H;canvas.style.width=innerWidth+'px';canvas.style.height=innerHeight+'px';}
   canvas.style.display='block';ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,innerWidth,innerHeight);
   const R=v.rect,k=v.k,F=front(P,v),mine=formOf(me);
   ctx.save();ctx.beginPath();ctx.rect(R.left,R.top,R.width,R.height);ctx.clip();
   // the other player's half (yours is drawn by your own Primal script, clipped to your side)
   if(mine!==KYOGRE){ctx.save();clip(ctx,'kyogre');seaHalf(R,k);ctx.restore();}
   if(mine!==GROUDON){ctx.save();clip(ctx,'groudon');landHalf(R,k);ctx.restore();}
   // the clash front: a wall of steam, with lightning crackling and embers spitting where water meets fire
   const tx=-F.ny,ty=F.nx,span=Math.hypot(R.width,R.height);
   ctx.save();ctx.globalCompositeOperation='lighter';
   for(let i=-14;i<=14;i++){const d=i/14*span*.6,wob=Math.sin(clock*2+i*.9)*14*k,x=F.X+tx*d+F.nx*wob,y=F.Y+ty*d+F.ny*wob,r=(46+18*Math.sin(clock*3+i*1.3))*k;
     const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(240,245,255,.32)');g.addColorStop(1,'rgba(200,210,230,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();}
   for(const [col,off,w] of [['rgba(255,120,40,.85)',6,4],['rgba(80,190,255,.85)',-6,4],['rgba(255,255,255,.9)',0,1.6]]){
     ctx.strokeStyle=col;ctx.lineWidth=w*Math.max(1,k*.7);ctx.beginPath();
     for(let i=-30;i<=30;i++){const d=i/30*span*.6,wob=Math.sin(clock*7+i*1.7)*6*k+Math.sin(clock*13+i*3.1)*3*k,x=F.X+tx*d+F.nx*(wob+off*k),y=F.Y+ty*d+F.ny*(wob+off*k);i===-30?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();}
   if(Math.random()<dt*10){const d=(Math.random()-.5)*span*.9;sparks.push({x:F.X+tx*d,y:F.Y+ty*d,t:0,bolt:Math.random()<.4,vx:F.nx*(Math.random()<.5?1:-1),seed:Math.random()*99});}
   for(let i=sparks.length-1;i>=0;i--){const q=sparks[i];q.t+=dt;if(q.t>.45){sparks.splice(i,1);continue;}const f=1-q.t/.45;
     if(q.bolt){ctx.strokeStyle='rgba(190,230,255,'+f+')';ctx.lineWidth=2;ctx.beginPath();let x=q.x,y=q.y;ctx.moveTo(x,y);for(let j=0;j<6;j++){x+=(Math.sin(q.seed+j*2.3)*18-tx*12)*k;y+=(Math.cos(q.seed+j*1.7)*18-ty*12)*k;ctx.lineTo(x,y);}ctx.stroke();}
     else{for(let j=0;j<5;j++){ctx.fillStyle='rgba(255,'+(140+j*20)+',60,'+f+')';ctx.fillRect(q.x+q.vx*q.t*90*k+Math.sin(q.seed+j)*14,q.y-q.t*70*k+j*4,3,3);}}}
   // both Primals are Enraged: a pulsing aura in their own colour
   for(const [q,col] of [[P.k,'60,150,255'],[P.g,'255,60,20']]){const X=F.sx(q.x),Y=F.sy(q.y-(Number(q.bodyH)||48)*.45),r=(Number(q.bodyH)||48)*k*(1.15+.1*Math.sin(clock*8));
     const g=ctx.createRadialGradient(X,Y,r*.2,X,Y,r);g.addColorStop(0,'rgba('+col+',0)');g.addColorStop(.6,'rgba('+col+',.3)');g.addColorStop(1,'rgba('+col+',0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(X,Y,r,0,TAU);ctx.fill();}
   ctx.restore();
   // the moment the domains collide: a split flash and the banner
   if(since<TUNE.banner){const u=since/TUNE.banner,fl=Math.max(0,1-since/.35);
     if(fl>0){ctx.save();clip(ctx,'kyogre');ctx.fillStyle='rgba(120,200,255,'+fl*.7+')';ctx.fillRect(R.left,R.top,R.width,R.height);ctx.restore();ctx.save();clip(ctx,'groudon');ctx.fillStyle='rgba(255,140,60,'+fl*.7+')';ctx.fillRect(R.left,R.top,R.width,R.height);ctx.restore();}
     const a=Math.min(1,since/.2)*(u>.75?Math.max(0,(1-u)/.25):1),sc=1+.25*Math.max(0,1-since/.25),X=R.left+R.width/2,Y=R.top+R.height*.3;
     ctx.save();ctx.globalAlpha=a;ctx.translate(X,Y);ctx.scale(sc,sc);ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='900 '+Math.round(Math.min(64,R.width/12))+'px Pixelify,Fredoka,system-ui,sans-serif';
     ctx.lineWidth=8;ctx.strokeStyle='rgba(20,0,20,.85)';ctx.strokeText('PRIMAL OUTBREAK!',0,0);
     const g=ctx.createLinearGradient(-R.width*.3,0,R.width*.3,0);g.addColorStop(0,'#5ab8ff');g.addColorStop(.5,'#ffffff');g.addColorStop(1,'#ff6a2a');ctx.fillStyle=g;ctx.fillText('PRIMAL OUTBREAK!',0,0);
     ctx.font='700 '+Math.round(Math.min(22,R.width/34))+'px Pixelify,Fredoka,system-ui,sans-serif';ctx.lineWidth=5;ctx.strokeText('Kyogre and Groudon are Enraged! 2x damage',0,Math.min(48,R.width/16));ctx.fillStyle='#fff3d6';ctx.fillText('Kyogre and Groudon are Enraged! 2x damage',0,Math.min(48,R.width/16));
     ctx.restore();}
   ctx.restore();
 }
 requestAnimationFrame(frame);
})();
