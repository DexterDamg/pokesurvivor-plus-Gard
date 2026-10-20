/* PokéSurvivor+ Mega UI proof-of-concept v0.1.
   Independent of app.min.js; does NOT alter game state or saves. */
(() => {
  'use strict';
  const init = () => {
    if (document.getElementById('ps-mega-test-root')) return;
    const root = document.createElement('aside');
    root.id = 'ps-mega-test-root';
    root.setAttribute('aria-label', 'Mega Evolution test panel');
    root.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:2147483640;max-width:290px;padding:14px;border:2px solid #b991ff;border-radius:12px;background:#201632;color:#fff;box-shadow:0 6px 24px #0009;font:14px/1.4 system-ui,sans-serif;text-align:left;';
    const heading = document.createElement('div');
    heading.textContent = '✦ MEGA TEST — safe mode';
    heading.style.cssText = 'font-weight:800;margin-bottom:8px;color:#e5d5ff;';
    const description = document.createElement('p');
    description.textContent = 'The separate mega.js file loaded successfully. Game code and saves are untouched.';
    description.style.cssText = 'margin:0 0 10px;';
    const status = document.createElement('p');
    status.textContent = 'Mega Evolution not implemented yet.';
    status.style.cssText = 'margin:0 0 8px;font-size:12px;color:#dfcaff;';
    const test = document.createElement('button');
    test.type = 'button';
    test.textContent = 'Test Mega Button';
    test.style.cssText = 'background:#8654d3;border:0;border-radius:7px;padding:8px 12px;color:white;font-weight:700;cursor:pointer;';
    test.addEventListener('click', () => { status.textContent = 'Button works! This is only a UI test; no Pokémon was transformed.'; });
    const close = document.createElement('button');
    close.type = 'button';
    close.textContent = '×';
    close.setAttribute('aria-label', 'Close Mega test panel');
    close.style.cssText = 'position:absolute;top:6px;right:9px;border:0;background:transparent;color:white;font-size:22px;cursor:pointer;';
    close.addEventListener('click', () => root.remove());
    root.append(heading, description, status, test, close);
    document.body.appendChild(root);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
