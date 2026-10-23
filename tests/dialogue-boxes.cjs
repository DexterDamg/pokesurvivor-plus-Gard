const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
let time=0;const noop=()=>{};function el(){return {style:{},classList:{add:noop,remove:noop,toggle:noop},querySelector:()=>el(),offsetWidth:80,offsetHeight:100,textContent:'',getContext:()=>({}),addEventListener:noop};}
const c={console,Map,Set,WeakSet,Math,performance:{now:()=>time*1000},document:{readyState:'loading',createElement:()=>el(),addEventListener:noop},Image:class{},addEventListener:noop,requestAnimationFrame:noop,setTimeout:noop,matchMedia:()=>({matches:false})};c.window=c;
c.PS_HOOPA_ENGINE={Game:{player:{dex:482},state:'playing'},DEX_BY:{480:{name:'Uxie'},481:{name:'Mesprit'},482:{name:'Azelf'}}};c.PS_LAKE={allies:[{dex:480},{dex:481}]};c.PS_SPEAKER_ALLOWED=()=>true;
let source=process.argv[2]?fs.readFileSync(process.argv[2],'utf8'):require('./module.cjs')('lake-talk.js');source=source.replace('  window.PS_LAKE_TALK =','  window.__boxes={show,tickBox,say,clearAll,get active(){return order.map(sl=>sl.cur.it);},get pending(){return queue.slice();}};\n  window.PS_LAKE_TALK =');vm.createContext(c);vm.runInContext(source,c);
const b=c.__boxes,T=c.PS_LAKE_TALK;function line(d,text){return T.line(d,'determined',text,'',{prio:true});}function tick(s){time+=s;b.tickBox(s);}
line(482,'First resolve.');tick(.01);assert.equal(b.active.length,1);
for(let i=0;i<30;i++)line(482,'Resolve '+i);assert.equal(b.pending.length,1);tick(1);assert.equal(b.active.length,1);assert.equal(b.active[0].dex,482);
line(481,'I will help.');line(480,'I am watching.');tick(.1);tick(1);assert.equal(b.active.length,3);assert.equal(new Set(b.active.map(x=>x.dex)).size,3);
line(482,'Keep moving.');tick(.1);assert.equal(b.active.length,3);assert.equal(new Set(b.active.map(x=>x.dex)).size,3);
b.show({dex:482,face:'normal',text:'Cannot steal a box.'});assert.equal(b.active.length,3);
tick(5);assert.equal(b.active.length,0);assert.equal(b.pending.length,1);tick(3.9);assert.equal(b.active.length,0);tick(.2);assert.equal(b.active.length,1);
// Passive reactions still use the original speaker-specific line tables.
b.clearAll();tick(5);assert(b.say(480,T.lines[480].confuse,{prio:true}));assert(b.say(481,T.lines[481].pulse.heal,{prio:true}));assert(b.say(482,T.lines[482].rise,{prio:true}));tick(1);tick(2);tick(2);assert.equal(new Set(b.active.map(x=>x.dex)).size,b.active.length);assert(b.active.length<=3);
// Both object-backed player voice and scripted lines share the same speaker key.
b.clearAll();tick(5);line(482,'Scripted.');tick(.1);T.line(482,'normal','Player voice.','',{prio:true,obj:c.PS_HOOPA_ENGINE.Game.player});tick(1);assert.equal(b.active.filter(x=>x.dex===482).length,1);
console.log('PASS: three distinct speakers; one active box per Pokemon; one pending line per Pokemon; repeated Azelf lines cannot monopolize boxes; other speakers bypass the waiting Azelf line; four-second speaker pause; direct-show guard; Lake Trio passive lines retained.');
