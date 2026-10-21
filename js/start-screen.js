/* PRESS START — a title screen shown when the game opens.
   Browsers only allow music after the first click or key press, so the game waits here; the moment you press,
   the title-screen MP3s start right away (no more silent menu until you click something). */
(() => {
  'use strict';
  if (window.PS_START_INSTALLED) return; window.PS_START_INSTALLED = true;
  const css = document.createElement('style');
  css.textContent = `
  #ps-start{position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;cursor:pointer;user-select:none;
    background:radial-gradient(circle at 50% 42%,rgba(44,81,159,.92),rgba(11,24,56,.97) 70%),#0b1838;transition:opacity .5s ease}
  #ps-start.out{opacity:0;pointer-events:none}
  #ps-start img{width:min(560px,82vw);image-rendering:auto;filter:drop-shadow(0 8px 0 rgba(0,0,0,.35));animation:psLogo 3.2s ease-in-out infinite}
  @keyframes psLogo{50%{transform:translateY(-8px) scale(1.015)}}
  #ps-start .press{font:700 clamp(18px,3.2vw,28px) Pixelify,"Segoe UI",system-ui,sans-serif;color:#ffd23f;letter-spacing:2px;text-shadow:3px 3px 0 #0a1430;animation:psBlink 1.1s steps(2) infinite}
  @keyframes psBlink{50%{opacity:.15}}
  #ps-start .small{font:600 13px Pixelify,"Segoe UI",system-ui,sans-serif;color:#b9cbf0;text-shadow:2px 2px 0 #0a1430;opacity:.85}
  #ps-start .sp{position:absolute;width:6px;height:6px;background:#fff;box-shadow:0 0 8px #9ae6ff;animation:psSp 3s linear infinite;opacity:0}
  @keyframes psSp{10%{opacity:1}100%{transform:translateY(-140px);opacity:0}}`;
  const el = document.createElement('div'); el.id = 'ps-start';
  el.innerHTML = '<img src="assets/ui/logo-intox4.webp" alt="PokéSurvivor" onerror="this.style.display=\'none\'"><div class="press">PRESS ANY KEY OR CLICK TO START</div><div class="small">♫ music starts when you press</div>';
  for (let i = 0; i < 18; i++) { const s = document.createElement('i'); s.className = 'sp'; s.style.left = (5 + Math.random() * 90) + '%'; s.style.top = (40 + Math.random() * 55) + '%'; s.style.animationDelay = (Math.random() * 3) + 's'; el.appendChild(s); }
  let done = false;
  function start() {
    if (done) return; done = true; el.classList.add('out');
    // the music player listens for this same click/key and starts the title music immediately
    setTimeout(() => el.remove(), 550);
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach(ev => el.addEventListener(ev, start));
  addEventListener('keydown', e => { if (!done && document.body.contains(el)) start(); }, true);
  function init() { document.head.append(css); document.body.append(el); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();
