/* PLAYER VOICE — whoever you play as talks too, in its own generated voice (js/wild-voice.js).
   Your Pokemon has a Nature (the same one every run for that species), and it speaks up about what happens:
   starting a run, big hits, low HP, level-ups, a boss or a legendary showing up (a rival legendary gets its own
   line: play Mew against Mewtwo, Kyogre against Groudon, Dialga against Palkia...), beating them, knocking out a
   harmless Pokemon by accident (each Nature takes it differently), wild Pokemon greeting or taunting you, brawls,
   new allies and fallen ones, little habitat scenes, shinies, stepping into a boss rift, kill milestones.
   It also ANSWERS the Pokemon around it: wild greetings, the harmless ones you hurt, taunts, legendary intros.
   The Lake Guardians, Kamina and Simon keep their own scripted lines (js/lake-talk.js, js/digger-bros.js) and only
   add these replies, with a Nature that fits them. Lines show in the talk box with your own portrait. */
(() => {
  'use strict';
  if (window.PS_PLAYER_VOICE_INSTALLED) return; window.PS_PLAYER_VOICE_INSTALLED = true;
  const E = () => window.PS_HOOPA_ENGINE, T = () => window.PS_LAKE_TALK, V = () => window.PS_VOICE;
  const SCRIPTED = { 480: 'Calm', 481: 'Jolly', 482: 'Hasty', 530: 'Brave', 529: 'Bashful' };   // their own personalities, for the replies
  const CFG = { idle: [80, 120], replyMeet: 0.4, replyHurt: 0.5, killHarmless: 0.35, replyTaunt: 0.3, feud: 0.3, scene: 0.6, shiny: 0.3, arena: 0.6, kills: 100 };
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clock = () => performance.now() / 1000;
  const me = () => { const p = E()?.Game?.player; return p && !p.remote && !p.dead ? p : null; };
  const scripted = p => !!SCRIPTED[Number(p.dex)];
  const legendary = e => !!e && (e.legend || e.arceus || ((E().DEX_BY[Number(e.dex)] || {}).rarity >= 5));
  function nature(p) { const d = Number(p.dex); if (SCRIPTED[d]) { if (d === 529 && window.PS_DIGGER?.simon) return 'Adamant'; return SCRIPTED[d]; } return null; }
  let lastSaid = -1e9;
  function talk(sit, o) {
    o = o || {}; const p = me(), v = V(), t = T(); if (!p || !v || !t) return false;
    if (window.PS_BIRTH_ISLAND?.active) return false;
    const now = clock(); if (!o.prio && now - lastSaid < 6) return false;
    const n = nature(p); if (n) p.__nature = n; if (p.__voice && n && p.__voice.nature !== n) p.__voice = null;
    const l = o.text ? [o.face || 'determined', o.text, o.em || 'exclaim'] : v.line(p, sit, o);
    const w = v.who(p), name = ((p.mon && p.mon.name) || w.name) + ' · ' + w.nature;
    const ok = t.line(Number(p.dex), l[0], l[1], l[2], { prio: !!o.prio, follow: !!o.follow, delay: o.delay || 0, name, color: '#ffe680', kind: 'player', obj: p, shiny: !!p.shiny });
    if (ok) lastSaid = now; return ok;
  }
  // ---- answering the Pokemon around you
  let killed = 0, harmlessKills = 0;
  addEventListener('ps-wild', ev => {
    const d = ev.detail || {}, p = me(); if (!p || !V()) return; const r = Math.random();
    switch (d.type) {
      case 'meet': if (r < CFG.replyMeet) talk('p_replyMeet', { follow: true, delay: 0.4 }); break;
      case 'hurtHarmless': if (r < CFG.replyHurt) talk('p_replyHurt', { follow: true, delay: 0.3 }); break;
      case 'killHarmless': harmlessKills++; if (harmlessKills === 1 || r < CFG.killHarmless) talk('p_killHarmless', { prio: true, delay: 1 }); break;
      case 'taunt': if (r < CFG.replyTaunt) talk('p_replyTaunt', { follow: true, delay: 0.3 }); break;
      case 'feud': if (r < CFG.feud) talk('p_feud', { delay: 1.2 }); break;
      case 'allyJoin': talk('p_allyJoin', { prio: true, delay: 0.8 }); break;
      case 'allyFaint': talk('p_allyFaint', { prio: true, delay: 0.4 }); break;
      case 'scene': if (r < CFG.scene) talk('p_scene', { delay: 0.6 }); break;
      case 'shiny': if (r < CFG.shiny) talk('p_shiny'); break;
      case 'area': if (d.area === 'arena' && r < CFG.arena) talk('p_arena', { prio: true, delay: 0.5 }); break;
      case 'legend': { const e = d.e, rl = V().rivalLine(Number(p.dex), Number(e.dex));   // you meet a legendary (or a boss)
        if (rl) talk(null, { prio: true, delay: 0.6, text: rl, face: 'angry', em: 'anger' }); else talk(legendary(e) ? 'p_legend' : 'p_boss', { prio: true, delay: 0.6 }); break; }
      case 'legendDown': talk(legendary(d.e) ? 'p_replyLegendDown' : 'p_bossDown', { prio: true, delay: 1 }); break;
      case 'kill': killed++; if (killed % CFG.kills === 0) talk('p_kills', { n: killed }); break;
    }
  });
  // ---- things it says on its own (the scripted companions already have their own lines for these)
  let runP = null, idleT = 0, lastHp = 0, low = false, lvl = 0, bigCd = 0, started = false;
  function watch(dt) {
    const p = me(), g = E()?.Game; if (!p || !g || g.state !== 'playing') return;
    if (p !== runP) { runP = p; idleT = rnd(...CFG.idle); lastHp = p.hp; low = false; lvl = Number(p.level) || 1; started = false; killed = 0; harmlessKills = 0; }
    if (scripted(p)) { lastHp = p.hp; lvl = Number(p.level) || 1; return; }
    if (!started && (g.st?.time ?? 99) > 3) { started = true; talk('p_start', { prio: true }); }
    bigCd -= dt; if (lastHp - p.hp > p.maxHp * 0.22 && bigCd <= 0) { bigCd = 20; talk('p_hurtBig', { prio: true }); }
    const f = p.hp / p.maxHp; if (!low && f < 0.3) { low = true; talk('p_low', { prio: true }); } if (low && f > 0.6) low = false; lastHp = p.hp;
    const lv = Number(p.level) || 1; if (lv > lvl) { lvl = lv; if (Math.random() < 0.35) talk('p_level'); }
    if ((idleT -= dt) <= 0) { idleT = rnd(...CFG.idle); const calm = !E().EnemyMgr.all().some(e => e && !e.dead && !e.__role && Math.hypot(e.x - p.x, e.y - p.y) < 160); if (calm) talk('p_idle'); }
  }
  let last = performance.now();
  (function loop(now) { requestAnimationFrame(loop); const dt = Math.min(0.1, (now - last) / 1000); last = now; try { watch(dt); } catch (e) { console.warn('[player-voice]', e); } })(performance.now());
  window.PS_PLAYER_VOICE = { cfg: CFG, say: talk };
})();
