/* BALANCE: late-game enemy scaling (feedback item 1)
   Before: normal enemies gained HP in a straight line forever (x7.3 at 10 min, x13.6 at 20 min, x19.9 at 30 min)
   while damage and formations barely changed, so late runs became "everything is a sponge".
   Now (normal maps; Area Zero's endless scaling is untouched):
     - HP grows exactly as before for the first 10 minutes, then half as fast:
         10 min x7.3 (same) · 20 min x10.5 (was x13.6) · 30 min x13.6 (was x19.9)
     - Damage grows a little more after 15 minutes (x6.0 at 30 min instead of x5.3), so mistakes still hurt.
     - Speed is unchanged (still capped at +35%), so you can always outmaneuver regular enemies.
     - The extra challenge comes from formations instead: named waves arrive more often as the run goes on
       (every 80 s -> 65 s after 15 min -> 55 s after 25 min) and are bigger after 20 minutes.
   Bosses keep their own scaling. */
(() => {
  'use strict';
  if (window.PS_BALANCE_INSTALLED) return; window.PS_BALANCE_INSTALLED = true;
  const E = () => window.PS_HOOPA_ENGINE;
  const HP_KNEE = 600, HP_LATE = 190, DMG_FROM = 900, DMG_LATE = 1200;
  let done = false;
  function install() {
    const N = E(), En = N && N.Enemies; if (done || !En || typeof En.scale !== 'function') return; done = true;
    const orig = En.scale;
    En.scale = function (t) {
      const r = orig.call(this, t); if (!r || window.PS_ENCOUNTERS || (N.Maps && N.Maps.endless)) return r;
      const T = Number(t) || 0; const out = Object.assign({}, r);
      if (T > HP_KNEE) out.hp = 1 + HP_KNEE / 95 + (T - HP_KNEE) / HP_LATE;
      if (T > DMG_FROM) out.dmg = r.dmg + (T - DMG_FROM) / DMG_LATE;
      return out;
    };
    window.PS_BALANCE = { scale: En.scale, original: orig };
  }
  // waves come more often (and bigger) later in the run
  setInterval(() => {
    install();
    try { const W = window.PS_WAVES, t = E().Game.time, T = Number(typeof t === 'function' ? t() : t) || 0; if (!W) return;
      W.cfg.every = T >= 1500 ? 55 : T >= 900 ? 65 : 80; W.cfg.sizeMul = T >= 1200 ? 1.3 : 1; } catch (_) {}
  }, 500);
})();
