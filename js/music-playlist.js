/* Optional PokéSurvivor music playlist. Separate from the game's SFX engine. */
(() => {
  'use strict';
  if (window.PS_MUSIC_PLAYLIST_INSTALLED) return;
  window.PS_MUSIC_PLAYLIST_INSTALLED = true;

  // Add files you have permission to use to assets/music and edit this list.
  const TRACKS = [
    { title: 'Tera Raid Battle — Orchestral Remix', file: 'assets/music/tera-raid-orchestral-remix.mp3' },
    // Add other permitted tracks here to cycle automatically when a song ends.
    // { title: 'Zone Zero', file: 'assets/music/zone-zero.mp3' },
  ];
  const KEY = 'ps.music.playlist.v1';
  const defaults = { index: 0, volume: 0.24, shuffle: false };
  let settings = { ...defaults };
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || '{}');
    if (stored && typeof stored === 'object') settings = { ...settings, ...stored };
  } catch (_) {}
  settings.volume = Math.max(0, Math.min(1, Number(settings.volume) || 0));
  settings.index = Math.max(0, Math.min(TRACKS.length - 1, Number(settings.index) || 0));
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch (_) {} };

  const audio = new Audio();
  audio.preload = 'none';
  audio.volume = settings.volume;
  audio.loop = false;
  let running = false;
  let failed = 0;
  let wanted = false; // User opted in to music during battles
  const inBattle = () => window.PS_MEGA_BRIDGE_V5?.game?.state === 'playing';
  const element = (tag, text) => { const x = document.createElement(tag); if (text) x.textContent = text; return x; };
  const panel = element('div');
  panel.id = 'ps-music-playlist';
  panel.style.cssText = 'display:flex;align-items:center;gap:5px;flex-wrap:wrap;max-width:360px;padding:4px 6px;border:1px solid #817194;border-radius:9px;background:#242132;color:#fff;font:12px system-ui,sans-serif;';
  const label = element('span', '♫ Music');
  label.style.cssText = 'font-weight:700;max-width:105px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
  const btn = (text, help) => {
    const b = element('button', text);
    b.type = 'button'; b.title = help;
    b.style.cssText = 'border:1px solid #796b91;border-radius:6px;background:#403750;color:white;padding:5px 8px;cursor:pointer;';
    b.addEventListener('pointerdown', e => e.stopPropagation());
    b.addEventListener('mousedown', e => e.stopPropagation());
    b.addEventListener('click', e => e.stopPropagation());
    return b;
  };
  const toggle = btn('▶', 'Play or pause playlist');
  const next = btn('⏭', 'Next track');
  const shuffle = btn('⇄', 'Toggle shuffle');
  const volume = document.createElement('input');
  volume.type = 'range'; volume.min = '0'; volume.max = '1'; volume.step = '0.05';
  volume.value = String(settings.volume); volume.title = 'Music volume'; volume.setAttribute('aria-label', 'Music volume');
  volume.style.cssText = 'width:65px;cursor:pointer';
  volume.addEventListener('pointerdown', e => e.stopPropagation());
  const status = element('span');
  status.style.cssText = 'position:absolute;left:-9999px';
  status.setAttribute('aria-live', 'polite');
  function update() {
    const t = TRACKS[settings.index];
    label.textContent = t ? '♫ ' + t.title : '♫ No tracks';
    label.title = t ? t.title : 'Add tracks to js/music-playlist.js';
    toggle.textContent = wanted ? '⏸' : '▶';
    shuffle.style.borderColor = settings.shuffle ? '#dfc057' : '#796b91';
  }
  function setTrack() {
    if (!TRACKS.length) return;
    const item = TRACKS[settings.index];
    // Relative paths resolve to the repository's GitHub Pages base path.
    audio.src = new URL(item.file, document.baseURI).href;
    audio.load();
    status.textContent = 'Selected ' + item.title;
    save(); update();
  }
  function pickNext() {
    if (!TRACKS.length) return;
    if (settings.shuffle && TRACKS.length > 1) {
      let i = settings.index;
      while (i === settings.index) i = Math.floor(Math.random() * TRACKS.length);
      settings.index = i;
    } else settings.index = (settings.index + 1) % TRACKS.length;
    setTrack();
  }
  async function play() {
    if (!inBattle()) { audio.pause(); running = false; update(); return; }
    if (!TRACKS.length) { status.textContent = 'No music files configured'; return; }
    if (!audio.src) setTrack();
    try {
      await audio.play();
      running = true; failed = 0; update();
    } catch (err) {
      running = false; update();
      status.textContent = 'Could not play music; check audio file and browser permissions.';
      console.warn('[PS Playlist]', status.textContent, err);
    }
  }
  toggle.addEventListener('click', () => {
    wanted = !wanted;
    if (!wanted) { running = false; audio.pause(); update(); }
    else play();
  });
  next.addEventListener('click', () => { pickNext(); if (wanted) play(); });
  shuffle.addEventListener('click', () => { settings.shuffle = !settings.shuffle; save(); update(); });
  volume.addEventListener('input', () => { settings.volume = Number(volume.value); audio.volume = settings.volume; save(); });
  audio.addEventListener('ended', () => { if (wanted && inBattle()) { pickNext(); play(); } });
  audio.addEventListener('error', () => {
    status.textContent = 'Missing music file: ' + (TRACKS[settings.index]?.file || 'unknown');
    console.warn('[PS Playlist]', status.textContent);
    // Don't endlessly skip missing files; request player correction.
    running = false; wanted = false; update();
  });
  panel.append(label, toggle, next, shuffle, volume, status);
  function mount() {
    if (panel.isConnected) return;
    const sound = document.getElementById('btn-sound');
    if (sound?.parentElement) sound.insertAdjacentElement('afterend', panel);
    else document.body.append(panel);
  }
  function init() { mount(); update(); setTrack(); panel.style.display='none'; }
  // Pause while browsing menus and automatically resume if battle returns.
  let wasInBattle = false;
  setInterval(() => {
    const battle = inBattle();
    panel.style.display = battle ? 'flex' : 'none';
    if (!battle && !audio.paused) { audio.pause(); running = false; update(); }
    if (battle && !wasInBattle && wanted) play();
    wasInBattle = battle;
  }, 300);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
  window.PS_MUSIC = { play() { wanted = true; update(); return play(); }, pause() { wanted = false; running = false; audio.pause(); update(); }, next() { pickNext(); if (wanted) return play(); } };
})();
