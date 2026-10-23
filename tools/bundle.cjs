#!/usr/bin/env node
/* ONE-FILE GAME BUNDLE
   All game modules live in js/game.js (the engine stays in js/app.min.js, styles in css/game.css).

     node tools/bundle.cjs split   js/game.js  ->  modules/NN-name.js   (one file per module, to edit or swap)
     node tools/bundle.cjs join    modules/    ->  js/game.js           (rebuilds the bundle, updates index.html ?v=)
     node tools/bundle.cjs list    show the modules inside js/game.js, in load order

   Each module is wrapped in try/catch, so one module failing at start-up does not stop the others
   (the same as when every module was its own <script> tag). Modules run in the order listed. */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const root = path.resolve(__dirname, '..');
const BUNDLE = path.join(root, 'js/game.js'), MODULES = path.join(root, 'modules'), HTML = path.join(root, 'index.html');

const HEADER = `/* PokeSurvivor+ Gard: every game module in one file (loaded after js/app.min.js).
   Each "MODULE" block below is one former js/<name>.js file, in load order.
   Edit a block in place, or run "node tools/bundle.cjs split" to get separate files and "join" to rebuild.
   Do not change the MODULE / END MODULE marker lines: the tools use them. */
`;
const open = name => `/* ==== MODULE: ${name} ==== */\ntry {\n`;
const close = name => `\n} catch (e) { console.error('[game.js] module ${name} failed:', e); }\n/* ==== END MODULE: ${name} ==== */\n`;

function parse(text) {
  const re = /\/\* ==== MODULE: (\S+) ==== \*\/\ntry \{\n([\s\S]*?)\n\} catch \(e\) \{ console\.error\('\[game\.js\] module \1 failed:', e\); \}\n\/\* ==== END MODULE: \1 ==== \*\/\n/g;
  const out = []; let m;
  while ((m = re.exec(text))) out.push({ name: m[1], source: m[2] });
  return out;
}
function build(mods) { return HEADER + mods.map(m => open(m.name) + m.source + close(m.name)).join('\n'); }

function stampHtml(text) {
  const v = crypto.createHash('sha1').update(text).digest('hex').slice(0, 12);
  const html = fs.readFileSync(HTML, 'utf8').replace(/js\/game\.js\?v=[^"]*/, 'js/game.js?v=' + v);
  fs.writeFileSync(HTML, html);
}

const cmd = require.main === module ? process.argv[2] : null;
if (cmd === 'list') {
  parse(fs.readFileSync(BUNDLE, 'utf8')).forEach((m, i) => console.log(String(i + 1).padStart(2, '0'), m.name, m.source.length + ' bytes'));
} else if (cmd === 'split') {
  const mods = parse(fs.readFileSync(BUNDLE, 'utf8'));
  fs.mkdirSync(MODULES, { recursive: true });
  mods.forEach((m, i) => fs.writeFileSync(path.join(MODULES, String(i + 1).padStart(2, '0') + '-' + m.name), m.source));
  console.log(`split ${mods.length} modules into modules/`);
} else if (cmd === 'join') {
  const files = fs.readdirSync(MODULES).filter(f => /^\d+-.+\.js$/.test(f)).sort();
  const mods = files.map(f => ({ name: f.replace(/^\d+-/, ''), source: fs.readFileSync(path.join(MODULES, f), 'utf8') }));
  const text = build(mods);
  fs.writeFileSync(BUNDLE, text); stampHtml(text);
  console.log(`joined ${mods.length} modules into js/game.js`);
} else if (cmd !== null) {
  console.log('usage: node tools/bundle.cjs split | join | list');
}

module.exports = { parse, build, BUNDLE };
