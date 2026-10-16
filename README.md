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
