/* PokéSurvivor custom music — plays your own songs at certain moments, like area music in other games.
   Everywhere else the game's own music plays as normal.

   HOW TO CHANGE IT (only edit the two lists below):
   1) TRACKS: every song you uploaded to assets/music/, each with a short id.
   2) RULES:  when each song plays.
        mega:   plays the moment you Mega Evolve (or go Primal), from the start, and loops while the
                Mega form lasts. When the run ends, the game's music comes back.
        battle: during a run, now and then one of these songs plays once, then the game's music returns.
                chance = how likely each roll is (0.3 = 30%), every = seconds between rolls,
                first = a roll right when the battle starts.
        menu:   song for the main menu (null = the game's own menu music).
   A ♫ button (bottom-left in menus, top-left in battle) opens: on/off, skip, volume. */
(() => {
  'use strict';
  if (window.PS_MUSIC_PLAYLIST_INSTALLED) return;
  window.PS_MUSIC_PLAYLIST_INSTALLED = true;

  const TRACKS = {
    'tera':      { title: 'Tera Raid Battle — Orchestral Remix', file: 'assets/music/tera-raid-orchestral-remix.mp3' },
    'zone-zero': { title: 'Zone Zero',                           file: 'assets/music/zone-zero.mp3' },
  };
  const RULES = {
    mega:   { songs: ['tera'] },
    battle: { songs: ['tera'], chance: 0.3, every: 150, first: true },
    menu:   null,
  };

  // ------------------------------------------------------------------------------------------
  const KEY = 'ps.music.zones.v1';
  let S = { on: true, volume: 0.35, open: false, gameMusicWas: null };
  try { const old = JSON.parse(localStorage.getItem('ps.music.playlist.v2') || 'null'); if (old) { S.volume = Number(old.volume) || S.volume; S.gameMusicWas = old.gameMusicWas ?? null; } } catch (_) {}
  try { Object.assign(S, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (_) {}
  S.volume = Math.max(0, Math.min(1, Number(S.volume))); if (!Number.isFinite(S.volume)) S.volume = 0.35;
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (_) {} };
  const pick = list => (list && list.length ? list[Math.floor(Math.random() * list.length)] : null);
  const B = () => window.PS_MEGA_BRIDGE_V5;

  // ---- the game's own music: silenced while one of our songs plays, restored afterwards ----
  const gameAudio = () => B()?.audio || null;
  function quietGame() {
    const A = gameAudio(); if (!A || !A.settings) return;
    const cur = Number(A.settings.music);
    if (cur > 0) { S.gameMusicWas = cur; save(); try { A.setVolume('music', 0); } catch (_) {} }
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

  // ---- player ----
  const audio = new Audio(); audio.preload = 'auto'; audio.volume = S.volume;
  let cur = null;          // { id, why: 'mega'|'battle'|'menu' }
  let unlocked = false, fadeT = null;
  function start(id, why, loop) {
    const t = TRACKS[id]; if (!t) return;
    cur = { id, why };
    clearInterval(fadeT); audio.volume = S.volume;
    audio.src = new URL(t.file, document.baseURI).href; audio.loop = !!loop; audio.currentTime = 0;
    audio.play().then(() => { quietGame(); render(); }).catch(() => render());
    render();
  }
  function stop(fade) {
    if (!cur) return; cur = null;
    clearInterval(fadeT);
    if (fade && !audio.paused) {
      fadeT = setInterval(() => { audio.volume = Math.max(0, audio.volume - S.volume / 12); if (audio.volume <= 0.001) { clearInterval(fadeT); audio.pause(); audio.volume = S.volume; restoreGame(); } }, 80);
    } else { audio.pause(); restoreGame(); }
    render();
  }
  audio.addEventListener('ended', () => { if (cur && cur.why === 'battle') { stop(false); nextRoll = now() + RULES.battle.every * 1000; } });
  audio.addEventListener('error', () => { console.warn('[Music] could not load', cur && TRACKS[cur.id]?.file); stop(false); });
  const now = () => performance.now();

  // ---- which song should be playing right now? ----
  let wasBattle = false, wasMega = false, nextRoll = 0;
  function tick() {
    const g = B()?.game, p = g?.player, st = g?.state, battle = !!(st && st !== 'ui' && st !== 'over');   // 'ui' = menus, 'over' = run ended
    const mega = !!(battle && p && p.megaForm);
    if (!S.on || !unlocked) { if (cur) stop(false); wasBattle = battle; wasMega = mega; return; }

    if (mega) {                                            // Mega Evolution music
      if (!wasMega || !cur || cur.why !== 'mega') { const id = pick(RULES.mega && RULES.mega.songs); if (id) start(id, 'mega', true); }
    } else if (battle) {
      if (cur && cur.why !== 'battle') stop(true);         // Mega ended / came from the menu
      if (!wasBattle) nextRoll = RULES.battle && RULES.battle.first ? now() : now() + (RULES.battle?.every || 150) * 1000;
      if (RULES.battle && !cur && now() >= nextRoll) {     // random battle song
        nextRoll = now() + RULES.battle.every * 1000;
        if (Math.random() < RULES.battle.chance) { const id = pick(RULES.battle.songs); if (id) start(id, 'battle', false); }
      }
    } else {                                               // menus
      if (RULES.menu && (!cur || cur.why !== 'menu')) start(RULES.menu, 'menu', true);
      else if (!RULES.menu && cur) stop(true);
    }
    // the game can re-raise its own music volume (e.g. in Settings): keep ours the only music while it plays
    if (cur && !audio.paused) { const A = gameAudio(); if (A && A.settings && Number(A.settings.music) > 0) quietGame(); }
    wasBattle = battle; wasMega = mega;
  }
  setInterval(tick, 300);
  const unlock = () => { if (!unlocked) { unlocked = true; tick(); } };
  ['pointerdown', 'keydown', 'touchstart'].forEach(ev => addEventListener(ev, unlock, { capture: true, passive: true }));

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
  #ps-music .pm-title{max-width:190px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#e6dcff}
  #ps-music button.pm-b{border:1px solid #6f5aa8;border-radius:6px;background:#2e2550;color:#fff;padding:4px 8px;cursor:pointer;font:inherit}
  #ps-music button.pm-b:hover{border-color:#ffd23f}
  #ps-music input{width:70px;cursor:pointer}`;
  const root = document.createElement('div'); root.id = 'ps-music';
  root.innerHTML = '<button type="button" class="pm-main" title="Custom music">♫</button><div class="pm-box"><span class="pm-title"></span><button type="button" class="pm-b pm-on"></button><button type="button" class="pm-b pm-skip" title="Skip this song (back to the game music)">⏭</button><input type="range" min="0" max="1" step="0.05" title="Custom music volume"></div>';
  const $ = s => root.querySelector(s);
  ['pointerdown', 'mousedown', 'touchstart', 'click'].forEach(ev => root.addEventListener(ev, e => e.stopPropagation()));
  $('.pm-main').addEventListener('click', () => { S.open = !S.open; save(); render(); });
  $('.pm-on').addEventListener('click', () => { S.on = !S.on; save(); unlocked = true; if (!S.on) stop(true); tick(); render(); });
  $('.pm-skip').addEventListener('click', () => { if (cur) { const why = cur.why; stop(true); if (why === 'battle') nextRoll = now() + RULES.battle.every * 1000; else if (why === 'mega') wasMega = true; } });
  const vol = $('input'); vol.value = String(S.volume);
  vol.addEventListener('input', () => { S.volume = Number(vol.value); audio.volume = S.volume; save(); });
  function render() {
    const t = cur && TRACKS[cur.id];
    $('.pm-title').textContent = !S.on ? 'Custom music off' : t ? (cur.why === 'mega' ? '✨ ' : '') + t.title : 'Game music';
    $('.pm-on').textContent = S.on ? 'ON' : 'OFF';
    $('.pm-on').title = S.on ? 'Turn custom music off' : 'Turn custom music on';
    $('.pm-main').classList.toggle('on', !!(cur && !audio.paused));
    $('.pm-main').classList.toggle('off', !S.on);
    root.classList.toggle('open', !!S.open);
  }
  setInterval(() => root.classList.toggle('battle', B()?.game?.state === 'playing'), 300);
  function init() {
    document.head.append(css); document.body.append(root);
    restoreGame();   // tidy up if the page was closed mid-song last time
    render();
  }
  audio.addEventListener('play', render); audio.addEventListener('pause', render);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
  window.PS_MUSIC = { play: (id, loop) => { unlocked = true; start(id || 'tera', 'manual', loop); }, stop: () => stop(true), rules: RULES, tracks: TRACKS };
})();
