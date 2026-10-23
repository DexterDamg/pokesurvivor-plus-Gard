const assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const {engine:E,context:C,vm}=require('./lake-runtime.cjs');
C.PS_GACHA_SINGLE=true;
vm.runInContext(require('./module.cjs')('special-gacha.js'),C);
for(const n of [1,10,100]){
 const saved={at:123,from:'catch'},s={owned:{19:saved},shiny:{19:saved},coins:100,tickets:{t1:1000,t10:100},pity:{},shinyPity:{},stats:{}};
 const before=JSON.stringify(s);
 const r=E.Gacha.pull(s,n,1,'t1');assert.equal(r.length,n);
 const allowed=new Set([...C.PS_SPECIAL_GACHA.STARTERS,...Object.keys(C.PS_SPECIAL_GACHA.LEGENDS).map(Number)]);
 assert(r.every(x=>allowed.has(x.dex)));
 const results=new Set(r.map(x=>String(x.dex)));results.add('19');
 assert.deepEqual(Object.keys(s.owned).sort(),[...results].sort());
 assert.equal(s.owned[19],saved);assert.equal(s.shiny[19],saved);
 assert.equal(s.coins,100+r.reduce((a,x)=>a+x.refund,0));
 assert.equal(s.tickets.t1,1000-n);assert.equal(s.stats.pulls,n);
 for(const x of r)if(x.shiny)assert(s.shiny[x.dex]);
}
const s={owned:{19:{at:1,from:'catch'}},shiny:{},coins:0,tickets:{t1:0,t10:0},pity:{},stats:{}};
const before=JSON.stringify(s);assert.equal(E.Gacha.pull(s,10,1),null);assert.equal(JSON.stringify(s),before);
console.log('PASS: x1/x10/x100 pools, collection preservation, refunds, ticket costs, pull stats, shinies and insufficient funds.');
