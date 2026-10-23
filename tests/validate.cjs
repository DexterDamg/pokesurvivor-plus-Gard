const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');let count=0;
for(const dir of [root,path.join(root,'js')])for(const name of fs.readdirSync(dir))if(name.endsWith('.js')){new vm.Script(fs.readFileSync(path.join(dir,name),'utf8'),{filename:name});count++;}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),scripts=[...html.matchAll(/<script[^>]+src="([^"?]+)[^"]*"/g)].map(m=>m[1]);
assert.equal(new Set(scripts).size,scripts.length);
for(const src of scripts){if(!/^https?:/.test(src))assert(fs.existsSync(path.join(root,src)),src);}
for(const name of ['digger-bros','kamina-moves','wild-life','wild-spawns','bond','birth-island','creation-rift','giratina-void','lake-trio'])assert(scripts.includes('js/'+name+'.js'),name);
assert(scripts.indexOf('js/digger-bros.js')<scripts.indexOf('js/kamina-moves.js'));
for(const name of ['wild-spawns','run-plus','wild-evolve']){const s=fs.readFileSync(path.join(root,'js',name+'.js'),'utf8');assert(s.includes('window.PS_WILD_SPAWNS'));assert(!/window\.PS_WILD\b/.test(s));}
assert.equal(fs.readFileSync(path.join(root,'app.min.js'),'utf8'),fs.readFileSync(path.join(root,'js/app.min.js'),'utf8'));
console.log(`PASS: ${count} scripts parse; all ${scripts.length} entry-point dependencies exist, feature modules and ordering validated, wildlife APIs isolated.`);
