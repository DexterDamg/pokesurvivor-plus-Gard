/* PokéSurvivor custom music — your own songs at certain moments, like area music in other games.
   When none of your songs is playing, the game's own music plays as normal.

   HOW TO CHANGE IT (only edit the two lists below):
   1) TRACKS  every song you uploaded to assets/music/, each with a short nickname.
   2) RULES   which songs play when. Every rule is a list, so you can put several songs in it
              (one is picked at random each time).
        menu     title screen / menus: shuffled one after another.
        mega     Mega Evolution only (never Primal Reversion). Loops while the Mega form lasts.
        special  certain moments, by the game's own music name (shown in the ♫ panel as "Game music: ...").
                 rift = inside a Rift, judgment = the Arceus Judgment fight, zz = Area Zero.
        battle   normal battles: now and then one of these songs plays once.
                 chance = how likely each roll is (0.3 = 30%), every = seconds between rolls,
                 first = also roll when the battle starts.

   HOW SONGS BEHAVE
   - A song that is already playing is never cut off or restarted: if the new moment wants the same
     song, it simply keeps going; otherwise it finishes first and then the new moment's song starts.
   - ⏭ in the ♫ panel skips to the next song (or back to the game's music if there is no other).
   - ON/OFF turns all of your songs off; the slider is their volume. */
(() => {
  'use strict';
  if (window.PS_MUSIC_PLAYLIST_INSTALLED) return;
  window.PS_MUSIC_PLAYLIST_INSTALLED = true;

  const TRACKS = {
    'tera':      { title: 'Tera Raid Battle — Orchestral Remix', file: 'assets/music/tera-raid-orchestral-remix.mp3' },
    'gym-tera':  { title: 'Gym Leader Tera Raid',                file: 'assets/music/gym-tera.mp3' },
    'zone-zero': { title: 'Zone Zero',                           file: 'assets/music/zone-zero.mp3' },
    'pallet':    { title: 'Pallet Town',                         file: 'assets/music/pallet-town.mp3' },
    'littleroot':{ title: 'Littleroot Town',                     file: 'assets/music/littleroot-town.mp3' },
    'rustboro':  { title: 'Rustboro City',                       file: 'assets/music/rustboro-city.mp3' },
  };
  const RULES = {
    menu:    { songs: ['pallet', 'littleroot', 'rustboro'] },
    mega:    { songs: ['gym-tera'] },
    special: {
      rift:     { songs: ['tera'] },
      judgment: { songs: ['tera'] },
    },
    battle:  { songs: ['tera'], chance: 0.3, every: 150, first: true },
  };

  // ------------------------------------------------------------------------------------------
  const KEY = 'ps.music.zones.v1';
  let S = { on: true, volume: 0.35, open: false, gameMusicWas: null };
  try { Object.assign(S, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (_) {}
  S.volume = Math.max(0, Math.min(1, Number(S.volume))); if (!Number.isFinite(S.volume)) S.volume = 0.35;
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (_) {} };
  const pick = (list, not) => { const l = (list || []).filter(id => TRACKS[id] && id !== not); const L = l.length ? l : (list || []).filter(id => TRACKS[id]); return L.length ? L[Math.floor(Math.random() * L.length)] : null; };
  const B = () => window.PS_MEGA_BRIDGE_V5;
  const now = () => performance.now();

  // ---- the game's own music: silenced while one of our songs plays, restored afterwards ----
  const gameAudio = () => B()?.audio || null;
  let gameTrack = null;   // name of the song the game wants right now ('rift', 'judgment', a biome, ...)
  function watchGame() {  // learn which music the game is asking for (used by RULES.special)
    const A = gameAudio(); if (!A || A.__psWatched || typeof A.music !== 'function') return;
    const orig = A.music; A.__psWatched = true;
    A.music = function (name) { gameTrack = name || null; return orig.apply(this, arguments); };
  }
  function quietGame() {
    const A = gameAudio(); if (!A || !A.settings) return;
    const v = Number(A.settings.music);
    if (v > 0) { S.gameMusicWas = v; save(); try { A.setVolume('music', 0); } catch (_) {} }
  }
  function restoreGame() {
    const A = gameAudio(); if (!A || !A.settings || S.gameMusicWas == null) return;
    if (Number(A.settings.music) === 0) { try { A.setVolume('music', S.gameMusicWas); } catch (_) {} }
    S.gameMusicWas = null; save();
  }
  addEventListener('pagehide', () => {   // closing the tab mid-song: put the game's saved music volume back
    if (S.gameMusicWas == null) return;
    try { const a = JSON.parse(localStorage.getItem('ps.audio') || '{}'); if (!Number(a.music)) { a.music = S.gameMusicWas; localStorage.setItem('ps.audio', JSON.stringify(a)); } } catch (_) {}
  });

  // ---- where are we? -> 'menu' | 'mega' | 'special:<name>' | 'battle' ----
  function context() {
    const g = B()?.game, p = g?.player, st = g?.state;
    const battle = !!(st && st !== 'ui' && st !== 'over');          // 'ui' = menus, 'over' = run ended
    if (!battle) return 'menu';
    if (p && p.megaForm && !/primal/.test(String(p.megaForm))) return 'mega';   // Mega only, never Primal
    if (gameTrack && RULES.special && RULES.special[gameTrack]) return 'special:' + gameTrack;
    return 'battle';
  }
  const rule = ctx => ctx === 'menu' ? RULES.menu : ctx === 'mega' ? RULES.mega : ctx === 'battle' ? RULES.battle : (RULES.special || {})[ctx.slice(8)];
  const loops = ctx => ctx === 'mega' || ctx.startsWith('special:');  // menu shuffles, battle plays once

  // ---- player ----
  const audio = new Audio(); audio.preload = 'auto'; audio.volume = S.volume;
  let cur = null;               // { id, ctx }  the song playing now
  let unlocked = false, nextRoll = 0, lastCtx = null, megaSkipped = false;
  function start(id, ctx) {
    const t = TRACKS[id]; if (!t) return false;
    cur = { id, ctx };
    audio.src = new URL(t.file, document.baseURI).href; audio.loop = loops(ctx); audio.currentTime = 0; audio.volume = S.volume;
    audio.play().then(() => { quietGame(); render(); }).catch(() => render());
    render(); return true;
  }
  function hush() { cur = null; audio.pause(); restoreGame(); render(); }
  function chooseNext(ctx, not) {   // which song (if any) should start now in this moment
    const r = rule(ctx); if (!r || !r.songs || !r.songs.length) return null;
    if (ctx === 'mega' && megaSkipped) return null;
    if (ctx === 'battle') { if (now() < nextRoll) return null; nextRoll = now() + (r.every || 150) * 1000; return Math.random() < (r.chance ?? 0.3) ? pick(r.songs, not) : null; }
    return pick(r.songs, not);
  }
  audio.addEventListener('ended', () => {   // a song finished: the current moment picks what comes next
    const done = cur; cur = null;
    const ctx = context();
    if (done && done.ctx === 'battle') nextRoll = now() + (RULES.battle?.every || 150) * 1000;
    const id = S.on ? chooseNext(ctx, done && done.id) : null;
    if (!(id && start(id, ctx))) hush();
  });
  audio.addEventListener('error', () => { console.warn('[Music] could not load', cur && TRACKS[cur.id]?.file); hush(); });

  function tick() {
    watchGame();
    const ctx = context();
    if (ctx !== lastCtx) {
      if (lastCtx === 'mega') megaSkipped = false;
      if (ctx === 'battle' && (lastCtx === 'menu' || lastCtx == null)) nextRoll = RULES.battle?.first ? now() : now() + (RULES.battle?.every || 150) * 1000;
      lastCtx = ctx;
    }
    if (!S.on || !unlocked) { if (cur) hush(); return; }
    if (cur) {
      if (cur.ctx !== ctx) {
        const r = rule(ctx);
        if (r && r.songs && r.songs.includes(cur.id) && !(ctx === 'mega' && megaSkipped)) { cur.ctx = ctx; audio.loop = loops(ctx); }  // same song wanted: just keep playing
        else audio.loop = false;                                                                  // let it finish, then the new moment takes over
      }
      if (!audio.paused) { const A = gameAudio(); if (A && A.settings && Number(A.settings.music) > 0) quietGame(); }
      render(); return;
    }
    const id = chooseNext(ctx, null);
    if (id) start(id, ctx);
    render();
  }
  setInterval(tick, 300);
  const unlock = () => { if (!unlocked) { unlocked = true; tick(); } };
  ['pointerdown', 'keydown', 'touchstart'].forEach(ev => addEventListener(ev, unlock, { capture: true, passive: true }));

  function skip() {   // ⏭ next song for this moment (or back to the game's music)
    unlocked = true; if (!S.on) return;
    const ctx = context(), was = cur;
    if (ctx === 'mega' && (!was || was.ctx === 'mega') && (RULES.mega?.songs || []).filter(id => TRACKS[id]).length <= 1) megaSkipped = true;
    let id = null;
    if (ctx === 'battle') { const r = RULES.battle; id = r && r.songs ? pick(r.songs, was && was.id) : null; if (id === (was && was.id)) id = null; nextRoll = now() + (r?.every || 150) * 1000; }
    else id = chooseNext(ctx, was && was.id);
    if (id && was && id === was.id && (rule(ctx)?.songs || []).length <= 1) id = null;   // no other song: go back to the game's music
    if (id) start(id, ctx); else hush();
  }

  // ---- UI: ♫ button + small panel ----
  const css = document.createElement('style');
  css.textContent = `
  #ps-music{position:fixed;left:10px;bottom:10px;z-index:60;display:flex;align-items:center;gap:6px;font:600 12px system-ui,sans-serif;color:#fff}
  #ps-music.battle{bottom:auto;top:10px}
  #ps-music .pm-main{width:34px;height:34px;border-radius:50%;border:2px solid #ffd23f;background:rgba(20,16,44,.88);color:#ffd23f;font-size:17px;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(0,0,0,.4)}
  #ps-music .pm-main.on{animation:pmPulse 1.6s ease-in-out infinite}
  #ps-music .pm-main.off{opacity:.55;border-color:#8a80a8;color:#c8c0e0}
  @keyframes pmPulse{50%{box-shadow:0 0 14px rgba(255,210,63,.7)}}
  #ps-music .pm-box{display:none;align-items:center;gap:5px;padding:5px 8px;border:2px solid #9a7bf0;border-radius:10px;background:rgba(20,16,44,.92);box-shadow:0 2px 10px rgba(0,0,0,.4)}
  #ps-music.open .pm-box{display:flex}
  #ps-music .pm-title{max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#e6dcff}
  #ps-music button.pm-b{border:1px solid #6f5aa8;border-radius:6px;background:#2e2550;color:#fff;padding:4px 8px;cursor:pointer;font:inherit}
  #ps-music button.pm-b:hover{border-color:#ffd23f}
  #ps-music input{width:70px;cursor:pointer}`;
  const root = document.createElement('div'); root.id = 'ps-music';
  root.innerHTML = '<button type="button" class="pm-main" title="Custom music">♫</button><div class="pm-box"><span class="pm-title"></span><button type="button" class="pm-b pm-skip" title="Skip to the next song">⏭</button><button type="button" class="pm-b pm-on"></button><input type="range" min="0" max="1" step="0.05" title="Custom music volume"></div>';
  const $ = s => root.querySelector(s);
  ['pointerdown', 'mousedown', 'touchstart', 'click'].forEach(ev => root.addEventListener(ev, e => e.stopPropagation()));
  $('.pm-main').addEventListener('click', () => { S.open = !S.open; save(); render(); });
  $('.pm-on').addEventListener('click', () => { S.on = !S.on; save(); unlocked = true; if (!S.on) hush(); tick(); render(); });
  $('.pm-skip').addEventListener('click', skip);
  const vol = $('input'); vol.value = String(S.volume);
  vol.addEventListener('input', () => { S.volume = Number(vol.value); audio.volume = S.volume; save(); });
  function render() {
    const t = cur && TRACKS[cur.id];
    $('.pm-title').textContent = !S.on ? 'Custom music off' : t ? (cur.ctx === 'mega' ? '✨ ' : '') + t.title : 'Game music' + (gameTrack ? ': ' + gameTrack : '');
    $('.pm-title').title = $('.pm-title').textContent;
    $('.pm-on').textContent = S.on ? 'ON' : 'OFF';
    $('.pm-on').title = S.on ? 'Turn custom music off' : 'Turn custom music on';
    $('.pm-main').classList.toggle('on', !!(cur && !audio.paused));
    $('.pm-main').classList.toggle('off', !S.on);
    root.classList.toggle('open', !!S.open);
  }
  setInterval(() => root.classList.toggle('battle', B()?.game?.state === 'playing'), 300);
  function init() { document.head.append(css); document.body.append(root); restoreGame(); render(); }
  audio.addEventListener('play', render); audio.addEventListener('pause', render);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
  window.PS_MUSIC = { skip, stop: hush, rules: RULES, tracks: TRACKS, _audio: audio, get playing() { return cur && { ...cur }; }, get gameTrack() { return gameTrack; } };
})();
