/* DEV CONSOLE — a testing panel for the developer.
   Open / close: F9 or Ctrl+Shift+D (or the small DEV button, bottom-left, once unlocked).
   Who can open it:
     - always on localhost / a file:// copy (your own machine),
     - accounts listed in DEV_USERS,
     - anyone who types the passcode once (only its SHA-256 hash is stored here; it is remembered on that device).
       Change it: run  PS_DEV.hash('your new code')  in the browser console and paste the result into PASS_HASH.
   Tabs:
     Pokémon  search / filter all Pokémon, animated preview + cry, give / remove, shiny, set as partner,
              spawn as a wild enemy, shiny, boss or catchable Legendary; give everything at once.
     Run      heal, god mode, levels, coins, held items, lives, time skip, game speed, pause, kill all, force shiny, Dynamax.
     Events   Birth Island, Safe Zones, Dens, roamers, Mystery Egg, Golden Hour, hordes, thief, Rifts, Arceus' Judgment,
              crystals, weather, special waves, time orbs.
     Save     PokéCoins, tickets, permanent upgrades, Story / Original mode, Levels 4-5, export the save.
   Note: the game itself marks a run as a "dev run" when its debug time / level-up tools are used. */
(() => {
  'use strict';
  if (window.PS_DEV_INSTALLED) return; window.PS_DEV_INSTALLED = true;
  const B = () => window.PS_MEGA_BRIDGE_V5, E = () => window.PS_HOOPA_ENGINE;
  const DEV_USERS = ['lovergare'];   // account names (lowercase) that can always open it
  const PASS_HASH = '548e5da3ff99467cc3fb8a7c92c30c621218095c75ecb3c3b3b7c9861338dd9f';   // passcode: gard-dev
  const LS = 'ps-dev-unlocked';
  const TYPES = ['normal', 'fire', 'water', 'grass', 'electric', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'];
  const RARITY = { 1: 'Common', 2: 'Uncommon', 3: 'Rare', 4: 'Epic', 5: 'Legendary' };
  const ITEM_EN = { leftovers: 'Leftovers', choiceband: 'Choice Band', quickclaw: 'Quick Claw', focussash: 'Focus Sash', shellbell: 'Shell Bell', amuletcoin: 'Amulet Coin',
    shinycharm: 'Shiny Charm', luckyegg: 'Lucky Egg', lifeorb: 'Life Orb', choicescarf: 'Choice Scarf', rockyhelmet: 'Rocky Helmet', nevermeltice: 'Never-Melt Ice',
    flameorb: 'Flame Orb', toxicorb: 'Toxic Orb', scopelens: 'Scope Lens', sitrusberry: 'Sitrus Berry', kingsrock: "King's Rock", airballoon: 'Air Balloon',
    ejectbutton: 'Eject Button', assaultvest: 'Assault Vest', liechiberry: 'Liechi Berry', apicotberry: 'Apicot Berry', lansatberry: 'Lansat Berry' };
  const WEATHER_EN = { sun: 'Harsh sun', rain: 'Rain', sand: 'Sandstorm', hail: 'Hail', snow: 'Snow', fog: 'Fog', storm: 'Thunderstorm', wind: 'Strong winds' };

  // ---------------- small helpers ----------------
  const save = () => E()?.DB?.save;
  const commit = () => { try { E().DB.commit(); } catch (_) {} };
  const player = () => B()?.game?.player;
  const inRun = () => { const g = B()?.game; return !!(g && g.player && g.state !== 'ui' && g.state !== 'over'); };
  const clock = () => { try { const t = E().Game.time; return Number(typeof t === 'function' ? t() : t) || 0; } catch (_) { return 0; } };
  const mmss = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  const cap = s => String(s || '').replace(/(^|[-_ ])([a-z])/g, (m, a, c) => (a ? ' ' : '') + c.toUpperCase());
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function toast(t, d) { try { if (inRun()) E().Spawner.say(t, d || 2); } catch (_) {} status(t); }
  function cry(dex) { try { const a = new Audio('assets/cries/' + dex + '.mp3'); a.volume = 0.3; a.play().catch(() => {}); } catch (_) {} }
  function run(fn, ok) { try { const r = fn(); if (r === false) status('Not available right now' + (B()?.game?.state && B().game.state !== 'playing' ? ' (close the open menu first, e.g. a level-up choice)' : '')); else if (ok) toast(ok); } catch (e) { console.warn('[dev]', e); status('Error: ' + e.message); } refresh(); }

  // ---------------- access ----------------
  const local = () => /^(localhost|127\.0\.0\.1|\[::1\]|)$/.test(location.hostname) || location.protocol === 'file:';
  const user = () => String(B()?.user || '').trim().toLowerCase();
  const unlocked = () => { if (local() || DEV_USERS.includes(user())) return true; try { return localStorage.getItem(LS) === PASS_HASH; } catch (_) { return false; } };
  async function hash(s) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(s))); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }

  // ---------------- Pokémon actions ----------------
  const fromOf = dex => Number(dex) === 386 ? 'birth-island' : 'dev';   // Deoxys only stays in a save when it comes from Birth Island
  function give(dex) { const s = save(); if (!s) return false; s.owned = s.owned || {}; if (!s.owned[dex]) s.owned[dex] = { at: Date.now(), from: fromOf(dex) }; commit(); }
  function giveShiny(dex) { const s = save(); if (!s) return false; give(dex); s.shiny = s.shiny || {}; if (!s.shiny[dex]) s.shiny[dex] = { at: Date.now(), from: fromOf(dex) }; commit(); }
  function take(dex) { const s = save(); if (!s) return false; if (Number(s.partner) === Number(dex) || Number(s.starter) === Number(dex)) { status("Can't remove your partner / starter"); return; } delete s.owned[dex]; if (s.shiny) delete s.shiny[dex]; commit(); }
  function takeShiny(dex) { const s = save(); if (!s || !s.shiny) return false; delete s.shiny[dex]; if (Number(s.partner) === Number(dex)) s.partnerShiny = false; commit(); }
  function partner(dex, shiny) { const s = save(); if (!s) return false; give(dex); if (shiny) giveShiny(dex); s.partner = Number(dex); s.partnerShiny = !!shiny; commit(); status('Partner set: takes effect on your next run'); }
  function spawnWild(dex, shiny) {
    const N = E(), p = player(); if (!N || !p || !inRun()) return false; const d = N.DEX_BY[dex]; if (!d || !N.SPRITE_META[dex]) { status('No sprite for this Pokémon'); return; }
    const t = clock(); let base = null; try { const ht = N.Enemies.hordeTypes(t); if (ht.length) base = N.Enemies.hordeDefs(ht[0], t)[0]; } catch (_) {}
    base = base || { behavior: 'chase', hp: 15, spd: 58, dmg: 6, xp: 4 };
    const def = Object.assign({}, base, { dex: Number(dex), name: d.name }); try { N.Sprites.preload([Number(dex)]); } catch (_) {}
    const a = Math.random() * Math.PI * 2, sc = N.Enemies.scale ? N.Enemies.scale(t) : { hp: 1, dmg: 1, spd: 1 };
    const e = new N.Enemy(def, p.x + Math.cos(a) * 200, p.y + Math.sin(a) * 160, { hp: sc.hp || 1, dmg: sc.dmg || 1, spd: sc.spd || 1 }, false);
    if (shiny && typeof e.makeShiny === 'function') e.makeShiny(); N.EnemyMgr.add(e);
  }
  function spawnLegend(dex, kind) { if (!inRun()) return false; const R = window.PS_ROAMERS; if (!R) return false; const e = R.spawn(Number(dex), kind); if (!e) { status('Could not spawn it'); return; } }

  // ---------------- run actions ----------------
  let god = false, held = false;
  function killAll() { const N = E(); for (const e of N.EnemyMgr.all().slice()) if (e && !e.dead && !e.remote) { try { e.hurt((Number(e.maxHp) || 1e6) * 50, '#ffffff'); } catch (_) {} } }
  function hold(on) { try { B().game.soloHold(on); held = on; } catch (_) { return false; } }

  // ---------------- UI ----------------
  const css = document.createElement('style');
  css.textContent = `
  #ps-dev{position:fixed;top:0;right:0;bottom:0;width:min(460px,100vw);z-index:2147483000;display:none;flex-direction:column;background:linear-gradient(180deg,#1c2238,#121628);color:#e8eefc;
    border-left:3px solid #f4f8ff;box-shadow:-6px 0 0 rgba(0,0,0,.35);font:15px Pixelify,system-ui,sans-serif}
  #ps-dev.on{display:flex}
  #ps-dev header{display:flex;align-items:center;gap:8px;padding:10px 12px 8px;background:linear-gradient(180deg,#3a3a42,#1c1c22);border-bottom:3px solid #d03838}
  #ps-dev header b{font-size:19px;letter-spacing:2px;color:#ffd23f;flex:1}
  #ps-dev header small{color:#9fb1c9;font-size:12px}
  #ps-dev .x{background:none;border:2px solid #f4f8ff;color:#fff;border-radius:8px;font:inherit;padding:2px 10px;cursor:pointer}
  #ps-dev nav{display:flex;gap:4px;padding:8px 10px 0}
  #ps-dev nav button{flex:1;font:inherit;font-size:14px;padding:6px 4px;border-radius:8px 8px 0 0;border:2px solid #5b83d6;border-bottom:0;background:#1a3170;color:#b9cbf0;cursor:pointer}
  #ps-dev nav button.on{background:#2c519f;color:#fff}
  #ps-dev .body{flex:1;overflow-y:auto;padding:10px 12px 18px;border-top:2px solid #5b83d6}
  #ps-dev h4{margin:12px 0 6px;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;color:#8fa3c4}
  #ps-dev h4:first-child{margin-top:2px}
  #ps-dev .g{display:flex;flex-wrap:wrap;gap:6px}
  #ps-dev .b{font:inherit;font-size:13px;padding:6px 10px;border-radius:8px;border:2px solid #5b83d6;background:#22345f;color:#fff;cursor:pointer}
  #ps-dev .b:hover{background:#2c519f}#ps-dev .b:disabled{opacity:.4;cursor:default}
  #ps-dev .b.gold{border-color:#ffd23f;background:#5a4510}#ps-dev .b.red{border-color:#ff6b6b;background:#5a1a20}#ps-dev .b.on{background:#2f7a40;border-color:#7fe08a}
  #ps-dev input,#ps-dev select{font:inherit;font-size:14px;padding:5px 8px;border-radius:8px;border:2px solid #5b83d6;background:#0f1630;color:#fff;min-width:0}
  #ps-dev .row{display:flex;gap:6px;align-items:center;margin-bottom:6px}
  #ps-dev .row > input[type=search]{flex:1}
  #ps-dev .note{font-size:12px;color:#9fb1c9;margin:4px 0}
  #ps-dev .list{max-height:38vh;overflow-y:auto;border:2px solid #2a3a66;border-radius:8px;background:#0f1630}
  #ps-dev .it{display:flex;align-items:center;gap:8px;padding:4px 8px;cursor:pointer;border-bottom:1px solid #1c2748;font-size:14px}
  #ps-dev .it:hover{background:#1a2850}#ps-dev .it.sel{background:#2c519f}
  #ps-dev .it .n{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #ps-dev .it .d{color:#8fa3c4;font-size:12px;width:38px}
  #ps-dev .tag{font-size:11px;padding:1px 5px;border-radius:5px;background:#2a3a66;color:#cfe0ff}
  #ps-dev .tag.own{background:#2f7a40}#ps-dev .tag.sh{background:#7a6a1a}
  #ps-dev .det{display:flex;gap:10px;margin:10px 0 4px;padding:8px;border:2px solid #5b83d6;border-radius:10px;background:rgba(0,0,0,.2)}
  #ps-dev .det canvas{width:120px;height:120px;image-rendering:pixelated;background:radial-gradient(circle at 50% 70%,#2c519f,#0f1630 70%);border-radius:8px;flex:none}
  #ps-dev .det .info{flex:1;min-width:0}
  #ps-dev .det .info b{font-size:18px;color:#fff}
  #ps-dev .stat{display:flex;justify-content:space-between;font-size:13px;padding:2px 0;border-bottom:1px dashed #2a3a66}
  #ps-dev .stat span:last-child{color:#ffd23f}
  #ps-dev .off{opacity:.45;pointer-events:none}
  #ps-dev .msg{padding:6px 12px;font-size:13px;color:#9ae6ff;background:#0b1020;border-top:2px solid #2a3a66;min-height:18px}
  #ps-dev-lock{position:fixed;inset:0;z-index:2147483001;display:none;align-items:center;justify-content:center;background:rgba(3,6,16,.75)}
  #ps-dev-lock.on{display:flex}
  #ps-dev-lock form{display:flex;flex-direction:column;gap:8px;padding:18px 20px;background:#1c2238;border:3px solid #f4f8ff;border-radius:12px;color:#fff;font:16px Pixelify,system-ui,sans-serif;width:min(320px,90vw)}
  #ps-dev-lock input{font:inherit;padding:6px 10px;border-radius:8px;border:2px solid #5b83d6;background:#0f1630;color:#fff}
  #ps-dev-lock button{font:inherit;padding:6px;border-radius:8px;border:2px solid #ffd23f;background:#5a4510;color:#fff;cursor:pointer}
  #ps-dev-btn{position:fixed;left:96px;bottom:12px;z-index:2147482999;display:none;font:700 12px Pixelify,system-ui,sans-serif;padding:6px 10px;border-radius:14px;border:2px solid #ffd23f;background:#2a1f05;color:#ffd23f;cursor:pointer;opacity:.75}
  #ps-dev-btn:hover{opacity:1}`;
  const el = document.createElement('div'); el.id = 'ps-dev';
  el.innerHTML = '<header><b>DEV CONSOLE</b><small>F9</small><button class="x" data-close>✕</button></header>' +
    '<nav><button data-tab="mon" class="on">Pokémon</button><button data-tab="run">Run</button><button data-tab="ev">Events</button><button data-tab="save">Save</button></nav>' +
    '<div class="body"></div><div class="msg"></div>';
  const body = el.querySelector('.body'), msg = el.querySelector('.msg');
  const lock = document.createElement('div'); lock.id = 'ps-dev-lock';
  lock.innerHTML = '<form><b>Developer passcode</b><input type="password" autocomplete="off" placeholder="Passcode"><button>Unlock</button><small class="err" style="color:#ff8a8a;min-height:16px"></small></form>';
  const btn = document.createElement('button'); btn.id = 'ps-dev-btn'; btn.textContent = 'DEV';
  let tab = 'mon', open = false, msgT = 0;
  function status(t) { msg.textContent = t; msgT = 4; }
  // keep the game from reacting to clicks and keys inside the panel
  [el, lock, btn].forEach(n => ['pointerdown', 'mousedown', 'touchstart', 'click', 'keydown', 'keyup', 'wheel'].forEach(ev => n.addEventListener(ev, e => { if (!(ev === 'keydown' && (e.key === 'F9' || (e.ctrlKey && e.shiftKey && (e.key || '').toLowerCase() === 'd')))) e.stopPropagation(); })));

  // ---- Pokémon tab ----
  const F = { q: '', show: 'all', gen: 0, type: '', rarity: 0 }; let sel = null, shown = 80, anim = null, animDex = null, animShiny = false;
  function filtered() {
    const N = E(), s = save() || {}, owned = s.owned || {}, shiny = s.shiny || {}, q = F.q.trim().toLowerCase();
    return (N?.DEX || []).filter(p => {
      if (q && !(String(p.dex) === q || p.name.toLowerCase().includes(q))) return false;
      if (F.gen && p.gen !== F.gen) return false; if (F.type && !(p.types || []).includes(F.type)) return false; if (F.rarity && p.rarity !== F.rarity) return false;
      if (F.show === 'owned' && !owned[p.dex]) return false; if (F.show === 'missing' && owned[p.dex]) return false; if (F.show === 'shiny' && !shiny[p.dex]) return false;
      if (F.show === 'legend' && !p.leg) return false; return true; });
  }
  function monTab() {
    const gens = '<option value="0">All gens</option>' + [1, 2, 3, 4, 5, 6, 7, 8, 9].map(g => '<option value="' + g + '"' + (F.gen === g ? ' selected' : '') + '>Gen ' + g + '</option>').join('');
    const types = '<option value="">All types</option>' + TYPES.map(t => '<option value="' + t + '"' + (F.type === t ? ' selected' : '') + '>' + cap(t) + '</option>').join('');
    const rar = '<option value="0">Any rarity</option>' + [1, 2, 3, 4, 5].map(r => '<option value="' + r + '"' + (F.rarity === r ? ' selected' : '') + '>' + RARITY[r] + '</option>').join('');
    const shows = [['all', 'All'], ['owned', 'Owned'], ['missing', 'Missing'], ['shiny', 'Shiny'], ['legend', 'Legendary']].map(([k, v]) => '<option value="' + k + '"' + (F.show === k ? ' selected' : '') + '>' + v + '</option>').join('');
    body.innerHTML = '<div class="row"><input type="search" data-f="q" placeholder="Search name or # (e.g. pikachu, 386)" value="' + esc(F.q) + '"></div>' +
      '<div class="row"><select data-f="show">' + shows + '</select><select data-f="gen">' + gens + '</select><select data-f="type">' + types + '</select><select data-f="rarity">' + rar + '</select></div>' +
      '<div class="note" data-count></div><div class="list"></div><div data-detail></div>' +
      '<h4>Everything at once</h4><div class="g"><button class="b gold" data-all="own">Give all Pokémon</button><button class="b gold" data-all="shiny">Give all shinies</button><button class="b red" data-all="reset">Remove all (keeps partner)</button></div>' +
      '<div class="note">Bulk actions apply to the Pokémon matching the filters above.</div>';
    listRender(); detailRender();
  }
  function listRender() {
    const L = filtered(), s = save() || {}, owned = s.owned || {}, shiny = s.shiny || {}, list = body.querySelector('.list'); if (!list) return;
    body.querySelector('[data-count]').textContent = L.length + ' Pokémon · ' + L.filter(p => owned[p.dex]).length + ' owned';
    list.innerHTML = L.slice(0, shown).map(p => '<div class="it' + (p.dex === sel ? ' sel' : '') + '" data-dex="' + p.dex + '"><span class="d">#' + p.dex + '</span><span class="n">' + esc(p.name) + '</span>' +
      (shiny[p.dex] ? '<span class="tag sh">★</span>' : '') + (owned[p.dex] ? '<span class="tag own">owned</span>' : '') + '<span class="tag">' + (RARITY[p.rarity] || '') + '</span></div>').join('') +
      (L.length > shown ? '<div class="it" data-more><span class="n" style="text-align:center;color:#9ae6ff">Show more (' + (L.length - shown) + ' left)</span></div>' : '');
  }
  function detailRender() {
    const box = body.querySelector('[data-detail]'); if (!box) return; const N = E(), p = sel && N?.DEX_BY[sel];
    if (!p) { box.innerHTML = '<div class="note">Pick a Pokémon from the list.</div>'; return; }
    const s = save() || {}, own = !!(s.owned || {})[p.dex], sh = !!(s.shiny || {})[p.dex], canShiny = (() => { try { return N.Sprites.hasShiny(p.dex); } catch (_) { return true; } })(), r = inRun();
    box.innerHTML = '<div class="det"><canvas width="120" height="120"></canvas><div class="info"><b>' + esc(p.name) + '</b> <span class="tag">#' + p.dex + '</span>' +
      '<div class="stat"><span>Type</span><span>' + (p.types || []).map(cap).join(' / ') + '</span></div><div class="stat"><span>Rarity</span><span>' + (RARITY[p.rarity] || '?') + (p.leg ? ' · legendary' : '') + '</span></div>' +
      '<div class="stat"><span>Gen · BST</span><span>' + p.gen + ' · ' + p.bst + '</span></div><div class="stat"><span>Owned</span><span>' + (own ? 'yes' : 'no') + (sh ? ' · shiny ★' : '') + '</span></div>' +
      '<div class="g" style="margin-top:6px"><button class="b" data-a="preview">' + (animShiny ? 'Normal' : 'Shiny') + ' look</button><button class="b" data-a="cry">Cry ♪</button></div></div></div>' +
      '<h4>Collection</h4><div class="g">' + (own ? '<button class="b red" data-a="take">Remove</button>' : '<button class="b gold" data-a="give">Give</button>') +
      (sh ? '<button class="b red" data-a="takeShiny">Remove shiny</button>' : '<button class="b gold" data-a="giveShiny"' + (canShiny ? '' : ' disabled') + '>Give shiny</button>') +
      '<button class="b" data-a="partner">Set as partner</button><button class="b" data-a="partnerShiny"' + (canShiny ? '' : ' disabled') + '>Partner (shiny)</button></div>' +
      '<h4>Spawn in this run</h4><div class="g' + (r ? '' : ' off') + '"><button class="b" data-a="wild">Wild enemy</button><button class="b" data-a="wildShiny">Shiny wild</button><button class="b" data-a="boss">As a boss</button><button class="b gold" data-a="roam">Catchable Legendary</button></div>' +
      (r ? '<div class="note">"Catchable Legendary": defeat it before it flees (90 s) to add it to your collection.' + (p.dex === 386 ? ' Deoxys only joins you from Birth Island.' : '') + '</div>' : '<div class="note">Start a run to spawn Pokémon.</div>');
  }
  function drawPreview(dt) {
    const c = body.querySelector('.det canvas'); if (!c || !sel) return; const N = E();
    if (animDex !== sel || (anim && anim.shiny !== animShiny && animShiny)) { animDex = sel; anim = null; try { N.Sprites.preload([sel], 4000, animShiny); anim = new N.Sprites.Animator(sel, 1, animShiny); } catch (_) {} }
    const x = c.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, c.width, c.height); x.imageSmoothingEnabled = false;
    if (!anim) return; try { anim.loop('Idle'); anim.dir = 0; anim.update(dt); const h = N.Sprites.bodyHeight ? N.Sprites.bodyHeight(sel) || 40 : 40, k = Math.max(1, Math.min(3, 80 / h)); x.translate(60, 100); x.scale(k, k); try { N.Sprites.drawShadow(x, null, 0, 0); } catch (_) {} anim.draw(x, 0, 0, {}); } catch (_) {}
  }
  function bulk(kind) {
    const L = filtered(), s = save(); if (!s) return;
    if (kind === 'reset' && !confirm('Remove ' + L.length + ' Pokémon (and their shinies) from this save? Your partner and starter stay.')) return;
    let n = 0; const N = E();
    for (const p of L) { if (kind === 'own') { if (!s.owned[p.dex]) { s.owned[p.dex] = { at: Date.now(), from: fromOf(p.dex) }; n++; } }
      else if (kind === 'shiny') { let ok = true; try { ok = N.Sprites.hasShiny(p.dex); } catch (_) {} if (!ok) continue; if (!s.owned[p.dex]) s.owned[p.dex] = { at: Date.now(), from: fromOf(p.dex) }; s.shiny = s.shiny || {}; if (!s.shiny[p.dex]) { s.shiny[p.dex] = { at: Date.now(), from: fromOf(p.dex) }; n++; } }
      else if (kind === 'reset') { if (Number(s.partner) === p.dex || Number(s.starter) === p.dex) continue; if (s.owned[p.dex]) n++; delete s.owned[p.dex]; if (s.shiny) delete s.shiny[p.dex]; } }
    commit(); status((kind === 'reset' ? 'Removed ' : 'Added ') + n + (kind === 'shiny' ? ' shinies' : ' Pokémon')); listRender(); detailRender();
  }

  // ---- Run tab ----
  function runTab() {
    const N = E(), p = player(), r = inRun();
    if (!r) { body.innerHTML = '<div class="note" style="font-size:15px;margin-top:10px">Start a run to use these tools.</div>'; return; }
    const items = (N.Items?.LIST || []).map(i => '<option value="' + i.id + '">' + (ITEM_EN[i.id] || cap(i.id)) + '</option>').join('');
    body.innerHTML = '<h4>Status</h4><div data-live></div>' +
      '<h4>Player</h4><div class="g"><button class="b" data-r="heal">Full heal</button><button class="b' + (god ? ' on' : '') + '" data-r="god">God mode: ' + (god ? 'ON' : 'off') + '</button><button class="b" data-r="life">+1 life</button>' +
      '<button class="b" data-r="lv1">+1 level</button><button class="b" data-r="lv5">+5 levels</button><button class="b" data-r="coins">+500 run coins</button><button class="b" data-r="reroll">+5 rerolls</button></div>' +
      '<div class="row" style="margin-top:6px"><select data-item>' + items + '</select><button class="b gold" data-r="item">Give held item</button></div>' +
      '<h4>Time</h4><div class="g"><button class="b" data-r="t60">+1 min</button><button class="b" data-r="t300">+5 min</button><button class="b" data-r="t600">+10 min</button>' +
      '<button class="b' + (held ? ' on' : '') + '" data-r="hold">' + (held ? 'Resume' : 'Freeze game') + '</button></div>' +
      '<div class="g" style="margin-top:6px">' + [1, 2, 4, 8].map(s => '<button class="b" data-speed="' + s + '">Speed ×' + s + '</button>').join('') + '</div>' +
      '<h4>Enemies</h4><div class="g"><button class="b red" data-r="kill">Defeat all enemies</button><button class="b" data-r="shiny">Next spawns shiny</button><button class="b" data-r="burst">Spawn a burst</button></div>' +
      '<h4>Power</h4><div class="g"><button class="b gold" data-r="dyna">Dynamax now (gives the Band)</button><button class="b" data-r="dynaCd">Recharge Dynamax</button></div>' +
      '<div class="note">Time skips and level-ups make the game mark this run as a dev run.</div>';
    live();
  }
  function live() { const d = body.querySelector('[data-live]'), p = player(); if (!d || !p) return;
    d.innerHTML = '<div class="stat"><span>Pokémon</span><span>' + esc(p.mon?.name || p.dex) + (p.shiny ? ' ★' : '') + '</span></div><div class="stat"><span>HP</span><span>' + Math.round(p.hp) + ' / ' + Math.round(p.maxHp) + '</span></div>' +
      '<div class="stat"><span>Level · lives</span><span>' + p.level + ' · ' + (p.lives || 0) + '</span></div><div class="stat"><span>Time · kills</span><span>' + mmss(clock()) + ' · ' + (p.kills || 0) + '</span></div>' +
      '<div class="stat"><span>Run coins · item</span><span>' + Math.round(p.coins || 0) + ' · ' + (p.item ? (ITEM_EN[p.item] || p.item) : '—') + '</span></div><div class="stat"><span>Enemies on field</span><span>' + (E().EnemyMgr.all().filter(e => !e.dead).length) + '</span></div>'; }
  function runAct(k) {
    const N = E(), p = player(), G = N.Game;
    const acts = {
      heal: () => { p.hp = p.maxHp; }, god: () => { god = !god; status('God mode ' + (god ? 'on' : 'off')); }, life: () => { p.lives = (Number(p.lives) || 0) + 1; },
      lv1: () => G.debugLevelUp(), lv5: () => { for (let i = 0; i < 5; i++) G.debugLevelUp(); }, coins: () => { p.coins = (Number(p.coins) || 0) + 500; }, reroll: () => { p.rerollBonus = (Number(p.rerollBonus) || 0) + 5; },
      item: () => { const id = body.querySelector('[data-item]').value; G.giveItem(id); }, t60: () => G.debugTime(clock() + 60), t300: () => G.debugTime(clock() + 300), t600: () => G.debugTime(clock() + 600),
      hold: () => { hold(!held); status(held ? 'Game frozen' : 'Game resumed'); }, kill: killAll, shiny: () => N.Spawner.debugForceShiny(1), burst: () => N.Spawner.burst(12),
      dyna: () => { const Q = window.PS_QUALITY; if (!Q) return false; p.__dynBand = true; Q.dynRecharge(); return Q.dynamax(); }, dynaCd: () => window.PS_QUALITY && window.PS_QUALITY.dynRecharge() };
    if (acts[k]) run(acts[k], { heal: 'Healed', life: '+1 life', lv1: 'Level up', lv5: '+5 levels', coins: '+500 coins', reroll: '+5 rerolls', item: 'Item given', kill: 'All enemies defeated', t60: 'Skipped 1 minute', t300: 'Skipped 5 minutes', t600: 'Skipped 10 minutes', dynaCd: 'Dynamax recharged', shiny: 'Next spawn will be shiny', burst: 'Burst spawned', dyna: 'Dynamax!' }[k]);
  }

  // ---- Events tab ----
  function evTab() {
    const N = E(), r = inRun(), off = r ? '' : ' off';
    const weather = Object.keys(N?.Weather?.KINDS || {}).map(k => '<option value="' + k + '">' + (WEATHER_EN[k] || cap(k)) + '</option>').join('');
    const waves = (window.PS_WAVES?.waves || []).map(w => '<option value="' + w.id + '">' + esc(w.name) + '</option>').join('');
    const types = TYPES.map(t => '<option value="' + t + '">' + cap(t) + '</option>').join('');
    const bi = window.PS_BIRTH_ISLAND;
    body.innerHTML = (r ? '' : '<div class="note" style="font-size:15px;margin:6px 0 10px">Start a run to trigger events.</div>') +
      '<div class="' + off + '"><h4>Special places</h4><div class="g"><button class="b gold" data-e="birth">Birth Island</button><button class="b" data-e="sz1">Safe Zone: Forest Shrine</button><button class="b" data-e="sz2">Safe Zone: Portal Shrine</button></div>' +
      (bi ? '<div class="row" style="margin-top:6px"><span class="note" style="margin:0">Birth Island chance per map change</span><input type="number" min="0" max="100" step="0.5" data-bichance value="' + +(bi.cfg.chance * 100).toFixed(2) + '" style="width:80px">%</div>' : '') +
      '<h4>Legendaries & dens</h4><div class="g"><button class="b" data-e="mew">Wild Mew</button><button class="b" data-e="roamer">Random roaming Legendary</button><button class="b" data-e="lden">Legendary Den</button><button class="b" data-e="den">Dynamax Den</button><button class="b" data-e="egg">Mystery Egg</button></div>' +
      '<h4>World events</h4><div class="g"><button class="b gold" data-e="gold">Golden Hour</button><button class="b" data-e="horde">Type horde</button><button class="b" data-e="thief">Thief</button><button class="b" data-e="rift">Open a Rift</button><button class="b red" data-e="judge">Arceus\' Judgment</button><button class="b" data-e="crystal">Crystal event</button><button class="b" data-e="orb">Drop a Time Orb</button></div>' +
      '<h4>Weather</h4><div class="row"><select data-weather>' + weather + '</select><button class="b" data-e="weather">Start (60 s)</button><button class="b" data-e="clearWeather">Clear</button></div>' +
      '<h4>Special wave</h4><div class="row"><select data-wave>' + waves + '</select><button class="b" data-e="wave">Send it</button></div>' +
      '<h4>Spawn a horde of one type</h4><div class="row"><select data-htype>' + types + '</select><button class="b" data-e="typeHorde">Spawn 10</button></div></div>';
  }
  function evAct(k) {
    const N = E(), R = window.PS_ROAMERS;
    const acts = {
      birth: () => window.PS_BIRTH_ISLAND.enter(), sz1: () => window.PS_SAFEZONE.spawnRift('forest-shrine', true), sz2: () => window.PS_SAFEZONE.spawnRift('portal-shrine', true),
      mew: () => R.spawn(151, 'roam'), roamer: () => { const L = [243, 244, 245, 380, 381, 144, 145, 146, 488, 641, 642, 645, 905]; R.spawn(L[Math.floor(Math.random() * L.length)], 'roam'); },
      lden: () => window.PS_DENS.spawnLegend(), den: () => window.PS_DENS.spawn(true), egg: () => window.PS_LORE.egg(true),
      gold: () => N.Events.debugStart('gold'), horde: () => N.Events.debugStart('horde'), thief: () => N.Events.debugThief(), rift: () => N.Rift.debugOpen(true),
      judge: () => N.Judgment.debugStart(), crystal: () => N.Crystal.debug(), orb: () => { const p = player(); window.PS_TIMEORBS.drop(p.x + 60, p.y); },
      weather: () => N.Weather.debugStart(body.querySelector('[data-weather]').value, 60), clearWeather: () => N.Weather.clear(),
      wave: () => window.PS_WAVES.force(body.querySelector('[data-wave]').value),
      typeHorde: () => { const t = body.querySelector('[data-htype]').value, L = N.DEX.filter(p => (p.types || []).includes(t) && p.rarity <= 3 && !p.leg && N.SPRITE_META[p.dex]); if (!L.length) return false; for (let i = 0; i < 10; i++) spawnWild(L[Math.floor(Math.random() * L.length)].dex, false); } };
    if (acts[k]) run(acts[k], { birth: 'Off to Birth Island...', mew: 'A wild Mew appeared!', roamer: 'A roaming Legendary appeared!', sz1: 'Pink rift opened nearby', sz2: 'Pink rift opened nearby', gold: 'Golden Hour!', horde: 'Horde incoming', thief: 'A thief appeared', rift: 'Rift opened', judge: "Arceus' Judgment", crystal: 'Crystal event', weather: 'Weather started', clearWeather: 'Weather cleared', wave: 'Wave sent', typeHorde: 'Horde spawned', lden: 'Legendary Den opened', den: 'Dynamax Den opened', egg: 'Mystery Egg washed ashore', orb: 'Time Orb dropped' }[k]);
  }

  // ---- Save tab ----
  function saveTab() {
    const s = save(), N = E(); if (!s) { body.innerHTML = '<div class="note">Log in or play as a guest first.</div>'; return; }
    const ups = (N.Upgrades?.LIST || []), upLv = s.upgrades || {}, story = !!(window.PS_STORY && window.PS_STORY.on()), dm = !!(N.DevMenu && N.DevMenu.on);
    body.innerHTML = '<h4>Wallet</h4><div class="stat"><span>PokéCoins</span><span>' + Math.round(s.coins || 0) + '</span></div><div class="stat"><span>Tickets · ×10 tickets</span><span>' + ((s.tickets || {}).t1 || 0) + ' · ' + ((s.tickets || {}).t10 || 0) + '</span></div>' +
      '<div class="g" style="margin-top:6px"><button class="b gold" data-s="c1k">+1,000 coins</button><button class="b gold" data-s="c10k">+10,000 coins</button><button class="b" data-s="t1">+10 tickets</button><button class="b" data-s="t10">+5 ×10 tickets</button><button class="b red" data-s="c0">Coins to 0</button></div>' +
      '<h4>Permanent upgrades</h4><div class="note">' + ups.map(u => cap(u.id) + ' ' + (upLv[u.id] || 0) + '/' + u.max).join(' · ') + '</div>' +
      '<div class="g"><button class="b gold" data-s="upMax">Max all upgrades</button><button class="b red" data-s="up0">Reset upgrades</button></div>' +
      '<h4>Game</h4><div class="g"><button class="b' + (story ? ' on' : '') + '" data-s="story">Story Mode</button><button class="b' + (story ? '' : ' on') + '" data-s="original">Original Mode</button>' +
      '<button class="b' + (dm ? ' on' : '') + '" data-s="levels">Levels 4-5: ' + (dm ? 'unlocked' : 'locked') + '</button></div>' +
      '<h4>Backup</h4><div class="g"><button class="b" data-s="export">Download save (.json)</button></div>' +
      '<div class="note">Changes are saved to this account right away (guest progress isn\'t kept after you leave).</div>';
  }
  function saveAct(k) {
    const s = save(), N = E(); if (!s) return; s.tickets = s.tickets || { t1: 0, t10: 0 }; s.upgrades = s.upgrades || {};
    const acts = {
      c1k: () => { s.coins = (Number(s.coins) || 0) + 1000; }, c10k: () => { s.coins = (Number(s.coins) || 0) + 10000; }, c0: () => { s.coins = 0; },
      t1: () => { s.tickets.t1 = (Number(s.tickets.t1) || 0) + 10; }, t10: () => { s.tickets.t10 = (Number(s.tickets.t10) || 0) + 5; },
      upMax: () => { for (const u of N.Upgrades.LIST) s.upgrades[u.id] = u.max; }, up0: () => { if (!confirm('Reset every permanent upgrade to 0?')) return false; s.upgrades = {}; },
      story: () => window.PS_STORY.set('story'), original: () => window.PS_STORY.set('original'),
      levels: () => { N.DevMenu = N.DevMenu || {}; N.DevMenu.on = !N.DevMenu.on; },
      export: () => { const data = N.DB.exportData(); if (!data) return false; const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' })); a.download = 'pokesurvivor-save-' + new Date().toISOString().slice(0, 10) + '.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); } };
    if (acts[k]) { const before = acts[k](); if (before !== false && !['story', 'original', 'levels', 'export'].includes(k)) commit(); status({ c1k: '+1,000 PokéCoins', c10k: '+10,000 PokéCoins', c0: 'PokéCoins set to 0', t1: '+10 tickets', t10: '+5 ×10 tickets', upMax: 'All upgrades maxed', up0: 'Upgrades reset', story: 'Story Mode on', original: 'Original Mode on', levels: 'Levels 4-5 toggled', export: 'Save downloaded' }[k] || 'Done'); }
    saveTab();
  }

  // ---- wiring ----
  function render() { el.querySelectorAll('nav button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab)); ({ mon: monTab, run: runTab, ev: evTab, save: saveTab })[tab](); }
  function refresh() { if (!open) return; if (tab === 'mon') { listRender(); detailRender(); } else if (tab === 'run') runTab(); else if (tab === 'save') saveTab(); }
  el.addEventListener('click', e => {
    const t = e.target.closest('button, .it'); if (!t) return;
    if (t.dataset.close !== undefined) return toggle(false);
    if (t.dataset.tab) { tab = t.dataset.tab; return render(); }
    if (t.dataset.more !== undefined) { shown += 120; return listRender(); }
    if (t.dataset.dex) { sel = Number(t.dataset.dex); animShiny = false; body.querySelectorAll('.it.sel').forEach(x => x.classList.remove('sel')); t.classList.add('sel'); return detailRender(); }
    if (t.dataset.all) return bulk(t.dataset.all);
    if (t.dataset.a) { const a = t.dataset.a, d = sel; if (!d) return;
      if (a === 'preview') { animShiny = !animShiny; animDex = null; return detailRender(); }
      if (a === 'cry') return cry(d);
      const map = { give: () => give(d), giveShiny: () => giveShiny(d), take: () => take(d), takeShiny: () => takeShiny(d), partner: () => partner(d, false), partnerShiny: () => partner(d, true),
        wild: () => spawnWild(d, false), wildShiny: () => spawnWild(d, true), boss: () => spawnLegend(d, 'rush'), roam: () => spawnLegend(d, 'roam') };
      const name = E().DEX_BY[d]?.name || d;
      return run(map[a], { give: name + ' added', giveShiny: 'Shiny ' + name + ' added', take: name + ' removed', takeShiny: 'Shiny removed', wild: name + ' spawned', wildShiny: 'Shiny ' + name + ' spawned', boss: name + ' boss spawned', roam: 'A wild ' + name + ' appeared!' }[a]); }
    if (t.dataset.r) return runAct(t.dataset.r);
    if (t.dataset.speed) return run(() => E().Game.debugSpeed(Number(t.dataset.speed)), 'Speed ×' + t.dataset.speed);
    if (t.dataset.e) return evAct(t.dataset.e);
    if (t.dataset.s) return saveAct(t.dataset.s);
  });
  el.addEventListener('input', e => { const f = e.target.dataset.f; if (f) { F[f] = f === 'q' || f === 'show' || f === 'type' ? e.target.value : Number(e.target.value); shown = 80; listRender(); }
    if (e.target.dataset.bichance !== undefined && window.PS_BIRTH_ISLAND) { const v = Math.max(0, Math.min(100, Number(e.target.value) || 0)); window.PS_BIRTH_ISLAND.cfg.chance = v / 100; status('Birth Island chance: ' + v + '% (until reload)'); } });
  lock.querySelector('form').addEventListener('submit', async e => { e.preventDefault(); const inp = lock.querySelector('input'), h = await hash(inp.value);
    if (h === PASS_HASH) { try { localStorage.setItem(LS, h); } catch (_) {} lock.classList.remove('on'); inp.value = ''; toggle(true); } else lock.querySelector('.err').textContent = 'Wrong passcode'; });
  lock.addEventListener('click', e => { if (e.target === lock) lock.classList.remove('on'); });
  btn.addEventListener('click', () => toggle());
  function toggle(on) {
    on = on === undefined ? !open : on;
    if (on && !unlocked()) { lock.classList.add('on'); setTimeout(() => lock.querySelector('input').focus(), 30); return; }
    open = on; el.classList.toggle('on', open); if (open) render(); else if (held) hold(false);
  }
  addEventListener('keydown', e => { const k = (e.key || '').toLowerCase(); if (k === 'f9' || (e.ctrlKey && e.shiftKey && k === 'd')) { e.preventDefault(); e.stopImmediatePropagation(); toggle(); } }, true);

  let last = performance.now(), slow = 0;
  function loop(now) { requestAnimationFrame(loop); const dt = Math.min(0.1, (now - last) / 1000); last = now;
    try {
      if (god && inRun()) { const p = player(); if (p) { p.hp = p.maxHp; p.invuln = Math.max(Number(p.invuln) || 0, 0.3); } }
      if (!inRun()) { god = false; held = false; }
      if (open && tab === 'mon') drawPreview(dt);
      slow += dt; if (slow > 0.5) { slow = 0; btn.style.display = unlocked() && !open ? 'block' : 'none'; if (open && tab === 'run') live(); }
      if (msgT > 0) { msgT -= dt; if (msgT <= 0) msg.textContent = ''; }
    } catch (e) { console.warn('[dev]', e); } }
  function init() { document.head.append(css); document.body.append(el, lock, btn); requestAnimationFrame(loop); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
  window.PS_DEV = { open: () => toggle(true), close: () => toggle(false), hash: s => hash(s).then(h => { console.log(h); return h; }), get unlocked() { return unlocked(); } };
})();
