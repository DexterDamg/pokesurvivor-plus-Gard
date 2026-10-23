const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const {parse,build}=require('../tools/bundle.cjs');
const root=path.resolve(__dirname,'..');let count=0;
for(const dir of [root,path.join(root,'js')])for(const name of fs.readdirSync(dir))if(name.endsWith('.js')){new vm.Script(fs.readFileSync(path.join(dir,name),'utf8'),{filename:name});count++;}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),scripts=[...html.matchAll(/<script[^>]+src="([^"?]+)[^"]*"/g)].map(m=>m[1]);
assert.equal(new Set(scripts).size,scripts.length);
for(const src of scripts){if(!/^https?:/.test(src))assert(fs.existsSync(path.join(root,src)),src);}
assert.deepEqual(scripts,['config.js','js/app.min.js','js/game.js']);
assert(fs.existsSync(path.join(root,'css/game.css'))&&html.includes('href="css/game.css'));
const bundle=fs.readFileSync(path.join(root,'js/game.js'),'utf8'),mods=parse(bundle),names=mods.map(m=>m.name);
assert.equal(build(mods),bundle,'js/game.js markers are intact');
for(const m of mods)new vm.Script(m.source,{filename:m.name});
assert.equal(new Set(names).size,names.length);
for(const name of ['digger-bros','kamina-moves','wild-life','wild-spawns','bond','birth-island','creation-rift','giratina-void','lake-trio'])assert(names.includes(name+'.js'),name);
assert(names.indexOf('digger-bros.js')<names.indexOf('kamina-moves.js'));
for(const name of ['wild-spawns','run-plus','wild-evolve']){const s=mods.find(m=>m.name===name+'.js').source;assert(s.includes('window.PS_WILD_SPAWNS'));assert(!/window\.PS_WILD\b/.test(s));}
console.log(`PASS: ${count} scripts parse; ${mods.length} modules in js/game.js parse individually, in order, with intact markers; entry point loads ${scripts.length} scripts; wildlife APIs isolated.`);
