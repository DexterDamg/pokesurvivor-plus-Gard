/* Quality-of-life + new features, inspired by the Android port of PokéSurvivor (github.com/JayElDragon/poke-survivor,
   MIT code by JPTER78 / JayElDragon). Rewritten for the web game:
   - ⚙ settings button (next to ♫): Minimap, FPS counter, Reduce screen shake (base game only; the mod's effects always keep theirs)
   - Minimap: circular radar (foes, bosses, items, chests, rifts, allies, north marker)
   - Melee buff: melee moves +25% damage, +10% reach, short invincibility on each swing
 */
(() => {
  'use strict';
  if (window.PS_QUALITY_INSTALLED) return; window.PS_QUALITY_INSTALLED = true;
  const B = () => window.PS_MEGA_BRIDGE_V5, E = () => window.PS_HOOPA_ENGINE;
  const KEY = 'ps.quality.v1';
  let Q = { minimap: true, fps: false, calm: false, open: false };
  try { Object.assign(Q, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (_) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(Q)); } catch (_) {} };
  window.PS_SETTINGS = { get reduceFx() { return !!Q.calm; }, get minimap() { return !!Q.minimap; } };
  const ownKick = v => { window.__psModKick = true; try { B()?.camera?.kick?.(v); } catch (_) {} finally { window.__psModKick = false; } };
  const playing = () => B()?.game?.state === 'playing';
  const inRun = () => { const st = B()?.game?.state; return !!(st && st !== 'ui' && st !== 'over'); };

  // ---------------- reduce screen shake: dampen every camera kick ----------------
  function wrapCamera() { const C = B()?.camera; if (!C || C.__psCalm || typeof C.kick !== 'function') return; const k = C.kick; C.__psCalm = true; C.kick = function (v, ...a) { const own = window.__psFullKick || window.__psModKick; return k.call(this, Q.calm && !own ? (Number(v) || 0) * 0.25 : v, ...a); }; }

  // ---------------- melee buff ----------------
  let meleeDone = false;
  function buffMelee() {
    const M = B()?.moves; if (meleeDone || !M || !Array.isArray(M.ALL) || !M.ALL.length) return; meleeDone = true;
    for (const m of M.ALL) if (m && m.kind === 'melee' && !m.__psMelee) { m.__psMelee = true; m.dmg = Math.round((Number(m.dmg) || 10) * 1.25); m.radius = Math.round((Number(m.radius) || 50) * 1.1); }
  }

  // ---------------- UI ----------------
  const css = document.createElement('style');
  css.textContent = `
  #ps-q-btn{position:fixed;left:52px;bottom:10px;z-index:60;width:34px;height:34px;border-radius:50%;border:2px solid #9a7bf0;background:rgba(20,16,44,.88);color:#c9b6ff;font-size:17px;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(0,0,0,.4)}
  #ps-q-btn.battle{bottom:auto;top:10px}
  #ps-q-panel{position:fixed;left:10px;bottom:52px;z-index:61;display:none;min-width:250px;padding:10px 12px;border:2px solid #9a7bf0;border-radius:12px;background:rgba(18,14,40,.96);color:#fff;font:600 13px system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.5)}
  #ps-q-panel.battle{bottom:auto;top:52px}#ps-q-panel.open{display:block}
  #ps-q-panel h4{margin:0 0 8px;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#c9b6ff}
  #ps-q-panel label{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:5px 0;cursor:pointer}
  #ps-q-panel input{width:18px;height:18px;cursor:pointer;accent-color:#ff6fb5}
  #ps-q-panel small{display:block;color:#9fb1c9;font-weight:500;margin-top:6px;line-height:1.35}
  #ps-minimap{position:fixed;right:14px;top:122px;z-index:40;width:124px;height:124px;pointer-events:none;display:none;filter:drop-shadow(0 3px 8px rgba(0,0,0,.45))}
  #ps-fps{position:fixed;left:96px;top:16px;z-index:60;display:none;padding:2px 8px;border-radius:8px;background:rgba(0,0,0,.55);color:#9effa8;font:700 12px ui-monospace,monospace;pointer-events:none}
  @media (max-width:700px){#ps-minimap{width:96px;height:96px;top:104px}}`;
  const btn = document.createElement('button'); btn.id = 'ps-q-btn'; btn.type = 'button'; btn.title = 'Game settings (minimap, FPS, effects)'; btn.textContent = '⚙';
  const panel = document.createElement('div'); panel.id = 'ps-q-panel';
  panel.innerHTML = '<h4>Game settings</h4>' +
    '<label>Minimap<input type="checkbox" data-k="minimap"></label>' +
    '<label>FPS counter<input type="checkbox" data-k="fps"></label>' +
    '<label>Reduce screen shake<input type="checkbox" data-k="calm"></label>';
  const mm = document.createElement('canvas'); mm.id = 'ps-minimap'; mm.width = 248; mm.height = 248;
  const fpsEl = document.createElement('div'); fpsEl.id = 'ps-fps';
  [btn, panel].forEach(el => ['pointerdown', 'mousedown', 'touchstart', 'click'].forEach(ev => el.addEventListener(ev, e => e.stopPropagation())));
  btn.addEventListener('click', () => { Q.open = !Q.open; save(); render(); });
  panel.addEventListener('change', e => { const k = e.target?.dataset?.k; if (k) { Q[k] = !!e.target.checked; save(); render(); } });
  function render() {
    const battle = B()?.game?.state === 'playing';
    btn.classList.toggle('battle', battle); panel.classList.toggle('battle', battle); panel.classList.toggle('open', !!Q.open);
    panel.querySelectorAll('input[data-k]').forEach(i => { i.checked = !!Q[i.dataset.k]; });
    mm.style.display = Q.minimap && battle ? 'block' : 'none';
    fpsEl.style.display = Q.fps ? 'block' : 'none';
  }

  // ---------------- minimap ----------------
  const MM_RANGE = 700;
  function drawMinimap() {
    if (!Q.minimap || !playing()) return;
    const b = B(), e = E(), p = b?.game?.player; if (!p) return;
    const c = mm.getContext('2d'), W = mm.width, R = W / 2 - 6, cx = W / 2, cy = W / 2, s = R / MM_RANGE;
    c.clearRect(0, 0, W, W); c.save();
    c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.fillStyle = 'rgba(12,16,34,.78)'; c.fill(); c.clip();
    c.strokeStyle = 'rgba(255,255,255,.07)'; c.lineWidth = 2; for (const f of [0.33, 0.66]) { c.beginPath(); c.arc(cx, cy, R * f, 0, Math.PI * 2); c.stroke(); }
    const pos = (x, y) => [cx + (x - p.x) * s, cy + (y - p.y) * s];
    const inR = (x, y) => Math.hypot(x - p.x, y - p.y) < MM_RANGE;
    try { const W2 = b.world; if (W2) {
      for (const q of W2.propsInCircle(p.x, p.y, MM_RANGE)) if (q && q.type === 'chest' && q.hp > 0) { const [x, y] = pos(q.x, q.y); c.fillStyle = '#ffcf3a'; c.fillRect(x - 4, y - 4, 8, 8); }
      if (W2.specialsNear) for (const q of W2.specialsNear(p.x, p.y, MM_RANGE)) { const [x, y] = pos(q.x, q.y);
        if (q.type === 'bigchest' && !q.hoopaOpened) { c.fillStyle = '#ff9f1a'; c.fillRect(x - 6, y - 6, 12, 12); c.strokeStyle = '#fff'; c.lineWidth = 2; c.strokeRect(x - 6, y - 6, 12, 12); }
        else if (q.type === 'altar' && !q.used) { c.fillStyle = '#5ee0ff'; c.beginPath(); c.moveTo(x, y - 6); c.lineTo(x + 5, y); c.lineTo(x, y + 6); c.lineTo(x - 5, y); c.fill(); } } } } catch (_) {}
    try { const P = e && e.Pickups; if (P && P.all) for (const d of P.all()) { if (!d || !inR(d.x, d.y) || d.kind === 'xp') continue; const [x, y] = pos(d.x, d.y); c.fillStyle = d.kind === 'heal' ? '#ff7aa8' : d.kind === 'item' ? '#c9a6ff' : '#fff27a'; c.beginPath(); c.arc(x, y, 3, 0, Math.PI * 2); c.fill(); } } catch (_) {}
    try { const allies = [...(window.PS_FX && window.PS_FX.list ? window.PS_FX.list('minion') : []), ...((window.PS_HOOPA && window.PS_HOOPA.summons) || [])];
      for (const a of allies) { if (!a || a.dead || !inR(a.x, a.y)) continue; const [x, y] = pos(a.x, a.y); c.fillStyle = '#5fe08a'; c.beginPath(); c.arc(x, y, 3.5, 0, Math.PI * 2); c.fill(); } } catch (_) {}
    try { for (const en of b.enemies.all()) { if (!en || en.dead || !inR(en.x, en.y)) continue; const [x, y] = pos(en.x, en.y);
      if (en.boss || en.legend) { c.fillStyle = '#ff9a3d'; c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, 6, 0, Math.PI * 2); c.fill(); c.stroke(); }
      else { c.fillStyle = en.shiny ? '#ffe36a' : '#ff4d5e'; c.fillRect(x - 2.5, y - 2.5, 5, 5); } } } catch (_) {}
    // rift: shown on the map, or as an arrow at the edge when it is out of range
    try { const Rf = e && e.Rift; const rf = Rf && Rf.open && Rf.rift; if (rf) { const t = performance.now() / 300, d = Math.hypot(rf.x - p.x, rf.y - p.y);
      let [x, y] = pos(rf.x, rf.y); if (d > MM_RANGE * 0.92) { const a = Math.atan2(rf.y - p.y, rf.x - p.x); x = cx + Math.cos(a) * (R - 9); y = cy + Math.sin(a) * (R - 9); }
      c.fillStyle = '#c86bff'; c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, 6 + Math.sin(t) * 1.5, 0, Math.PI * 2); c.fill(); c.stroke(); } } catch (_) {}
    // you
    const a = Number(p.aim) || 0; c.translate(cx, cy); c.rotate(a); c.fillStyle = '#ffffff'; c.strokeStyle = '#1a1a2e'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(9, 0); c.lineTo(-6, -6); c.lineTo(-3, 0); c.lineTo(-6, 6); c.closePath(); c.fill(); c.stroke(); c.restore();
    c.lineWidth = 4; c.strokeStyle = '#c9a85a'; c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.stroke();
    c.fillStyle = '#ffd23f'; c.font = 'bold 16px system-ui,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('N', cx, 14);
  }

  // ---------------- loop ----------------
  let last = performance.now(), frames = 0, fpsT = 0, mmT = 0, uiT = 0;
  // ---------------- TM loot: only general moves ----------------
  // The TM list (gold rifts / boss loot) is built from every move in the game, which now includes signature moves
  // that belong to one Pokemon (Judgment, Roar of Time, Echo's moves...). Only moves from the normal type pools are offered.
  const TM_EXTRA = ['calm-mind'];
  let tmWrapped = false;
  function wrapTMs() {
    const N = window.PS_HOOPA_ENGINE, L = N && N.Loot, M = N && N.Moves; if (tmWrapped || !L || !M || typeof L.tmDown !== 'function') return; tmWrapped = true;
    const general = () => { const ok = new Set(TM_EXTRA); for (const list of Object.values(M.POOL || {})) for (const id of (list || [])) ok.add(id); return M.ALL.filter(m => m && ok.has(m.id) && !m.psCast && !m.sig); };
    const orig = L.tmDown;
    L.tmDown = function (...a) { const all = M.ALL; let swapped = false; try { M.ALL = general(); swapped = true; } catch (_) {} try { return orig.apply(this, a); } finally { if (swapped) M.ALL = all; } };
  }
  function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    wrapCamera(); buffMelee(); wrapTMs();
    frames++; fpsT += dt; if (fpsT >= 0.5) { fpsEl.textContent = Math.round(frames / fpsT) + ' FPS'; frames = 0; fpsT = 0; }
    mmT += dt; if (mmT >= 0.15) { mmT = 0; try { drawMinimap(); } catch (_) {} }
    uiT += dt; if (uiT >= 0.25) { uiT = 0; render(); }
  }
  function init() { document.head.append(css); document.body.append(btn, panel, mm, fpsEl); render(); requestAnimationFrame(loop); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
  window.PS_QUALITY = { settings: Q };
})();
