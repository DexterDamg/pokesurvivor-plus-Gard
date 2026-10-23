/* Reads one module's source out of the single-file bundle js/game.js (see tools/bundle.cjs). */
const fs=require('fs'),{parse,BUNDLE}=require('../tools/bundle.cjs');
module.exports=name=>{const m=parse(fs.readFileSync(BUNDLE,'utf8')).find(x=>x.name===name);if(!m)throw new Error('module not in js/game.js: '+name);return m.source;};
