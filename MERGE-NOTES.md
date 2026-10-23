# PokéSurvivor Merged

## Play on Windows

Extract the entire ZIP, then double-click **Start Game.cmd**. Keep its server window open while playing. The launcher uses Windows PowerShell and opens http://127.0.0.1:8765/ in your browser. No build or package installation is needed. Close an earlier launcher before starting another copy. Opening index.html directly is unsupported because several game assets are loaded using browser requests.

The Firebase configuration supplied in both originals is preserved. Online accounts and co-op depend on that existing service and its rules. Guest mode follows the original behavior: guest progress is not saved. To use your own server, follow SERVER_SETUP.md. Back up/export existing progress from the original game before moving it to a different web address; browser saves belong to their original address.

## Combined features

World supplies the newer game engine, trainer roster, sizes, first-stage partner rules, evolution upgrades, bonds, wild evolution, encounter progression, Act balance, co-op modes, Mega/Primal synchronization and music rules.

Dexter supplies Lake Guardian companions and dialogue, Creation Rift, Giratina's Void, Digger Brothers and Kamina moves, wildlife activities and allies, player voices, lore events, Birth Island, portraits and developer tools. Both summon-screen appearances are available through the **Style** button, sharing one reward system.

## Integration repairs

- Restored missing modules referenced by World's entry point and loaded the omitted Digger/Kamina modules in dependency order.
- Separated wildlife and wild-spawning interfaces so neither overwrites the other. Updated encounters and evolution callers accordingly.
- Prevented personality movement from taking control of harmless actors, brawling enemies or enemies considering recruitment.
- Preserved Birth Island's Deoxys exclusivity and kept ordinary spawns/pressure out of special arenas and Birth Island.
- Replaced competing summon-screen logic with a theme switch. Corrected its asset paths and retained visible collection and odds information.
- Fixed batch summon collection/refund reconciliation and corrected the extra shiny probability to target 1.5% where shiny sprites exist.
- Corrected Pokédex acquisition descriptions, synchronized duplicate engine files, and removed the obsolete alternative HTML entry point.
- Replaced references to absent optional Primal Reversion recordings with the engine's existing sound effect; the supplied Primal cries remain.
- Added the missing service worker with no asset caching, preventing stale mixed builds.

Original credits, licenses and server configuration files are retained. Source documentation is historical context and does not replace these launch instructions.

## Verification

See TEST-RESULTS.md for completed checks and their limits. No finite test pass guarantees that every encounter or multiplayer combination is bug-free.

With Node.js installed, repeat the automated checks:

```
node tests/tests.cjs
```

All game modules are now consolidated in js/game.js (see README.md); all tests live in one file, tests/tests.cjs, and read each module straight out of js/game.js. Add a word to run only some of them, e.g. `node tests/tests.cjs gacha`.
