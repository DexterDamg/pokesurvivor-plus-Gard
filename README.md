# PokéSurvivor Merged

Extract the whole ZIP and double-click **Start Game.cmd** on Windows. Keep its window open while playing.

See [MERGE-NOTES.md](MERGE-NOTES.md) for merged features and setup, and [TEST-RESULTS.md](TEST-RESULTS.md) for verification and limits.

## Where the code lives (one file to swap)

- **js/game.js**: every game module in one file (Lake Trio, Hoopa, gacha, waves, terrain, music...). Each module is a clearly marked `MODULE: name.js` block, in load order. To update the game, replace this one file.
- **js/app.min.js**: the base PokéSurvivor engine (minified, kept separate so game.js stays readable).
- **css/game.css**: all styles in one file (main styles + the BW2 summon theme).
- **config.js**: Firebase/server settings.

Want separate files again to edit one module? With Node.js installed:

```
node tools/bundle.cjs list     # show the modules inside js/game.js
node tools/bundle.cjs split    # js/game.js -> modules/NN-name.js
node tools/bundle.cjs join     # modules/ -> js/game.js (and refreshes the cache version in index.html)
```

`js/dens.js` and `css/pages.css` are not loaded by the game; they were left untouched for reference.

---

## Original project information

# PokéSurvivor+

A modded version of [PokéSurvivor](https://github.com/JPTER78/pokesurvivor) by JPTER78: a free, non-profit Pokémon survival fan game that runs in your browser.

**Play:** https://intox2b20.github.io/pokesurvivor-plus/

By default this public version runs without any server: your progress is saved in your browser (no online accounts, friends, co-op or leaderboard).

**Want to play with your friends?** Make your own copy and give it **your own free server** (accounts, friends, co-op, leaderboard) on Firebase: see **[SERVER_SETUP.md](SERVER_SETUP.md)** (beginner-friendly, about 30-45 minutes, no coding).

New in this version: power crystals and random events (Jigglypuff, egg, Jirachi), golden rifts, fixed rift/boss schedule, Z-Moves, TMs, new items, League of Legends–style HUD, targeting options, Traditional Chinese, and more. See "What's new" in the game.

Fan project, not affiliated with Nintendo, Creatures, GAME FREAK or The Pokémon Company. Sprites: PMD SpriteCollab (CC BY-NC 4.0). Code: MIT (see LICENSE). Full credits in CREDITS.md.
