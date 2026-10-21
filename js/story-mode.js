/* GAME MODE TOGGLE: Original / Story   (main menu, saved with your profile)
   Original  the game as it was: Gacha, Levels, Dens, everything you already have.
   Story     adds the friend's Story content on top:
               - Story Mode chapters (Chapter 1: Kanto Route 1 vs your rival Blue)   js/route1.js
               - your Trainer walking behind you, catching wild Pokemon with Poke Balls, Potions,
                 the Trainer's Bag, wild Pokemon sizes, the Poke Mart and Trainer menu   js/catching.js
               - the Special Gacha (starters, Dratini, Beldum... and a very rare Magearna)  js/special-gacha.js
   Shared by both modes: the smarter wild Pokemon (js/enemy-ai.js), Primal Outbreak (js/primal-outbreak.js) and
   every other feature. Your collection, coins and items are the same in both modes. */
(() => {
  'use strict';
  if (window.PS_STORY_INSTALLED) return; window.PS_STORY_INSTALLED = true;
  const E = () => window.PS_HOOPA_ENGINE, B = () => window.PS_MEGA_BRIDGE_V5;
  const KEY = 'ps-game-mode';
  function get() {
    try { const S = E()?.DB?.save; if (S && (S.psGameMode === 'story' || S.psGameMode === 'original')) return S.psGameMode; } catch (_) {}
    try { const v = localStorage.getItem(KEY); if (v === 'story' || v === 'original') return v; } catch (_) {}
    return 'original';
  }
  function set(mode) {
    if (mode !== 'story' && mode !== 'original') return;
    try { const S = E()?.DB?.save; if (S) { S.psGameMode = mode; E().DB.commit(); } } catch (_) {}
    try { localStorage.setItem(KEY, mode); } catch (_) {}
    render();
    try { window.PS_TOAST && window.PS_TOAST(mode === 'story' ? 'Story Mode on' : 'Original Mode on', mode === 'story' ? 'Story chapters, your Trainer and catching are on' : 'The classic game, no catching', { ms: 3200 }); } catch (_) {}
  }
  // the mode can only change from the main menu (never in the middle of a run)
  window.PS_STORY = { on: () => get() === 'story', mode: get, set };

  const css = document.createElement('style');
  css.textContent = `
  #ps-gm{display:flex;align-items:center;gap:8px;margin:0 0 8px;padding:6px 8px;border-radius:12px;background:rgba(10,20,48,.72);border:2px solid #2a3a6a;font:700 13px Pixelify,Fredoka,system-ui,sans-serif;color:#cfe0ff}
  #ps-gm .lbl{letter-spacing:2px;font-size:11px;opacity:.8;padding-left:4px}
  #ps-gm .seg{display:flex;flex:1;background:#0b1430;border-radius:9px;padding:3px;gap:3px}
  #ps-gm button{flex:1;padding:6px 10px;border:0;border-radius:7px;background:transparent;color:#9fb3e0;font:800 14px Pixelify,Fredoka,system-ui,sans-serif;cursor:pointer;letter-spacing:.5px}
  #ps-gm button.on{background:linear-gradient(#ffe066,#ffc21a);color:#2a1d00;box-shadow:0 2px 0 #b07a00}
  #ps-gm button[data-m="story"].on{background:linear-gradient(#8fd0ff,#4a8cff);color:#071a3a;box-shadow:0 2px 0 #1d4aa8}`;
  function render() {
    const list = document.querySelector('.menu-box .menu-list'); if (!list) return;
    let el = document.getElementById('ps-gm');
    if (!el) {
      el = document.createElement('div'); el.id = 'ps-gm';
      el.innerHTML = '<span class="lbl">MODE</span><div class="seg"><button data-m="original">Original</button><button data-m="story">Story</button></div>';
      el.addEventListener('click', ev => { const b = ev.target.closest('[data-m]'); if (!b) return; ev.preventDefault(); ev.stopPropagation(); if (b.dataset.m !== get()) set(b.dataset.m); }, true);
    }
    if (el.parentNode !== list.parentNode || el.nextSibling !== list) list.parentNode.insertBefore(el, list);
    const m = get(); for (const b of el.querySelectorAll('[data-m]')) b.classList.toggle('on', b.dataset.m === m);
  }
  function init() { document.head.append(css); setInterval(() => { try { render(); } catch (_) {} }, 500); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();
