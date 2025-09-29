# Retro Arcade

Two browser-based retro mini-games built with HTML, CSS, and vanilla JavaScript. Fire up a local static server and pick your favorite nostalgic challenge.

## Retro Snake (`snake.html`)

A neon-styled take on the classic with modern conveniences:

- **Level selector** — swap between Classic, Turbo, and Insane speeds mid-run
- **Wall toggle** — choose wraparound arenas or unforgiving solid walls
- **Sound toggle** — Web Audio chimes for snacks and crashes
- **Touch controls** — on-screen D-pad appears automatically on touch devices
- **Per-mode highscores** — each level/wall combo tracks its own best score via `localStorage`

### Controls

- Arrow Keys / WASD to steer
- On-screen D-pad for taps and swipes
- `P` key or Pause button to pause/resume
- `Enter` to start or restart after a game over

## Retro Duck Hunt (`duck.html`)

Arcade-inspired duck shooting with chunky pixels and crunchy feedback:

- Randomized duck waves that weave across the sky
- Tap/click shooting with accuracy, hits, and misses tracked every round
- 60-second rounds scored by speed, precision, and duck speed bonuses
- Feather particle bursts and muzzle flashes for satisfying hits
- Keyboard (`Space`) or HUD button to launch a new round

### Controls

- Mouse or trackpad to aim, click to shoot
- `Space` or Start Round button to begin
- Shots and accuracy reset each round; ducks escaping add to misses

## Run locally

From the project root, launch a simple static server and open the game you want to play:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000/> to pick a game from the arcade hub.

Want quick links? Jump straight to <http://localhost:8000/snake.html> or <http://localhost:8000/duck.html>.

> **Tip:** Opening the files directly works in most browsers, but a local server avoids asset and audio policy restrictions.