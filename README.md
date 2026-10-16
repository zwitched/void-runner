# Void Runner: The Lantern Chronicle
Original HTML5 pixel-art space shooter + platformer. Vanilla JS + Canvas, no external assets or network deps.
All sprites drawn in code; chiptune SFX/music via WebAudio. Progress saved in localStorage.
- Play: open `index.html` (or the single-file `dist/index.html`). Build single file: `python3 build.py`.
- Test: `python3 test_game.py` (Playwright, Pixel 7 emulation, touch events).
- Power-ups: `python3 test_powerups.py`. Temporary 12s weapon boosts drop from enemies (space: spread/rapid/laser/homing; foot: shotgun/rapid/plasma).
- Reachability: `python3 test_reach.py` (geometry vs jump physics, base suit, 75% margin).
- Aiming: `python3 test_aim.py` (keyboard + touch aim pad, power-ups, hits).
- Arena/boss failsafe: `python3 test_arena.py`.
