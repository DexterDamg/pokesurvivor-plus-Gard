/* Delta Stream: Mega Rayquaza's domain. Very harsh winds tear across the whole screen while a Mega Rayquaza is on
   the field. The rules (every weather cancelled, Primal domains negated, Rayquaza 2x speed / 2x damage) live in
   js/mega-native.js (window.PS_DELTA_STREAM); this file draws the winds and keeps any weather blown away.
   Rendering never moves actors. */
(()=>{'use strict';
 const TAU=Math.PI*2,bridge=()=>window.PS_MEGA_BRIDGE_V5;
 const canvas=document.createElement('canvas');canvas.id='ps-delta-stream';canvas.setAttribute('aria-hidden','true');
 canvas.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:3;display:none';document.body.append(canvas);
 const ctx=canvas.getContext('2d');
 const rnd=(a,b)=>a+Math.random()*(b-a);
 let last=0,clock=0,on=false,strength=0;
 const streaks=[],gusts=[],debris=[];
 function view(){
   const b=bridge(),cam=b?.camera,game=document.getElementById('game');
   if(!cam||!game||typeof cam.left!=='function')return null;
   const rect=game.getBoundingClientRect(),k=cam.scale*(cam._cw>0?rect.width/cam._cw:1);
   if(!(k>0))return null;
   return {k,rect,left:cam.left(),top:cam.top()};
 }
 // The wind keeps a strong prevailing direction that slowly swings back and forth.
 const windAngle=()=>-.32+Math.sin(clock*.23)*.35+Math.sin(clock*.71)*.08;
 function spawnStreak(R,a,anywhere){
   const len=rnd(90,260),speed=rnd(1100,1900),c=Math.cos(a),s=Math.sin(a);
   // enter from the upwind edges (or anywhere when filling the screen the first time)
   let x,y;if(anywhere){x=R.left+Math.random()*R.width;y=R.top+Math.random()*R.height;}
   else if(Math.random()<.6){x=R.left-len*c-20;y=R.top+Math.random()*R.height;}else{x=R.left+Math.random()*R.width;y=s>0?R.top-len*s-20:R.top+R.height+20;}
   streaks.push({x,y,len,speed,w:rnd(1.2,3.4),a:rnd(.28,.62),wob:rnd(0,TAU),tint:Math.random()<.25?1:0});
 }
 function frame(ts){
   requestAnimationFrame(frame);const b=bridge(),p=b?.game?.player,dt=Math.min(.04,last?(ts-last)/1000:0);last=ts;
   const active=!!window.PS_DELTA_STREAM?.active?.()&&b?.game?.state==='playing';
   strength+=((active?1:0)-strength)*Math.min(1,dt*3);
   if(!active&&strength<.02){if(on){on=false;canvas.style.display='none';streaks.length=gusts.length=debris.length=0;}return;}
   if(active)try{b.weather?.clear?.();}catch(e){}            // any weather that tries to start is blown away at once
   const v=view();if(!v){canvas.style.display='none';return;}
   clock+=dt;on=true;
   const dpr=Math.min(2,devicePixelRatio||1),W=Math.round(innerWidth*dpr),H=Math.round(innerHeight*dpr);
   if(canvas.width!==W||canvas.height!==H){canvas.width=W;canvas.height=H;canvas.style.width=innerWidth+'px';canvas.style.height=innerHeight+'px';}
   canvas.style.display='block';ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,innerWidth,innerHeight);
   const R=v.rect,k=v.k,a=windAngle(),c=Math.cos(a),s=Math.sin(a),A=strength;
   ctx.save();ctx.beginPath();ctx.rect(R.left,R.top,R.width,R.height);ctx.clip();
   // a cool, pale-green cast and darker, stormy edges
   ctx.fillStyle='rgba(170,255,215,'+(.09*A)+')';ctx.fillRect(R.left,R.top,R.width,R.height);
   let g=ctx.createRadialGradient(R.left+R.width/2,R.top+R.height/2,Math.min(R.width,R.height)*.3,R.left+R.width/2,R.top+R.height/2,Math.max(R.width,R.height)*.75);
   g.addColorStop(0,'rgba(20,60,50,0)');g.addColorStop(1,'rgba(10,40,35,'+(.32*A)+')');ctx.fillStyle=g;ctx.fillRect(R.left,R.top,R.width,R.height);

   // big sweeping gusts: wide translucent bands that roll across the screen
   if(gusts.length<7&&Math.random()<dt*3.2)gusts.push({off:rnd(-.6,.6),t:0,life:rnd(.9,1.6),w:rnd(.12,.3)});
   for(let i=gusts.length-1;i>=0;i--){const q=gusts[i];q.t+=dt;if(q.t>q.life){gusts.splice(i,1);continue;}
     const u=q.t/q.life,diag=Math.hypot(R.width,R.height),cx=R.left+R.width/2+(u-.5)*diag*1.6*c-q.off*diag*s*.5,cy=R.top+R.height/2+(u-.5)*diag*1.6*s+q.off*diag*c*.5,bw=q.w*diag;
     ctx.save();ctx.translate(cx,cy);ctx.rotate(a);g=ctx.createLinearGradient(0,-bw,0,bw);const al=.17*Math.sin(Math.PI*u)*A;
     g.addColorStop(0,'rgba(220,255,240,0)');g.addColorStop(.5,'rgba(220,255,240,'+al+')');g.addColorStop(1,'rgba(220,255,240,0)');
     ctx.fillStyle=g;ctx.fillRect(-diag*.4,-bw,diag*.8,bw*2);ctx.restore();}

   // the streaks themselves: long, fast, slightly wavering lines
   const want=Math.round(230*A);if(!streaks.length)for(let i=0;i<want;i++)spawnStreak(R,a,true);
   while(streaks.length<want)spawnStreak(R,a,false);
   ctx.lineCap='round';
   for(let i=streaks.length-1;i>=0;i--){const q=streaks[i];q.x+=c*q.speed*dt;q.y+=s*q.speed*dt+Math.sin(clock*6+q.wob)*20*dt;
     if(q.x-q.len*c>R.right+40||q.y-q.len*s>R.bottom+40||q.y-q.len*s<R.top-300&&s<0&&q.x>R.right){streaks.splice(i,1);continue;}
     const tx=q.x-c*q.len,ty=q.y-s*q.len;g=ctx.createLinearGradient(tx,ty,q.x,q.y);
     const col=q.tint?'150,255,190':'235,255,248';g.addColorStop(0,'rgba('+col+',0)');g.addColorStop(1,'rgba('+col+','+(q.a*A)+')');
     ctx.strokeStyle=g;ctx.lineWidth=q.w;ctx.beginPath();ctx.moveTo(tx,ty);ctx.quadraticCurveTo((tx+q.x)/2-s*8,(ty+q.y)/2+c*8,q.x,q.y);ctx.stroke();}
   if(streaks.length>want+20)streaks.splice(0,streaks.length-want-20);

   // leaves and grit tumbling along with the wind
   while(debris.length<Math.round(70*A)){const leaf=Math.random()<.55;debris.push({x:R.left-20+Math.random()*R.width*.2,y:R.top+Math.random()*R.height,vx:rnd(500,950),vy:rnd(-60,60),r:Math.random()*TAU,vr:rnd(-14,14),sz:leaf?rnd(3,5):rnd(1.2,2.2),leaf,col:leaf?(Math.random()<.5?'#7cc45a':'#c4a35a'):'#d8e4d0'});}
   for(let i=debris.length-1;i>=0;i--){const q=debris[i];q.x+=(c*q.vx-s*q.vy)*dt;q.y+=(s*q.vx+c*q.vy)*dt+Math.sin(clock*4+i)*30*dt;q.r+=q.vr*dt;
     if(q.x>R.right+30||q.y<R.top-60||q.y>R.bottom+60){debris.splice(i,1);continue;}
     ctx.save();ctx.translate(q.x,q.y);ctx.rotate(q.r);ctx.globalAlpha=.85*A;ctx.fillStyle=q.col;
     if(q.leaf){ctx.beginPath();ctx.ellipse(0,0,q.sz*k,q.sz*.45*k,0,0,TAU);ctx.fill();}else ctx.fillRect(-q.sz,-q.sz,q.sz*2,q.sz*2);ctx.restore();}

   // the eye of the storm: emerald currents spiralling around Mega Rayquaza
   const holder=window.PS_DELTA_STREAM?.holder?.();
   if(holder&&Number.isFinite(holder.x)){
     const X=R.left+(holder.x-v.left)*k,Y=R.top+(holder.y-(Number(holder.bodyH)||48)*.4-v.top)*k;
     ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
     for(let i=0;i<4;i++){const rr=(70+i*28)*k,sp=clock*(3.4-i*.5)*(i%2?-1:1),al=(.32-i*.05)*A;
       for(let j=0;j<3;j++){const st=sp+j*TAU/3;ctx.strokeStyle='rgba(140,255,190,'+al+')';ctx.lineWidth=(3-i*.5)*k;ctx.beginPath();ctx.ellipse(X,Y+12*k,rr,rr*.42,0,st,st+1.3);ctx.stroke();}}
     g=ctx.createRadialGradient(X,Y,0,X,Y,90*k);g.addColorStop(0,'rgba(160,255,200,'+(.12*A)+')');g.addColorStop(1,'rgba(160,255,200,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(X,Y,90*k,0,TAU);ctx.fill();
     ctx.restore();
   }
   ctx.restore();
 }
 requestAnimationFrame(frame);
})();
