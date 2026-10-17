# Void Runner: The Lantern Chronicle
Original HTML5 pixel-art space shooter + platformer. Vanilla JS + Canvas, no external assets or network deps.
All sprites drawn in code; chiptune SFX/music via WebAudio. Progress saved in localStorage.
- Play: open `index.html` (or the single-file `dist/index.html`). Build single file: `python3 build.py`.
- Test: `python3 test_game.py` (Playwright, Pixel 7 emulation, touch events).
- Power-ups: `python3 test_powerups.py`. Temporary 12s weapon boosts drop from enemies (space: spread/rapid/laser/homing; foot: shotgun/rapid/plasma).
- Reachability: `python3 test_reach.py` (geometry vs jump physics, base suit, 75% margin).
- Aiming: `python3 test_aim.py` (keyboard + touch aim pad, power-ups, hits).
- Arena/boss failsafe: `python3 test_arena.py`.
- Multi-touch: `python3 test_multitouch.py` (per-finger tracking, jump buffer/coyote).
- Palette separation: `python3 test_palette.py` (enemy shots red/magenta only; coins/pickups never).
- Hacking mode: `python3 test_hack.py` (rotation/kicks, collisions, clears, win/lose, gestures, keys, campaign).
- Evasion maze: `python3 test_evasion.py`.

## Graphics v2
Renders at 2x the 270x480 logical resolution (GFX: HIGH), or 1x on GFX: LOW (title or pause screen). Sprites are EPX-upscaled and shaded once at load. Includes a bitmap pixel font, speaker portraits, glow sprites, darkness lighting in station levels, parallax and foreground layers, and an optional CRT filter. `test_perf.py` reports per-frame CPU time in High and Low.

## Sprites v3
`sprites.js` holds all character, enemy, boss, pickup, coin, explosion, tile and hack-block art. Each sprite is
authored at 2 art pixels per logical pixel as small geometry functions, shaded at load with 6-step material
ramps, dither, seams, rim light and outlines. Hitboxes are unchanged and independent of art size.
`screenshots/v3_sprites.png` is a contact sheet of every frame.

## Melee duel (v9)
Chapter 19, SPIRE CORE: a side-view baton duel with the Hollow champion (the core's damping field kills guns).
Touch: `<` `>` move, ATTACK, PARRY (tap = parry, hold = block), DODGE. Keys: arrows/A D move, J/Z attack,
K/X/Down parry (hold to block), L/C/Shift/Up dodge. Yellow flash = parry it, red flash = dodge it. A parry staggers
the champion (ATTACK then lands a heavy finisher); its poise bar breaks into a stun. Three rounds with a checkpoint
at rounds 2 and 3. Tests: `python3 test_v9_duel.py` (controls, mechanics, save v8->v9 remap, autopilot fairness).

## Survey Dock easing (v9.1)
Per-difficulty table `TE` in features.js (door hull, patch per wave, crawler count/spacing/speed, enemy shot rate/speed,
aim assist cone, repair time) plus a checkpoint when the Breacher arrives. `python3 test_v9_turret_eased.py` runs
good/average/sloppy/idle bots (`turret_bots.js`) on every difficulty.

## Breacher fix (v9.2)
After FENN calls "BIG ONE ON THE RIGHT" in Survey Dock, the Breacher used to hover about 15 px above the deck, keep walking in place once it reached the door, and never show a bash. Its art was also built on the spawn frame, so the screen hitched right as the callout appeared. In New Game+ it asked for a fourth brute palette that doesn't exist and threw every frame, which wiped the rest of the scene (turret, HUD). Now its feet sit on the deck, the walk cycle follows the distance it covers, it shows bash frames at the door, the art is built when the mission starts, and the palette index is clamped. `test_v9_breacher.py` covers High/Low GFX, Easy/Normal, a checkpoint retry and NG+.
