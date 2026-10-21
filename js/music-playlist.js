/* PokéSurvivor custom music player.
   - Plays your own mp3s (assets/music/) in menus and in battle, looping the playlist.
   - Starts by itself on your first click / key press (browsers block sound before that).
   - While it plays, the game's built-in music is silenced; it comes back when you pause.
   - A small ♫ button sits in the bottom-left corner: click it to open the player
     (play/pause, next, shuffle, volume). Your choice is remembered.
   To add songs: put the .mp3 in assets/music/ and add a line to TRACKS below. */
(() => {
  'use strict';
  if (window.PS_MUSIC_PLAYLIST_INSTALLED) return;
  window.PS_MUSIC_PLAYLIST_INSTALLED = true;

  const TRACKS = [
    { title: 'Tera Raid Battle — Orchestral Remix', file: 'assets/music/tera-raid-orchestral-remix.mp3' },
    // { title: 'My other song', file: 'assets/music/my-other-song.mp3' },
  ];

  const KEY = 'ps.music.playlist.v2';
  let S = { on: true, index: 0, volume: 0.35, shuffle: false, open: false, gameMusicWas: null };
  try { Object.assign(S, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (_) {}
  S.volume = Math.max(0, Math.min(1, Number(S.volume)));
  if (!Number.isFinite(S.volume)) S.volume = 0.35;
  S.index = Math.max(0, Math.min(TRACKS.length - 1, Number(S.index) || 0));
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (_) {} };

  // ---- the game's own music (silenced while ours plays, restored afterwards) ----
  const gameAudio = () => window.PS_MEGA_BRIDGE_V5?.audio || null;
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
  // If the tab is closed while our music plays, put the game's saved music volume back.
  addEventListener('pagehide', () => {
    if (S.gameMusicWas == null) return;
    try { const a = JSON.parse(localStorage.getItem('ps.audio') || '{}'); if (!Number(a.music)) { a.music = S.gameMusicWas; localStorage.setItem('ps.audio', JSON.stringify(a)); } } catch (_) {}
  });

  // ---- audio ----
  const audio = new Audio();
  audio.preload = 'auto';
  audio.volume = S.volume;
  audio.loop = TRACKS.length === 1;
  let unlocked = false;
  function setTrack() {
    if (!TRACKS.length) return;
    audio.src = new URL(TRACKS[S.index].file, document.baseURI).href;
    audio.loop = TRACKS.length === 1;
    render();
  }
  async function play() {
    if (!TRACKS.length) return;
    if (!audio.src) setTrack();
    try { await audio.play(); quietGame(); } catch (e) { /* not allowed yet: waits for a click */ }
    render();
  }
  function pause() { audio.pause(); restoreGame(); render(); }
  function next() {
    if (!TRACKS.length) return;
    if (S.shuffle && TRACKS.length > 1) { let i = S.index; while (i === S.index) i = Math.floor(Math.random() * TRACKS.length); S.index = i; }
    else S.index = (S.index + 1) % TRACKS.length;
    save(); setTrack(); if (S.on) play();
  }
  audio.addEventListener('ended', () => { if (S.on && !audio.loop) next(); });
  audio.addEventListener('error', () => { console.warn('[Music] could not load', TRACKS[S.index]?.file); render('missing file'); });

  // Browsers only allow sound after the player interacts with the page.
  const unlock = () => { if (unlocked) return; unlocked = true; if (S.on) play(); };
  ['pointerdown', 'keydown', 'touchstart'].forEach(ev => addEventListener(ev, unlock, { capture: true, passive: true }));

  // ---- UI: a ♫ button bottom-left that opens a small player ----
  const css = document.createElement('style');
  css.textContent = `
  #ps-music{position:fixed;left:10px;bottom:10px;z-index:60;display:flex;align-items:center;gap:6px;font:600 12px system-ui,sans-serif;color:#fff}
  #ps-music .pm-main{width:34px;height:34px;border-radius:50%;border:2px solid #ffd23f;background:rgba(20,16,44,.88);color:#ffd23f;font-size:17px;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(0,0,0,.4)}
  #ps-music .pm-main.on{animation:pmPulse 1.6s ease-in-out infinite}
  @keyframes pmPulse{50%{box-shadow:0 0 14px rgba(255,210,63,.7)}}
  #ps-music .pm-box{display:none;align-items:center;gap:5px;padding:5px 8px;border:2px solid #9a7bf0;border-radius:10px;background:rgba(20,16,44,.92);box-shadow:0 2px 10px rgba(0,0,0,.4)}
  #ps-music.open .pm-box{display:flex}
  #ps-music .pm-title{max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#e6dcff}
  #ps-music button.pm-b{border:1px solid #6f5aa8;border-radius:6px;background:#2e2550;color:#fff;padding:4px 8px;cursor:pointer;font:inherit}
  #ps-music button.pm-b:hover{border-color:#ffd23f}
  #ps-music input{width:70px;cursor:pointer}
  #ps-music.battle{bottom:auto;top:10px}`;
  const root = document.createElement('div'); root.id = 'ps-music';
  root.innerHTML = '<button type="button" class="pm-main" title="Music">♫</button><div class="pm-box"><span class="pm-title"></span><button type="button" class="pm-b pm-play"></button><button type="button" class="pm-b pm-next" title="Next song">⏭</button><button type="button" class="pm-b pm-shuf" title="Shuffle">⇄</button><input type="range" min="0" max="1" step="0.05" title="Music volume"></div>';
  const $ = s => root.querySelector(s);
  // keep clicks on the player from reaching the game
  ['pointerdown', 'mousedown', 'touchstart', 'click'].forEach(ev => root.addEventListener(ev, e => e.stopPropagation()));
  $('.pm-main').addEventListener('click', () => { S.open = !S.open; save(); render(); });
  $('.pm-play').addEventListener('click', () => { S.on = !S.on; save(); unlocked = true; if (S.on) play(); else pause(); });
  $('.pm-next').addEventListener('click', () => { unlocked = true; next(); });
  $('.pm-shuf').addEventListener('click', () => { S.shuffle = !S.shuffle; save(); render(); });
  const vol = $('input'); vol.value = String(S.volume);
  vol.addEventListener('input', () => { S.volume = Number(vol.value); audio.volume = S.volume; save(); });
  function render(note) {
    const t = TRACKS[S.index];
    $('.pm-title').textContent = note ? '⚠ ' + note : (t ? t.title : 'No songs yet');
    $('.pm-play').textContent = S.on && !audio.paused ? '❚❚' : '▶';
    $('.pm-play').title = S.on ? 'Pause music' : 'Play music';
    $('.pm-shuf').style.borderColor = S.shuffle ? '#ffd23f' : '#6f5aa8';
    $('.pm-main').classList.toggle('on', S.on && !audio.paused);
    root.classList.toggle('open', !!S.open);
  }
  function init() {
    document.head.append(css); document.body.append(root);
    if (!S.on) restoreGame();   // tidy up if the page was closed mid-song last time
    setTrack(); render();
    if (S.on) play();           // works right away if the browser already allows sound
  }
  // In battle the player moves to the top-left corner so it never covers the move bar.
  setInterval(() => { root.classList.toggle('battle', window.PS_MEGA_BRIDGE_V5?.game?.state === 'playing'); }, 300);
  // If the game resets its music volume itself (e.g. Settings), keep ours as the only music.
  setInterval(() => { if (S.on && !audio.paused) { const A = gameAudio(); if (A && A.settings && Number(A.settings.music) > 0) quietGame(); } }, 1500);
  audio.addEventListener('play', () => render());
  audio.addEventListener('pause', () => render());
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
  window.PS_MUSIC = { play() { S.on = true; save(); unlocked = true; return play(); }, pause() { S.on = false; save(); pause(); }, next };
})();
